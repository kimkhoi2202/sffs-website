"""
SFFS test completions -> PostHog Data Warehouse export.

Sibling of `sffs-email-dw-export`, same shape: read Aurora via the RDS Data API
(no public DB access), write an NDJSON snapshot to S3 for durability/audit, then
PUSH that snapshot into PostHog's Data Warehouse as a STANDALONE self-managed
table named `test_results`. PostHog holds no AWS credentials; it holds only the
table definition.

WHAT COUNTS AS A COMPLETION (the filter lives here, not in the dashboard)
------------------------------------------------------------------------
Contaminated rows are dropped at export so nothing downstream can surface them
by forgetting a WHERE clause. A row is exported only when ALL hold:

  meta->>'synthetic' IS NULL     no machine took this test
  meta->>'internal'  IS NULL     no one of ours took this test
  meta->>'stage' = 'completed'   the canonical row, not its emailed twin
  answered > 0                   a test nobody answered is not a completion

Both markers are JSONB booleans written only when true, so ABSENT MEANS COUNTED.
They stay distinct and are both tested: `synthetic` means a machine took the
test, `internal` means a real human took it but one of ours. They are not
interchangeable, and collapsing them into one check -- or reaching for whichever
makes a number come out right -- is exactly what the split exists to prevent.

The exclusions key on markers written onto the Aurora row itself rather than
reconstructing the classification here. That is deliberate: the same predicate
holds for anyone querying Aurora directly, and rows that never fired a
client-side event and never captured an email are invisible to event-join based
classification but still carry the marker.

`stage` is pinned positively to 'completed' rather than negated away from
'emailed'. Both rows of an excluded pair are marked, but a future third stage
value would silently leak into the count under a negated test.

THE TWO-STAGE WRITE
-------------------
Finishing a test writes a `stage=completed` row with no email. If the taker then
submits their address, the site writes a SECOND row, `stage=emailed`, carrying
the same test payload plus the address. Counting both doubles every completion,
so `completed` is the canonical row and the address is merged in from its
`emailed` sibling. The sibling is matched on the completion identity below; its
`completed_at` is the same instant truncated to the second.

Anonymous completions are exported with email = null. They are real completions
and the totals do not reconcile without them.

PLATFORM ATTRIBUTION
--------------------
Aurora does not record acquisition channel, so it is enriched from PostHog's own
`test_completed` events, preferring utm_source and falling back to the referring
domain (the site's own `platform` property mislabels app/organic Reddit traffic
as "other", so it is not used). Last resort is the utm_source on the matching
`email_signups.meta.referrer` in Aurora. If the enrichment query fails the export
ABORTS rather than publishing a snapshot with attribution silently blanked --
a stale table is recoverable, a quietly wrong one is not.

REPLACE SEMANTICS
-----------------
Full-snapshot replace, no history: deleting or marking a row in Aurora removes it
from PostHog on the next run, which is what makes the exclusions propagate and
what the privacy policy relies on. An empty snapshot is refused -- PostHog cannot
hold a zero-row uploaded table, and an empty source almost always means a broken
read rather than a genuinely empty table.
"""

import hashlib
import json
import os
import urllib.error
import urllib.request
import uuid

import boto3

CLUSTER_ARN = os.environ["CLUSTER_ARN"]
SECRET_ARN = os.environ["SECRET_ARN"]
DB_NAME = os.environ.get("DB_NAME", "sffs")

S3_BUCKET = os.environ["S3_BUCKET"]
S3_PREFIX = os.environ.get("S3_PREFIX", "posthog-dw/test_results").strip("/")

POSTHOG_HOST = os.environ.get("POSTHOG_HOST", "https://us.posthog.com").rstrip("/")
POSTHOG_PROJECT_ID = os.environ["POSTHOG_PROJECT_ID"]
POSTHOG_API_KEY = os.environ["POSTHOG_API_KEY"]

TABLE_NAME = os.environ.get("TABLE_NAME", "test_results")
# Kept well under the RDS Data API ~1 MiB result cap; the table is small today.
PAGE_SIZE = int(os.environ.get("PAGE_SIZE", "500"))
# How far back to pull completion events for attribution.
ATTRIBUTION_DAYS = int(os.environ.get("ATTRIBUTION_DAYS", "365"))
# Aurora completed_at and the PostHog event timestamp are written by different
# clocks on the same interaction; they land within a second or two.
MATCH_TOLERANCE_S = int(os.environ.get("MATCH_TOLERANCE_S", "5"))

SNAPSHOT_KEY = f"{S3_PREFIX}/{TABLE_NAME}.jsonl"
MARKER_KEY = f"{S3_PREFIX}/_last_hash.txt"
WH_BASE = f"{POSTHOG_HOST}/api/projects/{POSTHOG_PROJECT_ID}/warehouse_tables"
QUERY_URL = f"{POSTHOG_HOST}/api/projects/{POSTHOG_PROJECT_ID}/query/"

rds = boto3.client("rds-data")
s3 = boto3.client("s3")


# --- Aurora (RDS Data API) -------------------------------------------------

def _field(value):
    """Unwrap one RDS Data API field to a Python scalar or None."""
    if value.get("isNull"):
        return None
    for k in ("stringValue", "longValue", "booleanValue", "doubleValue"):
        if k in value:
            return value[k]
    return None


# `completed` is the canonical row; `emailed` is the same test re-written with an
# address. Both sides are filtered on the durable markers so an address belonging
# to an excluded row can never be merged onto a kept one.
COMPLETIONS_SQL = """
WITH real AS (
    SELECT id, test_type, grade, grade_band, score, max_score, duration_secs,
           verdict, email, created_at, meta,
           coalesce(meta->>'stage', '')                        AS stage,
           coalesce((meta->>'answered')::int, 0)               AS answered,
           date_trunc('second', (meta->>'completed_at')::timestamptz) AS ck
    FROM public.test_results
    WHERE meta->>'synthetic' IS NULL
      AND meta->>'internal'  IS NULL
),
completions AS (
    SELECT DISTINCT ON (ck, test_type, coalesce(grade_band,''), score, max_score, answered) *
    FROM real
    WHERE stage = 'completed' AND answered > 0
    ORDER BY ck, test_type, coalesce(grade_band,''), score, max_score, answered, id
),
addresses AS (
    SELECT DISTINCT ON (ck, test_type, coalesce(grade_band,''), score, max_score, answered)
           ck, test_type, grade_band, score, max_score, answered, email
    FROM real
    WHERE stage = 'emailed' AND email IS NOT NULL AND email <> ''
    ORDER BY ck, test_type, coalesce(grade_band,''), score, max_score, answered, created_at
)
SELECT c.id::text,
       c.test_type,
       c.grade_band,
       c.grade,
       c.score,
       c.max_score,
       c.answered,
       c.duration_secs,
       c.verdict,
       (c.meta->>'timed_out')::boolean,
       to_char(c.ck AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
       a.email
FROM completions c
LEFT JOIN addresses a
       ON a.ck = c.ck
      AND a.test_type = c.test_type
      AND coalesce(a.grade_band,'') = coalesce(c.grade_band,'')
      AND a.score = c.score
      AND a.max_score = c.max_score
      AND a.answered = c.answered
ORDER BY c.ck, c.id
LIMIT {limit} OFFSET {offset}
"""

# What the filter threw away, and why. Logged every run so drift in the exclusion
# machinery is visible. Deliberately NOT asserted on: the number of real
# completions is a fact about the world and climbs whenever someone finishes a
# test, so a hard equality check here would go red on success.
CENSUS_SQL = """
SELECT count(*),
       count(*) FILTER (WHERE meta->>'synthetic' IS NOT NULL),
       count(*) FILTER (WHERE meta->>'internal'  IS NOT NULL),
       count(*) FILTER (WHERE meta->>'synthetic' IS NOT NULL
                          AND meta->>'internal'  IS NOT NULL),
       count(*) FILTER (WHERE meta->>'stage' <> 'completed'),
       count(*) FILTER (WHERE coalesce((meta->>'answered')::int, 0) = 0)
FROM public.test_results
"""

# Acquisition channel of last resort: the utm the address originally arrived on.
SIGNUP_UTM_SQL = """
SELECT lower(email),
       lower(split_part(split_part(meta->>'referrer', 'utm_source=', 2), '&', 1))
FROM public.email_signups
WHERE email IS NOT NULL
  AND meta->>'referrer' LIKE '%utm_source=%'
"""


def _run(sql):
    resp = rds.execute_statement(
        resourceArn=CLUSTER_ARN, secretArn=SECRET_ARN, database=DB_NAME, sql=sql
    )
    return resp.get("records", [])


def fetch_completions():
    """Return the filtered, de-duplicated completion snapshot as a list of dicts."""
    rows = []
    offset = 0
    while True:
        records = _run(COMPLETIONS_SQL.format(limit=PAGE_SIZE, offset=offset))
        for r in records:
            rows.append(
                {
                    "id": _field(r[0]),
                    "test_type": _field(r[1]),
                    "grade_band": _field(r[2]),
                    "grade": _field(r[3]),
                    "score": _field(r[4]),
                    "max_score": _field(r[5]),
                    "answered": _field(r[6]),
                    "duration_secs": _field(r[7]),
                    "verdict": _field(r[8]),
                    "timed_out": _field(r[9]),
                    "completed_at": _field(r[10]),
                    "email": _field(r[11]),
                }
            )
        if len(records) < PAGE_SIZE:
            break
        offset += PAGE_SIZE
    return rows


def fetch_census():
    """Row counts by exclusion reason. Reasons overlap; this is a census, not a partition."""
    total, synthetic, internal, both, not_completed, unanswered = (
        _field(f) for f in _run(CENSUS_SQL)[0]
    )
    return {
        "aurora_rows": total,
        "synthetic": synthetic,
        "internal": internal,
        "carrying_both": both,
        "not_stage_completed": not_completed,
        "answered_zero": unanswered,
    }


def fetch_signup_utm():
    return {
        _field(r[0]): _field(r[1])
        for r in _run(SIGNUP_UTM_SQL)
        if _field(r[0]) and _field(r[1])
    }


# --- HTTP helper -----------------------------------------------------------

def _http(method, url, *, data=None, content_type=None):
    headers = {"Authorization": f"Bearer {POSTHOG_API_KEY}"}
    if content_type:
        headers["Content-Type"] = content_type
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            return resp.status, resp.read()
    except urllib.error.HTTPError as e:
        body = e.read()
        # Never surface the Authorization header; body is PostHog's error JSON.
        raise RuntimeError(f"PostHog {method} {url.split('?')[0]} -> {e.code}: {body[:500]!r}")


# --- Attribution -----------------------------------------------------------

ATTRIBUTION_HOGQL = """
SELECT toUnixTimestamp(timestamp),
       properties.test_id,
       properties.score,
       properties.max_score,
       properties.answered,
       properties.utm_source,
       properties.$referring_domain
FROM events
WHERE event = 'test_completed'
  AND timestamp > now() - INTERVAL {days} DAY
ORDER BY timestamp
"""


def _channel(*values):
    """Normalise any attribution hint to a platform we report on."""
    for v in values:
        v = (v or "").lower()
        if "reddit" in v:
            return "reddit"
        if "instagram" in v:
            return "instagram"
    return None


def fetch_attribution():
    """(test_id, score, max_score, answered) -> list of (epoch, channel, domain)."""
    payload = json.dumps(
        {"query": {"kind": "HogQLQuery", "query": ATTRIBUTION_HOGQL.format(days=ATTRIBUTION_DAYS)}}
    ).encode()
    _, body = _http("POST", QUERY_URL, data=payload, content_type="application/json")
    index = {}
    for ts, test_id, score, max_score, answered, utm, domain in json.loads(body)["results"]:
        if None in (test_id, score, max_score, answered):
            continue
        # Event properties arrive as JSON numbers (4.0), Aurora stores ints.
        key = (test_id, int(float(score)), int(float(max_score)), int(float(answered)))
        index.setdefault(key, []).append((int(ts), _channel(utm, domain), domain))
    return index


def _event_key(row):
    """The Aurora row's identity in PostHog event terms."""
    test_id = "adult" if row["test_type"] == "adult" else f"grade-{row['grade_band']}"
    return (test_id, row["score"], row["max_score"], row["answered"])


def _epoch(iso_z):
    import calendar
    import time

    return calendar.timegm(time.strptime(iso_z, "%Y-%m-%dT%H:%M:%SZ"))


def enrich(rows, attribution, signup_utm):
    for row in rows:
        want = _epoch(row["completed_at"])
        channel, domain = None, None
        for ts, ch, dom in attribution.get(_event_key(row), []):
            if abs(ts - want) <= MATCH_TOLERANCE_S:
                channel, domain = ch, dom
                break
        if channel is None and row["email"]:
            channel = _channel(signup_utm.get(row["email"].lower()))
        row["platform"] = channel
        row["referrer_domain"] = domain
    return rows


# --- Serialisation ---------------------------------------------------------

def build_ndjson(rows):
    lines = [json.dumps(r, ensure_ascii=False, separators=(",", ":")) for r in rows]
    return ("\n".join(lines) + "\n").encode("utf-8")


# --- PostHog warehouse_tables ---------------------------------------------

def ph_list_tables(name):
    _, body = _http("GET", f"{WH_BASE}/?search={name}&limit=100")
    results = json.loads(body).get("results", [])
    return [r["id"] for r in results if r.get("name") == name and not r.get("deleted")]


def ph_delete_table(table_id):
    _http("DELETE", f"{WH_BASE}/{table_id}/")


def ph_upload_file(ndjson_bytes, filename):
    boundary = "----sffsdw" + uuid.uuid4().hex
    parts = [
        f"--{boundary}\r\n".encode(),
        b'Content-Disposition: form-data; name="file_format"\r\n\r\njson\r\n',
        f"--{boundary}\r\n".encode(),
        (
            'Content-Disposition: form-data; name="file"; '
            f'filename="{filename}"\r\n'
            "Content-Type: application/json\r\n\r\n"
        ).encode(),
        ndjson_bytes,
        f"\r\n--{boundary}--\r\n".encode(),
    ]
    _, resp = _http(
        "POST",
        f"{WH_BASE}/upload_file/",
        data=b"".join(parts),
        content_type=f"multipart/form-data; boundary={boundary}",
    )
    return json.loads(resp)


def ph_create_from_upload(upload, table_name):
    payload = json.dumps(
        {
            "upload_id": upload["upload_id"],
            "filename": upload["filename"],
            "file_format": upload["file_format"],
            "table_name": table_name,
        }
    ).encode()
    _, resp = _http("POST", f"{WH_BASE}/create_from_upload/", data=payload,
                    content_type="application/json")
    return json.loads(resp)


# --- S3 --------------------------------------------------------------------

def s3_put(key, data, content_type):
    s3.put_object(Bucket=S3_BUCKET, Key=key, Body=data, ContentType=content_type)


def s3_get_text(key):
    try:
        return s3.get_object(Bucket=S3_BUCKET, Key=key)["Body"].read().decode("utf-8").strip()
    except Exception:
        return None


# --- Handler ---------------------------------------------------------------

def handler(event, context):
    census = fetch_census()
    print(f"exclusion census: {census}")
    if census["carrying_both"]:
        # Not fatal, but the two markers mean different things and a row claiming
        # both means someone classified the same test as machine and human.
        print(f"WARNING: {census['carrying_both']} row(s) carry both markers")

    rows = fetch_completions()
    n = len(rows)
    if n == 0:
        print("no qualifying completions; leaving existing warehouse table untouched.")
        return {"status": "empty", "rows": 0}

    rows = enrich(rows, fetch_attribution(), fetch_signup_utm())

    ndjson = build_ndjson(rows)
    digest = hashlib.sha256(ndjson).hexdigest()
    breakdown = {
        "adult": sum(1 for r in rows if r["test_type"] == "adult"),
        "child": sum(1 for r in rows if r["test_type"] == "child"),
        "with_email": sum(1 for r in rows if r["email"]),
        "reddit": sum(1 for r in rows if r["platform"] == "reddit"),
        "instagram": sum(1 for r in rows if r["platform"] == "instagram"),
        "unattributed": sum(1 for r in rows if not r["platform"]),
    }
    print(f"completions={n} {breakdown} bytes={len(ndjson)} sha256={digest[:12]}")

    # Always keep the canonical snapshot in S3 (durability / audit / future reuse).
    s3_put(SNAPSHOT_KEY, ndjson, "application/x-ndjson")

    existing = ph_list_tables(TABLE_NAME)
    if digest == s3_get_text(MARKER_KEY) and len(existing) == 1:
        print(f"unchanged since last run (table_id={existing[0]}); skipping PostHog refresh.")
        return {"status": "unchanged", "rows": n, "table_id": existing[0]}

    upload = ph_upload_file(ndjson, f"{TABLE_NAME}.json")
    for tid in existing:
        ph_delete_table(tid)
        print(f"deleted previous warehouse table {tid}")
    table = ph_create_from_upload(upload, TABLE_NAME)
    s3_put(MARKER_KEY, digest.encode(), "text/plain")
    print(f"created standalone warehouse table name={table.get('name')} id={table.get('id')}")
    return {"status": "refreshed", "rows": n, "table_id": table.get("id"), **breakdown}

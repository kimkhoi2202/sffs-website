"""
SFFS email waitlist -> PostHog Data Warehouse export.

Reads the FULL `public.email_signups` table from the PRIVATE Aurora Serverless v2
cluster via the RDS Data API (no public DB access), writes an NDJSON snapshot to
S3 for durability/audit, and PUSHES that snapshot into PostHog's Data Warehouse
as a STANDALONE self-managed table named `email_signups`.

Why push (upload) instead of PostHog pulling from S3:
  PostHog's "link S3 as a source" requires an IAM user's access key + secret, and
  this account's permissions boundary (InternSandboxBoundary) denies iam:CreateUser.
  The warehouse_tables upload API needs NO AWS credentials on the PostHog side
  ("reads fall back to the node role, never a user-supplied key"), so Aurora stays
  private and PostHog holds no keys into our account.

PRIVACY: this creates ONLY a standalone warehouse table. It does not touch
PostHog persons/events, sends no identify calls, and creates no join. The emails
are queryable in the warehouse but never attached to behavioral data.

The uploaded table is read-in-place by PostHog (no sync pipeline), so replacing
it each run keeps the queryable data current. To refresh we upload the new file,
delete the old table, and create the table again under the same name. A content
hash short-circuits the PostHog churn when the waitlist hasn't changed.
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
S3_PREFIX = os.environ.get("S3_PREFIX", "posthog-dw/email_signups").strip("/")

POSTHOG_HOST = os.environ.get("POSTHOG_HOST", "https://us.posthog.com").rstrip("/")
POSTHOG_PROJECT_ID = os.environ["POSTHOG_PROJECT_ID"]
POSTHOG_API_KEY = os.environ["POSTHOG_API_KEY"]

TABLE_NAME = os.environ.get("TABLE_NAME", "email_signups")
# Kept well under the RDS Data API ~1 MiB result cap; the table is tiny today.
PAGE_SIZE = int(os.environ.get("PAGE_SIZE", "500"))

SNAPSHOT_KEY = f"{S3_PREFIX}/{TABLE_NAME}.jsonl"
MARKER_KEY = f"{S3_PREFIX}/_last_hash.txt"
WH_BASE = f"{POSTHOG_HOST}/api/projects/{POSTHOG_PROJECT_ID}/warehouse_tables"

rds = boto3.client("rds-data")
s3 = boto3.client("s3")


# --- Aurora (RDS Data API) -------------------------------------------------

def _field(value):
    """Unwrap one RDS Data API field to a Python str or None."""
    if value.get("isNull"):
        return None
    if "stringValue" in value:
        return value["stringValue"]
    if "longValue" in value:
        return value["longValue"]
    return None


def fetch_rows():
    """Return the full email_signups snapshot as a list of dicts (ordered)."""
    rows = []
    offset = 0
    while True:
        sql = (
            "SELECT id::text, email, "
            "to_char(created_at AT TIME ZONE 'UTC','YYYY-MM-DD\"T\"HH24:MI:SS.US\"Z\"'), "
            "source, meta::text "
            "FROM public.email_signups "
            f"ORDER BY created_at, id LIMIT {PAGE_SIZE} OFFSET {offset}"
        )
        resp = rds.execute_statement(
            resourceArn=CLUSTER_ARN, secretArn=SECRET_ARN, database=DB_NAME, sql=sql
        )
        records = resp.get("records", [])
        for rec in records:
            rows.append(
                {
                    "id": _field(rec[0]),
                    "email": _field(rec[1]),
                    "created_at": _field(rec[2]),
                    "source": _field(rec[3]),
                    "meta": _field(rec[4]),
                }
            )
        if len(records) < PAGE_SIZE:
            break
        offset += PAGE_SIZE
    return rows


def build_ndjson(rows):
    lines = [
        json.dumps(r, ensure_ascii=False, separators=(",", ":")) for r in rows
    ]
    return ("\n".join(lines) + "\n").encode("utf-8")


# --- HTTP helper -----------------------------------------------------------

def _http(method, url, *, data=None, content_type=None):
    headers = {"Authorization": f"Bearer {POSTHOG_API_KEY}"}
    if content_type:
        headers["Content-Type"] = content_type
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            body = resp.read()
            return resp.status, body
    except urllib.error.HTTPError as e:
        body = e.read()
        # Never surface the Authorization header; body is PostHog's error JSON.
        raise RuntimeError(f"PostHog {method} {url.split('?')[0]} -> {e.code}: {body[:500]!r}")


# --- PostHog warehouse_tables ---------------------------------------------

def ph_list_tables(name):
    status, body = _http("GET", f"{WH_BASE}/?search={name}&limit=100")
    results = json.loads(body).get("results", [])
    return [r["id"] for r in results if r.get("name") == name and not r.get("deleted")]


def ph_delete_table(table_id):
    _http("DELETE", f"{WH_BASE}/{table_id}/")


def ph_upload_file(ndjson_bytes, filename):
    boundary = "----sffsdw" + uuid.uuid4().hex
    parts = []
    parts.append(f"--{boundary}\r\n".encode())
    parts.append(b'Content-Disposition: form-data; name="file_format"\r\n\r\njson\r\n')
    parts.append(f"--{boundary}\r\n".encode())
    parts.append(
        (
            'Content-Disposition: form-data; name="file"; '
            f'filename="{filename}"\r\n'
            "Content-Type: application/json\r\n\r\n"
        ).encode()
    )
    parts.append(ndjson_bytes)
    parts.append(f"\r\n--{boundary}--\r\n".encode())
    body = b"".join(parts)
    status, resp = _http(
        "POST",
        f"{WH_BASE}/upload_file/",
        data=body,
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
    status, resp = _http(
        "POST", f"{WH_BASE}/create_from_upload/", data=payload, content_type="application/json"
    )
    return json.loads(resp)


# --- S3 --------------------------------------------------------------------

def s3_put(key, data, content_type):
    s3.put_object(Bucket=S3_BUCKET, Key=key, Body=data, ContentType=content_type)


def s3_get_text(key):
    try:
        obj = s3.get_object(Bucket=S3_BUCKET, Key=key)
        return obj["Body"].read().decode("utf-8").strip()
    except s3.exceptions.NoSuchKey:
        return None
    except Exception:
        return None


# --- Handler ---------------------------------------------------------------

def handler(event, context):
    rows = fetch_rows()
    n = len(rows)
    if n == 0:
        print("email_signups is empty; leaving existing warehouse table untouched.")
        return {"status": "empty", "rows": 0}

    ndjson = build_ndjson(rows)
    digest = hashlib.sha256(ndjson).hexdigest()
    print(f"fetched rows={n} snapshot_bytes={len(ndjson)} sha256={digest[:12]}")

    # Always keep the canonical snapshot in S3 (durability / audit / future reuse).
    s3_put(SNAPSHOT_KEY, ndjson, "application/x-ndjson")

    existing = ph_list_tables(TABLE_NAME)
    last = s3_get_text(MARKER_KEY)
    if digest == last and len(existing) == 1:
        print(f"unchanged since last run (table_id={existing[0]}); skipping PostHog refresh.")
        return {"status": "unchanged", "rows": n, "table_id": existing[0]}

    upload = ph_upload_file(ndjson, f"{TABLE_NAME}.json")
    for tid in existing:
        ph_delete_table(tid)
        print(f"deleted previous warehouse table {tid}")
    table = ph_create_from_upload(upload, TABLE_NAME)
    s3_put(MARKER_KEY, digest.encode(), "text/plain")
    print(f"created standalone warehouse table name={table.get('name')} id={table.get('id')} format={table.get('format')}")
    return {"status": "refreshed", "rows": n, "table_id": table.get("id")}

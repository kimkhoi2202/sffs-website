"""
SFFS write proxy (email signups + attribution survey).

Vercel routes call this Lambda over HTTPS (API Gateway) with a random shared
secret. The Lambda writes to Aurora (schema `sffs`) via the RDS Data API, so ALL
AWS credentials stay on the AWS side (the Lambda execution role); Vercel holds
only the shared secret -- no AWS keys.

Two write kinds, discriminated by the body's `kind` field (default "email" for
backward compatibility):

  * kind="email"  -> INSERT INTO email_signups   (email, source, meta)
                     ON CONFLICT (email) DO NOTHING
  * kind="survey" -> INSERT INTO survey_responses (survey, source, open_text,
                     email, distinct_id, meta)

PRIVACY: the survey's PostHog event carries NO PII; the email (when present) is
stored ONLY here in Aurora, exactly like email_signups.
"""

import base64
import hmac
import json
import os
import re

import boto3

CLUSTER_ARN = os.environ["CLUSTER_ARN"]
SECRET_ARN = os.environ["SECRET_ARN"]
DB_NAME = os.environ.get("DB_NAME", "sffs")
SHARED_SECRET = os.environ["SHARED_SECRET"]

MAX_EMAIL_LENGTH = 254
DEFAULT_SOURCE = "pricing-get-access"
ALLOWED_SOURCES = {
    DEFAULT_SOURCE,
    # v3 "The Official Smart Fella Test" — the branch a signup came from.
    "smart-fella-test-parent",
    "smart-fella-test-child",
}
# Same pragmatic shape check the website uses -- reject obviously malformed input.
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")

# --- attribution survey ("How did you find us?") ---
SURVEY_NAME = "attribution"
# The self-reported channels the on-brand survey offers. Kept lowercase + bounded
# so they aggregate cleanly in both Aurora and PostHog.
ALLOWED_SURVEY_SOURCES = {
    "tiktok",
    "instagram",
    "youtube",
    "reddit",
    "x",
    "threads",
    "friend",
    "search",
    "other",
}
MAX_OPEN_TEXT_LENGTH = 2000

# --- test results (no email is ever stored alongside these) ---
ALLOWED_TEST_TYPES = {"adult", "child"}
MIN_GRADE, MAX_GRADE = 3, 8
MAX_SCORE_CEILING = 200
MAX_DURATION_SECS = 24 * 60 * 60
MAX_DISTINCT_ID_LENGTH = 200

rds = boto3.client("rds-data")


def _resp(status, obj):
    return {
        "statusCode": status,
        "headers": {"content-type": "application/json"},
        "body": json.dumps(obj),
    }


def _str_or_null(value):
    return {"isNull": True} if value is None else {"stringValue": value}


def _int_or_null(v):
    return {"isNull": True} if v is None else {"longValue": int(v)}


def _execute(sql, parameters):
    # Returns the raw RDS Data API response. Only the email branch reads it (to
    # tell a real insert from an ON CONFLICT no-op); the survey branch ignores it.
    return rds.execute_statement(
        resourceArn=CLUSTER_ARN,
        secretArn=SECRET_ARN,
        database=DB_NAME,
        sql=sql,
        parameters=parameters,
    )


def _handle_email(body):
    email = body.get("email")
    email = email.strip().lower() if isinstance(email, str) else ""
    if not email or len(email) > MAX_EMAIL_LENGTH or not EMAIL_RE.match(email):
        return _resp(400, {"ok": False, "error": "invalid_email"})

    src = body.get("source")
    source = src if isinstance(src, str) and src in ALLOWED_SOURCES else DEFAULT_SOURCE

    meta = body.get("meta")
    if not isinstance(meta, dict):
        meta = {}

    try:
        result = _execute(
            "INSERT INTO email_signups (email, source, meta) "
            "VALUES (:email, :source, :meta) "
            "ON CONFLICT (email) DO NOTHING "
            "RETURNING id",
            [
                {"name": "email", "value": {"stringValue": email}},
                {"name": "source", "value": {"stringValue": source}},
                {
                    "name": "meta",
                    "value": {"stringValue": json.dumps(meta)},
                    "typeHint": "JSON",
                },
            ],
        )
    except Exception as e:  # noqa: BLE001 - never leak DB internals to caller
        print("email_signups insert failed:", repr(e))
        return _resp(500, {"ok": False, "error": "server_error"})

    # RETURNING yields a row only when the insert actually happened; ON CONFLICT
    # DO NOTHING suppresses it. The caller counts a conversion only when this is
    # true, so a repeat submit of an address already on the list is not counted
    # twice. The response is otherwise unchanged (still 200 {"ok": true}), so a
    # repeat submit still looks like plain success and never reveals membership.
    inserted = bool(result.get("records"))
    return _resp(200, {"ok": True, "inserted": inserted})


def _handle_survey(body):
    src = body.get("source")
    source = src.strip().lower() if isinstance(src, str) else ""
    if source not in ALLOWED_SURVEY_SOURCES:
        return _resp(400, {"ok": False, "error": "invalid_source"})

    # Optional free-text ("Other" / extra detail). Bounded; blank -> NULL.
    open_text = body.get("open_text")
    if isinstance(open_text, str):
        open_text = open_text.strip()[:MAX_OPEN_TEXT_LENGTH]
        if not open_text:
            open_text = None
    else:
        open_text = None

    # Optional tie to the signup. Either identifier may be absent; store what we
    # have. `email` is PII and lives only in Aurora (never in the PostHog event).
    email = body.get("email")
    if isinstance(email, str):
        email = email.strip().lower()
        email = email if email and len(email) <= MAX_EMAIL_LENGTH and EMAIL_RE.match(email) else None
    else:
        email = None

    distinct_id = body.get("distinct_id")
    if isinstance(distinct_id, str):
        distinct_id = distinct_id.strip()[:MAX_DISTINCT_ID_LENGTH] or None
    else:
        distinct_id = None

    meta = body.get("meta")
    if not isinstance(meta, dict):
        meta = {}

    def _str_or_null(value):
        return {"stringValue": value} if value is not None else {"isNull": True}

    try:
        _execute(
            "INSERT INTO survey_responses "
            "(survey, source, open_text, email, distinct_id, meta) "
            "VALUES (:survey, :source, :open_text, :email, :distinct_id, :meta)",
            [
                {"name": "survey", "value": {"stringValue": SURVEY_NAME}},
                {"name": "source", "value": {"stringValue": source}},
                {"name": "open_text", "value": _str_or_null(open_text)},
                {"name": "email", "value": _str_or_null(email)},
                {"name": "distinct_id", "value": _str_or_null(distinct_id)},
                {
                    "name": "meta",
                    "value": {"stringValue": json.dumps(meta)},
                    "typeHint": "JSON",
                },
            ],
        )
    except Exception as e:  # noqa: BLE001 - never leak DB internals to caller
        print("survey_responses insert failed:", repr(e))
        return _resp(500, {"ok": False, "error": "server_error"})

    return _resp(200, {"ok": True})


def _handle_result(body):
    """Durable test result. Deliberately carries NO email address: the privacy
    policy promises the address and the result are never stored together, so
    this table has no email column and this branch never receives one."""
    test_type = body.get("test_type")
    test_type = test_type.strip().lower() if isinstance(test_type, str) else ""
    if test_type not in ALLOWED_TEST_TYPES:
        return _resp(400, {"ok": False, "error": "invalid_test_type"})

    try:
        score = int(body.get("score"))
        max_score = int(body.get("max_score"))
    except (TypeError, ValueError):
        return _resp(400, {"ok": False, "error": "invalid_score"})
    if not (0 <= score <= max_score <= MAX_SCORE_CEILING):
        return _resp(400, {"ok": False, "error": "invalid_score"})

    grade = body.get("grade")
    grade = grade if isinstance(grade, int) and MIN_GRADE <= grade <= MAX_GRADE else None

    band = body.get("grade_band")
    band = band.strip()[:32] if isinstance(band, str) and band.strip() else None

    secs = body.get("duration_secs")
    secs = secs if isinstance(secs, int) and 0 <= secs <= MAX_DURATION_SECS else None

    src = body.get("source")
    source = src if isinstance(src, str) and src in ALLOWED_SOURCES else None

    # The address the results were sent to. Deliberately stored alongside the
    # score: the privacy policy discloses this. On the child branch it is a
    # parent's address against their child's score, which the policy also says.
    email = body.get("email")
    email = email.strip().lower() if isinstance(email, str) else ""
    if email and (len(email) > MAX_EMAIL_LENGTH or not EMAIL_RE.match(email)):
        return _resp(400, {"ok": False, "error": "invalid_email"})
    email = email or None

    verdict = body.get("verdict")
    verdict = verdict.strip()[:64] if isinstance(verdict, str) and verdict.strip() else None

    meta = body.get("meta")
    if not isinstance(meta, dict):
        meta = {}

    try:
        _execute(
            "INSERT INTO test_results "
            "(test_type, grade, grade_band, score, max_score, duration_secs, "
            "source, email, verdict, meta) "
            "VALUES (:test_type, :grade, :grade_band, :score, :max_score, "
            ":duration_secs, :source, :email, :verdict, :meta)",
            [
                {"name": "test_type", "value": {"stringValue": test_type}},
                {"name": "grade", "value": _int_or_null(grade)},
                {"name": "grade_band", "value": _str_or_null(band)},
                {"name": "score", "value": {"longValue": score}},
                {"name": "max_score", "value": {"longValue": max_score}},
                {"name": "duration_secs", "value": _int_or_null(secs)},
                {"name": "source", "value": _str_or_null(source)},
                {"name": "email", "value": _str_or_null(email)},
                {"name": "verdict", "value": _str_or_null(verdict)},
                {
                    "name": "meta",
                    "value": {"stringValue": json.dumps(meta)},
                    "typeHint": "JSON",
                },
            ],
        )
    except Exception:
        return _resp(500, {"ok": False, "error": "server_error"})

    return _resp(200, {"ok": True})


def handler(event, context):
    # Function URL / API Gateway use payload format 2.0.
    method = (
        event.get("requestContext", {}).get("http", {}).get("method")
        or event.get("httpMethod")
        or ""
    ).upper()
    if method and method != "POST":
        return _resp(405, {"ok": False, "error": "method_not_allowed"})

    # Auth: constant-time comparison of the shared secret.
    headers = {k.lower(): v for k, v in (event.get("headers") or {}).items()}
    provided = headers.get("x-shared-secret", "")
    if not provided:
        auth = headers.get("authorization", "")
        if auth.lower().startswith("bearer "):
            provided = auth[7:]
    if not provided or not hmac.compare_digest(str(provided), SHARED_SECRET):
        return _resp(401, {"ok": False, "error": "unauthorized"})

    raw = event.get("body") or ""
    if event.get("isBase64Encoded"):
        try:
            raw = base64.b64decode(raw).decode("utf-8")
        except Exception:
            return _resp(400, {"ok": False, "error": "invalid_body"})
    try:
        body = json.loads(raw) if raw else {}
    except Exception:
        return _resp(400, {"ok": False, "error": "invalid_body"})

    kind = body.get("kind")
    kind = kind.strip().lower() if isinstance(kind, str) else "email"

    if kind == "survey":
        return _handle_survey(body)
    if kind == "result":
        return _handle_result(body)
    if kind in ("", "email"):
        return _handle_email(body)
    return _resp(400, {"ok": False, "error": "invalid_kind"})

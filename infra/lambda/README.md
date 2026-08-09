# AWS Lambda sources

Three Python functions sit between this website and Aurora. Two of them decide
what the `/dashboard` numbers mean, and one of them handles every signup write
the site makes. Until 9 August 2026 none of them existed anywhere except inside
a single AWS account: no review history, no diff, no copy. This directory is
the copy.

## READ THIS FIRST: this is a mirror, not the deployment

**Pushing this repo does not update any function.** Nothing in CI watches this
directory. These files are a verbatim copy of what was deployed at the time
they were committed, kept here so the code can be read, reviewed, diffed and
recovered — not so it can be shipped.

That means the copy can drift. If somebody edits a function in the AWS console
and does not commit it here, this directory is quietly wrong and nothing will
say so. Before trusting a file here, or before deploying from it, check it
still matches what is running:

```sh
aws lambda get-function --function-name sffs-email-proxy \
  --query 'Code.Location' --output text | xargs curl -s -o /tmp/fn.zip
unzip -p /tmp/fn.zip lambda_function.py | diff - infra/lambda/sffs-email-proxy/lambda_function.py
```

No output means the mirror is honest. **If you change a function, change it
here in the same commit.**

## The functions

| Function | Runtime | Invoked by | What it does |
| --- | --- | --- | --- |
| `sffs-email-proxy` | python3.12 | API Gateway (HTTP), from Vercel route handlers | The only write path into Aurora. Three write kinds on one endpoint: `email` → `email_signups`, `survey` → `survey_responses`, `result` → `test_results`. |
| `sffs-email-dw-export` | python3.12 | EventBridge `sffs-email-dw-export-hourly`, `rate(1 hour)` | Snapshots `email_signups` to S3 as NDJSON and uploads it to PostHog as the standalone warehouse table `email_signups`. |
| `sffs-test-results-dw-export` | python3.12 | EventBridge `sffs-test-results-dw-export-hourly`, `rate(1 hour)` | Same shape, for `test_results`. Also enriches each completion with an acquisition channel from PostHog events. |

All three are `x86_64`, handler `lambda_function.handler`, single-file, no
dependencies beyond the `boto3` already present in the Lambda Python runtime —
which is why "packaging" is a zip containing one `.py` file and nothing else.

| Function | Timeout | Memory |
| --- | --- | --- |
| `sffs-email-proxy` | 15s | 128 MB |
| `sffs-email-dw-export` | 60s | 256 MB |
| `sffs-test-results-dw-export` | 120s | 256 MB |

Each runs under its own IAM role (`sffs-email-lambda-role`,
`sffs-email-dw-export-role`, `sffs-test-results-dw-export-role`). The roles are
not vendored here; they are what keeps AWS credentials on the AWS side, and
Vercel holds no AWS keys at all.

## Why the exports matter more than they look

**The definition of a completion lives in `sffs-test-results-dw-export`, not in
the dashboard.** Contaminated rows are dropped at export so that nothing
downstream can surface them by forgetting a `WHERE` clause. Counting rows in
Aurora `test_results` directly therefore gives a much larger number than the
dashboard shows — 898 against 533 when this was last measured — and the
difference is entirely the export's filter. That has already been reported once
as a dashboard defect. It is not one. See the header comment in that file, and
the matching note in `lib/dashboard/growth.ts`.

`sffs-email-dw-export` carries the equivalent filter for signups:
`meta->>'synthetic' IS NULL`, which is what stops a tagged verification run
being counted as a real address. Its counterpart in the app is `signupMeta()`
in `lib/email-store.ts`.

Both exports log a census line every run so drift in the exclusion machinery is
visible in CloudWatch without anyone querying Aurora:

```
census aurora_rows=347 excluded_synthetic=1 exported=346
```

## Configuration

Every value these functions need comes from Lambda environment variables. **No
secret, ARN, endpoint or account identifier appears in any source file here**,
which is what makes them safe to commit to a public repo. The variable *names*
are listed below; the *values* live only in Lambda configuration and are not
reproduced anywhere in this repo.

| Function | Environment variables |
| --- | --- |
| `sffs-email-proxy` | `SHARED_SECRET`, `CLUSTER_ARN`, `SECRET_ARN`, `DB_NAME` |
| `sffs-email-dw-export` | `CLUSTER_ARN`, `SECRET_ARN`, `DB_NAME`, `S3_BUCKET`, `S3_PREFIX`, `TABLE_NAME`, `POSTHOG_HOST`, `POSTHOG_PROJECT_ID`, `POSTHOG_API_KEY` |
| `sffs-test-results-dw-export` | the same nine, plus `PAGE_SIZE`, `ATTRIBUTION_DAYS`, `MATCH_TOLERANCE_S` |

`SHARED_SECRET` is the random string Vercel sends as `x-shared-secret`; it is
the app's `EMAIL_PROXY_SECRET`, and it is the only credential the website holds
for this path. The proxy compares it with `hmac.compare_digest`.

To read the current values without printing them into a shared log:

```sh
aws lambda get-function-configuration --function-name sffs-email-dw-export \
  --query 'Environment.Variables' --output json
```

## Redeploying from this directory

The zip is one file. There is no build step, no bundler and no layer.

```sh
cd infra/lambda/<function-name>
zip -q /tmp/deploy.zip lambda_function.py
aws lambda update-function-code \
  --function-name <function-name> \
  --zip-file fileb:///tmp/deploy.zip
```

Then confirm what actually landed, because `update-function-code` reports
success on the upload rather than on the function working:

```sh
# exports: run once by hand and read the census + result
aws lambda invoke --function-name sffs-email-dw-export --log-type Tail \
  --cli-binary-format raw-in-base64-out --payload '{}' /tmp/out.json \
  --query 'LogResult' --output text | base64 -d
cat /tmp/out.json
```

An export is safe to invoke by hand at any time: it is a full-snapshot replace,
it refuses to publish an empty snapshot, and it short-circuits when the content
hash is unchanged. The proxy is a write path and should not be invoked by hand
with a real payload — exercise it through the site.

### Rolling back

Any previously committed version in this directory can be redeployed with the
command above. That is the point of vendoring: before this existed, the only
copy of a pre-change version was whatever happened to be in someone's `/tmp`.

## Known gaps, recorded rather than fixed

- **`email_signups` has no internal marker.** The synthetic marker landed on 9
  August; an equivalent for the team's own addresses has not, so internal rows
  are still inside the signup count and the exported address list. What it
  would take, and the one open decision it needs, are in
  [`docs/analytics/signup-internal-marker.md`](../../docs/analytics/signup-internal-marker.md).
- **No infrastructure-as-code.** Function configuration, IAM roles, the
  EventBridge rules and the API Gateway all still exist only as console state.
  Vendoring the source closes the worst of the exposure; it does not close that.
- **No test coverage on the Python.** The exclusion filters are exercised only
  by running an export and reading the census.

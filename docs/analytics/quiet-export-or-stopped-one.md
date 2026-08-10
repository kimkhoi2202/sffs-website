# Telling a quiet export from a stopped one

**Status:** built and shipped on the Growth tab, 10 August 2026. Written down
because it has now caught two separate consumers of the same mirror on the same
evening, and the next one will be written by somebody who was not there.

**Who this is for:** anything that reads the `test_results` warehouse mirror and
wants to know whether the figures it is about to show are current — the
dashboard's freshness stamp, the slide generators in `sffs-table-images/`, and
anything else that decides whether to render or refuse.

## The trap

`sffs-test-results-dw-export` builds a full snapshot every run, hashes it, and
compares the digest against the marker it wrote last time:

```python
existing = ph_list_tables(TABLE_NAME)
if digest == s3_get_text(MARKER_KEY) and len(existing) == 1:
    print(f"unchanged since last run (table_id={existing[0]}); skipping PostHog refresh.")
    return {"status": "unchanged", "rows": n, "table_id": existing[0]}
```

When the snapshot is byte-identical it **skips the upload entirely** — no
delete, no create. So `system.data_warehouse_tables.updated_at` does not move.

That timestamp is **the moment the content last changed, not the moment the
export last ran.** The two only coincide on a busy hour.

This is not a bug in the exporter. Skipping an identical upload is correct and
deliberate. The bug is downstream, in every consumer that reads the timestamp
as a heartbeat.

## What it cost

On 10 August 2026 the runs at 17:37, 18:37 and 19:36 UTC all succeeded with
zero errors and all correctly skipped. Aurora had taken exactly two new
attempts since 16:18, both children's tests with `answered = 0`, which the
export drops by design. Three identical snapshots, three skips, one frozen
timestamp.

Two consumers read that as a stopped export. The dashboard's stamp turned
coral and said a scheduled run had been missed; a slide generator refused to
render over it. The owner was told his pipeline had failed. It had not.

## Why none of the obvious signals work

| signal | goes quiet when the export dies | goes quiet when nothing happens | usable |
| --- | --- | --- | --- |
| `data_warehouse_tables.updated_at` | yes | **yes** | no |
| `max(completed_at)` in the mirror | yes | **yes** | no |
| mirror row count | yes | **yes** | no |

Every signal available *inside the mirror* is silent in both conditions,
because in both conditions the mirror genuinely does not change. No amount of
staring at one system separates them. **You need a second, independent
witness of the thing the export is supposed to be carrying.**

## The witness

PostHog's event stream is that witness. `test_completed` fires from the same
interaction that writes the Aurora row, it is queryable within seconds, and it
is reachable from anywhere that can already query PostHog.

The verdict is a comparison, not an age:

1. Read the mirror's **high-water mark** — `max(completed_at)` over
   `test_results`, unwindowed. This is the newest completion the figures
   actually include.
2. Ask PostHog for **qualifying completions newer than that mark**.
3. If there are none, the mirror is caught up. Its timestamp being old means
   nothing happened, and the figures are complete.
4. If there are some, take the **oldest** of them. If it has been waiting
   longer than one full export cadence plus grace, a scheduled run has come and
   gone without collecting it, and the export really is behind.

The truest signal is still the exporter's last successful invocation, which
lives in CloudWatch. If you are somewhere that can reach it, use it. The
dashboard cannot: the Next.js app ships no AWS client, holds no AWS
credentials, and its `POSTHOG_PERSONAL_API_KEY` is scoped to `query:read`.

## Five things that are load-bearing

**Apply the export's `answered > 0` filter to the witness.** This is not a
detail. Both of 10 August's attempts answered nothing, so the export was right
to drop them and the snapshot was right to be identical. A witness without this
clause would have called those two a missed run and replaced one false alarm
with a fresh one.

**Keep the witness filtered regardless of any raw/unfiltered toggle.** A
display choice about who appears in a funnel does not change what the export
put in the mirror. Letting a toggle through shows a stall that does not exist.

**Allow a minute of clock slack on the comparison.** Aurora truncates
`completed_at` to the second and PostHog keeps the milliseconds, so the single
interaction behind `16:17:53.000` and `16:17:53.470` will otherwise read as a
completion outstanding against itself — a permanent phantom stall that never
clears.

**Judge on the OLDEST outstanding completion, never the newest.** The oldest is
the one that has had the most chances to be collected. Judging on the newest
fires the alarm on a completion recorded ninety seconds ago that the next
scheduled run will pick up perfectly well.

**Fail closed, and never serve any of it from a cache.** If the witness or the
high-water mark cannot be read, fall back to treating unchanged content as
stale — an unreadable check must never talk a consumer out of an alarm. And
PostHog will serve these from its own result cache with a six-hour target age
unless told not to; a cached witness hides the completions that prove a stall
and turns a real one back into a quiet evening. Pass `force_blocking`.

## What this still cannot tell you

**It is a witness, not a ledger.** The export's exclusions key on markers
written onto the Aurora row (`meta.synthetic`, `meta.internal`); PostHog's key
on project `test_account_filters`. They are different rule sets over different
systems and they do not pick out exactly the same humans, so a completion can
in principle appear to one and not the other. Report what was measured —
"completions PostHog recorded that the mirror does not carry" — rather than
asserting what the exporter owes. Say the count and the wait, so a reader can
check the claim instead of trusting it.

**A dead export with no traffic behind it reads as caught up.** That is the
correct reading for a consumer deciding whether to trust the figures — nothing
is missing from them — but it is not proof the export is alive, and nothing
reachable from PostHog can make it one. So do not print "running normally". Say
only that nothing is outstanding. The old stamp claimed health it could not
establish in one direction; claiming it in the other is the same error.

## Where it is implemented

`lib/dashboard/growth.ts`, the section headed `Freshness` —
`fetchMirrorHighWater`, `fetchCompletionWitness`, `mirrorBacklog` and
`warehouseFreshness`, with the four states they produce documented on
`FreshnessState` in `lib/dashboard/types.ts`.

`scripts/verify-growth.mjs` case 5 pins all three behaviours: healthy and
changing, healthy and unchanged, and genuinely stalled — plus the clock-skew
phantom, the in-flight/overdue threshold and each fail-closed path. The middle
case is the one that was wrong; the third is the one that must never regress in
earning it.

## References

- `infra/lambda/sffs-test-results-dw-export/lambda_function.py` — the skip, and
  the four export filters the witness is approximating
- `lib/dashboard/completion-rule.ts` — what counts as a completion, shared by
  the events side and the warehouse side
- `lib/dashboard/posthog-query.ts` — why the freshness queries pass
  `force_blocking`, and the measured six-hour cache that made it necessary

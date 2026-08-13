# The 77 people from 9 August whose results were never sent

**Status: closed, and closed unhappily. Nothing can be done for these people.**
This is written down because that is the only remaining thing that can be done.

## What happened

On 9 August 2026 the Resend account hit `daily_quota_exceeded` at 17:52 UTC.
Results emails failed for the rest of the day. 83 people asked for their results
during the outage and **77 of them never received anything**, then or since.

They cannot be contacted, because we do not know who they are.

## Why they cannot be identified

At the time, the send route called the provider FIRST and wrote to Aurora
SECOND. The address a person typed lived in memory for the length of one request
and was discarded when the send failed. Nothing durable was written on the
failure path, in any store, by design that nobody had examined from this angle.

Three independent checks confirm there is no copy of those addresses anywhere:

1. **`test_results`** holds no `pending` rows before 10 Aug 16:18 UTC, which is
   when the persist-before-send change went live. The 9 August cohort predates
   the mechanism entirely.
2. **`email_signups`** rows stop dead at 17:00 on 9 August and there are none for
   the rest of the day, because the signup write also sat behind a successful
   send. The gap in that table is the outage, exactly.
3. **PostHog** carries no address. `test_email_send_failed` holds `test_id`,
   `code` and `audience`; `email_captured` holds no recipient; person profiles
   have no email property. This is the privacy design working as intended, and
   it is also why analytics cannot rescue us here.

So the 77 are countable and not addressable. We know precisely how many people
we failed and have no way to reach a single one of them.

## What this cost, and what it bought

It very nearly caused a second, worse incident. A later investigation started
from a commit message reporting "148 people" and was on its way to mailing them.
Those 148 are a different cohort, from 11 August, and **every one of them had
already received their results** by the time anybody looked: the persist-then-
drain path existed by then and delivered 156 of them at 16:09 UTC on 12 August,
28.6 hours late. Sending to that list would have put a duplicate in 155 inboxes
belonging to people who were never owed anything.

The distinction that matters: **11 August was recoverable and was recovered. 9
August was not and never will be.** The only difference between the two is
whether the address was written down before the provider was called.

## What changed because of it

- The address is persisted as a `pending` row **before** Resend is called, so an
  outage now ends with a list of who is owed rather than a hole.
  See `app/api/test-results/send/route.ts`.
- Those rows are drained on a schedule, every five minutes, rather than when a
  human notices. See `app/api/test-results/drain/route.ts`.
- A rate-limit refusal is no longer classified as a permanent rejection, so a
  burst can no longer delete somebody from the backlog for the crime of us
  sending too fast. See `classifyFailure` in `lib/email/resend.ts`.
- The drain emits `results_email_backfilled` so a recovered batch is visible in
  analytics instead of reading as 156 people who never got their mail.
- The account is on Resend Pro: daily limit unlimited, 50,000 a month against
  roughly 322 sends a day. The quota that caused this is no longer the binding
  constraint.

## If you are reading this while considering a "make it right" send

Do not use this document as a recipient list. There is no list. Any attempt to
reconstruct one from `email_signups` would mail people who were never affected,
and any attempt to reconstruct it from the 11 August cohort would mail people
who already have their results.

The honest position is that 77 people asked us for something on 9 August, did
not get it, and never will. That is the cost of having called the provider
before writing the address down.

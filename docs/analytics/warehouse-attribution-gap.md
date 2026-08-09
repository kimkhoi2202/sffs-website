# The warehouse cannot say where a completion came from

**Status:** recorded, not built. Deferred deliberately — it touches
`sffs-test-results-dw-export`, the Lambda vendored on 9 August 2026, and it
should be done in one considered pass rather than bolted onto a feature.

**Found while** building the adult/child split on the Growth tab's channel
table, which had to source its attribution from PostHog events because this
table could not supply it.

## The number

`test_results` is mirrored into PostHog with a `platform` column. Measured on
the live table, 9 August 2026, all 666 rows:

| state | rows | |
| --- | --- | --- |
| `platform` resolved | 159 | 24% |
| matched a PostHog event, but `_channel()` had no branch for the domain | 23 | 3% |
| no attribution at all | 484 | 73% |

Of the 159 that resolve, every one is `reddit` (150) or `instagram` (9),
because those are the only two values the export can produce. The companion
column `referrer_domain` is null on 591 of the 666.

So the product database can say where a completion came from for a quarter of
its rows, and only ever names two channels. The dashboard's own ladder resolves
sixteen — Reddit, Instagram, TikTok, YouTube, Facebook, Threads, X, WhatsApp,
LinkedIn, Discord, Telegram, Google Search, other search, email clients,
internal navigation and dev traffic — plus landing-path and survey rungs. The
site's single largest channel by volume is TikTok, and the warehouse cannot
name it at all.

## Why this is a defect and not an inconvenience

**The warehouse cannot be an independent check on PostHog, because its
attribution is derived from PostHog.**

That is the part worth sitting with. `fetch_attribution()` reads
`test_completed` events out of PostHog, matches them to Aurora rows on
`(test_id, score, max_score, answered)` within a five-second window, and copies
the channel across. Every attributed row in the warehouse is therefore a copy
of an answer PostHog already gave. If PostHog is wrong about a channel, the
warehouse is wrong in exactly the same way and agreeing with it proves nothing.

This has already cost something concrete. When a visitor arrived from the
Reddit Android app with no UTM, the thing that identified them was Aurora — not
PostHog. That is the capability this design forfeits: the database is the one
source that sees a signup PostHog never recorded, and today it throws that
independence away in favour of a lossy copy.

It also explains the 73%. The match needs a client-side `test_completed` event
to exist and its timestamp to land within five seconds of Aurora's
`completed_at`. An ad-blocked client, a dropped event or a clock skew and the
row gets nothing — and there is no fallback that does not also go through
PostHog.

## Where the signal actually is

**Correction to the obvious assumption, which cost an hour to check:
`test_results.meta` does not carry a referrer or a UTM.** It carries `test_id`,
`answered`, `timed_out`, `completed_at`, `stage`, and the `synthetic` /
`internal` markers — see `toWireFormat()` in `lib/test/result-stats.ts`. Any
plan that starts "read the referrer off the completion row" does not work.

The signal is one table over, in **`email_signups.meta.referrer`**, which
`signupMeta()` fills from the request's `referer` header — the site URL the
person was on when they submitted, query string included. Measured on the
mirror, all 346 rows:

| | rows |
| --- | --- |
| carries a `utm_source=` | 278 |
| a referrer, but no `utm_source` | 68 |
| no referrer | 0 |

The export already reads this, in `SIGNUP_UTM_SQL`. Three things limit it:

1. **It is a last resort.** It runs only after the event match has failed.
2. **It only reaches rows with an address.** 352 of the 666 completions carry
   one; the anonymous half cannot be reached this way at all.
3. **Whatever it finds goes through `_channel()` anyway**, so a `utm_source` of
   `tiktok` is read, understood, and then discarded.

## What it would take

Roughly in order of payoff per unit of risk.

### 1. Give `_channel()` the real vocabulary

It currently returns `reddit`, `instagram`, or `None`. The mapping it should
have already exists and is already tested: `channelFromUtm` and
`channelFromDomain` in `lib/dashboard/attribution.ts`. Porting that vocabulary
is mechanical and immediately un-discards the 23 rows in the table above plus
whatever the UTM path stops throwing away.

Do **not** re-derive the mapping by hand. The Reddit clause in particular is
load-bearing and non-obvious: `com.reddit.frontpage` is what the Android app's
`android-app://com.reddit.frontpage/` referrer becomes after domain extraction,
and it shares no substring with `reddit.com`. A fresh `LIKE '%reddit.com%'`
misses exactly the visitors the ladder was built for.

### 2. Promote the signup UTM from last resort to first source

For any row with an address, `email_signups.meta.referrer` is available without
asking PostHog anything. Reading it first — and falling back to the event match
rather than the other way round — is what makes the warehouse's answer
independent. Coverage goes from 24% to something in the region of half the
table, and the half it covers is the half that converted.

### 3. Decide about the anonymous half

352 of 666 completions carry an address. The rest finished without giving one,
have no `email_signups` row, and so have nothing to join to. Attributing them
needs the referrer captured at completion time rather than at signup time,
which means adding it to the `meta` the result write already sends
(`toWireFormat()` in `lib/test/result-stats.ts`) and is a change to the write
path rather than to the export. Worth doing, but it only helps rows written
after it ships — the existing 666 will never have it.

## What it does not fix

The 666 rows already in the table, for the same reason the synthetic marker did
not retro-tag anything. Steps 1 and 2 can be re-run over history because the
inputs still exist; step 3 cannot, because nobody recorded the referrer at the
time.

## Related, found while measuring this

**The warehouse freshness stamp measures last CHANGE, not last RUN.** The
comment in `lib/dashboard/growth.ts` says
`system.data_warehouse_tables.updated_at` "advances on every successful sync
whether or not any row changed". That is not what the export does: it hashes
the snapshot and skips the PostHog refresh when the content is unchanged, so
`updated_at` stops advancing on a quiet table even though the Lambda is running
fine.

No live impact on the panel today — it stamps `test_results`, which changes
every hour at current volume. But `email_signups` read 3h49m behind on 9 August
with one unpublished signup event after its last sync, which is either the hash
short-circuit working as designed or a missed run, and the dashboard cannot
tell those apart. If that table is ever put behind a freshness stamp, this will
false-alarm. The CloudWatch census line settles it either way.

## References

- `infra/lambda/sffs-test-results-dw-export/lambda_function.py` — `_channel()`,
  `fetch_attribution()`, `SIGNUP_UTM_SQL`, `enrich()`
- `lib/dashboard/attribution.ts` — the ladder and the vocabulary to port
- `lib/test/result-stats.ts` — `toWireFormat()`, and what `test_results.meta`
  actually holds
- `lib/email-store.ts` — `signupMeta()`, where the referrer is captured
- `lib/dashboard/growth.ts` — `fetchChannels()`, which documents why the split
  it renders could not come from this table
- [`signup-internal-marker.md`](./signup-internal-marker.md) — the other
  deferred change to the same pair of exports

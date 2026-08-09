# An internal marker for `email_signups`

**Status:** proposed, not built. Deferred deliberately until after the campaign
week, because it touches the same write path as the synthetic marker that
shipped on 9 August 2026 and is better done in one pass than two.

**One open question needs an answer before it is built.** It is at the bottom,
under [The decision](#the-decision).

## The problem

`email_signups` has no way to record that a row is one of ours. A signup from a
teammate is stored exactly like a signup from a member of the public, so every
count taken off that table — the dashboard's address list, the exported
warehouse mirror, and anything anyone derives by hand — includes us.

The only thing standing in for a marker today is a hardcoded list of four
regular expressions in `lib/dashboard/people.ts`:

```
/@alphaaiengineering\.com$/i
/@gauntlethq\.com$/i
/@resend\.dev$/i
/^kimkhoi2202@gmail\.com$/i
```

It has three limits, and the second is the one that costs something:

1. **It only reaches one tab.** It filters the People/Journeys view and nothing
   else. It does not reach the export, so internal rows are still in the
   warehouse mirror and still in the signup count.
2. **It cannot catch an address it has never heard of.** A teammate signing up
   from a personal account is indistinguishable from a customer. This is not
   hypothetical — one of the three rows it currently catches is a personal
   gmail that had to be added by hand after the fact.
3. **Its own comment says not to extend it.** It is written as a last resort
   for rows PostHog never saw, with an explicit warning that adding addresses
   to "keep up with" PostHog duplicates a filter that has already run and
   drifts out of date silently. Every time we reach for it we do the thing it
   warns against.

As of 9 August 2026 it catches **3 of 346 rows**. Small, but the number is
unknowable rather than small — that is the point. Three is how many we can
identify, not how many there are.

### Why this is not the same problem the synthetic marker solved

The synthetic marker answers *"did a machine or a verification run write this"*.
This answers *"was this a real human who happens to work here"*. They are not
interchangeable, they fail in different ways, and collapsing them into one
field — or reaching for whichever makes a number come out right — is precisely
what the split in `test_results` exists to prevent. `test_results` already
carries both `meta.synthetic` and `meta.internal` as separate keys. This
proposal brings `email_signups` in line with that, not with a merged flag.

## Why this is smaller than it looks

**The signal already arrives at both routes and is simply not written down.**

The internal flag lives in the visitor's own `localStorage` and as a PostHog
super-property the browser SDK attaches client-side, so the server cannot read
it. That was already solved once: `captureEmailCapturedServer` has the client
send it in the request body, and **both signup routes already accept
`body.isInternal` and already forward it to PostHog**. Nothing new has to be
plumbed from the browser. The value is in scope at both call sites right now
and is thrown away before the Aurora write.

Trusting the client here is fine, unusually, and for the reason already
documented in `lib/posthog-server.ts`: the only thing a visitor achieves by
lying is excluding themselves from our analytics, and claiming `false` is what
happens by default anyway. There is nothing to gain and nothing to protect.

## What it would take

Four changes. The first three are small and mechanical; the fourth is the one
with judgement in it.

### 1. Carry the flag into the meta — `lib/email-store.ts`

`signupMeta()` currently derives everything from headers. The internal flag
arrives in the body, so it has to be passed in:

```ts
export function signupMeta(
  headers: Headers,
  opts: { internal?: boolean } = {},
): Record<string, unknown> {
  return {
    referrer: headers.get("referer"),
    userAgent: headers.get("user-agent"),
    ...(isSyntheticRequest(headers) ? { synthetic: true } : {}),
    ...(opts.internal ? { internal: true } : {}),
  };
}
```

Present only when true, exactly like `synthetic`, so ordinary rows stay
byte-identical and the query for real signups stays a pair of `IS NULL` tests.
Writing the key unconditionally as `false` would break the export filter
silently — a row carrying `internal: false` is not null.

### 2. Pass it at the two call sites

`app/api/access-signup/route.ts` and `app/api/test-results/send/route.ts` both
already compute `body.isInternal === true` for their PostHog call. Same
expression, second use:

```ts
meta: signupMeta(request.headers, { internal: body.isInternal === true }),
```

### 3. Filter at the export — `infra/lambda/sffs-email-dw-export`

Beside the clause that is already there:

```sql
WHERE meta->>'synthetic' IS NULL
  AND meta->>'internal'  IS NULL
```

and a second census column so the exclusion is visible in CloudWatch every run
rather than only when someone goes looking:

```
census aurora_rows=… excluded_synthetic=… excluded_internal=… exported=…
```

The filter belongs at the export for the reason the completions export already
documents: nothing downstream can then surface a marked row by forgetting a
clause. Note this clause was *deliberately not* added in advance — a filter for
a marker nothing writes is a filter that silently matches nothing, and pinning
its shape before the decision below is made would be guessing.

### 4. Decide what happens to the hardcoded list

This is the part that cannot be done mechanically. The list **cannot simply be
deleted**: the marker only applies to rows written after it ships, and the 346
rows already in the table will never carry it. Whatever we do, the list stays
as the only cover for history.

Recommended: keep it, add a comment recording that it is now historical-only
and that new rows are covered by the marker, and stop adding to it. Deleting it
would silently readmit three known-internal rows to the People tab; extending
it would go on doing the thing it warns against.

## What it does not fix

The 346 existing rows, for the same reason the synthetic marker did not
retro-tag anything: nobody can now classify a row written weeks ago, and
guessing at intent to make a number look tidier is how a count stops being
worth trusting. Going forward is enough.

## The decision

**Should "internal" exclude a row from the exported address list, or only from
the counts?**

The synthetic marker made this easy — a machine's row is not a person and
belongs nowhere. Internal rows are real people who really signed up, so the
answer is a judgement about what the list is *for*:

- **Exclude from the export** (recommended, and consistent with `synthetic`).
  The dashboard's address count then means "people who are not us", which is
  the number anyone actually wants. The cost: the team's own addresses vanish
  from the exported list, so the export no longer reconciles 1:1 against a raw
  Aurora row count — a second gap to explain, on top of the completions one.
  That is manageable, because the page already states the completions
  reconciliation in words and this would be stated the same way.

- **Exclude from the counts only, keep the rows in the export.** Reconciliation
  stays simple and the list stays complete. The cost: every consumer of the
  mirror has to remember to filter, which is exactly the "forgetting a WHERE
  clause" failure the export-side filter exists to prevent — and it has already
  happened once on this project.

The recommendation is to exclude from the export and say so on the panel. But
if that list is ever the thing we actually email, dropping our own addresses
from it may be the wrong default, and that is the owner's call rather than an
engineering one.

## References

- `lib/email-store.ts` — `signupMeta()`, the single builder both writers use
- `lib/test/result-stats.ts` — `SYNTHETIC_HEADER`, and the `test_results`
  precedent for keeping `synthetic` and `internal` as separate keys
- `lib/dashboard/people.ts` — `INTERNAL_EMAIL_PATTERNS` and its own warning
- `lib/posthog-server.ts` — why the client is trusted for this flag
- `infra/lambda/README.md` — the export functions and how to redeploy them
- `scripts/verify-email-store.mjs` — the suite that pins "absent, not false"

# Resend: getting real email out

The results flow only works if the email actually arrives — it is the only way
to see a score. Right now it does not arrive for most people, and this is why.

## The blocker

Resend will not deliver to arbitrary recipients until the sending domain is
verified by DNS. Until then the only usable sender is the shared sandbox
address, `onboarding@resend.dev`, and it can **only reach the Resend account
owner's own email address**.

Anything else is accepted by the API — a `200`, a message id, no error — and
then goes nowhere. There is no way around it and nothing in the code tries to
be. It is fine for local work: send to the account owner's address and the
whole flow is exercisable end to end.

## Switching it on is a config change, not a code change

`lib/email/resend.ts` reads the sender from `RESEND_FROM` and never hardcodes
it. Once the domain is verified, the entire switch is one environment variable:

```
RESEND_FROM="Smart Fella <results@smartfellaorfartsmella.com>"
```

Also set `RESULTS_BASE_URL` to the production origin so the link in the email
points somewhere real:

```
RESULTS_BASE_URL=https://smartfellaorfartsmella.com
```

No deploy of new code is needed for either.

## The DNS records to add

In Resend: **Domains → Add Domain → `smartfellaorfartsmella.com`**, pick a
region, and it generates the exact values. Add them wherever the domain's DNS
lives (Vercel, Cloudflare, the registrar). There are four, and the shape is
always the same:

| # | Type | Host / Name | Value | Notes |
|---|---|---|---|---|
| 1 | `MX` | `send` | `feedback-smtp.<region>.amazonses.com` | Priority `10`. Handles bounce and complaint feedback. |
| 2 | `TXT` | `send` | `v=spf1 include:amazonses.com ~all` | SPF: says Amazon SES may send for this domain. |
| 3 | `TXT` | `resend._domainkey` | the long `p=MIGfMA0GCSq...` key Resend shows | DKIM. Copy it exactly; it is one line with no spaces. |
| 4 | `TXT` | `_dmarc` | `v=DMARC1; p=none;` | DMARC. Start at `p=none`, see below. |

Notes that save an hour:

- The **region matters** in record 1. Use the one Resend shows for the domain
  you created; `us-east-1` and `eu-west-1` are different hostnames.
- Some DNS providers **append the domain automatically**. If yours does, enter
  `send`, not `send.smartfellaorfartsmella.com`, or you will end up with
  `send.smartfellaorfartsmella.com.smartfellaorfartsmella.com`.
- **Only one SPF record per hostname.** If `send` already has one, merge the
  `include:` into it rather than adding a second; two SPF records is a
  permanent failure, not a warning.
- DKIM is the long one and the one most often broken by a copy-paste that
  introduces a line break. Paste it into a plain text editor first if the DNS
  UI wraps it.
- Verification is usually minutes but the TTL is the ceiling. Resend's dashboard
  shows per-record status, so check there rather than guessing.

### On the DMARC record

`p=none` means "monitor, do nothing", which is the right place to start: it
turns on reporting without risking legitimate mail being rejected while the
setup settles. Once traffic looks clean for a couple of weeks, tighten to
`p=quarantine` and later `p=reject`. Going straight to `p=reject` on a fresh
domain is how you discover a broken SPF record by having every email silently
binned.

## Warm-up

A domain that has never sent email and then sends a few hundred results links in
a day looks exactly like a domain that has been compromised. Volume from this
flow will start small on its own, which is the good case — leave it that way
rather than testing with a burst.

## What to check before trusting it

1. Send to a Gmail address and a non-Gmail address. They disagree often.
2. In Gmail, **Show original** and confirm `SPF: PASS`, `DKIM: PASS`,
   `DMARC: PASS`. Anything else means one of the four records is wrong.
3. Confirm it lands in the inbox rather than Promotions or Spam.
4. Check the plain-text alternative renders: `/api/test-results/preview-email?token=...&format=text`
   in development shows exactly what goes in the message.
5. Check the `List-Unsubscribe` header is present. `lib/email/resend.ts` sets it
   to a `mailto:`, which is what we have in place of a preferences centre.

## While it is still unverified

The failure is visible rather than silent, which is the important part. If
`RESEND_API_KEY` is missing the API returns a "not switched on yet" error and
the user sees it. If Resend rejects the send, the user sees a retryable error.
Nobody is ever told to check an inbox for a message that did not leave.

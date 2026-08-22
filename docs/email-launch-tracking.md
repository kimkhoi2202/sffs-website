# Launch email attribution

This release prepares a bounded 50/50 launch-email pilot. It does not import a
list or send a message.

## Attribution chain

1. Each pilot row receives an opaque `recipient_id`, a variant (`a` or `b`),
   and a signed `/go/app?t=...` URL. The token never contains an email address.
2. The first-party redirect records `launch_email_link_clicked` in PostHog and
   then sends the visitor to the matching Apple campaign link.
3. Resend tags each outbound message with `campaign`, `variant`, and
   `recipient_id`. Its signed webhook records delivery, bounce, complaint,
   open, and provider-click events without forwarding the address, subject, or
   URL to PostHog.
4. App Store Connect attributes product-page views and installs to one of the
   two campaigns. Apple reports campaigns only once its privacy thresholds are
   met.

## Production values

- Campaign: `app-launch-2026-08`
- Variant A: `SFFS Email A Aug 2026`
- Variant B: `SFFS Email B Aug 2026`
- Resend webhook: `https://www.smartfellaorfartsmella.com/api/webhooks/resend`
- `RESEND_WEBHOOK_SECRET` must be stored in Vercel Production only.
- `EMAIL_TRACKING_TOKEN_SECRET` is optional when the production project already
  has `UNSUBSCRIBE_TOKEN_SECRET` or `RESULTS_TOKEN_SECRET`.

Keep `PRODUCT_EMAIL_ENABLED` off until the final 100-recipient file has been
suppression-checked and the owner deliberately authorizes the pilot send.

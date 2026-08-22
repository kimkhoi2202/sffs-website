import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Webhook } from "svix";

const secret = `whsec_${Buffer.from("verify-only-resend-webhook-secret-32-bytes").toString("base64")}`;
const payload = JSON.stringify({
  type: "email.clicked",
  created_at: "2026-08-21T20:00:00.000Z",
  data: {
    email_id: "email_123",
    to: ["must-not-enter-posthog@example.com"],
    tags: {
      campaign: "app-launch-2026-08",
      variant: "a",
      recipient_id: "pilot_a_000001",
    },
  },
});
const id = "msg_verify_123";
const timestamp = new Date();
const signature = new Webhook(secret).sign(id, timestamp, payload);
const verified = new Webhook(secret).verify(payload, {
  "svix-id": id,
  "svix-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
  "svix-signature": signature,
});
assert.equal(verified.type, "email.clicked");
assert.throws(() =>
  new Webhook(secret).verify(`${payload} `, {
    "svix-id": id,
    "svix-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
    "svix-signature": signature,
  }),
);

const route = readFileSync(new URL("../app/api/webhooks/resend/route.ts", import.meta.url), "utf8");
const posthog = readFileSync(new URL("../lib/posthog-server.ts", import.meta.url), "utf8");
assert.match(route, /await req\.text\(\)/);
assert.match(route, /new Webhook\(secret\)\.verify/);
assert.doesNotMatch(posthog.slice(posthog.indexOf("captureLaunchEmailProviderEvent")), /event\.to|subject|clicked_url/);
assert.match(posthog, /\$insert_id: event\.webhookId/);

console.log("Resend webhook verification: ok");

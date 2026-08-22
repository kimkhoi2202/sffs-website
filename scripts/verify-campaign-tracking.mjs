import assert from "node:assert/strict";

process.env.EMAIL_TRACKING_TOKEN_SECRET = "verify-only-campaign-key-32-characters";

const {
  APP_STORE_CAMPAIGN_URLS,
  decodeLaunchClickToken,
  encodeLaunchClickToken,
  launchClickUrlFor,
} = await import("../lib/email/campaign-tracking.ts");

for (const variant of ["a", "b"]) {
  const recipientId = `pilot_${variant}_000001`;
  const token = encodeLaunchClickToken({ variant, recipientId });
  const decoded = decodeLaunchClickToken(token);
  assert.deepEqual(decoded, {
    ok: true,
    campaign: "app-launch-2026-08",
    variant,
    recipientId,
    linkId: "app-store",
  });
  assert.match(launchClickUrlFor({ variant, recipientId }), /^https:\/\/www\.smartfellaorfartsmella\.com\/go\/app\?t=/);
  assert.match(APP_STORE_CAMPAIGN_URLS[variant], /id6794045991/);
  assert.match(APP_STORE_CAMPAIGN_URLS[variant], new RegExp(`ct=SFFS%20Email%20${variant.toUpperCase()}%20`));

  const last = token.at(-1);
  const tampered = token.slice(0, -1) + (last === "a" ? "b" : "a");
  assert.equal(decodeLaunchClickToken(tampered).ok, false);
}

assert.throws(
  () => encodeLaunchClickToken({ variant: "a", recipientId: "person@example.com" }),
  /opaque/,
);

console.log("campaign tracking verification: ok");

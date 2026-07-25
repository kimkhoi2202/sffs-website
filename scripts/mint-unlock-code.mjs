#!/usr/bin/env node
//
// Dev utility: mints a valid Smart Fella unlock code so we can demo/test
// the store's gate without wiring up the real app.
//
// EXACT CODE FORMAT (reproduce this on the app side to mint real codes):
//
//   SF1.<base64url(JSON payload)>.<base64url(HMAC-SHA256(payload bytes, secret))>
//
//   payload = { v: 1, sub: "<app user id>", tier: "smart-fella", iat: <unix seconds> }
//
//   1. JSON.stringify(payload), encode as UTF-8 bytes -> payloadBytes.
//   2. sig = HMAC-SHA256(payloadBytes, SFFS_UNLOCK_SECRET) as raw bytes.
//   3. code = "SF1." + base64url(payloadBytes) + "." + base64url(sig)
//
//   The HMAC is computed over the raw payload bytes (the UTF-8 JSON, NOT
//   the base64url string) — sign the same bytes you base64url-encode.
//   Use unpadded base64url (RFC 4648 §5): "-" and "_", no "=" padding.
//
// The website verifies with `verifyUnlockCode` from lib/store/unlock.ts
// using the SAME shared secret (env var SFFS_UNLOCK_SECRET on both sides).
//
// Usage:
//   SFFS_UNLOCK_SECRET=devsecret node scripts/mint-unlock-code.mjs
//   node scripts/mint-unlock-code.mjs devsecret
//   node scripts/mint-unlock-code.mjs devsecret some-user-id

import { createHmac } from "node:crypto";

const secret = process.env.SFFS_UNLOCK_SECRET ?? process.argv[2];
const sub = process.argv[3] ?? "demo-user-001";

if (!secret) {
  console.error(
    "Missing secret. Set SFFS_UNLOCK_SECRET or pass it as the first CLI arg:\n" +
      "  SFFS_UNLOCK_SECRET=devsecret node scripts/mint-unlock-code.mjs\n" +
      "  node scripts/mint-unlock-code.mjs devsecret [sub]",
  );
  process.exit(1);
}

const payload = {
  v: 1,
  sub,
  tier: "smart-fella",
  iat: Math.floor(Date.now() / 1000),
};

const payloadBytes = Buffer.from(JSON.stringify(payload), "utf8");
const sig = createHmac("sha256", secret).update(payloadBytes).digest();

const code = `SF1.${payloadBytes.toString("base64url")}.${sig.toString("base64url")}`;

console.log("Minted Smart Fella unlock code:");
console.log(code);
console.log("\nPayload:", payload);
console.log(
  "\nVerify with the same secret via verifyUnlockCode(code, secret) in lib/store/unlock.ts",
);

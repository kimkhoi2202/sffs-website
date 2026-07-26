import { describe, expect, it } from "vitest";
import {
  mintCheckoutToken,
  signUnlockCode,
  verifyCheckoutToken,
  verifyUnlockCode,
} from "@/lib/store/unlock";

// Dummy secret for tests only — never a real deployed secret.
const SECRET = "test-secret-for-unit-tests-only";
const OTHER_SECRET = "a-completely-different-test-secret";

// Flips the FIRST character rather than the last: base64url's final
// character in a group can carry padding-only bits that don't survive
// decoding, so a last-char flip can (correctly) decode to the same bytes.
// The first character always encodes significant bits.
function tamperFirstChar(segment: string): string {
  const first = segment.charAt(0);
  const swap = first === "A" ? "B" : "A";
  return swap + segment.slice(1);
}

describe("signUnlockCode / verifyUnlockCode", () => {
  it("round-trips: sign then verify returns ok:true with the correct sub", () => {
    const code = signUnlockCode("user-123", SECRET);
    const result = verifyUnlockCode(code, SECRET);
    expect(result.ok).toBe(true);
    expect(result.ok && result.sub).toBe("user-123");
  });

  it("has the SF1.<payload>.<sig> shape", () => {
    const code = signUnlockCode("user-123", SECRET);
    const parts = code.split(".");
    expect(parts).toHaveLength(3);
    expect(parts[0]).toBe("SF1");
  });

  it("rejects a tampered payload segment", () => {
    const code = signUnlockCode("user-123", SECRET);
    const [prefix, payload, sig] = code.split(".");
    const tampered = `${prefix}.${tamperFirstChar(payload)}.${sig}`;
    expect(() => verifyUnlockCode(tampered, SECRET)).not.toThrow();
    expect(verifyUnlockCode(tampered, SECRET).ok).toBe(false);
  });

  it("rejects a tampered signature segment", () => {
    const code = signUnlockCode("user-123", SECRET);
    const [prefix, payload, sig] = code.split(".");
    const tampered = `${prefix}.${payload}.${tamperFirstChar(sig)}`;
    expect(() => verifyUnlockCode(tampered, SECRET)).not.toThrow();
    expect(verifyUnlockCode(tampered, SECRET).ok).toBe(false);
  });

  it("rejects a correctly-formed code signed with a different secret", () => {
    const code = signUnlockCode("user-123", SECRET);
    expect(verifyUnlockCode(code, OTHER_SECRET).ok).toBe(false);
  });

  it("never throws and returns ok:false on malformed/empty/non-string input", () => {
    const badInputs: unknown[] = [
      "",
      "a.b",
      "a.b.c",
      "SF1.notbase64!!!.alsonotbase64!!!",
      "SF1.onlyoneseg",
      "SF1.a.b.c.d",
      null,
      undefined,
      12345,
      {},
      [],
      true,
    ];
    for (const input of badInputs) {
      expect(() => verifyUnlockCode(input as unknown as string, SECRET)).not.toThrow();
      expect(verifyUnlockCode(input as unknown as string, SECRET).ok).toBe(false);
    }
  });

  it("rejects a code with an unrecognized version prefix", () => {
    const code = signUnlockCode("user-123", SECRET);
    const [, payload, sig] = code.split(".");
    const tampered = `SF9.${payload}.${sig}`;
    expect(verifyUnlockCode(tampered, SECRET).ok).toBe(false);
  });
});

describe("mintCheckoutToken / verifyCheckoutToken", () => {
  it("is valid within the TTL for the same productId", () => {
    const token = mintCheckoutToken("smart-fella-tee", SECRET, 900);
    expect(verifyCheckoutToken(token, "smart-fella-tee", SECRET)).toBe(true);
  });

  it("defaults to a 900s TTL when ttlSec is omitted", () => {
    const token = mintCheckoutToken("smart-fella-tee", SECRET);
    expect(verifyCheckoutToken(token, "smart-fella-tee", SECRET)).toBe(true);
  });

  it("is invalid once expired (minted with a negative ttlSec)", () => {
    const token = mintCheckoutToken("smart-fella-tee", SECRET, -1);
    expect(verifyCheckoutToken(token, "smart-fella-tee", SECRET)).toBe(false);
  });

  it("rejects a token minted for a different productId (product binding)", () => {
    const token = mintCheckoutToken("smart-fella-tee", SECRET, 900);
    expect(verifyCheckoutToken(token, "fart-smella-tee", SECRET)).toBe(false);
  });

  it("rejects a tampered checkout token", () => {
    const token = mintCheckoutToken("smart-fella-tee", SECRET, 900);
    const parts = token.split(".");
    const lastIdx = parts.length - 1;
    parts[lastIdx] = tamperFirstChar(parts[lastIdx] ?? "");
    const tampered = parts.join(".");
    expect(() => verifyCheckoutToken(tampered, "smart-fella-tee", SECRET)).not.toThrow();
    expect(verifyCheckoutToken(tampered, "smart-fella-tee", SECRET)).toBe(false);
  });

  it("rejects a valid token verified with the wrong secret", () => {
    const token = mintCheckoutToken("smart-fella-tee", SECRET, 900);
    expect(verifyCheckoutToken(token, "smart-fella-tee", OTHER_SECRET)).toBe(false);
  });

  it("never throws and returns false on malformed/empty/non-string input", () => {
    const badInputs: unknown[] = ["", "a.b", "not-a-token", null, undefined, 42, {}];
    for (const input of badInputs) {
      expect(() =>
        verifyCheckoutToken(input as unknown as string, "smart-fella-tee", SECRET),
      ).not.toThrow();
      expect(verifyCheckoutToken(input as unknown as string, "smart-fella-tee", SECRET)).toBe(
        false,
      );
    }
  });
});

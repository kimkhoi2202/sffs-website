/**
 * A pointer, kept in this browser, to the last result it earned.
 *
 * ===========================================================================
 * WHY THIS EXISTS
 * ===========================================================================
 * The flow's own state is sessionStorage, per-tab and gone when the tab
 * closes, and that is the right lifetime for a half-finished test (see the
 * note at the top of ./session.ts). It is the wrong lifetime for a FINISHED
 * one. Someone who completed the test, handed over an address and closed the
 * tab has nothing left in this browser: coming back drops them on the opening
 * fork, and if the address they typed had a typo in it the result is simply
 * gone. That was observed — a return visit landing on `step: "audience"`
 * seventeen minutes after a completion.
 *
 * So the token gets its own key, in localStorage, with its own lifetime.
 *
 * ===========================================================================
 * WRITTEN ONLY AFTER A SEND, WHICH IS WHAT KEEPS THE GATE A GATE
 * ===========================================================================
 * The token exists from the moment the test ends, before any address is
 * asked for. Persisting it THEN would be a gate bypass with a delay on it:
 * abandon at the email box, come back tomorrow, and the offer below hands over
 * the unblurred results page. So the only caller is the successful-send path.
 * Nothing else may write this.
 *
 * ===========================================================================
 * WHAT IS IN IT, AND WHAT IS DELIBERATELY NOT
 * ===========================================================================
 * A token and a timestamp, both of which are read. NO SCORE AND NO VERDICT, so
 * a phone left on a kitchen table shows "your results are still here" and not
 * the result itself; seeing it takes a deliberate tap. No address either —
 * there is none to store, the same as everywhere else in this flow. No test id
 * either, which was in an earlier draft: the offer does not name the bank,
 * because the only name it could print for grades 7 and 8 is "Grade 7 and 8",
 * and telling somebody they sat a band rather than their grade is the exact
 * thing `displayTestTitle` exists to prevent.
 *
 * The token itself carries the answers and is signed rather than encrypted
 * (see ./result-token.ts), so anyone holding this browser can decode what is
 * in it. That is the same exposure as the link sitting in their inbox, and it
 * belongs to the person whose browser it is.
 *
 * NOTHING HERE TOUCHES POSTHOG. This is browser-local, no account and no
 * server state, and it must stay that way: the project holds no person
 * profiles and never calls `identify()`, so a durable per-browser handle to a
 * specific result must not become one by being attached to an analytics
 * identity.
 */

/** Bump when the shape changes so a stale entry is discarded, not crashed on. */
const STORAGE_KEY = "sffs_result_v1";

/**
 * Must match RESULT_TTL_SECONDS in ./result-token.ts, which is the real
 * expiry: the signature carries it and the results page enforces it.
 *
 * Mirrored rather than imported because that module reads `node:crypto` and
 * importing it from a client component is a build failure by design. Being a
 * touch conservative here is harmless; the cost of drifting the other way is
 * offering somebody a link that lands on "these results have gone".
 */
const MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

export interface SavedResult {
  /** The signed result token. Opens /results/[token]. */
  token: string;
  /** Epoch ms, for the age check above. */
  savedAt: number;
}

/**
 * Remember this result in this browser. Call ONLY after a send has succeeded.
 *
 * Overwrites whatever was there: the most recent result is the one a return
 * visit should be offered, and keeping a history would turn a convenience into
 * a record of everyone who has used this device.
 */
export function rememberResult(saved: SavedResult): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch {
    /* storage blocked (private mode) — the email is still the durable copy */
  }
}

export function loadSavedResult(): SavedResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedResult>;
    // Trust nothing from storage. A hand-edited or half-written value should
    // mean "no offer", never a broken card or a link to nowhere.
    if (typeof parsed?.token !== "string" || !parsed.token) return null;
    const savedAt = typeof parsed.savedAt === "number" ? parsed.savedAt : 0;
    if (!savedAt || Date.now() - savedAt > MAX_AGE_MS) return null;
    return { token: parsed.token, savedAt };
  } catch {
    return null; // storage blocked, or corrupt JSON
  }
}

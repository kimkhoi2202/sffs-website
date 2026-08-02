/**
 * Runtime switches the dev tools flip, read by ordinary production code.
 *
 * There is exactly one, and it exists because the send-failure path is the one
 * branch of the email flow that cannot be exercised by using the site normally:
 * you would have to break Resend to see it. A path nobody can trigger is a path
 * nobody has tested.
 *
 * WHY A MODULE AND NOT A PROP. Threading a `forceSendFailure` boolean from the
 * dev panel down through the flow, the results wrapper and into the email box
 * would put a dev-only parameter in the signature of three production
 * components. This keeps it to one import in one place.
 *
 * WHY IT IS SAFE TO SHIP. `process.env.NODE_ENV` is inlined at build time, so
 * in production the reader below is `return false` and the bundler can see
 * straight through it. The setter still exists but nothing production can reach
 * calls it, and even if something did, the reader ignores it. The failure mode
 * of this file being wrong is one email that does not send in development.
 */

let forceSendFailure = false;

/** Dev tools only. Has no effect on what `shouldForceSendFailure` returns in production. */
export function setForceSendFailure(value: boolean): void {
  forceSendFailure = value;
}

export function shouldForceSendFailure(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return forceSendFailure;
}

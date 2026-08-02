/**
 * The address a reply or an unsubscribe request goes to.
 *
 * Its own module, and not `server-only`, because it is a public fact. It is
 * printed in the results email, it is on the legal pages, and it goes out in
 * every List-Unsubscribe header, so there is nothing to protect.
 *
 * It moved out of lib/email/resend.ts for a concrete reason: that file IS
 * `server-only`, and importing it to read one constant dragged the whole Resend
 * client — and its throw-on-load marker — into anything that wanted the
 * address, including the plain-Node test for the email template. A shared
 * constant should not decide who is allowed to import it.
 */
export const SUPPORT_EMAIL = "smartfellaorfartsmella123@gmail.com";

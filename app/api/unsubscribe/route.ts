import { NextResponse, type NextRequest } from "next/server";

import { suppress } from "@/lib/email/suppression";
import { decodeUnsubscribeToken } from "@/lib/email/unsubscribe-token";

/**
 * Perform an unsubscribe. POST only.
 *
 * ===========================================================================
 * THERE IS NO GET HANDLER HERE, ON PURPOSE
 * ===========================================================================
 * Mail scanners, link-safety rewriters and some clients fetch every URL in a
 * message before a human sees it. A mutating GET lets those pre-fetches
 * unsubscribe people who never opened the mail, and it is invisible: the
 * request looks exactly like a real one. So the mutation lives behind POST,
 * which nothing pre-fetches, and app/unsubscribe/page.tsx serves the GET as a
 * one-button confirmation.
 *
 * ===========================================================================
 * TWO CALLERS, ONE BODY FORMAT EACH
 * ===========================================================================
 *   THE PAGE FORM sends `application/x-www-form-urlencoded` with `t`, and wants
 *   a redirect to a human-readable page.
 *   RFC 8058 ONE-CLICK is Gmail and Yahoo POSTing to the List-Unsubscribe URL
 *   with a body of `List-Unsubscribe=One-Click`. The token is in the QUERY
 *   STRING there, because the provider replays the URL verbatim and controls
 *   the body. It wants a 2xx and nothing else; it never renders a page.
 *
 * Both are accepted, and the token is read from the body first and the query
 * second so the form's copy wins when somehow both are present.
 *
 * ===========================================================================
 * IDEMPOTENT, AND SILENT ABOUT MEMBERSHIP
 * ===========================================================================
 * Unsubscribing an address that is already suppressed is a success. The table's
 * primary key makes the write a counter bump, and the response is byte-identical
 * either way. "You were already unsubscribed" would answer a question nobody
 * asked and would let anyone holding a token learn whether that address is on
 * the list.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** A token is small. Anything larger is not one of our two callers. */
const MAX_BODY_BYTES = 8 * 1024;

/**
 * Never indexed and never cached, at the header level as well as in the page
 * metadata. A cached unsubscribe response served to a second person would be
 * merely confusing; an indexed one puts live tokens in a search engine.
 */
const NO_STORE_HEADERS = {
  "cache-control": "no-store, max-age=0",
  "x-robots-tag": "noindex, nofollow, noarchive",
} as const;

async function tokenFrom(request: NextRequest): Promise<string> {
  const fromQuery = request.nextUrl.searchParams.get("t")?.trim() ?? "";

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return fromQuery;
  }

  try {
    const type = request.headers.get("content-type") ?? "";
    if (type.includes("form")) {
      const form = await request.formData();
      const value = form.get("t");
      if (typeof value === "string" && value.trim()) return value.trim();
    }
  } catch {
    // A one-click POST from a mail provider carries a body we do not parse and
    // do not need. Falling through to the query string is the correct path, not
    // an error.
  }
  return fromQuery;
}

/** True for the page form, which wants a page back. False for a provider. */
function wantsHtml(request: NextRequest): boolean {
  return (request.headers.get("accept") ?? "").includes("text/html");
}

export async function POST(request: NextRequest) {
  const token = await tokenFrom(request);
  const decoded = token ? decodeUnsubscribeToken(token) : null;

  if (!decoded?.ok) {
    /*
      A provider replaying a mangled URL gets a 400 and will not retry forever;
      a person gets the page, which tells them how to reach a human. Neither is
      told which of the three failure modes it was, so the endpoint cannot be
      used to probe for valid tokens.
    */
    if (wantsHtml(request)) {
      return NextResponse.redirect(new URL("/unsubscribe", request.url), {
        status: 303,
        headers: NO_STORE_HEADERS,
      });
    }
    return NextResponse.json(
      { ok: false, error: "invalid_token" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  try {
    await suppress(decoded.email, "unsubscribe", {
      // No IP and no user agent. The other write paths record them to tell
      // abuse from traffic, and there is no abuse to detect here: the worst a
      // flood of these can do is unsubscribe addresses whose tokens the sender
      // already holds. Logging who exercised a privacy choice, in order to
      // honour that privacy choice, is the wrong instinct.
      via: wantsHtml(request) ? "confirmation-page" : "one-click",
    });
  } catch (err) {
    /*
      NEVER CONFIRM A WRITE THAT DID NOT LAND. Showing "you are unsubscribed"
      over a failed insert is the worst outcome available here: the person stops
      looking for the problem, and the next send goes to them anyway. So the
      failure is loud, and the copy points at a human.
    */
    console.error(
      "unsubscribe: suppression write failed:",
      err instanceof Error ? err.message : err,
    );
    if (wantsHtml(request)) {
      return NextResponse.redirect(
        new URL("/unsubscribe/failed", request.url),
        { status: 303, headers: NO_STORE_HEADERS },
      );
    }
    // A 5xx tells a compliant provider to try again later, which is what we
    // want: the retry is free and idempotent.
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }

  if (wantsHtml(request)) {
    // POST-redirect-GET, to a URL with no token in it. See the note in
    // app/unsubscribe/done/page.tsx.
    return NextResponse.redirect(new URL("/unsubscribe/done", request.url), {
      status: 303,
      headers: NO_STORE_HEADERS,
    });
  }

  return NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS });
}

/**
 * Answer a GET honestly rather than 405-ing into a mail client's face.
 *
 * Some clients probe the List-Unsubscribe URL with a HEAD or GET before showing
 * their own unsubscribe affordance. Sending them to the confirmation page is
 * both the correct answer and the non-mutating one.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("t")?.trim() ?? "";
  const target = new URL("/unsubscribe", request.url);
  if (token) target.searchParams.set("t", token);
  return NextResponse.redirect(target, { status: 303, headers: NO_STORE_HEADERS });
}

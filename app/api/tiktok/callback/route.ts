import { NextResponse, type NextRequest } from "next/server";

import {
  COOKIE_OAUTH_STATE,
  COOKIE_PKCE_VERIFIER,
  COOKIE_SESSION,
  clearedCookieOptions,
  exchangeCodeForToken,
  fetchUserInfo,
  sealSession,
  sessionCookieOptions,
} from "@/lib/tiktok";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * OAuth callback. Verifies state, exchanges the code (with the PKCE verifier)
 * for tokens, enriches the session with basic profile info, and stores it in an
 * encrypted httpOnly cookie. Always redirects back to /tiktok with a status.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  // TikTok can return an error (e.g. the user declined).
  const oauthError = params.get("error");
  if (oauthError) {
    const description = params.get("error_description") || oauthError;
    return redirectToStudio(request, { error: description });
  }

  const code = params.get("code");
  const state = params.get("state");
  const storedState = request.cookies.get(COOKIE_OAUTH_STATE)?.value;
  const codeVerifier = request.cookies.get(COOKIE_PKCE_VERIFIER)?.value;

  if (
    !code ||
    !state ||
    !storedState ||
    state !== storedState ||
    !codeVerifier
  ) {
    return redirectToStudio(request, {
      error: "Sign-in could not be verified. Please try connecting again.",
    });
  }

  try {
    let session = await exchangeCodeForToken(code, codeVerifier);

    // Best-effort profile enrichment so the connected UI can show who we are.
    try {
      const info = await fetchUserInfo(session.accessToken);
      session = {
        ...session,
        openId: info.openId || session.openId,
        displayName: info.displayName,
        avatarUrl: info.avatarUrl,
      };
    } catch {
      // Non-fatal: we can still post without a display name.
    }

    const response = redirectToStudio(request, { connected: true });
    response.cookies.set(
      COOKIE_SESSION,
      sealSession(session),
      sessionCookieOptions(),
    );
    // Clear the one-time PKCE/state cookies.
    response.cookies.set(COOKIE_PKCE_VERIFIER, "", clearedCookieOptions());
    response.cookies.set(COOKIE_OAUTH_STATE, "", clearedCookieOptions());
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Token exchange failed.";
    return redirectToStudio(request, { error: message });
  }
}

function redirectToStudio(
  request: NextRequest,
  opts: { connected?: boolean; error?: string },
): NextResponse {
  const destination = new URL("/tiktok", request.nextUrl.origin);
  if (opts.connected) destination.searchParams.set("connected", "1");
  if (opts.error) destination.searchParams.set("error", opts.error);
  return NextResponse.redirect(destination);
}

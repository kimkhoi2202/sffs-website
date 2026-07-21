import { NextResponse, type NextRequest } from "next/server";

import {
  COOKIE_OAUTH_STATE,
  COOKIE_PKCE_VERIFIER,
  ephemeralCookieOptions,
  generatePkce,
  getTikTokConfig,
  randomState,
  TIKTOK_AUTHORIZE_URL,
  TIKTOK_SCOPES,
  TikTokConfigError,
} from "@/lib/tiktok";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Start the TikTok Login Kit OAuth flow.
 *
 * Generates a PKCE code_verifier/code_challenge (S256) + a random state, stores
 * the verifier and state in short-lived httpOnly cookies, then 302-redirects to
 * TikTok's authorize screen.
 */
export async function GET(request: NextRequest) {
  let config;
  try {
    config = getTikTokConfig();
  } catch (error) {
    if (error instanceof TikTokConfigError) {
      // Keep the user on the on-brand page with a friendly banner rather than
      // dumping a raw 500 (e.g. before the Vercel env vars are set).
      const destination = new URL("/tiktok", request.nextUrl.origin);
      destination.searchParams.set("error", error.message);
      return NextResponse.redirect(destination);
    }
    throw error;
  }

  const { codeVerifier, codeChallenge } = generatePkce();
  const state = randomState();

  const authorizeUrl = new URL(TIKTOK_AUTHORIZE_URL);
  authorizeUrl.searchParams.set("client_key", config.clientKey);
  authorizeUrl.searchParams.set("scope", TIKTOK_SCOPES.join(","));
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("redirect_uri", config.redirectUri);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("code_challenge", codeChallenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");

  const response = NextResponse.redirect(authorizeUrl.toString());
  const options = ephemeralCookieOptions();
  response.cookies.set(COOKIE_PKCE_VERIFIER, codeVerifier, options);
  response.cookies.set(COOKIE_OAUTH_STATE, state, options);
  return response;
}

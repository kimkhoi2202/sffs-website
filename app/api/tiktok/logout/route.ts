import { NextResponse, type NextRequest } from "next/server";

import { COOKIE_SESSION, clearedCookieOptions } from "@/lib/tiktok";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Disconnect: clear the stored TikTok session cookie and return to /tiktok. */
export async function GET(request: NextRequest) {
  const destination = new URL("/tiktok", request.nextUrl.origin);
  destination.searchParams.set("disconnected", "1");
  const response = NextResponse.redirect(destination);
  response.cookies.set(COOKIE_SESSION, "", clearedCookieOptions());
  return response;
}

import { NextResponse, type NextRequest } from "next/server";

import {
  COOKIE_SESSION,
  ensureFreshSession,
  openSession,
  queryCreatorInfo,
  sealSession,
  sessionCookieOptions,
} from "@/lib/tiktok";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Return the connected creator's allowed privacy options + interaction
 * capabilities, so the /tiktok UI can render a compliant post form. Never
 * returns tokens.
 */
export async function GET(request: NextRequest) {
  const session = openSession(request.cookies.get(COOKIE_SESSION)?.value);
  if (!session) {
    return NextResponse.json({ error: "not_connected" }, { status: 401 });
  }

  try {
    const { session: fresh, refreshed } = await ensureFreshSession(session);
    const creatorInfo = await queryCreatorInfo(fresh.accessToken);
    const response = NextResponse.json({ creatorInfo });
    if (refreshed) {
      response.cookies.set(
        COOKIE_SESSION,
        sealSession(fresh),
        sessionCookieOptions(),
      );
    }
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load creator info.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

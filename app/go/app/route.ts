import { type NextRequest, NextResponse } from "next/server";

import {
  APP_STORE_CAMPAIGN_URLS,
  decodeLaunchClickToken,
} from "@/lib/email/campaign-tracking";
import { APP_STORE_URL } from "@/lib/email/launch-email";
import { captureLaunchEmailClickServer } from "@/lib/posthog-server";

const PRIVATE_REDIRECT_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow",
};

export async function GET(req: NextRequest) {
  const decoded = decodeLaunchClickToken(req.nextUrl.searchParams.get("t") ?? "");
  if (!decoded.ok) {
    return NextResponse.redirect(APP_STORE_URL, {
      status: 307,
      headers: PRIVATE_REDIRECT_HEADERS,
    });
  }

  await captureLaunchEmailClickServer(req, decoded);
  return NextResponse.redirect(APP_STORE_CAMPAIGN_URLS[decoded.variant], {
    status: 307,
    headers: PRIVATE_REDIRECT_HEADERS,
  });
}

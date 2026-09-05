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
  const destination = decoded.campaign === "app-launch-hybrid-2026-09-05"
    ? "https://apps.apple.com/app/apple-store/id6794045991?pt=127639550&ct=SFFS%20Email%20Hybrid%20Sep%202026&mt=8"
    : APP_STORE_CAMPAIGN_URLS[decoded.variant];
  return NextResponse.redirect(destination, {
    status: 307,
    headers: PRIVATE_REDIRECT_HEADERS,
  });
}

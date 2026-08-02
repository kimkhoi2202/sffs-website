import { NextResponse } from "next/server";

import { emailStoreMode, emailStoreReason } from "@/lib/email-store-mode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * WHICH STORE IS A SIGNUP GOING TO? Read by the dev tools panel.
 *
 * The boundary in lib/email-store.ts announces itself in the server log, which
 * is the durable record, but a log line only appears once something has already
 * been written. The point of this endpoint is that the answer is visible BEFORE
 * you submit anything, because the moment worth knowing it is the moment before
 * you put a test address into the real list.
 *
 * 404s in production. It leaks nothing sensitive either way — the mode is a
 * boolean about our own configuration, not a credential, and the URL and secret
 * are never in the response — but an endpoint that exists only to serve a dev
 * panel has no business answering on the live site.
 */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }
  return NextResponse.json({
    mode: emailStoreMode(),
    reason: emailStoreReason(),
  });
}

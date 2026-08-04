import { NextResponse, type NextRequest } from "next/server";

import { clientIp, isRateLimited } from "@/lib/rate-limit";
import {
  SESSION_COOKIE_NAME,
  isUnconfigured,
  mintSessionCookie,
  passwordMatches,
} from "@/lib/dashboard/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Exchange the shared passphrase for a signed session cookie.
 *
 * The generic "That passphrase is not right" is deliberate: distinguishing
 * "wrong passphrase" from "no passphrase configured" would tell an unauthorised
 * caller which of the two situations they are in, and neither answer helps
 * anyone who is supposed to be here.
 */
export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  if (isRateLimited("dashboard-login", ip, { windowMs: 10 * 60_000, max: 10 })) {
    return NextResponse.json(
      { error: "Too many attempts. Wait ten minutes." },
      { status: 429 },
    );
  }

  if (isUnconfigured()) {
    return NextResponse.json({ error: "That passphrase is not right." }, { status: 401 });
  }

  let password: unknown;
  try {
    password = ((await req.json()) as { password?: unknown }).password;
  } catch {
    password = undefined;
  }

  if (!passwordMatches(password)) {
    return NextResponse.json({ error: "That passphrase is not right." }, { status: 401 });
  }

  const cookie = mintSessionCookie();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookie.name, cookie.value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: cookie.maxAge,
  });
  return res;
}

/** Sign out. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}

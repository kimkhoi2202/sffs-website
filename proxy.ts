import { NextResponse, type NextRequest } from "next/server";

// Keep the List-Unsubscribe URLs in already-sent mail working. A GET still
// displays the confirmation page; only POST invokes the suppression handler.
export function proxy(request: NextRequest) {
  if (request.method === "POST" && request.nextUrl.pathname === "/unsubscribe") {
    const target = request.nextUrl.clone();
    target.pathname = "/api/unsubscribe";
    return NextResponse.rewrite(target);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/unsubscribe"] };

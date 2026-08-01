/**
 * Render the results email in the browser without sending it. Dev tools only.
 *
 *   GET /api/test-results/preview-email?token=...&format=html|text
 *
 * ===========================================================================
 * WHY THIS ROUTE IS GUARDED DIFFERENTLY TO THE DEV PANEL
 * ===========================================================================
 * The dev PANEL is removed from production builds outright: its code sits
 * behind a branch the bundler deletes, and a postbuild check proves it is gone
 * (see components/test/dev/dev-tools-gate.tsx).
 *
 * A route handler cannot work that way. Next emits every file under app/ as a
 * route, so this endpoint exists in the build whatever it contains, and the
 * only real question is what it does when reached. The answer is: 404, before
 * anything else happens.
 *
 * The thing that keeps that honest is that there is NO DEV-ONLY CODE HERE to
 * leak. This handler is a guard and a call into `renderResultsEmail`, which is
 * production code that the send path uses anyway. Nothing about the email
 * template is exposed by this file that is not already in the bundle. So the
 * postbuild sentinel check is not weakened: it is still true that no dev-tools
 * module ships, and this route adds no new surface beyond an endpoint that
 * answers 404.
 *
 * It also reads only a token that the caller must already hold, and returns
 * only what that token's owner would receive by email anyway.
 */
import { NextResponse, type NextRequest } from "next/server";

import { getResult } from "@/lib/test/result-store";
import { renderResultsEmail } from "@/lib/test/results-email";
import { resultsUrlFor } from "@/lib/test/results-url";
import { displayTestTitle, getTestById } from "@/lib/test/tests";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // First statement in the handler. Nothing below it runs in production.
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not found", { status: 404 });
  }

  const token = request.nextUrl.searchParams.get("token") ?? "";
  const format = request.nextUrl.searchParams.get("format") === "text" ? "text" : "html";

  const record = token ? getResult(token) : null;
  if (!record) {
    return new NextResponse(
      "No result for that token. Finish a test first, or use the dev tools' " +
        "'jump to a stored result' control.",
      { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } },
    );
  }

  const test = getTestById(record.testId);
  if (!test) return new NextResponse("Unknown test", { status: 404 });

  const rendered = renderResultsEmail({
    audience: record.audience,
    testTitle: displayTestTitle(test, record.grade),
    score: record.score,
    maxScore: record.maxScore,
    resultsUrl: resultsUrlFor(record.token, request),
  });

  if (format === "text") {
    return new NextResponse(`Subject: ${rendered.subject}\n\n${rendered.text}`, {
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  return new NextResponse(rendered.html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

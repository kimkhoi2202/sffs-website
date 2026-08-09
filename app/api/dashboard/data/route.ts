import { NextResponse, type NextRequest } from "next/server";

import { isAuthenticated } from "@/lib/dashboard/auth";
import { PostHogQueryError, isQueryKeyConfigured } from "@/lib/dashboard/posthog-query";
import { parseRangeInput, resolveRange } from "@/lib/dashboard/time-range";
import { fetchTiles, fetchTraffic } from "@/lib/dashboard/queries";
import { fetchGrowth } from "@/lib/dashboard/growth";
import { fetchPeople } from "@/lib/dashboard/people";
import { fetchTestResults } from "@/lib/dashboard/test-results";
import { buildFunnel, groupIntoHumans, summariseAbandonment } from "@/lib/dashboard/funnel";
import { buildJourney } from "@/lib/dashboard/journey";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * A cold start measured 14.8s against the platform's 15s default, and the page
 * came up with an empty people list because the function was killed a moment
 * before ClickHouse answered. Warm it takes five. The ceiling is headroom for
 * the cold case and for a wide window, not an expectation — nothing here should
 * ever run for a minute, and if it does the concurrency gate is the thing to
 * look at.
 */
export const maxDuration = 60;

/**
 * The dashboard's only data endpoint.
 *
 * ===========================================================================
 * THE SHAPE OF THIS IS THE SECURITY PROPERTY
 * ===========================================================================
 * A caller sends a SECTION NAME, a time range preset and two booleans. It never
 * sends SQL. Every statement that reaches PostHog is assembled here from a
 * validated input by a named function.
 *
 * The tempting alternative — accept a HogQL string and forward it — would have
 * been a third of the code and would have turned one shared passphrase into
 * read access over the entire PostHog project, including tables this dashboard
 * has no business touching. The key is scoped to `query:read`, which is the
 * right scope for what this does and a very wrong scope to expose over HTTP.
 */

type Section = "tiles" | "people" | "journey" | "traffic" | "results" | "growth";

/**
 * Run something and report failure instead of throwing it.
 *
 * A single 429 from PostHog used to blank the entire page: one rejected promise
 * inside a `Promise.all` took the whole response with it, so a busy query
 * cluster looked like a broken dashboard. Each panel now fails on its own and
 * says so in place, and the rest of the page still renders.
 */
async function settle<T>(run: () => Promise<T>): Promise<{ data: T | null; error: string | null }> {
  try {
    return { data: await run(), error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { data: null, error: message };
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  if (!isQueryKeyConfigured()) {
    return NextResponse.json(
      {
        error:
          "POSTHOG_PERSONAL_API_KEY is not set on this deployment, so there is nothing to query.",
      },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const section = String(body.section ?? "tiles") as Section;
  const filtered = body.filtered !== false;
  const range = resolveRange(parseRangeInput(body.range));
  const meta = {
    range: { from: range.from, to: range.to, label: range.label, granularity: range.granularity },
    filtered,
  };

  try {
    if (section === "tiles") {
      const tiles = await settle(() => fetchTiles(range, filtered));
      return json({ ...meta, tiles: tiles.data, error: tiles.error });
    }

    if (section === "traffic") {
      const traffic = await settle(() => fetchTraffic(range, filtered));
      return json({ ...meta, ...(traffic.data ?? {}), error: traffic.error });
    }

    /*
      Completions come from the `test_results` warehouse mirror, not from
      events, so `filtered` is deliberately not forwarded to it — the export is
      already pre-filtered at source. It still rides along in `meta` so the
      client can echo the window it asked for.
    */
    if (section === "results") {
      const results = await settle(() => fetchTestResults(range));
      return json({ ...meta, ...(results.data ?? {}), error: results.error });
    }

    /*
      Growth reads BOTH sources — the event stream for the funnel and the
      channel table, the warehouse mirror for the deduplicated address count —
      and reports each one's age separately. `filtered` is forwarded because
      the event half needs it; the warehouse half ignores it, for the same
      reason `results` does.
    */
    if (section === "growth") {
      const growth = await settle(() => fetchGrowth(range, filtered));
      return json({ ...meta, ...(growth.data ?? {}), error: growth.error });
    }

    if (section === "people") {
      const result = await settle(() => fetchPeople(range, filtered));
      if (!result.data) {
        return json({ ...meta, humans: [], funnel: [], abandonment: [], error: result.error });
      }
      const humans = groupIntoHumans(result.data.people);
      return json({
        ...meta,
        humans: humans.map(publicHuman),
        funnel: buildFunnel(humans),
        abandonment: summariseAbandonment(humans),
        error: null,
      });
    }

    if (section === "journey") {
      const humanId = String(body.humanId ?? "");
      if (!humanId) {
        return NextResponse.json({ error: "humanId is required." }, { status: 400 });
      }
      const { people } = await fetchPeople(range, filtered);
      const humans = groupIntoHumans(people);
      const human =
        humans.find((h) => h.id === humanId) ??
        humans.find((h) => h.members.some((m) => m.personId === humanId));
      if (!human) {
        return NextResponse.json({ error: "No such person in this range." }, { status: 404 });
      }
      const journey = await buildJourney(human);
      return json({ human: publicHuman(human), ...journey });
    }

    return NextResponse.json({ error: "Unknown section." }, { status: 400 });
  } catch (error) {
    if (error instanceof PostHogQueryError) {
      // Surface PostHog's own complaint: at this scale the reader is the person
      // who can fix it, and a generic "something went wrong" wastes their time.
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function json(payload: unknown) {
  return NextResponse.json(payload, {
    headers: {
      // Nothing here may sit in a shared cache, and nothing here should be
      // indexed even if a URL leaks.
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

/** Flatten a Human for the wire — the client never needs the union-find state. */
function publicHuman(human: ReturnType<typeof groupIntoHumans>[number]) {
  const p = human.primary;
  return {
    id: human.id,
    personIds: human.members.map((m) => m.personId),
    email: human.email,
    untracked: human.untracked,
    headline: p.headline,
    firstSeen: p.firstSeen,
    lastSeen: p.lastSeen,
    channel: p.channel,
    rung: p.rung,
    evidence: p.evidence,
    country: p.country,
    countryCode: p.countryCode,
    city: p.city,
    region: p.region,
    device: p.device,
    browser: p.browser,
    os: p.os,
    isInternal: human.members.some((m) => m.isInternal),
    outcome: p.outcome,
    audience: p.audience,
    testId: p.startedTestId,
    score: p.score,
    maxScore: p.maxScore,
    answered: p.answeredAtEnd,
    timedOut: p.timedOut,
    elapsedSeconds: p.elapsedSeconds,
    verdict: p.verdict,
    furthestQuestion: human.furthestQuestion,
    questionsAnswered: human.questionsAnswered,
    questionTotal: human.questionTotal,
    landed: human.landed,
    ctaActivated: human.ctaActivated,
    startedTest: human.startedTest,
    reachedGate: human.reachedGate,
    submittedEmail: human.submittedEmail,
    openedResults: human.openedResults,
    resultsOpens: human.resultsOpens,
    resultsDwellSeconds: human.resultsDwellSeconds,
    resultsTotalSeconds: human.resultsTotalSeconds,
    events: human.members.reduce((acc, m) => acc + m.events, 0),
    pageviews: human.members.reduce((acc, m) => acc + m.pageviews, 0),
    sessions: human.members.reduce((acc, m) => acc + m.sessions, 0),
    shareEvents: human.members.reduce((acc, m) => acc + m.shareEvents, 0),
    shareDestinations: [...new Set(human.members.flatMap((m) => m.shareDestinations))],
    deadClicks: human.members.reduce((acc, m) => acc + m.deadClicks, 0),
    links: human.links,
  };
}

export type PublicHuman = ReturnType<typeof publicHuman>;

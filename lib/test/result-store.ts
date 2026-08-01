/**
 * Where a finished test goes so a link in an email can render it later.
 *
 * ===========================================================================
 * WHY THE RESULT IS STORED AND NOT PUT IN THE URL
 * ===========================================================================
 * The obvious cheap version is to sign the score into the link. Do not: a URL
 * that carries the score is a URL people edit, and the first person to notice
 * `?score=12` becomes the second person to post `?score=50`. Signing it stops
 * forgery but still leaks the whole result to anything that logs URLs, and it
 * makes the link enormous.
 *
 * So the link carries only an opaque token, and everything renderable lives
 * here. The URL says nothing about what it opens.
 *
 * ===========================================================================
 * WHAT IS DELIBERATELY NOT IN A RECORD
 * ===========================================================================
 * THE EMAIL ADDRESS. A record holds a score, the answers, and counters. It is
 * not personal data and it is not joined to any. The address the results were
 * sent to goes to Aurora through the existing signup path and stops there; the
 * only place the two ever meet is inside the request that sends the mail.
 *
 * That has one visible consequence: "resend" re-posts the address from the
 * browser rather than looking one up, because there is nothing to look up. That
 * is the intended trade. It also means a stolen token leaks a score and nothing
 * else, which is the right blast radius for a joke test.
 *
 * ===========================================================================
 * EXPIRY: TWELVE MONTHS, AND THE LINK NEVER EXPIRES BEFORE THAT
 * ===========================================================================
 * Short expiry is the reflex and it is wrong here. The whole point of mailing
 * someone a link is that they come back to it — showing a partner, showing the
 * kid's grandparent, digging it out of the inbox in a fortnight. A 24-hour or
 * 7-day token would break exactly the behaviour the feature exists to create,
 * and "your results have expired" for a score somebody was proud of is a bad
 * moment we would have chosen to build.
 *
 * Twelve months is long enough that essentially nobody reaches it, and short
 * enough that a site whose privacy policy promises to keep collection small is
 * not silently accumulating results forever. Past it, the record is gone and
 * the page says so plainly with a button to take the test again — see
 * app/results/[token]/page.tsx.
 *
 * ===========================================================================
 * THE STORAGE ITSELF
 * ===========================================================================
 * A JSON file under .data/ (gitignored), with an in-memory fallback when the
 * filesystem is read-only. That is a LOCAL implementation and it is honest
 * about being one: it does not survive a deploy and it does not work across
 * instances.
 *
 * It is behind this module's four functions on purpose. Production wants
 * Aurora (the email proxy Lambda already fronts it) or a KV store, and swapping
 * to either means rewriting this file and nothing else. Nothing above it knows
 * how a record is stored.
 */
import "server-only";

import { randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import type { AnswerMap } from "./scoring";
import type { Audience, Grade, GradeBand } from "./types";

/** Twelve months. See the note above before shortening this. */
export const RESULT_TTL_MS = 365 * 24 * 60 * 60 * 1000;

/** Total emails that may ever be sent for one result. The abuse ceiling. */
export const MAX_SENDS_PER_RESULT = 5;

export interface StoredResult {
  token: string;
  testId: string;
  audience: Audience;
  band: GradeBand;
  grade: Grade | null;
  /** item id -> chosen option id. Re-scored on read so the page shows a breakdown. */
  answers: AnswerMap;
  score: number;
  maxScore: number;
  answered: number;
  elapsedSeconds: number;
  timedOut: boolean;
  /** Epoch ms. */
  createdAt: number;
  /** How many emails have gone out for this result. Capped, and durable. */
  sendCount: number;
}

/**
 * 32 URL-safe characters from 24 random bytes: 192 bits. Not a UUID (v4 carries
 * version bits and reads as a database id people try to enumerate), not derived
 * from the email, the score or a counter. There is nothing to guess and nothing
 * to infer from one token about another.
 */
export function newToken(): string {
  return randomBytes(24).toString("base64url");
}

/* -------------------------------------------------------------------------
 * The local JSON file
 * ----------------------------------------------------------------------- */

const FILE = join(process.cwd(), ".data", "results.json");

/** Also the whole store when the filesystem is not writable. */
const memory = new Map<string, StoredResult>();
let fileWritable = true;

function readAll(): Map<string, StoredResult> {
  if (!fileWritable) return memory;
  try {
    const raw = readFileSync(FILE, "utf8");
    const parsed = JSON.parse(raw) as Record<string, StoredResult>;
    return new Map(Object.entries(parsed));
  } catch {
    // Missing or corrupt: an empty store is the right recovery, since the only
    // thing lost is results whose links were already unreadable.
    return new Map(memory);
  }
}

function writeAll(all: Map<string, StoredResult>): void {
  if (!fileWritable) {
    memory.clear();
    for (const [k, v] of all) memory.set(k, v);
    return;
  }
  try {
    mkdirSync(dirname(FILE), { recursive: true });
    writeFileSync(FILE, JSON.stringify(Object.fromEntries(all), null, 2), "utf8");
  } catch {
    // Read-only filesystem. Fall back to memory for the rest of this process
    // rather than failing a request the visitor cannot do anything about.
    fileWritable = false;
    memory.clear();
    for (const [k, v] of all) memory.set(k, v);
  }
}

/** Drop anything past its TTL. Cheap, and runs on write rather than on a timer. */
function prune(all: Map<string, StoredResult>): Map<string, StoredResult> {
  const cutoff = Date.now() - RESULT_TTL_MS;
  for (const [token, record] of all) {
    if (record.createdAt < cutoff) all.delete(token);
  }
  return all;
}

/* -------------------------------------------------------------------------
 * The interface everything above this file uses
 * ----------------------------------------------------------------------- */

export function saveResult(
  record: Omit<StoredResult, "token" | "createdAt" | "sendCount">,
): StoredResult {
  const stored: StoredResult = {
    ...record,
    token: newToken(),
    createdAt: Date.now(),
    sendCount: 0,
  };
  const all = prune(readAll());
  all.set(stored.token, stored);
  writeAll(all);
  return stored;
}

/** Null for both "never existed" and "expired". The caller cannot tell them
 *  apart, and should not: both mean the same thing to a visitor. */
export function getResult(token: string): StoredResult | null {
  const record = readAll().get(token);
  if (!record) return null;
  if (Date.now() - record.createdAt > RESULT_TTL_MS) return null;
  return record;
}

/**
 * Count a send against the record. Returns the new count, or null when the cap
 * has already been reached.
 *
 * Durable rather than in-memory, deliberately: the per-IP limiter resets when
 * an instance recycles, but this ceiling is written down next to the result and
 * therefore holds across restarts and across instances.
 */
export function recordSend(token: string): number | null {
  const all = readAll();
  const record = all.get(token);
  if (!record) return null;
  if (record.sendCount >= MAX_SENDS_PER_RESULT) return null;
  record.sendCount += 1;
  all.set(token, record);
  writeAll(all);
  return record.sendCount;
}

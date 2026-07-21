/*
  Server-only helpers for the SFFS Creator Studio TikTok integration.

  Implements TikTok Login Kit (OAuth 2.0 + PKCE) and the Content Posting API
  (Direct Post, FILE_UPLOAD). This module touches secrets and node:crypto, so it
  must NEVER be imported from a Client Component — only from route handlers
  (app/api/tiktok/*) and the /tiktok Server Component. Tokens are stored in an
  encrypted, httpOnly cookie and are never exposed to client JS.

  Two TikTok-specific gotchas encoded here on purpose:
    1. PKCE code_challenge is HEX(SHA256(verifier)), NOT the standard base64url.
       (See generatePkce — do not "fix" it to base64url.)
    2. creator_info/query is a POST (not GET), and Direct Post initializes at
       /v2/post/publish/video/init/ with source=FILE_UPLOAD.
*/

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  hkdfSync,
  randomBytes,
} from "node:crypto";

// --------------------------------------------------------------------------
// Endpoints & constants
// --------------------------------------------------------------------------

export const TIKTOK_AUTHORIZE_URL = "https://www.tiktok.com/v2/auth/authorize/";
const TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const USER_INFO_URL = "https://open.tiktokapis.com/v2/user/info/";
const CREATOR_INFO_URL =
  "https://open.tiktokapis.com/v2/post/publish/creator_info/query/";
const VIDEO_INIT_URL =
  "https://open.tiktokapis.com/v2/post/publish/video/init/";
const STATUS_FETCH_URL =
  "https://open.tiktokapis.com/v2/post/publish/status/fetch/";

/** Scopes we request: read basic profile + publish videos (Direct Post). */
export const TIKTOK_SCOPES = ["user.info.basic", "video.publish"] as const;

/**
 * Redirect URI. Must EXACTLY match the value registered in the TikTok portal.
 * Defaults to the production callback; override via TIKTOK_REDIRECT_URI for
 * local dev (and register that value in the portal too).
 */
export const DEFAULT_REDIRECT_URI =
  "https://www.smartfellaorfartsmella.com/api/tiktok/callback";

// Cookie names.
export const COOKIE_PKCE_VERIFIER = "tiktok_pkce_verifier";
export const COOKIE_OAUTH_STATE = "tiktok_oauth_state";
export const COOKIE_SESSION = "tiktok_session";

// Chunked-upload limits from the Content Posting API media-transfer guide.
const MIN_CHUNK = 5 * 1024 * 1024; // 5 MB
const MAX_CHUNK = 64 * 1024 * 1024; // 64 MB

// Session cookie lives up to 60 days (the access token inside is short-lived and
// refreshed on demand; the refresh token typically lasts ~1 year).
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 60;
const EPHEMERAL_MAX_AGE_SECONDS = 600; // 10 min for the PKCE/state handshake

// --------------------------------------------------------------------------
// Errors
// --------------------------------------------------------------------------

/** Thrown when required env configuration is missing. */
export class TikTokConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TikTokConfigError";
  }
}

/** Thrown when a TikTok API call fails. */
export class TikTokApiError extends Error {
  logId?: string;
  constructor(message: string, logId?: string) {
    super(message);
    this.name = "TikTokApiError";
    this.logId = logId;
  }
}

// --------------------------------------------------------------------------
// Config
// --------------------------------------------------------------------------

export interface TikTokConfig {
  clientKey: string;
  clientSecret: string;
  redirectUri: string;
}

/** Read required credentials from the environment (never hardcoded). */
export function getTikTokConfig(): TikTokConfig {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  if (!clientKey || !clientSecret) {
    throw new TikTokConfigError(
      "TikTok is not configured. Set TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET in the environment.",
    );
  }
  const redirectUri = process.env.TIKTOK_REDIRECT_URI || DEFAULT_REDIRECT_URI;
  return { clientKey, clientSecret, redirectUri };
}

// --------------------------------------------------------------------------
// Cookie option builders (kept free of next/server types so this stays
// framework-agnostic; route handlers spread these into res.cookies.set()).
// --------------------------------------------------------------------------

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export function ephemeralCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: EPHEMERAL_MAX_AGE_SECONDS,
  };
}

export function clearedCookieOptions() {
  return { ...sessionCookieOptions(), maxAge: 0 };
}

// --------------------------------------------------------------------------
// PKCE + state
// --------------------------------------------------------------------------

const PKCE_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

/**
 * Generate a fresh PKCE pair. TikTok requires HEX(SHA256(code_verifier)) for the
 * challenge (its documented quirk), with code_challenge_method still set to
 * "S256". The verifier is 64 chars from the unreserved set.
 */
export function generatePkce(): { codeVerifier: string; codeChallenge: string } {
  const bytes = randomBytes(64);
  let codeVerifier = "";
  for (let i = 0; i < bytes.length; i++) {
    codeVerifier += PKCE_CHARS[bytes[i] % PKCE_CHARS.length];
  }
  const codeChallenge = createHash("sha256").update(codeVerifier).digest("hex");
  return { codeVerifier, codeChallenge };
}

/** Random anti-CSRF state token. */
export function randomState(): string {
  return randomBytes(16).toString("hex");
}

// --------------------------------------------------------------------------
// Encrypted session cookie (AES-256-GCM)
// --------------------------------------------------------------------------

export interface TikTokSession {
  accessToken: string;
  refreshToken: string;
  openId: string;
  scope: string;
  /** Epoch ms when the access token expires. */
  expiresAt: number;
  /** Epoch ms when the refresh token expires. */
  refreshExpiresAt: number;
  displayName?: string;
  avatarUrl?: string;
}

function getEncryptionKey(): Buffer {
  const secret =
    process.env.TIKTOK_TOKEN_SECRET || process.env.TIKTOK_CLIENT_SECRET;
  if (!secret) {
    throw new TikTokConfigError(
      "Missing token encryption secret (set TIKTOK_CLIENT_SECRET or TIKTOK_TOKEN_SECRET).",
    );
  }
  // Derive a stable 32-byte key from the secret. Rotating the secret simply
  // invalidates existing session cookies (forcing a harmless re-connect).
  const derived = hkdfSync(
    "sha256",
    secret,
    "sffs-tiktok-salt",
    "sffs-tiktok-session-v1",
    32,
  );
  return Buffer.from(derived);
}

/** Encrypt a session into an opaque base64url string for cookie storage. */
export function sealSession(session: TikTokSession): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const plaintext = Buffer.from(JSON.stringify(session), "utf8");
  const enc = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64url");
}

/** Decrypt a sealed session; returns null if missing/tampered/undecryptable. */
export function openSession(
  value: string | undefined | null,
): TikTokSession | null {
  if (!value) return null;
  try {
    const raw = Buffer.from(value, "base64url");
    if (raw.length < 12 + 16 + 1) return null;
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const enc = raw.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
    return JSON.parse(dec.toString("utf8")) as TikTokSession;
  } catch {
    return null;
  }
}

// --------------------------------------------------------------------------
// OAuth token exchange & refresh
// --------------------------------------------------------------------------

interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  open_id?: string;
  refresh_token?: string;
  refresh_expires_in?: number;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
  log_id?: string;
}

function tokenResponseToSession(data: TokenResponse): TikTokSession {
  const now = Date.now();
  return {
    accessToken: data.access_token as string,
    refreshToken: data.refresh_token as string,
    openId: data.open_id ?? "",
    scope: data.scope ?? "",
    expiresAt: now + (data.expires_in ?? 0) * 1000,
    refreshExpiresAt: now + (data.refresh_expires_in ?? 0) * 1000,
  };
}

async function postToken(body: URLSearchParams): Promise<TikTokSession> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cache-Control": "no-cache",
    },
    body,
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as TokenResponse;
  if (!res.ok || data.error || !data.access_token) {
    throw new TikTokApiError(
      data.error_description ||
        data.error ||
        `TikTok token request failed (${res.status}).`,
      data.log_id,
    );
  }
  return tokenResponseToSession(data);
}

/** Exchange an authorization code (+ PKCE verifier) for tokens. */
export async function exchangeCodeForToken(
  code: string,
  codeVerifier: string,
): Promise<TikTokSession> {
  const { clientKey, clientSecret, redirectUri } = getTikTokConfig();
  return postToken(
    new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  );
}

/** Exchange a refresh token for a new access/refresh token pair. */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<TikTokSession> {
  const { clientKey, clientSecret } = getTikTokConfig();
  return postToken(
    new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  );
}

/**
 * Return a session with a valid access token, refreshing if it expires within
 * 60s. `refreshed` tells the caller to re-persist the session cookie.
 */
export async function ensureFreshSession(
  session: TikTokSession,
): Promise<{ session: TikTokSession; refreshed: boolean }> {
  if (Date.now() < session.expiresAt - 60_000) {
    return { session, refreshed: false };
  }
  const refreshed = await refreshAccessToken(session.refreshToken);
  return {
    session: {
      ...refreshed,
      // Preserve display info across refreshes for the connected UI.
      openId: refreshed.openId || session.openId,
      displayName: session.displayName,
      avatarUrl: session.avatarUrl,
    },
    refreshed: true,
  };
}

// --------------------------------------------------------------------------
// TikTok "business" API envelope (user.info, creator_info, publish, status)
// --------------------------------------------------------------------------

interface TikTokEnvelope<T> {
  data?: T;
  error?: { code?: string; message?: string; log_id?: string };
}

function assertBusinessOk(
  res: Response,
  envelope: TikTokEnvelope<unknown>,
  fallback: string,
): void {
  const code = envelope.error?.code;
  if (!res.ok || (code && code !== "ok")) {
    throw new TikTokApiError(
      envelope.error?.message || `${fallback} (${res.status}).`,
      envelope.error?.log_id,
    );
  }
}

// ---- user.info.basic ----

interface UserInfoData {
  user?: { open_id?: string; display_name?: string; avatar_url?: string };
}

export async function fetchUserInfo(accessToken: string): Promise<{
  openId?: string;
  displayName?: string;
  avatarUrl?: string;
}> {
  const url = new URL(USER_INFO_URL);
  url.searchParams.set("fields", "open_id,display_name,avatar_url");
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as TikTokEnvelope<UserInfoData>;
  assertBusinessOk(res, json, "Failed to load TikTok profile");
  const user = json.data?.user ?? {};
  return {
    openId: user.open_id,
    displayName: user.display_name,
    avatarUrl: user.avatar_url,
  };
}

// ---- creator_info/query ----

export interface CreatorInfo {
  creatorNickname?: string;
  creatorUsername?: string;
  creatorAvatarUrl?: string;
  privacyLevelOptions: string[];
  commentDisabled: boolean;
  duetDisabled: boolean;
  stitchDisabled: boolean;
  maxVideoPostDurationSec?: number;
}

interface CreatorInfoData {
  creator_nickname?: string;
  creator_username?: string;
  creator_avatar_url?: string;
  privacy_level_options?: string[];
  comment_disabled?: boolean;
  duet_disabled?: boolean;
  stitch_disabled?: boolean;
  max_video_post_duration_sec?: number;
}

/** Query the creator's allowed privacy options + interaction capabilities. */
export async function queryCreatorInfo(
  accessToken: string,
): Promise<CreatorInfo> {
  const res = await fetch(CREATOR_INFO_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as TikTokEnvelope<CreatorInfoData>;
  assertBusinessOk(res, json, "Failed to query creator info");
  const d = json.data ?? {};
  return {
    creatorNickname: d.creator_nickname,
    creatorUsername: d.creator_username,
    creatorAvatarUrl: d.creator_avatar_url,
    privacyLevelOptions: d.privacy_level_options ?? [],
    commentDisabled: Boolean(d.comment_disabled),
    duetDisabled: Boolean(d.duet_disabled),
    stitchDisabled: Boolean(d.stitch_disabled),
    maxVideoPostDurationSec: d.max_video_post_duration_sec,
  };
}

// ---- Direct Post init + chunked upload + status ----

export interface DirectPostInit {
  title: string;
  privacyLevel: string;
  disableComment: boolean;
  disableDuet: boolean;
  disableStitch: boolean;
  videoSize: number;
  chunkSize: number;
  totalChunkCount: number;
}

interface VideoInitData {
  publish_id?: string;
  upload_url?: string;
}

export async function initDirectPost(
  accessToken: string,
  init: DirectPostInit,
): Promise<{ publishId: string; uploadUrl: string }> {
  const res = await fetch(VIDEO_INIT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    cache: "no-store",
    body: JSON.stringify({
      post_info: {
        title: init.title,
        privacy_level: init.privacyLevel,
        disable_comment: init.disableComment,
        disable_duet: init.disableDuet,
        disable_stitch: init.disableStitch,
        video_cover_timestamp_ms: 1000,
      },
      source_info: {
        source: "FILE_UPLOAD",
        video_size: init.videoSize,
        chunk_size: init.chunkSize,
        total_chunk_count: init.totalChunkCount,
      },
    }),
  });
  const json = (await res.json().catch(() => ({}))) as TikTokEnvelope<VideoInitData>;
  assertBusinessOk(res, json, "Failed to initialize TikTok upload");
  const publishId = json.data?.publish_id;
  const uploadUrl = json.data?.upload_url;
  if (!publishId || !uploadUrl) {
    throw new TikTokApiError("TikTok did not return an upload URL.");
  }
  return { publishId, uploadUrl };
}

/**
 * Pick a chunk size + count that satisfies TikTok's rules:
 *   - total_chunk_count = floor(video_size / chunk_size)
 *   - each chunk in [5MB, 64MB]; the FINAL chunk absorbs the remainder (<=128MB)
 *   - <=64MB total => a single whole-file chunk
 *   - >64MB total => at least two chunks
 */
export function computeChunking(videoSize: number): {
  chunkSize: number;
  totalChunkCount: number;
} {
  if (videoSize <= MAX_CHUNK) {
    return { chunkSize: videoSize, totalChunkCount: 1 };
  }
  let chunkSize = MAX_CHUNK;
  let totalChunkCount = Math.floor(videoSize / chunkSize);
  if (totalChunkCount < 2) {
    // 64MB < size <= 128MB: split into two roughly-equal, in-range chunks.
    totalChunkCount = 2;
    chunkSize = Math.floor(videoSize / 2);
  }
  // Defensive clamp so a computed chunk never dips below the 5MB floor.
  if (chunkSize < MIN_CHUNK) chunkSize = MIN_CHUNK;
  return { chunkSize, totalChunkCount };
}

/** Upload the video bytes to the init upload_url, sequentially by chunk. */
export async function uploadVideo(
  uploadUrl: string,
  data: Buffer,
  chunkSize: number,
  totalChunkCount: number,
  mimeType = "video/mp4",
): Promise<void> {
  const total = data.length;
  for (let i = 0; i < totalChunkCount; i++) {
    const start = i * chunkSize;
    // The last chunk runs to the end of the file (may exceed chunkSize).
    const end = i === totalChunkCount - 1 ? total - 1 : start + chunkSize - 1;
    // Copy into a fresh Uint8Array (plain ArrayBuffer backing) so it is an
    // unambiguous BodyInit; undici derives Content-Length. Content-Range is the
    // header TikTok requires.
    const chunk = new Uint8Array(end + 1 - start);
    chunk.set(data.subarray(start, end + 1));
    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": mimeType,
        "Content-Range": `bytes ${start}-${end}/${total}`,
      },
      body: chunk,
      cache: "no-store",
    });
    // TikTok returns 206 for partial chunks and 200/201 once the file is whole.
    if (![200, 201, 206].includes(res.status)) {
      const text = await res.text().catch(() => "");
      throw new TikTokApiError(
        `Chunk ${i + 1}/${totalChunkCount} upload failed (${res.status}). ${text.slice(0, 200)}`.trim(),
      );
    }
  }
}

export interface PublishStatus {
  status: string;
  failReason?: string;
  publiclyAvailablePostId?: string[];
}

interface StatusData {
  status?: string;
  fail_reason?: string;
  publicaly_available_post_id?: string[];
  publicly_available_post_id?: string[];
}

export async function fetchPublishStatus(
  accessToken: string,
  publishId: string,
): Promise<PublishStatus> {
  const res = await fetch(STATUS_FETCH_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    cache: "no-store",
    body: JSON.stringify({ publish_id: publishId }),
  });
  const json = (await res.json().catch(() => ({}))) as TikTokEnvelope<StatusData>;
  assertBusinessOk(res, json, "Failed to fetch publish status");
  const d = json.data ?? {};
  return {
    status: d.status ?? "UNKNOWN",
    failReason: d.fail_reason,
    // TikTok has shipped both spellings of this field over time.
    publiclyAvailablePostId:
      d.publicly_available_post_id ?? d.publicaly_available_post_id,
  };
}

import { NextResponse, type NextRequest } from "next/server";

import {
  COOKIE_SESSION,
  computeChunking,
  ensureFreshSession,
  fetchPublishStatus,
  initDirectPost,
  openSession,
  queryCreatorInfo,
  sealSession,
  sessionCookieOptions,
  uploadVideo,
} from "@/lib/tiktok";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Uploading + init + status can take a while for larger clips.
export const maxDuration = 60;

// Hard guardrail on how much we buffer in the function's memory.
const MAX_VIDEO_BYTES = 300 * 1024 * 1024;
const MAX_CAPTION_LENGTH = 2200;

interface PostJsonBody {
  videoUrl?: string;
  caption?: string;
  privacyLevel?: string;
  disableComment?: boolean;
  disableDuet?: boolean;
  disableStitch?: boolean;
}

interface ParsedRequest {
  videoBytes: Buffer;
  mimeType: string;
  caption: string;
  privacyLevel: string;
  disableComment: boolean;
  disableDuet: boolean;
  disableStitch: boolean;
}

/**
 * Publish a video to the connected TikTok account via Direct Post.
 *
 * Flow: query creator_info (validate the requested privacy_level) -> init a
 * FILE_UPLOAD Direct Post -> chunk-upload the mp4 -> return the publish status.
 *
 * Accepts either:
 *   - multipart/form-data with a `video` file (the file picker), or
 *   - application/json with a same-origin `videoUrl` (a hosted sample), which
 *     the server fetches itself (avoids the ~4.5MB inbound function body limit
 *     for larger, already-rendered shorts).
 */
export async function POST(request: NextRequest) {
  const session = openSession(request.cookies.get(COOKIE_SESSION)?.value);
  if (!session) {
    return NextResponse.json(
      { error: "Not connected to TikTok. Connect the account first." },
      { status: 401 },
    );
  }

  let parsed: ParsedRequest;
  try {
    parsed = await parseRequest(request);
  } catch (error) {
    const status = error instanceof RequestError ? error.status : 400;
    const message =
      error instanceof Error ? error.message : "Could not read the request.";
    return NextResponse.json({ error: message }, { status });
  }

  try {
    const { session: fresh, refreshed } = await ensureFreshSession(session);

    // 1) creator_info: authoritative source for allowed privacy + capabilities.
    const creator = await queryCreatorInfo(fresh.accessToken);
    const options = creator.privacyLevelOptions;
    let privacyLevel = parsed.privacyLevel;
    if (options.length > 0 && !options.includes(privacyLevel)) {
      return NextResponse.json(
        {
          error: `"${privacyLevel}" is not an allowed privacy level for this account.`,
          allowedPrivacyLevels: options,
        },
        { status: 400 },
      );
    }
    if (options.length > 0 && !privacyLevel) {
      privacyLevel = options.includes("SELF_ONLY") ? "SELF_ONLY" : options[0];
    }

    // Never enable an interaction the creator has disabled at the account level.
    const disableComment = parsed.disableComment || creator.commentDisabled;
    const disableDuet = parsed.disableDuet || creator.duetDisabled;
    const disableStitch = parsed.disableStitch || creator.stitchDisabled;

    // 2) init the Direct Post upload.
    const { chunkSize, totalChunkCount } = computeChunking(
      parsed.videoBytes.length,
    );
    const { publishId, uploadUrl } = await initDirectPost(fresh.accessToken, {
      title: parsed.caption,
      privacyLevel,
      disableComment,
      disableDuet,
      disableStitch,
      videoSize: parsed.videoBytes.length,
      chunkSize,
      totalChunkCount,
    });

    // 3) upload the bytes.
    await uploadVideo(
      uploadUrl,
      parsed.videoBytes,
      chunkSize,
      totalChunkCount,
      parsed.mimeType,
    );

    // 4) best-effort initial status (publishing continues asynchronously).
    let status = "PROCESSING_UPLOAD";
    try {
      const result = await fetchPublishStatus(fresh.accessToken, publishId);
      status = result.status;
    } catch {
      // Non-fatal: the post was accepted; status can be polled later.
    }

    const response = NextResponse.json({
      ok: true,
      publishId,
      status,
      privacyLevel,
      note:
        privacyLevel === "SELF_ONLY"
          ? "Posted privately (visible only to the account owner). Unaudited apps can only post privately."
          : undefined,
    });
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
      error instanceof Error ? error.message : "Failed to post to TikTok.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

class RequestError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function parseRequest(request: NextRequest): Promise<ParsedRequest> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      throw new RequestError(
        "Upload failed. Vercel limits direct file uploads to ~4.5MB. Use a hosted sample for larger clips.",
        413,
      );
    }
    const file = form.get("video");
    if (!(file instanceof File) || file.size === 0) {
      throw new RequestError("No video file was provided.", 400);
    }
    if (file.size > MAX_VIDEO_BYTES) {
      throw new RequestError("That video is too large to post.", 413);
    }
    return {
      videoBytes: Buffer.from(await file.arrayBuffer()),
      mimeType: file.type || "video/mp4",
      caption: sanitizeCaption(form.get("caption")),
      privacyLevel: asString(form.get("privacy_level")) || "SELF_ONLY",
      disableComment: form.get("disable_comment") === "true",
      disableDuet: form.get("disable_duet") === "true",
      disableStitch: form.get("disable_stitch") === "true",
    };
  }

  // JSON body with a same-origin videoUrl (hosted sample).
  let body: PostJsonBody;
  try {
    body = (await request.json()) as PostJsonBody;
  } catch {
    throw new RequestError("Invalid request body.", 400);
  }

  const videoUrl = typeof body.videoUrl === "string" ? body.videoUrl : "";
  if (!videoUrl) {
    throw new RequestError("No video was provided.", 400);
  }

  let target: URL;
  try {
    target = new URL(videoUrl);
  } catch {
    throw new RequestError("Invalid video URL.", 400);
  }
  // SSRF guard: only fetch samples hosted on our own origin.
  if (target.origin !== request.nextUrl.origin) {
    throw new RequestError("The video URL must be on this site.", 400);
  }

  const videoResponse = await fetch(target.toString(), { cache: "no-store" });
  if (!videoResponse.ok) {
    throw new RequestError(
      `Could not read the sample video (${videoResponse.status}).`,
      400,
    );
  }
  const arrayBuffer = await videoResponse.arrayBuffer();
  if (arrayBuffer.byteLength === 0) {
    throw new RequestError("The sample video is empty.", 400);
  }
  if (arrayBuffer.byteLength > MAX_VIDEO_BYTES) {
    throw new RequestError("That video is too large to post.", 413);
  }

  return {
    videoBytes: Buffer.from(arrayBuffer),
    mimeType: videoResponse.headers.get("content-type") || "video/mp4",
    caption: sanitizeCaption(body.caption),
    privacyLevel:
      typeof body.privacyLevel === "string" ? body.privacyLevel : "SELF_ONLY",
    disableComment: body.disableComment === true,
    disableDuet: body.disableDuet === true,
    disableStitch: body.disableStitch === true,
  };
}

function asString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

function sanitizeCaption(value: FormDataEntryValue | string | null | undefined): string {
  const text = typeof value === "string" ? value : "";
  return text.slice(0, MAX_CAPTION_LENGTH);
}

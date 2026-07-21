"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/*
  SFFS Creator Studio — the interactive, on-brand TikTok posting surface.

  This is the screen recorded for TikTok's app-review demo video, so every step
  is numbered and labeled: (1) connect the account, (2) pick a rendered short,
  (3) write a caption + choose privacy, (4) post. It only ever talks to our own
  /api/tiktok/* routes over fetch — it never sees OAuth tokens.
*/

interface CreatorInfo {
  creatorNickname?: string;
  creatorUsername?: string;
  privacyLevelOptions: string[];
  commentDisabled: boolean;
  duetDisabled: boolean;
  stitchDisabled: boolean;
  maxVideoPostDurationSec?: number;
}

interface SampleVideo {
  id: string;
  title: string;
  src: string;
  caption?: string;
}

interface PostResult {
  publishId: string;
  status: string;
  privacyLevel: string;
  note?: string;
}

const PRIVACY_LABELS: Record<string, string> = {
  PUBLIC_TO_EVERYONE: "Public — everyone",
  MUTUAL_FOLLOW_FRIENDS: "Friends (mutual follows)",
  FOLLOWER_OF_CREATOR: "Followers",
  SELF_ONLY: "Private — only me",
};

function privacyLabel(code: string): string {
  return PRIVACY_LABELS[code] ?? code;
}

export function TikTokStudio({
  connected,
  displayName,
  openId,
  avatarUrl,
  justConnected,
  justDisconnected,
  initialError,
}: {
  connected: boolean;
  displayName: string | null;
  openId: string | null;
  avatarUrl: string | null;
  justConnected: boolean;
  justDisconnected: boolean;
  initialError: string | null;
}) {
  const [creatorInfo, setCreatorInfo] = useState<CreatorInfo | null>(null);
  const [creatorError, setCreatorError] = useState<string | null>(null);
  const [loadingCreator, setLoadingCreator] = useState(connected);

  const [samples, setSamples] = useState<SampleVideo[]>([]);

  const [file, setFile] = useState<File | null>(null);
  const [sample, setSample] = useState<SampleVideo | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [caption, setCaption] = useState("");
  const [privacyLevel, setPrivacyLevel] = useState("SELF_ONLY");
  const [allowComment, setAllowComment] = useState(true);
  const [allowDuet, setAllowDuet] = useState(true);
  const [allowStitch, setAllowStitch] = useState(true);

  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [result, setResult] = useState<PostResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  // Tracks the current blob: object URL (if any) so we can revoke it. Sample
  // previews use a real site path and must NOT be revoked.
  const objectUrlRef = useRef<string | null>(null);

  const releaseObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  // Load the creator's allowed privacy options once connected. All state
  // updates happen after an await (inside the promise), never synchronously in
  // the effect body.
  useEffect(() => {
    if (!connected) return;
    let active = true;
    void (async () => {
      try {
        const res = await fetch("/api/tiktok/creator-info", {
          cache: "no-store",
        });
        const data = (await res.json().catch(() => ({}))) as {
          creatorInfo?: CreatorInfo;
          error?: string;
        };
        if (!active) return;
        if (!res.ok || !data.creatorInfo) {
          setCreatorError(
            data.error ||
              "Couldn't load your posting options. You may need to reconnect.",
          );
          return;
        }
        setCreatorInfo(data.creatorInfo);
        const options = data.creatorInfo.privacyLevelOptions;
        if (options.length > 0) {
          setPrivacyLevel(
            options.includes("SELF_ONLY") ? "SELF_ONLY" : options[0],
          );
        }
      } catch {
        if (active) setCreatorError("Couldn't reach TikTok. Try again.");
      } finally {
        if (active) setLoadingCreator(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [connected]);

  // Load optional hosted sample shorts (public/tiktok-samples/manifest.json).
  useEffect(() => {
    let active = true;
    fetch("/tiktok-samples/manifest.json", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { videos: [] }))
      .then((data: { videos?: SampleVideo[] }) => {
        if (active && Array.isArray(data.videos)) setSamples(data.videos);
      })
      .catch(() => {
        /* No manifest: samples section shows the empty state. */
      });
    return () => {
      active = false;
    };
  }, []);

  // Revoke any outstanding blob: URL when the component unmounts.
  useEffect(() => releaseObjectUrl, [releaseObjectUrl]);

  const onPickFile = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const picked = e.target.files?.[0] ?? null;
      setResult(null);
      setPostError(null);
      setSample(null);
      setFile(picked);
      releaseObjectUrl();
      if (picked) {
        const url = URL.createObjectURL(picked);
        objectUrlRef.current = url;
        setPreviewUrl(url);
        setCaption((c) => c || stripExtension(picked.name));
      } else {
        setPreviewUrl(null);
      }
    },
    [releaseObjectUrl],
  );

  const onPickSample = useCallback(
    (s: SampleVideo) => {
      setResult(null);
      setPostError(null);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      releaseObjectUrl();
      setSample(s);
      setPreviewUrl(s.src);
      setCaption((c) => c || s.caption || s.title);
    },
    [releaseObjectUrl],
  );

  const clearVideo = useCallback(() => {
    setFile(null);
    setSample(null);
    releaseObjectUrl();
    setPreviewUrl(null);
    setResult(null);
    setPostError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [releaseObjectUrl]);

  const hasVideo = Boolean(file || sample);

  const onSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!hasVideo || posting) return;
      setPosting(true);
      setPostError(null);
      setResult(null);
      try {
        let res: Response;
        if (file) {
          const form = new FormData();
          form.set("video", file);
          form.set("caption", caption);
          form.set("privacy_level", privacyLevel);
          form.set("disable_comment", String(!allowComment));
          form.set("disable_duet", String(!allowDuet));
          form.set("disable_stitch", String(!allowStitch));
          res = await fetch("/api/tiktok/post", {
            method: "POST",
            body: form,
          });
        } else if (sample) {
          res = await fetch("/api/tiktok/post", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              videoUrl: new URL(sample.src, window.location.origin).toString(),
              caption,
              privacyLevel,
              disableComment: !allowComment,
              disableDuet: !allowDuet,
              disableStitch: !allowStitch,
            }),
          });
        } else {
          return;
        }

        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          publishId?: string;
          status?: string;
          privacyLevel?: string;
          note?: string;
          error?: string;
          allowedPrivacyLevels?: string[];
        };

        if (!res.ok || !data.ok || !data.publishId) {
          setPostError(
            data.error ||
              `Post failed (${res.status}). Please try again.` +
                (data.allowedPrivacyLevels
                  ? ` Allowed: ${data.allowedPrivacyLevels.join(", ")}.`
                  : ""),
          );
          return;
        }

        setResult({
          publishId: data.publishId,
          status: data.status || "PROCESSING",
          privacyLevel: data.privacyLevel || privacyLevel,
          note: data.note,
        });
      } catch {
        setPostError("Something went wrong sending the video. Try again.");
      } finally {
        setPosting(false);
      }
    },
    [
      allowComment,
      allowDuet,
      allowStitch,
      caption,
      file,
      hasVideo,
      posting,
      privacyLevel,
      sample,
    ],
  );

  const privacyOptions =
    creatorInfo?.privacyLevelOptions && creatorInfo.privacyLevelOptions.length > 0
      ? creatorInfo.privacyLevelOptions
      : ["SELF_ONLY"];

  return (
    <div className="space-y-8">
      {/* Status banners */}
      {justConnected && (
        <Banner tone="mint">
          <strong>Connected.</strong> Your TikTok account is linked and ready to
          post.
        </Banner>
      )}
      {justDisconnected && (
        <Banner tone="yellow">
          <strong>Disconnected.</strong> The stored TikTok session was cleared.
        </Banner>
      )}
      {initialError && (
        <Banner tone="coral">
          <strong>Heads up:</strong> {initialError}
        </Banner>
      )}

      {/* Step 1 — Connect */}
      <StudioCard step={1} title="Connect the TikTok account">
        {connected ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element -- external TikTok avatar, may be a signed URL */}
              <img
                src={avatarUrl || "/social/tiktok.svg"}
                alt=""
                width={56}
                height={56}
                className="h-14 w-14 rounded-full border-[2.5px] border-ink bg-paper object-cover"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full border-[2px] border-ink bg-green px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide">
                    Connected
                  </span>
                </div>
                <p className="mt-1 text-lg font-bold leading-tight">
                  {creatorInfo?.creatorNickname || displayName || "TikTok user"}
                </p>
                {creatorInfo?.creatorUsername && (
                  <p className="text-sm text-ink/60">
                    @{creatorInfo.creatorUsername}
                  </p>
                )}
                {openId && (
                  <p className="mt-0.5 font-mono text-xs text-ink/50">
                    open_id: {openId}
                  </p>
                )}
              </div>
            </div>
            <a
              href="/api/tiktok/logout"
              className={cn(buttonVariants({ variant: "paper", size: "md" }))}
            >
              Disconnect
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-prose text-ink/70">
              Sign in with TikTok to authorize SFFS Creator Studio. We request
              only <code className="rounded bg-ink/[0.06] px-1.5 py-0.5 font-mono text-[0.85em]">user.info.basic</code>{" "}
              and{" "}
              <code className="rounded bg-ink/[0.06] px-1.5 py-0.5 font-mono text-[0.85em]">video.publish</code>{" "}
              so we can post our own rendered shorts.
            </p>
            <a
              href="/api/tiktok/auth"
              className={cn(
                buttonVariants({ variant: "ink", size: "lg" }),
                "shrink-0",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- static brand icon */}
              <img
                src="/social/tiktok.svg"
                alt=""
                className="h-5 w-5 [filter:invert(1)]"
              />
              Connect TikTok
            </a>
          </div>
        )}
      </StudioCard>

      {/* Steps 2–4 — Compose & post */}
      <form onSubmit={onSubmit}>
        <fieldset
          disabled={!connected || posting}
          className={cn(
            "space-y-8 transition-opacity",
            !connected && "pointer-events-none opacity-50",
          )}
        >
          {/* Step 2 — Choose a video */}
          <StudioCard step={2} title="Choose a rendered short">
            <div className="space-y-5">
              <label
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-[2.5px] border-dashed border-ink/60 bg-cream px-6 py-10 text-center transition-colors hover:border-ink hover:bg-cream/70",
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm"
                  className="sr-only"
                  onChange={onPickFile}
                />
                <span className="text-lg font-bold">
                  {file ? file.name : "Click to pick an .mp4 from your computer"}
                </span>
                <span className="mt-1 text-sm text-ink/60">
                  MP4, MOV, or WebM · vertical 9:16 recommended
                </span>
              </label>

              {samples.length > 0 && (
                <div>
                  <p className="eyebrow mb-3 text-ink/60">Or pick a sample</p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {samples.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => onPickSample(s)}
                        className={cn(
                          "rounded-xl border-[2.5px] border-ink bg-paper px-4 py-3 text-left text-sm font-semibold press",
                          sample?.id === s.id && "bg-blue",
                        )}
                      >
                        {s.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {previewUrl && (
                <div className="flex flex-col items-start gap-3">
                  <video
                    key={previewUrl}
                    src={previewUrl}
                    controls
                    muted
                    playsInline
                    className="max-h-80 w-auto rounded-xl border-[2.5px] border-ink bg-ink shadow-hard-sm"
                  />
                  <button
                    type="button"
                    onClick={clearVideo}
                    className="text-sm font-semibold text-ink underline decoration-2 underline-offset-2"
                  >
                    Remove video
                  </button>
                </div>
              )}
            </div>
          </StudioCard>

          {/* Step 3 — Caption, privacy, interactions */}
          <StudioCard step={3} title="Caption & privacy">
            <div className="space-y-6">
              <div>
                <label
                  htmlFor="tiktok-caption"
                  className="mb-2 block text-sm font-bold uppercase tracking-wide"
                >
                  Caption
                </label>
                <textarea
                  id="tiktok-caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value.slice(0, 2200))}
                  rows={3}
                  placeholder="Smart Fella or Fart Smella? Take the test 🧠 #fellatest"
                  className="w-full resize-y rounded-xl border-[2.5px] border-ink bg-paper px-4 py-3 text-base outline-none focus-visible:ring-4 focus-visible:ring-blue/60"
                />
                <p className="mt-1 text-right text-xs text-ink/50">
                  {caption.length}/2200
                </p>
              </div>

              <div>
                <label
                  htmlFor="tiktok-privacy"
                  className="mb-2 block text-sm font-bold uppercase tracking-wide"
                >
                  Who can see this
                </label>
                <select
                  id="tiktok-privacy"
                  value={privacyLevel}
                  onChange={(e) => setPrivacyLevel(e.target.value)}
                  className="w-full rounded-xl border-[2.5px] border-ink bg-paper px-4 py-3 text-base font-semibold outline-none focus-visible:ring-4 focus-visible:ring-blue/60"
                >
                  {privacyOptions.map((code) => (
                    <option key={code} value={code}>
                      {privacyLabel(code)}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-sm text-ink/60">
                  {loadingCreator
                    ? "Loading your account's allowed privacy options…"
                    : creatorError
                      ? creatorError
                      : "Privacy options are pulled live from your TikTok account. Unaudited apps can only post privately (only me)."}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Toggle
                  label="Allow comments"
                  checked={allowComment}
                  disabled={creatorInfo?.commentDisabled}
                  onChange={setAllowComment}
                />
                <Toggle
                  label="Allow Duet"
                  checked={allowDuet}
                  disabled={creatorInfo?.duetDisabled}
                  onChange={setAllowDuet}
                />
                <Toggle
                  label="Allow Stitch"
                  checked={allowStitch}
                  disabled={creatorInfo?.stitchDisabled}
                  onChange={setAllowStitch}
                />
              </div>
            </div>
          </StudioCard>

          {/* Step 4 — Post */}
          <StudioCard step={4} title="Post to TikTok">
            <div className="space-y-4">
              <p className="text-sm text-ink/60">
                By posting, you confirm this content follows TikTok&rsquo;s
                policies and that you agree to TikTok&rsquo;s Music Usage
                Confirmation.
              </p>
              <Button type="submit" variant="green" size="lg" disabled={!hasVideo}>
                {posting ? "Posting to TikTok…" : "Post to TikTok"}
              </Button>

              {postError && (
                <Banner tone="coral">
                  <strong>Post failed:</strong> {postError}
                </Banner>
              )}

              {result && (
                <Banner tone="mint">
                  <strong>Sent to TikTok.</strong> Status:{" "}
                  <span className="font-mono">{result.status}</span> · privacy:{" "}
                  <span className="font-semibold">
                    {privacyLabel(result.privacyLevel)}
                  </span>
                  <br />
                  <span className="font-mono text-xs text-ink/60">
                    publish_id: {result.publishId}
                  </span>
                  {result.note && (
                    <>
                      <br />
                      <span className="text-sm">{result.note}</span>
                    </>
                  )}
                  <br />
                  <a
                    href="https://www.tiktok.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold underline decoration-2 underline-offset-2"
                  >
                    Open TikTok to review the post
                  </a>
                </Banner>
              )}
            </div>
          </StudioCard>
        </fieldset>
      </form>
    </div>
  );
}

// --------------------------------------------------------------------------
// Small presentational helpers (kept local; on-brand neo-brutalist styling)
// --------------------------------------------------------------------------

function StudioCard({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border-[2.5px] border-ink bg-paper p-6 shadow-hard-sm md:p-8">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[2.5px] border-ink bg-yellow font-display text-lg leading-none">
          {step}
        </span>
        <h2 className="font-display text-2xl uppercase leading-none tracking-[-0.01em]">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function Banner({
  tone,
  children,
}: {
  tone: "mint" | "coral" | "yellow";
  children: ReactNode;
}) {
  const toneClass =
    tone === "mint" ? "bg-mint" : tone === "coral" ? "bg-coral" : "bg-yellow";
  return (
    <div
      className={cn(
        "rounded-2xl border-[2.5px] border-ink px-5 py-4 text-ink shadow-hard-xs",
        toneClass,
      )}
      role="status"
    >
      {children}
    </div>
  );
}

function Toggle({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label
      className={cn(
        "flex items-center gap-3 rounded-xl border-[2.5px] border-ink bg-paper px-4 py-3 text-sm font-semibold",
        disabled && "opacity-50",
      )}
    >
      <input
        type="checkbox"
        checked={disabled ? false : checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 shrink-0 accent-green"
      />
      <span>
        {label}
        {disabled && (
          <span className="block text-xs font-normal text-ink/50">
            Disabled by account
          </span>
        )}
      </span>
    </label>
  );
}

function stripExtension(name: string): string {
  return name.replace(/\.[^./\\]+$/, "");
}

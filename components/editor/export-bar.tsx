"use client";

import * as React from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileVideo,
  ImageDown,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { IMAGE_EXPORT_PRESETS, VIDEO_EXPORT } from "@/lib/constants";
import { exportImage } from "@/lib/image-export";
import { exportFileName } from "@/lib/media";
import { useLapperStore } from "@/lib/store";
import { exportVideo, type VideoFormat } from "@/lib/video-export";
import { cn, downloadBlob } from "@/lib/utils";

const VIDEO_FORMATS: { value: VideoFormat; label: string; note: string }[] = [
  { value: "mp4", label: "MP4", note: "Most compatible" },
  { value: "webm", label: "WebM", note: "Smaller file" },
];

export function ExportBar() {
  const media = useLapperStore((s) => s.media);
  const overlay = useLapperStore((s) => s.overlay);
  const logo = useLapperStore((s) => s.logo);
  const voiceover = useLapperStore((s) => s.voiceover);
  const imagePresetId = useLapperStore((s) => s.imagePresetId);
  const setImagePresetId = useLapperStore((s) => s.setImagePresetId);
  const exportState = useLapperStore((s) => s.exportState);
  const setExportState = useLapperStore((s) => s.setExportState);

  const [videoFormat, setVideoFormat] = React.useState<VideoFormat>("mp4");

  const isBusy =
    exportState.phase === "preparing" ||
    exportState.phase === "rendering" ||
    exportState.phase === "encoding";

  if (!media) return null;
  const isImage = media.kind === "image";
  const isArticleImage = isImage && overlay.layout === "article";

  async function handleImageExport() {
    if (!media) return;
    const preset =
      IMAGE_EXPORT_PRESETS.find((p) => p.id === imagePresetId) ??
      IMAGE_EXPORT_PRESETS[0];

    setExportState({
      phase: "rendering",
      progress: 0,
      message: "Rendering your image in high resolution…",
    });

    try {
      const blob = await exportImage({
        imageUrl: media.url,
        settings: overlay,
        width: preset.width,
        height: preset.height,
        logo,
      });
      downloadBlob(blob, exportFileName(media.name, "png"));
      setExportState({
        phase: "done",
        progress: 100,
        message: "Saved! Check your downloads folder.",
      });
    } catch (error) {
      setExportState({
        phase: "error",
        progress: 0,
        message:
          error instanceof Error ? error.message : "Export failed. Try again.",
      });
    }
  }

  async function handleVideoExport() {
    if (!media) return;
    setExportState({
      phase: "preparing",
      progress: 0,
      message: "Preparing export…",
    });

    try {
      const { blob, extension } = await exportVideo({
        videoUrl: media.url,
        settings: overlay,
        format: videoFormat,
        durationSeconds: media.duration,
        logo,
        voiceoverUrl: voiceover?.url ?? null,
        onPhase: (phase, progress) => {
          const pct = Math.round(progress * 100);
          setExportState({
            phase: phase === "rendering" ? "rendering" : "encoding",
            progress: pct,
            message:
              phase === "rendering"
                ? `Recording overlay onto your video… ${pct}%`
                : `Encoding ${videoFormat.toUpperCase()}… ${pct}%`,
          });
        },
      });
      downloadBlob(blob, exportFileName(media.name, extension));
      setExportState({
        phase: "done",
        progress: 100,
        message: "Saved! Check your downloads folder.",
      });
    } catch (error) {
      setExportState({
        phase: "error",
        progress: 0,
        message:
          error instanceof Error
            ? error.message
            : "Export failed. Please try again.",
      });
    }
  }

  return (
    <div className="space-y-5">
      {isImage ? (
        <div className="space-y-3">
          {isArticleImage ? (
            <div className="rounded-xl border border-border bg-secondary/30 px-4 py-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Article</span> —
              auto-sized to fit all your text (1080px wide).
            </div>
          ) : (
            <>
          <p className="text-sm font-medium text-foreground">Choose a size</p>
          <div className="grid gap-2.5">
            {IMAGE_EXPORT_PRESETS.map((preset) => {
              const selected = preset.id === imagePresetId;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setImagePresetId(preset.id)}
                  aria-pressed={selected}
                  className={cn(
                    "flex items-center justify-between rounded-xl border-2 bg-card px-4 py-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    selected
                      ? "border-primary shadow-soft"
                      : "border-border hover:border-primary/40"
                  )}
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {preset.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {preset.description}
                    </p>
                  </div>
                  <AspectGlyph
                    width={preset.width}
                    height={preset.height}
                    active={selected}
                  />
                </button>
              );
            })}
          </div>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Choose a format</p>
          <div className="grid grid-cols-2 gap-2.5">
            {VIDEO_FORMATS.map((format) => {
              const selected = format.value === videoFormat;
              return (
                <button
                  key={format.value}
                  type="button"
                  onClick={() => setVideoFormat(format.value)}
                  aria-pressed={selected}
                  className={cn(
                    "rounded-xl border-2 bg-card px-4 py-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    selected
                      ? "border-primary shadow-soft"
                      : "border-border hover:border-primary/40"
                  )}
                >
                  <p className="text-sm font-semibold text-foreground">
                    {format.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{format.note}</p>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Exports at {VIDEO_EXPORT.width}×{VIDEO_EXPORT.height} · {VIDEO_EXPORT.fps}
            fps with sound. Recording runs in real time, so a {Math.round(
              Math.min(media.duration || 0, 60)
            )}
            s clip takes about that long.
          </p>
        </div>
      )}

      <Button
        type="button"
        size="lg"
        variant="success"
        className="w-full"
        disabled={isBusy}
        onClick={isImage ? handleImageExport : handleVideoExport}
      >
        {isBusy ? (
          <>
            <Loader2 className="animate-spin" />
            Working…
          </>
        ) : (
          <>
            {isImage ? <ImageDown /> : <FileVideo />}
            {isImage ? "Download PNG" : `Download ${videoFormat.toUpperCase()}`}
          </>
        )}
      </Button>

      {(isBusy || exportState.phase === "done" || exportState.phase === "error") && (
        <div
          className="space-y-2 rounded-xl border border-border bg-secondary/30 p-4"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-2 text-sm">
            {exportState.phase === "done" && (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
            )}
            {exportState.phase === "error" && (
              <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
            )}
            {isBusy && (
              <Download className="h-4 w-4 shrink-0 animate-pulse text-primary" />
            )}
            <span
              className={cn(
                "font-medium",
                exportState.phase === "error"
                  ? "text-destructive"
                  : exportState.phase === "done"
                    ? "text-success"
                    : "text-foreground"
              )}
            >
              {exportState.message}
            </span>
          </div>
          {isBusy && (
            <Progress
              value={exportState.progress}
              indeterminate={
                exportState.phase === "preparing" || exportState.progress === 0
              }
            />
          )}
        </div>
      )}
    </div>
  );
}

/** A tiny proportional rectangle that previews the export aspect ratio. */
function AspectGlyph({
  width,
  height,
  active,
}: {
  width: number;
  height: number;
  active: boolean;
}) {
  const maxSide = 28;
  const ratio = width / height;
  const w = ratio >= 1 ? maxSide : maxSide * ratio;
  const h = ratio >= 1 ? maxSide / ratio : maxSide;
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center">
      <span
        className={cn(
          "rounded-[4px] border-2 transition-colors",
          active ? "border-primary bg-primary/10" : "border-muted-foreground/40"
        )}
        style={{ width: w, height: h }}
      />
    </span>
  );
}

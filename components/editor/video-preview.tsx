"use client";

import * as React from "react";
import { Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";

import { useElementSize } from "@/hooks/use-element-size";
import { useFontsReady } from "@/hooks/use-fonts-ready";
import { VIDEO_EXPORT } from "@/lib/constants";
import {
  computeOverlayLayout,
  drawOverlayToCanvas,
  getFontFamily,
} from "@/lib/overlay-layout";
import { useLapperStore } from "@/lib/store";
import { cn, formatDuration } from "@/lib/utils";

const LETTERBOX_FILL = "#15120E";
const ASPECT = VIDEO_EXPORT.width / VIDEO_EXPORT.height; // 16:9

/**
 * Live video preview. Frames are composited onto a canvas with the same
 * letterbox + overlay logic as the export pipeline, so the preview is an exact
 * match for the downloaded MP4/WebM.
 */
export function VideoPreview() {
  const media = useLapperStore((s) => s.media);
  const overlay = useLapperStore((s) => s.overlay);
  const fontsReady = useFontsReady();

  const [containerRef, size] = useElementSize<HTMLDivElement>();
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [muted, setMuted] = React.useState(true);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(media?.duration ?? 0);

  const family = fontsReady ? getFontFamily() : "Inter, system-ui, sans-serif";

  const stage = React.useMemo(() => {
    const maxW = size.width;
    const maxH = size.height;
    if (maxW <= 0 || maxH <= 0) return { width: 0, height: 0 };
    let width = maxW;
    let height = maxW / ASPECT;
    if (height > maxH) {
      height = maxH;
      width = maxH * ASPECT;
    }
    return { width: Math.round(width), height: Math.round(height) };
  }, [size.width, size.height]);

  const draw = React.useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || stage.width <= 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = Math.round(stage.width * dpr);
    const H = Math.round(stage.height * dpr);
    if (canvas.width !== W) canvas.width = W;
    if (canvas.height !== H) canvas.height = H;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    ctx.fillStyle = LETTERBOX_FILL;
    ctx.fillRect(0, 0, W, H);

    if (video && video.videoWidth > 0) {
      const sourceAr = video.videoWidth / video.videoHeight;
      let dw: number;
      let dh: number;
      if (sourceAr > W / H) {
        dw = W;
        dh = W / sourceAr;
      } else {
        dh = H;
        dw = H * sourceAr;
      }
      ctx.drawImage(video, (W - dw) / 2, (H - dh) / 2, dw, dh);
    }

    const geometry = computeOverlayLayout({
      targetWidth: W,
      targetHeight: H,
      settings: overlay,
      fontFamily: family,
    });
    drawOverlayToCanvas(ctx, geometry);
  }, [stage.width, stage.height, overlay, family]);

  // Animation loop while playing.
  React.useEffect(() => {
    if (!isPlaying) return;
    let raf = 0;
    const loop = () => {
      draw();
      const video = videoRef.current;
      if (video) setCurrentTime(video.currentTime);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, draw]);

  // Redraw on any settings/size change while paused.
  React.useEffect(() => {
    draw();
  }, [draw, fontsReady]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const restart = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    setCurrentTime(0);
    draw();
  };

  const onScrub = (value: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = value;
    setCurrentTime(value);
    if (video.paused) requestAnimationFrame(draw);
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4">
      <div
        ref={containerRef}
        className="flex min-h-0 w-full flex-1 items-center justify-center"
      >
        {stage.width > 0 && (
          <div
            className="overflow-hidden rounded-2xl shadow-soft-lg ring-1 ring-border"
            style={{ width: stage.width, height: stage.height }}
          >
            <canvas
              ref={canvasRef}
              style={{ width: stage.width, height: stage.height }}
              aria-label="Video preview with overlay"
            />
          </div>
        )}
      </div>

      {/* Playback controls */}
      <div
        className="flex w-full max-w-md items-center gap-3 rounded-full border border-border bg-card px-4 py-2 shadow-soft"
        style={{ width: stage.width > 0 ? stage.width : undefined }}
      >
        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause" : "Play"}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 translate-x-px" />
          )}
        </button>

        <button
          type="button"
          onClick={restart}
          aria-label="Restart"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
          {formatDuration(currentTime)} / {formatDuration(duration)}
        </span>

        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.01}
          value={Math.min(currentTime, duration || 0)}
          onChange={(e) => onScrub(parseFloat(e.target.value))}
          aria-label="Scrub video"
          className={cn(
            "h-1.5 w-full cursor-pointer appearance-none rounded-full bg-secondary",
            "[&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary",
            "[&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary"
          )}
        />

        <button
          type="button"
          onClick={() => {
            const next = !muted;
            setMuted(next);
            if (videoRef.current) videoRef.current.muted = next;
          }}
          aria-label={muted ? "Unmute preview" : "Mute preview"}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {muted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Hidden frame source */}
      <video
        ref={videoRef}
        src={media?.url}
        muted={muted}
        loop
        playsInline
        preload="auto"
        className="pointer-events-none absolute h-px w-px opacity-0"
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration);
          requestAnimationFrame(draw);
        }}
        onLoadedData={() => requestAnimationFrame(draw)}
        onSeeked={() => requestAnimationFrame(draw)}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  );
}

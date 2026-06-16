import { VIDEO_EXPORT } from "@/lib/constants";
import { getFFmpeg } from "@/lib/ffmpeg";
import {
  computeOverlayLayout,
  drawOverlayToCanvas,
  getFontFamily,
  type OverlayGeometry,
} from "@/lib/overlay-layout";
import type { OverlaySettings } from "@/lib/types";

export type VideoFormat = "mp4" | "webm";

/** Warm near-black used to letterbox non-16:9 sources. */
const LETTERBOX_FILL = "#15120E";

export interface VideoExportOptions {
  videoUrl: string;
  settings: OverlaySettings;
  format: VideoFormat;
  durationSeconds: number;
  onPhase?: (phase: "rendering" | "encoding", progress: number) => void;
}

/**
 * Draw one composited frame: letterboxed source video + lower-third overlay.
 * Geometry is pre-computed once (settings don't change mid-export).
 */
function drawFrame(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  geometry: OverlayGeometry,
  width: number,
  height: number
): void {
  ctx.fillStyle = LETTERBOX_FILL;
  ctx.fillRect(0, 0, width, height);

  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (vw > 0 && vh > 0) {
    const sourceAr = vw / vh;
    const targetAr = width / height;
    let dw: number;
    let dh: number;
    if (sourceAr > targetAr) {
      dw = width;
      dh = width / sourceAr;
    } else {
      dh = height;
      dw = height * sourceAr;
    }
    const dx = (width - dw) / 2;
    const dy = (height - dh) / 2;
    ctx.drawImage(video, dx, dy, dw, dh);
  }

  drawOverlayToCanvas(ctx, geometry);
}

/** Pick the best MediaRecorder container the browser supports for `format`. */
function pickMimeType(format: VideoFormat): string | null {
  const candidates =
    format === "mp4"
      ? [
          "video/mp4;codecs=h264,aac",
          "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
          "video/mp4",
        ]
      : [
          "video/webm;codecs=vp9,opus",
          "video/webm;codecs=vp8,opus",
          "video/webm",
        ];

  if (typeof MediaRecorder === "undefined") return null;
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  // Fall back to whichever webm flavour exists — we can transcode later.
  for (const type of ["video/webm;codecs=vp9,opus", "video/webm"]) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return null;
}

/**
 * Record the composited canvas in real time via MediaRecorder, then (for MP4
 * when the browser can't record MP4 directly) transcode with FFmpeg.wasm.
 *
 * Returns a Blob of the requested format. Everything runs in the browser.
 */
export async function exportVideo({
  videoUrl,
  settings,
  format,
  durationSeconds,
  onPhase,
}: VideoExportOptions): Promise<{ blob: Blob; extension: VideoFormat }> {
  if (typeof MediaRecorder === "undefined") {
    throw new Error("Your browser does not support video recording.");
  }

  await document.fonts.ready;

  const { width, height, fps } = VIDEO_EXPORT;

  // Offscreen compositing canvas at the export resolution.
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Could not create a drawing context.");

  const geometry = computeOverlayLayout({
    targetWidth: width,
    targetHeight: height,
    settings,
    fontFamily: getFontFamily(),
  });

  // Hidden source video.
  const video = document.createElement("video");
  video.src = videoUrl;
  video.crossOrigin = "anonymous";
  video.muted = false;
  video.playsInline = true;

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error("Could not load the video."));
  });

  const recordedMime = pickMimeType(format);
  if (!recordedMime) {
    throw new Error("Your browser can't record video in this format.");
  }

  const stream = canvas.captureStream(fps);

  // Pull the audio track from the source so exports keep their sound.
  type Capturable = HTMLVideoElement & {
    captureStream?: () => MediaStream;
    mozCaptureStream?: () => MediaStream;
  };
  try {
    const capt = video as Capturable;
    const sourceStream = capt.captureStream?.() ?? capt.mozCaptureStream?.();
    sourceStream?.getAudioTracks().forEach((track) => stream.addTrack(track));
  } catch {
    /* Audio capture is best-effort; silent export still succeeds. */
  }

  const recorder = new MediaRecorder(stream, {
    mimeType: recordedMime,
    videoBitsPerSecond: 8_000_000,
  });

  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  const recordingDone = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
  });

  const maxDuration = Math.min(durationSeconds || 0, 60) || 60;

  recorder.start(100);
  video.currentTime = 0;
  await video.play();

  await new Promise<void>((resolve) => {
    let stopped = false;
    const stop = () => {
      if (stopped) return;
      stopped = true;
      video.pause();
      if (recorder.state !== "inactive") recorder.stop();
      resolve();
    };

    const tick = () => {
      if (stopped) return;
      drawFrame(ctx, video, geometry, width, height);
      const progress = Math.min(1, video.currentTime / maxDuration);
      onPhase?.("rendering", progress);

      if (video.ended || video.currentTime >= maxDuration) {
        stop();
        return;
      }
      requestAnimationFrame(tick);
    };

    video.onended = stop;
    requestAnimationFrame(tick);
  });

  await recordingDone;

  const recordedBlob = new Blob(chunks, { type: recordedMime });

  // Direct hit: browser recorded exactly the format we want.
  if (recordedMime.startsWith(`video/${format}`)) {
    return { blob: recordedBlob, extension: format };
  }

  // We have WebM but the user asked for MP4 → transcode with FFmpeg.wasm.
  if (format === "mp4") {
    onPhase?.("encoding", 0);
    const blob = await transcodeToMp4(recordedBlob, (ratio) =>
      onPhase?.("encoding", ratio)
    );
    return { blob, extension: "mp4" };
  }

  return { blob: recordedBlob, extension: "webm" };
}

async function transcodeToMp4(
  input: Blob,
  onProgress: (ratio: number) => void
): Promise<Blob> {
  const { fetchFile } = await import("@ffmpeg/util");
  const ffmpeg = await getFFmpeg({ onProgress });

  const inputName = "input.webm";
  const outputName = "output.mp4";

  await ffmpeg.writeFile(inputName, await fetchFile(input));

  let exitCode: number;
  try {
    exitCode = await ffmpeg.exec([
      "-i",
      inputName,
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "23",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      outputName,
    ]);
  } catch {
    throw new Error(
      "MP4 encoding isn't available in this browser. Please export as WebM instead."
    );
  }

  if (exitCode !== 0) {
    throw new Error(
      "MP4 encoding failed. Please try exporting as WebM instead."
    );
  }

  const data = (await ffmpeg.readFile(outputName)) as Uint8Array;
  // Copy into a fresh ArrayBuffer-backed view (the FS buffer may be shared).
  const bytes = new Uint8Array(data);

  // Clean up the virtual FS so repeated exports don't leak memory.
  try {
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);
  } catch {
    /* ignore cleanup failures */
  }

  return new Blob([bytes], { type: "video/mp4" });
}

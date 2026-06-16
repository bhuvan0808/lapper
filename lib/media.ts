import {
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_VIDEO_TYPES,
} from "@/lib/constants";
import type { MediaAsset, MediaKind } from "@/lib/types";

const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp"];
const VIDEO_EXTENSIONS = ["mp4", "mov", "webm", "m4v"];

function extensionOf(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

/** Classify a file as image/video, tolerating browsers that omit MIME types. */
export function detectKind(file: File): MediaKind | null {
  const type = file.type.toLowerCase();
  if ((ACCEPTED_IMAGE_TYPES as readonly string[]).includes(type)) return "image";
  if ((ACCEPTED_VIDEO_TYPES as readonly string[]).includes(type)) return "video";

  const ext = extensionOf(file.name);
  if (IMAGE_EXTENSIONS.includes(ext)) return "image";
  if (VIDEO_EXTENSIONS.includes(ext)) return "video";
  return null;
}

function loadImageMeta(
  url: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () =>
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("That image could not be read."));
    img.src = url;
  });
}

function loadVideoMeta(
  url: string
): Promise<{ width: number; height: number; duration: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () =>
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration,
      });
    video.onerror = () => reject(new Error("That video could not be read."));
    video.src = url;
  });
}

/**
 * Turn a user-selected File into a {@link MediaAsset}. Creates a browser-only
 * object URL (nothing is uploaded) and reads intrinsic dimensions/duration.
 */
export async function createMediaAsset(file: File): Promise<MediaAsset> {
  const kind = detectKind(file);
  if (!kind) {
    throw new Error(
      "Unsupported file. Please choose a PNG, JPG, WEBP, MP4, MOV, or WebM."
    );
  }

  const url = URL.createObjectURL(file);

  try {
    if (kind === "image") {
      const { width, height } = await loadImageMeta(url);
      return {
        url,
        kind,
        name: file.name,
        width,
        height,
        duration: 0,
        mimeType: file.type || `image/${extensionOf(file.name)}`,
      };
    }

    const { width, height, duration } = await loadVideoMeta(url);
    return {
      url,
      kind,
      name: file.name,
      width,
      height,
      duration,
      mimeType: file.type || `video/${extensionOf(file.name)}`,
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

/** Build a download file name from the source name + new extension. */
export function exportFileName(sourceName: string, extension: string): string {
  const base = sourceName.replace(/\.[^.]+$/, "") || "lapper";
  return `${base}-lapper.${extension}`;
}

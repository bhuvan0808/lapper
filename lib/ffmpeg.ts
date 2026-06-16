import type { FFmpeg } from "@ffmpeg/ffmpeg";

/**
 * Lazy, single-instance FFmpeg.wasm loader.
 *
 * We use the single-threaded core so the app works without cross-origin
 * isolation (COOP/COEP) headers — that keeps Vercel deployment zero-config.
 * The ~30MB core is fetched from a CDN only when the user first exports an MP4,
 * never on initial page load (everything here is behind a dynamic import).
 */

const CORE_VERSION = "0.12.6";
const CORE_BASE_URL = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd`;

// Must match the pinned @ffmpeg/ffmpeg version in package.json so the worker
// chunk name (814.ffmpeg.js) lines up. Loading the worker from a CDN blob URL
// sidesteps bundler worker-resolution issues in Next.js.
const FFMPEG_VERSION = "0.12.15";
const FFMPEG_BASE_URL = `https://unpkg.com/@ffmpeg/ffmpeg@${FFMPEG_VERSION}/dist/umd`;

let instance: FFmpeg | null = null;
let loadingPromise: Promise<FFmpeg> | null = null;

export interface LoadFFmpegOptions {
  onProgress?: (ratio: number) => void;
  onLog?: (message: string) => void;
}

export async function getFFmpeg(
  options: LoadFFmpegOptions = {}
): Promise<FFmpeg> {
  if (instance) return instance;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const { FFmpeg } = await import("@ffmpeg/ffmpeg");
    const { toBlobURL } = await import("@ffmpeg/util");

    const ffmpeg = new FFmpeg();
    if (options.onLog) {
      ffmpeg.on("log", ({ message }) => options.onLog?.(message));
    }
    if (options.onProgress) {
      ffmpeg.on("progress", ({ progress }) =>
        options.onProgress?.(Math.min(1, Math.max(0, progress)))
      );
    }

    await ffmpeg.load({
      coreURL: await toBlobURL(
        `${CORE_BASE_URL}/ffmpeg-core.js`,
        "text/javascript"
      ),
      wasmURL: await toBlobURL(
        `${CORE_BASE_URL}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
      classWorkerURL: await toBlobURL(
        `${FFMPEG_BASE_URL}/814.ffmpeg.js`,
        "text/javascript"
      ),
    });

    instance = ffmpeg;
    return ffmpeg;
  })();

  try {
    return await loadingPromise;
  } catch (error) {
    loadingPromise = null; // allow a retry on the next attempt
    throw error;
  }
}

export function isFFmpegLoaded(): boolean {
  return instance !== null;
}

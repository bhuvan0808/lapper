import type {
  FontWeight,
  ImageExportPreset,
  LogoAsset,
  OverlaySettings,
} from "@/lib/types";

/** The design is authored at a 1080px reference width; preview scales from this. */
export const DESIGN_WIDTH = 1080;

/** Brand palette — kept in one place so defaults and UI swatches stay in sync. */
export const PALETTE = {
  background: "#FAF8F4",
  card: "#FFFFFF",
  primary: "#8B7355",
  accent: "#C6B8A3",
  text: "#2C2C2C",
  muted: "#7A7A7A",
  border: "#E7E1D8",
  success: "#4F7A5B",
  error: "#D65A5A",
} as const;

export const ACCEPTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export const ACCEPTED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime", // .mov
  "video/webm",
] as const;

export const ACCEPT_ATTRIBUTE = [
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".mp4",
  ".mov",
  ".webm",
].join(",");

/** Largest video we promise to handle smoothly. */
export const MAX_VIDEO_DURATION_SECONDS = 60;

/**
 * Built-in default brand logo (served from /public). Shown in the top-right of
 * every export until the user replaces or removes it. The intrinsic dimensions
 * are a hint only — the real aspect ratio is read from the loaded image.
 */
export const DEFAULT_LOGO: LogoAsset = {
  src: "/bcm10-news-logo.jpg",
  width: 477,
  height: 342,
};

export const DEFAULT_OVERLAY: OverlaySettings = {
  kicker: "BREAKING NEWS",
  headline: "Your headline goes here",
  body: "",
  position: "bottom",
  textColor: "#FFFFFF",
  bannerColor: "#2C2C2C",
  bannerOpacity: 0.92,
  fontSize: 64,
  fontWeight: 700,
  borderRadius: 16,
  showKicker: true,
  showLogo: true,
  logoScale: 0.16,
};

export const FONT_WEIGHT_OPTIONS: { value: FontWeight; label: string }[] = [
  { value: 400, label: "Regular" },
  { value: 500, label: "Medium" },
  { value: 600, label: "Semibold" },
  { value: 700, label: "Bold" },
  { value: 800, label: "Extra Bold" },
];

/** Square + portrait presets for image export. */
export const IMAGE_EXPORT_PRESETS: ImageExportPreset[] = [
  {
    id: "square",
    label: "Square",
    description: "1080 × 1080 · Instagram post",
    width: 1080,
    height: 1080,
  },
  {
    id: "portrait",
    label: "Portrait",
    description: "1080 × 1350 · Feed portrait",
    width: 1080,
    height: 1350,
  },
  {
    id: "story",
    label: "Story",
    description: "1080 × 1920 · Reels / Stories",
    width: 1080,
    height: 1920,
  },
];

/** High-quality still export multiplier (per product spec). */
export const IMAGE_EXPORT_PIXEL_RATIO = 4;

/** Video export target. */
export const VIDEO_EXPORT = {
  width: 1920,
  height: 1080,
  fps: 30,
} as const;

/** Font size slider bounds (px at design width). */
export const FONT_SIZE_RANGE = { min: 24, max: 120, step: 1 } as const;
export const BORDER_RADIUS_RANGE = { min: 0, max: 48, step: 1 } as const;
/** Logo size slider bounds (fraction of frame width). */
export const LOGO_SCALE_RANGE = { min: 0.08, max: 0.32, step: 0.005 } as const;

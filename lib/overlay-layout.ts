import { DESIGN_WIDTH, PALETTE } from "@/lib/constants";
import { hexToRgba } from "@/lib/utils";
import type { OverlaySettings } from "@/lib/types";

/**
 * The lower-third overlay is authored against a 1080px reference width. This
 * module turns the user's {@link OverlaySettings} into concrete, pixel-accurate
 * geometry for any target size, so the Konva (image) and Canvas-2D (video)
 * renderers stay perfectly in sync — same wrapping, same spacing, same colours.
 */

/** Function that measures the rendered width of `text` for a CSS `font` string. */
export type MeasureText = (text: string, font: string) => number;

export interface PositionedLine {
  text: string;
  x: number;
  /** Top edge of the line (use textBaseline = "top" on canvas). */
  y: number;
}

export interface OverlayGeometry {
  fontFamily: string;
  scale: number;
  banner: {
    x: number;
    y: number;
    width: number;
    height: number;
    radius: number;
    /** rgba() fill string including opacity. */
    fill: string;
  };
  kicker: {
    barX: number;
    barY: number;
    barWidth: number;
    barHeight: number;
    barFill: string;
    barRadius: number;
    textX: number;
    textY: number;
    text: string;
    font: string;
    fontSize: number;
    color: string;
    letterSpacing: number;
  } | null;
  headline: {
    font: string;
    color: string;
    fontSize: number;
    lineHeight: number;
    lines: PositionedLine[];
  };
}

// Spacing constants expressed at the 1080px design width.
const GUTTER = 44;
const PAD_X = 40;
const PAD_Y = 34;
const KICKER_GAP = 16;
const KICKER_PAD_X = 14;
const KICKER_PAD_Y = 7;
const LINE_HEIGHT_RATIO = 1.14;
const KICKER_LETTER_SPACING = 2;

let sharedCtx: CanvasRenderingContext2D | null = null;

/** Default browser text measurement backed by a reusable offscreen canvas. */
export function defaultMeasureText(text: string, font: string): number {
  if (typeof document === "undefined") return text.length * 10;
  if (!sharedCtx) {
    sharedCtx = document.createElement("canvas").getContext("2d");
  }
  if (!sharedCtx) return text.length * 10;
  sharedCtx.font = font;
  return sharedCtx.measureText(text).width;
}

/** Resolve the actual loaded font-family (next/font generates a hashed name). */
export function getFontFamily(): string {
  if (typeof window === "undefined") return "Inter, system-ui, sans-serif";
  const family = getComputedStyle(document.body).fontFamily;
  return family || "Inter, system-ui, sans-serif";
}

function wrapText(
  text: string,
  maxWidth: number,
  font: string,
  measure: MeasureText
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];

  const lines: string[] = [];
  let current = words[0];

  for (let i = 1; i < words.length; i++) {
    const candidate = `${current} ${words[i]}`;
    if (measure(candidate, font) <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines;
}

export interface ComputeOverlayOptions {
  targetWidth: number;
  targetHeight: number;
  settings: OverlaySettings;
  measure?: MeasureText;
  fontFamily?: string;
}

export function computeOverlayLayout({
  targetWidth,
  targetHeight,
  settings,
  measure = defaultMeasureText,
  fontFamily,
}: ComputeOverlayOptions): OverlayGeometry {
  const scale = targetWidth / DESIGN_WIDTH;
  const family = fontFamily ?? getFontFamily();

  const gutter = GUTTER * scale;
  const padX = PAD_X * scale;
  const padY = PAD_Y * scale;
  const radius = settings.borderRadius * scale;

  const bannerX = gutter;
  const bannerWidth = targetWidth - gutter * 2;
  const contentX = bannerX + padX;
  const contentWidth = bannerWidth - padX * 2;

  // Headline
  const headlineFontSize = settings.fontSize * scale;
  const headlineFont = `${settings.fontWeight} ${headlineFontSize}px ${family}`;
  const lineHeight = headlineFontSize * LINE_HEIGHT_RATIO;
  const wrapped = wrapText(
    settings.headline || " ",
    contentWidth,
    headlineFont,
    measure
  );
  const headlineBlockHeight = wrapped.length * lineHeight;

  // Kicker (fixed brand styling: stone bar, white uppercase text)
  const showKicker = settings.showKicker && settings.kicker.trim().length > 0;
  let kickerBlockHeight = 0;
  let kickerFontSize = 0;
  let kickerFont = "";
  let kickerText = "";
  let kickerBarWidth = 0;
  let kickerBarHeight = 0;
  const kickerLetterSpacing = KICKER_LETTER_SPACING * scale;

  if (showKicker) {
    kickerText = settings.kicker.toUpperCase();
    kickerFontSize = Math.max(headlineFontSize * 0.33, 20 * scale);
    kickerFont = `700 ${kickerFontSize}px ${family}`;
    const rawWidth = measure(kickerText, kickerFont);
    const tracking = Math.max(0, kickerText.length - 1) * kickerLetterSpacing;
    kickerBarWidth = rawWidth + tracking + KICKER_PAD_X * 2 * scale;
    kickerBarHeight = kickerFontSize + KICKER_PAD_Y * 2 * scale;
    kickerBlockHeight = kickerBarHeight + KICKER_GAP * scale;
  }

  const bannerHeight = padY * 2 + kickerBlockHeight + headlineBlockHeight;
  const bannerY =
    settings.position === "top"
      ? gutter
      : targetHeight - gutter - bannerHeight;

  let cursorY = bannerY + padY;

  let kicker: OverlayGeometry["kicker"] = null;
  if (showKicker) {
    kicker = {
      barX: contentX,
      barY: cursorY,
      barWidth: kickerBarWidth,
      barHeight: kickerBarHeight,
      barFill: PALETTE.primary,
      barRadius: Math.min(kickerBarHeight / 2, 10 * scale),
      textX: contentX + KICKER_PAD_X * scale,
      textY: cursorY + KICKER_PAD_Y * scale,
      text: kickerText,
      font: kickerFont,
      fontSize: kickerFontSize,
      color: "#FFFFFF",
      letterSpacing: kickerLetterSpacing,
    };
    cursorY += kickerBlockHeight;
  }

  const lines: PositionedLine[] = wrapped.map((text, i) => ({
    text,
    x: contentX,
    y: cursorY + i * lineHeight,
  }));

  return {
    fontFamily: family,
    scale,
    banner: {
      x: bannerX,
      y: bannerY,
      width: bannerWidth,
      height: bannerHeight,
      radius,
      fill: hexToRgba(settings.bannerColor, settings.bannerOpacity),
    },
    kicker,
    headline: {
      font: headlineFont,
      color: settings.textColor,
      fontSize: headlineFontSize,
      lineHeight,
      lines,
    },
  };
}

/**
 * Draw the lower-third onto a 2D canvas context using pre-computed geometry.
 * Used by the video pipeline (per frame) and as the still fallback renderer.
 */
export function drawOverlayToCanvas(
  ctx: CanvasRenderingContext2D,
  geometry: OverlayGeometry
): void {
  const { banner, kicker, headline } = geometry;

  // Banner background
  ctx.save();
  ctx.fillStyle = banner.fill;
  roundRectPath(ctx, banner.x, banner.y, banner.width, banner.height, banner.radius);
  ctx.fill();
  ctx.restore();

  // Kicker pill
  if (kicker) {
    ctx.save();
    ctx.fillStyle = kicker.barFill;
    roundRectPath(
      ctx,
      kicker.barX,
      kicker.barY,
      kicker.barWidth,
      kicker.barHeight,
      kicker.barRadius
    );
    ctx.fill();

    ctx.fillStyle = kicker.color;
    ctx.font = kicker.font;
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    applyLetterSpacing(ctx, kicker.letterSpacing);
    ctx.fillText(kicker.text, kicker.textX, kicker.textY);
    ctx.restore();
  }

  // Headline lines
  ctx.save();
  ctx.fillStyle = headline.color;
  ctx.font = headline.font;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  for (const line of headline.lines) {
    ctx.fillText(line.text, line.x, line.y);
  }
  ctx.restore();
}

function applyLetterSpacing(ctx: CanvasRenderingContext2D, spacing: number) {
  // letterSpacing is supported in modern Chromium/WebKit; ignored elsewhere.
  try {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
      `${spacing}px`;
  } catch {
    /* no-op on browsers without canvas letterSpacing */
  }
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, radius);
    return;
  }
  // Fallback for older engines.
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

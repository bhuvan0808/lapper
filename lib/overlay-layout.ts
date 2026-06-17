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
  /** Optional supporting paragraph beneath the headline. */
  body: {
    font: string;
    color: string;
    fontSize: number;
    lineHeight: number;
    lines: PositionedLine[];
  } | null;
  /** Optional brand logo placed in the top-right corner. */
  logo: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
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
const BODY_GAP = 18;
const BODY_LINE_HEIGHT_RATIO = 1.32;
const BODY_FONT_RATIO = 0.44;
const BODY_MIN_FONT = 22;
const BODY_COLOR_OPACITY = 0.85;

// Article ("stacked card") layout — media on top, text panel below.
const ARTICLE_PAD = 56;
const ARTICLE_HEADLINE_LH = 1.18;
const ARTICLE_BODY_LH = 1.5; // generous so Telugu glyph stacks never clip
const ARTICLE_BODY_FONT_RATIO = 0.5;
const ARTICLE_BODY_MIN_FONT = 26;
const ARTICLE_HEADLINE_BODY_GAP = 24;
const ARTICLE_MEDIA_MAX_RATIO = 1.1; // media height capped to 1.1 × width

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
  /** Intrinsic logo dimensions, if a logo is present. */
  logo?: { width: number; height: number } | null;
}

export function computeOverlayLayout({
  targetWidth,
  targetHeight,
  settings,
  measure = defaultMeasureText,
  fontFamily,
  logo,
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

  // Body (optional supporting paragraph)
  const showBody = settings.body.trim().length > 0;
  let bodyFontSize = 0;
  let bodyFont = "";
  let bodyLineHeight = 0;
  let bodyWrapped: string[] = [];
  let bodyBlockHeight = 0;
  if (showBody) {
    bodyFontSize = Math.max(
      headlineFontSize * BODY_FONT_RATIO,
      BODY_MIN_FONT * scale
    );
    bodyFont = `400 ${bodyFontSize}px ${family}`;
    bodyLineHeight = bodyFontSize * BODY_LINE_HEIGHT_RATIO;
    bodyWrapped = wrapText(settings.body, contentWidth, bodyFont, measure);
    bodyBlockHeight = BODY_GAP * scale + bodyWrapped.length * bodyLineHeight;
  }

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

  const bannerHeight =
    padY * 2 + kickerBlockHeight + headlineBlockHeight + bodyBlockHeight;
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

  // Body sits a gap below the headline block.
  let body: OverlayGeometry["body"] = null;
  if (showBody) {
    const bodyTop = cursorY + headlineBlockHeight + BODY_GAP * scale;
    body = {
      font: bodyFont,
      color: hexToRgba(settings.textColor, BODY_COLOR_OPACITY),
      fontSize: bodyFontSize,
      lineHeight: bodyLineHeight,
      lines: bodyWrapped.map((text, i) => ({
        text,
        x: contentX,
        y: bodyTop + i * bodyLineHeight,
      })),
    };
  }

  // Logo, top-right, inset by the same gutter as the banner.
  let logoGeometry: OverlayGeometry["logo"] = null;
  if (settings.showLogo && logo && logo.width > 0 && logo.height > 0) {
    let logoWidth = targetWidth * settings.logoScale;
    let logoHeight = logoWidth * (logo.height / logo.width);
    const maxLogoHeight = targetHeight * 0.22;
    if (logoHeight > maxLogoHeight) {
      logoHeight = maxLogoHeight;
      logoWidth = logoHeight * (logo.width / logo.height);
    }
    logoGeometry = {
      x: targetWidth - gutter - logoWidth,
      y: gutter,
      width: logoWidth,
      height: logoHeight,
    };
  }

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
    body,
    logo: logoGeometry,
  };
}

/**
 * Draw the lower-third onto a 2D canvas context using pre-computed geometry.
 * Used by the video pipeline (per frame) and as the still fallback renderer.
 */
export function drawOverlayToCanvas(
  ctx: CanvasRenderingContext2D,
  geometry: OverlayGeometry,
  logoImage?: CanvasImageSource | null
): void {
  const { banner, kicker, headline, body, logo } = geometry;

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

  // Body paragraph
  if (body) {
    ctx.save();
    ctx.fillStyle = body.color;
    ctx.font = body.font;
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    for (const line of body.lines) {
      ctx.fillText(line.text, line.x, line.y);
    }
    ctx.restore();
  }

  // Brand logo (top-right) with a soft shadow for legibility on busy media.
  if (logo && logoImage) {
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.22)";
    ctx.shadowBlur = logo.width * 0.05;
    ctx.shadowOffsetY = logo.width * 0.012;
    ctx.drawImage(logoImage, logo.x, logo.y, logo.width, logo.height);
    ctx.restore();
  }
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

/** Geometry for the stacked article card (media on top, text panel below). */
export interface ArticleGeometry {
  width: number;
  height: number;
  fontFamily: string;
  scale: number;
  media: { x: number; y: number; width: number; height: number };
  panel: { x: number; y: number; width: number; height: number; fill: string };
  kicker: OverlayGeometry["kicker"];
  headline: OverlayGeometry["headline"];
  body: OverlayGeometry["body"];
  logo: OverlayGeometry["logo"];
}

export interface ComputeArticleOptions {
  targetWidth: number;
  /** Intrinsic media aspect ratio (width / height). */
  mediaAspect: number;
  settings: OverlaySettings;
  measure?: MeasureText;
  fontFamily?: string;
  logo?: { width: number; height: number } | null;
}

/**
 * Lay out the article card. Width is fixed; height GROWS to fit all the text,
 * so the full body (e.g. 20+ lines of Telugu news) is always included.
 */
export function computeArticleLayout({
  targetWidth,
  mediaAspect,
  settings,
  measure = defaultMeasureText,
  fontFamily,
  logo,
}: ComputeArticleOptions): ArticleGeometry {
  const scale = targetWidth / DESIGN_WIDTH;
  const family = fontFamily ?? getFontFamily();
  const W = targetWidth;

  // Media region: full width, natural aspect, capped so it never dominates.
  const naturalHeight = mediaAspect > 0 ? W / mediaAspect : W * 0.6;
  const mediaHeight = Math.min(naturalHeight, W * ARTICLE_MEDIA_MAX_RATIO);

  const pad = ARTICLE_PAD * scale;
  const contentX = pad;
  const contentWidth = W - pad * 2;

  // Kicker (same brand styling as the overlay)
  const showKicker = settings.showKicker && settings.kicker.trim().length > 0;
  const kickerLetterSpacing = KICKER_LETTER_SPACING * scale;
  let kickerFontSize = 0;
  let kickerFont = "";
  let kickerText = "";
  let kickerBarWidth = 0;
  let kickerBarHeight = 0;
  let kickerBlockHeight = 0;
  if (showKicker) {
    kickerText = settings.kicker.toUpperCase();
    kickerFontSize = Math.max(26 * scale, 22 * scale);
    kickerFont = `700 ${kickerFontSize}px ${family}`;
    const rawWidth = measure(kickerText, kickerFont);
    const tracking = Math.max(0, kickerText.length - 1) * kickerLetterSpacing;
    kickerBarWidth = rawWidth + tracking + KICKER_PAD_X * 2 * scale;
    kickerBarHeight = kickerFontSize + KICKER_PAD_Y * 2 * scale;
    kickerBlockHeight = kickerBarHeight + KICKER_GAP * scale;
  }

  // Headline
  const headlineFontSize = settings.fontSize * scale;
  const headlineFont = `${settings.fontWeight} ${headlineFontSize}px ${family}`;
  const headlineLineHeight = headlineFontSize * ARTICLE_HEADLINE_LH;
  const headlineWrapped = wrapText(
    settings.headline || " ",
    contentWidth,
    headlineFont,
    measure
  );
  const headlineBlockHeight = headlineWrapped.length * headlineLineHeight;

  // Body (the long-form news)
  const showBody = settings.body.trim().length > 0;
  let bodyFontSize = 0;
  let bodyFont = "";
  let bodyLineHeight = 0;
  let bodyWrapped: string[] = [];
  let bodyBlockHeight = 0;
  if (showBody) {
    bodyFontSize = Math.max(
      headlineFontSize * ARTICLE_BODY_FONT_RATIO,
      ARTICLE_BODY_MIN_FONT * scale
    );
    bodyFont = `400 ${bodyFontSize}px ${family}`;
    bodyLineHeight = bodyFontSize * ARTICLE_BODY_LH;
    // Split on explicit newlines first, then word-wrap each paragraph.
    bodyWrapped = settings.body
      .split(/\r?\n/)
      .flatMap((para) =>
        para.trim().length === 0
          ? [""]
          : wrapText(para, contentWidth, bodyFont, measure)
      );
    bodyBlockHeight = bodyWrapped.length * bodyLineHeight;
  }

  const panelTop = mediaHeight;
  const panelInner =
    kickerBlockHeight +
    headlineBlockHeight +
    (showBody ? ARTICLE_HEADLINE_BODY_GAP * scale + bodyBlockHeight : 0);
  const panelHeight = pad * 2 + panelInner;
  const totalHeight = mediaHeight + panelHeight;

  // Positions
  let cursorY = panelTop + pad;

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

  const headlineLines: PositionedLine[] = headlineWrapped.map((text, i) => ({
    text,
    x: contentX,
    y: cursorY + i * headlineLineHeight,
  }));

  let body: OverlayGeometry["body"] = null;
  if (showBody) {
    const bodyTop =
      cursorY + headlineBlockHeight + ARTICLE_HEADLINE_BODY_GAP * scale;
    body = {
      font: bodyFont,
      color: settings.textColor,
      fontSize: bodyFontSize,
      lineHeight: bodyLineHeight,
      lines: bodyWrapped.map((text, i) => ({
        text,
        x: contentX,
        y: bodyTop + i * bodyLineHeight,
      })),
    };
  }

  // Logo over the media, top-right.
  let logoGeometry: OverlayGeometry["logo"] = null;
  if (settings.showLogo && logo && logo.width > 0 && logo.height > 0) {
    const gutter = 40 * scale;
    let logoWidth = W * settings.logoScale;
    let logoHeight = logoWidth * (logo.height / logo.width);
    const maxLogoHeight = mediaHeight * 0.5;
    if (logoHeight > maxLogoHeight) {
      logoHeight = maxLogoHeight;
      logoWidth = logoHeight * (logo.width / logo.height);
    }
    logoGeometry = {
      x: W - gutter - logoWidth,
      y: gutter,
      width: logoWidth,
      height: logoHeight,
    };
  }

  return {
    width: W,
    height: totalHeight,
    fontFamily: family,
    scale,
    media: { x: 0, y: 0, width: W, height: mediaHeight },
    panel: {
      x: 0,
      y: panelTop,
      width: W,
      height: panelHeight,
      fill: settings.bannerColor,
    },
    kicker,
    headline: {
      font: headlineFont,
      color: settings.textColor,
      fontSize: headlineFontSize,
      lineHeight: headlineLineHeight,
      lines: headlineLines,
    },
    body,
    logo: logoGeometry,
  };
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

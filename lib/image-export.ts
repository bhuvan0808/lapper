import Konva from "konva";
import {
  ARTICLE_EXPORT_PIXEL_RATIO,
  ARTICLE_EXPORT_WIDTH,
  IMAGE_EXPORT_PIXEL_RATIO,
} from "@/lib/constants";
import {
  computeArticleLayout,
  computeOverlayLayout,
  getFontFamily,
} from "@/lib/overlay-layout";
import type { LogoAsset, OverlaySettings } from "@/lib/types";

const BACKDROP_FILL = "#15120E";

export interface ImageExportOptions {
  imageUrl: string;
  settings: OverlaySettings;
  width: number;
  height: number;
  pixelRatio?: number;
  logo?: LogoAsset | null;
}

/** Compute a "cover" rectangle (fill target, crop overflow, centered). */
function coverRect(
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number
): { x: number; y: number; width: number; height: number } {
  const scale = Math.max(dstW / srcW, dstH / srcH);
  const width = srcW * scale;
  const height = srcH * scale;
  return { x: (dstW - width) / 2, y: (dstH - height) / 2, width, height };
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load the image."));
    img.src = url;
  });
}

/**
 * Render the source image + lower-third overlay with Konva and export a
 * high-resolution PNG. The stage is built off-screen at the target dimensions
 * and rasterised at `pixelRatio` (default 4 — per product spec).
 */
export async function exportImage({
  imageUrl,
  settings,
  width,
  height,
  pixelRatio = IMAGE_EXPORT_PIXEL_RATIO,
  logo,
}: ImageExportOptions): Promise<Blob> {
  await document.fonts.ready;
  const image = await loadImage(imageUrl);
  const logoImage = logo ? await loadImage(logo.src) : null;

  if (settings.layout === "article") {
    return exportArticleImage(image, logoImage, settings);
  }

  // Off-screen container, kept out of the layout flow.
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "-100000px";
  container.style.left = "-100000px";
  container.style.pointerEvents = "none";
  document.body.appendChild(container);

  const stage = new Konva.Stage({ container, width, height });
  const layer = new Konva.Layer({ listening: false });
  stage.add(layer);

  try {
    // Backdrop (only visible if the image somehow doesn't cover the frame).
    layer.add(new Konva.Rect({ x: 0, y: 0, width, height, fill: BACKDROP_FILL }));

    // Cover-fit source image.
    const rect = coverRect(image.width, image.height, width, height);
    layer.add(
      new Konva.Image({
        image,
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      })
    );

    // Overlay geometry (shared with the live preview + video pipeline).
    const geometry = computeOverlayLayout({
      targetWidth: width,
      targetHeight: height,
      settings,
      fontFamily: getFontFamily(),
      logo: logoImage
        ? { width: logoImage.width, height: logoImage.height }
        : null,
    });

    const { banner, kicker, headline, body, logo: logoRect } = geometry;

    layer.add(
      new Konva.Rect({
        x: banner.x,
        y: banner.y,
        width: banner.width,
        height: banner.height,
        cornerRadius: banner.radius,
        fill: banner.fill,
      })
    );

    if (kicker) {
      layer.add(
        new Konva.Rect({
          x: kicker.barX,
          y: kicker.barY,
          width: kicker.barWidth,
          height: kicker.barHeight,
          cornerRadius: kicker.barRadius,
          fill: kicker.barFill,
        })
      );
      layer.add(
        new Konva.Text({
          x: kicker.textX,
          y: kicker.textY,
          text: kicker.text,
          fontFamily: geometry.fontFamily,
          fontSize: kicker.fontSize,
          fontStyle: "700",
          fill: kicker.color,
          letterSpacing: kicker.letterSpacing,
        })
      );
    }

    for (const line of headline.lines) {
      layer.add(
        new Konva.Text({
          x: line.x,
          y: line.y,
          text: line.text,
          fontFamily: geometry.fontFamily,
          fontSize: headline.fontSize,
          fontStyle: String(settings.fontWeight),
          fill: headline.color,
        })
      );
    }

    if (body) {
      for (const line of body.lines) {
        layer.add(
          new Konva.Text({
            x: line.x,
            y: line.y,
            text: line.text,
            fontFamily: geometry.fontFamily,
            fontSize: body.fontSize,
            fontStyle: "400",
            fill: body.color,
          })
        );
      }
    }

    if (logoRect && logoImage) {
      layer.add(
        new Konva.Image({
          image: logoImage,
          x: logoRect.x,
          y: logoRect.y,
          width: logoRect.width,
          height: logoRect.height,
          shadowColor: "#000000",
          shadowBlur: logoRect.width * 0.05,
          shadowOpacity: 0.22,
          shadowOffsetY: logoRect.width * 0.012,
        })
      );
    }

    layer.draw();

    const dataUrl = stage.toDataURL({
      mimeType: "image/png",
      pixelRatio,
    });

    return dataURLToBlob(dataUrl);
  } finally {
    stage.destroy();
    container.remove();
  }
}

/**
 * Render the stacked article card (media on top, auto-height text panel below)
 * and export it as a tall PNG that contains the full body text.
 */
async function exportArticleImage(
  image: HTMLImageElement,
  logoImage: HTMLImageElement | null,
  settings: OverlaySettings
): Promise<Blob> {
  const geometry = computeArticleLayout({
    targetWidth: ARTICLE_EXPORT_WIDTH,
    mediaAspect: image.width / image.height,
    settings,
    fontFamily: getFontFamily(),
    logo: logoImage
      ? { width: logoImage.width, height: logoImage.height }
      : null,
  });

  const width = geometry.width;
  const height = Math.ceil(geometry.height);

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "-100000px";
  container.style.left = "-100000px";
  container.style.pointerEvents = "none";
  document.body.appendChild(container);

  const stage = new Konva.Stage({ container, width, height });
  const layer = new Konva.Layer({ listening: false });
  stage.add(layer);

  try {
    // Panel colour fills the whole card.
    layer.add(
      new Konva.Rect({ x: 0, y: 0, width, height, fill: geometry.panel.fill })
    );

    // Media, cover-fit and clipped to its region.
    const m = geometry.media;
    const cover = coverRect(image.width, image.height, m.width, m.height);
    const mediaGroup = new Konva.Group({
      clipX: m.x,
      clipY: m.y,
      clipWidth: m.width,
      clipHeight: m.height,
    });
    mediaGroup.add(
      new Konva.Image({
        image,
        x: m.x + cover.x,
        y: m.y + cover.y,
        width: cover.width,
        height: cover.height,
      })
    );
    layer.add(mediaGroup);

    const { kicker, headline, body } = geometry;

    if (kicker) {
      layer.add(
        new Konva.Rect({
          x: kicker.barX,
          y: kicker.barY,
          width: kicker.barWidth,
          height: kicker.barHeight,
          cornerRadius: kicker.barRadius,
          fill: kicker.barFill,
        })
      );
      layer.add(
        new Konva.Text({
          x: kicker.textX,
          y: kicker.textY,
          text: kicker.text,
          fontFamily: geometry.fontFamily,
          fontSize: kicker.fontSize,
          fontStyle: "700",
          fill: kicker.color,
          letterSpacing: kicker.letterSpacing,
        })
      );
    }

    for (const line of headline.lines) {
      layer.add(
        new Konva.Text({
          x: line.x,
          y: line.y,
          text: line.text,
          fontFamily: geometry.fontFamily,
          fontSize: headline.fontSize,
          fontStyle: String(settings.fontWeight),
          fill: headline.color,
        })
      );
    }

    if (body) {
      for (const line of body.lines) {
        layer.add(
          new Konva.Text({
            x: line.x,
            y: line.y,
            text: line.text,
            fontFamily: geometry.fontFamily,
            fontSize: body.fontSize,
            fontStyle: "400",
            fill: body.color,
          })
        );
      }
    }

    if (geometry.logo && logoImage) {
      layer.add(
        new Konva.Image({
          image: logoImage,
          x: geometry.logo.x,
          y: geometry.logo.y,
          width: geometry.logo.width,
          height: geometry.logo.height,
          shadowColor: "#000000",
          shadowBlur: geometry.logo.width * 0.05,
          shadowOpacity: 0.22,
          shadowOffsetY: geometry.logo.width * 0.012,
        })
      );
    }

    layer.draw();

    const dataUrl = stage.toDataURL({
      mimeType: "image/png",
      pixelRatio: ARTICLE_EXPORT_PIXEL_RATIO,
    });

    return dataURLToBlob(dataUrl);
  } finally {
    stage.destroy();
    container.remove();
  }
}

function dataURLToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mimeMatch = header.match(/data:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/png";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

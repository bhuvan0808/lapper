import Konva from "konva";
import { IMAGE_EXPORT_PIXEL_RATIO } from "@/lib/constants";
import {
  computeOverlayLayout,
  getFontFamily,
} from "@/lib/overlay-layout";
import type { OverlaySettings } from "@/lib/types";

const BACKDROP_FILL = "#15120E";

export interface ImageExportOptions {
  imageUrl: string;
  settings: OverlaySettings;
  width: number;
  height: number;
  pixelRatio?: number;
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
}: ImageExportOptions): Promise<Blob> {
  await document.fonts.ready;
  const image = await loadImage(imageUrl);

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
    });

    const { banner, kicker, headline } = geometry;

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

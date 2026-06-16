"use client";

import * as React from "react";
import { Image as KonvaImage, Layer, Rect, Stage, Text } from "react-konva";

import { useElementSize } from "@/hooks/use-element-size";
import { useFontsReady } from "@/hooks/use-fonts-ready";
import { useHtmlImage } from "@/hooks/use-html-image";
import { IMAGE_EXPORT_PRESETS } from "@/lib/constants";
import { computeOverlayLayout, getFontFamily } from "@/lib/overlay-layout";
import { useLapperStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const BACKDROP_FILL = "#15120E";

function coverRect(srcW: number, srcH: number, dstW: number, dstH: number) {
  const scale = Math.max(dstW / srcW, dstH / srcH);
  const width = srcW * scale;
  const height = srcH * scale;
  return { x: (dstW - width) / 2, y: (dstH - height) / 2, width, height };
}

/**
 * Live image preview rendered with Konva. The stage matches the selected
 * export preset's aspect ratio and scales to fit the available area, so what
 * the user sees is exactly what they download.
 */
export function ImagePreview() {
  const media = useLapperStore((s) => s.media);
  const overlay = useLapperStore((s) => s.overlay);
  const imagePresetId = useLapperStore((s) => s.imagePresetId);
  const fontsReady = useFontsReady();

  const [containerRef, size] = useElementSize<HTMLDivElement>();
  const { image, status } = useHtmlImage(media?.url);

  const preset =
    IMAGE_EXPORT_PRESETS.find((p) => p.id === imagePresetId) ??
    IMAGE_EXPORT_PRESETS[0];
  const aspect = preset.width / preset.height;

  // Fit the preset aspect inside the available box.
  const stage = React.useMemo(() => {
    const maxW = size.width;
    const maxH = size.height;
    if (maxW <= 0 || maxH <= 0) return { width: 0, height: 0 };
    let width = maxW;
    let height = maxW / aspect;
    if (height > maxH) {
      height = maxH;
      width = maxH * aspect;
    }
    return { width: Math.round(width), height: Math.round(height) };
  }, [size.width, size.height, aspect]);

  const family = fontsReady ? getFontFamily() : "Inter, system-ui, sans-serif";

  const geometry = React.useMemo(() => {
    if (stage.width <= 0) return null;
    return computeOverlayLayout({
      targetWidth: stage.width,
      targetHeight: stage.height,
      settings: overlay,
      fontFamily: family,
    });
  }, [stage.width, stage.height, overlay, family]);

  const cover = image
    ? coverRect(image.width, image.height, stage.width, stage.height)
    : null;

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full items-center justify-center"
    >
      {stage.width > 0 && geometry && (
        <div
          className={cn(
            "overflow-hidden rounded-2xl shadow-soft-lg ring-1 ring-border transition-opacity",
            status === "loaded" ? "opacity-100" : "opacity-0"
          )}
          style={{ width: stage.width, height: stage.height }}
        >
          <Stage width={stage.width} height={stage.height}>
            <Layer listening={false}>
              <Rect
                x={0}
                y={0}
                width={stage.width}
                height={stage.height}
                fill={BACKDROP_FILL}
              />
              {image && cover && (
                <KonvaImage
                  image={image}
                  x={cover.x}
                  y={cover.y}
                  width={cover.width}
                  height={cover.height}
                />
              )}

              <Rect
                x={geometry.banner.x}
                y={geometry.banner.y}
                width={geometry.banner.width}
                height={geometry.banner.height}
                cornerRadius={geometry.banner.radius}
                fill={geometry.banner.fill}
              />

              {geometry.kicker && (
                <>
                  <Rect
                    x={geometry.kicker.barX}
                    y={geometry.kicker.barY}
                    width={geometry.kicker.barWidth}
                    height={geometry.kicker.barHeight}
                    cornerRadius={geometry.kicker.barRadius}
                    fill={geometry.kicker.barFill}
                  />
                  <Text
                    x={geometry.kicker.textX}
                    y={geometry.kicker.textY}
                    text={geometry.kicker.text}
                    fontFamily={geometry.fontFamily}
                    fontSize={geometry.kicker.fontSize}
                    fontStyle="700"
                    fill={geometry.kicker.color}
                    letterSpacing={geometry.kicker.letterSpacing}
                  />
                </>
              )}

              {geometry.headline.lines.map((line, i) => (
                <Text
                  key={i}
                  x={line.x}
                  y={line.y}
                  text={line.text}
                  fontFamily={geometry.fontFamily}
                  fontSize={geometry.headline.fontSize}
                  fontStyle={String(overlay.fontWeight)}
                  fill={geometry.headline.color}
                />
              ))}
            </Layer>
          </Stage>
        </div>
      )}
    </div>
  );
}

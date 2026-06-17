"use client";

import * as React from "react";
import { Group, Image as KonvaImage, Layer, Rect, Stage, Text } from "react-konva";

import { useElementSize } from "@/hooks/use-element-size";
import { useFontsReady } from "@/hooks/use-fonts-ready";
import { useHtmlImage } from "@/hooks/use-html-image";
import { IMAGE_EXPORT_PRESETS } from "@/lib/constants";
import {
  computeArticleLayout,
  computeOverlayLayout,
  getFontFamily,
  type ArticleGeometry,
  type OverlayGeometry,
} from "@/lib/overlay-layout";
import { useLapperStore } from "@/lib/store";
import type { FontWeight } from "@/lib/types";
import { cn } from "@/lib/utils";

const BACKDROP_FILL = "#15120E";
const ARTICLE_MAX_PREVIEW_WIDTH = 620;

function coverRect(srcW: number, srcH: number, dstW: number, dstH: number) {
  const scale = Math.max(dstW / srcW, dstH / srcH);
  const width = srcW * scale;
  const height = srcH * scale;
  return { x: (dstW - width) / 2, y: (dstH - height) / 2, width, height };
}

/**
 * Live image preview rendered with Konva. Supports the lower-third overlay
 * (matches the chosen export preset) and the stacked article card (auto-height,
 * vertically scrollable so the whole story is visible).
 */
export function ImagePreview() {
  const media = useLapperStore((s) => s.media);
  const overlay = useLapperStore((s) => s.overlay);
  const logo = useLapperStore((s) => s.logo);
  const imagePresetId = useLapperStore((s) => s.imagePresetId);
  const fontsReady = useFontsReady();

  const [containerRef, size] = useElementSize<HTMLDivElement>();
  const { image, status } = useHtmlImage(media?.url);
  const { image: logoImage } = useHtmlImage(logo?.src);

  const family = fontsReady ? getFontFamily() : "Inter, system-ui, sans-serif";
  const isArticle = overlay.layout === "article";
  const logoDims = React.useMemo(
    () =>
      logoImage
        ? { width: logoImage.width, height: logoImage.height }
        : null,
    [logoImage]
  );

  // --- Overlay stage (preset aspect) ---
  const preset =
    IMAGE_EXPORT_PRESETS.find((p) => p.id === imagePresetId) ??
    IMAGE_EXPORT_PRESETS[0];
  const aspect = preset.width / preset.height;

  const overlayStage = React.useMemo(() => {
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

  const overlayGeometry = React.useMemo<OverlayGeometry | null>(() => {
    if (isArticle || overlayStage.width <= 0) return null;
    return computeOverlayLayout({
      targetWidth: overlayStage.width,
      targetHeight: overlayStage.height,
      settings: overlay,
      fontFamily: family,
      logo: logoDims,
    });
  }, [isArticle, overlayStage.width, overlayStage.height, overlay, family, logoDims]);

  // --- Article stage (auto height) ---
  const articleWidth = Math.min(size.width, ARTICLE_MAX_PREVIEW_WIDTH);
  const articleGeometry = React.useMemo<ArticleGeometry | null>(() => {
    if (!isArticle || !image || articleWidth <= 0) return null;
    return computeArticleLayout({
      targetWidth: articleWidth,
      mediaAspect: image.width / image.height,
      settings: overlay,
      fontFamily: family,
      logo: logoDims,
    });
  }, [isArticle, image, articleWidth, overlay, family, logoDims]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "h-full w-full",
        isArticle
          ? "flex justify-center overflow-y-auto py-2"
          : "flex items-center justify-center"
      )}
    >
      {isArticle
        ? articleGeometry &&
          image && (
            <div
              className="h-fit overflow-hidden rounded-2xl shadow-soft-lg ring-1 ring-border"
              style={{ width: articleGeometry.width }}
            >
              <Stage
                width={articleGeometry.width}
                height={Math.ceil(articleGeometry.height)}
              >
                <ArticleLayer
                  geometry={articleGeometry}
                  image={image}
                  logoImage={logoImage}
                  fontWeight={overlay.fontWeight}
                />
              </Stage>
            </div>
          )
        : overlayStage.width > 0 &&
          overlayGeometry && (
            <div
              className={cn(
                "overflow-hidden rounded-2xl shadow-soft-lg ring-1 ring-border transition-opacity",
                status === "loaded" ? "opacity-100" : "opacity-0"
              )}
              style={{ width: overlayStage.width, height: overlayStage.height }}
            >
              <Stage width={overlayStage.width} height={overlayStage.height}>
                <Layer listening={false}>
                  <Rect
                    x={0}
                    y={0}
                    width={overlayStage.width}
                    height={overlayStage.height}
                    fill={BACKDROP_FILL}
                  />
                  {image && (
                    <KonvaImage
                      image={image}
                      {...coverRect(
                        image.width,
                        image.height,
                        overlayStage.width,
                        overlayStage.height
                      )}
                    />
                  )}

                  <Rect
                    x={overlayGeometry.banner.x}
                    y={overlayGeometry.banner.y}
                    width={overlayGeometry.banner.width}
                    height={overlayGeometry.banner.height}
                    cornerRadius={overlayGeometry.banner.radius}
                    fill={overlayGeometry.banner.fill}
                  />

                  {overlayGeometry.kicker && (
                    <>
                      <Rect
                        x={overlayGeometry.kicker.barX}
                        y={overlayGeometry.kicker.barY}
                        width={overlayGeometry.kicker.barWidth}
                        height={overlayGeometry.kicker.barHeight}
                        cornerRadius={overlayGeometry.kicker.barRadius}
                        fill={overlayGeometry.kicker.barFill}
                      />
                      <Text
                        x={overlayGeometry.kicker.textX}
                        y={overlayGeometry.kicker.textY}
                        text={overlayGeometry.kicker.text}
                        fontFamily={overlayGeometry.fontFamily}
                        fontSize={overlayGeometry.kicker.fontSize}
                        fontStyle="700"
                        fill={overlayGeometry.kicker.color}
                        letterSpacing={overlayGeometry.kicker.letterSpacing}
                      />
                    </>
                  )}

                  {overlayGeometry.headline.lines.map((line, i) => (
                    <Text
                      key={i}
                      x={line.x}
                      y={line.y}
                      text={line.text}
                      fontFamily={overlayGeometry.fontFamily}
                      fontSize={overlayGeometry.headline.fontSize}
                      fontStyle={String(overlay.fontWeight)}
                      fill={overlayGeometry.headline.color}
                    />
                  ))}

                  {overlayGeometry.body?.lines.map((line, i) => (
                    <Text
                      key={`body-${i}`}
                      x={line.x}
                      y={line.y}
                      text={line.text}
                      fontFamily={overlayGeometry.fontFamily}
                      fontSize={overlayGeometry.body!.fontSize}
                      fontStyle="400"
                      fill={overlayGeometry.body!.color}
                    />
                  ))}

                  {overlayGeometry.logo && logoImage && (
                    <KonvaImage
                      image={logoImage}
                      x={overlayGeometry.logo.x}
                      y={overlayGeometry.logo.y}
                      width={overlayGeometry.logo.width}
                      height={overlayGeometry.logo.height}
                      shadowColor="#000000"
                      shadowBlur={overlayGeometry.logo.width * 0.05}
                      shadowOpacity={0.22}
                      shadowOffsetY={overlayGeometry.logo.width * 0.012}
                    />
                  )}
                </Layer>
              </Stage>
            </div>
          )}
    </div>
  );
}

/** Konva layer for the article card (shared shape with the export renderer). */
function ArticleLayer({
  geometry,
  image,
  logoImage,
  fontWeight,
}: {
  geometry: ArticleGeometry;
  image: HTMLImageElement;
  logoImage: HTMLImageElement | undefined;
  fontWeight: FontWeight;
}) {
  const m = geometry.media;
  const cover = coverRect(image.width, image.height, m.width, m.height);
  return (
    <Layer listening={false}>
      <Rect
        x={0}
        y={0}
        width={geometry.width}
        height={geometry.height}
        fill={geometry.panel.fill}
      />
      <Group clipX={m.x} clipY={m.y} clipWidth={m.width} clipHeight={m.height}>
        <KonvaImage
          image={image}
          x={m.x + cover.x}
          y={m.y + cover.y}
          width={cover.width}
          height={cover.height}
        />
      </Group>

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
          key={`h-${i}`}
          x={line.x}
          y={line.y}
          text={line.text}
          fontFamily={geometry.fontFamily}
          fontSize={geometry.headline.fontSize}
          fontStyle={String(fontWeight)}
          fill={geometry.headline.color}
        />
      ))}

      {geometry.body?.lines.map((line, i) => (
        <Text
          key={`b-${i}`}
          x={line.x}
          y={line.y}
          text={line.text}
          fontFamily={geometry.fontFamily}
          fontSize={geometry.body!.fontSize}
          fontStyle="400"
          fill={geometry.body!.color}
        />
      ))}

      {geometry.logo && logoImage && (
        <KonvaImage
          image={logoImage}
          x={geometry.logo.x}
          y={geometry.logo.y}
          width={geometry.logo.width}
          height={geometry.logo.height}
          shadowColor="#000000"
          shadowBlur={geometry.logo.width * 0.05}
          shadowOpacity={0.22}
          shadowOffsetY={geometry.logo.width * 0.012}
        />
      )}
    </Layer>
  );
}

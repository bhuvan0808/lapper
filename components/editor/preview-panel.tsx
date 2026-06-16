"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

import { VideoPreview } from "@/components/editor/video-preview";
import { useLapperStore } from "@/lib/store";

// Konva touches the DOM/canvas at import time, so it must be client-only.
const ImagePreview = dynamic(
  () => import("@/components/editor/image-preview").then((m) => m.ImagePreview),
  {
    ssr: false,
    loading: () => <PreviewSkeleton />,
  }
);

function PreviewSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export function PreviewPanel() {
  const media = useLapperStore((s) => s.media);

  return (
    <div className="relative flex h-full min-h-[320px] w-full items-center justify-center rounded-[var(--radius)] border border-border bg-grain bg-secondary/30 p-4 sm:p-8">
      {!media ? (
        <PreviewSkeleton />
      ) : media.kind === "image" ? (
        <ImagePreview />
      ) : (
        <VideoPreview />
      )}
    </div>
  );
}

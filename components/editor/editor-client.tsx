"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileImage, FileVideo, Sparkles } from "lucide-react";

import { Brand } from "@/components/brand";
import { ControlsPanel } from "@/components/editor/controls-panel";
import { ExportBar } from "@/components/editor/export-bar";
import { PreviewPanel } from "@/components/editor/preview-panel";
import { UploadDropzone } from "@/components/upload-dropzone";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLapperStore } from "@/lib/store";

export function EditorClient() {
  const router = useRouter();
  const media = useLapperStore((s) => s.media);
  const clearMedia = useLapperStore((s) => s.clearMedia);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  // No media (e.g. a direct visit / refresh) → send the user back to upload.
  React.useEffect(() => {
    if (mounted && !media) router.replace("/");
  }, [mounted, media, router]);

  if (!media) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
        Redirecting to upload…
      </div>
    );
  }

  const startOver = () => {
    clearMedia();
    router.push("/");
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Brand />
          <div className="hidden items-center gap-2 sm:flex">
            <Badge variant="primary">
              {media.kind === "image" ? (
                <FileImage className="h-3.5 w-3.5" />
              ) : (
                <FileVideo className="h-3.5 w-3.5" />
              )}
              <span className="max-w-[200px] truncate">{media.name}</span>
            </Badge>
          </div>
          <Button variant="outline" size="sm" onClick={startOver}>
            Start over
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          {/* Preview (left) */}
          <div className="lg:sticky lg:top-[calc(4.5rem+1px)] lg:h-[calc(100dvh-6.5rem)]">
            <PreviewPanel />
          </div>

          {/* Controls (right) */}
          <div className="space-y-6">
            <Card className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium text-foreground">
                  Source file
                </p>
              </div>
              <UploadDropzone variant="compact" />
            </Card>

            <Card className="p-6">
              <ControlsPanel />
            </Card>

            <Card className="p-6">
              <h2 className="mb-1 text-base font-semibold text-foreground">
                Export
              </h2>
              <p className="mb-5 text-sm text-muted-foreground">
                Download in high quality. Everything renders on your device.
              </p>
              <ExportBar />
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

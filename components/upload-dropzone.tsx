"use client";

import * as React from "react";
import { ImageIcon, Loader2, UploadCloud, Video } from "lucide-react";

import { ACCEPT_ATTRIBUTE, MAX_VIDEO_DURATION_SECONDS } from "@/lib/constants";
import { createMediaAsset, detectKind } from "@/lib/media";
import { useLapperStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface UploadDropzoneProps {
  /** Called after a file is successfully loaded into the store. */
  onComplete?: () => void;
  className?: string;
  variant?: "hero" | "compact";
}

export function UploadDropzone({
  onComplete,
  className,
  variant = "hero",
}: UploadDropzoneProps) {
  const setMedia = useLapperStore((s) => s.setMedia);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [warning, setWarning] = React.useState<string | null>(null);

  const handleFile = React.useCallback(
    async (file: File) => {
      setError(null);
      setWarning(null);

      if (!detectKind(file)) {
        setError("Unsupported file. Use PNG, JPG, WEBP, MP4, MOV, or WebM.");
        return;
      }

      setIsLoading(true);
      try {
        const asset = await createMediaAsset(file);
        if (
          asset.kind === "video" &&
          asset.duration > MAX_VIDEO_DURATION_SECONDS
        ) {
          setWarning(
            `Heads up: only the first ${MAX_VIDEO_DURATION_SECONDS}s will be exported.`
          );
        }
        setMedia(asset);
        onComplete?.();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong reading that file."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [setMedia, onComplete]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset so selecting the same file again still fires change.
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const openPicker = () => inputRef.current?.click();

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openPicker();
    }
  };

  const isCompact = variant === "compact";

  return (
    <div className={cn("w-full", className)}>
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload an image or video"
        aria-busy={isLoading}
        onClick={openPicker}
        onKeyDown={onKeyDown}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={cn(
          "group relative flex w-full cursor-pointer flex-col items-center justify-center rounded-[var(--radius)] border-2 border-dashed border-border bg-card text-center transition-all duration-200",
          "hover:border-primary/60 hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          isDragging && "border-primary bg-secondary/60",
          isCompact ? "gap-2 p-6" : "gap-4 p-10 sm:p-14"
        )}
      >
        <div
          className={cn(
            "flex items-center justify-center rounded-full bg-secondary text-primary transition-transform duration-200 group-hover:scale-105",
            isCompact ? "h-12 w-12" : "h-16 w-16"
          )}
        >
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <UploadCloud className={isCompact ? "h-5 w-5" : "h-7 w-7"} />
          )}
        </div>

        <div className="space-y-1">
          <p
            className={cn(
              "font-semibold text-foreground",
              isCompact ? "text-sm" : "text-lg"
            )}
          >
            {isLoading
              ? "Reading your file…"
              : isCompact
                ? "Upload a different file"
                : "Drop your image or video here"}
          </p>
          {!isCompact && (
            <p className="text-sm text-muted-foreground">
              or{" "}
              <span className="font-medium text-primary underline-offset-4 group-hover:underline">
                browse to choose a file
              </span>
            </p>
          )}
        </div>

        {!isCompact && (
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5" /> PNG · JPG · WEBP
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Video className="h-3.5 w-3.5" /> MP4 · MOV · WEBM
            </span>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          onChange={onInputChange}
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>

      {error && (
        <p
          role="alert"
          className="mt-3 text-sm font-medium text-destructive"
        >
          {error}
        </p>
      )}
      {warning && !error && (
        <p className="mt-3 text-sm font-medium text-primary">{warning}</p>
      )}
    </div>
  );
}

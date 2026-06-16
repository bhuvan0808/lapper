"use client";

import * as React from "react";
import { ImagePlus, Trash2 } from "lucide-react";

import { useLapperStore } from "@/lib/store";

/** Upload / preview / remove a brand logo (stored as a data URL). */
export function LogoField() {
  const logo = useLapperStore((s) => s.logo);
  const setLogo = useLapperStore((s) => s.setLogo);
  const clearLogo = useLapperStore((s) => s.clearLogo);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleFile = (file: File) => {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (PNG, JPG, SVG, or WEBP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const img = new Image();
      img.onload = () =>
        setLogo({
          src,
          width: img.naturalWidth || 300,
          height: img.naturalHeight || 100,
        });
      img.onerror = () => setError("That image couldn't be read.");
      img.src = src;
    };
    reader.onerror = () => setError("That image couldn't be read.");
    reader.readAsDataURL(file);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-2">
      {logo ? (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/30 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logo.src}
            alt="Brand logo preview"
            className="h-12 w-12 shrink-0 rounded-lg object-contain"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              Logo added
            </p>
            <p className="text-xs text-muted-foreground">
              Shown in the top-right corner
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-full px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={clearLogo}
              aria-label="Remove logo"
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card px-4 py-4 text-sm font-medium text-muted-foreground transition-all hover:border-primary/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <ImagePlus className="h-4 w-4" />
          Upload your logo
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={onInputChange}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />

      {error && (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

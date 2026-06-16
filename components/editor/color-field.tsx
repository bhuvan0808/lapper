"use client";

import * as React from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ColorFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const HEX_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/** A colour swatch + editable hex field, kept in sync. */
export function ColorField({ id, label, value, onChange }: ColorFieldProps) {
  // Local text state so users can type partial hex without it being rejected.
  const [text, setText] = React.useState(value);

  React.useEffect(() => {
    setText(value);
  }, [value]);

  const commitText = (raw: string) => {
    let next = raw.trim();
    if (next && !next.startsWith("#")) next = `#${next}`;
    setText(next);
    if (HEX_PATTERN.test(next)) onChange(next.toUpperCase());
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-border shadow-sm">
          <input
            id={id}
            type="color"
            value={HEX_PATTERN.test(value) ? value : "#000000"}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            className="absolute inset-0 h-full w-full cursor-pointer"
            aria-label={`${label} swatch`}
          />
        </div>
        <input
          type="text"
          inputMode="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={(e) => commitText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitText((e.target as HTMLInputElement).value);
          }}
          aria-label={`${label} hex value`}
          maxLength={7}
          className={cn(
            "h-11 w-full rounded-xl border border-input bg-card px-3 font-mono text-sm uppercase text-foreground shadow-sm transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
          )}
        />
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import {
  AlignVerticalJustifyStart,
  AlignVerticalJustifyEnd,
  BadgeCheck,
  Palette,
  RotateCcw,
  Type,
} from "lucide-react";

import { ColorField } from "@/components/editor/color-field";
import { ControlSection } from "@/components/editor/control-section";
import { LogoField } from "@/components/editor/logo-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  BORDER_RADIUS_RANGE,
  DEFAULT_OVERLAY,
  FONT_SIZE_RANGE,
  FONT_WEIGHT_OPTIONS,
  LOGO_SCALE_RANGE,
} from "@/lib/constants";
import { useLapperStore } from "@/lib/store";
import type { FontWeight, OverlayPosition, OverlaySettings } from "@/lib/types";
import { cn } from "@/lib/utils";

const POSITION_OPTIONS: {
  value: OverlayPosition;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "top", label: "Top", icon: <AlignVerticalJustifyStart /> },
  { value: "bottom", label: "Bottom", icon: <AlignVerticalJustifyEnd /> },
];

export function ControlsPanel() {
  const setOverlay = useLapperStore((s) => s.setOverlay);
  const logo = useLapperStore((s) => s.logo);

  // RHF owns the form; defaults come from the store's current overlay.
  const initialValues = React.useRef(
    useLapperStore.getState().overlay
  ).current;
  const { register, control, watch, reset } = useForm<OverlaySettings>({
    defaultValues: initialValues,
  });

  // Push every change into the global store, which drives the live preview.
  React.useEffect(() => {
    const subscription = watch((values) => {
      setOverlay(values as Partial<OverlaySettings>);
    });
    return () => subscription.unsubscribe();
  }, [watch, setOverlay]);

  const handleReset = () => {
    reset({ ...DEFAULT_OVERLAY });
    setOverlay({ ...DEFAULT_OVERLAY });
  };

  return (
    <form
      className="space-y-8"
      onSubmit={(e) => e.preventDefault()}
      aria-label="Overlay settings"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">Customize</h2>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>

      {/* Content */}
      <ControlSection
        title="Content"
        description="What your banner says"
        icon={<Type />}
      >
        <div className="space-y-2">
          <Label htmlFor="headline">Headline text</Label>
          <Input
            id="headline"
            placeholder="Your headline goes here"
            maxLength={120}
            {...register("headline")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="body">Details (optional)</Label>
          <Textarea
            id="body"
            placeholder="Add supporting text shown beneath the headline…"
            rows={4}
            maxLength={400}
            {...register("body")}
          />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-secondary/30 px-4 py-3">
          <div>
            <Label htmlFor="showKicker" className="cursor-pointer">
              Kicker badge
            </Label>
            <p className="text-xs text-muted-foreground">
              The small label above the headline
            </p>
          </div>
          <Controller
            control={control}
            name="showKicker"
            render={({ field }) => (
              <Switch
                id="showKicker"
                checked={field.value}
                onCheckedChange={field.onChange}
                aria-label="Toggle kicker badge"
              />
            )}
          />
        </div>

        <Controller
          control={control}
          name="showKicker"
          render={({ field: kickerToggle }) => (
            <div
              className={cn(
                "space-y-2 transition-opacity",
                kickerToggle.value ? "opacity-100" : "pointer-events-none opacity-50"
              )}
            >
              <Label htmlFor="kicker">Kicker text</Label>
              <Input
                id="kicker"
                placeholder="BREAKING NEWS"
                maxLength={40}
                disabled={!kickerToggle.value}
                {...register("kicker")}
              />
            </div>
          )}
        />
      </ControlSection>

      {/* Position */}
      <ControlSection
        title="Position"
        description="Where the banner sits"
        icon={<AlignVerticalJustifyEnd />}
      >
        <Controller
          control={control}
          name="position"
          render={({ field }) => (
            <div
              role="radiogroup"
              aria-label="Banner position"
              className="grid grid-cols-2 gap-3"
            >
              {POSITION_OPTIONS.map((option) => {
                const selected = field.value === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => field.onChange(option.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl border-2 bg-card p-4 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      selected
                        ? "border-primary text-foreground shadow-soft"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    )}
                  >
                    <span
                      className={cn(
                        "[&_svg]:h-5 [&_svg]:w-5",
                        selected ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {option.icon}
                    </span>
                    {option.label}
                  </button>
                );
              })}
            </div>
          )}
        />
      </ControlSection>

      {/* Colors */}
      <ControlSection
        title="Colors"
        description="Make it yours"
        icon={<Palette />}
      >
        <Controller
          control={control}
          name="textColor"
          render={({ field }) => (
            <ColorField
              id="textColor"
              label="Text color"
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="bannerColor"
          render={({ field }) => (
            <ColorField
              id="bannerColor"
              label="Banner color"
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="bannerOpacity"
          render={({ field }) => (
            <SliderRow
              id="bannerOpacity"
              label="Banner opacity"
              display={`${Math.round(field.value * 100)}%`}
              min={0}
              max={100}
              step={1}
              value={Math.round(field.value * 100)}
              onValueChange={(v) => field.onChange(v / 100)}
            />
          )}
        />
      </ControlSection>

      {/* Typography */}
      <ControlSection
        title="Typography"
        description="Size and weight"
        icon={<Type />}
      >
        <Controller
          control={control}
          name="fontSize"
          render={({ field }) => (
            <SliderRow
              id="fontSize"
              label="Font size"
              display={`${Math.round(field.value)}px`}
              min={FONT_SIZE_RANGE.min}
              max={FONT_SIZE_RANGE.max}
              step={FONT_SIZE_RANGE.step}
              value={field.value}
              onValueChange={field.onChange}
            />
          )}
        />

        <div className="space-y-2">
          <Label htmlFor="fontWeight">Font weight</Label>
          <Controller
            control={control}
            name="fontWeight"
            render={({ field }) => (
              <Select
                value={String(field.value)}
                onValueChange={(v) =>
                  field.onChange(Number(v) as FontWeight)
                }
              >
                <SelectTrigger id="fontWeight">
                  <SelectValue placeholder="Weight" />
                </SelectTrigger>
                <SelectContent>
                  {FONT_WEIGHT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <Controller
          control={control}
          name="borderRadius"
          render={({ field }) => (
            <SliderRow
              id="borderRadius"
              label="Border radius"
              display={`${Math.round(field.value)}px`}
              min={BORDER_RADIUS_RANGE.min}
              max={BORDER_RADIUS_RANGE.max}
              step={BORDER_RADIUS_RANGE.step}
              value={field.value}
              onValueChange={field.onChange}
            />
          )}
        />
      </ControlSection>

      {/* Branding */}
      <ControlSection
        title="Branding"
        description="Your logo, top-right"
        icon={<BadgeCheck />}
      >
        <LogoField />

        {logo && (
          <>
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-secondary/30 px-4 py-3">
              <div>
                <Label htmlFor="showLogo" className="cursor-pointer">
                  Show logo
                </Label>
                <p className="text-xs text-muted-foreground">
                  Display it on the export
                </p>
              </div>
              <Controller
                control={control}
                name="showLogo"
                render={({ field }) => (
                  <Switch
                    id="showLogo"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    aria-label="Toggle logo"
                  />
                )}
              />
            </div>

            <Controller
              control={control}
              name="logoScale"
              render={({ field }) => (
                <SliderRow
                  id="logoScale"
                  label="Logo size"
                  display={`${Math.round(field.value * 100)}%`}
                  min={LOGO_SCALE_RANGE.min}
                  max={LOGO_SCALE_RANGE.max}
                  step={LOGO_SCALE_RANGE.step}
                  value={field.value}
                  onValueChange={field.onChange}
                />
              )}
            />
          </>
        )}
      </ControlSection>
    </form>
  );
}

interface SliderRowProps {
  id: string;
  label: string;
  display: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onValueChange: (value: number) => void;
}

function SliderRow({
  id,
  label,
  display,
  min,
  max,
  step,
  value,
  onValueChange,
}: SliderRowProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        <span className="tabular-nums text-xs font-medium text-muted-foreground">
          {display}
        </span>
      </div>
      <Slider
        id={id}
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(v) => onValueChange(v[0])}
        aria-label={label}
      />
    </div>
  );
}

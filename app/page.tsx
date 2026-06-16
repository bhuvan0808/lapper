import {
  Download,
  ImageIcon,
  MousePointerClick,
  ShieldCheck,
  Sparkles,
  Video,
} from "lucide-react";

import { Brand } from "@/components/brand";
import { LandingUpload } from "@/components/landing/landing-upload";
import { Badge } from "@/components/ui/badge";

const STEPS = [
  {
    icon: ImageIcon,
    title: "Upload",
    body: "Drop in any image or video. Everything stays on your device.",
  },
  {
    icon: MousePointerClick,
    title: "Customize",
    body: "Add a headline, pick colors, and position your banner — live.",
  },
  {
    icon: Download,
    title: "Download",
    body: "Export crisp PNGs and MP4s in social-ready dimensions.",
  },
];

const FEATURES = [
  {
    icon: Sparkles,
    title: "Broadcast-quality overlays",
    body: "A polished lower-third with a kicker badge and headline, styled like the news.",
  },
  {
    icon: ShieldCheck,
    title: "Private by design",
    body: "No login, no uploads, no servers. Your media never leaves the browser.",
  },
  {
    icon: Video,
    title: "Images and video",
    body: "High-resolution stills up to 1080×1920 and 1080p video with sound.",
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-background bg-grain">
      {/* Header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Brand href={null} />
        <a
          href="#how-it-works"
          className="hidden rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-block"
        >
          How it works
        </a>
      </header>

      {/* Hero */}
      <main>
        <section className="mx-auto max-w-3xl px-6 pb-10 pt-10 text-center sm:pt-16">
          <Badge variant="accent" className="mx-auto animate-fade-in">
            <Sparkles className="h-3.5 w-3.5" />
            100% in your browser · no account needed
          </Badge>

          <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-6xl">
            Create professional text overlays for images and videos.
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-balance text-lg text-muted-foreground">
            Upload. Customize. Download. No design skills required.
          </p>

          <div className="mt-10">
            <LandingUpload />
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Supports PNG, JPG, WEBP, MP4, MOV and WebM.
          </p>
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          className="mx-auto max-w-5xl scroll-mt-20 px-6 py-16"
        >
          <div className="grid gap-5 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <div
                key={step.title}
                className="rounded-[var(--radius)] border border-border bg-card p-7 shadow-soft"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-primary">
                    <step.icon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    Step {index + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-xl font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-5xl px-6 pb-24">
          <div className="rounded-[var(--radius)] border border-border bg-card p-8 shadow-soft sm:p-12">
            <h2 className="max-w-2xl text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Everything you need to make media look on-air.
            </h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-3">
              {FEATURES.map((feature) => (
                <div key={feature.title}>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/30 text-foreground">
                    <feature.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {feature.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <Brand href={null} />
          <p className="text-sm text-muted-foreground">
            Built for the browser. No data ever leaves your device.
          </p>
        </div>
      </footer>
    </div>
  );
}

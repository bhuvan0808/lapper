# Lapper

**Create professional text overlays for images and videos — right in your browser.**

Lapper is a calm, premium, single-purpose web tool: upload an image or video, add a
news-style lower-third overlay, fine-tune it live, and download a high-quality file.

- 🖼️ Images → crisp **PNG** at 1080×1080, 1080×1350, or 1080×1920 (4× pixel ratio)
- 🎬 Videos → **MP4 / WebM** at 1920×1080, 30fps, with sound
- 🏷️ **Brand logo** pinned to the top-right corner of every export (upload any PNG/JPG/SVG/WEBP)
- 📝 **Headline + supporting paragraph** for richer, detailed lower-thirds
- 📰 **Article layout** — photo on top, a text panel below that **auto-grows to fit long news** (20+ lines)
- 🌐 **Telugu + English** rendering (Noto Sans Telugu with per-glyph fallback)
- 🔊 **Audio control** — mute or set the video's volume; baked into the export via the Web Audio API
- 🎙️ **Mic voiceover** — record narration from your device microphone, hear it in the preview, and mix it into the exported video
- 🔒 **100% client-side** — no login, no backend, no uploads. Your media never leaves your device.

---

## Tech stack

| Concern        | Choice                                   |
| -------------- | ---------------------------------------- |
| Framework      | Next.js 15 (App Router) + TypeScript     |
| Styling        | Tailwind CSS + shadcn/ui (Radix)         |
| State          | Zustand                                  |
| Forms          | React Hook Form                          |
| Image render   | Konva (`react-konva`)                    |
| Video export   | Canvas + `MediaRecorder` + FFmpeg.wasm   |
| Icons          | lucide-react                             |

> **On Remotion & video export.** The original brief listed Remotion. Remotion's
> renderer needs a Node/server runtime (or Remotion's cloud), which conflicts with
> the hard "no backend / browser-only" requirement. To keep everything client-side,
> Lapper composites each frame onto a canvas, records it in real time with
> `MediaRecorder`, and uses **FFmpeg.wasm** to transcode to MP4. This is a real,
> working, server-free pipeline. The overlay layout lives in one shared module
> (`lib/overlay-layout.ts`) so the Konva (image) and Canvas (video) renderers stay
> pixel-identical.

---

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Run the dev server
npm run dev
# → http://localhost:3000

# 3. Production build
npm run build
npm run start
```

Requirements: **Node.js 18.18+** (Node 20/22/24 recommended).

### Environment variables

None are required. One is optional:

| Variable               | Purpose                                              | Default                 |
| ---------------------- | ---------------------------------------------------- | ----------------------- |
| `NEXT_PUBLIC_SITE_URL` | Absolute base URL for SEO metadata, OG tags, sitemap | `http://localhost:3000` |

Set it in Vercel (or a local `.env.local`) to your production domain, e.g.
`NEXT_PUBLIC_SITE_URL=https://lapper.vercel.app`.

---

## How it works

1. **Upload** — the file is read into a browser object URL (never uploaded). Image
   dimensions / video metadata are read locally.
2. **Customize** — React Hook Form drives the controls; every change flows into a
   Zustand store that the live preview subscribes to.
3. **Preview** — images render with Konva, videos render frame-by-frame to a canvas.
   Both use the same overlay geometry, so the preview is exactly what you export.
4. **Export**
   - **Images:** an off-screen Konva stage is rasterised with `toDataURL({ pixelRatio: 4 })`.
   - **Videos:** the composited canvas is recorded via `MediaRecorder`. If the browser
     can record MP4 directly (e.g. Safari) it's used as-is; otherwise WebM is captured
     and transcoded to MP4 with FFmpeg.wasm (loaded lazily from a CDN on first use).

---

## Folder structure

```
lapper/
├── app/
│   ├── layout.tsx           # Root layout, Inter font, SEO metadata
│   ├── page.tsx             # Landing page (hero + upload)
│   ├── editor/page.tsx      # Editor route
│   ├── globals.css          # Theme tokens (cream & stone palette)
│   ├── manifest.ts          # PWA manifest
│   ├── icon.tsx             # Generated favicon
│   ├── apple-icon.tsx       # Generated Apple touch icon
│   ├── opengraph-image.tsx  # Generated OG / social card
│   ├── robots.ts            # robots.txt
│   └── sitemap.ts           # sitemap.xml
├── components/
│   ├── brand.tsx
│   ├── upload-dropzone.tsx
│   ├── landing/             # Landing-only pieces
│   ├── editor/              # Editor shell, preview, controls, export
│   └── ui/                  # shadcn/ui primitives
├── hooks/                   # use-element-size, use-html-image, use-fonts-ready
├── lib/
│   ├── store.ts             # Zustand store
│   ├── types.ts             # Domain types
│   ├── constants.ts         # Palette, presets, defaults
│   ├── overlay-layout.ts    # Shared overlay geometry (Konva + Canvas)
│   ├── image-export.ts      # Konva PNG export
│   ├── video-export.ts      # MediaRecorder + FFmpeg.wasm pipeline
│   ├── ffmpeg.ts            # Lazy FFmpeg.wasm loader
│   ├── media.ts             # File validation + metadata
│   └── utils.ts             # cn(), color + download helpers
├── next.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

---

## Accessibility

- Full keyboard navigation (the dropzone is focusable and Enter/Space activates it).
- ARIA labels on controls, `role="status"` + `aria-live` on export progress.
- Visible, on-brand focus rings everywhere.
- WCAG-conscious cream-and-stone palette with strong text contrast.

---

## Browser support for video export

- **Chrome / Edge / Firefox:** records WebM, transcodes to MP4 via FFmpeg.wasm.
- **Safari 17+:** can record MP4 directly (no transcode needed).
- WebM export works without FFmpeg and is the fastest path. If MP4 encoding isn't
  available in your browser, Lapper tells you and you can switch to WebM.
- Video export records in real time, so a 30s clip takes ~30s. Clips are capped at 60s.

---

## Deployment

### GitHub

```bash
git init
git add .
git commit -m "Initial Lapper release"
git branch -M main
git remote add origin https://github.com/<you>/lapper.git
git push -u origin main
```

### Vercel

1. Import the GitHub repo at [vercel.com/new](https://vercel.com/new).
2. Framework preset auto-detects **Next.js** — no config needed.
3. (Optional) add `NEXT_PUBLIC_SITE_URL` = your production URL.
4. Deploy. ✅

There are no API routes, server actions, or databases — Lapper deploys as a static +
client-rendered Next.js app.

---

## License

MIT — see [LICENSE](LICENSE).

import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Telugu } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

// Telugu support: Inter has no Telugu glyphs, so we add Noto Sans Telugu and let
// the browser fall back per-glyph (Latin → Inter, Telugu → Noto). Used by the
// UI and by the canvas/Konva text renderers.
const notoTelugu = Noto_Sans_Telugu({
  subsets: ["telugu"],
  variable: "--font-noto-telugu",
  display: "swap",
  weight: ["400", "500", "600", "700"],
  preload: false,
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Lapper – Create Professional Text Overlays",
    template: "%s · Lapper",
  },
  description:
    "Create news-style overlays for images and videos directly in your browser.",
  applicationName: "Lapper",
  keywords: [
    "text overlay",
    "lower third",
    "news banner",
    "image overlay",
    "video overlay",
    "breaking news generator",
    "browser editor",
  ],
  authors: [{ name: "Lapper" }],
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    siteName: "Lapper",
    title: "Lapper – Create Professional Text Overlays",
    description:
      "Create news-style overlays for images and videos directly in your browser.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Lapper – Create Professional Text Overlays",
    description:
      "Create news-style overlays for images and videos directly in your browser.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#FAF8F4",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${notoTelugu.variable}`}>
      <body className="min-h-dvh bg-background font-sans text-foreground">
        {children}
      </body>
    </html>
  );
}

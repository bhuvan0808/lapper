import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lapper – Create Professional Text Overlays",
    short_name: "Lapper",
    description:
      "Create news-style overlays for images and videos directly in your browser.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF8F4",
    theme_color: "#FAF8F4",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}

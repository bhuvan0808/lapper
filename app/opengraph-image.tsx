import { ImageResponse } from "next/og";

export const alt = "Lapper – Create Professional Text Overlays";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Generated Open Graph / social share card. */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "96px",
          background: "#FAF8F4",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            color: "#8B7355",
            fontSize: 34,
            fontWeight: 700,
            letterSpacing: 2,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#8B7355",
              color: "#FAF8F4",
              borderRadius: 18,
              fontSize: 44,
            }}
          >
            L
          </div>
          LAPPER
        </div>

        <div
          style={{
            marginTop: 48,
            color: "#2C2C2C",
            fontSize: 76,
            fontWeight: 700,
            lineHeight: 1.1,
            maxWidth: 900,
          }}
        >
          Create professional text overlays for images and videos.
        </div>

        <div
          style={{
            marginTop: 28,
            color: "#7A7A7A",
            fontSize: 36,
            fontWeight: 400,
          }}
        >
          Upload. Customize. Download. No design skills required.
        </div>
      </div>
    ),
    { ...size }
  );
}

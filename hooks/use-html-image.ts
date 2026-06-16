"use client";

import * as React from "react";

type Status = "loading" | "loaded" | "error";

/** Load an image URL into an HTMLImageElement for Konva, tracking status. */
export function useHtmlImage(url: string | undefined): {
  image: HTMLImageElement | undefined;
  status: Status;
} {
  const [image, setImage] = React.useState<HTMLImageElement>();
  const [status, setStatus] = React.useState<Status>("loading");

  React.useEffect(() => {
    if (!url) return;
    let active = true;
    setStatus("loading");

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!active) return;
      setImage(img);
      setStatus("loaded");
    };
    img.onerror = () => {
      if (active) setStatus("error");
    };
    img.src = url;

    return () => {
      active = false;
    };
  }, [url]);

  return { image, status };
}

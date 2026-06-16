"use client";

import * as React from "react";

export interface Size {
  width: number;
  height: number;
}

/**
 * Track an element's content-box size with a ResizeObserver.
 * Returns a ref to attach and the latest measured size.
 */
export function useElementSize<T extends HTMLElement = HTMLDivElement>(): [
  React.RefObject<T | null>,
  Size,
] {
  const ref = React.useRef<T>(null);
  const [size, setSize] = React.useState<Size>({ width: 0, height: 0 });

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize((prev) =>
        prev.width === width && prev.height === height
          ? prev
          : { width, height }
      );
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, size];
}

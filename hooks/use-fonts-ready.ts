"use client";

import * as React from "react";

/**
 * Returns true once web fonts have finished loading, so canvas/Konva text
 * is measured and rendered with the real Inter metrics (not the fallback).
 */
export function useFontsReady(): boolean {
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    if (typeof document === "undefined" || !("fonts" in document)) {
      setReady(true);
      return;
    }
    document.fonts.ready.then(() => {
      if (active) setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  return ready;
}

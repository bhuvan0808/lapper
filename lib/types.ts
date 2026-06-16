/** Domain types shared across the editor, store, and export pipeline. */

export type MediaKind = "image" | "video";

export interface MediaAsset {
  /** Object URL pointing at the user-selected file (browser-only, never uploaded). */
  url: string;
  kind: MediaKind;
  /** Original file name, used to derive export file names. */
  name: string;
  /** Intrinsic pixel dimensions of the source media. */
  width: number;
  height: number;
  /** Video duration in seconds (0 for images). */
  duration: number;
  mimeType: string;
}

export type OverlayPosition = "top" | "bottom";

export type FontWeight = 400 | 500 | 600 | 700 | 800;

/** Everything the user can tweak about the lower-third overlay. */
export interface OverlaySettings {
  /** Small kicker / category line, e.g. "BREAKING NEWS". */
  kicker: string;
  /** Main headline shown in the banner body. */
  headline: string;
  position: OverlayPosition;
  textColor: string;
  bannerColor: string;
  /** Banner background opacity, 0–1. */
  bannerOpacity: number;
  /** Headline font size in px, expressed at the 1080px design width. */
  fontSize: number;
  fontWeight: FontWeight;
  /** Corner radius of the banner, in px at the 1080px design width. */
  borderRadius: number;
  /** Whether to show the accent kicker bar above the headline. */
  showKicker: boolean;
}

export interface ImageExportPreset {
  id: string;
  label: string;
  description: string;
  width: number;
  height: number;
}

export type ExportPhase =
  | "idle"
  | "preparing"
  | "rendering"
  | "encoding"
  | "done"
  | "error";

export interface ExportState {
  phase: ExportPhase;
  /** 0–100 progress for long-running (video) exports. */
  progress: number;
  message: string;
}

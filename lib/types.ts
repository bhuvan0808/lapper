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

/** Banner over the media, vs. a stacked "article" card (media + text panel). */
export type LayoutMode = "overlay" | "article";

export type FontWeight = 400 | 500 | 600 | 700 | 800;

/** A user-supplied brand logo, stored as a data URL so it survives reloads. */
export interface LogoAsset {
  /** Base64 data URL of the logo image. */
  src: string;
  width: number;
  height: number;
}

/** A microphone voiceover recorded in the browser (object URL of the blob). */
export interface VoiceoverAsset {
  url: string;
  duration: number;
  mimeType: string;
}

/** Everything the user can tweak about the lower-third overlay. */
export interface OverlaySettings {
  /** Overlay banner vs. stacked article card. */
  layout: LayoutMode;
  /** Small kicker / category line, e.g. "BREAKING NEWS". */
  kicker: string;
  /** Main headline shown in the banner body. */
  headline: string;
  /** Optional supporting paragraph shown beneath the headline. */
  body: string;
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
  /** Whether to show the brand logo in the top-right corner. */
  showLogo: boolean;
  /** Logo width as a fraction of the frame width (e.g. 0.16 = 16%). */
  logoScale: number;
  /** Mute the source video's audio in the export (video only). */
  muteAudio: boolean;
  /** Playback/export volume for the source video, 0–1 (video only). */
  volume: number;
  /** Volume for the recorded mic voiceover, 0–1 (video only). */
  voiceoverVolume: number;
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

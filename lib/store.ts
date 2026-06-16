import { create } from "zustand";
import {
  DEFAULT_OVERLAY,
  IMAGE_EXPORT_PRESETS,
} from "@/lib/constants";
import type {
  ExportState,
  MediaAsset,
  OverlaySettings,
} from "@/lib/types";

interface LapperState {
  /** The current image/video, or null before anything is uploaded. */
  media: MediaAsset | null;
  /** Live overlay settings — shared by the preview and the export pipeline. */
  overlay: OverlaySettings;
  /** Selected image export preset id (one of IMAGE_EXPORT_PRESETS). */
  imagePresetId: string;
  /** Status of an in-flight or completed export. */
  exportState: ExportState;

  setMedia: (media: MediaAsset) => void;
  clearMedia: () => void;
  setOverlay: (patch: Partial<OverlaySettings>) => void;
  resetOverlay: () => void;
  setImagePresetId: (id: string) => void;
  setExportState: (state: Partial<ExportState>) => void;
  resetExportState: () => void;
}

const IDLE_EXPORT: ExportState = {
  phase: "idle",
  progress: 0,
  message: "",
};

export const useLapperStore = create<LapperState>((set, get) => ({
  media: null,
  overlay: { ...DEFAULT_OVERLAY },
  imagePresetId: IMAGE_EXPORT_PRESETS[0].id,
  exportState: { ...IDLE_EXPORT },

  setMedia: (media) => {
    // Revoke a previous object URL to keep memory usage flat across uploads.
    const previous = get().media;
    if (previous && previous.url !== media.url) {
      URL.revokeObjectURL(previous.url);
    }
    set({ media, exportState: { ...IDLE_EXPORT } });
  },

  clearMedia: () => {
    const previous = get().media;
    if (previous) URL.revokeObjectURL(previous.url);
    set({ media: null, exportState: { ...IDLE_EXPORT } });
  },

  setOverlay: (patch) =>
    set((state) => ({ overlay: { ...state.overlay, ...patch } })),

  resetOverlay: () => set({ overlay: { ...DEFAULT_OVERLAY } }),

  setImagePresetId: (id) => set({ imagePresetId: id }),

  setExportState: (patch) =>
    set((state) => ({ exportState: { ...state.exportState, ...patch } })),

  resetExportState: () => set({ exportState: { ...IDLE_EXPORT } }),
}));

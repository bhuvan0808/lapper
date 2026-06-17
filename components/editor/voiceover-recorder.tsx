"use client";

import * as React from "react";
import { Mic, Square, Trash2 } from "lucide-react";

import { useLapperStore } from "@/lib/store";
import { cn, formatDuration } from "@/lib/utils";

function pickAudioMime(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return undefined;
}

/**
 * Record a voiceover from the device microphone. The clip is stored as an
 * object URL and mixed into the video preview + export.
 */
export function VoiceoverRecorder() {
  const voiceover = useLapperStore((s) => s.voiceover);
  const setVoiceover = useLapperStore((s) => s.setVoiceover);
  const clearVoiceover = useLapperStore((s) => s.clearVoiceover);

  const [isRecording, setIsRecording] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<BlobPart[]>([]);
  const streamRef = React.useRef<MediaStream | null>(null);
  const timerRef = React.useRef<number | null>(null);
  const elapsedRef = React.useRef(0);

  const stopTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const releaseMic = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  React.useEffect(() => {
    return () => {
      stopTimer();
      releaseMic();
    };
  }, []);

  const start = async () => {
    setError(null);
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setError("Recording isn't supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mime = pickAudioMime();
      const recorder = new MediaRecorder(
        stream,
        mime ? { mimeType: mime } : undefined
      );
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || mime || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        const url = URL.createObjectURL(blob);
        const seconds = elapsedRef.current;

        // MediaRecorder webm clips often report duration = Infinity, so we fall
        // back to the elapsed timer for a sensible value.
        const probe = new Audio();
        probe.preload = "metadata";
        probe.onloadedmetadata = () => {
          const d = Number.isFinite(probe.duration) ? probe.duration : seconds;
          setVoiceover({ url, duration: d, mimeType: type });
        };
        probe.onerror = () =>
          setVoiceover({ url, duration: seconds, mimeType: type });
        probe.src = url;

        releaseMic();
      };

      recorder.start();
      recorderRef.current = recorder;
      setIsRecording(true);
      setElapsed(0);
      elapsedRef.current = 0;
      timerRef.current = window.setInterval(() => {
        elapsedRef.current += 1;
        setElapsed(elapsedRef.current);
      }, 1000);
    } catch {
      setError(
        "Microphone access was blocked. Allow mic permission and try again."
      );
      releaseMic();
    }
  };

  const stop = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setIsRecording(false);
    stopTimer();
  };

  return (
    <div className="space-y-2">
      {isRecording ? (
        <button
          type="button"
          onClick={stop}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-destructive px-4 py-3 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span className="flex h-2.5 w-2.5 animate-pulse rounded-full bg-destructive-foreground" />
          <Square className="h-4 w-4" />
          Stop recording · {formatDuration(elapsed)}
        </button>
      ) : voiceover ? (
        <div className="space-y-2 rounded-xl border border-border bg-secondary/30 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">
              Voiceover added
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={start}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Mic className="h-3.5 w-3.5" />
                Re-record
              </button>
              <button
                type="button"
                onClick={clearVoiceover}
                aria-label="Delete voiceover"
                className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio src={voiceover.url} controls className="h-9 w-full" />
        </div>
      ) : (
        <button
          type="button"
          onClick={start}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card px-4 py-3 text-sm font-medium text-muted-foreground transition-all",
            "hover:border-primary/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          )}
        >
          <Mic className="h-4 w-4" />
          Record a voiceover
        </button>
      )}

      {error && (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

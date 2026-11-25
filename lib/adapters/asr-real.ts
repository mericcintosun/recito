// Real speech to text: wraps the in-browser Whisper calls from components/whisper-local.ts
// without changing them. The module is loaded through a dynamic import, so nothing from
// Transformers.js is pulled into a page until the record step asks for it.

import type { AsrAdapter } from "@/lib/adapters/asr";
import type { LocalTranscript, ModelStatus } from "@/components/whisper-local";

type WhisperModule = typeof import("@/components/whisper-local");

let modulePromise: Promise<WhisperModule> | null = null;
let modelId = "Whisper tiny.en";

function whisper(): Promise<WhisperModule> {
  if (!modulePromise) {
    modulePromise = import("@/components/whisper-local").then((m) => {
      modelId = m.MODEL_ID;
      return m;
    });
  }
  return modulePromise;
}

export const realAsrAdapter: AsrAdapter = {
  mode: "real",
  preload() {
    whisper()
      .then((m) => m.loadWhisper())
      .catch(() => undefined);
  },
  watch(listener: (s: ModelStatus) => void) {
    let off: (() => void) | null = null;
    let cancelled = false;
    whisper()
      .then((m) => {
        if (!cancelled) off = m.watchModel(listener);
      })
      .catch((err: unknown) => {
        if (!cancelled) listener({ state: "error", message: err instanceof Error ? err.message : String(err) });
      });
    return () => {
      cancelled = true;
      off?.();
    };
  },
  async transcribe(audio: Float32Array): Promise<LocalTranscript> {
    const m = await whisper();
    return m.transcribeLocally(audio);
  },
  describe(result: LocalTranscript) {
    return `${modelId} in this browser${result.timing === "segment" ? " (word timings estimated)" : ""}`;
  },
};

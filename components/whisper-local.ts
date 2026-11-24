"use client";

// In-browser speech to text with Transformers.js. The model downloads once (about 40 MB),
// is cached by the browser, and runs on this device: no key, no server, no upload.
// TODO: move the pipeline into a Web Worker so long recordings never block the UI thread.

import type { TranscriptWord } from "@/lib/data";

export const MODEL_ID = "onnx-community/whisper-tiny.en_timestamped";

export type ModelStatus =
  | { state: "idle" }
  | { state: "loading"; progress: number }
  | { state: "ready" }
  | { state: "working" }
  | { state: "error"; message: string };

interface AsrChunk {
  text: string;
  timestamp: [number, number | null];
}
interface AsrOutput {
  text: string;
  chunks?: AsrChunk[];
}
type Asr = (audio: Float32Array, options: Record<string, unknown>) => Promise<AsrOutput>;

let current: ModelStatus = { state: "idle" };
const listeners = new Set<(s: ModelStatus) => void>();
let asrPromise: Promise<Asr> | null = null;

function emit(s: ModelStatus) {
  current = s;
  listeners.forEach((l) => l(s));
}

export function watchModel(listener: (s: ModelStatus) => void): () => void {
  listeners.add(listener);
  listener(current);
  return () => {
    listeners.delete(listener);
  };
}

export function loadWhisper(): Promise<Asr> {
  if (asrPromise) return asrPromise;
  emit({ state: "loading", progress: 0 });
  asrPromise = (async () => {
    const transformers = await import("@huggingface/transformers");
    const makePipeline = transformers.pipeline as unknown as (
      task: string,
      model: string,
      options: Record<string, unknown>,
    ) => Promise<Asr>;
    const files = new Map<string, { loaded: number; total: number }>();
    const asr = await makePipeline("automatic-speech-recognition", MODEL_ID, {
      progress_callback: (info: unknown) => {
        const p = info as { status?: string; file?: string; loaded?: number; total?: number };
        if (p.status !== "progress" || !p.file || !p.total) return;
        files.set(p.file, { loaded: p.loaded ?? 0, total: p.total });
        let loaded = 0;
        let total = 0;
        files.forEach((f) => {
          loaded += f.loaded;
          total += f.total;
        });
        emit({ state: "loading", progress: total ? Math.round((loaded / total) * 100) : 0 });
      },
    });
    emit({ state: "ready" });
    return asr;
  })().catch((err: unknown) => {
    asrPromise = null;
    emit({ state: "error", message: err instanceof Error ? err.message : String(err) });
    throw err;
  });
  return asrPromise;
}

/** Spread the words of one text segment evenly across its time window. */
function spread(text: string, start: number, end: number): TranscriptWord[] {
  const parts = text.split(/\s+/).filter(Boolean);
  const step = (end - start) / Math.max(1, parts.length);
  return parts.map((p, i) => ({ text: p, start: start + i * step, end: start + (i + 1) * step * 0.9 }));
}

export interface LocalTranscript {
  words: TranscriptWord[];
  /** "word" when Whisper gave per-word times, "segment" when we had to estimate them. */
  timing: "word" | "segment";
}

/** Transcribe 16 kHz mono audio with word timestamps, entirely in this browser. */
export async function transcribeLocally(audio: Float32Array): Promise<LocalTranscript> {
  const asr = await loadWhisper();
  emit({ state: "working" });
  const duration = audio.length / 16000;
  try {
    const out = await asr(audio, { return_timestamps: "word", chunk_length_s: 30, stride_length_s: 5 });
    const words = (out.chunks ?? [])
      .map((c) => ({ text: c.text.trim(), start: c.timestamp[0], end: c.timestamp[1] ?? c.timestamp[0] + 0.3 }))
      .filter((w) => w.text.length > 0);
    if (words.length > 0 || !out.text.trim()) return { words, timing: "word" };
    return { words: spread(out.text, 0, duration), timing: "segment" };
  } catch {
    // Some model builds cannot return word-level times. Fall back to segment times
    // and spread words inside each segment; the UI labels these timings as estimates.
    const out = await asr(audio, { return_timestamps: true, chunk_length_s: 30, stride_length_s: 5 });
    const words = (out.chunks ?? []).flatMap((c) => spread(c.text, c.timestamp[0], c.timestamp[1] ?? duration));
    return { words, timing: "segment" };
  } finally {
    emit({ state: "ready" });
  }
}

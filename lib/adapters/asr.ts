import type { LocalTranscript, ModelStatus } from "@/components/whisper-local";
import { fakeAsrAdapter } from "@/lib/adapters/asr-fake";
import { realAsrAdapter } from "@/lib/adapters/asr-real";
import { adapterMode } from "@/lib/adapters/mode";
import type { AdapterMode } from "@/lib/types";

export type { LocalTranscript, ModelStatus };

/** Speech to text, behind one seam so the record step does not care which engine runs. */
export interface AsrAdapter {
  readonly mode: AdapterMode;
  /** Start warming the model, if there is one. Never throws. */
  preload(): void;
  /** Subscribe to model status; returns an unsubscribe function. */
  watch(listener: (s: ModelStatus) => void): () => void;
  transcribe(audio: Float32Array): Promise<LocalTranscript>;
  /** Plain words for the teacher: what produced this transcript. */
  describe(result: LocalTranscript): string;
}

export function getAsrAdapter(): AsrAdapter {
  return adapterMode() === "real" ? realAsrAdapter : fakeAsrAdapter;
}

// Fake speech to text for ADAPTER_MODE=fake (the default). No model download: every
// recording is answered with the sample transcript of "The House on Tern Hill" from
// fixtures/, shaped like real Transformers.js output. The timings are generated, never measured.

import type { AsrAdapter } from "@/lib/adapters/asr";
import type { LocalTranscript, ModelStatus } from "@/components/whisper-local";
import type { TranscriptWord } from "@/lib/types";
import fixture from "@/fixtures/whisper-output.tern-hill.json";

interface FixtureChunk {
  text: string;
  timestamp: [number, number | null];
}
interface FixtureOutput {
  text: string;
  chunks: FixtureChunk[];
}

const output = fixture as unknown as FixtureOutput;

export function fixtureWords(): TranscriptWord[] {
  return output.chunks
    .map((c) => ({ text: c.text.trim(), start: c.timestamp[0], end: c.timestamp[1] ?? c.timestamp[0] + 0.3 }))
    .filter((w) => w.text.length > 0);
}

export const fakeAsrAdapter: AsrAdapter = {
  mode: "fake",
  preload() {
    // Nothing to download in fake mode.
  },
  watch(listener: (s: ModelStatus) => void) {
    listener({ state: "ready" });
    return () => undefined;
  },
  async transcribe(): Promise<LocalTranscript> {
    return { words: fixtureWords(), timing: "word" };
  },
  describe() {
    return "Demo mode: sample transcript of The House on Tern Hill with generated timings, not a measurement of this recording";
  },
};

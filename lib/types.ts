// Shared types for Recito. lib/data.ts stays the seed source; this file is the one place
// pages, adapters and API handlers import their shapes from.

export type { GoldMark, MiscueKind, Passage, SampleReading, TranscriptWord } from "@/lib/data";

/** "fake" reads fixtures/ and needs no model download; "real" runs Whisper in the browser. */
export type AdapterMode = "fake" | "real";

export type ApiResponse<T> =
  | { ok: true; data: T; mode: AdapterMode }
  | { ok: false; error: { code: string; message: string } };

/** One saved sample reading as a list row, without its transcript or gold marks. */
export interface ReadingSummary {
  id: string;
  student: string;
  passageId: string;
  title: string;
  recordedOn: string;
  tests: string;
  wordCount: number;
}

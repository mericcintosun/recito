// Passages and saved readings, behind one seam. Today both modes read the seed in
// lib/data.ts; a later phase can swap in another store without touching the pages.

import { passages, sampleReadings } from "@/lib/data";
import { adapterMode } from "@/lib/adapters/mode";
import type { AdapterMode, Passage, ReadingSummary, SampleReading } from "@/lib/types";

export interface DataAdapter {
  readonly mode: AdapterMode;
  listPassages(): Promise<Passage[]>;
  getPassage(id: string): Promise<Passage | null>;
  listReadings(): Promise<ReadingSummary[]>;
  getReading(id: string): Promise<SampleReading | null>;
}

function summarize(r: SampleReading): ReadingSummary {
  const passage = passages.find((p) => p.id === r.passageId);
  return {
    id: r.id,
    student: r.student,
    passageId: r.passageId,
    title: passage?.title ?? "Unknown passage",
    recordedOn: r.recordedOn,
    tests: r.tests,
    wordCount: r.transcript.length,
  };
}

export const fakeDataAdapter: DataAdapter = {
  mode: "fake",
  async listPassages() {
    return passages;
  },
  async getPassage(id) {
    return passages.find((p) => p.id === id) ?? null;
  },
  async listReadings() {
    return sampleReadings.map(summarize);
  },
  async getReading(id) {
    return sampleReadings.find((r) => r.id === id) ?? null;
  },
};

export function getDataAdapter(): DataAdapter {
  // Real mode returns the same seed-backed implementation for now: there is no saved-readings
  // store yet, and results recorded in the app live only in the tab's sessionStorage.
  return adapterMode() === "real" ? { ...fakeDataAdapter, mode: "real" } : fakeDataAdapter;
}

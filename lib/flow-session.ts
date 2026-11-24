// State for the guided screening flow. Text state lives in sessionStorage so browser
// back and forward keep every input; the recorded audio lives only in this module's
// memory, so it never touches storage, a server, or a log, and is gone when the tab closes.

import type { TranscriptWord } from "@/lib/data";

export const FLOW_STEPS = [
  { slug: "passage", label: "Choose the passage", ask: "Pick or paste the text the child will read aloud." },
  { slug: "record", label: "Record the reading", ask: "Press record and let the child read for up to a minute. Recording stops on its own at three." },
  { slug: "review", label: "Review the marks", ask: "Check each mark, listen to the moment it happened, and overrule anything the model got wrong." },
] as const;

export type FlowStepSlug = (typeof FLOW_STEPS)[number]["slug"];

export function isFlowStep(value: string): value is FlowStepSlug {
  return FLOW_STEPS.some((s) => s.slug === value);
}

export interface FlowDraft {
  student: string;
  passageId: string | null;
  title: string;
  text: string;
}

export interface FlowTake {
  words: TranscriptWord[];
  source: "whisper" | "sample";
  /** Human-readable description of what produced the transcript. */
  producedBy: string;
  recordedAt: string;
}

export interface ResultRecord {
  student: string;
  title: string;
  text: string;
  words: TranscriptWord[];
  accepted: string[];
  recordedOn: string;
  producedBy: string;
  hasAudio: boolean;
}

const KEY = {
  draft: "recito.draft",
  take: "recito.take",
  accepted: "recito.accepted",
  result: (id: string) => `recito.result.${id}`,
};

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or disabled: the flow still works within this page view.
  }
}

export const readDraft = () => read<FlowDraft>(KEY.draft);
export const writeDraft = (d: FlowDraft) => write(KEY.draft, d);

export const readTake = () => read<FlowTake>(KEY.take);
export function writeTake(t: FlowTake): void {
  write(KEY.take, t);
  write(KEY.accepted, []); // a new take starts with no teacher overrides
}

export const readAccepted = () => read<string[]>(KEY.accepted) ?? [];
export const writeAccepted = (ids: string[]) => write(KEY.accepted, ids);

export const readResult = (id: string) => read<ResultRecord>(KEY.result(id));
export const saveResult = (id: string, r: ResultRecord) => write(KEY.result(id), r);

let liveAudio: AudioBuffer | null = null;
export function setLiveAudio(buffer: AudioBuffer | null): void {
  liveAudio = buffer;
}
export function getLiveAudio(): AudioBuffer | null {
  return liveAudio;
}

/** Play one moment of the live recording, with a little air on both sides. */
export function playMoment(start: number, end: number): boolean {
  const buffer = liveAudio;
  if (!buffer || typeof window === "undefined") return false;
  const ctx = new AudioContext();
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  const from = Math.max(0, start - 0.15);
  const length = Math.min(buffer.duration - from, end - start + 0.3);
  source.onended = () => void ctx.close();
  source.start(0, from, Math.max(0.2, length));
  return true;
}

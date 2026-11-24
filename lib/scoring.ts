// The alignment and scoring engine. Pure functions, no model and no network: the same
// transcript always gives the same marks, which is what makes a score auditable.
//
// 1. Normalize the passage and the transcript into word tokens.
// 2. Align them with Needleman-Wunsch (match +2, sound-alike substitution 0, other
//    substitution -1, gap -1).
// 3. Classify every unmatched cell: substitution, omission, insertion or repetition.
// 4. Mark silences longer than PAUSE_SECONDS between heard words.
// 5. Score: WCPM = (words attempted - errors) per minute between the first and last
//    heard word. Substitutions and omissions count as errors; insertions, repetitions
//    and pauses are shown to the teacher but not counted, as in common ORF practice.

import { doubleMetaphone } from "double-metaphone";
import type { GoldMark, MiscueKind, Passage, SampleReading, TranscriptWord } from "@/lib/data";

export const PAUSE_SECONDS = 1.0;

export interface RefToken {
  index: number;
  display: string;
  norm: string;
}

export interface HeardWord extends TranscriptWord {
  norm: string;
}

export type Cell =
  | { op: "match"; ref: number; hyp: number }
  | { op: "sub"; ref: number; hyp: number; near: boolean }
  | { op: "del"; ref: number }
  | { op: "ins"; hyp: number };

export interface Mark {
  id: string;
  kind: MiscueKind;
  /** Passage word the mark belongs to. Insertions borrow the next passage word. */
  refIndex: number | null;
  hypIndex: number | null;
  expected?: string;
  heard?: string;
  near?: boolean;
  seconds?: number;
  /** Audio window, in seconds from the start of the recording. */
  start: number;
  end: number;
  countsAsError: boolean;
}

export interface Analysis {
  tokens: RefToken[];
  words: HeardWord[];
  cells: Cell[];
  marks: Mark[];
  /** Index of the last passage word the reader reached; -1 when nothing matched. */
  lastRead: number;
}

export interface Score {
  attempted: number;
  errors: number;
  correct: number;
  seconds: number;
  wcpm: number;
  accuracy: number;
  counts: Record<MiscueKind, number>;
}

export const KIND_LABEL: Record<MiscueKind, string> = {
  substitution: "Substitution",
  omission: "Omission",
  insertion: "Insertion",
  repetition: "Repetition",
  pause: "Pause over 1 s",
};

export function normalizeWord(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[^a-z0-9']/g, "")
    .replace(/^'+|'+$/g, "");
}

export function cleanDisplay(raw: string): string {
  return raw.replace(/[^\p{L}\p{N}'’-]/gu, "");
}

export function tokenizePassage(text: string): RefToken[] {
  return text
    .split(/\s+/)
    .map((display) => ({ display, norm: normalizeWord(display) }))
    .filter((t) => t.norm.length > 0)
    .map((t, index) => ({ ...t, index }));
}

function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const above = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = above;
    }
  }
  return row[b.length];
}

const phoneticCache = new Map<string, [string, string]>();
function phonetic(word: string): [string, string] {
  let codes = phoneticCache.get(word);
  if (!codes) {
    codes = doubleMetaphone(word);
    phoneticCache.set(word, codes);
  }
  return codes;
}

/** Double Metaphone closeness, with a spelling-distance backstop for short words. */
export function soundsAlike(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  const [pa, sa] = phonetic(a);
  const [pb, sb] = phonetic(b);
  if (pa && (pa === pb || pa === sb || sa === pb)) return true;
  if (pa.length >= 2 && pb.length >= 2 && editDistance(pa, pb) <= 1) return true;
  return editDistance(a, b) / Math.max(a.length, b.length) <= 0.34;
}

/** Global alignment of passage tokens against heard tokens. */
export function align(ref: string[], hyp: string[]): Cell[] {
  const n = ref.length;
  const m = hyp.length;
  const W = m + 1;
  const S = new Float64Array((n + 1) * W);
  const T = new Uint8Array((n + 1) * W); // 1 diagonal, 2 skip passage word, 3 extra heard word
  for (let i = 1; i <= n; i++) {
    S[i * W] = -i;
    T[i * W] = 2;
  }
  for (let j = 1; j <= m; j++) {
    S[j] = -j;
    T[j] = 3;
  }
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const a = ref[i - 1];
      const b = hyp[j - 1];
      const sim = a === b ? 2 : soundsAlike(a, b) ? 0 : -1;
      let best = S[(i - 1) * W + j - 1] + sim;
      let move = 1;
      const up = S[(i - 1) * W + j] - 1;
      if (up > best) {
        best = up;
        move = 2;
      }
      const left = S[i * W + j - 1] - 1;
      if (left > best) {
        best = left;
        move = 3;
      }
      S[i * W + j] = best;
      T[i * W + j] = move;
    }
  }
  const cells: Cell[] = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    const move = T[i * W + j];
    if (move === 1) {
      const a = ref[i - 1];
      const b = hyp[j - 1];
      cells.push(a === b ? { op: "match", ref: i - 1, hyp: j - 1 } : { op: "sub", ref: i - 1, hyp: j - 1, near: soundsAlike(a, b) });
      i--;
      j--;
    } else if (move === 2) {
      cells.push({ op: "del", ref: i - 1 });
      i--;
    } else {
      cells.push({ op: "ins", hyp: j - 1 });
      j--;
    }
  }
  return cells.reverse();
}

/** An extra word is a repetition when the same word sits within two words of it. */
function isRepeat(words: HeardWord[], j: number): boolean {
  const w = words[j].norm;
  return [-2, -1, 1, 2].some((d) => words[j + d]?.norm === w);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function analyzeReading(passageText: string, transcript: TranscriptWord[]): Analysis {
  const tokens = tokenizePassage(passageText);
  const words: HeardWord[] = transcript
    .map((w) => ({ ...w, norm: normalizeWord(w.text) }))
    .filter((w) => w.norm.length > 0);
  const cells = align(
    tokens.map((t) => t.norm),
    words.map((w) => w.norm),
  );

  let lastRead = -1;
  for (const c of cells) if ((c.op === "match" || c.op === "sub") && c.ref > lastRead) lastRead = c.ref;

  // Passage word each heard word belongs to; extra words borrow the next passage word.
  const refOfHyp: (number | null)[] = new Array(words.length).fill(null);
  let nextRef: number | null = null;
  for (let k = cells.length - 1; k >= 0; k--) {
    const c = cells[k];
    if (c.op === "match" || c.op === "sub") {
      nextRef = c.ref;
      refOfHyp[c.hyp] = c.ref;
    } else if (c.op === "del") {
      nextRef = c.ref;
    } else {
      refOfHyp[c.hyp] = nextRef;
    }
  }

  const nextHeardStart = (k: number): number | null => {
    for (let q = k + 1; q < cells.length; q++) {
      const c = cells[q];
      if (c.op !== "del") return words[c.hyp].start;
    }
    return null;
  };

  const marks: Mark[] = [];
  let prevEnd = words[0]?.start ?? 0;
  for (let k = 0; k < cells.length; k++) {
    const c = cells[k];
    if (c.op === "match") {
      prevEnd = words[c.hyp].end;
      continue;
    }
    if (c.op === "sub") {
      const w = words[c.hyp];
      marks.push({
        id: `sub-${c.ref}`,
        kind: "substitution",
        refIndex: c.ref,
        hypIndex: c.hyp,
        expected: cleanDisplay(tokens[c.ref].display),
        heard: w.text,
        near: c.near,
        start: w.start,
        end: w.end,
        countsAsError: true,
      });
      prevEnd = w.end;
      continue;
    }
    if (c.op === "del") {
      if (c.ref > lastRead) continue; // never reached: not an omission
      const after = nextHeardStart(k) ?? prevEnd + 0.6;
      marks.push({
        id: `om-${c.ref}`,
        kind: "omission",
        refIndex: c.ref,
        hypIndex: null,
        expected: cleanDisplay(tokens[c.ref].display),
        start: prevEnd,
        end: Math.max(after, prevEnd + 0.3),
        countsAsError: true,
      });
      continue;
    }
    const w = words[c.hyp];
    const ref = refOfHyp[c.hyp];
    marks.push({
      id: `ins-${c.hyp}`,
      kind: isRepeat(words, c.hyp) ? "repetition" : "insertion",
      refIndex: ref,
      hypIndex: c.hyp,
      expected: ref !== null ? cleanDisplay(tokens[ref].display) : undefined,
      heard: w.text,
      start: w.start,
      end: w.end,
      countsAsError: false,
    });
    prevEnd = w.end;
  }

  for (let j = 1; j < words.length; j++) {
    const gap = words[j].start - words[j - 1].end;
    if (gap <= PAUSE_SECONDS) continue;
    const ref = refOfHyp[j];
    marks.push({
      id: `pause-${j}`,
      kind: "pause",
      refIndex: ref,
      hypIndex: j,
      expected: ref !== null ? cleanDisplay(tokens[ref].display) : undefined,
      seconds: round1(gap),
      start: words[j - 1].end,
      end: words[j].start,
      countsAsError: false,
    });
  }

  marks.sort((a, b) => a.start - b.start);
  return { tokens, words, cells, marks, lastRead };
}

/** Score a reading. Marks in `accepted` were overruled by the teacher. */
export function scoreReading(a: Analysis, accepted: ReadonlySet<string> = new Set()): Score {
  const attempted = a.lastRead + 1;
  const live = a.marks.filter((m) => !accepted.has(m.id));
  const errors = live.filter((m) => m.countsAsError).length;
  const correct = Math.max(0, attempted - errors);
  const first = a.words[0];
  const last = a.words[a.words.length - 1];
  const seconds = first && last ? Math.max(0, last.end - first.start) : 0;
  const counts: Record<MiscueKind, number> = { substitution: 0, omission: 0, insertion: 0, repetition: 0, pause: 0 };
  for (const m of live) counts[m.kind]++;
  return {
    attempted,
    errors,
    correct,
    seconds: round1(seconds),
    wcpm: seconds > 0 ? Math.round((correct * 60) / seconds) : 0,
    accuracy: attempted > 0 ? correct / attempted : 0,
    counts,
  };
}

export function describeMark(m: Mark): string {
  switch (m.kind) {
    case "substitution":
      return `read "${m.heard}" for "${m.expected}"${m.near ? " (sounds close)" : ""}`;
    case "omission":
      return `skipped "${m.expected}"`;
    case "insertion":
      return `added "${m.heard}"`;
    case "repetition":
      return `repeated "${m.heard}"`;
    case "pause":
      return `paused ${m.seconds}s before "${m.expected ?? "the end"}"`;
  }
}

export function formatClock(seconds: number): string {
  const s = Math.max(0, seconds);
  const min = Math.floor(s / 60);
  const rest = (s - min * 60).toFixed(1).padStart(4, "0");
  return `${min}:${rest}`;
}

// Chart trace

export interface TracePoint {
  t: number;
  words: number;
}

export interface TraceMark {
  id: string;
  kind: MiscueKind;
  t: number;
  words: number;
  label: string;
}

/** Cumulative words read correctly over time, plus where each mark sits on that line. */
export function readingTrace(a: Analysis): { points: TracePoint[]; marks: TraceMark[] } {
  const t0 = a.words[0]?.start ?? 0;
  const points: TracePoint[] = [{ t: 0, words: 0 }];
  let count = 0;
  for (const c of a.cells) {
    if (c.op !== "match") continue;
    count++;
    points.push({ t: round1(a.words[c.hyp].end - t0), words: count });
  }
  const valueAt = (t: number) => {
    let v = 0;
    for (const p of points) if (p.t <= t) v = p.words;
    return v;
  };
  const marks = a.marks.map((m) => {
    const t = round1(m.start - t0);
    return { id: m.id, kind: m.kind, t, words: valueAt(t), label: describeMark(m) };
  });
  return { points, marks };
}

// Evaluation against hand-marked readings

export interface EvalRow {
  readingId: string;
  student: string;
  passageTitle: string;
  tests: string;
  teacherMarks: number;
  engineMarks: number;
  agreed: number;
  falseAlarms: number;
  missed: number;
  wcpm: number;
}

function nthIndex(tokens: RefToken[], norm: string, nth: number): number {
  let seen = 0;
  for (const t of tokens) {
    if (t.norm === norm && ++seen === nth) return t.index;
  }
  return -1;
}

export function evaluateAgainstGold(a: Analysis, gold: GoldMark[]) {
  const used = new Set<string>();
  let agreed = 0;
  for (const g of gold) {
    const target = normalizeWord(g.word);
    let hit: Mark | undefined;
    if (g.kind === "insertion" || g.kind === "repetition") {
      hit = a.marks.find((m) => !used.has(m.id) && m.kind === g.kind && normalizeWord(m.heard ?? "") === target);
    } else {
      const ref = nthIndex(a.tokens, target, g.nth ?? 1);
      hit = a.marks.find((m) => !used.has(m.id) && m.kind === g.kind && m.refIndex === ref);
    }
    if (hit) {
      used.add(hit.id);
      agreed++;
    }
  }
  return { agreed, falseAlarms: a.marks.length - agreed, missed: gold.length - agreed };
}

export function evaluateSamples(readings: SampleReading[], passageList: Passage[]) {
  const rows: EvalRow[] = [];
  for (const r of readings) {
    const passage = passageList.find((p) => p.id === r.passageId);
    if (!passage) continue;
    const analysis = analyzeReading(passage.text, r.transcript);
    const result = evaluateAgainstGold(analysis, r.gold);
    rows.push({
      readingId: r.id,
      student: r.student,
      passageTitle: passage.title,
      tests: r.tests,
      teacherMarks: r.gold.length,
      engineMarks: analysis.marks.length,
      wcpm: scoreReading(analysis).wcpm,
      ...result,
    });
  }
  const agreed = rows.reduce((s, r) => s + r.agreed, 0);
  const engine = rows.reduce((s, r) => s + r.engineMarks, 0);
  const teacher = rows.reduce((s, r) => s + r.teacherMarks, 0);
  return {
    rows,
    agreed,
    engine,
    teacher,
    falseAlarms: engine - agreed,
    precision: engine > 0 ? agreed / engine : 0,
    recall: teacher > 0 ? agreed / teacher : 0,
  };
}

// Seed data for Recito: three original reading passages and six sample readings from one
// fall screening window. The sample transcripts are written out by hand, and their word
// timings are produced by performReading() below, so they come without audio. Live
// recordings made in the app carry real Whisper timestamps and real audio instead.

export type MiscueKind = "substitution" | "omission" | "insertion" | "repetition" | "pause";

export interface TranscriptWord {
  text: string;
  /** Seconds from the start of the recording. */
  start: number;
  end: number;
}

export interface Passage {
  id: string;
  title: string;
  level: string;
  text: string;
}

/** A miscue as the teacher marked it by hand, used to evaluate the alignment engine. */
export interface GoldMark {
  kind: MiscueKind;
  /** Passage word for substitutions, omissions and pauses; heard word for insertions and repetitions. */
  word: string;
  /** Which occurrence of the word in the passage (1-based). Defaults to 1. */
  nth?: number;
}

export interface SampleReading {
  id: string;
  student: string;
  passageId: string;
  recordedOn: string;
  /** What this reading stresses in the evaluation set. */
  tests: string;
  transcript: TranscriptWord[];
  gold: GoldMark[];
}

export const classroom = {
  name: "Room 12, Grade 2/3",
  teacher: "Ms. Adeyemi",
  window: "Fall screening, 8 to 19 September 2026",
};

export const passages: Passage[] = [
  {
    id: "tern-hill",
    title: "The House on Tern Hill",
    level: "Grade 2, narrative",
    text: "The old house on Tern Hill had a red door and a crooked chimney. Every morning a gray cat sat on the step and watched the road. One day a small horse walked up the hill and stopped by the gate. The cat did not run. It blinked once, then twice, and the horse bent down to sniff the door. Nobody in town believed the story, but the cat knew it was true.",
  },
  {
    id: "market-rain",
    title: "Rain Day at the Market",
    level: "Grade 3, narrative",
    text: "On Saturday the market was full of umbrellas. Grandma bought three lemons, a bag of rice, and a loaf of warm bread. The baker said the storm would pass by noon. We waited under the striped tent and counted the drops that fell from the edge. When the sun came back, the puddles shone like coins, and every stall opened its shutters again.",
  },
  {
    id: "bee-dance",
    title: "How Bees Find Flowers",
    level: "Grade 3, informational",
    text: "Bees use their eyes and their sense of smell to find flowers. Many flowers have patterns that people cannot see, but bees can. These patterns point the way to the nectar. When a bee finds a good patch, it flies back to the hive and dances. The dance tells other bees which direction to fly and how far to go.",
  },
];

/**
 * Turns a hand-written reading script into timed words. "~1.6" inserts a 1.6 second
 * silence before the next word. Longer words take longer to say; secondsPerWord sets
 * the reader's pace.
 */
function performReading(script: string, secondsPerWord: number, startAt = 0.6): TranscriptWord[] {
  const out: TranscriptWord[] = [];
  let t = startAt;
  let pause = 0;
  for (const token of script.split(/\s+/).filter(Boolean)) {
    if (token.startsWith("~")) {
      pause = Number(token.slice(1));
      continue;
    }
    if (out.length > 0) t += pause || secondsPerWord * 0.18;
    pause = 0;
    const duration = secondsPerWord * (0.55 + 0.07 * token.length);
    out.push({ text: token, start: round2(t), end: round2(t + duration) });
    t += duration;
  }
  return out;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export const sampleReadings: SampleReading[] = [
  {
    id: "maya-r-0909",
    student: "Maya R.",
    passageId: "tern-hill",
    recordedOn: "2026-09-09",
    tests: "Ordinary reading with one of each miscue",
    transcript: performReading(
      "the old horse on tern hill had a red a red door and a ~1.6 chimney every morning a gray cat sat on the step and washed the road one day a small horse walked up the hill and stopped by the gate the cat did not run it blinked once then twice and the big horse bent down to sniff the door nobody in town believed the story but the cat knew it was true",
      0.62,
    ),
    gold: [
      { kind: "substitution", word: "house" },
      { kind: "repetition", word: "a" },
      { kind: "repetition", word: "red" },
      { kind: "omission", word: "crooked" },
      { kind: "pause", word: "chimney" },
      { kind: "substitution", word: "watched" },
      { kind: "insertion", word: "big" },
    ],
  },
  {
    id: "theo-b-0909",
    student: "Theo B.",
    passageId: "tern-hill",
    recordedOn: "2026-09-09",
    tests: "Fast, clean reading; spelling variant the teacher accepts",
    transcript: performReading(
      "the old house on tern hill had a red door and a crooked chimney every morning a grey cat sat on the step and watched the road one day a small horse walked up the hill and stopped by the gate the cat did not run it blinked once then twice and the horse bent down to sniff the door nobody in town believed the story but the cat knew it was true",
      0.42,
    ),
    gold: [],
  },
  {
    id: "amara-n-0910",
    student: "Amara N.",
    passageId: "market-rain",
    recordedOn: "2026-09-10",
    tests: "Slow reading with long hesitations",
    transcript: performReading(
      "on saturday the market was full of ~1.4 umbrellas grandma brought three lemons a bag of rice and a loaf of warm bread the baker said the storm would pass by noon we waited under the ~1.8 stripped tent and counted the drops that fell from the edge when the sun came back the puddles ~1.2 shone like coins and every stall opened its ~2.1 shutters again",
      0.85,
    ),
    gold: [
      { kind: "pause", word: "umbrellas" },
      { kind: "substitution", word: "bought" },
      { kind: "pause", word: "striped" },
      { kind: "substitution", word: "striped" },
      { kind: "pause", word: "shone" },
      { kind: "pause", word: "shutters" },
    ],
  },
  {
    id: "lucas-p-0911",
    student: "Lucas P.",
    passageId: "market-rain",
    recordedOn: "2026-09-11",
    tests: "Stops before the end of the passage",
    transcript: performReading(
      "on saturday the market was full of umbrellas grandma bought three lemons a bag of rice and a loaf of bread the baker the baker said the storm will pass by noon we waited under the striped tent and counted the drops",
      0.7,
    ),
    gold: [
      { kind: "omission", word: "warm" },
      { kind: "repetition", word: "the" },
      { kind: "repetition", word: "baker" },
      { kind: "substitution", word: "would" },
    ],
  },
  {
    id: "priya-s-0915",
    student: "Priya S.",
    passageId: "bee-dance",
    recordedOn: "2026-09-15",
    tests: "Many errors, false starts on long words",
    transcript: performReading(
      "bees use their eyes and their sense of smell to find flowers many flowers have pattern that people cannot see but bees can these ~1.5 patterns point the way to the ~2.4 neck nectar when a bee finds a good patch it flies back to the hive and dances the dance tells other bees which ~1.3 direct direction to fly and how far to go",
      1.0,
    ),
    gold: [
      { kind: "substitution", word: "patterns" },
      { kind: "pause", word: "patterns", nth: 2 },
      { kind: "pause", word: "nectar" },
      { kind: "insertion", word: "neck" },
      { kind: "pause", word: "direction" },
      { kind: "insertion", word: "direct" },
    ],
  },
  {
    id: "jonah-w-0917",
    student: "Jonah W.",
    passageId: "bee-dance",
    recordedOn: "2026-09-17",
    tests: "Dropped word endings (hard case for any scorer)",
    transcript: performReading(
      "bees use their eyes and their sense of smell to find flower many flower have patterns that people cannot see but bees can these patterns point the way to the nectar when a bee find a good patch it fly back to the hive and dance the dance tell other bees which direction to fly and how far to go",
      0.7,
    ),
    gold: [
      { kind: "substitution", word: "flowers" },
      { kind: "substitution", word: "flowers", nth: 2 },
      { kind: "substitution", word: "finds" },
      { kind: "substitution", word: "flies" },
      { kind: "substitution", word: "dances" },
      { kind: "substitution", word: "tells" },
    ],
  },
];

export function passageById(id: string): Passage | undefined {
  return passages.find((p) => p.id === id);
}

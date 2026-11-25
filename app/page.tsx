import type { Metadata } from "next";
import Link from "next/link";
import { ReadingTraceChart, type ChartReading } from "@/components/reading-trace-chart";
import { SceneSlot } from "@/components/scene-slot";
import { Button } from "@/components/ui/button";
import { passageById, passages, sampleReadings } from "@/lib/data";
import { analyzeReading, evaluateSamples, readingTrace, scoreReading } from "@/lib/scoring";

// Archetype L5 bands: full-width stripes alternating ground, surface and deep, each one
// sentence plus one artifact. No columns, no cards inside a band.

export const metadata: Metadata = {
  title: { absolute: "Recito: one-minute reading fluency checks in the browser" },
};

function buildChartReadings(): ChartReading[] {
  return sampleReadings.flatMap((r) => {
    const passage = passageById(r.passageId);
    if (!passage) return [];
    const analysis = analyzeReading(passage.text, r.transcript);
    const score = scoreReading(analysis);
    const trace = readingTrace(analysis);
    return [
      {
        id: r.id,
        student: r.student,
        passageTitle: passage.title,
        seconds: score.seconds,
        wcpm: score.wcpm,
        accuracy: score.accuracy,
        attempted: score.attempted,
        points: trace.points,
        marks: trace.marks,
      },
    ];
  });
}

export default function Home() {
  const readings = buildChartReadings();
  const evaluation = evaluateSamples(sampleReadings, passages);

  return (
    <>
      <section className="bg-background">
        <div className="recito-stagger mx-auto max-w-5xl space-y-10 px-5 py-16 md:py-24">
          <h1 className="max-w-[22ch] text-4xl font-semibold leading-[1.1] md:text-6xl">
            Recito turns one minute of a child reading aloud into a marked running record, inside the teacher&apos;s browser.
          </h1>
          <Button asChild variant="link" className="px-0 text-base">
            <Link href="/screen/passage">Start with a passage</Link>
          </Button>
          <SceneSlot
            n={1}
            alt="A reading passage on a floating panel with the word house circled in red and the heard word horse written above it, next to a waveform of the child's voice with a play button"
            width={960}
            height={640}
            className="rounded-xl shadow-float"
          />
        </div>
      </section>

      <section className="bg-surface">
        <div className="mx-auto max-w-5xl space-y-8 px-5 py-16 md:py-20">
          <h2 className="max-w-[30ch] text-2xl font-semibold leading-snug md:text-3xl">
            Every miscue sits on the line where it happened, so pick a reader and watch their minute redraw.
          </h2>
          <ReadingTraceChart readings={readings} />
        </div>
      </section>

      <section className="bg-background">
        <div className="mx-auto max-w-5xl space-y-10 px-5 py-16 md:py-20">
          <h2 className="max-w-[30ch] text-2xl font-semibold leading-snug md:text-3xl">
            Whisper runs inside the page, so a child&apos;s voice is never uploaded, never logged, and gone when the tab closes.
          </h2>
          <SceneSlot
            n={2}
            alt="A laptop whose screen holds a sound wave that loops back into itself, with a crossed-out cloud floating beside it"
            width={960}
            height={640}
            className="rounded-xl shadow-float"
          />
        </div>
      </section>

      <section className="bg-deep">
        <div className="mx-auto max-w-5xl space-y-10 px-5 py-16 md:py-20">
          <h2 className="max-w-[34ch] text-2xl font-semibold leading-snug md:text-3xl">
            On the {evaluation.rows.length} hand-marked sample readings in this repo, the scoring engine agreed with the teacher on{" "}
            {evaluation.agreed} of {evaluation.teacher} miscues and raised {evaluation.falseAlarms} the teacher would not count.
          </h2>
          <SceneSlot
            n={3}
            alt="A pencil-marked paper running record with ticks and circled words lying next to a screen showing the same words in colored marks, a stopwatch between them"
            width={960}
            height={640}
            className="rounded-xl shadow-float"
          />
          <Button asChild variant="link" className="px-0 text-base">
            <Link href="/about#evaluation">See the per-reading table and its limits</Link>
          </Button>
        </div>
      </section>

      <section className="bg-surface">
        <div className="mx-auto flex max-w-5xl flex-col items-start gap-8 px-5 py-20 md:py-24">
          <h2 className="max-w-[26ch] text-3xl font-semibold leading-tight md:text-4xl">
            Your class list, one minute per child, no account and no upload.
          </h2>
          <Button asChild size="lg">
            <Link href="/screen/passage">Start a screening</Link>
          </Button>
        </div>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { passages, sampleReadings } from "@/lib/data";
import { PAUSE_SECONDS, evaluateSamples } from "@/lib/scoring";

export const metadata: Metadata = { title: "Method" };

const PIPELINE = [
  {
    name: "Record",
    body: "MediaRecorder captures the reading. The Web Audio API decodes it at 16 kHz mono, the rate Whisper expects. The audio buffer is held in memory only.",
  },
  {
    name: "Transcribe",
    body: "Whisper tiny.en (the timestamped ONNX build) runs through Transformers.js inside the page and returns every word with its start and end time.",
  },
  {
    name: "Align",
    body: "Needleman-Wunsch lines the heard words up against the passage: +2 for a match, 0 for a sound-alike substitution, -1 for any other substitution or gap.",
  },
  {
    name: "Classify",
    body: "Unmatched passage words become omissions, extra words become insertions, or repetitions when the same word sits within two words. Double Metaphone flags substitutions that sound close.",
  },
  {
    name: "Score",
    body: `Words correct per minute = (words attempted minus substitutions and omissions) per minute between the first and last word. Silences over ${PAUSE_SECONDS}s are marked. Insertions, repetitions and pauses are shown but not counted, as in common oral reading fluency practice.`,
  },
];

export default function AboutPage() {
  const evaluation = evaluateSamples(sampleReadings, passages);

  return (
    <div className="mx-auto max-w-5xl space-y-12 px-5 py-12 md:py-16">
      <div className="recito-enter space-y-4">
        <h1 className="text-4xl font-semibold md:text-5xl">How Recito scores a reading</h1>
        <p className="max-w-[68ch] text-lg text-muted-foreground">
          One small speech model listens. Everything after the transcript is plain, deterministic code, so the same reading
          always gets the same marks and a teacher can see exactly why each one is there.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>The pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-5">
            {PIPELINE.map((p) => (
              <li key={p.name} className="max-w-[70ch]">
                <p className="font-display font-semibold">{p.name}</p>
                <p className="text-muted-foreground">{p.body}</p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Why these choices</CardTitle>
          <CardDescription>The short version: privacy first, then auditability.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <details className="group max-w-[70ch] rounded-md bg-surface p-4">
            <summary className="cursor-pointer font-semibold">Why Whisper runs in the browser</summary>
            <p className="mt-2 text-muted-foreground">
              Many schools cannot send a child&apos;s voice to a cloud service without written parental consent. Running the model
              on the teacher&apos;s own device removes that question. Tiny.en is about 40 MB, so the first download takes seconds on
              school Wi-Fi and is cached after that.
            </p>
          </details>
          <details className="group max-w-[70ch] rounded-md bg-surface p-4">
            <summary className="cursor-pointer font-semibold">Why alignment is not done by a language model</summary>
            <p className="mt-2 text-muted-foreground">
              A score that goes into a reading intervention decision has to be explainable. Dynamic programming gives the same
              answer every time and every mark points to one word and one moment of audio.
            </p>
          </details>
          <details className="group max-w-[70ch] rounded-md bg-surface p-4">
            <summary className="cursor-pointer font-semibold">Why the reference text is not given to Whisper</summary>
            <p className="mt-2 text-muted-foreground">
              Prompting the model with the passage makes it hear the passage, which hides exactly the mistakes a teacher needs to
              see. Recito transcribes blind and compares afterwards.
            </p>
          </details>
        </CardContent>
      </Card>

      <section id="evaluation" className="scroll-mt-24 space-y-5">
        <h2 className="text-3xl font-semibold">What we measured, and what we have not yet</h2>
        <p className="max-w-[70ch] text-muted-foreground">
          The table below is computed live from the {evaluation.rows.length} sample readings in <code>lib/data.ts</code>. Each
          reading was marked by hand first; the engine then marked the same transcript. Across all of them the engine agreed on{" "}
          {evaluation.agreed} of {evaluation.teacher} teacher marks (recall {Math.round(evaluation.recall * 100)}%) and{" "}
          {Math.round(evaluation.precision * 100)}% of its own marks matched a teacher mark. This tests the alignment engine on
          transcripts. It does not yet test Whisper on children&apos;s voices.
        </p>
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="text-muted-foreground">
                <th className="p-4 font-semibold">Reader</th>
                <th className="p-4 font-semibold">What it tests</th>
                <th className="p-4 font-semibold">Teacher marks</th>
                <th className="p-4 font-semibold">Engine marks</th>
                <th className="p-4 font-semibold">Agreed</th>
                <th className="p-4 font-semibold">WCPM</th>
              </tr>
            </thead>
            <tbody>
              {evaluation.rows.map((r) => (
                <tr key={r.readingId} className="border-t border-surface">
                  <td className="p-4">
                    <Link href={`/result/${r.readingId}`} className="font-semibold text-primary underline-offset-4 hover:underline">
                      {r.student}
                    </Link>
                    <span className="block text-muted-foreground">{r.passageTitle}</span>
                  </td>
                  <td className="p-4">{r.tests}</td>
                  <td className="p-4">{r.teacherMarks}</td>
                  <td className="p-4">{r.engineMarks}</td>
                  <td className="p-4">
                    {r.agreed}
                    {r.falseAlarms > 0 && <span className="block text-bad">{r.falseAlarms} extra</span>}
                    {r.missed > 0 && <span className="block text-warn">{r.missed} missed</span>}
                  </td>
                  <td className="p-4">{r.wcpm}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Known limits</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="max-w-[70ch] list-disc space-y-2 pl-5 text-muted-foreground">
              <li>
                Whisper tends to &ldquo;fix&rdquo; disfluent reading into fluent English, so it can hide real substitutions. The teacher
                override exists for this reason.
              </li>
              <li>Speech recognition is weaker on young children&apos;s voices than on adults&apos;. Recito is a screening aid, not a diagnosis.</li>
              <li>Spelling variants (gray and grey) and dialect endings are flagged as substitutions until a teacher overrules them.</li>
              <li>English passages only for now, because tiny.en is an English model.</li>
              <li>Still to run: six real recordings, hand-marked, scored end to end with tiny.en and base.en for accuracy and speed.</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Tools and sponsor tech</CardTitle>
        </CardHeader>
        <CardContent className="max-w-[70ch] space-y-3 text-muted-foreground">
          <p>
            <strong className="text-foreground">Transformers.js</strong> runs Whisper in the page. <strong className="text-foreground">d3</strong>{" "}
            and <strong className="text-foreground">Motion</strong> draw the reading trace. <strong className="text-foreground">double-metaphone</strong>{" "}
            decides which substitutions sound close.
          </p>
          <p>
            <strong className="text-foreground">Prune</strong> (in progress) is the quality gate on this AI-assisted codebase: its
            check runs before merge and its cleanup tasks feed back into the coding agent. The before and after record goes in the
            README once the first pass lands.
          </p>
          <Button asChild>
            <Link href="/screen/passage">Try it with a passage</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

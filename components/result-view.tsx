"use client";

import Link from "next/link";
import { Link2, Copy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MarkInspector, ScoreSummary } from "@/components/record-panels";
import { RunningRecord } from "@/components/running-record";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLiveAudio, playMoment, readResult, type ResultRecord } from "@/lib/flow-session";
import { KIND_LABEL, analyzeReading, scoreReading } from "@/lib/scoring";

export function ResultView({ id, seeded }: { id: string; seeded?: ResultRecord }) {
  const [record, setRecord] = useState<ResultRecord | null>(seeded ?? null);
  const [checked, setChecked] = useState(Boolean(seeded));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [audioHere, setAudioHere] = useState(false);

  useEffect(() => {
    if (seeded) return;
    setRecord(readResult(id));
    setAudioHere(getLiveAudio() !== null);
    setChecked(true);
  }, [id, seeded]);

  const analysis = useMemo(() => (record ? analyzeReading(record.text, record.words) : null), [record]);
  const accepted = useMemo(() => new Set(record?.accepted ?? []), [record]);
  const score = useMemo(() => (analysis ? scoreReading(analysis, accepted) : null), [analysis, accepted]);

  if (!checked) {
    return (
      <Card>
        <CardContent className="p-7 text-muted-foreground">Opening the running record...</CardContent>
      </Card>
    );
  }

  if (!record || !analysis || !score) {
    return (
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>This record lives in another browser</CardTitle>
          <CardDescription>
            Live results are kept only in the tab where the reading was recorded, so this link opens nowhere else. That is the
            privacy promise working as intended.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/screen/passage">Start a new screening</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/result/maya-r-0909">Open a sample record</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const selected = analysis.marks.find((m) => m.id === selectedId) ?? null;
  const counted = (Object.keys(score.counts) as (keyof typeof score.counts)[])
    .filter((k) => score.counts[k] > 0)
    .map((k) => `${KIND_LABEL[k].toLowerCase()} ${score.counts[k]}`)
    .join(", ");
  const summaryText = `Recito running record: ${record.student}, "${record.title}", ${record.recordedOn}. ${score.wcpm} words correct per minute, ${Math.round(
    score.accuracy * 100,
  )}% accuracy (${score.correct}/${score.attempted} words). Marks: ${counted || "none"}.`;

  async function copy(kind: "link" | "summary") {
    try {
      await navigator.clipboard.writeText(kind === "link" ? window.location.href : summaryText);
      setCopied(kind === "link" ? "Link copied." : "Summary copied, ready to paste into your gradebook.");
    } catch {
      setCopied("Copying is blocked in this browser. Select the summary text below instead.");
    }
  }

  return (
    <div className="space-y-10">
      <div className="recito-enter space-y-3">
        <h1 className="text-3xl font-semibold md:text-4xl">
          {record.student} on &ldquo;{record.title}&rdquo;
        </h1>
        <p className="max-w-[70ch] text-lg text-muted-foreground">
          Recorded {record.recordedOn}. {record.producedBy}.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <Card className="recito-enter">
          <CardHeader>
            <CardTitle>Running record</CardTitle>
            <CardDescription>Teacher overrides are already applied to the score.</CardDescription>
          </CardHeader>
          <CardContent>
            <RunningRecord analysis={analysis} accepted={accepted} selectedId={selectedId} onSelect={setSelectedId} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <ScoreSummary score={score} className="recito-enter" />
          <MarkInspector
            mark={selected}
            accepted={selected ? accepted.has(selected.id) : false}
            canPlay={audioHere && record.hasAudio}
            playNote="Shared records carry marks and timings only. The audio never leaves the device it was recorded on."
            onPlay={(m) => playMoment(m.start, m.end)}
          />
          <Card>
            <CardHeader>
              <CardTitle>Share</CardTitle>
              <CardDescription className="select-all">{summaryText}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => copy("summary")}>
                  <Copy /> Copy summary
                </Button>
                <Button variant="outline" onClick={() => copy("link")}>
                  <Link2 /> Copy link
                </Button>
              </div>
              {copied && (
                <p className="text-sm text-muted-foreground" role="status">
                  {copied}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

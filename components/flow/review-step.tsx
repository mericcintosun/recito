"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { MarkInspector, ScoreSummary } from "@/components/record-panels";
import { RunningRecord } from "@/components/running-record";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getLiveAudio,
  playMoment,
  readAccepted,
  readDraft,
  readTake,
  saveResult,
  writeAccepted,
  type FlowDraft,
  type FlowTake,
} from "@/lib/flow-session";
import { analyzeReading, scoreReading, type Mark } from "@/lib/scoring";

export function ReviewStep() {
  const router = useRouter();
  const [draft, setDraft] = useState<FlowDraft | null>(null);
  const [take, setTake] = useState<FlowTake | null>(null);
  const [accepted, setAccepted] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hasAudio, setHasAudio] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDraft(readDraft());
    setTake(readTake());
    setAccepted(new Set(readAccepted()));
    setHasAudio(getLiveAudio() !== null);
    setReady(true);
  }, []);

  const analysis = useMemo(() => (draft && take ? analyzeReading(draft.text, take.words) : null), [draft, take]);
  const score = useMemo(() => (analysis ? scoreReading(analysis, accepted) : null), [analysis, accepted]);
  const selected = analysis?.marks.find((m) => m.id === selectedId) ?? null;

  function toggle(m: Mark) {
    setAccepted((prev) => {
      const next = new Set(prev);
      if (next.has(m.id)) next.delete(m.id);
      else next.add(m.id);
      writeAccepted([...next]);
      return next;
    });
  }

  function save() {
    if (!draft || !take) return;
    const id = `live-${Date.now().toString(36)}`;
    saveResult(id, {
      student: draft.student || "Unnamed reader",
      title: draft.title,
      text: draft.text,
      words: take.words,
      accepted: [...accepted],
      recordedOn: take.recordedAt.slice(0, 10),
      producedBy: take.producedBy,
      hasAudio,
    });
    router.push(`/result/${id}`);
  }

  if (!ready) {
    return (
      <Card>
        <CardContent className="p-7 text-muted-foreground">Loading the running record...</CardContent>
      </Card>
    );
  }

  if (!draft || !take || !analysis || !score) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nothing to review yet</CardTitle>
          <CardDescription>Record a reading (or load a sample reading) first, then come back here.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/screen/record">Record the reading</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/screen/passage">Change the passage</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const playNote =
    take.source === "sample"
      ? "Sample readings come as transcripts without audio. Record a live reading to listen back."
      : "The audio lives only in this tab's memory and was cleared by a reload. Record again to listen back.";

  return (
    <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
      <Card className="recito-enter">
        <CardHeader>
          <CardTitle>
            {draft.student || "This reader"} on &ldquo;{draft.title}&rdquo;
          </CardTitle>
          <CardDescription>{take.producedBy}. Click a colored word to inspect it.</CardDescription>
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
          canPlay={hasAudio}
          playNote={playNote}
          onPlay={(m) => playMoment(m.start, m.end)}
          onToggle={toggle}
        />
        <Button size="lg" className="w-full" onClick={save}>
          Save the running record
        </Button>
      </div>
    </div>
  );
}

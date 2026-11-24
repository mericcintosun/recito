"use client";

import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { MiscueKind } from "@/lib/data";
import { KIND_LABEL, describeMark, formatClock, type Mark, type Score } from "@/lib/scoring";
import { cn } from "@/lib/utils";

const DOT: Record<MiscueKind, string> = {
  substitution: "bg-bad",
  omission: "bg-warn",
  insertion: "bg-foreground",
  repetition: "bg-deep ring-1 ring-foreground",
  pause: "bg-sun",
};

/** The score, as words: one large number, then the sentence behind it. */
export function ScoreSummary({ score, className }: { score: Score; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardDescription>Words correct per minute</CardDescription>
        <p className="font-display text-6xl font-semibold tracking-tight">{score.wcpm}</p>
        <p className="text-base">
          {score.correct} of {score.attempted} words correct ({Math.round(score.accuracy * 100)}% accuracy) in {score.seconds}s.
        </p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          {(Object.keys(KIND_LABEL) as MiscueKind[]).map((k) => (
            <li key={k} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <span className={cn("size-2.5 rounded-full", DOT[k])} aria-hidden="true" />
                {KIND_LABEL[k]}
                {(k === "substitution" || k === "omission") && <span className="text-muted-foreground">(counted)</span>}
              </span>
              <span className="font-semibold">{score.counts[k]}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

interface MarkInspectorProps {
  mark: Mark | null;
  accepted: boolean;
  canPlay: boolean;
  playNote: string;
  onPlay?: (m: Mark) => void;
  onToggle?: (m: Mark) => void;
}

/** Detail for the selected mark: what happened, when, listen back, overrule. */
export function MarkInspector({ mark, accepted, canPlay, playNote, onPlay, onToggle }: MarkInspectorProps) {
  if (!mark) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pick a mark</CardTitle>
          <CardDescription>Click any colored word in the record to see what the child said and when.</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardDescription className="flex items-center gap-2">
          <span className={cn("size-2.5 rounded-full", DOT[mark.kind])} aria-hidden="true" />
          {KIND_LABEL[mark.kind]} at {formatClock(mark.start)}
        </CardDescription>
        <CardTitle className="text-xl">The reader {describeMark(mark)}.</CardTitle>
        {accepted && (
          <p className="text-sm font-semibold text-ok">
            {mark.countsAsError ? "Overruled: counted as correct." : "Dismissed by the teacher."}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {onPlay && (
          <Button variant="outline" className="w-full" disabled={!canPlay} onClick={() => onPlay(mark)}>
            <Play /> Play this moment
          </Button>
        )}
        {!canPlay && <p className="text-sm text-muted-foreground">{playNote}</p>}
        {onToggle && (
          <Button variant="secondary" className="w-full" onClick={() => onToggle(mark)}>
            {accepted
              ? mark.countsAsError
                ? "Count it as an error again"
                : "Restore this mark"
              : mark.countsAsError
                ? "Count as correct (dialect, self-correction)"
                : "Dismiss this mark"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

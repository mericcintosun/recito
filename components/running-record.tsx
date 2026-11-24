"use client";

import { Fragment, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { Analysis, Mark } from "@/lib/scoring";
import { cn } from "@/lib/utils";

interface RunningRecordProps {
  analysis: Analysis;
  accepted: ReadonlySet<string>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const KIND_CLASS: Record<Mark["kind"], string> = {
  substitution: "bg-bad/15 underline decoration-bad decoration-2 underline-offset-4",
  omission: "text-warn line-through decoration-warn decoration-2",
  insertion: "bg-deep text-sm",
  repetition: "bg-deep text-sm underline decoration-wavy decoration-foreground/60",
  pause: "bg-sun/70 text-xs font-semibold",
};

/**
 * The passage as a running record: every passage word in order, with each miscue as a
 * clickable mark. Words the reader never reached are dimmed.
 */
export function RunningRecord({ analysis, accepted, selectedId, onSelect }: RunningRecordProps) {
  const byRef = new Map<number, Mark>();
  const extraByHyp = new Map<number, Mark>();
  const pauseByHyp = new Map<number, Mark>();
  for (const m of analysis.marks) {
    if ((m.kind === "substitution" || m.kind === "omission") && m.refIndex !== null) byRef.set(m.refIndex, m);
    else if (m.kind === "pause" && m.hypIndex !== null) pauseByHyp.set(m.hypIndex, m);
    else if (m.hypIndex !== null) extraByHyp.set(m.hypIndex, m);
  }

  const markButton = (m: Mark, content: ReactNode) => {
    const isAccepted = accepted.has(m.id);
    return (
      <Button
        variant="mark"
        size="inline"
        onClick={() => onSelect(m.id)}
        aria-pressed={selectedId === m.id}
        aria-label={`${m.kind}${isAccepted ? ", overruled" : ""}`}
        className={cn(
          isAccepted ? "bg-ok/15 text-ok no-underline" : KIND_CLASS[m.kind],
          selectedId === m.id && "ring-2 ring-ring",
        )}
      >
        {content}
      </Button>
    );
  };

  const items: ReactNode[] = [];
  analysis.cells.forEach((c, k) => {
    if (c.op !== "del") {
      const pause = pauseByHyp.get(c.hyp);
      if (pause) items.push(<Fragment key={`p${k}`}>{markButton(pause, `${pause.seconds}s`)}</Fragment>);
    }
    if (c.op === "match") {
      items.push(<span key={k}>{analysis.tokens[c.ref].display}</span>);
    } else if (c.op === "sub") {
      const m = byRef.get(c.ref);
      const word = analysis.tokens[c.ref].display;
      items.push(
        <Fragment key={k}>
          {m ? (
            markButton(
              m,
              <span className="inline-flex flex-col items-center leading-tight">
                <span className="text-xs font-semibold text-bad">{analysis.words[c.hyp].text}</span>
                <span>{word}</span>
              </span>,
            )
          ) : (
            <span>{word}</span>
          )}
        </Fragment>,
      );
    } else if (c.op === "del") {
      const m = byRef.get(c.ref);
      const word = analysis.tokens[c.ref].display;
      items.push(
        m ? (
          <Fragment key={k}>{markButton(m, word)}</Fragment>
        ) : (
          <span key={k} className="text-muted-foreground/60">
            {word}
          </span>
        ),
      );
    } else {
      const m = extraByHyp.get(c.hyp);
      if (m) items.push(<Fragment key={k}>{markButton(m, `+${analysis.words[c.hyp].text}`)}</Fragment>);
    }
  });

  return (
    <p className="text-xl leading-[2.6] md:text-2xl md:leading-[2.6]">
      {items.map((item, i) => (
        <Fragment key={i}>
          {item}{" "}
        </Fragment>
      ))}
    </p>
  );
}

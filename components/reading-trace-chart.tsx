"use client";

// Kit K5, signature 1: the hero chart. d3 does the scales and the line shape, React
// renders the SVG, Motion draws the line (pathLength) when the teacher picks another
// reader. The first render is fully drawn, so server HTML is readable without JS.

import * as d3 from "d3";
import { motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { MiscueKind } from "@/lib/data";
import { cn } from "@/lib/utils";

export interface ChartReading {
  id: string;
  student: string;
  passageTitle: string;
  seconds: number;
  wcpm: number;
  accuracy: number;
  attempted: number;
  points: { t: number; words: number }[];
  marks: { id: string; kind: MiscueKind; t: number; words: number; label: string }[];
}

const W = 720;
const H = 320;
const M = { top: 18, right: 20, bottom: 44, left: 52 };

const KIND_STYLE: Record<MiscueKind, string> = {
  substitution: "fill-bad",
  omission: "fill-warn",
  insertion: "fill-foreground",
  repetition: "fill-deep stroke-foreground",
  pause: "fill-sun",
};

const KIND_NAME: Record<MiscueKind, string> = {
  substitution: "substitution",
  omission: "omission",
  insertion: "insertion",
  repetition: "repetition",
  pause: "pause over 1 s",
};

export function ReadingTraceChart({ readings }: { readings: ChartReading[] }) {
  const [activeId, setActiveId] = useState(readings[0]?.id ?? "");
  const [touched, setTouched] = useState(false);
  const reduce = useReducedMotion();
  const active = readings.find((r) => r.id === activeId) ?? readings[0];

  const x = useMemo(
    () =>
      d3
        .scaleLinear()
        .domain([0, d3.max(readings, (r) => r.seconds) ?? 60])
        .nice()
        .range([M.left, W - M.right]),
    [readings],
  );
  const y = useMemo(
    () =>
      d3
        .scaleLinear()
        .domain([0, d3.max(readings, (r) => d3.max(r.points, (p) => p.words) ?? 0) ?? 80])
        .nice()
        .range([H - M.bottom, M.top]),
    [readings],
  );

  if (!active) return null;

  const line = d3
    .line<{ t: number; words: number }>()
    .x((p) => x(p.t))
    .y((p) => y(p.words))
    .curve(d3.curveMonotoneX);
  const d = line(active.points) ?? "";
  const animate = touched && !reduce;
  const kinds = Array.from(new Set(active.marks.map((m) => m.kind)));

  const summary = `${active.student} read ${active.attempted} words of "${active.passageTitle}" in ${Math.round(
    active.seconds,
  )} seconds: ${active.wcpm} words correct per minute at ${Math.round(active.accuracy * 100)}% accuracy, with ${
    active.marks.length
  } marks for the teacher to check.`;

  return (
    <figure className="space-y-5">
      <div role="group" aria-label="Choose a sample reader" className="flex flex-wrap gap-2">
        {readings.map((r) => (
          <Button
            key={r.id}
            size="sm"
            variant={r.id === active.id ? "secondary" : "ghost"}
            aria-pressed={r.id === active.id}
            onClick={() => {
              setActiveId(r.id);
              setTouched(true);
            }}
          >
            {r.student}
          </Button>
        ))}
      </div>

      <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[320px]" role="img" aria-label={summary}>
        {y.ticks(5).map((t) => (
          <g key={`y${t}`}>
            <line x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} className="stroke-line" strokeWidth={1} />
            <text x={M.left - 10} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted-foreground text-[12px]">
              {t}
            </text>
          </g>
        ))}
        {x.ticks(6).map((t) => (
          <text key={`x${t}`} x={x(t)} y={H - M.bottom + 22} textAnchor="middle" className="fill-muted-foreground text-[12px]">
            {t}s
          </text>
        ))}
        <text
          transform={`translate(14 ${(H - M.bottom + M.top) / 2}) rotate(-90)`}
          textAnchor="middle"
          className="fill-muted-foreground text-[12px]"
        >
          words read correctly
        </text>

        <motion.path
          key={active.id}
          d={d}
          fill="none"
          className="stroke-primary"
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={animate ? { pathLength: 0 } : false}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: [0.19, 1, 0.22, 1] }}
        />

        {active.marks.map((m) => (
          <motion.circle
            key={`${active.id}-${m.id}`}
            cx={x(m.t)}
            cy={y(m.words)}
            r={6.5}
            strokeWidth={2}
            className={KIND_STYLE[m.kind]}
            initial={animate ? { opacity: 0, scale: 0 } : false}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: animate ? 0.2 + (m.t / Math.max(1, active.seconds)) * 1.0 : 0, duration: 0.3 }}
          >
            <title>{`${m.t}s: ${m.label}`}</title>
          </motion.circle>
        ))}
      </svg>
      </div>

      <figcaption className="space-y-3">
        <p className="max-w-[70ch] text-base text-foreground">{summary}</p>
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground" aria-label="Legend">
          {kinds.map((k) => (
            <li key={k} className="flex items-center gap-2">
              <svg width="12" height="12" aria-hidden="true">
                <circle cx="6" cy="6" r="5" strokeWidth={1.5} className={cn(KIND_STYLE[k])} />
              </svg>
              {KIND_NAME[k]}
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}

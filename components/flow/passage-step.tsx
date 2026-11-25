"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { readDraft, writeDraft, type FlowDraft } from "@/lib/flow-session";
import { tokenizePassage } from "@/lib/scoring";
import type { ApiResponse, Passage } from "@/lib/types";

const MIN_WORDS = 10;

const EMPTY_DRAFT: FlowDraft = { student: "", passageId: null, title: "Pasted passage", text: "" };

type PassageList = { state: "loading" } | { state: "ready"; passages: Passage[] };

export function PassageStep() {
  const [draft, setDraft] = useState<FlowDraft>(EMPTY_DRAFT);
  const [hydrated, setHydrated] = useState(false);
  const [list, setList] = useState<PassageList>({ state: "loading" });
  const hadSavedDraft = useRef(false);

  useEffect(() => {
    const saved = readDraft();
    if (saved) {
      hadSavedDraft.current = true;
      setDraft(saved);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    let live = true;
    fetch("/api/passages")
      .then((res) => res.json() as Promise<ApiResponse<Passage[]>>)
      .then((body) => {
        if (!live) return;
        const loaded = body.ok ? body.data : [];
        setList({ state: "ready", passages: loaded });
        // First visit with nothing typed yet: start from the first saved passage.
        const first = loaded[0];
        if (first && !hadSavedDraft.current) {
          setDraft((d) => (d.text === "" ? { ...d, passageId: first.id, title: first.title, text: first.text } : d));
        }
      })
      .catch(() => {
        if (live) setList({ state: "ready", passages: [] });
      });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (hydrated) writeDraft(draft);
  }, [draft, hydrated]);

  const passages = list.state === "ready" ? list.passages : [];

  const tokens = useMemo(() => tokenizePassage(draft.text), [draft.text]);
  const finishAt = (wcpm: number) => Math.round((tokens.length / wcpm) * 60);
  const ready = tokens.length >= MIN_WORDS;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
      <Card className="recito-enter">
        <CardHeader>
          <CardTitle>What will the child read?</CardTitle>
          <CardDescription>Use one of the sample passages or paste any English text from your own reading program.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {list.state === "loading" ? (
            <div className="flex flex-wrap gap-2" aria-busy="true" aria-label="Loading saved passages">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-9 w-40 rounded-xl bg-surface" />
              ))}
            </div>
          ) : passages.length === 0 ? (
            <p className="rounded-xl bg-surface p-4 text-sm text-muted-foreground">
              No saved passages yet. Paste your own below.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Sample passages">
              {passages.map((p) => (
                <Button
                  key={p.id}
                  size="sm"
                  variant={draft.passageId === p.id ? "secondary" : "ghost"}
                  aria-pressed={draft.passageId === p.id}
                  onClick={() => setDraft((d) => ({ ...d, passageId: p.id, title: p.title, text: p.text }))}
                >
                  {p.title}
                </Button>
              ))}
            </div>
          )}

          <label className="block space-y-2">
            <span className="text-sm font-semibold">Passage</span>
            <Textarea
              value={draft.text}
              rows={8}
              onChange={(e) => {
                const text = e.target.value;
                setDraft((d) => {
                  const preset = passages.find((p) => p.text === text);
                  return { ...d, text, passageId: preset?.id ?? null, title: preset?.title ?? "Pasted passage" };
                });
              }}
              placeholder="Paste the passage here"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold">Reader (optional, stays on this device)</span>
            <Input
              value={draft.student}
              onChange={(e) => setDraft((d) => ({ ...d, student: e.target.value }))}
              placeholder="First name and initial, for example Maya R."
            />
          </label>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="recito-enter">
          <CardHeader>
            <CardTitle>Running record preview</CardTitle>
            <CardDescription>
              {ready
                ? `${tokens.length} words. Every one of them gets checked against what the child says.`
                : `Add at least ${MIN_WORDS} words to start. ${tokens.length} so far.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {tokens.length > 0 ? (
              <p className="text-base leading-8">
                {tokens.slice(0, 40).map((t) => (
                  <span key={t.index} className="mr-1 rounded-md bg-surface px-1">
                    {t.display}
                  </span>
                ))}
                {tokens.length > 40 && <span className="text-muted-foreground"> and {tokens.length - 40} more</span>}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">The words of your passage will line up here.</p>
            )}
            {ready && (
              <p className="text-sm text-muted-foreground">
                A reader at 60 words correct per minute finishes in about {finishAt(60)}s, at 90 in {finishAt(90)}s, at 120 in{" "}
                {finishAt(120)}s.
              </p>
            )}
          </CardContent>
        </Card>

        <Button asChild={ready} disabled={!ready} size="lg" className="w-full">
          {ready ? <Link href="/screen/record">Next: record the reading</Link> : <span>Next: record the reading</span>}
        </Button>
      </div>
    </div>
  );
}

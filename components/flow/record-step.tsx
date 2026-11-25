"use client";

import Link from "next/link";
import { Mic, Square } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAsrAdapter, type ModelStatus } from "@/lib/adapters/asr";
import { getDataAdapter } from "@/lib/adapters/readings";
import type { SampleReading } from "@/lib/types";
import { readDraft, readTake, setLiveAudio, writeTake, type FlowDraft, type FlowTake } from "@/lib/flow-session";
import { analyzeReading, formatClock, scoreReading } from "@/lib/scoring";

type Phase = "idle" | "recording" | "decoding" | "transcribing";
interface Problem {
  title: string;
  body: string;
}

const MAX_SECONDS = 180;

const PROBLEMS = {
  noRecorder: {
    title: "This browser cannot record audio",
    body: "Recito needs microphone access and MediaRecorder. Try a current Chrome, Edge, Firefox or Safari, or use the sample reading below.",
  },
  denied: {
    title: "Microphone access was blocked",
    body: "Allow the microphone for this site in the address bar, then press record again. Nothing is uploaded either way.",
  },
  noMic: {
    title: "No microphone found",
    body: "Plug in or enable a microphone and press record again.",
  },
  silent: {
    title: "That recording was nearly silent",
    body: "Check that the right microphone is selected and that the child is within an arm's length of it, then record again.",
  },
  empty: {
    title: "No words were recognized",
    body: "The model heard audio but no English words. Recito currently supports English passages only.",
  },
} satisfies Record<string, Problem>;

function rms(pcm: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < pcm.length; i++) sum += pcm[i] * pcm[i];
  return Math.sqrt(sum / Math.max(1, pcm.length));
}

const asr = getAsrAdapter();

function modelLine(s: ModelStatus): string {
  if (asr.mode === "fake") {
    return "Demo mode: no model download. A recording here gets the sample transcript of The House on Tern Hill, clearly labelled, so you can walk the whole flow.";
  }
  switch (s.state) {
    case "idle":
      return "Preparing the speech model.";
    case "loading":
      return `Downloading Whisper tiny.en once (about 40 MB), then it stays in this browser's cache: ${s.progress}%`;
    case "ready":
      return "Whisper tiny.en is loaded in this tab.";
    case "working":
      return "Whisper is transcribing on this device.";
    case "error":
      return `The speech model could not load (${s.message}). You can still walk through the flow with a sample reading.`;
  }
}

export function RecordStep() {
  const [draft, setDraft] = useState<FlowDraft | null>(null);
  const [take, setTake] = useState<FlowTake | null>(null);
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [problem, setProblem] = useState<Problem | null>(null);
  const [model, setModel] = useState<ModelStatus>({ state: "idle" });
  const [elapsed, setElapsed] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setDraft(readDraft());
    setTake(readTake());
    setReady(true);
  }, []);

  // Preload the model as soon as the step opens so it is warm when the child finishes.
  useEffect(() => {
    const off = asr.watch(setModel);
    asr.preload();
    return off;
  }, []);

  useEffect(
    () => () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  const [sample, setSample] = useState<SampleReading | null>(null);
  const passageId = draft?.passageId ?? null;

  useEffect(() => {
    let live = true;
    if (!passageId) {
      setSample(null);
      return;
    }
    const data = getDataAdapter();
    data
      .listReadings()
      .then((list) => {
        const first = list.find((r) => r.passageId === passageId);
        return first ? data.getReading(first.id) : null;
      })
      .then((r) => {
        if (live) setSample(r);
      })
      .catch(() => {
        if (live) setSample(null);
      });
    return () => {
      live = false;
    };
  }, [passageId]);

  const finish = useCallback(async (blob: Blob) => {
    try {
      setPhase("decoding");
      const ctx = new AudioContext({ sampleRate: 16000 });
      const buffer = await ctx.decodeAudioData(await blob.arrayBuffer());
      void ctx.close();
      const pcm = buffer.getChannelData(0);
      if (buffer.duration < 2 || rms(pcm) < 0.003) {
        setProblem(PROBLEMS.silent);
        setPhase("idle");
        return;
      }
      // In demo mode the transcript is the sample fixture, so its timings do not match this
      // recording. Keep no audio then: the review step says plainly that there is no clip.
      const fake = asr.mode === "fake";
      setLiveAudio(fake ? null : buffer);
      setPhase("transcribing");
      const result = await asr.transcribe(pcm);
      if (result.words.length === 0) {
        setProblem(PROBLEMS.empty);
        setPhase("idle");
        return;
      }
      const next: FlowTake = {
        words: result.words,
        source: fake ? "sample" : "whisper",
        producedBy: asr.describe(result),
        recordedAt: new Date().toISOString(),
      };
      writeTake(next);
      setTake(next);
      setPhase("idle");
    } catch (err) {
      setProblem({
        title: "The reading could not be transcribed",
        body: `${err instanceof Error ? err.message : String(err)}. Your recording stayed on this device. Try again, or use the sample reading.`,
      });
      setPhase("idle");
    }
  }, []);

  const stop = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  async function start() {
    setProblem(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setProblem(PROBLEMS.noRecorder);
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: false, noiseSuppression: false },
      });
    } catch (err) {
      const denied = err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "SecurityError");
      setProblem(denied ? PROBLEMS.denied : PROBLEMS.noMic);
      return;
    }
    streamRef.current = stream;
    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      void finish(new Blob(chunks, { type: recorder.mimeType }));
    };
    recorderRef.current = recorder;
    recorder.start();
    const startedAt = performance.now();
    setElapsed(0);
    setPhase("recording");
    timerRef.current = window.setInterval(() => {
      const s = (performance.now() - startedAt) / 1000;
      setElapsed(s);
      if (s >= MAX_SECONDS) stop();
    }, 200);
  }

  function loadSample() {
    if (!sample) return;
    setLiveAudio(null);
    const next: FlowTake = {
      words: sample.transcript,
      source: "sample",
      producedBy: `Sample reading by ${sample.student} (transcript only, no audio)`,
      recordedAt: sample.recordedOn,
    };
    writeTake(next);
    setTake(next);
    setProblem(null);
  }

  const preview = useMemo(() => {
    if (!draft || !take) return null;
    const analysis = analyzeReading(draft.text, take.words);
    return { analysis, score: scoreReading(analysis) };
  }, [draft, take]);

  if (!ready) {
    return (
      <Card>
        <CardContent className="p-7 text-muted-foreground">Loading this screening...</CardContent>
      </Card>
    );
  }

  if (!draft) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Choose a passage first</CardTitle>
          <CardDescription>Recito needs the text the child will read before it can mark the reading.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/screen/passage">Choose the passage</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const busy = phase === "decoding" || phase === "transcribing";
  const progress = model.state === "loading" ? model.progress : model.state === "idle" ? 0 : 100;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <Card className="recito-enter">
        <CardHeader>
          <CardTitle>{draft.title}</CardTitle>
          <CardDescription>{draft.student ? `${draft.student} reads this aloud.` : "The child reads this aloud."}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="max-w-[68ch] text-xl leading-relaxed md:text-2xl md:leading-relaxed">{draft.text}</p>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="recito-enter">
          <CardHeader>
            <CardTitle>Recorder</CardTitle>
            <CardDescription>{modelLine(model)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div
              className="h-2 overflow-hidden rounded-full bg-surface"
              role="progressbar"
              aria-label="Speech model download"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
            >
              <div className="h-full rounded-full bg-ok transition-[width] duration-300" style={{ width: `${progress}%` }} />
            </div>

            {phase === "recording" ? (
              <Button size="lg" variant="destructive" className="w-full" onClick={stop}>
                <Square /> Stop at {formatClock(elapsed)}
              </Button>
            ) : (
              <Button
                size="lg"
                variant={take ? "outline" : "default"}
                className="h-auto min-h-13 w-full whitespace-normal py-3 text-center"
                onClick={start}
                disabled={busy}
              >
                <Mic />
                {busy ? (phase === "decoding" ? "Preparing the audio..." : "Transcribing on this device...") : take ? "Record again" : "Start recording"}
              </Button>
            )}

            <Badge variant="secondary">Audio stays in this browser</Badge>

            {problem && (
              <div role="alert" className="space-y-1 rounded-md bg-bad/10 p-4">
                <p className="font-semibold text-bad">{problem.title}</p>
                <p className="text-sm">{problem.body}</p>
              </div>
            )}

            {sample && (
              <Button
                variant="ghost"
                className="h-auto min-h-11 w-full whitespace-normal py-2.5 text-center"
                onClick={loadSample}
                disabled={phase !== "idle"}
              >
                No microphone handy? Load {sample.student}&apos;s sample reading
              </Button>
            )}
          </CardContent>
        </Card>

        {preview && take && (
          <Card className="recito-enter">
            <CardHeader>
              <CardTitle>So far</CardTitle>
              <CardDescription>{take.producedBy}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-base">
                {preview.score.wcpm} words correct per minute, {Math.round(preview.score.accuracy * 100)}% accuracy,{" "}
                {preview.analysis.marks.length} marks to review.
              </p>
              <p className="line-clamp-3 text-sm text-muted-foreground">
                Heard: {take.words.map((w) => w.text).join(" ")}
              </p>
              <Button asChild size="lg" className="w-full">
                <Link href="/screen/review">Next: review the marks</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

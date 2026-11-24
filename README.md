# Recito

A teacher pastes a passage, a child reads it aloud, and the browser returns words correct per minute plus every reading mistake as a mark you can click to hear. The audio never leaves the device.

> Live demo: https://recito.vercel.app

## The problem

Primary school teachers check oral reading fluency a few times a year, one child at a time: a stopwatch in one hand, a paper copy of the passage, a pencil for marking errors. For a class of 25 that is more than half a day. Errors marked while listening can't be listened to again, so two teachers often score the same reading differently.

Automated tools exist, but each one asks for something schools struggle to give. Microsoft Reading Progress needs Teams and a Microsoft 365 education account. Commercial products need a school license. Most send the child's voice to a cloud service, which in many schools means a parental consent form before anyone can press record.

## The solution

Recito is a three-step web app: choose the passage, record the reading, review the marks.

- **Transcription in the page.** Whisper tiny.en (the timestamped ONNX build) runs through Transformers.js in the browser and returns every word with its start and end time. About 40 MB, downloaded once, cached after that.
- **Deterministic alignment.** Needleman-Wunsch lines the heard words up against the passage. Unmatched cells become omissions, substitutions or insertions; an extra word that echoes a neighbor becomes a repetition. Double Metaphone separates "sounds close" substitutions from completely different words.
- **Standard scoring.** Words correct per minute = (words attempted minus substitutions and omissions) per minute between the first and last word. Silences over 1 second are marked as pauses.
- **Click to hear, click to overrule.** Each mark is tied to its moment in the recording. The teacher can replay it and count it as correct (dialect, self-correction), and the score updates instantly.
- **Nothing uploaded.** The audio buffer lives in the tab's memory only. Results stay in sessionStorage. There is no backend.

We picked a small speech model plus plain dynamic programming on purpose: a number that feeds a reading intervention decision has to be explainable, and every mark in Recito points to one word and one moment of audio.

## Evaluation

The Method page (`/about#evaluation`) computes a table live from the six hand-marked sample readings in `lib/data.ts`: an ordinary reading with one of each miscue type, a fast clean one, a slow one with long hesitations, one that stops early, one with many false starts, and one with dropped word endings. For each reading it shows teacher marks, engine marks, agreements, false alarms and misses. These transcripts test the alignment engine. Whisper on real children's recordings is the next measurement (see below), and we report it separately.

Known limits, stated in the app as well:

- Whisper tends to turn disfluent reading into fluent English, which can hide real substitutions.
- Speech recognition is weaker on young children's voices. Recito is a screening aid, not a diagnosis.
- English passages only (tiny.en is an English model).

## Sponsor and required tech

- **Transformers.js** (`@huggingface/transformers`): runs Whisper in the browser. See `components/whisper-local.ts`.
- **Prune** (in progress): the quality gate for this AI-assisted codebase. The check runs before merge, and its cleanup tasks go back to the coding agent. The before and after record will be added to this section once the first pass is done.

## Tech stack

Next.js 15 (App Router), TypeScript, Tailwind CSS v4, shadcn-style primitives, Transformers.js, Web Audio API and MediaRecorder, double-metaphone, d3 and Motion for the reading trace chart. Deploys to Vercel as a static-first app with no server code.

## Quickstart

```bash
npm install
npm run dev
# open http://localhost:3000
```

No environment variables are needed (`.env.example` says so). The first recording downloads the model; after that it works offline from cache. No microphone? On the record step, load a sample reading to walk the whole flow.

## What we would build next

1. Move Whisper into a Web Worker so long readings never freeze the page.
2. Record and hand-mark six real readings, then publish miscue precision and recall for tiny.en and base.en, plus transcription time on a school Chromebook.
3. A class roster view: one row per child, fall to spring WCPM, exportable as CSV.
4. Number and abbreviation normalization ("1999", "Dr.") before alignment.

## AI use

<!-- Adjust this section to each hackathon's disclosure rules. -->

We used AI coding assistants for scaffolding and boilerplate. Architecture, product decisions, and final code review are our own.

The product's own AI is Whisper tiny.en, run in the browser through Transformers.js. All scoring after the transcript is deterministic code.

# HANDOFF: Recito

You are picking up a working Next.js 15 scaffold. Read this file, then `IDENTITY.md`, then start on the Mission list. Keep `npm run build` green after every change.

## 1. Context

- **Product:** Recito. A teacher pastes a passage, a child reads it aloud, and the browser returns words correct per minute (WCPM) plus every reading mistake as a mark you can click to hear. The audio never leaves the device.
- **Pitch:** A classroom teacher opens the page, pastes the text the student will read, and presses record. The child reads aloud for about a minute. As soon as recording stops, skipped words, misread words, repetitions and long pauses appear as colored marks on the passage, next to WCPM and an accuracy percentage. The teacher clicks a marked word to hear how the child said it and fixes any wrong mark with one click. The recording never goes to a server; everything happens in the teacher's own browser.
- **Hackathon:** Global AI Builder's Challenge (Devpost, organized by Refactor The World). Students only, team of 1 to 6.
- **Deadline:** 28 November 2026, 15:00 PST.
- **Target track:** 1st Place Overall. Also enter Best AI for Education, Best AI Engineering, and opt in to Best Use of Prune (select it on the submission form and show Prune in use).
- **Judging rubric:** Problem Value & Practicality 20, AI Integration & Development 30 (justified AI choice, effective implementation, AI assessment with results and limits, checked AI-assisted development), Functionality & Reliability 30 (complete main task, correct results across cases, safe failure handling), Design Quality & UX 20.
- **Submission requirements (verified):**
  - Devpost description answering five questions: target user, what was built during the event, how AI is used, access and results, limitations.
  - A 2 to 4 minute demo video of the real project (YouTube or Vimeo, public and embeddable). The builder records it.
  - Public GitHub repo with all code, setup instructions and third-party dependencies.
  - Complete team list on Devpost.
  - Development statement and AI use statement.
  - Each participant fills in the Participant Contact & Sponsor Opt-In form separately.
  - Sponsor tools named in the description; select "Best Use of Prune" on the form to enter that award.

## 2. Current state

Identity: see IDENTITY.md (direction D17, structure S3, archetype L5, kit K5)

### Route map (Structure S3 guided flow)

| Route | File | What it shows |
| --- | --- | --- |
| `/` | `app/page.tsx` | L5 bands: claim + scene-1, reading trace chart, privacy + scene-2, evaluation sentence + scene-3, CTA band |
| `/screen/passage` | `app/screen/[step]/page.tsx` + `components/flow/passage-step.tsx` | Step 1: pick or paste the passage, live running-record preview |
| `/screen/record` | `app/screen/[step]/page.tsx` + `components/flow/record-step.tsx` | Step 2: model preload with progress, record/stop, error states, sample fallback, live score preview |
| `/screen/review` | `app/screen/[step]/page.tsx` + `components/flow/review-step.tsx` | Step 3: running record, score, mark inspector, play moment, overrule, save |
| `/result/[id]` | `app/result/[id]/page.tsx` + `components/result-view.tsx` | Saved record with share control (copy summary, copy link). Seeded ids: `maya-r-0909`, `theo-b-0909`, `amara-n-0910`, `lucas-p-0911`, `priya-s-0915`, `jonah-w-0917`; live ids start with `live-` |
| `/about` | `app/about/page.tsx` | Method, model choice, live evaluation table, limits, sponsor tech |

Navigation: the header links to Screen a reader, Sample record, Method; `components/flow-progress.tsx` is the persistent step indicator on every step and links each step. Back and forward keep input through sessionStorage (`lib/flow-session.ts`).

### File map

- `lib/data.ts`: 3 original passages, 6 sample readings with hand-written transcripts (timed by `performReading`) and hand-marked gold miscues.
- `lib/scoring.ts`: the real engine. Normalization, Needleman-Wunsch `align`, `analyzeReading` (classification and pauses), `scoreReading` (WCPM, accuracy, teacher overrides), `readingTrace` (chart data), `evaluateSamples` (engine vs teacher marks).
- `lib/flow-session.ts`: step list, sessionStorage draft/take/overrides/results, in-memory audio buffer, `playMoment`.
- `components/whisper-local.ts`: REAL Transformers.js integration. `loadWhisper()` dynamically imports `@huggingface/transformers` and builds the `automatic-speech-recognition` pipeline for `onnx-community/whisper-tiny.en_timestamped` with a determinate download progress; `transcribeLocally()` asks for word timestamps and falls back to segment timestamps (labelled "word timings estimated") if the build cannot give word times.
- `components/reading-trace-chart.tsx`: kit K5 signature 1.
- `components/running-record.tsx`, `components/record-panels.tsx`: the colored passage, score summary, mark inspector.
- `components/site-header.tsx`, `components/flow-progress.tsx`, `components/ui/*` (restyled to D17: floating panels, `shadow-float`, 20px corners, no hard borders; `textarea.tsx` added; Button has a `mark` variant with size `inline` for clickable words).
- Brand: `public/logo.svg` and `app/icon.svg` (book with a sun-colored voice wave on raspberry), `public/illustrations/scene-1..3.svg`, `app/opengraph-image.tsx`.

### Real vs mocked

- Real: recording, 16 kHz decoding, in-browser Whisper, alignment, classification, scoring, overrides, segment playback of live audio, evaluation table, all charts.
- Sample data, clearly labelled in the UI: the six sample readings are transcripts with generated timings and no audio. They feed the chart, the seeded result pages and the evaluation table. The "Load the sample reading" button on the record step is the deterministic path when there is no microphone or the model fails to load.
- Not done yet: Web Worker for Whisper (TODO in `components/whisper-local.ts`), Prune setup, real-recording evaluation.

### Kit K5 signature interactions

- Shipped: **1. hero chart.** `components/reading-trace-chart.tsx` on `/`: cumulative words read correctly over time for each sample reader, built with d3 scales and `d3.line`, rendered by React, redrawn with Motion `pathLength` when the teacher picks another reader; miscue dots pop in along the line. First render is fully drawn (readable without JS), reduced motion skips the animation, and the figure carries a text summary.
- To build: **2. hover crosshair / scrubber** on the same chart that rewrites the caption sentence: "At 23s Maya had read 31 words correctly and had just paused 1.6s before chimney."
- To build: **3. animated view switch** between "cumulative words over time" and "words per 10-second window" (instantaneous pace), interpolating the path between the two shapes.

### One-mark proof (header home link, `components/site-header.tsx`)

```tsx
<Link href="/" className="flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight">
  <BrandMark size={30} />
  Recito
</Link>
```

## 3. Mission (in priority order)

Roughly 17 hours of work across the remaining days. Cut from the bottom if the deadline gets close.

1. **Make transcription solid (3.5 h).** Done looks like: on Chrome and Safari, the record step shows the download bar filling, the teacher records 60 seconds, and within a few seconds of Stop the "So far" panel shows the heard words with real per-word times. Move the pipeline into a Web Worker (`new Worker(new URL("./whisper.worker.ts", import.meta.url))`) and keep the `watchModel` / `transcribeLocally` API the same so the step component does not change. Verify `onnx-community/whisper-tiny.en_timestamped` returns word chunks; if it does not, try `onnx-community/whisper-base_timestamped` and record which one works in README. Record three deliberately flawed readings of "The House on Tern Hill" in your own voice early; they seed the evaluation.
2. **Harden the engine (2.5 h).** Done looks like: number and abbreviation normalization, contractions, hyphenated words; a pure test run (any runner you add) over 10 hand-written alignment cases. Keep the scoring rules exactly as documented on `/about`.
3. **THE WOW MOMENT (2 h, schedule it for day one evening).** Done looks like: read "house" as "horse" on purpose, stop, click the red mark above "house" on the review step, hear the 0.6 s clip of "horse" from the speakers, press "Count as correct" on another mark and watch WCPM tick up by one. Rehearse it until it takes under 20 seconds on camera. Tune `playMoment` padding if clips sound clipped.
4. **Evaluation on real audio (2 h).** Done looks like: six real recordings, hand-marked (two ordinary, one repeat of the same reading as a consistency check, one fast, one with many errors, one accented). Add a second table on `/about` with miscue precision and recall, mean absolute WCPM error versus the hand count, and tiny.en vs base.en transcription time on the same laptop. Write the limit sentence with the actual number ("Whisper smoothed over N of M substitutions"). Store transcripts and gold marks in `lib/data.ts`; never commit children's audio.
5. **Prune (1.5 h).** First open the Prune link on the Devpost page and confirm what Prune is (prunecode.ai is the working guess, not verified). If it is the code-quality CLI: run its check, feed its cleanup tasks to the coding agent, keep a before/after note in README, and wire the check into CI. Take one screenshot of a passing check for the video. If Prune turns out to be something else, re-plan this hour around it or drop the award; the main build does not depend on it. Then replace the "(in progress)" lines in README and `/about`.
6. **Failure states (1 h).** Mic denied, silent recording, model download failure, and the 3-minute auto-stop all exist; test each one by hand and add one for "passage not in English" if Whisper returns gibberish.
7. **Kit signatures 2 and 3 (1.5 h)** as described above, on the same chart.
8. **Submission text (1.5 h).** Devpost five answers, sourced from README. Target user: primary teachers doing fall and spring fluency screening. Built during the event: everything in this repo. AI: in-browser Whisper plus deterministic alignment, with the evaluation table. Access: the Vercel URL, no account. Limits: the list on `/about`.
9. **Video (1.5 h).** 2 to 4 minutes, the 90-second core flow first: problem in one line, paste passage, privacy badge, record with two errors, one repetition and one long pause, marks appear, click "house" and hear "horse", overrule a mark and WCPM moves, evaluation table and its honest limit, Prune check, end on the "horse" clip.

## 4. Constraints

- Stack: Next.js 15 App Router, TypeScript strict, Tailwind CSS v4 (no config file), shadcn-style primitives in `components/ui/`. Deploys to Vercel; no custom server, no runtime file writes.
- `IDENTITY.md` is law for every color, font, route, layout and animation decision. Only its hex values may appear in `app/globals.css`; components use tokens (`bg-primary`, `text-bad`, `fill-sun`, `shadow-float`). Sora for every h1 and h2, Nunito Sans for body. Rounded corners at 0.75rem and above. Motion uses the `recito-slide-in` keyframe only. Never edit IDENTITY.md above its Amendments heading.
- Transformers.js stays behind a dynamic import inside client code. Never add a server route that sends audio anywhere.
- Copy rules for anything a user or judge reads: no em dashes or en dashes, no double-hyphen dashes, no marketing or AI-cliche vocabulary (the scaffold prompt's banned word list still applies). Write like a teacher would talk. Never present sample data as a real measurement.
- Scope discipline: if something threatens the deadline, cut scope (signatures 2 and 3 first, then base.en timing) rather than polishing.
- Run `npm run build` after every change and keep it passing.

## 5. Definition of done

- Deployed on Vercel at https://recito.vercel.app, and the README live demo link works.
- The 90-second demo flow works end to end: paste passage, record, marks appear, click to hear, overrule, WCPM updates, save, share summary.
- The same flow works with no microphone through the sample reading.
- `/about` shows both evaluation tables (engine on transcripts, Whisper on real recordings) with stated limits.
- Prune usage verified and shown, or the award dropped on purpose.
- Wow moment rehearsed; video recorded and linked on the Devpost form by the builder.

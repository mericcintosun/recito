# HANDOFF: Recito

You are picking up a working Next.js 15 scaffold. Read this file, then `IDENTITY.md`, `CLAUDE.md` and `DEMO.md`, then start on the Mission list. Keep `npm run build` green after every change.

## 0. Phase 1 handover (walking skeleton, adapter seam, demo contract)

### Goal

Every step of the 90-second demo in `DEMO.md` has a route that renders seeded data through a seam, and the skeleton deploys with `ADAPTER_MODE=fake` (the default) so a visitor with no microphone and no model download can click the whole path.

### Status

Done by file, not yet built (the agent cannot run commands; the runner builds):

- Slice A, contract files: `DEMO.md` (six steps, each naming an existing file), `CLAUDE.md` (commands, pitfalls, Vercel guardrails, compaction line at `CLAUDE.md:12`), `.env.example` (`ADAPTER_MODE`, `NEXT_PUBLIC_ADAPTER_MODE`, `NEXT_PUBLIC_BRAND_FILES`), one added sentence in `README.md` Quickstart naming `ADAPTER_MODE`.
- Slice B, seam: `lib/types.ts`, `lib/adapters/{mode,asr,asr-real,asr-fake,readings}.ts`, `fixtures/whisper-output.tern-hill.json` (75 chunks), `fixtures/seed-manifest.json`, `prompts/whisper-decoding.md`, `scripts/seed.mjs`, `package.json` seed script, `next.config.ts` env mirror. `components/flow/record-step.tsx` now calls `getAsrAdapter()` (line 9 import, `asr.watch` / `asr.preload` / `asr.transcribe` / `asr.describe`) and finds the sample reading through `getDataAdapter()`; the UI and the "Load ... sample reading" button are unchanged.
- Slice C, API stubs: `app/api/passages/route.ts`, `app/api/readings/route.ts`, `app/api/readings/[id]/route.ts` (404 `not_found` for unknown ids), all `force-static` and typed `ApiResponse<T>`. `components/flow/passage-step.tsx` fetches `/api/passages` with a skeleton row and the empty state "No saved passages yet. Paste your own below." (line 82). `app/result/[id]/page.tsx` reads through `getDataAdapter()`.
- Slice D, shell: title template `"%s | Recito"` (`app/layout.tsx:13`), skip link plus `<main id="main">`, `components/nav-links.tsx` with `aria-current="page"` and a `bg-surface` active state, new `app/error.tsx` and `app/not-found.tsx` (Recito name, link to `/`, `reset()` retry, nothing printed from `error`), three `loading.tsx` files (static `bg-surface rounded-2xl` panels, `aria-busy`, no keyframes), `metadata` on `app/page.tsx`, chart SVG wrapped in `overflow-x-auto`.
- Slice E, audit greps run by the agent (Grep tool): dead hexes 0, banned keyframes and props 0, only `@keyframes recito-slide-in`, no dash characters in docs, app, components or prompts, `BrandMark` used once (`components/site-header.tsx:13`), no `useSearchParams`, no `fs` in app, components or lib, every `process.env.X` has a line in `.env.example`, `tsconfig.json` has `"strict": true` and `resolveJsonModule`, `.gitignore` covers `.env*` and whitelists `.env.example`, `app/icon.svg` exists.

Unverified (needs a command): `npm run build`, `npm run seed` byte-identical twice, the Vercel deploy, the 375px walk.

### Decisions

- **`lib/data.ts` stays the seed source.** `app/page.tsx` and `app/about/page.tsx` still import it directly: they are static server-rendered bands and tables and the chart takes seed props, so routing them through an async adapter would add nothing. Every flow screen and the result page go through the adapters.
- **`NEXT_PUBLIC_ADAPTER_MODE` mirror.** `next.config.ts` sets `env.NEXT_PUBLIC_ADAPTER_MODE` from `ADAPTER_MODE ?? "fake"`, so the runner keeps one name and client code can read it. `adapterMode()` treats only `"real"` as real.
- **Fake mode on the record step.** The recorder still records and checks for silence, but `asr-fake.ts` answers with the Tern Hill sample transcript. The model line and the "So far" panel say "Demo mode: sample transcript ... with generated timings, not a measurement of this recording". Since the sixth pass (2026-11-25), fake mode keeps no audio (`setLiveAudio(null)`) and tags the take `source: "sample"` (`components/flow/record-step.tsx`, inside `finish`), so "Play this moment" is off and the review panel says "This is a sample transcript without audio, so there is no clip to play" (`components/flow/review-step.tsx:99`). Before, it played the visitor's own voice cut at made-up timings, which the brief's "degrade honestly" rule does not allow. **The live site runs fake unless the runner sets `ADAPTER_MODE=real` on Vercel.** For the wow moment on camera, deploy with `real`.
- **The AsrAdapter grew two members beyond the brief:** `preload()` (the old `loadWhisper()` warm-up) and `describe(result)` (the old `producedBy` string with `MODEL_ID`), so `record-step.tsx` no longer imports `whisper-local` at all. `watchModel`, `loadWhisper` and `transcribeLocally` keep their signatures.
- **Opengraph hex exception.** `app/opengraph-image.tsx` carries raw hexes because `ImageResponse` cannot read CSS variables. It uses only IDENTITY hexes (`#efeafc`, `#1f1840`, `#c22a60`, `#f2b632`, `#d6cbf3`, `#b3382c`). It and `app/icon.svg` are the only places outside `app/globals.css` allowed to.
- **Favicon hex exception.** `app/icon.svg` (lines 2 to 8) carries `#c22a60`, `#f2b632` and `#efeafc`, all IDENTITY hexes. A favicon SVG cannot read CSS variables either, and the brief says to keep the favicon as it is.
- **Wrapping buttons on the record step.** The "Start recording" and "No microphone handy? Load Maya R.'s sample reading" buttons override the Button `whitespace-nowrap` with `whitespace-normal h-auto` (`components/flow/record-step.tsx:296` and `:315`), so the long labels wrap at 375px instead of pushing the page sideways.
- **Fixture timings** were worked out by hand from `performReading(script, 0.62)` in `lib/data.ts`. Four values sit on an exact half cent (21.885, 26.225, 40.795, 43.585); the fixture rounds them up, and JavaScript float rounding may land 0.01 lower. This does not matter for the fake path, which reads only the fixture.
- **The CLAUDE.md banned-word list** is the one expected match of the banned-word grep (`CLAUDE.md:47`). The brief requires the list to be there.
- **The passage step** starts empty and fills in the first saved passage once `/api/passages` answers, unless a sessionStorage draft already exists, so back and forward still restore the draft.

### Failed attempts

None.

### Files changed

`DEMO.md`, `CLAUDE.md`, `.env.example`, `README.md`, `HANDOFF.md`, `lib/types.ts`, `lib/adapters/mode.ts`, `lib/adapters/asr.ts`, `lib/adapters/asr-real.ts`, `lib/adapters/asr-fake.ts`, `lib/adapters/readings.ts`, `fixtures/whisper-output.tern-hill.json`, `fixtures/seed-manifest.json`, `prompts/whisper-decoding.md`, `scripts/seed.mjs`, `package.json`, `next.config.ts`, `components/flow/record-step.tsx`, `components/flow/review-step.tsx`, `app/api/passages/route.ts`, `app/api/readings/route.ts`, `app/api/readings/[id]/route.ts`, `components/flow/passage-step.tsx`, `app/result/[id]/page.tsx`, `app/layout.tsx`, `components/nav-links.tsx`, `components/site-header.tsx`, `app/error.tsx`, `app/not-found.tsx`, `app/screen/[step]/loading.tsx`, `app/result/[id]/loading.tsx`, `app/about/loading.tsx`, `app/page.tsx`, `components/reading-trace-chart.tsx`, `.farm-commits.json`. `tsconfig.json` already had `resolveJsonModule`, so it is unchanged.

### Commands run

None, the agent cannot run commands; the runner builds. (An earlier audit session ran one read-only `git status` / `git diff --stat`; nothing else.)

A third pass (file tools only) re-read every touched file and re-ran the section 6 Grep checks: dead hexes and banned keyframes or props 0; dash characters 0 in README, DEMO, CLAUDE, HANDOFF, prompts, app, components and lib; banned words only at `CLAUDE.md:47` (the required list); hexes outside `app/globals.css` only in `app/icon.svg` and `app/opengraph-image.tsx`, all IDENTITY values; `process.env` keys `NEXT_PUBLIC_ADAPTER_MODE` (`lib/adapters/mode.ts:8`) and `NEXT_PUBLIC_BRAND_FILES` (`lib/brand-files.ts:2`) both in `.env.example`; no `fs` or file writes under app, components or lib; no `useSearchParams`; no `from "@/lib/data"` in `components/flow/*` or `app/result/**`; fixture has 75 chunks ending at 47.6, matching `fixtures/seed-manifest.json`. No code change was needed.

A fourth pass (file tools only, 2026-11-24) repeated the same reads and greps with the same result: the adapters (`lib/adapters/*.ts`), the three route handlers, `record-step.tsx`, `passage-step.tsx`, `app/result/[id]/page.tsx`, the layout, nav, error, not-found and loading files, `next.config.ts`, `package.json`, `tsconfig.json`, `DEMO.md`, `CLAUDE.md`, `.env.example`, `scripts/seed.mjs` and `.farm-commits.json` all match the Phase 1 brief. No code change.

A fifth pass (file tools only, 2026-11-24) re-read the adapters, `lib/types.ts`, `app/api/readings/[id]/route.ts`, `passage-step.tsx` and the `whisper-local.ts` exports (`MODEL_ID`, `ModelStatus`, `LocalTranscript`, `watchModel`, `loadWhisper`, `transcribeLocally` all match what `asr-real.ts` and `asr-fake.ts` use), then re-ran the section 6 greps with the same clean result. No code change.

A sixth pass (file tools only, 2026-11-25) re-read the seam, routes, shell and contract files and re-ran the section 6 greps: dead hexes, banned keyframes and props 0; no dash characters; banned words only in the required `CLAUDE.md:47` list; hexes only in `app/icon.svg` and `app/opengraph-image.tsx`; one `@keyframes recito-slide-in`; one `BrandMark` (`components/site-header.tsx:13`); no `useSearchParams`; no `fs` in app, components or lib. One code change: the fake-mode clip fix above (`record-step.tsx`, `review-step.tsx`, `DEMO.md` step 4).

### Open questions

- **Prune identity is still unverified** (prunecode.ai is a guess). This is the Phase 2 baton: open the Devpost Prune link first.
- Should the Vercel deploy use `ADAPTER_MODE=real` so judges get real Whisper, with the sample button as the no-microphone path? Recommended yes, once Phase 2 moves Whisper into a worker.
- README Tech stack still says "no server code". The three API routes are `force-static` JSON built at deploy time, so this is still true in spirit; reword it in the submission README phase.
- `README.md:38` describes Prune as if a check already runs ("The check runs before merge"), though Prune is not installed. The Phase 1 brief forbids other README edits, so it is left as is; fix the wording in the submission README phase or when Prune is set up.
- Spec items not met: none known by file. Build and the 375px check are unverified until the runner reports.

### Next best step

Phase 2: move Whisper into a Web Worker behind `lib/adapters/asr-real.ts` (the record step will not change), harden the real adapter (word-chunk check on tiny.en, fallback to base), add `npm run proof`, write `.farm-live.json`, and decide the Vercel `ADAPTER_MODE`.

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
| `/api/passages`, `/api/readings`, `/api/readings/[id]` | `app/api/**/route.ts` | Static JSON (`ApiResponse<T>`) from `getDataAdapter()`; no audio, no keys |

Navigation: the header (`components/nav-links.tsx`, active link marked with `aria-current`) links to Screen a reader, Sample record, Method; `components/flow-progress.tsx` is the persistent step indicator on every step and links each step. Back and forward keep input through sessionStorage (`lib/flow-session.ts`).

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

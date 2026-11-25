# CLAUDE.md: working on Recito

Recito: a teacher pastes a passage, a child reads it aloud, and the browser returns words correct per minute plus every miscue as a mark you can click to hear. The audio never leaves the device.

## Commands

- `npm run dev`: local dev server on http://localhost:3000
- `npm run build`: production build; keep it green after every change
- `npm run seed`: validates `fixtures/whisper-output.tern-hill.json` and rewrites `fixtures/seed-manifest.json` (deterministic, byte-identical on every run)
- No test runner exists yet. Do not claim tests ran.

when compacting preserve the list of modified files and test commands

## Stack (match package.json)

Next.js 15 App Router, React 19, TypeScript strict, Tailwind 4, `@huggingface/transformers` 3, d3 7, motion 14, double-metaphone, lucide-react.

## Stack pitfalls

- Transformers.js only via dynamic import in `"use client"` code (see `components/whisper-local.ts`, loaded through `lib/adapters/asr-real.ts`).
- The recorded `AudioBuffer` lives in memory only (`lib/flow-session.ts`). Never write it to storage, a server or a log.
- Tailwind v4 has no config file. Tokens live in `app/globals.css` under `@theme inline`.
- `ADAPTER_MODE` (`fake` default, `real`) is mirrored to `NEXT_PUBLIC_ADAPTER_MODE` in `next.config.ts`. Read it only through `adapterMode()` in `lib/adapters/mode.ts`.

## Never touch

- `node_modules/`, `.next/`
- `public/illustrations/` (hand-made art)
- `IDENTITY.md` above its Amendments heading

## Vercel guardrails

- No filesystem writes at runtime. `next.config.ts` reads `public/brand` once at build time; nothing else touches `fs`.
- `useSearchParams` only under a `Suspense` boundary.
- No Node-only APIs on edge paths, no custom server, no `output: export`.
- Every `process.env` key is mirrored in `.env.example`.
- No route that receives audio or sends it anywhere, and no route that needs an API key.

## Identity in one line

D17 lilac floating panels, S3 guided flow (`/`, `/screen/[step]`, `/result/[id]`, `/about`), L5 bands on `/`, M2 `recito-slide-in`, K5 dataviz, Sora headings, Nunito Sans body, hexes only in `app/globals.css`, one brand mark in the header.

## Copy rules

- Write like a teacher talks. Never present sample data as a real measurement.
- No em dash, no en dash, no double hyphen used as a dash. Use a comma, period, colon or parentheses.
- Banned words: seamless, seamlessly, leverage, empower, revolutionize, streamline, game-changer, cutting-edge, delve, robust, unlock, elevate, harness, effortless, "in today's world", "it's not just X, it's Y".
- Name only technologies that are in `package.json`, with their real major versions.

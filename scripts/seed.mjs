// Validates the sample ASR fixture and writes fixtures/seed-manifest.json.
// Deterministic: no clock, no randomness, sorted keys, so two runs write identical bytes.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const fixturePath = "fixtures/whisper-output.tern-hill.json";
const manifestPath = "fixtures/seed-manifest.json";

const fixture = JSON.parse(readFileSync(join(root, fixturePath), "utf8"));

if (typeof fixture.text !== "string" || !Array.isArray(fixture.chunks) || fixture.chunks.length === 0) {
  console.error(`seed: ${fixturePath} needs a "text" string and a non-empty "chunks" array`);
  process.exit(1);
}

let previousStart = 0;
fixture.chunks.forEach((chunk, i) => {
  const [start, end] = chunk.timestamp ?? [];
  const ok =
    typeof chunk.text === "string" &&
    typeof start === "number" &&
    typeof end === "number" &&
    start >= 0 &&
    end >= start &&
    start >= previousStart;
  if (!ok) {
    console.error(`seed: chunk ${i} ("${chunk.text}") has a negative or out-of-order timestamp`);
    process.exit(1);
  }
  previousStart = start;
});

const last = fixture.chunks[fixture.chunks.length - 1];
const manifest = {
  chunkCount: fixture.chunks.length,
  firstStart: fixture.chunks[0].timestamp[0],
  fixture: fixturePath,
  lastEnd: last.timestamp[1],
};

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, sortKeys(value[k])]),
    );
  }
  return value;
}

writeFileSync(join(root, manifestPath), `${JSON.stringify(sortKeys(manifest), null, 2)}\n`);
console.log(`seed: ${manifest.chunkCount} chunks, last word ends at ${manifest.lastEnd}s, wrote ${manifestPath}`);

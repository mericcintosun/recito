# Whisper decoding choices

Recito sends no LLM prompt anywhere. There is no chat model, no API key and no server call in the scoring path. The only model is Whisper, run in the browser through `@huggingface/transformers` 3, and these are the choices we make when we call it (see `components/whisper-local.ts`):

- **Model:** the id in `MODEL_ID`, currently `onnx-community/whisper-tiny.en_timestamped`.
- **Word timestamps on:** `return_timestamps: "word"`, with `chunk_length_s: 30` and `stride_length_s: 5`. If a build cannot return word times, Recito falls back to segment times, spreads the words inside each segment, and labels the timings as estimated.
- **No reference passage as a prompt:** the passage the child is reading is never passed to Whisper as a decoding prompt. A prompted model hears what it expects, so it would quietly correct the child and hide the very mistakes the teacher needs to see. Recito transcribes blind and compares with the passage afterwards, in plain code (`lib/scoring.ts`).

In `ADAPTER_MODE=fake` (the default) no model runs at all: `lib/adapters/asr-fake.ts` returns the sample transcript in `fixtures/whisper-output.tern-hill.json`, and the app says so.

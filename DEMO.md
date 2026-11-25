# Recito demo script (90 seconds)

**Problem:** checking a child's reading fluency takes a stopwatch, a paper copy and a pencil, and a mark made while listening can never be listened to again.

**Trigger:** a teacher has 25 children to screen this week and one minute per child.

**Wow moment:** the teacher clicks the red mark on "house" and hears the child's 0.6 second "horse", played from the tab's memory. No audio leaves the browser.

**Closing line:** "One minute per child, every mark you can hear again, and the recording never leaves this laptop."

**Demo start route:** `/`

The builder records the video from the live site (https://recito.vercel.app). Nothing in this repo produces the video.

## Steps

1. **`/`** (`app/page.tsx`): the claim in one sentence, the privacy band ("Whisper runs inside the page"), and the reading trace chart. Click a second reader to show the line redraw. (About 10 s.)
2. **`/screen/passage`** (`app/screen/[step]/page.tsx` plus `components/flow/passage-step.tsx`): pick "The House on Tern Hill" or paste your own passage. The running record preview counts the words. Click "Next: record the reading". (About 10 s.)
3. **`/screen/record`** (`components/flow/record-step.tsx`): press "Start recording" and read with two errors (say "horse" for "house"), one repetition and one long pause, then stop. No microphone? Press "Load Maya R.'s sample reading" instead. In the default `ADAPTER_MODE=fake` the recorder answers with the labelled sample transcript and downloads nothing. (About 25 s.)
4. **`/screen/review`** (`components/flow/review-step.tsx`): the marks appear on the passage. Click the red "house" mark and press "Play this moment" to hear "horse". (With the sample reading, or with any recording in the default fake mode, the button is off and the panel says there is no clip to play. Deploy with `ADAPTER_MODE=real` to film the clip.) Pick another mark, press "Count as correct", and watch words correct per minute go up by one. Press "Save the running record". (About 25 s.)
5. **`/result/maya-r-0909`** (`app/result/[id]/page.tsx`): the saved record with the score and marks. Press "Copy summary" to show the gradebook line. (About 10 s.)
6. **`/about`** (`app/about/page.tsx`): the evaluation table, engine marks against teacher marks, and the known limits in plain words. End on the line about what has not been measured yet. (About 10 s.)

Built from the `demoScript90s` beat sheet in the idea: problem, passage, privacy, record with mistakes, marks, hear "horse", overrule, WCPM moves, save, share, evaluation and its limits.

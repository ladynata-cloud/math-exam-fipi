# Persistent solution steps and soft video action sounds

## Identity and authorization

- Date: 2026-10-05, Asia/Novosibirsk.
- Task: VIDEO_SOLUTION_HISTORY; review: MEDIUM.
- Base: main, `ab9d7d5812ed32d15fe63497cfc34288a216b753`.
- Branch: `fix/video-solution-history`.
- Owner asks that previous solution steps remain visible, then asks to replace
  the piercing beep with a more pleasant drop, tap or click. Implement a quiet,
  short tap, keeping all existing scene pauses and click positions.
- This is a bounded follow-up to the authorized published course/video work.
  Standing owner permission covers publication without separate external review.
  Narration setup was explicitly cancelled: no voice provider or paid TTS calls.
- Personal narration may be added later from owner-supplied recordings. The
  current release remains fully usable without it; do not wait for audio.
- Subsequent owner instructions in the same active task ask for printable
  cheat sheets and then their animated versions for every key topic. The
  concrete first set comprises negative numbers, fractions, brackets, linear
  equations, proportions, percentages and angles. The how-to video is deferred
  until owner-authored slides; pupil paper photos are sent manually in MAX.

## Goal and scope

Keep a readable cumulative record next to the current explanation in the
school video scenarios and the interactive player. Distinguish the current step,
earlier correct work and deliberately wrong examples. Rebuild the two existing
public math MP4s with a soft non-tonal action sound. Publish seven print-friendly
cheat sheets and corresponding stored videos; add five bounded authored topics
to the existing two math scenarios. Viewing uses
the stored files; learner visits never synthesize a new clip.

- Retain all reached correct steps without exposing future answers.
- Deterministic direct scene selection and backwards navigation; reset by topic
  and preset. Incorrect demonstrations must not become valid solution rows.
- Preserve desktop/mobile keyboard navigation and both existing video formats.
- Use a brief filtered-noise tap with a smooth attack/decay instead of a steady
  1450 Hz sine. Keep no-audio and existing voice mixing contracts unchanged.
- Default teacher export choice to clicks after the owner's explicit choice.
- Update the cabinet's fixed file revision/size metadata for rebuilt videos.
- Add a free public cheat-sheet page, and link relevant topics from the route.
- Remove the deferred how-to clip from cabinet suggestions; retain its old
  fixed studio route for compatibility. Do not regenerate/promote it.
- Bind every sheet to an exact existing trainer and its real controls. Add a
  read-only topic start card (`#learn=<fixed-topic>`) preserved through pupil
  login; create/resume an attempt only after the explicit start button. Six
  topics use existing cabinet attempts. The separate angles trainer has no
  cabinet result bridge; state this and use manual written work in MAX.
- Explain manual paper-photo delivery in the existing MAX conversation. Never
  claim messages are sent, received or reviewed automatically; no messenger API.

## Boundaries

No topics outside the seven selected foundations, account/authentication contracts, pupil data, assessment, hosting
settings, provider keys or background jobs. No production voice synthesis.
Do not change the DVI scene content or existing worker security boundaries.
ADR 0002 remains Proposed; this task relies on the already implemented renderer.

## Acceptance and verification

- [x] Previous correct lines remain visible, current step is identifiable.
- [x] Wrong rows remain explicitly separate; future rows are hidden on rewind.
- [x] Topic/preset/direct-show transitions have no stale rows.
- [x] All existing scene layouts pass at 1280x720 and 720x1280; mobile is readable.
- [x] Worker tests, legacy studio gate, export browser and history checks pass.
- [x] Seven actual math MP4s built locally and encoded frames inspected.
- [x] Seven public sheets checked at 390/1440px and one A4 page each.
- [ ] Exact MP4/static bytes checked after publication.
- [x] No narration/provider calls, no secrets/private identities in the diff.
- [ ] Exact-head CI and production checks recorded in the release PR.

Focused independent review is performed by a separate local agent. It is not
presented as an external-provider review. Final gate: VIDEO_SOLUTION_HISTORY_OK.

## Local evidence

- Worker: 39/39 tests, including encoded soft-tap spectrum and fixed routes.
- Browser: 444 scenes / 48 topic-preset-format journeys; history rewind/reset,
  wrong-row isolation and mobile keyboard checks pass.
- Seven locally rendered MP4s: 52.04–78.55 seconds, 417,921–653,228 bytes;
  AAC local taps, no voice/provider requests. Encoded final-step frames reviewed.
- Export lost-ACK/reload/retry and all three affected cabinet browser flows pass.
- Exact topic entry additionally verifies login continuity, six real trainer
  targets, zero automatic attempts, exact saved-draft resumption, invalid-link
  rejection and the separate angles activity without false cabinet progress.
- Always-visible guidance describes controls and answer formats; mathematical
  solution algorithms remain in the optional worked example or hint.
- Independent mathematical review: 7 sheets and 15 new preset examples pass.
- Legacy video authoring gate and `git diff --check` pass.
- The initial local teaching-browser launches used the wrong executable-path
  environment variable; reruns with their supported variable pass.

## Risks and rollback

Primary risks are crowded final video frames, confusing incorrect examples with
valid transformations, and browser caching of old MP4s. Check final frames and
backward jumps explicitly and revise fixed playback URLs. Roll back the scoped
static/media/renderer files together; no database or persistent volume changes.

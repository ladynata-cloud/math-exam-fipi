# Самостоятельная домашняя работа и обучающие видео

## Identity

- Owner: ladynata-cloud
- Date: 2026-10-04
- Base: `main`, `a024f6c0f22bd58077bb3e31c2911ba324abb1a8`
- Branch: `feature/self-study-silent-video` (name retained after the owner clarified audio)
- Review: HIGH; bounded extension of the implemented isolated video worker.
- Related documents: ADR 0002 (Proposed, not treated as accepted), ADR 0010
  (Accepted for existing accounts), `docs/unified-learning.md`.

## Goal and approved scope

The owner requested a methodology in which a learner enters their permanent
cabinet, completes homework with graduated hints and interactive steps, and
uses automatically produced explanatory videos. The latest clarification is
**automatic narration plus click sounds**, with on-screen explanations retained.

Implement a reusable Russian teaching guide and three authored pilot scenarios:
homework/help, linear equations, adjacent angles. Extend the fixed video task
allowlist and existing scene protocol to render these scenarios. Keep legacy
DVI tasks compatible. Offer voice, clicks-only and fully silent output; only
configured real providers can synthesize voice. Non-voice jobs do not reserve
paid speech characters. Add readable compact frames and a text/step equivalent.
Demonstrate the bounded rendering pipeline and report exactly which audio
providers were exercised.

## Boundaries

- No new pupil records or production learning-data writes.
- No changes to account/session, classroom, scoring or archived-reset contracts.
- No claim of complete offline cabinet support or complete yearly courses.
- No full textbook reproduction; examples are original and edition mapping for
  Makarychev remains pending.
- No new speech credentials, token extraction, unbounded user-submitted URLs,
  scripts, HTML or narration. Existing worker authentication, queue ownership,
  quotas, cancellation and persistence remain in place.
- No external messages, automatic parent reports, payments or tariff changes.
- Public screenshots supplied by the owner confirm an Amvera process running;
  they do not establish an end-to-end successful video render.

## Acceptance and gates

- [x] The guide specifies the learner cycle, hint ladder, paper work, teacher
  feedback, assisted versus independent outcomes and a two-week pilot.
- [x] All three pilot manifests and three presets have correct mathematics,
  visible focus, readable text and an unanswered follow-up task where relevant.
- [x] Existing request shapes and legacy task manifests remain compatible.
- [x] Voice requires a configured provider; clicks-only uses no external TTS;
  fully silent output contains no audio stream.
- [x] Screens and captions fit landscape and portrait; the step reader works
  on narrow screens and from a keyboard.
- [x] Real Chromium/FFmpeg output is probed and sampled visually; actual provider
  calls, mocked audio and no-speech outputs are clearly distinguished.
- [x] Worker tests, existing video authoring gate and focused browser/media gates
  pass, followed by independent review and `git diff --check`.

Final gate: `SELF_STUDY_VIDEO_GATE_OK` only after the above checks are recorded.

## Permissions and review

The current owner instruction authorizes implementation, a task branch, local
verification, commits, push and one Draft PR. This new worker change is separate
from the completed PR #184 publication. Publication is not inferred from that
release's exact-head authorization. Complete the reviewable result first; follow
the repository release policy for merging and deployment. No external-provider
review is invented. Sanitized reviews contain only repository code and synthetic
fixtures, never pupil data or credentials.

## Risk and rollback

Risks: subtitle overlap, incorrect verbalization of formulae, provider-dependent
pronunciation, unsupported audio configuration, and rendering CPU/disk use.
Restore previous worker/studio code while preserving all existing queue and
media files; do not delete the persistent volume. The guide does not promise
that stopping a renderer stops every hosting charge. Completed course media
must be retained independently of the worker's automatic retention cleanup.

## Execution

- Methodology: `docs/parallel-class-method.md`; operator instructions:
  `docs/self-study-video.md`. Three authored examples, each with three variants,
  share the existing scene protocol. These are illustrated teaching scenes,
  not recordings of real actions in a pupil cabinet.
- Worker suite: 36/36 PASS, independently repeated on Node 24.21.0. Actual
  FFmpeg fixtures distinguish silent, click and supplied synthetic voice audio;
  they do not establish natural narration quality.
- Legacy authoring gate: PASS, including actual legacy manifests and scoped
  click behavior. No gate weakened to accept the new school scenarios.
- Browser: 204 scene checks across three tasks, three presets and two formats;
  390px keyboard reader passes. The full browser check was repeated against
  all final sources on Node 24.21.0 after removing local machine path defaults.
- Three final MP4 files were rendered and visually sampled: homework-help
  83.438s / 863843 bytes; linear-equation 78.555s / 611591 bytes;
  adjacent-angles 66.153s / 536777 bytes. All have local clicks and silence,
  no spoken narration; external speech calls: zero.
- Browser export regression: accepted request, lost acknowledgement, reload,
  rejected token and retry with altered form still create exactly one job.
  The token is absent from storage, URLs and cookie authentication.
- Independent code/math/media review found no remaining blocking defect after
  correcting click markers, duplicate submission recovery and download naming.
  This is an independent agent review, not an external-provider review.
- Production narrator/provider, natural pronunciation, Amvera deployment and
  first-teacher activation: not verified. Operator browser observation is
  blocked by native-credential protection; no bypass was attempted.
- No merge/deployment performed for this task.
- Local final gate: `SELF_STUDY_VIDEO_GATE_OK`. CI is configured to repeat the
  contract and browser checks; its remote execution is reported in the PR.

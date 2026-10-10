# Soviet mathematics: child-readable revision and second batch

## Identity and goal

- Owner: Наталья Михайловна Алябьева.
- Date: 2026-10-10, UTC.
- Base: main, b0b2fe8e4d2cbf15426a9a314674bf7a2edce4f9.
- Branch: feat/soviet-math-batch-two.
- Review level: HIGH, because existing local progress must survive revised lessons.

The owner requested another 30 trainers and their videos, separate downloadable
videos and narration scripts, and then explicitly rejected the first release's
pedagogy: the lessons were not understandable to children. This scope therefore
includes a deliberate revision of the first 30, as well as the new 30. The later
revision request overrides the earlier byte-preservation requirement for those
specific recordings. Existing topic addresses remain stable.

## Approved scope

- Revise original lessons with coherent conditions, concrete mathematical
  models and meaningful questions; remove mechanical copying microsteps.
- Extend to 60 topics, with 12 distinct conditions for every new topic.
- A learn mode that reveals explanations without compulsory answer entry;
  practice still asks the learner to perform meaningful calculations.
- Continuous board: the main working stays visible, supporting calculations
  stay beside it, gentle helper zoom with reduced-motion support.
- Original exercises and drawings. Cite checked textbook authors, edition,
  section and pages as thematic sources; do not invent exercise numbers or
  imply verbatim reproduction or established public-domain status.
- Explicitly replace the first 30 silent MP4s; append the next 30 using stable
  names and a checked manifest. Timing follows the narration at a calm pace.
- Separate downloadable MP4 packages, voiceover text, time cues and subtitles.
- Preserve legacy generators for interpreting earlier attempts. Validate old
  local data before migration, retain every result and archive old active
  sessions, start revised examples at the beginning. Save schema version 2 so
  the old application safely refuses it if the site is rolled back.
- Exact mixed-number and denominator checks; navigation captions for 60 topics.

No account, authentication, server, hosting setting or shared division-core
changes. Synthetic tests contain no real learner data. The proposed platform
ADR remains advisory; this extends the deployed lesson and media pattern.

## Acceptance and review

- All 60 topic links and videos usable; original IDs, order and media URLs stable.
- Every mandatory question has a mathematical purpose; completed working stays.
- Independent arithmetic checks for legacy and revised plans, all 360 new
  examples, exact fraction formats and malformed input regression checks.
- Independent source and pedagogical review; inspect representative initial,
  intermediate and completed frames, including count, sharing and fractions.
- Browser coverage for all 60 topics, learn/practice separation, local migration,
  malformed/future state preservation, cross-tab conflicts, repeat accounting,
  mobile views and reduced motion. Actual Chrome playback/seeking of all videos.
- Final relevant gates and focused independent HIGH review of current code,
  explicit remaining risks and rollback behavior; no open P1/P2 before release.
- No claim of external provider review. The standing owner exception already
  recorded for the published course and arithmetic scaffolding remains in force.
- Final markers: SOVIET_MATH_EXTENSION_OK, SOVIET_MATH_OK,
  SOVIET_MATH_PRODUCTION_OK.

## Permission and release

The owner explicitly requested the revision and continuation. Standing cloud
execution/publication authorization applies, including the instruction to finish
while the owner is offline. Follow isolated branch, reviewed PR, exact-head
checks and production verification. User instructions take precedence over
repetitive local approval prompts. Recheck authoritative main before release;
if it changed, inspect and test the composed result and preserve concurrent work.
Do not force, reset, rebase, bypass protections or weaken checks.

## Risk and rollback

Risks include arithmetic or explanation errors, premature answers, misleading
source attribution, overflowing models, stale videos and saved attempts resuming
at a different action. Independent oracles, human-style pedagogical/frame review,
content/narration hashes and revision-aware migration address them. These checks
are not evidence of learning outcomes with actual children.

A normal scoped revert restores the previous course and videos. The previous
reader rejects version-2 data and leaves its bytes untouched, allowing lessons
without saving; restoring the updated reader recovers results. Old attempts are
retained in previousSessions and records retain their content revision. No
storage keys are deleted. Do not claim that rollback transparently continues
new attempts in the old course.

## Execution record

Base production evidence is PR #237. The final exact head, independent reviews,
checks, merge and live verification are recorded in this task's PR description.
Copyright status of specific textbook editions has not been established; the
implementation uses independently authored conditions and drawings.

Concurrent main advanced to a51f188b74ccd781622e3e94b3a419f895ca9c73
through the owner's SEO PR #238. A read-only merge-tree identified overlapping
minified HTML and project-status records. The composed result preserves all SEO
metadata, the OGE featured card, the 513-URL sitemap and topic pages, and layers
only the reviewed 60-lesson changes on those files. No force/reset/rebase was
used. The owner’s standing publication scope covers this routine integration.

All 60 actual silent H264 recordings total 3,270 seconds (54:30). Media hashes,
content/narration signatures and 180 extracted beginning/middle/final frames
were checked, with additional full-size critical transitions. Independent
review found no open P1/P2; minor P3 findings are a few pixels of helper text
clipping at maximum zoom and two fraction-strip labels touching their strips.
Arithmetic, source attribution and accumulated working remain readable.

Local content, extension, division, 60-topic browser, migration/rollback and
media gates passed. The composed SEO suite passed six sitemap tests, checked
513 public canonical URLs and 30 distinct entrance metadata records. Actual
Chrome decode/seek/play verification remains an exact-head CI release gate.

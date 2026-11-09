# Сечения: видимый путь и самостоятельное исправление

## Identity and approved scope

- Task: `SECTIONS_LEARNING_PROGRESS_20261109`, 9 November 2026.
- Owner request: continue the proposed first improvement package for sections.
- Branch: `task/sections-learning-progress`.
- Base: `task/sections-from-zero`, `6cdfb184b9d5b616c2bd7ee3e1ced8e952d25998` (Draft PR #474).
- Review level: HIGH because personal progress persistence and shared rendering are touched.

Make the existing 26-stage route visible and provide an exact continuation and
specific next activity. Separate errors corrected by the learner from actually
opened assistance. Preserve all 186 cards, 967 construction steps, 81 calculation
steps, IDs, storage keys, mathematical models and existing room isolation.

The baseline contains the route and introductory scaffolds already. Its overview
is collapsed; readiness marks are self-assessment. Errors in plane/reason/final
choices set the same flag as opening help. These are the bounded changes here.
No new freehand evaluator, automatic proof grading, server storage, assignment,
room protocol, authentication, mathematical bank or unrelated course changes.

Owner follow-up: add short visual demonstrations of starting, resuming and
obtaining a section. Extend this same UX package with three optional, controllable
animations on the map. They show existing control labels and a separate exact
cube/triangle example, never an answer or action in the current learner's card.
Keep a static initial frame, manual frames, pause/replay, text alternatives,
reduced-motion support and keyboard dialog controls. No progress or storage
changes from watching. Include the demonstrations in the self-contained edition.

## Acceptance and checks

- The complete route is visible, responsive and keyboard accessible; current
  stage, recorded work and manual self-assessment remain distinguishable.
- Resume retains the precise card and work. Recommendations never treat viewed
  solutions or manual readiness as independent achievement.
- New personal attempts retain separate error evidence across reload. A wrong
  answer alone does not mark help; actual explanations/hints still do.
- Old unversioned results remain unclassified, and previously recorded help is
  never removed by retrying or upgrading the course.
- Shared work retains its exact schema, validation and local-storage isolation.
- Demonstrations leave the card, camera, draft, storage and hash unchanged;
  closing or hiding the page stops playback. Check keyboard operation and 320px
  layout, and independently verify the demonstration's section geometry.
- Required: `node --test tools/sections-*.test.cjs`, independent course Python
  tests, deterministic offline build, syntax and whitespace checks; focused
  browser checks at 320/1280 and independent technical/learning review.
- Existing CI retains the two-participant shared-board journey; local DOM
  assertions do not claim a real-browser collaboration pass.

## Review, risk and rollback

Independent review must examine evidence classification, stale records, resume,
help disclosures and the unchanged shared-state boundary. External provider
review was not requested and is not required by the standing owner policy.
Main risks are overstating progress, losing saved work and changing room state.
Rollback is a normal revert of this scoped change and regeneration of the offline
edition. No data deletion or database migration; older versions ignore new
personal-only evidence fields. Do not clear learners' storage.

## Permission and release boundary

The current owner continuation authorizes implementation, tests, commits, push
and a Draft PR. This is a stacked improvement on the unpublished course, so it
does not publish or merge PR #474 into main. The previously explicit hold on that
course release remains in force. No pupil assignments or production data change.
The new PR targets `task/sections-from-zero`, preserving the separate reviewable
delta and the original release decision.

## Execution record

Results, reviewed head and actual CI are recorded in the PR after execution.
An unperformed visual or real-pupil check must not be reported as passed.

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
## Earlier continuation, 9 November 2026 (superseded release boundary)

EXECUTIVE STATUS

Task: SECTIONS_LEARNING_PROGRESS_20261109
PR: #504, still based on sections-from-zero; local correction not uploaded
Base: existing PR head b9c60769
Head: local follow-up to b9c60769
Gate: 52 local tests PASS; corrected browser scenario requires CI
Tests: sections course/navigation/progress/tour suites 52/52; all 186 cards rendered in DOM; generated offline/data files current; syntax and diff checks PASS
Failures: prior CI selected both the active model and the retained tour SVG
Not run: corrected real-browser CI, publication, pupil trial, external review
Scope deviations: none; only test selectors and this record changed
Recommendation: upload correction to existing PR, run full browser/shared-board gate; preserve dependency on #474
Next user decision: explicit upload/release permission requested by automatic approval review

The browser gate now scopes camera operations, layout measurements and topology
snapshots to .course-main .model-svg and asserts one active learner model.
Existing camera/state equality, topology, viewport and board assertions remain.
The separate tour remains covered by its six dedicated interaction tests.
This does not remove either SVG or change the mathematical runtime.


## Authorized release continuation, 9 November 2026

The owner explicitly authorized sending the prepared changes to
ladynata-cloud/math-exam-fipi, merging verified PRs and publishing on
mathexam.space after successful checks. This supersedes the previous upload
and publication hold. Root release coordination owns merge/deployment; real
pupil assignments are outside this scope.

The stacked candidate includes the actual uploaded #474 head
9c31b4b57b2b47a058a99dbb122220cc7ab586fb. The navigator receipt uses the
remote source checkpoint 2a45b687d6212e5313ccbd102d8906846b0e5bc4; only the
obsolete local source identity conflicted, and the uploaded receipt is retained
without changing its coverage. All course/progress/tour implementation blobs
and the scoped browser correction are preserved from the tested continuation.

The original 52 local checks passed before composition. Deterministic build,
independent geometry and source identity checks passed after composition.
Actual-head CI, including real browser and two-participant shared-board
scenarios, is mandatory before release. Historical CI is not a current pass.


## Final dependency composition, 9 November 2026

The final stacked base is actual #474 head
655376985f35ae0f872926d781313b819051a162, which preserves the reviewed OGE,
textbook and publication predecessor chain. The navigator receipt is identical
to that base and binds its unchanged HTML to actual remote source
5ef21975c189f3bd5cb7d1ce5d5475462ebe106e. This merge has no content conflicts.
All nine runtime/test blobs remain identical to previous actual #504 head
4011caaf4ec759c124dede8bd9b95040138adade; only this execution record changes.

Previous profile run 42608170497 passed course-and-shared-room, including
independent mathematics, retained work, server tests and the real two-participant
browser journey. The active-model selector correction is thereby exercised in
a real browser. All 12 screenshots at 320/1280 were reviewed; its six common
course/board/return screenshots exactly match the passing #474 evidence.
Artifact 13670422966, ZIP SHA-256
9ff0e61739676d220d0783b9cd1ac4be76b71f91f766da69a3f2053526d52eb3.
Final composed actual-head CI is still mandatory; previous profile evidence
does not claim completion of any remaining or final workflow.

Root release coordination owns dependency merge, retarget-to-main guards and
publication. Live pupil records, assignments and rooms are not changed here.

# ЕГЭ база: общий учебный маршрут и видимый прогресс

## Identity and permission

- Task: EGE_BASE_LEARNING_PATH_20261109
- Owner: MathExam owner; current request «займись пожалуйста этим улучшением».
- Date: 2026-11-09, Asia/Novosibirsk.
- Base: main / ee7c501abc2f293d923d892a4b3dcc5ac4b798f7.
- Branch: feat/ege-base-learning-path-20261109.
- Review: HIGH, because the common learning navigation interprets several existing progress formats. The adapter is read-only and adds no persistence format.
- START, branch, commit, push, Draft PR and release: authorized by the current request and [standing owner policy](../OWNER_RELEASE_AUTHORIZATION.md).

## Goal and verified context

Give a learner one visible route through all seven basic-EGE lines, a truthful view of their existing results, and a next learning step. The current root progress page covers two early modules; the 111-family path has a separate report. Current task-first lessons preserve drafts and distinguish first-attempt independent solutions from assisted/corrected solutions. These contracts must survive the navigation change.

Production was inspected before implementation: the seven-module map, module-specific progress and standalone box lesson were available; the box lesson displayed an unrelated OGE return bar and its large figure pushed answer controls below the desktop viewport. Current repository and production observations agree for these routes. Historical PROJECT_STATUS entries are not treated as current release holds for this new task.

## Approved scope

- Read-only aggregation of the two legacy module stores and the standalone path store.
- Seven learning lines, all 111 real EGE families, preserved early lessons/checks, line and total views, and honest unavailable-state handling.
- Resume an unfinished check/task without generating new numbers or erasing drafts; explicit next-topic navigation within the line.
- Keep assisted practice, independent success and legacy checkpoint evidence separate. A percentage represents types with an independent solution, never exam readiness or proof of full mastery.
- Correct the standalone EGE return navigation and compact the task/figure/answer layout.
- Focused regression coverage and existing applicable CI; scoped status reconciliation.

Out of scope: generators, answer keys, new lesson content, adaptive diagnosis, a new spaced-repetition scheduler, server/cabinet synchronization, board protocols, new storage formats, external course copying. Existing repetition is surfaced, not represented as newly implemented for all 111 families.

## Acceptance

- The six subject lines contain every current EGE family exactly once (111 total); line seven contains checks, without duplicating that denominator.
- Previous m01/m02 results remain visible but are not converted into achievements for unrelated path families.
- Reading any new route never writes or migrates a progress store. Damaged or blocked data are described as unavailable.
- Main action prioritizes unfinished checks, then meaningful unfinished work; it does not claim a last-activity timestamp absent from the source.
- Line choice, result states and continuation work at narrow and desktop widths with keyboard navigation.
- Autonomous next-topic controls do not appear in managed or shared-board tasks.
- Existing conditions, answers, hints, drafts, seeds and independent-credit rules stay intact.

## Checks, review and rollback

- New journey state/catalog and DOM regression tests; existing navigator, backup, task-first, equation and board contracts; git diff --check.
- Browser checks through the supported preview: 320 and desktop layout, course/line navigation, real task and return path; applicable repository CI provides additional real-browser regressions.
- Independent design review: read-only projection, no mixed mastery denominator, preserve unknown states, and an opt-in standalone navigation boundary. Independent ready-result review required before release.
- No external provider review or real-pupil learning-effect study claimed.
- Main risk: interpreting older results too optimistically or offering a wrong continuation link. Mitigation: separate sources, conservative validation and tests with mixed/corrupt records.
- Compatibility boundary: the lightweight home loads EGE metadata only. Valid shared saves containing lessons of other grades keep readable EGE history, but automatic exact continuation is withheld when full-store compatibility cannot be established; manual lesson entry remains available. This is not data loss or an invented zero result.
- Rollback: an ordinary revert of this task's commit restores navigation. No data migration or deletion is introduced, so existing result stores survive rollback.
- Gate: EGE_BASE_LEARNING_PATH_OK only after applicable checks pass.

## Execution record

PR #496 records exact release refs and results. The initial tree passed 16 unit tests, 293 actual-script DOM checks and the existing task-first, board, backup, reference, equation and stereometry contracts. Independent review reproduced and verified the fixes for an edited successful draft and a malformed sibling in a saved document.

Initial CI passed all three viewport layout loops (320/390/1280); its new keyboard-route test then exposed an incorrect URL matcher, corrected to inspect the exact hash. Existing public-navigation gates also identified the expected page-payload rebind and the historical misclassification of the EGE path as an OGE route. The reviewed route now retains explicit parent, home, keyboard, touch and no-JavaScript coverage for its correct EGE parent; the navigator pair and all unrelated source payloads remain preserved.

Final base/head, CI, failed/not-run checks, deployment and live observations are recorded in the PR handoff. Exact remote main/head are rechecked immediately before merge; any drift requires a newly reviewed composition. No browser or CI failure is waived merely because its assertion needs to reflect the intended new route.

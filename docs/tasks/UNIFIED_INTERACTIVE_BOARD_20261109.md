# Единая интерактивная доска MathExam — первый этап

## Identity

- Task: UNIFIED_INTERACTIVE_BOARD_20261109
- Owner: MathExam
- Date: 2026-11-09 (Asia/Novosibirsk)
- Base branch: main
- Base SHA: 89ee66bfe5068f16364d61d091fcbf1a1cbd6287
- Branch: feat/unified-interactive-board
- Review level: NEW_ARCHETYPE (geometry material in the accepted group architecture)
- Existing architecture: [ADR 0009](../adr/0009-group-lessons.md), Accepted.
- Accepted integrated extension: [ADR 0015](../adr/0015-unified-interactive-board.md).

## Goal and approved scope

Owner: «интерактивную доску, в которой будет и вкладка с нашей фирменной
геогеброй, и возможность вставить тренажер, и возможность действовать как на
обычно доске. для работы учителя с учеником или с группой учеников. приступай к
разработке».

Extend the existing group board for 1–8 learners, not a new parallel service.
Reuse SpaceMath from PR #481 (`fc9be3ca770e83dd6c17bbad8498435a282c939c`), including
its local JSXGraph assets, canonical model and existing bridge. This is the
MathExam construction editor; it is not the GeoGebra engine and does not claim
GGB compatibility, CAS, 3D or unrestricted mathematical commands.

In scope: independent handwriting, geometry and trainer surfaces, optional
trainer+board split, teacher/pupil control, explicit presentation, persistence,
history, late entry, model validation, numerical/editor fixes and regressions.
The initial group catalog retains the two proven trainer adapters. Arbitrary
URLs, a broad catalog migration, accounts/cabinets and deployment credentials
are outside this first stage. Ordinary board initially retains the existing
pen, color, width, authored eraser and undo; text, images, PDF and multi-page
editing are not claimed as added here.

Current owner continuation: «сделай сначала и доску», «Будешь доску делать?»,
«постарайся чтобы наша геогебра максимально обладала всеми необходимыми
функциями которые есть у обычной геогебры», and «чтобы ученик и учитель могли
видеть одно и то же». This adds bounded school construction/measurement tools,
safe function graphs with serialized parameters and a shared logical viewport.
It does not claim full GeoGebra parity. The future AI assistant remains outside
implementation: no provider calls, training or API spending in this task.

## Acceptance

- Material switches never reassign the exercise or erase another material.
- Inserting a trainer preserves handwriting and geometry, including delayed
  writes to their stable material identities; trainer stale writes still fail.
- Teacher and learner can write authored strokes; geometry has one explicit
  controller per workspace, independent of trainer control.
- Other pupils see only their own work and explicitly presented readonly work.
- Model recovery, late join, server restart and bounded history remain intact.
- New UI checks server capabilities before opening/creating sessions.
- Exact coordinates survive rename and unrelated coordinate edits; rounded
  measurements use approximate equality; an altitude is a segment in the example.
- 320/1280 layouts and separate teacher/pupil browsers are checked by the CI gate.
- New constructions, graph formulas, sliders and viewport survive the same
  server validation, round-trip, handoff and restore as existing objects.
- Formula input never executes JavaScript; undefined domains do not produce
  misleading connecting lines. Mathematical and resource limits have tests.

## Checks and review

Required: full board-server test suite, existing group browser suite, new unified
board browser suite, SpaceMath model/assets/editor regressions, bridge DOM tests,
syntax and git diff --check. Independent technical review covers authorization,
persistence, queue races and state isolation. External-provider review not run
under the standing owner waiver. Record actual results in the PR.

## Permissions and release boundary

The current direct owner requests authorize this integrated board and its
synchronized SpaceMath tools. The standing owner release authorization applies
after all relevant checks, subject to the latest pause below. This supersedes the earlier integration hold in
this task; it does not authorize merging the broader standalone PR #481.
Remaining browser failures and incomplete acceptance still block release.
No real learner data is read or modified for tests.

**Latest owner decision: publication paused.** «не торопись публиковать.
давай проверим доску на твоих разных моделях». Keep PR #519 as a review
candidate; do not merge or deploy. Finish the implementation and run independent
reviews with different named models, consolidate reproducible findings, fix
confirmed defects, and present the evidence for the owner's next decision.

## Risks and rollback

Backend must be deployed before the new UI. Capabilities fail closed on older
servers. New journal events require the upgraded reader: after any geometry or
insert write, rollback must retain this reader. Rolling back only the UI is
safe for stored data; do not deploy an old backend against new journals, erase
journals or silently downgrade them. Snapshot backups before a future rollout
and retain original files for any deliberate migration.

## Historical execution record (before PR #519)

- Implemented source commit: 4decb79b88c1c97ef2a60a98de536ae13e486843.
- Focused backend: 29/29 passed, independently repeated after the stable-material
  identity fix.
- Geometry/model/assets/editor/frame: 23/23 passed in a final combined run.
- Syntax and diff whitespace checks passed. Independent internal technical
  review found no remaining blocker in the inspected source.
- Full backend suite: started, logged 367 passes and no failure, but did not
  complete; stopped with exit 130. It is NOT recorded as a successful full gate.
- Browser acceptance: scripts prepared but not run. Managed preview was already
  occupied by another task; that preview was left intact. No UI screenshot or
  remote CI success is claimed.
- Push was blocked twice by automatic approval review. Even after owner/repo
  identity and historical permissions were verified, review stated it lacked
  trusted end-user authorization to publish this branch to GitHub. No alternate
  write route was used. PR, merge and deployment were not performed.
- Current deliverable is a local committed candidate plus a review archive.

```text
EXECUTIVE STATUS
Task: UNIFIED_INTERACTIVE_BOARD_20261109
PR: not created; push blocked by automatic approval review
Base: 89ee66bfe5068f16364d61d091fcbf1a1cbd6287
Head: implementation 4decb79b88c1c97ef2a60a98de536ae13e486843; subsequent report-only commit
Gate: focused local checks passed; full release gate incomplete
Tests: 29 backend + 23 geometry/editor/bridge = 52 passed
Failures: no focused failures; full backend run interrupted without completion
Not run: browser suites, CI, production acceptance, external review, real-pupil pilot
Scope deviations: none; first trainer catalog explicitly limited to two adapters
Recommendation: authorize branch push, run browser/CI gates, retain SpaceMath release hold
Next user decision: explicit branch push and Draft PR permission requested due auto-review block
```

## Authorized handoff continuation

After the blocked handoff report, the owner explicitly answered «разрешаю» to:
«Разрешаете отправить подготовленную ветку в ladynata-cloud/math-exam-fipi и
открыть черновик PR?». This authorizes branch submission and a Draft PR; it does
not claim browser/CI acceptance or lift the separate SpaceMath rollout hold.
The blocked-push entries above are historical. Actual remote commit and PR
identity are recorded in the resulting PR, whose source tree must equal this
local candidate. Git CLI has no credentials in this executor, so submission
uses the authenticated GitHub connector.

## Current continuation — 9 November UTC / 10 November Novosibirsk

- PR: https://github.com/ladynata-cloud/math-exam-fipi/pull/519 (Draft).
- Validated base advanced by clean ordinary merge to
  `833856e60fcdc3f82715d85a222581a0e21656f2`.
- Remote candidate `aac9407ed9c3e20f62909a6e7071720371700ab7` fixed the isolated
  server test fixture to copy the real SpaceMath model, matching the existing
  Dockerfile. Local and remote full server suite: **425/425 passed**;
  model/editor/bridge suite: **23/23 passed**.
- Remote eight-learner browser suite then exposed a handwriting timeout;
  its pointer helper is being corrected to use the actually visible canvas
  region in the nested split workspace. Persisted-stroke assertions remain.
- Manual browser checks in a synthetic local room verified pupil handwriting,
  teacher annotation, geometry observation/control/coordinate synchronization,
  trainer insertion without losing ink, a correct trainer answer mirrored to
  the teacher, and pupil reload. These are not production acceptance or a
  substitute for the remaining automated browser gate.
- Wider SpaceMath tools implemented and independently reviewed using three
  different configured models; see the [review record](../reports/unified-board-multimodel-review-20261109.md).
  Full server checks: 426/426; final model/editor/bridge checks: 65/65.
  Full automated browser gate remains pending on the updated Draft candidate.
- No merge or production deployment has been performed in this continuation.

## Independent browser acceptance — 10 November Novosibirsk

- The owner's current instruction explicitly prohibits merging or deploying
  until a separate release decision. PR #519 stays Draft; the automatic board
  release task is paused. This supersedes any earlier publication permission
  for this task.
- Synthetic teacher + two-pupil manual acceptance covered ink, constructions,
  graph parameters, trainer completion, control, observers, history, recovery,
  concurrent independent work, and 320×900 / 1280×900 layouts.
- Two real notification defects were fixed: stale read-failure warnings after
  reconnect, and loss of rejected-work warnings after another write or reload.
  Regression coverage was expanded without weakening existing assertions.
- Runtime head: `ab4f1cf7d1bcfd120f65b633b9afc3c3894337a3`.
  Final [board CI](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/42705061495)
  passed 426 server checks, 65 model/editor/bridge checks, the eight-pupil suite,
  and the three-context unified-board suite including concurrent ink.
- CI used merge-ref `9aee5a557ed6febb0a6bd73f2b27df3f15311585` against
  `c8a4f1fc61dd07038e30764f8cedf0725b767539`; reviewed runtime blobs match.
  Local manual testing used the earlier base `833856e6`.
- [Acceptance report and screenshots](../reports/unified-board-browser-acceptance-20261110.md)
  distinguish product defects from the local Chromium restriction and preview
  interruption. Mobile scrolling, SpaceMath feature gaps, physical devices,
  load testing and production acceptance are explicitly bounded.
- Recommendation: functionally accepted for owner review and a controlled
  pilot, not an authorization to publish. No real pupil data was used.

# Peterson course and practice line: cabinet entry and on-demand help

## Identity

- Date: 2026-10-28 (Asia/Novosibirsk)
- Base: `main`, `fa8d1b7ced31a5941ad52d8a21a48b63daaa84a8`
- Branch: `feat/maxim-peterson-cabinet-helper`
- Review level: `MEDIUM`

## Goal and approved scope

The owner requested the existing Peterson course and yesterday's practice line
in the pupil's cabinet, with an assistant in the bottom-right corner that helps
only when asked. The existing public materials are `/school/peterson6/` and
`/trainers/maxim-peterson6/`. This task does not include the separate unpublished
complete-textbook expansion.

- Recognize the two canonical course URLs in the existing teacher focus field
  and present two primary course cards, following the attached-course pattern.
- Open student course views in an isolated public-origin frame without account
  identifiers, credentials, or privileged API access. Teacher previews show
  material links and do not modify student work.
- Add a closed-by-default bottom-right helper to both existing course engines.
  It uses the current task's existing condition, hints and explanation steps,
  retains requested explanations and marks help using existing course logic
  before displaying it. Switching tasks clears stale task context.
- Preserve the existing mathematical tasks, learning sequence, board behavior,
  local progress, exports and grading distinctions.

This is a source-based course helper, not external model inference. No new
assistant-service profile, server API, pupil-data transfer, paid model request,
credential, account identifier or storage migration is included. Existing
browser-local course results remain distinct from cabinet server history.

## Evidence and project reconciliation

Current main includes the published cabinet/assistant foundation (#358) and
published practice line (#362). Older PROJECT_STATUS preparation entries are
historical; their unmerged statements do not describe this checkout. Production
teacher UI showed the existing course in the pupil's plan and an inactive
assistant. The current general Peterson assistant profile covers decimals only;
the task-level helper instead reuses exact hints from both published courses.

## Acceptance and checks

- Two intended materials appear only when explicitly paired in the profile.
- No interactive teacher preview, secret-bearing frame URL, privileged origin
  sharing or unsolicited help requests.
- Launcher is bottom-right, starts closed, closes with Escape and returns focus;
  the panel fits desktop and narrow screens.
- Current-task help marks assistance before revealing existing source content.
- Course/task navigation cannot show another task's previous answer.
- Existing course, state, board, attached-course and assistant tests remain valid.
- Run focused regression checks, independent code review, visual desktop/mobile
  checks and `git diff --check`; report missing checks explicitly.
- Gate: `PETERSON_CABINET_HELPER_PASS` only after required checks pass.

## Review, risk and rollback

Bounded frontend integration within the existing isolated-frame and attached
course architecture; no new mathematics or learning-sequence redesign. A new
trainer design consultation does not apply. Focused independent code review and
regression tests are required; external review is not required at MEDIUM.

Risks are stale context, unintended assistance credit, narrow-screen overlap and
frame/preview regressions. Revert this task's code and remove the paired focus
URLs to restore the prior presentation. Existing saved course progress and
cabinet records are retained.

## Permissions

The owner's direct instruction authorizes implementation, validation, task
branch, logical commit, push and Draft PR. Merge, auto-merge and deployment have
not been authorized separately and remain unperformed.

## Execution record

- Implemented the paired primary course cards, isolated student frames and
  floating source helper. Teacher preview remains links-only. Frame dimensions
  follow the actual cabinet header/navigation; sandbox confirmation dialogs are
  allowed so the existing backup-restore workflow still works.
- Passed 57 focused DOM, saved-state, source-boundary and board-contract tests.
- Passed 63 actual-browser helper checks and ten cabinet-frame journeys at
  desktop/mobile sizes. Six direct-course and four cabinet screenshots were
  inspected; they contain synthetic accounts only.
- Passed Peterson content (224 tasks / 333 steps), exact arithmetic (6,000
  generated tasks / 18,000 steps), model, state and UI checks; Maxim's full
  mathematics/progress regression; unchanged wrapper/runtime parity.
- Passed existing real-browser school navigation and Peterson shared-board
  journeys, including mobile, drafts, assistance, reload, detours and control.
- Syntax checks and `git diff --check` passed. Initial local browser launch
  attempts used an incompatible installed browser; rerunning with the matching
  installed Playwright/headless browser completed successfully. No test or
  application security gate was weakened.
- Added CI for focused regression tests and screenshot-producing browser tests.
  Exact committed head, PR URL and remote CI results are recorded in the PR.
- Independent internal review found no remaining blockers after the backup
  confirmation and mobile-layout fixes; it independently ran the six paired
  DOM tests and inspected desktop/mobile screenshots. This is not an external
  release verdict or merge authorization.
- Live account configuration was not saved: the previously authenticated
  teacher session ended during inspection. The existing course and progress
  were not changed. After authorized release and renewed teacher sign-in, add
  both canonical URLs to the intended pupil's existing focus, preserving its
  previous text. No personal account identifiers are committed.

## Handoff

```text
EXECUTIVE STATUS
Task: Peterson cabinet pair and on-demand source helper
PR: See current task branch pull request
Base: fa8d1b7ced31a5941ad52d8a21a48b63daaa84a8
Head: Exact commit recorded in the PR
Gate: PETERSON_CABINET_HELPER_PASS (local checks)
Tests: Source, DOM, mathematics, browser, cabinet frames and shared board passed
Failures: No remaining failing local checks
Not run: Production release and authenticated pupil activation
Scope deviations: None; helper uses existing task sources, no external model
Recommendation: Review the PR, authorize release, then verify real account setup
Next user decision: Separate merge/deployment authorization and teacher sign-in
```

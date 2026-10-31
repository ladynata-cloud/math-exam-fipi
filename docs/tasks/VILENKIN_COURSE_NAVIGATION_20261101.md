# Vilenkin grade-six course navigation and visible help

## Identity

- Task: `VILENKIN_COURSE_NAVIGATION_20261101`.
- Owner: MathExam project owner.
- Date: 2026-11-01, Asia/Novosibirsk.
- Base branch: `main`.
- Original preparation base: `a8eb6b26c917c337a3f9672c0b8eb40243f6e6a3`.
- Authorized dependency integration base:
  `37718f1c0138ba031314b8f4716b73c9d963bc81` (PR391 squash merge).
- Planned branch: `fix/vilenkin-course-navigation-20261101`.
- Review level: **MEDIUM** for bounded presentation/navigation within existing
  course, help and saved-work contracts.
- No architectural decision is introduced. ADR0001 remains Proposed.

## Goal

Make the grade-six textbook cabinet visibly function as a course: a clear
starting/continuation action, readable topic cards, explicit task buttons and
a helper launcher consistently available at the bottom right. Preserve the
existing learning material and every saved task identity.

## Context and evidence

- The owner's current direct instruction is to redo the text-like catalog and
  put the helper in the bottom-right corner. This continues the cabinet work;
  it is explicit implementation authorization, not merge authorization.
- The supplied screenshots show the existing catalog and task 2.134, part в.
  They are not copied into this repository; all new evidence uses synthetic
  accounts and records.
- `learning/vilenkin6-textbook-course.js` uses the generic `.catalog-items`
  presentation, whose CSS removes the visible button background and border.
- `mountCabinetAssistant()` excludes the `vilenkin-textbook` route. The actual
  task helper already has a fixed dock and a server-confirmed help contract.
- PR378 is merged as `7547ea565871e09ee02b632761f27bc088bd5c8a`.
- Original navigation preparation excluded PR389 and PR391. The owner later
  explicitly authorized ordinary integration of the released PR391 dependency
  into this same task branch, after its coordinated publication is confirmed.
- [PR391](https://github.com/ladynata-cloud/math-exam-fipi/pull/391) was
  squash-merged as `37718f1c0138ba031314b8f4716b73c9d963bc81`, sole parent
  `a8eb6b26c917c337a3f9672c0b8eb40243f6e6a3`. Its tree equals reviewed head
  `7a4c049c3c58827774921e51d47b82bdd20219b8`. Confirmed publication and the
  authorized integration are recorded in the task report.
- PR389 (additional multi-number LCM tasks) remains separate and excluded.

## Approved scope

### In scope

- Responsive course overview, explicit start/resume and task buttons, readable
  topic hierarchy and truthful progress drawn from the existing `/progress`.
- Preserve original task/source captions while reducing repeated text.
- Local navigation help on the course page and existing mathematical help
  inside saved tasks, using one bottom-right launcher with accessible controls.
- Restore the managed task’s “Все темы” link to the cabinet catalogue using
  the existing bridge navigation event and save guard.
- Provide a real cabinet-owned “Все темы курса” link above the task for
  teachers and read-only/history views as well as pupils. Keep the existing
  frame mutation guards, saved-work identities and pending/rejected-save
  protection; browsing the catalogue creates no work and transfers no control.
- Expose the existing LCM practice trainer beside fraction-task controls,
  explicitly labelled as a separate example, with existing help provenance.
- Focused DOM/browser regression, visual review, task/report/status documents
  and resource cache version updates.
- After confirmed coordinated publication of PR391, integrate the named main
  commit into this existing branch by an ordinary merge preserving both
  histories. Carry the reviewed dependency files unchanged; reconcile the
  `docs/PROJECT_STATUS.md` conflict and update this task and its report.
- Verify the resulting patch against the integrated base and rerun the
  applicable source, geometry, helper and navigation gates, followed by CI on
  the resulting exact head. Keep PR392 Draft until the release gate is complete.

### Out of scope

- New edits to course JSON, source hashes, task IDs, answers, grades, storage
  contracts, authentication, personal learner records or external model
  activation. The only dependency intake is the unchanged, separately reviewed
  and released PR391 patch; it does not authorize a further source revision.
- PR389 integration or publication, changes to other pupils' courses, and
  integration of unrelated concurrent main commits.
- Merge of PR392 into main, auto-merge or deployment under this preparation
  authorization; each requires the separate release decision below.
- A new mathematical learning engine or changed authoritative step sequence.

## Acceptance criteria

- [x] Initial course view clearly offers Start/Continue and a topic selector.
- [x] Every task has a visually distinct action with its original identity.
- [x] Resuming uses the saved attempt; browsing/help navigation creates none.
- [x] Progress failures keep creation disabled and offer retry.
- [x] The helper is visible at the bottom right on course and task pages.
- [x] Navigation help cannot reveal or record mathematical help for an
  unselected task; real task help keeps its existing guards and provenance.
- [x] 320/390/1280 px views fit, keyboard controls work, panels can close and
  focused/last-page actions remain reachable above the dock.
- [x] Existing task source data, legacy modules and saved identities are exact.
- [x] Catalogue return remains available outside the protected frame in
  teacher and history views, without changing the saved attempt or controller.
- [x] PR391 coordinated publication is confirmed for public/cabinet course and
  the matching running assistant package before branch integration.
- [x] The authorized ordinary integration is complete, the status conflict is
  reconciled, and all non-document dependency files retain reviewed bytes.
- [ ] Applicable composed checks and exact-head CI pass; failures and unrun
  checks remain explicit in the report and PR.

## Checks and gates

- Existing textbook catalog DOM, source-help DOM and relevant browser suites.
- Focused two-origin browser journeys with real isolated SQLite and synthetic
  accounts: course navigation, start, resume, helper placement and task help.
- Source/catalog integrity, JavaScript syntax, `git diff --check`.
- Manual inspection of actual desktop/mobile screenshots.
- Final gate: `VILENKIN_COURSE_NAVIGATION_OK`.
- No real student account or physical-device trial is claimed.
- Dependency integration also requires the existing Atanasyan and Ichenskaya
  source/generator checks, their relevant geometry and helper boundary suites,
  and actual browser navigation/helper regressions. Prior-head and virtual
  results are historical evidence, not a pass for the eventual integrated head.

## Review plan

- Independent focused review of navigation, preservation and helper guards.
- Trainer design consultation: not required for the bounded navigation and
  visual affordance changes; the learning sequence and task engine are fixed.
  Any newly proposed mathematical mechanism must be assessed separately.
- External review: not required for this MEDIUM presentation scope. The
  task-specific exception for PR389 is not claimed here.
- Handoff includes only public code and synthetic evidence, no private data,
  credentials or machine-specific absolute paths.

## Risk and rollback

- Risks: duplicate attempts from two entry buttons, wrong resume target,
  hidden/offscreen actions, stale helper after account/route change.
- Shared open-action lock, saved progress checks, current-view guards and
  actual browser journeys address these risks.
- Rollback of a later PR392 release reverts its navigation/presentation delta
  against the integrated base. Retain the separately released PR391 course and
  assistant package pair. No database migration or saved-work deletion is
  involved; the PR391 rollback procedure remains a separate release matter.

## Permissions

- Implementation: explicitly requested by the owner in the current conversation
  ("переделай" and bottom-right helper instruction); no copied approval used.
- Task branch, local commits, push and Draft PR: within that implementation work.
- The owner's direct continuation approval permits the ordinary main-to-task
  merge and bounded documentation reconciliation after PR391 publication.
  This records the current conversation decision; it is not external review.
- Merge of PR392 into main, auto-merge and its deployment: **not authorized**.
  Present the resulting exact base/head and gates for a separate owner decision.

## Execution record

- Actual branch: `fix/vilenkin-course-navigation-20261101`.
- Original base: `a8eb6b26c917c337a3f9672c0b8eb40243f6e6a3`.
- Reviewed navigation head before integration:
  `97338833c9c92b164e73433c097464530507bd60`.
- Integration base: `37718f1c0138ba031314b8f4716b73c9d963bc81`.
- Resulting integration head: recorded in the existing PR392 publication record to avoid a self-referential SHA in this commit.
- Dependency publication confirmation: Amvera package `69afae86d08c0e6c3041a29646e1845704951f43` has a successful build, is marked used, and is running with one replica; its sole changed knowledge snapshot is 448638 bytes with SHA256 `755cd5c4593594f296cb1a7e03af5ad29ba5413104561522901918f31c418013`.
- Local candidate checks and preservation are recorded in the task report.
  The exact published head, fresh CI and remaining release findings are
  recorded in the existing PR392 publication record.

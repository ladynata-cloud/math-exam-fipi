# Vilenkin grade-six course navigation and visible help

## Identity

- Task: `VILENKIN_COURSE_NAVIGATION_20261101`.
- Owner: MathExam project owner.
- Date: 2026-11-01, Asia/Novosibirsk.
- Base branch: `main`.
- Base SHA: `a8eb6b26c917c337a3f9672c0b8eb40243f6e6a3`.
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
  PR389 (additional multi-number LCM tasks) and PR391 (geometry provenance)
  remain separate, unmerged changes. This task does not integrate either.

## Approved scope

### In scope

- Responsive course overview, explicit start/resume and task buttons, readable
  topic hierarchy and truthful progress drawn from the existing `/progress`.
- Preserve original task/source captions while reducing repeated text.
- Local navigation help on the course page and existing mathematical help
  inside saved tasks, using one bottom-right launcher with accessible controls.
- Restore the managed task’s “Все темы” link to the cabinet catalogue using
  the existing bridge navigation event and save guard.
- Expose the existing LCM practice trainer beside fraction-task controls,
  explicitly labelled as a separate example, with existing help provenance.
- Focused DOM/browser regression, visual review, task/report/status documents
  and resource cache version updates.

### Out of scope

- Course JSON, source hashes, task IDs, answers, grades, storage contracts,
  authentication, personal learner records and external model activation.
- PR389/PR391 integration, merge, deployment, changes to other pupils' courses.
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

## Checks and gates

- Existing textbook catalog DOM, source-help DOM and relevant browser suites.
- Focused two-origin browser journeys with real isolated SQLite and synthetic
  accounts: course navigation, start, resume, helper placement and task help.
- Source/catalog integrity, JavaScript syntax, `git diff --check`.
- Manual inspection of actual desktop/mobile screenshots.
- Final gate: `VILENKIN_COURSE_NAVIGATION_OK`.
- No real student account or physical-device trial is claimed.

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
- Rollback: revert this presentation patch. No database migration, content
  revision or saved-work deletion is involved.

## Permissions

- Implementation: explicitly requested by the owner in the current conversation
  ("переделай" and bottom-right helper instruction); no copied approval used.
- Task branch, local commits, push and Draft PR: within that implementation work.
- Merge, auto-merge and deployment: **not authorized for this task**.

## Execution record

- Actual branch: `fix/vilenkin-course-navigation-20261101`.
- Actual base: `a8eb6b26c917c337a3f9672c0b8eb40243f6e6a3`.
- Final head, PR, checks and remaining findings: recorded in the task report.

# Continuous practice on the same division skill

## Identity

- Owner: repository owner
- Date: 2026-10-19 (Asia/Novosibirsk)
- Base branch: `main`
- Base SHA: `cb6588932c65a632e0797a5cb1165ddbe1fdf8ee`
- Planned branch: `feat/division-continuous-practice`
- Review level: `MEDIUM`
- Architecture: existing trainer bridge, canonical tasks and fresh-attempt API;
  no new archetype or ADR decision.

## Goal and evidence

Let a learner keep practising the same division skill for as long as needed.
The owner finds no apparent practice after a completed single-digit exercise.
The current managed UI ends with “Задание завершено” and hides the ordinary
“Новое условие” button below the work log. A fast click while the last answer
is saving also leaves that button disabled when the parent declines creation.
The existing fresh/source API retains the previous attempt and, for an active
lesson, changes its current presentation. Reuse that mechanism.

## Scope

- Make the practice tab and primary next-example action obvious for all
  division-family tasks, including saved legacy digit-selection attempts and
  the 17 course stages. Preserve the finished work until the learner clicks.
- Keep repeating the same content; course progression stays a secondary choice.
- Wait boundedly for the existing save acknowledgment before requesting one
  next attempt. Recover usable controls on failure or cancellation; guard
  account, route, attempt, lesson, history and control changes. Explicit retries
  reuse the operation ID after an uncertain creation response.
- Clarify public course and cabinet copy; refresh changed asset cache tags.
- Add focused DOM regressions to existing CI and reconcile project status.
- Do not change generators, canonical task specs, state format, storage schema,
  bridge protocol, server access rules, credentials or live pupil records.
- Unlimited repetition does not mean infinitely many unique conditions. Narrow
  foundational banks may repeat; changing their saved canonical content is out
  of scope.

## Acceptance criteria

- [x] Completed division examples show a prominent next-example button before
      work logs and course navigation, with no end-of-training message.
- [x] Repeated next actions create the same kind of exercise and retain prior
      cabinet attempts. The learner can inspect the completed answer first.
- [x] Delayed save, failed request, duplicate clicks and explicit retries remain
      safe and recoverable. No duplicate creation from one continuation.
- [x] Observer/history/control/account/navigation changes cannot create a new
      attempt through the pending continuation.
- [x] Existing saved tasks and public-course restoration still work unchanged.

## Checks and review

- Focused managed-renderer and app continuation DOM tests; existing plain
  division, estimation, course, route and numeric-generator checks.
- Canonical reconstruction and existing backend regression relevant to fresh
  attempts and lesson presentation; full existing cloud CI remains required.
- JavaScript syntax, changed asset references and `git diff --check`.
- Final marker: `CONTINUOUS_DIVISION_PRACTICE_GATE_OK`.
- Independent focused code review, with explicit risk and rollback notes.
  External model review is not required for this bounded client continuation.
- No production learner actions during verification. Browser visual acceptance
  after release requires a separate publication decision.

## Risks and rollback

The main risk is an asynchronous save or route change allowing duplicate or
stale continuation. Context guards, bounded waiting and stable operation IDs
address it without changing server contracts. A code revert restores the prior
presentation; existing attempt records and canonical tasks need no migration.

## Permissions

The current direct implementation request authorizes branch work, validation,
commits, push and a Draft PR. Merge, auto-merge and deployment require a separate
owner decision under `AGENTS.md` and `mathexam-pr`.

## Execution record

Implementation and review results are recorded in the Draft PR for its exact
head. No publication is implied by this task document.

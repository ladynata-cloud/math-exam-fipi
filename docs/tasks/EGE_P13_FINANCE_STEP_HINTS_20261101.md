# MathExam task specification: finance step explanations

## Identity

- Task: `EGE-P13-FINANCE-STEP-HINTS-2026-11-01`
- Owner: MathExam project owner
- Date: 2026-11-01
- Base branch: `main`
- Base SHA: `b779c500194daadf7f6418a9ad2923b3d537a690`
- Planned branch: `fix/profile-finance-step-hints-2026-11-01`
- Review level: `SMALL`
- Related issue or ADR: follow-up to released PR390; no architectural change.
- ADR status: ADR0001 remains Proposed and is not an implementation authority.

## Goal

Make the existing deposit hints describe the operation requested in each step,
especially the first year without an additional deposit or withdrawal, and
retain an independent exact-arithmetic check of every authored financial step.

## Context and evidence

- PR390 was released as the base above from head
  `9873e5010560d67b72d6e72afac303fcd1b67970`. Its six final-head workflows,
  four postmerge workflows and Pages deployment succeeded. The release is
  recorded in [PR390](https://github.com/ladynata-cloud/math-exam-fipi/pull/390).
- The published 78 authored answers and 442 intermediate answers are correct.
  Four deposit variants still use a general first-step hint suggesting an
  additional top-up or withdrawal before that operation starts in the condition.
- The prepared correction was independently reviewed before the external
  PR390 merge, but was not part of that release. Its source is retained in
  [prepared commit](https://github.com/ladynata-cloud/math-exam-fipi/commit/8287bb67fad71beb621323fc9a62a36160f28271).
- The owner explicitly granted START for a separate corrective PR with the
  prepared explanations and independent test in the current conversation.
- Authoritative remote main was verified at task start; the worktree was
  clean. This task starts directly from the published base and does not merge
  or rebase the old PR390 branch.

## Approved scope

### In scope

- Transfer the already reviewed 24 hints and 24 explanations in the guided and
  independent variants of source models 704682 and 704683.
- Transfer the two prepared provenance labels explicitly identifying project
  2027, task13. The visible project-2027 source title is already published.
- Add `tools/profile-finance-exact-steps.py`, with an additive CI invocation.
  Preserve all existing checks and screenshot-artifact retention.
- Create this specification and a new verification report; reconcile existing
  project status with primary release records within this same PR.

### Out of scope

- New lessons, mathematical models, parameters, answers, question order, UI
  interaction changes, generators, additional curriculum or course recreation.
- Storage migrations, accounts, real pupil data, board protocols or deployment
  settings. Merge and publication remain separate owner decisions.

### Files or areas that must not change

- Conditions, numeric and exact answers, units, IDs, order, ledger values and
  reveal milestones; all old banks, checker/model/UI/storage/bridge runtime.
- Existing test assertions, source-label regression and artifact-upload step.
- Original PR390 task and reports, which remain historical release evidence.

## Acceptance criteria

- [x] Exactly 50 text leaves differ in finance data: 24 hints, 24 explanations
  and two provenance labels; everything else is structurally identical.
- [x] Each edited explanation describes its actual operation and unit; the
  first-year step does not request an extra top-up or withdrawal.
- [x] The independent oracle derives 78 final and 442 intermediate answers,
  covering 13 lessons and 39 models with exact rational arithmetic.
- [x] Deliberate wrong intermediate and consistently wrong final/terminal-step
  answers fail the independent test in isolated temporary fixtures.
- [x] Existing finance/full-course tests and targeted mobile/keyboard checks
  pass; legacy runtime and saved-work identity remain exact.
- [ ] The final diff contains only the six declared paths, focused reviews
  pass, and the Draft PR records successful applicable exact-head CI.

## Checks and gates

- Required tests: `node tools/profile-finance.test.cjs`,
  `node tools/profile-full-course.test.cjs`,
  `python tools/profile-finance-exact-steps.py`, targeted browser inspection,
  and all workflows triggered for the new PR head.
- Required static checks: source syntax, structural 50-leaf comparison, exact
  preserved-file blobs, six-path scope and `git diff --check`.
- Manual checks: actual hint disclosure, first/later-year operations, final
  unit conversion, source caption and keyboard controls at 320/390/1280px.
- Local gate: `PROFILE_FINANCE_STEP_HINTS_LOCAL_OK`.
- Final gate: `PROFILE_FINANCE_STEP_HINTS_OK`; requires successful exact-head CI.
- Intentionally not run: production tests for this unpublished correction,
  physical devices/other engines and real pupil records. Unchanged broad
  browser/server regressions are covered by the existing exact-head CI.

## Review plan

- SMALL rationale: isolated explanatory-copy correction and additive test;
  no mathematical answer, learning sequence, interaction or runtime boundary
  changes. The test does not execute in the student application.
- Trainer design consultation applicable: no; no new trainer or substantial
  learning-sequence/interaction redesign. This is the copy-correction case
  under `docs/REVIEW_POLICY.md`, not an extension of an earlier review waiver.
- Before implementation: reuse the reviewed prepared texts and independent
  formulas; verify byte identity rather than recreating them.
- Ready-result review: independent mathematics/pedagogy and preservation
  reviewers, targeted browser inspection and final commit/tree binding.
- External review required: no under SMALL; no provider verdict is claimed.
- Sanitized handoffs: public source, bounded diff and derived evidence only;
  no credentials, private records or machine-specific paths in repository docs.
- If external review is later requested, record provider, PR, base/head,
  verdict and a verifiable source/time; no copied marker counts as review.

## Risk and rollback

- Risks: a hint could describe a different year or unit; an oracle could
  silently repeat a wrong answer key. Focused semantic review, independent
  formulas and negative mutation checks address these risks.
- Rollback: close the Draft PR before merge. After a separately authorized
  release, a bounded revert restores the prior explanatory strings and removes
  the added test/invocation. There is no data migration.
- Compatibility: task IDs and all saved-work contracts are unchanged.

## Permissions

- START granted by owner in the current task conversation: **yes**.
- Branch creation, local commits, push and Draft PR allowed: **yes**.
- Merge, auto-merge and deployment allowed: **no**, pending separate explicit
  owner authorization for the final PR and exact base/head.
- Force, reset, rebase, admin override and TLS bypass allowed: **no**.

## Execution record

- Actual branch/base: as specified above.
- Actual head, PR and exact-head CI: recorded in the new Draft PR after
  publication to avoid a self-referential commit identifier in this file.
- Tests passed, failed and not run; source identity; focused reviews:
  [verification report](../reports/EGE_P13_FINANCE_STEP_HINTS_20261101.md).
- Scope deviations: none planned; changes remain bounded to six paths.

## Required handoff

```text
EXECUTIVE STATUS

Task:
PR:
Base:
Head:
Gate:
Tests:
Failures:
Not run:
Scope deviations:
Recommendation:
Next user decision:
```

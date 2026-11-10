# MathExam task specification — Task 9 bracket labels

## Identity

- Task: `TASK9_BRACKET_LABELS_20261111`
- Owner: MathExam owner
- Date: 2026-11-11 (Asia/Novosibirsk)
- Base branch: `main`
- Base SHA: `71e94b46305300c4e959df1c7fe38228551b853e`
- Planned branch: `fix/task9-bracket-labels-20261111`
- Review level: `SMALL`
- Related issue or ADR: none; no architectural change.

## Goal

Name the first and second bracket groups in the Task 9 distribution helper
«Первая скобка» and «Вторая скобка», as directly requested by the owner.

## Context and evidence

- The supplied example is `demo-2027`: `3(x+8)-2(x-8)=8`.
  Both bracket groups currently say «Слева», which names the equation side
  without distinguishing the two brackets.
- `makeEquationDiscovery`, in the `distribute` branch, already enumerates
  bracket groups in their displayed order across the left and right sides.
- The live trainer was fetched over verified HTTPS before this change and
  matched the base file byte for byte: SHA-256
  `c3538f7eba74037b1933faf1b9cccb21c5db0343cce1741d2cea3779a284554f`.
  `PROJECT_STATUS.md` was inspected against this bounded production evidence;
  historical preparation entries do not establish publication of this fix.

## Approved scope

### In scope

- Replace equation-side captions only in the bracket-distribution helper.
- Keep one sequence across both sides; use «Скобка N» for later groups.
- Record this task and its verification.
- Refresh the existing navigator source binding and the learner-entry inline
  script fingerprint for this exact checked source. This is required to keep
  the preservation gates bound to the new captions.

### Out of scope

- Other helpers, mathematical data, answer checking, progress, styling,
  synchronization, dependencies and deployment configuration.

### Files or areas that must not change

- Other production source files and runtime behavior.
- Existing test assertions and workflows. Only the Task 9 expected source
  fingerprint and its provenance comment may change.

## Acceptance criteria

- The supplied example shows «Первая скобка: 3(x + 8)» followed by
  «Вторая скобка: −2(x − 8)».
- Group data indices, formulas, term buttons and actions are preserved.
- Numbering continues across the equality sign and is valid for one group.

## Checks and gates

- Required tests: existing `tools/task9-*.test.cjs` and
  `tools/oge-algebra-contract.test.mjs`.
- Required static checks: final diff review and `git diff --check`.
- Dependent preservation checks: `tools/public-navigator-preservation.test.cjs`,
  `tools/public_navigator_bindings.test.py` and the existing learner-entry CI.
- Manual checks: inspect rendered captions and the supplied example at
  desktop and narrow mobile widths.
- Final gate marker: `TASK9_BRACKET_LABELS_OK` after relevant checks pass.
- No new test suite is needed for this isolated wording correction.

## Review plan

- SMALL: presentation text only; no mathematical or runtime contract change.
- Trainer design consultation: not applicable; no new learning interaction.
- Ready-result review: unchanged expressions, group identity and actions;
  readable ordered captions in the existing layout.
- External provider review: not performed and not required for this SMALL task.
- Remote handoffs contain only the scoped public source and validation.

## Risk and rollback

- Main risk: a longer caption wrapping on a narrow screen.
- Rollback: revert this task's caption change through a reviewed commit.
- No saved-data or compatibility change.

## Permissions

- Current direct owner instruction: «пиши первая скобка потом вторая скобка».
- Scoped implementation, checks, commit, task branch and Draft PR are the
  preparation of that requested correction.
- The user-supplied `AGENTS.md` in this conversation requires separate explicit
  authorization for merge and publication. This task stops at the Draft PR.
- Merge, auto-merge and deployment: not authorized for this task.

## Execution record

- Actual branch: `fix/task9-bracket-labels-20261111`.
- Actual base SHA: `71e94b46305300c4e959df1c7fe38228551b853e`.
- Actual head SHA, PR and final test results: recorded in the Draft PR handoff.
- Existing Task 9 suite: 222 tests passed, no failed or skipped tests.
- Existing algebra contract gate: passed for OGE tasks 7, 8, 9, 10, 11, 12, 14.
- DOM inspection of `demo-2027`: the two requested captions, unchanged indices
  0/1, two term buttons per group, and the existing distribution feedback.
- `git diff --check`: passed.
- Initial local test setup lacked JSDOM and sparse-checkout support files;
  after restoring the existing dependencies and files, both suites passed.
- Local Chromium could not start because the executor forbids its singleton
  socket. Desktop/mobile browser checks remain assigned to the existing PR
  workflow; no local visual pass is claimed.
- Initial PR CI exposed two stale expected-byte records for this changed
  trainer. Update `assets/assistant/page-rollout.json` using the existing
  explicit-source binding command with source commit
  `88d8eb2cd8fdefa95b0aae7d6954a60c914e118d` and only
  `trainers/oge-task9-equations.html` declared as changed. Independently
  verified inline-script SHA-256:
  `b226c3f4216892b8d8021ebf0029a49ebb1ba6859d1797c91b5a4a293084728f`.
  The learner-entry fingerprint is updated to those exact bytes; all assertions,
  historical baselines, other source pins and navigation coverage remain.
- The existing binding command preview and write both succeeded with exactly
  that one changed HTML path. All four navigator-preservation checks and all
  five source-binding checks passed after the refresh.
- Source commit `88d8eb2` also passed the existing Task 9 browser workflow
  [42864006804](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/42864006804),
  including desktop and mobile interactions. Updated-head CI remains recorded
  in the PR so source-only success is not confused with final-head validation.
- Scope adjustment: two dependent preservation records are needed by the
  existing CI; no additional product change.

## Required handoff

Use the standard `EXECUTIVE STATUS` report with task, PR, base, head, gate,
tests, failures, not-run checks, scope deviations, recommendation and next
owner decision. Preparation is not publication.

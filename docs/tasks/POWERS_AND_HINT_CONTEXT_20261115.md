# MathExam task specification

## Identity

- Task: `POWERS_AND_HINT_CONTEXT_20261115`.
- Owner: MathExam owner.
- Date: 2026-11-15, Asia/Novosibirsk.
- Base branch: `main`.
- Base SHA: `c6d0643c05962be5065f531a5910b81fe3d4262d`.
- Planned branch: `fix/powers-hint-context-20261115`.
- Review level: `MEDIUM`.
- Related issue or ADR: owner-reported incorrect powers hint; ADR 0012 protects
  published book editions.
- ADR status: ADR 0012 is Accepted; ADR 0001 remains Proposed and is not an
  authorization source.

## Goal

Give pupils mathematically precise help for powers and preserve the meaning of
the first learning step when its hint is shown beside an entire independent
task. Keep the existing answers, progress and board state intact.

## Context and evidence

- The owner reported `(4^3 * 4^2) / 4^3` with the misleading hint
  "При одинаковом основании складываем показатели". The correct exponent is
  `3 + 2 - 3` and the result is 16.
- `ege-profil/start/equations-data.js` produces this hint for six power tasks.
  Their six final answers and eighteen step answers are numerically correct.
- `ege-profil/start/app.js` uses `steps[0].hint` in independent/plan modes while
  omitting that step's question. The same loss of context makes a forbidden
  denominator value look like an equation answer, and a derivative zero look
  like a function zero.
- Confirmed examples: `eq-rational-4`, `expr-fractions-4`, `eq-root-4`, and
  `calc-extreme-5`.
- Five further statements omit the nonzero-base condition for exponent zero:
  one in `start/functions-data.js`, two in `trainers/attestaciya-1-kurs.html`,
  and one in each dated v1/v2 OGE book copy of the powers/roots trainer.
- The main source and seven relevant public resources matched during the
  read-only audit. At START, authoritative remote main still has the SHA above.
- Existing numeric tests pass but do not check the meaning of the visible hint.
  A whole-site mathematics audit and ZIP audit have not been performed.

## Scope conflict discovered during implementation

The two dated book copies are immutable under Accepted ADR 0012 and the
base-anchored `tools/book-edition/verify.py` gate. The actual verifier rejects
the proposed corrected bytes for both v1 and v2. Updating their manifests
would still violate the independent append-only check; weakening it is not
permitted. The old files remain unchanged and the owner has been informed.

The compatible correction requires a new edition with new paths/aliases, or
an explicit owner decision about withdrawal under ADR 0012. Neither operation
is silently substituted into this task. The three active zero-exponent texts
are corrected; the two frozen statements remain unresolved pending owner
scope/edition decision. The original five-statement acceptance criterion below
therefore remains open even if all candidate technical checks pass.

## Approved scope

### In scope

- Correct the multiplication hint and provide a complete task-level powers
  hint distinguishing the numerator product and the denominator division.
- Preserve the first step's question with its hint for independent/plan help
  in the shared START renderer; retain guided help for the current step.
- Correct the five confirmed nonzero-base omissions in the four source files
  listed above, including both public dated book copies.
- Update the affected public START script versions so returning pupils fetch
  the corrected content, including the eight existing START board wrappers
  (only their three changed-script URL versions).
- Extend the existing task-first DOM/browser checks and focused content checks;
  keep them in existing CI execution paths.
- Add this specification and reconcile PROJECT_STATUS against scoped live
  evidence without creating a separate status-only task.

### Out of scope

- Changing task answers, task selection, numeric grammar, progress schemas,
  board protocol, authentication, deployment workflows or unrelated courses.
- Claiming that every mathematical statement, ZIP or downloaded personal copy
  has been audited or corrected.

### Files or areas that must not change

- Numeric checking modules, state/persistence modules and server contracts.
- Unrelated branches, worktrees, instructions, gates and branch protections.

## Acceptance criteria

- [x] The visible powers hint distinguishes multiplication and division; it
  never claims that equal bases alone imply adding exponents.
- [x] The screenshot task accepts 16 and `4^(3+2-3)` and rejects 65536 and
  `4^(3+2+3)`; all six power tasks retain their eighteen correct step answers.
- [x] Independent and plan help retain the forbidden-value/boundary and
  derivative context in the confirmed examples.
- [x] Guided help follows the current step; opening help preserves drafts,
  recorded answers and the existing assisted-work credit.
- [ ] The five zero-exponent statements explicitly require a nonzero base.
- [x] Thirteen targeted regressions detect the old content/context failures and
  pass on the candidate. Existing gates stay enabled; CI remains required.
- [ ] The changed help fits at 320 and 1280 CSS pixels without horizontal
  overflow and remains readable with normal page scrolling.

## Checks and gates

- Required tests: existing `profile-task-first`, `profile-equations`,
  `profile-functions`, `profile-step-solutions`, `profile-first-attempt`,
  `profile-calm-state`, and affected expression/equation board regressions;
  existing powers/roots and college checks as applicable.
- Required static checks: JavaScript syntax, exact changed-file review,
  `git diff --check`, no unrelated or sensitive data in the handoff.
- Manual checks: inspect changed help in a real browser at 320/1280; verify the
  screenshot task, OДЗ examples and derivative example.
- Candidate technical marker: `ACTIVE_POWERS_AND_HINT_CONTEXT_OK` only after
  applicable checks. This does not close the frozen-edition scope conflict.
- Full task marker: `POWERS_AND_HINT_CONTEXT_OK` is withheld while the original
  book-edition criterion remains unresolved.
- Checks intentionally not run: whole-site mathematics audit, ZIP audit,
  real-pupil pilot and release verification before separate authorization.

## Review plan

- Review-level rationale: bounded shared rendering behavior plus content fixes,
  recoverable by reverting one task commit; no persistence or API change.
- Trainer design consultation applicable: no new trainer or learning sequence.
  Before implementation, independent review identified the precise loss of
  mathematical context and the required operation-specific wording.
- Ready-result review: independent mathematical/content and technical review
  of the actual candidate, including visible hint regressions.
- External provider review required: no task-specific request. Internal review
  is not represented as external provider approval.
- Sanitized handoff: public relevant code/diff and test evidence only; no
  credentials, personal material or machine-specific absolute paths.
- Any external review would need provider, PR, base/head, verdict and source.

## Risk and rollback

- Main risk: a longer contextual hint might overflow or obscure controls;
  guided/independent help could be mixed if selected incorrectly.
- Rollback plan: revert this task's commit through a separately authorized PR;
  no data migration or destructive cleanup is needed.
- Data compatibility: existing task IDs, answers, saved attempts and board
  payloads remain unchanged. Optional task-level help is presentation only.

## Permissions

- `START` granted by owner in the current task conversation: yes.
- Branch creation, local commits, push and Draft PR: yes.
- Merge, auto-merge and deployment: **not authorized by this START**.
- The explicit AGENTS.md supplied by the owner in this conversation requires
  a separate merge authorization and overrides broader repository policy.
- Stop after the complete Draft PR handoff; do not merge or publish implicitly.

## Execution record

- Actual branch: `fix/powers-hint-context-20261115`.
- Actual base SHA: `c6d0643c05962be5065f531a5910b81fe3d4262d`.
- Actual head SHA, PR and commits: recorded in the final PR handoff.
- Local tests: 21/21 across the two changed DOM/content test files, plus 65/65
  existing function, solution, first-attempt, plan-state and board regressions,
  plus 21/21 script-parity, log/trigonometry and stereometry board checks after
  updating the wrapper versions (107 local tests in total).
- Negative control: the thirteen new regressions all fail on unchanged base
  code for the intended content/context reasons and all pass on the candidate.
- Syntax: changed JavaScript and college inline script compile successfully.
- Internal review: no blocking defect in the active correction after updating
  all 24 changed-script references across the eight wrappers. This is not an
  external provider verdict or a merge authorization.
- Browser: local Chromium could not start because the environment denied its
  socket operation. The existing CI browser suite is extended to exercise the
  five affected lesson families in both modes at 320/1280 pixels; its result
  must be reported separately after the Draft PR runs.
- Scope exception/blocker: two frozen book texts remain unchanged under ADR
  0012 and base-anchored integrity gates, pending an owner decision.

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

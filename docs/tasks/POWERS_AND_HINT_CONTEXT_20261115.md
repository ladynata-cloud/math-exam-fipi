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
- Maintain the existing exact script-version fixtures and the navigator's
  source bindings for the two changed HTML files using its supported committed
  source refresh; preserve all byte, provenance and negative checks.
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
- [x] The changed help fits at 320 and 1280 CSS pixels without horizontal
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
  socket operation. On first remote head
  `f2d22858272b4b2bbe583db2e1e647973b607596`, CI
  [task-first 43658514431](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/43658514431)
  passed all 81 lesson families and 20 targeted hint cases (five families, two
  modes, 320/1280 pixels). The screenshot task rejects 65536 and accepts 16;
  drafts, assisted credit and horizontal fit remain checked. The exported
  screenshots show the corrected powers rule and the restored step context.
- Visual review covered all ten exported hint screenshots. Text and controls
  remain readable at both widths. At 320px the existing floating navigator
  touches the upper-right border of the solution button in the fractions and
  extrema screenshots without hiding its label; this shell behavior is not
  changed here. The browser derivative screenshot is variant 4; the exact
  reported `calc-extreme-5` remains covered in both modes by the DOM tests.
- First-head CI also exposed two stale verification bindings: navigator HTML
  hashes and the exact START app-version pin used by board picker checks.
  These were reproduced locally and corrected without changing teaching HTML
  again, removing checks or accepting arbitrary query strings.
- Navigator maintenance uses `tools/public_navigator_bindings.py` with source
  commit `f2d22858272b4b2bbe583db2e1e647973b607596`, this task, and exactly
  `ege-profil/start/index.html` and `trainers/attestaciya-1-kurs.html`.
  It updates their source hashes and provenance only; the snippet, rollout
  coverage and frozen book bytes are unchanged. This is the supported later
  source-edit procedure in `PUBLIC_NAVIGATOR_ALL_PAGES.md`, not an approval.
- The script parity helper pins the identical reviewed
  `app.js?v=20261115-hint-context` on page and wrappers. Matching stale or
  unreviewed versions on both sides are still rejected. The obsolete app-only
  log/trigonometry exception is removed; its function-task exception remains.
- Follow-up local checks: 45/45 script-parity and all affected board-picker
  checks, 4/4 navigator preservation checks, 5/5 source-binding tool checks,
  and 43/43 navigator dialogue regressions. Five parity tests also occur in
  the earlier 107-test total. Final-head CI is required separately.
- Independent internal review found no blocking issue in the two-file source
  refresh or the exact script pin; the official read-only refresh preview
  returned `BINDINGS_CURRENT`. This is not external provider approval.
- Draft PR: [#607](https://github.com/ladynata-cloud/math-exam-fipi/pull/607).
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

## Integration after the first-part board release

Task `POWERS_AND_HINT_CONTEXT_20261115` belongs to [PR #607](https://github.com/ladynata-cloud/math-exam-fipi/pull/607). Its original base is `c6d0643c05962be5065f531a5910b81fe3d4262d` and the reviewed teaching delta comes from `7cbb5abf3b58084b12aa5e388c2fe4e663655ca7`. The integration base for the first-part board is `901bf101286c403cb1b1f07fcbbd965115666725` (#779). Review level is MEDIUM for the bounded shared rendering and content changes.

## Reported problem and correction

For `(4^3 × 4^2) / 4^3`, the old hint only described adding powers with the same base. Multiplication in the numerator adds the exponents. Division by a power with the same nonzero base subtracts its exponent. The answer is `4^(3 + 2 − 3) = 16`. Use the two operation-specific rules across the six authored power tasks and supply a hint for the full task in independent and plan modes.

When a task relies on its first step for help, show that step’s question with its hint. In the rational and radical examples this gives meaning to an excluded value or a domain boundary. In the extrema example the question identifies the zero of the derivative. Guided practice continues to show the hint for the current step. State, scoring, authored answers and board messages retain their existing formats.

Limit the zero-exponent wording change to the three active explanations in the functions prerequisites and the college trainer. Two further instances occur in dated OGE book editions v1 and v2. Those editions are immutable under [ADR 0012](../adr/0012-fixed-oge-book-editions.md) and are outside this integration.

## Acceptance

- Exercise the reported task and all six authored sets of step answers. `16` and `4^(3+2-3)` must pass. `65536` and `4^(3+2+3)` must fail.
- Cover `expr-powers-4`, `eq-rational-4`, `expr-fractions-4`, `eq-root-4` and `calc-extreme-5` in both independent and plan modes. Opening help must retain the draft, task identity and previous work, and record assisted credit.
- Exercise guided hint progression, the existing opposite-vector cases, and the visible help at 320 and 1280 CSS pixels with the DOM and Chromium `profile-task-first` tests. Check the three active nonzero-base explanations with `profile-equations.test.cjs`.
- On the public START page and all 14 current board wrappers, version the changed `app.js`, `equations-data.js` and `functions-data.js` with fresh cache keys. Retain the #779 keys on its other board modules. Check returning pupils, direct board entries and progress isolation, and rebuild and verify the offline START package and navigator receipts on the composed tree.

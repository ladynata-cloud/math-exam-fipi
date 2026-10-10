# OGE arithmetic support after a struggling-learner simulation

## Identity

- Owner: repository owner, current task conversation
- Date: 2026-10-10
- Base branch: main
- Base SHA: `3759b4646ea19d2790d3b5f84eaadb2c01f762a1`
- Planned / actual branch: `feat/oge-arithmetic-scaffolding`
- Review level: HIGH (shared managed renderer and saved-attempt compatibility)
- Related architecture: ADR 0010, Accepted; existing managed remediation bridge

## Goal

Run an isolated synthetic learner through the OGE/pass start with plausible
multiplication, decimal and long-division errors. Improve the concrete help
that lets this learner see how to calculate each action. Preserve pupil and
parent entry, real learning data and existing saved work.

## Context and evidence

- Managed cabinet exercises mount learning-managed.js, not the standalone UI.
- The first route task already uses multiplication. Decimal feedback can say
  only to align commas; digit selection in division lacks a multiples aid.
- The renderer currently drops authored hint2 in ordinary hints.
- applyState reconstructs a canonical seeded task and compares exact JSON.
  Changing the bank/contracts/generation could invalidate old attempts.
- Synthetic behavior is a repeatable usability probe, not evidence about the
  real pupil's progress or proof of learning.

## Approved scope

- A pure rendering helper for multiplication, decimal columns and current
  long-division actions; integrate it into existing hint/solution feedback.
- Show existing second hints. Preserve existing hint accounting and input.
- Local simulated route checks, mathematical helper checks, state restoration,
  read-only mirror and login regression gates; scoped documentation.
- Add those checks to the existing learning workflow.

### Out of scope / protected areas

- All real pupil/parent/teacher data and credentials; account provisioning.
- board-server/**, learning/**, trainers/learning-bridge.js, hosting config.
- learning-bank.js, learning-contracts.js, division-lab-core.js, task generation,
  contentVersion, taskSpec/state schema, and correctness rules.
- Route reassignment or resetting real progress; new architectural primitives.

## Acceptance criteria

- [x] Document the visible baseline failures and exact synthetic scenarios.
- [x] Concrete requested help explains the missing arithmetic operations.
- [x] Assistance is recorded before display and never becomes independent credit.
- [x] Drafts, saved attempts and read-only mirrors retain their behavior.
- [x] Protected files remain byte-identical; entry regressions pass.
- [ ] Focused checks and required exact-head CI pass before publication.

## Checks and gates

- Pure helper math tests; isolated struggling-pupil browser simulation.
- Existing remediation quality/checkpoint/bank and managed browser smoke.
- OGE route and synthetic ready-pupil / parent / role entry tests.
- Full existing Learning CI and scoped navigation CI where triggered.
- Manual narrow/mobile help review; git diff --check; protected-blob identity.
- Final marker: OGE_ARITHMETIC_SCAFFOLDING_OK.

## Review plan

Independent HIGH review of the final exact head. The standing owner waiver of
external review persists. No synthetic fixture contains private account data;
handoffs include only scoped source, tests and public release references.

## Risk and rollback

The main risk is wrong derived arithmetic help or a renderer failure that prevents
opening an existing exercise. Keep immutable content and contracts untouched;
reject unsupported helper patterns, and validate saved-state and readonly paths.
Rollback is an ordinary revert of this scoped UI patch; no data migration exists.
The existing Amvera main integration can rebuild the image on a trainer change;
this task does not change its settings or request an extra manual restart.

## Permissions

The current request authorizes the simulation and trainer fixes. Branch, local
commits, push and PR are part of the existing workflow. Standing scoped checked
publication remains authorized under session instructions. No force/reset/rebase,
admin override, credential changes or gate weakening is authorized.

## Execution record

Baseline, exact head, review, test results and publication evidence are recorded
in the associated PR. Failed checks must remain distinguished from later passes.


### Local findings and checks

The fixed-seed baseline visited five arithmetic topics. In `91 : 16`, the
hint demanded a remembered multiplication fact and the solution showed 5
without a multiples table. In `2040 : 4`, the first step named an incomplete
dividend without explaining why 2 is too small and 20 works. In `8,01 + 4,73`,
the answer appeared without the column calculation/carry. The missing factor
`? · 3 = 12` was explained only by division.

After the changes, the DOM-only robot completed all 16 actions of the guided
`2040 : 4` example, recovered the quotient-digit, decimal and missing-factor
answers, and advanced one step in the separate one-digit example. All completed
fixed-seed work remained marked as helped. The checks also verified saved help,
read-only mirror/no writes, draft preservation and missing-helper fallback.

A separate empty-plan OGE/pass robot visited all eight initial topics through
visible navigation. Five were visibly completed; the limited arithmetic reader
stopped on linear equations, grid area and angle addition. These are explicitly
reported as policy limits, not completed topics or proven product failures.
Three fresh first-topic examples also completed. The before/after route runs
used fresh random seeds, so their completion counts are not an efficacy
comparison. Actual pupil accounts were never used for the simulation.

Local gates passed: helper 11/11; remediation quality, checkpoint and unchanged
bank; preparation map; managed smoke (36 trainers, 224 actions, restored states
and readonly); OGE route; ready-pupil, parent and role entry. Initial fixture
assertion/parser/save-timing mistakes were corrected without weakening product
gates. A full-Chrome environment launch error was resolved with the normally
available headless executable. Exact-head CI and release evidence follow in PR.

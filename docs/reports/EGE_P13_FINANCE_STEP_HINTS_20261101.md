# Finance step explanations: corrective verification

## Scope and release boundary

- Task: [EGE-P13-FINANCE-STEP-HINTS-2026-11-01](../tasks/EGE_P13_FINANCE_STEP_HINTS_20261101.md).
- Base: `b779c500194daadf7f6418a9ad2923b3d537a690`, the released PR390 squash.
- Branch: `fix/profile-finance-step-hints-2026-11-01`.
- Review: SMALL; an isolated explanatory correction plus an additive test.
- Owner START permits the separate corrective Draft PR. Merge, auto-merge and
  publication are not authorized by START or this report.

The course already contains 16 financial lessons / 96 tasks and 81 total
lessons / 486 tasks / 1,771 steps. This correction adds no task and changes
no mathematical answer. Original PR390 documents remain historical and are
not rewritten to imply that this later correction was already released.

## Problem and exact correction

The first step of two guided/independent deposit pairs used the same general
hint as later years. For model704682 it suggested adding a top-up before the
first year's interest; for model704683 it suggested a withdrawal before that
first accrual. Both conditions start the extra operations in year two, and
all authored answers were already correct.

The prepared texts are reused byte-for-byte. Across the four existing tasks,
24 hints and 24 explanations now distinguish:

- first-year interest on the initial amount, without an extra operation;
- a later top-up or withdrawal before that year's interest;
- the interest operation itself;
- the final conversion from thousands of roubles when the question asks for
  roubles, without combining that conversion with an earlier action.

Two internal provenance labels additionally say
`Проект демоверсии 2027, №13`. The visible project-2027 title was already
released by PR390. The existing historical-2026/source-warning test is retained.

The complete data delta is exactly **50 string leaves**. Conditions, prompts,
parameters, numeric and exact answers, units, IDs, order, financial tables
and reveal milestones remain structurally identical to the published base.

## Independent arithmetic gate

`tools/profile-finance-exact-steps.py` computes each question's requested
quantity from reviewed statement parameters with Python `Fraction`. Its
calculation functions do not consult answer keys, application calculations,
ledger values or the existing JavaScript oracle. Expected results are compared
with the answer keys only after derivation.

The gate checks all **39 models, 78 final answers and 442 intermediate answers**
and asserts the complete 13-lesson inventory. Final answers have finite decimal
representations. Repeating intermediate values retain exact rational form;
no arbitrary intermediate kopeck rounding is introduced.

The CI change is exactly two added lines: the named step and its Python
invocation. Existing test commands, assertions and screenshot retention are
unchanged. The previous gate checked independent final answers and ledgers;
this addition also independently derives every intermediate requested value.

### Negative checks of the test itself

An independent reviewer used temporary copies only:

1. Both numeric and exact aliases of one intermediate answer were changed
   from 780 to 781. The test exited 1 and identified the mismatch.
2. The task's final answer and its terminal step were both changed from 463.2
   to 464.2. They still agreed with each other, but the independent formula
   detected the error and the test exited 1.

These expected failures demonstrate that agreement between two wrong answer
keys cannot satisfy the new gate. No mutated fixture entered the repository.

## Preservation

All eight old banks, state, application/checker/model code, CSS, index, board
session and bridge remain byte-identical to the published base. The existing
source-label test and artifact-upload block are unchanged. No test is weakened.
No real pupil record is opened or modified.

The corrected finance module and oracle exactly match the prior independently
reviewed candidate. Earlier broad synthetic preservation results (1,224
resume/persist/reload comparisons and 20,844 legacy checker comparisons) remain
applicable through this exact source identity; they are not relabelled as new
executions in this corrective task. Fresh targeted checks and new-head CI are
recorded separately below and in the PR.

## Reviewed source identity

| File | SHA256 |
| --- | --- |
| `ege-profil/start/finance-data.js` | `d3da1767e3c5cf8b233f0a98f7879c190a1d6d4b839778fca714b360ccbbb67b` |
| `tools/profile-finance-exact-steps.py` | `b901bf978f2a4716385541e8ef24b8177f47fae6eb15b32a52798762b184109f` |
| `.github/workflows/profile-start.yml` | `c16036e6297b77e43895533526bd36ff121db0b2c78614b5eba6836a5775f23c` |

Final commit, tree, base-to-head patch ID and all exact-head CI links belong
in the Draft PR after publication. They must not be inferred from these hashes.

## Fresh verification

Published-head CI is recorded in the Draft PR so no status-only follow-up
commit is needed. Fresh checks in this corrective task are:

| Check | Result |
| --- | --- |
| Independent exact answers | PASS: 78 final / 442 intermediate answers, 39 models, 13 lessons |
| Independent pedagogy/formula review | PASS; every corrected operation and unit reviewed |
| Negative oracle mutations | PASS: both deliberate errors produce exit 1 |
| Existing finance unit/model/state suite | 10/10 PASS; 506 ledger rows / 3,010 cells |
| Existing full-course inventory | PASS: 81 lessons / 486 tasks / 1,771 steps; legacy storage key preserved |
| Fresh hint/browser inspection | PASS: 72 displayed step hints, six independent hints, three catalogue and three source-caption checks |
| Keyboard/layout | PASS: nine keyboard scenarios, 96 layout checks, no new clipping or overflow |
| Visual inspection | Eight fresh PNGs actually viewed at 320/390/1280px |
| JavaScript / local HTTP failures in completed browser coverage | 0 / 0 |
| Structural and preserved-file identity | PASS: exactly 50 text leaves; all unrelated runtime exact |
| Source syntax / diff whitespace | PASS |

The browser used synthetic local storage. Independent variants were opened
through the existing explicit guided-help action. First-year interest, later
top-ups/withdrawals and final unit conversion were checked through actual help
disclosure. The finance-data hash before and after inspection was identical
to the reviewed value above. Long conditions require ordinary vertical scrolling.
The inherited decorative catalogue number may wrap at 320px; task text and
actions remain available, and general catalogue redesign is outside this fix.

Local gate: `PROFILE_FINANCE_STEP_HINTS_LOCAL_OK`. Final six-path commit/tree
binding and the new exact-head CI are recorded in the PR. Final gate
`PROFILE_FINANCE_STEP_HINTS_OK` is not claimed until those checks succeed.

## Failures and not-run checks

- The first full-course local invocation was interrupted by the execution
  environment at `spawnSync git` with EPERM. The unchanged test is rerun with
  the environment's approved process permission and passes; no assertion is
  removed and no repository test is modified.
- The temporary visual harness completed 320px, then read the 390px guided
  question after the route hash changed but before the DOM finished rendering.
  It now waits for the concrete expected question text. The remaining 390px
  and 1280px scenarios passed without repeating the successful 320px coverage.
  This change is confined to the temporary harness; no fixed sleep, weakened
  assertion or product change is used.
- Physical devices, Safari/Firefox, live new-correction delivery and real
  pupil records are not tested. This correction has not been deployed.
- No new external Claude consultation/review is required under SMALL and the
  copy-only consultation exception. No old task waiver or provider verdict is
  reused. Independent internal reviews are explicitly internal evidence.

## Risk, rollback and next decision

The remaining release condition is successful CI for the exact new PR head,
then the owner's separate squash-merge and publication authorization. Requery
authoritative main immediately before merge; any drift follows AGENTS.md and
the release workflow. The local source identity does not authorize a merge.

After a separately authorized release, verify the actual parent/delta/tree,
Pages delivery and the changed live finance asset, then inspect first-year
deposit hints in an isolated synthetic context or a safe read-only view.
Never overwrite real learner answers or progress for a release test.

Closing the Draft PR abandons this correction before release. A bounded revert
after an authorized release restores only the changed explanatory fields and
removes the new test/invocation; no persistence rollback is required.

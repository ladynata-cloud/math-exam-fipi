# Trainer answer integrity — completion on current main

## Identity

- Task: TRAINER_ANSWER_INTEGRITY_20261114
- Owner: MathExam owner
- Date: 2026-11-14 (Asia/Novosibirsk)
- Base branch: main
- Base SHA: add234c3ecb3204d4d7c9b3ef99f7b98a33bf37a
- Planned branch: fix/trainer-answer-integrity-20261114
- Review level: MEDIUM
- Related task: unfinished corrections in PR #547, head 4b7317a4f5e4bb01d841400d0fb3fe37f079eb65
- ADR: no architectural change; ADR 0001 remains Proposed and is not approval for this change.

## Goal

Check the complete numeric answer as written. Empty or malformed input receives useful feedback without a mathematical penalty. Opening a hint in rounding or vectors records assisted work instead of independent success. Downloadable copies behave the same way.

## Context and evidence

The owner's current request is to finish remaining trainer issues and resolve routine questions independently. On the selected main, Theatre of Formulas still uses parseInt for arithmetic steps, and rounding/vector hints do not exclude independent credit. Seven existing PR #547 regressions were reproduced before changing source. The old PR and branch remain unchanged; only relevant corrections are continued from the current main.

## Approved scope

### In scope

- Arithmetic/coefficient input handlers in trainers/teatr-formul-daily.html.
- Hint accounting and learner messages in trainers/rounding-stepwise.html and trainers/ege-profile-vectors-trainer.html.
- Explicit invalid-input feedback in vector numeric steps, without revealing the mathematical hint, and protection against duplicate/stale step completion.
- Three maintained downloadable HTML/ZIP copies, rebuilt with the existing generator.
- Focused regression/browser tests, applicable CI, and exact navigation/source bindings required by the changed pages.

### Out of scope and protected areas

- No generators, task banks, answer keys, storage IDs/schemas, migration of saved records, board/server contracts, authentication, pupil records, other trainers or new course architecture.
- No repair/synchronization of old #547; no merge, auto-merge, deployment or live data changes.
- PROJECT_STATUS.md reconciliation belongs to the coordinating task.

## Acceptance criteria

- [ ] Integer suffixes/decimal input cannot be accepted as the expected integer; empty/malformed fields do not increment mathematical mistakes.
- [ ] Valid signed integers, zero and supported spacing remain accepted.
- [ ] A hint at any rounding step and manual/automatic vector hints prevent independent credit; a fresh unassisted problem can earn it.
- [ ] Duplicate/stale completions cannot advance or count another step; saved totals and unrelated progress remain intact.
- [ ] Vector numeric steps explain empty/invalid input without changing the active step or assistance counters.
- [ ] Browser scenarios cover visible input, help, retries and reload at 320/390/1280 px; the existing rounding route test remains valid.
- [ ] Download HTML/ZIP files contain corrected source; rebuilding only these packages is reproducible.
- [ ] Source/navigation checks remain strict; no historical fixture is weakened.

## Checks and gates

- Required: bonus-theatre-input, vector-assistance, rounding-stepwise DOM, learning-rounding-preparation DOM, focused bonus browser journeys, existing rounding-stepwise browser.
- Static: script syntax, download parity, affected navigation/source provenance, git diff --check.
- Visual: empty feedback and assisted completion screenshots at phone/desktop widths.
- Final gate: TRAINER_ANSWER_INTEGRITY_20261114_OK.
- Real-pupil lesson and external provider review are not performed. Local Chromium cannot run in the restricted process/socket environment; native checks belong to CI and must be reported separately.

## Review plan

MEDIUM: bounded reversible accounting corrections, with unchanged storage keys/schemas and existing records. No new archetype or substantial teaching-sequence change. Before implementation: compare the prepared #547 corrections with current source and reproduce the defects. Ready-result review inspects accepted formats, assistance accounting, stale callbacks and download parity independently. No provider approval or historical exact-head review is claimed. Handoffs contain repository-relative evidence, no credentials or pupil data.

## Risk and rollback

Risks: rejecting an intended numeric format, carrying assistance to a new problem, duplicate completion and stale downloadable copies. Targeted regressions cover each. Rollback uses an ordinary revert of task commits after review; no migration or deletion of stored results is required. Previously earned totals are not rewritten.

## Permissions

- Current direct owner instruction authorizes scoped implementation, validation, branch creation, local commits, push and a Draft PR.
- The owner's directly supplied AGENTS.md requires separate merge authorization and takes precedence over the older standing-release document in the repository.
- Merge, auto-merge and deployment: not authorized by this task.
- No force, reset, rebase, non-fast-forward synchronization, admin override or disabled TLS.

## Execution record

- Actual branch: fix/trainer-answer-integrity-20261114
- Actual base: add234c3ecb3204d4d7c9b3ef99f7b98a33bf37a
- Initial failures: 7/12 Theatre/vector regressions fail on the unchanged source. After porting, 12/12 pass; the first rounding DOM launch could not load jsdom until isolated dependencies became available.
- Final checks and review are recorded below after completion.

## Required handoff

```text
EXECUTIVE STATUS
Task: TRAINER_ANSWER_INTEGRITY_20261114
PR:
Base: add234c3ecb3204d4d7c9b3ef99f7b98a33bf37a
Head:
Gate:
Tests:
Failures:
Not run:
Scope deviations:
Recommendation:
Next user decision: separate explicit merge authorization after review
```

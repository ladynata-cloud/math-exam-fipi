# OGE7 zero denominator recovery

## Identity

- Task: OGE7_ZERO_DENOMINATOR_RECOVERY_20261111
- Owner: MathExam
- Date: 2026-11-11, Asia/Novosibirsk
- Base branch: main
- Base SHA: 19811cc15a33d63fc0fcc0b6a11c34863ec64d03
- Planned branch: fix/oge7-zero-denominator-20261111
- Review level: SMALL
- Related ADR: none; existing input-validation behavior is retained.

## Goal

A pupil entering a fraction with denominator zero in the native OGE7 steps
receives the existing editable-input feedback and can correct the answer,
without an uncaught exception or an added mathematical-error/help event.

## Context and evidence

At the pinned base, parseQ accepts the fractional syntax and calls Q with a
zero denominator. Q correctly rejects that internal arithmetic operation by
throwing "den=0". The native input handler therefore never reaches its existing
neutral invalid-input branch. This was reproduced on the unchanged source
and public page bytes using isolated synthetic state; no real learner data
was read or changed.

The bounded replay includes one- and two-field steps, both Enter targets and
the check button, first/second invalid fields, correction without a reload,
valid zero, supported fraction/decimal syntax, and an existing wrong-answer
event. A separate independent review confirmed the input-boundary diagnosis.

Source identity for the exact patch:

| Representation | Base SHA256 | Candidate SHA256 |
| --- | --- | --- |
| Full HTML | 327b041bf929619f3ced888e576ce12c560def6fd918aa637fc967ee355504ca | d28cdf376c408decbe6a743c00116b4d8230d7f89cdadfa72abbbe9c470c0c13 |
| Without exact navigator pair | f67f7cf75c8bc54c80a50ab59c80b3ed91584dd7d47961c1f550edf4cd39c44e | bc58c95ce3e0ce34cb70e7fc44a735edccf74a9b8367c27ac8797942cd4d4553 |
| Native inline engine | 1c8377171051d6cd9582537dcfca1d270f00300b0b1a8f15fb0cd0f40f7348dc | 1c355a0ce56f8588b8d26cd8f20172c01f408d395940b8495306ca5bdba62300 |

The complete HTML changes by 27 UTF-8 bytes: 218548 to 218575.
Its BOM and all unrelated bytes are retained.

## Approved scope

The current owner request continues the Brilliant/GeoGebra audit and
improvement of the OGE and EGE courses. This task implements one isolated,
reproduced OGE input defect within that request.

### In scope

- Reject a zero denominator at the parseQ user-input boundary.
- Keep Q and the exact rational arithmetic invariant unchanged.
- Exercise the real native handlers and a separate real-DOM test.
- Preserve existing full-source gates with one strict inverse of this exact
  reviewed fragment; compare every other byte and the original engine digest.
- Refresh only the OGE7 navigator source binding after the source commit,
  retaining the established coverage, snippet and provenance rules.

### Out of scope

- New input grammar, new wording, generators, answer keys, mathematical rules,
  attempt policy, hint policy, stored progress, transport or board contracts.
- The separate OGE8/OGE9/OGE11/OGE22/OGE24 tasks or pending PR changes.
- A new lesson, source-content migration, global error handling or Q fallback.

### Files or areas that must not change

All runtime source outside trainers/oge-task7-number-line.html; frozen book
fixtures, video/worked-step receipts, navigator runtime and coverage; unrelated
source bindings and source/math review receipts.

## Acceptance criteria

- [ ] 1/0, 0/0, signed numerators, whitespace and leading-zero denominators
  return invalid user input without throwing.
- [ ] Q(1n, 0n) still throws; exact valid arithmetic is unchanged.
- [ ] Blank input remains distinct from the valid number zero.
- [ ] Check and Enter in either input keep invalid drafts editable, do not
  advance, and do not add miss/help/show/solved events.
- [ ] Correcting the same native step succeeds without a reload.
- [ ] A prior genuine mathematical error remains counted.
- [ ] The native DOM test passes all eight one-/two-field event scenarios.
- [ ] Strict source restoration matches the complete old HTML and engine
  hashes; missing, repeated, altered guard and unrelated changes are rejected.
- [ ] All applicable repository CI, source/board/transport/browser checks pass.

## Checks and gates

- Targeted: node --test tools/oge-task7-input-minimal.test.cjs.
- Existing OGE course minimal CI already discovers this filename.
- Required preservation checks: tools/oge-learner-entry.test.cjs and
  tools/oge-course-algebra.test.cjs, with their existing complete comparisons.
- Required navigator checks: existing public-navigator preservation,
  public_navigator_bindings tests and all browser shards.
- Required integrations: all applicable existing OGE/native/board/shared
  transport, course and publication workflows triggered by this change.
- Required static review: exact changed-file set and whitespace/syntax checks.
- Final gate: OGE7_ZERO_DENOMINATOR_RECOVERY_OK only after those checks pass.

Preparation evidence: the proposed synchronous test bodies were run in V8 with
small CommonJS/assertion/element adapters. The original source gives 3 pass,
12 fail; the candidate gives 15 pass, 0 fail. The failures on the base include
the new strict receipt, which correctly requires the candidate guard. This is
not a claim that Node's runner, node:vm, JSDOM or a browser ran locally.

The separate DOM test is mandatory, not skipped. Local Node/JSDOM/browser and
git commands were unavailable after the execution service disconnected.
Their status is NOT RUN locally; CI must establish the actual candidate result.
No failed or unavailable check is converted into a pass.

## Review plan

- SMALL rationale: a bounded input guard; no architecture, persistence,
  server, deployment or runtime-interface change.
- Focused technical/mathematical review: completed independently in the audit.
- Learner interaction: existing neutral invalid-input path and wording retained.
- New trainer design consultation: not applicable.
- External provider review: not performed and not required under the standing
  owner policy; no external approval is claimed.
- Exact candidate review and CI evidence are recorded in the PR.

## Risk and rollback

The primary risk is accidental grammar or credit-policy expansion. The old
grammar and grading callbacks remain intact and are checked with valid,
invalid and wrong-number controls. Existing generic wording does not explain
the zero denominator specifically; improving that wording is a separate task.

Rollback is a normal revert of this task's runtime/test/receipt changes,
followed by existing validation. There is no migration or data rewrite.
Do not rewrite history or roll back unrelated work.

## Permissions

The owner requested continuation of the audit and course improvements in the
current conversation; this scoped branch and Draft PR were prepared under that
request. The later AGENTS.md supplied by the owner in the same session now
requires a separate explicit owner authorization before merge or deployment.
This later task boundary overrides the repository's standing release wording.

MERGE HOLD: finish validation and report the exact current Base/Head. Do not
merge, enable auto-merge or deploy PR551 until the owner authorizes that pair.
The completed permission and release for PR549 do not authorize this candidate.

Immediately before a later authorized merge, read authoritative remote main.
If it differs from the owner-authorized base, stop; prepare only a read-only
virtual composition and its evidence, and obtain a new owner authorization.
Do not automatically repair or synchronize the branch after such drift.

## Execution record

- Actual branch: fix/oge7-zero-denominator-20261111
- Actual base: 19811cc15a33d63fc0fcc0b6a11c34863ec64d03
- Head and PR: recorded in the PR metadata and final handoff.
- Commits: source/tests/task, then exact navigator source-binding receipt.
- Initial evidence: V8 candidate 15 pass / 0 fail; mandatory DOM test not run
  locally; full Node/CI/browser evidence pending when this document was authored.
- Scope deviations: none.
- Source-binding updates identify source bytes only; they do not grant
  mathematical, source-review or publication approval.

## Required handoff

The PR records Task, PR, Base, Head, Gate, Tests, Failures, Not run, Scope
deviations, Recommendation and Next user decision. Release records additionally
identify authoritative current main/head, drift handling, deployment and live
verification, without reusing stale validation.

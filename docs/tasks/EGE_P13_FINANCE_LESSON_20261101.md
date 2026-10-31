# Financial modelling in profile EGE task 13

## Identity

- Task: `EGE-P13-FINANCE-LESSON-2026-11-01`
- Owner: MathExam project owner
- Date: 2026-11-01
- Base branch: `main`
- Base SHA: `a8eb6b26c917c337a3f9672c0b8eb40243f6e6a3`
- Planned/actual branch: `task/ege-p13-finance-lesson-2026-11-01`
- Review level: `MEDIUM`
- Related ADR: no new architecture. This extends the existing ProfileLessons,
  ProfileTaskModels, numeric/choice step and local attempt contracts. ADR0001
  remains Proposed and is not used as an implementation authorization.

## Goal

Help a learner construct a financial model from money movements, distinguish
debt, interest and payment, select the relevant periods, and answer in the
requested quantity and unit. Add the approved independently written content
without changing existing tasks or invalidating saved attempts.

## Context and evidence

- The approved course proposal contains 39 pairs: an explained task and a fresh
  independent sibling. All 32 distinct supplied source tasks have a pair.
  Seven additional pairs cover verified official FIPI loan examples; two more
  official examples already occur among the 32 sources.
- All 78 final answers were independently checked before START. The content
  has 442 intermediate steps. The implementation must preserve their meaning,
  questions, target quantities and units.
- The main course previously has 68 lessons / 408 tasks, including three
  financial lessons / 18 tasks. The extension gives 81 / 486 overall and
  16 / 96 in finance. These are inventory expectations, not gate results.
- Official 2027 documents are labelled drafts. Historical 2026 task 16 models
  support thematic preparation. The live FIPI bank returned HTTP503; no claim
  of complete bank coverage or invented bank GUIDs is made.
- The owner gave explicit START in the current task conversation and declined
  external Claude consultation for this task. This task-specific decision does
  not alter repository policy or constitute an external review verdict.

## Approved scope

### In scope

- Thirteen lessons with three guided tasks followed by three fresh independent
  tasks each. New stable IDs are mapped explicitly; route IDs use hyphens.
- Independently written credit/deposit conditions, explanations, hints, exact
  answers, units and step-specific retry messages.
- Existing model render contract: earned ledger cells, current-period cards,
  two-stage boundaries and selected payment windows. Unknown term lengths
  must not leak through the number or labels of rows.
- A given value may be shown immediately. Computed values become visible only
  after the corresponding accepted step, or after completion. Model help is
  recorded before it is displayed and does not reveal unearned answers.
- Opt-in integer-domain and strict numeric validation for new finance tasks,
  including mixed practice. Legacy numeric behaviour remains unchanged.
- Exact fractions and units in accepted-step history and worked solutions.
- Registration in the main course and task13 navigation, focused mobile and
  desktop styling, mathematical/lifecycle/browser checks and CI integration.
  Existing board wrappers must retain exact canonical asset parity; their
  script/CSS references are synchronized without changing adapters or protocols.
- Reconcile project status against the already completed PR388 release record.

### Out of scope

- A new generator, storage schema, server API, account system or board protocol.
- Replacement of the eighteen existing financial tasks, IDs or step order.
- Changes to legacy standalone financial trainers or printed book editions.
- Investment optimisation, a full FIPI-bank import or a copyright guarantee.
- Merge, auto-merge, deployment, branch-protection or browser-trust changes.

### Files or areas that must not change

- Existing `applied-data.js` task objects and the `state.js` storage identity.
- Existing financial URLs, other course banks, backend and production settings.
- Published `book/oge/2026-10-31/v1/`, `v2/` and their aliases.
- Root repository operating rules and review policy.

## Acceptance criteria

- [x] 13 lessons / 78 unique tasks / 39 source pairs; first three guided and
  last three independent; complete coverage register and official provenance.
- [x] All final and intermediate answers remain mathematically valid, with
  full debt closure and the correct full-term or partial-term payment total.
- [x] New task final answers are integers or finite decimals; nonterminating
  intermediate results retain a usable exact-fraction representation.
- [x] Units are visible beside the answer. Integer constraints and kopeck-scale
  errors are checked without changing old task tolerances.
- [x] Models expose neither future values nor the unknown number of periods.
- [x] Help, retry, reload, preserved draft and independent success behave
  honestly; the previous eighteen task objects and saved step remain intact.
- [x] At 320×900 and 1280×900 the active model is readable, keyboard/touch
  controls work and the document has no horizontal clipping.
- [ ] Existing course gates plus targeted finance checks pass; all failures and
  unrun checks remain separately recorded.

## Checks and gates

- New independent finance mathematics, source coverage, reveal boundaries,
  integer/precision, snapshot and state compatibility tests.
- Full-course, applied, step-solutions, fraction-display, task-first, calm-map,
  calm-state, checkpoint, independent-model and prerequisite regression gates.
- New finance learner journeys at both viewport sizes, plus affected existing
  complete-course/help/checkpoint browser scenarios.
- Syntax, exact changed-file scope, sanitized public handoff and `git diff
  --check`; applicable `profile-start` CI on the published candidate head.
- Final gate marker: `PROFILE_FINANCE_LESSON_OK` after completed verification.
- Physical devices, other browser engines and real-pupil learning outcomes are
  not established by simulated browser checks.

## Review plan

- MEDIUM: bounded fixed content and opt-in product behaviour within existing
  contracts; no persistence/backend/authorization boundary changes.
- Trainer design consultation applies in ordinary policy. For this task the
  owner explicitly declined external Claude consultation in the START message:
  `NOT_RUN_BY_OWNER_REQUEST`. No external request or verdict is claimed.
- The previously prepared content received independent mathematical review.
  The ready implementation receives focused internal review of code, pedagogy,
  validation, earned-value disclosure and old-session compatibility.
- Required remote handoff hygiene: only public code, independently written
  content and derived verification. No private lesson boards, names, personal
  documents, credentials or machine-specific absolute paths.
- A review of a previous draft is not an exact-head release approval. Any
  actual external verdict, if separately requested later, must identify the
  provider, PR, base/head, verdict and verifiable source/date.

## Risk and rollback

- Risks: showing future answers through tables or row count, rounding a
  fractional principal, confusing units, moving a saved step, or counting
  assisted practice as independent success.
- Controls: explicit authored reveal milestones; independent accounting
  oracles; exact fractions; opt-in constraints; immutable legacy snapshots;
  resumed-attempt and fresh-independent browser scenarios.
- Before merge, rollback is closing the unpublished Draft PR. After a
  separately approved release, a bounded revert can remove the new lessons and
  opt-in changes. No storage migration or destructive data operation is needed.

## Permissions

- Current-task owner START: **yes**
- Branch creation, local commits, push and Draft PR: **yes**
- External Claude consultation: **declined by owner for this task**
- Merge, auto-merge, deployment: **no**
- Force, reset, rebase, non-fast-forward merge, TLS bypass: **no**

## Execution record

- Actual branch/base: as specified above; authoritative remote main was
  unchanged at task start and the new worktree was clean.
- Actual PR: [Draft PR390](https://github.com/ladynata-cloud/math-exam-fipi/pull/390).
  The current head and authoritative CI outcome are recorded in its body.
- First published head `75e5a7a33d7f512cb1a61708be3d4986d1ed428b` had two CI
  integration findings: canonical asset references in seven board wrappers and
  an aggregate browser inventory missing the finance module. The follow-up
  synchronizes those dependencies while retaining the exact equality gates.
- Replacement-head CI additionally found an event-order gap in an unchanged
  expressions-board test: editing began before the dialog close event restored
  focus. The test-only follow-up adds a bounded event/focus prerequisite and
  preserves all original input/synchronization assertions; production and
  protocol files remain unchanged.
- Verification and focused review: `docs/reports/EGE_P13_FINANCE_LESSON_20261101.md`.
- Tests passed, failed and not run: recorded separately in that report.
- Scope deviations: none; owner's task-specific Claude refusal is recorded above.
- Local content/model acceptance checks are complete. The last checkbox stays
  open in this prepublication record until replacement-head CI passes; its
  authoritative outcome is recorded in the Draft PR without a status-only commit.

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

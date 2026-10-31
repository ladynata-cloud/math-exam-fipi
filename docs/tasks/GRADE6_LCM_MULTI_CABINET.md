# MathExam task specification — LCM of three or more numbers

## Identity

- Task: `GRADE6_LCM_MULTI_CABINET`.
- Owner: MathExam repository owner.
- Date: 2026-11-01 (Asia/Novosibirsk); scope prepared on 2026-10-31.
- Base branch: `main`.
- Base SHA: `a8eb6b26c917c337a3f9672c0b8eb40243f6e6a3`.
- Planned branch: `feat/grade6-lcm-multi-20261031`.
- Review level: `HIGH`.
- Related work: `VILENKIN6_CLARITY_CABINET_20261030`,
  `GRADE6_NOK_NOD_BOARD`, `GRADE6_NOK_NOD_ADVANCED_ONLY`.
- ADR0001 remains `Proposed`; the implemented textbook task contract is
  established by code and tests, not by treating that ADR as accepted.

## Goal

Extend the existing grade-six cabinet with LCM of three, four and five positive
integers, using successive two-number LCMs and prime factorizations. Preserve
all earlier GCD/LCM materials, textbook cards, saved work and legacy modules.
The learner must carry the intermediate LCM forward, account for every input
number and distinguish the least common multiple from a larger common multiple.

## Context and evidence

- The owner approved the prepared plan with an explicit current-conversation
  `START`. That permission covers implementation, local gates, commits, push
  and a Draft PR, but not merge or deployment.
- Initial scope inspected `4a90592077934d9a6d8a617b4afa50938798efb2`;
  authoritative `main` advanced only through book PR388 to the base above.
  No Vilenkin, number-theory or operating-rule files changed between them.
- Source unit 8 already contains four three-number LCM cards, 2.97 д–з.
  Their data remain byte-identical. The earlier number-theory trainer has a
  closed two-number state contract and is outside this change.
- The existing `vilenkin6-textbook` adapter provides one cloud attempt per
  content ID, source revision validation, retained steps, help accounting,
  history and ownership checks. The earlier 27-module bank remains separate.
- The teacher page displayed its login form. No real learner profile, private
  records or cabinet settings have been read or changed in this task. The
  intended grade-six profile must be identified after owner sign-in; matching
  first names alone is insufficient.
- PR378 is merged as `7547ea565871e09ee02b632761f27bc088bd5c8a`;
  PR388 is merged as the current task base. GitHub metadata is evidence of
  merge, not an independent certificate of their complete production release.

## Approved scope

### In scope

- Add one separately labelled MathExam author supplement, unit 1008 related to
  textbook point 8, through the existing task, answer and persistence APIs.
- Three worked conditions and 16 approved practice conditions are available
  through both methods. There are 38 guided cards, not 38 distinct conditions.
  Six fresh conditions (three/four/five numbers for each method) provide the
  planned independent check: 44 new cards in total.
- Successive method: exactly one step per accumulator/next-number pair.
  Factor method: each factorization, the largest required multiplicity of
  each prime, then the final product. Treat 1 as having no prime factors and
  retain repeated input numbers without adding redundant factors.
- Keep condition, accepted steps and draft visible/retained; use readable
  numbers, green actions and contextual help offered after two errors.
  Explain a larger common multiple without disclosing the correct answer.
- Separate saved attempts for the two methods. Switching must not replace a
  managed task's canonical identity or silently erase its accepted work.
- Preserve the original 194 source cards, their order, identifiers, revisions
  and all A–D source JSON bytes; preserve the 378 other catalog rows and the
  legacy 27-module course. Keep the textbook coverage claim at 194 selections.
- Retain direct access to source unit 8, including 2.97 д–з, and relevant
  prior GCD, two-number LCM and prime-factor support.
- Reconcile project status in this task. After sign-in and authorized
  publication, add the material only to the intended existing cabinet and
  verify reload and the learner view. This operational step remains separate
  from the unpublished code preparation gate.

### Out of scope

- Completing the whole textbook, unrelated courses, books or neighboring PRs.
- Accounts/passwords, deleting or migrating attempts, other learner settings.
- A paid AI dialogue, provider activation, purchasing credits or billing changes.
- A new board protocol, backend authorization/storage/schema, generator model
  or state migration. These are not needed for this finite authored bank.
- Merge, auto-merge or deployment without separate exact-base/head permission.

### Files or areas that must not change

- Existing content IDs, state meanings and `nt-*` number-theory identities.
- Original textbook A–D JSON and historical review/coverage evidence.
- Backend implementation, database schema and board compatibility contracts.
- Published immutable book editions, private pupil data and unrelated files.

## Acceptance criteria

- [x] All original 194 manifest records and four source files match the base.
- [x] All 44 new answers and 203 steps pass independent arithmetic checks.
- [x] Both methods cover three, four and five numbers, including 1, repeated
  numbers, unchanged intermediate LCM and an intermediate/final value over 200.
- [x] Author tasks have no invented textbook number, page or PDF citation.
- [x] Real browser/API tests preserve drafts and steps on reload and a second
  device; separate method attempts retain the earlier work.
- [x] Wrong larger common multiples fail; two errors offer help; assistance
  persists after hiding help or reopening a task.
- [x] Fresh checks are disjoint from all demonstrated conditions. Answer-only
  independent success is not claimed as proof of the method actually used.
- [x] Read-only teacher viewing and another learner cannot change the attempt;
  the original 194 saved synthetic attempts survive unchanged.
- [x] The condition and current action fit at 320, 390 and 1280 px, with
  representative screenshots actually inspected.
- [x] Relevant original gates remain passing, and new focused checks are included in CI.
- [x] Exact-head review, merge/deployment and real cabinet assignment are
  reported separately; no missing check is described as passed.

## Checks and gates

- Required tests: original textbook/source/coverage, managed/standalone DOM,
  learning backend/helper/legacy route, existing real two-origin cabinet
  browser gates, new LCM arithmetic/identity and full browser retained-work
  gate. Keep the original offline package byte-identical.
- Required static checks: generated catalogs `--check`, changed JavaScript
  syntax, exact baseline hashes, sanitized diff and `git diff --check`.
- Manual checks: actual screenshots at the three widths; after publication
  and owner sign-in, the intended profile's retained route/history.
- Preparation gate marker: `GRADE6_LCM_MULTI_PREPARATION_OK` only after local
  implementation and relevant technical checks pass. This is not release
  approval or evidence that a real cabinet has been configured.
- Intentionally not run: production mutations before separate release
  authorization; external provider calls without available authorized access.

## Review plan

- HIGH because the UI is integrated with retained cloud work; no new storage
  contract is introduced.
- Trainer design consultation: applicable. Before implementation, the approved
  scope, school-language sequence, retained-work requirements, independent
  checks and typical LCM errors were prepared. Claude consultation is
  `UNAVAILABLE`: no authorized design-call integration is exposed; the
  repository also records a prior insufficient-credit provider hold. There
  was no request, response, recommendation or external verdict for this task.
- Ready-result review: independent internal arithmetic, focused UI/code
  review and real browser checks with synthetic accounts. External ready-result
  review remains required or needs an explicit owner exception with rationale.
- Internal reviews are not Claude review or a provider release verdict.
  Synthetic checks do not establish learning gains with actual pupils.
- Sanitized handoffs contain only this public patch and derived evidence; no
  names of pupils, real identifiers, credentials, private documents or
  machine-specific absolute paths.
- Any eventual external verdict must identify provider, PR, base, exact head,
  verdict and verifiable source/timestamp. Material head changes invalidate it.

## Risk and rollback

- Risks: accidental old identity changes, misleading source captions,
  false independent credit, or replacing a task while it is being saved.
- Controls: immutable base oracle, separate author IDs, strict source tagging,
  six fresh checks and real two-origin/SQLite retained-work scenarios.
- Before release, rollback is closing the Draft PR. After separately
  authorized release, an owner-approved revert can remove the new entry points
  while retaining all database records. New author attempts would remain in
  history; current source restoration would require restoring the matching
  content revision. No database deletion or old-attempt rewrite is involved.

## Permissions

- Current owner `START`: **yes**.
- Branch creation, local commits, push and Draft PR: **yes**.
- Merge, auto-merge and deployment: **no**, unless separately authorized.
- Permission does not include sending messages to pupils or other people.

## Execution record

- Continuation on 2026-11-01 uses the owner's renewed START for this same task:
  restore the existing PR, close the missing-factor explanation and quick
  review-navigation gaps, and refresh technical evidence. The original
  source/content/storage boundaries and separate release permissions stand.
- Actual branch: `feat/grade6-lcm-multi-20261031`.
- Actual base: `a8eb6b26c917c337a3f9672c0b8eb40243f6e6a3`.
- Head, PR and exact-head CI: recorded in the Draft PR to avoid recursive
  status-only commits.
- Local results, failures, unrun checks and deviations:
  [verification report](../reports/GRADE6_LCM_MULTI_CABINET_20261101.md).

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

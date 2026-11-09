# ОГЭ №6–12: прогноз, опыт и самостоятельный перенос

## Identity and authorization

- Owner: MathExam owner; executing agent: Codex.
- Date: 2026-11-09, Asia/Novosibirsk.
- Base: `main`, `463d6bf56fc8f1f944da8d237102f77888711e79`.
- Branch: `improve/oge-active-trainers-20261109`.
- Review level: HIGH, because the bounded learning sequence retains new local evidence.
- START: current owner instruction «обнови сами тренажеры, используя все лучшее что есть в курсах Геогебра, Методайзера, Бриллиант, Образавр».
- Release: [standing owner authorization](../OWNER_RELEASE_AUTHORIZATION.md), and the current conversation's publication authorization. No new per-PR permission is required after applicable checks.

## Goal

Update the seven existing public OGE algebra trainers, numbers 6 through 12,
with a short usable learning sequence: commit a prediction, change a mathematical
model, explain the observation, then solve different original problems. Keep the
normal task bank and its results authoritative and available at all times.

## Evidence and design

Existing `oge-course-algebra.js`, Task6Labs, equation discovery and Task11Lab
already provide models, often inside help and with results visible immediately.
The missing sequence is an initial prediction and a checked transfer afterward.
The design reuses the site's existing optional exploration and bounded lesson
approach; it is not a new public platform, backend, account protocol or task bank.
ADR0003 is Accepted for OGE; ADR0014's linear pilot is a scoped implementation
example, not authority to claim platform-wide approval.

Prior audit conclusions used here: action-specific feedback and a new example
after help; prediction followed by changing a model; acceptance of equivalent
numeric records; an individual answer before discussion and a final independent
attempt. These are MathExam adaptations, not claims of reproducing whole courses
or of having re-audited their products. No third-party exercises are copied.
Independent in-session read-only design review of all seven existing trainers
identified domains, equivalent answers and existing storage boundaries before
implementation. External provider consultation was not performed under the
standing waiver. Real-learner effectiveness is not established by automated QA.

## Scope

- Three local static assets: original lesson data/models, renderer and styles.
- Exactly seven existing trainer entrances, with a reversible optional block.
- Original fractional, coordinate, root, equation, probability, function and
  formula experiences; targeted feedback; multiple equivalent correct choices
  where mathematically appropriate; exact rational numeric comparison.
- New local mini-lesson evidence is separate from native task scores. Model use
  never awards native credit or penalizes the existing task. A corrected or
  helped answer is distinguished from a first-attempt answer to a new condition.
- Existing shared/managed frames keep their current synchronized interfaces;
  an unsynchronized new local block must not appear inside them.
- Correct Task7’s existing fraction explanation at integer endpoints, exact finite
  decimals and repeating decimals. Its bank and grader stay unchanged; a strict
  inverse fixture preserves the historical full-page hash.
- Strict historical-source preservation, required dependency closure updates,
  source bindings, regressions and actual browser evidence.
- No migration/deletion of existing results, native TID/TYPE_IDS changes,
  replacement of existing graders, backend edits, new public section or analytics.

## Acceptance

1. The pupil records a prediction before the model reveals its result; changing
   a control updates the mathematical model and clears obsolete concept feedback.
2. A wrong prediction is informative, not a dead end. Specific feedback explains
   the mathematical distinction; equivalent valid choices are both accepted.
3. A new independent problem has different data and answer from the preceding
   worked problem. Help and corrections remain visible in the mini-lesson record.
4. Repeated submits cannot duplicate credit. Reload restores the current draft;
   different tabs cannot erase earlier attempt events. Denied storage warns and
   keeps the current work in memory, without claiming durable saving.
5. Negative radicands, zero denominators/divisors, exact fractions, graph breaks,
   equality-preserving operations and probability's ordered outcomes are tested.
6. The seven native banks, graders and historical progress remain unchanged.
7. Actual Chromium input/click scenarios and screenshots at 320/360/1280 cover
   the new sequence, help-to-new-task transfer, restoration and native continuity.

## Checks and review

New exact-math and event/DOM regression tests; strict seven-HTML normalization;
retained trainer gates; actual browser gate; book dependency closure and navigator
binding checks; `git diff --check`. Independent mathematical and technical review
of the ready result is required. Pass, failure and not-run evidence will be
recorded in this task's PR, including exact base/head and deployment identity.

## Risk and rollback

Risks are false independence labels, hidden domain mistakes, lost drafts and
interference with native/shared interfaces. Separate append-only local events,
strict scoped rendering and preservation tests address these boundaries.
Rollback is an ordinary revert of this task's source/includes/bindings together;
retain new event keys and all native storage, with no destructive migration.

## Baseline reconciliation

The prior project-status narratives are historical. PR501 and PR506 have been
merged and published; current main is the base above. Their public root lesson
matched its reviewed bytes, and all four post-merge workflows on this base
completed successfully. This task does not relabel any unfinished parallel
course PR as released.

## Execution

Implementation is complete. Independent code and mathematical review accepted
all 58 practice keys, model domains, event semantics, keyboard focus, select
restoration and the corrected Task7 fraction explanation. Local checks passed:
113 new math/DOM/preservation/fraction regressions; 668 retained algebra checks;
37 course integration checks; learner-entry preservation across 147 pages;
12 generator checks and immutable book verification. The exact candidate book
closure adds only the three local assets (232 to 235 files).

An initial over-parallelized local retained-suite run terminated two workers
without assertion diagnostics; both unchanged suites passed sequentially (17
checks). The new workflow runs these memory-heavy suites sequentially. This is
reported as an initial execution failure, not as a mathematical defect or a
reason to remove tests.

Source checkpoint: `5a6a5573cc8e0ff6ceca3a9d5cf88e16c64f0e95`.
Navigator bindings explicitly update only the seven named HTML pages. Additional
strict inverse witnesses account for the exact optional closed summary and
include triple while preserving the original browser mathematics fixtures.

The first actual Chromium run exercised all seven routes at 320/360/1280.
All 21 shared/embedded/managed cases and three public Task7 journeys passed.
The other 18 journeys stopped at the exact native subtree comparison: trace
inspection showed only empty style attributes introduced by screenshot caret
hiding; controls and existing storage matched exactly. Screenshots now preserve
the caret, and the unchanged complete-subtree assertion remains in force.
Independent visual inspection also found a real desktop Task8 header overlap.
The scoped layout fix and actual overlap regression must pass before release.

Final actual Chromium and production verification are pending. Source review,
Node/JSDOM tests, CI browser evidence and public browser checks are distinct.
Physical phones, Safari, external-provider review and a real-pupil pilot are not
claimed. Final release evidence and standard executive/base-drift fields belong
in the task PR.

## Base-drift composition

During acceptance, main advanced to `39705bc5669acb5b97a33c72f5badc044faff298`
through PR493 (Vilenkin SEO entrances) and PR503 (Merzlyak learning). The only
intersection with this task was `assets/assistant/page-rollout.json`. The merge
retains all current-main routes and history, the four Merzlyak bindings, and
the seven reviewed OGE bindings. No OGE HTML, model, renderer, native bank or
browser harness was changed by this composition.

History-preserving source checkpoint: `6e7d871faae7e64124565300f8e5edea67089fe0`,
parents `53d39492220de50ae57d9b75c7c0f64860fffe69` and the current main above.
The official binding tool performs a provenance-only refresh against that
committed composition, with an empty changed-path list and no HTML writes.
Affected navigator, SEO, book-closure and scoped OGE gates are repeated; the
final PR records exact candidate/CI and public-release evidence.

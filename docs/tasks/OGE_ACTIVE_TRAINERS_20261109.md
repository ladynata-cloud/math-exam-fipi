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

Implementation and exact candidate validation are in progress. Source review,
Node/JSDOM tests, CI browser evidence and public browser checks are distinct.
Physical phones, Safari, external-provider review and a real-pupil pilot are not
claimed. Final release evidence and standard executive/base-drift fields belong
in the task PR.

# Task9: interactive help for every equation family

## Identity and owner direction

- Date: 2026-10-21 (Asia/Novosibirsk).
- Base main:03a6d465416703fcc72a7ce471afb2ad2f3031fd (published PR283).
- Branch:fix/task9-transfer-all.
- Review:MEDIUM, bounded frontend extension of existing exact arithmetic,
  signed-term manipulation and contextual optional help; no platform protocol.
- The owner reports that transfer stops working in the next example, asks for
  every linear and all other task9 families, specifically when requesting help,
  and requests analogous interactive actions for the other equation methods.

## Evidence

The bank contains135 tasks (105 prototypes and30 demo examples),16 families,
and14 visible generator routes backed by15 generators. PR283 provides transfer
in84 bank tasks: L,LB,LSQ,LF,PROP. Other families lack it. Its step completion
locks the cards as well as answer inputs, explaining grey cards in the supplied
screen. The generator renderer also contains two references to undefined
badge/no variables which prevent its normal UI flow.

## Approved scope and acceptance

- Every equation family has a usable original-equation transfer model inside
  requested help. Generated tasks start with their task and an optional help
  button. Closing/reopening help preserves drafts, models and assistance.
- A card is a complete signed term: a monomial, bracket, square, product or
  fraction. Crossing equality negates its outer sign exactly once. Reverse
  crossing restores it; same-side, cancelled and invalid moves do nothing.
- Keep the original numerator/denominator structure, brackets, exact rational
  coefficients and domain. Do not silently clear denominators, expand brackets,
  simplify a task or reveal its roots just to construct a model.
- Instructions match the active action: linear collection, quadratic
  collection, or exploration of the original equation. An exploratory model
  must not imply that unrelated coefficient/denominator fields are its output.
- Completed-step cards remain explorable, but accepted answers/checks stay
  locked. Exploration before the whole task is complete records assistance;
  subsequent exploration cannot retroactively alter completed-task credit.
- Optional nested discovery models use the current task's values: distribute
  a factor, expand a square, find a common multiplier, pair cross-products,
  inspect the two signs when squaring, explore a zero product, identify signed
  coefficients, or test the original denominators. Give one clear action and
  no automatic final-answer entry or award.
- Preserve mathematical checkers, bank IDs/content, grading contracts, exam
  behavior and progress compatibility. Fix the two broken generator references.
- All135 bank tasks and15 generators receive mathematical coverage; real UI
  journeys cover all16 families and14 visible generator routes, next-task
  transitions, help visibility, retained work and completed-step interaction.

## Boundaries

This task changes task9 and its focused tests/workflow/documentation. Other
trainers, cabinet synchronization, authentication, backend, source-bank
expansion and trial-signup assignment are outside scope. Claude API remains
deferred by the owner's current instruction; no paid call or provider approval
is claimed.

## Verification and review

- Independent exact substitution compares original L-R and domain with the
  movable representation across the bank and deterministic generated samples.
- Focused learner tests check only outer-sign changes, reverse/cancel,
  assistance/progress, no auto-fill, and all newly introduced discovery actions.
- Browser CI uses real controls, mouse drag, keyboard and mobile tap alternatives
  with mobile/desktop screenshots and runtime errors. No local browser runner.
- Run affected existing task9/clear-action, algebra and course gates. Update an
  old locking assertion only for the explicitly changed completed-step behavior;
  retain its grading and no-double-award checks. Do not weaken unrelated gates.
- Independent review covers exact mathematics, domain, pedagogy, input meaning,
  state retention and release identity on the final head.

## Risk, permissions and release

Risks: negating only part of a compound term, losing forbidden denominator
values, confusing an exploratory equation with a later step, stale model state,
or changing assistance credit. Keep transformations separate from grading and
preserve exact immutable source structure. Rollback is a normal frontend revert;
there is no data migration.

Current owner requests authorize implementation; standing explicit cloud
publication permission authorizes normal reviewed merge and deployment. Verify
authoritative main, exact head, checks, virtual/merged tree and parent, then
Pages and public assets/live UI. No force, rebase, admin override or status-only
follow-up release. Record release evidence in the PR and reconcile project
status at the next substantive task.

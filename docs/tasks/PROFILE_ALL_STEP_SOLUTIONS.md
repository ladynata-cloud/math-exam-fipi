# Step-by-step explanations throughout the profile course

## Identity and goal

- Owner: course owner; date: 2026-10-10.
- Base branch: main; base SHA: `54556ab694b147207445face010c98595ec77b9d`.
- Branch: `feat/profile-all-step-solutions`; review level: MEDIUM.
- Extend the existing worked-explanation presentation; no new trainer archetype.

The owner asked where the solution to the similar-triangle area problem was
explained, then explicitly requested that everything be step by step. Provide
a visible worked explanation for the current task throughout the existing
thirteen-position course, with one action revealed at a time and earlier work
kept on screen.

## Context and evidence

The screenshot task has corresponding sides in ratio 2:5 and smaller area 12.
Its diagram hint only identifies corresponding sides. The correct larger area
is 75; the area ratio must be squared before forming the proportion.

The current data supplies prompt, hint, why and answer for every authored step:
348 tasks across 58 exam topics plus 60 prerequisite/trigonometry tasks, 408 in
total. Three right-triangle tasks already have detailed staged walkthroughs.
Other diagrams expose only graphical hints. Some seventeen one-step exercises
have especially short explanations and need explicit intermediate calculations.

The implemented assistance and draft contracts in app.js, state.js and
checkpoint.js are authoritative. Accepted ADR 0010 provides relevant assistance
principles, but this task does not extend account, board or server architecture.

## Approved scope

- Reuse existing task-specific teaching steps in an accessible worked-solution
  viewer, retaining explanation, calculation and intermediate result.
- Prominent same-task entry in practice, plus staged examples, completed-task
  solutions and optional checkpoint help. Keep the exam-first catalogue.
- Six detailed similarity derivations and explicit expansions for seventeen
  shortest exercises. Ordinary fractions; red extreme and grey mean terms in
  proportions; drawn cross; unknown product on the left; unknown-factor rule.
- Preserve the three existing detailed sine/cosine/tangent explanations.
- Preserve draft, task identity, accepted answers, help accounting, stale-session
  guards and cleanup. Do not write a new persistence schema.
- Add focused content and learner robots; run relevant existing regression
  tests and the full profile CI. Refresh changed asset URLs.

Excluded: other course sites reached through external links, new exam tasks,
changes to mathematical targets, account/authentication/server contracts,
dependencies, pupil history migrations or changes to real pupil records.

## Acceptance criteria

- Every task in the existing profile bank has a meaningful worked explanation.
- No worked answer is inserted before assistance is recorded when help is
  optional; a stale session cannot expose a solution for an unmarked task.
- Each reveal adds one step and preserves previous steps; opening help does
  not clear the current draft or award independent credit.
- The screenshot problem explains the squared area ratio, gives
  4/25 = 12/S, then S · 4 = 12 · 25, S · 4 = 300 and S = 300 : 4 = 75.
- All 13 positions are exercised by synthetic learner journeys, including
  mobile, keyboard, return/reload and assistance accounting.
- Fractions preserve mathematical meaning; authoring markup is rendered
  safely; controls remain legible at a 360-pixel viewport.

## Checks and review

- Required: new all-bank solution-content tests, new learner browser journeys,
  existing triangle explanation and relevant calm/checkpoint/independent gates.
- Static checks: syntax for changed JavaScript, `git diff --check`, scoped diff.
- Focused independent source, mathematics and accessibility review; explicit
  risks/rollback. MEDIUM because this is a recoverable presentation extension
  of existing teaching data and help contracts, not a new storage/runtime core.
- External provider review is not claimed. Review handoffs include public code
  and synthetic fixtures only, with no credentials or real pupil data.
- Final gate: PROFILE_ALL_STEP_SOLUTIONS_PASS after exact-head profile CI and
  published page/asset verification, not merely a local preview.

## Risks and rollback

Main risks: a staged list that still omits reasoning, altered meaning during
fraction formatting, unintended early answers, lost draft, or help counted as
independent work. Explicit short-task expansions, authored similarity solutions,
source review and behavioral robots cover these risks.

Rollback: revert this task's presentation/data assets and version references.
The old bank, storage schema and learner data remain compatible; no migration
or account operation is involved.

## Permissions

The current instruction to make everything step by step and the standing cloud
publication instruction authorize scoped implementation, commits, Draft PR and
publication after verification. Recheck authoritative main and bind review and
CI to the exact composed tree before merge. No force/reset/rebase, disabled
checks, administrative overrides or real pupil writes. Do not claim new owner
approval or external review from a copied task-file marker.

## Execution record

- New content/DOM gate: 7/7 passed, covering all 408 tasks, retained one-at-a-time
  history, assistance before open/next/reopen, final-answer equality, numerical
  and symbolic grouping, and HTML exponents.
- New browser robot: 42/42 journeys across all thirteen positions, six similarity
  types, plan and prerequisite practice, at 360/1280 pixels. Extra checks cover
  examples, checkpoint, stale practice/checkpoint tabs, post-answer help,
  keyboard, overflow and preserved drafts. No runtime errors or failed assets.
- Existing triangle explanations: 6/6 journeys; independent models: 8/8;
  checkpoint/map unit tests: 38/38; calm learner robot: four personas, 190/190
  checks; exam-first entry/repair browser gate passed.
- Independent mathematical review checked all 23 new explicit derivations.
  Reviewed mobile/desktop similarity screenshots and the longer motion example;
  the worked-solution button is above the drawing and steps remain readable.
- Source review found unsafe generic conversions involving powers/function
  arguments. Fixed by leaving ambiguous expressions unchanged; regression
  fixtures preserve grouping and HTML superscripts. Numeric fractions and
  explicit structured proportions remain stacked.
- Initial test-oracle mismatches involved locale thousands separators and
  comparison of a whole numbered hint after its deliberate step split. The
  final tests normalize only grouping spaces and require each hint segment in
  its original order; no mathematical, assistance or retention gate was removed.
- Syntax and whitespace checks passed. Exact committed review, full profile CI
  and public deployment/asset verification remain publication gates.
- Automated learner fixtures establish interface behavior, not actual learner
  outcomes. The existing 408 solutions were made accessible; this is not a claim
  that every authored explanation was rewritten from scratch.

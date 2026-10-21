# Standalone stereometry: task first and condition-bound figures

## Identity

- Date: 2026-10-22 (Asia/Novosibirsk).
- Base: main, `8378a4dda077742ecfc1ce9e4b24f465621429e8` (EGE PR295).
- Planned branch: feat/stereo-task-first-2027.
- Review level: HIGH, because retained progress and stale-tab writes are involved.
- Owner: requested separate geometry10–11 author courses, visible figures and
  progressive explanations, linked as supplements to profile EGE.

## Goal and evidence

Make the existing standalone Atanasyan course usable from a clearly stated task:
show a mathematically faithful, rotating figure immediately and offer optional
same-page help, preserving the learner's work. Existing coverage is99 mapped
textbook points,39 learning units,38 original task families and19 proof chains.
This is not a complete exercise-by-exercise textbook course. Full Atanasyan,
Merzlyak and Pogorelov geometry10–11 PDFs have been requested from the owner.
The three author courses remain distinct; existing7–9 courses are not renamed.

## Approved scope

- Retain existing mathematics, task generators, answer parsing and course/source
  data. Build figures from the actual condition, never from answer fields.
- Match numeric figures to all38 families and proof figures to all19 conditions.
- Keep final/step drafts, accepted work and numeric/proof camera states separate.
- Offer explicit task input labels, nested help and conservative stacked fractions.
- Preserve legacy stages, exports/imports, progress identity and exam bridges.
- Reject a known stale unit revision before grading/writing; preserve local drafts
  for explicit recovery without merging them into a different condition.
- Retain honest assistance/familiar-condition credit. Opening help cannot confer
  an independent solution. Written proof steps must state their justification.
- Preserve the existing safe return links from the profile route.
- No copied textbook publication, new full-author banks, server/auth/protocol
  changes, payments, or unrelated OGE/EGE redesign in this PR.

## Acceptance criteria

- Task, essential givens and condition-bound model are visible before help.
- Each input says what to find. Help can be opened/closed without losing models,
  camera, final/step answers or completed reasoning.
- Labels and controls are readable at320px; models support touch and keyboard.
- Numeric and proof figures are independently checked against their givens;
  schematic or finite-window limitations are stated on the figure.
- Stale-tab writes cannot replace an observed newer revision or restore
  independent credit after help. Old drafts remain available to copy.
- Existing source-bank bytes, mathematical keys and exam bridge behavior remain.
- Published runtime files match the exact reviewed build.

## Checks and review

- Existing stereometry mathematics and regression checks; new numeric/proof
  geometric invariants, actual-renderer DOM, fractions and state tests.
- Profile Atanasyan bridge contracts and retained browser journeys.
- Cloud browser journeys for all existing units, numeric/proof models, saved
  work, two-tab conflict recovery and mobile/desktop screenshots.
- Independent source/math review and actual screenshot review on the final tree.
- Build determinism, syntax and diff checks. Local Chromium launch is host-blocked;
  actual browser verification runs in cloud CI, not represented as locally run.
- Paid Claude consultation/review remains deferred by the owner's explicit
  conversation decision. No paid call or Claude approval is claimed. Independent
  review plus full relevant gates apply; synthetic checks do not prove learning gains.
- Final gate: STEREO_TASK_FIRST_OK after exact publication verification.

## Risks and rollback

Risks: figure/condition mismatch, revealing an answer through a label, draft loss,
false independent credit and compatibility of saved progress. Existing version1
identity and data fields remain; additive UI state is sanitized. Revision checking
detects known stale state and is not a transactional cross-tab storage protocol.
Rollback uses an ordinary reviewed scoped revert; retain/export learner progress.

## Permissions and execution

The owner requested cloud implementation and repeatedly authorized publication
of all course updates. Branch, commits, PR, ordinary merge and Pages publication
are covered. No force operation, admin override or destructive change is covered.
Fresh-main guard, exact-head gates and post-publication identity remain required.
Record actual base, head, reviews, CI and release evidence in the PR; reconcile
PROJECT_STATUS with the preceding verified publication as part of this task.

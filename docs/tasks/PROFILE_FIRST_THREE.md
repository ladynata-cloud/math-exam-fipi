# EGE profile: a clear route through positions 1–3

## Identity
- Task: PROFILE_FIRST_THREE
- Owner: repository owner, current conversation
- Date: 2026-10-07 (Asia/Novosibirsk)
- Base branch: main
- Base SHA: 55ea5af0018bc2bb3bad06a384df98ea4cb1211d
- Planned branch: feature/profile-first-three
- Review level: MEDIUM
- Architecture: existing ProfileLessons/ProfileState browser-local course; no new platform archetype.

## Goal
Make the first three profile exam positions usable in Thursday's tutoring lesson:
a small, clear choice of planimetry, vectors and stereometry; a figure matching
the actual task; one question at a time; accepted steps retained on screen.

## Context and evidence
- Existing start course has 36 planimetry and 24 vector exercises, with separate
  guided and independent pools. Its practice screen lacked task-bound diagrams.
- Prior accepted steps were stored but not rendered on subsequent steps.
- Existing stereometry has a broad problem bank and 3D viewer; preserve it as
  further practice while introducing short guided lessons using the existing engine.
- FIPI's official 2026 materials and 2027 project retain positions 1 (planimetry),
  2 (vectors), 3 (stereometry). Official source:
  https://fipi.ru/ege/demoversii-specifikacii-kodifikatory
- The OGE/PreOGE homepage remains the site's main public entry. Profile remains
  available through the tutor laboratory and direct course links.

## Approved scope
- Reuse start course and its saved task identities; add first-three navigation.
- Add exact task-bound SVG models for planimetry and vectors; no arbitrary
  laboratory numbers shown as if they belonged to the current exercise.
- Add eight short stereometry themes, with separate guided/independent tasks
  and rotatable task-bound figures with keyboard alternatives.
- Reduce reading and competing controls, retain accepted work and current draft,
  keep hints, recovery and export available, and preserve prior course links.
- Update focused mathematical/browser gates and scoped workflow paths.

Out of scope: accounts, authentication, board transport/registry, cloud progress,
production learner records, OGE homepage, video generation and other exam positions.
Do not claim complete coverage of every FIPI subtype or automatic pupil reporting.

## Acceptance criteria
- [x] Three clear entry points; legacy practice remains reachable.
- [x] Every route task has a figure matching its condition and a checked answer.
- [x] Unknown answers are not disclosed by the model in independent mode.
- [x] Current action is obvious; prior accepted steps remain through reload/result.
- [x] Models support keyboard and touch; no mobile horizontal overflow.
- [x] Saved attempts, hints, independent freshness and old progress remain valid.
- [x] Existing algebra/trigonometry/course gates pass.
- [ ] Published files match the tested commit; live entry and models checked (release gate).

## Checks and review
Required: profile-start, profile-geometry, profile-algebra, profile-route math
and browser gates; focused new model/stereo/first-three tests; existing profile
package regression; diff/link validation. Independent internal mathematical and
runtime review plus visual inspection. External review is waived by the owner's
standing explicit instruction; no external-review claim is made.
Final marker: PROFILE_FIRST_THREE_OK.

## Risk and rollback
Main risks: condition/diagram mismatch, accidental answer disclosure, overloaded
mobile layout, and old state regression. Existing browser-local storage key and
old task IDs remain unchanged. Revert this release's static content/runtime files
if needed; no database rollback is involved. Old task banks remain accessible.

## Permissions
Current user explicitly requests implementation in the cloud and review later.
Standing user authorization covers publication/merge without separate external
review. Branch/commits/push/Draft PR and publication are authorized; no force,
reset, rebase, admin bypass, production learner write or settings change.
The repository workflow is followed for scope, gates, reviewed head and fresh
base verification; redundant approval prompts are superseded by user instruction.

## Execution record
- Branch: `feature/profile-first-three`; base unchanged at the SHA above.
- Internal independent focused review: help accounting before/after accepted
  answers, independent-session continuation, escaped drafts and retained history
  checked; findings fixed. No external-review provenance is claimed.
- `PROFILE_START_MATH_STATE_OK`: original 18 themes / 108 tasks / 261 steps;
  saved keys, reserved independent conditions and corruption protection pass.
- Existing geometry: all 60 answers independently recomputed; algebra: 48 final
  and 120 intermediate answers checked; numerical input and DOM forms pass.
- `PROFILE_PLANIMETRY_MODELS_OK`: all 36 figures, actual geometry, labels,
  constructions, hint accounting and cleanup pass.
- `PROFILE_VECTOR_MODELS_OK`: 24 figures / 448 scenes, actual vectors, no unknown
  coordinate disclosure, SVG bounds and keyboard controls checked.
- Stereometry: 8 themes / 48 tasks, every final and intermediate answer independently
  computed; all 48 SVGs render; radius/height projection has nonzero area; neutral
  independent view, labels, keyboard rotation and cleanup pass (6/6 tests).
- `PROFILE_FIRST_THREE_BROWSER_OK`: 108 task models, 56 completed journeys,
  including all 48 stereometry tasks; previous steps/current draft/reload,
  independent resume, pre-answer vs post-answer help credit, decimal comma and
  fraction, keyboard/mobile touch, 360/390/1280px, 200% zoom and report pass.
- `PROFILE_START_BROWSER_OK`: original 108 task journeys / 182 checked answers;
  earlier algebra/trigonometry, optional labs, report and board embedding pass.
- `PROFILE_ROUTE_BROWSER_OK`: existing six-block lesson/homework, 39-block
  trigonometry, report, board context, exact-angle controls and recovery pass.
- Existing profile npm regression: all tests pass, including 7,600 generated
  planimetry examples with no discrepancy, junk gate and cabinet safety.
- `BOARD_PICKER_UX_OK`: all 1,440 catalog links and picker/browser checks pass;
  zero production room writes. Initial local check lacked sparse-checkout files;
  materializing their unchanged tracked blobs resolved the fixture-only failure.
- `git diff --check` passes. Desktop/mobile screenshots reviewed; figures and
  controls adjusted for readable labels and compact stereometry interaction.
- No remaining functional failure. Local runtime uses installed Playwright;
  exact-head CI and published-asset verification remain the release gate.
- Scope deviations: none. Main OGE entry, accounts, backend and old trainer
  banks are untouched. New lessons cover the stated basic themes, not every
  subtype of the complete FIPI bank.
- Release evidence, remote head and production commit will be recorded in the PR.

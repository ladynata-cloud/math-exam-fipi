# OGE 2027 author analogue distribution 11–14

## Identity

- Task: OGE_2027_ANALOGUE_DISTRIBUTE_11_14
- Owner: MathExam owner
- Date: 2026-09-26
- Base branch: main
- Base SHA: f1eb11261a32dd30afb614bc563975d1d9865e7d
- Planned / actual branch: content/oge-2027-analogue-distribute-11-14
- Review level: HIGH
- Related work: PR126 (6–10), separate and Ready for review before this task started.
- ADR status: ADR0001 remains Proposed; no acceptance is assumed.

## Goal

Supplement the existing OGE trainers with the four author tasks from the immutable
MathExam full variant. Keep the original banks, defaults, stored progress, and
all unrelated current-main changes intact.

## Context and evidence

Fresh authoritative main is f1eb112, containing PR127 planimetry and PR128 profile
EGE. PR126 was updated to that base, verified, published at 9d171708 and marked
Ready for review before this branch was created from main. Neither PR is merged
by this task. PROJECT_STATUS is an older operational snapshot; its e9347d5 entry
must not be mistaken for current Git main or evidence of deployment of this work.
This task changes no production status or deployment configuration.

Canonical audit, performed before each trainer edit:

| Task | Existing architecture | Added | Exact mathematical duplicate |
|---|---|---|---|
| 11 | 5 matching generators, other modules unchanged | 1 fixed author task | None: mixed-family generator excludes hyperbola coefficient −1 |
| 12 | 40 generators, 7 modes | 1 fixed author task | None: existing voltage/current formulas ask different unknowns |
| 13 | 26 fixed tasks across 5 groups | 1 fixed author task | None: closest intervals have different endpoints or strictness |
| 14 | 9 generators plus 4 teaching quiz prompts | 1 fixed author task | None: decay generator excludes 6-minute period; teaching example uses 30 minutes |

Task13's requested URL is an alias. Its real bank lives in
trainers/oge13-inequalities-series.html. The directly necessary additional
canonical file is included explicitly; the alias preserves the query through a
relative redirect, including offline use. No duplicate bank is created in it.

## Approved scope

Exactly these eight paths:

- trainers/oge-task11-graphs-trainer.html
- trainers/oge-task12-formulas-trainer.html
- trainers/oge-task13-inequalities.html
- trainers/oge13-inequalities-series.html
- trainers/oge-task14-progressions.html
- tools/oge-2027-analogue-distribute-11-14.test.mjs
- tools/oge-2027-analogue-distribute-11-14.browser.mjs
- docs/tasks/OGE_2027_ANALOGUE_DISTRIBUTE_11_14.md

No changes to the source full variant, profile EGE, global site surfaces, board
runtime/server/registry, package files, workflows, deployment or historical test
allowlists. No new global storage schema.

## Acceptance criteria

- Each stable source ID maps to exactly one fixed author record in its canonical
  trainer: task11 sequence 231; task12 numeric 50; task13 option 3; task14 numeric 40.
- Exact author label and non-FIPI disclaimer are visible.
- Deep links select only an exact single valid ID; malformed, duplicate and
  unknown parameters keep the old default mode.
- Old generators, tasks, order, IDs, answers and solutions remain intact.
- Hints and reveal remain recorded across repeat, re-render and filter changes.
  Independent credit is awarded at most once; shown answers cannot become clean.
- Repeat explicitly says fields clear while result/help remain until page reload.
- Graph11 geometry and task13 open/closed endpoints are correct and readable.
- Desktop1280, mobile390, mobile360, real board iframe, and offline file pass
  without overflow, forced clicks, inaccessible controls or unexpected errors.

## Checks and gates

- Focused: node tools/oge-2027-analogue-distribute-11-14.test.mjs
- Browser: node tools/oge-2027-analogue-distribute-11-14.browser.mjs
  with an externally installed Playwright core and Chromium executable.
- Inventory CLI, inventory tests, existing source-variant gate, board tests.
- Static: exact scope, source and unrelated blob identity, UTF-8, inline-script
  syntax, whitespace, security and sanitized handoff.
- Fresh virtual merge against authoritative current main before publication.
- Final markers: OGE_2027_ANALOGUE_11_14_TEST_OK and
  OGE_2027_ANALOGUE_11_14_BROWSER_OK.
- Existing publication/task6 historical failures must be compared to the same
  main base and reported separately; no historical assertion is loosened.

## Review plan

HIGH because mathematical diagrams and grading provenance affect student results.
Independent external exact-head review or a policy-compliant owner waiver is
required before merge. Internal agent review is supplemental, not external review.
Any external review must identify provider, PR, base, head, verdict and verifiable
source or timestamp. Handoff contains no credentials or machine-specific paths.

## Risk and rollback

Main risks: generator compatibility, strict interval boundary, graph sampling,
answer type, and assisted answers receiving clean credit. Separate session-only
author progress avoids changes to legacy persistence. Rollback is a separately
reviewed revert of this task; no migration is needed.

## Permissions

The owner's current two-stage execution request authorizes this implementation,
branch creation, logical local commits, push, and a separate Draft PR after PR126
is clean. This is the operative instruction, not a copied approval marker.
Merge, auto-merge and deployment remain unauthorized.

## Execution record

Validation and publication evidence will be recorded in the Draft PR handoff.
Scope adaptation: the task13 canonical file is necessary because the requested
file only redirects. All other changes stay within the named task scope.

## Required handoff

EXECUTIVE STATUS fields: Task, PR, Base, Head, Gate, Tests, Failures, Not run,
Scope deviations, Recommendation, Next user decision. Also report bank counts,
deduplication, exact changed files and current-main preservation.

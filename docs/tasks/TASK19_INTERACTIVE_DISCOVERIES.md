# Task 19: discovery through interactive geometry

## Identity and scope

- Owner: repository owner; instruction on 2026-10-21 (Asia/Novosibirsk).
- Base: main, `923c326dc08918c75a8ac26279c4b094a5d0c68c` (published PR278).
- Branch: `feat/task19-interactive-discoveries`.
- Review: HIGH, because all 233 optional hints change and local experiment state is retained.
- One task, one branch, one PR. No new platform archetype or server protocol.

The owner asks that every model in task19 allow a learner to act, with simple
instructions leading to a small discovery. The attached example is prev-019:
a median equal to half its opposite side. The current bank has 117 SVG-only
hints and 17 fully locked models; several scale controls also produce no
observable diagram or measurement change.

Included: all 233 active hints, both public entry URLs, the standalone download,
mathematical geometry, action instructions, optional measurements, retained
model parameters, and relevant tests. The existing assertion text, truth labels,
IDs, aliases and source audit remain unchanged. No claim of exhaustive official
FIPI coverage is added. Former modes and private added tasks remain accessible.

Excluded: other OGE numbers, new statements, learner accounts, server/database
changes, personal pupil records, billing or credentials.

## Acceptance

- Every hint has a meaningful geometric action with a brief imperative and an
  observation question; a drawing or decorative scale alone is insufficient.
- Controls preserve each given premise. Fixed side lengths stay fixed; linked
  square/isosceles/right-angle conditions cannot be broken by a control.
- prev-019 moves C while CM=AM=BM and M is the midpoint of AB; nondegenerate
  positions produce a right angle calculated from the coordinates.
- Optional measurement is separate from the statement verdict. Experiments
  never answer a card or earn a correct result automatically.
- Hide/reopen/reload retains the current experiment, measurements and answer;
  moving to another statement creates a fresh experiment.
- Keyboard, touch, 320/360/1280px, denied storage and the offline download work.
- All source assertions, truth values and previous records remain compatible.

## Design and review

The design brief is: learners should distinguish a given condition from a
conclusion, vary an admissible figure, notice an invariant or find one valid
counterexample, and then decide whether the original statement holds. Common
errors include confusing equal area with equal figures, a special square with
every rhombus, and a false converse with its true original statement.

Proposed sequence: statement → optional help → short action and constrained
model → optional measurement → observation question → learner's verdict →
existing mathematical explanation. Measurements are evidence for a conjecture,
not a proof of a universal theorem. No artificial progress is awarded for a
hint action. Existing question-first layout and familiar terminology remain.

Independent design audit identifies all 134 noninteractive cases and checks
premise constraints. Triangle, circle and line/polygon families are reviewed
separately, then integrated and tested across the entire bank.

Claude design consultation is unavailable: the most recent authorized request
run39462468886/job118765193110 at 2026-10-20T17:01:32Z returned HTTP400,
insufficient Anthropic API credits. The owner has not confirmed funding since.
No unchanged paid retry, advice or approval is claimed. The earlier PR278
exception does not waive task19 review. Useful implementation and technical
checks continue; a required release exception, if still necessary, will be
requested only when the exact result is concrete and reviewable.

## Gates and rollback

Required: all existing task19 contracts, exhaustive action/geometry/state
contracts, independent coordinate-based premise checks, all-card Chromium
journeys and representative narrow-screen/keyboard screenshots, current
relevant GitHub checks, source provenance equality and git diff --check.

Risks: a slider may invalidate the premise, a diagram may leak a conclusion,
or state may be lost/reused across cards. Independent coordinates, boundary
experiments, no-verdict assertions and saved-state tests cover these risks.
Synthetic learners do not establish effectiveness with real pupils.

Rollback is a normal revert. New local model state is additive, bounded to
editable numbers and ignored by the previous runtime; no data migration.

## Permissions and execution

The current instruction authorizes implementation, branch creation, commits,
push and a PR. Standing owner instructions authorize cloud publication.
Required review provenance and task-specific unavailable-review handling still
apply. No force, reset, rebase, admin override or weakened gate is authorized.

Execution evidence and final base/head, PR, gates, failures, unrun checks and
release decision will be recorded in the PR. Publication is not yet claimed.

## Implementation preflight

- Every233 card now has editable geometric controls;42 deterministic model
  families are available. No active SVG-only or completely locked hint remains.
- All52 Node/DOM/math/source/offline checks pass. The independent coordinate
  audit has11 checks across all233 card setups, including controls' extrema,
  the median converse, SSA, special quadrilaterals and decimal circle tangencies.
- Independent review verified unchanged assertion identities/text/truth and
  reviewed state restoration and event cleanup. Pedagogical review corrected
  premature conclusion text and the three-parallel-lines experiment.
- Prior failures were an outdated flat-point test schema (updated to recursively
  verify every finite2D point), a circle tangency rounding case, and the missing
  threeParallel display mode. All are fixed with focused regression coverage.
- Browser/mobile evidence and exact-head cloud checks are next. No external
  review or production publication of task19 is claimed.

## Owner update — 2026-10-21T01:36:59+07:00

The owner explicitly deferred purchasing/using Claude API until a difficult
creative question arises. Current work proceeds without a Claude call, using
independent internal reviews and full technical gates. This current owner
instruction supersedes the earlier mandatory consultation workflow for this
release; no provider approval is claimed. Standing cloud publication permission
remains in effect. No billing or credential action is performed.

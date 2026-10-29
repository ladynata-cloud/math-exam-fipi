# Atanasyan: complete cone paragraph, exercises 346–371

## Identity and authorized continuation

- Date: 2026-10-29.
- Task: ATANASYAN_CONE_346_371; review level HIGH.
- Base: main `6b25302788f36d92723e487e92afa7044ced3ad3` (published PR372).
- Branch: `content/atanasyan-cone-346-371-20261029`.
- Parent: [complete textbook](TEXTBOOK_ATANASYAN.md).

The owner says «продолжай» after verified publication of the cylinder paragraph.
This authorizes implementation, checks, commits, push and a reviewable Draft PR
for the next complete paragraph. Release follows the current owner's explicit
authorization and fresh-main guard. This document is neither merge permission
nor independent review evidence.

## Goal and bounded scope

Finish chapter IV §2 «Конус»: complete theory points 40–42 and all 26 numbered
exercises 346–371, including every printed subpart (37 exercise cards). Preserve
the existing source labels, optional help, justified progressive steps, theory
dialogs, exact spatial constructions and retained learner work. Target: 594
cards, main exercises 1–371, theory 1–42 and 40 previous self-check questions.
Sphere and all subsequent work remain visibly pending; this is not completion
of chapter IV or the whole textbook.

The supplied 2024 twelfth edition is checked from actual rendered pages 94–100
(PDF 96–102), not OCR alone. Source-specific risks include distance from the
apex in 348, the dihedral angle in 354, both inclusions and the full disk in 355,
exact inverse-trigonometric answers in 359, the internal shared disk in 365,
CD=3√2 in 370, and the open bucket, two painted sides and unit conversion in 371.

## Preservation and implementation

- Preserve all 554 published lesson files byte-for-byte, their revisions,
  identifiers, mathematical content, reviews and stored learner work.
- Preserve runtime, schema, renderer, styles, builder and storage contracts.
  Reuse existing smooth and planar scene models. Round surfaces use analytic
  geometry; tessellated screen polygons do not define their mathematical area.
- Add requiredParts at exactly 29 source positions, preserving all other source
  metadata. Append 40 independently reviewed registry rows and one batch.
- Extend browser captures and gates while preserving every earlier fixture,
  fixed hash and case. Check the complete prior release through a narrowly
  constrained append-only projection; do not waive historical checks.
- Exclude sphere material, unrelated changes, source scans/PDFs, full-book
  extracts, private identifiers, host paths and credentials from the repository.

## Acceptance, checks and independent review

All 40 new cards require independent source, proof and actual-coordinate review,
including positive-length domains, degeneracies, existence, auxiliary-point
placement and unrevealed exercise answers. Actual mobile and desktop images and
complete written solutions receive review separate from content authorship.
Independent reviewers are responsible for their own conclusions; authors do
not grant themselves approval.

Paid Claude remains deferred under the owner's existing explicit whole-textbook
decision in the parent task. No external-provider or real-pupil verdict is
claimed. This content uses the established interaction and scene3d renderer;
no new trainer archetype or architectural change is introduced. Proposed ADR
0001 remains advisory.

Required checks: deterministic build; schema/catalog/source completeness;
all inherited content and preservation gates; independent cone numeric and
actual-model oracle; actual DOM fractions and initial-answer privacy with
negative controls; geometry and labels; retained work and theory return;
partition/collector validation; complete 594-card browser journeys at both
widths; all new model-state images and full help/proof text; applicable shared
stereo/profile/SEO regressions; exact diff, links and sanitization; CI.
Final gate `ATANASYAN_CONE_346_371_REVIEW_OK` is earned only after the applicable
checks and independent evidence pass.

## Risk, rollback and permissions

The main risks are confusing line/plane and axial angles, radius/diameter or
height/slant, miscounting covered surfaces, incomplete disk proofs, numerical
rounding presented as exact, early answer disclosure and unreadable fractions.
Source review, independent analytic checks and actual rendered-image inspection
address these separately. Rollback is an ordinary scoped revert. No account,
server or learner-storage migration is involved.

Branch creation, local commits, push and Draft PR are authorized. Merge,
auto-merge and deployment require separate owner authorization; no force,
reset, rebase, non-fast-forward history repair, protection override, disabled
TLS or weakened gate is permitted. Query authoritative main immediately before
an authorized merge and follow the base-drift procedure when it differs.

## Execution record and handoff

Record the actual base, head, PR, passed/failed/not-run checks, scope deviations,
review evidence and recommendation in the PR and accompanying review reports.
Use the required EXECUTIVE STATUS fields. After authorized publication, verify
merge identity, exact-commit Pages deployment, canonical live bytes and focused
live UI. Reconcile prior publication in PROJECT_STATUS within this task.

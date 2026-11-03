# Atanasyan: complete cylinder paragraph, exercises 320–345

## Identity and authorized continuation

- Date: 2026-10-29, Asia/Novosibirsk.
- Task: ATANASYAN_CYLINDER_320_345; review level HIGH.
- Base: main `0ad2680f9039a27cd1188eccc55cfcd932d4bf64` (published PR370).
- Branch: `content/atanasyan-cylinder-320-345-20261029`.
- Parent: [complete textbook](TEXTBOOK_ATANASYAN.md).

The owner explicitly says «продолжай» after the verified publication of PR370.
This resumes the existing course from main exercise 320; no further START is
needed for implementation, validation, commits, push and a reviewable Draft PR.
Release follows the applicable owner authorization and fresh-main guard; this
specification itself is not permission to merge or an independent review verdict.

## Goal and bounded scope

Finish chapter IV §1 «Цилиндр»: both complete theory points 38–39 and all
26 numbered exercises 320–345, including every printed subpart (34 exercise
cards). Use the existing course, visible source labels, progressive justified
steps, optional help, theory dialogs, spatial models and retained learner work.
Target: 554 cards, main exercises 1–345, theory points 1–39, 40 earlier self-check
questions; later paragraphs remain visibly pending. This is not completion of
chapter IV or of the entire textbook.

The supplied 2024 twelfth edition was recovered and visually inspected at
printed pages 89–94 (PDF91–96). Source 325 uses √3π:4, not the defective OCR
reading 3π:4; 334 uses 10√3. For 338 distinguish the answer-key convention of
painting the outside of a closed tank from the source's unspecified number of
painted bases. For 342 retain both choices of the rectangle side that becomes
the circumference. Do not invent a unique full surface area.

## Preservation and implementation

- Preserve all 518 previous lesson files byte-for-byte, their revisions,
  identifiers, reviews, mathematical content and stored learner work.
- Preserve runtime, schema, renderer, style, builder and storage contracts.
  Cylinder diagrams use the already supported smooth polygonal scene display;
  mathematical areas and intersections use analytic circle geometry.
- Only add requiredParts at the 28 source positions; preserve the source index's
  other metadata. Add independently reviewed rows and one review batch.
- Extend capture inventory and full gates; retain historical hashes and verify
  the complete old release through a narrowly checked append-only projection.
- Do not publish the PDF, scans, full-book extracts, private file identifiers,
  machine paths, accounts, secret values or unrelated course changes.

## Review and acceptance

Independent source/proof/coordinate review of all 36 authored cards, including
existence, domains, ambiguity, auxiliary constructions and no premature answer
in exercise titles, conditions or initial models. The reviewer does not author
the lessons. Paid Claude remains deferred under the existing explicit decision
for this whole textbook recorded in the parent task; no external-provider or
real-pupil verdict is claimed. No new trainer interaction or platform archetype
is introduced: the existing scene3d smooth/planar display is reused unchanged.

Required: reproducible build, catalogue/schema, all inherited source/content
and preservation gates, independent cylinder numeric and coordinate oracle,
geometry, retained work and theory return, companion labels, negative controls,
browser partitions/collector, full desktop/mobile browser journeys, actual new
model-state images and complete written proofs, applicable stereo/profile/SEO
regressions, exact committed diff and CI. Final gate:
`ATANASYAN_CYLINDER_320_345_REVIEW_OK` only after all applicable checks pass.

## Risk, rollback and release evidence

Main risks: confusing radius with diameter, assigning a single result where the
source allows two configurations, wrong shortest distance or angle, leaking an
answer in the initial diagram, unreadable narrow-screen formulas and lost work.
Independent analytic checks, actual image review and immutable previous cards
address these separately. Rollback is an ordinary scoped revert; learner storage
is preserved and no account/server migration is involved.

Record actual base/head/PR, passes, failures, not-run checks and review evidence
in the PR and reports. Before any authorized merge, query authoritative main;
apply the repository base-drift procedure if it changed. After a release verify
actual merge identity, exact-commit Pages deployment, canonical live bytes and
focused live UI. Never force, reset, rebase, override protections or disable TLS.

# Atanasyan 2024 — finish symmetry examples and introduce regular polyhedra

- Owner START: current request «продолжай курс», 2026-10-24 (Asia/Novosibirsk).
- Base: main, `96d44cc06a3dbc1e40482a774eda6c18fac89242`.
- Branch: `feat/atanasyan-regular-polyhedra`.
- Review level: HIGH, for complete source interpretation and geometric proofs.

## Goal and scope

Continue the published 418-card course. Complete the four remaining example and
application components of point35; cover all of point36 including Euler counting
and existence constructions; solve exercises279–280 with every permitted case.
The planned increment is17cards. Reuse the existing scene renderer, progressive
steps, contextual help and retained manual work. No interaction redesign.

Source: supplied Atanasyan2024, printed79–84 / PDF81–86. Private source bytes and
page images stay outside the repository. The source35 blanket assertion that a
non-right parallelepiped has no half-turn axis is false; explain the correction
with a verified construction. Exercise279 has only60degrees because diagonals
of the same square cannot share an endpoint. Exercise280 has both an intersecting
and a parallel-diagonal case, giving triangular and rectangular sections.

Out of scope: practical271–275, point37, exercises281 onward, changed renderer,
builder, pupil-state contracts, cabinet integration or other courses. The full
book remains incomplete. All418 earlier lesson files must remain byte-identical.

## Acceptance and review

- Independent source, mathematics and pedagogy review binds exact canonical card
  contents; authors cannot mark their own new records reviewed.
- Source contracts expose every required component; source lettering is retained.
- Exact models, full explanations, contextual help and reachable progressive
  views; inspect actual new mobile and desktop screenshots.
- Reproducible build; source catalogue/schema/content/geometry/runtime gates;
  focused independent coordinate oracle; existing browser partitions and full
  course cloud journeys with retained work and no overflow.
- Paid Claude remains deferred under the existing course scope, as recorded in
  the preceding task and current conversation. No Claude verdict is claimed.
  Independent Codex review is required. No new archetype is introduced.

## Publication evidence reconciled at task start

PR321 published the preceding15-card increment as
`f616ec8cbd70dd18e3cecfa58be683c32303a573`, parent
`6c54e5e9db87122d24324a0ed1b38e0626bcf3c9`.
Pages40056093696 succeeded;44ordinary/versioned public requests matched reviewed
bytes. Production then had418cards,273complete exercises,34complete theory points,
26self-checks and one partial point35. Bundle SHA256:
`2adb3cd6f05848c6ccee7bc6e49d52231f635b2bb20b8c61b760e723b25a1643`.
This task starts from fresh current main including subsequent unrelated releases.

## Risk and rollback

Risks: incomplete case enumeration, treating necessary vertex-angle restrictions
as an existence proof, wrong dual-polyhedron geometry, symmetry source erratum,
crowded diagrams. Review coordinates and actual renderings independently.
Rollback reverts this increment's cards, contracts, review registry, generated
bundle and matching tests together. Existing lessons and learner state are intact.

## Permissions

The continuation request authorizes branch creation, scoped implementation,
verification, commits, push and Draft PR. Merge/publication requires a separate
owner authorization after review; the preceding PR's approval does not cover it.
No force, reset, rebase, paid calls, admin overrides or weaker checks.

## Execution record

Implemented17cards,90steps,70modelstates. Independent source/math/written-pedagogy
review passed at2026-10-24T04:56:28.889Z; exact canonical hashes are recorded in
[the content report](../reviews/ATANASYAN_REGULAR_POLYHEDRA_CONTENT.md). All435cards
pass content/schema/model checks; catalogue, runtime, coordinate and browser
partition/preflight gates pass. Actual cloud browser evidence, independent visual
review and exact-head integration approval remain pending at this checkpoint.

A source selector initially also touched existing exercise35/36 contracts; the
independent integration reviewer found it before commit. Those entries were
restored exactly from the base. Only theory35/theory36/exercise279/exercise280
source contracts now differ. No existing lesson content changed.

Concurrent main5de3d1ad4ad1fb77f477f31a6fdd44f091f86a20 adds PR324
Shestakov–Yaschenko27topic files, with no overlap in this patch. This task branch
was not rebased or merged. Exact head, PR and final gates belong in the PR handoff.


## Actual visual findings and correction

The first exact-head cloud run passed all12 latest checks and completed435cards
at320/1280. Independent reviewers inspected all140new model panels; geometry and
labels passed. Native long-text review nevertheless found literal slash fractions
in the icosahedron and triangular-section explanations, a separated bracket in
the dodecahedron proof, and missing number spacing in three point35cards.
Six new cards receive display-only notation/copy corrections; source mathematics,
model coordinates and runtime stay unchanged. Real-formatter regression covers all
17cards, and actual browser assertions/captures cover the affected formulas.
The corrected head requires fresh cloud evidence and targeted actual visual review.
The earlier green checks do not constitute approval of these later edits.

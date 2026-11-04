# Geometry and interactive models — evidence, 2026-11-02

Package6, items31–40,66–75 (20 items; cumulative74 prepared). HIGH, ADR0011.
Standing owner permission applies. External consultation/audit not performed.

## Implementation and review

Eight optional models cover equal fractions, signed number-line steps,
fraction-product area, percent0–200%, equivalent equation transformations,
y=kx+b controls, inequality rays with endpoint inclusion, coordinate plotting
and reading. Parameters are bounded; proper fractions required for area/bar
models. Textual equivalents, explicit labels and keyboard controls accompany
SVG. Models are separate from the current problem, use no storage/network and
reset on session deletion. Equation balance requires removing the additive term
before division; graph clipping deduplicates corner intersections.

Numerical Pythagoras grades exact roots and highlights the sought side. Exact
rational cube sections use three noncollinear points on named edges, a plane,
all12 edge intersections and an exact projected convex hull. Arbitrary skew or
unsupported solids remain unsupported. Supported geometry templates cover
parallel-line angle pairs, triangle interior/exterior angles, three congruence
criteria after explicit correspondence, similarity ratios, central/inscribed
angles on a specified arc, tangent/radius/chord hypotheses, rectangular corner
cutouts, 2D vector coordinates/sum/length, three verified cube plane-angle
constructions, prism/pyramid/cylinder/cone volumes. No arbitrary diagram
recognition or general geometry proof claim. All new topics are offline-only.

Figure geometry is bounded, DOM uses textContent, and figures appear only in
explicit full explanations. Approximate coordinates draw exact mathematical
results; no floating-point grading. Named geometric incidence, tangent/chord
rays and triangle exterior-angle extension reviewed. Arc measure labels sit
beside the selected arc. Selected print includes opened figures and tables.

## Verification

-210 service tests passed.
-18 browser tests passed in final full run (16 top-level+2 subtests), including
 all12 numerical geometry routes, all8 models, keyboard sliders, preserved
 attempts, staged disclosure, selected print and320/390/1280 widths.
-225 independent Pythagorean squared identities;441 rectangle decompositions;
 explicit angle/domain/correspondence and exact-pi cases; independent vector
 dot products establish the three cube plane angles.
-All220 midpoint triples:8 triangles,108 quadrilaterals,24 pentagons,80 hexagons.
 Verified plane membership, cube bounds, edge incidence and shared faces of
 adjacent vertices. Separate collinear/out-of-edge inputs rejected; known face,
 triangle and hexagon cases checked.
-450 equivalent-fraction cases,729 counted area grids,169 signed endpoint cases,
 1950 balance invariants and99 clipped linear graphs checked.
-Both source-course gates and diff check passed; screenshots of tangent/chord,
 cube section and coordinate model reviewed. No real pupil/AT pilot performed.

Initial test failures: a float equality in the area test was replaced by
independent integer cell counting; the new UI test initially used fixture.url
instead of its already-authenticated fixture.page. Corrected, focused UI pass,
then all18 browser tests passed. Review also fixed duplicate graph-corner
intersections and moved arc labels away from the centre. No gate weakened.

## Delivery

PR414 cloud CI41366659653 passed and merge8a5b31b68bbbf4cb8a0998c15e622a79906b1a80
was fetched: parent51da998 and tree115c38e verified. Geometry cloud checks
pending. Production remains prior ten-item source8307f6a/package3cc22e0;
Amvera cloud identity/verified-host provisioning is unavailable. No repeated
publication permission is required. No schema or identity changes; rollback
ordinary scoped source revert, retaining existing DB/ledgers.

## Executive status

Task: geometry and models,20 items
PR: attached after source publication
Base: main8a5b31b68bbbf4cb8a0998c15e622a79906b1a80 after dependency composition
Head: exact committed candidate in PR
Gate: local pass; cloud pending
Tests:210 service,18 browser, exact/domain/geometry/model invariants
Failures:none in final completed checks
Not run:exact-head cloud, real learner/AT pilot, Amvera delivery
Scope deviations:bounded templates and8 independent models, as described
Recommendation:cloud CI then controlled merge; continue packages7–8
Next user decision:none; standing publication policy applies

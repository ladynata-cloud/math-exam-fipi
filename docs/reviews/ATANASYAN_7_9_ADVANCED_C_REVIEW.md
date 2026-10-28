# Independent source and mathematics review: Atanasyan 7–9, advanced 446–461

Initial review: 2026-10-28T15:35:47.121841+00:00. Final display-delta review: 2026-10-28.
Reviewer: independent non-author OpenAI regression/source reviewer.
Scope: 16 exercises / 16 cards, printed pages 119–120, PDF pages 120–121.
Exact source SHA-256: `3b2e890ce425ef9b4893f367e8680e18c0ed380c9bd86fe4eb65b44a2479ca72`.

Verdict: source, mathematics and authored geometric semantics PASS for the hashes below. This is not a rendered-page review, external-provider verdict, merge or deployment authorization.

## Source and solution checks

- All sixteen conditions were visually compared with the exact source pages, then each construction/proof was independently derived. No exercise was imported from another edition; the single part of each number is accounted for.
- 446: half-angle construction from the perimeter, correct ordered base points and uniqueness; positive perimeter and two positive angles with sum below 180° are required.
- 447–450: complete loci and all possible counts, including coincident/perpendicular bisectors, collinear source points and the shared origin counted once. The 450 cases independently yield 0, 1, 2, 3 and 4 distinct points.
- 451: the four intersections of internal/external bisectors give exactly the incenter and three excenters; distances are to complete lines.
- 452: the auxiliary angle is 90° + δ/2 when the larger base angle is at B. The necessary and sufficient conditions are c > 0, s > c and 0° ≤ δ < 180°; the recovered vertex is inside AD.
- 453: the original wording does not exclude the common tangent at the circles’ shared point. That literal counterexample A = B is explicitly retained; AB = O₁O₂ is correctly proved for distinct tangency points on an external tangent.
- 454: exterior-disjoint circles have four tangents; strict nesting, including unequal concentric circles, has none. The equal-radius case does not use a radius-zero auxiliary circle.
- 455–456: strip position gives 2/1/0 circles; the prescribed contact point plus an off-line point gives exactly one nonzero circle.
- 457: the U/V construction covers external and internal tangency, both sides of m and the 0/1/2/infinite cases. Zero radius and coincident circles are excluded. If A lies on the given circle with a different tangent, no solution exists.
- 458: the internal angle bisector yields one circle for a nonvertex contact point; a prescribed contact at the vertex cannot give a positive radius.
- 459: reflections give a sharp lower bound on perimeter. Acuteness puts the two side-rays inside the convex angle A₁OA₂, guaranteeing the straight segment crosses both rays in order and yields the unique minimum.
- 460: exactly one center in each cathetus segment; external angle bisectors meet extensions and are correctly excluded.
- 461: AH = PQ/2 with H on the circle of diameter OA yields 2/1/0 chords for the positive given length; A = O gives no positive difference. The longer endpoint is labelled K. The optional PQ = 0 limit is explicitly separated.

## Findings closed before this review

- 454: the diameter-circle construction described in step 3 now appears in its own step view, with the midpoint and right-angle mark. The direction instruction uses a ray rather than a vector term.
- 450: the origin in the three-solution case is no longer labelled twice as distinct points.
- 461: the chord and endpoints K, M now appear in step 3 when the text first constructs them.
- 457: “A не лежит на данной окружности” replaces wording that could incorrectly imply A must be outside the disk.

## Final display-delta review

After the author resolved layout findings, the final composed cards were compared with the initially reviewed 16-card snapshot. Teaching statements, proof/construction steps, answers and source identities are unchanged, except that 447 now explicitly identifies the illustrated given line a as the line through U and V. This is a naming clarification, not a new mathematical condition.

- 448: separated positions and a changed scale retain the same perpendicular bisectors. Independent checks of the actual final coordinates confirm the two-, one- and zero-intersection cases, equal distances to A/B, and membership of the shown solutions in the given circle.
- 450: larger illustrated configurations and label offsets retain all 0/1/2/3/4 solution counts. The final labelled solution points lie on the circle and are equally distant from both given full lines. The shared origin remains one point. Case captions now use correct Russian singular/plural forms.
- 454: step 2 displays the auxiliary circle on its own; its radius is still R − r. Step 3 retains the separately reviewed diameter-circle construction. The condition drawing supplies the original pair of circles.
- 461: the diameter boundary case suppresses redundant auxiliary circles. The no-solution case displays the two nested auxiliary circles with no intersections; their final radii still express PQ/2 > OA. Notes identify the roles of these drawings. Final 450 label offsets change display placement only.

No mathematics/model-semantics findings remain open for these final hashes. This delta review checks coordinates, visible-object definitions and text; independent rendered-image review remains separate.

## Executed mathematical checks

`python3 tools/geometry-textbook/advanced7-c-math.test.py` — PASS, 4,066 independent assertions. All 16 authored illustrations receive semantic checks. Five hundred deterministic parameter sets independently test the families 446, 452, 457 and 461, including range/order and angle/distance equations. These checks complement the reasoning; they are not an exhaustive theorem proof.

The same independent test was rerun successfully against the final model SHA-256 below. Additional coordinate probes checked the changed 448 cases, 450 labelled loci, 454 auxiliary radius and 461 diameter/no-solution boundaries. The repository geometry gate also passed at this checkpoint: 755 models, 4,101 views and 2,797 coordinate claims.

Rendered browser images and mobile/desktop layout: NOT reviewed in this record. Their later evidence must be recorded separately and bound to the actual runtime and models.

## Reviewed hashes

| File | SHA-256 |
| --- | --- |
| `tools/geometry-textbook/models_advanced7_c.py` | `698955a26a27723915aa66da166f4d97122b084d0170f14cf084ae87f7e33836` |
| `geometry-course/textbook/preparation/grade-07-advanced-c.json` | `42aac6737590e2d0e1da6d99a2f8b92982cd8a5c19fcefdbaf82a14c6b06d3b5` |
| `geometry-course/textbook/models/grade-07-advanced-c.json` | `872af4ad27744a4eb0ba9b4505210970f8fb4d42f145ecafbf7ae8e6e8304495` |
| `tools/geometry-textbook/grade-07-advanced-source-map.json` | `cb28ba072c98544f00c36b15d08887a493998d961f44d7419ca625f31d53a5bd` |
| `tools/geometry-textbook/advanced7-c-math.test.py` | `a7726e51a2a69e240044cd14c456bb3fb7cd7ed417530d5b7bd966c8365a3cfa` |

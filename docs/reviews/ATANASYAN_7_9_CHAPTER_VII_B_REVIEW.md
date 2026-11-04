# Independent review of Chapter VII block B

Reviewer: `/root/vii_a`. This reviewer authored the disjoint block A (541–565), not block B. No approval of the reviewer's own A content is implied.

**Source, text, didactics, mathematics, and exact coordinate/marker review: PASS. Full browser visual review at 320/1280: PASS. Publication is not approved by this report alone.**

The review covers all 72 cards for exercises 566–604, all 297 model views and all 215 declared coordinate claims. Every condition, solution step, answer, note, didactic prompt, justification and theory reference was read. Source images PDF 152–159 (printed 151–158) were actually opened and read; theory points 57–62 were checked in the relevant source pages. An initially truncated PDF153 PNG was replaced with a complete render before checking exercises 574–580. The source PDF SHA-256 is `3b2e890ce425ef9b4893f367e8680e18c0ed380c9bd86fe4eb65b44a2479ca72`.

The independent numeric oracle imports neither the B generator, its author assertions nor the existing model checker. It uses determinants for areas, vector dot/cross products, Euclidean norms, point-to-line distances and angles. One source dimension calibrates each model; the remaining source lengths, heights, areas, ratios, radii and angle claims are independently recalculated. Every displayed right-angle marker and each equal-segment/angle group is checked in every view, including repeated views. Initially 923 independent checks passed. After author B rotated selected diagrams and removed redundant displayed radii to fix mobile label collisions, **910 independent checks pass** on the final mathematical model. The reduction is due to fewer displayed markers, not omitted source metrics. The companion JSON contains each actual/expected value and exact reviewed file hashes.

The mathematical review additionally checked domains, units, nondegeneracy, theorem direction, the timing of auxiliary constructions and possible premature conclusion markers. In particular, right angles in exercise 596 remain absent until the converse Pythagoras step; the false cases never receive them. The area formulas in 569 and 599 are supported by point 58's derivation of S = pr. The optional later-Pythagoras consistency calculation in 570 is explicitly identified as such, rather than silently assuming a future theorem.

| Item | Independent conclusion |
| --- | --- |
| 566 | Both models of area give 9 cm²; the second height is 5.625 cm, with its foot outside the side. |
| 569 | Parts a/b/c give r=3, S=252, a=7. The illustrative triangles satisfy the source metrics; their particular shape is explicitly not an additional hypothesis. |
| 570 | Source data are inconsistent. Tangency lengths force sides 10,11,11, area 20√6 and radius 5√6/4, not 3. Formal substitution yields 48 only. Text and model clearly distinguish these facts. |
| 576 | The proof works for any convex quadrilateral with perpendicular diagonals; bisection is neither assumed nor shown as a false condition. The model has unequal diagonal halves. |
| 577 | Both actual coordinate triangles have areas 10 and 2; recovered AD=2.4 is inside AB=8. |
| 593 | Independently obtained areas 180, 48√3 and 135 cm²; equal base angles imply equal legs, and both projected end pieces are used. |
| 594 | Solving x²=(3−x)²+3 gives x=2 within (0,3); AC=√7. |
| 599 | Part a gives P=60. Part b gives (r−3)(r+20)=0; only r=3 is admissible, so P=40. Tangent-circle coordinates independently match. |
| 600–602 | Circumcenters are equidistant from all vertices. In 602 the center is correctly outside the obtuse triangle and the diameter is 16. |
| 603 | The actual source reads **800×2000 mm**. The 800-mm edge fits the 600√2-mm window diagonal; the 2000-mm side is along the direction of travel. This is a spatial, thin-panel construction, not a flat rectangle fitting inside the opening. Frame/thickness/turning-space limits are explicit. |
| 604 | The model uses d=80.01 cm, width≈69.73 cm, height≈39.23 cm; both fit 74 cm and depth 25 fits 35. Actual frame dimensions and ventilation requirements are explicitly outside the supplied data. |

Two typographic findings were sent to author B and fixed by that author: 593's “частиа/частяхб,в” and 599b's missing space before −20. The author also corrected 603 from 800×200 to the source's 800×2000; the reviewer independently reopened PDF159 and confirmed 2000. The full oracle was rerun after these corrections.

## Exact reviewed inputs

- `geometry-course/textbook/preparation/chapter-07-b.json`: `b88edfacda577c584b2612c7e151cab81494288391b7c61b362549c3e9b651c5`
- `geometry-course/textbook/models/chapter-07-b.json`: `c4920455920861cb1ff9af1feb4c4aee6b47274caf21146e5216499b19a34797`
- `tools/geometry-textbook/models_ch7_b.py`: `c1e3ee9bb00ab232931da394c503cb379846b6fabe5bceb9283af53a37fa01d8`

## Complete visual review

All **329 unique full PNGs** in the initial capture were actually viewed at native pixels without cropping or resizing. The final `vii-focused-2` capture contains **594 PNG files**, all 297 views at 320 and 1280, with **328 distinct whole-file SHA-256 hashes**. All 37 new unique PNGs in the second capture were actually viewed in full. Every remaining final PNG has exact whole-file hash equality with an independently viewed, passing first-capture image. No similarity, geometry-only hashing, crop, or resized preview was used to infer approval. Total distinct full images actually inspected across the two captures: **366**.

The initial mobile label collisions in 569a, 574b, 599a/b and 602 are resolved. The independent final delta showed readable labels, correct leader targets, preserved perpendicular/radius geometry, no clipping, and no new premise/conclusion confusion. The full final coverage and hash-to-review mapping are in `ATANASYAN_7_9_CHAPTER_VII_B_VISUAL_REVIEW.json`. **Visual PASS; no unresolved B findings.**

This is a non-author review of B only. Whole-chapter integration, CI and publication remain the parent integrator's separate scope.

# Atanasyan 7–9 chapter IV: independent review of exercises 292–330

**PASS for exact-source correspondence, mathematics, didactics and authored model consistency at the hashes below. Actual rendered model pixels remain a separate gate.**

Reviewer: chapter-IV exercises 259–291 author (`author_ch4_b`), independent of the author of exercises 292–330. Reviewed on 2026-10-26. This is a content review, not an external-provider verdict, browser approval, merge approval or publication approval.

| Reviewed file | SHA-256 |
| --- | --- |
| `tools/geometry-textbook/models_ch4_c.py` | `d90282ca86e97b3709871e9ff90d359683641b6aab32e49ca93469d5efd78482` |
| `geometry-course/textbook/preparation/chapter-04-c.json` | `fb4b26bf46abaa81af372902138b5a8c9f9db460b9efe2404f7023cfa2b5ce2f` |
| `geometry-course/textbook/models/chapter-04-c.json` | `d85ace901fa9a754428d684c63234d8d6bc77966a940ff87e9f05cc943faf500` |

## Source and completeness

The reviewer directly viewed the exact source images of printed pages 86, 87, 89 and 90 (PDF pages 87, 88, 90 and 91) of the 2023 fourteenth revised edition. Source PDF SHA-256: `3b2e890ce425ef9b4893f367e8680e18c0ed380c9bd86fe4eb65b44a2479ca72`. Every condition, vertex assignment, requested result and real subpart was compared to those images. Figures 151 and 152 were independently interpreted for exercises 306 and 307. Source scans and extended textbook passages are not included in this review.

| Printed page | Numbers | Cards |
| --- | --- | --- |
| 86 | 292–299 | 14 |
| 87 | 300–303 | 5 |
| 89 | 304–314 | 13 |
| 90 | 315–330 | 26 |

Coverage is exactly 39 consecutive exercise numbers and 58 separate cards. Multipart exercises are 296а–б, 298а–б, 299а–д, 300а–б, 309а–б, 310а–б, 323а–в and 324а–и. All others have one card. The nine angles in 324 are independently represented: 30°, 60°, 15°, 120°, 150°, 135°, 165°, 75° and 105°.

## Independent mathematics

| Exercise | Finding |
| --- | --- |
| 292 | The two offset parallels are both retained. Perpendicular distance and the two directions on the constructed perpendicular prove completeness. |
| 293 | Each offset parallel meets the first given line once, giving exactly two points. |
| 294 | The side and angle locate the bisector; the prescribed bisector endpoint determines the opposite-side line. The solution rejects a parallel line, a backward intersection, and an endpoint outside the required segment. |
| 295 | SAS constructs the side–median triangle. Reflecting the side endpoint in the median endpoint gives the third vertex and the midpoint property. Positive lengths and a nonstraight angle ensure a nondegenerate triangle. |
| 296 | The two constructions use angle bisection once or twice. Their angle sums give the strict bounds 120° and 144° for the given angle. |
| 297 | The constructed adjacent angles must be positive and have sum less than 180°. |
| 298 | Both leg constructions are valid. The second uses a positive leg and an adjacent acute angle. |
| 299 | All five distinct input sets are covered. The base-angle cases require an acute angle; the base–side case requires base less than twice the side. The median-to-base construction is justified by equality of right triangles. |
| 300 | Both transformations of the three given lengths agree with the source. The model input segments now have their original lengths, and coordinate ratios check the required factors. Strict triangle inequalities, including exclusion of tangency, determine existence. |
| 301 | The vertex is the intersection of the angle ray with the offset parallel. An obtuse given angle correctly puts the altitude foot beyond the first base endpoint. |
| 302 | The known side is the radius of a circle centred at the base endpoint. Comparing that radius with the altitude gives zero, one or two vertices in each selected half-plane. The second vertex and exterior altitude foot are separately modelled. |
| 303 | The small triangle formed by half the given base, the other given side and the median must satisfy all strict triangle inequalities. A tangency would give a degenerate original triangle and is excluded. |
| 304 | Equal base angles β and their halves give the angle between bisectors as 180° − β, equal to the exterior base angle. |
| 305 | In the isosceles auxiliary triangle the two base angles are α; the exterior angle is 2α. Its bisector gives the alternate interior angle needed for parallelism. |
| 306 | The two isosceles triangles and the parallel side rays give x + y = 90°. Subtracting from the straight angle at C proves the requested right angle, matching figure 151. |
| 307 | Following the four nested isosceles triangles in figure 152 gives α + (180° − 4α) + (90° − 3α/2) = 180°, hence α = 20°. All five marked segments are equal in the model. |
| 308 | The acute base angles force the altitude from the obtuse vertex onto the opposite side. Each remaining altitude foot lies beyond the obtuse vertex; the proof excludes impossible obtuse angles in a right triangle. |
| 309 | Equal projections give equal inclines by the two-leg criterion. For unequal projections, reflection reduces opposite sides to one ray, where the larger incline lies opposite an obtuse angle. A separate reflected configuration is included. |
| 310 | Hypotenuse–leg equality proves equal projections. The strict comparison follows by excluding equality and the reverse order using 309. |
| 311 | Doubling the median and using SAS gives an auxiliary side equal to the other original side; the triangle inequality then gives the strict half-sum bound. |
| 312 | Extending BM to AC at D and adding two strict triangle inequalities yields MB + MC < AB + AC. The interior-point assumption ensures all auxiliary triangles are nondegenerate. |
| 313 | Three cyclic instances of 312 double both the sum of vertex distances and the perimeter; division by two proves the result. |
| 314 | The requested contradiction proof is explicit. A hypothetical noncollinear configuration violates the given equality by the strict triangle inequality; coincident-point cases are also acknowledged. The hypothetical scene is labelled as such. |
| 315 | Rearranging two triangle inequalities proves the stronger absolute-difference statement, with cyclic versions for all sides. |
| 316 | The three right triangles have corresponding equal acute angles by complementary angles. No similarity theorem or proportional-side claim is used. |
| 317 | The exterior apex angle 60° gives internal apex 120° and base angles 30°. The altitude foot lies beyond B; the 30° right triangle gives distance 18.5 cm. |
| 318 | AB > AC gives C > B and makes B acute. Both an interior altitude foot and a foot beyond C give BAH = 90° − B. Subtracting the half-apex angle gives HAD = (C − B)/2. The order of the rays is justified. |
| 319 | Superposition of equal triangles and uniqueness of a perpendicular prove equality of corresponding heights, including feet on extensions and at vertices. |
| 320 | The exact source target is ARC. The final proof adds RC < BC and AR < AB to common AC, giving AC + RC + AR < AB + BC + AC. The final model isolates ARC. |
| 321 | At least one supplementary angle at the interior side point is at least 90°, giving the desired strict side comparison. The source's strict assertion requires the point to be interior; the card explicitly excludes endpoints and explains why. |
| 322 | The corrected auxiliary congruence AMC = EMB gives BE = AC. Constructing the triangle with sides b, c and doubled median 2m and then reflecting the endpoint recovers the requested triangle. Existence is exactly |b − c| < 2m < b + c. |
| 323 | The three constructions cover hypotenuse–acute angle, leg–opposite acute angle, and hypotenuse–leg. The last requires the hypotenuse to exceed the positive leg; equality is excluded. |
| 324 | All nine constructions use only equilateral triangles, perpendiculars, angle bisection and supplementary angles. Each card has its own target angle and diagram. |
| 325 | The midpoint is on an offset parallel at half the altitude and a circle centred at the median's vertex. Reflection recovers the remaining vertex. Existence is m ≥ h/2. A separate K = C branch avoids applying SAS to degenerate auxiliary triangles: AC is already perpendicular to the base and AC = 2MC = h. Otherwise nondegenerate SAS proves the full height. Alternative intersection, tangency and K = C configurations are separate scenes. |
| 326 | A parallel through the intersection of the A and C bisectors makes two isosceles triangles. Their equal sides add to DE = AD + CE; the point lies between D and E. |
| 327 | Three corner triangles have side lengths s and a − s with included angle 60°. SAS gives equal inner sides. The endpoint cases are explicitly reduced to the original equilateral triangle. |
| 328 | Positive altitude and bisector lengths and a nonstraight angle are required. For h < d a right triangle determines each candidate opposite-side line; intersections with the actual rays and the position of D are checked. The condition h ≤ d alone is correctly identified as insufficient. The h = d case uses the perpendicular through D, and both reflected candidates are represented. |
| 329 | A circle centred at the given base's midpoint intersects the two offset parallels. Existence is m ≥ h, with one vertex per half-plane at equality and two when m > h. Both a second vertex and the boundary case are modelled. |
| 330 | The intersection of AB with the C-angle bisector is interior. Two right triangles sharing the bisector hypotenuse give equal distances to AC and BC; the first distance is AM. |

Student-facing proofs use only prior theory and explicitly proved earlier exercises. Analytic coordinates in the generator are illustrations and are not used in place of grade-7 proofs. No Pythagorean or similarity theorem is required.

## Findings resolved before this verdict

The author corrected the exact target and final perimeter expression in 320, the auxiliary triangle correspondence in 322, and the degenerate K = C branch in 325. The reviewer checked those corrections in the final serialized data. The author also corrected the theory references for median/bisector/altitude definitions and isosceles properties, restored the actual input-segment scale in 300, and replaced the conclusion-bearing neutral diagram in 314 with a length-only representation.

The reviewer identified and rechecked progressive construction timing in 292, 299, 301, 302, 310а, 311, 323, 325 and 329. The reflected case in 309б, segment AN in 325, and the alternative/boundary cases in 325 are present in the final models. No unresolved source, mathematical, didactic or authored-data finding remains at the recorded hashes.

## Reproduced checks

The reviewer evaluated the authoring generator up to its output-writing loop without modifying the author files and compared its full preparation and model objects with the serialized JSON. They agree exactly. Independent inventory assertions confirm all 39 numbers and all 58 real subparts. Totals are 220 solution steps, 302 views and 179 explicit coordinate claims. Every step has a nonempty prompt, justification and theory references in the available range 1–38.

The Python `check_models.validate` function and the runtime JavaScript `PlanarViewer.validateModel` each return zero errors for all 58 models, including hidden later and alternative views. These cover the encoded equalities, angles, perpendicularities, parallelism, ratios, collinearity and marker consistency.

The reviewer also performed independent numerical reconstruction of 942 configurations for the constructions in 322, 325, 328 and 329, using separately written calculations. These checked side/median restoration, both circle–parallel intersections and both half-planes, and feasible/infeasible ray intersections for angles from 15° through 165°. This corroborates the construction analysis; it does not replace the written geometric proofs. The exact K = C case in 325 was then separately reviewed in the amended proof and model.

## Verification boundary

This review inspected source-page pixels, written explanations, authoring code and model data. It does not claim actual rendered model-pixel inspection, mobile readability, completion of the full browser gate, CI success or publication readiness. Those require separate evidence. Any change to the three reviewed files requires review of the delta or a new verdict.

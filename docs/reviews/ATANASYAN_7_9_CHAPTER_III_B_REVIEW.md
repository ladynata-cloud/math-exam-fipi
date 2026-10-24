# Atanasyan 7–9 chapter III: independent review of exercises 208–227

## Verdict and scope

**PASS for source correspondence, mathematics, didactics, authored model
consistency and actual model-pixel review at 320 px and 1280 px.**

- Reviewer: independent chapter III exercise-A agent; did not author exercise
  block B or its models.
- Review completed at: **2026-10-24 17:27:49 UTC**, including both follow-up
  corrections and all final model pixels for exercise 227.
- Task base: `631d2d644d87162d60585c3efb8365af8311a3f5`.
- Reviewed state: uncommitted task content identified by the exact SHA-256 values
  below. This is an independent local content review, not an external provider
  approval or permission to merge.
- Scope: 20 numbered exercises, 24 cards, 87 worked steps, 121 authored views
  and 127 explicit coordinate claims. Exercises 208, 211, 212 and 216 each have
  parts а and б; every other number in 208–227 has one card.

## Reviewed files

| File | SHA-256 |
| --- | --- |
| `tools/geometry-textbook/models_ch3_b.py` | `14325fb65bdd38c7e939d97e711a7d2b246734be3e01fa1f6860857bb93c9f64` |
| `geometry-course/textbook/preparation/chapter-03-b.json` | `7a98acfc88154e220f01e348eb26335473915fdfd9cd977d0cef62aae56a0ef6` |
| `geometry-course/textbook/models/chapter-03-b.json` | `5aab78fd9b9b3ef77f236df601b332c8050a5498934e46edcb1c02903fd56a06` |

## Source inspection and coverage

The reviewer visually read original printed pages **66–68**, including figures
**125–129**. These are PDF pages 67–69 of Atanasyan and coauthors, *Geometry 7–9*,
14th revised edition, Prosveshchenie, 2023, with PDF SHA-256
`3b2e890ce425ef9b4893f367e8680e18c0ed380c9bd86fe4eb65b44a2479ca72`.
Every condition, given angle, letter assignment, requested conclusion and
subpart in this block was compared with those pages. Source scans and long
source excerpts are not included in this record.

| Printed page | Exercise coverage |
| --- | --- |
| 66 | 208 а/б; 209; 210; 211 а/б; 212 а/б; 213; 214; 215 |
| 67 | 216 а/б; 217 |
| 68 | 218; 219; 220; 221; 222; 223; 224; 225; 226; 227 |

## Mathematical and didactic findings

| Exercise | Independent check |
| --- | --- |
| 208 а/б | All eight angles are counted. A given 150° produces four 150° and four 30° angles. A 70° difference gives four 125° and four 55° angles. The source has exactly these two parts. |
| 209 | Parallel-line alternate angles, vertical angles and AO = OB establish ASA with the correct A–O–C / B–O–D correspondence. The corrected first step and separate case cover the possible secant AB, where C = A and D = B, without invoking degenerate triangles. |
| 210 | Figure 125's 73°, 107° and 92° sectors are preserved. A vertical-angle equality supplies the same-side sum of 180°; the requested corresponding angle is 92°. |
| 211 а/б | Both existence questions are answered affirmatively with different configurations. If A and D lie on one side of BC, 70° + 110° gives parallel lines. On opposite sides, unequal alternate angles rule out parallelism. The condition does not fix this relative position. |
| 212 а/б | Both inherited questions are covered. In the same-side case the sum is 170°; in the opposite-side case the alternate angles are 65° and 105°. The proof exhausts the two possible positions, so parallelism is impossible and intersection is necessary. |
| 213 | Same-side angles have sum 180° and difference 50°, yielding 65° and 115°. Both conditions are checked. |
| 214 | Figure 126's angle numbering is retained. From angle 4 = 45°, adjacent, corresponding and alternate-angle relations give angles 1, 2, 3 equal to 135°, 45°, 135°. |
| 215 | The three parallel hanging directions and the source pulley configuration are preserved. The upward continuation of CP₃ is introduced at its step, divides angle ACB, and gives the required two alternate-angle equalities. No additional mechanical law is assumed. |
| 216 а/б | Equal alternate angles have equal halves, proving parallel bisectors. For same-side angles, an auxiliary parallel transfers one half-angle; the two halves sum to 90°, proving perpendicular bisectors. The proof does not assume the triangle angle-sum theorem. |
| 217 | The source specifies an obtuse B and C = 20°. The argument establishes the actual ray orientation and that AHB is acute before using the theorem about correspondingly perpendicular sides. Therefore AHB = 20°, not its supplement. |
| 218 | Figure 128's two midpoint equalities, collinearities and KE ∥ AF are retained. SAS for BCE and FDE yields BC ∥ AF; the common-parallel consequence yields KE ∥ BC. |
| 219 | The midpoint and perpendicular give SAS for AKM and DKM. The resulting angle equality combines with the given bisector AD, supplying the correct alternate-angle pair for MD ∥ AB. The derived segment MD first appears with its construction step. |
| 220 | Figure 129а's 65°, 115° and 121° sectors are preserved. A same-side sum proves parallelism, followed by a corresponding-angle equality and a supplementary angle: angle 1 = 59°. |
| 221 | Figure 129б's 78°, 102°, 48° and the DE bisector are preserved. First AE ∥ DF; then ADF = 132°, ADE = EDF = 66°. Alternate-angle equalities give DAE = 48° and AED = 66°. Each triangle angle is established without the triangle angle-sum theorem. |
| 222 | Two distinct lines parallel to c are parallel to each other. Uniqueness of the parallel through the intersection with a proves that a transversal also meets b. |
| 223 | Choosing a point on a away from a ∩ b and drawing its unique parallel to b supplies a line distinct from a that intersects a at the selected point. |
| 224 | The contradiction construction uses a point on a away from a hypothetical intersection with b. Its parallel to b violates the universal premise. The source's two lines are explicitly treated as distinct; the note explains why coincident lines would require a different statement. |
| 225 | Unequal alternate angles contradict the necessary property of parallel lines. Two distinct coplanar lines that are not parallel intersect. The numerical model is identified as an example, not a proof of the universal claim. |
| 226 | The two shared midpoints give two separate SAS arguments. Their correct alternate-angle pairs yield AM ∥ BC and AN ∥ BC; uniqueness through A gives collinearity. The corrected third and fifth views now show the angles used at M/B and N/C. |
| 227 | The construction uses only circles and straight lines to create two perpendiculars. SSS, the isosceles-triangle bisector property and adjacent angles justify both right angles. The circle intersections and the choice of either second intersection are covered, and uniqueness of the resulting parallel is stated. |

The reviewer inspected every written step and its referenced theory points.
Only chapter I–III facts available through point 30 are invoked, with needed
auxiliary arguments supplied. In particular, the explanations do not use the
later triangle angle-sum theorem. The model coordinates illustrate the given
configurations; they are not substituted for the general proofs.

Neutral, step and alternative-view definitions were checked against the text.
Added segments, rays and construction circles are revealed with their steps;
alternative configurations have explicit availability. Angle sectors and groups
of equal-angle/equal-length marks are consistent with their actual geometry.

## Findings resolved before this verdict

1. **209: secant coinciding with AB.** The initial ASA argument did not mention
   this admissible special case. The author added its immediate equality to the
   first step and answer, and a separate model case with A = C, B = D, available
   from step 1. The reviewer checked the regenerated text and scene.
2. **226: model angles did not match steps 3 and 5.** Those views initially
   retained the vertical-angle marks at the midpoints. The author supplied
   distinct views for the resulting alternate-angle pairs at M/B and N/C, and
   separated the first construction step from the vertical-angle step. The
   reviewer checked the regenerated view objects and their equal-angle marks.
3. **227: coordinate-only follow-up after a browser clipping finding.** The
   author applied the same similarity to every point,
   `x′ = 50 + 0.7(x − 50)`, `y′ = 35 + 0.7(y − 47.5)`, and changed the authored
   bounds from `[0, 0, 100, 95]` to `[0, 0, 100, 70]`. The reviewer reconstructed
   the preceding generator in memory and matched its exact recorded hash
   `6b01c51b8ae13f5e0e5904223cbbc38954855762f30b1f7553ce5667b6194ccf`.
   Comparing both generated states confirmed that all preparation, all other
   23 models, every view definition, every step and every geometric claim are
   unchanged. Only the points and bounds of 227 differ, precisely by that
   similarity. All geometry checks passed again; the final actual-pixel
   inspection is recorded below.
4. **227: mobile label collision and spacing in the second construction.**
   After the similarity, the full browser run exposed a formal collision near
   A in step 7 at 320 px. The author changed the freely chosen second compass
   radius so that AE = AF = 10, rebuilt K as `(Ax + 10√3, Ay)`, and assigned
   explicit offsets to A, E, F and K. The reviewer reconstructed the preceding
   generator and obtained its exact hash
   `fa487dbceb11a41e831aef11a5b0c9ea2a0542f21f499d0a35f5661e3605133f`.
   The final delta changes only E/F/K coordinates and those label offsets in
   227. All preparation, the other 23 models, every view definition, every
   step and every claim remain unchanged. The arbitrary-radius construction
   and its proof remain valid. All 22 final view/width combinations were then
   inspected as real Chromium pixels; A is now outside the small EFK triangle
   in step 6 and separated from the horizontal line in step 7.

There are no unresolved source, mathematical, authored-model or model-pixel
findings at the recorded hashes.

## Reproduced validation and independent numeric checks

The reviewer executed the final authoring code up to, but excluding, its
file-writing tail. Its complete in-memory preparation and model objects equal
both serialized JSON files exactly. The coverage is exactly numbers 208–227,
with 24 cards and no missing source parts. `check_models.validate` returned zero
errors for all 24 models, all 121 views and all 127 explicit coordinate claims.

A separate numeric calculation used `atan2(abs(cross), dot)` to measure authored
angle sectors independently of the validator's `acos` implementation. It
confirmed the source data and requested values in 208, 210, 211, 212, 213, 214,
217, 220 and 221. The 217 model has B = 118.788596° (obtuse), C = 20° and AHB =
20°. The 221 model has the source angles 78°, 102°, 48° and triangle angles 48°,
66°, 66°.

## Independent actual-pixel review

The reviewer opened and read all **24 B contact sheets** from the immutable
chapter-III capture: nine sheets at 320 px and fifteen sheets at 1280 px. They
contain 73 and 86 exact PNG groups respectively, covering all **242 view/width
pairs** (121 views at each width). Only byte-identical PNG SHA-256 values were
deduplicated; each group records its full member list. Images retained the
complete model viewport. Mobile images retained native pixels; desktop images
were uniformly resized to 480 px for the contact sheets.

| Evidence | SHA-256 |
| --- | --- |
| Base capture bundle | `95c5b190f66a6588a87da7ae265ced331eee08aa610a745e85089ad7cd946b53` |
| Final base capture manifest | `174aabc69e01854d67b656d7a51c8fbb78554ce4edce689bed674873087979a5` |
| Final base contact-sheet manifest | `6bd31ecfd1cb07a6ab8a6b44430c1ec0a86ed28c140155786134d1cbe6c950f8` |
| Final 227 targeted browser evidence | `a96134346bad9b93e8e674ec7c70f6aa5466568f5e431e3502d8f347477c348b` |
| Final candidate v3 bundle | `90927ba9e2ad64d9d3d86d3ad006c643556f411a83dcead6442ac6a9deeebd31` |
| Fresh v3 delta capture manifest | `4e09f64797e3b197e36262fbab1fcd4d798182696195313e2c785e3b9f02b0b0` |
| Fresh v3 delta contact-sheet manifest | `b70ecdc83eaab6c2ea9ae5c8a1d8c1eac47d71d1d2259c08ab3830dd86f02f85` |

After the final 227 correction, the reviewer opened and read four additional
contact sheets containing **all 22 new complete model-card PNGs**, without
cropping. The targeted browser evidence reports zero issues for all 22 states.
The reviewer
verified that its `inspect` function is byte-identical to the repository gate's
function, and that the targeted script's literal model equals the model in the
final v3 bundle. This is a targeted check, not a whole-course browser verdict.

The reviewer then opened and read **all three fresh actual-app v3 contact
sheets** for 227: 18 exact PNG groups covering its 22 view/width pairs. These
fresh complete-viewport PNGs replace the earlier 227 states in the final
coverage. The targeted model-card captures remain supplementary evidence.
The corrected A/E/F/K labels, both complete circle pairs, all right-angle and
equality marks, and the final parallel are readable at both viewport widths.

For reuse of the other B screenshots, the reviewer compared the complete
normalized lesson objects between the base capture and final v3 bundle.
All **23 other B lessons are exactly equal**. The HTML entry point and the four
runtime files (stylesheet, math renderer, planar viewer and engine) are
byte-identical. The final 227 lesson differs only in the reviewed model
coordinates and label offsets. Therefore the final coverage consists of 220
unchanged view/width pairs from the immutable base capture plus the 22 final
actual-app 227 pairs, with no missing or duplicate states.

The review specifically checked point-label association, legibility, angle
sectors, equality marks, bounds and clipping, and agreement between each drawing
and its written step. The coincident case in 209, both configurations in 211–212,
both bisector arguments in 216, the obtuse-triangle height configuration in 217,
the corrected alternate-angle views in 226, and every compass construction in
227 are readable. All construction circles remain complete. No model-pixel
findings remain in the final coverage.

The companion [visual review record](ATANASYAN_7_9_CHAPTER_III_B_VISUAL_REVIEW.json)
contains the exact source hashes, every reviewed PNG-group hash and member,
every replacement PNG hash, all 242 final state mappings, and the normalized
lesson/runtime equivalence evidence. It does not contain source scans or
machine-specific absolute paths.

## Remaining verification boundary

This local content and model-visual verdict does **not** claim a successful
whole-course full browser gate, exact-head CI, external provider review, or
permission to merge or deploy. Those task/release results are recorded
separately. Any change to a reviewed file requires a new review or an explicit
comparison of the changed content.

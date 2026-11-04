# Atanasyan 7–9 chapter IV: independent review of exercises 259–291

**PASS for exact-source correspondence, mathematics, didactics and authored model consistency. Browser pixels remain a separate gate.**

Reviewer: chapter-IV theory author (`author_ch4_theory`), independent of the author of exercises 259–291. Reviewed on 2026-10-26. This is a content review of the exact file hashes below, not a merge, publication or browser approval.

| Reviewed file | SHA-256 |
| --- | --- |
| `tools/geometry-textbook/models_ch4_b.py` | `cbd00fab2276f72bf04c43e9fc3d93c63a11109a11de10fa9ad5bf4de57d5f1c` |
| `geometry-course/textbook/preparation/chapter-04-b.json` | `280634e5e55c283761fed8d6b0084fa678b38985cf08f5eaf734a12887704a9c` |
| `geometry-course/textbook/models/chapter-04-b.json` | `114a278f8eda45c80d3dfa8167ae93e9177883d04205cd2eb2aeac77391b3a4d` |

## Source and completeness

The reviewer directly viewed the source images of printed pages 79, 80 and 85, corresponding to PDF pages 80, 81 and 86, in the 2023 fourteenth revised edition. Source PDF SHA-256: `3b2e890ce425ef9b4893f367e8680e18c0ed380c9bd86fe4eb65b44a2479ca72`. All conditions, vertex assignments, numbers, requested results and parts were compared to those images. The block contains exactly 33 numbered exercises and 33 separate cards, with no missing subparts. No source scans or long source excerpts are distributed in this review.

| Printed page | Exercises |
| --- | --- |
| 79 | 259–270 |
| 80 | 271–278 |
| 85 | 279–291 |

## Independent mathematical checks

| Exercise | Finding |
| --- | --- |
| 259 | Equal acute angles split 90° into 45° and 45°. |
| 260 | Base angle 63° gives the requested angle 27°. |
| 261 | The smaller leg is opposite 30°; the hypotenuse is 17.6 cm. |
| 262 | The source exterior angle is correctly at A. It gives A = 60°, B = 30°, AC = 6 cm and AB = 12 cm. |
| 263 | CD = 6 cm, CM = 3 cm and AM = 9 cm. The projection lies on the side in this equilateral configuration. |
| 264 | The altitude foot is on the extension beyond the obtuse apex. The base is twice the height, 18 cm. |
| 265 | A leg equal to half the hypotenuse gives two 30° base angles and a 120° apex. |
| 266 | The proof treats a right apex separately and uses the supplementary acute angle when the apex is obtuse. No degenerate right triangle is used as a congruence argument. |
| 267 | Equal bisector lengths first give congruent smaller right triangles, then an equal original leg and the required congruence. |
| 268 | The triangle formed by the orthocentre and the base vertices gives base angles 70° and apex 40°. |
| 269 | The two small acute angles are 23° and 35°; their supplementary triangle angle is 122°. |
| 270 | The height foot is on the extension. The bisector and 56° auxiliary angle give 39°, 51° and 90°. |
| 271 | A common hypotenuse and equal legs give the two equal halves of the original angle. |
| 272 | Each pair of equal heights recovers one base angle through right-triangle congruence; the given side then completes ASA. The acute-triangle restriction is retained. |
| 273 | The requested opposite-angle criterion is explicitly stated and reduced to the known adjacent-angle criterion by complements to 90°. |
| 274 | The proof covers acute, obtuse and right A. The right case identifies the altitude with the side; the other cases use the criterion proved in 273. |
| 275 | The perpendicular through the given interior point to the angle bisector meets both rays; the two right triangles give equal intercepted lengths. |
| 276 | The half-hypotenuse property of the median is proved using point reflection, SAS, parallelism and equality of right triangles by legs. No later parallelogram, similarity or Pythagorean result is assumed. The answer is 5 cm. |
| 277 | Joining the circle centre to the third vertex gives two isosceles triangles and a 90° opposite angle. The proof does not use the later inscribed-angle theorem and excludes the degenerate endpoint case. |
| 278 | The established median property gives ACM = 15°, HCM = 60° and CMH = 30°. Thus CM = 8 and AB = 16. Choosing A for the source's unnamed 15° angle is legitimate. |
| 279 | The perpendicular is shorter, so subtracting the difference from the sum gives distance 8 cm. |
| 280 | The bisector gives a 30° angle in ADH, hence AD = 12 cm; the isosceles bisector property identifies AD with the requested altitude. |
| 281 | CE being the hypotenuse makes D the right vertex. The requested distance is CD = 14 cm. |
| 282 | The median is a bisector; the two right triangles with common hypotenuse give equal distances. |
| 283 | The proof compares triangles based at A and B, whose equal base angles are acute. It remains valid when a perpendicular foot lies beyond C. Equal legs and opposite acute angles imply AM = BM; the median is an altitude. Endpoint M is properly excluded by the positive/zero distance distinction. |
| 284 | Coincident-line and perpendicular-line cases are handled separately. The remaining case uses vertical acute angles and equal hypotenuses. |
| 285 | Both placements are retained: the distance is 2 cm on the same side of a, or 8 cm on opposite sides. |
| 286 | The 30° angle locates the perpendicular foot on ray DC; the distance is half AD, 3 cm. |
| 287 | The proof constructs the parallel through one suitable point, then uses the direct distance theorem and uniqueness of laying off a segment. It does not assume its own converse. |
| 288 | The set is an open ray parallel to BC, directed as ray BC. Its point on BA is excluded because the source says inside the angle. The argument works for obtuse as well as acute nonstraight angles. |
| 289 | Points outside the strip and on its boundaries are excluded; equal distances inside force the unique middle parallel. Both inclusion directions are present. |
| 290 | The earlier midpoint result 284 implies equal distances of the endpoints to a parallel through their midpoint. Uniqueness of the middle parallel proves the same locus for every segment. |
| 291 | The full-plane locus contains both parallel lines for a positive distance, and the original line for distance zero. |

All explanations use only theory available by point 37 or earlier explicitly proved exercises. Coordinate calculations in the authoring code are not used as student-facing proofs.

## Resolved finding

Exercise 280 originally displayed auxiliary H and DH in the neutral scene although the first solution step introduces that perpendicular. The author changed the neutral scene to ABC, D and AD only. The reviewer inspected the final serialized views: step 1 introduces H, DH and its right-angle marker; step 3 adds the marker showing AD perpendicular to BC. The written proof and answer remain unchanged. No unresolved source, mathematical, didactic or authored-model finding remains at the recorded hashes.

## Review of the subsequent visual and construction-timing delta

After the separate actual-pixel review reported presentation and construction-timing issues, this reviewer independently compared the new authoring code and both JSON files with the reviewed baseline at local commit `9ea54f3`. The original model hash was `efdb09d39c6f2ece52c8e286d204963a5c7e8c0605ef3cfab6f113fe822b82aa`; the current exact hashes are in the table above.

Exactly ten model cards changed: 266, 268, 270, 272, 275, 282, 288, 289, 290 and 291. The complete coordinate dictionaries, all 137 explicit coordinate claims, didactic references, step counts and answers remain identical. The 23 other cards remain identical.

| Card | Independently checked delta |
| --- | --- |
| 266 | Only the obtuse-case apex label offset changes, directing it outside the triangle. |
| 268 | The same correct 140° sector uses radius 3 instead of 7; its endpoints, vertex and mathematical value are unchanged. |
| 270 | Only the F label offset changes. |
| 272 | Only the second-triangle K₁ label offset changes. |
| 275 | Step 1 shows the angle-bisector ray without prematurely naming its later perpendicular intersection H. Step 2 introduces H together with B, C and the perpendicular. |
| 282 | Step 1 introduces only the two distance perpendiculars. Step 2 introduces median AD, matching its newly explicit instruction. |
| 288 | Step 1 shows the candidate parallel line; step 2 restricts it to the required ray and names D; step 3 adds the illustrative perpendicular distance. D has no filled point marker, and the caption explicitly excludes it from the locus. |
| 289 | Step 2 shows only the two equal point-to-line distances. The constructed middle parallel and AB/M appear at step 3. |
| 290 | Step 1 introduces the parallel through M. The perpendicular distances appear at step 2, where they enter the argument. |
| 291 | Step 1 shows only the first half-plane's parallel; the opposite parallel appears at step 2. The zero-distance scene remains the original line. |

The only preparation-text delta is exercise 282, step 2: it now explicitly says to draw AD before applying the already established isosceles-median property. This improves construction timing without changing the argument or introducing a new assumption.

The generator's in-memory outputs again equal both serialized JSON files. All 33 Python model checks and all 33 complete JavaScript lesson/viewer validations pass. This is **PASS for the revised content and model data**. It does not assert that the new label placements or images have passed actual-pixel review: the ten changed cards require fresh browser captures and the separate visual review record.

## Reproduced checks

The reviewer executed the generator without its file-writing entry point and confirmed that its complete exercise and model objects equal the two serialized JSON files. Coverage is exactly 259–291 with 33 unique cards, 113 solution steps, 154 views and 137 explicit coordinate claims. Each step has a nonempty prompt, justification and valid theory references. The Python `check_models.validate` function returned zero errors for every model, including hidden later views. The runtime `PlanarViewer.validateModel` also returned zero errors for all 33 models.

Independent numeric angle measurements using `atan2(abs(cross), dot)`, rather than the validator's `acos` calculation, confirmed the authored source/answer angles for exercises 260, 262, 264, 265, 268, 269, 270, 277, 278 and 286. In particular, both 60° at HCM and 30° at CMH in 278 were checked. Circle bounds, equality marks, right-angle markers and explicit collinearity/perpendicularity/parallelism claims are covered by the model validator.

## Verification boundary

This review inspected source pixels, written proofs, generator code and authored model data. It does not claim actual rendered model-pixel inspection, mobile readability, a complete browser gate, CI success, external-provider approval or publication readiness. Those remain separate release evidence. Changes to the three reviewed files require a new review or an explicit review of the delta.

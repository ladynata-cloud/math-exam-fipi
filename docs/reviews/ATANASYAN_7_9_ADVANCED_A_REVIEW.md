# Independent review: grade-seven advanced tasks 413–429

Date: 2026-10-28. Author: advanced-a agent. Reviewer: labels agent, a separate
agent that did not author these preparations or scenes. This is internal
independent review, not a Claude/external-provider verdict.

**Verdict: PASS for exact-source coverage, mathematical reasoning and scene
structure after the fixes below.** Full-course browser integration remains a separate release gate. The complete
advanced-A actual-page visual review is recorded separately in
`ATANASYAN_7_9_ADVANCED_A_VISUAL_REVIEW.json`: all 190 view/width pairs pass,
with one nonblocking placement observation for M in 428 construction views.

## Source and coverage

The reviewer visually read printed pages 115–117 (PDF pages 116–118) of the
exact fourteenth revised 2023 edition. The file SHA-256 was independently read
as `3b2e890ce425ef9b4893f367e8680e18c0ed380c9bd86fe4eb65b44a2479ca72`.

All 17 numbered exercises 413–429 are represented. Task 426 has both explicitly
lettered subparts, so there are 18 cards. Source page and PDF offsets agree.
The first group 413–423 belongs to chapters I and II; 424–429 belongs to the
chapters III and IV advanced group. These are not chapter-VI tasks. No copied
page images or full OCR are published by this review.

## Mathematical findings

| Tasks | Independent assessment |
| --- | --- |
| 413–414 | Reciprocal unit conversion and the order n/m are correct; positive nonzero lengths are explicit. |
| 415–416 | Both adjacent-angle identities and the five alternating sectors of figure 182 give the correct relationships. The figure’s five selected angles sum to 180 degrees. |
| 417–418 | The partition of five remaining objects into one group of five or groups of two and three is exhaustive. The two-group alternatives produce an ordinary intersection/line and contradict the source condition. Hypothetical diagrams are explicitly marked as contradiction assumptions. |
| 419 | Taking the midpoint first avoids assuming that the unknown crossing lies inside AB. SAS plus opposite-side placement proves the required collinearity. |
| 420 | Extending AC by CB reduces the sum to AD. Congruence of the larger triangles and subtraction of the base angles correctly recover the original corresponding angles. |
| 421–422 | These are valid counterexamples to missing side-angle correspondence and the missing included-angle requirement. The displayed pairs are actually noncongruent. |
| 423 | The two isosceles triangles, vertical angles and the second congruence criterion give OC=OD. |
| 424–425 | The exterior-bisector computation gives 90 degrees minus half of A. In 425 the three outer triangles share the same angle multiset; congruence of those triangles is explicitly not claimed. |
| 426 | Both strict source conditions characterize acute triangles. The original two diagrams violated this and were fixed before approval; see below. |
| 427 | Comparing the opposite sides and angles in ABM and ACM proves all three median cases without an unstated circle or cosine theorem. The acute, right and obtuse models are separate and correctly classified. |
| 428 | The equilateral ACN is on the same side of AC as B. N lies on the opposite side of BC from A; ASA then gives CM=CN=CA, and the requested angle is 70 degrees. The constructed point has the correct position and distances. |
| 429 | The maximum-distance-on-a-segment lemma is justified through a nonacute angle. Both applications and endpoint cases establish the nonstrict upper bound; no reversed triangle inequality is used. |

## Findings closed before approval

1. **Mathematical model defect, 426a and 426b:** the initial A=(0,3.4),
   B=(-3,0), C=(4,0) gave an obtuse angle at A (about 91.07 degrees), contrary
   to both source conditions. The author moved A to (0,4). The resulting angles
   are approximately 81.86989765, 53.13010235 and 45 degrees. Six explicit angle
   assertions were added for the two cards. Independent coordinate checks and
   fresh rendered images of both cards verify the correction.
2. **Line identification, 417:** the hypothetical drawing initially named only
   P,Q,R while the explanation referred to l,a,b,c,d,e. Six line-only label
   anchors now identify those lines without introducing fictitious point dots.
   Their incidence is checked and the actual narrow screenshot was inspected.
3. **Construction timing, 417:** R is introduced in step 3 and now appears in
   that step’s view; highlighting its two lines remains in step 4.
4. **Missing explicit model checks, 425:** a hidden incenter and three
   perpendicularity assertions now verify the given relation of each new line
   to the corresponding internal bisector. The helper is never displayed.
5. **Misleading implementation comment, 428:** the comment now agrees with the
   correct construction side in both code and displayed reasoning.
6. **Lemma wording, 429:** `T не лежит на UV` was made precise as
   `T не лежит на прямой UV`, matching the nondegenerate triangles used in its
   proof. The applications satisfy that assumption.

## Verification and limits

- An independent calculation script used only the generated coordinates and
  standard arithmetic, rather than the author’s invariant functions. All 52
  checks pass for the 18 cards: source angles/lengths, incidence, counterexamples,
  all three 427 cases, the 428 construction side, and auxiliary-element timing.
- The authored model checker passes its 69 assertions after the fixes. This is
  complementary evidence, not a substitute for the independent reasoning.
- Current actual 320 px standalone model images inspected directly: 416 neutral,
  417 step 3, 425 neutral, 428 final, and both corrected 426 neutral views.
  They have no observed label/geometry defect. The author’s automated 95-view
  narrow label-placement pass is retained as author evidence only.
- There is no claim of a real-pupil trial, physical-device/screen-reader review,
  full-page/all-width visual completion, release approval or publication here.

## Visual follow-up after the mathematical review

The actual-page audit identified a semantic label-placement error in 416 at
320 px: label 2 was below the horizontal ray rather than in its intended
sector. The author moved number anchors along the sector bisectors, removed
unneeded O, and added separate anchors for the transferred vertical angles
3 and 4. A minor placement issue in 428 was improved: M now appears
inside ABC beside its point in the neutral and final views. Construction
views 2–4 still place M beyond AB to avoid AN; the point remains uniquely
identifiable, with no clipping, intersection or missing label. These changes affect
label presentation only. The full 52 independent mathematical/timing checks
pass again on the model and generator hashes below. Fresh standalone 274 px
416 neutral/final and 428 neutral views were read and show the intended
placement. Final actual-page deltas have now been inspected and approved,
with the nonblocking 428 observation recorded explicitly in
`ATANASYAN_7_9_ADVANCED_A_VISUAL_REVIEW.json`.

## Reviewed bytes

| Path | SHA-256 |
| --- | --- |
| `geometry-course/textbook/preparation/grade-07-advanced-a.json` | `f619243eb1e55e5d1887c0c6dd2646fdae4639035ac28ef2019590b3d7c9108b` |
| `geometry-course/textbook/models/grade-07-advanced-a.json` | `3b08db94f508b636b93d5069b4259afcf9aeeec0cb534b379aeee48d606e55da` |
| `tools/geometry-textbook/models_advanced7_a.py` | `be1f181f910360c4e8b7cce3fe8f4699b0aaa7f88c2d52e222f76c34ef5c6beb` |

Later material changes require a focused fresh review of their effects. In
particular, a new model hash is not implicitly covered by an earlier image.

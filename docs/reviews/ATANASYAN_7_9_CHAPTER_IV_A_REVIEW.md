# Chapter IV: independent review of exercises 228–258

## Verdict and scope

**PASS for exact-source correspondence, mathematics, didactics and authored
model consistency. Browser appearance and interaction are outside this record.**

Reviewer: independent source-inventory/review agent, separate from the author
of block A. Reviewed on 2026-10-26 against task base
`9cf995d30c400a6e581a3168bb8ef8f5c76ed945`. The final uncommitted content is
identified by the exact hashes below. This is not provider approval or merge
authorization.

The complete block contains 31 numbered exercises, 44 parts, 134 worked steps,
184 authored views and 95 explicit coordinate claims. Every prepared part,
didactic step and authored scene definition was inspected.

## Reviewed files

| File | SHA-256 |
| --- | --- |
| `tools/geometry-textbook/models_ch4_a.py` | `a6b89164596335e71e90582ae4a6022ded2631dade9d52ed5c75e163baa5008b` |
| `geometry-course/textbook/preparation/chapter-04-a.json` | `27c3bb48a30576e7070c8c5ea3f9732724950f2e4fe7e82ccd3680edaacedd2b` |
| `geometry-course/textbook/models/chapter-04-a.json` | `f31f566850547741205b60dedfebf7994e7a6264a19ca14604b63594f2f7d8d8` |

## Exact source

The reviewer visually inspected printed pages **71, 74 and 75**, including
figures 135 and 136, of Atanasyan et al., Geometry 7–9, 14th revised edition,
2023. These are PDF pages 72, 75 and 76. Source PDF SHA-256:
`3b2e890ce425ef9b4893f367e8680e18c0ed380c9bd86fe4eb65b44a2479ca72`.

All numbers, printed subparts, numerical data, point incidences and requested
conclusions agree with the exact pages and with the independently established
`tools/geometry-textbook/chapter-04-source-map.json`. Source scans and long
source excerpts are not included. Earlier theory references were checked
against the book's theory-point inventory; the reviewer had also inspected
chapter-IV theory pages 69–74 during the independent inventory.

## Mathematical and didactic checks

| Exercise | Independent result |
| --- | --- |
| 228 а–г | All four angle calculations are correct. The symbolic answers retain the admissible ranges: 0 < α < 60 degrees and −60 < α < 60 degrees. Numerical scenes are explicitly examples, not universal proofs. |
| 229 | The 2:3:4 ratio gives 40, 60 and 80 degrees. |
| 230 | Pairwise base-angle equalities establish all three equal angles before division of 180 degrees. |
| 231 а, б | Positive vertex angle forces each base angle below 90 degrees; its supplement is strictly obtuse. |
| 232 а, б | The respective equations give 36/72/72 and 90/45/45 degrees. |
| 233 а–в | Both roles of the given 40-degree angle are included; the 60-degree alternatives coincide; 100 degrees cannot be a base angle. |
| 234 | The correct base is AC; half of the 50-degree angle gives ∠ADC = 105 degrees. |
| 235 | Internal half-angles 29 and 48 degrees give ∠AMB = 103 degrees. |
| 236 | AM = BM = CM gives two isosceles triangles and a direct angle-sum proof. It does not assume the later right-triangle median theorem. |
| 237 | Choosing the exterior angle at the opposite vertex proves the existential statement through the two equal base angles. |
| 238 | The exterior bisector gives the required alternate-angle equality with the base. |
| 239 | Both exterior-angle positions are retained: 65/57°30′/57°30′ and 65/65/50 degrees. |
| 240 | The equation for triangle ADB gives base angles 73°20′ and vertex angle 33°20′; the displayed 110-degree condition checks. |
| 241 а, б | Side/angle correspondence is correct. Part а excludes an obtuse A; part б supplies the valid 100/40/40 example. |
| 242 а, б | The strict order and equality of opposite sides are transferred correctly. |
| 243 | The exterior-angle argument works for every point in the open base segment, and establishes strict inequality. |
| 244 | The proof separates coincident median/altitude feet from distinct feet and includes altitude feet outside the side. Equality is retained. |
| 245 | Halving the equal base angles proves AO = CO. |
| 246 | Corresponding angles and the original equal base angles prove AM = AN without assuming similarity. |
| 247 | Only the opposite side can be parallel to the exterior bisector; the two parallel-line angle relations give equal base angles. |
| 248 | The line CD meets the extension of AB beyond A. The stated corresponding/alternate angles give AC = AD in general, not only in the drawn triangle. |
| 249 | The bisected angle and parallel DE/AC give the two equal angles of ADE, hence AE = DE. |
| 250 | Both small isosceles triangles are established independently; O lies between M and N. The model is scalene and the sum follows. |
| 251 | Figure 135 incidences, both parallel lines and bisectors are preserved. BE = EO and CD = DO yield the perimeter using the order B,E,D,C. |
| 252 а, б | SAS for ABQ/ACP and subtraction of equal angles prove BO = CO. Part б repeats the needed proof, then uses SSS and the isosceles bisector property. It does not depend on having opened part а. |
| 253 а, б | Both impossible triples fail strict triangle inequality. The scenes show separate given segments, not fictitious triangles. |
| 254 | The 25-unit base possibility is excluded; the base is 10 and the equal sides are 25. |
| 255 а–в | Both candidates for the third side are considered. The impossible equal pair includes the degenerate 5+5=10 case. Answers 7, 8 and 10 are correct. |
| 256 | Successive applications of the non-strict three-point distance inequality cover arbitrary finite polylines, including collinear cases. The equality example is separate. |
| 257 | Equal exterior angles imply isoscelesness. A 16-unit equal side is impossible; the other two sides are 29. |
| 258 | The acute exterior angle locates the obtuse interior angle at the apex, making the base the longer side. Perimeter and difference give 7,7,11; the numerical model also satisfies the obtuse-angle condition. |

Exercises 228–240 use only the angle-sum theorem and material already introduced
by point 32. Exercises 241–258 use the side/angle comparison and triangle
inequality introduced by points 33–34. The generator's trigonometry and
coordinate formulas are implementation details for illustrations, not methods
presented to students or substituted for their synthetic proofs.

Theory references were verified after the author's corrections: isosceles
properties use point 18, the angle-bisector definition point 6, median/height
definitions point 17, and SSS point 20.

## Model and computational verification

The reviewer imported the generator without writing its output and compared
its in-memory exercises and models with both generated JSON files: exact
equality passed. The independent checker `check_models.validate` passed for
all 44 models, all 184 views and all 95 listed coordinate claims. This includes
hidden alternative views and every equality, angle arc and right-angle marker.

Additional independent checks verified 16 source-angle relations absent from
some explicit claim lists, including the bisectors in 234, 235, 238, 240,
245, 247–251 and the obtuse/acute pair in 258. A deterministic numerical stress
check (seed 20231004) examined 1,000 configurations each for 243, 244,
248, 249, 250, 251, 252 and 256. Internal bisectors were constructed from unit
ray directions, independently of the author's weighted formulas. Checks
included outside altitude feet, general scalene triangles, correct extension
and segment orders, non-midpoint P/Q, and arbitrary polylines. All passed.
These computations supplement the general proofs reviewed above.

Neutral scenes show given objects and marks. Derived equalities/right-angle
marks and added proof segments appear at the relevant worked steps. Scene
definitions, point labels and angle sectors are internally consistent.

## Findings resolved before this verdict

1. Exercise 239's alternative base-angle scene initially unlocked after step 2,
   although that case is introduced at step 3. The author moved its unlock to
   step 3; the reviewer checked the regenerated view object.
2. Exercise 256's equality scene initially unlocked after step 3, before its
   explanation at step 4. The author moved its unlock to step 4; the reviewer
   checked the regenerated view object.

There are no unresolved source, mathematical, didactic or authored-model
findings at the recorded hashes. This review makes **no claim about rendered
pixels, browser controls, saved board work, mobile layout, or publication**;
those require the separate integration/browser review.

## Narrow 252б display correction after the first browser run

The reviewer inspected the actual 320 px PNG for `252-part-2`, `step-5`, from
CI run `40318034439`, head `2f8b1217d651ff32bf90583642171dbe538f1e7e`.
The artifact ZIP SHA-256 is
`9311336e477c1ffde8409b1759ea902c7e476d687984ffb1f5df19038ba57ce1`.
This run reached all 5,812 authored view/width inspections and reported a
single problematic view: overlapping line/label placements at B, P, O and M
in that final mobile scene. The run is failed, not visually approved.

The final scene now shows A, B, C, O, M with triangle ABC and AM. It retains
the proved BM = MC and right-angle marks, while removing P/Q and crossing
segments BQ/CP that are no longer needed in this final conclusion. Earlier
scenes preserve the full given configuration and both congruence arguments.
The reviewer compared the old and regenerated JSON directly: only the
`points` and `segments` of this one final view changed. Coordinates, checks,
marks, every other view and every preparation byte are unchanged. The final
picture still expresses the proved median/height conclusion with O on AM;
no mathematical premise or proof step is lost.

Generator reproduction and all 44 model validations passed again. The hash
table above now identifies this corrected candidate. This is a **PASS for the
data/didactic delta only**. Fresh browser execution and actual pixels for the
corrected view are still required; the earlier failing PNG cannot establish
that its replacement renders correctly.

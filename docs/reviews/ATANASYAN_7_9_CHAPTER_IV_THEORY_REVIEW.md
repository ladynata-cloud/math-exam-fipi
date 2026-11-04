# Chapter IV: independent theory and review-question check

## Verdict and scope

**PASS for exact-source coverage, mathematics, didactics and authored model
consistency at the file hashes below. Browser appearance and interaction are
outside this review.**

Reviewed on 2026-10-26 against task base
`9cf995d30c400a6e581a3168bb8ef8f5c76ed945`. The reviewer is the author of
exercise block A, but is independent of the theory author and made no changes
to the theory generator or its generated data. This record does not approve
the reviewer's own exercise block. It is not an external-provider verdict,
publication approval or merge authorization.

The reviewed content contains all eight theory points 31–38 and all 23 review
questions: 31 cards, 167 worked steps, 224 authored views and 96 explicit
coordinate claims. Every proof, didactic step and authored scene definition
was inspected.

## Reviewed files

| File | SHA-256 |
| --- | --- |
| `tools/geometry-textbook/models_ch4_theory.py` | `6ae1afd084a64a2da48fb4857fb5bc5be9827a13d38cba2bc82a0b5d0aa501bb` |
| `geometry-course/textbook/preparation/chapter-04-theory.json` | `d2a7d2dbe4fedb3ba5e6b961679dffdecd3193d6c6ba24a7d2fbef62bdaed094` |
| `geometry-course/textbook/models/chapter-04-theory.json` | `01f22365db641b2363fbcf03f88898f4aae004aecda0b302c3bb94b2eafad474` |

## Exact-source correspondence

The reviewer directly viewed the rendered source pages **69–85 and 87–89**
(PDF pages 70–86 and 88–90) of Atanasyan et al., Geometry 7–9, 14th revised
edition, 2023. Source PDF SHA-256:
`3b2e890ce425ef9b4893f367e8680e18c0ed380c9bd86fe4eb65b44a2479ca72`.
No source scans or long excerpts are included in the delivered content.

| Theory point | Source pages | Coverage and independent mathematical check |
| --- | --- | --- |
| 31 | 69–70 | The parallel-through-a-vertex proof of the 180-degree sum, quadrilateral consequence, exterior-angle definition, exterior-angle equality and strict comparison with either nonadjacent interior angle are included. The exterior-angle proof uses the angle sum only after establishing it. |
| 32 | 70–71 | The exclusion of two nonacute angles establishes the classification. Acute, obtuse and right examples are separate; the hypotenuse and both legs are correctly identified. |
| 33 | 72–73 | The auxiliary isosceles triangle proves side-to-angle order. The converse excludes equality and the opposite inequality using the proved direction. Both corollaries—hypotenuse greater than a leg, equal angles imply isosceles—are included without circular reasoning. |
| 34 | 73–74 | Extending AC by CB and comparing angles in ABD proves AB < AC + CB. All three strict inequalities and the exclusion of a collinear triangle are retained. |
| 35 | 75–77 | All four properties and both criteria are covered: acute-angle sum, 30-degree leg property and its converse, median to the hypotenuse, criterion by the sum of two angles and criterion by the median. The two median results have separate elementary angle proofs; neither assumes the other. |
| 36 | 77–79 | All four congruence criteria are proved: two legs; leg and adjacent acute angle; hypotenuse and acute angle; hypotenuse and leg. The last proof treats both possible orders of unequal endpoints and obtains an acute/obtuse contradiction. Its hypothetical contradictory equal lengths are not falsely marked as coordinate facts. |
| 37 | 80–83 | Inclined segment, projection, point-to-line distance, shortest perpendicular, equal distances between parallel lines, distance between those lines, the converse locus and both inclusions in that locus are covered. The one-sided condition is used explicitly; d = 0 and the two-sided positive-distance extension are distinguished. The marking-gauge application is retained. |
| 38 | 83–85 | SAS, ASA and SSS construction procedures, verification and congruence-based uniqueness are covered. Positive input lengths, nondegenerate included angle, positive adjacent angles with sum below 180 degrees and strict triangle inequalities are required. SSS includes the reflected position and the equality/impossible boundary. |

All 23 questions match their printed numbering and required conclusions:
questions 1–2 on page 87, 3–21 on page 88 and 22–23 on page 89. In particular,
question 6 proves both directions, question 11 includes the converse,
question 16 proves the upper bound by perpendicular plus projection,
question 20 proves both inclusions of the locus, and question 22 retains both
construction subparts. No source question is replaced by a different task.

## Didactics and scene progression

Each retained step has a prompt, an original explanation, a reason and related
theory points. The proofs use only material introduced by the relevant point;
no Pythagorean theorem, similarity or trigonometry is presented as a student
method. The different assertions within a theory card have separate scenes,
rather than overlapping unrelated diagrams. Reused question proofs preserve
their full explanations and do not require an earlier question to be opened.

The neutral scenes contain the starting objects and conditions. The parallel
line in the angle-sum proof, auxiliary equal segment in point 33, extension in
point 34, reflected triangle and median rays in point 35, contradiction point
in point 36, and perpendiculars/diagonal in point 37 appear in their respective
steps. Construction cards initially display an unnamed reference segment;
the labelled base and subsequent rays, circles and sides appear when built.
The SSS reflected complete triangle unlocks only after the connecting-side
step. Hidden future coordinates do not themselves make points visible.

The locus intersection Z is identified at its introduction; the subsequent
step establishes its coincidence with X. No global label states X = Z before
that reasoning. The hypotenuse-and-leg proof initially shows the two given
triangles, then switches to the superposition/contradiction diagram.

Earlier references were checked against the exact-edition theory inventory:
16 is perpendicular construction, 17 is medians/bisectors/heights, 18 is
isosceles properties, 19 is the second congruence criterion, 20 is the third,
and 23 contains the equal-angle construction.

## Computational verification

The reviewer imported the generator without writing its outputs and compared
the in-memory theory, questions and models with the generated JSON: exact
equality passed. Every prepared record's didactics agrees with the matching
model. All steps have corresponding views and nonempty prompts, reasons and
theory references.

`check_models.validate` returned no problems for all 31 models, including all
224 views and 96 explicit claims. The check covers equal-side and equal-angle
marks, right angles, incidences, parallelism, perpendicularity, ratios and
circle containment within the authored bounds. The final timing and label
corrections were separately asserted against the generated scene objects.

An additional independent numerical check used deterministic seed 20261026
and 1,000 configurations for each group: general triangle angle sum,
side/angle ordering and strict inequalities; arbitrary right triangles and
their hypotenuse medians plus scaled 30-degree examples; perpendicular,
inclined segment and projection comparisons with both endpoint orders; and
SAS/ASA/SSS constructions. All checks passed. Trigonometry in that reviewer
calculation measured coordinates only; it is absent from the learner proofs.
These finite checks supplement the general proofs reviewed above.

## Findings resolved

1. Several earlier-theory links used the wrong point numbers for isosceles
   properties, medians, second congruence and equal-angle construction. The
   author corrected the references by their semantic reasons.
2. The SSS reflected complete triangle initially unlocked at the circle
   intersection step, before its connecting sides. Its unlock is now step 4.
3. Construction neutral scenes initially labelled AB before the construction
   step. They now show an unnamed reference segment. ASA's first step only
   discusses admissibility and therefore retains that reference scene.
4. SAS's third explanation connected BC while its picture delayed BC until
   the next step. The picture now includes BC in step 3.
5. The locus proof introduced Z without identifying it in its scene; an
   unrelated line helper also used that identifier. The helper was renamed,
   the actual intersection Z now appears in step 3, and X appears after the
   equality argument in step 4.
6. The integration validator rejected empty labels on construction reference
   endpoints. The author removed those label entries and preserved a leading
   underscore in the combined helper IDs, which the unchanged renderer uses
   to suppress anonymous endpoint labels. Only point 38 and questions 22–23
   are affected. Their text, coordinates, constructions and view timing are
   unchanged; the preparation-file hash is unchanged.

For finding 6, the reviewer independently reversed just the helper-ID/label
transformation in memory and reproduced the exact previously reviewed model
hash `1b3f6ee171852cc1cdcc888d01c0ca88bfae7b5a62d5183aa64677b19b7595c0`.
Generator-to-JSON equality and all 31 Python model checks still pass. With the
31 fresh models substituted into the 569-lesson candidate in memory, the
unchanged JavaScript `engine.validateLesson` and `PlanarViewer.validateModel`
both returned zero errors for every lesson. This is validator evidence only,
not a browser-rendering or interaction result.

The later independent mobile/desktop image review identified five named case
buttons that returned to a statement's bare initial diagram after its relevant
construction was already unlocked. The author corrected only theory 31
`case-1`, theory 35 `case-3`, and theory 37 `case-2`, `case-3`, `case-4`.
They now respectively show the exterior angle, constructed median ray,
perpendiculars for the two distance discussions, and the first locus
construction. The reviewer independently compared the generated models with
the previously reviewed `b7f01d4fdbfa1aaf93e69795dda405413aad9eaccf0d52ce2302ed972379f445`
version and confirmed exactly those five view changes. Every other model
field, coordinate, check, view, self-check and all preparation bytes are
unchanged. Each corrected case equals the already reviewed construction at
its existing unlock step; no future equality conclusion was introduced.
Generator equality and all 31 model checks pass again. This resolves the
authored case definitions; fresh rendered images are required to resolve the
separate visual review.

There are no unresolved source, mathematical, didactic or authored-model
findings at the recorded hashes. **No rendered-browser, mobile-layout,
interaction, saved-work or publication result is claimed.** The separate
integration and browser review must still inspect real rendered output.

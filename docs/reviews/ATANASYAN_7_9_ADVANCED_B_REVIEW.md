# Advanced grade-seven exercises 430–445: source and mathematics review

Date: 2026-10-28. Reviewer: independent OpenAI source-inventory and mathematics
agent, separate from the B preparation/model author. Verdict: **PASS for the
source, proof and coordinate scope below**. No browser-image, external-provider,
exact-head CI or publication verdict is supplied by this record.

## Exact reviewed inputs

| File | SHA256 |
| --- | --- |
| `tools/geometry-textbook/models_advanced7_b.py` | `e2e473c24ea32e4766fd5bf28bb28e306eaea04df366657461bd2e7a467138c3` |
| `geometry-course/textbook/preparation/grade-07-advanced-b.json` | `1e3e832b0aa84e7f18bfab882b9ca37b7b1342edfe5b72ad0c38deecc27b5a2a` |
| `geometry-course/textbook/models/grade-07-advanced-b.json` | `0abda31e287a2b30ae4f6c1e8444bea11f11e6c00aee0aa2b15b0ca8b7ce2027` |
| `tools/geometry-textbook/grade-07-advanced-source-map.json` | `cb28ba072c98544f00c36b15d08887a493998d961f44d7419ca625f31d53a5bd` |

The source is the exact 2023, 14th revised edition, ISBN 978-5-09-102538-5.
Its PDF SHA256 is
`3b2e890ce425ef9b4893f367e8680e18c0ed380c9bd86fe4eb65b44a2479ca72`.
The reviewer visually read every printed page 115–120 before reading authored
advanced material. The B source scope is printed 117–119 (PDF 118–120), including
the complete worked construction 442 and figures 183–184. The independent source
map therefore precedes, rather than derives from, this author's card counts.

## Per-exercise findings

All 16 numbers have one unlettered part. All conditions, answers and **72
explanation steps** were read, not sampled. Page/part identity was compared
against the independent map; 442 correctly records both pages 118 and 119.

| Number | Checked reasoning and boundary |
| --- | --- |
| 430 | Both inequalities follow from the opposite angle being the half-angle plus a positive triangle angle. |
| 431 | The ray BD meets AC beyond the interior D; the obtuse angle ADE gives AE > AD and the strict chain AC > AE > AD = AB. |
| 432 | Correct direction of both angle and length inequalities; the copied shorter side and SAS proof establish ED = CD before use. |
| 433 | Doubling the median gives the needed congruent triangles and an isosceles ACE; no circular converse is assumed. |
| 434 | The doubled median transfers the unequal side lengths to one triangle; the larger split angle is correctly adjacent to the smaller original side. |
| 435 | Congruence is checked without assuming vertex correspondence. Cancelling one copy of the common side length leaves two pairings; one contradicts AB ≠ AC, the other the strict triangle inequality. Endpoint degeneracy is explicitly separated. |
| 436 | Reflection in the perpendicular to the internal bisector sends B to the opposite ray of AC; strict triangle inequality gives the perimeter comparison. |
| 437 | The angle ADB is acute, placing H on the specified ray DB. Internal, vertex-coincident and external altitude feet are retained. |
| 438 | The two independent inequalities place H and M on opposite sides of D. E, ED and their established equalities appear at the corresponding proof step. |
| 439 | The midpoint-of-hypotenuse lemma is proved through a doubled median and congruence, not assumed through a later similarity theorem. The two angles around the right-angle bisector agree. |
| 440 | With ray order AB, AM, AH, AC, congruence makes H the midpoint of MC. Reflecting B in AM gives P on ray AH beyond H, MP = BM = MC and PM = PC. The equilateral MPC gives 150° − x = 90° + x, hence x = 30° and A = 90°. |
| 441 | The closed chain BC ≤ AA₁ ≤ AC ≤ BB₁ ≤ BC forces equality, coincident feet at C and equal legs. |
| 442 | All source feasibility cases are present: a shorter-than-height side, both sides equal to the height, one side equal to the height, equal larger sides, and unequal larger sides. Counts are explicitly up to triangle congruence; the second same-side form is separate. |
| 443 | The given acute angle and positive bisector length fix D. A perpendicular reconstructs the triangle. Choice of C as the right vertex is explicitly without loss of congruence, covering right A by exchanging A and C. |
| 444 | The two-circle construction with radii 2r and r follows from a half-turn around B and is proved by congruence. The order A–B–C, ratio AB = BC and exact thresholds r < OA < 3r, OA = 3r, OA > 3r are correct. |
| 445 | The angle and altitude first fix AB = c. The perpendicular-bisector completion gives the prescribed perimeter exactly when p > 2c. Acute, obtuse, right-angle, equality-degenerate and insufficient-perimeter cases are distinguished. |

The reviewer independently wrote and ran **70 coordinate checks** derived from
these source conditions and conclusions, separately from the author's stored
claim list. They cover every number, all three altitude placements in 437, both
placements in 438, reflection and equal-angle identities in 440, all feasibility
models in 442, both secants and boundary/no-solution models in 444, and every
445 case. All passed with absolute tolerance 2e-6 after reading the final model
JSON. These are illustration checks; the universal results above were checked
by reading their proofs and are not inferred from numerical examples.

The repository's unchanged model validator also passed the **16 models and 82
stored coordinate claims**. The reviewed snapshot contains **103 views**.
View declarations, auxiliary-point visibility and case unlock steps were read;
actual rendered-image review is a separate obligation.

## Corrections made during review

- Exercise 443 now explicitly allows either right-angle vertex and states the
  given bisector length as BD = UV.
- The last view of 441 explicitly identifies A₁ = B₁ = C.
- Construction step 3 of 442 now displays the circle of the second radius and
  the base line; supplied segments are explicitly related to b, c and h.
- Exercise 445 identifies PQ = p and UV = h in its givens.
- The author independently completed the missing E/ED view in 438 and the
  right-angle and no-solution cases in 445 before this final snapshot.

The reviewer shared mathematical observations about 435 and 445 and suggested
an alternative elementary route for 440. The author's final 440 proof uses the
different reflected-B/equilateral-MPC argument checked above. Root additionally
cross-checked an elementary reflection argument against the source. No new
external consultation or external-review waiver is fabricated by this record.

No unresolved source or mathematics blocker remains in this B snapshot. Pixel
collisions, clipping, actual caption readability, runtime persistence, cabinet
integration, full-course regression and final release identity remain outside
this review and must use their own evidence.

## Narrow graphical amendment: external altitude feet

After the initial review, the independent visual reviewer requested that the
extension from B to the external altitude foot H be explicit. The author added
only `dashSegments: [["Bo", "Ho"]]` to **case-1 of 437 and case-1 of 438**.
Here the suffix belongs to the internal case point IDs; their learner labels
remain B and H. The dashed segment is collinear with BC and makes the existing
external-foot geometry explicit. It introduces no new mathematical assumption.

The source/mathematics reviewer verified the delta exactly. Removing those two
JSON properties and serializing in the original format reproduces the initial
reviewed model SHA256
`ce85b2330537de2ddaf017951c46bfd0d8b2819cf38355383f38a7fd563efabe`.
Removing the two corresponding generator additions reproduces its initial
SHA256 `430689003c4c62bd79db869f53e2387190f0273ca3159db00e4235f7781db79c`.
The preparation SHA256 is unchanged, so every condition, answer and explanation
step is identical. Coordinates, checks, labels, other views and case timing are
also identical to the initial reviewed model.

The 70 independent source-derived numeric checks and the repository model
validator's 82 claims were rerun on the amended files: **PASS**. The exact
reviewed-input table above now binds this amended generator/model pair. This
amendment does not claim any new PNG or browser-image review; fresh captures and
their independent visual review are tracked separately.

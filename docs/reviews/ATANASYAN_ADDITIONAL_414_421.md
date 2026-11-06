# Source and mathematics review: Atanasyan №414–421

## Scope and provenance

Fourteen cards preserve every original part of eight source numbers:
414а/б/в, 415а/б, 416а/б, 417, 418а/б, 419а/б, 420 and 421. They contain
58 justified steps and 60 reachable model views. The preceding 674 raw lesson
files, source positions, catalogue identities and review history are frozen by
the additional414 baseline. The next source number is 422; the textbook as a
whole remains incomplete.

The author visually read the owner-supplied 2024 twelfth edition, printed
113–114/PDF 115–116, and answer page 265/PDF 267. Source SHA256:
`bead97a383e438b32b9caaff72d61d27e8fa6cd20c6b86a5f234bc4cdb629770`.
There is no source illustration associated with these exercises. The figures
are original coordinate constructions. Neither scans nor the PDF are committed.

The root coordinator independently read all fourteen written solutions and
the actual three source-page images in the current session. This review
confirmed the mathematical conclusions, both locus inclusions and the source
discrepancy below. A clarity comment in 414б was applied: the comparison of two
right triangles explicitly starts with H ≠ O; H = O was already handled.
The exact independent receipt binds the final content hashes and the actual
visual inspection separately. This prose does not assert an image review before
it occurs, and no external-provider verdict is claimed.

## Mathematical conclusions

| Source part | Verified reasoning and boundary |
| --- | --- |
| 414а | Central reflection preserves OA = R; its involution gives both inclusions. |
| 414б | A half-turn about any line through O preserves distance to O. Points on the axis and H = O are handled before the nondegenerate triangle comparison. |
| 414в | Reflection in a plane through O preserves distance to O. Fixed points and H = O are handled, and the reverse inclusion is explicit. |
| 415а | The hypotenuse is 3 cm, equal to the sphere diameter. Equality in OB + OC ≥ BC puts O on BC; OB = OC then makes it the midpoint. |
| 415б | The projected centre is the triangle circumcentre, the hypotenuse midpoint. OH² = 6.5² − 1.5² = 40, so OH = 2√10 cm on either side of the plane. |
| 416а | OA = R/3, not R/2. Tangency gives OH = R/6; sin∠OAH = 1/2 and the required acute angle is 30°. |
| 416б | The section disk has squared radius 35R²/36. Dividing its area by 4πR² gives 35/144. |
| 417 | Normals through the two rectangle centres lie in the same plane perpendicular to the common side. They are nonparallel and intersect. Pythagoras gives the same radius to all six vertices, including a zero normal length. |
| 418а | Distinct equal-sphere centres with 0 < d < 2R give a positive-radius circle in the perpendicular bisector plane. Both inclusions are proved. Coincident spheres are explicitly excluded because their intersection is the whole sphere. |
| 418б | At d = 1.6R the plane distance is 0.8R, so the intersection-circle radius is 0.6R. |
| 419а | ABC is equilateral, a = 2l sinφ, h² = l² − a²/3 and l² = 2Rh. The final formulas name AD and AB separately; 0 < φ < 60°. No interior-centre assumption is used. |
| 419б | The section radius is a/√3. Its disk area is (16/9)πR²sin²φ(3 − 4sin²φ). The proof is self-contained even without opening part а. |
| 420 | OM = 26 cm. Subtracting the two squared distances gives the plane coordinate 50/13 cm and circle radius 120/13 cm. The converse is checked for every circle point; circumference is 240π/13 cm. |
| 421 | The central annulus has area π(R² − r²). Inner tangency gives the same squared radius R² − r² for the other section. A possible single tangent point has zero area. |

## The printed answer order in №419

The condition requests AB and then AD. The answer line on printed page 265
lists the expression for AD first and that for AB second. The labels therefore
cannot be assigned by copying the printed order.

Let l = AD = BD = CD and s = sinφ. The three equal isosceles faces give
a = AB = 2ls, so the altitude from D to the equilateral ABC is
h = l√((3 − 4s²)/3). Both D and the sphere centre O are on the normal through
the circumcentre H of ABC. With M diametrically opposite D, triangle DAM is
right and AH is its altitude to DM, hence l² = 2Rh. Therefore

- **AD = 2R√((3 − 4sin²φ)/3)**;
- **AB = 4R sinφ√((3 − 4sin²φ)/3)**.

A distinct-length check uses R = 3 and φ = 45°:
D = (0, 0, 2), O = (0, 0, −1), A = (2√2, 0, 0),
B = (−√2, √6, 0), C = (−√2, −√6, 0).
All four vertices lie on the sphere, all three given angles equal 90°, while
AD = 2√3 and AB = 2√6. This independently identifies the two formulas.
The model also demonstrates why the proof must allow O outside the tetrahedron.

## Pedagogy and models

Conditions and initial views retain the givens. In 415а the centre and radii
are deliberately absent from the initial highlighting: the proof exposes them
at the diameter step. In 417 the sphere's three great circles appear only in
the final view, after the common centre has been constructed. Its two rectangle
planes form a generic 60° angle, so the model does not imply perpendicular
planes. The central section in 421 highlights both ring boundaries without
painting the inner hole as part of the section.

The 415б illustration shows the small triangle and relevant radii locally,
without a large surrounding sphere obscuring the construction. It preserves
all exact lengths. All definitions and theorems linked to the published course
use its exact source objects. Free-form proofs remain manual: saving a
reasoning draft does not claim that its mathematics has been graded correctly.

## Executed checks and remaining release evidence

The direct coordinate audit checks 14 source models, 20,304 sphere-surface
endpoints, 1,440 parameter families and 14 deliberately corrupted candidates.
It parameterizes №419 by an independently chosen sphere-section height instead
of reproducing the authored formula. It also covers generic two-rectangle
angles, possible O = P, all circle points in the locus problems and fixed
points of the symmetry operations.

The full model gate passed for 688 cards: 28,835 planar simple polygons and
67,073 nonzero segments. JSON schema validation passed for 688 authored cards
and 1,419 catalogue entries. These are executable checks, not a substitute for
actual image inspection. The final pre-release browser capture exercised 42 routes, one per card at
320, 390 and 1280 px. It produced 180 model-state PNGs and 42 complete cold
entry pages on Chromium 134.0.6998.35. The author actually read all 42 full
pages, including each source caption, statement, initial model, controls,
collapsed help and response field; no blocking display defect remained.

The first 320 px capture of 416б placed the bottom of its diagram at 1005.5 px
on a 900 px viewport. Shortening only the goal preserved the requested ratio
of the section disk area to the sphere surface area. In the repeated capture,
the 416б diagram ended at 867.77, 807.14 and 598.91 px for the three widths;
the greatest bottom coordinate across all 42 cold entries was 867.77 px.
The comparison found 211 identical PNG files and 11 changed files, all for
416б: three complete initial pages and eight model panels at the two phone
widths. All new hashes are bound to authored SHA256
`1712465d90a82a8bf14b22dacedacb54a305b3834f2f39a8a64b5007aa376048`.
[The independent receipt](ATANASYAN_ADDITIONAL_414_421_INDEPENDENT.json)
records the coordinator's actual inspection of all 180 model states, the 14
complete 320 px pages and the two larger 416б pages. The author read all 42
complete pages separately. The receipt preserves the exact 222 capture hashes.
The final gate verifies that the reviewed content SHA, viewport widths and
complete set of expected image names match the current 14 cards.

The ordinary public-mode browser also passed on the actual local course, with
no review fixture: 42 journeys, 180 model states and 222 screenshots. It
verified HTTP 200 and exact bytes for the course and all four runtime files.
All 222 public-mode PNGs were byte-identical to the visually reviewed final
capture. The real course SHA256 is
`3744e72a7d7bc976aab23eec7b0645abb370cae1edaae4dbfa4ebee6366bc911`; the local public
evidence manifest SHA256 is `84d30f50e4406a7010a67696200b5b650f465529a125c7333f7bac8409f50079`.
This is a local public-route check; exact-head CI and production remain
separate evidence.

The 37 local source-model commands completed successfully. They cover
the exact earlier catalogue, lesson files, reviews and browser cases;
schema and source contracts; deterministic generation; model geometry;
runtime and retained work; negative controls; and all four browser partition
preflights. These preflights confirm coverage assignments, not full runs of
the 688-card browser suite. The focused current gate additionally rejected
a missing group of eight source contracts, for ten integration negative
controls, and rejects both stale authored content and a missing visual hash.
Physical-device and real-pupil trials have not been performed.

Rollback is an ordinary scoped revert and redeployment. Existing learner
storage, the previous 674 cards, renderer and schema remain unchanged. The
separate shared-board registry and two-client synchronization are outside this
content increment and are not claimed as verified by its textbook journeys.

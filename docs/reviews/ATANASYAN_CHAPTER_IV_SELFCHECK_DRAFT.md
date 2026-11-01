# Chapter IV self-check — authored candidate

## Result

Thirteen draft cards cover all ten original chapter IV questions and their
printed parts. They contain 31 justified steps and 45 reachable model states.
The editorial reader uses the existing mathematical text and scene renderer,
keeps help and explanations optional, and retains an in-memory answer while
the reader opens hints, rotates the figure or changes cards. It writes no
persistent learner state.

Canonical candidate: `content-drafts/atanasyan-chapter-iv-selfcheck/`.
Open `index.html` through a static HTTP server rooted at this repository.
This is an editorial preview, not a new published course. All review flags
remain pending. The production catalogue continues to contain 640 cards.

## Source inspection and content decisions

The supplied twelfth-edition PDF, SHA-256
`bead97a383e438b32b9caaff72d61d27e8fa6cd20c6b86a5f234bc4cdb629770`,
was read and visually inspected on PDF pages 113–114 / printed 111–112.
The original source pages and their extracted text are not included here.

| Source question | Cards | Specific mathematical boundary |
| --- | ---: | --- |
| 1 | 1 | A plane containing a generator contains a perpendicular to the base. |
| 2 | 1 | Proper rectangular section; tangent generator and empty intersection separated. |
| 3а/б/в | 3 | Bounded chords; positive distance between disjoint projections; distance never below height. |
| 4 | 1 | Whole surface including both bases, under the thin-coating model; side-only alternative explained. |
| 5а/б | 2 | Angles to base plane and axis proved separately using equal right triangles. |
| 6 | 1 | Isosceles proper section through apex; tangent generator and apex-only intersections separated. |
| 7 | 1 | Solid-ball convexity; equal endpoints and center on line included; sphere distinguished. |
| 8 | 1 | Radius is √5, not 5. Hypotenuse 2√6 exceeds sphere diameter 2√5. Impossible inscription is never depicted as valid. |
| 9 | 1 | One distance from a common center cannot equal two distinct radii. |
| 10 | 1 | Both locus inclusions; sphere rather than ball; both endpoints excluded. |

## Checks and preservation

- PASS: all 13 cards satisfy the existing schema and runtime validator.
- PASS: all 45 authored states mount as finite SVGs; every state is reachable
  through an actual step, hint or initial view, and all theory targets exist.
- PASS: all 13 actual coordinate models and 1,500 reproducible parameter cases,
  with radical and endpoint negative controls.
- PASS: frozen hashes of all 640 published raw lessons plus 11 course,
  schema, renderer, runtime, source and review files. Pending candidates stay
  unavailable even when deliberately supplied to the production inspector.
- PASS: JavaScript syntax and whitespace checks.
- Local browser attempt did not run: the pinned Playwright Chromium executable
  is unavailable. No TLS, sandbox or launch-security bypass was used.
- The initial CI browser run found a real first-screen failure in question 4
  at 320 px. Its condition was shortened without removing the size ratios,
  whole-surface coverage or equal thin-layer assumption. The first-screen
  assertion remains unchanged; final evidence requires a fresh completed run.
- Author inspection of those actual images also found that the preview lacked
  the existing `task-scene` wrapper class. Restoring it fixes the narrow expand
  button and the full-screen figure layout. Browser checks now exercise all
  39 expand/close journeys and verify unclipped control text.
- Author inspection of the completed run found that the default camera hid
  the horizontal component in question 3б. The lower chord was reflected to
  the opposite side; the nearest pair and proof coordinates were updated
  together. The same correct distance now has a visibly sloped connecting
  segment. This is a clarity correction, not a change to the mathematical answer.
- Fresh CI browser results and actual image inspection are recorded on the
  exact-head Draft PR. The browser plan covers 39 card/width journeys,
  135 model states and 216 images at 320/390/1280 pixels; planned counts are
  not represented here as an executed result.

## Review boundary and remaining integration

These are author checks and algorithmic oracles, not independent content
review. A separate reviewer has not approved this increment. No external
provider, physical-device or real-pupil verdict is claimed.

Before publication: review the exact source, proofs, models and screenshots;
then integrate the thirteen cards, source-part contracts, review hashes and
additive historical projections in the same scoped task. The expected total
after a reviewed integration is 653 cards and 50 complete self-check questions.
Run the complete course checks on that integrated head, and obtain a separate
release decision. No production or learner record is changed by this draft.

Rollback of this preparation is an ordinary revert of the isolated draft files,
its tools and workflow. No learner-data migration or removal is involved.

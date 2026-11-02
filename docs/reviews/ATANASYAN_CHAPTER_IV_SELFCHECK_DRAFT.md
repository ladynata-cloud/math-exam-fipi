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
- Fresh head-branch CI run 41352063380 passed on
  `97e0da6bb64fa3dec3f919bd812e6ee2f426696c`: 39 card/width journeys,
  135 model states, 39 expand/close cycles and 216 actual screenshots at
  320/390/1280 pixels. All nine fraction displays and three missing-style
  negative controls passed. Artifact 13100749370 binds the actual card hashes.
  This was a push-triggered candidate check, not a PR merge-ref check.

## Review boundary and remaining integration

Author checks and algorithmic oracles are separate from the
[independent review](ATANASYAN_CHAPTER_IV_SELFCHECK_INDEPENDENT.md), authorized
by the owner on 2026-11-02. That review passed the source, proofs and coordinates,
but requested changes because the isolated preview rendered AB/2 as AB2.

The candidate now includes the existing fraction layout rules and browser
assertions for numerator/denominator positions and the visible bar. Negative
controls reproduce the missing-style defect. It also shows a full diameter
parallel to the hypotenuse in question 8 and corrects the case ending in the
question 3а title. Fresh CI passed and the independent reviewer confirmed
all nine rendered fractions, question 8's diameter/neutral views and the
corrected title on all three widths. The original CHANGES_REQUESTED verdict
is retained historically; the separate focused PASS is appended in the review.
All thirty unaffected complete-page images and 132 unaffected drawing crops
match the preceding evidence. No paid external-provider, physical-device or
real-pupil verdict is claimed.

GitHub currently reports the PR as `mergeable=false` / `dirty` against unchanged
main `4afa9caa033c6d861d2a412ad2b9ad2957acb531`, while the local read-only virtual
merge is clean and preserves every task blob. No merge or branch-history repair
was performed. The same workflow jobs gained a push trigger scoped to this
exact branch so review evidence could be generated. This does not resolve or
approve the release merge; production integration and release gates remain.

Before publication: integrate the independently reviewed thirteen cards,
source-part contracts, review hashes and
additive historical projections in the same scoped task. The expected total
after a reviewed integration is 653 cards and 50 complete self-check questions.
Run the complete course checks on that integrated head, and obtain a separate
release decision. No production or learner record is changed by this draft.

Rollback of this preparation is an ordinary revert of the isolated draft files,
its tools and workflow. No learner-data migration or removal is involved.

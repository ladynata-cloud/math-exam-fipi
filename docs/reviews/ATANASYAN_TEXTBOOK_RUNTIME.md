# Independent integration review — Atanasyan textbook foundation

Verdict: **PASS for the reviewed source/runtime snapshot.** Actual integrated browser execution and screenshot review remain a separate publication gate; this report does not claim they have run.

Reviewer: `ege_independent_review`, with a delegated metadata/join audit from `intro_geometry_audit`. Neither reviewer changed lesson contents or authored review flags. The independently approved mathematical/source/pedagogical content remains the 39 introductory cards whose authored `lessons.json` SHA256 is `5fe4617d01fe492c47210475ec9d16d77e1389da2808b3491037219696d04912`; this is not a claim that the remaining textbook has completed solutions.

## Exact reviewed files

Paths under `atanasyan-fullcourse-draft`:

| File | SHA256 |
| --- | --- |
| `stereo-course/textbook/assets/engine.js` | `86a2458f0879640e9d0163ea9244df7b6b3172af2924b4889f81597a35eda8ac` |
| `tools/stereo-textbook/browser.cjs` | `3d2ac25fab58ca14cfb71aad93595ad722af4e56f60f7e6cec68cbf445ddc926` |
| `tests/runtime.test.cjs` | `9add1efd4909fbf6c7da417cb228e64545764f1409c003712fc1b37620571289` |
| `schema/lesson.schema.json` | `0afbe8ada69985cda31e8c77168ac101aac05f04ae53c401b91c1bfd969972ba` |
| `schema/catalog.schema.json` | `a497a09012767582238db69a7966f43d08f293b6a43f1ffc70ce6b15ed5a6e08` |

Paths under `atanasyan-integration`:

| File | SHA256 |
| --- | --- |
| `build_textbook.py` | `96e1e919ae6f231ae63ef5ba9fa57819e820a325ab128fd129a53c25b2aa9dc3` |
| `catalog.test.py` | `80e458edbbc59f5a3ac60c3f201d484355ee97699c6a951ae5640cd3fd02596c` |
| `source-index.json` | `7cea894793a89196662f61fbe9c166c2f7208e2628aba824c39fbf6845beab19` |

## Findings resolved before PASS

1. **P1, incomplete source parts disappeared from partial builds.** Initially a single published unlettered question of exercise 7, or one component of theory 2/3, replaced the entire inventoried source. The builder now requires an explicit, reviewed `requiredParts` contract before accepting authored content. It preserves every absent required part as draft, including unlettered questions and theorem components. I independently built all 39 singleton overlays and verified that each retains its entire required source group. The 18 current contracts match the approved 15 exercises and 3 theory points.

2. **P2, nested-theory return lost the selected model view.** Opening theory step 2 and then step 1, navigating to nested theory and returning, initially changed the model from `construction` to `neutral`. Camera orientation alone was restored. The engine now records the selected view and suppresses replayed disclosure changes until native queued toggle events finish. I reran both the expanded runtime suite and the original reproduction with the real production `TaskSceneViewer`; the selected `construction` view is retained. The browser gate now asserts this same reverse-order case.

3. **Schema gap, neutral-view properties were not validated.** A declaration of `neutral: {}` bypassed the additional-properties view schema. The declaration now references the view schema. I independently compiled AJV in strict mode, validated all 39 cards and confirmed that a numeric neutral label is rejected. The runtime had already rejected the malformed view, so this was not an observed publication bypass.

## Verified behavior

- The current complete overlay has 1,253 unique source positions and 1,274 catalog rows: 39 reviewed cards and 1,235 draft rows. The available cards cover 15 exercise numbers and 3 theory points, not 39 source exercises. Point 2 has five cards: notation, A1, A2, A3 and planimetry.
- The builder does not promote review flags. All 39 integration cards equal the approved authored content except the explicitly assigned status/review metadata. Engineering fixtures are not published by default.
- Runtime availability requires complete source/mathematics/pedagogy reviews, reviewer and timestamp, matching catalog/source/revision metadata, structurally valid authored steps and models, and no duplicate source/content identity. Unfinished inventory is visible as unfinished metadata, never as a generic replacement solution.
- Unavailable theory does not produce a fake button. Mathematical justification text remains present. Available theory opens within the page and has an explicit return path.
- Drafts and camera orientation are scoped by book, lesson and revision. Help and theory retain the original main model and answer nodes. Nested theory restores its own disclosures, selected view and camera; Escape returns focus to the originating control.
- The independently rerun runtime suite covers stale-tab protection, preserved old drafts, recovery from a newer saved record, quota-failure memory drafts, new-revision isolation and hostile text escaping. No claim of transactional cross-tab locking beyond those implemented guards is made.
- Free-form proof submission only saves reasoning for discussion; it is not falsely certified correct. Exact answers use authored accepted strings without evaluation or approximate numeric substitution. Revealed help is counted even if a native disclosure toggle event is still queued.

## Release limit

This review checked inventory metadata, joins, counts, schemas, runtime behavior and the existing introductory content approval. It did not independently reread all 1,253 textbook source positions or approve their mathematical solutions. A final integrated commit must still be checked for byte identity and pass actual browser/mobile evidence before release.

## Expanded first release and actual-browser findings

The first release was expanded within the approved full-book task to include the
independently reviewed parallelism block: points4–6 and exercises16–35. The separate
`ATANASYAN_PARALLEL_CONTENT.md` records its source/content provenance. The composed
course has63 cards,195 justified steps and283 model views, covering35 exercise
numbers and6 theory points. The1253-position source index remains unchanged in
scope; its additional explicit completeness contracts produce1275 catalog rows,
including1212 pending positions. Original introductory card content is unchanged.

The first actual cloud run,39667382436, failed a focus-test oracle: Chromium retained
layout rectangles for controls inside closed details. The observed focus remained
on a visible summary, correctly. The revised oracle asks native focus directly and
checks both Shift+Tab and Tab wrapping; it does not copy the runtime's visibility
filter. Independent review accepted this test correction.

Actual screenshot inspection also found a product issue: the textbook model lacked
the shared `task-scene` CSS ancestry, clipping its expand button and preventing the
expanded viewport layout. Escape in an expanded theory model also reached its
parent dialog. The scoped fix restores the shared CSS ancestry and lets the embedded viewer
handle its own keyboard event before the parent theory dialog. Actual cloud
open/close/return checks remain a release gate. The exact final commit and browser evidence will be
recorded in PR297; this report does not pre-certify those pending checks.

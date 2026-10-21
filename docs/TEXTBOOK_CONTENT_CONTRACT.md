# Atanasyan full textbook runtime · contract v1

The production bundle contains independently reviewed authored lessons. Test fixtures
are synthetic engineering tests, not authored textbook lessons. The existing
39-unit workshop remains a separate product. Full source inventory is not a claim
that the entire book has been solved.

Author each exercise or theory point as one JSON document validated by
`stereo-course/textbook/schema/lesson.schema.json`. Inventory records use `stereo-course/textbook/schema/catalog.schema.json`.

## Identity and source

- `schemaVersion: 1`; `id`: stable lowercase ASCII identifier, e.g.
  `ex-main-0001`, `theory-001`, `ex-practical-01`.
- `revision`: positive integer. Increment when the condition, figure, answer,
  solution or mathematical meaning changes. Drafts/cameras are scoped by book,
  lesson ID and revision, so changed conditions never inherit an old answer.
- `kind`: `exercise` or `theory`; `title`: readable learner title.
- `source.bookId`: `atanasyan-2024-10-11`.
- `source.collection`: `main`, `ege`, `practical`, `research`, `selfcheck`,
  `theory`, or `example`. EGE records require `examTask: 3|6|8|14|16` exactly
  as numbered in the book; do not replace these with current exam numbers.
- `source.printedPages`: printed page numbers; `source.pdfPages`: 1-based PDF
  page numbers. Never substitute one for the other. `chapter`, `point`,
  `exercise`, `subpart` are optional strings preserving source numbering.
  Main exercises 1–870 are not the complete inventory: 157 EGE, 24 practical,
  5 research and 96 chapter self-check questions are tracked separately.
  In this exact edition PDF page = printed page + 2.
  Several cards from one source point/exercise require distinct `subpart` values;
  do not count duplicate source identities as extra coverage.
  Local numbering also includes `chapter` in identity (notably self-check №1
  in each chapter). Appendices use collection `theory`, point `appendix-1` /
  `appendix-2`, chapter `Приложения`; they are counted separately from the 99
  numbered theory points. The inventory currently targets 1,253 source positions:
  1,056 numbered tasks, 99 theory points, 96 self-checks, 2 appendices.

## Condition, figure and solution

- `statement: {text, goal, givens?: string[]}`. A clear goal is mandatory.
  User-facing text is plain authored text, never HTML, JavaScript or LaTeX HTML.
- `visualization: {type: 'scene3d', caption, model}`. A model is mandatory for
  reviewed material. `model` uses the existing `TaskSceneViewer` contract:
  named `points: {A:[x,y,z]}`, `edges`, optional `faces`, `arrows`,
  `labels`, `labelNames`, `neutralPoints`, `planar`, `smooth`, `title`, `note`.
  `views.neutral` is required. Each view has `label` and optional `segments`,
  `polygon`, `points`. Use `planar:true` for a flat exact SVG diagram; a
  separate raw SVG/HTML injection path is deliberately not included.
- The neutral view contains only givens. Additional construction/answer must
  appear only in the appropriate named view. Every referenced view must exist.
  Mathematical consistency of geometry and givens requires human review.
  Global `edges`, `faces` and `arrows` are visible in every view. Put step-only
  construction into that view's `segments`, `polygon`, `points`, and restrict
  global `labelNames` to the givens. Step-only arrows are not supported yet.
- `help: [{id,question,text,theoryIds?:[],view?,children?:[]}]` creates nested
  same-page question disclosures. Children use the identical shape.
- `steps: [{id,title,prompt,explanation,justifications,view?,input?}]`.
  Every step has at least one justification
  `{kind:'given'|'definition'|'theorem',text,theoryId?,source?}`.
  `theoryId` references another independently reviewed theory lesson. If it is
  not yet available, show the authored justification and source as text, never
  an apparently working link. There is no generic fallback solution.
- Optional intermediate `input: {prompt,accepted:string[],feedback}` needs an
  explicit question. Accepted answers are exact authored forms, never eval.
  The input belongs to the step and cannot overwrite the final draft.
- Exercises require `answer`. For a proof use
  `{mode:'manual',prompt:'Запиши ...'}`: save for discussion, never automatically
  certify a free-form proof. Numerical/exact short answers may use
  `{mode:'exact',prompt,accepted:[...],feedback?}`. Give all intended equivalent
  forms explicitly. The engine trims/collapses whitespace and normalizes Unicode
  minus only; it does not prove symbolic equivalence or silently round numbers.
- Fractions in authored display text use the existing conservative
  `StereoMath.appendText`. Inputs retain literal `/` notation. Unsupported
  symbolic expressions remain source text; do not distort operands to force
  formatting.

## Review and publication

`status` is `draft`, `in-review`, or `reviewed`. `review` has `source`,
`mathematics`, `pedagogy`, each `pending` or `passed`. Reviewed material also
requires a named `reviewer` and ISO datetime `at`.

Only structurally valid material with status `reviewed`, all three checks
`passed`, matching catalog identity/source/revision, and valid figure references
can open in the learner course. Schema validity is not mathematical approval.
No fixture reviewer or test status may be presented as a real review.
Engineering fixtures also require `testOnly:true`; the runtime rejects them
unless an explicit `allowTestFixtures:true` option is passed by a test harness.

The runtime bundle is `{catalog,lessons:[...]}`. Catalog `entries` contain
`id,revision,kind,title,status,source`, including inventoried but unfinished work.
Do not invent lessons to fill these slots. `inventoryComplete` stays `false`
until every source collection has been reconciled. Counts distinguish inventoried,
in-progress, in-review, verified available, and blocked reviewed records.
Internal status counters remain available through the API; the learner sees
plain counts of source tasks/points and available material. Multiple subpart
cards are not counted as multiple exercise numbers. A source number counts as
fully available only when all its inventoried cards are available. Search by an
exact number or title, filters by type/collection/chapter, and 24-item pagination
cover both the available material and a separate, collapsed unfinished inventory.

## Integration

Target route: `/stereo-course/textbook/`. It loads shared
`../assets/math-text.js`, `../assets/task-scene-viewer.js` and
`../assets/task-scenes.css` from the existing geometry course. The engine API is
`StereoTextbook.createApp(root,{catalog,lessons,storage?,sceneViewer?,math?})`;
default dependencies are browser localStorage, TaskSceneViewer and StereoMath.
Return value exposes `open(id)`, `home()`, `destroy()`, `coverage` and `issues`.
No server, login, external API, cross-course storage migration or deployment is
part of this scratch foundation.

Runtime semantic checks reject missing geometry, unknown views, mismatched page
mapping, conflicting source identity and incomplete reviews. A failed reviewed
record is blocked without opening a substitute task. Invalid catalog identity is
a bundle error. These checks do not replace a Draft 2020-12 JSON Schema validator
in the future content build gate, nor an independent mathematical review.

Run the focused test with `node tests/runtime.test.cjs` and `jsdom` available.
Set `STEREO_SHARED_ASSETS` to the existing course asset directory when testing
this isolated scratch draft. Tests load the actual fraction helper and include a
real TaskSceneViewer mount. Full browser/mobile layout review is still required
after integration; no publication has been performed by this draft.


Every authored source number/point needs a reviewed `requiredParts` contract in
`source-index.json`, including unlettered questions and distinct theory components.
The builder preserves missing parts as pending and rejects an unknown completeness
contract. One reviewed card must never stand for an unfinished source point.

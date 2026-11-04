# Alimov algebra and analysis, grades 10–11 (2016)

Route: `/school/alimov10-11/`. Additive static course in the published Makarychev/Peterson style. The uploaded 469-page scan is used as a local source and is not included in the repository.

## Coverage and source fidelity

- 73 numbered paragraphs in 13 chapters, plus five appendix topics (78 lessons).
- 234 concise original theory blocks, 300 tasks, 695 individually checked worked steps.
- 252 authored tasks (three practice conditions per topic plus 18 deeper examples).
- 48 selected source conditions with exact printed pages and references. These are NOT solutions to all numbered exercises. The final revision and extracurricular sections are not exhaustively transferred.
- Topic titles/start pages follow the printed contents, pp. 461–463. PDF page = printed page + 3. Selected conditions were visually inspected at printed pp. 5, 92, 120, 171, 204, 264, 295, 320 and 339. Worked explanations are original.
- Search distinguishes paragraph/name lookup from selected exercise lookup. No fabricated exercise ranges or implied individual solutions.

`topics.txt` stores the verified order and original theory, separated by `|`; absolute values use `abs(...)` in that editable source and display conventionally. `build.cjs` defines the authored exercise families. `textbook.json` includes source cards and the separate labelled authored enrichment cards. `data.js` is deterministic output.

## Learning and interaction

Green controls, generous spacing, visible completed steps, hints at each step, explicit final-answer labels, notebook retention, and the existing twenty-skill computation workshop. A detour returns to the same task without erasing its answer, steps or notes. First-success snapshots distinguish independent first attempts from helped/repeated attempts. A new analogous task is needed after assistance.

Explorers cover number lines, progressions, elementary graphs, the unit circle, derivatives/tangents, signed integrals and area, combinatorics, probability, statistics, sets, logic, sequences and half-planes. Models are explicitly separate research examples, not claimed as a diagram of the current condition. They show mathematical domains, preserve controls locally and through export/import, and mark exploration as assistance before success. Numeric graph readouts are labelled approximate. Hidden irrelevant graph controls keep the screen quiet. All sliders/selects work by keyboard; no dragging is required.

Exact rational answers accept equivalent fractions and decimals. Root sets are order-independent. Coordinates preserve order. Numeric interval endpoints accept equivalent fractions/decimals while brackets remain significant. Symbolic answers use documented forms/aliases with notation normalization, NOT general computer algebra. No user string is evaluated as JavaScript. Lowercase `pi`, multiplication notation and Unicode exponents are accepted. Formula fields explain the expected format; feedback acknowledges this checking limitation.

## Storage and boundaries

Course-isolated key `mathexam.alimov10-11.2016.v1`, export envelope `alimov10-11-2016`. Browser-local answers only; downloadable/importable JSON. Import preserves existing work and assistance history; invalid records are sanitized. A corrupt stored record is not overwritten. Cloud execution/development is not cloud pupil storage. Board synchronization, student accounts, server persistence, production deployment and real-pupil outcome validation are not claimed.

## Verification

From repository root:

```sh
node school/alimov10-11/build.cjs
node school/alimov10-11/test-course.cjs
node school/alimov10-11/test-models.cjs
node school/alimov10-11/test-state.cjs
node school/alimov10-11/test-import.cjs
NODE_PATH=/path/to/jsdom/node_modules node school/alimov10-11/test-ui.cjs
python tools/build-sitemap.py --check
python tools/seo-sitemap.test.py
```

The scoped workflow installs jsdom 26.1.0 in an isolated temporary directory. Content tests include independently calculated final-answer fixtures for all 234 base tasks and brute-force enumeration of the two source counting exercises. Model tests include 445 numerical/structural assertions. DOM tests traverse all 300 tasks, all 695 steps and 597 control changes, search, corrupt storage, return journeys and model restoration. Storage/import regression cases cover completion snapshots, partial drafts and prototype-shaped inputs.

Headless Chromium visual QA inspected desktop home, logarithmic domain work and tangent model, and 390 px mobile routes: home, logarithms, circle, tangent, antiderivative, statistics, workshop, progress. No page errors or page-level horizontal overflow. Screenshots were visually inspected. Physical touch-device and real-pupil checks not run. Claude consultation and exact-head external review unavailable (no connected provider/API credential); technical checks are not external approval.

## Release and rollback

One task/branch/Draft PR under `docs/tasks/ALIMOV_10_11_COURSE.md`. No merge or deployment authorized by this implementation request. Rollback removes the additive route, catalog card and sitemap seed; there is no database migration or change to existing course records.

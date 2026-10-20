# ОГЭ 1–5: восемь сюжетов с помощью внутри помощи

## Identity

- Task: `OGE_1_5_INTERACTIVE_DISCOVERY`
- Owner: Наталья Михайловна.
- Date: 2026-10-21 (Asia/Novosibirsk).
- Release base: `main` at `df63bacb2f82acf5f8543297c372b414925d6113`, verified through the GitHub integration.
- Release branch: `feat/tasks1-5-discovery-release`.
- Reviewed implementation: `feat/tasks1-5-inline-help` at `7bdc391328bae5fabeb01b1e95e360ea9fb5a99f`, originally based on `43dc06bfa7bf503e3e9d455ced3ec05202b9e68e`. The source branch remains unchanged; this release composes its scoped delta with the published task19 files.
- Review level: `MEDIUM` — bounded presentation and learning interactions around existing question engines; no server, account or progress contract change.
- Accepted ADR: [0003](../adr/0003-oge-course.md). Existing implemented shared `practical-minimal.js` presentation is the source of truth; no new runtime platform.

## Goal and approved scope

The owner requests adaptation of **all eight existing tasks 1–5 storylines** to the task-first, optional same-page help method. Start with a clear question and answer action. Help first suggests one action; a second disclosure opens an interactive experiment; further help explains the reasoning and can show the existing task-specific calculation. Closing help retains both the answer draft and the experiment.

| Existing storyline | Task paths covered | Relevant experiments |
| --- | ---: | --- |
| Roads on a grid | 5 | Route identification, distance, right triangle, time, purchase comparison |
| Roads as a scheme | 5 | Route identification, distance, right triangle, time, fuel comparison |
| Tires | 5 final questions + 2 preparatory states (marking and table) | Compatibility table, tire parts, profile, diameter/radius, percentages |
| Stoves | 14 | Table reading, capacity intervals, room volume/floor/walls, purchase/delivery, percentages, two arch constructions |
| Land plots | 5 groups, including alternative geometry/economics prompts | Plan, length/area, packages, percentages, paint or heating payback |
| Apartments | 10 canonical + 2 generated views | Plan, packages, area, percentages, appliance and tariff comparisons |
| Tariffs | 5 groups, including forward/reverse percentage prompts | Graph and scale reading, monthly costs, percentages, annual comparison |
| Paper sheets | 6 | Halving, count/area, similarity, mass, diagonal |

The 12-card route map also contains diagnostics and the existing percentage helper. They remain available and retain their assessment behavior; they are not four additional storylines.

### Changes

- Add `practical-discovery.js` and integrate it through the existing presentation layer in the eight storyline pages.
- Keep first help concise and optional. Models explicitly use example numbers, with controls labelled by quantity and unit. Original conditions, diagrams, tables and answer fields remain accessible.
- Put full numerical hints at a deeper, deliberate step; retain existing native grading and local progress code.
- In the tire trainer, move each existing final answer field into the initial task view. Keep its original checker; make the table-building and calculation chain optional help. Do not award a solved task for opening any model.
- In apartments, move instructional notes into help; **retain actual condition notes** about delivery percentages and dimensions. Hide already-calculated area labels on the plan until the learner explicitly requests them. Keep room names, grid and the 0.4 m scale visible.
- Retain control values, measurement visibility and ordered route selections through closing help and through the road-grid native hint redraw. Add a return button that restores focus to the help trigger.
- Use green controls, readable spacing, same-page model enlargement and keyboard-operable controls.
- Rebuild only the existing OGE 1–5 downloadable folder package. Inline the map’s existing CSS/JS through the builder’s supported manifest option, so its separate HTML download has no missing relative runtime assets; links resolve to the published trainers.

### Out of scope

No new FIPI storyline, bank expansion, backend/board synchronization, account changes, score migration, paid Claude request or video production. Original inline question generation, answers and progress functions remain byte-identical; their existing hash gate must still pass. No claim of complete FIPI coverage.

## Acceptance and gates

- Every listed task path has a relevant interactive model and optional deeper help.
- Answer drafts and experiments survive help closing/reopening and native redraws.
- Experiment actions do not mark an answer correct or change score/progress storage.
- Tire final answer checks work without first completing the helper table.
- Original task conditions remain visible; answers/calculated areas are not given before help.
- `node --test tools/oge-practical-*.test.cjs`: existing strict engine snapshots + navigation/return behavior; new every-prototype and independent model calculation/state tests.
- `node tools/oge-practical-minimal.browser.cjs`: retained 13 routes at 320/360/1280 px.
- `node tools/oge-practical-discovery.browser.cjs`: 59 paths (57 final question paths + 2 tire preparation states) at 360/1280 px, plus eight 320 px storyline cases: 126 cases total; model controls, nested help, enlargement, draft preservation and no autograding.
- `node tools/oge-check-links.mjs`, JS syntax and `git diff --check`.
- Browser runs are cloud CI only; no local shell browser run.
- Final gate: `OGE_PRACTICAL_DISCOVERY_BROWSER_OK` plus the Node and retained route gates.

## Review and risks

Owner deferred Claude API use in this conversation; no paid discussion or provider verdict is claimed. A separate agent reviews mathematical examples, question routing, control instructions, retained state, original answer checks and all eight storyline coverage. This design uses the already-implemented optional help pattern rather than a new platform primitive.

Main risks: an explanation is matched to the wrong question subtype, UI movement loses a native event listener, computed values leak before help, or a help redraw discards an experiment. Focused review and tests cover these directly. Example labs are explanatory: learner testing should still check which wording best helps a pupil transfer the idea to the original task.

Rollback: normal revert of this task's files and its generated package; no data migration exists to undo. Do not reset/rebase/force or weaken existing checks.

## Authorization and execution

The owner explicitly requested all eight types and cloud execution; publication is already authorized in the conversation. The implementation agent prepares this isolated branch; the coordinating agent performs exact-head review, normal PR/release checks and publication in sequence with the other approved work. This document is not an external review or a new authorization.

- Independent review: separate agent completed focused source/DOM review and independently reran all 46 Node checks on implementation head `7bdc391328bae5fabeb01b1e95e360ea9fb5a99f`, tree `53a88caebdb6d741f1c125ea71e9a28cb663b42a`. Findings were corrected (routing, scale fidelity, ordered selections, retained measurement, visible givens). Integration metadata and cloud layout evidence remain release steps.
- Cloud browser and production checks: not yet run at the implementation handoff.
- Task19 is published at the release base, Pages run `39509146258`, with all 29 affected public file hashes verified. Task6 remains in progress in PR287; it is not published by this branch. The manifest preserves the published task19 entry, including all 14 inline reference images, and changes only the tasks1–5 inline CSS/JS configuration.

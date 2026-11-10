# Курс ОГЭ: недостающие пошаговые разборы и прокрутка рисунка №18

## Identity and scope

- Date: 2026-11-10, Asia/Novosibirsk.
- Base: `main`, `d3d63656806551148b597045657c03d54eb65700`.
- Branch: `fix/oge18-clear-steps-and-pan`.
- Review: MEDIUM — bounded learner interaction; existing board packet fields and validation remain unchanged.
- Owner request: fix apparently inactive left/right controls and unintelligible help in the supplied №18 screenshot. This request starts the task.
- Release: [standing authorization](../OWNER_RELEASE_AUTHORIZATION.md), after applicable checks.

## Verified defects and intended result

The shared geometry wrapper displayed pan buttons without horizontal overflow. The №18 hint wrapper repeatedly displayed only `sol[0]`, and prepended an unrelated numerical model ahead of the current-task explanation.

1. Show pan controls only for an overflowing figure; disable the unavailable direction and update on scroll, resize and disclosure opening. Applies to the shared №15–18 component.
2. Reveal the current №18 task's complete native solution one step at a time, retain earlier steps and typed answers, and clearly expose completion and whole-solution controls.
3. Explain the screenshot's segment using six steps and annotations on the actual diagram: base 4, total height 8, lower height 5, upper height 3, AA similarity, AB = 1.5. Use the same parameterized explanation for the full segment family.
4. Put the separate model after the actual solution, explicitly label it as additional practice with different numbers.
5. Preserve the existing bounded semantic board action format while retaining every revealed step for peer replay. Preserve grading, exam, generator and bank contracts.

No new tasks, navigation redesign, answer changes, storage schema changes or deployment settings are included.

## Owner scope extension

During implementation the owner asked to add step-by-step explanations wherever absent. The scope is the current public OGE course. Code inspection found missing cumulative explanation in №13 and №16, a first-step-only flow in №18, and an undivided post-answer explanation in №19. №17 already had steps hidden one disclosure deeper.

- №13: 26 tasks in five families now have 4–5 exact worked steps, including negative-coefficient sign reversal, actual quadratic root calculations, interval endpoints and system intersections. Selected answers and per-task session steps survive navigation. Revealed solutions do not earn independent success credit. Existing board event replay transmits step clicks.
- №16: all 33 native circle families now expose their actual `sol` entries cumulatively before submitting an answer. Existing bounded `first` actions support peer replay; no packet fields or server schemas change.
- №17: existing native steps are directly visible inside help; the separate model follows them.
- №19: all 234 existing statement explanations are presented as conditions, authored justification/counterexample and verdict after answering. Truth labels and source explanations remain unchanged. These are numbered visible steps, not a new interactive proof checker.

Inspection of the remaining OGE entries found existing guided flows: practical №1–5 (`practical-discovery.js` and native substeps), arithmetic №6, number line №7, powers №8, equations №9, probability №10, graph help №11, formulas №12, progressions №14, triangles №15, equations/word problems/graphs №20–22, and geometry/proof guides №23–25. This is a route/code inventory, not a claim that every task has been manually solved or every existing explanation is pedagogically complete.

## Acceptance and checks

- Current-task cumulative explanation for every №18 subtype; supplied archive case 89 checked explicitly.
- Original answer survives opening/closing help; assisted completion never becomes independent credit; next task resets the explanation.
- Peer replay retains all six steps, current diagram and answer without local progress writes.
- Browser checks at 320/360/1280: actual horizontal movement, endpoint availability, no controls when the whole figure fits, resize and closed/open model transitions.
- Existing geometry contracts, geometry/course DOM tests, board replay/model synchronization and relevant browser CI; `git diff --check`.
- Final gate: `OGE18_STEPS_PAN_OK` only after checks pass.

## Review and rollback

Learning-design review: numbers and auxiliary lines belong to the current task; AA similarity explains the height ratio before multiplication. All revealed steps remain available. Model exploration stays optional. No external provider review or pupil pilot claimed; external consultation is optional under standing authorization.

Main risks: shared responsive navigation and repeated hint action replay. Targeted browser and two-view regressions cover both. Roll back by reverting this task's squash commit; no stored data migration is needed. Mixed cached board clients may show the old first-step-only presentation until they reload.

## Execution record

Local/CI and release evidence are recorded in this task's PR, with exact base/head and separate failed/not-run checks. The project status file contains historical publication claims; this task verifies its own public resources after deployment and does not assert a site-wide re-audit.

## Local validation

- Geometry math gate: 1,873 independent checks, zero failures.
- Geometry, native shared replay, task 13 and task 19 suites: 127 tests; the initial stale offline artifact failure was fixed by rebuilding it. Updated task 13 suite: 12 passed; task 19 offline/source suite: 15 passed. Other 126 checks from the combined run passed.
- Browser: responsive pan, keyboard, resize and model disclosures at 320/360/1280; cumulative №13/16/17/18 explanations and №19 result at mobile/desktop widths; screenshots inspected. `OGE18_STEPS_PAN_OK`.
- Course structure/review: 21 checks passed. `git diff --check` clean.
- Offline rebuild exposed online-only assets introduced since the previous package. An explicit manifest omission list preserves the standalone lesson and its native models without broken file requests; the no-network test passes.
- External review and pupil pilot: not performed.

## Exact source receipts after the teaching update

The first CI run correctly rejected new teaching bytes against older preservation receipts. Source commit `7a7169c35c54351ace4f7844b7730899b4a61831` contains the reviewed learner changes and cache version updates. Navigator bindings are refreshed through the established explicit-source tool for exactly five changed covered pages. The learner-return test names that source for those five pages. Three video-model routes (16, 17, 19) receive a separate exact teaching-source receipt; the nine historical native pins, frozen book editions, mathematical fixtures and original negative probes stay unchanged. Current receipts reject any additional native mutation, and preservation tests compare against the explicit committed source. No broad normalization or test removal is used.

The book generator also failed identically on unmodified base main: PR536 added `assets/oge-entry-sections.css`, taking the future candidate closure from 239 to 240 files while leaving count assertions stale. A regression removes only that exact tag and proves the complete one-file delta and stylesheet bytes; exact counts are updated. No published frozen book files or integrity gates change.

## Base drift composition

Remote main advanced to `ac4f17f2864b4a7b9e334ccaebfc9f7fd6f68104` with the profile course release #537 and Alimov correction #540. Virtual composition showed only the shared navigator receipt conflict. A history-preserving merge retains all concurrent teaching, sitemap, coverage and status changes. The composed source is `c338961a227a8750e636ad84874771d191dc81ec`; only the five OGE receipt entries are refreshed against it. OGE source blobs are unchanged from the locally browser-tested candidate. Navigator preservation and affected profile/OGE checks run against the composition before release.

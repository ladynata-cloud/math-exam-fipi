# Unified board: backend-first release stage

## Identity and authorization

- Owner: MathExam owner; date: 2026-11-09; review level: **HIGH** (persistence, server contracts and deployment).
- Base: `main` at `833856e60fcdc3f82715d85a222581a0e21656f2`.
- Branch: `release/unified-board-backend-519`.
- Parent: [PR #519](https://github.com/ladynata-cloud/math-exam-fipi/pull/519), [original task](https://github.com/ladynata-cloud/math-exam-fipi/blob/11aae69b/docs/tasks/UNIFIED_INTERACTIVE_BOARD_20261109.md), [accepted ADR 0015](https://github.com/ladynata-cloud/math-exam-fipi/blob/11aae69b/docs/adr/0015-unified-interactive-board.md).
- Exact source tree: `3bf0770f320f7faacff998bc5406070d391c7763` (local source commit `2f94faf313c02ac659ba45e7d17bc2086683cdfe`; parent publication candidate `11aae69b`).
- Latest owner decision in the current task conversation authorizes publication of PR #519 at `11aae69b`, superseding the earlier review pause. The [standing publication policy](../OWNER_RELEASE_AUTHORIZATION.md) remains applicable after checks. This delegated step is expressly **local preparation and commit only**; the release owner controls push, PR, merge and deployment. No remote action is recorded here.

## Goal and exact scope

Deploy the compatible server reader and validated construction model before enabling the new public board interface. Copy the following nine files byte-for-byte from the source tree, without redesigning the reviewed feature:

- `Dockerfile`
- `board-server/group-lessons.js`
- `board-server/test/group-geometry.test.js`
- `board-server/test/group-lessons.test.js`
- `board-server/test/server-registry.integration.test.js`
- `trainers/spacemath/model.js` and `model.test.cjs`
- `trainers/spacemath/expression.js` and `expression.test.cjs`

This specification is the only additional file. Existing public HTML, JavaScript, CSS, catalogs and workflows remain unchanged. SpaceMath `index.html`, `app.js`, `adapter.js`, `style.css` and vendor assets are absent. The parser/model have no new external runtime dependency; both are explicitly copied into the server image. Assistant integration, real lessons and account data are outside scope.

## Compatibility and acceptance

- Existing bearer authorization, seat isolation, trainer actions, handwriting, history and legacy `assign` behavior retain their contracts. New geometry, controller and material-generation fields are additive; old journals acquire empty geometry and the canonical default viewport when read.
- New `geometry`, `geometry-control` and `insert` actions retain server authorization, version and assignment fences. `insert` preserves handwriting and geometry while replacing only the trainer. Function formulas are parsed as bounded mathematics, not JavaScript.
- The stage must pass the complete existing server suite and parser/model suites, syntax checks, `git diff --check`, and exact blob comparisons for all nine source files. The diff must contain exactly those files plus this task document.
- Public interface files must match the base. The later interface release remains gated by its own exact-head CI/browser acceptance; backend-only validation is not browser acceptance.

## Review and release gates

The parent implementation received independent technical review; this extraction requires a separate review of file isolation, dependencies and compatibility by the release owner. No external-provider approval is claimed. No new learning-design consultation is required for selecting the existing server portion.

Before any merge, recheck authoritative `main` and stage head, revalidate drift, inspect the exact delta and verify the merge result. Before deployment, take a recoverable storage snapshot and preserve the existing single-process ownership of `GROUP_LESSON_STORE_DIR`. After deployment, verify health, group capabilities and a disposable synthetic legacy/new-action session before releasing the new UI. Public availability or a passing local test alone does not establish deployment identity.

## Risk and rollback

The existing frontend remains usable against the upgraded server. New geometry/insert journal events cannot be interpreted by the old reader. Once such events exist, keep the upgraded reader and original journals during rollback; never run an older backend against those journals, delete them or silently downgrade them. A UI-only rollback is safe for stored data. Before any new-format writes, an image rollback is possible only with verified storage compatibility and snapshot recovery readiness. No data migration or destructive rollback is performed by this stage.

## Execution record

- Local preparation uses the exact base and source tree above; no changes are made to the parent worktree.
- Server dependencies are reused from an installation with an identical package lock; Node version: `24.22.1` (within the declared range).
- Parser/model: **50/50 passed**.
- Full server: **426/426 passed**, including legacy contracts, persistence/restart, registry packaging and new geometry integration.
- Syntax checks and `git diff --check`: **passed**. All nine source files match the selected tree byte-for-byte; public interface isolation and the exact changed-file set are verified. No failure or scope deviation was observed.
- Browser tests, Docker build, remote CI, push, merge and deployment: **not run in this local stage**. Browser coverage belongs to the later full-interface gate; remote release remains with the release owner.

## Coordinated release continuation — 10 November 2026

The owner accepted the plan to finish the pending publications, including a
coordinated server-first board release. This backend stage is extended to the
approved dependent #527 and #528 construction types before enabling any of
their interfaces. The source is #528 `4f0bafa7f7225b3eaf38beab2e5bc73544109c4d`,
composed with the accepted #519 recovery fixes and current main
`c8a4f1fc61dd07038e30764f8cedf0725b767539`.

The final `model.js`, `expression.js`, model tests and group-geometry server
tests are copied unchanged. `trainers/spacemath/graph-solutions.test.cjs` is
added as a backend/parser regression gate. These support point-on-object,
vectors, transformations, tables, tangents, function roots and graph
intersections without exposing the new public editor. No public HTML, CSS,
editor app, bridge, workflow, credentials or production data is changed.

This avoids a window where a newer editor submits construction types rejected
by the deployed server. Existing `/api/group-lessons/status` geometry flags
alone do not distinguish these model revisions: after the backend update,
verify source/deployment identity and a disposable synthetic session containing
new construction types, plus journal replay after restart. The recoverable
`/data` snapshot and one-process store ownership requirements still apply.
Never roll the reader back below the newest journal types already written.

Required local gate for this expanded server stage: full server suite,
expression/model/graph-solution tests, syntax/diff checks, and exact source-blob
identity plus frontend isolation against current main. Remote CI and production
acceptance remain with the release owner; this local preparation does not
perform a deployment or access real learner data.

Local expanded-stage results: **428/428 server tests** and **69/69
expression/model/graph-solution tests passed**, with zero failures, skips or
cancellations. Syntax and `git diff --check` passed. The five extended source
files exactly match #528 blobs; existing group-board HTML/JS/CSS/frame files
match `c8a4f1fc` byte-for-byte. The complete stage changes eleven files relative
to that main: the previous ten-file backend stage plus the graph-solution test.
No frontend activation, provider operation, production snapshot or deployment
is claimed by these local results.

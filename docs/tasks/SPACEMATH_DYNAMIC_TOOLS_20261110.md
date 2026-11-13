# SpaceMath: dynamic construction tools and value tables

- Owner: MathExam. Date: 2026-11-10 (Asia/Novosibirsk). Review: `HIGH` (shared model and journal compatibility).
- Branch: `feat/spacemath-dynamic-tools`, stacked on the checked unified board candidate `11aae69b5372b0d2352811e99917141d6314957e` from [PR #519](https://github.com/ladynata-cloud/math-exam-fipi/pull/519).
- Architecture: [ADR 0015](../adr/0015-unified-interactive-board.md). Release authorization: [owner policy](../OWNER_RELEASE_AUTHORIZATION.md).

The owner asked to keep expanding SpaceMath while the unified board is awaiting publication and to approach GeoGebra over time. This stage adds draggable points on segments, rays, lines, circles and function graphs, vectors and point translation, circles with a given radius, tangents from a point to a circle, and function value tables with a chosen interval and step. It leaves the two publication candidates #526 and #519 independent of this work.

The supported geometry follows the intended classroom use of [Point on Object](https://geogebra.github.io/docs/manual/en/tools/Point_on_Object/), [Vector](https://geogebra.github.io/docs/manual/en/tools/Vector/) and [Tangents](https://geogebra.github.io/docs/manual/en/tools/Tangents/). Construction dependencies remain explicit and serializable. Changing a parent or slider recomputes dependent objects; unavailable tangents and graph values have a defined recovery path. Value tables display undefined entries and have bounded size. Selected objects and panels are local UI state, while their mathematical inputs are synchronized.

Scope is the 2D editor, strict validation, existing sync path, and the regressions that exercise them. The next stages can build on this model for graph roots/intersections, conics and loci, then algebra/CAS, statistics and 3D. This stage has no dependency on the separate standalone #481 release or AI assistance.

Acceptance covers constrained dragging and keyboard/precise editing, geometric identities, one/two/no tangents, decimal table steps and undefined values, control and read-only access, undo, preservation across journal restart, old model import, server validation and existing browser flows. Run the server, model, parser, editor and bridge suites and the unified browser checks. Record actual results and any unrun gate in the draft. No external-provider review is claimed.

The additive types keep old models readable in the new runtime. Roll out a compatible reader before enabling this editor. Older readers and editors cannot replay new types, so keep the upgraded reader and a compatible editor available for existing sessions and retain the original journals. Merge and deployment depend on the base board release, fresh base/head validation and applicable gates.

## Validation

- Local server suite: 427 passed. Model, expression, assets, editor and bridge suites: 76 passed. JavaScript syntax and `git diff --check` passed.
- Independent technical review checked the file diff, tangent construction and degeneracy, exact table sampling, dependency order and read-only updates. No blocker was found.
- Two real browser windows on the synthetic preview verified keyboard movement and mouse dragging of a point along a parabola, teacher observation, parameter-driven updates to both the open table and the point, and recovery after a reload. The same lesson exercised a circle of radius 2, its two tangents from an external point, a vector and point translation. A wide screen kept the drawing visible while scrolling to the table. [Test lesson screen](../reports/SpaceMath_dynamic_tools_20261110.jpg).
- The full scripted browser suites require GitHub CI. The local Chromium runner could not start a socket. The live publication remains dependent on #519 and backend-first rollout.

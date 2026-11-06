# SpaceMath — implementation and validation

Date: 2026-11-07 (Asia/Novosibirsk).

Task: [SPACEMATH_2D_V1_20261107](../tasks/SPACEMATH_2D_V1_20261107.md).
Review level: **NEW_ARCHETYPE**.

## Result and release boundary

**SpaceMath · Совместные построения** is an integrated dynamic 2D editor in
MathExam. The owner's START authorizes implementation, validation, commits,
publication of the task branch and a **Draft PR**. Merge and deployment remain
outside this authorization. [ADR 0013](../adr/0013-spacemath-constructions.md)
remains Proposed until the owner accepts the archetype before rollout.

The task branch is `feat/spacemath-geometry-v1`, originally based on
`d435af8a6be1823210901d4e4dc13a44f65591a0`. Final remote head and PR identifiers
belong to the PR handoff; this report does not claim a production release.

## Implemented behavior

- Free points, segments, lines, rays, circles and polygons; midpoints,
  intersections, parallel/perpendicular lines, angle bisectors, distances and
  nonreflex angles. Moving a free point recomputes its dependants.
- Mouse and touch construction, an object list as an input alternative,
  numerical coordinates, editable labels, keyboard point movement, undo/redo,
  confirmed deletion of dependent objects and a sample triangle.
- A strict version-1 JSON document: up to 160 objects, 64 KiB, finite free
  coordinates within ±1,000,000 and topologically ordered, typed parent IDs.
  Unknown fields, expressions, executable content and markup are rejected.
  Missing intersections and degenerate inputs are explicitly undefined and
  can recover when the source geometry becomes valid again.
- JSXGraph **1.14.3** is vendored locally with its MIT notice and integrity
  record. Geometry requires no runtime GeoGebra or CDN request. This is a
  resource-independence result, not a measurement of Russian ISP availability.
- A SpaceMath navigation entry in both cabinets; a private teacher library and
  a scoped pupil library, creation, current-state copying and reopening. The
  library returns the latest 200 models, matching the existing feed limit.
- The lesson's SpaceMath picker creates a blank model, continues an existing
  pupil document with the same identity, or copies a teacher's current model.
  The existing queue preserves the selected model through other materials.
- Existing authenticated teacher/pupil control, revisions, conflict handling,
  SQLite saves and history are reused. One role controls the construction at a
  time; the other observes. No new account or collaboration protocol is added.
- Compact editable JSON import/export. In the cabinet, the parent page owns
  downloading; the isolated editor retains its existing restrictive sandbox.
- A public-board entry and mirror adapter. A construction prepared before
  creating an anonymous room survives the iframe's room-seed reload.

### Storage and academic boundaries

| Context | Persistence and access |
| --- | --- |
| Cabinet / lesson | Authenticated account-owned SQLite attempt and event history; durable across API/storage restart. |
| Anonymous public board | Existing volatile room state; reload/reconnect within the live room is supported. Server restart is not durable storage. |
| Standalone editor | Local browser draft and JSON download; no account-save claim. |

Geometry documents cannot manufacture exercise completion, grades or rewards.
Checks, hints, textbook help, homework creation and work submission are rejected
for SpaceMath. Documents are excluded from parent/teacher academic totals and
survive academic progress resets. Existing exercise copying still uses its
initial condition; only SpaceMath copies its current construction. Private
teacher source IDs do not leak into pupil or shared lesson copies.

## Validation

The task gate is `node tools/spacemath/gate.cjs`. It fails immediately when a
required process fails and prints **SPACEMATH_2D_V1_READY** only after all required
checks, including real browsers, succeed. The same gate is registered in
`.github/workflows/spacemath.yml` with browser evidence artifacts.

| Required check | Latest result |
| --- | --- |
| Complete board-server Node suite | **419 / 419 PASS**, including seven new real HTTP/SQLite SpaceMath tests and the unchanged historical content hash. |
| Geometry, asset integrity, cabinet DOM, public-room/registry and focused lesson tests | **38 / 38 PASS**, including 12 geometry kernel tests. |
| Actual cabinet lesson DOM handlers | **11 / 11 PASS**. |
| Private rehearsal DOM regressions | **10 / 10 PASS**. |
| Standalone editor browser | **10 groups PASS**: native clicks, numerical/keyboard input, undo, dependency drag, deletion, JSON roundtrip, local reload, stale-callback protection, bounds, touch and sandboxed forms. |
| Public board browser pair | **6 groups PASS** with real Socket.IO: selection, pre-room snapshot, late join, authority, native pupil drag, mirror, no echo and reload. |
| Managed cabinet browser pair | **6 groups PASS** with real accounts, separate trainer origin and SQLite: private preparation, exact lesson copy, long drag, handover, mobile layout, switch/continue/reload, cabinet reopen and cross-account denial. |
| Existing lesson workspace browser | **PASS**, including 320/1280 layouts, failed save recovery, stale response fences and two-device state restoration. |
| Existing cabinet browser | **PASS**, including eight seats, presentation, history, concurrent authored ink, lost acknowledgements, live reset and archive history. |
| Existing course navigation browser | **PASS**; every educational catalog ID is still checked exactly, with a separate SpaceMath tool entry. |
| Existing board picker browser | **PASS**, including URLs, search, recovery, mobile layout and preserved drawings. |
| Syntax, workflow YAML, vendored checksums and whitespace | **PASS**. |

This is **478 Node/DOM tests** plus the real browser scenarios listed above;
scenario groups are not presented as individual assertion counts.

### Additional legacy probe: existing failure

An additional, non-gate run of
`B2_SMOKE_SECTION=roads node tools/trainer-registry-client-cutover-smoke.cjs`
**failed** while clicking the hidden first `#scenario-chips .chip` on the
standalone roads trainer, before registry/count assertions. A separate clean,
detached checkout of current main `e145b7109e6254908120c2b2022cda799aabad5f`
reproduced the identical timeout at the same test step. The roads trainer is
unchanged by SpaceMath; its SHA-256 is
`942191268f61293fbfc21e5842d91b5d8f35bd7a12994079a61e5936e9f5fe53`.
This pre-existing legacy scenario is not reported as passing or silently
repaired within the geometry task. The required SpaceMath, public-board pair,
picker, registry and profile-room regressions listed above pass independently.

### Managed browser and environment evidence

The managed long-drag test moves a vertex for three seconds across intermediate
acknowledgements and verifies the final coordinates, midpoint, perpendicular
foot and 90° angle. A read-only pupil cannot change the model through a native
gesture or a direct API request. Repeated observation does not increase the
saved revision. The same test exports the actual private model through the
parent cabinet and reopens the pupil's exact saved document after switching
materials and reloading.

All browser users are disposable synthetic fixtures. The dedicated editor,
public pair and managed pair reported **zero page errors and zero external
runtime requests**. Trainer requests carried no cabinet cookie, authorization
header, CSRF value or account identity. Screenshots at 320×900 and 1280×900 were
inspected; both cabinet and editor avoid horizontal overflow.

Local runtime: Node 24.22.1, Playwright 1.62.1, jsdom 26.1.0 and the available
headless Chromium 153.0.8010.0. The workflow pins Node 24.21.0 and installs its
own Playwright browser. No browser executable is committed or modified.

## Findings resolved during implementation

1. Absolute squared-distance tolerances falsely intersected very small circles.
   Relative numerical tolerances and scaled regressions cover 1, 1e-6 and 1e-12.
2. A queued canvas click could run after authoritative hydration. An interaction
   epoch now invalidates stale clicks, imports and confirmation callbacks.
3. A point dragged beyond coordinate bounds could differ visually from the
   saved model. The rendered point returns to its last valid coordinates.
4. Rebuilding an extreme-offset grid and delayed resize of a freed JSXGraph
   board required safe initialization and a single current-board observer.
   Vendored code remains unmodified.
5. Native form submission is unavailable in the cabinet's existing sandbox.
   Numerical input, Enter and confirmations now perform local actions; JSON
   download is performed by the parent cabinet without broadening the sandbox.
6. Academic `all`/`plane` reset initially archived construction documents. The
   selection now excludes workspaces; HTTP/SQLite regressions preserve the
   model, history, active material and presentation while ordinary work resets.
7. The new lesson control initially pushed an existing 320-pixel exercise below
   its established first-screen threshold. Compact control layout restored the
   original threshold; the regression gate was kept intact.
8. Registry/catalog counts and the runtime-layout fixture were updated for the
   new entry and local kernel. The 378 historical course rows retain their
   original SHA-256. A previously stale mirror smoke allowlist (51 vs 58 before
   this task) now enumerates all 59 actual mirrors, including SpaceMath.
9. A temporary filter in the recommendation-plan UI could silently replace a
   selected workspace. That change was reverted; reset alone has the new UI
   filter. An independent DOM probe confirmed preservation on repeat save.

Earlier system Chromium startup and browser-download attempts failed in the
local runtime. Available headless Chromium completed the final checks.
Concurrent diagnostic browser runs also crashed; the complete final gate runs
browsers sequentially and passed. Failed setup attempts and intermediate
assertions were not counted as passing checks.

## Independent review

A separate agent reviewed the geometry/editor, then backend and cabinet
boundaries. The numerical, stale-callback, bounds and academic-reset findings
were reproduced and independently retested after correction. The final form,
observer and parent-export changes were reviewed separately. No confirmed
P1/P2 remained in the reviewed source. Internal review is not an external
provider approval; no Claude/external audit or copied approval marker is claimed.

Reviewed SHA-256 anchors:

```text
b032d04e1d95a26b2e9f604ad983b510d0625b54972846f9e9288891ae9899cf  trainers/spacemath/model.js
071f2a8e02d57714ec4b90dc2caac1abd047f812cbb0d8c0c0c1a449e4eeb2a6  trainers/spacemath/app.js
0f7620b7d3118f5e2eb297fef47b90db1b34847fef0c8cafb03b37cc275bd255  trainers/spacemath/adapter.js
51fc14295cb700f4cfc228a90a3884cc4fbdd885dde58ea8e5d77ca79c76c245  learning/app.js
3e0585fc74a42aa4cc5f7467bccc7a1fe9fa38b43da72672d39d9cf9a6c39777  board-server/learning-spacemath.js
b0e4de48f8a919188ca95238679948668b59c0e0d4c2ee76f3eae7ff6828645f  board-server/learning-teaching.js
```

## Base reconciliation and production evidence

At task start the clean checkout and authoritative remote main agreed on
`d435af8a6be1823210901d4e4dc13a44f65591a0` (PR #478 included). At 22:29 UTC on
2026-11-06, public `mathexam.space` returned HTTP 200 for both files below,
matching the task base exactly:

```text
cf12383c47530a1776233d0830511a0e353d524082ebdedab65004dcebbdbb9f  learning/lesson-workspace.js
b7c1751db322d51b6678f030da4020dcba7fd32ca5f6bc8d36656496189c0f5d  learning/trainer-frame.js
```

The same public-file probes on the existing Amvera cabinet origin returned
HTTP 503. They did not authenticate or alter any data and do not establish
current production cabinet availability.

During implementation main advanced to
`e145b7109e6254908120c2b2022cda799aabad5f`: PR #480 changes private-rehearsal
feedback, its browser regression and task documentation. Its three paths do
not overlap this task's changes. The task branch is preserved; a read-only
virtual composition and its gate result are recorded in the final handoff.
No merge, rebase, reset, force operation or deployment is authorized here.

The read-only virtual composition was **clean**. Its tree
`3d921df606a84ea6c139ac5a2a9bdc624f6b06bd` combines current main above with the
validated SpaceMath tree `75796c6ffc0e489399813d9ddf8cf38add4da0af`. The complete
`tools/spacemath/gate.cjs` ran again in an isolated detached worktree and emitted
**SPACEMATH_2D_V1_READY**: the same 478 Node/DOM tests and all browser suites
passed, including PR #480's additional private-feedback assertions. Only the
validation narrative was completed afterward; runtime, tests, assets and
workflow blobs retain their checked identities. The original task branch has
not been rebased or merged with main.

## Limits and rollback

No real-pupil pilot, Russian-network test, external provider audit or production
deployment was performed. Other browser engines, 3D, CAS, arbitrary function
expressions and GeoGebra document compatibility are outside this first version.

Rollback uses the normal reviewed revert of the feature. There is no database
schema migration. Saved SpaceMath rows and events must be retained; reopening
them requires a compatible v1 editor/contract. Ordinary backups contain the
models with the existing account store. Removing the UI is not a reason to
delete saved construction data.

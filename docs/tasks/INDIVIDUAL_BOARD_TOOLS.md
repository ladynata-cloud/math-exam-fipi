# Individual lesson: practical writing tools

## Identity

- Task: `INDIVIDUAL_BOARD_TOOLS`
- Owner: repository owner
- Date: 2026-10-24 (Asia/Novosibirsk)
- Base branch: `main`
- Base SHA: `07189de58b7f5d60c02ea6ca6aa9450a324a377f`
- Original implementation base SHA: `1f9d8aec82bd2909917ab22746d94571d87c59c4`
- Planned branch: `feat/individual-board-tools`
- Review level: `MEDIUM`
- Related issue or ADR: existing classic board; ADR 0001 remains Proposed.

## Goal

Make the existing individual lesson board comfortable for handwriting and
mathematical explanation while the trainer remains on the left and the board
on the right. The owner requested this work directly and supplied Octo as a
visual reference. This is a change to MathExam, not an Octo integration.

## Context and evidence

- `trainers/trainer-board.html` is the actual side-by-side individual workspace.
  The cabinet's `learning/board.js` is a different component and is out of scope.
- Existing strokes use absolute CSS-pixel coordinates and existing Socket.IO
  events. The server enforces control ownership and undo of the author's own
  objects. Neither those events nor authorization rules need to change.
- Source inspection found that the eraser also removes the background and that
  the client clears redo on server page-state acknowledgement. These findings
  require browser reproduction and acceptance coverage, not just a UI redraw.
- The previous task-3 integration is merged as the stated base (PR #312).
  Its release evidence is reconciled in `docs/PROJECT_STATUS.md` in this task.

## Approved scope

The owner's direct request authorizes improving the board. The following is
the bounded implementation scope selected for that request.

### In scope

- Quick pen colors and widths, accessible shape menu (arrow, ellipse, triangle),
  and a visible control holder and handoff action.
- Locally resizable trainer/board columns, keyboard resizing, landscape tablet
  layout, and persistence of the local split preference.
- Three visible local modes: trainer and board together, trainer only, and board
  only. Switching preserves the live iframe and all writing. This was explicitly
  added by the owner during implementation.
- Local pan, zoom, reset and fit-to-writing view. Existing stored coordinates
  remain unchanged; these view controls are independent for each participant.
- Separate ink rendering so erasing retains the paper and grid.
- PNG/JPEG/WebP screenshot import through a file chooser or clipboard, shared
  with the other participant and retained on reload. Screenshots render beneath
  handwriting so the eraser preserves them. This was explicitly requested by
  the owner during implementation. The existing generic object transport carries
  a new bounded `kind:image` object; there is no new endpoint or upload service.
- One active pointer, coalesced input, final pointer position and safe gesture
  completion/cancellation; preserve server enforcement after control loss.
- Client undo/redo consistent with existing own-author, cross-page server
  history. Redo history is in memory during the connection, not promised after
  reload. No new storage or server events.
- Focused tests, review, task record and project-status reconciliation.

### Out of scope / protected areas

- No Octo modification, iframe compatibility promise or external board sync.
- No new curriculum, changes to task data, trainer bridges, registry or accounts.
- No changes to `board-server/`, authentication, durable room
  storage, group board, or cabinet drawing implementation.
- No infinite-canvas product, object selection, external upload service or PDF
  library. Screenshot import is the explicitly added exception.
- Synchronizing additional START trainers is a separately authorized task/PR;
  this board improvement must not silently absorb that independent integration.

## Acceptance criteria

- [x] Useful writing controls fit the desktop and narrow-screen layouts.
- [x] New shapes use existing path objects and mirror to the other participant.
- [x] A second pointer cannot replace an active stroke; losing control stops it.
- [x] Erasing and PNG export retain opaque paper/grid pixels.
- [x] Imported and pasted screenshots appear for both participants; erasing
  annotations retains the screenshot and export waits for its decoding.
- [x] Undo removes only the current author's stroke; redo remains available after
  server acknowledgement and restores the intended page after a page switch.
- [x] Split/pan/zoom/fit do not change stored coordinates or reload the trainer.
- [x] All three workspace modes preserve the task, drawing and screenshots.
- [x] Reload/late join receive completed writing and preserve existing role rules.
- [x] Existing task-3 and task-8 board journeys still pass.

## Checks and gates

- Required tests: pure geometry/view/image-budget tests, `board-writing.browser.cjs`, existing
  `board-picker-smoke.cjs`, task-3 and task-8 shared-board browser regressions.
- Required static checks: syntax, scoped diff inspection, `git diff --check`.
- Manual checks: synthetic desktop/tablet/mobile screenshots, tool readability.
- Final gate marker: `INDIVIDUAL_BOARD_TOOLS_OK`.
- Not run: physical stylus/iPad validation, real learner/production rooms,
  unrelated full group-board and B2 suites. Existing inherited B2 Roads failure
  is not silently reclassified as passing.

## Review plan

- MEDIUM: bounded frontend behavior using existing stored objects and server
  semantics; recoverable by reverting this frontend change.
- Trainer design consultation: not applicable. No learning sequence, mathematics
  or trainer interaction changes. Ordinary focused review remains required.
- Ready-result review: independent focused code review, local two-context browser
  evidence and responsive screenshots. No external Claude verdict is claimed.
- External review: not required by MEDIUM policy unless requested by owner.
- Handoffs contain only scoped public source and synthetic test evidence, never
  credentials, personal learner data or machine-specific paths.

## Risk and rollback

- Main risks: pointer-to-world mapping, overlapping local/server history, narrow
  toolbar reflow, and embedded trainer regression.
- Coordinates, stroke types and server payloads stay backward compatible.
  Existing geometric shapes are ordinary paths. Screenshots add `kind:image`
  through the generic object payload; old clients ignore this kind, so both
  participants should load the updated board. View/split settings are local only.
- Images are re-encoded locally to at most 1600 pixels on the longer side and
  350 KiB of data URL text. The import budget is eight screenshots and 1500 KiB
  of serialized board state, below the existing inbound Socket.IO size limit.
  Input files are limited to 10 MiB and decoded source dimensions are bounded.
  These are client import limits, not newly enforced server authorization rules.
- Existing server rooms remain memory-backed. This work adds no durable-save
  guarantee. Physical palm rejection/latency needs device use by the owner.
- Rollback: revert this task's frontend and workflow delta through normal review;
  no migration or data rewrite is required. Merge/release remains owner-gated.

## Permissions

- Current-task execution authorization: direct owner request to improve the board.
  No literal `START` marker is claimed; execution follows the session instruction
  to treat an explicit action request as authorization for reversible work.
- Branch creation, implementation, local commits, push and Draft PR: allowed by
  that request and session workflow.
- Merge, auto-merge and deployment: **not authorized for this task**.
- Previous PR #310–312 permissions do not authorize this new release.

## Execution record

- Actual branch: `feat/individual-board-tools`
- Original implementation base SHA: `1f9d8aec82bd2909917ab22746d94571d87c59c4`
- Actual head SHA / PR: recorded in the Draft PR without a self-referential
  commit.
- Gate: `INDIVIDUAL_BOARD_TOOLS_OK`.
- Passed: 12 geometry/view tests and nine image validation/budget tests; complete
  local and two-participant `board-writing.browser.cjs`; existing
  `board-picker-smoke.cjs`, `profile-stereo-board.browser.cjs`, and
  `profile-expressions-board.browser.cjs`; JavaScript/inline-script syntax,
  workflow parse, scoped review and `git diff --check`.
- The writing browser gate exercised file chooser and real clipboard insertion,
  PNG/JPEG/WebP decoding, downscaling, screenshot/ink separation, exported PNG
  pixels, three modes, split/zoom/pan/fit, secondary pointer rejection,
  control loss, own-author undo/redo across pages, reload and late join. It used
  isolated local rooms and synthetic data, with no production room writes.
- Failed intermediate runs: the first writing run exposed a transparent final
  pixel row from fractional CSS sizing; rendering now fills device pixels.
  The next run exposed whitespace-only differences in two legacy fixture CSS
  class fields; the test oracle normalizes only those two fields and preserves
  exact comparison for board objects and mathematical state. The final run
  passed. A sandbox localhost-listen restriction blocked the initial picker
  invocation; the approved local-server invocation passed without code changes.
- Focused independent review found and resolved pending-undo overwrite, gesture
  page ownership, stale async import/export, remote preview during pan, and
  preseeded author normalization issues. No external review verdict is claimed.
- Not run: physical stylus/iPad, real learner/production rooms, unrelated full
  B2/group suites. These limits remain as declared above.
- Scope deviations: none.

## Authorized current-base reconciliation — 2026-10-24

- The owner explicitly answered "Разрешаю" to the bounded proposal to resolve
  conflicts in PR #313 and PR #316 and repeat their checks. This authorizes
  reconciliation of the existing task branches; it does not authorize merging
  either PR into main, auto-merge or deployment.
- Original reviewed base: `1f9d8aec82bd2909917ab22746d94571d87c59c4`.
  Original PR #313 head: `41b5a40c0247877e0620e54c4aede84d16d3736b`, with
  five successful exact-head CI checks. First reconciliation base:
  `202d39bf826c8c7e030e59ff162fe808000cae7e`, then the sole concurrent squash merge
  of PR #318. Its approved Atanasyan integration is preserved.
- The read-only preflight found two conflict files. The resolved board host
  keeps this task's new controls and adds main's exact iframe inert, tab-index
  and focused-frame blur behavior to prevent keyboard input after control loss.
  The project-status record retains both tasks and the published chapter-II
  record. Atanasyan is recorded as merged code; this task does not claim its
  production deployment.
- The picker script keeps main's `20261024-atanasyan-board` cache suffix because
  this task does not modify the picker or its catalog. The separate START task
  owns its own consistent fresh cache suffix; ordered composition is reviewed
  separately, without absorbing that task into this one.
- Revalidation plan: board geometry/image units, full writing and picker
  browsers, existing task-3/task-8 browsers, Atanasyan classic/managed browser
  including keyboard revoke, applicable registry/contract tests, syntax and
  whitespace checks. The combined two-PR tree additionally requires all-five
  START coverage and exact registry/catalog preservation.
- The original gates above remain historical evidence for the original head.
  New-base gate results, exact resolved tree and final head are recorded in the
  updated PR after execution; no pending or old result is called a new pass.
- The resolution changes no authored curriculum, trainer adapter, backend
  runtime, authentication, role, storage or deployment configuration. Concurrent
  main additions remain byte-identical outside the two conflict resolutions.

- Executed checks on the first reconciliation base `202d39b` passed:
  21/21 board units; full writing, picker,
  existing task-3/task-8 and Atanasyan classic/managed browser gates, including
  keyboard-revoke protection. The paired runtime also passed 150/150 focused
  tests and six browser gates: writing, all five START wrappers/22 topics,
  task 3, task 8, Atanasyan and picker. Local Chromium 151.0.7922.34 used
  synthetic isolated rooms/accounts; no production writes occurred.
- Independent focused resolution review passed. Both original file sets remain
  exact (13 files for this task, 31 for START); all course/runtime source outside
  the declared conflict preservation is unchanged. No local test failed during
  the first reconciliation. Exact-head GitHub CI is assessed after branch publication
  and recorded in the PR, without claiming older checks for the new head.

## Preserving subsequent main changes — 2026-10-24

- Before publication of either updated task branch, main advanced to
  `07189de58b7f5d60c02ea6ca6aa9450a324a377f` through merged PR #315
  (`52cb1c1a5c731acd660139328f0001ccfa33a08b`, Vilenkin 6 cloud cabinets)
  and PR #319 (Makarychev 8 course). The same owner-authorized bounded conflict
  resolution preserves these concurrent implementations; it adds no feature
  scope and provides no merge or deployment authorization.
- The fresh read-only composition found only the project-status conflict for
  this task. The board runtime, the inherited expressions readiness fix and
  the new course/cabinet code compose cleanly. The status resolution retains
  Vilenkin's inherited preparation record, the verified code-merge provenance,
  our board/Atanasyan notes and published chapter-II evidence. Deployment of
  the concurrent tasks is not claimed by this reconciliation.
- Results recorded above belong to the first `202d39b` composition. Required
  runtime/contract gates are repeated against the new `07189de` base and exact
  resulting tree. Their outcomes are recorded only after execution in the PR;
  no previous PASS is substituted for the new-base gate.
- The current-base review remains the original 13-file task delta. Concurrent
  source outside that delta is preserved. No runtime or test file is edited by
  this second, documentation-only conflict resolution.

## Required handoff

```text
EXECUTIVE STATUS

Task:
PR:
Base:
Head:
Gate:
Tests:
Failures:
Not run:
Scope deviations:
Recommendation:
Next user decision:
```

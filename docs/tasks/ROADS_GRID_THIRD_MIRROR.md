# Roads-grid third mirror proof

## Identity

- Task: adapt `trainers/oge-1-5-trainers/practice-1-5-roads-grid.html`
  as the third production `board-mirror` trainer and the first production
  proof for Nested-path foundation.
- Owner: MathExam.
- Plan publication date: 2026-07-16.
- Base branch: `main`.
- Base SHA: `0c56247a4338469a28858eb341f379de63d3be6f`.
- Plan branch: `codex/roads-grid-third-mirror-plan`.
- Implementation branch: not created and not authorized by this plan.
- Review level: `NEW_ARCHETYPE`.
- Related ADR: `docs/adr/0001-trainer-bridge-platform.md`.
- ADR status: `Proposed`.
- Architecture gate status: `PENDING_EXTERNAL_REVIEW`.

The owner-approved task specification and schema in this plan PR are the
controlling scope for this specific future roads-grid PR. ADR 0001 remains
`Proposed`; this task does not change its status or treat it as accepted.
Implemented Bridge, registry, and Nested-path behavior is established by the
base code and gates.

## Goal

Prepare a bounded adapter contract for the existing nested roads-grid trainer.
A future, separately authorized implementation must preserve autonomous
direct-URL operation, use the existing board Bridge and protocol, reproduce an
exact fixed or generated exercise and its visible state after reload or remote
hydration, and never mix mirrored session state with browser-local learner
statistics.

This document and
[`roads-grid-board-state-v1.schema.json`](schemas/roads-grid-board-state-v1.schema.json)
are the only repository artifacts created by the plan stage. The sanitized
architecture review packet belongs in the Draft PR body and must not be
duplicated as a repository file.

## Base-drift guard and verified foundation

Before creating the plan branch, authoritative GitHub `main` was queried
directly. It resolved to exactly
`0c56247a4338469a28858eb341f379de63d3be6f`; no cached local tracking ref was
used for the decision.

At that base:

- Nested-path foundation is implemented and authorizes trainers by unique
  `trainerId` plus the complete canonical `trainers/...` file path.
- Basename fallback is forbidden and covered by the committed path
  conformance gates.
- `trainers/board-compat.json` has 11 catalog entries and two
  `board-mirror` entries.
- `trainers/board-bridge.js` implements Bridge protocol v1, hydration,
  origin/source/envelope checks, a remote-apply guard, 40 ms notification
  debounce, state deduplication, and generic JSON-state limits of 64 KiB,
  depth 8, and array length 2000.
- Roads-grid is not registered and contains no Bridge adapter.
- From the nested trainer, the Bridge script path is exactly
  `../board-bridge.js`, resolving to `trainers/board-bridge.js`.

## Current trainer assessment

### Current mutable JavaScript state

The trainer currently uses one mutable object:

```text
state = {
  scenIdx, setIdx, task, mode, gen, genScenario, count,
  solved, streak, done
}
```

- `scenIdx`: fixed scenario index, `0..5`.
- `setIdx`: fixed setup index, `0..1`.
- `task`: visible task index, `0..4` (tasks 1-5).
- `mode`: `learn | practice | teacher`.
- `gen`: fixed/generated selection flag.
- `genScenario`: the generated scenario object, including an HTML-bearing
  `story` string.
- `count`: `off | pairs | triples`.
- `solved`, `streak`: local learner statistics.
- `done`: in-memory completion map used for stepper checkmarks and solved
  counting.

External mutable variables are `COUNT_ANIM`, derived from the current render,
and `countTimer`, the active interval handle. The scenario, skeleton,
orientation, name, goods, and price collections are mutable JavaScript values
but are used as constants by current code.

### State that currently exists only in the DOM

- Task 1 select values and each field's `correct`/`wrong` mark.
- Tasks 2-5 answer input text.
- Feedback kind, text, style, and visibility for the current task.
- Hint and teacher-solution visibility.
- The value inserted into an input by `Show solution`.
- The current count-animation marker/frame.
- Event listeners bound to the current dynamic task card.

Selector, mode, count, and active-task classes are derived from the partial
JavaScript state. Stepper `done` classes are derived from the in-memory
completion map. There is no `getState`, `applyState`, `subscribe`, Bridge
registration, or session reload restoration.

### Random variant inputs

Random generation currently selects:

- one of 6 Pythagorean skeletons and one of 8 orientations;
- cell scale from `[1, 1, 2]`;
- road and path speeds, with a repair branch that keeps path speed below road
  speed;
- one of 8 hero/senior pairs, three distinct villages from 16, one
  destination from 10, and one of two path kinds;
- a permutation of town numbers 1-4;
- 20 store prices within product-specific ranges;
- 2-3 distinct basket goods and bounded quantities;
- setup 0/1, three identification roles, and route choice for task 4.

Coordinates, grid bounds, pond, turn direction, narrative, answers, and SVG
geometry are derived. The generated semantic result is authoritative. A seed
is neither required nor sufficient and must not be used as a substitute for
the snapshot.

### Answers, feedback, hints, and checked state

- Task 1 checks three selects, marks each field, shows incomplete/correct/
  incorrect feedback, and may mark the step complete.
- Tasks 2-5 parse bounded numeric text, show invalid-number/correct/incorrect
  feedback, and may mark the step complete.
- Hint and solution buttons reveal content; solution reveal may also write an
  answer into the current input.
- `onCorrect()` changes `done`, `solved`, and `streak`; `onWrong()` resets
  `streak`; both persist statistics immediately.
- A full `renderTask()` replaces the dynamic card, so current answers,
  feedback, marks, and explicit reveal state are lost.

The future session snapshot therefore needs explicit per-task answer,
feedback, checked/completed, mark, hint, and solution fields. Feedback text
and styles must be rendered locally from closed semantic codes.

### Task transitions

- Stepper buttons navigate directly between tasks 1-5.
- `Next` advances `1 -> 2 -> 3 -> 4 -> 5`.
- After task 5, generated mode creates a new random snapshot and returns to
  task 1.
- After task 5 in fixed mode, setup 0 advances to setup 1; setup 1 advances to
  setup 0 of the next fixed scenario, wrapping after scenario 6.
- Choosing a fixed scenario exits generated mode and resets to task 1 while
  preserving the selected setup.
- Choosing a setup exits generated mode and resets to task 1.
- Choosing random generates immediately and resets to task 1.
- Mode changes preserve the selected variant and task.
- Count mode persists, but its controls are visible only on tasks 2 and 3.

Every future local transition must commit one complete valid session snapshot
before render and notification. Remote apply must never run transition code.

### localStorage and statistics

- Storage key: `mathExamCourseProgress.v1`.
- Topic key: `practiceRoadsGridTrainer`.
- Persisted topic value: `{ solved, streak, total }` where current
  `total = 6 * 2 * 5 = 60`.
- Writes preserve unrelated topic keys in the shared storage object.
- `done` is not persisted.
- Standalone reload currently restores only `solved` and `streak`, then starts
  at fixed scenario 1, setup 1, task 1.

The future adapter must separate `sessionState` (mirrorable) from
`progressState` (browser-local). No learner statistics, storage payload,
history, analytics, or learner identity may enter the board snapshot.

Standalone reload needs an explicit session path because the top-level Bridge
handle is inert. A future implementation must persist the validated local
`sessionState` under the dedicated `sessionStorage` key
`mathExamRoadsGridSession.v1` only for top-level local user actions. It must
restore that snapshot before the initial standalone render. Board iframes use
authoritative room hydration instead and do not write this key during remote
apply. `localStorage` remains reserved for the existing progress topic; session
and progress values never share a payload.

### Render/apply and timer assessment

`renderTask()` and `renderMap()` can rebuild a stable base UI and stop an
existing count timer, but they are not idempotent state restoration because
they depend on partial globals and discard DOM-only state. The current
narrative uses `innerHTML` from `scenario.story`; that field is prohibited in
state. The current check/save handlers are local side-effect paths and cannot
be called by remote hydration or apply.

The count helper derives grouped route geometry into `COUNT_ANIM` and advances
an interval every 650 ms. A remote snapshot must carry only a bounded static
`countFrame`. Applying it renders that frame and leaves no running viewer
timer.

Adapter complexity is **medium-high**: a monolithic inline trainer, five
dynamic task forms, SVG derivation, full random snapshotting, a timer, and
statistics currently mixed with visible state. The platform integration
complexity remains low because no board, server, or Bridge runtime work is
permitted.

### Snapshot budget

The closed schema stores one selected semantic setup, all five bounded task UI
records, and no HTML. The implementation contract is:

- adapter snapshot budget: at most 8 KiB UTF-8;
- platform limit: 64 KiB UTF-8;
- schema depth and arrays remain below platform depth 8 and array length 2000;
- a schema-maximum fixture must be measured with `TextEncoder`, pass
  `MathExamBoard.validateState()` with HTML disallowed, and stay within 8 KiB.

The 8 KiB value is a product budget, not permission to approach the platform
limit.

### Mobile, iframe, and relative dependencies

- The two-column trainer layout collapses at 1040 px.
- The SVG is fluid, answer/count rows wrap, and the shop table owns its
  horizontal scroller.
- There is no roads-grid breakpoint below 1040 px. Sticky top navigation,
  three mode buttons, card padding, and the five-button stepper require
  explicit 360 px and 390 px gates.
- In the board, the iframe becomes a stacked row at narrower board widths and
  must retain reachable internal vertical scrolling without outer horizontal
  overflow or resize loops.
- The current sibling back link is `practice-1-5-map.html` and must remain
  relative to the nested directory.
- The only future Bridge dependency is `../board-bridge.js`.

## Normative state contract v1

The normative machine-readable artifact is
`docs/tasks/schemas/roads-grid-board-state-v1.schema.json`.

### Included session state

- `selection`: catalog/generated source, catalog indexes or nulls, and a
  bounded variant key.
- `scenario`: the complete selected semantic setup: people and path kind,
  scale and speeds, grid, four numbered towns and coordinates, pond, all
  prices, identification roles, task routes, and basket.
- `view`: task, mode, count grouping, and static count frame.
- `tasks`: exactly five UI records. Task 1 stores three select answers, three
  marks, checked/completed flags, feedback code, and reveal flags. Tasks 2-5
  store bounded numeric text plus the same semantic UI flags.

### Explicitly excluded

- HTML, `story`, `innerHTML`, DOM/SVG/CSS snapshots, classes, handlers, and
  timer handles.
- Derived narrative, answers, totals, geometry, and count paths.
- `protocolVersion`, `trainerVersion`, and `stateSchemaVersion`; these remain
  only in the approved Bridge envelope.
- `solved`, `streak`, storage contents, learner progress/history, analytics,
  learner identity, room id, tokens, and any authorization material.
- Generator internals or seed.

### Validation and serialization rules

1. The snapshot is JSON-only and semantic. Every object is closed with
   `additionalProperties: false`; arrays, strings, numbers, and enums have
   explicit bounds.
2. Validate the complete candidate before any mutation. Unknown keys, wrong
   tuple sizes, invalid enums, non-finite/out-of-range numbers, invalid town
   number uniqueness, out-of-grid coordinates, invalid route relationships,
   unsafe text, and catalog index/snapshot mismatch are rejected.
3. Fixed and generated state is restored from the supplied semantic snapshot;
   `applyState()` must not call `makeRandomScenario()` or reselect catalog
   data.
4. A rejected snapshot leaves the prior session state, DOM, timers, and local
   statistics unchanged.
5. Accepted data is deep-copied without normalization. `applyState(s)`
   followed by `getState()` must produce JSON serialization byte-identical to
   the accepted canonical input.
6. Locally constructed state passes the same schema and semantic validator
   before it becomes current or is notified.

## Render and side-effect contract

1. Split mirrorable `sessionState`, local-only `progressState`, and transient
   Bridge/timer handles.
2. Rebuild narrative from validated semantic fields using local templates;
   no state string is assigned as HTML.
3. `renderFromState()` derives the complete task/SVG UI, restores selectors,
   answers, marks, feedback, checked/completed state, hints/solutions, mode,
   count controls/frame, and stepper state.
4. Repeated `renderFromState(s)` calls produce the same observable DOM and do
   not multiply listeners or timers.
5. Rendering may stop a transient count timer. It must not generate, check,
   advance, write/reset progress, show confirmation UI, or notify the Bridge.
6. `applyState()` validates the full candidate, prepares the derived render
   model off to the side, stops transient playback, atomically swaps the deep
   copy into `sessionState`, and calls only `renderFromState()`.
7. Hydration/remote apply never writes `localStorage`, calls check/save/reset,
   starts or resumes an interval, emits analytics, or calls a state notify. It
   also never writes standalone `sessionStorage`; embedded reload is restored
   by authoritative board hydration.
8. Local user actions update one bounded session snapshot, render it, then
   issue one Bridge notification through `subscribe`/`notifyStateChanged`.
   Input notifications rely on the existing Bridge debounce and
   deduplication. Count playback may notify only its bounded 650 ms frames. In
   autonomous top-level mode, the same validated local snapshot is written to
   `mathExamRoadsGridSession.v1` in `sessionStorage` for reload recovery.
9. A remote `countFrame` is rendered statically. Only a fresh local play
   action may start a count interval.
10. Local check actions may update local progress after committing their
    visible session result. The same visible result arriving remotely never
    updates viewer progress.
11. `getState()` returns a JSON-safe deep copy of `sessionState`; it never
    scrapes the DOM or reads localStorage.

## Bridge contract

The future trainer must load:

```html
<script src="../board-bridge.js"></script>
```

It must use the existing approved registration surface only:

```js
MathExamBoard.register({
  id: 'practice-1-5-roads-grid',
  version: '1.0.0',
  stateSchemaVersion: 1,
  parentOrigin: location.origin,
  getState,
  applyState,
  subscribe
});
```

No custom Socket.IO event, room id, token, new protocol, protocol version,
board/server hook, or Bridge runtime change is allowed. Direct top-level use
receives the Bridge's inert handle and remains fully autonomous.

## Approved future implementation scope

### Production files: exactly two

1. `trainers/oge-1-5-trainers/practice-1-5-roads-grid.html`
2. `trainers/board-compat.json`

The first file owns all trainer-specific state, validation, rendering,
standalone behavior, and adapter logic. The second registers the complete
nested path as the third mirror. After implementation, the registry must have
exactly 12 catalog entries and exactly 3 `board-mirror` entries.

### Non-production support files

Only necessary existing registry/browser harness files and bounded fixture
files may change. Reuse the existing board lifecycle harness; add a compact
roads-grid probe rather than a trainer-specific protocol implementation.

### Forbidden implementation areas

- `trainers/trainer-board.html`.
- `trainers/board-bridge.js`.
- `board-server/index.js`, `board-server/trainer-registry.js`, or any other
  board/server production runtime.
- A client allowlist, server allowlist, basename fallback, new protocol, new
  Socket.IO event, room/token field, path move, or deployment configuration.
- Trainer Factory, inventory work, bulk migration, or unrelated redesign.

## Future manifest contract

The future entry is constrained to these architectural fields:

```json
{
  "trainerId": "practice-1-5-roads-grid",
  "file": "trainers/oge-1-5-trainers/practice-1-5-roads-grid.html",
  "boardCompatibility": "board-mirror",
  "supportsSeed": false,
  "supportsBoardMirror": true,
  "version": "1.0.0",
  "stateSchemaVersion": 1,
  "bridgeProtocolVersion": 1,
  "allowLegacyHtml": false
}
```

Title, group, and note copy may be finalized during implementation without
changing the contract fields above.

## Acceptance criteria for the future implementation

### Standalone and state

- [ ] Direct nested URL remains fully functional without a board: all 6 fixed
  scenarios, 2 setups, generated variants, tasks 1-5, modes, count helper,
  hints/solutions, checks, and local progress.
- [ ] Snapshot is valid against the committed closed schema and the semantic
  validator; Bridge generic validation passes with HTML disallowed.
- [ ] Fixed and generated variants restore without regeneration or catalog
  reselection.
- [ ] Reload restores the same variant, task, mode, count frame, all task
  answers, marks, feedback, checked/completed state, and reveal flags.
- [ ] `renderFromState()` is observably idempotent; listener and timer counts
  do not grow.
- [ ] `applyState()` is atomic and invalid state leaves the prior view intact.
- [ ] `applyState(s)` -> `getState()` is JSON serialization stable.
- [ ] Schema-maximum snapshot is at most 8 KiB and below all 64 KiB platform
  limits.

### Side effects, storage, and loop safety

- [ ] Remote hydrate/apply does not generate, check, advance, reset, confirm,
  notify, start a timer, emit analytics, or write localStorage/sessionStorage.
- [ ] Teacher and every viewer retain independent
  `mathExamCourseProgress.v1.practiceRoadsGridTrainer` values.
- [ ] Viewer statistics and unrelated keys under
  `mathExamCourseProgress.v1` are byte-identical before/after hydration,
  remote input/feedback, reload, late join, grant, and revoke.
- [ ] Local standalone checks still update only the local topic while
  preserving unrelated storage keys.
- [ ] Remote apply emits no echo; identical state is deduplicated; message
  counts prove no synchronization loop.
- [ ] Remote count frames remain static; viewer intervals remain absent.

### Teacher/student lifecycle and authorization

- [ ] Teacher -> student mirrors fixed/generated selection, task navigation,
  selects/inputs, marks, feedback, hints/solutions, mode, count mode/frame,
  completion state, and next-variant transitions.
- [ ] Student -> teacher works only after control grant.
- [ ] Revoke during pending input debounce drops the revoked student's update
  and restores/retains authoritative teacher state.
- [ ] Teacher reload mid-task hydrates from authoritative room state.
- [ ] Student reload hydrates without changing viewer statistics.
- [ ] Late join hydrates the complete current snapshot.
- [ ] Generated snapshot remains byte/deep equal after reload and late join:
  coordinates, numbers/names, speeds, prices, basket, routes, and task state
  are unchanged.
- [ ] Complete nested path plus trainer id authorizes the mirror. Bare nested
  basename, wrong directory/case/id, same basename elsewhere, traversal, and
  encoded path inputs fail closed.
- [ ] Registry and quick selector show 12 catalog entries and 3 mirror
  entries.

### Mobile, iframe, and browser quality

- [ ] Standalone desktop smoke passes.
- [ ] 360 x 800 and 390 x 844 standalone gates pass with no outer horizontal
  overflow; topnav, mode controls, stepper, inputs, map, and buttons remain
  usable. Only the shop-table wrapper may scroll horizontally.
- [ ] Board iframe passes desktop two-column, <=1050 px stacked, and <=720 px
  mobile layouts; internal scrolling reaches all tasks and progress controls.
- [ ] No sticky-nav clipping, focus trap, iframe resize loop, or unexpected
  outer horizontal scroll.
- [ ] Console errors, `pageerror`, and unapproved warnings are zero for
  standalone, teacher/student, reload, late join, mobile, and iframe cases.

## Required future test matrix

| Case | Action | Required evidence |
| --- | --- | --- |
| Standalone | Exercise fixed/generated variants and reload outside iframe | Inert Bridge; validated sessionStorage restores the same snapshot; only local checks write local progress topic |
| Teacher -> student | Change random scenario, task 1 fields/check, numeric input, reveal and count frame | Student deep state/visible probe equals teacher; student storage unchanged |
| Granted student -> teacher | Grant, edit input/select/mode/task/count | Teacher receives one bounded deduplicated update |
| Revoke mid-input | Revoke before 40 ms Bridge debounce flush | Student update is dropped; teacher remains authoritative |
| Teacher reload | Reload mid-task after answers and feedback | Same room snapshot and same generated setup return; no regeneration |
| Student reload | Reload viewer with sentinel storage | Snapshot restores; storage sentinel and statistics remain byte-identical |
| Late join | Join after generated/check/reveal state exists | Full snapshot appears before any viewer notification |
| Count playback | Observe local frames, then apply one remotely | Bounded frame notifications; viewer renders a static frame with no timer |
| Serialization | Apply canonical max/fixed/generated snapshots, then get | JSON serialization is byte-stable; no unknown/HTML/version fields |
| Invalid state | Unknown key, HTML text, bad enum/bounds/catalog mismatch/oversize | Atomic rejection; previous state/view/storage unchanged |
| Authorization | Exact nested path and negative path/id matrix | Full-path authorization only; no basename fallback |
| Registry | Load endpoint/quick selector | Exactly 12 catalog and 3 mirror entries |
| Mobile | 360 and 390 px standalone | Usable layout; no outer overflow |
| Iframe | Desktop, stacked, and mobile board | Reachable content; no resize loop/overflow |
| Error channels | All cases | `console.error = 0`, `pageerror = 0`, unapproved warnings = 0 |

## Checks and gates

### Plan-stage checks

- Parse the schema as JSON.
- Verify `additionalProperties: false` on every object schema and explicit
  bounds on all strings, arrays, and numeric state fields.
- Verify repository-relative links and exact nested Bridge path.
- Verify the plan diff contains only this task specification and schema.
- Run `git diff --check` and secret/absolute-path sanitization checks.
- Confirm trainer HTML, manifest, board, server, and Bridge are unchanged.

### Future implementation checks

- Existing board-server registry/unit/integration tests.
- Existing common teacher/student Bridge browser lifecycle smoke extended by
  a compact roads-grid fixture/probe.
- State schema, semantic validator, maximum-size, atomic-apply,
  apply/get-stability, and remote-side-effect tests.
- Full matrix above, including 360/390 px and iframe gates.
- Final diff/name-only inspection proving exactly two production runtime
  files and no board/server/Bridge changes.

The proposed implementation marker
`ROADS_GRID_THIRD_MIRROR_ARCHITECTURE_GATE_OK` must not be reported by this
plan. Current status is `PENDING_EXTERNAL_REVIEW`. A non-blocking sanitized
architecture review and explicit owner acceptance are required before any
implementation START. A plan review does not replace exact implementation-head
review evidence.

## Review plan

`NEW_ARCHETYPE` applies because this is the first random, multi-step,
dynamically rendered nested production mirror and establishes the adapter
pattern for future generators.

External architecture review is required before implementation. Valid review
provenance must include provider, PR, base SHA, reviewed head SHA, verdict,
and verifiable source or timestamp. An approval marker copied from this file,
the PR body, or chat is not review evidence.

The sanitized handoff may include only repository-relative public facts,
contract, schema, scope, test matrix, risks, and rollback. It must exclude
credentials, tokens, room identifiers, private material, personal data, and
machine-specific paths.

## Risk and rollback

### Main risks

- Incomplete random snapshot produces another exercise after hydration.
- HTML-bearing narrative or unsafe text enters state/rendering.
- DOM-only answers, marks, feedback, or reveals disappear on navigation.
- Remote apply reaches progress/localStorage or an async count timer.
- Apply/get normalization produces echo loops.
- Fixed catalog index and embedded semantic snapshot disagree.
- Nested trainer is authorized by basename rather than complete path.
- Narrow standalone/iframe navigation overflows despite desktop responsiveness.

### Rollback after a future implementation

1. Remove the single roads-grid entry from `trainers/board-compat.json`.
2. Revert the roads-grid adapter/render/state refactor and its supporting tests
   as one logical change.
3. Re-run registry and the complete two-reference-trainer lifecycle gates.
4. Keep the existing nested direct URL available in its autonomous pre-mirror
   form.
5. Existing two mirrors, room links, protocol, board/server runtime, and
   deployment topology remain unchanged. No schema/data migration is needed;
   room state fails closed when the manifest entry is absent.

Plan-stage rollback is a simple revert of the one docs-only commit.

## Permissions

- Plan-stage base guard: passed.
- Plan branch creation: authorized and completed.
- Two plan artifacts: authorized.
- One logical docs-only commit: authorized.
- Push and Draft PR with sanitized packet: authorized.
- Trainer HTML change: not authorized.
- Manifest change: not authorized.
- Board/server/Bridge change: not authorized.
- Implementation branch or implementation START: not authorized.
- Trainer Factory: not authorized.
- Merge, auto-merge, and deployment: not authorized.

## Execution record

- Actual branch: `codex/roads-grid-third-mirror-plan`.
- Actual base SHA: `0c56247a4338469a28858eb341f379de63d3be6f`.
- Actual head SHA: recorded in the Draft PR and final handoff after commit.
- PR: recorded after publication.
- Commit: one docs-only logical commit.
- Production code changed: no.
- Architecture gate: `PENDING_EXTERNAL_REVIEW`.
- Scope deviations: none expected; any deviation is a hard stop.

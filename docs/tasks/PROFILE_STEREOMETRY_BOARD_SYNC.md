# Profile task 3: synchronize existing stereometry with the shared board

## Identity

- Task: `PROFILE_STEREOMETRY_BOARD_SYNC`
- Owner: repository owner
- Date: 2026-10-23 (Asia/Novosibirsk)
- Base branch: `main`
- Base SHA: `40682b243b3e7342d4330272f7329e60a1d0f417`
- Planned branch: `feat/ege3-board-sync`
- Review level: `MEDIUM`
- Related issue or ADR: implemented Trainer Bridge v1 and Registry B1/B2;
  published profile task-8 integration, PR #311.
- ADR status: ADR 0001 remains `Proposed`. Existing code, tests and production
  evidence establish the bridge behavior used here; no new protocol is proposed.

## Goal

Open the latest profile course at
`https://mathexam.space/ege-profil/start/index.html#exam/3` on the ordinary
shared board, with the controlling participant and observers seeing the same
stereometry task, answer, accepted steps, hints, worked solution and model view.
Preserve the existing authored course and keep board work separate from a
learner's personal course progress.

## Context and evidence

- The owner's current direct instruction starts this separate task after the
  publication of PR #311. The prior merge/publication authorization covered
  PR #311 only and does not authorize release of this task.
- Task 3 comprises eight existing lessons with six tasks each: `stereo-box`,
  `stereo-cube`, `stereo-prism`, `stereo-pyramid`, `stereo-cylinder`,
  `stereo-cone`, `stereo-sphere` and `stereo-compound` (48 tasks).
- The task-specific and lesson models are rendered by `stereo-tasks.js`.
  Camera orientation and the additional-view disclosure currently live in
  renderer/DOM state, so an iframe URL alone cannot mirror those interactions.
- PR #311 supplies the memory-only board session, bounded snapshot validation,
  silent course restoration and existing bridge subscription lifecycle.
- The authoritative current main was verified before creating this task branch.
  Its tree is the released PR #311 tree. Both automatic post-push profile jobs
  from that release have now completed successfully.

## Approved scope

### In scope

- One thin registered wrapper: `trainers/ege-profile-stereometry.html`,
  trainer ID `ege-profile-stereometry`, version `1.0.0`, state schema `1`,
  bridge protocol `1`, legacy HTML disabled and `supportsSeed: false`.
- Reuse the existing profile board adapter through exactly two fixed course
  configurations: published task 8 and this task 3. Preserve task-8 snapshot
  compatibility, routes, registration and storage isolation.
- Task-3 lesson, example, guided/plan/independent practice, repair/pause and
  exam/calm overview routes; keep other course routes outside this wrapper.
- Bounded semantic state for the existing course and silent model hooks for
  camera orientation, additional-view disclosure and corresponding visible
  status. Restore closures without replaying input or creating new attempts.
- Existing teacher/observer behavior, transfer of control, reload, reconnect
  and late joining on the classic board.
- One registry entry, one searchable picker entry, literal same-origin aliases
  for the supported canonical routes, shared asset cache versions, precise
  registry expectations and a separate Node 24 CI job.
- Focused adapter/model/picker units, real board browser checks, required
  standalone regressions, this task record and reconciliation of PR #311 status.

### Out of scope

- New tasks, mathematical models, pedagogy or learning sequences; other exam
  numbers, second-part stereometry, textbook courses or mixed checkpoints.
- Group-board support, bridge/server protocol or authentication changes.
- Personal progress import or credit, cabinet assignments, account creation,
  real learner data, persistence changes and production-room testing.
- Repair of the inherited unrelated B2 Roads scenario harness.
- Merge, auto-merge or deployment without a separate authorization for the
  resulting PR and exact base/head.

### Files or areas that must not change

- Authored `*-data.js`, authored task mathematics and standalone credit rules.
- Board SDK, backend runtime, authentication and deployment configuration.
- Other trainers' runtime, group-board runtime and real account records.
- `trainers/trainer-board.html` except the picker script cache token.

## Acceptance criteria

- [x] The exact original task-3 URL and supported same-origin deep links open
  the registered wrapper with query and hash preserved; foreign, encoded and
  traversing paths gain no new mirror authorization.
- [x] All eight topics and 48 authored tasks retain their content and behavior.
- [x] Task, draft, steps, feedback, help, solution progress, model orientation
  and additional-view disclosure restore consistently for controller/observers.
- [x] Rotating or changing the view of the existing model remains free
  exploration; it does not mark independent work as assisted.
- [x] Control handoff, both-role reload, late joining and the next local model
  interaction continue from the restored state, without echo or action replay.
- [x] Malformed snapshots are rejected before memory, route or DOM mutation;
  the two registered course boundaries cannot accept each other's snapshots.
- [x] Board work neither reads nor changes personal progress, calm preferences,
  checkpoint or return-to-task storage; ordinary course behavior is preserved.
- [x] The wrapper identifies shared work without personal credit and remains
  usable at a 320px viewport.
- [x] The published task-8 integration and applicable standalone regressions
  continue to pass with the shared adapter/runtime changes.
- [ ] Exact-head cloud checks pass and are recorded in the PR handoff.

## Checks and gates

- Required units: `tools/profile-stereo-board.test.cjs`,
  `tools/profile-stereo-board-models.test.cjs`,
  `tools/profile-stereo-picker.test.cjs`, both existing expressions board/picker
  contract tests and registry unit/integration tests.
- Required real browser: `tools/profile-stereo-board.browser.cjs` against an
  actual local classic board/server with synthetic participants; preserve the
  existing `tools/profile-expressions-board.browser.cjs` regression.
- Existing integration: picker smoke and targeted B2 `live` / `fail-closed`
  sections; do not represent the known supplemental Roads failure as a pass.
- Required standalone checks: stereo mathematics/model gates, course state,
  worked solutions, Calm and input contracts, task-first browser journeys and
  existing relevant profile CI workflows.
- Static checks: syntax, unchanged authored data, exact wrapper asset/script
  parity, registry/picker agreement, source scope and `git diff --check`.
- Browser checks: desktop/narrow layouts, original link, camera/disclosure,
  keyboard interactions and a real teacher/observer journey.
- Final gate: `PROFILE_STEREOMETRY_BOARD_SYNC_OK`; browser component:
  `PROFILE_STEREOMETRY_BOARD_BROWSER_OK`.
- Intentionally not run: real-account login, production rooms/learner writes
  and unrelated B2 sections; record any additional unrun or failed check.

## Review plan

- MEDIUM rationale: another bounded registration within the existing bridge,
  recoverable room state and no server, authentication or personal persistence
  change. The two static course configurations are not an extensible platform.
- Trainer design consultation applicable: no. The task mirrors existing tasks,
  geometry and interactions; it creates no curriculum or learning sequence.
  If that scope changes, apply the trainer consultation workflow separately.
- Before implementation: independent read-only review of topic coverage,
  model closure state, adapter boundaries, picker/registry and relevant gates.
- Ready-result review: independent review of silent model restoration,
  malformed rejection, two-course isolation, unchanged mathematics and credit,
  followed by targeted regressions and actual two-participant browser checks.
- External review: no mandatory external review for this bounded MEDIUM scope;
  the owner may request it. No external approval is claimed.
- Handoff: only public repository code and synthetic states; no secrets,
  account data, private documents or machine-specific paths.
- If an external review is used, record provider, PR, base/head SHAs, verdict
  and verifiable source/time. Advice or copied markers are not release approval.

## Risk and rollback

- Risks: stale camera closures after restore, model-gesture races during
  control transfer, unwanted assistance/progress credit, cross-course state
  acceptance and frontend/backend registry disagreement.
- Rollback: revert this bounded wrapper/registration, stereo model hooks and
  shared adapter additions through the authorized release process. Preserve
  the already published task-8 integration and ordinary standalone course.
- No learner-data migration. Board state stays in memory and the existing
  room snapshot; existing room lifetime and same-token tab semantics remain.
- A separately authorized publication must verify both exact frontend bytes
  and the backend's authoritative eight-entry mirror registry.

## Permissions

- Current start instruction: the owner directly requested this task in the
  active conversation ("Синхронизируй еще доску с тренажером задачи 3 ЕГЭ,
  по стереометрии"). Implementation is authorized by that instruction.
- Branch creation, local commits, push and Draft PR: allowed for this task.
- Merge, auto-merge and deployment: **not authorized for this new task**.
- This document records scope; copied text is not an independent authorization.

## Execution record

- Actual branch: `feat/ege3-board-sync`.
- Actual base: `40682b243b3e7342d4330272f7329e60a1d0f417`.
- Actual head / PR / commits: recorded in the accompanying PR after validation.
- Final combined local contracts: 66/66 PASS across the new stereo adapter,
  model and picker, existing expressions adapter/picker, and registry unit
  and actual-server integration tests. No skips or cancellations.
- Standalone state/Calm/checkpoint/input/task-first/worked-solution contracts:
  97/97 PASS. Stereo/model/independent contracts: 20/20 PASS. These command
  groups overlap; their counts are not a combined unique-test total.
- Real board: final task-3 browser PASS after focused test review; task-8
  browser PASS on an isolated repeat. Both use actual local classic board
  servers and synthetic participants. The task-3 gate checks the original
  course button/alias, model camera and disclosure, drafts, accepted history,
  help, hidden solutions, pause/repair return, grant/revoke, both-role reload,
  late join, no echo and four unchanged personal stores.
- Existing integration: B2 `live` and `fail-closed` PASS; picker smoke PASS,
  catalog 1442 and zero production-room writes. Task-first browser: 68 lesson
  families PASS. Worked-solution browser: 42 journeys across 13 positions PASS.
- Visual review: actual 320px board screenshots of the overview, task model
  and footer inspected; controls and shared-work notice remain visible.
- Ready-result independent code review: no blocking findings at
  2026-10-23 16:22:35 UTC. Separate test review strengthened source-value
  assertions, preserved announcements and pause/repair return checks; the
  strengthened browser gate then passed. No external approval is claimed.
- Initial failures: the new browser's ambiguous picker selector was narrowed
  to the exact current-course title. An unchanged task-8 browser run executed
  concurrently failed its cleared-angle-input assertion; the identical test
  passed alone without a runtime or test change. The cause is not established;
  exact-head CI must independently pass. Initial local environment failures
  (spawn permission and default Chromium location) were resolved before the
  successful runs above. The inherited supplemental B2 Roads failure from
  the prior task is not claimed resolved.
- Cloud checks and final `PROFILE_STEREOMETRY_BOARD_SYNC_OK` are recorded in
  the resulting PR after publication; they are not preclaimed in this commit.
- Tests not run: production rooms, real-account login, unrelated B2 sections.
- Scope deviations: none.

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

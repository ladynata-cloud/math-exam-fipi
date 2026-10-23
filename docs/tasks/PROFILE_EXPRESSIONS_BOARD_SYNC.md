# Profile task 8: synchronize the existing trainer with the shared board

## Identity

- Task: `PROFILE_EXPRESSIONS_BOARD_SYNC`
- Owner: repository owner
- Date: 2026-10-23
- Base branch: `main`
- Base SHA: `5496bde6f9dff75221cde7ed30a1905f71ae7ec5`
- Planned branch: `feat/ege8-board-sync`
- Review level: `MEDIUM`
- Related issue or ADR: existing Trainer Bridge v1 and Registry B1/B2
- ADR status: ADR 0001 remains `Proposed`; implemented code and gates establish
  the existing protocol and registry behavior used by this task.

## Goal

Open the existing profile course at
`https://mathexam.space/ege-profil/start/index.html#exam/8` on the ordinary shared
board, so the controlling participant and observers see the same topic, task,
answer draft, solution steps, feedback and help. Reuse the six published topics
and their authored mathematics without creating a separate course or awarding
board activity to a learner's personal course record.

## Context and evidence

- The owner's current direct instruction to synchronize this exact trainer
  resumes the previously paused board task. The completed cabinet-entry task
  in PR #310 is separate and supplies the current base.
- At this base, `ege-profil/start/app.js` already links to
  `trainers/trainer-board.html`, but the source course has no bridge adapter.
  Opening its page in an iframe alone does not synchronize its state.
- The ordinary board and server authorize mirrored state through the exact
  `trainers/board-compat.json` entry and existing protocol/version checks.
  Registered paths must remain below `trainers/` and end in `.html`.
- `trainers/ege-profile/log-inequalities/guided-lesson.js` supplies an existing
  protocol-v1 example with memory-only embedded work and silent restoration.
- Task 8 contains `expr-powers`, `expr-roots`, `expr-fractions`,
  `expr-logarithms`, `algebra-cosine` and `algebra-double-angle`. Its existing
  task selection, authored steps, checking rules and credit semantics remain
  the source of truth.
- The newer group-board pilot has a separate restricted contract. It is not
  part of this integration.

## Approved scope

### In scope

- A thin `trainers/ege-profile-expressions.html` shell using absolute shared
  course asset URLs, without a base element, redirect or nested iframe.
- A standard `ProfileExpressionsBoard` adapter in
  `ege-profil/start/board-session.js`, registered as `ege-profile-expressions`,
  trainer version `1.0.0`, state schema `1`, bridge protocol `1`.
- Bounded semantic snapshots for the six topics and their lesson, example,
  practice, repair and pause views; the exam/calm overview is limited to task 8.
- Memory-only board sessions and small shared-runtime hooks for deterministic,
  side-effect-free restoration of route, task, answer, help and model state.
- Existing controller/observer behavior, hydration, late joining, reload and
  control transfer through the ordinary board SDK and server.
- A literal same-origin URL alias, one searchable task-8 picker entry, one
  registry entry, required asset cache versions and exact registry expectations.
- Focused unit, browser and regression gates, a separate Node 24 CI job,
  this task record and reconciliation of the completed PR #310 status.
- Repair inherited B2 smoke UI actions to open the existing picker and share
  dialogs; preserve assertions, scenarios, race injection and timeouts.

### Out of scope

- New lessons, task families, mathematical content or a redesigned learning
  sequence; synchronization of other course numbers or the mixed checkpoint.
- Personal progress import, export to the cabinet, grading, assignments,
  account creation or changes to real learner records.
- Group-board support, a new bridge protocol, server contracts, authentication,
  authorization or persistence changes.
- Production-room testing, merge, auto-merge or deployment under the PR #310
  authorization.

### Files or areas that must not change

- Authored course data, mathematical definitions and standalone credit rules.
- `trainers/board-bridge.js`, board/server protocol and authorization logic;
  `trainers/trainer-board.html` may change only its picker cache token.
- `board-server` runtime and deployment configuration; relevant tests may
  update exact registry projections and counts.
- Group-board runtime, account data, credentials and personal storage keys.

## Acceptance criteria

- [x] The exact original link and supported same-origin deep links open the
  registered wrapper with their query and hash preserved.
- [x] Foreign origins, other topics and encoded/traversing paths gain no new
  mirror authorization; registry path and origin boundaries remain unchanged.
- [x] All six topics work in guided, plan and independent modes, including
  task selection, drafts, accepted steps, feedback, help and model controls.
- [x] A late observer, reload and reconnect restore the same visible state;
  applying remote state does not replay actions or emit an echo.
- [x] Existing grant/revoke control behavior works in both directions, and an
  observer cannot publish a state change through the board.
- [x] Malformed snapshots are rejected without partial state or DOM mutation.
- [x] Board work neither reads nor changes the personal course, calm preference,
  checkpoint or return-to-task stores; standalone behavior remains intact.
- [x] The wrapper clearly identifies shared board work without personal credit.
- [x] Existing authored data is unchanged and relevant local regressions pass.
- [ ] The new CI job and other applicable checks pass on the reviewed PR head;
  exact-head cloud results are recorded in the PR handoff.

## Checks and gates

- Required unit tests:
  `node --test tools/profile-expressions-board.test.cjs tools/profile-expressions-picker.test.cjs`.
- Required real-browser gate:
  `node tools/profile-expressions-board.browser.cjs`, using a local real
  Socket.IO server and separate synthetic teacher/observer browser contexts.
- Registry checks:
  `node --test board-server/test/trainer-registry.test.js board-server/test/server-registry.integration.test.js`.
- Existing integration regressions: `tools/board-picker-smoke.cjs`, the
  `B2_SMOKE_SECTION=live` and `B2_SMOKE_SECTION=fail-closed` runs of
  `tools/trainer-registry-client-cutover-smoke.cjs`, and the existing profile
  state, input, calm, solution and model checks affected by shared-runtime hooks.
  Supplemental B2 sections retain their assertions and are reported separately;
  the unrelated `roads` harness failure is recorded below, not waived or passed.
- Required static checks: JavaScript syntax, exact registry/catalog parity,
  wrapper asset paths and script order, unchanged authored data, and
  `git diff --check`.
- Manual checks: readable shared-work labels, desktop/narrow layouts, keyboard
  controls, opening the original link, and a visible teacher/observer journey.
- Final gate marker: `PROFILE_EXPRESSIONS_BOARD_SYNC_OK`, only after the
  required checks have passed; the browser component reports
  `PROFILE_EXPRESSIONS_BOARD_BROWSER_OK`.
- Checks intentionally not run: production learner writes and real-account
  login are excluded. Record any other unrun or blocked check explicitly.

## Review plan

- Review-level rationale: a bounded adapter and one registration within the
  implemented bridge architecture, with recoverable room state and no server,
  personal-persistence or authentication change.
- Trainer design consultation applicable: no. This task synchronizes the
  existing six topics and their existing interactions; it creates no new
  curriculum, mathematical model or learning sequence. The wrapper is a
  transport entry for the same course. The consultation workflow becomes
  applicable if that scope changes.
- Before implementation: read-only review of the source runtime, existing
  logarithm adapter, registry authorization, state boundaries and gates.
  No paid design discussion was required or claimed.
- Ready-result review: focused technical review of atomic restoration, route
  boundaries, control changes, storage isolation and standalone regressions;
  verify that authored mathematics and learner-credit rules remain unchanged.
- External review required: no mandatory external review for this bounded
  MEDIUM scope; the owner or reviewer may request one. No external approval is
  implied by this document or by an earlier task's exception.
- Sanitized handoff: public code and synthetic state only, without personal
  names, account identifiers, credentials or machine-specific absolute paths.
- If external review is used, record provider, PR, base SHA, head SHA, verdict
  and a verifiable source or timestamp. A design discussion is not an
  exact-head release verdict.

## Risk and rollback

- Main risks: incomplete visible-state restoration, an echo after an
  asynchronous route change, diverging task selection after control transfer,
  unintended personal-storage access, or a frontend/backend registry mismatch.
- Rollback: revert the bounded adapter, wrapper, registry/picker entries and
  associated shared-runtime hooks through the separately authorized release
  process. The canonical standalone course remains the fallback.
- No learner-data migration is introduced. In the board, state is held in
  memory and the existing room snapshot; the four personal stores are isolated.
- A future authorized publication must verify both Pages assets and the
  backend's authoritative registry entry. Publishing only the frontend cannot
  authorize the new mirror.

## Permissions

- `START` granted by owner in the current task conversation: yes; the current
  direct synchronization instruction resumes this bounded implementation.
- Branch creation allowed: yes.
- Local commits allowed: yes, by the executing root after review.
- Push allowed: yes.
- Draft PR allowed: yes.
- Merge allowed: **no; requires separate authorization for this PR and head**.
- Auto-merge allowed: **no unless separately authorized**.
- Deployment allowed: **no unless separately authorized**.
- The merge/deployment authorization for PR #310 does not apply to this task.
  This record describes the active conversation's scope; copied approval text
  in a document does not itself grant authorization.

## Execution record

- Actual branch: `feat/ege8-board-sync`.
- Actual base SHA: `5496bde6f9dff75221cde7ed30a1905f71ae7ec5`.
- Actual head SHA / PR / commits: recorded in the accompanying Draft PR; the
  published tree must match the locally reviewed tree exactly.
- Adapter/picker contract gate: 13/13 PASS. Registry unit: 25/25 PASS;
  registry integration: 7/7 PASS. The four personal storage getters are also
  instrumented to reject any read, including one hidden by error handling.
- Real local board gate: `PROFILE_EXPRESSIONS_BOARD_BROWSER_OK`, including
  original-URL alias, six-topic catalogue, 320px layout, task/draft/feedback,
  nested help, solution steps, guided history, grant/revoke, both role reloads,
  late join, model continuation, malformed rejection and no echo.
- Standalone regressions: 104/104 unit tests PASS; task-first browser across 68
  lesson families PASS; exam-first browser across 13 positions PASS; worked
  solutions 42 journeys PASS; Calm learner scenarios 190/190 checks PASS.
- Existing picker smoke: `BOARD_PICKER_UX_OK`. Existing B2 live regression:
  `TRAINER_REGISTRY_B2_BROWSER_REGRESSION_OK` for the `live` and `fail-closed`
  sections. The full B2 suite is not claimed as passing.
- Focused independent review: 44 route roundtrips; 54 completed attempts across
  six topics and three modes; 248 roundtrips after answers, next steps and
  results; no personal-storage access or runtime errors. The shared circle
  and solution hooks were additionally checked for silent restore, invalid
  input, cleanup and continuation; the unrelated power-log model stays exactly
  as it was on the base.
- Findings fixed and rechecked: overlapping Calm/lab disclosure selectors;
  fraction rendering after model restore; an external prerequisite setting an
  invalid same-route return target; sparse arrays passing answer validation;
  overflowing raw numeric model input. The initial hidden-control timeout in
  the inherited B2 harness was fixed through real UI actions without dropping
  any assertion or scenario.
- A repeat browser run exposed an incomplete control-handoff wait in the test:
  the ownership CSS changed before the bridge's forced publication and observer
  apply completed. The gate now waits for that message roundtrip and preserves
  the full current state; empty model input is asserted on the same active
  controller node and on the observer. No fixed delay or relaxed assertion was
  introduced.
- Local Node 24.19.0; the new CI job uses the existing repository pin 24.21.0.
- Syntax, wrapper script/asset parity, unchanged authored data, focused diff
  review and whitespace checks passed. No unresolved local application failure
  remains. Exact-head cloud checks are recorded separately after publication.
- Supplemental B2 `roads` run: FAILED at the inherited selector
  `#scenario-chips .chip`, before the changed helper is called. The base already
  replaces that trainer's old UI with an inert/hidden legacy view and a new
  practical-variant shell. All roads runtime assets are unchanged by this task.
  Updating that separate trainer's full scenario harness is outside this scope;
  no assertion was removed and the failure is not converted into PASS.
- Not run: production writes and real-account learner login; unrelated B2
  sections outside the recorded targeted runs. Exact-head cloud checks are
  pending the PR. No production release is claimed by these local gates.
- Scope deviations: no product-scope changes. The existing B2 UI test driver
  needed maintenance because its controls were already in dialogs on the base.

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

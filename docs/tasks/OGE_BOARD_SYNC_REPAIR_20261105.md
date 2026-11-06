# OGE shared-board synchronization repair

## Identity

- Task: `OGE_BOARD_SYNC_REPAIR_20261105`.
- Owner: repository owner; explicit `START` in the current task conversation.
- Date: 2026-11-05.
- Base branch: `main`.
- Base SHA: `6a117de590a61e4a716db43b93f17db54b5c665e`.
- Planned and actual branch: `fix/oge-board-sync-20261105`.
- Review level: `HIGH` because the second repair affects shared-board connection
  and client control state across trainers.
- Related ADR: [0001](../adr/0001-trainer-bridge-platform.md), **Proposed**;
  it does not authorize an architectural change.

## Goal

Keep the OGE task 11 function model identical for both board participants during
a reversing slider drag, and make the board truthfully stop reporting an active
shared session when the server rejects the room or its membership.

## Context and evidence

- A preceding audit checked published OGE tasks 11 and 15–19 with two board
  roles. Basic task, answer, hint, model and control-handoff flows worked.
  These observations are evidence about the existing release, not this patch.
- Relevant published assets matched main `a0b176e2bb659fe7385678c0199b2d0c47aaa9e3`.
  The subsequent base update contains teaching-material changes and leaves both
  affected runtime files and the existing native test file unchanged.
- `trainers/oge-native-10-14-board.js` coalesces repeated input operations.
  In task 11, moving a square-root function's horizontal shift from 0 to 4 and
  back to -4 retains the point at x=4. Dropping the intermediate shift instead
  replays x=0 and fails the existing strict draft/replay consistency check.
- `trainers/trainer-board.html` handles ordinary `room:error` messages without
  clearing connection, controller and bridge state. A room lost after a server
  restart can therefore show both an error and stale connected/control badges.
- The existing typed mirror protocol, validation, in-memory room lifecycle and
  control rules are established by code and tests. No new persistence or
  protocol behavior is proposed.

## Approved scope

### In scope

- Preserve path-dependent task 11 shift operations in the existing bounded log.
- Clear the terminally rejected room's shared connection/control/bridge state
  and prevent stale asynchronous callbacks from reviving that session.
- Keep recoverable action errors within the existing connected room.
- Add regression coverage to the existing native and board-writing suites.
- Record the task, relevant verification, independent review and rollback.

### Out of scope / areas that must not change

- Server persistence, authentication, protocol or state schema, room expiry,
  synchronization timeouts and registry retry policy.
- Mathematical generators, answer keys, teaching sequences and personal results.
- Learner records or cabinet plans; the preceding assignment task is complete.
- Unrelated content, existing assignments and other open PRs.
- Merge, auto-merge or deployment under this `START`.

## Acceptance criteria

- [ ] The deterministic task 11 root-shift reversal retains x=4 in both peers,
  a fresh peer and after control handoff, with identical graph/readout and no echo.
- [ ] Existing task 10–14 families, atomic rejection, assistance, event ordering
  and operation limits continue to pass.
- [ ] A terminal room error clears connected/control/bridge indicators and
  stale callbacks cannot resurrect the rejected session.
- [ ] A pupil cannot edit or emit shared state after terminal rejection;
  teacher local-board behavior and drawings remain available as appropriate.
- [ ] Recoverable room action errors do not disconnect a valid session.
- [ ] Existing board writing, handoff, registry and reconnect gates pass.
- [ ] Independent technical review is complete and the result is a Draft PR.

## Checks and gates

- Required native checks: complete `oge-native-10-14-board.test.cjs` and
  `oge-native-10-14-event-order.test.cjs`, including the new reversal regression.
- Required common-board checks: `board-writing.browser.cjs`,
  `board-room-error.test.cjs`, `board-picker-smoke.cjs`, registry cutover
  `arrival`, `reconnect`, `fail-closed` and `live` smoke sections, board
  ink/images and server/bridge tests.
- Required native browser check: `oge-course-native-events.browser.cjs`,
  including trusted pointer input that reverses the task 11 slider before
  release and compares the peer's point, graph and readout without an echo.
- Required requested-trainer regression: existing task 15, geometry 16–18,
  task 19 and transport tests.
- Static checks: syntax of changed scripts and `git diff --check`.
- Browser tests use local services and synthetic participants. Production
  behavior of this unpublished patch must not be claimed from those tests.
- Final gate marker: record actual local and CI outcomes in the PR handoff;
  an unchecked item is not an approval marker.
- Checks intentionally not run: production acceptance of the new patch before
  separately authorized publication; external provider review unless requested.

## Review plan

- Independent technical review of the actual diff, focused on replay validity,
  operation limits, permission state, terminal versus recoverable errors,
  asynchronous callbacks and reconnection.
- Trainer design consultation: not applicable; the learning interactions and
  mathematics remain unchanged. No design consultation was performed.
- Ready-result review: deterministic replay and real-browser regression, with
  existing mathematical/transport suites. No new real-learner trial is claimed.
- External provider review: not required and not requested. An independent
  local reviewer is distinct from an external-provider approval.
- Sanitized handoff: public code and synthetic evidence only; exclude pupil
  identifiers, credentials, private documents and machine-specific paths.
- Any external verdict would require provider, PR, base, head, verdict and
  verifiable timestamp/source under the review policy.

## Risk and rollback

- Preserving shift inputs consumes the existing 320-operation budget faster
  during long drags. Retain the cap, visible limit message and next-task reset.
- Terminal-error cleanup affects all trainers. Test recoverable errors and
  stale callbacks so ordinary collaboration is not disrupted. A replacement
  room may reuse only compatible handshake metadata from the same hydrated
  iframe; queued and latest snapshots from the rejected room are discarded.
- Rollback: revert this task's runtime changes by a normal follow-up PR; no
  migration, data conversion or server/configuration rollback is needed.
- Compatibility: retain protocol version 1, state schema 1, typed operations,
  strict validation and the existing personal-work isolation.

## Permissions

- Current owner `START`: **yes**.
- Branch creation, local commits, push and Draft PR: **yes**.
- Merge, auto-merge and deployment: **no**. The explicit repository rules
  supplied by the owner for this conversation require separate authorization;
  this is the narrower instruction relative to the committed standing policy.
- No force operations, reset, rebase, non-fast-forward merge, admin override,
  disabled TLS verification or weakened gates are authorized.

## Execution record

- Actual base: `6a117de590a61e4a716db43b93f17db54b5c665e`.
- Actual head, PR, commit identity and final CI outcomes are recorded in the
  Draft PR handoff; this specification does not claim an unpublished patch is
  live or replace a later owner merge authorization.
- Task 11 regression on the unchanged base runtime: expected failure with
  `draft and native operations disagree`. With the repair, the complete native
  task 10–14 and event-order suites pass **39/39** (Node 24.22.1, JSDOM 26.1.0).
- Requested geometry, model, transport, cabinet-card preservation, board
  ink/images and server registry suites: **105/105** pass. A separate existing
  board-UI/endpoint/ink/image run passes **30/30**; it overlaps the preceding
  set and is not an additional 30 distinct cases.
- Terminal-room DOM regression: **21/21** pass, independently rerun by the
  reviewer. The harness executes the complete production page and local board
  scripts; only rendering, transport and the child-frame protocol are fixtures.
  It covers all three terminal errors, teacher/pupil roles, recoverable denial,
  retained work, stale events, compatible current-frame recovery, incompatible
  metadata, new-frame ordering, both ordinary reconnect orders and preservation
  of invalid-state feedback. The initial 19-case suite rejected the unchanged
  base runtime in 17 cases; this baseline check used the base HTML in memory.
- Syntax and whitespace checks pass for the completed runtime, native tests,
  DOM regression and browser edits.
- Local real-browser execution is unavailable: the pinned Playwright Chromium
  and headless-shell downloads both returned invalid archives. TLS and test
  gates were not weakened. Existing CI browser jobs, plus the added room-error
  and registry-arrival/reconnect cases, must provide that execution evidence.
- Independent source review identified and resolved recovery races involving a
  new iframe ready event, a changed bridge instance and registry-first normal
  reconnection. No open findings remain in the reviewed code/tests; final
  identity verification is bound to the actual commit/tree in the PR.
- Scope deviations: none. No mathematical content, server, protocol, timeouts,
  personal work, merge or deployment changed.

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

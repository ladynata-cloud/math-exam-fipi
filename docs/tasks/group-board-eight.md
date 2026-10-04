# Group board: up to eight independent learners

## Identity

- Task: `group-board-eight`.
- Owner: Наталья Михайловна.
- Date: 2026-10-05.
- Base branch: `main`.
- Base SHA: `63c81e1425304b4ced24a2308385344d523409b1`.
- Planned and actual branch: `feature/group-board-eight`.
- Review level: `NEW_ARCHETYPE`, with all applicable `HIGH` requirements for
  access control, server contracts and persistence.
- Related ADR: [0009-group-lessons](../adr/0009-group-lessons.md).
- ADR status: **Proposed**, not accepted by this implementation record.

## Goal

Let a teacher run one lesson with 1–8 learners, observe four independent works
at a time, open any work to help, and revisit the recorded sequence of trainer
actions and handwritten strokes. Let each learner keep their own work open
beside the teacher's explicitly shared explanation, including a selected
learner's current solution.

## Context and evidence

The owner initially requested a concept, then explicitly requested
implementation of the group board in the current conversation. That later
instruction authorizes this scoped implementation; the initial concept-only
request is not treated as implementation permission on its own.

The owner's subsequent steering explicitly requests two learner views: their
own task and the work being explained to the group. It authorizes showing a
selected learner's current workspace during that explanation. This scoped
sharing does not authorize access to other private workspaces or their history.

The existing individual board and Trainer Bridge remain separate. Two existing
bridged trainers provide the pilot evidence: negative numbers on a line and
stepwise linear inequalities. Support for these two trainers does not establish
support for the full trainer catalogue. Current behavior is established by
code and gates; ADR 0009 remains advisory pending acceptance.

## Approved scope

### In scope

- Add `/trainers/group-board.html`, its controller, styles and frame adapter.
- Create a lesson with 1–8 named seats and separate teacher/student bearer
  links. Learners may access their own workspace and the common workspace.
- Display up to four live previews with `1–4` / `5–8` tabs, independent trainer
  or handwriting previews, and a larger selected workspace.
- Give everyone a cloned initial task or assign one learner independently.
  Subsequent answers, steps and drawings remain independent.
- Allow teacher takeover and explicit return of trainer control, concurrent
  handwriting with author identity, green teacher ink by default, own-stroke
  erasure/undo, and requests for help.
- Provide a teacher-controlled common workspace that learners can view.
- Add an explicit "Объяснять группе" mode for the selected common or learner
  workspace. While this mode is active, teacher focus changes retarget the
  explanation; returning to overview or entering history stops it.
- Give learners their own work and a read-only explanation pane on desktop,
  small-screen tabs, and an expanded explanation view. Switching these views
  preserves their own task. Viewers gain no writing rights to a peer's work;
  its owner and the teacher retain concurrent handwriting and the existing
  trainer-control handoff.
- Persist the teacher-only `present` action and expose only the currently
  shared workspace in `presentation` snapshots, without peer invitations,
  private histories or access to the remaining learner workspaces.
- Add durable group lesson storage and its isolated HTTP API, partial polling,
  idempotent actions, version checks, `events-v1` history, replay and JSON export.
- Add targeted backend tests and a real-browser gate for eight isolated learner
  contexts and relevant legacy regressions.

### Out of scope

- Video/audio recording, automatic assessment of handwritten mathematics,
  attention detection, or a complete learner analytics system.
- Universal trainer compatibility, arbitrary iframe mirroring, family adapters,
  or an observation-only fallback for unsupported trainers. These are deferred
  directions, not implemented capabilities.
- Accounts, enrollment/billing, token rotation, export import, multi-process
  storage, production configuration changes, deployment, or merging.
- Forced replacement of learners' own tasks, sharing a peer's private history,
  or opening all peer workspaces to learners outside the explicit explanation.

### Files or areas that must not change

Preserve existing room/token/storage formats, course data and unrelated trainer
behavior. Do not modify global repository policy, hosting configuration,
secrets, or unrelated courses. Pilot trainer changes must preserve standalone
use and isolate group-session state from standalone browser statistics.

## Acceptance criteria

The initial pilot passed the checks marked below. The later two-view explanation
extension passed the backend and extended browser gates, including delayed-acknowledgement tab switching.
Execution evidence below distinguishes the initial results from that rerun;
release prerequisites remain open.

- [x] Eight isolated learners retain independent assignments and state; each
  learner is denied other private workspaces and their histories. The explicit
  presentation snapshot is the sole scoped exception for a peer's current work.
- [x] Four previews, both sheet tabs, focus/back, help requests and common-board
  viewing work in the real browser.
- [x] A group assignment starts from the same captured task; assigning one
  learner does not alter other workspaces.
- [x] Trainer takeover/return and simultaneous authored strokes preserve
  state; stale writes and repeated requests do not overwrite newer work.
- [x] History reconstructs trainer and handwriting state across assignments;
  paged history uses a fixed revision while live work continues.
- [x] A server restart restores confirmed work and access. Storage failure and
  limits do not acknowledge uncommitted mutations.
- [x] Lost acknowledgements, history rate-limit retries and export pass. The
  existing board-picker gate and 41 legacy backend tests pass. A separate legacy
  browser-gate failure is documented below; it also fails on the untouched base.
- [x] Independent re-review is complete; no confirmed blocking finding remains
  in the initial scoped implementation.
- [x] Extended browser gate verifies two learner views, start/retarget/stop of
  presentation, own-task preservation, read-only peer viewing, shared authored
  strokes and mobile/expanded navigation. Record review of the new boundary.
- [ ] External review or explicit owner waiver with rationale, ADR acceptance
  and separate release authorization remain required before rollout.

## Checks and gates

- Backend: `cd board-server && npm test` (`node --test test/*.test.js`).
- Browser: `node tools/group-board.browser.cjs`; dependencies and optional
  browser/artifact environment variables are documented in
  [the operational guide](../group-board.md).
- Static: relevant JavaScript syntax checks and `git diff --check`.
- Visual/manual: four-card overview, focus, invitations, mobile layout,
  connection/save indicators, history controls and the two-view learner layout.
- Browser success marker: `GROUP_BOARD_BROWSER_OK`. It is evidence only when
  produced by the completed command on the reviewed code.
- Group pilot and two-view presentation gate: **PASS**. This is not a claim
  that every legacy browser gate passes or that production rollout is approved.
- Production checks: intentionally not run; rollout is not authorized here.

## Review plan

The new lesson protocol, bearer authorization boundary and persistent journal
require `HIGH` review; the group-workspace pattern additionally requires
`NEW_ARCHETYPE` acceptance before rollout. Independent review found defects
that were corrected and re-reviewed; the browser gate verifies the resulting
retry, history and trainer behavior. The later presentation boundary requires
review of its own final changes. This internal review is not external-review provenance.

External review has **not been performed or claimed**. Under
[REVIEW_POLICY.md](../REVIEW_POLICY.md), obtain external review or an explicit
owner waiver with rationale before rollout. Any external handoff must omit
secrets, actual access links, private learner data and machine-specific paths.
Valid provenance must identify provider, PR, base SHA, reviewed head SHA,
verdict, and a verifiable source or timestamp. No approval marker in this task
substitutes for that evidence.

## Risk and rollback

- Main risks: bearer-link disclosure, disk loss or exhaustion, interrupted
  requests, stale edits, accidentally continuing a group explanation while
  switching to another learner, and incorrect claims of compatibility or
  persistence. A visible presentation status identifies the work being shared.
- The store requires an explicitly configured persistent directory, one owning
  process and private backups. It contains student access tokens; do not copy
  its raw files into logs, issues, test artifacts or review bundles.
- Rollback: disable group capability by unsetting `GROUP_LESSON_STORE_DIR` and
  restarting the service; hide any group entry point if added at rollout. Keep
  the journal directory and backups intact. The existing board remains a
  separate route. If a code rollback is needed, revert the scoped change without
  deleting or downgrading stored journals.
- No migration of legacy rooms is required. JSON export is a reviewable lesson
  record, not a replacement for a restorable backend backup.

## Permissions

- `START`: yes, by the owner's later implementation instruction in this task.
- Branch creation, local implementation/commits, push and one Draft PR: allowed.
- Merge, auto-merge and deployment: **not authorized by this task**.
- Explicit archetype acceptance is still required before rollout; do not change
  ADR status to Accepted without that decision.

## Execution record

- Actual branch: `feature/group-board-eight`.
- Actual base SHA: `63c81e1425304b4ced24a2308385344d523409b1`.
- Initial local pilot commit: `537246c`. The final head and Draft PR for the
  tested tree, including the presentation extension, are recorded in the PR
  body. Connector publication must preserve the complete tested Git tree.
- Current backend tests: **58/58** (17 group tests and 41 legacy tests), as
  reported by the coordinating executor after the presentation extension.
- Initial pilot checks passed: `GROUP_BOARD_BROWSER_OK` with eight isolated
  learners plus teacher; `BOARD_PICKER_UX_OK`; JavaScript syntax, document links,
  whitespace and visual desktop/mobile checks.
- Browser evidence includes a lost acknowledgement with five queued descendant
  edits, 105 history events across pages plus injected HTTP 429, frozen-revision
  export, visible history rewind/return, private/common state, authored strokes,
  restart, mirrored hint expiry and preserved standalone-statistics sentinels.
- Extended presentation browser gate: **PASS**, including explicit peer
  sharing, denied peer writes/history, two desktop windows, mobile tabs,
  following the selected workspace and clearing compact/expanded views on
  stop. A delayed-acknowledgement tab roundtrip preserves input and allows
  continued editing. Independent re-review found no remaining blocker.
- Legacy browser gate failure: `tools/trainer-registry-client-cutover-smoke.cjs`
  times out at `arrivalAndFailClosed`, line 546, clicking
  `#retryTrainerRegistry` inside the closed `#trainerPanel` dialog. The identical
  failure was reproduced with `B2_SMOKE_SECTION=fail-closed` on a clean detached
  checkout of exact base `63c81e1425304b4ced24a2308385344d523409b1`; its tracked
  files were unchanged. No test was changed or weakened. The all-sections run
  does not establish later legacy sections as passed.
- Not run: external review; production deployment/live smoke; a real-student
  pilot; non-Chromium device/browser coverage.
- Scope deviations: none; the two-trainer pilot does not implement universal
  observation or bidirectional mirroring.

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

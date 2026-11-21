# Profile logarithms and trigonometry on the shared board

## Identity

- Task: connect the existing selected profile logarithm and beginner trigonometry lessons to a shared teacher/pupil board.
- Owner: MathExam owner.
- Date: 2026-11-06 (UTC).
- Base branch: `main`.
- Initial verified base SHA: `a2ada6761126f122dcc1faeefe140a4042b56630`.
- Current task base SHA: `6c64ac63e6bad70993ec50995d3a39976b1b0a36` (fast-forward before the first task commit; concurrent PR #473 has no overlapping changed files).
- Planned/actual branch: `codex/profile-log-trig-board-20261106`.
- Review level: `HIGH` (shared session state, control ownership, local-progress isolation, cabinet entry).
- Architecture: reuse the implemented registry/bridge/room contract. ADR 0001 remains Proposed.

## Goal

The teacher and pupil can open the same selected logarithm or beginner trigonometry lesson from the profile cabinet and solve it together. Both participants see the selected task, current step, answer, feedback, hints and mathematical model. Control transfer and joining/rejoining an active room restore the same shared state without crediting collaborative work as the pupil's independent progress.

## Context and evidence

- The initial base includes receipt-provenance release #470. Before the first task commit, main advanced through the independently merged logarithm introduction #473; the task branch fast-forwarded to that exact commit without history rewriting or changes to the concurrent work.
- Four selected START lessons already have registered expression/equation wrappers. The fixed wrapper boundary does not include `fn-explog`, `trig-angle`, `trig-coordinates`, `trig-special` or `trig-tangent`.
- The published Circle course has no bridge/session adapter. A generic iframe link does not mirror its state.
- Existing profile cabinet navigation opens public lessons, while existing Merzlyak/College wrappers demonstrate the room entry mechanism.
- The course content, mathematical answers and pupil's individual learning history remain the source of truth. No new mathematical generator or board protocol is introduced.

## Approved scope

### In scope

- A registered START wrapper for the three logarithm lessons and six selected trigonometry lessons, with the missing model state contracts.
- A registered Circle wrapper and strictly validated shared state for the existing beginner course, including the selected six introductory/application lessons and the optional simple-equations lesson.
- Cabinet and teacher-card entry to the selected lesson/task on the shared board, preserving the selection when creating a room.
- Registry/picker integration through existing shared APIs; targeted fixes only if the real transport demonstrates they are necessary for this scope.
- Unit, mathematical regression, cabinet and real two-browser transport checks, including late join, reconnect, control transfer and independent-progress isolation.
- One task specification, one branch and one Draft PR.

### Out of scope / preserved areas

- New course content, automatic individual grades from collaborative work, database migration, credentials, student records, unrelated courses, deployment infrastructure changes and server protocol redesign.
- No real pupil answers are entered or rewritten as test data. Use synthetic teacher/pupil participants for acceptance.

## Acceptance criteria

- [x] Teacher-card and pupil-profile entries open the intended registered material.
- [x] All 9 selected START lessons and 6 selected Circle lessons can be solved collaboratively; the Circle simple-equations extension can also open correctly.
- [x] Lesson/task/mode, drafts, checked answers, feedback, steps and assistance remain identical across two participants.
- [x] Circle angle/point and START graph/model controls mirror in both directions after control transfer.
- [x] Late join, reload and reconnect to an active room restore the selected task and current state.
- [x] Invalid, excessive, unrelated and forged states are rejected; non-controller input cannot alter the shared state.
- [x] Individual progress is unchanged by shared-board actions; standalone learning continues to work.
- [x] Existing expression/equation, Merzlyak and College room entry regressions pass.

## Checks and gates

- Required tests: new session/model/cabinet contracts; selected mathematics regressions; existing profile board, registry and room-selection checks; real isolated teacher/student browsers against the local server.
- Static checks: `git diff --check`, syntax, canonical wrapper paths, registry consistency and sanitized diff.
- Manual review: responsive course/cabinet entry and visible shared state at representative logarithm, circle and graph tasks.
- Final gate marker: `PROFILE_LOG_TRIG_BOARD_GATE=PASS` only after all required checks pass.
- Deployment/live-user verification: not run before separately authorized merge/publication.

## Review plan

- Independent technical review of state validation, control ownership, link/route boundaries, progress isolation and test evidence.
- Learning design is preserved: existing tasks, explanations and help order. No new learning archetype is claimed.
- External provider review not performed; the owner did not request it. Local independent review and applicable technical gates remain required.
- Handoffs contain only public source/diff and synthetic fixtures, never student identifiers, account credentials, private URLs or local machine paths.

## Risk and rollback

- Main risks: dropped/incomplete model state, feedback loops, wrong selected task on room creation and contamination of personal progress.
- Mitigation: fixed lesson allowlists, bounded validated snapshots, control ownership in existing transport, in-memory board progress and two-role regression checks.
- Rollback: revert this task's reviewed commit using the normal PR workflow; no data migration or pupil record changes to reverse.

## Permissions

- Owner explicitly granted START in the current conversation for connecting the existing logarithm/trigonometry route and checking teacher/pupil collaboration.
- Branch, scoped implementation, tests, local commits, push and Draft PR: yes.
- Merge, auto-merge and deployment: no under the repository rules explicitly supplied by the owner in this conversation; stop after the concrete tested Draft PR for separate owner authorization. This task-specific boundary takes precedence over the broader committed standing policy.
- Force operations, reset, rebase, admin override, weakened gates and disabled TLS: no.

## Execution record

- Base verified against authoritative GitHub main and `git ls-remote`; fresh checkout clean before branch creation.
- Both registered adapters and the sixteen cabinet/picker lesson entries are implemented. Existing mathematical task content is reused.
- New/course mathematics gate: 72 tests pass. Existing profile wrappers, Merzlyak/College cabinet/room selection, terminal-room recovery, authoritative registry and live server gate: 153 tests pass. Exact commands live in `.github/workflows/profile-log-trig-board.yml`.
- Actual isolated teacher/pupil transport: `PROFILE_LOG_TRIG_BOARD_BROWSER_OK`. All 9 START and 7 Circle lessons reach a result through the real controls. Checks include task 2 plus draft after an 11-second pre-room delay, both control directions, graph/circle models, reloads, late join, reconnects, valid non-controller replay rejected by the authoritative server, no idle echo and unchanged personal storage.
- Cabinet browser: `PROFILE_LOG_TRIG_CABINET_BROWSER=PASS`, 8 journeys and 16 screenshots at 320/1280 widths, both roles and assigned/unassigned profile programs. Exact selected task and cabinet return survive; no data writes or production requests occur.
- Existing Merzlyak shared-room browser regression: `MERZLYAK_BOARD_BROWSER_OK`, including selection, draft/feedback/help, camera, ownership, both-role reload, late join, isolation and 320px layout.
- Existing standalone Circle: `MORD_CIRCLE_SMOKE_OK`, keyboard, responsive layout, zoom, persistence and corrupt-save preservation. The complete 295-task browser traversal was not needed for unchanged content; its existing mathematical checks pass.
- Browser environment: the standard desktop Chromium launch lacked a permitted local socket and the standard browser archive download failed. A pinned npm-distributed headless Chromium 153 ran inside the original sandbox with the existing minimal launch arguments. No OS permissions, web-security flags or site isolation controls were weakened. CI uses its normal pinned Playwright browser.
- Independent technical reviews covered cabinet links/privacy, both adapters and model contracts, failure isolation and the room-initialization boundary. Resolved findings: exact ODZ radio symbols, wrapper dependency-load isolation, graph-disclosure identity and selected-task loss during initial room creation. No external provider review was claimed.
- The scoped host correction prepares a detached, strictly validated snapshot only from the two exact same-origin wrappers. It is consumed once on the first authenticated writer join to the new empty room; authoritative existing room state always wins. Drafts never enter URLs or credential records.
- The first exact-head CI run found three issues and drove scoped corrections: the intentional Circle HTML change needed its canonical public-navigation payload binding refreshed; the room handler must await the registry only for the two selected wrappers, preserving either registry/room arrival order for unrelated trainers; and the browser acceptance must wait for the destination lesson/model render rather than only the earlier hash update. Existing room-recovery tests and three new ordering/capture regressions verify the host correction; no gate or assertion was weakened.
- The canonical navigation binding refresh changes only the Circle page hashes and their source-commit/task provenance. All 629 inventoried HTML files retain byte identity with the committed source; preservation 4/4, binding 5/5 and navigation regression 43/43 checks pass. The corrected full two-browser acceptance also passes, and the narrowed room wait received independent review with no remaining findings.
- Current base was fetched and verified before a fast-forward on the still-uncommitted task branch. The concurrent #473 introduction remains unchanged. Gates are rechecked on the composed base before handoff.
- Actual head and PR are recorded in the PR handoff; the committed task document does not create a self-referential commit identifier.
- Final gate and exact CI evidence are recorded against the final PR head. No merge, deployment or real-pupil production session was performed.
- Scope deviations: none. The narrow host and failure-isolation corrections are necessary to meet the approved acceptance criteria.

## Required handoff

`EXECUTIVE STATUS`: Task, PR, Base, Head, Gate, Tests, Failures, Not run, Scope deviations, Recommendation, Next user decision.

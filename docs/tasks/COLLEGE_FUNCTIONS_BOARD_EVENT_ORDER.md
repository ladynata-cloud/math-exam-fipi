# College board: publish state after the native event finishes

## Identity and goal

- Date: 2026-10-25.
- Base: `main`, `d73200d80f81334699d2e78d0fcc22f45d7d7f2c` (PR338).
- Branch: `fix/college-functions-event-order`.
- Review level: `SMALL`, an isolated scheduling correction in the existing
  college trainer adapter; no runtime boundary or teaching-sequence change.
- Goal: a participant's first input or action reaches the other participant
  immediately, without requiring a second action to publish the previous one.

## Verified finding

Live two-participant release QA reproduced a one-action delay after PR338.
The adapter observes events during capture and schedules a Promise microtask.
For native browser events, a microtask checkpoint can occur before the target
or later application listener updates the trainer state. The adapter can thus
publish the old snapshot; the next event publishes the preceding action.

The seven previous adapter/transport tests passed but did not exercise this
ordering. Script-driven `dispatchEvent` keeps the caller's JavaScript stack
active and does not by itself reproduce the native-event checkpoint. Those
passes remain evidence for their tested behavior, not proof of native input
synchronization. Deployment identity is separately verified: the public assets
match PR338 and the backend loads the expected 26-entry registry.

## Authorized scope

Schedule the adapter's coalesced notification with a zero-delay timer so it
reads state after the complete event dispatch. Retain remote-apply suppression,
state validation and duplicate-snapshot suppression. Bump only the adapter
asset reference and add a regression that explicitly separates capture,
microtask checkpoint and application-state update.

Files: `trainers/college-functions/board.js`, its reference in `index.html`,
`board-event-order.test.cjs`, this task document and the project-status entry.
Shared SDK/protocol, authentication, registry, server code, persistence,
mathematics, personal progress and learner records are outside this fix.
No pupil identity, room token or private screenshot belongs in this repository.

## Acceptance and checks

- A microtask checkpoint between capture and the application handler must not
  publish stale state. The following timer publishes the updated state once.
- Ordinary input, selection and step actions remain synchronized; remote apply
  does not echo, and unchanged snapshots produce no notification.
- Existing standalone, adapter, transport, registry and cabinet gates pass.
- A real browser preview and deployed two-participant check confirm that one
  input/action updates its peer without another click or keystroke, including
  after control handoff. Synthetic DOM tests alone cannot close this gate.
- Run JavaScript syntax checks and `git diff --check`; preserve exact-head CI
  and deployed-byte evidence in the follow-up PR.

Focused independent review is required for scheduling, coalescing and echo
suppression. External Claude review is optional for this SMALL correction;
no new trainer design consultation or external verdict is claimed.

## Risk, rollback and permissions

The small timer delay may combine several changes into one settled snapshot.
Review must ensure pending notifications still release and remote hydration
cannot cause an echo. No storage migration or protocol-version change occurs.
Rollback is a normal revert of this scoped adapter/cache-reference patch;
it restores the known one-action delay and must not be reported as a working
live synchronization result. Existing saved work remains intact.

This is a release-blocking correction within the owner's current request to
synchronize and publish the trainer. The release owner handles the branch,
reviewed publication and live verification under that authorization. This
document does not create authorization, permit force operations, waive gates
or authorize changes to accounts or other learners.

## Execution record

The isolated worktree starts at the stated PR338 merge. The focused event-order
suite passes 3/3 with the timer fix; running it against the original adapter
fails the first-action and intermediate-snapshot checks (2/3 fail). The pending
remote-apply no-echo check passes both versions. All seven existing board tests
pass, including bidirectional stages, diagnostics, hydration and isolation.
Independent internal review passed; no external verdict is claimed.

The actual cloud-browser preview used two trainer frames and the real SDK.
One native input/click advanced the peer to step 2 with correct feedback;
hints, all four table points and the curve reached the peer at step 4.
Control handoff and a range answer reached step 5, with zero observer
publications. This closes the preview event-order check, not the production
release check. Exact-head CI and deployed two-participant verification remain
pending. Do not claim `COLLEGE_FUNCTIONS_BOARD_CABINET_OK` until the release
owner completes that verification.

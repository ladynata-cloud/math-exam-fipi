# BOARD_FLEET_ACCEPTANCE_20261125

- Base: `main` / `f8468b19b8e1f84f5009d429001c4b295898c8b0`
- Branch: `work/board-fleet-acceptance-20261125`
- Review: MEDIUM (test and release infrastructure only; no runtime data/protocol changes).
- Scope: owner requested continuation and a substantial block of board reliability work.

## Goal

Establish an independently repeatable fleet-wide acceptance audit of every registered
mirror. A green manifest is necessary but not enough: the real teacher and pupil
must load the actual adapter, agree on state, exchange ownership and recover state
on reload. This adds an independent CI workflow rather than duplicating #752 or
#753. #754 remains the manifest-evolution guard.

## Coverage

For each selected mirror: boot the full static site and locked board server on
loopback; verify registry projection; open its exact registered route; create a
temporary teacher room and isolated pupil context; observe SDK state; verify the
pupil initially cannot write; hand over control, request the pupil's real SDK
snapshot and compare it with the accepted teacher state; reload the pupil and
compare the actual adapter state again; return ownership. Check SDK diagnostics
and uncaught page errors. No injected state, real pupils, production rooms,
persistent stores, external model calls or authentication credentials.

Six independent deterministic shards. A manual dispatch or shared board/registry
implementation change runs the entire current mirror manifest. Ordinary PRs
select added/changed mirror authorizations and directly related trainer files;
an empty selection runs the planner and reports zero. Cross-tree course
dependencies are not exhaustively inferred; retain trainer-specific CI and use
the full scan for release candidates as appropriate. This is a common transport
and state-retention test, not a proof of mathematical correctness or all
possible interactions. A historical adapter may legitimately expose a failing
case; preserve the evidence and repair that adapter or record a separately
reviewed contract, never silently skip failures to obtain green CI.

Reports: per-shard JSON and job summary contain trainer ID, path, PASS/FAIL,
phase, duration, state byte size and sanitized diagnostics. No snapshots,
tokens, invitation URLs or external request payloads are written to artifacts.
Browser HTTP and WebSocket traffic is restricted to temporary loopback hosts.
The final aggregator verifies the exact merge candidate identity and compares
planned versus observed trainer IDs across all six reports. Missing, stale,
duplicate, truncated or failed shards cannot produce a green aggregate. No new runtime
dependencies; Chromium is pinned in CI.

## Gate / rollback

Run `node --test tools/board-fleet-plan.test.cjs` then
`node tools/board-fleet-audit.cjs --all --index 0 --total 6` with Playwright
and the server dependencies installed. All six shards together cover the entire
manifest exactly once. CI failure is not converted to success. No claim of full
coverage until the actual artifact reports are inspected. No live deployment
or external model review in this task. Rollback is revert of this test-only PR.
Release follows the [standing owner policy](../OWNER_RELEASE_AUTHORIZATION.md)
and applicable CI. No branch protection changes.

## Execution

Initial pure planner probes checked independently in the available JS runtime.
Full Chromium/Node checkout execution is delegated to GitHub CI; its outcome
is pending at initial commit. The existing #752/#753 branches are not altered
by this independent PR.

## First full audit: 2026-11-25

Run 45477384515 covered all 74 mirrors; 10 harness unit tests passed, but the
browser aggregate was 0/74. This is not evidence that all 74 trainers are
broken: the test incorrectly expected the pupil to retain control after the
last pupil connection closes, contrary to the server's explicit disconnect
policy. Correct the test to wait for control return, reconnect as a read-only
pupil, then hand over control again and verify the actual adapter snapshot.
Also sample the initial SDK snapshot atomically with the host-accepted state
instead of demanding an unnecessary second message after hydration. These
changes preserve the state equality checks and add sanitized phase diagnostics.
The remaining failures, if any, require individual investigation; a new full
CI run is required before making a fleet-wide claim.

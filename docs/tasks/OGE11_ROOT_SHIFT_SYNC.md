# OGE11 root-shift synchronization and six-trainer verification

## Identity and approved scope

- Date: 2026-11-05.
- Base: main, `6a117de590a61e4a716db43b93f17db54b5c665e`.
- Branch: `fix/oge11-root-shift-sync-20261105`.
- Review level: MEDIUM, a bounded event-history correction within the existing adapter.
- Owner request: verify the existing learner's six OGE practice links (11, 15–19), preserve existing work, exercise isolated sessions and fix technical defects. Explicit action request authorizes this work; publication follows `docs/OWNER_RELEASE_AUTHORIZATION.md`.

## Evidence and implementation

Reversing the root-function horizontal-shift slider during one drag can clamp the independently movable x point and then retain it. Coalescing those input events drops the earlier clamp; native replay rejects the resulting snapshot with `draft and native operations disagree`.

Preserve intermediate operations for the OGE11 help shift slider only. Keep the existing bounded state contract, atomic validation, personal-progress isolation and all other coalescing behavior. Add a regression comparing exact SVG, coordinates, controls, no-echo restoration, late joining and controller handoff.

## Acceptance and checks

- Reproduce the defect on the current base; make the regression pass.
- Run full native 10–14 state/event-order tests, geometry state and real local transport tests, whole-course transport and native browser checks.
- Run applicable registry, UI, math, syntax and diff checks and required CI.
- Confirm the six saved plan links and their opening through the read-only learner preview. Do not copy private account IDs, access URLs or learner data to this repository.
- Verify a safe live room when network access permits; distinguish local transport tests from live verification.
- Gate: `OGE11_ROOT_SHIFT_SYNC_OK` after required checks. Missing production checks must remain explicit.

## Risk and rollback

Intermediate slider input consumes the existing 320-operation budget faster. The limit and next-task recovery remain unchanged. No protocol, schema, account, credential, assignment or progress migration. Rollback is a scoped revert of this fix and regression through the normal deployment; never restore a database backup.

## Review

Focused self-review and targeted regression required. No new mathematical model or learning sequence. External provider review not performed under the standing owner policy.

# Peterson 6 part 1: cabinet course link and shared board

## Identity and scope

- Date: 2026-10-24 (Asia/Novosibirsk).
- Base: `main`, `07189de58b7f5d60c02ea6ca6aa9450a324a377f`.
  Initial implementation used `1f9d8aec82bd2909917ab22746d94571d87c59c4`;
  concurrently published PRs #318, #315 and #319 are preserved through normal
  merges, including their course entries, V6 profile schema and learning decoders.
- Branch: `feat/peterson6-board-sync`.
- Review level: MEDIUM, bounded integration using the existing board protocol.
- The owner requests the published Peterson course in an existing learner's
  cabinet, synchronized with the teacher's interactive board, entirely in the
  cloud. This request authorizes implementation, assignment and publication.
  No learner identifiers, credentials or production session data belong here.
- ADR 0001 remains Proposed. Existing SDK/registry code and its tests establish
  the implemented protocol; this task introduces no new protocol.

## Result

The original course opens a registered board wrapper. Teacher and observers see
the same task, drafts, completed steps, hints, notebook, model and practice
detour/return. The wrapper uses isolated memory, never the learner's personal
course storage. Shared work does not earn independent personal credit.

The existing cloud teaching plan can link the course as a separate reference
card. Learners open the course or computation practice; the teacher additionally
opens a shared board and gives the lesson's existing join link. No unsupported
managed-attempt entry or fictitious completion is created.

## In scope

- Thin wrapper, strict compact snapshot validation and semantic model restore.
- Registered mirror entry, exact course aliases and board picker entry.
- Canonical course board link and bounded board-only input/session behavior.
- Allowlisted course cards in the existing plan UI, preserving previous work.
- Assignment through the teacher's signed-in interface to the existing learner.
- Focused unit/DOM tests, real synthetic board browser CI and public deployment
  verification, including Amvera's registry and cabinet assets.

## Exclusions and preserved contracts

No authored lesson/task/mathematics changes, no login or password changes, no
server/SDK/authentication/persistence contract changes, no automatic personal
progress synchronization claim, no unrelated learner records or notifications.
Existing courses and recommendations remain intact.

## Acceptance and gates

- All 14 topics and 20 skills at three levels restore correctly.
- Exact answers/formats and completed steps retain existing validation.
- Malformed, oversized, cross-course and prototype-bearing states are rejected
  before DOM or memory mutation; invalid local changes restore the last valid
  shared state visibly rather than silently dropping history.
- Teacher/observer draft, feedback, model, navigation and detour equality;
  handoff, reload, late join and no repeated broadcast.
- Personal storage is not read or written in shared mode. Standalone course
  behavior and saved progress pass regression checks.
- Cabinet course cards use fixed safe URLs and correct role-dependent actions.
- Syntax, reproducible content build, existing mathematics/state/model/DOM
  checks, new adapter/model/picker/cabinet tests and synthetic browser gate.
- Final gate: `PETERSON6_BOARD_SYNC_OK`, only after verified cloud publication.

## Review and rollback

Independent code and targeted test review; no new learning sequence or trainer
archetype, so a paid trainer design consultation is not applicable. Record actual
results, initial failures and unavailable checks separately in the PR.

Main risks are divergent model closures, draft loss, accidentally importing
personal work and incorrect cabinet credit. Mitigations are semantic snapshots,
strict bounds, isolated memory and reference cards outside managed attempts.
Rollback is a normal scoped revert; do not delete personal course storage,
learner accounts, earlier teaching plans or other published courses. Preserve
the already-published V6 schema and decoder; do not deploy a pre-V6 server image.

## Execution

Implementation and validation results are recorded in the PR, including exact
head/base identity and post-merge Pages/Amvera evidence. Production learner
operations are verified privately through the authorized teacher interface.

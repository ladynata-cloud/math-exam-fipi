# Recover the selected Merzlyak task after a slow room connection

## Identity and goal

- Task: MERZLYAK_ROOM_RECOVERY_20261106; 2026-11-06.
- Owner: repository owner; continuation of the requested assigned-course shared lesson.
- Base branch: main; authorized base: `6ba2e40686d5e224841f2c6f9e1e74fb672cca6e`.
- Branch: `fix/merzlyak-room-recovery-20261106`.
- Review: HIGH, because document recovery crosses the existing shared-room and trainer handshake boundary.
- Related release: [PR #466](https://github.com/ladynata-cloud/math-exam-fipi/pull/466).
  ADR 0001 remains Proposed; current B1/B2 code and gates define the implemented contract.

Complete the requested selected-task lesson when the room connection takes longer
than the trainer's normal hydration deadline. Automatic recovery and the existing
Reload button must restart the document while preserving its selected lesson,
room seed and normal validated handshake.

## Context and evidence

PR #466 was published as the base commit above, tree
`8ade854c29870fa64a2a94b7a4ac8dc9074f76bd`. All 23 candidate workflows
passed. Production verification matched 27 public assets across Pages and Amvera;
the real existing assigned-course card displayed the new button. Assignments and
personal results remained intact.

The final production journey exposed an additional timing case: after selecting
task 2.19, room creation retained its fragment, but a slow connection let the new
seeded trainer's handshake expire. The room later connected while the mirror
remained pending and the iframe loading watchdog stayed red. The child document
was complete; the ordinary Reload button reproduced the same symptoms.

The host invalidated the expired bridge and assigned the identical fragment URL
to iframe.src. HTML can treat that as same-document navigation, keeping the old
expired bridge. The picker observed a src mutation but received no new load event.
The existing program-room gate covered an expired bridge before room creation,
but did not delay the room connection after the seeded document loaded. Existing
unit fixtures also treated every src assignment as a new document.

The first follow-up candidate passed the strengthened real Merzlyak journey,
including both expired bridges and manual reload, in
[run 42218674678](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/42218674678).
The unchanged 404-to-available picker regression failed in three other workflows:
the real document reload no longer mutated src, so the picker's old 404 inspection
remained cached in its visible state. Explicitly start its existing loading
transition when the Retry button clears the inspection cache, before navigation.

## Approved scope

- Use a real document reload for an accessible same-origin frame when the
  requested resource has the same pathname and query. Retain the live fragment,
  including a newer selection made since the iframe src was originally assigned.
- Keep ordinary navigation for a different resource/query, foreign origin,
  inaccessible/missing document or credential-bearing URL.
- Reset the picker's loading/inspection state explicitly on the real Retry
  action and bump only its script version in the host. The two runtime files are
  `trainers/trainer-board.html` and `trainers/board-picker.js`; catalogue data stays unchanged.
- Preserve existing invalidation, instance generation, hydration deadlines,
  registry authorization, exact-origin/source checks and room control semantics.
- Strengthen the existing room-error fixture to model fragment navigation and
  add automatic/manual recovery regressions, including unsafe-current-document cases.
- Extend the real nested cabinet/room browser gate by holding the Socket.IO
  client response until the seeded trainer's actual bridge deadline expires;
  require a fresh document, successful join, the same task, draft/handoff and
  manual reload, then retain all return and storage/privacy assertions.
- Reconcile the existing project-status section with the verified #466 release
  and this additional recovery finding in this same change.

No server, protocol/schema, course content, account, assignment, personal result,
deployment setting or gate timeout changes are in scope. Do not replace the iframe,
add cache-busting query parameters, weaken handshake checks or bypass an expired bridge.

## Acceptance and gates

- The unchanged base fails the new automatic and two manual fragment-document
  recovery assertions; all previous room-error assertions remain valid.
- Recovery creates exactly one fresh document and requires its new handshake.
- The live selected fragment and exact resource/query/seed are preserved.
- Different or unsafe current documents retain the ordinary destination navigation.
- The nested real-browser test covers both pre-room and post-seed expiration,
  teacher/pupil draft exchange, handoff, manual retry and exact cabinet return.
- Existing Merzlyak, registry, room-boundary, ink/image and server contract gates pass.
- The unchanged `tools/board-picker-smoke.cjs` 404-to-available retry gate passes;
  no assertion or timeout is removed or relaxed.
- Syntax and `git diff --check` pass.
- Final marker: `MERZLYAK_PROGRAM_ROOM_OK`, with delayed-room and manual-reload evidence.
- Local Chromium is unavailable because the runner rejects its process-singleton
  socket. Browser execution is therefore required in CI; no local browser pass is claimed.

## Review, risk and rollback

Independent technical review is required. No new trainer, mathematics or learning
sequence is introduced; external consultation was not performed. Handoffs contain
only public source and synthetic fixtures, never credentials, room invitations,
pupil identifiers or machine-specific paths.

The main risk is reloading a wrong or foreign document. Exact same-origin,
pathname/query and credential checks constrain the direct reload; other cases
retain the prior navigation. Existing room authorization and snapshot hydration
remain mandatory. Revert this narrow follow-up to restore #466; no database,
assignment or result rollback is needed.

## Permissions and release guard

The current owner request authorizes completing the selected-task flow and
publishing after successful checks. This recovery is necessary to complete that
same requested journey. The [standing policy](../OWNER_RELEASE_AUTHORIZATION.md)
covers scoped implementation and a follow-up PR, subject to the narrower direct
instructions in the current conversation.

The executing reviewer is authorized to create this separate local branch,
implementation, specification and regression candidate. Root coordinates any
push, Draft PR and publication; this reviewer must not push or merge independently.

Freeze base `6ba2e40686d5e224841f2c6f9e1e74fb672cca6e`. Immediately before
any follow-up merge, root must query authoritative remote main and candidate head.
If main moved beyond this base, stop before merge and follow the directly supplied
AGENTS guard: read-only composition, provenance and applicable gates, then obtain
new explicit authorization. This document does not waive that guard. No force,
reset, rebase, admin override or weakened checks are authorized.

## Execution record

- Base and branch verified; no unrelated local changes.
- Original-base regression: 22/25 passed, three new fragment-recovery failures.
- Candidate local gates: 402 server tests and 84 client/return tests passed
  (486 unique Node tests); 989-card schema/runtime and independent wrapper checks,
  JavaScript syntax and whitespace checks passed. Registry tests are included in
  the server count and are not counted twice.
- Candidate test results and exact head/tree belong in the release handoff and PR.
- Browser status remains not run locally. Initial follow-up CI supplied the real
  delayed-room/manual-retry proof but failed the existing cached-404 retry gate;
  the combined candidate requires fresh CI, including that unchanged regression.
- No real account, assignment, personal result or active room is modified by automated tests.

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

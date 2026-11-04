# Published OGE board acceptance

## Identity and authorized scope

- Task: finish published task 25, board drawing and reconnect acceptance.
- Date: 2026-11-03.
- Base: main at 75726635b86ded87f9bdce1e655ba75d137843b8.
- Branch: test/oge-published-board-20261103.
- Review level: SMALL; tests only, no runtime or deployment contract changes.
- START: direct owner request to perform the remaining checks; synthetic answers only.
- Publication: [standing owner policy](../OWNER_RELEASE_AUTHORIZATION.md).

## Goal and verified context

PR340 is merged at the base above. The teacher cabinet and nine canonical OGE
practice links have already been inspected. The owner requests completion of
the remaining live checks. Existing local-browser writing and course adapter
tests cover component behavior; they do not replace a new published-room test.
PROJECT_STATUS's preparation paragraph is historical: GitHub confirms the merge
and the public-readiness rerun on 2026-11-03 passed.

The connected owner browser and local execution environment became unavailable.
This task uses an isolated Chromium on GitHub Actions, the existing published
board UI and a newly created anonymous room. No teacher or pupil account is used.

## In scope

- Byte-check eleven relevant published runtime assets against checkout.
- Task 25: all sixteen type conditions and diagrams, synthetic answer feedback,
  hints, sequential steps, proof notes and figure enlargement.
- Teacher/student handwriting and seven drawing tools, observing permissions,
  control handoff, automatic reconnection after a simulated transport loss,
  exact drawing restoration after both reloads and a late join.
- A sanitized JSON result with separate PASS/FAIL and phase information.
- A manual workflow with explicit synthetic-room opt-in and a bounded task-branch
  push trigger for this execution. No schedule.

## Excluded and protected

No existing room, cabinet login, pupil progress, assignments, account credentials,
product runtime, server configuration, trainer mathematics or archive adapters
may change. The workflow has read-only repository permission and no secrets.
No screenshots, session storage, room links or tokens enter artifacts.
The fresh anonymous room follows the server's existing expiration policy.

## Acceptance and gates

- The live script must report OGE_PUBLISHED_BOARD_ACCEPTANCE with status PASS.
- Node syntax check and git diff --check must pass.
- Existing OGE state/transport and writing workflows are rerun separately.
- Published bytes must match; the live test fails on version mismatch.
- Failure phases and unavailable checks stay explicit. A failed live connection
  is not recorded as a passed source-level test.
- No real learner pilot or physical stylus test is claimed.

## Review, risks and rollback

Self-review of bounded test code and the resulting evidence. No learning design
change; no external consultation requested. Principal risk is flaky public
connectivity or a brittle test assumption. Diagnose the phase rather than
weakening assertions. Tests create at most one new anonymous room per run and
use isolated browser contexts. Removing the three test/task files reverts this
addition; no user-data rollback or migration is needed.

## Execution record

Initial implementation and checks are pending; exact head, CI and live outcome
are recorded in the task PR. This specification does not predict a passing run.

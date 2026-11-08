# MX-03: published task 11 and 19 shared-room acceptance

## Identity

- Task: close the untested task 11 / task 19 portion of MX-03 using isolated synthetic rooms.
- Owner: MathExam owner, direct overnight implementation/acceptance instruction, 9 November 2026 (Asia/Novosibirsk).
- Base: main at `1f49566c5411767b67062a3bf172f1dd719e63ed`.
- Branch: `test/mx03-20261109`; review level SMALL (test-only, no product or protocol changes).
- Related evidence: PR340 implemented adapters; PR457 / task25 acceptance does not establish task11/task19 acceptance.

## Goal and approved scope

Verify actual published task11 and task19 in separate teacher/pupil browser contexts, using two new anonymous rooms and synthetic interactions. Verify published asset identity, native task/answer/feedback/help/model state, control handoff, drawing, typed board notes and nonwriter protection, automatic reconnect, reload of both roles and late join. Compare semantic native state and rendered conditions, graphs, fields and feedback. Check each of the five task11 families. Existing task19 adapter tests cover all 234 card model round-trips; the live test covers deterministic initial card `prev-102` via its supported URL and one subsequent assertion, not all cards in production.

Do not use cabinet login, existing rooms, pupil accounts, assignments or stored lessons. No product runtime, server, storage contracts, gates or deployment configuration changes. No tokens, room links, session storage or screenshots in evidence. New test rooms expire under the existing backend policy; do not delete real rooms. One bounded branch-triggered run and manual opt-in are supplied, without a schedule.

## Acceptance and gates

- `node --check tools/mx03-published-board.browser.cjs` and `git diff --check`.
- Existing native tests: task11 selected by `--test-name-pattern='OGE11:'` and all `tools/task19-board.test.cjs`.
- Live gate `MX03_PUBLISHED_BOARD_ACCEPTANCE` must report PASS. Every observed published runtime asset must match checkout before a room is created.
- Browser test runs Chromium on GitHub Actions if local sandbox cannot launch it. Missing execution is not a pass.
- Each role is isolated by a separate browser context. Private learning/progress API requests are blocked.
- No real learner, pedagogical-effectiveness, real delayed-learning or physical-stylus test is claimed.

## Review and rollback

Self-review plus parent agent review of bounded test code and actual evidence. No new learning design or external consultation. Remove the test, workflow and this task record to roll back; no runtime migration or user-data rollback exists.

## Permissions

Owner directly authorized overnight cloud work, publication after gates and this optional independent MX03 package. [Standing owner policy](../OWNER_RELEASE_AUTHORIZATION.md) applies. Branch/commit/push/Draft PR permitted; parent agent owns push, PR and publication. No new owner decision required for this bounded check.

## Execution record

- Live site HTML responds 200; backend root responds 404 (root is not a health endpoint), through normal network access.
- Local Chromium launch was attempted and rejected by sandbox `socket(): Operation not permitted`; no bypass attempted. Thus no local browser/production acceptance is claimed.
- Initial combined native suite ended with two process-level failures after 33 assertions/tests passed; separate scoped runs and CI are used to identify the actual result rather than relabel the failures.
- Separate scoped native runs passed: task11 7/7 (22.7s), task19 9/9 (12.5s).
- Exact head, CI result, sanitized JSON evidence, failures and unrun checks are to be recorded in the PR after execution.

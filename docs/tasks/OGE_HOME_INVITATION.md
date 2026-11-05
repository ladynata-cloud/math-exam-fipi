# OGE homepage invitation

## Identity and approved scope

- Owner: MathExam owner; direct current-session request to use
  «Начни уже с чего нибудь!» as the invitation.
- Date: 2026-11-04 (Asia/Novosibirsk).
- Base: main `7649cb1368f2c5631f79d25fa8414373481f9ed7`.
- Branch: `fix/oge-home-invitation-20261104`.
- Review: SMALL, one public button label and task/release documentation.
- Goal: use «Начни уже с чего-нибудь!» on the primary OGE homepage button,
  retaining its course destination and existing responsive behavior.
- No ADR, new trainer or design consultation applies to this copy edit.

## Evidence and acceptance

Current main contains the PR428 landing. Its primary link says «Начать
заниматься» and opens `/trainers/oge-course/`. The existing homepage browser
gate verifies this destination at 320, 390, 768 and 1280 pixels and checks
horizontal overflow. No duplicate invitation fix was found on main.

- New phrase uses the standard hyphen in «чего-нибудь».
- Button remains visible and opens the same course; no horizontal overflow.
- Models, all other routes, accounts, storage and assistant/API settings remain
  unchanged. Concurrent orbital-model work is outside this change.

## Checks and review

Run the existing homepage browser gate and applicable public-route/SEO checks,
review the exact three-file diff, and run `git diff --check`. Record actual
results, exact head and cloud workflow links in the PR. No new test is needed
for a reversible copy edit covered by existing navigation/layout assertions.
Final gate: applicable CI PASS, then exact release tree and live invitation.
External provider review and real-pupil testing are not performed; external
review is not required under the standing owner policy.

## Permissions, risk and rollback

START, branch, commits, push and Draft PR are authorized by the direct request.
Ready, squash merge and deployment after checks are authorized by
[OWNER_RELEASE_AUTHORIZATION.md](../OWNER_RELEASE_AUTHORIZATION.md).
Requery current main and head before merging; preserve and revalidate any
concurrent changes. No separate permission is pending. Main risk: longer
button text on a narrow screen. Rollback: revert this copy change through an
ordinary PR. No migration or learner-data action is involved.

## Execution and handoff

The PR records actual head, passed/failed/not-run checks, fresh base/head,
drift classification, merge parent/tree, Pages deployment and live result.
Scope deviation: none. No external review or pupil pilot is claimed.

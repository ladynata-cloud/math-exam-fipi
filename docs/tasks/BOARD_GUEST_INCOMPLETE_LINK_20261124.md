# MathExam task specification

## Identity

- Task: explain an incomplete pupil invitation on the public lesson board.
- Owner: MathExam owner; explicit START for the guest-mode corrections in the current conversation.
- Date: 2026-11-24 (Asia/Novosibirsk).
- Base branch: `main`.
- Base SHA: `b944df23a069b593aa03c7bcc4f9938300695f41`.
- Planned branch: `fix/guest-board-incomplete-link-20261124`.
- Review level: `MEDIUM`.
- Related issue or ADR: guest-mode audit; no architectural change.
- ADR status, if applicable: ADR 0001 remains Proposed and is not an authorization source.

## Goal

A pupil opening a lesson link without its access parameter immediately sees
that the link is incomplete and needs a complete replacement from the teacher.
The page must not imply that a connection is still in progress or grant local
editing to the pupil.

## Context and evidence

- The base page adds its waiting panel for `role=student` with a room, but only
  connects automatically when a token is present. An absent or empty token
  therefore leaves the waiting message above an inactive trainer. A whitespace
  token takes the ordinary connection path even though it supplies no access.
- `connectRoom()` also labels an absent token as local mode on retry. The
  existing pupil role and server authorization must remain unchanged.
- The complete production HTML and scripts are already exercised by
  `tools/board-room-error.test.cjs`; browser rendering, transport and child-frame
  messages are fixtures. Its synthetic values are not production credentials.
- The authoritative base includes PR #742. PROJECT_STATUS still has historical
  preparation entries; the coordinating agent reconciles that evidence in the
  separate navigator task. This task does not edit PROJECT_STATUS.

## Approved scope

### In scope

- Detect a missing, empty or whitespace-only pupil token at connection entry.
- Show a clear instruction to obtain the complete link, including when the
  same connection action is retried.
- Extend the existing whole-page DOM fixtures and preserve valid invitations,
  teacher local work, room restoration, and existing rejection recovery.

### Out of scope

- Navigator dialogue, storage-disabled browsers, new invitation formats,
  cabinet access, room-server behavior, model APIs and production test rooms.

### Files or areas that must not change

- Server authentication/authorization, room tokens, protocol, persistence,
  trainer mathematics, saved pupil data, PROJECT_STATUS and deployment settings.

## Acceptance criteria

- [x] Missing, empty and whitespace-only access parameters show a visible
  incomplete-link explanation with a concrete next step.
- [x] These invitations open no Socket.IO connection or new room, and the pupil
  remains read-only with the unrelated trainer hidden.
- [x] Repeating connection actions retains the explanation without a waiting loop.
- [x] Complete invitations retain the exact supplied token and normal join path.
- [x] Existing teacher, reconnect, terminal-error and ink/image DOM/unit regressions pass.
- [ ] Exact-head browser CI completes; local Chromium is blocked by the execution environment.

## Checks and gates

- Required tests: `node --test tools/board-room-error.test.cjs`; existing board
  ink/image tests; the board-writing workflow's applicable regressions in CI.
- Required static checks: test-file syntax, production inline-script syntax,
  `git diff --check`, final changed-file and secret-free handoff review.
- Manual checks: read-only production defect from the audit. Candidate browser
  verification and exact-head CI are reported separately by the coordinator.
- Final gate marker: `BOARD_GUEST_INCOMPLETE_LINK_OK` after the targeted checks.
- Checks intentionally not run here: live rooms, real pupil accounts, paid
  provider calls and deployment. No live release is authorized by this task.

## Review plan

- Review-level rationale: bounded client entry/error behavior. No credential
  transformation, authentication decision, server contract or control grant changes.
- Trainer design consultation applicable: no; no teaching sequence changes.
- Before implementation: source review and the observed guest-entry defect;
  external consultation not performed and not required for this UI correction.
- Ready-result review: coordinator independently reviews the scoped patch,
  failing-before/passing-after fixtures and retained valid invitation behavior.
- External review required: no specific provider review was requested.
- Sanitized handoff constraints: synthetic fixtures only; no live room links,
  tokens, learner data or machine-specific paths in repository records.
- If an external review is later used, record provider, PR, base/head, verdict
  and verifiable timestamp or source. This document is not a review approval.

## Risk and rollback

- Main risk: misclassifying a usable invitation or disturbing initialization.
  Check only whether the existing token has any non-whitespace content; do not
  rewrite it or change the accepted server formats.
- Rollback plan: revert this task's client/test/documentation commit. There is
  no data migration or saved-work rewrite.
- Data/compatibility: retain pupil read-only state, existing room identifiers,
  complete-token bytes and the normal server validation path.

## Permissions

- `START` granted by owner in the current task conversation: yes.
- Branch creation and local commits: allowed.
- Push and Draft PR: allowed; the coordinating agent performs them.
- Release authorization: the current user-provided AGENTS instructions are
  narrower than the repository standing policy and take precedence.
- Merge: **not authorized**; a separate explicit owner decision is required.
- Auto-merge: **not authorized**.
- Deployment: **not authorized**.

## Execution record

- Actual branch: `fix/guest-board-incomplete-link-20261124`.
- Actual base SHA: `b944df23a069b593aa03c7bcc4f9938300695f41`.
- Actual head and PR: recorded in the coordinating agent's final handoff.
- Existing baseline: 31/31 board-room checks passed after supplying the pinned
  jsdom dependency and materializing the pinned Socket.IO fixture from the
  sparse checkout. Initial missing-dependency/file setup errors were resolved.
- Before the runtime change, the new missing/empty/whitespace invitation cases
  failed on the unchanged waiting message; the complete invitation case passed.
- Candidate: 35/35 whole-page room/bridge checks and 21/21 existing ink/image
  checks passed. They include repeated entry actions, visible error panel,
  hidden/inert trainer, no transport or write request, and the unchanged join
  payload and server-controlled writing grant for a complete invitation.
- Static checks: test and inline-script syntax and `git diff --check` passed.
- Browser: not run to rendering locally. The coordinator's Chromium launch in
  this environment failed with `socket(): Operation not permitted` before a
  browser page opened; no bypass was attempted. Exact-head GitHub browser CI
  remains pending. Synthetic DOM evidence is not production or real-pupil evidence.
- External review, production rooms, publication: not performed.
- Local gate: `BOARD_GUEST_INCOMPLETE_LINK_OK`; exact-head CI and independent
  coordinator review are recorded in the PR/handoff, not inferred from this marker.
- Scope deviations: none.

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

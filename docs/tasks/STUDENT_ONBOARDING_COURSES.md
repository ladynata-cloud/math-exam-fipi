# Student onboarding and course assignment

## Identity

- Task: `STUDENT_ONBOARDING_COURSES`
- Owner: repository owner
- Date: 2026-11-01 (Asia/Novosibirsk)
- Base branch: `main`
- Base SHA: `37718f1c0138ba031314b8f4716b73c9d963bc81`
- Branch: `feat/student-onboarding-courses-20261101`
- Review level: `HIGH`
- Related ADR: [0010 — permanent learning accounts](../adr/0010-unified-learning.md), Accepted.

## Goal

Let a teacher create a permanent pupil cabinet and select its grade, preparation
direction and one or more supported courses in one understandable sequence.
Later program edits must preserve the same account, login, assignments and work.
Connecting another pupil must require only the teacher interface.

## Context and evidence

The current ready-pupil form, four-digit code handling, permanent entry links,
teacher preview, versioned profiles and durable attempts already exist.
Profiles currently have one direction and a focus note, without a structured
grade/course selection. Legacy attachments infer courses from allowlisted note
markers and URLs. This task extends that existing account/profile architecture.
Public courses with browser-local work remain explicitly distinguished from
managed cabinet attempts. No general cloud-progress migration is implied.

## Approved scope

### In scope

- A name/grade/direction → course selection → confirmation → ready-access flow.
- A bounded shared catalog of existing supported, published course entries.
- Durable structured grade and selected courses in the existing profile system;
  backwards-compatible reads and writes for old profiles and clients.
- Atomic initial account/program saving with safe, nonsecret retry receipts.
- Explicit program editing with version-conflict handling and no work deletion.
- Visible course cards and read-only teacher preview; existing credential card,
  login, QR and parent-access behavior retained.
- Synthetic server/browser tests, narrow-screen evidence, task report, and
  project-status reconciliation within this PR.

### Out of scope / protected areas

- Real pupil accounts, assignments, settings and production data.
- Credential policy, role permissions, token mechanics or a new account system.
- Course exercise content, trainer mathematics, AI providers or billing.
- Merging other draft PRs, deployment, hosting changes and branch protection.

## Acceptance criteria

- [x] Teacher creates one pupil with grade, direction and two selected courses.
- [x] Success is shown only after the complete program is committed; retry does
  not duplicate the pupil or persist plaintext credentials in receipts/storage.
- [x] Ready link/login/code work immediately with existing authentication.
- [x] Both course cards lead to usable materials and state their saving behavior.
- [x] Teacher preview retains teacher identity and does not mutate pupil work.
- [x] Program edits preserve account ID, credentials and previous work/history.
- [x] Reload, new login and server restart preserve program and managed work.
- [x] A second synthetic pupil and existing assignments remain unchanged.
- [x] Desktop, 320/390px, keyboard, network-error and concurrent-edit paths pass.
- [x] Legacy profile/client compatibility and rollback preservation pass.

## Checks and gates

- Required tests: complete backend suite; focused onboarding/profile tests;
  actual-server onboarding browser journey; existing auth, pupil-access, role,
  cabinet, parent and QR regressions; course-catalog link/route validation.
- Static checks: JavaScript syntax, `git diff --check`, scoped diff review.
- Manual checks: inspect screenshots of each wizard stage and pupil/teacher
  course cards on desktop and narrow screens.
- Candidate gate: `STUDENT_ONBOARDING_COURSES_OK` only after recorded checks pass.
- Production tests and real-pupil trials are intentionally not run in this task.

## Review plan

- HIGH: this changes durable profile data and account-creation contracts.
- Trainer design consultation: not applicable; no trainer or teaching sequence
  is created or redesigned.
- Independent review of atomicity, credential lifetime, backwards compatibility,
  course routing, preview isolation and retained work is required.
- External review remains required by policy unless the owner grants a current
  scoped exception with rationale. No earlier exception is reused.
- External evidence, if obtained, must name provider, PR, exact base/head,
  verdict and verifiable source/time. Internal review is labelled separately.
- Handoffs contain only this public code/diff and synthetic evidence; no real
  pupil information, secrets, private documents or machine-specific paths.

## Risk and rollback

Main risks: partial creation, duplicate retries, stale program overwrites,
misleading course storage claims and preview mutations. Preserve existing
authentication, ownership, CSRF, operation/version fences and attempt IDs.
Rollback restores the previous runtime without deleting the additive program
data or any accounts/work; verify old code can reopen the upgraded database.
Reapplying the feature must recover the saved selections. Public assets and
the cabinet backend require a coordinated release after separate approval.

## Permissions

- START: explicitly granted in this task conversation on 2026-11-01.
- Branch, local commits, push and one Draft PR: allowed.
- Merge, auto-merge and deployment: **not authorized**.

## Execution record

- Actual branch: `feat/student-onboarding-courses-20261101`
- Actual base: `37718f1c0138ba031314b8f4716b73c9d963bc81`
- Head, PR, checks and remaining release gates: recorded in the task report and
  Draft PR after implementation; acceptance evidence is in the linked report.

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

# Clear teacher, pupil and parent cabinets

## Identity

- Task: CLEAR_FAMILY_CABINETS
- Date: 2026-10-10 (Asia/Novosibirsk)
- Base branch: main
- Base SHA: be7ca1882228fc3b161ab4472f3bc86dfdd8df48
- Branch: feat/clear-family-cabinets
- Review level: HIGH — role-aware authentication, session identity fencing and persisted learning workflow.
- Related ADR: 0010-unified-learning (Accepted). Existing account, parent and managed trainer architecture remains authoritative.

## Goal and approved scope

The owner requested implementation of the cabinet redesign discussed in the current conversation. A teacher link must not silently show a pupil home, a teacher must be able to inspect an owned pupil without impersonating them, and the family must have a clear entry and one trustworthy persisted learning history.

Included:

- Explicit teacher/pupil/parent entrances and mismatch messages; role choice never grants privileges.
- Expected-role login validation and current-account request fencing, with old clients remaining compatible.
- Session reconciliation across tabs, preserving account-scoped unsent work.
- Teacher-owned read-only pupil preview without a new pupil session or learning mutation.
- One pupil card with profile, plan, assignments, results, pupil access and parent access.
- Permanent-entry copying separated from password replacement and invitation reissue.
- Newly issued pupil and parent invitations valid for seven days; existing invitations retain their stored expiry and one-use/revocation rules.
- Pupil start/continue action prioritizing published assignments, unfinished work and teacher plans within the managed catalogue.
- Honest saving/pending states and parent visibility of the same server-committed attempts.
- Synthetic browser/backend regression and independent review.

Out of scope:

- Changing real family credentials, revoking real sessions, assigning real homework or sending invitations/messages.
- Migrating arbitrary public/local-only course history into managed attempts, rewriting course content, or claiming every external trainer is synchronized.
- Destructive database/schema replacement, changes to QR grant semantics or broader parent permissions.
- Unrelated open PRs. Existing draft #217 overlaps only in the bounded seven-day invitation change; it is not merged wholesale.

## Acceptance criteria

- [x] A pupil opening #students sees a named role mismatch, never a misleading teacher URL with ordinary pupil home.
- [x] Explicit role login rejects a different account role without changing the session.
- [x] Teacher preview preserves teacher identity and adds no pupil attempts or assistance.
- [x] Account change in another tab cannot submit a stale actor's commands or display another account's data under the old identity.
- [x] The teacher pupil card includes safe link-copy and separate recovery controls, plus accurate parent activation state.
- [x] New family invitations last seven days, expire, remain one-use and respect owner/version checks.
- [x] Assigned managed work is prominent; a completed managed division attempt is visible in pupil, teacher and parent views after reload.
- [x] Interrupted or lost-acknowledgement saves do not claim success or duplicate attempts.
- [x] Mobile layouts, ordinary authentication, parent privacy, and existing course navigation retain their guarantees.

## Checks and gates

Run full backend tests, new role-navigation and family-progress browser gates, existing authentication/parent/cabinet/preparation/course/teaching regressions as applicable, syntax checks and git diff --check. CI also exercises pinned production Node/Alpine SQLite and image dependencies. No real accounts or production DB are used in test fixtures.

Gate: CLEAR_FAMILY_CABINETS_OK, only after all required relevant checks succeed. Record failed and not-run checks explicitly in the PR/report.

## Risk and rollback

Role hints are untrusted and must never select another identity. Server roles, current session and pupil ownership remain authoritative. New actor headers are optional for old clients but checked when present. Parent cookies and readonly DTO remain separate. Pending browser work stays scoped to the originating account. No credential values or real pupil records enter source control.

Rollback is a revert of this scoped commit with no database migration or deletion. Preserve existing pupil password verification, QR/session binding and parent tables. Invitations issued with seven days retain stored expiry if code is rolled back; rollback does not extend or revoke them. No automatic account recreation or credential reset is used to repair navigation.

## Permissions and review

The current owner request authorizes implementing the proposed redesign. The owner's standing cloud-publication instruction (reconfirmed 2026-10-09) and project-level external-review waiver remain applicable. Publication follows independent internal HIGH review, relevant gates and verification of the actual remote base/head. This file records the decision context, not an external-review verdict. No broader account mutation or deployment exception is inferred.

## Execution record

Implementation and exact validation results are recorded in the task PR after integration. No production account mutations are part of this task. Two independent-review findings were corrected: account transitions now clear the preceding identity's cached records even when the next refresh fails, and expired unused invitation timestamps remain available to the teacher UI. Dedicated regression cases cover both.

Local validation: 217/217 backend tests passed after the final expiry fix. Role-navigation, family-progress, parent, authentication, QR entry, cabinet, OGE homework, teaching UI/live teaching and course-navigation browser gates passed with original assertions. Catalogue/preparation checks, syntax checks and whitespace validation passed. Desktop/mobile synthetic screenshots were reviewed. Remote production-image/CI gates and live hosting verification remain pending at this commit.

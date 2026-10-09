# Seven-day pupil and parent invitations

## Identity

- Task: Extend initial/replacement pupil and parent invitations to seven days.
- Owner: Repository owner.
- Date: 2026-10-09.
- Base branch: `main`.
- Base SHA: `aabdb8d9396bef502ced049e7867774c1885ddef`.
- Planned branch: `codex/week-long-family-invitations`.
- Review level: `HIGH` (authentication credential lifetime).
- Related ADR: [0010](../adr/0010-unified-learning.md), `Accepted`.

## Goal and evidence

Allow a family at least one week to open privately delivered invitations. The
owner requested repeating issuance with a lifetime of at least one week. Current
code hardcodes three days at initial pupil creation, pupil recovery and parent
invitation issuance. The teacher UI has no configurable duration. Existing
invitation records hold an absolute expiry, so publishing code alone does not
extend an already issued link.

## Approved scope

- Change these three issuance lifetimes to exactly seven days.
- Update the fallback UI duration, version the changed browser asset, align the
  family guide and accepted ADR, and reconcile the preceding release status.
- Test expiry boundaries, replacement/one-use behavior and persisted expiries.
- Preserve account identity, learning history, password policy, ownership,
  hashed token storage, session behavior and teacher bootstrap lifetime.
- No QR work, credentials, production data, schema migration, course changes or
  user impersonation belongs in this patch. Actual invitation replacement is a
  separate post-deployment operation on the existing accounts.

## Acceptance criteria

- [x] New initial/replacement pupil and parent invitations expire at issue time
  plus seven days; valid immediately before and invalid at that boundary.
- [x] Previously stored expiry timestamps are not extended or reinterpreted.
- [x] Replacement and one-use semantics, teacher lifetime and isolation remain.
- [x] Backend suite and relevant auth/parent/QR/cabinet browser gates pass.
- [x] UI wording and documentation agree; `git diff --check` passes.

## Checks and review

- Full backend suite; targeted persisted-expiry and security tests.
- Browser gates: `learning-auth`, `learning-parent`, `learning-quick-access`,
  `learning-cabinet`; complete workflow remains required on GitHub.
- Independent review of the scoped diff and rollback compatibility.
- Gate marker: `WEEK_LONG_FAMILY_INVITATIONS_OK` (local technical gate only).
- External review is required by `REVIEW_POLICY.md` unless the owner explicitly
  waives it with rationale. No external verdict or waiver is assumed.
- Any remote review must contain only sanitized repository material and record
  provider, PR, base/head, verdict and verifiable source/timestamp.

## Risk and rollback

An unused bearer invitation remains usable four days longer. One-use checks,
explicit replacement, teacher ownership, hash-only storage and bounded expiry
remain in force. No database format changes are made. Reverting the three TTL
values changes future issuance only; both old and new code enforce each stored
expiry. Existing seven-day invitations remain valid after a code rollback unless
explicitly replaced/revoked. Never restore an older database over newer pupil work.
Verify compatibility using disposable synthetic SQLite data and the base code.

## Permissions

- The owner's current instruction to redo the work with at least a week is the
  task start and authorizes branch, scoped implementation, checks, commits, push
  and a Draft PR under the repository workflow.
- Merge, auto-merge and deployment await separate explicit authorization for
  the concrete PR/base/head. No historical permission is reused.
- No real password, invitation, identity or private account data is recorded.

## Execution record

- Actual branch: `codex/week-long-family-invitations`.
- Actual base: `aabdb8d9396bef502ced049e7867774c1885ddef`.
- Head and PR: recorded in the final PR handoff after committing.
- Tests: backend 210/210; targeted family/security 27/27; real browser auth,
  parent, quick-access and eight-seat cabinet gates passed. Local Node 24.19.0
  and installed Chromium headless shell were used; pinned production-runtime
  and full-workflow verification remain in remote CI.
- Rollback: disposable DB with new seven-day initial/replacement pupil and
  parent invitations reopened with the actual base store/family modules;
  stored deadlines and exact-boundary rejection preserved
  (`LEGACY_BASE_ROLLBACK_WEEK_EXPIRY_OK`).
- Independent internal review: no blocking findings; external review is still
  required or must be explicitly waived by the owner.
- Local technical gate: `WEEK_LONG_FAMILY_INVITATIONS_OK`.
- Failures: none remaining. An initially stale three-day browser expectation
  and an incorrect expected error label in the added test were corrected;
  affected checks passed on rerun without weakening assertions.
- Not run: remote CI, external review and production verification pending.
- Scope deviations: none.

## Required handoff

Task, PR, Base, Head, Gate, Tests, Failures, Not run, Scope deviations,
Recommendation and Next user decision must be reported at handoff.

# Repair pending teacher activation

- Date: 2026-10-05; review level HIGH (authentication).
- Base: `main` at `c86a98842f0158ecd4096ee8f58667463d20dd23`.
- Branch: `fix/pending-teacher-activation`.
- The owner requested working cabinets and server restoration, authorized
  publication, and waived separate external review. The current failed first
  activation is within that scope. Independent local review remains required.

## Goal and evidence

Correct passwords cannot activate an invalid invitation. Existing startup code
ignores hosting bootstrap changes as soon as any teacher row exists, even before
activation. The client also consumes invitation fragments only on initial load
and uses the same error for activation and ordinary login. The exact production
account state is not known and must not be inferred from these defects.

## Scope

- Let a changed valid private hosting token replace a pending invitation only
  for the same normalized teacher login, atomically and without identity changes.
- Active accounts are an unconditional no-op; no public bootstrap/recovery
  endpoint, forced password, auth bypass or session access is introduced.
- Retain revoked teacher invitation hashes; reject their reuse. Unchanged or
  expired tokens are never extended by restart. CLI pending renewal retains
  this history too. No schema changes or pupil invitation changes.
- Emit only a fixed operator diagnostic enum, not supplied values or hashes.
  No public account-state disclosure. Keep an existing invitation available
  after a failed repair.
- Distinguish login/activation errors in the UI and consume same-document
  invitation navigation safely without switching an authenticated user.
- Reconcile the preceding release status; update the accepted ADR and guide.

## Acceptance and checks

- Old and new token behavior, identity preservation, restart idempotence,
  expiry, malformed configuration, active-account immutability, rollback and
  absent secret/status disclosure are covered by backend regressions.
- Local browser scenarios cover activation, ordinary login, same-page links,
  session preservation, mismatch messages and transition back to login.
- Run full backend tests, the focused auth browser test and existing real
  cabinet regression. Exact-head CI also exercises the production Alpine image.
- Independent review, `git diff --check`, scoped commit/PR, current remote base
  check immediately before merge, merged tree verification, deployment and
  changed public asset checks. Gate: `PENDING_TEACHER_ACTIVATION_OK`.

## Risk and rollback

The operator must retain control of the hosting environment and enter new
credentials privately. Do not inspect or publish real credential values.
Normal configuration changes revoke the previous pending invitation; they do
not affect active passwords, sessions, learning attempts or pupil identities.
Rollback by redeploying the parent code, retaining the persistent database and
all invitation hashes. Its existing CLI can renew a pending invitation.
Credential entry and first activation remain a manual private handoff.

## Permissions

Implementation, scoped commits/PR and publication use the owner's standing
explicit authorization. No separate external review is requested. No destructive
data reset, access expansion, credential capture, paid service or messages to
pupils/parents are authorized by this repair.

## Execution record

- Local backend: 123 tests passed, including eight bootstrap cases.
- Local real HTTP/SQLite authentication browser regression passed: activation,
  context-specific errors, fragment entry, current-session protection, transient
  session/list failures, recovery-code retention, retry and compact layout.
- Existing eight-seat cabinet regression passed. Independent review identified
  and closed the authenticated-data-load retry issue; final review is recorded
  in the PR. No production credentials were handled by these checks.
- Initial local invocations lacked installed dependencies/bundled Chromium;
  installing locked dependencies and selecting the existing test browser
  resolved the environment failures. No assertion or gate was weakened.
- Exact-head CI and production verification remain pending. Do not claim that
  a real account has been activated or provisioned until confirmed through the
  normal authenticated UI.

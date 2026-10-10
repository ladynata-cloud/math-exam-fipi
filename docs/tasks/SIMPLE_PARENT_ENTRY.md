# Ready parent entry and visible login feedback

- Date: 2026-10-10 (Asia/Novosibirsk)
- Base: `f2a8ba0c6b721446209b4e1c3b83134733f3036d`
- Branch: `feat/simple-parent-entry`
- Review: HIGH independent internal, under accepted ADR 0010 and the owner's
  standing checked-publication instruction and external-review waiver.

## Goal and approved scope

Make parent entry as simple as pupil entry, and show visible progress while
login is waiting. The teacher issues a ready four-digit parent code; the parent
uses a personal login-prefilled link and enters the code once. No activation or
forced replacement follows. Preserve the optional invitation workflow.

- Add the owned-parent ready-code endpoint with strict request, teacher-session,
  ownership, post-hash credential and parent-version checks. Preserve parent
  identity; revoke only its previous sessions and invitations.
- Default teacher parent-access UI to ready codes, with metadata-only existing
  access, explicit replacement, complete copyable message and plain Done.
- Keep plaintext only in transient UI memory. Clear lifecycle/account state;
  never infer success from metadata after a lost acknowledgement or auto-retry.
- Show three blinking dots and “Входим…” after teacher, pupil and parent login
  submission until the initial cabinet data load ends. Prevent duplicate
  submits, support status/aria-busy and reduced motion, restore usable errors.
- Refresh changed assets, document the existing authority and rollback, and
  reconcile the preceding release against production evidence.
- Separately create the owner's requested practice pupil through the private
  teacher UI, matching the reference pupil's course, goal and starting route.
  Keep results independent; copy no solutions/history or real credentials.

No schema, learning protocol, role boundary, session lifetime or verifier policy
change. No real pupil or teacher credential reset, parent impersonation,
automatic messages, hosting settings or unrelated roadmap work.

## Acceptance and gates

- Ready parent codes including leading zeroes work directly; existing passwords
  and invitations remain compatible. Child credentials and work stay intact.
- Wrong role/owner, stale version, logout or credential change while hashing
  cannot write. Concurrent invitation/revocation/replacement has one winner.
- The UI never presents an unconfirmed ready card; lifecycle cleanup prevents
  stale identity or secret reuse. Login progress spans authentication and data
  loading, disappears on failure, and never sends duplicate requests.
- Focused and full backend tests; parent/auth browser gates and relevant family,
  teacher-password, role-navigation and ready-pupil regressions; syntax/diff
  checks; independent HIGH review; required exact-head CI.
- Verify changed deployed bytes, health and live role UI. Use only synthetic
  credentials in QA; private practice-account setup is separately user-requested.

Gate: `SIMPLE_PARENT_ENTRY_OK` after required checks pass. Exact head/tree,
review, failures, not-run checks and release evidence belong to the task PR.

## Permissions and rollback

The current request authorizes this scoped implementation and the practice
account. Existing user authorization covers checked publication. No new approval
is needed for these ordinary steps; no force or protection changes are used.

Roll back the changed endpoint and UI only. Preserve the four-digit/legacy
verifier, additive parent tables, current hashes and all learner history. No
database restore or credential reversal is required. Unknown acknowledgement
is an explicit state; retry requires the teacher's deliberate new submission.

Internal review is not external-provider review. No private pupil identifiers,
PINs, session values or private production screenshots belong in Git.

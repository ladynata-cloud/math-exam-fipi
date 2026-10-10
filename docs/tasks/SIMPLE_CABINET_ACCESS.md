# Simple passwords and teacher recovery

- Date: 2026-10-10 (Asia/Novosibirsk)
- Base: `f9a9a3607312dab4bbfd6e85d2e28d93822d3e9c`
- Branch: `feat/simple-cabinet-access`
- Review: HIGH, independent internal review under the owner's existing
  external-review waiver and cloud-publication instruction.

## Owner request

The owner forgot her password and has no saved recovery codes. She explicitly
requested recovery she can use and ready-made pupil passwords, with fewer
security-related steps. This scope amends the interaction policy in ADR 0010;
account ownership and private server-side password storage remain in force.

## Behavior

1. An already authenticated teacher can choose a new password without entering
   the old password or a recovery code. Keep this same session token and expiry
   after the update, revoke other teacher sessions and obsolete recovery proofs.
   A lost response therefore does not remove the only working teacher session.
2. If no teacher session remains, a verified hosting operator can issue a
   separate one-use, expiring recovery link for the existing teacher. Write the
   link only to a new private file. It does not change credentials until the
   teacher chooses and submits a new password. This is not bootstrap and is not
   a public reset-by-login service. Email delivery is not configured or claimed.
3. The main pupil path is name, login and ready password chosen by the teacher,
   followed by a complete message to copy. No pupil self-activation or mandatory
   save/discard checkbox is required in this path. Existing issued invitations
   and optional pupil QR entry remain compatible.
4. The teacher's password form and pupil entry card are short and usable on a
   phone. Existing backup codes remain an optional additional method.

The current request authorizes the implementation and its checked publication.
It does not require modifying any real pupil credentials. The owner privately
enters and submits her new password in the finished teacher form; the agent
does not request it in chat or expose it in code, screenshots or logs.

## Boundaries and verification

- Exact Origin, CSRF, server-side role/ownership and account-identity checks.
- Atomic post-hash validation of the original session and credential snapshot.
- Preserve account IDs, pupils, assignments, attempts, parent access and history.
- Old/expired/wrong-purpose recovery tokens cannot activate or recover accounts.
- No raw password/token storage in databases, receipts, browser storage or logs.
- Test anonymous/pupil denial, concurrent logout/recovery, session retention,
  other-session revocation, lost acknowledgements, single-use TTL links and
  issuance-file failure behavior on synthetic accounts.
- Real-browser tests exercise both teacher recovery paths, ready pupil login,
  copy failure, mobile layout and preserved existing role/learning behavior.
- Full relevant exact-head CI, production container and independent HIGH review.

Gate: `SIMPLE_CABINET_ACCESS_OK` only after required tests pass. Report failures
and not-run checks separately. Verify published assets and the live teacher
form without changing production account data during QA.

## Rollback

See the operator recovery documentation for revoking outstanding new recovery
links before returning to a release that does not recognize their purpose.
Preserve the existing database and current password hashes; never restore an
older teaching database as a password-recovery shortcut. Existing shorter pupil
password verification remains supported. Code rollback does not undo a real
password change or resurrect revoked sessions.

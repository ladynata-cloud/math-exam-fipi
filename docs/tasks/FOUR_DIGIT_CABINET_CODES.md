# Four-digit cabinet codes and completed setup

- Date: 2026-10-10 (Asia/Novosibirsk)
- Base: `bdf2519d10b03e1c2d77a379a78a21ce2e196f99`
- Branch: `fix/four-digit-cabinet-codes`
- Review: HIGH, independent internal review under the owner's standing checked
  publication instruction and external-review waiver.
- Architecture: accepted ADR 0010, amended by this explicit owner request.

## Goal and evidence

The owner explicitly requires a four-character PIN for teachers, pupils and
parents. Four decimal digits are sufficient in every new setup/reset form.
The supplied teacher screenshot shows a successful password save below the
still-empty form headed “Set a new password”, which misleadingly invites another
save. A confirmed save must finish that interaction and offer the cabinet.

## Approved scope

- Four ASCII digits, including leading zeroes, in new credential UI for all
  three roles. Generate four digits in the teacher's ready-pupil access form.
- Accept these PINs on the server in every applicable creation, replacement,
  activation, recovery and login path. Preserve old longer credentials and
  existing clients using the former role-specific length ranges.
- Retain sessions, account identities, role/ownership checks, exact Origin,
  CSRF, rate limits, asynchronous hash fences and hash-only persistence.
- After a confirmed teacher save, replace the entire form with completion and
  a direct My pupils action. Rerenders cannot reintroduce the form. A deliberate
  later visit to settings may change the code. Failed/uncertain requests must
  not claim completion and remain recoverable without an automatic retry.
- Ready pupil codes work immediately. Existing self-activation and parent
  invitations choose the code once and proceed into the correct cabinet.
- Update the operator/user documentation and current project status.

No automatic reset of real credentials, role redesign, schema migration, new
parent provisioning endpoint, public reset-by-login endpoint, or shortening of
opaque invitation/recovery URL tokens is in scope. QA uses synthetic accounts.
The owner enters any real code privately after publication.

## Acceptance and gates

- Leading-zero PIN works for teacher, pupil and parent; old long login works.
- Invalid short/non-digit new credentials fail without mutations.
- Teacher self-change retains current session/expiry, revokes only the intended
  other credentials, and preserves pupils, family bindings and learning data.
- Success removes the reset heading/form and does not send a duplicate request
  during rerender. Errors/lost acknowledgement never show false success.
- Parent and pupil activation completes without a forced second code change.
- Full backend suite, focused browser flows, existing relevant auth/family/
  cabinet/navigation gates, exact-head learning CI and production image gate.
- Independent HIGH review, syntax and `git diff --check`.
- Publication: verify exact changed assets on public and cabinet origins and
  inspect the live form without reading or changing real credentials.

Gate: `FOUR_DIGIT_CABINET_CODES_OK` only after all required checks pass.
Record failed and not-run checks separately in the PR.

## Risk and rollback

Four-digit codes have fewer possible values; the owner explicitly chooses this
convenience policy. Existing per-source/per-account attempt limits remain.
Do not roll back to a login validator that rejects four digits after codes have
been issued. Revert the UI/affected behavior with the four-digit and legacy
login verifier retained. Preserve the database and current hashes; a code
rollback never restores previous passwords, sessions or teaching records.

## Permissions and record

The current request authorizes implementation and checked publication under
the existing standing cloud-publication instruction. No real account password
change is part of verification. One specification, branch and PR; no force,
protection changes, or disabled gates. Base drift requires source provenance
and renewed composed validation before publication.

Results and exact publication head are recorded in the PR after verification.

# Clear code-save feedback after a lost server response

- Date: 2026-10-10 (Asia/Novosibirsk)
- Base: `0081ce7b52db04be20a70ab6653b4f00d4679025`
- Branch: `fix/code-save-feedback`
- Review: HIGH, independent internal review under the existing checked
  publication instruction and accepted ADR 0010 external-review waiver.

## Goal and evidence

After choosing a four-digit entry code, the owner still sees an empty form
asking for a new code. The supplied screenshot shows an unconfirmed request
with a transport error, not confirmed success or invalid-code rejection.
The existing browser regression proves that a request may commit while its
response is lost. Never infer the real account's saved code from this screen.

## Scope

- Make teacher code settings a neutral overview. Opening settings or returning
  to them does not automatically open a new-code form. Editing is explicit.
- Replace an uncertain save with a separate explanation and a My pupils link.
  Do not show code inputs, claim success, or automatically repeat the mutation.
- An explicit retry offers the same previously chosen code, clearly labelled.
- Preserve confirmed and uncertain outcomes for the current account while
  navigating in the current page. Clear them on account changes. A page reload
  starts with the neutral overview, never an assumed success.
- Keep known validation/access errors recoverable, and preserve account,
  session, request-generation and cached-page boundaries.
- Refresh the script version and reconcile the preceding production release.

No backend contract, credential validator, database, session, deployment
configuration, real password or learning record changes. No secret persistence,
new verification endpoint, automatic login, or automatic credential retry.
The current request authorizes the corrective work and checked publication
under the existing standing publication instruction. No additional permission
is needed for these scoped changes; no force or protection changes are used.

## Acceptance and gates

- A dropped request before commit and a committed request with a lost response
  both show an honest uncertain outcome, without new-code fields or false success.
- Navigation, rerender and reload do not cause additional credential requests.
- Retry requires a deliberate action and a submitted form.
- A confirmed save stays complete on revisit; new edits require a click.
- Existing four-digit and legacy login policies, role/account isolation and
  cached-page handling remain valid.
- Focused teacher-password, auth and role-navigation browser gates; syntax and
  diff checks; independent HIGH review; required exact-head CI.
- Live changed assets match the reviewed files; inspect the teacher page
  without reading or changing real credentials.

Gate: `CODE_SAVE_FEEDBACK_OK` after the required checks pass. Exact heads,
failures, not-run checks and production evidence are recorded in the task PR.

## Risks and rollback

The UI cannot determine whether a lost-response mutation committed. It must
state that uncertainty rather than present either success or rejection as fact.
An intermittent hosting/network problem is separate; no restart or tariff
change is justified by a single timeout. Roll back only this frontend patch if
needed. Retain the four-digit/legacy verifier and the current database and hashes.

Independent review is internal, not external-provider approval. No real pupil
data, passwords, session values or private screenshots are included in Git.

# Direct teacher sign-in without the pupil mismatch screen

- Date: 2026-10-10 (Asia/Novosibirsk)
- Base: main at `528727fa6e7fa29c578bf540d014e3ad398206e1`
- Branch: `fix/direct-teacher-entry`
- Review: HIGH — authentication UI transitions and preservation of account-scoped unsent work.
- Related accepted architecture: ADR 0010. No new credential or account type.

## Owner request and scope

The owner requested entering her teacher cabinet without seeing a pupil's name
on the teacher entry page. The named role-mismatch screen from PR #222 does not
meet that interaction requirement.

For an explicit teacher destination, an existing pupil cookie should lead
directly to the teacher sign-in form. A valid teacher session should continue
directly to the teacher cabinet. Clear pupil view data before rendering any
teacher-entry interface; preserve unsent pupil work under its original account.
An explicit login hint may prefill the form but is never identity proof.

Successful teacher authentication still requires the existing server checks of
password and expected role. Merely opening the page does not log anyone out,
replace cookies, create teacher access, or revoke credentials. No real password,
session token, invitation, pupil record or personal login is embedded in code.
The ordinary teacher roster and pupil names within it remain unchanged.

## Acceptance and validation

- Teacher entrance with a pupil cookie shows the teacher form, without the
  pupil's name/login/header, including during async loads and reload/focus.
- Existing teacher session goes to My pupils without reauthentication.
- Valid pupil credentials fail the expected-role check without changing the
  current cookie; valid teacher credentials open the teacher cabinet.
- The original pupil's unsent queue survives and cannot be sent as the teacher.
- Login-hint, quick-link, stale/failed refresh and cross-tab paths cannot
  restore the pupil's identity on the teacher entrance.
- Auth, role-navigation and family-progress browser gates; full relevant CI;
  syntax and whitespace checks; independent internal HIGH review.

Gate: `DIRECT_TEACHER_ENTRY_OK` after required checks. Record failures and
not-run checks separately in the PR. After publication, verify versioned assets
and the live teacher session without changing real account credentials.

## Publication and rollback

The owner's existing project publication instruction and external-review
waiver apply. Verify actual base/head and CI before publication; do not claim
external-provider signoff. Existing cloud teacher authentication does not prove
that the owner's separate local browser is signed in. Do not claim automatic
authentication in a browser we cannot operate.

Rollback reverts this bounded frontend change. There is no schema migration,
new token, new cookie or production data mutation.

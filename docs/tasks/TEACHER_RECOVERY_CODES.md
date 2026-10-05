# Recover lost teacher backup codes

## Identity and authorization

- Date: 2026-10-06 (Asia/Novosibirsk); review level HIGH (authentication).
- Base: `main` at `8836bb24c04091ab503bf7c0d74eca1318b5732d`.
- Branch: `fix/teacher-recovery-codes`.
- Related architecture: [ADR 0010](../adr/0010-unified-learning.md), Accepted.
- The owner reported losing the first recovery-code display after successful
  activation. Standing explicit authorization covers implementation and
  publication, including enabling cabinets without separate external review.
  Independent local review remains required. No credential capture is permitted.

## Goal and evidence

An authenticated teacher who knows the current password can replace lost backup
codes without reactivation or an operator database change. The existing UI
allowed Escape, outside click, X and unconfirmed Done to close the only code
display. There was no reissue operation. The actual cause of the owner's lost
window is not established. Successful teacher login was confirmed through the
normal authenticated interface; no private database or credential was read.

## Scope and acceptance

- Add a teacher-only same-origin, CSRF-protected endpoint accepting exactly the
  current password. Rate-limit password checks per account before scrypt work.
- Revalidate the session and verified password/epoch inside the atomic rotation
  after asynchronous verification. Replace all prior codes; persist hashes only.
- Issuance keeps the current password and sessions. Using a code for actual
  account recovery continues to revoke existing sessions.
- Add a visible Security page. Clear the password field after sending it. Keep
  codes out of browser storage, URLs, logs, trainer messages and teaching exports.
- Show download/copy actions and require an explicit saved acknowledgement
  before ordinary close. Protect against incidental modal/page rendering,
  Escape and backdrop closure; warn before unloading. Provide an explicit
  acknowledged discard path, without trapping the user indefinitely.
- A lost HTTP response can be resolved by a new authenticated issuance. The
  client never automatically retries this credential mutation.
- Preserve bootstrap, pupil provisioning and ordinary recovery behavior. No
  production account mutation is part of automated verification.

## Checks and review

- Complete backend suite and new real HTTP/SQLite rotation tests: role, session,
  origin, CSRF, rate limit, async revocation races, rollback, persistence,
  hash-only storage and one-use recovery.
- Real browser authentication suite: initial display, security page, invalid
  password, download/copy, guard, lost-response reissue and compact viewport.
- Existing cabinet/free-route fixtures acknowledge code saving explicitly.
- Independent review; syntax and whitespace checks; exact-head CI including
  the production Alpine runtime; current-main and merged-tree verification.
- Final gate: `TEACHER_RECOVERY_CODES_OK`. Production checks read only public
  assets/health and the authenticated empty Security form, never real codes.

## Risk and rollback

Issuing new codes invalidates older ones, including after a lost network
response. This is explained before issuance; repeat issuance requires the
current password. Reverting the code to the parent release preserves the
database, password, sessions and latest code hashes. There is no schema change.
Do not restore a stale database or reissue the first-teacher bootstrap token.
Real password entry and saving replacement codes are a private manual handoff.

## Execution record

- Backend: 132/132 passed, including nine new rotation cases.
- Authentication browser regression: `LEARNING_AUTH_BROWSER_OK` passed with
  synthetic credentials and real HTTP/SQLite; no production credentials used.
- Existing cabinet and free-route browser regressions passed. The auth suite
  also passed after adding a delayed-response regression: navigation while
  issuing codes cannot open an overlapping pupil-credential dialog; failed
  requests resume the deferred route with their error visible.
- Independent review found and closed that overlapping-dialog race. Exact-head
  CI and publication evidence are recorded in the PR before release.

# Personal pupil QR and clickable entry

## Identity and permission

- Date: 2026-10-09 (Asia/Novosibirsk).
- Base: `main`, `64c1079e0f2e73ad77d9fbd1d58526be5517246d`.
- Branch: `feature/student-qr-entry`.
- Review: HIGH; an optional pupil authentication method and durable grants.
- The owner explicitly requests pupil entry without typing login/password,
  usable on both phone and laptop. Standing publication authorization and the
  explicit external-review waiver apply. Independent internal review and the
  full relevant security/browser gates remain required.
- Related accepted architecture: ADR 0010. This adds a bounded optional pupil
  credential within its existing owner, session, cookie and storage boundaries.

## Verified context

The existing invitation requires setting a password. Encoding that invitation
as a QR image would not meet the requested outcome. Teacher-created pupils can
still be pending with no password hash. Independent decoding rejected the
legacy encoder, so this cabinet uses a locally vendored, MIT-licensed
`qrcode-generator@1.4.4`; the unrelated legacy trainer file is unchanged.

PR #213 is published as the base above. Pages run `37887767769` passed;
ordinary consumer URLs and all versioned assets matched reviewed bytes, and a
returning browser loaded the new decimal instruction after a normal reload.

## Scope

- An owned pupil can receive an optional private QR/link valid for 30 days.
  It is reusable across devices and can be replaced or disabled by its teacher.
- The QR and clickable link carry the same unpredictable bearer credential.
  It grants only that pupil's existing account, not teacher or peer access.
- An anonymous, exact-Origin JSON POST exchanges the credential for an ordinary
  Secure/HttpOnly/SameSite session. A valid existing session cannot be silently
  replaced. Pending pupils may use this method without a fabricated password.
- Store only a token hash, pupil identity, auth epoch, expiry and version.
  Bind each QR session explicitly to its grant; missing, expired or revoked
  grants must fail even if the pupil also has a password. Session lifetime must
  not exceed the grant lifetime. Password/recovery epoch changes invalidate QR.
- Teacher issue/revoke requires current authentication, ownership, Origin,
  CSRF and expected-version checks. A lost response does not trigger an
  automatic replacement. Plain tokens never enter idempotency receipts.
- Copy, QR rendering and download are local to the cabinet, with a guarded
  one-time credential card. Remove `#quick` from the address before async work;
  keep the value out of browser storage, trainer messages, logs and analytics.
- Use a locally bundled encoder with retained license and provenance, and
  independently decode the actual displayed SVG and downloaded PNG.
- A private shareable card can offer a scannable QR and clickable button for
  use on the same phone or a laptop. Actual learner names, tokens and exported
  private cards are outside Git and public documentation.
- Preserve account identity, ordinary password authentication, lesson state,
  homework, results and teacher credentials. This task does not assign work or
  diagnose learners from their photographs.

## Acceptance and tests

- First entry without login/password for a pending synthetic pupil.
- Separate phone-width and desktop browser contexts reach the same account
  and see the same saved work. Independent QR decoding matches the intended
  synthetic link; no external QR service is called.
- Another teacher/pupil, CSRF and Origin failures, invalid token payloads,
  rate limits, expired grants, stale versions, replacement, revoke, password
  change and SQLite reopen are covered by meaningful backend tests.
- Existing signed-in teacher and pupil identities are preserved on QR entry;
  no hidden account switch occurs. Raw credentials never reach browser storage
  or request URLs, and protected copy/save/discard flows remain usable.
- Existing backend tests and authentication/cabinet browser tests pass. The
  new browser gate is wired into the existing unified-learning workflow.
- Syntax, scoped diff, independent HIGH review, exact-head CI and production
  byte/UI verification are required before reporting publication complete.
- Final marker: `LEARNING_QUICK_ACCESS_OK` after the combined checks pass.

## Risks and rollback

The private card is an account key: anyone holding it can use that pupil's
account until expiry or teacher revocation. The UI explains this directly and
offers replacement/disable. No secret is published with the application.

Migration must be additive and preserve existing databases. Prefer a separate
session-binding table so the previous binary's four-column sessions INSERT
remains compatible. Grant removal cannot remove the session's method marker
while leaving a usable session behind. Before rolling back authentication
support, disable QR grants and delete their bound sessions, retaining ordinary
password sessions and all learning history. Keep any required migration or
rollback compatibility in the final operational notes.

## Execution

- Authoritative remote main and fresh fetch confirmed the base above.
- Local implementation and independent HIGH review passed with no remaining
  blockers. Full backend: 199/199 tests; focused independent review: 47/47 plus
  missing-grant, expiry, two-device and rollback probes.
- Existing authentication and cabinet browser gates passed. New
  `LEARNING_QUICK_ACCESS_BROWSER_OK` covers actual SVG/PNG decoding, pending
  pupil entry, separate phone/desktop sessions sharing saved work, copy and
  discard guards, three authentication races, lost issuance response, stale
  revoked-session reentry, replacement, revocation, expiry and secret hygiene.
- Syntax and `git diff --check` passed. Initial unreadable QR output and
  authentication races were fixed before the passing final run.
- `LEARNING_QUICK_ACCESS_OK`: local gate passed. Exact-head CI and production
  deployment verification remain release gates.
- No production QR credential has been issued by this task yet.
- Real-pupil and non-Chromium testing are not substitutes for synthetic checks
  and are not claimed. No external review is claimed.

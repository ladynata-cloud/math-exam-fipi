# Easier pupil sign-in

## Identity and permissions

- Date: 2026-10-06 (Asia/Novosibirsk); review level HIGH (authentication).
- Base: `main` at `c8773ed06358121756e4d10658453105cf057639`.
- Branch: `fix/short-student-passwords`.
- Related architecture: [ADR 0010](../adr/0010-unified-learning.md), Accepted.
- The owner requested shorter learner credentials for easier first use.
  Implementation and publication use standing explicit authorization; separate
  external review was waived. Independent local review is retained.

## Goal and scope

Allow pupil passwords of 8–128 characters in teacher provisioning and pupil
invitation activation. Offer eight random digits in the pupil form for easier
typing, including leading zeroes. The generated value remains private, with
manual confirmation and delivery by the teacher. Do not record actual passwords
or suggest personal information as a password.

The teacher's password-setting and recovery policy remains 12–128 characters.
The server derives the role from a validated invitation or the teacher-only
student-creation operation, never a caller-selected role. The generic invitation
form states both policies; the server enforces the appropriate one. Login
verification accepts the supported shorter length, including the same expensive
comparison for unknown accounts. Existing salted scrypt hashes, rate limits,
session revocation, Origin and CSRF protection remain intact.

No new endpoint, schema, account migration, public registration, actual pupil
provisioning, forced password change or teaching-data mutation is part of the
automated implementation. Real credential creation is a private UI handoff.

## Acceptance and validation

- Student creation and invitation activation accept eight characters and reject
  seven; maximum 128 is preserved. Teacher activation and recovery reject eight
  or eleven characters and still accept twelve or longer.
- Request-supplied role or policy fields cannot select a weaker teacher policy.
- New eight-character and existing longer passwords both sign in; wrong
  passwords do not. Passwords are persisted only as existing scrypt hashes.
- Teacher form uses an unbiased cryptographic eight-digit generator; copying,
  login and activation preserve leading zeroes. Generic login has no obsolete
  twelve-character client restriction. Error text matches the role's policy.
- Full backend suite, real HTTP/SQLite auth browser regression, existing cabinet
  regression, syntax checks and whitespace checks. Independent HIGH review,
  exact-head CI including the production Alpine image, unchanged authoritative
  main before merge, complete merged-tree identity and public asset verification.
- Final gate: `SHORT_STUDENT_PASSWORDS_OK`.

## Risk and rollback

Shorter passwords provide less resistance to guessing; generation remains
random and per-login/source attempt limits remain enforced. Existing credentials
are never shortened automatically. Pupil access still cannot reach teacher or
other pupil data.

After the first shorter password is issued, a plain revert to the parent server
would reject it at login. A safe rollback must retain the compatible eight-
character password verifier while reverting provisioning/UI behavior. Do not
restore stale data or reset accounts. Returning all pupils to a longer minimum
would require separately authorized private credential renewal, not a migration
that guesses or modifies their passwords.

## Execution record

- Full backend suite passed: 140/140, including eight new password-policy cases.
- Real HTTP/SQLite auth browser and existing cabinet browser gates passed. The
  tests include generated and leading-zero passwords, pupil route entry,
  activation, teacher minima and the preceding recovery-code guards.
- JavaScript syntax and whitespace checks passed. Independent HIGH review and
  exact-head CI/release evidence are recorded in the PR before publication.
- No actual pupil account has been created by this task. All test credentials
  are synthetic; no real credential is present in repository artifacts.

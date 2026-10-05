# Save and recover pupil access reliably

## Identity and authorization

- Date: 2026-10-06 (Asia/Novosibirsk); review level HIGH (credentials).
- Base: `main` at `f2397dfca606a72ff46fe1fa3461196974736a9a`.
- Branch: `fix/student-access-card`.
- Related architecture: [ADR 0010](../adr/0010-unified-learning.md), Accepted.
- The owner reported being unable to copy the first pupil's credentials and
  losing the displayed card. Existing authorization covers fixes, account
  setup and publication without separate external review. Independent review
  remains required. Real new-credential confirmation is a private manual step.

## Evidence and goal

Synthetic real HTTP/SQLite/Chromium checks confirm that the green button copies
the complete credential text when clipboard permission is granted. When denied,
the only feedback is a global toast behind the modal; on a compact viewport it
is almost entirely hidden. The handler itself does not close the card. The
owner's precise clipboard failure and reason for closing are not established.
Transmission between a cloud browser's clipboard and a local computer is not
guaranteed by a successful browser write.

The first real pupil now exists in the authenticated roster. Its previous
plaintext password cannot be recovered from the server, which stores a hash.
Provide visible copying feedback, explicit save/discard acknowledgement and a
teacher-controlled replacement password for the same pupil identity.

## Scope and acceptance

- Copy status and failure handling appear inside the pupil credential card.
  Provide selectable combined text for manual copying. A clipboard success
  does not automatically assert that the owner saved the credentials.
- Protect pupil cards from incidental X, Escape, backdrop, route changes,
  modal replacement and logout until deliberate save/discard acknowledgement.
  Warn before unload; do not cache credentials in URLs or browser storage.
  Preserve existing teacher recovery-code protections.
- Teacher can set a new 8–128-character password for an owned pupil from
  «Новый вход». Preserve the existing invitation option. Reuse the eight-digit
  cryptographic default and the guarded result card.
- New POST `/teacher/students/:id/password` accepts exactly the password,
  checks teacher ownership, Origin and CSRF, hashes asynchronously, then
  atomically revalidates the teacher session and target credential snapshot.
- Replace only the target password hash and increment its authentication epoch;
  revoke its sessions and old pending invitations. Preserve its account ID,
  plans, assignments, work and history, and preserve other accounts' access.
  Never return or persist the new plaintext password on the server.
- Prevent overlapping credential flows during a pending request. Lost responses
  can be resolved by another explicitly confirmed teacher-issued password;
  never automatically retry credential mutations or create duplicate pupils.
- No actual password is read, copied, reset or submitted by automated testing.
  No messages are sent to the pupil or parent.

## Checks and review

Full backend suite; dedicated authorization, isolation, revocation, asynchronous
race, rollback and durable hash-only tests. Real browser scenarios cover allowed
and denied clipboard access, manual selection, saved/discard guards, compact
layout, existing-pupil password replacement and delayed/lost responses. Existing
cabinet and free-route fixture regressions remain required when affected.
Run syntax and whitespace checks, independent HIGH review, exact-head CI with
the production Alpine image, current-main and full merged-tree verification,
then public assets/health and non-secret live UI verification.

Final gate: `STUDENT_ACCESS_CARD_OK`.

## Risk and rollback

A successful replacement immediately invalidates the pupil's previous password,
sessions and invitations, including if its response is lost. This is explained
before submission; another teacher-confirmed replacement restores known access.
The teacher's own session and all pupil learning history are preserved.
Rollback to the parent code retains the database and newly issued password:
the parent already supports eight-character pupil credentials. Its invitation
flow remains available for future recovery. Do not restore stale data or reset
accounts. There is no schema migration.

## Execution record

Diagnostic clipboard tests passed with synthetic credentials, exposing the
hidden-feedback defect. Full backend suite: 151/151, including 11 new real
HTTP/SQLite tests. Independent HIGH review found and resolved a persisted-page
return edge, then passed with no unresolved blockers; it independently reran
the 11 new backend cases. Auth, cabinet and free-route browser gates cover the
new card and existing workflows. Final exact-head CI and publication evidence
are recorded in the PR. Production pupil credential confirmation remains manual.

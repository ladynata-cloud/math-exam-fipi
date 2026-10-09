# Independent pupil entry and parent progress

## Identity and authorization

- Date: 2026-10-09 (Asia/Novosibirsk).
- Base: `main`, `df325b0a73efa1b516e5b81aef9125f1b952e6ff`.
- Branch: `feature/family-progress-entry`.
- Review: HIGH, authentication, authorization and private learner progress.
- The owner requests sending a personal page where the pupil chooses their
  own entry code, and a separate parent account to follow that pupil's progress.
  Standing publication permission and the explicit external-review waiver
  apply; independent internal review and all relevant gates remain required.
- Architecture: accepted ADR 0010, scoped family-access addendum.

## Verified context

The existing private pupil invitation already supports independent activation
with 8–128 characters, including digits only. First invitations last three days;
replacement pupil invitations currently last only thirty minutes, which is too
short for an asynchronously sent entry page. Teacher password policy remains
12–128 characters. Opening an invitation does not consume it; activation does.

The core accounts table permits only teacher/student roles and is referenced
throughout learning history. A parent must not be represented as a pupil or
teacher. The existing teacher report contains private notes, drafts and AI
preparation; it cannot be exposed as a parent report.

PR #215 is published on the base above. Reviewed and merged tree was
`0d610444e60cf84c9dd1288c038fa406f0eb8afb`; both exact-head workflows and
Pages run `37920488893` passed. Pages and Amvera served the reviewed assets;
the existing teacher session and new owned-pupil QR metadata dialog worked.
No real QR credential was issued in that task.

## Scope

- Keep the existing pupil account and its history. Clarify self-chosen entry
  wording without changing pupil or teacher password requirements. Replacement
  pupil invitations last three days and remain single-use.
- Guard displayed pupil invitations against accidental loss, with copying,
  selection fallback and explicit save/discard acknowledgement.
- Add one parent account per pupil for this first family-access version. Every
  teacher-owned pupil may have its own parent account; eight is not a roster
  limit. Multiple independent parent accounts per pupil are outside this task.
- Use additive parent account/invitation/session tables in the same durable
  database, a separate private cookie, and dedicated `/parent/*` API routes.
  Core accounts, sessions and their role constraints stay unchanged.
- Parent entry is `/learning/parent.html`. A teacher issues a three-day private
  invitation; the parent chooses a 12–128-character password and receives a
  thirty-day session. Only hashes are retained. No public account claiming.
- Teacher issuance and revocation require ownership, current teacher session,
  Origin, CSRF, expected version and an atomic authorization check. A lost
  response cannot automatically create a duplicate or replace an invitation.
- The parent sees only their bound pupil's allowed progress and published
  homework. Construct a fresh allowlisted projection; never forward an existing
  teacher report or fabricate a student/teacher authentication principal.
- Exclude private focus notes, plans, drafts, AI text, raw answers/state/events,
  solution keys, photos and their URLs, peers, classrooms, archived work and
  unfinished exam attempts before aggregation. Counts describe attempts rather
  than mastered topics. Label bounded recent-work lists accurately.
- The parent can view, refresh and sign out, but cannot submit answers, change
  assignments, reset results or control a board. Parent routes terminate before
  generic learner middleware; parent cookies never authorize learner APIs.
- Parent password/revocation affects only parent sessions. Pupil password/QR
  replacement does not revoke the parent. Recheck ownership and enabled status
  on every parent read. Preserve existing valid actors during authentication.
- Invitations are removed from the fragment before asynchronous work and never
  stored in browser storage, sent to trainer frames or placed in logs/receipts.
- Actual learner/parent names, private links and credentials remain outside Git.
  Creating live family access and sending messages are not automatic tests.

## Gates

- Backend tests: ownership, isolation, strict request shapes, Origin/CSRF, CAS,
  hash-only storage, expiry, revocation, activation/hash races, login limits,
  SQLite reopen, additive compatibility and safe dashboard projection.
- Browser tests using real HTTP/SQLite and synthetic accounts: pupil chooses
  own code; parent activates on personal page; two devices see the same updated
  work; student/teacher sessions remain intact; parent cannot mutate learner
  work; no drafts/private fields; lost responses, card guards and mobile layout.
- Existing backend, auth, QR and cabinet gates; new family browser gate wired
  into unified-learning CI. Production routing must be exercised.
- Syntax, `git diff --check`, independent HIGH review, exact-head CI and the
  fresh authoritative-main merge guard. Confirm reviewed tree and deployed
  asset identities, then inspect live teacher and parent entry UI.
- Final marker: `LEARNING_FAMILY_ACCESS_OK` after relevant checks pass.
- No claim of real-pupil or non-Chromium testing without actual evidence.

## Risks and rollback

An invitation is a temporary private account key. The parent account exposes
one child's educational progress, so projection and ownership tests are release
gates. Issuance/revocation must not modify the child's account or historical work.

Keep all new tables additive; do not rebuild the core accounts table. On a
rollback, stop the app, retain a verified database backup, disable parent
accounts and invalidate their invitations/sessions through a documented
transaction, then start the previous application. Keep learner history and
ordinary teacher/student access. Old code must ignore the added tables.

## Execution

- Fresh authoritative main and local fetch matched the base; clean worktree
  created for this task.
- Implementation complete: additive isolated parent accounts, guarded personal
  invitations, a read-only parent dashboard, pupil return links and three-day
  pupil replacement invitations. The existing cabinet browser gate now follows
  the intentional invitation save acknowledgement instead of an unguarded close.
- Full backend suite passed 209/209; dedicated family tests passed 10/10.
  Existing auth, QR and eight-seat cabinet browser gates passed. The new parent
  gate exercised the real production router, two devices, a 390px viewport,
  published-work privacy, separate cookies, pupil/parent reset independence,
  lost responses and actor-preserving authentication.
- Independent HIGH review verified the projection, ownership, namespace and
  credential boundaries, plus an actual parent-only rollback probe. Final
  exact-tree review, exact-head CI and production evidence belong in the PR.
- The existing security expiry test now checks the authorized three-day pupil
  invitation boundary, including validity immediately before expiry. No gate
  or security assertion was removed.
- No production parent account or new private invitation has been issued.

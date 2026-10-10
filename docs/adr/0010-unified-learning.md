# Permanent learning accounts and one continuous attempt

Status: Accepted

Date: 2026-10-05

Related task: [unified learning workspace](../tasks/unified-learning-workspace.md).
The owner accepted publication and activation of this implementation on
2026-10-05 (Asia/Novosibirsk): «разрешаю публиковать и включить кабинеты без
отдельной внешней проверки». This is acceptance of the scoped account/classroom
archetype and an explicit external-review waiver, not an external review verdict.
The owner clarified that eight is a per-lesson limit, not the size of the
permanent student roster. The implementation supports new permanent accounts
and multiple separately composed lessons.

## Design

The cabinet is served by the board backend at `/learning/`, on the same origin
as `/api/learning`. Sessions use private HttpOnly, Secure, SameSite=Strict cookies
and exact Origin plus per-session CSRF validation. There is no public teacher
registration. A local operator command issues a one-use first-teacher invitation;
teachers invite their own learners. An optional hosting bootstrap secret creates
the first unactivated teacher only when no teacher exists. Before first activation,
changing that private hosting secret can replace the pending invitation for the
same normalized login. This operator repair preserves the account identity and
revoked token hashes, never extends an unchanged token's lifetime, and cannot
reset or reactivate an activated account. Recovery consumes one-use credentials and
revokes existing sessions. Account credentials never enter trainer frames.

An authenticated teacher can replace lost recovery codes by confirming the
current password through the same-origin, CSRF-protected cabinet. Verification
is rate-limited per account before password work; an atomic post-verification
session/password/epoch check fences concurrent logout or password recovery.
Issuance replaces all previous code hashes while preserving passwords and
sessions. Codes are displayed once, with an explicit save/discard acknowledgement;
they are never cached in browser storage. Actual account recovery retains its
session-revocation behavior.

Trainers remain on the separate public site origin. Each allowlisted frame uses
an instance/channel-bound postMessage protocol and receives only a task and its
work state. Same-origin frames are forbidden in the account cabinet. An existing
anonymous group frame's direct DOM access is not reused as an account boundary.

One SQLite database owns accounts, sessions, invitations, assignments, attempts,
lesson seat references, events and idempotency receipts. Mutations are atomic and
acknowledged after durable commit. Rollback journal, foreign keys and full
synchronization are enabled. This is a bounded single-instance deployment.
The existing anonymous group journals and progress service retain their contracts.

Use the minimal `DatabaseSync` API from Node 24 LTS. Node 20 has reached EOL.
The Node SQLite API is release-candidate stability from 24.15, an explicit
dependency risk; it avoids another native build dependency. Pin and test the
runtime and isolate all access in the store module. No untested recent API is used.

Passwords use asynchronous salted scrypt with a bounded work queue. The
N=32768, r=8, p=3 setting follows OWASP's 32 MiB CPU/memory trade-off. Token hashes,
not raw session or recovery tokens, are stored. Database/backup permissions are
private. Logs and exported teaching history exclude authentication material.

Pupil passwords may contain 8–128 characters; teacher password creation and
recovery retain 12–128. The server selects this policy from the established
account role, not a client field. The teacher's pupil-creation form suggests
eight cryptographically random digits for easier typing, without forcing a
numeric-only password. Existing login/source attempt limits remain enforced.
Login verification supports both existing long passwords and newly allowed
shorter ones. A rollback after shorter passwords have been issued must retain
that verifier compatibility; reverting to a twelve-character login check would
lock those pupils out.

A teacher can also issue a replacement password directly for an owned pupil.
This has the same account-recovery authority as the existing private invitation
flow. Origin, CSRF, role and ownership checks precede hashing; an atomic current
teacher-session and pupil credential-snapshot check fences concurrent logout,
recovery or replacement. Only that pupil's sessions and pending invitations
are revoked. Its identity and learning history are preserved. The server stores
only the hash; the issuing browser displays the plaintext in a guarded private
card with visible copy status and explicit save/discard acknowledgement.

## Optional pupil QR entry (2026-10-09)

The owner explicitly requested a pupil QR/link that opens the same cabinet on
phone or laptop without typing a login or password. This is an optional
teacher-issued credential for one owned pupil, including an unactivated pupil;
it does not add a teacher sign-in method or bypass account ownership.

The reusable grant has a 30-day expiry, a cryptographically random secret stored
only as a hash, an auth epoch and a monotonically increasing version. QR and
clickable link share the same credential. The cabinet removes the URL fragment
immediately and exchanges the value by exact-Origin POST for its usual private
cookie. Existing authenticated accounts cannot be silently replaced. QR pixels
are generated locally; no external service receives the secret.

An additive session-binding table records which sessions depend on which grant.
Grant deletion, expiry or revocation never turns those sessions into password
sessions. Rotation/revocation deletes the old QR sessions and preserves ordinary
password sessions. Password/recovery changes invalidate grants through the auth
epoch and version fence. Issuance and revocation require the current teacher
session, ownership, CSRF and expected version. Raw tokens are displayed once and
never stored in operation receipts or browser storage. A lost issuance response
requires explicit replacement after refreshed metadata; no hidden retry mints a
second credential.

Before rollback to a version without this feature, revoke QR grants and their
bound sessions as described in `docs/learning-quick-access.md`. Existing session
table shape and normal login remain compatible; learning data is preserved.

## Scoped parent progress access (2026-10-09)

The owner subsequently requested independent pupil activation and a separate
parent entry for following the same pupil's progress. Pupil self-activation
continues to use the existing invitation protocol and password policy;
replacement invitations now allow three days for asynchronous delivery.

Parent identity is isolated in additive tables and a separate private session
cookie on a dedicated parent page/API. No parent is inserted into the existing
teacher/student role model, and no core accounts table is rebuilt. One parent
account per pupil is supported in this bounded version. Only the owning teacher
can invite, replace entry or revoke access; the parent chooses their own
password. Existing teacher/student sessions are unaffected.

Every parent read validates the enabled account, auth epoch and current binding
to a teacher-owned pupil. A newly constructed allowlisted DTO exposes current
progress and published homework, excluding teacher-private and raw learner
content, other pupils, archived work and unfinished exams. The parent has no
learning or classroom mutation capability. Parent routes cannot fall through
into generic learner authentication, and parent cookies never satisfy it.

Hash-only invitations, bounded expiry, atomic version checks and guarded
credential display follow the existing account boundaries. Parent revocation
invalidates only parent sessions; child password/QR changes are independent.
Rollback disables parent credentials while preserving all learner accounts and
history. See [the scoped task](../tasks/FAMILY_PROGRESS_ENTRY.md).

## Clear family cabinet entrances (2026-10-10)

The owner requested a clearer version of the existing account system. Role
choices and teacher-only route hints express the intended destination; they
never grant a role. Login validates an optional expected role only after valid
credentials. Optional identity headers fence authenticated requests against
cookie changes in other tabs, and the client clears cached account data before
adopting another identity. Existing clients remain compatible.

Teacher preview reads only owned-pupil reports, profiles and plans, retaining
the teacher session and creating no pupil attempts. Permanent login links are
separate from credential replacement. Newly issued pupil activation/recovery
and parent invitations now last seven days, superseding the three-day policy
above without changing existing rows. Used, revoked and expired invitations
retain their original enforcement; owned metadata can display expiry.

The pupil's next action prioritizes published homework and unfinished work,
then the teacher's plan. Only server-committed managed work is shared with the
teacher and parent. Public browser-local exercises remain identified as such.
See [the scope and rollback](../tasks/CLEAR_FAMILY_CABINETS.md).

## Simple teacher recovery and ready pupil passwords (2026-10-10)

The owner requested password recovery without requiring saved recovery codes,
and ready passwords that the teacher can hand to pupils. This scoped update
uses the existing session and private hosting-operator authority.

A currently authenticated teacher can set a new 12–128-character password
without the old password. Exact Origin, CSRF, account identity and rate limits
remain enforced. The transaction rechecks the original session and credential
epoch after asynchronous hashing. It preserves that session token and original
expiry, so a lost acknowledgement does not lock out the open cabinet; other
teacher sessions and old recovery proofs are revoked. Learning data and family
sessions are unaffected. Recovery-code rotation remains optional.

Without a current session or saved code, a verified hosting operator can issue
a one-hour, single-use link for the existing active teacher. Its distinct
`teacher-recovery` purpose is accepted only by the recovery endpoint, never by
ordinary activation. A new private 0600 file receives the raw URL; stdout and
the database do not retain the token. Issuance alone does not change credentials.
Only explicit submission of a new password consumes the proof, replaces the
same account's password, revokes old teacher sessions and starts a normal one.
GET navigation never changes a pupil's cookie. Automatic email is not configured.
See [operator and rollback instructions](../unified-learning.md).

New pupils receive a teacher-chosen or suggested ready password as the primary
flow. The one-time private card includes the entry link, login and password.
Its enabled **Done** button replaces the earlier mandatory save/discard
acknowledgement for ready pupil passwords only. Plaintext is cleared on closing
or leaving and never persisted in browser storage or receipts. Opening existing
pupil access remains read-only until the teacher explicitly requests replacement.
Existing invitations, QR entry and parent behavior remain compatible.

## Educational identity

An immutable task specification plus mutable work forms one attempt. An assignment
and a lesson seat reference its ID rather than clone its progress. A shared task
clones its initial specification into separate learner attempts. A new analogous
task has a new attempt and explicit lineage. Topic and exam-position navigation
are projections of the same content catalog.

Server-side checks compute results from the pinned task, not client completion
flags. Teacher edits and teaching hints are recorded as assistance; observation,
takeover alone and opening the allowed full reference sheet are not. A new
independent repetition is distinct from reopening an already answered problem.
Correctness on one task does not assert mastery of a whole exam position.

Semantic snapshots contain exact input, current step, model data and feedback.
They exclude the entire course portfolio. Restore is silent and never chooses a
new random condition. Unsupported trainers remain explicitly outside the managed
catalog until their state and mathematics pass the same checks.

Grade-7 tasks can use this same managed Path family with a null exam position
and an explicit training-only marker. Their deterministic definitions, numeric
or labelled-choice answers and bounded diagram selections follow the same
snapshot validation and server grading as existing tasks. A public practice
view and a cabinet view share task definitions, but browser-local public work
does not silently become a server attempt. Existing school-workshop records
remain separate. Adding a task is not evidence of completing a textbook.

## Synchronization

Every command has an actor-scoped operation ID bound to its canonical contents.
A retry returns the original receipt. Reuse with different content is rejected.
A global revision orders history, while a separate trainer revision fences
trainer state and control. Authored ink and neutral reference events commute
without invalidating a simultaneous learner input. Expected versions prevent
stale browser snapshots or queued descendants from
overwriting current work. A conflict preserves the rejected draft for the user
and requires an explicit reload; it is not automatically rebased.

An account lesson contains at most eight private learner seats and an explicit
presentation target. Teacher sees four previews per page. Each learner sees their
own task and a read-only projection of the presented workspace, without peer
credentials or private history. Drawing records its author; undo/erase affects
only that author's strokes. Joint trainer control uses an explicit controller.

## Homework, resets and verification

Homework is first a draft with an online attempt and at least one task photo.
Publishing requires both. Private image access follows assignment ownership;
validated images are decoded, oriented, recompressed without metadata and
stored once per content hash. Student solution photos are manually reviewed;
manual approval cannot mint an independent trainer outcome.

A scoped reset archives selected attempts and assignments, appends an audit
record, closes active editors and cancels affected practice exams. It never
erases history or another learner's results. AI support exports a minimized,
pseudonymized numerical history and accepts validated recommendations as drafts.
The teacher explicitly chooses what becomes a plan, homework or parent report.
No external AI service or parent-messaging channel is invoked.

The 21-question practice exam pins eligible catalog tasks, hides answer material
until completion, then grades atomically. It records concurrent assistance and
seen conditions. The allowed full reference sheet remains neutral. A clean
practice result is evidence about those questions, not exam certification.

Backups use a verified SQLite snapshot with private permissions; restoration
requires a new destination and cannot overwrite an existing database. Production
uses pinned Node 24.21.0 and locked dependencies; CI builds the actual Alpine
image to exercise SQLite and the native photo codec together.

## Sources checked during design

- https://nodejs.org/en/about/previous-releases
- https://nodejs.org/docs/latest-v24.x/api/sqlite.html
- https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html

## Rollout and rollback

Implementation remains additive until owner acceptance and release approval.
The database path, canonical cabinet origin, trainer origin and one-replica volume
configuration are checked before activation. Backups/restoration are tested with
synthetic local accounts. Rolling back the new feature does not delete its data
or modify old group journals. Production write tests require their own explicit
authorization; read-only health checks establish availability only.

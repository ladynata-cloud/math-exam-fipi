# Permanent learning accounts and one continuous attempt

Status: Proposed

Date: 2026-10-05

Related task: [unified learning workspace](../tasks/unified-learning-workspace.md).
The owner authorized implementation, not yet rollout of this archetype.

## Design

The cabinet is served by the board backend at `/learning/`, on the same origin
as `/api/learning`. Sessions use private HttpOnly, Secure, SameSite=Strict cookies
and exact Origin plus per-session CSRF validation. There is no public teacher
registration. A local operator command issues a one-use first-teacher invitation;
teachers invite their own learners. An optional hosting bootstrap secret creates
the first unactivated teacher only when no teacher exists; it cannot reset or
reactivate an existing account. Recovery consumes one-use credentials and
revokes existing sessions. Account credentials never enter trainer frames.

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

# Group lessons with independent learner workspaces

Status: Proposed

Date: 2026-10-05

Related task: [group-board-eight](../tasks/group-board-eight.md).

## Context

A teacher needs to observe several simultaneous solutions without moving every
learner through the same trainer state. The existing individual/mirror board
does not itself define private group seats, a lesson-wide event journal or the
new authorization boundary. Treating a shared browser or a copied room token as
independent student work would mix authorship and access.

## Proposed decision

Introduce an additive group-board route and an isolated group lesson API. A
lesson contains 1–8 private workspaces and one common workspace. The teacher can
access all of them; each student token grants only that seat and read-only
access to the common workspace, plus a scoped read-only snapshot of the work
the teacher explicitly presents. The teacher interface renders four previews
at a time. Ordinary focus changes do not change the learners' own task.

The owner's later request adds two learner views: their own task and "Наталья
Михайловна объясняет". On desktop the explanation is a read-only pane beside
their own work; on smaller screens tabs preserve each view, with an option to
expand the explanation. "Объяснять группе" starts presenting the selected
common or learner workspace. While presentation is active, changing teacher
focus explicitly follows that mode and retargets the shared view. "Завершить
объяснение", returning to the overview, or entering history stops presentation.
Visible status identifies the shared work so focus-following is not confused
with private observation.

A teacher-only `present` action with `payload.target` (workspace ID or `null`)
persists the presentation selection. Snapshots include `presentation` containing
only the currently published workspace and its name. Non-owner viewers receive
no other peer workspaces, invitations or private history and cannot write to
that workspace. The selected learner and the teacher may both add authored
strokes; presentation does not change trainer control or require taking it from
the learner. The existing explicit takeover/return remains the only handoff.

Group assignment captures one initial pilot-trainer state and clones it into
new independent assignments. Each assignment receives a new identifier. A new
assignment clears its current trainer/handwriting workspace; the journal retains
the preceding assignment. Trainer writes require both the current assignment
and the observed trainer version. Only the current controller may write trainer
state. The teacher explicitly takes and returns control. Handwriting is a
separate authored stream; teacher and learner can add strokes, but can erase or
undo only their own strokes.

The first adapter supports exactly two existing bridged trainers:

- `negative-numbers-line`;
- `linear-inequalities-stepwise`.

The adapter restores their state and uses the existing bridge, with explicit
same-origin/source/instance checks. Group activity must not be confused with
standalone local statistics. Supporting these two schemas is pilot evidence,
not a general compatibility claim.

## Persistence and synchronization

`GroupLessonStore` uses an explicit `GROUP_LESSON_STORE_DIR`. Without it the
capability is unavailable: there is no fallback that claims durable storage in
memory or a temporary directory. Exactly one server process owns the directory
using a lock. This is not a distributed lock or a multi-replica architecture.

Each lesson is a versioned JSONL header followed by ordered actions. The server
appends and calls `fsync` before applying or acknowledging an action. Creation
uses a temporary file, file sync, rename and directory sync. On restart it
reconstructs state and deduplication from the journal. An incomplete final line
from an unacknowledged append is discarded; invalid durable data or write errors
make the group store unavailable instead of silently returning empty work.

An `opId` bound to the action content makes retries idempotent. A reused ID with
different content is rejected. Assignment/version checks prevent late input
from overwriting another assignment or a teacher's newer correction. The client
retains queued and rejected actions in session storage and exposes them in its
export; that local queue is not a substitute for a server acknowledgement.

Polling with `after=<revision>` returns current seat statuses and only changed
workspaces. It omits invitations. The presentation projection updates when the
selected workspace changes, its contents change, or presentation stops;
unchanged projections can omit their workspace. Presentation selection is
restored on server restart, so stopping the explanation is an explicit action,
not a promise tied to a teacher closing a browser. `events-v1` history returns bounded pages of
action records and a starting workspace, not a complete board snapshot after
every stroke. `through=<revision>` fixes the history boundary while learners
continue working. Replay is read-only and separate from the live workspace.

Default bounds are eight students, 500 lessons, 64 MiB per lesson, 512 MiB for
the store, 100,000 events per lesson and 3,000 current strokes per workspace.
Action/state sizes and points per stroke are also bounded in code. Reaching a
bound rejects new writes while preserving confirmed work; it does not prune the
record or increase storage automatically.

## Access and operational consequences

Teacher and student links are distinct bearer credentials. The browser reads
the token from the fragment, keeps session access locally, and removes the
fragment from the address bar. API access uses `Authorization: Bearer`, never
query-string tokens. The server stores a teacher-token hash and recoverable
student tokens for invitations. Raw journals and backups therefore require
private access and must never be logged or attached to review material.

There are no accounts, token-rotation workflow, public lesson directory or
teacher-link recovery system in this pilot. Possession of a link grants its
role. Rate limits bound requests, including lesson creation; they do not create
an account-based admission system. Lesson export excludes access links/tokens
but contains names and student work.

Synchronous durable appends and in-memory replay are a bounded pilot choice.
Larger scale, multiple server replicas, retention/deletion policy and database
migration need a separate design. A persistent volume and verified private
backup/restore are prerequisites for an authorized rollout. This change does
not configure the production volume or hosting environment.

## Alternatives and deferred work

- A single shared mirror cannot preserve independent learner attempts.
- Screen/video streaming does not provide the structured, replayable trainer
  and handwriting history required here, and is not implemented.
- Generic family adapters and an observation mode for unsupported trainers are
  possible later work. This pilot neither silently embeds unsupported trainers
  nor reports their progress.
- A shared database is a future option if the single-process boundaries cease
  to fit. The filesystem journal does not claim distributed durability.

## Validation and rollout status

Backend tests and a browser gate cover the pilot, including access isolation,
eight contexts, takeover, concurrent strokes, history, retry conflicts and
restart. The presentation extension additionally requires start/retarget/stop,
preservation of the learner's own work, denied peer writes/history, concurrent
teacher/owner strokes and desktop/mobile two-view evidence. The task/PR must
record their actual final-head results rather than carry an earlier pilot pass
onto the extended boundary. Internal
independent review is not evidence of external review.

This ADR remains **Proposed**. Implementation and a Draft PR do not accept the
archetype. `NEW_ARCHETYPE` owner acceptance, the applicable `HIGH` reviews
(external review or an explicit owner waiver with rationale), and separate
merge/deployment authorization are required before rollout. No production
success is asserted here.

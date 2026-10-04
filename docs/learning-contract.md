# Learning integration contract v1

This document records the implementation agreement; the actual server validators
and tests are authoritative. All examples contain synthetic data only.

## Content and attempts

Catalog item: `{id, trainerId, contentId, title, position, topicId, url}`.
`id` is `path:<contentId>` or `oge-basics:<contentId>`; two course views reuse it.
The catalog exposes `items`, `topics`, `byId`, `get(id)`.

Task specification: `{trainerId, contentId, id, seed, contentVersion, task}`.
The server generates and pins the full task. Browser hydration never regenerates
it. Work state is trainer-specific plain JSON, at most 64 KiB; no account data.

Server trainer module exports `list()`,
`create(trainerId, contentId, seed?) -> {taskSpec,state}`,
`normalize(trainerId, taskSpec, state) -> state`, and
`evaluate(trainerId, taskSpec, details) -> {correct,complete,assisted?}`.
`complete` means final-task correctness, not one correct guided step.

Attempt projection: `{id, learnerId, teacherId, trainerId, contentId, taskSpec,
state, strokes, version, trainerVersion, controller, assistance, outcome,
sourceAttemptId, archivedAt, createdAt, updatedAt}`.
Server computes roles, authorship and learning outcomes.

## API

Prefix `/api/learning`, same-origin cookies, JSON requests and no-store responses.

- GET `/status`, `/catalog`, `/session`.
- POST `/login`, `/logout`, `/activate`, `/recover`.
- GET/POST `/teacher/students`; POST `/teacher/students/:id/recovery`.
- GET/POST `/attempts`; GET `/attempts/:id`, `/attempts/:id/history`.
- POST `/attempts/:id/actions`.
- GET/POST `/assignments`.
- GET/POST `/lessons`; GET `/lessons/:id`; POST `/lessons/:id/actions`.
- GET/POST `/runs`; GET `/runs/:id`; POST `/runs/:id/actions`.
- GET `/assignments/:id`; POST `/assignments/:id/photos`, `/publish`, `/feedback`.
- GET `/photos/:id` (private decoded image).
- GET `/teacher/students/:id/report`, `/plan`, `/ai-package`, `/ai-drafts`.
- POST `/teacher/students/:id/reset`, `/plan`, `/ai-drafts`.

Session response includes the user's projection and per-session CSRF token;
mutations send `X-CSRF-Token`. Activation/recovery/login use exact Origin checks.
Invitation tokens arrive through a fragment and are removed from the URL before
loading third-party content. No token is sent in a query string or trainer frame.

Create/resume attempt: `{opId,trainerId,contentId,fresh:false,sourceAttemptId?,lessonId?}`.
When requesting a fresh analogue from an assigned seat, the validated `lessonId`
updates that seat to the new attempt in the same transaction.
Assignment: `{opId,learnerIds,title,trainerId,contentId,dueAt?}`. The same initial
task is assigned independently to every selected learner.
Attempt action: `{opId,expectedVersion,expectedTrainerVersion?,type,payload}`.
Types are `state`, `check`, `hint`, `reference`, `stroke`, `erase`, `undo`, `control`.
The global version orders history. `expectedTrainerVersion` fences mutable
trainer state/control; authored ink and neutral references may commute with
a stale global version. Without it the server uses strict global fencing.
A check requires `state` and `details:{scope,step?,answer,...familySpecificDetails}`
atomically. Guided Path checks require the verified prefix `answers`; completing
the last guided step is assisted even when a client omits its help flag.
Neutral reference payload is `{id?}`. Explicit erase/undo targets a stroke ID
owned by the actor. An untargeted undo requires the current global version.
Store receipts atomically with state and history. Version conflict never silently
rebases a snapshot. Token/role material is not accepted in these bodies.

## Frame protocol

Frame URL: allowlisted public trainer URL plus `learning=1`, exact `parentOrigin`
and a cryptographic per-frame `channel`. The frame origin differs from the cabinet.
Sandbox permits scripts and its own origin, but not top navigation or popups.

Message envelope:
`{protocol:'mathexam-learning',version:1,channel,instance,type,payload}`.
Child creates its `instance`. Parent verifies source, origin, channel, version,
trainer ID and instance. Child verifies exact parent source/origin/channel.

- Child `ready`: `{trainerId,contentVersion}`.
- Parent `hydrate`: `{taskSpec,state,readOnly}`.
- Child `applied`: hydration acknowledgement, not a state mutation.
- Child `change`: `{kind,details,state}`.

Browser adapter:
`MathExamLearning.register({trainerId,contentVersion,getState,applyState,subscribe,
setReadOnly?})`. `applyState` accepts the hydration envelope and is silent.
`subscribe` supplies a listener with `{kind,details,state}`. Kinds `input`,
`model`, `navigate` become state actions; `check`, `hint`, `reference` retain their
meaning. `new-task` asks the parent to create another attempt, without changing
the current seed locally. No managed action writes standalone progress.

Read-only frames continue rendering incoming states and support scrolling, but
cannot submit commands. A server controller/role check remains mandatory even
if a frame bypasses the UI lock.

## Teaching and exam boundaries

Homework creation returns private draft assignments grouped by `batchId`, one
attempt per learner. Photo upload is `{opId,kind,filename,mime,data}` with base64
input. Server revalidates session and current assignment after asynchronous
decoding. Publishing needs at least one task photo plus its online attempt.
Actual image blobs are deduplicated by hash; each assignment retains its own
private photo ID. Manual photo feedback never creates a trainer success.

Reset is `{opId,scope:'all'|'topic'|'content',value?,reason}` using canonical
catalog identifiers. It archives, versions and records the selected attempts,
archives their homework, detaches affected seats and cancels active affected
runs atomically. Archived history remains readable to authorized users.

Practice exams pin 21 eligible tasks and hide answer/model/step data until
explicit completion. Answers are versioned, retried idempotently and graded
in one transaction. Direct learner access to active exam attempts is blocked.
Assistance elsewhere during the run and previously seen conditions are recorded.

AI packages are pseudonymized teaching exports, not credentials or photo exports.
Validated catalog recommendations and parent prose are persisted as drafts.
Saving a plan or assigning homework remains an explicit teacher command.

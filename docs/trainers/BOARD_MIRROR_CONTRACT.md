# Board Mirror Contract v1

`board-mirror` trainers are plain iframe trainers. They do not connect to Socket.IO and do not know teacher/student tokens. The board page is the only bridge to the room server.

## Outgoing State

When a trainer changes visible task state, it posts the current state to its parent:

```js
window.parent.postMessage({
  type: "mathexam:trainer-state",
  trainerId: "trainer-id",
  state: {}
}, "*");
```

For compatibility with the current board implementation, trainers may also include `trainer: "trainer-id"`.

## Applying Remote State

When a trainer receives remote state, it applies it without writing progress/statistics to `localStorage` and without posting the same state back:

```js
{
  type: "mathexam:apply-trainer-state",
  state: {}
}
```

Use a guard such as `isApplyingRemoteState = true` during apply and make `sendBoardTrainerState()` no-op while the guard is active.

## State Requests

When a trainer receives:

```js
{ type: "mathexam:request-trainer-state" }
```

it should post its current state to parent. The board uses this when a room starts, a new participant joins, or control is handed over.

## Origin And Scope

Trainers should ignore messages from other origins:

```js
if (event.origin !== location.origin) return;
```

If a trainer intentionally supports local `file://` work, it may allow that mode explicitly. Trainers must not store room tokens, teacher/student tokens, or Socket.IO details, and should communicate only with `parent` via `postMessage`.

## State Shape

State should describe the visible lesson state, not learner analytics:

- current task or task id;
- current answer/input;
- selected option or current step;
- feedback text/class when it is part of the visible explanation;
- enough visual state to redraw the same screen after remote apply.

Remote apply must not increment attempts, solved counters, streaks, or history.

## Compatibility Levels

- `opens-in-board`: the trainer loads in the board iframe but does not mirror state.
- `seed-ready`: the trainer accepts a `seed` URL parameter so teacher and student can generate the same initial task.
- `board-mirror`: the trainer implements this postMessage state mirror.
- `semantic-ready`: reserved for future semantic trainer events; not part of this PR.

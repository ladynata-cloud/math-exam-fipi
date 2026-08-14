# MathExam project status

Updated: 2026-08-14

This is the short operational snapshot. Reconcile it against production evidence
at the start of the next approved task; use [ROADMAP.md](ROADMAP.md) for sequence
and [REVIEW_POLICY.md](REVIEW_POLICY.md) for review requirements.

## Production main

- Repository: `ladynata-cloud/math-exam-fipi`
- Branch: `main`
- Commit: `9833d8971c1ab291ba477967d47a2d2904a5f818`
- Confirmed state: Workflow v1.1, Nested-path foundation, the roads-grid mirror,
  the two catalog-only OGE plans/routes trainers, the 31-page `oge-basics`
  mathematical-likbez series, the seven-page percentages/proportions v2 module,
  and Progress Workspaces API v1 are present in the exact `main` history.
  Amvera has persistent `/data`, `PROGRESS_PERSISTENCE_CONFIRMED=1`, and the
  board service restarted successfully on 2026-08-14. A direct post-restart
  health request was blocked by the current browser client and remains not run.

## Current stage

The independent `HIGH` Yashchenko lines 1-2 publication task is in progress on
`agent/yashchenko-lines-1-2-progress`. It publishes the supplied 72-task
trainer, adds an assignment-isolated learner sync client and teacher panel, and
opts the trainer into the already merged progress registry contract. It must
not change board-server production code or deployment core; focused test
expectations may include the new registry entry.

## Open PRs

- Draft PR `#92` contains the Trainer Inventory v1.0.1 cross-platform
  Git-object hashing fix and still requires independent exact-head review.
- Trainer publication PR: pending implementation and local gates.
- Older unrelated PRs remain open but do not alter this task's exact base.

## Last confirmed gate

The current trainer working tree passes
`YASHCHENKO_LINES_1_2_PROGRESS_V1_AUTHORING_CHECK_OK`, all 41 board-server
tests, and a direct local API smoke covering workspace/assignment creation,
learner write, teacher read, required summaries, and raw-code absence in the
progress file. The in-app browser blocked localhost by URL policy, so
visual/browser smoke is not run rather than reported as passed; the final
release gate remains pending production HTTP/API and browser smoke. Trainer
Inventory v1.0.1 reports its own full gate on Draft PR `#92`, but exact-head
independent review is not yet recorded and its CLI is not available on
production `main`.

## Blockers

- The Yashchenko trainer task must not merge until its exact head receives the
  required `HIGH` security/code review or a current exact-head owner waiver,
  followed by separate merge authorization.
- Production progress HTTP and cross-restart checks must be recorded after the
  trainer deploy; Amvera status/log evidence alone is not an HTTP smoke.
- Draft PR `#92` must not merge until an independent reviewer records valid
  exact-head provenance.
- Merge and deployment of any new task remain separately authorized release
  actions.

## Next three actions

1. Complete the trainer/panel implementation and local exact-head gates, then
   open its Draft PR.
2. Obtain exact-head `HIGH` review or an explicit owner waiver and separate
   merge/deployment authorization for that trainer PR.
3. After release, run canonical trainer, panel, registry, learner-write,
   teacher-read, and restart-persistence production smoke and report the exact
   public URLs.

## Maintenance rule

At the start of each approved task, compare this snapshot with the actual remote
`main`, open PRs, gates, and production evidence. Update it within that task when
the status is stale and keep exactly the next three concrete actions. Create a
separate status-only PR only by explicit owner decision or when a real
operational need cannot wait for the next approved task. Never create a
recursive PR solely to record the merge of the preceding status-only PR. Do not
predict a successful merge or deployment before it happens.

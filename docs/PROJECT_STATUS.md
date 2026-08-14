# MathExam project status

Updated: 2026-08-14

This is the short operational snapshot. Reconcile it against production evidence
at the start of the next approved task; use [ROADMAP.md](ROADMAP.md) for sequence
and [REVIEW_POLICY.md](REVIEW_POLICY.md) for review requirements.

## Production main

- Repository: `ladynata-cloud/math-exam-fipi`
- Branch: `main`
- Commit: `217e33fd213d3adff765ae7ee460e60e2106fc68`
- Confirmed state: Workflow v1.1, Nested-path foundation, the roads-grid mirror,
  the two catalog-only OGE plans/routes trainers, the 31-page `oge-basics`
  mathematical-likbez series, the seven-page percentages/proportions v2 module,
  Progress Workspaces API v1, and the Yashchenko lines 1–2 trainer with its
  teacher panel are present in the exact `main` history.
  Amvera has persistent `/data`, `PROGRESS_PERSISTENCE_CONFIRMED=1`, and the
  board service restarted successfully on 2026-08-14. Production student and
  teacher HTTP/browser smoke, server write/read, and reload recovery passed for
  the Yashchenko trainer after deployment.

## Current stage

The independent `HIGH` Algebra 7 control-work publication task is in progress
on `agent/algebra7-progress`. It publishes the supplied four-topic trainer,
adds assignment-isolated learner synchronization and a teacher panel, and opts
the trainer into the deployed progress registry contract without changing
board-server production code, persistence, or deployment configuration.

## Open PRs

- Draft PR `#92` contains the Trainer Inventory v1.0.1 cross-platform
  Git-object hashing fix and still requires independent exact-head review.
- Algebra 7 trainer publication PR: pending Draft PR creation.
- Older unrelated PRs remain open but do not alter this task's exact base.

## Last confirmed gate

The Algebra 7 working tree passes
`ALGEBRA7_CONTROL_PROGRESS_V1_AUTHORING_CHECK_OK`, all 41 board-server tests,
`git diff --check`, and a local browser/API smoke covering teacher workspace and
assignment creation, fragment-secret removal, learner writes, teacher reads,
attempt/error/hint counters, safe teacher URL, and reload recovery. Production
HTTP/API/browser smoke remains pending release. Trainer Inventory v1.0.1
reports its own full gate on Draft PR `#92`, but exact-head independent review
is not yet recorded and its CLI is not available on production `main`.

## Blockers

- The Algebra 7 trainer task must not merge until its exact head receives the
  required `HIGH` security/code review or a current exact-head owner waiver,
  followed by separate merge and deployment authorization.
- Production trainer, panel, registry, learner-write, teacher-read, and reload
  smoke must be recorded after deployment.
- Draft PR `#92` must not merge until an independent reviewer records valid
  exact-head provenance.
- Merge and deployment of any new task remain separately authorized release
  actions.

## Next three actions

1. Open the Algebra 7 Draft PR with the exact base, head, gate, tests, and local
   smoke evidence.
2. Obtain exact-head `HIGH` review or an explicit owner waiver and separate
   merge/deployment authorization for that PR.
3. After release, run canonical trainer, panel, registry, learner-write,
   teacher-read, and reload production smoke and report the exact public URLs.

## Maintenance rule

At the start of each approved task, compare this snapshot with the actual remote
`main`, open PRs, gates, and production evidence. Update it within that task when
the status is stale and keep exactly the next three concrete actions. Create a
separate status-only PR only by explicit owner decision or when a real
operational need cannot wait for the next approved task. Never create a
recursive PR solely to record the merge of the preceding status-only PR. Do not
predict a successful merge or deployment before it happens.

# MathExam project status

Updated: 2026-08-15

This is the short operational snapshot. Reconcile it against production evidence
at the start of the next approved task; use [ROADMAP.md](ROADMAP.md) for sequence
and [REVIEW_POLICY.md](REVIEW_POLICY.md) for review requirements.

## Production main

- Repository: `ladynata-cloud/math-exam-fipi`
- Branch: `main`
- Commit: `dcfa7107597c7f78be58323c83234a22b235f289`
- Confirmed state: Workflow v1.1, Nested-path foundation, the roads-grid mirror,
  the two catalog-only OGE plans/routes trainers, the 31-page `oge-basics`
  mathematical-likbez series, the seven-page percentages/proportions v2 module,
  Progress Workspaces API v1, the Yashchenko lines 1–2 trainer, and the Algebra
  7 control-work trainer with their teacher panels are present in the exact
  `main` history.
  Amvera has persistent `/data`, `PROGRESS_PERSISTENCE_CONFIRMED=1`, and the
  board service restarted successfully on 2026-08-14. Production student and
  teacher HTTP/browser smoke, server write/read, and reload recovery passed for
  both progress-enabled trainer releases after deployment.

## Current stage

The independent `HIGH` DVI mathematics publication task is in progress on
`agent/dvi-math-18-20`. It publishes the supplied student trainer and video
studio for tasks 18–20, adds assignment-isolated learner synchronization and a
teacher panel, and keeps video autoplay outside student progress accounting.

## Open PRs

- Draft PR `#92` contains the Trainer Inventory v1.0.1 cross-platform
  Git-object hashing fix and still requires independent exact-head review.
- DVI tasks 18–20 publication PR: pending Draft PR creation.
- Older unrelated PRs remain open but do not alter this task's exact base.

## Last confirmed gate

The Algebra 7 release passed its production gate on PR `#101`. The current DVI
task pins both supplied source hashes and both learning-generator anchor hashes;
its exact-head authoring, board-server, browser/API, and diff gates are pending
the final implementation run. Trainer Inventory v1.0.1 reports its own full
gate on Draft PR `#92`, but exact-head independent review is not yet recorded
and its CLI is not available on production `main`.

## Blockers

- The DVI publication task must not merge until its exact head receives the
  required `HIGH` security/code review or a current exact-head owner waiver,
  followed by separate merge and deployment authorization.
- Production trainer, video studio, panel, registry, learner-write,
  teacher-read, autoplay-isolation, and reload smoke must be recorded after
  deployment.
- Draft PR `#92` must not merge until an independent reviewer records valid
  exact-head provenance.
- Merge and deployment of any new task remain separately authorized release
  actions.

## Next three actions

1. Finish the DVI exact-head gate and local browser/API smoke, then open its
   Draft PR with the exact base, head, hashes, and test evidence.
2. Obtain exact-head `HIGH` review or an explicit owner waiver and separate
   merge/deployment authorization for that PR.
3. After release, run canonical trainer, video-studio, panel, registry,
   learner-write, teacher-read, autoplay-isolation, and reload production smoke.

## Maintenance rule

At the start of each approved task, compare this snapshot with the actual remote
`main`, open PRs, gates, and production evidence. Update it within that task when
the status is stale and keep exactly the next three concrete actions. Create a
separate status-only PR only by explicit owner decision or when a real
operational need cannot wait for the next approved task. Never create a
recursive PR solely to record the merge of the preceding status-only PR. Do not
predict a successful merge or deployment before it happens.

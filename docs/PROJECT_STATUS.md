# MathExam project status

Updated: 2026-08-14

This is the short operational snapshot. Reconcile it against production evidence
at the start of the next approved task; use [ROADMAP.md](ROADMAP.md) for sequence
and [REVIEW_POLICY.md](REVIEW_POLICY.md) for review requirements.

## Production main

- Repository: `ladynata-cloud/math-exam-fipi`
- Branch: `main`
- Commit: `c1217cda05725b0ba8bfde327c76281d7917853f`
- Confirmed state: Workflow v1.1, Nested-path foundation, the roads-grid mirror,
  the two catalog-only OGE plans/routes trainers, the 31-page `oge-basics`
  mathematical-likbez series, and the seven-page percentages/proportions v2
  module are present in the exact `main` history and on production. Baseline
  HTTP verification on 2026-08-14 returned `200` for the homepage and the
  percentages module. The board health endpoint also returned `200`, three
  registry mirrors, and the pre-progress feature set.

## Current stage

The `HIGH` Progress Workspaces API v1 platform task is in progress on
`agent/progress-workspaces-api`. It adds fail-closed durable learner-progress
storage, teacher workspaces, personal assignments, hashed bearer codes, and an
opt-in registry capability. It intentionally does not publish or edit a
trainer. The supplied 72-task Yashchenko trainer requires a later independent
publication task after this platform contract is reviewed, merged, deployed,
and verified.

## Open PRs

- Draft PR `#92` contains the Trainer Inventory v1.0.1 cross-platform
  Git-object hashing fix and still requires independent exact-head review.
- Older unrelated PRs remain open but do not alter this task's exact base.

## Last confirmed gate

The Progress Workspaces working tree reports 41/41 board-server tests passing,
including role separation, registry opt-in, atomic persistence, restart,
monotonic merge, raw-code absence, unavailable-store `503`, and unchanged room,
board, Bridge, and registry regressions. The exact-head task gate remains
pending until the branch is committed and clean. Trainer Inventory v1.0.1
reports its own full gate on Draft PR `#92`, but exact-head independent review
is not yet recorded.

## Blockers

- The Progress Workspaces task must not merge until its exact head receives the
  required independent `HIGH` security/code review and the owner gives separate
  merge authorization.
- Production progress must remain disabled unless `/data` is backed by a real
  persistent volume and the restart smoke passes; an ephemeral file is not an
  acceptable fallback.
- Draft PR `#92` must not merge until an independent reviewer records valid
  exact-head provenance.
- Merge and deployment of any new task remain separately authorized release
  actions.

## Next three actions

1. Commit, gate, publish, and independently review the Progress Workspaces Draft
   PR on its exact head.
2. Request separate owner merge and deployment authorization only after the
   persistent-volume plan and exact-head evidence are confirmed.
3. After production restart persistence is proven, open the separate trainer
   publication/panel task for the supplied Yashchenko lines 1-2 trainer.

## Maintenance rule

At the start of each approved task, compare this snapshot with the actual remote
`main`, open PRs, gates, and production evidence. Update it within that task when
the status is stale and keep exactly the next three concrete actions. Create a
separate status-only PR only by explicit owner decision or when a real
operational need cannot wait for the next approved task. Never create a
recursive PR solely to record the merge of the preceding status-only PR. Do not
predict a successful merge or deployment before it happens.

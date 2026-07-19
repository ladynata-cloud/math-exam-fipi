# MathExam project status

Updated: 2026-07-19

This is the short operational snapshot. Reconcile it against production evidence
at the start of the next approved task; use [ROADMAP.md](ROADMAP.md) for sequence
and [REVIEW_POLICY.md](REVIEW_POLICY.md) for review requirements.

## Production main

- Repository: `ladynata-cloud/math-exam-fipi`
- Branch: `main`
- Commit: `41f38657f7e72cc65d24ad275a4330ceccc55d0a`
- Confirmed state: Workflow v1.1, Nested-path foundation, the roads-grid mirror,
  the two catalog-only OGE plans/routes trainers, and the 31-page
  `oge-basics` mathematical-likbez series are present in the exact `main`
  history and on production. Production verification for that series confirmed
  31/31 HTTP, desktop, mobile, and iframe pages, 4/4 quick-select entries, zero
  console or page errors, and zero horizontal overflow.

## Current stage

Draft PR `#97` publishes the seven-page percentages and proportions v2 module
as a `CATALOG_ONLY` batch. The branch also contains the owner-approved minimal
source fix that makes repeated solution review idempotent while preserving
supported answer checking after review. It adds site and board discovery only;
it does not add a mirror, change runtime protocols, or authorize deployment.

## Open PRs

- Draft PR `#97` contains the percentages and proportions v2 publication and
  awaits exact-head review and separate owner merge authorization.
- Draft PR `#92` contains the Trainer Inventory v1.0.1 cross-platform
  Git-object hashing fix and still requires independent exact-head review.
- Older unrelated PRs remain open but do not alter the current production base.

## Last confirmed gate

The parent mathematical-likbez release is confirmed on production at
`41f38657f7e72cc65d24ad275a4330ceccc55d0a`. The percentages branch reports its
local `OGE_BASICS_PERCENTAGES_V2_CATALOG_ONLY_GATE_OK`; that marker is not merge
authorization or production evidence. Trainer Inventory v1.0.1 reports its own
full gate on Draft PR `#92`, but exact-head independent review is not yet
recorded.

## Blockers

- Draft PR `#97` must not merge until its exact head is reviewed as required and
  the owner gives separate merge authorization.
- Draft PR `#92` must not merge until an independent reviewer records valid
  exact-head provenance.
- Merge and deployment of any new task remain separately authorized release
  actions.

## Next three actions

1. Obtain exact-head review for Draft PR `#97`.
2. Request separate owner merge authorization for PR `#97` only after its
   required gate and review evidence are confirmed.
3. After any authorized merge and normal deployment, verify all seven
   percentages pages and their discovery surfaces on production.

## Maintenance rule

At the start of each approved task, compare this snapshot with the actual remote
`main`, open PRs, gates, and production evidence. Update it within that task when
the status is stale and keep exactly the next three concrete actions. Create a
separate status-only PR only by explicit owner decision or when a real
operational need cannot wait for the next approved task. Never create a
recursive PR solely to record the merge of the preceding status-only PR. Do not
predict a successful merge or deployment before it happens.

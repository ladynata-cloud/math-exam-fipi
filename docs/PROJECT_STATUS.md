# MathExam project status

Updated: 2026-07-18

This is the short operational snapshot. Reconcile it against production evidence
at the start of the next approved task; use [ROADMAP.md](ROADMAP.md) for sequence
and [REVIEW_POLICY.md](REVIEW_POLICY.md) for review requirements.

## Production main

- Repository: `ladynata-cloud/math-exam-fipi`
- Branch: `main`
- Commit: `4075a597ad3cbc63ee66ea272ad10d77b8cdba3e`
- Confirmed state: Workflow v1.1, Nested-path foundation, the roads-grid mirror,
  and the two catalog-only OGE plans/routes trainers are present in the exact
  `main` history and on production. Existing trainer URLs and the B1/B2
  foundation remain the baseline for subsequent work.

## Current stage

Trainer Factory v1 is in a docs-only `HIGH` plan stage. Owner plan-review
conditions and Claude review conditions C1-C5 are incorporated. The four-trainer
pilot is treated as reconciliation of an already published cohort; executable
per-trainer reverse deltas preserve its pre-Factory references. Public-URL
normalization, exact-release-head descriptor/manifest equality, and mechanical
mirror-template rules are specified fail-closed. This stage does not implement
skills, adapt trainers, or change production behavior.

## Open PRs

- Draft PR `#92` contains the Trainer Inventory v1.0.1 cross-platform
  Git-object hashing fix and still requires independent exact-head review.
- Older unrelated PRs remain open but do not alter the current production base
  or this task's percent-trainer path.

## Last confirmed gate

The plans/routes CATALOG_ONLY publication gate passed on the reviewed head and
production evidence confirmed both canonical pages, discovery surfaces, mobile
layout, and board iframe loading. Trainer Inventory v1.0.1 reports its own full
gate on Draft PR `#92`, but exact-head independent review is not yet recorded.

## Blockers

- Draft PR `#92` must not merge until an independent reviewer records valid
  exact-head provenance.
- Merge and deployment of any new task remain separately authorized release
  actions.

## Next three actions

1. Complete the percent-trainer replacement gate and open its Draft PR.
2. Obtain independent exact-head review for Draft PR `#92`.
3. Request separate owner merge authorization only for an exact reviewed PR
   base and head after all required gates pass.

## Maintenance rule

At the start of each approved task, compare this snapshot with the actual remote
`main`, open PRs, gates, and production evidence. Update it within that task when
the status is stale and keep exactly the next three concrete actions. Create a
separate status-only PR only by explicit owner decision or when a real
operational need cannot wait for the next approved task. Never create a
recursive PR solely to record the merge of the preceding status-only PR. Do not
predict a successful merge or deployment before it happens.

# MathExam project status

Updated: 2026-07-17

This is the short operational snapshot. Reconcile it against production evidence
at the start of the next approved task; use [ROADMAP.md](ROADMAP.md) for sequence
and [REVIEW_POLICY.md](REVIEW_POLICY.md) for review requirements.

## Production main

- Repository: `ladynata-cloud/math-exam-fipi`
- Branch: `main`
- Commit: `495d9f8303de1ec90c15b8f38bf014599bfa463d`
- Confirmed state: Workflow v1.1, Nested-path foundation implementation, the
  roads-grid plan, and the roads-grid third standard mirror are present in the
  exact `main` history. Existing top-level trainer URLs and the B1/B2 foundation
  remain the baseline for subsequent work.

## Current stage

Trainer Factory v1 is in a docs-only `HIGH` plan stage. Owner plan-review
conditions are incorporated: four publication tracks are separated from four
publication surfaces, runtime descriptor authority is fail-closed, platform
changes leave Factory, and the candidate pilot has independent trainer and
batch acceptance. This stage does not implement skills, adapt trainers, or
change production behavior.

## Open PR

The Trainer Factory v1 plan is published as a Draft PR from branch
`codex/trainer-factory-v1-plan`. Its exact PR number and head are authoritative
in GitHub and in the task publication report.

## Last confirmed gate

The exact `main` contains the merged Nested-path implementation and roads-grid
third mirror. No Trainer Factory gate has run. Its proposed plan marker,
`TRAINER_FACTORY_V1_ARCHITECTURE_GATE_OK`, remains pending external exact-head
architecture review.

## Blockers

- The architecture gate remains blocked until independent external review is
  bound to the exact Draft PR base and head.
- Production implementation, pilot publication, skill implementation, merge,
  and deployment are not authorized by the plan request.

## Next three actions

1. Obtain independent exact-head architecture review of the Trainer Factory v1
   Draft PR.
2. Close any review conditions on an exact head and repeat the plan-stage checks
   before reporting the architecture gate.
3. Request separate owner merge authorization for the reviewed plan PR; do not
   start Factory implementation or publish the pilot.

## Maintenance rule

At the start of each approved task, compare this snapshot with the actual remote
`main`, open PRs, gates, and production evidence. Update it within that task when
the status is stale and keep exactly the next three concrete actions. Create a
separate status-only PR only by explicit owner decision or when a real
operational need cannot wait for the next approved task. Never create a
recursive PR solely to record the merge of the preceding status-only PR. Do not
predict a successful merge or deployment before it happens.

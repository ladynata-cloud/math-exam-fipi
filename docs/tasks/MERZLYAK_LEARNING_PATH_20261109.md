# Merzlyak: visible learning path and reliable progress

## Identity and authorization

- Owner: MathExam owner; requested course review followed by «продолжай» on 2026-11-09 (Asia/Novosibirsk).
- Base: `main`, `adc2c9445f6ce7f0a56bca67ed2bc31b8b82ec3c`.
- Branch: `codex/merzlyak-learning-path-20261109`.
- Review level: HIGH (retained learner state and the optional shared-board boundary).
- Release: [standing owner policy](../OWNER_RELEASE_AUTHORIZATION.md), after applicable validation.
- START, branch, commits, push, Draft PR and checked publication: authorized for this package.

## Goal and evidence

Make the next learning action and actual progress visible in Merzlyak geometry
7–9 and grade 10. Preserve the existing textbook catalogue and learner work.
The current grade-10 production catalogue exposes 989 cards; its engine has
per-card saved drafts but no personal course journey. The 7–9 catalogue already
has independent counts and six lesson stages. Both engines conflate an error
with requested help. The three similarity units currently share one AA task
family, including the unit titled second and third similarity criteria.

The source baseline and production course entries were inspected on 9 November.
Older project-status notes about publication holds are historical and do not
override the standing policy. No changes to actual pupils or assignments occur.

## Approved scope

- A concise, responsive course journey, resume and progress per chapter/topic.
- Distinguish first-try answers, self-correction, help and unverified written proofs.
- Preserve older work; do not infer stronger evidence than the saved fields allow.
- Correct the three similarity units with appropriate proof and varied examples.
- Preserve the optional grade-10 board protocol and isolation of personal results.
- Regression tests and independent mathematical/technical review.

Out of scope: redesigning all 989 cards, new accounts or cloud progress, changing
the server/board protocol, replacing other textbook courses, or claiming measured
learning effectiveness. Subsequent discovery lessons on parallelism are a later package.

## Acceptance criteria

- [x] Both home pages show a meaningful next action and actual saved progress.
- [x] Resume returns to the same work and help remains recorded after reopening.
- [x] An unassisted wrong answer followed by a correction is not labelled help.
- [x] Repeated checks do not duplicate achievements; legacy unknown results stay unknown.
- [x] Written proof is explicitly awaiting human review, never automatically approved.
- [x] Similarity practice covers AA, SAS and SSS with valid correspondence and negative cases.
- [x] Prior similarity achievements are not silently credited to the new task content.
- [x] Standalone progress and shared-board work remain isolated.
- [ ] Relevant automated gates and a mobile/desktop UI inspection pass.

## Learning design review

Internal design review: short next action; separate activity and demonstrated
skill; retain attempts and help; preserve legacy evidence conservatively; manual
proofs require review. Content review checks the included angle, correspondence
and non-circular arguments. New tasks must include cases where conditions fail.
External provider consultation is not performed under the standing owner policy.
Real-pupil learning effectiveness is not measured in this task.

## Checks and gates

Targeted progress/DOM tests for both engines; similarity mathematics and generated
page consistency; existing Merzlyak 7–9 content check; grade-10 schema/runtime,
retained source review and shared-board regressions; applicable GitHub checks;
`git diff --check`; live publication and course-entry checks.

## Risk and rollback

Risks: inflated legacy progress, lost drafts, board snapshots including personal
fields, incorrect correspondence in similarity, or misleading completion labels.
State changes are additive and old keys remain usable. Roll back application
files with an ordinary revert PR; do not clear learner storage or rewrite history.
The existing 989-card content and its review ledger remain unchanged.

## Execution record

Local validation: 12 progress/migration tests for grades 7–9 and 11 grade-10
learning-path tests passed; full schema/runtime (989 cards), 22 existing
board/cabinet/selection tests, wrapper checks and 720 similarity cases passed.
Independent technical review passed after correcting the empty manual-answer
feedback in board mode. The k=1 auxiliary-triangle proof case was corrected
and regression checked.

Managed preview returned the new 7–9 home accessibility tree, but subsequent
browser calls failed at the browser transport. Visual acceptance is therefore
pending CI browser runs and screenshot inspection, not claimed locally.

Implementation and exact candidate checks are recorded in the task PR. The
release record must include current main/head, drift handling, checks, deployment
and live verification. No release is implied by this task document alone.

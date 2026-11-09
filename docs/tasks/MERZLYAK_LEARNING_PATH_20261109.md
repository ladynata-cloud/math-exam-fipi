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
- Owner extension on 2026-11-09: «обнови сами тренажеры, возьми для них все лучшее есть в курсах Геогебра, Brilliant, Методайзера, MathExam». This extends the same unmerged PR to the existing shared trainer interactions in both Merzlyak courses.
- Progressive, voluntarily opened help; retained visible steps and explanations; a fresh independent task after supported work, with truthful handling of finite banks.
- Optional prediction/plan and self-explanation, concrete diagnostic hints for supported error patterns, and an explicit next action after solving.
- Compact standalone grade-10 task/model layout; personal plan and proof self-checks remain separate from shared-room state and mathematical assessment.

Out of scope: rewriting the mathematical content of all 989 cards, new accounts or cloud progress, changing
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
- [ ] A hint opens one authored step at a time; the full solution requires an explicit action. Revealed steps survive reopening.
- [ ] Two wrong answers offer optional help without opening it automatically. A substantive diagnostic hint is recorded as assistance.
- [ ] A new independent task has a different condition; repeated conditions never become new independent achievements.
- [ ] Optional plans and proof self-checks are retained without being called automatically verified proofs.
- [ ] Grade-10 personal controls cannot add fields to the shared-room work snapshot or change legacy records merely by viewing them.

## Learning design review

Internal design review: short next action; separate activity and demonstrated
skill; retain attempts and help; preserve legacy evidence conservatively; manual
proofs require review. Content review checks the included angle, correspondence
and non-circular arguments. New tasks must include cases where conditions fail.
External provider consultation is not performed under the standing owner policy.
Real-pupil learning effectiveness is not measured in this task.

The trainer extension applies the already selected learning principles to authored
MathExam material: predict and inspect a movable model, attempt before revealing
help, receive a small relevant prompt, explain the reasoning, and try independently
on another condition. These are implementation choices informed by earlier study,
not a claim of a new full audit of external courses or of copying their lessons.
Optional support preserves learner control; there is no forced timer or artificial
mastery badge. A different textbook task is labelled as another task in the same
topic, not guaranteed to be an equivalent generated variant.

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

First package validation: 12 progress/migration tests for grades 7–9 and 13 grade-10
learning-path tests passed; full schema/runtime (989 cards), 22 existing
board/cabinet/selection tests, wrapper checks and 720 similarity cases passed.
Independent technical review passed after correcting the empty manual-answer
feedback in board mode. The k=1 auxiliary-triangle proof case was corrected
and regression checked.

First package head `5fe6cefb23ecbbcfe8250d1473d70116b5159bad` passed all seven
applicable GitHub workflows. CI screenshots cover 48 new states and 84 existing
lesson journeys; all six first-viewport checks of the three similarity models
passed. The first package is still unmerged. These passes do not approve the new
trainer interaction extension, which requires its own complete checks and review.
Current extension base is `463d6bf56fc8f1f944da8d237102f77888711e79`; its OGE-only
changes were preserved by an ordinary merge. Navigator source records from both
branches are retained and will be rebound after the final implementation.

Trainer extension local acceptance: 49 test reports passed (22 grade-7–9,
25 grade-10, similarity and diagnostic suites). Diagnostic checks cover 90 task
families, 10 targeted-feedback families and ambiguous-value collisions; 720
similarity cases and the existing 39480 content checks pass. The undirected
side FE/EF is accepted contextually without reversing directed-vector answers.
Schema/runtime covers all 989 cards. Nine shared-board regressions pass when
run alone; a parallel combined run exited without a diagnostic, then the exact
unchanged board suite passed in isolation. Cabinet/selection tests and wrapper
checks also pass. JSDOM reports its known unimplemented scrollTo warning in the
wrapper harness; the new browser gate tests real scrolling explicitly.
Independent internal reviews found and corrected unknown-paragraph fresh-task
selection, a stale fresh-task button, blank manual-proof counting and the
guided/independent draft boundary. No blocking code-review issue remains.
New CI acceptance records 72 layouts and actual learner interactions; its result
is pending until the updated candidate runs. No local browser pass is claimed.

Trainer CI on `8537462d` passed the existing 84 browser journeys but found two
interaction/layout regressions: the standalone board link was hidden in the new
collapsed navigation, and the representative grade-10 model extended 17.81px
below the 320x900 viewport. The product now keeps the original board anchor
visible beside the course menu and places the secondary hint button below the
model on narrow screens. Existing browser assertions remain unchanged. Failure
screenshots are now retained for diagnosis. A separate history review also fixed
correct-answer -> later wrong draft -> new variant: the first successful response
and latest draft are retained separately, without inventing missing legacy data
or awarding the result twice. New semantic regressions cover these boundaries;
the new head requires fresh CI and visual inspection before publication.

Implementation and exact candidate checks are recorded in the task PR. The
release record must include current main/head, drift handling, checks, deployment
and live verification. No release is implied by this task document alone.

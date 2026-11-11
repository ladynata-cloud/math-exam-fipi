# ЕГЭ профиль: общий маршрут и понятный прогресс

## Identity
- Task: PROFILE_LEARNING_JOURNEY_20261109
- Owner: MathExam
- Date: 2026-11-09 (Asia/Novosibirsk)
- Base: main, ee7c501abc2f293d923d892a4b3dcc5ac4b798f7
- Branch: feat/profile-learning-journey
- Review level: HIGH (shared learner navigation and interpretation of saved progress)
- Architecture: existing static course and browser records; no new platform primitive.

## Goal and authorization
The owner approved the course audit recommendations with «Хорошо, делай».
This first implementation package gives the whole profile a visible map, a
meaningful next action, compact honest progress and a readable task workspace.
Publication follows [standing authorization](../OWNER_RELEASE_AUTHORIZATION.md)
after applicable checks. No additional approval or external audit is pending.

## Context
The deployed course already distinguishes guided, independent and familiar
work. Its main route has 81 topics, while the first-part start button always
opens a fixed entry topic. Second-part resources have separate entrances and
different progress records. Existing reports and saved attempts must survive.

## Scope
- Resume the latest unfinished work and then choose the next unmastered topic.
- Display the available first- and second-part routes in one map; describe
  partial coverage and separate progress evidence without inventing mastery.
- Group detailed topic records beneath a compact summary; preserve downloads.
- Improve current question/answer placement without hiding necessary content.
- Preserve all task IDs, answer checking, assistance flags, storage keys,
  shared-board behavior, existing URLs and old saved records.

Later content packages include expanded unseen task pools, delayed recall and
additional method-choice/proof tasks. They are not claimed as implemented here.
No changes to backend, pupil data, other courses or external services.

## Acceptance
- Continue resumes the correct lesson/mode/draft rather than the fixed entry.
- Completed entry topics do not block progression to the remaining topics.
- Guided and familiar successes are never relabelled independent mastery.
- The map links all available second-part lines with accurate coverage labels.
- Detailed results and original exports remain accessible.
- Saved work survives reload, help, pause, parallel tabs and course navigation.
- No horizontal overflow at narrow widths; controls remain readable.

## Validation and review
Relevant profile Node/DOM gates, existing course checks, targeted new navigation
regressions and browser acceptance; git diff --check. Independent technical
review is required. External provider review is not performed under the owner
policy. Tests cannot establish effectiveness with real pupils.
Gate: PROFILE_LEARNING_JOURNEY_OK.

## Risk and rollback
Risks: incorrect next lesson, misleading summary, wrong legacy destination,
layout regression. Revert the scoped commit; no storage migration or deletion.
Detailed execution and release evidence will be recorded in the PR.

## Release preparation update
- The owner explicitly authorized sending the changes to the repository and
  publication after successful checks in the current conversation.
- Main advanced only through approved PR #492 (linear-equation lesson). The
  composition preserves it, with unchanged profile patch blobs; 32 targeted
  checks passed on that composed tree.
- Initial CI exposed stale navigator bindings and board script-parity fixtures
  after adding public-only map modules. Refresh the exact two page bindings;
  keep strict teaching-script parity and prohibit map modules in board wrappers.
- Preserve the existing readable-label requirement of at least 16px on mobile.
- Final CI, current base/head, merge and live verification are recorded in PR #498.

# MathExam task specification — finish parameter proof self-review

## Identity

- Task: `PROFILE19_PROOF_COMPLETION_20261114`
- Owner: MathExam owner
- Date: 2026-11-14 (Asia/Novosibirsk)
- Base branch: `main`
- Base SHA: `add234c3ecb3204d4d7c9b3ef99f7b98a33bf37a`
- Planned branch: `fix/profile19-proof-completion-20261114`
- Review level: `HIGH` (existing saved learner work and assistance accounting)
- Related work: PR #594, source head `b282bb5de7aefb6e01673340e6e41d8b7bc2aed9`; published PR #595.
- ADR: no new architectural primitive or accepted-ADR change.

## Goal

Finish the prepared self-review of written arguments for the six parameter
methods in profile task 19, while preserving the newer independent-answer and
saved-work behavior published in #595. Learners can identify a missing argument,
request relevant help, revise their draft and continue to a different condition.

## Context and evidence

- The current owner asks to finish unfinished trainers, work within a three-hour
  session and resolve routine questions independently. This direct execution
  instruction supplies the current task start and scope.
- PR #594 is open and conflicts with current main. Its new `parameter-proof.js`
  is absent from the current tree. Its old head is source material, not approval
  for a new merge. The old branch is left unchanged.
- Current main contains whole-answer checking for tasks 14/16, preserved older
  step-form drafts, exact excluded boundaries, duplicate-submit protection and
  self-correction labels. All remain in place.
- Only the six parameter families receive the new self-review. Existing task
  IDs, the 252-task bank, storage keys, state schema and board contracts remain.

## Approved scope

### In scope

- Integrate the six method-specific review criteria, targeted help and examples
  from the prepared #594 into current main's renderer.
- Require a submitted answer and the learner's own argument before showing the
  criteria; allow self-review after a wrong answer.
- Keep numerical grading separate from learner-marked argument criteria. Record
  requested assistance; preserve earned results and the first attempt.
- Clear stale checkmarks after a substantive draft edit; retain reload/return
  behavior and the next independent-condition link.
- Reconcile current project status against selected production resources.
- Focused regression, mathematics and browser checks; update only the changed
  page's navigator-preservation fingerprint using the canonical tool.

### Out of scope / files that must not change

- No authored-task answers or numbering changes, no server/authentication or
  classroom data changes, no new progress schema and no automated proof grading.
- No branch repair, merge or publication of #594 or any unrelated old PR.
- No modification of published #595 content, parsers or their required gates.

## Acceptance criteria

- [ ] All six families expose the appropriate four criteria after an attempt and argument.
- [ ] Empty submissions do not unlock criteria or count as attempts.
- [ ] Assistance before a correct numerical answer prevents independent credit.
- [ ] Marking criteria alone is self-review, never an automatic proof verdict.
- [ ] Prior answers, drafts and earned results survive viewing, editing and reload.
- [ ] Task 14/16 whole-answer behavior and next-condition behavior remain correct.
- [ ] No narrow-screen overflow in the real-browser gate.

## Checks and gates

- Required tests: second-part mathematics/state/DOM, parameter routes, current
  open-answer regressions, all six proof examples and relevant board contracts.
- Required static checks: syntax, navigator bindings/preservation, `git diff --check`.
- Browser: current course-entry and full second-part scenarios in GitHub Actions;
  local Chromium cannot start because this executor denies AF_UNIX sockets.
- Final marker: `PROFILE19_PROOF_COMPLETION_GATE_OK` only after required checks.
- Real pupil pilot and external-provider review are not performed by this task.

## Review plan

- Reuse the existing teaching pattern, with independent review of the combined
  current-main result and mathematics. No new archetype is introduced.
- Prior PR evidence is provenance only. Current code and gates decide readiness.
- External consultation not requested; no provider verdict is claimed.
- Review handoff excludes secrets, personal data and machine-specific paths.

## Risk and rollback

- Risks: losing newer answer behavior during integration, premature help,
  misleading proof completion or losing a draft.
- Rollback: ordinary reviewed revert of this task's patch; preserve all existing
  storage keys and values. No data migration or destructive cleanup is needed.

## Permissions

- Current start: owner's direct instruction to finish unfinished trainers.
- Branch creation, scoped implementation, tests, local commits, push and Draft PR: yes.
- Merge, auto-merge and deployment: **no** in this session without separate owner
  authorization. The AGENTS.md rules supplied directly in the current conversation
  take precedence over the repository's broader standing-release document.

## Execution record

- Actual branch: `fix/profile19-proof-completion-20261114`
- Actual base: `add234c3ecb3204d4d7c9b3ef99f7b98a33bf37a`
- Head, PR, review and final test results: recorded in the PR handoff.
- Scope deviations: none planned.

## Required handoff

```text
EXECUTIVE STATUS
Task:
PR:
Base:
Head:
Gate:
Tests:
Failures:
Not run:
Scope deviations:
Recommendation:
Next user decision:
```

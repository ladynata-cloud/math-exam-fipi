# MathExam task specification — finish parameter proof self-review

## Identity

- Task: `PROFILE19_PROOF_COMPLETION_20261114`
- Owner: MathExam owner
- Date: 2026-11-14 (Asia/Novosibirsk)
- Base branch: `main`
- Base SHA: `add234c3ecb3204d4d7c9b3ef99f7b98a33bf37a`
- Authorized synchronization base (2026-11-16): `1469ad50a8659f66c8613164009e7387a3a68f2b`.
- Existing PR: #600; incoming head before synchronization: `9f151187e732a69639034161abe90e3e12fb2701`.
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
- Preserve accepted H04 answer-format recognition, guarded submissions and
  drafts while synchronizing this existing PR with the exact authorized main.
  Keep accepted #620 diagram fixes and every unrelated main change intact.

### Out of scope / files that must not change

- No authored-task answers or numbering changes, no server/authentication or
  classroom data changes, no new progress schema and no automated proof grading.
- No branch repair, merge or publication of #594 or any unrelated old PR.
- No modification of published #595 content, parsers or their required gates.
- Broad proof-freshness changes for all `task.proof`, changed legacy-checkmark
  semantics and line-ending normalization belong to the later H05 task.

## Acceptance criteria

- [x] All six families expose the appropriate four criteria after an attempt and argument.
- [x] Empty submissions do not unlock criteria or count as attempts.
- [x] Assistance before a correct numerical answer prevents independent credit.
- [x] Marking criteria alone is self-review, never an automatic proof verdict.
- [x] Prior answers, drafts and earned results survive viewing, editing and reload.
- [x] Task 14/16 whole-answer behavior and next-condition behavior remain correct.
- [ ] No narrow-screen overflow in the real-browser gate.
- [ ] In all six parameter methods, a written argument plus an unrecognized
  final answer creates no attempt and opens no criteria; a subsequent meaningful
  wrong answer records one attempt and enables self-review.

## Checks and gates

- Required tests: second-part mathematics/state/DOM, parameter routes, current
  open-answer regressions, all six proof examples and relevant board contracts.
- Required static checks: syntax, navigator bindings/preservation, `git diff --check`.
- Browser: current course-entry and full second-part scenarios in GitHub Actions;
  local Chromium cannot start because this executor denies AF_UNIX sockets.
- Final marker: `PROFILE19_PROOF_COMPLETION_GATE_OK` only after required checks.
- Real pupil pilot and external-provider review are not performed by this task.
- Synchronization gates: all `tools/profile-part2-*.test.cjs`, including H04
  recognition/duplicate-event/two-tab cases and the combined proof regression;
  current course-entry, second-part course/inequality and scoped standalone
  browser scenarios; unchanged bank/keys, offline-source identity and preservation
  of all unrelated main files and download entries.

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
- On 2026-11-16 the owner explicitly authorized an ordinary update of the
  existing #600 branch on `1469ad50a8659f66c8613164009e7387a3a68f2b`, resolving
  the five reviewed conflicts and retaining H04 and #620. The result remains a
  checked Draft PR; this permits merging the named main into the task branch,
  not merging the PR into main, auto-merge or deployment.
- The earlier exact-base update permission for `35e718ca74852857a86dfe9dcc68d091ce165308`
  was stopped before merge when authoritative main advanced through #620.
  Read-only revalidation found the same five #600 conflicts and unchanged
  runtime inputs. The later owner permission replaced that base explicitly;
  no force, reset or rebase is authorized.

## Execution record

- Actual branch: `fix/profile19-proof-completion-20261114`
- Actual base: `add234c3ecb3204d4d7c9b3ef99f7b98a33bf37a`
- Head, PR, review and final test results: recorded in the PR handoff.
- Scope deviations: none planned.

### 2026-11-16 synchronization checkpoint

- Accepted main contains H04 #618 and diagram fix #620. The combined runtime
  retains H04 `bindSubmit`, whole-form recognition and observed draft values,
  with one `bindProof` registration and the #600 state-patch veto.
- The meaningful-answer requirement applies before proof review can open.
  Existing numerical results, assistance, proof text and storage version remain.
- Only the second-part offline package is rebuilt. A temporary source checkpoint
  may retain the accepted main package until the actual source commit exists;
  it is not an updated standalone deliverable or a checked PR candidate.
- Final source binding must name the actual published source commit and be
  generated by the canonical tool. The scoped bundle is rebuilt afterwards;
  final native/offline gates and exact-head CI are recorded in the PR handoff.
- H05 remains conditional on acceptance of this foundation; this update does
  not implement H05 or H06.

### Verified source checkpoint and review

- Remote source checkpoint: `7e55dd63d8bc6fd7c9567a6f4d355a717884000c`;
  tree `b887caca8f850fef5a9fa35b048e57deef9632c4`, identical to local
  `c91064691b0bf677ce156f10458f1b6c3c3891cb`. No branch history was rewritten.
- Combined local gate: 192 tests from 13 second-part, alphabet and board/integrity
  suites passed. Focused final engine/math rerun: 23 tests passed.
- Independent internal review found two issues before handoff: middle-button
  skill navigation did not mark help; another tab's checkmarks could appear next
  to an older visible draft. Both were fixed and independently rechecked. New
  regressions exercise help credit, a protected stale checklist and explicit
  return to the saved argument. No remaining source-level blocking findings.
- Six explanatory examples were checked against independent root/point counts,
  including singular parameters, exact boundaries and an attainable maximum.
- Canonical navigator binding refresh uses the remote checkpoint and changes
  only the binding for `ege-profil/part-two/index.html`.
- Initial added-test fixtures used an unrecognized interval and an incorrect
  catalog export assumption; those test-harness errors were corrected. No product
  assertion or gate was relaxed. Native-browser results remain pending CI.

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

# MathExam task specification — Arzhenikov course assistant

## Identity

- Task: ARZHENIKOV_ASSISTANT_20261124.
- Owner: MathExam project owner.
- Date: 2026-11-24 (Asia/Novosibirsk).
- Base branch: `main`.
- Base SHA: `b944df23a069b593aa03c7bcc4f9938300695f41`.
- Planned/actual branch: `feat/arzhenikov-assistant-20261124`.
- Review level: `HIGH` (contextual instructional feedback and attribution of assistance in saved learner work).
- Architecture: additive local help within the existing course; no new platform primitive or change to an accepted ADR.

## Goal

Adapt the MathExam helper to the current Arzhenikov lesson and pupil step. Prepare
course-specific material for Kimi-assisted development and bounded OpenAI bonus
evaluation, keeping the free course usable online and offline.

## Context and evidence

- Owner instructions in this conversation: «давай поучим помощника на сайте
  mathexam.space, пусть оно помогает теперь на курсе арженикова» and
  «поучим с помощью кими и бонусов». These instructions are START for this task.
- Authoritative remote main contains the released PR #742: 76 lessons, 608
  conditions, six tracks. The PR release receipt identifies Pages run
  45174901215 and the exact published merge above.
- `arzhenikov-courses.js` owns the current task/draft and saves assistance.
  The public navigator finds routes but does not receive a course step.
- Kimi is the requested development/review collaborator; the earlier bonus
  belongs to OpenAI API. Existing authorised access should be reused when
  available. Neither an old model reply nor an earlier campaign authorises
  changing that campaign's halted state or releasing this PR.
- The course is a modern MathExam adaptation. No claim of fine-tuning model
  weights, measured pupil benefit or external approval follows from local tests.

## Approved scope

### In scope

- A local helper grounded in the actual lesson, current model, first unfinished
  step and current attempt: start, simpler, why, check my notation and a bounded
  response to a request for the final answer.
- Context exports restricted to public instructional fields, without expected
  answers, future steps, model targets or private pupil records.
- Record substantive help before showing it; preserve first-attempt history,
  existing task IDs, maps, banks, storage keys and checker authority.
- Synthetic course material and a separate evaluation packet for the requested
  model collaboration, with honest provenance and actual request/cost receipts
  if authenticated access is available.
- Offline bundle rebuild, relevant unit/DOM/browser/mobile gates, independent
  review, exact HTML source binding and status reconciliation.

### Out of scope / protected areas

- No automatic paid model calls from pupil pages, new public API, model
  fine-tuning job, account/credential creation or unrelated queue restart.
- No changes to board/server protocols, private cabinets, other sites, prices,
  deferred SEO work, bank answers or the sibling course-completion worktree.
- No reset, rebase, force operations, TLS bypass, approval bypass or weakened gate.

## Acceptance criteria

- [x] All 76 lessons provide current-step help and retain the original course path.
- [x] Opening the helper alone does not mark assistance; mathematical help does.
- [x] Assistance never completes a task or rewrites the first attempt.
- [x] Context contains no hidden answer/target/future-step fields or raw saved data.
- [x] Step changes, invalid input and missing context receive accurate bounded replies.
- [ ] The helper works with keyboard, at 320 px and in the autonomous ZIP.
- [x] Model participation, unavailable access, request counts and costs are reported separately from code validation.
- [ ] Applicable exact-head checks pass; unresolved checks are stated explicitly.

## Checks and gates

- Required: dialogue/context tests across all course banks; actual DOM/browser
  interactions for help attribution, task/step changes and offline operation;
  existing course/arithmetic tests; offline tests and reproducible archive;
  source-binding preservation tests; applicable CI; `git diff --check`.
- Manual: inspect the contextual panel and narrow-screen layout.
- Technical gate marker: `ARZHENIKOV_ASSISTANT_TECHNICAL_PASS` only after the
  relevant technical checks. This does not mean model evaluation or publication.
- Model gate: separate receipt naming provider/model, synthetic cases, actual
  responses, review findings, token accounting and limitations; no invented PASS.

## Review plan

- Learning design: course-grounded single-step help, mathematical accuracy,
  independence and recovery from misunderstanding.
- Independent technical review of context isolation, UI state, stored help
  attribution and model-evaluation separation.
- Requested Kimi work is design/testing input, not exact-head release approval.
- Remote material must be limited to public course excerpts and synthetic
  scenarios. Exclude secrets, credentials, private documents, pupil data and
  machine-specific absolute paths.
- Any external release verdict requires provider, PR, base/head, verdict and
  verifiable source or timestamp. Missing access is recorded as not run.

## Risk and rollback

- Risks: stale step context, a hint that reveals an answer, misleading feedback,
  lost first-attempt attribution, narrow-screen overflow and omitted offline assets.
- Rollback: ordinary revert PR; no migration or new progress namespace. Keep
  existing learner work and all original banks intact.
- Model requests, if performed, use a fresh bounded task-specific ledger and
  synthetic data. No automatic retries or release of uncertain reservations.

## Permissions

- START, branch creation, local implementation/validation/commits, push and
  Draft PR: authorised by the current direct owner instructions.
- Reuse the previously authorised Kimi/OpenAI bonus access if available; no
  new credentials or unbounded spending are authorised by this specification.
- Merge, auto-merge and deployment: **not authorised**. The owner-supplied
  AGENTS instructions in this conversation require separate explicit owner
  authorisation and take precedence over the broader standing policy in the repo.

## Execution record

- Actual branch: `feat/arzhenikov-assistant-20261124`.
- Actual base: `b944df23a069b593aa03c7bcc4f9938300695f41`.
- Exact head, PR, tests, failures/not-run checks and scope deviations: see the
  final report and PR receipt. A preparation entry is not release evidence.
- [Implementation and validation report](../reports/ARZHENIKOV_ASSISTANT_20261124.md).
  Browser/visual acceptance and exact-head CI remain separate from the completed
  local acceptance items above; their final receipt belongs to the PR.

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

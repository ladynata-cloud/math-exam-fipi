# MathExam task specification

## Identity

- Task: `GUEST_NAVIGATOR_INFORMATICS_FOLLOWUP_20261124`
- Owner: MathExam repository owner
- Date: 2026-11-24 (Asia/Novosibirsk)
- Base branch: `main`
- Base SHA: `b944df23a069b593aa03c7bcc4f9938300695f41`
- Planned branch: `fix/navigator-informatics-followup-20261124`
- Review level: `MEDIUM`
- Related issue or ADR: guest-mode audit in the current owner conversation;
  no architectural change or ADR decision.
- ADR status: ADR 0001 remains Proposed and is not approval for this task.

## Goal

After the guest navigator asks which informatics exam is needed, a short
answer such as «ОГЭ» or «ЕГЭ» selects the offered informatics route. A reply
that explicitly names a different subject, topic or exercise remains a new
request instead of being replaced by an old mathematical choice.

## Context and evidence

- The public guest audit reproduced «информатика» → «ОГЭ» routing to the
  mathematical OGE course and «информатика» → «ЕГЭ» asking about mathematical
  base/profile levels. Full informatics choice labels already worked.
- The same defect is reproducible through the production `respond()` API
  with the returned `dialog` passed to the next turn. `choiceForReply()` only
  recognized mathematical labels and also matched arbitrary replies containing
  an exam name, overwriting explicit changes of subject or task.
- The baseline existing regression suite passes 65/65. The expanded suite
  includes both failing reproductions and protection of existing continuations.
- At task start, authoritative `main` matched the base above. PR #742 was
  merged and [Pages run 45174901215](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/45174901215)
  successfully deployed that exact SHA. `PROJECT_STATUS.md` is reconciled in
  this task while retaining its earlier preparation entry as history.

## Approved scope

### In scope

- Match short exam selections against the immediately offered choices and
  retain the full prepared action text, including its task number.
- Bound exam matching so explicit new requests reach the normal responder.
- Add dialogue regressions, complete this specification, and reconcile status.

### Out of scope

- Persistent subject memory, model API activation, Kimi trials, additional
  training corpora, new navigation destinations or new trainers.
- Guest-board invitation handling, which is a separate task and Draft PR.

### Files or areas that must not change

- Authentication, cabinet, server contracts, storage, analytics, deployment,
  teaching content, public-page includes and preservation rules.

## Acceptance criteria

- [x] «информатика» → «ОГЭ» and «ЕГЭ» retain the informatics subject.
- [x] An offered exam choice retains an existing task number, including №15.
- [x] Full choice labels and supported polite short choices work.
- [x] Explicit new subject, topic or task is not overwritten by a stale choice.
- [x] Existing mathematical OGE and EGE base/profile continuations pass.
- [x] Guest operation remains local with no model-service or credential change.

## Checks and gates

- Required tests: complete `tools/public-navigator-regression.cjs`, including
  new two-turn regressions and its existing cases; focused widget dialogue
  check where available; existing relevant navigator static checks.
- Required static checks: JavaScript syntax; `git diff --check`; inspect the
  changed-file list and confirm unchanged widget, catalogue and page bindings.
- Manual checks: source and focused dialogue review against the reproduced
  public guest failure. Production acceptance awaits an authorized release.
- Final gate marker: `GUEST_NAVIGATOR_INFORMATICS_FOLLOWUP_PASS` after the
  scoped local checks; report GitHub CI separately with its exact head.
- Checks intentionally not run and why: external model calls are unnecessary;
  live verification of the new code cannot precede authorized publication.

## Review plan

- Review-level rationale: bounded dialogue behavior with recoverable routing
  risk; focused review and regression cases are appropriate for `MEDIUM`.
- Trainer design consultation applicable: no; no trainer or learning sequence
  is created or changed.
- Before implementation: independent source audit recommended matching only
  actual selections and returning the existing full action text. No external
  provider consultation was requested or performed.
- Ready-result review: independent local code review passed after correcting
  one review finding about «ЕГЭ базового уровня» and «профильный ЕГЭ» retaining
  the prepared number. All 10 reviewer-selected dialogue scenarios passed;
  three preservation regressions were added to the main suite. The reviewed
  runtime SHA-256 is `abfce4e88152bdc021cb1b4c246d6756f705898236a7b1816c7e6c37962c638a`;
  regression-file SHA-256 is `fc22d9a7f2dbf2736c115804d1e3bef1fe4e9fcb25d0f81995af1db0cc89aa6b`.
  This is an independent local technical review, not an external-provider verdict.
- External review required: no; no owner request for an external provider.
- Sanitized handoff constraints: public source and synthetic queries only;
  no credentials, private pupil data or machine-specific paths.
- If external review is later requested, record provider, PR, exact base/head,
  verdict and verifiable source/time; do not infer it from this specification.

## Risk and rollback

- Main risk: an overbroad short-answer matcher could hide an explicit new
  request; an overly narrow matcher could lose a prepared exercise number.
- Rollback: revert this task's commit through the normal reviewed PR workflow.
- Data or compatibility considerations: no stored schema, API, catalogue URL,
  privacy filter, or widget contract changes.

## Permissions

- `START` granted by owner in the current task conversation: yes; approval to
  continue the two proposed guest-mode fixes on 2026-11-24.
- Branch creation, local commits, push and Draft PR: allowed.
- Release authorization: the current conversation's supplied `AGENTS.md`
  explicitly requires a separate owner authorization for merge and deployment;
  this narrower instruction takes precedence over repository standing policy.
- Merge allowed: **no**.
- Auto-merge allowed: **no**.
- Deployment allowed: **no**.

## Execution record

- Actual branch: `fix/navigator-informatics-followup-20261124`
- Actual base SHA: `b944df23a069b593aa03c7bcc4f9938300695f41`
- Actual head SHA and PR: recorded in the Draft PR and final handoff; a commit
  cannot contain its own final SHA.
- Commits: one scoped implementation, regression and task/status update.
- Tests passed: dialogue regression 88/88; unchanged public home coverage
  (760 eligible, 753 direct covered, 7 redirects, zero missing); navigator
  preservation 4/4; source-binding tests 5/5; autonomous-help tests 7/7;
  division-dialogue 11/11; home navigation 8/8; rounding focus 6/6; syntax and
  diff checks. A focused DOM check loaded the real widget/data on the home and
  helpers pages: 18/18 typed/button scenarios, zero API calls or runtime errors.
- Tests failed: the expanded baseline reproduces 10 routing failures before
  the fix. No candidate assertion failures remain. Initial missing sparse
  dependency files were materialized and affected checks rerun successfully.
- Tests not run: local visual Chromium checks were attempted but the environment
  refused process socket creation before browser startup; no visual result is
  claimed. Repository browser CI is tracked separately in the Draft PR.
  Production release checks and external model calls were not run.
- Final local gate: `GUEST_NAVIGATOR_INFORMATICS_FOLLOWUP_PASS`.
- Scope deviations: none.

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

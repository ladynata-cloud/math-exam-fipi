# MathExam task specification — limited synthetic model evaluation

## Identity

- Task: `MATHEXAM_ASSISTANT_EVAL_V1`
- Owner: repository owner
- Date: 2026-10-27 (Asia/Novosibirsk)
- Base branch: `feat/math-assistant-v1-20261027`
- Base SHA: `5219320061bf92d63da389b45d30564425c51d11`
- Dependency: [Draft PR #358](https://github.com/ladynata-cloud/math-exam-fipi/pull/358), still unmerged at task start
- Main observed at task start: `92d733a49692744ce043503c57f29b77bfb09a24`
- Planned branch: `feat/math-assistant-eval-20261027`
- Review level: `HIGH` — provider access, durable campaign accounting and private evaluation output
- Related ADR: [0011 — independent assistant](../adr/0011-independent-assistant.md)
- ADR status: `Accepted` by the owner's current instruction on 2026-10-27

## Goal

Prepare a reproducible, tightly bounded evaluation of the existing model adapter
on original synthetic school mathematics. Deliver the corpus, reference criteria,
offline rehearsal, guarded future live runner and review protocol. Make the
proposed spend, actual execution status and remaining owner decision concrete
without making a paid request or exposing the prototype to pupils.

## Context and evidence

The current owner instruction explicitly accepts the proposed architecture and
asks to prepare the limited synthetic trial. It is the START for this preparation
task. It is not a paid-run authorization, external review, merge or deployment
permission. The acceptance is recorded in ADR 0011 without changing its decisions.

PR #358 supplies a private offline assistant with seven topic cards, exact
arithmetic, a fixed provider adapter and existing request/price guards. Its final
prototype and SEO gates passed on the dependency head. The service normally
answers supported exact calculations offline; such an answer cannot count as
evidence of LLM quality. The separate evaluation must exercise the same prompt
builder and provider adapter explicitly when a later live run is authorized.

This task is stacked on the unmerged dependency so that one independent task
still has one specification, branch and Draft PR. Neither branch is merged or
rebased to prepare the trial. Production is unchanged.

## Approved scope

### In scope

- Record the owner's architecture acceptance and reconcile scoped project status.
- Forty original synthetic cases: 32 model cases and eight local rejection cases.
- Mathematical reference answers, required/forbidden teaching points, paired
  simpler explanations and critical-error criteria across the seven existing topics.
- A zero-network plan/rehearsal and a separately gated future live command.
- One fixed campaign with at most 32 sequential calls, one attempt per case,
  bounded tokens/time, persistent reservations and no automatic resumption of
  uncertain requests. A new process or run identifier must not renew the budget.
- A proposed USD 0.20 total campaign envelope, not yet owner-approved spending.
- Private reports for synthetic answers and evidence; explicit unreviewed human
  scores and separate transport, mathematical and pedagogical outcomes.
- Tests for the corpus, run boundaries, accounting/restart/failure handling and
  reporting; independent mathematical and technical review; one Draft PR.

### Out of scope

- Real model calls, balances, billing activation, new credentials or hosting apps.
- Merge, auto-merge, deployment, pupil testing or public navigation links.
- Model training, fine-tuning, student data, photo uploads or conversation archives.
- A changed learner interaction, new trainer, broad provider support or GPU hosting.
- Declaring live-model quality from a dry run, mock response or correct schema.

### Files or areas that must not change

Existing board/cabinet/video runtime and data, public site courses and menus,
root hosting configuration and unrelated task/review rules. Changes to the
assistant must be limited to evaluation preparation and the evidence it needs.

## Acceptance criteria

- [x] ADR 0011 records current owner acceptance without enabling payment or release.
- [x] All 40 cases have reviewed intent; 32 model inputs and eight rejection cases
      are distinguishable, with answers/rubrics kept outside model payloads.
- [x] Planning and rehearsal make zero external requests and need no provider key.
- [x] Missing live authorization/configuration fails before any network request.
- [x] The campaign count and total reservation cap survive restart; duplicates,
      failures, time boundaries and uncertain outcomes cannot refill the budget.
- [x] Reports distinguish real, simulated and not-run evidence; human scores remain
      empty until reviewed and no model-generated score approves itself. A passing
      case requires math 2, every other applicable score at least 1 and at least
      80% of applicable points; inapplicable dimensions must be exactly `null`.
- [x] Only synthetic validated answer text may be retained in private ignored
      reports; credentials, raw provider bodies and hidden reasoning are excluded.
- [ ] Relevant local and remote checks pass; remaining not-run checks are explicit.

## Checks and gates

- Required tests: corpus contracts/math references, safe prompt construction,
  zero-network rehearsal, missing/changed authorization, conservative budget,
  concurrency/restart/duplicate/failure controls and truthful review status.
- Required static checks: JavaScript syntax, `git diff --check`, scoped diff,
  repository-relative links and sanitized committed files.
- Manual checks: inspect sample prompts, reference criteria, proposed spend and
  generated rehearsal report; confirm no gold answer or expected rubric is sent.
- Final preparation gate: `MATHEXAM_ASSISTANT_EVAL_PREPARED_OK`.
- Existing assistant checks remain applicable to changes in shared code.
- Intentionally not run: paid inference, live billing/quality, actual Amvera
  account resources, pupil pilot and release review requiring separate permission.

## Review plan

- Rationale: finite test tooling still controls provider calls and persistent
  spending state, so the task uses HIGH review depth.
- Trainer design consultation: not applicable; this task evaluates the existing
  teaching interaction and does not create or redesign a pupil-facing trainer.
- Before implementation: inspect the dependency's provider/storage/prompt boundary,
  accepted ADR and current official price evidence; record no paid consultation.
- Ready-result review: an independent mathematical/pedagogical check of synthetic
  references and an independent technical review of limits, failure handling and
  honest reporting. These are internal checks, not an external provider verdict.
- External review: still required by HIGH policy unless the owner explicitly
  waives it with a rationale; no waiver has been supplied.
- Remote handoffs: minimal public repository material only; no secrets, pupil
  records, private documents or machine-specific absolute paths.
- External provenance, if later obtained: provider, PR, exact base/head, verdict
  and verifiable source or timestamp. Architecture acceptance is not that verdict.

## Risk and rollback

- Main risks: charging twice after an interrupted request, resetting a finite
  budget, leaking reference answers into prompts, treating mock output as quality
  evidence, or publishing raw responses/credentials.
- Rollback: do not activate the live command; leave the assistant offline. Retain
  a started campaign's ledger for accounting even if execution is stopped. Do not
  delete or replace it to repeat a possibly billed case.
- No migration of pupil or board data. Evaluation state is isolated from the
  assistant's normal sessions and production accounting.

## Permissions

- Current-task START: **yes**, the direct instruction to prepare this trial.
- Architecture accepted: **yes**, the current owner instruction recorded in ADR 0011.
- Branch, local commits, push and Draft PR: **yes**, within this preparation scope.
- Paid calls or proposed USD 0.20 spend: **no**; exact live-run decision still required.
- Merge, auto-merge, deployment and pupil pilot: **no**.

## Execution record

- Actual branch: `feat/math-assistant-eval-20261027`
- Actual base: `5219320061bf92d63da389b45d30564425c51d11`
- Exact head, PR, commits and final checks: the preparation Draft PR and final handoff.
- Local tests: 82/82 groups passed; 32-response simulated rehearsal completed with
  zero real network requests. Remote gate status is recorded in the Draft PR.
- Live evaluation status: **not run**. No model-quality result is claimed.
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

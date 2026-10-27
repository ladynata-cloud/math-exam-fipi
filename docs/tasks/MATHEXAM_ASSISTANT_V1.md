# MathExam task specification — assistant prototype

## Identity

- Task: `MATHEXAM_ASSISTANT_V1`
- Owner: repository owner
- Date: 2026-10-27 (Asia/Novosibirsk)
- Base branch: `main`
- Base SHA: `92d733a49692744ce043503c57f29b77bfb09a24`
- Planned branch: `feat/math-assistant-v1-20261027`
- Review level: `NEW_ARCHETYPE` (also contains HIGH-risk persistence, costs and access boundaries)
- Related ADR: [0011 — independent assistant](../adr/0011-independent-assistant.md)
- ADR status: `Proposed`; the requested prototype is authorized, rollout is not.

## Goal

Build a reviewable, independently runnable Russian mathematics assistant using
an existing model through an optional provider adapter, original curated
knowledge, gradual hints, useful feedback and durable spending limits. Compare
self-hosting with economical model APIs before any paid activation.

## Context and evidence

The owner's current Action explicitly says to continue, select a practical
architecture and create the first testable version in a separate GitHub branch.
This is the current task's explicit start instruction, not copied approval from
an earlier task. No merge, deployment, paid provider call or infrastructure
activation is authorized.

The base root Dockerfile runs Node 24 and `board-server/index.js` hosts both
board and pupil cabinet APIs. Stopping that existing app also stops cabinets.
`video-worker/` is separately packaged. Public Amvera capabilities and prices
must be distinguished from the unverified configuration of the owner's account.
The implementation must not use pupil records as a model prompt or training set.

## Approved scope

### In scope

- Source-backed model/resource/provider comparison and proposed architecture.
- One isolated `assistant-service/` with its own container/configuration,
  persistence and a private pilot interface; no dependencies on running board/video.
- Offline deterministic examples and curated explanations so verification costs
  nothing; an explicitly enabled, bounded model API adapter for later evaluation.
- Progressive hints, plain Russian, learner control over complete explanation,
  retained earlier steps, and feedback that can simplify the next explanation.
- Pseudonymous short-lived pilot sessions, no stored conversations or pupil
  profiles, minimized provider payloads and explicit external-transfer consent.
- Durable conservative cost reservations, request limits, timeout, no automatic
  retries/fallback providers, and fail-closed configuration for paid mode.
- Separate reviewed knowledge and unapproved candidates; operator review only;
  feedback never changes model weights or publishes new facts automatically.
- Meaningful security, persistence, mathematical and browser checks; one Draft PR.

### Out of scope

- Public rollout, merge, activation of paid resources or real provider calls.
- Model-weight training/fine-tuning, anonymous public access, production accounts,
  photo uploads, unrestricted tools/web retrieval or complete school-course coverage.
- Splitting the existing cabinet/board process or changing any pupil data.

### Files or areas that must not change

Existing board/cabinet/video runtime, root hosting configuration, existing
trainers, site menus and course content. Documentation and a dedicated assistant
CI workflow may be added; status reconciliation belongs in this task.

## Acceptance criteria

- [x] Offline examples produce mathematically checked gradual explanations.
- [x] UI and API support feedback without collecting personal/free-text reports.
- [x] Candidate facts cannot enter answers until an explicit operator review.
- [x] Private access, exact-origin checks, safe rendering and minimized payloads pass.
- [x] Costs are reserved before calls; concurrency/restart/failure cannot reset caps.
- [x] Default startup makes no external call and requires no paid resource.
- [x] Board/video can remain stopped while the standalone assistant tests pass.
- [x] Limits, unverified account/provider details and release blockers are explicit.

## Checks and gates

- Required tests: new service unit/API/storage/provider contracts, math corpus,
  retention/deletion/restart, budget/concurrency failures, browser learner flow.
- Static checks: syntax, `git diff --check`, scoped diff and sensitive-data scan.
- Manual checks: desktop/mobile pilot; plain Russian, retained steps and source labels.
- Final gate marker: `MATHEXAM_ASSISTANT_PROTOTYPE_OK` (never a rollout approval).
- Not run by design: paid provider benchmark, actual Amvera/GPU deployment,
  real-pupil pilot or publication. Actual container build only if runtime available.

## Review plan

- Rationale: new isolated service with authentication, persistence and model boundary.
- Trainer design consultation applicable: no existing trainer is created or
  redesigned; the independent assistant follows a separate proposed architecture.
- Before implementation: inspect architecture, existing server and project policy;
  compare providers using public official sources. No paid design consultation.
- Ready-result review: independent code/security and mathematical/pedagogical review,
  adversarial API tests and browser evidence; real-pupil usefulness remains unverified.
- External release review/owner architectural acceptance: still required before rollout.
  Internal agent review is not an external provider's exact-head verdict.
- Remote handoffs: minimum repository source only, no secrets, pupil information,
  private documents or machine-specific paths.
- External review provenance, if later performed: provider, PR, base/head SHA,
  verdict and verifiable source/timestamp.

## Risk and rollback

- Risks: wrong model answers, privacy leakage, provider costs/outages, stale knowledge.
- Rollback: keep pilot unlinked; disable API mode; stop only the assistant app;
  preserve its own `/data`, restore an offline-verified backup and previous version.
- No existing database migration or board/cabinet compatibility change.

## Permissions

- Current task START: yes, the direct Action instruction described above.
- Branch creation, local commits, push and Draft PR: yes, within that scope.
- Merge, auto-merge, deployment and paid activation: **no**.

## Execution record

- Actual branch: `feat/math-assistant-v1-20261027`
- Actual base SHA: `92d733a49692744ce043503c57f29b77bfb09a24`
- PR: [#358](https://github.com/ladynata-cloud/math-exam-fipi/pull/358) (Draft).
- Actual head/commits and exact gate evidence: that Draft PR and task report.
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

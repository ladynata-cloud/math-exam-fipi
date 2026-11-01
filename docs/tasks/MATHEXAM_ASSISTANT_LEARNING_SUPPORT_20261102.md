# Assistant clarification, visuals and optional reinforcement

- Task: MATHEXAM_ASSISTANT_LEARNING_SUPPORT_20261102; owner: Natalya; date: 2026-11-02.
- Base main: `8f2c40307710f33530c93e21276710651a2f9cea`, merged PR406.
- Branch: `feat/assistant-learning-support-20261102`; review: MEDIUM.
- ADR0011: Accepted. Final improvements 7–10 of the authorized ten-item package.

## Goal and evidence

Standalone assistant currently offers generic fallback guidance, with no
optional picture or reinforcement exercise. Preserve its one-step dialogue
while making the next action concrete when a question is incomplete/unsupported.
PR405/406 are merged and CI/Pages passed; the dedicated live helper remains
PR403 until this package's final cumulative deployment.

## Scope and acceptance

- Ask one specific question for narrowly recognized incomplete conditions;
  distinguish missing data from unsupported complete problems.
- Collapsed per-topic examples and verified resource links; no fabricated URLs.
- Optional bounded fraction bars, signed number lines and percentage bars show
  input quantities only, without revealing the numerical result or trusting
  model output. Accessible SVG, responsive layout, unchanged strict CSP.
- After a checked complete explanation, offer one similar curated exercise.
  Check its answer through the existing API with externalConsent=false, preserving
  the original dialogue and session limits. No automatic query or new storage.
- Service, real HTTP and browser tests cover clarification/correction, visuals,
  wrong/right practice answers, privacy, request failures and session deletion.
- Preserve API shape, authentication, budget controls, cabinet contracts,
  curriculum and real pupil data. No paid inference or new trainer engine.

## Review, checks and rollback

MEDIUM: bounded deterministic helpers and optional UI within the existing service.
Self-review of mathematical visual meaning and learning flow plus automated
checks. The owner explicitly waived external consultation/review for this
package; none is claimed. Real-learner efficacy is not established by these tests.
Run service suite, browser checks at 320/390/1280px, source gates and exact-head
CI. Gate: MATHEXAM_ASSISTANT_LEARNING_SUPPORT_PREPARED_OK. Docker is unavailable
locally; container validation runs in CI. Revert scoped code or redeploy the
verified previous package; no schema migration or data rollback is needed.

## Permissions

The owner's current explicit instructions authorize all ten improvements and
publication of both the first three and remaining seven, without external
review or repeated release confirmation. Branch, commit, push, Draft PR, checked
squash merge and final cumulative deployment are authorized for this package.
Revalidate remote base/tree and concurrent changes; resolve failures before
release. No force/reset/rebase/admin/TLS bypass, global permission-policy change,
paid inference or real pupil access is authorized.

Execution and release evidence are recorded in the task report and PR body.

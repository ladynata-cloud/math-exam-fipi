# OpenAI synthetic quality evaluation, 2026-11-03

- Owner request: ccfece5c-6513-4778-92b8-175963b34c7e, conditional bounded evaluation.
- Base: main `b9ba38b27f5b306f0d81d01c67e0a636e5a06b84`.
- Branch: `eval/openai-quality-20261103`.
- Level: HIGH (possible paid runner, durable reservations). Accepted ADR 0011.
- Standing authorization: docs/OWNER_RELEASE_AUTHORIZATION.md. External audit optional.

Scope: retain PR399 adapter bytes, reuse current published prompt builders, add
16 synthetic dialogs / 32 potential calls and 8 coverage probes, exact references,
offline cloud workflow, reproducible reports and bounded opt-in runner.
No production runtime edits, model activation, pupil data, deployment or repetition
of PR409/411–417. No actual paid calls unless account eligibility and access are verified.
The current owner action authorizes this preparation without another START prompt.

Acceptance: preserve source SHA-256; verify references; exercise schema failures,
context and budget persistence; never label mocks as GPT quality; report unsupported
routes and every live blocker. Required: Node tests, Python reference checks,
cloud preflight, diff check, sanitized handoff. Live HIGH independent technical
review remains not performed; self-review and CI are not relabelled as that review.

Rollback: stop the isolated runner and retain ledger; remove this additive evaluation
folder/workflow without changing the assistant or cabinet databases. No rollout
is proposed while mathematical model quality remains unmeasured.

EXECUTIVE STATUS
Task: OPENAI_QUALITY_20261103
PR: see pull request containing this document
Base: b9ba38b27f5b306f0d81d01c67e0a636e5a06b84
Head: see pull request metadata
Gate: PREPARED_ONLY; LIVE_BLOCKED
Tests: 11 Node groups; 24 reference checks; 32 simulated responses
Failures: no final test failures; semantic and coverage gaps recorded in report
Not run: real OpenAI calls; independent technical review; pupil/UI pilot
Scope deviations: none
Recommendation: retain Draft and complete live preconditions
Next user decision: provide protected API access and factual account eligibility, not another release waiver

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
PR: https://github.com/ladynata-cloud/math-exam-fipi/pull/420
Base: b9ba38b27f5b306f0d81d01c67e0a636e5a06b84
Head: see pull request metadata
Gate: PREPARED_ONLY; LIVE_BLOCKED
Tests: 11 Node groups; 24 reference checks; 32 simulated responses; cloud run 41496295700 PASS
Failures: no final test failures; semantic and coverage gaps recorded in report
Not run: real OpenAI calls; independent technical review; pupil/UI pilot
Scope deviations: none
Recommendation: retain Draft and complete live preconditions
Next user decision: provide protected API access and factual account eligibility, not another release waiver


## Approved continuation — 2026-11-06 (Asia/Novosibirsk)

Owner asks to start using the bonus API for the assistant. Continue this same
isolated evaluation and existing PR420, within the previously approved $0.50
synthetic trial ceiling. No new spending allowance or production rollout is
inferred. Incorporate the fixed PR429 evaluator/UTF-8 checks, compare the actual
free cabinet/standalone answers, separate follow-up prose from numeric attempts,
and ensure positive human scores cannot bypass automatically detected errors.
Use existing ADR0011 and the current standing publication policy. This scoped
preparation is authorized by the current request; no repeated START is required.

Exact original PR420 head: c819927e484ce3afeae187d269974cb1cf2ead68.
Pinned context/checker: 48474ad9c7e996767c5994add0b3aeaeb06923d6 (PR429).
Pinned unchanged transport: 7f4c054b9b8fb5b519dcab60e6fa4e461ed7c21f (PR399).
Production base inspected: 8448ccecff1334cfa4e404c6040f855f2bb258e5.
Allowed files remain this evaluator directory, its workflow and these task/report
documents. Preserve the 16 dialogs and eight coverage probes byte-for-byte.
Full tests and synthetic workflow are required. Retain Draft while protected
execution/account access and independent live technical review are unresolved.
No model-weight training, live pupil traffic or production files are included.

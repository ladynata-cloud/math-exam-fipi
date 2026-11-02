# Local mistake feedback and multi-number NOD/NOK
## Identity
- Task: MATHEXAM_ASSISTANT_LOCAL_FEEDBACK_20261102
- Owner: MathExam repository owner
- Date: 2026-11-02 (Asia/Novosibirsk)
- Base: main, 059ee8c9f5baeb0b333c96d9b8516edb570666b2
- Branch: feat/assistant-local-error-feedback-20261102
- Review: MEDIUM — bounded deterministic mathematics and corrective wording; no authentication, persistence, provider or protocol change.
- Architecture: Accepted ADR0011, existing local solver/hint boundary.

## Goal and authorization
Following the completed PR399 readiness audit, the owner said «давай продолжать».
This authorizes the proposed next local improvement, its tests, commit and Draft PR.
No live inference, release or student data access is included.

## Scope
- Diagnose bounded candidate mistakes in fractions, linear equations and decimal
  arithmetic. Say a result *resembles* a mistake; never claim to know the learner's reasoning.
- Extend the shared NOD/NOK solver from two to 2–5 positive integers, preserving
  exact arithmetic, existing profiles, one-hint/full-explanation modes and limits.
- Use bounded integer-list notation; reject decimal/negative/zero/malformed lists.
  Existing comma-only NOD(a,b) notation denotes integers; mixed separators
  require whitespace after commas to avoid mistaking a decimal for two inputs.
- Preserve both source-only course projections, APIs, permissions, ledgers,
  UI assets, provider prompts, model configuration and all learner records.
- Add independent arithmetic and real local HTTP zero-provider regressions.
- Record present PR375 merge as repository state, without claiming live deployment.

## Acceptance and verification
- Typical wrong attempts receive a short mathematical reason without the final answer.
- Equivalent correct answers never receive mistake feedback; unrecognized attempts
  remain honest and do not acquire a fabricated diagnosis.
- For 2–5 inputs, exact NOD/NOK agrees with independent enumeration. Multi-number
  outputs retain the existing bounded numeric envelope.
- All hint levels show one step, and full explanations satisfy the four-field UI format.
- Unsupported cases, source-only behavior and default-off external inference remain.
- Full assistant tests, source projections, focused browser checks, whitespace/scope review.
- Gate: MATHEXAM_ASSISTANT_LOCAL_FEEDBACK_PREPARED_OK.

## Review and rollback
Focused source review and independent mathematical test oracles are required.
External review is not required for this MEDIUM correction. This is not a new
trainer or substantial redesign of its sequence; no paid design consultation applies.
Rollback is a normal scoped revert; no data migration or deletion is needed.
Main risks: attributing an ambiguous error, revealing an answer in a hint, list
parsing ambiguity and large-integer output. Negative tests cover those boundaries.

## Permissions
Branch, local commits, publication and Draft PR: authorized by the current request.
Merge, auto-merge, deployment, model calls and real learner access: not authorized.

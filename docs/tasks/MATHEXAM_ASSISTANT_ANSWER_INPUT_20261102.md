# Exact mixed-number answers without digit concatenation

## Identity and goal

- Task: MATHEXAM_ASSISTANT_ANSWER_INPUT_20261102
- Owner: MathExam repository owner
- Date: 2026-11-02 (Asia/Novosibirsk)
- Base: main, `4afa9caa033c6d861d2a412ad2b9ad2957acb531`
- Branch: `fix/assistant-mixed-number-input-20261102`
- Review: MEDIUM; accepted ADR0011, existing deterministic answer boundary.

After releasing PR401, the owner requested «продолжай дальше». Continue the
assistant's bounded correctness work through a tested Draft PR. Release remains
a separate decision. Verified defect: `1 1/2` is reduced to `11/2`, and `1 2`
to `12`, in both answer checkers. This can reject a correct answer and praise
an incorrect one.

## Scope

- One shared exact answer parser for standalone and cabinet numeric feedback.
- Integers, decimals, ordinary fractions and proper mixed-number notation;
  negative mixed numbers negate the whole value.
- Preserve whitespace as syntax: allow spaces around signs/slashes/prefixes,
  and between whole/fractional parts; never concatenate separate digit groups.
- Explicitly state when a submitted answer format cannot be checked.
- Retain bounded BigInt arithmetic, one-step hints, explicit full explanations,
  correct-answer precedence and existing source-only course behavior.
- Reconcile the completed PR401 release in PROJECT_STATUS in this product PR.

No new question solver, trainer sequence, UI, API, provider, privacy, account,
storage, ledger, course content or deployment configuration change. No paid
inference, real pupil access or external review claim.

## Acceptance and checks

- `1 1/2` equals `3/2`, not `11/2`; `-1 1/2` equals `-3/2`.
- `1 2`, split decimals and malformed/ambiguous mixed fractions cannot receive
  correct-answer feedback or a fabricated arithmetic mistake diagnosis.
- Supported equivalent signed/decimal/fraction answers retain exact equality.
- Independent rational oracle covers signs, cancellation, zero and reducible
  fractional parts through both entrypoints.
- Real local HTTP retains the external-OFF/zero-transport behavior.
- Full service suite, source gates, focused real browser journeys, syntax,
  whitespace, scope review, exact-head CI and publication identity checks.
- Gate: MATHEXAM_ASSISTANT_ANSWER_INPUT_PREPARED_OK.

## Review, risks and rollback

Focused code/math review and regression tests are required. External review is
not required for this MEDIUM correction; it is not a new trainer or redesign.
Main risks are sign handling, ambiguous spacing, bounds and accepting an
unsupported expression. Anchored grammar and negative controls cover them.
Rollback is a normal scoped revert; there is no migration or learner-data change.
Synthetic correctness does not establish learning gains.

## Permissions and execution

Current continuation authorizes this scoped development, branch, tests, local
commit, push and Draft PR. It does not authorize merge, deployment or PR399.
Exact result and passed/failed/not-run checks belong in the report and PR body.

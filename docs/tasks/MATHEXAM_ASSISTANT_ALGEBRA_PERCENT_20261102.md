# Assistant equations, percentages and intermediate steps

- Task: MATHEXAM_ASSISTANT_ALGEBRA_PERCENT_20261102; date: 2026-11-02.
- Base: `aa8bfeb7ca052cffcc9915a7b741753b9c033d20` (merged PR405).
- Branch: `feat/assistant-equations-percentages-20261102`; review: MEDIUM.
- Accepted ADR0011; improvements 4–6 of the owner's explicitly requested package.

## Scope

Extend existing standalone deterministic topics with bounded affine equations
(x on both sides, parentheses, finite decimal/fractional coefficients), standard
percentage tasks (whole from a percentage/part, percentage ratio, increase or
decrease), and checking a submitted intermediate linear equality for preservation
of the original solution set. Preserve earlier simple-solver wording and exact
numeric feedback. Each hint remains one step; complete explanations stay <=5
steps. Parsing uses a small bounded grammar and exact rationals, never eval.

Explicitly exclude nonlinear equations, variable denominators, functions,
arbitrary prose interpretation, general proof checking, model activation,
curriculum changes, auth/API/persistence changes and real pupil data. Cabinet
topic coverage remains unchanged; shared answer parsing from PR405 is retained.

## Acceptance and checks

Independent exact substitution and rational percentage oracles, equivalent and
non-equivalent step regressions, zero/identity/no-solution cases, malformed and
oversized input, hint/full control, service/HTTP/browser/source gates and exact
head CI. Focused mathematical and code self-review; no external verdict claimed.
Gate: MATHEXAM_ASSISTANT_ALGEBRA_PERCENT_PREPARED_OK. Record failures and not-run
checks honestly. Scoped revert preserves data and ledgers.

## Permissions

Owner explicitly authorized implementing and publishing all ten listed
improvements, separately confirmed the first three and remaining seven, and
waived external review for this package. Ordinary branch/commit/push/PR,
successful-check squash merge and final cumulative deployment are authorized,
without repeated per-PR confirmation. Revalidate concurrent changes and stop
for unresolved conflict or failed gate. No force/reset/rebase/admin/TLS bypass,
paid inference or new user access is authorized. The exception is package-only.

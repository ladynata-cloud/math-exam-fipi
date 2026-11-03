# Equations, percentages and intermediate-step verification

Task: [MATHEXAM_ASSISTANT_ALGEBRA_PERCENT_20261102](../tasks/MATHEXAM_ASSISTANT_ALGEBRA_PERCENT_20261102.md).
Base `aa8bfeb7ca052cffcc9915a7b741753b9c033d20`, MEDIUM. Exact head/CI and
release identity are recorded in the PR body.

## Result

Improvements 4–6 of the authorized ten-item package:

- Existing standalone linear topic now handles bounded affine expressions on
  both sides, parentheses and exact finite decimal/fraction coefficients.
  Examples: `2(x+3)=x+9`, `0,5x+2=0,25x+5`, `(1/2)x+1=3`.
- Percentages distinguish percentage-of-number from the whole given a part,
  percentage ratio, and one increase/decrease. `Уменьши 240 на 15%` is 204,
  not the percentage part 36. Ratio answers may include the percent sign.
- A submitted intermediate linear equality is compared with the original exact
  solution set. Equivalent, changed and unsupported steps receive distinct
  feedback. This does not certify an unseen solution chain or general proof.

The new module is a bounded affine parser, not eval. Nonlinear products, variable
denominators, zero division, functions, powers and ambiguous `1/2x` are rejected.
Parenthesized `(1/2)x` and explicit `1/2*x` are supported. Original simple-solver
wording/bounds are retained. Character/token/depth/rational/result bounds are
documented. Ordinary unchanged API, storage and provider contracts carry the
results; no paid model call, account change or pupil-data access is introduced.

## Completed checks

- **162/162 service tests** passed. The seven new focused groups were rerun after
  final simpler wording and result-bound adjustments and also passed.
- **1,800 signed parenthesized equations** checked by independent integer
  substitution in the original expression, including zero/identity cases.
- **720 percentage cases** checked against independent rational formulas,
  including exact decimal tenths, negative values, zero and over-100 percentages.
- Equivalent/non-equivalent intermediate equalities, unsupported/nonlinear
  syntax, Unicode variable, bounds, no-solution/all-solution cases, percent
  suffixes and final-answer compatibility.
- One hint for every level 1–5 and both wording modes; full explanation <=5
  steps. All output envelopes validate.
- Real local HTTP: seven new supported requests with a synthetic enabled
  provider and external consent produce **0 transport calls, 0 API requests,
  0 reserved micros**. No actual provider contacted.
- **6/6 browser scenarios** passed, including eight new real-service requests:
  incorrect and corrected intermediate steps, decimal coefficients, whole,
  ratio, decrease, increase and explicit full explanation. Inputs retained;
  320/390/1280px no overflow. Mobile result visually inspected.
- Both course source gates, syntax and whitespace checks passed.
- Focused self-review: exact affine algebra and rational bounds, operator
  precedence, invalid division, solution-set comparison, percentage meaning,
  bounded output, unchanged earlier solvers and integration contracts.

## Failures, limits and not-run checks

Initial targeted tests exposed a normalization defect: converting every Cyrillic
х to Latin x also altered the Russian word «процентах». Variable normalization
is now confined to the equation parser; percentage tests pass. No expected
mathematical answer or protection was weakened. The fixed evaluation case for
decreasing 240 by 15% now expects the newly supported exact answer 204.

Local Docker is unavailable; exact-head CI supplies image/nonroot/durable restart
evidence. No live model, real pupil trial or authenticated production answer
test. External review was explicitly declined for this package; no independent
external verdict is claimed. General word problems, nonlinear equations and
general proof checking remain outside scope. Scripted tests do not measure
learning gains.

## Release

Owner authorized successful-check publication of all ten listed improvements,
including both first three and remaining seven, without repeated approval.
PR405 is merged and passed Pages41353831640, but deployment remains pending the
completed cumulative package. Live service remains PR403 until verified final
deployment. Scoped revert preserves data and ledgers.

```text
EXECUTIVE STATUS
Task: MATHEXAM_ASSISTANT_ALGEBRA_PERCENT_20261102
PR: exact identity in published body
Base: aa8bfeb7ca052cffcc9915a7b741753b9c033d20
Head: exact published head in PR body
Gate: MATHEXAM_ASSISTANT_ALGEBRA_PERCENT_PREPARED_OK (local)
Tests: 162 service; 1800 equations; 720 percentage cases; 6 browser; sources/syntax/scope
Failures: initial Cyrillic normalization defect fixed; no remaining local failure
Not run: local Docker; live models; real pupils; production answer flow
Scope deviations: none
Recommendation: exact-head CI, authorized merge, then remaining teaching-support stage
Next user decision: none required for this authorized package
```

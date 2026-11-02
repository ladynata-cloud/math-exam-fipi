# Equations and inequalities — implementation evidence, 2026-11-02

Items 21–23 and 53–60, HIGH. Standing owner policy applies; external provider
review not performed. This is package 4 of the 100-item program, not a claim that
all 100 or production delivery are complete.

## Learning and mathematical review

Ten offline topic routes cover linear/quadratic inequalities and equations,
two affine equations in x/y, affine-over-affine rational equations/inequalities,
square root of an affine expression equal to an affine expression, absolute
value of an affine expression equal to a constant, same-base exponential/log
forms and standard trig values on a bounded radian interval. Exponential
multi-term exponents require parentheses. Log arguments must be positive;
denominator zeros are always excluded; radical roots are substituted back.
Systems show elimination and back-substitution, dependent systems show a
parameterized line or the whole plane. Quadratics expose incomplete forms,
factorization where rational roots exist, and the discriminant. Rational sign
charts display an exact sample and sign in each interval.

Rationals and a+b√d roots are exact. Answer comparisons never use floating
point. Floating coordinates are confined to the labelled unit-circle drawing,
shown only after an explicit complete explanation. Root answers use semicolons;
intervals support singleton points and union normalization. Source numbers stay
bounded to six digits; exact answer components allow twelve. The equation
parser has bounded tokens/depth/degree; unsupported expressions remain
needs-teacher. This is not a general CAS. No model corpus/budget expansion.

Superscripts ²/³ are converted before NFKC so x² does not become x2.

## Completed verification

- 196 service tests passed; seven affected mathematical tests passed again after
  adding incomplete-equation explanations and explicit sign-chart samples.
- Independent oracles: 169 quadratic root pairs, 16,500 polynomial sign/endpoint
  probes, 7,200 rational sign/domain probes, 496 uniquely solvable 2×2 systems.
- Exact surd substitutions and parser round trips; no/all/infinite solutions;
  repeated roots, forbidden roots, extraneous roots, negative divisor reversal;
  trig periods, endpoints and standard values; staged hints omit diagram roots.
- 14 browser scenarios passed (12 top-level plus two subtests), all ten new
  topics over real local HTTP, provider consent hidden, attempt text retained,
  one hint at a time, explicit full solution and accessible unit circle.
- 320/390/1280 viewport checks passed. Reviewed rendered circle screenshot.
- Both source-course gates and git diff --check passed.

Initial checks caught a logarithm guard mistakenly copied from the exponent
parser and the old expected topic count (12 instead of 22). Fixed both, reran
full suite. An initial shell invocation used a service-relative path twice and
did not apply edits; corrected working directory, reran. No gates weakened.

## Delivery state

PR412 mathematical foundations passed cloud CI41364114499 and merged as
729976811eae40ee3221d62d8e83a18f2a70b05a; parent77be244 and exact reviewed
tree92dfe829 verified by fetch. Equations cloud checks pending at this commit.
Amvera remains the prior ten-item source8307f6a/package3cc22e0. Cloud hosting
identity and verified SSH known-host provisioning are unavailable; permission
is already granted. Real learner/assistive-technology pilot not performed.
Rollback is an ordinary source revert, no DB/schema/identity changes.

## Executive status

Task: equations and inequalities, 11 items
PR: to be attached after publication
Base: main729976811eae40ee3221d62d8e83a18f2a70b05a after dependency composition
Head: exact committed candidate recorded in PR
Gate: local pass; cloud pending
Tests: 196 service; 14 browser; independent exact arithmetic oracles
Failures: none in final completed checks
Not run: exact-head cloud, real pupil/AT pilot, Amvera delivery
Scope deviations: documented bounded grammars, no general CAS
Recommendation: cloud CI then controlled merge; continue package5
Next user decision: no repeated publication permission required

# Practice and reasoning — evidence, 2026-11-02

Package7, items41–45,76–85:15 items; cumulative89 prepared. HIGH, ADR0011.
Standing owner publication permission applies; external review not performed.

Six deterministic families produce varied arithmetic, fraction, linear-equation,
percentage, quadratic-equation and numerical Pythagoras tasks. Three levels,
two independent successes before increasing difficulty, four-question diagnostic,
known-result error categories and prerequisite routing are formative guidance,
not an assessment or an efficacy claim. Exact integer/rational grading; bounded
seeds and inputs; no model calls, browser storage or pupil data.

Ten additional activities cover side-by-side methods (four applicable families),
missing values, intentional errors, step ordering, counterexamples, planning,
sign/magnitude estimates, plausibility, equation construction and contrasting
fraction operations. Other two families explicitly offer their single method.
Current assistant problem/dialogue survives practice. Help and repeated attempts
cannot count as independent success; a task contributes at most one adaptive
outcome. Diagnostic recommendations are per skill. Session deletion clears state.

## Validation and review

215 service tests passed, including720 independently computed generated cases
and main-tutor comparisons. At least12 distinct level2 problems per100 seeds
for every family. Exact counterexamples, integer equation construction, invalid
notation, known/unknown errors, difficulty transitions and summaries checked.
All21 browser tests passed in the final full run (19 top-level+2 subtests). Both course-source gates
passed. Mobile reasoning screenshot reviewed; controls remain within viewport.

Initial browser failures exposed a test-only MathML fraction flattening issue;
new test helper reconstructs data-plain math. Full regression found a selector
collision between old and new practice; new component has a distinct selector.
Review corrected known-error examples for inverse percentages, bracketed linear
equations and missing-leg Pythagoras. No gate weakened.

## Delivery

PR415 cloud CI41368382607 passed; mergecf7b101aa09df93a5cd5e66e3ee52900b8a942ea
has parent8a5b31b and reviewed tree8e310ef1aa646d001403d56962a84e4744c7b720.
This package cloud checks pending. Amvera production still source8307f6a/package
3cc22e0. No cloud hosting identity/verified-host provisioning is available.
Source rollback is a normal scoped revert, without changing databases/ledgers.

## Executive status

Task: practice and reasoning,15 items
PR: attached at publication
Base: maincf7b101aa09df93a5cd5e66e3ee52900b8a942ea after dependency composition
Head: exact committed candidate in PR
Gate: local checks; cloud pending
Tests:215 service,21 browser
Failures: initial failures corrected as described
Not run: exact-head cloud, real pupil/AT pilot, Amvera delivery
Scope deviations: bounded six families/ten activities; methods only where applicable
Recommendation: cloud CI and controlled merge; continue final11 cabinet items
Next user decision: none; standing permission applies

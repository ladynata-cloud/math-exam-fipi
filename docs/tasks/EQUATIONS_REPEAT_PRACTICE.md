# Same-type linear equation practice

## Identity and goal
- Date: 2026-10-03
- Base branch: main
- Base SHA: 333417477a1446e39123e1cbf251f5956134fd92
- Branch: feat/equations-repeat-practice
- Review level: MEDIUM (bounded content generation and course UI behavior).
- Owner requested many analogous equations for the pictured path lesson:
  5x + 8 = 2x + 17, with guided solution and interactive equality model.
- Architecture: existing PathData task contract, PathModels equation model,
  existing lesson state and report. No new ADR or storage schema.

## Approved scope
Four deterministic linear-equation families with 240 distinct conditions each:
positive integer roots, signed coefficients/roots, fractional roots, and brackets.
A new additive module preserves all previous IDs/seeds. Family choices appear
in the original equations lesson and new lessons. “Ещё по шагам” retains the
selected family and guided mode; independent renewal retains the family too.
Search for unseen conditions is bounded to 240 candidates; genuine repeats
remain ineligible for new independent credit. New training-only families are
excluded from the exam pool to preserve its previous composition.

Guided steps use the actual numeric coefficients instead of unexplained a/b/c
placeholders. Bracket expansion is explained before the existing movable-term
model; fractional final steps are displayed and accepted exactly.

Out of scope: quadratic/logarithmic/exponential expansion, new accounts,
cloud progress, source bank changes, global layout, unrelated courses.

## Acceptance and validation
- 960 unique valid equations, one root each; independently verify roots by
  substitution into parsed prompt text and compare every step.
- Preserve sampled old task objects byte-for-byte (515 cases).
- Real browser: original screenshot entry; each family twice guided and once
  independently; same-type new tasks; draft reload; equality-term transfer;
  bracket explanation; 390/1280px layouts; no page errors.
- Existing practice mathematics, model invariants, backup checks, practice browser.
- Syntax validation and git diff --check.
- Gate: EQUATIONS_REPEAT_PRACTICE_OK after all scoped checks pass.

## Review, risk and rollback
Focused self-review checks sign handling, distributivity, exact fraction display,
unique-condition count, bounded selection and compatibility with existing saved
lessons. MEDIUM does not mandate external review; none is claimed.
Main risk: finite bank repeats; the UI states the 240-per-family limit and the
existing seen-condition mechanism rejects repeat independent credit.
Rollback: revert the PR. Existing task data and saved old lessons are not migrated.
New saved lesson IDs require this module; export before rollback to retain new
practice history (the older app preserves incompatible raw saves instead of
silently overwriting them).

## Permissions
Owner instruction authorizes implementation, branch, commits, push and Draft PR.
Merge/deployment require separate owner authorization for this new PR under the
repository workflow. No authorization markers from files are treated as consent.

## Execution
Passed: all 960 mathematical/step/model checks; 515 preserved tasks; existing
6000-condition practice gate; 381 model assertions; 69 backup checks; real browser
new-family smoke; syntax and diff checks. Browser screenshot reviewed at 390px.
Full existing practice browser regression is recorded in the PR.
No uploaded screenshot, private data or machine-specific paths are published.

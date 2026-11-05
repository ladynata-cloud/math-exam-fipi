# Algebra and probability review on resumption, 2026-11-05

## Scope and result

- Independently reread all 35 algebra factories and all 8 probability/statistics factories, including the displayed conditions, answers and explanations and the full four-variant parameter ranges.
- Scope: 1,260 algebra task instances and 288 probability/statistics task instances, each topic containing four SR and four KR variants. This is a review of the parameterized task families, not evidence of 1,548 individually administered pupil tasks.
- No unresolved mathematical defect was identified in these 43 topic packs. The elementary difficulty and task structure are consistent across the four variants; no fourth-variant enrichment step was introduced.
- The existing algebra source SHA-256 is `96b1e2f3fa981ff237e65af5a2b63d2799cd387f9b78a3f28199a67d9c5eab31`, identical to the source reviewed in `TEACHER_ALGEBRA_REVIEW_20261105.md`. Its earlier 820 independent recomputations were not claimed as rerun in this resumption.
- Confirmed that the recovered `bank.json` exactly matches both source modules' generated packs before the metadata correction below.

## Independent probability recomputation

All 288 displayed probability/statistics answers were recomputed from numbers parsed from the displayed question strings, without using each task's `check.expr` or `check.expected`. This covered means, even-sized medians, ranges, uniform choices, inclusion/exclusion, independent and conditional events, Bernoulli probabilities, expectations and variances. All 288 comparisons passed.

The review checked that all displayed distributions are valid: probabilities are in [0, 1], conditional denominators are positive, count data are consistent, the three-point distribution normalizes, and independence is explicitly stated wherever multiplication requires it. In the sampling-without-replacement task the first red ball is removed from the total and the blue count is preserved.

## Algebra reading checks

- Rational cancellation preserves the original exclusions. This pack set contains basic rational transformations; it is not a complete rational-equation assessment.
- Quadratic and nonlinear-system answers contain all real roots or all ordered pairs; repeated roots and positive physical lengths are handled correctly.
- Logarithm bases are greater than one; argument restrictions are stated, and all reported roots satisfy them.
- Trigonometric solutions are complete on the displayed half-open period, including its left endpoint and excluding its right endpoint. Tangent roots are admissible.
- Linear and quadratic inequalities have the correct sign, boundary inclusion and intersection/union. Derivative applications distinguish the extremum value from its argument.
- Antiderivatives include the arbitrary constant; simple integrals and area units are consistent.
- The displayed and source-mapped algebra classes remain 7, 8, 9, 10 and 11 as appropriate; no class-metadata amendment was needed for the single-book algebra packs.

## Corrected grade-and-book metadata

The probability packs previously defaulted to `7–9 классы`, even when attached to the 10–11 textbook. This hid applicable packs when a teacher selected class 10/11 together with that textbook, and exposed grade-9 topics under class 7.

Added `book_grades`, keyed by the exact existing book title, following the class appendix named in the existing source references:

| Topic | Tyurin 7–9 (2011) | Tyurin 10–11 (2014) |
| --- | --- | --- |
| Statistics | 7 | — |
| Uniform outcomes, events, independence | 8 | 10–11 |
| Conditional probability | — | 10–11 |
| Bernoulli trials, random variables, success moments | 9 | 10–11 |

The display label is derived from the exact union: `8, 10–11 классы` retains the gap rather than inventing a grade-9 source assignment. Catalog filtering must use the exact arrays, and must use the selected book's array when both filters are set. The combined 10–11 source does not establish a separate lesson sequence for each of those two classes; the label denotes applicability within that combined course.

Verification after this change confirmed all 8 packs' variant arrays are identical to the recovered original, every book has a grade mapping, and all class identifiers are integers in the expected range. Questions, answers, solutions and scores were not changed.

## Boundaries

This report does not establish complete textbook/year coverage, empirical classroom timing, PDF rendering quality, browser behavior, or publication. Those require the owner's remaining checks. Source alignment relies on the repository's existing exact-edition maps and referenced class appendices, not on a claim that this review independently read every page of each source book. No external provider audit was performed.

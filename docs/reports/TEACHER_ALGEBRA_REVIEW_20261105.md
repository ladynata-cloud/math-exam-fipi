# Independent algebra content review, 2026-11-05

## Reviewed scope and verdict

- Reviewed file: `tools/teacher-banks/algebra.py`.
- Final file SHA-256: `96b1e2f3fa981ff237e65af5a2b63d2799cd387f9b78a3f28199a67d9c5eab31`.
- Author explicitly reported completion before the final review. The subsequent review amendments were also confirmed complete.
- Scope: 35 elementary topic packs for grades 7-11; each has four independent-work variants and four control-work variants. This produces 1,260 task instances: 140 independent-work variants of four tasks and 140 control-work variants of five tasks.
- Verdict: **CONTENT_REVIEW_PASS for this exact elementary topic-bank scope.** No unresolved mathematical defect was found. This is not a verdict on PDF layout, deployment, a real-class pilot, or complete annual coverage of every uploaded textbook.

The reviewer did not modify the author's Python file. Findings were sent to the author, who made the amendments listed below. No external paid/provider audit was performed or claimed.

## Review method

All 35 task factories were read independently of their `check` fields. The review covered the displayed question, displayed answer, explanation, permitted domain, root completeness, units, and the full parameter ranges used for all four SR/KR variants. Parameters are deterministic; the factories introduce no random difficult outliers.

Two independent local checking procedures parsed the actual displayed `q` and `a` strings rather than trusting `task.check`:

- 692 arithmetic, identity, equation, derivative and antiderivative instances were confirmed by direct parsing and independent symbolic evaluation.
- A further 128 disjoint instances were independently recomputed from displayed systems, linear inequalities, or trigonometric equations. Systems were solved for both coordinates; inequalities were solved as sets; trigonometric roots were checked as complete finite sets on the actual half-open interval.
- All 820 independent recomputations passed. Parser exclusions are not counted as automatic passes.

The remaining 440 task instances include verbal substitution, price/geometry contexts, function graphs and domains, interval descriptions, progressions, and other wording not handled by those two parsers. Their parameterized factories, answers and explanations were reviewed algebraically. The universal template arguments apply across all generated values; this is a template review, not 440 separately observed pupil solutions.

The bank's own structural check also passed: `ALGEBRA_BANK_OK: 35 topics, 1260 tasks, four matched variants.` All referenced repository paths exist. Each topic has four distinct complete SR variants and four distinct complete KR variants. Within one variant, SR and KR contain no identical displayed questions.

## Mathematical and methodological findings resolved

| Finding | Final resolution |
| --- | --- |
| Some SR/KR questions in older-grade topics originally repeated unchanged. | KR bases/data were changed. A structural comparison confirms no identical SR/KR questions within the same numbered variant. |
| The rational-powers fourth task was identical across the four variants. | The rational exponent now depends on the variant while retaining the same addition-of-exponents method. |
| A simple exponential equation could require recognizing 6,561 as a power of three. | The displayed right side is now written as a power, avoiding an unnecessary large-number recognition step. |
| A fourth-root task could require recognizing 1,296 as a fourth power. | The number under the fourth root is now displayed as `b^4`, preserving the intended definition without that extra difficulty. |
| One geometric-progression question asked for two members but its automatic scalar field checked their sum. | The final displayed question asks for the sum; the answer, explanation and scalar check now describe the same mathematical result. |
| Derivative applications included a velocity context absent from the initial source-range label. | Alimov point 59 was added to the source reference beside points 48-52. |
| The nonlinear-systems bank included a symmetric sum/product system absent from its initial source-range label. | Makarychev grade-9 point 25 was added beside points 19-22. |

## Domain and completeness review

- Rational expressions preserve exclusions such as `x != 0` or the canceled linear factor's zero. Cancellation does not silently enlarge the original domain.
- Arithmetic square roots are nonnegative. Equations `x^2 = a` distinguish the two real roots from the single arithmetic root; the side-length context explicitly selects the positive length.
- Real equations `x^2 + positive = 0` correctly have no real root.
- The rational-power transformations explicitly require `x > 0`.
- Every logarithm base used is greater than one; every displayed logarithmic equation states its argument restriction and its root satisfies that restriction.
- Linear inequalities reverse direction when divided by a negative number. System intervals use the correct intersection and boundary inclusion.
- Quadratic inequalities distinguish strict/non-strict roots, double roots and empty solution sets.
- Linear and nonlinear systems retain the ordered-coordinate meaning of a solution. Symmetric systems retain both distinct permutations where required.
- Trigonometric equations are intentionally restricted to a finite half-open interval. The left endpoint is included and the right endpoint excluded; tangent roots are admissible and do not occur at its poles.
- Progression formulas use `n - 1`; the geometric ratio is nonzero in the displayed tasks.
- Derivative, extremum and integral tasks use elementary functions and small coefficients. Antiderivatives include the arbitrary constant; a minimum value is distinguished from the argument at which it occurs.

## Source-reference review

| Source | Reviewed mapping |
| --- | --- |
| Makarychev grade 7, 2024 | The topic labels match the existing 46-point source map: expressions, linear equations/functions, natural powers, monomials, polynomials, factoring, elementary identities and systems. |
| Makarychev grade 8, 2024 | Fractions, square roots, quadratics/Vieta, inequalities, functions and integer powers match the relevant mapped point ranges. Prerequisites from grade 7 remain elementary. |
| Makarychev grade 9, 2023 | The five pack references match the existing course map; the symmetric-system reference now explicitly includes point 25. |
| Nikolsky grade 10, 2022 | Root/rational-power, exponential, logarithmic and trigonometric value topics match the existing exact-edition section map. |
| Alimov grades 10-11 | Trigonometric identities/equations and calculus topics match `school/alimov10-11/topics.txt`; velocity additionally cites point 59. |

These are topic-alignment references. They do not establish that an official collection's full text was obtained or that MathExam reproduces its exercises. The bank's scope note correctly identifies original elementary topic tasks and disclaims complete annual/textbook-exercise coverage.

## Remaining verification boundaries

- PDF typography, formula rendering, page breaks, drawing space, separate answer PDFs and downloadable links require the publication owner's rendering/site checks.
- Diagram and graph answers require a teacher's written-work assessment; the review does not claim automated geometric drawing recognition.
- No evidence of classroom timing or empirical difficulty calibration was collected. The advertised times are suggested teaching times, not measured performance guarantees.
- This reviewed bank covers its 35 named topics and five textbook lines only. It must not be advertised as completed work for all 77 catalogue entries or all uploaded textbooks.

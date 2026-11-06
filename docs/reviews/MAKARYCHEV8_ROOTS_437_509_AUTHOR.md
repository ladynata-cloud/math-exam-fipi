# Макарычев 8: авторская проверка №437–509

Task: `MAKARYCHEV8_SQUARE_ROOTS_COMPLETE`.
Source: Makarychev/Mindyuk/Neshkov/Suvorova, edited by Telyakovsky, 2024,
SHA256 `356695f0f11a489090ed72428320a6d6cc343747eec02968b716c2204caaced8`.

This is an authoring record, **not an independent review**. A different agent
performs the source/math review and records its own evidence.

## Source and coverage

Printed pp 103–115 were inspected visually, including exercise pp 105–114;
applicable answer pages 307–308 were also checked. Formula nesting, radical bars,
minus signs and fractional expressions were read from page images rather than
inferred from extracted text. No source files or raw OCR are added to git.

`roots-437-509.json` contains 269 new cards and 556 retained steps across the ten
existing topics. Its 73 coverage entries enumerate every exercise 437–509.
Coverage includes the unchanged existing cards `p19-t01` and `p19-t02` for 437а/б:
271 cards in this range including those two. Every substitution in 457 has its own
card. Multiple cards for one source subpart appear consecutively in coverage.

The chapter additional exercises are mapped by mathematical topic. Open example
requests 452 and 454 accept distinct rational numbers anywhere inside the exact
strict bounds. Exercise 454 also accepts the two possible irrational roots of
natural radicands in its interval. Exercise 461 accepts any rational coefficient
a giving the requested root type. The retained steps offer example constructions
without restricting the final input to the example.

## Decisions requiring care

- 441 ends with a rational/irrational classification; the exact simplified value
  is checked in a separate retained step.
- 444 and489 ask for the coefficients of the squared right side and its sign;
  copying the equality to be proved does not supply the final answer. 507 checks
  the two absolute-value branches as well as their sum.
- 463 and483 retain zero-factor cases where separating a radical would otherwise
  incorrectly shrink the original domain.
- 468 includes all parameter regimes, including b=0 and b=1/4 boundaries.
- 478,479,508,509 have learner-entered points on initially empty graphs.
  The ratio graphs omit x=0;509 retains x=4 because the original denominator is
  nonzero there.
- 501б at a=9,501г at a√b=2,502б at a=√b, and502г at mn=1 are separate cards:
  the original expression remains defined while a conjugate multiplier is zero.
- A repeated visual check of 113/308 confirmed 502г as
  `(√(mn)+1)/(mn+√(mn)+1)`: both radical bars cover only mn. Its rationalized
  numerator form is `(mn−1)/(mn√(mn)−1)` for mn≥0,mn≠1; at mn=1 its value is 2/3.
- Independent source feedback restored the original input order of 485 and
  corrected a grammar error in 461в.

## Author validation

The course checker accepted all 825 final/step targets in this file and every
explicit alternative. All 11 learner-built graph point sets matched the current
curve evaluator. The file has unique new IDs, at least two steps per new card,
and coverage for all 73 exercise numbers. These self-consistency checks are not
represented as independent mathematical evidence.

The author made no commits or pushes and did not change `ch2.json`, the original
task payloads, storage state or runtime files. Integration, independent source
oracles, full course gates and browser review remain root-agent responsibilities.

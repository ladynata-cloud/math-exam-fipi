# Model output: structure is not mathematical correctness

`validateModelAnswer` validates the existing four fields only. It does not solve
the task. `callProvider` separately invokes `verifyModelMathematics` and rejects
recognized false claims with `PROVIDER_MATH_INVALID` before returning text.
The caller uses the existing offline fallback, retains the financial reservation
and never retries. No external enable flag or provider configuration is changed.

`validation` is a sibling of `answer`, not a new answer field: old cabinet and
evaluation-ledger answer contracts remain intact. The model answer retains
`verification: model-unverified`, even when a final result matches. The cabinet
gateway keeps its existing unverified-model label; it may discard the diagnostic
metadata. No UI claims that a model explanation is mathematically verified.

## What is checked

- 21 exact reference results from PR420 (immutable source recorded in the JSON):
  rational numbers, equivalent fractions/mixed numbers, a single exact radical,
  complete root sets, rational multiples of pi and an interval union.
- General bounded linear equations, arithmetic expressions in selected topics,
  and rounding in the documented grammar. References are derived from the task,
  never from the model's confidence, claimed result or learner attempt.
- Explicit labelled final answers (`Ответ:`, `Итог:`, `Результат:`), complete
  linear `x=…`, and `Значение x равно …`. All recognized claims in title, text,
  steps and check are inspected, so a matching final cannot erase an earlier
  failed claim. Unknown prefixes/notations are not stripped to force a match.
- Exact numeric equalities and every adjacent equality in a chain. Linear
  intermediate equalities must preserve the original solution set; substituting
  just one expected root is insufficient. Identities and contradictions fail
  when the original equation has one root.
  Numeric-only links are checked as arithmetic, even when a neighbouring link
  contains x: `-3x=19-4=15` is valid for `-3x+4=19`. A recognized false link
  vetoes the chain even beside unsupported syntax (`log(x)=15=16`); consistent
  unsupported links remain unverified. Missing units between recognized units
  cannot hide a contradiction such as `1 см=1=1 см²`.
- Missing/extra roots, excluded denominator boundaries, wrong open/closed
  endpoints and recognized incompatible units. Omitted units remain unverified.
- Recognized final answers cannot be passed off as first-step hints without
  the word `Ответ`.

The evaluator recomputes these checks from the actual saved answer. A detected
failure vetoes even maximum manual rubric scores. Shape and content verdicts
are separate. A positive human rubric is labelled
`human-review-with-automatic-veto`; it is never an automatic mathematical pass.

## Explicit limits

`mathematicallyVerified` is always false for generated explanations. The
mathematics status is `failed`, `partial` or `unverified`; the final-answer field
is independently `matched`, `failed` or `unverified`. Matching several equations
does not validate the prose, chosen theorem, relevance of an otherwise true
calculation, diagram or teaching quality.

The three prose cases d10/d14/c07 need human review. Arbitrary geometry proofs,
wording of extrema, general trigonometric reasoning, arbitrary domains of
definition and other unsupported syntax are not certified. Recognized quoted,
conditional and error-discussion fragments are not treated as asserted facts.
Unlabelled numbers may be intermediate values. Ambiguous narrative can cause
conservative rejection or remain unverified. These are bounded checks, not a
general proof checker or a measurement of GPT quality.

The eight advanced PR420 probes do not gain new external-provider routing.
Only their reference-answer checks are added. Original PR399 and PR420 remain
separate: neither adapter release nor paid/live evaluation is implied.

## Byte contracts

Keep per-field character limits (160 / 1800 / 5×600 / 600). In addition:

- raw provider content is at most 7000 UTF-8 bytes;
- normalized four-field JSON is at most 3500 UTF-8 bytes;
- a returned cabinet model answer plus its exact current question must fit a
  one-turn 3500-byte snapshot while reserving 1200 bytes for the next 400-unit
  well-formed follow-up; check both original and NFKC history representations;
- reject ill-formed Unicode and directional control characters. Preserve the
  existing 3500-byte board/dialogue cap and history pruning. Never cut a formula
  or explanation to make it fit. An oversized answer falls back offline.

These guards preserve continuation for accepted external answers. They do not
promise unlimited history or continuation of arbitrarily long offline material.

## Reproducible checks

```sh
npm --prefix assistant-service test
python3 assistant-service/test/model-reference-oracles.py
node assistant-service/scripts/build-course-knowledge.cjs --check
git fetch --no-tags --depth=1 origin 846040b338fd21a69f52132a75e29e4a9e2669b6 7f4c054b9b8fb5b519dcab60e6fa4e461ed7c21f
node assistant-service/scripts/test-pr399-composition.mjs
```

Composition uses a temporary copy, a three-way merge with immutable PR399
sources, its unchanged OpenAI tests and all current service tests. It also runs
`test/openai-math-composition.mjs` explicitly in that temporary tree to check
mixed equality chains at the OpenAI response boundary with synthetic responses.
This file requires the adapter and is not part of the standalone service suite.
The composition does not
write the adapter into the task branch or contact any model endpoint. The
standard CI also supplies browser, Docker and durable-restart checks.

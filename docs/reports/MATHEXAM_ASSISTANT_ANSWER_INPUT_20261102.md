# Assistant answer notation — verification

Task: [MATHEXAM_ASSISTANT_ANSWER_INPUT_20261102](../tasks/MATHEXAM_ASSISTANT_ANSWER_INPUT_20261102.md).
Base: `4afa9caa033c6d861d2a412ad2b9ad2957acb531`. Review: MEDIUM.
Exact published head, tree and CI results are recorded in the PR body.

## Reproduced problem and correction

Both numeric answer checkers previously removed all whitespace. In the
standalone helper, `1/2 + 1/1` with attempt `1 1/2` was rejected, while
`7/2 + 2/1` with that same attempt was praised. The cabinet repeated the error
for `3 : 2` and `11 : 2`. Both accepted `1 2` as the answer 12.

The existing tutor module now exports a shared exact parser. It recognizes
integers, decimals, ordinary fractions and proper mixed numbers. A leading
minus negates the entire mixed number, including when the whole part is zero.
Fractions with a negative denominator retain exact rational meaning. Optional
`Ответ:` and `x =`/`х =` prefixes are supported consistently.

Whitespace is grammar, not discarded input. Ordinary, tab, nonbreaking and
narrow nonbreaking horizontal spaces can separate a mixed number's parts or
surround signs/slashes. Separate digit groups, split decimals, malformed,
signed/improper mixed fractional parts and expressions are rejected explicitly.
The parser has a 400-character limit, 12 digits per integer component and six
decimal places; existing request/privacy limits are unchanged. No `eval`,
floating-point comparison or model call is introduced.

This changes attempted-answer notation only. It does not add mixed-number
question syntax, proof checking, new topics or new interpretation of conditions.

## Completed checks

- Full service suite: **146/146**, no failures/skips; the six new groups were
  also rerun after final wording changes.
- Independent small-integer oracle: **924 mixed-number cases**, positive and
  negative, whole parts 0–5, denominators 2–12, every proper fractional part.
  Cross-products and independently built standalone/cabinet calculations check
  exact value. Digit-concatenation negative controls exclude coincidentally equal
  values. Zero, reducible fractions and correct-answer precedence are included.
- Format checks include Unicode minus, NBSP/narrow NBSP, prefixes, signed
  ordinary fractions, malformed separators, zero denominators, size limits and
  unsupported expressions. Unknown notation receives no arithmetic diagnosis.
- All five hint levels in normal/simpler wording retain one step; full
  explanations remain explicit. Blank attempts do not acquire an error message.
- Real local cabinet HTTP with synthetic enabled-provider configuration checks
  positive/negative mixed answers and false-approval regressions: **0 transport
  calls, 0 API requests, 0 reserved micros**.
- Final real Chromium/Playwright1.55 browser suite: **4/4**, no failures/skips.
  Five added numeric journeys cover correct positive/negative mixed answers,
  the false 11/2 approval and two invalid spacing forms. The attempted text is
  preserved. Final views at 320/390/1280px have no horizontal overflow; mobile
  output was visually inspected. Earlier retained-step/full-answer/consent
  and safe-rendering journeys remain.
- Both source gates passed: `ATANASYAN_ASSISTANT_SOURCE_OK`,
  `ICHENSKAYA_ASSISTANT_SOURCE_OK`. Syntax and `git diff --check` passed.
- Separate runtime compatibility with OpenAI PR399 head
  `7f4c054b9b8fb5b519dcab60e6fa4e461ed7c21f`: **160/160**, mocked transports only.
  The isolated current runtime overlays only PR399 config/provider/OpenAI tests;
  34 runtime/unit-test/package files were verified byte-for-byte. This is runtime
  compatibility evidence, not a documentation merge or approval to release PR399.

## Initial failure and not-run checks

The first two extended browser attempts reused a synthetic session already
holding eight queries. On the eleventh query the unchanged ten-per-minute
limit left the previous answer visible, which the new assertion then read.
The final test uses a separate synthetic session for this independent journey,
asserts HTTP200 and waits for request completion. No production limit or test
expectation was relaxed, and no UI behavior was changed to make the test pass.

Local Docker is unavailable. Exact-head CI must supply the production image
and durable-restart gate. No paid model, real learner trial, authenticated
production answer test, deployment or external review is claimed here.

## Focused review and scope

The mathematical review covered negative mixed-number semantics, exact
reduction, denominator-zero rejection, bounds and equal-value precedence.
The implementation review checked complete anchored matches, preservation of
token boundaries, both callers, no extra arithmetic evaluation, unchanged
privacy/transport/store contracts and unchanged source-only course handling.

Only two runtime files change. The remaining changes are the new unit/HTTP
tests, existing browser test, two operator documents, task/report and the
required PROJECT_STATUS reconciliation of the completed PR401 release.
No independent external verdict is claimed or required for this bounded
MEDIUM correction. Scripted tests do not measure learning gains.

Rollback is a normal scoped revert. No migration, budget reset or deletion of
learner data is involved. Publishing the candidate does not deploy it.

```text
EXECUTIVE STATUS
Task: MATHEXAM_ASSISTANT_ANSWER_INPUT_20261102
PR: recorded in the published Draft body
Base: 4afa9caa033c6d861d2a412ad2b9ad2957acb531
Head: exact published head in PR body
Gate: MATHEXAM_ASSISTANT_ANSWER_INPUT_PREPARED_OK (local)
Tests: 146 service; 924 mixed cases; 4 browser; 160 PR399 runtime composition; source/syntax/scope
Failures: initial test-session limit issue corrected; no remaining local failure
Not run: local Docker, live models, real pupils, production deployment
Scope deviations: none
Recommendation: exact-head CI, then separate owner release decision
Next user decision: merge/deployment after final exact-head checks
```

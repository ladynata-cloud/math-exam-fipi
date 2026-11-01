# Assistant learning support — validation

Task: MATHEXAM_ASSISTANT_LEARNING_SUPPORT_20261102. Base:
`8f2c40307710f33530c93e21276710651a2f9cea`. Review: MEDIUM.

## Result and limits

- Specific clarification for ten partial forms across fractions, percentages,
  linear equations, rounding and GCD/LCM; no judgment of an incomplete answer.
  Unsupported complete problems remain explicitly unchecked.
- Collapsed per-topic notation examples, all supported, with six real public
  resource paths. All six returned HTTP200 at their intended HTTPS URL.
- Optional original-operand fraction bars, signed number lines and 0–100%
  percentage bars. Bounded drawing grammar; no final numeric solution, arbitrary
  model SVG, external fetch, inline script/style or weakened CSP.
- One optional curated practice exercise after a full deterministic explanation;
  14 families, two alternatives each. Answers use the existing private API,
  CSRF, rate accounting and privacy filter; externalConsent is always false.
  Original question/hints remain visible; failures retain them and expired
  sessions offer login again. Deleting the session removes the exercise too.
- Standalone UI scope; no cabinet topic expansion, provider activation, schema,
  budget/auth change, global permission change or real pupil records.

## Verification

- All 168 service tests passed (no skip). Five focused teaching-aid groups cover
  10 clarification/correction pairs, complete unsupported/concept distinctions,
  all curated examples/resource paths, 28 independently known exercise answers,
  visual quantities, signed/mixed bounds and malformed inputs.
- Real HTTP test: six clarification/correction/practice requests with a fake
  enabled provider made 0 provider calls, 0 API requests and 0 reserved micros.
  Static module served as JavaScript under the unchanged strict CSP.
- All 10 browser tests passed (8 top-level journeys plus two failure subtests),
  including the actual local service. New journey: missing operand → correction
  → original-operand picture → full explanation → wrong/right practice answers
  → signed number line → percentage picture → unsupported-task route → example
  → session deletion. Network/console/CSP checks were clean.
- Buttons open pictures/practice without requests; practice ignores separately
  checked external consent. HTTP429 and HTTP401 preserve prior hints; 401
  reopens login. Request IDs remain unique; no local/session browser storage.
- Widths 320/390/1280: no horizontal overflow. The 390px screenshot was visually
  inspected; pictures and reinforcement remain optional, readable and separate
  from the earlier hint. Diagram coordinates refer to the original snapshot,
  even if the task field is edited before another request.
- Both ATANASYAN_ASSISTANT_SOURCE_OK and ICHENSKAYA_ASSISTANT_SOURCE_OK passed;
  JavaScript syntax and git diff whitespace checks passed.

Failures: none in executed tests. Not run locally: Docker (not installed),
external review/consultation (explicit owner waiver for this package), paid
provider requests, real-pupil efficacy or authenticated production exercises.
Container validation and exact-head CI are release prerequisites. Scope
changes: none. A browser proof of the final deployment and its exact package
identity will be attached to the release record; not claimed in this report.

Gate: MATHEXAM_ASSISTANT_LEARNING_SUPPORT_PREPARED_OK (local checks).
Recommendation: exact-head CI, verified squash merge, then cumulative deployment
of all ten improvements. Owner authorization already covers this package;
no new permission decision is required absent an unresolved blocker.

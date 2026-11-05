# Exact math foundation validation — 11 numbered improvements

Items 16–20, 24, 28–30, 51–52. Standing owner publication policy applies;
external provider review was not performed. Runtime remains deterministic.

- 189 service tests passed; after final division-notation/topic-inference fixes,
  all 19 affected mathematics, learning-aid and input tests passed again.
- Independent oracles: 448 fraction products/quotients by cross multiplication;
  all integer radicands 0–400 reconstructed by squaring; 108 polynomial products
  checked against separately expanded coefficients and five integer substitutions.
- Negative/zero powers, -2^2 versus (-2)^2, zero denominators, ambiguous digit
  groups, depth/token/degree/exponent bounds and unsupported executable text are
  rejected or evaluated according to their exact grammar.
- Exact versus requested rounded answers, half-away-from-zero rounding, finite
  decimal output, equivalent length/time/mass units and dimension errors tested.
- Factorization is reconstructed, trivial multiplication by 1 is not accepted
  as a factorization; unfinished equivalent simplification is a step, not a final
  answer. Arbitrary symbolic expression equivalence is not claimed.
- 12 browser scenarios passed against synthetic fixtures and a real offline
  service, including all five added topics, original fraction division, negative
  power, radical, proportion, units and polynomial answers. At 320/390/1280 widths
  no horizontal overflow. Inspected full-size mathematical answer screenshot;
  display-style MathML makes fractions readable. Prior privacy/consent/copy/print/
  retained-attempt scenarios still pass. Final render/rounding rerun also passed.
- Both source-course integrity gates and git diff --check passed.

Initial broad tests caught a real integration gap: model-evaluation coverage was
implicitly tied to every offline topic. The original seven-topic/40-case paid
pilot is now explicit, remains unchanged and retains its exact coverage gate.
The five new topics are additionally blocked from provider requests at the
server and message-builder boundaries, even with consent. No budget, approval,
provider or evaluation corpus was expanded. Initial malformed-input tests were
updated only for newly supported grouped/multiplied mixed operands, with positive
answer assertions added; remaining rejection cases are retained.

Coverage limits: at most nine displayed arithmetic operations (eight before
rounding), six-digit source numeric components, powers from -12 to 12, polynomial
degree at most four. Exact radical simplification is for bounded nonnegative
integer radicands. Factorization covers common factors and bounded integer-root
reduction/grouping; unsupported cases are not relabelled as solved. Multi-step
slash chains in the fractions topic need explicit grouping or ':'/'÷'. Decimal
conversion supports terminating results up to six decimal places. Unit support
is length, time and mass, not arbitrary dimensional analysis.

No actual pupil/assistive-technology pilot or Amvera deployment has occurred.
Cloud exact-head Docker/browser validation is recorded on the PR. Source code
can be reverted without a schema migration. Cloud deployment credentials remain
unprovisioned; this is an access limitation, not a request for repeated consent.

Prior package: PR411 was merged as 77be24404785f9899c5fbe38f30ee2c07382b7f4,
parent 4f72a88, exact tree b14e69a. Cloud run 41363422448 passed after unrelated
PR410 main drift was classified and composed. Prior PR409 foundation also passed
cloud checks; neither package is claimed as active on Amvera.

# Exact arithmetic and algebra foundations — 16–20, 24, 28–30, 51–52

Owner requested all 100 cloud improvements. Base is dialogue PR411 head
2d935083fb2f122bfc113a613d5f67d679ad9563, to be reconciled with its merge.
Branch feat/assistant-math-foundations-20261102. Review HIGH for the broader
mathematical response boundary. ADR0011 and standing publication authorization
apply; external audit is not performed under the owner policy.

Implement bounded exact arithmetic (mixed fractions, multiplication/division,
order of operations, comparison, integer powers), square-root simplification,
proportions, explicit rounding and exact/approximate distinction, numeric-format
and dimension-aware unit conversions, polynomial simplification and bounded
factorization. No eval, unbounded algebra, personal data storage or provider call.
Preserve the existing seven topics and add clearly named bounded formats.

Learning sequence: identify required quantity and notation; optional rule hint;
perform operations in order; show exact result and substitution/reconstruction
only on explicit full solution. Fractions must retain original grouping. A
rounded decimal is accepted only when rounding was requested. Domain errors and
unsupported expressions cannot be labelled checked. A factorization answer
must actually be a product and reconstruct the source polynomial.

Acceptance: exact rational/property oracles, operator precedence and limits,
domain/zero/ambiguous input rejection, equivalent fractions/units, polynomial
identity and factorization reconstruction, existing HTTP/browser regressions.
Rollback is a scoped source revert; no schema/identity changes. Real learning
outcomes and unrestricted symbolic algebra are not claimed.

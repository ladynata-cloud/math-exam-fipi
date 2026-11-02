# Word problems and data — evidence, 2026-11-02

Package5: items25–27,61–65 (8 items, cumulative54 with prepared source).
HIGH, ADR0011. Standing publication policy applies; external audit not performed.

## Review and coverage

Explicit Russian templates cover constant-speed travel, simultaneous meeting
and pursuit with stated front/rear speeds, joint constant-rate work, two mass
concentrations of the same solute without losses/reaction. Quantities convert
exactly across compatible length/time/mass/speed units. No inference from
arbitrary narrative prose. Non-closing pursuit correctly has no finite meeting.

Arithmetic progressions support term/sum/difference/positive integral index;
geometric progressions support term/sum/ratio from first two terms. Bound n≤50
for direct term/sum computation and bounded rational magnitude. q=1 uses a
separate sum formula; n=1 does not display 0^0. Undefined ratio at a1=0 is
unsupported. Statistics support1–30 observations with repetitions, exact
mean/median/range. Dice/coins assume fairness and independence; drawing two
balls without replacement accounts for dependency. Tables enumerate ordered
outcomes, complete coin-tree paths or colour-path counts. Function tables
support up to12 distinct x values, multiple inverse matches, and never
extrapolate. All eight topics remain offline-only, outside the model allowlist.

Optional full-solution tables use text-only DOM, header scopes and a labelled
keyboard-scroll region. They are absent from staged hints. Hints are specific
to each domain and preserve units, assumptions and plausibility checks.

## Validation

- 203 service tests passed;15 browser scenarios passed (13 top-level+2 subtests).
- Independent checks:96 motion products,144 reciprocal work-rate combinations,
  81 weighted-mass conservation cases,660 progression recurrence/sum cases,
  statistic order/duplicates/one-value edge cases, independent binomial counts,
  dice sum distribution and36 without-replacement count identities.
- Real local HTTP exercised all8 topics, units, fractional progression sum,
  nonunique table inverse, expected answer formats, retained attempts, staged
  table disclosure and320/390/1280 widths. Rendered table screenshot reviewed.
- Both course-source gates and git diff --check passed.
- Initial direct smoke check caught a Russian-letter normalization copied from
  algebra corrupting ordinary words; removed it before full validation. No
  final failing tests and no gates weakened.

PR413 passed CI41365825897 and merged as51da998423e87b80b91e5cde3b534ea0a29699f1.
Fetched parent7299768 and exact reviewed tree6e5e218 verified. New package cloud
checks pending. Dedicated production remains prior source8307f6a/package3cc22e0;
cloud Amvera deployment identity/known-host provisioning unavailable. Owner
permission already granted. No real-pupil/assistive-technology pilot performed.
Source-only revert; no schema/identity changes or raw-conversation persistence.

## Executive status

Task: word problems and data,8 items
PR: attached after source publication
Base: main51da998423e87b80b91e5cde3b534ea0a29699f1 after dependency composition
Head: exact committed candidate in PR
Gate: local pass; cloud pending
Tests:203 service,15 browser, independent exact oracles
Failures:none in final checks
Not run:cloud candidate, real learner/AT pilot, Amvera delivery
Scope deviations:explicit bounded templates and limits above
Recommendation:cloud checks, merge, continue geometry/visual package6
Next user decision:none; standing policy applies

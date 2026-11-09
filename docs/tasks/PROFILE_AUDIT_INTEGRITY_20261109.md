# ЕГЭ профиль: точность моделей и сохранение первой попытки

## Identity and authorization
- Task: PROFILE_AUDIT_INTEGRITY_20261109.
- Owner: MathExam owner; requested 2026-11-09.
- Base: main, 89ee66bfe5068f16364d61d091fcbf1a1cbd6287.
- Branch: fix/profile-audit-integrity.
- Review level: HIGH (optional learning records and shared practice runtime).
- START: «реши все проблемы и еще раз убедись …»; follow-up specifically asks how GeoGebra models from planimetry, stereometry and graphs are reflected in profile.
- Push, checked merge and publication authorized by the conversation and [standing policy](../OWNER_RELEASE_AUTHORIZATION.md). No new permission pending.

## Goal and verified evidence
Apply concrete findings from the saved four-source audits to the existing course,
while distinguishing implemented models, partial adaptations and unverified source
material. PR #511 is already published; this is a separate corrective package.

Code inspection and DOM reproduction found that repeated rapid submissions in
the parameter and integer drills can award 8/8 for one condition. The cubic
parameter question lacks the positive-integer restriction. The circle/line model
labels a=4.2 as exact tangency although there are two intersections. The main
practice currently loses the first wrong submitted value on correction. The
hyperbola topic links to an existing correct zero-numerator/domain-hole model,
but does not integrate its prediction and transfer checks into the main practice.

## Scope
- Make each drill condition count once and invalidate pending transitions on restart.
- Correct the missing sign restriction and exact/approximate boundary states in
  existing parameter models, including any confirmed clipped intersection.
- Extend the existing optional public coach pattern with a zero-numerator
  hyperbola experiment: predict, change only the numerator, retain the excluded
  argument, explain, then transfer to another condition.
- Retain first saved submissions and corrections in bounded optional public
  practice records, with honest help/context labels and a collapsed history.
- Record a model-level comparison against the saved audits, including limitations.
- Add meaningful regressions, browser acceptance, cache/provenance refresh and CI.

No new platform, backend, task bank, mastery rule or board protocol. No copying of
external lesson content. No assertion that every source video was watched, that
all models were reproduced, or that real learner effectiveness was measured.

## Acceptance and gates
- Repeated click/Enter and wrong-then-correct submissions cannot inflate a drill;
  stale timers cannot modify a restarted drill.
- Circle/line counts agree with exact mathematics on both sides and at both
  critical values; exact states are keyboard accessible and labelled exactly.
- Zero numerator retains the original domain hole without a vertical asymptote;
  first prediction and transfer survive reload separately from mastery.
- Wrong submission → edit → correct → reload retains the first saved value,
  does not invent legacy independent history, and preserves malformed records.
- Public/board boundaries, previous attempts and current scoring remain intact.
- Targeted DOM/math/state regressions, existing applicable gates, 320/1280 browser
  evidence, source bindings and git diff --check pass.
- Marker: PROFILE_AUDIT_INTEGRITY_OK.

## Review and rollback
The pre-implementation design review is the verified audit-to-code comparison
above. Independent technical and mathematical review of the final diff is
required; external provider audit and real-pupil pilot are not required and are
not claimed. Share only public/scoped code with reviewers.
Risks: wrong root counts, duplicated credit, lost attempts or hidden answer leaks.
Use an ordinary scoped revert if needed; no destructive data migration. Optional
trace records can remain unused by the prior runtime.

## Execution and release record
Exact tested base/head, independent review, failures/unavailable checks, CI,
fresh remote drift guard, merge/deployment and live acceptance belong in the PR.
This specification describes authorized work, not completed publication.

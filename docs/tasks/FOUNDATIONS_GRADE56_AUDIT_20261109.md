# Foundations and grades 5–6: apply the learning audits

- Owner request: apply valuable findings from the Methodizer, GeoGebra video and Brilliant audits to elementary/foundation mathematics and grades 5–6.
- Date: 2026-11-09 (Asia/Novosibirsk task date).
- Base: main `89ee66bfe5068f16364d61d091fcbf1a1cbd6287`.
- Branch: `improve/foundations-grade56-audit-20261109`.
- Review: HIGH; existing trainer interactions and saved learning state.
- Authorization: current direct implementation request and [standing release authorization](../OWNER_RELEASE_AUTHORIZATION.md). Commit, push, Draft PR and verified publication are authorized.

## Scope
Improve the existing foundation/grade 5–6 workshop, basic arithmetic training and Peterson 5–6 using the established model/feedback/state architecture. Preserve concurrent textbook-route PRs, pupil data, task IDs, scoring boundaries and board contracts. No new platform, copied commercial tasks, backend changes or unrelated-course rollout.

## Learning design
Apply only evidence-supported principles: predict before experimenting; vary mathematically meaningful parameters while preserving dependencies; distinguish a scheme from exact measurement; keep first attempts, help and later corrections distinct; scaffold errors with a reason; offer a new independent task after help; keep the current problem and next action visible. Concrete arithmetic models are MathExam adaptations, not claims of exact copies or measured effectiveness of another provider's course. Source-specific evidence and coverage will be recorded after inspection.

## Acceptance
- Concrete models and feedback improve existing learning actions, not merely introductory copy.
- Blank input, repeated clicks, help and experiments cannot generate false independent credit.
- New work survives the applicable existing save/reload flow; no destructive schema migration.
- Controls are keyboard usable and remain legible on narrow screens.
- Applicable mathematics, DOM/state, existing regressions and CI pass. Independent technical/mathematical review is required.
- Publication requires fresh authoritative main/head, drift classification, verified merge identity and Pages/public resource evidence.

## Risk and rollback
Main risks: wrong mathematical feedback, lost work, false mastery, interference with pending route improvements. Use scoped corrective changes or presentation-only rollback preserving any compatibility layer/new saved fields; never clear pupil storage. Existing concurrent branches will be inspected for overlap.

## Review and results
External provider consultation and a real-pupil pilot are not performed under the standing policy. Exact executed checks, failures, limitations, independent review and final coverage are recorded below and in the PR. No external review is implied by this specification.

## Evidence and verified baseline
The saved Brilliant audit and register (revision 12) were read: equal-area fraction composition, visible whole/part comparisons, same-ratio scaling, contextual help and retained correct steps. The saved GeoGebra 2D audit v0.2 was read: midpoint/angle objects, conditional labels and the distinction between given and rounded measurements. The inspections were selective and did not establish real-pupil learning gains or verify every original video/audio/.ggb.

The saved Methodizer panel and its two current reference registries contain a seed lesson marked not started; later local-browser records are unavailable in this execution context. Therefore no completed Methodizer audit is claimed. Personal attempt → error discussion → new independent check is a MathExam adaptation, not attributed as a newly verified source observation.

All six sampled live runtime assets matched base89ee66b exactly before implementation: workshop models, Peterson5/6 models, Vilenkin5/6 labs and basics-help. Existing pending route improvements #497/#499/#509/#513 were inspected; this task does not replace their routes or progress maps.

## Storage boundaries
Workshop investigations and basics-helper transfer history remain local to the currently mounted/open task and do not award course mastery. Peterson and numbered Vilenkin investigations use bounded fields in their existing model records and are checked across reload. Real exercise histories and grading contracts remain separate. Offline Vilenkin editions are regenerated with the existing builder; those two offline HTML files are not navigator-bound documents, so the provenance ledger does not need changing.

## Local verification limit
Real Chromium launch was attempted but failed before opening a page with `socket() failed: Operation not permitted`. No local visual/browser pass is claimed. The new foundations-grade56 workflow and existing relevant workflows retain real-browser checks on the candidate, with mobile/desktop screenshots for inspection.

## Verified implementation and gates
- Basics:26 distinct transfer questions across all existing help skills; exact rational comparison; explicit hint disclosure after an offer; current-task first answer retained.40 new/existing test groups PASS, including real managed-renderer echoes with no parent check/progress event.
- Workshop:10 model kinds,3960 mathematical checks plus DOM lifecycle/focus/empty/history/no-credit; all74 legacy models render. Existing7400 generated task/state checks PASS. Unchanged Vilenkin generator checks16080+23280 and model boundaries1088+2976 PASS.
- Numbered Vilenkin:10 inquiry families, condition/first-response/reload/cleanup checks PASS; V5 116 and V6 108 existing views; arithmetic9900 tasks/40207 steps/33 flows; V6 textbook194 tasks/615 steps and194 DOM views; bridge10 scenarios. Empty V6 textbook submission no longer emits a check; numeric zero is still validated. Offline builders reproduced both editions.
- Peterson: independent review ran final inquiry suite33 family/integration cases PASS; state/model/board-contract regressions PASS. Draft input alone does not mark assistance; revealing/checking an explanation does. Explicit fresh practice avoids the original task fingerprint. One concurrent early root run loaded a changing source and failed p03; after source freeze the independent final run passed. Initial default-heap UI run was killed137; remaining full UI checks are required in CI.
- Independent source/math review addressed stale model questions, bounded model growth, exact model parameters at disclosure, duplicate submits, and help attribution. Final source verdict no blockers; real-browser acceptance remains required.
- Navigator bindings5/5 and preservation4/4 PASS. First preservation attempt lacked the historical commit in the shallow clone; fetching that exact commit resolved it without changing files/tests.
- No provider audit or real-pupil effectiveness study is claimed.

## Release gate
Candidate source and DOM/math review PASS; required exact-candidate CI, screenshot inspection, fresh base/head validation and production checks remain pending. No further owner permission is pending under the standing authorization.

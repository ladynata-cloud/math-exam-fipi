# Grade 7 geometry on the existing shared board

## Identity and permission
- Owner request: connect Atanasyan grade 7 and existing beginning-geometry trainers, validate proofs/constructions/parallel lines; create one pupil account and update another without losing work.
- Date: 2026-11-04 (Asia/Novosibirsk).
- Base: main, 846040b338fd21a69f52132a75e29e4a9e2669b6.
- Branch: feat/geometry7-shared-board-20261104.
- Review level: MEDIUM: bounded adapters using the existing registry, snapshot bridge and native exercise rendering; no server protocol/authentication change.
- Owner START: direct current task request. Branch, commits, push, Draft PR and publication authorized by OWNER_RELEASE_AUTHORIZATION.md after checks.

## Outcome and scope
Connect the reviewed grade 7 textbook (chapters I–IV and grade 7 advanced tasks), all 70 current native geometry-course trainers, and the existing beginning-geometry routes to the existing board. Keep the old task 92a assignment contract. Review all three triangle-congruence criteria, ruler/compass operations and parallel-line arguments. Improve retained reasoning and board-sized layout where needed. Configure accounts through the teacher interface, preserving existing attempts and homework. Synthetic board sessions must never write personal progress.

## Evidence
The base includes PR 427 (published OGE board acceptance); it did not add grade 7 support. The existing Atanasyan board wrapper is restricted to 92a. The native geometry-course trainers have personal local storage and no board bridge. The full textbook contains 619 reviewed grade 7 cards. Native first-steps work and managed grade 7 attempts are separate stores.

## Acceptance and checks
- [x] Enumerated coverage: 619 reviewed textbook cards, 70 native activities, 134 managed topics (including the 103-lesson rebuild). Existing mathematical gates pass; complete priority proofs/constructions are exercised below.
- [x] Conditions, selected task, answers, hints, retained steps, constructions/model state agree between independent teacher/pupil clients.
- [x] Reload, reconnect and late join restore the same state; read-only pupil cannot mutate it.
- [x] Shared tests neither read nor write real pupils' work.
- [x] Board/narrow-frame layouts remain usable; screenshots reviewed.
- [x] Existing 92a, first-steps and planar engine regressions pass.
- [x] Account creation/assignment and preservation verified through published UI.
- [ ] Exact-main/head check, deployment and live acceptance recorded.

## Risk and review
Bound snapshots and allowlist native operations; render authored data only. Preserve existing personal stores, lesson IDs and revisions. Rollback by reverting the scoped commit; no data migration. External design/provider review not performed under standing owner policy. Perform focused code/mathematics review and browser acceptance; real-learner understanding remains to be assessed in lessons.

## Execution
Implemented three registered wrappers, using the existing bridge, registry and typed native operation architecture. No peer HTML, selectors, executable text, arbitrary URLs or personal progress is accepted. Native random choices and animation clocks are deterministic; idle time stops advancing after 15 seconds. Full mathematical text is escaped losslessly on the wire. New board-only planar engine projection has a reviewed-source fingerprint guard; the published personal engine and signed source review remain unchanged.

Learning review: explicit corresponding vertices and reasons for each equality; SAS requires the included angle, ASA requires adjacent angles, SSS covers inside/on/outside auxiliary-ray cases. Parallel criteria and properties remain distinct, with no circular proof. Construction explanations remain visible after advancement and completion. Fixed a disabled compass at the second perpendicular case, and coordinate mapping on canvases larger than their intrinsic size. Added shared reasoning fields to all 70 activities and a course hub linked from assigned Atanasyan program cards.

Local evidence:
- 109 unit/integration tests PASS (grade 7 generation/math, private history, wizard, first steps, 92a, native snapshot guards, picker and registry). Updated exact registry expectation from 75/51 to 78/54 for the three explicit new entries; negative boundaries remain tested.
- All 70 native entries PASS at two widths, memory-only progress isolation, no horizontal overflow or page errors.
- Deep browser gate: 65 checkpoints across full SAS/ASA/SSS, four compass/ruler constructions (both perpendicular cases), and five parallel-line proof sequences, plus four older canvas gesture paths. Repeated after the viewport-coordinate correction with 800/640 widths.
- Real Socket.IO room: all three wrappers, conditions/drafts/help/model/steps, teacher/pupil control, late join, reload, both roles' transport loss and resumption, and compass arc through the actual room.
- Public textbook source-review gate PASS; 13 review-scope tests; 1407 models / 7084 views / 6466 coordinate claims; 4066 additional independent advanced-grade-7 checks; 4879 retained DOM checkpoints; geometry checker 46551 assertions. No textbook source or review receipts regenerated.
- Screenshots inspected for native canvas, textbook and managed geometry in split board layout. Corrected a misleading inherited EGE/null heading in the grade-7 wrapper.
- Published teacher UI: one new account with three courses, existing account updated with the same three courses; prior attempts/homework/13 recommendations preserved and six recommendations appended. No pupil names, identifiers or access codes are committed. No synthetic personal attempts submitted.

Failures found and resolved: missing round-two compass; oversized-canvas coordinate scaling; stale iframe readiness; over-rounded wire coordinates; lossless comparison-sign encoding; legacy exact inventory expectations; inherited EGE heading. No external provider review or real-pupil learning pilot performed. Free-written proofs require teacher review; board work does not credit individual completion. Native sessions are bounded to 1800 operations/60 KB and offer a new discussion when full.

Release authorization: standing OWNER_RELEASE_AUTHORIZATION.md. Main advanced to 7649cb1368f2c5631f79d25fa8414373481f9ed7 via owner PR 428 (homepage-only, seven disjoint files). Inspect virtual composition and preserve that published work with an ordinary merge. CI and exact production deployment verification remain pending at this commit; final hashes and live evidence go in the PR release record. Rollback is an ordinary revert, no migration or pupil data deletion.


## Candidate correction after CI
The first CI candidate passed 70 native browser activities and the 61 deep proof/construction checkpoints. The room test captured an expected snapshot before an asynchronous model-opening event completed; it now explicitly waits for the model and exercises selected geometry plus a retained step before comparing peers. The runtime task selector now lists all 134 grade-7 topics rather than inheriting an empty EGE list. Four older mouse/touch canvases now use pointer events (also covering touch) and pointer capture, matching the common replay contract; four additional two-width gestures pass. Chromium's input coordinate quantization is checked within 0.0001 canvas units; teacher/peer geometry equality remains checked at 1e-8.
Ten related CI workflows exposed the same stale server integration expectation of 51 mirror entries. Updated the exact expected count AND explicit identity list to 54; all seven integration tests pass, with negative authorization/CORS boundaries retained. No gate was removed. Added that integration suite to this task's own workflow.

The room gate also waits for the controller snapshot to settle across asynchronous event delivery before retaining its expected value, and asserts that the controller remains unchanged afterward. This prevents comparing a pre-mouseup snapshot against a correctly completed peer gesture; full exact-state equality is retained. The post-main workflow waits for 86 exact public asset hashes plus the production cabinet asset and server registry digest, then runs all 70 native activities, all 65 deep checkpoints and a new anonymous two-client room on the published service. Its final result is required in the release report. Local browser networking lacks the managed proxy trust chain; no certificate bypass was used. Published browser tests run in the established GitHub Actions environment instead.

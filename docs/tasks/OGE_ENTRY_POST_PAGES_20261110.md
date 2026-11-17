# OGE entry acceptance after the exact Pages publication

## Identity and authorization

- Task: OGE_ENTRY_POST_PAGES_20261110.
- Owner: MathExam owner; current request: «ты это поправишь?» after the report of run 42737167241. This is approval to implement the bounded fix, not a monitoring-only pass.
- Date: 2026-11-10 (Asia/Novosibirsk).
- Base: main `0ab769a38744d3ea6890933d2b5600f145721d46`.
- Branch: `fix/oge-entry-after-pages`.
- Review: MEDIUM. This changes a read-only acceptance integration, not deployment permissions, runtime code, data or the Pages deployment itself.
- Release authorization: [standing owner policy](../OWNER_RELEASE_AUTHORIZATION.md), conditional on applicable checks and the exact-base/head guard.
- No architectural change or new trainer archetype.

## Goal and evidence

Prevent the OGE return test from checking an old EGE base page during publication. Keep every original navigation, mobile, no-JavaScript and preserved-engine assertion.

The push-triggered [failed run](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/42737167241) checked main `aca5365e` before its [Pages publication](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/42737165493) completed. The old gate hashed only the two wayfinding assets and the OGE course HTML. The browser also opens `ege-baza/index.html` and requires all 21 exam positions. Those resources were absent from the gate. Current main retains that mismatch.

Project-status reconciliation: PROJECT_STATUS describes the 21-position map as a prepared task and defers publication evidence to its handoff. This fix does not rewrite course status or claim a fresh full-site audit. The authoritative base includes the later OGE9 merge #543; all its content is preserved.

## Scope

In scope: the existing OGE learner workflow, a read-only release-content gate, its regression tests and this specification. PR/push/manual checks use the checked-out candidate locally. Production checks start only after a successful same-repository main Pages run and check out that run's exact head SHA. Separate concurrency groups prevent an ordinary push from cancelling post-publication acceptance.

The manifest covers recorded pages, course-parent destinations, directory aliases and their first-party static script/stylesheet references. It preserves version query strings, limits HTTP concurrency, rejects missing local evidence, and retries propagation only for a bounded period. Exact-content checks before and after the unchanged browser scenario prevent mixed-release acceptance. Reports include SHA and mismatched public URLs.

Excluded: trainers, mathematical content, pupil accounts/progress, server/board protocols, unrelated workflows, Pages configuration, secrets, branch protection and automatic repairs. No assertion is weakened and no old failure is relabelled successful.

## Acceptance criteria and gates

- [x] Production URLs are not tested on a push before publication.
- [x] Post-Pages checkout uses the deployed SHA rather than a later default-branch SHA.
- [x] The old-EGE/new-OGE regression and stale EGE script remain failures.
- [x] HTTP errors, timeout, mixed content, missing evidence and wrong-origin redirects cannot pass.
- [x] Original static and browser test commands and assertions remain unchanged.
- [ ] Exact-head GitHub Actions: actual repository manifest, preservation tests and full 320/1280/no-JavaScript browser acceptance.
- [ ] After release: successful Pages run, automatic workflow_run activation and public-content/browser receipts for the same SHA.

Local validation: Node syntax; 18 regression tests passed, zero failures; one actual-repository-manifest test explicitly skipped because this executor has no full checkout/network access. YAML parsed and event/permission structure checked. The reconstructed original workflow blob matches GitHub `b51caadd9e45f473d09e4ee0e60e9e34cde34df7`; whitespace/diff checks are recorded in the PR. No full browser run, remote CI PASS or publication is claimed by these local results.

Gate marker: `OGE_LEARNER_RELEASE_MATCH_OK <deployed SHA>`, in addition to all original learner-entry gates. A final release decision requires the pending checks above, not just this marker.

## Review, risk and rollback

Focused self-review covers event provenance, read-only permissions, exact-SHA checkout, unchanged browser assertions, manifest completeness and failure propagation. External provider review was not performed and is not required for this task under standing policy. No learner/design consultation is applicable to this CI-only change.

Risks: a subsequent deployment can supersede the tested release; mismatch must remain explicit rather than become a false pass. A newly referenced missing asset blocks the manifest gate for investigation. Bound polling to eight minutes and eight simultaneous requests; the workflow has a separate overall timeout. The first real post-Pages event cannot be exercised from a PR-only branch and remains a release check.

Rollback: revert only this four-file CI patch through a normal reviewed commit. Never reset history, remove pupil data, disable tests or change Pages settings. Existing product files and preservation references are untouched.

## Execution and handoff

Managed Pages follow-up: publication `42800141198` completed successfully, but the displayed workflow name alone did not start the dependent check. Subscribe to the managed workflow identifier `pages-build-deployment` as well as its display name. Keep the same-repository, main, success and exact-SHA requirements and verify the next real publication event.

Implementation is prepared from the immutable API base tree. Only the four scoped paths are added/replaced; the public runtime tree is unchanged. Exact resulting head, PR, CI and release evidence belong in the PR handoff to avoid self-referential commit hashes. Any base drift requires renewed composition and applicable validation before merge. No additional owner permission is needed solely for publication; technical checks remain mandatory.

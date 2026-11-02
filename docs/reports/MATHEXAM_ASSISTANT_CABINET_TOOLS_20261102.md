# Cabinet tools and coverage — evidence, 2026-11-02

Package8:15,46–50,96–100 (11 items). HIGH. Owner all100 request and standing
publication authorization apply; external audit not performed. ADR0011 has an
explicit structured-progress extension. All100 now have prepared source, not
100 production-complete features.

## Implemented behavior and boundaries

Private authenticated practice reuses the six deterministic families. Default
state is bounded session memory. Opt-in persists descriptors, bounded outcomes,
levels and help flags; no raw pupil answers/questions/dialogues. Restart and
next-login resume/revisit use retained state. Current-session and last100-task
summaries separate independent/helped work; teacher sees only owned retained
aggregates and known repeated-error categories. Opt-out/erase invalidates cache
copies and deletes practice progress without resetting ledgers. Retention30 days.

Teacher previews3–5 distinct generated problems before explicit assignment;
preview30 minutes, assignment30 days, revocable. Server gates full solutions and
allowed method IDs, including direct API requests. Hints contain strategy, not
computed solution lines; restricted solutions cannot leak approved notes.
This governs formative cabinet task explanations, not access to all other
materials or proof of which method a learner actually used.

Teacher sandbox uses the same generator/grader without writes to real tables.
Notes have draft/version/explicit approval; previous approved text remains until
new approval. Safe text rendering; separate teacher provenance, never grading
truth. Notes apply across that teacher's enabled accounts for the selected skill.
Generated-task disputes store descriptor/engine/reason/status and teacher routing,
not pupil identity/session/free text; deduplicated and bounded,30-day retention.
Reviewing a dispute does not approve a fix. No model training/provider calls.

Coverage map describes all40 actual topic IDs, supported forms and limits, with
40 mathematically supported examples. No arbitrary proof/photograph/general-CAS
claim. Item15 resumes generated private practice only; free-form dialogue remains
unretained. Item99 reproduces generated tasks only. Those boundaries are visible
in product and operator documentation rather than implied universal support.

## Access and concurrency review

Session/account fence, exact-origin/CSRF/mutation limits, owned teacher and
three-account helper settings reused. Active assessment blocks all practice
entry. Awaited module load is followed by current auth/settings recheck; mutation
and save are synchronous in the established single-writer process. Random version
fences reject stale tabs; current-task IDs reject mismatched submissions; duplicate
correct answers cannot earn credit again. Retry/help flags prevent independent
credit. Text drafts are keyed by task ID, so refresh cannot attach an old answer
to a different task. No account binding or production pupil data changed.

Pure practice core and ESM marker explicitly enter board Docker image. Inference
and helper DB remain isolated. Lazy module load fails only practice endpoints if
packaging is broken, leaving board startup available. Runtime-layout test checks
copied module; cloud container gate imports and grades it in the real image.

## Verification

-378 full board-server tests passed;216 full standalone service tests passed.
-22 standalone browser tests passed, including coverage controls and no surprise
 submission;40 coverage examples all deterministic/complete.
-Four real HTTP private-practice browser scenarios passed: opt-in/reload/erase,
 teacher preview/assignment/policy/sandbox/approval/safe rendering, and stale-tab
 draft retention with no cross-task reuse; native assistant integration while the separate hint service is unavailable.320/390/1280 widths; keyboard approval;
 no browser persistent storage. Synthetic screenshots reviewed.
-26 existing helper DOM/lifecycle tests passed;39 cabinet assistant/server tests
 passed; real two-service cabinet E2E passed15 requests, zero provider calls.
-Restart, retention expiry, CSRF/foreign account/settings/exam denial, duplicate
 submissions, policy bypass, draft isolation/version approval, queue minimization,
 exact-table sandbox snapshot and safe missing-module failure verified.
-Both course-source gates, workflow YAML parse and diff check passed.

Initial failures: sparse checkout omitted existing course files, so the first
broad backend invocation could not load its fixtures; expanded checkout and reran.
Then runtime-layout test exposed the eager optional module load; isolated it and
updated fixture to match Docker copies. Browser labels initially included select
option text; explicit label/control associations fixed accessibility. Coverage UI
test initially requested a section absent in its two-topic mock; corrected it to
an offered sample, while the independent full-topic gate covers all40. No gate
was weakened or external review invented.

## Delivery and rollback

PR416/package7 initial CI41370421434 timed out in an existing browser scenario; investigation/revalidation pending when this report was written; source89 items
prepared there,74 merged before it. Final package cloud checks pending. Cloud
Amvera identity/verified-host provisioning unavailable; helper production remains
previous source8307f6a/package3cc22e0. Native cabinet additions also require their
own hosting deployment. Static frontend publication alone cannot establish that
the private server API is live. No infrastructure purchase, real pupil rollout
or paid evaluation performed.

Rollback ordinary scoped source revert, retaining additive practice tables and
all existing ledgers; disable existing helper gateway if necessary. Source review
and CI do not substitute for later hosting/live verification.

## Executive status

Task: final11 cabinet/teacher/coverage items
PR: attached at publication
Base: PR416 dependencycd9b19b21f58ef6b56fa45c7b751bd95715ac071; current-main composition recorded in PR
Head: exact committed candidate in PR
Gate: local pass; exact-head cloud pending
Tests:378 board,216 helper,22 helper browsers,4 private browsers,26 DOM,15 real E2E requests
Failures:none in final completed runs; initial failures above
Not run: exact-head cloud, real pupil/AT pilot, native/helper Amvera deployment
Scope deviations: bounded generated practice persistence/disputes, explicitly described
Recommendation: exact-head CI and controlled merge; provision hosting identity for live delivery
Next user decision:none for publication; standing permission applies

# Linear-equation learning route pilot

## Identity

- Task: bring the approved four-lesson pilot into the existing MathExam site.
- Owner: MathExam owner; explicit autonomous night-work START on 9 November 2026.
- Date: 2026-11-09 Asia/Novosibirsk.
- Base branch: main; base SHA: `1f49566c5411767b67062a3bf172f1dd719e63ed`.
- Branch: `feat/linear-learning-route-20261109`.
- Review level: NEW_ARCHETYPE (bounded learning sequence and event persistence).
- ADR: [0014](../adr/0014-linear-learning-pilot.md), Accepted for the specifically requested pilot, not a wider platform rollout.

## Goal and evidence

A learner enters from the existing equation or OGE course, diagnoses gaps, completes four short lessons with written explanations, submits a new final form and returns to a distinct form after five days. Existing Library HTML prototype was read and materialized, and its original content/style adapted; no third-party tasks were copied. Prototype issues corrected: missing drafts, snapshot overwrites, finite post-help task pool, no practice explanation records.

## Scope

In scope: `/equations/linear-pilot/`, compact links in `/equations/` and the existing OGE №9 card, original task variants, local append-only evidence, report, tests/workflow, exact navigation preservation bindings as necessary.
Out of scope: entire course replacement, real pupil assignments, board protocol, backend, accounts, automated semantic assessment, cross-device synchronization, imported progress from file:// prototype.
Must not change: simple-equations trainer/#484, existing course engines, real learner data, hosting, protection or gates.

## Acceptance

- Diagnosis recommends relevant sign/bracket gaps and returns to the first lesson.
- Position, accessible stage navigation, saved answers and written work survive reload.
- Four lessons retain alternative valid transitions, first error, corrected answer and help separately.
- Opening help requires a fresh task before completion; completion never claims mastery.
- Final and different delayed form collect answers and work, accept `?`, reject incomplete submissions, expose keys after submission only in UI.
- Reopening completed lessons is supported. Conflicting tabs do not overwrite event history.
- Concise report is viewable; download includes all draft versions and attempts. Teacher evaluates explanation.
- Browser checks must pass before release; controlled time is not a real pupil delayed trial.

## Review and checks

Before implementation: reviewed supplied prototype, existing `/equations/` and direct owner learning standard. External provider consultation not run under standing owner policy.
Required: independent math/code/learning review; `node --test tools/equations/linear-pilot.test.cjs`; `node tools/equations/linear-pilot.browser.cjs`; source syntax, links and `git diff --check`; applicable existing navigation/course gates and actual deployment verification by release owner.
Final marker: LINEAR_PILOT_BROWSER_OK plus local contract tests and applicable CI.

## Risk and rollback

Local storage is per browser/profile. External help can be unreported. Static source contains keys, so this is not a protected examination. Append-only keystroke history consumes space; quota warning and full download preserve current in-memory work. Existing keys are untouched. Roll back only pilot/entrance/test/binding delta; do not delete event keys. No actual real-pupil effectiveness or production board acceptance claimed.

## Permissions

START, branch, local commits, push, Draft PR, controlled merge and deployment are authorized by the explicit current owner request and [standing authorization](../OWNER_RELEASE_AUTHORIZATION.md), after gates. No new owner publication permission needed. Main executing agent owns PR/release.

## Execution record

- Local DOM/contract tests: 17 passed (16 together and final navigation regression separately) (route, drafts, nonempty form, help/fresh task, stale tabs, denied storage, independent arithmetic substitution).
- Local browser run: unavailable: Chromium exits at process singleton `socket() failed: Operation not permitted`. No restriction bypass attempted.
- Existing checks: OGE_LEARNER_ENTRY_STATIC_OK (147 documents, 134 return bars, 1409 links); EQUATIONS_MATH_PASS (7500 conditions); EQUATIONS_REGRESSION_PASS (858 transformations).
- CI browser: workflow prepared; awaiting actual run, not yet passed.
- Independent ready-source review: reviewed math and behavior; four reported issues corrected with regression tests (stale help attribution, retry pending writes, explicit unknown answer, external help after correct answer). Final independent reread PASS; reviewed app SHA-256 `f99958f5b2de8eb8543a53254a92e326d72a36fd1686cf00adc71d56274f7c76`, store `91a4680dbc80ac991bb990a1652d29fa6a00437cdab5b0f3b3a763cfafe0c25d`, data `fd6fae9defbfa7a546d4a861d8207801437e2defaac500591ff1f27ffafd91ea`, HTML `9e87995597a29c974e5757b1d55104d1204be2e27ad7097de5b0eefc3b7f4cee`. Reviewer: delegated read-only agent, 2026-11-09, not external provider audit or browser acceptance.
- External review: not performed under standing owner policy.
- Real learners, actual five-day retention and production deployment: not performed by implementation agent.
- PR/head/release evidence: to be added by release owner after exact candidate validation.

## Follow-up integration and hardening

Gap links use the fixed `?return=linear-pilot` marker. The existing course supplies a whitelist-only return button in the companion resume package; release these consistently. Pilot links do not accept arbitrary redirect URLs. Added production-mode workflow dispatch and responsive screenshots as CI artifacts. Invalid local event payloads are skipped without deleting their original keys. A late declaration of external help invalidates that task’s completion qualification while preserving evidence; opening an example after finishing retains the prior completion and uses accurate chronological wording. Completed submitted checks remain viewable.

Synchronous disclosure capture before grading, finishing, stage navigation and pagehide prevents a queued `details.toggle` event from being lost when the form rerenders. Regression tests reproduce immediate-open-submit, immediate-open-finish and immediate-open-navigation timing. The full sixteen-test suite passed, then the seventeenth navigation regression passed separately with unchanged runtime. Final second independent focused review PASS on app `f99958f5b2de8eb8543a53254a92e326d72a36fd1686cf00adc71d56274f7c76` and store `91a4680dbc80ac991bb990a1652d29fa6a00437cdab5b0f3b3a763cfafe0c25d`; nine targeted tests independently passed. This remains source/DOM review, not a browser or learner trial.

## Base composition

Authoritative fetched main advanced to `8c35bb0e41808c5baf19942cedd124659f8bab5c` with unrelated ОГЭ №8 root-condition clarification. Read-only merge-tree composition was clean. Ordinary history-preserving merge produced tree `e66f4c32fde5579ea5d0620d97d8c829001c00f4`; reviewed pilot runtime hashes unchanged. Publication still requires fresh main/head checks, preservation bindings and CI in the release-owned branch.

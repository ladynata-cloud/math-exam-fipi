# Cloud continuation of PR394

Date: 2026-11-03 (Asia/Novosibirsk). Task: STUDENT_ONBOARDING_COURSES, HIGH.

## Candidate

Original base: `37718f1c0138ba031314b8f4716b73c9d963bc81`.
Original head: `5ea0809168e63ae021995a5d5e34696508e919e7`.
New integration base: `d74b8d599a5031a0620679a76dd08151fa171661`.

Authoritative GitHub refs and all intervening main commits were read. They are owner-merged task PRs covering the lesson showcase, LCM/navigation, finance, Peterson, geometry, the separately maintained assistant, release policy, reference sheets and PR421–423. No unrelated branch is being merged. Existing helper work remains unchanged.

A read-only three-way composition compared every PR-touched blob to the original base and current main. Of 42 paths, 36 do not overlap newer main. Six overlap:
- learning/app.js, tools/learning-free-route.browser.cjs and the learning-quality workflow merge cleanly.
- learning/index.html keeps both new onboarding includes and current attached-course scripts; app/style cache labels identify this combined version.
- learning/style.css retains the complete LCM block and adds the independent onboarding/roster rules.
- PROJECT_STATUS retains all prior records, appends the historical onboarding record and adds current production reconciliation.

No force, rebase, reset, rewritten history, test weakening, secrets or actual learner data. This continuation uses an ordinary two-parent merge.

## Review and gates

The original independent HIGH review remains historical evidence. Backend transactions/API, onboarding controller, course catalog, teaching integration and their original tests retain their reviewed blobs. New integration review checks the composed navigation and stylesheet/script loading. The original source fingerprint is not claimed to describe the new full composition.

Syntax checks of the merged app and browser gate pass. Exact-head cloud CI, the full backend suite, all existing relevant browser workflows, a fresh onboarding journey at three widths and old-runtime rollback are required. The focused workflow retains actual screenshots and JSON evidence. Results and final head are recorded in PR394 after execution; this file does not predeclare a pass.

## Hosting boundary

The current public root links to `https://mathexam-board-ladynata.msk1.amvera.tech/learning/`. Historical .amvera.io checks are not current availability evidence. A fresh cloud read-only probe checks health, learning status and public static assets with normal TLS and no authentication. It performs no writes and retains only HTTP metadata, safe readiness flags and content hashes.

Amvera control access has not been established: no connected tool or matching plugin was found. Successful source CI does not prove a cabinet backend deployment. Frontend/backend must be released together through the established host, preserving the persistent volume; no real-pupil test or server configuration change is authorized by this validation.

Rollback remains the previous runtime over the existing database, without deleting additive program data or restoring an older pupil database. The cloud rollback check uses the exact new main as the previous runtime and only synthetic data.

## Authorization

The owner's continuation and OWNER_RELEASE_AUTHORIZATION.md authorize routine integration, checks and publication of this task without a repeated approval or mandatory external audit. External-provider review is not performed. Hosting access/readiness is a technical prerequisite, not a request for another publication permission.

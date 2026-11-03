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

The public host was verified healthy on 2026-11-03 00:34:46 UTC: all four public endpoints return HTTP200; learning available=true; live app.js and index.html match current main byte-for-byte. The completed PR395 release records automatic Amvera update after squash-merge, 37 exact assets and three runtime checks; no manual provider deployment occurred. This is the established publication path. No new hosting credentials or provider configuration is needed for that path. Successful source CI alone does not prove this new deployment: the post-push gate waits for 26 exact asset matches across Pages and Amvera plus available/durable backend readiness. Real-pupil writes and private provider-package inspection remain outside this task.

Rollback remains the previous runtime over the existing database, without deleting additive program data or restoring an older pupil database. The cloud rollback check uses the exact new main as the previous runtime and only synthetic data.

## Authorization

The owner's continuation and OWNER_RELEASE_AUTHORIZATION.md authorize routine integration, checks and publication of this task without a repeated approval or mandatory external audit. External-provider review is not performed. Hosting access/readiness is a technical prerequisite, not a request for another publication permission.

## Fresh cloud evidence on integration head 5af20d2

Focused run41553637281 passed all 17 synthetic onboarding test groups, rollback over exact main d74b8d5, and the real HTTP/SQLite browser journey at 320/390/1280px. Browser version151.0.7922.34; errors=[], publicRequestsAllowed=0. All fifteen fresh screenshots were actually inspected. Artifact13192738666 ZIP SHA-256 c841b5924d1f16b617c253a6667852bb94f3b4c38c3eafa3be27fcce6960a5af. The follow-up changes only release verification and this evidence; product source remains identical. Exact new-head CI is still required and recorded in the PR.

## Retained CI failure and narrow harness correction

On head341da146, Peterson run41554495785 / job125649949373 failed in the standalone synthetic iframe test at cabinet305/320. The preceding board and equation gates passed. The exact same product/source fixture had passed on integration head5af20d2; the intervening commit changed only release workflow/docs. The fixture does not execute the cabinet app, only checks its sandbox/referrer strings, so this is not a new onboarding routing result.

The failing assertion read the generated session immediately after `frame.goto(exactUrl)` changed only the hash. Same-document navigation can complete before the hashchange handler restores the archived task; waiting for an already visible answer form does not wait for that handler. The harness now awaits the exact requested visible problem text before comparing the complete archived session, hint count, draft and solution count. All assertions, viewports, timeouts and production files are unchanged. The failed attempt is retained; the new exact-head run must pass.

## Free-route privacy integration correction

Run41555059517/job125652162355 passed the complete backend suite and onboarding browser journey, then failed at the existing free-route receipt assertion. The main-branch privacy guard expected credential issuance to create no operation receipts, while the reviewed atomic onboarding contract deliberately persists one nonsecret idempotency receipt. This is a semantic test integration conflict after the source merged cleanly.

The corrected browser gate requires exactly one new receipt, byte-for-byte preservation of earlier receipts, the authenticated teacher actor, the existing recursive credential privacy guard, and the exact allowlisted payload {operation, learnerId, authEpoch, profileVersion}. It separately preserves the zero-receipt assertion for legacy credential creation and rejected duplicate logins. Existing negative privacy fixtures still reject plaintext, credential keys and malformed metadata; backend tests separately prove the fingerprint is independent of the PIN. No product implementation changed. The free-route scenario also runs early in the focused cloud workflow so this compatibility check is visible before the larger regression suite finishes. The failed run remains recorded and is not presented as PASS.

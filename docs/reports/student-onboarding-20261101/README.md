# Pupil onboarding and course assignment — verification record

Task: [STUDENT_ONBOARDING_COURSES](../../tasks/STUDENT_ONBOARDING_COURSES.md).  
Review level: **HIGH**. Base: `37718f1c0138ba031314b8f4716b73c9d963bc81`.  
Candidate branch: `feat/student-onboarding-courses-20261101`.

This is a preparation record. The Draft PR supplies the final head and CI
identity. No merge, deployment, real-pupil change or external-provider approval
is claimed here.

## Teacher and pupil behavior

“Add pupil” now has three stages: pupil details and existing login/code, one or
more courses, then a nonsecret confirmation. Successful creation shows the
existing ready-entry link, login and four-digit code, copy action and teacher
preview. The teacher's session remains the teacher's session.

The catalog contains 22 existing published entries. The chosen grade and
courses become part of the pupil's versioned profile. A later “Change program”
action uses that same profile and preserves credentials, assignments, attempts,
event history and work from removed courses. The pupil home shows the selected
courses, with each course's actual storage behavior explained.

The teacher preview shows assigned course cards and saved cabinet summaries.
Public-course launches are absent there: those courses can share browser-local
records on a common device. The existing native Atanasyan course retains its
explicit read-only preview. Pupils retain their ordinary course-opening actions.

### Screens

| Stage | Desktop | Phone |
| --- | --- | --- |
| Details | [1280px](screenshots/setup-details-1280.png) | [390px](screenshots/setup-details-390.png) |
| Course selection | [1280px](screenshots/setup-courses-1280.png) | [390px](screenshots/setup-courses-390.png) |
| Confirmation | [1280px](screenshots/setup-confirmation-1280.png) | [390px](screenshots/setup-confirmation-390.png) |
| Pupil program | [1280px](screenshots/pupil-courses-1280.png) | [390px](screenshots/pupil-courses-390.png) |
| Teacher preview | [1280px](screenshots/teacher-preview-1280.png) | [390px](screenshots/teacher-preview-390.png) |

All 15 screenshots, including 320px, are bound to file hashes in
[screenshots.json](screenshots.json). They use synthetic identities; code fields
are masked. Earlier failed-layout captures are not included as final evidence.

## Persistence and retry decisions

- The existing account creation, salted credential hashing, ownership, session,
  CSRF and permanent entry-link mechanisms are reused. There is no parallel
  identity store or new authentication policy.
- Account, profile, selected program and nonsecret operation receipt are saved
  atomically. A repeated create request checks the existing password hash and
  current authorization/profile epoch before returning success.
- Receipts contain no plaintext PIN or unsalted PIN fingerprint. PIN material
  lives only in the current form/credential card and is scrubbed on completion,
  cancellation, account change and document lifecycle cleanup.
- Program saves use the existing version and operation fences. A duplicate
  acknowledgement is rejected if another update has made its result obsolete.
  The teacher can reload the current version, compare it with the draft and
  explicitly apply a new save.
- The additive `learning_programs` table has an account foreign key; the existing
  schema version remains 1. Profiles without a program keep their old response
  shape. Old clients omitting `program` preserve existing course selections.

## Checks

Local runtime: Node 24.22.1; Playwright 1.62.1 with available Chromium
140.0.7339.16. The configured CI runtime remains Node 24.21.0 and its pinned
Playwright browser. Download of that browser failed locally; the exact CI browser
is a separate check, not inferred from the local run.

| Check | Recorded result |
| --- | --- |
| Complete backend suite | **375 passed, 0 failed, 0 cancelled, 0 skipped** |
| Onboarding actual HTTP/SQLite browser journey | **PASS**; [scenario record](browser-result.json) |
| Ready pupil access | **PASS** |
| Teacher/student role boundaries | **PASS** |
| Parent access and read-only overview | **PASS** |
| Classroom/cabinet with eight pupils | **PASS** |
| QR entry and independent QR decoding | **PASS** |
| Free route, original introduction, homework and resumed work | **PASS** |
| Full authentication/browser regression | **PASS** |
| Exact old-runtime rollback/reapply | **PASS**; [record](rollback-result.json) |
| Independent internal code review | **PASS**, no unresolved findings |
| External-provider review | **NOT RUN**; no connected provider capability found; no owner waiver |
| Exact-head GitHub CI | Recorded in the Draft PR |

The main browser journey creates a synthetic pupil with textbook Vilenkin and
foundations, loses a real creation acknowledgement, safely retries the same
operation, opens both courses, completes a real server-graded textbook task and
saves a separate foundations draft. It then exercises two competing teacher
sessions, edits the program, logs in with the unchanged code, reopens work from
the removed course and restarts both the HTTP server and SQLite store. A second
synthetic pupil, a preexisting assignment, the account and previous work/history
remain unchanged. No public request is allowed in this browser fixture.

The lifecycle check dispatches a synthetic persisted `PageTransitionEvent`
while a committed response is held. It proves secret scrubbing and rejection of
the late response. It is **not** a claim of a real BFCache navigation test.

### Reproduce

Use the repository-supported Node 24 runtime and the browser dependencies pinned
in `.github/workflows/learning-quality.yml`.

```sh
npm --prefix board-server ci --include=optional
npm --prefix board-server test
node tools/learning-onboarding.browser.cjs
node tools/learning-simple-pupil-access.browser.cjs
node tools/learning-auth.browser.cjs
node tools/learning-role-navigation.browser.cjs
node tools/learning-parent.browser.cjs
node tools/learning-quick-access.browser.cjs
node tools/learning-cabinet.browser.cjs
node tools/learning-free-route.browser.cjs
node tools/learning-onboarding-rollback.cjs 37718f1c0138ba031314b8f4716b73c9d963bc81
git diff --check
```

Set `LEARNING_ONBOARDING_OUTPUT_DIR` to preserve the masked screenshots and JSON
from the browser journey. The workflow now runs this journey and uploads its
evidence alongside existing checks. The rollback command needs the base Git
object and creates only a disposable database.

## Findings resolved during implementation

[Independent internal review](internal-review.md) reproduced and verified the correction of public-course
preview writes, stale program-save acknowledgements, edit-form lifecycle
cleanup and the occupied-login error. Course storage wording was qualified.
Visual review corrected roster overflow, narrow footer buttons and an unrelated
legacy Vilenkin card in the new teacher preview.

Existing browser tests were updated to complete the new wizard and expect its
program home. The school course retains its original introduction under its new
route. The auth/QR clipboard-denial tests now target their isolated browser
context explicitly; the old CDP call targeted the default context. No assertion
was removed to hide an application failure. Initial failed runs are superseded
only by their corresponding successful reruns.

Internal review independently checked the exact card-rendering function for all
22 catalog entries and the stale-receipt sequence on a separate synthetic
database. These checks establish card actions and replay isolation; they do not
claim execution of every public course. The nine reviewed runtime files have
combined SHA-256 fingerprint
`f0ca47c145da6a6cde100291f4335a86c8a37767c609eca5a6caac4586489ba9`.
The reviewer record in the PR binds this result to the final head.

## Production reconciliation and release boundary

The authoritative GitHub `main` remains the base above. Primary PR391 metadata
confirms its merge at 2026-10-31 22:36:02 UTC. Public GET checks found all 22
catalog destinations available (HTTP 200). The deployed cabinet's `app.js` and
`/api/learning/status` returned HTTP 503 during the read-only check; see
[production-readonly.json](production-readonly.json). This observation does not
establish the cause or duration of the hosting problem, nor certify a deployed
cabinet version. No production account was accessed or modified.

Before publication, complete the HIGH external-review requirement in
[REVIEW_POLICY](../../REVIEW_POLICY.md), or obtain an explicit task-specific
owner exception with rationale, and verify the PR's final CI. No such exception
is currently recorded. A separate owner merge/release authorization must bind
the exact base and head; query authoritative `main` again immediately before
merge under the base-drift guard. The backend and cabinet assets must be
released together. Verify cabinet availability and the synthetic flow on the
published version only after that authorization.

Rollback uses the previous runtime without dropping `learning_programs` or
restoring an older database over pupil work. The reproducible check confirms the
old runtime can open the upgraded database, retain accounts/sessions/work, edit
old profiles and create pupils. Reapplying the feature recovers the selections.

```text
EXECUTIVE STATUS

Task: STUDENT_ONBOARDING_COURSES
PR: Final Draft PR link in GitHub handoff
Base: 37718f1c0138ba031314b8f4716b73c9d963bc81
Head: Final Draft PR head
Gate: STUDENT_ONBOARDING_COURSES_OK (local); release approval remains open
Tests: 375 backend tests; synthetic onboarding and relevant regressions above
Failures: No unresolved local failure; production GET observed HTTP 503
Not run: External review; deployment; production or real-pupil changes
Scope deviations: None
Recommendation: Keep the PR Draft pending exact-head CI and external review/release
Next user decision: External review or scoped exception, then separate publication authorization
```

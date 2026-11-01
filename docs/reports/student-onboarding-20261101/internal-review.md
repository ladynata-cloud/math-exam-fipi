# Independent internal HIGH review

Date: 2026-11-01. Task: `STUDENT_ONBOARDING_COURSES`.  
Base: `37718f1c0138ba031314b8f4716b73c9d963bc81`.  
Implementation commit: `79ab2da2be8d21b7d14444026869c4d4f1a4f950`.

Verdict: **INTERNAL_REVIEW_PASS**. No unresolved blocking findings. The reviewer
was a separate review agent and made no repository edits. This is not external
provider review and grants no merge/deployment authority. The final GitHub PR
binds this record to its head; source identity is independently recorded below.

## Scope and results

Reviewed atomic creation and retry receipts, role/session/ownership fences,
versioned program changes, secret lifetime, old-client compatibility, course
dispatch, teacher preview isolation and preserved attempts/history.

| Finding | Resolution and independent verification |
| --- | --- |
| P1: ordinary public-course preview could modify shared browser-local history | Reproduced with synthetic Makarychev work on localhost. Teacher cards are now static; only the native explicit read-only Atanasyan preview retains its launch action. |
| P2: delayed duplicate program-save receipt could acknowledge an obsolete version | Reproduced in a separate temporary SQLite database. Current repeats succeed; after another save they now return `LEARNING_PROFILE_CONFLICT` without modifying current data. Legacy omitted-program repeats retain compatibility. |
| P2: program edit form could survive `pagehide` with stale authorization generation | Every active onboarding controller now participates in lifecycle cleanup. The new integration test holds a real committed acknowledgement while exercising the cleanup handler. |
| P2: occupied login showed a generic work-conflict message | The explicit occupied-login instruction now precedes generic HTTP409 handling. |
| Storage wording was too broad | Labels distinguish managed tasks, external browser-local materials and shared-device records. |

The reviewer executed the exact `programCardsMarkup` function with the real
catalog in Node VM. All 22 teacher cards contain no ordinary public launch, and
all 22 pupil cards retain an opening action. The Atanasyan exception requires an
explicit pupil preview ID and read-only wording. Result:
`INDEPENDENT_PROGRAM_PREVIEW_OK`. This does not certify every course runtime.

The separate synthetic database replay check returned
`INDEPENDENT_PROGRAM_REPLAY_OK`. Full backend and browser results were received
from their executing agents and are not misrepresented as the reviewer's own
full-suite executions.

## Final integration delta

The reviewer separately accepted the `welcome.js` route addition for the selected
school course, preserving all role/seen/open-dialog guards. The auth/QR tests
now deny clipboard access in their actual isolated browser context, and wait for
cabinet content rather than an early shell. Existing privacy, identity and
fallback assertions remain.

| Additional reviewed file | Git blob |
| --- | --- |
| `learning/welcome.js` | `abf6cf3eff93150ff32792677fe597c979a8b6e6` |
| `tools/learning-auth.browser.cjs` | `c8351601585d96509410e3d0f53617608eec2ef7` |
| `tools/learning-quick-access.browser.cjs` | `a32c64cca8a82d431de7e4db90236bed1c323ee3` |

The nine main reviewed runtime files have fingerprint:

`f0ca47c145da6a6cde100291f4335a86c8a37767c609eca5a6caac4586489ba9`

This is SHA-256 of compact JSON containing sorted pairs
`[repository-relative path, SHA-256 file bytes]` for `learning-api.js` and
`learning-store.js` in `board-server`, and `app.js`, `course-program.js`,
`index.html`, `onboarding.css`, `onboarding.js`, `style.css`, `teaching.js` in
`learning`. Individual final hashes are in [checks.json](checks.json).

## Remaining boundaries

External-provider review remains required under the HIGH policy; discovery
found no available Claude/Anthropic connection, and no task-specific owner
exception exists. Real BFCache navigation, every public-course runtime and
production pupil trials were not performed. The lifecycle test is explicitly a
synthetic persisted event. Separate owner authorization is required for any
merge or publication.

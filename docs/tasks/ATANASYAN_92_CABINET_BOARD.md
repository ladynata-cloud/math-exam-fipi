# Atanasyan 7–9 exercise 92a: cabinet and shared board

## Identity

- Owner: repository owner.
- Date: 2026-10-24 (Asia/Novosibirsk).
- Base: `main`, `1f9d8aec82bd2909917ab22746d94571d87c59c4`.
- Branch: `feat/matvey-atanasyan-board`.
- Review level: `HIGH` because this extends a server learning contract and
  managed saved work, although it uses existing protocols and authorization.
- ADR 0001 remains Proposed; implemented bridge and learning contracts, not
  that proposal, establish the integration pattern.

## Goal and verified context

Make the existing exercise
`/geometry-course/textbook/#atanasyan-7-9-main-92-part-1` available in a
grade-7 pupil's existing cabinet and on the owner's interactive board, with
cloud work preservation and actual shared interaction state. The current
textbook has neither learning nor board bridge support. An existing activated
cabinet was found; no duplicate account or credential change is needed.

## Approved scope

- A fixed `/trainers/atanasyan-7-9.html` entry reuses the released exercise,
  engine and planar model through an isolated adapter and memory storage.
- Only exercise 92a and its four prerequisite theory cards are exposed.
- Board mode synchronizes the reasoning draft, revealed steps, assistance,
  model view and theory dialog through existing Trainer Bridge v1.
- Cabinet mode uses the existing learning bridge and a bounded server
  contract. Its draft is cloud work, while a proof remains manually reviewed;
  saving or revealing a solution never produces automatic correct credit.
- Register one trainer and a literal, same-origin alias for the supplied
  canonical task URL. Preserve the existing registry path boundary.
- Reuse the actual cabinet, preserving its assignments and learning history.
  Account actions occur through the teacher UI; no pupil data enters git.
- Focused contract, adapter, registry and real multi-client browser checks,
  independent review, deployment packaging, documentation and Draft PR.

### Excluded and protected

No new curriculum, mathematical content or model geometry; no changes to the
336 released cards or the five sealed textbook runtime files. No imported
personal local drafts, automated grading of proofs, authentication changes,
new protocol, duplicate pupil account, password reset, or unrelated course
work. Existing homework submission and teacher-review rules remain in force.

## Acceptance criteria

- [x] The exact source URL opens a registered board trainer without relaxing
  foreign-origin, encoded-path or traversal rejection.
- [x] Controller and observer share drafts, steps, help and diagram views;
  reload, late join and control handoff retain semantic state without echo.
- [x] Managed work restores in the cabinet and never claims an unreviewed
  proof is correct. Old trainer contracts and attempts retain their semantics.
- [x] Malformed or out-of-scope snapshots are rejected before mutation.
- [x] Standalone course content, runtime hashes and personal drafts are intact.
- [ ] The real cabinet retains its previous work and gains the requested task
  after the reviewed implementation is deployed.
- [x] Layout remains usable on a narrow screen without cluttering the model.

## Checks and gates

Required: new adapter and contract units, exact registry and alias tests,
existing learning contracts, real teacher/observer browser flow, managed
learning restoration, relevant existing board regressions, syntax and
`git diff --check`. Verify unchanged sealed course files and actual container
asset coverage. Final technical gate: `ATANASYAN_92_CABINET_BOARD_OK`.
Record failures and unrun checks separately; a local gate is not a release.

## Review plan

- Trainer design consultation is not applicable: existing authored pedagogy,
  diagrams and interactions are reused without redesign.
- HIGH requires independent review of state validation, role/ownership,
  persistence isolation, manual-review semantics and rollback.
- External ready-result review is required by repository policy. No general
  authorized external-review connector is exposed in this session; the
  repository's existing OGE-only review workflow is not a generic reviewer.
  This is not an approval or a waiver. Complete implementation and evidence
  before requesting any necessary owner release exception.
- Sanitized review material contains public code and synthetic learner data
  only. An external verdict must name provider, PR, base/head and source/time.

## Risk and rollback

The principal risk is a mismatch between client snapshots and the server
contract, or stale role state overwriting work. Use existing bridge hydration,
revision and ownership guards and bounded validated state. Revert the single
task patch to remove its catalog/registry entry and wrapper. Do not delete
existing attempts or assignments during rollback; saved JSON remains stored
and can be recovered when the same contract is restored. No schema migration
or authentication change is introduced.

## Permissions and execution

The owner's direct request starts implementation, cloud checks, ordinary
cabinet edits, branch commits, push and Draft PR creation. Per repository
workflow, merge/deployment of code requires a separate reviewed base/head
authorization. No force, rebase, reset, auto-merge or security bypass is allowed.

- Actual base/branch: as above; initially clean.
- PR: [#318](https://github.com/ladynata-cloud/math-exam-fipi/pull/318).
  The current immutable head/tree and CI runs are recorded in its handoff.
- Technical checks: PASS locally in the cloud workspace. Full server suite
  298/298; new adapter/picker/manual contract group 21/21; registry integration
  7/7; exact registry/picker group 28/28; preserved profile picker group 14/14.
  These groups overlap and are not a summed test count.
- Actual classic board and managed cabinet/API/SQLite browser gate: PASS.
  Covered nested theory 14→1 and return, manual save, model/step state,
  controller/observer reload, late join, transfer/revoke, pointer and keyboard
  readonly behavior, 320px layout, no hydration echo and no personal storage.
- Existing profile task-3 and task-8 real board journeys: PASS. Targeted B2
  live and fail-closed journeys: PASS. The known inherited supplemental Roads
  scenario is outside this gate; no full B2 pass is claimed.
- Preserved textbook: build `--check`, strict course/review gate and six
  review-scope tests PASS; retained-work 13 checks PASS; independent runtime
  DOM checks for all 336 lessons and 1053 steps PASS. Sealed runtime and
  bundle remain byte-identical to base. Catalog-reference and route-map PASS.
- Independent technical review: no remaining blocking findings on the frozen
  production files; separate code/state validation and real browser evidence.
  This is agent review, not an external-provider verdict.
- Synthetic delivery audit: PASS on both school and foundations profiles.
  Teacher UI adds a thirteenth recommendation while preserving the first
  twelve and the plan note. The learner opens and saves the native attempt
  without creating a photo assignment or artificial deadline.
  Catalog-reference browser checks cover all 351 identities; the grade-7
  browser gate covers 169 entry cards and 62 original route cards, including
  retained work, handoff, reload and manual submission.
- Exact-head CI: running on the Draft PR; record its immutable final run and
  head in the PR before the owner release decision. The first head passed
  the new actual cabinet/board job and production-container job; two older
  fixture failures were diagnosed as described below, not counted as passes.
- Production assignment/board verification: pending deployment.

## Resolved development findings and limits

- The classic host previously used only pointer blocking for observers. An
  independent real-keyboard reproduction reached the answer with seven Tab
  presses after control revoke and changed the observer's local draft. The
  existing ownership state now also sets iframe `inert`/tabIndex and clears
  focus. Independent replay with 60 Tabs and the final browser gate pass.
  No bridge protocol, authentication or server authorization was changed.
- Managed iframe sandboxing suppresses native form submission. The isolated
  wrapper now saves through an explicit button and semantic state update,
  without relaxing sandbox permissions or replaying synthetic form events.
- Cabinet reference actions do not persist an included snapshot. Only this
  adapter maps its theory changes to the existing state-persisting input
  action. Nested theory and view survive actual SQLite/reload checks.
- Registry/count and original ege-path fixtures were updated precisely for
  one new manual trainer. No existing family assertion was removed. The
  container-equivalent test now includes the exact new scoped Docker COPY.
- First-head CI exposed a further rebuild fixture that included the new
  manual card in its count of 217 original identities. The test now checks
  the original trainer set, the exact manual identity and the full 351-entry
  partition separately. Independent review confirmed no overlaps or missing
  groups, and all 34 mathematical/curriculum workflow commands pass.
- The video-entry gate still expected an OGE home page even though PR #278
  intentionally starts those four public trainers in practice. The runtime
  files and stale assertion were identical on the base. The fixture now
  waits for the existing standalone-ready marker and checks the intended
  visible practice/input state; explicit practice and answer-feedback checks
  remain in place. The same fixture still used the pre-PR #295 EGE stage
  navigation. Its default-entry and saved-work checks now exercise the
  existing task-first UI, preserving complete state equality for the final
  answer, independent guided draft, written note and disclosure flags.
  Native toggle completion is awaited semantically, without timing sleeps.
  No public trainer behavior is changed by these corrections. Full MP4
  playback cannot run in the sparse local checkout, which omits video media;
  its earlier CI section passed and the final full gate runs in GitHub.
- An initial runtime attempt lacked jsdom; pinned dependencies resolved that
  environment issue. Early fixture failures and the two behavior bugs above
  were corrected and rerun; final remote results remain explicitly pending.
- Not run: real learner pilot, external-provider review, new code deployment
  or production synchronized assignment. The existing pupil's plan link is
  saved; its original assignments and work were not changed.

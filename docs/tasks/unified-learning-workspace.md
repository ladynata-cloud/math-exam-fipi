# Unified learning workspace

## Identity

- Task: permanent learning accounts, continuous attempts, group teaching and semantic trainer adapters.
- Owner: repository owner, current conversation.
- Date: 2026-10-05.
- Base branch: `main`.
- Base SHA: `32cc54312ff2a125c117c85aa180e8da3c74128d`.
- Planned/actual branch: `feature/unified-learning-workspace`.
- Review level: `NEW_ARCHETYPE` (also includes HIGH authentication and persistence risks).
- Related ADR: [0010](../adr/0010-unified-learning.md), Proposed.

## Goal and authorization

The owner's current START is to implement the whole connected learning system,
with especially high quality for the board, personal accounts and trainers.
One learner identity and one durable attempt must continue between independent
work, homework, another device and a group lesson. The owner permits parallel
work and lower model settings where appropriate. Critical design and review
remain on the parent model; no quality criterion is lowered.

## Evidence

The published group pilot (PR #183, merged base above) has eight independent
seats, four previews, two learner panes, authored drawing and history, but only
two allowlisted trainer schemas. Its anonymous bearer links are not permanent
accounts. Read-only production checks during the preceding hosting recovery
confirmed healthy backend, durable group capability and the published creation
screen. No hosting mutation was performed during that diagnosis.

The Path engine currently contains 107 lesson families, deterministic task
generation and 21-position course/exam navigation. General progress is not a
resumable attempt: several other trainers discard current inputs or generate a
new task on reopening. Existing mathematics gates pass but do not establish
curriculum alignment or new synchronization correctness.

## Scope

- Permanent teacher and learner accounts, private activation and recovery,
  explicit one-time operator bootstrap, revocable cookie sessions.
- Transactional attempts, assignments, authored events and account-based lessons.
- Teacher roster, shared/individual homework, four live previews with pages for
  eight learners; learner own work plus explicit teacher presentation.
- Topic and exam-position views over the same content IDs and attempt history.
- Semantic adapters for the main Path course and foundational trainer families,
  with explicit coverage and no claim that DOM replay permits joint control.
- Exact task, input, step, model, hints and participation preservation; genuine
  server result checks and a new analogous task after assisted work.
- Allowed formula sheet separated from teaching hints, with source/version labels.
- Homework requires online tasks and photographed tasks, with private learner
  photo submissions, separate manual review and group assignment batches.
- Scoped per-learner resets archive history; reports, preparation plans and
  pseudonymized AI export/reviewed draft import support teacher decisions.
- A 21-question practice exam with full reference sheet, deferred results and
  cross-device continuation uses the same verified task contracts.
- Local browser, mathematics, authorization, retry/conflict and restart tests;
  independent review and a single Draft PR.

Legacy anonymous lessons and standalone browser progress remain compatible.
There is no automatic promotion of old counters to verified independent results.
No production test accounts, lessons, credentials or learner records are created.
Live rollout, first teacher activation and production write tests are separate
reviewable release actions. Existing hosting billing and the stopped video
application are outside this implementation.

## Acceptance criteria

- [x] A learner resumes the same exact task and draft on another device.
- [x] Homework and group teaching refer to the same attempt ID.
- [x] Eight isolated learners can work; teacher sees four live previews per page.
- [x] Presentation exposes only the selected workspace and changes no observer result.
- [x] Roles, invitations, recovery and frame boundaries withstand adverse tests.
- [x] Duplicate requests create one event; stale clients cannot overwrite newer work.
- [x] Restart/backup restore preserves accounts, attempts and consumed credentials.
- [x] Covered trainers restore models, input and feedback without regenerating tasks.
- [x] Mathematical and pedagogical coverage is independently checked and stated honestly.
- [x] Both course views and worded progress use the same server attempts.
- [x] Reference sheet use alone does not mark a solution as assisted.
- [x] Old board and trainer gates remain meaningful and results are reported exactly.

## Checks and review

Required: existing board server suite; new account/store/API adversarial tests;
trainer generator/oracle gates; multi-context browser end-to-end scenarios;
mobile/desktop inspection; `git diff --check`; final diff and artifact review.
Final marker: `UNIFIED_LEARNING_GATE_OK`, emitted only after applicable gates pass.
Independent review is performed by a separate agent. This is not external
review provenance. External review/waiver and archetype acceptance remain owner
decisions for rollout; the earlier PR #183 waiver is recorded only for that PR.

## Risk and rollback

Key risks: credentials readable by a trainer, partial dual writes, stale snapshot
overwrite, unjustified mastery claims, regression in mathematical interaction.
Use a separate cabinet origin, one SQLite transaction source and server outcomes.
Rollback disables the new routes/assets while retaining the new database and
all existing group/progress data. Do not migrate or delete legacy data implicitly.

## Permissions

- Current START, branch, local commits, push and Draft PR: yes.
- Merge, auto-merge and deployment: no new authorization in this task.
- No force operations, protection changes or external messages.

## Execution record

Local final backend run on pinned Node 24.21.0: **103/103 passed**. This includes
legacy board contracts plus accounts, CSRF, ownership, recovery, idempotency,
trainer-version conflicts, private images, reset, exam and backup restoration.
All data used for validation is synthetic.

Browser gates passed using real Chromium, two origins and separate contexts:

- `LEARNING_PATH_BROWSER_OK`: 107 routes, 34 model kinds, guided prefix,
  input/hint/model recovery, takeover, silent hydration and reload.
- `learning-remediation-smoke.cjs`: 36 managed and 36 standalone entries,
  224 actions, including all 12 percentage questions and three mixed divisions.
- `learning-cabinet.browser.cjs`: eight students/four tiles, sheets, presentation,
  concurrent teacher ink and pupil input, two pens, author undo, dropped ACK,
  second device, in-lesson analogue, replay, mobile, reset and archived editor.
- `learning-exam.browser.cjs`: 21 sanitized questions, full reference, loss/retry,
  second device, stale conflicts, atomic grading, skipped answers, assisted and
  cancelled runs, route-away drain and late acknowledgements.
- `learning-teaching-live-browser.cjs`: real cookie/SQLite/image pipeline,
  eight private homework copies, one deduplicated photo, lost-ACK retry,
  ownership isolation and manual feedback without an automatic success.
- Teaching UI and catalog/reference browser gates passed; original reference
  covers four printed pages and 749 helper cases. Desktop and mobile visuals
  were inspected.

Mathematics gates passed: 25,680 Path conditions and 97,408 displayed answers;
2,000 divisions and 5,142 intermediate actions; generated bank checksum;
full checkpoint continuation; existing equation/practice/division-lab browser
regressions. Semantic adapters cover **107 Path + 36 remediation = 143** catalog
entries. This does not cover every site engine or every FIPI task. Forty-one
Path families yield fewer than ten unique conditions over 240 tested seeds.

Independent implementation review identified and verified fixes for state races,
readonly/archive handling, forged completion, exact fractional output, photo
ownership and malformed images, and exam answer exposure. The reviewer added
25 adversarial tests independently. This is internal review, not external
provider approval.

Known legacy limitations: the prior trainer-registry client browser failure
occurs on the untouched group-board base. Historical remediation baseline/hash
scope checks reject these explicitly authorized changes or require a missing
historical object; they were not weakened. Current mathematical/browser checks
above establish the changed behavior. Exact historical commands:
`node --test tools/division-lab.test.cjs` stops while reading absent base object
`010e89c75c0fe110b57c983c728b8216fb38cd9d`;
`node tools/oge-basics-percentages-v2.test.mjs` reports 5 passed / 4 failed
(two fixed-old-hash assertions and two references to unavailable base
`41f38657f7e72cc65d24ad275a4330ceccc55d0a`). Its historical-fixture math pass
is not counted as verification of this new bank. Actual Alpine container execution is
assigned to the added CI job because Docker is unavailable locally.

The first cloud run of the new learning workflow passed, including the actual
Alpine image, SQLite/image codec and all browser gates. The existing EGE workflow
then exposed two stale integration fixtures: its manual Path script loader
omitted the extracted exam pool, and its navigator assertion still required
the pre-cabinet "planned" wording. The fixtures now load the page's declared
scripts and assert the real separate cabinet boundary, while retaining exam
grading assertions and strengthening the navigator's no-cloud-write checks.
The exact final-head CI result is recorded in the PR.

No production activation, write/load test, hosting restart, merge or deployment
has been performed for this task. Cloud CI results and exact remote head belong
in the Draft PR; this record does not predict them.

```text
EXECUTIVE STATUS
Task: Unified learning workspace
PR: pending
Base: 32cc54312ff2a125c117c85aa180e8da3c74128d
Head: pending
Gate: local behavioral and mathematical checks passed; container CI pending
Tests: 103/103 backend; trainer, classroom, homework, exam and math gates passed
Failures: no current scoped test failure; historical scope gates described above
Not run: production mutation tests; new rollout
Scope deviations: none recorded
Recommendation: inspect Draft PR and production-image CI before release acceptance
Next user decision: concrete release acceptance after review
```

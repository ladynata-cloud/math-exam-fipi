# Added START trainers: shared board sessions

## Identity

- Task: `PROFILE_ADDED_TRAINERS_BOARD_SYNC`
- Owner: repository owner
- Date: 2026-10-24 (Asia/Novosibirsk)
- Base branch: `main`
- Base SHA: `07189de58b7f5d60c02ea6ca6aa9450a324a377f`
- Original implementation base SHA: `1f9d8aec82bd2909917ab22746d94571d87c59c4`
- Planned branch: `feat/profile-added-trainers-sync`
- Review level: `MEDIUM`
- Related architecture: the existing SDK v1 board session and runtime registry.
  ADR 0001 remains Proposed; it is not treated as accepted authority.

## Goal

Synchronize the five recently added START sections in the individual lesson
workspace, so teacher and pupil see the same task, draft, explanation, feedback,
and interactive drawing. Preserve the ordinary course and each person's local
progress. The separate board-writing task supplies improved writing tools and
screen modes; this task supplies the additional trainer integrations.

## Context and evidence

- The owner's direct instruction requests cloud execution and synchronization
  of all the added trainers. The bounded inventory is five course sections:
  planimetry (1), vectors (2), simple probability (4), random variables (6),
  and equations (7 in the current START course).
- Source inventory: 22 topics and 132 tasks, respectively 6/36, 4/24, 3/18,
  3/18, and 6/36. Equations were called task 6 in an earlier request; the
  current authored course places them in section 7. No curriculum renumbering
  or task data changes are included.
- Existing registered wrappers for stereometry (3) and expressions (8) use a
  memory-only shared session, strict route/state validation, and silent model
  hydration. Reuse this implemented contract without changing the protocol.
- PR #312 was merged as the base stated above. Its parent, tree, successful
  post-merge checks, and published asset parity were verified in the preceding
  release. Project-status reconciliation is included in the concurrent
  `INDIVIDUAL_BOARD_TOOLS` task; this task does not create a status-only PR.
- All 132 task steps have no calm-micro exercise. No broader micro-state or
  calm-UI redesign is needed. Three existing planimetry tasks contain their
  own inline walkthrough instead of the generic solution panel.

## Approved scope

### In scope

- Five dedicated wrappers that reuse the authored course assets and fixed
  course boundaries; exact entries in the existing board registry and picker.
- Canonical course URL aliases for those five sections and their supported
  topic/practice routes. Preserve same-origin, literal-path restrictions.
- Shared route, task/session, answer draft, feedback, hints, step disclosures,
  interactive model state, handoff, reload and late-join behavior using the
  existing SDK v1 adapter and events.
- Bounded semantic model export/validation/silent hydration hooks where absent.
  Reuse existing equation model hooks and preserve authored learning behavior.
- A narrowly scoped validator branch for the three existing inline planimetry
  walkthroughs; no general relaxation of solution or model validation.
- Focused units, real local teacher/pupil browser journeys, existing task-3/8
  regressions, required registry fixture updates, CI, review and this task record.

### Out of scope / protected areas

- No new task content, answer changes, curriculum renumbering, redesigned
  learning sequence, gradebook results, personal progress writes or account edits.
- No board-server runtime, authentication, role, endpoint, protocol, storage,
  group-board or deployment configuration changes.
- No Octo integration or synchronization of arbitrary external iframes.
- No additional START sections outside 1, 2, 4, 6, 7; sections 3 and 8 receive
  regression coverage only. The separate board-tools PR remains independent.

## Acceptance criteria

- [x] All five canonical overview links and supported routes open the correct
  exact registered wrapper; malformed/foreign/encoded links gain no authority.
- [x] All 22 topics and 132 authored tasks have valid, bounded semantic state.
- [x] Teacher and pupil share tasks, drafts, feedback, help and step disclosures.
- [x] Interactive figures and labs hydrate silently and remain usable after
  control handoff; invalid and cross-section states are rejected atomically.
- [x] Reload and late join restore shared state without echo loops or writes to
  personal course preferences/progress.
- [x] Ordinary course behavior and existing task-3/task-8 board flows still pass.
- [x] The catalog and runtime registry contain exactly the five new mirrors,
  with unchanged prior entries and existing path/role protections.

## Checks and gates

- Required units: added adapter/model/picker tests, existing expressions and
  stereometry adapter/model/picker tests, applicable authored course tests, and
  registry unit/integration checks.
- Required browsers: five-wrapper/22-topic local two-context gate and existing
  stereometry/expressions board regressions.
- Static: JavaScript/HTML asset references, workflow structure, exact diff and
  `git diff --check`.
- Final gate marker: `PROFILE_ADDED_TRAINERS_BOARD_SYNC_OK`.
- Intentionally not run: real production lessons/accounts, physical stylus use,
  unrelated full group-board/B2 suites. The inherited B2 Roads failure is not
  reclassified as passing. Production smoke belongs to an authorized release.

## Review plan

- MEDIUM rationale: bounded new integrations within the existing client adapter
  and exact registry, with unchanged server contracts and recoverable frontend
  behavior. No new archetype is introduced.
- Trainer design consultation: not applicable; existing authored tasks,
  pedagogy, answers and interaction sequence remain unchanged. This is shared
  state plumbing for the existing trainers, not creation or redesign of them.
- Ready-result review: independent focused adapter/model review, exhaustive
  inventory tests, local two-context browser evidence and task-3/8 regressions.
- External review is not mandatory for this MEDIUM task unless requested by
  the owner. No external Claude verdict is claimed.
- Handoffs include only scoped public source and synthetic test evidence; no
  credentials, learner details or machine-specific absolute paths.
- Any external review would require provider, PR, exact base/head, verdict and
  a verifiable source or timestamp; a marker in this file is not such evidence.

## Risk and rollback

- Main risks: hidden model state omitted from snapshots, asynchronous route
  hydration, overbroad course aliases, and ordinary-course regressions.
- Fixed wrapper identifiers, allowlists, strict semantic validators and silent
  imports contain those risks. Personal progress remains isolated in memory
  while a wrapper is open; the ordinary course keeps its existing storage.
- Registry publication must accompany frontend publication in an authorized
  release. Until the runtime registry refreshes, new pages may open without
  shared mirror permission; a page title is never evidence of authorization.
- Rollback: revert this task's delta through normal review and restore the
  prior published registry/frontend together. No data migration is required.

## Permissions

- Current-task execution authorization: direct owner instruction to synchronize
  all added trainers and continue cloud work. No literal `START` is claimed;
  execution follows the session rule for explicit action requests.
- Branch creation, implementation, local commits, push and Draft PR: allowed
  by that request and the session workflow.
- Merge, auto-merge and deployment: **not authorized for this task**.
- Earlier PR #310–312 release permissions do not authorize this new release.

## Execution record

- Actual branch: `feat/profile-added-trainers-sync`
- Original implementation base SHA: `1f9d8aec82bd2909917ab22746d94571d87c59c4`
- Actual head SHA / PR: to be recorded in the Draft PR without a self-referential
  commit.
- Gate: `PROFILE_ADDED_TRAINERS_BOARD_SYNC_OK`.
- Passed focused tests: added adapter 14/14, new semantic models 7/7, new picker
  21/21; existing task-3/task-8 adapters 14/14, stereometry models 6/6 and their
  pickers 14/14; registry unit 25/25 and live integration 7/7. These are 108
  focused test cases, plus the applicable geometry, planimetry, vector,
  probability, equations, algebra and independent-model regression suites.
- Passed browsers: full five-wrapper/22-topic local teacher/pupil journey and
  the existing stereometry and expressions journeys, run sequentially. The
  new gate checks the 132-task inventory; exhaustive drawing contexts are
  covered by model units, not claimed as 132 full browser journeys.
- The new browser gate checked task/draft/feedback/help/step state, model
  geometry and controls, real lab drag and incomplete input, handoff/revoke,
  reload in both control directions, per-wrapper late join, examples/results,
  no echo, byte-identical personal stores, 320px layout and no external traffic.
- Static/module syntax, workflow parse, asset parity, independent focused review
  and `git diff --check` passed. Future board-module changes also trigger the
  added-trainer workflow, so combined workspace regressions remain covered.
- Failed intermediate runs: model fixtures initially had incorrect IDs; those
  were corrected against authored data. Integration found fraction-formatting
  parity, stale hint-credit and duplicate probability-shell issues; runtime
  fixes preserve standalone learning behavior and final gates pass. Existing
  exact registry counts were updated from eight to thirteen mirrors, including
  synthetic add/remove and health projections. No assertions were weakened.
- Two initial browser runs exposed harness assumptions (a duplicate return link
  and an informational status after revoke). The harness now selects the
  actual topic action and waits for socket/room/mirror readiness. The final
  run passed. A sandbox git-child-process restriction in the equations unit
  passed with the authorized invocation, without test changes.
- Independent adapter, model, wrapper, picker and registry reviews found no
  remaining blocker. No external reviewer verdict is claimed.
- Not run: production rooms/accounts, physical devices and unrelated full
  B2/group suites. The B2 smoke's exact registry fixture was updated and its
  syntax checked; the full inherited B2 issue is not claimed fixed.
- First-publication CI caught an existing expressions browser-gate race during
  remediation: the URL changed before the independent form was replaced, so
  the test could type into the old form and submit the new guided form empty.
  A controlled hashchange delay reproduced the exact failure. The gate now
  waits for old-form disposal and actual guided step 1, synchronizes that view,
  and verifies the controller's draft and accepted answer before peer equality.
  The same delayed-render scenario and the ordinary complete browser gate
  passed on Chromium 151.0.7922.34. All prior assertions remain; no timeout or
  runtime change was made. Independent focused review passed.
- A later exact-head CI run completed with eight successful checks and one
  added-board browser failure at the first teacher draft after control revoke
  (`9/13` instead of `3/17`). Controlled native-dialog event delivery reproduced
  the exact signature: the share-panel close handler restored focus between
  Playwright's focus/select and insertText commands. No beforeinput/input event
  reached the answer field, and no remote state application overwrote a draft.
  The test now awaits the real dialog close handler completion before typing.
  This adds seven lines to the handoff helper, retaining every assertion and
  timeout; no runtime change, sleep, retry or assertion relaxation was made.
- The controlled old test failed as expected; the corrected handoff stayed
  pending while the close event was held, then accepted and shared `3/17`
  after event delivery. The ordinary complete added-five browser gate also
  passed on Chromium 151.0.7922.34 (five wrappers, 22 topic families). Source
  bytes matched the tested bytes; focused independent review passed.
- At the owner's requested completed checkpoint, the bounded test correction
  and this record are saved to the existing Draft PR. Exact-head CI for that
  follow-up must be assessed in the continuation session; it is not claimed
  green from an older head. No merge, auto-merge or deployment is performed.
- The companion board-writing implementation is prepared in Draft PR #313;
  all five of its exact-head CI checks passed. It is not merged or published
  by this task. The two initial implementation trees composed cleanly; writing
  and added-five browser gates both passed in that combined runtime. The final
  expressions-gate-only correction is checked separately against the same
  runtime before the final PR handoff.
- Scope deviations: none.

## Authorized base-drift resolution — 2026-10-24

- The owner explicitly authorized the proposed bounded conflict resolution and
  repeated validation after the continuation reported the new main. This
  authorization covers updating the existing task/PR; it does not authorize
  merging into main, auto-merge or deployment.
- Original reviewed head: `e9bf2bc06668dc03f88cf8a193ce4e0cf92be923`, based on
  `1f9d8aec82bd2909917ab22746d94571d87c59c4`. The initial resolution baseline was
  main `202d39bf826c8c7e030e59ff162fe808000cae7e`, whose sole concurrent commit is
  the merged PR #318 for the fixed Atanasyan 92a cabinet/board integration.
- The read-only virtual merge identified five conflicting files: the two
  registry test files, registry cutover smoke, picker JS and board HTML. The
  Atanasyan manifest/catalog additions merge independently of the five START
  additions; authored tasks and mathematical models do not conflict.
- Resolution preserves all existing authorizations and the exact Atanasyan
  alias, keyboard protection and cabinet/container assertions. Registry tests
  now require exactly 43 catalog entries and 14 mirrors; synthetic addition
  and removal require 15 and 13 mirrors. No exact-list assertion is relaxed.
- The picker script and its catalog request share the fresh cache suffix
  `20261024-board-integrations`. Application behavior, the original task scope
  and the final native-dialog readiness fix remain intact.
- On that initial baseline, focused validation passed 129/129 tests: added START and existing
  task-3/task-8 adapter/model/picker suites, Atanasyan adapter/picker/manual
  learning contracts, and exact registry plus real server/container-equivalent
  integration. JavaScript and board inline-script syntax, conflict-marker
  absence and `git diff --check` also passed. No test assertion was weakened.
- Applicable fresh-base units, registry/container integration, existing
  task-3/task-8 and Atanasyan browser regressions, and the complete added-five
  browser gate must pass on the resolved tree. PR #313 composition is verified
  separately. Final results and the published head/tree belong in the PR body;
  earlier-head checks are not represented as approval of this resolution.
- Production accounts/lessons, physical devices, merge and deployment remain
  outside this continuation's authorization and evidence.

- Executed browser gates on the initial baseline passed: all five START wrappers and 22
  topic families, existing task 3/task 8, and Atanasyan classic/managed flows
  including keyboard revoke and manual save. The paired runtime additionally
  passed all 150 focused tests plus writing, picker and those four browser
  gates. Local Chromium 151.0.7922.34 used only synthetic isolated data.
- Independent focused resolution review passed; this task retains exactly its
  original 31-file scope. All authored START runtime bytes and both existing
  browser readiness corrections match the preceding reviewed head. No local
  test failed during this reconciliation. Final exact-head GitHub CI is assessed
  after branch publication and recorded in the PR; older CI is not reused.

## Second base movement before publication — 2026-10-24

- Before any branch ref update, remote main advanced to
  `07189de58b7f5d60c02ea6ca6aa9450a324a377f`. The two new commits are
  `52cb1c1a5c731acd660139328f0001ccfa33a08b` (merged PR #315, Vilenkin 6
  cloud cabinets) and `07189de58b7f5d60c02ea6ca6aa9450a324a377f` (merged
  PR #319, Makarychev 8 course). The repeated composition is clean and remains
  within the already authorized bounded branch reconciliation. It does not
  authorize merging either pending PR into main or deploying it.
- The resulting delta against this current base still has exactly the original
  31 task files. New-main Vilenkin and Makarychev content, cabinet behavior and
  unrelated records are preserved. No additional runtime fix was necessary.
- Registry integration retains both course-contract copies, the exact 378
  cabinet entries, the original 244-entry bank, all 27 Vilenkin modules,
  grade-6 count 39 and grade-7 counts 62/63. Only the intended mirror count/list
  assertions differ from new main. The expressions browser retains new main's
  two guided-readiness lines together with this task's 13 stronger readiness
  and source-acceptance assertions.
- Earlier 202d39b-based test results above are historical evidence. New-base
  server, Vilenkin, focused and browser results are recorded separately; no
  earlier result is relabelled as a run against the later base.
- Full server regression passed 309/309 tests on this base. The Vilenkin cloud
  workflow commands passed: 11 learning tests (included in the server total),
  course/schema checks for 27 lessons and 475 tasks, 108 standalone and 108
  managed DOM views, five bridge tests and eight cabinet DOM tests. Rebuilding
  the offline course preserved its exact bytes. These DOM tests are not a
  physical-device or browser-visual validation claim.

## Required handoff

```text
EXECUTIVE STATUS

Task:
PR:
Base:
Head:
Gate:
Tests:
Failures:
Not run:
Scope deviations:
Recommendation:
Next user decision:
```

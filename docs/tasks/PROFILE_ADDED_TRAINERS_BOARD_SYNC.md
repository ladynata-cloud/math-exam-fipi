# Added START trainers: shared board sessions

## Identity

- Task: `PROFILE_ADDED_TRAINERS_BOARD_SYNC`
- Owner: repository owner
- Date: 2026-10-24 (Asia/Novosibirsk)
- Base branch: `main`
- Base SHA: `1f9d8aec82bd2909917ab22746d94571d87c59c4`
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
- Actual base SHA: `1f9d8aec82bd2909917ab22746d94571d87c59c4`
- Actual head SHA / PR: to be recorded in the Draft PR without a self-referential
  commit.
- Gate: `PROFILE_ADDED_TRAINERS_BOARD_SYNC_OK`.
- Passed focused tests: added adapter 14/14, new semantic models 7/7, new picker
  21/21; existing task-3/task-8 adapters 14/14, stereometry models 6/6 and their
  pickers 14/14; registry unit 25/25 and live integration 7/7. These are 108
  focused test cases, plus the applicable geometry, planimetry, vector,
  probability, equations, algebra and independent-model regression suites.
- Passed browsers: full five-wrapper/22-topic local teacher/pupil journey and
  the unchanged stereometry and expressions journeys, run sequentially. The
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
- The companion board-writing implementation is prepared in Draft PR #313;
  it is not merged or published by this task.
- Scope deviations: none.

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

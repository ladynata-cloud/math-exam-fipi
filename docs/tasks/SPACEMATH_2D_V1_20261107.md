# SpaceMath: mirrored 2D constructions in the lesson and cabinet

## Identity

- Task: SPACEMATH_2D_V1_20261107
- Owner: MathExam repository owner
- Date: 2026-11-07 (Asia/Novosibirsk)
- Base branch: main
- Base SHA: d435af8a6be1823210901d4e4dc13a44f65591a0
- Planned branch: feat/spacemath-geometry-v1
- Review level: NEW_ARCHETYPE
- Related ADR: [SpaceMath construction documents](../adr/0013-spacemath-constructions.md)
- ADR status: Proposed; the owner's explicit START fixes the scoped product
  direction. Acceptance of the new archetype is required before rollout.

## Goal

Create editable dynamic 2D constructions during a MathExam lesson. Teacher and
pupil see the same geometry, explicitly transfer control, and reopen the saved
construction from the lesson or cabinet. This implementation uses the owner's proposed name **SpaceMath**;
the explanatory label is **Совместные построения**.

## Context and evidence

- The verified clean checkout and authoritative remote main agree on the base
  above. It includes PR #478 and its persistent lesson material queue.
- `trainers/board-bridge.js` supports explicit state adapters. The authenticated
  cabinet uses `trainers/learning-bridge.js`, isolated trainer frames, and durable
  SQLite attempts/events under accepted ADR 0010. Those are separate transports.
- The anonymous board's room state is volatile. It is not a durable cabinet
  document and does not establish persistence after server restart.
- `trainers/jsxgraph-midpoint.html` is an existing small JSXGraph example using
  external CDN resources, not a mirrored free construction editor.
- JSXGraph 1.14.3 is vendored from its official npm distribution with verified
  package integrity and the MIT license. Its assets load from this repository.
- ADR 0001 remains Proposed. No architectural acceptance is inferred from it.

## Approved scope

### In scope

- A calm responsive SpaceMath editor with local JSXGraph resources, free points,
  segments/lines/rays/circles/polygons, midpoints, intersections, parallel and
  perpendicular constructions, angle bisectors, measurements, undo/redo and
  safe editable model import/export.
- A strict versioned declarative model; only free-point coordinates are stored.
  Dependencies are topologically ordered and degenerate constructions remain
  explicitly undefined until their inputs become valid again.
- Existing authenticated teacher/pupil control, conflict handling, state saves,
  history and restoration; a cabinet list for private teacher and pupil models.
- Add a blank or saved construction to the existing lesson material queue;
  return to the same saved work. Copying a SpaceMath model explicitly uses its
  current state, without changing the initial-condition semantics of exercises.
- Public board adapter and entry. Persistent account saves remain clearly
  distinguished from an anonymous room and a standalone browser draft.
- Mathematical, authority, persistence, browser-pair and responsive checks,
  dependency provenance, task documentation and a complete Draft PR.

### Out of scope

- General 3D/CAS/function editor, GeoGebra file compatibility, AI-generated
  executable commands, changes to existing exercise mathematics or grading.
- New accounts or changes to real pupil programs, records or credentials.
- Merge, auto-merge, deployment or production database changes in this task.

## Acceptance criteria

- [x] New constructions can be created by mouse/touch and accessible controls.
- [x] A moved triangle retains correct midpoint/parallel/perpendicular relations.
- [x] Intersections and measurements handle tangencies and degeneracies honestly.
- [x] Teacher and pupil independently load the same saved model; only the current
  controller can mutate it. Remote hydration does not echo a new local edit.
- [x] Reopening after switching materials, reloading or restarting storage keeps
  the committed model. Failed/stale saves cannot overwrite newer work.
- [x] Private teacher models and other pupils' documents remain inaccessible;
  origin/CSRF, actor identity and idempotency remain enforced.
- [x] Free geometry cannot manufacture a completed exercise, score or reward.
- [x] The editor works with external requests blocked; no runtime CDN is needed.
- [x] At 320x900 and 1280x900 the canvas and primary actions are usable.
- [x] Existing cabinet, lesson and board regression gates remain passing.

## Checks and gates

- Required tests: independent numerical invariants, strict schema and malicious
  payloads, SQLite restart/ownership/copy/idempotency/control, real two-role
  browser creation/drag/control/late join/restore, no external asset requests.
- Required static checks: syntax, source/registry integrity where changed,
  vendored checksums, repository diff and `git diff --check`.
- Manual checks: screenshots at desktop/mobile widths and editor workflow.
- Final gate marker: SPACEMATH_2D_V1_READY (only after the required local gates).
- Checks intentionally not run: external provider audit and real pupil pilot;
  no production release is authorized by this task's current instructions.

## Review plan

- Review-level rationale: a free construction document is a new trainer pattern
  with durable data. Existing account, transport and permission architecture is
  reused, but its new mathematical/state contract requires independent review.
- Trainer design consultation: internal review of learning action, mathematical
  dependencies, compact UI, feedback for undefined geometry and input alternatives.
- Ready-result review: separate independent code/permission review and numerical
  checks, plus actual browser evidence. Automated users are not a real pupil trial.
- External provider review: not requested and not performed; optional under
  the standing policy. No provider approval is claimed.
- Handoffs contain scoped source and synthetic fixtures only, no private pupil
  data, credentials or machine-specific absolute paths.

## Risk and rollback

- Main risks: invalid geometric dependencies, event feedback loops, stale saves,
  unintended grade accounting, missing local assets or cramped mobile controls.
- Rollback: revert the feature commits through the normal review workflow. Keep
  saved `spacemath` rows and events; never delete records to roll back the UI.
  Reopening them requires a compatible v1 model/contract. No schema migration is
  required when using existing attempts; ordinary backups still include models.
- Data compatibility: model version 1 is validated at both client and server;
  unknown versions fail closed. No executable expressions or markup are stored.

## Permissions

- Explicit START granted in this task conversation: yes.
- Branch, scoped edits, local gates, commits, push and Draft PR: yes.
- Merge, auto-merge and deployment: no. The user's current repository rules and
  request to open a Draft PR are narrower than the committed standing policy.

## Execution record

- Actual branch: feat/spacemath-geometry-v1
- Actual base SHA: d435af8a6be1823210901d4e4dc13a44f65591a0
- Actual head SHA / PR: recorded in the PR handoff after publication.
- Tests passed / failed / not run: recorded in [the validation report](../reports/SPACEMATH_2D_V1_20261107.md).
- Scope deviations: none planned.

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

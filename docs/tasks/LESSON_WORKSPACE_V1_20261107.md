# Lesson workspace: preparation, pupil entry and lesson materials

## Identity

- Task: `LESSON_WORKSPACE_V1_20261107`
- Owner: MathExam owner
- Date: 2026-11-07 (Asia/Novosibirsk)
- Base branch: `main`
- Base SHA: `25548b86df75b8c90a5dc5c6f1f1925c2ad70636`
- Planned branch: `feat/lesson-workspace-20261107`
- Review level: `HIGH`
- Related architecture: accepted ADR 0010 (account lessons, private attempts,
  exact task identity, ownership and durable SQLite actions). Existing mirror
  board contracts are established by source and gates; ADR 0001 is Proposed.

## Goal

Give the teacher one clear workflow for preparing a selected exercise privately,
starting a lesson with the intended pupil, and switching through a short lesson
selection without losing the previous exercise or its writing. Reuse the current
cabinet, lesson, trainer and board boundaries.

## Context and evidence

- The owner approved the preceding three-part first delivery with the explicit
  instruction to proceed, "хорошо, давай переделаем". This starts this task;
  the later homework/AI/template packages in the proposal are separate work.
- The verified base includes merged PR 475 and PR 476. The current status file
  contains historical preparation wording for those already merged changes.
  Their source is preserved; merge status alone is not a fresh deployment test.
- `learning/app.js` provides pupil previews and durable managed lessons. The
  main teacher preview is read-only; opening managed content currently opens
  assignment selection instead of a private teacher attempt.
- `LearningTrainerFrame` isolates credential-free trainer frames on a separate
  origin. Managed exercises and public mirror courses have different existing
  transport and persistence contracts; no universal compatibility is assumed.
- Managed lessons already support explicit control transfer and authored
  drawing. This task reuses those capabilities. The public mirror board keeps
  its separate room/token and course-launch workflow.
- Open PR 474 contains independent sections-course and host work. Its unpublished
  scope is not copied or changed by this task.

## Approved scope

### In scope

- A private teacher preparation entry from a selected supported exercise, with
  no modification of pupil attempts, outcomes, hints, assignments or progress.
- A clear lesson entry in the pupil card and a corresponding pupil join entry,
  preserving the selected exercise and the intended pupil context.
- A bounded selection of materials for one lesson, with explicit navigation
  and restoration of each supported material's current task and work.
- Reuse existing account/session authorization, trainer allowlists, exact-origin
  message validation and explicit teacher/pupil control transfer.
- Clear connection/save states and explicit handling of unsupported materials.
- Responsive cabinet/lesson controls at 320 and 1280 px; short primary actions
  and details disclosed on demand.
- Required regression, isolation and real two-role browser evidence; a complete
  Draft PR and an accurate task/status record.

### Concrete contract

- The lesson selection covers the existing managed catalogue: `ege-path`,
  `oge-basics`, `oge-public`, `vilenkin6-textbook`, `vilenkin6-part1`,
  `atanasyan-7-9` and `motion-grade6`. A public course outside that catalogue
  continues through its existing public-practice/board entry.
- At most 12 materials per pupil seat. The database stores their existing
  attempt IDs in `seats_json`; navigation never copies a saved solution.
  The existing common presentation board keeps its prior behavior.
- Teacher preparation reads an exact source condition and its initial state
  through the authenticated, CSRF-protected `/teacher/rehearsal` endpoint.
  It creates no durable attempt/event/assignment. Up to 12 private copies and
  their writing stay only in the current teacher's document memory and clear
  on account change/reload. This is stated in the interface.
- Only explicit lesson start creates pupil attempts for selected descriptors.
  Exact source conditions and generated seeds survive that handoff; private
  rehearsal answers and ink are never transferred to the pupil.
- Lost acknowledgements reuse the same request receipt on retry. Lesson forms
  pause polling remounts, stale lesson versions cannot reverse a selection,
  and older embedded attempt snapshots cannot replace confirmed work.

### Out of scope

- Automatic homework generation, photo recognition, AI calls, new lesson
  content, parent messaging, teacher-private notebook and reusable templates.
- Creating or modifying real pupil accounts, passwords, programs or results.
- Replacing the current authentication system, public trainer protocol or
  independent-work assessment rules; claiming all public courses are managed.
- Merge, auto-merge and deployment under the narrower current-session owner
  instructions.

## Acceptance criteria

- [ ] Teacher preparation uses the exact selected condition and leaves all
  pupil work and learning attribution unchanged.
- [ ] The intended pupil can enter the lesson from its cabinet; another pupil
  and a parent cannot access or alter that lesson's private work.
- [ ] Late join and reload retain the selected task, and explicit handoff works
  in both directions without granting an observer write authority.
- [ ] Moving between at least two supported exercises and back retains their
  conditions, answers, steps and applicable writing.
- [ ] Preparation/selection does not silently count as independent pupil work.
- [ ] Failed saves, disconnected rooms and stale responses are explicit and
  cannot overwrite newer work or another pupil's context.
- [ ] The task UI is usable at 320 and 1280 px and preserves current course
  navigation, homework and existing individual/group lessons.

## Checks and gates

- Required tests: backend ownership, exact task/private practice, queue identity,
  idempotency and conflict checks; client state/DOM checks; real teacher/pupil
  journey with reload, handoff and task switching; affected board/cabinet gates.
- Required static checks: JavaScript syntax, source/scope inspection, credential
  and private-data handoff inspection, `git diff --check`.
- Manual checks: inspect narrow and desktop captures from the browser gate.
- Final gate marker: `LESSON_WORKSPACE_V1_OK` after all required checks pass.
- Local environment note: the preceding exploration could not launch Chromium
  because socket creation was denied. CI browser evidence is required if the
  same restriction persists; DOM checks do not substitute for that evidence.

## Review plan

- HIGH because this connects private teacher preparation, account lessons and
  shared runtime state. Independent technical review covers ownership, pupil
  result isolation, late callbacks, persistence and control.
- Learning-design review: keep the condition and work visible, reuse existing
  exercise mathematics, distinguish observation/joint work/independent outcomes.
- Trainer design consultation: no new mathematical trainer is planned. Review
  the changed teaching workflow and ready result internally.
- External provider review: not performed; optional under the standing owner
  policy. Internal review is never represented as external-provider approval.
- Handoffs contain scoped public source and synthetic fixtures only; no secrets,
  pupil data, account invitations or machine-specific paths.

## Risk and rollback

- Risks: pupil progress contamination during preparation, leaking a lesson to
  another account, loss of a selected exercise on handoff/reload, stale writes,
  and regression of existing board/course entry.
- Rollback: ordinary scoped revert of the feature and its entry points. Preserve
  existing accounts, assignments, attempts, lesson history and stored work;
  never replace the production database with an earlier copy.
- Any additive persisted metadata must remain readable or safely ignorable by
  the previous feature state. Record final storage details with implementation.
- Storage change: a bounded `materialIds` array inside an existing lesson seat.
  No SQL schema change. Previous code can still use the seat's `attemptId`;
  returning to this version reconstructs a legacy seat and preserves current
  work. An ordinary rollback must not delete attempts or lesson records.

## Permissions

- Task start: yes, the owner's direct instruction to execute the approved first
  package in the current conversation.
- Branch, implementation, local commits, push and Draft PR: allowed.
- The owner supplied repository rules directly in this conversation that require
  separate explicit merge authorization and prohibit automatic non-fast-forward
  repair after drift. These narrower current-task rules take precedence over
  the repository's standing release document.
- Merge, auto-merge and deployment: not authorized for this task.
- No force, reset, rebase, admin override, TLS bypass or gate weakening.

## Execution record

- Actual branch: `feat/lesson-workspace-20261107`
- Actual base SHA: `25548b86df75b8c90a5dc5c6f1f1925c2ad70636`
- Actual head SHA: recorded with the exact candidate in the Draft PR handoff
- PR: [Draft PR 478](https://github.com/ladynata-cloud/math-exam-fipi/pull/478)
- Commits: implementation and validation of this one task
- Tests passed: all 410 backend tests; 26 DOM checks (9 actual cabinet,
  7 picker/queue, 10 rehearsal); targeted Vilenkin cabinet regressions;
  JavaScript syntax and `git diff --check`.
- Tests failed: none in the current local test set.
- Independent technical review: confirmed and fixed private internal-navigation
  rejection, lost-acknowledgement lesson-form retry, and temporary identity-check
  lock during asynchronous preparation. Each has a passing regression.
  The duplicate authored-LCM tools panel is also fixed and reviewed; standalone
  LCM behavior is retained. Monotonic lesson/attempt state has actual cabinet
  regressions.
- Tests not run locally: real Chromium gates because the local browser cannot
  create required sockets. The dedicated CI runs the new two-role journey and
  existing classroom/course-navigation gates before printing the final marker.
- Final CI result, exact candidate SHA, screenshots and gate marker are recorded
  in the PR handoff so documentation does not require a recursive status commit.
- Deployment: not performed; separate owner authorization is required.
- Scope deviations: none

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

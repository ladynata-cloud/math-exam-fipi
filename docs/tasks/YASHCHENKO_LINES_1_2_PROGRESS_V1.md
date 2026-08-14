# Yashchenko lines 1-2 trainer and progress panel v1

## Identity

- Task: publish the supplied 72-task Yashchenko lines 1-2 trainer with durable
  learner progress and a teacher panel.
- Owner: MathExam repository owner.
- Date: 2026-08-14.
- Base branch: `main`.
- Base SHA: `9833d8971c1ab291ba477967d47a2d2904a5f818`.
- Planned branch: `agent/yashchenko-lines-1-2-progress`.
- Review level: `HIGH`.
- Related task: [Progress Workspaces API v1](PROGRESS_WORKSPACES_API_V1.md).
- Related ADR: [Trainer Bridge Platform ADR 0001](../adr/0001-trainer-bridge-platform.md).
- ADR status: `Proposed`; the merged Progress Workspaces API task and this
  explicit owner-approved scope fix the bounded client integration decisions.

## Goal

Publish the supplied single-file trainer in the profile EGE discovery surfaces,
preserve its 72 tasks and existing learning mechanics, and add a small teacher
workflow for personal learner links and durable cross-device progress using the
already deployed Progress Workspaces API.

## Context and evidence

- Production `main` is the exact base above and contains the merged Progress
  Workspaces API from PR `#98`.
- The board service is running with persistent `/data` and
  `PROGRESS_PERSISTENCE_CONFIRMED=1` after an owner-authorized deployment.
- The owner-supplied source is titled `Задания 1 и 2 · 36 вариантов Ященко —
  Mathexam.space`, is 262006 bytes, and has source SHA-256
  `00f9d8cc717a2690fbe9c4416170ae734c4bfab5d2978f7e037867d740b5284c`.
- The source contains 72 fixed tasks: 36 for line 1 and 36 for line 2. Its
  local progress uses `mathExamCourseProgress.v1`, topic ID `yashchenko-t12`,
  task states `clean`, `helped`, and `seen`, plus timed-check runs, best score,
  and pass state.
- The source is a self-contained HTML file. It does not fetch data or scripts;
  its only navigation reference is the course backlink, which must be adjusted
  for the approved nested path.
- The automated Trainer Inventory implementation is not present on production
  `main` because its separate Draft PR `#92` is unmerged. The read-only intake
  checks for this one exact owner-provided file are therefore recorded
  manually; no inventory final marker may be claimed.
- The existing progress API accepts only bearer headers, stores only hashes of
  high-entropy codes, computes the required summaries, and supports one-time
  student-code transfer in a URL fragment that the client removes immediately.

## Approved scope

### In scope

- Publish the supplied trainer at
  `/trainers/ege-profile/yashchenko-lines-1-2.html`.
- Preserve the task corpus, answers, hints, explanations, figures, tabs,
  practice flows, timed check, reference map, and local standalone progress.
- Add assignment-isolated local progress with attempts, errors, and hints, plus
  debounced/retried synchronization with Progress Workspaces API schema v1.
- Hydrate and monotonically merge server progress before synchronizing local
  changes; retain local progress when the network is unavailable.
- Add a teacher panel at
  `/trainers/ege-profile/yashchenko-lines-1-2-teacher.html`.
- Let the teacher create a workspace, save or enter its teacher code separately,
  create a named assignment, copy a personal student link, refresh/poll learner
  summaries, and use the panel from another device by entering the saved code.
- Put only non-secret `workspaceId` in the teacher panel query string. Never
  accept a teacher code from query or fragment.
- Put the one-time student code only in the personal link fragment, store it
  under the assignment ID, and immediately remove the fragment from browser
  history before the first API request.
- Opt in `yashchenko-t12` in the current runtime registry with
  `supportsProgressTracking:true`, `progressSchemaVersion:1`, iframe-only board
  discovery, and no Board mirror authority.
- Add one profile-EGE site card and one sitemap entry for the canonical trainer.
- Add focused deterministic static/content/integration contract checks and
  perform local desktop/mobile/browser smoke.
- Update the operational status within this task.

### Out of scope

- Rewriting, correcting, replacing, or regenerating the 72 supplied tasks.
- Changes to Progress Workspaces API, board core, Bridge, Socket.IO, server
  authorization, persistent-store format, or deployment topology.
- User accounts, email, passwords, payments, analytics, CRM, or a general class
  management system.
- Putting teacher credentials in a public URL or storing raw credentials on the
  server.
- Board semantic mirror behavior.
- Merging or deploying before a separate exact-head owner authorization.

### Files or areas that must not change

- `board-server` production code, deployment configuration, Docker files, and
  environment settings. Focused registry/progress test expectations may change
  only to account for this one new manifest entry.
- Existing trainer files and public URLs.
- Existing registry entries other than the one appended block for this trainer.
- Existing catalog and sitemap entries other than one attributable insertion
  for this trainer.

## Publication surfaces

- `FILE_PUBLISHED`: `true` after production HTTP verification.
- `SITE_DISCOVERY`: `true` for the homepage profile-EGE trainer card and sitemap.
- `BOARD_DISCOVERY`: `true` through current `opens-in-board` registry mode.
- `BOARD_MIRROR`: `false`.
- Canonical trainer URL:
  `https://mathexam.space/trainers/ege-profile/yashchenko-lines-1-2.html`.
- Teacher panel URL:
  `https://mathexam.space/trainers/ege-profile/yashchenko-lines-1-2-teacher.html`.
- Batch membership: one trainer only.

## Acceptance criteria

- [ ] The published trainer contains exactly 72 unique tasks, 36 on each line,
  and the deterministic task-corpus hash matches the owner-supplied source.
- [ ] Standalone use preserves the existing `yashchenko-t12` local progress and
  all existing learning flows without requiring a server assignment.
- [ ] Personal-assignment use isolates progress by assignment ID and survives
  reload when offline.
- [ ] Attempt, error, and hint counters are cumulative; `clean`, `helped`, and
  `seen` achievement state remains monotonic.
- [ ] A learner link hydrates compatible server state, merges it with local
  state, synchronizes through bearer headers, and never sends a code in the
  request URL.
- [ ] Missing, malformed, wrong-role, or incompatible assignment credentials
  fail closed and do not report a successful cloud save.
- [ ] The student fragment is removed with `history.replaceState` before the
  first network request.
- [ ] A teacher can create a workspace and an assignment, copy a working
  personal learner link, and see label, started/solved, independent/helped/seen,
  attempts/errors/hints, line 1/2 progress, best/pass, revision, and last
  activity.
- [ ] The teacher panel accepts its code only from explicit local storage or a
  teacher-entered field; query and fragment credentials are ignored and
  rejected by the client.
- [ ] The teacher panel can be opened on another device with the non-secret
  workspace URL and separately entered teacher code.
- [ ] Registry validation authorizes progress for exactly `yashchenko-t12` and
  grants no mirror capability.
- [ ] The homepage card, canonical URL, registry entry, and sitemap reference
  occur exactly once and no existing URL changes.
- [ ] Desktop, mobile, standalone, teacher, and student-link browser smokes have
  zero unexpected console errors and page errors.
- [ ] Production smoke verifies the canonical trainer, teacher panel, board
  registry capability, workspace/assignment creation, learner write, teacher
  read, and persistence across a service restart if a restart is authorized.

## Checks and gates

- Required tests:
  - focused trainer publication/progress contract test;
  - `npm test` in `board-server/`;
  - registry validation and exact task-corpus checks.
- Required static checks:
  - HTML parse/structure and unique task-ID checks;
  - source/candidate task-corpus hash parity;
  - no query/fragment teacher-token path and no URL bearer usage;
  - exact discovery/registry/sitemap counts;
  - secret, local-path, control/bidi, external-origin, and dependency scans;
  - `git diff --check` and exact changed-file review.
- Manual checks:
  - standalone correct, incorrect, hint, full-solution, next, reload, and timed
    check flows;
  - teacher workspace/assignment/link/list flow;
  - student fragment removal, hydrate, update, reload, and offline recovery;
  - 360x800, 390x844, 768x1024, and 1440x900 layouts.
- Authoring check marker:
  `YASHCHENKO_LINES_1_2_PROGRESS_V1_AUTHORING_CHECK_OK`.
- Final release marker: `YASHCHENKO_LINES_1_2_PROGRESS_V1_RELEASE_GATE_OK`,
  emitted only after the authoring check, full server regression, exact-head
  review/waiver, production HTTP/API smoke, and production browser/visual smoke
  all pass. The authoring script must never emit the release marker.
- Checks intentionally not run and why: the Trainer Inventory v1 full gate is
  unavailable on `main`; production checks wait for separate merge/deployment
  authorization.

## Review plan

- Review-level rationale: the client handles bearer credentials and durable
  learner progress even though it does not change server authorization or data
  format.
- External review required: yes, exact-head security/code review unless the
  owner separately waives it with rationale for the current PR and head.
- Sanitized handoff constraints: include only public repository source,
  synthetic labels/codes, task counts/hashes, exact base/head/diff, and tests;
  exclude real student names, live codes, production data, and machine paths.
- Required provenance if external review is used: provider, PR, base SHA, head
  SHA, verdict, and verifiable source or timestamp.

## Risk and rollback

- Main risks: credential leakage, progress assigned to the wrong learner,
  misleading sync status, local/server state regression, discovery collision,
  task-corpus drift, and mobile overflow.
- Rollback plan: revert the trainer, teacher panel, single registry block,
  homepage card, sitemap entry, focused tests, and this task documentation as
  one normal reviewed PR. Preserve `/data/progress.json`; do not delete learner
  data. Do not reuse the canonical URL for different content.
- Data or compatibility considerations: server merge is monotonic and schema v1
  remains unchanged. Standalone legacy progress remains under its existing
  topic ID. Assignment-local state uses an assignment-qualified namespace so
  one learner link cannot upload another learner's browser state.

## Permissions

- `START` granted by owner in the current task conversation: yes; the explicit
  imperative publication request authorizes implementation, checks, push, and a
  Draft PR for this independent trainer task.
- Branch creation allowed: yes.
- Local commits allowed: yes.
- Push allowed: yes.
- Draft PR allowed: yes.
- Merge allowed: **no unless separately authorized for this PR and exact head**.
- Auto-merge allowed: **no unless separately authorized**.
- Deployment allowed: **no unless separately authorized for this trainer PR**.

## Execution record

- Actual branch: `agent/yashchenko-lines-1-2-progress`.
- Actual base SHA: `9833d8971c1ab291ba477967d47a2d2904a5f818`.
- Actual head SHA: recorded in the Draft PR and handoff because a commit cannot
  contain its own SHA.
- PR: pending.
- Commits: one implementation commit planned.
- Tests passed: focused authoring check; 41/41 board-server tests; direct local API
  smoke for workspace, assignment, learner write, teacher read, summaries, and
  raw-code absence.
- Tests failed: none in the final runs. Four registry snapshot expectations
  failed on the first regression run and were updated for the intentional new
  manifest entry; the complete rerun passed.
- Tests not run: Trainer Inventory v1 full gate (tool absent from `main`);
  browser/visual smoke (localhost blocked by in-app browser URL policy);
  production smoke (requires separate merge/deployment authorization).
- Final release gate: pending the two not-run release smokes above.
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

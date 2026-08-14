# Progress Workspaces API v1

## Identity

- Task: add durable teacher workspaces and learner-progress assignments to the
  existing board server.
- Owner: repository owner.
- Date: 2026-08-14.
- Base branch: `main`.
- Base SHA: `c1217cda05725b0ba8bfde327c76281d7917853f`.
- Planned branch: `agent/progress-workspaces-api`.
- Review level: `HIGH`.
- Related ADR: [Trainer Bridge Platform ADR 0001](../adr/0001-trainer-bridge-platform.md).
- ADR status: `Proposed`; this task is authorized by its explicit scope and does
  not treat the ADR as accepted.

## Goal

Provide a durable, fail-closed server contract that lets a teacher create a
workspace, issue one personal assignment per learner, and read progress from a
different device. Reuse the existing `board-server` deployment and trainer
registry, while keeping teacher secrets out of public teacher-panel URLs and
storing only hashes of high-entropy access codes.

## Context and evidence

- Authoritative GitHub `main` and the clean local base were verified at the
  exact base SHA above.
- The board server already uses separate high-entropy teacher and student room
  tokens and same-origin/CORS controls, but rooms are intentionally in memory
  and expire.
- The current runtime registry validates every published board-discoverable
  trainer and fails closed when its source is missing or invalid.
- The supplied trainer is a standalone single-file trainer with 72 fixed tasks,
  a shared progress container, and `clean`, `helped`, and `seen` task states.
- Publishing or adapting that trainer is not part of this platform task. The
  Trainer Factory boundary requires a later independent publication task after
  this server contract is accepted and merged.

## Approved scope

### In scope

- Add a versioned, atomic file-backed progress store to `board-server`.
- Add teacher workspace and learner assignment REST endpoints under
  `/api/progress/`.
- Generate independent teacher and learner access codes, return each code only
  at creation, hash codes before persistence, and authenticate only through an
  `Authorization: Bearer` header.
- Keep the teacher-panel URL identity limited to a non-secret workspace ID;
  teacher access codes must never be accepted from query parameters or URL
  fragments.
- Accept strict, bounded progress snapshots containing task state, attempts,
  errors, hints, line number, timed-check runs, best score, and pass state.
- Merge counters and achievement state monotonically so retries, reloads, and
  delayed duplicate snapshots cannot erase stronger prior progress.
- Return a server-computed summary for started, solved, independent, helped,
  seen, attempts, errors, hints, separate line 1/2 totals, best score, pass
  state, revision, and last activity.
- Extend the existing registry validation with an opt-in progress capability;
  unregistered trainers remain rejected by the progress API.
- Expose only safe readiness and authorized-trainer counts in `/health`.
- Configure the Docker deployment to use `/data/progress.json` and document the
  required persistent volume, explicit `PROGRESS_PERSISTENCE_CONFIRMED=1`
  deployment guard, and restart verification.
- Add focused unit, integration, registry, security, persistence, restart, and
  fail-closed tests.

### Out of scope

- Publishing, copying, or editing the supplied 72-task trainer.
- A teacher-panel HTML page or learner-side sync adapter.
- Changing the board room, Socket.IO, drawing, control, or Bridge protocols.
- User accounts, passwords, email, billing, groups, CRM, or personal profiles.
- Arbitrary trainer opt-in, token-bearing teacher URLs, query-string secrets,
  analytics, or third-party databases.
- Merge, auto-merge, deployment, or production data migration.

### Files or areas that must not change

- Existing trainer HTML and pedagogical content.
- Existing public trainer URLs.
- Existing room and board event names and authorization behavior.
- Static-site discovery and sitemap files.

## Acceptance criteria

- [ ] Store initialization creates or loads schema v1 atomically and survives a
  process restart with the same configured file.
- [ ] Missing confirmation, missing path, unreadable, invalid, or unwritable
  storage disables all progress endpoints with `503`; no in-memory success
  fallback exists.
- [ ] Workspace creation returns a non-secret workspace ID and a teacher code
  once; persisted bytes contain neither raw teacher nor learner codes.
- [ ] Assignment creation requires the teacher bearer code and a registry entry
  explicitly enabled for progress tracking.
- [ ] Teacher list/read and learner read/write permissions are separated and
  wrong-role, missing, malformed, or query-string codes fail closed.
- [ ] Learner snapshots are closed, bounded, trainer-bound, and reject unknown
  fields, invalid task IDs, impossible counters, unsupported schema versions,
  and payloads over the configured limits.
- [ ] Monotonic merge preserves the strongest task state, maximum counters,
  best score, pass state, and existing tasks across duplicate or stale writes.
- [ ] Teacher summaries contain all metrics required by the later panel and no
  secret hashes or raw access codes.
- [ ] Existing room, board, registry endpoint, registry digest, and Socket.IO
  tests remain unchanged in behavior.
- [ ] Docker configuration and documentation require a persistent `/data`
  volume, do not auto-confirm it, and include a restart persistence smoke before
  `PROGRESS_PERSISTENCE_CONFIRMED=1` is enabled.
- [ ] No logs, health responses, errors, persisted public fields, or test
  fixtures expose access codes.

## Checks and gates

- Required tests:
  - `node --test board-server/test/progress-store.test.js`
  - `npm test` in `board-server/`
  - focused HTTP integration for create/list/read/write, wrong-role rejection,
    registry authorization, restart persistence, and unavailable-store `503`.
- Required static checks:
  - inline secret and URL-token scan;
  - persisted-file raw-token scan;
  - JSON parse and schema/version checks;
  - `git diff --check`;
  - exact changed-file review.
- Manual checks:
  - create a workspace and assignment against a local server;
  - restart the server with the same store path and read the same progress;
  - confirm no teacher access code appears in the browser/server URL.
- Final gate marker: `PROGRESS_WORKSPACES_API_V1_GATE_OK`.
- Checks intentionally not run and why: production deployment smoke belongs to
  the separately authorized release workflow.

## Review plan

- Review-level rationale: this task changes authorization, persistent learner
  data, server endpoints, registry capability checks, and deployment storage.
- External review required: yes, exact-head independent security and code
  review before merge unless the owner explicitly waives it with rationale.
- Sanitized handoff constraints: include only public source, schemas, tests,
  exact base/head/diff identity, and synthetic labels/data; exclude access
  codes, real learner names, machine paths, and production data.
- Required provenance if external review is used: provider, PR, base SHA, head
  SHA, verdict, and verifiable source or timestamp.

## Risk and rollback

- Main risks: unauthorized reads, secret leakage, partial writes, corrupted
  storage, stale-client regression, disk exhaustion, and false success when a
  persistent volume is absent.
- Rollback plan: revert the server/API/registry-capability task as one reviewed
  unit. Preserve the progress file offline; rollback must not delete learner
  data. Existing room and board functionality remains operational when the
  progress store is disabled.
- Data or compatibility considerations: schema v1 is append/merge oriented;
  no destructive reset or migration endpoint is included. Existing registry
  entries default to progress disabled, so deployment before the later trainer
  publication is inert.

## Permissions

- `START` granted by owner in the current task conversation: yes; the current
  imperative request explicitly authorizes implementation, checks, push, and a
  PR for the requested outcome.
- Branch creation allowed: yes.
- Local commits allowed: yes.
- Push allowed: yes.
- Draft PR allowed: yes.
- Merge allowed: **no unless separately authorized after review**.
- Auto-merge allowed: **no unless separately authorized**.
- Deployment allowed: **no unless separately authorized**.

## Execution record

- Actual branch: `agent/progress-workspaces-api`.
- Actual base SHA: `c1217cda05725b0ba8bfde327c76281d7917853f`.
- Actual head SHA: pending.
- PR: pending.
- Commits: pending.
- Tests passed: pending.
- Tests failed: pending.
- Tests not run: production deployment smoke pending separate authorization.
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

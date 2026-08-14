# Algebra 7 control-work progress publication

## Identity

- Task: publish the supplied Algebra 7 control-work trainer with durable student progress
- Owner: ladynata-cloud
- Date: 2026-08-14
- Base branch: `main`
- Base SHA: `217e33fd213d3adff765ae7ee460e60e2106fc68`
- Planned branch: `agent/algebra7-progress`
- Review level: `HIGH`
- Related issue or ADR: Progress Workspaces API v1 as implemented in code and tests
- ADR status, if applicable: none accepted; ADR 0001 remains Proposed and advisory

## Goal

Publish the supplied four-topic Algebra 7 trainer on Mathexam.space without
changing its generated exercises or guided learning mechanics, and connect it
to the existing server-side Progress Workspaces API so a teacher can issue a
personal link and review durable student progress from another device.

## Context and evidence

- Production `main` is `217e33fd213d3adff765ae7ee460e60e2106fc68`.
- The supplied HTML SHA-256 is
  `c1eb8ae232985ec9ab44582e4836ab061f031c07afc68442840cb4a34e6b8075`.
- The supplied generator and guided-mechanics anchor SHA-256 is
  `a67840b0363fb9dd8d19bd594292fec14cded5ee4dc8420f7ac88e9ea987f57a`.
- The trainer contains four generated topics: expression simplification,
  systems of equations, linear-function graphs, and factorization.
- Progress Workspaces API v1 is already deployed, registry-gated, fail-closed,
  and backed by persistent `/data`; no new server contract is needed.
- The existing Yashchenko trainer and teacher panel establish the compatible
  assignment, fragment-secret, local cache, and teacher-workspace pattern.

## Approved scope

### In scope

- publish the supplied trainer under `trainers/algebra-7/`;
- preserve the supplied generators, exercises, guided steps, and UI mechanics;
- add assignment-isolated local progress and server synchronization;
- count four topics, attempts, errors, hints, clean/helped completion, best
  result, full completion, and last activity;
- add a trainer-specific teacher panel that creates personal links;
- opt the trainer into the existing registry capability;
- add homepage, catalog, and sitemap discoverability;
- add focused authoring and regression checks.

### Out of scope

- changing the Progress Workspaces API schema or persistence format;
- adding accounts, email, classroom groups, Board mirror behavior, or a new
  authentication mechanism;
- rewriting the supplied mathematical content or generator logic;
- changing deployment configuration or existing trainers.

### Files or areas that must not change

- `board-server/index.js` and `board-server/progress-store.js`;
- Amvera environment and persistent-volume configuration;
- existing trainer task corpora and teacher panels.

## Acceptance criteria

- [x] The canonical trainer and teacher panel are linked from the site.
- [x] The supplied mechanics anchor hash is unchanged.
- [x] Standalone progress survives reload locally.
- [x] Personal links carry the student code only in the fragment and remove it
  before the first request.
- [x] Teacher URLs contain only a non-secret workspace ID.
- [x] The server rejects trainer-ID mismatch and missing/invalid access codes.
- [x] Teacher progress shows student label, four topic states, attempts, errors,
  hints, clean/helped totals, best result, completion, and last activity.
- [x] Registry and board-server regression tests pass.
- [ ] Production HTTP and browser smoke pass after separately authorized merge
  and deployment.

## Checks and gates

- Required tests: `node --test --test-concurrency=1 board-server/test/*.test.js`
- Required static checks: focused authoring gate, inline-script parse, source
  mechanics hash, registry validation, link checks, `git diff --check`
- Manual checks: local teacher workspace, personal student link, fragment
  removal, student write, teacher read, and reload recovery
- Final gate marker: `ALGEBRA7_CONTROL_PROGRESS_V1_AUTHORING_CHECK_OK`
- Checks intentionally not run and why: production smoke waits for separately
  authorized merge and deployment

## Review plan

- Review-level rationale: durable server progress and access-code handling make
  this `HIGH` even though the server contract is reused unchanged.
- External review required: yes, unless the owner explicitly waives exact-head
  external review with a current rationale.
- Sanitized handoff constraints: share only repository-relative source, diff,
  public URLs, hashes, and test results; never share generated workspace,
  teacher, assignment, or student access values.
- Required provenance if external review is used: provider, PR, base SHA, head
  SHA, verdict, and verifiable source or timestamp.

## Risk and rollback

- Main risks: incorrect event-to-counter mapping, mixed assignments in one
  browser, token leakage in URLs, or a registry mismatch that denies writes.
- Rollback plan: revert the publication commit; the registry removal
  immediately denies new writes for this trainer while existing progress data
  remains inert and recoverable.
- Data or compatibility considerations: uses only Progress Workspaces API v1;
  existing trainer assignments and persisted records are not migrated.

## Permissions

- `START` granted by owner in the current task conversation: yes
- Branch creation allowed: yes
- Local commits allowed: yes
- Push allowed: yes
- Draft PR allowed: yes
- Merge allowed: **no unless separately authorized after review**
- Auto-merge allowed: **no unless separately authorized**
- Deployment allowed: **no unless separately authorized**

## Execution record

- Actual branch: `agent/algebra7-progress`
- Actual base SHA: `217e33fd213d3adff765ae7ee460e60e2106fc68`
- Actual head SHA: recorded in the PR handoff
- PR: recorded in the PR handoff
- Commits: one publication commit on the remote task branch
- Tests passed: authoring gate; 41/41 board-server tests; local browser/API smoke;
  `git diff --check`
- Tests failed: none in the final run
- Tests not run: production smoke pending merge/deployment authorization
- Scope deviations: none

## Required handoff

```text
EXECUTIVE STATUS

Task: Algebra 7 control-work progress publication
PR: pending
Base: 217e33fd213d3adff765ae7ee460e60e2106fc68
Head: pending
Gate: ALGEBRA7_CONTROL_PROGRESS_V1_AUTHORING_CHECK_OK
Tests: 41/41 board-server tests and local browser/API smoke passed
Failures: none in the final run
Not run: production smoke pending merge/deployment authorization
Scope deviations: none
Recommendation: obtain exact-head HIGH review or owner waiver, then authorize merge/deploy
Next user decision: exact-head review/waiver and merge/deployment authorization
```

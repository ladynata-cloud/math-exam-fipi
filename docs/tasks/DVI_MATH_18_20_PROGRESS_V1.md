# DVI mathematics tasks 18–20 publication

## Identity

- Task: publish the supplied DVI trainer and video studio with durable student progress
- Owner: ladynata-cloud
- Date: 2026-08-15
- Base branch: `main`
- Base SHA: `dcfa7107597c7f78be58323c83234a22b235f289`
- Planned branch: `agent/dvi-math-18-20`
- Review level: `HIGH`
- Related issue or ADR: existing Progress Workspaces API v1
- ADR status, if applicable: none accepted; ADR 0001 remains Proposed and advisory

## Goal

Publish both supplied DVI mathematics HTML files as a connected module: a
student trainer for tasks 18–20 with durable personal progress and a separate
teacher video studio whose automatic playback never changes student results.

## Context and evidence

- Production `main` is `dcfa7107597c7f78be58323c83234a22b235f289`.
- Supplied student trainer SHA-256:
  `89bc7a22718fdbe2c276d3b90775b0b015bb05ca3c0a1f47f6b1bdb5d96f5af4`.
- Supplied video studio SHA-256:
  `8df866a1e1ab0bf154d9dccebd5bdabac5860df09d1cbb32e8869c487356dc2a`.
- Student learning-generator anchor SHA-256:
  `b2f76a901f94a89563707ed0e704c37f96b130ce63b72f986c46fe60615826e7`.
- Video-studio learning-generator anchor SHA-256:
  `9d85045fb572da6e3599d0fc2682197d7d6df72359115748a9044e8a94550668`.
- Both sources cover task 18 trigonometry, task 19 a logarithmic system, and
  task 20 pyramids with generated variants and guided multiple-choice steps.
- Progress Workspaces API v1 is already deployed, registry-gated, fail-closed,
  and backed by persistent `/data`; no new server contract is required.
- The API v1 task IDs remain in its established two-line namespace:
  `t1-18`, `t1-19`, and `t2-20`. The teacher UI maps these technical IDs back
  to the visible DVI task numbers 18, 19, and 20.

## Approved scope

### In scope

- publish the student trainer and video studio under `trainers/dvi/`;
- preserve both supplied generators, task statements, answer logic, guided
  steps, hints, diagrams, playback, narration, and video-scene export;
- add assignment-isolated local and server progress to the student trainer;
- track tasks 18, 19, and 20, attempts, errors, hints, clean/helped completion,
  best result, module completion, and last activity;
- add one teacher panel that creates personal student links;
- keep automatic video playback outside student progress accounting;
- add registry, homepage, catalog, sitemap, authoring gate, and regression
  coverage.

### Out of scope

- changing the Progress Workspaces API schema or persistence format;
- adding accounts, email, groups, video rendering infrastructure, or uploads;
- rewriting the supplied mathematics or generator logic;
- changing deployment configuration or existing trainers.

### Files or areas that must not change

- `board-server/index.js` and `board-server/progress-store.js`;
- Amvera environment and persistent-volume configuration;
- existing trainer task corpora and teacher panels.

## Acceptance criteria

- [ ] Both supplied pages are linked from the site.
- [ ] Both learning-generator anchor hashes remain unchanged.
- [ ] Student standalone progress survives reload and assignments are isolated.
- [ ] Personal links carry the student code only in the fragment and remove it
  before the first request.
- [ ] Teacher URLs contain only a non-secret workspace ID.
- [ ] Teacher progress shows label, three task states, attempts, errors, hints,
  clean/helped totals, best result, completion, and last activity.
- [ ] Video-studio autoplay does not create student progress.
- [ ] Registry and board-server regression tests pass.
- [ ] Production smoke passes after separately authorized merge and deployment.

## Checks and gates

- Required tests: `node --test --test-concurrency=1 board-server/test/*.test.js`
- Required static checks: focused authoring gate, inline-script parse, source
  anchor hashes, registry validation, links, and `git diff --check`
- Manual checks: local trainer, video studio, teacher workspace, personal link,
  fragment removal, learner write, teacher read, and reload recovery
- Final gate marker: `DVI_MATH_18_20_PROGRESS_V1_AUTHORING_CHECK_OK`
- Checks intentionally not run and why: production smoke waits for separately
  authorized merge and deployment

## Review plan

- Review-level rationale: durable progress and access-code handling make this
  `HIGH` even though the existing server contract is reused unchanged.
- External review required: yes, unless the owner explicitly waives exact-head
  external review with a current rationale.
- Sanitized handoff constraints: share only repository-relative source, public
  URLs, hashes, diff, and test results; never share generated access values.
- Required provenance if external review is used: provider, PR, base SHA, head
  SHA, verdict, and verifiable source or timestamp.

## Risk and rollback

- Main risks: access-code leakage, progress counted during autoplay, incorrect
  task-to-line mapping, or registry mismatch.
- Rollback plan: revert the publication commit. Registry removal denies new DVI
  progress writes while existing persisted records remain inert and recoverable.
- Data or compatibility considerations: uses only Progress Workspaces API v1;
  existing assignments and records are not migrated.

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

- Actual branch: `agent/dvi-math-18-20`
- Actual base SHA: `dcfa7107597c7f78be58323c83234a22b235f289`
- Actual head SHA: pending
- PR: pending
- Commits: pending
- Tests passed: authoring gate; 41/41 board-server tests; local browser/API
  smoke for workspace creation, secret-fragment removal, one wrong and one
  correct attempt, hint tracking, server sync, teacher read, reload recovery,
  and video-studio isolation
- Tests failed: none in final run (initial server test invocation lacked local
  dependencies; rerun against the existing dependency install passed 41/41)
- Tests not run: production smoke pending merge/deployment authorization
- Scope deviations: none

## Required handoff

```text
EXECUTIVE STATUS

Task: DVI mathematics tasks 18–20 publication
PR: pending
Base: dcfa7107597c7f78be58323c83234a22b235f289
Head: pending
Gate: DVI_MATH_18_20_PROGRESS_V1_AUTHORING_CHECK_OK
Tests: authoring gate; board-server 41/41; local browser/API smoke
Failures: none in final run
Not run: production smoke pending merge/deployment authorization
Scope deviations: none
Recommendation: complete implementation and exact-head gates
Next user decision: exact-head review/waiver and merge/deployment authorization
```

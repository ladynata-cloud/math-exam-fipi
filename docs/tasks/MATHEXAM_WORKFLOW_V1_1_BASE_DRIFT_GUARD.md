# MathExam Workflow v1.1 — base-drift merge guard

## Identity

- Task: MathExam Workflow v1.1 — base-drift merge guard
- Owner: repository owner
- Date: 2026-07-15
- Base branch: `main`
- Base SHA: `d9a61f27f7bdf17a642e45faff719cf216e4ef0d`
- Planned branch: `codex/mathexam-workflow-v1-1-base-drift-merge-guard`
- Review level: `MEDIUM`
- Related incident: plan PR #85 was merged after its authorized base advanced
- Related ADR: none

## Goal

Make base equality a mandatory release invariant so that an owner authorization
cannot be reused after remote `main` advances. Require a read-only virtual merge,
repeated gates, identity evidence, and new owner authorization after every drift.

## Context and evidence

- The owner accepted the current composed `main` and concurrent commits
  `3e762d3`, `4e53c18`, and `0d37369` without revert.
- PR #85 patch identity is confirmed by owner marker
  `PLAN_PR_85_PATCH_IDENTITY_OK`.
- The release workflow previously treated mergeability and reviewed patch
  identity as sufficient even though the authorized base SHA had changed.
- Current remote `main` was verified through the built-in GitHub integration at
  the approved base SHA above. The local cached tracking ref was stale and was
  not treated as remote evidence.

## Approved scope

### In scope

- Update root operating rules, review policy, release skill, and current project
  status.
- Add this task specification and one JSON scenario fixture covering the
  required base-drift cases.
- Recommend branch protection or a merge queue without changing GitHub settings.

### Out of scope

- Production HTML, trainers, board server, manifests, Socket.IO, deployment,
  nested-path implementation, roads-grid, and download-panel UX changes.
- Merge, auto-merge, deployment, GitHub settings, or automatic branch repair.

### Files or areas that must not change

- `trainers/`
- `board-server/`
- production and deployment configuration
- package and manifest files

## Acceptance criteria

- [x] Remote `main` is compared with the authorized base immediately before
      merge.
- [x] Any difference causes STOP and invalidates the old authorization.
- [x] A read-only virtual merge, applicable rerun gates, and a new
      base/head/diff report are required after drift.
- [x] A new explicit owner authorization is required after drift.
- [x] `mergeable=true` is explicitly insufficient.
- [x] Full-tree identity is used only when the base is unchanged.
- [x] Reauthorized drift verification uses parent delta, file set, affected-file
      blobs, stable patch ID, no-extra-file evidence, and exact merge parent.
- [x] Concurrent commits receive separate provenance classification.
- [x] All owner-required scenarios exist in the committed JSON fixture.
- [x] Release reports expose every required base-drift field separately.

## Checks and gates

- Required tests: validate all JSON fixture scenarios and cross-document rules.
- Required static checks: Markdown headings and links, skill YAML front matter,
  JSON fixture parse and schema, secret and absolute-path scan, docs-only scope,
  and `git diff --check`.
- Manual checks: verify no conflicting instruction across `AGENTS.md`,
  `REVIEW_POLICY.md`, and the release skill.
- Final gate marker: `MATHEXAM_WORKFLOW_V1_1_BASE_DRIFT_GATE_OK`
- Checks intentionally not run: runtime, browser, server, and deployment tests
  because production files are out of scope.

## Review plan

- Review-level rationale: release-control behavior spans several durable
  workflow sources and protects merge authorization, but changes no runtime.
- External review required: no by current `MEDIUM` policy; the owner may request
  it during Draft PR review.
- Sanitized handoff constraints: repository-relative paths and public commit or
  PR identifiers only; no credentials, private documents, or machine paths.
- Required provenance if external review is used: provider, PR, base SHA, head
  SHA, verdict, and verifiable source or timestamp.

## Risk and rollback

- Main risks: conflicting rules could either permit an unsafe merge or block a
  valid release; ambiguous fixtures could hide an uncovered drift case.
- Rollback plan: revert the single docs-only workflow commit. No runtime,
  trainer, server, manifest, or deployment rollback is required.
- Data or compatibility considerations: none; the change affects release
  procedure only.

## Permissions

- `START` granted by owner in the current task conversation: yes
- Branch creation allowed: yes
- Local commits allowed: yes, one logical commit
- Push allowed: yes
- Draft PR allowed: yes
- Merge allowed: no
- Auto-merge allowed: no
- Deployment allowed: no

## Execution record

- Actual branch: `codex/mathexam-workflow-v1-1-base-drift-merge-guard`
- Actual base SHA: `d9a61f27f7bdf17a642e45faff719cf216e4ef0d`
- Actual head SHA: recorded in the Draft PR and final handoff
- PR: Draft PR #86
- Commits: one logical docs/workflow commit
- Tests passed: Markdown headings and links; skill YAML front matter; JSON parse,
  schema, and 12 scenarios; cross-document invariants; secrets and absolute-path
  scans; docs-only scope; `git diff --check`
- Tests failed: none
- Tests not run: runtime, browser, server, and deployment tests
- Scope deviations: none expected

## Required handoff

```text
EXECUTIVE STATUS

Task:
Branch:
Base:
Head:
PR:
Files:
Checks:
Gate:
Scope deviations:
Working tree:
Recommendation:
Next user decision:
```

---
name: mathexam-release
description: Verify an exact MathExam PR head, external-review provenance when required, final gates, controlled merge authorization, deployment authorization, and post-merge production evidence.
---

# MathExam release workflow

Use this skill only after a PR exists. A completed PR workflow, valid review, or
passing gate does not authorize merge or deployment.

## Required inputs

- PR and repository identity;
- expected base and head commits;
- task specification and review level;
- current review and check results;
- separate explicit owner authorization for merge;
- separate explicit owner authorization for deployment when deployment is in
  scope.

## Pre-merge verification

1. Read `AGENTS.md`, `docs/PROJECT_STATUS.md`, `docs/REVIEW_POLICY.md`, the task
   specification, PR body, accepted ADRs, and unresolved review threads.
2. Verify that the PR base and head match the release request and that the diff
   contains only approved scope.
3. Verify every required check on the exact head. Record passes, failures, and
   not-run checks separately. Rerun the final local or remote gate when the
   evidence is stale or tied to another commit.
4. Apply the declared review level. Claude is not required for every `SMALL` PR.
5. When external review is required or claimed, verify provider, PR, base SHA,
   head SHA, verdict, and a verifiable source or timestamp. Copied approval text
   is not evidence.
6. Ensure remote handoffs were sanitized and contain no secret values,
   authentication material, private documents, personal data, or
   machine-specific absolute paths.
7. Present the standard executive status and obtain separate explicit owner
   authorization for the current PR and exact head before merge.

## Controlled merge

1. Recheck the exact head, required checks, review state, and merge permission
   immediately before the operation.
2. Use an authenticated built-in GitHub integration, or GitHub CLI when it is
   available and authenticated. If neither is available, stop without merging.
3. Use only the merge method authorized by the owner and repository policy.
   Never use force, reset, rebase, admin override, disabled TLS verification, or
   weakened checks to complete a release.
4. Capture the resulting production `main` commit and merge evidence.

## Deployment and post-merge gate

1. Deploy only when deployment is explicitly authorized and belongs to the
   release scope. Merge authorization alone is insufficient.
2. Verify that deployment uses the merged production commit, then run the
   specified post-merge or production gate.
3. On failure, stop further rollout, preserve evidence, and follow the approved
   rollback plan; do not improvise destructive recovery.
4. Update `docs/PROJECT_STATUS.md` with production `main`, current stage, open
   PR, last confirmed gate, blockers, and next three actions. If branch
   protection prevents a direct status update, create a separate docs-only task
   and PR.
5. Report the merge, deployment, post-merge gate, failures, rollback state, and
   next owner decision.

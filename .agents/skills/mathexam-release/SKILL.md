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
2. Record the authorized base SHA from the current owner's merge authorization.
   Query the authoritative current remote `main` SHA; do not treat a possibly
   stale local tracking ref as current evidence.
3. Compare current remote `main` with the authorized base immediately before
   any merge operation. `mergeable=true` does not replace this check.
4. Verify that the PR base and head match the release request and that the diff
   contains only approved scope.
5. Verify every required check on the exact head. Record passes, failures, and
   not-run checks separately. Rerun the final local or remote gate when the
   evidence is stale or tied to another commit.
6. Apply the declared review level. Claude is not required for every `SMALL` PR.
7. When external review is required or claimed, verify provider, PR, base SHA,
   head SHA, verdict, and a verifiable source or timestamp. Copied approval text
   is not evidence.
8. Ensure remote handoffs were sanitized and contain no secret values,
   authentication material, private documents, personal data, or
   machine-specific absolute paths.
9. Present the standard executive status and obtain separate explicit owner
   authorization for the current PR and exact head before merge.

## Base drift: mandatory stop and revalidation

If current remote `main` differs from the authorized base, stop before merge and
mark the prior owner authorization invalid. Do not update, merge, rebase, reset,
or otherwise repair the branch automatically.

After the stop:

1. classify every concurrent `main` commit by provenance; do not assume that a
   commit is authorized merely because it is on `main`;
2. construct a read-only virtual merge on the new `main` using `git merge-tree`
   or an equivalent non-mutating operation;
3. record a clean merge or conflict without changing the worktree, index,
   branch, PR, or remote refs;
4. rerun the applicable gates against the virtual composed result;
5. report the new base, unchanged reviewed head, changed-file delta, failures,
   and not-run checks;
6. require a new explicit owner merge authorization bound to the new base and
   exact head.

A clean virtual merge does not revive the old authorization. A virtual conflict
remains blocked until the owner approves a separately scoped resolution task.
The required scenario expectations are committed in
[BASE_DRIFT_SCENARIOS.json](BASE_DRIFT_SCENARIOS.json).

## Controlled merge

1. Requery current remote `main` and recheck the exact head, required checks,
   review state, and merge permission immediately before the operation. Any new
   base drift restarts the mandatory stop and reauthorization cycle.
2. Use an authenticated built-in GitHub integration, or GitHub CLI when it is
   available and authenticated. If neither is available, stop without merging.
3. Use only the merge method authorized by the owner and repository policy.
   Never use force, reset, rebase, admin override, disabled TLS verification, or
   weakened checks to complete a release.
4. If the authorized base is unchanged, verify full-tree identity between the
   reviewed head and the expected squash-merge tree.
5. If the base previously drifted and the owner authorized the new base after
   revalidation, do not compare the composed `main` tree with the old reviewed
   head tree. Before merge, verify the new-base-to-virtual-merge delta:
   - changed files exactly match the reviewed patch;
   - affected-file blobs match the reviewed result;
   - reviewed and virtual deltas have the same stable patch ID from
     `git patch-id --stable`;
   - no extra file appears in the merge delta.
6. After merge, verify that the merge parent is the newly authorized base and
   repeat the changed-file, blob, stable-patch-ID, and no-extra-file checks on
   the actual parent-to-merge delta.
7. Capture the resulting production `main` commit and merge evidence.

## Deployment and post-merge gate

1. Deploy only when deployment is explicitly authorized and belongs to the
   release scope. Merge authorization alone is insufficient.
2. Verify that deployment uses the merged production commit, then run the
   specified post-merge or production gate.
3. On failure, stop further rollout, preserve evidence, and follow the approved
   rollback plan; do not improvise destructive recovery.
4. Reconcile `docs/PROJECT_STATUS.md` with production `main`, current stage,
   open PR, last confirmed gate, blockers, and next three actions within the
   approved release scope or at the start of the next approved task. Do not
   create an automatic status-only PR; require an explicit owner decision or a
   real operational need, and never create a recursive status-only PR merely to
   record the preceding status merge.
5. Report the merge, deployment, post-merge gate, failures, rollback state, and
   next owner decision.

## Required base-drift report fields

After any owner merge authorization, report these fields separately even when
no drift occurred:

```text
Authorized base:
Actual current main:
Base drift detected:
Authorization valid/invalid:
Virtual merge result:
Rerun gates:
New owner authorization required:
```

Recommend GitHub branch protection or a merge queue when they are not already
configured, but never change repository settings without separate owner scope
and authorization.

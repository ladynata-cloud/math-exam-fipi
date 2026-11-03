---
name: mathexam-release
description: Verify and publish an approved MathExam PR under the owner's standing release authorization, with exact candidate checks, base-drift revalidation and production evidence.
---

# MathExam release workflow

Use after a PR exists. Read the current
[standing owner authorization](../../../docs/OWNER_RELEASE_AUTHORIZATION.md),
`AGENTS.md`, review policy, task specification and unresolved review threads.
The owner authorized publication of requested/approved work on 2026-11-02
without per-PR confirmation or mandatory external audit. Do not request those
permissions again. Honor later explicit task-specific restrictions.

## Required inputs

- Repository, PR, approved scope and declared review level.
- Validated base/head and applicable test/check results.
- Authorization source: standing policy or a later narrower owner instruction.
- Deployment target, rollback plan and specified post-release checks.

## Candidate and review

1. Verify the actual diff contains only approved scope and preserves unrelated
   work. Distinguish accepted ADRs from proposals.
2. Complete risk-appropriate mathematical, technical and interaction review.
   Run applicable local tests and required CI on the actual candidate. Report
   failures and not-run checks separately; do not weaken gates to obtain a pass.
3. External consultation/audit is optional unless specifically requested by the
   owner for this task. Do not treat an unavailable provider as a blocker under
   the standing policy, and do not claim an external review happened.
4. For a requested external review, verify provider, PR/base/head, verdict and
   source/timestamp. Sanitize and minimize all external handoffs.
5. Record the release decision and evidence. A ready, in-scope candidate can
   proceed under standing permission without another owner confirmation.

## Main or head movement

Immediately before a merge, obtain authoritative remote `main` and PR head.
Compare them with the validated pair; cached refs and `mergeable=true` are not
substitutes. If either changed, stop the stale merge attempt and revalidate:

1. Classify concurrent commits by provenance and impact on this task.
2. Construct a read-only virtual merge using `git merge-tree` or equivalent.
3. Rerun affected gates on the composition and record its base/head/diff.
4. If clean and in scope, continue under standing authorization. If branch
   synchronization is needed, use an ordinary history-preserving merge, resolve
   routine conflicts without losing approved work and validate the new head.
5. An unresolved product conflict, uncertain provenance, unexplained file,
   material scope expansion or a later owner release hold remains a blocker.
   Ask only for the actual unresolved decision, not repeated blanket consent.

For an unchanged patch rebased by composition onto newer main, verify its exact
file set, affected-file blobs, stable patch ID and absence of extra files.
Full-tree equality with the old head is inappropriate when main added unrelated
changes. For a reviewed conflict resolution, verify the newly tested delta
instead of asserting that it is the original patch. See
[BASE_DRIFT_SCENARIOS.json](BASE_DRIFT_SCENARIOS.json).

## Controlled merge and publication

1. Requery main/head and required checks immediately before the operation.
   Any movement restarts candidate validation.
2. Use the authenticated GitHub integration or an authenticated CLI. Prefer
   squash-merge with the expected head SHA. No force, reset, rebase, admin
   override, disabled TLS or weakened tests/branch protection.
3. Verify the actual merge parent equals the validated base and the actual
   tree/delta equals the tested composition, with no extra files or lost work.
4. Publish through the established deployment path for the approved task.
   Confirm the deployed commit and complete the post-release/site checks.
5. On failure, stop further rollout, preserve evidence and follow the scoped
   rollback plan. Do not improvise destructive recovery.
6. Reconcile project status with verified production evidence within the task
   or next approved task. Avoid recursive status-only PRs.

## Report

Record authorization source, validated base/head, actual pre-merge main/head,
base drift and revalidation, gates, failed/not-run checks, merge commit,
deployment evidence, live verification, rollback state and remaining decisions.
When the standing policy applies and checks pass, state that no further owner
publication authorization is required.

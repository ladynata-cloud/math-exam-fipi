---
name: mathexam-pr
description: Run one approved MathExam task from base verification through local gates, logical commits, publication, and a Draft PR, then hand off to the release workflow under the standing owner policy.
---

# MathExam PR workflow

Use this skill for a task with an approved task specification and explicit
`START`. Follow the repository-root `AGENTS.md`, `docs/REVIEW_POLICY.md`, and the
task-specific scope.

## Required inputs

- task specification or equivalent approved scope;
- base branch and expected base commit;
- review level;
- explicit owner `START` in the current task conversation;
- required tests, gate marker, and publication permissions.

Read the current [standing owner policy](../../../docs/OWNER_RELEASE_AUTHORIZATION.md).
It authorizes publication of requested/approved work after checks and removes
the external-audit prerequisite. Copied provider approval markers are still not
evidence that an external review happened; the policy does not start unrelated work.

## Procedure

1. Read the applicable repository instructions, project status, roadmap, review
   policy, task specification, and relevant accepted ADRs.
2. Inspect existing files before adding or replacing instructions. Avoid
   duplicate or conflicting sources of truth.
3. Verify repository identity, worktree root, clean status, current branch, base
   commit, upstream base, and remote. Stop on an unexpected base or unrelated
   local changes.
4. Create exactly one task branch from the approved base. Do not reuse an
   unrelated branch.
5. Implement only the approved scope. Preserve unrelated user changes and do
   not start roadmap items that are merely adjacent.
6. Run the specified tests and gates. Also inspect the final diff, run
   `git diff --check`, validate relevant links and structure, and report failed
   or not-run checks without euphemism.
7. Confirm that remote handoffs and repository files contain no secret values,
   authentication material, private documents, personal data, or
   machine-specific absolute paths.
8. Create the logical commit or commits allowed by the task. Recheck status and
   the exact committed diff.
9. Publish with an available authenticated path:
   - GitHub CLI may be used when it is installed and authenticated;
   - otherwise use the built-in GitHub integration;
   - if neither is available, keep the completed local commit, stop before
     push, and report the blocker.
10. Open a Draft PR, complete the repository PR template, include base and head
    commits, and record the exact tests and gate result.
11. Emit the standard `EXECUTIVE STATUS` report and continue with
    `mathexam-release` under standing permission when its conditions are met.
    Stop only for an actual blocker or later explicit owner release hold.

## Review handling

Apply the declared level from `docs/REVIEW_POLICY.md`. External review is optional for every level
unless the owner specifically requests it; keep all applicable technical review. When external review is used, verify
provider, PR, base SHA, head SHA, verdict, and a verifiable source or timestamp.
Invalidate review tied to an older head after material changes.

## Hard stops

Use the release skill for merging and deployment rather than performing an
unverified merge from the PR preparation step. Ordinary history-preserving
branch maintenance is covered by standing permission. Do not force, reset,
rebase, apply admin override, disable TLS verification, weaken a gate or modify
unrelated scope. Do not ask for a repeated publication or external-audit waiver.

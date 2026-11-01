# Standing MathExam publication authorization

Status: Active owner decision, 2026-11-02 (Asia/Novosibirsk).

## Source and precedence

While authorizing PR #398 on base `8307f6a` and head `5b147c9`, the owner
also requested: «Давай я дам тебе разрешения на все публикации, и без
внешнего аудита». This document records that current, project-wide decision.
It is an owner release policy, not evidence of a Claude or other provider review.

This decision supersedes earlier generic requirements for a new publication
confirmation on every PR, repeated base-drift confirmation, and mandatory
external trainer consultation/audit. Historical task reports and PR bodies
remain historical evidence; their old permission-pending wording does not
cancel this standing authorization. A later explicit owner restriction for a
particular task, audience, base, head, or deployment takes precedence.

## Authorized work and releases

For MathExam work the owner has requested or approved, the executing agent may:

- complete the scoped implementation, tests, commits and existing/new task PR;
- maintain the task branch with ordinary history-preserving merges of current
  `main`, resolving routine conflicts while preserving all approved changes;
- mark the PR ready, squash-merge after successful applicable checks, publish
  through the established MathExam deployment, and verify the live result;
- continue that workflow without asking again solely for publication,
  base movement, or a missing external review.

The task specification must identify the approved work and cite this policy as
its release authorization. The policy does not independently start unrelated
roadmap items or expand an approved task's product scope. Ordinary branch
maintenance is covered; rewriting shared history, bypassing access controls,
weakening tests, or ignoring a technical failure is not.

## Verification remains required

1. Review the actual diff and mathematics/interaction as appropriate to risk.
2. Run applicable tests and required CI against the actual candidate; record
   passes, failures and unavailable checks separately. Never label a missing
   audit, browser check or real-pupil pilot as performed.
3. Immediately before merging, obtain authoritative current `main` and PR head.
   Freeze those values for this release attempt; do not rely on cached refs.
4. If either changed since validation, stop that merge attempt, classify the
   concurrent commits, construct a virtual merge and repeat affected checks.
   A clean in-scope composition can proceed under this standing permission.
   An ordinary branch update creates a new candidate requiring new checks.
5. Verify the exact base-to-merge file set, patch and affected contents. For an
   unchanged patch on a newer base, require matching stable patch ID and blobs;
   for a necessary conflict resolution, review and test the new delta explicitly.
   Unexplained extra files, uncertain provenance, lost work or unresolved
   conflicts block release until resolved within scope or decided by the owner.
6. Verify the actual merge parent and tree/delta, deployment commit and public
   result. Record rollback readiness without automatically deleting data or
   rewriting history.

Ask the owner only for a real unresolved product decision, scope change or
consequential action not covered by the task. Do not ask them to repeat this
authorization because an older document says that every PR needs a new one.

## External review

External Claude/provider design consultation and final audit are optional,
not release prerequisites, until the owner requests them for a particular task.
Do not make a paid external review call merely to satisfy the superseded rule.
Risk-appropriate technical/content review, automated tests and truthful evidence
remain required. Record the external-review status as not performed under this
owner policy; never invent a provider approval or reuse a historical verdict.

If the owner later requests an external review, follow the consultation workflow
and record its provider, scope, exact PR/base/head where relevant, timestamp and
verifiable verdict. That task-specific instruction applies until withdrawn.

## Release record

Record authorization source, validated base/head, actual pre-merge main/head,
whether drift occurred and how it was revalidated, gate results, merged commit,
deployment evidence, live checks, limitations and any remaining owner decision.
No separate confirmation is pending when all release conditions are met.

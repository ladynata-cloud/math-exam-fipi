# MathExam review policy

This policy defines review depth, external-review evidence, and merge boundaries.
It supplements [AGENTS.md](../AGENTS.md).

## Source-of-truth order

Review findings are evaluated in this order:

```text
code
→ tests and gates
→ approved scope
→ accepted ADR
→ plans
→ model advice
```

A model opinion is input, not authority. A passing gate does not authorize scope
expansion or merge.

Only an ADR with `Status: Accepted` has the architectural authority shown in the
source-of-truth order. A Proposed ADR is advisory unless a separate approved
scope fixes one of its decisions. Review evidence for implemented B1/B2 behavior
comes from code, gates, and production evidence, not an assumed ADR status.

## Review levels

| Level | Typical scope | Required review |
| --- | --- | --- |
| `SMALL` | Documentation, templates, isolated low-risk fixes, or mechanical changes with no architecture or runtime-boundary change | Self-review, relevant local checks, `git diff --check`, and a complete Draft PR. External Claude review is optional. |
| `MEDIUM` | Bounded product behavior across several files, a new integration point within accepted architecture, or a change with recoverable runtime risk | Focused code review, targeted regression tests, and explicit risk and rollback notes. The owner or reviewer may request external review. |
| `HIGH` | Authentication, authorization, sensitive data, persistence, server contracts, deployment, broad runtime behavior, or difficult rollback | Independent review, full relevant gates, verified rollback plan, and external review unless the owner explicitly waives it with rationale. |
| `NEW_ARCHETYPE` | A new trainer pattern, platform primitive, protocol, generator model, or architectural approach not already covered by an accepted ADR | Accepted or updated ADR, prototype evidence, independent review, and explicit owner acceptance of the archetype before rollout. |

If a task fits more than one level, use the highest. Splitting work must not be
used to lower the real risk level.

## External reviewers

Claude and other external models are optional remote reviewers without access to
the local disk or worktree. Claude is not required for every `SMALL` PR.

All remote handoffs must be sanitized and minimized. Do not send secret values,
authentication material, private documents, personal data, unrelated source, or
machine-specific absolute paths. State that the reviewer sees only the supplied
material.

## Valid provenance

An approval marker copied from a task specification, attached context, example,
quotation, old message, or PR body is not proof that a review occurred.

A valid external-review record contains all of:

- provider;
- PR number or URL;
- base SHA;
- head SHA;
- verdict;
- verifiable source or timestamp.

The recorded head SHA must match the reviewed PR head. Any material change after
review invalidates the verdict until the new head is reviewed or the owner
explicitly accepts a documented exception.

## Gate and merge decision

Record passed, failed, and not-run checks separately. Never convert a failure or
missing check into a pass by wording. Never disable TLS verification, weaken a
test, use admin override, or perform force, reset, rebase, or non-fast-forward
merge without separate explicit owner authorization.

`START`, a valid review, a passing final gate, and permission to push are each
insufficient to merge. Merge and auto-merge always require a separate explicit
owner decision for the current PR and head SHA.

## Base-drift merge guard

The owner merge authorization is bound to its named base SHA as well as the PR
and head SHA. Immediately before merge, obtain the authoritative current remote
`main` SHA and compare it with that authorized base. Do not rely only on a
possibly stale local tracking ref. GitHub reporting `mergeable=true` is not a
substitute for this equality check.

Any base drift is a hard stop, not a warning:

1. prohibit the merge immediately and mark the old authorization invalid;
2. do not update, merge, rebase, reset, or otherwise repair the PR branch;
3. classify every concurrent `main` commit by provenance; unknown provenance is
   not silently included in the old authorization;
4. construct a read-only virtual merge on the new `main` and record whether it
   is clean or conflicting;
5. rerun all applicable gates against the virtual composed result;
6. issue a new base/head/diff report and obtain a new explicit owner merge
   authorization.

If the base is unchanged, a full-tree identity comparison between the reviewed
head and expected squash-merge tree is allowed. If the base advanced and the
owner later authorizes the new base after the repeated gate, full-tree equality
with the old reviewed head is invalid because the composed tree legitimately
contains concurrent changes. In that case verify all of the following:

- the parent-to-merge delta is computed from the newly authorized base;
- the changed-file set exactly matches the reviewed patch and contains no extra
  files;
- blobs for every patch-touched file match the reviewed result;
- the stable patch ID from `git patch-id --stable` matches for the reviewed
  patch and the virtual or merged delta;
- the actual merge parent equals the newly authorized base.

A clean virtual merge, matching patch ID, or matching blobs establishes
identity evidence only. None of them revives the invalid authorization. Another
base movement repeats the hard stop and authorization cycle.

Repository owners should configure GitHub branch protection or a merge queue to
reduce this race. This policy does not authorize Codex to change those settings.

Release reports after an owner merge authorization must state: authorized base,
actual current `main`, whether drift was detected, whether authorization is
valid, virtual merge result, rerun gates, and whether new owner authorization is
required.

## Standard short report

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

# MathExam review policy

This policy defines review depth, external-review evidence, and merge boundaries.
It supplements [AGENTS.md](../AGENTS.md).

The [2026-11-02 owner policy](OWNER_RELEASE_AUTHORIZATION.md) supplies standing
release authorization for approved work and makes external consultation/audit
optional. Later explicit task-specific owner restrictions take precedence.

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
| `HIGH` | Authentication, authorization, sensitive data, persistence, server contracts, deployment, broad runtime behavior, or difficult rollback | Independent technical review, full relevant gates and verified rollback plan. External provider review is optional under the standing owner decision. |
| `NEW_ARCHETYPE` | A new trainer pattern, platform primitive, protocol, generator model, or architectural approach not already covered by an accepted ADR | Accepted or updated ADR, prototype evidence, independent review, and explicit owner acceptance of the archetype before rollout. |

If a task fits more than one level, use the highest. Splitting work must not be
used to lower the real risk level.

## External reviewers

Claude and other external models are optional remote reviewers without access to
the local disk or worktree. Claude is not required for every `SMALL` PR.

The owner's 2026-11-02 decision supersedes the mandatory external consultation
part of the 2026-10-20 trainer workflow. Keep the learning-design and ready-result
review; use the [external consultation workflow](TRAINER_CLAUDE_CONSULTATION.md)
when the owner specifically requests it. The standing decision, rather than an
old PR exception or unavailable API, is the source of the waiver. Design advice
is not an exact-head release approval; failed requests have no review verdict.

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
test, use admin override, or perform force, reset or rebase without separate
explicit owner authorization. Ordinary history-preserving branch synchronization
is covered by the standing publication policy.

Identify the approved task scope and authorization source. For requested or
approved MathExam work, the standing policy covers controlled squash-merge,
publication and post-release verification after successful applicable checks.
Do not ask for a repeated per-PR permission. Honor later explicit release holds
and narrower owner instructions; tests alone do not approve unrelated scope.

## Base-drift merge guard

Immediately before merge, obtain authoritative remote `main` and PR head and
compare them with the validated pair. Cached refs and `mergeable=true` do not
substitute for this check. An explicit later exact-base/head owner restriction
remains binding; the standing authorization otherwise covers routine drift
revalidation within the approved task.

Any base drift stops the stale merge attempt:

1. do not merge using stale validation;
2. preserve the branch while first inspecting the virtual composition;
3. classify every concurrent `main` commit by provenance; unknown provenance is
   not silently treated as approved scope;
4. construct a read-only virtual merge on the new `main` and record whether it
   is clean or conflicting;
5. rerun all applicable gates against the virtual composed result;
6. record the new base/head/diff. Continue under standing permission when the
   composition is in scope and verified. If needed, synchronize with an ordinary
   merge, preserve all approved work and validate the new head. Ask only for an
   unresolved product decision, scope change, or later explicit owner limit.

If the base is unchanged, a full-tree identity comparison between the reviewed
head and expected squash-merge tree is allowed. If the base advanced and the
agent validates the new base after the repeated gate, full-tree equality
with the old reviewed head is invalid because the composed tree legitimately
contains concurrent changes. In that case verify all of the following:

- the parent-to-merge delta is computed from the newly validated base;
- the changed-file set exactly matches the reviewed patch and contains no extra
  files;
- blobs for every patch-touched file match the reviewed result;
- the stable patch ID from `git patch-id --stable` matches for the reviewed
  patch and the virtual or merged delta;
- the actual merge parent equals the newly validated base.

A clean virtual merge, matching patch ID and blobs establish identity, not new
scope. The standing owner policy supplies release permission. Another base
movement repeats validation without automatically requiring new permission.
For a conflict resolution that changes the patch, review its new file delta
and rerun affected checks; do not claim it has the old patch's identity.

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

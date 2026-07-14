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

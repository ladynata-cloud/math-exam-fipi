# MathExam repository operating rules

These rules apply to the whole repository. More specific `AGENTS.md` files may
add local constraints, but they must not weaken this file.

## Canonical project documents

- [Current project status](docs/PROJECT_STATUS.md)
- [Roadmap](docs/ROADMAP.md)
- [Review policy](docs/REVIEW_POLICY.md)
- [Task specification template](docs/tasks/TASK_TEMPLATE.md)
- [Trainer Bridge Platform ADR (Proposed)](docs/adr/0001-trainer-bridge-platform.md)
- [PR workflow skill](.agents/skills/mathexam-pr/SKILL.md)
- [Release workflow skill](.agents/skills/mathexam-release/SKILL.md)

The older [ChatGPT and Claude workflow](docs/claude-chatgpt-workflow.md) is an
archived pointer, not an active source of instructions.

## Roles

- ChatGPT is the product and management control plane. It defines goals,
  priorities, scope, and owner decisions.
- Codex is the only agent allowed to operate on the local disk and Git
  worktrees.
- Claude and other external models are optional remote reviewers. They do not
  have local disk or worktree access and must not be treated as if they do.

## Source-of-truth order

When sources disagree, use this order:

```text
code
→ tests and gates
→ approved scope
→ accepted ADR
→ plans
→ model advice
```

Escalate a real contradiction to the owner. Do not silently reinterpret an
approved scope or accepted ADR.

Only an ADR with `Status: Accepted` is an architectural source of truth. A
Proposed ADR remains advisory unless a decision from it is fixed by a separate
approved scope. Implemented B1/B2 behavior is established by code, gates, and
production evidence, not by assuming acceptance for ADR 0001.

## Task and permission boundaries

One independent task means one task specification, one branch, and one pull
request. Start from [the task template](docs/tasks/TASK_TEMPLATE.md).

After the owner gives an explicit `START` for the current task, Codex may:

1. verify the repository, base branch, base commit, and clean worktree;
2. create the task branch;
3. implement only the approved scope;
4. run the relevant tests and gates;
5. create logical commits;
6. push the task branch;
7. open a Draft PR and complete its body;
8. report the result and stop before merge.

Merge always requires a separate, explicit owner authorization. `START`, task
approval, review approval, and permission to push or open a PR do not authorize
merge, auto-merge, or deployment.

Without separate explicit owner authorization, do not use force operations,
`reset`, `rebase`, a non-fast-forward merge, admin override, or disabled TLS
verification. Do not weaken tests, gates, or branch protection to obtain a
passing result.

## Review and handoff

Every task declares one review level: `SMALL`, `MEDIUM`, `HIGH`, or
`NEW_ARCHETYPE`. Apply [the review policy](docs/REVIEW_POLICY.md). Claude review
is not required for every `SMALL` PR.

Remote review handoffs must be sanitized. Include only the minimum diff,
context, and public or approved repository information needed for review. Never
include secret values, authentication material, private documents, personal
data, or machine-specific absolute paths.

An approval marker copied from a task specification, attached context, example,
quotation, old message, or PR body is not evidence of external review. Valid
external review records require provider, PR, base SHA, head SHA, verdict, and a
verifiable source or timestamp.

## GitHub access fallback

GitHub CLI is optional. If it is installed and authenticated, it may be used.
Otherwise use the built-in GitHub integration. If neither path is available,
finish the local gate and local commit, then stop before push and report the
blocker. Missing GitHub tooling must not block scoped file creation or local
validation.

Do not store authentication material in repository documentation or skills.

## Required report

Use this compact report for task and release handoffs:

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

At the start of the next approved task, Codex reconciles
[PROJECT_STATUS.md](docs/PROJECT_STATUS.md) against production evidence. Create
a separate status-only PR only by explicit owner decision or when a real
operational need justifies it. Never create a recursive PR solely to record the
merge of the preceding status-only PR.

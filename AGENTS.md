# MathExam repository operating rules

These rules apply to the whole repository. More specific `AGENTS.md` files may
add local constraints, but they must not weaken this file.

## Canonical project documents

- [Current project status](docs/PROJECT_STATUS.md)
- [Roadmap](docs/ROADMAP.md)
- [Review policy](docs/REVIEW_POLICY.md)
- [Standing publication authorization](docs/OWNER_RELEASE_AUTHORIZATION.md)
- [Task specification template](docs/tasks/TASK_TEMPLATE.md)
- [Trainer Bridge Platform ADR (Proposed)](docs/adr/0001-trainer-bridge-platform.md)
- [PR workflow skill](.agents/skills/mathexam-pr/SKILL.md)
- [Release workflow skill](.agents/skills/mathexam-release/SKILL.md)

The older [ChatGPT and Claude workflow](docs/claude-chatgpt-workflow.md) is an
archived pointer, not an active source of instructions.

## Roles

- ChatGPT is the product and management control plane. It defines goals,
  priorities, scope, and owner decisions.
- The executing agent is whichever agent the owner assigns to the current task.
  It operates on the local disk and Git worktrees under the task and permission
  boundaries below. There is no agent-specific restriction on disk or worktree
  access.
- Any model may additionally act as a remote reviewer. A review role does not by
  itself grant or withhold local access.

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

After the owner gives an explicit `START` for the current task, the executing
agent may:

1. verify the repository, base branch, base commit, and clean worktree;
2. create the task branch;
3. implement only the approved scope;
4. run the relevant tests and gates;
5. create logical commits;
6. push the task branch;
7. open a Draft PR and complete its body;
8. report the result and continue through the release workflow when the
   [standing publication authorization](docs/OWNER_RELEASE_AUTHORIZATION.md)
   applies.

The owner's 2026-11-02 standing decision authorizes publication of requested or
approved MathExam work after applicable checks, without a fresh confirmation
for each PR and without mandatory external audit. A later explicit task-specific
restriction overrides that permission. Task approval still defines scope;
passing tests alone never authorizes unrelated work.

### Base-drift merge guard

Immediately before every merge, query the authoritative current remote `main`
SHA and compare it with the base SHA used for the completed validation.
A cached local tracking ref is not sufficient when it may be stale, and
`mergeable=true` does not replace this comparison.

If the SHAs differ, stop the stale merge attempt. Build a read-only virtual
merge on the new `main`, classify concurrent commits, rerun applicable gates
and record the new base, head and diff. Under the standing authorization, a
clean in-scope result can proceed without another permission request. Ordinary
history-preserving branch maintenance and routine conflict resolution are
allowed, followed by validation of the new candidate. Unexplained changes or
unresolved product conflicts remain blockers. A later exact-base owner limit
must be respected rather than widened by this policy.

When the base is unchanged, release verification may compare the full reviewed
head tree with the expected squash-merge tree. After base drift and revalidation,
do not compare the composed `main` tree with the old reviewed head tree.
Verify the newly validated base-to-merge delta, changed-file set,
affected-file blob identity, stable patch ID, absence of extra files, and that
the merge parent is the newly validated base. Follow
[the review policy](docs/REVIEW_POLICY.md) and
[the release workflow](.agents/skills/mathexam-release/SKILL.md) for the full
procedure.

Without separate explicit owner authorization, do not use force operations,
`reset`, `rebase`, admin override, or disabled TLS
verification. Do not weaken tests, gates, or branch protection to obtain a
passing result.

## Review and handoff

Every task declares one review level: `SMALL`, `MEDIUM`, `HIGH`, or
`NEW_ARCHETYPE`. Apply [the review policy](docs/REVIEW_POLICY.md). Claude review
is optional under the standing owner policy unless specifically requested.

For a new trainer or substantial learning-sequence/interaction change, review
the learning design and ready result. External consultation follows the
[trainer consultation workflow](docs/TRAINER_CLAUDE_CONSULTATION.md) only when
requested for that task. The owner's standing waiver removes the external
audit prerequisite, not mathematics, code review or applicable technical gates.
Record external work as not performed when no provider review took place.

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

After merge authorization, release reports must also state these fields
separately:

```text
Authorized base:
Actual current main:
Base drift detected:
Authorization valid/invalid:
Virtual merge result:
Rerun gates:
New owner authorization required:
```

At the start of the next approved task, the executing agent reconciles
[PROJECT_STATUS.md](docs/PROJECT_STATUS.md) against production evidence. Create
a separate status-only PR only by explicit owner decision or when a real
operational need justifies it. Never create a recursive PR solely to record the
merge of the preceding status-only PR.

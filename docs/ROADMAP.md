# MathExam roadmap after B2

This roadmap describes order, not blanket authorization. Every item requires a
separate task specification, branch, PR, and explicit `START` under
[AGENTS.md](../AGENTS.md).

## Baseline

Trainer Registry B2 is complete on production `main`. The accepted architecture
context remains [ADR 0001](adr/0001-trainer-bridge-platform.md). Current
operational state is tracked in [PROJECT_STATUS.md](PROJECT_STATUS.md).

## Ordered work

### 1. MathExam Workflow v1

Status: in progress as a docs-only change.

Move durable operating rules, status, review policy, task and PR templates, and
repeatable Codex skills into the repository. No production runtime or deployment
change belongs here.

### 2. Nested-path foundation

Status: not started.

Establish and verify path behavior needed by trainers below nested routes. Keep
the scope independent from adding a new mirror trainer.

### 3. Roads-grid third mirror proof

Status: not started.

Use roads-grid to prove that the platform can add a third mirror trainer through
the shared contract without new trainer-specific board or server core logic.

### 4. Inventory of unpublished trainers

Status: not started.

Create a verified inventory of trainers that exist locally or as drafts but are
not published. Classify readiness, ownership, path requirements, and adaptation
risk before scheduling batches.

### 5. Trainer Factory v1

Status: not started.

Define a repeatable creation and validation pipeline only after nested-path and
third-mirror evidence are available. Treat a new factory pattern as
`NEW_ARCHETYPE` review unless an accepted ADR narrows it.

### 6. Batch publication and adaptation

Status: not started.

Publish and adapt trainers in bounded batches. Each independently reviewable
batch receives its own task specification, branch, PR, tests, and rollback
description.

## Sequencing constraints

- Do not start nested paths or roads-grid inside Workflow v1.
- Do not use plans or model advice to override code, gates, approved scope, or
  accepted ADRs.
- Reorder or combine roadmap items only with an explicit owner decision and an
  updated task specification.

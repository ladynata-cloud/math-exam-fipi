# Geometry OGE first part: selected cabinet and contextual help

## Identity

- Task: `OGE_GEOMETRY_ASSISTANT`
- Owner: repository owner
- Date: 2026-10-28 (Asia/Novosibirsk)
- Base branch: `feat/math-assistant-cabinets-20261027` (dependent on PR360)
- Base SHA: `1fcc4fa36267f5667c42409861ef0b92f97b333c`
- Planned branch: `feat/oge-geometry-assistant-20261028`
- Review level: `HIGH`
- Related ADRs: accepted ADR0010 and ADR0011; ADR0001 remains Proposed.

## Goal

Bring together the five existing first-part OGE geometry trainers in the selected
existing cabinet, improve identified learning/state defects and connect useful
MathExam help. Reuse the prepared cabinet assistant instead of creating a second
service. Checked offline help must work without a model key; optional external
inference retains the existing disabled-by-default boundary.

## Context and evidence

- Production main was observed at `8723d6bfb19e64d43c474b1fc7116fe8630ec20a`.
  PR335 is merged; its five canonical trainers are already present in the selected
  cabinet's saved plan, verified read-only through the authenticated teacher UI.
  No private account identifiers or records belong in this repository.
- PR358/359/360 prepare the assistant service, evaluation and selected-cabinet
  gateway. None is merged. PR361 is unrelated public navigation work and is not
  a dependency of this task. Main's subsequent PR362 is unrelated trainer content.
- The existing geometry cards are public practice, not managed cabinet attempts.
  Their individual progress must not be reported as server-saved cabinet results.
- FIPI's published 2027 materials are still labelled projects. Number 16 includes
  a square/circle area example and number 17 a divided trapezoid midline. Preserve
  broad topic coverage rather than claiming a fixed narrow theme per exam number.
- Initial audit found a native-event timing risk in the 16–18 board adapter and
  assisted correction clearing the task19 review queue. Reproduce before fixing.

## Approved scope

### In scope

- All five canonical trainers, their bounded shared geometry UI/adapters and
  relevant regression tests. Retain existing banks and generated task identities.
- A clear geometry collection in the existing cabinet and selected-topic entry
  into the existing MaxExam panel.
- An explicit learner action transferring only the current public mathematical
  condition/topic into the cabinet helper; no account data, pictures, complete
  browser state or hidden answer key. Preserve original work and record help.
- State clearly when the drawing or later changes in the original task are not
  visible to the helper. Treat transferred text as untrusted, bounded input.
- Checked deterministic guidance for a bounded set of fully specified geometry
  questions; reject unsupported or insufficient conditions honestly. Keep the
  existing provider and budget controls.
- Fix demonstrated assistance-accounting, event-order, work-retention and
  presentation defects. Reuse the actual native task and optional help.

### Out of scope

- New foundation-model providers, paid calls, model training or autonomous
  changes to teaching knowledge. No purchase, credentials or hosting changes.
- Changing real account credentials or other pupils' profiles, or publishing
  private data.
- A new universal managed-trainer protocol or migration of existing learner work.
- Replacing the entire OGE bank, second-part geometry, or unrelated course work.

## Acceptance criteria

- [x] One clear collection opens each canonical trainer and the existing helper.
- [x] Full conditions/drawings and entered work survive opening/closing help.
- [x] Help provenance remains sticky; assisted success is not independent mastery.
- [x] Native first actions and changes mirror without requiring a second action.
- [x] Explicit condition transfer is bounded, source-allowlisted and cannot
      select accounts, activate external inference, execute markup or erase work.
- [x] Supported mathematical helper answers have independent exact oracles;
      unsupported questions are not claimed as checked solutions.
- [x] Existing geometry, cabinet-assistant, account and board gates remain intact.
- [x] Desktop/mobile actual-browser evidence and limitations are recorded.

## Checks and gates

- Required: relevant mathematical banks, board/native input and state transport,
  task19 assistance, cabinet plan/route/assistant, service and gateway suites.
- Static: syntax, allowed link destinations, exact scoped diff, `git diff --check`.
- Manual: desktop/mobile condition, drawing, help, transfer, original-work retention.
- Final local gate: `OGE_GEOMETRY_ASSISTANT_LOCAL_OK`; not a release authorization.
- Live deployment/provider/real-pupil checks remain not run while the relevant
  services and access are unconfigured; synthetic tests must not be represented
  as a real learner trial. Existing explicit provider/budget controls remain.

## Review plan

- HIGH is retained as a description of the technical risk: assistance accounting,
  service answers and cabinet integration cross several runtime boundaries.
  Independent technical review and relevant regressions are completed.
- The sanitized design question for any later consultation is whether one
  small hint tied to the public task, retained steps and explicit transfer can
  help without giving away the answer or misclassifying assisted work.
- Local Anthropic credentials are not configured (presence only checked).
  Design consultation is unavailable/not completed, not advice or approval.
  Technical preparation and checks are complete. The owner withdrew the earlier
  supplied AGENTS.md instructions for this task; their separate consultation/
  exception gate is no longer a condition imposed on this increment.
- Independent technical and mathematical reviews use public code and synthetic
  examples only. Record their actual findings and limits separately from Claude.
- Any later external review should record provider, PR, exact base/head, verdict
  and verifiable timestamp/source. No external review or historical waiver is claimed.

## Risk and rollback

- Risks: false mathematical confidence, task/figure mismatch, stale help context,
  loss of learner drafts and incorrect assistance credit. Narrow supported math,
  explicit context labels, bounded parsing and regression journeys address them.
- Rollback: ordinary scoped revert of this dependent delta; leave existing
  learner keys, databases, request reservations and prerequisite history intact.
- No real account migration, data deletion or provider configuration is performed.

## Current task instruction

- The current owner request starts the geometry improvement and helper work.
- During implementation, the owner explicitly withdrew the previously supplied
  AGENTS.md instructions. This record does not reinstate a separate START,
  mandatory Claude exception or merge-approval workflow for the current task.
- Implementation, validation, local commits and publication of this prepared
  change continue under the current request.
- The reviewed code is published as a Draft while its unreleased dependencies
  and separate helper-service configuration remain unresolved. Production
  deployment and real-account activation have not happened; this is a factual
  readiness boundary, not a claim of a new owner approval requirement.

## Execution record

- Actual branch: `feat/oge-geometry-assistant-20261028`.
- Actual base: `1fcc4fa36267f5667c42409861ef0b92f97b333c`.
- Implementation and local checks complete; see the
  [evidence report](../reports/OGE_GEOMETRY_ASSISTANT_20261028.md).
- Added a narrow existing-gateway correction after independent review reproduced
  superscript flattening into a wrong certified answer. Privacy checks retain
  compatibility normalization; mathematical payloads preserve notation.
- Exact publication head, Draft PR and final remote CI are recorded in the PR
  handoff to avoid a self-referential commit SHA in this source file.
- No live account write, paid call, merge, automatic merge or deployment.

## Required handoff

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

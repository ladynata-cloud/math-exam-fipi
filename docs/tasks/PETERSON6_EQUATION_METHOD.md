# MathExam task specification: Peterson 6 equation method

## Identity

- Task: PETERSON6_EQUATION_METHOD
- Owner: repository owner
- Date: 2026-11-02 (Asia/Novosibirsk)
- Base branch: main
- Base SHA: `6b9c327f2ca438cb7e7620ef302876de467fac19`
- Planned and actual branch: `task/peterson6-equation-method-20261102`
- Review level: HIGH (retained learner work across a content revision)
- Related architecture: existing course, choice/number steps and board projection.
  No new architecture is inferred from Proposed ADR0001.

## Goal

Teach the existing Peterson grade-six word problems through an explicitly
defined unknown, related expressions, an equation or literal model, solution
and a check against the original condition. Align the course, separate practice
line, generated analogues, hints, diagrams and printable material with the
school method requested by the owner.

## Context and evidence

- The owner explicitly gave START for this task in the current conversation
  after the source audit and concrete scope were presented.
- Current main contains 14 topics / 224 cards / 333 original steps and 20
  arithmetic practice skills. The separate line contains 13 modules,
  27 source entries (26 unique subparts), 22 generated word-problem families
  and four printable PDFs. The 13 conversion subparts retain their purpose.
- The original source problem 303 uses 385 km and ratio 1.2. The unknown speed
  cancels in `385/(2.2x) * 1.2x = 210`; it is not uniquely determined.
  Printed analogue parameters (270 km, 1.25) must not replace this condition.
- Source problem 305 uses 4/3 hours and 96 km: `(x+3x)*4/3=96`.
- Existing saves associate drafts with step positions; line condition keys
  additionally contain step labels and expected answers. Replacing those
  blindly would misinterpret or reject previous work.
- PR355 and PR367 remain separate unpublished drafts. Their content was
  inventoried read-only; this task does not resume, merge or publish them.

## Approved scope

### In scope

- All applicable word-problem models in the current 224-card course and all
  current line word families, including fixed source examples and analogues.
- Explicit choice of the unknown, meaningful equation/relationship selection,
  numeric solution steps and original-condition checks. Existing typed choice
  and numeric interactions; no unrestricted expression evaluation.
- Preserve the original conditions, answers, source labels and task identities.
  Keep logic, arithmetic, conversions and constructions faithful to their goals.
- Version teaching content; preserve legacy drafts, notes, help history and
  completions with their original method, and distinguish new-method learning.
- Adapt symbolic fraction rendering, contextual help and relevant models.
- Update three printable word-problem documents and keep the two-page
  percentage conversion PDF byte-identical. Add reproducible PDF sources.
- Targeted mathematical, saved-work, DOM/browser and existing board gates;
  bounded board content-version metadata if necessary to prevent old rooms
  from silently interpreting changed steps.
- Reconcile PROJECT_STATUS from primary release evidence in this same PR.

### Out of scope / protected areas

- PR355/PR367 implementation, release or branch reconciliation.
- Other courses, actual pupil records or assignments, credentials, authentication,
  billing, hosting configuration or paid external inference activation.
- Merge, auto-merge and deployment.

## Acceptance criteria

- [x] All identified word-problem families use the requested modelling method.
- [x] The learner acts on the unknown and equation, not merely reads a final formula.
- [x] 303 uses unknown speed and cancellation; 305 retains its original data.
- [x] Fixed and generated answers independently match original conditions.
- [x] Legacy unfinished and completed work survives reload, import/export and
      navigation, and is not relabelled as independent equation-method mastery.
- [x] Help stays optional, previously completed steps remain visible, numeric
      and choice inputs are clearly labelled, and fractions render horizontally.
- [x] Printed conditions and homework numbers remain complete and legible.
- [x] Relevant local and exact-head CI evidence is recorded without hiding
      failures, unavailable checks or external-review limitations.

## Checks and gates

- Existing course build/content, exact math, state, model and DOM checks.
- Existing line mathematics, retained work, source examples and portable assets.
- New independent content oracle, revision compatibility and generated-family
  coverage checks; actual desktop and 320/390 px learner journeys.
- Existing affected helper/board/registry tests and synthetic board browser gate.
- PDF extraction, condition/answer coverage and visual inspection of all pages.
- Final diff, source identity, syntax, reproducible bundles and `git diff --check`.
- Final gate marker: `PETERSON6_EQUATION_METHOD_LOCAL_OK` only after executed gates.
- Real-pupil trials and production publication are not performed in this task.

## Review plan

- HIGH because semantic changes must preserve saved work and board boundaries.
- Trainer consultation applicable: yes, a substantial change to teaching steps.
- Before implementation: a focused brief and independent internal mathematical
  audits were prepared. Claude consultation is UNAVAILABLE: no authorized
  Claude/Anthropic tool is exposed. No provider request or verdict is claimed.
  Continue useful scoped preparation and checks under the consultation policy.
- Ready-result review: independent mathematics/content and implementation review,
  actual learner interaction evidence, then exact-head external review or a
  separate current owner exception before release. Earlier waivers are not reused.
- Remote handoffs contain only minimal public source and synthetic cases, without
  pupil identities, screenshots, private documents, secrets or machine paths.
- Any external verdict must identify provider, PR, base, head, verdict and source.

## Risk and rollback

- Main risks: changed step meanings, lost work or assistance, answer-format
  regressions, stale diagrams, fractions, and outdated printed explanations.
- Keep original content readers and method-tagged old work; no data deletion.
- Rollback requires a separately authorized code revert. If necessary, legacy
  storage remains readable and the new-method records must be preserved for
  forward restoration. Never overwrite learner data to make a gate pass.
- Updated board content must use an explicit compatible version; existing rooms
  must not silently replay old step positions against new teaching content.

## Permissions

- START in current task conversation: yes.
- Branch, local commits, push and one Draft PR: yes under the repository workflow.
- Merge, auto-merge and deployment: no; separate owner authorization required.
- External-review waiver: not granted for this task.

## Execution record

- Actual base: `6b9c327f2ca438cb7e7620ef302876de467fac19`.
- Clean isolated checkout and current authoritative remote main verified.
- Local implementation and final checks are complete: see
  [verification](../reports/PETERSON6_EQUATION_METHOD.md). Both independent
  internal reviews are READY after fixes. Exact-head CI and publication identity
  are recorded in the Draft PR; external Claude review remains unavailable.
- Final local gate: `PETERSON6_EQUATION_METHOD_LOCAL_OK`.
- Board content 1.1.0 explicitly rejects older room snapshots; personal saved
  work supports both teaching versions. No old-room migration is claimed.

## Required handoff

Use the repository EXECUTIVE STATUS fields: Task, PR, Base, Head, Gate, Tests,
Failures, Not run, Scope deviations, Recommendation and Next user decision.

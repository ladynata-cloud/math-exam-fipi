# Atanasyan: beginning geometry through elementary constructions

## Identity

- Task: `ATANASYAN_FIRST_STEPS_CABINET`.
- Owner: repository owner.
- Date: 2026-10-28 (Asia/Novosibirsk).
- Base branch: `feat/math-assistant-cabinets-20261027` (Draft PR #360).
- Base SHA: `1fcc4fa36267f5667c42409861ef0b92f97b333c`.
- Planned branch: `feat/atanasyan-first-steps-cabinet`.
- Review level: `HIGH` (authenticated helper context and cabinet integration).
- Architecture: accepted ADR 0011; existing cabinet authorization and helper
  boundaries. ADRs 0001 and 0006 remain Proposed.
- Dependencies: Draft #360, itself dependent on Drafts #359 and #358. This task
  neither merges those branches nor incorporates unrelated main changes.

## Goal

Give one owner-selected existing grade-seven cabinet an ordered course to the
Atanasyan textbook, from its beginning through elementary constructions, with
an individual condition, drawing and retained walkthrough for every problem,
and course-aware MathExam assistance through the prepared independent helper.

## Context and evidence

- The current source is Atanasyan et al., 7–9, basic level, 14th revised edition,
  2023. Source identity is recorded in the existing textbook inventory.
- The requested endpoint is theory point 23 and main exercise 160. Main
  exercises 161–190 are the subsequent additional chapter-II set.
- Source already contains all 160 numbers / 232 subpart cards, 23 theory
  cards, 682 exercise explanation steps and individual planar models.
- Existing managed/board exercise 92a has a deliberately fixed contract.
  Attaching the whole course does not expand that contract or certify proofs.
- Draft #360 supplies selected-cabinet help and default-off external inference.
  It is prepared code, not a live model or a published service.
- Current remote main was separately observed at
  `8723d6bfb19e64d43c474b1fc7116fe8630ec20a` (PR #362); its unrelated
  Peterson/SEO changes must survive the eventual composition.

## Approved scope

### In scope

- A bounded ordered view of the existing reviewed 255 source cards, with
  exact exercise/subpart/page mapping and deterministic source extraction.
- Task and drawing together; one short step at a time; retained earlier steps
  and writing; explicit help and manual-review semantics.
- Account-scoped browser-local course records and export, clearly distinguished
  from server-saved cabinet attempts. Reuse prior public-course writing only
  with an explicit import action; never copy it into another person's record.
- Native cabinet course entry using the existing versioned teacher profile,
  selected explicitly. Preserve current assignments, attempts and other routes.
- Extend the prepared assistant with verified course/step context and the
  initial-geometry/construction topics. Reuse its independent service,
  authentication, ownership, quotas, privacy and default-off provider boundary.
- Same content can be opened as a public standalone course; authenticated help
  stays in the cabinet. Source data and renderers are trusted static assets.
- Relevant content, saved-work, context validation, authorization, UI/mobile,
  regression and real synthetic two-service checks; one Draft PR.

### Out of scope and protected areas

- New textbook exercises beyond 160, invented replacements, full-book completion,
  automatic verification of arbitrary proofs, or a claim of trained model weights.
- Changes to the sealed textbook engine/content/models, the fixed 92a contract,
  existing board protocols, credentials, account creation, or database schemas.
- Real provider calls, spending, provider activation, new model accounts,
  hosting changes, weight training, main merge or deployment.
- Actual pupil details, private notes and secrets in source, tests or PRs.

## Acceptance criteria

- [x] Every number 1–160 and every existing subpart is included exactly once;
  theory 1–23 is available; later tasks do not enter the bounded route.
- [x] Full task, source number, diagram and visible saved writing remain together.
- [x] Opening/closing help and navigating away/back preserve work; assistance
  remains recorded; no unreviewed proof receives automatic correct credit.
- [x] Local work is separated by account and from the old textbook namespace;
  unavailable persistence is reported without erasing the on-screen work.
- [x] Teacher-selected delivery is additive and leaves other pupils unchanged.
- [x] Course context is server-resolved from reviewed data; client-supplied
  solution text, invalid IDs, out-of-range steps and foreign profiles are rejected.
  In-range local progress is not claimed to be server-verified.
- [x] Stale/late helper replies cannot move to another task or account; existing
  consent, assessment, quota and external-provider protections remain intact.
- [x] Desktop and narrow-screen flows work with actual browser input.

These checks concern prepared code and synthetic accounts. They do not record
activation for a real pupil or publication of the dependent assistant stack.

## Checks and gates

- Existing strict Atanasyan source/model/build and fixed-92a regression gates.
- New extraction identity/boundary checks, local-state/retained-help UI tests,
  course selection and old-profile preservation checks.
- Full assistant and board-server tests, targeted helper browser and real
  synthetic two-service course-context flow, without provider requests.
- Syntax, affected links/packaging, final diff and `git diff --check`.
- Final preparation marker: `ATANASYAN_FIRST_STEPS_PREPARED_OK`.
- Real-pupil learning outcomes, live inference, publication and actual cabinet
  activation are intentionally unclaimed before the release decision.

## Review plan

- Independent mathematical/source and technical/security review of this patch.
- Claude design consultation applies to the new ordered/helper presentation.
  No general authorized Claude integration is available in this environment;
  consultation is unavailable/not completed, not an approval or waiver.
  Continue useful preparation and technical checks under the consultation policy.
- Before implementation, the learning question is: can a learner identify the
  objects, state the goal, name the next action and explain its basis without
  losing the whole condition or earlier work? Avoid passive answer copying,
  misleading drawings and automatic proof marks.
- Ready-result review must inspect source identity, all section boundaries,
  representative proofs/constructions, actual screenshots and test evidence.
- HIGH external ready-result review is required, or a current explicit owner
  exception with rationale. Prior-task exceptions are not reused.
- External evidence must identify provider, PR, base, head, verdict and source
  or timestamp; sanitized public/synthetic material only.

## Risk and rollback

Risks are cross-account local records, forged helper context, stale responses,
misstated proof progress and incomplete deployment packaging. Validate the
course projection on both service boundaries and reuse existing account fences.
Disable the selected course/helper entry or revert this one patch to roll back;
preserve browser records and all existing cabinet databases/attempts. No schema
migration or deletion is part of rollback.

## Permissions

The owner's direct instruction to create this bounded course in the existing
cabinet and connect a helper is the START for this task, consistent with the
repository's 92a and assistant-cabinet task precedent.

- Branch, local commits, ordinary push and Draft PR: allowed.
- Ordinary selected-cabinet configuration: authorized, but performed only after
  deployment and authenticated identity/current-version verification.
- Merge, auto-merge and deployment: **not authorized**.
- Paid inference or provider/billing configuration: **not authorized**.

## Execution record

- Actual branch/base: as above; clean isolated worktree verified.
- PR/head/commits: recorded in the task's Draft PR metadata to avoid a
  self-referential source commit.
- Tests passed/failed/not run: see the
  [scoped report](../reports/ATANASYAN_FIRST_STEPS_CABINET_20261028.md).
- Scope deviations: none.

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

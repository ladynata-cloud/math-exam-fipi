# One profile course: positions 1–13 and 16

## Identity

- Date: 2026-10-10
- Base: `main`, `f2a8ba0c6b721446209b4e1c3b83134733f3036d`
- Branch: `feat/profile-unified-course`
- Review: MEDIUM — bounded public navigation, reversible; no persistence contract change.
- Architecture: existing public static trainers and existing prerequisite lessons.
  Accepted ADR 0010 account/frame boundaries remain unchanged.

## Goal and evidence

The owner asks for one menu of exam positions, including already-developed №16,
and short school-topic detours only when needed. The supplied screenshot is the
standalone planimetry trainer, while the calm course catalogue previously linked
only its own first-part lessons. The existing №16 page was outside that catalogue.

## Approved scope

- Preserve all 68 lessons / 408 authored tasks and the exam-first route.
- Add №16 beside positions 1–13; retain the existing 13-item first-part checkpoint.
- Group 20 existing public trainer/course entries under their corresponding
  course number; attach navigation on those entries and two exercise pages.
- In standalone trainers, offer relevant existing prerequisite lessons in a
  closable panel, keeping the original document, step and draft mounted.
- Preserve the owner’s stacked sine/cosine fractions in the newly surfaced
  triangle foundation introduction.
- Make the profile hub's primary entry the unified catalogue.
- Preserve existing direct URLs, question engines, mathematics and progress keys.

Out of scope: cabinet/authentication work in the neighboring task; database/API
changes; merging separate trainers' score stores; new exam questions or renumbering
the preserved 2026 materials. The navigation is omitted in embedded trainers.

## Acceptance and gates

- [x] The main menu contains 1–13 and 16, with no invented position 14.
- [x] Existing trainer links are available within the appropriate numbered topic.
- [x] №16 exposes ordinary, logarithmic and nested-logarithm work already written.
- [x] Relevant school support is optional, with an explicit return action.
- [x] Returning from support preserves the original task, step and input.
- [x] The existing course marks supported work as assisted and retains drafts.
- [x] Navigation and support fit 360px and 1280px layouts.
- [x] Account, board, state and score contracts are unchanged.

Required checks: unified-course browser robot (all 22 attached pages, both widths),
existing exam-first browser robot, inequality journeys, map/checkpoint unit tests,
existing profile regression, exact-head profile CI, `git diff --check`.
Final gate: `PROFILE_UNIFIED_COURSE_OK`; source publication additionally requires
successful exact-head CI. Production gate: Pages deployment, asset identity and
live catalogue → №16 / standalone trainer → foundation → original task.

## Review and rollback

Focused code review checks fixed local link targets, no ambient query copying,
scoped CSS, focus restoration, original DOM retention, unchanged first-part
checkpoint and no new account/frame messaging protocol. External review is not
required for this MEDIUM change. Browser tests use synthetic data only and do not
measure educational efficacy.

Risks: legacy global styles may affect the added public navigation; a foundation
page may be slow to load. The return button stays outside the frame. Learner
progress is not migrated or aggregated. Roll back by reverting this task's source
delta with a normal reviewed commit; no data rollback is required.

## Permissions and execution

The owner's current implementation requests and standing cloud-publication
instruction authorize the scoped branch, tests, PR and ordinary publication.
Higher-priority session instructions retain that authorization without repeated
permission prompts. No force, reset, rebase, admin override or disabled gate.

Local results and exact publication head, CI and production evidence are recorded
in the task PR. Failed or incomplete gates must be stated separately.

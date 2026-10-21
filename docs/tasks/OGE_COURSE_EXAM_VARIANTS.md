# OGE course: exam-first variants and justified reasoning

## Identity

- Owner: MathExam project owner; request 2026-10-21.
- Base: main, `a006abab6ca2a0148c4b51739da0d5e080f39fe9`.
- Branch: `feat/oge-practical-exam-variants`.
- Review level: HIGH (several existing presentation adapters and native checks).
- Accepted context: ADR0003 and TRAINER_PRESENTATION_PRINCIPLES.md.

## Goal and approved scope

Continue the released tire presentation in the other seven practical storylines:
roads-grid, roads-schema, apartments, land-plots, stoves, tariffs, paper-sheets.
Show a continuous exam-like variant with original givens, primary accurate
figures, persistent tables and independently usable answer controls. Preserve
every existing prototype, including Q5-only road supplements and selectable
subtypes. Do not invent missing questions for partial source sets.

The owner expanded the same task to remaining existing OGE course trainers in
both parts, with same-page nested help, clear instructions, useful interactive
models and persistent written reasoning. Geometry proof steps must identify
the reason and offer verified textbook/reference support. Existing strong
6/9/11/13/19 engines stay intact and receive regression checks. The existing
task15 route is one external-angle lesson; a planned but absent 26-type bank
is not represented as implemented.

Excluded: EGE, unrelated grade courses, cabinets, authentication, server data,
paid Claude calls (explicitly deferred by owner), video production, textbook
scan reproduction, replacement of original mathematical banks or score rules.

The owner also requested optional green “Тест по Шине” knowledge checks before,
within and after the tire variant. Each starts with “Хочешь тест?”, checks terms
and relationships on independent examples, and never blocks the five problems.

## Implementation boundaries

- Add external adapters, retain reviewed inline engine hashes and native checks.
- Practical providers call original checkers with stable task identities; keep
  native DOM mounted separately from the visible continuous sheet.
- Main figures contain givens, not computed solutions. Accurate geometry and
  units take priority over decorative imagery. Distinguish separate schematic
  insets when source prose and legacy illustration do not describe one scale.
- Help and reference controls preserve drafts, task identity and earned work.
- Use official OGE sheets, not similarly named EGE assets. Textbook statements
  are original summaries with edition-specific source links, not invented quotes.
- Part2 written work is a saved draft; automated answer checks do not claim to
  grade arbitrary reasoning or award exam proof points.

## Acceptance and gates

- [ ] Seven storylines expose all available questions and every subtype.
- [ ] Tables and primary data stay present while help opens and closes.
- [ ] Native correct/wrong grading, progress identities and Board Bridge retained.
- [ ] Main diagrams are accurate, answer-neutral, readable and zoomable.
- [ ] Remaining course tasks have explicit actions and relevant reversible help.
- [ ] Part2 reasoning survives help/reference actions and task switches.
- [ ] Geometry arguments name theory; source links and OGE sheets are contextual.
- [ ] Node/DOM native baseline and new integration tests pass.
- [ ] Cloud browser checks cover 320/360/1280, all prototypes, offline package,
  keyboard access, drafts, help, reference return and runtime errors.
- [ ] Independent mathematical/source and actual screenshot review completed.
- [ ] Exact-head CI, normal merge, exact-merge Pages and live public checks pass.

Required gates: existing practical, course algebra/geometry contracts and
minimal tests; new adapter/proof tests; relevant existing 6/9/11/13/19 checks;
link checks, download rebuild and git diff --check. Browser execution is cloud
CI/CUA only. Native presentation regression harnesses may isolate the retained
engine from the new adapter, but the full new runtime must have separate actual
integration/visual coverage; no removed assertions or weakened math snapshots.

Final marker: `OGE_EXAM_VARIANTS_AND_REASONING_OK` (not a review verdict).

## Review and permissions

The owner explicitly requested implementation and cloud publication, repeatedly
authorized publishing in the conversation, and deferred paid Claude use. These
session instructions govern over local fresh-permission boilerplate. No paid
consultation/release verdict is claimed. Parallel independent code/math/source
and actual cloud screenshot review will be recorded with exact head evidence.

Creation, scoped commits, push, Draft PR, normal merge and deployment authorized.
No force/reset/rebase/admin override, changed protection, secret disclosure or
weakened gates. Query remote main before merge and inspect any concurrent delta.

## Risk and rollback

Primary risks: mutable native task selection grading the wrong card; data leaks
from legacy diagrams; lost drafts/proof state; stale source citations; mobile
overflow. Native checks, isolated per-card snapshots and integration/browser
coverage address these. Rollback is a normal revert of this scoped PR. Existing
progress schemas remain authoritative; new reasoning drafts use separate keys.

## Execution record

Started from the exact published PR292 main; clean dedicated worktree. The
preceding tire publication is reconciled in PROJECT_STATUS.md. Implementation,
exact-head checks, review and deployment evidence will be completed before merge.

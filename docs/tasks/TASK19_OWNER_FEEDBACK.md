# Task 19: owner feedback and analogous geometry models

## Identity

- Owner: MathExam project owner; explicit request to implement and publish in the cloud.
- Date: 2026-10-21 (Asia/Novosibirsk).
- Base: main, 43dc06bfa7bf503e3e9d455ced3ec05202b9e68e.
- Branch: feat/task19-owner-feedback.
- Review level: MEDIUM — bounded existing optional geometry experiments and reference help.
- Existing architecture: task19 modular pure geometry, state-owning host, local results,
  standalone downloadable bundle; no new backend, accounts or runtime platform.

## Goal and evidence

Implement 34 annotated examples from the owner's 35-page PDF (last page blank),
propagate matching defects to analogous models and identify pedagogically untouched
cards. The private annotated PDF is not committed. Page-to-card mapping is retained
in the focused tests and the feedback coverage report.

The owner separately requested tasks1–5 and task6; those remain separate tasks,
branches and pull requests. Task13 was already released and verified before this work.

## Approved scope

- Correct equal-segment ticks, angle equality classes, right-angle squares, heights,
  opposite sides, colored correspondence and numerical observations.
- Remove visually inert size controls; retain controls whose physical size or shape
  genuinely changes. Provide six consistent side/opposite-angle controls for the
  two comparison cards, preserving one valid triangle throughout.
- Add keyboard/touch/hover correspondence with reduced-motion support.
- Use genuine FIPI reference sheet excerpts where the relevant formula is present.
  Keep complete sheets and crop coordinates for future video: show full sheet first,
  then zoom into the needed region. No video is made in this task.
- Preserve canonical card IDs, aliases, truth values, grading and existing results.
  The single requested statement wording edit is prev-011, removing «внутренних».
  Retain original source wording and mark that mapping semantically equivalent.
- Rebuild the downloadable HTML with embedded reference images for offline use.
- Reconcile task13 production status; no unrelated content/backend changes.

## Acceptance and verification

- All direct remarks and shared analogies covered; untouched list checked against
  actual changes, not merely absence of direct PDF annotations.
- Mathematical marks agree with actual coordinates, including coincident equalities
  and right angles reached by a slider. Side edits preserve the other two sides.
- Explorations and reference help never grade an answer; saved state retains locked
  premises and current experiment. Reference links identify the project2027 sheet.
- Existing math/state tests plus targeted feedback regressions, browser journeys on
  desktop/mobile for all34 annotated cards and representative analogies.
- Focused independent review; exact reviewed head and published artifacts verified.
- Gate: TASK19_OWNER_FEEDBACK_PASS, only after all relevant checks succeed.

## Review, risk and rollback

Paid Claude consultation remains deferred by the owner's explicit decision.
No provider approval is claimed. Independent review checks mathematics, labels,
state and accessibility. Public handoffs contain no private PDF or credentials.
Risks: visually misleading equality marks, inconsistent linked sliders, mobile label
collisions, stale offline bundle. Revert this task's ordinary merge to restore the
previous trainer; browser records keep the same compatible storage schema.

## Permissions

Cloud implementation, normal commits/push/PR, merge and publication were explicitly
authorized in the conversation and remain authorized. No force/reset/rebase/admin
operation or gate weakening. Recheck authoritative main and exact PR head before
publication; inspect any concurrent change before composing releases.

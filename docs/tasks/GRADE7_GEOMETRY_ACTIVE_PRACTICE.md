# Active practice and complete workbook coverage

- Owner instruction, 2026-10-16 (Asia/Novosibirsk): add more tasks, interaction and gamification; check every part of the supplied workbook.
- Base: reviewed, unpublished PR 248, `feat/grade7-geometry-rebuild`, commit `6a7021bbd5971ce909769b2b819d5f2d1b1f2da0`.
- Branch: `feat/grade7-geometry-active-practice`; stacked Draft PR against that base branch.
- Review: HIGH, because new catalog entries are loaded by the existing managed runtime. Reuse PathData, grade7-construction and the existing version-1 task/state contracts. No new protocol, archetype or persisted state fields.

## Scope

Add original practice for gaps found in all 17 source sections; a page/exercise-to-skill map for all 73 numbered exercises, theory, self-checks and the answer section. Add diagram selection, checked constructions and short reasoning challenges to the existing exploration model. Use visible progress and completion rewards without timers, lost lives, rankings or claims that assisted exploration is independent mastery. Preserve existing learner state, old generated tasks and the original course.

Owner clarification: retain two separate visible geometry routes — source-photo proofs (SAS, then a short SSS branch) and the complete workbook. Redraw only the three visible proof diagrams; keep prior personal plans and attempts intact. Add route navigation through existing cabinet attempt handlers.

## Verification

Run independent mathematical oracles for new generators; all original content and catalog/contract gates; browser interaction, read-only, restoration, feedback and narrow-screen checks. Inspect representative rendered screens. Independently recalculate new answers instead of trusting workbook keys. Record exact boundaries of the source review, especially handwritten/free-form proofs.

## Authorization and release

The user's direct request authorizes implementation, tests, commits, pushing and a reviewable Draft PR. It does not separately authorize merge/deployment. PR 248's publication/external-review prerequisites remain unresolved. No learner-plan writes, credentials or uploaded source pages are included. External HIGH review remains pending; do not claim an external verdict.

## Rollback

Revert the scoped additional commit after normal review. Preserve all learner records. Version-1 model state remains selected/built/revealed; old records and old task outputs must remain valid. No destructive data rollback is needed.

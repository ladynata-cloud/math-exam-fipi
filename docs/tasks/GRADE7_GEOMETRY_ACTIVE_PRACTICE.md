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

The initial request authorized implementation, tests, commits, pushing and a reviewable Draft PR. On 2026-10-16 (Asia/Novosibirsk), the owner additionally authorized publication and placement of both routes in the existing pupil cabinet. PR 249 is the composed release, including PR 248, against production base `e01b2780f16f9771defee5d862eec6de581a554f`. Record exact-head review, gates and deployment evidence in that PR. Cabinet placement preserves the existing recommendations and attempt history; private learner records and uploaded source pages stay outside Git.

## Rollback

After a production failure, pause further rollout and prepare a reviewed corrective release. For a workshop/navigation regression, restore the prior UI behavior while retaining all new task metadata, generators, catalog entries, server/client loaders and circle rendering. Version-1 model state remains selected/built/revealed. Verify that both old and newly created attempts can reopen, save and be checked before releasing the correction.

A full revert to the pre-course base preserves database rows but removes the new IDs from the allowlist: new attempts then fail with `LEARNING_TRAINER_UNKNOWN` and cannot be continued until compatibility is restored. It is therefore not the normal rollback once pupils have started new tasks. Never delete learner records or claim that row preservation alone keeps those tasks usable. A data-compatible fix forward is required for generator/contract defects.

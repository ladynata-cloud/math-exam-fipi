# Atanasyan 2024 — symmetry continuation

- Date: 2026-10-24, Asia/Novosibirsk.
- Owner START: current request to continue the course.
- Base: main, `07189de58b7f5d60c02ea6ca6aa9450a324a377f`.
- Branch: `feat/atanasyan-symmetry-276-278`.
- Review level: HIGH (source interpretation and mathematical explanations).

## Goal and scope

Continue after the published pyramids with a coherent symmetry block: four
focused theory35 cards and all parts of exercises276–278. Exercise278в is
split into an ordinary regular triangular pyramid and a regular tetrahedron.
There are15 authored cards,50 justified steps, separate progressive3D models,
contextual help and manual proof prompts. Reuse the existing renderer and schema.
Source: supplied Atanasyan2024, printed78–80,84 / PDF80–82,86; visual source pages
were inspected. Private PDF and source images stay out of the repository.

## Publication boundary

Cards are `in-review` in `tools/stereo-textbook/pending-symmetry`, outside the
production builder. No existing lesson, source contract, review registry,
production bundle, learner progress or runtime is changed. The preview renders
draft data directly; it does not promote review flags or certify mastery.
The proposed point35 source contract requires independent completeness review:
four focused lessons do not by themselves prove every textbook example covered.
Practical271–275, theory36–37, exercises279 onward remain pending.

## Review and checks

Source, mathematics and pedagogy flags remain pending until independent review.
Author checks include schema/runtime validation, all reachable model views,
geometry integrity and an independent algorithm enumerating the isometry groups
of the actual vertex sets. An independent algorithm is not an independent reviewer.
Paid Claude remains deferred under the existing course scope; no verdict claimed.
No new interaction archetype or architecture is introduced.

Required: draft contract tests, coordinate oracle, inherited source/schema/content/
model/runtime gates, actual draft preview browser inspection at mobile and desktop
widths, then independent content review and normal exact-head release checks.
The new block has no release approval marker. Production integration is a later
step after the reviews; its exact counts and registry must then be updated openly.

## Risks and rollback

Main risks: confusing arbitrary rotation with half-turn symmetry, dropping the
regular-tetrahedron case, finite drawings of infinite half-planes and leaking
auxiliary constructions. These are explicitly explained and checked. Draft
removal is a normal revert; production content and learner state are untouched.

## Permissions

Branch, scoped edits, checks, commits, push and Draft PR are authorized by the
current continuation request. Merge/publication is not performed by this task.
No force, reset, rebase, paid call or changed release gate is authorized.

# Makarychev algebra 7 (2024), full topic course

- Date: 2026-10-24 (Asia/Novosibirsk)
- Base: main, 07189de58b7f5d60c02ea6ca6aa9450a324a377f
- Branch: feat/makarychev7-full-course
- Review: MEDIUM, reusing the published Makarychev 8/Peterson course interaction.
- Owner request: create an analogous course from the supplied grade-7 textbook; cloud work remains the user's preference.

## Scope

Add an isolated route school/makarychev7/ with all 46 numbered topics in six chapters: original concise theory, relevant interactive models, selected source-verified textbook exercises and explicitly labelled authored practice. Provide a complete exercise-number navigator without claiming individual solutions for every number or subpart. Preserve input, worked steps, optional contextual hints, independent/assisted progress and separate computation practice with return to the same task. Add the course catalog entry and reviewed sitemap seed. Keep existing grade-7 foundations, pupil records, backend and board integrations intact.

## Design and source

Use the supplied 2024 textbook as the source of topic sequence and selected tasks. Do not publish the uploaded PDF. All new theory and explanations are original. Mathematical graphics use code/SVG. Reuse the previous course's calm green interface, horizontal fractions and visible completed steps.

Claude consultation is currently unavailable: no suitable connected tool or configured ANTHROPIC_API_KEY is present. No external advice or approval is claimed. Continue authorized implementation and independent content/code review; record missing external review honestly at handoff.

## Acceptance and verification

All 46 topics; at least three theory blocks and six tasks per topic, including two source tasks/subparts. Source numbers/pages checked against the supplied PDF. Mathematical model, answer/state and full task-journey tests; course-isolated import/export and computation detours; deterministic build, sitemap checks and independent review. Browser inspection only through an available approved preview path; report any unavailable verification explicitly.

## Release and risk

The new request authorizes creation of the analogous course. Prepare the complete, reviewable result and scoped PR; assess publication authorization against the session context before release. Do not alter unrelated branches or production learner data. Risks: textbook transcription, accepted symbolic notation and browser-storage availability. Rollback removes only the additive course, catalog and sitemap changes; no learner data migration.

## Execution record

Completed 46 topics, 160 theory blocks, 276 tasks (92 source, 184 authored), 795 worked steps and 10 model families. All 1247 exercise headers map exactly to source sections/pages. Chapter authors and independent reviewers checked every selected source task and all mathematical steps. All task/step DOM journeys, 46 model mounts/727 changes, input/state/import regressions and computation detours passed. Two ambiguous comma-pair aliases found during review were removed and regression-tested; the grade-eight export envelope is explicitly rejected. Selected source coverage is labelled in the course.

Desktop visual QA succeeded through the managed cloud preview. A 390 px responsive iframe inspection of the half-plane lesson/model passed without horizontal overflow. Final CI and deployment evidence belongs in the PR. External Claude review remains unavailable; no such approval is claimed. Concurrent board-tools release d524c9107133d6a948ff11c18095b5ca01b660de is independently scoped and preserved; the project-status additions use a distinct insertion point to avoid overwriting its record.

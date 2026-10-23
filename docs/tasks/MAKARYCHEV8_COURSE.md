# Makarychev algebra 8 interactive course

- Date: 2026-10-24 (Asia/Novosibirsk)
- Base branch: main
- Base SHA: 1f9d8aec82bd2909917ab22746d94571d87c59c4
- Branch: feat/makarychev8-course
- Review level: MEDIUM; reuse the existing Peterson static course interaction.
- Owner scope: create an interactive course from the supplied 2024 textbook, with theory and worked solutions in the style of the latest courses; perform all work in the cloud.

## Scope and acceptance

Cover all 51 numbered topics in six chapters, with original concise theory, interactive models, selected source-verified textbook tasks and clearly labelled authored practice. A complete exercise navigator must not imply all 1340 numbered exercises have individual solutions. Reuse the existing small-step interaction, horizontal fractions, optional contextual hints, preserved input and completed steps, separate independent/assisted progress, and computation detours with return.

Create the standalone route school/makarychev8/ and a course-directory entry. No learner account, backend, shared-board protocol, production data, or unrelated course changes.

## Review and checks

Source and mathematical review by independent agents; schema, accepted answers, navigation, progress and recovery checks; mobile and desktop browser inspection; git diff --check. Final marker: MAKARYCHEV8_COURSE_OK.

Claude design consultation: unavailable in this runtime; no Anthropic connector or configured ANTHROPIC_API_KEY is available. Existing published Peterson workflow is reused. No Claude advice or release approval is claimed. Ready-result external review remains not completed; document this in the PR.

## Risk and rollback

Main risks are transcription of source mathematics, limited accepted symbolic answer forms, and browser storage availability. Check selected source tasks against PDF and use explicit input labels. Rollback removes the additive course directory and its catalog entry; no production records are migrated.

## Permissions

The initial user requests authorized implementation and testing. After reviewing the completed course and stated visual-QA limitation, the owner explicitly answered «Разрешаю» to the request to upload this course to the public ladynata-cloud/math-exam-fipi repository and publish it on mathexam.space. This authorizes the scoped course release and its required merge/deployment; it does not authorize unrelated changes.

## Execution record

- Implemented 51 topics, 172 theory blocks, 306 tasks (102 selected source tasks/subparts plus 204 authored), 958 worked steps, six model families and a complete number-to-section map.
- Independent reviews: chapter-I author reviewed chapter II; chapter-II author reviewed chapter I; chapter-III author reviewed chapters IV–VI; chapters-IV–VI author reviewed chapter III. Separate model author reviewed state and checker behavior. All reported findings were addressed.
- Passed: content/checker contracts for all tasks and steps; eight model-math groups; state/recovery checks; full 306-task/958-step in-memory DOM journeys; four import-preservation regressions; syntax and diff checks.
- Not run: browser visual QA (cloud browser policy rejected observation), actual pupil trial, external Claude review, live board/cabinet synchronization.
- Standalone static course only; browser storage is not cloud learner storage.
- Gate: MAKARYCHEV8_COURSE_TECHNICAL_OK; visual and external-review release limitations remain explicit.
- Publication check: the initial public-SEO gate found that the new route was missing from the reviewed sitemap seed manifest. Added the course seed and regenerated the sitemap; the sitemap regressions, deterministic generation check and public entrance metadata checks pass.

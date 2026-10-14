# Grade 7 geometry: rebuild understanding from the beginning

## Identity and authorization

- Owner: MathExam project owner; request dated 2026-10-15 (Asia/Novosibirsk).
- Base: `main`, `e01b2780f16f9771defee5d862eec6de581a554f`.
- Branch: `feat/grade7-geometry-rebuild`; one independent task and Draft PR.
- Review: HIGH for additive managed-catalog/server loading integration; reuse the existing task, model, checking and persistence contracts. No new archetype.
- The owner's direct instructions to create the course and do the work in the cloud authorize implementation, checks, commits, branch publication and a Draft PR. Separate merge/release authorization remains required by AGENTS.md.

## Goal

Turn the complete topic sequence of T. V. Sirotina, *Geometry. Grade 7. Exercise workbook* (Intellect-Centre, 2024, 88 pages) into original short interactive lessons for learners who missed the first foundations. Preserve the source's granular progression, explicitly correct verified mathematical omissions or misprints, and teach reasons rather than answer guessing.

## Scope

- Cover all seventeen source subsections, from points and lines to right-triangle congruence, with original generated conditions, diagrams, small reasoning steps and independent variants.
- Prioritize first triangle congruence, common sides, vertical angles and vertex correspondence. Explicitly distinguish third-criterion tasks from the first criterion.
- Reuse PathData and the grade7-construction renderer, with additive diagram support where needed. Make lessons selectable through the existing teacher catalog.
- Provide an organized grade-seven course entrance, source/coverage notes and a page-specific method review.
- Preserve existing task IDs, outputs, stored attempts, authentication, users, plans and unrelated courses. No original uploaded PDF or private student data in Git.
- Do not change PR 247, worker deployment, credentials or Amvera storage in this task.

## Acceptance and gates

- Every source subsection has an implemented route and a documented skill mapping; no placeholder lessons.
- Mathematical oracles verify numeric answers, diagram marks, vertex correspondence, sufficient conditions and boundary cases over generated variants.
- Guided explanations accumulate; wrong choices get useful feedback; independent work is not misrepresented as a full free-form proof assessment.
- Existing geometry outputs remain stable; relevant catalog, managed-contract and browser regression gates pass.
- Inspect desktop and narrow-screen navigation, diagrams, wrong-answer handling, guided progress and reload behavior in an authorized environment.
- `git diff --check`; independent code/content review. Record failed or unavailable checks truthfully.

## Risk and rollback

Main risks are diagram/condition disagreement, accidentally treating a theorem's converse as automatic, premature help disclosure and catalog/load-order mismatch. Additive IDs and existing version-1 task contracts avoid migrating old work. Roll back the scoped release commit through an ordinarily reviewed revert; retain learner records and previously generated task envelopes. No destructive data rollback.

## Release boundary

External HIGH review or an explicit owner waiver is pending. No merge, auto-merge or deployment is included in this implementation authorization. Final handoff must identify exact base/head, checks, failures, omissions and required owner decision.

## Implementation record

The scoped implementation contains 73 original micro-lesson families and a 17-section public entrance. Independent content review corrected premature answer disclosure in two diagram captions. Integration review preserved the original next-lesson sequence and scoped new question-identity normalization to the new course. Local mathematical/catalog/contract checks passed; the full server suite failed for missing local dependencies, and the exact-head cloud server/browser/container gates remain required. The Draft PR is the live evidence record.

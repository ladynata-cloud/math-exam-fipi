# Виленкин 5: подробный курс и связь с шестым классом

- Owner: Наталья Михайловна. Date: 2026-10-02.
- Base: main `de9109b1f7ba8cb7b2ed65026a7f6d6b3b0b96e8`.
- Branch: `course/vilenkin5-full`. Review: MEDIUM.
- Existing static Workshop architecture; ADR 0005 remains Proposed.

## Approved goal
Detailed original lessons aligned to the supplied Vilenkin grade 5 textbook (2023, third revised edition, two parts), with meaningful interactive ordinary/decimal fraction operations, prerequisite links from grade 6 with return, and opening from the existing board. Preserve all previous lessons and results.

## Scope and acceptance
- Cover the 51 textbook points with theory, worked examples, common mistakes, questions, guided steps, varied practice and independent checks. Do not claim solutions to every numbered exercise.
- Reuse already verified explanations and generators for genuinely shared skills; add missing grade-5 skills. Expose exactly which skills are shared.
- Fraction models: equal wholes, repartitioning, joining/removing shares, area multiplication, measuring division; decimals: place values, exchanges, multiplication scale, equivalent division and column algorithm.
- Bidirectional grade-5/grade-6 references, specific remediation, preserved return step and draft.
- Course/unit/lesson board links and searchable board catalog; preserve board data and existing synchronization boundaries.
- No backend, storage schema, account, domain, hosting or global policy changes. No source PDF uploads to the repository.

## Checks
Independent arithmetic calculations and invariants over varied seeds; all guided lesson flows in real Chromium; specific fraction interactions; wrong answers, help, return, new independent tasks; 360/768/1280 widths, keyboard, zoom, reduced motion; progress corruption/legacy/export; board iframe and catalog; existing Workshop and EGE CI; static links and diff check; public file identity and browser after publishing.

## Permissions and exception
The current request is START. Prior direct owner instructions authorize finishing and publishing the discussed courses and board updates without another final approval. The owner waived independent review and separate final acceptance to inspect the working site. This release records that exception; it does not claim external approval, change global policy, bypass protection, or authorize force/reset/rebase. Ordinary self-checks remain mandatory. If main changes, preserve unrelated work and revalidate the composed release.

## Risks / rollback
Main risks: incorrect mathematical models, overly coarse textbook coverage, links to wrong prerequisites, progress misclassification. Existing IDs and version-1 storage remain unchanged. Roll back with an ordinary revert of the release commit; do not erase learner records. Internal iframe opening is supported, but synchronized Workshop clicks and cloud group journals are not part of this change.

## Execution record
Pending implementation and final exact-head evidence in the PR and release report.

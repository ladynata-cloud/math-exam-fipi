# Виленкин 6, Макарычев 9 и открытие уроков с доски

## Identity and authorization
- Owner: repository owner, current conversation, 2026-10-02.
- Base: `main`, `20fa4cb5b92e41d4218367ccd39a19310ecebb90`.
- Branch: `course/vilenkin6-makarychev9`.
- Review level: MEDIUM, bounded extensions of the existing Workshop and board picker.
- User explicitly requests implementation and publication of both courses and board improvements. Earlier publication authorization persists; no additional final acceptance is requested. Independent external review is not claimed. No global policies, technical protection, or access settings are changed.

## Scope and evidence
The user supplied Vilenkin et al., Mathematics 6, 2024, fourth stereotyped edition, parts 1–2 (44 points), and Makarychev et al., Algebra 9, basic level, 2023, fifteenth revised edition (31 points including optional enrichment). Title pages and contents are checked against supplied PDFs. Books themselves and private source files are not published. Lessons, exercises and diagrams are original.

Add edition-specific learning routes with theory, actionable models, guided work, varied practice and independent checks. Reuse existing progress and prerequisite-return contracts. Extend the board picker with exact course/lesson links and improve navigating and returning to the board without deleting drawings. Preserve existing courses and school records. Do not mix the separate unfinished classic Atanasyan PR #168.

## Acceptance and checks
- Every numbered point has substantive topic content; explicit distinction between topic coverage and exhaustive numbered textbook solutions.
- Mathematical keys checked using independent calculations/enumeration and all generated forms accepted by the UI.
- Browser checks: desktop, 360 px phone, keyboard; course → lesson → prerequisite → return → assessment; board → exact lesson → expand/return and preserved drawings.
- Existing Workshop/core and board picker regression gates; syntax, diff and link checks.
- Same local-storage keys/schema; no automatic deletion or claim of cloud pupil reports.
- Save work in GitHub, one PR, normal protected merge and existing deployment; verify public files and pages.

## Risk / rollback
Main risks: mismatched editions, wrong generated answers, false mastery, broken board navigation or hidden controls. Keep old IDs/data and protocols. Roll back only this release with a normal revert PR if needed; no force/reset/rebase. Do not alter server contracts or deploy settings.

## Current record
Implementation underway. PR, exact final head, test evidence and publication result will be recorded in the release report. No completed-course or publication claim is made by this specification.

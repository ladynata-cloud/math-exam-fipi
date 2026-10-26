# Peterson 5 textbook companion

## Identity and goal
- Task: PETERSON5_TEXTBOOK_COURSE
- Date: 2026-10-26 (Asia/Novosibirsk)
- Base: main, 6c7339a730ba3591859bd4c8c0d8ce9be64efd7c
- Branch: feat/peterson5-textbook-course
- Review: MEDIUM; reuses existing Peterson exact arithmetic, guided practice, local progress pattern.
- Owner request: create Peterson grade-five course according to recently accepted principles. This is the current START and authorizes preparation, branch, commits and a Draft PR.

## Source and scope
Two owner-supplied parts: G. V. Dorofeev, L. G. Peterson, Mathematics 5, BINOM, Moscow, 2019. Part 1 has 176 pages and 24 topics; part 2 has 240 pages and 19 topics. PDF pages equal printed page numbers. The source PDFs remain private and are not uploaded to the site.

Build a companion across all 43 topics with original short theory, interactive models, selected verified textbook exercise subitems, retained steps and notes, exact answer checking, separate skill practice with return to the original task, and browser-local results separating help from first-attempt success. Proofs require written reasoning and manual review; they must not receive automatic correctness credit. Each source card names part, printed page and exact exercise/subitem. Selected tasks are not represented as an exhaustive answer book.

Keep the new course isolated under school/peterson5. Prepare ordinary catalog and sitemap links. No pupil account, board synchronization, existing course logic, backend contract or deployment change.

## Checks and gates
- Source-number/page verification from both supplied PDFs; independent numerical calculations.
- Content coverage and exact arithmetic tests.
- DOM journeys: retained inputs/steps/help, practice detour, reload, manual proof, form validation, corrupt storage and independent-result accounting.
- Real browser desktop/mobile inspection when supported; otherwise record precise limitation.
- Syntax, bundle reproducibility, links, SEO/sitemap and git diff --check.
- Gate target: PETERSON5_COURSE_PREPARED. This is not a release/synchronization claim.

## Review and consultation
Before implementation, the repository consultation instructions were read and integration discovery found no available Claude/Anthropic connector; no authorized secret is exposed in this execution environment. The dedicated OGE external-review workflow is not a general design consultation tool. Claude consultation is unavailable, not completed and not approved. Continue useful preparation under TRAINER_CLAUDE_CONSULTATION.md; an owner decision is needed before a release that bypasses the required consultation.

Independent agents verify each source part and a separate review checks the composed runtime/content. No source PDFs, private student records or credentials are sent to external reviewers.

## Risk and rollback
Risks: source transcription, instructional step size, answer format and saved-work regressions. Mitigate with PDF visual verification, rational math checks and actual DOM journeys. Rollback removes this additive course and its catalog/sitemap links. No existing key or account migration.

## Permissions
Create branch, scoped files, tests, commits, push and Draft PR: yes, implied by current explicit create request. Merge, auto-merge and deployment: not authorized by the current request; separate decision required under AGENTS.md and mathexam-pr/SKILL.md.

## Execution record
Prepared: 43 topics, 131 selected source cards, 441 retained steps, 102 theory blocks, 38 model modes, 25 skill generators. Full content and runtime gates passed; independent source and technical reviews completed with findings corrected. See docs/reports/PETERSON5_COURSE.md and exact-head CI in the Draft PR.

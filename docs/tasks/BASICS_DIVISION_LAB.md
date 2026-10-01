# Division lab: each arithmetic action belongs to the learner

- Owner scope: improve foundational mathematics, especially written division and decimal division, with genuine learner actions; local implementation and commit delegated in the current conversation.
- Date: 2026-10-01.
- Base: `main`, `010e89c75c0fe110b57c983c728b8216fb38cd9d`.
- Branch: `course/basics-visual`.
- Review: HIGH, because the new isolated module persists and imports local progress. Independent integration review remains required; no external review is claimed.

## Scope

Add one coherent module at `trainers/oge-basics/multiplication-division/division-lab.html` and links from existing division entry points. The learner enters every quotient digit, product, difference, brought-down digit, new partial dividend, decimal separator, final answer, and inverse check. A decimal divisor requires transforming both operands first. Include zeros in the quotient, integer remainders, terminating decimal results, explanations, fresh examples, help-aware results, local recovery and export.

Existing trainer routes, scripts, and storage keys stay intact. The module uses only `mathExamBasics.longDivisionLab.v1`; it does not write to shared or older trainer progress. No homepage, server, accounts, publishing, or GitHub operations are included.

The historical production snapshot in `PROJECT_STATUS.md` predates this work. This local task verified the named repository base, not current deployment or remote-main state. Integration and fresh production reconciliation belong to the parent release task.

## Gates

- Independent Python `Fraction` / `divmod` oracle for generated displayed tasks and intermediate operations.
- Node regression checks for corner cases, parsing, state validation, malformed imports, and help-aware evidence.
- Real Chromium at 360/768/1280 px, full stage-by-stage completion, zero quotient digit, remainders, decimal normalization, entered decimal separator, assistance, reload, backup/restore, corrupted storage, cross-tab conflict, and unchanged legacy storage.
- Static preservation of the inline JavaScript in every old linked page; `git diff --check`.

## Risk and rollback

Evidence is local learner-reported work, not authenticated marks. A check still provides stage prompts and is labelled accordingly. No negative numbers, recurring decimals, or rounding of infinite quotients are promised. Removing the new links and four new module files rolls back the feature without changing old progress. The isolated local key may be retained for recovery. Publication and integration are handled separately by the parent task.

## Local verification

- `node tools/division-lab.test.cjs`: 3,500 generated plans, edge cases, storage validation, and exact preservation of inline scripts in ten existing pages.
- `python3 tools/division-lab-reference.py`: 3,500 tasks and 54,697 displayed action answers checked using independent `Fraction` and `divmod` calculations.
- `node tools/division-lab.browser.cjs` with real Chromium: all seven levels, 360/768/1280 widths, assistance/error accounting, unfinished work and input on reload, export/import, corruption recovery, conflict protection, and old-key preservation.
- Mobile and desktop screenshots visually inspected. No external review or production validation is claimed.

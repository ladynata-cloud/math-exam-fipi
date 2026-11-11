# Bonus trainer acceptance audit — 10 November 2026

## Identity
- Task: BONUS_TRAINERS_AUDIT_20261110
- Owner: repository owner; current request to audit published bonuses and prepare fixes.
- Base branch: main
- Base SHA: 25ae3eb9158bd62b543d252206cdb1331fd77921
- Branch: fix/bonus-trainers-audit-20261110
- Review level: MEDIUM (bounded answer handling and assistance accounting; storage schemas unchanged).
- ADR: none; no architectural change.

## Goal and evidence
Select reliable published bonuses for grades 5–11 and exam audiences. Correct three defects found while checking first learner impressions: rounding hints and vector hints were credited as independent work, and the formula theatre accepted numeric prefixes such as 400.9/400abc for an expected 400. Empty formula fields also counted as mathematical mistakes.

The wider audit is based on published URLs, not repository presence. PR #535 and #542 were both already merged when checked on 10 November. PROJECT_STATUS and ROADMAP were read; unrelated planned work is excluded.

## Approved scope
- Rounding: record hint use at every step, distinguish supported history and exclude it from independent credit; retain previous totals.
- Vectors: manual and automatic hints mark the current step and task as assisted; accurately describe saved statistics and non-retention of unfinished tasks.
- Formula theatre: validate complete safe integers; empty/malformed fields get formatting guidance without recording a mathematical attempt. Preserve signed integer, zero, spacing and minus-sign normalization.
- Targeted regression tests and CI, exact navigator source bindings and downloadable HTML/ZIP for these three trainers.
- Report published candidate readiness separately from prepared repairs.

Out of scope: task banks, formula mathematics, storage schemas, learner-record migration, navigation behavior, site deployment, unrelated courses or unfinished product development.

## Acceptance and checks
- Hint-assisted rounding/vector work cannot increment independent results or streak; completed assisted work is retained.
- New tasks reset transient assistance; completed results are not changed by later hint clicks.
- Invalid integer prefixes/decimals cannot advance formula steps; blank/invalid formatting is not a mathematics error.
- Complete correct integers advance; wrong valid integers are errors; negative coefficients and zero remain accepted.
- Rounding DOM suite (12) and preparation DOM suite (8); vector assistance (7); formula input (5), including all 54 base/offset/sign square combinations.
- Updated rounding browser suite covers hint/reload at 320/390/1060; actual-head browser CI remains required before any later release.
- Navigator preservation/bindings, exact downloads rebuild and offline equality, git diff --check.

## Review and risk
Focused independent source review by the coordinating agent and integration reviewer. Regression scenarios exercise learner handlers. Rounding regression was observed failing on original source before the fix. Existing saved counters are retained because historical assistance cannot be reconstructed. No storage key or schema changes; rollback is a normal scoped revert without deleting saved data.

New archetype/design consultation is not applicable; learning sequence is unchanged. External provider review and real-pupil pilot not performed. Public-site browser acceptance is reported separately by the coordinating agent; local source tests do not establish public delivery.

## Permissions
The current user action request authorizes audit, scoped fixes, tests, branch, commits, push and Draft PR. The explicit task restriction overrides standing release authorization: **do not merge, enable auto-merge, or deploy until results are shown and the owner agrees**. No release is performed by this task.

## Execution record
The final PR records exact source/head commits, checks, failures and pending browser/CI work. Prepared repairs retain “needs correction” public status until a separately approved release and live verification.

### CI completion — 11 November 2026

Continued under the owner's request to finish unfinished work; the separate
merge/deployment hold above remains in force. The working candidate starts at
PR head `34ffb232d7cc86ca024f642c12d3fcb4a905fc9a`, without synchronizing its
branch or changing production `main` (`80be25bd5f9e2d254532e8385d89baa394b6c49b`).

Two exact-head failures were diagnosed from GitHub job logs. The rounding
browser helper intentionally submits a completed answer twice, so its caller
was checking the assisted-completion message after the expected duplicate
message had replaced it. The assisted message is now checked before the second
submission; duplicate prevention and the retained assisted history are both
checked after it. No trainer behavior, answers, storage or downloads change.

The learner-entry gate still compared rounding with its pre-fix source. The
existing exact-source mechanism now binds only that page to reviewed commit
`1d77a22e16d0adf31b0109a660c8c323636dee4b`; its Git blob
`5e2394280a24c3705a606689d77437140a5b73b3` is identical to the PR head. Full
inline-engine and control comparisons remain enabled, with original baselines
retained for other pages. CI explicitly fetches this immutable source.

The task's existing bonus workflow additionally runs rounding, source and
full learner-entry browser checks on pushes to this task branch. This allows
exact-head verification while the separate composition with current main is
pending; it does not replace the existing PR workflows or authorize release.
Final local and cloud results are recorded in the PR after execution.

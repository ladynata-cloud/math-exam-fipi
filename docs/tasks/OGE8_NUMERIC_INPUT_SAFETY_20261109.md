# ОГЭ №8: безопасный числовой ввод и завершение зачёта

## Identity
- Owner: Наталья Михайловна.
- Date: 2026-11-09, Asia/Novosibirsk.
- Base: main, 463d6bf56fc8f1f944da8d237102f77888711e79.
- Branch: fix/oge8-quiz-zero-denominator.
- Review level: HIGH (validating a boundary before recording a quiz attempt).
- Context: follow-up of published PR501/506; owner said «продолжай» after the concrete live acceptance report and proposed fixes.
- Architecture: existing OGE course and native page; no new archetype or schema.

## Goal and evidence
A learner can correct an invalid fraction and complete the quiz without a frozen results screen. The published page accepted 1/0 as a wrong quiz answer; summary formatting looped indefinitely on denominator zero. The actual published source reproduced this in a bounded full-page DOM process. Square lookup also threw RangeError for 10^310 due to Number overflow.

## Approved scope
- Reject zero-denominator quiz inputs before consuming an attempt or writing progress; preserve all valid-answer behavior.
- Defensive formatter handling for denominator zero.
- Compute exact integer square roots without Number conversion.
- Regression proof of invalid→valid input, full quiz completion, retained progress after reload, duplicate prevention and unchanged original engines/banks outside exactly inverted edits.
- Native Chromium evidence at 320/360/1280, including touch-compatible contexts, screenshots and errors; publication and live verification after checks.
- Maintain the exact navigator source binding through the existing tool.

No question-bank, grading-key, schema, account, board-protocol, backend, protected-book, or unrelated-course changes. The concurrent PR507 learning investigations are a separate task and are not pulled into this patch.

## Acceptance and checks
- Invalid 1/0,0/0,-1/0 gives an explanation and leaves answer editable; no attempt/progress is added.
- A corrected numeric answer works; all ten questions reach results and another attempt can start.
- Valid wrong answers still consume one attempt; repeated clicks do not count twice.
- Correct Marathon64 remains once in the course record after reload. Session score may reset separately.
- Huge exact square and neighbours finish without RangeError; negative/zero/ordinary roots retain their meaning.
- Existing root-domain/interaction, algebra, learner-entry and preservation gates remain unchanged in intent and retain historical hashes via strict exact normalization.
- Relevant CI: shared practice (including new DOM and native-browser journeys), minimal interface, learner entry, public navigator and protected-book checks as triggered.
- Static checks: syntax, diff-check, source bindings. Gate: OGE8_QUIZ_INPUT_BROWSER_OK.

## Review and permissions
Independent code/math review and regression review required. External provider review not performed and not required under docs/OWNER_RELEASE_AUTHORIZATION.md. User continuation authorizes this scoped implementation; the standing policy authorizes branch, commits, push, Draft PR, controlled release after successful applicable checks and post-release verification. No new owner decision is required solely for publication.

## Risk and rollback
Risk: rejecting a valid answer, affecting arithmetic or progress. Exact rational tests, full quiz path, saved-state tests and historical normalization cover these boundaries. Rollback is a scoped revert of this task with source binding restored; retain all existing localStorage keys and pupil records. No migrations or deletion.

## Execution record
Implementation and tests are recorded in the PR with exact base/head, current main, independent review, CI, deployment and public evidence. Source/DOM results must not be described as native-browser results. No physical-device or real-pupil pilot claimed.

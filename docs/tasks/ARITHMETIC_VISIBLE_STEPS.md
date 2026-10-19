# Visible arithmetic steps, practice retests and readable fractions

## Identity

- Task: follow-up to the entry diagnostic (PR266).
- Owner: repository owner, current conversation, 2026-10-19.
- Base branch: main.
- Base SHA: dd87b765ac85b4d00bdc6fd589966b75feb2f5aa.
- Planned and actual branch: feat/diagnostic-after-practice.
- Review level: MEDIUM; bounded presentation and per-tab practice behavior.
- Architecture: existing trainers and renderers; no new platform contract.

## Goal and evidence

The owner reports that accepted digits are not written until an entire addition
is finished, asks for simple wording ("в уме", "крайней справа"), retesting after
practice, and stacked ordinary/mixed fractions in the path trainers. Existing
foundation rendering confirms the delayed result. The supplied screenshots show
67 + 19 and the grade7 fraction-product trainer. PR266 is already deployed.

## Approved scope

- Replay accepted foundation steps into the written column immediately; show
  regrouping and the current number held in mind. Preserve old saved answers.
- Use simple positional instructions and consistent route labels.
- Offer a diagnostic return after three independent examples; keep the report
  available while practicing and use the alternate diagnostic number set.
- Render numeric ordinary/mixed fractions with a horizontal bar in shared path
  conditions, worked steps, hints and answers, including cabinet rendering.
- Regression robots, mobile screenshots, cache version updates and publication.
- Exclude changes to pupil records, scoring, server contracts or access controls.

## Acceptance criteria and gates

- Accepted 6 in 67 + 19 is visible before asking what remains in mind, including
  after reload; pending 8 is not exposed. A new example clears written digits.
- Borrowed figures update immediately. All generated final answers remain exact.
- Three independent examples offer retesting; help/errors break the streak.
  Returning from practice must not overwrite a saved diagnostic in progress.
- The screenshot's 1 1/7 and 7/6 use stacked notation on desktop and mobile.
  Plain numerical answers, old work and read-only views remain unchanged.
- Required: foundation core/DOM/browser, diagnostic core/DOM/robots/browser,
  fraction DOM/browser, managed path regression, inventory and diff checks;
  all exact-head CI workflows and live asset delivery after publication.
- Final marker: ARITHMETIC_VISIBLE_STEPS_OK (only after required checks pass).

## Review, risk and rollback

Focused code review plus targeted regressions. External review is not required
by the MEDIUM policy and is not claimed. Main risks: future-answer leakage,
incorrect carry/borrow alignment, formatting untrusted text as HTML, accidental
saved-state changes. Escape every non-numeric text segment, preserve raw state,
verify public/managed paths and small screens. Roll back this scoped commit via
a normal reviewed revert if needed; no pupil data migration is involved.

## Permissions

The owner requested the changes and explicitly said "продолжай пожалуйста, все
публикации выполни" during implementation. This authorizes completing and
publishing these follow-ups after verification. No force, administrative
bypasses, weakened checks or unrelated changes are authorized. Check remote
main against the recorded base immediately before merge; stop on base drift.

## Execution record

PR and exact-head CI results will be recorded in the PR handoff. Tests and
production verification must distinguish pass, fail and not run. No external
review approval is claimed by this document.

# Clear decimal-division goal and borderless comma handles

## Identity and scope

- Date: 2026-10-09.
- Base: main, `c22bf2aedc7cb8d6f52dd4963673a241e47052d1`.
- Branch: `fix/decimal-goal-and-comma`.
- Review: SMALL, isolated instructional copy and visual refinement.
- Owner requests: explain that the equal rightward shift removes the comma
  from the divisor; reuse the completed local wording change; remove the frame
  around draggable commas while preserving accessible interaction.
- The current request authorizes implementation. Standing explicit publication
  authorization and the external-review waiver apply to this combined release.
  Release still requires relevant gates and the authoritative-main drift check.

## Reused work and reconciliation

- Reuse the two runtime-file edits from local commit
  `fe8513df92869071814cec4b6dec658d291d5e8d`, branch
  `fix/decimal-divisor-goal`, parent
  `b5d26ce9695deab2eea5f7eac2e13277da092450`, verbatim.
- Those files are `decimal-shift.js` and `division-guided.js` under
  `trainers/oge-basics/multiplication-division/`. PR #211 did not change them.
- Add only the shared comma-handle CSS and reconcile this task record and
  `PROJECT_STATUS.md`. This reuses the accepted work rather than rebuilding it.
- The earlier task document recorded no separate publication authorization at
  that time. Current standing authorization governs this release. No reason
  for a previous automatic approval rejection was found in its task record;
  no such reason or successful prior publication is inferred.

## Goal and acceptance

- State the goal before asking the learner to move commas.
- Describe equal rightward movement in both numbers.
- Explain the achieved goal as soon as the displayed divisor has no comma.
- Explain the transition to ordinary long division after preparation.
- A fractional dividend remains valid. Extra movement must not be presented as
  necessary: the existing minimal-shift check remains unchanged.
- Show a plain, dark-green comma without its white box, border or shadow.
  Preserve the 44 by 44 CSS-pixel touch target, slider semantics and keyboard
  controls. Keyboard focus has a soft fill and underline; forced-colors mode
  retains the operating system's focus outline.
- Apply the shared refinement to both the arithmetic trainer and the guided
  long-division trainer. Preserve arithmetic, gesture handlers, action order,
  saved work and course results. No accounts, server, board, canonical bank or
  unrelated files.

## Checks and review

- Existing exact decimal model and guided-plan tests.
- Existing decimal-shift browser suite, including touch, keyboard, 320/390px,
  saved work and resuming multiplication practice.
- Visual inspection of both consumers, including unframed handles and keyboard
  focus; confirm the retained 44 by 44 hit area.
- JavaScript syntax, self-review and `git diff --check`.
- Final marker: `DECIMAL_DIVISOR_GOAL_OK` after combined checks pass.
- No new tests for this reversible styling and copy change. External review is
  optional for SMALL; a focused internal review covers the combined patch.
- No new architecture or ADR. No secret values or personal data in handoff.

## Risk and rollback

Longer guidance may wrap on narrow screens; verify existing mobile layouts.
Revert this isolated patch to restore prior wording and styling. No stored-data
migration, API change or saved-work conversion is involved.

## Production reconciliation

PR #211 merged as `c22bf2aedc7cb8d6f52dd4963673a241e47052d1`, parent
`b5d26ce9695deab2eea5f7eac2e13277da092450`; its reviewed and merged tree
`76abc7436e792d3400a73891c9c5509a199beb30` matched. Three exact-head CI workflows
passed. Pages run `37885544613` succeeded, 12 changed public assets matched
reviewed bytes, and the live `/foundations/` route was verified. The Amvera
cabinet returned HTTP 200; the new `learning/app.js` and `preparation.js`
matched reviewed bytes. Live teacher profile controls and saving an OGE goal
were verified. Private learner creation stayed in the authenticated interface;
no learner identities or credentials enter this source record.

## Execution record

- Exact source runtime edits applied on the fresh base above.
- Shared comma styling applied; task and project status reconciled.
- Decimal model: 11 examples and 2800 exact scaling/quotient properties passed.
- Guided arithmetic: 2700 deterministic plans passed.
- Existing browser suite passed: both handles, six operand pairs, pointer
  capture, touch, keyboard, locking, 320/390px, retained guided draft and
  notebook, decimal completion and multiplication return in both trainers.
- Both trainers visually inspected at 1280px and 320px. Commas have no border
  or shadow; computed targets remain 44 by 44px. Keyboard focus is visible as
  soft fill plus a 3px underline; no horizontal overflow was observed.
- JavaScript syntax and `git diff --check` passed. Reused runtime files match
  their source-commit blobs byte for byte.
- Focused independent internal SMALL review approved on 2026-10-09 with no
  blockers: exact runtime reuse, arithmetic checks, CSS accessibility and
  desktop/mobile screenshots reviewed. This is not an external review claim.
- Combined local gate: `DECIMAL_DIVISOR_GOAL_OK`. Commit and publication are
  handled by the release owner after the fresh-main check.
- Not run: real-pupil or non-Chromium checks, separate full-site suite for this
  bounded copy/style change. No scope deviations.

The source commit's earlier checks are retained as provenance, not substituted
for this combined release's verification: 11 decimal examples and 2800 exact
properties, 2700 deterministic guided plans, and the existing pointer, touch,
keyboard, mobile and saved-work browser suite passed in that earlier task.

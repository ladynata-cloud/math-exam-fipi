# Readable labels and controls below the assignment drawing

## Identity and scope

- Owner feedback: the labels, movement controls and helper text below the large
  inline drawing are too small and difficult to read.
- Date: 2026-10-17 (Asia/Novosibirsk).
- Base: `main` at `6f3b971003ad7ab42027dbac8b5326a3c4434c23` (PR 252).
- Branch: `fix/assignment-geometry-readability`.
- Review: **SMALL**, scoped CSS and stylesheet cache-token change only.
- The request authorizes the fix, checks, commit, publication and Draft PR;
  merge/deployment require separate current owner authorization.

## Evidence and acceptance

The screenshot shows the controls under the drawing. They retain cabinet
defaults: labels at 0.9rem, helper text at 0.84rem and mobile toolbar buttons at
0.84rem. A larger drawing alone did not make this text readable.

Set panel body text, labels, selectors and ordinary controls to 1.25rem (20px at
the current root size); helper text to 1.125rem (18px) with darker color; arrows
to 1.625rem (26px) in targets at least 56px square. Use rem units to retain user
font scaling. Keep these sizes on narrow screens, with the existing wrapping.
Bump only the changed stylesheet's version. Preserve all drawing interactions,
mathematics, assignment state and submission behavior. No global typography,
server, API, account, task ID, progress or deployment changes.

## Checks and review

Focused CSS cascade/specificity, wrapping, contrast and scope review; existing
assignment geometry model and DOM checks; runtime-layout resource check;
`git diff --check`. No new tests for this low-impact styling-only adjustment.
External review is not required or claimed. Live visual/phone acceptance is
pending deployment; DOM tests do not prove responsive appearance.

## Risk and rollback

Larger controls occupy more vertical space. The existing flex wrapping and
width limits are retained. Revert the scoped typography additions and cache
token to roll back; no data migration or progress repair.

## Execution

Validation results and exact head are recorded in the task PR. Screenshots and
private account identifiers are not included in the repository.

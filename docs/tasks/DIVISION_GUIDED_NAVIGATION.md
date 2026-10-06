# Guided written division navigation

- Date: 2026-10-06
- Base: `main`, `9ed82e42e2e0c4daebd3e0897674dc53e6d510d7`
- Branch: `fix/division-guided-navigation`
- Review level: MEDIUM (bounded public trainer UI and recoverable browser-local state).
- Owner request: simplify the public full-line division trainer for learners who
  need very low cognitive load, using the previous arithmetic complex's Russian
  school division notation. The owner clarified the reference was inside a
  collection of arithmetic operations.

## Evidence and scope

The relevant existing arithmetic complex is `trainers/arifmetika.html`, including
`renderCorner`, `buildCols`, `putRightD` and levels n3e/n4c/n4d/n5d–f.
The archived `long-division-stepwise-5-dab0dd89.html` supplies an additional
reference for first partial dividend, quotient positions and remainder checking.
The archived filenames do not independently establish authorship.

Change the public `long-division-from-simple-to-decimals.html` experience:
one current question, one main action, contextual help, retained notebook rows,
a small first example, and secondary topic selection. Retain every former topic,
the URL, the canonical source bank and managed classroom contract. Reuse the
existing exact division planner in a page-local adapter; do not change its
shared runtime. Save the current public attempt separately from old statistics.
Provide a visible result to copy/send manually without an account.

Out of scope: accounts, passwords, student records, backend contracts, other
trainers, video generation, external platform changes or clinician claims.

## Acceptance and checks

- Fresh visit starts at a small guided example without competing route menus.
- Choosing topics is deliberate and cancelable; resume retains the exact step.
- First block, quotient positions, product, subtraction, remainder and one-digit
  bring-down correspond to a Russian school notebook.
- Zero quotient digits, integer remainders, appended decimal zeros and equal
  scaling of both operands work; blank input never counts as zero.
- Previous rows remain visible and later answers are not revealed prematurely.
- Hints/reveals/errors and repeated tasks do not inflate independent work.
- Desktop and 320/390-pixel screens, keyboard and reload are checked.
- Old teaching-bank extraction is byte-identical; managed classroom stays on its
  existing path. No production learner data is written during verification.
- Node arithmetic checks, Playwright interaction checks, teaching bank check,
  applicable existing CI and `git diff --check`.
- Gate: `DIVISION_GUIDED_NAVIGATION_OK`.

## Review, risk and release

Focused independent review of mathematical layout, interaction and persistence.
Primary risks: decimal column alignment, losing a zero, double-counting results,
browser storage failure, or accidentally changing managed content. Local public
state has its own versioned key and does not migrate or overwrite old records.
Rollback is reverting this PR; leave prior and new progress keys intact.

Current user request authorizes implementation. Earlier explicit session
authorization to publish and proceed without external review remains in force;
internal checks are retained. One branch and PR, no force/admin operations.
Recheck authoritative main immediately before release and verify deployed assets.

## Execution record

Implementation and final checks in progress.

# Task11 help on the same page

## Identity

- Date: 2026-10-21 (Asia/Novosibirsk).
- Base: main, 6ea58439e0628b76cf98b7263a598347f96fe83e (published PR280).
- Branch: fix/task11-inline-help.
- Review level: MEDIUM; bounded, reversible presentation and focus behavior.

## Goal and approved scope

The owner asks that help appear on the same page. Her two screenshots show
the matching task and the modal that covers it. Replace this per-function
modal with a disclosure immediately below the chosen function row. Keep the
assignment, graph choices and answer fields available while the model is open.
Use a clear collapse control, normal page scrolling and ordinary keyboard
navigation. Preserve independent A/B/C experiments, both deeper help levels,
formula reset, current answers, progress, mathematics and standalone download.

Out of scope: other trainers, course access, lead collection, cabinets, backend,
new question banks, payment/API integrations and unrelated visual changes.

## Acceptance and gates

- Help opens inline under its originating function and collapses on request.
- No backdrop, modal semantics, page blocking or trapped Tab navigation.
- Answers and other function controls remain usable while help is open.
- Opening another function moves the help panel without erasing either state.
- New tasks discard only the previous task's help; controls remain connected.
- Nested help, reset, Escape from within help and answer retention work.
- No horizontal overflow at 320, 360 and 1280px; useful readable model size.
- Relevant Node/math tests, existing browser/offline gates and updated inline
  journeys pass. Inspect mobile and desktop screenshots and live publication.
- git diff --check and reviewed local/remote/merged tree identity.

## Review, risk and rollback

Focused independent review covers dynamic panel placement, query selectors,
new-task lifecycle, keyboard access, unchanged mathematics and retained inputs.
The owner's current instruction defers Claude API use until a difficult
creative question; no call, billing change or provider approval is claimed.
This change keeps the existing model and teaching sequence.

Risks: moving a shared DOM node could detach controls on a new task, include
model selects in matching answers or lose keyboard focus. Targeted regression
checks cover these risks. Normal revert restores the previous frontend; there
is no data migration. Robot checks do not establish learning effectiveness.

## Permissions and execution

Current request authorizes this correction. Standing explicit cloud publishing
permission persists. One branch and PR; normal merge only after exact-head
checks/review and authoritative main comparison. No force, rebase, admin
override or weakened gates. Publication evidence and final commit identities
will be recorded in the PR; no recursive status-only PR.

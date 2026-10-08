# PreOGE: one arithmetic remediation route

## Identity and scope

- Owner request: integrate the existing `trainers/arifmetika.html` into the
  course for closing gaps before OGE; combine the experiences where useful and
  test with explicitly fictional learners.
- Date: 2026-10-08. Base: `main`,
  `c8241e8c08cfb3916cb9875a9896d8a2024042d0`.
- Branch: `course/preoge-arithmetic-route`. Review level: **HIGH** because
  new browser-local per-skill attempt records affect progress claims.
- Existing arithmetic and guided-division engines remain the source of truth.
  No new trainer archetype, server protocol, account or board implementation.
- Standing owner permission to publish and waiver of separate external review
  apply. This document records permission; it is not review evidence.

## Outcome

One course entry offers a skill-based route through the older visual arithmetic
trainer and contextual access to the detailed division explanation. Direct
links open the requested exercise, and the pupil can return to the same route.
Old public links and stored results remain usable.

## In scope

- A simple route covering the existing arithmetic levels, grouped by skill.
- Allowlisted level links and quieter course presentation in arithmetic.
- Contextual links between division practice and the detailed guided trainer.
- Honest per-skill progress and a manually copied teacher report, stored only
  in this browser. Aggregate legacy statistics are not treated as mastery.
- Fix defects encountered in these exercised paths: broken hints, blank input
  accepted as zero, duplicate completion and keyboard event propagation.
- Tests with fictional learner behaviours: gaps in multiplication, selecting
  partial dividends, zero quotient digits, decimal normalization, help use,
  repeats and interrupted work. These are software scenarios, not pupil research.

## Out of scope / protected areas

No accounts, passwords, backend, classroom/learning contract, canonical task
bank, unrelated courses or previous unpublished curriculum changes. Do not
reset existing local statistics. No automatic messages or real pupil data.

## Acceptance and gate

- Every route exercise opens the matching allowlisted arithmetic level.
- Original partial-dividend selection, school corner layout and worked rows
  remain visible; both public standalone and course entry work.
- Help/reveals/repeating the same problem do not inflate independent results.
- Records from separate tabs do not overwrite each other; inaccessible storage
  is reported and does not stop practice; malformed saved data is preserved.
- Guided attempts keep their existing exact resume and managed-mode boundary.
- Six fictional scenarios, keyboard and 320/390px checks pass with no JS errors.
- `node tools/preoge-arithmetic.test.cjs`; browser persona suite; existing
  guided core, browser and notebook regressions; canonical bank `--check`;
  relevant link checks and `git diff --check`.
- Gate marker: `PREOGE_ARITHMETIC_ROUTE_OK` after all required checks pass.

## Review, risk and rollback

Independent internal review of changed code and progress semantics is required;
external review was waived by the owner. Browser tests cannot establish learning
effectiveness with real children. Changes are static assets; rollback is a
normal revert of this bounded PR, leaving both prior stores and the new
namespaced attempt records untouched. The latter contain no names or accounts.
New attempt records have individual keys to prevent stale tabs from overwriting
one another. Arithmetic reload starts a new example (the page says so); detailed
division retains its existing exact resume.

## Execution

Local gate **PREOGE_ARITHMETIC_ROUTE_OK** (2026-10-08):

- Progress/store and all 43 route destinations: pass.
- Arithmetic integration: all 43 levels, 377 phase actions; hint/reveal,
  invalid input, keyboard, malformed old stores and root-only shared progress:
  pass.
- Six isolated fictional learner browser journeys plus all 43 hint modes:
  pass. Both 320/390px layouts checked; an internally clipped quotient was
  found, fixed and covered by a full-visibility regression assertion.
- Guided arithmetic: 2,700 exact plans, nine-topic browser regression and
  notebook/decimal regression: pass.
- Managed-mode isolation checked: public course navigation hidden, public
  guided runtime inactive and pre-existing saved value untouched.
- Canonical remediation bank: 35 sources, 396,075 bytes, unchanged.
- Five touched HTML pages: no broken links. `git diff --check`: pass.
- Independent internal review found two progress-integrity defects (damaged
  imported tasks and malformed legacy saves); both fixed and regression tested.
  External review was waived; testing with real pupils was not performed.

Publication must verify the fresh remote base and exact reviewed patch.
No unrelated unpublished branch is included. Browser runs used Playwright
1.62.1 with Chromium 141 headless; CI installs its pinned standard browser.

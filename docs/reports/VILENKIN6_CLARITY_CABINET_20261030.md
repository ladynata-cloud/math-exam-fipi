# Vilenkin 6: teaching clarity and cabinet integration

This is a prepared first update toward the owner's full two-part textbook goal.
It is not completion of every textbook exercise and is not a production or
real-pupil learning report.

## Result and source scope

- 24 units, 194 source-selected cards, 615 checked steps. Two missing subparts
  finish exercise 2.97; complete coverage of 2.97 and 2.134 is independently
  evidenced. Other numbered exercises retain an explicit partial/missing state.
- Correct source captions distinguish exercise/subpart, point, paragraph,
  chapter, book part and printed page. The 44 points are not 44 paragraphs.
- Prime table through 1000, exact divisibility reminders and elementary/grade
  five refreshers open beside the task. Reading a reference during an unfinished
  attempt records assistance; reading after completion preserves the result.
- First errors no longer expose hints automatically. Pupils can correct their
  answer independently and inspect the full worked solution after answering.
- Factorisation, repeated factors in GCD/LCM, the given-denominator convention
  and the zero fractional part of an integer now have explicit explanations.

The [source inventory](../vilenkin6-source-coverage-audit-2026-10-29.md) records
1589 main numbers, 65 applied problems and 113 final revision problems. Its
1767-number subtotal excludes local checks and other questions. All subparts
and 50 local check groups are not fully enumerated. Neither a PDF index nor a
selected subpart counts as a complete worked interactive exercise.

The [expansion plan](../vilenkin6-expansion-plan-2026-10-30.md) identifies the
next 54 visually grounded gaps around factorisation, GCD, LCM and fractions.
Full-book completion remains an open acceptance criterion.

## Saved work

The revised cards use a distinct `vilenkin6-textbook` contract: one source task
per cloud attempt. Legacy `vilenkin6-part1` module IDs, old attempts and the
standalone browser storage key are preserved. Teacher assignment uses the
existing versioned profile mechanism and preserves the unrelated focus text.
No real pupil's profile or work is changed by this branch.

A task's source identity does not change when unrelated cards are added. When
the task itself changes, old state cannot be applied to a new condition. Its
record remains stored and a fresh current-version attempt is available. This
does not promise an executable archive of every historical source revision.

Independent review found and corrected old-revision reward/fresh-attempt
failures, sparse manual-check arrays and invalid submission of incomplete
self-checks. Browser verification also exposed the restricted iframe's native
form-submit behavior; the candidate uses explicit guarded check actions. Only
the new trainer receives `allow-forms`/`allow-popups`, so its grounded refresher
links also work in separate tabs. Popup sandbox escape remains disallowed and
existing trainer permissions remain unchanged.

## Review and validation

Source/math review evidence is recorded separately from runtime checks:

- `VILENKIN6_TEXTBOOK_SOURCE_REVIEW.json` preserves the original review and
  appends three explicit hash-linked amendments.
- `VILENKIN6_EXERCISE_COMPLETENESS_REVIEW_20261030.json` pins exact source
  hashes, eight subparts per completed exercise and each reviewed card.
- Coverage validation rejects missing subparts, changed answers/source hashes,
  altered evidence, or an author presented as their own independent reviewer.

Local content gate: 24 units / 194 cards / 615 steps. Standalone DOM gate:
194 views / 30 journeys. Final standalone Chromium gate: 388 task views at
1280/390 pixels and nine learner flows passed. Prime/source/integrated-reference
tests: 16 passed.
Coverage validation: 10 passed and both supplied PDF hashes/pages checked.
Legacy content: 27 modules / 475 tasks; DOM: 108 renders / 20 journeys.
Expanded prime table visually checked at 320, 390 and 1280 pixels, including
unbroken three-digit numbers and retained drafts. Final backend: 347 tests passed. Combined cabinet/managed/source/reference DOM:
47 tests passed, including six managed-attempt cases. Real two-origin Chromium
and SQLite gate: seven end-to-end scenarios passed with zero page errors and
no public network requests. These cover the actual teacher route change,
legacy preservation, cross-device draft restore, reference-assisted grading,
manual checklist order/incomplete feedback, a fresh current-version attempt,
read-only takeover, peer access denial and the separate division refresher.
The synthetic test data contain no real pupil identity or credentials.

No actual pupil learning gains, live assignment, production rollout or external
Claude review are claimed. The prior provider credit failure is not approval;
no paid retry has been made without evidence of changed access. The task is
HIGH because it adds a saved-work contract using accepted ADR 0010 patterns.

## Rollback and release

Hide the new course route and assignment option while retaining its decoder and
stored attempts. Keep the legacy course available. Do not restore a database
snapshot over newer work or reinterpret old IDs as the revised source tasks.
Public trainer assets and backend code must both be deployed before the new
course is assigned through the teacher UI.

The current branch is preparation for review. Release requires the exact-head
decision and external-review evidence or a scoped owner exception under the
repository policy. The unrelated assistant PR375 is not part of this change.

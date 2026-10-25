# Vilenkin 6, part 1: source-based learning revision

Date: 2026-10-25. Base: `8e681831e874a9af129f50c16179bd2a424c5474`.
Task: [VILENKIN6_TEXTBOOK_LEARNING](../tasks/VILENKIN6_TEXTBOOK_LEARNING.md).
Review level: HIGH. Production has not been changed by this task.

## Result and boundaries

The public first-part entry opens a revised course with 24 units: prerequisite
review and the 23 numbered textbook topics. It contains 192 selected actual
exercise subparts, source examples and questions, with 605 small solution steps.
Every item identifies its printed page and real exercise number or an honest
unnumbered source label. There are 17 source-figure crops used by 25 tasks.
Four construction tasks use explicit manual checklists; the application does
not pretend to verify a pupil's drawing.

The condition, relevant figure and completed equations stay visible during a
guided solution. Help is contextual; showing one worked step does not advance
the pupil or erase a draft. Continuing is a separate action. Decimal notation,
fraction conversion, reduction, prime factors and common-denominator pairs
are checked in the requested representation. A supplied answer key is not used
as the oracle for the independent arithmetic review.

This is a selected learning route, not solutions to all 931 main exercise
numbers. The second part of the older two-part course is not revised here.
The updated selection is the first-part public default. The old overview
links to it and clearly identifies its own prior edition.

Synchronization is the next stage requested by the owner. Existing cabinet
URLs with `learning=1` retain their established IDs, server contract, content
and saved attempts. `legacy=1` and the retained offline bundle remain available.
The revised exercises use the separate browser key
`mathexam-vilenkin6-textbook-2024-v1`; no earlier completion is silently credited
to new questions. No account, database, board registry or cloud state migration
is included.

## Independent checks

[Source review evidence](VILENKIN6_TEXTBOOK_SOURCE_REVIEW.json) records separate
authors and reviewers, reviewed file hashes, exact arithmetic, source pages,
accepted adaptations and corrected findings. Independent reviewers inspected
56 source pages and all 17 crops, checking all 192 final answers and 605 steps.
Corrected findings included missing explanations for choosing GCD/LCM in word
problems and answer validators accepting the wrong requested representation.

Local gates passed:

- `textbook-check.cjs`: 24 units, 192 unique actual source selections, 605
  steps, representation rejection regressions, source-number/page references.
- `textbook-dom.cjs`: all 192 task views and retained-work/help/manual/reload
  journeys, with bounded state and corrupted-record preservation.
- `textbook-entry.test.cjs`: public routing, managed and legacy preservation,
  safe topic hashes and retained offline behavior.
- `textbook-browser.cjs`: real Chromium, 384 task views at widths 1280 and
  390 pixels; all source figures load, no page-width overflow, draft/step/help
  restoration and correct public/managed entry behavior. Representative
  screenshots were visually inspected.
- Existing standalone and managed course regressions: 108 views each,
  27 models each; existing content, bridge (5), cabinet DOM (8) and SQLite
  persistence/contract tests (11) passed.
- The older Vilenkin route: 23,280 independently calculated answers, 2,976 model
  boundary states and 194 lesson maps passed.
- Offline regeneration is unchanged; syntax and whitespace checks passed.

Browser screenshots are synthetic test evidence, not pupil data. Neither
automated tests nor model review establish actual learning gains. A lesson
with a real sixth-grader has not been observed for this revision.

The [independent runtime review](VILENKIN6_TEXTBOOK_RUNTIME_REVIEW.json)
records seven additional adversarial scenarios and the corrected saved-state
and stale-handler findings, tied to the final source hashes. The final DOM
suite names 24 journeys; real Chromium verification was repeated afterwards.

## Representative screens

[Retained steps on a phone](vilenkin6-textbook-preview/mobile-retained-steps.png),
[a complex fraction from the actual source](vilenkin6-textbook-preview/complex-fraction.png),
and [symmetry using the original figure](vilenkin6-textbook-preview/symmetry.png).
These show the implemented lesson, with synthetic inputs only.

## External review and release

No pre-implementation Claude consultation was available in the execution
environment. The existing bounded GitHub review job is extended to this task
for a ready-result review using authorized repository secret storage. Its
result must be read from the exact-head workflow artifact; neither this report
nor a green content test constitutes an external verdict. There is no standing
waiver for a missing consultation or unavailable provider.

Release requires the separate owner decision under `AGENTS.md`, followed by
the base-drift guard. Rollback restores the public entry and older-course overview link;
the old runtime and cloud records are untouched. New browser progress should
be retained, not erased, during rollback.

The shared catalogue copy edit was dropped when the separately published SEO
PR #337 changed the same minified file. The revised Vilenkin public entry and
older-course overview link remain in this task. The existing catalogue copy
continues to describe the retained earlier edition; its editorial update is
not part of this patch. No concurrent main changes were copied into the task
branch and no branch merge/rebase/reset was used.

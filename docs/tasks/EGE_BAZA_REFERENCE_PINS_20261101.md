# EGE base: contextual foundation reference sheets

## Identity
- Date: 2026-11-01, Asia/Novosibirsk.
- Base: `main`, `6b9c327f2ca438cb7e7620ef302876de467fac19`.
- Branch: `feat/ege-baza-reference-pins-20261101`.
- Review level: MEDIUM (bounded reference content/navigation using existing disclosure and assistance contracts).
- Authorization: the owner's current direct implementation request, “сделай так, что к задания были привязаны справочные материалы ... булавками ... конкретные тренажеры”. This is the approved scope; no copied historical permission is used.
- Merge, auto-merge and production deployment: not authorized by this implementation request.

## Goal and scope
Give each EGE-base task a short, relevant foundation reference on request, and
provide a searchable course reference section whose sheets pin the exact
trainers that use that rule. Preserve answers, steps, current variants and
existing distinction between assisted and independent work.

Included: a single shared reference dataset; explicit links for all 107 current
path families and the existing exam-position trainer/first two modules; reverse
pin links; calm paper-sheet presentation; standalone and saved-path integration;
course entry links; focused automated and browser verification.

Excluded: the wider audit's geometry redesign, new task generators, progress
migration, pupil records, authentication/server changes, OGE book edits, frozen
book editions, profile EGE and unrelated courses.

## Acceptance
- Every main-route EGE family has a relevant explicit reference mapping.
- Reference text and worked examples are hidden until requested. No current
  task answer is copied into the reference; examples are independent.
- Every pin opens a real exact family/task/lesson, and both directions derive
  from the same mapping.
- Opening/closing a rule leaves the same input, draft, condition and completed
  steps. Revealing a rule records existing assistance; closing cannot undo it.
- Examination/diagnostic views do not acquire new assistance controls.
- Saved-task read-only behavior and persistence schemas remain intact.
- Search, unknown hashes, keyboard operation and responsive layout are checked;
  mathematical statements include their conditions. Print styles are included;
  a physical-print/browser-print check is reported separately.

## Design consultation and review
Before implementation, a focused internal pedagogical consultation proposed
short sheets (rule, independent example, collapsed typical error), explicit
family mapping rather than inaccurate `gap` heuristics, and reverse-generated
pins. Accepted; native disclosures extend the existing task-first pattern.

Claude consultation is unavailable: no callable Claude integration and no
configured ANTHROPIC_API_KEY in this execution environment. No provider call,
external advice or release approval is claimed. This is not a standing waiver.
Useful implementation and technical verification continue within the owner's
scope; the missing external consultation is disclosed in the handoff.

Independent internal review covers content/mapping, draft retention, assistance,
exam/read-only exclusion and navigation. Do not send pupil data or secrets to
reviewers. No new persistence schema or platform archetype is introduced.

## Gates and rollback
Run the reference-specific data/DOM test, existing task-first, navigator,
practice and managed-state/board suites as applicable, syntax and diff checks,
and browser preview at desktop and narrow width when the supported preview is
available. Report unavailable checks separately.

Rollback is a normal revert of the scoped reference/navigation patch. Existing
task IDs, answer keys, schema versions and stored student data do not change.

## Execution
Implemented 31 concise sheets, all 107 main-route families and 118 existing
trainer/lesson/practice destinations. Each practice task has its own mapping;
reverse pins derive from those same maps. Reference disclosure uses the existing
assistance flags and leaves the answer/step nodes in place. Saved attempts do
not offer a misleading public-route return link. Exact legacy task hashes follow
navigation and never replace an unfinished variant.

Local gate: `EGE_BAZA_REFERENCE_PINS_OK`.

- Final combined Node run: 21/21 groups, zero failures or skips, across
  `ege-baza-reference.test.cjs`, `ege-baza-reference-legacy.test.cjs`,
  `ege-baza-task-first.test.cjs`, `ege-baza-navigator.test.mjs`,
  `ege-baza-board.test.cjs`, `ege-baza-practice.test.cjs`,
  `ege-baza-practice.dom.cjs`, and `ege-baza-backup.test.mjs`.
- Reference coverage: 31 sheets, 107 families, mixed-task filtering, all reverse
  destinations, input/caret/step retention, assistance accounting, 42 exam and
  diagnostic screens, managed/read-only isolation, invalid hashes/search,
  keyboard skip link, catalogue title and relevant search ordering.
- Legacy reference suite: 1409 assertions, 68 exact task links, 10 lessons,
  40 practice tasks, navigation/reload and unfinished-variant protection.
- Existing regression evidence: 6000 generated conditions, 75 practice families,
  168 unchanged legacy examples; 107 complete task-first paths; 269 navigator
  checks; 69 backup checks; managed board tests; 81 foundation and 78 data DOM
  checks. Earlier mathematical gates for the fixed bank and modules also pass.
- Both new suites are included in the existing virtual-classroom CI runner.
- Supported managed browser preview: desktop catalogue/search and paper sheet;
  pin to the exact grid-area task; draft 24 retained while opening/closing the
  area rule; answer credited as assisted; keyboard skip link preserves sheet;
  three 375px iframe viewports for catalogue, long fraction formulas and pins.
  No visible horizontal overflow. This is a responsive-layout check, not a
  physical mobile-device test.
- Screenshot: [reference sheet and pins](../qa/ege-baza-reference-pins-20261101.jpg).
- Independent content and code reviews: all reported issues corrected and
  rechecked; no outstanding finding from those reviews.
- Syntax and whitespace checks pass. No secrets, new data schema, private pupil
  data, or machine-specific paths are included.

Not run locally: the full repository Playwright suites (the supported managed
browser was used for focused UI QA), production/signed-in learner verification,
physical-device and browser print checks. GitHub CI and exact PR/head provenance
are recorded in the PR. Claude consultation/review remains unavailable as above.
No merge, auto-merge or deployment was performed. Rollback remains a normal
revert; existing state formats and answer keys are unchanged.

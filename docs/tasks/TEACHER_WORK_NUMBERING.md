# MathExam task specification

## Identity

- Task: TEACHER_WORK_NUMBERING
- Owner: repository owner
- Date: 2026-11-07
- Base branch: main
- Base SHA: 25548b86df75b8c90a5dc5c6f1f1925c2ad70636
- Planned branch: task/teacher-work-numbering
- Review level: MEDIUM
- Related issue or ADR: none; existing static teacher catalog
- ADR status: not applicable

## Goal

Give each class and each textbook edition its own permanent, consecutive
sequences of independent work and assessment work, with the same identifiers
visible in the catalog, downloaded assignments, answers and archives.

## Context and evidence

- The owner requested separate numbering beginning at one for each class and
  work type, using the supplied school collection as an example.
- The owner granted `START` and then explicitly added numbering for each
  textbook. Existing mappings are thematic/section mappings, not a claim that
  each original MathExam exercise matches an exact publisher exercise number.
- The base catalog contains 145 PDF topic packs, four variants per work, and
  three additional editable Word works. Number of work and number of variant
  are different identifiers.
- Some packs have several grade/textbook memberships. Numbering after filtering
  or assigning one global number to a pack would give unstable or ambiguous
  identifiers. Textbook edition grade inconsistencies must be documented and
  restricted to the edition's verified grades in the new collection registry.
- The base advanced from the inspected 66172e7 to 25548b8 through PR #475;
  that change is unrelated to teacher worksheets and is retained.

## Approved scope

### In scope

- Explicit persistent order and separate SR/KR sequences for each class and
  each verified class/textbook combination; new works require explicit registry
  maintenance rather than silently renumbering published works.
- Topic labels, variant counts, class/textbook selectors, source alignment notes,
  contents and direct links into the numbered selection.
- Treat independent Word tasks as separate works, never as byte-equivalent PDF
  editions. Use the Word work's actual grade eligibility.
- Numbered PDF/DOCX downloads and ZIPs using the selected collection. A lazy
  same-origin browser exporter may label existing approved documents to avoid
  storing thousands of identical task copies for textbook memberships.
- Keep assignments and answers separate and preserve all mathematical content,
  scores, four-variant structure and native editable Word mathematics.
- Update affected topic-page links, targeted checks and regression workflow.

### Out of scope

- New tasks, new textbook coverage, invented exercise-number correspondences,
  new annual programs, or changes to mathematical exercises and answers.
- Cabinets, student data, shared board, server contracts, authentication and
  unrelated project releases.

### Files or areas that must not change

- Source exercise banks, original publisher files, student records, deployments
  and repository permission policies.

## Acceptance criteria

- [x] Each supported collection has independent SR/KR sequences 1..N without
  duplicates or gaps, with a validated work identity for each number.
- [x] Regeneration and CI compare the saved/published registry and reject
  reassignment or removal of existing numbers within the same edition.
- [x] Numbers within each saved collection are not recomputed by search,
  reset or page reload. Switching collections shows that collection's own
  permanently assigned number.
- [x] General grade and exact textbook/grade collection labels are unambiguous;
  unsupported combinations never inherit another textbook's sequence.
- [x] Textbook notes describe the verified thematic/section correspondence and
  do not claim unverified exercise numbers or publisher-assigned work numbers.
- [x] Downloaded assignments, answers and archives agree with the displayed
  collection and number. Errors are visible; no silently unnumbered fallback.
- [x] PDFs retain four readable pages and all tasks/answers. Word equations and
  editable drawings remain intact; numbered sample outputs are rendered.
- [x] Catalog fits 320, 390 and 1280 pixel widths and existing anchors work.

## Checks and gates

- Required tests: independent registry coverage/sequence validation; focused
  filtering, source-context and numbered download browser regressions; existing
  PDF math/artifact, Word and topic-page checks where affected.
- Required static checks: reproducible generated catalog/registry, JS syntax,
  source artifact identity, same-origin download validation, git diff --check.
- Manual checks: rendered numbered PDF and DOCX variants, longest textbook
  labels, catalog screenshots and download progress/error feedback.
- Final gate marker: TEACHER_WORK_NUMBERING_OK.
- Checks intentionally not run: real classroom trial and external provider
  audit; neither is represented as completed.

## Review plan

- Rationale: bounded catalog and local browser export behavior, recoverable
  without touching learning data; MEDIUM.
- Trainer design consultation: not applicable; no trainer or learning sequence
  is created. Textbook order and source provenance receive focused review.
- Ready-result review: independent registry/export review and applicable gates.
- External review: not required for this task; no provider approval claimed.
- Handoff: public scoped code and results only, no private attachments, personal
  data, credentials or machine-specific paths in repository evidence.

## Risk and rollback

- Main risks: incorrect textbook membership/order; reassigning numbers after
  filtering; confusing PDF and independent Word work; export label overflow.
- Rollback: revert this task commit through a separately authorized release;
  existing source documents and mathematical banks retain their identities.
- Compatibility: preserve public topic anchors and source URLs. Numbered export
  adds a selected collection label; source file identity remains verifiable.

## Permissions

- START granted by owner in current conversation: yes.
- Branch creation, local commits, push and Draft PR: yes.
- Merge, auto-merge and deployment: no. The user-supplied AGENTS.md in this
  conversation requires separate explicit owner authorization and takes
  precedence over the repository's broader standing publication policy.
- Force, reset, rebase, admin override or weakened gates: not authorized.

## Execution record

- Checkpoint: Draft PR with completed browser/download checks. Exact final
  head, repeated CI and final visual review are recorded in the PR handoff.
- Actual branch: task/teacher-work-numbering
- Actual base SHA: 25548b86df75b8c90a5dc5c6f1f1925c2ad70636
- Actual head SHA: recorded in the PR handoff, after the final commit
- PR: https://github.com/ladynata-cloud/math-exam-fipi/pull/479
- Tests passed: 113 collection/2227 assignment DOM check; 21 registry
  regressions; existing 580 PDF / 2320 page checks and 792 independent displayed
  answer checks; 1413 Word checks; deterministic catalog and JS/Python syntax.
- Browser checkpoint: 383 scenarios, all 113 collections, 16 real downloads
  and 888 independent delivered-byte checks passed in GitHub Actions. Local
  Chromium cannot create its singleton socket; it is not claimed as executed.
- Document review: all 28 rendered Word pages and 12 numbered PDF pages
  inspected; original task bodies, native equations and drawings preserved.
- Continuation review: corrected the unpublished Merzlyak grade-seven sequence
  so parallel lines precede triangle-angle works; added a same-edition
  historical guard, checked against the exact PR base in CI. Numbered export
  controls remain disabled until successful initialization, so a missing script
  cannot silently download an unnumbered source file.
- The first cloud browser run exposed an invalid test assumption that every
  source DOCX contains native equation objects. The triangle student source and
  actual browser export both contain zero; the corrected test compares exact
  source/export equation and drawing counts and retains full-body equivalence.
  Displayed source notes now use checked textbook titles/parts/pages instead of
  internal topic IDs; all 2227 numbers and evidence paths remain unchanged.
- A subsequent browser helper was corrected to reopen saved selections in a
  fresh document; the completed run verified URL restoration and navigation.
- Fresh visual review caught 20 pages with absent formulas in the CI renderer:
  its minimal Writer installation omitted the Math component. All 212 native
  equation blocks and eight diagrams were byte-identical in actual downloads;
  complete LibreOffice rendered the same files correctly. CI now explicitly
  installs Math and checks 448 original paragraphs, including all 212 equations,
  across all 24 pages. The old incomplete renders fail this new content gate.
  This does not relabel the earlier visual failure as a pass.
- Mobile collection summaries reserve space beside the existing Navigator;
  final screenshots include the complete summary instead of a viewport crop
  that could leave it below the visible controls.
- Tests not run: external audit; real classroom trial
- Scope deviations: none

## Required handoff

```text
EXECUTIVE STATUS

Task:
PR:
Base:
Head:
Gate:
Tests:
Failures:
Not run:
Scope deviations:
Recommendation:
Next user decision:
```

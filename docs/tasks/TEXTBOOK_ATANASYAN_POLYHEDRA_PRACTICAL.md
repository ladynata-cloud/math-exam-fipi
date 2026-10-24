# Atanasyan 2024 — practical polyhedron nets 271–275

## Identity

- Task: `TEXTBOOK_ATANASYAN_POLYHEDRA_PRACTICAL`.
- Owner START: current conversation request «продолжай курс», following the
  completed PR329 publication and the explicit identification of 271–275 as the
  next independent block.
- Date: 2026-10-24 (Asia/Novosibirsk).
- Base branch: `main`.
- Base SHA: `631d2d644d87162d60585c3efb8365af8311a3f5`.
- Branch: `feat/atanasyan-polyhedra-practical`.
- Review level: `HIGH`, consistent with the established textbook content scope.
- Parent scope: [complete source-mapped textbook](TEXTBOOK_ATANASYAN.md).
- ADR0007 remains Proposed; this task introduces no new architectural decision.

## Goal

Complete the five practical source exercises on printed page84 / PDFpage86:
redraw the depicted nets at a larger scale on stiff paper, cut and glue a regular
tetrahedron, cube, octahedron, dodecahedron and icosahedron. Each exercise receives
its own faithful net, visible fold/cut guidance, matching seam pairs, retained
step explanations and honest manual assessment of the physical result.

## Context and evidence

PR329 was separately authorized, merged and published as the base above. Its
sole parent is `ff4d60fcd071b8208b93373a063d1a194aea93b7`; final evidence is in
[PR329](https://github.com/ladynata-cloud/math-exam-fipi/pull/329). Pages40111565939
and Profile40111566094 passed all six actual-merge jobs. Public byte verification
passed54 requests and focused live desktop interactions passed.

At this task start, authoritative remote main still equals the base, the isolated
task worktree is clean, and the public bundle again returned HTTP200 with
474 cards,1693 steps,1709 model states and SHA256
`bcb10fec3e270460d16729fe924530685b82b4f08b16e1667c3023fb3be7a9c3`.

The supplied source page was actually rendered and inspected. Figures95–99 are
specific nets, not generic closed-solid diagrams. There are no source subparts
or prescribed numerical edge lengths. Added seam numbers are instructional
labels, not invented source parts. Existing source-index rows already identify
all five positions with the exact printed/PDF page mapping.

## Approved scope

### In scope

- Exactly five cards `ex-main-0271` through `ex-main-0275`, one per source number.
- Main models reproduce the corresponding figure-specific planar nets using
  the existing `scene3d` renderer's planar mode and existing highlight views.
- Each cut-edge pair has an individually reachable help view. An illustrative
  glue tab is explicitly separate from the solid's faces; tabs are placed on
  only one side of each seam and never on fold edges.
- Explain uniform enlargement, regular face construction, cutting, folding,
  dry fitting, seam closure and physical checks. The finished solid can be
  inspected through the existing contextual theory cards.
- Five reviewed source completeness contracts, review registry/manifest,
  generated bundle, additive browser capture cases and independent numerical
  net/folding checks. Candidate target:479 cards and287 complete main exercises.
- Preserve and hash-pin the474-card prior release, its review records and all
  historical assertions; isolate previous-release fixtures where an old gate
  intentionally asserts its historical total.
- Reconcile the Atanasyan project-status section with PR329 production evidence
  inside this task, without a separate status-only PR.

### Out of scope

- Additional exercises288 onward or any other textbook/course.
- A folding animation, new drawing editor, automatic assessment of paper work,
  or a new interaction archetype.
- Board/cabinet integration, accounts, server data, storage migrations or hosting.
- Publishing the source PDF, page images or full-book extracts.

### Files or areas that must not change

All474 prior lesson files and review rows; existing runtime, renderer, formatter,
schemas and builder; unrelated courses and board/cabinet contracts. No obsolete
authoring generator is rerun.

## Acceptance criteria

- [x] All five source-specific nets and complete practical instructions match
  the actually inspected figures95–99; no source subpart is invented.
- [x] Face regularity, non-overlap of flat faces, connected hinge trees, complete
  seam pairing, folded closure, convexity and correct V/E/F counts pass an
  independent check derived from the actual authored model coordinates.
- [ ] Every new view is reachable and captured at320/1280; original-resolution
  images and all five full explanations are independently inspected.
- [x] Written/physical work remains manually assessed; a click or typed sentence
  never certifies a correctly assembled paper solid.
- [x] All474 prior cards, previous review evidence and old capture cases remain
  intact; the new total and source coverage are exact, not inferred thresholds.
- [ ] Reproducible build, full applicable content/schema/geometry/runtime gates,
  exact-head cloud runs, SEO/sitemap and final whitespace checks pass.
- [ ] One complete Draft PR records exact base/head and review provenance.

## Checks and gates

Required: existing textbook build/catalog/schema/content/parallel-content/model
geometry/runtime checks, previous numerical suites, the new independent net
mathematics suite, browser partitions/preflights and all cloud card journeys.
All old test assertions remain; prior exact totals use hash-pinned historical
fixtures while the integrated gate asserts the expanded479-card course.

Manual: actual source comparison, independent mathematical/pedagogical review,
all new model-state pixels and full-card explanations at both widths. Physical
paper construction and real-pupil trials are not claimed by a digital review.

Final handoff marker: `ATANASYAN_POLYHEDRA_PRACTICAL_REVIEW_OK`, only after its
required evidence is complete. This is not a publication marker.

## Review plan

The existing course keeps source, mathematics and pedagogy review separate from
authoring. Reviewers may not approve their own cards. Reviewed flags and registry
hashes are applied only after an independent exact-content verdict. The renderer,
manual work and help/step sequence are unchanged, so no new trainer-design
archetype or substantial interaction redesign is introduced.

Paid Claude remains deferred under the owner's existing whole-course scope in
`TEXTBOOK_ATANASYAN.md`; independent review and exact-head gates remain required.
No external-provider verdict is claimed. If external review is later used, its
provider, PR, base/head, verdict and verifiable source/timestamp must be recorded.
Remote/public handoffs omit private source bytes, personal information,
authentication material and machine-specific paths.

## Risk and rollback

Risks include substituting another net, overlapping flat faces, incorrect seam
correspondence, cutting a hinge, treating a tab as a face and implying physical
completion from digital activity. Independent topology/folding checks and actual
visual review address these separately. A scoped revert removes the five cards,
contracts, review registration, generated output and matching test increment as
one unit; prior course content and versioned learner data remain unchanged.

## Permissions

Current START authorizes branch creation, scoped implementation, validation,
logical commits, push and one Draft PR. Merge, auto-merge and deployment remain
**not authorized** for this new increment; PR329's completed authorization does
not transfer. No force/reset/rebase, non-fast-forward branch repair, admin
override, disabled TLS verification, paid call or weakened gate is authorized.

## Execution record

- Actual branch/base: as above.
- Source inspection: printed84 / PDF86 and figures95–99 confirmed.
- Five cards authored: 37 steps, 75 states, 45 independently matched seam pairs.
- Independent source/math/written-pedagogy review: PASS, no open findings; exact
  aggregate `63927ae8c646fed2390002f2efea7a2bb6f05878648e8e61877707f17c927f90`.
  See `docs/reviews/ATANASYAN_POLYHEDRA_PRACTICAL_MATH.json` for individual hashes,
  actual source inspection, timestamp and methods.
- Source/model/schema/content/runtime/numerical checks passed locally; complete
  previous 474-card data and registered reviews are preserved. Initial missing
  reviewer/timestamp metadata was corrected from the independent record before
  the passing schema/runtime runs; no content hash changed.
- A local child-process restriction affected the collector's preflight test;
  direct preflights passed, and the unchanged child-process test passed all 56
  positive/negative checks with its required execution permission. It launched
  neither a server nor a browser.
- Exact committed head, fresh cloud evidence, responsive image review and Draft
  PR are recorded in the PR handoff after this commit checkpoint.
- No new course content is published at this checkpoint.

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

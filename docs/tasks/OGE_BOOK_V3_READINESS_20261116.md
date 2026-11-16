# OGE book v3 publication candidate

## Identity

- Task: `OGE_BOOK_V3_READINESS_20261116`
- Owner: MathExam owner, explicit `START` in the current conversation.
- Date: 2026-11-16
- Base branch: `main`
- Base SHA: `83e1fc15a1b6b87f0133e0dec6753381e423bd92`
- Branch: `fix/oge-book-v3-readiness-20261116`
- Review level: `HIGH`
- Related ADR: [0012](../adr/0012-fixed-oge-book-editions.md), `Accepted`.

## Goal

Prepare a reviewable third edition of the OGE book and its fixed website
companion for the owner's intended November publication. Correct the confirmed
teaching defects and retain the already published editions unchanged.

## Context and evidence

The renewed audit checked the current course, v2's 71 entry URLs and the private
DOCX/PDF. The v2 deployed check passed all 367 byte/entry comparisons. Selected
current trainer and geometry resources matched the authoritative main above.
PR #631 has corrected the live equation explanations; v2 still contains the
older explanation. These observations are not a complete learner pilot.

The audit found three release-critical companion problems: old equation help,
wrong angle vertices in proof t20, and a rounded-angle method producing an
incorrect area in task25/type15. It also identified seven bounded explanatory
corrections. The current task18 model already labels its different numbers;
the new fixed copy must retain that label. Pending PRs #628/#630 and their
stacked dependencies are separate work and are not included.

## Approved scope

### In scope

- Source explanations for tasks7/9/11/16, tires, task24/t20 and task25/types13/15;
  refresh the author analogue's obsolete 2027 draft caption. Synchronize only
  the related task13/15 explanations in the shared proof wrapper.
- Rebuild only the affected existing download packages and their exact source
  bindings. Preserve other package members and all other packages.
- New fixed package `book/oge/2026-11-16/v3/` and 71 aliases `b/oge26-3/`.
  Parameterize the edition date, preserving historical defaults, immutable
  write guards, dependency closure and progress isolation.
- Regression tests and CI coverage for these corrections and v3. Update exact
  current-source fixtures only where the reviewed explanatory bytes changed.
- New private book v3 DOCX/PDF: 2027 exam year, separate 2026 publication year,
  dated 2026 score recommendation, printed contents and page numbers, four
  independently solved complete exit problems (21/22/24/25), and matching
  v3 links/QR. Large 205×290 mm layout with readable original text and art;
  rebuild the twelve insufficient-resolution mathematical diagrams accurately
  at their original physical sizes for printing.
- This specification, scoped status reconciliation and evidence report.

### Out of scope

EGE courses/books, new trainer architecture, unrelated pending PRs, full task
banks, account/payment/publisher submission, learner-result migration and a
claim of demonstrated learning gains.

### Protected areas

Published `book/oge/2026-10-31/v1/`, `v2/`, `b/oge26-1/` and `b/oge26-2/`;
original private v2 book; unrelated downloads; student storage schemas/IDs.
Private manuscript files must not enter this public repository or PR.

## Acceptance criteria and gates

- Exact area is accepted in all ten type15 parameter sets; no rounded-angle
  computation feeds the answer. Proof highlights use the intended vertex.
- The confirmed smaller explanation errors are corrected, with generators,
  answer keys and saved indices unchanged except the erroneous type15 result.
- Fixed package deterministic check, independent closure/hash verification,
  append-only old-edition check, generator negative controls and browser
  dependency/storage checks pass. New correction regressions cover both the
  current source and its frozen copy.
- Relevant existing math tests pass; any pre-existing failure is reproduced on
  the exact base and reported, not silently disabled.
- Book links/QR agree with the 71-entry v3 map, every PDF page is visually
  checked, fonts are embedded and new exit-task solutions are independently
  verified. Printed page/contents references agree.
- Final gate and exact results are recorded in the report/PR. Publication and
  a real-learner pilot are explicitly not claimed by local checks.

## Review plan

HIGH because multiple teaching surfaces and a fixed publication are involved.
Independent mathematical and technical cross-review is required. There is no
new trainer or substantial interaction sequence, so a new-trainer design
consultation is not applicable. The four book problems receive independent
solutions before layout. No paid external review was requested; no provider
approval is inferred. Remote handoffs contain only public scoped code and
sanitized evidence, never private book files or machine paths.

## Risk and rollback

The main risks are fixed links to outdated explanations, drawing/text mismatch,
print reflow, and leaking between editions' progress. Tests target those risks.
Before merge the task can be abandoned without changing the public site. After
a separately authorized publication, corrections require a new edition rather
than rewriting printed-link namespaces. Source fixes can be reverted through a
separate reviewed PR without invalidating published fixed editions.

## Permissions

- START, branch creation, local commits, push and Draft PR: **authorized**.
- Merge, auto-merge and deployment: **not authorized**. The narrower AGENTS.md
  supplied in this conversation overrides the repository's standing release
  authorization. Stop after a concrete reviewable Draft PR and book candidate.
- No force, reset, rebase, admin override or disabled TLS.

## Execution record

Actual base and branch are as above. Exact head, PR, checks, failures, exclusions
and next decision are recorded in `docs/reports/OGE_BOOK_V3_READINESS_20261116.md`
and the PR handoff so that this task does not require a self-referential commit.

## Required handoff

Use the repository `EXECUTIVE STATUS` fields: Task, PR, Base, Head, Gate, Tests,
Failures, Not run, Scope deviations, Recommendation and Next user decision.

# MathExam task specification

## Identity

- Task: OGE book link audit and fixed book edition, 2026-10-31.
- Owner: MathExam repository owner.
- Date: 2026-10-31 (Asia/Novosibirsk).
- Base branch: `main`.
- Base SHA: `139b944a70f2e8ba4d340d152d08807fad03e5da`.
- Planned branch: `audit/oge-book-edition-20261031`.
- Review level: `NEW_ARCHETYPE` for the first fixed book publication package.
- Related ADR: fixed book edition proposal prepared within this task; acceptance
  remains an owner decision before rollout.

## Goal

Verify the actual destinations in the 31 October PDF and DOCX of the OGE book,
repair reproducible defects, and prepare fixed copies with matching links and
QR codes. Separate source extraction, availability, complete learner scenarios,
mobile inspection, persistence, package integrity, and publication evidence.

## Context and evidence

- The owner directly requested execution, fixes in a separate branch, fixed book
  versions, matching links/QR codes and an auditable results register in the
  current conversation. This direct instruction is the current task start.
- PDF and DOCX Library versions are both version 3, modified 2026-10-31.
  The prior XLSX register is version 1 from 7 October in the owner's timezone.
- The PDF has 72 pages and 71 distinct annotation destinations; extraction of
  visible text, DOCX relationships and placed QR images is recorded separately.
- `main` includes PR377 (`c9bf66e2d95f48db0134d43cc590da89f8bc3053`)
  and PR374 (`139b944a70f2e8ba4d340d152d08807fad03e5da`).
- Existing downloadable trainer packages are mutable and are not accepted as
  immutable book copies or complete learner-test evidence.

## Approved scope

### In scope

- Extract and compare actual PDF/DOCX/QR destinations with the prior register.
- Verify every in-scope page using applicable learner actions, desktop/mobile
  rendering, topic correspondence, and saved-result recovery.
- Repair reproducible defects in those pages and their required dependencies.
- Prepare a fixed, versioned static book package and integrity/append-only gates.
- Produce an explicit URL/QR mapping and updated book release candidates.
- Preserve existing public addresses and unrelated exercises and learner work.
- Reconcile relevant project status against primary release evidence.
- Publish one task branch and one Draft PR with exact evidence and open items.

### Out of scope

- Merging, production deployment, changing hosting or protection settings.
- Redesigning unrelated courses, cabinets, model services or analytics.
- Claiming automated learner scenarios establish gains with real pupils.
- Replacing a failed/not-run action with a generic HTTP or visibility pass.

### Files or areas that must not change

- Unrelated textbook, cabinet, server and authentication code.
- Previously published exercise banks except a demonstrated in-scope defect.
- Original source book and old register remain retained as source versions.

## Acceptance criteria

- [x] Source hashes and every placed hyperlink/QR are traceable.
- [x] URL set and topic mapping agree between release-candidate PDF and DOCX.
- [x] Each applicable start/wrong/right/hint/next/finish/save action has evidence
  or an explicit failed/not-run/not-applicable reason.
- [x] Mobile and desktop checks distinguish overflow, visibility and usable controls.
- [x] All immutable runtime/data/style dependencies are fixed and hash checked.
- [x] Previously frozen bytes cannot be modified or deleted by a normal update.
- [x] Book progress is kept separate from existing public-trainer progress.
- [x] Registry distinguishes fully checked pages from incomplete/failing ones.
- [x] New URLs are labelled unpublished until a separately authorized release.

## Checks and gates

- Required tests: per-family learner scenarios; saved-result reload; applicable
  existing regression gates; immutable dependency and append-only tests.
- Required static checks: exact URL/QR extraction, source/dependency hashes,
  `git diff --check`, no secret/private-source inclusion.
- Manual checks: representative visual states plus every page's mobile/desktop
  dimensions, task controls and book-topic correspondence.
- Final gate marker: `OGE_BOOK_EDITION_AUDIT_OK` only if all required checks pass;
  otherwise explicitly `INCOMPLETE` with the remaining tests/findings.
- Checks intentionally not run: production verification of new URLs before merge
  and deployment; real-pupil learning validation.

## Review plan

- Review-level rationale: first versioned book package and protection contract.
- Trainer design consultation: not applicable to mechanically packaging existing
  trainers. Any substantial teaching/interaction redesign requires the existing
  Claude workflow before implementation; no consultation is claimed implicitly.
- Independent technical review of extraction, dependencies, integrity gates,
  regressions, and truthful classification of results.
- External review: required before rollout unless the owner grants a specific
  documented exception. Tool availability and outcomes are recorded honestly.
- Sanitized handoff: public source/diff and derived URL metadata only. No full
  private book, credentials, learner records or machine-specific paths in Git.
- Any release verdict must name provider, PR, base/head SHA, verdict and source.

## Risk and rollback

- Main risks: missed dynamic dependency, accidental escape to a mutable page,
  browser storage collision, unreadable QR or untested exercise mode.
- Rollback: do not release the new book until the package is accepted and live.
  Existing routes remain usable. A fixed edition is superseded by a new edition
  path, not silently edited; critical withdrawal uses an explicit owner decision.
- Compatibility: preserve the original URLs; version book content and storage.

## Permissions

- Current-task start: yes, direct owner Action request in this conversation.
- Branch creation, local commits, push and Draft PR: yes, necessary to the
  explicitly requested separate GitHub branch and concrete reviewable result.
- Merge, auto-merge and deployment: **no; separate owner authorization required**.

## Execution record

- Actual branch: `audit/oge-book-edition-20261031`.
- Actual base SHA: `139b944a70f2e8ba4d340d152d08807fad03e5da`.
- Actual head SHA, PR, commits and checks: recorded in the final report.
- Scope deviations: none authorized.

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

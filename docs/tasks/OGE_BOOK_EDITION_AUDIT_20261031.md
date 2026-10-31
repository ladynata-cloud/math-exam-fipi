# MathExam task specification

## Identity

- Task: OGE book link audit and fixed book edition, 2026-10-31.
- Owner: MathExam repository owner.
- Date: 2026-10-31 (Asia/Novosibirsk).
- Base branch: `main`.
- Base SHA: `139b944a70f2e8ba4d340d152d08807fad03e5da`.
- Planned branch: `audit/oge-book-edition-20261031`.
- Review level: `NEW_ARCHETYPE` for the first fixed book publication package.
- Related ADR: [ADR 0012](../adr/0012-fixed-oge-book-editions.md), Accepted under
  the owner's 2026-10-31 continuation instruction below.

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
- Scope deviations: none outside the explicit continuation below.

## Owner-authorized continuation, 2026-10-31

The owner supplied PR 387, base `139b944a70f2e8ba4d340d152d08807fad03e5da`
and head `6c4b61573b5a9e1eb166b72b91187a815d1648a7`, then directly instructed:
“сделай всё кроме внешнего ревью”. This is the current execution instruction,
not a review verdict copied from the attached earlier report.

- Complete the listed remaining preparation: accept the existing fixed-edition
  ADR, repair the two historical test contracts without weakening their
  intended protections, and correct the single diagnostic caption on book
  page 13 from ОГЭ-2026 to ОГЭ-2027 to match the actual diagnostic.
- Continue the same branch and Draft PR. The machine scope manifest
  `OGE_BOOK_EDITION_AUDIT_20261031.scope.json` fixes the original 278-path delta
  plus the exact continuation paths; it does not derive permission from the
  current diff. Task6's original release scope remains checked over its exact
  historical base and published endpoint. New out-of-scope paths must fail.
- Retain all division arithmetic, state and original-content invariants; use
  the actual published managed/guided runtime contracts for the migrated pages.
- Keep original private book documents and earlier evidence. Permit only the
  exact diagnostic-caption correction in document preservation checks; reject
  any unrelated wording, placement, link, image or QR change.
- Prepare and rehearse a read-only post-publication verifier for every frozen
  file and all 71 short entries and targets. Local evidence must not be called
  a production pass. Update PDF/DOCX, XLSX, archive and report consistently.
- External review is **NOT_RUN_BY_OWNER_REQUEST** for this continuation. The
  prior HTTP 400 remains a failed historical request with no verdict. Do not
  retry the provider automatically on branch updates. Retain an explicit
  manual opt-in for a future separately requested review. This is a task-only
  exception, not a general waiver or substitute reviewer approval.
- Merge, auto-merge and deployment remain unapproved. Physical devices,
  physical printed QR and real-pupil trials cannot be replaced by automation.

The local/CI preparation gate and the production/distribution gate are reported
separately. Passing preparation tests does not close unperformed release steps.

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

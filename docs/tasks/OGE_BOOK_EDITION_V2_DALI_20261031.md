# MathExam task specification

## Identity

- Task: repair the DALI image request and prepare fixed OGE book edition v2.
- Owner: MathExam repository owner.
- Date: 2026-10-31 (Asia/Novosibirsk).
- Base branch: `main`.
- Base SHA: `4a90592077934d9a6d8a617b4afa50938798efb2`.
- Planned branch: `fix/oge-book-dali-v2-20261031`.
- Review level: `MEDIUM`.
- Related ADR: [ADR 0012](../adr/0012-fixed-oge-book-editions.md), `Accepted`.

## Goal

Remove the reproducible literal portrait-image request from the public Task11
trainer and prepare a separate, immutable v2 with matching book documents,
71 addresses, 34 QR codes and fresh verification evidence. Retain published v1
exactly. Finish at a reviewed Draft PR and unpublished candidate deliverables.

## Context and evidence

- The owner gave a direct current-task `START` after the separate v2 proposal.
  Earlier PR387 merge permission does not authorize this task's merge or release.
- PR387 was merged as the named base and deployed by Pages run 41196769978.
  All 367 post-publication HTTP byte comparisons passed: 225 package files,
  71 aliases and 71 targets. The live browser gate nevertheless failed:
  141/142 entry checks and 10/10 isolation checks passed; entry54 at320px made
  the literal image request `'+DALI_PORTRAIT_DATA+'`, which returned HTTP404.
- Two focused live probes did not reproduce it. They are neither a correction
  nor evidence that the full-run failure disappeared. No v1 byte was changed.
- Exact v1 HTML SHA256 is
  `84e27ca2bd18773a2959a36765018cf0fb7eab2883fd7edc443efcde66a335ac`.
  A local split before the portrait's image-string token, delayed bootstrap and
  unchanged concatenated HTML bytes reproduce the real request in Chromium140.
  CDP records a parser initiator and the local server records HTTP404.
- The original portrait JPEG is 113621 bytes, 807x1024, SHA256
  `b6c33803d9aeb035f88eb3d7ca2f8f3a6a5f7d6c2300f9a67ad0e0103299cba5`.
  Its data-URI SHA256 is
  `aa8ff36826c2b213d3c6e52d3354b3613e7a3e3682455839e39f95aa180d36a5`.

## Approved scope

### In scope

- Reproduce the defect using exact baseline HTML bytes and controlled local
  delivery; capture CDP initiator, HTTP status, request and response identity.
- Make the portrait image without an interpolated `src` in `host.innerHTML`,
  then assign `DALI_PORTRAIT_DATA` to the actual `img[data-dali-portrait]` node.
- Create `/book/oge/2026-10-31/v2/` and `/b/oge26-2/01/` through `/71/`.
  Parameterize only the existing generator and verification/report tooling
  needed for another edition; preserve their v1 defaults and strict checks.
- Produce new v2 PDF/DOCX, 34 placed QR, address mapping, XLSX register and
  evidence archive. Preserve wording, the 2027 diagnostic caption, 72 pages,
  79 hyperlink placements and the 426 recorded learner-scenario structure.
- Rerun applicable mathematics, learner actions, package/append-only checks,
  separate retained-result checks and the image regression at320/390/1280px.
- Reconcile this book's project status with the completed PR387 release and
  prepare a complete new Draft PR with exact base/head and honest open items.
- The companion scope inventory fixes explicit permitted paths before edits;
  package paths are derived from the existing v1 inventory, not the new diff.

### Out of scope

- Merge, auto-merge, production deployment, hosting/protection changes.
- Changes to mathematics, exercise banks, pedagogy, storage architecture or
  unrelated public trainers/courses/cabinets/server/authentication code.
- A new paid or external-provider review. No external approval is claimed.
- Substituting local checks for future v2 publication checks, physical devices,
  printed QR scanning, Safari/Firefox/iOS, screen keyboard or pupil trials.

### Files or areas that must not change

- Every file in `/book/oge/2026-10-31/v1/` and `/b/oge26-1/`, including their
  manifests and aliases; no addition, deletion, rename or byte change.
- Original books, saved v1 candidates/register/archive and earlier evidence.
- Portrait JPEG/data URI, alt text, credit, dimensions and learning behavior.
- Existing historical Task6/division contracts and the base verifier's
  independent execution. No weakened test, gate or branch protection.

## Acceptance criteria

- [x] Exact unchanged baseline fails the image regression's negative control
  with a real parser-initiated literal request; an absent reproduction fails
  that control rather than silently passing.
- [x] Public and fixed v2 portrait pass initial/help/reload checks at all three
  widths with correct JPEG identity, no placeholder request, image breakage,
  page error, escaped dependency or horizontal overflow.
- [x] Existing v1 file inventory and every Git blob remain identical to base.
- [x] New 71 aliases/targets, dependency closure, manifest and namespaces agree;
  all existing relevant integrity and mutation controls retain their meaning.
- [x] Fresh source/v2 learner evidence covers all426 cases; mathematics is
  independently recomputed and is tied to the observed resource bytes.
- [x] New documents agree on71 destinations/79 placements/34 decoded QR and
  preserve72 pages, 2027 caption, non-URL text and layout.
- [ ] Register and archive distinguish local preparation from unpublished v2
  and preserve the historical v1 runtime failure.
- [ ] Independent focused review and applicable exact-head CI are complete.

## Checks and gates

- Required tests: exact-byte image negative/positive regression; source/v1/v2
  applicable learner and mathematical checks; package runtime142+10 checks per
  fixed edition; old/base verifier, append-only/corruption controls; existing
  arithmetic/Task6 gates where relevant; document negative controls; collector
  truthfulness; exact approved path inventory and `git diff --check`.
- Manual checks: actual image inspection for the changed portrait states and
  all72 rendered candidate document pages; workbook critical areas.
- Preparation marker: `OGE_BOOK_V2_PREPARATION_OK` only after required results
  pass. Production/distribution remains `INCOMPLETE` until separate permission,
  publication and the required live checks. No automatic release is implied.
- Intentionally not run: new v2 production requests before publication and
  the physical/other-browser/pupil checks named above.

## Review plan

- Rationale: one bounded image-resource correction and a mechanical next
  edition inside Accepted ADR0012; no new generator model, architecture,
  persistence behavior or teaching sequence is introduced.
- Trainer design consultation: not applicable to this mechanical correction.
  No design discussion or external-provider verdict is asserted.
- Ready-result review: independent internal review of changed code, negative
  control, package immutability, document preservation and result provenance.
- External review: not requested under the current owner instruction. MEDIUM
  requires focused review and regressions. ADR0012's PR387-specific exception
  is not treated as a standing waiver or an external approval for this task.
- Sanitized handoff: public code and derived evidence only; no private book
  files, credentials, personal data or machine-specific paths in Git/PR.

## Risk and rollback

- Risks: a browser-version-specific preloader regression, accidental change
  to published v1, stale evidence and mismatched printed destinations.
- Controls: exact baseline negative control and browser-version record,
  independent base verifier, byte comparisons, fresh reports and decoded QR.
- Before merge rollback is closing the unpublished candidate. Any later
  withdrawal/replacement needs an owner decision; never silently repair v1.
- V2 retains its own established edition namespace and does not migrate or
  clear public/v1 learner results. The original portrait data is retained.

## Permissions

- Current-task `START`: yes, direct owner message, 2026-10-31.
- Branch creation, scoped local commits, push and one Draft PR: yes.
- Merge: **no; new separate exact-base/head permission required**.
- Auto-merge: **no**. Deployment: **no**.

## Execution record

- Actual branch: `fix/oge-book-dali-v2-20261031`.
- Actual base: `4a90592077934d9a6d8a617b4afa50938798efb2`.
- Actual head/PR/commits/tests: recorded in the final report and PR.
- Local preparation and independent focused review: PASS; see the
  [verification record](../reports/oge-book-v2-20261031/verification.json).
  Exact-head CI and the final register/archive delivery are recorded after
  publication in the Draft PR and separate archive, avoiding a circular claim
  that this prepublication commit already passed its own CI.
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

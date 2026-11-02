# MathExam task specification: OGE_104_CATALOGUE

## Current continuation — 2026-11-03 (Novosibirsk)

This section supersedes the historical execution/permission state below.
The owner explicitly continued START and requested recovery of the existing
result, pairing/link/mobile/sitemap checks and a Draft PR, preferably using
cloud execution. The endpoint of this continuation is the requested Draft PR;
merge and deployment are not performed in this handoff.

- Linear: [MAT-9](https://linear.app/mathexam/issue/MAT-9).
- Current validation base: `b9ba38b27f5b306f0d81d01c67e0a636e5a06b84`.
- Existing task branch: `task/oge-2027-104-pdf-catalogue`.
- Recovered checkpoint: `2ef2ec0834dbeb6986fde66b73d61d43822f4e26`,
  tree `deae9bc94599f0d3636bbe0cbda211969e21a14e`.
- Review level remains MEDIUM. No new archetype or storage/server change.
- All 315 PDFs and the manifest remain byte-identical to the author archive.
- The former mobile padding fix was insufficient with a fallback system font.
  The correction uses a minimum usable grid-card width and 14 px mobile card
  padding, preserving the 15 px labels and three adjacent actions.
- Current scope additionally includes two focused verification scripts and
  `.github/workflows/oge-pdf-catalogue.yml`, implementing the cloud-check request.
  Existing workflows/gates remain unchanged.
- If required by the connector's 16 MiB request limit, a temporary cloud recovery
  workflow may assemble the large collection from verified binary chunks. This
  must preserve the original PDF SHA256/Git blob, use a normal task-branch push,
  and leave no chunks or temporary workflow in the final candidate.
- Branch maintenance, ordinary conflict resolution, tests, commits, push and
  Draft PR are authorized by the current request. All current-main product
  changes and both conflicting project-journal sections are preserved.
- External provider review is not performed under the standing owner policy.
  Fresh checks, preserved historical reviews, failures and unrun checks are
  distinguished in the [current report](../reports/OGE_104_CATALOGUE_20261103.md).

Acceptance adds all 104 exact-number searches, all eight filters, 315 HTTP/hash
responses, matching collection pages by text and raster, measured button bounds
at grid breakpoints with and without JavaScript, and exact changed-file inventory.
No PDF regeneration, bank publication, hosting changes or learner-data changes.
Rollback remains an ordinary scoped revert with no state migration.

## Historical specification and checkpoint — 2026-11-01

## Identity

- Task: `OGE_104_CATALOGUE`; owner: repository owner.
- Date: 2026-11-01 (Asia/Novosibirsk).
- Base branch: `main`.
- Base SHA: `37718f1c0138ba031314b8f4716b73c9d963bc81`.
- Branch: `task/oge-2027-104-pdf-catalogue`.
- Review level: `MEDIUM`.
- Related ADR: none; this uses the existing static-site and sitemap pipeline.

## Goal

Publish the owner's prepared 104 OGE mathematics variants at
`/oge/variants/2027/`, with adjacent separate PDF links for each variant,
its answers and detailed solutions, plus visible site entry points.

## Context and evidence

- The owner explicitly issued `START OGE_104_CATALOGUE` in the current task
  conversation after requesting publication on mathexam.space.
- Source package: 104 variants, 312 individual PDFs, three collections,
  catalogue and manifest; eight practical-task families occur 13 times each.
- Archive SHA256:
  `dd73d43382a8dcc9a659a7d5f65de520a9d4f1eabff40a7c94457c9a6d9af827`.
  All 1,738 manifest entries and ZIP CRCs were verified during preparation.
- The earlier inspected base was `a8eb6b26c917c337a3f9672c0b8eb40243f6e6a3`.
  Current main adds only geometry-provenance PR391; that change is preserved.
- The archive's integration patch used source copies with an extra newline
  and an incorrectly appended sitemap entry. Fresh changes use exact Git bytes
  and the unchanged sitemap generator; the old patch check is not reused.

## Approved scope

### In scope

- `oge/variants/2027/`: 315 unchanged source PDFs, unchanged manifest and a
  static catalogue. Use the plural `Решения`, retain a direct link to the old
  interactive variant and keep all button labels inside their borders.
- Bounded links in `index.html` and `oge/index.html`.
- Narrow PDF exceptions in `.gitignore`, one exact seed in
  `tools/seo-public-pages.json` and generated `sitemap.xml`.
- This task, its verification report and required bounded project-status
  reconciliation. One branch, one eventual Draft PR.

### Out of scope

- New/revised questions, PDF regeneration, source-bank/generator publication.
- Course or trainer redesign, assistants, accounts, hosting or workflow changes.
- Merge, auto-merge and deployment without separate owner authorization.

### Files or areas that must not change

- Existing trainers, learning/course runtimes, backend and persistence.
- Immutable book editions and aliases, existing gates and branch protection.
- TLS verification and credentials.

## Acceptance criteria

- [x] 104 ordered cards, three correctly paired files each, eight families x13.
- [x] All 315 PDF destinations return matching source bytes locally.
- [x] Search, eight filters, reset and no-JavaScript links work.
- [x] Labels and touch targets fit at 320/375/768/1280 pixels.
- [x] Homepage and OGE hub lead to the catalogue; old analogue remains reachable.
- [x] Sitemap retains every prior URL and adds the catalogue once.
- [x] Relevant local gates and independent internal review are recorded.
- [ ] Push and exact-head CI: blocked by unavailable GitHub write transport.
- [ ] Draft PR: not yet created; no merge or deployment performed.

## Checks and gates

- PDF/manifest hashes, byte sizes, page counts, variant headers and solutions.
- Existing sitemap tests, generator `--check`, SEO checks, catalog parity and
  browser entrypoint gates; source-package catalogue browser validation.
- Actual new entry clicks, responsive button geometry, visual inspection,
  scoped diff, protected-file identity and `git diff --check`.
- Local gate: `OGE_104_CATALOGUE_OK`; release remains blocked before push/PR.
- Limits: no new full mathematical/all-page visual review, physical phones,
  real learners, or live publication check; unchanged PDF bytes preserve their
  earlier source-review identity.

## Review plan

- MEDIUM: bounded navigation/static-download integration with no storage,
  authentication, server or architectural change.
- Trainer design consultation: not applicable; no trainer/sequence redesign.
- Independent internal review covered source identity, links, sitemap,
  accessibility and scope; follow-up reviewed the mobile spacing correction.
- External review: not required by this MEDIUM scope and not claimed.
- Handoffs exclude credentials, private learner data and machine-specific paths.

## Risk and rollback

- Risks: wrong pairings, omitted PDFs, navigation or sitemap failures.
- Checks bind the actual source and product bytes and exercise delivery/UI.
- Rollback: separately authorized revert of the one task change; restore
  integration files and remove the catalogue together. No data migration.

## Permissions

- Actual current-conversation START: yes.
- Branch, local commit, push and Draft PR: yes under that START.
- Merge, auto-merge and deployment: no; separate owner decision required.
- This document records the user instruction; it is not a reusable approval
  marker or an external-review verdict.

## Execution record

- Branch/base: as above; local head is supplied in the final handoff.
- Report: [OGE_104_CATALOGUE_20261101](../reports/OGE_104_CATALOGUE_20261101.md).
- PR: not created. CLI authentication is unavailable; the connected GitHub
  create-blob calls did not complete. No remote task ref was found afterward.
- The temporary environment was lost during the stalled write. Product files
  were restored and checked against every recorded review hash and source PDF.
- Scope deviations: none; sitemap seed was included in the approved proposal.

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

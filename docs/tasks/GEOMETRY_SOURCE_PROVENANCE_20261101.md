# Geometry source provenance repair

## Identity

- Task: `GEOMETRY_SOURCE_PROVENANCE_20261101`
- Owner: repository owner, by direct approval in the current task conversation.
- Date: 2026-11-01 (Asia/Novosibirsk; 2026-10-31 UTC).
- Base branch: `main`.
- Base SHA: `a8eb6b26c917c337a3f9672c0b8eb40243f6e6a3`.
- Planned branch: `fix/geometry-source-provenance-20261101`.
- Review level: `MEDIUM`.
- Related task: PR389, `GRADE6_LCM_MULTI_CABINET`; separate implementation.
- ADR status: ADR0001 remains `Proposed`; no architectural decision is made.

## Goal

Restore the audited binding between the expanded canonical geometry course,
the unchanged 255-card beginning course, and its packaged assistant knowledge,
so both geometry source workflows can validate the actual published source.

## Context and evidence

Both failing PR389 workflows invoke the same first-steps source guard. Current
`main` contains 1247 cards, while that guard still pins the earlier 705-card
bundle. The same source files and failure are present on the unchanged base.
This is the JSON bundle fingerprint, not the textbook PDF fingerprint.

Independent read-only comparison preserves every historical 705-card record
and catalog entry and every selected 255-card record. The original selected
content digest, historical fixtures, PDF identity and byte-restoration checks
remain authoritative. See the previous bounded repair in
[MATVEY_GEOMETRY_HELPER_CLARITY](MATVEY_GEOMETRY_HELPER_CLARITY.md).

The owner explicitly approved this separate repair and separately waived
external review for **PR389 only**, because the provider is unavailable and
independent checks were completed. That waiver is recorded in PR389 metadata;
it is not an external-provider verdict or permission to merge either PR.

## Approved scope

### In scope

- Update the audited full-source pin in the existing first-steps builder and
  source regression check, preserving all selection and restoration checks.
- Regenerate `learning/atanasyan-first-steps/course.json`: only `source.sha256`.
- Regenerate `assistant-service/knowledge/atanasyan-first-steps.json`: only
  `sourceSha256` and `courseSha256`.
- Update the corresponding current-artifact pins in the Ichenskaya source
  check and assistant course-context test; clarify their provenance comments.
- Record the audit, compatibility/release constraints and relevant checks in
  this task, a report, and the existing project status document.
- Validate a read-only composition with PR389 without altering its branch.

### Out of scope

- New content, altered answers, diagrams, pedagogy or trainer behavior.
- Source expansion, provider calls, account access, private learner records,
  schema migrations, backend contracts, authentication or storage changes.
- Changes to CI workflows, merge, auto-merge, deployment, or integrating a new
  base into PR389 without separate authorization.

### Files or areas that must not change

- Canonical textbook source JSON/PDF, all historical fixtures and immutable
  content fingerprints, card IDs/revisions and original course records.
- Ichenskaya teaching course, source manifest and assistant knowledge.
- Runtime/backend/service code, workflow assertions and branch protection.
- All PR389 product changes and its branch history.

## Acceptance criteria

- [x] The deterministic builder and assistant generator pass in check mode.
- [x] Structural JSON diff contains exactly the three permitted metadata
  fields across the two derived artifacts; all teaching payloads are intact.
- [x] Historical 705-card and selected 255-card evidence matches; original
  byte-restoration and selected-content hashes remain unchanged.
- [x] Both geometry source, model, DOM, saved-work and browser gates pass.
- [x] Assistant/board course contexts agree for all 799 first-steps steps;
  mismatched revisions and invalid contexts remain rejected.
- [x] Focused independent source review and rollback are recorded. Published
  exact-head and CI evidence belong in the final Draft PR metadata; failures
  and unperformed checks remain separate.
- [ ] A separate Draft PR is prepared with no merge or deployment.

## Checks and gates

- Required tests: both `tools/atanasyan-first-steps/*.test.cjs` and
  `tools/ichenskaya-grade7-works/*.test.cjs`; both existing browser runners;
  assistant-service tests and relevant board helper boundary tests.
- Required static checks: both source builders, Ichenskaya mathematics audit,
  assistant knowledge check, canonical full-course check, sitemap check,
  immutable-source/JSON-diff audit, and `git diff --check`.
- Manual checks: bounded diff and independent historical-source audit;
  no teaching or interface changes require a new design review.
- Final gate marker: `GEOMETRY_SOURCE_PROVENANCE_PREPARATION_OK`.
- Not run in preparation: real-account trials and production deployment;
  no paid/external-provider request. Final PR metadata records CI separately.

## Review plan

- Rationale: `MEDIUM` for a bounded coordinated artifact revision with
  recoverable packaging risk. No server contract, authorization, persistence,
  runtime algorithm, deployment configuration or teaching content changes.
- Trainer design consultation: not applicable to mechanical provenance
  synchronization; no new trainer or changed learning interaction.
- Before implementation: independent audit of canonical and historical
  source/projection identity; no new provider request or design approval.
- Ready-result review: an independent agent inspects the complete six-file
  repair, immutable evidence, helper compatibility and gate results.
- External review required: no under `MEDIUM`; the PR389 exception is not
  extended to this task and no external verdict is claimed.
- Sanitization: public repository material and synthetic evidence only; no
  private documents, learner identities, credentials or machine paths.
- Any later external review must name provider, PR, base/head, verdict and a
  verifiable source/timestamp; this specification is not review evidence.

## Risk and rollback

The helper and cabinet derive `courseRevision` from the whole first-steps
course. The artifact and assistant snapshot must be packaged and processes
restarted from the same approved revision. Mixed versions fail closed and can
consume a reserved helper request without producing an answer. This task
does not deploy either component or change quota behavior.

Saved browser work keys depend on unchanged lesson IDs/revisions, not on the
source bundle hash. No migration is needed. Before publication, closing the
Draft abandons the candidate. After separate release approval, rollback must
restore the prior course and helper package together, without deleting work.
That reintroduces the known old source-audit failure; it does not corrupt
teaching records or silently approve the stale fingerprint.

## Permissions

- Current task approval / START: **yes**, the owner's direct approval of the
  separately proposed repair in this conversation; no copied approval used.
- Branch creation, local commits, push and Draft PR: **yes**.
- Merge, auto-merge and deployment: **no**, require separate owner approval.
- PR389 review exception: applicable only to its presented base/head; recorded
  in that PR, without a fabricated provider verdict.

## Execution record

- Actual branch: `fix/geometry-source-provenance-20261101`.
- Actual base: `a8eb6b26c917c337a3f9672c0b8eb40243f6e6a3`.
- Actual head / PR / commits: recorded in the Draft PR after publication.
- Passed, failed, not-run checks and scope deviations: final verification
  report and exact-head PR metadata, without self-referential commit hashes.

## Required handoff

```text
EXECUTIVE STATUS

Task: GEOMETRY_SOURCE_PROVENANCE_20261101
PR: Recorded in final handoff
Base: a8eb6b26c917c337a3f9672c0b8eb40243f6e6a3
Head: Recorded in final handoff
Gate: GEOMETRY_SOURCE_PROVENANCE_PREPARATION_OK (local)
Tests: Source/immutable audit; 24 course + 119 assistant + 31 board tests; both browser gates and 8-scenario helper integration PASS
Failures: No repaired-candidate local failure; original base pin mismatch remains recorded
Not run: Production deployment, real-account trial, external-provider review
Scope deviations: None
Recommendation: Publish Draft and verify exact-head CI plus read-only PR389 composition
Next user decision: Separate merge/release authorization after review
```

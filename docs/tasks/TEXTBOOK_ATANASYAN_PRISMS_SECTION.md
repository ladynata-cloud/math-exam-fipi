# Atanasyan chapter III §1: polyhedra and prisms

## Identity

- Owner: Natalia Mikhailovna; date: 2026-10-23 (Asia/Novosibirsk).
- Base: `main`, `6a1f0488e33f9836663382a2e220e69092910337` (published PR301).
- Branch: `feat/atanasyan-prisms-section`.
- Review level: HIGH, for source completeness and mathematical correctness.
- Architecture: existing textbook schema, builder, model viewer and learner flow.

## Goal and evidence

Extend the published course through every question of exercises218–238 and
theory27–31, including starred material, using the owner's Atanasyan2024 source.
Keep a separate clear model for each task, show the given configuration first,
and reveal auxiliary constructions with justified steps and optional help.

PR301 is published as the base commit. Its315 reviewed cards,1020 steps and1086
views are the preservation baseline. Its exact-head checks and434-image review
passed; Pages39849875322 and public byte verification confirmed publication.
The source PDF identity is already recorded in the book catalog. Raw source
files remain private and are not repository inputs.

## Approved scope

- Theory27–31 on printed pages63–70 and exercises218–238 on pages70–72.
- All subparts and unlettered requests: both answers in223, both surface areas
  in each case of229, all projection-area proof cases and De Gua's theorem in31.
- Explain the source interpretation in235 explicitly. Check strict parallelism
  in226 and the common-vertex angle convention in227.
- New lesson records, reviewed source-part contracts, additive content/model and
  browser checks, generated catalog, and review/status documentation.
- Preserve all315 previous lesson records, learner storage, grading/runtime,
  existing215 screenshot cases and exhaustive two-width browser journeys.
- Later sections, other textbooks,7–9 content, paid reviews and workflow changes
  are outside this bounded release.

## Acceptance criteria and checks

- [x] Independent source, mathematics, coordinates and pedagogy review of every
  new card, bound to its canonical content hash.
- [x] Complete source contracts; later sections remain explicitly pending.
- [x] Reproducible build; catalog/schema/content/model/runtime/sharding gates.
- [ ] Additive exact-head Chromium checks at320px and1280px, including all cards,
  steps, model labels, expansions, saved work and real-tab interactions.
- [ ] Actual review of new or changed cloud screenshots; existing image identity
  comparison against the reviewed434-image publication baseline.
- [ ] All applicable exact-head GitHub checks pass; final diff and tree verified.
- [ ] Normal reviewed publication, followed by Pages and public byte checks.

Final marker: `ATANASYAN_PRISMS_SECTION_OK`. A marker is recorded only after its
checks pass. Local browser installation is unavailable; browser evidence will
come from the existing cloud jobs. No skipped check is reported as passed.

## Review plan

Three authors prepare disjoint theory/exercise batches. Independent reviewers
inspect the original source, full solutions and model geometry. Root integrates
only approved hashes and independently reviews the final diff and visual output.
The existing interaction is reused, without a new trainer archetype. Paid Claude
consultation/review remains deferred by the owner's standing instruction; no
Claude verdict is claimed. Review records contain only sanitized project facts.

## Risk, compatibility and rollback

Risks are an omitted subquestion, an incorrect geometric assumption, or a model
that reveals construction too early. Explicit completeness contracts, independent
proof/coordinate review and cloud screenshots address those risks. Existing card
IDs, revisions and storage remain unchanged. A normal revert of this bounded
release restores the previously published course without rewriting history.

## Permissions

The owner instructed continuation without stopping and cloud execution after
authorizing publication of the course. This standing instruction authorizes the
bounded implementation, branch/commits/push, draft PR, reviewed merge and Pages
publication without another routine confirmation. Technical gates remain required.
No force, reset, rebase, admin override or paid external service is authorized.
Concurrent main changes must be inspected and the composed result revalidated.

## Execution record

Implementation complete:36 independently reviewed new cards,144 steps and130
views. The course now contains351 cards,1164 steps and1216 views. Main1–238,
theory1–31 and26 chapterI–II self-checks are complete;958 catalog rows remain
pending. All315 previous lesson files and their content hashes are unchanged.

[Content review](../reviews/ATANASYAN_PRISMS_CONTENT.md) passed at
2026-10-22T21:09:07.102Z. Source/schema/content/model/runtime checks passed,
including26 new source-specific regression groups and56 sharding/collector tests.
Browser-free preflight confirms351 cards and372 ordinary screenshot states
(744 width-specific PNGs plus4 expanded models). All215 earlier cases remain.

Cloud browser/visual review and publication remain pending in this commit; no
release marker is claimed. Exact head, PR, workflow results, any failures and
production identity are recorded in the PR to avoid rewriting a tested head.

The first cloud run39855680695 passed automated checks. Actual inspection of all
314 new screenshots found geometry orientations and mobile wrapping to improve.
Eleven cards were corrected and independently re-reviewed by canonical hash;
all315 published cards and all tests/runtime/workflows remain unchanged. Fresh
cloud verification and visual approval of the corrected head remain pending.

## Required handoff

Report task, PR, base/head, gate, passed/failed/not-run checks, scope deviations,
recommendation, next user decision, current main/base drift and release identity.

# Atanasyan 10–11: IV §3 Sphere, points 43–51 and exercises 372–395

## Identity

- Task: Complete the next numbered paragraph of the existing Atanasyan 2024 course.
- Owner: repository owner.
- Date: 2026-10-31.
- Base branch: `main`.
- Base SHA: `139b944a70f2e8ba4d340d152d08807fad03e5da`.
- Planned branch: `content/atanasyan-sphere-372-395-20261031`.
- Review level: HIGH.
- Related scope: [complete textbook](TEXTBOOK_ATANASYAN.md).
- ADR 0007 remains Proposed; existing code and gates define the implemented contract.

## Goal

Add every exercise part 372–395 and every theory point 43–51, with accurate
source references, original progressive explanations and task-specific geometry.
Preserve the 594 published cards and their saved-work identities. The expected
complete candidate has 640 cards: 37 new exercise cards and 9 new theory cards.

## Context and evidence

Cone PR #374 was published as the base above. Its reviewed tree is
`3f3f95a5cc37d8831742b3c6d60e555b1b016b76`; Pages run 41143302786 succeeded.
The published bundle SHA256 is
`2f129a9bab292fae765c674268448895d0419e70e0fd4fd30120fcae53569bc1`.
The owner subsequently requested continuation in the active conversation.

The supplied 2024 source has SHA256
`bead97a383e438b32b9caaff72d61d27e8fa6cd20c6b86a5f234bc4cdb629770`.
Theory is printed pages 100–109 / PDF 102–111; exercises are printed pages
110–111 / PDF 112–113. Exercise 382 has both а and б on printed page 110.
Its б-part section area is 12 cm² without pi; exercise 390 has 324 cm² without pi.

Independent source/expected-mathematics review was completed before candidate
authoring. It is not approval of candidate code, models, screenshots or CI.
A separate session reported an unshared candidate. Authoritative branch and PR
inventories had no Sphere candidate when this single shared task was started.
Reuse this branch/PR for subsequent work; do not create a competing batch.

## Approved scope

### In scope

- Exactly 46 new JSON lesson files under `stereo-course/textbook/lessons/`:
  exercise parts 372–395 and theory points 43–51.
- Narrow source-index completeness metadata for these 33 source positions;
  correct the omitted 382б and preserve all unrelated source metadata.
- Reproducible course bundle, one additive independent-review batch,
  additive model-state screenshot cases and sphere-specific mathematical gates.
- Extend prior preservation projections for this appended batch while retaining
  every historical payload, hash, case and meaningful negative control.
- Update companion coverage expectations for the now-complete paragraph.
- Reconcile the cone publication entry in PROJECT_STATUS and record actual
  Sphere preparation status within this task.
- Add the bounded sphere checks and evidence collection to the existing
  textbook CI workflow without weakening inherited checks.

### Out of scope

- Later numbered exercises, chapter IV self-check questions and point 62.
- A new renderer, learning interaction, schema or persistence design.
- Unrelated courses, assistants, authentication, payments and deployment changes.

### Files or areas that must not change

- All 594 published lesson files and their bundle records and review records.
- Shared renderer, styles, offline visibility core, course engine, schemas and
  builder contracts; prior visibility profiles and migration fixtures.
- Existing saved work, revisions, source IDs, routes and exact historical hashes.
- The source PDF, rendered source pages, private file IDs and machine paths
  must not be committed.

## Acceptance criteria

- [ ] Exactly 640 cards: 594 preserved, 37 new exercise parts, 9 theory points.
- [ ] Source, mathematics and pedagogy independently reviewed for all additions.
- [ ] All theory proof assignments, remarks and boundary cases are covered.
- [ ] Geometric incidence, tangency, actual side contacts and hidden lines hold.
- [ ] Every authored state and final explanation inspected at mobile and desktop widths.
- [ ] Full 1280 card/width browser journeys and retained-work regressions pass.
- [ ] Prior runtime, source, model and shared-consumer gates remain passing.
- [ ] Exact head, changed-file set and complete test evidence recorded in Draft PR.

## Checks and gates

- Required tests: existing source/catalog/schema/content/model/runtime gates;
  all historical mathematics and preservation checks; sphere source/math and
  preservation checks; existing visibility and shared-consumer gates.
- Browser: full course at 320 and 1280 CSS px, exact shard union and provenance,
  actual new state images and explanations, saved-work and theory-return flows.
- Static checks: reproducible build, `git diff --check`, source metadata,
  review hash binding, unchanged old card blobs and protected assets.
- Manual checks: mathematical completeness, source figures, learner clarity,
  labels, visibility and actual first-viewport layout when any fit claim is made.
- Final gate marker: `ATANASYAN_SPHERE_372_395_OK` only after all applicable gates.
- Current gate: implementation pending; no candidate approval.

## Review plan

HIGH because authored mathematical proofs and existing persistent learner work
must remain reliable. Existing interaction is reused; no new trainer archetype or
substantial interaction redesign is approved.
Paid Claude calls remain deferred by the owner's whole-textbook decision recorded
in TEXTBOOK_ATANASYAN.md. No Claude or other external-provider verdict is claimed.
Independent source/proof/model review and exact-head checks remain required.
Separate authors and reviewers for the actual new payloads; bind review hashes
only after independent review. Sanitize any remote handoff.
External-review provenance, if used, must include provider, PR, base/head, verdict
and a verifiable source or timestamp.

## Risk and rollback

Main risks are omitted subparts or theory proofs, invalid tangencies, inaccurate
hidden lines, labels that leak answers, and changed existing learner work.
Retain old identities and use an ordinary scoped revert if a future authorized
release must be withdrawn. No data migration is involved.

## Permissions

The owner's repeated "продолжай" in the active conversation continues the approved
whole-textbook task and authorizes this bounded paragraph implementation, local
commits, branch publication and Draft PR.
Merge, auto-merge and deployment are not authorized for this new PR. The earlier
exact-base/head authorization applied to cone PR #374 only.

## Execution record

- Actual branch: `content/atanasyan-sphere-372-395-20261031`.
- Actual base SHA: `139b944a70f2e8ba4d340d152d08807fad03e5da`.
- Actual head SHA and PR: recorded in the live Draft PR.
- Tests: independent source pre-review completed; candidate checks pending.
- Scope deviations: none.

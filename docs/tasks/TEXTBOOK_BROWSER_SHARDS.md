# Atanasyan browser CI: complete four-way coverage

## Identity and boundary

- Owner: MathExam course owner; executor: Codex; overlay author: ege_profile_inventory.
- Date: 2026-10-21 UTC. Review level: **HIGH** (CI/release evidence boundary).
- Preparation seed: local `187a93bcba74cc9f31b9169aa85b9f482c72448c`, equivalent
  PR299 head `c5c97a6e75d5936f01f8f371bb078bd31269b1d3`, tree
  `8f91a288ddae3c403a9b2e3c0fb0e2e5d4dbe849`.
- Actual integration base: `5953d69400615fdb4f8c6537f0af5a3c1355865a`,
  the verified PR299 squash with the exact seed tree above.
- Branch: `ci/atanasyan-exhaustive-browser-shards`. Exact head and cloud evidence
  are recorded in the scoped PR; no product content is changed.
- No product learning sequence, engine, models, source contents, storage, grading
  or student data changes. No new trainer archetype or paid Claude consultation.
  Claude API use remains explicitly deferred by the owner.

## Goal and scope

Keep the existing exhaustive browser gate usable as the full textbook grows.
A prerequisite job retains every source/catalogue/schema/content/model/runtime
check and reproducible-build check. Four browser jobs deterministically assign
sorted lesson IDs by position modulo four. Each assigned lesson still runs both
320px and 1280px and all existing assertions, steps, nested help, theory, reload,
input retention, camera, labels, overflow, and mathematical feedback checks.
The representative first-card expansion/nested-theory scenarios run in its
own shard; the two real-tab scenarios run in shard zero. The collector validates
all four successful jobs and their exact complete union before publishing the
usual flat `atanasyan-textbook-visuals` artifact.

In scope: runner orchestration/evidence, shared screenshot/partition contract,
strict collector, negative fixtures, workflow. All product files and all existing
source/schema/content/runtime/model tests must remain unchanged.

## Required invariants

- `EXPECTED_COUNT` is one explicit reviewed boundary in `browser-shards.cjs`
  (183 for this seed), never inferred from the bundle. Runner and collector use it.
- No shard can omit a card or width, finish partially, claim another assignment,
  mix Git/bundle/author hashes, duplicate screenshots, or report browser errors.
- Exact label-state identities and their readability/geometry outcomes survive
  aggregation. Exact four expanded images, eight restoration paths, two real-tab
  cases remain mandatory across the full run.
- Every expected PNG exists once, has its expected viewport width, and the final
  artifact records input-evidence and PNG SHA256 provenance. Unknown artifact
  directories/files and symlinks are rejected. No combined PASS artifact is
  uploaded after any prerequisite/matrix/collector failure.
- Default single-shard operation remains available; CHECK_ONLY cannot start a
  browser or HTTP server. Existing per-action timeout remains 15 seconds.
- Browser job ceiling is 45 minutes for the future full book; source job stays
  25 minutes and collector 10 minutes. This changes job scheduling, not assertions.

## Workflow provenance and security

`contents: read` and checkout `persist-credentials: false` are preserved.
All existing action pins, Node22, Playwright1.62.1, jsdom26.1.0, ajv8.17.1 and
ajv-formats3.0.1 stay unchanged. The only new action is download-artifact v8.0.2,
SHA `9000827ccba6bdab643e8b6fd33ac0654aef8333`, verified by the integrator against
its official action.yml before this task:
https://github.com/actions/download-artifact/blob/9000827ccba6bdab643e8b6fd33ac0654aef8333/action.yml
It supports pattern downloads, same-run artifacts without an extra token, and
uses the default digest-mismatch error behavior. `merge-multiple: false` preserves
individual shard directories for independent validation. No secrets or tokens
are introduced.

## Validation and review

Local unit tests cover exact partitioning and negative cases for missing,
duplicate, unknown, wrong-SHA, wrong-width, failed/incomplete evidence, label
visibility/size/overlap/clipping, missing restores/tabs, wrong PNG data and missing
artifact files. CHECK_ONLY is executed with Playwright imports and HTTP-server
creation forbidden. The old browser behavior functions are compared with the
seed; only evidence owner attribution changes inside card/checkLabels.
Independent HIGH prefreeze review passed at 2026-10-21T22:13:04.250Z
(Codex ege_base_inventory), exact seven-file manifest SHA256
`c81a7d299a45850e644f47ab8e17aee0826b92c3c63f14fd10ee7653db83ee43`.
All 19 prior browser behavior functions and 85 screenshot pairs are preserved.
Independent replay of the actual 183-card PR299 evidence, 56 unit checks and
13 extra negative cases passed. Replay is compatibility evidence, not a new
browser run. Exact-Git review and a real four-shard cloud run remain required.
Synthetic fixture PASS is not browser/visual approval.

## Risk and rollback

Primary risks are a silently incomplete aggregate, accidental weakening during
partitioning, or a false negative from evidence identity assumptions. Fail-closed
collector checks and negative tests address the first two; the first real cloud
run and independent review must assess compatibility. Rollback restores the
previous single browser workflow/runner and removes only the new CI helper files;
no product data migration is involved. The owner authorized cloud implementation and publication. Normal exact-head
review, authoritative base checks, verified squash and production verification
remain required; no force operation or gate weakening is authorized.

## Current execution status

Local catalogue7, schema1291/183, content183/581steps/659views, parallel15groups,
model614polygons/2192segments, runtime and56 shard/collector checks PASS.
Browser-free preflight PASS for default and all four assignments. No local
Chromium launched; no new cloud workflow or visual review completed yet.

Proposed release gate: `ATANASYAN_BROWSER_SHARDS_OK`, pending the real cloud
union and publication evidence. Existing student content remains183 cards.

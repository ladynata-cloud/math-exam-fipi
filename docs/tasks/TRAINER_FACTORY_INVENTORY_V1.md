# Trainer Factory v1 — Phase 1: trainer-inventory

## Identity

- Review level: `HIGH`
- Canonical base: `main` at the exact SHA named in the approved `START`
- Parent plan: [Trainer Factory v1](TRAINER_FACTORY_V1.md)
- Final gate: `TRAINER_FACTORY_INVENTORY_V1_GATE_OK`

## Goal

Create a deterministic, read-only inventory subsystem that classifies existing
trainer candidates and publication evidence before any publication or adapter
task. Inventory output supports owner decisions; it never grants publication,
registry membership, board discovery, mirror capability, or usage authority.

## Scope

In scope:

- a standard-library Node.js inventory CLI and reusable module;
- a closed versioned descriptor schema;
- the committed public-URL conformance fixture and one executable normalizer;
- repository, sitemap, course/manual, asset, manifest, dependency, storage,
  network, iframe, Bridge, Socket.IO, state, provenance, and duplicate evidence;
- deterministic full and incremental runs;
- machine JSON, human summary, sanitized handoff, and run metadata;
- a synthetic cohort of at least 5,000 candidates;
- read-only reconciliation of Pilot A;
- the `trainer-inventory` skill contract, tests, and format documentation.

An optional `--intake-root` is allowed only when the owner provides the exact
root and explicit permission. No unpublished location may be searched,
guessed, or scanned by default.

Out of scope:

- editing trainer HTML, assets, site or course discovery, sitemap, manifest,
  board, server runtime, Bridge, registry endpoint, Socket.IO, or deployment;
- publishing or adapting a trainer;
- adding a production nested manifest entry;
- implementing `trainer-publish`, `trainer-adapter`, or
  `trainer-batch-release`;
- Pilot B, roads-grid, Trainer Factory core changes, or a new trainer.

## Input and output contract

The default input is tracked `.html` files below `trainers/`, the tracked
sitemap and HTML reference surfaces, and the validated current runtime
manifest. Inputs are opened read-only. Symlinks and unsafe canonical paths are
reported and skipped.

Each candidate records:

- stable inventory ID, source SHA-256, byte size, basename, canonical repository
  path, MIME, and derived canonical public URL;
- published baseline and the independent `FILE_PUBLISHED`, `SITE_DISCOVERY`,
  `BOARD_DISCOVERY`, and `BOARD_MIRROR` surfaces;
- sitemap, course, manual, site, board, and runtime registry evidence;
- HTML title and metadata, assets, external origins, network calls, storage and
  statistics signals, scripts, styles, iframe, Bridge, Socket.IO, and state
  signals;
- proposed archetype and Factory track with evidence;
- provenance, usage authority, pedagogical review, mobile/iframe review,
  duplicate disposition, risks, errors, and unresolved questions.

Generated output is ignored and contains:

- a versioned deterministic `inventory.json`;
- `summary.md`;
- `sanitized-handoff.json`;
- run duration, memory evidence, counts, input hashes, tool version, and
  incremental reuse counts.

No output may contain credentials, secret values, personal data, or a
machine-specific absolute path.

## Authority boundary

The descriptor is evidence, not runtime authority.
`trainers/board-compat.json` remains runtime source data and its validated
server projection remains runtime authority. Repeated runtime fields are marked
`cross-check-only` and must match the manifest exactly in name, type, presence,
and value. Missing, extra, or stale repeated fields fail closed. A match still
does not authorize board discovery or mirror behavior.

## Canonical URL and duplicate rules

The executable normalizer consumes
`tools/fixtures/trainer-public-url-conformance.json`. Query and fragment do not
participate in identity. Raw pathname validation occurs before WHATWG parsing.
No decoding or repair is allowed. The normalizer is inventory-only.

Every candidate uses one explicit disposition:

- `CANONICAL`
- `ALIAS`
- `REDIRECT_WRAPPER`
- `ARCHIVE_COPY`
- `EXACT_DUPLICATE_APPROVED`
- `DUPLICATE_UNRESOLVED`

Release blockers are duplicate `trainerId`, duplicate full canonical path,
ASCII case-fold path collision, normalized public URL collision, and unresolved
exact-blob duplicate. Equal basenames in different canonical directories are
reported but do not block and are never authorization fallback.

## Pilot A

Audit these existing published files without changing them:

- `trainers/oge-task6-fractions.html`
- `trainers/oge-task8-powers-roots.html`
- `trainers/oge-task9-equations.html`
- `trainers/oge-task20-equations.html`

For each, confirm exact hash and size, existing canonical URL, sitemap and OGE
course references, absence from the runtime manifest, the four baseline
surfaces, dependency/storage/network signals, duplicate status, proposed
standalone archetype, and unresolved provenance/pedagogical/mobile/iframe
acceptance. This task does not publish, delist, relink, render, or approve them.

## Acceptance criteria

1. Repeated full runs produce the same ordered candidate set, stable IDs,
   hashes, canonical URLs, findings, blockers, and deterministic fingerprint.
2. Adding one candidate preserves every unchanged candidate ID and permits reuse
   of unchanged analysis from a previous report.
3. A 5,000-candidate synthetic run completes with recorded time, peak memory,
   exact counts, deterministic ordering, and no filename-based authorization.
4. Every committed URL vector is executed exactly once; missing, duplicate,
   skipped, malformed, or mismatched vectors fail.
5. Duplicate path, case-fold path, normalized URL, trainer ID, and exact-blob
   cases fail closed; same basenames in distinct directories do not.
6. Descriptor-to-manifest equality passes only for the exact validated source
   data and fails on missing, extra, stale, or changed repeated fields.
7. Malformed HTML and missing assets are per-candidate errors, not silent
   omissions or whole-run data loss.
8. Storage, statistics, network, script, style, iframe, Bridge, Socket.IO, state,
   hidden/control/bidi, and external-origin signals have regression vectors.
9. Tests prove no outbound request and byte-identical inputs before and after a
   run.
10. Generated outputs are ignored; committed JSON and Markdown parse; links,
    secrets, absolute paths, scope, and `git diff --check` pass.

## Gate-marker safety

`node tools/trainer-inventory/cli.mjs --check` performs the scoped repository
inventory check and may emit only
`TRAINER_FACTORY_INVENTORY_V1_CHECK_OK`. That marker is not the final gate.

Only `node tools/trainer-inventory/gate.mjs` runs the Phase 1 tests, scoped CLI
check, board-server regression, committed-range `git diff --check`, and clean
worktree check as one fail-closed sequence. It may emit
`TRAINER_FACTORY_INVENTORY_V1_GATE_OK` only after every step succeeds. A
subprocess failure, skipped dependency, diff failure, or dirty worktree prevents
the final marker.

## Rollback

Rollback removes only the Phase 1 tools, schemas, fixtures, tests, documentation,
skill, and ignore rule. There is no trainer, discovery, runtime, URL,
deployment, or data migration delta to reverse. Generated ignored artifacts may
be discarded independently.

## Permissions and stop

The approved `START` permits one implementation branch, logical commits, local
gates, push, and a Draft PR with a sanitized review packet. It does not permit
merge, auto-merge, deployment, trainer publication, or scanning an unspecified
unpublished root. Stop before independent exact-head `HIGH` review.

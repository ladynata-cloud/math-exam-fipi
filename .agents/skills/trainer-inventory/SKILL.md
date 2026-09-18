---
name: trainer-inventory
description: Run the read-only MathExam Trainer Factory inventory, provenance, dependency, storage, publication-surface, and collision audit. Use when classifying tracked trainer HTML files or an explicitly owner-approved intake root before any publication task.
---

# Trainer inventory

Produce evidence for an owner decision. Never publish, authorize a trainer,
change runtime metadata, or infer permission from a discovered file.

## Preconditions

1. Read `AGENTS.md`, `docs/tasks/TRAINER_FACTORY_V1.md`,
   `docs/tasks/TRAINER_FACTORY_INVENTORY_V1.md`, and
   `docs/REVIEW_POLICY.md`.
2. Confirm the exact approved base, branch, and clean worktree.
3. Treat `trainers/board-compat.json` as runtime source data and its validated
   server projection as runtime authority.
4. Require an explicit owner-provided path and permission before using
   `--intake-root`. Never search the machine for unpublished trainers.

## Run the inventory

Run the repository cohort:

```text
node tools/trainer-inventory/cli.mjs
```

Use `--intake-root <path>` only for the exact owner-approved root. The tool must
remain read-only for all inputs. Generated output belongs under
`tools/trainer-inventory/.output/`, which is ignored by Git.

Hash evidence is source-specific:

- tracked repository candidates use `hashBasis: GIT_OBJECT`; hash, size, and
  HTML analysis come from the exact blob at the analyzed Git `HEAD`;
- explicitly approved intake candidates use
  `hashBasis: FILESYSTEM_BYTES`; LF and CRLF remain distinct raw blobs;
- candidate HTML, manifest, reference pages, and internal asset evidence use
  the same captured Git head and its tree;
- the repository asset index maps exact paths to Git object types: a blob is
  present, a non-blob is not a file, and an absent path is missing; checkout
  layout, sparse checkout, untracked files, and local filesystem existence do
  not contribute evidence;
- asset lookup decodes a percent-encoded pathname once; reject encoded
  separators and encoded dot segments from the raw reference before URL
  normalization can hide them, then reject decoded controls, backslashes, and
  dot segments; do not repair paths or decode the result again;
- source Git head and tree are non-authoritative run evidence outside the
  content-based deterministic fingerprint;
- per-path Git-object missing results remain isolated with explicit candidate
  or reference errors; a corrupt batch protocol or failed Git process aborts
  the whole run, with no checkout fallback.

Only a repository descriptor may have both hash and size null, and it must
carry the exact same-path `GIT_OBJECT_READ_FAILED:<canonicalPath>` error.
Successful descriptors and intake/synthetic descriptors cannot carry that
failure. Null hashes never provide exact-duplicate evidence.

The static Draft 2020-12 schema closes source-kind/hash-basis, null-pair, and
failure presence/absence constraints. Same-path equality requires the committed
`bindDescriptorSchema(schema, descriptor)` helper and is independently
checked by `validateDescriptorShape()`. Static-schema acceptance alone is
insufficient: a foreign-path failure can satisfy its structural rules. Use the
bound schema for the complete contract.

Incremental reuse requires matching report/tool versions,
`inputs.analysisVersion: 2`, a valid descriptor and HTML/dependency shape,
and a matching report digest. Reuse only identical non-null bytes with the
same source kind, canonical path, hash basis, and size. Recompute asset,
reference, manifest, publication-surface, and duplicate evidence for every run.

The run must:

- compute stable candidate IDs, byte hashes, sizes, canonical paths, canonical
  public URLs, and reference evidence;
- inventory assets, origins, network, storage, script, style, iframe, Bridge,
  Socket.IO, and state-contract signals without executing candidate code;
- report the four publication surfaces independently;
- cross-check, but never replace or grant, runtime manifest authority;
- classify exact duplicates, canonical-path and URL collisions, and unresolved
  provenance fail-closed;
- continue after a per-candidate parse error and report the error;
- produce deterministic machine JSON, a human summary, and a sanitized handoff.

## Validate

Run:

```text
node --test tools/trainer-inventory/test/*.test.mjs
node tools/trainer-inventory/cli.mjs --check
node tools/trainer-inventory/gate.mjs
```

`--check` is a scoped inventory check and may emit only
`TRAINER_FACTORY_INVENTORY_V1_CHECK_OK`. It does not prove the Phase 1 test,
server-regression, committed-diff, or clean-worktree gates. Only `gate.mjs`
runs the complete sequence above, including the board-server regression and
committed `git diff --check`, and may emit
`TRAINER_FACTORY_INVENTORY_V1_GATE_OK`. Any failed subprocess or dirty
worktree prevents the full marker.

Version 1.0.1 also emits
`TRAINER_FACTORY_INVENTORY_HASH_BASIS_V1_GATE_OK` only after the same complete
gate passes with the Git-object/filesystem-byte regressions.

The gate must cover the committed public-URL conformance fixture, descriptor
schema, manifest equality checks, Pilot A, at least 5,000 synthetic candidates,
malformed HTML, missing assets, storage/network signals, unsafe path text,
deterministic repeat and incremental reuse, read-only input hashes, ignored
outputs, and absence of outbound requests.

Code/schema structure assertions always run. To execute the same 22 contract
vectors against a real Draft 2020-12 validator, set
`TRAINER_INVENTORY_SCHEMA_VALIDATOR` to the absolute module path of an available
`ajv/dist/2020.js`. This is temporary test tooling, not a repository package
dependency. Report actual schema execution separately if the validator is
unavailable; do not treat structure checks as equivalent evidence.

## Stop conditions

Stop and report instead of editing or publishing when:

- a candidate has unknown provenance or lacks usage authority;
- any duplicate `trainerId`, full canonical path, ASCII case-fold path,
  normalized public URL, or unresolved exact-blob duplicate exists;
- a repeated descriptor runtime field differs from the current manifest;
- a candidate requires platform-core, Bridge, registry endpoint, Socket.IO,
  security, authentication, or deployment changes;
- the approved base or scope changes.

The PR #92 review of the old head is `REQUEST_CHANGES`; see the
[hash-basis task](../../../docs/tasks/TRAINER_INVENTORY_HASH_BASIS_V1.md) for
exact-head provenance. Remediation requires a new independent exact-head
`HIGH` review; the old review cannot approve a new head.

Passing inventory is evidence only. It is not owner approval for a track, URL,
site discovery, board discovery, batch membership, mirror behavior, push,
merge, or deployment. Stop with
`TRAINER_FACTORY_INVENTORY_V1_GATE_OK` only when every Phase 1 gate passes.

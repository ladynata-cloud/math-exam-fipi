# Trainer inventory format

`trainer-inventory` emits evidence for owner review. It does not authorize
publication or runtime behavior.

## Commands

Repository inventory:

```text
node tools/trainer-inventory/cli.mjs
```

Validation without retaining generated output:

```text
node tools/trainer-inventory/cli.mjs --check
```

An external intake root is never discovered automatically. Use
`--intake-root <owner-approved-path>` only after the owner identifies that exact
root and permits a read-only scan.

## Files

The default ignored output directory is
`tools/trainer-inventory/.output/`.

- `inventory.json` contains the closed schema version, tool version, input
  hashes, ordered descriptors, blocker counts, deterministic fingerprint, and
  non-deterministic run measurements.
- `summary.md` is a human-readable overview.
- `sanitized-handoff.json` contains no file contents, secret values, personal
  data, or machine-specific absolute paths.

The deterministic fingerprint describes report content, including
`inputs.analysisVersion`, ordered descriptors, and findings. Volatile run
measurements and `run.sourceGitHead` / `run.sourceGitTree` are excluded.
Different commits with identical inventory evidence may therefore have the
same fingerprint. Exact-head review must record the source head and tree
separately; the fingerprint does not authorize publication or identify a Git
commit by itself.

## Hash basis

Every descriptor declares one closed `hashBasis` value:

- `GIT_OBJECT` for tracked repository candidates. `sourceSha256` and
  `sizeBytes` use the exact blob bytes from the analyzed source Git `HEAD`, not
  the checkout. Run evidence records `sourceGitHead` and `sourceGitTree`.
- `FILESYSTEM_BYTES` for explicitly approved unpublished intake candidates.
  Hash and size use exact raw filesystem bytes; LF and CRLF inputs are distinct.

Test-only synthetic candidates use `FILESYSTEM_BYTES` semantics for their
explicit raw buffers. No input is normalized, trimmed, or rewritten.

Candidate HTML, manifest, and reference HTML/XML are read from that same
captured Git head. Internal asset findings use an exact Git tree index that
maps paths to object type, mode, and object ID. A tracked blob path is present;
a non-blob entry produces `ASSET_NOT_FILE`; an absent path produces
`ASSET_MISSING`. Sparse checkout, deleted checkout files, untracked files,
Windows path limits, and a checkout at another commit cannot change these
findings. The repository asset check does not read filesystem existence.

For internal asset lookup, percent-decode the pathname exactly once. Inspect
the raw reference for encoded separators and encoded dot segments before URL
normalization can hide them. Malformed escapes, decoded controls, backslashes,
or dot segments produce explicit deterministic malformed-reference or asset
errors. Spaces and Cyrillic characters remain exact Git path characters; no
second decoding, case folding, path repair, or filesystem fallback occurs.
This asset lookup rule does not change public-URL identity normalization.

## Read failures and nullable identity

A successful descriptor has a 64-character lowercase hexadecimal SHA-256 and
an integer byte size of at least zero, with no candidate Git-object failure.
The only valid null identity is a `repo/GIT_OBJECT` descriptor with both
`sourceSha256` and `sizeBytes` null and the exact
`GIT_OBJECT_READ_FAILED:<canonicalPath>` error for that candidate. A foreign
path, one null field, failure with non-null evidence, or forged failure on
intake/synthetic input is invalid. Null hashes do not form exact-blob duplicate
groups.

A per-path `missing` response from Git is isolated: candidate failures also
appear in run findings, reference failures are recorded explicitly, and
independent candidates continue. Manifest read failure aborts the run. A
malformed batch header/body, invalid byte boundary, trailing data, or failed
Git process aborts the entire run rather than accepting a partial result.
Neither failure mode falls back to checkout bytes.

## Complete descriptor validation

The committed static Draft 2020-12 schema enforces source-kind/hash-basis
pairing, paired nullability, repository-only failure state, and the required
presence or absence of a Git-object failure. Standard JSON Schema cannot
compare an arbitrary failure-string suffix with a sibling `canonicalPath`.
The static schema can therefore accept a structurally valid null failure that
names another candidate; static validation alone is incomplete.

The committed `bindDescriptorSchema(schema, descriptor)` helper clones the
schema and binds both `properties.canonicalPath.const` and
`$defs.candidateReadFailure.const` to that descriptor's exact path and
`GIT_OBJECT_READ_FAILED:<canonicalPath>` string. Validate the descriptor using
this bound schema. `validateDescriptorShape()` independently enforces the
same-path relationship. Both checks reject a foreign-path failure.

For a consumer with the parsed static `schema` and an existing Draft 2020-12
validator instance `ajv`:

```js
const boundSchema = bindDescriptorSchema(schema, descriptor);
const schemaValid = ajv.compile(boundSchema)(descriptor);
const shape = validateDescriptorShape(descriptor);
if (!schemaValid || !shape.ok) throw new Error('DESCRIPTOR_CONTRACT_FAILED');
```

Tests and the gate use the same 22 valid/invalid vectors. Structural assertions
and executable-validator checks always run. Set
`TRAINER_INVENTORY_SCHEMA_VALIDATOR` to the absolute module path of an available
`ajv/dist/2020.js` for real schema execution; no repository dependency is
added. Record validator execution or unavailability explicitly rather than
claiming that schema-structure assertions prove instance validation.

## Incremental compatibility

`inputs.analysisVersion: 2` identifies the HTML/dependency analysis contract.
Previous reports are eligible for reuse only when report and tool versions,
canonical origin, analysis version, descriptor/analysis shapes, and the stored
deterministic digest validate. Invalid, older, duplicate-key, or null-hash
cached records cannot provide reusable analysis.

For an eligible report, reuse HTML analysis only when source kind, canonical
path, hash basis, SHA-256, and byte size match. A different source head can
reuse those identical bytes. Assets, references, manifest cross-checks,
classification, publication surfaces, and duplicates are recomputed from
current inputs, so fresh and incremental reports must agree after an
asset-only, discovery-only, or manifest-only commit.

## Status interpretation

`CANONICAL` is an inventory classification, not publication approval.
`DUPLICATE_UNRESOLVED` blocks later release. Existing discovery evidence is
reported independently as `FILE_PUBLISHED`, `SITE_DISCOVERY`,
`BOARD_DISCOVERY`, and `BOARD_MIRROR`.

Proposed track and archetype fields are advisory. Track, public URL, discovery
surfaces, batch membership, provenance, usage authority, and pedagogical
acceptance require explicit owner decisions in later tasks.

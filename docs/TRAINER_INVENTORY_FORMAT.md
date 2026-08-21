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

Volatile duration and memory measurements are excluded from the deterministic
fingerprint. Candidate descriptors and findings are deterministic.

## Hash basis

Every descriptor declares one closed `hashBasis` value:

- `GIT_OBJECT` for tracked repository candidates. `sourceSha256` and
  `sizeBytes` use the exact blob bytes from the analyzed source Git `HEAD`, not
  the checkout. Run evidence records `sourceGitHead` and `sourceGitTree`.
- `FILESYSTEM_BYTES` for explicitly approved unpublished intake candidates.
  Hash and size use exact raw filesystem bytes; LF and CRLF inputs are distinct.

Test-only synthetic candidates use `FILESYSTEM_BYTES` semantics for their
explicit raw buffers. No input is normalized, trimmed, or rewritten.

Git-object lookup never falls back to a worktree file. A per-candidate lookup
failure records `sourceSha256: null`, `sizeBytes: null`, an explicit
`GIT_OBJECT_READ_FAILED` error, and a run finding while allowing independent
candidates to complete.

## Status interpretation

`CANONICAL` is an inventory classification, not publication approval.
`DUPLICATE_UNRESOLVED` blocks later release. Existing discovery evidence is
reported independently as `FILE_PUBLISHED`, `SITE_DISCOVERY`,
`BOARD_DISCOVERY`, and `BOARD_MIRROR`.

Proposed track and archetype fields are advisory. Track, public URL, discovery
surfaces, batch membership, provenance, usage authority, and pedagogical
acceptance require explicit owner decisions in later tasks.

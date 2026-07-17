# Trainer Inventory v1.0.1 — cross-platform repository hashing

## Identity

- Task: `Trainer Inventory v1.0.1 — cross-platform repository hashing`.
- Owner: MathExam owner.
- Date: 2026-07-17.
- Base branch: `main`.
- Base SHA: `089f31da37823c4c95be8fbd9040821f0eb9d167`.
- Planned branch: `codex/trainer-inventory-hash-basis-v1`.
- Review level: `HIGH`.
- Parent task: [Trainer Factory inventory v1](TRAINER_FACTORY_INVENTORY_V1.md).
- Parent plan: [Trainer Factory v1](TRAINER_FACTORY_V1.md).
- ADR status: no Accepted ADR is required; ADR 0001 remains Proposed.
- Final gate: `TRAINER_FACTORY_INVENTORY_HASH_BASIS_V1_GATE_OK`.

## Goal

Make repository-candidate hashes, byte sizes, duplicate groups, incremental
reuse, and deterministic inventory fingerprints depend on the exact Git objects
at the analyzed `HEAD`, while preserving raw filesystem-byte identity for
explicitly authorized unpublished intake candidates.

## Verified root cause

On the approved clean Windows base, the four Pilot A Git objects contain LF
bytes while the checkout contains CRLF bytes. System Git configuration has
`core.autocrlf=true`; no repository `.gitattributes` file or applicable
file-level attributes exist. Configured Git LFS filters do not apply to the
Pilot A files.

For every Pilot A file:

- the Git-object SHA-256 and byte size match the approved values below;
- the Git index reports `i/lf` and the worktree reports `w/crlf`;
- the worktree size exceeds the blob size by exactly one byte per CRLF;
- replacing worktree CRLF pairs with LF produces byte-for-byte Git-object
  identity;
- no other textual difference exists and Git reports the file clean.

| Candidate | Git-object SHA-256 | Git-object bytes |
| --- | --- | ---: |
| `trainers/oge-task6-fractions.html` | `24f7b404bc944fa9a528d50a3b76ece0c4526afb66eed3b96453fd94965fcd03` | 82390 |
| `trainers/oge-task8-powers-roots.html` | `df283d5147edaf536a885203dc8b8cc540c424f32d29369cb176e79823d6120a` | 98568 |
| `trainers/oge-task9-equations.html` | `c4813016e37b4e5b87524f1e3270cb3856027b01f89c616d4bcd619d58f343be` | 181899 |
| `trainers/oge-task20-equations.html` | `839f2fcd27bea701be1e3178ff3863bd72283905b91c57c626395404629e90ad` | 163028 |

## Approved scope

### In scope

- Read tracked repository candidates and repository reference evidence from
  exact Git objects at the analyzed `HEAD`.
- Record repository hash basis as `GIT_OBJECT`.
- Keep unpublished intake and test-only synthetic raw bytes on the
  `FILESYSTEM_BYTES` basis.
- Record source Git head and tree in non-authoritative run evidence.
- Fail closed per candidate when a tracked Git object cannot be read.
- Keep other candidates analyzable after one per-candidate object-read failure.
- Update descriptor schema, output format, CLI/gate evidence, inventory skill,
  focused documentation, and regression tests.

### Out of scope

- Trainer publication, adaptation, batch release, or intake scanning.
- Any trainer, sitemap, course, manifest, board, server-runtime, Bridge,
  Socket.IO, registry-endpoint, deployment, or production behavior change.
- Runtime dependencies or non-standard network clients.
- Line-ending normalization, worktree rewriting, or `.gitattributes` policy.

### Files or areas that must not change

- `trainers/**/*.html`
- `sitemap.xml`
- course pages
- `trainers/board-compat.json`
- trainer board and board-server runtime
- Bridge, Socket.IO, registry endpoint, and deployment configuration
- unpublished intake files
- other Factory skills

## Hash contract

### Tracked repository candidates

- `hashBasis` is `GIT_OBJECT`.
- SHA-256 and byte size are computed from the exact blob bytes at the analyzed
  source Git head.
- Worktree line endings, `core.autocrlf`, `core.eol`, smudge/clean filters, and
  checkout-only mutations cannot affect the descriptor.
- Object lookup has no filesystem fallback. Missing object bytes produce a
  nullable hash/size plus an explicit `GIT_OBJECT_READ_FAILED` candidate error
  and run finding.

### Unpublished intake candidates

- `hashBasis` is `FILESYSTEM_BYTES`.
- SHA-256 and byte size use exact filesystem bytes.
- LF and CRLF inputs remain distinct exact blobs.
- No normalization, trimming, repair, or rewrite is permitted.

Test-only synthetic candidates use `FILESYSTEM_BYTES` semantics for their
explicit raw buffers and never represent runtime authority.

## Acceptance criteria

- [ ] Pilot A hashes and sizes match the table above on Windows and Linux.
- [ ] LF-blob/CRLF-worktree regression proves `GIT_OBJECT` evidence.
- [ ] Linux-like and Windows-like checkouts of one head have identical
      descriptors, IDs, duplicate groups, and deterministic fingerprint.
- [ ] LF and CRLF intake bytes have distinct `FILESYSTEM_BYTES` hashes.
- [ ] A committed blob change changes its descriptor and invalidates reuse.
- [ ] A checkout-only line-ending change preserves descriptor, ID, and
      fingerprint.
- [ ] Duplicate analysis for repository candidates uses Git-object hashes.
- [ ] Object-read failure has no filesystem fallback, is explicit, and does not
      hide successful candidates.
- [ ] Source Git head and tree appear only as evidence and never runtime
      authorization.
- [ ] No machine-specific absolute path, username, intake folder name, secret,
      credential, or private content enters sanitized output.

## Checks and gates

- Phase 1 inventory tests with exact pass/fail/skip counts.
- Public-URL conformance: 36/36.
- Repository inventory: 240 candidates.
- Fresh/incremental equality, exact duplicate groups, 5,000 synthetic
  candidates, stable IDs, deterministic ordering, malformed-input resilience,
  read-only proof, zero outbound requests, sanitization, and ignored outputs.
- Board-server regression: 30/30 with zero skipped.
- Hidden/bidi/control and secret/local-path scans.
- `git diff --check` and clean worktree.
- Compatibility marker: `TRAINER_FACTORY_INVENTORY_V1_GATE_OK`.
- Final marker: `TRAINER_FACTORY_INVENTORY_HASH_BASIS_V1_GATE_OK`.

## Review plan

- Review-level rationale: hashing controls deterministic identity,
  deduplication, and publication blockers across every tracked trainer.
- Independent exact-head review required: yes.
- Sanitized review packet contains only scoped diff, public repository evidence,
  test results, base/head identities, risks, and rollback.
- Required external-review provenance: provider, PR, base SHA, head SHA,
  verdict, and verifiable source or timestamp.

## Risk and rollback

- Main risk: a Git batch-protocol or failure-path bug could omit or misidentify
  a tracked candidate.
- Mitigation: closed hash-basis field, real temporary Git repositories,
  checkout/blob mutation tests, Pilot A evidence, duplicate tests, explicit
  failure records, and the full existing gate.
- Rollback: revert this task's implementation, schema, tests, and documentation
  as one normal reviewed change. No trainer, runtime, URL, or intake data
  migration exists.

## Permissions

- `START` granted by owner in the current task conversation: yes.
- Branch creation allowed: yes.
- Local logical commits allowed: yes.
- Push allowed: yes, without force.
- Draft PR allowed: yes.
- Merge and auto-merge allowed: no.
- Deployment allowed: no.

## Execution record

- Actual branch: `codex/trainer-inventory-hash-basis-v1`.
- Actual base SHA: `089f31da37823c4c95be8fbd9040821f0eb9d167`.
- Actual head SHA: recorded in the final handoff and Draft PR.
- PR: recorded after publication.
- Commits: recorded after publication.
- Tests passed/failed/not run: recorded in the final handoff and Draft PR.
- Scope deviations: none expected.

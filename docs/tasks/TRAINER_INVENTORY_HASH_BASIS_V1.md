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

- Read tracked repository candidates, manifest, reference evidence, and
  internal asset type/existence evidence from one exact Git head and tree.
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
- Worktree line endings, `core.autocrlf`, `core.eol`, smudge/clean filters,
  sparse/absent checkout paths, untracked files, and checkout-only mutations
  cannot affect descriptors or findings.
- Asset evidence uses a deterministic exact-path Git tree index with object
  type, mode, and object ID. Blobs are present, non-blob entries produce
  `ASSET_NOT_FILE`, and absent entries produce `ASSET_MISSING`. Filesystem
  existence is not consulted for repository assets.
- Internal asset paths are percent-decoded once for lookup. Reject raw encoded
  separators and encoded dot segments before URL normalization can hide them;
  reject malformed escapes and decoded controls, backslashes, or dot segments.
  Spaces and Cyrillic path characters are supported without double decoding,
  repair, or rewriting.
- Object lookup has no filesystem fallback. A per-path `missing` response
  produces both-null hash/size, the exact same-path
  `GIT_OBJECT_READ_FAILED:<canonicalPath>` candidate error, and a run finding.
  Independent candidates continue; reference failures remain explicit.
- A missing manifest, failed Git process, or corrupt batch protocol aborts the
  whole run. Invalid headers, bodies, byte boundaries, or trailing data must
  never produce a successful-looking partial report.
- Successful descriptors have non-null SHA-256/size and no candidate read
  failure. Half-null pairs, foreign-path failures, failures with non-null
  evidence, and forged intake/synthetic Git failures are invalid. Null hashes
  never establish exact-blob duplicate evidence.

### Schema and same-path binding

The owner-approved remediation uses a portable static Draft 2020-12 schema
plus the committed `bindDescriptorSchema(schema, descriptor)` helper.
The static schema closes source-kind/hash-basis mapping, null-pair constraints,
and Git-failure presence/absence. It cannot express equality between an
arbitrary failure suffix and a sibling `canonicalPath`; a structurally valid
foreign-path null failure can therefore pass the static schema alone.

The helper clones the schema, binds `canonicalPath` to a `const`, and binds
`$defs.candidateReadFailure` to the exact same-path failure string. The bound
schema and independent `validateDescriptorShape()` check both reject foreign
paths. This contextual validation is the complete contract, not a claim that
the static schema alone expresses same-path equality.

Use the same 22 valid/invalid vectors for the executable validator and bound
schema. Structure assertions always run; real Draft 2020-12 execution uses an
available temporary Ajv module supplied through
`TRAINER_INVENTORY_SCHEMA_VALIDATOR` as an absolute path to
`ajv/dist/2020.js`. No package dependency is added. Record exact execution
counts and any unavailable-validator check in the final evidence.

### Unpublished intake candidates

- `hashBasis` is `FILESYSTEM_BYTES`.
- SHA-256 and byte size use exact filesystem bytes.
- LF and CRLF inputs remain distinct exact blobs.
- No normalization, trimming, repair, or rewrite is permitted.

Test-only synthetic candidates use `FILESYSTEM_BYTES` semantics for their
explicit raw buffers and never represent runtime authority.

### Fingerprint and incremental evidence

The fingerprint is content-based and deliberately excludes source head/tree,
which remain explicit non-authoritative run evidence. Two commits can share
one fingerprint if all inventory evidence is identical. Exact-head review
must always record the source Git identity separately.

Incremental compatibility is declared by `inputs.analysisVersion: 2` and
requires current report/tool versions, canonical origin, valid descriptor and
HTML/dependency shapes, and a matching stored report digest. Reuse requires
identical source kind, canonical path, hash basis, non-null SHA-256, and size.
Asset, reference, manifest, classification, publication, and duplicate findings
are always recomputed. Old, malformed, or null-hash evidence is not reusable.

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
- [ ] Missing checkout assets and untracked masking files leave fixed-head
      descriptors, findings, and fingerprint unchanged.
- [ ] Asset addition/removal in Git changes findings where applicable;
      fresh/incremental reports agree on the new head.
- [ ] Percent-encoded spaces/Cyrillic assets resolve; malformed escapes and
      encoded separator/dot-segment attempts fail closed.
- [ ] Null/source-kind/hash-basis vectors enforce the same-path failure
      contract, and failed/null evidence cannot form exact-blob groups.
- [ ] Reference-only and manifest-only changes recompute their evidence;
      stale, malformed, or incompatible reports cannot poison reuse.
- [ ] Object-read failure has no filesystem fallback, is explicit, and does not
      hide successful candidates.
- [ ] Source Git head and tree appear only as evidence and never runtime
      authorization.
- [ ] No machine-specific absolute path, username, intake folder name, secret,
      credential, or private content enters sanitized output.

## Checks and gates

- Phase 1 inventory tests with exact pass/fail/skip counts.
- Public-URL conformance: 36/36.
- Repository inventory: report the exact count for each tested head; the
  original-base baseline was 240 candidates. Repeat on the virtual merge with
  the current main cohort.
- Fresh/incremental equality, exact duplicate groups, 5,000 synthetic
  candidates, stable IDs, deterministic ordering, malformed-input resilience,
  read-only proof, zero outbound requests, sanitization, and ignored outputs.
- Board-server regression: report exact pass/fail/skip counts for each tested
  tree; the original-base baseline was 30/30 with zero skipped.
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

## PR #92 remediation provenance

- Reviewed PR: [#92](https://github.com/ladynata-cloud/math-exam-fipi/pull/92).
- Provider: Claude Opus 4.8 / Claude Code.
- Reviewed at: `2026-09-18T14:24:41Z`.
- Original base: `089f31da37823c4c95be8fbd9040821f0eb9d167`.
- Reviewed head: `280f9305e00403255d3119c2f71ad2fa5906ff16`.
- Reviewed tree: `0ad8887cd1a76c64e0edbfdf9af6893bc0f80d9a`.
- Reviewer-tested main: `10363b151cd22da5b997c0f83c5d5f8b48c26df6`.
- Artifact SHA-256:
  `3f3d66c640421c9d26e74406d27ae95c5bae840dae14ac8658a6d0c367d15d2f`.
- Verdict for that old exact head: `REQUEST_CHANGES`.
- [Recorded review evidence](https://github.com/ladynata-cloud/math-exam-fipi/pull/92#issuecomment-5735358386).
- Blocker 1: repository asset findings depended on worktree existence.
- Blocker 2: null hash/size and source-kind/hash-basis relationships were not
  closed in the descriptor contract.

Remediation stays in the existing Draft PR and addresses these two blockers
with focused regression coverage. The old review does not approve subsequent
commits. The new head is `PENDING_NEW_EXACT_HEAD_HIGH_REVIEW`; record its
exact head/tree and executed gate counts in the final handoff and PR body.
No result in this section claims that remediation tests or a new review have
passed. Ready, merge, deployment, trainer publication, and a new Factory phase
remain unauthorized.

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

## OGE task 6 focused fix: intentional Pilot A identity change

The original v1.0.1 baseline table above remains historical root-cause evidence.
This change record belongs to `OGE_TASK6_FRACTIONS_FOCUSED_FIX` on
`fix/oge-task6-fractions-focused`, based on main
`fbd46afd92a58875b1b89af329b9d37a676abe52`. The owner authorized this current
Pilot A expectation for the focused fix Draft PR; it becomes the main baseline
only after a separately authorized merge. It does not amend PR #92 history
or reuse its review approval. The final handoff and Draft PR identify the head.

| Git-object evidence | Before focused fix | Focused fix candidate |
| --- | --- | --- |
| Blob SHA-1 | `cc71b02fbcdbe3f5b03a8d8e8131ce2b5b180e92` | `e668932c602fae5e6f4fe5c78ed3bef38af891d8` |
| SHA-256 | `24f7b404bc944fa9a528d50a3b76ece0c4526afb66eed3b96453fd94965fcd03` | `54c7b7671ae13f180b1dd4d09440053c76c801d9b07a119b0009ea2b61f610ab` |
| Git bytes | 82390 | 90714 |

Reason: intentional parser, session-result provenance, navigation and accessible
presentation fixes in `trainers/oge-task6-fractions.html`. Evidence comes from
`git cat-file blob`, including the existing leading UTF-8 BOM, not checkout
newline conventions. The 68,034-byte TASKS declaration and all 174 tasks remain
byte-identical. Other Pilot A expectations, inventory logic, schema and gate
are unchanged. The owner separately authorized only the exact six-file scope
guard extension needed to validate this task without broadening its allowlist.

## OGE 2027 author analogue tasks 6–10: intentional Pilot A changes

Owner-approved task `OGE_2027_ANALOGUE_DISTRIBUTE_6_10`, branch `content/oge-2027-analogue-distribute-6-10`, base `d5c9d0388ab3b22bcffec10d11504a0624e2b598`. These are candidate identities for a Draft PR, not a merged baseline. All historical text above remains byte-identical.

One tagged author record and its local cohort/provenance UI are added in each affected trainer. Existing mathematical records, IDs, order, answers and solutions remain unchanged. SHA-256 and sizes below are computed from `git cat-file blob` of the written Git objects; checkout newline conversion is not the hash source.

| Trainer | Old blob | New blob | Old SHA-256 | New SHA-256 | Old bytes | New bytes |
|---|---|---|---|---|---:|---:|
| `trainers/oge-task6-fractions.html` | `e668932c602fae5e6f4fe5c78ed3bef38af891d8` | `4aee6f319f5fe79664d49147b741b8ac503a22c7` | `54c7b7671ae13f180b1dd4d09440053c76c801d9b07a119b0009ea2b61f610ab` | `b710dda8a9c5f3b8c73aed6c4aaf4385c5b6583d38bbcac3415a86736cb540e1` | 90714 | 93434 |
| `trainers/oge-task8-powers-roots.html` | `e93f6e6dc035733d6ecf7f4d80c2a331ec617dd2` | `49ba82532c19cf1f64260d42593ac86402de0b0c` | `df283d5147edaf536a885203dc8b8cc540c424f32d29369cb176e79823d6120a` | `1cd5dc87372ad5578152a95f793bce3e303f59fa9332f1ab06eadc6c2ec433b0` | 98568 | 103158 |
| `trainers/oge-task9-equations.html` | `fde6982c69734dc47e5be4909829fc21706b819c` | `46931359f06bc3789ce4aefe2b78610ad37594ec` | `c4813016e37b4e5b87524f1e3270cb3856027b01f89c616d4bcd619d58f343be` | `aa388060ddec214ac09b7301bdd7cb47fd24b636e7b84d40c951048d227e7a8d` | 181899 | 185610 |

Task 20 remains `839f2fcd27bea701be1e3178ff3863bd72283905b91c57c626395404629e90ad`, 163028 Git bytes. Tasks 7 and 10 are not added to Pilot A. Inventory logic, schema, CLI, gate and `PILOT_A_PATHS` remain unchanged.

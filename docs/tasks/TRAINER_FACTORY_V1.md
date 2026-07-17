# Trainer Factory v1

## Identity

- Task: `Trainer Factory v1` plan and architecture.
- Owner: MathExam owner.
- Date: 2026-07-17.
- Base branch: `main`.
- Base SHA: `495d9f8303de1ec90c15b8f38bf014599bfa463d`.
- Planned branch: `codex/trainer-factory-v1-plan`.
- Review level: `HIGH`.
- Related documents:
  - [repository rules](../../AGENTS.md);
  - [project status](../PROJECT_STATUS.md);
  - [roadmap](../ROADMAP.md);
  - [review policy](../REVIEW_POLICY.md);
  - [nested-path foundation](NESTED_PATH_FOUNDATION.md);
  - [roads-grid third mirror plan](ROADS_GRID_THIRD_MIRROR.md).
- Related ADR: [Trainer Bridge Platform ADR 0001](../adr/0001-trainer-bridge-platform.md).
- ADR status: `Proposed`; it is advisory unless a decision is fixed by a
  separate approved scope.
- Plan-stage architecture gate:
  `PENDING_EXACT_HEAD_CONDITION_CLOSURE_REVIEW`.

This document defines a factory architecture and a future implementation
roadmap. It does not authorize adapting or publishing any trainer.

## Goal

Design a repeatable, auditable pipeline for inventorying, classifying,
publishing, and adapting hundreds of existing, unpublished, and future
MathExam trainers. The factory must preserve current public URLs and existing
Bridge, registry, B1/B2, nested-path, and deployment contracts while assigning
each trainer to the least powerful safe publication track.

## Context and verified evidence

Facts verified at the exact base:

- `main`, local `HEAD`, and `origin/main` are the identity SHA above.
- The worktree was clean before this plan branch was created.
- `trainers/` contains 240 tracked HTML files, including 105 top-level HTML
  files.
- The site catalog reports 35 primary entries in 11 sections.
- `trainers/board-compat.json` contains 12 registry entries: 9
  `opens-in-board` and 3 `board-mirror` entries.
- The sitemap contains 138 trainer HTML URLs. Catalog, sitemap, course links,
  registry membership, and physical files are therefore overlapping but not
  equivalent definitions of publication.
- Duplicate HTML basenames and exact duplicate blobs already exist. They are
  inventory findings, not authorization for new duplicates and not a request
  for mass cleanup.
- Nested canonical paths and exact case-sensitive authorization are already
  implemented. Global basename uniqueness is not a platform invariant.
- The roads-grid trainer is the third standard mirror and provides current
  evidence for a closed state schema, a committed conformance fixture, storage
  isolation, and teacher/student lifecycle checks.
- [PROJECT_STATUS.md](../PROJECT_STATUS.md) is reconciled in this docs task with
  the exact base. [ROADMAP.md](../ROADMAP.md) remains a high-level sequence; this
  task-spec supplies the detailed Factory v1 roadmap. Exact-base code, tests,
  merged task specifications, and gates take precedence if a snapshot drifts.

The counts above are discovery evidence only. A trainer is not considered safe
to publish until the future inventory pipeline resolves its canonical path,
all public and internal references, dependencies, storage behavior, ownership,
content provenance, and factory track.

## Approved plan scope

### In scope

- Define the four factory tracks `STATIC_ASSET`, `CATALOG_ONLY`,
  `MIRROR_STANDARD`, and `NEW_ARCHETYPE`.
- Define one trainer request, one descriptor model, runtime-manifest
  cross-checks, a
  state-contract template, a JSON Schema template, and a conformance-fixture
  template.
- Define inventory, classification, deduplication, batch publication, gates,
  review, rollback, and sanitized handoff rules.
- Design, but do not implement, the future `trainer-inventory`,
  `trainer-publish`, `trainer-adapter`, and `trainer-batch-release` skills.
- Propose one bounded pilot batch without modifying its trainers.

### Out of scope

- Mass migration or cleanup of trainers.
- Adapting or publishing the pilot or any specific next trainer.
- A new AI layer, payments, or a site redesign.
- New Socket.IO events.
- Changes to the Bridge protocol, registry protocol, registry endpoint
  contract, or deployment topology.
- Any board core, Bridge, server runtime, registry endpoint, Socket.IO,
  authentication/security, or deployment change. Such work is a separate
  `HIGH` platform task, not a Trainer Factory track.
- Implementing factory skills or commands on the plan stage.
- Treating ADR 0001 as Accepted.

### Areas that must not change on the plan stage

- Production HTML, JavaScript, CSS, trainer assets, server code, manifests,
  package files, schemas consumed by production, and deployment configuration.
- Existing trainer files and public URLs.
- Existing Bridge, registry, board, and Socket.IO behavior.

## Architectural principles

1. Track selection is a capability decision, not a preference. Start with the
   lowest track that satisfies the approved request and escalate on evidence.
2. Factory track and review level are separate. `STATIC_ASSET` and
   `CATALOG_ONLY` are `SMALL`; `MIRROR_STANDARD` is `MEDIUM` by default; and
   `NEW_ARCHETYPE` is `HIGH` or `NEW_ARCHETYPE`. A batch inherits the highest
   review level of any included change.
3. A single approved batch is one task specification, one branch, and one PR.
4. Existing public URLs are immutable inputs. The factory may add a new URL
   only after collision checks and may not silently move, reuse, or repoint an
   existing URL.
5. The trainer descriptor is predominantly pedagogical, inventory, and
   production metadata. `trainers/board-compat.json` remains runtime source
   data, and the server's validated projection remains runtime authority. A
   descriptor never authorizes mirror behavior. Any repeated runtime field is
   a cross-check and must match the manifest exactly or fail closed.
6. `MIRROR_STANDARD` may adapt trainer-local code and tests but may not change
   board, Bridge, registry, server, Socket.IO, authentication/security, or
   deployment core. Any such need is a hard stop and moves into a separate
   `HIGH` platform task. `PLATFORM_CHANGE` is not a Factory track.
7. Automated checks do not replace visual and pedagogical acceptance.
8. A failed or skipped required check blocks the trainer and its batch; it is
   never converted to a warning.

## Factory flow

```text
request
→ read-only inventory
→ deduplication and provenance checks
→ archetype and track classification
→ owner-approved bounded batch
→ track-specific adaptation/publication
→ per-trainer gates
→ batch aggregate gate
→ Draft PR and review
→ separate merge authorization
→ controlled release and production evidence
```

The classifier records both a technical archetype and a factory track.
Initial technical archetypes are:

- `standalone-single-file`;
- `standalone-bundle`;
- `board-iframe-open`;
- `standard-mirror-v1`;
- `unknown-or-new`.

`unknown-or-new` cannot be auto-promoted. It requires owner triage and normally
enters `NEW_ARCHETYPE`.

## Publication surfaces

Publication is recorded as four independent booleans. The word "catalog" must
not be used as shorthand for more than one of them:

- `FILE_PUBLISHED`: the exact canonical trainer URL is intentionally public and
  has production HTTP evidence.
- `SITE_DISCOVERY`: a public site surface such as the trainer catalog, course
  navigation, or sitemap intentionally links to that canonical URL.
- `BOARD_DISCOVERY`: the trainer is intentionally discoverable through the
  board selector/quick-select surface backed by the current runtime registry.
- `BOARD_MIRROR`: the validated server projection authorizes the existing
  teacher/student mirror lifecycle for that exact trainer.

| Factory track | `FILE_PUBLISHED` | `SITE_DISCOVERY` | `BOARD_DISCOVERY` | `BOARD_MIRROR` |
| --- | --- | --- | --- | --- |
| `STATIC_ASSET` | `true` | `false` | `false` | `false` |
| `CATALOG_ONLY` | `true` | owner-approved boolean | owner-approved boolean | `false` |
| `MIRROR_STANDARD` | `true` | owner-approved boolean | `true` | `true` |
| `NEW_ARCHETYPE` | defined by its approved plan | defined by its approved plan | defined by its approved plan | defined by its approved plan |

A `CATALOG_ONLY` instance must enable at least one discovery surface. Its task
records the exact combination; `SITE_DISCOVERY` and `BOARD_DISCOVERY` are never
inferred from each other. `BOARD_DISCOVERY=true` may add only the current
`opens-in-board` registry mode. It does not imply or permit `BOARD_MIRROR`.

For the proposed pilot, read-only baseline reconciliation has verified
`FILE_PUBLISHED=true`, `SITE_DISCOVERY=true`, `BOARD_DISCOVERY=false`, and
`BOARD_MIRROR=false`. These are facts about the existing cohort, not requested
new publication actions. Discovery does not itself authorize changing any
surface; the owner must approve the reconciled baseline and every proposed
delta before Factory work starts.

## Track contracts

### `STATIC_ASSET`

Purpose: publish or retain a directly addressable trainer asset without adding
it to either site discovery or board discovery.

Review level: `SMALL`.

#### Input requirements

- Approved trainer request and descriptor.
- Canonical path and derived public URL.
- Complete, locally resolvable asset list and content provenance.
- Explicit reason both discovery surfaces are intentionally disabled.
- No dependency on Bridge or registry behavior.

#### Mandatory metadata

- Identity, canonical path/URL, title, subject, grade/exam scope, owner,
  provenance, license/usage status, archetype, content version, asset hashes,
  dependency list, storage declaration, and rollback target.
- Runtime cross-check must explicitly say that no registry entry is expected.

#### Allowed files in a future task

- The approved trainer entry point and declared co-located assets under
  `trainers/`.
- Its descriptor, inventory record, tests, and static-check fixtures.
- No site-discovery, runtime-registry, board, Bridge, server, or deployment
  files.

#### Automated checks

- Nested-path validation and case-insensitive collision rejection.
- Exact-file and normalized-public-URL deduplication.
- Dependency closure, broken-link, MIME, secret, local-path, control/bidi, and
  unsafe-code scans.
- Direct HTTP status/content-type/cache smoke for the canonical URL.
- Desktop, mobile, and standalone console/pageerror smoke.

#### Visual and pedagogical acceptance

- Owner or delegated subject reviewer confirms legibility at 360 x 800,
  390 x 844, 768 x 1024, and 1440 x 900.
- A subject reviewer checks instructions, generated examples, accepted answers,
  feedback, hints, solutions, reset behavior, and accessibility basics.

#### Escalation criterion

Escalate to `CATALOG_ONLY` when discoverability, a site catalog card, or board
iframe discovery is required. Stop Factory processing and create a separate
`HIGH` platform task if publication requires a platform primitive or core
change.

#### Final gate

`TRAINER_FACTORY_STATIC_ASSET_GATE_OK`

#### Rollback

Restore the previous blob at a pre-existing URL. For a newly approved URL,
revert the publishing PR and remove only the new asset after confirming that no
site-catalog, course, or external reference shipped. Never reuse the URL for
different content.

### `CATALOG_ONLY`

Purpose: publish an existing standalone trainer with
`FILE_PUBLISHED=true`, at least one explicitly approved discovery surface, and
`BOARD_MIRROR=false`. Site discovery and board discovery are separate. When
`BOARD_DISCOVERY=true`, only the current `opens-in-board` iframe mode is
permitted.

Review level: `SMALL`.

#### Input requirements

- All `STATIC_ASSET` inputs and passed gates.
- Approved canonical URL and exact values for `SITE_DISCOVERY` and
  `BOARD_DISCOVERY`.
- When site discovery is enabled: approved site title, summary, grouping, tags,
  ordering, and site surfaces.
- When board discovery is enabled: approved current `opens-in-board` registry
  metadata.
- Verified standalone and iframe behavior.
- Explicit declaration that no semantic mirror is required.

#### Mandatory metadata

- All static metadata plus the four explicit publication-surface booleans,
  site-discovery copy/search metadata when applicable, manual URL,
  board-discovery decision, and sitemap decision.
- If entered in the runtime registry, the cross-check must use only current
  fields, set `boardCompatibility: opens-in-board` and
  `supportsBoardMirror: false`, and truthfully declare seed and semantic-event
  support. Otherwise it must explicitly say `register: false`.

#### Allowed files in a future task

- Descriptor and inventory records.
- Existing site catalog, sitemap, and course/manual-link files only for an
  approved `SITE_DISCOVERY=true` delta.
- `trainers/board-compat.json` only for an approved
  `BOARD_DISCOVERY=true` delta using `opens-in-board`.
- Trainer files are not allowed in a `CATALOG_ONLY` publication task. A found
  runtime defect becomes a separate approved task and must pass classification
  and review before the `CATALOG_ONLY` publication resumes.
- Focused site-discovery, manual URL, iframe, and board-registry tests.
- No mirror adapter, Bridge, board core, server core, protocol, or deployment
  changes.

#### Automated checks

- All `STATIC_ASSET` checks.
- Site-discovery render/search/filter and unique card/link checks when enabled.
- Manual canonical URL and site-discovery click HTTP checks.
- If registered, exact registry projection validation and manual/quick-select
  iframe loading with no basename fallback.
- Mobile and iframe viewport checks, zero console errors, and zero pageerrors.
- Existing public links, query/fragment behavior, and top-level URLs remain
  unchanged.

#### Visual and pedagogical acceptance

- Catalog title, description, tags, and grouping accurately set expectations.
- Standalone and iframe views retain all controls, readable math, feedback, and
  keyboard/touch usability.
- Subject reviewer completes at least one correct, incorrect, hint/solution,
  next/reset, and statistics flow supported by the trainer.

#### Escalation criterion

Escalate to `MIRROR_STANDARD` only when the approved product goal requires
teacher/student state mirroring and the state fits the existing standard
Bridge contract. Any platform-core or protocol change stops Factory processing
and requires a separate `HIGH` platform task.

#### Final gate

`TRAINER_FACTORY_CATALOG_ONLY_GATE_OK`

#### Rollback

Revert the exact approved site-discovery and/or board-discovery entries while
preserving an already-existing direct trainer URL. Restore any pre-existing
metadata exactly; do not delete or relocate the trainer merely because a
discovery surface is rolled back.

### `MIRROR_STANDARD`

Purpose: adapt a trainer to the proven Bridge v1 and registry lifecycle without
changing platform core.

Default review level: `MEDIUM`. Independent Claude review is not required for a
mechanical use of the owner-accepted standard archetype/template established by
code and gates when the changed-file proof is zero-core and the complete
standard gate passes. The owner may still request external review, and any
higher-risk scope uses the higher applicable review level.

#### Input requirements

- Passed `CATALOG_ONLY` gates.
- Existing trainer behavior inventory and mutable-state assessment.
- Closed semantic state contract, JSON Schema, committed conformance fixture,
  snapshot budget, and storage/statistics side-effect model.
- Evidence that the current Bridge, registry, board, and Socket.IO contracts
  are sufficient without modification.

#### Mandatory metadata

- All site-discovery and board-discovery metadata plus `version`, `stateSchemaVersion`,
  `bridgeProtocolVersion`, `supportsSeed`, `supportsBoardMirror: true`,
  `boardCompatibility: board-mirror`, `allowLegacyHtml`, state-contract/schema/
  fixture references, snapshot limits, and lifecycle capabilities.
- Runtime manifest fields may be repeated only as a fail-closed cross-check of
  the existing registry contract.

#### Allowed files in a future task

- The target trainer and declared trainer-local adapter/assets.
- Its descriptor, state contract, closed JSON Schema, one committed conformance
  fixture, manifest entry, and focused server/browser tests.
- A bounded reusable test harness change only when it exercises existing
  behavior and does not change production core.
- No board, Bridge, registry, server, Socket.IO, endpoint, or deployment core.

#### Automated checks

- All `CATALOG_ONLY` checks.
- Schema and semantic validation, round trip, canonicalization, maximum-size,
  malformed-state, atomic-rejection, and fixture parity checks.
- Standard mirror lifecycle: teacher start, student grant, initial hydrate,
  late join, update, reload, revoke, reconnect, close, and loop suppression.
- Exact case-sensitive authorization and proof that no basename fallback exists.
- Viewer localStorage/statistics remain byte-identical during remote apply,
  hydrate, reload, revoke, and invalid-state rejection.
- Full relevant B1/B2, nested-path, registry, server, browser, and existing
  mirror regression suites.

#### Visual and pedagogical acceptance

- Standalone, teacher, and student views are checked at mobile/tablet/desktop
  sizes and inside the actual board iframe.
- Teacher and student display the same approved semantic state; private learner
  progress, statistics, timers, and transient feedback do not leak.
- A subject reviewer validates representative generated variants, boundary
  answers, explanations, hints, and the meaning of every mirrored field.

#### Escalation criterion

Stop Factory processing if any requirement needs a core edit, new message/event,
protocol field, endpoint contract, authorization/security rule, server runtime
change, Socket.IO change, or deployment change. That work is a separate `HIGH`
platform task, not `NEW_ARCHETYPE` and not a fifth Factory track. If the state
cannot be expressed safely by the current semantic snapshot model without a
platform change, the standard task must not contain a provisional workaround.

#### Final gate

`TRAINER_FACTORY_MIRROR_STANDARD_GATE_OK`

#### Rollback

Revert the adapter, schema, fixture, tests, and mirror manifest delta together.
Preserve the pre-existing trainer URL and standalone behavior. Downgrading to
`opens-in-board` is allowed only if that fallback was tested and separately
approved; otherwise restore the exact prior manifest state.

### C5 machine-checkable mechanical `MIRROR_STANDARD`

Phase 3 must create an owner-accepted, versioned standard-template contract
before any no-Claude mechanical classification is allowed. The contract
contains at least:

- `templateId`, `templateVersion`, and `archetype`;
- `allowedChangedFiles` and `forbiddenChangedFiles`;
- machine-readable allowed substitution points and immutable template regions;
- allowed manifest fields and allowed descriptor fields;
- allowed state-schema bounds;
- required fixture/vector families and lifecycle gates;
- immutable-region template fingerprint/hash;
- accepted owner decision and verifiable provenance.

Substitution points use named regions, structured placeholders, schema-driven
fields, or another deterministic machine-readable mechanism. Human judgment
that a diff merely "looks like the template" is never mechanical proof.

No-Claude `MIRROR_STANDARD` classification requires all of these on the exact
head:

1. The exact owner-accepted template ID and version.
2. Changed files are a subset of `allowedChangedFiles` and disjoint from
   `forbiddenChangedFiles`.
3. Every change inside a template-controlled file is confined to declared
   substitution points.
4. Every immutable-region fingerprint matches the accepted template.
5. Zero-core proof passes.
6. The complete standard gate and required lifecycle/vector families pass.
7. C4 descriptor-manifest equality passes on the same exact head.
8. No new semantic or lifecycle primitive is introduced.

Any diff outside the file allowlist or substitution points, or any immutable
fingerprint mismatch, automatically forbids mechanical classification and
`TRAINER_FACTORY_MIRROR_STANDARD_GATE_OK`. It escalates to `NEW_ARCHETYPE` when
platform contracts remain unchanged, or exits Factory into a separate
`PLATFORM_CHANGE` task when core, protocol, security, runtime, server, registry,
Socket.IO, authorization, or deployment behavior must change.

The mandatory negative acceptance test modifies one line outside an allowed
substitution point in an otherwise zero-core candidate. The machine checker
must reject mechanical classification, select the correct escalation, and
block `TRAINER_FACTORY_MIRROR_STANDARD_GATE_OK`.

### `NEW_ARCHETYPE`

Purpose: evaluate a new trainer-local pattern that does not fit the three proven
tracks but can still operate on the unchanged platform contracts.

Review level: `HIGH` or `NEW_ARCHETYPE`, with a separate plan-stage architecture
review before implementation.

#### Input requirements

- A failed lower-track classification with concrete evidence and no platform
  change hidden inside it.
- Separate owner-approved task specification and `NEW_ARCHETYPE` review level.
- Accepted or updated ADR before rollout, prototype evidence, migration and
  compatibility analysis, threat model, observability, and rollback design.
- Explicit proof that existing Bridge, registry, server, Socket.IO,
  authentication/security, and deployment contracts remain unchanged. If they
  cannot remain unchanged, stop and create a separate `HIGH` platform task.

#### Mandatory metadata

- All applicable descriptor fields plus the accepted ADR, capability delta,
  unchanged-platform proof, trainer-local version strategy, compatibility
  window, observability, rollout cohort, kill switch, and rollback boundary.

#### Allowed files in a future task

- Only the allowlist in the separately approved archetype specification.
- Factory v1 itself grants no permission to edit core or protocols.

#### Automated checks

- All applicable lower-track gates plus prototype conformance, compatibility,
  security, migration, failure-injection, rollback, and full regression gates
  defined by the accepted architecture.

#### Visual and pedagogical acceptance

- Independent product, architecture, security, visual, accessibility, and
  subject-matter acceptance appropriate to the new behavior.
- A bounded pilot must prove the archetype before any batch rollout.

#### Escalation criterion

No automatic escalation exists above this track. Unresolved architecture,
security, migration, or rollback questions block implementation and release.

#### Final gate

`TRAINER_FACTORY_NEW_ARCHETYPE_GATE_OK`, defined concretely by the accepted ADR
and approved task; the marker in this plan is not a passed gate.

#### Rollback

Use the accepted ADR's controlled rollback and kill-switch plan. Revert the
entire bounded prototype or cohort, retain old URLs/contracts for the declared
compatibility window, and do not roll forward through a failed gate.

## Platform-change boundary

`PLATFORM_CHANGE` is deliberately not a Trainer Factory track. Discovery of any
required change to board core, Bridge, server runtime, the registry endpoint,
Socket.IO, authentication/security, authorization, or deployment produces a
fail-closed Factory stop with a sanitized escalation report. It does not mutate
the candidate branch, reinterpret `NEW_ARCHETYPE`, or grant platform scope.

The owner must create and approve a separate `HIGH` platform task with its own
task-spec, branch, PR, gates, review, rollback, and merge authorization. After
that platform task is independently accepted and merged, a new Factory task may
reclassify the trainer against the new canonical base. The original Factory
authorization never carries across this boundary.

## Unified trainer request template

Every future trainer or batch starts with a sanitized request containing:

```yaml
requestVersion: 1
requestId: ""
owner: ""
userGoal: ""
audience:
  subject: ""
  gradeBands: []
  exam: ""
  taskNumbers: []
source:
  repositoryPaths: []
  existingPublicUrls: []
  provenance: ""
  usageRights: ""
requestedOutcome:
  candidateTrack: "STATIC_ASSET | CATALOG_ONLY | MIRROR_STANDARD | NEW_ARCHETYPE"
  preserveUrls: []
  canonicalPublicUrl: ""
  siteDiscoveryPlacement: ""
  publicationSurfaces:
    FILE_PUBLISHED: false
    SITE_DISCOVERY: false
    BOARD_DISCOVERY: false
    BOARD_MIRROR: false
  batchId: ""
ownerApproval:
  track: false
  publicUrl: false
  siteDiscovery: false
  boardDiscovery: false
  batchMembership: false
pedagogy:
  objectives: []
  misconceptions: []
  answerEquivalence: ""
  requiredFlows: []
runtime:
  dependencies: []
  storageKeys: []
  statisticsOwner: ""
  stateMirrorRequired: false
scope:
  in: []
  out: []
acceptance: []
rollback: ""
```

The candidate track is not authoritative. The inventory/classifier records the
selected track and reasons, and the owner approves the final scope before
implementation.

## Trainer descriptor and authority boundary

The future machine-readable descriptor is a closed, versioned JSON document.
It stores predominantly pedagogical, inventory, provenance, production, and
acceptance metadata. It is not a replacement runtime manifest, does not grant
registry membership, and never authorizes mirror behavior.

`trainers/board-compat.json` remains runtime source data. The validated server
projection of that data remains runtime authority for exact trainer
authorization and mirror capability. Factory tooling must read those sources;
it must not generate a second independent mirror-authority document.

At minimum the descriptor contains:

- `descriptorVersion`, `trainerId`, `canonicalPath`, derived `canonicalUrl`,
  `entrypoint`, `assetPaths`, and content hashes;
- title, short description, subject, grade bands, exam/task numbers, language,
  tags, group, archetype, factory track, publication status, and content
  version;
- source provenance, usage rights, owner, dependencies, external origins, and
  integrity expectations;
- all known public URLs, course/site-catalog/manual references, preserved aliases,
  and an explicit duplicate disposition;
- storage namespaces and keys, statistics owner, personal-data declaration,
  reset behavior, and isolation expectations;
- owner-approved publication surfaces and a non-authoritative runtime
  cross-check imported from the current manifest when a registry entry exists;
- state-contract, schema, and conformance-fixture references when mirrored;
- required gates, manual acceptance record, review level, rollout batch, and
  rollback target.

All objects reject unknown properties. `trainerId` and canonical file path are
unique. Canonical URL is derived from the path rather than supplied as an
independent identity. Any runtime field repeated in a descriptor must equal the
current manifest byte-for-value after canonical parsing. Missing, extra, stale,
or different repeated fields fail closed before publication. A matching
descriptor still does not authorize mirror; only current manifest source data
and the validated server projection do.

### Runtime manifest cross-check

The descriptor may record one of these non-authoritative cross-check shapes:

```json
{
  "authority": "cross-check-only",
  "registryEntryExpected": false,
  "reason": "static asset only"
}
```

```json
{
  "authority": "cross-check-only",
  "registryEntryExpected": true,
  "boardCompatibility": "opens-in-board",
  "supportsBoardMirror": false,
  "supportsSeed": false,
  "supportsSemanticEvents": false
}
```

```json
{
  "authority": "cross-check-only",
  "registryEntryExpected": true,
  "boardCompatibility": "board-mirror",
  "supportsBoardMirror": true,
  "supportsSeed": false,
  "version": "1.0.0",
  "stateSchemaVersion": 1,
  "bridgeProtocolVersion": 1,
  "allowLegacyHtml": false
}
```

Only fields supported by the current manifest may be repeated. The cross-check
is validated against the actual runtime manifest and server registry rules and
fails closed on any mismatch. No descriptor field, approval marker, or Factory
classification can substitute for runtime authorization.

### C4 descriptor-manifest equality on the exact release head

`TRAINER_FACTORY_BATCH_RELEASE_GATE_OK` must rerun the authority cross-check on
the exact release head. A result from the authoring head, review head, or an
earlier release candidate never carries forward automatically.

The release gate must:

1. Load every batch descriptor from the exact release tree.
2. Load `trainers/board-compat.json` from the same tree.
3. Build the validated server-equivalent projection or an owner-approved
   deterministic cross-check proven equivalent to it.
4. Compare every repeated runtime field and expected entry absence/presence for
   the selected track.
5. Fail closed on stale, missing, extra, differently typed, or differently
   valued fields.
6. Record release base SHA, head SHA, tree SHA, descriptor input hashes, manifest
   hash, checker version, and result in gate evidence.

Any descriptor or manifest change after the last successful check invalidates
that check and requires the complete equality gate again. The acceptance test
first passes a descriptor against one head, changes the manifest on a new head,
and proves the now-stale descriptor blocks release even though it passed
previously.

## State-contract template

Every `MIRROR_STANDARD` descriptor links to a trainer-specific contract that
answers all of the following:

1. State identity and version; standalone behavior that must remain unchanged.
2. Included semantic fields, excluded transient/private fields, invariants,
   bounds, and canonical ordering.
3. `getState`, validation, atomic `applyState`, render, and change-notification
   behavior using the existing Bridge lifecycle.
4. Determinism, idempotency, maximum serialized UTF-8 size, depth, and array
   limits.
5. Timer, animation, random input, late-join, reconnect, revoke, and reload
   behavior.
6. Explicit prohibition of HTML, DOM snapshots, executable values, secrets,
   personal data, localStorage payloads, and learner statistics in mirrored
   state.
7. Exact side-effect budget: remote apply and hydrate do not write storage,
   statistics, analytics, timers, or outbound echo events.
8. Version compatibility, unknown-field rejection, migration policy, and safe
   failure behavior.

## JSON Schema template

The future schema template uses a supported JSON Schema draft, is closed at
every object level, and is tightened by trainer-specific semantic validation:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://mathexam.space/schemas/trainers/example-board-state-v1.schema.json",
  "title": "Example trainer board state v1",
  "type": "object",
  "additionalProperties": false,
  "required": ["version", "trainerId", "state"],
  "properties": {
    "version": { "const": 1 },
    "trainerId": { "const": "example-trainer" },
    "state": {
      "type": "object",
      "additionalProperties": false,
      "required": ["mode"],
      "properties": {
        "mode": { "type": "string", "enum": ["learn", "practice"] }
      }
    }
  }
}
```

Concrete schemas replace all example values, set explicit string/number/array
bounds, and pair structural validation with semantic invariants. A permissive
catch-all schema is not conformant.

## Conformance-fixture template

Each standard mirror commits exactly one versioned fixture consumed directly
by both server and browser tests:

```json
{
  "fixtureVersion": 1,
  "trainerId": "example-trainer",
  "stateSchemaVersion": 1,
  "schemaMaximumVectorId": "accept-schema-maximum",
  "vectors": [
    {
      "id": "accept-minimum",
      "kind": "accept",
      "state": {
        "version": 1,
        "trainerId": "example-trainer",
        "state": { "mode": "learn" }
      }
    },
    {
      "id": "reject-unknown-property",
      "kind": "reject",
      "state": {
        "version": 1,
        "trainerId": "example-trainer",
        "state": { "mode": "learn", "extra": true }
      }
    }
  ],
  "lifecycleCases": [
    "teacher-start",
    "student-grant-and-hydrate",
    "late-join",
    "update-without-echo",
    "reload",
    "revoke",
    "reconnect",
    "close"
  ]
}
```

The concrete fixture includes minimum, typical, maximum, canonical round-trip,
every boundary, malformed type, unknown key, unsafe string, semantic invariant,
atomic rejection, and storage/statistics sentinel vectors. Missing, malformed,
duplicated, or skipped vectors fail both suites.

## Storage and statistics isolation

- Inventory records literal and dynamically constructed localStorage and
  sessionStorage keys, shared containers, topic keys, resets, and write sites.
- New storage uses a trainerId-based versioned namespace. Existing shared
  containers require a unique topic key and byte-preserving updates of all
  unrelated topics.
- A trainer may access only the keys declared in its descriptor. Batch tests
  seed unrelated sentinel keys and compare them byte-for-byte after start,
  answer, reset, iframe load, remote hydrate/apply, reload, revoke, and error.
- `MIRROR_STANDARD` never mirrors localStorage or learner statistics. Viewer
  hydration/apply cannot write them. Teacher and student browser profiles stay
  isolated.
- Storage collisions, undeclared dynamic keys, personal data, cross-trainer
  resets, or remote-apply writes block publication and require redesign or
  escalation.

## Inventory and deduplication

The future inventory is read-only by default and covers tracked trainer files,
site catalog cards, sitemap URLs, course/manual links, runtime registry entries,
co-located assets, archive/test/placeholder paths, and relevant generated
references.

For every candidate it records:

- canonical path and URL, hashes, size, MIME, dependencies, and reference
  graph;
- site-catalog, sitemap, course, manual, board-discovery, and runtime-registry
  status;
- technical archetype and proposed factory track with evidence;
- storage/statistics, iframe, mobile, console, network, Bridge, and security
  characteristics;
- provenance, ownership, content-review status, and unresolved questions;
- duplicate groups and exactly one explicit duplicate/alias status from the
  model below.

### Duplicate and alias statuses

| Status | Meaning |
| --- | --- |
| `CANONICAL` | The authoritative file and public URL for this content identity. |
| `ALIAS` | An owner-approved additional reference that resolves to the canonical identity without an independent content authority. |
| `REDIRECT_WRAPPER` | A reviewed wrapper whose only intended behavior is preserving an existing URL by redirecting to the canonical URL. |
| `ARCHIVE_COPY` | A non-public historical/test copy excluded from discovery and runtime authorization. |
| `EXACT_DUPLICATE_APPROVED` | An exact blob duplicate retained for a documented owner-approved compatibility reason with unambiguous URL ownership. |
| `DUPLICATE_UNRESOLVED` | A collision or copy whose identity, ownership, URL, or retention decision is unresolved. It is release-blocking. |

Deduplication rules:

1. Release is blocked by duplicate `trainerId`, duplicate canonical full path,
   ASCII case-fold path collision, normalized public URL collision, or an
   unresolved exact-blob duplicate.
2. Exact case-sensitive canonical paths remain the authorization identity.
3. Compare content hashes across all publication roots and declared assets. A
   retained exact blob must be classified `EXACT_DUPLICATE_APPROVED` with an
   owner decision and unambiguous URL ownership; otherwise it is
   `DUPLICATE_UNRESOLVED` and blocks release.
4. The same basename in different canonical directories is reported but does
   not block release and is never used for authorization after B2.
5. Query and fragment are not URL identity. Existing meaningful query-driven
   trainer behavior is tested but cannot create a second canonical record.
6. Existing collisions are quarantined as inventory debt. Factory v1 does not
   mass-migrate them, but a touched candidate cannot ship with unresolved
   identity or ownership.

### C3 deterministic normalized public URL contract

URL normalization exists only for read-only inventory and collision detection.
It does not authorize a runtime trainer, create an alias, replace canonical
path validation, or change the server registry lookup.

The exact-base sitemap audit found 152 URLs: all use `https`, all use host
`mathexam.space`, 142 end in `.html`, 10 directory resources use a trailing
slash, none end in `/index.html`, and none contain query, fragment, or duplicate
pathname slashes. The normative canonical site origin is therefore:

```text
https://mathexam.space
```

`trainer-inventory` must implement this deterministic algorithm before the
Phase 1 gate:

1. Accept only a string of at most the existing `maxUrlLength = 2048` contract;
   do not trim, decode, repair, or Unicode-normalize it.
2. Before parsing, split the input at the earlier of the first `?` or `#`;
   delimiter order does not matter. For an absolute URL, take the undecoded
   substring from the first slash after its authority (or `/` when it has no
   path); for a root-relative input, take the pre-delimiter string; for a
   canonical relative input, prefix that string with `/`. This value is the raw
   pathname used by step 3. Query and fragment may be recorded separately but
   are excluded from collision identity and never participate in raw-path
   rejection.
3. Before WHATWG parsing, reject controls, bidi or invisible controls,
   backslashes, ambiguous Unicode separators, literal `.` or `..` segments,
   duplicate pathname slashes, and any percent sign in the raw pathname. The
   last rule inherits the nested-path contract and rejects encoded slash,
   encoded backslash, encoded dot segments, double encoding, stray percent, and
   malformed percent without decode-and-revalidate repair.
4. Parse with WHATWG `URL` relative to `https://mathexam.space/`. Accepted input
   forms for a canonical trainer are same-origin absolute HTTPS, root-relative
   `/trainers/...`, and canonical relative `trainers/...`. Protocol-relative,
   filesystem, drive, UNC, and other relative-base forms are rejected.
5. Require empty username and password. Require `https:` and the canonical
   hostname after the URL parser's case-insensitive hostname normalization.
   The HTTPS default port is removed; any non-default port is rejected.
6. Cross-origin values cannot be a canonical trainer public URL. Inventory may
   retain them only under the separate `EXTERNAL_REFERENCE` classification;
   canonical-URL validation returns `REJECT`.
7. Re-run the accepted nested-path contract on the case-preserving pathname
   without its leading slash. Path case is never folded by URL normalization.
   Case-different valid paths are `DISTINCT` here; the separate canonical-path
   ASCII case-fold collision gate may still block them.
8. A normal trainer file path ends in lowercase `.html` and has no trailing
   slash. A trailing slash after `.html` is `REJECT`.
9. For repository-wide discovery collision scanning, terminal `/index.html`
   and the corresponding directory `/` have one collision identity: remove
   `index.html` and keep the trailing slash. For every other resource, a
   trailing slash is case-preserved and significant; `/x` and `/x/` are
   `DISTINCT`. This equivalence is inventory-only and never changes registry
   file identity.
10. Serialize the canonical origin plus normalized pathname. Never decode or
    repair an input into an owner-approved alias or runtime authorization.

The future committed fixture is
`tools/fixtures/trainer-public-url-conformance.json`. Its closed contract is:

```json
{
  "schemaVersion": 1,
  "canonicalOrigin": "https://mathexam.space",
  "vectors": [
    {
      "id": "same-origin-root-relative-normalized",
      "input": "/trainers/example.html?mode=practice#task",
      "expected": "NORMALIZED",
      "canonicalResult": "https://mathexam.space/trainers/example.html",
      "reason": "query and fragment are identity-neutral"
    }
  ]
}
```

Vector IDs are stable and unique. `expected` is exactly one of `NORMALIZED`,
`COLLISION`, `DISTINCT`, or `REJECT`; every accepted vector has an exact
`canonicalResult`, and every vector has a deterministic `reason`.

Mandatory vector families cover hostname case, HTTPS default port, query,
fragment, trailing slash, `/index.html`, pathname case, raw percent encoding,
encoded slash/backslash, encoded and literal dot segments, duplicate slashes,
same-origin absolute/root-relative/canonical-relative inputs, cross-origin,
credentials, schemes, ports, and malformed URLs. The fixture and one executable
normalizer are consumed by all applicable inventory/collision tests and fail on
missing, duplicate, skipped, or disagreed vectors.

The Phase 1 gate must not claim or enforce the normalized-public-URL collision
blocker until this fixture and executable check are committed and passing.

## Owner publication boundary

No local, unpublished, archive, draft, or newly discovered inventory file is
published automatically. Discovery, classification, a passing inventory gate,
or presence in the repository is not publication authorization.

After classification and before any publication edit, the owner must explicitly
approve all of the following for each trainer:

- selected Factory track;
- exact canonical public URL;
- `SITE_DISCOVERY` value and exact site surfaces;
- `BOARD_DISCOVERY` value and current registry mode, if any;
- batch membership.

`FILE_PUBLISHED` and `BOARD_MIRROR` must also reflect verified reality and
separate applicable authority; neither is inferred from the five owner choices
above. Any changed URL, discovery surface, track, or batch membership
invalidates the prior publication approval and requires a new owner decision.

## Common smoke and acceptance matrix

Every published trainer receives the applicable rows; a batch report lists
pass, fail, and not-run separately.

| Area | Required evidence |
| --- | --- |
| HTTP | Direct canonical, site-discovery, and manual URLs return the expected status, content type, and entry point; dependencies return successfully. |
| Site discovery | Site card/link renders once, search/filter works where applicable, click resolves to the canonical URL, and no stale/duplicate entry exists. |
| Manual URL | Exact nested/top-level path works without basename fallback; existing query/fragment flows remain compatible. |
| Desktop | 1440 x 900 core task flow, no clipped controls or unexpected scroll. |
| Mobile | 360 x 800 and 390 x 844 core task flow, no outer horizontal scroll, readable math, usable touch targets. |
| Tablet | 768 x 1024 core task flow. |
| Iframe | Actual board iframe load at mobile and desktop sizes; focus, scrolling, resize, and controls remain usable. |
| Runtime | Zero console errors and zero pageerrors; unexpected failed requests block. |
| Pedagogy | Representative correct/incorrect/equivalent answers, hints, solutions, next/reset, boundaries, and generated variants are correct. |
| Persistence | Declared progress survives/restarts correctly and unrelated storage/statistics remain byte-identical. |
| Mirror | Standard grant/hydrate/update/late-join/reload/revoke/reconnect/close lifecycle, atomic invalid-state rejection, no echo loop. |
| Security | No secrets, absolute local paths, control/bidi surprises, unsafe navigation, executable state, unapproved origins, or undeclared data collection. |

## Batch publication policy

- Start with one archetype and one factory track per batch. Mixed-track batches
  require explicit owner rationale and inherit the highest risk.
- Pilot size is 3-5 trainers. After two clean pilot releases, suggested default
  maxima are 10 for `STATIC_ASSET`, 5 for `CATALOG_ONLY`, and 3 for
  `MIRROR_STANDARD`. These are operational caps, not release targets.
- Every trainer must pass independently before the aggregate batch gate. One
  failure blocks the batch; removing a failed item requires an explicit scope
  update and a regenerated inventory/diff report.
- A batch PR lists the exact changed-file set, URLs, descriptors, hashes,
  gates, manual reviewers, and an independently applicable rollback delta per
  trainer.
- Shared metadata edits must remain attributable by trainer so one trainer can
  be removed in a normal reviewed rollback PR without reverting the other
  accepted trainers. The complete batch also retains an aggregate rollback.
- Release occurs through normal owner-authorized controlled merge. Production
  evidence is collected per URL; no manual deployment is implied.
- The aggregate marker is `TRAINER_FACTORY_BATCH_RELEASE_GATE_OK` and is valid
  only together with every included track marker.

### C2 executable per-trainer reverse delta

Every shared discovery file edited by a future batch must support a
machine-applicable reverse delta for each trainer:

- each trainer contribution is one contiguous, order-stable block;
- the block has stable attribution identity derived from `trainerId`, canonical
  public URL, and a format-specific selector;
- a trainer block contains no shared derived counter or aggregate value;
- authoring one trainer block does not reformat, reorder, or rewrite another
  trainer block;
- shared aggregate values, if introduced, are rebuilt by a separate
  deterministic generator and verified by its gate, never restored through a
  hand-written reverse patch.

Authoring-stage evidence includes the forward delta and executable reverse
delta for every trainer, the shared-file input hashes, and the expected hashes
or selectors after reversal. A prose rollback instruction is insufficient.

The mandatory acceptance test for a batch of `N` trainers is:

1. Build the candidate merged tree for all `N` trainers.
2. Apply the reverse delta for trainer `K` without changing the other deltas.
3. Prove all remaining `N-1` entries are intact.
4. Re-run HTML, link, render, collision, and deduplication checks.
5. Validate every shared file and deterministic aggregate.
6. Prove all pre-Factory baseline references remain byte-identical.
7. Repeat steps 2-6 for every trainer in the batch.

`TRAINER_FACTORY_BATCH_RELEASE_GATE_OK` fails if any reverse delta is missing,
ambiguous, non-deterministic, cannot apply cleanly, changes another trainer's
formatting, or removes a baseline reference.

## Review policy and Claude use

- `STATIC_ASSET` publication is `SMALL`.
- `CATALOG_ONLY` publication is `SMALL`. A homogeneous multi-trainer batch
  remains `SMALL` when it changes only the explicitly approved publication
  surfaces and passes every per-trainer and aggregate gate. A discovered
  trainer runtime defect is a separate task rather than scope expansion.
- Claude review is not required for these `SMALL` track PRs unless the owner
  requests it or another risk independently raises the review level.
- `MIRROR_STANDARD` is `MEDIUM` by default. External Claude review is not
  required for mechanical use of the owner-accepted standard
  archetype/template established by code and gates when scope is provably
  zero-core and the complete standard gate passes.
- `NEW_ARCHETYPE` is `HIGH` or `NEW_ARCHETYPE` and requires a separate
  plan-stage review, an Accepted or updated ADR where applicable, prototype
  evidence, independent review, and explicit owner acceptance before rollout.
- A required platform change is not `NEW_ARCHETYPE`; it exits Factory into a
  separate `HIGH` platform task.
- A batch uses the highest applicable level. Splitting work cannot lower risk.
- External evidence must record provider, PR, base SHA, head SHA, verdict, and
  a verifiable source or timestamp. Text copied into a request, task-spec, PR
  body, example, or old message is not review provenance.

## Proposed future skills and commands

These names and contracts are design outputs only. No skill is implemented by
this plan.

### `trainer-inventory`

- Inputs: exact base, requested roots or trainer IDs, optional read-only cohort
  filter.
- Actions: scan files/references/runtime metadata, compute hashes and canonical
  URLs, classify archetypes/tracks, discover dependencies/storage, and produce
  collision and unknown-provenance reports.
- Outputs: versioned machine-readable inventory, human summary, candidate batch
  list, and hard blockers.
- Stops: never edits trainer, site-discovery, or runtime-manifest files and
  never publishes.

### `trainer-publish`

- Inputs: approved request, exact-base inventory, validated descriptor, selected
  `STATIC_ASSET` or `CATALOG_ONLY` track, explicit owner approvals for track,
  URL, both discovery surfaces, and batch membership, plus explicit `START`.
- Actions: enforce allowed-file scope, apply metadata/publication changes, run
  track gates, create logical commits, and prepare a Draft PR.
- Stops: before merge; refuses collisions, unknown provenance, trainer runtime
  edits outside scope, or any mirror/platform-core requirement. A mirror need
  returns to owner classification; a platform need exits to a separate task.

### `trainer-adapter`

- Inputs: approved `MIRROR_STANDARD` request, mutable-state assessment, closed
  contract/schema/fixture, exact base, and explicit `START`.
- Actions: implement trainer-local adapter and tests using current protocols,
  run full standard lifecycle and regression gates, and prepare a Draft PR.
- Stops: immediately if any production core, protocol, endpoint, Socket.IO,
  authentication/security, or deployment change is needed and emits a
  separate-`HIGH`-platform-task escalation packet. A trainer-local pattern that
  fits unchanged platform contracts may instead emit a `NEW_ARCHETYPE` packet.

### `trainer-batch-release`

- Inputs: owner-approved homogeneous batch, exact PR identity, per-trainer
  descriptors/gates, review provenance, and separate merge/release authority.
- Actions: verify base-drift guard, exact delta, aggregate gates, controlled
  merge, permitted deployment observation, and per-URL production evidence.
- Stops: on base drift, changed head, failed/skipped gate, identity mismatch,
  missing review, unexpected file/URL, or any partial-release ambiguity.

GitHub CLI remains optional for every skill; the built-in GitHub integration is
the fallback. Neither tokens nor credentials belong in descriptors, skills, or
reports.

## Proposed pilot batch

Track: `CATALOG_ONLY`.

Candidate trainers, all existing unique-basename top-level standalone HTML
files with viewport metadata and no detected Bridge, fetch, external-origin,
iframe, localStorage, or sessionStorage use:

1. `trainers/oge-task6-fractions.html`;
2. `trainers/oge-task8-powers-roots.html`;
3. `trainers/oge-task9-equations.html`;
4. `trainers/oge-task20-equations.html`.

### C1 verified pilot baseline

The pilot is a Factory reconciliation of an existing published cohort, not
primary publication. The baseline below was re-audited read-only on reviewed
head `aadf0d2e6ba014e9bdbfcd4f2ed625c3fd23b28a`:

- `sitemap.xml` baseline blob:
  `ec583f582f9196eacbbe0527d650f50014dcd8e3`;
- `trainers/oge-course/index.html` baseline blob:
  `33435f0d93c89b410f200c1eb9a7391196a70b59`;
- stable sitemap selector: exact `<loc>{canonicalPublicUrl}</loc>`;
- stable OGE-course selector: the single contiguous
  `<article class="entry">` containing exact
  `href="/trainers/{basename}"` references.

| Trainer | Trainer blob | Existing canonical public URL | Sitemap line | OGE-course line | Other tracked discovery references | `board-compat` entry |
| --- | --- | --- | ---: | ---: | --- | --- |
| `trainers/oge-task6-fractions.html` | `cc71b02fbcdbe3f5b03a8d8e8131ce2b5b180e92` | `https://mathexam.space/trainers/oge-task6-fractions.html` | 814 | 106 | none found | absent |
| `trainers/oge-task8-powers-roots.html` | `e93f6e6dc035733d6ecf7f4d80c2a331ec617dd2` | `https://mathexam.space/trainers/oge-task8-powers-roots.html` | 826 | 108 | none found | absent |
| `trainers/oge-task9-equations.html` | `fde6982c69734dc47e5be4909829fc21706b819c` | `https://mathexam.space/trainers/oge-task9-equations.html` | 832 | 109 | none found | absent |
| `trainers/oge-task20-equations.html` | `efb12d423848c97ff396268a2adbb359f38d4160` | `https://mathexam.space/trainers/oge-task20-equations.html` | 880 | 136 | none found | absent |

Every future pilot descriptor must record all pre-existing references, the
baseline blob for each containing file, and either its current line identity or
the stable selectors above. Line numbers are audit evidence, not durable
identity by themselves.

`FILE_PUBLISHED` and `SITE_DISCOVERY` are derived from this verified baseline,
not from a planned Factory action. The pilot delta is computed only relative to
that baseline. Factory rollback must never remove or rewrite a sitemap,
OGE-course, URL, or other reference that existed before Factory.

Per-trainer simulated rollback is an acceptance test: after removing only the
candidate Factory delta, the pre-existing sitemap and OGE-course reference
blocks must be byte-identical to their baseline blobs/selectors. The test is
performed for all four trainers and fails closed on any baseline change.

They form one technical archetype: standalone single-file OGE mathematics
trainers. Their reconciled baseline surfaces are `FILE_PUBLISHED=true`,
`SITE_DISCOVERY=true`, `BOARD_DISCOVERY=false`, and `BOARD_MIRROR=false`.
Manual board-iframe URL smoke is a test surface only; it does not add board
discovery or mirror authorization. This is a candidate cohort, not approval to
change existing publication. A failed candidate is not silently replaced or
edited; the owner approves any revised pilot list or surface delta.

### Per-trainer pilot acceptance

Each of the four candidates must have, independently:

- a validated inventory descriptor and duplicate/alias status;
- its verified pre-existing references and baseline blob/selector identities;
- confirmed provenance and usage authority;
- dependency and storage/statistics audit;
- standalone desktop and mobile smoke;
- board iframe/manual canonical URL smoke without board discovery;
- console errors equal to zero and pageerrors equal to zero;
- explicit content and pedagogical owner approval;
- its own passing `TRAINER_FACTORY_CATALOG_ONLY_GATE_OK` evidence tied to the
  exact trainer, URL, files, and descriptor.

### Aggregate pilot acceptance

The batch must have:

- proof that all four trainers share the same `CATALOG_ONLY` track and
  standalone-single-file archetype;
- a passing `TRAINER_FACTORY_BATCH_RELEASE_GATE_OK` in addition to all four
  per-trainer gates;
- a repository-wide collision and deduplication scan;
- an exact changed-file list attributed per trainer and for shared metadata;
- an independently applicable rollback delta for each trainer without
  reverting the other three;
- evidence that publishing the next equivalent trainer requires no Factory
  core, platform core, protocol, or template change.

## Implementation roadmap

### Phase 0 - architecture plan

- Exact-base task-spec, external architecture review, condition closure, and
  owner decision on the factory contract.
- Gate: `TRAINER_FACTORY_V1_ARCHITECTURE_GATE_OK`.

### Phase 1 - inventory and factory foundation

- Implement descriptor/request schemas, inventory artifacts, deduplication,
  common smoke harness, and the four proposed skills in a separate approved
  task or explicitly split task-specs.
- Commit the C3 public-URL conformance fixture and executable normalizer before
  enabling the normalized-URL collision blocker or passing the Phase 1 gate.
- Run a full read-only inventory and classify every trainer/reference into a
  known archetype, publication state, duplicate disposition, or owner-review
  queue.

### Phase 2 - `CATALOG_ONLY` pilot

- Reconcile and re-approve the exact existing 3-5 trainer cohort after
  inventory; do not classify its pre-existing URLs or references as new
  publication.
- Apply only an owner-approved delta relative to the recorded baseline, gather
  visual/pedagogical evidence, and prove per-trainer reverse deltas preserve all
  pre-Factory references.

### Phase 3 - `MIRROR_STANDARD` factory proof

- Select a separately approved trainer that fits the existing mirror model.
- Create and owner-accept the C5 versioned, machine-checkable template contract;
  exercise its contract/schema/fixture templates and prove no core diff.
- Do not reuse this plan as `START` for that trainer.

### Phase 4 - controlled batch scale-up

- Release homogeneous batches within the caps above.
- Track failure rate, manual-review effort, URL/storage collisions, rollback
  events, and time per trainer; lower caps when evidence warrants it.

### Phase 5 - archetype governance

- Keep unknown/core-requiring trainers out of standard batches.
- Create a separate `NEW_ARCHETYPE` task and accepted architecture only when a
  concrete product need justifies it.

## Factory v1 acceptance criteria

- [ ] Every trainer begins with one validated request and descriptor.
- [ ] Existing pilot trainers reconcile `FILE_PUBLISHED`, discovery surfaces,
  URLs, and pre-existing reference blob/selectors from factual baseline; no
  Factory rollback removes a baseline reference.
- [ ] Inventory covers files, assets, site discovery, sitemap, course/manual
  links, board discovery/runtime registry, public URLs, storage, dependencies,
  provenance, and duplicates.
- [ ] Every existing trainer is assigned a known archetype/publication state or
  an explicit owner-review queue; unknown is never treated as passed.
- [ ] Track selection and escalation are deterministic and auditable.
- [ ] Descriptor runtime cross-checks cannot add unsupported fields, authorize
  mirror, create a second authority, or change an endpoint contract; every
  repeated field exactly matches the current manifest or fails closed.
- [ ] File, trainerId, ASCII-casefold path, normalized URL, and exact-blob
  collisions are blocked or have an explicit approved disposition.
- [ ] Normalized-URL blocking remains disabled until the C3 fixture and
  executable deterministic normalizer are committed and passing.
- [ ] Basename is never used for identity or authorization.
- [ ] Mobile, iframe, HTTP, site-discovery/manual URL, board-discovery, console,
  pageerror, security, visual, and pedagogical gates are captured per trainer.
- [ ] `MIRROR_STANDARD` proves schema/fixture parity, lifecycle behavior,
  localStorage/statistics isolation, no basename fallback, and no core diff.
- [ ] No-Claude mechanical mirror classification passes the exact accepted C5
  template version, file/substitution allowlists, immutable fingerprints,
  zero-core proof, complete standard gate, and exact-head C4 equality.
- [ ] Any required platform change produces a hard Factory stop and separate
  `HIGH` platform task; `PLATFORM_CHANGE` is never treated as a Factory track.
- [ ] Batch reports are independently pass/fail per trainer and atomically
  rollback-capable, including a one-trainer rollback that preserves the rest of
  the batch.
- [ ] Every shared discovery edit has an executable per-trainer reverse delta;
  removing each trainer in turn preserves the other entries and all baseline
  references.
- [ ] `TRAINER_FACTORY_BATCH_RELEASE_GATE_OK` reruns descriptor-manifest
  equality on the exact release head and records all input identities/hashes.
- [ ] Review level and external-review provenance follow
  [REVIEW_POLICY.md](../REVIEW_POLICY.md).
- [ ] No factory action merges, auto-merges, deploys, disables protection, or
  stores credentials without separate authority.

## Risk register

| Risk | Detection and mitigation | Rollback/decision |
| --- | --- | --- |
| Wrong track or archetype | Evidence-based classifier; unknown blocks; owner approves cohort | Remove from batch; open separate higher-track task |
| Duplicate file, blob, trainerId, or URL | Repository-wide hashes, canonical URL graph, exact and casefold collision checks | Preserve canonical item; do not publish ambiguous alias |
| Site discovery and board registry drift | Generated site/sitemap/course/registry cross-reference report and link/runtime tests | Revert the exact affected discovery-surface delta |
| Existing public URL changes | Snapshot URLs and inbound references before diff; parent-to-head URL comparison | Restore exact prior path/blob; never reuse URL |
| Factory rollback removes a pre-existing reference | Baseline blobs/selectors plus simulated per-trainer reversal | Block batch; restore byte-identical baseline reference |
| URL normalizer creates alias authority | C3 raw-path rejection, shared fixture, and inventory-only scope | Disable collision blocker until deterministic fixture passes |
| localStorage/statistics collision | Key inventory plus unrelated-key byte sentinels in standalone/iframe/mirror flows | Block trainer; redesign namespace in separately approved scope |
| Mirror leaks private/transient state | Closed schema, semantic validator, side-effect probes, lifecycle matrix | Revert adapter/manifest; preserve standalone URL |
| Mobile or iframe regression | Fixed viewport matrix and actual board iframe smoke | Remove from batch or revert publication delta |
| Pedagogical defect at batch scale | Subject review, representative seeded/boundary cases, per-trainer acceptance | Stop batch; correct in a separate scoped task |
| Unapproved dependency or unsafe code | Origin/dependency closure, secrets/local-path/control/bidi/navigation scans | Block publication and remove new dependency delta |
| Batch blast radius | Homogeneous caps, independent per-trainer gates, exact shared-file attribution | Apply the reviewed per-trainer rollback or revert the complete batch |
| Core creep in Factory work | Platform-core changed-file denylist and diff gate | Hard stop; create a separate `HIGH` platform task |
| Descriptor or manifest changes after authoring gate | C4 exact-release-head hashes and server-equivalent equality | Invalidate old gate and rerun on the new exact head |
| Mechanical template drift | C5 substitution allowlist and immutable-region fingerprints | Forbid mechanical classification and escalate |
| Stale or fabricated review evidence | Exact PR/base/head provenance verification | Invalidate verdict; require new independent review |

## Rollback policy

1. Every batch records the exact parent, file/URL/manifest delta, asset hashes,
   and pre-release production evidence.
2. Rollback uses a normal reviewed revert or approved release mechanism, never
   force, reset, rebase, admin override, or untracked manual deletion.
3. Existing public URLs and standalone behavior are restored first. A shipped
   URL is not reassigned to different content.
4. Metadata, adapter, schema, fixture, and manifest changes are reverted as a
   coherent track unit.
5. Every batch stores a per-trainer reverse delta, including attributable edits
   to shared discovery files, so one trainer can be rolled back by a normal
   reviewed PR while other accepted batch members remain unchanged. The reverse
   delta excludes all pre-Factory baseline blocks and must reproduce their
   recorded blob/selector identity byte-for-byte.
6. Storage migration is prohibited in Factory v1 without a separate approved
   plan. Rollback must not erase learner statistics.
7. Plan-stage rollback is a simple revert of this docs-only task-spec if it is
   later committed and published.

## Plan-stage checks and gate

Required checks before external architecture review:

- Markdown heading and fenced-block structure.
- All repository-relative links resolve.
- Secret, credential, private-data, absolute-local-path, control, and bidi
  scans.
- No contradictory track/core/review/permission rules.
- `git diff --check`.
- Diff contains only this task specification and the required operational
  status reconciliation.
- Production code, trainer files, manifests, package files, and deployment
  configuration are unchanged.

No production, npm, browser, HTTP, visual, or deployment test is required for
this docs-only plan because no runtime file changes. Those checks are normative
future gates and must not be reported as run on this stage.

The exact-head plan scan is clean for prohibited control, bidi, and invisible
characters. U+2192 is a visible permitted symbol used in the documentation
flow block. A future documentation scanner may allowlist only U+2192 in that
flow-block context; zero tolerance remains for every other prohibited control,
bidi, or invisible character.

The architecture marker is:

`TRAINER_FACTORY_V1_ARCHITECTURE_GATE_OK`

It remains `PENDING_EXACT_HEAD_CONDITION_CLOSURE_REVIEW`. It may be reported
only after an exact-head independent review confirms closure of C1-C5 and the
plan-stage checks pass on that same head.

## External review provenance

- Provider: Claude.
- PR: `#90`.
- Reviewed base: `495d9f8303de1ec90c15b8f38bf014599bfa463d`.
- Reviewed head: `aadf0d2e6ba014e9bdbfcd4f2ed625c3fd23b28a`.
- Reviewed tree: `8c6726f0bce9e036a52e18553eb51e7e12fa0150`.
- Verdict: `APPROVED_WITH_CONDITIONS`.
- Blocking issues: none.
- Conditions: C1-C5.
- Evidence timestamp: `2026-07-16T23:33:01.1888063Z`, the timestamp of the
  owner-supplied review artifact; no separate provider timestamp was present.
- Source: owner-supplied exact-head Claude review text, SHA-256
  `8A216B04C4B205D90D25099D84BEE3D2845E52EC03E6D261BD1733EBD21A0219`.

This provenance validates the old reviewed head only. The condition-closure
commit creates a new head and requires a new exact-head review before the
architecture gate can pass.

## Condition closure table

### C1

- Decision: treat the four pilot trainers as reconciliation of an existing
  published cohort; compute Factory deltas and rollback only against verified
  pre-Factory references.
- Spec sections: `Publication surfaces`, `C1 verified pilot baseline`,
  `Per-trainer pilot acceptance`, and `Rollback policy`.
- Evidence: all four files exist; each has one exact sitemap URL and one
  OGE-course entry; no other tracked discovery reference or `board-compat`
  entry was found; containing and trainer blob identities are recorded.
- Acceptance tests: simulated per-trainer reversal leaves pre-existing sitemap
  and OGE-course blocks byte-identical for all four trainers.
- Closed: yes.

### C2

- Decision: require a contiguous, order-stable, attributed trainer block and an
  executable reverse delta for every shared discovery edit.
- Spec sections: `C2 executable per-trainer reverse delta`, `Batch publication
  policy`, `Aggregate pilot acceptance`, and `Rollback policy`.
- Evidence: authoring proof records forward/reverse deltas, input hashes, stable
  selectors, and deterministic aggregate handling.
- Acceptance tests: build the `N`-trainer tree, reverse each trainer in turn,
  preserve `N-1`, rerun HTML/link/render/collision checks, validate shared
  files, and preserve baseline references.
- Closed: yes.

### C3

- Decision: URL normalization is deterministic inventory/collision evidence
  only and never runtime or alias authority.
- Normalization contract: WHATWG URL relative to explicit
  `https://mathexam.space`, raw-path fail-closed preflight, exact nested-path
  validation, credentials/origin/port restrictions, identity-neutral query and
  fragment, case-preserving path, explicit `/index.html` equivalence, and no
  decode/repair.
- Fixture contract: future closed
  `tools/fixtures/trainer-public-url-conformance.json` with version, origin,
  stable vector IDs, four outcomes, canonical results, reasons, and all required
  vector families.
- Acceptance tests: the executable normalizer consumes every vector and the
  Phase 1 normalized-URL blocker remains disabled until fixture parity passes.
- Closed: yes.

### C4

- Decision: descriptor-manifest equality is rerun on the exact release head;
  an authoring-head result never carries forward.
- Exact-head check: load descriptors and `board-compat.json` from one tree,
  build the server-equivalent cross-check, verify absence/presence and every
  repeated field, fail closed, and record base/head/tree plus input hashes.
- Evidence: a descriptor or manifest change invalidates prior equality evidence.
- Acceptance tests: a descriptor that passed on an older head blocks release
  after the manifest changes.
- Closed: yes.

### C5

- Decision: no-Claude mechanical `MIRROR_STANDARD` requires an owner-accepted,
  versioned, machine-checkable template contract.
- Template contract: ID/version/archetype, file allow/deny lists, structured
  substitution points, immutable fingerprints, allowed manifest/descriptor/
  schema fields, required vectors/lifecycle gates, and owner provenance.
- Mechanical proof: exact template version, allowlisted files and substitution
  points, matching immutable fingerprints, zero-core proof, full standard gate,
  C4 exact-head equality, and no new semantic/lifecycle primitive.
- Escalation: out-of-template trainer-local changes go to `NEW_ARCHETYPE`;
  platform contract changes exit to a separate `PLATFORM_CHANGE` task.
- Acceptance tests: one line outside an allowed substitution point rejects
  mechanical classification and blocks the mirror gate.
- Closed: yes.

## External architecture review questions

1. Are the four track boundaries deterministic, and do the four independent
   publication surfaces prevent site discovery, board discovery, and mirror
   authority from being conflated?
2. Does the descriptor remain non-authoritative for mirror, with
   `board-compat.json` as runtime source data, the validated server projection
   as runtime authority, and fail-closed equality for repeated fields?
3. Are the storage/statistics and standard mirror side-effect rules sufficient
   to prevent cross-trainer and teacher/student leakage?
4. Do inventory and deduplication distinguish physical duplicates, intentional
   aliases, existing public URLs, nested paths, and non-unique basenames safely?
5. Are pilot and steady-state batch caps conservative enough, and is a failed
   trainer prevented from becoming a partial release?
6. Does every platform-core/protocol/security/deployment change leave Factory
   for a separate `HIGH` platform task rather than becoming a Factory track or
   being hidden in `NEW_ARCHETYPE`?
7. Are the state-contract, JSON Schema, and shared conformance-fixture templates
   sufficient to reproduce server/browser validation and the full standard
   mirror lifecycle?
8. Is the four-trainer `CATALOG_ONLY` pilot coherent with site discovery on,
   board discovery and mirror off, independent trainer gates, and independently
   applicable per-trainer rollback?

## Review plan

- Rationale: the plan governs broad future publication, persistence,
  authorization, batching, and mirror behavior, so it is `HIGH` even though the
  current diff is docs-only.
- External review required: yes, exact-head independent architecture review.
- Handoff: only this task-spec, exact base/head/diff identity, sanitized current
  contract summaries, inventory counts, and review questions.
- Exclude credentials, private documents, personal data, machine-specific
  paths, and unrelated source.
- Required provenance: provider, PR, base SHA, head SHA, verdict, and verifiable
  source or timestamp.

## Permissions

- Plan preparation authorized: yes.
- Production implementation `START`: no.
- Pilot publication or trainer adaptation authorized: no.
- Plan branch created locally: yes.
- One docs-only plan commit, push, and Draft PR authorized: yes.
- Merge, auto-merge, and deployment: no.
- Factory skill implementation: no.

## Execution record

- Actual branch: `codex/trainer-factory-v1-plan`.
- Actual base SHA: `495d9f8303de1ec90c15b8f38bf014599bfa463d`.
- Actual head SHA: recorded in the publication report and Draft PR body because
  a commit cannot contain its own SHA.
- PR: Draft PR `#90`; exact remote head is authoritative in GitHub.
- Production files changed: none.
- Architecture gate: `PENDING_EXACT_HEAD_CONDITION_CLOSURE_REVIEW`.
- Scope deviations: none.

# Nested-path foundation

## Identity

- Task: Nested-path foundation
- Owner: MathExam
- Date: 2026-07-14
- Base branch: `main`
- Base SHA: `1e5cb7beb38b59745bb9fe9cf5cb30d36f81fd6f`
- Planned branch: `codex/nested-path-foundation`
- Review level: `HIGH`
- Related ADR: `docs/adr/0001-trainer-bridge-platform.md`
- ADR status: `Proposed`; it is advisory. This task's approved scope, code,
  tests, gates, and production evidence take precedence.

## Goal

Allow future trainer series to be registered from nested directories beneath
`trainers/` without moving files or changing any existing public top-level
trainer URL. The path boundary must remain fail-closed and must authorize a
trainer by its unique `trainerId` and complete canonical file path, not by a
globally unique basename.

## Context and evidence

### Verified facts at the canonical base

- `board-server/trainer-registry.js` currently limits `file` to one HTML file
  directly below `trainers/` with `TRAINER_FILE_PATTERN`.
- Server manifest validation already enforces unique `trainerId` and exact
  `file` strings. It does not maintain a separate basename uniqueness index.
- The server URL resolver parses a URL and then applies the top-level-only file
  validator. It does not preserve all raw path evidence before WHATWG URL
  normalization.
- `board-server/index.js` authorizes trainer state by resolving `trainerUrl` to
  a registry entry and comparing its `trainerId`. Its current URL normalizer
  trims and silently truncates input to 1000 characters.
- `trainers/trainer-board.html` already accepts safe nested `trainers/...`
  paths, rejects percent signs before URL parsing, and has explicit guards for
  controls, bidi controls, backslashes, and ambiguous Unicode separators.
  Server and browser rules are therefore not yet one contract.
- `tools/trainer-registry-client-cutover-smoke.cjs` already contains one
  positive nested-path canonicalization case and a same-basename/full-path
  authorization regression, but the server cannot yet load a nested manifest
  entry.
- `trainers/board-compat.json` contains only existing top-level entries. Its
  schema already represents `file` as a string and the registry digest already
  includes the complete file string.
- The implemented B1/B2 behavior is evidenced by the current code and tests.
  ADR 0001 remains `Proposed` and is not evidence that any decision is
  accepted or implemented.

### Proposed canonical file contract for architecture review

A registry `file` is canonical only when all of the following hold:

1. It is an exact, non-empty ASCII string; validation does not trim, decode,
   normalize Unicode, replace separators, or repair input.
2. It is relative and starts exactly with `trainers/`.
3. It has 1 to 32 components after `trainers`; the last component is the file.
4. Every component is at most 128 characters and matches
   `[A-Za-z0-9][A-Za-z0-9._-]*`.
5. The full canonical string is at most 1024 characters.
6. The final component ends with lowercase `.html`.
7. Empty components, trailing separators, `.` and `..` components, POSIX or
   Windows absolute paths, drive or UNC paths, URI schemes, backslashes,
   percent signs, query or fragment markers, controls, bidi controls, and
   non-ASCII separator lookalikes are rejected.

The numeric budgets are security and operability bounds, not a fixed directory
layout. The external architecture review must confirm or replace the proposed
32-component, 128-character component, and 1024-character total limits before
implementation starts.

### Proposed URL-resolution contract for architecture review

- Registry identity is always the complete canonical `trainers/...` path.
- Existing top-level forms remain valid: a bare existing basename,
  `trainers/<file>.html`, `/trainers/<file>.html`, and a same-origin absolute
  HTTP(S) URL. Query and fragment text do not participate in identity.
- A nested trainer must use an explicit `trainers/...`, `/trainers/...`, or
  same-origin absolute HTTP(S) form. A relative nested form such as
  `series/file.html` is rejected rather than resolved differently by browser
  and server base URLs.
- Same-origin absolute HTTP(S) URLs are URLs, not absolute registry file paths;
  they remain accepted for B1/B2 compatibility. Absolute filesystem-style
  values in a registry `file` remain forbidden.
- Cross-origin, protocol-relative, non-HTTP(S), drive, and UNC inputs are
  rejected.
- Raw path text is checked before URL parsing, and the parsed pathname is
  checked again. Any percent sign in the raw path is rejected, including
  encoded separators, encoded dot-segments, mixed case, double encoding, and
  malformed escapes. No decode-and-revalidate repair path is allowed.
- Server and browser canonicalizers use the same named limits and the same
  conformance vectors. Because deployment topology is out of scope and the
  browser code is currently inline, this task does not require a new shared
  runtime asset; parity is enforced by shared test data and equivalent pure
  canonicalization behavior.

## Approved scope

### In scope

- Accept bounded, canonical POSIX paths at arbitrary nested depth beneath
  `trainers/` in server registry validation and related server/browser URL
  resolvers.
- Keep `trainerId` unique and make the complete canonical file path unique.
- Allow identical basenames in different canonical directories.
- Preserve every existing top-level trainer URL and current registry endpoint
  payload shape.
- Reject absolute file paths, dot-segments, traversal, backslashes, encoded
  separators, encoded dot-segments, controls, bidi controls, and ambiguous
  Unicode separators before they can be normalized into an allowed value.
- Replace silent overlength URL truncation on the authorization path with an
  explicit fail-closed length decision consistent with the canonicalizer.
- Add server, integration, and browser security/regression coverage, including
  client/server parity vectors and all B1/B2 regression gates.

### Out of scope

- A roads-grid adapter or a third mirror trainer.
- Changes to mathematical trainer behavior or bulk file migration.
- Trainer Factory or inventory/publication work.
- A new Socket.IO protocol or any registry endpoint contract/schema change.
- Deployment topology, manual deployment, or a new runtime shared asset that
  would require topology changes.
- Adding a production nested manifest entry as proof; synthetic test manifests
  provide the foundation proof in this task.

### Files or areas that must not change

- Existing mathematical trainer HTML/JavaScript and their public locations.
- `trainers/board-compat.json` production entries, unless the owner separately
  expands scope after architecture review.
- Socket.IO event names, room-state contract, and trainer-state schema.
- Docker, hosting, reverse-proxy, and deployment configuration.

### Expected implementation areas after a separate START

- `board-server/trainer-registry.js`
- `board-server/index.js`, only where trainer URL normalization/authorization
  must share the canonical contract
- `trainers/trainer-board.html`, only its registry/path resolver boundary
- `board-server/test/trainer-registry.test.js`
- `board-server/test/server-registry.integration.test.js`
- `tools/trainer-registry-client-cutover-smoke.cjs`
- One repository-relative conformance-vector fixture if needed

## Acceptance criteria

### Canonical path and uniqueness

- [ ] A synthetic registry accepts top-level and nested canonical paths at the
  agreed depth and length boundaries.
- [ ] `trainerId` remains globally unique.
- [ ] Complete canonical `file` remains globally unique.
- [ ] Two entries with the same basename in different directories are accepted
  when their `trainerId` and full `file` differ.
- [ ] An exact duplicate full path is rejected even when `trainerId` differs.
- [ ] No lookup, authorization, diagnostic, or runtime map falls back to
  basename matching.

### Security matrix

- [ ] Table-driven vectors cover empty input, wrong type, leading/trailing
  whitespace in a manifest file, missing/wrong root, empty components, double
  slash, trailing slash, exact `.`/`..` components, traversal at every depth,
  and boundary values for path length, segment length, and segment count.
- [ ] POSIX absolute paths, Windows drive paths, UNC paths, backslashes, URI
  schemes, protocol-relative URLs, cross-origin URLs, and non-HTTP(S) schemes
  fail closed.
- [ ] Raw path vectors cover `%2f`, `%2F`, `%5c`, `%5C`, encoded and
  mixed-encoded dot-segments, double encoding, stray `%`, malformed escapes,
  and URL-parser normalization cases. All are rejected before an unsafe value
  can normalize to an allowed path.
- [ ] C0, DEL, C1, bidi embedding/override/isolate controls, and the ambiguous
  separators U+2044, U+2215, U+29F8, U+FF0F, and U+FF3C fail closed in registry
  files and URL path inputs.
- [ ] Non-ASCII and normalization-confusable components fail the ASCII
  component allowlist; no Unicode normalization is used to admit them.
- [ ] Server unit/integration and browser vectors return identical canonical
  results for every shared case.

### Compatibility and contracts

- [ ] All existing top-level bare, root-relative, canonical relative, and
  same-origin absolute trainer URL forms resolve to the same existing full
  canonical paths as at the base SHA.
- [ ] Nested URLs authorize by full canonical path, and a same-basename path in
  another directory does not authorize the registered trainer.
- [ ] Query and fragment text do not alter file identity, while unsafe raw path
  text remains rejected.
- [ ] `/api/trainer-registry` keeps its current schema version, fields, response
  semantics, digest algorithm, caching behavior, and fail-closed startup.
- [ ] With the unchanged production manifest, the endpoint payload/digest and
  all current public trainer URLs remain unchanged.
- [ ] Existing B1/B2 registry arrival, reconnect, fail-closed, teacher/student,
  late-join, reload, grant/revoke, statistics, loop, and legacy compatibility
  behavior passes without a new protocol or trainer-specific allowlist.
- [ ] The diff contains no roads-grid work, third trainer, trainer migration,
  deployment change, secrets, credentials, or absolute local paths.

## Checks and gates

- Required tests:
  - `npm test` from `board-server/`.
  - `node --test board-server/test/trainer-registry.test.js` while iterating on
    the path matrix.
  - `node tools/trainer-registry-client-cutover-smoke.cjs` for full B2 browser
    regression and canonical-path parity.
- Required static checks:
  - `git diff --check`.
  - Review `git diff --name-only` against the approved implementation areas.
  - Search the diff for secrets, credentials, absolute local paths, and
    conflicting path rules.
  - Verify task-spec Markdown structure and repository-relative links.
- Manual checks:
  - Confirm the full-path collision model with two synthetic nested entries
    sharing one basename.
  - Confirm the production manifest, endpoint schema, mathematical trainers,
    Socket.IO protocol, and deployment configuration are unchanged.
  - Confirm external-review provenance is tied to the exact implementation PR
    head before merge authorization is requested.
- Final gate marker:
  `TRAINER_REGISTRY_NESTED_PATH_ARCHITECTURE_GATE_OK`.
- Gate rule: do not report the marker until all acceptance criteria and required
  checks pass at the exact implementation head, the `HIGH` external review has
  a non-blocking verdict with required provenance, and the owner has resolved
  every scope or architecture decision. The current plan step does not pass the
  gate.
- Checks intentionally not run at plan creation: the new implementation matrix
  and browser gate, because production code has not been changed and
  architecture review has not occurred. The complete baseline `npm test` could
  not load the integration suite because the local dev dependency
  `socket.io-client` is absent; dependencies were not installed during PLAN.

## Review plan

- Review-level rationale: `HIGH` because path parsing is an authorization and
  traversal boundary shared by manifest startup, server room state, and an
  iframe client.
- External review required: yes. First perform a sanitized pre-implementation
  architecture review; later perform or refresh review against the exact
  implementation PR head.
- Sanitized handoff constraints: include only repository-relative file names,
  public contract facts, proposed limits, test vectors, scope, and rollback.
  Exclude credentials, tokens, private documents, environment details, and
  absolute local paths.
- Required provenance for the implementation review: provider, PR, base SHA,
  head SHA, verdict, and a verifiable source or timestamp.
- A pre-PR packet review is advisory and does not substitute for exact-head PR
  review provenance. An approval marker copied into this task specification,
  chat context, or a PR body is not evidence of external review.

### Open architecture review questions

1. What concrete limits should apply to segment count, component length, and
   total canonical path length, and how are those limits justified for a
   Windows checkout as well as runtime URL handling?
2. Should full canonical paths also be unique under ASCII case-insensitive
   comparison to prevent collisions on case-insensitive filesystems?
3. Must every component reject Windows reserved device names and trailing-dot
   forms even though the canonical grammar otherwise permits dots?
4. How must the resolver isolate the raw pathname from query and fragment text
   before applying the percent-encoding rejection policy?
5. What repository-relative location and schema should be used for one
   committed conformance-vector fixture consumed by both server and browser
   tests?
6. Must the complete integration baseline be restored and pass before the
   owner can grant implementation `START`?

## Risk and rollback

- Main risks:
  - browser/server parser drift authorizes different files;
  - WHATWG URL normalization hides dot-segments before validation;
  - basename fallback authorizes the wrong trainer after a collision;
  - length or Unicode handling creates inconsistent fail-open behavior;
  - tightening URL inputs accidentally breaks a current top-level public form;
  - a client/server rollout skew affects registry authorization.
- Rollback plan:
  - Revert the nested-path foundation implementation as one logical change,
    restoring the top-level-only validator and previous URL resolvers.
  - Do not migrate or move existing trainer files, so rollback has no file or
    data migration step and all current top-level URLs remain available.
  - This task adds no production nested manifest entry. Therefore rollback does
    not strand an approved trainer path; any later nested entry belongs to its
    own task and must be removed before rolling back the foundation.
  - Re-run server tests and the complete B2 browser regression after rollback.
- Data or compatibility considerations: registry schema and digest algorithm do
  not change. Existing room links and stored top-level `trainerUrl` values must
  continue to resolve exactly as before.

## Permissions

- Implementation `START` granted by owner in the current task conversation:
  no; this publication remains explicitly plan-only.
- Plan publication authorized by owner in the current task conversation: yes.
- Branch creation allowed: yes, for the one task branch.
- Local commits allowed: one plan-only commit containing this task-spec.
- Push allowed: yes, for the plan-only commit.
- Draft PR allowed: yes, for the single task PR. Production implementation may
  be added to the same branch and Draft PR only after separate owner `START`.
- Merge allowed: **no unless separately authorized after review**.
- Auto-merge allowed: **no unless separately authorized**.
- Deployment allowed: **no unless separately authorized**.

## Execution record

- Actual branch: `codex/nested-path-foundation`
- Actual base SHA: `1e5cb7beb38b59745bb9fe9cf5cb30d36f81fd6f`
- Actual plan head SHA: recorded in the Draft PR body and plan handoff after
  the single plan commit is created
- PR: one plan-stage Draft PR to be created
- Commits: one plan-only commit authorized
- Tests passed: 20/20 baseline tests in
  `board-server/test/trainer-registry.test.js`
- Tests failed: no registry unit failures; the aggregate `npm test` command
  exited before integration execution because local `socket.io-client` is
  absent
- Tests not run: server integration, browser regression, and the not-yet-written
  nested-path matrix
- Scope deviations: none

## Sanitized architecture review packet

Use the `SANITIZED_ARCHITECTURE_REVIEW_PACKET` from the plan handoff. It is a
pre-implementation review input, contains no external-review verdict, and must
not be treated as approval evidence when copied elsewhere.

## Required handoff

```text
EXECUTIVE STATUS

Task:
PR:
Base:
Head:
Gate:
Tests:
Failures:
Not run:
Scope deviations:
Recommendation:
Next user decision:
```

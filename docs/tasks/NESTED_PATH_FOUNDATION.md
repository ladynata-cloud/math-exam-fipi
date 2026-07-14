# Nested-path foundation

## Identity

- Task: Nested-path foundation
- Owner: MathExam
- Date: 2026-07-14
- Condition-closure update: 2026-07-15
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

### Authoritative canonical file contract after local arbitration

A registry `file` is canonical only when all of the following hold:

1. It is an exact, non-empty ASCII string; validation does not trim, decode,
   normalize Unicode, replace separators, or repair input.
2. It is relative and starts exactly with `trainers/`.
3. It has 1 to 8 components after `trainers`; the last component is the file.
4. Every component is at most 64 characters and matches
   `[A-Za-z0-9][A-Za-z0-9._-]*`.
5. The full canonical string is at most 96 characters.
6. The final component ends with lowercase `.html`.
7. Empty components, trailing separators, `.` and `..` components, POSIX or
   Windows absolute paths, drive or UNC paths, URI schemes, backslashes,
   percent signs, query or fragment markers, controls, bidi controls, and
   non-ASCII separator lookalikes are rejected.
8. A component is rejected when its ASCII-case-insensitive stem before the
   first dot is `CON`, `PRN`, `AUX`, `NUL`, `COM1` through `COM9`, or `LPT1`
   through `LPT9`.
9. Any component ending in a dot is rejected.

The named constants are authoritative and are applied independently:

```text
maxComponents = 8
maxComponentLength = 64
maxTotalLength = 96
maxUrlLength = 2048
```

`maxTotalLength` is the dominant path budget: satisfying component count and
component length never permits a canonical path longer than 96 characters.
Canonical component and total lengths count ASCII characters, which are also
UTF-8 bytes under this grammar. URL length uses JavaScript string length
(UTF-16 code units) identically in Node and the browser. These are application
limits, not values inferred from the host filesystem.

### C1 path-budget evidence and rationale

- The current project root and current task worktree are each 128 characters
  long. Existing worktree roots inspected locally range from 111 to 128
  characters.
- Legacy Win32 `MAX_PATH` is 260 characters including the terminating null, so
  after the separator the current root leaves 130 visible characters for a
  repository-relative path.
- Windows `LongPathsEnabled` is `1`, but Git for Windows 2.52.0 has
  `core.longpaths` unset at local, global, and system scope. The design must not
  depend on long-path opt-in.
- A 96-character canonical path produces a 225-character absolute checkout
  path at the current root, leaving 34 visible characters before the legacy
  259-character ceiling. Reserving 24 characters for a longer temporary
  worktree root or fixture/staging prefix still leaves 10 characters.
- The longest currently tracked trainer path is 83 characters, leaving 13
  characters of canonical-path headroom without moving existing files.
- GitHub recommends directory depth at most 50 and directory width at most
  3,000. Eight components and a future inventory of roughly 100 series are
  comfortably below those independent repository-shape recommendations.
- GitHub Pages publishes size/build limits but no smaller pathname limit. The
  Amvera deployment is a Docker/Linux runtime; its actual filesystem limits
  remain runtime evidence to query with `pathconf`, not the authoritative
  application boundary. The 64/96 limits are deliberately much stricter than
  those platform-level budgets.

Evidence references:

- [Microsoft Win32 maximum path length](https://learn.microsoft.com/en-us/windows/win32/fileio/maximum-file-path-limitation)
- [GitHub repository limits](https://docs.github.com/en/repositories/creating-and-managing-repositories/repository-limits)
- [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
- [Amvera Docker runtime](https://docs.amvera.ru/applications/configuration/docker.html)
- [Linux `pathconf`](https://man7.org/linux/man-pages/man3/pathconf.3.html)

Claude proposed `8 / 64 / 180 / 2048`. Local checkout evidence rejects 180 as
unsafe without relying on tool-specific long-path behavior.

`ARCHITECTURE_RE_REVIEW_REQUIRED: YES`

The committed conformance fixture must contain literal N-1/N/N+1 inputs:

- component count: `limit-components-7-accept`,
  `limit-components-8-accept`, `limit-components-9-reject`;
- component length: `limit-component-63-accept`,
  `limit-component-64-accept`, `limit-component-65-reject`;
- total canonical length: `limit-total-95-accept`,
  `limit-total-96-accept`, `limit-total-97-reject`;
- complete URL length: `limit-url-2047-accept`,
  `limit-url-2048-accept`, `limit-url-2049-reject`.

Every accepted boundary vector must also satisfy all other limits. URL-length
vectors use a valid canonical pathname and query padding so the raw pathname
contract is tested independently.

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
- Input longer than `maxUrlLength = 2048` is rejected without truncation.
- One pre-parse contract is used by server and browser: accepted
  scheme/authority syntax is isolated first; raw pathname ends at the first
  `?` or `#`; percent rejection applies only to that raw pathname; query and
  fragment do not participate in identity; and the complete segment validator
  runs again on `URL.pathname` after WHATWG parsing.
- Any percent sign in the raw pathname is rejected, including encoded
  separators, encoded dot-segments, mixed case, double encoding, malformed
  escapes, and parser-normalization inputs. Percent encoding in query or
  fragment is ignored for file identity.
- Both delimiter orders, `?...#...` and `#...?...`, follow the first-delimiter
  rule. Empty query and fragment suffixes are allowed and identity-neutral.
- No decode-and-revalidate repair path is allowed.
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
- Reject complete canonical file paths that collide under ASCII-only
  case-folding with `REGISTRY_DUPLICATE_FILE_CASEFOLD`. Exact authorization
  lookup remains case-sensitive.
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
- `tools/fixtures/trainer-path-conformance.json`

## Acceptance criteria

### Canonical path and uniqueness

- [ ] A synthetic registry accepts top-level and nested canonical paths at the
  agreed depth and length boundaries.
- [ ] `trainerId` remains globally unique.
- [ ] Complete canonical `file` remains globally unique.
- [ ] A manifest containing ASCII case-twin full paths is rejected with
  `REGISTRY_DUPLICATE_FILE_CASEFOLD`, while an authorization URL with the wrong
  case does not resolve.
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
  Vectors: `input-empty-reject`, `input-type-reject`,
  `manifest-whitespace-reject`, `root-wrong-reject`,
  `segment-empty-reject`, `path-double-slash-reject`,
  `path-trailing-slash-reject`, `segment-dot-reject`,
  `segment-dotdot-reject`, and all `limit-*` vectors listed in C1.
- [ ] POSIX absolute paths, Windows drive paths, UNC paths, backslashes, URI
  schemes, protocol-relative URLs, cross-origin URLs, and non-HTTP(S) schemes
  fail closed. Vectors: `path-posix-absolute-reject`,
  `path-drive-reject`, `path-unc-reject`, `path-backslash-reject`,
  `url-protocol-relative-reject`, `url-cross-origin-reject`, and
  `url-scheme-reject`.
- [ ] Raw path vectors cover `%2f`, `%2F`, `%5c`, `%5C`, encoded and
  mixed-encoded dot-segments, double encoding, stray `%`, malformed escapes,
  and URL-parser normalization cases. All are rejected before an unsafe value
  can normalize to an allowed path. Vectors:
  `pathname-percent-separator-lower-reject`,
  `pathname-percent-separator-upper-reject`,
  `pathname-percent-dotsegment-reject`, `pathname-percent-double-reject`,
  `pathname-percent-stray-reject`, and `pathname-percent-malformed-reject`.
- [ ] C0, DEL, C1, bidi embedding/override/isolate controls, and the ambiguous
  separators U+2044, U+2215, U+29F8, U+FF0F, and U+FF3C fail closed in registry
  files and URL path inputs. Vectors: `control-c0-reject`,
  `control-del-reject`, `control-c1-reject`, `control-bidi-reject`, and
  `separator-unicode-lookalike-reject`.
- [ ] Non-ASCII and normalization-confusable components fail the ASCII
  component allowlist; no Unicode normalization is used to admit them.
  Vectors: `component-nonascii-reject` and
  `component-normalization-confusable-reject`.
- [ ] ASCII case-insensitive full-path collisions fail closed while exact URL
  authorization remains case-sensitive. Vectors:
  `manifest-file-casefold-twin-reject` and `url-case-mismatch-reject`.
- [ ] A component whose case-insensitive stem before the first dot is a Windows
  reserved device name is rejected, and every trailing-dot component is
  rejected. Vectors: `device-con-file-reject`, `device-aux-dir-reject`,
  `device-com1-extension-reject`, `device-lpt9-reject`,
  `device-console-accept`, `device-com0-accept`, `device-com10-accept`,
  `component-trailing-dot-reject`, and `component-internal-dot-accept`.
- [ ] Percent encoding in query or fragment is identity-neutral, while percent
  encoding in raw pathname remains rejected. Vectors:
  `url-query-percent-accept`, `url-fragment-percent-accept`,
  `url-query-before-fragment-accept`,
  `url-fragment-before-question-accept`, `url-empty-query-accept`,
  `url-empty-fragment-accept`, and the `pathname-percent-*` reject vectors.
- [ ] Server unit/integration and browser vectors return identical canonical
  results for every shared case. Vectors: every entry in
  `tools/fixtures/trainer-path-conformance.json`; fixture validation itself is
  covered by `fixture-missing-fail`, `fixture-malformed-fail`, and
  `fixture-limits-mismatch-fail`.

### Committed conformance fixture contract

Implementation must add exactly one shared fixture at
`tools/fixtures/trainer-path-conformance.json` with this schema:

```json
{
  "schemaVersion": 1,
  "limits": {
    "maxComponents": 8,
    "maxComponentLength": 64,
    "maxTotalLength": 96,
    "maxUrlLength": 2048
  },
  "vectors": [
    {
      "id": "unique-stable-id",
      "kind": "registry-file | trainer-url | manifest",
      "input": "JSON value appropriate to kind",
      "expected": "accept | reject",
      "canonical": "canonical trainers/... path or null",
      "note": "security or compatibility intent"
    }
  ]
}
```

The server registry suite and browser smoke suite must consume this committed
file directly. Both suites fail, rather than skip, when the fixture is absent,
malformed, has duplicate vector IDs, or its `limits` differ from the named
implementation constants. Every Security matrix checklist row above cites at
least one mandatory vector ID.

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
- Pre-START baseline requirement:
  - `board-server/package.json` must continue to declare all existing runtime
    dependencies and `socket.io-client` as a dev dependency.
  - Do not add or change dependencies in this plan-only PR.
  - `npm test` must exit `0`, the integration suite must load and execute, and
    no test may be skipped because a dependency is missing.
  - Record the complete result in the Execution record before implementation
    `START` can be considered.
- Final gate marker:
  `TRAINER_REGISTRY_NESTED_PATH_ARCHITECTURE_GATE_OK`.
- Gate rule: do not report the marker until all acceptance criteria and required
  checks pass at the exact implementation head, the `HIGH` external review has
  a non-blocking verdict with required provenance, and the owner has resolved
  every scope or architecture decision. The current plan step does not pass the
  gate.
- Condition-closure marker:
  `TRAINER_REGISTRY_NESTED_PATH_ARCHITECTURE_CONDITIONS_CLOSED`. It records that
  C1-C7 and the pre-START integration baseline are closed; it is not the final
  architecture gate and does not grant implementation `START`.
- Checks intentionally not run at condition closure: the not-yet-written
  nested-path matrix and browser gate, because production implementation has
  not started.

### Restored integration baseline evidence

- `board-server/package.json` declares `cors`, `express`, and `socket.io`, plus
  `socket.io-client` in `devDependencies`.
- No lockfile is committed and `node_modules` was initially absent. No package
  manifest, lockfile, or dependency version was changed.
- Existing manifest ranges were installed only in a temporary directory using
  the system CA trust store. Resolved versions were `cors 2.8.5`,
  `express 4.19.2`, `socket.io 4.7.5`, and `socket.io-client 4.7.5`; the
  temporary directory was removed after the test.
- On 2026-07-15, `npm test` loaded both test files and completed 27 tests:
  27 passed, 0 failed, 0 skipped, exit code `0`.
- This closes the plan-stage baseline prerequisite. It does not grant
  implementation `START` and must be rerun after implementation changes.

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
- The independent plan review provenance is: provider Claude; PR #85; base
  `1e5cb7beb38b59745bb9fe9cf5cb30d36f81fd6f`; reviewed head
  `78663970da8a2c84d2cd04ae259c22bf32642c8d`; verdict
  `APPROVED_WITH_CONDITIONS`; blocking issues none; source is the
  owner-attached review transcript received 2026-07-15.
- This condition-closure update is material and creates a new head. The old
  verdict remains evidence for C1-C7 but is not exact-head approval for the new
  plan. Architecture re-review of the new head is required.
- A pre-implementation plan review does not substitute for later exact
  implementation-head PR review provenance. An approval marker copied into
  this task specification, chat context, or a PR body is not evidence of a new
  review.

### Resolved architecture condition decisions

1. C1: use `8 / 64 / 96 / 2048`; legacy Windows checkout is the dominant
   constraint, and the deviation from Claude's 180 total requires re-review.
2. C2: reject ASCII case-folded full-path twins with
   `REGISTRY_DUPLICATE_FILE_CASEFOLD`; keep exact authorization case-sensitive.
3. C3: reject Windows device-name stems and every trailing-dot component.
4. C4: isolate scheme/authority and raw pathname before the first `?` or `#`;
   apply percent rejection only to raw pathname and fully revalidate after
   WHATWG parsing.
5. C5: commit one fixture at
   `tools/fixtures/trainer-path-conformance.json`; server and browser suites
   fail closed on fixture or constant mismatch.
6. C6: full baseline is mandatory before `START` and now passes 27/27 with the
   integration suite loaded.
7. C7: C1-C3 decisions and the total-length dominance rule are authoritative
   requirements in the canonical contract and Security matrix, not open
   questions.

## Condition-closure table

| Condition | Decision | Evidence | Spec sections | Tests/vectors | Closed |
| --- | --- | --- | --- | --- | --- |
| C1 | `8 / 64 / 96 / 2048`; total length dominates | Root/worktree length 128; legacy relative budget 130; current maximum trainer path 83; 34-character current margin and 10 after a 24-character reserve | Authoritative canonical file contract; C1 path-budget evidence | All `limit-*` N-1/N/N+1 vectors | yes |
| C2 | Reject ASCII case-fold twins; exact lookup remains case-sensitive; error `REGISTRY_DUPLICATE_FILE_CASEFOLD` | Cross-platform checkout collision risk and exact authorization invariant | Approved scope; Canonical path and uniqueness; Security matrix | `manifest-file-casefold-twin-reject`; `url-case-mismatch-reject` | yes |
| C3 | Reject reserved device-name stems and trailing-dot components | Windows checkout semantics; explicit accepted/rejected catalog | Authoritative canonical file contract; Security matrix | `device-*`; `component-trailing-dot-reject`; `component-internal-dot-accept` | yes |
| C4 | First-delimiter raw-pathname extraction; pathname-only percent rejection; post-WHATWG full validation | One server/browser pre-parse contract | Proposed URL-resolution contract; Security matrix | `url-*-percent-accept`; `url-*-fragment-*`; `pathname-percent-*` | yes |
| C5 | One committed fixture with schema/limits/vectors and fail-closed consumers | Exact repository-relative path and schema are specified | Committed conformance fixture contract | All fixture vectors plus `fixture-*-fail` | yes |
| C6 | Full baseline must pass before `START` | `npm test`: 27 passed, 0 failed, 0 skipped, exit `0` | Checks and gates; Restored integration baseline evidence; Execution record | Existing server unit and integration suites | yes |
| C7 | C1-C3 and total-length dominance moved into authoritative requirements | Canonical contract and every Security matrix row now carry decisions/vector IDs | Authoritative canonical file contract; Security matrix | C1-C3 vector groups | yes |

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
- Docs-only C1-C7 condition-closure update authorized by owner: yes.
- Branch creation allowed: yes, for the one task branch.
- Local commits allowed: the initial plan commit and one docs-only
  condition-closure commit containing only this task-spec.
- Push allowed: yes, for those plan-only commits without force.
- Draft PR allowed: yes, for the single task PR. Production implementation may
  be added to the same branch and Draft PR only after separate owner `START`.
- Merge allowed: **no unless separately authorized after review**.
- Auto-merge allowed: **no unless separately authorized**.
- Deployment allowed: **no unless separately authorized**.

## Execution record

- Actual branch: `codex/nested-path-foundation`
- Actual base SHA: `1e5cb7beb38b59745bb9fe9cf5cb30d36f81fd6f`
- Reviewed plan head SHA: `78663970da8a2c84d2cd04ae259c22bf32642c8d`
- Condition-closure head SHA: recorded in Draft PR #85 and the handoff after
  publication
- PR: Draft PR #85
- Commits: initial plan commit plus one docs-only condition-closure commit
- Tests passed: `npm test` loaded unit and integration suites; 27 passed,
  0 failed, 0 skipped, exit code `0`
- Tests failed: none
- Tests not run: browser regression and the not-yet-written nested-path matrix
- Scope deviations: none

## Sanitized condition-closure packet

Use the `SANITIZED_CONDITION_CLOSURE_PACKET` from the condition-closure handoff
for exact-head architecture re-review. It records the prior Claude provenance,
C1-C7 decisions, baseline evidence, and re-review requirement. It does not
grant implementation `START`, merge, or deployment permission.

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

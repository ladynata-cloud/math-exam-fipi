# OGE Mathematical Likbez v2 batch publication

## Identity

- Status: `IMPLEMENTATION`
- Review level: `MEDIUM`
- Trainer Factory track: `CATALOG_ONLY`
- Canonical base: `main @ 452f4658da04990fd31d73e35c499e86c16cd180`
- Branch: `codex/oge-mathematical-likbez-v2`
- Final gate: `OGE_MATHEMATICAL_LIKBEZ_V2_CATALOG_ONLY_GATE_OK`

## User goal

Publish the validated 31-page “Математическая база для ОГЭ” learning
collection at stable nested URLs below `/trainers/oge-basics/`. Make the
collection discoverable from the OGE course, the general trainer catalog, and
the OGE landing page without changing existing public URLs or enabling board
mirror behavior.

## Approved publication surfaces

| Surface | Decision |
| --- | --- |
| `FILE_PUBLISHED` | All 31 supplied HTML files |
| `SITE_DISCOVERY` | OGE course, trainer catalog, OGE landing page, sitemap |
| `BOARD_DISCOVERY` | Exactly four approved quick-select entries |
| `BOARD_MIRROR` | Disabled for every page |

The publication approval applies only to the paths and surfaces in this
task-spec. It does not authorize publishing another intake file or adding
another board entry.

## Inputs and integrity

- Source package: `mathexam-oge-basics-v2-for-codex.zip`
- Expected HTML count: 31
- Canonical repository file paths and SHA-256 values:
  [`tools/fixtures/oge-mathematical-likbez-v2-sha256.json`](../../tools/fixtures/oge-mathematical-likbez-v2-sha256.json)
- The validated archive remains the provenance source. Nineteen supplied HTML
  files received only removal of trailing ASCII spaces from one otherwise
  empty source line so that the mandatory `git diff --check` gate remains
  strict. The machine-readable old-to-new SHA-256 evidence is in
  [`tools/fixtures/oge-mathematical-likbez-v2-whitespace-normalization.json`](../../tools/fixtures/oge-mathematical-likbez-v2-whitespace-normalization.json).
- The resulting repository blobs are the canonical publication version. No
  other formatting, line-ending normalization, content, DOM, CSS, JavaScript,
  URL, storage, or behavior change is allowed.

## Scope

1. Publish the canonical repository tree derived from the validated delivery
   under `trainers/oge-basics/`.
2. Add one prominent card to the “Сначала закрыть пробелы” section of
   `trainers/oge-course/index.html` while keeping all existing large trainers
   below it.
3. Add concise collection discovery to `trainers/index.html` and
   `oge/index.html`.
4. Add a canonical sitemap URL for every published HTML page. Directory
   entrypoints use trailing-slash URLs; other pages retain their `.html`
   suffix.
5. Add exactly these iframe-only quick-select records to
   `trainers/board-compat.json`:

   - `trainers/oge-basics/index.html`
   - `trainers/oge-basics/multiplication-division/index.html`
   - `trainers/oge-basics/multiplication-division/long-division-from-simple-to-decimals.html`
   - `trainers/oge-basics/multiplication-division/long-division-mixed-checkpoint.html`

   Each record uses group `ОГЭ / математическая база`,
   `boardCompatibility: opens-in-board`, `supportsSeed: false`,
   `supportsBoardMirror: false`, and `supportsSemanticEvents: false`.
6. Add focused batch integrity and publication checks, plus only the
   mechanical registry test-count update required by the four records.

## Out of scope

- Board core, Bridge, registry implementation or endpoint contract
- Socket.IO, authentication, security policy, or deployment topology
- Mirror state, semantic events, seed support, or mirror UI
- Manifest records for the other 27 pages
- Edits to the supplied trainer HTML beyond the approved EOL-whitespace
  normalization
- Changes to other trainers, bulk migration, or alias creation
- Manual deployment, merge, auto-merge, or feature-branch deletion

If a required child URL cannot be published without a server or registry
implementation change, stop and request a separate platform task.

## Acceptance criteria

### Delivery and identity

- Exactly 31 HTML files exist under `trainers/oge-basics/`.
- Every file has the committed expected SHA-256.
- The 19 normalized files have complete old/new SHA-256 provenance, one changed
  line each, and a machine-checked EOL-whitespace-only delta.
- Canonical file paths and canonical public URLs are unique under ASCII
  case-folding.
- Effective page titles, trainer topic IDs, and trainer-owned localStorage keys
  are unique.
- Repeated basenames in different canonical directories do not authorize or
  identify a trainer.
- Relative navigation and asset references resolve inside the repository.

### Publication

- The OGE course presents the exact title
  “Математическая база для ОГЭ: ликбез без пробелов” and the approved short
  description before the existing large trainer cards.
- The general catalog and OGE landing page link to `/trainers/oge-basics/`.
- The sitemap contains exactly one canonical URL for each of the 31 pages, with
  no case-insensitive or normalized URL collision.
- All pre-existing sitemap URLs and manifest records remain present.
- The board manifest contains exactly four collection records, all
  `opens-in-board`; no collection page is mirror-, seed-, or semantic-enabled.

### Static and security

- Inline JavaScript in every supplied page parses.
- JSON fixtures and the board manifest parse; the sitemap remains structurally
  valid XML.
- No secrets, credentials, machine-specific absolute paths, control/bidi
  characters, unsafe external origins, or outbound network APIs are introduced.
- No basename authorization or basename fallback is introduced.
- `git diff --check` passes.

### Browser and pedagogy

- All 31 pages return HTTP 200 standalone at desktop and at `390x844`.
- All 31 pages render in an ordinary iframe.
- Horizontal overflow, console errors, and page errors are zero in both
  standalone viewports.
- Both maps and all internal navigation links are usable.
- The four approved manifest entries open through the real board quick-select.
- Learning, practice, checkpoint, retry, reset, local progress, full
  long-division route, and mixed-checkpoint scenarios from the approved
  delivery QA plan are reproduced against repository-served pages.

## Required checks

1. `node --test tools/oge-mathematical-likbez-v2.test.mjs`
2. `npm test` in `board-server/`
3. `node tools/trainer-inventory/cli.mjs --check`
4. Focused browser matrix for all 31 pages, both viewports, ordinary iframe,
   map navigation, and the four board anchors
5. Focused educational scenario suite for the trainer routes
6. Secret, path, control/bidi, outbound-network, collision, and basename scans
7. `git diff --check`
8. Old-to-new SHA-256 and EOL-whitespace-only normalization evidence

The final gate passes only when all applicable checks pass, failures are zero,
and no required check is left unrun.

## Rollback

Revert the publication delta as one batch:

1. remove only the 31 files below `trainers/oge-basics/`;
2. remove only their 31 sitemap URLs;
3. remove only the three discovery entries;
4. remove only the four quick-select records;
5. revert the focused fixtures/test and the mechanical registry expectation;
6. remove this task specification with the rest of the batch documentation.

Rollback must not change any pre-existing public URL, manifest record, trainer,
server implementation, or deployment configuration.

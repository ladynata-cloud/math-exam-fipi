# OGE 1-5 entry diagnostic 2026

## Identity

- Task: publish the updated OGE 1-5 map and the 2026 entry diagnostic.
- Owner: MathExam owner.
- Date: 2026-07-18.
- Base branch: `main`.
- Base SHA: `089f31da37823c4c95be8fbd9040821f0eb9d167`.
- Planned branch: `codex/oge-1-5-entry-diagnostic-2026`.
- Review level: `SMALL`.
- Factory classification: `CATALOG_ONLY`.

## Goal

Make the updated OGE tasks 1-5 map and the 2026 entry diagnostic visible next
to the OGE course, available by canonical manual URL, and selectable in the
board iframe without enabling semantic mirror behavior.

## Context and evidence

- The owner supplied both HTML files and explicitly requested publication.
- The updated map source SHA-256 is
  `94f015fd1c7c7fa689b6bee81b02132b7820d22d28b678d3a6be320165d73510`.
- The diagnostic source SHA-256 is
  `ba7f94a7a080a831fa6ef99197164412982dd9a2ccdd4e13dbdab25bd3eb42f9`.
- Read-only inventory classified both as `standalone-single-file` and
  `CATALOG_ONLY`; neither uses Bridge, Socket.IO, network calls, or external
  origins.
- Both use the existing `mathExamCourseProgress.v1` localStorage namespace.
- The map replaces the blob at its existing canonical URL. The diagnostic adds
  one new canonical URL. Candidate-specific path, URL, trainer ID, case-fold,
  and exact-blob collision checks are clear.
- The repository inventory also reports three pre-existing exact-blob groups
  outside this task. This task neither changes nor relies on them.

## Approved scope

### In scope

- Replace `trainers/oge-1-5-trainers/practice-1-5-map.html` with the
  owner-supplied updated map.
- Add
  `trainers/oge-1-5-trainers/practice-1-5-entry-diagnostic-2026.html`.
- Add exact links on the home page, OGE section, OGE course, trainer catalog,
  and sitemap.
- Register both exact paths as `opens-in-board` quick-select entries with
  `supportsBoardMirror: false`.
- Correct answer comparison so only mathematically equal numeric answers pass.
- Add focused validation evidence for all three diagnostic variants.

### Out of scope

- Semantic mirror, state contracts, Bridge adapters, and teacher/student sync.
- Board, server, registry implementation, Socket.IO, protocol, security,
  authentication, deployment, or other trainer changes.
- Cleanup of unrelated inventory duplicates.

### Files or areas that must not change

- `trainers/trainer-board.html`
- `board-server/` production runtime files
- Bridge SDK and protocol files
- Deployment configuration

## Publication surfaces

| Trainer | FILE_PUBLISHED | SITE_DISCOVERY | BOARD_DISCOVERY | BOARD_MIRROR |
| --- | --- | --- | --- | --- |
| OGE 1-5 map | `true` | `true` | `true` | `false` |
| OGE-2026 entry diagnostic | `true` | `true` | `true` | `false` |

## Acceptance criteria

- [x] Both canonical manual URLs load with HTTP 200.
- [x] Both exact paths appear in board quick-select and load in its iframe.
- [x] No mirror capability is advertised or enabled.
- [x] Every relative trainer link resolves.
- [x] All 30 diagnostic examples across three variants have correct answers.
- [x] Standalone desktop, mobile, and iframe checks pass.
- [x] Console errors and pageerrors are zero.
- [x] No token, credential, local path, unsafe external dependency, or new
  external origin is present.
- [x] Existing public URLs remain unchanged and the new URL has no collision.

## Checks and gates

- Required tests: registry unit and integration tests, focused browser flows,
  all-variant mathematical checks, the inventory CLI check, and applicable
  inventory unit tests.
- Required static checks: JSON/XML parse, exact link checks, secret and local
  path scan, `git diff --check`, and changed-file denylist.
- Manual checks: desktop, mobile, standalone, board iframe, correct/incorrect
  answer feedback, retry, and local progress.
- Final gate marker: `TRAINER_FACTORY_CATALOG_ONLY_GATE_OK`.
- Checks intentionally not run: mirror lifecycle tests because
  `BOARD_MIRROR=false`; deployment and production checks because merge and
  deployment are not authorized.
- The full Trainer Factory Phase 1 inventory suite was also attempted: 26 tests
  passed and two implementation-only assertions were not applicable to this
  publication gate. One compares the Pilot A committed-byte hash against a
  Windows CRLF checkout; the other intentionally rejects every changed file
  outside the historical inventory implementation allowlist.

## Execution record

- Focused diagnostic tests: 5 passed.
- Board registry and integration tests: 30 passed.
- Inventory CLI: `TRAINER_FACTORY_INVENTORY_V1_CHECK_OK`.
- Browser checks: desktop, mobile, standalone, and both board iframe entries
  passed with zero console errors and zero pageerrors.
- HTTP checks: both canonical trainer URLs returned 200.
- Static checks: JSON/XML parse, relative links, source safety scan, changed
  file denylist, and `git diff --check` passed.

## Risk and rollback

- Main risks: broken relative links, stale local progress, inaccurate answer
  checking, iframe overflow, and accidental mirror registration.
- Rollback: restore the prior map blob, remove the new diagnostic and its exact
  discovery/registry entries, and preserve every unrelated course and trainer
  URL.
- No storage migration is performed.

## Permissions

- `START` granted by owner in the current task conversation: yes.
- Branch creation allowed: yes.
- Local commits allowed: yes.
- Push allowed: yes, after a successful local gate.
- Draft PR allowed: yes, after a successful local gate.
- Merge allowed: no.
- Auto-merge allowed: no.
- Deployment allowed: no.

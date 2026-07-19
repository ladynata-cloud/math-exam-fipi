# OGE Mathematical Likbez — Percentages and Proportions v2

## Identity

- Task: Publish Mathematical Likbez percentages module v2
- Owner: repository owner
- Date: 2026-07-19
- Base branch: `main`
- Base SHA: `41f38657f7e72cc65d24ad275a4330ceccc55d0a`
- Planned branch: `codex/oge-basics-percentages-v2-publication`
- Review level: `MEDIUM`
- Trainer Factory classification: `CATALOG_ONLY`
- Related ADR: none

## Goal

Publish the seven-page percentages and proportions learning module below the
existing OGE mathematical-basics collection. Preserve the supplied mathematics,
pedagogy, URLs, identifiers, and storage contracts while correcting the six
interactive trainers so that a full review is counted at most once per current
task.

## Context and evidence

- Authoritative GitHub `main` was verified at the base SHA before branch
  creation.
- The parent map, order-of-operations trainer, and nested
  multiplication/division map are present on the base.
- The source archive SHA-256 is
  `195b5a668743ce1872bde3f6b8f201582f66b317bf60f5869a58dddd237eb0fa`.
- All seven original payload hashes matched the supplied checksum file.
- The supplied independent validation generated and checked 288,000 tasks with
  zero findings before the source fix.
- The original six trainers counted repeated clicks on `Показать разбор`. The
  owner explicitly authorized only the minimal idempotence correction and
  updated SHA-256 evidence.

## Publication surfaces

| Surface | Decision |
| --- | --- |
| `FILE_PUBLISHED` | Seven pages below `trainers/oge-basics/percentages/` |
| `SITE_DISCOVERY` | Parent OGE-basics map, trainer catalog, OGE section, sitemap |
| `BOARD_DISCOVERY` | Seven exact `opens-in-board` entries |
| `BOARD_MIRROR` | Disabled |

## Approved scope

### In scope

- Publish the seven canonical pages and URLs.
- Apply only the approved idempotent-review source fix to the six interactive
  trainers.
- Record original and corrected SHA-256 values in machine-readable fixtures.
- Add the percentages module to the parent map, catalog, OGE section, and
  sitemap.
- Add seven catalog-only board quick-select entries and the mechanical registry
  test update.
- Add focused integrity, behavior, publication, security, and regression tests.
- Preserve a committed copy of the independent mathematical verification source
  under `tools/fixtures/`.

### Out of scope

- Board mirror, Bridge, seed, semantic events, Socket.IO, registry runtime, or
  endpoint changes
- Server runtime, authentication, deployment, or topology changes
- Mathematical generators, answers, task wording, pedagogical sequence, modes,
  final-check counts, or Stepik report format changes
- Changes to `topicId`, trainer-owned storage keys, the shared progress key,
  public URLs, filenames, or visual design
- Roads-grid, Trainer Factory core, mass migration, merge, auto-merge, or
  deployment

### Files or areas that must not change

- `board-server/trainer-registry.js` and server runtime
- `trainers/trainer-board.html`, Bridge code, and Socket.IO code
- Deployment configuration
- Existing public trainer URLs outside the approved discovery additions

## Acceptance criteria

### Source identity and fix

- [ ] Seven published HTML files match the canonical SHA-256 fixture.
- [ ] The module map remains byte-identical to the original payload.
- [ ] The six old/new SHA-256 mappings match the corrected repository blobs.
- [ ] Each corrected trainer has only the shared current-task idempotence guard
  and the minimum supported-answer continuation change.
- [ ] First full review increments `reviewed` once; nine repeated clicks do not.
- [ ] View switching or repaint does not recount the review.
- [ ] A new task permits exactly one new review count.
- [ ] A hint does not increment `reviewed`.
- [ ] A correct answer after review is supported, never independent, and does
  not advance the mastery streak.
- [ ] Clearing progress and reloading clears `reviewed` and the current guard.

### Publication

- [ ] The parent map exposes `Проценты` and the complete module route after
  `Округление и единицы`.
- [ ] The previous percent-table trainer remains available as
  `Дополнительная смешанная практика` at its unchanged URL.
- [ ] The trainer catalog and OGE section each contain one module card.
- [ ] The sitemap contains exactly seven canonical module URLs and no
  `index.html` duplicate.
- [ ] The board manifest contains exactly seven approved `opens-in-board`
  entries with seed, mirror, and semantic-event support disabled.
- [ ] Existing parent URLs and B1/B2 behavior remain unchanged.

### Static, security, and browser

- [ ] HTML and inline JavaScript parse.
- [ ] JSON fixtures, manifest, and sitemap XML parse.
- [ ] Internal links resolve.
- [ ] Trainer IDs, canonical paths, URLs, topic IDs, and owned storage keys are
  unique; repeated basenames in different directories are allowed.
- [ ] No secrets, credentials, machine paths, control/bidi characters, unsafe
  origins, outbound APIs, or basename authorization are added.
- [ ] All seven pages pass desktop, `390x844`, and ordinary-iframe smoke with
  zero console errors, page errors, and horizontal overflow.
- [ ] All seven quick-select entries open the exact approved pages without
  mirror capability.
- [ ] Learning, practice, checks, result copy, and progress reload scenarios
  pass.

## Checks and gates

- Required tests:
  - `node --test tools/oge-basics-percentages-v2.test.mjs`
  - independent validation source: 288,000 generated tasks, zero findings
  - focused browser and idempotence matrix for all six trainers
  - desktop/mobile/iframe matrix for all seven pages
  - all seven real board quick-select entries
  - applicable OGE map, diagnostic, plans/routes, and mathematical-likbez
    regressions
  - `npm test` in `board-server/`
  - `node tools/trainer-inventory/cli.mjs --check`
- Required static checks:
  - exact SHA-256 fixtures and old/new mapping
  - HTML/inline-JavaScript, JSON, and XML parsing
  - links, collision, secret, local-path, control/bidi, outbound-origin, and
    basename scans
  - exact changed-file scope and `git diff --check`
- Final gate marker:
  `OGE_BASICS_PERCENTAGES_V2_CATALOG_ONLY_GATE_OK`
- Checks intentionally not run: mirror lifecycle tests, because
  `BOARD_MIRROR=false`; deployment and production checks, because they require
  separate authorization.

## Review plan

- Review-level rationale: a bounded seven-page catalog-only publication plus a
  minimal persistence-counter behavior correction across six homologous files.
- External review required: owner decision pending under `MEDIUM`.
- Sanitized handoff constraints: repository-relative paths, public URLs,
  base/head/tree identity, minimal diff, fixtures, and test results only.
- Required provenance if external review is used: provider, PR, base SHA, head
  SHA, verdict, and verifiable source or timestamp.

## Risk and rollback

- Main risks: repeated review counting, accidental independent mastery after
  review, discovery collisions, broken relative links, or unintended mirror
  capability.
- Rollback plan:
  1. remove only the seven percentages pages;
  2. remove their seven sitemap and board-discovery records;
  3. remove only the percentages additions from the parent map, trainer catalog,
     and OGE section;
  4. remove the focused fixtures, validation source, tests, and this task spec;
  5. restore the previous parent-map percent card without changing its legacy
     URL;
  6. mechanically restore the previous registry regression expectations.
- Data or compatibility considerations: rollback removes only local progress
  belonging to URLs no longer published; it does not alter existing storage
  keys or any pre-existing trainer data.

## Permissions

- `START` granted by owner in the current task conversation: yes
- Branch creation allowed: yes
- Local commits allowed: yes
- Push allowed: yes
- Draft PR allowed: yes
- Merge allowed: **no unless separately authorized after review**
- Auto-merge allowed: **no**
- Deployment allowed: **no**

## Execution record

- Actual branch: `codex/oge-basics-percentages-v2-publication`
- Actual base SHA: `41f38657f7e72cc65d24ad275a4330ceccc55d0a`
- Actual head SHA: recorded in the final report and Draft PR body because
  writing it here would change the head
- PR: recorded in the final report and Draft PR body
- Commits: logical publication and gate commits, plus a status reconciliation
  commit after the Draft PR number is known
- Tests passed: recorded in the final report and Draft PR body
- Tests failed: recorded in the final report and Draft PR body
- Tests not run: mirror lifecycle, deployment, production
- Scope deviations: none

## Required handoff

```text
EXECUTIVE STATUS

Task:
PR:
Base:
Head:
Tree:
Classification:
Files changed:
Published pages:
Behavior fix:
Old/new SHA mapping:
Math validation:
Focused tests:
Registry tests:
Inventory:
Desktop:
Mobile:
Iframe:
Quick-select:
Console errors:
Page errors:
Horizontal overflow:
Gate:
Failures:
Not run:
Scope deviations:
Working tree:
Recommendation:
Next user decision:
```

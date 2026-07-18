# MathExam task specification

## Identity

- Task: OGE Percent Guided Showcase v2
- Owner: MathExam site owner
- Date: 2026-07-18
- Base branch: `main`
- Base SHA: `4075a597ad3cbc63ee66ea272ad10d77b8cdba3e`
- Planned branch: `codex/oge-percent-guided-showcase-v2`
- Review level: `MEDIUM`
- Classification: `CATALOG_ONLY`
- Related issue or ADR: none

## Goal

Replace the existing percent trainer at its canonical public URL with the
owner-supplied guided-learning implementation, preserve legacy progress, and
make the existing catalog-only trainer available through board quick-select
without adding mirror behavior.

## Context and evidence

- Authoritative remote `main`, local `main`, and the task branch base all
  resolved to the base SHA before implementation.
- Source package:
  `percent-table-trainer-showcase-v2-package.zip`.
- Owner HTML SHA-256:
  `9a79de2fc54eadfdac8db58ed617e8ba635a48d768bede6a885c791676ad2551`.
- Canonical URL:
  `https://mathexam.space/trainers/oge-1-5-trainers/percent-table-trainer.html`.
- The canonical URL and map card already existed, so this is a replacement and
  not a new public-path allocation.
- The replacement is a standalone HTML trainer with one existing relative
  script asset, `progress.js`, and no third-party runtime library or font.

## Approved scope

### In scope

- Replace `trainers/oge-1-5-trainers/percent-table-trainer.html` with the exact
  owner-supplied HTML.
- Preserve the canonical public URL, Stepik return links, relative map link,
  legacy storage keys, topic ID, and numeric `perType` migration.
- Add the missing catalog-only manifest entry needed for board quick-select.
- Add focused static, math, storage, interaction, and browser-flow tests.
- Reconcile the stale operational project status within this task.

### Out of scope

- A new URL, filename, trainer card, or course redesign.
- Board mirror, semantic events, Bridge state, seed, Socket.IO, protocol, auth,
  deployment configuration, or server runtime changes.
- Changes to other trainer implementations.
- Cleanup of unrelated inventory findings.

### Files or areas that must not change

- `trainers/trainer-board.html`
- `board-server` runtime implementation
- Bridge and board protocol files
- Deployment and hosting configuration
- Other trainer HTML files

## Acceptance criteria

- [x] The exact owner HTML replaces the existing canonical file.
- [x] The trainer exposes three routes and a gated 9-step learning path.
- [x] Five basic types, mixed mode, and advanced practice generate correct tasks.
- [x] Independent, supported, and reviewed outcomes remain distinct.
- [x] Review-to-practice creates a fresh task.
- [x] Basic and advanced five-question checkpoints work without hints.
- [x] Legacy storage migrates without losing lesson state or streak.
- [x] Shared course progress remains `{solved, total: 5}` for this topic.
- [x] Desktop, 390 px mobile, standalone, and board iframe flows pass.
- [x] Console errors, page errors, and horizontal overflow are zero.
- [x] Quick-select opens the trainer and advertises no mirror capability.
- [x] No secrets, machine paths, unsafe origins, or broken relative assets exist.

## Checks and gates

- Required tests: focused Node tests, focused Playwright flows, board registry
  regression, existing OGE map/diagnostic regression, and inventory check.
- Required static checks: source hash, HTML structure, inline JavaScript syntax,
  JSON parse, dependency/origin scan, relative asset resolution, public-path
  collision check, and `git diff --check`.
- Manual checks: desktop, mobile, iframe, 9/9 learning, practice outcomes,
  checkpoint result/copy, reset, and legacy migration.
- Final gate marker: `OGE_PERCENT_GUIDED_SHOWCASE_V2_GATE_OK`
- Checks intentionally not run and why: deployment and production verification
  are release-stage checks after a separate merge authorization.

## Review plan

- Review-level rationale: bounded replacement of a substantial interactive
  trainer with persistent progress and several user flows.
- External review required: owner decision pending
- Sanitized handoff constraints: repository paths, public URLs, commit SHAs,
  test results, and minimal relevant diffs only.
- Required provenance if external review is used: provider, PR, base SHA, head
  SHA, verdict, and verifiable source or timestamp.

## Risk and rollback

- Main risks: incorrect generated math, accidental mastery credit, failed
  legacy migration, mobile overflow, or a broken canonical page.
- Rollback plan: revert the task PR to restore the previous HTML and remove the
  catalog-only manifest entry and focused tests.
- Data or compatibility considerations: retain `percentTrainer.v1`,
  `mathExamCourseProgress.v1`, `percentTableTrainer`, and legacy numeric
  `perType` values.

## Permissions

- `START` granted by owner in the current task conversation: yes
- Branch creation allowed: yes
- Local commits allowed: yes
- Push allowed: yes
- Draft PR allowed: yes
- Merge allowed: **no unless separately authorized after review**
- Auto-merge allowed: **no unless separately authorized**
- Deployment allowed: **no unless separately authorized**

## Execution record

- Actual branch: `codex/oge-percent-guided-showcase-v2`
- Actual base SHA: `4075a597ad3cbc63ee66ea272ad10d77b8cdba3e`
- Actual head SHA: recorded after commit
- PR: recorded after push
- Commits: recorded in the Draft PR
- Tests passed: 7 focused tests; 5 OGE diagnostic regressions; 6 relevant
  plans/routes regressions; 23 board registry tests; 3,500 independently
  recalculated generated tasks; full desktop/mobile/iframe Chromium flow;
  scoped inventory check; `git diff --check`; final marker
  `OGE_PERCENT_GUIDED_SHOWCASE_V2_GATE_OK`.
- Tests failed: no task-specific final-gate failures. The unrelated full
  plans/routes suite still has its historical Windows working-tree CRLF
  byte-hash failure; its six behavior/discovery tests pass.
- Tests not run: deployment and production verification are release-stage
  checks. The Trainer Factory Phase 1 implementation gate is unrelated to this
  catalog-only replacement; the scoped inventory check passed.
- Scope deviations: added the minimal existing-classification manifest entry
  required by the owner's CATALOG_ONLY quick-select rule; no registry
  implementation or board core changed.

## Required handoff

```text
EXECUTIVE STATUS

Task:
Classification:
Base:
Branch:
Head:
PR:
Files:
User-visible result:
Tests:
Failures:
Not run:
Gate:
Core files changed:
Scope deviations:
Working tree:
Recommendation:
Next user decision:
```

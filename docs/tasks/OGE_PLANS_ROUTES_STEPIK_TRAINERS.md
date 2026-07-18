# MathExam task specification

## Identity

- Task: OGE Plans and Routes Stepik Trainers
- Owner: MathExam site owner
- Date: 2026-07-18
- Base branch: `main`
- Base SHA: `e3af9f40b83ce593466c36e4839cd339e06eabe1`
- Planned branch: `codex/oge-plans-routes-stepik-trainers`
- Review level: `SMALL`
- Classification: `CATALOG_ONLY`
- Related issue or ADR: none

## Goal

Publish the two supplied standalone OGE 1–5 trainers next to the preparation
course, expose both through the site catalog and board quick-select, and keep
them explicitly iframe-only without promising mirror support.

## Context and evidence

- Authoritative `origin/main` and GitHub `main` both resolved to the base SHA
  before the task branch was created.
- Source archive:
  `oge-plans-routes-trainers-and-codex-prompt.zip`, SHA-256
  `BF1B10E16902C4F0E0D1A9E0D25F8DD632226D992F4C20D7F048866214F52DC8`.
- `practice-1-5-plan-reading.html` source SHA-256:
  `5F1C299FAB81C07CB757EFF08095343A3454F7630225CF164DC3D25AC6CE9AFA`.
- `practice-1-5-routes-checkpoint-2026.html` source SHA-256:
  `C0CB721A0C260C985780F285784E9D6B7AA7EBE259C8924C4A58AE85890AFEEC`.
- Read-only intake found no candidate filename, public path, case-folded path,
  or topic-ID collision.
- Both trainers are standalone single-file HTML and use only the existing
  `mathExamCourseProgress.v1` local progress store.

## Approved scope

### In scope

- Add the two owner-supplied HTML files without rewriting them.
- Add cards to the OGE 1–5 map, OGE course, and trainer catalog.
- Add canonical URLs to the sitemap.
- Add iframe-only entries to `trainers/board-compat.json`.
- Update manifest parity and focused task tests.

### Out of scope

- Board mirror, bridge, Socket.IO, seed, semantic-event, or protocol support.
- Server runtime, authentication, security, deployment, or factory refactors.
- Changes to the existing roads-grid or roads-schema trainers.
- Separate home-page cards.

### Files or areas that must not change

- `board-server/server.js`
- `trainers/trainer-board.html`
- Existing trainer implementation files
- Deployment and hosting configuration

## Acceptance criteria

- [x] Both exact owner HTML files work as standalone pages.
- [x] Both variants or sets have ten mathematically verified answers.
- [x] Learn/test/teacher flows, result copy, and local progress behave as intended.
- [x] Both trainers are visible next to the OGE course and on the OGE 1–5 map.
- [x] Both manual URLs return successfully.
- [x] Both quick-select entries load in the board iframe.
- [x] No mirror capability is advertised or enabled.
- [x] Desktop and mobile layouts have no blocking overlap or horizontal overflow.
- [x] Console errors and page errors are zero.
- [x] No secrets, local paths, unsafe external dependencies, or broken relative assets.
- [x] No existing public URL collision.

## Checks and gates

- Required tests: focused Node tests, board registry tests, trainer inventory check.
- Required static checks: JSON parse, inline-script syntax, dependency and secret scan,
  source hash verification, discovery and sitemap verification.
- Manual checks: desktop, mobile, standalone, course/catalog/map discovery,
  two complete sets, two complete variants, teacher mode, result copy, iframe.
- Final gate marker: `TRAINER_FACTORY_CATALOG_ONLY_GATE_OK`
- Checks intentionally not run and why: deployment and production checks are release-stage only.

## Review plan

- Review-level rationale: two isolated static trainers plus catalog-only discovery.
- External review required: no
- Sanitized handoff constraints: use only repository paths, SHAs, test results, and public URLs.
- Required provenance if external review is used: provider, PR, base SHA, head SHA,
  verdict, and verifiable source or timestamp.

## Risk and rollback

- Main risks: wrong answer data, broken discovery links, iframe incompatibility, or
  corrupting the shared local progress object.
- Rollback plan: revert the task PR.
- Data or compatibility considerations: retain the existing shared localStorage key;
  add two unique topic IDs and preserve all pre-existing properties.

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

- Actual branch: `codex/oge-plans-routes-stepik-trainers`
- Actual base SHA: `e3af9f40b83ce593466c36e4839cd339e06eabe1`
- Actual head SHA: recorded in the Draft PR
- PR: recorded after push
- Commits: one logical publication commit
- Tests passed: 7 focused task tests; 5 existing OGE map/diagnostic regressions;
  23 board registry tests; JSON and staged diff checks; scoped inventory check;
  desktop/mobile/iframe browser gate; two 10/10 learning sets; two 10/10
  checkpoint variants; teacher, hint, reset, wrong-answer, progress, copy, and
  catalog-search flows.
- Tests failed: the Trainer Factory Phase 1 self-suite remains 26/28 because
  its untouched Pilot A fixture hash for `oge-task6-fractions.html` is stale
  and its inventory-development-only scope assertion rejects every publication diff.
- Tests not run: the Phase 1 inventory implementation gate, because its two
  known self-suite prerequisites fail; deployment and production checks are
  release-stage only.
- Scope deviations: none

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

# EGE_BAZA_COURSE_03_NAVIGATOR

- Date: 2026-10-01
- Base branch: `course/ege-baza-product-blueprint` (Draft #148)
- Base SHA: `c304b6fe4a11d0f1361b148143b8079c8e163cce`
- Production main: `010e89c75c0fe110b57c983c728b8216fb38cd9d`
- Branch: `course/ege-baza-navigator`
- Review: MEDIUM, bounded static navigator and read-only progress adapter.
- Related ADR: none; reuses existing static course registry/page patterns.
- START: current owner instruction «продолжай», following the agreed next step.

## Goal and scope

Build `/ege-baza/` as a draft student navigator: Today, course map, module/lesson
outlines, prerequisite resources, first-module progress and teacher guidance.
Registry covers positions 1–21 and distinguishes the prototype from planned
lessons. Today reads only the existing first-module storage key; no new writes,
no migration, no requests, no overall course score. Add a return link from the
first module. Provide a reproducible local preview package.

Out of scope: homepage redesign/publication, new lessons/diagnostic banks,
shared progress contract, teacher server, authentication, automatic sync,
payments, merge, deployment, or relaxing inherited review requirements.

## Acceptance / checks

- Registry has stable unique IDs, valid prerequisites and all 21 positions.
- Ready/prototype links resolve; planned lessons have no fake launch actions.
- Today resumes unfinished assessments before suggesting lessons; respects
  the repeat boundary and reports assistance honestly.
- Missing, malformed or blocked storage produces a usable honest state.
- Navigator never writes storage, grades unfinished assessments, or claims
  full-course mastery. The existing module remains authoritative.
- Navigation, keyboard focus, browser back and return-to-course are checked.
- Gates: `node tools/ege-baza-navigator.test.mjs` with external jsdom;
  existing foundation math and DOM gates; `git diff --check`.
- Browser gate: `node tools/ege-baza-navigator.browser.mjs`, external Playwright;
  desktop and 360px rendering are required before release. Known local-browser
  environment restriction remains a possible blocker, never a passing result.
- Verify portable package contents and link conversion.

## Risk, review and rollback

Risk: stale recommendations or overstated progress. Mitigation: read-only
normalization, parity check against first-module task data, explicit labels,
separate unfinished/finished assessments and tests for assisted attempts.
Focused author review and targeted regression for MEDIUM; first-module HIGH
and its independent/external review remain required for the combined release.
Rollback: revert this delta and the module return link. No learner data changed.

## Permissions / execution

Task branch, logical commit, push and dependent Draft PR allowed. No merge,
auto-merge, public preview hosting, or deployment; whole-course release hold
remains. Final PR records exact head and actual passed/failed/not-run checks in
the standard EXECUTIVE STATUS format.


## Execution evidence

- Author review: registry references/cycles, assessment priority, honest progress,
  no storage writes, missing-state handling, DOM escaping, links and rollback.
- PASS: `EGE_BAZA_NAVIGATOR_OK`, 238 registry/adapter/DOM checks (external jsdom).
- PASS: `EGE_BAZA_FOUNDATION_OK`, all 60 answers independently calculated.
- PASS: `EGE_BAZA_FOUNDATION_DOM_OK`, 81 regression checks.
- PASS: `EGE_BAZA_PREVIEW_OK`, eight files; internal links and online auxiliary
  links verified. Initial packaging check treated a known dynamic template URL
  as a literal file; fixed by validating all six underlying values explicitly.
- BLOCKED / launch failed: Chromium `socket() failed: Operation not permitted`.
  No rendered desktop/mobile, actual keyboard or file:// result claimed.
- No external review or release approval claimed. Parent HIGH gate is unchanged.
- Owner follow-up requested OGE reuse: documented relevant existing repository
  decisions attributed to Claude in ADR 0003. No private exports added to Git.

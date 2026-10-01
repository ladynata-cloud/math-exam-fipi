# Базовый ЕГЭ: первый учебный модуль

## Identity

- Task: EGE_BAZA_FOUNDATION_MODULE_1
- Owner: repository owner
- Date: 2026-10-01
- Base branch: `main`
- Base SHA: `010e89c75c0fe110b57c983c728b8216fb38cd9d`
- Planned branch: `course/ege-baza-foundation-module-1`
- Review level: `HIGH` (new isolated browser progress, assessment and mastery).
- Related ADR: none; reuse established standalone HTML / local-progress trainer pattern.

## Goal

Create a usable first module, «Числа, деньги и проценты», for the owner's
mini-group base-EGE course. Connect prerequisite skills to practical tasks,
diagnose starting gaps, teach through interactive models, and distinguish
supported practice from independent and delayed assessment.

## Context and evidence

The owner explicitly requested starting work on the discussed course on
2026-10-01. This is the current task's START, not a merge authorization.
The base-EGE trainer has 68 fixed tasks and a local-progress/report pattern.
The existing mathematical-basics collection has division and percentage
trainers. This task links to these materials without rewriting their content.
The FIPI 2027 project documents were checked on 2026-10-01; base mathematics
has 21 short-answer tasks. This first module is not a complete exam course.

## Approved scope

- One self-contained module at `trainers/ege-baza/course/index.html`.
- Six skills, explanations and interactive models; fixed disjoint task banks
  for diagnostics, practice, checkpoint and delayed repeat.
- An isolated versioned localStorage key, validation, recovery notices and
  explicit own-progress reset. No personal information, automatic transmission,
  common progress writes or server changes.
- Navigation from the existing base-EGE trainer and catalogue; sitemap entry.
- Skill map and teacher guidance, project-status reconciliation, focused gates.

Out of scope: other course modules, new generator architecture, account or
teacher-server integration, board registration/mirroring, model API usage,
hosting changes, unrelated PRs, merge or deployment.

## Acceptance criteria

- [x] Six learn/practice routes work in DOM integration; diagnostic results recommend next work.
- [x] Fixed banks are disjoint, all numeric answers independently verified.
- [x] Invalid input does not count as a try; wrong answers or hints prevent
  first-attempt independent credit, including after reload.
- [x] Assessments do not reveal answers before completion; skips are recorded.
- [x] Diagnostic completion does not grant mastery. Delayed repeat opens at
  least 24 hours after checkpoint, uses its own tasks and is labelled honestly.
- [x] DOM reload resumes progress; malformed/blocked storage is handled; reset
  affects only this module. A storage event reloads newer state from another tab.
- [x] Report distinguishes all four activities and creates a TXT download in DOM integration.
- [ ] Actual browser download works offline.
- [ ] Desktop, 360px mobile, keyboard, links and HTTP/file loading checked.

## Checks and gates

- Required tests: `node tools/ege-baza-foundation.test.mjs` and
  `node tools/ege-baza-foundation.browser.mjs` (Playwright installed externally).
- Additional DOM integration: `node tools/ege-baza-foundation.dom.mjs`
  with jsdom 26.1.0 installed externally and exposed through `NODE_PATH`.
  This does not replace the required browser gate.
- Regression: `node tools/ege-baza-2027-gate.mjs`.
- Static: JS syntax, local-link/asset checks, `git diff --check`.
- Final markers: `EGE_BAZA_FOUNDATION_OK`, `EGE_BAZA_FOUNDATION_BROWSER_OK`.
- Visual checks: desktop and 360px screenshots, learning model and assessment.
- Production smoke is not run before separately authorized deployment.

## Review plan

Focused author review and relevant gates prepare the Draft PR. Under
`docs/REVIEW_POLICY.md`, HIGH independent/external review remains required
before merge unless the owner explicitly waives it with rationale. No external
approval is claimed. Handoffs contain public code and synthetic test data only.

## Risk and rollback

Risks: misleading mastery, incorrect learning text, local progress loss.
Mitigations: fixed independent answer oracle, separate assessment pools,
storage validation, assistance regression tests and explicit local-only notice.
Rollback: revert this task's added page and discovery links; other trainer
storage is never changed. The isolated key can remain without affecting them.

## Permissions

- Current owner START: yes («давай начинать работу с моим курсом»).
- Branch, local commits, push and Draft PR: yes, under AGENTS.md.
- Merge, auto-merge, deployment: no; require separate owner authorization.

## Execution record

Passed on 2026-10-01:

- `EGE_BAZA_FOUNDATION_OK`: 60 independently calculated answers, six skill
  banks, separate assessment pools, syntax and local discovery links.
- `EGE_BAZA_FOUNDATION_DOM_OK`: 81 checks, complete task flow, assistance,
  reload, 24-hour boundary, own-key reset, corrupt/denied storage and model
  updates. A simulated download checks its generated name and MIME type.
- `EGE_BAZA_2027_GATE_OK`: existing 68-task base-EGE regression.
- `git diff --check`.

Browser gate failed during browser launch: the execution environment denied
Chromium's socket operation. Its assertions did not run. The separate cloud
browser also could not open the local preview (`ERR_BLOCKED_BY_CLIENT`).
Desktop/mobile visual layout, real keyboard interaction, actual browser download
and file loading remain unverified. No screenshot or final browser PASS is claimed.
No restrictions were weakened. HIGH independent/external review is pending.
Implementation is ready for a Draft PR, not for release.

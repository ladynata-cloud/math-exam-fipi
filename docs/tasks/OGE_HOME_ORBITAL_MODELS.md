# OGE homepage: a mathematical solar system

## Identity

- Task: expand the homepage 3D exhibit and revolve models around a common center.
- Owner: MathExam owner, current request.
- Date: 2026-11-04 (Asia/Novosibirsk).
- Base branch: main.
- Base SHA: 7649cb1368f2c5631f79d25fa8414373481f9ed7.
- Planned/actual branch: feat/oge-home-orbits-20261104.
- Review level: MEDIUM (bounded public homepage interaction).
- Related ADR: none; no architecture or trainer changes.

## Goal

Show more recognizable OGE objects orbiting a shared center like planets, while
retaining independent model rotation, a large individual view and real course links.

## Context and evidence

PR #428 is published at mathexam.space and main 7649cb1. Its four-model exhibit
already supports WebGL/software rendering, selection, dragging, pause and reduced
motion. This verified production evidence supersedes older pending-release wording
in PROJECT_STATUS.md; no unrelated status-only change is needed.
The additional stove, plot, A-series paper and probability routes exist in the
public course. The owner explicitly requested more objects and solar-system motion.

## Approved scope

In scope: homepage scene, responsive presentation, eight model selectors, captions,
existing destination links, regression coverage/workflow and this task record.
Out of scope / do not change: trainers, scoring, accounts, persistence, API contracts,
analytics, course contents, dependencies and deployment configuration. The existing
showcase CI gains only a deterministic geometry check.

## Acceptance criteria

- Eight models: tire, apartment, two parabolas, circle/triangle, stove, house/plot,
  paper sheets and die; existing exact parabola/circle geometry is preserved.
- Three visible paths and common origin; orbital position is independent of spin.
- Orbit radii and angular speeds differ; selection centers/enlarges one model.
- Drag, pause, reduced motion and background visibility continue to work.
- All eight selectors have working existing destinations and accessible pressed state.
- Usable at 320, 390, 768 and 1280 px and without JS/WebGL.

## Checks and gates

- Static: JS syntax, git diff --check, sitemap tests/build check, SEO checks,
  existing lesson-funnel tests.
- Browser: tools/oge-home.browser.cjs (eight selections, links, keyboard, movement,
  whole-system pause, individual pause/drag, reduced motion, responsive/fallbacks).
- Geometry: tools/oge-home-orbits.test.cjs runs the real scene for 120 simulated
  seconds at four stage sizes; all model centers traverse all four quadrants and
  projected vertices stay within the viewport, including individual views.
- CI: all applicable existing workflows on the exact PR head.
- Manual: managed preview and live browser; CI desktop/mobile WebGL screenshots;
  orbit motion and each new model inspected.
- Gate: OGE_HOME_ORBITS_OK, OGE_HOME_3D_OK and applicable successful workflows.
- Local browser automation intentionally not run: managed-preview environment;
  browser regression runs in the existing GitHub Actions workflow.

## Review plan

Focused self-review of geometry, orbital coordinates, frustum bounds, fallback,
controls and actual link destinations. A-series side ratios are sqrt(2) and successive
areas halve; die opposing faces sum to seven. Scene is an illustration, not a new
scoring/learning sequence. Trainer consultation is not applicable.
External provider review: not performed under standing owner policy and current
explicit waiver; no provider approval is claimed. No real-pupil pilot performed.
Only public source and technical evidence go into the PR; no private data/secrets.

## Risk and rollback

More geometry can increase rendering cost. Reuse the existing capped pixel ratio,
software frame throttle, offscreen/background suspension and static fallback.
Narrow layouts reframe the full outer orbit; models can overlap briefly in projection
as in an orbital scene, and individual selection provides the large view.
Rollback: revert this scoped squash commit via an ordinary reviewed PR; no data
migration, deletion or history rewriting is needed.

## Permissions

Current request authorizes START, implementation, branch, commits, push and Draft PR.
Publication is authorized by docs/OWNER_RELEASE_AUTHORIZATION.md and the owner's
explicit current-session permission. Controlled squash and existing Pages deployment
are permitted after exact base/head checks, followed by live verification. No new
publication consent or external audit is required.

## Execution record

Actual head, PR, exact gate results, fresh pre-merge identities, deployment and live
verification are recorded in the PR release report. Scope deviations: none.

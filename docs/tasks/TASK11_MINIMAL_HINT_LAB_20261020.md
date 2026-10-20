# Task 11: matching first, optional interactive help

## Identity

- Task: TASK11_MINIMAL_HINT_LAB_20261020
- Owner: site owner, current conversation
- Date: 2026-10-20
- Base branch: main at `46d308df7448c61abc282c69f128975c41285fac`
- Preparation snapshot: 763e89aedbd561054e3860016bb999ef6aa15b19
- Branch: `feat/task11-minimal-published`
- Review level: MEDIUM
- Architecture: existing self-contained trainer; no server, persistence-schema or bridge changes

## Goal

Open task 11 directly on three graphs and three formulas with the same calm,
minimal presentation as task 19. A learner can choose the matches, or request
«Хочешь подсказку?» to explore a separate interactive example before answering.

## Context and scope

The canonical URL remains `/trainers/oge-task11-graphs-trainer.html`. Its existing
five matching types, course progress contract, exam, repeat-errors mode, warm-up,
building and family explorers are retained. Prior generators and their numerical
SVG oracle remain the mathematical baseline. Functions shown in ordinary random
practice exclude the optional signs-only t41 topic; t41 remains selectable and
part of the exam. The matching direction remains the existing А/Б/В formulas to
numbered graphs, preserving the answer and progress contracts.

In scope: main-screen hierarchy and spacing; green controls; hidden advanced
navigation; optional inline lab for lines, parabolas, hyperbolas, roots and
constants; independent parameter controls and a movable probe point; explanation
after a submitted answer; compatible self-contained HTML download; scoped tests.

Out of scope: server, authentication, cabinet contents, assignment data, common
storage schema, migration logic, exam thresholds, routes, Task19 files, hosting.

## Acceptance criteria

- [x] Three plots and three functions are immediately available; method hints and solutions are initially hidden.
- [x] «Хочешь подсказку?» opens an interactive example without changing the exercise, entered answer, attempt count or progress.
- [x] All useful function families are available, including a horizontal line.
- [x] Undefined function values have no invented point; clipped points are explained; rounded values use ≈.
- [x] Fractions have a horizontal fraction bar.
- [x] Progress, replay, mistake correction and old course navigation remain available.
- [ ] Real browser checks at 360px and 1280px; keyboard controls; enlarged plot; exam; downloaded HTML.

## Checks and review

- `node --test tools/task11-minimal.test.cjs tools/task11-math-review.test.cjs`
- `node tools/oge-algebra-contract.test.mjs`
- `node tools/task11-minimal.browser.cjs`
- Existing browser suite updated only to open the new disclosures before its unchanged legacy assertions.
- Scoped GitHub workflow installs isolated pinned jsdom/Playwright and preserves screenshots.
- Independent mathematical review: no findings in 500 generated tasks and 9,141 lab parameter/probe combinations. Review validates displayed formulas separately from the model and maps SVG points back to coordinates.
- Gate marker: TASK11_MINIMAL_BROWSER_OK, alongside OGE_ALGEBRA_GATE_OK.

## Risk and rollback

Main risk is an inaccessible control on a narrow screen, or a discrepancy between
an experimental formula, graph and numerical readout. Targeted tests cover both;
CI browser evidence is required before publication. No stored-data shape changes
are made. Rollback is a normal revert of this PR; no data migration is necessary.
The one-file HTML retains the existing download mechanism and works offline.

## Permissions and execution

The current conversation explicitly requests cloud implementation and publication.
Preparation uses an isolated archive; branch, commit, PR, review and authorized
release are owned by the integrating parent after Task19 completes. This document
is not an approval marker or a substitute for release provenance.

- Base: `46d308df7448c61abc282c69f128975c41285fac`; exact head/PR and release evidence recorded in the PR
- Local learner + independent math tests: 11 passed
- Full algebra gate: 668 checks passed; OGE_ALGEBRA_GATE_OK. The first run caught two changed registry-facing topic labels; labels were restored before the passing rerun.
- Browser tests: prepared; local Chromium unavailable; run in scoped CI

Independent focused review found the optional signs topic had lost its defining quadratic formula. The formula is now retained visibly before help, with a regression check. The reviewer confirmed the fix; no blocking findings remain.

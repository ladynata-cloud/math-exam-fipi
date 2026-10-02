# Макарычев 9: подробный курс по изданию 2023

## Identity and evidence

- Owner: Наталья Михайловна. Date: 2026-10-02.
- Repository: ladynata-cloud/math-exam-fipi.
- Base main: `2e0f65dad4d25f3b57bbed3696ff5752831a4ba3`.
- Base tree: `e520cdfbf0a41fadda88ac322ae2b6ed0580bb4e`.
- Branch: `course/makarychev9-full`. Review level: HIGH (new mathematics and answer formats).
- Request: detailed, visually clear and interactive basic algebra 9 course, usable with today's pupil; identify textbook edition.
- Source confirmed from the supplied PDF title and contents: Макарычев, Миндюк, Нешков, Суворова, под ред. Теляковского, Алгебра 9, базовый уровень, Просвещение, 2023, 15-е переработанное издание. SHA-256 and provenance: `docs/VILENKIN6_MAKARYCHEV9_SOURCES.md`.
- Pre-existing 31 overview lessons remain accessible with their original IDs and progress.

## Approved implementation

- 93 original skill lessons across all 31 textbook points, 78 core and 15 extra; points 6, 12, 18, 25, 31 explicitly optional.
- Each lesson has original explanation, worked example, misconception, reflection, guided practice, variable-number tasks and independent practice.
- Five SVG labs: approximation error, graph construction, interval solution selection, systems/regions, sequences. Pointer and keyboard/numeric controls. No animation or WebGL requirement.
- Course landing, point navigation, search, current-lesson links and board catalog.
- Prerequisite detours use existing state/return handling. No new storage or server schema.
- New answer formats for interval sets and unordered coordinate pairs, scoped to new tasks.

## Acceptance and self-checks

- [x] Independent mathematical checks for every new task family; guided answer acceptance.
- [x] All 93 guided lessons complete in a real Chromium browser.
- [x] Lab missions, hints, new independent tasks, prerequisite return, legacy progress and backup.
- [x] 360 px, tablet, desktop, zoom and keyboard checks; board iframe launch.
- [ ] Existing regression gates on exact PR head; publication and live file identity check.

## Boundaries / permissions

The owner explicitly authorized implementation and publication of all discussed created/updated courses and the board in the current conversation. The owner cancelled independent external review and a separate final acceptance for this release work. Apply that standing exception; it is not evidence of external review and does not modify global policy files. Ordinary self-checks, exact base/head tracking, concurrent-work preservation and branch protection remain required. No force/reset/rebase/admin bypass, account/hosting changes or new automations.

No scans, OCR, private textbook files, copied numbered exercise collection or unrelated textbook changes. No claim of every exercise solved, a full cloud student journal or real-student validation. Existing EGE priority remains.

## Risks / rollback

Risks: mathematical edge cases, answer format friction, accessibility, old progress regression. Preserve old IDs and schema; test new formats separately. Revert this PR with a normal reviewed/authorized revert if necessary; no destructive history rewrite. User progress remains in existing keys.

## Execution

Local implementation and self-checks passed. PR #173 and `docs/reports/MAKARYCHEV9_DETAILED_20261002.md` contain scope, checks and limits. Exact-head cloud CI and live publication evidence will be recorded in PR #173. No external reviewer verdict is claimed.

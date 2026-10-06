# Cabinet course: school-first navigation

## Identity

- Task: correct the pupil cabinet's inherited EGE-base course navigation.
- Owner: Наталья Михайловна.
- Date: 2026-10-06.
- Base branch: `main`.
- Base SHA: `9ed82e42e2e0c4daebd3e0897674dc53e6d510d7`.
- Branch: `fix/cabinet-course-grade7`.
- Review level: `MEDIUM`.
- Related ADR: existing unified-learning implementation; no new architecture.

## Goal and evidence

The pupil cabinet must make the published grade-7 course and earlier foundations
its normal course entry. The owner reported that the current pupil sidebar says
«Курс ЕГЭ база» and opens the general catalogue with EGE positions 1–21.
`learning/app.js` confirms that this label and view are unconditional for all
pupils. Account records do not currently carry a curriculum choice. Grade-7 and
foundation content already have explicit catalogue metadata.

The base includes the published course and Atanasyan articles through PR #197.
The project status's remaining editorial publication sentence is stale; that
unrelated status-only edit is intentionally outside this task.

## Scope

- Label pupil navigation «Мой курс».
- Default pupil `#course` to grade-7 content and existing remediation entries:
  algebra, geometry and earlier foundations.
- Keep examination mode in a distinct, explicitly chosen `#course=ege` entry
  under collapsed «Другие курсы»; preserve direct exam links and teacher access.
- Preserve existing task IDs, attempts, assignment flow, progress and data APIs.
- Correct related route wording and the misleading site-wide EGE-only link.
- Add focused synthetic browser coverage.

No profile database field, account write, learner-name test, identity migration,
password change, trainer content change or live-pupil operation is in scope.
The default is a product navigation default, not a claimed personal enrolment.

## Acceptance and gates

- [ ] A synthetic pupil sees grade-7 algebra/geometry/foundations by default.
- [ ] EGE positions, advanced topics and the 21-task variant are absent from the
  visible default course; explicit exam navigation remains functional.
- [ ] Search, existing work status, managed task opening and route return work.
- [ ] Teacher retains the complete catalogue, exam projection and assignment UI.
- [ ] Course switching does not create attempts or alter saved work.
- [ ] Desktop and 390px mobile views have no horizontal overflow or JS errors.
- Required: focused browser gate, JS syntax, catalogue reference gate,
  existing grade-7 browser regression, `git diff --check`.
- Final gate marker: `LEARNING_COURSE_NAVIGATION_OK`.

## Review, risks and rollback

MEDIUM because bounded client navigation changes which content pupils see first.
The owner waived external review for this course work; targeted internal review
and regression checks remain required. Share only code and synthetic fixtures.

Risk: unintentionally hiding existing EGE preparation. Explicit alternate-course
navigation, direct exam URLs and the teacher's complete catalogue are retained.
Rollback the scoped frontend commit; there is no data migration to reverse.

## Permissions

Implementation and publication were authorized in the task conversation.
This delegated task makes a local commit only. The coordinating agent handles
PR creation, merge sequencing and release verification separately.

## Execution record

- Files: `learning/app.js`, `learning/index.html`, `learning/route.js`, this spec,
  `tools/learning-course-navigation.browser.cjs`, and its focused cloud workflow.
- Local validation passed: JavaScript syntax; catalogue/reference gate
  (205 identities, 62 school families, 21 positions, 1183 help variants);
  `git diff --check`.
- Focused independent code review found no concrete issues with catalogue
  coverage, role behavior, routes or saved-work interactions.
- Local browser execution did not run: this execution sandbox denies Chromium's
  Unix socket before any page can open. Do not count it as a passing browser gate.
  The coordinating agent will use the focused CI workflow, inspect its screenshots
  and record the exact tested head before publication.
- `learning-course-navigation.yml` runs both focused navigation and existing
  grade-7 saved-work browser regression and uploads desktop/mobile screenshots.
- Scope deviations: none. No production account or saved work was accessed.

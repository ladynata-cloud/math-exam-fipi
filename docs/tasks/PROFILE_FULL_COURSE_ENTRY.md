# Profile cabinet: direct entry to the full current course

## Identity

- Task: `PROFILE_FULL_COURSE_ENTRY`
- Owner: repository owner
- Date: 2026-10-23
- Base branch: `main`
- Base SHA: `a05f3b60a590da5ca5d149c86262241ace186973`
- Planned branch: `fix/profile-full-course-entry`
- Review level: `SMALL`
- Related issue or ADR: existing profile cabinet entry; no architectural change
- ADR status, if applicable: not applicable

## Goal

Give profile learners a visible first-screen entry to the complete current
public course, including task 16, the mixed checkpoint and topic navigation,
while retaining the thirteen quick practice links already in their cabinet.

## Context and evidence

- The owner approved this bounded correction with an explicit START in the
  current conversation on 2026-10-23. Board synchronization remains paused.
- The authoritative remote main ref was checked before branch creation and
  matched the base above. An isolated clean worktree is used.
- The live cabinet profile page shows thirteen practice cards. Its stereometry
  card opens the exact current `#practice/stereo-box/independent` route.
- The full public `https://mathexam.space/ege-profil/start/index.html#calm`
  page also exposes task 16, the mixed checkpoint and school-topic revision.
  A normal direct entry to that page is absent from the cabinet first screen;
  it exists only in the catalogue-error fallback and in the teacher's profile
  note. The public practice header can reach it indirectly via "Все задания".
- `learning/app.js::profileCoursePage()` is shared by the profile learner's
  home, route and course views and the teacher's profile-course view.
- The relevant published profile status was reconciled with the live route.
  This task is a navigation correction, not a new course or course release.

## Approved scope

### In scope

- Add "Открыть полный курс ЕГЭ профиль" before the thirteen practice cards,
  using the existing primary-button styles and canonical `#calm` destination.
- Briefly describe the full destination and remove the first-part-only eyebrow.
- Update the cabinet app cache version and record this task/status.

### Out of scope

- Course content, mathematical engines, saved progress, grading or assignments.
- Board synchronization, a course copy, authentication or account changes.
- Merging, auto-merging or deploying this PR.

### Files or areas that must not change

- `ege-profil/**`, `board-server/**`, trainer contracts and board code.
- Existing profile catalogue, other course directions and learner data.

## Acceptance criteria

- [x] Profile home, route and course show the full-course entry before the cards.
- [x] The entry uses the exact canonical public course URL with `#calm`.
- [x] All thirteen existing practice entries and saved-work links remain intact.
- [x] The local-browser progress notice remains accurate and visible.
- [x] Existing phone, reload, second-device and other-direction checks pass.
- [x] App cache version changes; no data or backend migration is required.

## Checks and gates

- Required tests: existing `tools/learning-profile-entry.browser.cjs`.
- Required static checks: `node --check learning/app.js`,
  `node tools/build-profile-exam-catalog.cjs --check`, `git diff --check`.
- Manual checks: inspect exact destination, label and position in the rendered
  profile page; verify that the public destination has the requested sections.
- Final gate marker: `PROFILE_FULL_COURSE_ENTRY_OK` only after checks pass.
- Checks intentionally not run and why: full mathematical and server suites
  are unchanged by this isolated link; existing CI remains enabled.

## Review plan

- Review-level rationale: isolated navigation/copy change using existing code
  and styles, without a runtime boundary or data change.
- Trainer design consultation applicable: no; this is a cabinet link and does
  not change a trainer, mathematical content or learning sequence.
- Before implementation: existing routes, live destination and minimal entry
  location inspected; no external design consultation required.
- Ready-result review: focused source review plus existing entry regression.
- External review required: no for SMALL; no external verdict is claimed.
- Sanitized handoff constraints: public code and generic synthetic fixtures
  only; no personal account identifiers, credentials or machine-specific paths.
- If external review is later requested, record provider, PR, base, head,
  verdict and verifiable source or timestamp separately.

## Risk and rollback

- Main risks: a wrong external fragment or a stale cached cabinet app.
- Rollback plan: revert this PR's app, index and documentation delta through
  the normal authorized release process. No learner-data rollback is needed.
- Data or compatibility considerations: ordinary same-tab navigation, no
  identity/query parameters, no API changes and no fabricated cabinet results.

## Permissions

- START granted by owner in the current task conversation: yes
- Branch creation allowed: yes
- Local commits allowed: yes
- Push allowed: yes
- Draft PR allowed: yes
- Merge allowed: **no unless separately authorized after review**
- Auto-merge allowed: **no unless separately authorized**
- Deployment allowed: **no unless separately authorized**

## Execution record

- Actual branch: `fix/profile-full-course-entry`
- Actual base SHA: `a05f3b60a590da5ca5d149c86262241ace186973`
- Actual head SHA, PR and commit identity: recorded in the Draft PR handoff
  after the final local commit, to avoid self-referential commit hashes.
- Tests passed: app syntax, canonical catalogue freshness, existing profile-entry
  browser regression and whitespace check. The browser run used the unmodified
  regression with in-memory screenshot/logging hooks only; desktop 1365px and
  mobile 390px screenshots were inspected. The new visible link has the exact
  canonical destination and remains above the catalogue on both widths.
- Gate: `PROFILE_FULL_COURSE_ENTRY_OK` (local implementation checks).
- Focused source review: no blocking findings; wording was clarified to describe
  the existing course without claiming complete coverage of all exam prototypes.
- Tests failed: none. Initial environment setup attempts were blocked by an
  empty browser-mirror archive and the sandbox's localhost listener restriction;
  the same pinned official Chromium build and an approved local test run passed.
- Tests not run: full mathematical/server suites; reason above
- Exact-head CI: will run on the Draft PR; no cloud result is claimed here.
- Scope deviations: none

## Required handoff

```text
EXECUTIVE STATUS

Task:
PR:
Base:
Head:
Gate:
Tests:
Failures:
Not run:
Scope deviations:
Recommendation:
Next user decision:
```

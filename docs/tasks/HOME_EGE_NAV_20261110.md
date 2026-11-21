# EGE courses in the homepage top menu

## Identity
- Task: HOME_EGE_NAV_20261110
- Owner: MathExam owner; direct request in this conversation on 2026-11-10 (Asia/Novosibirsk).
- Base branch: main
- Base SHA: 049eeb943bc3df5e43dd4d643d76f3c3003d568e
- Planned branch: fix/home-ege-nav-20261110
- Review level: SMALL
- ADR: not applicable; two static navigation links.

## Goal and evidence
The owner supplied a screenshot of the homepage menu and asked to place the basic and advanced EGE courses beside OGE. The current homepage already has course cards pointing to /ege-baza/ and /ege-profil/, but its top navigation omits those courses. Both destination index files exist and have matching course titles.

## Approved scope
Insert separate "ЕГЭ база" and "ЕГЭ профиль" anchors immediately after "ОГЭ" in index.html. Preserve all existing links, active-page marking, content, styles, course behavior and learner data. No changes to other navigation systems or unrelated course updates.

## Acceptance criteria
- Both course links are native anchors in the homepage top menu, available without JavaScript.
- Order: Главная, Все тренажёры, ОГЭ, ЕГЭ база, ЕГЭ профиль, Учебные курсы, Мой кабинет, Занятия с преподавателем.
- Existing responsive flex wrapping remains intact.
- The runtime diff is exactly two added anchor lines.

## Checks and review
Self-review: exact insertion and inverse equality, eight ordered menu links, one occurrence of each new menu target, existing destination files/titles and wrapping CSS inspected. Existing relevant GitHub Actions must pass, including public SEO/navigation and their browser checks. No new test suite is warranted for this reversible static edit.
Local execution is unavailable in this session; local git diff --check and local browser QA are not claimed. Existing Actions include git diff --check. Connected browser also unavailable. Published route verification follows release when reachable.
Final gate: HOME_EGE_NAV_PASS only after applicable CI succeeds.
External review: not performed; optional under standing owner policy.

## Risk and rollback
Risk: extra links can wrap the existing menu to another row on narrow screens. Existing flex-wrap handles navigation and header rows. Rollback: ordinary revert of the two links and this task record; no storage or API migration.

## Permissions
The current direct implementation request starts this task. Branch, commit, push and Draft PR are authorized within scope. Merge and established Pages publication are authorized after applicable checks by [standing owner policy](../OWNER_RELEASE_AUTHORIZATION.md). No new owner confirmation is required.

## Execution record
Source editing uses the GitHub integration because a local execution environment is unavailable. Base is pinned above. One task, branch and Draft PR. Exact head, CI, main-drift and release outcomes are recorded in the PR. Existing PROJECT_STATUS entries distinguish earlier course releases from this navigation change; no unrelated status reconciliation is claimed.

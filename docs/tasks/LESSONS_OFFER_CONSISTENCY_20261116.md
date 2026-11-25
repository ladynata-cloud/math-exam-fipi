# MathExam task specification

## Identity

- Task: `LESSONS_OFFER_CONSISTENCY_20261116`.
- Owner: Наталья, владелец MathExam.
- Date: 2026-11-16, Asia/Novosibirsk.
- Base branch: `main`.
- Base SHA: `1469ad50a8659f66c8613164009e7387a3a68f2b`.
- Planned branch: `task/lessons-offer-consistency-20261116`.
- Review level: `SMALL`.
- Related issue or ADR: none; an isolated correction of the existing offer.
- ADR status: not applicable; no architectural decision is introduced.

## Goal

Согласовать страницу занятий с фактической работой преподавателя и главной:
онлайн-занятия для 5–11 классов, индивидуально и в мини-группах до четырёх
человек. Родителю ученика 5–6 класса должно быть понятно, что занятия доступны.

## Context and evidence

- После конкретного аудита владелец прямо поручил: «выполни самые приоритетные
  задачи». Это источник разрешения на данный ограниченный пакет, а не цитата
  буквального `START`.
- На базе главная уже приглашает на занятия для 5–11 классов. В
  `lessons/index.html` три description, первый экран и представление
  преподавателя ограничивали занятия 7–11 классами. Карточка 5–6 классов
  называлась только самостоятельной практикой.
- 2026-11-15 23:42:31 UTC (16 ноября 06:42 по Новосибирску) главная и
  `/lessons/` получены по обычному HTTPS с HTTP 200 и побайтово совпали с базой.
  Это проверка двух страниц, а не всего сайта.
- `docs/PROJECT_STATUS.md` прочитан. Запись об удалении пояснения к ранним
  отзывам описывает подготовку; текущая страница на базе и в публикации уже
  совпадает без этого блока. Журнал не используется как доказательство выпуска.
  Общая сверка статуса ведётся в соседнем пакете; здесь файл остаётся неизменным,
  чтобы не создавать конкурирующие записи.
- Просмотрены списки файлов всех 70 открытых PR. Только #385 затрагивает
  `lessons/index.html`; его patch добавляет старые скрипты помощника и не
  исправляет возрастное предложение. Отдельного готового исправления не найдено.
- Первый прогон Draft PR #629 на head
  `6fe3f257994f274e623ca518bb863f3cecd3b3c0` завершился успешно: все семь
  check-runs четырёх workflow. Однако workflow не задавал предусмотренный
  тестом `SHOWCASE_LANDING_ARTIFACTS`, поэтому screenshots `/lessons/` не
  сохранялись. Для завершения визуальной приёмки согласовано минимальное
  дополнение workflow: включить и выгрузить уже предусмотренные артефакты.

## Approved scope

### In scope

- `lessons/index.html`: ровно шесть текстовых строк. В пяти местах заменить
  относящийся к занятиям диапазон 7–11 на 5–11; метку карточки 5–6 заменить
  на «5–6 классы · школьная программа».
- `docs/tasks/LESSONS_OFFER_CONSISTENCY_20261116.md`.
- `docs/reports/LESSONS_OFFER_CONSISTENCY_20261116.md`.
- `.github/workflows/avito-showcase.yml`: задать `SHOWCASE_LANDING_ARTIFACTS`
  существующему browser-тесту и сохранить отдельный артефакт `lesson-showcase`.
  Существующие команды, assertions, права, условия gates и артефакт
  `oge-home-3d` сохраняются.

### Out of scope

- Изменение стоимости, длительности, расписания или состава услуг; длительность
  мини-группы не уточняется без подтверждённого значения.
- Новый дизайн, аналитика, учебные сценарии, кабинеты и новая тестовая система.
- Публикация и объединение в `main`.

### Files or areas that must not change

- `index.html`, CSS, JavaScript, тесты, остальные workflow и все учебные материалы.
- `docs/PROJECT_STATUS.md` и остальные задачи/отчёты.

## Acceptance criteria

- [x] Главная, первый экран, описание преподавателя и три description одинаково
  предлагают занятия 5–11 классов.
- [x] Карточка 5–6 классов не ограничивает предложение самостоятельной практикой.
- [x] Продуктовый diff содержит только шесть согласованных замен; цены,
  мини-группы до четырёх, ссылки, metadata URL и ресурсы сохранены.
- [x] Первый кандидат прошёл существующие применимые проверки, включая
  мобильные и настольные размеры, клавиатуру и режим без JavaScript.
- [ ] Финальный кандидат с сохранением артефактов прошёл CI на точном head;
  screenshots `/lessons/` на 320 и 1280 px просмотрены.
- [x] Создан Draft PR #629; публикация не заявлена.

## Checks and gates

- Required tests: `python3 tools/seo-sitemap.test.py`,
  `node tools/lesson-funnel.test.cjs`, `node tools/avito-showcase.browser.cjs`.
- Required static checks: `python3 tools/build-sitemap.py --check`,
  `python3 tools/seo-check.py`, `git diff --check`, exact scope/text diff.
- Manual checks: screenshots at 320 and 1280 px, visible offer and grade card.
- Final gate marker: `LESSONS_OFFER_CONSISTENCY_20261116_OK` only after the
  applicable checks and review; this specification is not an approval record.
- Checks intentionally not run: new runtime/mathematics tests, because no
  runtime or mathematics changes; external provider review is not required for
  this SMALL copy correction. The historic `lesson-funnel-static.test.py`
  compares whole pages to an October snapshot and is not a current workflow gate.

## Review plan

- Review-level rationale: isolated public copy correction, no runtime boundary.
- Trainer design consultation applicable: no; no trainer or learning sequence
  changes.
- Before implementation: read-only audit of published pages, current source,
  open PRs and existing gates; external provider consultation not performed.
- Ready-result review: self-review and executing agent's review of the exact
  diff and test output before commit/PR; CI screenshots before final acceptance.
- External review required: no; no owner request for one on this package.
- Sanitized handoff: only scoped public source and results; no credentials,
  private learner information or machine-specific absolute paths in repository
  documents. No external provider verdict is claimed.

## Risk and rollback

- Main risk: inconsistent descriptions or unintended changes outside six lines.
- Rollback: revert the six scoped copy changes through a normal reviewed change.
- Data or compatibility: no data, links, scripts, identifiers or storage changes.

## Permissions

- Literal `START` granted in the current owner reply: no. The later direct
  execution instruction quoted above authorizes this concrete audit follow-up.
- Branch creation: authorized; parent prepared the isolated task branch.
- Local commits, push and Draft PR: reserved for the executing parent after
  review; this delegated implementation stops with uncommitted changes.
- Release authorization: current conversation-level owner AGENTS.md requires a
  separate explicit authorization. Its narrower restriction takes precedence
  over the standing publication text in the repository template and skill.
- Merge allowed: **no**.
- Auto-merge allowed: **no**.
- Deployment allowed: **no**.

## Execution record

- Actual branch: `task/lessons-offer-consistency-20261116`.
- Actual base: `1469ad50a8659f66c8613164009e7387a3a68f2b`.
- PR: [Draft #629](https://github.com/ladynata-cloud/math-exam-fipi/pull/629).
- First CI head: `6fe3f257994f274e623ca518bb863f3cecd3b3c0`; all seven
  check-runs PASS. This result does not certify the subsequent artifact update.
- Commits: parent committed and published the first candidate; the artifact
  follow-up remains uncommitted for parent review. Its exact head and final
  acceptance belong in the PR body and handoff.
- Checks and final status: [verification report](../reports/LESSONS_OFFER_CONSISTENCY_20261116.md).
- Scope deviations: none; the fourth path is the approved evidence-only
  workflow addition. The product diff remains six lines.

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

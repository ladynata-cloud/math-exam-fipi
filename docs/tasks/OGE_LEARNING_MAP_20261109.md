# MathExam task specification: видимый маршрут ОГЭ

## Identity
- Task: первый общий пакет улучшения ОГЭ по итогам аудитов учебных платформ.
- Owner: Наталья Михайловна.
- Date: 2026-11-09, Asia/Novosibirsk.
- Base branch: main.
- Base SHA: ee7c501abc2f293d923d892a4b3dcc5ac4b798f7.
- Planned/actual branch: feat/oge-learning-map-20261109.
- Review level: HIGH (чтение нескольких форматов результатов и отдельное сохранение точки навигации).
- Related ADR: 0003, Accepted; текущий публичный дом курса и сохранённые контракты устанавливаются действующим кодом.

## Goal
Ученик видит учебные линии всего курса, результаты доступной браузерной практики и кнопку возвращения к своей теме. Старые ссылки и результаты сохраняются.

## Context and evidence
Публичный курс представляет каталог №1–25. Старые oge/registry.js и progress-adapters.js не полностью соответствуют текущим источникам результатов (включая №6, №13, №19–22). Поэтому готовность темы нельзя выводить из старого универсального passed/mastered. Кабинет имеет отдельную серверную историю; эта задача не объявляет её объединённой с браузерной.

## Approved scope
### In scope
- Семь учебных линий на trainers/oge-course/index.html; все действующие номера ОГЭ и восемь практических сюжетов.
- Чтение существующих форматов без миграции/изменения результатов; явное различение активности и освоения.
- Возвращение к недавней теме по проверенным датам активности или отдельной сохранённой ссылке.
- Доступные ссылки без JavaScript, адаптивная карта, целевые регрессии и независимый обзор.
### Out of scope
- Новые генераторы, переоценка старых результатов, синхронизация с кабинетом, изменение авторизации, серверов или общих протоколов.
- Новая диагностика, алгоритм подтверждения освоения, новые уроки и переработка подсказок — последующие самостоятельные пакеты.
### Files or areas that must not change
- Учебные движки, задания, ответы, ключи их сохранения; опубликованные материалы ЕГЭ и учебников.

## Acceptance criteria
- [x] Все учебные линии и действующие ссылки доступны; старый каталог и якоря сохранены.
- [x] Форматы сверены с текущими тренажёрами; только проверенные числовые значения попадают в интерфейс.
- [x] Открытие/переход не создаёт решённого задания и не меняет существующую историю.
- [x] Подсказки/старый passed/начатая тема не объявляются самостоятельным освоением.
- [x] Повреждённое или заблокированное хранилище не блокирует обучение.
- [ ] Обновление результатов при возврате, на другом табе и после перезагрузки; безопасная точка продолжения.
- [ ] Проверены 320/390/768/1280 px, клавиатура и режим без JavaScript.

## Checks and gates
- Model and DOM: tools/oge-learning-map.test.cjs; oge/tests; navigation/learner-entry preservation gates.
- Browser: tools/oge-learning-map.browser.cjs in CI; managed preview was attempted but its browser route failed (unverified locally).
- Static: syntax, local links and git diff --check.
- Final gate: OGE_LEARNING_MAP_OK; publication requires applicable CI and live verification.

## Review plan
- Independent technical review of ready diff; pedagogical review of progress language and route boundaries.
- New trainer archetype: no; existing course navigation approach, no new assessment mechanism.
- External provider review not performed/required under standing owner policy.
- Real learner effect and authenticated pupil progress are not tested by this task.

## Risk and rollback
- Risks: stale source mappings, unsupported result types, mistaking activity for mastery, unavailable storage.
- Mitigation: explicit source adapters, bounded values and links, truthful labels, read-only data path and fallback links.
- Rollback: ordinary revert of this isolated change; no result migration or deletion required. Separate navigation key may remain harmlessly unused.

## Permissions
- START: user «Хорошо, продолжай» after the proposed improvement packages; this task implements the first package.
- Branch, commits, push and Draft PR: authorized within this scope.
- Release: [standing owner policy](../OWNER_RELEASE_AUTHORIZATION.md), no additional publication confirmation required after checks.
- No force/reset/rebase, weakened gates, secret changes or unrelated writes.

## Execution record
- Validation and exact release identity: recorded in the task PR.
- Failures and unavailable checks must be reported explicitly.

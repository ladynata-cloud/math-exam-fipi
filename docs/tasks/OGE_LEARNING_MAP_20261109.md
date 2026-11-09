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
- Точное обновление контрольной записи страницы в assets/assistant/page-rollout.json по проверенному исходному коммиту; проверки сохранности навигатора остаются неизменными.
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
- [x] Обновление результатов при возврате, на другом табе и после перезагрузки; безопасная точка продолжения.
- [x] Проверены 320/390/768/1280 px, клавиатура и режим без JavaScript.

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

## Verified candidate evidence
- Head f8e57150dcd939f7cbd3c3974bad4b2f486bb297: 13 new DOM/model tests; 6 navigation tests; learner-entry and focus-navigation gates; OGE registry/adapters/junk suite all PASS.
- Independent HIGH source review: PASS after malformed-data, focus and №6 format corrections.
- Chromium workflow 42577827217: PASS at 320/390/768/1280 px; keyboard, actual links, continuation, cross-tab refresh, no-JS, denied storage. Downloaded screenshots visually reviewed.
- Initial navigator gate failed on the intentionally changed HTML checksum. Refreshed only that reviewed source binding through the established tool; unmodified preservation tests 4/4 and binding negative controls 5/5 pass.
- Final candidate CI and production evidence are recorded in PR #494; no pupil learning-effect study or authenticated cabinet synchronization is claimed.

## Concurrent release composition
- Initial candidate d6f58e396828a8d14d12661431dd16efa76dab59 passed all eight workflows. Immediately before merge, main advanced to adc2c9445f6ce7f0a56bca67ed2bc31b8b82ec3c (approved PR #492, guided linear equations).
- Read-only merge-tree found only navigator-manifest conflict. Ordinary merge source 7399432e2e4feef52fb47b38c4adfd71d91ae591 retains the released lesson files unchanged and both the new lesson entrance and OGE map.
- Navigator manifest keeps main's provenance and receives one explicit binding for the combined OGE HTML. No force, reset, rebase or test weakening.
- Affected local model/DOM/navigation checks: 19/19 PASS; final composed head must pass CI again and have an exact current base/head check before release.

## Final gate scope after concurrent VPR publication
- Main8bd4c47 adds approved VPR #495 after PR500. Ordinary merge source31f790ea228432b4845064cfba40f41c10874690 preserves all main files; only navigator provenance needs rebinding. All OGE page/runtime/test blobs equal reviewed ff103a4.
- Current composed regressions:51/51 PASS, covering OGE, linear lessons, navigation preservation and VPR journeys (all492 tasks); binding negative controls5/5 PASS. Entrance/focus and existing OGE registry/adapter checks are also rerun.
- Applicable final release gate: independent composed-tree review, current local checks, final-head OGE map Chromium CI, authoritative current main/head, exact merge delta and production verification.
- Unchanged broad suites retain their successful receipts: native OGE board/math ff103a4 run42579038950, minimal interface42579038872, learner entrances42579038811, linear pilot42579038842, showcase42579038798. Exact current course navigator is inventory index586/shard2, successfully tested at three viewports by job129033174878/run42579038794. The inventory, navigator assets and OGE course blobs are unchanged in final composition.
- Repository-wide jobs triggered again by synchronization may remain queued; they are reported as pending, not passed. No required status, assertion or workflow is removed, and no known technical failure is ignored. This scope follows the standing policy's affected/applicable-gate rule; no exception approval is requested or claimed.

# Петерсон 6: выбранные упражнения частей 2 и 3 поверх опубликованного курса

## Identity and approved scope

Owner: MathExam. Start: 2026-11-06. Base: main `8d7fdd8c984a83213b1b4fddea371efc2a7f8c25`. Branch: `feat/peterson6-parts2-3-current`. Review: **HIGH** (сохранения, совместная доска и курсовые контракты). Этот PR переносит подготовленные материалы из #355 (`18a945267537d3dd5142885ac09599d56eea8f0a`), не заменяя опубликованную первую часть. Отдельный полный учебник и практикум #367 сюда не входят.

## Goal and evidence

Открыть 99 выбранных карточек 18 тем второй части и 105 карточек 26 тем третьей части из издания Дорофеева и Петерсон (2019), с привязкой к странице/номеру, ручной записью там, где автоматическая проверка невозможна, и работой через существующую доску. Не заявлять полный разбор всех исходных упражнений. Живой `school/peterson6/data.js` до старта побайтно совпал с базой (SHA-256 bf4efd40627a815a11688be1ca09556b6a7ad7062aabc0472dc32fe10590a2bd). Базовый курс: 14 тем, 224 карточки; 98 опубликованных карточек отличаются от старого PR, 6 наборов прежней теории хранятся для совместимости. На базовом сайте оба новых банка — 404.

## Acceptance and validation

- Первые 14 уроков: неизменные тексты, задачи, ответы, шаги, справочный указатель 1–497, история `legacyTasks`/`legacyTheory` и прежняя методика для сохранённой работы. Зафиксировать независимый от сборщика отпечаток опубликованных данных.
- Оба новых банка и карты источников совпадают с подготовленным материалом. Проверить 204 карточки, 87 числовых ответов, ручные задания, формат, модели, соответствие источникам и все пользовательские маршруты. Сохранить точный поиск первой части и актуальные помощники.
- Повторить ошибку старой проверки (job 121688051269: после перехода на второе задание p39 в DOM присутствовала форма автоматического ответа) и проверить исправленное поведение на реальной синтетической доске, от учителя и ученика. Не подменять проверку ожиданием неправильного результата.
- Проверить действующие и новые Peterson gates: сборка, действующие методика/сохранения, все шаги, генераторы, модели, поиск, кабинет, реестр, протокол и браузер. Не затрагивать задания Максима, настоящие записи учеников, внешние модели или размещение сервера.

## Review, risk and permissions

При переносе прошлый CI и аудит не заменяют проверку новой композиции. Уровень HIGH: независимая проверка предметных данных и совместимости, скриншоты синтетической сессии, точная версия проверок в PR. Источник разрешения: задача владельца и [действующее решение](../OWNER_RELEASE_AUTHORIZATION.md); внешняя консультация/аудит не запрошены и не проводятся. Без новых архетипов и изменения ADR. Публикация ветки и Draft PR разрешена, выпуск централизует координатор. Основные риски — регрессия старых сохранений, номера из другой части, обновление контрактов доски. Откат — возврат этой поставки с сохранением исходной опубликованной части и данных; без миграции пользовательских записей.

## Execution record

Подготовка и проверка новой композиции выполняются в отдельной ветке. Проверки, провалы и точные SHA указываются в передаче результата.

### Results and limitations

- The rebuilt course has 58 lessons / 428 cards. All 428 DOM walkthroughs completed all 1,181 authored steps and render feedback, hints and formulas; 129 practice screens and all 98 current equation cards (491 steps) pass. The new banks have 99 + 105 cards: 87 numeric, 43 choice and 74 manual. There are 75 required figures. The source number maps have 497 / 588 / 778 real entries; part 2 preserves the printed duplicate 143 and missing 144.
- Existing equation checks: 900 independent generator examples, 2,700 numeric steps, 1,800 distractors and original seed identities; 25 state/legacy/board cases pass. The expanded generators passed 12,900 checks / 32,400 steps and a separate recomputation of 13,800 examples / 28,800 steps. The 25 state cases, exact 303/305 entry, assistant-topic contracts and real cabinet/browser journeys remain in the gate.
- The independent [source identity receipt](../reviews/PETERSON6_PARTS_2_3_CURRENT_INDEPENDENT.json) binds the old and new banks to their exact sources. No fresh page-by-page external audit of the entire textbook or real-learner trial was performed. Internal visual QA inspected the 320 px manual-work and proportional-model screenshots.
- The actual #355 browser failure ([job 121688051269](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/40355871361/job/121688051269)) reproduced on its exact old runtime: after selecting p39-t02, the hash was already on task 2 while the DOM still showed task 1 and its automatic answer form. On the new runtime the same-event Chromium probe sees the second card, a manual-work panel and **zero** automatic forms. The integration gate also waits for the correct visible task identity, not just a changed URL. The exact data-card assertion remains.
- During composition, a full board run exposed a second issue: both frames sent ready with version 2 / schema 2, but the host rejected the registry containing that schema and timed out before hydration. A diagnostic trace recorded `registry=failed`, `roomReceived=true`, current frame/candidate generations equal. The host registry now accepts the two supported schema versions, matching its server counterpart; exact trainer-file/version/protocol checks remain. The PR records the final CI/browser status separately.
- Remaining release coordination: the schema-aware board registry reader/manifest must be available alongside the static wrapper. Verify the deployment and a separate synthetic pair before calling the shared board live; no changes to real records, server deployment, #355 or #367 are made by this preparation. Roll back the matching client and registry together if needed.

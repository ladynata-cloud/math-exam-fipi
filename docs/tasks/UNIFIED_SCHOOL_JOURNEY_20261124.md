# UNIFIED_SCHOOL_JOURNEY_20261124 — единая предметная система, первый прототип

## Identity
- Date: 2026-11-24. Base: main `85a9971123fc752390c63f9a59e4bcd1be40378e`. Branch: `prototype/unified-school-journey-20261124`.
- Review level: NEW_ARCHETYPE (общая предметная карта и диагностическое поведение). Только прототип и Draft PR, не публикация.
- Owner direction: продолжать содержательную разработку по консультациям Fable, сохранять предыдущие наработки, довести проект до единой бесплатной системы школьной математики; замечание владельца: сейчас на сайте не виден единый маршрут.
- Architecture proposal: [ADR 0015](../adr/0015-school-journey.md), Proposed. Существующие Accepted ADR 0010, 0011, 0014 не изменяются.

## Verified baseline
Главная предлагает каталог, отдельные курсы, ОГЭ и ЕГЭ. foundations/course.js использует learning/preparation-map.js, есть arithmetic-route.js, grade7-route-map.js, course-program.js, кабинет и курс Арженикова (82 урока, PR #743). Эти системы имеют отдельные контракты прогресса; старые результаты нельзя автоматически объявлять освоенными навыками.

На base проверены источники публичных маршрутов. PR #747 объединён; PR #744 остаётся открытым. Промежуточное совмещение #744 f64959b8 сохранено, но автономный ZIP и бинарные иллюстрации недоступны текущему текстовому интерфейсу GitHub. Не заменять архив старой версией и не переносить старые CI. Эта новая задача следует уточнённому приоритету владельца и не правит файлы #744.

## Scope
- 22 грубых узла, 7 целей, 13 пар входных проб (26 новых коротких условий). Связи — предлагаемые для проверки, не обязательные предпосылки.
- Прототип общего входа прямо на главной: выбрать цель и тему, увидеть учебный материал, пройти две пробы, проверить возможную основу или перейти дальше.
- Переиспользовать существующие идентификаторы preparation-map, публичные маршруты и пространственную карту Арженикова. Не копировать учебные банки.
- Сохранить все прежние входы, H1, метаданные, sitemap, навигатор, книги, кабинет, прогресс и исходники тренажёров; локально хранить только выбор цели/темы новым ключом.
- Никаких запросов к API, учётных записей, новых платных услуг, автозапуска консультаций.

## Acceptance
- Карта без циклов и дублированных идентификаторов; все ссылки на существующие ресурсы, включая старый справочник. Любая тема доступна без прохождения предыдущих.
- Верный ответ не равен освоению; неоднозначность или отсутствие данных не дают диагноза. Помощь и доказательство переноса требуют отдельного дальнейшего контракта.
- У старших тем без проб честная отметка о недоступности общей проверки.
- Статический fallback без JS, keyboard/native controls, mobile 320/390/1280; storage denied не блокирует работу. Никаких изменений чужих ключей.
- Старые ссылки и контент главной сохранены; новая CTA — видимый общий вход.
- Применимые общие CI и целевой browser gate, независимый review; для публикации необходимы принятие архитектуры, точная проверка base/head и отдельное решение владельца.

## Design consultation
Получены 24 ответа Fable (24.11.2026) из пользовательской выгрузки. Использованы направления №1, 2, 3, 8, 10, 13, 22, 24: общее ядро навыков, отдельные графы предпосылок и алгоритмов, различение самостоятельности, маршрутизация без обязательной LLM. Это рекомендации, не независимое exact-head approval. Полная сверка 24 ответов с кодом и первоисточниками ещё не закончена. Не публикуем пользовательскую выгрузку, API-квитанции, ключи или данные учеников.

## Execution and rollback
Структура и исходники подготовлены; в памяти выполнены проверка графа, 13 пар ответов и состояний, наличие 15 привязок в preparation-map и точное восстановление старого HTML из additive diff. Node/Chromium, полный checkout, real-pupil pilot, exact-head review и production не выполнены в момент создания кандидата. GitHub CI должен проверить новый head; никакого утверждения о PASS заранее. Откат — revert PR; новый локальный ключ не затрагивает другие данные. Не использовать force, reset, rebase, обход gates.

## Next phases, separately reviewed
Инвентаризация мелких навыков и сопоставление с общими существующими ID; пилот дроби → уравнения с возвращением из упражнения к причине; нормализация свидетельств без миграции старых данных; интеграция курсов 5–11 и экзаменационных ветвей; педагогический диспетчер и помощник по Accepted ADR 0011; офлайн-экспорт и апробация. Систему считать единой только после проверенного непрерывного маршрута в обе стороны.

## Permissions
START — явное поручение владельца в текущем разговоре. Draft PR yes; merge/deploy **NO** в этой стадии.

## CI finding and correction (24 November)
- Initial exact-head `8c69f9fd292ee8ddd3cdbd4c33785770b1e3a209`: 16/17 workflows success, including [route prototype](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/45306168541), [SEO](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/45306168512) and [public navigator](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/45306168547). [Public lesson showcase](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/45306168450) failed in homepageEntry: first `/geometry-course/` link was the hidden static fallback after JS initialization. The old card itself was not removed.
- Keep static course shortcuts visible with and without JS, explicitly label them. Do not change old showcase or SEO tests. Extend the prototype browser test with visibility of all seven shortcuts, first-link compatibility and a no-JS context. Bump controller cache version only.
- Same task and Draft PR. No new external audit, no paid calls, no release authorization. New head requires new CI; no prior PASS transferred. Owner requested one sequential development chat until limit reset, no competing workstreams. The received v3 backup is the already-reviewed 24-question series, not the new strategy v4 response. The strategic migration and assistant design remain pending consultation and explicit architecture acceptance.

## Strategy v4: review and boundary corrections (24 November)
- Received the 12 strategic answers, including completed synthesis #12 and an additional partially terminated attempt. They support a reversible layer over existing registries, not a new curriculum catalog. The single current queue and decisions are recorded in [ROADMAP](../ROADMAP.md), with the prior roadmap retained. ADR 0015 remains Proposed.
- Exact code review found that sparse arrays could pass the old answers.some check, and the old public URL regex could admit /learning?… or normalized/authority-like paths. Accept only literal first-party public document paths; reject invalid/missing resources; validate static links. Add negative probes. These are defensive contract fixes, not a claim of diagnosis.
- After any complete pair, freeze that presentation and explicitly say that the revealed tasks are no longer a fresh check. Changing topic is still allowed; no answers or mastery stored. Existing no-JS shortcuts and all previous tests remain.
- In-memory checks of the exact new URL and answer helpers: 16 rejected and 6 accepted routes; seven incomplete/invalid arrays rejected, three valid arrays accepted. Prior target CI on d453141806d11bcc0ad06b590e5c24f51925b23f passed; all new full gates and browser checks require fresh CI. No user data, paid API calls, merge or publication.

## 25 November — distinguish repeat after leaving a topic

The same pair could previously look like a first presentation after navigating to another skill and back. Keep an in-memory Set of node IDs whose explanations were revealed; revisits show a repetition label before and after submission. Incomplete attempts do not mark exposure. Do not persist answers, exposure, scores or mastery; after a reload the general warning about prior explanations still applies. Existing selection key and all other storage remain unchanged. Added browser regression at the existing three widths, preserving previous scenarios; updated only the controller cache version. No new architecture, content, resource URL, API or production changes. Exact-head CI still required.


## 25 November — ARCH-01-A school progression and published resource handoffs

Base observed: main 83d4d47aeb66d8204e3cb5238f871486e0716a1a; prior candidate dbb4b4487f724afa3ef40890f233d4f76a74b0f3. The new main contains the released notebook course (#758); its 11 paths do not overlap the 10 #749 paths. #750 remains separate and unpublished. The proposed school goal previously omitted three existing senior-stage nodes (trig, stereo, analysis), and the basic exam goal omitted stereo. Append these nodes to the appropriate goal views without changing the 22 IDs, 7 goals, prerequisites, 26 probe conditions, stored selection, prior route order or existing public entrances. Add five existing public resources from main as additional entrances: like-terms factory, motion workshop, college functions, written workshop (#748), and Tyurin probability. These entrances do not claim mastery or completed curriculum and do not link to unmerged new submodules. Retain the current linear-pilot URL until the combined #749/#750 browser acceptance confirms the new anchor. No other executor's files or shared registry contracts changed. In-memory exact module and current preparation registry checks: 99 assertions, including all old node metadata, old link order, unchanged probes/edges, goal coverage and five new paths. New Node regression added; full checkout/browser and exact-head CI remain to be obtained. No publication or paid calls.

## ARCH-01-G — содержательный no-JS маршрут (26.11)

[Exact composition CI 45733171860](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/45733171860) verified the real three-width route with JavaScript, including prerequisite, draft, transfer and resume. Its no-JS gate failed because the existing fraction-meaning page initializes the title and lesson only in JavaScript. This scoped correction adds an actual paper lesson to that same public page, within noscript only: meaning of a fraction, reconstructing a whole, equivalent fractions, three independent exercises, a closed self-check and a normal return link to the existing equations course. No change to the old interactive payload, keys or URL. The example is not a worked answer to the pilot's own first equation or transfer. The composition test retains the original assertion and adds visible paper content, keyboard-operated self-check and return, and checks for inactive controls and overflow. Coordinator per-page source binding only; no change to the global base, shared navigator code, other receipts or gates. Exact native CI and release approval remain mandatory.

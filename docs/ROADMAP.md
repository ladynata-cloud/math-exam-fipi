# MathExam — единая бесплатная система школьной математики

## Текущий приоритет и порядок работ (2026-11-24)

Статус: рабочая стратегия, подготовленная по поручению владельца продолжать MathExam последовательно из одного чата. Архитектурные решения, изменяющие принятые контракты, остаются Proposed до отдельной приёмки. Это не разрешение на автоматическое слияние PR или расход API. Старый план B2 ниже сохранён как история и источник зависимостей, а не вторая активная очередь.

Основание: две серии консультаций Fable от 24 ноября (24 методических и 12 стратегических вопросов, включая завершённый первый ответ №12; повторная попытка №12 обрывается в сводке). Модель анализировала переданные снимки, не полный checkout и не живое обучение. Выводы — проектные рекомендации; полный текст пользовательской выгрузки, квитанции и ключи не публикуются.

### Целевая архитектура и неизменяемые условия

- Один предметный граф навыков с типизированными предпосылками и статусами гипотез; порядок изучения по учебнику и экзаменационная цель — представления, а не копии графа. Граф решения задачи и доказательства отделён от графа предпосылок.
- Существующие `learning/preparation-map.js`, `learning/grade7-route-map.js`, `learning/course-program.js` и маршруты курсов остаются источниками ресурсов в своих областях. Новая карта ссылается на стабильные ID и реальные URL; не заводим параллельный каталог и не мигрируем все старые ключи хранения.
- Разделяем выбор/открытие темы, попытку, помощь, самостоятельную проверку, перенос и отсроченную проверку. Не объявляем освоение по одному ответу, посещению или двум коротким пробам. Нет автоматического диагноза по одной ошибке.
- Учебное ядро бесплатно и не требует внешнего API, аккаунта или LLM. Помощник, зеркало доски и кабинеты — отдельные необязательные компоненты с действующими границами ADR 0010, 0011 и 0014. Предлагаемый ADR 0015 — не принятый протокол прогресса.
- Сохраняем все прежние URL, якоря, уроки, карты в стиле Prezi, результаты, книги и архивы. Обычный HTML — основа навигации; SVG/масштабирование и анимация — дополнительный слой, доступный с клавиатуры и без обязательных эффектов.
- SEO — представление образовательной структуры. Различные учебные намерения могут заслуживать разных URL. Никаких массовых редиректов/canonical/noindex, накрутки или повторов неопределённых POST переобхода. Проверяем содержание, состояние HTTP и поисковые экспорты отдельно.

### Единая последовательная очередь

| Приоритет | Задача | Условие завершения |
| --- | --- | --- |
| P0, текущая | [#749](https://github.com/ladynata-cloud/math-exam-fipi/pull/749), только ограниченный общий вход и прототип навигации | Точный diff, ссылки, все применимые CI, клавиатура, мобильные экраны, отсутствие JS/хранилища; нет фиктивного освоения, новой миграции или автоматического диагноза. Отдельная архитектурная приёмка. |
| P0 | Инвентаризация ресурсов пилота и адресов | Версионированный перечень ID, URL, источников, локального хранения, ролей страниц; зафиксировать sitemap/robots/canonical и legacy-ссылки. Исходная карта содержит 632 URL, но это не полный crawl. Сначала пилот, затем воспроизводимый аудит всех записей. |
| P0 | [#748](https://github.com/ladynata-cloud/math-exam-fipi/pull/748), письменная мастерская ОГЭ | Устранить или изолировать провалы Public navigator visibility и OGE skill course, сохранить тексты и математические проверки; отдельный scope, актуальный base/head, никаких релизов при красном gate. |
| P0, блокер выпуска помощника | [#744](https://github.com/ladynata-cloud/math-exam-fipi/pull/744) | Сохранить опубликованные 82 урока и 656 условий, согласовать текущий шаг и границы помощника, пересобрать ZIP и manifest из полного источника, проверить офлайн и полный CI. Сейчас конфликт и недоступность бинарных материалов через текстовый интерфейс; не подменять архив. Эта ветка не обязательна для первого публичного маршрута. |
| P1 | Контракт и валидатор пилотного графа | Уникальные ID, типы рёбер и provenance; гипотезы не равны обязательным условиям. Проверить каждую связь и соответствие ресурсов; без изменений старых форматов. |
| P1 | Связанный пилот «дроби → линейные уравнения → возврат к возможному пробелу → новая задача» | Использовать существующие страницы дробей, Арженикова и /equations/linear-pilot/; вход, учебный материал, осмысленная попытка, помощь, возвращение, новый перенос, явная проверка; старые пути неизменны. |
| P1 | Предметная и техническая приёмка, добровольная апробация | Независимо решить условия и ключи, проверить альтернативные шаги, отсутствие лишних сетевых запросов, доступность, сохранение/откат. Малый пилот оценивает выполнимость, а не доказанный причинный эффект. |
| P2 | Расширение предметной системы, помощник и автономность | Только после приёмки первого маршрута. Подключать курсы 5–11 и экзаменационные цели через тот же контракт, отдельно проверять офлайн-пакеты, права и восстановление. |

Один активный предметный scope, одна ветка/PR, следующая задача после фиксации результата предыдущей. Блокированная работа сохраняется как Draft с причиной и не должна блокировать независимый бесплатный учебный путь. Периоды 0–30, 31–60, 61–90 дней из консультации — логические фазы, не сроки и не обязательство выпустить весь сайт. Текущая контрольная точка: base 85a9971123fc752390c63f9a59e4bcd1be40378e, кандидат #749 d453141806d11bcc0ad06b590e5c24f51925b23f перед этой корректировкой; дальнейший точный head — в PR. #740 и #747 опубликованы, SEO не останавливается. #749 не опубликован; тест целевого маршрута на предыдущем head прошёл, полный CI ещё выполнялся. #744 конфликтует с main; на #748 два сбоя по последней проверке. Не переносить прежние PASS на новые head.

### Решения по всем 12 стратегическим консультациям

| № | Что принимаем в работу | Что проверяем/откладываем |
| --- | --- | --- |
| 1 | Обратимый слой общей архитектуры поверх старых материалов | Не полный rewrite и не заявление о готовности системы |
| 2 | Стабильные навыки, отдельные графы, существующий реестр ресурсов | Сначала предметная валидация, не расширять #749 полной онтологией |
| 3 | Различать учебную роль страниц дробей, процентов, уравнений | Проверить фактическое содержание и запросы до объединения |
| 4 | Учебные входы по ошибкам и затруднениям | Альтернативные причины, тест переноса; не массовые посадки |
| 5 | Prezi как улучшение над доступной HTML-навигацией | Не делать анимацию обязательной |
| 6 | Контракт урока и связи с текущими ресурсами | Данные помощи и независимости только по принятому контракту |
| 7 | Воспроизводимый URL-аудит | 632 записи sitemap ≠ 281 страницы Яндекса; нет полного crawl и датированного GSC |
| 8 | Бесплатные самодостаточные уроки для ученика и преподавателя | Распространение после проверки; не обещать эффективность |
| 9 | Публичный HTML, математическая точность, источники и авторство | Разметка вторична; llms.txt только факультативный эксперимент |
| 10 | Версионированные автономные пакеты и связь с книгами | Проверить лицензии, хеши, локальный запуск и восстановление |
| 11 | Поиск, посещение и учебное свидетельство измерять отдельно | Без обязательной телеметрии; добровольность и приватность |
| 12 | Последовательная очередь, журнал и стоп-условия, сквозной пилот | Не выпускать под давлением календаря и не начинать новый каталог |

### Стоп-условия и откат

Остановка при критической математической ошибке, неверной ссылке, потере старой записи, смешении помощи и самостоятельности, неподтверждённом диагнозе, обязательном API, нарушении границы кабинета, недоступности с клавиатуры, красном CI или невоспроизводимом ZIP. Не менять URL или данные до обратимого плана. Для #749 откат — revert ограниченного входа; прежние страницы и данные остаются. После каждой задачи фиксировать точный base/head, diff, тесты, непроверенное и следующую позицию; не переносить старые подтверждения автоматически.

---

## Исторический roadmap after B2 (сохранён без изменений)

This roadmap describes order, not blanket authorization. Every item requires a
separate task specification, branch, PR, and explicit `START` under
[AGENTS.md](../AGENTS.md).

## Baseline

Trainer Registry B2 is complete on production `main`, as confirmed by code,
gates, and production evidence. [ADR 0001](adr/0001-trainer-bridge-platform.md)
has `Status: Proposed` and remains advisory unless a decision from it is fixed
by a separate approved scope. Its status is not evidence that B1 or B2 was
implemented. Current operational state is tracked in
[PROJECT_STATUS.md](PROJECT_STATUS.md).

## Ordered work

### 1. MathExam Workflow v1

Status: in progress as a docs-only change.

Move durable operating rules, status, review policy, task and PR templates, and
repeatable Codex skills into the repository. No production runtime or deployment
change belongs here.

### 2. Nested-path foundation

Status: not started.

Establish and verify path behavior needed by trainers below nested routes. Keep
the scope independent from adding a new mirror trainer.

### 3. Roads-grid third mirror proof

Status: not started.

Use roads-grid to prove that the platform can add a third mirror trainer through
the shared contract without new trainer-specific board or server core logic.

### 4. Inventory of unpublished trainers

Status: not started.

Create a verified inventory of trainers that exist locally or as drafts but are
not published. Classify readiness, ownership, path requirements, and adaptation
risk before scheduling batches.

### 5. Trainer Factory v1

Status: not started.

Define a repeatable creation and validation pipeline only after nested-path and
third-mirror evidence are available. Treat a new factory pattern as
`NEW_ARCHETYPE` review unless an accepted ADR narrows it.

### 6. Batch publication and adaptation

Status: not started.

Publish and adapt trainers in bounded batches. Each independently reviewable
batch receives its own task specification, branch, PR, tests, and rollback
description.

### 7. OGE course navigator

Status: planned, specifications ready.

Bring the OGE section to the same course mechanics as `ege-profil/`:
progress contract and registry, navigator, error journal, teacher cabinet,
exam mode, trainer batches. Decisions are recorded in
[ADR 0003](adr/0003-oge-course.md); the ordered task list is in
[OGE_COURSE_PLAN.md](OGE_COURSE_PLAN.md) and `tasks/OGE_COURSE_*.md`.
Each task still requires its own `START` and merge authorization.

## Sequencing constraints

- Do not start nested paths or roads-grid inside Workflow v1.
- Do not use plans or model advice to override code, gates, approved scope, or
  accepted ADRs.
- Reorder or combine roadmap items only with an explicit owner decision and an
  updated task specification.

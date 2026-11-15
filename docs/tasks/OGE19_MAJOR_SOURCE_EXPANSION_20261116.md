# ОГЭ №19: расширение по проверенным основным источникам

## Identity

- Task: `OGE19_MAJOR_SOURCE_EXPANSION_20261116`
- Owner: владелец MathExam, текущий разговор
- Date: 2026-11-16
- Base branch: `codex/oge19-source-coverage-20261116` (зависимость PR #626)
- Base SHA: `510ed4db531eaeb88bbd22507fa8492fdd4542a0`
- Remote main at start: `1469ad50a8659f66c8613164009e7387a3a68f2b`
- Planned branch: `codex/oge19-major-source-expansion-20261116`
- Review level: `NEW_ARCHETYPE`
- Related ADR: `docs/adr/0015-oge19-source-constrained-models.md`
- ADR status: Proposed for final archetype acceptance; implementation scope is separately approved by START.

## Goal

Добавить ровно 135 проверенных самостоятельных утверждений к подготовленным
244 карточкам, итог 379. Каждой новой карточке дать понятное доказательство или
контрпример, нейтральную интерактивную подсказку с сохранением условий и
проверяемое происхождение. Два конфликтующих с печатным ключом пункта исключить.

## Context and evidence

- Владелец ответил **START** на предложение «добавить 135 проверенных карточек
  №19 по карте аудита, доработать необходимые модели, два спорных пункта
  исключить». Это разрешает реализацию, commits, push и Draft PR.
- Аудит: 681 новое вхождение: Ященко 2027 — 108, открытый комплект, обозначенный
  Лысенко 2026, — 140, СтатГрад 15.04.2026 — 12, оригинальный Решу ОГЭ — 246,
  Repet.ai — 175. 40 веб-кандидатов + 102 книжных − 7 общих = 135 карточек.
- Карта и математика независимо рассмотрены. Существующие 244 карточки остаются
  основанием; исторические десять добавлений и 669 наблюдений PR #626 не меняются.
- При старте обе зависимости открыты и Draft: #626 head `510ed4db` (7 успешных
  workflow), #624 head `4f9fcec0` (11 успешных workflow). Новая ветка основана на
  #626; Draft PR будет направлен в его ветку, чтобы показать только новую задачу.
  Это не объединяет и не публикует зависимости. Удаление addon в #624 не повторяется.
- Сверка PROJECT_STATUS: последняя запись о №19 указывает 234 опубликованных
  утверждения. Публичные данные возвращают HTTP 200 и SHA256
  `fd71a70c1b3ce75922b6bd19043c7e735d5809af2cd5a1d2fa05db10b6f4d691`, что
  подтверждает эту запись. Новые 244/379 не объявляются опубликованными.
- Живой официальный банк ФИПИ не прочитан; итог не означает его полноту.
  Издание Ященко сверено по ISBN/выходным данным. Редакция Лысенко подтверждена
  индексом публичного комплекта, но ISBN внутри отдельных PDF не проверен.

## Approved scope

### In scope

- Ровно 135 новых ID из принятой карты, 379 карточек всего. Кванторы, отрицания,
  числовые условия и направление импликации сохраняются. Простые геометрические
  утверждения сопровождаются собственными объяснениями; коммерческие PDF/OCR
  и полный исходный книжный банк не помещаются в репозиторий.
- Дополнительные построения/режимы в действующем контракте моделей: симметрия,
  прямые и углы, треугольники, центры и расстояния, четырёхугольники, окружности,
  хорды и касательные. Старые режимы и их результаты сохраняются.
- Для фиксированных числовых данных интерактивное действие не меняет условие.
  Визуальная гипотеза не объявляется доказательством. Измерения скрыты до запроса.
- Отдельная конечная карта новых источников/соответствий и двух исключений,
  учебные ссылки, добавление новых canonical ID в общую карту прогресса.
- Адресные математические проверки, все относящиеся к №19 gates, реальные
  desktop/mobile/keyboard/offline сценарии, независимое рассмотрение результата.
- Только адресная сборка автономного HTML/ZIP №19.

### Planned files, declared before implementation

- `docs/tasks/OGE19_MAJOR_SOURCE_EXPANSION_20261116.md`
- `docs/adr/0015-oge19-source-constrained-models.md`
- `trainers/task19-visual-data.js`
- `trainers/task19-source-coverage.json`
- `trainers/task19-major-source-coverage.json` (новая карта этого расширения)
- `trainers/task19-visual-models.js`
- `trainers/task19-models-triangles.js`
- `trainers/task19-models-circles.js`
- `trainers/task19-models-lines-polygons.js`
- `trainers/task19-textbook-data.js`
- `trainers/task19-textbook/source.json`
- `oge/learning-map.js` — только 135 canonical ID, без изменения алгоритма
- `trainers/task19-trainer.html`, `trainers/geometry_statements_trainer_improved.html`
  — только версии изменённых ресурсов, если требуется для обновления кэша
- `tools/task19-major-source-expansion.test.cjs`
- `tools/task19-major-triangles.test.cjs`
- `tools/task19-major-circles.test.cjs`
- `tools/task19-major-lines.test.cjs`
- `tools/task19-major-polygons.test.cjs`
- `tools/task19-major-source-models.browser.cjs`
- Существующие `tools/task19-triangles.test.cjs`, `task19-circles.test.cjs`,
  `task19-lines-polygons.test.cjs`, `task19-math-audit.test.cjs`,
  `task19-source-coverage.test.cjs`, `task19-current-models.browser.cjs`,
  `task19-visual-hints.browser.cjs`, `task19-owner-feedback.test.cjs`,
  `task19-interactive-discoveries.test.cjs`, `task19-textbook-reference.test.cjs`,
  `task19-board.test.cjs` — точные новые ожидания и адресные проверки, сохраняя
  старые математические гарантии и исторические hashes
- `.github/workflows/task19-visual-hints.yml` — запуск нового адресного browser gate
- `downloads/trainers/task19-trainer/task19-trainer.html`
- `downloads/trainers/task19-trainer/task19-trainer-package.zip`
- `downloads/trainers-manifest.json` — только запись №19, результат генератора

Дополнительный fixture или учебный asset допустим только при выявленной прямой
зависимости. Конкретный путь и причина записываются здесь до изменения.

### Discovered direct dependency, declared before editing

- `assets/assistant/page-rollout.json` — только hash-привязка
  `trainers/task19-trainer.html` и штатная запись `sourceBindingUpdates`.
  Изменение версий шести ресурсов этой страницы закономерно делает прежний
  полный hash страницы неактуальным; без точной новой привязки штатная сборка
  останавливается с `Unbound public navigator dependency`. После отдельного
  коммита проверенных source-изменений применяется существующий
  `tools/public_navigator_bindings.py --source-base <that commit>` для одного
  пути. Код навигатора, его два include и проверки сохранности не меняются.
  Затем повторяются binding/preservation gates и адресная offline-сборка.
  Это обязательный provenance fixture для уже разрешённого обновления кэша.

### Out of scope / areas that must not change

- Прежние 244 объекта карточек, их aliases, порядок, ключи и формат прогресса.
- `trainers/task19-exam-source-coverage.json` и его исторические 669 наблюдений.
- Два спорных пункта Лысенко В26(2)/В34(2), дополнительные источники вне аудита.
- Frozen book editions, архивы, другие тренажёры, общие platform algorithms,
  аккаунты, backend и соседние работы гармонизации.
- Повторное удаление addon #624, merge/deployment либо изменение чужих веток.

## Acceptance criteria

- [ ] Ровно 135 новых карточек; все прежние 244 объекта/aliases сохранены.
- [ ] Все 681 новые позиции описаны; допустимые формулировки сопоставлены,
      два конфликтующих пункта явно исключены, ФИПИ completeness=false.
- [ ] У каждой новой карточки корректные условия, ответ, объяснение и полезная
      интерактивная подсказка; все разрешённые движения сохраняют предпосылки.
- [ ] Независимые координатные проверки подтверждают измерения, конструкцию,
      числовые данные, границы, восстановление и настоящие контрпримеры.
- [ ] Полный относящийся к №19 Node/browser набор и learning-map gates прошёл.
- [ ] Учебные ссылки проверены; автономные HTML/ZIP совпадают с онлайн-исходниками.
- [ ] ADR, прототипы и независимое рассмотрение представлены владельцу в Draft PR.

## Checks and gates

- `node --test tools/task19-*.test.cjs`
- `node --test tools/oge-learning-map.test.cjs tools/oge-course-guide.test.cjs`
- Синтаксис изменённых JS, JSON/schema, точный file allowlist, `git diff --check`.
- Существующие четыре browser suites №19 и новый адресный gate для 135 карточек.
- Сохранность старых sample/render/controls и проверка всех новых controls на
  минимум/середину/максимум, восстановление состояний, неверные сохранённые flags.
- `node scripts/build-trainer-downloads.mjs --only=task19-trainer --downloads-only`.
- Для указанного выше provenance fixture: стандартный preview/write
  `tools/public_navigator_bindings.py`, тесты binding/preservation и проверка,
  что изменена только одна hash-привязка, без расширения inventory.
- Final gate marker: pending. Невыполненный браузерный/реальный learner check не
  заменяется DOM-проверкой или выдуманным PASS.

## Review plan

- NEW_ARCHETYPE из-за новых геометрических построений, особенно симметрии.
- Перед реализацией: независимый обзор 41 веб-формулировки/40 карточек, 140
  книжных утверждений, семи межисточниковых совпадений и текущих API моделей.
- Во время разработки: чистые функции геометрии, отдельные проверки предпосылок,
  контрпримеров и сохранения исторических результатов.
- Готовый результат: независимое математическое/техническое и визуальное ревью.
- Реальные занятия с учениками не проведены и не будут объявляться проведёнными.
- Внешний provider review не запрошен; не выполнен, не имитируется.
- Новый ADR остаётся Proposed до принятия готового архетипа владельцем перед
  rollout. START разрешает описанную реализацию и прототипы, а не production.
- Handoff содержит только scoped diff, источники, результаты и точные SHA.

## Risk and rollback

- Риски: ложная эквивалентность, потеря числового условия, неподходящая модель,
  подсказка с готовым ответом, затронутый старый режим, неправильная учебная ссылка.
- Rollback: не выпускать Draft при проблемах; после отдельного выпуска отменять
  его delta обычным revert. Старые ID/формат localStorage не мигрируют.

## Permissions

- START: yes, прямое сообщение владельца после предложения 135 карточек.
- Branch, local commits, push, Draft PR: yes.
- Release authorization: более узкий AGENTS.md, присланный владельцем в разговоре.
- Merge: **no**. Auto-merge: **no**. Deployment: **no**.
- Force/reset/rebase/non-fast-forward merge: **no** без отдельного разрешения.

## Execution record

- Branch: `codex/oge19-major-source-expansion-20261116`
- Base: `510ed4db531eaeb88bbd22507fa8492fdd4542a0`
- Implementation: 379 карточек, ровно 135 additions; 681 наблюдение источников,
  679 сопоставлений и 2 исключения. Прежние 244 карточки/aliases и 2 151
  sample/render/control результата совпадают с исходной версией.
- Textbooks: 379 привязок, 58 тем; прежние 244 привязки, 54 темы и четыре
  записи книг сохранены по отдельным hashes. Добавлены восемь проверенных
  passages для четырёх тем в прежних изданиях.
- Source preflight: 156 проверок прошли; две проверки ещё старого скачиваемого
  HTML ожидают следующий обязательный шаг binding/build. Проверки не отключены.
  Первый source-коммит нужен штатному binding-инструменту; после него будут
  пересобраны HTML/ZIP и повторён полный gate без исключений.
- Independent internal review: triangles38, lines/symmetry39, quadrilaterals28,
  circles30. Проверки выполнялись другим автором/основным агентом; external
  provider verdict не заявлен. Закрыты замечания к доступности регуляторов,
  диапазону центра окружности и обозначениям равенства на рисунках.
- Prototype browser gate: 675 journeys (135 × main1280/main390/main320,
  alternate390 и offline390), точный банк/черновики/измерения/оценка один раз,
  keyboard/touch, SVG bounds и отсутствие сетевых зависимостей offline.
  Реальное выполнение ожидает Draft PR/CI; syntax/wiring уже проверены.
- PR/head/final gate: pending source commit, binding/build and CI.
- Scope deviations: none.

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

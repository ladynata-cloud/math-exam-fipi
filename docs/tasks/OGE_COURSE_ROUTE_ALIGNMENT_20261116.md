# MathExam task specification

## Identity

- Task: **H17 — OGE_COURSE_ROUTE_ALIGNMENT_20261116**
- Owner: владелец репозитория.
- Date: 2026-11-16, Asia/Novosibirsk.
- Base branch: `main`.
- Inspected base SHA: `beffcbe1895e45f8d243e12d250181ac2ce62e1a`.
- Approved branch: `fix/h17-oge-course-route-alignment-20261116`.
- Review level: **MEDIUM**.
- Related issue/PR: read-only reconciliation of #550 and merged #557; existing harmonization stage H17, followed by H18–H23.
- Related ADR: `docs/adr/0003-oge-course.md`, **Accepted**.
- Status: **START granted; scoped source and receipt locally verified; exact-head browser/CI pending**.
- Actual START base: `5f25f75b6e7178ad1d492c7bcb28ed9e63c97bae`, queried from authoritative remote main. The preparation SHA above is historical evidence. The intervening offline stereometry lesson does not overlap H17.

## Goal

Ученик одинаково понимает входы `/oge/` → `/trainers/oge-course/` → `/oge/skills/`: где выбрать любой из 25 номеров, где открыть короткую тренировку, где исследовать конкретную модель и где нужна собственная письменная работа. Используются существующие материалы и адреса. Публичная навигация не обещает полного курса или самостоятельного освоения по нескольким входным карточкам.

Это ограниченная навигационная часть H17. Она согласует карту, фактические назначения ссылок и границы форматов. Она не объявляет все темы методически обновлёнными и не завершает предметные H18/H20.

## Context and evidence

Verified against inspected main:

1. `oge/skills/course-data.json` содержит 26 тем (основы + №1–25), 177 навыков, 180 обычных карточек и 121 мастерскую; `series-catalog.json` — 46 семейств и 64 маршрута. Это не заявление о полноте официального банка.
2. На обеих входных страницах уже есть 25 ссылок на основные тренажёры и 26 коротких входов `?topic=...`. Не нужно создавать новый банк, новый runtime-реестр или новые страницы тем.
3. `?topic=n11` открывает обычную практику. Подпись «Разобраться глубже» и призыв начать с графиков не объясняют этот факт. Все обычные входы должны иметь честные названия.
4. Действующий движок уже поддерживает прямую ссылку на конкретную мастерскую через `route=task:<id>`. Четыре назначения ниже открыты в JSDOM и подтверждены по actualTask, actualTopic и type, без изменения исходников:

| Тема | Подпись исследования | Existing destination | Existing type |
| --- | --- | --- | --- |
| №10 | Настроить вероятность на барабане | `/oge/skills/?topic=n10&route=task:n10-c1` | probability |
| №11 | Построить прямую через две точки | `/oge/skills/?topic=n11&route=task:n11-c1` | graph |
| №15 | Проверить, из каких сторон получается треугольник | `/oge/skills/?topic=n15&route=task:n15-c-triangle-gate` | triangleGate |
| №17 | Наклонить параллелограмм и сравнить площадь | `/oge/skills/?topic=n17&route=task:n17-c-tilt-area` | tiltArea |

5. Вторая часть карты явно проверяет отдельные учебные шаги (`assessment: written-steps`), а полное письменное решение требует отдельного разбора.
6. PR #557 объединён; squash `96466665da8d8c4052040adf5c1f7ad92ffb20e5`. Его карты уже в main. PR #550 открыт Draft, inspected head `f9f0e0f70731c1bb3ec2b35da63e692bd9d8931a`; материал №11/22/24 требует отдельной сверки, не автоматического переноса.
7. До START read-only gates уже прошли: data 4 023, practical 1 361, second part 4 674, registry 2 467. Это исходное состояние, не проверка ещё не существующего изменения.

## Approved scope

Владелец явно дал START для этого ограниченного объёма H17 в текущем разговоре. Реализация, проверки и передача результата относятся только к нему.

### In scope

1. Согласовать подписи и смысл существующих блоков двух входных страниц. Сохранить полную карту №1–25, отдельный вход в основы, восемь практических сюжетов №1–5, кабинеты, варианты и возвраты.
2. Обозначить существующие `?topic=...` как короткую тренировку/проверку отдельных шагов. Не называть четыре задания всей подготовкой к номеру.
3. В существующем блоке выбора занятия поставить понятный необязательный путь «Исследовать модель» перед объясняющим текстом и тренировочными действиями. Он содержит **ровно четыре проверенных тематических назначения** из таблицы выше. Подписи называют конкретное действие, а не обещают готовый исследовательский курс по любому номеру.
4. Сохранить прямую обычную практику явным доступным выбором. Существующие 26 `data-oge-skill-topic` ссылки и их `?topic=...` адреса остаются прежними; новые исследовательские ссылки получают отдельный атрибут, не смешиваются с прежними.
5. Для №20–25 дать короткое различение: «потренировать шаги» и «записать полное решение». Ссылки ведут в существующие карточки и основные тренажёры; полная письменная работа не получает новую автоматическую оценку.
6. Привести главный вход №11 к честной подписи: либо явно «Короткая тренировка по графикам», либо «Исследовать прямую» с точным подтверждённым маршрутом из таблицы. Реализация выбирает второй вариант как основной исследовательский вход; старый тренировочный адрес сохраняется в карте.
7. Внутренний отчёт фиксирует для всех 25 номеров существующий основной тренажёр, вход в короткую практику, известную исследовательскую опору или непроверенный пробел, формат результата, следующую задачу H18–H23. Это снимок доказательств со ссылками на существующие источники, **не новый источник runtime-данных**.
8. Read-only сверить дельту #550 с фактическим main на момент задачи. Для №11/22/24 и карты перечислить: уже есть в main / отсутствует / требует согласования / не проверено. Указать точные SHA и ссылки; никакого cherry-pick, merge, изменения ветки или авто-переноса.
9. В отчёте закрепить следующий пилот H20: линейная функция №11, исследование k и b и честный учёт помощи. Зафиксировать оставшиеся условия старта и disposition #550; не считать это реализацией пилота или отменой зависимостей.
10. Дополнить существующие статические/DOM и браузерные проверки только новыми сценариями навигации и сохранности. Использовать существующий workflow OGE skill course.
11. Обновить существующий navigator receipt штатным helper только для изменённого `trainers/oge-course/index.html`. `oge/index.html` уже находится в `existingPages`; не добавлять его в `addedPages` и не пересоздавать инвентарь.
12. На старте сверить PROJECT_STATUS с актуальной production evidence; добавить одну запись о данной задаче в том же PR, не создавать отдельный рекурсивный status PR.

### Exact file allowlist

Разрешены изменения только этих **8 путей**:

1. `docs/tasks/OGE_COURSE_ROUTE_ALIGNMENT_20261116.md` — эта спецификация и execution record.
2. `docs/reports/OGE_COURSE_ROUTE_ALIGNMENT_20261116.md` — проверенная карта назначений, пробелы H18–H23 и read-only delta #550.
3. `docs/PROJECT_STATUS.md` — одна относящаяся к задаче запись; остальные записи сохраняются.
4. `oge/index.html` — только тексты и обычные ссылки в hero/существующих блоках выбора занятия, исследования и тем; без изменения inline-движка, моделей главной и внешних script/style зависимостей.
5. `trainers/oge-course/index.html` — только тексты и ссылки существующих блоков выбора занятия/тем/второй части; без изменения inline-движка, встроенной копии CSS и script/style зависимостей.
6. `tools/oge-skill-course.test.cjs` — дополнительные проверки новых ссылок, корректных topic/task и прежних маршрутов; существующие assertions не удалять и не ослаблять.
7. `tools/oge-skill-course.browser.cjs` — дополнительные реальные переходы, клавиатура и layout для новых ссылок; прежние сценарии сохраняются.
8. `assets/assistant/page-rollout.json` — только штатное обновление binding страницы курса и записи provenance по реальному source commit.

Если полезное изменение требует другого файла, оно остаётся вне данной задачи до отдельного решения. Для существующего учебного контента allowlist не расширяется по факту неудачного теста.

### Out of scope

- Изменение учебных карточек, формул, генераторов, hints, проверяющих функций или порядка 64 существующих маршрутов.
- Превращение всех optional workshops в обязательный/default режим.
- Реализация H18/H20: порядок доказательства, точные параметры №22, учёт помощи и mastery №11.
- Новый учебный банк, новый runtime-реестр или новый публичный раздел.
- Объединение/миграция статистики, синхронизация с кабинетом, новые счётчики или заявления об освоении.
- Изменение существующих готовых скачиваемых ZIP, замороженных книг, серверов, протоколов доски, CI policy.
- Фактическое изменение/объединение PR #550.
- Merge и deployment.

### Files or areas that must not change

`oge/skills/**`; `oge/registry.js`; `oge/learning-map*`; `oge/course-guide*`; `oge/progress-adapters.js`; все native trainer HTML/JS вне единственного `trainers/oge-course/index.html`; `assets/oge-*`; `oge/skill-course-entry.css`; `downloads/**`; `book/**`; `b/**`; `learning/**`; backend; scripts of generators; existing tests/gate fixtures outside the allowlist.

## Acceptance criteria

- [x] На обеих входных страницах есть все 25 номеров без пропусков/дубликатов; существующие назначения основных тренажёров совпадают и не меняются.
- [x] Все 26 коротких входов, включая основы, сохранены; их подписи не обещают полного банка или курса по четырём карточкам.
- [x] Ровно четыре исследовательские ссылки открывают указанные topic и task; из №11 открывается именно прямая, из №17 — параллелограмм.
- [x] Исследовательский выбор виден раньше тренировочного в обновлённом блоке. Он необязателен и не меняет default старых прямых ссылок.
- [x] Никакая другая тема не получает случайную модель вместо отсутствующего исследования; пробел фиксируется только во внутреннем отчёте.
- [x] №1–5 не получают ложного универсального соответствия «номер → единственный сюжет».
- [x] Для №20–25 выбранные шаги и полное письменное решение различены коротко и честно.
- [x] Существующие возвраты к курсу/главной, кабинет, прямые тренажёры и PDF доступны; новые ссылки не сбрасывают существующие результаты.
- [x] H17 не добавляет записи в прогресс и не переносит старые счётчики; штатное сохранение контекста уже существующим движком назначения остаётся прежним.
- [x] HTML остаётся навигационно полезным без JavaScript; длинные списки изначально свернуты.
- [ ] Chromium 320×900, 390×900, 1280×900: новая навигация без горизонтального переполнения, ссылки доступны с клавиатуры, фокус видим; просмотрены ключевые снимки.
- [x] Ни один математический/проверяющий/генерирующий/хранящий код не изменён; CSS/JS dependency closure страницы курса прежний.
- [ ] Existing assertions and required gates pass. Новый PASS не маскирует отсутствующий browser run.
- [x] Read-only delta #550 записана на точных текущих SHA. Выбор следующего H20 отделён от его START/реализации.
- [ ] H17 навигационная часть отмечена выполненной только после проверенного PR; полнота предметной гармонизации не приписывается этому этапу.

## Checks and gates

Commands run from repository root, with jsdom/playwright available as documented by existing CI.

### Required tests and static checks

- `node --test tools/oge-skill-course.test.cjs`
- `node --test tools/oge-learning-map.test.cjs tools/oge-course-guide.test.cjs`
- `node oge/tests/registry-test.js`
- `node oge/skills/validate.js`
- `node tools/oge-learner-entry.test.cjs` — fetch its existing immutable preservation sources first; do not replace them with current main.
- `node tools/oge-focus-navigation.test.cjs`
- `node --test tools/public-navigator-preservation.test.cjs`
- `python3 tools/public_navigator_bindings.test.py`
- `python3 tools/book-edition/test_generator.py`
- `python3 tools/book-edition/test_package.py`
- `python3 tools/book-edition/verify.py --base <actual-task-base-sha>`
- `git diff --check`
- Exact allowlist and unchanged blobs for all protected areas; same external dependency closure and unchanged embedded CSS for course index.

The source-binding helper is used after a real reviewed source commit:
`python3 tools/public_navigator_bindings.py --source-base <source-commit-sha> --task docs/tasks/OGE_COURSE_ROUTE_ALIGNMENT_20261116.md --paths trainers/oge-course/index.html --write`.
Do not fabricate source commits, rewrite prior receipts, or treat the helper as approval.

### Required browser checks

- `node tools/oge-skill-course.browser.cjs` — existing suite plus the four new deep-link destinations from both entry pages and returns, three viewport widths, keyboard, retained legacy storage.
- Existing triggered OGE learning map / learner entrances workflows remain required.
- Visual review of entry controls and each linked model; JSDOM alone does not establish layout.
- If local Chromium is unavailable, perform the existing GitHub CI browser gate after the authorized Draft PR push. Report it as not run until its exact-head result exists.

### Gates intentionally not expanded

No new full mathematics audit, pupil experiment, backend/server/cabinet tests or offline ZIP rebuild: their implementation bytes do not change. Existing CI triggered by changed paths is not disabled. Frozen-book checks remain because the course entry is a source of future books.

### Final gate marker

`OGE_COURSE_ROUTE_ALIGNMENT_OK` — only after all applicable local and exact-head CI checks above pass and the final diff is reviewed.

Live post-release byte checks are deferred until separate merge/deployment authorization. An audited local snapshot or Draft PR is not publication.

## Review plan

- MEDIUM: bounded user-visible navigation changes; no persistence or server contract changes. An expansion into counters, runtime teaching or shared protocol invalidates this level and this scope.
- Trainer design consultation: no new trainer or new interaction archetype; focused pedagogical review of names, destinations and distinction between research/practice/writing is required.
- Before implementation: verify the four supplied models really match the promised mathematical action. Reuse current source data; do not attribute unseen external audits.
- Ready-result review: independent check of all 25 destinations, four exact model routes, 20–25 labels, unchanged storage and boundary between H17 and H18/H20.
- External provider review: not performed at preparation; no provider verdict claimed. A copied marker is not external review.
- Sanitized handoff: relevant public diff/task, exact base/head, tests; no personal data, credentials, private documents or machine-specific paths.

## Risk and rollback

- Main risk: a label may imply more learning coverage than the linked resource has. Mitigation: concrete action labels and explicit distinction between short steps and full written work.
- Route risk: a broadly labelled topic could open the wrong saved state. Mitigation: exact known task route; test fresh and restored sessions.
- Concurrent-work risk: #550 and other branches touch course HTML and manifest. Preserve their branches; do read-only comparison; no automatic composition.
- Compatibility: all existing keys, TID, native/skills banks, ordinary query routes and dependencies remain unchanged.
- Rollback: a separately authorized revert of this task delta restores only two navigation pages, new tests/docs and receipt. No student-data reversal or migration is needed.

## Permissions

- `START` granted by owner in the current task conversation: **yes**, H17 on 2026-11-16 (Asia/Novosibirsk).
- Branch creation: authorized; the task branch was created from the verified START base.
- Local commits, push, Draft PR: authorized for this scope under the supplied AGENTS.md. The implementation agent hands the source to the coordinating reviewer before commits; the coordinator records the actual source commit before the receipt helper.
- Merge, auto-merge, deployment: **no**; require separate explicit owner authorization.
- The user's AGENTS.md in this session is stricter than the repository's standing-release text and governs this task.
- No force/reset/rebase/non-fast-forward merge/admin override/disabled TLS.
- Base drift is handled according to the supplied AGENTS.md, not widened by copied permission markers.

## Execution record

- Actual branch: `fix/h17-oge-course-route-alignment-20261116`.
- Actual base SHA: `5f25f75b6e7178ad1d492c7bcb28ed9e63c97bae`; clean worktree verified at START.
- Actual source SHA: `9c6689d731813e9b89d246668fbaff5f2b95a0a6`; tree `c0dced67ade310490dee4d9862d70aa87f5bd3a1`, parent `5f25f75b6e7178ad1d492c7bcb28ed9e63c97bae`. The final reviewed head is recorded in the PR handoff; this scope record does not claim a self-referential final SHA.
- PR: recorded in the implementation handoff after the authorized Draft PR is opened.
- Commits: source `9c6689d731813e9b89d246668fbaff5f2b95a0a6`; subsequent binding/evidence commit is recorded in the PR handoff.
- Preparation evidence: 4 existing gates passed; four exact model deep links resolved in JSDOM.
- Implementation tests passed: skill-course DOM 19/19; learning-map/course-guide 22/22; registry 2 467; skill data 4 023; focus 530 links; learner entry 147 documents / 133 bars / 1 695 links on the unchanged pinned preservation sources; binding-helper unit 5/5; public-navigator preservation 4/4; source helper BINDINGS_UPDATED then BINDINGS_CURRENT on the real source commit with HTML files written 0; book generator 16/16; book package 16/16; frozen-book integrity for both editions; syntax, diff whitespace, unchanged scripts/styles and 25/26/8 links. Independent local review repeated DOM 19/19 and found no blocking source issue.
- Setup limitations resolved: unchanged download destinations and immutable baseline blobs were materialized from their exact Git sources; repeated learner/focus/generator checks passed. Initial missing-file runs were not counted as PASS. Navigator preservation passed after the real source-binding receipt. The only modified receipt page is `trainers/oge-course/index.html`; existing inventory and old receipts are preserved. Full details and final outcomes are in the companion report.
- Tests not run locally: Chromium and rendered screenshot review. The existing CI browser gate is required on the actual PR head. Exact-head CI and post-release live checks are not claimed by local DOM results; merge/deployment remain unauthorized.
- Current read-only PR #550 snapshot: `d77ba80bf2c5379b3658a211abd55b428c7657cb`, base `5f25f75b6e7178ad1d492c7bcb28ed9e63c97bae`; the earlier head in preparation evidence is historical.
- Production at START: `oge/index.html` and `trainers/oge-course/index.html` both returned HTTP 200 on 2026-11-15T20:14:25Z and matched the base bytes; hashes are in the companion report.
- Scope deviations: none.

## Required handoff

```text
EXECUTIVE STATUS

Task: H17 — OGE_COURSE_ROUTE_ALIGNMENT_20261116
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

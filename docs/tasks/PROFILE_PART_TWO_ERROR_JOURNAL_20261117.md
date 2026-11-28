# История ошибок второй части ЕГЭ профиль

## Identity

- Task: `PROFILE_PART_TWO_ERROR_JOURNAL_20261117`
- Owner: MathExam
- Date: 2026-11-17
- Base branch: `main`
- Base SHA: `b4c58e153fb6e4041c9bc69fb304f0de77582e98` (main после #600)
- Planned branch: `fix/profile-part-two-error-journal-20261117`
- Review level: `MEDIUM`
- Related task: [PROFILE_FIPI_2027_ALIGNMENT_20261115](PROFILE_FIPI_2027_ALIGNMENT_20261115.md)
- ADR: none

## Goal

В журнале ученик видит, какие условия второй части стоит повторить, какие ошибки уже исправлены, и может сразу вернуться к сохранённому условию.

## Context and evidence

- `ege-profil/review.html` показывает историю START, ошибок прежних подборок и потерь последнего `full-exam`.
- Пробник 2027 из #647 хранит отдельную ветку `full-exam-2027-v1`. Завершённая попытка хранит дату, итог, `test: null` и 19 оценок по заданиям. Отдельный признак выставленной письменной оценки и исходные краткие ответы отсутствуют.
- `ege-profil/part-two/state.js` хранит проверяемые попытки по ключу `mathExam.profile.partTwo.v1.<taskId>`. Ограниченная история содержит первую и до 59 последних попыток. Поля черновика и признаки результата сохраняются независимо от журнала.
- Утверждённая карта `ege-profil/exam-map.js` связывает внутренние номера, официальные номера 2027 и дополнительные темы. Ключи хранения и ссылки используют идентификаторы условий.

## Approved scope

### In scope

- Раздел в `review.html`, изолированный обработчик только для чтения, регрессии состояния и сценария в реальном браузере.
- Привязка одного изменённого публичного HTML в `assets/assistant/page-rollout.json` к исходному коммиту из цепочки PR.
- Журнал показывает последнюю полную сохранённую попытку ЕГЭ 2027. Нули короткой части показывают потери баллов. Положительные письменные баллы показываются как самооценка, а нули остаются к проверке, поскольку старая запись объединяет выставленный ноль и отсутствие оценки. Маршрут каждой темы вычисляется по официальной карте.
- Доверенный перечень условий из трёх опубликованных банков второй части. Подпись по карте 2027. Ссылка ведёт в режим по шагам для ошибки шага и в форму итогового ответа для ошибки итога.
- Строка на условие. Ошибка остаётся к повтору до верного ответа соответствующего шага или верного итогового ответа. Новый промах снова открывает условие. Число промахов относится к сохранённому следу.

### Out of scope

- Автоматическая оценка доказательства, изменение зачёта курса, перенос или очистка сохранений.
- Публикация банка H12, запись истории и изменение шкал пробников.

### Files or areas that must not change

- Состояние и маршруты `part-two`, `START`, `full-exam` и отдельного пробника 2027. Обработчик очистки прежних подборок.

## Acceptance criteria

- [x] Найденные по доверенному каталогу ошибочные попытки разделены на «К повтору» и «Исправлено». Старые, повреждённые и неизвестные записи обрабатываются независимо.
- [x] В журнале нет сырых ответов и черновиков. Подпись и ссылка формируются из поставляемого условия.
- [x] Загрузка журнала до и после исправления сохраняет все значения `localStorage` побайтно. При пустом namespace банки заданий не загружаются.
- [x] После завершения пробника 2027 журнал обновляется в соседней вкладке, сохраняет отдельные результаты 2026 и восстанавливает тот же разбор при перезагрузке.
- [x] Вернуться к условию и исправить ответ можно при ширине 320, 390 и 1280 пикселей.

## Checks and gates

- Required tests: `node --test tools/profile-part2-*.test.cjs`, `node --test tools/profile-progress-report-dom.test.cjs`, `npm --prefix ege-profil test`.
- Required static checks: `git diff --check`, проверка синтаксиса нового JavaScript и шлюзы сохранности исходников публичного навигатора.
- Manual checks: проверка снимков нового раздела, фактических переходов и неизменности исходного хранилища на трёх ширинах Chromium. Сам браузерный тест входит в `profile-part2-*.test.cjs` в CI, локально включается `H02_NATIVE_BROWSER=1`.
- Final gate marker: `PROFILE_PART_TWO_REVIEW_LOCAL_OK` после выполнения проверок.
- Checks intentionally not run: production HEAD и живая публикация вне локальной задачи.

## Review plan

- Review-level rationale: новый статус в интерфейсе зависит от последовательности реальных сохранённых попыток. Требуется проверить повторное открытие, сохранность черновика и отсутствие побочного зачёта.
- Trainer design consultation applicable: no. Работа показывает уже сохранённые результаты в журнале.
- Before implementation: прочитаны обработчики отправки итогового ответа и шагов, валидатор, карта, старый журнал и его регрессии.
- Ready-result review: браузерный переход проверяет путь от реального учебного промаха к повтору и исправлению. Отдельные регрессии проверяют известные и неизвестные ID, раздельную историю шага и итогового ответа, черновик и старый пробник.
- External review required: no under the standing owner policy.
- Sanitized handoff constraints: только синтетические браузерные записи и локальный git-коммит.
- Required provenance if external review is used: not applicable.

## Risk and rollback

- Main risks: перепутать старый и официальный номер, принять повреждённую запись, посчитать черновик за попытку, скрыть старый журнал при сбое импорта банка. Отдельные проверки покрывают эти случаи.
- Rollback plan: отменить коммит. Удаление читающего раздела не требует восстановления данных.
- Data or compatibility considerations: письменный банк H12 подключается лениво через `ProfileFinanceWrittenLessons` с подписью `ProfileExamMap.label(16)`. Старый `exam: 16` по-прежнему относится к неравенствам, которые обозначаются как №15. Условия `h12-*` используют прежний ключ состояния и переход `#task/<id>`. Из пробника №16 открывается письменный практикум.

## Permissions

- `START` granted by owner in the current task conversation: yes.
- Branch creation allowed: yes.
- Local commits allowed: yes.
- Push and Draft PR allowed after the #600 merge to `main` and exact local validation.
- Merge, auto-merge and deployment: outside the current scope. Later release coordination follows #647, #648 and H05.

## Execution record

- Actual branch: `fix/profile-part-two-error-journal-20261117`
- Actual base SHA: `b4c58e153fb6e4041c9bc69fb304f0de77582e98`
- Actual head SHA and commits: in the Draft PR.
- PR: Draft handoff.
- Tests passed: исходная регрессия второй части и отчёта — 193 проверки, отдельный запуск H01 в Chromium — 27 случаев. После уточнения ссылок прицельный прогон — 8 проверок, включая возвращение к шагу и раннему итоговому условию на мобильном. `npm --prefix ege-profil test`, синтаксис новых файлов и `git diff --check` прошли. Результаты перепроверки на опубликованной основе #600 закрепляются в Draft PR.
- Tests failed: none in the completed gates.
- Tests not run: production deployment and live HEAD.
- Scope deviations: none.

### Пробник ЕГЭ 2027

- Локальная проверка на опубликованном #647 `a7ae9b353993b936ab5b0ed11bd84560abe97c14`.
- 13 проверок журнала, сохранений и обоснований, 5 проверок самой пары редакций пробника и `npm --prefix ege-profil test` прошли. В Chromium на 320, 390 и 1280 px проверена реальная запись ошибочного краткого ответа, положительной письменной самооценки, письменного нуля и отсутствующей отметки. Снимок всех локальных данных при чтении и перезагрузке совпал побайтово.
- Дополнение подготовлено отдельным локальным коммитом для проверки на актуальной общей базе.

### Письменный банк №16

- На опубликованной основе #653 `1d585e3e708fbe8f3ab07081073bcbe83e1ac72e` проверены реальные ошибка, возврат к тому же условию и исправление ответа по письменному №16. Прежние неравенства остаются в журнале со своим официальным номером.

## Required handoff

```text
EXECUTIVE STATUS

Task: PROFILE_PART_TWO_ERROR_JOURNAL_20261117
PR: Draft handoff
Base: b4c58e153fb6e4041c9bc69fb304f0de77582e98
Head: see Draft PR
Gate: PROFILE_PART_TWO_REVIEW_LOCAL_OK
Tests: see execution record
Failures: see execution record
Not run: deployment and production verification
Scope deviations: none
Recommendation: keep Draft until the coordinated release sequence
Next user decision: none for draft preparation
```

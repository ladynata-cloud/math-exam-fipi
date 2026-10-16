# Стерео: таблица «было / стало» 17 условий — из опубликованной спецификации в `_istochniki`

## Identity

- Task: STEREO_WORDING_TABLE_UNPUBLISHED
- Owner: Наталья Михайловна (ladynata-cloud)
- Date: 2026-09-28
- Base branch: main
- Base SHA: 4c7d4fae3aa84919be575101fb1cb8eeffb1e447 (4c7d4fa, после #136)
- Planned branch: docs/stereo-wording-table-unpublished
- Review level: `SMALL` — документы, комментарий шапки `engine.js` и
  пересборка `data.js` без изменения кода и банка; id, условия, ответы,
  сцены и ключи прогресса не трогаются; откат — revert одного коммита.
  Уровень предложен делегатом владельца, окончательно решает владелец
- Related issue or ADR: нет; продолжение `docs/tasks/STEREO_OWN_WORDING_17.md`
  (PR #136)
- ADR status, if applicable: —

## Goal

PR #136 переписал 17 условий линейки стереометрии своими словами: прежние
повторяли шаблоны текста открытого банка (Решу ЕГЭ) с другими числами, а
у `par-35` — задание 2 демоверсии-2027. Канон CLAUDE.md: «Не воспроизводить
дословно официальные КИМ, демоверсии ФИПИ и задачники». Но спецификация
`docs/tasks/STEREO_OWN_WORDING_17.md` раздаётся GitHub Pages, и её раздел
«Было / стало» приводил все 17 прежних условий рядом с новыми — после #136
это было единственное опубликованное место на сайте с этими текстами.
Задача: убрать прежние тексты с сайта, сохранить пары «было/стало» для сверки
в неопубликованной папке `ege-profil/_istochniki/` и поправить указатели,
которые обещали эти тексты в спецификации.

## Context and evidence

Проверено по дереву 4c7d4fa и запуском.

1. **Что публикуется.** В корне нет `_config.yml` и `.nojekyll`, в
   `.github/workflows` только `claude-generate.yml`; `CNAME` —
   `mathexam.space`. Сайт собирает Jekyll по умолчанию: пути, начинающиеся
   с `_` или `.`, пропускаются, `.md` из `docs/` отдаются как страницы.
   `ege-profil/_istochniki/README.md:3` — «Папка не публикуется».
   `Dockerfile`, `render.yaml`, `amvera.yml` собирают только `board-server`,
   статику сайта они не раздают. То, что страницы `docs/tasks/*.html`
   отвечают на сайте (пример в постановке — `EGE_PROFIL_ARCHIVE_MERGE.html`,
   200), взято из постановки задачи, здесь по сети не проверялось.
2. **Где жили прежние тексты.** Одноразовый скан всех публикуемых файлов
   рабочего дерева (отслеживаемые и новые неигнорируемые, ни один компонент
   пути не начинается с `_` или `.`: 852 файла, 725 текстовых) по 17 прежним
   условиям и двум цитатам заданий демоверсии-2027 из
   `stereo-bank/audit/sverka.md` (пробелы, тире, подстрочные цифры и «ё»
   нормализованы): до правки — 17 попаданий, все в
   `docs/tasks/STEREO_OWN_WORDING_17.md` (таблица «Тексты»), цитаты
   демоверсии — 0.
3. **Тексты таблицы верны.** Все 17 ячеек «было» побайтно равны `cond`
   из `problems-<тема>.js` на be2740b (`git show`), все 17 ячеек «стало» —
   `cond` в опубликованном `ege-profil/trainers/stereo/js/data.js`.
4. **Указатели на тексты «было/стало» в спецификации:**
   `ege-profil/trainers/stereo/README.txt:28–29` (читают учителя),
   комментарий шапки `ege-profil/_istochniki/stereo-bank/engine.js:24–25`
   → `data.js:24–25`, `ege-profil/_istochniki/README.md:94–95`,
   `ege-profil/_istochniki/stereo-bank/SPEC.md:67–68` (говорил, что тексты
   «в `../README.md`» — там только список), критерий приёмки
   `STEREO_OWN_WORDING_17.md:293–295`, запись 26.09
   `ege-profil/SITE-CHANGES.md:201–202`.
5. **`data.js` правится только пересборкой.** `sync-data.js --write`
   собирает его из `engine.js`, `engine-legacy.js` и `problems-*.js`;
   `sync-data.js` без ключа сравнивает сборку с выложенным файлом и
   завершается с кодом 1 при расхождении. Прецедент — находка F1 ревью #136
   (шапка ссылалась на список, которого уже не было), исправлена так же.
6. **Место для такого материала уже есть.** `stereo-bank/audit/sverka.md`
   цитирует задания демоверсии; `problems-legacy-*.js` держат 143 текста
   открытого банка дословно. Забота канона — сайт, а не публичный
   репозиторий.
7. **Прежнего текста `par-34`** в истории `problems-par.js` нет: в `main`
   файл появился в f1eb112 (#128; на ветке архива — 78672a2) уже с новой
   редакцией.
8. **Другие опубликованные документы.** По решению 4 (ниже) — проверка
   по нормализованным 45-символьным префиксам (уточнена по ревью, N3):
   на 4c7d4fa вне двух `data.js` префиксы `cond` из
   `problems-legacy-*.js` (28 из 143) и префикс цитаты 2 демоверсии
   (через прежний текст `par-35`) были только в
   `STEREO_OWN_WORDING_17.md`, префикса цитаты 1 не было нигде; после
   правки — нигде. Сам исполнитель прогнал полные тексты
   17 прежних условий и двух цитат (п. 2). Попутно: первые 45 символов
   обеих цитат демоверсии совпадают с началами задач открытого банка в
   обоих `data.js` (`ege-profil/trainers/stereo`,
   `trainers/ege-profile-stereometry-3d`) — это 143 задачи, перенесённые
   дословно по решению владельца (#128), не находка.

## Решения (28.09.2026, делегат владельца — Fable)

Решения приняты делегатом владельца и выполнены как есть.

0. **Постановка верна**, с уточнениями: выбрасывать старые тексты совсем —
   не вариант (решение 1); ссылку в `README.txt` и шапке `data.js` не
   перенацеливать, а переформулировать (решение 3); в объём входят ещё
   `ege-profil/SITE-CHANGES.md` и строка таблицы `audit/` в
   `_istochniki/README.md`. Закрывать весь `docs/` через `_config.yml` —
   решение уровня сайта, не эта задача; `.nojekyll` недопустим — он
   выключит Jekyll и опубликует всё под `_`.
1. **Переносить, не выбрасывать.** Новый файл
   `ege-profil/_istochniki/stereo-bank/audit/svoimi-slovami.md`: раздел
   «Было / стало» спецификации целиком и дословно (метрика, таблица
   сходства, итог, таблица текстов, замечание о форме `kon-04`/`kon-05`/
   `kub-13`) под датированным заголовком, плюс шапка: что это, когда
   перенесено, почему здесь, как сверено; следующие переписывания
   (кандидаты `kon-14`, `cil-01`, `kon-01`) — новым датированным разделом
   в этом же файле. Прежний `par-34` не восстанавливается, цитата
   демоверсии не повторяется (она в `sverka.md`).
   *Почему:* «выбросить» сделало бы ложными пять указателей и критерий
   приёмки #136, по которому владелец принимала тексты; числа сходства без
   текстов непроверяемы (скрипт вне репозитория, «было» — только в git на
   be2740b); имя — по соседям (`sverka.md`, `fipi-types-a.md`), без дат
   и чисел, чтобы не плодить файлы.
2. **В опубликованной спецификации остаются** метрика, таблица сходства
   с id шаблонов и числами до/после, итог, замечание о форме и таблица
   текстов с одной колонкой «стало». На месте колонки «было» — абзац
   фактом: прежние условия не приводятся, почему, где они сохранены.
   Критерий приёмки 293–295 переписан под новый адрес; в Execution record —
   датированная запись 28.09.2026. История спецификации (решения 1–10,
   находки F1–F4/R1–R3, записи 26.09) не переписывается: спецификация
   ведётся как журнал.
   *Почему:* новые тексты свои и уже опубликованы в `data.js`, а решения
   п. 1–8 ссылаются на их обороты; числа сходства и номера шаблонов текста
   не содержат и доказывают критерий «сходство заметно ниже прежнего».
3. **`README.txt` и шапку `data.js` менять оба — переформулировать:**
   «(список — ege-profil/_istochniki/README.md, обоснование и сходство
   с шаблоном до и после — docs/tasks/STEREO_OWN_WORDING_17.md)»; слова
   «тексты „было/стало“» убраны. `engine.js` → `sync-data.js --write` →
   ворота. Заодно неопубликованные указатели: `_istochniki/README.md:94–95`
   и строка `audit/` (24), `SPEC.md:67–68`.
   *Почему:* после переноса прежний указатель стал бы ложным (как F1 в
   #136); учителям шаблоны открытого банка не нужны, и сайт не должен их
   туда отправлять.
4. **Другие опубликованные документы не правятся**, отдельная задача не
   нужна: цитат не найдено (п. 8 контекста). 143 задачи открытого банка
   в двух `data.js` — принятая практика (#128, `README.txt`: «перенесены
   дословно», у каждой ссылка на Решу ЕГЭ), не трогаются. Граница
   проверки — тексты стереобанка и демоверсии-2027; другие линейки не
   аудировались.

## Approved scope

### In scope

- `docs/tasks/STEREO_OWN_WORDING_17.md` — раздел «Было / стало»: колонка
  «было» убрана, абзац-пояснение; критерий приёмки о шапке `data.js`
  и `README.txt`; датированная запись в Execution record.
- Новый `ege-profil/_istochniki/stereo-bank/audit/svoimi-slovami.md`.
- `ege-profil/_istochniki/README.md` — строка 24 (таблица `audit/`)
  и строки 94–95.
- `ege-profil/_istochniki/stereo-bank/SPEC.md` — строки 67–68.
- `ege-profil/_istochniki/stereo-bank/engine.js` — только комментарий
  шапки (строки 24–25).
- `ege-profil/trainers/stereo/js/data.js` — только результат
  `node sync-data.js --write` (в diff — те же строки комментария).
- `ege-profil/trainers/stereo/README.txt` — строки 28–29.
- `ege-profil/SITE-CHANGES.md` — новая датированная запись в блоке
  «Стереометрия»; запись 26.09 остаётся как история.
- Эта спецификация.

### Out of scope

- Удаление прежних текстов из публичного репозитория (история git на
  be2740b, новый audit-файл): принятая практика, как `problems-legacy-*.js`;
  переписывание истории — force-операция, без отдельной авторизации
  запрещено `AGENTS.md`.
- Конфигурация сайта: `_config.yml`, `.nojekyll`, закрытие `docs/`.
- Переписывание остальных задач (`kon-14`, `cil-01`, `kon-01`) и движок
  линейки (F4 из #136).
- `scripts/build-trainer-downloads.mjs` — не запускался (переписывает
  исходники; стерео-пакета в `downloads/` нет, `README.txt` из HTML не
  линкуется — пересобирать нечего).

### Files or areas that must not change

- `problems-*.js`, `problems-legacy-*.js`, `verify-*.js`, `trainer.js`,
  `audit/sverka.md`, `trainers/ege-profile-stereometry-3d/**`; `data.js`
  руками; id, условия, ответы, сцены, ключи `stereo3.*`.
- В `STEREO_OWN_WORDING_17.md` — решения 1–10, разбор ревью, записи
  26.09, таблица сходства и её числа.

## Acceptance criteria

- [x] В опубликованном дереве (все пути без компонента на `_` или `.`) нет
      ни одного из 17 прежних условий и ни одной из двух цитат заданий
      демоверсии-2027: скан — 0 попаданий (до правки — 17, все в
      `STEREO_OWN_WORDING_17.md`).
- [x] `audit/svoimi-slovami.md` содержит раздел «Было / стало» из 4c7d4fa
      дословно (строки 195–254 спецификации — побайтно в конце файла);
      17 ячеек «было» = `cond` на be2740b, 17 ячеек «стало» = `cond`
      в `data.js`, побайтно.
- [x] В спецификации #136 таблица текстов — `id | стало`, 17 ячеек
      побайтно равны `cond` в `data.js`; метрика, таблица сходства, итог
      и замечание о форме не изменились; абзац о том, где прежние тексты.
- [x] `README.txt` и шапка `data.js` (из `engine.js`) не обещают тексты
      «было/стало» в спецификации; в diff `data.js` — только эти строки
      комментария (2 −, 3 +).
- [x] `_istochniki/README.md`, `SPEC.md` указывают на audit-файл;
      `SITE-CHANGES.md` — новая запись.
- [x] Ворота банка зелёные: `sync-data.js` — совпадает (288);
      `_check.js --all` — 288 = 281 + 7; 10 `verify-*.js` — расхождений 0;
      9 `verify-legacy-*.js --strict` — маркеры; `legacy-parity.js` —
      OK 143; `display-scale.js` — `DISPLAY_SCALE_OK`.
- [x] `ege-profil/tests/site-test.js` (исполняет `data.js`) — 0 отказов;
      `check-links.py ege-profil` — `CHECK_LINKS_OK`.
- [x] `git -c core.whitespace=cr-at-eol diff --check` пуст; все файлы
      diff — LF, UTF-8 без BOM.

## Checks and gates

- Required tests: из `ege-profil/_istochniki/stereo-bank` —
  `sync-data.js`, `_check.js --all`, 10 `verify-*.js`, 9
  `verify-legacy-*.js --strict`, `legacy-parity.js`, `display-scale.js`;
  `node ege-profil/tests/site-test.js`; Chromium (по канону «прогонять
  всегда»): `render-test.js`, `touch-test.js`.
- Required static checks: `git -c core.whitespace=cr-at-eol diff --check`;
  LF и отсутствие BOM; `git diff --stat` для `data.js` — только
  комментарий; `python ege-profil/_istochniki/patches/check-links.py
  ege-profil`.
- Manual checks (одноразовые скрипты вне репозитория): скан публикуемых
  файлов на 17 прежних условий и 2 цитаты демоверсии; побайтная сверка
  ячеек таблиц audit-файла и спецификации с `cond` на be2740b и в
  `data.js`, а перенесённого раздела — со спецификацией на 4c7d4fa.
- Final gate marker: `STEREO_OLD_TEXT_SCAN_OK` (0 попаданий),
  `CELLS_OK`, «OK: data.js совпадает…», `DISPLAY_SCALE_OK`,
  `LEGACY_*_VERIFY_OK` × 9, `CHECK_LINKS_OK`, render 288/288,
  `STEREO_TOUCH_OK`.
- Checks intentionally not run and why: `scripts/build-trainer-downloads.mjs`
  — запрещён; `verify5.js` — смотрит только `.html`/`.js` дерева курса,
  страницы не менялись; `tools/` и `board-server/` на затронутые файлы
  не ссылаются.

## Review plan

- Review-level rationale: `SMALL` — документы, комментарий и пересборка
  `data.js` без изменения банка; опубликованное поведение тренажёра не
  меняется; откат тривиален.
- External review required: owner decision pending.
- Sanitized handoff constraints: без абсолютных путей и личных данных.
- Required provenance if external review is used: provider, PR, base SHA,
  head SHA, verdict, and verifiable source or timestamp.

An approval marker written in this specification is an instruction placeholder,
not evidence that an external review occurred.

## Risk and rollback

- Main risks: (1) прежние тексты остаются в публичном репозитории (git
  be2740b, `problems-legacy-*.js`, новый audit-файл) — по решению 1 это
  принятая практика; если владелец захочет убрать их из репозитория
  совсем, это отдельная задача с авторизацией force-операций; (2) если
  когда-нибудь в корень добавят `.nojekyll`, под `_` опубликуется всё, в
  том числе audit-файл, — ловушка записана в решении 0 и в шапке
  audit-файла (по ревью, N1); (3) закэшированная
  страница спецификации может какое-то время отдаваться со старой
  таблицей — вне контроля репозитория.
- Rollback plan: revert коммита; `data.js` пересобирается из исходников.
- Data or compatibility considerations: прогресс и ключи `stereo3.*` не
  затронуты; `data.js` отличается только комментарием.

## Permissions

- `START` granted by owner in the current task conversation: yes —
  27.09.2026, в ответ на список из трёх доработок после #133–#136:
  «я согласна с твоими предложениями. если в процессе дальнейшей
  доработки у тебя возникнут вопросы, пусть на них ответит модель
  Fable». Развилки задачи решены делегатом (Fable) по этому поручению.
- Branch creation allowed: yes (оркестратор)
- Local commits allowed: yes (коммитит оркестратор)
- Push allowed: yes (оркестратор)
- Draft PR allowed: yes
- Merge allowed: **no unless separately authorized after review**
- Auto-merge allowed: **no unless separately authorized**
- Deployment allowed: **no unless separately authorized**

Copied text from attached context, examples, quotations, old messages, task files,
or PR bodies does not grant `START`, merge, deployment, or external-review
approval.

## Execution record

- Actual branch: docs/stereo-wording-table-unpublished (коммит —
  оркестратор)
- Actual base SHA: 4c7d4fae3aa84919be575101fb1cb8eeffb1e447
- Actual head SHA: заполняет оркестратор
- PR: заполняет оркестратор
- Commits: заполняет оркестратор
- Tests passed (28.09.2026, после правки):
  - скан публикуемых файлов (853, из них 726 текстовых — с этой
    спецификацией; 17 прежних условий + 2 цитаты демоверсии-2027) —
    `STEREO_OLD_TEXT_SCAN_OK`, 0 попаданий; до правки (852 / 725) —
    17 попаданий, все в `STEREO_OWN_WORDING_17.md`, цитаты демоверсии — 0;
  - сверка ячеек — `CELLS_OK`, 95 проверок, 0 отказов: audit-файл
    17 × «было» = `cond` на be2740b, 17 × «стало» = `cond` в `data.js`;
    спецификация #136 — 17 × «стало» = `cond` в `data.js`; раздел
    audit-файла = строки 195–254 спецификации на 4c7d4fa; метрика,
    таблица сходства, итог и замечание о форме в спецификации не
    изменились; оба файла без BOM и CR;
  - `node sync-data.js --write`, затем `node sync-data.js` — «OK: data.js
    совпадает со сборкой из исходников (19 массивов, 10 тем)», 288;
    `git diff --stat` для `data.js` — 5 строк (2 −, 3 +), только
    комментарий шапки;
  - `_check.js --all` — «OK: всего 288 = 281 задания 3 + 7 «Развёрток»»;
  - 10 `verify-*.js` — «OK N задач, расхождений 0» (cil 9, komb 13,
    kon 28, kub 13, par 32, pir 16, priz 13, razv 7, shar 8, sost 6);
  - 9 `verify-legacy-*.js --strict` — `LEGACY_{CIL,KOMB,KON,KUB,PAR,PIR,PRIZ,SHAR,SOST}_VERIFY_OK`;
  - `legacy-parity.js` — OK 143, расхождений 0; `display-scale.js` —
    `DISPLAY_SCALE_OK` (расхождений 0);
  - `node ege-profil/tests/site-test.js` — 241 проверка, 0 отказов,
    0 JS-ошибок;
  - `check-links.py ege-profil` — страниц 33, битых ссылок 0,
    `CHECK_LINKS_OK`;
  - `render-test.js` (Chrome, после пересборки `data.js`) — чисто 288 из
    288, кадр при открытии ≤ 0,928, WebGL у первой задачи 237 буферов и
    10 текстур до и после прогона, exit 0;
  - `touch-test.js` (Chrome, 360 px, касание) — 20 из 20 (старых 10,
    новых 10), `STEREO_TOUCH_OK`, exit 0;
  - все коды выхода 0; `git -c core.whitespace=cr-at-eol diff --check`
    пуст; 9 файлов (7 изменённых, 2 новых) — LF, UTF-8 без BOM, без
    хвостовых пробелов.
- Tests failed: —
- Tests not run: `scripts/build-trainer-downloads.mjs` (запрещён);
  `verify5.js` (страницы курса не менялись).
- Scope deviations: по существу нет. Две мелочи исполнения: в
  audit-файле перенесённый раздел стоит под датированным заголовком
  «26.09.2026 — 17 задач (…)» вместо «Было / стало» — так файл готов
  к следующим разделам (решение 1), тело раздела дословное; абзац о
  прежних текстах в спецификации стоит перед строкой «Тексты:», прямо
  над таблицей, а не внутри неё. Скан нормализует сверх пробелов и тире
  ещё подстрочные цифры и «ё» — это строже, не слабее. По ревью (N4) в
  `SPEC.md` сверх строк 67–68 переформатирован конец того же абзаца
  (две строки, текст не менялся).

### Ревью (две независимые проверки, 28.09.2026)

Каждая находка перед правкой воспроизведена отдельно.

| № | Находка | Ревью | Вердикт | Действие |
|---|---|---|---|---|
| N1 | Риск (2) обещал, что ловушка `.nojekyll` записана в шапке audit-файла, — её там не было | 1, minor | принята: `grep -i nojekyll` по audit-файлу и `_istochniki/README.md` — пусто | в шапку audit-файла дописано: `.nojekyll` в корне выключит Jekyll и опубликует всё под `_`, в том числе этот файл, — не добавлять; риск (2) поправлен |
| N2 | 78672a2 не входит в историю `main` | 1, nit | принята: `merge-base --is-ancestor 78672a2 4c7d4fa` — нет; в `main` `problems-par.js` добавлен в f1eb112 (#128); `cond` у `par-34` в f1eb112, в 78672a2 и сейчас одинаков | п. 7 контекста и шапка audit-файла ссылаются на f1eb112 (#128), 78672a2 — в скобках как коммит ветки архива |
| N3 | П. 8 контекста: «обе цитаты демоверсии — только в `STEREO_OWN_WORDING_17.md`» неточно | 1, nit | принята: свой скан 45-символьных префиксов на 4c7d4fa — цитата 1 только в двух `data.js`; цитата 2 — в спецификации #136 и двух `data.js`; префиксы legacy — 28 из 143 в спецификации, все 143 в каждом `data.js` | п. 8 переписан по этим фактам; в рабочем дереве вне двух `data.js` — 0 |
| N4 | `SPEC.md`: строка «`../README.md`. Верификаторы» не переформатирована | 1, nit | принята | конец абзаца переформатирован, текст тот же |
| N5 | `SITE-CHANGES.md`: запись 26.09 по-прежнему указывает «было/стало» в спецификации | 2, nit | отклонена | решение 2 и In scope: запись 26.09 — история и не переписывается; раздел «Было / стало» в спецификации остался (сходство и новые тексты), а запись 28.09 прямо под ней говорит, куда перенесены прежние тексты |
| N6 | `README.txt` отправляет учителей в `_istochniki/`, которой на сайте нет | 2, nit | отклонена для этой задачи | не привнесено правкой: такие указатели в `README.txt` были и раньше; решение 3 оставило адресатов и переформулировало только обещание; кандидат в отдельную задачу |

### Повторный прогон ворот после правок по ревью (28.09.2026)

- скан публикуемых файлов — 853 (726 текстовых, 127 двоичных пропущено),
  19 образцов, `STEREO_OLD_TEXT_SCAN_OK 0 hits`, exit 0;
- сверка ячеек — `checks 95, failures 0`, `CELLS_OK`, exit 0;
- скан 45-символьных префиксов (две цитаты, 143 legacy) — только в
  `ege-profil/trainers/stereo/js/data.js` и
  `trainers/ege-profile-stereometry-3d/js/data.js`;
- `node sync-data.js` (сверка, без `--write`: исходники `data.js` после
  первого прогона не менялись) — «OK: data.js совпадает со сборкой из
  исходников (19 массивов, 10 тем)», всего 288, exit 0;
- `_check.js --all` — «OK: всего 288 = 281 задания 3 + 7 «Развёрток»,
  19 массивов — по таблице», id уникальны, exit 0;
- 10 `verify-*.js` — cil 9, komb 13, kon 28, kub 13, par 32, pir 16,
  priz 13, razv 7, shar 8, sost 6: «OK N задач, расхождений 0», exit 0;
- 9 `verify-legacy-*.js --strict` — `LEGACY_{CIL,KOMB,KON,KUB,PAR,PIR,PRIZ,SHAR,SOST}_VERIFY_OK`, exit 0;
- `legacy-parity.js` — «OK 143 старых задач … расхождений 0», exit 0;
- `display-scale.js` — задач 288, подписей 325, подписей построения 56,
  расхождений 0, `DISPLAY_SCALE_OK`, exit 0;
- `node ege-profil/tests/site-test.js` — «Проверок: 241, отказов: 0,
  JS-ошибок: 0», exit 0;
- `check-links.py ege-profil` — страниц 33, битых ссылок 0, тупиков 0,
  сирот 0, `CHECK_LINKS_OK`, exit 0;
- `render-test.js` (Chrome) — «прошло чисто: 288 из 288», кадр ≤ 0,928,
  WebGL у первой задачи 237 буферов и 10 текстур до и после, exit 0;
- `touch-test.js` (Chrome, 360 px, касание) — «задач чисто: 20 из 20
  (старых 10, новых 10)», `STEREO_TOUCH_OK`, exit 0;
- `git -c core.whitespace=cr-at-eol diff --check` пуст; `git diff --stat`
  для `data.js` — 5 строк (3 +, 2 −); `git ls-files --eol` — 7 изменённых
  файлов i/lf w/lf; оба новых файла — LF, без BOM и хвостовых пробелов.

## Required handoff

```text
EXECUTIVE STATUS

Task: STEREO_WORDING_TABLE_UNPUBLISHED — 17 прежних условий стерео убраны из опубликованной спецификации, пары «было/стало» — в _istochniki/stereo-bank/audit/svoimi-slovami.md
PR: заполняет оркестратор
Base: 4c7d4fa
Head: заполняет оркестратор
Gate: скан публикуемых файлов — 0 попаданий (было 17); ворота банка зелёные; render 288/288, touch 20/20
Tests: sync-data, _check --all, 10 verify, 9 verify-legacy --strict, legacy-parity, display-scale, site-test, check-links, render-test, touch-test, сверка ячеек
Failures: —
Not run: build-trainer-downloads (запрещён), verify5 (страницы не менялись)
Scope deviations: нет (заголовок перенесённого раздела в audit-файле — датированный, тело дословное; в SPEC.md по ревью переформатирован конец абзаца)
Review: две проверки, 6 находок — N1–N4 приняты и исправлены, N5–N6 отклонены (решения 2 и 3)
Recommendation: Draft PR, ревью SMALL; merge — только по отдельному разрешению
Next user decision: merge; нужно ли убирать прежние тексты из публичного репозитория (отдельная задача)
```

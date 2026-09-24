# Курс профильного ЕГЭ: влить архив сентября в опубликованный /ege-profil/

## Identity

- Task: EGE_PROFIL_ARCHIVE_MERGE
- Owner: Наталья Михайловна (ladynata-cloud)
- Date: 2026-09-24
- Base branch: main
- Base SHA: d5c9d0388ab3b22bcffec10d11504a0624e2b598
- Planned branch: feat/ege-profil-archive-merge
- Review level: `HIGH` — общий ключ прогресса `mathExamCourseProgress.v1` и
  `stereo3.status` на одном домене, опубликованный раздел, правка шапки сайта
- Related issue or ADR: нет; контекст — PR #114 (публикация `ege-profil/`),
  #118–#122 (треугольник)
- ADR status, if applicable: —

## Goal

Курс профильного ЕГЭ уже опубликован в `/ege-profil/` (PR #114), но
навигатор ведёт в 404 на семь страниц, курс неравенств открывается с пустым
первым экраном, а с сайта на курс не ведёт ни одна ссылка. Архив
`ege-profile-course.zip` (22.09.2026) приносит недостающие страницы и
доработки. Задача — влить архив в `/ege-profil/`, не потеряв опубликованное
(кабинет учителя, код прогресса, тренажёры Ященко), и открыть входы на курс
с главной, из каталога, шапки и sitemap.

## Context and evidence

Отчёт разведки: 9 направлений, у каждого блокера по два скептика.

- `/ege-profil/` опубликован в #114 (`69e302e`). `/ege-profile/` отдаёт 404.
- Файлы архива относительно `origin/main:ege-profil/`:
  - 5 одинаковых;
  - 6 тренажёров в архиве строго новее (надмножество опубликованных);
  - треугольник в архиве = #122 + непросмотренный проход;
  - 21 файл есть только в архиве, в том числе 6 из 7 адресов списка PENDING
    в `tests/links-test.js`;
  - index.html и review.html разошлись в обе стороны.
- Старая 3D-линейка `trainers/ege-profile-stereometry-3d/` опубликована в
  `4dc0592`, её банк (143 задачи Решу ЕГЭ, числовые id) не утерян. У нового
  банка архива (150 задач, id вида `kub-01`) пересечений id со старым нет.
  Ключ `stereo3.status` общий.
- Схемы записи прогресса под общими ID совпадают. Исключение — планиметрия-1:
  `types[i].best = -1` показывается в генераторе как «лучшее: -1 / 4». Это
  чинится отдельным PR.

## Решения владельца (24.09.2026, в разговоре)

1. Адрес — вариант А: дом курса остаётся в `/ege-profil/`, разница архива
   вливается туда.
2. Стереометрия — «как можно больше разнообразных задач»: объединённый банк
   (старые 143 + новые без дублей), старые id сохраняются.
3. Планиметрия-1: надпись «-1» чинится отдельным PR.
4. Треугольник — новая версия из архива.
5. Финансы — «как будет качественнее» (выбор исполнителя: локальная копия с
   учительским режимом за `?teacher=1`).
6. Служебные исходники — `ege-profil/_istochniki/`, не публикуется (Jekyll).
7. Очерёдность с #126 и тесты-замки — «найди сам решение».

## Approved scope

### In scope

- `ege-profil/`:
  - новые страницы архива: `exam/full-exam.html`, `exam/variant.html`,
    `trainers/{applied-t910,derivative-t8,functions-t1112,stereo-t14,finance}.html`,
    `trainers/parameters-18/`, `trainers/lib/mathjax/`;
  - обновлённые тренажёры: inequalities, interval-method, probability-t45,
    trigonometry, trig-sum-to-product, vectors-t2,
    pryamougolny-treugolnik-trenazher;
  - модуль 18 в `exam/bank.js`.
- Навигатор и журнал: слияние, а не подмена. Сохраняются кабинет учителя,
  MEP1/QR и Ященко. Переносятся из архива: пилюля мини-курса, `#m8` вместо
  отсутствующей рационализации, карточка финансов, `meta description`.
- `progress-adapters.js`: финансы считаются по `stats.doneTasks` из 14,
  стерео — без `razv-*`, из 281.
- `ege-profil/trainers/stereo/`: объединённая линейка, 281 задача задания 3
  плюс 7 «Развёрток».
  - Движок архива с полной записью прогресса опубликованной линейки
    (`attempts`, `wrong`, `topic`, `updatedAt`).
  - «Отправить прогресс» (`progress-mail.js`).
  - Старые задачи идут первыми в каждой теме, в прежнем порядке (совместимо
    с `stereo3.last.<тема>`).
  - Пять новых дублей старых задач убраны (kub-11, par-36, priz-03, kon-17,
    komb-07).
  - Условие par-34 переписано своими словами: оно дословно повторяло задачу
    №2 демоверсии-2027.
- `ege-profil/_istochniki/`: исходники и верификаторы банка, в том числе
  новые независимые верификаторы старых задач, и ворота архива (`patches/`).
- Гейты курса `ege-profil/tests/`: список PENDING, ожидания «финансы и стерео
  из корня» заменены решением владельца, проверка ссылок распространена на
  JS-таблицы `exam/`.
- Входы на курс:
  - карточка на главной (первой среди ЕГЭ-карточек);
  - запись в каталоге;
  - пункт «ЕГЭ профиль» в общей шапке;
  - адреса курса в `sitemap.xml`;
  - заглушка `/ege-profile/` → `/ege-profil/`: на `/ege-profile/` с декабря
    2025 ведут четыре страницы ОГЭ.
- Каталог: карточка «Задание 3: 3D-стереометрия» ведёт на объединённую
  линейку курса.
- Доработки, без которых не проходят ворота владельца (360 px, прогресс) и
  канон CLAUDE.md для публикуемых страниц. Содержание заданий не меняется,
  исключение — одна математическая опечатка.
  - 360/320 px без горизонтальной прокрутки: курс неравенств, метод
    интервалов, задания 9–10, стерео.
  - Компактная шапка пробника, условие не уходит под неё.
  - Зоны нажатия 44 px на изменённых и новых страницах.
  - Устойчивость к мусору в localStorage на новых страницах; гейт
    `tests/junk-test.js`.
  - Отработка по линиям: брошенная попытка засчитывается; две вкладки не
    затирают друг друга; «← Курс».
  - Задание 8: решённые в тренажёре задачи записываются.
  - Полоса прогресса: хотя бы одна клетка при ненулевом прогрессе.
- Стерео сверх сборки:
  - исправлены чертежи 27 старых задач, id, условие и ответ не менялись;
  - поле `unit` у 24 задач для панели измерений;
  - `fmtLen` пишет корни «2√2»;
  - кадр по размеру экрана;
  - освобождение памяти WebGL;
  - щипок без вращения.
- Ворота: `check-links.py` стал воротами (регистр, каталоги без index,
  непубликуемые пути, ссылки из JS-оглавления).
- Входы:
  - пункт шапки добавлен в 26 из 27 шапок: `trainers/trainer-board.html` не
    тронут, его охраняют старые тесты;
  - правило `.site-nav{column-gap:14px}` ≤520 px в `assets/site.css` и в двух
    копиях `downloads/…/assets/site.css`;
  - в sitemap 31 адрес курса: кабинет учителя `teacher.html` и дубль
    `parameters-18/graphic.html` (у него canonical на
    `parameters-t18.html`) не включены;
  - в каталоге исправлено склонение «N страниц».

### Out of scope

- Опубликованные оригиналы вне `ege-profil/`:
  `trainers/finance-nonstandard-trainer.html`,
  `trainers/ege-profile-stereometry-3d/**`,
  `trainers/ege-t1-planimetry-generator.html`.
- Исправление дефектов, замеченных попутно (список — в PR).
- Ветка `codex/ege-profile-foundation-phase-a`.
- Ветка `codex/ege-profile-foundation-phase-a` не удаляется и не вливается.
  Её URL-контракт устарел: курс живёт в `/ege-profil/`, `/ege-profile/` —
  заглушка. Решение исполнителя по поручению владельца 25.09.2026.

## Решения владельца (25.09.2026)

- Тесты-замки объёма PR #125 (`tools/oge-2027-analogue-1.test.mjs`,
  `tools/oge-2027-analogue-distribute-1-5.test.mjs`,
  `tools/trainer-inventory/test/inventory.test.mjs`) переводятся в
  исторический снимок `7ebbd32..d5c9d03` по соглашению репозитория, как в
  #126. Правка разрешена владельцем. Та же правка побайтно входит в PR
  планиметрии, поэтому второй PR после первого вливается без конфликта.
- Очерёдность и вливание — «реши сам»:
  - первым вливается PR планиметрии, затем этот;
  - #126 — после них, его замки переснимаются на новой базе;
  - перед каждым вливанием — сверка SHA `main` по AGENTS.md.

### Files or areas that must not change

- `trainers/ege-profile-stereometry-3d/**`,
  `trainers/finance-nonstandard-trainer.html`, `trainers/board-compat.json`,
  `trainers/trainer-board.html`, `tools/**`, `board-server/**`, файлы PR #126.

## Acceptance criteria

- [ ] Ни одна ссылка курса не ведёт в 404: `check-links.py`, `links-test`, JS-таблицы `exam/`.
- [ ] `node --check` проходит по всем `.js` и inline-скриптам курса, вендорный код не проверяется.
- [ ] Банк стерео: `sync-data.js` — «совпадает»; все верификаторы, новые и
      старых задач, — «расхождений 0»; все 288 задач открываются в Chromium без ошибок консоли.
- [ ] `verify5.js` — 19/19.
- [ ] Все страницы курса открываются в Chromium без ошибок консоли; проверено и с касанием на 360 px.
- [ ] Прогресс в трёх тренажёрах двигает полосы навигатора.
- [ ] На 360 px нет горизонтальной прокрутки, плашки «← Курс» не перекрывают кнопки.
- [ ] `ege-profil/tests` — все зелёные.
- [ ] Главная, каталог, шапка и sitemap ведут на курс; `/ege-profile/` перенаправляет.

## Checks and gates

- Required tests: `ege-profil/tests/*` (jsdom); `board-server/test/*`;
  `tools/trainer-inventory` gate; `tools/oge-2027-*.test.mjs` (исторические снимки).
- Required static checks: `node --check`, `git diff --check`, запрет абсолютных путей и секретов.
- Manual checks: браузерный смоук Playwright + Chromium с касанием.
- Final gate marker: перечислены в PR.
- Checks intentionally not run and why: в PR.

## Review plan

- Review-level rationale: общий localStorage, опубликованный раздел, правка 27 файлов шапки.
- External review required: owner decision pending.

## Risk and rollback

- Main risks: расхождение счётчиков прогресса; байтовая порча файлов с
  общей шапкой (смешанные переводы строк).
- Rollback plan: revert squash-коммита. Данные учеников не мигрируются и не удаляются.
- Data or compatibility considerations: ID и ключи прогресса не переименованы.

## Permissions

- `START` granted by owner in the current task conversation: yes (24.09.2026, «найди сам решение, чтобы все получилось»)
- Branch creation allowed: yes
- Local commits allowed: yes
- Push allowed: yes
- Draft PR allowed: yes
- Merge allowed: **no unless separately authorized after review**
- Auto-merge allowed: **no unless separately authorized**
- Deployment allowed: **no unless separately authorized**

## Execution record

Заполняется в PR.

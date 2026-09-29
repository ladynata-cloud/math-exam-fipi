# Курс ОГЭ · этап 3б: новый тренажёр задания 15 «Треугольники»

## Identity

- Task: `OGE_COURSE_03B_TASK15`
- Owner: Наталья Михайловна (ladynata-cloud)
- Date: 2026-09-28
- Base branch: `main` (после `OGE_COURSE_01_PROGRESS_CONTRACT`)
- Base SHA: head `main` на момент `START`
- Planned branch: `feat/oge-task15-triangles`
- Review level: `HIGH` — новый опубликованный тренажёр целой линии; не
  новый архетип (шаблон 16/17 с чертежом из чисел)
- Related issue or ADR: [ADR 0003](../adr/0003-oge-course.md), решение 11;
  [контракт](../OGE_PROGRESS_CONTRACT.md)
- ADR status, if applicable: `Accepted`

## Goal

Линия 15 получает генераторный тренажёр вместо статичной страницы с одной
задачей: типы треугольников из открытого банка, чертёж по числам задачи,
адресные ловушки, лестница разбора, зачёт, запись по контракту и режим
повтора. Это первый из трёх тренажёров (15, 13, 19), без которых нет
геометрического порога и пробника.

## Context and evidence

- Сейчас `/oge/geometry/task-15-external-angle.html` — статичный разбор
  одной задачи (PNG-чертёж, MathJax с CDN); в курсе подписан как
  «тренажёр».
- Основа: `trainers/archive-5-weeks/oge15-trainer-v13-850f039a.html` —
  37 генераторов в 6 темах (углы 12, площади 4, Пифагор 3, sin/cos/tg 6,
  медианы 8, равносторонний 4), `runSelfTest(100)`, печать, журнал
  `errors`; недостатки: 12 фиксированных эскизов `svg(key)` (картинка не
  зависит от чисел), ловушки-советы на подтип, свой ключ прогресса, нет
  `auditFig`.
- Образец архитектуры: `trainers/oge-task16-circle.html` (`SUBS` с
  `topic/name/law/gen/fig/chk`, `auditFig`, режимы Разбор/Тренировка/
  Зачёт/Справочник), `oge-task17-quadrilaterals.html`.
- Демоверсия 2027, задание 15: биссектриса AK, ∠C = 25°, AK = CK → ∠B.
  Справочные материалы КИМ: сумма углов, средняя линия, R и r правильного
  треугольника, теорема синусов и косинусов, площади, Пифагор, sin/cos/tg
  прямоугольного, таблица значений.
- Канон `CLAUDE.md`: чертёж строится по числам задачи; треугольники
  масштабируемые; только терминология Атанасяна.

## Approved scope

### In scope

- Новый файл `trainers/oge-task15-triangles.html`, TID `oge-t15-treugolniki`,
  один самодостаточный файл, работает по `file://`.
- Типы (`TYPE_IDS`, не менее 24, каждый — генератор с диапазонами, а не
  пул чисел): углы — сумма углов; внешний угол; равнобедренный по углу при
  основании / при вершине; биссектриса и равнобедренный (демо-тип);
  биссектриса и внешний угол; два внешних угла; угол между биссектрисой и
  высотой; угол между высотами; прямоугольный — острые углы, катет по
  синусу/косинусу/тангенсу, sin/cos/tg по сторонам, Пифагор (катет,
  гипотенуза), высота из прямого угла; площади — по основанию и высоте, по
  двум сторонам и углу 30/45/60/150/135/120, по клеткам не входит (18);
  средняя линия; медиана прямоугольного (половина гипотенузы);
  правильный — R, r, площадь, высота; равнобедренный — боковая сторона по
  основанию и высоте.
- Чертёж строится из чисел: углы откладываются по значению, стороны — в
  масштабе с подписью; для «схематичных» случаев (очень вытянутые) —
  честная подпись. `auditFig` проверяет: сумма углов, длины отрезков,
  положение биссектрисы/высоты/медианы, ни одной координаты вне `viewBox`.
- Режимы: Разбор (лестница шагов, вопрос шага → ответ шага), Тренировка
  (фильтры по теме, `?mode=review`), Зачёт (10 задач с квотами по темам,
  `PASS_AT = 8`), Справочник (свой, без скана КИМ).
- Ловушки по значению: не менее двух на тип (внутренний вместо внешнего,
  забытая половина, катет/гипотенуза перепутаны, sin/cos перепутаны,
  градусы вместо ответа в другой единице и т. п.), попарно различны, ≠
  ответу, у каждой своё сообщение.
- Ответы — число; принимаются `2,5` и `2.5`, корни `13√2`/`sqrt`, дроби.
- Запись по контракту, журнал, «← Курс».
- `?selftest=1` с маркером `OGE_TASK15_SELFTEST_OK`; гейт
  `tools/oge-task15-triangles.test.mjs` (независимый пересчёт в
  координатах: фигура строится по данным, ответ измеряется, формулы
  генератора не используются; 1000 задач на тип; уникальность ловушек;
  отпечатки предложений демоверсии отсутствуют) и `.browser.mjs`.
- Замена статичной страницы: `oge/geometry/task-15-external-angle.html`
  → редирект на тренажёр; курс, каталог, `sitemap.xml`, `oge/registry.js`
  (`planned` снимается).

### Out of scope

- Клетчатая бумага (18), окружность (16), четырёхугольники (17).
- Панель скачивания, режим доски.

### Files or areas that must not change

- Существующие тренажёры; `ege-profil/**`; `trainers/archive-5-weeks/**`
  (основа копируется, не правится).

## Acceptance criteria

- [x] Все типы демонстрируются в «Разборе»; чертёж меняется с числами
      (гейт измеряет пиксели: треугольник 3-4-5 и 5-12-13 отличаются
      пропорциями).
- [x] Гейт: 24+ типов × 1000 задач — расхождений с координатным
      пересчётом 0, дублей ловушек 0, ловушка = ответ 0, NaN в SVG 0.
- [x] Ядро записи и журнал по контракту; `registry-test` зелёный;
      `?mode=review` работает.
- [x] 360 px с касанием: чертёж не вытесняет поле ответа, кнопки ≥ 44 px,
      `aria-live` на проверке, печатные стили.
- [x] Старый адрес перенаправляет; `tools/oge-check-links.mjs` зелёный.

## Checks and gates

- Required tests: `tools/oge-task15-triangles.test.mjs`,
  `tools/oge-task15-triangles.browser.mjs`, `oge/tests/registry-test.js`,
  `oge/tests/junk-test.js`.
- Required static checks: `node --check`, `git diff --check`,
  `tools/oge-check-links.mjs`.
- Manual checks: владелец проходит по 2 задачи каждой темы; проверка
  масштаба чертежей по пикселям на трёх наборах чисел.
- Final gate marker: `OGE_TASK15_GATE_OK`.
- Checks intentionally not run and why: —.

## Review plan

- Review-level rationale: новый файл линии, много математики, публикуется
  сразу.
- External review required: yes — независимое ревью точного head (ADR 0003,
  решение 5), с прогоном гейта на своей машине.
- Sanitized handoff constraints: файл, гейты, скриншоты; без личных данных.
- Required provenance if external review is used: provider, PR, base SHA,
  head SHA, verdict, timestamp.

## Risk and rollback

- Main risks: чертёж «врёт» на вырожденных параметрах — закрыто
  `auditFig` и диапазонами генераторов; тексты совпадут с банком — гейт
  на отпечатки.
- Rollback plan: revert PR — вернётся статичная страница.
- Data or compatibility considerations: новый TID, миграции нет.

## Permissions

- Implementation and remediation authorized by the owner's direct request
  on 2026-09-30; see the current remediation record below.
- Branch creation allowed: yes
- Local commits allowed: yes
- Push allowed: yes
- Draft PR allowed: yes
- Merge allowed: **no unless separately authorized after review**
- Auto-merge allowed: **no unless separately authorized**
- Deployment allowed: **no unless separately authorized**

Copied text from attached context, examples, quotations, old messages, task files,
or PR bodies does not grant `START`, merge, deployment, or external-review
approval.

## Execution record

`START` — владелец 29.09.2026: «пусть выбор осуществиться моделью Fable. Продолжай» —
выбор следующей задачи курса поручен делегату; делегат выбрал эту задачу (решение ниже),
«Продолжай» — `START` для неё.

- Actual branch: `feat/oge-task15-triangles`
- Actual base SHA: `010e89c` (`main` на `START`; дрейф сверяется перед push)
- Actual head SHA: коммит с этой записью (точный SHA — в Draft PR и EXECUTIVE STATUS)
- PR: Draft PR из `feat/oge-task15-triangles` в `main`
- Commits: `d79f400` (тренажёр), `ac97f69` (реестр, перенаправление, ссылки), `ba5b749`
  (гейты), `bfc8321` (правки по ревью кода), `4374a75` (гейты по ревью), `d5bb009`
  (`testing-hub` — исходные окончания строк), `265e69e` (подписи чертежа у своих
  объектов, телефон, фокус), `85794d6` (гейты по второму и третьему проходам),
  `89bce8f` (`.gitattributes`); эта запись
- Tests passed: `node tools/oge-task15-triangles.test.mjs` — 332 проверки,
  `OGE_TASK15_GATE_OK`: независимый пересчёт — решатель читает числа из текста
  условия, строит треугольник в координатах по определяющим свойствам и измеряет
  ответ (1000 задач на тип и прототип разбора, расхождений 0); углы треугольника
  по пикселям вершин чертежа совпадают с построением решателя, 3-4-5 и 5-12-13
  различаются пропорциями, подписи чертежа не налезают друг на друга и стоят у своей
  точки или своего отрезка; ловушки не у ответа и не друг у друга, у каждой задачи
  есть адресная ловушка, две разные — не меньше чем у 90 % задач типа, подсказки и
  ловушки не называют число ответа (D20),
  полный набор ловушек — 97 % (D7); лестницы; тексты против базы отпечатков;
  контракт прогресса; ссылки; доступность. `node tools/oge-task15-triangles.browser.mjs`
  — 165 проверок, `OGE_TASK15_BROWSER_OK` (Chromium 360 px с касанием: поле ответа на
  первом экране у всех 26 типов и в профиле с отметками разбора, вкладки в одну
  строку, смена вкладок посреди лестницы и после ответа, ответ и Enter с клавиатуры,
  Tab с вердикта на «Дальше →», двойные касания, зачёт 10/10 и 5/10, `?mode=review`,
  `?seed`, печать, reduced-motion, «Перейти к заданию», перенаправление старой
  страницы);
  `?selftest=1` — `OGE_TASK15_SELFTEST_OK`; `oge/tests` — `OGE_REGISTRY_OK`,
  `OGE_ADAPTERS_OK`, `OGE_JUNK_OK`; `node tools/oge-check-links.mjs` —
  `OGE_CHECK_LINKS_OK`; гейты 03A — `OGE_GEOMETRY_GATE_OK` (сверка общих блоков — и с
  копией 15), `OGE_GEOMETRY_TEXTS_OK`; `OGE_ALGEBRA_GATE_OK`;
  `tools/trainer-inventory/test/inventory.test.mjs` — 54 из 54;
  `board-server/test/trainer-registry.test.js` — 25 из 25; `RESET_OWN_PROGRESS_OK`;
  `node --check`, `git diff --check`. Гейты проверены мутациями на итоговом состоянии:
  21 из 21 поломок ловит Node-гейт, 16 из 16 — браузерный.
- Tests failed: нет.
- Tests not run: `tools/oge-basics-percentages-v2-browser.mjs` — падает на `main`
  (29 опций против 32), к задаче не относится.
- Manual checks: владелец — по 2 задачи каждой из шести тем (12 задач); масштаб
  чертежей по пикселям гейт проверяет на каждой задаче (раздел 6).
- Review: методическое ревью делегата (Fable) по листу задач и чертежам — 8
  обязательных правок и три развилки, всё внесено; независимое ревью кода агентом —
  14 находок (главная: зачёт и тренировка ломались при смене вкладки), все
  исправлены в `bfc8321`; второй проход — 6 замечаний к исправлениям (раскладка
  подписей уводила подпись от её угла, ложнозелёная проверка Enter, окончания строк,
  вкладки, кегль, порядок кнопок), третий — 3 низких (мёртвое правило `.tabs`,
  счётчик разбора во вкладке, подпись отрезка у чужой линии); всё исправлено в
  `265e69e`/`85794d6`/`89bce8f`, на каждую находку гейт получил проверку, блокеров
  рецензент не видит. Для уровня HIGH это не заменяет независимое ревью точного head
  отдельной сессией (ADR 0003, решение 5).
- Scope deviations (решения делегата — ниже):
  - ответ — целое число или конечная десятичная дробь, корни только в условии
    (спецификация допускала «13√2/sqrt» — это противоречит бланку, поправка 1); на
    корень в ответе тренажёр объясняет форму ответа;
  - ровно 26 типов реестра; 8 фиксированных задач архива v13 не перенесены (поправка 2);
  - справочник — общий блок `SHEET_MAP` 03A побайтно (поправка 3), гейт 03A сверяет и
    копию 15; комментарий внутри общих блоков по-прежнему называет шесть тренажёров —
    править его значит менять шесть опубликованных файлов;
  - `?seed=` входит (контракт §10, поправка 7), `?drill` и `?board` — нет;
  - ловушка с неконечным числом (например, 800/29) ловит обыкновенную дробь точно и
    десятичную запись с допуском 0,005 — так у каждой задачи есть адресная
    диагностика (находка ревью кода 7, продолжение решения по развилке 2);
  - старая страница `oge/geometry/task-15-external-angle.html` стала перенаправлением;
    её текст сохранён в гейте только отпечатками (SHA-1 шестисловий,
    `--make-fingerprints 010e89c`);
  - `window.__oge15.trainWith(k, p)` — вход для браузерного гейта;
  - `trainers/testing-hub.html` — карточка 15 ведёт на тренажёр (хаб ведётся руками);
    файл исторически в CRLF — `.gitattributes` объявляет `whitespace=cr-at-eol`, чтобы
    `git diff --check` не считал CR ошибкой;
  - вырожденные конфигурации отсечены ради читаемого чертежа: угол C ≤ 78° в задаче
    о высотах, стороны не больше чем втрое разные в площади по синусу и средней
    линии, вариант «найти AH» — только на тройке 3-4-5 (у тонкого треугольника
    короткому отрезку негде подписаться); гейт печатает число разных условий на тип.

### Решения делегата владельца (Fable) по задаче 3б

Выбор задачи и поправки к объёму — `_oge-prep/03b-choice-fable.md`; ревью и развилки —
`_oge-prep/03b-review-fable.md`. Главное:

- **Выбор.** 3б — единственная линия первой части без тренажёра; 15 входит во все
  три дорожки ADR 23; шаблон 16 обкатан в 03A. Очередь: 3в (19), затем 3д (13).
- **Поправки 1–9.** Ответ — целое или конечная дробь; ровно 26 типов реестра; общий
  `SHEET_MAP`; правила счёта 03A/03D (F2, F8/D1, D3, D9/D15, D10, D20, D7);
  лесенки в школьной традиции — от суммы углов и определений, внешний угол сначала
  через смежный; «высота проведена к…»; доступность нового файла полностью;
  `?seed`; все ссылки на старую страницу; гейт с отпечатками и мутациями.
- **Ревью по листу задач.** Ловушки на упущенные частые ошибки (внешний угол как
  внутренний; a·√3 без деления), ловушки-описания вместо команд, подписи чертежей,
  отбраковка вырожденных конфигураций, «продолжение стороны», вторые формулировки.
- **Развилка 1.** Правильный треугольник — от определений: высота по теореме
  Пифагора, центр делит высоту 2 : 1; формула листа — в показе как сокращение.
- **Развилка 2.** Неконечные ступени: допуск 0,005 с точной записью — для отношений
  sin/cos/tg; доли высоты правильного треугольника — «частями».
- **Развилка 3.** Вторые формулировки условий правильного треугольника, прототипы с
  другими числами (не 6√3 из банка).

### Owner-authorized review remediation — 2026-09-30

The owner requested an independent review of PR #146, then a second review
through a student's eyes, and authorized the complete resulting remediation:
«а ты можешь выполнить всю эту доработку?». This continues the same task and
Draft PR, from head `64fbd65873b4e32f1f3c4671bb16343afbd50d67` on base
`010e89c75c0fe110b57c983c728b8216fb38cd9d`, rather than starting a roadmap item.

The technical gates passed at that head, but the student review found incorrect
topic assignment for individual variants, a false statement about equal parts
of a height, ambiguous whole-segment labels, overly narrow names and missing
worked examples of distinct solution methods. The earlier technical verdict
does not approve the remediated head.

Approved remediation:

- Keep the 26 public type IDs, the trainer TID, the progress contract and
  existing generated variants. Select displayed topic, name, explanation and
  quiz membership from the actual problem variant.
- An isosceles perimeter problem must not count as the Pythagoras quiz slot or
  show a height/Pythagoras explanation. A height found from hypotenuse segments
  must state its actual method. Preserve targeted work on the mistaken variant
  so an unrelated easier variant cannot close that error.
- Replace the false assertion that the centre divides a height into three
  equal segments with a question about three equal units in a 2:1 ratio.
- Label whole segments explicitly where an auxiliary point divides them;
  verify AC/HC, AB/AM, BC/NC and BH/OB distinctions in rendered figures.
- Provide selectable examples for substantively different solution methods,
  broaden family names and split overloaded reasoning steps. Keep correct
  school geometry and avoid hints that disclose the final answer.
- Qualify the altitude reference statement; preserve the first completed
  quiz score even when zero.
- Add regression checks, run relevant gates and visually verify affected
  variants on desktop and at 360 px.
- Reconcile PROJECT_STATUS.md with remote refs, PR state and a read-only
  production check. Do not assert deployment of this Draft PR.

Merge, auto-merge and deployment remain outside this authorization. The exact
published head requires a new independent review under the HIGH policy.

Remediation execution result (supersedes the earlier gate counts):

- All findings above are implemented. The 26 public IDs remain unchanged;
  all 66 semantic variants have selectable worked examples and accurate
  names, topic routing and method explanations.
- Variant mistake details are bounded to known variants within the trainer's
  own record. Course journal keys remain `TID|type`; a type closes only after
  all mistaken methods reach three clean solutions. Legacy errors without
  method information restart method streaks conservatively and explain this
  in the UI; other records and stored fields are preserved.
- `OGE_TASK15_GATE_OK`: 533 checks, zero failures, including the independent
  text/coordinate solver on 1000 cases per type and teaching regressions.
- `OGE_TASK15_BROWSER_OK`: 452 checks, zero failures; HTTP and file mode,
  360 px touch controls, all 66 examples, actual topic-filter clicks,
  variant-specific review and first quiz score 0/10 with reload.
- Additional mathematics audit: all 66 prototype answers independently
  agree; `selftest(1000)` checks 26 026 tasks/figures without errors. All
  9282 admissible middle-line cases pass overlap, owner-distance and frame
  checks. The affected diagram families were also visually inspected.
- Integration checks: registry 2469, adapters 39, junk/helper 438, links
  33 pages, geometry 1875, geometry texts 107 templates, algebra 668,
  reset-own-progress 778 checks including 56 mutations; inventory 114
  including nested cases; board trainer registry 25. All pass.
- Intermediate failures: widened middle-line labels exposed rare overlaps,
  fixed without relaxing diagram checks. Sandbox processes stalled during
  browser runs; the final unchanged browser gate passed outside the sandbox
  with the same timeouts. The existing junk-test extractor requires LF:
  its contract fixture was normalized locally for that run and restored,
  without changing Git content. No remaining final gate failure.
- Not rerun on this new head: historical standalone trainer-gate mutations
  (21 Node / 16 browser in the earlier record); unrelated percentages browser
  gate. Owner's 12-task manual acceptance, a new external exact-head review
  and production smoke remain outstanding release steps.
- Scope deviations: none beyond this owner-authorized remediation and the
  required status reconciliation. The implementation agents' cross-review
  found no remaining concrete blocker; this is not external head approval.
- Rollback remains a PR revert; no production or shared trainer was changed.

## Required handoff

```text
EXECUTIVE STATUS

Task: OGE_COURSE_03B_TASK15
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

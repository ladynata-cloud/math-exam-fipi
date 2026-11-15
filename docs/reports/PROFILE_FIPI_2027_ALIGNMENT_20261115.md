# H02 — соответствие профиля ФИПИ-2027

## Результат реализации

Единая карта `ege-profil/exam-map.js` задаёт 19 официальных позиций: №1–12 первой части и №13–19 второй. Номера служат для отображения и новых ссылок; старые lesson/task IDs, ключи сохранения и значения прежних адресов сохраняют своё назначение.

Исходная база реализации: `c6d0643c05962be5065f531a5910b81fe3d4262d`; последняя разрешённая и включённая main: `5842bd8dce477793eecd67ed961b8e19072eb1dc`. Спецификация: [PROFILE_FIPI_2027_ALIGNMENT_20261115](../tasks/PROFILE_FIPI_2027_ALIGNMENT_20261115.md). Уровень проверки — HIGH. Этот документ фиксирует реализацию и локальные доказательства; точные head, результаты CI, независимого ревью и разрешение на выпуск фиксируются в единственном PR задачи. Наличие этого отчёта не означает публикацию.

## Официальное основание

[Архив ФИПИ-2027 по математике](https://doc.fipi.ru/ege/demoversii-specifikacii-kodifikatory/2027/ma_11_2027.zip), проверенный при подготовке H02: SHA256 `5ca480527a987176d8a0bdb1779260e785e7f53c367537808462e64e4a6ccd77`. Структура содержит19 заданий и32 первичных балла. Баллы второй части:2,3,2,2,3,4,4. Полная таблица содержательного соответствия приведена в спецификации и закреплена направленными проверками общего реестра.

## Что изменено

- Главная профиля и её интерактивная карта, START, вторая часть, карты навыков, азбука методов, связанные тренажёры и Атанасян показывают актуальные номера.
- Новые адреса используют `#fipi/2027/N`; дополнительные темы — `#topic/id`. Старые `#exam/N`, `#calm/N`, `?exam=N` продолжают открывать прежнюю тему. Например, старые Part Two `#exam/19` и methods `?exam=19` означают параметры, теперь №18; новый №19 означает числа.
- Производная и графики №8 отделены от наибольшего/наименьшего значения №12. Старые входы в общую группу9 сохраняют все семь прежних уроков, включая первообразную.
- Финансовая подготовка16 тем/96 задач связана с №16. Это авторские числовые упражнения по финансовым моделям; она не объявляется полным письменным курсом или экспертной оценкой решения. Оптимизация6 тем/36 задач остаётся дополнительной темой.
- Дополнительно доступны случайные величины3/18 и первообразная1/6. Школьные основы и азбука векторов сохранены.
- Каталог кабинета и таблица новых адресов доски генерируются из общего реестра командой `node tools/build-profile-exam-catalog.cjs`; `--check` проверяет обе проекции. Доска переводит новые адреса в прежние зарегистрированные маршруты и не меняет payload/schema/auth.
- Новые круги смешанной проверки содержат12 официальных позиций. Сохранённые13-позиционные круги продолжаются с прежними вопросами и историей. Поле map, новая версия или новый storage key не добавляются: полный массив items однозначно различает длины12/13.
- Старые HTML потребители, не входящие в границы правки, получают общий реестр через однократную загрузку из изменённых shared consumers. Точные общие зависимости START/досок проверяются строгим helper, включая порядок и версии скриптов.

## Сохранность и границы

Полный снимок данных подтверждает90 уроков/540 задач публичного START (исходные81/486 плюс азбука векторов9/54),42 урока/252 задачи Part Two, все challenge IDs и содержимое карт навыков. Математические условия, ответы, модели и порядок задач тождественны базе. Правки внутри START data — номер16 во вводном тексте applied-percent, три подтверждённые подписи источника ФИПИ и две ссылки на печатную страницу15; они явно называют демоверсию общим ориентиром и сохраняют авторство условий. Исторический catalogue ID сохранён как внутренний идентификатор.

Отдельные SHA256 assertions защищают выпущенный H01 parser, START state.js и три файла действующего пробника: bank.js, variant.html, full-exam.html. Пробник, его19 линий,235 минут и историческая шкала2026 не переписываются.

Новые contract/DOM проверки подтверждают все19 текущих входов, дополнительные темы, старые numeric aliases, отсутствие зачёта от навигации, сохранение proof draft/первой ошибки/помощи и прежнего lab key19 при отображаемом №18. Existing skill-map tests проверяют прежние storage keys. New board test проверяет canonical/extra маршруты семи wrappers, неизменность task/lesson identity и восстановление snapshot без personal writes.

H03, H04, H05 и новые финансовые семейства H12 не реализованы. Исправление подсказок степеней идёт отдельным PR#607 и не присоединено. На исходной базе невыпущенный стек скачиваний#601–606 и сборный#608 не присоединялся; последующее включение опубликованной main и явно разрешённых37 путей описано ниже. При изменении main перед выпуском нужна новая композиционная проверка по прямому правилу владельца.

## Проверки

Локально выполнены направленные Node/DOM/математические проверки. В том числе: полный исходный START81/486/1771 шаг; полная защита90/540 и42/252; независимая точная проверка финансовых шагов; сохранения, маршруты, кабинет, навигатор и доски. Набор `npm --prefix ege-profil test` содержит3280 assertions и7600 генерируемых задач планиметрии. Сводка завершающего запуска и неизменённые binding gates фиксируются в PR.

Новые H02 contract/native проверки вызываются из уже исполняемого `tools/profile-part2-engine.test.cjs`. Workflows не меняются. В CI native-suite обязателен: отсутствие Chromium/Playwright или ошибка запуска означает failure. Локальные проверки DOM не выдаются за native browser.

План native H02: ширины320/390/1280;57 переходов по официальным номерам,36 старых адресов,9 дополнительных входов; сохранённые START/Part Two drafts, attempts/help/credit и reload; отсутствие horizontal overflow и ошибок ресурсов. JSON-результаты и screenshots сохраняются штатным profile artifact вместе с неизменёнными27 native H01 cases. Дополнительно должны завершиться existing course/browser/finance/skill-map и четыре board jobs. Фактическое выполнение, а не наличие драйвера, необходимо проверить в CI log.

## Риски и возврат

Главные риски — смешение текущего номера с прежним identity, пропущенный потребитель карты и stale dependency. Их покрывают единый реестр, строгие projections/bindings, старые адреса и сохранённые работы в тестах.

Откат после решения владельца — обычный revert delta H02, без reset/rebase/force и без очистки ученических данных. Старые ключи и задания сохраняются. Ограничение отката: прежний reader поддерживает только13-позиционные checkpoint rounds; новый12-позиционный круг останется сохранённым, но не сможет продолжаться в старом reader до восстановления совместимой версии. Остальные сохранения не требуют миграции. Это ограничение должно учитываться при решении об откате.

## Передача

START разрешил реализацию, тесты, commits/push и Draft PR. Прямой AGENTS.md пользователя требует отдельного разрешения на merge и публикацию. Перед ними нужно заново получить authoritative current main, сверить разрешённые Base/Head и выполнить соответствующий release guard. До такого разрешения H02 на сайте не публикуется.

- Финальное чтение ревью также исправило старые подписи производной/функций и вводный номер финансовой задачи; registry сохраняет прежние стартовые уроки geo-right, eq-linear, expr-powers. Условия и внутренние идентификаторы остаются прежними.

## Продолжение 15 ноября: локальные проверки и восстановление работы

Перед недоступностью среды создан локальный commit `119d12e9aea7df52a985df68644bfb6aba103f4d`. На нём повторный полный профильный набор завершился: **687 tests, 685 PASS, 0 FAIL, 2 явных native SKIP**. Точный математический npm gate: **3280 проверок без отказов**, **7600 генерируемых задач планиметрии без расхождений**, `JUNK_GATE_OK` и `CABINET_SAFETY_OK`. Финансовая арифметика независимо проверена точно:13 уроков,78 задач,442 шага. Также прошли46 navigator regressions,4 preservation tests,5 binding negative controls,8 methods tests и проверка generated catalogue.

Две native suites H01/H02 пропущены только локально: установленный Chromium завершался до открытия страницы с `socket() Operation not permitted`. Ограничение не обходилось; в CI эти suites остаются обязательными. Новые board/cabinet native сценарии не выдаются за выполненные.

### Исправления по независимому ревью

- На трёх вложенных страницах два потребителя могли одновременно запросить `exam-map.js`. Общий `ProfileExamMapReady` и принятие уже загружаемого script устраняют повторный запрос. Исходные contract9/9 и совместный набор19/19 прошли до потери среды; старые loader bytes нарушают negative control.
- Три независимых ожидаемых входа кабинета уточнены до `geo-right`, `eq-linear`, `expr-powers`.
- Native board runner дополнен пятью парами старых/новых входов с одинаковыми lesson/task payloads и пятью проверками текущего alias в общей комнате с reload наблюдателя. Независимый DOM cross-review подтвердил selectors, валидные snapshots и отсутствие изменения прогресса/переноса личных черновиков. Реальный transport/reload timing остаётся за native CI.
- Старое ожидание версий в `profile-t14-visibility.test.cjs` заменено точной обратной подстановкой согласованных H02 bindings. Оба исторических SHA и геометрические assertions сохранены. Проверены7 сцен,94 отрезка,615 ray samples,499 dash samples; добавлены5 отрицательных binding controls.
- Дальнейшее ревью обнаружило случай, когда supplied deferred map уже завершился ошибкой до подписки потребителей. Исправление дополнительно завершает ожидание при window load либо сразу при уже complete document. Асинхронный ещё загружаемый script не считается завершённым на DOMContentLoaded.

### Что удалось проверить после недоступности среды

Локальный `119d12e` не успел попасть в GitHub. Продолжение восстановлено из опубликованного source checkpoint `34cab4c507d6fe4c331ee8338e84375716d7ee9e` и точных записанных patches в той же ветке. Восстановленные loader/browser/manifest bytes сопоставлены с доступными прежними Git blob prefixes; это не объявляется доказательством полной identity недоступного локального tree.

Для последней terminal-loader поправки выполнены синтаксическая проверка и **10 проверок фактических функций в JavaScript isolate с искусственными event targets**. Четыре negative controls на прежнем коде сохраняют воспроизведённое бесконечное ожидание. Это узкая проверка порядка событий; **новый полный Node/jsdom contract, native browser и итоговый CI ещё НЕ выполнены**. Добавлен отдельный regression для ранней deferred ошибки до и после window load. Независимое статическое ревью terminal diff: PASS с этой границей доказательств.

Новые remote head и PR указываются в передаче. Результат685/687 относится к прежнему локальному `119d12e`, а не автоматически к восстановленному head с последней поправкой. Итоговый `PROFILE_FIPI_2027_ALIGNMENT_20261115_OK` ещё не достигнут.

## Зависимость от опубликованных комплектов

Authoritative main при проверке: `5b66ed76438a08f15e5e13ebe1128140189f2daa`. После базы H02 опубликованы PR#601,#602,#604 и#608, относящиеся к скачиваниям и их проверкам. До недоступности среды read-only virtual merge локального `119d12e` с этой main получил16 конфликтующих файлов: provenance manifest, PROJECT_STATUS, methods app,12 HTML/entry areas и script fixture. Виртуальный tree с конфликтами — `d62b3e20da18a85b19556e1e1c3af6a6dd45e5cb`; ветка этим действием не обновлялась. Для нового remote head требуется актуальная повторная композиционная проверка.

Двенадцать опубликованных downloadable HTML/ZIP зависят от H02. ZIP HTML во всех12 побайтово совпадает с соответствующим standalone HTML: текущие копии внутренне согласованы, но содержат прежнюю карту. В частности, START/Part Two ещё показывают№14–20, а methods catalogue — функции№12. Это не означает, что опубликованные автономные файлы перестали открываться.

Инвариант `tools/trainer-download-profile-first.cjs` сравнивает полный exported START bank с source. Независимая in-memory проверка воспроизвела mismatch после H02: в обоих90 уроков/540 задач, но согласованные исправления вводного номера и финансовых source captions меняют данные. Сохранённая копия имеет hash `52998645df529854ac9b98c060042522f36e72dce060cc3d73040b5a5cf1224c`; H02 source — `320e034f013cdf438155d0374b4874bf13412517b68160978a25c0cce5eb1c20`. Проверку нельзя ослаблять: требуется пересборка.

Строгий exporter также требует объявить `/ege-profil/exam-map.js` в manifest assets всех12 копий. Изменять exporter ради обхода этой проверки не требуется.

### Историческое предложение для main5b66ed7 — заменено списком 37 путей

| Slug | HTML | ZIP |
|---|---|---|
| `ege-profil-start` | `downloads/trainers/ege-profil-start/ege-profil-start.html` | `downloads/trainers/ege-profil-start/ege-profil-start-package.zip` |
| `ege-profil-part-two` | `downloads/trainers/ege-profil-part-two/ege-profil-part-two.html` | `downloads/trainers/ege-profil-part-two/ege-profil-part-two-package.zip` |
| `ege-profil-methods-atlas` | `downloads/trainers/ege-profil-methods-atlas/ege-profil-methods-atlas.html` | `downloads/trainers/ege-profil-methods-atlas/ege-profil-methods-atlas-package.zip` |
| `ege-profil-vectors-t2` | `downloads/trainers/ege-profil-vectors-t2/ege-profil-vectors-t2.html` | `downloads/trainers/ege-profil-vectors-t2/ege-profil-vectors-t2-package.zip` |
| `ege-profil-vectors-yashchenko` | `downloads/trainers/ege-profil-vectors-yashchenko/ege-profil-vectors-yashchenko.html` | `downloads/trainers/ege-profil-vectors-yashchenko/ege-profil-vectors-yashchenko-package.zip` |
| `ege-profil-derivative` | `downloads/trainers/ege-profil-derivative/ege-profil-derivative.html` | `downloads/trainers/ege-profil-derivative/ege-profil-derivative-package.zip` |
| `ege-profil-applied` | `downloads/trainers/ege-profil-applied/ege-profil-applied.html` | `downloads/trainers/ege-profil-applied/ege-profil-applied-package.zip` |
| `ege-profil-probability` | `downloads/trainers/ege-profil-probability/ege-profil-probability.html` | `downloads/trainers/ege-profil-probability/ege-profil-probability-package.zip` |
| `ege-profil-functions` | `downloads/trainers/ege-profil-functions/ege-profil-functions.html` | `downloads/trainers/ege-profil-functions/ege-profil-functions-package.zip` |
| `ege-profil-finance` | `downloads/trainers/ege-profil-finance/ege-profil-finance.html` | `downloads/trainers/ege-profil-finance/ege-profil-finance-package.zip` |
| `ege-profil-trigonometry` | `downloads/trainers/ege-profil-trigonometry/ege-profil-trigonometry.html` | `downloads/trainers/ege-profil-trigonometry/ege-profil-trigonometry-package.zip` |
| `ege-profil-planimetry-yashchenko` | `downloads/trainers/ege-profil-planimetry-yashchenko/ege-profil-planimetry-yashchenko.html` | `downloads/trainers/ege-profil-planimetry-yashchenko/ege-profil-planimetry-yashchenko-package.zip` |

Точный дополнительный объём:

1. `downloads/trainers-manifest.json`: объявить общий map только для перечисленных12 entries; уточнить Part Two title/topic/description, разделив36 экзаменационных и6 дополнительных тем оптимизации; штатная дата пересборки.
2. Пересобрать24 HTML/ZIP из таблицы.
3. Штатно обновить `downloads/trainers/ege-profil-part-two/ege-profil-part-two-deepseek-prompt.md` и соответствующие prompt/README внутри его ZIP.
4. `tools/trainer-download-profile-next.cjs`: исправить зависимое ожидание ссылки «Функции и графики · №12» на№11, сохранив проверку public destination; направленно проверить новые/старые входы methods.
5. `tools/trainer-download-profile-first.cjs` и `tools/trainer-download-stage2.browser.cjs`: только связанные проверки embedded map, новых/старых маршрутов, сохранений и числовой области H01; не ослаблять существующие bank/ZIP/GIF assertions.
6. Уже разрешённые task/report/binding записи — фактические результаты композиции.

Это **29 дополнительных путей**:27 для поставки и зависимого expectation плюс2 existing acceptance drivers. Generator implementation, workflows, остальные39 комплектов и GIF не требуют изменения. Существующий scoped режим `--only=<slug> --downloads-only` не переустанавливает панели на страницах.

На этапе недоступности среды следующими условиями были подтверждение ограниченного расширения scope и восстановление исполнения. Среда впоследствии восстановлена, результаты приведены ниже. По последним прямым инструкциям владельца расширение scope и non-fast-forward согласование ветки с актуальной main требуют отдельных явных разрешений. После них — scoped rebuild, новый source checkpoint/bindings, фактические CI/native и независимое HIGH review окончательного head.

## Актуальность инструкций

Во время продолжения владелец временно отменил ранее предоставленный AGENTS.md, затем новым прямым сообщением повторно ввёл полный строгий файл. Действуют последние инструкции: START разрешает согласованную реализацию, commits/push и Draft PR; non-fast-forward согласование ветки, merge и публикация требуют отдельных явных разрешений. Историческая отмена не является текущим разрешением на исправление базы. Утверждённый предмет H02 и явно исключённые области сохраняются до согласования расширения. Командная среда восстановлена, но native Chromium, итоговый CI и композиция с текущей main пока не прошли приёмку.

## Дополнение: опубликован этап7, новая проверенная база

Свежая authoritative main: `5842bd8dce477793eecd67ed961b8e19072eb1dc`, [PR#609](https://github.com/ladynata-cloud/math-exam-fipi/pull/609). Он добавил четыре комплекта по логарифмическим неравенствам и методу «Оценка плюс пример». Предыдущий анализ на5b66ed7 остаётся историческим; для дальнейшей композиции используется новая текущая база после повторной проверки.

Remote-only пересмотр manifest/source dependencies на точном5842bd8 подтвердил **55 комплектов,16 затронутых H02 и39 не затронутых**. К прежним12 добавляются:

| Slug | HTML | ZIP |
|---|---|---|
| `ege-profil-estimate-example` | `downloads/trainers/ege-profil-estimate-example/ege-profil-estimate-example.html` | `downloads/trainers/ege-profil-estimate-example/ege-profil-estimate-example-package.zip` |
| `ege-profil-log-inequalities` | `downloads/trainers/ege-profil-log-inequalities/ege-profil-log-inequalities.html` | `downloads/trainers/ege-profil-log-inequalities/ege-profil-log-inequalities-package.zip` |
| `ege-profil-log-nested` | `downloads/trainers/ege-profil-log-nested/ege-profil-log-nested.html` | `downloads/trainers/ege-profil-log-nested/ege-profil-log-nested-package.zip` |
| `ege-profil-log-variable-base` | `downloads/trainers/ege-profil-log-variable-base/ege-profil-log-variable-base.html` | `downloads/trainers/ege-profil-log-variable-base/ege-profil-log-variable-base-package.zip` |

Три логарифмических комплекта требуют включить `/ege-profil/exam-map.js` в manifest. Комплект `ege-profil-estimate-example` использует изменённые H02 public/content labels20→19 и canonical link, но **не требует** общей карты как нового inline asset. Итого registry объявляется в **15 entries**, пересборка затрагивает **16 HTML и16 ZIP**.

Все четыре новых отдельные prompts избегают экзаменационного номера и сохраняются. Новый `tools/trainer-download-profile-reasoning.cjs` использует проверки содержания/состояния без устаревшего номерного selector и также сохраняется. Зависимое ожидание methods «Функции и графики · №12» по-прежнему исправляется только в уже названном `trainer-download-profile-next.cjs`.

Актуальное предлагаемое расширение — **37 дополнительных путей** вместо29:32 generated HTML/ZIP,1 manifest,1 существующий Part Two prompt,1 dependent expectation/acceptance file и2 existing acceptance drivers. Остальные39 комплектов, все GIF, новые четыре prompts, reasoning driver, генератор и workflows не входят в правку. Старые count12/29 выше описывают только ранее проверенную базу; текущий список — объединение двух таблиц.

Восстановленная ветка H02 не синхронизирована с5842bd8, её архивы не пересобраны.16 конфликтов относятся к историческому virtual merge119/5b66ed7. Последующая проверка точной пары b7a69c/5842bd8 дала19 конфликтов; её результаты приведены ниже.

## Повторная проверка после восстановления среды

Проверена чистая рабочая копия [Draft PR #610](https://github.com/ladynata-cloud/math-exam-fipi/pull/610), head `b7a69c48209e190ab7d1f8061e45ce67844f9c5b`, tree `6724386287a80b4ad83ac27a1d836a88f27ec1b2`. Дата проверки —15 ноября2026; независимая проверка bindings и scope зафиксирована в03:36:13 UTC. Использованы Node24.22.1, jsdom26.1.0 и Playwright1.62.1. Повторный запуск относится к уже исправленному terminal loader.

| Проверка | Фактический результат на b7a69c |
|---|---|
| Полный `tools/profile-*.test.cjs` |689 tests,687 PASS,0 FAIL,2 явных native SKIP |
| H02 contract внутри полного набора |10 top-level tests; ранняя ошибка supplied defer до/после window load выполнена и пройдена |
| `npm --prefix ege-profil test` |3280 проверок,0 отказов;7600 задач планиметрии,0 расхождений; JUNK_GATE_OK и CABINET_SAFETY_OK |
| Точная финансовая арифметика |13 уроков,78 задач,39 моделей,442 шага,0 отказов |
| Methods и navigator preservation |8+4 tests, все PASS |
| Navigator regressions |46/46 PASS |
| Canonical bindings |5/5 PASS;624 HTML/source identities,29 обновлённых rows,110 прежних receipts сохранены |
| Generated cabinet/board catalogue |PROFILE_EXAM_CATALOG_CURRENT |
| Public home coverage |740 eligible:733 покрыты,7 redirects; uncovered0, failures0 |
| Scope и защищённые данные |111 путей в утверждённых областях; H01 parser/state, математические данные, IDs и порядок сохранены |
| Native H02 |Запуск предпринят; Chromium SIGABRT на `socket() failed: Operation not permitted`;0 cases |
| H01/board/cabinet и остальные native |Не повторялись после общего отказа запуска Chromium |
| CI и composed-candidate gates |Не выполнены; GitHub workflow runs для b7 отсутствуют, PR mergeable:false |

Независимая проверка loader и contract выполнена по immutable GitHub blobs: `6b62083c565bbfda1dcea28e082831729481b8a5`, `fc918a8e7fb2a102496f812ca1edb3ad5ad3d298`, `0ec2a6843893f9d2ee9519b37b0ba0c9dad800ce`. Все7 прежних contract tests и helpers сохранены побайтово, добавлены3 tests; ослабления assertions нет. Этот внутренний review не выдаётся за внешнее provider approval или приёмку конфликтной композиции.

### Точная виртуальная композиция

Команда `git merge-tree --write-tree b7a69c48209e190ab7d1f8061e45ce67844f9c5b 5842bd8dce477793eecd67ed961b8e19072eb1dc` завершилась exit1. Виртуальный tree: `94d5f80d8c5f127498e29ed63cf55908eb4057c3`. Git refs, индекс и рабочая ветка этим действием не изменены. **19 конфликтующих путей**:

- `assets/assistant/page-rollout.json`
- `docs/PROJECT_STATUS.md`
- `ege-profil/azbuka-metodov/app.js`
- `ege-profil/azbuka-metodov/index.html`
- `ege-profil/part-two/index.html`
- `ege-profil/start/index.html`
- `ege-profil/trainers/applied-t910.html`
- `ege-profil/trainers/derivative-t8.html`
- `ege-profil/trainers/finance.html`
- `ege-profil/trainers/functions-t1112.html`
- `ege-profil/trainers/planimetry-yashchenko-t1.html`
- `ege-profil/trainers/probability-t45.html`
- `ege-profil/trainers/trigonometry.html`
- `ege-profil/trainers/vectors-t2.html`
- `ege-profil/trainers/vectors-yashchenko-t2.html`
- `tools/profile-journey-public-scripts.test.cjs`
- `trainers/ege-profile/log-inequalities/index.html`
- `trainers/ege-profile/log-inequalities/lesson.html`
- `trainers/ege-profile/log-inequalities/nested.html`

Все27 новых commit-объектов от исходной H02 base до5842bd8 сопоставлены с опубликованными PR#601, #602, #604, #608 и#609; неизвестное происхождение —0. Это подтверждение происхождения current main, а не разрешение переносить её изменения в рабочую ветку.

Для START повторно вычислен source bank90/540: `320e034f013cdf438155d0374b4874bf13412517b68160978a25c0cce5eb1c20`. Current main сохранила прежние HTML blob `89793c042a4bb3a71e78ecd9e066503c3344b85c` и ZIP blob `ef3dd34aac44cbf354a867a2eaa60a7eeedd89f2`; ранее извлечённый из этих же bytes bank имеет hash `52998645df529854ac9b98c060042522f36e72dce060cc3d73040b5a5cf1224c`. Mismatch подтверждён через точную blob identity и новый source probe. Это не объявляется новым полным ZIP/browser прогоном.

### Актуальный список: 37 дополнительных путей

Этот список для main `5842bd8` заменяет прежнее предложение12/29; это **предложение**, не полученное разрешение и не применённый diff.

| Комплект | HTML | ZIP |
|---|---|---|
| `ege-profil-start` | `downloads/trainers/ege-profil-start/ege-profil-start.html` | `downloads/trainers/ege-profil-start/ege-profil-start-package.zip` |
| `ege-profil-part-two` | `downloads/trainers/ege-profil-part-two/ege-profil-part-two.html` | `downloads/trainers/ege-profil-part-two/ege-profil-part-two-package.zip` |
| `ege-profil-methods-atlas` | `downloads/trainers/ege-profil-methods-atlas/ege-profil-methods-atlas.html` | `downloads/trainers/ege-profil-methods-atlas/ege-profil-methods-atlas-package.zip` |
| `ege-profil-vectors-t2` | `downloads/trainers/ege-profil-vectors-t2/ege-profil-vectors-t2.html` | `downloads/trainers/ege-profil-vectors-t2/ege-profil-vectors-t2-package.zip` |
| `ege-profil-vectors-yashchenko` | `downloads/trainers/ege-profil-vectors-yashchenko/ege-profil-vectors-yashchenko.html` | `downloads/trainers/ege-profil-vectors-yashchenko/ege-profil-vectors-yashchenko-package.zip` |
| `ege-profil-derivative` | `downloads/trainers/ege-profil-derivative/ege-profil-derivative.html` | `downloads/trainers/ege-profil-derivative/ege-profil-derivative-package.zip` |
| `ege-profil-applied` | `downloads/trainers/ege-profil-applied/ege-profil-applied.html` | `downloads/trainers/ege-profil-applied/ege-profil-applied-package.zip` |
| `ege-profil-probability` | `downloads/trainers/ege-profil-probability/ege-profil-probability.html` | `downloads/trainers/ege-profil-probability/ege-profil-probability-package.zip` |
| `ege-profil-functions` | `downloads/trainers/ege-profil-functions/ege-profil-functions.html` | `downloads/trainers/ege-profil-functions/ege-profil-functions-package.zip` |
| `ege-profil-finance` | `downloads/trainers/ege-profil-finance/ege-profil-finance.html` | `downloads/trainers/ege-profil-finance/ege-profil-finance-package.zip` |
| `ege-profil-trigonometry` | `downloads/trainers/ege-profil-trigonometry/ege-profil-trigonometry.html` | `downloads/trainers/ege-profil-trigonometry/ege-profil-trigonometry-package.zip` |
| `ege-profil-planimetry-yashchenko` | `downloads/trainers/ege-profil-planimetry-yashchenko/ege-profil-planimetry-yashchenko.html` | `downloads/trainers/ege-profil-planimetry-yashchenko/ege-profil-planimetry-yashchenko-package.zip` |
| `ege-profil-estimate-example` | `downloads/trainers/ege-profil-estimate-example/ege-profil-estimate-example.html` | `downloads/trainers/ege-profil-estimate-example/ege-profil-estimate-example-package.zip` |
| `ege-profil-log-inequalities` | `downloads/trainers/ege-profil-log-inequalities/ege-profil-log-inequalities.html` | `downloads/trainers/ege-profil-log-inequalities/ege-profil-log-inequalities-package.zip` |
| `ege-profil-log-nested` | `downloads/trainers/ege-profil-log-nested/ege-profil-log-nested.html` | `downloads/trainers/ege-profil-log-nested/ege-profil-log-nested-package.zip` |
| `ege-profil-log-variable-base` | `downloads/trainers/ege-profil-log-variable-base/ege-profil-log-variable-base.html` | `downloads/trainers/ege-profil-log-variable-base/ege-profil-log-variable-base-package.zip` |

Ещё5 путей:

1. `downloads/trainers-manifest.json` —15 объявлений общей карты; существующее описание Part Two и дата пересборки.
2. `downloads/trainers/ege-profil-part-two/ege-profil-part-two-deepseek-prompt.md` — согласованные номера и разделение экзаменационных/дополнительных тем.
3. `tools/trainer-download-profile-next.cjs` — зависимое ожидание функции №11 и направленная проверка текущих/старых входов.
4. `tools/trainer-download-profile-first.cjs` — связанные map/route/state/H01 проверки при сохранении полного bank equality.
5. `tools/trainer-download-stage2.browser.cjs` — связанные проверки16 комплектов с сохранением всех прежних assertions и логики этапа7.

Всего32 generated HTML/ZIP +5 путей =37. Остальные39 комплектов, все GIF, четыре новых prompt-файла этапа7, reasoning driver, generator implementation и workflows сохраняются.

### Историческая передача22ef: оставшиеся решения и gate

**BLOCKED_SCOPE_BASE_NATIVE_CI.** Уже разрешённая реализация и поправки сохранены в единственном Draft PR. Дополнительные16 комплектов/37 путей ещё не менялись. Для следующего кандидата требуются:

1. Разрешение ограниченного расширения H02 на37 перечисленных путей.
2. Отдельное разрешение согласовать ветку с точной current main обычным merge и разрешить19 конфликтов, сохранив H02 и опубликованные комплекты. Новое движение main требует новой оценки пары.
3. После разрешённых правок — scoped rebuild, актуальные receipts, полные применимые CI/native и независимая HIGH проверка окончательного кандидата.

Merge PR в main и публикация требуют отдельного решения после готовой проверяемой передачи. Последующие поправки task/report только документируют эти результаты; они не изменяют runtime или tests. Окончательные remote head и повторы проверок фиксируются в PR.

## Разрешённое расширение и согласование ветки

15 ноября2026 владелец явно разрешил указанные выше37 дополнительных путей для16 комплектов и обычное слияние main `5842bd8dce477793eecd67ed961b8e19072eb1dc` в ветку H02 с разрешением19 перечисленных конфликтов. Полный текст решения сохранён в спецификации. Это делает предыдущий список принятым scope; повторное согласие на него не требуется.

Перед действием current main повторно проверена в GitHub и совпала с разрешённой базой. Начальный head — `22ef50f778c641950da2c92278e572115037ba4e`, чистое дерево. Сохраняются H02 и все опубликованные изменения main; более поздние изменения main этим разрешением автоматически не включаются.

В этой фазе прежние результаты687 PASS и3280/7600 относятся к предыдущему head. Результат новой композиции будет записан отдельно после фактических прогонов. История обоих наборов source bindings сохраняется; новая receipt создаётся штатным инструментом только после source checkpoint. Генератор, workflows, математические данные, IDs и схемы сохранения не меняются.

Merge PR #610 в main и публикация остаются отдельным решением после готового проверенного кандидата.

## Выполненное согласование и пересборка

Этот раздел фиксирует первоначальный объединённый кандидат `45e61c0155bd645ea4f26ef1ebeed8ec912d05a4`. Два START артефакта и общий digest32 файлов ниже относятся к этому кандидату; их последующее обновление по результатам CI зафиксировано в следующем разделе.

Разрешённое ordinary merge сохранено source checkpoint `5171beae936cfe2df874e2d08d123dba35abe982` с родителями `22ef50f778c641950da2c92278e572115037ba4e` и `5842bd8dce477793eecd67ed961b8e19072eb1dc`. Его tree — `0cea487721a307e2fbadc3f0d0aa5406ac395d0d`. Все19 конфликтов разрешены, публичные панели и offline-поведение main сохранены вместе с H02. Четыре автоматических слияния дополнительно проверены независимо.

Штатный canonical refresh на этом source checkpoint обновил29 rows из624. Сохранены110 общих исторических receipts,1 отдельная H02 и10 main; добавлена composition receipt №122. Остальные metadata, coverage и provenance сохранены. Повторный запуск даёт `BINDINGS_CURRENT`;5 тестов canonical bindings проходят. Отдельный reviewer независимо проверил blob manifest `3e5bec098c4f1fc0985396a584f11e55dd62283b` и все624 source identities.

Существующий `scripts/build-trainer-downloads.mjs` запущен с `--downloads-only` и ровно16 `--only=<slug>` из утверждённой таблицы. Созданы16 HTML и16 ZIP без предупреждений; штатно обновлён Part Two prompt. Генератор не изменён. Фактическое расширение — ровно37 путей; полный delta относительно разрешённой main содержит148 путей в согласованных областях.

| Проверка объединённого кандидата | Результат |
|---|---|
| Полный профильный набор |692 tests,690 PASS,0 FAIL,2 явных native SKIP |
| Математическая регрессия |3280 проверок,0 отказов;7600 задач планиметрии,0 расхождений |
| Независимые точные финансовые шаги |13 уроков,78 задач,39 моделей,442 шага — PASS |
| Methods / navigator preservation / regressions |8/8,4/4,46/46 PASS |
| Script fixture после объединения |9/9 PASS, включая все3 проверки download controls |
| Generated cabinet/board catalogue |PROFILE_EXAM_CATALOG_CURRENT |
| ZIP integrity |16/16; сохранён точный набор из5 участников каждого архива |
| ZIP member identity |HTML/prompt/GIF/PNG побайтово соответствуют standalone/source;32 встроенных image members сохранены |
| Общая карта |15/15: одна встроенная копия перед потребителями; estimate/example не получил лишний map |
| Inline dependencies |136 копий соответствуют94 source файлам после штатного escaping и trim экспортёра |
| Сохранность |39 других комплектов и244 защищённых файла без изменений;94 source/dependency SHA256 сохранены |
| Независимый review новых acceptance |Прежние263 assertion lines сохранены; только зависимый №12→№11; новые DOM cases16/16 PASS |
| Diff / scope |148 разрешённых путей; лишних0; diff-check PASS |

START source/export теперь имеют один SHA256 банка90/540: `320e034f013cdf438155d0374b4874bf13412517b68160978a25c0cce5eb1c20`. Прежнее расхождение устранено без изменения математических условий, ответов или ослабления bank-equality assertion.

В15 ZIP изменился только HTML; в Part Two дополнительно штатные README и prompt. Четыре prompt-файла этапа7, reasoning driver, workflows, generator implementation и все GIF сохранены. Part Two prompt отражает №13–19 и36/216 основных плюс6/36 дополнительных тем; ограничение финансового покрытия проверено в manifest.description и фактическом UI, поскольку штатный prompt generator не включает description.

SHA256 упорядоченного набора32 артефактов: `2763451c0d26db535956371bd83c35fad0a83758cf43b50fb2f5a7d3e9f76275`.

| Артефакт | SHA256 |
|---|---|
| START HTML |`18542c68329e3a7c3f74cae0ab0b379e49128d9d810d0492a7c03eec9151f58a`|
| START ZIP |`1f4fe23a8eeaa2494d48b2793dfe15c91c4f488cdedaaafd5075462621231478`|
| Part Two HTML |`dae7ed7ca74e1c897d12cc9446cd07c81a5bf04975fc31a08cb0533fdca4aebc`|
| Part Two ZIP |`8c32099a5844766bc5895bc4138463454371ab60a8c9b64f45dfb4c49baf752e`|
| Estimate/example HTML |`c78c22b2bbb03f4574b0184007ec00248018d58d515b9fd66439702fac0e6609`|
| Estimate/example ZIP |`4a9c44f5330d365ce3cf8a8efa0f539d81113e540cd1c469b6fe57f455f2c425`|

### Граница приёмки этого результата

Scope, согласование базы и download closure завершены. Локальные DOM probes использовали mock storage; они не заменяют настоящее поведение file-origin в Chromium. Прежний локальный native launch был заблокирован на socket() до первого сценария; повторов с обходом ограничения не выполнялось.

Новые проверки включены в существующий `trainer-download-stage2.yml`: CI запускает общий runner для всех38 adaptation entries без фильтра, включая16 H02, extracted ZIP на320 и standalone HTML на1280. H01/H02 native и четыре профильных board jobs также остаются обязательными в действующих workflows. Реальные CI/native результаты окончательного head фиксируются в PR после исполнения; этот раздел описывает локальный кандидат и не объявляет итоговый gate или выпуск.

## Исправления по CI объединённого кандидата

Native CI на `45e61c0155bd645ea4f26ef1ebeed8ec912d05a4` обнаружил конкретные несоответствия, которые локальные DOM проверки не выявили. Для следующего кандидата создан source checkpoint `396707a2431914bd0464b2e80f1c27748ea77162`, parent `45e61c0155bd645ea4f26ef1ebeed8ec912d05a4`, tree `7375f5fa21386a106618980a3e2f8693cb3ab53e`. Он изменяет ровно четыре уже согласованных файла:

| Свидетельство CI | Причина и направленная поправка |
|---|---|
| [EGE course entrances](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/43677902493/job/132701974164) | После перехода к12 кнопкам нижняя кнопка №7 оказалась над №14 следующего круга. В compact layout радиус первого круга уменьшен122→117; desktop уже использовал117. Размер44×44 и прежний assertion отсутствия пересечений сохранены. Расчёт по настоящей геометрии и CSS даёт45.23px вместо41.20px между ближайшими центрами при320px; повтор native остаётся обязательным. |
| [Atanasyan legacy entrance](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/43677902538/job/132701974465), также [profile math-and-browser](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/43677902381/job/132701974063) | Старый START `#part-one` потерял прямой вход Атанасяна после перехода к новой карте. После12 основных карточек восстановлены прежние дополнительные панели Атанасяна и неравенств с актуальными №14/15. Отдельный `#exam/15` использует тот же HTML helper. Существующий browser gate не менялся. |
| [H02 native map](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/43677902381/job/132701974047) | Новый selector собирал19 официальных и3 дополнительные карточки как один список номеров. Driver теперь проверяет19 номеров и их точные routes, отдельно3 ordered extras без экзаменационного номера и общий count22. Подпись дополнительной темы проверяется в её eyebrow с учётом отображаемого CSS регистра. |
| [Offline downloads](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/43677902465/job/132701973888) | `innerText` optimisation eyebrow имеет прописные буквы из действующего `text-transform:uppercase`. Одно ожидаемое значение заменено на `/ДОПОЛНИТЕЛЬНАЯ ТЕМА/`. Все route/title/lesson/state assertions сохранены. |

Повторный полный локальный профильный набор на этом source tree:692 tests,690 PASS,0 FAIL,2 явных native SKIP. Существующий Atanasyan static gate:12 уроков,6 семейств,124 шага/поля,68 видов модели,39 ссылок — PASS. Независимый технический review frozen tree завершён без блокирующих замечаний15 ноября2026,04:57:39 UTC; это внутреннее review, не внешний provider approval.

Направленная DOM проверка старого `#part-one` подтверждает12 ordered primary cards, две прямые дополнительные ссылки без hidden/details ancestors и0 записей в storage. Seeded финансовый draft/credit и посторонний прогресс сохранены побайтово. DOM обычного `#calm/first` и отдельного `#exam/15` совпадает с предыдущим кандидатом. Отдельно воспроизведён точный сценарий H02 driver с post-load seed и двумя hash-only переходами без reload: draft12/5, taskId, independent credit и attempts2 сохраняются благодаря действующему persist/mergeSessions.

Source HTML и workflows не менялись; все624 canonical HTML identities и manifest остаются от проверенного source checkpoint5171. Новый binding receipt для поправки только JavaScript и тестов не требуется. `clockwork.js` не входит в зависимости скачиваемых комплектов.

### START после восстановления прежних входов

От source checkpoint396707 штатно выполнено только `node scripts/build-trainer-downloads.mjs --downloads-only --only=ege-profil-start`. Изменены два уже разрешённых артефакта; остальные30 HTML/ZIP из H02 сохраняют прежние SHA256. Все39 других комплектов и244 защищённых файла неизменны. Среди94 source dependencies неизменны93; единственное намеренное изменение — `ege-profil/start/app.js`, SHA256 `1a67bdba443bccc07f9184cb8aa8fb99aac146155fd1e30020d6a562892ab008`.

Встроенный app соответствует исходнику после штатного escaping/trim экспортёра. ZIP содержит те же5 файлов, проходит CRC, его HTML совпадает со standalone; README/prompt/GIF/PNG сохранены. Банк90 уроков/540 задач по-прежнему имеет SHA256 `320e034f013cdf438155d0374b4874bf13412517b68160978a25c0cce5eb1c20`.

Фактические inline scripts автономного START в DOM проверке также дают12 основных карточек, обе восстановленные ссылки с №14/15,0 записей и0 ошибок. Здесь использованы JSDOM, `file:` URL и memory storage adapter; настоящее file-origin persistence подтверждается только native CI.

| Обновлённый артефакт | SHA256 |
|---|---|
| START HTML |`7252c196205cfb3107132b1fa9d7910a73a8916a07671f5f3b64ee4a97e294b1`|
| START ZIP |`a2c227815456477efadaec0f57d61a1a245c67cd955322b87bdfebbd69adeb5f`|
| Упорядоченный набор32 HTML/ZIP |`6dfeabd462b4dc4c4997ee5ccc5cbd10186ca5dfe93f627e3c2ae1da1bdda36e`|

Scope остаётся148 путей, включая37 ранее разрешённых дополнительных. Эти локальные поправки и проверки не заменяют полный CI нового head. Итоговые native counts, точный опубликованный head, HIGH review и отдельное решение о merge/release фиксируются в PR #610 после исполнения.

### Повтор в Chromium после исправлений

- Полный профильный набор в Chromium 139 прошёл без пропусков: 722 из 722 тестов. H02 проверил 57 официальных маршрутов, 36 старых входов и 9 дополнительных тем на ширинах 320, 390 и 1280 px. Сохранённые черновики, попытки, помощь и зачёт восстановились после перезагрузки. Все 27 браузерных проверок H01 также прошли.
- Проверка главных страниц ЕГЭ прошла на 320 и 1280 px. Курс Атанасяна прошёл 12 сценариев с 124 шагами, в том числе восстановление черновиков и возвращение из прежних входов START.
- В комплекте «Оценка плюс пример» тест теперь проверяет видимую ссылку на урок `numbers-extremum` и отдельно резервную HTML-ссылку на `#fipi/2027/19`. В браузере шапка курса показывает прежний №20. Её формирует `trainers/ege-methods/app.js`, который лежит за пределами согласованного списка.

На `main` `0450571ab66391601031e10405634efc7c3bdb5c` уже есть этап 8 (#611) и поправка его проверки (#613). Пробное совмещение выявило три конфликта в `assets/assistant/page-rollout.json`, `docs/PROJECT_STATUS.md` и `ege-profil/trainers/numbers-t19.html`. Проверка экспортёра показала, что для новой карты комплект «Делимость, остатки и инварианты» требует добавить `exam-map.js` в существующий манифест и пересобрать его HTML и ZIP. Эти два артефакта лежат за пределами согласованного списка.

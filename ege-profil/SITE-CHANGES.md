# Правки страниц сайта (накопительно)

## review.html
0. TRAINERS: ege-t1-yashchenko (Планиметрия (Ященко), review:true); NAMES: 19 типов line:1.
1. TRAINERS: righttri-t1 (Прямоугольный треугольник, review:true).
2. TRAINERS: ege-t2-yashchenko (Векторы (Ященко), review:true).
3. NAMES: 16 типов righttri-t1 (line:1) + 7 типов ege-t2-yashchenko (line:2) — в начале объекта.
4. Блок логики (TRAINERS, NAMES, split/open/closed/nameOf) вынесен целиком в
   `registry.js` и подключается как `<script src="registry.js">`. Разметка и
   интерфейсный скрипт не изменились. LINE_TRAINER не тронут.

## index.html
0. Карточка «Планиметрия по Ященко-2026» (задание 1) перед карточкой векторов; pill «Задание 1 по Ященко» в линии 1; адаптер plan1y.
1. Карточка «Прямоугольный треугольник: sin, cos, tg» (задание 1 · фундамент) после «Планиметрии без промахов».
2. Карточка «Векторы по Ященко-2026» (задание 2) следом.
3. Pill «Прямоугольный треугольник» в маршруте, линия 1.
4. Pill «Задание 2 по Ященко» в маршруте, линия 2.
5. Адаптеры прогресса: vec2y и righttri (перед planimetry-блоком по алфавиту вставки).
6. Скрипт адаптеров вынесен в `progress-adapters.js`; тела адаптеров и `bar()`
   перенесены байт в байт, добавлено только «хранилище» — источник данных
   (`liveStore()` — этот браузер, `snapshotStore(obj)` — присланный объект).
   На странице осталось `PROGRESS.mount(document, PROGRESS.liveStore())`.
7. Подвал: ссылки «Кабинет учителя» и «работа над ошибками»; узел `#myCode`
   с кнопкой «Скопировать код прогресса» (`PROGRESS_CODE.mount`, compact).
   Подключены `qr.js` и `progress-code.js`; в стилях — блок панели кода.

## teacher.html (новая страница)
Кабинет учителя: сводка по каждому TID из `RV.CABINET` (главная метрика через
общий адаптер, дата последней ошибки из журнала, список открытых и закрытых
типов по именам из NAMES), выдача кода прогресса этого браузера, просмотр кода
ученика без записи, загрузка с резервной копией в
`mathExamCourseProgress.v1.backup` и возврат из неё. Режим доски, зеркало и
полный экран — через `board-mirror.js`.

## trainers/planimetry-yashchenko-t1.html
1. CSS: `html.mirror body{transform:scaleX(-1)}`, `.boardtools`, показ `#fsBtn`
   только в режиме доски.
2. Шапка: кнопки «Зеркало» и «Во весь экран» рядом с «Режим доски».
3. Скрипт: `setMirror`, `canFullscreen`, `toggleFullscreen`, `urlFlag`;
   в `init()` — обработчики новых кнопок и разбор `?board=1` / `?mirror=1`.
   `setBoard` не изменена, сохранение настройки доски работает как раньше.

## trainers/pryamougolny-treugolnik-trenazher.html
Те же четыре правки, что и в планиметрии, с двумя отличиями по месту:
кнопки добавлены в существующий `.topbtns` (у него уже нужная раскладка,
и мобильный оверрайд остаётся рабочим), а `html.board #fsBtn` — `inline-flex`,
как у остальных `.btn` этого файла. Порядок в `init()`: сохранённая настройка
доски, затем `?board=1`, `?mirror=1`, затем разбор `#t<номер>` и `?mode=review`.
Клики по сторонам чертежа идут через `closest('[data-side]')` — от зеркала
не зависят, но проверены под ним отдельно.

## trainers/vectors-yashchenko-t2.html
Те же четыре правки. Одиночный `<div>` с кнопкой доски заменён на
`.boardtools` с тремя кнопками; `html.board #fsBtn` — `inline-block`.

## tests/links-test.js (новый)
Целостность ссылок: карточки и пилюли `index.html`, «Повторить» и «Отработать»
в `review.html`, `file` из `RV.TRAINERS` и `RV.CABINET`. Непереданная часть
курса — 20 адресов — перечислена в `PENDING`; список проверяется в обе стороны.

## Выложены одиннадцать тренажёров и банк экзамена
`trainers/`: expert, inequalities, interval-method, numbers-t19, parameters-t18,
planimetry-t1, planimetry-t17, probability-t45, trigonometry,
trig-sum-to-product, vectors-t2; плюс `exam/bank.js`.

Имена в присланной папке были перепутаны, поэтому каждый файл сверен по
содержимому до копирования: у кого есть TID/TOPIC_ID — с тем, что ждут
`registry.js` и `CABINET`, у остальных — по `<title>` с названием карточки
в `index.html`. Расхождений ноль.

## Решение по пятёрке перенаправлений
Три ссылки вернулись на локальные файлы курса, две остались на корневой
`trainers/` — по тому, разошлись версии или нет (сравнение с нормализованными
концами строк):

| Тренажёр | Различий с корневой версией | Решение |
| --- | --- | --- |
| finance | 0 — файлы совпадают побайтно, разница только в концах строк | ссылка на корень, дубля нет |
| stereo | 1 строка в `index.html` и `trainer.html`: в корне подключён `js/progress-mail.js`; вдобавок в архиве `js/data.js` — не скрипт, а описание пакета | ссылка на корень, дубля нет |
| trig-sum-to-product | 5438 — версия курса пишет `trig-stp-trainer-v2`, который читает адаптер; корневая пишет общий ключ | локальная версия курса |
| planimetry-t1 | 1405 — в архиве «обучающий тренажёр», в корне «генератор»; TID у обоих один | локальная версия курса |
| vectors-t2 | 54 — в версии курса есть ссылка «← Курс» и правило зазоров подписей | локальная версия курса |

## Пять адресов переписаны на корневой trainers/ (предыдущий шаг)
Эти тренажёры уже опубликованы на сайте под своими именами, поэтому курс
ссылается на них, а не хранит копию под коротким именем. Правки в
`index.html` (карточка и пилюля), `review.html` (`LINE_TRAINER`) и
`registry.js` (`CABINET.file`):

| Было | Стало | Чем подтверждено тождество |
| --- | --- | --- |
| `trainers/planimetry-t1.html` | `../trainers/ege-t1-planimetry-generator.html` | `TID='ege-t1-planimetry-generator'` |
| `trainers/finance.html` | `../trainers/finance-nonstandard-trainer.html` | `TOPIC_ID='financeNonstandardTrainer'` |
| `trainers/trig-sum-to-product.html` | `../trainers/trig-sum-to-product-trainer.html` | `TOPIC_ID='trigSumToProductTrainer'` |
| `trainers/vectors-t2.html` | `../trainers/ege-t2-vectors-trainer.html` | тема |
| `trainers/stereo/index.html` | `../trainers/ege-profile-stereometry-3d/index.html` | тема |

## Проверки
- `node tests/site-test.js` — 32
- `node tests/teacher-test.js` — 75
- `node tests/board-mirror-test.js` — 43
- `node tests/qr-test.js` — 85
- `node tests/links-test.js` — 50
- `node tests/ui-plan-test.js trainers/planimetry-yashchenko-t1.html` — 127
- `node tests/ui-test.js trainers/pryamougolny-treugolnik-trenazher.html` — 847
- `node tests/ui-vec-test.js trainers/vectors-yashchenko-t2.html` — 138
- `node tests/verify-t1-planimetry.js` — 7600 задач, расхождений 0

## Слияние архива курса (24.09.2026)
Архив курса от 22.09.2026 (`profile-ege-course/` — 61 файл, плюс служебные
`_istochniki/` и `patches/`) влит в `ege-profil/` по решениям владельца: дом
курса остаётся здесь, опубликованное (кабинет учителя, MEP1/QR, Ященко,
треугольник #118–#122) сохранено. Ключи прогресса, TID и id задач не
менялись; записи только дополнялись полями. Состав ниже сверен побайтно
(`cmp`) с архивом и с базой `d5c9d03` по итогу всех правок этого PR.

### Из архива побайтно
- `trainers/probability-t45.html`, `trainers/vectors-t2.html` — заменили
  опубликованные. Архивные — надмножество: знак «−» записан литералом
  вместо `\u2212` (поведение то же), снят хвостовой пробел.
- `trainers/lib/mathjax/` — `tex-chtml.js` и 23 шрифта woff (MathJax 3.2.2).
- `trainers/stereo/js/three.min.js`.
- `_istochniki/`: `bank.module18.js`, `bank.module18.old.js`;
  `stereo-bank/problems-{cil,pir,razv,shar,sost}.js`, `verify-shar.js`,
  `audit/*.md`;
  `patches/istoriya/patch-stereo-trainer.txt`.
- `trainers/pryamougolny-treugolnik-trenazher.html` — новая версия архива
  (решение владельца); отличие от архива только в переводах строк
  (CRLF → LF).

### Из архива с нашими правками
Страницы экзамена:
- `exam/bank.js` — модуль 18 архива (восемь генераторов вместо одной
  задачи); хранилище `profile-ege-course-v1` проверяет схему и молча
  отбрасывает мусор, запись — дельтой поверх свежепрочитанного ключа (две
  вкладки не затирают друг друга, показ задачи ничего не пишет).
- `exam/variant.html` — кнопки и поля 44 px, ссылка «← Курс»; первая
  ошибка сразу пишется попыткой без балла, ровно одной на задачу; при
  загрузке страница не прокручивается к полю; статистика, записанная
  другой вкладкой, показывается и здесь.
- `exam/full-exam.html` — 44 px (кнопки, поля, флажок, клетки бланка,
  «← Курс», заголовки «Как решать»); шапка в одну строку с прокручиваемым
  бланком и подсветкой текущего задания, поле в фокусе не уходит под
  шапку; хранилище отбрасывает мусор, баллы пишутся в свою попытку, а не
  в последнюю; ответ ученика экранируется `esc()`.

Тренажёры:
- `trainers/applied-t910.html` — таблица «расстояние / скорость / время»
  помещается в 360 px, клетки и кнопки 44 px; хранилище отбрасывает мусор.
- `trainers/derivative-t8.html` — вкладка «Тренажёр» пишет
  `solvedByType` и журнал ошибок, зачёт тоже пишет журнал, сданный зачёт
  не стирается, двойное нажатие не съедает задачу; «Физический смысл» без
  «0t» и «1t²»; 44 px; `aria-live` на сообщениях проверки.
- `trainers/finance.html` — замок «Учитель»: флаг `financeTeacherKey`
  только по `?teacher=1`, `?teacher=0` снимает; 44 px и видимый фокус;
  хранилище отбрасывает мусор.
- `trainers/functions-t1112.html`, `trainers/stereo-t14.html` — хранилище
  отбрасывает мусор: ключ и своя запись — только объекты, поля проверяются
  по типу, запись меняет только свою ветку (у `functions-t1112` ещё
  перевод строки в конце файла).
- `trainers/inequalities.html` — узкий экран: формулы и таблицы
  прокручиваются внутри блока, а не растягивают страницу; плашка
  «← Курс» 44 px.
- `trainers/interval-method.html` — плашка «← Курс» 44 px, отступ снизу под
  неё; задачник на узком экране без горизонтальной прокрутки.
- `trainers/trigonometry.html`, `trainers/trig-sum-to-product.html` — у
  плашки «← Курс» `min-height` 40 → 44 px, как в неравенствах. Проверено
  на 360 px с касанием и на 1280 px: в конце прокрутки плашка не накрывает
  ни одной кнопки — все 8 вкладок тригонометрии, 10 экранов и режимов
  «суммы → произведения».
- `trainers/parameters-18/index.html` — оглавление читает хранилище с
  проверкой схемы (`keys` — только объект, `drillBest` — только число).
- `trainers/parameters-18/{intro,linear,quadratic,fractional,irrational}.html` —
  кнопки и поля 44 px; хранилище отбрасывает мусор (у `linear`,
  `quadratic`, `fractional` ещё перевод строки в конце файла).
- `trainers/parameters-18/graphic.html` — то же плюс
  `<link rel="canonical">` на `trainers/parameters-t18.html` (та же
  задача, поэтому в sitemap её нет).

Стереометрия (`trainers/stereo/`, объединённая линейка):
- `js/data.js` — собран `_istochniki/stereo-bank/sync-data.js`: 143 задачи
  опубликованной линейки `trainers/ege-profile-stereometry-3d` (id Решу ЕГЭ,
  прежний порядок) + 138 новых + 7 «Развёрток» = 288; пять дублей нового
  набора убраны, условие par-34 переписано.
- `js/data.js`, 26.09.2026 — условия 17 новых задач переписаны своими
  словами (список и «было/стало» — `docs/tasks/STEREO_OWN_WORDING_17.md`);
  решения kon-04, kon-05, kub-13, par-10 и подпись par-35 согласованы
  с новыми условиями; `verify-{cil,kon,par,shar,komb}.js` берут числа
  по имени величины; шапка `data.js` и `README.txt` говорят о переписке,
  а не о повторе шаблона.
- `js/trainer.js` — запись прогресса как в опубликованной линейке
  (`attempts`, `wrong`, `topic`, `updatedAt`, перечитывание перед
  записью); мусор в `stereo3.status` и `stereo3.last.<тема>` отбрасывается;
  старые сцены рисуются прежним кодом, длины — в единицах условия; вращение
  одним пальцем, щипок только масштабирует; память видеокарты освобождается
  при смене задачи; ссылка ведёт на саму задачу Решу ЕГЭ.
- `index.html` — счётчик «281 задача задания 3: 143 из открытого банка,
  138 по типовым моделям», «Развёртки» — приложение; `esc()` в карточках;
  «← Курс профильного ЕГЭ»; «Отправить прогресс».
- `trainer.html` — подзаголовок «открытый банк и типовые модели», `aria-live`
  на проверке, подключён `js/progress-mail.js`.
- `css/style.css` — 44 px у кнопок и поля ответа, `touch-action:none` на
  контейнере холста, видимый фокус, карточка «Отправить прогресс»; на
  320 px поле ответа сжимается, легенда уходит под холст.
- `README.txt` — описание объединённой линейки и происхождения задач.

Служебное (`_istochniki/`, Jekyll не публикует):
- `stereo-bank/engine.js`, `_load.js`, `sync-data.js`, `topic-run.sh`,
  `SPEC.md` — объединённый банк (новый и старый наборы в одном `data.js`),
  пути от нового места.
- `stereo-bank/_check.js` — проверяет и старый банк; `--all` сверяет
  размер каждого из 19 массивов по таблице и итог: 288, без «Развёрток» 281.
- `stereo-bank/render-test.js` — раскладка курса, `pathToFileURL`; считает
  живые WebGL-буферы и текстуры: память видеокарты не растёт от задачи к
  задаче.
- `stereo-bank/problems-{kub,par,priz,kon,komb}.js` — убраны дубли kub-11,
  par-36, priz-03, kon-17, komb-07; par-34 — своё условие.
- `stereo-bank/verify-{kub,par,priz,kon,komb}.js` — убранный дубль не
  должен вернуться в банк (`verify-kon` ещё сверяет обод части конуса).
- `stereo-bank/verify-{kub,par,priz,kon,cil,pir,razv,sost}.js` — обратная
  проверка «модель есть, задачи нет» (в `komb` и `shar` она была в архиве).
- `stereo-bank/istoriya/patch-provenance.py` — примечание: старый банк не
  утерян, возвращён.
- `patches/check-links.py` — корень по умолчанию `ege-profil/`, маркеры
  `CHECK_LINKS_OK`/`CHECK_LINKS_FAIL`, ссылки из комментариев не
  проверяются; с 24.09 ещё: JS-свойства `href:"…"` (оглавление мини-курса),
  точный регистр имени по листингу каталога, у каталога — `index.html`,
  компонент на «_» или «.» (кроме `.htaccess`) — битая ссылка, сироты
  валят проверку.
- `patches/verify5.js` — корень курса по умолчанию, `file://` через
  `pathToFileURL` (работает и на Windows).
- `patches/istoriya/*.py`, `patches/istoriya/README.md` — путь сборочной
  машины убран, корень только через `COURSE_ROOT`.

Новые файлы этого PR (в архиве их нет): `trainers/stereo/js/progress-mail.js`
(«Отправить прогресс», как в опубликованной линейке);
`_istochniki/README.md`; в `_istochniki/stereo-bank/` — `engine-legacy.js`,
`problems-legacy-*.js` и `verify-legacy-*.js` (девять тем старого банка,
все верификаторы понимают `--strict`), `legacy-parity.js` (сверка с
опубликованной линейкой и отпечатки исправленных чертежей `REQUIRED`),
`display-scale.js`, `touch-test.js` (касание на 360 px, обязательные
кнопки — в том числе «Отправить прогресс»), `.gitignore`;
`tests/junk-test.js`.

### Опубликованные файлы курса, изменённые в этом PR
`index.html`, `review.html`, `registry.js`, `progress-adapters.js`,
`README.md`, `SITE-CHANGES.md`, `package.json` (в `npm test` добавлен
`junk-test.js`), `tests/{site,teacher,links}-test.js`; тренажёры
`exam/bank.js`, `inequalities`, `interval-method`, `probability-t45`,
`trigonometry`, `trig-sum-to-product`, `vectors-t2`, треугольник.
`teacher.html`, `progress-code.js`, `qr.js`, `board-mirror.js`,
тренажёры Ященко, `expert`, `numbers-t19`, `parameters-t18`,
`planimetry-t1`, `planimetry-t17` — без изменений. Вход на курс с сайта
(главная, каталог, шапка, sitemap, заглушка `/ege-profile/`) — вне
`ege-profil/`, см. `docs/tasks/EGE_PROFIL_ARCHIVE_MERGE.md`.

### trainers/finance.html (новая, локальная копия)
Архивная копия корневого `finance-nonstandard-trainer.html` с режимом
«Учитель» за `?teacher=1`. Доработан замок: флаг `financeTeacherKey`
ставится только при `?teacher=1` (раньше — при любом значении
параметра), `?teacher=0` его снимает; сохранённый режим `teacher` без
флага откатывается в «Обучение» и записывается. Хранение прогресса
(`mathExamCourseProgress.v1 → financeNonstandardTrainer`) не тронуто.

### index.html (слияние, не подмена)
База — опубликованный навигатор. Из архива: пилюля «Мини-курс: параметры
с нуля» в линии 18, рационализация → `trainers/inequalities.html#m8`
(пилюля и карточка), карточка финансов «14 задач · 11 схем» →
`trainers/finance.html`, стерео (пилюля и карточка) →
`trainers/stereo/index.html`, мета карточки треугольника «6 тем · 16 типов
задач · журнал ошибок». Своё, не из архива: строка фактов с числами
слияния (в архиве — «Тренажёры по всем 19 заданиям… 150 задач
стереометрии», в базе — «17 тренажёров… 143 задачи»; теперь «19
тренажёров… 281 задача стереометрии в 3D и 7 «Развёрток» · финансовая
математика: 14 задач, 11 схем»), карточка стерео «281 задача · 9 тем +
7 «Развёрток»», `<meta name="description">` из первого абзаца. На касании
(`@media (pointer:coarse)`) пилюли маршрута и ссылки «вариант» —
`inline-flex`, не ниже 44 px (было 33,9 и 15,5 px); мышью на десктопе вид
прежний. Кабинет, код прогресса, Ященко и подключение
`progress-adapters.js`/`qr.js`/`progress-code.js` на месте.

### review.html, registry.js
`LINE_TRAINER` (линии 3 и 16) и `CABINET.file` финансов — на локальные
`trainers/stereo/index.html` и `trainers/finance.html`. Подпись
`t1-side` «(уравнение)» из #119 сохранена. Других новшеств в архивном
`review.html` нет. Кнопки `.btn` («Повторить», «Отработать», «Очистить
журнал») — `inline-flex`, не ниже 44 px (были 42,8 и 33 px); «← Курс» на
касании — 44 px.

### progress-adapters.js
- `bar()`: ненулевая доля — хотя бы одна клетка из 10, неполная — не
  больше девяти, вся полоса только при доле ≥ 1 (было — округление
  `ratio·10`: 1 из 30 давало ноль клеток, 29 из 30 — все десять).
- `finance`: решено = записи `stats.doneTasks` из 14 (было — число
  ключей записи тренажёра из 27); без записи — «не начат», без
  решённых — «в работе».
- `stereo`: было — записи `stereo3.status` с `st:"ok"` из 143, любые
  ключи. Стало — только id вида банка (номер открытого банка или
  `kub|par|sost|priz|pir|cil|kon|shar|komb-N`), `razv-*` не в счёт,
  из 281 с потолком (подпись не больше «281 из 281»); без таких записей —
  «не начат», без решённых — «в работе». Знаменатель и форма id сверяются
  с `trainers/stereo/js/data.js` в `site-test`.
- `derivative`: зачёт — как раньше; до зачёта полоса — охват треков: из
  `solvedByType` по восьми известным трекам (`TRACKS` тренажёра, сверяется
  тестом) от каждого берётся не больше 3, знаменатель 24 = 8 × 3; подпись
  «решено задач: N» — фактическое число по этим трекам. 24 решения одного
  трека дают 3 из 24, а не полную полосу.
- Мусор в записях — «нет данных» во всех адаптерах и в маршруте «с чего
  начать»: запись и вложенные объекты — только объекты, счётчики и баллы —
  только конечные неотрицательные числа, `passed` — только `true`,
  попытки пробника — только с числовыми баллами, счёт ограничен
  знаменателем. В подписях больше нет «NaN из 32 очков», «лучший результат
  zz», «x0», «undefined перв.», «ключей: 3 из 6» от строки.

### tests
- `links-test.js`: снят `PENDING`; блок «финансы и стерео из корня» заменён
  проверкой локальных копий; добавлены JS-таблицы `exam/*.html`
  (`LINE_TRAINER`/`TRAINER`, 19 линий, совпадение с журналом), оглавление
  мини-курса (`href:"…"` из `trainers/parameters-18/index.html`: 7 записей —
  шесть глав и `../../exam/variant.html?m=18`), `src`/`href` всех страниц
  курса (в том числе `lib/mathjax/tex-chtml.js`), запрет внешних скриптов
  и ссылок в скрытые от Jekyll каталоги. Существование цели — с точным
  регистром имени на каждом уровне, каталог — только с `index.html`.
- `site-test.js`: карточки и пилюли слияния, строка фактов, адаптеры
  финансов, стерео (только id банка, потолок 281, сверка с `data.js`),
  производной (охват треков, треки = `TRACKS` тренажёра), `bar()`, мусор
  в хранилище (8 видов на всех полосах навигатора), правила 44 px, замок
  режима «Учитель» в `trainers/finance.html`, запись в
  `trainers/derivative-t8.html`, счёт попыток в `exam/variant.html`.
- `teacher-test.js`: финансы, стерео и производная в сводке и в просмотре
  кода; мусор в записях кабинета, в коде ученика и в снимках-не-объектах.
- `junk-test.js` (новый): страницы архива при мусоре в хранилище
  загружаются без исключений, пишут корректную запись и не трогают чужие
  ветки; `variant.html` пишет дельту, `full-exam.html` — свою попытку.

Мутации (на копии дерева, не в репозитории): по адаптерам — 9 из 9
пойманы (снять фильтр id стерео, снять потолок 281, снять потолок трека
производной, строки в `solved4`, попытки пробника без фильтра, `xp` без
проверки числа, `keys`-строка, `best`-строка, запись без проверки
объекта); по ссылкам — 4 из 4 пойманы и `links-test`, и `check-links.py`
(`Finance.html` вместо `finance.html`, каталог `trainers/lib/` без
`index.html`, ссылка в `_istochniki/`, `href:"Linear.html"` в оглавлении).

### Проверки
- `node tests/site-test.js` — 174
- `node tests/teacher-test.js` — 91
- `node tests/board-mirror-test.js` — 43
- `node tests/qr-test.js` — 85
- `node tests/links-test.js` — 78
- `node tests/ui-plan-test.js trainers/planimetry-yashchenko-t1.html` — 127
- `node tests/ui-test.js trainers/pryamougolny-treugolnik-trenazher.html` — 869
- `node tests/ui-vec-test.js trainers/vectors-yashchenko-t2.html` — 138
- `node tests/verify-t1-planimetry.js` — 7600 задач, расхождений 0
- `node tests/junk-test.js` — 987
- `python _istochniki/patches/check-links.py .` — 33 страницы, битых
  ссылок 0, тупиков 0, сирот 0, `CHECK_LINKS_OK`
- Браузер (Playwright + Chrome, 360 px с касанием и 1280 px): `index.html`,
  `review.html`, `trainers/trigonometry.html`,
  `trainers/trig-sum-to-product.html` — ошибок 0, горизонтальной прокрутки
  нет; на 360 px пилюли 44–54,8 px (26 шт.), «вариант» 44 px (19),
  «Отработать» 44 (19), «Повторить» 44, «Очистить журнал» 44, «← Курс»
  журнала 44, плашка «← Курс» тренажёров 44 px; на 1280 px пилюли,
  «вариант» и «← Курс» журнала прежние (33,9, 15,5 и 15 px), кнопки
  журнала — 44.

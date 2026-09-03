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

## Пять адресов переписаны на корневой trainers/
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
- `node tests/links-test.js` — 66
- `node tests/ui-plan-test.js trainers/planimetry-yashchenko-t1.html` — 127
- `node tests/ui-test.js trainers/pryamougolny-treugolnik-trenazher.html` — 847
- `node tests/ui-vec-test.js trainers/vectors-yashchenko-t2.html` — 138
- `node tests/verify-t1-planimetry.js` — 7600 задач, расхождений 0

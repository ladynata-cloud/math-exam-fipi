# MathExam task specification — GIF-инструкции к геометрическим экспериментам

**Статус: START получен 16 ноября 2026; реализация в отдельной ветке. Результат — проверенный Draft PR. Merge и публикация отдельно.**

## Identity

- Task: `GEOMETRY_EXPERIMENT_GIFS_20261116`.
- Owner: владелец MathExam.
- Date: 16 ноября 2026, Asia/Novosibirsk.
- Repository: `ladynata-cloud/math-exam-fipi`.
- Base branch: `main`.
- Audited base SHA: `1469ad50a8659f66c8613164009e7387a3a68f2b`.
- Execution base: `1469ad50a8659f66c8613164009e7387a3a68f2b`, авторитетная main повторно проверена при старте; это не разрешение на merge.
- Actual branch: `feat/geometry-experiment-gifs-20261116`; создана после START и проверки пересечения с текущей гармонизацией.
- Review level: `HIGH` — охват двух общих интерфейсов урока, 147 страниц, сохранение работы и автономные версии.
- Related work: `POGORELOV_COURSES_HARMONIZATION_20261116`; `ATANASYAN_7_11_HARMONIZATION_20261116`, Draft PR [#623](https://github.com/ladynata-cloud/math-exam-fipi/pull/623).
- New ADR: не требуется для использования существующего проигрывателя и способов записи; новую платформу, протокол или архетип не вводить.

## Goal

Ученик открывает эксперимент, видит рядом короткую GIF-инструкцию с реальными кнопками и точками именно этого задания, понимает первое действие и может повторить его на своём чертеже. Просмотр не изменяет его построение, прогноз, ответ или прогресс. В среднем отрезке ученик может сравнить обе требуемые длины на экране.

## Context and evidence

1. На пользовательском снимке открыт [Погорелов, §58 «Средняя линия треугольника»](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-8-58.html), этап «Измени фигуру своими руками». Его инструкция: построить середины AC и BC, соединить их, изменить треугольник и сравнить отрезок с AB.
2. [Исходник этой страницы](https://github.com/ladynata-cloud/math-exam-fipi/blob/1469ad50a8659f66c8613164009e7387a3a68f2b/geometry-pogorelov/atlas/pogorelov-base-8-58.html) прямо ссылается на [аналогичный урок Атанасяна](https://mathexam.space/geometry-course/atlas/midline.html). Поэтому «аналогичный» в этой спецификации означает курс Атанасяна 7–9. Это обоснованное рабочее предположение; пользователь отдельно название второго курса не указал.
3. [Текущий GeoLab Погорелова](https://github.com/ladynata-cloud/math-exam-fipi/blob/1469ad50a8659f66c8613164009e7387a3a68f2b/geometry-pogorelov/assets/lab.js) выводит AB, ∠ACB и площадь; длины построенного среднего отрезка в этой строке нет. Инструкция выбранного инструмента располагается ниже чертежа и панели кнопок.
4. [Геометрическая модель](https://github.com/ladynata-cloud/math-exam-fipi/blob/1469ad50a8659f66c8613164009e7387a3a68f2b/geometry-pogorelov/assets/geometry.js) поддерживает зависимые середины, отрезок между ними, перетаскивание исходных вершин и проверку связей построения. Имена построенных точек назначаются автоматически.
5. В [данных Погорелова](https://github.com/ladynata-cloud/math-exam-fipi/blob/1469ad50a8659f66c8613164009e7387a3a68f2b/geometry-pogorelov/data/course.json) 88 уроков: 84 плоских и 4 пространственных. В [данных Атанасяна](https://github.com/ladynata-cloud/math-exam-fipi/blob/1469ad50a8659f66c8613164009e7387a3a68f2b/geometry-course/data/course.json) 63 плоских урока. Проверенный исходный охват — 147 плоских уроков.
6. Есть [проигрыватель GIF](https://github.com/ladynata-cloud/math-exam-fipi/blob/1469ad50a8659f66c8613164009e7387a3a68f2b/assets/trainer-skill-gif.js) с загрузкой по запросу, остановкой, неподвижными кадрами, подписями и текстовыми шагами. Он использует сетевой manifest и абсолютные пути; автономное подключение требует отдельной проверки. «Остановить» переключает на неподвижный кадр, а не замораживает GIF на текущем кадре.
7. Атанасян выпускается также как HTML со встроенными CSS/JS. Изменения только в исходном assets-файле недостаточно: нужны штатная пересборка и проверка автономной версии.
8. На момент проверки и повторной проверки при START PR #623 открыт и Draft, фактический head `99b3bfb9c231d5fd3b5cdda2c543231171a57618`. Его описание содержит более старый head, поэтому ориентироваться следует на метаданные. На этом head [investigations.js](https://github.com/ladynata-cloud/math-exam-fipi/blob/99b3bfb9c231d5fd3b5cdda2c543231171a57618/geometry-course/assets/investigations.js) уже выводит предметный эксперимент первым, а старый GeoLab перенесён в «Свободные построения и прежний чертёж».
9. Для средней линии в #623 основной опыт использует «Мой прогноз» → «Проверить опытом» → ползунки «Положение C» и «Высота C». Следовательно, инструкция с кнопкой «Середина» подходит сохранённому полю построений, но не заменяет инструкцию к новому основному опыту.
10. Проверены снимок пользователя и исходники через GitHub. При START шесть ресурсов двух курсов (две страницы средней линии, оба lesson.js и оба lab.js) получены по HTTPS с HTTP 200; SHA-256 каждого совпал с исходником execution base. Это сверка шести ресурсов, не приёмка всего сайта. Поиск открытого PR по точному идентификатору Погорелова не дал результата; это не доказывает отсутствие локальной работы или ветки с другим именем.

## Approved scope

Объём согласован явным `START GEOMETRY_EXPERIMENT_GIFS_20261116` в текущем разговоре.

### In scope

- Блоки экспериментов 84 плоских уроков Погорелова и 63 плоских уроков Атанасяна; два урока средней линии — первые обязательные образцы приёмки.
- Для каждого урока — явное соответствие «эксперимент → действие ученика → подходящая GIF → неподвижные шаги». Один ролик допустимо использовать в нескольких уроках только при совпадении видимых кнопок, обозначений, порядка и цели действий.
- Инструкции к основным предметным опытам после гармонизации и к сохранённым ручным построениям — в соответствующих местах интерфейса. Не подменять первый опыт инструкцией к дополнительному полю.
- Короткие записи реального интерфейса: указатель, заметное выделение нажатия, 1 короткая русская подпись на шаг, пауза после действия. Не использовать генеративное изображение для точных кнопок и математического чертежа.
- Рядом с заданием — постоянно видимая карточка «Как выполнить эксперимент» с первым кадром и кнопками запуска, остановки/возврата к кадру, повтора и покадрового просмотра. На узком экране карточка располагается перед действием, на широком — рядом с рабочей областью, если остаётся достаточный размер чертежа.
- Первая короткая инструкция видна без открытия длинной справки. Полный ролик загружается по действию ученика, без одновременного запуска нескольких GIF.
- Исправление, непосредственно необходимое этому примеру: после построения средней линии показывать длины исходной стороны и построенного среднего отрезка с фактическими именами его концов. Длину брать из модели, обновлять при движении; не подставлять готовое наблюдение в ответ ученика.
- Сохранять доступную текстовую последовательность, неподвижные кадры и режим уменьшенного движения. Проверить мышь, клавиатуру и касание.
- Обновить существующие затронутые автономные HTML/ZIP и их штатную запись в реестре, если эти формы уже распространяются.
- Проверить совместимость с текущей гармонизацией. Не перезаписывать незавершённую работу #623 и не восстанавливать старый основной экран. Окончательные записи снимать с согласованного и проверенного исходника.

### Out of scope

- Четыре пространственных урока Погорелова и стереометрия Атанасяна 10–11.
- Отдельные задачники/банки упражнений, дополнение Погорелова вне указанного атласа, новые математические задания.
- Новая платформа видео, новый движок геометрии, серверные API, общая доска и облачная синхронизация.
- Переписывание содержания доказательств, критериев самостоятельного зачёта и формы прогресса.
- Изменение чужих задач гармонизации, исправление всех ранее существующих проблем курсов или распространение компонента на весь сайт.
- Merge, auto-merge и публикация до отдельного разрешения по пользовательскому AGENTS.md этого разговора.

### Files or areas allowed to change

Только изменения, необходимые для описанных GIF-инструкций и их приёмки:

- `geometry-pogorelov/assets/lesson.js`, `lab.js`, `course.css`; конфигурация соответствий для 84 разрешённых уроков.
- `geometry-course/assets/lesson.js`, `lab.js`, `course.css`; `investigations.js` только для подключения инструкции, если этот файл принят в выбранную основу.
- `tools/pogorelov/build.py`, `tools/geometry/build_site.py` — подключение ресурсов и воспроизводимая пересборка соответствующих страниц.
- `geometry-pogorelov/atlas/*.html` только для 84 плоских уроков из приложения; `geometry-course/atlas/*.html` только для существующих 63 уроков.
- Существующий `assets/trainer-skill-gif.js` и его стили — только при необходимости совместимого явного подключения к динамическому этапу; существующие потребители должны остаться рабочими.
- Новый ограниченный каталог ресурсов `assets/geometry-experiment-gifs/`: GIF, неподвижные кадры, текстовые шаги и соответствия. Имена окончательно фиксируются в задаче до реализации.
- Новый воспроизводимый сценарий записи и сборки в `tools/`, использующий существующий способ захвата настоящего интерфейса; без сторонних сервисов.
- Существующие затронутые автономные комплекты и их штатный manifest — точный список определить по проверенной основе до записи; посторонние комплекты должны быть побайтово неизменны.
- Целевые проверки в `tools/`, эта спецификация, отчёт и одна необходимая запись `docs/PROJECT_STATUS.md`.

### Files or areas that must not change

Геометрические формулы и правила построений, учебные банки, ключи/формат сохранений, оценивание самостоятельности, кабинет, общая доска, API, авторизация, сторонние курсы, CI-защита и правила разрешений.

## Concrete storyboard: current manual midline construction

Показать два коротких ролика вместо длинной непрерывной инструкции. Начальная фигура чистая; после загрузки сохранённой работы помощь не запускает сброс.

| Кадр | Действие на записи | Короткая подпись |
| --- | --- | --- |
| 1 | Выделить «Середина», нажать A, затем C | «Середина → A → C» |
| 2 | На чистом примере появляется M; показать зависимость от AC | «Это середина AC» |
| 3 | Выбрать «Середина», нажать B, затем C | «Теперь середина BC» |
| 4 | Выделить «Отрезок», нажать M, затем N | «Соедини две середины» |
| 5 | Показать получившееся построение; остановить | «Повтори на своём чертеже» |

Вторая GIF:

| Кадр | Действие на записи | Короткая подпись |
| --- | --- | --- |
| 1 | Выделить «Двигать» | «Выбери “Двигать”» |
| 2 | Потянуть синюю исходную вершину; зелёные точки следуют автоматически | «Потяни синюю вершину» |
| 3 | Показать рядом длины AB и MN | «Сравни две длины» |
| 4 | Изменить фигуру ещё раз, включая движение конца AB | «Измени размер и сравни снова» |
| 5 | Показать «Проверить построение» и поле наблюдения | «Проверь и запиши, что сохранилось» |

- Важно двигать также A или B: только перемещение C при неподвижных A и B меняет форму, но не длину AB и средней линии.
- В существующей работе имена середин могут отличаться от M и N. Подсказка должна ссылаться на фактически построенные точки; запись с M и N обозначается как чистый пример.
- Просмотр не выполняет построение за ученика и не засчитывает его как самостоятельное действие.
- Наблюдаемую закономерность ученик формулирует сам; общий случай рассматривается в доказательстве.

## Concrete storyboard: harmonized primary midline experiment

Применяется к соответствующему принятому варианту Атанасяна из #623.

1. Указать поле «Мой прогноз»: предложить ученику выбрать своё предположение. В демонстрации допустимо выбрать «Пока не знаю»; не подсказывать правильный вариант.
2. Выделить «Проверить опытом».
3. Изменить «Положение C», затем «Высота C».
4. Сфокусировать внимание на фигуре и показаниях, предложить сравнить несколько положений.
5. Указать поле «Моё наблюдение и вывод» без готового текста ответа.
6. Дополнительный ролик ручного построения размещать внутри «Свободные построения и прежний чертёж».

Не приписывать этому опыту изменение AB: в проверенном исходнике AB = 6, MN = 3, ползунки меняют положение/высоту C. Изменение самой модели ради GIF не входит в эту задачу.

## Interaction inventory

Исходные семейства ручных построений:

| Код | Действие | Погорелов | Атанасян |
| --- | --- | ---: | ---: |
| `midpoint` | Построить середину | 3 | 5 |
| `bisector` | Построить биссектрису | 7 | 4 |
| `median` | Построить медиану | 5 | 4 |
| `parallel` | Провести параллельную | 12 | 11 |
| `explore` | Изменить модель и записать наблюдение | 19 | 9 |
| `perpendicular` | Провести перпендикуляр | 3 | 1 |
| `altitude` | Построить высоту | 13 | 11 |
| `perpbisector` | Построить серединный перпендикуляр | 4 | 2 |
| `diagonal` | Провести диагональ | 12 | 9 |
| `midline` | Построить среднюю линию | 4 | 4 |
| `reflection` | Отразить точку | 2 | 3 |
| **Итого** | | **84** | **63** |

Одиннадцать семейств не равны обещанию ровно одиннадцати достаточных GIF. Дополнительные модели с ползунками и предметные опыты #623 необходимо сопоставить отдельно. При реализации из фактической основы формируется полная таблица покрытия. Нельзя объявить курс покрытым только на основании наличия общего ролика «двигай точку».

## Acceptance criteria

- [x] На двух страницах средней линии ученик видит, с чего начать, до поиска инструкции под панелью инструментов.
- [x] Каждый из 147 разрешённых уроков имеет подходящую инструкцию к своему фактическому основному эксперименту; все исключения перечислены, а не скрыты за общим роликом.
- [x] Каждый показанный шаг можно повторить реальными кнопками на соответствующей странице.
- [x] В ручном опыте средней линии видны обе требуемые длины и они обновляются после движения A/B/C.
- [x] Для сохранённого построения инструкции корректны при других автоматически назначенных именах точек.
- [x] Открытие, проигрывание, остановка и переключение кадров не изменяют прогноз, чертёж, черновик, наблюдение и счётчики ученика.
- [x] После возврата между этапами помощь снова открывается, обработчики не дублируются и чужой ролик не остаётся на экране.
- [x] У каждого ролика доступны неподвижные шаги и текст. При reduced motion анимация не запускается автоматически.
- [x] На 320/390/768/1280 px видны подписи, кнопки и чертёж; нет горизонтального переполнения и перекрытия точек.
- [x] При медленном соединении текст и первый кадр доступны; GIF не загружаются все сразу. Автономные HTML включают байты только своих активных сценариев, движение по нажатию.
- [x] Затронутые автономные HTML работают без сети, включая повторное открытие и помощь. Прежний ZIP не содержит этих страниц и сохранён побайтово.
- [x] Согласованная текущая гармонизация сохранена; сравнение изменённых файлов не показывает посторонних правок.
- Критерий передачи после push: Draft PR содержит точные base/head, фактические проверки, результаты/артефакты и отдельный статус публикации. Выполнение фиксируется метаданными PR и итоговой передачей.

## Checks and gates

- Required tests: повторение записанных UI-сценариев на соответствующих страницах; соответствие mapping каждому разрешённому уроку; отсутствие изменения работы ученика при просмотре помощи; повторное монтирование при переключении этапов.
- Mathematics: для средней линии сравнить измерения с координатами модели, проверить невырожденные формы и корректный текст при вырождении/недостающем построении.
- Required static checks: `git diff --check`; разрешённый набор файлов; доступность GIF/кадров/manifest; корректность размеров и длительностей; воспроизводимость генерации; сохранение старых потребителей общего проигрывателя.
- Existing gates: применимые штатные проверки `tools/geometry/`, `tools/pogorelov/`, действующие проверки автономных комплектов и новых опытов из выбранной основы.
- Manual checks: две страницы средней линии, по одному примеру каждого различающегося сценария и все особые модели; мобильный экран, касание, клавиатура, reduced motion, отсутствие сети.
- Final gate marker: `GEOMETRY_EXPERIMENT_GIFS_OK`, только после фактически пройденных обязательных проверок.
- Проверки до START ограничивались read-only аудитом. Фактические проверки реализации фиксируются в execution record и отчёте.
- Release checks: только после отдельного разрешения — авторитетный remote main непосредственно перед merge и остальные проверки пользовательского AGENTS.md.

## Review plan

- Независимый технический и методический просмотр готового результата внутри команды; полный релевантный набор проверок из-за общего интерфейса и автономной упаковки.
- Review learning question: «Может ли ученик по одному просмотру понять, куда нажать и что сравнить, а затем выполнить опыт самостоятельно?»
- Before implementation: текущий read-only аудит установил точный аналог, поддерживаемые действия, отсутствие MN в показаниях и изменение интерфейса в #623.
- Ready-result review: смотреть сам ролик и живой интерфейс рядом; проверить математику, порядок действий, отсутствие преждевременного раскрытия вывода и доступность.
- External provider review: не выполнялся; не выдавать аудит текущего кода или запись этой спецификации за одобрение будущего PR.
- Любая внешняя передача — только минимальный обезличенный diff и необходимый контекст; без секретов, личных данных и локальных абсолютных путей.
- Если внешний review потребуется: фиксировать provider, PR, base, head, verdict и проверяемый источник/время.

## Risk and rollback

- Основной риск — ролик от старого интерфейса при новом опыте после гармонизации. Контроль: привязка к проверенному исходнику, повторная запись при смене действий.
- Второй риск — регрессии автономного HTML из-за сетевых путей. Контроль: встроенные ресурсы или штатная локальная упаковка, реальная проверка без сети.
- Третий риск — мелкий чертёж и перегрузка движением. Контроль: крупный кадр, короткие подписи, запуск по нажатию, неподвижная альтернатива.
- Четвёртый риск — демонстрация меняет сохранения. Контроль: запись в отдельном тестовом контексте; проигрыватель не вызывает методы рабочего построения.
- Rollback: откат только коммитов этой задачи обычным revert после разрешения; не изменять сохранённые данные и не применять reset/rebase/force.

## Permissions

- `START` granted by owner in the current task conversation: **yes — 16 ноября 2026**.
- Branch creation allowed: **yes — отдельная ветка задачи**.
- Local implementation commits allowed: **yes**.
- Push / Draft PR: **yes — в согласованном объёме**.
- Merge / auto-merge / deployment: **нет отдельного разрешения**.
- Приоритет имеют AGENTS.md, присланные пользователем в этом разговоре. Более широкая формулировка standing publication permission в текущем файле репозитория не отменяет эти явные ограничения.
- Полученная команда начала: `START GEOMETRY_EXPERIMENT_GIFS_20261116`.


## Implementation decisions after START

- Подключение выполняется наблюдением существующих контейнеров этапа: общий lesson.js не переписывается. В #623 основной опыт и сохранённое поле построений получают разные записи.
- Для будущих предметных опытов используются только записи реального интерфейса, построенного из неизменного read-only head #623 `99b3bfb9c231d5fd3b5cdda2c543231171a57618`. Код этого PR не включается в продукт этой задачи.
- На текущей базе существующий ZIP `downloads/trainers/geometry-course/geometry-course-package.zip` содержит 76 записей прежнего курса и не содержит страниц атласа. Его содержимое этой задачей не затронуто; сохранение контрольной суммы проверяется отдельно. Обновляются 63 действующие автономные HTML атласа.
- На сетевых страницах Погорелова медиаданные загружаются по запросу из общего каталога; при недоступности изображений сохраняются текстовые шаги. В существующих автономных HTML Атанасяна встроены только ресурсы текущего урока; их байты входят в HTML для работы без сети, декодирование GIF и движение начинаются по действию ученика.
- Перед включением записей новых опытов проверяются SHA-256 фактического renderer и CSS: изменившийся интерфейс требует новой записи.
- Производные записи идентичности изменённых HTML в `assets/assistant/page-rollout.json` обновляются штатным инструментом после source-коммита; состав rollout и код навигатора не меняются. Это техническое сопровождение разрешённых страниц, не новый пользовательский объём.
- Добавляется отдельная CI-проверка этой функции; существующие проверки и требования не ослабляются.
- При scoped-пересборке сохраняются существующие заголовки, SEO, навигация и учебный контент. Меняются только конфигурация помощи, её ресурсы и точный встроенный исходник lab.js.

## Execution record

- Actual branch: `feat/geometry-experiment-gifs-20261116`; head/PR фиксируются после проверок.
- Actual audited base: `1469ad50a8659f66c8613164009e7387a3a68f2b`.
- Source commit: `b38592213bc4cce0b56183415c558c17d5d20c09`. Производные привязки 147 страниц обновлены отдельно; точный итоговый head фиксируется в Draft PR, чтобы документ не ссылался на собственный будущий hash.
- Tests passed: 46 552 математических assertions Атанасяна; 40 740 checks Погорелова; 16/16 целевых и прежних регрессионных тестов; реальная запись 125 сценариев и проверка 815 изображений; браузерные 147 страниц и 8 адаптивных вариантов; file:// без сети; точный интерфейс #623; сохранность 147 прежних HTML вне подключения; повторная сборка без изменений. Подробности — в [отчёте](../reports/GEOMETRY_EXPERIMENT_GIFS_20261116.md).
- Tests failed: открытых ошибок нет; исправленные проблемы кадрирования и клавиатурного фокуса проверены полным повторным прогоном.
- Дополнительные gates: повторное кодирование двух финальных образцов — 13/13 файлов идентичны; сохранение навигатора — 4/4 теста по 648 страницам; canonical bindings — 5/5 тестов. Независимый внутренний HIGH review — PASS.
- Tests not run: публикация и post-release приёмка; CI точного будущего PR head фиксируется после push.
- Scope deviations: нет; техническое обновление привязок разрешённых страниц и scoped CI описаны выше.
- Следующий шаг: открыть Draft PR и проверить CI точного head. Merge и публикация остаются отдельным решением владельца.

## Required handoff

```text
EXECUTIVE STATUS

Task: GEOMETRY_EXPERIMENT_GIFS_20261116
PR: Draft PR ветки feat/geometry-experiment-gifs-20261116; точная ссылка в передаче
Base: 1469ad50a8659f66c8613164009e7387a3a68f2b (аудированная)
Head: точный SHA в передаче и метаданных PR
Gate: GEOMETRY_EXPERIMENT_GIFS_OK (локально) / NOT_RELEASED
Tests: математические gates, 16 регрессий, 9 тестов навигатора/привязок, 125 записей, 147 страниц, 8 адаптивных вариантов, offline, совместимость #623
Failures: открытых нет
Not run: публикация; статус CI фиксируется на точном PR head
Scope deviations: нет
Recommendation: передать проверенный Draft PR на решение владельца
Next user decision: после проверенного Draft PR — отдельное решение о merge
```

## Appendix — exact initial 2D lesson inventory

Перечень привязан к аудированной базе. Он задаёт границы страниц, а не утверждает, что запись GIF уже выполнена. При изменении исходной базы проверяется сохранение состава и обновляются действия, соответствующие принятой гармонизации.

| Курс | Урок | Семейство текущего ручного построения |
| --- | --- | --- |
| Погорелов | [Прямая: что задают две точки](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-7-1.html) | `midpoint` |
| Погорелов | [Читаем угол и выбираем его вершину](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-7-7.html) | `bisector` |
| Погорелов | [Какие данные удерживают треугольник](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-7-9.html) | `median` |
| Погорелов | [Параллельные прямые](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-7-11.html) | `parallel` |
| Погорелов | [Аксиомы: что принимаем, а что выводим](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-7-12.html) | `explore` |
| Погорелов | [Смежные, вертикальные, прямые](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-7-14.html) | `perpendicular` |
| Погорелов | [Перпендикулярные прямые](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-7-16.html) | `perpendicular` |
| Погорелов | [Доказательство от противного](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-7-17.html) | `perpendicular` |
| Погорелов | [Биссектриса угла](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-7-18.html) | `bisector` |
| Погорелов | [Что надо делать, чтобы успевать по геометрии](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-7-19.html) | `explore` |
| Погорелов | [Какие данные удерживают треугольник](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-7-20.html) | `median` |
| Погорелов | [Равнобедренный треугольник](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-7-23.html) | `altitude` |
| Погорелов | [Обратная теорема](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-7-24.html) | `bisector` |
| Погорелов | [Три линии из вершины: не путать роли](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-7-25.html) | `altitude` |
| Погорелов | [Третий признак равенства треугольников по трём сторонам](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-7-27.html) | `median` |
| Погорелов | [Как готовиться по учебнику самостоятельно](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-7-28.html) | `explore` |
| Погорелов | [Параллельность: свойство и признак](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-7-29.html) | `parallel` |
| Погорелов | [Свойство углов, образованных при пересечении параллельных прямых секущей](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-7-32.html) | `parallel` |
| Погорелов | [Сумма углов, большая сторона, существование](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-7-33.html) | `parallel` |
| Погорелов | [Прямоугольный треугольник](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-7-35.html) | `median` |
| Погорелов | [Существование и единственность перпендикуляра к прямой](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-7-36.html) | `altitude` |
| Погорелов | [Из истории возникновения геометрии](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-7-37.html) | `explore` |
| Погорелов | [Окружность](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-7-38.html) | `perpbisector` |
| Погорелов | [Окружность, описанная около треугольника](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-7-39.html) | `bisector` |
| Погорелов | [Касательная к окружности](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-7-40.html) | `explore` |
| Погорелов | [Окружность, вписанная в треугольник](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-7-41.html) | `bisector` |
| Погорелов | [Задача на построение: анализ и проверка](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-7-42.html) | `perpbisector` |
| Погорелов | [Построение биссектрисы угла](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-7-45.html) | `bisector` |
| Погорелов | [Серединный перпендикуляр: две стороны утверждения](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-7-46.html) | `perpbisector` |
| Погорелов | [Два условия — пересечение двух множеств](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-7-48.html) | `perpbisector` |
| Погорелов | [Определение четырёхугольника](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-8-50.html) | `diagonal` |
| Погорелов | [Параллелограмм: что дано и что следует](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-8-51.html) | `diagonal` |
| Погорелов | [Прямоугольник](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-8-54.html) | `diagonal` |
| Погорелов | [Ромб](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-8-55.html) | `diagonal` |
| Погорелов | [Квадрат](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-8-56.html) | `diagonal` |
| Погорелов | [Теорема Фалеса](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-8-57.html) | `midline` |
| Погорелов | [Средняя линия треугольника](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-8-58.html) | `midline` |
| Погорелов | [Трапеция](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-8-59.html) | `diagonal` |
| Погорелов | [Пропорциональные отрезки](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-8-60.html) | `midline` |
| Погорелов | [Замечательные точки в треугольнике](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-8-61.html) | `median` |
| Погорелов | [Косинус угла](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-8-62.html) | `altitude` |
| Погорелов | [Пифагор через проекции катетов](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-8-63.html) | `altitude` |
| Погорелов | [Перпендикуляр и наклонная](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-8-65.html) | `altitude` |
| Погорелов | [Неравенство треугольника](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-8-66.html) | `explore` |
| Погорелов | [Синус и косинус: сначала выбери угол](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-8-67.html) | `altitude` |
| Погорелов | [Координаты помогают доказать геометрию](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-8-71.html) | `midpoint` |
| Погорелов | [Уравнение окружности](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-8-74.html) | `explore` |
| Погорелов | [Уравнение прямой и принадлежность точки](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-8-75.html) | `explore` |
| Погорелов | [Наклон прямой: изменение y на единицу x](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-8-78.html) | `explore` |
| Погорелов | [Пересечение прямой с окружностью](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-8-80.html) | `explore` |
| Погорелов | [Определение синуса, косинуса, тангенса и котангенса для любого угла от 0° до 180°](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-8-81.html) | `explore` |
| Погорелов | [Что мы раньше называли наложением](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-8-82.html) | `reflection` |
| Погорелов | [Симметрия относительно точки](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-8-84.html) | `midpoint` |
| Погорелов | [Симметрия относительно прямой](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-8-85.html) | `reflection` |
| Погорелов | [Поворот](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-8-86.html) | `explore` |
| Погорелов | [Перенос и поворот: один закон для всех точек](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-8-87.html) | `parallel` |
| Погорелов | [Вектор: переносим направление и длину](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-8-91.html) | `parallel` |
| Погорелов | [Координаты вектора](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-8-93.html) | `parallel` |
| Погорелов | [Маршрут векторов и его итог](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-8-94.html) | `parallel` |
| Погорелов | [Умножение вектора на число](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-8-96.html) | `midline` |
| Погорелов | [Разложение вектора по двум неколлинеарным векторам](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-8-97.html) | `parallel` |
| Погорелов | [Скалярное произведение видит угол](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-8-98.html) | `parallel` |
| Погорелов | [Гомотетия: центр и коэффициент](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-9-100.html) | `parallel` |
| Погорелов | [Как доказать подобие](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-9-103.html) | `parallel` |
| Погорелов | [Подобие прямоугольных треугольников](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-9-106.html) | `altitude` |
| Погорелов | [Углы, вписанные в окружность](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-9-107.html) | `explore` |
| Погорелов | [Углы и произведения отрезков](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-9-108.html) | `explore` |
| Погорелов | [Теорема косинусов](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-9-110.html) | `altitude` |
| Погорелов | [Теорема синусов](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-9-111.html) | `explore` |
| Погорелов | [Соотношение между углами треугольника и противолежащими сторонами](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-9-112.html) | `explore` |
| Погорелов | [Решение треугольников](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-9-113.html) | `altitude` |
| Погорелов | [Многоугольник: внутренняя область и диагонали](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-9-114.html) | `diagonal` |
| Погорелов | [Правильный многоугольник из равных секторов](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-9-116.html) | `explore` |
| Погорелов | [Вписанные и описанные четырёхугольники](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-9-119.html) | `diagonal` |
| Погорелов | [Подобие правильных выпуклых многоугольников](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-9-120.html) | `diagonal` |
| Погорелов | [Дуга, радиан и сектор](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-9-121.html) | `explore` |
| Погорелов | [Площадь: единичный квадрат и разрезание](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-9-123.html) | `diagonal` |
| Погорелов | [Площадь параллелограмма](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-9-125.html) | `altitude` |
| Погорелов | [Площадь треугольника](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-9-126.html) | `altitude` |
| Погорелов | [Равновеликие фигуры](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-9-127.html) | `altitude` |
| Погорелов | [Площадь трапеции](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-9-128.html) | `diagonal` |
| Погорелов | [Формулы для радиусов вписанной и описанной окружностей треугольника](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-9-129.html) | `bisector` |
| Погорелов | [Площади подобных фигур](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-9-130.html) | `diagonal` |
| Погорелов | [Площадь круга](https://mathexam.space/geometry-pogorelov/atlas/pogorelov-base-9-131.html) | `explore` |
| Атанасян | [Прямая: что задают две точки](https://mathexam.space/geometry-course/atlas/segments.html) | `midpoint` |
| Атанасян | [Читаем угол и выбираем его вершину](https://mathexam.space/geometry-course/atlas/angles.html) | `bisector` |
| Атанасян | [Совместить, сравнить, объяснить](https://mathexam.space/geometry-course/atlas/equality.html) | `midpoint` |
| Атанасян | [Части отрезка и единая мера](https://mathexam.space/geometry-course/atlas/length.html) | `midpoint` |
| Атанасян | [Измеряем и складываем углы](https://mathexam.space/geometry-course/atlas/measure-angle.html) | `bisector` |
| Атанасян | [Смежные, вертикальные, прямые](https://mathexam.space/geometry-course/atlas/perpendicular.html) | `perpendicular` |
| Атанасян | [Какие данные удерживают треугольник](https://mathexam.space/geometry-course/atlas/triangle-sas.html) | `median` |
| Атанасян | [Три линии из вершины: не путать роли](https://mathexam.space/geometry-course/atlas/cevians.html) | `altitude` |
| Атанасян | [Признаки равенства и соответствие вершин](https://mathexam.space/geometry-course/atlas/triangle-signs.html) | `median` |
| Атанасян | [Циркуль и линейка: создаём точные связи](https://mathexam.space/geometry-course/atlas/compass.html) | `perpbisector` |
| Атанасян | [Параллельность: свойство и признак](https://mathexam.space/geometry-course/atlas/parallels.html) | `parallel` |
| Атанасян | [Углы при секущей и направление лучей](https://mathexam.space/geometry-course/atlas/parallel-angles.html) | `parallel` |
| Атанасян | [Сумма углов, большая сторона, существование](https://mathexam.space/geometry-course/atlas/triangle-angles.html) | `parallel` |
| Атанасян | [Прямоугольный треугольник: особые связи](https://mathexam.space/geometry-course/atlas/right-triangle.html) | `median` |
| Атанасян | [Кратчайшее расстояние и три элемента](https://mathexam.space/geometry-course/atlas/distance.html) | `altitude` |
| Атанасян | [Почему биссектриса — место равноудалённых точек](https://mathexam.space/geometry-course/atlas/angle-locus.html) | `bisector` |
| Атанасян | [Серединный перпендикуляр: две стороны утверждения](https://mathexam.space/geometry-course/atlas/perp-locus.html) | `perpbisector` |
| Атанасян | [Радиус, хорда и касательная](https://mathexam.space/geometry-course/atlas/chords-tangent.html) | `explore` |
| Атанасян | [Где искать центры двух окружностей](https://mathexam.space/geometry-course/atlas/triangle-circles.html) | `bisector` |
| Атанасян | [Отразить фигуру и сохранить расстояния](https://mathexam.space/geometry-course/atlas/axis.html) | `reflection` |
| Атанасян | [Многоугольник: внутренняя область и диагонали](https://mathexam.space/geometry-course/atlas/polygons.html) | `diagonal` |
| Атанасян | [Параллелограмм: что дано и что следует](https://mathexam.space/geometry-course/atlas/parallelogram.html) | `diagonal` |
| Атанасян | [Трапеция: основания и средняя линия](https://mathexam.space/geometry-course/atlas/trapezoid.html) | `diagonal` |
| Атанасян | [Прямоугольник и равные диагонали](https://mathexam.space/geometry-course/atlas/rectangle.html) | `diagonal` |
| Атанасян | [Ромб, квадрат и иерархия фигур](https://mathexam.space/geometry-course/atlas/rhombus.html) | `diagonal` |
| Атанасян | [Центральная симметрия и середина](https://mathexam.space/geometry-course/atlas/central.html) | `midpoint` |
| Атанасян | [Площадь: единичный квадрат и разрезание](https://mathexam.space/geometry-course/atlas/area-basics.html) | `diagonal` |
| Атанасян | [Почему работает основание на высоту](https://mathexam.space/geometry-course/atlas/area-parallelogram.html) | `altitude` |
| Атанасян | [Половина параллелограмма](https://mathexam.space/geometry-course/atlas/area-triangle.html) | `altitude` |
| Атанасян | [Собираем площадь трапеции](https://mathexam.space/geometry-course/atlas/area-trapezoid.html) | `diagonal` |
| Атанасян | [Пифагор и обратная проверка](https://mathexam.space/geometry-course/atlas/pythagoras.html) | `altitude` |
| Атанасян | [Три стороны дают площадь](https://mathexam.space/geometry-course/atlas/heron.html) | `altitude` |
| Атанасян | [Подобие: длины и площади меняются по-разному](https://mathexam.space/geometry-course/atlas/similarity.html) | `midline` |
| Атанасян | [Как доказать подобие](https://mathexam.space/geometry-course/atlas/similarity-signs.html) | `parallel` |
| Атанасян | [Средняя линия и метод параллельной](https://mathexam.space/geometry-course/atlas/midline.html) | `midline` |
| Атанасян | [Четыре центра: каждому своя роль](https://mathexam.space/geometry-course/atlas/centers.html) | `median` |
| Атанасян | [Высота к гипотенузе и три подобных треугольника](https://mathexam.space/geometry-course/atlas/projections.html) | `altitude` |
| Атанасян | [Дотянуться до недоступной высоты](https://mathexam.space/geometry-course/atlas/similarity-measure.html) | `parallel` |
| Атанасян | [Синус и косинус: сначала выбери угол](https://mathexam.space/geometry-course/atlas/trig-right.html) | `altitude` |
| Атанасян | [Две окружности: когда они встретятся](https://mathexam.space/geometry-course/atlas/circle-position.html) | `explore` |
| Атанасян | [Вписанный угол видит дугу](https://mathexam.space/geometry-course/atlas/inscribed.html) | `explore` |
| Атанасян | [Углы и произведения отрезков](https://mathexam.space/geometry-course/atlas/chord-angles.html) | `explore` |
| Атанасян | [Когда у четырёхугольника есть окружность](https://mathexam.space/geometry-course/atlas/cyclic-quad.html) | `diagonal` |
| Атанасян | [Вектор: переносим направление и длину](https://mathexam.space/geometry-course/atlas/vectors.html) | `parallel` |
| Атанасян | [Маршрут векторов и его итог](https://mathexam.space/geometry-course/atlas/vector-add.html) | `parallel` |
| Атанасян | [Число меняет длину и направление вектора](https://mathexam.space/geometry-course/atlas/vector-scale.html) | `midline` |
| Атанасян | [Два направления как система отсчёта](https://mathexam.space/geometry-course/atlas/vector-basis.html) | `parallel` |
| Атанасян | [Координаты помогают доказать геометрию](https://mathexam.space/geometry-course/atlas/coordinates.html) | `midpoint` |
| Атанасян | [Уравнение как условие принадлежности](https://mathexam.space/geometry-course/atlas/line-circle-equations.html) | `explore` |
| Атанасян | [Тригонометрия выходит за пределы острого угла](https://mathexam.space/geometry-course/atlas/trig-circle.html) | `explore` |
| Атанасян | [Площадь через две стороны и угол](https://mathexam.space/geometry-course/atlas/area-sine.html) | `altitude` |
| Атанасян | [Теорема синусов и описанная окружность](https://mathexam.space/geometry-course/atlas/sine-rule.html) | `explore` |
| Атанасян | [Пифагор с поправкой на угол](https://mathexam.space/geometry-course/atlas/cosine-rule.html) | `altitude` |
| Атанасян | [Выбираем метод для целого треугольника](https://mathexam.space/geometry-course/atlas/solve-triangle.html) | `altitude` |
| Атанасян | [Скалярное произведение видит угол](https://mathexam.space/geometry-course/atlas/dot-product.html) | `parallel` |
| Атанасян | [Правильный многоугольник из равных секторов](https://mathexam.space/geometry-course/atlas/regular-polygons.html) | `explore` |
| Атанасян | [Дуга, радиан и сектор](https://mathexam.space/geometry-course/atlas/circle-metric.html) | `explore` |
| Атанасян | [Что мы раньше называли наложением](https://mathexam.space/geometry-course/atlas/movement.html) | `reflection` |
| Атанасян | [Перенос и поворот: один закон для всех точек](https://mathexam.space/geometry-course/atlas/translation-rotation.html) | `parallel` |
| Атанасян | [Симметрия как способ найти короткий путь](https://mathexam.space/geometry-course/atlas/symmetry-method.html) | `reflection` |
| Атанасян | [От треугольников к подобным фигурам](https://mathexam.space/geometry-course/atlas/polygon-similarity.html) | `diagonal` |
| Атанасян | [Гомотетия: центр и коэффициент](https://mathexam.space/geometry-course/atlas/homothety.html) | `parallel` |
| Атанасян | [Одна задача на нескольких языках](https://mathexam.space/geometry-course/atlas/similarity-method.html) | `midline` |

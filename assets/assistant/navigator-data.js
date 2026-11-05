(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MathExamPublicAssistantData = api;
})(typeof window === 'object' ? window : null, function () {
  'use strict';

  // Reviewed public destinations, not a conversation store or a model prompt.
  // Keep URLs literal: neither a query nor the current path may create a link.
  var rows = [
    ["ege-base-reference", "Справочные материалы базового ЕГЭ", "/ege-baza/reference/exam.html", "ЕГЭ", ["справочник", "справочные листы", "формулы", "булавки", "закрепить лист", "вспомнить формулу"], {"grades": [10, 11], "exam": "ЕГЭ", "examLevel": "базовый"}],
    ["ege-base-map", "Базовый ЕГЭ: карта курса", "/ege-baza/#map", "ЕГЭ", ["карта курса", "маршрут", "план подготовки", "все темы"], {"grades": [10, 11], "exam": "ЕГЭ", "examLevel": "базовый"}],
    ["ege-base-foundation", "Базовый ЕГЭ: вспомнить основу", "/ege-baza/#foundation", "ЕГЭ", ["основы", "повторение", "пробелы", "с нуля"], {"grades": [10, 11], "exam": "ЕГЭ", "examLevel": "базовый"}],
    ["ege-base-progress", "Базовый ЕГЭ: мой прогресс", "/ege-baza/#progress", "ЕГЭ", ["прогресс", "результаты", "достижения", "что пройдено"], {"grades": [10, 11], "exam": "ЕГЭ", "examLevel": "базовый"}],
    ["ege-base-labs", "Базовый ЕГЭ: геометрия и лаборатории", "/ege-baza/labs/index.html", "ЕГЭ", ["геометрия", "лаборатории", "наглядные модели", "планиметрия", "стереометрия"], {"grades": [10, 11], "exam": "ЕГЭ", "examLevel": "базовый"}],
    ["ege-base-percent", "Базовый ЕГЭ: проценты и пропорции", "/ege-baza/percent/index.html", "ЕГЭ", ["проценты", "пропорции", "часть и целое", "скидка"], {"grades": [10, 11], "exam": "ЕГЭ", "examLevel": "базовый"}],
    ["ege-base-work-rate", "Базовый ЕГЭ: задачи на совместную работу", "/ege-baza/work-rate/index.html", "ЕГЭ", ["землекопы", "совместная работа", "производительность", "без уравнений"], {"grades": [10, 11], "exam": "ЕГЭ", "examLevel": "базовый"}],
    ["ege-base-reasoning", "Базовый ЕГЭ: задания 19–21", "/ege-baza/reasoning/index.html", "ЕГЭ", ["логические задачи", "рассуждения", "19 20 21"], {"grades": [10, 11], "exam": "ЕГЭ", "examLevel": "базовый"}],
    ["ege-base-diagnostic", "Базовый ЕГЭ: диагностика 1–21", "/ege-baza/path/index.html#diagnostic", "ЕГЭ", ["диагностика", "проверить уровень", "с чего начать", "проверка знаний"], {"grades": [10, 11], "exam": "ЕГЭ", "examLevel": "базовый"}],
    ["ege-base-path", "Базовый ЕГЭ: тренажёры по позициям 1–21", "/ege-baza/path/index.html#map", "ЕГЭ", ["задания по номерам", "экзаменационные задания", "1–21"], {"grades": [10, 11], "exam": "ЕГЭ", "examLevel": "базовый"}],
    ["ege-base-teacher", "Базовый ЕГЭ: преподавателю", "/ege-baza/#teacher", "ЕГЭ", ["учитель", "преподаватель", "режим учителя"], {"grades": [10, 11], "exam": "ЕГЭ", "examLevel": "базовый"}],
    ["ege-profile-start", "Профильный ЕГЭ: учебный маршрут", "/ege-profil/start/index.html", "ЕГЭ", ["маршрут", "с нуля", "начать подготовку", "курс"], {"grades": [10, 11], "exam": "ЕГЭ", "examLevel": "профильный"}],
    ["ege-profile-inequalities-2027", "Профильный ЕГЭ 2027: неравенства второй части", "/ege-profil/start/index.html#exam/16", "ЕГЭ", ["неравенства", "вторая часть", "номер 16"], {"grades": [10, 11], "exam": "ЕГЭ", "examLevel": "профильный", "task": 16, "taskYear": 2027}],
    ["ege-profile-planimetry-start", "Профильный ЕГЭ: планиметрия по шагам", "/ege-profil/start/index.html#calm/1", "ЕГЭ", ["планиметрия", "первое задание", "углы", "площади"], {"grades": [10, 11], "exam": "ЕГЭ", "examLevel": "профильный", "task": 1, "taskYear": 2027}],
    ["ege-profile-vectors-start", "Профильный ЕГЭ: векторы по шагам", "/ege-profil/start/index.html#calm/2", "ЕГЭ", ["векторы", "второе задание", "скалярное произведение"], {"grades": [10, 11], "exam": "ЕГЭ", "examLevel": "профильный", "task": 2, "taskYear": 2027}],
    ["ege-profile-stereo-start", "Профильный ЕГЭ: стереометрия по шагам", "/ege-profil/start/index.html#calm/3", "ЕГЭ", ["стереометрия", "третье задание", "пространственные фигуры"], {"grades": [10, 11], "exam": "ЕГЭ", "examLevel": "профильный", "task": 3, "taskYear": 2027}],
    ["ege-profile-trigonometry-course", "Профильный ЕГЭ: единый курс тригонометрии", "/ege-profil/trigonometry/index.html", "ЕГЭ", ["тригонометрия", "мордкович", "единичная окружность", "синус", "косинус", "тангенс"], {"grades": [10, 11], "exam": "ЕГЭ", "examLevel": "профильный"}],
    ["ege-profile-log-inequalities", "Профильный ЕГЭ: логарифмические неравенства", "/trainers/ege-profile/log-inequalities/index.html", "ЕГЭ", ["логарифмические неравенства", "одз", "логарифмы", "метод интервалов"], {"grades": [10, 11], "exam": "ЕГЭ", "examLevel": "профильный"}],
    ["ege-profile-derivative", "Профильный ЕГЭ: производная по графику", "/ege-profil/trainers/derivative-t8.html", "ЕГЭ", ["производная", "касательная", "монотонность", "график производной"], {"grades": [10, 11], "exam": "ЕГЭ", "examLevel": "профильный"}],
    ["ege-profile-finance", "Профильный ЕГЭ: финансовая математика", "/ege-profil/trainers/finance.html", "ЕГЭ", ["кредит", "вклад", "платежи", "финансовая математика", "экономическая задача"], {"grades": [10, 11], "exam": "ЕГЭ", "examLevel": "профильный"}],
    ["ege-profile-parameters", "Профильный ЕГЭ: параметры с нуля", "/ege-profil/trainers/parameters-18/index.html", "ЕГЭ", ["параметры", "задача с параметром", "число решений"], {"grades": [10, 11], "exam": "ЕГЭ", "examLevel": "профильный"}],
    ["ege-profile-intervals", "Профильный ЕГЭ: метод интервалов", "/ege-profil/trainers/interval-method.html", "ЕГЭ", ["метод интервалов", "знаки", "рациональные неравенства"], {"grades": [10, 11], "exam": "ЕГЭ", "examLevel": "профильный"}],
    ["ege-profile-inequalities", "Профильный ЕГЭ: курс неравенств", "/ege-profil/trainers/inequalities.html", "ЕГЭ", ["неравенства", "рационализация", "показательные", "логарифмические"], {"grades": [10, 11], "exam": "ЕГЭ", "examLevel": "профильный"}],
    ["ege-profile-trigonometry", "Профильный ЕГЭ: тригонометрический практикум", "/ege-profil/trainers/trigonometry.html", "ЕГЭ", ["тригонометрические уравнения", "отбор корней", "радианы", "таблица значений"], {"grades": [10, 11], "exam": "ЕГЭ", "examLevel": "профильный"}],
    ["ege-profile-probability", "Профильный ЕГЭ: вероятность", "/ege-profil/trainers/probability-t45.html", "ЕГЭ", ["вероятность", "монета", "кубик", "дерево событий", "бернулли"], {"grades": [10, 11], "exam": "ЕГЭ", "examLevel": "профильный"}],
    ["ege-profile-applied", "Профильный ЕГЭ: формулы и текстовые задачи", "/ege-profil/trainers/applied-t910.html", "ЕГЭ", ["текстовые задачи", "формулы", "движение", "работа", "смеси"], {"grades": [10, 11], "exam": "ЕГЭ", "examLevel": "профильный"}],
    ["ege-profile-functions", "Профильный ЕГЭ: графики и наибольшее значение", "/ege-profil/trainers/functions-t1112.html", "ЕГЭ", ["функции", "графики", "максимум", "минимум", "экстремум"], {"grades": [10, 11], "exam": "ЕГЭ", "examLevel": "профильный"}],
    ["ege-profile-full-exam", "Профильный ЕГЭ: пробный экзамен в формате 2026", "/ege-profil/exam/full-exam.html", "ЕГЭ", ["пробник", "полный вариант", "экзамен с таймером"], {"grades": [10, 11], "exam": "ЕГЭ", "examLevel": "профильный", "formatYear": 2026}],
    ["ege-profile-review", "Профильный ЕГЭ: работа над ошибками", "/ege-profil/review.html", "ЕГЭ", ["работа над ошибками", "журнал ошибок", "повторение"], {"grades": [10, 11], "exam": "ЕГЭ", "examLevel": "профильный"}],
    ["ege-profile-expert", "Профильный ЕГЭ: проверь как эксперт", "/ege-profil/trainers/expert.html", "ЕГЭ", ["критерии", "проверка решений", "эксперт", "развёрнутый ответ"], {"grades": [10, 11], "exam": "ЕГЭ", "examLevel": "профильный"}],
    ["oge-tires", "ОГЭ 1–5: Шины: маркировка и размеры колеса", "/trainers/oge-1-5-trainers/practice-1-5-tires.html", "ОГЭ", ["шины", "колёса", "покрышки", "резина", "маркировка", "195/65 r15"], {"grades": [9], "exam": "ОГЭ", "tasks": [1, 2, 3, 4, 5]}],
    ["oge-apartments", "ОГЭ 1–5: Квартиры: план и площади помещений", "/trainers/oge-1-5-trainers/practice-1-5-apartments.html", "ОГЭ", ["квартиры", "план квартиры", "комнаты", "площадь комнаты", "паркет"], {"grades": [9], "exam": "ОГЭ", "tasks": [1, 2, 3, 4, 5]}],
    ["oge-stoves", "ОГЭ 1–5: Печки: объём и выбор печи", "/trainers/oge-1-5-trainers/practice-1-5-stoves.html", "ОГЭ", ["печи", "печки", "баня", "сауна", "объём", "арка"], {"grades": [9], "exam": "ОГЭ", "tasks": [1, 2, 3, 4, 5]}],
    ["oge-land-plots", "ОГЭ 1–5: Участки: план дачи и постройки", "/trainers/oge-1-5-trainers/practice-1-5-land-plots.html", "ОГЭ", ["участок", "дача", "план участка", "постройки", "дорожки", "плитка"], {"grades": [9], "exam": "ОГЭ", "tasks": [1, 2, 3, 4, 5]}],
    ["oge-tariffs", "ОГЭ 1–5: Тарифы: минуты, гигабайты и стоимость", "/trainers/oge-1-5-trainers/practice-1-5-tariffs.html", "ОГЭ", ["тарифы", "сотовая связь", "телефон", "минуты", "гигабайты", "абонентская плата"], {"grades": [9], "exam": "ОГЭ", "tasks": [1, 2, 3, 4, 5]}],
    ["oge-paper-sheets", "ОГЭ 1–5: Листы бумаги: форматы A0–A6", "/trainers/oge-1-5-trainers/practice-1-5-paper-sheets.html", "ОГЭ", ["бумага", "листы", "форматы", "a4", "а4", "масса пачки"], {"grades": [9], "exam": "ОГЭ", "tasks": [1, 2, 3, 4, 5]}],
    ["oge-roads-grid", "ОГЭ 1–5: Дороги по клеткам: расстояния и время", "/trainers/oge-1-5-trainers/practice-1-5-roads-grid.html", "ОГЭ", ["дороги", "карта на клетках", "маршруты", "шоссе", "тропинка", "расстояние"], {"grades": [9], "exam": "ОГЭ", "tasks": [1, 2, 3, 4, 5]}],
    ["oge-roads-schema", "ОГЭ 1–5: Дороги без клеток: схема деревень", "/trainers/oge-1-5-trainers/practice-1-5-roads-schema.html", "ОГЭ", ["дороги без клеток", "деревни", "схема дорог", "маршрут", "пифагор"], {"grades": [9], "exam": "ОГЭ", "tasks": [1, 2, 3, 4, 5]}],
    ["geometry-grade7", "Геометрия 7 класса: курсы и тренажёры", "/geometry-course/grade7/", "Геометрия", ["геометрия 7 класс", "начало геометрии", "атанасян 7"], {"grades": [7], "textbook": "Атанасян"}],
    ["geometry-rebuild", "Геометрия с первых понятий", "/grade7/geometry-rebuild/", "Геометрия", ["с нуля", "первые понятия", "начало геометрии", "7 класс"], {"grades": [7]}],
    ["geometry-angles", "Смежные и вертикальные углы", "/geometry-course/trainers/ch1-p6-t1-adjacent-vertical.html", "Геометрия", ["смежные углы", "вертикальные углы", "лаборатория углов"], {"grades": [7], "textbook": "Атанасян"}],
    ["geometry-parallel", "Признаки параллельности прямых", "/geometry-course/trainers/ch3-p1-t3-sign-lab.html", "Геометрия", ["параллельные прямые", "признаки параллельности", "секущая"], {"grades": [7], "textbook": "Атанасян"}],
    ["geometry-cevians", "Медиана, биссектриса и высота", "/geometry-course/trainers/ch2-p2-t0-three-cevians.html", "Геометрия", ["медиана", "биссектриса", "высота", "три линии"], {"grades": [7], "textbook": "Атанасян"}],
    ["geometry-sas-proof", "Доказательство первого признака равенства треугольников", "/geometry-course/trainers/ch2-p1-t3-proof-sas.html", "Геометрия", ["две стороны и угол между ними", "первый признак", "доказательство равенства", "sas"], {"grades": [7], "textbook": "Атанасян"}],
    ['trainers', 'Каталог тренажёров', '/trainers/', 'Навигация', ['все тренажеры', 'каталог', 'поиск']],
    ['courses', 'Курсы по учебникам и темам', '/courses/', 'Навигация', ['учебники', 'курсы']],
    ['topics', 'Разборы тем', '/topics/', 'Навигация', ['объяснение', 'правило', 'темы']],
    ['teachers', 'Педагогам: материалы для уроков', '/pedagogam/', 'Материалы', ['учителю', 'рабочие листы']],
    ['sheet-fractions', 'Рабочий лист «Дроби без путаницы»', '/pedagogam/materialy/obyknovennye-drobi/', 'Материалы', ['5–6 классы']],
    ['sheet-percent', 'Самостоятельная «Проценты и целое»', '/pedagogam/materialy/procenty/', 'Материалы', ['6–9 классы']],
    ['sheet-linear', 'Карточки «Линейные уравнения по шагам»', '/pedagogam/materialy/lineynye-uravneniya/', 'Материалы', ['6–7 классы']],
    ['sheet-triangles', 'Практикум «Учимся доказывать равенство треугольников»', '/pedagogam/materialy/ravenstvo-treugolnikov/', 'Материалы', ['7 класс']],
    ['sheet-diagnostics', 'Работа «Диагностика вычислений»', '/pedagogam/materialy/diagnostika-vychisleniy/', 'Материалы', ['5–7 классы']],
    ['foundations', 'Начать с основ', '/foundations/', 'Основы', ['основа', 'пробелы', 'проще']],
    ['school', 'Школьная мастерская', '/school/', 'Учебники', ['класс', 'школа', 'виленкин']],
    ['lessons', 'Занятия с преподавателем', '/lessons/', 'Занятия', ['занятия', 'формат']],
    ['contact', 'Обсудить занятия', '/lessons/#contact', 'Занятия', ['репетитор', 'контакты']],
    ['cabinet', 'Открыть мой кабинет', 'https://mathexam-board-ladynata.msk1.amvera.tech/learning/#route', 'Кабинет', ['кабинет', 'вход']],
    ['ege-base', 'ЕГЭ: базовый уровень', '/ege-baza/', 'ЕГЭ', ['егэ база', 'базовый экзамен']],
    ['equations', 'Уравнения: от первых шагов до ОГЭ', '/equations/', 'Алгебра', ['уравнения', 'неизвестное']],
    ['basics', 'Базовые действия', '/trainers/oge-basics/', 'Основы', ['арифметика', 'вычисления', 'знаки', 'дроби']],
    ['arithmetic-route', 'Мой маршрут по арифметике', '/trainers/oge-basics/arithmetic-route.html', 'Основы', ['арифметика', 'считать', 'с самого начала']],
    ['arithmetic-count', 'Сложение и вычитание: от начала к столбику', '/trainers/oge-basics/arithmetic-route.html?skill=count', 'Основы', ['сложение', 'вычитание', 'столбик']],
    ['arithmetic-multiply', 'Умножение: рисунок, таблица и столбик', '/trainers/oge-basics/arithmetic-route.html?skill=multiply', 'Основы', ['умножение', 'таблица', 'столбик']],
    ['arithmetic-division', 'Деление уголком: выбрать следующий шаг', '/trainers/oge-basics/arithmetic-route.html?skill=division', 'Письменные алгоритмы', ['деление', 'уголком', 'остаток']],
    ['arithmetic-decimals', 'Действия с десятичными дробями: маршрут', '/trainers/oge-basics/arithmetic-route.html?skill=decimals', 'Дроби', ['десятичные', 'действия', 'вычисления']],
    ['nod', 'НОД: общий делитель по шагам', '/trainers/grade6-nod.html', 'Основы', ['нод', 'наибольший общий делитель', 'разложение на множители']],
    ['nok', 'НОК: общее кратное по шагам', '/trainers/grade6-nok.html', 'Основы', ['нок', 'наименьшее общее кратное', 'разложение на множители']],
    ['soviet-math', 'Арифметика по советским учебникам', '/soviet-math/', 'Основы', ['советские учебники', 'начальная школа', 'арифметика']],
    ['grade7', '7 класс: алгебра, геометрия и основы', '/grade7/', 'Учебники', ['седьмой класс', 'алгебра', 'геометрия']],
    ['atanasyan', 'Атанасян: геометрия 7–9 классов', '/geometry-course/', 'Геометрия', ['атанасян', 'планиметрия']],
    ['stereo', 'Атанасян: геометрия 10–11 классов', '/stereo-course/', 'Геометрия', ['атанасян', 'стереометрия', 'пространство']],
    ['merzlyak', 'Мерзляк: геометрия 7–9 классов', '/geometry-merzlyak/', 'Геометрия', ['мерзляк']],
    ['merzlyak10', 'Мерзляк: геометрия 10 класса, базовый уровень', '/stereo-course/merzlyak-10-base/', 'Геометрия', ['мерзляк 10', 'стереометрия', 'базовый уровень']],
    ['pogorelov', 'Погорелов: геометрия 7–9 классов', '/geometry-pogorelov/', 'Геометрия', ['погорелов']],
    ['board', 'Тренажёр и цифровая доска', '/trainers/trainer-board.html', 'Инструменты', ['доска', 'инструменты урока']],
    ['mcko-pdf', 'МЦКО: варианты для печати (PDF)', '/trainers/mcko-linejka-4-variants.pdf', 'Ежедневные задания', ['мцко', 'печатный лист']],
    ['mcko', 'Линейка тренажёров МЦКО', '/trainers/trenazher-mcko-linejka-progress.html', 'Ежедневные задания', ['мцко', '6 класс']],
    ['daily-formulas', 'Театр формул: ежедневные задания', '/trainers/teatr-formul-daily.html', 'Ежедневные задания', ['театр формул', 'ежедневные задания']],
    ['algebra7-check', 'Контрольная работа: 7 класс', '/trainers/algebra-7/control-work.html', 'Алгебра', ['контрольная', 'алгебра 7']],
    ['formulas', 'Формулы сокращённого умножения', '/trainers/formuly-sokrashchennogo-umnozheniya.html', 'Алгебра', ['формулы', 'квадрат суммы', 'разность квадратов']],
    ['formulas-short', 'Формулы сокращённого умножения: короткая тренировка', '/trainers/formuly-sokrashchennogo-umnozheniya-trainer.html', 'Алгебра', ['формулы', 'короткий тренажер']],
    ['negative', 'Отрицательные числа на прямой', '/trainers/negative-numbers-line.html', 'Основы', ['отрицательные', 'числовая прямая']],
    ['rounding-stepwise', 'Округление чисел по шагам', '/trainers/rounding-stepwise.html', 'Основы', ['округление']],
    ['decimal-place', 'Касса разрядов: десятичные дроби', '/trainers/decimal-cash-trainer.html', 'Основы', ['разряды', 'десятые', 'сотые']],
    ['simple-equations', 'Простые уравнения', '/trainers/simple-equations-stepwise.html', 'Алгебра', ['простые уравнения', 'обратное действие']],
    ['linear-systems', 'Системы линейных уравнений', '/trainers/linear-systems-trainer.html', 'Алгебра', ['системы', 'подстановка', 'сложение']],
    ['division-stepwise', 'Деление уголком по шагам', '/trainers/long-division-stepwise.html', 'Письменные алгоритмы', ['деление уголком']],
    ['division-digit', 'Подобрать цифру частного', '/trainers/oge-basics/multiplication-division/course-digit-choice.html', 'Письменные алгоритмы', ['выбрать цифру частного при делении']],
    ['division-notebook', 'Деление уголком: тетрадный тренажёр', '/trainers/trainers/long-division.html', 'Письменные алгоритмы', ['тетрадный формат', 'деление']],
    ['multiplication-notebook', 'Умножение столбиком', '/trainers/trainers/long-multiplication.html', 'Письменные алгоритмы', ['умножение столбиком']],
    // The compatibility URLs now redirect to these published lessons. Use the
    // direct routes and retain the existing compatibility pages unchanged.
    ['multiplication-mixed', 'Таблица умножения: вперемешку', '/trainers/oge-basics/multiplication-division/multiplication-mixed.html', 'Таблица умножения', ['таблица умножения', 'вперемешку']],
    ['multiplication-table', 'Умножение и деление: от таблицы к алгоритмам', '/trainers/oge-basics/multiplication-division/', 'Таблица умножения', ['таблица умножения']],
    ['pythagoras-table', 'Таблица Пифагора', '/trainers/oge-basics/multiplication-division/multiplication-pythagoras-table.html', 'Таблица умножения', ['пифагор', 'таблица']],
    ['times-nine', 'Таблица умножения: приёмы, включая ×9', '/trainers/oge-basics/multiplication-division/multiplication-tricks.html', 'Таблица умножения', ['умножение на девять', 'умножение на 9', 'приемы']],
    ['oge', 'Курс подготовки к ОГЭ', '/trainers/oge-course/', 'ОГЭ', ['огэ', 'экзамен 9 класс']],
    ['oge-papers', 'Варианты ОГЭ-2027 по математике для печати', '/oge/variants/2027/', 'Материалы', ['pdf', 'пробники']],
    ['percentages', 'Проценты и пропорции', '/trainers/oge-basics/percentages/', 'Основы', ['проценты', 'пропорции']],
    ['oge-practical', 'ОГЭ 1–5: практические задачи', '/trainers/oge-1-5-trainers/', 'ОГЭ', ['шины', 'печи', 'дороги', 'квартиры', 'тарифы', 'планы']],
    ['oge-practical-diagnostic', 'ОГЭ 1–5: входная диагностика', '/trainers/oge-1-5-trainers/practice-1-5-entry-diagnostic-2026.html', 'ОГЭ', ['диагностика', 'практические задачи']],
    ['oge-plan-reading', 'ОГЭ 1–5: как читать план и условие', '/trainers/oge-1-5-trainers/practice-1-5-plan-reading.html', 'ОГЭ', ['план', 'масштаб', 'условие']],
    ['oge-routes-check', 'ОГЭ 1–5: проверочная по маршрутам', '/trainers/oge-1-5-trainers/practice-1-5-routes-checkpoint-2026.html', 'ОГЭ', ['проверочная', 'маршруты']],
    ['oge-informatics', 'ОГЭ по информатике: задания 1–10', '/trainers/oge-informatics-1-10-tutor.html', 'Информатика', ['огэ информатика']],
    ['oge-19', 'ОГЭ 19: геометрические утверждения', '/trainers/task19-trainer.html', 'ОГЭ', ['утверждения', 'контрпример']],
    ['oge-14', 'ОГЭ 14: прогрессии', '/trainers/oge-task14-progressions.html', 'ОГЭ', ['арифметическая прогрессия', 'геометрическая прогрессия']],
    ['college-functions', 'Графики функций: курс для колледжа', '/trainers/college-functions/', 'Колледж', ['спо', 'колледж', 'графики функций']],
    ['dvi', 'ДВИ: задачи 18–20', '/trainers/dvi/math-18-20.html', 'ДВИ', ['дви', 'вступительные испытания']],
    ['dvi-video', 'ДВИ: видеостудия задач 18–20', '/trainers/dvi/math-18-20-video-studio.html', 'Инструменты', ['дви', 'видео', 'видеостудия']],
    ['college-check', 'Аттестация по математике: 1 курс', '/trainers/attestaciya-1-kurs.html', 'Колледж', ['спо', 'аттестация', 'первый курс']],
    ['ege-base-first', 'ЕГЭ база: числа, деньги и проценты', '/trainers/ege-baza/course/', 'ЕГЭ', ['егэ база', 'числа', 'деньги']],
    ['ege-base-trainers', 'Базовый ЕГЭ: тренажёры по заданиям', '/trainers/ege-baza/', 'ЕГЭ', ['егэ база', 'вариант']],
    ['ege-profile', 'Курс профильного ЕГЭ', '/ege-profil/', 'ЕГЭ', ['егэ профиль', 'профильный']],
    ['ege-planimetry', 'ЕГЭ профиль: планиметрия', '/trainers/ege-t1-planimetry-generator.html', 'ЕГЭ', ['егэ задание 1', 'планиметрия']],
    ['ege-vectors', 'ЕГЭ профиль: векторы', '/trainers/ege-profile-vectors-trainer.html', 'ЕГЭ', ['егэ задание 2', 'векторы']],
    ['ege-vectors-pdf', 'Векторы: домашняя работа (PDF)', '/trainers/ege-profile-vectors-homework.pdf', 'ЕГЭ', ['векторы', 'домашняя работа', 'печатный лист']],
    ['ege-stereo', 'ЕГЭ профиль: стереометрия', '/ege-profil/trainers/stereo/', 'ЕГЭ', ['егэ задание 3', 'стереометрия', '3d']],
    ['informatics-graphs', 'ЕГЭ по информатике: графы', '/trainers/ege-informatics-task1-graphs-trainer.html', 'Информатика', ['егэ информатика', 'графы']],
    ['informatics-logic', 'ЕГЭ по информатике: алгебра логики', '/trainers/logic-trainer/', 'Информатика', ['егэ информатика', 'логика', 'задание 15']],
    ['logic-operations', 'Операции и законы логики', '/trainers/ege-informatics-task15-logic-operations.html', 'Информатика', ['логические операции', 'законы логики']],
    ['turing', 'Машина Тьюринга', '/trainers/turing-trainer-polish.html', 'Информатика', ['тьюринг', 'машина тьюринга']],
    ['python', 'Питоша: тренажёр по Python', '/trainers/pitosha-python-trainer.html', 'Python', ['python', 'питоша', 'питон', 'программирование']],
    ['python-pdf', 'Питоша Python: работа на уроке (PDF)', '/trainers/pitosha-python-classwork.pdf', 'Python', ['python', 'питоша', 'печатный лист']],
    ['constructions', 'Азбука построений', '/azbuka-postroeniy-reviewed/', 'Геометрия', ['построения', 'циркуль', 'линейка']],
    ['bisector', 'Построение биссектрисы', '/trainers/bisector-trainer-v2.html', 'Геометрия', ['биссектриса', 'построение']],
    ['peterson5', 'Петерсон: 5 класс', '/school/peterson5/', 'Учебники', ['петерсон 5', 'петерсен']],
    ['peterson6', 'Дорофеев, Петерсон: 6 класс, часть 1', '/school/peterson6/', 'Учебники', ['петерсон 6', 'дорофеев', 'петерсен']],
    ['peterson-skills', 'Петерсон 6: вычислительные навыки', '/school/peterson6/#skills', 'Учебники', ['вычисления', 'петерсон', 'дроби']],
    ['peterson-fractions', 'Петерсон 6: обыкновенные и десятичные дроби', '/school/peterson6/#lesson/p08', 'Учебники', ['совместные действия', 'смешанные дроби']],
    ['peterson-progress', 'Петерсон 6: мои результаты', '/school/peterson6/#progress', 'Результаты', ['результаты']],
    ['decimal-add', 'Сложение десятичных дробей', '/school/peterson6/#practice/decimal-add/1', 'Дроби', ['складывать десятичные']],
    ['decimal-subtract', 'Вычитание десятичных дробей', '/school/peterson6/#practice/decimal-subtract/1', 'Дроби', ['вычитать десятичные']],
    ['decimal-multiply', 'Умножение десятичных дробей', '/school/peterson6/#practice/decimal-multiply/1', 'Дроби', ['умножать десятичные']],
    ['decimal-divide', 'Деление десятичных дробей', '/school/peterson6/#practice/decimal-divide/1', 'Дроби', ['делить десятичные']],
    ['decimal-to-fraction', 'Из десятичной дроби в обыкновенную', '/school/peterson6/#practice/decimal-to-fraction/1', 'Дроби', ['перевод дробей']],
    ['fraction-to-decimal', 'Из обыкновенной дроби в десятичную', '/school/peterson6/#practice/fraction-to-decimal/1', 'Дроби', ['перевод дробей']],
    ['vilenkin6', 'Виленкин: 6 класс, часть 1', '/courses/vilenkin-6-part-1/', 'Учебники', ['виленкин', '6 класс']],
    ['vilenkin6-textbook', 'Виленкин 6: выбранные задания учебника по шагам', '/courses/vilenkin-6-part-1/textbook.html', 'Учебники', ['виленкин 6', 'учебник', 'разборы']],
    ['prime-factors', 'Простые множители и таблица простых чисел', '/courses/vilenkin-6-part-1/textbook.html#unit/6', 'Основы', ['простые числа', 'разложение на простые множители', 'таблица простых чисел']],
    ['vilenkin5', 'Виленкин: 5 класс', '/school/index.html?course=vilenkin5#course/vilenkin5', 'Учебники', ['виленкин 5', 'пятый класс']],
    ['vilenkin5-part1', 'Виленкин: 5 класс, часть 1', '/courses/vilenkin-5-part-1/', 'Учебники', ['виленкин 5', 'первая часть']],
    ['vilenkin6-topics', 'Виленкин 6: прежний курс по темам', '/school/index.html?course=vilenkin6#course/vilenkin6', 'Учебники', ['виленкин 6', 'темы', 'обзор']],
    ['makarychev7', 'Макарычев: алгебра 7 класса', '/school/makarychev7/', 'Учебники', ['макарычев 7', 'алгебра']],
    ['makarychev8', 'Макарычев: алгебра 8 класса', '/school/makarychev8/', 'Учебники', ['макарычев 8', 'алгебра']],
    ['makarychev9', 'Макарычев: алгебра 9 класса', '/school/index.html?course=makarychev9#course/makarychev9', 'Учебники', ['макарычев 9', 'алгебра']],
    ['alimov', 'Алимов: алгебра 10–11 классов', '/school/alimov10-11/', 'Учебники', ['алимов 10', 'алимов 11', 'алгебра']],
    ['nikolsky', 'Никольский: алгебра 10 класса', '/school/nikolsky10/', 'Учебники', ['никольский 10', 'алгебра']],
    ['division-lab', 'Деление уголком: самостоятельные шаги', '/trainers/oge-basics/multiplication-division/division-lab.html', 'Письменные алгоритмы', ['деление уголком', 'цифра частного']],
    ['base-percent', 'Проценты, пропорции, части и целое', '/ege-baza/percent/', 'Основы', ['процент от числа', 'целое по части']],
    ['work-rate', 'Совместная работа', '/ege-baza/work-rate/', 'Текстовые задачи', ['землекопы', 'производительность', 'совместная работа']],
    ['ordinary-topic', 'Обыкновенные дроби: разбор темы', '/topics/obyknovennye-drobi/', 'Дроби', ['обыкновенные', 'обычные дроби']],
    ['fraction-meaning', 'Смысл дроби и сокращение', '/trainers/oge-basics/fraction-meaning.html', 'Дроби', ['числитель', 'знаменатель', 'сокращение']],
    ['fraction-common', 'Общий знаменатель', '/trainers/oge-basics/fraction-common-denominator.html', 'Дроби', ['общий знаменатель', 'сложение дробей']],
    ['decimal-basics', 'Десятичные дроби: сложение и вычитание', '/trainers/oge-basics/decimal-add-subtract.html', 'Дроби', ['десятичные', 'запятая']],
    ['rounding', 'Округление: разряд и соседняя цифра', '/trainers/oge-basics/rounding.html', 'Основы', ['округление десятичных']],
    ['decimal-divisor', 'Деление на десятичную дробь', '/trainers/oge-basics/multiplication-division/decimal-divisor-shift.html', 'Дроби', ['десятичный делитель', 'перенос запятой']],
    ['negative-basics', 'Отрицательные числа: начало', '/trainers/oge-basics/negative-number-line.html', 'Основы', ['отрицательные', 'сравнение чисел']],
    ['order', 'Порядок действий', '/trainers/oge-basics/order-of-operations.html', 'Основы', ['скобки', 'порядок действий']],
    ['units', 'Единицы длины и времени', '/trainers/oge-basics/units-length-time.html', 'Основы', ['единицы', 'сантиметры', 'метры', 'минуты']],
    ['units-area', 'Единицы площади', '/trainers/oge-basics/units-area.html', 'Основы', ['квадратные единицы', 'площадь']],
    ['oge-geometry-topic', 'Геометрия ОГЭ: разбор тем', '/topics/oge-geometriya/', 'ОГЭ', ['геометрия огэ']],
    ['oge-geometry', 'ОГЭ: геометрические тренажёры', '/trainers/oge-course/#geometry', 'ОГЭ', ['геометрия огэ']],
    ['oge-6', 'ОГЭ 6: обыкновенные и десятичные дроби', '/trainers/oge-task6-fractions.html', 'ОГЭ', ['вычисления', 'дроби']],
    ['oge-7', 'ОГЭ 7: координатная прямая', '/trainers/oge-task7-number-line.html', 'ОГЭ', ['сравнение чисел', 'координатная прямая']],
    ['oge-8', 'ОГЭ 8: степени и корни', '/trainers/oge-task8-powers-roots.html', 'ОГЭ', ['степени', 'корни']],
    ['oge-9', 'ОГЭ 9: уравнения', '/trainers/oge-task9-equations.html', 'ОГЭ', ['уравнения']],
    ['oge-10', 'ОГЭ 10: вероятность', '/trainers/oge-task10-probability.html', 'ОГЭ', ['вероятность']],
    ['oge-11', 'ОГЭ 11: графики функций', '/trainers/oge-task11-graphs-trainer.html', 'ОГЭ', ['графики функций']],
    ['oge-12', 'ОГЭ 12: расчёты по формулам', '/trainers/oge-task12-formulas-trainer.html', 'ОГЭ', ['расчеты по формулам']],
    ['oge-13', 'ОГЭ 13: неравенства', '/trainers/oge13-inequalities-series.html', 'ОГЭ', ['неравенства']],
    ['oge-15', 'ОГЭ 15: треугольники', '/trainers/oge-task15-triangles.html', 'ОГЭ', ['треугольники', 'биссектрисы']],
    ['oge-16', 'ОГЭ 16: окружность', '/trainers/oge-task16-circle.html', 'ОГЭ', ['окружность', 'касательная', 'хорда']],
    ['oge-17', 'ОГЭ 17: четырёхугольники', '/trainers/oge-task17-quadrilaterals.html', 'ОГЭ', ['четырехугольники', 'ромб', 'трапеция']],
    ['oge-18', 'ОГЭ 18: фигуры на клетчатой бумаге', '/trainers/oge-task18-grid.html', 'ОГЭ', ['клетки', 'клетчатая бумага']],
    ['oge-20', 'ОГЭ 20: алгебра второй части', '/trainers/oge-task20-equations.html', 'ОГЭ', ['алгебра', 'вторая часть']],
    ['oge-21', 'ОГЭ 21: текстовые задачи', '/trainers/oge-task21-word-problems.html', 'ОГЭ', ['движение', 'работа', 'смеси']],
    ['oge-22', 'ОГЭ 22: графики и параметры', '/trainers/oge-task22-functions-graphs.html', 'ОГЭ', ['графики', 'параметры']],
    ['oge-23', 'ОГЭ 23: геометрические вычисления', '/trainers/oge-task23-geometry-calculations.html', 'ОГЭ', ['геометрия', 'вычисления']],
    ['oge-24', 'ОГЭ 24: доказательства', '/trainers/oge-task24-proofs.html', 'ОГЭ', ['доказательства']],
    ['oge-25', 'ОГЭ 25: сложная геометрия', '/trainers/oge-task25-geometry.html', 'ОГЭ', ['геометрия', 'вторая часть']],
    ['congruence', 'Признаки равенства и соответствие вершин', '/geometry-course/atlas/triangle-signs.html', 'Геометрия', ['признаки равенства треугольников', 'атанасян']],
    ['congruence-first', 'Выбор первого или второго признака', '/geometry-course/trainers/ch2-p3-t3-which-sign.html', 'Геометрия', ['первый признак', 'второй признак']],
    ['congruence-all', 'Выбор из трёх признаков равенства', '/geometry-course/trainers/ch2-p4-t3-which-sign.html', 'Геометрия', ['третий признак', 'равенство треугольников']],
    ['atanasyan-textbook', 'Атанасян 7–9: занятия по учебнику', '/geometry-course/textbook/', 'Учебники', ['атанасян', 'учебник']],
    ['ichenskaya', 'Иченская: самостоятельные и контрольные работы 7 класса', '/geometry-course/ichenskaya-7-works/', 'Учебники', ['иченская', 'геометрия 7', 'самостоятельные', 'контрольные']],
    ['stereo-textbook', 'Атанасян 10–11: занятия по учебнику', '/stereo-course/textbook/', 'Учебники', ['атанасян 10', 'атанасян 11', 'учебник', 'стереометрия']],
    ['similarity', 'Признаки подобия треугольников', '/geometry-course/atlas/similarity-signs.html', 'Геометрия', ['подобие треугольников']],
    ['pythagoras', 'Теорема Пифагора', '/geometry-course/atlas/pythagoras.html', 'Геометрия', ['теорема пифагора', 'катет', 'гипотенуза']]
  ];
  var catalogue = Object.freeze(rows.map(function (r) {
    return Object.freeze(Object.assign({}, r[5] || {}, { id: r[0], title: r[1], url: r[2], category: r[3], tags: Object.freeze(r[4].slice()) }));
  }));
  var byId = Object.create(null);
  catalogue.forEach(function (entry) { byId[entry.id] = entry; });

  function normalize(value) {
    // NFKC turns the Russian number sign into "No"; preserve its meaning first.
    return value.replace(/№/g, ' номер ').normalize('NFKC').toLowerCase().replace(/ё/g, 'е')
      .replace(/(^|[^а-яa-z])([ое])ге(?=$|[^а-яa-z])/g, '$1$2гэ')
      .replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }
  function pathContext(pathname) {
    if (typeof pathname !== 'string' || pathname.length > 500 || !/^\/[a-z0-9_./-]*$/i.test(pathname)) return '';
    if (/^\/school\/peterson6(?:\/|$)/.test(pathname)) return 'peterson6';
    if (/^\/school\/peterson5(?:\/|$)/.test(pathname)) return 'peterson5';
    if (/^\/geometry-course(?:\/|$)/.test(pathname)) return 'atanasyan';
    if (/^\/stereo-course(?:\/|$)/.test(pathname)) return 'stereo';
    if (/^\/ege-profil(?:\/|$)/.test(pathname)) return 'ege-profile';
    if (/^\/(?:trainers\/)?ege-baza(?:\/|$)/.test(pathname)) return 'ege-base';
    if (/^\/oge\//.test(pathname) || /^\/trainers\/oge-(?:course|task\d|1-5)/.test(pathname) || pathname === '/trainers/task19-trainer.html' || /^\/topics\/oge-geometriya\//.test(pathname)) return 'oge';
    if (/^\/trainers\/oge-basics(?:\/|$)/.test(pathname) || /^\/foundations(?:\/|$)/.test(pathname)) return 'basics';
    return '';
  }
  function links(ids) {
    return ids.slice(0, 3).map(function (id) { return { title: byId[id].title, url: byId[id].url }; });
  }
  function choice(label, text) { return { label: label, text: text || label }; }
  function result(kind, text, ids, state, actions) {
    var value = { text: text, links: links(ids || []), kind: kind,
      difficultyCount: state ? state.difficultyCount : 0,
      referralShown: state ? state.referralShown : false };
    if (actions && actions.length) value.actions = actions.slice(0, 3);
    return value;
  }
  function welcome(pathname) {
    var context = pathContext(pathname);
    if (context === 'peterson6') return result('welcome', 'Помогу найти тему или отдельную тренировку в курсе Петерсона 6 класса. Что хотите потренировать?', ['peterson6', 'peterson-skills'], null,
      [choice('Десятичные дроби'), choice('Действия с разными дробями', 'Петерсон 6: совместные действия с дробями'), choice('Где мои результаты?')]);
    if (context === 'atanasyan') return result('welcome', 'Помогу выбрать материал по геометрии: тему, тренажёр или занятия по учебнику. Напишите, что сейчас разбираете.', ['atanasyan', 'atanasyan-textbook'], null,
      [choice('Равенство треугольников'), choice('Построения'), choice('Геометрия ОГЭ')]);
    if (context === 'oge') return result('welcome', 'Помогу найти тренажёр ОГЭ по номеру или теме. Можно также вернуться к основам вычислений.', ['oge', 'basics'], null,
      [choice('Геометрия ОГЭ'), choice('ОГЭ: задание 6'), choice('ОГЭ: задание 19')]);
    if (context === 'ege-base' || context === 'ege-profile') return result('welcome', 'Помогу выбрать раздел подготовки к ЕГЭ или повторить нужную основу. Напишите тему и уровень экзамена.', [context, 'foundations'], null,
      [choice('ЕГЭ база'), choice('ЕГЭ профиль'), choice('Потренировать вычисления')]);
    return result('welcome', 'Помогу найти тему, тренажёр или учебник. Что хотите потренировать?', ['trainers', 'courses'], null,
      [choice('Дроби'), choice('Геометрия'), choice('Курсы по учебникам')]);
  }
  function looksPrivate(text) {
    if (/[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text)) return true;
    var phone = text.match(/\+?\d[\d\s().-]{8,}\d/g) || [];
    if (phone.some(function (part) { return part.replace(/\D/g, '').length >= 10; })) return true;
    // PINs are commonly sent without a colon, e.g. “пин 1234”. Only
    // treat digits as sensitive when an explicit credential label precedes
    // them; an ordinary exercise number or numerical answer remains usable.
    return /(?:^|[^a-zа-я])(?:пин(?:[- ]?код)?|pin(?:[- ]?code)?|пароль|password|код(?: входа)?)\s*(?:[-–—]\s*|\s)(?:(?:это|равен)\s+)?\d{4,8}(?!\d)/i.test(text)
      || /(?:пин(?:[- ]?код)?|pin(?:[- ]?code)?|пароль|password|код(?: входа)?|api[-_ ]?key|ключ api|access[-_ ]?token|токен)\s*[:=]\s*\S+/i.test(text)
      || /(?:^|\s)(?:sk[-_]|Bearer\s+)[a-z0-9_-]{12,}/i.test(text)
      || /https?:\/\/\S*(?:\/learning\/|[?#]\S*(?:token|secret|invite|code|key)=)/i.test(text)
      || /(?:меня зовут|мой адрес|моя почта|моя фамилия|я живу|дата рождения|мой телефон)/.test(text);
  }
  function stateFrom(input) {
    return { difficultyCount: Number.isSafeInteger(input.difficultyCount) ? Math.max(0, Math.min(2, input.difficultyCount)) : 0,
      referralShown: input.referralShown === true };
  }
  function hasExam(text, exam) { return new RegExp('(?:^|[^а-яa-z])' + exam + '(?:$|[^а-яa-z])').test(text); }
  function taskNumbers(text) {
    var numbers = [], match;
    var pattern = /(?:задани[еяию]|упражнени[еяю]|задач[аиуые]|номер|№|(?:огэ|егэ)(?:\s+(?:база|базовый|профиль|профильный))?)\s*[-:]?\s*(\d{1,3})(?!\d)/g;
    function add(value) {
      var number = Number(value);
      if (numbers.indexOf(number) === -1) numbers.push(number);
    }
    while ((match = pattern.exec(text))) {
      // In “задачи 6 класса” the number describes the grade. Explicit
      // “номер/№” remains an exercise marker, including before a class label.
      if (/^задач/.test(match[0]) && /^\s*(?:[-–]?\s*(?:й|я|м|го|ом|ого)\s*)?класс/.test(text.slice(pattern.lastIndex))) continue;
      add(match[1]);
      // A list or range can omit the repeated task marker: "№6, 13 и 19".
      // Only consume adjacent list items, never numbers from the task itself.
      var rest = text.slice(pattern.lastIndex), item;
      while ((item = /^\s*(?:[,;–—-]|или\s+|и\s+)\s*(?:(?:задани[еяию]|упражнени[еяю]|номер|№)\s*)?(\d{1,3})(?!\d)/.exec(rest))) {
        add(item[1]);
        rest = rest.slice(item[0].length);
      }
    }
    var ordinal = /(?:^|[^а-я])(перв|втор|трет|четверт|пят|шест|седьм|восьм|девят|десят|одиннадцат|двенадцат|тринадцат|четырнадцат|пятнадцат|шестнадцат|семнадцат|восемнадцат|девятнадцат|двадцат)(?:ое|ый|ой|ий|ье|ого|ому|ом)\s+(?:задани|упражнени|номер)/.exec(text);
    if (ordinal) add(['перв','втор','трет','четверт','пят','шест','седьм','восьм','девят','десят','одиннадцат','двенадцат','тринадцат','четырнадцат','пятнадцат','шестнадцат','семнадцат','восемнадцат','девятнадцат','двадцат'].indexOf(ordinal[1]) + 1);
    return numbers;
  }
  // Classes are recognised independently of their spelling and grammatical case.
  // Numeric task markers and numbers inside a mathematical example are excluded.
  var gradeNames = ['пят','шест','седьм','восьм','девят','десят','одиннадцат'];
  function classNumber(text) {
    var match = /(?:^|[^\d])(\d{1,2})\s*(?:[-–]?\s*(?:й|я|м|го|ом|ого)\s*)?класс/.exec(text)
      || /класс(?:а|е|у|ом)?\s*[:,-]?\s*(\d{1,2})(?!\d)/.exec(text)
      || /(?:петерс[ое]на?|дорофеева?|виленкина?|атанасяна?|мерзляка?|макарычева?|алимова?|никольск(?:ий|ого)|иченск(?:ая|ой))\s*[,·:-]?\s*(\d{1,2})(?!\d)/.exec(text);
    if (match) return Number(match[1]);
    var word = /(?:^|[^а-я])(одиннадцат|десят|девят|восьм|седьм|шест|пят)(?:ый|ой|ом|ого|ому|ым|ая|ую|ые|ых)\s+класс/.exec(text);
    if (!word) word = /(?:перешел|перешла|пойду|пошел|пошла|учусь|учится|перевели|поступил[а-я]*)\s+в\s+(одиннадцат|десят|девят|восьм|седьм|шест|пят)(?:ый|ой|ом|ого|ому|ым)(?=$|[^а-я])/.exec(text);
    if (word) return gradeNames.indexOf(word[1]) + 5;
    var pupil = /(?:^|[^а-я])(пяти|шести|семи|восьми|девяти|десяти|одиннадцати)класс/.exec(text);
    return pupil ? ['пяти','шести','семи','восьми','девяти','десяти','одиннадцати'].indexOf(pupil[1]) + 5 : null;
  }
  function accessIntent(text) {
    // Match the noun's case forms, without confusing "входная диагностика"
    // with an account problem. These intents never count as learning failure.
    return /кабинет|парол|логин|личн.{0,8}ссыл|авторизац|авторизова|войти|(?:^|[^a-zа-я])pin(?:$|[^a-zа-я])|(?:^|[^а-я])пин(?:[- ]?код)?(?:$|[^а-я])/.test(text)
      || /(?:^|[^а-я])вход(?:а|е|у|ом)?(?:$|[^а-я])/.test(text);
  }
  function explicitDifficulty(text) {
    if (accessIntent(text)) return false;
    if (/(?:не могу|не получается|не понимаю|не знаю).{0,35}(?:войти|зайти|открыть|найти|скачать|сохранить|загрузить|вход)/.test(text)) return false;
    if (/(?:сайт|ссылка|кнопка|страница|тренажер).{0,20}не работа/.test(text)) return false;
    return /(?:не понимаю|не понял|не поняла|не получается|не могу решить|не могу разобраться|ничего не понятно|ничего не понимаю|совсем запутал|снова ошибка|опять ошибка|слишком сложно|мне трудно|мне сложно|застрял|застряла|все еще трудно)/.test(text)
      || /^(?:сложно|трудно|непонятно)[.!?]*$/.test(text);
  }
  function bookingIntent(text) {
    var booking = /(?:^|[^а-я])(?:запис(?:ать(?:ся)?|ывать(?:ся)?|ывай(?:те)?)|запиши(?:те)?)(?=$|[^а-я])/.exec(text);
    if (!booking) return '';
    var destination = text.slice(booking.index + booking[0].length);
    if (!/^(?:\s+(?:меня|нас|сына|дочь|дочку|ребенка|детей|себя|его|ее|моего|мою|нашего|нашу)){0,3}\s+(?:на\s+(?:(?:индивидуальн|группов|пробн|онлайн)[а-я]*\s+)*(?:заняти[ея]|уроки?)|в\s+(?:мини[ -]?)?группу|к\s+(?:вам|наталь[а-я]*|репетитор[а-я]*|преподавател[а-я]*))(?=$|[^а-я])/.test(destination)) return '';
    return /(?:^|[^а-я])не(?:\s+(?:хочу|хотим|надо|нужно|буду|будем))?\s*$/.test(text.slice(0, booking.index)) ? 'declined' : 'requested';
  }
  function tutorDeclined(text) {
    // «Без регистрации» near «для учителя» isn't a refusal of lessons.
    return /(?:^|[^а-я])(?:без|не хотим|не хочу|не нужен|не нужна|не надо|не предлагай(?:те)?|не нужны)\s+(?:(?:нам|мне|помощи?|услуг|личн[а-я]*|платн[а-я]*|индивидуальн[а-я]*|группов[а-я]*)\s+){0,2}(?:репетитор|преподавател|учител|заняти[йяе]|урок)/.test(text)
      || /(?:репетитор[а-я]*|преподавател[а-я]*|учител[а-я]*|заняти[а-я]*)(?:\s+(?:мне|нам|пока|больше|совсем)){0,2}\s+не\s+(?:нуж|надо|хочу|хотим|интересу|требу|предлаг)/.test(text);
  }
  function tutorRequested(text) {
    // «Мой репетитор дал задание» and «Я репетитор» do not request a sale.
    return /мини[ -]?групп/.test(text) && /занимат|позанимат|заняти|урок|записа|узнать|покаж|наталь|стоим|цен/.test(text)
      || /(?:заняти[а-я]*|урок[а-я]*)\s+в\s+групп/.test(text) && /у вас|хочу|хотим|есть|можно|ищу|ищем|нуж/.test(text)
      || /(?:хочу|хотим|ищу|ищем|нуж[а-я]*|есть ли)\s+(?:индивидуальн[а-я]*|пробн[а-я]*)\s+(?:заняти|урок)/.test(text)
      || /^(?:есть|можно)\s+(?:ли\s+)?пробн[а-я]*\s+урок/.test(text)
      || /группов[а-я]*\s+(?:урок|заняти)/.test(text)
      || /(?:хочу|хотим|можно|как)\s+(?:купить|приобрести|оплатить)\s+(?:урок|заняти)/.test(text)
      || /^(?:репетитор|репетитор по математике)[.!?]*$/.test(text)
      || /(?:ищу|ищем|нуж[а-я]*|посоветуй[а-я]*|порекомендуй[а-я]*|найти|найд[иу]|записа[а-я]* к|связаться с|поговорить с|написать|контакты|обратиться к)\s+(?:(?:мне|нам|нового|хорошего|личного)\s+)?репетитор/.test(text)
      || /(?:можно|хочу|хотим|как)\s+(?:у вас\s+)?(?:записаться|заниматься|позаниматься)\s+(?:у вас|к вам|с вами|к наталь|с наталь)/.test(text)
      || /(?:сколько стоит|сколько стоят|цена|стоимость)\s+(?:(?:одно|один|индивидуальн[а-я]*|группов[а-я]*|пробн[а-я]*)\s+)*(?:урок|занят|мини[ -]?групп)/.test(text)
      || /(?:связаться с вами|вам написать)\s+(?:насчет|по поводу|чтобы обсудить|обсудить)\s+(?:урок|заняти)/.test(text)
      || /(?:нужен|нужна|ищу|связаться|написать|контакты|поговорить|обсудить|занятия с).{0,30}(?:преподавател|учител|наталь|заняти)/.test(text)
      || /(?:обсудить занятия|записаться на (?:занятия|урок)|стоимость (?:занятий|уроков)|сколько стоят (?:занятия|уроки)|цена (?:занятий|уроков)|контакты преподавателя)/.test(text)
      || /^(?:контакты|занятия с преподавателем|помощь преподавателя|наталья михайловна)[.!?]*$/.test(text);
  }
  function finish(value, text, state) {
    if (/(?:реши(?:те)?|вычисли(?:те)?|проверь(?:те)?|докажи(?:те)?|дай ответ|ответ на задачу|посмотри.{0,12}чертеж)/.test(text)
        && value.kind !== 'difficulty') {
      value.text = 'В этом окне доступна навигация по материалам. Для разбора шагов откройте подходящий тренажёр. ' + value.text;
    }
    if (explicitDifficulty(text)) {
      state.difficultyCount = Math.min(2, state.difficultyCount + 1);
      if (state.difficultyCount >= 2 && !state.referralShown) {
        value.text += ' Можно вернуться к более простому примеру и потренировать один шаг. Если хочется разобрать тему вместе с преподавателем, можно обсудить занятия с Натальей Михайловной.';
        value.links = value.links.slice(0, 2).concat(links(['contact']));
        value.actions = [choice('Попробовать проще', 'Базовые действия')];
        state.referralShown = true;
      }
    }
    value.difficultyCount = state.difficultyCount;
    value.referralShown = state.referralShown;
    return value;
  }
  function primeFactors(state) {
    return result('number-theory', 'В занятии Виленкина для 6 класса о разложении на простые множители откройте справку «Таблица простых чисел и признаки делимости». После неё можно перейти к НОД или НОК.', ['prime-factors', 'nod', 'nok'], state);
  }
  function decimals(text, state) {
    var ids = ['arithmetic-decimals', 'decimal-basics', 'peterson-skills'];
    if (/округл/.test(text)) ids = ['rounding', 'decimal-place'];
    else if (/разряд|десят[ыа]|сот[ыа]|тысячн|касса/.test(text)) ids = ['decimal-place', 'decimal-basics'];
    else if (/(?:перев|преврат|запис).*(?:обыкнов|десятич)/.test(text) && /обыкнов|обычн/.test(text)) {
      ids = text.indexOf('обыкнов') >= 0 && text.indexOf('обыкнов') < text.indexOf('десятич')
        ? ['fraction-to-decimal', 'decimal-to-fraction'] : ['decimal-to-fraction', 'fraction-to-decimal'];
    } else if (/делени|делить|делим|делишь|делител/.test(text)) ids = /на\s+десятичн|десятичн.{0,12}делител/.test(text)
      ? ['decimal-divisor', 'division-stepwise', 'arithmetic-decimals'] : ['decimal-divide', 'decimal-divisor', 'arithmetic-decimals'];
    else if (/умнож|произвед/.test(text)) ids = ['decimal-multiply', 'peterson-skills'];
    else if (/вычит|вычесть|отним/.test(text)) ids = ['decimal-subtract', 'decimal-basics'];
    else if (/сложени|складыв|прибав/.test(text)) ids = ['decimal-add', 'decimal-basics'];
    else if (/сравн|больше|меньше/.test(text)) ids = ['decimal-place', 'negative-basics'];
    return result('decimals', 'Для десятичных дробей можно выбрать один навык и начать с простых чисел. В вычислительной мастерской доступны отдельные действия и переход между записями дроби.', ids, state,
      [choice('Сложение', 'Сложение десятичных дробей'), choice('Умножение', 'Умножение десятичных дробей'), choice('Деление', 'Деление десятичных дробей')]);
  }

  var stopWords = /^(?:найти|найди|помоги|пожалуйста|где|как|хочу|нужно|нужен|нужна|нужны|мне|для|про|или|это|здесь|сайт|тренажер|тренажеры|потренировать|потренироваться|учить|учиться|тема|тему|темы|задание|задания|класс|курс|курсы|реши|решить|объясни|понимаю|понял|получается|непонятно|сложно)$/;
  function words(value) { return normalize(value).match(/[а-яa-z0-9]+/g) || []; }
  var searchable = catalogue.filter(function (entry) {
    // Material packs have explicit subject/edition/audience checks below.
    return entry.category !== 'Занятия' && entry.category !== 'Кабинет' && entry.category !== 'Результаты' && entry.category !== 'Материалы';
  }).map(function (entry) {
    return { entry: entry, title: normalize(entry.title), words: words(entry.title + ' ' + entry.tags.join(' ')) };
  });
  function search(text) {
    var terms = words(text).filter(function (word) { return word.length >= 3 && !stopWords.test(word) && !/^\d+$/.test(word); });
    if (!terms.length) return [];
    return searchable.map(function (item, index) {
      var hits = 0;
      terms.forEach(function (term) {
        var stem = term.length > 5 ? term.slice(0, 5) : term;
        if (item.words.some(function (word) { return word === term || (term.length > 5 && word.indexOf(stem) === 0); })) hits++;
      });
      var score = hits >= Math.min(2, terms.length) ? hits * 10 : 0;
      if (item.title === text) score += 100;
      return { id: item.entry.id, score: score, index: index };
    }).filter(function (item) { return item.score > 0; })
      .sort(function (a, b) { return b.score - a.score || a.index - b.index; })
      .slice(0, 3).map(function (item) { return item.id; });
  }

  // Recognize descriptions of an activity, without inventing a grade or exam.
  // A specific skill has exactly one next step, independent of the page opened.
  function pupilSkill(text, oge, ege, number, state) {
    function one(kind, id, message) { return result(kind, message, [id], state); }
    if (/информатик|русск.{0,6}язык|литератур|пунктуац|физик|хими|биологи|географи|иностранн/.test(text)) return null;
    if (number !== null) {
      if (!oge && !ege && !/учебник|упражнен/.test(text)) {
        var suffix = ': задание ' + number;
        return result('clarify', 'В каком экзамене ищете это задание?', ['oge', 'ege-base', 'ege-profile'], state,
          [choice('ОГЭ', 'ОГЭ' + suffix), choice('ЕГЭ база', 'ЕГЭ база' + suffix), choice('ЕГЭ профиль', 'ЕГЭ профиль' + suffix)]);
      }
      return null;
    }
    if (/округл/.test(text)) return one('rounding', 'rounding-stepwise', 'Потренируйтесь округлять число до нужного разряда.');
    if (/таблиц/.test(text) && /вразнобой|вперемешк|смешанн/.test(text) && !/квадрат|куб|синус|косинус|логарифм/.test(text))
      return one('multiplication', 'multiplication-mixed', 'Потренируйте таблицу умножения вперемешку.');
    if (/квадратн.{0,18}(?:метр|сантиметр|миллиметр|километр)|(?:мм|см|дм|км|м)²|единиц.{0,12}площад/.test(text))
      return one('units', 'units-area', 'Сравните единицы площади на наглядной модели: квадрат со стороной в одну единицу.');
    if (/(?:числ[ео]|запис[ьи]).{0,18}\d+[,.]\d+/.test(text) && /означа|мест[ое]|разряд|позици/.test(text))
      return one('decimals', 'decimal-place', 'В кассе разрядов можно увидеть, что означает каждая цифра десятичной дроби.');
    if (/минус|отрицательн/.test(text) && /меньше|больше|сравн/.test(text) && !/неравен|корен|корн|степен/.test(text))
      return one('negative', 'negative', 'На числовой прямой сравните числа: левее находится меньшее число.');
    if (/циркул|линейк/.test(text) && /постро|практик|тренир|начал|черт/.test(text))
      return one('constructions', /биссектрис/.test(text) ? 'bisector' : 'constructions', 'Откройте построения циркулем и линейкой и начните с первого шага.');
    if (/треугол/.test(text) && /две сторон|двум сторон/.test(text) && /угол между/.test(text) && !/подоби/.test(text))
      return one('congruence', 'congruence-first', 'Две стороны и угол между ними задают первый признак равенства треугольников. Потренируйтесь находить эти элементы на чертеже.');
    if (!oge && !ege && /скобк/.test(text) && /что.{0,16}(?:считать|после)|порядок|сначала|потом|действи/.test(text) && !/уравнен|неравен/.test(text)) return one('arithmetic', 'order', 'Потренируйтесь выбирать, какое действие выполнять первым.');
    if (!oge && !ege && /дол[ьи]/.test(text) && /одинаков|разн|слож/.test(text)) return one('fractions', 'fraction-common', 'Начните с общего знаменателя, чтобы складывать доли одинакового размера.');
    if (!oge && !ege && /\d+[,.]\d+/.test(text) && /(?:в виде|перепис|запис|преврат|перев).{0,20}обыкновенн/.test(text)) return one('fractions', 'decimal-to-fraction', 'Потренируйтесь переводить десятичную дробь в обыкновенную.');
    if (!oge && !ege && /получ|перев|преврат|запис/.test(text) && /(?:из|как из).{0,24}(?:трех|двух|одной|обыкновенн|\d+\/\d+)/.test(text) && /(?:число|дробь) с запят|десятич/.test(text)) return one('fractions', 'fraction-to-decimal', 'Потренируйтесь переводить обыкновенную дробь в десятичную.');
    var fractionWords = /(?:одна|две|три|четыре|пять|шесть|семь|восемь|девять)\s+(?:втор|трет|четверт|пят|шест|седьм|восьм|девят|десят)/.test(text);
    if (!oge && !ege && (fractionWords || /дроб/.test(text)) && /плюс|слож|складыв|общ.{0,12}знаменател|разн.{0,25}(?:снизу|внизу)|(?:снизу|внизу).{0,25}разн/.test(text))
      return one('fractions', 'fraction-common', 'Начните с общего знаменателя: как складывать доли разного размера.');
    if (!oge && !ege && (fractionWords || /одинаков.{0,14}дол|дол[ьеик].{0,24}(?:част|съел)|какую часть|закрашенн.{0,15}част/.test(text)))
      return one('fractions', 'fraction-meaning', 'Посмотрите на рисунке, как часть целого записывается дробью.');
    if (!oge && !ege && /(?:перев|преврат|запис).{0,45}(?:форм.{0,12}дроб|одн.{0,12}дроб.{0,12}друг)|из одн.{0,20}дроб.{0,20}друг/.test(text) && !/обыкнов|десятич/.test(text))
      return result('clarify', 'Из какой записи в какую нужно перейти?', ['decimal-to-fraction','fraction-to-decimal'], state, [choice('Из десятичной в обыкновенную', 'Из десятичной дроби в обыкновенную'),choice('Из обыкновенной в десятичную', 'Из обыкновенной дроби в десятичную')]);
    if (!oge && !ege && /(?:семь|восемь|девять|шесть|пять|четыре|три|два|\d+)\s+(?:раз[а]?|умножить на|[×*])\s+(?:семь|восемь|девять|шесть|пять|четыре|три|два|\d+)/.test(text) && /таблиц|запомн|тренир|повтор/.test(text))
      return one('multiplication', 'multiplication-table', 'Повторите таблицу умножения на рисунке и потренируйтесь находить произведение.');
    if (oge && /покрыш|шин[аыуе]|колес/.test(text))
      return one('oge-practical', 'oge-practical', 'Задачи о шинах и маркировке входят в практические задания ОГЭ 1–5.');
    if (oge && /фраз|утвержден|высказыван|сужден/.test(text) && /верн|истин|лож|правильн/.test(text) && /фигур|геометр|угол|треугол|окруж/.test(text))
      return one('oge-task', 'oge-19', 'Потренируйтесь выбирать верные геометрические утверждения в задании 19.');
    var decimal = /запят|десятич/.test(text);
    var divide = /(?:^|[^а-я])(?:по|раз)?дел(?:ю|им|ишь|ить|ен|ител|ится|ят|и(?:м|шь|те)?(?:\s|$))/.test(text);
    var multiply = /(?:^|[^а-я])(?:пере|у|по)?множ(?:у|ить|ени|а)/.test(text);
    var skillOnly = !/многочлен|вектор|степен|корн|корен|выражени|матриц|отрезок|отрезк|на части/.test(text);
    if (!oge && !ege && /процент|скидк/.test(text) && !/вероятност|ставк[аи]|кредит/.test(text) && !/не (?:хочу|нужны?) (?:эти )?процент|без процент/.test(text))
      return one('percentages', 'percentages', 'Здесь можно потренироваться находить процент от числа и само число по проценту.');
    if (decimal && !ege && skillOnly) {
      if (divide && /на\s+(?:число|дроб[ьия])\s+с\s+запят|перен[ое]с|передви[нг]|сдви[нг]|уезжа|на\s*-?\d+[,.]\d+/.test(text))
        return one('decimals', 'decimal-divisor', 'Здесь можно потренироваться переносить запятую при делении на десятичную дробь.');
      if (multiply) return one('decimals', 'decimal-multiply', 'Потренируйтесь ставить запятую при умножении десятичных дробей.');
      if (/запят/.test(text) && /куда|где|как\s+(?:по)?став|место|стави|постав|пута/.test(text) && !/округл|слож|склад|вычит|отним|разряд|дел|множ/.test(text))
        return result('clarify', 'В каком действии нужно поставить запятую?', ['arithmetic-decimals'], state, [
          choice('При сложении', 'Сложение десятичных дробей'), choice('При умножении', 'Умножение десятичных дробей'),
          choice('При делении', 'Деление десятичных дробей')]);
    }
    if (!decimal && skillOnly && !/дроб|дол[яиюе]|делител|нацело|кратн/.test(text)) {
      if ((divide || /частн|уголком/.test(text)) && /цифр/.test(text) && /подб|подоб|выбр|выбир|какую|какая/.test(text))
        return one('division', 'division-digit', 'Здесь можно потренироваться подбирать одну цифру частного.');
      if (divide && /столбик|уголком/.test(text))
        return one('division', 'division-stepwise', 'Открой тренажёр и попробуй первый шаг деления уголком.');
      if (multiply && /столбик|одно.{0,15}под другим/.test(text) && /длинн|значн|два числ|тетрад/.test(text))
        return one('multiplication', 'multiplication-notebook', 'Здесь можно потренироваться умножать в столбик.');
    }
    if (!oge && !ege && !decimal) {
      if (/(?:общ|разн|одинаков).{0,14}знаменател/.test(text) ||
          /дроб/.test(text) && /(?:снизу|внизу|под черт).{0,23}(?:разн|одинаков)|разн.{0,18}(?:снизу|внизу|под черт)/.test(text))
        return one('fractions', 'fraction-common', 'Здесь можно привести дроби к общему знаменателю.');
      if (/дроб/.test(text) && /под\s+(?:дробной\s+)?черт|над\s+(?:дробной\s+)?черт|число (?:сверху|снизу)/.test(text))
        return one('fractions', 'fraction-meaning', 'Начните с рисунка: что показывают числа над и под чертой дроби.');
    }
    if (oge && !ege) {
      var image = /график|картин|лини[ияю]|прям[а-я]*|парабол|рисун/.test(text);
      if (/втор.{0,8}част/.test(text) && /доказ/.test(text) && /геометр|утвержден|треугол|окруж/.test(text)) return one('oge-task', 'oge-24', 'В задании 24 можно учиться оформлять геометрическое доказательство.');
      if (/подстав/.test(text) && /формул/.test(text)) return one('oge-task', 'oge-12', 'В задании 12 потренируйтесь подставлять данные в формулу.');
      if (/оси|прямой|прямая/.test(text) && /точк/.test(text) && /числ|между/.test(text) && !/график|функци|неравен/.test(text)) return one('oge-task', 'oge-7', 'В задании 7 можно потренироваться находить числа на координатной прямой.');
      if (image && /(?:формул|функци|уравнен|выражени)/.test(text) && (/подходит|указать|како[йяе]|какой|какая|сопостав|соотнес|подобр|подбир|соответств|соедин|сопост/.test(text) || /рисунк|картин/.test(text) && !/постро|изобраз|параметр/.test(text)))
        return one('oge-task', 'oge-11', 'Потренируйся подбирать формулу к графику в задании 11.');
      if (/график/.test(text) && /параметр|при каких|сколько.{0,12}(?:точек|пересечен)|прям.{0,20}пересеч|изобразить.{0,12}функци/.test(text))
        return one('oge-task', 'oge-22', 'Построение графика и пересечения с прямой разбираются в задании 22.');
      if (/(?:утвержден|высказыван|сужден)/.test(text) && /верн|истинн|ложн|неправильн/.test(text))
        return one('oge-task', 'oge-19', 'Выбери верное геометрическое утверждение в задании 19.');
      if (/клеточ|клетчат/.test(text) && /площад|фигур|периметр/.test(text))
        return one('oge-task', 'oge-18', 'В задании 18 можно потренироваться с фигурами на клетчатой бумаге.');
      if (/прямой|прямая|числов.{0,10}оси/.test(text) && /отмечен.{0,20}точк|точк.{0,20}отмечен|букв|между.{0,18}числ/.test(text) && !/неравен|штрихов|график/.test(text))
        return one('oge-task', 'oge-7', 'В задании 7 отмечают числа на координатной прямой.');
    }
    if (!ege && /(?:математик|счет).{0,25}с нуля|с чего (?:мне )?начать(?:[?!.]*$|\s+(?:учиться|заниматься|математику|готовиться))|(?:не знаю|подскажите|подскажи|не понимаю|помоги).{0,25}с чего (?:мне )?начать/.test(text)
        && !/дроб|делен|множ|геометр|учебник|график|(?:^|[^а-я])тем[уае]|уравнен|неравен/.test(text))
      return oge ? one('oge', 'oge', 'Открой карту подготовки и выбери один знакомый тип задания.')
        : one('foundations', 'foundations', 'Открой математические основы и выбери первое действие, которое хочется повторить.');
    return null;
  }

  function rejectsPrint(text) {
    return /(?:не\s+(?:(?:нужен|нужна|нужны|нужно|надо|хочу|требуется)\s+)?|без\s+)(?:pdf|пдф)(?:$|[^а-яa-z])/.test(text)
      || /(?:pdf|пдф)\s+(?:(?:мне|нам)\s+)?не\s+(?:надо|нуж|хочу)/.test(text)
      || /(?:не\s+(?:хочу|нуж[а-я]*|надо)|без)\s+(?:печатн[а-я]*\s+)?(?:лист|материал|распечат|печатать)/.test(text)
      || /(?:печатн[а-я]*\s+(?:лист|материал)[а-я]*|распечатывать|печатать)\s+(?:(?:мне|нам)\s+)?не\s+(?:надо|нуж|хочу)/.test(text);
  }
  function requestedMaterial(text, context) {
    // A rejected format is not a request for that format, in either word order.
    if (rejectsPrint(text)) return '';
    // A print request on an OGE page may omit the exam. A named exam,
    // subject, individual task or edition must take priority over page context.
    var namedOGE = hasExam(text, 'огэ');
    var ninth = /(?:^|[^0-9])9\s*[-–]?\s*(?:й|м|го)?\s*класс|девят[а-я]*\s+класс|девятикласс/.test(text);
    var oge = namedOGE || context === 'oge';
    var otherExam = hasExam(text, 'егэ') || /(?:впр|мцко|гвэ|не\s+огэ)/.test(text);
    var otherSubject = /информатик|русск|литератур|физик|хими|биологи|географи|истори|обществознани|иностранн|английск/.test(text);
    var years = text.match(/\b(?:19|20)\d{2}\b/g) || [];
    var mock = /пробник|пробн[а-я]*\s+(?:экзамен|работ)|экзамен[а-я]*\s+целиком/.test(text);
    var print = /(?:рас)?печат|принтер|скачать|на бумаге|раздат[а-я]*|разда(?:ть|м)|pdf|пдф/.test(text);
    if (print && /вектор/.test(text) && !otherSubject && !namedOGE) return 'ege-vectors-pdf';
    var papers = /вариант/.test(text) || mock || ((namedOGE || hasExam(text, 'егэ')) && /целиком|полност[а-я]+/.test(text) && print);
    var declinesPapers = /(?:без|вместо|не\s+хочу|не\s+нуж[а-я]*)\s+(?:печатн[а-я]*\s+)?(?:вариант|пробник|печат|распечатыва)|(?:вариант[а-я]*|пробник[а-я]*)\s+не\s+нуж/.test(text);
    var individualTask = /задани[еяию]\s*(?:номер\s*)?\d|(?:огэ|егэ)\s+номер\s+\d/.test(text);
    if ((oge || (ninth && mock)) && papers && !/картин|рисунк|график|формул|функци|покрыш|колес|шины|знаменател/.test(text) && !otherExam && !otherSubject && !declinesPapers
        && !individualTask && years.every(function (year) { return year === '2027'; })) return 'oge-papers';

    if (!namedOGE && !otherExam && !otherSubject && !individualTask && !declinesPapers && !years.length
        && !ninth && !classNumber(text) && !context && (mock || (papers && print))
        && !/контрольн|самостоятельн|урок|лист/.test(text)) return 'which-exam-papers';

    // A resource can be useful to a teacher, parent or pupil. Match the desired
    // format and the actual topic, not the visitor's role on its own.
    var namedPack = /рабоч[а-я]*\s+лист|раздатк|раздаточн|самостоятельн(?:ая|ую|ые|ых)(?:$|[^а-я])|практикум/.test(text);
    var worksheets = /материал|комплект|лист|карточк|задани|пятиминут|диагностик|проверочн|контрольн|самостоятельн/.test(text) || namedPack;
    var forLesson = /(?:веду|преподаю)\s+математик|для\s+преподавател|для\s+педагог|к\s+заняти[а-я]*\s+кружк|для\s+класса|семиклассник|коллеги|проведени[ея]\s+урок|(?:для|к|на)\s+(?:(?:завтрашн|следующ|открыт)[а-я]*\s+)?урок|для\s+(?:учител|педагог|ученик|школьник|всего класса)|(?:^|[^а-я])я\s+(?:учител|педагог|репетитор)/.test(text);
    if (!otherSubject && !namedOGE && !otherExam && /(?:раздел|каталог|материал)/.test(text) && /(?:учител|преподавател|педагог)/.test(text) && !/дроб|процент|уравнен|треугол|вычисл/.test(text)) return 'teachers';
    var declinesWorksheets = /(?:без|не\s+хочу|не\s+нуж[а-я]*)\s+(?:материал|рабоч[а-я]*\s+лист|комплект|карточк)/.test(text);
    var diagnostic = /диагностик|определить|проверить|выявить/.test(text) && /счет|счит|вычисл|арифметик/.test(text);
    if (!otherSubject && !individualTask && !declinesWorksheets && !namedOGE && !otherExam
        && (/^(?:раздел\s+)?педагогам[.!?]*$/.test(text) || namedPack || diagnostic || (worksheets && (forLesson || print)) || (forLesson && /треугол|процент|уравнен|дроб/.test(text)) || (print && forLesson))) {
      var grade = classNumber(text);
      var gradeWord = /(?:пятикласс|пятым?\s+класс)/.test(text) ? 5 : /шестикласс|шест[ауо][а-я]*\s+класс/.test(text) ? 6 : /семикласс|седьм[а-я]+\s+класс/.test(text) ? 7 : /восьмикласс|восьм[а-я]+\s+класс/.test(text) ? 8 : ninth ? 9 : null;
      if (grade === null) grade = /одиннадцат[а-я]*\s*класс/.test(text) ? 11 : /десят[а-я]*\s*класс/.test(text) ? 10 : gradeWord;
      function fits(min, max) { return grade === null || (grade >= min && grade <= max); }
      if (diagnostic && fits(5, 7)) return 'sheet-diagnostics';
      if (/процент|скидк|целого по части|нахождени[ея]\s+целого/.test(text) && fits(6, 9)) return 'sheet-percent';
      if (/дроб|числител|знаменател/.test(text) && !/десятич|рациональн|алгебраич|умнож|делени|смешанн/.test(text) && fits(5, 6)) return 'sheet-fractions';
      if (/линейн[а-я]*\s+уравн|уравнен[а-я]*\s+со\s+скобками|неизвестн.{0,24}(?:слева|справа)|\d*\s*[xх]\s*[+−-]\s*\d+\s*=/.test(text) && !/квадратн|систем|нелинейн/.test(text) && fits(6, 7)) return 'sheet-linear';
      if (/равенств[а-я]*\s+(?:двух\s+)?треугольник|равн[а-я]+\s+треугольник|треугольник/.test(text) && !/подоби/.test(text) && fits(7, 7)) return 'sheet-triangles';
      return 'teachers';
    }
    return '';
  }

  function directDestination(text, context, state, studyGoal) {
    function one(id, message) { return byId[id] ? result('topic', message, [id], state) : null; }
    var oge = hasExam(text, 'огэ'), ege = hasExam(text, 'егэ');
    if (oge && ege) return null;
    if (!oge && /вектор/.test(text) && !/баз/.test(text) && rejectsPrint(text))
      return one('ege-vectors', 'Откройте интерактивный тренажёр по векторам.');
    var numbers = taskNumbers(text), number = numbers.length === 1 ? numbers[0] : null;
    var examLevel = ege ? /профил/.test(text) && !/баз/.test(text) ? 'ege-profile' : /баз/.test(text) && !/профил/.test(text) ? 'ege-base' : ''
      : /^ege-(?:base|profile)$/.test(studyGoal || '') ? studyGoal : /^ege-(?:base|profile)$/.test(context) ? context : '';
    if ((oge || !ege && context === 'oge') && number === null) {
      var practical = /покрыш|шин[аыуе]|колес|маркировк/.test(text) ? 'oge-tires'
        : /квартир|план.{0,12}комнат/.test(text) ? 'oge-apartments'
        : /печ(?:ь|и|к)|бан[яию]|саун/.test(text) ? 'oge-stoves'
        : /участ[окк]|план.{0,12}дач/.test(text) ? 'oge-land-plots'
        : /тариф|гигабайт|абонент/.test(text) ? 'oge-tariffs'
        : /формат.{0,12}(?:а[0-6]|a[0-6])|лист.{0,12}бумаг/.test(text) ? 'oge-paper-sheets'
        : /дорог|деревн|шоссе|тропин/.test(text) ? /без клет|схем|деревн/.test(text) ? 'oge-roads-schema' : /клет/.test(text) ? 'oge-roads-grid' : '' : '';
      if (practical && byId[practical]) return one(practical, 'Откройте практическую задачу ОГЭ 1–5 по этой теме.');
    }
    if (examLevel === 'ege-base' && !oge) {
      if (/справоч|булавк|справочн.{0,12}лист|закреп.{0,12}лист|вспомн.{0,12}формул/.test(text)) return one('ege-base-reference', 'В справочных листах найдите нужное правило или формулу и закрепите лист булавкой.');
      if (/прогресс|результат|что пройден|продвига|достижен/.test(text)) return one('ege-base-progress', 'Откройте свой прогресс в курсе базового ЕГЭ. Навигатор не читает ваши результаты.');
      if (/геометр|лаборатор|модел|чертеж|планиметр|стереометр/.test(text)) return one('ege-base-labs', 'В геометрических лабораториях базового ЕГЭ можно рассмотреть модель и потренировать нужный шаг.');
      if (/диагностик|провер.{0,12}(?:уровень|знани)|с чего.{0,12}начать/.test(text)) return one('ege-base-diagnostic', 'Начните с диагностики базового ЕГЭ, чтобы выбрать нужные темы.');
      if (/с нуля|основ|пробел|повтор.{0,12}(?:счет|вычисл)/.test(text)) return one('ege-base-foundation', 'Повторите нужную основу и затем вернитесь к заданиям базового ЕГЭ.');
      if (/процент|пропорц|скидк/.test(text)) return one('ege-base-percent', 'Здесь собраны проценты, пропорции и задачи на часть и целое для базового ЕГЭ.');
      if (/совместн.{0,12}работ|землекоп|производительност/.test(text)) return one('ege-base-work-rate', 'Откройте задачи на совместную работу и производительность.');
      if (number !== null) return one(number >= 19 && number <= 21 ? 'ege-base-reasoning' : 'ege-base-path', 'Выберите нужный номер в маршруте базового ЕГЭ.');
      if (/карта|маршрут|план подгот|все тем/.test(text)) return one('ege-base-map', 'В карте базового ЕГЭ выберите одну тему и начните с первого шага.');
    }
    if (examLevel === 'ege-profile' && !oge) {
      if (number === 16 && !/неравен|геометр|кредит|финанс/.test(text)) {
        if (/2027/.test(text)) return one('ege-profile-inequalities-2027', 'В маршруте ЕГЭ 2027 задание 16 посвящено неравенствам второй части.');
        if (!/2026/.test(text) && byId['ege-profile-inequalities-2027']) return result('clarify', 'Какой формат нужен: неравенства в маршруте 2027 или финансовые задачи в подборке 2026?', ['ege-profile-inequalities-2027','ege-profile-finance'], state, [choice('2027: неравенства', 'ЕГЭ профиль 2027: задание 16'),choice('2026: финансовые задачи', 'ЕГЭ профиль 2026: финансовые задачи')]);
      }
      if (/пробник|полный вариант|экзамен.{0,12}целиком/.test(text) && byId['ege-profile-full-exam']) {
        if (/2026/.test(text)) return one('ege-profile-full-exam', 'Этот пробный экзамен использует формат 2026.');
        return result('clarify', 'На сайте есть пробный экзамен в формате 2026 и учебный маршрут 2027. Что открыть?', ['ege-profile-full-exam','ege-profile-start'], state, [choice('Пробник 2026', 'ЕГЭ профиль: пробник 2026'),choice('Маршрут 2027', 'ЕГЭ профиль: карта курса 2027')]);
      }
      var topic = /работ.{0,10}над ошиб|журнал.{0,10}ошиб|разобрат.{0,12}ошиб/.test(text) ? 'ege-profile-review'
        : /критери|эксперт|провер.{0,12}(?:развернут|решени)/.test(text) ? 'ege-profile-expert'
        : /производн|касательн.{0,12}график|монотонност/.test(text) ? 'ege-profile-derivative'
        : /кредит|вклад|финанс|платеж|экономическ/.test(text) ? 'ege-profile-finance'
        : /параметр/.test(text) ? 'ege-profile-parameters'
        : /логарифм/.test(text) && /неравен/.test(text) ? 'ege-profile-log-inequalities'
        : /метод.{0,8}интервал/.test(text) ? 'ege-profile-intervals'
        : /неравен/.test(text) ? 'ege-profile-inequalities'
        : /тригоном|синус|косинус|тангенс|единичн.{0,12}окружност/.test(text) ? /уравнен|отбор.{0,8}корн/.test(text) ? 'ege-profile-trigonometry' : 'ege-profile-trigonometry-course'
        : /вероятност|монет|кубик|бернулли/.test(text) ? 'ege-profile-probability'
        : /вектор/.test(text) ? 'ege-profile-vectors-start'
        : /стереометр/.test(text) ? 'ege-profile-stereo-start'
        : /планиметр/.test(text) ? 'ege-profile-planimetry-start'
        : /максимум|минимум|экстремум|наибольш.{0,10}значени|график/.test(text) ? 'ege-profile-functions'
        : /текстов.{0,8}задач|движени|смес|работа/.test(text) ? 'ege-profile-applied'
        : /карта|маршрут|начать|с нуля/.test(text) ? 'ege-profile-start' : '';
      if (topic && byId[topic]) return one(topic, 'Откройте нужную тему профильного ЕГЭ и начните с первого шага.');
    }
    return null;
  }

  function respond(input) {
    input = input && typeof input === 'object' ? input : {};
    var state = stateFrom(input);
    if (typeof input.text !== 'string' || !input.text.trim()) {
      var greeting = welcome(input.pathname);
      greeting.difficultyCount = state.difficultyCount;
      greeting.referralShown = state.referralShown;
      return greeting;
    }
    if (input.text.length > 1000) return result('too-long', 'Напишите короче: достаточно темы, класса, автора учебника или номера задания. В это поле помещается до 1000 символов.', ['trainers'], state);
    var text = normalize(input.text);
    if (looksPrivate(text)) return result('privacy', 'Для выбора страницы достаточно темы или класса. Не вводите личные ссылки, пароли, телефоны и другие личные данные. Если нужен вход в кабинет, откройте его отдельно.', ['cabinet', 'trainers'], state);
    var context = pathContext(input.pathname);
    var material = requestedMaterial(text, context);
    var booking = bookingIntent(text);
    var declinesTutor = booking === 'declined' || tutorDeclined(text);
    if (declinesTutor) {
      // An explicit decline consumes the optional offer for this page session.
      state.referralShown = true;
      // A refusal alongside a specific learning request should still open that
      // route. Keep the ordinary fallback for a bare refusal.
      text = text.replace(/(?:нам |мне )?(?:не нужен|не нужна|не нужны|не хочу|не хотим|без)\s+(?:репетитор[а-я]*|преподавател[а-я]*|платн[а-я]*\s+заняти[а-я]*)/g, ' ').trim();
    }
    if (/(?:родител|мам[аыеу]|пап[аыеу]|мо(?:его|ей)\s+(?:ребенк|сына|дочер))/.test(text) && /успех|результат|прогресс|успеваемост|следить|наблюдат|посмотр|продвига/.test(text) && !/петерс[ое]н|дорофеев/.test(text) && context !== 'peterson6' && context !== 'atanasyan') {
      return result('parent-progress', 'О результатах ученика и доступе для родителя можно узнать у преподавателя. Если у вас уже есть данные для входа, откройте кабинет отдельно. Не вводите здесь PIN или личную ссылку.', ['cabinet', 'contact'], state);
    }
    var namedLearningTopic = /дроб|делен|делить|уголком|умнож|процент|уравнен|неравен|график|треугол|окружност|вектор|вероятност|геометр|таблиц|учебник|задани|задач|номер/.test(text) || hasExam(text, 'огэ') || hasExam(text, 'егэ');
    if (!accessIntent(text) && !namedLearningTopic && !tutorRequested(text) && /(?:бесплатн|бесплатно|платн|стоимост|сколько стоит|без регистрац)/.test(text) && /(?:сайт|тренаж|самостоятельн|занимат|заняти|учит|урок|доступ)/.test(text) && !/(?:мини[ -]?групп|с преподавател|у наталь|индивидуальн|репетитор)/.test(text)) {
      return result('pricing', 'На сайте есть бесплатные тренажёры для самостоятельной работы. Условия и стоимость занятий с преподавателем указаны отдельно на странице занятий.', ['trainers', 'lessons'], state);
    }
    if (accessIntent(text)) {
      return result('cabinet', 'Кабинет открывается отдельно. Используйте личную ссылку или данные входа, выданные преподавателем. Если ссылка не работает или код потерян, попросите преподавателя помочь со входом. В навигатор код или пароль вводить не нужно.', ['cabinet'], state);
    }
    var direct = !material ? directDestination(text, context, state, input.studyGoal) : null;
    if (direct) return direct;
    if (/(?:^|[^а-я])прогресс(?:$|[^а-я])|продвига[а-я]*|успеваемост|достижени|мои результаты|сохран(?:ить|ение|ено|ил|ятся)|результаты.{0,20}(?:пропал|где|посмотр)|где.{0,20}результат/.test(text)) {
      if (context === 'peterson6' || /петерс[ое]н|дорофеев/.test(text)) return result('progress', 'В отдельном курсе Петерсона 6 класса работа сохраняется в текущем браузере; раздел «Мои результаты» позволяет посмотреть результаты и скачать их. Для занятий через кабинет откройте кабинет отдельно. Навигатор не читает ваши результаты.', ['peterson-progress', 'cabinet'], state);
      if (context === 'atanasyan') return result('progress', 'В отдельном курсе геометрии результаты сохраняются в текущем браузере; в курсе предусмотрен экспорт. Для занятий через кабинет откройте кабинет отдельно. Навигатор не читает ваши результаты.', ['atanasyan', 'cabinet'], state);
      return result('progress', 'Где вы занимались: в кабинете или на отдельной странице тренажёра? Сохранение устроено по-разному. Откройте кабинет под своей учётной записью либо раздел результатов самого тренажёра. В некоторых курсах работа сохраняется только в текущем браузере. Навигатор не читает ваши результаты.', ['cabinet', 'trainers'], state);
    }
    if (material === 'ege-vectors-pdf') return result('teacher-materials', 'Задачи по векторам для печати доступны отдельным PDF. Откройте файл, чтобы скачать или распечатать его.', [material], state);
    if (material === 'oge-papers') return result('oge-papers', 'Откройте авторские варианты ОГЭ по математике. Для каждого варианта задания, ответы и решения можно скачать отдельно в PDF.', [material], state);
    if (material === 'which-exam-papers') return result('clarify', 'Для какого экзамена нужен пробник? Варианты ОГЭ можно распечатать. Для ЕГЭ выберите базовый или профильный курс.', ['oge-papers', 'ege-base', 'ege-profile'], state,
      [choice('ОГЭ: варианты для печати', 'Печатные варианты ОГЭ'), choice('ЕГЭ база', 'ЕГЭ база'), choice('ЕГЭ профиль', 'ЕГЭ профиль')]);
    if (material.indexOf('sheet-') === 0) return result('teacher-materials', byId[material].title + ' (' + byId[material].tags[0] + '). В комплекте есть задания для печати и отдельные ответы для проверки.', [material, 'teachers'], state);
    if (material === 'teachers') return result('teacher-materials', 'Выберите тему для урока. На странице комплекта есть задания для учеников и отдельные ответы для проверки.', [material], state);
    if (/как.{0,16}проход|формат|почитать|посмотреть/.test(text) && /заняти[а-я]* с преподавател|заняти[а-я]* с наталь|ваш[а-я]* урок/.test(text) && booking !== 'requested') return result('lessons', 'На странице занятий можно посмотреть формат и условия работы с преподавателем.', ['lessons'], state);
    if (!declinesTutor && (booking === 'requested' || tutorRequested(text))) {
      state.referralShown = true;
      return result('tutor', 'Занятия ведёт Наталья Михайловна, автор MathExam. На странице занятий можно посмотреть формат и выбрать, как связаться. Сообщение нужно отправить самостоятельно в выбранном сервисе.', ['contact'], state);
    }
    if (/(?:не открывается|не загружается|не работает|ошибка сайта|сломал|сломана)/.test(text)) {
      return result('navigation-help', 'Попробуйте открыть нужный раздел через каталог. Если не работает именно вход в кабинет, обратитесь к преподавателю за помощью со входом. Личные ссылки и коды сюда вводить не нужно.', ['trainers', 'cabinet'], state);
    }
    if (/как ты работаешь|что ты умеешь|ты.{0,15}(?:учишься|запоминаешь|искусственный|ии|модель|бот)|сохраняешь.{0,15}(?:переписку|сообщения)|автоматическ.{0,10}обуч|нейросет|языков.{0,8}модел|chatgpt|openai|qwen/.test(text)) {
      return result('about', 'Я навигатор: подбираю ссылки по теме и разделу сайта с помощью подготовленных правил. Внешняя ИИ-модель здесь не подключена; условие, рисунок и ваш ответ я не вижу и не проверяю. Подбор выполняется в браузере: сообщения не отправляются сервису модели, а переписка не сохраняется между посещениями. Для разбора шагов откройте подходящий тренажёр.', ['trainers', 'topics'], state);
    }
    var oge = hasExam(text, 'огэ');
    var ege = hasExam(text, 'егэ');
    var numbers = taskNumbers(text);
    // With no numbered exercise, an explicit exclusion ("не для ОГЭ")
    // must not by itself establish the pupil's goal. Keep the established
    // clarification for multiple exam names attached to numbered exercises.
    if (!numbers.length) {
      var positiveExams = text.replace(/(?:^|[^а-я])(?:не\s+(?:для\s+)?|без\s+)(?:огэ|егэ)(?=$|[^а-я])/g, ' ');
      oge = hasExam(positiveExams, 'огэ'); ege = hasExam(positiveExams, 'егэ');
    }
    var number = numbers.length === 1 ? numbers[0] : null;
    // This published range is one verified practical-course entrance.
    var practicalRange = oge && !ege && numbers.length === 2 && numbers[0] === 1 && numbers[1] === 5
      && /(?:огэ|задани[еяию]|задач[аиуые]|номер|№)\s*[-:]?\s*1\s*[-–—]\s*5(?!\d)/.test(text);
    if (practicalRange) number = 1;
    var grade = classNumber(text);
    var primeRequest = /прост.{0,12}(?:чис(?:л|ел)|множител)|разлож.{0,20}прост.{0,12}множител/.test(text) && !((oge || ege) && number !== null);
    function done(value) { return finish(value, text, state); }
    if ((oge || ege) && numbers.length > 1 && !practicalRange) {
      // Do not assign the first of several explicitly named tasks to every exam.
      var numberPrompt = 'В запросе несколько разных номеров заданий. Напишите один номер вместе с экзаменом и, для ЕГЭ по математике, уровнем. Можно также открыть карту курса.';
      if (/информатик/.test(text)) return done(result('clarify', numberPrompt, ['oge-informatics', 'informatics-graphs', 'informatics-logic'], state,
        [choice('ОГЭ по информатике'), choice('ЕГЭ по информатике')]));
      return done(result('clarify', numberPrompt, ['oge', 'ege-base', 'ege-profile'], state,
        [choice('ОГЭ'), choice('ЕГЭ база'), choice('ЕГЭ профиль')]));
    }
    if (oge && ege) {
      var examSuffix = number === null ? '' : ': задание ' + number;
      if (/информатик/.test(text)) return done(result('clarify', 'В запросе названы ОГЭ и ЕГЭ по информатике. Уточните экзамен: одинаковый номер относится к разным заданиям.', ['oge-informatics', 'informatics-graphs', 'informatics-logic'], state,
        [choice('ОГЭ по информатике', 'ОГЭ по информатике' + examSuffix), choice('ЕГЭ по информатике', 'ЕГЭ по информатике' + examSuffix)]));
      return done(result('clarify', 'В запросе названы ОГЭ и ЕГЭ. Уточните экзамен и уровень: одинаковый номер относится к разным заданиям.', ['oge', 'ege-base', 'ege-profile'], state,
        [choice('ОГЭ', 'ОГЭ' + examSuffix), choice('ЕГЭ база', 'ЕГЭ база' + examSuffix), choice('ЕГЭ профиль', 'ЕГЭ профиль' + examSuffix)]));
    }
    if (/информатик/.test(text)) {
      if (oge) return done(result('informatics', 'Для ОГЭ по информатике есть отдельный тренажёр первой части.', ['oge-informatics'], state));
      if (ege || /графы|логик|тьюринг/.test(text)) return done(result('informatics', 'Выберите тему информатики: графы, алгебру логики или машину Тьюринга.', /тьюринг/.test(text) ? ['turing'] : number === 15 || /логик/.test(text) ? ['informatics-logic', 'logic-operations'] : number === 1 || /граф/.test(text) ? ['informatics-graphs'] : ['informatics-graphs', 'informatics-logic', 'turing'], state));
      return done(result('clarify', 'Нужна подготовка к ОГЭ или ЕГЭ по информатике?', ['oge-informatics', 'informatics-graphs', 'informatics-logic'], state,
        [choice('ОГЭ по информатике'), choice('ЕГЭ по информатике')]));
    }
    if (/иченск/.test(text)) return done(result('textbook', grade === null || grade === 7
      ? 'В подборке Иченской для 7 класса есть самостоятельные и контрольные работы. Выберите работу и вариант в самом курсе.'
      : 'Подготовленная подборка Иченской относится к 7 классу. Для другого класса выберите доступный материал в каталоге.',
      grade === null || grade === 7 ? ['ichenskaya', 'atanasyan-textbook'] : ['school', 'courses'], state));
    if (/петерс[ое]н|дорофеев/.test(text)) {
      if (grade === 5) return done(result('textbook', 'В курсе Петерсона 5 класса выберите нужную тему. Если ищете конкретный номер, воспользуйтесь навигацией самого курса.', ['peterson5'], state));
      if (grade !== null && grade !== 6) return done(result('textbook', 'Для этого запроса лучше начать с каталога школьных курсов и выбрать класс и учебник.', ['school', 'courses'], state));
      if (grade !== 6 && context !== 'peterson6') return done(result('clarify', 'По Петерсону нужен 5 или 6 класс?', ['peterson5', 'peterson6'], state,
        [choice('Петерсон 5 класс'), choice('Петерсон 6 класс')]));
      if (/десятич|запят/.test(text)) return done(decimals(text, state));
      return done(result('textbook', 'В курсе Дорофеева и Петерсона для 6 класса доступны темы первой части и отдельные вычислительные тренировки. Для совместных действий с обыкновенными и десятичными дробями есть отдельная тема. Номер упражнения можно искать внутри курса; разборы подготовлены для выбранных номеров.', ['peterson6', 'peterson-skills', 'peterson-fractions'], state));
    }
    if (/погорелов/.test(text)) return done(result('textbook', 'Откройте курс Погорелова и выберите тему или раздел по учебнику.', ['pogorelov'], state));
    if (/мерзляк/.test(text)) {
      if (/алгебр/.test(text) || grade !== null && ![7, 8, 9, 10].includes(grade)) return done(result('textbook', 'Для этого класса или предмета выберите материал в каталоге. Здесь не заявлен подходящий отдельный курс Мерзляка.', ['courses', 'school'], state));
      if (grade === 10) return done(result('textbook', 'Для Мерзляка 10 класса откройте курс геометрии базового уровня: там есть теория, выбранные задачи и пространственные модели.', ['merzlyak10'], state));
      if (grade !== null) return done(result('textbook', 'Для Мерзляка 7–9 классов откройте курс геометрии и выберите нужную тему.', ['merzlyak'], state));
      return done(result('clarify', 'Какой курс геометрии по Мерзляку нужен: 7–9 классы или 10 класс, базовый уровень?', ['merzlyak', 'merzlyak10'], state,
        [choice('Мерзляк 7–9'), choice('Мерзляк 10 класс')]));
    }
    if (/виленкин/.test(text)) {
      if (grade === 5) return done(result('textbook', 'Выберите тему курса Виленкина для 5 класса или откройте первую часть учебника.', /част[ьи]\s*1(?!\d)|перв[а-я]{1,3}\s+част/.test(text) ? ['vilenkin5-part1', 'vilenkin5'] : ['vilenkin5', 'vilenkin5-part1'], state));
      if (grade === 6 && primeRequest) return done(primeFactors(state));
      if (grade === 6) return done(result('textbook', 'В обновлённой первой части Виленкина 6 класса есть выбранные задания учебника, решения по шагам и таблица простых чисел в справке к теме. Прежний курс по темам доступен отдельно. Наличие темы не означает, что разобран каждый номер учебника.', ['vilenkin6-textbook', 'vilenkin6-topics'], state));
      if (grade !== null) return done(result('textbook', 'Для этого класса начните с каталога школьных курсов и проверьте автора и издание.', ['school', 'courses'], state));
      var primeSuffix = primeRequest ? ': таблица простых чисел' : '';
      return done(result('clarify', 'По Виленкину нужен 5 или 6 класс?', ['vilenkin5', 'vilenkin6-textbook'], state,
        [choice('Виленкин 5 класс', 'Виленкин 5 класс' + primeSuffix), choice('Виленкин 6 класс', 'Виленкин 6 класс' + primeSuffix)]));
    }
    if (/макарычев/.test(text)) {
      if ([7, 8, 9].includes(grade)) return done(result('textbook', 'Откройте курс Макарычева для выбранного класса. Темы и подготовленные разборы можно найти внутри курса; решения всех номеров не обещаются.', ['makarychev' + grade], state));
      if (grade !== null) return done(result('textbook', 'Для этого класса выберите учебник в школьном каталоге.', ['school', 'courses'], state));
      return done(result('clarify', 'По Макарычеву нужен 7, 8 или 9 класс?', ['makarychev7', 'makarychev8', 'makarychev9'], state,
        [choice('Макарычев 7 класс'), choice('Макарычев 8 класс'), choice('Макарычев 9 класс')]));
    }
    if (/алимов/.test(text)) return done(result('textbook', grade === null || grade === 10 || grade === 11
      ? 'Для Алимова доступен курс алгебры 10–11 классов с темами и выбранными разборами.'
      : 'Для этого класса выберите учебник в каталоге. Подходящий отдельный курс Алимова здесь не заявлен.',
      grade === null || grade === 10 || grade === 11 ? ['alimov'] : ['school', 'courses'], state));
    if (/никольск/.test(text)) return done(result('textbook', grade === null || grade === 10
      ? 'Для Никольского доступен курс алгебры 10 класса с темами и выбранными разборами.'
      : 'Для этого класса выберите учебник в каталоге. Подходящий отдельный курс Никольского здесь не заявлен.',
      grade === null || grade === 10 ? ['nikolsky'] : ['school', 'courses'], state));
    if (oge && number !== null) {
      if (number >= 1 && number <= 25) return done(result('oge-task', 'Откройте тренажёр нужной линии ОГЭ. Если вычисления мешают двигаться дальше, можно отдельно повторить основу.', [number <= 5 ? 'oge-practical' : 'oge-' + number, 'basics'], state));
      return done(result('clarify', 'В этом курсе ОГЭ задания собраны по номерам 1–25. Выберите номер в карте курса или напишите тему.', ['oge'], state));
    }
    if (/атанасян/.test(text) && (grade === 10 || grade === 11 || /10\s*[-–]\s*11|стереометр/.test(text))) return done(result('textbook', 'Для Атанасяна 10–11 классов доступны занятия по учебнику и карта тем стереометрии. Полный разбор всех номеров учебника пока не заявлен.', ['stereo-textbook', 'stereo'], state));
    if (/(?:равенств|равны|признак).{0,35}треугол|треугол.{0,35}(?:равенств|равны)/.test(text) && !/подоби/.test(text)) {
      return done(result('congruence', 'Начните с признаков равенства и соответствия вершин, затем потренируйтесь выбирать признак по данным условия. В курсе есть выбор из всех трёх признаков.', ['congruence', 'congruence-first', 'congruence-all'], state));
    }
    if (/атанасян/.test(text)) return done(grade !== null && grade >= 7 && grade <= 9
      ? result('textbook', 'Откройте геометрию Атанасяна для 7–9 классов и выберите нужную тему или упражнение.', ['atanasyan','atanasyan-textbook'], state)
      : result('clarify', 'По Атанасяну нужны 7–9 классы или 10–11 классы?', ['atanasyan','stereo'], state, [choice('Атанасян 7–9'),choice('Атанасян 10–11')]));
    if (primeRequest) {
      if (grade !== null && grade !== 6) return done(result('textbook', 'Проверенная таблица простых чисел находится в курсе Виленкина 6 класса. Для запрошенного класса выберите автора и доступный материал в школьном каталоге.', ['school', 'courses'], state));
      return done(primeFactors(state));
    }
    // Explicit mathematical examples take precedence over generic class matches.
    // Do not claim that the navigator solves or checks the user's equation.
    if (!oge && !ege && /квадратн[а-я]*\s+уравнен/.test(text)) {
      return done(result('equations', 'Откройте раздел уравнений и выберите тему квадратных уравнений.', ['equations'], state));
    }
    if (!oge && !ege && !/неравен|систем|квадратн|логарифм|тригоном/.test(text) &&
        (/уравнен/.test(text) || /[xх][^=]{0,25}=|=[^=]{0,25}[xх]/.test(text))) {
      return done(result('equations', 'Для разбора уравнений откройте маршрут по теме. Здесь можно найти материал для похожего примера.', ['equations', 'simple-equations'], state));
    }
    if (!oge && !ege && /дроб/.test(text) && !/десятич|запят/.test(text) && /делен|делить|делим|разделить|поделить/.test(text)) {
      return done(result('fractions', 'Откройте разбор обыкновенных дробей: в разделе «Деление» показан пример и правило.', ['ordinary-topic'], state));
    }
    var pupil = pupilSkill(text, oge, ege, number, state);
    if (pupil) return pupil;
    if (oge && !ege && /вероятност/.test(text) && number === null) return done(result('oge-task', 'В задании 10 ОГЭ можно потренировать задачи на вероятность.', ['oge-10'], state));
    if (oge && /график/.test(text) && number === null) return done(result('clarify', 'Нужно подобрать формулу к готовому графику или построить график и исследовать пересечения?', ['oge-11','oge-22'], state, [choice('Подобрать формулу', 'ОГЭ 11'),choice('Построить график', 'ОГЭ 22')]));
    if (oge && /геометр|треугол|окруж|четырехугол|клетк|клетчат|утвержден/.test(text)) {
      var geometryIds = /треугол/.test(text) ? ['oge-15', 'oge-geometry'] : /окруж/.test(text) ? ['oge-16', 'oge-geometry'] : /четырехугол/.test(text) ? ['oge-17', 'oge-geometry'] : /клетк|клетчат/.test(text) ? ['oge-18', 'oge-geometry'] : /утвержден/.test(text) ? ['oge-19', 'oge-geometry'] : ['oge-geometry-topic', 'oge-geometry', 'oge-15'];
      return done(result('oge-geometry', 'Геометрия ОГЭ собрана по темам: треугольники, окружность, четырёхугольники, клетчатая бумага и утверждения. В карте курса есть и геометрические задания второй части.', geometryIds, state));
    }
    if (oge && /дроб|вычислен/.test(text)) return done(result('oge-task', 'Дроби и вычисления для ОГЭ можно потренировать в задании 6. Для повторения смысла дроби начните с основ.', ['oge-6', 'fraction-meaning', 'decimal-basics'], state));
    var asksNod = /(?:^|[^а-яa-z])нод(?:$|[^а-яa-z])|наибольш.{0,12}общ.{0,12}делител/.test(text);
    var asksNok = /(?:^|[^а-яa-z])нок(?:$|[^а-яa-z])|наименьш.{0,12}общ.{0,12}кратн/.test(text);
    if (asksNod || asksNok) return done(result('number-theory', 'Для НОД и НОК есть отдельные пошаговые тренажёры. Можно повторить разложение на простые множители и открыть справку в курсе Виленкина.', asksNod && asksNok ? ['nod', 'nok', 'vilenkin6-textbook'] : [asksNod ? 'nod' : 'nok', 'vilenkin6-textbook'], state));
    if (/десятич|запят/.test(text)) return done(decimals(text, state));
    if (/обыкновенн|обычн.{0,10}дроб|знаменател|числител|сокращ.{0,10}дроб|неправильн.{0,10}дроб/.test(text)) return done(result('fractions', 'Для обыкновенных дробей удобно начать со смысла и сокращения, затем перейти к общему знаменателю и действиям.', ['ordinary-topic', 'fraction-meaning', 'fraction-common'], state));
    if (/дроб/.test(text)) return done(result('clarify', 'Какие дроби хотите потренировать: обыкновенные или десятичные? Можно начать с объяснения или перейти к упражнениям.', ['ordinary-topic', 'decimal-basics'], state,
      [choice('Обыкновенные дроби'), choice('Десятичные дроби')]));
    if (/подоби.{0,20}треугол|треугол.{0,20}подоби/.test(text)) return done(result('geometry', 'Для подобия треугольников есть отдельная тема с признаками подобия.', ['similarity', 'atanasyan'], state));
    if (/прогресси/.test(text) && !ege) return done(result('progressions', 'Арифметические и геометрические прогрессии можно потренировать в отдельном тренажёре задания 14 ОГЭ.', ['oge-14', 'oge'], state));
    if (grade !== null && grade >= 7 && grade <= 9 && /геометр|треугол|планиметр/.test(text) && !oge && !ege) return done(result('geometry', 'Для вашего класса начните с курса геометрии 7–9 классов. Тему и упражнения можно выбрать внутри курса.', ['atanasyan','atanasyan-textbook'], state));
    if (/геометр|треугол|планиметр/.test(text) && !ege && !/стереометр/.test(text)) return done(result('clarify', 'Какой раздел геометрии нужен: подготовка к ОГЭ, курс 7–9 классов или стереометрия?', ['oge-geometry', 'atanasyan', 'stereo'], state,
      [choice('Геометрия ОГЭ'), choice('Атанасян 7–9'), choice('Атанасян 10–11')]));
    if (ege) {
      // An explicit requested level takes priority over the page the visitor
      // happens to be on. Use pathname context only when neither is named.
      var wantsProfile = /профил/.test(text), wantsBase = /баз/.test(text);
      var level = wantsProfile && !wantsBase ? 'ege-profile' : wantsBase && !wantsProfile ? 'ege-base'
        : !wantsProfile && !wantsBase ? context : '';
      if (level === 'ege-profile') return done(result('ege', 'В профильном ЕГЭ можно выбрать номер задания в карте курса. Для планиметрии, векторов и стереометрии есть отдельные входы.', number === 1 ? ['ege-planimetry', 'ege-profile'] : number === 2 ? ['ege-vectors', 'ege-profile'] : number === 3 ? ['ege-stereo', 'ege-profile'] : ['ege-profile', 'ege-planimetry', 'ege-stereo'], state));
      if (level === 'ege-base') return done(result('ege', 'Откройте маршрут базового ЕГЭ и выберите нужную тему или номер. Для процентов и совместной работы есть отдельные занятия.', ['ege-base', 'base-percent', 'work-rate'], state));
      var levelSuffix = number === null ? '' : ': задание ' + number;
      return done(result('clarify', 'Нужен базовый или профильный ЕГЭ по математике?', ['ege-base', 'ege-profile'], state,
        [choice('ЕГЭ база', 'ЕГЭ база' + levelSuffix), choice('ЕГЭ профиль', 'ЕГЭ профиль' + levelSuffix)]));
    }
    if (oge) {
      if (/^(?:хочу\s+)?(?:готовиться\s+к\s+)?огэ$/.test(text)) return done(result('oge', 'В курсе ОГЭ выберите номер задания или тему. К основам можно вернуться отдельным коротким маршрутом.', ['oge', 'basics'], state));
      var ogeHits = search(text).filter(function (id) { return byId[id].category === 'ОГЭ'; });
      return done(result('oge', 'В курсе ОГЭ выберите номер задания или тему. К основам можно вернуться отдельным коротким маршрутом.', ogeHits.length ? ogeHits : ['oge', 'basics', 'oge-geometry'], state));
    }
    if (grade === 7 && /раздел|тем[ыуае]|собран|параллел|класс/.test(text)) return done(result('school', 'На странице 7 класса собраны алгебра, геометрия и повторение основ.', ['grade7'], state));
    if (/учебник|курсы по|школьн.{0,12}курс/.test(text)) return done(result('textbooks', 'В каталоге можно выбрать автора, класс и предмет. Курсы содержат объяснения тем и выбранные разборы; полные решения всех номеров не обещаются.', ['courses', 'school', 'atanasyan'], state,
      [choice('Петерсон 6 класс'), choice('Виленкин 6 класс'), choice('Атанасян 7–9')]));
    if (/все тренажер|каталог|поиск по сайту|какие есть тренажер/.test(text)) return done(result('catalogue', 'В каталоге тренажёров есть поиск по названию и теме, а также разделы по предметам. Курсы по учебникам собраны отдельно.', ['trainers', 'courses', 'school'], state));
    if (/^(?:разборы тем|найти объяснение|объяснение темы|хочу понять правило)[.!?]*$/.test(text)) return done(result('topics', 'В разделе тем выберите нужное объяснение, затем перейдите к упражнениям. Если тема ещё не ясна, начните с основ.', ['topics', 'foundations'], state));
    if (/базовые действия|потренировать вычисления|начать с основ|более прост|попробовать проще/.test(text)) return done(result('foundations', 'Выберите один навык: вычисления, смысл дроби или порядок действий. После короткой тренировки можно вернуться к основной теме.', ['foundations', 'basics', 'order'], state));
    // Explicit advanced objects must reach topic search, not primary arithmetic.
    var advancedObject = /(?:^|[^а-яa-z])(многочлен|вектор|степен|корен|корн|выражен|матриц|квадрат|куб)/.exec(text);
    var advancedArithmetic = advancedObject !== null;
    if (/умнож.{0,15}на\s*(?:9(?:$|\D)|девять)|таблиц.{0,15}на\s*9(?:$|\D)/.test(text) && !advancedArithmetic) return done(result('multiplication', 'В занятии о приёмах таблицы умножения есть отдельный шаг про умножение на 9. Можно также потренироваться читать произведение в таблице Пифагора.', ['times-nine', 'pythagoras-table'], state));
    if (/таблиц.{0,15}умнож/.test(text) && /вперемешк|смешанн/.test(text) && !advancedArithmetic) return done(result('multiplication', 'В этом тренажёре можно повторить таблицу умножения вперемешку и найти неизвестный множитель.', ['multiplication-mixed', 'pythagoras-table'], state));
    if (/таблиц.{0,15}умнож/.test(text) && !advancedArithmetic) return done(result('multiplication', 'Выберите удобный вход: таблицу Пифагора, приёмы запоминания или общий маршрут умножения и деления.', ['pythagoras-table', 'times-nine', 'multiplication-table'], state));
    if (/делени|делить|поделить|делим|уголком/.test(text) && !advancedArithmetic) return done(result('division', 'Начните с пошагового тренажёра деления уголком.', ['division-stepwise'], state));
    if (/арифметик|научиться считать|считать с нуля|с самого начала/.test(text) && !advancedArithmetic) return done(result('arithmetic', 'В маршруте по арифметике выберите одно действие: сложение и вычитание, умножение, деление или десятичные дроби. Начать можно с маленьких чисел.', ['arithmetic-route', 'basics'], state,
      [choice('Сложение и вычитание'), choice('Умножение'), choice('Деление уголком')]));
    if (/сложени|складыв|прибав|вычит|вычесть|отним/.test(text) && !advancedArithmetic && !/уравнен|вероятност/.test(text)) return done(result('arithmetic', 'Для сложения и вычитания выберите нужную ступень: от маленьких чисел до вычислений столбиком.', ['arithmetic-count', 'arithmetic-route'], state));
    if (/умнож|произвед/.test(text) && !advancedArithmetic && !/формул|вероятност/.test(text)) return done(result('multiplication', 'В маршруте умножения можно начать с равных групп, повторить таблицу и перейти к столбику.', ['arithmetic-multiply', 'multiplication-notebook', 'multiplication-mixed'], state));
    var hits = search(text);
    if (advancedArithmetic) {
      // A shared operation or multiplier alone is not a matching object.
      var objectPattern = new RegExp('(?:^|[^а-яa-z])' + (/^кор/.test(advancedObject[1]) ? 'кор(?:ен|н)' : advancedObject[1]));
      hits = hits.filter(function (id) { return objectPattern.test(normalize(byId[id].title + ' ' + byId[id].tags.join(' '))); });
    }
    if (hits.length) return done(result('search', 'Подойдут эти разделы. Если искали другое, добавьте класс, экзамен или автора учебника.', hits, state));
    if (explicitDifficulty(text)) {
      var helpIds = context === 'peterson6' ? ['peterson-skills', 'peterson6'] : context === 'atanasyan' ? ['atanasyan', 'atanasyan-textbook'] : ['foundations', 'topics'];
      return done(result('difficulty', 'Давайте начнём с одного небольшого шага. Что труднее: понять правило, выполнить вычисление или выбрать способ решения?', helpIds, state,
        [choice('Найти объяснение', 'Разборы тем'), choice('Потренировать вычисления'), choice('Выбрать тему', 'Все тренажёры')]));
    }
    if (/(?:реши|вычисли|проверь|докажи|чертеж|\d\s*[+\-×÷*/=:]\s*\d)/.test(text)) return result('navigation-only', 'В этом окне можно подобрать учебные материалы. Напишите тему, класс или номер задания, чтобы перейти к подходящему тренажёру.', ['topics', 'trainers'], state);
    return done(result('unknown', 'По этой формулировке точную страницу пока не нашёл. Напишите тему, класс, экзамен или автора учебника. Можно также открыть каталог.', ['trainers', 'courses'], state));
  }

  // A follow-up is limited to the previous prepared choices and an explicitly
  // chosen study goal. Never carry an old exam into a new, named maths skill.
  var goalLabels = {'oge':'ОГЭ','ege':'ЕГЭ','ege-base':'ЕГЭ база','ege-profile':'ЕГЭ профиль'};
  function shortReply(text) {
    return normalize(text).replace(/[.,!?…]+$/g, '').trim();
  }
  function gradeReply(text) {
    var contextual = classNumber(text);
    if (contextual !== null && !/[,;].+|(?:хочу|нуж|най|тренир|тема|геометр|дроб|дел|умнож|запис|занят|занимат|репетитор|мини[ -]?групп|уравнен|реш|бесплат)/.test(text)) return contextual;
    var s = shortReply(text).replace(/^(?:а\s+)?(?:(?:я|он|она|мой сын|моя дочь|сын|дочь|ребенок|у меня)\s+)?(?:(?:учусь|учится|ученик|ученица)\s+)?(?:в\s+|для\s+)?/, '');
    var numeric = /^([5-9]|1[01])(?:[ -]?(?:го|ом|й|м))?(?:\s+класс(?:а|е)?)?$/.exec(s);
    if (numeric) return Number(numeric[1]);
    var word = /^(пят|шест|седьм|восьм|девят|десят|одиннадцат)(?:ый|ой|ом|ого|ому|ым)(?:\s+класс(?:а|е)?)?$/.exec(s);
    return word ? gradeNames.indexOf(word[1]) + 5 : null;
  }
  function choiceForReply(text, choices) {
    var s = shortReply(text), g = gradeReply(s);
    var matches = choices.filter(function (a) {
      var label = shortReply(a.label);
      if (s === label) return true;
      if (label === 'огэ' && hasExam(s,'огэ') && !hasExam(s,'егэ')) return true;
      if (label === 'егэ база' && hasExam(s,'егэ') && /баз/.test(s) && !/профил/.test(s)) return true;
      if (label === 'егэ профиль' && hasExam(s,'егэ') && /профил/.test(s) && !/баз/.test(s)) return true;
      if (/^(?:виленкин|петерсон|макарычев|атанасян|мерзляк)$/.test(s)) return label.startsWith(s + ' ');
      if (/^(?:база|базов(?:ый|ая|ого))$/.test(s)) return label === 'егэ база';
      if (/^(?:профиль|профильн(?:ый|ая|ого))$/.test(s)) return label === 'егэ профиль';
      return g !== null && new RegExp('(?:^|\\s)' + g + '\\s*класс(?:$|\\s)').test(label);
    });
    return matches.length === 1 ? matches[0].text : text;
  }
  function turn(input) {
    if (!input || typeof input.text !== 'string' || !input.text.trim() || input.text.length > 1000 || looksPrivate(normalize(input.text))) return respond(input);
    var previous = input.dialog || {};
    var goal = ['school','oge','ege','ege-base','ege-profile'].includes(previous.goal) ? previous.goal : '';
    var offered = Array.isArray(previous.choices) ? previous.choices.slice(0,3).filter(function (a) {
      return a && typeof a.text === 'string' && a.text.length <= 400 && typeof a.label === 'string' && a.label.length <= 100;
    }) : [];
    var original = shortReply(input.text);
    var changedGoal = /(?:^|\s)(?:раньше|до этого|сначала)\s.+?[,;]\s*(?:но\s+|а\s+)?(?:сейчас|теперь)\s+(.+)$/.exec(original);
    if (changedGoal) original = changedGoal[1];
    // A bare number after an explicit exam goal is a task, not a new grade.
    // Naming a class still changes the goal to school in the normal path below.
    if (Object.hasOwn(goalLabels,goal) && /^\d{1,2}$/.test(original)) original = 'задание ' + original;
    if (/^ege(?:-base|-profile)?$/.test(goal) && /^(?:а\s+)?(?:(?:теперь|сейчас|нужна|нужен|хочу)\s+)?(?:база|базов(?:ый|ая|ого)|профиль|профильн(?:ый|ая|ого))$/.test(original)) original = 'ЕГЭ ' + original;
    var text = choiceForReply(original, offered), t = shortReply(text);
    var statedGrade = classNumber(original), bareGrade = gradeReply(original);
    if (statedGrade === null && bareGrade !== null) statedGrade = bareGrade;
    var rememberedGrade = Number.isInteger(previous.grade) ? previous.grade : null;
    var grade = statedGrade === null ? rememberedGrade : statedGrade;
    if (grade < 5 || grade > 11) grade = null;
    var explicitExam = t.replace(/(?:не (?:к |для )?|без )(?:огэ|егэ)|(?:огэ|егэ)\s+(?:мне\s+)?(?:пока\s+)?не\s+(?:нуж[а-я]*|интересу[а-я]*|сдаю)/g, '');
    var o = hasExam(explicitExam, 'огэ'), e = hasExam(explicitExam, 'егэ');
    var namedBook = /петерс[ое]н|дорофеев|виленкин|макарычев|атанасян|мерзляк|алимов|никольск|иченск|погорелов/.test(t);
    var schoolScope = statedGrade !== null || namedBook || /для школы|по школьной программе|не (?:к |для )?(?:огэ|егэ)|без (?:огэ|егэ)/.test(original);
    if (schoolScope && !(o || e)) goal = 'school';
    if (o || e) goal = o && e ? '' : o ? 'oge' : /профил/.test(t) ? 'ege-profile' : /баз/.test(t) ? 'ege-base' : 'ege';
    var clean = schoolScope && !(o || e) ? explicitExam : text;
    if (grade && goal === 'school' && namedBook && classNumber(clean) === null) clean += ' ' + grade + ' класс';
    var path = input.pathname;
    if (goal === 'school' && /^(?:oge|ege-base|ege-profile)$/.test(pathContext(path))) path = '/';
    var requestedNumbers = taskNumbers(t);
    var n = requestedNumbers.length === 1 && !namedBook && !(o || e) ? requestedNumbers[0] : null;
    if (n !== null && Object.hasOwn(goalLabels,goal)) clean = goalLabels[goal] + ': задание ' + n;
    var papersFollowup = /^(?:а\s+)?(?:(?:где(?:\s+можно)?|можно|хочу|как)\s+)?(?:(?:есть|найти|скачать|распечатать|взять|посмотреть|открыть)\s+)?(?:печатные\s+)?(?:варианты|пробники)(?:\s+(?:на печать|с ответами|с решениями|для печати))?$/.test(t);
    if (papersFollowup && Object.hasOwn(goalLabels,goal)) clean = goalLabels[goal] + ' ' + t;
    var state = stateFrom(input), response;
    if (previous.goal && goal && previous.goal !== goal) state.difficultyCount = 0;
    if (bareGrade !== null && !namedBook && !/раздел|собран|параллел|найти|покажи|тем[ыуае]|делени|дроб|геометр|умнож/.test(t) && !(o || e)) {
      response = grade === 6 ? result('clarify', 'Что сейчас проходите в шестом классе? Напишите тему или выберите свой учебник.', ['vilenkin6','peterson6'], state, [choice('Виленкин 6 класс'),choice('Петерсон 6 класс')]) :
        result('school', 'Какую тему сейчас проходите? Можно написать её своими словами или назвать автора учебника.', ['courses'], state);
    } else if (n !== null && goal === 'school') {
      response = result('clarify', 'Из какого учебника упражнение №' + n + (grade ? ' для ' + grade + ' класса? Напишите автора.' : '? Напишите автора и класс.'), ['courses'], state);
    } else if (papersFollowup && goal === 'school') {
      response = result('clarify', 'На какую школьную тему нужна работа? Например, есть листы по дробям, процентам и уравнениям.', ['teachers'], state);
    } else {
      response = respond(Object.assign({},input,state,{text:clean,pathname:path,studyGoal:goal}));
    }
    if (response.kind === 'textbook' && !o && !e) goal = 'school';
    response.dialog = {goal:goal,grade:grade,choices:response.kind === 'clarify' ? (response.actions || []).slice(0,3) : []};
    return response;
  }
  return Object.freeze({ catalogue: catalogue, welcome: welcome, respond: turn });
});


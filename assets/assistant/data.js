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
    ['trainers', 'Каталог тренажёров', '/trainers/', 'Навигация', ['все тренажеры', 'каталог', 'поиск']],
    ['courses', 'Курсы по учебникам и темам', '/courses/', 'Навигация', ['учебники', 'курсы']],
    ['topics', 'Разборы тем', '/topics/', 'Навигация', ['объяснение', 'правило', 'темы']],
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
    ['division-notebook', 'Деление уголком: тетрадный тренажёр', '/trainers/trainers/long-division.html', 'Письменные алгоритмы', ['тетрадный формат', 'деление']],
    ['multiplication-notebook', 'Умножение столбиком', '/trainers/trainers/long-multiplication.html', 'Письменные алгоритмы', ['умножение столбиком']],
    // The compatibility URLs now redirect to these published lessons. Use the
    // direct routes and retain the existing compatibility pages unchanged.
    ['multiplication-mixed', 'Таблица умножения: вперемешку', '/trainers/oge-basics/multiplication-division/multiplication-mixed.html', 'Таблица умножения', ['таблица умножения', 'вперемешку']],
    ['multiplication-table', 'Умножение и деление: от таблицы к алгоритмам', '/trainers/oge-basics/multiplication-division/', 'Таблица умножения', ['таблица умножения']],
    ['pythagoras-table', 'Таблица Пифагора', '/trainers/oge-basics/multiplication-division/multiplication-pythagoras-table.html', 'Таблица умножения', ['пифагор', 'таблица']],
    ['times-nine', 'Таблица умножения: приёмы, включая ×9', '/trainers/oge-basics/multiplication-division/multiplication-tricks.html', 'Таблица умножения', ['умножение на девять', 'умножение на 9', 'приемы']],
    ['oge', 'Курс подготовки к ОГЭ', '/trainers/oge-course/', 'ОГЭ', ['огэ', 'экзамен 9 класс']],
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
    return Object.freeze({ id: r[0], title: r[1], url: r[2], category: r[3], tags: Object.freeze(r[4].slice()) });
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
    if (/^\/trainers\/oge-(?:course|task\d|1-5)/.test(pathname) || pathname === '/trainers/task19-trainer.html' || /^\/topics\/oge-geometriya\//.test(pathname)) return 'oge';
    if (/^\/trainers\/oge-basics(?:\/|$)/.test(pathname) || /^\/foundations(?:\/|$)/.test(pathname)) return 'basics';
    return '';
  }
  function links(ids) {
    return ids.slice(0, 3).map(function (id) { return { title: byId[id].title, url: byId[id].url }; });
  }
  function choice(label, text) { return { label: label, text: text || label }; }
  function result(kind, text, ids, state, actions) {
    if (kind === 'welcome') text = 'Я навигатор по материалам сайта. Внешняя ИИ-модель здесь не подключена. ' + text;
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
    return result('welcome', 'Помогу найти тему, тренажёр или раздел сайта. Напишите, что хотите потренировать.', ['trainers', 'courses'], null,
      [choice('Дроби'), choice('Геометрия ОГЭ'), choice('Курсы по учебникам')]);
  }
  function looksPrivate(text) {
    if (/[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text)) return true;
    var phone = text.match(/\+?\d[\d\s().-]{8,}\d/g) || [];
    if (phone.some(function (part) { return part.replace(/\D/g, '').length >= 10; })) return true;
    return /(?:пароль|password|код(?: входа)?|api[-_ ]?key|ключ api|access[-_ ]?token|токен)\s*[:=]\s*\S+/i.test(text)
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
    var pattern = /(?:задани[еяию]|номер|№|(?:огэ|егэ)(?:\s+(?:база|базовый|профиль|профильный))?)\s*[-:]?\s*(\d{1,3})(?!\d)/g;
    function add(value) {
      var number = Number(value);
      if (numbers.indexOf(number) === -1) numbers.push(number);
    }
    while ((match = pattern.exec(text))) {
      add(match[1]);
      // A list or range can omit the repeated task marker: "№6, 13 и 19".
      // Only consume adjacent list items, never numbers from the task itself.
      var rest = text.slice(pattern.lastIndex), item;
      while ((item = /^\s*(?:[,;–—-]|или\s+|и\s+)\s*(?:(?:задани[еяию]|номер|№)\s*)?(\d{1,3})(?!\d)/.exec(rest))) {
        add(item[1]);
        rest = rest.slice(item[0].length);
      }
    }
    return numbers;
  }
  function classNumber(text) {
    var match = /(?:^|[^\d])(\d{1,2})\s*(?:[-–]?\s*[йя]\s*)?класс/.exec(text)
      || /(?:петерс[ое]на?|дорофеева?|виленкина?|атанасяна?|мерзляка?|макарычева?|алимова?|никольск(?:ий|ого)|иченск(?:ая|ой))\s*[,·:-]?\s*(\d{1,2})(?!\d)/.exec(text);
    return match ? Number(match[1]) : null;
  }
  function accessIntent(text) {
    // Match the noun's case forms, without confusing "входная диагностика"
    // with an account problem. These intents never count as learning failure.
    return /кабинет|парол|логин|личн.{0,8}ссыл|авторизац|авторизова|войти/.test(text)
      || /(?:^|[^а-я])вход(?:а|е|у|ом)?(?:$|[^а-я])/.test(text);
  }
  function explicitDifficulty(text) {
    if (accessIntent(text)) return false;
    if (/(?:не могу|не получается|не понимаю|не знаю).{0,35}(?:войти|зайти|открыть|найти|скачать|сохранить|загрузить|вход)/.test(text)) return false;
    if (/(?:сайт|ссылка|кнопка|страница|тренажер).{0,20}не работа/.test(text)) return false;
    return /(?:не понимаю|не понял|не поняла|не получается|не могу решить|не могу разобраться|ничего не понятно|ничего не понимаю|совсем запутал|снова ошибка|опять ошибка|слишком сложно|мне трудно|мне сложно|застрял|застряла|все еще трудно)/.test(text)
      || /^(?:сложно|трудно|непонятно)[.!?]*$/.test(text);
  }
  function tutorDeclined(text) {
    return /(?:без|не хочу|не нужен|не нужна|не надо|не предлагай|не предлагайте|не нужны).{0,25}(?:репетитор|преподавател|учител|занятия|занятий)/.test(text)
      || /(?:репетитор|преподавател|учител|занятия|занятий).{0,35}(?:не нужен|не нужна|не нужны|не нужно|не надо|не хочу|не хотим|не интересу|не требу|не предлаг)/.test(text);
  }
  function tutorRequested(text) {
    return /репетитор/.test(text)
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
    } else if (/делени|делить|делим|делител/.test(text)) ids = /на\s+десятичн|десятичн.{0,12}делител/.test(text)
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
    return entry.category !== 'Занятия' && entry.category !== 'Кабинет' && entry.category !== 'Результаты';
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
    if (tutorDeclined(text)) {
      // An explicit decline consumes the optional offer for this page session.
      state.referralShown = true;
      return result('self-study', 'Можно продолжить самостоятельную работу: выбрать одну тему, открыть объяснение и перейти к упражнениям.', ['topics', 'foundations', 'trainers'], state);
    }
    var context = pathContext(input.pathname);
    if (accessIntent(text)) {
      return result('cabinet', 'Кабинет открывается отдельно. Используйте личную ссылку или данные входа, выданные преподавателем. Если ссылка не работает или код потерян, попросите преподавателя помочь со входом. В навигатор код или пароль вводить не нужно.', ['cabinet'], state);
    }
    if (/(?:^|[^а-я])прогресс(?:$|[^а-я])|мои результаты|сохран(?:ить|ение|ено|ил|ятся)|результаты.{0,20}(?:пропал|где|посмотр)|где.{0,20}результат/.test(text)) {
      if (context === 'peterson6' || /петерс[ое]н.*6/.test(text)) return result('progress', 'В отдельном курсе Петерсона 6 класса работа сохраняется в текущем браузере; раздел «Мои результаты» позволяет посмотреть результаты и скачать их. Для занятий через кабинет откройте кабинет отдельно. Навигатор не читает ваши результаты.', ['peterson-progress', 'cabinet'], state);
      if (context === 'atanasyan') return result('progress', 'В отдельном курсе геометрии результаты сохраняются в текущем браузере; в курсе предусмотрен экспорт. Для занятий через кабинет откройте кабинет отдельно. Навигатор не читает ваши результаты.', ['atanasyan', 'cabinet'], state);
      return result('progress', 'Где вы занимались: в кабинете или на отдельной странице тренажёра? Сохранение устроено по-разному. Откройте кабинет под своей учётной записью либо раздел результатов самого тренажёра. В некоторых курсах работа сохраняется только в текущем браузере. Навигатор не читает ваши результаты.', ['cabinet', 'trainers'], state);
    }
    if (tutorRequested(text)) {
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
    var number = numbers.length === 1 ? numbers[0] : null;
    // This published range is one verified practical-course entrance.
    var practicalRange = oge && !ege && numbers.length === 2 && numbers[0] === 1 && numbers[1] === 5
      && /(?:огэ|задани[еяию]|номер|№)\s*[-:]?\s*1\s*[-–—]\s*5(?!\d)/.test(text);
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
      if (grade === 5) return done(result('textbook', 'Откройте курс Виленкина 5 класса и выберите тему. Здесь есть объяснения и практика; решения всех номеров учебника не обещаются.', ['vilenkin5'], state));
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
    if (/атанасян/.test(text)) return done(result('textbook', 'Для Атанасяна доступны геометрия 7–9 классов и стереометрия 10–11. Выберите курс; в геометрии 7–9 есть также занятия по учебнику.', ['atanasyan', 'atanasyan-textbook', 'stereo'], state));
    if (primeRequest) {
      if (grade !== null && grade !== 6) return done(result('textbook', 'Проверенная таблица простых чисел находится в курсе Виленкина 6 класса. Для запрошенного класса выберите автора и доступный материал в школьном каталоге.', ['school', 'courses'], state));
      return done(primeFactors(state));
    }
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
      var ogeHits = search(text).filter(function (id) { return byId[id].category === 'ОГЭ'; });
      return done(result('oge', 'В курсе ОГЭ выберите номер задания или тему. К основам можно вернуться отдельным коротким маршрутом.', ogeHits.length ? ogeHits : ['oge', 'basics', 'oge-geometry'], state));
    }
    if (/учебник|курсы по|школьн.{0,12}курс/.test(text)) return done(result('textbooks', 'В каталоге можно выбрать автора, класс и предмет. Курсы содержат объяснения тем и выбранные разборы; полные решения всех номеров не обещаются.', ['courses', 'school', 'atanasyan'], state,
      [choice('Петерсон 6 класс'), choice('Виленкин 6 класс'), choice('Атанасян 7–9')]));
    if (/все тренажер|каталог|поиск по сайту|какие есть тренажер/.test(text)) return done(result('catalogue', 'В каталоге тренажёров есть поиск по названию и теме, а также разделы по предметам. Курсы по учебникам собраны отдельно.', ['trainers', 'courses', 'school'], state));
    if (/^(?:разборы тем|найти объяснение|объяснение темы|хочу понять правило)[.!?]*$/.test(text)) return done(result('topics', 'В разделе тем выберите нужное объяснение, затем перейдите к упражнениям. Если тема ещё не ясна, начните с основ.', ['topics', 'foundations'], state));
    if (/базовые действия|потренировать вычисления|начать с основ|более прост|попробовать проще/.test(text)) return done(result('foundations', 'Выберите один навык: вычисления, смысл дроби или порядок действий. После короткой тренировки можно вернуться к основной теме.', ['foundations', 'basics', 'order'], state));
    // Explicit advanced objects must reach topic search, not primary arithmetic.
    var advancedObject = /(?:^|[^а-яa-z])(многочлен|вектор|степен|корен|корн|выражен|матриц)/.exec(text);
    var advancedArithmetic = advancedObject !== null;
    if (/умнож.{0,15}на\s*(?:9(?:$|\D)|девять)|таблиц.{0,15}на\s*9(?:$|\D)/.test(text) && !advancedArithmetic) return done(result('multiplication', 'В занятии о приёмах таблицы умножения есть отдельный шаг про умножение на 9. Можно также потренироваться читать произведение в таблице Пифагора.', ['times-nine', 'pythagoras-table'], state));
    if (/таблиц.{0,15}умнож/.test(text) && /вперемешк|смешанн/.test(text) && !advancedArithmetic) return done(result('multiplication', 'В этом тренажёре можно повторить таблицу умножения вперемешку и найти неизвестный множитель.', ['multiplication-mixed', 'pythagoras-table'], state));
    if (/таблиц.{0,15}умнож/.test(text) && !advancedArithmetic) return done(result('multiplication', 'Выберите удобный вход: таблицу Пифагора, приёмы запоминания или общий маршрут умножения и деления.', ['pythagoras-table', 'times-nine', 'multiplication-table'], state));
    if (/делени|делить|поделить|делим|уголком/.test(text) && !advancedArithmetic) return done(result('division', 'Для деления уголком начните с пошагового тренажёра. Если трудно выбрать цифру или выполнить отдельное действие, откройте маршрут деления и выберите нужный навык.', ['division-stepwise', 'arithmetic-division', 'division-lab'], state));
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

  return Object.freeze({ catalogue: catalogue, welcome: welcome, respond: respond });
});

/* =========================================================================
   РЕЕСТР КУРСА ОГЭ — общий для index.html, review.html и teacher.html.
   Контракт: docs/OGE_PROGRESS_CONTRACT.md. Решения: docs/adr/0003-oge-course.md.

   TRAINERS — тренажёры курса по TID: file (относительно oge/), title, line,
              review (ведёт журнал по контракту → кнопка «Повторить»),
              contract ("line" — ядро записи линии, "plot" — сюжет 1–5,
              "analogue", "exam", null — своя форма), planned (файла ещё нет).
   NAMES    — человеческие имена типов: "TID|тип" -> { n, line }.
   TYPES    — типы каждого тренажёра; равны TYPE_IDS в файле тренажёра.
   LINES    — порядок линий навигатора: номер линии -> [TID, …].
   CABINET  — что показывает кабинет учителя.

   Ключ localStorage, TID и формат журнала ошибок здесь не меняются.
   Черновик NAMES собран из тренажёров скриптом tools/oge-registry-draft.mjs;
   типы тренажёров, которые ещё не ведут TYPE_IDS, помечены как planned в
   комментарии и уточняются задачами docs/tasks/OGE_COURSE_03*.md.
   Унаследованная ветка oge13InequalitiesSeries (серия по неравенствам)
   в реестр не входит: тренажёр уходит в архив задачей OGE_COURSE_03E_TASK13.
   ========================================================================= */
var RV = (function(){
  "use strict";
  var TRAINERS = {
    "practiceEntryDiagnostic2026": { file:"../trainers/oge-1-5-trainers/practice-1-5-entry-diagnostic-2026.html", title:"Входная диагностика 1–5", line:0, review:false, contract:null },
    "percentTableTrainer": { file:"../trainers/oge-1-5-trainers/percent-table-trainer.html", title:"Проценты — таблица 2×2", line:0, review:false, contract:null },
    "practiceRoadsGridTrainer": { file:"../trainers/oge-1-5-trainers/practice-1-5-roads-grid.html", title:"Дороги по клеткам", line:0, review:false, contract:"plot" },
    "practiceRoadsSchemaTrainer": { file:"../trainers/oge-1-5-trainers/practice-1-5-roads-schema.html", title:"Дороги без клеток", line:0, review:false, contract:"plot" },
    "practiceTiresTrainer": { file:"../trainers/oge-1-5-trainers/practice-1-5-tires.html", title:"Шины", line:0, review:false, contract:"plot" },
    "practiceStovesTrainer": { file:"../trainers/oge-1-5-trainers/practice-1-5-stoves.html", title:"Печки", line:0, review:false, contract:"plot" },
    "practiceLandPlotsTrainer": { file:"../trainers/oge-1-5-trainers/practice-1-5-land-plots.html", title:"Участки", line:0, review:false, contract:"plot" },
    "practiceApartmentsTrainer": { file:"../trainers/oge-1-5-trainers/practice-1-5-apartments.html", title:"Квартиры", line:0, review:false, contract:"plot" },
    "practiceTariffsTrainer": { file:"../trainers/oge-1-5-trainers/practice-1-5-tariffs.html", title:"Тарифы", line:0, review:false, contract:"plot" },
    "practicePaperSheetsTrainer": { file:"../trainers/oge-1-5-trainers/practice-1-5-paper-sheets.html", title:"Листы", line:0, review:false, contract:"plot" },
    "practicePlanReadingTrainer": { file:"../trainers/oge-1-5-trainers/practice-1-5-plan-reading.html", title:"Чтение плана", line:0, review:false, contract:null },
    "practiceRoutesCheckpoint2026": { file:"../trainers/oge-1-5-trainers/practice-1-5-routes-checkpoint-2026.html", title:"Проверочная по маршрутам", line:0, review:false, contract:null },
    "oge-t6-vychisleniya": { file:"../trainers/oge-task6-fractions.html", title:"Вычисления: дроби и десятичные", line:6, review:false, contract:"line" },
    "oge-t7-pryamaya": { file:"../trainers/oge-task7-number-line.html", title:"Координатная прямая", line:7, review:false, contract:"line" },
    "oge-t8-stepeni": { file:"../trainers/oge-task8-powers-roots.html", title:"Степени и корни", line:8, review:false, contract:"line" },
    "oge-t9-uravneniya": { file:"../trainers/oge-task9-equations.html", title:"Уравнения", line:9, review:false, contract:"line" },
    "oge-t10-veroyatnost": { file:"../trainers/oge-task10-probability.html", title:"Вероятность", line:10, review:false, contract:"line" },
    "oge-t11-grafiki": { file:"../trainers/oge-task11-graphs-trainer.html", title:"Графики функций", line:11, review:false, contract:"line" },
    "oge-t12-formuly": { file:"../trainers/oge-task12-formulas-trainer.html", title:"Расчёты по формулам", line:12, review:false, contract:"line" },
    "oge-t13-neravenstva": { file:"../trainers/oge-task13-inequalities.html", title:"Неравенства", line:13, review:false, contract:"line" },
    "oge-t14-progressii": { file:"../trainers/oge-task14-progressions.html", title:"Прогрессии", line:14, review:false, contract:"line" },
    "oge-t15-treugolniki": { file:"../trainers/oge-task15-triangles.html", title:"Треугольники", line:15, review:false, contract:"line", planned:true },
    "oge-task16-circle": { file:"../trainers/oge-task16-circle.html", title:"Окружность", line:16, review:true, contract:"line" },
    "oge17-chetyrehugolniki": { file:"../trainers/oge-task17-quadrilaterals.html", title:"Четырёхугольники", line:17, review:true, contract:"line" },
    "oge18-kletki": { file:"../trainers/oge-task18-grid.html", title:"Клетчатая бумага", line:18, review:true, contract:"line" },
    "oge-t19-utverzhdeniya": { file:"../trainers/task19-trainer.html", title:"Утверждения", line:19, review:false, contract:"line" },
    "oge-t20-algebra": { file:"../trainers/oge-task20-equations.html", title:"Алгебра, часть 2", line:20, review:false, contract:"line" },
    "oge-t21-tekst": { file:"../trainers/oge-task21-word-problems.html", title:"Текстовые задачи", line:21, review:false, contract:"line" },
    "oge-t22-grafiki": { file:"../trainers/oge-task22-functions-graphs.html", title:"Графики функций, часть 2", line:22, review:false, contract:"line" },
    "oge23-vychisleniya": { file:"../trainers/oge-task23-geometry-calculations.html", title:"Геометрия: вычисление", line:23, review:true, contract:"line" },
    "oge24-dokazatelstva": { file:"../trainers/oge-task24-proofs.html", title:"Геометрия: доказательство", line:24, review:true, contract:"line" },
    "oge25-geometriya": { file:"../trainers/oge-task25-geometry.html", title:"Геометрия повышенной сложности", line:25, review:true, contract:"line" },
    "oge-2027-analogue-1": { file:"../trainers/oge-2027-analogue-1.html", title:"Авторский вариант 2027", line:0, review:false, contract:"analogue" },
    "oge-full-exam": { file:"exam/full-exam.html", title:"Пробный экзамен", line:0, review:false, contract:"exam", planned:true }
  };

  var NAMES = {
    /* 16 · trainers/oge-task16-circle.html · 33 типов (ключи тренажёра) */
    "oge-task16-circle|insCen": { n:"Центральные и вписанные углы: Вписанный угол по центральному", line:16 },
    "oge-task16-circle|twoDiam": { n:"Центральные и вписанные углы: Два диаметра: ∠OAB и ∠OCD", line:16 },
    "oge-task16-circle|diamMON": { n:"Центральные и вписанные углы: Центральный угол в равнобедренном △MON", line:16 },
    "oge-task16-circle|diamsPair": { n:"Центральные и вписанные углы: Диаметры AC и BD: ∠AOD ↔ ∠ACB", line:16 },
    "oge-task16-circle|mnDiam": { n:"Центральные и вписанные углы: Углы на одну дугу через диаметр", line:16 },
    "oge-task16-circle|diamTri": { n:"Центральные и вписанные углы: Сторона-диаметр: прямоугольный треугольник", line:16 },
    "oge-task16-circle|diamPif": { n:"Центральные и вписанные углы: Гипотенуза-диаметр и Пифагор", line:16 },
    "oge-task16-circle|cyclQuad": { n:"Центральные и вписанные углы: Вписанный четырёхугольник", line:16 },
    "oge-task16-circle|cyclTrap": { n:"Центральные и вписанные углы: Вписанная трапеция", line:16 },
    "oge-task16-circle|eqR2a": { n:"Описанная окружность: Равносторонний: сторона по радиусу описанной", line:16 },
    "oge-task16-circle|eqDist2a": { n:"Описанная окружность: Равносторонний: сторона по расстоянию до сторон", line:16 },
    "oge-task16-circle|sqR2a": { n:"Описанная окружность: Квадрат: сторона по радиусу описанной", line:16 },
    "oge-task16-circle|sinR": { n:"Описанная окружность: Радиус по стороне и противолежащему углу", line:16 },
    "oge-task16-circle|sqMidO": { n:"Описанная окружность: Квадрат и окружность из середины стороны", line:16 },
    "oge-task16-circle|rectDiag": { n:"Описанная окружность: Прямоугольник: площадь по синусу и диаметру", line:16 },
    "oge-task16-circle|rtHyp45": { n:"Вписанная окружность: Прямоугольный треугольник с углом 45°", line:16 },
    "oge-task16-circle|sqCircum": { n:"Вписанная окружность: Площадь квадрата вокруг окружности", line:16 },
    "oge-task16-circle|trapH": { n:"Вписанная окружность: Высота трапеции по радиусу вписанной", line:16 },
    "oge-task16-circle|Spr": { n:"Вписанная окружность: Площадь треугольника: S = p·r", line:16 },
    "oge-task16-circle|sqInD": { n:"Вписанная окружность: Диагональ квадрата по радиусу вписанной", line:16 },
    "oge-task16-circle|sqInR": { n:"Вписанная окружность: Радиус вписанной в квадрат", line:16 },
    "oge-task16-circle|eqA2r": { n:"Вписанная окружность: Равносторонний: радиус вписанной по стороне", line:16 },
    "oge-task16-circle|eqR2h": { n:"Вписанная окружность: Равносторонний: высота по радиусу вписанной", line:16 },
    "oge-task16-circle|eqR2aIn": { n:"Вписанная окружность: Равносторонний: сторона по радиусу вписанной", line:16 },
    "oge-task16-circle|tanQuad": { n:"Вписанная окружность: Описанный четырёхугольник", line:16 },
    "oge-task16-circle|tanTrap": { n:"Вписанная окружность: Описанная трапеция: четвёртая сторона", line:16 },
    "oge-task16-circle|rhombR": { n:"Вписанная окружность: Ромб: радиус вписанной окружности", line:16 },
    "oge-task16-circle|tanExt": { n:"Касательные, хорды, секущие: Касательная из внешней точки", line:16 },
    "oge-task16-circle|twoTan": { n:"Касательные, хорды, секущие: Две касательные из точки", line:16 },
    "oge-task16-circle|chordDist": { n:"Касательные, хорды, секущие: Хорда по расстоянию от центра", line:16 },
    "oge-task16-circle|secTan": { n:"Касательные, хорды, секущие: Касательная и секущая", line:16 },
    "oge-task16-circle|chordsX": { n:"Касательные, хорды, секущие: Пересекающиеся хорды", line:16 },
    "oge-task16-circle|tanChord": { n:"Касательные, хорды, секущие: Угол между касательной и хордой", line:16 },
    /* 17 · trainers/oge-task17-quadrilaterals.html · 38 типов (ключи тренажёра) */
    "oge17-chetyrehugolniki|sqDiag": { n:"Квадрат: Диагональ квадрата по стороне a√2", line:17 },
    "oge17-chetyrehugolniki|sqAreaSide": { n:"Квадрат: Площадь квадрата по стороне a√2", line:17 },
    "oge17-chetyrehugolniki|sqAreaPerim": { n:"Квадрат: Площадь квадрата по периметру", line:17 },
    "oge17-chetyrehugolniki|rectDiagAngle": { n:"Прямоугольник: Острый угол между диагоналями", line:17 },
    "oge17-chetyrehugolniki|rectDiagBO": { n:"Прямоугольник: Диагональ по её половине", line:17 },
    "oge17-chetyrehugolniki|rhombAngle": { n:"Ромб: Угол ромба по соседнему", line:17 },
    "oge17-chetyrehugolniki|rhombACD": { n:"Ромб: Угол между диагональю и стороной (∠ACD)", line:17 },
    "oge17-chetyrehugolniki|rhombHeight": { n:"Ромб: Высота ромба по стороне и углу", line:17 },
    "oge17-chetyrehugolniki|rhombAreaDiag": { n:"Ромб: Площадь ромба по диагоналям", line:17 },
    "oge17-chetyrehugolniki|rhombAreaPerim": { n:"Ромб: Площадь ромба по периметру и углу", line:17 },
    "oge17-chetyrehugolniki|rhombAreaDist": { n:"Ромб: Площадь по стороне и расстоянию от центра до неё", line:17 },
    "oge17-chetyrehugolniki|rhombPerpDiag": { n:"Ромб: Перпендикуляр из центра к стороне", line:17 },
    "oge17-chetyrehugolniki|rhombHeightBigDiag": { n:"Ромб: Угол между высотой и большей диагональю", line:17 },
    "oge17-chetyrehugolniki|rhombSideSmallDiag": { n:"Ромб: Угол между стороной и меньшей диагональю", line:17 },
    "oge17-chetyrehugolniki|rhombHeightSegments": { n:"Ромб: Высота из тупого угла делит сторону", line:17 },
    "oge17-chetyrehugolniki|parTrapDAEC": { n:"Параллелограмм: Площадь трапеции DAEC (E — середина AB)", line:17 },
    "oge17-chetyrehugolniki|parTriCBE": { n:"Параллелограмм: Площадь треугольника CBE (E — середина AB)", line:17 },
    "oge17-chetyrehugolniki|parDiagHalf": { n:"Параллелограмм: Половина диагонали параллелограмма", line:17 },
    "oge17-chetyrehugolniki|parHeights": { n:"Параллелограмм: Высоты параллелограмма по площади", line:17 },
    "oge17-chetyrehugolniki|parAngle": { n:"Параллелограмм: Угол параллелограмма по соседнему", line:17 },
    "oge17-chetyrehugolniki|parDiagAngles": { n:"Параллелограмм: Диагональ образует углы со сторонами", line:17 },
    "oge17-chetyrehugolniki|parBisector": { n:"Параллелограмм: Биссектриса угла A и сторона BC", line:17 },
    "oge17-chetyrehugolniki|trapMid": { n:"Трапеция: Средняя линия трапеции", line:17 },
    "oge17-chetyrehugolniki|trapArea": { n:"Трапеция: Площадь трапеции", line:17 },
    "oge17-chetyrehugolniki|trapIso": { n:"Трапеция: Угол равнобедренной трапеции по одному углу", line:17 },
    "oge17-chetyrehugolniki|trapSum": { n:"Трапеция: Сумма двух углов равнобедренной трапеции", line:17 },
    "oge17-chetyrehugolniki|trapRect": { n:"Трапеция: Угол прямоугольной трапеции", line:17 },
    "oge17-chetyrehugolniki|trapDiagAO": { n:"Трапеция: Диагонали трапеции и подобие", line:17 },
    "oge17-chetyrehugolniki|trapMidSeg": { n:"Трапеция: Диагональ делит среднюю линию", line:17 },
    "oge17-chetyrehugolniki|trapDiagFindC": { n:"Трапеция: Диагональ и два угла: найти угол трапеции", line:17 },
    "oge17-chetyrehugolniki|trapDiagBS": { n:"Трапеция: Диагональ и два угла: больший/меньший угол", line:17 },
    "oge17-chetyrehugolniki|trapCutBase": { n:"Трапеция: Высота делит большее основание", line:17 },
    "oge17-chetyrehugolniki|trapDiag45h": { n:"Трапеция: Диагональ под 45°: высота", line:17 },
    "oge17-chetyrehugolniki|trap45Base": { n:"Трапеция: Основание при угле 45° и высоте", line:17 },
    "oge17-chetyrehugolniki|trap45Area": { n:"Трапеция: Площадь трапеции с углом 45° по основаниям", line:17 },
    "oge17-chetyrehugolniki|trapBisector": { n:"Трапеция: Диагональ-биссектриса", line:17 },
    "oge17-chetyrehugolniki|trapDiagSmallBase": { n:"Трапеция: Угол диагонали с меньшим основанием", line:17 },
    "oge17-chetyrehugolniki|trapBDA": { n:"Трапеция: Диагональ BD и два угла при D", line:17 },
    /* 18 · trainers/oge-task18-grid.html · 15 типов (ключи тренажёра) */
    "oge18-kletki|dist": { n:"Длины: Расстояние между точками", line:18 },
    "oge18-kletki|midBC": { n:"Длины: Расстояние до середины отрезка", line:18 },
    "oge18-kletki|leg": { n:"Длины: Больший катет прямоугольного треугольника", line:18 },
    "oge18-kletki|rhombDiag": { n:"Длины: Большая диагональ ромба", line:18 },
    "oge18-kletki|midTri": { n:"Средние линии: Средняя линия треугольника", line:18 },
    "oge18-kletki|midTrap": { n:"Средние линии: Средняя линия трапеции", line:18 },
    "oge18-kletki|areaTri": { n:"Площади: Площадь треугольника", line:18 },
    "oge18-kletki|areaPar": { n:"Площади: Площадь параллелограмма", line:18 },
    "oge18-kletki|areaRhomb": { n:"Площади: Площадь ромба", line:18 },
    "oge18-kletki|areaTrap": { n:"Площади: Площадь трапеции", line:18 },
    "oge18-kletki|areaFig": { n:"Площади: Площадь фигуры по клеткам", line:18 },
    "oge18-kletki|tanA": { n:"Отношения: Тангенс угла", line:18 },
    "oge18-kletki|segAB": { n:"Отношения: Отрезок по данным чертежа (подобие)", line:18 },
    "oge18-kletki|segCmp": { n:"Отношения: Во сколько раз длиннее", line:18 },
    "oge18-kletki|circRatio": { n:"Отношения: Отношение площадей кругов", line:18 },
    /* 23 · trainers/oge-task23-geometry-calculations.html · 20 типов (ключи тренажёра) */
    "oge23-vychisleniya|rhombH": { n:"Четырёхугольники: Высота ромба", line:23 },
    "oge23-vychisleniya|pgramBis": { n:"Четырёхугольники: Периметр параллелограмма", line:23 },
    "oge23-vychisleniya|trapBis": { n:"Четырёхугольники: Боковая сторона трапеции", line:23 },
    "oge23-vychisleniya|trapLeg": { n:"Четырёхугольники: Боковая сторона (через углы)", line:23 },
    "oge23-vychisleniya|rhombAng": { n:"Четырёхугольники: Углы ромба", line:23 },
    "oge23-vychisleniya|trapEF": { n:"Четырёхугольники: Отрезок, параллельный основаниям", line:23 },
    "oge23-vychisleniya|circR": { n:"Треугольники: Сторона через описанную окружность", line:23 },
    "oge23-vychisleniya|hAB": { n:"Треугольники: Высота к гипотенузе (2 катета)", line:23 },
    "oge23-vychisleniya|hAC": { n:"Треугольники: Высота к гипотенузе (катет и гипотенуза)", line:23 },
    "oge23-vychisleniya|projAB": { n:"Треугольники: Катет через проекцию на гипотенузу", line:23 },
    "oge23-vychisleniya|paraBN": { n:"Треугольники: Подобие: отрезок при MN∥AC", line:23 },
    "oge23-vychisleniya|paraMC": { n:"Треугольники: Подобие: диагонали трапеции", line:23 },
    "oge23-vychisleniya|chordDist": { n:"Окружность: Расстояние от центра до хорды", line:23 },
    "oge23-vychisleniya|chordLen": { n:"Окружность: Длина хорды по расстоянию", line:23 },
    "oge23-vychisleniya|secKP1": { n:"Окружность: Секущие: окружность через B и C (дано AK)", line:23 },
    "oge23-vychisleniya|secKP2": { n:"Окружность: Секущие: окружность через B и C (дано AP)", line:23 },
    "oge23-vychisleniya|rectPK": { n:"Окружность: Прямоугольник в высоте (найти PK)", line:23 },
    "oge23-vychisleniya|rectBH": { n:"Окружность: Прямоугольник в высоте (найти BH)", line:23 },
    "oge23-vychisleniya|tanSecAC": { n:"Окружность: Касательная и секущая (найти AC)", line:23 },
    "oge23-vychisleniya|tanSecD": { n:"Окружность: Касательная и секущая (найти диаметр)", line:23 },
    /* 25 · trainers/oge-task25-geometry.html · 16 типов (ключи тренажёра) */
    "oge25-geometriya|1": { n:"Треугольник: Биссектриса и медиана: ⟂ и равны", line:25 },
    "oge25-geometriya|2": { n:"Параллелограмм: биссектрисы углов A и B", line:25 },
    "oge25-geometriya|3": { n:"Трапеция: биссектриса угла D через середину боковой", line:25 },
    "oge25-geometriya|4": { n:"Трапеция: отрезки, соединяющие середины сторон", line:25 },
    "oge25-geometriya|5": { n:"Четырёхугольник: середина стороны равноудалена от вершин", line:25 },
    "oge25-geometriya|6": { n:"Трапеция: Равнобедренная трапеция с вписанной окружностью", line:25 },
    "oge25-geometriya|7": { n:"Трапеция: Окружность, касающаяся боковой стороны трапеции", line:25 },
    "oge25-geometriya|8": { n:"Треугольник: Перпендикуляр к радиусу описанной окружности", line:25 },
    "oge25-geometriya|9": { n:"Треугольник: Полуокружность на стороне и ортоцентр", line:25 },
    "oge25-geometriya|10": { n:"Окружность: Две касающиеся окружности и общие касательные", line:25 },
    "oge25-geometriya|11": { n:"Четырёхугольник: Вписанный четырёхугольник и угол между диагоналями", line:25 },
    "oge25-geometriya|12": { n:"Окружность: Окружность через две точки стороны, касающаяся второй стороны", line:25 },
    "oge25-geometriya|13": { n:"Треугольник: Биссектриса, делящая высоту треугольника", line:25 },
    "oge25-geometriya|14": { n:"Трапеция: Окружность через вершины трапеции, касающаяся боковой стороны", line:25 },
    "oge25-geometriya|15": { n:"Параллелограмм: Площадь параллелограмма через инцентр треугольника", line:25 },
    "oge25-geometriya|16": { n:"Треугольник: Вписанная и вневписанная окружности равнобедренного треугольника", line:25 },
    /* 24 · trainers/oge-task24-proofs.html · 20 типов (ключи тренажёра) */
    "oge24-dokazatelstva|t1": { n:"Подобие: Подобие треугольников в трапеции", line:24 },
    "oge24-dokazatelstva|t10": { n:"Подобие: Продолжения сторон вписанного четырёхугольника", line:24 },
    "oge24-dokazatelstva|t13": { n:"Подобие: Две высоты тупоугольного треугольника", line:24 },
    "oge24-dokazatelstva|t15": { n:"Подобие: Внутренняя касательная двух окружностей", line:24 },
    "oge24-dokazatelstva|t2": { n:"Параллелограмм: Прямая через точку пересечения диагоналей", line:24 },
    "oge24-dokazatelstva|t3": { n:"Параллелограмм: Биссектрисы двух углов сходятся на стороне", line:24 },
    "oge24-dokazatelstva|t4": { n:"Параллелограмм: Середина стороны, вдвое большей соседней", line:24 },
    "oge24-dokazatelstva|t5": { n:"Параллелограмм: Точка, равноудалённая от трёх прямых", line:24 },
    "oge24-dokazatelstva|t7": { n:"Площади: Точка внутри параллелограмма", line:24 },
    "oge24-dokazatelstva|t6": { n:"Площади: Точка на средней линии трапеции", line:24 },
    "oge24-dokazatelstva|t8": { n:"Площади: Середина боковой стороны трапеции", line:24 },
    "oge24-dokazatelstva|t9": { n:"Площади: Треугольники при диагоналях трапеции", line:24 },
    "oge24-dokazatelstva|t12": { n:"Окружность: Две высоты остроугольного треугольника", line:24 },
    "oge24-dokazatelstva|t11": { n:"Окружность: Равные углы в выпуклом четырёхугольнике", line:24 },
    "oge24-dokazatelstva|t14": { n:"Окружность: Линия центров и общая хорда", line:24 },
    "oge24-dokazatelstva|t16": { n:"Правильные многоугольники: Равносторонний треугольник в шестиугольнике", line:24 },
    "oge24-dokazatelstva|t17": { n:"Правильные многоугольники: Большая диагональ вдвое больше стороны", line:24 },
    "oge24-dokazatelstva|t18": { n:"Правильные многоугольники: Прямоугольник на диагоналях шестиугольника", line:24 },
    "oge24-dokazatelstva|t19": { n:"Правильные многоугольники: Прямоугольный треугольник в шестиугольнике", line:24 },
    "oge24-dokazatelstva|t20": { n:"Правильные многоугольники: Диагональ, перпендикулярная стороне", line:24 },
    /* 20 · trainers/oge-task20-equations.html · 13 типов (ключи тренажёра) */
    "oge-t20-algebra|A": { n:"№20.1: Значение выражения", line:20 },
    "oge-t20-algebra|B1": { n:"№20.2: Кубическое: группировка", line:20 },
    "oge-t20-algebra|B2": { n:"№20.3: Уравнение с корнем", line:20 },
    "oge-t20-algebra|RAZL": { n:"№20.4: Разложение на множители", line:20 },
    "oge-t20-algebra|B5": { n:"№20.5: Дробно-рациональные", line:20 },
    "oge-t20-algebra|BIQ": { n:"№20.6: Замена переменной", line:20 },
    "oge-t20-algebra|SQ": { n:"№20.7: Равенство квадратов", line:20 },
    "oge-t20-algebra|POW": { n:"№20.8: Дробь со степенями", line:20 },
    "oge-t20-algebra|SYS": { n:"№20.9: Системы уравнений", line:20 },
    "oge-t20-algebra|INEQ": { n:"№20.10: Неравенства", line:20 },
    "oge-t20-algebra|DR": { n:"№20.11: Дробное неравенство", line:20 },
    "oge-t20-algebra|QIDS": { n:"№20.12: Квадратные неравенства", line:20 },
    "oge-t20-algebra|SYM": { n:"№20.13: Симметричные системы", line:20 },
    /* 21 · trainers/oge-task21-word-problems.html · 11 типов (ключи тренажёра) */
    "oge-t21-tekst|t1": { n:"Движение: Навстречу", line:21 },
    "oge-t21-tekst|t2": { n:"Движение: Туда и обратно", line:21 },
    "oge-t21-tekst|t3": { n:"Движение: Пробег", line:21 },
    "oge-t21-tekst|t4": { n:"Движение: Две половины", line:21 },
    "oge-t21-tekst|t5": { n:"Движение: По кругу", line:21 },
    "oge-t21-tekst|t6": { n:"Движение: По реке", line:21 },
    "oge-t21-tekst|t7": { n:"Движение: Длина поезда", line:21 },
    "oge-t21-tekst|t8": { n:"Движение: Средняя скорость", line:21 },
    "oge-t21-tekst|t9": { n:"Работа", line:21 },
    "oge-t21-tekst|t10": { n:"Проценты: Сушка фруктов", line:21 },
    "oge-t21-tekst|t11": { n:"Проценты: Сплавы и смеси", line:21 },
    /* 22 · trainers/oge-task22-functions-graphs.html · 9 типов (ключи тренажёра) */
    "oge-t22-grafiki|parline": { n:"Кусочные функции: Парабола и прямая", line:22 },
    "oge-t22-grafiki|parhyp": { n:"Кусочные функции: Парабола и гипербола", line:22 },
    "oge-t22-grafiki|absquad": { n:"Модуль: Модуль квадратного трёхчлена", line:22 },
    "oge-t22-grafiki|xabsx": { n:"Модуль: x·|x| и слагаемые с модулем", line:22 },
    "oge-t22-grafiki|sqminuslin": { n:"Модуль: Квадрат минус модуль линейной", line:22 },
    "oge-t22-grafiki|alinplusquad": { n:"Модуль: Модуль линейной плюс парабола", line:22 },
    "oge-t22-grafiki|inv_kx": { n:"Выколотая точка: Гипербола с выколотой точкой", line:22 },
    "oge-t22-grafiki|shift_m": { n:"Выколотая точка: Сдвиг и выколотая точка", line:22 },
    "oge-t22-grafiki|parab_kx": { n:"Выколотая точка: Парабола с выколотой точкой", line:22 },
    /* 12 · trainers/oge-task12-formulas-trainer.html · 10 типов (ключи тренажёра) */
    "oge-t12-formuly|1": { n:"Расчёты по формулам: Прямая подстановка", line:12 },
    "oge-t12-formuly|2": { n:"Расчёты по формулам: Выразить неизвестную", line:12 },
    "oge-t12-formuly|3": { n:"Расчёты по формулам: Сумма и произведение", line:12 },
    "oge-t12-formuly|4": { n:"Расчёты по формулам: Формула с дробью", line:12 },
    "oge-t12-formuly|5": { n:"Расчёты по формулам: Квадрат и степень", line:12 },
    "oge-t12-formuly|6": { n:"Расчёты по формулам: Корень", line:12 },
    "oge-t12-formuly|7": { n:"Расчёты по формулам: Десятичные дроби", line:12 },
    "oge-t12-formuly|8": { n:"Расчёты по формулам: Отрицательные числа", line:12 },
    "oge-t12-formuly|9": { n:"Расчёты по формулам: Большие числа", line:12 },
    "oge-t12-formuly|10": { n:"Расчёты по формулам: Внимание к условию", line:12 },
    /* 14 · trainers/oge-task14-progressions.html · 9 типов (ключи тренажёра) */
    "oge-t14-progressii|AP-VAL": { n:"Арифметическая: Значение на n-м шаге", line:14 },
    "oge-t14-progressii|AP-SUM": { n:"Арифметическая: Сумма первых n шагов", line:14 },
    "oge-t14-progressii|AP-2PT": { n:"Арифметическая: Прибавка по двум известным шагам", line:14 },
    "oge-t14-progressii|AP-SUM2DAY": { n:"Арифметическая: Известна вся сумма: найти нужный день", line:14 },
    "oge-t14-progressii|GP-VAL": { n:"Геометрическая: Умножаем или делим каждые N минут", line:14 },
    "oge-t14-progressii|GP-COMPL": { n:"Геометрическая: Осталось и образовалось", line:14 },
    "oge-t14-progressii|THRESH": { n:"Сюжетные: Сколько шагов до условия", line:14 },
    "oge-t14-progressii|PIC": { n:"Сюжетные: Задача с рисунком", line:14 },
    "oge-t14-progressii|TAXI": { n:"Сюжетные: Старт плюс плата за минуту", line:14 },
    /* 10 · trainers/oge-task10-probability.html · 7 типов (ключи тренажёра) */
    "oge-t10-veroyatnost|10_1": { n:"Вероятность: Равновозможные исходы", line:10 },
    "oge-t10-veroyatnost|10_2": { n:"Вероятность: Один выбор предмета", line:10 },
    "oge-t10-veroyatnost|10_3": { n:"Вероятность: Без возвращения", line:10 },
    "oge-t10-veroyatnost|10_4": { n:"Вероятность: Монета и частоты", line:10 },
    "oge-t10-veroyatnost|10_5": { n:"Вероятность: Две кости", line:10 },
    "oge-t10-veroyatnost|10_6": { n:"Вероятность: Дерево вероятностей", line:10 },
    "oge-t10-veroyatnost|10_7": { n:"Вероятность: Диаграмма Эйлера", line:10 },
    /* 8 · trainers/oge-task8-powers-roots.html · 10 типов (ключи тренажёра) */
    "oge-t8-stepeni|rootdeg": { n:"Степени и корни: Корень из степени", line:8 },
    "oge-t8-stepeni|letters": { n:"Степени и корни: Корни с буквами", line:8 },
    "oge-t8-stepeni|sqroot": { n:"Степени и корни: Квадрат бьёт корень", line:8 },
    "oge-t8-stepeni|prod": { n:"Степени и корни: Произведение корней", line:8 },
    "oge-t8-stepeni|dsq": { n:"Степени и корни: Разность квадратов", line:8 },
    "oge-t8-stepeni|sqsum": { n:"Степени и корни: Квадрат суммы", line:8 },
    "oge-t8-stepeni|fold": { n:"Степени и корни: Свернуть в квадрат", line:8 },
    "oge-t8-stepeni|pow1": { n:"Степени и корни: Степени: одно основание", line:8 },
    "oge-t8-stepeni|pow2": { n:"Степени и корни: Степени: два основания", line:8 },
    "oge-t8-stepeni|sci": { n:"Степени и корни: Стандартный вид числа", line:8 },
    /* 9 · trainers/oge-task9-equations.html · 16 типов (ключи тренажёра) */
    "oge-t9-uravneniya|L": { n:"Линейные: Линейное: перенос слагаемых", line:9 },
    "oge-t9-uravneniya|LB": { n:"Линейные: Линейное со скобками", line:9 },
    "oge-t9-uravneniya|LF": { n:"Линейные: Линейное с дробями", line:9 },
    "oge-t9-uravneniya|LSQ": { n:"Линейные: Сводится к линейному через квадраты", line:9 },
    "oge-t9-uravneniya|QNB": { n:"Квадратные: Неполное квадратное: без b", line:9 },
    "oge-t9-uravneniya|QNC": { n:"Квадратные: Неполное квадратное: без c", line:9 },
    "oge-t9-uravneniya|QNCm": { n:"Квадратные: Неполное квадратное: x² = kx", line:9 },
    "oge-t9-uravneniya|QF": { n:"Квадратные: Полное квадратное: дискриминант", line:9 },
    "oge-t9-uravneniya|QR": { n:"Квадратные: Квадратное: корни по Виету", line:9 },
    "oge-t9-uravneniya|QP": { n:"Квадратные: Квадратное с произведением скобок", line:9 },
    "oge-t9-uravneniya|PROP": { n:"Дробно-рациональные: Пропорция", line:9 },
    "oge-t9-uravneniya|Z": { n:"Дробно-рациональные: Дробь равна нулю", line:9 },
    "oge-t9-uravneniya|NZ": { n:"Дробно-рациональные: Дробь равна числу", line:9 },
    "oge-t9-uravneniya|XF": { n:"Дробно-рациональные: Неизвестная в знаменателе", line:9 },
    "oge-t9-uravneniya|S2": { n:"Дробно-рациональные: Две дроби равны", line:9 },
    "oge-t9-uravneniya|SB": { n:"Дробно-рациональные: Дроби со скобками", line:9 },
    /* 7 · trainers/oge-task7-number-line.html · 12 типов (ключи тренажёра) */
    "oge-t7-pryamaya|ris/one": { n:"По рисунку: утверждения: одно число", line:7 },
    "oge-t7-pryamaya|ris/two": { n:"По рисунку: утверждения: два числа", line:7 },
    "oge-t7-pryamaya|ris/diff": { n:"По рисунку: утверждения: разности", line:7 },
    "oge-t7-pryamaya|ris/abs": { n:"По рисунку: утверждения: модули", line:7 },
    "oge-t7-pryamaya|frac/betint": { n:"Оценка: дроби: между целыми", line:7 },
    "oge-t7-pryamaya|frac/tenths": { n:"Оценка: дроби: до десятых", line:7 },
    "oge-t7-pryamaya|frac/inrange": { n:"Оценка: дроби: какая из дробей в отрезке", line:7 },
    "oge-t7-pryamaya|root/betint": { n:"Оценка: корни: между целыми", line:7 },
    "oge-t7-pryamaya|root/inrange": { n:"Оценка: корни: какой из корней в отрезке", line:7 },
    "oge-t7-pryamaya|pts/root": { n:"Точки и числа: корень", line:7 },
    "oge-t7-pryamaya|pts/frac": { n:"Точки и числа: дробь", line:7 },
    "oge-t7-pryamaya|pts/dec": { n:"Точки и числа: десятичные", line:7 },
    /* 11 · trainers/oge-task11-graphs-trainer.html · 5 типов (ключи тренажёра) */
    "oge-t11-grafiki|t41": { n:"Соответствие график — формула: Знаки a и c", line:11 },
    "oge-t11-grafiki|t42": { n:"Соответствие график — формула: Формулы парабол", line:11 },
    "oge-t11-grafiki|t43": { n:"Соответствие график — формула: Прямые", line:11 },
    "oge-t11-grafiki|t44": { n:"Соответствие график — формула: Гиперболы", line:11 },
    "oge-t11-grafiki|t45": { n:"Соответствие график — формула: Смешанные", line:11 },
    /* 6 · planned: типы из спецификации задачи, уточняются при реализации */
    "oge-t6-vychisleniya|dec_add": { n:"Десятичные: сложение и вычитание", line:6 },
    "oge-t6-vychisleniya|dec_mul": { n:"Десятичные: умножение", line:6 },
    "oge-t6-vychisleniya|dec_div": { n:"Десятичные: деление на десятичную", line:6 },
    "oge-t6-vychisleniya|frac_add": { n:"Обыкновенные: разные знаменатели", line:6 },
    "oge-t6-vychisleniya|frac_mul": { n:"Обыкновенные: умножение и сокращение", line:6 },
    "oge-t6-vychisleniya|frac_div": { n:"Обыкновенные: деление", line:6 },
    "oge-t6-vychisleniya|mixed": { n:"Смешанные числа", line:6 },
    "oge-t6-vychisleniya|dec_frac": { n:"Десятичная и обыкновенная вместе", line:6 },
    "oge-t6-vychisleniya|pow10": { n:"Степень десяти", line:6 },
    "oge-t6-vychisleniya|order": { n:"Скобки и порядок действий", line:6 },
    "oge-t6-vychisleniya|stack": { n:"Дробь-«этажерка»", line:6 },
    /* 13 · planned: типы из спецификации задачи, уточняются при реализации */
    "oge-t13-neravenstva|lin": { n:"Линейное: перенос слагаемых", line:13 },
    "oge-t13-neravenstva|lin_br": { n:"Линейное со скобками", line:13 },
    "oge-t13-neravenstva|lin_neg": { n:"Деление на отрицательное: смена знака", line:13 },
    "oge-t13-neravenstva|lin_frac": { n:"Линейное с дробями", line:13 },
    "oge-t13-neravenstva|quad2": { n:"Квадратное с двумя корнями", line:13 },
    "oge-t13-neravenstva|quad_vieta": { n:"Квадратное: корни по Виету", line:13 },
    "oge-t13-neravenstva|quad_inc": { n:"Неполное квадратное x² − a", line:13 },
    "oge-t13-neravenstva|none_any": { n:"Нет решений / любое число", line:13 },
    "oge-t13-neravenstva|sys": { n:"Система двух линейных", line:13 },
    "oge-t13-neravenstva|sys_none": { n:"Система без решений", line:13 },
    "oge-t13-neravenstva|by_pic": { n:"По рисунку: какое неравенство", line:13 },
    "oge-t13-neravenstva|prod": { n:"Произведение скобок", line:13 },
    /* 15 · planned: типы из спецификации задачи, уточняются при реализации */
    "oge-t15-treugolniki|angSum": { n:"Сумма углов треугольника", line:15 },
    "oge-t15-treugolniki|extAng": { n:"Внешний угол", line:15 },
    "oge-t15-treugolniki|isoBase": { n:"Равнобедренный: угол при основании", line:15 },
    "oge-t15-treugolniki|isoApex": { n:"Равнобедренный: угол при вершине", line:15 },
    "oge-t15-treugolniki|bisIso": { n:"Биссектриса и равнобедренный треугольник", line:15 },
    "oge-t15-treugolniki|bisExt": { n:"Биссектриса и внешний угол", line:15 },
    "oge-t15-treugolniki|twoExt": { n:"Два внешних угла", line:15 },
    "oge-t15-treugolniki|bisAlt": { n:"Угол между биссектрисой и высотой", line:15 },
    "oge-t15-treugolniki|altAlt": { n:"Угол между высотами", line:15 },
    "oge-t15-treugolniki|rtAcute": { n:"Прямоугольный: острые углы", line:15 },
    "oge-t15-treugolniki|rtLegSin": { n:"Катет через синус", line:15 },
    "oge-t15-treugolniki|rtLegCos": { n:"Катет через косинус", line:15 },
    "oge-t15-treugolniki|rtLegTan": { n:"Катет через тангенс", line:15 },
    "oge-t15-treugolniki|rtTrig": { n:"sin, cos, tg по сторонам", line:15 },
    "oge-t15-treugolniki|pythLeg": { n:"Пифагор: катет", line:15 },
    "oge-t15-treugolniki|pythHyp": { n:"Пифагор: гипотенуза", line:15 },
    "oge-t15-treugolniki|rtAltitude": { n:"Высота из прямого угла", line:15 },
    "oge-t15-treugolniki|areaBH": { n:"Площадь по основанию и высоте", line:15 },
    "oge-t15-treugolniki|areaSin": { n:"Площадь по двум сторонам и углу", line:15 },
    "oge-t15-treugolniki|midline": { n:"Средняя линия", line:15 },
    "oge-t15-treugolniki|medianRt": { n:"Медиана к гипотенузе", line:15 },
    "oge-t15-treugolniki|regR": { n:"Правильный: радиус описанной", line:15 },
    "oge-t15-treugolniki|regr": { n:"Правильный: радиус вписанной", line:15 },
    "oge-t15-treugolniki|regArea": { n:"Правильный: площадь", line:15 },
    "oge-t15-treugolniki|regH": { n:"Правильный: высота", line:15 },
    "oge-t15-treugolniki|isoLeg": { n:"Равнобедренный: боковая сторона", line:15 },
    /* 19 · planned: типы из спецификации задачи, уточняются при реализации */
    "oge-t19-utverzhdeniya|tri": { n:"Треугольники", line:19 },
    "oge-t19-utverzhdeniya|quad": { n:"Четырёхугольники", line:19 },
    "oge-t19-utverzhdeniya|circle": { n:"Окружность", line:19 },
    "oge-t19-utverzhdeniya|area": { n:"Площади и длины", line:19 },
    "oge-t19-utverzhdeniya|general": { n:"Общие свойства фигур", line:19 },
    /* 1–5 · сюжеты: тип = номер вопроса сюжета */
    "practiceRoadsGridTrainer|q1": { n:"Дороги по клеткам: вопрос 1", line:1 },
    "practiceRoadsGridTrainer|q2": { n:"Дороги по клеткам: вопрос 2", line:1 },
    "practiceRoadsGridTrainer|q3": { n:"Дороги по клеткам: вопрос 3", line:1 },
    "practiceRoadsGridTrainer|q4": { n:"Дороги по клеткам: вопрос 4", line:1 },
    "practiceRoadsGridTrainer|q5": { n:"Дороги по клеткам: вопрос 5", line:1 },
    "practiceRoadsSchemaTrainer|q1": { n:"Дороги без клеток: вопрос 1", line:1 },
    "practiceRoadsSchemaTrainer|q2": { n:"Дороги без клеток: вопрос 2", line:1 },
    "practiceRoadsSchemaTrainer|q3": { n:"Дороги без клеток: вопрос 3", line:1 },
    "practiceRoadsSchemaTrainer|q4": { n:"Дороги без клеток: вопрос 4", line:1 },
    "practiceRoadsSchemaTrainer|q5": { n:"Дороги без клеток: вопрос 5", line:1 },
    "practiceTiresTrainer|q1": { n:"Шины: вопрос 1", line:1 },
    "practiceTiresTrainer|q2": { n:"Шины: вопрос 2", line:1 },
    "practiceTiresTrainer|q3": { n:"Шины: вопрос 3", line:1 },
    "practiceTiresTrainer|q4": { n:"Шины: вопрос 4", line:1 },
    "practiceTiresTrainer|q5": { n:"Шины: вопрос 5", line:1 },
    "practiceStovesTrainer|q1": { n:"Печки: вопрос 1", line:1 },
    "practiceStovesTrainer|q2": { n:"Печки: вопрос 2", line:1 },
    "practiceStovesTrainer|q3": { n:"Печки: вопрос 3", line:1 },
    "practiceStovesTrainer|q4": { n:"Печки: вопрос 4", line:1 },
    "practiceStovesTrainer|q5": { n:"Печки: вопрос 5", line:1 },
    "practiceLandPlotsTrainer|q1": { n:"Участки: вопрос 1", line:1 },
    "practiceLandPlotsTrainer|q2": { n:"Участки: вопрос 2", line:1 },
    "practiceLandPlotsTrainer|q3": { n:"Участки: вопрос 3", line:1 },
    "practiceLandPlotsTrainer|q4": { n:"Участки: вопрос 4", line:1 },
    "practiceLandPlotsTrainer|q5": { n:"Участки: вопрос 5", line:1 },
    "practiceApartmentsTrainer|q1": { n:"Квартиры: вопрос 1", line:1 },
    "practiceApartmentsTrainer|q2": { n:"Квартиры: вопрос 2", line:1 },
    "practiceApartmentsTrainer|q3": { n:"Квартиры: вопрос 3", line:1 },
    "practiceApartmentsTrainer|q4": { n:"Квартиры: вопрос 4", line:1 },
    "practiceApartmentsTrainer|q5": { n:"Квартиры: вопрос 5", line:1 },
    "practiceTariffsTrainer|q1": { n:"Тарифы: вопрос 1", line:1 },
    "practiceTariffsTrainer|q2": { n:"Тарифы: вопрос 2", line:1 },
    "practiceTariffsTrainer|q3": { n:"Тарифы: вопрос 3", line:1 },
    "practiceTariffsTrainer|q4": { n:"Тарифы: вопрос 4", line:1 },
    "practiceTariffsTrainer|q5": { n:"Тарифы: вопрос 5", line:1 },
    "practicePaperSheetsTrainer|q1": { n:"Листы: вопрос 1", line:1 },
    "practicePaperSheetsTrainer|q2": { n:"Листы: вопрос 2", line:1 },
    "practicePaperSheetsTrainer|q3": { n:"Листы: вопрос 3", line:1 },
    "practicePaperSheetsTrainer|q4": { n:"Листы: вопрос 4", line:1 },
    "practicePaperSheetsTrainer|q5": { n:"Листы: вопрос 5", line:1 }
  };

  var TYPES = {
    "oge-task16-circle": ["insCen","twoDiam","diamMON","diamsPair","mnDiam","diamTri","diamPif","cyclQuad","cyclTrap","eqR2a","eqDist2a","sqR2a","sinR","sqMidO","rectDiag","rtHyp45","sqCircum","trapH","Spr","sqInD","sqInR","eqA2r","eqR2h","eqR2aIn","tanQuad","tanTrap","rhombR","tanExt","twoTan","chordDist","secTan","chordsX","tanChord"],
    "oge17-chetyrehugolniki": ["sqDiag","sqAreaSide","sqAreaPerim","rectDiagAngle","rectDiagBO","rhombAngle","rhombACD","rhombHeight","rhombAreaDiag","rhombAreaPerim","rhombAreaDist","rhombPerpDiag","rhombHeightBigDiag","rhombSideSmallDiag","rhombHeightSegments","parTrapDAEC","parTriCBE","parDiagHalf","parHeights","parAngle","parDiagAngles","parBisector","trapMid","trapArea","trapIso","trapSum","trapRect","trapDiagAO","trapMidSeg","trapDiagFindC","trapDiagBS","trapCutBase","trapDiag45h","trap45Base","trap45Area","trapBisector","trapDiagSmallBase","trapBDA"],
    "oge18-kletki": ["dist","midBC","leg","rhombDiag","midTri","midTrap","areaTri","areaPar","areaRhomb","areaTrap","areaFig","tanA","segAB","segCmp","circRatio"],
    "oge23-vychisleniya": ["rhombH","pgramBis","trapBis","trapLeg","rhombAng","trapEF","circR","hAB","hAC","projAB","paraBN","paraMC","chordDist","chordLen","secKP1","secKP2","rectPK","rectBH","tanSecAC","tanSecD"],
    "oge25-geometriya": ["1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16"],
    "oge24-dokazatelstva": ["t1","t10","t13","t15","t2","t3","t4","t5","t7","t6","t8","t9","t12","t11","t14","t16","t17","t18","t19","t20"],
    "oge-t20-algebra": ["A","B1","B2","RAZL","B5","BIQ","SQ","POW","SYS","INEQ","DR","QIDS","SYM"],
    "oge-t21-tekst": ["t1","t2","t3","t4","t5","t6","t7","t8","t9","t10","t11"],
    "oge-t22-grafiki": ["parline","parhyp","absquad","xabsx","sqminuslin","alinplusquad","inv_kx","shift_m","parab_kx"],
    "oge-t12-formuly": ["1","2","3","4","5","6","7","8","9","10"],
    "oge-t14-progressii": ["AP-VAL","AP-SUM","AP-2PT","AP-SUM2DAY","GP-VAL","GP-COMPL","THRESH","PIC","TAXI"],
    "oge-t10-veroyatnost": ["10_1","10_2","10_3","10_4","10_5","10_6","10_7"],
    "oge-t8-stepeni": ["rootdeg","letters","sqroot","prod","dsq","sqsum","fold","pow1","pow2","sci"],
    "oge-t9-uravneniya": ["L","LB","LF","LSQ","QNB","QNC","QNCm","QF","QR","QP","PROP","Z","NZ","XF","S2","SB"],
    "oge-t7-pryamaya": ["ris/one","ris/two","ris/diff","ris/abs","frac/betint","frac/tenths","frac/inrange","root/betint","root/inrange","pts/root","pts/frac","pts/dec"],
    "oge-t11-grafiki": ["t41","t42","t43","t44","t45"],
    "oge-t6-vychisleniya": ["dec_add","dec_mul","dec_div","frac_add","frac_mul","frac_div","mixed","dec_frac","pow10","order","stack"],
    "oge-t13-neravenstva": ["lin","lin_br","lin_neg","lin_frac","quad2","quad_vieta","quad_inc","none_any","sys","sys_none","by_pic","prod"],
    "oge-t15-treugolniki": ["angSum","extAng","isoBase","isoApex","bisIso","bisExt","twoExt","bisAlt","altAlt","rtAcute","rtLegSin","rtLegCos","rtLegTan","rtTrig","pythLeg","pythHyp","rtAltitude","areaBH","areaSin","midline","medianRt","regR","regr","regArea","regH","isoLeg"],
    "oge-t19-utverzhdeniya": ["tri","quad","circle","area","general"],
    "practiceRoadsGridTrainer": ["q1","q2","q3","q4","q5"],
    "practiceRoadsSchemaTrainer": ["q1","q2","q3","q4","q5"],
    "practiceTiresTrainer": ["q1","q2","q3","q4","q5"],
    "practiceStovesTrainer": ["q1","q2","q3","q4","q5"],
    "practiceLandPlotsTrainer": ["q1","q2","q3","q4","q5"],
    "practiceApartmentsTrainer": ["q1","q2","q3","q4","q5"],
    "practiceTariffsTrainer": ["q1","q2","q3","q4","q5"],
    "practicePaperSheetsTrainer": ["q1","q2","q3","q4","q5"]
  };

  /* Линии навигатора: 1–5 — одна группа сюжетов. */
  var LINES = {
    "1-5": ["practiceEntryDiagnostic2026","percentTableTrainer","practiceRoadsGridTrainer","practiceRoadsSchemaTrainer","practiceTiresTrainer","practiceStovesTrainer","practiceLandPlotsTrainer","practiceApartmentsTrainer","practiceTariffsTrainer","practicePaperSheetsTrainer","practicePlanReadingTrainer","practiceRoutesCheckpoint2026"],
    "6": ["oge-t6-vychisleniya"],
    "7": ["oge-t7-pryamaya"],
    "8": ["oge-t8-stepeni"],
    "9": ["oge-t9-uravneniya"],
    "10": ["oge-t10-veroyatnost"],
    "11": ["oge-t11-grafiki"],
    "12": ["oge-t12-formuly"],
    "13": ["oge-t13-neravenstva"],
    "14": ["oge-t14-progressii"],
    "15": ["oge-t15-treugolniki"],
    "16": ["oge-task16-circle"],
    "17": ["oge17-chetyrehugolniki"],
    "18": ["oge18-kletki"],
    "19": ["oge-t19-utverzhdeniya"],
    "20": ["oge-t20-algebra"],
    "21": ["oge-t21-tekst"],
    "22": ["oge-t22-grafiki"],
    "23": ["oge23-vychisleniya"],
    "24": ["oge24-dokazatelstva"],
    "25": ["oge25-geometriya"]
  };

  /* ---------- недоверенные данные ----------
     Журнал приходит из localStorage или из кода прогресса ученика (MEP1).
     Всё, что из него попадает в innerHTML или в атрибут, — имя типа, TID,
     числа, имя ученика — проходит через esc(). Запись-мусор пропускается,
     а не роняет страницу и не выводит NaN. */
  var hasOwn = Object.prototype.hasOwnProperty;
  function own(o, k){ return !!o && hasOwn.call(o, k); }
  function isObj(o){ return !!o && typeof o === "object" && !Array.isArray(o); }
  function esc(s){
    return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){
      return c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&#39;";
    });
  }
  var MAX_TS = 8.64e15;
  function count(v){ return typeof v === "number" && isFinite(v) && v >= 0; }
  function stamp(v){ return v === undefined || (count(v) && v <= MAX_TS); }
  /* Запись журнала { w, r, lastWrong, last }: объект; w — число ≥ 0;
     r, lastWrong, last — числа ≥ 0 или их нет. Возвращает нормализованную
     копию (w и r — целые) или null, если запись — мусор.
     То же правило (вместе с keyOk) повторено в адаптере review в
     progress-adapters.js; совпадение сторон сверяет tests/cabinet-safety-test.js. */
  function entry(e){
    if (!isObj(e) || !count(e.w)) return null;
    if (e.r !== undefined && !count(e.r)) return null;
    if (!stamp(e.lastWrong) || !stamp(e.last)) return null;
    return { w:Math.floor(e.w), r:Math.floor(e.r || 0),
             lastWrong:e.lastWrong || 0, last:e.last || 0 };
  }
  function keyOk(k){ var i = k.indexOf("|"); return i > 0 && i < k.length - 1; }
  function split(key){
    var i = key.indexOf("|");
    return [key.slice(0, i), key.slice(i + 1)];
  }
  function items(mk, wantOpen){
    var res = [], k, e;
    if (!isObj(mk)) return res;
    for (k in mk){
      if (!own(mk, k) || !keyOk(k)) continue;
      e = entry(mk[k]);
      if (!e || e.w <= 0) continue;
      var closed = e.r >= 3;
      if (closed === !wantOpen){
        var p = split(k);
        res.push({ key:k, tid:p[0], type:p[1], w:e.w, r:e.r,
                   last:e.lastWrong || e.last || 0 });
      }
    }
    res.sort(function(a, b){ return b.last - a.last; });
    return res;
  }
  function open(mk){ return items(mk, true); }
  function closed(mk){ return items(mk, false); }
  function nameOf(key){ return own(NAMES, key) ? NAMES[key] : null; }
  function trainerOf(tid){ return own(TRAINERS, tid) ? TRAINERS[tid] : null; }
  function typesOf(tid){ return own(TYPES, tid) ? TYPES[tid].slice() : []; }

  /* «Загрузить в этот браузер»: копия прогресса, из журнала которой убраны
     записи-мусор (и ключи не вида «TID|тип»). Ветка mistakes, которая не
     объект, отбрасывается целиком. Всё остальное — как было, в том числе
     записи курса ЕГЭ: код прогресса один на оба курса. */
  function cleanJournal(obj){
    var out = JSON.parse(JSON.stringify(obj)), mk, k, dropped = 0, branch = false;
    if (own(out, "mistakes")){
      mk = out.mistakes;
      if (!isObj(mk)){ delete out.mistakes; branch = true; }
      else for (k in mk){
        if (own(mk, k) && !(keyOk(k) && entry(mk[k]))){ delete mk[k]; dropped++; }
      }
    }
    return { obj:out, dropped:dropped, branch:branch };
  }

  /* Кабинет учителя: строка на линию. adapter — ключ в PROGRESS.adapters. */
  var CABINET = [
    { tid:"plots", adapter:"plots", title:"Практические задачи 1–5", file:"../trainers/oge-1-5-trainers/practice-1-5-map.html", line:1 },
    { tid:"oge-t6-vychisleniya", adapter:"line", title:"Вычисления: дроби и десятичные", file:"../trainers/oge-task6-fractions.html", line:6 },
    { tid:"oge-t7-pryamaya", adapter:"line", title:"Координатная прямая", file:"../trainers/oge-task7-number-line.html", line:7 },
    { tid:"oge-t8-stepeni", adapter:"line", title:"Степени и корни", file:"../trainers/oge-task8-powers-roots.html", line:8 },
    { tid:"oge-t9-uravneniya", adapter:"line", title:"Уравнения", file:"../trainers/oge-task9-equations.html", line:9 },
    { tid:"oge-t10-veroyatnost", adapter:"line", title:"Вероятность", file:"../trainers/oge-task10-probability.html", line:10 },
    { tid:"oge-t11-grafiki", adapter:"line", title:"Графики функций", file:"../trainers/oge-task11-graphs-trainer.html", line:11 },
    { tid:"oge-t12-formuly", adapter:"line", title:"Расчёты по формулам", file:"../trainers/oge-task12-formulas-trainer.html", line:12 },
    { tid:"oge-t13-neravenstva", adapter:"line", title:"Неравенства", file:"../trainers/oge-task13-inequalities.html", line:13 },
    { tid:"oge-t14-progressii", adapter:"line", title:"Прогрессии", file:"../trainers/oge-task14-progressions.html", line:14 },
    { tid:"oge-t15-treugolniki", adapter:"line", title:"Треугольники", file:"../trainers/oge-task15-triangles.html", line:15 },
    { tid:"oge-task16-circle", adapter:"line", title:"Окружность", file:"../trainers/oge-task16-circle.html", line:16 },
    { tid:"oge17-chetyrehugolniki", adapter:"line", title:"Четырёхугольники", file:"../trainers/oge-task17-quadrilaterals.html", line:17 },
    { tid:"oge18-kletki", adapter:"line", title:"Клетчатая бумага", file:"../trainers/oge-task18-grid.html", line:18 },
    { tid:"oge-t19-utverzhdeniya", adapter:"line", title:"Утверждения", file:"../trainers/task19-trainer.html", line:19 },
    { tid:"oge-t20-algebra", adapter:"line", title:"Алгебра, часть 2", file:"../trainers/oge-task20-equations.html", line:20 },
    { tid:"oge-t21-tekst", adapter:"line", title:"Текстовые задачи", file:"../trainers/oge-task21-word-problems.html", line:21 },
    { tid:"oge-t22-grafiki", adapter:"line", title:"Графики функций, часть 2", file:"../trainers/oge-task22-functions-graphs.html", line:22 },
    { tid:"oge23-vychisleniya", adapter:"line", title:"Геометрия: вычисление", file:"../trainers/oge-task23-geometry-calculations.html", line:23 },
    { tid:"oge24-dokazatelstva", adapter:"line", title:"Геометрия: доказательство", file:"../trainers/oge-task24-proofs.html", line:24 },
    { tid:"oge25-geometriya", adapter:"line", title:"Геометрия повышенной сложности", file:"../trainers/oge-task25-geometry.html", line:25 },
    { tid:"oge-2027-analogue-1", adapter:"analogue", title:"Авторский вариант 2027", file:"../trainers/oge-2027-analogue-1.html", line:0 },
    { tid:"oge-full-exam", adapter:"exam", title:"Пробный экзамен", file:"exam/full-exam.html", line:0 }
  ];

  function lastActivity(mk, tid){
    var best = 0, k, e;
    if (!isObj(mk)) return best;
    for (k in mk){
      if (!own(mk, k) || !keyOk(k)) continue;
      if (split(k)[0] !== tid) continue;
      e = entry(mk[k]);
      if (!e) continue;
      best = Math.max(best, e.last, e.lastWrong);
    }
    return best;
  }
  function journalOf(mk, tid){
    function mine(list){ return list.filter(function(it){ return it.tid === tid; }); }
    return { open: mine(open(mk)), closed: mine(closed(mk)) };
  }

  return { TRAINERS:TRAINERS, NAMES:NAMES, TYPES:TYPES, LINES:LINES, CABINET:CABINET,
           split:split, open:open, closed:closed, nameOf:nameOf, trainerOf:trainerOf,
           typesOf:typesOf, lastActivity:lastActivity, journalOf:journalOf,
           esc:esc, isObj:isObj, entry:entry, keyOk:keyOk, cleanJournal:cleanJournal };
})();
if (typeof module !== "undefined") module.exports = RV;

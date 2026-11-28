// Original MathExam practice following the approved 2027 exam blueprint.
globalThis.ProfilePractice2027 = Object.freeze([
  {
    "id": 1,
    "title": "Планиметрия",
    "detailed": false,
    "t": {
      "text": "В равнобедренную трапецию ABCD с основаниями AB и CD вписана окружность. Боковая сторона трапеции равна 25, меньшее основание CD равно 18. Найдите радиус окружности.",
      "answer": 12,
      "hint": "Сначала найдите второе основание по свойству описанного четырёхугольника.",
      "explain": "Сумма оснований равна сумме боковых сторон, то есть 50. Большее основание равно 32. Опустим высоты из верхних вершин: горизонтальный катет у каждой боковой стороны равен (32 − 18)/2 = 7. Высота равна √(25² − 7²) = 24. Окружность касается обоих параллельных оснований, поэтому высота равна диаметру. Радиус равен 12.",
      "visual": "<svg class=\"graph\" width=\"350\" height=\"252\" viewBox=\"0 0 350 252\" style=\"height:auto\" role=\"img\" aria-label=\"Равнобедренная трапеция ABCD с вписанной окружностью. Меньшее основание CD равно 18, обе боковые стороны равны 25.\" xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"175\" cy=\"122\" r=\"96\" fill=\"none\" stroke=\"#6E7E90\" stroke-width=\"1.7\"/><path d=\"M47 218H303L247 26H103Z\" fill=\"none\" stroke=\"#243449\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" /><circle cx=\"175\" cy=\"122\" r=\"3.3\" fill=\"#243449\"/><text x=\"175\" y=\"114\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\" fill=\"#243449\">O</text><text x=\"40\" y=\"238\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\" fill=\"#243449\">A</text><text x=\"309\" y=\"238\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\" fill=\"#243449\">B</text><text x=\"258\" y=\"24\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\" fill=\"#243449\">C</text><text x=\"91\" y=\"24\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\" fill=\"#243449\">D</text><text x=\"175\" y=\"17\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\" fill=\"#243449\">18</text><text x=\"67\" y=\"125\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\" fill=\"#243449\">25</text><text x=\"284\" y=\"125\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\" fill=\"#243449\">25</text></svg>"
    }
  },
  {
    "id": 2,
    "title": "Векторы",
    "detailed": false,
    "t": {
      "text": "На координатной плоскости изображены векторы <b>u</b> и <b>v</b>. Вычислите <span class=\"formula\">(<b>u</b> + <b>v</b>) · (<b>u</b> − <b>v</b>)</span>.",
      "answer": 20,
      "hint": "Прочитайте координаты каждой стрелки от её начала к наконечнику.",
      "explain": "Вектор u имеет координаты (4; −3), вектор v — (−1; 2). Их сумма равна (3; −1), разность равна (5; −5). Скалярное произведение равно 3 · 5 + (−1) · (−5) = 20. Тот же ответ получается как разность квадратов длин: 25 − 5.",
      "visual": "<svg class=\"graph\" width=\"342\" height=\"264\" viewBox=\"0 0 342 264\" style=\"height:auto\" role=\"img\" aria-label=\"Координатная сетка. Вектор u идёт из (−5; 3) в (−1; 0), вектор v — из (4; −3) в (3; −1).\" xmlns=\"http://www.w3.org/2000/svg\"><line x1=\"28\" y1=\"28\" x2=\"28\" y2=\"236\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"28\" y=\"147\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"middle\" fill=\"#243449\">−6</text><line x1=\"54\" y1=\"28\" x2=\"54\" y2=\"236\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"54\" y=\"147\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"middle\" fill=\"#243449\">−5</text><line x1=\"80\" y1=\"28\" x2=\"80\" y2=\"236\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"80\" y=\"147\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"middle\" fill=\"#243449\">−4</text><line x1=\"106\" y1=\"28\" x2=\"106\" y2=\"236\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"106\" y=\"147\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"middle\" fill=\"#243449\">−3</text><line x1=\"132\" y1=\"28\" x2=\"132\" y2=\"236\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"132\" y=\"147\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"middle\" fill=\"#243449\">−2</text><line x1=\"158\" y1=\"28\" x2=\"158\" y2=\"236\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"158\" y=\"147\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"middle\" fill=\"#243449\">−1</text><line x1=\"184\" y1=\"28\" x2=\"184\" y2=\"236\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><line x1=\"210\" y1=\"28\" x2=\"210\" y2=\"236\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"210\" y=\"147\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"middle\" fill=\"#243449\">1</text><line x1=\"236\" y1=\"28\" x2=\"236\" y2=\"236\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"236\" y=\"147\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"middle\" fill=\"#243449\">2</text><line x1=\"262\" y1=\"28\" x2=\"262\" y2=\"236\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"262\" y=\"147\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"middle\" fill=\"#243449\">3</text><line x1=\"288\" y1=\"28\" x2=\"288\" y2=\"236\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"288\" y=\"147\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"middle\" fill=\"#243449\">4</text><line x1=\"314\" y1=\"28\" x2=\"314\" y2=\"236\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"314\" y=\"147\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"middle\" fill=\"#243449\">5</text><line x1=\"28\" y1=\"236\" x2=\"314\" y2=\"236\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"178\" y=\"239.5\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"end\" fill=\"#243449\">−4</text><line x1=\"28\" y1=\"210\" x2=\"314\" y2=\"210\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"178\" y=\"213.5\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"end\" fill=\"#243449\">−3</text><line x1=\"28\" y1=\"184\" x2=\"314\" y2=\"184\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"178\" y=\"187.5\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"end\" fill=\"#243449\">−2</text><line x1=\"28\" y1=\"158\" x2=\"314\" y2=\"158\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"178\" y=\"161.5\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"end\" fill=\"#243449\">−1</text><line x1=\"28\" y1=\"132\" x2=\"314\" y2=\"132\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><line x1=\"28\" y1=\"106\" x2=\"314\" y2=\"106\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"178\" y=\"109.5\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"end\" fill=\"#243449\">1</text><line x1=\"28\" y1=\"80\" x2=\"314\" y2=\"80\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"178\" y=\"83.5\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"end\" fill=\"#243449\">2</text><line x1=\"28\" y1=\"54\" x2=\"314\" y2=\"54\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"178\" y=\"57.5\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"end\" fill=\"#243449\">3</text><line x1=\"28\" y1=\"28\" x2=\"314\" y2=\"28\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"178\" y=\"31.5\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"end\" fill=\"#243449\">4</text><path d=\"M28 132H327l-5 -3m5 3l-5 3\" fill=\"none\" stroke=\"#243449\" stroke-width=\"1.25\" stroke-linecap=\"round\" stroke-linejoin=\"round\" /><path d=\"M184 236V15l-3 5m3 -5l3 5\" fill=\"none\" stroke=\"#243449\" stroke-width=\"1.25\" stroke-linecap=\"round\" stroke-linejoin=\"round\" /><text x=\"327\" y=\"124\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\" fill=\"#243449\">x</text><text x=\"192\" y=\"19\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"start\" fill=\"#243449\">y</text><text x=\"179\" y=\"147\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"end\" fill=\"#243449\">0</text><line x1=\"54\" y1=\"54\" x2=\"158\" y2=\"132\" fill=\"none\" stroke=\"#243449\" stroke-width=\"2.4\" /><circle cx=\"54\" cy=\"54\" r=\"2.4\" fill=\"#243449\"/><polygon points=\"158,132 147.6,129.2 152.4,122.8\" fill=\"#243449\"/><line x1=\"288\" y1=\"210\" x2=\"262\" y2=\"158\" fill=\"none\" stroke=\"#8B3A21\" stroke-width=\"2.4\" /><circle cx=\"288\" cy=\"210\" r=\"2.4\" fill=\"#8B3A21\"/><polygon points=\"262,158 270.0498447189993,165.1554175279993 262.8944271909999,168.73312629199899\" fill=\"#8B3A21\"/><text x=\"102.10000000000001\" y=\"106.3\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"middle\" fill=\"#243449\">u</text><text x=\"288\" y=\"184\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"start\" fill=\"#8B3A21\">v</text></svg>"
    }
  },
  {
    "id": 3,
    "title": "Стереометрия",
    "detailed": false,
    "t": {
      "text": "Плоскость, параллельная основанию конуса, пересекает его по кругу с радиусом вдвое меньше радиуса основания. Объём части конуса между плоскостью сечения и основанием равен 112. Найдите объём всего конуса.",
      "answer": 128,
      "hint": "Сравните верхний конус со всем конусом по коэффициенту подобия.",
      "explain": "Линейный коэффициент подобия равен 1/2, поэтому объём верхнего конуса составляет 1/8 исходного объёма. Нижняя часть составляет 7/8. Если её объём равен 112, то весь объём равен 112 · 8/7 = 128.",
      "visual": "<svg class=\"graph\" width=\"320\" height=\"215\" viewBox=\"0 0 320 215\" style=\"height:auto\" role=\"img\" aria-label=\"Конус и круглое сечение параллельно его основанию. Радиус сечения вдвое меньше радиуса основания.\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M160 20L49 185M160 20L271 185\" fill=\"none\" stroke=\"#243449\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" /><path d=\"M49 185A111 20 0 0 0 271 185\" fill=\"none\" stroke=\"#243449\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" /><path d=\"M49 185A111 20 0 0 1 271 185\" fill=\"none\" stroke=\"#243449\" stroke-width=\"1.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-dasharray=\"4 4\"/><path d=\"M104.5 102.5A55.5 10 0 0 0 215.5 102.5\" fill=\"none\" stroke=\"#8B3A21\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" /><path d=\"M104.5 102.5A55.5 10 0 0 1 215.5 102.5\" fill=\"none\" stroke=\"#8B3A21\" stroke-width=\"1.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-dasharray=\"4 4\"/><line x1=\"160\" y1=\"20\" x2=\"160\" y2=\"185\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"1.2\" stroke-dasharray=\"4 4\"/></svg>"
    }
  },
  {
    "id": 4,
    "title": "Вероятность",
    "detailed": false,
    "t": {
      "text": "Двадцать одну команду жребием распределяют по трём группам по семь команд. Все распределения по группам равновероятны. Найдите вероятность того, что команды «Восток» и «Заря» попадут в одну группу.",
      "answer": 0.3,
      "hint": "Зафиксируйте место первой команды и посчитайте места, доступные второй.",
      "explain": "Когда место «Востока» известно, у «Зари» остаётся 20 равновероятных мест. Шесть из них находятся в той же группе. Искомая вероятность равна 6/20 = 0,3.",
      "visual": ""
    }
  },
  {
    "id": 5,
    "title": "Вероятность и статистика",
    "detailed": false,
    "t": {
      "text": "Баскетболист выполняет четыре штрафных броска. Результаты бросков независимы. Вероятность попадания при каждом броске равна 0,7. Найдите вероятность того, что баскетболист промахнётся не более одного раза.",
      "answer": 0.6517,
      "hint": "Сложите вероятности двух несовместных событий: ни одного промаха и ровно один промах.",
      "explain": "Вероятность четырёх попаданий равна 0,7⁴ = 0,2401. Для ровно одного промаха есть четыре места промаха. Вероятность равна 4 · 0,3 · 0,7³ = 0,4116. Всего 0,2401 + 0,4116 = 0,6517.",
      "visual": ""
    }
  },
  {
    "id": 6,
    "title": "Уравнения",
    "detailed": false,
    "t": {
      "text": "Найдите больший корень уравнения <span class=\"formula\">log<sub>1/2</sub>(x² − 7x + 12) = −1</span>.",
      "answer": 5,
      "hint": "Выразите аргумент логарифма как степень его основания.",
      "explain": "Аргумент логарифма равен (1/2)⁻¹ = 2. Получаем x² − 7x + 10 = 0, то есть (x − 2)(x − 5) = 0. Оба значения дают положительный аргумент 2. Больший корень равен 5.",
      "visual": ""
    }
  },
  {
    "id": 7,
    "title": "Вычисления и преобразования",
    "detailed": false,
    "t": {
      "text": "Найдите значение выражения <span class=\"formula\">4(cos² 27° − sin² 27°)/sin 36° − tg 45°</span>.",
      "answer": 3,
      "hint": "Сверните разность квадратов по формуле косинуса двойного угла.",
      "explain": "Разность cos² 27° − sin² 27° равна cos 54°, а cos 54° = sin 36°. Так как sin 36° ≠ 0, дробь равна 4. Вычитаем tg 45° = 1 и получаем 3.",
      "visual": ""
    }
  },
  {
    "id": 8,
    "title": "Производная и её график",
    "detailed": false,
    "t": {
      "text": "На рисунке показан график производной функции <span class=\"formula\">y = f′(x)</span>. Функция f определена на интервале (−6; 6). Найдите сумму абсцисс всех точек локального экстремума функции f на отрезке [−5; 5].",
      "answer": -3,
      "hint": "Отмечайте те нули производной, через которые она меняет знак.",
      "explain": "Производная меняет знак при x = −4, −1 и 2. При x = 4 она обращается в ноль, но знак остаётся положительным. Сумма абсцисс точек экстремума равна −4 − 1 + 2 = −3.",
      "visual": "<svg class=\"graph\" width=\"392\" height=\"224\" viewBox=\"0 0 392 224\" style=\"height:auto\" role=\"img\" aria-label=\"График производной f′ на сетке. Он пересекает ось x в точках с абсциссами −4, −1 и 2. В точке x = 4 график касается оси, оставаясь выше неё с обеих сторон. При x = −5 график ниже оси.\" xmlns=\"http://www.w3.org/2000/svg\"><line x1=\"28\" y1=\"28\" x2=\"28\" y2=\"196\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"28\" y=\"127\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"middle\" fill=\"#243449\">−6</text><line x1=\"56\" y1=\"28\" x2=\"56\" y2=\"196\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"56\" y=\"127\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"middle\" fill=\"#243449\">−5</text><line x1=\"84\" y1=\"28\" x2=\"84\" y2=\"196\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"84\" y=\"127\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"middle\" fill=\"#243449\">−4</text><line x1=\"112\" y1=\"28\" x2=\"112\" y2=\"196\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"112\" y=\"127\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"middle\" fill=\"#243449\">−3</text><line x1=\"140\" y1=\"28\" x2=\"140\" y2=\"196\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"140\" y=\"127\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"middle\" fill=\"#243449\">−2</text><line x1=\"168\" y1=\"28\" x2=\"168\" y2=\"196\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"168\" y=\"127\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"middle\" fill=\"#243449\">−1</text><line x1=\"196\" y1=\"28\" x2=\"196\" y2=\"196\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><line x1=\"224\" y1=\"28\" x2=\"224\" y2=\"196\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"224\" y=\"127\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"middle\" fill=\"#243449\">1</text><line x1=\"252\" y1=\"28\" x2=\"252\" y2=\"196\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"252\" y=\"127\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"middle\" fill=\"#243449\">2</text><line x1=\"280\" y1=\"28\" x2=\"280\" y2=\"196\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"280\" y=\"127\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"middle\" fill=\"#243449\">3</text><line x1=\"308\" y1=\"28\" x2=\"308\" y2=\"196\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"308\" y=\"127\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"middle\" fill=\"#243449\">4</text><line x1=\"336\" y1=\"28\" x2=\"336\" y2=\"196\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"336\" y=\"127\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"middle\" fill=\"#243449\">5</text><line x1=\"364\" y1=\"28\" x2=\"364\" y2=\"196\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"364\" y=\"127\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"middle\" fill=\"#243449\">6</text><line x1=\"28\" y1=\"196\" x2=\"364\" y2=\"196\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"190\" y=\"199.5\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"end\" fill=\"#243449\">−3</text><line x1=\"28\" y1=\"168\" x2=\"364\" y2=\"168\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"190\" y=\"171.5\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"end\" fill=\"#243449\">−2</text><line x1=\"28\" y1=\"140\" x2=\"364\" y2=\"140\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"190\" y=\"143.5\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"end\" fill=\"#243449\">−1</text><line x1=\"28\" y1=\"112\" x2=\"364\" y2=\"112\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><line x1=\"28\" y1=\"84\" x2=\"364\" y2=\"84\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"190\" y=\"87.5\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"end\" fill=\"#243449\">1</text><line x1=\"28\" y1=\"56\" x2=\"364\" y2=\"56\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"190\" y=\"59.5\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"end\" fill=\"#243449\">2</text><line x1=\"28\" y1=\"28\" x2=\"364\" y2=\"28\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"190\" y=\"31.5\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"end\" fill=\"#243449\">3</text><path d=\"M28 112H377l-5 -3m5 3l-5 3\" fill=\"none\" stroke=\"#243449\" stroke-width=\"1.25\" stroke-linecap=\"round\" stroke-linejoin=\"round\" /><path d=\"M196 196V15l-3 5m3 -5l3 5\" fill=\"none\" stroke=\"#243449\" stroke-width=\"1.25\" stroke-linecap=\"round\" stroke-linejoin=\"round\" /><text x=\"377\" y=\"104\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\" fill=\"#243449\">x</text><text x=\"204\" y=\"19\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"start\" fill=\"#243449\">y</text><text x=\"191\" y=\"127\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"end\" fill=\"#243449\">0</text><path d=\"M28 168 L56 140 L84 112 L112 56 L140 84 L168 112 L196 140 L224 168 L252 112 L280 56Q294 112 308 112Q322 112 336 84L364 56\" fill=\"none\" stroke=\"#243449\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" /><text x=\"270.20000000000005\" y=\"40.60000000000001\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"start\" fill=\"#243449\">y = f′(x)</text></svg>"
    }
  },
  {
    "id": 9,
    "title": "Прикладная формула",
    "detailed": false,
    "t": {
      "text": "Ослабление звукового сигнала в децибелах вычисляют по формуле <span class=\"formula\">L = 20 lg(A<sub>0</sub>/A)</span>, где A<sub>0</sub> — амплитуда до преграды, A — амплитуда после неё. При прохождении через два слоя ослабления складываются. После обоих слоёв амплитуда стала в 100 раз меньше исходной. Первый слой ослабил сигнал на 12 дБ. Найдите ослабление второго слоя. Ответ дайте в децибелах.",
      "answer": 28,
      "hint": "Подставьте отношение амплитуд в формулу для суммарного ослабления.",
      "explain": "После двух слоёв A₀/A = 100. Суммарное ослабление равно 20 · lg 100 = 40 дБ. Оно складывается из ослаблений обоих слоёв. Для второго слоя получаем 40 − 12 = 28 дБ.",
      "visual": ""
    }
  },
  {
    "id": 10,
    "title": "Текстовая задача",
    "detailed": false,
    "t": {
      "text": "В баке 42 кг 25%-го раствора сахара. Часть однородного раствора отлили и добавили столько же килограммов 60%-го раствора сахара. После перемешивания концентрация составила 40%. Сколько килограммов раствора отлили?",
      "answer": 18,
      "hint": "Обозначьте массу отлитой порции через x. Выразите массу сахара в оставшейся и добавленной порциях.",
      "explain": "После замены в баке осталось 42 кг раствора. Масса сахара равна 0,25(42 − x) + 0,60x. Из 0,25(42 − x) + 0,60x = 0,40 · 42 получаем 0,35x = 6,3, то есть x = 18. Это значение лежит между 0 и 42.",
      "visual": ""
    }
  },
  {
    "id": 11,
    "title": "Функции и графики",
    "detailed": false,
    "t": {
      "text": "На рисунке изображён график функции <span class=\"formula\">f(x) = a<sup>x</sup> + b</span>, где a &gt; 1. Пунктиром показана горизонтальная асимптота. При каком x значение функции равно 79?",
      "answer": 4,
      "hint": "Считайте высоту асимптоты и координаты отмеченной точки.",
      "explain": "Пунктирная прямая имеет уравнение y = −2, поэтому b = −2. Отмеченная точка (1; 1) даёт a − 2 = 1, значит, a = 3. Из 3ˣ − 2 = 79 следует 3ˣ = 81 = 3⁴. Ответ x = 4 единственный, поскольку показательная функция при основании 3 строго возрастает.",
      "visual": "<svg class=\"graph\" width=\"231\" height=\"331\" viewBox=\"0 0 231 331\" style=\"height:auto\" role=\"img\" aria-label=\"График возрастающей показательной функции. Пунктирная горизонтальная асимптота проходит через (0; −2). Отмеченная точка кривой имеет координаты (1; 1).\" xmlns=\"http://www.w3.org/2000/svg\"><line x1=\"28\" y1=\"28\" x2=\"28\" y2=\"303\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"28\" y=\"243\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"middle\" fill=\"#243449\">−4</text><line x1=\"53\" y1=\"28\" x2=\"53\" y2=\"303\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"53\" y=\"243\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"middle\" fill=\"#243449\">−3</text><line x1=\"78\" y1=\"28\" x2=\"78\" y2=\"303\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"78\" y=\"243\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"middle\" fill=\"#243449\">−2</text><line x1=\"103\" y1=\"28\" x2=\"103\" y2=\"303\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"103\" y=\"243\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"middle\" fill=\"#243449\">−1</text><line x1=\"128\" y1=\"28\" x2=\"128\" y2=\"303\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><line x1=\"153\" y1=\"28\" x2=\"153\" y2=\"303\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"153\" y=\"243\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"middle\" fill=\"#243449\">1</text><line x1=\"178\" y1=\"28\" x2=\"178\" y2=\"303\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"178\" y=\"243\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"middle\" fill=\"#243449\">2</text><line x1=\"203\" y1=\"28\" x2=\"203\" y2=\"303\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"203\" y=\"243\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"middle\" fill=\"#243449\">3</text><line x1=\"28\" y1=\"303\" x2=\"203\" y2=\"303\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"122\" y=\"306.5\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"end\" fill=\"#243449\">−3</text><line x1=\"28\" y1=\"278\" x2=\"203\" y2=\"278\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"122\" y=\"281.5\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"end\" fill=\"#243449\">−2</text><line x1=\"28\" y1=\"253\" x2=\"203\" y2=\"253\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"122\" y=\"256.5\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"end\" fill=\"#243449\">−1</text><line x1=\"28\" y1=\"228\" x2=\"203\" y2=\"228\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><line x1=\"28\" y1=\"203\" x2=\"203\" y2=\"203\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"122\" y=\"206.5\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"end\" fill=\"#243449\">1</text><line x1=\"28\" y1=\"178\" x2=\"203\" y2=\"178\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"122\" y=\"181.5\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"end\" fill=\"#243449\">2</text><line x1=\"28\" y1=\"153\" x2=\"203\" y2=\"153\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"122\" y=\"156.5\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"end\" fill=\"#243449\">3</text><line x1=\"28\" y1=\"128\" x2=\"203\" y2=\"128\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"122\" y=\"131.5\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"end\" fill=\"#243449\">4</text><line x1=\"28\" y1=\"103\" x2=\"203\" y2=\"103\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"122\" y=\"106.5\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"end\" fill=\"#243449\">5</text><line x1=\"28\" y1=\"78\" x2=\"203\" y2=\"78\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"122\" y=\"81.5\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"end\" fill=\"#243449\">6</text><line x1=\"28\" y1=\"53\" x2=\"203\" y2=\"53\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"122\" y=\"56.5\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"end\" fill=\"#243449\">7</text><line x1=\"28\" y1=\"28\" x2=\"203\" y2=\"28\" fill=\"none\" stroke=\"#CAD1DA\" stroke-width=\"0.75\" /><text x=\"122\" y=\"31.5\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"end\" fill=\"#243449\">8</text><path d=\"M28 228H216l-5 -3m5 3l-5 3\" fill=\"none\" stroke=\"#243449\" stroke-width=\"1.25\" stroke-linecap=\"round\" stroke-linejoin=\"round\" /><path d=\"M128 303V15l-3 5m3 -5l3 5\" fill=\"none\" stroke=\"#243449\" stroke-width=\"1.25\" stroke-linecap=\"round\" stroke-linejoin=\"round\" /><text x=\"216\" y=\"220\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"end\" fill=\"#243449\">x</text><text x=\"136\" y=\"19\" font-family=\"sans-serif\" font-size=\"13\" text-anchor=\"start\" fill=\"#243449\">y</text><text x=\"123\" y=\"243\" font-family=\"sans-serif\" font-size=\"10\" text-anchor=\"end\" fill=\"#243449\">0</text><line x1=\"28\" y1=\"278\" x2=\"203\" y2=\"278\" fill=\"none\" stroke=\"#8B3A21\" stroke-width=\"1.65\" stroke-dasharray=\"5 4\"/><path d=\"M28.00 277.69 L29.93 277.66 L31.86 277.63 L33.79 277.60 L35.72 277.57 L37.65 277.53 L39.57 277.49 L41.50 277.44 L43.43 277.39 L45.36 277.34 L47.29 277.28 L49.22 277.22 L51.15 277.15 L53.08 277.07 L55.01 276.99 L56.94 276.90 L58.87 276.80 L60.79 276.70 L62.72 276.58 L64.65 276.45 L66.58 276.32 L68.51 276.17 L70.44 276.01 L72.37 275.83 L74.30 275.64 L76.23 275.43 L78.16 275.20 L80.09 274.96 L82.01 274.69 L83.94 274.39 L85.87 274.07 L87.80 273.73 L89.73 273.35 L91.66 272.94 L93.59 272.49 L95.52 272.00 L97.45 271.47 L99.38 270.89 L101.31 270.26 L103.23 269.58 L105.16 268.84 L107.09 268.02 L109.02 267.14 L110.95 266.18 L112.88 265.14 L114.81 264.00 L116.74 262.76 L118.67 261.41 L120.60 259.94 L122.53 258.35 L124.45 256.61 L126.38 254.71 L128.31 252.65 L130.24 250.41 L132.17 247.97 L134.10 245.31 L136.03 242.42 L137.96 239.28 L139.89 235.85 L141.82 232.12 L143.74 228.06 L145.67 223.64 L147.60 218.84 L149.53 213.60 L151.46 207.90 L153.39 201.70 L155.32 194.95 L157.25 187.60 L159.18 179.61 L161.11 170.90 L163.04 161.43 L164.96 151.12 L166.89 139.89 L168.82 127.67 L170.75 114.37 L172.68 99.90 L174.61 84.14 L176.54 66.99 L178.47 48.32 L180.40 28.00\" fill=\"none\" stroke=\"#243449\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" /><circle cx=\"153\" cy=\"203\" r=\"4\" fill=\"#243449\"/></svg>"
    }
  },
  {
    "id": 12,
    "title": "Наибольшее и наименьшее значение",
    "detailed": false,
    "t": {
      "text": "Найдите наименьшее значение функции <span class=\"formula\">y = 6x ln(x/2) − 6x</span> на отрезке [1; 5].",
      "answer": -12,
      "hint": "Примените правило производной произведения к x ln(x/2).",
      "explain": "На данном отрезке функция дифференцируема. Её производная равна 6 ln(x/2) + 6 − 6 = 6 ln(x/2). Она отрицательна при 1 ≤ x &lt; 2 и положительна при 2 &lt; x ≤ 5. Следовательно, функция убывает до 2 и возрастает после 2. Наименьшее значение равно 6 · 2 · ln 1 − 6 · 2 = −12.",
      "visual": ""
    }
  },
  {
    "id": 13,
    "title": "Уравнение с отбором корней",
    "detailed": true,
    "maxPoints": 2,
    "t": {
      "text": "<p><b>а)</b> Решите уравнение <span class=\"formula\">cos 2x − cos 4x = √2 sin 3x</span>.</p><p><b>б)</b> Перечислите те его корни, которые лежат на отрезке <span class=\"formula\">[−4π/3; −π/3]</span>.</p>",
      "hint": "Примените формулу разности косинусов. В пункте б) проверьте конечные значения индексов для всех серий.",
      "model": [
        "По формуле разности косинусов cos 2x − cos 4x = −2 sin 3x sin(−x) = 2 sin 3x sin x. Исходное уравнение равносильно произведению sin 3x · (2 sin x − √2) = 0.",
        "Из sin 3x = 0 получаем x = πk/3, k ∈ ℤ. Из sin x = √2/2 получаем x = π/4 + 2πn или x = 3π/4 + 2πm, где n, m ∈ ℤ.",
        "Для первой серии отрезок даёт −4 ≤ k ≤ −1. Подходят k = −4, −3, −2, −1, обе границы включены.",
        "Для второй серии после деления неравенства на π получаем −19/24 ≤ n ≤ −7/24. Целых n нет. Для третьей серии −25/24 ≤ m ≤ −13/24, подходит только m = −1, откуда x = −5π/4."
      ],
      "answerLine": "Ответ. а) x = πk/3, x = π/4 + 2πn, x = 3π/4 + 2πm (k, n, m ∈ ℤ). б) −4π/3; −5π/4; −π; −2π/3; −π/3.",
      "visual": "",
      "rubric": [
        {
          "points": 2,
          "criterion": "Обосновано полное общее решение и записан проверяемый отбор корней каждой серии. Допускаются другие равносильные серии и способы отбора."
        },
        {
          "points": 1,
          "criterion": "Обосновано полное общее решение. Также засчитывается изолированная вычислительная ошибка при верной последовательности шагов в обоих пунктах."
        },
        {
          "points": 0,
          "criterion": "Оснований для предыдущих оценок нет. Список корней без обоснования получает 0."
        }
      ],
      "criteriaUrl": "https://sdamgia.online/documents/ege-2027/demoversiya-ege-2027-matematika-profilnyj-uroven.pdf#page=10"
    }
  },
  {
    "id": 14,
    "title": "Стереометрия с доказательством",
    "detailed": true,
    "maxPoints": 3,
    "t": {
      "text": "<p>В прямой треугольной призме ABCA₁B₁C₁ угол BAC прямой. Точки M и N — середины рёбер BB₁ и CC₁ соответственно. Из A опущен перпендикуляр AH на BC. Прямая, проведённая через H параллельно BB₁, пересекает MN в Q.</p><p><b>а)</b> Докажите, что угол HAQ равен углу между плоскостями AMN и ABC.</p><p><b>б)</b> Найдите косинус угла между этими плоскостями, если AB = 15, AC = 20, BB₁ = 18.</p>",
      "hint": "Найдите общую прямую двух плоскостей, а затем проведите в обеих плоскостях перпендикуляры к ней.",
      "model": [
        "В прямоугольнике BCC₁B₁ отрезок MN соединяет середины боковых сторон, так что MN ∥ BC. Общая прямая плоскостей AMN и ABC — прямая через A, параллельная MN: она лежит в AMN как параллельная MN через A и в ABC как параллельная BC через A.",
        "Обозначим общую прямую ℓ. Тогда AH ⟂ ℓ, потому что AH ⟂ BC. Кроме того, HQ ∥ BB₁ и BB₁ ⟂ (ABC), поэтому HQ ⟂ BC. Прямая BC перпендикулярна двум пересекающимся прямым AH и HQ, значит, BC ⟂ (AHQ); следовательно, AQ ⟂ ℓ. Острый угол HAQ образован двумя перпендикулярами к общей прямой, по одному в каждой плоскости.",
        "BC = √(15² + 20²) = 25. По площади треугольника ABC имеем AH · BC = AB · AC, откуда AH = 12.",
        "Четырёхугольник BMQH — прямоугольник в плоскости грани BCC₁B₁, поэтому HQ = BM = 9. Треугольник AHQ прямоугольный при H, AQ = √(12² + 9²) = 15, cos ∠HAQ = 12/15 = 4/5."
      ],
      "answerLine": "Ответ. б) 4/5.",
      "visual": "<svg class=\"graph\" viewBox=\"0 0 274 248\" role=\"img\" aria-label=\"Прямая треугольная призма. Точки M и N — середины BB₁ и CC₁, H лежит на BC, Q лежит на MN выше H вдоль боковых рёбер. Скрытые рёбра пунктиром.\" xmlns=\"http://www.w3.org/2000/svg\">\n <path d=\"M48 220H198V76L98 20 48 76Z M48 76H198\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"/>\n <path d=\"M48 220L98 164 198 220 M98 164V20\" fill=\"none\" stroke=\"currentColor\" stroke-opacity=\".65\" stroke-width=\"1.5\" stroke-dasharray=\"5 4\"/>\n <path d=\"M48 220L198 148 98 92Z\" fill=\"#3179aa\" fill-opacity=\".13\" stroke=\"#22729f\" stroke-width=\"1.7\" stroke-dasharray=\"5 3\"/>\n <path d=\"M48 220L162 200V128L48 220\" fill=\"none\" stroke=\"#974020\" stroke-width=\"1.7\" stroke-dasharray=\"3 3\"/>\n <g fill=\"currentColor\"><circle cx=\"48\" cy=\"220\" r=\"2.5\"/><circle cx=\"198\" cy=\"220\" r=\"2.5\"/><circle cx=\"98\" cy=\"164\" r=\"2.5\"/><circle cx=\"48\" cy=\"76\" r=\"2.5\"/><circle cx=\"198\" cy=\"76\" r=\"2.5\"/><circle cx=\"98\" cy=\"20\" r=\"2.5\"/><circle cx=\"198\" cy=\"148\" r=\"2.5\"/><circle cx=\"98\" cy=\"92\" r=\"2.5\"/><circle cx=\"162\" cy=\"200\" r=\"2.5\"/><circle cx=\"162\" cy=\"128\" r=\"2.5\"/></g>\n <g fill=\"currentColor\" font-family=\"system-ui, sans-serif\" font-size=\"15\"><text x=\"34\" y=\"235\">A</text><text x=\"204\" y=\"236\">B</text><text x=\"85\" y=\"162\">C</text><text x=\"27\" y=\"75\">A₁</text><text x=\"204\" y=\"74\">B₁</text><text x=\"102\" y=\"19\">C₁</text><text x=\"205\" y=\"152\">M</text><text x=\"77\" y=\"97\">N</text><text x=\"165\" y=\"194\">H</text><text x=\"169\" y=\"124\">Q</text></g>\n</svg>",
      "rubric": [
        {
          "points": 3,
          "criterion": "Дано полное доказательство а) и обоснован ответ 4/5 в б), в том числе независимым методом."
        },
        {
          "points": 2,
          "criterion": "Пункт б) полностью обоснован независимо от а); либо а) доказан и в правильном решении б) допущена одна арифметическая ошибка."
        },
        {
          "points": 1,
          "criterion": "Доказан только а); либо в б) верный ответ обоснован через утверждение а) при незавершённом доказательстве этого утверждения; либо полный независимый способ в б) содержит арифметическую ошибку."
        },
        {
          "points": 0,
          "criterion": "Оснований для предыдущих оценок нет."
        }
      ],
      "criteriaUrl": "https://sdamgia.online/documents/ege-2027/demoversiya-ege-2027-matematika-profilnyj-uroven.pdf#page=11"
    }
  },
  {
    "id": 15,
    "title": "Неравенство",
    "detailed": true,
    "maxPoints": 2,
    "t": {
      "text": "<p>Решите неравенство <span class=\"formula\">log<sub>1/3</sub>((x² − 5x + 6)/(x + 1)) ≥ −1</span>.</p>",
      "hint": "Сначала найдите, где аргумент логарифма положителен. При переходе от логарифмов к аргументам знак меняется.",
      "model": [
        "Аргумент u = (x − 2)(x − 3)/(x + 1) должен быть положительным, а x ≠ −1. Критические числа −1, 2, 3 дают ОДЗ (−1; 2) ∪ (3; +∞).",
        "Поскольку 0 &lt; 1/3 &lt; 1 и −1 = log<sub>1/3</sub>3, требуется u ≤ 3. На всей ОДЗ x + 1 &gt; 0, поэтому можно умножить на x + 1 без перемены знака. Получаем x² − 8x + 3 ≤ 0.",
        "Корни квадратного трёхчлена 4 − √13 и 4 + √13. Между ними трёхчлен неположителен, обе границы допустимы. Числа 2 и 3 исключаются по исходному логарифму. Пересечение с ОДЗ даёт два промежутка."
      ],
      "answerLine": "Ответ. [4 − √13; 2) ∪ (3; 4 + √13].",
      "visual": "",
      "rubric": [
        {
          "points": 2,
          "criterion": "Верно установлена ОДЗ, обосновано направление знака, найдено и принято правильное пересечение с ОДЗ."
        },
        {
          "points": 1,
          "criterion": "Все основные преобразования и пересечение с ОДЗ обоснованы, но вычислительная ошибка исказила ответ; либо потерян один допустимый внешний конец при верной остальной записи."
        },
        {
          "points": 0,
          "criterion": "Оснований для предыдущих оценок нет. Ответ с включёнными точками −1, 2 или 3 и пропущенной ОДЗ оценивается в 0."
        }
      ],
      "criteriaUrl": "https://sdamgia.online/documents/ege-2027/demoversiya-ege-2027-matematika-profilnyj-uroven.pdf#page=12"
    }
  },
  {
    "id": 16,
    "title": "Экономическая задача",
    "detailed": true,
    "maxPoints": 2,
    "t": {
      "text": "<p>15 августа 2028 года клиент взял кредит на шесть месяцев. Первого числа каждого месяца с сентября по февраль долг увеличивается на 5% от остатка на 15-е число предыдущего месяца. Со 2-го по 14-е число вносится один платёж.</p><ul><li>Сентябрьский и октябрьский платежи одинаковы. Остаток на 15 октября равен двум третям суммы кредита.</li><li>С ноября по февраль остаток на 15-е число каждого месяца уменьшается на одну и ту же сумму по сравнению с 15-м числом предыдущего месяца. К 15 февраля кредит погашен.</li><li>Ноябрьский платёж на 18 450 рублей больше февральского.</li></ul><p>Каков размер сентябрьского платежа в рублях?</p>",
      "hint": "Разность ноябрьского и февральского платежей связана только с процентами: доли основного долга в этих платежах одинаковы.",
      "model": [
        "Пусть сумма кредита равна S рублей. Остаток на 15 октября равен 2S/3. За следующие четыре платежа эти 2S/3 погашаются равными долями, по S/6 ежемесячно.",
        "До ноябрьского начисления остаток равен 2S/3, до февральского — S/6. Поэтому разность платежей равна 0,05 · (2S/3 − S/6) = S/40. Из условия S/40 = 18 450 получаем S = 738 000.",
        "Обозначим общий сентябрьский и октябрьский платёж через P. Остатки после них равны 1,05S − P и 1,05²S − 2,05P. Второй остаток равен 2S/3 = 492 000. Получаем 2,05P = 813 645 − 492 000 = 321 645, откуда P = 156 900.",
        "Проверка календаря: остатки после всех шести платежей 618 000, 492 000, 369 000, 246 000, 123 000, 0. Ноябрьский платёж 147 600, февральский 129 150. Разность 18 450 рублей."
      ],
      "answerLine": "Ответ. 156 900 рублей.",
      "visual": "",
      "rubric": [
        {
          "points": 2,
          "criterion": "Построена верная денежная модель и обосновано найдено 156 900 рублей."
        },
        {
          "points": 1,
          "criterion": "Верно составлены формула разности платежей и уравнение для двух одинаковых выплат, но ответ потерян из-за единичной ошибки в вычислениях или отсутствия финального расчёта."
        },
        {
          "points": 0,
          "criterion": "Оснований для предыдущих оценок нет. Модель с перепутанным порядком начисления и платежа или смешанными единицами не даёт балла."
        }
      ],
      "criteriaUrl": "https://sdamgia.online/documents/ege-2027/demoversiya-ege-2027-matematika-profilnyj-uroven.pdf#page=13"
    }
  },
  {
    "id": 17,
    "title": "Планиметрия с доказательством",
    "detailed": true,
    "maxPoints": 3,
    "t": {
      "text": "<p>В выпуклой трапеции ABCD основания AB и CD параллельны, AB &lt; CD. Продолжения боковых сторон DA и CB за точки A и B пересекаются в O. Диагонали AC и BD пересекаются в P.</p><p><b>а)</b> Докажите, что прямая OP проходит через середины обоих оснований.</p><p><b>б)</b> Найдите OP, если AB = 8, CD = 14, OA = 6 и OB = 10.</p>",
      "hint": "Рассмотрите две гомотетии: одну с центром O, другую с центром P. Обе переводят одно основание в другое.",
      "model": [
        "Пусть M и N — середины AB и CD. Так как AB ∥ CD и O, A, D лежат на одном луче, а O, B, C — на другом, треугольники OAB и ODC подобны. Гомотетия с центром O и коэффициентом CD/AB переводит A в D, B в C, поэтому M в N. Точки O, M, N коллинеарны, OM &lt; ON.",
        "Треугольники PAB и PCD подобны по вертикальным углам при P и углам при параллельных основаниях. Гомотетия с центром P и коэффициентом −CD/AB переводит A в C, B в D. Поэтому M переходит в N и P лежит между M и N. Значит, O, M, P, N лежат на одной прямой.",
        "В треугольнике OAB выполнено 6² + 8² = 10², поэтому угол OAB прямой. AM = 4, значит, OM = √(6² + 4²) = 2√13. Кроме того, ON = (14/8)OM = 7OM/4 и MN = 3OM/4.",
        "Из подобия при центре P имеем MP/PN = 8/14 = 4/7, откуда MP = 4MN/11 = 3OM/11. Следовательно, OP = OM + MP = 14OM/11 = 28√13/11."
      ],
      "answerLine": "Ответ. б) 28√13/11.",
      "visual": "<svg class=\"graph\" viewBox=\"0 0 258 198\" role=\"img\" aria-label=\"Трапеция ABCD. AB параллельно CD. Боковые стороны продолжены за A и B до O; диагонали пересекаются в P.\" xmlns=\"http://www.w3.org/2000/svg\">\n <path d=\"M41 18V98 M41 18L130 98\" fill=\"none\" stroke=\"currentColor\" stroke-opacity=\".65\" stroke-width=\"1.5\" stroke-dasharray=\"5 4\"/>\n <path d=\"M41 98H130L196.75 158H41Z\" fill=\"#3179aa\" fill-opacity=\".10\" stroke=\"currentColor\" stroke-width=\"2\"/>\n <path d=\"M41 98L196.75 158 M130 98L41 158\" fill=\"none\" stroke=\"#22729f\" stroke-width=\"1.6\"/>\n <g fill=\"currentColor\"><circle cx=\"41\" cy=\"18\" r=\"2.5\"/><circle cx=\"41\" cy=\"98\" r=\"2.5\"/><circle cx=\"130\" cy=\"98\" r=\"2.5\"/><circle cx=\"196.75\" cy=\"158\" r=\"2.5\"/><circle cx=\"41\" cy=\"158\" r=\"2.5\"/><circle cx=\"97.64\" cy=\"119.82\" r=\"2.5\"/></g>\n <g fill=\"currentColor\" font-family=\"system-ui, sans-serif\" font-size=\"15\"><text x=\"22\" y=\"20\">O</text><text x=\"24\" y=\"103\">A</text><text x=\"138\" y=\"96\">B</text><text x=\"204\" y=\"164\">C</text><text x=\"25\" y=\"164\">D</text><text x=\"104\" y=\"116\">P</text></g>\n</svg>",
      "rubric": [
        {
          "points": 3,
          "criterion": "Верно обоснована коллинеарность O, P и обеих середин. Длина OP найдена с проверяемым обоснованием."
        },
        {
          "points": 2,
          "criterion": "Длина OP найдена с самостоятельным обоснованием пункта б); либо а) доказан, а в корректном решении б) допущена арифметическая ошибка."
        },
        {
          "points": 1,
          "criterion": "Доказан только а); либо верный расчёт б) опирается на недоказанное утверждение а); либо самостоятельный обоснованный ход в б) испорчен арифметической ошибкой."
        },
        {
          "points": 0,
          "criterion": "Оснований для предыдущих оценок нет."
        }
      ],
      "criteriaUrl": "https://sdamgia.online/documents/ege-2027/demoversiya-ege-2027-matematika-profilnyj-uroven.pdf#page=14"
    }
  },
  {
    "id": 18,
    "title": "Задача с параметром",
    "detailed": true,
    "maxPoints": 4,
    "t": {
      "text": "<p>Найдите все значения параметра a, при каждом из которых уравнение <span class=\"formula\">|x² − 16| = a(x − 5)</span> имеет ровно четыре различных действительных корня.</p>",
      "hint": "Отдельно обработайте a = 0 и исключите x = 5. Для остальных случаев знак правой части ограничивает область x.",
      "model": [
        "При a = 0 получаем ровно два корня, x = −4 и x = 4. При любом a число x = 5 корнем быть не может: левая часть равна 9, правая 0. При a ≠ 0 точки x = −4 и x = 4 тоже не являются корнями.",
        "Пусть F(x) = (x² − 16)/(x − 5) = x + 5 + 9/(x − 5). Тогда F′(x) = 1 − 9/(x − 5)², а уравнение принимает вид F(x) = a вне (−4; 4) и −F(x) = a внутри (−4; 4).",
        "Если a &lt; 0, из знака правой части следует x &lt; 5. На x &lt; −4 функция F строго возрастает от −∞ к 0, а на 4 &lt; x &lt; 5 строго убывает от 0 к −∞. Поэтому на каждом из этих промежутков есть ровно один корень.",
        "На (−4; 4) функция −F строго убывает до x = 2, затем возрастает. Её минимум равен −F(2) = −4, а пределы у обоих концов равны 0. Для −4 &lt; a &lt; 0 на этой ветви два корня, при a = −4 один, при a &lt; −4 ни одного.",
        "Если a &gt; 0, возможны только x &gt; 5. На этой области F убывает до x = 8 и затем возрастает. Горизонталь y = a пересекает её не более двух раз. Итак, четыре различных корня имеют место ровно при −4 &lt; a &lt; 0."
      ],
      "answerLine": "Ответ. a ∈ (−4; 0).",
      "visual": "",
      "rubric": [
        {
          "points": 4,
          "criterion": "Полностью обоснован счёт корней при a &lt; 0, a = 0 и a &gt; 0, а также исключение граничного a = −4. Получен интервал (−4; 0)."
        },
        {
          "points": 3,
          "criterion": "Все существенные ветви проанализированы, рассуждение верно, а ответ отличается только ошибочным включением границы −4 и/или 0."
        },
        {
          "points": 2,
          "criterion": "Полно и правильно разобран весь случай a &lt; 0, но остаётся одна из ветвей a = 0 или a &gt; 0; либо все шаги решения верны по структуре, но единичная вычислительная ошибка изменила итог."
        },
        {
          "points": 1,
          "criterion": "Верно выполнено знаковое разбиение по x и a и задача сведена к анализу соответствующих ветвей функции. Подсчёт корней не доведён до достаточно обоснованного ответа."
        },
        {
          "points": 0,
          "criterion": "Оснований для предыдущих оценок нет."
        }
      ],
      "criteriaUrl": "https://sdamgia.online/documents/ege-2027/demoversiya-ege-2027-matematika-profilnyj-uroven.pdf#page=16"
    }
  },
  {
    "id": 19,
    "title": "Числа и их свойства",
    "detailed": true,
    "maxPoints": 4,
    "t": {
      "text": "<p>На доске записали семь различных положительных целых чисел. Все эти числа дают один и тот же остаток при делении на 5.</p><p><b>а)</b> Может ли сумма чисел равняться 137?</p><p><b>б)</b> Может ли сумма чисел равняться 110?</p><p><b>в)</b> Сумма чисел равна 237. Какое наибольшее значение может иметь наименьшее из записанных чисел?</p>",
      "hint": "Сначала свяжите остаток суммы с общим остатком каждого слагаемого. Для пункта в) сравните сумму с арифметической прогрессией из семи членов.",
      "model": [
        "<b>а)</b> Да. Числа 1, 6, 11, 16, 21, 26, 56 положительные, различны, имеют остаток 1 и в сумме дают 137.",
        "<b>б)</b> Если общий остаток r, сумма семи чисел имеет остаток 7r по модулю 5. При сумме 110 из 7r ≡ 0 (mod 5) следует r = 0. Семь наименьших различных положительных кратных пяти — 5, 10, …, 35 — имеют сумму 140. Поэтому сумма 110 невозможна.",
        "<b>в)</b> Так как 237 имеет остаток 2, то 7r ≡ 2 (mod 5), значит, r = 1. Если наименьшее число m, следующие числа не меньше m + 5, m + 10, …, m + 30. Отсюда 237 ≥ 7m + 105, то есть m ≤ 132/7. Наибольшее положительное целое число с остатком 1, не превосходящее эту границу, равно 16.",
        "Оценка достигается: числа 16, 21, 26, 31, 36, 41, 66 различны, положительны, имеют остаток 1 и в сумме дают 237. Их минимум равен 16."
      ],
      "answerLine": "Ответ. а) да. б) нет. в) 16.",
      "visual": "",
      "rubric": [
        {
          "points": 4,
          "criterion": "Обоснованы все три пункта. В в) есть и оценка сверху, и её достигающий пример."
        },
        {
          "points": 3,
          "criterion": "Полностью решён в) и обоснован хотя бы один из а) и б)."
        },
        {
          "points": 2,
          "criterion": "Обоснованы а) и б); либо полностью решён в)."
        },
        {
          "points": 1,
          "criterion": "Обоснован а) или б)."
        },
        {
          "points": 0,
          "criterion": "Оснований для предыдущих оценок нет. Для в) одна граница без подходящего набора или один набор без доказательства максимальности не завершает этот пункт."
        }
      ],
      "criteriaUrl": "https://sdamgia.online/documents/ege-2027/demoversiya-ege-2027-matematika-profilnyj-uroven.pdf#page=17"
    }
  }
]);

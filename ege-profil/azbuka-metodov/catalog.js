(() => {
  'use strict';

  const list = [
    {
      id: 'random-variables', title: 'Случайные величины', short: 'Случайные величины', numbers: [6],
      description: 'От исходов и таблицы вероятностей к ожиданию и разбросу.',
      skills: {
        distribution: { title: 'Собираю распределение', numbers: [6] },
        expectation: { title: 'Нахожу математическое ожидание', numbers: [6] },
        variance: { title: 'Считаю дисперсию и стандартное отклонение', numbers: [6] }
      },
      refs: [['Вероятность, №4–5', '/ege-profil/trainers/probability-t45.html']]
    },
    {
      id: 'modeling', title: 'Математическое моделирование', short: 'Моделирование', numbers: [10, 11, 13, 17],
      description: 'Переведи условие в математическую запись и проверь результат.',
      skills: {
        'choose-variable': { title: 'Выражаю величину через переменную', numbers: [10, 11, 13, 17] },
        constraints: { title: 'Учитываю ограничения из условия', numbers: [10, 11, 13, 17] },
        optimum: { title: 'Выбираю лучший допустимый вариант', numbers: [17] }
      },
      refs: [['Производная и интеграл, №9', '/ege-profil/start/index.html#calm/9']]
    },
    {
      id: 'domain', title: 'ОДЗ и отбор решений', short: 'ОДЗ и отбор', numbers: [7, 14, 16, 19],
      description: 'Запиши ограничения и проверь кандидатов в исходной задаче.',
      skills: {
        denominator: { title: 'Исключаю нули знаменателя', numbers: [7, 14, 16, 19] },
        squaring: { title: 'Проверяю корни после возведения в квадрат', numbers: [7, 14] },
        'root-selection': { title: 'Отбираю корни на заданном отрезке', numbers: [14] }
      },
      refs: [['Тригонометрия и отбор корней', '/ege-profil/trigonometry/']]
    },
    {
      id: 'interval-signs', title: 'Знаки и метод интервалов', short: 'Метод интервалов', numbers: [16, 19],
      description: 'Отметь границы, проверь знаки и собери ответ с учётом ОДЗ.',
      skills: {
        'mark-points': { title: 'Различаю нули и исключённые точки', numbers: [16, 19] },
        'test-sign': { title: 'Определяю знак между границами', numbers: [16, 19] },
        'intersect-domain': { title: 'Пересекаю ответ с ограничениями', numbers: [16, 19] }
      },
      refs: [
        ['Тренажёр метода интервалов', '/ege-profil/trainers/interval-method.html'],
        ['Логарифмические неравенства', '/trainers/ege-profile/log-inequalities/']
      ]
    },
    {
      id: 'transformations', title: 'Алгебраические преобразования', short: 'Преобразования', numbers: [8, 14, 16],
      description: 'Разложи выражение, сократи дробь или введи замену.',
      skills: {
        'common-factor': { title: 'Выношу общий множитель', numbers: [8, 14, 16] },
        'difference-squares': { title: 'Сокращаю через разность квадратов', numbers: [8, 14, 16] },
        substitution: { title: 'Делаю замену переменной', numbers: [14, 16] }
      },
      refs: [['Практикум по выражениям, №8', '/ege-profil/start/index.html#calm/8']]
    },
    {
      id: 'space-drawing', title: 'Чтение пространственного чертежа', short: 'Чертёж в 3D', numbers: [3, 15],
      description: 'Найди грань, проекцию и угол с плоскостью на чертеже.',
      skills: {
        'find-face': { title: 'Нахожу диагональ грани', numbers: [3, 15] },
        projection: { title: 'Строю ортогональную проекцию', numbers: [3, 15] },
        'line-plane-angle': { title: 'Нахожу угол прямой с плоскостью', numbers: [3, 15] }
      },
      refs: [
        ['Атанасян 10–11', '/ege-profil/atanasyan-10-11/'],
        ['Сечения с нуля', '/stereo-course/sections/']
      ]
    },
    {
      id: 'plane-constructions', title: 'Дополнительные построения в планиметрии', short: 'Построения', numbers: [1, 18],
      description: 'Проведи линию, которая даёт нужное свойство или новый треугольник.',
      skills: {
        height: { title: 'Провожу высоту к нужной стороне', numbers: [1, 18] },
        parallel: { title: 'Использую параллельную прямую для подобия', numbers: [1, 18] },
        radius: { title: 'Провожу радиус к точке касания', numbers: [1, 18] }
      },
      refs: [
        ['Планиметрия с доказательством', '/ege-profil/trainers/planimetry-t17.html'],
        ['Атанасян 7–9', '/geometry-course/textbook/']
      ]
    },
    {
      id: 'written-solution', title: 'Запись развёрнутого решения', short: 'Запись решения', numbers: [14, 15, 16, 17, 18, 19, 20],
      description: 'Обоснуй переход, проверь полноту разбора и запиши доказательство границы.',
      skills: {
        'justify-step': { title: 'Обосновываю переход в доказательстве', numbers: [15, 18] },
        'exhaust-cases': { title: 'Разбираю исключительные случаи', numbers: [14, 16, 17, 19] },
        'bound-and-example': { title: 'Доказываю границу и даю пример', numbers: [20] }
      },
      refs: [
        ['Оценка плюс пример · 8 уроков', '/trainers/ege-methods.html'],
        ['Тренажёр «Проверь как эксперт»', '/ege-profil/trainers/expert.html']
      ]
    },
    {
      id: 'coordinate-method', title: 'Метод координат в стереометрии', short: 'Метод координат', numbers: [15],
      description: 'Выбери оси, запиши координаты, найди углы и расстояние до плоскости.',
      route: true,
      skills: {
        axes: { title: 'Выбираю оси и читаю координаты', numbers: [15] },
        vector: { title: 'Нахожу координаты и длину вектора', numbers: [15] },
        normal: { title: 'Нахожу нормаль к плоскости', numbers: [15] },
        plane: { title: 'Составляю уравнение плоскости', numbers: [15] },
        'line-angle': { title: 'Нахожу угол прямой с плоскостью', numbers: [15] },
        'plane-angle': { title: 'Нахожу острый или прямой угол между плоскостями', numbers: [15] },
        distance: { title: 'Вычисляю расстояние до плоскости', numbers: [15] }
      },
      refs: [
        ['Векторы с нуля', '/ege-profil/start/index.html#calm/2'],
        ['Атанасян 10–11', '/ege-profil/atanasyan-10-11/'],
        ['№15 · угол прямой с плоскостью', '/ege-profil/part-two/index.html#lesson/p2-15-line-plane'],
        ['№15 · расстояние до плоскости', '/ege-profil/part-two/index.html#lesson/p2-15-distance']
      ]
    },
    {
      id: 'function-atlas', title: 'Функции и графики для задач с параметром', short: 'Функции и графики', numbers: [19],
      description: 'Найди допустимые x и возможные y. Проследи, как меняется график и число пересечений с горизонталью.',
      route: true,
      atlas: true,
      next: 'parameter-methods',
      skills: {
        reading: { title: 'Читаю точки графика', numbers: [19] },
        domain: { title: 'Нахожу общую область определения', numbers: [19] },
        shifts: { title: 'Учитываю сдвиг и отражение графика', numbers: [19] },
        range: { title: 'Проверяю возможные значения функции', numbers: [19] }
      },
      refs: [
        ['Функции и графики · №12', '/ege-profil/start/index.html#calm/12'],
        ['Функции в формулах и на графиках', '/ege-profil/trainers/functions-t1112.html']
      ]
    },
    {
      id: 'parameter-methods', title: 'Методы решения задач с параметром', short: 'Методы параметров', numbers: [19],
      description: 'Определи, где меняется число решений. Проверь особые значения и вернись к исходному условию.',
      route: true,
      atlas: true,
      skills: {
        level: { title: 'Считаю пересечения графика с уровнем', numbers: [19] },
        divide: { title: 'Проверяю нулевой коэффициент до деления', numbers: [19] },
        degree: { title: 'Различаю потерю степени и двойной корень', numbers: [19] },
        'root-position': { title: 'Проверяю, где лежат корни', numbers: [19] },
        plateau: { title: 'Распознаю горизонтальный участок графика', numbers: [19] },
        hole: { title: 'Исключаю выколотую точку', numbers: [19] },
        tangent: { title: 'Проверяю касание прямой и окружности', numbers: [19] },
        restore: { title: 'Возвращаюсь от замены к исходным решениям', numbers: [19] }
      },
      refs: [
        ['Прежний практикум по задачам с параметром', '/ege-profil/trainers/parameters-18/'],
        ['№19 · дискриминант и положительные корни', '/ege-profil/part-two/index.html#lesson/param-positive-roots'],
        ['№19 · модули и число решений', '/ege-profil/part-two/index.html#lesson/param-modules'],
        ['№19 · касание', '/ege-profil/part-two/index.html#lesson/param-tangent']
      ]
    }
  ];

  const path = '/ege-profil/azbuka-metodov/';
  const index = Object.fromEntries(list.map(alphabet => [alphabet.id, alphabet]));
  const numbers = number => Number.isInteger(number) && number >= 1 && number <= 20;
  const exactTask = /^#task\/[a-z0-9-]+\/(?:guided|plan|independent)$/;
  const sourceTask = /^#(?:calm|example|exam)\/[a-z0-9-]+$|^#(?:lesson\/[a-z0-9-]+|(?:practice|repair)\/[a-z0-9-]+\/(?:guided|plan|independent))$/;
  const trainerPath = /^\/ege-profil\/trainers\/(?:[a-z0-9-]+\.html|[a-z0-9-]+\/index\.html)$|^\/trainers\/ege-profile\/[a-z0-9-]+(?:\.html|\/(?:index\.html)?)$/;

  function examHref(number) {
    return number <= 13 ? '/ege-profil/start/index.html#calm/' + number :
      '/ege-profil/part-two/index.html#exam/' + number;
  }

  function safeBack(input) {
    if (typeof input !== 'string' || !input.startsWith('/') || input.length > 320) return '';
    const origin = 'https://mathexam.space';
    let url;
    try { url = new URL(input, origin); } catch { return ''; }
    if (url.origin !== origin) return '';
    if (url.searchParams.has('skills')) url.searchParams.delete('skills');
    const partTwo = ['/ege-profil/part-two/', '/ege-profil/part-two/index.html'].includes(url.pathname);
    const start = ['/ege-profil/start/', '/ege-profil/start/index.html'].includes(url.pathname);
    const safePartTwo = partTwo && (exactTask.test(url.hash) || /^#(?:exam\/\d{1,2}|lesson\/[a-z0-9-]+|map|progress)$/.test(url.hash));
    if (!safePartTwo && !(start && sourceTask.test(url.hash)) && !trainerPath.test(url.pathname)) return '';
    return url.pathname + url.search + url.hash;
  }

  function href(id = '', skill = '', number, back = '', base = path) {
    const query = new URLSearchParams();
    if (numbers(Number(number))) query.set('exam', String(number));
    const returnPath = safeBack(back);
    if (returnPath) query.set('back', returnPath);
    return base + (query.size ? '?' + query : '') + (id ? '#/' + id + (skill ? '/' + skill : '') : '');
  }

  function forNumber(number) {
    return list.filter(alphabet => alphabet.numbers.includes(Number(number)));
  }

  globalThis.ProfileAlphabetCatalog = { path, list, index, examHref, href, forNumber, safeBack };
})();

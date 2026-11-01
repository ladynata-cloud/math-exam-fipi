/* Supported course entries for the existing pupil profile. No account data. */
(function (root, factory) {
  'use strict';
  const value = factory();
  if (typeof module === 'object' && module.exports) module.exports = value;
  else root.LearningCourseProgram = value;
})(typeof globalThis === 'undefined' ? this : globalThis, function () {
  'use strict';
  const MAX_COURSES = 24;
  const directions = Object.freeze({
    school: 'Школьная математика', foundations: 'Восполнить пробелы',
    oge: 'Подготовка к ОГЭ', ege: 'ЕГЭ · базовый уровень',
    'ege-profile': 'ЕГЭ · профильный уровень', vilenkin6: '6 класс · Виленкин'
  });
  const storageLabels = Object.freeze({
    server: 'Задания, открытые в кабинете, сохраняются и доступны после входа с другого устройства. У отдельных материалов на сайте — сохранение в браузере.',
    browser: 'Решения сохраняются в этом браузере. На общем устройстве записи могут быть общими; на другом устройстве они не появятся автоматически.',
    'account-browser': 'Записи сохраняются в этом браузере отдельно для ученика. Их можно скачать из курса.'
  });
  const definitions = [
    { id: 'vilenkin6-textbook', title: 'Виленкин · 6 класс · задания учебника', grades: [6], directions: ['school','vilenkin6','foundations'],
      description: 'Правила, разборы по шагам и самостоятельные задания первой части учебника.',
      storage: 'server', route: 'vilenkin-textbook', publicPath: '/courses/vilenkin-6-part-1/textbook.html' },
    { id: 'vilenkin6-legacy', title: 'Виленкин · 6 класс · тематические занятия', grades: [6], directions: ['school','vilenkin6','foundations'],
      description: 'Занятия по темам и повторение. Ранее начатые работы остаются доступны.',
      storage: 'server', route: 'vilenkin-legacy', publicPath: '/courses/vilenkin-6-part-1/' },
    { id: 'foundations', title: 'Математические основы', grades: [5,6,7,8,9], directions: ['foundations','school','oge'],
      description: 'Числа, дроби, вычисления и задачи: от понятного действия к самостоятельному решению.',
      storage: 'server', route: 'program-course=foundations', course: 'foundations', publicPath: '/foundations/' },
    { id: 'division', title: 'Умножение и деление по шагам', grades: [3,4,5,6,7], directions: ['school','foundations','oge'],
      description: 'Понятные этапы вычислений, подбор цифры и тренировка самостоятельного решения.',
      storage: 'server', route: 'division-course', publicPath: '/trainers/oge-basics/multiplication-division/division-course.html' },
    { id: 'school7', title: '7 класс · алгебра и геометрия', grades: [7], directions: ['school','foundations'],
      description: 'Уравнения, геометрические задачи и повторение основ с сохранением каждой работы.',
      storage: 'server', route: 'program-course=school7', course: 'school', publicPath: '/grade7/' },
    { id: 'oge', title: 'Подготовка к ОГЭ', grades: [8,9], directions: ['oge'],
      description: 'Учебный маршрут к выбранной цели и тренировка задач по темам.',
      storage: 'server', route: 'program-course=oge', course: 'oge', publicPath: '/oge/' },
    { id: 'ege-base', title: 'ЕГЭ · базовая математика', grades: [10,11], directions: ['ege'],
      description: 'Тематические задания, продолжение начатых работ и проверочные задания в кабинете.',
      storage: 'server', route: 'program-course=ege-base', course: 'ege', publicPath: '/ege-baza/' },
    { id: 'ege-profile', title: 'ЕГЭ · профильная математика', grades: [10,11], directions: ['ege-profile'],
      description: 'Каталог заданий и полный курс профильной подготовки с разборами и повторением.',
      storage: 'browser', route: 'program-course=ege-profile', course: 'ege-profile', publicPath: '/ege-profil/start/' },
    { id: 'number-theory', title: 'НОК и НОД', grades: [5,6,7], directions: ['school','foundations'],
      description: 'Отдельные тренажёры поиска наименьшего общего кратного и наибольшего общего делителя.',
      storage: 'browser', route: 'program-course=number-theory', publicPath: '/trainers/grade6-nok.html' },
    { id: 'atanasyan-first-steps', title: 'Атанасян · первые темы и построения', grades: [7], directions: ['school'],
      description: 'Начальный курс геометрии в кабинете и сборник самостоятельных и контрольных Иченской.',
      storage: 'account-browser', route: 'atanasyan-course', publicPath: '/geometry-course/first-steps/' },
    { id: 'atanasyan7-9', title: 'Атанасян · геометрия 7–9', grades: [7,8,9], directions: ['school','oge'],
      description: 'Опубликованные главы курса к учебнику: теория, задачи, чертежи и разборы.',
      storage: 'browser', publicPath: '/geometry-course/textbook/' },
    { id: 'atanasyan10-11', title: 'Атанасян · геометрия 10–11', grades: [10,11], directions: ['school','ege','ege-profile'],
      description: 'Опубликованные разделы стереометрии: задачи, объяснения и пространственные модели.',
      storage: 'browser', publicPath: '/stereo-course/textbook/' },
    { id: 'peterson5', title: 'Петерсон · 5 класс', grades: [5], directions: ['school','foundations'],
      description: 'Темы курса, наглядные модели и тренировка вычислений.',
      storage: 'browser', publicPath: '/school/peterson5/' },
    { id: 'peterson6', title: 'Петерсон · 6 класс', grades: [6], directions: ['school','foundations'],
      description: 'Опубликованные темы курса, разборы задач и отдельная тренировка трудных вычислений.',
      storage: 'browser', route: 'peterson-course', publicPath: '/school/peterson6/' },
    { id: 'maxim-peterson6', title: 'Петерсон · тренировки по темам', grades: [6], directions: ['school','foundations'],
      description: 'Линейка тренажёров по движению, процентам, совместной работе и вычислениям.',
      storage: 'browser', route: 'peterson-line', publicPath: '/trainers/maxim-peterson6/' },
    { id: 'makarychev7', title: 'Макарычев · алгебра 7 класса', grades: [7], directions: ['school'],
      description: 'Темы учебника, теория, разобранные задачи и самостоятельная практика.',
      storage: 'browser', publicPath: '/school/makarychev7/' },
    { id: 'makarychev8', title: 'Макарычев · алгебра 8 класса', grades: [8], directions: ['school','oge'],
      description: 'Учебные темы, разборы, упражнения и модели для проверки понимания.',
      storage: 'browser', publicPath: '/school/makarychev8/' },
    { id: 'alimov10-11', title: 'Алимов · алгебра 10–11', grades: [10,11], directions: ['school','ege','ege-profile'],
      description: 'Опубликованные темы алгебры и начал анализа с заданиями и разборами.',
      storage: 'browser', publicPath: '/school/alimov10-11/' },
    { id: 'nikolsky10', title: 'Никольский · алгебра 10 класса', grades: [10], directions: ['school','ege-profile'],
      description: 'Курс к учебнику: объяснения, задания и самостоятельная работа.',
      storage: 'browser', publicPath: '/school/nikolsky10/' },
    { id: 'merzlyak-10-base', title: 'Мерзляк · геометрия 10 класса', grades: [10], directions: ['school','ege'],
      description: 'Базовый курс стереометрии с задачами, самопроверкой и моделями.',
      storage: 'browser', publicPath: '/stereo-course/merzlyak-10-base/' },
    { id: 'ege-base-11-13', title: 'ЕГЭ база · пространственные тела', grades: [10,11], directions: ['ege'],
      description: 'Задания №11 и №13: объёмы, поверхности, сосуды и стереометрия.',
      storage: 'browser', route: 'program-course=ege-base-11-13', publicPath: '/ege-baza/path/index.html#lesson=box' },
    { id: 'college-functions', title: 'Графики функций · колледж', grades: [], directions: ['school','ege-profile'],
      description: 'Построение и исследование графиков: от парабол до функций по частям.',
      storage: 'browser', publicPath: '/trainers/college-functions/' }
  ];
  const courses = Object.freeze(definitions.map(item => Object.freeze({ ...item,
    grades: Object.freeze(item.grades), directions: Object.freeze(item.directions),
    storageLabel: storageLabels[item.storage], publicURL: 'https://mathexam.space' + item.publicPath
  })));
  const byId = new Map(courses.map(course => [course.id, course]));
  const get = id => typeof id === 'string' ? byId.get(id) || null : null;
  const selected = profile => Array.isArray(profile?.program?.courseIds)
    ? profile.program.courseIds.map(get).filter(Boolean) : [];
  const has = (profile, id) => selected(profile).some(course => course.id === id);
  return Object.freeze({ MAX_COURSES, directions, courses, get, selected, has });
});

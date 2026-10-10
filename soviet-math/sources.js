/* Topic-level references, not attributions of the course's original exercises.
 * Page numbers refer to the printed edition (not the PDF page index).
 * Verified against the 1959 scan, and the 1961/1966 contents
 * and digitized text at the URLs below. A page marks a section start unless
 * several pages are explicitly listed. No textbook exercise numbers are used.
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SovietSources = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var exerciseNote = 'Авторское упражнение по теме указанного раздела. Формулировка и числа подготовлены для тренажёра.';
  var books = {
    'pchelko-1-1959': {
      title: 'Арифметика. Учебник для первого класса начальной школы',
      authors: 'А. С. Пчёлко, Г. Б. Поляк',
      grade: '1 класс',
      year: 1959,
      edition: '5-е издание',
      publisher: 'Москва: Учпедгиз',
      url: 'https://sheba.spb.ru/shkola/arifmetika1959.htm',
      bibliographyUrl: 'https://ci.nii.ac.jp/ncid/BA88466854',
      shortTitle: 'Пчёлко, Поляк · 1 класс · 1959'
    },
    'pchelko-2-1961': {
      title: 'Арифметика. Учебник для 2-го класса',
      authors: 'А. С. Пчёлко, Г. Б. Поляк',
      grade: '2 класс',
      year: 1961,
      edition: '8-е издание, исправленное',
      publisher: 'Москва: Учпедгиз',
      url: 'https://sheba.spb.ru/shkola/arifmetika2-1961.htm',
      textUrl: 'https://djvu.online/file/KododQusycrxE',
      shortTitle: 'Пчёлко, Поляк · 2 класс · 1961'
    },
    'princev-5-6-1966': {
      title: 'Арифметика. Учебник для 5–6 классов средней школы',
      authors: 'Н. А. Принцев, М. И. Ягодовский',
      grade: '5–6 классы',
      year: 1966,
      publisher: 'Москва: Просвещение',
      url: 'https://sheba.spb.ru/shkola/arifmetika-56-1966.htm',
      textUrl: 'https://djvu.online/file/yNt72VCVsNqRk',
      shortTitle: 'Принцев, Ягодовский · 5–6 классы · 1966'
    }
  };

  function reference(bookId, section, pages) {
    return Object.freeze({ bookId: bookId, section: section, pages: pages, task: null });
  }
  var p1 = 'pchelko-1-1959', p2 = 'pchelko-2-1961', a = 'princev-5-6-1966';
  var topics = {
    'bonds': reference(p1, 'Первый десяток. Сложение и вычитание', '30'),
    'compare': reference(p1, 'Первый десяток', null),
    'add-ten': reference(p1, 'Первый десяток. Сложение и вычитание', '30'),
    'subtract-ten': reference(p1, 'Первый десяток. Сложение и вычитание', '30'),
    'add-twenty': reference(p1, 'Сложение с переходом через десяток', '79'),
    'subtract-twenty': reference(p1, 'Вычитание с переходом через десяток', '84'),
    'place-value': reference(p2, 'Первая сотня. Нумерация в пределах 100; Тысяча. Устная и письменная нумерация', '10, 130, 132'),
    'stories': reference(p1, 'Задачи в 2 действия; в тренажёре — продолжение до 3 действий', '77'),
    'groups': reference(p1, 'Умножение', '97'),
    'sharing': reference(p1, 'Деление', '113'),
    'times-table': reference(p2, 'Таблица умножения и деления', '56'),
    'column-add': reference(a, '§ 7. Сложение многозначных чисел. Проверка сложения', '24'),
    'column-subtract': reference(a, '§ 11. Вычитание многозначных чисел', '29'),
    'column-multiply': reference(a, '§ 17. Умножение многозначных чисел', '40'),
    'order': reference(a, '§ 32. Порядок выполнения арифметических действий', '70'),
    'divide-simple': reference(a, '§ 22. Деление многозначных чисел', '47'),
    'divide-zero': reference(a, '§ 22. Деление многозначных чисел', '48'),
    'divide-remainder': reference(a, '§ 20. Деление; § 23. Проверка умножения и деления', '46, 50'),
    'divide-two': reference(a, '§ 22. Деление многозначных чисел', '47'),
    'divide-decimal-natural': reference(a, '§ 102. Деление натурального числа и десятичной дроби на натуральное число', '238'),
    'fraction-meaning': reference(a, '§ 50. Введение дробных чисел при измерении; § 51. Запись дроби', '108, 109'),
    'fraction-reduce': reference(a, '§ 61. Сокращение дроби', '121'),
    'fraction-add': reference(a, '§ 62. Общий знаменатель; § 63. Сложение дробей', '123, 127'),
    'fraction-multiply': reference(a, '§ 70. Умножение дроби на дробь', '150'),
    'fraction-divide': reference(a, '§ 75. Взаимно обратные числа; § 77. Деление на дробь', '165, 169'),
    'decimal-add': reference(a, '§ 99. Сложение десятичных дробей', '228'),
    'divide-decimal': reference(a, '§ 103. Деление на десятичную дробь', '240'),
    'percent-part': reference(a, '§ 145. Нахождение процентов числа; §§ 152–154. Пропорции', '352, 376, 378, 381'),
    'percent-whole': reference(a, '§ 146. Нахождение числа по его процентам; §§ 152–154. Пропорции', '355, 376, 378, 381'),
    'percent-ratio': reference(a, '§ 147. Процентное отношение двух чисел; §§ 152–154. Пропорции', '359, 376, 378, 381')
  };

  // Batch two: references for the thirty additional topics.
  // These remain topic references for original exercises, never book task IDs.
  Object.assign(topics, {
    'number-neighbors': reference(a, '§ 1. Счёт как основа арифметики. Натуральный ряд чисел', '5'),
    'zero-actions': reference(a, '§ 6. Сложение и его законы; § 10. Вычитание; § 15. Умножение; § 21. Деление нуля и деление на нуль', '20, 28, 35, 47'),
    'compare-three-digit': reference(a, '§ 1. Натуральный ряд чисел; § 2. Нумерация многозначных чисел', '5, 6'),
    'add-round-tens': reference(p1, 'Сложение круглых десятков', '130'),
    'subtract-round-tens': reference(p1, 'Вычитание круглых десятков', '131'),
    'add-two-digit-mental': reference(p2, 'Сложение и вычитание в пределах 100 без перехода и с переходом через десяток', '20, 35'),
    'subtract-two-digit-mental': reference(p2, 'Сложение и вычитание в пределах 100 без перехода и с переходом через десяток', '20, 35'),
    'multiply-by-ten-hundred': reference(a, '§ 17. Умножение многозначных чисел', '40'),
    'divide-by-ten-hundred': reference(a, '§ 96. Уменьшение натурального числа в 10, 100, 1000 и т. д. раз', '223'),
    'unknown-addend': reference(p2, 'Задачи на нахождение неизвестного слагаемого', null),
    'fraction-compare-same-den': reference(a, '§ 57. Сравнение дробей по величине', '116'),
    'fraction-compare-same-num': reference(a, '§ 57. Сравнение дробей по величине', '116, 117'),
    'fraction-equivalent': reference(a, '§ 60. Основное свойство дроби', '120'),
    'fraction-to-mixed': reference(a, '§ 56. Выражение неправильной дроби натуральным или смешанным числом', '114'),
    'mixed-to-fraction': reference(a, '§ 55. Выражение натурального или смешанного числа неправильной дробью', '113'),
    'fraction-subtract': reference(a, '§ 65. Вычитание дробей', '132'),
    'mixed-add-same-den': reference(a, '§ 63. Сложение дробей', '128'),
    'mixed-subtract-borrow': reference(a, '§ 65. Вычитание дробей', '133'),
    'fraction-of-number': reference(a, '§ 68. Нахождение дроби числа', '142'),
    'number-from-fraction': reference(a, '§ 74. Нахождение числа по его дроби', '163'),
    'decimal-place-value': reference(a, '§ 92. Значение цифр после запятой в десятичной дроби', '218'),
    'decimal-compare': reference(a, '§ 94. Сравнение десятичных дробей по величине', '221'),
    'decimal-subtract': reference(a, '§ 100. Вычитание десятичных дробей', '231'),
    'decimal-multiply': reference(a, '§ 101. Умножение десятичных дробей', '234'),
    'decimal-multiply-ten': reference(a, '§ 95. Изменение десятичной дроби при переносе запятой', '222, 223'),
    'decimal-divide-ten': reference(a, '§ 95. Изменение десятичной дроби при переносе запятой', '222, 223'),
    'measure-length': reference(a, '§ 3. Метрическая система мер. Меры длины', '10'),
    'measure-time': reference(a, 'Таблицы наиболее употребительных единиц измерения. Меры времени', '421'),
    'motion-distance': reference(a, '§ 69. Умножение натурального числа на дробь: пример нахождения пути по скорости и времени', '147'),
    'motion-speed': reference(a, '§ 119. Отношение двух величин: средняя скорость', '284')
  });

  function forTopic(id) {
    if (!Object.prototype.hasOwnProperty.call(topics, id)) return null;
    var topic = topics[id], book = books[topic.bookId];
    return {
      bookTitle: book.title,
      authors: book.authors,
      grade: book.grade,
      year: book.year,
      section: topic.section,
      pages: topic.pages,
      url: book.url,
      label: 'Авторское упражнение · тема по учебнику · ' + book.shortTitle + (topic.pages ? ' · с. ' + topic.pages : ''),
      exerciseNote: exerciseNote,
      task: null
    };
  }

  Object.keys(books).forEach(function (id) { Object.freeze(books[id]); });
  return Object.freeze({ books: Object.freeze(books), topics: Object.freeze(topics), forTopic: forTopic });
}));

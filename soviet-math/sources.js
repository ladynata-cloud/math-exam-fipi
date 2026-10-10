/* Topic-level references, not attributions of the course's original exercises.
 * Page numbers refer to the printed edition (not the PDF page index).
 * Verified 2026-10-11 against the 1959 scan, and the 1961/1966 contents
 * and digitized text at the URLs below. A page marks a section start unless
 * several pages are explicitly listed. No textbook exercise numbers are used.
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SovietSources = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var exerciseNote = 'Авторские упражнения по теме. Указаны страницы раздела учебника.';
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
    'place-value': reference(p2, 'Тысяча. Устная нумерация; письменная нумерация', '130, 132'),
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
      label: 'Авторский пример · Арифметика · ' + book.shortTitle + (topic.pages ? ' · с. ' + topic.pages : ''),
      exerciseNote: exerciseNote,
      task: null
    };
  }

  Object.keys(books).forEach(function (id) { Object.freeze(books[id]); });
  return Object.freeze({ books: Object.freeze(books), topics: Object.freeze(topics), forTopic: forTopic });
}));

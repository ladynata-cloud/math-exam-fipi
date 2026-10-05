/* Public course navigation. Opening a link never starts or grades an attempt. */
(function () {
  'use strict';
  const catalog = window.LearningCatalog;
  const host = document.getElementById('new-practice-list');
  if (!catalog || !host) return;
  const subjects = [
    ['algebra', 'Алгебра', 'От смысла выражения к проверке корня'],
    ['geometry', 'Геометрия', 'Читаем рисунок и объясняем связь'],
    ['foundation', 'Вспомнить основу', 'Возвращаемся к одному трудному действию']
  ];
  const descriptions = {
    'expression-structure': 'Увидеть порядок действий и роль скобок.',
    'opposite-expression': 'Применить минус к каждому слагаемому.',
    'two-variable-collect': 'Собрать отдельно слагаемые с x, с y и числа.',
    'substitution-negative-fraction': 'Подставить число со знаком и сохранить точную дробь.',
    'equation-two-brackets': 'Раскрыть обе скобки, собрать слагаемые и проверить корень.',
    'equation-denominators': 'Умножить обе части целиком на общий знаменатель.',
    'equation-decimals': 'Перейти от десятичных коэффициентов к целым.',
    'equation-word-perimeter': 'Выразить стороны прямоугольника и составить уравнение.',
    'segment-order': 'Сначала определить порядок точек, затем найти длину.',
    'midpoint-chain': 'Использовать середину отрезка и отметки равенства.',
    'angle-naming': 'Выбрать вершину и правильно прочитать название угла.',
    'angle-addition': 'Найти целый угол или его недостающую часть.',
    'angle-bisector': 'Узнать, какие именно углы делит пополам биссектриса.',
    'adjacent-equation': 'Составить уравнение из суммы смежных углов.',
    'vertical-chain': 'Различить вертикальные и смежные пары.',
    'triangle-correspondence': 'Сопоставить элементы уже равных треугольников.',
    'mixed-borrow': 'Разменять единицу перед вычитанием смешанных чисел.',
    'fraction-product-cancel': 'Сократить общие множители перед умножением.',
    'fraction-division-meaning': 'Понять, сколько частей заданного размера помещается.',
    'decimal-place-align': 'Совместить разряды и не потерять нули.',
    'decimal-divisor-scale': 'Изменить делимое и делитель в одинаковое число раз.',
    'signed-fraction-sum': 'Привести доли к одному размеру и разобраться со знаком.',
    'ratio-units': 'Перевести величины в одинаковые единицы перед сравнением.',
    'percent-proportion': 'Выбрать целое за 100% и составить пропорцию.'
  };
  const node = (tag, text, className) => {
    const element = document.createElement(tag);
    if (text) element.textContent = text;
    if (className) element.className = className;
    return element;
  };
  const groups = [];
  for (const [subject, title, subtitle] of subjects) {
    const entries = catalog.items.filter(item => item.grade7 && item.subject === subject);
    const section = node('section', '', 'practice-strand');
    section.id = 'new-' + subject;
    section.append(node('h3', title), node('p', subtitle, 'small'));
    const grid = node('div', '', 'practice-grid');
    for (const item of entries) {
      const card = node('article', '', 'practice-card');
      card.append(node('h4', item.title));
      const suffix = item.contentId.replace(/^grade7-[agb]-/, '');
      card.append(node('p', descriptions[suffix] || item.title));
      const actions = node('div', '', 'practice-actions');
      const cabinet = node('a', 'Открыть в кабинете →', 'practice-primary');
      cabinet.href = 'https://mathexam-board-ladynata.amvera.io/learning/#practice=' + encodeURIComponent(item.id);
      const preview = node('a', 'Попробовать без входа', 'practice-preview');
      const url = new URL(item.url, 'https://mathexam.space');
      url.searchParams.set('practice', '1');
      preview.href = url.pathname + url.search + url.hash;
      actions.append(cabinet, preview); card.append(actions); grid.append(card);
    }
    section.append(grid); host.append(section); groups.push({ subject, section });
  }
  function filter(subject) {
    const value = subjects.some(row => row[0] === subject) ? subject : 'all';
    groups.forEach(group => { group.section.hidden = value !== 'all' && value !== group.subject; });
    document.querySelectorAll('[data-subject]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.subject === value));
    });
  }
  document.querySelectorAll('[data-subject]').forEach(button => {
    button.addEventListener('click', () => filter(button.dataset.subject));
  });
  function fromHash() {
    const subject = location.hash.match(/^#new-(algebra|geometry|foundation)$/)?.[1];
    if (subject) filter(subject);
    else if (location.hash === '#practice') filter('all');
  }
  window.addEventListener('hashchange', fromHash); fromHash();
  const videos = document.getElementById('new-video-topics');
  for (const guide of window.LearningTopicGuides?.items || []) {
    if (!guide.id.startsWith('grade7-') || !videos) continue;
    const link = node('a', guide.title);
    link.href = '../video-lessons/cheatsheets.html#' + encodeURIComponent(guide.id);
    videos.append(link);
  }
})();

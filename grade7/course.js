/* Public course navigation. Opening a link never starts or grades an attempt. */
(function () {
  'use strict';
  const catalog = window.LearningCatalog;
  const host = document.getElementById('new-practice-list');
  if (!catalog || !host) return;
  const routeHost = document.getElementById('study-route-map');
  if (routeHost && window.Grade7RouteMap) {
    routeHost.innerHTML = Grade7RouteMap.render({ catalog, guides: window.LearningTopicGuides });
    Grade7RouteMap.bind(routeHost);
  }
  const subjects = [
    ['algebra', 'Алгебра', 'От смысла выражения к проверке корня'],
    ['geometry', 'Геометрия', 'Читаем рисунок и объясняем связь'],
    ['foundation', 'Вспомнить основу', 'Возвращаемся к одному трудному действию'],
    ['pre7', 'Основы до 7 класса', 'Разряды и действия, смысл дробей, задачи и измерения. Выбери то, что хочется прояснить.']
  ];
  const descriptions = {
    "place-value": "Разобрать число на разряды и понять роль каждого нуля.",
    "natural-compare": "Сравнить количество цифр, затем нужный разряд.",
    "add-carry": "Увидеть, как десять единиц превращаются в один десяток.",
    "subtract-borrow": "Разменять сотню или тысячу, не потеряв нули.",
    "smart-calculation": "Объединить удобные числа и объяснить свой выбор.",
    "inverse-components": "Найти неизвестное число через обратное действие.",
    "divisibility": "Проверить признаки делимости по цифрам числа.",
    "scale-reading": "Определить цену деления и прочитать нужную отметку.",
    "comparison-stories": "Различить «на сколько» и «во сколько» в условии.",
    "fraction-line": "Найти равные доли и точки с дробными координатами.",
    "equivalent-fractions": "Разделить или объединить доли, сохранив ту же величину.",
    "fraction-compare": "Сравнить дроби и объяснить, какая доля больше.",
    "fraction-part-whole": "Найти часть, восстановить целое или вычислить остаток.",
    "decimal-compare": "Сопоставить разряды и не спутать длину записи с величиной.",
    "mass-capacity": "Перевести массу или вместимость в одинаковые единицы.",
    "ruler-length": "Измерить отрезок, даже если он начинается не с нуля.",
    "perimeter": "Обойти границу фигуры и найти неизвестную длину.",
    "grid-area": "Сосчитать квадратные единицы, включая фигуры с вырезом.",
    "core-point-line-ray": "Различить объекты по их границам и направлениям.",
    "core-perpendicular": "Найти прямой угол и перпендикулярные прямые.",
    "core-angle-measure": "Выбрать шкалу транспортира и прочитать угол.",
    "core-triangle-elements": "Связать вершины, стороны и углы по подписям.",
    "core-triangle-perimeter": "Сложить длины всех сторон или найти недостающую.",
    "core-sas": "Выделить две стороны и угол между ними.",
    "core-median": "Соединить вершину с серединой противоположной стороны.",
    "core-bisector": "Разделить угол треугольника на две равные части.",
    "core-altitude": "Провести перпендикуляр к стороне или её продолжению.",
    "core-isosceles-elements": "Определить равные стороны, основание и вершину.",
    "core-isosceles-base-angles": "Использовать равенство углов при основании.",
    "core-isosceles-vertex-line": "Различить и соединить свойства медианы, биссектрисы и высоты.",
    "practice-segment-equation": "Выбрать равенство из целого отрезка и его частей.",
    "practice-angle-parts": "Отделить нужный угол от соседних и использовать биссектрису.",
    "practice-vertical-proof": "Связать две смежные пары и объяснить равенство вертикальных углов.",
    "practice-sas-common-side": "Распознать общую сторону двух треугольников.",
    "practice-sas-vertical": "Использовать вертикальные углы в первом признаке равенства.",
    "practice-cevian-reason": "Проверить, какие условия подтверждают определение проведённой линии.",
    "practice-isosceles-perimeter": "Выразить равные стороны и проверить длину основания.",
    "practice-isosceles-proof": "Собрать цепочку утверждений и назвать основание каждого шага.",
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
    const entries = catalog.items.filter(item => item.grade7 && (subject === 'pre7' ? item.pre7 : !item.pre7 && item.subject === subject));
    const section = node('section', '', 'practice-strand');
    section.id = 'new-' + subject;
    section.append(node('h3', title), node('p', subtitle, 'small'));
    const grid = node('div', '', 'practice-grid');
    for (const item of entries) {
      const card = node('article', '', 'practice-card');
      card.append(node('h4', item.title));
      const suffix = item.contentId.replace(/^(?:grade7-[agb]-|pre7-)/, '');
      card.append(node('p', descriptions[suffix] || item.title));
      const actions = node('div', '', 'practice-actions');
      const cabinet = node('a', 'Открыть в кабинете →', 'practice-primary');
      cabinet.href = 'https://mathexam-board-ladynata.amvera.io/learning/#practice=' + encodeURIComponent(item.id);
      const preview = node('a', 'Попробовать без входа', 'practice-preview');
      const url = new URL(item.url, 'https://mathexam.space');
      url.searchParams.set('practice', '1');
      preview.href = url.pathname + url.search + url.hash;
      actions.append(cabinet, preview);
      const guide = window.LearningTopicGuides?.forItem(item.id);
      if (guide) {
        const video = node('a', '▶ Разбор примера', 'practice-video');
        video.href = '../video-lessons/cheatsheets.html#' + encodeURIComponent(guide.id);
        const tutorial = node('a', 'Как пользоваться тренажёром', 'practice-video');
        tutorial.href = '../video-lessons/cheatsheets.html?type=trainer#' + encodeURIComponent(guide.id);
        actions.append(video, tutorial);
      }
      card.append(actions); grid.append(card);
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
    const subject = location.hash.match(/^#new-(algebra|geometry|foundation|pre7)$/)?.[1];
    if (subject) filter(subject);
    else if (location.hash === '#practice') filter('all');
  }
  window.addEventListener('hashchange', fromHash); fromHash();
  const videos = document.getElementById('new-video-topics');
  for (const guide of window.LearningTopicGuides?.items || []) {
    if ((!guide.id.startsWith('grade7-') && !guide.id.startsWith('pre7-')) || !videos) continue;
    const link = node('a', guide.title);
    link.href = '../video-lessons/cheatsheets.html#' + encodeURIComponent(guide.id);
    videos.append(link);
  }
})();

/* A collection of public practice links, not managed attempts. The explicit
 * handoff contains only public mathematical text; it cannot select an account,
 * provide an answer key or enable a provider. All input remains untrusted. */
(function (root) {
  'use strict';
  const cards = Object.freeze([
    Object.freeze({ id: 'oge-task15-triangles', topic: 'oge-triangles', number: 15,
      title: 'Треугольники', description: 'Углы, биссектрисы, стороны, подобие и теорема Пифагора.',
      action: 'Прочитай обозначения на рисунке. Выбери свойство и выполни одно действие.' }),
    Object.freeze({ id: 'oge-task16-circle', topic: 'oge-circle', number: 16,
      title: 'Окружность и связанные фигуры', description: 'Радиусы, углы, касательные и фигуры внутри или около окружности.',
      action: 'Отметь, где радиус, диаметр и искомый угол. Для площади сначала найди нужную длину.' }),
    Object.freeze({ id: 'oge-task17-quadrilaterals', topic: 'oge-quadrilaterals', number: 17,
      title: 'Четырёхугольники и площади', description: 'Параллелограмм, ромб, прямоугольник, квадрат и трапеция.',
      action: 'Различай сторону и высоту. В задаче со средней линией найди соответствующее основание.' }),
    Object.freeze({ id: 'oge-task18-grid', topic: 'oge-grid', number: 18,
      title: 'Геометрия на клетчатой бумаге', description: 'Длины, расстояния, углы и площади по рисунку на сетке.',
      action: 'Считай промежутки между линиями. Проверь размер клетки перед вычислением.' }),
    Object.freeze({ id: 'task19-trainer', topic: 'oge-statements', number: 19,
      title: 'Геометрические утверждения', description: 'Проверка свойств, рисунки и контрпримеры.',
      action: 'Для неверного утверждения найди контрпример. Затем проверь похожее утверждение самостоятельно.' })
  ]);
  const byTopic = new Map(cards.map(card => [card.topic, card]));
  const extra = Object.freeze([
    Object.freeze({ title: 'Внешний угол треугольника', url: 'https://mathexam.space/oge/geometry/task-15-external-angle.html' }),
    Object.freeze({ title: 'Единицы площади', url: 'https://mathexam.space/trainers/oge-basics/units-area.html' }),
    Object.freeze({ title: 'Единицы длины', url: 'https://mathexam.space/trainers/oge-basics/units-length-time.html' })
  ]);

  function readRoute(route) {
    if (typeof route !== 'string' || route.length > 8000 || route.startsWith('#')) return null;
    const params = new URLSearchParams(route), keys = [...params.keys()];
    if (new Set(keys).size !== keys.length) return null;
    if (keys.length === 1 && keys[0] === 'geometry') {
      const topic = params.get('geometry');
      if (topic !== '' && !byTopic.has(topic)) return null;
      return Object.freeze({ kind: 'collection', topic: topic || null, from: null, question: '' });
    }
    if (keys.length !== 3 || !keys.every(key => ['geometry-help', 'from', 'question'].includes(key))) return null;
    const topic = params.get('geometry-help'), from = params.get('from'), question = params.get('question');
    if (!byTopic.has(topic) || byTopic.get(topic).id !== from || typeof question !== 'string'
      || !question.trim() || question.length > 1000 || /[<>\u0000-\u001f\u007f-\u009f]/.test(question)
      || /(?:https?:|javascript:|data:|www\.|\S+@\S+)/i.test(question)) return null;
    return Object.freeze({ kind: 'transfer', topic, from, question: question.trim() });
  }
  function node(tag, text, attrs = {}) {
    const result = document.createElement(tag);
    if (text != null) result.textContent = text;
    for (const [key, value] of Object.entries(attrs)) result.setAttribute(key, value);
    return result;
  }
  function link(title, href, external = false, primary = false) {
    return node('a', title, { href, class: 'button' + (primary ? ' primary' : ''),
      ...(external ? { target: '_blank', rel: 'noopener noreferrer', referrerpolicy: 'no-referrer' } : {}) });
  }
  function mount(host, { route = 'geometry', teacher = false } = {}) {
    const entry = readRoute(route);
    host.replaceChildren();
    if (!entry) {
      const error = node('section', null, { class: 'panel' });
      error.append(node('h1', 'Не получилось открыть условие'),
        node('p', 'Вернись в тренажёр и нажми «Передать условие помощнику» ещё раз. Решение в тренажёре сохранится.'),
        link('Открыть геометрию ОГЭ', '#geometry', false, true));
      host.append(error); return () => {};
    }
    const section = node('section', null, { class: 'oge-geometry-collection' });
    const intro = node('header', null, { class: 'panel geometry-intro' });
    intro.append(node('p', 'ОГЭ · ПЕРВАЯ ЧАСТЬ', { class: 'eyebrow' }),
      node('h1', 'Геометрия: №15–19'),
      node('p', 'Пять основных тренажёров в одном месте. Открой нужную тему, попробуй решить задачу и попроси один понятный шаг, если возникло затруднение.'));
    const path = node('ol', null, { class: 'geometry-learning-steps' });
    for (const text of ['Прочитай полное условие и рассмотри чертёж.',
      'Решай по шагам. Подсказки можно раскрывать по мере необходимости.',
      'После разбора возьми новую похожую задачу и реши её без помощи.']) path.append(node('li', text));
    intro.append(path); section.append(intro);

    if (entry.kind === 'transfer') {
      const transferred = node('section', null, { class: 'panel geometry-transfer', 'data-geometry-transfer': '' });
      transferred.append(node('h2', 'Условие для помощника'),
        node('blockquote', entry.question, { class: 'geometry-condition' }),
        node('p', 'Условие уже подставлено в форму помощника ниже. Проверь его и нажми «Хочу подсказку». Ничего не отправляется автоматически.'),
        node('p', 'Чертёж остался в тренажёре. Если какие-то длины, углы или связи указаны только на рисунке, допиши их словами. Изменения в другой вкладке сюда автоматически не переносятся.'),
        link('Открыть исходный тренажёр', 'https://mathexam.space/trainers/' + entry.from + '.html', true));
      if (teacher) transferred.append(node('p', 'Сейчас открыт кабинет преподавателя. Настройки помощника ученика находятся в его карточке «Работа и цель».'));
      section.append(transferred);
    }
    const assistantHost = node('div', null, { 'data-geometry-assistant-host': '', hidden: '' });
    if (entry.topic) section.append(assistantHost);
    const list = node('div', null, { class: 'geometry-topics', 'aria-label': 'Пять тем геометрии ОГЭ' });
    for (const card of cards) {
      const chosen = card.topic === entry.topic;
      const article = node('article', null, { class: 'panel geometry-topic' + (chosen ? ' is-current' : ''), 'data-geometry-topic': card.id });
      article.append(node('p', 'ТРЕНАЖЁР · №' + card.number, { class: 'eyebrow' }), node('h2', card.title),
        node('p', card.description), node('p', card.action, { class: 'geometry-next-step' }));
      const actions = node('div', null, { class: 'actions' });
      actions.append(link('Открыть тренажёр →', 'https://mathexam.space/trainers/' + card.id + '.html', true, true));
      if (!teacher) actions.append(link(chosen ? 'Выбрана тема помощника' : 'Помощник по этой теме', '#geometry=' + card.topic));
      else actions.append(link('Открыть на доске', 'https://mathexam.space/trainers/trainer-board.html?trainer=' + encodeURIComponent('/trainers/' + card.id + '.html'), true));
      article.append(actions);
      if (card.number === 19) article.append(node('p', 'Здесь разбираем утверждения по одному. В экзаменационной задаче прочитай инструкцию и проверь все предложенные утверждения.', { class: 'small' }));
      list.append(article);
    }
    section.append(list);
    if (!entry.topic) section.append(assistantHost);
    const helper = node('section', null, { class: 'panel geometry-helper-note' });
    helper.append(node('h2', 'Как попросить помощь'),
      node('p', 'В тренажёре кнопка «Помощник MathExam» помогает начать разбор. Кнопка «Передать условие помощнику» открывает эту страницу с текстом задачи. Обращение к помощнику отмечается в тренажёре как помощь.'),
      node('p', 'Короткие подсказки доступны прямо в тренажёре. Дополнительный чат в кабинете включает преподаватель.'));
    section.append(helper);
    const repeat = node('details', null, { class: 'panel geometry-repeat' });
    repeat.append(node('summary', 'Если нужно повторить основу'));
    const repeats = node('div', null, { class: 'actions' });
    for (const item of extra) repeats.append(link(item.title, item.url, true));
    repeat.append(repeats); section.append(repeat);
    section.append(node('p', 'Результаты этих тренажёров сохраняются в используемом браузере и пока не входят в прогресс кабинета. Совместный разбор на доске и ответы с подсказкой не считаются самостоятельной проверкой.', { class: 'small geometry-progress-note' }));
    section.append(link('← Вернуться в мой маршрут', '#route'));
    host.append(section);
    return () => {};
  }
  root.LearningGeometry = Object.freeze({ cards, readRoute, mount });
})(typeof window === 'object' ? window : globalThis);

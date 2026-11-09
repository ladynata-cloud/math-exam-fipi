(function (root) {
  'use strict';
  const KEY = 'mathexam.profilePracticeCoach.v1', MAX_RECORDS = 80;
  const lessons = {
    'fn-line': 'line', 'calc-sign': 'derivative', 'prob-count': 'tokens',
    'prob-conditional': 'tokens', 'prob-distribution': 'expectation',
    'eq-linear': 'equation', 'finance-lesson-01-ledger': 'finance'
  };
  const definitions = {
    line: {
      title: 'Что изменяет свободный член?',
      question: 'В y = 2x + b заменим только b: вместо 1 возьмём 4. Как изменится y при x = 2?',
      choices: ['Увеличится на 3', 'Увеличится на 6', 'Не изменится'], correct: 0,
      action: 'Заменить b: 1 → 4',
      why: 'Каждое значение y выросло на 3. Наклон остался 2: мы изменили только свободный член.',
      transfer: 'Теперь b = −2. Чему равно y = 2x − 2 при x = 1?', answer: 0,
      transferRetry: 'Подставьте 1 вместо x. Сначала умножьте на 2, затем вычтите 2.',
      transferWhy: 'Подставляем x = 1: 2 · 1 − 2 = 0. Новый свободный член действует при каждом x.'
    },
    derivative: {
      title: 'Достаточно ли нуля производной?',
      question: 'Дан график f′(x) = (x − 1)². Что произойдёт с самой функцией f в точке x = 1?',
      choices: ['Максимум', 'Минимум', 'Экстремума нет'], correct: 2,
      action: 'Проверить знаки по обе стороны',
      why: '(x − 1)² > 0 при любом x ≠ 1; при x = 1 производная равна нулю. По обе стороны знак плюс: функция продолжает возрастать. Локального экстремума в x = 1 нет.',
      transfer: 'У непрерывной функции при переходе через другую точку производная меняет знак с плюса на минус. Что происходит с функцией в этой точке?',
      transferChoices: ['Максимум', 'Минимум', 'Экстремума нет'], answer: 'Максимум',
      transferRetry: 'Плюс у производной означает возрастание, минус — убывание. Что получится при таком переходе?',
      transferWhy: 'До точки функция возрастает, после неё убывает. Это максимум.'
    },
    tokens: {
      title: 'Из какой группы выбираем теперь?',
      question: 'В мешке 3 красных и 3 синих жетона, одинаковых на ощупь. Известно, что вынут красный жетон; его не возвращают. Как изменится вероятность красного при следующем случайном выборе?',
      choices: ['Увеличится', 'Уменьшится', 'Не изменится'], correct: 1,
      action: 'Убрать один красный жетон',
      why: 'Было 3/6 = 1/2. Осталось 2 красных из 5: вероятность 2/5. Изменились и число подходящих исходов, и общее число жетонов.',
      transfer: 'Теперь к оставшимся 2 красным и 3 синим добавили один синий. Какова вероятность красного? Можно ввести дробь.', answer: 1 / 3,
      transferRetry: 'Красных осталось столько же. Пересчитайте все жетоны после добавления синего и разделите число красных на общее количество.',
      transferWhy: 'Стало 2 красных из 6 жетонов: 2/6 = 1/3. Красных не добавили, а общее количество увеличилось.'
    },
    expectation: {
      title: 'Одна ячейка меняет среднее',
      question: 'Значения X: 0, 2, 5. Их вероятности: 0,5; 0,3; 0,2. Заменим только значение 5 на 10. На сколько увеличится математическое ожидание?',
      choices: ['На 5', 'На 1', 'На 0,2'], correct: 1,
      action: 'Изменить одну ячейку: 5 → 10',
      why: 'Значение выросло на 5, а его вероятность осталась 0,2. Вклад в ожидание вырос на 5 · 0,2 = 1: с 1,6 до 2,6.',
      transfer: 'Вернёмся к исходной таблице: X = 0, 2, 5; P = 0,5; 0,3; 0,2. Если заменить последнее значение 5 на 0, чему будет равно ожидание?', answer: .6,
      transferRetry: 'Перемножьте каждое новое значение со своей вероятностью и сложите. Какие вклады станут нулевыми?',
      transferWhy: '0 · 0,5 + 2 · 0,3 + 0 · 0,2 = 0,6. Два исхода теперь дают значение 0: его общая вероятность 0,5 + 0,2 = 0,7.'
    },
    equation: {
      title: 'Одно действие с обеими частями',
      question: 'В уравнении 5x + 2 = 2x + 14 хотим убрать 2x справа. Из какой части нужно вычесть 2x, чтобы сохранить те же корни?',
      choices: ['Только из левой', 'Только из правой', 'Из обеих частей'], correct: 2,
      action: 'Вычесть 2x из обеих частей',
      why: 'Слева 5x − 2x = 3x; справа 2x − 2x = 0. Получилось 3x + 2 = 14. Мы вычли одно и то же выражение из обеих частей, поэтому корни сохранились.',
      transfer: 'Следующий шаг: из обеих частей 3x + 2 = 14 вычтем 2. Получится 3x = □. Чему равна правая часть?', answer: 12,
      transferRetry: 'К правой части примените то же действие, что к левой: из 14 нужно вычесть 2.',
      transferWhy: 'Справа 14 − 2 = 12, а слева +2 − 2 = 0. Получается 3x = 12.'
    },
    finance: {
      title: 'Платёж меняет следующие проценты',
      question: 'Долг 100 тыс. руб.; за период начисляют 10%, затем вносят платёж. Увеличим первый платёж с 30 до 40 тыс. руб. На сколько уменьшится долг после следующего начисления процентов, до следующего платежа?',
      choices: ['На 10 тыс. руб.', 'На 11 тыс. руб.', 'На 1 тыс. руб.'], correct: 1,
      action: 'Увеличить первый платёж: 30 → 40',
      why: 'Остаток уменьшился на 10 тыс. руб., а следующие проценты — ещё на 1 тыс. руб. Поэтому следующий долг уменьшился на 11 тыс.: с 88 до 77.',
      transfer: 'При тех же 100 тыс. руб. и ставке 10% первый платёж равен 50 тыс. руб. Каков долг после следующего начисления, до следующего платежа? Ответ в тысячах рублей.', answer: 66,
      transferRetry: 'Сначала начислите 10% на 100. Затем вычтите платёж 50 и начислите следующие 10% уже на оставшийся долг.',
      transferWhy: 'После первого начисления долг 110; после платежа остаётся 60. Следующее начисление: 60 · 1,1 = 66 тыс. руб.'
    }
  };
  const fmt = n => String(Number(n.toFixed(6))).replace('-', '−').replace('.', ',');
  function numeric(raw) {
    const s = raw.trim().replace(/−/g, '-').replace(/,/g, '.');
    if (!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:\s*\/\s*[+-]?(?:\d+(?:\.\d+)?|\.\d+))?$/.test(s)) return NaN;
    const parts = s.split('/').map(Number);
    return parts.length === 2 ? (parts[1] === 0 ? NaN : parts[0] / parts[1]) : parts[0];
  }
  function correctTransfer(config, value) {
    return config.transferChoices ? value === config.answer : Number.isFinite(numeric(value)) && Math.abs(numeric(value) - config.answer) < 1e-9;
  }
  const plain = x => x !== null && typeof x === 'object' && !Array.isArray(x) && [Object.prototype, null].includes(Object.getPrototypeOf(x));
  const ownKeys = (x, keys) => plain(x) && Object.keys(x).length === keys.length && keys.every(k => Object.hasOwn(x, k));
  const recordKeys = ['key', 'lessonId', 'taskId', 'started', 'choice', 'firstPrediction', 'revealed', 'open', 'transferDraft', 'transferFirst', 'transferLast'];
  const boundedText = x => typeof x === 'string' && x.length <= 80;
  function validRecord(record) {
    if (!ownKeys(record, recordKeys) || !Object.hasOwn(lessons, record.lessonId) ||
        typeof record.taskId !== 'string' || !/^[a-zA-Z0-9_-]{1,120}$/.test(record.taskId) ||
        typeof record.started !== 'string' || record.started.length > 40 || !Number.isFinite(Date.parse(record.started)) ||
        record.key !== JSON.stringify([record.lessonId, record.taskId, record.started])) return false;
    const config = definitions[lessons[record.lessonId]], choice = x => x === null || Number.isInteger(x) && x >= 0 && x < config.choices.length;
    return choice(record.choice) && choice(record.firstPrediction) && typeof record.revealed === 'boolean' &&
      typeof record.open === 'boolean' && record.revealed === (record.firstPrediction !== null) &&
      (!record.revealed || record.choice !== null) && boundedText(record.transferDraft) &&
      (record.transferFirst === null || boundedText(record.transferFirst)) &&
      (record.transferLast === null || boundedText(record.transferLast)) &&
      ((record.transferFirst === null) === (record.transferLast === null)) &&
      (record.revealed || record.transferDraft === '' && record.transferFirst === null);
  }
  function validStore(value) {
    return ownKeys(value, ['version', 'records']) && value.version === 1 && Array.isArray(value.records) &&
      value.records.length <= MAX_RECORDS && value.records.every(validRecord) &&
      new Set(value.records.map(x => x.key)).size === value.records.length;
  }
  function supports(lesson) { return !!lesson && Object.hasOwn(lessons, typeof lesson === 'string' ? lesson : lesson.id); }

  function mount(container, options = {}) {
    const doc = container && container.ownerDocument;
    const guarded = () => !doc || !['guided', 'plan'].includes(options.mode) || doc.body?.hasAttribute('data-profile-board');
    if (guarded() || !supports(options.lesson)) return () => {};
    const lessonId = typeof options.lesson === 'string' ? options.lesson : options.lesson.id;
    const kind = lessons[lessonId], config = definitions[kind], taskId = options.task?.id, started = options.session?.started;
    let disposed = false, storage = null, blocked = false, notice = '';
    const current = () => !disposed && !guarded() && container.isConnected !== false &&
      (typeof options.isCurrent !== 'function' || options.isCurrent() !== false);
    if (!current()) return () => {};
    const key = JSON.stringify([lessonId, taskId, started]);
    let record = { key, lessonId, taskId, started, choice: null, firstPrediction: null, revealed: false, open: false,
      transferDraft: '', transferFirst: null, transferLast: null };
    const unsaved = () => { blocked = true; notice = 'Этот опыт сейчас не сохраняется. Можно продолжать на этой странице.'; };
    try { storage = options.storage === undefined ? doc.defaultView.localStorage : options.storage; } catch (_) { unsaved(); }
    if (!validRecord(record)) unsaved();
    function read() {
      if (blocked) return null;
      try {
        const raw = storage?.getItem(KEY);
        if (raw === null || raw === undefined) return { version: 1, records: [] };
        if (typeof raw !== 'string' || raw.length > 100000) throw new Error('Invalid saved experiment');
        const data = JSON.parse(raw);
        if (!validStore(data)) throw new Error('Invalid saved experiment');
        return data;
      } catch (_) { unsaved(); return null; }
    }
    const saved = read()?.records.find(x => x.key === key);
    if (saved) record = { ...saved };
    function persist(change) {
      if (!current() || blocked) return;
      const data = read();
      if (!data) return;
      // Another tab may have submitted its first prediction since this mount.
      // A first submission is immutable; revealing a scene cannot be undone by
      // a stale local draft. Later answers remain distinct from that evidence.
      const existing = data.records.find(x => x.key === key);
      if (existing) {
        const wasRevealed = record.revealed;
        record.firstPrediction = existing.firstPrediction ?? record.firstPrediction;
        record.revealed = existing.revealed || record.revealed;
        if (!['choice', 'reveal'].includes(change)) record.choice = existing.choice;
        if (record.revealed && record.choice === null) record.choice = existing.choice;
        record.transferFirst = existing.transferFirst ?? record.transferFirst;
        if (change !== 'transfer') record.transferLast = existing.transferLast;
        if (!['draft', 'transfer'].includes(change)) record.transferDraft = existing.transferDraft;
        if (change !== 'open') record.open = existing.open;
        answer.value = record.transferDraft; wrapper.open = record.open;
        choice.value = record.choice === null ? '' : String(record.choice);
        if (wasRevealed !== record.revealed) draw();
      }
      const other = data.records.filter(x => x.key !== key).slice(-(MAX_RECORDS - 1));
      try {
        if (!storage || typeof storage.setItem !== 'function') throw new Error('Unavailable storage');
        storage.setItem(KEY, JSON.stringify({ version: 1, records: [...other, record] }));
      } catch (_) { unsaved(); }
    }
    const el = (tag, text, className) => { const node = doc.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node; };
    const wrapper = el('details', undefined, 'profile-practice-coach'); wrapper.dataset.coachKind = kind; wrapper.open = record.open;
    const summary = el('summary', 'Предскажи и проверь');
    const body = el('div', undefined, 'coach-body'), heading = el('h3', config.title);
    const intro = el('p', 'Короткий опыт по теме. Основная задача остаётся на месте.', 'coach-note');
    const question = el('p', config.question), label = el('label', 'Мой прогноз');
    const choice = el('select'); choice.setAttribute('aria-label', 'Мой прогноз');
    choice.append(new Option('Выберите…', ''));
    config.choices.forEach((text, i) => choice.append(new Option(text, String(i))));
    choice.value = record.choice === null ? '' : String(record.choice); label.append(choice);
    const action = el('button', config.action, 'coach-action'); action.type = 'button'; action.dataset.coachAction = 'reveal';
    const prediction = el('p', '', 'coach-feedback'); prediction.setAttribute('role', 'status');
    const scene = el('div', undefined, 'coach-scene');
    const first = el('p', '', 'coach-first');
    const transfer = el('form', undefined, 'coach-transfer'); transfer.dataset.coachTransfer = '';
    const transferQuestion = el('p', config.transfer), answerLabel = el('label', config.transferChoices ? 'Выберите ответ' : 'Ваш ответ');
    const answer = el(config.transferChoices ? 'select' : 'input'); answer.dataset.coachAnswer = '';
    if (config.transferChoices) {
      answer.append(new Option('Выберите…', ''));
      config.transferChoices.forEach(text => answer.append(new Option(text, text)));
    } else { answer.type = 'text'; answer.inputMode = 'text'; answer.maxLength = 80; answer.autocomplete = 'off'; }
    answer.value = record.transferDraft; answerLabel.append(answer);
    const submit = el('button', 'Проверить новый шаг', 'coach-action'); submit.type = 'submit';
    const transferFeedback = el('p', '', 'coach-feedback'); transferFeedback.setAttribute('role', 'status');
    transfer.append(el('h4', 'Проверь на другом изменении'), transferQuestion, answerLabel, submit, transferFeedback);
    const warning = el('p', '', 'coach-unsaved'); warning.setAttribute('role', 'status');
    body.append(heading, intro, question, label, action, prediction, scene, first, transfer, warning); wrapper.append(summary, body); container.append(wrapper);

    function table(headers, rows) {
      const t = el('table'); const head = el('thead'), tr = el('tr'); headers.forEach(text => { const th = el('th', text); th.scope = 'col'; tr.append(th); }); head.append(tr);
      const tbody = el('tbody'); rows.forEach(row => { const r = el('tr'); row.forEach(text => r.append(el('td', String(text)))); tbody.append(r); }); t.append(head, tbody); return t;
    }
    function graph(type, after) {
      const ns = 'http://www.w3.org/2000/svg', svg = doc.createElementNS(ns, 'svg');
      svg.setAttribute('viewBox', '0 0 300 190'); svg.setAttribute('role', 'img');
      const description = type === 'line' ? (after ? 'Прямая y = 2x + 4; пунктиром прежняя y = 2x + 1.' : 'Прямая y = 2x + 1.') : 'График производной f′(x) = (x − 1)²; слева и справа от 1 он выше оси x.';
      svg.setAttribute('aria-label', description);
      const add = (tag, attrs, text) => { const n = doc.createElementNS(ns, tag); Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, String(v))); if (text !== undefined) n.textContent = text; svg.append(n); return n; };
      add('title', {}, description);
      const X = x => 44 + x * 66, Y = y => 160 - y * 15;
      add('path', { d: 'M22 160H280M44 174V12', fill: 'none', stroke: '#52675d', 'stroke-width': 1.5 });
      for (let x = 0; x <= 3; x++) add('text', { x: X(x), y: 182, 'text-anchor': 'middle' }, x);
      [0, 2, 4, 6, 8].forEach(y => add('text', { x: 32, y: Y(y) + 4, 'text-anchor': 'end' }, y));
      add('text', { x: 281, y: 175 }, 'x'); add('text', { x: 51, y: 14 }, type === 'derivative' ? 'f′' : 'y');
      if (type === 'line') {
        if (after) add('path', { d: `M${X(0)} ${Y(1)}L${X(3)} ${Y(7)}`, stroke: '#87958e', 'stroke-width': 2, 'stroke-dasharray': '5 4', fill: 'none' });
        add('path', { d: `M${X(0)} ${Y(after ? 4 : 1)}L${X(3)} ${Y(after ? 10 : 7)}`, stroke: '#176b50', 'stroke-width': 3, fill: 'none' });
        [0, 1, 2].forEach(x => add('circle', { cx: X(x), cy: Y(2 * x + (after ? 4 : 1)), r: 4, fill: '#176b50' }));
      } else {
        const path = Array.from({ length: 61 }, (_, i) => { const x = i / 20; return `${i ? 'L' : 'M'}${X(x)} ${Y((x - 1) ** 2)}`; }).join(' ');
        add('path', { d: path, stroke: '#176b50', 'stroke-width': 3, fill: 'none' });
        if (after) [0, 1, 2].forEach(x => { add('circle', { cx: X(x), cy: Y((x - 1) ** 2), r: 4, fill: '#a45125' }); add('text', { x: X(x) + 8, y: Y((x - 1) ** 2) - 9 }, x === 1 ? '0' : '+'); });
      }
      return svg;
    }
    function draw() {
      const after = record.revealed; scene.replaceChildren(); scene.dataset.stage = after ? 'after' : 'before';
      scene.append(el('p', after ? 'После изменения' : 'До изменения', 'coach-stage'));
      if (kind === 'line') {
        scene.append(graph('line', after), el('p', after ? 'y = 2x + 4' : 'y = 2x + 1', 'coach-formula'), table(['x', 'y'], [0, 1, 2].map(x => [x, 2 * x + (after ? 4 : 1)])));
      } else if (kind === 'derivative') {
        scene.querySelector('.coach-stage').textContent = after ? 'Знаки проверены' : 'График производной';
        scene.append(graph('derivative', after), el('p', 'f′(x) = (x − 1)²', 'coach-formula'));
        if (after) scene.append(table(['x', 'f′(x)'], [[0, 1], [1, 0], [2, 1]]));
      } else if (kind === 'tokens') {
        const tokens = el('div', undefined, 'coach-tokens'); tokens.setAttribute('aria-label', after ? '2 красных, 3 синих жетона' : '3 красных, 3 синих жетона');
        for (let i = 0; i < (after ? 5 : 6); i++) { const red = i < (after ? 2 : 3); const token = el('span', red ? 'К' : 'С', red ? 'coach-token red' : 'coach-token blue'); token.setAttribute('aria-hidden', 'true'); tokens.append(token); }
        scene.append(tokens, el('p', 'К — красный, С — синий.', 'coach-note'), table(['Жетоны', 'Красных', 'Всего'], [[after ? 'Осталось' : 'Вначале', after ? 2 : 3, after ? 5 : 6]]));
        if (after) scene.append(el('p', 'P(красный): 3/6 = 1/2 → 2/5', 'coach-formula'));
      } else if (kind === 'expectation') {
        const values = [0, 2, after ? 10 : 5], probabilities = [.5, .3, .2];
        scene.append(table(['X', 'P'], values.map((x, i) => [x, fmt(probabilities[i])])));
        const bars = el('div', undefined, 'coach-bars'); bars.setAttribute('aria-label', 'Вклады значений в математическое ожидание');
        values.forEach((x, i) => { const contribution = x * probabilities[i], row = el('div', undefined, 'coach-bar-row'); const bar = el('span', '', 'coach-bar'); bar.style.width = (contribution * 60) + 'px'; bar.setAttribute('aria-hidden', 'true'); row.append(el('span', fmt(x) + ' · ' + fmt(probabilities[i])), bar, el('strong', fmt(contribution))); bars.append(row); });
        scene.append(el('p', 'Вклад = значение × вероятность', 'coach-note'), bars, el('p', after ? 'E(X) = 0 + 0,6 + 2 = 2,6' : 'E(X) = 0 + 0,6 + 1 = 1,6', 'coach-formula'));
      } else if (kind === 'equation') {
        scene.append(el('p', '5x + 2 = 2x + 14', 'coach-formula'));
        if (after) scene.append(table(['Левая часть', 'Правая часть'], [['5x + 2 − 2x', '2x + 14 − 2x'], ['3x + 2', '14']]), el('p', '3x + 2 = 14', 'coach-formula'));
      } else if (kind === 'finance') {
        const payment = after ? 40 : 30, rest = 110 - payment, interest = rest / 10;
        scene.append(table(['Величина', 'тыс. руб.'], [['Долг в начале', 100], ['После первых 10%', 110], ['Первый платёж', payment], ['Остаток', rest], ['Следующие 10%', interest], ['Долг до второго платежа', rest + interest]]));
        scene.append(el('p', `(${100} · 1,1 − ${payment}) · 1,1 = ${rest + interest}`, 'coach-formula'));
      }
    }
    function feedback() {
      action.disabled = record.choice === null || record.revealed;
      prediction.textContent = !record.revealed ? '' : (record.choice === config.correct ? 'Прогноз верный. ' : 'Сравните прогноз с результатом. ') + config.why;
      prediction.dataset.correct = String(record.revealed && record.choice === config.correct);
      first.textContent = record.firstPrediction === null ? '' : 'Первый прогноз: ' + config.choices[record.firstPrediction] + '.';
      transfer.hidden = !record.revealed;
      transferFeedback.textContent = record.transferLast === null ? '' : correctTransfer(config, record.transferLast) ? 'Верно. ' + config.transferWhy : 'Попробуйте ещё раз. ' + config.transferRetry;
      transferFeedback.dataset.correct = String(record.transferLast !== null && correctTransfer(config, record.transferLast));
      warning.textContent = notice; warning.hidden = !notice;
    }
    choice.onchange = () => {
      if (!current()) return;
      const value = choice.value === '' ? null : Number(choice.value);
      if (value !== null && (!Number.isInteger(value) || value < 0 || value >= config.choices.length)) return;
      if (record.revealed && value === null) { choice.value = String(record.choice); return; }
      record.choice = value; persist('choice'); feedback();
    };
    action.onclick = () => {
      if (!current() || record.choice === null || record.revealed) return;
      record.firstPrediction = record.choice; record.revealed = true; persist('reveal'); draw(); feedback();
    };
    answer.oninput = () => { if (!current()) return; record.transferDraft = answer.value.slice(0, 80); persist('draft'); feedback(); };
    transfer.onsubmit = event => {
      event.preventDefault(); if (!current() || !record.revealed) return;
      const value = answer.value.trim().slice(0, 80);
      if (!value) { transferFeedback.textContent = 'Сначала запишите или выберите ответ.'; return; }
      record.transferDraft = answer.value.slice(0, 80); if (record.transferFirst === null) record.transferFirst = value;
      record.transferLast = value; persist('transfer'); feedback();
    };
    wrapper.ontoggle = () => { if (!current() || wrapper.open === record.open) return; record.open = wrapper.open; persist('open'); feedback(); };
    draw(); feedback();
    return () => { disposed = true; choice.onchange = null; action.onclick = null; answer.oninput = null; transfer.onsubmit = null; wrapper.ontoggle = null; };
  }
  root.ProfilePracticeCoach = { supports, mount };
})(typeof globalThis !== 'undefined' ? globalThis : window);

/* Continuous exam views for the two existing road trainers.
 * The reviewed native engines remain the source of question wording, checking,
 * progress and (for roads-grid) Board Bridge state. No answer key is rendered
 * in the primary diagrams or given-price tables. */
(function (global) {
  'use strict';
  const doc = global.document;
  const api = global.PracticalVariant;
  if (!api) return;
  const node = (tag, text, className) => api.el(tag, text, className);
  const markup = text => { const box = node('div'); box.innerHTML = text; return box; };
  const copy = value => JSON.parse(JSON.stringify(value));
  const roles = ['start', 'dest', 'inter', 'corner'];
  const green = '#176747', blue = '#245ca6';

  function selectControl(label, options, value, onChange) {
    const wrap = node('label', label, 'pv-select-label');
    const input = node('select');
    input.setAttribute('aria-label', label);
    for (const option of options) {
      const item = node('option', option.label);
      item.value = option.value;
      input.append(item);
    }
    input.value = value;
    input.addEventListener('change', () => onChange(input.value));
    wrap.append(input);
    return wrap;
  }

  function diagram(svg, caption) {
    const figure = node('figure', null, 'pv-road-figure');
    figure.style.margin = '0';
    const canvas = node('div', null, 'pv-road-canvas');
    canvas.innerHTML = svg;
    const drawing = canvas.querySelector('svg');
    // Keep nominal 21–24 px labels readable even for the largest 22-column
    // grid; the shared figure region provides horizontal scrolling on phones.
    drawing.style.minWidth = drawing.getAttribute('viewBox').split(/\s+/)[2] + 'px';
    // The shared shell adds one keyboard-accessible scroll/zoom control.
    figure.append(canvas, node('figcaption', caption));
    return figure;
  }

  function gridDiagram(scenario) {
    const cell = 32, pad = 35;
    const width = scenario.gridCols * cell, height = scenario.gridRows * cell;
    const point = role => ({ x: pad + scenario.towns[role].x * cell, y: pad + scenario.towns[role].y * cell });
    let content = '<title>План дорог на клетчатой сетке</title><desc>Сплошные линии обозначают шоссе; пунктирные — прямые дорожки. Пункты обозначены только номерами.</desc>';
    for (let x = 0; x <= scenario.gridCols; x++) content += `<line x1="${pad + x * cell}" y1="${pad}" x2="${pad + x * cell}" y2="${pad + height}" stroke="#d7e0da" stroke-width="1"/>`;
    for (let y = 0; y <= scenario.gridRows; y++) content += `<line x1="${pad}" y1="${pad + y * cell}" x2="${pad + width}" y2="${pad + y * cell}" stroke="#d7e0da" stroke-width="1"/>`;
    const road = (a, b, dashed) => {
      const p = point(a), q = point(b);
      return `<line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}" stroke="${dashed ? blue : green}" stroke-width="${dashed ? 3.5 : 5}" ${dashed ? 'stroke-dasharray="9 7"' : ''} stroke-linecap="round"/>`;
    };
    const pondX = pad + scenario.pond.x * cell, pondY = pad + scenario.pond.y * cell;
    content += `<ellipse cx="${pondX}" cy="${pondY}" rx="${cell * .85}" ry="${cell * .45}" fill="#d2e9f6" stroke="#6ca2bf" stroke-width="2" transform="rotate(-30 ${pondX} ${pondY})"/>`;
    content += road('start', 'corner', false) + road('corner', 'dest', false) + road('start', 'dest', true) + road('inter', 'dest', true);
    const corner = point('corner'), start = point('start'), dest = point('dest');
    const length1 = Math.hypot(start.x - corner.x, start.y - corner.y);
    const length2 = Math.hypot(dest.x - corner.x, dest.y - corner.y);
    const ux = (start.x - corner.x) / length1, uy = (start.y - corner.y) / length1;
    const vx = (dest.x - corner.x) / length2, vy = (dest.y - corner.y) / length2;
    content += `<path d="M${corner.x + ux * 23} ${corner.y + uy * 23}l${vx * 23} ${vy * 23}l${-ux * 23} ${-uy * 23}" fill="none" stroke="${green}" stroke-width="2"/>`;
    for (const role of ['start', 'inter', 'corner', 'dest']) {
      const p = point(role);
      content += `<g data-pv-town="${role}"><circle cx="${p.x}" cy="${p.y}" r="15" fill="white" stroke="${green}" stroke-width="2.5"/><text x="${p.x}" y="${p.y + 7}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="22" font-weight="700" fill="#18372c">${scenario.towns[role].num}</text></g>`;
    }
    const svg = `<svg viewBox="0 0 ${width + pad * 2} ${height + pad * 2}" role="img" aria-label="План дорог; сторона клетки ${scenario.cell} км" data-pv-given-map="roads-grid">${content}</svg>`;
    return diagram(svg, `Сторона клетки — ${scenario.cell} км. Сплошная линия — шоссе; пунктир — дорожка или тропинка; голубая область — пруд.`);
  }

  function schemaDiagram() {
    const scale = 22, ox = 110, oy = 90;
    const point = key => ({ x: ox + T[key].x * scale, y: oy + T[key].y * scale });
    const line = (a, b, dashed) => {
      const p = point(a), q = point(b);
      return `<line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}" stroke="${dashed ? blue : green}" stroke-width="${dashed ? 3 : 5}" ${dashed ? 'stroke-dasharray="8 7"' : ''} stroke-linecap="round"/>`;
    };
    let svg = '<svg viewBox="0 0 700 630" role="img" aria-label="Схема семи деревень и дорог" data-pv-given-map="roads-schema"><title>Схема семи деревень и дорог</title><desc>Антоновка обозначена цифрой 1. Сплошные линии — шоссе, пунктирные — просёлочные дороги. Названия остальных деревень определите по условию.</desc>';
    svg += line('vanyutino', 'antonovka', false) + line('vanyutino', 'bogdanovo', false);
    for (const pair of [['antonovka', 'bogdanovo'], ['antonovka', 'goryunovo'], ['dolomino', 'goryunovo'], ['egorka', 'zhilino']]) svg += line(pair[0], pair[1], true);
    svg += `<path d="M${ox + 25} ${oy}v25h-25" fill="none" stroke="${green}" stroke-width="2"/>`;
    const label = (x, y, text) => `<text x="${x}" y="${y}" font-size="21" font-family="system-ui,sans-serif" fill="#315265" paint-order="stroke" stroke="white" stroke-width="6" stroke-linejoin="round">${text}</text>`;
    svg += label(329, 358, 'река') + label(340, 270, 'пруд');
    // Both named routes pass the same stable: their actual intersection is
    // (16/3, 5) in the native coordinate system, not either road's midpoint.
    const stableX = ox + scale * 16 / 3, stableY = oy + scale * 5;
    svg += `<path d="M${stableX - 8} ${stableY + 5}v-15l8-7 8 7v15z" fill="#f4e7ce" stroke="#8b6a36" stroke-width="2"/>` + label(stableX + 17, stableY + 12, 'конюшня');
    svg += label(488, 44, 'Антоновка') + label(523, 69, '(дано)');
    for (const key of Object.keys(T)) {
      const p = point(key);
      svg += `<circle cx="${p.x}" cy="${p.y}" r="17" fill="white" stroke="${green}" stroke-width="2.5"/><text x="${p.x}" y="${p.y + 8}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="24" font-weight="700" fill="#18372c">${T[key].id}</text>`;
    }
    svg += '</svg>';
    return diagram(svg, 'Сплошная линия — шоссе; пунктир — просёлочная дорога. Расстояния даны в условии. Цифра 1 — Антоновка.');
  }

  function tableBox(caption, headers, rows) {
    const wrap = node('div', null, 'pv-table-scroll');
    wrap.tabIndex = 0;
    wrap.setAttribute('role', 'region');
    wrap.setAttribute('aria-label', caption + '. Таблицу можно прокручивать по горизонтали.');
    const table = node('table', null, 'pv-table');
    table.append(node('caption', caption));
    const head = node('thead'), tr = node('tr');
    headers.forEach(label => tr.append(node('th', label)));
    head.append(tr);
    const body = node('tbody');
    for (const row of rows) {
      const line = node('tr');
      row.forEach((value, index) => line.append(node(index === 0 ? 'th' : 'td', String(value))));
      body.append(line);
    }
    table.append(head, body);
    wrap.append(table);
    return wrap;
  }

  function gridPriceTable(scenario, variant) {
    const keys = GOODS.filter(key => variant.basket[key]);
    const table = tableBox('Цены за одну указанную единицу, в рублях', ['Продукт', 'Нужно купить', ...roles.map(role => scenario.towns[role].short)], keys.map(key => [GOOD_NAMES[key], variant.basket[key], ...roles.map(role => scenario.shopsByRole[role][key])]));
    table.dataset.pvRoadPrices = '1';
    const box = node('section', null, 'pv-road-prices');
    box.append(node('h3', 'Данные для задания 5'), table, node('p', 'В каждой строке указана цена за 1 л, 1 батон или 1 кг. На узком экране таблицу можно прокручивать вправо.', 'pv-note'));
    return box;
  }

  function gridCondition(scenario) {
    const condition = api.clone(doc.getElementById('story-text'));
    const towns = scenario.towns;
    const quoted = role => `«${towns[role].short}»`;
    // The source bank uses nominative place names after every preposition.
    // Keep those names and the native narrative intact, but give the visible
    // copy neutral noun phrases whose case does not depend on the place name.
    const replacements = [
      [towns.start.name, `населённом пункте ${quoted('start')}`],
      [towns.dest.name, `населённый пункт ${quoted('dest')}`],
      [`Из ${towns.start.short}`, `Из населённого пункта ${quoted('start')}`],
      [`через ${towns.inter.short}`, `через населённый пункт ${quoted('inter')}`],
      [`до ${towns.corner.short}`, `до населённого пункта ${quoted('corner')}`],
      [`до ${towns.dest.short}`, `до населённого пункта ${quoted('dest')}`],
      [`в ${towns.inter.short}`, `в населённом пункте ${quoted('inter')}`],
      [`в ${towns.dest.short}`, `в населённый пункт ${quoted('dest')}`]
    ];
    const walker = doc.createTreeWalker(condition, global.NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      let text = walker.currentNode.textContent;
      for (const [source, target] of replacements) text = text.split(source).join(target);
      walker.currentNode.textContent = text;
    }
    return condition;
  }

  function schemaGivens() {
    const rows = [['Антоновка — Доломино', 12], ['Доломино — Егорка', 4], ['Егорка — Ванютино', 12], ['Ванютино — Жилино', 9], ['Жилино — Богданово', 12], ['Ванютино — Горюново', 15]];
    const table = tableBox('Расстояния по шоссе из условия', ['Между деревнями', 'Расстояние, км'], rows);
    table.dataset.pvRoadDistances = '1';
    return table;
  }

  function readStored(key) {
    try { const value = JSON.parse(sessionStorage.getItem(key) || '{}'); return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; } catch (_) { return {}; }
  }
  function store(key, value) {
    try { sessionStorage.setItem(key, JSON.stringify(value)); } catch (_) { /* storage is optional */ }
  }

  function initGrid() {
    const nativeRoots = [doc.querySelector('.topnav'), doc.querySelector('body > .wrap')].filter(Boolean);
    const nativeRender = global.renderFromState;
    const variants = new Map();
    let busy = 0, queued = false;
    const inNative = fn => { busy++; try { return fn(); } finally { busy--; } };
    const schedule = () => {
      if (busy || queued) return;
      queued = true;
      queueMicrotask(() => { queued = false; if (!busy) mountGrid(); });
    };
    // applyState is the callback already held by Board Bridge. Its call to the
    // native renderer also updates the new view; the wire/state schema is intact.
    global.renderFromState = function () { const result = nativeRender(); schedule(); return result; };
    global.renderBoardTrainerState = global.renderFromState;

    function captureQuestions(current) {
      return inNative(() => {
        const captures = [];
        try {
          for (let index = 0; index < 5; index++) {
            const selected = copy(current);
            selected.view.taskIndex = index;
            selected.view.mode = 'practice';
            selected.view.countMode = 'off';
            selected.view.countFrame = null;
            global.applyBoardTrainerState(selected);
            captures.push({
              condition: doc.querySelector('#task-card .task-question').innerHTML,
              hint: doc.querySelector('#hint-box').innerHTML,
              solution: doc.querySelector('#teacher-block').innerHTML,
              labels: Array.from(doc.querySelectorAll('#task-card .id-table tbody tr'), tr => tr.firstElementChild.textContent)
            });
          }
        } finally { global.applyBoardTrainerState(current); }
        return captures;
      });
    }

    function draft(index, values) {
      inNative(() => {
        const candidate = getState(), record = candidate.tasks[index];
        if (index === 0) {
          record.answers = record.answers.map((_, n) => values['v' + n] === '' ? null : Number(values['v' + n]));
          record.marks = record.marks.map(() => 'none');
        } else record.answer = String(values.answer || '').replace(/[^0-9+.,\- ]/g, '').slice(0, 32);
        record.checked = false;
        record.feedback = 'none';
        commitLocalState(candidate, { render: false });
      });
    }

    function check(index, values) {
      return inNative(() => {
        const selected = getState();
        selected.view.taskIndex = index;
        global.applyBoardTrainerState(selected);
        if (index === 0) doc.querySelectorAll('#task-card .id-sel').forEach((select, n) => { select.value = values['v' + n]; });
        else {
          const input = doc.getElementById('answer-input');
          input.value = values.answer;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
        doc.getElementById('check-btn').click();
        return { ok: getState().tasks[index].feedback === 'correct', message: doc.getElementById('feedback').textContent };
      });
    }

    function choose(source) {
      const current = getState();
      variants.set(current.selection.variantKey, current);
      inNative(() => {
        const fresh = source === 'generated' ? generatedSession('practice', 'off') : catalogSession(...source.split(':').map(Number), 'practice', 'off');
        commitLocalState(variants.get(fresh.selection.variantKey) || fresh);
      });
      mountGrid();
    }

    function mountGrid() {
      const current = getState(), scenario = currentScenario(), variant = currentVariant();
      const captures = captureQuestions(current);
      const condition = gridCondition(scenario);
      condition.append(node('p', `Скорость по шоссе — ${scenario.road} км/ч, по дорожкам и тропинкам — ${scenario.path} км/ч.`));
      const controls = node('div', null, 'pv-controls');
      const options = SCENARIOS.flatMap((s, i) => s.variants.map((v, j) => ({ value: i + ':' + j, label: 'Сюжет ' + s.id + ' · вариант ' + (j + 1) })));
      if (current.selection.source === 'generated') options.unshift({ value: 'generated-current', label: 'Текущий случайный вариант' });
      controls.append(selectControl('Выбрать вариант', options, current.selection.source === 'generated' ? 'generated-current' : current.selection.scenarioIndex + ':' + current.selection.setIndex, value => { if (value !== 'generated-current') choose(value); }));
      const random = node('button', 'Новый случайный вариант', 'pv-secondary');
      random.type = 'button'; random.addEventListener('click', () => choose('generated')); controls.append(random);
      const helpTypes = ['map', 'route', 'triangle', 'journey', 'purchase'];
      const labels = ['', 'Расстояние по шоссе, км', 'Расстояние по прямой, км', 'Время в пути, минуты', 'Минимальная стоимость покупки, рубли'];
      const questions = captures.map((capture, index) => {
        const record = current.tasks[index];
        const fields = index === 0 ? capture.labels.map((label, n) => ({ key: 'v' + n, label: label + ': цифра на плане', type: 'select', value: record.answers[n] === null ? '' : String(record.answers[n]), options: [{ value: '', label: 'Выбери цифру' }, ...[1, 2, 3, 4].map(value => ({ value: String(value), label: String(value) }))] })) : [{ key: 'answer', label: labels[index], value: record.answer }];
        // Native feedback is reused after a remote state update, without deriving
        // or presenting answer keys in an unanswered question.
        const status = record.feedback === 'none' ? undefined : { ok: record.feedback === 'correct', message: record.feedback === 'correct' ? 'Верно! Задание решено.' : record.feedback === 'incomplete' ? 'Заполни все строки.' : record.feedback === 'invalid-number' ? 'Введи число.' : 'Проверь ответ и попробуй ещё раз.' };
        return api.question({ id: current.selection.variantKey + '-' + (index + 1), number: index + 1, condition: capture.condition, fields, page: 'roads-grid', helpType: helpTypes[index], onDraft: values => draft(index, values), check: values => check(index, values), status,
          helpSteps: index === 0 ? ['Найди в описании место, где шоссе поворачивает.', 'Определи направление поворота и проследи путь от начала до конца.', 'Сопоставь названия с номерами на плане.'] : undefined,
          helpNative: () => markup(capture.hint.replace(/из задачи 3/g, 'между начальным и конечным пунктами').replace(/сплошные синие линии/g, 'сплошные линии') + '<details><summary>Показать полное решение</summary>' + capture.solution + '</details>') });
      });
      api.mount({ title: 'Дороги по клеткам · задания 1–5', condition, visual: gridDiagram(scenario), tables: gridPriceTable(scenario, variant), controls, questions, nativeRoots });
    }
    mountGrid();
  }

  function initSchema() {
    const nativeRoots = [doc.querySelector('body > .wrap')].filter(Boolean);
    const draftKey = 'mathExam.practicalVariant.roads-schema.drafts.v1';
    const drafts = readStored(draftKey);
    let selectedVariant = SCREENS[cur].vi;

    function check(task, values) {
      mode = 'practice';
      cur = screenIndex(selectedVariant, task);
      render();
      doc.getElementById('ans').value = values.answer;
      doc.getElementById('check').click();
      const feedback = doc.getElementById('fb');
      const status = { ok: feedback.classList.contains('ok'), message: feedback.textContent };
      drafts[solvedKey(selectedVariant, task)] = { value: values.answer, status };
      store(draftKey, drafts);
      return status;
    }

    function solution(variant, task) {
      const body = markup(solveHTML(variant, task).replace(/Правое шоссе/g, 'Вертикальное шоссе'));
      if (task === 1) {
        const paragraphs = body.querySelectorAll(':scope > p');
        if (paragraphs[2]) paragraphs[2].textContent = 'Теперь различи деревни на верхнем шоссе по просёлочным дорогам: Егорка соединена с Жилино, Доломино — с Горюново. Названия и цифры можно определить по этим связям, не измеряя схему линейкой.';
      }
      return body;
    }

    function mountSchema() {
      const variant = VARIANTS[selectedVariant];
      const source = markup(descHTML(1));
      const condition = source.querySelector('.descbody');
      condition.className = 'pv-road-condition';
      condition.style.fontSize = '19px';
      condition.style.lineHeight = '1.75';
      const distances = Array.from(condition.querySelectorAll('p')).find(p => p.textContent.trim().startsWith('По шоссе:'));
      if (distances) distances.remove();
      condition.append(node('p', 'Скорость по шоссе — 50 км/ч, по просёлочным дорогам — 30 км/ч.'));
      const controls = node('div', null, 'pv-controls');
      controls.append(selectControl('Выбрать вариант', VARIANTS.map((v, index) => ({ value: String(index), label: v.group === 'main' ? 'Вариант ' + v.id + ' · задания 1–5' : 'Дополнительное задание ' + v.id })), String(selectedVariant), value => {
        selectedVariant = Number(value);
        cur = screenIndex(selectedVariant, VARIANTS[selectedVariant].group === 'main' ? 1 : 5);
        mountSchema();
      }));
      const tasks = variant.group === 'main' ? [1, 2, 3, 4, 5] : [5];
      const labels = { 1: 'Четыре цифры подряд в порядке деревень из таблицы', 2: 'Расстояние по шоссе, км', 3: 'Расстояние по прямой, км', 4: 'Время в пути, минуты', 5: 'Расход бензина, литры на 100 км' };
      const questions = tasks.map(task => {
        const native = problem(variant, task), key = solvedKey(selectedVariant, task), saved = drafts[key] || {};
        const questionText = markup(native.text + (native.extra || ''));
        for (const table of questionText.querySelectorAll('table')) {
          const scroll = node('div', null, 'pv-table-scroll');
          scroll.tabIndex = 0; scroll.setAttribute('role', 'region'); scroll.setAttribute('aria-label', 'Деревни в порядке записи ответа; таблица прокручивается по горизонтали');
          table.style.minWidth = '520px'; table.before(scroll); scroll.append(table);
        }
        return api.question({ id: key, number: task, condition: questionText, fields: [{ key: 'answer', label: labels[task], value: saved.value || '', inputMode: task === 1 ? 'numeric' : 'decimal' }], page: 'roads-schema', helpType: task, check: values => check(task, values), status: saved.status || (prog.solved[key] ? { ok: true, message: 'Задание уже решено.' } : undefined), onDraft: values => { drafts[key] = { value: values.answer }; store(draftKey, drafts); }, helpNative: () => solution(variant, task) });
      });
      api.mount({ title: variant.group === 'main' ? 'Схема дорог · задания 1–5' : 'Схема дорог · дополнительное задание 5', condition, visual: schemaDiagram(), tables: schemaGivens(), controls, questions, nativeRoots });
    }
    mountSchema();
  }

  api.register('roads-grid', initGrid);
  api.register('roads-schema', initSchema);
})(window);

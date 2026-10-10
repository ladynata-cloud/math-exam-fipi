(function (root) {
  'use strict';
  // Figures and tables describe the current condition. An unopened explanation
  // never computes an unknown answer, and opening it is reported as help.
  const BLUE = '#176b80', ORANGE = '#a54f27', INK = '#263b4c', MUTED = '#667586';
  const fmt = n => String(Number(n.toFixed(8))).replace('.', ',').replace('-', '−');
  const lessons = (root.ProfileLessons || []).filter(l => l.id.startsWith('applied-'));
  const ids = lessons.flatMap(l => l.tasks.map(t => t.id));
  function sceneFor(task, context = {}, options = {}) {
    const complete = context.mode === 'independent' ? !!context.solved :
      Math.max(Number(context.completed) || 0, (Number(context.step) || 0) + (context.solved ? 1 : 0)) >= task.steps.length;
    return {
      kind: task.meta.kind,
      rows: task.diagram.rows.map(r => ({ ...r })),
      target: task.diagram.target,
      value: complete ? fmt(task.answer) : '?',
      complete,
      help: options.help ? task.diagram.help : '',
      symbolic: !!options.help,
      focus: options.highlight ? 'known' : 'neutral'
    };
  }
  function render(container, task, context = {}) {
    const doc = container.ownerDocument;
    const options = { help: false, highlight: false };
    const e = (tag, text, cls) => { const n = doc.createElement(tag); if (text !== undefined) n.textContent = text; if (cls) n.className = cls; return n; };
    const wrapper = e('div', undefined, 'applied-model');
    wrapper.style.cssText = 'max-width:100%;min-width:0;';
    const drawing = e('div');
    drawing.style.cssText = 'max-width:100%;margin:12px 0;';
    const dataTable = e('table');
    dataTable.setAttribute('aria-label', 'Дано и нужно найти');
    dataTable.style.cssText = 'width:100%;border-collapse:collapse;font-size:16px;line-height:1.5;table-layout:fixed;';
    const caption = e('caption', 'Дано');
    caption.style.cssText = 'text-align:left;font-weight:700;margin-bottom:6px;';
    dataTable.append(caption);
    const body = e('tbody'); dataTable.append(body);
    const controls = e('div'); controls.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;';
    const highlight = e('button', 'Выделить данные', 'model-toggle button quiet');
    highlight.type = 'button'; highlight.dataset.modelAction = 'highlight'; highlight.setAttribute('aria-pressed', 'false');
    const explainLabel = context.mode === 'independent' && !context.solved ? 'Показать подсказку к рисунку' : 'Как связать данные';
    const explain = e('button', explainLabel, 'model-toggle button quiet');
    explain.type = 'button'; explain.dataset.modelAction = 'explain'; explain.setAttribute('aria-expanded', 'false');
    for (const b of [highlight, explain]) b.style.cssText = 'white-space:normal;max-width:100%;min-height:44px;';
    const explanation = e('div'); explanation.hidden = true;
    explanation.style.cssText = 'margin-top:12px;padding:12px;background:#f4f8fa;border-radius:10px;overflow-wrap:anywhere;';
    explanation.setAttribute('aria-live', 'polite');
    controls.append(highlight, explain); wrapper.append(drawing, dataTable, controls, explanation); container.replaceChildren(wrapper);

    function svgFor(s) {
      const svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 420 230'); svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', 'Схема условия: ' + s.target);
      svg.setAttribute('data-applied-view', s.kind); svg.dataset.focus = s.focus;
      svg.style.cssText = 'display:block;width:100%;height:auto;max-width:480px;margin:auto;font-family:inherit;';
      function node(tag, attrs = {}, text) {
        const n = doc.createElementNS(svg.namespaceURI, tag);
        for (const [key, value] of Object.entries(attrs)) n.setAttribute(key, value);
        if (text !== undefined) n.textContent = text;
        svg.append(n); return n;
      }
      const text = (x, y, value, color = INK, size = 18, anchor = 'middle') => node('text', { x, y, fill: color, 'font-size': size, 'text-anchor': anchor }, value);
      const line = (x1, y1, x2, y2, color = BLUE) => node('line', { x1, y1, x2, y2, stroke: color, 'stroke-width': options.highlight ? 4 : 2 });
      const arrow = (x1, y1, x2, y2) => { line(x1, y1, x2, y2); const a = Math.atan2(y2 - y1, x2 - x1); node('path', { d: `M${x2 - 10 * Math.cos(a - .4)} ${y2 - 10 * Math.sin(a - .4)}L${x2} ${y2}L${x2 - 10 * Math.cos(a + .4)} ${y2 - 10 * Math.sin(a + .4)}`, fill: 'none', stroke: BLUE, 'stroke-width': 2 }); };
      const box = (x, y, w, h, label) => { node('rect', { x, y, width: w, height: h, rx: 10, fill: options.highlight ? '#e1f3f8' : '#f5f8fa', stroke: BLUE, 'stroke-width': 1.5 }); if (label) text(x + w / 2, y + h / 2 + 6, label); };
      const m = task.meta;
      if (m.kind === 'motion' || m.kind === 'production') {
        const distance = m.distance || m.amount, isWork = m.kind === 'production';
        text(210, 25, isWork ? 'Одинаковый заказ' : 'Одинаковый путь');
        text(28, 69, isWork ? 'Второй' : 'Медленный', INK, 16, 'start');
        arrow(40, 94, 370, 94); text(210, 84, distance + (isWork ? ' деталей' : ' км'), BLUE);
        text(28, 146, isWork ? 'Первый' : 'Быстрый', INK, 16, 'start');
        arrow(40, 172, 370, 172); text(210, 162, distance + (isWork ? ' деталей' : ' км'), BLUE);
        text(210, 218, 'Разница времени: ' + fmt(m.gap) + ' ч', ORANGE);
      } else if (['joint-work', 'missing-worker'].includes(m.kind)) {
        box(25, 28, 150, 48, 'Первый'); box(245, 28, 150, 48, 'Второй');
        text(100, 101, m.first + ' ч', BLUE);
        text(320, 101, m.kind === 'joint-work' ? m.second + ' ч' : s.complete ? s.value + ' ч' : '? ч', BLUE);
        arrow(100, 114, 165, 159); arrow(320, 114, 255, 159);
        box(130, 166, 160, 45, m.kind === 'missing-worker' ? 'Вместе: ' + m.joint + ' ч' : s.complete ? 'Вместе: ' + s.value + ' ч' : 'Вместе: ? ч');
      } else if (['mixture', 'dilution', 'two-mixtures'].includes(m.kind)) {
        const values = m.kind === 'dilution' ? [m.initial + '%', 'Вода: 0%', m.target + '%'] : [m.low + '%', m.high + '%', m.kind === 'mixture' ? m.target + '%' : 'Два случая'];
        [20, 160, 300].forEach((x, i) => {
          node('path', { d: `M${x} 70V163Q${x} 175 ${x + 12} 175H${x + 78}Q${x + 90} 175 ${x + 90} 163V70`, fill: '#edf6f8', stroke: BLUE, 'stroke-width': 2 });
          line(x + 1, 123, x + 89, 123, '#5f94a2'); text(x + 45, 155, values[i], INK, 16);
        });
        text(135, 139, '+', ORANGE, 25); text(275, 139, '=', ORANGE, 25);
        text(210, 38, options.help ? (m.kind === 'dilution' ? 'Вода не добавляет соль' : 'Складываем массы соли') : 'Растворы из условия');
        text(210, 214, 'Рисунок без масштаба', MUTED, 14);
      } else if (['loan-linear', 'loan-principal', 'loan-equal'].includes(m.kind)) {
        text(210, 27, 'Каждый год в одном порядке');
        box(15, 59, 115, 63); text(72, 86, 'Остаток', INK, 16); text(72, 108, 'долга', INK, 16);
        arrow(134, 90, 157, 90);
        box(163, 59, 110, 63); text(218, 86, '+' + m.rate + '%', BLUE, 20); text(218, 108, 'начисление', INK, 14);
        arrow(277, 90, 300, 90);
        box(306, 59, 100, 63); text(356, 86, 'Минус', ORANGE, 16); text(356, 108, 'платёж', ORANGE, 16);
        text(210, 164, 'После последнего платежа: долг 0');
        text(210, 203, m.kind === 'loan-equal' ? 'Платежи одинаковы' : 'Долг уменьшается одинаково', MUTED, 16);
      } else if (['deposit', 'original-deposit', 'compare-deposits'].includes(m.kind)) {
        const initial = m.amount === undefined ? '?' : fmt(m.amount);
        box(15, 85, 115, 54, initial); arrow(136, 112, 165, 112);
        box(171, 85, 105, 54, '?'); arrow(280, 112, 304, 112);
        box(309, 85, 100, 54, m.kind === 'original-deposit' ? fmt(m.final) : '?');
        text(72, 165, 'Начало', INK, 16); text(222, 165, 'Начисление', INK, 14); text(359, 165, 'Итог', INK, 16);
        text(210, 40, m.kind === 'compare-deposits' ? 'Две схемы начисления' : 'Изменение суммы', INK, 17);
        text(210, 211, 'Числа в рублях', MUTED, 14);
      } else {
        const equations = {
          heat: ['Q = c · m · Δt', 'Масса · теплоёмкость · изменение температуры'],
          power: ['P = U² / R', 'Квадрат напряжения разделить на сопротивление'],
          pressure: ['p = p₀ + ρ · g · h', 'К давлению на поверхности прибавляется давление воды'],
          braking: [`S = ${m.speed}t − ${fmt((m.acceleration || 0) / 2)}t²`, 'Формула действует до остановки'],
          decay: [`t = ${m.coefficient} · log₂(U₀/U)`, 'Оба напряжения даны в вольтах'],
          'voltage-limit': ['P = U² / R', 'Мощность не превышает указанную границу']
        };
        const pair = equations[m.kind];
        box(30, 50, 360, 90); text(210, 104, pair[0], BLUE, 27);
        // Keep the caption short enough for a phone: the full verbal rule is
        // available in the data table and the optional explanation below.
        const words = (context.mode === 'independent' && !context.solved && !options.help ? 'Формула из условия задачи.' : pair[1]).split(' '); let lineText = '', lines = [];
        words.forEach(word => { if ((lineText + word).length > 33) { lines.push(lineText.trim()); lineText = ''; } lineText += word + ' '; });
        if (lineText) lines.push(lineText.trim()); lines.forEach((part, i) => text(210, 178 + 23 * i, part, MUTED, 16));
      }
      return svg;
    }
    function helpTable() {
      const m = task.meta;
      let headings = [], rows = [];
      if (m.kind === 'motion' || m.kind === 'production') {
        const quantity = m.distance || m.amount, isWork = m.kind === 'production';
        headings = ['Кто', isWork ? 'За час' : 'Скорость', 'Время'];
        rows = [[isWork ? 'Второй' : 'Медленный', 'x', `${quantity}/x`], [isWork ? 'Первый' : 'Быстрый', `x + ${m.difference}`, `${quantity}/(x + ${m.difference})`]];
      } else if (['joint-work', 'missing-worker'].includes(m.kind)) {
        headings = ['Кто', 'Время, ч', 'За один час'];
        rows = [['Первый', String(m.first), '1/' + m.first], ['Второй', m.second ? String(m.second) : '?', m.second ? '1/' + m.second : '?']];
        if (m.joint) rows.push(['Вместе', String(m.joint), '1/' + m.joint]);
      } else if (['loan-linear', 'loan-principal'].includes(m.kind)) {
        headings = ['Год', 'Долг перед начислением', 'Действие'];
        rows = Array.from({ length: m.years }, (_, i) => [String(i + 1), m.amount ? fmt(m.amount * (m.years - i) / m.years) + ' руб.' : (i ? `${m.years - i}/${m.years} от x` : 'x'), `Взять ${m.rate}% от остатка`]);
      } else if (m.kind === 'loan-equal') {
        headings = ['Год', 'Начисление', 'Платёж'];
        rows = Array.from({ length: m.years }, (_, i) => [String(i + 1), `Остаток × ${fmt(1 + m.rate / 100)}`, 'Вычесть x']);
      } else if (['mixture', 'dilution', 'two-mixtures'].includes(m.kind)) {
        headings = ['Что считаем', 'Как считаем'];
        rows = [['Масса соли', 'Масса раствора × процент : 100'], ['Масса раствора', 'Соль и вода вместе']];
      }
      if (!rows.length) return null;
      const table = e('table'); table.setAttribute('aria-label', 'Связь величин');
      table.style.cssText = 'width:100%;border-collapse:collapse;table-layout:fixed;font-size:18px;line-height:1.5;';
      const head = e('thead'), tr = e('tr');
      headings.forEach(h => { const th = e('th', h); th.scope = 'col'; th.style.cssText = 'text-align:left;vertical-align:top;padding:6px 4px;overflow-wrap:anywhere;'; tr.append(th); }); head.append(tr); table.append(head);
      const tbody = e('tbody');
      rows.forEach(row => { const tr = e('tr'); row.forEach(v => { const td = e('td', v); td.style.cssText = 'border-top:1px solid #d7e2e6;padding:7px 4px;overflow-wrap:anywhere;vertical-align:top;'; tr.append(td); }); tbody.append(tr); });
      table.append(tbody); return table;
    }
    function paint() {
      const s = sceneFor(task, context, options);
      drawing.replaceChildren(svgFor(s)); body.replaceChildren();
      for (const r of s.rows.concat([{ name: s.target, value: s.value, unit: '', target: true }])) {
        const tr = e('tr'), th = e('th', r.name), td = e('td', r.value + (r.unit ? ' ' + r.unit : ''));
        th.scope = 'row'; th.style.cssText = 'width:60%;text-align:left;font-weight:500;overflow-wrap:anywhere;padding:7px 8px 7px 0;border-bottom:1px solid #dbe4e8;';
        td.style.cssText = 'text-align:right;font-weight:700;overflow-wrap:anywhere;padding:7px 0 7px 8px;border-bottom:1px solid #dbe4e8;';
        if (r.target) { tr.dataset.target = ''; th.textContent = 'Найти: ' + r.name; td.style.color = ORANGE; }
        else { tr.dataset.given = ''; if (options.highlight) tr.style.background = '#e1f3f8'; }
        tr.append(th, td); body.append(tr);
      }
      explanation.hidden = !options.help; explanation.replaceChildren();
      if (options.help) {
        const p = e('p', s.help); p.style.cssText = 'margin:0 0 10px;'; explanation.append(p);
        const table = helpTable(); if (table) explanation.append(table);
      }
      explain.setAttribute('aria-expanded', String(options.help)); explain.textContent = options.help ? 'Скрыть объяснение' : explainLabel;
      highlight.setAttribute('aria-pressed', String(options.highlight)); highlight.textContent = options.highlight ? 'Снять выделение' : 'Выделить данные';
    }
    highlight.onclick = () => { options.highlight = !options.highlight; paint(); };
    explain.onclick = () => { options.help = !options.help; if (options.help && !sceneFor(task, context).complete && context.mode === 'independent' && typeof context.onHelp === 'function') context.onHelp(); paint(); };
    paint();
    return () => { highlight.onclick = null; explain.onclick = null; };
  }
  const models = root.ProfileTaskModels = root.ProfileTaskModels || {};
  for (const id of ids) models[id] = render;
  if (typeof module !== 'undefined' && module.exports) module.exports = { ids, sceneFor, render };
})(globalThis);

(function (root) {
  'use strict';
  const registry = root.ProfileTaskModels = root.ProfileTaskModels || {};
  const labs = root.ProfileModels = root.ProfileModels || {};
  const NS = 'http://www.w3.org/2000/svg';
  const C = { ink: '#253f48', muted: '#64757a', green: '#176c58', pale: '#e8f4ed', orange: '#b3531c', line: '#d3dfdc', blue: '#426b9d' };
  const f = x => String(Number(Number(x).toFixed(10))).replace('.', ',');
  function element(name, attrs, parent, text) {
    const node = document.createElementNS(NS, name);
    Object.entries(attrs || {}).forEach(([key, value]) => node.setAttribute(key, String(value)));
    if (text !== undefined) node.textContent = text;
    if (parent) parent.append(node);
    return node;
  }
  function model(container, task, context = {}) {
    const d = task.diagram, independent = context.mode === 'independent';
    const step = task.steps[Math.min(context.step || 0, task.steps.length - 1)];
    let opened = false, disposed = false;
    const shell = document.createElement('div'); shell.className = 'profile-task-model probability-task-model'; shell.dataset.taskId = task.id;
    shell.style.cssText = 'min-width:0;max-width:100%';
    const title = document.createElement('p'); title.textContent = d.title; title.style.cssText = 'font-weight:700;margin:0 0 10px';
    const svg = element('svg', { viewBox: '0 0 420 280', role: 'img', class: 'profile-task-svg', 'aria-label': d.title }, shell);
    svg.style.cssText = 'display:block;width:100%;max-width:100%;height:auto;background:#f6faf8;border:1px solid #d3dfdc;border-radius:12px';
    shell.prepend(title);
    const button = document.createElement('button'); button.type = 'button';
    const buttonText = d.type === 'bernoulli' ? 'Показать подходящие порядки' : 'Подсветить нужное';
    button.textContent = buttonText; button.setAttribute('aria-pressed', 'false');
    button.style.cssText = 'font:inherit;min-height:44px;padding:9px 12px;margin-top:12px;max-width:100%;white-space:normal;border:1px solid #98b4a8;border-radius:8px;background:white;color:#155748;cursor:pointer';
    const status = document.createElement('p'); status.setAttribute('aria-live', 'polite'); status.style.cssText = 'margin:8px 0;line-height:1.5;overflow-wrap:anywhere';
    const neutral = d.type === 'bernoulli' ? 'П — попадание. М — промах. Можно рассмотреть разные порядки бросков.' : 'На схеме — данные текущей задачи.';
    const notice = independent && !context.solved ? ' Кнопка открывает подсказку.' : '';
    status.textContent = neutral + notice;
    shell.append(button, status); container.append(shell);
    const text = (x, y, value, attrs = {}) => element('text', { x, y, fill: C.ink, 'font-family': 'system-ui,sans-serif', 'font-size': 18, ...attrs }, svg, value);
    const line = (x1, y1, x2, y2, attrs = {}) => element('line', { x1, y1, x2, y2, stroke: C.ink, 'stroke-width': 2, ...attrs }, svg);
    const rect = (x, y, width, height, attrs = {}) => element('rect', { x, y, width, height, rx: 7, fill: 'white', stroke: C.line, ...attrs }, svg);
    function lines(value, max = 28) {
      const result = [''];
      String(value).split(' ').forEach(word => { const i = result.length - 1; if (result[i] && (result[i] + ' ' + word).length > max) result.push(word); else result[i] += (result[i] ? ' ' : '') + word; });
      return result;
    }
    function active(key) { return (opened || !independent) && (step.focus === key || step.focus === 'all' || step.focus === 'both' || opened); }
    function note(value) { text(210, 32, value, { 'text-anchor': 'middle', 'font-size': 16, fill: C.muted }); }
    function drawRows(list) {
      const height = 32 + list.reduce((sum, row) => sum + Math.max(58, lines(row.label).length * 23 + 20), 0);
      svg.setAttribute('viewBox', `0 0 420 ${height}`); let y = 16;
      list.forEach(row => {
        const label = lines(row.label), h = Math.max(58, label.length * 23 + 20);
        const highlighted = active(row.key || 'event');
        rect(12, y, 396, h - 6, { fill: highlighted ? C.pale : 'white', stroke: highlighted ? C.green : C.line, 'data-given-row': row.key || 'event', 'data-highlighted': String(highlighted) });
        label.forEach((v, j) => text(24, y + 29 + j * 23, v, { 'font-size': 17 }));
        text(389, y + (h - 6) / 2 + 6, row.value, { 'text-anchor': 'end', 'font-weight': 700, fill: highlighted ? C.green : C.ink });
        y += h;
      });
    }
    function tokens() {
      const total = d.red + d.blue, cols = 8, countRows = Math.ceil(total / cols);
      svg.setAttribute('viewBox', `0 0 420 ${110 + countRows * 44}`);
      note('Все жетоны одинаковы на ощупь');
      for (let i = 0; i < total; i++) {
        const red = i < d.red, on = active('all') || (red && active('event'));
        element('circle', { cx: 42 + (i % cols) * 48, cy: 69 + Math.floor(i / cols) * 44, r: 15, fill: red ? '#bd5f61' : '#4d77aa', stroke: on ? '#102f26' : 'white', 'stroke-width': on ? 3 : 1, 'data-token': red ? 'red' : 'blue' }, svg);
      }
      text(30, 102 + countRows * 44, `Красных: ${d.red}`, { 'font-size': 17, fill: '#993c40' });
      text(239, 102 + countRows * 44, `Синих: ${d.blue}`, { 'font-size': 17, fill: C.blue });
    }
    function distribution() {
      const count = d.values.length, left = 119, width = 284 / count;
      svg.setAttribute('viewBox', '0 0 420 184');
      const allRows = [['X', ...d.values.map(String)], ['P', ...d.probabilities.map(x => x === null ? '?' : f(x))]];
      allRows.forEach((row, r) => {
        rect(12, 18 + r * 61, 391, 57, { fill: 'white' });
        text(32, 54 + r * 61, r === 0 ? 'Значение' : 'Вероятн.', { 'font-size': 17 });
        row.slice(1).forEach((value, i) => {
          const key = d.probabilities[i] === null ? 'missing' : 'known';
          const marked = active('row-' + i) || active(key);
          if (marked) rect(left + i * width, 24 + r * 61, width - 5, 45, { fill: C.pale, stroke: C.green });
          text(left + (i + 0.5) * width - 2, 54 + r * 61, value, { 'text-anchor': 'middle', 'font-size': 20, 'data-distribution-cell': r + '-' + i });
        });
      });
      text(210, 164, 'P — вероятность значения X.', { 'text-anchor': 'middle', 'font-size': 16, fill: C.muted });
    }
    function lottery() {
      svg.setAttribute('viewBox', '0 0 420 239');
      text(28, 33, 'Выигрыш, ₽', { 'font-size': 18 }); text(389, 33, 'Билетов', { 'font-size': 18, 'text-anchor': 'end' });
      d.prizes.forEach((value, i) => {
        const marked = active('row-' + i); rect(14, 48 + i * 56, 392, 47, { fill: marked ? C.pale : 'white', stroke: marked ? C.green : C.line });
        text(30, 79 + i * 56, f(value)); text(389, 79 + i * 56, f(d.counts[i]), { 'text-anchor': 'end' });
      });
      text(28, 188, `Всего билетов: ${d.total}.`, { 'font-size': 18 });
      text(28, 218, 'Остальные выигрывают 0 рублей.', { 'font-size': 17, fill: C.muted });
    }
    function range() {
      svg.setAttribute('viewBox', '0 0 420 253'); const x0 = 45, x1 = 375, xl = x0 + (x1 - x0) * d.lower / d.upper;
      text(24, 33, `Меньше ${d.upper}: вероятность ${f(d.pUpper)}`, { 'font-size': 18 });
      rect(x0, 51, x1 - x0, 26, { fill: active('all') ? '#cfe8dc' : '#e4e9e7', stroke: C.line });
      text(24, 112, `Меньше ${d.lower}: вероятность ${f(d.pLower)}`, { 'font-size': 18 });
      rect(x0, 130, xl - x0, 26, { fill: '#d6e0ed', stroke: C.line });
      line(x0, 208, x1, 208); [0, d.lower, d.upper].forEach(v => { const x = x0 + (x1 - x0) * v / d.upper; line(x, 201, x, 215); text(x, 239, String(v), { 'text-anchor': 'middle' }); });
      if (active('event')) line(xl, 187, x1, 187, { stroke: C.green, 'stroke-width': 8, 'data-target': 'range' });
      element('circle', { cx: xl, cy: 187, r: 4, fill: active('event') ? C.green : 'transparent' }, svg);
      if (active('event')) element('circle', { cx: x1, cy: 187, r: 5, fill: 'white', stroke: C.green, 'stroke-width': 2 }, svg);
    }
    function sequence() {
      svg.setAttribute('viewBox', '0 0 420 227'); note('Именно этот порядок из условия');
      d.pattern.forEach((label, i) => {
        const hit = label === 'Попадание', key = hit ? 'hit' : 'miss';
        rect(20 + i * 99, 64, 83, 76, { fill: active(key) ? C.pale : 'white', stroke: active(key) ? C.green : C.line });
        text(61 + i * 99, 92, String(i + 1), { 'text-anchor': 'middle', 'font-size': 16, fill: C.muted });
        text(61 + i * 99, 122, hit ? 'П' : 'М', { 'text-anchor': 'middle', 'font-size': 25, 'font-weight': 700 });
      });
      text(22, 177, `P(попадание) = ${f(d.p)}`, { 'font-size': 18 });
      text(22, 207, 'П — попадание. М — промах.', { 'font-size': 17 });
    }
    function bernoulli() {
      const show = opened || (!independent && ['count', 'both'].includes(step.focus));
      if (!show) { drawRows([{ label: 'Независимых бросков', value: String(d.trials), key: 'all' }, { label: 'Вероятность попадания', value: f(d.p), key: 'event' }, { label: 'Нужно ровно попаданий', value: String(d.hits), key: 'count' }]); return; }
      const patterns = Array.from({ length: 2 ** d.trials }, (_, j) => Array.from({ length: d.trials }, (_, k) => (j >> (d.trials - 1 - k)) & 1)).filter(row => row.reduce((sum, x) => sum + x, 0) === d.hits);
      svg.setAttribute('viewBox', `0 0 420 ${78 + 45 * patterns.length}`);
      note(`Подходящие порядки: ровно ${d.hits} ${d.hits === 1 ? 'попадание' : 'попадания'}`);
      patterns.forEach((pattern, j) => pattern.forEach((hit, k) => {
        const x = 64 + k * 80, y = 49 + j * 45;
        rect(x, y, 61, 35, { fill: hit ? C.pale : 'white', stroke: hit ? C.green : C.line, 'data-pattern-cell': hit ? 'hit' : 'miss' });
        text(x + 30, y + 25, hit ? 'П' : 'М', { 'text-anchor': 'middle', fill: hit ? C.green : C.muted });
      }));
      text(210, 67 + 45 * patterns.length, 'Каждая строка — отдельный порядок.', { 'text-anchor': 'middle', 'font-size': 16 });
    }
    function uniform() {
      svg.setAttribute('viewBox', '0 0 420 203'); const x = v => 43 + (v - d.a) / (d.b - d.a) * 332;
      rect(x(d.a), 64, x(d.b) - x(d.a), 50, { fill: '#e7edeb' });
      if (active('event')) rect(x(d.left), 64, x(d.right) - x(d.left), 50, { fill: '#bde0ce', stroke: C.green, 'data-target': 'interval' });
      line(x(d.a), 132, x(d.b), 132);
      [d.a, d.left, d.right, d.b].forEach(v => { line(x(v), 126, x(v), 140); text(x(v), 166, String(v), { 'text-anchor': 'middle' }); });
      text(210, 32, 'Все равные промежутки равновероятны.', { 'text-anchor': 'middle', 'font-size': 16 });
      text(210, 194, 'Время, мин', { 'text-anchor': 'middle', 'font-size': 17, fill: C.muted });
    }
    function normal() {
      svg.setAttribute('viewBox', '0 0 420 279');
      // The two boundaries correspond to the probability given in this task.
      // Approximate the normal CDF only for the drawing, never for the answer.
      const cdf = z => {
        const t = 1 / (1 + 0.2316419 * z), phi = Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);
        return 1 - phi * (0.319381530 * t - 0.356563782 * t ** 2 + 1.781477937 * t ** 3 - 1.821255978 * t ** 4 + 1.330274429 * t ** 5);
      };
      let lo = 0, hi = 4;
      for (let i = 0; i < 36; i++) { const mid = (lo + hi) / 2; if (cdf(mid) < (1 + d.middle) / 2) lo = mid; else hi = mid; }
      const boundary = (lo + hi) / 2;
      const x = u => 210 + u * 52, y = u => 191 - 138 * Math.exp(-u * u / 2);
      const path = Array.from({ length: 81 }, (_, i) => { const u = -3.6 + i * 7.2 / 80; return `${i ? 'L' : 'M'} ${x(u)} ${y(u)}`; }).join(' ');
      const area = (from, to) => `M ${x(from)} 191 ` + Array.from({ length: 36 }, (_, i) => { const u = from + (to - from) * i / 35; return `L ${x(u)} ${y(u)}`; }).join(' ') + ` L ${x(to)} 191 Z`;
      if (active('tails')) { element('path', { d: area(-3.6, -boundary), fill: '#d8e5f0' }, svg); element('path', { d: area(boundary, 3.6), fill: '#d8e5f0' }, svg); }
      if (active('right') || opened) element('path', { d: area(boundary, 3.6), fill: '#b9ddc8', 'data-target': 'right-tail' }, svg);
      element('path', { d: path, fill: 'none', stroke: C.blue, 'stroke-width': 3 }, svg); line(21, 191, 399, 191);
      [[-boundary, d.mean - d.deviation], [0, d.mean], [boundary, d.mean + d.deviation]].forEach(([u, value]) => { line(x(u), 54, x(u), 197, { stroke: C.line, 'stroke-dasharray': '4 5' }); text(x(u), 224, String(value), { 'text-anchor': 'middle', 'font-size': 18 }); });
      text(210, 27, `Вероятность между границами: ${f(d.middle)}`, { 'text-anchor': 'middle', 'font-size': 16 });
      text(210, 258, 'Кривая схематическая. Используй условие.', { 'text-anchor': 'middle', 'font-size': 16, fill: C.muted });
    }
    function draw() {
      svg.replaceChildren(); svg.dataset.focus = opened || !independent ? step.focus : 'neutral';
      element('title', {}, svg, d.title); element('desc', {}, svg, task.prompt);
      if (d.type === 'tokens') tokens(); else if (d.type === 'distribution') distribution(); else if (d.type === 'lottery') lottery();
      else if (d.type === 'range') range(); else if (d.type === 'sequence') sequence(); else if (d.type === 'bernoulli') bernoulli();
      else if (d.type === 'uniform') uniform(); else if (d.type === 'normal') normal(); else drawRows(d.rows);
    }
    function toggle() {
      if (disposed) return;
      opened = !opened; button.setAttribute('aria-pressed', String(opened));
      button.textContent = opened ? 'Скрыть подсказку' : buttonText;
      status.textContent = opened ? (d.type === 'bernoulli' ? 'Посчитай строки. В каждом порядке ровно нужное число попаданий.' : step.hint) : neutral + notice;
      if (opened && independent && !context.solved && typeof context.onHelp === 'function') context.onHelp();
      draw();
    }
    button.addEventListener('click', toggle); draw();
    return () => { disposed = true; button.removeEventListener('click', toggle); };
  }
  (root.ProfileLessons || []).filter(l => l.group === 'probability').forEach(l => {
    l.tasks.forEach(task => { if (task.diagram) registry[task.id] = (container, current, context) => model(container, current || task, context); });
    labs[l.model] = container => model(container, l.tasks[0], { mode: 'introduction', step: 0 });
  });
})(globalThis);

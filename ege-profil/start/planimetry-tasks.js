(function (root) {
  'use strict';
  // Task-bound drawings. Coordinates use the actual condition; unknown lengths
  // may determine a shape. Worked answers appear only in explicitly opened,
  // progressively revealed explanations.
  const registry = root.ProfileTaskModels = root.ProfileTaskModels || {};
  const NS = 'http://www.w3.org/2000/svg';
  const ink = '#243b43', green = '#176860', amber = '#9a4614', pale = '#e9f4f0';
  const rad = d => d * Math.PI / 180;
  const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
  const fmt = n => String(n).replace('.', ',');
  function el(name, attrs, parent, content) {
    const node = document.createElementNS(NS, name);
    Object.entries(attrs || {}).forEach(([k, v]) => node.setAttribute(k, String(v)));
    if (content !== undefined) node.textContent = content;
    if (parent) parent.append(node);
    return node;
  }
  function triangle(a, b, base = 10) {
    const c = 180 - a - b;
    // This sine-rule form also handles right angles and obtuse base angles.
    const ab = base * Math.sin(rad(c)) / Math.sin(rad(a));
    return { A: [ab * Math.cos(rad(b)), ab * Math.sin(rad(b))], B: [0, 0], C: [base, 0] };
  }
  function figure(container, task, points, context, draw, note) {
    const independent = context.mode === 'independent' && !context.solved;
    const helpNotice = independent ? ' Открытие построения — подсказка.' : '';
    const defaultNote = (independent ? 'Это чертёж к текущей задаче.' : (note || 'Это чертёж к текущей задаче. Кнопка поможет выделить нужные элементы.')) + helpNotice;
    const wrapper = document.createElement('div'); wrapper.className = 'profile-task-model'; wrapper.dataset.taskId = task.id;
    const svg = el('svg', { viewBox: '0 0 480 340', role: 'img', 'aria-label': task.prompt, class: 'profile-task-svg' }, wrapper);
    svg.style.cssText = 'display:block;width:100%;max-width:100%;height:auto;overflow:visible';
    el('title', {}, svg, 'Чертёж к задаче'); el('desc', {}, svg, task.prompt);
    const controls = document.createElement('div'); controls.className = 'profile-model-controls';
    controls.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;margin-top:8px';
    const feedback = document.createElement('p'); feedback.className = 'profile-model-note'; feedback.textContent = defaultNote;
    feedback.setAttribute('aria-live', 'polite'); feedback.setAttribute('aria-atomic', 'true');
    wrapper.append(controls, feedback); container.append(wrapper);
    const values = Object.values(points), xs = values.map(p => p[0]), ys = values.map(p => p[1]);
    const xmin = Math.min(...xs), xmax = Math.max(...xs), ymin = Math.min(...ys), ymax = Math.max(...ys);
    const scale = Math.min(330 / Math.max(1, xmax - xmin), 220 / Math.max(1, ymax - ymin));
    const center = [(xmin + xmax) / 2, (ymin + ymax) / 2];
    const xy = p => [240 + (p[0] - center[0]) * scale, 165 - (p[1] - center[1]) * scale];
    let parent = svg; const disposers = [];
    const api = {
      xy, points, svg,
      line(a, b, color = ink, dashed = false, width = 2.5) {
        const p = xy(a), q = xy(b);
        return el('line', { x1: p[0], y1: p[1], x2: q[0], y2: q[1], stroke: color, 'stroke-width': width, ...(dashed ? { 'stroke-dasharray': '6 5' } : {}), 'stroke-linecap': 'round' }, parent);
      },
      polygon(ps, fill = pale, color = ink) { return el('polygon', { points: ps.map(p => xy(p).join(',')).join(' '), fill, stroke: color, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, parent); },
      text(p, text, dx = 0, dy = 0, color = ink, size = 24) {
        const q = xy(p); return el('text', { x: q[0] + dx, y: q[1] + dy, fill: color, 'font-size': size, 'font-family': 'system-ui, sans-serif', 'text-anchor': 'middle', 'dominant-baseline': 'middle', 'paint-order': 'stroke', stroke: '#fff', 'stroke-width': 4, 'stroke-linejoin': 'round' }, parent, text);
      },
      label(a, b, text, offset = 18, color = ink) {
        const p = xy(a), q = xy(b), d = Math.hypot(q[0] - p[0], q[1] - p[1]);
        return api.text(mix(a, b, 0.5), text, -(q[1] - p[1]) / d * offset, (q[0] - p[0]) / d * offset, color);
      },
      point(p, name, dx = 0, dy = 21) {
        const q = xy(p); el('circle', { cx: q[0], cy: q[1], r: 3, fill: ink }, parent);
        if (name) api.text(p, name, dx, dy);
      },
      angle(o, a, b, text = '', radius = 27, color = green) {
        const c = xy(o), p = xy(a), q = xy(b); let start = Math.atan2(p[1] - c[1], p[0] - c[0]), end = Math.atan2(q[1] - c[1], q[0] - c[0]);
        let delta = end - start; while (delta > Math.PI) delta -= Math.PI * 2; while (delta < -Math.PI) delta += Math.PI * 2;
        const x1 = c[0] + radius * Math.cos(start), y1 = c[1] + radius * Math.sin(start), x2 = c[0] + radius * Math.cos(start + delta), y2 = c[1] + radius * Math.sin(start + delta);
        el('path', { d: `M ${x1} ${y1} A ${radius} ${radius} 0 0 ${delta > 0 ? 1 : 0} ${x2} ${y2}`, stroke: color, 'stroke-width': 2, fill: 'none' }, parent);
        if (text) api.text(o, text, (radius + 20) * Math.cos(start + delta / 2), (radius + 20) * Math.sin(start + delta / 2), color, 22);
      },
      right(o, a, b, color = green) {
        const c = xy(o), p = xy(a), q = xy(b), d1 = Math.hypot(p[0] - c[0], p[1] - c[1]), d2 = Math.hypot(q[0] - c[0], q[1] - c[1]);
        const u = [(p[0] - c[0]) * 10 / d1, (p[1] - c[1]) * 10 / d1], v = [(q[0] - c[0]) * 10 / d2, (q[1] - c[1]) * 10 / d2];
        el('path', { d: `M ${c[0] + u[0]} ${c[1] + u[1]} l ${v[0]} ${v[1]} l ${-u[0]} ${-u[1]}`, fill: 'none', stroke: color, 'stroke-width': 1.8, 'data-right-angle': 'true' }, parent);
      },
      tick(a, b, count = 1) {
        const p = xy(a), q = xy(b), d = Math.hypot(q[0] - p[0], q[1] - p[1]);
        for (let i = 0; i < count; i++) { const t = 0.5 + (i - (count - 1) / 2) * 6 / d, x = p[0] + (q[0] - p[0]) * t, y = p[1] + (q[1] - p[1]) * t, dx = (q[1] - p[1]) * 5 / d, dy = -(q[0] - p[0]) * 5 / d; el('line', { x1: x - dx, y1: y - dy, x2: x + dx, y2: y + dy, stroke: ink, 'stroke-width': 2 }, parent); }
      },
      circle(o, radius) { const p = xy(o); el('circle', { cx: p[0], cy: p[1], r: radius * scale, fill: 'none', stroke: ink, 'stroke-width': 2.5 }, parent); },
      arc(o, radius, from, to, color = amber) {
        const a = [o[0] + radius * Math.cos(rad(from)), o[1] + radius * Math.sin(rad(from))], b = [o[0] + radius * Math.cos(rad(to)), o[1] + radius * Math.sin(rad(to))];
        const p = xy(a), q = xy(b), r = radius * scale;
        el('path', { d: `M ${p[0]} ${p[1]} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 0 ${q[0]} ${q[1]}`, fill: 'none', stroke: color, 'stroke-width': 5, 'stroke-linecap': 'round' }, parent);
      },
      walkthrough(makeSteps, highlight) {
        wrapper.classList.add('profile-trig-explanation');
        feedback.textContent = independent ? 'Это чертёж к текущей задаче. Открытие разбора — подсказка.' : 'Если нужна помощь, открой разбор. Каждый шаг останется перед глазами.';
        const button = document.createElement('button'); button.type = 'button'; button.dataset.trigOpen = '';
        button.textContent = 'Разобрать решение по шагам'; button.setAttribute('aria-expanded', 'false'); controls.append(button);
        let panel, list, next, layer, steps, shown = 0;
        const revealStep = () => {
          if (shown === steps.length) return;
          const step = steps[shown], item = document.createElement('li'); item.className = 'profile-trig-step'; item.dataset.trigStep = String(shown + 1);
          const heading = document.createElement('h3'); heading.textContent = `Шаг ${shown + 1} из ${steps.length}. ${step.title}`; item.append(heading);
          step.lines.forEach(line => {
            const paragraph = document.createElement('p');
            if (typeof line === 'string') paragraph.textContent = line;
            else {
              paragraph.className = 'profile-trig-formula';
              const appendFraction = (top, bottom, side) => {
                const fraction = document.createElement('span'); fraction.className = 'profile-trig-fraction'; fraction.setAttribute('aria-hidden', 'true');
                const numerator = document.createElement('span'); numerator.className = 'profile-trig-numerator'; numerator.textContent = top;
                const denominator = document.createElement('span'); denominator.className = 'profile-trig-denominator'; denominator.textContent = bottom;
                if (side) {
                  numerator.classList.add(side === 'left' ? 'profile-trig-diagonal-a' : 'profile-trig-diagonal-b');
                  denominator.classList.add(side === 'left' ? 'profile-trig-diagonal-b' : 'profile-trig-diagonal-a');
                }
                fraction.append(numerator, denominator); paragraph.append(fraction);
              };
              if (line.fraction) {
                const f = line.fraction;
                paragraph.classList.add('profile-trig-ratio'); paragraph.setAttribute('role', 'math');
                paragraph.setAttribute('aria-label', `${f.before}дробь: числитель ${f.numerator}, знаменатель ${f.denominator}${f.after}`
                  .replace('cos α', 'Косинус альфа').replace('sin α', 'Синус альфа').replace('tg α', 'Тангенс альфа').replace(/=/g, 'равно'));
                const appendText = text => { if (text) { const span = document.createElement('span'); span.className = 'profile-trig-equality'; span.textContent = text; span.setAttribute('aria-hidden', 'true'); paragraph.append(span); } };
                appendText(f.before);
                appendFraction(f.numerator, f.denominator); appendText(f.after);
              } else if (line.proportion) {
                const p = line.proportion;
                paragraph.classList.add('profile-trig-proportion'); paragraph.setAttribute('role', 'math');
                paragraph.setAttribute('aria-label', `Дробь: числитель ${p.left[0]}, знаменатель ${p.left[1]}, равно дробь: числитель ${p.right[0]}, знаменатель ${p.right[1]}`);
                appendFraction(p.left[0], p.left[1], 'left');
                const cross = document.createElement('span'); cross.className = 'profile-trig-crossbox'; cross.setAttribute('aria-hidden', 'true');
                const drawing = el('svg', { viewBox: '0 0 56 64', class: 'profile-trig-cross', 'aria-hidden': 'true', focusable: 'false' }, cross);
                el('line', { x1: 2, y1: 15, x2: 54, y2: 49, stroke: '#b42318', 'stroke-width': 2.5 }, drawing);
                el('line', { x1: 2, y1: 49, x2: 54, y2: 15, stroke: '#5f6368', 'stroke-width': 2.5, 'stroke-dasharray': '5 3' }, drawing);
                const equality = document.createElement('span'); equality.textContent = '='; cross.append(equality); paragraph.append(cross);
                appendFraction(p.right[0], p.right[1], 'right');
              } else paragraph.textContent = line.formula;
            }
            item.append(paragraph);
          });
          list.append(item); shown += 1;
          next.setAttribute('aria-disabled', String(shown === steps.length));
          next.textContent = shown < steps.length ? `Следующий шаг: ${shown + 1} из ${steps.length}` : `Все ${steps.length} шагов открыты`;
        };
        const onClick = () => {
          const opening = button.getAttribute('aria-expanded') !== 'true';
          if (!panel) {
            // Mark assistance before adding any explanation, including hidden DOM.
            if (independent && typeof context.onHelp === 'function') context.onHelp();
            steps = makeSteps();
            layer = el('g', { 'data-model-layer': 'Стороны для разбора' }, svg);
            const old = parent; parent = layer; highlight(api); parent = old;
            panel = document.createElement('section'); panel.dataset.trigExplanation = ''; panel.className = 'profile-trig-walkthrough';
            panel.setAttribute('aria-label', 'Разбор решения по шагам');
            list = document.createElement('ol'); list.dataset.trigSteps = ''; list.setAttribute('aria-live', 'polite'); list.setAttribute('aria-relevant', 'additions'); panel.append(list);
            next = document.createElement('button'); next.type = 'button'; next.dataset.trigNext = ''; next.addEventListener('click', revealStep); panel.append(next);
            wrapper.append(panel); disposers.push(() => next.removeEventListener('click', revealStep));
            revealStep();
          }
          panel.hidden = !opening; layer.setAttribute('visibility', opening ? 'visible' : 'hidden');
          button.setAttribute('aria-expanded', String(opening)); button.textContent = opening ? 'Свернуть разбор' : 'Разобрать решение по шагам';
        };
        button.addEventListener('click', onClick); disposers.push(() => button.removeEventListener('click', onClick));
      },
      toggle(label, render, explanation, initial = false) {
        if (independent) initial = false;
        const layer = el('g', { 'data-model-layer': label, visibility: initial ? 'visible' : 'hidden' }, svg), old = parent; parent = layer; render(api); parent = old;
        const button = document.createElement('button'); button.type = 'button'; button.textContent = independent ? 'Показать подсказку к рисунку' : label; button.setAttribute('aria-pressed', String(initial)); button.style.cssText = 'min-height:44px;max-width:100%;white-space:normal'; controls.append(button);
        const onClick = () => {
          const active = button.getAttribute('aria-pressed') !== 'true';
          if (active && independent && typeof context.onHelp === 'function') context.onHelp();
          button.setAttribute('aria-pressed', String(active));
          if (independent) button.textContent = active ? 'Скрыть подсказку' : 'Показать подсказку к рисунку';
          layer.setAttribute('visibility', active ? 'visible' : 'hidden');
          feedback.textContent = active ? explanation : defaultNote;
        };
        button.addEventListener('click', onClick); disposers.push(() => button.removeEventListener('click', onClick));
      }
    };
    draw(api, points);
    return () => { disposers.forEach(f => f()); wrapper.remove(); };
  }
  function triangleLabels(d, p) { d.polygon([p.A, p.B, p.C]); d.point(p.A, 'A', 0, -20); d.point(p.B, 'B', -14, 20); d.point(p.C, 'C', 14, 20); }
  function rightTrigSteps(task) {
    const m = task.meta, cosine = task.id === 'geo-right-cosine', sine = task.id === 'geo-right-sine';
    const clean = n => fmt(Number(n.toFixed(10))), ratio = clean(m.ratio), known = clean(cosine ? m.part : m.whole);
    const answer = clean(cosine ? m.part / m.ratio : m.whole * m.ratio);
    const multiplier = 10 ** ((String(m.ratio).split('.')[1] || '').length), numerator = Math.round(m.ratio * multiplier);
    const formula = text => ({ formula: text });
    const fraction = (before, numerator, denominator, after = '') => ({ fraction: { before, numerator, denominator, after } });
    const unknown = cosine ? 'Гипотенуза' : 'Катет', factor = cosine ? numerator : multiplier;
    const product = clean((cosine ? m.part : m.whole) * (cosine ? multiplier : numerator));
    const crossStep = { title: 'Умножим крест-накрест', lines: [
      'Запишем десятичное число обыкновенной дробью.',
      fraction(`${ratio} = `, String(numerator), String(multiplier)),
      { proportion: { left: [String(numerator), String(multiplier)], right: cosine ? [known, 'гипотенуза'] : ['катет', known] } },
      'Крайние члены — красные, средние — серые.',
      'Произведение крайних членов пропорции равно произведению средних.',
      'Умножим крест-накрест. Произведение с неизвестным запишем слева.',
      formula(`${unknown} · ${factor} = ${known} · ${cosine ? multiplier : numerator}`)
    ] };
    const factorStep = { title: 'Найдём неизвестный множитель', lines: [
      'Вычислим произведение справа.',
      formula(`${unknown} · ${factor} = ${product}`),
      'Чтобы найти неизвестный множитель, нужно произведение разделить на известный множитель.',
      formula(`${unknown} = ${product} : ${factor} = ${answer}`),
      `${cosine ? 'Гипотенуза равна' : 'Искомый катет равен'} ${answer}.`
    ] };
    if (cosine) return [
      { title: 'Найдём нужные стороны', lines: [
        'Квадратик отмечает прямой угол. Напротив него — гипотенуза: наклонная сторона со знаком «?».',
        `Катет ${known} касается угла α. Это прилежащий катет — нижняя сторона.`
      ] },
      { title: 'Что означает косинус?', lines: [
        'Косинус показывает, какую часть гипотенузы составляет прилежащий катет.',
        fraction('cos α = ', 'прилежащий катет', 'гипотенуза'),
        fraction(`${ratio} = `, known, 'гипотенуза')
      ] },
      crossStep,
      factorStep,
      { title: 'Проверим', lines: [
        formula(`${answer} · ${ratio} = ${known}`),
        'Получили длину катета из условия.',
        formula(`${answer} > ${known}`),
        'Гипотенуза длиннее катета — так и должно быть.',
        `Ответ: ${answer}. Теперь можно ввести его в поле ответа.`
      ] }
    ];
    return [
      { title: 'Найдём нужные стороны', lines: sine ? [
        `Квадратик отмечает прямой угол. Напротив него — гипотенуза ${known}: наклонная сторона.`,
        'Катет напротив α не касается этого угла. Это вертикальная сторона со знаком «?». Её нужно найти.'
      ] : [
        `Катет ${known} касается угла α. Это прилежащий катет — нижняя сторона.`,
        'Искомый катет расположен напротив α. Это вертикальная сторона со знаком «?». Для тангенса нужны эти два катета.'
      ] },
      { title: sine ? 'Что означает синус?' : 'Что означает тангенс?', lines: [
        sine ? 'Синус показывает, какую часть гипотенузы составляет противолежащий катет.' : 'Тангенс сравнивает два катета: противолежащий делим на прилежащий.',
        fraction(sine ? 'sin α = ' : 'tg α = ', 'противолежащий катет', sine ? 'гипотенуза' : 'прилежащий катет'),
        fraction(`${ratio} = `, 'неизвестный катет', known)
      ] },
      crossStep,
      factorStep,
      { title: 'Проверим', lines: [
        fraction('', answer, known, ` = ${ratio}`),
        sine ? 'Получили синус из условия.' : 'Получили тангенс из условия.',
        sine ? `Катет ${answer} короче гипотенузы ${known} — так и должно быть.` : 'Тангенс может быть больше 1: один катет может быть длиннее другого.',
        `Ответ: ${answer}. Теперь можно ввести его в поле ответа.`
      ] }
    ];
  }
  function register(ids, fn) { ids.forEach(id => { registry[id] = (container, task, context) => fn(container, task, context || {}); }); }
  register(['geo-angles-sum', 'geo-angles-isosceles', 'geo-angles-exterior', 'geo-angles-ratio', 'geo-angles-bisector', 'geo-angles-parallel'], (container, task, context) => {
    const id = task.id, m = task.meta;
    let a, b;
    if (id === 'geo-angles-sum') [a, b] = m.angles;
    if (id === 'geo-angles-isosceles') { a = m.vertex; b = (180 - a) / 2; }
    if (id === 'geo-angles-exterior') { a = m.remote; b = m.exterior - a; }
    if (id === 'geo-angles-ratio') { const sum = m.ratio.reduce((x, y) => x + y, 0); a = 180 * m.ratio[0] / sum; b = 180 * m.ratio[1] / sum; }
    if (id === 'geo-angles-bisector') { a = m.a; b = m.b; }
    if (id === 'geo-angles-parallel') { a = 73; b = 58; }
    const p = triangle(a, b);
    if (id === 'geo-angles-exterior') p.D = [15, 0];
    if (id === 'geo-angles-bisector') p.D = mix(p.B, p.C, dist(p.A, p.B) / (dist(p.A, p.B) + dist(p.A, p.C)));
    if (id === 'geo-angles-parallel') { p.D = mix(p.A, p.B, 0.56); p.E = mix(p.A, p.C, 0.56); }
    return figure(container, task, p, context, d => {
      triangleLabels(d, p);
      if (id === 'geo-angles-isosceles') { d.tick(p.A, p.B); d.tick(p.A, p.C); d.angle(p.A, p.B, p.C, `${a}°`); d.angle(p.B, p.A, p.C, '?', 29, amber); d.toggle('Выделить углы при основании', () => { d.angle(p.B, p.A, p.C, '', 37, amber); d.angle(p.C, p.A, p.B, '', 37, amber); }, 'AB = AC. Поэтому углы при основании BC равны.'); }
      else if (id === 'geo-angles-exterior') { d.line(p.C, p.D); d.point(p.D, 'D'); d.angle(p.C, p.A, p.D, `${m.exterior}°`, 34); d.angle(p.A, p.B, p.C, `${a}°`); d.angle(p.B, p.A, p.C, '?', 30, amber); d.toggle('Выделить внутренний угол C', () => d.angle(p.C, p.B, p.A, '', 23, amber), 'Внутренний угол ACB и внешний угол ACD вместе составляют 180°.'); }
      else if (id === 'geo-angles-bisector') { d.line(p.A, p.D, green); d.point(p.D, 'D'); d.angle(p.A, p.B, p.C, `${a}°`, 50); d.angle(p.B, p.A, p.C, `${b}°`); d.angle(p.D, p.A, p.C, '?', 26, amber); d.toggle('Выделить треугольник ADC', () => { d.polygon([p.A, p.D, p.C], 'rgba(224,155,58,.15)', amber); d.angle(p.A, p.B, p.D, '', 24, amber); d.angle(p.A, p.D, p.C, '', 24, amber); }, 'AD делит угол A пополам. Искомый угол находится в треугольнике ADC.'); }
      else if (id === 'geo-angles-parallel') { d.line(p.D, p.E, green); d.point(p.D, 'D', -17, -5); d.point(p.E, 'E', 17, -5); d.angle(p.D, p.A, p.E, '58°', 21); d.angle(p.A, p.B, p.C, '73°', 25); d.angle(p.C, p.A, p.B, '?', 28, amber); d.text(mix(p.B, p.C, .5), 'DE ∥ BC', 0, 53, green); d.toggle('Выделить соответственные углы', () => { d.angle(p.D, p.A, p.E, '', 31, amber); d.angle(p.B, p.A, p.C, '', 31, amber); }, 'DE ∥ BC. Углы ADE и ABC — соответственные, поэтому равны.'); }
      else if (id === 'geo-angles-ratio') { d.angle(p.A, p.B, p.C, '2 доли'); d.angle(p.B, p.A, p.C, '3 доли'); d.angle(p.C, p.A, p.B, '4 доли', 30, amber); d.toggle('Выделить наибольший угол', () => d.angle(p.C, p.A, p.B, '', 40, amber), 'Наибольшему углу соответствуют четыре доли. Все доли вместе составляют 180°.'); }
      else { d.angle(p.A, p.B, p.C, `${a}°`); d.angle(p.B, p.A, p.C, `${b}°`); d.angle(p.C, p.A, p.B, '?', 30, amber); d.toggle('Выделить все три угла', () => { d.angle(p.A, p.B, p.C, '', 37, amber); d.angle(p.B, p.A, p.C, '', 37, amber); d.angle(p.C, p.A, p.B, '', 37, amber); }, 'У треугольника три внутренних угла. Их сумма равна 180°.'); }
    });
  });
  register(['geo-right-hypotenuse', 'geo-right-leg', 'geo-right-sine', 'geo-right-cosine', 'geo-right-tangent', 'geo-right-perimeter'], (container, task, context) => {
    const id = task.id, m = task.meta; let x, y, bottom, upright, hyp;
    if (id === 'geo-right-hypotenuse') { [y, x] = m.legs; upright = fmt(y); bottom = fmt(x); hyp = '?'; }
    if (id === 'geo-right-leg' || id === 'geo-right-perimeter') { y = m.leg; x = Math.sqrt(m.hypotenuse ** 2 - y ** 2); upright = fmt(y); bottom = '?'; hyp = fmt(m.hypotenuse); }
    if (id === 'geo-right-sine') { y = m.whole * m.ratio; x = Math.sqrt(m.whole ** 2 - y ** 2); upright = '?'; hyp = fmt(m.whole); }
    if (id === 'geo-right-cosine') { x = m.part; y = Math.sqrt((m.part / m.ratio) ** 2 - x ** 2); bottom = fmt(x); hyp = '?'; }
    if (id === 'geo-right-tangent') { x = m.whole; y = x * m.ratio; bottom = fmt(x); upright = '?'; }
    const p = { O: [0, 0], R: [x, 0], T: [0, y] };
    return figure(container, task, p, context, d => {
      d.polygon([p.O, p.R, p.T]); d.right(p.O, p.R, p.T);
      if (bottom) d.label(p.O, p.R, bottom, 24, bottom === '?' ? amber : ink);
      if (upright) d.label(p.O, p.T, upright, -24, upright === '?' ? amber : ink);
      if (hyp) d.label(p.T, p.R, hyp, -23, hyp === '?' ? amber : ink);
      if (id === 'geo-right-sine' || id === 'geo-right-cosine' || id === 'geo-right-tangent') {
        d.angle(p.R, p.O, p.T, '', 30); d.text(p.R, 'α', -43, -22, green, 22);
        const symbol = id === 'geo-right-sine' ? 'sin' : id === 'geo-right-cosine' ? 'cos' : 'tg';
        d.text(p.T, `${symbol} α = ${fmt(m.ratio)}`, 45, -32, green);
        d.walkthrough(() => rightTrigSteps(task), () => {
          if (id !== 'geo-right-cosine') d.line(p.O, p.T, amber, false, 5);
          if (id !== 'geo-right-sine') d.line(p.O, p.R, green, false, 5);
          if (id !== 'geo-right-tangent') d.line(p.T, p.R, amber, true, 4);
        });
      }
      else d.toggle('Выделить гипотенузу', () => d.line(p.T, p.R, amber, false, 5), 'Гипотенуза расположена напротив прямого угла. Это самая длинная сторона.');
    });
  });
  register(['geo-similarity-side', 'geo-similarity-perimeter', 'geo-similarity-area', 'geo-similarity-from-area'], (container, task, context) => {
    const id = task.id, m = task.meta; let k, base, height;
    if (id === 'geo-similarity-side') { k = m.to / m.from; base = m.from; height = Math.sqrt(m.side ** 2 - (base * .65) ** 2); }
    else if (id === 'geo-similarity-perimeter') { k = m.to / m.from; base = m.from; height = Math.sqrt(((m.side - base) / 2) ** 2 - (base / 2) ** 2); }
    else if (id === 'geo-similarity-area') { k = m.to / m.from; base = 6; height = 2 * m.area / base; }
    else { k = Math.sqrt(m.to / m.from); base = m.side; height = 2 * m.from / base; }
    const middle = id === 'geo-similarity-side' ? .35 : .5, shift = base + base * k * .30;
    const p = { A: [0, 0], B: [base, 0], C: [base * middle, height], D: [shift, 0], E: [shift + base * k, 0], F: [shift + base * middle * k, height * k] };
    return figure(container, task, p, context, d => {
      d.polygon([p.A, p.B, p.C]); d.polygon([p.D, p.E, p.F]);
      for (const n of ['A', 'B', 'D', 'E']) d.point(p[n], id === 'geo-similarity-side' ? n : '', 0, 21);
      if (id === 'geo-similarity-side') { d.point(p.C, 'C', 0, -19); d.point(p.F, 'F', 0, -19); d.label(p.A, p.B, '6', 42); d.label(p.D, p.E, '15', 42); d.label(p.B, p.C, '8', 20); d.label(p.E, p.F, '?', 20, amber); }
      if (id === 'geo-similarity-perimeter') { d.label(p.A, p.B, '5', 23); d.label(p.D, p.E, '12', 23); d.text(mix(p.C, mix(p.A, p.B, .5), .50), 'P = 24', 0, 0, green, 22); d.text(mix(p.F, mix(p.D, p.E, .5), .5), 'P = ?', 0, 0, amber); }
      if (id === 'geo-similarity-area') { d.label(p.A, p.B, '2 доли', 23); d.label(p.D, p.E, '5 долей', 23); d.text(mix(p.C, mix(p.A, p.B, .5), .5), 'S = 12', 0, 0, green, 22); d.text(mix(p.F, mix(p.D, p.E, .5), .5), 'S = ?', 0, 0, amber); }
      if (id === 'geo-similarity-from-area') { d.label(p.A, p.B, '6', 23); d.label(p.D, p.E, '?', 23, amber); d.text(mix(p.C, mix(p.A, p.B, .5), .5), 'S = 16', 0, 0, green, 22); d.text(mix(p.F, mix(p.D, p.E, .5), .5), 'S = 100', 0, 0, green); }
      d.toggle('Выделить соответствующие стороны', () => { d.line(p.A, p.B, amber, false, 5); d.line(p.D, p.E, amber, false, 5); d.line(p.B, p.C, green, true, 4); d.line(p.E, p.F, green, true, 4); }, 'Сплошные цветные стороны соответствуют друг другу. Пунктирные — тоже. Сохраняй один порядок: большая сторона / малая сторона.');
    });
  });
  register(['geo-similarity-parallel', 'geo-similarity-split'], (container, task, context) => {
    const split = task.id === 'geo-similarity-split', k = split ? 1 / 3 : .4;
    // AB and AC satisfy the given lengths, with no unnecessary special angle.
    const ab = split ? 9 : 10, ac = split ? 12 : 14, bc = split ? 13 : 15;
    const ax = (ab ** 2 + bc ** 2 - ac ** 2) / (2 * bc), p = { A: [ax, Math.sqrt(ab ** 2 - ax ** 2)], B: [0, 0], C: [bc, 0] };
    p.D = mix(p.A, p.B, k); p.E = mix(p.A, p.C, k);
    return figure(container, task, p, context, d => {
      triangleLabels(d, p); d.line(p.D, p.E, green); d.point(p.D, 'D', -18, -2); d.point(p.E, 'E', 18, -2);
      d.label(p.A, p.D, split ? '3' : '4', 20); d.text(mix(p.B, p.C, .5), 'DE ∥ BC', 0, 51, green);
      if (split) { d.label(p.D, p.B, '6', 21); d.label(p.A, p.E, '4', -22); d.label(p.E, p.C, '?', -23, amber); }
      else { d.label(p.B, p.C, '15', 24); d.label(p.D, p.E, '?', 22, amber); d.text(p.B, 'AB = 10', -5, -55); }
      d.toggle('Выделить малый треугольник', () => d.polygon([p.A, p.D, p.E], 'rgba(224,155,58,.14)', amber), 'Малый треугольник ADE подобен большому ABC: DE ∥ BC. AD соответствует AB, AE — AC, DE — BC.');
    });
  });
  register(['geo-area-triangle', 'geo-area-height', 'geo-area-exterior-height'], (container, task, context) => {
    const exterior = task.id === 'geo-area-exterior-height', unknown = task.id === 'geo-area-height', m = task.meta;
    const h = unknown ? 2 * m.area / m.base : m.height, p = { A: [exterior ? -4 : m.base * .37, h], B: [0, 0], C: [m.base, 0] }; p.H = [p.A[0], 0];
    return figure(container, task, p, context, d => {
      triangleLabels(d, p); if (exterior) d.line(p.H, p.B, ink, true);
      d.line(p.A, p.H, green, true); d.right(p.H, p.A, p.C); d.point(p.H, 'H', exterior ? -8 : 0, 20);
      d.label(p.B, p.C, fmt(m.base), 39); d.label(p.A, p.H, unknown ? '?' : fmt(h), exterior ? -23 : 22, unknown ? amber : green);
      if (unknown) d.text(mix(p.A, mix(p.B, p.C, .5), .47), `S = ${m.area}`, 35, 0);
      d.toggle('Выделить основание и высоту', () => { d.line(p.B, p.C, amber, false, 5); d.line(p.A, p.H, green, false, 4); }, exterior ? 'Основание — BC. Высота AH перпендикулярна прямой BC, хотя H лежит за пределами стороны.' : 'Основание — BC. Высота AH проведена именно к этому основанию и перпендикулярна ему.');
    });
  });
  register(['geo-area-parallelogram', 'geo-area-two-heights', 'geo-quad-parallelogram-diagonal'], (container, task, context) => {
    const id = task.id, m = task.meta, two = id === 'geo-area-two-heights', diag = id === 'geo-quad-parallelogram-diagonal';
    const base = diag ? 12 : m.base, h = diag ? 37 / 6 : m.height, shift = two ? Math.sqrt(m.other ** 2 - h ** 2) : 3;
    const p = { A: [0, 0], B: [base, 0], C: [base + shift, h], D: [shift, h], H: [shift, 0] };
    if (two) { const t = base * shift / (shift ** 2 + h ** 2); p.K = [shift * t, h * t]; }
    return figure(container, task, p, context, d => {
      d.polygon([p.A, p.B, p.C, p.D]);
      if (diag) { for (const n of ['A', 'B', 'C', 'D']) d.point(p[n], n, n === 'A' || n === 'D' ? -15 : 15, n === 'A' || n === 'B' ? 19 : -19); d.line(p.A, p.C, green); d.text([(p.A[0] + p.B[0] + p.C[0]) / 3, h / 3], 'S = 37', 0, 0); d.toggle('Выделить два треугольника', () => { d.polygon([p.A, p.B, p.C], 'rgba(224,155,58,.16)', amber); d.polygon([p.A, p.C, p.D], 'rgba(23,104,96,.13)', green); }, 'Диагональ делит параллелограмм на два треугольника с равными площадями.'); }
      else { d.line(p.D, p.H, green, true); d.right(p.H, p.D, p.B); d.label(p.A, p.B, fmt(base), 26); d.label(p.D, p.H, fmt(h), 20, green);
        if (two) { d.label(p.A, p.D, '10', 23); d.toggle('Провести высоту к стороне 10', () => { d.line(p.D, p.K, ink, true); d.line(p.B, p.K, amber, true); d.right(p.K, p.A, p.B, amber); d.label(p.B, p.K, '?', -20, amber); }, 'Новая высота перпендикулярна стороне длины 10 (или её продолжению). Площадь параллелограмма остаётся той же.'); }
        else d.toggle('Выделить основание и высоту', () => { d.line(p.A, p.B, amber, false, 5); d.line(p.D, p.H, green, false, 4); }, 'Основание длины 11 и высота длины 8 перпендикулярны. Наклонная сторона не является высотой.');
      }
    });
  });
  register(['geo-area-common-height'], (container, task, context) => {
    const p = { A: [3.2, 8], B: [0, 0], C: [14, 0], D: [4, 0], H: [3.2, 0] };
    return figure(container, task, p, context, d => {
      triangleLabels(d, p); d.line(p.A, p.D, green); d.point(p.D, 'D', 0, 23); d.label(p.B, p.D, '2 доли', 47); d.label(p.D, p.C, '5 долей', 47); d.text(p.A, 'S ABC = 56', 56, -35);
      d.toggle('Показать общую высоту', () => { d.line(p.A, p.H, amber, true); d.right(p.H, p.A, p.C, amber); d.point(p.H, 'H', -18, -5); }, 'У треугольников ABD и ADC высота к прямой BC одна и та же. Их площади относятся как основания BD и DC.');
      d.toggle('Выделить нужный треугольник ADC', () => d.polygon([p.A, p.D, p.C], 'rgba(224,155,58,.16)', amber), 'Нужна площадь ADC. Его основание DC занимает пять долей из всей стороны BC.');
    });
  });
  register(['geo-quad-rectangle'], (container, task, context) => {
    const p = { A: [0, 0], B: [24, 0], C: [24, 7], D: [0, 7] };
    return figure(container, task, p, context, d => { d.polygon([p.A, p.B, p.C, p.D]); d.right(p.A, p.B, p.D); d.label(p.A, p.B, '24', 25); d.label(p.A, p.D, '7', -24); d.toggle('Провести диагональ', () => { d.line(p.A, p.C, amber); d.label(p.A, p.C, '?', -18, amber); }, 'Диагональ вместе с двумя сторонами прямоугольника образует прямоугольный треугольник.'); });
  });
  register(['geo-quad-trapezoid', 'geo-quad-trapezoid-area', 'geo-quad-midline'], (container, task, context) => {
    const m = task.meta, middle = task.id === 'geo-quad-midline', a = middle ? 2 * m.midline - m.base : m.a, b = middle ? m.base : m.b, x = (a - b) / 2, h = middle ? 7 : Math.sqrt(m.leg ** 2 - x ** 2);
    const p = { A: [0, 0], B: [a, 0], C: [x + b, h], D: [x, h], H: [x, 0], K: [x + b, 0] }; p.M = mix(p.A, p.D, .5); p.N = mix(p.B, p.C, .5);
    return figure(container, task, p, context, d => {
      d.polygon([p.A, p.B, p.C, p.D]); d.label(p.A, p.B, middle ? '?' : fmt(a), 27, middle ? amber : ink); d.label(p.D, p.C, fmt(b), -25);
      if (middle) { d.line(p.M, p.N, green); d.label(p.M, p.N, fmt(m.midline), 19, green); d.tick(p.A, p.M); d.tick(p.M, p.D); d.tick(p.B, p.N, 2); d.tick(p.N, p.C, 2); d.toggle('Выделить основания и среднюю линию', () => { d.line(p.A, p.B, amber, false, 5); d.line(p.D, p.C, amber, false, 5); d.line(p.M, p.N, green, true, 4); }, 'Средняя линия соединяет середины боковых сторон. Её длина равна половине суммы оснований.'); }
      else { d.label(p.A, p.D, fmt(m.leg), 23); d.tick(p.A, p.D); d.tick(p.B, p.C); d.toggle('Провести две высоты', () => { d.line(p.D, p.H, green, true); d.line(p.C, p.K, green, true); d.right(p.H, p.D, p.B); d.right(p.K, p.C, p.A); d.tick(p.A, p.H, 2); d.tick(p.K, p.B, 2); d.label(p.D, p.H, '?', -20, amber); }, 'По краям получились равные прямоугольные треугольники. Два крайних отрезка вместе равны разности оснований.'); }
    });
  });
  register(['geo-quad-rhombus'], (container, task, context) => {
    const p = { A: [-12, 0], B: [0, 5], C: [12, 0], D: [0, -5], O: [0, 0] };
    return figure(container, task, p, context, d => { d.polygon([p.A, p.B, p.C, p.D]); d.label(p.B, p.C, '?', -21, amber); d.line(p.A, p.C, green, true); d.line(p.B, p.D, green, true); d.point(p.A, 'A', -18, 0); d.point(p.B, 'B', 0, -20); d.point(p.C, 'C', 18, 0); d.point(p.D, 'D', 0, 21); d.text(p.D, 'AC = 24; BD = 10', 0, 48); d.toggle('Выделить прямоугольный треугольник', () => { d.polygon([p.O, p.B, p.C], 'rgba(224,155,58,.13)', amber); d.right(p.O, p.B, p.C, amber); d.tick(p.A, p.O); d.tick(p.O, p.C); d.tick(p.B, p.O, 2); d.tick(p.O, p.D, 2); }, 'Диагонали ромба перпендикулярны и делятся точкой пересечения пополам. Сторона ромба — гипотенуза выделенного треугольника.'); });
  });
  register(['geo-circle-inscribed', 'geo-circle-central', 'geo-circle-major-arc'], (container, task, context) => {
    const id = task.id, m = task.meta, central = id === 'geo-circle-central', major = id === 'geo-circle-major-arc', angle = central ? m.inscribed * 2 : major ? m.minor : m.arc, r = 10;
    const p = { O: [0, 0], A: [r * Math.cos(rad(-angle / 2)), r * Math.sin(rad(-angle / 2))], B: [r * Math.cos(rad(angle / 2)), r * Math.sin(rad(angle / 2))], C: [major ? r : -r, 0], left: [-r, -r], right: [r, r] };
    return figure(container, task, p, context, d => {
      d.circle(p.O, r); d.line(p.C, p.A); d.line(p.C, p.B); d.line(p.A, p.B, ink, true); d.point(p.A, 'A', 12, 18); d.point(p.B, 'B', 12, -18); d.point(p.C, 'C', major ? 20 : -20, 0);
      if (central) { d.point(p.O, 'O', -9, 21); d.line(p.O, p.A, green); d.line(p.O, p.B, green); d.angle(p.C, p.A, p.B, `${m.inscribed}°`, 32); d.angle(p.O, p.A, p.B, '?', 30, amber); }
      else { d.arc(p.O, r, -angle / 2, angle / 2, green); d.text([r, 0], `${angle}°`, 44, major ? -37 : 0, green); d.angle(p.C, p.A, p.B, '?', major ? 23 : 31, amber); }
      d.toggle('Выделить дугу для угла ACB', () => d.arc(p.O, r, major ? angle / 2 : -angle / 2, major ? 360 - angle / 2 : angle / 2), 'Угол ACB опирается на дугу AB, которая не содержит вершину C. ' + (major ? 'Здесь это большая дуга.' : 'Здесь это меньшая дуга.'));
    });
  });
  register(['geo-circle-diameter'], (container, task, context) => {
    const p = { O: [0, 0], A: [-10, 0], B: [10, 0], C: [-2.8, 9.6], lower: [0, -10] };
    return figure(container, task, p, context, d => { d.circle(p.O, 10); d.polygon([p.A, p.B, p.C], 'rgba(233,244,240,.65)'); d.point(p.A, 'A', -19, 0); d.point(p.B, 'B', 19, 0); d.point(p.C, 'C', 0, -21); d.label(p.A, p.B, '20', 22); d.label(p.A, p.C, '12', -21); d.label(p.C, p.B, '?', -22, amber); d.toggle('Выделить угол, опирающийся на диаметр', () => d.right(p.C, p.A, p.B, amber), 'AB — диаметр. Поэтому вписанный угол ACB прямой, а AB — гипотенуза.'); });
  });
  register(['geo-circle-tangent'], (container, task, context) => {
    const p = { O: [0, 0], T: [0, 7], P: [24, 7], left: [-7, -7], right: [7, 7] };
    return figure(container, task, p, context, d => { d.circle(p.O, 7); d.line(p.O, p.T, green); d.line(p.T, p.P, ink); d.line(p.O, p.P, ink, true); d.point(p.O, 'O', -17, 9); d.point(p.T, 'T', -18, -17); d.point(p.P, 'P', 17, 0); d.label(p.O, p.T, '7', -21); d.label(p.O, p.P, '25', 20); d.label(p.T, p.P, '?', -21, amber); d.toggle('Показать прямой угол', () => d.right(p.T, p.O, p.P, amber), 'Радиус OT перпендикулярен касательной PT в точке касания T. В треугольнике OTP гипотенуза — OP.'); });
  });
  register(['geo-circle-two-tangents'], (container, task, context) => {
    const r = 10, px = 26, x = r * r / px, y = Math.sqrt(r * r - x * x), p = { O: [0, 0], P: [px, 0], A: [x, y], B: [x, -y], left: [-r, -r], top: [0, r] };
    return figure(container, task, p, context, d => { d.circle(p.O, r); d.line(p.P, p.A); d.line(p.P, p.B); d.point(p.P, 'P', 20, 0); d.point(p.A, 'A', -8, -22); d.point(p.B, 'B', -8, 22); d.label(p.A, p.P, '3x + 2', -23); d.label(p.B, p.P, '5x − 8', 23); d.toggle('Отметить равные касательные', () => { d.line(p.P, p.A, amber, false, 4); d.line(p.P, p.B, amber, false, 4); d.tick(p.P, p.A); d.tick(p.P, p.B); }, 'Отрезки касательных, проведённых из одной точки P, равны: PA = PB. Ищем длину PA, а не только x.'); });
  });
})(globalThis);

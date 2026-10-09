(function (root) {
  'use strict';

  // These drawings use the current task's data. Unknown coordinates are never
  // used to position a point on a graduated grid before that answer is earned.
  const O = [0, 0];
  const BLUE = '#176b80', ORANGE = '#a54f27', GREEN = '#26754c';
  const ids = [
    'vec-coordinates-x', 'vec-coordinates-y', 'vec-coordinates-end',
    'vec-coordinates-start', 'vec-coordinates-reverse', 'vec-coordinates-equal',
    'vec-length-basic', 'vec-length-negative', 'vec-length-points',
    'vec-length-axis', 'vec-length-unknown', 'vec-length-scaled',
    'vec-operations-sum', 'vec-operations-difference', 'vec-operations-scale',
    'vec-operations-combination', 'vec-operations-equation',
    'vec-operations-difference-length', 'vec-dot-positive', 'vec-dot-negative',
    'vec-dot-perpendicular', 'vec-dot-angle', 'vec-dot-self', 'vec-dot-cosine'
  ];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const mul = (a, k) => [a[0] * k, a[1] * k];
  const sub = (a, b) => add(a, mul(b, -1));
  const fmt = n => String(Number(n.toFixed(5))).replace('-', '−').replace('.', ',');
  const pair = p => '(' + p.map(fmt).join('; ') + ')';
  let instance = 0;

  function sceneFor(task, context, options) {
    context = context || {};
    options = options || {};
    const m = task.meta;
    const independent = context.mode === 'independent';
    const earned = independent ? (context.solved ? task.steps.length : 0)
      : Math.max(0, Number(context.step) || 0) + (context.solved ? 1 : 0);
    const complete = earned >= task.steps.length;
    const s = { vectors: [], points: [], projection: !!options.projection,
      coordinates: true, caption: '', legend: '', construction: null,
      projectionLabel: 'Показать движение по осям', complete };
    const vector = (from, to, label, color = BLUE, components = null) => {
      s.vectors.push({ from, to, label, color, components });
    };
    const point = (at, label) => s.points.push({ at, label });
    const given = (a, name, color = BLUE) => vector(O, a, name, color, a);
    const canConstruct = !independent || complete;
    const construct = label => { if (canConstruct) s.construction = label; return canConstruct && options.construction; };

    switch (task.id) {
      case 'vec-coordinates-x':
      case 'vec-coordinates-y':
        point(m.a, 'A'); point(m.b, 'B');
        vector(m.a, m.b, 'AB', BLUE, complete ? sub(m.b, m.a) : null);
        s.legend = 'A' + pair(m.a) + ' · B' + pair(m.b);
        s.caption = 'Стрелка начинается в A и заканчивается в B.';
        break;
      case 'vec-coordinates-reverse': {
        // In this task metadata stores BA's start/end, rather than A/B.
        point(m.b, 'A'); point(m.a, 'B');
        const reversed = !!options.construction;
        vector(reversed ? m.b : m.a, reversed ? m.a : m.b,
          reversed ? 'AB' : 'BA', BLUE, complete ? (reversed ? sub(m.a, m.b) : sub(m.b, m.a)) : null);
        s.construction = 'Показать обратную стрелку AB';
        s.legend = 'A' + pair(m.b) + ' · B' + pair(m.a);
        s.caption = reversed ? 'AB: из A в B. При смене направления оба знака меняются.' : 'Нужен BA: из B в A.';
        break;
      }
      case 'vec-coordinates-end':
        point(m.a, 'A');
        if (complete) {
          const b = add(m.a, m.v); point(b, 'B'); vector(m.a, b, 'AB', BLUE, m.v);
          s.legend = 'A' + pair(m.a) + ' · B' + pair(b);
        } else {
          given(m.v, 'AB');
          s.legend = 'A' + pair(m.a) + ' · AB = ' + pair(m.v);
        }
        s.caption = complete ? 'Прибавили перемещение к координатам A и получили B.'
          : 'Точка A и перемещение AB показаны отдельно. Конец B появится после ответа.';
        break;
      case 'vec-coordinates-start':
        point(m.b, 'B');
        if (complete) {
          const a = sub(m.b, m.v); point(a, 'A'); vector(a, m.b, 'AB', BLUE, m.v);
          s.legend = 'A' + pair(a) + ' · B' + pair(m.b);
        } else {
          given(m.v, 'AB');
          s.legend = 'B' + pair(m.b) + ' · AB = ' + pair(m.v);
        }
        s.caption = complete ? 'Стрелка из найденной точки A приводит в B.'
          : 'B — конец. Перемещение AB показано отдельно; положение A ещё неизвестно.';
        break;
      case 'vec-coordinates-equal': {
        point(m.a, 'A'); point(m.b, 'B'); point(m.c, 'C');
        const v = sub(m.b, m.a);
        vector(m.a, m.b, 'AB', BLUE, complete ? v : null);
        if (complete) { const d = add(m.c, v); point(d, 'D'); vector(m.c, d, 'CD', ORANGE, v); }
        s.legend = 'A' + pair(m.a) + ' · B' + pair(m.b) + ' · C' + pair(m.c);
        s.caption = complete ? 'AB и CD имеют одинаковые длину и направление.'
          : 'Из C нужно сделать такое же перемещение, как из A в B. D появится после ответа.';
        break;
      }
      case 'vec-length-basic':
      case 'vec-length-negative':
      case 'vec-length-axis':
        given(m.v, task.id === 'vec-length-negative' ? 'b' : task.id === 'vec-length-axis' ? 'c' : 'a');
        s.legend = 'Координаты: ' + pair(m.v);
        s.caption = complete ? 'Длина стрелки: ' + fmt(task.answer) + '.'
          : 'Координаты задают перемещения. Длина — расстояние от начала стрелки до её конца.';
        break;
      case 'vec-length-points':
        point(m.a, 'A'); point(m.b, 'B');
        vector(m.a, m.b, 'AB', BLUE, earned >= 2 ? sub(m.b, m.a) : null);
        s.legend = 'A' + pair(m.a) + ' · B' + pair(m.b);
        s.caption = 'Сначала найдём перемещение по каждой оси, затем — длину AB.';
        break;
      case 'vec-length-unknown':
        if (complete) {
          given([task.answer, m.other], 'a');
          s.legend = 'a = ' + pair([task.answer, m.other]) + ' · |a| = ' + fmt(m.length);
          s.caption = 'Положительная первая координата направлена вправо.';
        } else {
          s.coordinates = false; s.schematic = 'unknown-length';
          s.construction = independent ? 'Показать связь координат и длины' : null;
          s.caption = 'Схема без масштаба: горизонтальная сторона x пока неизвестна.';
        }
        break;
      case 'vec-length-scaled':
        s.coordinates = false; s.schematic = 'scaled-length';
        s.construction = canConstruct ? 'Показать вектор ' + fmt(m.factor) + 'a' : null;
        s.showScaled = complete || !!options.construction && canConstruct;
        s.caption = s.showScaled ? 'Три равные части по ' + fmt(m.length) + '. Минус меняет направление.' : 'Известна длина a: ' + fmt(m.length) + '. Направление на рисунке выбрано для удобства.';
        break;
      case 'vec-operations-sum':
      case 'vec-operations-difference':
      case 'vec-operations-combination':
      case 'vec-operations-equation':
      case 'vec-operations-scale':
      case 'vec-operations-difference-length': {
        const equation = task.id === 'vec-operations-equation';
        const ka = m.ka === undefined ? 1 : m.ka;
        const kb = m.kb === undefined ? -1 : m.kb;
        const av = mul(m.a, ka), bv = mul(m.b, kb), result = add(av, bv);
        const one = kb === 0;
        const an = equation ? 'c' : 'a', bn = equation ? 'a' : 'b';
        const labelA = ka === 1 ? an : fmt(ka) + an;
        const labelB = kb === 1 ? bn : kb === -1 ? '−' + bn : fmt(kb) + bn;
        const labelResult = equation ? 'b' : one ? labelA : labelA + (kb > 0 ? '+' : '−') + (Math.abs(kb) === 1 ? '' : fmt(Math.abs(kb))) + bn;
        const built = construct(one ? 'Показать ' + labelA : 'Поставить вторую стрелку в конец первой') || complete;
        if (built) {
          if (one) {
            given(m.a, an, '#748492');
            vector(O, av, labelA, BLUE, complete ? av : null);
          } else {
            vector(O, av, labelA, BLUE, complete ? av : null);
            vector(av, result, labelB, ORANGE, complete ? bv : null);
            if (complete) vector(O, result, labelResult, GREEN, result);
          }
          s.caption = one ? 'Отрицательный множитель разворачивает стрелку и меняет её длину.'
            : 'Первая стрелка, затем вторая. Общее перемещение — от начала первой до конца второй.';
        } else {
          given(m.a, an); if (!one) given(m.b, bn, ORANGE);
          s.caption = 'Показаны только данные из условия. Сначала работаем с нужной координатой.';
        }
        s.legend = an + ' = ' + pair(m.a) + (one ? '' : ' · ' + bn + ' = ' + pair(m.b));
        break;
      }
      case 'vec-dot-positive':
      case 'vec-dot-negative':
      case 'vec-dot-self':
        given(m.a, 'a');
        if (task.id !== 'vec-dot-self') given(m.b, 'b', ORANGE);
        s.legend = 'a = ' + pair(m.a) + (task.id === 'vec-dot-self' ? '' : ' · b = ' + pair(m.b));
        s.caption = task.id === 'vec-dot-self' ? 'Умножаем вектор на себя: соответствующие координаты одинаковы.'
          : 'Начала совмещены. Для произведения нужны две пары: x с x, y с y.';
        break;
      case 'vec-dot-perpendicular':
        if (complete) {
          given(m.a, 'a'); given([task.answer, m.by], 'b', ORANGE);
          s.legend = 'a = ' + pair(m.a) + ' · b = ' + pair([task.answer, m.by]);
          s.caption = 'В найденном положении стрелки перпендикулярны.';
        } else {
          s.coordinates = false; s.schematic = 'perpendicular';
          s.legend = 'a = ' + pair(m.a) + ' · b = (x; ' + fmt(m.by) + ')';
          s.caption = 'Схема без координатной шкалы: известен прямой угол, координата x ещё не найдена.';
        }
        break;
      case 'vec-dot-angle': {
        const r = m.angle * Math.PI / 180;
        s.coordinates = false;
        vector(O, [m.lengths[0], 0], 'a, длина ' + fmt(m.lengths[0]));
        vector(O, [m.lengths[1] * Math.cos(r), m.lengths[1] * Math.sin(r)], 'b, длина ' + fmt(m.lengths[1]), ORANGE);
        s.angle = m.angle; s.projectionLabel = 'Показать проекцию b на направление a';
        s.caption = 'Стрелки начинаются в одной точке. Угол между ними — ' + fmt(m.angle) + '°.';
        break;
      }
      case 'vec-dot-cosine':
        s.coordinates = false; s.schematic = 'lengths-only';
        s.legend = '|a| = ' + fmt(m.lengths[0]) + ' · |b| = ' + fmt(m.lengths[1]) + ' · a · b = ' + fmt(m.dot);
        s.caption = 'Показаны длины отдельно. Направления и угол между векторами здесь не изображены.';
        if (complete) {
          s.schematic = null;
          const cosine = m.dot / (m.lengths[0] * m.lengths[1]);
          vector(O, [m.lengths[0], 0], 'a, длина ' + fmt(m.lengths[0]));
          vector(O, [m.lengths[1] * cosine, m.lengths[1] * Math.sqrt(1 - cosine * cosine)], 'b, длина ' + fmt(m.lengths[1]), ORANGE);
          s.angle = Math.acos(cosine) * 180 / Math.PI;
          s.caption = 'После вычисления косинуса можно построить угол между векторами.';
        }
        break;
      default: throw new Error('Unknown vector task: ' + task.id);
    }
    if (s.schematic) s.projection = false;
    if (independent && !complete && !options.projection && !options.construction) {
      s.caption = s.schematic ? 'Схема к условию задачи. Она показана без масштаба.' : 'На рисунке показаны точки и векторы из условия задачи.';
    }
    return s;
  }

  function render(container, task, context) {
    context = context || {};
    const independent = context.mode === 'independent' && !context.solved;
    const document = container.ownerDocument;
    const NS = 'http://www.w3.org/2000/svg', uid = 'vt-' + (++instance);
    const options = { projection: false, construction: false };
    const wrap = document.createElement('div'); wrap.className = 'task-vector-model';
    const drawing = document.createElement('div'); drawing.className = 'task-vector-drawing';
    const legend = document.createElement('p'); legend.className = 'model-legend small';
    const controls = document.createElement('div'); controls.className = 'model-controls actions';
    const caption = document.createElement('p'); caption.className = 'model-caption small';
    caption.setAttribute('aria-live', 'polite');
    wrap.append(drawing, legend, controls, caption); container.replaceChildren(wrap);
    const el = (name, attrs, text) => {
      const node = document.createElementNS(NS, name);
      for (const [key, value] of Object.entries(attrs || {})) node.setAttribute(key, value);
      if (text !== undefined) node.textContent = text;
      return node;
    };
    let buttonsReady = false;
    function paint() {
      const s = sceneFor(task, context, options);
      const svg = el('svg', { viewBox: '0 0 440 320', width: '100%', role: 'img',
        'aria-labelledby': uid + '-title ' + uid + '-desc', 'data-vector-task': task.id });
      svg.style.display = 'block'; svg.style.maxHeight = '380px';
      svg.append(el('title', { id: uid + '-title' }, 'Векторная модель к условию задачи'),
        el('desc', { id: uid + '-desc' }, s.legend + '. ' + s.caption));
      const defs = el('defs');
      for (const [i, color] of [BLUE, ORANGE, GREEN, '#748492', '#667586'].entries()) {
        const marker = el('marker', { id: uid + '-arrow-' + i, viewBox: '0 0 10 10', refX: 8.5,
          refY: 5, markerWidth: 14, markerHeight: 14, orient: 'auto-start-reverse', markerUnits: 'userSpaceOnUse' });
        marker.append(el('path', { d: 'M0 1L9 5L0 9Z', fill: color })); defs.append(marker);
      }
      svg.append(defs);
      const line = (a, b, color, width = 2, extra = {}) => svg.appendChild(el('line', Object.assign({
        x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: color, 'stroke-width': width, 'stroke-linecap': 'round'
      }, extra)));
      const text = (at, value, color = '#263b4c', attrs = {}) => svg.appendChild(el('text', Object.assign({
        x: at[0], y: at[1], fill: color, 'font-size': 17, 'font-family': 'system-ui, sans-serif',
        'paint-order': 'stroke', stroke: '#fff', 'stroke-width': 4, 'stroke-linejoin': 'round'
      }, attrs), value));
      const arrow = (a, b, color = BLUE, attrs = {}) => line(a, b, color, 3, Object.assign({
        'marker-end': 'url(#' + uid + '-arrow-' + Math.max(0, [BLUE, ORANGE, GREEN, '#748492', '#667586'].indexOf(color)) + ')'
      }, attrs));

      if (s.schematic === 'unknown-length') {
        if (independent && !options.construction) {
          text([220, 105], 'a = (x; ' + fmt(task.meta.other) + ')', BLUE, { 'text-anchor': 'middle' });
          text([220, 160], '|a| = ' + fmt(task.meta.length), BLUE, { 'text-anchor': 'middle' });
          text([220, 215], 'x > 0', ORANGE, { 'text-anchor': 'middle' });
        } else {
          const a = [80, 250], b = [345, 250], c = [345, 65];
          line(a, b, ORANGE, 3); line(b, c, ORANGE, 3); arrow(a, c);
          svg.append(el('path', { d: 'M330 250V235H345', fill: 'none', stroke: '#667586', 'stroke-width': 2, 'data-length-triangle': '' }));
          text([200, 278], 'x > 0', ORANGE); text([362, 160], fmt(task.meta.other), ORANGE);
          text([185, 140], '|a| = ' + fmt(task.meta.length), BLUE); text([168, 310], 'Без масштаба', '#667586', { 'font-size': 14 });
        }
      } else if (s.schematic === 'perpendicular') {
        const o = [185, 125], ua = [140, -56], ub = [-46, -115];
        // y is inverted on screen: (5,2) and a perpendicular down-right vector.
        arrow(o, [o[0] + ua[0], o[1] + ua[1]]);
        arrow(o, [o[0] - ub[0], o[1] - ub[1]], ORANGE);
        text([337, 70], 'a', BLUE); text([244, 243], 'b', ORANGE);
        const x = [18.57, -7.43], y = [7.43, 18.57];
        svg.append(el('path', { d: 'M' + (o[0] + x[0]) + ' ' + (o[1] + x[1]) + 'l' + y.join(' ') + 'l' + (-x[0]) + ' ' + (-x[1]), fill: 'none', stroke: '#667586', 'stroke-width': 2 }));
        text([250, 149], '90°'); text([158, 285], 'Без масштаба', '#667586', { 'font-size': 14 });
      } else if (s.schematic === 'scaled-length') {
        arrow([250, 80], [340, 80]); text([260, 55], 'a, длина ' + fmt(task.meta.length), BLUE);
        if (s.showScaled) {
          arrow([340, 195], [70, 195], ORANGE);
          for (let k = 0; k < 3; k++) { const x = 340 - k * 90; line([x, 185], [x, 205], ORANGE); text([x - 48, 227], fmt(task.meta.length), ORANGE); }
          text([160, 165], fmt(task.meta.factor) + 'a' + (s.complete ? ', длина ' + fmt(task.answer) : ''), ORANGE);
        }
      } else if (s.schematic === 'lengths-only') {
        line([95, 105], [345, 105], BLUE, 4); text([162, 80], '|a| = ' + fmt(task.meta.lengths[0]), BLUE);
        line([95, 215], [295, 215], ORANGE, 4); text([145, 192], '|b| = ' + fmt(task.meta.lengths[1]), ORANGE);
        for (const p of [[95, 105], [345, 105], [95, 215], [295, 215]]) line([p[0], p[1] - 7], [p[0], p[1] + 7], '#667586');
      } else {
        const coords = [O].concat(s.points.map(p => p.at), s.vectors.flatMap(v => [v.from, v.to]));
        let xmin = Math.floor(Math.min(...coords.map(p => p[0]))) - 2;
        let xmax = Math.ceil(Math.max(...coords.map(p => p[0]))) + 2;
        let ymin = Math.floor(Math.min(...coords.map(p => p[1]))) - 2;
        let ymax = Math.ceil(Math.max(...coords.map(p => p[1]))) + 2;
        const scale = Math.min(344 / (xmax - xmin), 236 / (ymax - ymin));
        const ox = 48 + (344 - (xmax - xmin) * scale) / 2;
        const oy = 34 + (236 - (ymax - ymin) * scale) / 2;
        const p = a => [ox + (a[0] - xmin) * scale, oy + (ymax - a[1]) * scale];
        const tick = Math.max(xmax - xmin, ymax - ymin) > 22 ? 5 : Math.max(xmax - xmin, ymax - ymin) > 13 ? 2 : 1;
        if (s.coordinates) {
          const zero = p(O);
          for (let x = Math.ceil(xmin / tick) * tick; x <= xmax; x += tick) {
            const at = p([x, 0]); line(p([x, ymin]), p([x, ymax]), '#e3e9ed', 1);
            if (x) { line([at[0], at[1] - 3], [at[0], at[1] + 3], '#667586', 1); text([at[0], at[1] + 17], fmt(x), '#627080', { 'font-size': 13, 'text-anchor': 'middle' }); }
          }
          for (let y = Math.ceil(ymin / tick) * tick; y <= ymax; y += tick) {
            const at = p([0, y]); line(p([xmin, y]), p([xmax, y]), '#e3e9ed', 1);
            if (y) { line([at[0] - 3, at[1]], [at[0] + 3, at[1]], '#667586', 1); text([at[0] - 8, at[1] + 4], fmt(y), '#627080', { 'font-size': 13, 'text-anchor': 'end' }); }
          }
          arrow(p([xmin, 0]), p([xmax, 0]), '#667586', { 'stroke-width': 1.5 });
          arrow(p([0, ymin]), p([0, ymax]), '#667586', { 'stroke-width': 1.5 });
          text([p([xmax, 0])[0] + 12, zero[1] + 5], 'x'); text([zero[0] + 7, p([0, ymax])[1] - 8], 'y');
          text([zero[0] - 8, zero[1] + 18], '0', '#627080', { 'font-size': 13, 'text-anchor': 'end' });
        }
        if (s.projection) for (const v of s.vectors) {
          if (v.color === GREEN) continue;
          const corner = [v.to[0], v.from[1]], a = p(v.from), b = p(corner), c = p(v.to);
          line(a, b, v.color, 2, { 'stroke-dasharray': '5 5', 'data-projection': 'x' });
          line(b, c, v.color, 2, { 'stroke-dasharray': '5 5', 'data-projection': 'y' });
          if (s.vectors.length === 1) {
            if (Math.abs(v.to[0] - v.from[0]) > 0.01) text([(a[0] + b[0]) / 2, a[1] + 27], v.components ? fmt(v.components[0]) : 'по x', v.color, { 'text-anchor': 'middle' });
            if (Math.abs(v.to[1] - v.from[1]) > 0.01) text([b[0] + 11, (b[1] + c[1]) / 2], v.components ? fmt(v.components[1]) : 'по y', v.color);
          }
        }
        for (const v of s.vectors) {
          const a = p(v.from), b = p(v.to), dx = b[0] - a[0], dy = b[1] - a[1], length = Math.hypot(dx, dy);
          if (length < .1) continue;
          arrow(a, b, v.color, { 'data-vector': v.label });
          // Put names beside the middle of each arrow, keeping endpoints free.
          const middle = [a[0] + dx * .58 - dy / length * 14, a[1] + dy * .58 + dx / length * 14];
          text(middle, v.label, v.color, { 'text-anchor': 'middle' });
        }
        for (const q of s.points) {
          const at = p(q.at); svg.append(el('circle', { cx: at[0], cy: at[1], r: 4.5, fill: '#263b4c', 'data-point': q.label }));
          text([at[0] + 7, at[1] - 9], q.label);
        }
        if (!s.coordinates && s.angle) {
          const at = p(O), r = Math.min(scale * 1.5, 34), a = s.angle * Math.PI / 180;
          svg.append(el('path', { d: 'M' + (at[0] + r) + ' ' + at[1] + 'A' + r + ' ' + r + ' 0 0 0 ' + (at[0] + r * Math.cos(a)) + ' ' + (at[1] - r * Math.sin(a)), fill: 'none', stroke: '#667586', 'stroke-width': 1.8 }));
          text([at[0] + (r + 21) * Math.cos(a / 2), at[1] - (r + 21) * Math.sin(a / 2)], fmt(s.angle) + '°', '#263b4c', { 'font-size': 15, 'text-anchor': 'middle' });
        }
      }
      drawing.replaceChildren(svg); legend.textContent = s.legend; legend.hidden = !s.legend;
      caption.textContent = s.caption;
      if (!buttonsReady) {
        function toggle(label, key) {
          const button = document.createElement('button'); button.type = 'button';
          const closedLabel = independent ? 'Показать подсказку к рисунку' : label;
          button.className = 'model-toggle button quiet'; button.textContent = closedLabel;
          button.setAttribute('aria-pressed', 'false'); button.setAttribute('data-model-action', key);
          button.onclick = () => {
            const on = !options[key];
            if (on && independent && typeof context.onHelp === 'function') context.onHelp();
            options[key] = on;
            button.setAttribute('aria-pressed', String(on));
            if (independent) button.textContent = on ? 'Скрыть подсказку' : closedLabel;
            paint();
          };
          controls.append(button);
        }
        if (!s.schematic && (s.coordinates || task.id === 'vec-dot-angle')) toggle(s.projectionLabel, 'projection');
        if (s.construction) toggle(s.construction, 'construction');
        buttonsReady = true;
      }
    }
    paint();
    return () => { controls.querySelectorAll('button').forEach(button => { button.onclick = null; }); };
  }

  const models = root.ProfileTaskModels = root.ProfileTaskModels || {};
  for (const id of ids) models[id] = render;
  if (typeof module !== 'undefined' && module.exports) module.exports = { ids, sceneFor, render };
})(globalThis);

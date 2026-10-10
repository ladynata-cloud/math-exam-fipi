(function (root) {
  'use strict';

  // This same continuous board is drawn live and recorded into the lesson video.
  // A step may add writing, but never replaces the problem or completed rows.
  const layout = Object.freeze({
    width: 1280, height: 800,
    helper: Object.freeze({ x: 32, y: 180, w: 424, h: 564 }),
    main: Object.freeze({ x: 480, y: 180, w: 768, h: 564 })
  });
  const C = { paper: '#f5f2e9', panel: '#fffdf7', ink: '#233c51', muted: '#60717b',
    blue: '#24698c', blueTint: '#e9f2f5', green: '#317c5a', greenTint: '#e8f3e9',
    border: '#d8e0db', line: '#cad6d7', orange: '#b46734', orangeTint: '#fff0dd' };
  const FONT = '"DejaVu Sans", Arial, sans-serif';
  const MONO = '"DejaVu Sans Mono", Consolas, monospace';
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const str = v => v == null ? '' : String(v);

  function font(c, size, weight = 400, mono = false) {
    c.font = weight + ' ' + size + 'px ' + (mono ? MONO : FONT);
  }
  function line(c, x1, y1, x2, y2, color = C.line, width = 2) {
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2);
    c.strokeStyle = color; c.lineWidth = width; c.stroke();
  }
  function rect(c, x, y, w, h, color, radius = 16) {
    c.beginPath();
    if (c.roundRect) c.roundRect(x, y, w, h, radius);
    else c.rect(x, y, w, h);
    c.fillStyle = color; c.fill();
  }
  function text(c, value, x, y, size = 28, color = C.ink, weight = 400, mono = false) {
    font(c, size, weight, mono); c.fillStyle = color; c.fillText(str(value), x, y);
  }
  function fit(c, value, x, y, width, size = 30, color = C.ink, weight = 400, min = 22) {
    let fs = size; font(c, fs, weight);
    while (fs > min && c.measureText(str(value)).width > width) font(c, --fs, weight);
    c.fillStyle = color; c.fillText(str(value), x, y, width);
    return fs;
  }
  function wrapped(c, value, width, size, weight = 400) {
    font(c, size, weight);
    const result = [];
    for (const paragraph of str(value).split('\n')) {
      let row = '';
      for (const word of paragraph.split(/\s+/).filter(Boolean)) {
        const next = row ? row + ' ' + word : word;
        if (row && c.measureText(next).width > width) { result.push(row); row = word; }
        else row = next;
      }
      result.push(row);
    }
    return result;
  }
  function paragraph(c, value, x, y, width, size, color, maxHeight, weight = 400) {
    let fs = size, lines = wrapped(c, value, width, fs, weight);
    while (fs > 19 && lines.length * (fs * 1.25) > maxHeight) {
      fs--; lines = wrapped(c, value, width, fs, weight);
    }
    const lh = fs * 1.25;
    lines.forEach((row, i) => text(c, row, x, y + i * lh, fs, color, weight));
    return lines.length * lh;
  }
  function arrow(c, x1, y1, x2, y2, color = C.blue, width = 3) {
    const a = Math.atan2(y2 - y1, x2 - x1), s = 9;
    line(c, x1, y1, x2, y2, color, width);
    line(c, x2, y2, x2 - s * Math.cos(a - .5), y2 - s * Math.sin(a - .5), color, width);
    line(c, x2, y2, x2 - s * Math.cos(a + .5), y2 - s * Math.sin(a + .5), color, width);
  }
  function panel(c, box, label) {
    rect(c, box.x, box.y, box.w, box.h, C.panel);
    c.strokeStyle = C.border; c.lineWidth = 1; c.stroke();
    text(c, label, box.x + 24, box.y + 37, 20, C.muted, 700);
    line(c, box.x + 24, box.y + 53, box.x + box.w - 24, box.y + 53, C.border, 1);
  }

  function drawDots(c, v, plan, shown) {
    const a = Math.max(0, Number(v.a) || 0), b = Math.max(0, Number(v.b) || 0);
    const subtract = plan.topicId === 'subtract-ten' || plan.topicId === 'subtract-twenty';
    const story = plan.topicId === 'stories';
    const n = Math.min(40, subtract ? a : story && !shown ? a : a + b), spacing = 35;
    const start = 543, y = 278;
    for (let i = 0; i < n; i++) {
      const x = start + (i % 17) * spacing, yy = y + Math.floor(i / 17) * 37;
      c.beginPath(); c.arc(x, yy, 11, 0, Math.PI * 2);
      c.fillStyle = i < a ? C.blue : C.orange; c.fill();
      const removed = !shown ? 0 : shown >= 3 ? b : plan.topicId === 'subtract-twenty' ? a - 10 : 1;
      if (subtract && i >= a - removed) {
        line(c, x - 11, yy - 13, x + 11, yy + 13, C.orange, 3);
        line(c, x - 11, yy + 13, x + 11, yy - 13, C.orange, 3);
      }
    }
    if (story && !shown) text(c, 'Вторая полка: ?', 842, 314, 29, C.orange, 600);
    const label = subtract ? 'Убираем предметы по частям' : story ? 'Две полки — две группы предметов' : plan.topicId === 'compare' ? 'Сравни две группы предметов' : 'Предметы помогают увидеть части числа';
    fit(c, label, 523, 385, 660, 26, C.muted);
  }
  function drawGroups(c, v, plan, shown) {
    const count = Math.min(12, Math.max(1, Number(v.count) || 1));
    const sharing = plan.topicId === 'sharing';
    const each = Math.min(20, Math.max(0, sharing ? shown >= 3 ? Number(v.each) : shown ? 2 : 0 : Number(v.each) || 0));
    const gap = 12, width = Math.min(150, (664 - gap * (Math.min(count, 6) - 1)) / Math.min(count, 6));
    const rows = count > 6 ? 2 : 1, h = rows === 2 ? 59 : 104;
    for (let i = 0; i < count; i++) {
      const x = 524 + (i % 6) * (width + gap), y = 253 + Math.floor(i / 6) * (h + 12);
      rect(c, x, y, width, h, i % 2 ? C.greenTint : C.blueTint, 11);
      const cols = Math.min(each || 1, Math.max(2, Math.floor(width / 17)));
      const rr = Math.ceil(each / cols) || 1;
      const pitchX = Math.min(21, width / (cols + 1)), pitchY = Math.min(23, h / (rr + 1));
      for (let j = 0; j < each; j++) {
        c.beginPath(); c.arc(x + width / 2 + (j % cols - (cols - 1) / 2) * pitchX,
          y + h / 2 + (Math.floor(j / cols) - (rr - 1) / 2) * pitchY, rows === 2 ? 4 : 5, 0, 2 * Math.PI);
        c.fillStyle = C.blue; c.fill();
      }
    }
    const label = sharing ? count + ' участников • раздаём по одному каждому' : count + ' групп • по ' + each + ' в каждой';
    fit(c, label, 524, 395, 664, 25, C.muted);
  }
  function drawPlace(c, v, shown) {
    const value = Math.max(0, Number(v.value) || 0);
    const rows = [
      ['Сотен', Math.floor(value / 100), 100],
      ['Десятков', Math.floor(value / 10) % 10, 10],
      ['Единиц', value % 10, 1]
    ];
    // These are the separate quantities from the condition. Do not arrange the
    // three digits as an already assembled answer before the final step.
    rows.forEach(([label, digit, factor], i) => {
      const y = 252 + i * 49;
      rect(c, 525, y, 672, 42, i % 2 ? C.greenTint : C.blueTint, 9);
      text(c, label + ': ' + digit, 543, y + 30, 27, C.blue, 600);
      if ((i === 0 && shown >= 1) || (i === 1 && shown >= 2)) {
        text(c, digit + ' × ' + factor + ' = ' + digit * factor, 856, y + 30, 25, C.green, 600);
      }
    });
  }
  function drawColumn(c, v, plan, shown) {
    const a = str(v.a), b = str(v.b), cw = 32;
    const n = Math.max(a.length, b.length), right = 921, yy = 281;
    const row = (value, y, color = C.ink) => [...str(value)].forEach((ch, i) => text(c, ch, right - (str(value).length - i) * cw, y, 39, color, 500, true));
    row(a, yy);
    if (v.op === '-' && shown) {
      const original = a.split('').reverse().map(Number), adjusted = [...original];
      const subtractor = b.split('').reverse().map(Number);
      for (let i = 0; i < Math.min(shown, 3); i++) {
        if (adjusted[i] < (subtractor[i] || 0)) {
          let lender = i + 1;
          while (adjusted[lender] === 0) lender++;
          for (let j = lender; j > i; j--) { adjusted[j]--; adjusted[j - 1] += 10; }
        }
      }
      adjusted.forEach((digit, i) => {
        if (digit === original[i]) return;
        const xx = right - (i + 1) * cw;
        line(c, xx - 2, yy - 7, xx + 24, yy - 29, C.orange, 2);
        text(c, digit, xx - (digit > 9 ? 3 : 0), yy - 34, 20, C.orange, 600, true);
      });
    }
    text(c, v.op === '-' ? '−' : v.op || '+', right - (n + 1.4) * cw, yy + 53, 35, C.blue);
    row(b, yy + 53);
    line(c, right - (n + .1) * cw, yy + 64, right + 2, yy + 64, C.ink, 2);
    if (!shown) text(c, '?', right - 29, yy + 104, 33, C.muted, 400, true);
    else if (shown >= plan.steps.length) row(plan.answer, yy + 104, C.green);
    else {
      for (let i = 0; i < Math.min(3, shown); i++) {
        const result = Number(plan.steps[i].answer);
        text(c, result % 10, right - (i + 1) * cw, yy + 104, 39, C.green, 600, true);
        if (v.op !== '-' && result >= 10) text(c, Math.floor(result / 10), right - (i + 2) * cw + 7, yy - 34, 20, C.orange, 600, true);
      }
    }
  }
  function drawFraction(c, v) {
    const n = Math.max(0, Number(v.n) || 0), d = Math.max(1, Number(v.d) || 1);
    // The drawing represents the given fraction only, never v.answer/result.
    const cells = Math.min(d, 60), w = 646 / cells;
    for (let i = 0; i < cells; i++) {
      rect(c, 531 + i * w, 268, w - 4, 62, i < n ? C.blue : C.blueTint, 3);
    }
    fit(c, 'Целое разделено на ' + d + ' равных частей; взято ' + n, 526, 378, 660, 27, C.muted);
  }
  function drawPercent(c, v, done) {
    const percent = Number(v.percent) || 0;
    const known = key => done || v.unknown !== key;
    const p = known('percent') ? str(v.percent) + '%' : '?%';
    const whole = known('whole') ? str(v.whole) : '?';
    const part = known('part') ? str(v.part) : '?';
    rect(c, 526, 267, 666, 55, C.blueTint, 9);
    // Use a neutral half-bar when the percentage is the unknown.
    rect(c, 526, 267, 666 * (known('percent') ? clamp(percent / 100, 0, 1) : .5), 55, C.blue, 9);
    text(c, '100% — ' + whole, 529, 361, 29, C.ink, 600);
    text(c, p + ' — ' + part, 871, 361, 29, C.blue, 600);
    if (!known('percent')) text(c, 'Схема условная', 529, 396, 19, C.muted);
  }

  function standard(c, plan, count, reveal, active) {
    const steps = plan.steps || [], shown = Math.min(steps.length, Math.max(count, reveal ? active + 1 : count));
    if (plan.visual) {
      switch (plan.visual.kind) {
        case 'dots': drawDots(c, plan.visual, plan, shown); break;
        case 'groups': drawGroups(c, plan.visual, plan, shown); break;
        case 'place': drawPlace(c, plan.visual, shown); break;
        case 'column': drawColumn(c, plan.visual, plan, shown); break;
        case 'fraction': drawFraction(c, plan.visual); break;
        case 'percent': drawPercent(c, plan.visual, count === steps.length); break;
      }
    }
    const firstY = plan.visual ? 439 : 283;
    const gap = Math.min(61, (700 - firstY) / Math.max(1, steps.length - 1));
    for (let i = 0; i < shown; i++) {
      const y = firstY + i * gap, current = i === shown - 1;
      if (current) rect(c, 503, y - 28, 720, Math.min(gap - 3, 42), C.greenTint, 8);
      text(c, i + 1, 516, y, 21, C.green, 700);
      fit(c, steps[i].record || steps[i].answer, 553, y, 647, Math.min(31, gap - 7), C.ink, current ? 600 : 400, 22);
    }
    if (!shown) text(c, 'Здесь будет собираться решение.', 528, plan.visual ? 460 : 299, 26, C.muted);
  }

  function visibility(p, count, reveal, active) {
    const display = Math.min(p.actions.length, Math.max(count, reveal ? active + 1 : count));
    return p.actions[display]?.visibleBaseStep ?? p.baseActions.length;
  }
  function division(c, plan, count, reveal, active) {
    const p = plan.division;
    if (!p || !p.baseActions || !p.cycles) return;
    const visible = visibility(p, count, reveal, active);
    const current = p.actions[active];
    const base = p.baseActions, earned = kind => visible > base.findIndex(a => a.kind === kind);
    const norm = p.normalizationEnd > 0;
    if (norm) {
      text(c, 'Убираем запятую в делителе', 506, 263, 23, C.blue, 700);
      const factor = earned('shift-factor') ? base.find(a => a.kind === 'shift-factor').answer : '?';
      const aa = earned('shift-dividend') ? p.normalizedDividend : '?';
      const bb = earned('shift-divisor') ? p.normalizedDivisor : '?';
      fit(c, p.task.dividend + ' × ' + factor + ' = ' + aa, 507, 300, 358, 26, C.ink, 600);
      fit(c, p.task.divisor + ' × ' + factor + ' = ' + bb, 876, 300, 337, 26, C.ink, 600);
      line(c, 504, 319, 1221, 319, C.border, 1);
    }
    if (visible < p.normalizationEnd) {
      paragraph(c, 'Переносим обе запятые вправо на одинаковое число мест. Затем начинаем уголок.', 537, 406, 620, 30, C.muted, 150);
      return;
    }
    if (p.micropractice) {
      fit(c, p.task.dividend + ' : ' + p.task.divisor + ' = ' + (count || reveal ? p.actions[0].answer : '?'), 544, 389, 620, 57, C.blue, 600);
      return;
    }
    const topY = norm ? 363 : 281;
    const rowH = Math.min(39, (702 - topY) / Math.max(2, 2 * p.cycles.length));
    const size = Math.min(36, rowH + 1);
    const cw = Math.min(38, 440 / Math.max(7, p.digits.length));
    const commaGap = cw * .30, origin = 539;
    const digitX = i => origin + i * cw + (i >= p.intLen ? commaGap : 0);
    const lastX = digitX(p.digits.length - 1), barX = Math.max(862, lastX + cw + 16);
    const rightX = barX + 21;
    let length = p.originalLength;
    for (const a of base.slice(0, visible)) if (a.kind === 'bring') length = Math.max(length, a.sourceIndex + 1);
    let quotient = '';
    for (const a of base.slice(0, visible)) {
      if (a.kind === 'digit') quotient += a.answer;
      if (a.kind === 'comma') quotient += ',';
    }
    const yEnd = Math.min(715, topY + rowH * Math.max(2, p.cycles.length * 2) + 5);
    line(c, barX, topY - size + 2, barX, Math.min(topY + rowH + 10, yEnd), C.ink, 3);
    line(c, barX, topY + 10, 1201, topY + 10, C.ink, 3);
    text(c, p.normalizedDivisor, rightX, topY, size, C.ink, 600, true);
    fit(c, quotient || '?', rightX, topY + rowH + 7, 1200 - rightX, size, quotient ? C.green : C.muted, 600, 24);
    if (length > p.originalLength) {
      const extended = p.normalizedDividend + (p.normalizedDividend.includes(',') ? '' : ',') + '0'.repeat(length - p.originalLength);
      fit(c, p.normalizedDividend + ' = ' + extended, rightX, topY + rowH * 2 + 42, 1200 - rightX, 23, C.muted, 500, 21);
    }
    const activeCycle = Number.isInteger(current?.cycle) ? current.cycle : p.cycles.findIndex(item => item.sourceIndex === current?.sourceIndex);
    const rowNumber = (value, end, y, color, minus) => {
      const digits = str(value), start = end - digits.length + 1;
      if (minus) text(c, '−', digitX(start) - cw * .8, y, size - 4, C.muted, 400, true);
      [...digits].forEach((d, j) => text(c, d, digitX(start + j), y, size, color, 500, true));
    };
    for (let i = 0; i < length; i++) {
      const isSource = current && ['bring', 'partial'].includes(current.kind) && i === current.sourceIndex;
      if (isSource) rect(c, digitX(i) - 5, topY - size, cw - 1, size + 9, C.orangeTint, 5);
      text(c, p.digits[i], digitX(i), topY, size, isSource ? C.orange : C.ink, 500, true);
      if (i === p.intLen - 1 && length > p.intLen) text(c, ',', digitX(i) + cw * .71, topY, size, C.ink, 500, true);
    }
    // Select the first incomplete dividend only once that choice has been made.
    if (earned('start') && activeCycle <= 0) {
      line(c, digitX(0), topY - size - 5, digitX(p.cycles[0].sourceIndex) + cw * .68, topY - size - 5, C.blue, 3);
    }
    for (let i = 0; i < p.cycles.length; i++) {
      const cycle = p.cycles[i], productY = topY + (2 * i + 1) * rowH, restY = productY + rowH;
      if (visible <= cycle.productAction) break;
      rowNumber(cycle.product, cycle.sourceIndex, productY, C.ink, true);
      line(c, digitX(Math.max(0, cycle.sourceIndex - str(cycle.partial).length + 1)) - 4, productY + 7,
        digitX(cycle.sourceIndex) + cw * .70, productY + 7, C.ink, 2);
      if (visible <= cycle.subtractAction) break;
      const next = p.cycles[i + 1];
      const bringIndex = next ? base.findIndex(a => a.kind === 'bring' && a.sourceIndex === next.sourceIndex) : -1;
      const brought = next && visible > bringIndex;
      const value = brought ? next.partial : cycle.remainder;
      const end = brought ? next.sourceIndex : cycle.sourceIndex;
      // A row remains in place; bringing a digit extends this very remainder.
      rowNumber(value, end, restY, i === activeCycle || i + 1 === activeCycle ? C.blue : C.ink, false);
      if (next && current && ['bring', 'partial'].includes(current.kind) && current.sourceIndex === next.sourceIndex) {
        const x = digitX(next.sourceIndex) + cw * .86;
        arrow(c, x, topY + 10, x, restY - size + 2, C.orange, 2.5);
        if (!brought) {
          c.strokeStyle = C.orange; c.lineWidth = 2;
          c.strokeRect(digitX(next.sourceIndex) - 3, restY - size + 3, cw - 4, size + 2);
        }
      }
    }
    if (count === plan.steps.length) {
      const check = p.task.divisor + ' × ' + p.quotient + (p.task.level === 'remainder' ? ' + ' + p.remainder : '') + ' = ' + p.task.dividend;
      fit(c, 'Проверка: ' + check, 512, 730, 700, 23, C.green, 600);
    }
  }

  function helper(c, plan, count, options, active) {
    const steps = plan.steps || [], step = count === steps.length && options.activeStep == null ? null : steps[active];
    if (!step) {
      text(c, 'Решение завершено', 60, 293, 30, C.green, 700);
      paragraph(c, 'Вся запись остаётся перед глазами. Проследи путь от условия до ответа.', 60, 346, 362, 27, C.muted, 145);
      rect(c, 59, 503, 369, 112, C.greenTint, 12);
      text(c, 'Ответ', 79, 541, 22, C.green, 600);
      fit(c, plan.answer, 79, 587, 327, 37, C.green, 700, 25);
      return;
    }
    const box = layout.helper, progress = clamp(Number(options.progress) || 0, 0, 1);
    const zoom = options.camera === 'detail' && !options.reducedMotion ? 1 + .08 * Math.sin(Math.PI * progress) ** 2 : 1;
    c.save(); c.beginPath(); c.rect(box.x + 15, box.y + 62, box.w - 30, box.h - 78); c.clip();
    const cx = box.x + box.w / 2, cy = box.y + 279;
    c.translate(cx, cy); c.scale(zoom, zoom); c.translate(-cx, -cy);
    const raw = step.raw || (plan.division && plan.division.actions[active]);
    const isDigit = raw?.kind === 'digit' && plan.division;
    const promptHeight = paragraph(c, step.prompt, 63, 277, 360, 28, C.ink, 131, 600);
    let y = 285 + promptHeight;
    if (options.reveal) {
      const hintHeight = paragraph(c, step.hint || '', 63, y, 360, 23, C.muted, isDigit ? 128 : 148);
      y += hintHeight + 22;
      if (isDigit) {
        const p = plan.division, cycle = p.cycles[raw.cycle];
        const start = Math.max(553, Math.min(578, y));
        for (let k = 0; k <= 9; k++) {
          const xx = 62 + (k >= 5 ? 185 : 0), yy = start + (k % 5) * 29;
          if (k === cycle.qd) rect(c, xx - 5, yy - 22, 178, 27, C.greenTint, 5);
          fit(c, p.normalizedDivisor + ' × ' + k + ' = ' + p.normalizedDivisor * k, xx, yy, 169, 23, k === cycle.qd ? C.green : C.ink, k === cycle.qd ? 700 : 400, 19);
        }
      } else {
        let helpers = Array.isArray(step.helper) ? step.helper : step.helper ? [step.helper] : [];
        // The current column and operands are already named in the prompt and
        // hint. Give the available space to the actual borrowing explanation.
        if (plan.topicId === 'column-subtract' && helpers.length > 4) helpers = helpers.slice(2);
        if (helpers.length) paragraph(c, helpers.join('\n'), 63, y, 357, 25, C.blue, 711 - y, 600);
        else fit(c, step.answer, 63, y, 357, 35, C.blue, 600);
      }
    } else {
      line(c, 64, 578, 421, 578, C.border, 1);
      paragraph(c, 'Выполни этот шаг. Сделанная часть решения остаётся справа.', 63, 619, 357, 25, C.muted, 90);
    }
    c.restore();
  }

  function draw(canvas, plan, completed = 0, options = {}) {
    if (!canvas || !plan) return;
    const c = canvas.getContext('2d'); if (!c) return;
    const steps = plan.steps || [];
    const count = clamp(Math.floor(Number(completed) || 0), 0, steps.length);
    const active = clamp(options.activeStep == null ? count : Math.floor(Number(options.activeStep) || 0), 0, Math.max(0, steps.length - 1));
    if (!canvas.width) canvas.width = layout.width;
    if (!canvas.height) canvas.height = layout.height;
    c.save(); c.setTransform(canvas.width / layout.width, 0, 0, canvas.height / layout.height, 0, 0);
    c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.lineCap = 'round'; c.lineJoin = 'round';
    c.fillStyle = C.paper; c.fillRect(0, 0, layout.width, layout.height);
    text(c, 'МАТЕМАТИКА ПО СОВЕТСКИМ УЧЕБНИКАМ', 34, 40, 18, C.muted, 700);
    fit(c, options.title || plan.title || 'Разбираемся по шагам', 34, 79, 1145, 30, C.blue, 700);
    const promptLines = wrapped(c, plan.prompt, 1187, 36, 600);
    if (promptLines.length === 1) text(c, plan.prompt, 34, 138, 36, C.ink, 600);
    else paragraph(c, plan.prompt, 34, 119, 1187, 31, C.ink, 67, 600);
    panel(c, layout.helper, count === steps.length ? 'ИТОГ' : 'РАЗБИРАЕМ ТЕКУЩИЙ ШАГ');
    panel(c, layout.main, plan.kind === 'division' ? 'ДЕЛЕНИЕ УГОЛКОМ' : 'ВСЁ РЕШЕНИЕ НА ОДНОЙ ДОСКЕ');
    helper(c, plan, count, options, active);
    if (plan.kind === 'division') division(c, plan, count, Boolean(options.reveal), active);
    else standard(c, plan, count, Boolean(options.reveal), active);
    text(c, count === steps.length ? 'Готово • решение целиком' : 'Шаг ' + (active + 1) + ' из ' + steps.length, 36, 779, 20, C.muted, 500);
    if (options.source) {
      let sourceSize = 18, sourceLines = wrapped(c, options.source, 818, sourceSize);
      while (sourceLines.length > 2 && sourceSize > 15) {
        sourceSize--; sourceLines = wrapped(c, options.source, 818, sourceSize);
      }
      const startY = sourceLines.length > 1 ? 765 : 779;
      sourceLines.forEach((row, i) => text(c, row, 412, startY + i * 22, sourceSize, C.muted));
    } else text(c, 'mathexam.space', 1056, 779, 20, C.muted);
    c.restore();
  }

  const api = { draw, layout };
  root.SovietBoard = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);

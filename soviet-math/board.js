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
  function drawGroups(c, v, plan) {
    const box = modelArea(plan), count = Math.max(1, Number(v.count)), each = Math.max(0, Number(v.each));
    const columns = Math.min(4, count), rows = Math.ceil(count / columns), gap = 14;
    const width = (box.w - gap * (columns - 1)) / columns, height = Math.min(135, (box.h - 40) / rows - 12);
    for (let i = 0; i < count; i++) {
      const x = box.x + i % columns * (width + gap), y = box.y + Math.floor(i / columns) * (height + 12);
      c.beginPath(); c.ellipse(x + width / 2, y + height / 2, width / 2 - 4, height / 2 - 4, 0, 0, Math.PI * 2);
      c.fillStyle = i % 2 ? C.greenTint : C.blueTint; c.fill(); c.strokeStyle = C.line; c.lineWidth = 2; c.stroke();
      const cols = Math.min(4, each), rr = Math.ceil(each / cols), sx = Math.min(31, (width - 25) / cols), sy = Math.min(34, (height - 20) / rr);
      for (let j = 0; j < each; j++) {
        const xx = x + width / 2 + (j % cols - (cols - 1) / 2) * sx, yy = y + height / 2 + (Math.floor(j / cols) - (rr - 1) / 2) * sy;
        if (v.object === 'apple') icon(c, 'apple', xx - 12, yy - 12, C.orange, 25);
        else { c.beginPath(); c.arc(xx, yy, Math.min(9, sx * .3), 0, Math.PI * 2); c.fillStyle = C.blue; c.fill(); }
      }
    }
    fit(c, v.object === 'apple' ? 'Тарелок: ' + count + '. Яблок на каждой: ' + each + '.' : 'Групп: ' + count + '. В каждой: ' + each + '.', box.x + 4, box.y + rows * (height + 12) + 23, box.w - 8, 28, C.muted);
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

  function drawFacts(c, v) {
    const rows = (v.rows || []).slice(0, 4);
    rows.forEach((row, i) => {
      const y = 253 + i * 40;
      rect(c, 525, y, 672, 36, i % 2 ? C.greenTint : C.blueTint, 8);
      fit(c, row, 541, y + 26, 642, 25, C.ink, 500, 20);
    });
  }
  function drawFractionPair(c, v) {
    [v.left, v.right].forEach((f, row) => {
      const y = 257 + row * 74, width = 545, x = 646;
      const d = Math.max(1, Number(f.d)), n = Math.max(0, Number(f.n));
      text(c, n + '/' + d, 527, y + 31, 31, C.ink, 600);
      for (let i = 0; i < d; i++) {
        rect(c, x + i * width / d, y, width / d - 2, 40,
          i < n ? (row ? C.green : C.blue) : C.blueTint, 2);
      }
    });
    text(c, 'Полосы изображают одинаковые целые.', 527, 410, 24, C.muted);
  }
  function modelArea(plan) {
    const firstRecord = Math.max(439, 700 - Math.max(0, plan.steps.length - 1) * 51);
    return { x: 518, y: 254, w: 686, h: Math.min(350, firstRecord - 304), firstRecord };
  }
  function visualState(v, shown) {
    return Array.isArray(v.states) ? Object.assign({}, ...v.states.slice(0, Math.min(shown + 1, v.states.length))) : {};
  }
  function icon(c, item, x, y, color, size = 28, faded = false) {
    c.save(); if (faded) c.globalAlpha = .22;
    if (item === 'pencil') {
      rect(c, x + size * .35, y + 3, size * .30, size * .80, color, 3);
      c.beginPath(); c.moveTo(x + size * .35, y + size * .83); c.lineTo(x + size * .65, y + size * .83);
      c.lineTo(x + size * .5, y + size); c.closePath(); c.fillStyle = C.orange; c.fill();
      line(c, x + size * .42, y + 6, x + size * .42, y + size * .72, '#ffffff', 1.5);
    } else if (item === 'apple') {
      c.beginPath(); c.arc(x + size * .43, y + size * .57, size * .38, 0, Math.PI * 2); c.fillStyle = color; c.fill();
      line(c, x + size * .45, y + size * .20, x + size * .52, y + 1, C.green, 2);
      c.beginPath(); c.ellipse(x + size * .62, y + size * .15, size * .17, size * .08, -.5, 0, Math.PI * 2); c.fillStyle = C.green; c.fill();
    } else if (item === 'notebook' || item === 'book') {
      rect(c, x + 2, y, size * .8, size, color, 3);
      line(c, x + 8, y + 2, x + 8, y + size - 2, '#ffffff', 2);
      line(c, x + 12, y + size * .38, x + size * .65, y + size * .38, '#ffffff', 2);
      line(c, x + 12, y + size * .57, x + size * .65, y + size * .57, '#ffffff', 2);
    } else {
      rect(c, x, y + 3, size * .86, size * .86, color, 5);
      line(c, x + 4, y + 7, x + size * .70, y + 7, '#ffffff', 2);
      line(c, x + 4, y + 7, x + 4, y + size * .70, '#ffffff', 2);
    }
    c.restore();
  }
  function tray(c, x, y, w, h, label, shade = C.blueTint) {
    rect(c, x, y, w, h, shade, 14);
    c.strokeStyle = C.border; c.lineWidth = 1; c.stroke();
    fit(c, label, x + 12, y + 29, w - 24, 22, C.muted, 600, 19);
  }
  function drawObjects(c, v, plan, shown, motion = 1) {
    const box = modelArea(plan), state = visualState(v, shown);
    const a = Number(v.a) || 0, b = Number(v.b) || 0, total = Number(v.total) || a + b;
    const target = clamp(state.moved == null ? shown ? b : 0 : state.moved, 0, b);
    const previous = Number(visualState(v, Math.max(0, shown - 1)).moved) || 0;
    const moving = previous + (target - previous) * motion, moved = Math.floor(moving), fraction = moving - moved;
    const item = v.item || v.object || 'cube';
    if (v.mode === 'compare') {
      const count = Math.max(a, b), pitch = Math.min(55, (box.w - 100) / Math.max(1, count));
      const size = Math.min(34, pitch - 8), y1 = box.y + 40, y2 = box.y + 144;
      text(c, '1', box.x + 7, y1 + 27, 27, C.blue, 700);
      text(c, '2', box.x + 7, y2 + 27, 27, C.green, 700);
      for (let i = 0; i < a; i++) icon(c, item, box.x + 51 + pitch * i, y1, C.blue, size);
      for (let i = 0; i < b; i++) icon(c, item, box.x + 51 + pitch * i, y2, C.green, size);
      const pairs = Math.floor((state.pairs == null ? shown ? Math.min(a, b) : 0 : state.pairs) * motion);
      for (let i = 0; i < pairs; i++) line(c, box.x + 51 + pitch * i + size / 2, y1 + size + 7,
        box.x + 51 + pitch * i + size / 2, y2 - 8, C.line, 3);
      fit(c, shown ? 'У этих предметов нет пары.' : 'Составим пары: по одному из каждого ряда.', box.x + 8, box.y + 245, box.w - 16, 25, C.muted);
      if (shown && motion === 1) {
        const longerY = a > b ? y1 : y2, start = Math.min(a, b);
        line(c, box.x + 46 + pitch * start, longerY + size + 12, box.x + 51 + pitch * (count - 1) + size, longerY + size + 12, C.orange, 4);
      }
      return;
    }
    const left = { x: box.x, y: box.y + 10, w: 426, h: Math.min(224, box.h - 61) };
    const right = { x: box.x + 448, y: left.y, w: 238, h: left.h };
    const isMissing = v.mode === 'missing', isSubtract = v.mode === 'subtract';
    const itemName = item === 'pencil' ? 'Карандаши' : item === 'notebook' ? 'Тетради' : 'Кубики';
    tray(c, left.x, left.y, left.w, left.h, isMissing ? 'Нужно всего: ' + total : itemName, C.blueTint);
    tray(c, right.x, right.y, right.w, right.h, isMissing ? 'Нужно добавить' : isSubtract ? 'Взяли: ' + b : (moved === b ? 'Добавили: ' : 'Добавим: ') + b, C.orangeTint);
    const cols = 8, pitch = 46, size = 31, position = i => ({ x: left.x + 20 + i % cols * pitch, y: left.y + 53 + Math.floor(i / cols) * 45 });
    const baseCount = isMissing ? total : isSubtract ? a : a + b;
    for (let i = 0; i < baseCount; i++) {
      const p = position(i);
      if (isSubtract) {
        const removed = i >= a - moved || fraction > 0 && i === a - moved - 1;
        icon(c, item, p.x, p.y, C.blue, size, removed);
      } else if (i < a) icon(c, item, p.x, p.y, C.blue, size);
      else if (i < a + moved) icon(c, item, p.x, p.y, C.orange, size);
      else if (isMissing) { c.strokeStyle = C.line; c.lineWidth = 2; c.strokeRect(p.x + 1, p.y + 3, size * .86, size * .86); }
    }
    const rightPos = i => ({ x: right.x + 20 + i % 4 * 49, y: right.y + 53 + Math.floor(i / 4) * 45 });
    if (isSubtract) {
      for (let i = 0; i < moved; i++) { const p = rightPos(i); icon(c, item, p.x, p.y, C.orange, size); }
    } else if (!isMissing || state.shownB) {
      for (let i = moved; i < b; i++) { if (fraction > 0 && i === moved) continue; const p = rightPos(i); icon(c, item, p.x, p.y, C.orange, size); }
    }
    if (fraction > 0) {
      const from = isSubtract ? position(a - moved - 1) : rightPos(moved), to = isSubtract ? rightPos(moved) : position(a + moved);
      icon(c, item, from.x + (to.x - from.x) * fraction, from.y + (to.y - from.y) * fraction - 27 * Math.sin(Math.PI * fraction), C.orange, size);
    }
    if (isMissing && !state.shownB) text(c, '?', right.x + 93, right.y + 118, 49, C.orange, 700);
    const arrowY = left.y + left.h + 27;
    if (isSubtract) arrow(c, left.x + 350, arrowY, right.x + 45, arrowY, C.orange, 3);
    else arrow(c, right.x + 45, arrowY, left.x + 350, arrowY, C.orange, 3);
    fit(c, isSubtract ? 'Убрали предметы, но видно, откуда их взяли.' : 'Соединяем предметы. Каждый считаем один раз.', box.x + 8, arrowY + 40, box.w - 16, 24, C.muted);
  }
  function drawTenFrame(c, v, plan, shown, motion = 1) {
    const box = modelArea(plan), state = visualState(v, shown), a = Number(v.a), b = Number(v.b);
    const target = state.moved == null ? shown ? b : 0 : state.moved;
    const previous = Number(visualState(v, Math.max(0, shown - 1)).moved) || 0;
    const moved = Math.floor(previous + (target - previous) * motion);
    const subtract = v.mode === 'subtract', cell = 43, x = box.x + 12, y = box.y + 38;
    text(c, '10 мест — один десяток', x, box.y + 20, 23, C.muted, 600);
    const resultCount = subtract ? a - moved : a + moved;
    for (let i = 0; i < 20; i++) {
      const xx = x + i % 10 * cell, yy = y + Math.floor(i / 10) * 68;
      rect(c, xx, yy, 37, 46, i < 10 ? C.blueTint : C.greenTint, 6);
      if (i < resultCount) icon(c, 'cube', xx + 6, yy + 9, i < a ? C.blue : C.orange, 27);
      else if (subtract && i < a) icon(c, 'cube', xx + 6, yy + 9, C.blue, 27, true);
    }
    const rx = box.x + 470;
    tray(c, rx, y - 7, 210, 130, subtract ? 'Убрали' : 'Ещё прибавить', C.orangeTint);
    const remaining = subtract ? moved : b - moved;
    for (let i = 0; i < remaining; i++) icon(c, 'cube', rx + 17 + i % 5 * 35, y + 38 + Math.floor(i / 5) * 39, C.orange, 25);
    line(c, x, y + 52, x + 9 * cell + 37, y + 52, C.blue, 3);
    const words = subtract ? moved ? 'Сначала дошли до полного десятка.' : 'Будем убирать предметы по частям.' : moved ? 'Десяток собран. Остальные единицы рядом.' : 'Сколько пустых мест до полного десятка?';
    fit(c, words, x, y + 167, box.w - 20, 23, C.muted);
  }
  function drawSharing(c, v, plan, shown, motion = 1) {
    const box = modelArea(plan), groups = Number(v.groups), total = Number(v.total), state = visualState(v, shown);
    const rounds = clamp(state.rounds == null ? shown ? total / groups : 0 : state.rounds, 0, Math.floor(total / groups));
    const previous = Number(visualState(v, Math.max(0, shown - 1)).rounds) || 0;
    const given = Math.floor((previous + (rounds - previous) * motion) * groups), item = v.item || v.object || 'notebook';
    tray(c, box.x, box.y, box.w, 90, 'Было: ' + total + '   Осталось раздать: ' + (total - given), C.blueTint);
    const pitch = Math.min(31, 620 / Math.max(1, total));
    for (let i = given; i < total; i++) icon(c, item, box.x + 24 + i * pitch, box.y + 43, C.blue, Math.min(24, pitch - 3));
    const gap = 12, gw = (box.w - gap * (groups - 1)) / groups, gy = box.y + 115;
    const gh = Math.max(120, Math.min(180, box.h - 132));
    for (let g = 0; g < groups; g++) {
      const gx = box.x + g * (gw + gap);
      tray(c, gx, gy, gw, gh, 'Ученик ' + (g + 1), g % 2 ? C.greenTint : C.orangeTint);
      const cols = Math.max(1, Math.min(4, Math.floor((gw - 20) / 35)));
      const size = Math.min(27, (gw - 22) / cols - 6);
      const received = Math.floor((given + groups - 1 - g) / groups);
      for (let j = 0; j < received; j++) icon(c, item, gx + 13 + j % cols * (size + 7), gy + 48 + Math.floor(j / cols) * (size + 10), C.blue, size);
    }
    if (shown) fit(c, given === total ? 'Каждому досталось поровну.' : 'По одной тетради каждому, затем ещё круг.', box.x + 10, Math.min(box.y + box.h + 17, box.firstRecord - 43), box.w - 20, 24, C.green, 600);
  }
  function drawShelves(c, v, plan, shown) {
    const box = modelArea(plan), state = visualState(v, shown), first = Number(v.first), second = Number(v.second);
    const y1 = box.y + 31, y2 = box.y + 133, px = box.x + 146, pitch = 35;
    text(c, '1-я полка', box.x + 2, y1 + 34, 23, C.muted, 600);
    text(c, '2-я полка', box.x + 2, y2 + 34, 23, C.muted, 600);
    for (let i = 0; i < first; i++) icon(c, 'book', px + i * pitch, y1, C.blue, 30);
    line(c, px - 8, y1 + 41, box.x + box.w - 8, y1 + 41, C.orange, 5);
    for (let i = 0; i < second; i++) icon(c, 'book', px + i * pitch, y2, i < first ? C.blue : C.orange, 30, !state.showSecond);
    line(c, px - 8, y2 + 41, box.x + box.w - 8, y2 + 41, C.orange, 5);
    if (!state.showSecond) text(c, 'Столько же и ещё ' + v.extra, px, y2 + 82, 24, C.muted);
    else if (state.taken) {
      const taken = Number(state.taken);
      for (let i = 0; i < taken; i++) {
        const index = second - i - 1;
        line(c, px + index * pitch - 2, y2 + 1, px + index * pitch + 25, y2 + 34, C.orange, 3);
      }
    }
  }
  function drawBundles(c, v, plan, shown) {
    const box = modelArea(plan), value = Number(v.value), state = visualState(v, shown);
    const digits = [Math.floor(value / 100), Math.floor(value / 10) % 10, value % 10];
    const labels = ['Сотни', 'Десятки', 'Единицы'], colors = [C.orange, C.green, C.blue];
    const cw = (box.w - 24) / 3;
    for (let p = 0; p < 3; p++) {
      const x = box.x + p * (cw + 12);
      tray(c, x, box.y + 8, cw, Math.min(box.h - 12, 256), labels[p], [C.orangeTint, C.greenTint, C.blueTint][p]);
      const amount = digits[p];
      for (let j = 0; j < amount; j++) {
        const xx = x + 14 + (j % (p === 1 ? 5 : 3)) * (p === 1 ? 37 : 59), yy = box.y + 59 + Math.floor(j / (p === 1 ? 5 : 3)) * 58;
        if (p === 0) {
          rect(c, xx - 3, yy - 3, 51, 48, '#fff9ee', 3);
          for (let n = 0; n < 10; n++) bundle(c, xx + (n % 5) * 9, yy + Math.floor(n / 5) * 23, 6, 18, C.orange);
        } else if (p === 1) {
          bundle(c, xx, yy, 28, 45, C.green);
        } else icon(c, 'pencil', xx, yy, C.blue, 35);
      }
      if (state.showValue) text(c, digits[p], x + cw - 40, box.y + 38, 26, colors[p], 700);
    }
  }
  function fractionBar(c, x, y, w, h, n, d, color, options = {}) {
    rect(c, x, y, w, h, C.blueTint, 4);
    const safeD = Math.max(1, Number(d) || 1), filled = clamp(Number(n) / safeD, 0, 1);
    if (filled) rect(c, x, y, w * filled, h, color, 3);
    const subdivisions = Math.max(safeD, Number(options.subdivide) || safeD);
    for (let j = 0; j <= subdivisions; j++) line(c, x + j * w / subdivisions, y, x + j * w / subdivisions, y + h, '#ffffff', 2);
    c.strokeStyle = C.line; c.lineWidth = 1.5; c.strokeRect(x, y, w, h);
  }
  function drawFractionOperation(c, v, plan, shown) {
    const box = modelArea(plan), state = visualState(v, shown), phase = state.phase || 'given';
    const a = v.a || {}, b = v.b || {}, labelX = box.x, x = box.x + 124, availableWidth = box.w - 132;
    const units = v.op === 'add' ? Math.max(1, Math.ceil(a.n / a.d + b.n / b.d)) : 1;
    const width = (availableWidth - (units - 1) * 12) / units;
    const common = Number(v.common) || Math.max(Number(a.d) || 1, Number(b.d) || 1);
    const showResult = phase === 'result' || shown >= plan.steps.length;
    const prepared = phase !== 'given';
    const h = clamp((box.h - 90) / 3, 26, 43), pitch = (box.h - 40) / 3;
    const y1 = box.y + 12, y2 = y1 + pitch, y3 = y2 + pitch;
    const original = f => str(f.n) + '/' + str(f.d);
    if (v.op === 'meaning') {
      text(c, 'Одно целое', labelX, y1 + 15, 24, C.muted, 600);
      fractionBar(c, box.x + 15, y1 + 39, box.w - 31, 75, a.n, a.d, C.blue);
      fit(c, showResult ? 'Закрашено ' + original(a) + ' целого.' : 'Все части равные. Цветом отмечены взятые части.', box.x + 15, y1 + 164, box.w - 31, 25, C.muted);
      return;
    }
    if (v.op === 'reduce' || v.op === 'equivalent') {
      fit(c, original(a), labelX, y1 + 33, 112, 31, C.blue, 600);
      fractionBar(c, x, y1, width, h, a.n, a.d, C.blue, { subdivide: prepared && v.op === 'equivalent' ? v.target : a.d });
      const grouping = Number(v.grouping) || 1;
      if (prepared) {
        const nd = v.op === 'equivalent' ? Number(v.target) : a.d / grouping;
        for (let i = 0; i <= nd; i++) line(c, x + i * width / nd, y1 - 5, x + i * width / nd, y1 + h + 9, C.ink, 3);
        fit(c, v.op === 'equivalent' ? 'Делим каждую часть ещё на ' + v.target / a.d + '.' : 'Объединяем части в группы по ' + grouping + '.', box.x + 8, y2 + 8, box.w - 16, 24, C.muted);
        fractionBar(c, x, y3 - 10, width, h, a.n * nd / a.d, nd, C.blue);
        text(c, showResult ? plan.answer : 'Та же часть', labelX, y3 + 21, showResult ? 31 : 21, C.green, 600);
      }
      return;
    }
    const ar = prepared && state.aShown ? state.aShown : a, br = prepared && state.bShown ? state.bShown : b;
    fit(c, prepared && original(a) !== original(ar) ? original(a) + '=' + original(ar) : original(a), labelX, y1 + 31, 112, 28, C.blue, 600, 18);
    fractionBar(c, x, y1, width, h, a.n, a.d, C.blue, { subdivide: prepared && (['add', 'subtract', 'divide'].includes(v.op)) ? common : a.d });
    fit(c, prepared && original(b) !== original(br) ? original(b) + '=' + original(br) : original(b), labelX, y2 + 31, 112, 28, C.green, 600, 18);
    fractionBar(c, x, y2, width, h, b.n, b.d, C.green, { subdivide: prepared && (['add', 'subtract', 'divide'].includes(v.op)) ? common : b.d });
    if (v.op === 'add' || v.op === 'subtract') {
      const subtract = v.op === 'subtract';
      text(c, showResult ? plan.answer : subtract ? 'Разность' : 'Сумма', labelX, y3 + 32, showResult ? 31 : 23, C.ink, 600);
      for (let u = 0; u < units; u++) fractionBar(c, x + u * (width + 12), y3, width, h, 0, common, C.blue);
      if (showResult) {
        const na = a.n * common / a.d, nb = b.n * common / b.d;
        const resultCells = subtract ? na : na + nb;
        for (let j = 0; j < resultCells; j++) {
          const u = Math.floor(j / common), col = j % common;
          const xx = x + u * (width + 12) + col * width / common + 2;
          rect(c, xx, y3 + 2, width / common - 4, h - 4, subtract && j >= na - nb ? C.orangeTint : j < na ? C.blue : C.green, 2);
          if (subtract && j >= na - nb) line(c, xx + 3, y3 + 6, xx + width / common - 10, y3 + h - 6, C.orange, 3);
        }
      }
      fit(c, 'Полоски одной длины. Каждая — одно целое.', box.x + 8, y3 + h + 32, box.w - 16, 21, C.muted);
    } else if (v.op === 'multiply') {
      const gw = Math.min(320, width), gh = Math.min(122, Math.max(80, box.h - 173)), gy = y2 + 64;
      {
        for (let r = 0; r < b.d; r++) for (let col = 0; col < a.d; col++) {
          const intersection = r < b.n && col < a.n;
          rect(c, x + col * gw / a.d, gy + r * gh / b.d, gw / a.d - 2, gh / b.d - 2,
            intersection ? '#286455' : r < b.n ? C.greenTint : col < a.n ? C.blueTint : '#f4f4ef', 1);
        }
        fit(c, showResult ? 'Общая часть: ' + plan.answer : 'Равные клетки', x + gw + 15, gy + 28, width - gw - 15, 21, C.muted, 500, 17);
      }
    } else if (v.op === 'divide' && prepared) {
      const groups = (a.n / a.d) / (b.n / b.d), divisorW = width * b.n / b.d;
      text(c, 'Сколько раз?', labelX, y3 + 32, 20, C.muted, 600);
      fractionBar(c, x, y3, width, h, a.n, a.d, C.blue, { subdivide: common });
      if (showResult) {
        for (let j = 0; j < Math.floor(groups); j++) {
          c.strokeStyle = C.green; c.lineWidth = 3; c.strokeRect(x + j * divisorW + 2, y3 - 5, divisorW - 4, h + 10);
        }
        const remainder = groups - Math.floor(groups);
        if (remainder > .000001) {
          const start = x + Math.floor(groups) * divisorW;
          c.strokeStyle = C.orange; c.lineWidth = 3; c.strokeRect(start + 2, y3 - 5, remainder * divisorW - 4, h + 10);
        }
        fit(c, original(a) + ' : ' + original(b) + ' = ' + plan.answer, box.x + 6, y3 + 81, box.w - 12, 28, C.green, 600);
      }
    }
  }
  function decimalGrid(c, x, y, side, count, color) {
    const cell = side / 10;
    for (let r = 0; r < 10; r++) for (let col = 0; col < 10; col++) {
      rect(c, x + col * cell, y + r * cell, cell - 1.1, cell - 1.1, r * 10 + col < count ? color : C.blueTint, .8);
    }
    c.strokeStyle = C.line; c.lineWidth = 1; c.strokeRect(x - 1, y - 1, side + 1, side + 1);
  }
  function drawDecimalGrid(c, v, plan, shown) {
    const box = modelArea(plan), state = visualState(v, shown), scale = Number(v.scale) || 100;
    const numbers = [Number(v.a), Number(v.b)], fractionalTotal = numbers.reduce((sum, n) => sum + n % scale, 0);
    const phase = state.phase || 'given', prepared = phase !== 'given', done = phase === 'result' || shown === plan.steps.length;
    const cw = (box.w - 24) / 3, side = Math.min(162, Math.max(100, box.h - 144));
    for (let i = 0; i < 3; i++) {
      const xx = box.x + i * (cw + 12), label = i === 2 ? 'Вместе' : i === 0 ? 'Первое число' : 'Второе число';
      text(c, label, xx + 1, box.y + 26, 23, i === 2 ? C.ink : i ? C.green : C.blue, 600);
      const n = i === 2 ? fractionalTotal : numbers[i] % scale;
      const known = i < 2 || prepared;
      const whole = i === 2 ? done ? Math.floor((numbers[0] + numbers[1]) / scale) : Math.floor(fractionalTotal / scale) : Math.floor(numbers[i] / scale);
      text(c, i === 2 && !prepared ? '?' : 'Целых: ' + whole, xx + 1, box.y + 60, 23, C.muted);
      decimalGrid(c, xx + 5, box.y + 85, side, known ? n % scale : 0, i === 1 ? C.green : C.blue);
      if (known) text(c, (i === 2 && done ? 'Ответ: ' + plan.answer : 'Сотых: ' + n % scale), xx + 1, box.y + 113 + side, 25, i === 2 ? C.green : C.ink, 600);
    }
    fit(c, 'Одна клетка — одна сотая. Сто клеток — одна целая.', box.x + 1, Math.min(box.y + box.h + 13, box.firstRecord - 39), box.w - 2, 21, C.muted);
  }
  function drawPercentStory(c, v, plan, shown) {
    const box = modelArea(plan), state = visualState(v, shown), done = state.phase === 'result' || shown === plan.steps.length;
    const known = name => done || v.unknown !== name;
    const whole = known('whole') ? str(v.whole) : 'x', part = known('part') ? str(v.part) : 'x';
    const percent = known('percent') ? str(v.percent) + '%' : 'x%';
    const ratio = Number(v.part) / Number(v.whole), x = box.x + 8, width = box.w - 16, yy = box.y + 50;
    text(c, 'Всё: ' + whole + ' ' + (v.quantity || v.proportion?.quantity || '') + ' — 100%', x, box.y + 25, 27, C.ink, 600);
    rect(c, x, yy, width, 63, C.blueTint, 8);
    rect(c, x, yy, width * clamp(ratio, 0, 1), 63, C.blue, 8);
    line(c, x + width * ratio, yy - 6, x + width * ratio, yy + 72, C.ink, 2);
    text(c, 'Часть: ' + part + ' — ' + percent, x, yy + 104, 29, C.blue, 600);
    const p = v.proportion;
    if (p?.left && p?.right) {
      const py = yy + 167, xx = box.x + 118;
      const value = s => s === 'x' && done ? plan.answer : s;
      const fraction = (terms, fx) => {
        fit(c, value(terms[0]), fx, py - 11, 116, 34, C.ink, 600);
        line(c, fx - 8, py, fx + 112, py, C.ink, 2);
        fit(c, value(terms[1]), fx, py + 40, 116, 34, C.ink, 600);
      };
      fraction(p.left, xx); text(c, '=', xx + 167, py + 14, 35, C.ink, 600); fraction(p.right, xx + 254);
      if (state.left && state.right != null) fit(c, state.left + ' = ' + state.right, box.x + 126, py + 87, box.w - 150, 28, C.green, 600);
    }
  }
  function drawFractionQuantity(c, v, plan, shown) {
    const box = modelArea(plan), state = visualState(v, shown), done = state.phase === 'result' || shown === plan.steps.length;
    const prepared = state.phase && state.phase !== 'given', d = Number(v.d), n = Number(v.n);
    const wholeKnown = v.unknown !== 'whole' || done, partKnown = v.unknown !== 'part' || done;
    const whole = wholeKnown ? str(v.whole) : '?', part = partKnown ? str(v.part) : '?';
    const x = box.x + 10, width = box.w - 20, y = box.y + 62;
    text(c, 'Всё количество: ' + whole, x, box.y + 25, 30, C.ink, 600);
    fractionBar(c, x, y, width, 83, n, d, C.blue);
    for (let i = 0; i < d; i++) {
      const xx = x + width * (i + .5) / d;
      const quantity = prepared ? Number(v.whole) / d : '?';
      const label = str(quantity), fs = Math.min(30, width / d * .56);
      font(c, fs, 600); text(c, label, xx - c.measureText(label).width / 2, y + 52, fs, i < n ? '#ffffff' : C.ink, 600);
    }
    line(c, x, y + 96, x + width * n / d, y + 96, C.blue, 3);
    text(c, 'Взято ' + n + '/' + d + ': ' + part, x, y + 142, 28, C.blue, 600);
    if (prepared) fit(c, 'Одна равная часть: ' + Number(v.whole) / d, x, y + 193, box.w - 20, 26, C.muted);
  }

  function bundle(c, x, y, w = 32, h = 58, color = C.green) {
    for (let i = 0; i < 10; i++) line(c, x + 2 + i * (w - 4) / 9, y, x + 2 + i * (w - 4) / 9, y + h, color, 1.8);
    rect(c, x - 2, y + h * .38, w + 4, h * .19, C.orange, 3);
  }
  function drawMixedFractions(c, v, plan, shown) {
    const box = modelArea(plan), state = visualState(v, shown), a = v.a, b = v.b;
    const result = state.result, done = state.phase === 'result' || shown === plan.steps.length;
    const amount = f => Number(f.whole || 0) + Number(f.n || 0) / Number(f.d || 1);
    const largest = Math.max(amount(a), b ? amount(b) : 0, v.op === 'add' && b ? amount(a) + amount(b) : 0, result ? amount(result) : 0);
    const units = Math.max(1, Math.ceil(largest)), labelW = 112, gap = 7, width = (box.w - labelW - gap * (units - 1)) / units;
    const format = f => (f.whole ? f.whole + (f.n ? ' ' : '') : '') + (f.n ? f.n + '/' + f.d : f.whole ? '' : '0');
    const rows = b ? 3 : 2, pitch = Math.min(92, (box.h - 53) / rows), h = Math.min(47, pitch - 27), baseY = box.y + 18;
    const draw = (f, row, label, color, subdivideWholes = false, borrowed = false) => {
      const yy = baseY + row * pitch, wholes = Number(f.whole || 0), n = Number(f.n || 0), d = Number(f.d || 1);
      fit(c, label, box.x, yy + h * .77, labelW - 8, 29, color, 600, 20);
      for (let i = 0; i < wholes + Math.ceil(n / d); i++) {
        const xx = box.x + labelW + i * (width + gap), whole = i < wholes;
        const numerator = whole ? d : Math.min(d, n - (i - wholes) * d);
        fractionBar(c, xx, yy, width, h, numerator, whole && !subdivideWholes ? 1 : d, color);
        // A whole rectangle uses the same length as one full fractional rectangle.
        if (whole && !subdivideWholes) fractionBar(c, xx, yy, width, h, 1, 1, color);
        if (borrowed && i === wholes) { c.strokeStyle = C.orange; c.lineWidth = 3; c.strokeRect(xx - 2, yy - 4, width + 4, h + 8); }
      }
    };
    if (v.op === 'to-mixed') {
      draw(a, 0, format(a), C.blue, true);
      if (state.aShown || done) draw(state.aShown || result, 1, done ? plan.answer : 'Целые + часть', C.green, false);
      fit(c, 'Полная полоска — одно целое. Части везде равны.', box.x, baseY + pitch * 2 + 17, box.w, 22, C.muted);
    } else if (v.op === 'to-fraction') {
      draw(a, 0, format(a), C.blue, false);
      if (state.wholeParts != null || done) {
        draw(a, 1, done ? plan.answer : 'Те же доли', C.green, true);
        fit(c, 'Целые разделили на доли. Дробная часть остаётся.', box.x, baseY + pitch * 2 + 17, box.w, 22, C.muted);
      }
    } else {
      const displayed = state.aShown || a;
      draw(displayed, 0, format(displayed), C.blue, Boolean(state.aShown), Boolean(state.aShown));
      draw(b, 1, (v.op === 'add' ? '+ ' : '− ') + format(b), C.green);
      if (done) draw(result, 2, plan.answer, C.ink);
      else if (state.fractional) draw({ whole: 0, ...state.fractional }, 2, 'Дробная часть', C.orange, true);
      else if (state.wholeSum != null) draw({ whole: state.wholeSum, n: 0, d: a.d }, 2, 'Целые: ' + state.wholeSum, C.ink);
      const caption = state.aShown ? 'Долей в одной целой: ' + a.d + '.' : 'Каждая полная полоска изображает одно целое.';
      fit(c, caption, box.x, baseY + pitch * 3 + 14, box.w, 21, C.muted);
    }
  }
  function drawPrimaryModel(c, v, plan, shown) {
    const box = modelArea(plan), state = visualState(v, shown), phase = Number(state.phase) || 0;
    const x = box.x + 10, y = box.y + 35, w = box.w - 20;
    if (v.kind === 'number-line') {
      const middle = x + w / 2, pitch = w / 5;
      arrow(c, x, y + 97, x + w, y + 97, C.ink, 3);
      for (let i = -2; i <= 2; i++) {
        const xx = middle + i * pitch;
        line(c, xx, y + 85, xx, y + 109, C.ink, 3);
        const label = i === 0 ? v.center : i === -1 && state.left ? v.center - 1 : i === 1 && state.right ? v.center + 1 : i === -1 || i === 1 ? '?' : '';
        text(c, label, xx - 18, y + 157, 39, i ? C.green : C.blue, 600);
      }
      arrow(c, middle - 5, y + 40, middle - pitch + 5, y + 40, C.orange, 3);
      arrow(c, middle + 5, y + 40, middle + pitch - 5, y + 40, C.green, 3);
      text(c, '−1', middle - pitch * .67, y + 18, 32, C.orange, 600);
      text(c, '+1', middle + pitch * .32, y + 18, 32, C.green, 600);
      text(c, 'Соседние числа отличаются на единицу.', x, y + 231, 26, C.muted);
    } else if (v.kind === 'place-compare') {
      const labels = ['Сотни', 'Десятки', 'Единицы'], cw = w / 3;
      labels.forEach((label, i) => {
        const xx = x + i * cw;
        rect(c, xx + 3, y - 18, cw - 10, 193, i === v.decisive && state.showResult ? C.greenTint : C.blueTint, 12);
        text(c, label, xx + 16, y + 12, 25, C.muted, 600);
        text(c, String(v.a).padStart(3, '0')[i], xx + cw * .40, y + 76, 47, C.blue, 600);
        text(c, String(v.b).padStart(3, '0')[i], xx + cw * .40, y + 145, 47, C.green, 600);
      });
      fit(c, state.showResult ? 'Сравнение решил разряд: ' + labels[v.decisive].toLowerCase() + '.' : 'Сравниваем слева: от сотен к единицам.', x, y + 226, w, 27, C.muted);
    } else if (v.kind === 'bundles-operation') {
      const a = v.a / 10, b = v.b / 10, sub = v.op === '-';
      const total = sub ? a : a + b, pitch = Math.min(53, (w - 20) / Math.max(total, 1));
      for (let i = 0; i < total; i++) {
        const xx = x + 10 + i * pitch, removed = sub && state.showResult && i >= a - b;
        bundle(c, xx, y + 42, Math.min(33, pitch - 9), 75, removed ? C.orange : i < a ? C.blue : C.green);
        if (removed) line(c, xx - 3, y + 35, xx + 36, y + 122, C.orange, 4);
        if (!sub && i === a) line(c, xx - 8, y + 26, xx - 8, y + 131, C.muted, 2);
      }
      text(c, 'В каждой связке 10 палочек.', x, y + 183, 29, C.muted);
      fit(c, sub ? 'Связок было: ' + a + '. Убираем: ' + b + '.' : 'Связок было: ' + a + '. Добавляем: ' + b + '.', x, y + 227, w, 27, C.blue);
    } else if (v.kind === 'mental-parts') {
      const tens = Math.floor(v.b / 10) * 10, units = v.b % 10, subtract = v.op === '-', sign = subtract ? '−' : '+';
      const mid = subtract ? v.a - tens : v.a + tens, answer = subtract ? v.a - v.b : v.a + v.b;
      text(c, v.b + ' = ' + tens + ' + ' + units, x + 90, y + 22, 39, C.ink, 600);
      const px = [x + 14, x + w * .39, x + w * .77], values = [v.a, phase >= 1 ? mid : '?', phase >= 2 ? answer : '?'];
      values.forEach((val, i) => { rect(c, px[i], y + 112, 130, 75, i === 2 ? C.greenTint : C.blueTint, 12); text(c, val, px[i] + 29, y + 164, 40, i === 2 ? C.green : C.blue, 600); });
      for (let i = 0; i < 2; i++) { arrow(c, px[i] + 80, y + 84, px[i + 1] + 60, y + 84, C.orange, 3); text(c, sign + (i ? units : tens), px[i] + 115, y + 64, 31, C.orange, 600); }
      text(c, 'Сначала десятки, затем единицы.', x, y + 245, 29, C.muted);
    } else if (v.kind === 'place-shift') {
      const mult = v.op === '×', answer = mult ? v.value * v.factor : v.value / v.factor;
      const places = ['Тысячи', 'Сотни', 'Десятки', 'Единицы'], cw = w / 4;
      places.forEach((label, i) => {
        const xx = x + i * cw;
        rect(c, xx + 2, y - 15, cw - 7, 208, [C.orangeTint, C.orangeTint, C.greenTint, C.blueTint][i], 8);
        fit(c, label, xx + 8, y + 15, cw - 16, 23, C.muted, 600);
        const digit = String(v.value).padStart(4, ' ')[i]; text(c, digit, xx + cw * .39, y + 81, 42, C.blue, 600);
        if (state.showResult) text(c, String(answer).padStart(4, ' ')[i], xx + cw * .39, y + 165, 42, C.green, 600);
      });
      const direction = mult ? 'влево' : 'вправо';
      fit(c, 'Каждая цифра переходит на ' + (v.factor === 100 ? '2 разряда ' : '1 разряд ') + direction + '.', x, y + 246, w, 27, C.muted);
      if (state.showResult) {
        const offset = Math.log10(v.factor) * cw * (mult ? -1 : 1), source = x + (mult ? 3.5 : 1.5) * cw;
        arrow(c, source, y + 99, source + offset, y + 128, C.orange, 3);
      }
    } else if (v.kind === 'whole-parts') {
      const knownWidth = w * v.known / v.whole, yy = y + 49;
      text(c, 'Всё число: ' + v.whole, x, y + 3, 34, C.ink, 600);
      rect(c, x, yy, w, 93, C.orangeTint, 6); rect(c, x, yy, knownWidth, 93, C.blue, 6);
      line(c, x + knownWidth, yy, x + knownWidth, yy + 93, C.ink, 3);
      text(c, v.known, x + knownWidth / 2 - 18, yy + 61, 39, '#ffffff', 600);
      text(c, state.showResult ? v.whole - v.known : '?', x + knownWidth + (w - knownWidth) / 2 - 16, yy + 61, 39, C.orange, 600);
      text(c, 'Две части вместе составляют целое.', x, yy + 164, 28, C.muted);
    } else if (v.kind === 'zero-actions') {
      text(c, '(' + v.a + ' + 0) − ' + v.b + ' × 0', x + 58, y + 25, 41, C.ink, 600);
      if (v.a <= 20) for (let i = 0; i < v.a; i++) icon(c, 'cube', x + 9 + i % 10 * 37, y + 72 + Math.floor(i / 10) * 38, C.blue, 27);
      else { rect(c, x + 6, y + 71, 257, 77, C.blueTint, 12); text(c, v.a, x + 81, y + 124, 42, C.blue, 600); }
      text(c, phase >= 1 ? v.a + ' + 0 = ' + v.a : 'Ничего не добавили.', x + 4, y + 190, 27, C.blue, 600);
      const by = y + 221;
      rect(c, x + 4, by, w - 8, 59, C.greenTint, 8);
      fit(c, phase >= 2 ? v.b + ' × 0 = 0: ни одной группы.' : 'Не взяли ни одной группы по ' + v.b + '.', x + 17, by + 39, w - 34, 27, C.green, 600);
    }
  }


  function drawApplicationModel(c, v, plan, shown) {
    const box = modelArea(plan), x = box.x + 9, y = box.y + 32, w = box.w - 18;
    const decimalParts = value => { const pair = String(value).replace('.', ',').split(','); return [pair[0], ...(pair[1] || '').padEnd(3, '0').split('')]; };
    const places = (values, labels, highlight = -1) => {
      const cw = w / labels.length;
      labels.forEach((label, i) => {
        const xx = x + i * cw;
        rect(c, xx + 2, y - 23, cw - 7, 67 + values.length * 57, i === highlight ? C.greenTint : i ? C.blueTint : C.orangeTint, 9);
        fit(c, label, xx + 9, y + 7, cw - 18, 23, C.muted, 600);
        values.forEach((row, n) => text(c, row[i], xx + cw * .38, y + 64 + n * 57, 40, n ? C.green : C.blue, 600));
      });
    };
    if (v.kind === 'decimal-place') {
      places([decimalParts(v.value)], ['Целые', 'Десятые', 'Сотые', 'Тысячные'], shown === 1 ? 1 : shown === 2 ? 2 : -1);
      text(c, '1 целая = 1000 тысячных', x + 18, y + 168, 29, C.ink, 600);
      text(c, '1 десятая = 100 тысячных', x + 18, y + 209, 28, C.blue);
      text(c, '1 сотая = 10 тысячных', x + 18, y + 250, 28, C.green);
    } else if (v.kind === 'decimal-compare') {
      places([decimalParts(v.a).slice(0, 3), decimalParts(v.b).slice(0, 3)], ['Целые', 'Десятые', 'Сотые']);
      fit(c, 'Сравниваем одинаковые разряды слева направо.', x, y + 256, w, 28, C.muted);
      if (shown) text(c, v.a + (v.aHundredths > v.bHundredths ? ' > ' : ' < ') + v.b, x + 126, y + 309, 39, C.green, 600);
    } else if (v.kind === 'decimal-operation') {
      if (v.operation === 'subtract') {
        const labels = ['Целые', 'Десятые', 'Сотые'];
        places([decimalParts(v.a).slice(0, 3), decimalParts(v.b).slice(0, 3)], labels);
        text(c, '−', x - 3, y + 120, 37, C.orange, 600);
        line(c, x + 4, y + 155, x + w - 5, y + 155, C.ink, 2);
        fit(c, v.aInteger + ' сотых − ' + v.bInteger + ' сотых', x + 16, y + 211, w - 32, 32, C.ink, 600);
        if (shown) fit(c, (v.aInteger - v.bInteger) + ' сотых' + (shown > 1 ? ' = ' + v.result : ''), x + 16, y + 269, w - 32, 37, C.green, 600);
      } else {
        const gw = 436, gh = Math.min(156, box.h - 140), gx = x + 79, gy = y + 30;
        const cols = Number(v.aInteger), rows = Number(v.bInteger), denominator = 10 ** (v.aPlaces + v.bPlaces);
        rect(c, gx, gy, gw, gh, C.blueTint, 2);
        for (let i = 0; i <= cols; i++) line(c, gx + i * gw / cols, gy, gx + i * gw / cols, gy + gh, '#93b5bc', i % 10 ? .6 : 1.4);
        for (let i = 0; i <= rows; i++) line(c, gx, gy + i * gh / rows, gx + gw, gy + i * gh / rows, '#93b5bc', i % 10 ? .6 : 1.4);
        text(c, v.a, gx + gw / 2 - 18, gy - 11, 30, C.blue, 600);
        text(c, v.b, x, gy + gh / 2 + 9, 29, C.green, 600);
        fit(c, 'Одна клетка: 1/' + denominator + ' целого.', x + 4, gy + gh + 42, w - 8, 27, C.muted);
        if (shown) fit(c, v.aInteger * v.bInteger + ' клеток' + (shown > 1 ? ': ' + v.result + ' целого' : ''), x + 4, gy + gh + 90, w - 8, 34, C.green, 600);
      }
    } else if (v.kind === 'decimal-shift') {
      const left = v.direction === 'left', label = left ? 'Делим на ' : 'Умножаем на ';
      text(c, label + v.factor, x + 28, y + 15, 31, C.ink, 600);
      rect(c, x + 15, y + 69, 260, 96, C.blueTint, 12);
      rect(c, x + 397, y + 69, 250, 96, C.greenTint, 12);
      fit(c, v.value, x + 32, y + 133, 222, 49, C.blue, 600);
      fit(c, shown ? v.result : '?', x + 419, y + 133, 206, 49, C.green, 600);
      arrow(c, x + 290, y + 117, x + 381, y + 117, C.orange, 4);
      const message = 'Запятая: ' + v.places + (v.places === 1 ? ' место ' : ' места ') + (left ? 'влево.' : 'вправо.');
      text(c, message, x + 28, y + 228, 30, C.muted);
      if (shown) { const direction = left ? -1 : 1, start = x + w / 2 - direction * 50; arrow(c, start, y + 274, start + direction * 100, y + 274, C.orange, 4); }
    } else if (v.kind === 'measure') {
      const isLength = v.unit === 'length', majorName = isLength ? 'м' : 'ч', minorName = isLength ? 'см' : 'мин';
      const count = Number(v.major), minor = Number(v.minor), units = count + 1, width = (w - 9 * (units - 1)) / units;
      text(c, '1 ' + majorName + ' = ' + v.base + ' ' + minorName, x + 8, y + 7, 35, C.ink, 600);
      for (let i = 0; i < units; i++) {
        const xx = x + i * (width + 9), yy = y + 55;
        rect(c, xx, yy, width, 82, C.blueTint, 4);
        rect(c, xx, yy, width * (i < count ? 1 : minor / v.base), 82, i < count ? C.blue : C.orange, 4);
        for (let tick = 1; tick < (isLength ? 10 : 6); tick++) line(c, xx + width * tick / (isLength ? 10 : 6), yy + 59, xx + width * tick / (isLength ? 10 : 6), yy + 82, '#ffffff', 2);
        fit(c, i < count ? '1 ' + majorName : minor + ' ' + minorName, xx + 4, yy + 117, width - 8, 26, i < count ? C.blue : C.orange, 600, 17);
      }
      fit(c, shown ? count + ' ' + majorName + ' = ' + count * v.base + ' ' + minorName : 'Целые единицы и оставшаяся часть.', x + 3, y + 243, w - 6, 31, C.ink, 600);
      if (shown > 1) text(c, 'Всего: ' + (count * v.base + minor) + ' ' + minorName, x + 3, y + 295, 35, C.green, 600);
    } else if (v.kind === 'motion') {
      const time = Number(v.time), width = w / time, yy = y + 105;
      const speedKnown = v.unknown !== 'speed' || shown > 0, distanceKnown = v.unknown !== 'distance' || shown > 0;
      text(c, 'Весь путь: ' + (distanceKnown ? v.distance : '?') + ' км', x + 5, y + 22, 35, C.ink, 600);
      for (let i = 0; i < time; i++) {
        const xx = x + i * width;
        rect(c, xx + 2, yy - 9, width - 4, 58, i % 2 ? C.greenTint : C.blueTint, 6);
        fit(c, (speedKnown ? v.speed : '?') + ' км', xx + 8, yy + 28, width - 16, 30, C.blue, 600, 20);
        line(c, xx, yy + 78, xx, yy + 95, C.ink, 2);
        fit(c, i + ' ч', xx - 6, yy + 132, Math.max(45, width - 8), 26, C.muted);
      }
      arrow(c, x, yy + 86, x + w, yy + 86, C.ink, 3);
      line(c, x + w, yy + 78, x + w, yy + 95, C.ink, 2);
      text(c, time + ' ч', x + w - 43, yy + 132, 26, C.muted);
      fit(c, 'За каждый час — одинаковое расстояние.', x, yy + 198, w, 28, C.muted);
    }
  }

  function standard(c, plan, count, reveal, active, options) {
    const steps = plan.steps || [], shown = Math.min(steps.length, Math.max(count, reveal ? active + 1 : count));
    const motion = !options.reducedMotion && shown > active && Number.isFinite(options.transition) ? clamp(options.transition, 0, 1) : 1;
    if (plan.visual) {
      switch (plan.visual.kind) {
        case 'dots': drawDots(c, plan.visual, plan, shown); break;
        case 'groups': drawGroups(c, plan.visual, plan, shown); break;
        case 'place': drawPlace(c, plan.visual, shown); break;
        case 'column': drawColumn(c, plan.visual, plan, shown); break;
        case 'fraction': drawFraction(c, plan.visual); break;
        case 'percent': plan.visual.proportion ? drawPercentStory(c, plan.visual, plan, shown) : drawPercent(c, plan.visual, count === steps.length); break;
        case 'facts': drawFacts(c, plan.visual); break;
        case 'fraction-pair': drawFractionPair(c, plan.visual); break;
        case 'objects': drawObjects(c, plan.visual, plan, shown, motion); break;
        case 'ten-frame': drawTenFrame(c, plan.visual, plan, shown, motion); break;
        case 'sharing': drawSharing(c, plan.visual, plan, shown, motion); break;
        case 'shelves': drawShelves(c, plan.visual, plan, shown); break;
        case 'bundles': drawBundles(c, plan.visual, plan, shown); break;
        case 'fraction-operation': drawFractionOperation(c, plan.visual, plan, shown); break;
        case 'decimal-grid': drawDecimalGrid(c, plan.visual, plan, shown); break;
        case 'decimal-place': case 'decimal-compare': case 'decimal-operation': case 'decimal-shift': case 'measure': case 'motion': drawApplicationModel(c, plan.visual, plan, shown); break;
        case 'mixed-fractions': drawMixedFractions(c, plan.visual, plan, shown); break;
        case 'number-line': case 'place-compare': case 'bundles-operation': case 'mental-parts': case 'place-shift': case 'whole-parts': case 'zero-actions': drawPrimaryModel(c, plan.visual, plan, shown); break;
        case 'fraction-quantity': drawFractionQuantity(c, plan.visual, plan, shown); break;
      }
    }
    const childKinds = ['groups', 'objects', 'ten-frame', 'sharing', 'shelves', 'bundles', 'fraction-operation', 'decimal-grid', 'percent-story', 'fraction-quantity', 'mixed-fractions', 'number-line', 'place-compare', 'bundles-operation', 'mental-parts', 'place-shift', 'whole-parts', 'zero-actions', 'decimal-place', 'decimal-compare', 'decimal-operation', 'decimal-shift', 'measure', 'motion'];
    const firstY = plan.visual ? childKinds.includes(plan.visual.kind) || plan.visual.proportion ? modelArea(plan).firstRecord : 439 : 283;
    const gap = steps.length <= 1 ? 61 : Math.min(61, (700 - firstY) / (steps.length - 1));
    for (let i = 0; i < shown; i++) {
      const y = firstY + i * gap, current = i === shown - 1;
      if (current) rect(c, 503, y - 35, 720, Math.min(gap - 3, 48), C.greenTint, 8);
      text(c, i + 1, 516, y, 21, C.green, 700);
      fit(c, steps[i].record || steps[i].answer, 553, y, 647, Math.min(40, gap - 7), C.ink, current ? 600 : 400, 24);
    }
    if (!shown) text(c, 'Здесь запишем решение.', 528, plan.visual ? firstY + 1 : 299, 26, C.muted);
  }

  function visibility(p, count, reveal, active) {
    const display = Math.min(p.actions.length, Math.max(count, reveal ? active + 1 : count));
    return p.actions[display]?.visibleBaseStep ?? p.baseActions.length;
  }
  function division(c, plan, count, reveal, active) {
    const p = plan.division;
    if (!p || !p.baseActions || !p.cycles) return;
    const checkpoint = plan.divisionPresentation?.checkpoints?.[active];
    const visible = checkpoint ? count > active || reveal ? checkpoint.after : checkpoint.before : visibility(p, count, reveal, active);
    const current = plan.steps[active]?.raw || p.actions[active];
    const automaticBring = checkpoint?.automatic?.filter(a => a.kind === 'bring').slice(-1)[0];
    const bringing = current && ['bring', 'partial'].includes(current.kind) ? current : automaticBring;
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
    if (bringing) length = Math.max(length, bringing.sourceIndex + 1);
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
      const isSource = bringing && i === bringing.sourceIndex;
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
      if (next && bringing && bringing.sourceIndex === next.sourceIndex) {
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
    const steps = plan.steps || [], step = steps[active];
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
    const revealed = options.reveal || count > active;
    let helpers = Array.isArray(step.helper) ? step.helper : step.helper ? [step.helper] : [];
    if (plan.topicId === 'column-subtract' && helpers.length > 4) helpers = helpers.slice(2);
    const sections = [{ value: step.prompt, size: 28, color: C.ink, weight: 600 }];
    if (step.beforeHelper?.length) sections.push({ value: step.beforeHelper.join('\n'), size: 22, color: C.blue, weight: 500 });
    if (revealed) {
      if (step.hint) sections.push({ value: step.hint, size: 23, color: C.muted, weight: 400 });
      if (!isDigit) sections.push({ value: helpers.length ? helpers.join('\n') : step.answer, size: 25, color: C.blue, weight: 600 });
    }
    const available = revealed && isDigit ? 291 : 430;
    let reduction = 0, lines, needed;
    do {
      lines = sections.map(section => ({ ...section, size: Math.max(18, section.size - reduction), lines: wrapped(c, section.value, 357, Math.max(18, section.size - reduction), section.weight) }));
      needed = lines.reduce((height, section) => height + section.lines.length * section.size * 1.22, 0) + Math.max(0, lines.length - 1) * 13;
      if (needed <= available || reduction >= 10) break;
      reduction++;
    } while (true);
    let y = 277;
    for (const section of lines) {
      section.lines.forEach(row => { text(c, row, 63, y, section.size, section.color, section.weight); y += section.size * 1.22; });
      y += 13;
    }
    if (revealed && isDigit) {
      const p = plan.division, cycle = p.cycles[raw.cycle], start = Math.max(584, Math.min(602, y + 9));
      for (let k = 0; k <= 9; k++) {
        const xx = 62 + (k >= 5 ? 185 : 0), yy = start + (k % 5) * 27;
        if (k === cycle.qd) rect(c, xx - 5, yy - 21, 178, 25, C.greenTint, 5);
        fit(c, p.normalizedDivisor + ' × ' + k + ' = ' + p.normalizedDivisor * k, xx, yy, 169, 23, k === cycle.qd ? C.green : C.ink, k === cycle.qd ? 700 : 400, 19);
      }
    } else if (!revealed) {
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
    else standard(c, plan, count, Boolean(options.reveal), active, options);
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

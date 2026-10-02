(function (root) {
  'use strict';
  const registry = root.ProfileModels = root.ProfileModels || {};
  const NS = 'http://www.w3.org/2000/svg';
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const round = n => Number(n.toFixed(2)).toLocaleString('ru-RU');
  const line = (a, b, color = '#176860', extra = '') => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${color}" stroke-width="3" ${extra}/>`;
  const label = (p, text, dx = 0, dy = -12) => `<text x="${p[0] + dx}" y="${p[1] + dy}" fill="#243b43" font-size="15" text-anchor="middle">${text}</text>`;
  const dot = (p, name, drag, radius = drag ? 10 : 4) => `<g ${drag ? `data-drag="${drag}" style="cursor:grab"` : ''}><title>${name}${drag ? ': можно перетащить; те же изменения доступны в полях ниже' : ''}</title>${drag ? `<circle cx="${p[0]}" cy="${p[1]}" r="10" fill="transparent" pointer-events="all"/>` : ''}<circle cx="${p[0]}" cy="${p[1]}" r="${radius}" fill="${drag ? '#c05c22' : '#176860'}" pointer-events="none"/></g>`;
  const poly = points => `<polygon points="${points.map(p => p.join(',')).join(' ')}" fill="#e5f4ee" stroke="#176860" stroke-width="3"/>`;
  function lab(container, title, instruction, viewBox = '0 0 540 340') {
    container.innerHTML = `<div class="geometry-lab"><p><b>${title}</b></p><p>${instruction}</p><svg xmlns="${NS}" class="lab-svg" viewBox="${viewBox}" role="img" aria-label="${title}" style="display:block;width:100%;max-width:100%;height:auto;background:#f7faf8;border-radius:12px;touch-action:none;user-select:none"></svg><div class="lab-controls" style="display:flex;flex-wrap:wrap;gap:12px;align-items:end;margin:12px 0"></div><p class="lab-feedback" role="status" aria-live="polite" aria-atomic="true"></p><p class="lab-note"><small>Значения лаборатории отдельные от упражнений. Чертёж помогает заметить связь, но не заменяет доказательство; основание вывода указано в пояснении.</small></p></div>`;
    const svg = container.querySelector('svg');
    const controls = container.querySelector('.lab-controls');
    const feedback = container.querySelector('.lab-feedback');
    const disposers = [];
    function on(el, event, handler) { el.addEventListener(event, handler); disposers.push(() => el.removeEventListener(event, handler)); }
    function number(name, text, value, min, max, step, change) {
      const wrapper = document.createElement('label');
      wrapper.style.cssText = 'display:grid;gap:4px;max-width:100%';
      wrapper.textContent = text;
      const input = document.createElement('input');
      input.type = 'number'; input.name = name; input.value = value; input.min = min; input.max = max; input.step = step;
      input.style.cssText = 'width:110px;max-width:100%;padding:8px;border:1px solid #81958f;border-radius:6px;font:inherit';
      wrapper.append(input); controls.append(wrapper);
      on(input, 'input', () => { if (input.value.trim() === '') return; const n = Number(input.value); if (Number.isFinite(n)) change(clamp(n, Number(input.min), Number(input.max))); });
      on(input, 'change', () => { const n = Number(input.value); if (input.value.trim() && Number.isFinite(n)) input.value = clamp(n, Number(input.min), Number(input.max)); });
      return input;
    }
    function select(text, values, change) {
      const wrapper = document.createElement('label'); wrapper.style.cssText = 'display:grid;gap:4px;max-width:100%'; wrapper.textContent = text;
      const input = document.createElement('select'); input.style.cssText = 'max-width:100%;padding:8px;font:inherit';
      values.forEach(([value, text]) => { const option = document.createElement('option'); option.value = value; option.textContent = text; input.append(option); });
      wrapper.append(input); controls.append(wrapper); on(input, 'change', () => change(input.value)); return input;
    }
    function button(text, click) { const button = document.createElement('button'); button.type = 'button'; button.textContent = text; on(button, 'click', click); controls.append(button); return button; }
    function check(text, checked, change) {
      const wrapper = document.createElement('label'); wrapper.style.cssText = 'display:flex;gap:6px;align-items:center';
      const input = document.createElement('input'); input.type = 'checkbox'; input.checked = checked; wrapper.append(input, document.createTextNode(text)); controls.append(wrapper);
      on(input, 'change', () => change(input.checked)); return input;
    }
    function drag(update) {
      let active = null;
      function position(e) { const point = svg.createSVGPoint(); point.x = e.clientX; point.y = e.clientY; const matrix = svg.getScreenCTM(); if (!matrix) return null; const p = point.matrixTransform(matrix.inverse()); return [p.x, p.y]; }
      on(svg, 'pointerdown', e => { const target = e.target.closest('[data-drag]'); if (!target) return; active = target.dataset.drag; svg.setPointerCapture(e.pointerId); const p = position(e); if (p) update(active, p); e.preventDefault(); });
      on(svg, 'pointermove', e => { if (!active) return; const p = position(e); if (p) update(active, p); });
      on(svg, 'pointerup', e => { active = null; if (svg.hasPointerCapture(e.pointerId)) svg.releasePointerCapture(e.pointerId); });
      on(svg, 'pointercancel', () => { active = null; });
      on(svg, 'lostpointercapture', () => { active = null; });
    }
    return { svg, controls, feedback, number, select, button, check, drag, cleanup: () => disposers.forEach(dispose => dispose()) };
  }

  registry['prof-triangle'] = function (container) {
    const ui = lab(container, 'Треугольник: что меняется, а что сохраняется?', 'Двигай оранжевую вершину C или меняй её координаты. Сохрани высоту и сдвинь C в сторону: сравни площадь и углы. Основание AB остаётся равным 8.');
    let x = 3, h = 5, heightVisible = true;
    const point = (x, y) => [80 + 32 * x, 280 - 32 * y];
    const xInput = ui.number('prof-triangle-x', 'Горизонтальная координата C', x, -2, 10, 0.25, n => { x = n; render(); });
    const hInput = ui.number('prof-triangle-height', 'Высота над прямой AB', h, 1, 7, 0.25, n => { h = n; render(); });
    ui.check('Провести высоту CH', heightVisible, n => { heightVisible = n; render(); });
    ui.button('Сдвинуть C на единицу вправо', () => { x = clamp(x + 1, -2, 10); xInput.value = x; render(); });
    function render() {
      const A = point(0, 0), B = point(8, 0), C = point(x, h), H = point(x, 0);
      const alpha = Math.atan2(h, x) * 180 / Math.PI, beta = Math.atan2(h, 8 - x) * 180 / Math.PI, gamma = 180 - alpha - beta;
      const extension = x < 0 ? line(H, A, '#8b9a95', 'stroke-dasharray="5 5"') : x > 8 ? line(B, H, '#8b9a95', 'stroke-dasharray="5 5"') : '';
      ui.svg.innerHTML = `<title>Треугольник с постоянным основанием AB = 8 и подвижной вершиной C</title>${poly([A, B, C])}${heightVisible ? `${extension}${line(C, H, '#ae5925', 'stroke-dasharray="6 4"')}<path d="M ${H[0] + 10} ${H[1]} v -10 h -10" stroke="#ae5925" fill="none"/>${label(H, 'H', 0, 24)}${label([(C[0] + H[0]) / 2, (C[1] + H[1]) / 2], `h = ${round(h)}`, 35, 0)}` : ''}${dot(A, 'A')}${dot(B, 'B')}${dot(C, 'C', 'C')}${label(A, 'A', -12, 24)}${label(B, 'B', 12, 24)}${label(C, 'C', 0, -18)}${label(point(4, 0), 'AB = 8', 0, 43)}`;
      ui.feedback.textContent = `Углы ≈ ${round(alpha)}°, ${round(beta)}°, ${round(gamma)}°; по теореме их сумма точно равна 180° (подписи округлены). Площадь S = 8 · ${round(h)} / 2 = ${round(4 * h)}. ${x < 0 || x > 8 ? 'Основание высоты вне отрезка AB; формула остаётся верной.' : 'При неизменной высоте горизонтальный сдвиг C не меняет площадь.'} Это следует из S = ah/2, а не из точности картинки.`;
    }
    ui.drag((name, p) => { x = Math.round(clamp((p[0] - 80) / 32, -2, 10) * 4) / 4; h = Math.round(clamp((280 - p[1]) / 32, 1, 7) * 4) / 4; xInput.value = x; hInput.value = h; render(); });
    render(); return ui.cleanup;
  };

  registry['prof-right-similarity'] = function (container) {
    const ui = lab(container, 'Прямой угол и подобие', 'Двигай B только по горизонтали, C только по вертикали. Прямой угол A сохраняется. Измени масштаб k и проверь, что происходит с отношениями сторон и площадью.', '0 0 600 350');
    let a = 5, b = 3, k = 1.4;
    const aInput = ui.number('prof-right-a', 'Катет AB', a, 2, 9, 0.25, n => { a = n; render(); });
    const bInput = ui.number('prof-right-b', 'Катет AC', b, 2, 9, 0.25, n => { b = n; render(); });
    ui.number('prof-right-k', 'Масштаб k', k, 0.5, 1.5, 0.1, n => { k = n; render(); });
    function render() {
      const A = [40, 275], B = [40 + 16 * a, 275], C = [40, 275 - 16 * b];
      const D = [350, 275], E = [350 + 16 * a * k, 275], F = [350, 275 - 16 * b * k];
      const c = Math.hypot(a, b);
      ui.svg.innerHTML = `<title>Прямоугольный треугольник ABC и его увеличенная или уменьшенная копия DEF</title>${poly([A, B, C])}${poly([D, E, F])}<path d="M 40 263 h 12 v 12 M 350 263 h 12 v 12" stroke="#176860" fill="none"/>${dot(B, 'B', 'B')}${dot(C, 'C', 'C')}${label(A, 'A', -15, 23)}${label(B, 'B', 8, 23)}${label(C, 'C', -16, -12)}${label(D, 'D', -12, 23)}${label(E, 'E', 7, 23)}${label(F, 'F', -16, -12)}${label([(A[0] + B[0]) / 2, 306], `a = ${round(a)}`, 0, 0)}${label([10, (A[1] + C[1]) / 2], round(b), 0, 0)}${label([(D[0] + E[0]) / 2, 306], `ka = ${round(k * a)}`, 0, 0)}${label([310, (D[1] + F[1]) / 2], round(k * b), 0, 0)}${label([B[0] - 18, B[1] - 7], 'α', 0, -10)}${label([E[0] - 18, E[1] - 7], 'α', 0, -10)}<text x="300" y="35" text-anchor="middle" font-size="15" fill="#243b43">Все стороны справа умножены на k = ${round(k)}</text>`;
      ui.feedback.textContent = `Гипотенуза BC = √(${round(a * a)} + ${round(b * b)}) ≈ ${round(c)}. Для угла α при B: sin α = AC/BC ≈ ${round(b / c)}, cos α = AB/BC ≈ ${round(a / c)}, tg α = AC/AB ≈ ${round(b / a)}. В копии эти отношения те же: множитель k сокращается. Площадь слева ${round(a * b / 2)}, справа ${round(a * b * k * k / 2)} — в k² = ${round(k * k)} раза больше (или меньше при k < 1).`;
    }
    ui.drag((name, p) => { if (name === 'B') { a = Math.round(clamp((p[0] - 40) / 16, 2, 9) * 4) / 4; aInput.value = a; } else { b = Math.round(clamp((275 - p[1]) / 16, 2, 9) * 4) / 4; bInput.value = b; } render(); });
    render(); return ui.cleanup;
  };

  registry['prof-construction'] = function (container) {
    const ui = lab(container, 'Какую линию провести?', 'В равнобедренной трапеции основания равны 14 и 6. Выбери цель, затем дополнительное построение. Перемещение D вверх и вниз меняет обе верхние вершины: основания остаются параллельны, боковые стороны равны.');
    let h = 5, goal = 'height', construction = '';
    ui.select('Что требуется найти?', [['height', 'Высоту по боковой стороне'], ['midline', 'Сумму оснований по средней линии'], ['diagonal', 'Площади двух треугольников']], value => { goal = value; render(); });
    const input = ui.number('prof-construction-height', 'Высота модели', h, 2, 7, 0.25, n => { h = n; render(); });
    const buttons = {};
    [['height', 'Провести высоты'], ['midline', 'Соединить середины сторон'], ['diagonal', 'Провести диагональ']].forEach(([key, title]) => { buttons[key] = ui.button(title, () => { construction = key; render(); }); buttons[key].setAttribute('aria-pressed', 'false'); });
    function render() {
      const A = [78, 280], B = [414, 280], C = [318, 280 - 24 * h], D = [174, 280 - 24 * h];
      const H = [174, 280], K = [318, 280], M = [(A[0] + D[0]) / 2, (A[1] + D[1]) / 2], N = [(B[0] + C[0]) / 2, (B[1] + C[1]) / 2];
      let extra = '';
      if (construction === 'height') extra = `${line(D, H, '#af5922', 'stroke-dasharray="6 4"')}${line(C, K, '#af5922', 'stroke-dasharray="6 4"')}<path d="M 174 269 h 11 v 11 M 318 269 h 11 v 11" fill="none" stroke="#af5922"/>${label(H, 'H', 0, 23)}${label(K, 'K', 0, 23)}${label([126, 280], '4', 0, -9)}`;
      if (construction === 'midline') extra = `${line(M, N, '#af5922')}${dot(M, 'M')}${dot(N, 'N')}${label(M, 'M', -16, 0)}${label(N, 'N', 17, 0)}${label([(M[0] + N[0]) / 2, M[1]], 'MN = 10', 0, -10)}`;
      if (construction === 'diagonal') extra = `${line(A, C, '#af5922')}${label([205, 250], 'ABC', 0, 0)}${label([185, D[1] + 30], 'ACD', 0, 0)}`;
      ui.svg.innerHTML = `<title>Равнобедренная трапеция: выбери высоты, среднюю линию или диагональ</title>${poly([A, B, C, D])}${extra}${dot(D, 'D', 'D')}${label(A, 'A', -12, 24)}${label(B, 'B', 12, 24)}${label(C, 'C', 10, -15)}${label(D, 'D', -13, -18)}${label([246, 280], 'AB = 14', 0, 47)}${label([246, D[1]], 'DC = 6', 0, -16)}`;
      Object.keys(buttons).forEach(key => buttons[key].setAttribute('aria-pressed', String(construction === key)));
      const explanations = {
        height: `Высоты выделяют прямоугольник и два равных прямоугольных треугольника. AH = BK = (14 − 6)/2 = 4; боковая сторона ≈ ${round(Math.hypot(4, h))}. Поэтому h² = боковая сторона² − 4². Равенство выступов следует из равнобедренности.`,
        midline: 'M и N — середины боковых сторон. По теореме о средней линии MN = (14 + 6)/2 = 10. Значит сумма оснований равна 2MN. Одной параллельности MN основаниям без условия о серединах недостаточно.',
        diagonal: `Диагональ AC делит трапецию на треугольники ABC и ACD с общей высотой ${round(h)} к параллельным основаниям. Их площади ${round(14 * h / 2)} и ${round(6 * h / 2)}, отношение 14 : 6. Эти площади не равны: такое равенство для диагонали трапеции в общем случае неверно.`
      };
      ui.feedback.textContent = !construction ? 'Пока дополнительная линия не проведена. Выбери построение и объясни, какое известное свойство оно открывает.' : `${construction === goal ? 'Это построение прямо помогает выбранной цели. ' : 'Построение полезно для другой связи; попробуй линию, которая прямо отвечает выбранной цели. '}${explanations[construction]}`;
    }
    ui.drag((name, p) => { h = Math.round(clamp((280 - p[1]) / 24, 2, 7) * 4) / 4; input.value = h; render(); });
    render(); return ui.cleanup;
  };

  registry['prof-circle'] = function (container) {
    const ui = lab(container, 'На какую дугу опирается угол?', 'Точки A и B фиксированы. Двигай C по окружности или меняй её угол в поле. Переключи дугу расположения C: угол ACB начнёт опираться на другую дугу AB.');
    const O = [245, 170], R = 110;
    let degrees = 270, side = 'major', tangent = false;
    const point = degrees => [O[0] + R * Math.cos(degrees * Math.PI / 180), O[1] - R * Math.sin(degrees * Math.PI / 180)];
    const A = point(20), B = point(150);
    const mode = ui.select('Где находится вершина C?', [['major', 'На большей дуге AB'], ['minor', 'На меньшей дуге AB']], value => { side = value; degrees = side === 'major' ? 270 : 85; setLimits(); render(); });
    const input = ui.number('prof-circle-position', 'Положение C, градусы', degrees, 165, 365, 1, n => { degrees = clamp(n, side === 'major' ? 165 : 35, side === 'major' ? 365 : 135); render(); });
    ui.check('Показать касательную в A', tangent, n => { tangent = n; render(); });
    function setLimits() { input.min = side === 'major' ? 165 : 35; input.max = side === 'major' ? 365 : 135; input.value = degrees; }
    function render() {
      const C = point(degrees), angle = side === 'major' ? 65 : 115;
      const arc = side === 'major' ? `M ${A.join(' ')} A ${R} ${R} 0 0 0 ${B.join(' ')}` : `M ${A.join(' ')} A ${R} ${R} 0 1 1 ${B.join(' ')}`;
      let tangentMarkup = '';
      if (tangent) {
        const u = [Math.cos(20 * Math.PI / 180), -Math.sin(20 * Math.PI / 180)], v = [Math.sin(20 * Math.PI / 180), Math.cos(20 * Math.PI / 180)];
        const start = [A[0] - 115 * v[0], A[1] - 115 * v[1]], end = [A[0] + 170 * v[0], A[1] + 170 * v[1]];
        const inner = [A[0] - 12 * u[0], A[1] - 12 * u[1]], corner = [inner[0] + 12 * v[0], inner[1] + 12 * v[1]], outer = [A[0] + 12 * v[0], A[1] + 12 * v[1]];
        tangentMarkup = `${line(start, end, '#8b4aa4')}<path d="M ${inner.join(' ')} L ${corner.join(' ')} L ${outer.join(' ')}" fill="none" stroke="#8b4aa4"/>${label(end, 'касательная', 13, 25)}`;
      }
      ui.svg.innerHTML = `<title>Вписанный угол ACB и дуга AB, не содержащая C</title><circle cx="${O[0]}" cy="${O[1]}" r="${R}" fill="#eef6f0" stroke="#7b9690" stroke-width="2"/><path d="${arc}" fill="none" stroke="#af5922" stroke-width="7"/>${line(O, A, '#8b9a95', 'stroke-dasharray="5 4"')}${line(O, B, '#8b9a95', 'stroke-dasharray="5 4"')}${line(C, A)}${line(C, B)}${tangentMarkup}${dot(O, 'O')}${dot(A, 'A')}${dot(B, 'B')}${dot(C, 'C', 'C')}${label(O, 'O', -14, 16)}${label(A, 'A', 20, 0)}${label(B, 'B', -17, 0)}${label(C, 'C', 0, degrees > 180 ? 27 : -19)}<text x="22" y="325" fill="#92421b" font-size="14">Оранжевая дуга не содержит C</text>`;
      ui.feedback.textContent = `Меньшая дуга AB всегда 130°. Сейчас C на ${side === 'major' ? 'большей' : 'меньшей'} дуге; угол опирается на ${side === 'major' ? 'меньшую дугу 130°' : 'большую дугу 360° − 130° = 230°'}. По теореме о вписанном угле ∠ACB = ${angle}°. Пока C остаётся на одной выбранной дуге, угол не меняется. ${tangent ? 'Радиус OA перпендикулярен касательной именно в точке A; отметка 90° отражает теорему о касательной.' : 'Включи касательную, чтобы увидеть ещё одно основание для прямого угла.'}`;
    }
    ui.drag((name, p) => { let angle = Math.atan2(O[1] - p[1], p[0] - O[0]) * 180 / Math.PI; if (angle < 0) angle += 360; if (side === 'major' && angle < 20) angle += 360; degrees = Math.round(clamp(angle, side === 'major' ? 165 : 35, side === 'major' ? 365 : 135)); input.value = degrees; render(); });
    // Keep the select available as the explicit keyboard alternative to changing arcs.
    mode.setAttribute('aria-label', 'Выбор дуги расположения вершины C');
    render(); return ui.cleanup;
  };

  registry['prof-vectors'] = function (container) {
    const ui = lab(container, 'Векторы: координаты, разность и знак произведения', 'Двигай оранжевые концы a и b по сетке или вводи их координаты. Выбери действие и наблюдай результат. При общем начале разность a − b направлена от конца b к концу a.', '0 0 540 540');
    let a = [4, 2], b = [-2, 3], mode = 'difference', factor = -1;
    const center = [270, 250], step = 22;
    const point = p => [center[0] + step * p[0], center[1] - step * p[1]];
    const inputs = [];
    ui.select('Что исследовать?', [['difference', 'Разность a − b'], ['sum', 'Сумма a + b'], ['scale', 'Умножение ka'], ['dot', 'Скалярное произведение'], ['endpoint', 'От точки A к точке B']], value => { mode = value; render(); });
    [['a', 'a: x', 0], ['a', 'a: y', 1], ['b', 'b: x', 0], ['b', 'b: y', 1]].forEach(([name, text, axis]) => {
      const input = ui.number(`prof-vector-${name}-${axis}`, text, (name === 'a' ? a : b)[axis], -5, 5, 1, n => { (name === 'a' ? a : b)[axis] = Math.round(n); render(); }); inputs.push(input);
    });
    ui.number('prof-vector-k', 'Коэффициент k', factor, -2, 2, 0.5, value => { factor = value; render(); });
    ui.button('Сделать b перпендикулярным a', () => { b = [-a[1], a[0]]; syncInputs(); render(); });
    ui.button('Развернуть b', () => { b = b.map(n => -n); syncInputs(); render(); });
    function syncInputs() { [a[0], a[1], b[0], b[1]].forEach((n, i) => { inputs[i].value = n; }); }
    function arrow(from, to, color, name, dashed = false) {
      if (from[0] === to[0] && from[1] === to[1]) return `<circle cx="${from[0]}" cy="${from[1]}" r="6" fill="none" stroke="${color}" stroke-width="3"/>${label(to, name, 12, -15)}`;
      const angle = Math.atan2(to[1] - from[1], to[0] - from[0]);
      const l = [to[0] - 12 * Math.cos(angle - 0.45), to[1] - 12 * Math.sin(angle - 0.45)], r = [to[0] - 12 * Math.cos(angle + 0.45), to[1] - 12 * Math.sin(angle + 0.45)];
      return `${line(from, to, color, dashed ? 'stroke-dasharray="6 4"' : '')}<path d="M ${l.join(' ')} L ${to.join(' ')} L ${r.join(' ')}" stroke="${color}" stroke-width="3" fill="none"/>${label(to, name, 12, -15)}`;
    }
    function pair(v) { return `(${round(v[0])}; ${round(v[1])})`; }
    function render() {
      let grid = '';
      for (let n = -5; n <= 5; n++) {
        grid += line(point([n, -5]), point([n, 5]), '#d6e3de', 'style="stroke-width:1"');
        grid += line(point([-5, n]), point([5, n]), '#d6e3de', 'style="stroke-width:1"');
        if (n !== 0) grid += label(point([n, 0]), n, 0, 17) + label(point([0, n]), n, -14, 5);
      }
      grid += arrow(point([-6, 0]), point([6, 0]), '#738b82', 'x') + arrow(point([0, -6]), point([0, 6]), '#738b82', 'y') + label(center, '0', -12, 16);
      const A = point(a), B = point(b), difference = [a[0] - b[0], a[1] - b[1]], sum = [a[0] + b[0], a[1] + b[1]], dotProduct = a[0] * b[0] + a[1] * b[1];
      let drawing = '', explanation = '';
      const lengths = `|a| ≈ ${round(Math.hypot(...a))}, |b| ≈ ${round(Math.hypot(...b))}.`;
      if (mode === 'endpoint') {
        const displacement = [b[0] - a[0], b[1] - a[1]];
        drawing = arrow(A, B, '#176860', 'AB') + label(A, 'A', 0, 25) + label(B, 'B', 0, 25);
        explanation = `В этом режиме концы a и b служат точками A${pair(a)} и B${pair(b)}. AB = конец − начало = ${pair(displacement)}. Длина AB ≈ ${round(Math.hypot(...displacement))}. Вектор BA имеет противоположные координаты. Подписи a и b в полях задают координаты этих двух точек.`;
      } else {
        drawing = arrow(center, A, '#176860', 'a') + arrow(center, B, '#466fb0', 'b');
        if (mode === 'difference') { drawing += arrow(B, A, '#aa4d18', 'a − b', true); explanation = `a − b = ${pair(difference)}, длина ≈ ${round(Math.hypot(...difference))}. Оранжевая стрелка идёт от конца b к концу a: b + (a − b) = a. ${lengths}`; }
        if (mode === 'sum') {
          // All permitted sums fit this viewBox, including both extreme coordinates.
          const sumEnd = point(sum);
          const fits = Math.abs(sum[0]) <= 10 && Math.abs(sum[1]) <= 10;
          if (fits) drawing += arrow(A, sumEnd, '#466fb0', 'b', true) + arrow(center, sumEnd, '#aa4d18', 'a + b');
          explanation = `a + b = ${pair(sum)}. Перенеси b так, чтобы его начало совпало с концом a: сумма идёт из общего начала в конец перенесённого b. ${fits ? '' : 'Конец суммы за границей сетки; координаты результата показаны здесь. Уменьши координаты, чтобы увидеть обе стрелки. '}${lengths}`;
        }
        if (mode === 'scale') {
          const scaled = a.map(n => factor * n), fits = Math.abs(scaled[0]) <= 10 && Math.abs(scaled[1]) <= 10;
          if (fits) drawing += arrow(center, point(scaled), '#aa4d18', 'ka', true);
          explanation = `k = ${round(factor)}; ka = ${pair(scaled)}; |ka| = |k| · |a| ≈ ${round(Math.abs(factor) * Math.hypot(...a))}. ${factor < 0 ? 'Отрицательный k разворачивает ненулевой вектор.' : factor === 0 ? 'При k = 0 получается нулевой вектор без направления.' : 'Положительный k сохраняет направление ненулевого вектора.'} ${fits ? '' : 'Конец ka за границей сетки; уменьшение |k| вернёт его на рисунок.'}`;
        }
        if (mode === 'dot') {
          const zero = Math.hypot(...a) === 0 || Math.hypot(...b) === 0;
          const cos = zero ? null : clamp(dotProduct / (Math.hypot(...a) * Math.hypot(...b)), -1, 1);
          const angle = zero ? null : Math.acos(cos) * 180 / Math.PI;
          const meaning = zero ? 'Один из векторов нулевой: угол не определён. Нулевое произведение здесь не доказывает наличие прямого угла.' : dotProduct === 0 ? 'Оба вектора ненулевые и произведение равно нулю: угол прямой.' : dotProduct > 0 ? (Math.abs(angle) < 0.001 ? 'Векторы сонаправлены; угол равен 0°.' : 'Произведение положительно: угол острый.') : (Math.abs(angle - 180) < 0.001 ? 'Векторы противоположно направлены; угол равен 180°.' : 'Произведение отрицательно: угол тупой.');
          explanation = `a · b = ${a[0]} · (${b[0]}) + ${a[1]} · (${b[1]}) = ${dotProduct}. ${meaning}${zero ? '' : ` Угол ≈ ${round(angle)}°. Знак объясняется формулой a · b = |a||b| cos φ.`}`;
        }
      }
      ui.svg.innerHTML = `<title>Координатная сетка и управляемые векторы a и b</title>${grid}${drawing}${dot(A, mode === 'endpoint' ? 'A' : 'Конец a', 'a', 4)}${dot(B, mode === 'endpoint' ? 'B' : 'Конец b', 'b', 4)}<text x="22" y="519" fill="#243b43" font-size="14">a = ${pair(a)}; b = ${pair(b)}. Один шаг сетки — 1.</text>`;
      ui.feedback.textContent = explanation;
    }
    ui.drag((name, p) => { const v = [Math.round(clamp((p[0] - center[0]) / step, -5, 5)), Math.round(clamp((center[1] - p[1]) / step, -5, 5))]; if (name === 'a') a = v; else b = v; syncInputs(); render(); });
    render(); return ui.cleanup;
  };
})(globalThis);

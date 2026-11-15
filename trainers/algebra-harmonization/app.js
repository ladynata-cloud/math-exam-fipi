(function () {
  'use strict';
  const D = window.H35Data, C = window.H35Core, $ = id => document.getElementById(id);
  const course = document.body.dataset.h35Course, quadratic = course === 'quadratic';
  const groups = quadratic ? ['quadratic'] : ['graph', 'sub', 'add'];
  const titles = { graph: 'Графический способ', sub: 'Подстановка', add: 'Сложение', quadratic: 'Парабола и промежутки' };
  const tasks = groups.flatMap(method => D[method].map((t, i) => ({ ...t, id: method + '-' + (i + 1), method, index: i })));
  const byId = new Map(tasks.map(t => [t.id, t]));
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const f = C.format, clone = C.clone;
  let storage; try { storage = window.localStorage; } catch (_) { storage = null; }
  const journal = new C.Journal(course, tasks.map(t => t.id), storage);
  let active = journal.attempts().at(-1) || journal.begin(tasks[0].id, 'learn');
  let remotePending = false, transitionNote = '';
  const task = () => byId.get(active.state.taskId);
  function changed(fn, repaint = true) {
    const next = clone(active.state); fn(next);
    const result = journal.update(active.id, next, active.latest);
    active = result.attempt; remotePending = false;
    if (result.stale) transitionNote = 'Другая вкладка уже изменила этот шаг. Свежая работа сохранена. Ваш вариант добавлен в «Сохранённая работа»; действие не засчитано повторно.';
    if (repaint || result.stale) render(); else notices();
    return !result.stale;
  }
  function selectTask(id) {
    if (!byId.has(id)) return;
    journal.read();
    const previous = journal.attempts().filter(a => a.state.taskId === id).at(-1);
    active = previous || journal.begin(id, 'learn');
    if (previous) active = journal.update(previous.id, previous.state, previous.latest).attempt;
    remotePending = false; transitionNote = ''; render();
  }
  function freshIndependent() {
    journal.read(); const options = tasks.filter(t => t.method === task().method), fresh = options.find(t => !journal.seen(t.id));
    const next = fresh || options[(task().index + 1) % options.length];
    active = journal.begin(next.id, 'solo'); remotePending = false;
    transitionNote = fresh ? 'Новое условие без подсказок. Исследованная задача сохранена для возвращения.' : 'Новых условий этого способа больше нет. Это знакомый повтор; он не добавит нового самостоятельного достижения.';
    render();
  }
  function lines(t) {
    if (t.method === 'graph') return [t.l1, t.l2];
    if (t.method === 'sub') return [[t.a, t.b], [t.c, t.d]];
    return null;
  }
  function pairAnswer(t) {
    return t.method === 'add' ? (t.main === 'x' ? [t.mainVal, t.secondVal] : [t.secondVal, t.mainVal]) : [t.x, t.y];
  }
  function lineText(k, b) { return 'y = ' + (k === 1 ? 'x' : k === -1 ? '−x' : f(k) + 'x') + (b ? (b > 0 ? ' + ' : ' − ') + f(Math.abs(b)) : ''); }
  function condition(t) {
    if (quadratic) return esc(t.e);
    const rows = t.method === 'add' ? [t.e1, t.e2] : lines(t).map(v => lineText(...v));
    return rows.map((row, i) => `<div class="${i ? 'orange' : 'blue'}">${esc(row)}</div>`).join('');
  }
  const strict = t => t.sign === 'gt' || t.sign === 'lt';
  const zones = t => ['gt', 'gte'].includes(t.sign) ? [true, false, true] : [false, true, false];
  function zoneText(t, i, include = false) {
    if (i === 0) return `(−∞; ${t.l1}${include ? ']' : ')'}`;
    if (i === 1) return `${include ? '[' : '('}${t.l1}; ${t.l2}${include ? ']' : ')'}`;
    return `${include ? '[' : '('}${t.l2}; +∞)`;
  }
  function answerText(t) {
    return quadratic ? zones(t).flatMap((yes, i) => yes ? [zoneText(t, i, !strict(t))] : []).join(' ∪ ') : '(' + pairAnswer(t).map(f).join('; ') + ')';
  }
  function graphic(t, s) {
    const show = s.phase > 0 || s.mode === 'solo', W = 420, H = 250;
    let min = -4, max = 8, centerY = 190, divisor = 1;
    if (quadratic) { const margin = Math.max(1, (t.r2 - t.r1) * .2); min = t.r1 - margin; max = t.r2 + margin; divisor = t.a * Math.max(1, (t.r2 - t.r1) ** 2 / 16); centerY = 85; }
    const unit = quadratic ? (W - 60) / (max - min) : 24, X = x => 30 + (x - min) * unit, Y = y => centerY - y * unit;
    let out = `<svg id="model" class="graph" viewBox="0 0 ${W} ${H}" role="img" aria-label="${quadratic ? 'Парабола и числовая прямая' : 'Модель выбранного способа'}"><defs><clipPath id="plot-clip"><rect x="20" y="15" width="380" height="205"/></clipPath></defs><path d="M20 ${centerY}H400M${X(0)} 15V220" stroke="#6c858c" fill="none"/>`;
    const increment = max - min > 14 ? 2 : max - min < 4 ? .5 : 1;
    for (let x = Math.ceil(min / increment) * increment; x <= max; x += increment) out += `<path d="M${X(x)} ${centerY - 3}v6" stroke="#8aa09f"/><text x="${X(x)}" y="${centerY + 18}" text-anchor="middle" font-size="11">${f(x)}</text>`;
    for (let y = Math.ceil((centerY - 215) / unit); y <= Math.floor((centerY - 20) / unit); y++) if (y !== 0) out += `<path d="M${X(0) - 3} ${Y(y)}h6" stroke="#8aa09f"/><text x="${X(0) - 7}" y="${Y(y) + 4}" text-anchor="end" font-size="11">${y}</text>`;
    out += `<text x="400" y="${centerY - 8}" font-size="12">x</text><text x="${X(0) + 7}" y="24" font-size="12">${quadratic ? 'g(x)' : 'y'}</text>`;
    if (!show) out += '<text x="210" y="238" text-anchor="middle" font-size="14">Сначала сделай прогноз</text>';
    else if (quadratic) {
      const points = Array.from({ length: 241 }, (_, i) => { const x = min + i * (max - min) / 240; return X(x) + ',' + Y(t.a * (x - t.r1) * (x - t.r2) / divisor); });
      out += `<polyline points="${points.join(' ')}" clip-path="url(#plot-clip)" fill="none" stroke="#12685d" stroke-width="2.6"/>`;
      [t.r1, t.r2].forEach((r, i) => { out += `<circle cx="${X(r)}" cy="${centerY}" r="4" fill="#12685d"/><text x="${X(r)}" y="${centerY - 8}" font-size="12" text-anchor="middle">${esc(i ? t.l2 : t.l1)}</text>`; });
      const ends = [30, X(t.r1), X(t.r2), X(max)], yy = 225;
      out += `<path d="M30 ${yy}H${X(max)}" stroke="#6c858c"/>`;
      for (let i = 0; i < 3; i++) out += `<path d="M${ends[i]} ${yy}H${ends[i + 1]}" stroke="${s.zones[i] ? '#1760a4' : '#a9bdb6'}" stroke-width="${s.zones[i] ? 7 : 2}"/>`;
      [t.r1, t.r2].forEach(r => { out += `<circle cx="${X(r)}" cy="${yy}" r="5" fill="${s.endpoints ? '#1760a4' : '#fff'}" stroke="#1760a4" stroke-width="2"/>`; });
    } else if (t.method === 'add') {
      out = '<svg id="model" class="graph" viewBox="0 0 420 250" role="img" aria-label="Сложение двух уравнений"><rect x="12" y="12" width="396" height="226" rx="10" fill="#f4f8f5"/>';
      const rows = s.mode === 'solo' && !s.help && !s.done ? [t.e1, '', t.e2] : [t.e1, '+', t.e2, '────────────────', t.add];
      rows.forEach((text, i) => { out += `<text x="210" y="${42 + i * 40}" text-anchor="middle" font-size="${i === 1 ? 20 : 23}">${esc(text)}</text>`; });
    } else {
      lines(t).forEach(([k, b], i) => { out += `<path d="M${X(min)} ${Y(k * min + b)}L${X(max)} ${Y(k * max + b)}" clip-path="url(#plot-clip)" stroke="${i ? '#ac5418' : '#1760a4'}" stroke-width="2.7" fill="none"/>`; });
      if (s.phase === 1) lines(t).forEach(([k, b], i) => { out += `<circle cx="${X(s.probeX)}" cy="${Y(k * s.probeX + b)}" r="4" fill="${i ? '#ac5418' : '#1760a4'}" clip-path="url(#plot-clip)"/>`; });
      // An exact answer label is allowed only after completion or an explicit reveal.
      if (s.done || s.revealed) { const [x, y] = pairAnswer(t); out += `<circle cx="${X(x)}" cy="${Y(y)}" r="5" fill="#12685d"/><text data-answer-label x="${X(x) + 8}" y="${Y(y) - 10}" font-size="13">${esc(answerText(t))}</text>`; }
    }
    out += '</svg>';
    if (quadratic) out += `<p class="graph-caption">${show ? `Для рисунка g(x) = f(x) / ${f(divisor)}. Делитель положительный: нули и знаки сохраняются. По осям x и g один масштаб.` : 'После прогноза откроется модель знаков выражения и числовая прямая.'}</p>`;
    else out += `<p class="graph-caption">${t.method === 'add' ? (show && (s.mode === 'learn' || s.help || s.done) ? 'Сумма — следствие двух строк. Для решения системы нужна и одна исходная строка.' : 'Две исходные строки системы. Найди пару, которая подходит к обеим.') : 'Две прямые — две строки. По осям один масштаб.'}</p>`;
    return out;
  }
  const button = (action, label, cls = '', extra = '') => `<button type="button" data-action="${action}" class="${cls}" ${extra}>${label}</button>`;
  function feedback(s) { return `<div id="feedback" class="feedback ${s.feedbackKind}" role="status" aria-live="polite" ${s.feedback ? '' : 'hidden'}>${esc(s.feedback)}</div>`; }
  function prediction(t, s) {
    let question, options;
    if (quadratic) { question = `Где выражение слева после переноса всех слагаемых в одну часть ${['gt', 'gte'].includes(t.sign) ? 'положительно' : 'отрицательно'}: между нулями или снаружи? Сначала предположи, потом проверь числа.`; options = [['inside', 'Между нулями'], ['outside', 'Снаружи двух нулей'], ['unsure', 'Пока не уверен — проверю']]; }
    else if (t.method === 'graph') { question = 'Точка лежит на синей прямой, но не лежит на оранжевой. Может ли она решить всю систему?'; options = [['both', 'Нет: нужны обе прямые'], ['one', 'Да: хватит одной прямой'], ['unsure', 'Проверю на модели']]; }
    else if (t.method === 'sub') { question = 'В обеих строках выражен y. Если при выбранном x правые части различаются, существует ли общий y для этого x?'; options = [['no', 'Нет, один y не равен двум разным числам'], ['yes', 'Да, можно выбрать любой из них'], ['unsure', 'Проверю значения']]; }
    else { question = 'Если пара чисел подходит к сумме двух уравнений, обязательно ли она решает каждое исходное уравнение?'; options = [['no', 'Не обязательно: проверю обе строки'], ['yes', 'Да, одной суммы достаточно'], ['unsure', 'Хочу проверить на числах']]; }
    return `<p class="eyebrow">1 · Предположи</p><h2>Твой прогноз</h2><p>${question}</p><div class="choices">${options.map(([value, label]) => button('predict', esc(label), '', `data-value="${value}"`)).join('')}</div><p class="small">Прогноз не оценивается. Он останется рядом с наблюдениями.</p>`;
  }
  function addValues(t, variable) {
    const index = t.index, x = t.main === 'x' ? t.mainVal : variable, y = t.main === 'y' ? t.mainVal : variable;
    const coefficients = [[1, 1, 7, 1, -1, 1], [3, 2, 16, 3, -2, 8], [2, 1, 9, -2, 3, 3], [1, 2, 11, 1, -2, 3]][index];
    const [a, b, c, d, e, g] = coefficients;
    return { x, y, first: a * x + b * y, rhs1: c, second: d * x + e * y, rhs2: g };
  }
  function experiment(t, s) {
    let model = '', instruction = '';
    const options = s.observations.length;
    if (quadratic) {
      instruction = 'Проверь по одному числу в каждом промежутке и оба нуля. Знак на каждом промежутке не меняется, пока мы не пересечём ноль.';
      const probes = [['left', t.r1 - 1, 'Слева от нулей'], ['middle', (t.r1 + t.r2) / 2, 'Между нулями'], ['right', t.r2 + 1, 'Справа от нулей'], ['roots', t.r1, 'В самих нулях']];
      model = `<div class="choices">${probes.map(([id, x, label]) => button('probe-zone', label, '', `data-value="${id}" aria-pressed="${s.observations.includes(id)}"`)).join('')}</div><table class="sample-table"><caption>Наблюдения</caption><thead><tr><th>Где</th><th>x</th><th>f(x)</th></tr></thead><tbody>${probes.filter(([id]) => s.observations.includes(id)).map(([id, x, label]) => `<tr><td>${label}</td><td>${id === 'roots' ? esc(t.l1 + '; ' + t.l2) : f(x)}</td><td>${f(t.a * (x - t.r1) * (x - t.r2))}</td></tr>`).join('')}</tbody></table>`;
    } else if (t.method === 'add') {
      const v = addValues(t, s.probeY);
      instruction = `Из суммы получается ${t.main} = ${t.mainVal}. Меняй ${t.second}. Когда сумма верна, а исходные строки неверны? Проверь хотя бы две разные пары.`;
      model = `<label class="field">${t.second} = <output>${f(s.probeY)}</output><input id="probe" data-probe="probeY" type="range" min="-3" max="8" step="1" value="${s.probeY}"></label><p>Пара (${f(v.x)}; ${f(v.y)})</p><table class="sample-table"><tr><th>Строка</th><th>Левая часть</th><th>Правая часть</th></tr><tr><td>Первая</td><td>${f(v.first)}</td><td>${v.rhs1}</td></tr><tr><td>Вторая</td><td>${f(v.second)}</td><td>${v.rhs2}</td></tr><tr><td>Сумма</td><td>${f(v.first + v.second)}</td><td>${v.rhs1 + v.rhs2}</td></tr></table>${button('observe', 'Записать наблюдение', 'primary')}<p class="small">${v.first === v.rhs1 && v.second === v.rhs2 ? 'Здесь верны обе исходные строки.' : 'Сумма верна, но эта пара не решает обе исходные строки.'}</p>`;
    } else {
      const [a, b] = lines(t).map(([k, offset]) => k * s.probeX + offset);
      instruction = t.method === 'graph' ? 'Меняй x. На двух прямых получаются два значения y. Для общей точки они должны совпасть. Проверь хотя бы два разных x.' : 'Подставь один и тот же x в обе правые части. Сравни значения, затем попробуй другой x. Так проверим, зачем приравнивать выражения.';
      model = `<label class="field">x = <output>${f(s.probeX)}</output><input id="probe" data-probe="probeX" type="range" min="-3" max="6" step="0.5" value="${s.probeX}"></label><table class="sample-table"><tr><th>x</th><th>Первая строка: y</th><th>Вторая: y</th></tr><tr><td>${f(s.probeX)}</td><td>${f(a)}</td><td>${f(b)}</td></tr></table><p class="probe-readout">${C.equal(a, b) ? 'Значения совпали: обе строки подходят одной паре.' : 'Значения различаются: общей пары при этом x нет.'}</p>${button('observe', 'Записать наблюдение', 'primary')}`;
    }
    const enough = quadratic ? options >= 4 : options >= 2;
    return `<p class="eyebrow">2 · Проверь на модели</p><h2>Сравни прогноз с наблюдением</h2><p class="small">Первый прогноз: ${esc(predictionLabel(s.prediction))}.</p><p>${instruction}</p>${model}<p class="small">Записано разных наблюдений: ${options}.</p>${button('conclusion', 'Сформулировать вывод →', 'primary', enough ? '' : 'disabled')}`;
  }
  function predictionLabel(value) { return ({ inside: 'между нулями', outside: 'снаружи', both: 'нужны обе прямые', one: 'хватит одной прямой', no: 'нет', yes: 'да', unsure: 'проверю на модели' })[value] || value; }
  function explanation(t) {
    if (quadratic) return `В нашем условии коэффициент при x² положительный. Слева от обоих нулей множители отрицательны: произведение положительно. Между нулями знаки разные: произведение отрицательно. Справа оба множителя положительны. В нулях выражение равно нулю. Поэтому знак ${strict(t) ? '> или < не разрешает' : '≥ или ≤ разрешает'} включать нули. Для текущего неравенства нужно выбрать ${['gt', 'gte'].includes(t.sign) ? 'внешние промежутки' : 'промежуток между нулями'}.`;
    if (t.method === 'graph') return 'Решение системы — одна пара (x; y), которая делает верными обе строки одновременно. На рисунке это общая точка прямых. При выбранном x значение y должно совпасть на обеих прямых. После чтения графика проверь найденную пару подстановкой.';
    if (t.method === 'sub') return `Обе правые части равны одному y, поэтому они должны быть равны между собой: ${t.eq}. Из этого равенства найдём x, затем вернёмся в любую исходную строку за y. Одна найденная координата ещё не составляет ответ на систему.`;
    return `Сумма двух верных равенств тоже верна: ${t.add}. Но у одной этой строки больше подходящих пар, чем у системы. Поэтому сохраняем и одну исходную строку: по ней найдём ${t.second}. Проверка в обеих первоначальных строках подтверждает пару.`;
  }
  function conclusion(t, s) { return `<p class="eyebrow">3 · Сформулируй вывод</p><h2>Почему способ работает</h2><p class="explanation">${esc(explanation(t))}</p><p class="small">Этот разбор относится к текущему условию. После него проверка будет отмечена как работа с опорой.</p>${button('practice', 'Решить это условие по шагам →', 'primary')}<div class="actions">${button('fresh', 'Другое условие самостоятельно', 'subtle-button')}</div>`; }
  function stepInfo(t, s) {
    if (s.mode === 'solo' || t.method === 'graph') return { title: 'Найди общую пару (x; y)', format: 'Например: 2; 3/2. Координаты разделяй точкой с запятой.', pair: true };
    if (s.step === 0) return t.method === 'sub' ? { title: 'Как связать две строки?', options: [['equal', 'Приравнять правые части'], ['add', 'Приравнять сумму правых частей к нулю'], ['choose', 'Выбрать любую одну строку']] } : { title: 'Какая переменная исчезнет при сложении?', options: [['x', 'x'], ['y', 'y'], ['both', 'Обе переменные']] };
    if (s.step === 1) return { title: 'Найди ' + (t.method === 'sub' ? 'x' : t.main), format: 'Число или дробь, например 3/2.' };
    if (s.step === 2) return { title: 'Вернись в исходную строку и найди ' + (t.method === 'sub' ? 'y' : t.second), format: 'Число или дробь, например 3/2.' };
    return { title: 'Запиши общую пару (x; y)', format: 'Сначала x, затем y, через ; .', pair: true };
  }
  function completed(t, s) {
    const labels = { independent: 'Новое условие решено без подсказок и исправлений.', assisted: 'Условие разобрано с опорой.', corrected: 'Ответ найден после самостоятельного исправления.', repeat: 'Знакомое условие решено повторно.', conflict: 'Ответ верен. В этой попытке была работа двух вкладок; самостоятельность не подтверждена.', pending: 'Ответ верен. Сохранение пока не подтверждено.' };
    return `<p class="eyebrow">Ответ проверен</p><h2>${esc(answerText(t))}</h2><p>${labels[journal.outcome(active)] || ''}</p>${!quadratic ? `<p class="small">Подставь обе координаты в две исходные строки. Проверка числового ответа не заменяет запись решения.</p>` : '<p class="small">Проверь включение нулей в ответ и знак хотя бы одной точки на каждом выбранном промежутке.</p>'}<div class="actions">${button('fresh', 'Следующее условие без подсказок', 'primary')}${button('repeat', 'Разобрать знакомое условие')}</div>`;
  }
  function practice(t, s) {
    if (s.done) return completed(t, s);
    let work;
    if (quadratic) {
      work = `<h2>Выбери все подходящие промежутки</h2><p class="small">Границы уточни отдельным ответом ниже.</p><div class="choices">${[0, 1, 2].map(i => button('zone', esc(zoneText(t, i, false)), '', `data-value="${i}" aria-pressed="${s.zones[i]}"`)).join('')}</div><h3>Включать оба нуля в ответ?</h3><div class="rows">${button('endpoints', 'Да, включать', '', `data-value="true" aria-pressed="${s.endpoints === true}"`)}${button('endpoints', 'Нет, не включать', '', `data-value="false" aria-pressed="${s.endpoints === false}"`)}</div>`;
    } else {
      const info = stepInfo(t, s), slot = s.mode === 'solo' || t.method === 'graph' ? 3 : s.step;
      const history = s.mode === 'learn' && t.method !== 'graph' && s.step ? `<ol class="steps">${s.drafts.slice(0, s.step).map((v, i) => `<li>${esc(i === 0 ? (t.method === 'sub' ? t.eq : t.add) : (i === 1 ? t.method === 'sub' ? 'x' : t.main : t.method === 'sub' ? 'y' : t.second) + ' = ' + v)}</li>`).join('')}</ol>` : '';
      work = `${history}<h2>${info.title}</h2>${info.options ? `<div class="choices">${info.options.map(([value, label]) => button('choice', label, '', `data-value="${value}" aria-pressed="${s.drafts[slot] === value}"`)).join('')}</div>` : `<label class="field" for="answer">Твой ответ<input id="answer" name="answer" data-draft="${slot}" value="${esc(s.drafts[slot])}" maxlength="160" autocomplete="off" aria-describedby="answer-format"></label><p class="small" id="answer-format">${info.format}</p>`}`;
    }
    return `<p class="eyebrow">${s.mode === 'solo' ? 'Самостоятельная проверка' : '4 · Реши с опорой'}</p><form id="answer-form">${work}${feedback(s)}<button class="primary" type="submit">Проверить</button></form><div class="actions">${button('hint', 'Подсказка')}${button('reveal', 'Показать решение')}</div>${s.help ? `<p class="small">Помощь отмечена и сохранена.</p>` : ''}${s.revealed ? `<section class="explanation" aria-label="Показанное решение"><p>${esc(explanation(t))}</p><p><b>Ответ: ${esc(answerText(t))}</b></p><p class="small">Введи или выбери ответ сам. Он будет отмечен как работа с помощью.</p></section>` : ''}`;
  }
  function check() {
    if (active.state.done || active.state.phase !== 3) return;
    const t = task(), s = active.state;
    let ok = false, error = '', invalid = '';
    if (quadratic) {
      if (!s.zones.some(Boolean) || s.endpoints === null) invalid = 'Выбери промежуток и уточни, входят ли нули. Незавершённый выбор не считается ошибкой.';
      else { ok = s.zones.every((v, i) => v === zones(t)[i]) && s.endpoints === !strict(t); error = s.endpoints !== !strict(t) ? 'В нуле выражение равно 0. Сравни 0 со знаком в условии: разрешено ли равенство?' : 'Проверь знак произведения на одном числе из выбранного промежутка. У двух множителей одинаковые знаки или разные?'; }
    } else {
      const info = stepInfo(t, s), slot = s.mode === 'solo' || t.method === 'graph' ? 3 : s.step, raw = s.drafts[slot];
      if (info.options) { if (!raw) invalid = 'Сначала выбери действие. Пустой выбор не считается ошибкой.'; else ok = raw === (t.method === 'sub' ? 'equal' : t.second); }
      else if (info.pair) { const p = C.pair(raw); if (!p) invalid = 'Запиши две координаты через ; , например 2; 3/2. Пустая или неразбираемая запись не считается ошибкой.'; else ok = p.every((v, i) => C.equal(v, pairAnswer(t)[i])); }
      else { const n = C.number(raw); if (n === null) invalid = 'Введи число или дробь с ненулевым знаменателем. Например: 1,5 или 3/2. Эта запись ещё не считается ошибкой.'; else ok = C.equal(n, s.step === 1 ? (t.method === 'sub' ? t.x : t.mainVal) : (t.method === 'sub' ? t.y : t.secondVal)); }
      error = info.pair ? 'Проверь порядок (x; y) и подставь пару в обе исходные строки. Одной верной строки недостаточно.' : s.step === 0 ? (t.method === 'sub' ? 'Обе правые части обозначают один y. Какое равенство это даёт?' : 'Сложи коэффициенты при каждой букве. У какой буквы получится нулевой коэффициент?') : 'Подставь полученное число в равенство текущего шага. Проверь знак и действие.';
    }
    changed(next => {
      if (invalid) { next.feedback = invalid; next.feedbackKind = 'info'; return; }
      if (!ok) { next.errors = Math.min(100000, next.errors + 1); next.feedback = error; next.feedbackKind = 'error'; return; }
      const final = quadratic || next.mode === 'solo' || t.method === 'graph' || next.step === 3;
      if (final) { next.done = true; next.phase = 4; next.feedback = ''; }
      else { next.step++; next.feedback = 'Верно. Предыдущие действия сохранены выше.'; next.feedbackKind = 'ok'; }
    });
    $('answer')?.focus({ preventScroll: true });
  }
  function notices() {
    const area = $('storage-notice'); area.hidden = !journal.issue;
    area.innerHTML = journal.issue ? `<p>${esc(journal.issue)}</p>${button('retry-save', 'Повторить сохранение')}` : '';
    const notice = $('conflict-notice'); notice.hidden = !remotePending && !transitionNote;
    notice.innerHTML = remotePending ? `<p>Эта попытка обновилась в другой вкладке. Текущий ввод остаётся на экране. Загрузите свежую работу перед продолжением.</p>${button('load-remote', 'Загрузить свежую работу')}` : `<p>${esc(transitionNote)}</p>`;
  }
  function renderProgress() {
    const stats = journal.stats(), legacy = journal.legacy(), attempts = journal.attempts();
    const outcome = { independent: 'Новое без помощи', assisted: 'С опорой', corrected: 'После исправления', repeat: 'Знакомый повтор', pending: 'Не сохранено', conflict: 'Совместная попытка', unfinished: 'Незавершённая работа' };
    const old = legacy && typeof legacy === 'object' ? `<p class="small">Прежняя статистика: выполнено ${Number.isFinite(legacy.solved) ? legacy.solved : '—'}, верных ${Number.isFinite(legacy.correct) ? legacy.correct : '—'}. У этих результатов неизвестны помощь и повтор; они сохранены отдельно и не объявляются новыми самостоятельными достижениями.</p>` : '';
    $('progress').innerHTML = `<h2>Моя работа</h2><div class="progress-grid">${[['independent', 'Новых без помощи'], ['assisted', 'С опорой'], ['corrected', 'После исправления'], ['repeat', 'Знакомых повторов']].map(([key, title]) => `<div class="metric"><b>${stats[key]}</b>${title}</div>`).join('')}</div>${stats.pending || stats.conflict ? `<p class="small">Сохранение/самостоятельность ещё не подтверждены: ${stats.pending + stats.conflict}.</p>` : ''}${old}<details id="saved-work"><summary>Сохранённая работа · ${attempts.length}</summary>${attempts.slice().reverse().map(a => `<div class="saved-attempt"><strong>${esc(titles[byId.get(a.state.taskId).method])} · условие ${byId.get(a.state.taskId).index + 1}</strong><p>${outcome[journal.outcome(a)]}${a.state.step ? ' · шаг ' + (a.state.step + 1) : ''}</p>${button('resume', 'Открыть сохранённую работу', '', `data-value="${esc(a.id)}"`)}${a.archives.map(v => `<div><p>Вариант из другой вкладки сохранён отдельно: ${esc(v.state.drafts.filter(Boolean).join('; ') || 'выбранные действия и промежутки')}</p>${button('recover', 'Открыть этот вариант с опорой', '', `data-value="${esc(v.id)}" data-attempt="${esc(a.id)}"`)}</div>`).join('')}</div>`).join('')}</details>`;
  }
  function render() {
    const t = task(), s = active.state;
    const options = tasks.filter(x => x.method === t.method);
    $('course-controls').innerHTML = `${quadratic ? '' : `<div class="mode-buttons" aria-label="Способ решения">${groups.map(method => button('method', esc(titles[method]), '', `data-value="${method}" aria-pressed="${method === t.method}"`)).join('')}</div>`}<label for="task-select">Условие <select id="task-select">${options.map(q => `<option value="${q.id}" ${q.id === t.id ? 'selected' : ''}>${q.index + 1} из ${options.length}${journal.seen(q.id) ? ' · открывали' : ' · новое'}</option>`).join('')}</select></label>${button('fresh', 'Новое без подсказок', 'subtle-button')}`;
    $('attempt-status').innerHTML = `<strong>${s.mode === 'learn' ? 'Исследование → вывод → решение' : s.familiar ? 'Знакомый самостоятельный повтор' : 'Новое условие без подсказок'}</strong>${s.help || s.revealed ? ' · помощь сохранена' : ''}`;
    $('workspace').innerHTML = `<section class="card"><p class="task-progress">${esc(titles[t.method])} · условие ${t.index + 1}</p><div id="condition" class="condition">${condition(t)}</div>${graphic(t, s)}</section><section class="card" id="learning-step">${s.phase === 0 ? prediction(t, s) : s.phase === 1 ? experiment(t, s) : s.phase === 2 ? conclusion(t, s) : practice(t, s)}</section>`;
    notices(); renderProgress();
  }
  document.addEventListener('click', event => {
    const el = event.target.closest('[data-action]'); if (!el) return;
    const a = el.dataset.action, value = el.dataset.value, t = task();
    if (a === 'fresh') return freshIndependent();
    if (a === 'method') { const saved = journal.attempts().filter(v => byId.get(v.state.taskId).method === value && !v.state.done).at(-1); return selectTask(saved?.state.taskId || tasks.find(v => v.method === value).id); }
    if (a === 'repeat') { active = journal.begin(t.id, 'learn'); transitionNote = 'Знакомое условие: прежний результат сохранён, новый разбор идёт с опорой.'; return render(); }
    if (a === 'resume') { const saved = journal.get(value); if (saved) { active = journal.update(saved.id, saved.state, saved.latest).attempt; transitionNote = ''; remotePending = false; render(); } return; }
    if (a === 'recover') { const old = journal.get(el.dataset.attempt)?.archives.find(v => v.id === value); if (!old) return; active = journal.begin(old.state.taskId, 'learn'); changed(s => Object.assign(s, clone(old.state), { mode: 'learn', done: false, phase: Math.min(3, old.state.phase), help: true, familiar: true })); return; }
    if (a === 'retry-save') { if (!journal.storage) { try { journal.storage = window.localStorage; } catch (_) {} } journal.read(); journal.flush(); active = journal.get(active.id); return render(); }
    if (a === 'load-remote') { journal.read(); active = journal.get(active.id); remotePending = false; transitionNote = 'Открыта свежая работа. Предыдущие записи остались в журнале.'; return render(); }
    if (active.state.done) return;
    if (a === 'predict' && active.state.phase === 0) return changed(s => { s.prediction = value; s.phase = 1; s.help = true; });
    if (a === 'observe' && active.state.phase === 1) return changed(s => { const key = String(t.method === 'add' ? s.probeY : s.probeX); if (!s.observations.includes(key) && s.observations.length < 12) s.observations.push(key); });
    if (a === 'probe-zone' && active.state.phase === 1 && ['left', 'middle', 'right', 'roots'].includes(value)) return changed(s => { if (!s.observations.includes(value)) s.observations.push(value); });
    if (a === 'conclusion' && active.state.phase === 1 && active.state.observations.length >= (quadratic ? 4 : 2)) return changed(s => { s.phase = 2; s.help = true; });
    if (a === 'practice' && active.state.phase === 2) return changed(s => { s.phase = 3; s.help = true; });
    if (active.state.phase !== 3) return;
    if (a === 'choice') return changed(s => { s.drafts[s.step] = value; s.feedback = ''; });
    if (a === 'zone' && /^[012]$/.test(value)) return changed(s => { s.zones[Number(value)] = !s.zones[Number(value)]; s.feedback = ''; });
    if (a === 'endpoints') return changed(s => { s.endpoints = value === 'true'; s.feedback = ''; });
    if (a === 'hint') return changed(s => { s.help = true; s.feedbackKind = 'info'; s.feedback = quadratic ? 'Подставь число из промежутка в два множителя. Затем отдельно проверь, допускает ли знак равенство нулю.' : t.method === 'add' ? 'Сложи коэффициенты при каждой букве. После этого сохрани одну исходную строку, чтобы найти вторую координату.' : t.method === 'sub' ? 'Обе правые части равны y. Приравняй их, найди x и вернись за y в исходное равенство.' : 'Общая точка принадлежит обеим прямым. Сначала прочитай x, затем y. Проверь пару в двух строках.'; });
    if (a === 'reveal') return changed(s => { s.help = true; s.revealed = true; });
  });
  document.addEventListener('change', event => { if (event.target.id === 'task-select') selectTask(event.target.value); });
  document.addEventListener('input', event => {
    const el = event.target;
    if (el.dataset.draft !== undefined && active.state.phase === 3 && !active.state.done) changed(s => { s.drafts[Number(el.dataset.draft)] = el.value.slice(0, 160); s.feedback = ''; }, false);
    if (el.dataset.probe && active.state.phase === 1) {
      const prop = el.dataset.probe; if (!['probeX', 'probeY'].includes(prop)) return;
      const n = Number(el.value); if (!Number.isFinite(n) || n < -3 || n > 8) return;
      changed(s => { s[prop] = n; s.help = true; });
      $('probe')?.focus({ preventScroll: true });
    }
  });
  document.addEventListener('submit', event => { if (event.target.id === 'answer-form') { event.preventDefault(); check(); } });
  function receiveRemote() {
    journal.read(); const latest = journal.get(active.id);
    if (latest && (latest.latest !== active.latest || latest.state.help !== active.state.help || latest.state.revealed !== active.state.revealed || latest.conflict !== active.conflict)) {
      if (active.state.done) { active = latest; remotePending = false; transitionNote = 'Получены сохранённые действия другой вкладки. Помощь и спорные варианты учтены в результате.'; return render(); }
      remotePending = true;
    }
    notices(); renderProgress();
  }
  window.addEventListener('storage', event => {
    if (!event.key || event.key.startsWith(journal.prefix)) receiveRemote();
  });
  window.addEventListener('pageshow', receiveRemote);
  window.H35App = { snapshot: () => ({ active: clone(active), attempts: journal.attempts(), stats: journal.stats(), issue: journal.issue }), selectTask, freshIndependent };
  render();
})();

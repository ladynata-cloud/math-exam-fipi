(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./data.js'), require('./engine.js'), require('./plot.js'));
  } else {
    root.CollegeFunctionsRate = factory(root.CollegeFunctionsData, root.CollegeFunctionsEngine, root.CollegeFunctionsPlot);
  }
})(typeof globalThis === 'undefined' ? this : globalThis, function (Data, Engine, Plot) {
  'use strict';

  const task = Data.tasks.find(item => item.id === 'C3');
  const values = [0, 1, 2, 2.25, 2.5, 3, 4];
  const format = value => String(value).replace('-', '−').replace('.', ',');
  const interval = (a, b) => '[' + format(a) + '; ' + format(b) + ']';

  function measure(model, a, b) {
    if (!Number.isFinite(a) || !Number.isFinite(b) || a >= b ||
        !Data.contains(model.domain, a) || !Data.contains(model.domain, b)) return null;
    const left = Data.evaluate(model, a);
    const right = Data.evaluate(model, b);
    const dx = b - a, dy = right - left, rate = dy / dx;
    return [left, right, dx, dy, rate].every(Number.isFinite) ? {left, right, dx, dy, rate} : null;
  }

  function graph(svg, model, a, b, reveal) {
    const m = measure(model, a, b);
    if (!m) return;
    Plot.render(svg, model, {showCurve: true, points: [
      {x: a, y: m.left, label: 'A'}, {x: b, y: m.right, label: 'B'}
    ]});
    svg.setAttribute('aria-label', model.formulaText + '. A (' + format(a) + '; ' + format(m.left) +
      '), B (' + format(b) + '; ' + format(m.right) + ').' + (reveal ? ' Проведена секущая AB.' : ''));
    // Keep the existing equal-unit coordinate scale while trimming the wide margins on a phone.
    const [xmin, xmax, ymin, ymax] = model.viewport;
    const topLeft = Plot.toScreen(model, xmin, ymax), bottomRight = Plot.toScreen(model, xmax, ymin);
    svg.setAttribute('viewBox', [topLeft.x - 48, topLeft.y - 26,
      bottomRight.x - topLeft.x + 80, bottomRight.y - topLeft.y + 58].join(' '));
    const group = svg.querySelector('g[clip-path]');
    const pa = Plot.toScreen(model, a, m.left), pb = Plot.toScreen(model, b, m.right);
    if (Math.abs(pb.x - pa.x) < 32 && Math.abs(pb.y - pa.y) < 28) {
      const labelA = group.querySelector('[data-point] + text');
      labelA.setAttribute('x', pa.x - 9);
      labelA.setAttribute('text-anchor', 'end');
    }
    if (!reveal) return;
    const line = svg.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'line');
    const from = Plot.toScreen(model, xmin, m.left + m.rate * (xmin - a));
    const to = Plot.toScreen(model, xmax, m.left + m.rate * (xmax - a));
    for (const [name, value] of Object.entries({x1: from.x, y1: from.y, x2: to.x, y2: to.y,
      stroke: '#9a4722', 'stroke-width': 3, 'stroke-dasharray': '9 5', 'data-secant': 'true'})) {
      line.setAttribute(name, value);
    }
    group.insertBefore(line, group.querySelector('[data-point]'));
  }

  function drawSecant(svg, model, a, b) {
    graph(svg, model, a, b, true);
  }

  const tables = [
    {times: [2, 5, 8], temps: [12, 9, 3], rate: -1.5},
    {times: [3, 5, 7], temps: [4, 10, 14], rate: 2.5}
  ];
  const formulas = [
    {formula: 'g(x) = x² − 1', a: -2, b: 2, left: 3, middle: -1, rate: 0,
      choice: 'varies', conclusion: 'На концах одинаковые значения, а внутри функция меняется.'},
    {formula: 'g(x) = 4 − x²', a: -1, b: 3, left: 3, middle: 4, rate: -2,
      choice: 'turns', conclusion: 'Итоговое изменение отрицательно, а внутри отрезка функция меняет направление.'}
  ];
  const signs = [['down', 'Отрицательный'], ['flat', 'Нулевой'], ['up', 'Положительный']];
  const reasonTable = [
    ['uniform', 'За каждую минуту температура менялась на одно и то же число градусов.'],
    ['ends', 'Отношение изменений между крайними измерениями даёт среднее изменение за минуту.'],
    ['middle', 'Среднюю скорость задаёт температура в середине отрезка.']
  ];
  function blankTransfer() {
    return {rate: '', unit: '', reason: '', note: '', attempts: 0, passed: false};
  }
  function initial() {
    return {stage: 'explore', a: 0, b: 2, prediction: '', revealed: false, dx: '', dy: '', rate: '',
      solved: [], variant: 0, previous: null, table: blankTransfer(), formula: blankTransfer()};
  }
  function textValue(value, limit = 100) {
    return typeof value === 'string' ? value.slice(0, limit) : '';
  }
  function matchesNumber(raw, expected) {
    const value = Engine.parseNumber(raw);
    return value !== null && Engine.near(value, expected);
  }
  function transferCorrect(s, stage) {
    const answer = s[stage];
    if (!answer.note.trim()) return false;
    if (stage === 'table') return matchesNumber(answer.rate, tables[s.variant].rate) &&
      answer.unit === 'deg-per-min' && answer.reason === 'ends';
    return matchesNumber(answer.rate, formulas[s.variant].rate) && answer.reason === formulas[s.variant].choice;
  }
  function validPair(a, b) {
    return values.includes(a) && values.includes(b) && a < b;
  }
  function enough(s) {
    const rates = s.solved.map(([a, b]) => measure(task, a, b).rate);
    return rates.some(rate => rate < 0) && rates.includes(0);
  }
  function restoreTransfers(s, saved) {
    for (const stage of ['table', 'formula']) {
      const answer = saved[stage];
      if (!answer || typeof answer !== 'object') continue;
      for (const name of ['rate', 'unit', 'reason', 'note']) {
        s[stage][name] = textValue(answer[name], name === 'note' ? 800 : 100);
      }
      s[stage].attempts = Number.isSafeInteger(answer.attempts) && answer.attempts > 0 ? answer.attempts : 0;
      s[stage].passed = answer.passed === true && transferCorrect(s, stage);
    }
  }
  function restore(saved) {
    const s = initial();
    if (!saved || typeof saved !== 'object') return s;
    if (validPair(saved.a, saved.b)) {s.a = saved.a; s.b = saved.b;}
    for (const name of ['dx', 'dy', 'rate', 'prediction']) s[name] = textValue(saved[name]);
    const m = measure(task, s.a, s.b);
    s.revealed = saved.revealed === true && s.prediction === sign(m);
    if (Array.isArray(saved.solved)) s.solved = saved.solved.slice(0, 30).filter(pair =>
      Array.isArray(pair) && pair.length === 2 && validPair(pair[0], pair[1]));
    s.variant = saved.variant === 1 ? 1 : 0;
    restoreTransfers(s, saved);
    if (saved.previous && saved.previous.variant === 1 - s.variant) {
      const old = {variant: saved.previous.variant, table: blankTransfer(), formula: blankTransfer()};
      restoreTransfers(old, saved.previous);
      if (old.table.passed && old.formula.passed) s.previous = old;
    }
    if (enough(s) && ['table','formula','done'].includes(saved.stage)) {
      s.stage = saved.stage === 'table' || !s.table.passed ? 'table' :
        saved.stage === 'formula' || !s.formula.passed ? 'formula' : 'done';
    }
    return s;
  }

  function sign(m) {
    return m.rate < 0 ? 'down' : m.rate > 0 ? 'up' : 'flat';
  }
  function select(name, label, items, chosen, prompt = 'Выберите ответ') {
    return '<label>' + label + '<select data-rate="' + name + '">' +
      (prompt ? '<option value="">' + prompt + '</option>' : '') +
      items.map(([value, title]) => '<option value="' + value + '"' + (chosen === value ? ' selected' : '') +
        '>' + title + '</option>').join('') + '</select></label>';
  }
  function numberInput(name, label, value) {
    return '<label>' + label + '<input type="text" autocomplete="off" spellcheck="false" maxlength="100" data-rate="' +
      name + '" value="' + Engine.escapeHTML(value) + '"></label>';
  }
  function button(action, label, secondary = false) {
    return '<button type="button" data-action="' + action + '"' + (secondary ? ' class="secondary"' : '') + '>' + label + '</button>';
  }
  function intervalOptions(options) {
    return options.map(n => [n, format(n)]);
  }
  function worked() {
    return '<details class="rate-worked"><summary>Два разбора и переход к касательной</summary>' +
      '<p><b>Куда наклонена прямая?</b> Пусть f(x) = 3x + 2. При переходе от x = 1 к x = 3 значение ' +
      'растёт с 5 до 11. За две единицы x прирост равен 6, за одну в среднем — 3. ' +
      'Через любые две точки этой прямой проходит она сама, и отношение всегда равно коэффициенту 3.</p>' +
      '<p><b>Что означает горизонтальная секущая?</b> Для f(x) = x² на [−1; 1] оба значения равны 1. ' +
      'Получаем Δx = 2, Δy = 0 и k = 0. Внутри отрезка f(0) = 0. Равенство высот на концах совместимо с убыванием и возрастанием внутри.</p>' +
      '<p><b>Как из секущей получается касательная?</b> На нашей параболе оставьте A при x = 2. ' +
      'Сдвигайте B от 3 к 2,5 и к 2,25. Наклоны равны 1, 0,5 и 0,25. При B всё ближе к A ' +
      'наклон стремится к нулю. Слева он также стремится к нулю. Касательная в вершине горизонтальна. ' +
      'Предел наклонов секущих, если он существует, называют производной в точке. При совпавших точках делить пришлось бы на ноль.</p></details>';
  }
  function explore(s) {
    const m = measure(task, s.a, s.b);
    const grid = '<div class="rate-endpoints">' +
      select('a','Левый конец a', intervalOptions(values.slice(0, -1)), s.a, '') +
      select('b','Правый конец b', intervalOptions(values.filter(x => x > s.a)), s.b, '') + '</div>';
    const caption = 'A (' + format(s.a) + '; ' + format(m.left) + ') и B (' + format(s.b) + '; ' + format(m.right) + ').';
    let form = '<h4>Какой будет знак наклона?</h4><p>Мысленно проведите прямую через A и B. Проследите за ней слева направо.</p>' +
      select('prediction','Мой прогноз', signs, s.prediction) + button('predict','Проверить прогноз');
    if (s.revealed) form = '<h4>На сколько изменился y за единицу x?</h4>' +
      '<p>Секущая — прямая через две выбранные точки графика. Сначала найдите горизонтальный шаг Δx = b − a, ' +
      'затем изменение высоты Δy = f(b) − f(a). Наклон секущей равен средней скорости изменения функции k = Δy / Δx.</p>' +
      '<div class="rate-numbers">' + numberInput('dx','Δx', s.dx) + numberInput('dy','Δy', s.dy) +
      numberInput('rate','k', s.rate) + '</div>' + button('check','Проверить расчёт');
    const records = s.solved.map(([a,b]) => {
      const r = measure(task,a,b);
      return '<li>' + interval(a,b) + ' · Δx = ' + format(r.dx) + ', Δy = ' + format(r.dy) + ', k = ' + format(r.rate) + '</li>';
    }).join('');
    const ready = enough(s);
    return '<h3 tabindex="-1">Прямая через две точки параболы</h3>' +
      '<p>На графике C3 величина y = (x − 2)² + 1 всюду положительна. Может ли её средняя скорость оказаться отрицательной или нулевой?</p>' +
      '<div class="rate-layout"><div>' + grid +
      '<figure><svg data-rate-graph></svg><figcaption>' + caption + ' По горизонтали — x, по вертикали — y. Шаг сетки по каждой оси равен 1.' +
      (s.revealed ? ' Синяя кривая — парабола, штриховая прямая — секущая AB.' : '') +
      '</figcaption></figure></div><div>' + form + '</div></div>' +
      '<div data-rate-feedback role="status" tabindex="-1"></div>' +
      (records ? '<h4>Проверенные отрезки</h4><ul class="rate-records">' + records + '</ul>' : '') +
      '<p>Сравните отрезки [0; 2] и [0; 4]. На каждом сделайте прогноз и проверьте расчёт.</p>' +
      '<p>Для исследования выберите [2; 3], а затем [3; 4]. На обоих участках график идёт вверх. Где y меняется быстрее и как это видно по двум наклонам?</p>' +
      (ready ? button('transfer',s.formula.passed ? 'Посмотреть результат знакомых задач' : 'Перейти к самостоятельным задачам') : '') + worked();
  }

  function tableHtml(t) {
    return '<table><caption>Показания термометра</caption><tbody><tr><th scope="row">Время, мин</th>' +
      t.times.map(x => '<td>' + x + '</td>').join('') + '</tr><tr><th scope="row">Температура, °C</th>' +
      t.temps.map(x => '<td>' + x + '</td>').join('') + '</tr></tbody></table>';
  }
  function example(s, stage) {
    if (stage === 'table') {
      const t = tables[s.variant];
      return '(' + t.temps[2] + ' − ' + t.temps[0] + ') / (' + t.times[2] + ' − ' + t.times[0] +
        ') = ' + format(t.rate) + ' °C/мин. Это среднее изменение между первым и последним измерениями.';
    }
    const f = formulas[s.variant];
    return 'g(' + format(f.a) + ') = ' + f.left + ', g(' + format(f.b) + ') = ' +
      format(f.left + (f.b-f.a)*f.rate) + ', k = ' + format(f.rate) + '. Внутри отрезка g(0) = ' +
      format(f.middle) + '. ' + f.conclusion;
  }
  function transfer(s) {
    const stage = s.stage, answer = s[stage], table = stage === 'table', t = tables[s.variant], f = formulas[s.variant];
    let html = '<h3 tabindex="-1">' + (table ? 'Самостоятельно · Показания термометра' : 'Самостоятельно · Исследование по формуле') + '</h3>';
    if (table) html += tableHtml(t) + '<p>Найдите среднюю скорость изменения температуры от момента t = ' +
      t.times[0] + ' мин до момента t = ' + t.times[2] + ' мин. Укажите единицу и объясните, что можно установить по измерениям.</p>';
    else html += '<p>Дана функция <b>' + f.formula + '</b>. Найдите среднюю скорость её изменения на ' +
      interval(f.a, f.b) + '. Опишите поведение функции внутри отрезка. Проверьте вывод, подставив ещё одно значение x.</p>';
    if (answer.passed) {
      return html + '<p class="rate-success">Число, выбор вывода' + (table ? ' и единица' : '') + ' проверены.</p>' +
        '<p><b>Ваша запись</b><br>' + Engine.escapeHTML(answer.note) + '</p><p><b>Сверьте своё объяснение</b><br>' +
        example(s, stage) + '</p>' + button('next', table ? 'Перейти к задаче по формуле' : 'Подвести итог');
    }
    html += '<label>Моя запись решения<textarea rows="3" maxlength="800" data-rate="note">' +
      Engine.escapeHTML(answer.note) + '</textarea></label>' + '<div class="rate-answer-row">' +
      numberInput('rate', 'Средняя скорость', answer.rate);
    if (table) html += select('unit', 'Единица измерения', [['min-per-deg','мин/°C'],['deg','°C'],['deg-per-min','°C/мин']], answer.unit);
    html += '</div>' + select('reason', 'Какой вывод обоснован?', table ? reasonTable : [
      ['constant', 'На всём отрезке функция постоянна.'],
      ['decreases', 'На всём отрезке функция строго убывает.'],
      [f.choice, f.conclusion]
    ], answer.reason) + button('check', 'Проверить задачу') + '<div data-rate-feedback role="status" tabindex="-1"></div>';
    return html;
  }
  function results(s) {
    const first = [s.table, s.formula].filter(item => item.attempts === 1).length;
    return '<p>С первой проверки верно выполнено ' + first + ' из 2. Автоматически проверены расчёт, ' +
      'единица скорости и выбор вывода. Свою запись сравните с образцом.</p>' +
      ['table','formula'].map(stage => '<details><summary>' + (stage === 'table' ? 'Задача по таблице' : 'Задача по формуле') +
        '</summary><p>' + Engine.escapeHTML(s[stage].note) + '</p><p>' + example(s,stage) + '</p></details>').join('');
  }
  function finished(s) {
    return '<h3 tabindex="-1">Обе самостоятельные задачи решены</h3>' + results(s) +
      (s.previous ? '<details><summary>Предыдущее прохождение</summary>' + results(s.previous) + '</details>' :
        '<p>Для повторной проверки через несколько дней используйте другой вариант с новыми данными.</p>' +
        button('variant', 'Решить другой вариант')) + ' ' + button('explore','Вернуться к исследованию',true);
  }

  function mount(container, key) {
    if (container.classList.contains('rate-workshop')) return;
    const win = container.ownerDocument.defaultView;
    if (win.CollegeFunctionsBoardMode || new URLSearchParams(win.location.search).get('board') === '1') return;
    container.classList.add('rate-workshop');
    let s = initial(), storageOK = true;
    try { s = restore(JSON.parse(win.localStorage.getItem(key))); } catch (_) { /* An unreadable draft starts a fresh exercise. */ }
    function save() {
      try { win.localStorage.setItem(key, JSON.stringify(s)); } catch (_) { storageOK = false; }
      const notice = container.querySelector('[data-save-note]');
      if (notice) notice.textContent = storageOK ? 'Черновик хранится в этом браузере.' : 'Черновик доступен до закрытия страницы.';
    }
    function render(focus) {
      container.innerHTML = (s.stage === 'explore' ? explore(s) : s.stage === 'done' ? finished(s) : transfer(s)) +
        '<div class="rate-footer"><small data-save-note></small>' + button('reset', 'Начать блок заново', true) + '</div>';
      if (s.stage === 'explore') graph(container.querySelector('svg'),task,s.a,s.b,s.revealed);
      save();
      if (focus) container.querySelector(focus)?.focus();
    }
    function feedback(message, good = false) {
      const el = container.querySelector('[data-rate-feedback]');
      el.textContent = message;
      el.className = good ? 'rate-success' : 'rate-message';
      el.focus();
    }
    function learnCheck() {
      const m = measure(task,s.a,s.b);
      if (!matchesNumber(s.dx,m.dx)) return feedback('Посмотрите на горизонтальную ось. Вычтите x точки A из x точки B.');
      if (!matchesNumber(s.dy,m.dy)) return feedback('Сравните высоты. Начните с y точки B и вычтите y точки A. Сохраните знак результата.');
      if (!matchesNumber(s.rate,m.rate)) return feedback('Сколько единиц x понадобилось для этого изменения y? Разделите изменение высоты на горизонтальный шаг.');
      if (!s.solved.some(([a,b]) => a === s.a && b === s.b)) s.solved.push([s.a,s.b]);
      render();
      let interpretation = m.rate < 0 ? 'Конечная высота меньше начальной, хотя обе точки выше оси x.' :
        m.rate > 0 ? 'Конечная высота больше начальной.' : 'Высоты на концах равны. Между ними парабола проходит через вершину и меняет направление.';
      feedback('Верно. В среднем на единицу x изменение y равно ' + format(m.rate) + '. ' + interpretation, true);
    }
    function controlCheck() {
      const stage = s.stage, answer = s[stage];
      if (!answer.rate.trim() || !answer.note.trim() || !answer.reason || (stage === 'table' && !answer.unit)) {
        return feedback('Запишите решение и заполните все поля.');
      }
      answer.attempts++;
      if (!transferCorrect(s, stage)) {
        save();
        return feedback('Пока есть ошибка. Проверьте расчёт и выбранные ответы.');
      }
      answer.passed = true;
      render('h3');
    }
    container.addEventListener('input', event => {
      const field = event.target.dataset.rate;
      if (!['prediction','dx','dy','rate','reason','note','unit'].includes(field)) return;
      const draft = s.stage === 'explore' ? s : s[s.stage];
      draft[field] = event.target.value;
      const status = container.querySelector('[data-rate-feedback]');
      if (status) {status.textContent = ''; status.className = '';}
      save();
    });
    container.addEventListener('change', event => {
      const field = event.target.dataset.rate;
      if (field === 'a' || field === 'b') {
        s[field] = Number(event.target.value);
        if (s.a >= s.b) s.b = values.find(value => value > s.a);
        Object.assign(s, {prediction: '', revealed: false, dx: '', dy: '', rate: ''});
        render('[data-rate="' + field + '"]');
      } else if (['prediction','unit','reason'].includes(field)) {
        (s.stage === 'explore' ? s : s[s.stage])[field] = event.target.value;
        save();
      }
    });
    container.addEventListener('click', event => {
      const action = event.target.closest('button[data-action]')?.dataset.action;
      if (!action) return;
      if (action === 'reset') {
        if (!win.confirm('Стереть черновик и результаты только блока о средней скорости?')) return;
        s = initial(); render('h3');
      } else if (action === 'predict') {
        if (s.prediction !== sign(measure(task,s.a,s.b))) {
          feedback(s.prediction ? 'Сравните y точки B с y точки A. Что происходит с высотой при движении вправо?' : 'Сначала выберите знак.');
        } else {
          s.revealed = true; render('[data-rate="dx"]');
        }
      } else if (action === 'check') {
        if (s.stage === 'explore') learnCheck(); else controlCheck();
      } else if (action === 'transfer' && enough(s)) {
        s.stage = s.formula.passed ? 'done' : 'table'; render('h3');
      } else if (action === 'explore') {
        s.stage = 'explore'; render('h3');
      } else if (action === 'next' && s[s.stage].passed) {
        s.stage = s.stage === 'table' ? 'formula' : 'done'; render('h3');
      } else if (action === 'variant' && !s.previous) {
        s.previous = {variant: s.variant, table: s.table, formula: s.formula};
        s.variant = 1 - s.variant; s.stage = 'table';
        s.table = blankTransfer(); s.formula = blankTransfer();
        render('h3');
      }
    });
    render();
  }
  return {measure, drawSecant, mount};
});

(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ProfilePartTwoEquationLabs = api;
})(globalThis, function () {
  'use strict';

  const prefix = 'mathexam.profilePartTwoLab.v1.';
  const targets = {
    'interval-number-line': [['5/6', true], ['5/6', false], ['3', true], ['3', false]],
    'branch-number-line': [['factor'], ['divide']],
    'exponential-point': [['-2'], ['0'], ['2']],
    'argument-table': [['0'], ['4']],
    'candidate-comparison': [['-1', 'squared'], ['-1', 'original'], ['2', 'original']],
    'line-with-hole': [['2'], ['3'], ['4']]
  };
  const possible = [{ id: 'yes', label: 'Допустимо' }, { id: 'no', label: 'Недопустимо' }];
  const verifications = {
    'exponential-point': [
      { prompt: 'Распределите два значения t по допустимости.', fields: [
        { id: 'positive-t', label: 'Кандидат t = 2', choices: possible, answer: 'yes' },
        { id: 'negative-t', label: 'Кандидат t = −1', choices: possible, answer: 'no' }
      ] },
      { prompt: 'Сделайте обратную замену для допустимого кандидата t = 2.', fields: [
        { id: 'inverse-x', label: 'Соответствующее значение x', answer: '1' }
      ] }
    ],
    'argument-table': [{ prompt: 'Пересеките два ограничения перед объединением логарифмов.', fields: [
      { id: 'log-domain', label: 'Когда оба аргумента положительны?', answer: 'right', choices: [
        { id: 'right', label: 'x > 3' }, { id: 'left', label: 'x < 1' }, { id: 'both', label: 'x < 1 или x > 3' }
      ] }
    ] }]
  };
  const esc = value => String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
  const minus = value => String(value).replace(/-/g, '−');
  const copy = value => JSON.parse(JSON.stringify(value));
  const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  const object = value => !!value && typeof value === 'object' && !Array.isArray(value);
  const fieldsFor = transfer => transfer.fields || [{ id: 'answer', label: 'Ответ' }];
  const stagesFor = lab => verifications[lab.view.kind] || [];
  const maxDraft = 120;

  function fraction(raw) {
    const [n, d = '1'] = String(raw).split('/');
    return [BigInt(n), BigInt(d)];
  }
  function order(left, right) {
    const [n, d] = fraction(left), [m, e] = fraction(right);
    const difference = n * e - m * d;
    return difference < 0n ? -1 : difference > 0n ? 1 : 0;
  }
  function numeric(raw) {
    const [n, d] = fraction(raw);
    return Number(n) / Number(d);
  }
  function pi(raw) {
    const [n, d] = fraction(raw);
    if (n === 0n) return '0';
    const coefficient = n === 1n ? '' : n === -1n ? '−' : minus(n);
    return coefficient + 'π' + (d === 1n ? '' : '/' + d);
  }
  function options(control) {
    return control.choices?.map(choice => typeof choice === 'string' ? { value: choice, label: minus(choice) } : choice);
  }
  function validValue(control, value) {
    return options(control)?.some(choice => choice.value === value) ?? typeof value === 'boolean';
  }
  function keyFor(lab, values) {
    return JSON.stringify(lab.view.controls.map(control => values[control.id]));
  }
  function checkpoints(lab) {
    return targets[lab.view.kind].map(values => JSON.stringify(values));
  }
  function initial(lab) {
    return Object.fromEntries(lab.view.controls.map(control => [control.id, control.initial]));
  }
  function controlsFor(lab, values = {}) {
    return Object.fromEntries(lab.view.controls.map(control => [control.id,
      validValue(control, values[control.id]) ? values[control.id] : control.initial]));
  }
  function explore(lab, values) {
    const view = lab.view, controls = controlsFor(lab, values);
    switch (view.kind) {
      case 'interval-number-line': {
        const { rightPi, closed } = controls;
        const included = view.points.filter(point => order(point, rightPi) < 0 || closed && order(point, rightPi) === 0);
        return { controls, included, boundaryRoot: view.points.some(point => order(point, rightPi) === 0) };
      }
      case 'branch-number-line': {
        const divided = controls.operation === 'divide';
        return { controls, included: divided ? view.after : view.before, excluded: divided ? view.lost : [] };
      }
      case 'exponential-point':
      case 'line-with-hole':
        return { controls, point: view.points.find(([x]) => x === controls.x) };
      case 'argument-table': {
        const row = view.rows.find(([x]) => x === controls.x);
        const nonpositive = [1, 2].filter(index => order(row[index], '0') <= 0).map(index => view.columns[index]);
        return { controls, row, nonpositive };
      }
      case 'candidate-comparison': {
        const row = view.rows.find(item => item.x === controls.x);
        return { controls, row, equality: row[controls.equation] };
      }
    }
  }

  const line = (x1, y1, x2, y2, color = '#54776f', width = 2) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}"/>`;
  const label = (x, y, text, color = '#193b33') =>
    `<text x="${x}" y="${y}" text-anchor="middle" fill="${color}" font-family="system-ui,sans-serif" font-size="13">${esc(text)}</text>`;
  const dot = (x, y, filled, color = '#176850', radius = 5) =>
    `<circle cx="${x}" cy="${y}" r="${radius}" fill="${filled ? color : '#fff'}" stroke="${color}" stroke-width="2"/>`;
  const dash = (x, y1, y2) => `<path d="M${x},${y1}V${y2}" stroke="#9b4918" stroke-width="2" stroke-dasharray="4 3"/>`;
  const svg = (description, drawing, height) =>
    `<svg viewBox="0 0 360 ${height}" role="img" aria-label="${esc(description)}" style="display:block;width:100%;max-width:560px;height:auto"><title>${esc(description)}</title>${drawing}</svg>`;

  function intervalScene(lab, result) {
    const { rightPi, closed } = result.controls, right = numeric(rightPi);
    const x = value => 28 + value * 99;
    const included = result.included.map(pi).join('; ') || 'нет';
    const interval = '[0; ' + pi(rightPi) + (closed ? ']' : ')');
    const boundary = result.boundaryRoot ? 'Правая граница совпадает с корнем.' : 'Правая граница не совпадает с корнем.';
    const summary = `Промежуток ${interval}. Вошли углы: ${included}. Число корней: ${result.included.length}. ${boundary} ` +
      'Углы π/6 и 13π/6 задают один луч. Углы 5π/6 и 17π/6 задают другой.';
    const circleX = 91, circleY = 84, radius = 48;
    const ray = angle => [circleX + radius * Math.cos(angle * Math.PI), circleY - radius * Math.sin(angle * Math.PI)];
    const circle = line(30, circleY, 152, circleY) + line(circleX, 25, circleX, 143) +
      `<circle cx="${circleX}" cy="${circleY}" r="${radius}" fill="none" stroke="#54776f" stroke-width="2"/>` +
      line(39, circleY - radius / 2, 144, circleY - radius / 2, '#176850') +
      [1/6, 5/6].map(angle => {
        const [endX, endY] = ray(angle);
        return line(circleX, circleY, endX, endY, '#176850') + dot(endX, endY, true);
      }).join('') + line(circleX, circleY, ...ray(right % 2), '#9b4918', 3) +
      label(234, 41, 'Луч правой границы', '#9b4918') + label(234, 63, pi(rightPi), '#9b4918') +
      label(233, 94, 'Один луч: π/6 и 13π/6') + label(238, 116, 'Другой: 5π/6 и 17π/6');
    const plots = lab.view.points.map(point =>
      dot(x(numeric(point)), 225, result.included.includes(point), result.included.includes(point) ? '#176850' : '#6b817b') +
      label(x(numeric(point)), 253, pi(point))).join('');
    const drawing = `<g data-unit-circle>${circle}</g>` + label(180, 164, interval) +
      `<g data-angle-line>${line(x(0), 225, 338, 225) + line(x(0), 225, x(right), 225, '#176850', 4) + plots +
      dot(x(0), 225, true) + label(x(0), 274, '0') + dash(x(right), 179, 216) +
      `<g data-boundary="${closed ? 'closed' : 'open'}">${dot(x(right), 225, closed, '#9b4918', 8)}</g>`}</g>`;
    return { ...result, summary, html: svg(summary, drawing, 285) };
  }
  function branchScene(lab, result) {
    const x = value => 28 + numeric(value) * 149;
    const active = result.included.map(pi).join('; ');
    const excluded = result.excluded.map(pi).join('; ') || 'нет';
    const summary = `Остались: ${active}. Число корней: ${result.included.length}. Исключённые углы: ${excluded}. ` +
      'Углы 0, π, 2π даёт sin x = 0. Углы 2π/3 и 4π/3 даёт 2 cos x + 1 = 0.';
    const points = lab.view.before.map(value => {
      const kept = result.included.includes(value);
      return dot(x(value), 68, kept, kept ? '#176850' : '#9b4918') + label(x(value), 96, pi(value));
    }).join('');
    return { ...result, summary, html: svg(summary, label(180, 23, 'Отрезок [0; 2π]') + line(28, 68, 340, 68) + points, 115) };
  }
  function exponentialScene(lab, result) {
    const [value, exponent] = result.point;
    const x = value => 180 + 54 * value, y = value => 170 - 31 * value;
    const coordinates = Array.from({ length: 45 }, (_, i) => -2.2 + i / 10).map(t =>
      x(t) + ',' + y(2 ** t)).join(' ');
    const summary = `При x = ${minus(value)} получаем t = ${exponent}. Значение t строго выше нуля.`;
    const curve = `<polyline points="${coordinates}" fill="none" stroke="#176850" stroke-width="2.5"/>`;
    const drawing = line(25, y(0), 334, y(0)) + line(x(0), 27, x(0), 180) + curve +
      dot(x(numeric(value)), y(numeric(exponent)), true, '#9b4918', 6) + label(33, 192, 't = 0') +
      label(335, 192, 'x') + label(x(0) - 13, 33, 't') + label(180, 18, `(${minus(value)}; ${exponent})`);
    return { ...result, summary, html: svg(summary, drawing, 204) };
  }
  function table(rows, caption) {
    return `<table style="width:100%"><caption>${esc(caption)}</caption><tbody>${rows.map(([key, value]) =>
      `<tr><th scope="row">${esc(key)}</th><td>${esc(value)}</td></tr>`).join('')}</tbody></table>`;
  }
  function argumentScene(lab, result) {
    const { row, nonpositive } = result;
    const sign = value => order(value, '0') > 0 ? 'положительный' : order(value, '0') === 0 ? 'нулевой' : 'отрицательный';
    const permitted = row[4] !== null ? `log₂ ${row[1]} + log₂ ${row[2]}` : null;
    const summary = `При x = ${minus(row[0])} произведение равно ${minus(row[3])}. ` +
      (nonpositive.length ? `Сумма логарифмов не определена. Неположительные аргументы: ${nonpositive.join('; ')}.` : `Оба аргумента положительны. Исходная сумма: ${permitted}.`);
    const values = [minus(row[0]), `${minus(row[1])} (${sign(row[1])})`, `${minus(row[2])} (${sign(row[2])})`,
      minus(row[3]), permitted ?? 'не определена'];
    return { ...result, summary, html: table(lab.view.columns.map((column, index) => [column, values[index]]), 'Аргументы и сумма') };
  }
  function candidateScene(lab, result) {
    const [left, right, equal] = result.equality;
    const heading = result.controls.equation === 'original' ? 'Исходное равенство' : 'После возведения в квадрат';
    const relation = `${minus(left)} ${equal ? '=' : '≠'} ${minus(right)}`;
    const summary = `При x = ${minus(result.row.x)} подкоренное выражение равно ${result.row.radicand} и допустимо. ${heading}: ${relation}. ` +
      (equal ? 'Равенство выполняется.' : 'Равенство не выполняется.') +
      ' Подкоренное выражение определено при x ≥ −2. Для исходного равенства правая часть должна быть неотрицательной, то есть x ≥ 0.';
    return { ...result, summary, html: table([['x', minus(result.row.x)], ['Подкоренное выражение', result.row.radicand],
      ['Левая часть', minus(left)], ['Правая часть', minus(right)], ['Результат', relation]], heading) };
  }
  function holeScene(lab, result) {
    const [value, answer] = result.point;
    const [holeX, holeY] = lab.view.hole.map(numeric);
    const x = value => 151 + 24 * value, y = value => 177 - 18 * value;
    const summary = answer === null ? `При x = ${value} знаменатель равен нулю. Исходная дробь не определена. На прямой точка (${holeX}; ${holeY}) исключена.` :
      `При x = ${minus(value)} знаменатель не равен нулю. Значение исходной дроби равно ${answer}.`;
    const drawing = label(180, 21, 'y = x + 3, x ≠ 3') + line(35, y(0), 316, y(0)) + line(x(0), 35, x(0), 192) +
      line(x(-4), y(-1), x(5), y(8), '#176850', 2.5) +
      (answer === null ? '' : dot(x(numeric(value)), y(numeric(answer)), true, '#176850', 6)) +
      `<g data-excluded-point>${dot(x(holeX), y(holeY), false, '#9b4918', answer === null ? 8 : 6)}</g>` +
      label(x(holeX) + 34, y(holeY) + 18, '(3; 6)') + label(323, y(0) + 15, 'x') + label(x(0) - 13, 40, 'y');
    return { ...result, summary, html: svg(summary, drawing, 205) };
  }
  const scenes = {
    'interval-number-line': intervalScene, 'branch-number-line': branchScene, 'exponential-point': exponentialScene,
    'argument-table': argumentScene, 'candidate-comparison': candidateScene, 'line-with-hole': holeScene
  };
  function scene(lab, values) { return scenes[lab.view.kind](lab, explore(lab, values)); }

  function checkValue(parser, value, { choices, answer, type = 'finite-rational', scalar = true }) {
    if (choices) return { recognized: choices.some(choice => choice.id === value), correct: answer === value };
    const parsed = parser.parse(value, type);
    if (scalar && parsed.recognized && (parsed.values.length !== 1 || parsed.duplicates)) return { recognized: false, correct: false };
    return parser.compare(parsed, { finite: scalar ? [answer] : answer });
  }
  function checkFields(fields, input, parser) {
    const result = fields.map(field => checkValue(parser, input[field.id], field));
    const invalid = fields.filter((_, index) => !result[index].recognized).map(field => field.id);
    return { recognized: !invalid.length, correct: !invalid.length && result.every(field => field.correct), invalid };
  }
  function transferFields(transfer) {
    return transfer.fields || fieldsFor(transfer).map(field =>
      ({ ...field, choices: transfer.choices, answer: transfer.answer, type: transfer.type, scalar: false }));
  }
  function evaluateTransfer(lab, input, parser) { return checkFields(transferFields(lab.transfer), input, parser); }

  function canCompare(lab, record) { return checkpoints(lab).every(key => record.visited.includes(key)); }
  function visit(lab, record) {
    const key = keyFor(lab, record.values);
    if (checkpoints(lab).includes(key) && !record.visited.includes(key)) record.visited.push(key);
  }
  function createStore(lab, storage, locks) {
    const key = prefix + lab.lessonId;
    const stageFields = stagesFor(lab).flatMap(stage => stage.fields), finalFields = fieldsFor(lab.transfer);
    const fields = finalFields.concat(stageFields);
    const empty = () => ({ version: 1, values: initial(lab), prediction: null, visited: [], verified: 0, compared: false,
      drafts: Object.fromEntries(fields.map(field => [field.id, ''])), first: null, last: null });
    const validDraft = (drafts, fields) => object(drafts) && fields.every(field =>
      typeof drafts[field.id] === 'string' && drafts[field.id].length <= maxDraft);
    const validAttempt = attempt => attempt === null || object(attempt) &&
      typeof attempt.correct === 'boolean' && validDraft(attempt.answers, finalFields);
    function valid(record) {
      const goals = checkpoints(lab);
      return object(record) && record.version === 1 && object(record.values) && lab.view.controls.every(control =>
        own(record.values, control.id) && validValue(control, record.values[control.id])) &&
        (record.prediction === null || lab.prediction.choices.some(choice => choice.id === record.prediction)) &&
        Array.isArray(record.visited) && record.visited.length <= goals.length && new Set(record.visited).size === record.visited.length &&
        record.visited.every(key => goals.includes(key)) && Number.isInteger(record.verified) && record.verified >= 0 &&
        record.verified <= stagesFor(lab).length && (!record.verified || canCompare(lab, record)) && typeof record.compared === 'boolean' &&
        (!record.compared || record.prediction !== null && canCompare(lab, record) && record.verified === stagesFor(lab).length) &&
        (!record.visited.length || record.prediction !== null) && validDraft(record.drafts, fields) && validAttempt(record.first) && validAttempt(record.last) &&
        (!!record.first === !!record.last) && (!record.last || record.compared);
    }
    let saved = empty(), warning = '', blocked = !storage, pending = Promise.resolve();
    if (blocked) warning = 'Это исследование сохраняется только до закрытия страницы.';
    function read() {
      if (!blocked) {
        try {
          const raw = storage.getItem(key);
          const current = raw === null ? empty() : JSON.parse(raw);
          if (!valid(current)) throw new Error('Invalid investigation');
          saved = current;
        } catch (_) {
          blocked = true;
          warning = 'Прежняя запись исследования не читается. Она оставлена без изменений.';
        }
      }
      return copy(saved);
    }
    function update(change) {
      function commit() {
        const current = read();
        if (!change(current)) return current;
        if (!valid(current)) throw new Error('Invalid investigation update');
        saved = current;
        if (!blocked) {
          try { storage.setItem(key, JSON.stringify(saved)); }
          catch (_) {
            blocked = true;
            warning = 'Не удалось сохранить исследование. Работа остаётся до закрытия страницы.';
          }
        }
        return copy(saved);
      }
      const next = pending.then(() => !blocked && locks?.request ? locks.request(key, commit) : commit());
      pending = next.catch(() => {});
      return next;
    }
    return { key, read, update, flush: () => pending, get warning() { return warning; } };
  }

  let nextId = 0;
  function responseFor(field, sectionId) {
    const id = `${sectionId}-${field.id}`;
    const label = esc(field.label), marker = `id="${id}" data-response="${esc(field.id)}"`;
    if (field.choices) return `<label for="${id}">${label}</label><select ${marker}><option value="">Выберите ответ</option>${field.choices.map(choice =>
      `<option value="${esc(choice.id)}">${esc(choice.label)}</option>`).join('')}</select>`;
    return `<label class="field" for="${id}"><span>${label}</span><input type="text" ${marker} inputmode="text" maxlength="${maxDraft}" autocomplete="off"></label>`;
  }
  function markup(lab, id) {
    const controls = lab.view.controls.map(control => {
      const key = `${id}-${control.id}`;
      const choices = options(control);
      return choices ? `<label for="${key}">${esc(control.label)}</label><select id="${key}" data-control="${esc(control.id)}">${choices.map(choice =>
        `<option value="${esc(choice.value)}">${esc(choice.label)}</option>`).join('')}</select>` :
        `<label style="min-height:44px"><input type="checkbox" id="${key}" data-control="${esc(control.id)}"> ${esc(control.label)}</label>`;
    }).join('');
    const transfer = lab.transfer;
    const instruction = transfer.type === 'finite-pi' ? '<p class="caption">Записывайте углы с π. Если корней нет, введите «нет корней».</p>' : '';
    const response = transferFields(transfer).map(field => responseFor(field, id)).join('');
    const checks = stagesFor(lab).map((stage, index) => `<form data-lab-verification="${index}" hidden><p>${esc(stage.prompt)}</p>
      ${stage.fields.map(field => responseFor(field, id)).join('')}
      <button type="submit">Проверить</button><p data-lab-verification-status role="status"></p></form>`).join('');
    return `<section class="part2-lab" aria-labelledby="${id}-title">
      <h3 id="${id}-title">${esc(lab.title)}</h3><p>${esc(lab.formula)}</p>
      <p class="caption">Результат исследования сохраняется отдельно от решения задач.</p>
      <form data-lab-prediction><h4>1. Предскажите</h4><label for="${id}-prediction">${esc(lab.prediction.question)}</label>
        <select id="${id}-prediction"><option value="">Выберите прогноз</option>${lab.prediction.choices.map(choice =>
        `<option value="${esc(choice.id)}">${esc(choice.label)}</option>`).join('')}</select>
        <button type="submit">Сохранить прогноз</button><p data-lab-prediction-status role="status"></p>
      </form>
      <section data-lab-observation hidden><h4>2. Измените модель</h4><p>${esc(lab.observe)}</p>${controls}
        <div data-lab-model></div><p data-lab-summary role="status"></p>
        <p data-lab-visits class="caption" role="status"></p>
      </section>
      <section data-lab-comparison hidden><h4>3. Сравните с прогнозом</h4>${checks}<button type="button" data-lab-compare>Сравнить с прогнозом</button>
        <div data-lab-rule hidden><p data-lab-prediction-result role="status"></p><p>${esc(lab.rule)}</p></div>
      </section>
      <form data-lab-transfer hidden><h4>4. Проверьте себя в другой задаче</h4><p>${esc(transfer.prompt)}</p>${instruction}${response}
        <button type="submit">Проверить ответ</button><p data-lab-transfer-status role="status"></p>
        <p data-lab-transfer-first class="caption"></p>
      </form>
      <p data-lab-warning role="status"></p>
    </section>`;
  }

  function mount(container, lab, parser, settings) {
    const window = container.ownerDocument.defaultView;
    let storage = settings.storage;
    if (storage === undefined) try { storage = window.localStorage; } catch (_) { storage = null; }
    const locks = settings.locks === undefined ? window.navigator.locks : settings.locks;
    const store = createStore(lab, storage, locks);
    const id = 'part2-equation-lab-' + ++nextId;
    container.innerHTML = markup(lab, id);
    const $ = selector => container.querySelector(selector);
    const prediction = $('#' + id + '-prediction'), predictForm = $('[data-lab-prediction]');
    const compareButton = $('[data-lab-compare]'), transfer = $('[data-lab-transfer]');
    const controls = [...container.querySelectorAll('[data-control]')];
    const fields = [...transfer.querySelectorAll('[data-response]')];
    const inputs = [...container.querySelectorAll('[data-response]')];
    const checkForms = [...container.querySelectorAll('[data-lab-verification]')];
    let active = true, queued = 0, lastView = '', format = [], checkFeedback = null;
    function render(record) {
      if (!active) return;
      const actual = lab.prediction.choices.find(choice => choice.id === record.prediction);
      prediction.disabled = !!actual;
      predictForm.querySelector('button').disabled = !!actual;
      if (actual) prediction.value = actual.id;
      $('[data-lab-prediction-status]').textContent = actual ? 'Ваш первый прогноз: ' + actual.label + '.' : '';
      $('[data-lab-observation]').hidden = !actual;
      $('[data-lab-comparison]').hidden = !actual;
      const visited = canCompare(lab, record);
      compareButton.disabled = !actual || !visited || record.verified !== checkForms.length;
      compareButton.hidden = record.compared;
      $('[data-lab-rule]').hidden = !record.compared;
      if (record.compared) {
        const answer = lab.prediction.choices.find(choice => choice.id === lab.prediction.correct).label;
        $('[data-lab-prediction-result]').textContent = record.prediction === lab.prediction.correct ?
          'Прогноз подтвердился. Результат: ' + answer + '.' : 'Модель дала другой результат: ' + answer + '.';
      }
      if (actual) {
        const viewKey = keyFor(lab, record.values);
        if (viewKey !== lastView) {
          const shown = scene(lab, record.values);
          $('[data-lab-model]').innerHTML = shown.html;
          $('[data-lab-summary]').textContent = shown.summary;
          lastView = viewKey;
        }
        for (const input of controls) {
          const value = record.values[input.dataset.control];
          if (input.type === 'checkbox') input.checked = value;
          else if (input.value !== value) input.value = value;
        }
        $('[data-lab-visits]').textContent = `Проверено положений из инструкции: ${record.visited.length} из ${checkpoints(lab).length}.`;
      }
      checkForms.forEach((form, index) => {
        const complete = index < record.verified;
        form.hidden = !actual || !visited || index > record.verified;
        for (const input of form.querySelectorAll('select,input,button')) input.disabled = complete;
        form.querySelector('[data-lab-verification-status]').textContent = complete ? 'Верно.' :
          checkFeedback?.stage === index ? checkFeedback.message : '';
      });
      transfer.hidden = !record.compared;
      for (const input of inputs) {
        const value = record.drafts[input.dataset.response];
        if (input.value !== value) input.value = value;
        input.setAttribute('aria-invalid', String(format.includes(input.dataset.response) ||
          !!checkFeedback?.invalid.includes(input.dataset.response)));
      }
      $('[data-lab-transfer-status]').textContent = format.length ? 'Проверьте заполнение и запись ответа.' : record.last ?
        record.last.correct ? 'Верно. ' + lab.transfer.feedback : 'Пока не совпало. Сравните с правилом и попробуйте ещё раз.' : '';
      $('[data-lab-transfer-first]').textContent = record.first ? 'Первая попытка: ' +
        fieldsFor(lab.transfer).map(field => {
          const raw = record.first.answers[field.id];
          return lab.transfer.choices?.find(choice => choice.id === raw)?.label || raw;
        }).join('; ') + (record.first.correct ? ' — верно.' : ' — потребовалось исправление.') : '';
      $('[data-lab-warning]').textContent = store.warning;
    }
    function action(change, after) {
      queued++;
      store.update(change).then(() => {
        queued--;
        if (!active || queued) return;
        const record = store.read();
        render(record);
        after?.(record);
      }, () => {
        queued--;
        if (active) $('[data-lab-warning]').textContent = 'Не удалось сохранить действие. Попробуйте ещё раз.';
      });
    }
    predictForm.onsubmit = event => {
      event.preventDefault();
      const value = prediction.value;
      if (!lab.prediction.choices.some(choice => choice.id === value)) {
        $('[data-lab-prediction-status]').textContent = 'Выберите прогноз.';
        prediction.focus();
        return;
      }
      action(record => {
        if (record.prediction !== null) return false;
        record.prediction = value;
        visit(lab, record);
        return true;
      }, () => controls[0].focus());
    };
    for (const input of controls) input.onchange = () => {
      const id = input.dataset.control, control = lab.view.controls.find(item => item.id === id);
      const value = input.type === 'checkbox' ? input.checked : input.value;
      action(record => {
        if (record.prediction === null || record.values[id] === value || !validValue(control, value)) return false;
        record.values[id] = value;
        visit(lab, record);
        return true;
      });
    };
    compareButton.onclick = () => action(record => {
      if (record.prediction === null || record.compared || !canCompare(lab, record) || record.verified !== checkForms.length) return false;
      record.compared = true;
      return true;
    }, () => { if (!transfer.hidden) fields[0].focus(); });
    for (const input of inputs) input.oninput = () => {
      const id = input.dataset.response, value = input.value.slice(0, maxDraft);
      const stage = input.form.dataset.labVerification;
      format = format.filter(key => key !== id);
      if (checkFeedback?.stage === Number(stage)) checkFeedback = null;
      action(record => {
        const visible = stage === undefined ? record.compared : Number(stage) === record.verified && canCompare(lab, record);
        if (!visible || record.drafts[id] === value) return false;
        record.drafts[id] = value;
        return true;
      });
    };
    checkForms.forEach((form, stage) => { form.onsubmit = event => {
      event.preventDefault();
      const fields = stagesFor(lab)[stage].fields;
      const answers = Object.fromEntries([...form.querySelectorAll('[data-response]')].map(input =>
        [input.dataset.response, input.value.trim().slice(0, maxDraft)]));
      const verdict = checkFields(fields, answers, parser);
      const invalid = verdict.invalid;
      checkFeedback = verdict.correct ? null : { stage, invalid, message:
        verdict.recognized ? 'Пока не совпало. Проверьте по модели.' : 'Заполните каждое поле.' };
      action(record => {
        if (!canCompare(lab, record) || stage !== record.verified || !verdict.correct) return false;
        Object.assign(record.drafts, answers);
        record.verified++;
        if (own(answers, 'inverse-x')) record.values.x = '1';
        return true;
      }, record => {
        if (!active) return;
        if (record.verified > stage) (checkForms[record.verified]?.querySelector('[data-response]') || compareButton).focus();
        else if (invalid.length) inputs.find(input => input.dataset.response === invalid[0]).focus();
      });
    }; });
    transfer.onsubmit = event => {
      event.preventDefault();
      const answers = Object.fromEntries(fields.map(input => [input.dataset.response, input.value.slice(0, maxDraft)]));
      const verdict = evaluateTransfer(lab, answers, parser);
      format = verdict.invalid;
      action(record => {
        if (!record.compared) return false;
        const changed = fieldsFor(lab.transfer).some(field => record.drafts[field.id] !== answers[field.id]);
        if (changed) Object.assign(record.drafts, answers);
        if (!verdict.recognized) return changed;
        if (record.last?.correct === verdict.correct && fieldsFor(lab.transfer).every(field =>
          record.last.answers[field.id] === answers[field.id])) return changed;
        const attempt = { answers, correct: verdict.correct };
        record.first ||= attempt;
        record.last = attempt;
        return true;
      }, () => { if (format.length) fields.find(input => input.dataset.response === format[0]).focus(); });
    };
    const updated = event => {
      if (active && !queued && event.key === store.key) render(store.read());
    };
    window.addEventListener('storage', updated);
    render(store.read());
    return () => { active = false; window.removeEventListener('storage', updated); container.replaceChildren(); };
  }

  function create(definitions, parser) {
    if (!parser?.parse || !parser?.compare) throw new TypeError('An exact equation answer parser is required');
    const catalog = new Map(definitions.map(lab => [lab.lessonId, lab]));
    if (catalog.size !== 6 || definitions.length !== 6 || definitions.some(lab =>
      !/^p14-[a-z-]+$/.test(lab.lessonId) || !scenes[lab.view.kind])) throw new TypeError('Six known investigations are required');
    function get(lessonId) {
      const lab = catalog.get(lessonId);
      if (!lab) throw new TypeError('Unknown equation investigation');
      return lab;
    }
    return Object.freeze({
      has: lessonId => catalog.has(lessonId),
      scene: (lessonId, values) => scene(get(lessonId), values),
      evaluateTransfer: (lessonId, values) => evaluateTransfer(get(lessonId), values, parser),
      createStore: (lessonId, storage, locks) => createStore(get(lessonId), storage, locks),
      mount: (container, lessonId, settings = {}) => mount(container, get(lessonId), parser, settings)
    });
  }
  return Object.freeze({ create });
});

// The school route uses the same exam page, task IDs and exact-answer checker as №13.
(function (root) {
  'use strict';
  if (typeof document === 'undefined') return;

  const route = '#fipi/2027/13/school';
  const drafts = new Map();
  const storagePrefix = 'mathexam.profilePartTwo.schoolRoute.v1.';
  const formatHelp = {
    'finite-rational': 'Введите число или обыкновенную дробь. Несколько значений разделите точкой с запятой.',
    'finite-pi': 'Запишите точные углы через π или pi. Несколько углов разделите точкой с запятой.',
    'periodic-pi': 'Используйте π или pi и целый параметр k. Разделите серии точкой с запятой. Подойдут и равносильные записи.'
  };

  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  function link(text, href, className) {
    const node = element('a', text, className);
    node.href = href;
    return node;
  }

  // Session drafts survive reload and returning from a model in the same tab.
  // They are separate from exam results and cannot overwrite another tab's work.
  function readDraft(id) {
    if (drafts.has(id)) return drafts.get(id);
    let raw;
    try { raw = JSON.parse(root.sessionStorage.getItem(storagePrefix + id)); } catch (_) {}
    const draft = {
      answer: typeof raw?.answer === 'string' ? raw.answer.slice(0, 500) : '',
      checked: typeof raw?.checked === 'string' ? raw.checked.slice(0, 500) : null,
      hints: Number.isInteger(raw?.hints) && raw.hints >= 0 ? raw.hints : 0
    };
    drafts.set(id, draft);
    return draft;
  }

  function saveDraft(id, draft) {
    try { root.sessionStorage.setItem(storagePrefix + id, JSON.stringify(draft)); } catch (_) {}
  }

  // Same signed-angle convention and projection geometry as the school's circle model.
  // Fifteen-degree steps keep every displayed value exact, including the axes.
  function schoolCircleModel(stageId) {
    const box = element('section', undefined, 'school-circle');
    const isTurns = stageId === 'turns';
    const label = element('label', 'Угол поворота α');
    const slider = element('input');
    slider.type = 'range';
    slider.id = 'school-circle-angle';
    slider.min = '-720';
    slider.max = '720';
    slider.step = '15';
    slider.value = isTurns ? '-210' : '30';
    slider.style.width = '100%';
    label.htmlFor = slider.id;

    const ns = 'http://www.w3.org/2000/svg';
    function shape(tag, attrs, text) {
      const node = document.createElementNS(ns, tag);
      for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
      if (text) node.textContent = text;
      return node;
    }
    const svg = shape('svg', {viewBox: '0 0 260 230', role: 'img', 'aria-label': 'Единичная окружность с точкой P и проекциями'});
    svg.style.cssText = 'display:block;width:100%;max-width:340px;height:auto';
    const axis = '#657372', xColor = '#175aa3', yColor = '#a04122', rayColor = '#185d50';
    const x0 = 115, y0 = 112, radius = 81;
    svg.append(shape('path', {d: 'M14 112H225 M115 12V211', stroke: axis}),
      shape('circle', {cx: x0, cy: y0, r: radius, fill: 'none', stroke: axis, 'stroke-width': 1.5}),
      shape('text', {x: 229, y: 117, fill: axis}, 'x'), shape('text', {x: 125, y: 17, fill: axis}, 'y'),
      shape('text', {x: 198, y: 132, fill: axis}, '1'), shape('text', {x: 99, y: 132, fill: axis}, '0'));
    function segment(color, width, dotted) {
      const line = shape('line', {stroke: color, 'stroke-width': width, 'stroke-linecap': 'round'});
      if (dotted) line.setAttribute('stroke-dasharray', '4 3');
      svg.append(line);
      return line;
    }
    const dropX = segment(xColor, 1.5, true), dropY = segment(yColor, 1.5, true);
    const projX = segment(xColor, 4), projY = segment(yColor, 4), ray = segment(rayColor, 2);
    const point = shape('circle', {r: 4.5, fill: rayColor});
    const pointName = shape('text', {fill: rayColor, 'font-weight': 'bold'}, 'P');
    svg.append(point, pointName);
    const output = element('p');
    output.dataset.schoolCircleValues = '';
    const readout = element('p');
    readout.dataset.schoolCircleAngle = '';

    // Sine and tangent for 0°, 15°, …, 90°; symmetry supplies the other quadrants.
    const sines = ['0', '(√6 − √2)/4', '1/2', '√2/2', '√3/2', '(√6 + √2)/4', '1'];
    const tangents = ['0', '2 − √3', '√3/3', '1', '√3', '2 + √3'];
    function signed(value, negative) {
      if (!negative || value === '0') return value;
      return value === '2 − √3' || value === '2 + √3' ? '−(' + value + ')' : '−' + value;
    }
    function radians(degrees) {
      if (!degrees) return '0';
      let a = Math.abs(degrees), b = 180;
      while (b) [a, b] = [b, a % b];
      const n = Math.abs(degrees) / a, d = 180 / a;
      return (degrees < 0 ? '−' : '') + (n === 1 ? '' : n) + 'π' + (d === 1 ? '' : '/' + d);
    }
    function place(line, x1, y1, x2, y2) {
      for (const [key, n] of Object.entries({x1, y1, x2, y2})) line.setAttribute(key, n);
    }
    function draw() {
      const degrees = Number(slider.value);
      const turn = ((degrees % 360) + 360) % 360;
      const step = turn / 15;
      const acute = Math.min(step % 12, 12 - step % 12);
      const cos = signed(sines[6 - acute], turn > 90 && turn < 270);
      const sin = signed(sines[acute], turn > 180);
      const tan = acute === 6 ? 'не определён (cos α = 0)' : signed(tangents[acute], (turn > 90 && turn < 180) || turn > 270);
      const angle = turn * Math.PI / 180;
      const px = x0 + radius * Math.cos(angle), py = y0 - radius * Math.sin(angle);
      place(dropX, px, py, px, y0);
      place(dropY, px, py, x0, py);
      place(projX, x0, y0, px, y0);
      place(projY, x0, y0, x0, py);
      place(ray, x0, y0, px, py);
      point.setAttribute('cx', px);
      point.setAttribute('cy', py);
      pointName.setAttribute('x', px + (px < x0 ? -17 : 7));
      pointName.setAttribute('y', py + (py > y0 ? 17 : -7));
      slider.setAttribute('aria-valuetext', radians(degrees) + ' радиан, ' + degrees + ' градусов');
      readout.textContent = 'Поворот α = ' + radians(degrees) + ' (' + degrees + '°). Угол той же точки на [0; 2π): ' + radians(turn) + '.';
      output.textContent = 'P = (' + cos + '; ' + sin + '). Горизонтальная проекция cos α = ' + cos + ', вертикальная sin α = ' + sin + '. Тангенс ' + (acute === 6 ? tan : 'tg α = ' + tan) + '.';
    }
    box.append(element('h3', 'Исследуйте окружность'),
      element('p', isTurns ? 'Передвиньте точку сначала на −210°, затем на 150°. Сравните координаты и числа, задающие поворот.' : 'Сначала предскажите знаки координат. Передвиньте точку во вторую четверть, а затем на вертикальную ось и проверьте тангенс.'),
      svg, label, slider, readout, output);
    slider.addEventListener('input', draw);
    slider.addEventListener('change', draw);
    draw();
    return box;
  }

  function workedExample(worked, label) {
    const details = element('details');
    details.append(element('summary', label));
    details.append(element('p', worked.prompt));
    const list = element('ol', undefined, 'steps');
    for (const step of worked.steps) list.append(element('li', step));
    details.append(list);
    return details;
  }

  function evaluate(lesson, answer) {
    if (lesson.exact) {
      if (!answer.trim()) return { text: 'Введите ответ, затем проверьте его.' };
      const { type, spec, feedback, retry } = lesson.exact;
      const result = root.ProfileEquationAnswers.compare(root.ProfileEquationAnswers.parse(answer, type), { ...spec, type });
      if (!result.recognized) return { text: 'Проверьте запись. ' + formatHelp[type] };
      if (result.correct) return { correct: true, text: 'Верно. ' + feedback };
      const issue = result.missing.length && !result.extra.length ? 'Ответ неполный.'
        : result.extra.length && !result.missing.length ? 'В ответе есть лишнее значение.' : 'Проверьте ответ ещё раз.';
      return { correct: false, text: issue + ' ' + retry };
    }
    const choice = lesson.choices.find((_, i) => answer === String(i));
    if (!choice) return { text: 'Выберите один вариант, затем проверьте его.' };
    return { correct: !!choice.correct, text: (choice.correct ? 'Верно. ' : '') + choice.feedback };
  }

  function practice(lesson) {
    const draft = readDraft(lesson.id);
    const section = element('section');
    const prompt = element('h4', lesson.question);
    prompt.id = 'school-route-question';
    section.append(prompt);
    const form = element('form');
    form.setAttribute('aria-labelledby', prompt.id);
    const feedback = element('p');
    feedback.dataset.schoolFeedback = '';
    feedback.setAttribute('role', 'status');
    function display(verdict) {
      feedback.textContent = verdict.text;
      feedback.className = verdict.correct === true ? 'feedback ok' : verdict.correct === false ? 'feedback error' : 'feedback';
    }
    function answerChanged(value) {
      draft.answer = value;
      draft.checked = null;
      feedback.textContent = '';
      feedback.className = '';
      saveDraft(lesson.id, draft);
    }
    if (lesson.exact) {
      const field = element('label', undefined, 'field');
      const input = element('input');
      input.type = 'text';
      input.maxLength = 500;
      input.autocomplete = 'off';
      input.spellcheck = false;
      input.dataset.schoolAnswer = '';
      input.value = draft.answer;
      input.addEventListener('input', () => answerChanged(input.value));
      const help = element('p', formatHelp[lesson.exact.type], 'caption');
      help.id = 'school-route-format';
      input.setAttribute('aria-describedby', help.id);
      field.append(element('span', 'Ваш ответ'), input);
      form.append(field, help);
    } else {
      const group = element('div', undefined, 'checklist');
      for (const [i, choice] of lesson.choices.entries()) {
        const field = element('label');
        const radio = element('input');
        radio.type = 'radio';
        radio.name = 'school-route-choice';
        radio.value = String(i);
        radio.dataset.schoolAnswer = '';
        radio.checked = draft.answer === radio.value;
        radio.addEventListener('change', () => answerChanged(radio.value));
        field.append(radio, element('span', choice.label));
        group.append(field);
      }
      group.setAttribute('role', 'radiogroup');
      group.setAttribute('aria-labelledby', prompt.id);
      form.append(group);
    }
    const check = element('button', 'Проверить');
    check.type = 'submit';
    check.dataset.schoolCheck = '';
    form.append(check, feedback);
    form.addEventListener('submit', event => {
      event.preventDefault();
      const input = form.querySelector('input[type="text"], input:checked');
      draft.answer = input?.value || '';
      const verdict = evaluate(lesson, draft.answer);
      draft.checked = draft.answer || null;
      saveDraft(lesson.id, draft);
      display(verdict);
      if (!draft.answer) form.querySelector('input').focus();
    });
    if (draft.checked !== null && draft.checked === draft.answer) display(evaluate(lesson, draft.answer));
    section.append(form);
    if (lesson.hints?.length) {
      const displayed = element('div');
      displayed.setAttribute('aria-live', 'polite');
      for (const hint of lesson.hints.slice(0, draft.hints)) displayed.append(element('p', hint, 'hint'));
      const button = element('button', 'Открыть подсказку', 'quiet');
      button.type = 'button';
      button.dataset.schoolHint = '';
      function refreshHintButton() {
        button.disabled = draft.hints >= lesson.hints.length;
        button.textContent = button.disabled ? 'Все подсказки открыты' : draft.hints ? 'Следующая подсказка' : 'Открыть подсказку';
      }
      button.addEventListener('click', () => {
        if (draft.hints >= lesson.hints.length) return;
        displayed.append(element('p', lesson.hints[draft.hints++], 'hint'));
        saveDraft(lesson.id, draft);
        refreshHintButton();
      });
      refreshHintButton();
      section.append(displayed, button);
    }
    return section;
  }

  function mount(main, lessons) {
    if (!lessons?.length) return;
    const section = element('section', undefined, 'panel part2-lab');
    section.id = 'school-route';
    section.setAttribute('aria-labelledby', 'school-route-heading');
    const title = element('h2', 'От тригонометрического круга к уравнению №13');
    title.id = 'school-route-heading';
    section.append(title);
    const hash = root.location.hash;
    const expanded = hash === route || hash.startsWith(route + '/');
    const urlFor = lesson => route + '/' + lesson.id;
    const selectLabel = element('label', 'Перейти к шагу');
    const select = element('select');
    select.dataset.schoolStep = '';
    selectLabel.append(select);
    select.addEventListener('change', () => { if (select.value) root.location.hash = route + '/' + select.value; });
    if (!expanded) {
      section.append(element('p', 'Начните со смысла синуса, косинуса и тангенса или выберите шаг, который хотите разобрать.'));
      const start = link('Начать с первого шага', route, 'button');
      start.dataset.schoolStart = '';
      section.append(start);
      const placeholder = element('option', 'Выберите тему');
      placeholder.value = '';
      select.append(placeholder);
    }
    const slug = expanded ? hash.slice((route + '/').length) : '';
    const selected = Math.max(0, lessons.findIndex(lesson => lesson.id === slug));
    for (const [i, lesson] of lessons.entries()) {
      const option = element('option', (i + 1) + '. ' + lesson.title);
      option.value = lesson.id;
      option.selected = expanded && selected === i;
      select.append(option);
    }
    section.append(selectLabel);
    if (expanded) {
      const lesson = lessons[selected];
      const heading = element('h3', lesson.title);
      heading.tabIndex = -1;
      heading.dataset.schoolTitle = '';
      section.append(heading, element('p', lesson.lead));
      if (lesson.id === 'coordinates' || lesson.id === 'turns') section.append(schoolCircleModel(lesson.id));
      if (lesson.links?.length) {
        const activities = element('ul');
        for (const item of lesson.links) {
          const offsite = root.MathExamTrainerOffline && item.href.startsWith('/');
          const href = offsite ? new URL(item.href, root.MathExamTrainerOffline.origin).href : item.href;
          const li = element('li');
          li.append(link(item.label + (offsite ? ' (на сайте)' : ''), href));
          activities.append(li);
        }
        section.append(activities);
      }
      if (lesson.worked) section.append(workedExample(lesson.worked, lesson.id === 'exam' ? 'Как оформить письменное решение' : 'Разобрать пример'));
      if (lesson.choices?.length || lesson.exact) section.append(practice(lesson));
      const nav = element('nav', undefined, 'actions');
      nav.setAttribute('aria-label', 'Шаги школьного маршрута');
      if (selected > 0) nav.append(link('← Предыдущий шаг', urlFor(lessons[selected - 1]), 'button quiet'));
      if (selected + 1 < lessons.length) {
        const next = link('Следующий шаг →', urlFor(lessons[selected + 1]), 'button');
        next.dataset.schoolNext = '';
        nav.append(next);
      } else nav.append(link('К темам №13', '#fipi/2027/13', 'button quiet'));
      section.append(nav);
    }
    main.querySelector('.grid').before(section);
  }

  root.ProfileEquationSchoolWorkshop = Object.freeze({ mount });
})(globalThis);

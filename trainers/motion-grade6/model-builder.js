/* Blank diagram/table and a short observation that tests the learner's prediction. */
(function (root) {
  'use strict';

  const columnNames = {
    start: 'Положение, км', speed: 'Скорость, км/ч', dir: 'Направление',
    rate: 'Изменение координаты за 1 ч, км'
  };
  const predictions = {
    sum: 'Промежуток сократится на сумму двух путей',
    difference: 'Промежуток сократится на разность двух путей',
    grow: 'Промежуток увеличится',
    same: 'Промежуток останется прежним'
  };
  const maxMinutes = 12;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
  const format = value => root.MotionCourse.F(value);
  const numeric = value => root.MotionCourse.numeric(String(value ?? '').replace(/−/g, '-'));
  const equal = (a, b) => Math.abs(a - b) < 0.000001;
  const blank = () => ({ start: '', speed: '', dir: '' });
  const options = (items, value, placeholder) =>
    '<option value="">' + esc(placeholder) + '</option>' +
    Object.entries(items).map(([key, label]) =>
      '<option value="' + esc(key) + '"' + (String(value) === key ? ' selected' : '') + '>' +
      esc(label) + '</option>').join('');
  const directions = { '1': '→ вправо', '-1': '← влево' };

  function normalize(draft) {
    if (!Array.isArray(draft.diagram) || draft.diagram.length !== 2) draft.diagram = [blank(), blank()];
    draft.diagram = draft.diagram.map(row => row && typeof row === 'object' ? row : blank());
    if (!Array.isArray(draft.rows)) draft.rows = [];
    draft.rows = draft.rows.slice(0, 2).filter(row => row && typeof row === 'object');
    if (!Array.isArray(draft.columns)) draft.columns = [];
    draft.columns = [...new Set(draft.columns.filter(key => Object.hasOwn(columnNames, key)))];
    if (!['diagram', 'table'].includes(draft.mode)) draft.mode = '';
    const minutes = Number(draft.minutes);
    draft.minutes = Number.isFinite(minutes) ? Math.max(0, Math.min(maxMinutes, Math.round(minutes))) : 0;
  }

  function representation(c, draft) {
    const feedback = (message, value = '') => ({ok: false, message, incorrect: String(value ?? '').trim() !== ''});
    if (!draft.mode) return feedback('Выбери, как изобразить движение.');
    let rows = draft.diagram;
    if (draft.mode === 'table') {
      if (!draft.columns.includes('start')) return feedback('Какая графа покажет, где каждый был в начале отсчёта? Добавь её в таблицу.');
      if (!draft.columns.includes('rate') && !(draft.columns.includes('speed') && draft.columns.includes('dir'))) {
        return feedback('Подбери графы, по которым можно понять, как быстро и куда движется каждый участник.');
      }
      if (draft.rows.length !== 2 || !draft.rows.every(row => ['0', '1'].includes(row.actor))) {
        return feedback('Создай по одной строке для каждого участника и подпиши обе.');
      }
      if (draft.rows[0].actor === draft.rows[1].actor) return feedback('Обе строки описывают одного участника. Проверь подписи.', 'duplicate');
      rows = c.actors.map((_, i) => draft.rows.find(row => row.actor === String(i)));
    }
    for (const [index, actor] of c.actors.entries()) {
      const row = rows[index];
      const who = actor.label + '. ';
      if (!equal(numeric(row.start), actor.start)) {
        const detail = c.leadMinutes > 0 && actor.start > 0 ?
          'Подумай, какой путь уже пройден к выбранному началу отсчёта.' :
          'Сверь начальную отметку с условием. Откуда отсчитываются километры?';
        return feedback(who + detail, row.start);
      }
      const uses = key => draft.mode === 'diagram' || draft.columns.includes(key);
      if (draft.mode === 'table' && draft.columns.includes('rate') && !equal(numeric(row.rate), actor.speed)) {
        return feedback(who + 'Сместись по оси на путь за час. При движении влево координата уменьшается.', row.rate);
      }
      if (uses('dir') && String(Math.sign(actor.speed)) !== row.dir) {
        return feedback(who + 'Проследи, к какой стороне дороги движется этот участник.', row.dir);
      }
      if (uses('speed') && !equal(numeric(row.speed), Math.abs(actor.speed))) {
        return feedback(who + 'Скорость здесь указывают в км/ч, а сторону движения выбирают стрелкой.', row.speed);
      }
    }
    return null;
  }

  function expectedPrediction(c) {
    const [a, b] = c.actors;
    if (a.speed === b.speed) return 'same';
    const initial = Math.abs(b.start - a.start);
    const later = Math.abs(b.start - a.start + (b.speed - a.speed) / 1000);
    if (later > initial) return 'grow';
    return a.speed * b.speed < 0 ? 'sum' : 'difference';
  }

  function check(c, draft) {
    normalize(draft);
    const mistake = representation(c, draft);
    if (mistake) return mistake;
    if (!Object.hasOwn(predictions, draft.prediction)) return { ok: false, message: 'Сделай прогноз об изменении промежутка.' };
    if (!draft.started || !draft.observed) {
      return { ok: false, message: 'Открой опыт и сдвинь время хотя бы на одну минуту. Сравни промежуток с начальным.' };
    }
    if (expectedPrediction(c) !== draft.prediction) return {
      ok: false, incorrect: true,
      message: 'Сравни, сколько прошёл каждый, и как изменился промежуток. Исправь прогноз и повтори опыт.'
    };
    return { ok: true, message: 'Опыт подтверждает твою модель.' };
  }

  function input(field, value, data, name) {
    if (field === 'dir') return '<select ' + data + ' aria-label="' + esc(name) + '">' +
      options(directions, value, 'Куда?') + '</select>';
    return '<input type="text" inputmode="' + (field === 'rate' ? 'text' : 'decimal') + '" maxlength="20" autocomplete="off" ' + data +
      ' aria-label="' + esc(name) + '" value="' + esc(value) + '">';
  }

  function diagram(c, draft) {
    return '<p>Отметь, где находится каждый в начале отсчёта. Задай стрелку движения и подпиши скорость.</p>' +
      c.actors.map((actor, i) => '<fieldset><legend>' + esc(actor.label) + '</legend><div class="mb-fields">' +
        ['start', 'dir', 'speed'].map(key => '<label>' + esc(columnNames[key]) +
          input(key, draft.diagram[i][key], 'data-mb-' + key + '="' + i + '"', actor.label + ' — ' + columnNames[key]) +
          '</label>').join('') + '</div></fieldset>').join('') + '<div data-mb-preview></div>';
  }

  function table(c, draft) {
    const available = Object.fromEntries(Object.entries(columnNames).filter(([key]) => !draft.columns.includes(key)));
    const actors = Object.fromEntries(c.actors.map((a, i) => [i, a.label]));
    const picker = Object.keys(available).length ? '<label>Графа <select data-mb-col-picker>' +
      options(available, '', 'Выбери графу') + '</select></label> <button type="button" data-mb-action="add-col">Добавить графу</button>' : '';
    const add = draft.rows.length < 2 ? '<button type="button" data-mb-action="add-row">Добавить строку</button>' : '';
    const headers = draft.columns.map(key => '<th scope="col">' + esc(columnNames[key]) +
      ' <button type="button" data-mb-action="remove-col" data-mb-key="' + key + '" aria-label="Убрать графу: ' +
      esc(columnNames[key]) + '" title="Убрать графу">×</button></th>').join('');
    const rows = draft.rows.map((row, i) => '<tr><th scope="row"><select data-mb-actor="' + i +
      '" aria-label="Участник в строке ' + (i + 1) + '">' + options(actors, row.actor, 'Кто?') + '</select></th>' +
      draft.columns.map(key => '<td>' +
        input(key, row[key], 'data-mb-cell="' + i + '-' + key + '"', 'Строка ' + (i + 1) + ' — ' + columnNames[key]) +
        '</td>').join('') + '</tr>').join('');
    return '<p>Выбери графы, затем добавь строки и подпиши, о ком каждая. Запиши сведения к началу отсчёта.</p>' +
      '<div class="mb-actions">' + picker + add + '</div>' +
      (!draft.columns.length && !draft.rows.length ? '' : '<div class="mb-table"><table><caption>Моя таблица движения</caption>' +
        '<thead><tr><th scope="col">Участник</th>' + headers + '</tr></thead><tbody>' + rows + '</tbody></table></div>');
  }

  function markup(c, draft) {
    normalize(draft);
    return '<div class="mb-board"><div class="mb-actions" role="group" aria-label="Способ записи">' +
      ['diagram', 'table'].map((mode, i) => '<button type="button" data-mb-action="' + mode + '" aria-pressed="' +
        (draft.mode === mode) + '">' + ['Построить схему', 'Составить таблицу'][i] + '</button>').join('') + '</div>' +
      (draft.mode ? '<p>' + esc(c.originLabel) + ' ' + esc(c.axisLabel) + '</p>' +
       (draft.mode === 'diagram' ? diagram(c, draft) : table(c, draft)) +
       '<label>Что произойдёт с промежутком за первые несколько минут? <select data-mb-prediction>' +
       options(predictions, draft.prediction, 'Мой прогноз') + '</select>' +
       '<span aria-hidden="true" class="mm-choice-text" data-mb-label>' +
       esc(Object.hasOwn(predictions, draft.prediction) ? predictions[draft.prediction] : '') + '</span></label>' +
       '<div class="mb-actions"><button type="button" data-mb-action="experiment">Проверить опытом</button></div>' : '') +
       '<p data-mb-status role="status"></p><div data-mb-experiment></div></div>';
  }

  function plot(values, domain, signs) {
    const span = Math.max(1, domain[1] - domain[0]);
    const x = value => 45 + 430 * ((value - domain[0]) / span);
    const axis = '<path d="M24 59H495l-8 -5m8 5l-8 5" stroke="#39534a" fill="none" stroke-width="2"/>' +
      domain.map((value, i) => {
        const px = x(value);
        return '<path d="M' + px + ' 55v8" stroke="#39534a"/><text x="' + px +
          '" y="79" fill="#22392e" text-anchor="' + (i ? 'end' : 'start') + '" font-size="15">' +
          format(value) + ' км</text>';
      }).join('');
    const markers = values.map((p, i) => {
      if (!Number.isFinite(p)) return '';
      const y = i === 0 ? 30 : 99;
      const direction = signs[i] === '1' ? ' →' : signs[i] === '-1' ? ' ←' : '';
      const color = i === 0 ? '#12654e' : '#235da4';
      const px = x(p);
      return '<path d="M' + px + ' 59V' + y + '" stroke="' + color + '" stroke-dasharray="3 2"/>' +
        '<circle cx="' + px + '" cy="59" r="4" fill="' + color + '"/>' +
        '<text x="' + px + '" y="' + y + '" text-anchor="middle" fill="' + color +
        '" font-size="19" font-weight="bold">' + (i + 1) + direction + '</text>';
    }).join('');
    return '<svg class="mb-figure" viewBox="0 0 520 114" width="100%" aria-hidden="true">' + axis + markers + '</svg>';
  }

  function bind(host, c, draft, onChange) {
    normalize(draft);
    let timer = null;
    const find = selector => host.querySelector(selector);
    const changed = () => { if (onChange) onChange(); };
    function stop() { if (timer !== null) window.clearInterval(timer); timer = null; }
    function status(message) { find('[data-mb-status]').textContent = message; }
    function preview() {
      const target = find('[data-mb-preview]');
      if (!target) return;
      const starts = draft.diagram.map(row => numeric(row.start));
      const visible = starts.filter(Number.isFinite);
      if (!visible.length) { target.replaceChildren(); return; }
      target.innerHTML = plot(starts, [Math.min(0, ...visible), Math.max(1, ...visible)], draft.diagram.map(row => row.dir)) +
        '<p class="small">' + c.actors.map((a, i) => (i + 1) + ' — ' + esc(a.label)).join('. ') + '.</p>';
    }
    function measure() {
      const scene = find('[data-mb-experiment]');
      if (!draft.started) { scene.replaceChildren(); return; }
      if (!scene.firstChild) scene.innerHTML =
        '<div data-mb-plot></div><p data-mb-readout></p><label>Время опыта, мин <input type="range" min="0" max="' +
        maxMinutes + '" step="1" data-mb-time></label><div class="mb-actions">' +
        '<button type="button" data-mb-action="tick">Шаг на 6 минут</button>' +
        '<button type="button" data-mb-action="play">Пуск</button>' +
        '<button type="button" data-mb-action="rewind">К началу опыта</button></div>';
      const current = root.MotionModelData.position(c, draft.minutes / 60);
      const end = root.MotionModelData.position(c, maxMinutes / 60);
      const domain = [0, ...c.actors.map(a => a.start), end.p1, end.p2];
      find('[data-mb-plot]').innerHTML = plot([current.p1, current.p2], [Math.min(...domain), Math.max(...domain)],
        c.actors.map(a => String(Math.sign(a.speed))));
      const traveled = [current.p1, current.p2].map((p, i) =>
        (i + 1) + ' — ' + c.actors[i].label + ', отметка ' + format(p) + ' км (путь ' +
        format(Math.abs(p - c.actors[i].start)) + ' км)');
      find('[data-mb-readout]').textContent = 'Прошло ' + draft.minutes + ' мин. ' + traveled.join('. ') +
        '. Промежуток в начале ' + format(Math.abs(c.actors[1].start - c.actors[0].start)) +
        ' км, сейчас ' + format(current.distance) + ' км.';
      const slider = find('[data-mb-time]');
      slider.value = draft.minutes;
      slider.setAttribute('aria-valuetext', draft.minutes + ' мин. Промежуток ' + format(current.distance) + ' км.');
      find('[data-mb-action=tick]').disabled = draft.minutes === maxMinutes;
      find('[data-mb-action=play]').textContent = timer === null ? 'Пуск' : 'Пауза';
    }
    function render(selector) {
      host.innerHTML = markup(c, draft);
      preview();
      measure();
      if (selector) find(selector)?.focus();
    }
    function modified() {
      stop();
      draft.started = false;
      draft.observed = false;
      draft.minutes = 0;
      changed();
      status('');
      measure();
      preview();
    }
    function time(value) {
      draft.minutes = Math.min(maxMinutes, Math.max(0, Math.round(value)));
      if (draft.minutes > 0) draft.observed = true;
      if (draft.minutes === maxMinutes) stop();
      measure();
      changed();
    }
    function click(event) {
      const button = event.target.closest('button[data-mb-action]');
      if (!button || !host.contains(button)) return;
      const action = button.dataset.mbAction;
      if (action === 'table' || action === 'diagram') {
        if (draft.mode === action) return;
        draft.mode = action;
        modified();
        render('[data-mb-action=' + action + ']');
      } else if (action === 'add-col') {
        const key = find('[data-mb-col-picker]')?.value;
        if (!key || !Object.hasOwn(columnNames, key)) { status('Выбери название графы.'); return; }
        if (!draft.columns.includes(key)) draft.columns.push(key);
        modified();
        render(draft.columns.length < Object.keys(columnNames).length ? '[data-mb-col-picker]' : '[data-mb-action=add-row]');
      } else if (action === 'remove-col') {
        const key = button.dataset.mbKey;
        draft.columns = draft.columns.filter(column => column !== key);
        for (const row of draft.rows) delete row[key];
        modified();
        render('[data-mb-col-picker]');
      } else if (action === 'add-row') {
        if (draft.rows.length >= 2) return;
        draft.rows.push({ actor: '', ...blank() });
        modified();
        render('[data-mb-actor="' + (draft.rows.length - 1) + '"]');
      } else if (action === 'experiment') {
        const problem = representation(c, draft);
        if (problem || !Object.hasOwn(predictions, draft.prediction)) {
          if (problem?.incorrect) { draft.revised = true; changed(); }
          status(problem?.message || 'Выбери свой прогноз.');
          return;
        }
        stop();
        draft.started = true;
        draft.observed = false;
        draft.minutes = 0;
        measure();
        changed();
        status('Передвинь время. Сравни уменьшение или увеличение промежутка с путём каждого участника.');
        find('[data-mb-time]').focus();
      } else if (draft.started) {
        if (action === 'tick') { stop(); time(draft.minutes + 6); }
        if (action === 'rewind') { stop(); time(0); }
        if (action === 'play') {
          if (timer !== null) { stop(); measure(); return; }
          if (draft.minutes === maxMinutes) time(0);
          timer = window.setInterval(() => time(draft.minutes + 1), 380);
          measure();
        }
      }
    }
    function edit(event) {
      const el = event.target;
      if (el.matches('[data-mb-time]')) { stop(); time(Number(el.value)); return; }
      if (el.matches('[data-mb-prediction]')) {
        draft.prediction = el.value;
        find('[data-mb-label]').textContent = predictions[el.value] || '';
      }
      else if (el.matches('[data-mb-actor]')) draft.rows[Number(el.dataset.mbActor)].actor = el.value;
      else if (el.matches('[data-mb-cell]')) {
        const [rowIndex, field] = el.dataset.mbCell.split('-');
        draft.rows[Number(rowIndex)][field] = el.value;
      } else {
        const field = ['start', 'dir', 'speed'].find(key => el.hasAttribute('data-mb-' + key));
        if (!field) return;
        draft.diagram[Number(el.getAttribute('data-mb-' + field))][field] = el.value;
      }
      modified();
    }
    const onInput = event => { if (event.target.matches('input')) edit(event); };
    const onSelect = event => { if (event.target.matches('select')) edit(event); };
    host.addEventListener('click', click);
    host.addEventListener('input', onInput);
    host.addEventListener('change', onSelect);
    preview();
    measure();
    return function cleanup() {
      stop();
      host.removeEventListener('click', click);
      host.removeEventListener('input', onInput);
      host.removeEventListener('change', onSelect);
    };
  }
  root.MotionModelBuilder = { markup, bind, check };
})(typeof window === 'undefined' ? globalThis : window);

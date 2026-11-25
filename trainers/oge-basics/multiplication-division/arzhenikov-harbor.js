'use strict';

(() => {
  const host = document.getElementById('harbor-play');
  const missions = window.ArzhenikovHarborBank?.missions;
  if (!host || !missions?.length) return;

  const key = 'mathexam.arzhenikov.harbor.v1';
  const ids = missions.map(mission => mission.id);
  const stages = ['layout', 'answer', 'complete'];
  const find = id => missions.find(mission => mission.id === id);
  const binCount = mission => Math.ceil(mission.total / mission.capacity) + 1;
  const fieldCount = mission => mission.kind === 'remainder' ? 2 : 1;
  const freshRun = mission => ({stage: 'layout', piles: Array(binCount(mission)).fill(0), moves: [], values: Array(fieldCount(mission)).fill(''), hint: false, invalid: [], feedback: ''});
  const fresh = () => ({version: 1, current: ids[0], completed: [], runs: {}});
  let storageMessage = '';
  let state = fresh();
  const sandbox = {total: 12, capacity: 4, open: false};

  function left(mission, piles) { return mission.total - piles.reduce((sum, amount) => sum + amount, 0); }
  function expected(mission) {
    const q = Math.floor(mission.total / mission.capacity), r = mission.total % mission.capacity;
    return mission.kind === 'remainder' ? [q, r] : [q + Number(mission.kind === 'ceil' && r > 0)];
  }
  function layoutIssue(mission, piles) {
    const remaining = left(mission, piles);
    const partial = piles.filter(amount => amount > 0 && amount < mission.capacity).length;
    if (mission.kind === 'ceil') {
      if (remaining) return 'На причале ещё есть груз. В этой задаче нужно отправить всё. Наполни коробки и найди место для оставшихся предметов.';
      const allowedPartial = Number(mission.total % mission.capacity > 0);
      if (partial !== allowedPartial) return 'Весь груз поместился. По условию сначала заполняем группы целиком. ' +
        (allowedPartial ? 'Переложи предметы так, чтобы неполной осталась только одна группа — с остатком.' : 'Здесь остатка нет: каждая занятая группа должна быть полной.');
    } else {
      if (partial) return 'Есть неполная группа. Собери полные группы, а то, чего не хватает на ещё одну, оставь на причале. Предмет можно забрать и переложить.';
      if (remaining >= mission.capacity) return 'На причале ещё хватает предметов на полную группу. Собери её тоже.';
    }
    return '';
  }
  function invalidFields(mission, values) {
    return expected(mission).flatMap((answer, index) => /^\d+$/.test(values[index]?.trim() || '') && Number(values[index]) === answer ? [] : [index]);
  }
  function restoreRun(mission, saved) {
    if (!saved || !Array.isArray(saved.piles) || saved.piles.length !== binCount(mission) ||
        saved.piles.some(amount => !Number.isInteger(amount) || amount < 0 || amount > mission.capacity) || left(mission, saved.piles) < 0) return freshRun(mission);
    const run = freshRun(mission);
    run.piles = [...saved.piles];
    run.stage = stages.includes(saved.stage) ? saved.stage : 'layout';
    run.values = run.values.map((_, index) => typeof saved.values?.[index] === 'string' ? saved.values[index].slice(0, 4) : '');
    run.hint = saved.hint === true;
    run.feedback = ['layout', 'answer'].includes(saved.feedback) ? saved.feedback : '';
    run.invalid = Array.isArray(saved.invalid) ? [...new Set(saved.invalid.filter(index => Number.isInteger(index) && index >= 0 && index < fieldCount(mission)))] : [];
    // Keep undo only when its complete history reconstructs the saved arrangement.
    if (Array.isArray(saved.moves) && saved.moves.length <= 2000) {
      const rebuilt = Array(binCount(mission)).fill(0);
      let valid = true;
      for (const move of saved.moves) {
        if (!move || !Number.isInteger(move.bin) || move.bin < 0 || move.bin >= rebuilt.length || ![1, -1].includes(move.delta) ||
            rebuilt[move.bin] + move.delta < 0 || rebuilt[move.bin] + move.delta > mission.capacity || (move.delta === 1 && left(mission, rebuilt) <= 0)) { valid = false; break; }
        rebuilt[move.bin] += move.delta;
      }
      if (valid && rebuilt.every((amount, index) => amount === run.piles[index])) run.moves = saved.moves.map(move => ({bin: move.bin, delta: move.delta}));
    }
    if (run.stage !== 'layout' && layoutIssue(mission, run.piles)) run.stage = 'layout';
    if (run.stage === 'complete' && invalidFields(mission, run.values).length) {
      run.stage = 'answer'; run.invalid = invalidFields(mission, run.values); run.feedback = 'answer';
    }
    return run;
  }
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const saved = JSON.parse(raw);
      if (!saved || saved.version !== 1 || !saved.runs || typeof saved.runs !== 'object' || Array.isArray(saved.runs)) throw Error('invalid state');
      state.current = ids.includes(saved.current) ? saved.current : ids[0];
      state.completed = Array.isArray(saved.completed) ? [...new Set(saved.completed.filter(id => ids.includes(id)))] : [];
      for (const mission of missions) {
        if (!Object.hasOwn(saved.runs, mission.id)) continue;
        state.runs[mission.id] = restoreRun(mission, saved.runs[mission.id]);
        if (saved.runs[mission.id]?.stage === 'complete' && state.runs[mission.id].stage !== 'complete') state.completed = state.completed.filter(id => id !== mission.id);
      }
    }
  } catch {
    state = fresh();
    storageMessage = 'Не удалось прочитать сохранение порта. Можно начать здесь и продолжать в этой вкладке.';
  }
  function save() {
    try { localStorage.setItem(key, JSON.stringify(state)); }
    catch { storageMessage = 'Сохранение после закрытия недоступно. В этой вкладке можно продолжать играть.'; }
    const note = host.querySelector('.hb-storage');
    if (note) { note.textContent = storageMessage; note.hidden = !storageMessage; }
  }
  window.ArzhenikovHarborProgress = () => {
    const mission = find(state.current);
    return {completed: [...state.completed], total: missions.length, current: state.current,
      stage: state.runs[state.current]?.stage || 'layout',
      mission: {id: mission.id, kind: mission.kind, total: mission.total, capacity: mission.capacity}};
  };
  function announce() { window.dispatchEvent(new CustomEvent('harbor-progress', {detail: window.ArzhenikovHarborProgress()})); }
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function button(text, name, fn, className) {
    const node = el('button', className, text); node.type = 'button'; node.dataset.hbAction = name; node.addEventListener('click', fn); return node;
  }
  function tokens(item, count) {
    const row = el('span', 'hb-tokens'); row.setAttribute('aria-hidden', 'true');
    for (let index = 0; index < count; index++) row.append(token(item));
    return row;
  }
  function token(item) {
    const node = el('span', 'hb-token', item);
    window.ArzhenikovArt?.decorate(node, item);
    return node;
  }
  function slots(mission, amount) {
    const row = el('span', 'hb-slots'); row.setAttribute('aria-hidden', 'true');
    for (let index = 0; index < mission.capacity; index++) {
      const slot = el('span', 'hb-slot'); slot.dataset.filled = String(index < amount);
      if (index < amount) slot.append(token(mission.item));
      row.append(slot);
    }
    return row;
  }
  function route() {
    if (location.hash === '#harbor') return state.current;
    const match = location.hash.match(/^#harbor-(\d+)$/);
    return match ? (ids.includes(match[1]) ? match[1] : state.current) : null;
  }
  function answerFeedback(mission, run) {
    const index = run.invalid[0];
    if (index === undefined) return '';
    if (!run.values[index]?.trim()) return 'Введи число в каждое поле.';
    if (index === 1) return 'Остаток — это предметы на причале. Посчитай их отдельно от полных групп.';
    if (mission.kind === 'ceil') return mission.total % mission.capacity
      ? 'Нужно отправить весь груз. Группа с остатком тоже занимает место — посчитай все непустые группы.'
      : 'Проверь, остался ли груз для ещё одной группы. Пустое место брать не нужно.';
    return 'Посчитай только полностью заполненные группы. Неполная группа и пустое место не дают ещё один готовый набор.';
  }
  function snapshot(parent, mission, piles) {
    const grid = el('div', 'hb-targets hb-snapshot');
    piles.forEach((amount, index) => {
      if (!amount) return;
      const group = el('div', 'hb-target'); group.dataset.amount = amount;
      group.setAttribute('role', 'img'); group.setAttribute('aria-label', mission.container + ' ' + (index + 1) + ': ' + amount + ' из ' + mission.capacity);
      group.append(el('span', 'hb-target-label', mission.container + ' ' + (index + 1)), slots(mission, amount)); grid.append(group);
    });
    parent.append(grid);
    const remaining = left(mission, piles), stock = el('div', 'hb-stock');
    stock.append(el('span', 'hb-stock-label', 'На причале осталось: ' + remaining), tokens(mission.item, remaining)); parent.append(stock);
  }
  function explain(mission) {
    const q = Math.floor(mission.total / mission.capacity), r = mission.total % mission.capacity;
    if (mission.kind === 'exact') return 'Получилось полных групп: ' + q + '. Остатка нет — все предметы разделились нацело.';
    if (mission.kind === 'remainder') return 'Полных групп: ' + q + '. Осталось на причале: ' + r + '. Остаток меньше ' + mission.capacity + ', поэтому ещё одну полную группу не собрать.';
    if (mission.kind === 'floor') return 'В этой задаче нужны только полные комплекты. Их ' + q + '. ' + (r ? 'Осталось предметов: ' + r + '. Этого не хватает на ещё один полный комплект.' : 'Остатка нет. Пустое место не добавляет ещё один комплект.');
    return r ? 'Нужно вместить всё. Полных групп: ' + q + '. Для оставшихся ' + r + ' предметов нужна ещё одна группа: ' + q + ' + 1 = ' + (q + 1) + '.'
      : 'Все предметы поместились в ' + q + ' полных группах. Остатка нет, поэтому дополнительная пустая ёмкость не нужна.';
  }

  function exploration() {
    const details = el('details', 'hb-sandbox'); details.open = sandbox.open;
    details.append(el('summary', '', 'Моя задача'));
    details.append(el('p', 'hb-sandbox-intro', 'Меняй числа и сравнивай четыре вопроса. Здесь можно исследовать без наград и проверок.'));
    const controls = el('div', 'hb-sandbox-controls');
    const inputs = {}, sliders = {};
    for (const [name, labelText, min, max] of [['total', 'Всего предметов', 2, 20], ['capacity', 'В полной группе', 2, 6]]) {
      const control = el('div', 'hb-sandbox-control');
      const label = el('label', 'hb-field', labelText), input = el('input', 'hb-input');
      input.type = 'number'; input.min = min; input.max = max; input.step = 1; input.value = sandbox[name]; input.dataset.hbSandbox = name;
      const slider = el('input', 'hb-slider'); slider.type = 'range'; slider.min = min; slider.max = max; slider.step = 1;
      slider.value = sandbox[name]; slider.dataset.hbSlider = name;
      slider.setAttribute('aria-label', labelText + ' — ползунок');
      slider.setAttribute('aria-valuemin', String(min)); slider.setAttribute('aria-valuemax', String(max));
      slider.setAttribute('aria-valuenow', String(sandbox[name]));
      label.append(input); control.append(label, slider); controls.append(control); inputs[name] = input; sliders[name] = slider;
    }
    const model = el('div', 'hb-sandbox-model'), interpretations = el('div', 'hb-interpretations'), status = el('p', 'hb-feedback');
    status.setAttribute('role', 'status');
    function draw() {
      let valid = true;
      for (const [name, input] of Object.entries(inputs)) {
        const value = Number(input.value);
        const inRange = input.value !== '' && Number.isInteger(value) && value >= Number(input.min) && value <= Number(input.max);
        input.setAttribute('aria-invalid', String(!inRange));
        if (inRange) { sliders[name].value = String(value); sliders[name].setAttribute('aria-valuenow', String(value)); }
        else valid = false;
      }
      const total = Number(inputs.total.value), capacity = Number(inputs.capacity.value);
      if (!valid) {
        status.textContent = 'Выбери целые числа: всего предметов — от 2 до 20, в полной группе — от 2 до 6.'; return;
      }
      sandbox.total = total; sandbox.capacity = capacity; status.textContent = '';
      const q = Math.floor(total / capacity), r = total % capacity;
      model.replaceChildren(); interpretations.replaceChildren();
      model.setAttribute('role', 'img'); model.setAttribute('aria-label', 'Полных групп: ' + q + '. Остаток: ' + r + '.');
      for (let index = 0; index < q; index++) {
        const group = el('div', 'hb-target'); group.dataset.amount = capacity;
        group.append(el('span', 'hb-target-label', 'Полная группа ' + (index + 1)), slots({capacity, item: '●'}, capacity)); model.append(group);
      }
      const remainder = el('div', 'hb-sandbox-remainder');
      remainder.append(el('span', 'hb-stock-label', 'Осталось: ' + r), tokens('●', r)); model.append(remainder);
      for (const text of [
        r ? 'Нацело: не делится. Не все группы получаются полными.' : 'Нацело: ' + total + ' : ' + capacity + ' = ' + q + '.',
        'С остатком: ' + total + ' = ' + q + ' × ' + capacity + ' + ' + r + '.',
        'Только полные наборы: ' + q + '.',
        'Вместить всё: ' + (q + Number(r > 0)) + (r ? '. Для остатка нужна ещё одна ёмкость.' : '. Дополнительная ёмкость не нужна.')
      ]) interpretations.append(el('p', '', text));
    }
    for (const input of Object.values(inputs)) input.addEventListener('input', draw);
    for (const [name, slider] of Object.entries(sliders)) slider.addEventListener('input', () => { inputs[name].value = slider.value; draw(); });
    details.addEventListener('toggle', () => { sandbox.open = details.open; });
    details.append(controls, model, interpretations, status); draw(); return details;
  }

  function render(focus = false) {
    const id = route(); if (!id) return;
    state.current = id;
    const mission = find(id), run = state.runs[id] ||= freshRun(mission);
    save(); host.replaceChildren(); host.dataset.stage = run.stage; host.dataset.kind = mission.kind;
    const chooser = el('details', 'hb-missions');
    chooser.append(el('summary', '', 'Выбрать отправку · ' + missions.length));
    const nav = el('nav', 'hb-mission-list'); nav.setAttribute('aria-label', 'Миссии порта');
    missions.forEach(item => {
      const link = el('a', 'hb-mission', item.id + '. ' + item.title + (state.completed.includes(item.id) ? ' · решено' : ''));
      link.href = '#harbor-' + item.id; link.dataset.complete = String(state.completed.includes(item.id));
      if (item.id === id) link.setAttribute('aria-current', 'step'); nav.append(link);
    });
    chooser.append(nav);
    const progress = el('div', 'hb-progress');
    const meter = el('progress'); meter.max = missions.length; meter.value = state.completed.length; meter.setAttribute('aria-label', 'Решено миссий');
    progress.append(el('span', '', 'Решено миссий: ' + state.completed.length + ' из ' + missions.length), meter);
    const board = el('article', 'hb-board'); board.dataset.kind = mission.kind;
    const title = el('h2', 'hb-title', mission.title); title.tabIndex = -1;
    board.append(el('p', 'hb-step', 'Отправка ' + id + ' из ' + missions.length), title, el('p', 'hb-prompt', mission.prompt));
    host.append(chooser, progress, board);
    const report = el('p', 'hb-feedback'); report.setAttribute('role', 'status');
    function finish() {
      const storage = el('p', 'hb-storage', storageMessage); storage.hidden = !storageMessage;
      host.append(exploration(), storage); if (focus) title.focus(); announce();
    }
    function advance(stage) { run.stage = stage; run.feedback = ''; run.invalid = []; save(); render(true); }
    if (run.stage === 'complete') {
      board.append(el('p', 'hb-result', 'Отправка решена!'));
      snapshot(board, mission, run.piles);
      const q = Math.floor(mission.total / mission.capacity), r = mission.total % mission.capacity;
      board.append(el('p', 'hb-equation', mission.total + ' = ' + q + ' × ' + mission.capacity + ' + ' + r), el('p', 'hb-explanation', explain(mission)));
      const actions = el('div', 'hb-actions');
      const order = missions.slice(missions.indexOf(mission) + 1).concat(missions.slice(0, missions.indexOf(mission) + 1));
      const next = order.find(item => !state.completed.includes(item.id));
      actions.append(button(next ? 'Следующая отправка' : 'Вернуться в город', 'next', () => { location.hash = next ? 'harbor-' + next.id : 'workshop'; }, 'hb-primary'));
      actions.append(button('Решить эту отправку ещё раз', 'replay', () => { state.runs[id] = freshRun(mission); save(); render(true); }));
      board.append(actions); finish(); return;
    }
    if (run.stage === 'answer') {
      snapshot(board, mission, run.piles);
      const form = el('form', 'hb-answer'); form.append(el('p', 'hb-question', mission.question));
      const inputs = [], labels = [mission.answerLabel, 'Осталось на причале'];
      for (let index = 0; index < fieldCount(mission); index++) {
        const label = el('label', 'hb-field', labels[index]), input = el('input', 'hb-input');
        input.name = index ? 'remainder' : 'groups'; input.inputMode = 'numeric'; input.autocomplete = 'off'; input.maxLength = 4; input.value = run.values[index];
        if (run.invalid.includes(index)) input.setAttribute('aria-invalid', 'true');
        input.addEventListener('input', () => { run.values[index] = input.value; run.invalid = run.invalid.filter(item => item !== index); input.removeAttribute('aria-invalid'); save(); });
        label.append(input); form.append(label); inputs.push(input);
      }
      const check = el('button', 'hb-primary', 'Проверить ответ'); check.type = 'submit'; check.dataset.hbAction = 'check-answer';
      const actions = el('div', 'hb-actions'); actions.append(check, button('Вернуться к грузу', 'edit', () => advance('layout'))); form.append(actions);
      if (run.feedback === 'answer') report.textContent = answerFeedback(mission, run);
      form.addEventListener('submit', event => {
        event.preventDefault(); run.values = inputs.map(input => input.value); run.invalid = invalidFields(mission, run.values);
        inputs.forEach((input, index) => input.setAttribute('aria-invalid', String(run.invalid.includes(index))));
        if (run.invalid.length) {
          run.feedback = 'answer'; report.textContent = answerFeedback(mission, run); save(); inputs[run.invalid[0]].focus(); return;
        }
        if (!state.completed.includes(id)) state.completed.push(id);
        advance('complete');
      });
      board.append(form, report); finish(); return;
    }

    const stock = el('div', 'hb-stock'), targets = el('div', 'hb-targets'), actions = el('div', 'hb-actions');
    board.append(el('p', 'hb-instruction', 'Нажми на место, чтобы положить предмет.'), stock, targets);
    const controls = [];
    const check = button('Проверить раскладку', 'check-layout', () => {
      const issue = layoutIssue(mission, run.piles);
      if (issue) { run.feedback = 'layout'; report.textContent = issue; save(); }
      else advance('answer');
    }, 'hb-primary');
    const undo = button('Отменить ход', 'undo', () => {
      const move = run.moves.pop(); if (move) moveItem(move.bin, -move.delta, false);
    });
    const hint = el('p', 'hb-hint', mission.hint); hint.id = 'hb-current-hint'; hint.hidden = !run.hint;
    const hintButton = button('Подсказка', 'hint', () => { run.hint = !run.hint; hint.hidden = !run.hint; hintButton.setAttribute('aria-expanded', String(run.hint)); save(); });
    hintButton.setAttribute('aria-controls', hint.id); hintButton.setAttribute('aria-expanded', String(run.hint));
    for (let index = 0; index < run.piles.length; index++) {
      const group = el('div', 'hb-target');
      const place = button('', 'place', () => moveItem(index, 1), 'hb-place'); place.dataset.bin = index;
      const take = button('Забрать', 'return', () => moveItem(index, -1), 'hb-return'); take.dataset.bin = index;
      take.setAttribute('aria-label', 'Забрать один предмет. ' + mission.container + ' ' + (index + 1));
      group.append(place, take); targets.append(group); controls.push({group, place, take});
    }
    function redraw() {
      const remaining = left(mission, run.piles);
      stock.replaceChildren(el('span', 'hb-stock-label', 'На причале осталось: ' + remaining), tokens(mission.item, remaining));
      controls.forEach(({group, place, take}, index) => {
        const amount = run.piles[index]; group.dataset.amount = amount;
        place.replaceChildren(el('span', 'hb-target-label', mission.container + ' ' + (index + 1)), el('span', 'hb-capacity', 'Мест: ' + mission.capacity), slots(mission, amount));
        place.setAttribute('aria-label', 'Положить ' + mission.itemName + '. ' + mission.container + ' ' + (index + 1) + '. Занято ' + amount + ' из ' + mission.capacity + '.');
        place.disabled = !remaining || amount === mission.capacity; take.disabled = amount === 0;
      });
      undo.disabled = !run.moves.length;
    }
    function moveItem(bin, delta, remember = true) {
      if (delta === 1 && (left(mission, run.piles) <= 0 || run.piles[bin] >= mission.capacity) || delta === -1 && run.piles[bin] <= 0) return;
      const previous = document.activeElement;
      run.piles[bin] += delta; if (remember) run.moves.push({bin, delta}); run.feedback = '';
      redraw(); save();
      if (delta > 0) Array.from(controls[bin].place.querySelectorAll('.hb-token')).at(-1)?.classList.add('adv-token-arrive');
      report.textContent = mission.container + ' ' + (bin + 1) + ': ' + run.piles[bin] + ' из ' + mission.capacity + '. На причале осталось: ' + left(mission, run.piles) + '.';
      if (previous?.disabled) {
        const available = controls.find(control => !control.place.disabled);
        (available?.place || check).focus();
      }
    }
    actions.append(check, undo, hintButton); board.append(actions, report, hint);
    if (run.feedback === 'layout') report.textContent = layoutIssue(mission, run.piles);
    redraw(); finish();
  }
  window.addEventListener('hashchange', () => render(true));
  render();
})();

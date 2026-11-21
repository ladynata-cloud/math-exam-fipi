'use strict';

(() => {
  const host = document.getElementById('workshop-play');
  const places = window.ArzhenikovLife?.places;
  if (!host || !places?.length) return;

  const key = 'mathexam.arzhenikov.workshop.v1';
  const seriesLength = 3;
  const stages = ['layout', 'answer', 'practice-done', 'notation', 'notation-done', 'complete'];
  const newRun = (round = 0) => ({
    round, step: 0, stage: 'layout', piles: [], moves: [], solved: [], answer: '', hint: false
  });
  const fresh = () => ({active: places[0].id, completed: [], runs: {}});
  const findPlace = id => places.find(place => place.id === id);
  let state = fresh();
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (saved && findPlace(saved.active) && Array.isArray(saved.completed) && saved.runs && typeof saved.runs === 'object') state = saved;
  } catch { /* The workshop also works for the current tab. */ }

  const storyId = (place, index) => place.id + '/' + index;
  const storyKinds = new Map();
  for (const place of places) place.scenes.forEach((scene, index) => storyKinds.set(storyId(place, index), scene.kind));
  const answered = new Set();
  if (Array.isArray(state.answeredStories)) {
    for (const id of state.answeredStories) if (storyKinds.has(id)) answered.add(id);
  } else {
    for (const place of places) {
      const run = state.runs[place.id];
      const finished = state.completed.includes(place.id);
      // The old format marked a place only at the end of its first series.
      if (finished) {
        for (let i = 0; i < seriesLength; i++) answered.add(storyId(place, i));
      }
      if (!run || !Number.isInteger(run.round) || run.round < 0 || !Array.isArray(run.solved)) continue;
      const offset = run.round * seriesLength;
      if (offset + seriesLength > place.scenes.length) continue;
      // Returning to an unfinished first series implies a full cycle of replays.
      if (finished && run.round === 0 && run.stage !== 'complete' && stages.includes(run.stage)) {
        place.scenes.forEach((_, i) => answered.add(storyId(place, i)));
      }
      run.solved.slice(0, seriesLength).forEach((piles, i) => {
        const scene = place.scenes[offset + i];
        if (Array.isArray(piles) && piles.length === scene.targets.length &&
            piles.every(n => Number.isInteger(n) && n >= 0) && remaining(scene, piles) === 0 && !validateLayout(scene, piles)) {
          answered.add(storyId(place, offset + i));
        }
      });
    }
  }
  window.ArzhenikovWorkshopProgress = () => {
    const skills = {share: 0, pack: 0, count: 0};
    for (const id of answered) skills[storyKinds.get(id)]++;
    return {active: state.active, completed: [...state.completed], skills};
  };
  function announceProgress() { window.dispatchEvent(new Event('workshop-progress')); }
  function save() {
    state.answeredStories = [...answered];
    try { localStorage.setItem(key, JSON.stringify(state)); }
    catch {
      const status = document.getElementById('storage');
      if (status) status.textContent = 'В этой вкладке можно продолжать занятие. Сохранение после закрытия недоступно.';
    }
  }
  function element(tag, className, text) {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (text !== undefined) item.textContent = text;
    return item;
  }
  function action(text, name, fn, className) {
    const button = element('button', className, text);
    button.type = 'button';
    button.dataset.action = name;
    button.addEventListener('click', fn);
    return button;
  }
  function link(text, hash) {
    const a = element('a', 'ws-link', text);
    a.href = '#' + hash;
    return a;
  }
  function icons(symbol, count) {
    const wrap = element('span', 'ws-tokens');
    wrap.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < count; i++) wrap.append(element('span', 'ws-token', symbol));
    return wrap;
  }
  function currentPlace() {
    const hash = location.hash;
    if (hash === '' || hash === '#workshop') return findPlace(state.active);
    if (hash.startsWith('#workshop-')) return findPlace(hash.slice('#workshop-'.length));
  }
  function remaining(scene, piles) {
    return scene.total - piles.reduce((sum, n) => sum + n, 0);
  }
  function validateLayout(scene, piles) {
    if (remaining(scene, piles) > 0) return 'На столе ещё есть предметы. Найди место для каждого.';
    if (scene.kind === 'share') {
      if (piles.some(n => n !== scene.size)) return 'Пока получилось не поровну. Сравни, где больше и где меньше. Кнопка «Забрать» вернёт один предмет на стол.';
    } else if (piles.some(n => n !== scene.size && (scene.kind !== 'pack' || n !== 0))) {
      return scene.kind === 'pack'
        ? 'Проверь каждую собранную группу. В ней должно быть ровно ' + scene.size + '. Лишний предмет можно забрать и переложить. Пустые места можно оставить.'
        : 'Сравни раскладку с условием. В каждом месте должно оказаться ровно ' + scene.size + '. Предмет можно забрать и переложить.';
    }
    return '';
  }
  function answerFor(scene) {
    if (scene.kind === 'share') return scene.size;
    if (scene.kind === 'pack') return scene.total / scene.size;
    return scene.total;
  }
  function expression(scene) {
    if (scene.kind === 'count') return scene.size + ' × ' + scene.targets.length + ' = ' + scene.total;
    const divisor = scene.kind === 'pack' ? scene.size : scene.targets.length;
    return scene.total + ' : ' + divisor + ' = ' + answerFor(scene);
  }
  function correctCount(scene) {
    if (scene.kind === 'share') return 'Посмотри, сколько предметов находится в одном месте.';
    if (scene.kind === 'pack') return 'Посчитай только полностью собранные группы.';
    return 'Посчитай все разложенные предметы. Можно идти от одной группы к следующей.';
  }
  function picture(parent, scene, piles) {
    const list = element('div', 'ws-summary');
    piles.forEach((amount, i) => {
      if (scene.kind === 'pack' && !amount) return;
      const group = element('div', 'ws-snapshot');
      group.append(element('span', 'ws-name', scene.targets[i]), icons(scene.item, amount));
      group.setAttribute('aria-label', scene.targets[i] + '. Предметов ' + amount + '.');
      group.setAttribute('role', 'img');
      list.append(group);
    });
    parent.append(list);
  }

  function render(focus = false) {
    const place = currentPlace();
    if (!place) return;
    const changedPlace = state.active !== place.id;
    state.active = place.id;
    let run = state.runs[place.id];
    const rounds = Math.floor(place.scenes.length / seriesLength);
    if (!run || !stages.includes(run.stage) || !Number.isInteger(run.round) || run.round < 0 || run.round >= rounds ||
        !Number.isInteger(run.step) || run.step < 0 || run.step >= seriesLength ||
        !Array.isArray(run.solved) || !Array.isArray(run.moves) || !Array.isArray(run.piles)) {
      run = state.runs[place.id] = newRun();
    }
    const scenes = place.scenes.slice(run.round * seriesLength, (run.round + 1) * seriesLength);
    const scene = scenes[run.step];
    if (!run.piles.length) run.piles = scene.targets.map(() => 0);
    save();
    if (changedPlace) announceProgress();

    host.replaceChildren();
    host.dataset.stage = run.stage;
    const notation = run.stage.startsWith('notation');
    const complete = run.stage === 'complete';
    const step = element('p', 'ws-step', complete ? place.name : place.name + ' · ' + (notation ? 'Запись ' : 'История ') + (run.step + 1) + ' из ' + seriesLength);
    const title = element('h3', 'ws-title', complete ? 'Три истории решены и записаны' : scene.title);
    title.tabIndex = -1;
    host.append(step, title);
    if (focus) title.focus();
    function advance(stage) { run.stage = stage; save(); render(true); }
    function nextButton(label, fn) {
      host.append(action(label, 'next', fn, 'ws-next primary'));
    }
    function feedback() {
      const p = element('p', 'ws-feedback');
      p.setAttribute('role', 'status');
      return p;
    }

    if (complete) {
      const summary = element('div', 'ws-results');
      for (const example of scenes) {
        const row = element('div', 'ws-result');
        row.append(element('strong', '', example.title), element('span', 'ws-equation', expression(example)), element('p', '', example.meaning));
        summary.append(row);
      }
      host.append(summary);
      const share = scenes.find(example => example.kind === 'share');
      const pack = scenes.find(example => example.kind === 'pack');
      if (share && pack) {
        const comparison = element('details', 'ws-comparison');
        comparison.append(element('summary', '', 'Почему в двух историях стоит знак деления?'),
          element('p', '', 'В истории «' + share.title + '» число ' + share.targets.length + ' после знака деления показывает, между сколькими местами ты распределял предметы поровну.'),
          element('p', '', 'В истории «' + pack.title + '» число ' + pack.size + ' на том же месте показывает, сколько предметов ты клал в одну группу.'));
        host.append(comparison);
      }
      const actions = element('div', 'ws-actions');
      if (rounds > 1) actions.append(action('Ещё три истории здесь', 'replay', () => {
        state.runs[place.id] = newRun((run.round + 1) % rounds);
        save(); render(true);
      }));
      actions.append(link('В оранжерею равных групп', 'garden-count'), link('К делению уголком по шагам', 'count'));
      host.append(actions);
      return;
    }
    if (notation) {
      host.append(element('p', 'ws-prompt', scene.question));
      picture(host, scene, run.solved[run.step]);
      if (run.stage === 'notation-done') {
        host.append(element('p', 'ws-equation', expression(scene)), element('p', 'ws-meaning', scene.meaning));
        nextButton(run.step === seriesLength - 1 ? 'Закончить маршрут' : 'К следующей записи', () => {
          if (run.step < seriesLength - 1) {
            run.step++; advance('notation');
          } else {
            if (!state.completed.includes(place.id)) state.completed.push(place.id);
            advance('complete'); announceProgress();
          }
        });
        return;
      }
      host.append(element('p', 'ws-instruction', 'Выбери запись, которая отвечает на этот вопрос.'));
      const options = element('div', 'ws-options');
      const correct = expression(scene);
      const a = scene.kind === 'count' ? scene.size : scene.total;
      const b = scene.kind === 'pack' ? scene.size : scene.targets.length;
      const values = [a + ' + ' + b + ' = ' + (a + b), Math.max(a, b) + ' − ' + Math.min(a, b) + ' = ' + Math.abs(a - b)];
      values.splice((run.step + run.round + places.indexOf(place)) % 3, 0, correct);
      const report = feedback();
      values.forEach(value => options.append(action(value, 'choose-expression', () => {
        if (value === correct) advance('notation-done');
        else report.textContent = scene.kind === 'count' ? 'В каждой группе столько же предметов. Какая запись учитывает все одинаковые группы?' :
          scene.kind === 'pack' ? 'Ты собирал группы заданного размера. Какая запись показывает, сколько таких групп получилось?' :
            'Ты раздавал предметы поровну. Какая запись показывает, сколько получил каждый?';
      }, 'ws-option')));
      host.append(options, report);
      return;
    }
    host.append(element('p', 'ws-prompt', scene.prompt));

    if (run.stage === 'practice-done') {
      picture(host, scene, run.piles);
      host.append(element('p', 'ws-meaning', 'Получилось! ' + answerFor(scene) + ' ' + scene.unit + '.'));
      nextButton(run.step < seriesLength - 1 ? 'К следующей истории' : 'Записать три решения', () => {
        run.piles = []; run.moves = []; run.answer = ''; run.hint = false;
        if (run.step < seriesLength - 1) {
          run.step++; advance('layout');
        } else {
          run.step = 0; advance('notation');
        }
      });
      return;
    }
    if (run.stage === 'answer') {
      picture(host, scene, run.piles);
      const form = element('form', 'ws-answer');
      const label = element('label', 'ws-question', scene.question);
      const input = element('input', 'ws-input');
      input.name = 'quantity'; input.inputMode = 'numeric'; input.autocomplete = 'off';
      input.maxLength = 4; input.value = run.answer;
      input.addEventListener('input', () => { run.answer = input.value; input.removeAttribute('aria-invalid'); save(); });
      label.append(input);
      const check = element('button', 'primary', 'Проверить ответ');
      check.type = 'submit'; check.dataset.action = 'check-answer';
      const report = feedback();
      form.addEventListener('submit', event => {
        event.preventDefault();
        const value = input.value.trim();
        if (!/^\d+$/.test(value) || Number(value) !== answerFor(scene)) {
          report.textContent = value ? correctCount(scene) : 'Введи число.';
          input.setAttribute('aria-invalid', 'true'); input.focus(); return;
        }
        run.solved[run.step] = [...run.piles];
        answered.add(storyId(place, run.round * seriesLength + run.step));
        advance('practice-done'); announceProgress();
      });
      form.append(label, check, action('Вернуться к предметам', 'edit', () => advance('layout')), report);
      host.append(form);
      return;
    }

    const instruction = element('p', 'ws-instruction', 'Нажимай на место, куда хочешь положить один предмет.');
    const stock = element('div', 'ws-stock');
    const targets = element('div', 'ws-targets');
    const actions = element('div', 'ws-actions');
    const report = feedback();
    const hint = element('p', 'ws-hint', scene.hint);
    hint.id = 'ws-hint'; hint.hidden = !run.hint;
    const placesUI = [];
    const undo = action('Отменить ход', 'undo', () => {
      const move = run.moves.pop();
      if (move) applyMove(move.to, -move.delta, false);
    });
    const showHint = action('Подсказка', 'hint', () => {
      run.hint = !run.hint; hint.hidden = !run.hint;
      showHint.setAttribute('aria-expanded', String(run.hint)); save();
    });
    showHint.setAttribute('aria-expanded', String(run.hint));
    showHint.setAttribute('aria-controls', hint.id);
    const check = action('Проверить раскладку', 'check-layout', () => {
      const issue = validateLayout(scene, run.piles);
      if (issue) report.textContent = issue;
      else advance('answer');
    }, 'primary');
    scene.targets.forEach((name, i) => {
      const group = element('div', 'ws-target');
      const add = action('', 'place', () => applyMove(i, 1));
      add.className = 'ws-place'; add.dataset.index = i;
      const take = action('Забрать', 'return', () => applyMove(i, -1), 'ws-return');
      take.dataset.index = i;
      take.setAttribute('aria-label', 'Забрать один предмет. ' + name);
      group.append(add, take); targets.append(group); placesUI.push({add, take});
    });
    function redraw() {
      const left = remaining(scene, run.piles);
      const caption = scene.kind === 'count' ? (left ? 'Предметы на столе' : 'Все предметы разложены') : 'На столе осталось ' + left;
      stock.replaceChildren(element('span', 'ws-caption', caption), icons(scene.item, left));
      placesUI.forEach(({add, take}, i) => {
        const amount = run.piles[i];
        add.replaceChildren(element('span', 'ws-name', scene.targets[i]), icons(scene.item, amount));
        add.setAttribute('aria-label', 'Положить ' + scene.itemName + '. ' + scene.targets[i] + '. Сейчас предметов ' + amount + '.');
        add.disabled = left === 0;
        take.disabled = amount === 0;
      });
      undo.disabled = !run.moves.length;
    }
    function applyMove(to, delta, remember = true) {
      if (delta > 0 && !remaining(scene, run.piles) || delta < 0 && run.piles[to] === 0) return;
      const previousFocus = document.activeElement;
      run.piles[to] += delta;
      if (remember) run.moves.push({to, delta});
      redraw(); save();
      const left = remaining(scene, run.piles);
      const update = scene.kind === 'count' ? (left ? 'На столе ещё есть предметы.' : 'Все предметы разложены.') : 'На столе осталось ' + left + '.';
      report.textContent = scene.targets[to] + ' — ' + run.piles[to] + '. ' + update;
      if (previousFocus?.disabled) (remaining(scene, run.piles) ? placesUI[to].add : check).focus();
    }
    actions.append(check, undo, showHint);
    host.append(instruction, stock, targets, actions, report, hint);
    redraw();
  }

  window.addEventListener('hashchange', () => render(true));
  render();
  announceProgress();
})();

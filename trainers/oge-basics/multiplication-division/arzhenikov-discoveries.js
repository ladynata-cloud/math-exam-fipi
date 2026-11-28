'use strict';

(() => {
  const bank = window.ArzhenikovDiscoveries, host = document.getElementById('discoveries-play');
  if (!bank?.missions?.length || !host) return;
  const {missions, lines} = bank;
  const key = 'mathexam.arzhenikov.discoveries.v1';
  const ids = missions.map(mission => mission.id), stages = ['predict', 'action', 'explain', 'complete'];
  const find = id => missions.find(mission => mission.id === id);
  const cloneAction = action => ({total: action.total, piles: [...action.piles]});
  const sum = values => values.reduce((total, value) => total + value, 0);
  const remaining = action => action.total - sum(action.piles);
  const initialAction = mission => ({total: mission.activity.total, piles: [...mission.activity.initialPiles]});
  const optionExists = (question, value) => question.options.some(option => option.value === value);
  const correctNumber = (value, answer) => typeof value === 'string' && /^\d+$/.test(value.trim()) && Number(value) === answer;
  const freshRun = (mission, replay = false) => ({stage: 'predict', prediction: '', values: {}, reason: '',
    action: initialAction(mission), undoBase: initialAction(mission), moves: [], hintOpen: false, assisted: false, replay,
    accepted: [], errors: 0, attempts: {predict: 0, action: 0, explain: 0}, feedback: ''});
  const fresh = () => ({version: 1, current: ids[0], runs: {}, records: {}});
  let state = fresh(), storageMessage = '', storageBlocked = false;

  function route() {
    if (location.hash === '#discoveries') return {id: state.current};
    const match = location.hash.match(/^#discoveries-(.+)$/);
    return match ? ids.includes(match[1]) ? {id: match[1]} : {unknown: true} : null;
  }
  function live(mission, run) {
    return route()?.id === mission.id && state.current === mission.id && state.runs[mission.id] === run;
  }
  function validAction(mission, action) {
    const a = mission.activity;
    if (!action || !Number.isInteger(action.total) || action.total < 0 || action.total > (a.source === 'unlimited' ? sum(a.capacities) : a.maxTotal || Math.max(a.total, a.targetTotal)) ||
        !Array.isArray(action.piles) || action.piles.length !== a.labels.length ||
        action.piles.some((value, i) => !Number.isInteger(value) || value < 0 || value > a.capacities[i]) || remaining(action) < 0) return false;
    if (a.source === 'unlimited' && remaining(action) !== 0) return false;
    if (a.source !== 'unlimited' && !a.adjust && action.total !== a.total) return false;
    if (a.adjust === 'add' && action.total < a.total || a.adjust === 'remove' && action.total > a.total) return false;
    for (let i = 0; i < (a.lockedGroups || 0); i++) if (action.piles[i] !== a.initialPiles[i]) return false;
    return true;
  }
  function movedAction(mission, action, move) {
    const a = mission.activity, next = cloneAction(action);
    if (!move || !['place', 'take', 'add', 'remove'].includes(move.type)) return null;
    if (move.type === 'place' || move.type === 'take') {
      const i = move.bin;
      if (!Number.isInteger(i) || i < (a.lockedGroups || 0) || i >= next.piles.length) return null;
      if (move.type === 'place') {
        if (next.piles[i] >= a.capacities[i] || a.source !== 'unlimited' && !remaining(next)) return null;
        next.piles[i]++;
        if (a.source === 'unlimited') next.total++;
      } else {
        if (!next.piles[i]) return null;
        next.piles[i]--;
        if (a.source === 'unlimited') next.total--;
      }
    } else if (move.type === 'add') {
      if (a.adjust !== 'add' || next.total >= a.maxTotal) return null;
      next.total++;
    } else {
      if (a.adjust !== 'remove' || !remaining(next)) return null;
      next.total--;
    }
    return validAction(mission, next) ? next : null;
  }
  function layoutIssue(mission, action) {
    const a = mission.activity, piles = action.piles, left = remaining(action);
    if (!validAction(mission, action)) return 'Проверь раскладку: предмет не должен исчезать или появляться без действия.';
    if (a.goal === 'build') {
      if (piles.slice(0, a.groups).some(value => value !== a.size)) return 'Восстанови все полные группы. В каждой должно быть столько предметов, сколько указано в истории.';
      if (piles[a.groups] !== a.rest) return 'Проверь отдельный остаток. Это предметы за пределами полных групп.';
      return '';
    }
    if (action.total !== a.targetTotal) {
      if (mission.line === 'adjust') return 'Измени исходный запас как можно меньше, чтобы получить полные наборы. Не добавляй и не убирай целый лишний набор.';
      if (mission.line === 'boundary') return 'Проверь изменение запаса по условию: сколько предметов принесли или забрали?';
      return 'Новому получателю тоже нужен свой набор. Проверь, сколько предметов пришлось взять из шкафа.';
    }
    if (a.goal === 'equal') {
      if (left) return 'В запасе ещё есть предметы. По условию нужно раздать всё.';
      if (piles.some(value => value !== piles[0])) return 'Получились разные доли. Забери предмет из большей группы и попробуй передать в меньшую.';
      if (a.requiredSize && piles.some(value => value !== a.requiredSize)) return 'Размер каждого набора должен остаться таким, как в условии.';
    } else if (a.goal === 'full') {
      if (piles.some(value => value > 0 && value < a.size)) return 'Есть неполная группа. Проверь, чем её можно дополнить или какие предметы следует оставить отдельно.';
      if (left >= a.size) return 'В запасе хватает ещё на одну полную группу. Собери её тоже.';
    } else if (a.goal === 'all') {
      if (left) return 'Нужно отправить всё. Предметам в запасе ещё требуется место.';
      if (piles.filter(value => value > 0 && value < a.size).length > 1) return 'Груз поместился, но взяты лишние ёмкости. Переложи предметы: неполной может остаться только последняя группа.';
    } else if (a.goal === 'reserve') {
      if (piles[0] !== a.reserve) return 'Сначала проверь место «Отложить». Туда нужно положить ровно то, что требуется для первого дела.';
      if (left) return 'После первого дела остались предметы для получателей. Раздай их тоже.';
      if (piles.slice(1).some(value => value !== piles[1])) return 'Первое дело выполнено. Теперь сравни доли получателей: они должны быть равными.';
    } else if (a.goal === 'takeaway') {
      if (piles[a.reserveIndex] !== a.reserve) return 'Проверь последнее место: сколько предметов по условию нужно забрать с прежних столов?';
      if (left) return 'Предмет остался между местами. Положи его на прежний стол или в место «Забрали».';
    }
    return '';
  }
  function numericIssues(mission, run) {
    return mission.fields.filter(field => !correctNumber(run.values[field.id], field.answer));
  }
  function restoreRun(mission, saved) {
    const run = freshRun(mission, saved?.replay === true);
    if (!saved || typeof saved !== 'object') return run;
    // A damaged arrangement must never turn a helped/attempted story into a
    // fresh independent check. Keep the evidence even when its model is reset.
    run.assisted = saved.assisted === true || saved.hintOpen === true;
    run.errors = Number.isSafeInteger(saved.errors) && saved.errors >= 0 ? Math.min(saved.errors, 10000) : 0;
    if (!validAction(mission, saved.action)) { run.errors = Math.max(1, run.errors); return run; }
    run.action = cloneAction(saved.action);
    // If an undo log is absent or invalid, later moves still undo back to the
    // restored arrangement, never to an unrelated empty model.
    run.undoBase = cloneAction(run.action);
    run.stage = stages.includes(saved.stage) ? saved.stage : 'predict';
    run.prediction = optionExists(mission.prediction, saved.prediction) ? saved.prediction : '';
    run.reason = optionExists(mission.reason, saved.reason) ? saved.reason : '';
    run.hintOpen = saved.hintOpen === true;
    run.assisted = saved.assisted === true || run.hintOpen;
    run.errors = Number.isSafeInteger(saved.errors) && saved.errors >= 0 ? Math.min(saved.errors, 10000) : 0;
    for (const phase of ['predict', 'action', 'explain']) {
      const count = saved.attempts?.[phase];
      run.attempts[phase] = Number.isSafeInteger(count) && count >= 0 ? Math.min(count, 10000) : 0;
    }
    for (const field of mission.fields) run.values[field.id] = typeof saved.values?.[field.id] === 'string' ? saved.values[field.id].slice(0, 6) : '';
    run.accepted = Array.isArray(saved.accepted) ? mission.fields.filter(field => saved.accepted.includes(field.id) && correctNumber(run.values[field.id], field.answer)).map(field => field.id) : [];
    run.feedback = ['prediction', 'action', 'explain'].includes(saved.feedback) ? saved.feedback : '';
    if (Array.isArray(saved.moves) && saved.moves.length <= 2000) {
      const undoBase = validAction(mission, saved.undoBase) ? cloneAction(saved.undoBase) : initialAction(mission);
      let rebuilt = cloneAction(undoBase);
      for (const move of saved.moves) {
        rebuilt = movedAction(mission, rebuilt, move);
        if (!rebuilt) break;
      }
      if (rebuilt && rebuilt.total === run.action.total && rebuilt.piles.every((value, i) => value === run.action.piles[i])) {
        run.undoBase = undoBase;
        run.moves = saved.moves.map(move => ({type: move.type, ...(Number.isInteger(move.bin) ? {bin: move.bin} : {})}));
      } else run.undoBase = cloneAction(run.action);
    }
    if (run.stage !== 'predict' && !run.prediction) run.stage = 'predict';
    if (['explain', 'complete'].includes(run.stage) && layoutIssue(mission, run.action)) run.stage = 'action';
    if (run.stage === 'complete' && (numericIssues(mission, run).length || run.reason !== mission.reason.answer)) run.stage = 'explain';
    if (run.stage !== 'predict') {
      run.attempts.predict = Math.max(1, run.attempts.predict);
      if (run.prediction !== mission.prediction.answer) run.errors = Math.max(1, run.errors);
    }
    return run;
  }
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const saved = JSON.parse(raw);
      if (!saved || saved.version !== 1 || !saved.runs || typeof saved.runs !== 'object' || Array.isArray(saved.runs) ||
          !saved.records || typeof saved.records !== 'object' || Array.isArray(saved.records)) throw Error('invalid saved investigations');
      state.current = ids.includes(saved.current) ? saved.current : ids[0];
      for (const mission of missions) {
        if (Object.hasOwn(saved.runs, mission.id)) state.runs[mission.id] = restoreRun(mission, saved.runs[mission.id]);
        const record = saved.records[mission.id], run = state.runs[mission.id];
        if (!record || record.complete !== true || !run || !run.replay && run.stage !== 'complete') continue;
        state.records[mission.id] = {complete: true, independent: mission.mode === 'check' && record.independent === true && record.assisted !== true && record.corrected !== true,
          assisted: record.assisted === true, corrected: record.corrected === true};
        if (!run.replay) {
          state.records[mission.id].assisted ||= run.assisted;
          state.records[mission.id].corrected ||= run.errors > 0;
          if (run.assisted || run.errors) state.records[mission.id].independent = false;
        }
      }
    }
  } catch {
    state = fresh(); storageBlocked = true;
    storageMessage = 'Сохранение бюро не удалось прочитать. Оно осталось нетронутым. Здесь можно заниматься до закрытия вкладки.';
  }
  function save() {
    if (!route()?.id || storageBlocked) return;
    try { localStorage.setItem(key, JSON.stringify(state)); }
    catch { storageMessage = 'Сохранение после закрытия недоступно. В этой вкладке можно продолжать исследование.'; }
    const note = host.querySelector('.dc-storage');
    if (note) { note.textContent = storageMessage; note.hidden = !storageMessage; }
  }
  function progress() {
    const completed = ids.filter(id => state.records[id]?.complete), independent = completed.filter(id => state.records[id].independent);
    return {completed, total: missions.length, current: state.current, stage: state.runs[state.current]?.stage || 'predict', independent,
      assisted: completed.filter(id => state.records[id].assisted),
      lines: lines.map(line => ({id: line.id, name: line.name, completed: completed.filter(id => find(id).line === line.id).length,
        total: missions.filter(mission => mission.line === line.id).length, independent: independent.filter(id => find(id).line === line.id).length,
        checks: missions.filter(mission => mission.line === line.id && mission.mode === 'check').length}))};
  }
  window.ArzhenikovDiscoveriesProgress = progress;
  function announce() { window.dispatchEvent(new CustomEvent('discoveries-progress', {detail: progress()})); }
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function button(text, action, handler, primary = false) {
    const node = el('button', primary ? 'dc-primary' : '', text); node.type = 'button'; node.dataset.dcAction = action;
    node.addEventListener('click', handler); return node;
  }
  function token(item) {
    const node = el('span', 'dc-token', item); node.setAttribute('aria-hidden', 'true'); window.ArzhenikovArt?.decorate(node, item); return node;
  }
  function tokens(item, amount) {
    const row = el('span', 'dc-tokens'); row.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < amount; i++) row.append(token(item)); return row;
  }
  function questionControls(question, name, selected, onChange) {
    const fieldset = el('fieldset', 'dc-options'); fieldset.append(el('legend', '', question.text));
    for (const choice of question.options) {
      const label = el('label', 'dc-option'), input = el('input'); input.type = 'radio'; input.name = name; input.value = choice.value; input.checked = selected === choice.value;
      input.addEventListener('change', () => { if (input.checked) onChange(input.value); });
      label.append(input, el('span', '', choice.label)); fieldset.append(label);
    }
    return fieldset;
  }
  function chooser() {
    const details = el('details', 'dc-chooser'); details.append(el('summary', '', 'Выбрать другое исследование'));
    const grid = el('nav', 'dc-routes'); grid.setAttribute('aria-label', 'Истории бюро открытий');
    for (const line of lines) {
      const section = el('section', 'dc-route-line'); section.append(el('h3', '', line.icon + ' ' + line.name));
      for (const mission of missions.filter(item => item.line === line.id)) {
        const link = el('a', 'dc-route', mission.title); link.href = '#discoveries-' + mission.id;
        link.append(el('small', '', (mission.mode === 'check' ? 'Новая проверка' : 'Исследование') + (state.records[mission.id]?.complete ? ' · завершено' : '')));
        if (route()?.id === mission.id) link.setAttribute('aria-current', 'step'); section.append(link);
      }
      grid.append(section);
    }
    details.append(grid); return details;
  }
  function snapshot(parent, mission, action) {
    const grid = el('div', 'dc-targets dc-snapshot');
    action.piles.forEach((amount, i) => {
      const group = el('div', 'dc-target'); group.dataset.amount = String(amount);
      group.setAttribute('role', 'img'); group.setAttribute('aria-label', mission.activity.labels[i] + ': ' + amount);
      group.append(el('span', 'dc-target-label', mission.activity.labels[i]), tokens(mission.item, amount)); grid.append(group);
    }); parent.append(grid);
    if (remaining(action)) parent.append(el('p', 'dc-stock-label', 'Отдельно в запасе: ' + remaining(action)));
  }
  function explanationFeedback(mission, run) {
    const wrong = numericIssues(mission, run);
    if (wrong.length) return run.values[wrong[0].id]?.trim() ? wrong[0].clue : 'Впиши число в поле «' + wrong[0].label + '».';
    return run.reason ? mission.reason.clue : 'Выбери объяснение под числами.';
  }
  function render(focus = false) {
    const target = route(); if (!target) return;
    if (target.unknown) {
      host.replaceChildren(el('h2', 'dc-title', 'Выбери исследование'), el('p', '', 'Такой истории в бюро пока нет. Все доступные истории находятся ниже.'), chooser());
      host.querySelector('details').open = true; host.dataset.stage = 'choose'; delete host.dataset.mission; return;
    }
    const mission = find(target.id), run = state.runs[mission.id] ||= freshRun(mission);
    state.current = mission.id; save();
    host.replaceChildren(); host.dataset.stage = run.stage; host.dataset.mission = mission.id;
    const line = lines.find(item => item.id === mission.line), stats = progress();
    const board = el('article', 'dc-board');
    const topline = el('p', 'dc-topline', line.icon + ' ' + line.name + ' · ' + (mission.mode === 'check' ? 'Новая проверка' : 'Исследование'));
    const title = el('h2', 'dc-title', mission.title); title.tabIndex = -1;
    const story = el('p', 'dc-story', mission.story);
    board.append(topline, title, story);
    const step = el('ol', 'dc-steps');
    [['predict', 'Предположи'], ['action', 'Проверь действием'], ['explain', 'Объясни']].forEach(([value, label]) => {
      const item = el('li', '', label); if (run.stage === value) item.setAttribute('aria-current', 'step'); step.append(item);
    }); board.append(step);
    const report = el('p', 'dc-feedback'); report.setAttribute('role', 'status');
    host.append(board);
    function finish() {
      const info = el('p', 'dc-progress', 'Завершено историй: ' + stats.completed.length + ' из ' + missions.length + '. Новых проверок с первого раза без подсказки: ' + stats.independent.length + ' из 12.');
      host.append(info, chooser());
      const adult = el('details', 'dc-note'); adult.append(el('summary', '', 'Что отмечает бюро'), el('p', '', 'Первые две истории каждой линии — исследование, следующие две — новые условия для проверки. Предметами можно пользоваться. Отметка «с первого раза без подсказки» требует верного первого предположения, раскладки и объяснения. Исправления и помощь разрешены, но учитываются отдельно. Повтор знакомой истории не становится новой проверкой.'));
      const storage = el('p', 'dc-storage', storageMessage); storage.hidden = !storageMessage; host.append(adult, storage);
      if (focus) title.focus(); announce();
    }
    function advance(stage) {
      if (!live(mission, run)) return;
      run.stage = stage; run.feedback = ''; run.hintOpen = false; save(); render(true);
    }
    function addHint(parent, clue) {
      const hint = el('p', 'dc-hint', clue); hint.id = 'dc-current-hint'; hint.hidden = !run.hintOpen;
      const control = button('Хочешь подсказку?', 'hint', () => {
        if (!live(mission, run)) return;
        run.hintOpen = !run.hintOpen; if (run.hintOpen) run.assisted = true;
        hint.hidden = !run.hintOpen; control.setAttribute('aria-expanded', String(run.hintOpen)); save();
      }); control.setAttribute('aria-controls', hint.id); control.setAttribute('aria-expanded', String(run.hintOpen));
      parent.append(control); return hint;
    }
    if (run.stage === 'predict') {
      const form = el('form', 'dc-prediction');
      form.append(questionControls(mission.prediction, 'dc-predict', run.prediction, value => {
        if (!live(mission, run)) return; run.prediction = value; run.feedback = ''; report.textContent = ''; save();
      }));
      const actions = el('div', 'dc-actions'), check = el('button', 'dc-primary', 'Проверю действием');
      check.type = 'submit'; check.dataset.dcAction = 'check-predict'; actions.append(check);
      const hint = addHint(actions, mission.prediction.clue); form.append(actions, report, hint);
      if (run.feedback === 'prediction') report.textContent = 'Сначала выбери своё предположение. Проверим его на предметах.';
      form.addEventListener('submit', event => {
        event.preventDefault(); if (!live(mission, run)) return;
        if (!run.prediction) { run.feedback = 'prediction'; report.textContent = 'Сначала выбери своё предположение. Проверим его на предметах.'; save(); return; }
        // Record the forecast before the model. Do not reveal its correctness here.
        run.attempts.predict++;
        if (run.prediction !== mission.prediction.answer) run.errors++;
        advance('action');
      }); board.append(form); finish(); return;
    }
    board.append(el('p', 'dc-forecast', 'Моё предположение: ' + mission.prediction.options.find(option => option.value === run.prediction)?.label));
    if (run.stage === 'complete') {
      const record = state.records[mission.id];
      const result = el('div', 'dc-result'); result.append(el('h3', '', 'История разгадана!'));
      result.append(el('p', '', run.replay ? 'Это повтор знакомой истории. Новые отметки за него не добавляются.' : record?.independent ? 'Новое условие выполнено с первого раза без подсказки.' : run.assisted ? 'История завершена с подсказкой. Следующую новую проверку можно попробовать самостоятельно.' : run.errors ? 'История завершена с уточнением. Ты проверил предположение и исправил работу.' : 'Исследование завершено. Теперь можно попробовать новую историю.'));
      board.append(result);
      for (const equation of mission.equations) board.append(el('p', 'dc-equation', equation));
      board.append(el('p', 'dc-conclusion', mission.conclusion));
      const model = el('details', 'dc-saved-model'); model.append(el('summary', '', 'Моя раскладка')); snapshot(model, mission, run.action); board.append(model);
      const order = missions.slice(missions.indexOf(mission) + 1).concat(missions.slice(0, missions.indexOf(mission) + 1));
      const next = order.find(item => !state.records[item.id]?.complete);
      const actions = el('div', 'dc-actions');
      if (next) {
        const link = el('a', 'dc-primary', 'Следующая новая история'); link.href = '#discoveries-' + next.id; link.dataset.dcAction = 'next'; actions.append(link);
      } else { const link = el('a', 'dc-primary', 'Вернуться к карте'); link.href = '#journey'; actions.append(link); }
      actions.append(button('Повторить эту историю', 'replay', () => {
        if (!live(mission, run)) return;
        state.runs[mission.id] = freshRun(mission, true); save(); render(true);
      })); board.append(actions); finish(); return;
    }
    if (run.stage === 'explain') {
      const model = el('details', 'dc-saved-model'); model.append(el('summary', '', 'Посмотреть свою раскладку')); snapshot(model, mission, run.action); board.append(model);
      const form = el('form', 'dc-answer'), fields = el('div', 'dc-fields');
      for (const field of mission.fields) {
        const label = el('label', 'dc-field', field.label), input = el('input', 'dc-input');
        input.inputMode = 'numeric'; input.autocomplete = 'off'; input.maxLength = 6; input.value = run.values[field.id] || ''; input.dataset.dcField = field.id;
        input.readOnly = run.accepted.includes(field.id);
        if (input.readOnly) label.append(el('small', 'dc-accepted', 'Это число проверено'));
        if (run.feedback === 'explain' && !input.readOnly && input.value) input.setAttribute('aria-invalid', 'true');
        input.addEventListener('input', () => {
          if (!live(mission, run) || input.readOnly) return;
          run.values[field.id] = input.value; input.removeAttribute('aria-invalid'); run.feedback = ''; report.textContent = ''; save();
        }); label.append(input); fields.append(label);
      }
      form.append(fields, questionControls(mission.reason, 'dc-reason', run.reason, value => {
        if (!live(mission, run)) return; run.reason = value; run.feedback = ''; report.textContent = ''; save();
      }));
      const actions = el('div', 'dc-actions'), check = el('button', 'dc-primary', 'Проверить объяснение'); check.type = 'submit'; check.dataset.dcAction = 'check-explain'; actions.append(check);
      actions.append(button('Вернуться к предметам', 'edit-action', () => advance('action')));
      const hint = addHint(actions, mission.fields.map(field => field.clue).join(' ') + ' ' + mission.reason.clue);
      form.append(actions, report, hint);
      if (run.feedback === 'explain') report.textContent = explanationFeedback(mission, run);
      form.addEventListener('submit', event => {
        event.preventDefault(); if (!live(mission, run)) return;
        run.attempts.explain++;
        const wrong = numericIssues(mission, run);
        for (const field of mission.fields) {
          const input = form.querySelector('[data-dc-field="' + field.id + '"]');
          if (correctNumber(run.values[field.id], field.answer)) {
            if (!run.accepted.includes(field.id)) run.accepted.push(field.id);
            input.readOnly = true; input.removeAttribute('aria-invalid');
            if (!input.parentElement.querySelector('.dc-accepted')) input.parentElement.insertBefore(el('small', 'dc-accepted', 'Это число проверено'), input);
          } else input.setAttribute('aria-invalid', 'true');
        }
        if (wrong.length || run.reason !== mission.reason.answer) {
          if (wrong.some(field => run.values[field.id]?.trim()) || run.reason && run.reason !== mission.reason.answer) run.errors++;
          run.feedback = 'explain'; report.textContent = explanationFeedback(mission, run); save();
          (wrong.length ? form.querySelector('[data-dc-field="' + wrong[0].id + '"]') : form.querySelector('input[name="dc-reason"]'))?.focus(); return;
        }
        if (!state.records[mission.id]) state.records[mission.id] = {complete: true,
          independent: mission.mode === 'check' && !run.replay && !run.assisted && run.errors === 0,
          assisted: run.assisted, corrected: run.errors > 0};
        advance('complete');
      }); board.append(form); finish(); return;
    }
    const a = mission.activity;
    board.append(el('p', 'dc-action-instruction', mission.actionText));
    const stock = el('div', 'dc-stock'), grid = el('div', 'dc-targets'), controls = [];
    const actions = el('div', 'dc-actions'), adjustment = el('div', 'dc-adjustment');
    const check = button('Проверить действие', 'check-action', () => {
      if (!live(mission, run)) return;
      run.attempts.action++; const issue = layoutIssue(mission, run.action);
      if (issue) { run.errors++; run.feedback = 'action'; report.textContent = issue; save(); }
      else advance('explain');
    }, true);
    const undo = button('Отменить ход', 'undo', () => {
      if (!live(mission, run) || !run.moves.length) return;
      run.moves.pop(); let rebuilt = cloneAction(run.undoBase);
      for (const move of run.moves) rebuilt = movedAction(mission, rebuilt, move);
      if (!rebuilt) return;
      run.action = rebuilt; run.feedback = ''; redraw(); save(); report.textContent = 'Последний ход отменён.';
    });
    let addControl, removeControl;
    if (a.adjust === 'add') { addControl = button('Взять ещё один', 'add', () => move({type: 'add'})); adjustment.append(addControl); }
    if (a.adjust === 'remove') { removeControl = button('Убрать один из запаса', 'remove', () => move({type: 'remove'})); adjustment.append(removeControl); }
    for (let i = 0; i < a.labels.length; i++) {
      const group = el('div', 'dc-target');
      const place = button('', 'place', () => move({type: 'place', bin: i})); place.classList.add('dc-place'); place.dataset.bin = String(i);
      const take = button('Забрать', 'take', () => move({type: 'take', bin: i})); take.classList.add('dc-take'); take.dataset.bin = String(i);
      take.setAttribute('aria-label', 'Забрать один предмет. ' + a.labels[i]);
      group.append(place, take); grid.append(group); controls.push({group, place, take});
    }
    function redraw() {
      const left = remaining(run.action); host.dataset.total = a.hideTotal || a.source === 'unlimited' ? 'hidden' : String(run.action.total); host.dataset.stock = String(left);
      stock.replaceChildren();
      if (a.source === 'unlimited') {
        stock.append(el('span', 'dc-stock-label', 'Большой запас материалов'), el('span', 'dc-stock-note', 'Нажимай на нужную группу, чтобы взять для неё предмет.'));
      } else {
        const label = el('span', 'dc-stock-label', 'В запасе: ' + left); stock.append(label, tokens(mission.item, left));
        if (a.adjust) stock.append(el('small', 'dc-stock-note', a.adjust === 'add' ? 'Взяли дополнительно: ' + (run.action.total - a.total) : 'Убрали из исходного запаса: ' + (a.total - run.action.total)));
      }
      controls.forEach(({group, place, take}, i) => {
        const amount = run.action.piles[i], locked = i < (a.lockedGroups || 0);
        group.dataset.amount = String(amount); group.dataset.bin = String(i);
        place.replaceChildren(el('span', 'dc-target-label', a.labels[i]));
        if (a.goal === 'full' || a.goal === 'all') place.append(el('small', 'dc-capacity', 'Вместимость: ' + a.size));
        if (locked) place.append(el('small', 'dc-capacity', 'Этот набор сохраняем'));
        place.append(tokens(mission.item, amount), el('span', 'dc-amount', 'Сейчас: ' + amount));
        place.setAttribute('aria-label', 'Положить один предмет. ' + a.labels[i] + '. Сейчас ' + amount + '.');
        place.disabled = locked || !movedAction(mission, run.action, {type: 'place', bin: i});
        take.disabled = locked || !amount;
      });
      undo.disabled = !run.moves.length;
      if (addControl) addControl.disabled = !movedAction(mission, run.action, {type: 'add'});
      if (removeControl) removeControl.disabled = !movedAction(mission, run.action, {type: 'remove'});
    }
    function move(operation) {
      if (!live(mission, run)) return;
      const next = movedAction(mission, run.action, operation); if (!next) return;
      const previous = document.activeElement;
      run.action = next;
      // Normal investigations need only a few dozen moves. Keep a bounded, replayable undo log.
      if (run.moves.length === 2000) run.undoBase = movedAction(mission, run.undoBase, run.moves.shift());
      run.moves.push(operation);
      run.feedback = ''; redraw(); save();
      report.textContent = Number.isInteger(operation.bin) ? a.labels[operation.bin] + ': ' + run.action.piles[operation.bin] + '. Предмет можно забрать обратно.' : operation.type === 'add' ? 'Один предмет добавлен в запас.' : 'Один предмет убран из запаса.';
      if (previous?.disabled) (controls.find(control => !control.place.disabled)?.place || check).focus();
    }
    actions.append(check, undo); const hint = addHint(actions, mission.actionHint);
    board.append(stock, adjustment, grid, actions, report, hint);
    if (run.feedback === 'action') report.textContent = layoutIssue(mission, run.action);
    redraw(); finish();
  }
  window.addEventListener('hashchange', () => render(true));
  render();
})();

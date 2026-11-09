/* Bounded public mini-lessons. Native task scores and shared work are untouched. */
(function (root) {
  'use strict';
  const PREFIX = 'mathexam.oge.active.v1.';
  const gcd = (a, b) => { a = a < 0n ? -a : a; while (b) { const r = a % b; a = b; b = r; } return a; };
  function rational(n, d) {
    if (!d) return null;
    if (d < 0n) { n = -n; d = -d; }
    const g = gcd(n, d); return { n: String(n / g), d: String(d / g) };
  }
  function parseRational(value) {
    if (typeof value !== 'string' || value.length > 80) return null;
    const text = value.trim().replace(/−/g, '-').replace(/,/g, '.').replace(/⁄/g, '/');
    function part(s) {
      s = s.trim();
      if (!/^[+-]?(?:\d{1,12}(?:\.\d{1,10})?|\.\d{1,10})$/.test(s)) return null;
      const sign = s[0] === '-' ? -1n : 1n;
      s = s.replace(/^[+-]/, ''); const pieces = s.split('.'), decimals = pieces[1] || '';
      return rational(sign * BigInt((pieces[0] || '0') + decimals), 10n ** BigInt(decimals.length));
    }
    const pieces = text.split('/'); if (pieces.length > 2) return null;
    const a = part(pieces[0]); if (!a) return null;
    if (pieces.length === 1) return a;
    const b = part(pieces[1]);
    return b ? rational(BigInt(a.n) * BigInt(b.d), BigInt(a.d) * BigInt(b.n)) : null;
  }
  function isEqual(value, answer) {
    const a = typeof value === 'string' ? parseRational(value) : value;
    if (!a || !Array.isArray(answer) || answer.length !== 2 || !answer.every(Number.isSafeInteger) || answer[1] <= 0) return false;
    try {
      if (typeof a.n !== 'string' || typeof a.d !== 'string' || !/^-?\d{1,24}$/.test(a.n) || !/^\d{1,24}$/.test(a.d) || BigInt(a.d) <= 0n) return false;
      return BigInt(a.n) * BigInt(answer[1]) === BigInt(answer[0]) * BigInt(a.d);
    } catch (_) { return false; }
  }
  const escape = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const validToken = x => typeof x === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(x);
  function validValues(values, lesson) {
    return values && typeof values === 'object' && !Array.isArray(values) &&
      Object.keys(values).length === lesson.controls.length && lesson.controls.every(c => {
        const v = values[c.key]; return typeof v === 'number' && Number.isFinite(v) && v >= c.min && v <= c.max &&
          Math.abs((v - c.min) / c.step - Math.round((v - c.min) / c.step)) < 1e-8;
      });
  }
  function validEvent(e, lesson) {
    if (!e || !validToken(e.id) || !Number.isSafeInteger(e.at) || e.at < 0 || e.at > Date.now() + 86400000) return false;
    switch (e.type) {
      case 'restart': return true;
      case 'expanded': return typeof e.value === 'boolean';
      case 'nav': return ['intro', 'predict', 'experiment', 'practice', 'summary'].includes(e.phase);
      case 'pick': return ['prediction', 'concept'].includes(e.target) && Number.isInteger(e.choice) && !!lesson[e.target].options[e.choice];
      case 'prediction': case 'concept': return Number.isInteger(e.choice) && !!lesson[e.type].options[e.choice];
      case 'model': return validValues(e.values, lesson);
      case 'open': return validToken(e.token) && Number.isInteger(e.item) && !!lesson.practice[e.item];
      case 'draft': case 'answer': return validToken(e.token) && typeof e.value === 'string' && e.value.length <= 80 && (e.type !== 'answer' || !!parseRational(e.value));
      case 'hint': case 'solution': return validToken(e.token);
      default: return false;
    }
  }
  function reduceRecord(events, lesson) {
    const ordered = [...new Map(events.filter(e => validEvent(e, lesson)).map(e => [e.id, e])).values()]
      .sort((a, b) => a.at - b.at || a.id.localeCompare(b.id));
    const state = { phase: 'intro', expanded: false, values: Object.fromEntries(lesson.controls.map(c => [c.key, c.value])),
      modelChanged: false, picks: {}, prediction: null, concept: null, attempts: [], counts: { independent: 0, helped: 0, corrected: 0, familiar: 0 }, active: null };
    const attempts = new Map(), seen = new Set();
    for (const e of ordered) {
      if (e.type === 'restart') {
        state.phase = 'predict'; state.values = Object.fromEntries(lesson.controls.map(c => [c.key, c.value]));
        state.modelChanged = false; state.picks = {}; state.prediction = null; state.concept = null;
      }
      if (e.type === 'expanded') state.expanded = e.value;
      if (e.type === 'nav') state.phase = e.phase;
      if (e.type === 'pick') state.picks[e.target] = e.choice;
      if (e.type === 'prediction') state.prediction = e.choice;
      if (e.type === 'concept') state.concept = e.choice;
      if (e.type === 'model') { state.values = { ...e.values }; state.modelChanged = true; delete state.picks.concept; state.concept = null; }
      if (e.type === 'open' && !attempts.has(e.token)) {
        const item = lesson.practice[e.item];
        const attempt = { token: e.token, item: e.item, familiar: seen.has(item.id), draft: '', answers: [], hinted: false, revealed: false, solved: false, credit: null };
        seen.add(item.id); attempts.set(e.token, attempt); state.active = e.token;
      }
      const a = attempts.get(e.token);
      if (!a || e.type === 'open') continue;
      if (e.type === 'draft' && !a.solved) a.draft = e.value;
      if (e.type === 'hint') a.hinted = true;
      if (e.type === 'solution') a.revealed = true;
      if (e.type === 'answer' && !a.solved) {
        const parsed = parseRational(e.value), signature = parsed.n + '/' + parsed.d;
        if (a.answers.some(answer => answer.signature === signature)) continue;
        const correct = isEqual(parsed, lesson.practice[a.item].answer);
        a.draft = e.value; a.answers.push({ value: e.value, signature, correct });
        if (correct) {
          a.solved = true;
          a.credit = a.familiar ? 'familiar' : a.hinted || a.revealed ? 'helped' : a.answers.length > 1 ? 'corrected' : 'independent';
          state.counts[a.credit]++;
        }
      }
    }
    state.attempts = [...attempts.values()]; state.seen = [...seen]; return state;
  }
  function createStore(storage, number, lesson, onError = () => {}) {
    const prefix = PREFIX + number + '.', memory = new Map(); let failed = false;
    function events() {
      try {
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i); if (!key || !key.startsWith(prefix)) continue;
          try { const e = JSON.parse(storage.getItem(key)); if (validEvent(e, lesson)) memory.set(e.id, e); } catch (_) { /* Preserve malformed original bytes. */ }
        }
      } catch (_) { failed = true; onError(); }
      return [...memory.values()];
    }
    function add(event) {
      const prior = events(); let at = Date.now();
      for (const e of prior) if (e.at >= at) at = e.at + 1;
      const id = root.crypto && root.crypto.randomUUID ? root.crypto.randomUUID() : String(at) + '-' + Math.random().toString(36).slice(2);
      const full = { ...event, id, at };
      if (!validEvent(full, lesson)) throw new TypeError('Invalid mini-lesson event');
      memory.set(id, full);
      try { storage.setItem(prefix + id, JSON.stringify(full)); } catch (_) { failed = true; onError(); }
      return full;
    }
    return { add, events, read: () => reduceRecord(events(), lesson), failed: () => failed, prefix };
  }
  const api = { parseRational, isEqual, reduceRecord, createStore, validEvent, keyPrefix: PREFIX };
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (!root.document) return;
  const script = document.currentScript, number = Number(script && script.dataset.oaTask);
  const lesson = root.OgeActiveLearningData && root.OgeActiveLearningData.lessons[number];
  if (!lesson || root.top !== root || root.OgeCourseSharedMode === true || /[?&]selftest(?:=|&|$)/.test(location.search)) return;
  const doc = root.document, host = doc.querySelector('main') || doc.querySelector('body > .wrap') || doc.querySelector('body > .container');
  if (!host || doc.querySelector('.oa-learning')) return;
  const box = doc.createElement('details'); box.className = 'oa-learning'; box.dataset.oaTask = String(number);
  const summary = doc.createElement('summary'); summary.textContent = 'Разобраться на опыте';
  const screen = doc.createElement('section'); screen.className = 'oa-screen'; screen.setAttribute('aria-label', 'Мини-урок: ' + lesson.title);
  const storageNote = doc.createElement('p'); storageNote.className = 'oa-storage'; storageNote.setAttribute('role', 'status');
  box.append(summary, screen, storageNote); host.prepend(box);
  const storageError = () => { storageNote.textContent = 'Сохранение сейчас недоступно. Можно продолжить здесь, но после закрытия страницы эта работа может пропасть.'; };
  let storage; try { storage = root.localStorage; } catch (_) { storage = null; }
  const store = createStore(storage, number, lesson, storageError);
  let active = store.read().active, phase = store.read().phase, transient = '';
  api.readRecord = () => store.read(); api.getEvents = () => store.events(); root.OgeActiveLearning = api;
  box.open = store.read().expanded;
  box.addEventListener('toggle', () => { if (box.open !== store.read().expanded) store.add({ type: 'expanded', value: box.open }); });
  const button = (action, text, extra = '') => '<button type="button" data-oa-action="' + action + '" ' + extra + '>' + escape(text) + '</button>';
  const fmt = value => String(value).replace('.', ',');
  const feedback = text => '<p class="oa-feedback" data-oa-feedback role="status">' + escape(text) + '</p>';
  function pickView(target, state) {
    return '<div class="oa-options" data-oa-question="' + target + '">' + lesson[target].options.map((o, i) =>
      '<button type="button" data-oa-choice="' + i + '" data-oa-target="' + target + '" aria-pressed="' + (state.picks[target] === i) + '">' + escape(o.text) + '</button>').join('') + '</div>';
  }
  function getAttempt(state) { return state.attempts.find(a => a.token === active) || state.attempts.find(a => a.token === state.active); }
  function openNext() {
    const state = store.read(), old = getAttempt(state);
    const start = old ? (old.item + 1) % lesson.practice.length : 0;
    let item = start;
    for (let offset = 0; offset < lesson.practice.length; offset++) {
      const index = (start + offset) % lesson.practice.length;
      if (!state.seen.includes(lesson.practice[index].id)) { item = index; break; }
    }
    const token = root.crypto && root.crypto.randomUUID ? root.crypto.randomUUID() : 't' + Date.now() + Math.random().toString(36).slice(2);
    store.add({ type: 'open', item, token }); active = token; phase = 'practice'; store.add({ type: 'nav', phase });
  }
  function scoreView(state) {
    const c = state.counts;
    return '<p class="oa-results" data-oa-summary>В мини-уроке: самостоятельно ' + c.independent +
      ' · с опорой ' + c.helped + ' · после исправления ' + c.corrected + ' · знакомых повторов ' + c.familiar + '.</p>';
  }
  function mistakeText(item, attempt) {
    if (!attempt.answers.length) return '';
    const last = attempt.answers[attempt.answers.length - 1];
    if (last.correct) return { independent: 'Верно с первой попытки, без открытой помощи. Это новый пример.', helped: 'Верно. Ты разобрался с опорой. Теперь попробуй другой пример без помощи.', corrected: 'Верно после исправления. Попробуй ещё один новый пример.', familiar: 'Верно. Это повтор уже знакомого условия.' }[attempt.credit];
    const specific = (item.mistakes || []).find(m => isEqual(last.value, m.answer));
    return specific ? specific.message : 'Пока не совпало. Проверь действие, знак и единицу ответа. Твой ввод сохранён.';
  }
  function render(focus = false) {
    const state = { ...store.read(), phase }; if (state.phase === 'practice' && !getAttempt(state)) { openNext(); return render(focus); }
    screen.dataset.oaPhase = state.phase;
    if (state.phase !== 'practice') delete screen.dataset.oaItem;
    const phases = ['Прогноз', 'Опыт', 'Самостоятельно', 'Итог'];
    const at = { intro: -1, predict: 0, experiment: 1, practice: 2, summary: 3 }[state.phase];
    let html = '<ol class="oa-route" aria-label="Шаги мини-урока">' + phases.map((p, i) => '<li' + (i === at ? ' aria-current="step"' : '') + '>' + escape(p) + '</li>').join('') + '</ol>';
    html += '<h2 tabindex="-1">' + escape(lesson.title) + '</h2>';
    if (state.phase === 'intro') {
      html += '<p>' + escape(lesson.goal) + '</p><p>Сначала сделай предположение. Затем проверь его на модели и реши новые примеры.</p><div class="oa-actions">' + button('begin', 'Начать с прогноза') + button('skip', 'Проверить себя', 'class="oa-secondary"') + '</div>';
    } else if (state.phase === 'predict') {
      html += '<p>' + escape(lesson.prediction.prompt) + '</p>' + pickView('prediction', state) + feedback(transient) + button('check-prediction', 'Проверить прогноз', state.picks.prediction === undefined ? 'disabled' : '');
    } else if (state.phase === 'experiment') {
      const previous = lesson.prediction.options[state.prediction];
      if (previous) html += '<p class="oa-observation">' + escape(previous.feedback) + '</p>';
      html += '<p>' + escape(lesson.experimentPrompt) + '</p><div class="oa-controls">';
      for (const c of lesson.controls) {
        html += '<label>' + escape(c.label);
        if (c.options) html += '<select data-oa-control="' + c.key + '" aria-label="' + escape(c.label) + '">' + c.options.map(o => '<option value="' + o.value + '"' + (state.values[c.key] === o.value ? ' selected' : '') + '>' + escape(o.label) + '</option>').join('') + '</select>';
        else html += '<output data-oa-output="' + c.key + '">' + escape(fmt(state.values[c.key])) + '</output><input type="range" data-oa-control="' + c.key + '" aria-label="' + escape(c.label) + '" min="' + c.min + '" max="' + c.max + '" step="' + c.step + '" value="' + state.values[c.key] + '">';
        html += '</label>';
      }
      const model = lesson.model(state.values);
      html += '</div><div class="oa-model" data-oa-model>' + model.html + '</div><p class="oa-caption" data-oa-caption>' + escape(model.caption) + '</p>';
      html += '<h3>Что заметил?</h3><p>' + escape(lesson.concept.prompt) + '</p>' + pickView('concept', state);
      const result = state.concept === null ? '' : lesson.concept.options[state.concept].feedback;
      html += feedback(transient || result || (!state.modelChanged ? 'Измени одно значение в модели, затем выбери объяснение.' : '')) + button('check-concept', 'К новому примеру', !state.modelChanged || state.picks.concept === undefined ? 'disabled' : '');
    } else if (state.phase === 'practice') {
      const a = getAttempt(state), item = lesson.practice[a.item]; active = a.token;
      screen.dataset.oaItem = item.id;
      html += '<p class="oa-eyebrow">' + (a.familiar ? 'Повтор знакомого условия' : 'Новый пример') + '</p><p class="oa-problem">' + escape(item.prompt) + '</p>';
      html += '<form data-oa-form novalidate><label class="oa-answer-label">Твой ответ<input data-oa-answer aria-label="Твой ответ в мини-уроке" inputmode="text" autocomplete="off" maxlength="80" value="' + escape(a.draft) + '"' + (a.solved ? ' readonly' : '') + '></label><p class="oa-format">Можно числом или дробью: 1,5 или 3/2.</p><button type="submit" data-oa-action="check-answer"' + (a.solved ? ' disabled' : '') + '>Проверить ответ</button></form>';
      html += feedback(transient || mistakeText(item, a));
      if (a.hinted) html += '<p class="oa-help">' + escape(item.hint) + '</p>';
      if (a.revealed) html += '<p class="oa-help">' + escape(item.solution) + '</p>';
      if (!a.solved) html += '<div class="oa-actions">' + (!a.hinted ? button('hint', 'Нужен намёк', 'class="oa-secondary"') : '') + (a.answers.length >= 2 && !a.revealed ? button('solution', 'Посмотреть разбор', 'class="oa-secondary"') : '') + '</div>';
      if (a.solved || a.revealed) html += '<div class="oa-actions">' + button('next', state.seen.length < lesson.practice.length ? 'Другой пример без помощи' : 'Повторить знакомый пример') + button('summary', 'Посмотреть итог', 'class="oa-secondary"') + '</div>';
      html += scoreView(state);
    } else {
      delete screen.dataset.oaItem;
      const exhausted = state.seen.length >= lesson.practice.length;
      html += scoreView(state) + '<p>' + (state.counts.independent >= 2 ? 'Два новых примера решены самостоятельно. Переходи к заданиям тренажёра и применяй этот приём.' : exhausted ? 'Все условия этого мини-урока уже знакомы. Закрепи приём на других заданиях основного тренажёра; здесь можно повторить знакомые примеры.' : 'Для переноса попробуй два новых примера без подсказок. Можно продолжить мини-урок или закрепить приём в заданиях.') + '</p>';
      html += '<ul class="oa-history">' + state.attempts.map(a => '<li>' + escape(lesson.practice[a.item].prompt) + ' — ' + escape(a.solved ? { independent: 'самостоятельно', helped: 'с опорой', corrected: 'после исправления', familiar: 'знакомый повтор' }[a.credit] : a.revealed ? 'разбор открыт' : 'ещё не решено') + '</li>').join('') + '</ul><div class="oa-actions">' + button('next', exhausted ? 'Повторить знакомый пример' : 'Ещё один пример') + button('repeat', 'Повторить опыт', 'class="oa-secondary"') + '</div>';
    }
    html += '<div class="oa-footer">' + button('native', 'К заданиям тренажёра', 'class="oa-secondary"') + '<p>Результаты этого мини-урока показаны отдельно от основных заданий.</p></div>';
    screen.innerHTML = html;
    if (focus) screen.querySelector('h2').focus({ preventScroll: true });
    if (store.failed()) storageError();
  }
  function checkAnswer() {
    const state = store.read(), a = getAttempt(state); if (!a || a.solved) return;
    const input = screen.querySelector('[data-oa-answer]'), value = input.value;
    const parsed = parseRational(value);
    if (!parsed) { transient = value.trim() ? 'Нужна числовая запись или дробь с ненулевым знаменателем. Например: 1,5 или 3/2. Попытка не потрачена.' : 'Сначала введи свой ответ. Попытка не потрачена.'; render(); screen.querySelector('[data-oa-answer]').focus({ preventScroll: true }); return; }
    const signature = parsed.n + '/' + parsed.d;
    if (a.answers.some(answer => answer.signature === signature)) { transient = 'Этот ответ уже проверен. Измени его или воспользуйся намёком.'; render(); screen.querySelector('[data-oa-answer]').focus({ preventScroll: true }); return; }
    store.add({ type: 'answer', token: a.token, value }); transient = ''; render();
    const next = screen.querySelector('[data-oa-action="next"]');
    (next || screen.querySelector('[data-oa-answer]')).focus({ preventScroll: true });
  }
  screen.addEventListener('submit', e => { if (e.target.matches('[data-oa-form]')) { e.preventDefault(); checkAnswer(); } });
  screen.addEventListener('input', e => {
    if (e.target.matches('[data-oa-answer]')) { const a = getAttempt(store.read()); if (a && !a.solved) store.add({ type: 'draft', token: a.token, value: e.target.value.slice(0, 80) }); return; }
    const key = e.target.dataset.oaControl; if (!key) return;
    const state = store.read(), values = { ...state.values, [key]: Number(e.target.value) };
    if (!validValues(values, lesson) || values[key] === state.values[key]) return;
    store.add({ type: 'model', values }); transient = '';
    const model = lesson.model(values); screen.querySelector('[data-oa-model]').innerHTML = model.html;
    screen.querySelector('[data-oa-caption]').textContent = model.caption;
    const output = screen.querySelector('[data-oa-output="' + key + '"]');
    if (output) output.textContent = fmt(values[key]);
    screen.querySelectorAll('[data-oa-target="concept"]').forEach(b => b.setAttribute('aria-pressed', 'false'));
    screen.querySelector('[data-oa-feedback]').textContent = 'Теперь выбери объяснение.';
    screen.querySelector('[data-oa-action="check-concept"]').disabled = true;
  });
  screen.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.hasAttribute('data-oa-choice')) {
      const target = b.dataset.oaTarget, choice = Number(b.dataset.oaChoice);
      store.add({ type: 'pick', target, choice }); transient = ''; render();
      screen.querySelector('[data-oa-target="' + target + '"][data-oa-choice="' + choice + '"]').focus({ preventScroll: true }); return;
    }
    const action = b.dataset.oaAction, state = store.read(), a = getAttempt(state); transient = '';
    if (action === 'check-answer') return; // The form submit handles mouse and Enter exactly once.
    if (action === 'begin' || action === 'repeat') { store.add({ type: 'restart' }); phase = 'predict'; }
    if (action === 'skip' || action === 'next') openNext();
    if (action === 'check-prediction' && state.picks.prediction !== undefined) {
      store.add({ type: 'prediction', choice: state.picks.prediction }); phase = 'experiment'; store.add({ type: 'nav', phase });
    }
    if (action === 'check-concept' && state.modelChanged && state.picks.concept !== undefined) {
      const choice = state.picks.concept; store.add({ type: 'concept', choice });
      if (lesson.concept.options[choice].correct) openNext();
    }
    if (action === 'hint' && a && !a.solved) store.add({ type: 'hint', token: a.token });
    if (action === 'solution' && a && !a.solved && a.answers.length >= 2) store.add({ type: 'solution', token: a.token });
    if (action === 'summary') { phase = 'summary'; store.add({ type: 'nav', phase }); }
    if (action === 'native') { box.open = false; summary.focus(); return; }
    render(true);
  });
  render();
}(typeof window === 'object' ? window : globalThis));

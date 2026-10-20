/* One statement, optional visual help, then a reasoned answer. No network or account. */
(function () {
  'use strict';
  const cards = window.Task19Data && window.Task19Data.cards;
  const el = id => document.getElementById(id);
  const key = 'mathExam.task19.visualHints.v1';
  if (!Array.isArray(cards) || !cards.length || !window.Task19Visuals) {
    el('statement').textContent = 'Не удалось загрузить задания. Обнови страницу.';
    el('hintToggle').disabled = el('btnTrue').disabled = el('btnFalse').disabled = true;
    return;
  }
  const byId = new Map();
  cards.forEach(c => { byId.set(c.id, c); (c.aliases || []).forEach(id => byId.set(id, c)); });
  const topics = [...new Set(cards.map(c => c.theme))];
  let state = { version: 1, topic: '', review: false, records: {}, current: null };
  let mounted = false, cleanup = null, storageWorks = true;
  const integer = value => Number.isFinite(value) ? Math.max(0, Math.min(1000000, Math.floor(value))) : 0;
  function readJSON(storageKey) {
    let raw;
    try { raw = localStorage.getItem(storageKey); }
    catch (_) { storageWorks = false; return null; }
    try { return raw ? JSON.parse(raw) : null; }
    catch (_) { return null; }
  }
  function canonicalRecord(id, record) {
    const card = byId.get(id);
    if (!card || !record || typeof record !== 'object') return;
    const attempts = integer(record.attempts);
    state.records[card.id] = { attempts, correct: Math.min(attempts, integer(record.correct)), needsReview: record.needsReview === true };
  }
  function restore() {
    const saved = readJSON(key);
    if (saved && saved.version === 1 && saved.records && typeof saved.records === 'object' && !Array.isArray(saved.records)) {
      Object.entries(saved.records).forEach(([id, r]) => canonicalRecord(id, r));
      state.topic = topics.includes(saved.topic) ? saved.topic : '';
      state.review = saved.review === true;
      if (saved.current && byId.has(saved.current.id)) {
        state.current = { id: byId.get(saved.current.id).id, answer: typeof saved.current.answer === 'boolean' ? saved.current.answer : null, hintOpen: saved.current.hintOpen === true, modelState: saved.current.modelState && typeof saved.current.modelState === 'object' ? saved.current.modelState : null };
      }
      return;
    }
    // Read-only import: the previous trainers' storage is never changed or deleted.
    const previous = readJSON('task19_trainer_v1');
    if (previous && previous.progress && typeof previous.progress === 'object') {
      Object.entries(previous.progress).forEach(([id, p]) => {
        if (p && typeof p === 'object') canonicalRecord(id, { attempts: p.seen, correct: p.correct, needsReview: integer(p.seen) > 0 && p.box === 1 });
      });
    }
    const oldErrors = readJSON('geometryStatements.errors.v2');
    if (Array.isArray(oldErrors)) oldErrors.forEach(error => {
      const card = error && byId.get(error.statementId);
      if (!card) return;
      if (!state.records[card.id]) state.records[card.id] = { attempts: 0, correct: 0, needsReview: true };
      state.records[card.id].needsReview = true;
    });
  }
  function save() {
    try { localStorage.setItem(key, JSON.stringify(state)); }
    catch (_) { storageWorks = false; }
    el('storageNote').textContent = storageWorks
      ? 'Результаты сохраняются в этом браузере. В прогресс учебного кабинета они не входят.'
      : 'Браузер не разрешает сохранять результаты. Тренироваться можно; после закрытия страницы новые результаты не сохранятся.';
  }
  function filtered() {
    return cards.filter(c => (!state.topic || c.theme === state.topic) && (!state.review || state.records[c.id]?.needsReview));
  }
  function pickNext() {
    const available = filtered();
    if (!available.length) return null;
    let candidates = available.filter(c => c.id !== state.current?.id);
    if (!candidates.length) candidates = available;
    const unseen = candidates.filter(c => !state.records[c.id]?.attempts);
    if (unseen.length) candidates = unseen;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }
  function updateProgress() {
    const records = Object.values(state.records);
    const answered = records.reduce((n, r) => n + r.attempts, 0);
    const correct = records.reduce((n, r) => n + r.correct, 0);
    const mistakes = records.filter(r => r.needsReview).length;
    el('progressText').textContent = `Ответов: ${answered}. Верных: ${correct}. Повторить: ${mistakes}.`;
    el('topicCount').textContent = `Утверждений в выбранной теме: ${cards.filter(c => !state.topic || c.theme === state.topic).length}.`;
  }
  function closePreviousModel() {
    if (typeof cleanup === 'function') cleanup();
    cleanup = null; mounted = false;
    el('visualHost').replaceChildren();
  }
  function showHint(open) {
    if (!state.current) return;
    const card = byId.get(state.current.id);
    if (open && !mounted) {
      el('hintPrompt').textContent = card.hint.prompt;
      cleanup = window.Task19Visuals.mount(el('visualHost'), card.hint, {
        state:state.current.modelState,
        onChange:modelState=>{state.current.modelState=modelState;save();}
      });
      mounted = true;
    }
    state.current.hintOpen = open;
    el('hintPanel').hidden = !open;
    el('hintToggle').setAttribute('aria-expanded', String(open));
    el('hintToggle').textContent = open ? 'Скрыть подсказку' : 'Хочешь подсказку?';
    save();
  }
  function showAnswer() {
    const card = byId.get(state.current.id);
    const answer = state.current.answer;
    const correct = answer === card.truth;
    el('answerPanel').hidden = false;
    el('answerPanel').dataset.correct = String(correct);
    el('resultTitle').textContent = correct ? 'Да, ты прав.' : 'Давай разберёмся.';
    el('answerExplanation').textContent = `${card.truth ? 'Утверждение верное.' : 'Утверждение неверное.'} ${card.explanation}`;
    el('btnTrue').disabled = el('btnFalse').disabled = true;
    el('btnTrue').setAttribute('aria-pressed', String(answer));
    el('btnFalse').setAttribute('aria-pressed', String(!answer));
    el('nextCard').textContent = 'Следующее утверждение →';
    el('nextCard').classList.add('ready');
  }
  function render(moveFocus) {
    closePreviousModel();
    el('answerPanel').hidden = true;
    el('resultTitle').textContent = el('answerExplanation').textContent = '';
    el('hintPanel').hidden = true;
    el('hintPrompt').textContent = '';
    el('hintToggle').textContent = 'Хочешь подсказку?';
    el('hintToggle').setAttribute('aria-expanded', 'false');
    el('btnTrue').disabled = el('btnFalse').disabled = false;
    el('btnTrue').setAttribute('aria-pressed', 'false');
    el('btnFalse').setAttribute('aria-pressed', 'false');
    el('nextCard').classList.remove('ready');
    el('nextCard').textContent = 'Другое утверждение →';
    el('topicSelect').value = state.topic;
    el('reviewOnly').checked = state.review;
    if (!state.current) {
      el('topicLabel').textContent = state.topic || 'Все темы';
      el('statement').textContent = 'В выбранной теме нет ошибок для повторения.';
      el('hintToggle').hidden = el('answerActions').hidden = true;
      el('nextCard').textContent = 'Продолжить обычную тренировку →';
    } else {
      const card = byId.get(state.current.id);
      el('topicLabel').textContent = card.theme;
      el('statement').textContent = card.text;
      el('hintToggle').hidden = el('answerActions').hidden = false;
      if (state.current.hintOpen) showHint(true);
      if (typeof state.current.answer === 'boolean') showAnswer();
    }
    updateProgress(); save();
    if (moveFocus) el('statement').focus({ preventScroll: false });
  }
  function setCard(card) {
    state.current = card ? { id: card.id, answer: null, hintOpen: false } : null;
    render(true);
  }
  function answer(value) {
    if (!state.current || typeof state.current.answer === 'boolean') return;
    const card = byId.get(state.current.id);
    const record = state.records[card.id] || { attempts: 0, correct: 0, needsReview: false };
    record.attempts++;
    if (value === card.truth) record.correct++;
    record.needsReview = value !== card.truth;
    state.records[card.id] = record;
    state.current.answer = value;
    showAnswer(); updateProgress(); save();
  }
  restore();
  topics.forEach(topic => { const opt = document.createElement('option'); opt.value = topic; opt.textContent = topic; el('topicSelect').append(opt); });
  const requested = new URLSearchParams(location.search).get('card');
  if (requested && byId.has(requested)) {
    const card = byId.get(requested);
    if (state.current?.id !== card.id) state.current = { id: card.id, answer: null, hintOpen: false };
    state.topic = ''; state.review = false;
  }
  if (state.current && state.topic && byId.get(state.current.id).theme !== state.topic) state.current = null;
  if (!state.current) {
    const first = !state.review && !state.topic && !Object.keys(state.records).length ? byId.get('prev-056') : pickNext();
    state.current = first ? { id: first.id, answer: null, hintOpen: false } : null;
  }
  el('hintToggle').addEventListener('click', () => { if (state.current) showHint(!state.current.hintOpen); });
  el('btnTrue').addEventListener('click', () => answer(true));
  el('btnFalse').addEventListener('click', () => answer(false));
  el('nextCard').addEventListener('click', () => { if (!state.current) state.review = false; setCard(pickNext()); });
  el('topicSelect').addEventListener('change', () => { state.topic = el('topicSelect').value; setCard(pickNext()); });
  el('reviewOnly').addEventListener('change', () => { state.review = el('reviewOnly').checked; setCard(pickNext()); });
  document.addEventListener('keydown', event => {
    if (event.ctrlKey || event.altKey || event.metaKey || event.repeat || /INPUT|TEXTAREA|SELECT|BUTTON/.test(event.target?.tagName || '') || event.target?.isContentEditable) return;
    if (event.code === 'KeyJ' || event.code === 'KeyN') { event.preventDefault(); answer(event.code === 'KeyJ'); }
  });
  render(false);
})();

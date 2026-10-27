/* One statement and optional help. Shared rooms never read or write personal progress. */
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
  const adapter = window.Task19BoardSession;
  const boardMode = !!(adapter && adapter.isBoard(window));
  const room = boardMode ? adapter.create(cards, window.Task19Visuals, window.Task19Reference) : null;
  let roomAnswers = [], applyingRoom = false, notify = () => {}, notifyTimer = null, lastSent = '';
  let view = { settings: false, textbook: false, reference: [] };
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
    if (boardMode) return;
    const saved = readJSON(key);
    if (saved && saved.version === 1 && saved.records && typeof saved.records === 'object' && !Array.isArray(saved.records)) {
      Object.entries(saved.records).forEach(([id, r]) => canonicalRecord(id, r));
      state.topic = topics.includes(saved.topic) ? saved.topic : '';
      state.review = saved.review === true;
      if (saved.current && byId.has(saved.current.id)) {
        state.current = { id: byId.get(saved.current.id).id, answer: typeof saved.current.answer === 'boolean' ? saved.current.answer : null, hintOpen: saved.current.hintOpen === true, helpUsed: saved.current.helpUsed === true || saved.current.hintOpen === true || !!saved.current.modelState, modelState: saved.current.modelState && typeof saved.current.modelState === 'object' ? saved.current.modelState : null };
        state.current.answerHelpUsed = typeof saved.current.answerHelpUsed === 'boolean'
          ? saved.current.answerHelpUsed : state.current.helpUsed;
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
    if (boardMode) {
      el('storageNote').textContent = 'Общая работа в комнате. Личные результаты ученика не изменяются.';
      scheduleNotify();
      return;
    }
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
    el('progressText').textContent = boardMode
      ? `В этой комнате разобрано утверждений: ${answered}. Верных ответов: ${correct}. Повторить: ${mistakes}.`
      : `Ответов: ${answered}. Верных: ${correct}. Повторить: ${mistakes}.`;
    el('topicCount').textContent = `Утверждений в выбранной теме: ${cards.filter(c => !state.topic || c.theme === state.topic).length}.`;
  }
  function closePreviousModel() {
    if (typeof cleanup === 'function') cleanup();
    cleanup = null; mounted = false;
    el('visualHost').replaceChildren();
    if(el('referenceHost'))el('referenceHost').replaceChildren();
  }
  function showHint(open) {
    if (!state.current) return;
    const card = byId.get(state.current.id);
    if (open) state.current.helpUsed = true;
    if ((open || state.current.modelState) && !mounted) {
      el('hintPrompt').textContent = card.hint.prompt;
      cleanup = window.Task19Visuals.mount(el('visualHost'), card.hint, {
        state:state.current.modelState,
        onChange:modelState=>{state.current.modelState=modelState;save();}
      });
      if(window.Task19Reference&&el('referenceHost'))window.Task19Reference.mount(el('referenceHost'),card);
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
    const answerHelpUsed = boardMode ? roomAnswers.find(tuple => tuple[0] === card.id)?.[2] === true
      : state.current.answerHelpUsed === true;
    el('answerPanel').hidden = false;
    el('answerPanel').dataset.correct = String(correct);
    el('resultTitle').textContent = correct ? (answerHelpUsed ? 'Верно. С подсказкой.' : boardMode ? 'Верно. Разобрали на уроке.' : 'Да, ты прав.') : 'Давай разберёмся.';
    el('answerExplanation').textContent = `${card.truth ? 'Утверждение верное.' : 'Утверждение неверное.'} ${card.explanation}`;
    el('btnTrue').disabled = el('btnFalse').disabled = true;
    el('btnTrue').setAttribute('aria-pressed', String(answer));
    el('btnFalse').setAttribute('aria-pressed', String(!answer));
    el('nextCard').textContent = 'Следующее утверждение →';
    el('nextCard').classList.add('ready');
  }
  function render(moveFocus) {
    closePreviousModel();
    if(el('textbookHost'))el('textbookHost').replaceChildren();
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
      el('statement').textContent = 'В выбранной теме нет ошибок или ответов с подсказкой для повторения.';
      el('hintToggle').hidden = el('answerActions').hidden = true;
      el('nextCard').textContent = 'Продолжить обычную тренировку →';
    } else {
      const card = byId.get(state.current.id);
      el('topicLabel').textContent = card.theme;
      el('statement').textContent = card.text;
      el('hintToggle').hidden = el('answerActions').hidden = false;
      if(window.Task19TextbookReference&&el('textbookHost'))window.Task19TextbookReference.mount(el('textbookHost'),card);
      if (state.current.hintOpen || state.current.modelState) showHint(state.current.hintOpen);
      if (typeof state.current.answer === 'boolean') showAnswer();
    }
    updateProgress(); save();
    if (moveFocus) el('statement').focus({ preventScroll: false });
  }
  function setCard(card) {
    state.current = card ? { id: card.id, answer: null, hintOpen: false, helpUsed: false, modelState: null } : null;
    view.textbook = false; view.reference = [];
    render(true);
  }
  function answer(value) {
    if (!state.current || typeof state.current.answer === 'boolean') return;
    const card = byId.get(state.current.id);
    // A disclosure may have opened immediately before this click, before its
    // asynchronous toggle event. Inspect it now to keep assistance sticky.
    if (document.querySelector('#textbookHost details[open]')) state.current.helpUsed = true;
    const record = boardMode ? { attempts: 0, correct: 0, needsReview: false }
      : state.records[card.id] || { attempts: 0, correct: 0, needsReview: false };
    record.attempts++;
    if (value === card.truth) record.correct++;
    // A supported correct answer is useful practice; a fresh independent
    // correct attempt is what removes the statement from the review queue.
    record.needsReview = value !== card.truth || state.current.helpUsed === true;
    state.records[card.id] = record;
    state.current.answer = value;
    state.current.answerHelpUsed = state.current.helpUsed === true;
    if (boardMode) {
      roomAnswers = roomAnswers.filter(tuple => tuple[0] !== card.id);
      roomAnswers.push([card.id, value, state.current.helpUsed === true]);
    }
    showAnswer(); updateProgress(); save();
  }
  restore();
  topics.forEach(topic => { const opt = document.createElement('option'); opt.value = topic; opt.textContent = topic; el('topicSelect').append(opt); });
  const requested = new URLSearchParams(location.search).get('card');
  if (requested && byId.has(requested)) {
    const card = byId.get(requested);
    if (state.current?.id !== card.id) state.current = { id: card.id, answer: null, hintOpen: false, helpUsed: false, modelState: null };
    state.topic = ''; state.review = false;
  }
  if (state.current && state.topic && byId.get(state.current.id).theme !== state.topic) state.current = null;
  if (!state.current) {
    const first = !state.review && !state.topic && !Object.keys(state.records).length ? byId.get('prev-056') : pickNext();
    state.current = first ? { id: first.id, answer: null, hintOpen: false, helpUsed: false, modelState: null } : null;
  }
  el('hintToggle').addEventListener('click', () => { if (state.current) showHint(!state.current.hintOpen); });
  el('btnTrue').addEventListener('click', () => answer(true));
  el('btnFalse').addEventListener('click', () => answer(false));
  el('nextCard').addEventListener('click', () => { if (!state.current) state.review = false; setCard(pickNext()); });
  el('topicSelect').addEventListener('change', () => { state.topic = el('topicSelect').value; setCard(pickNext()); });
  el('reviewOnly').addEventListener('change', () => { state.review = el('reviewOnly').checked; setCard(pickNext()); });
  document.addEventListener('keydown', event => {
    if (event.ctrlKey || event.altKey || event.metaKey || event.repeat || /^(?:INPUT|TEXTAREA|SELECT|BUTTON|SUMMARY|A)$/.test(event.target?.tagName || '') || event.target?.closest?.('#textbookHost') || event.target?.isContentEditable) return;
    if (event.code === 'KeyJ' || event.code === 'KeyN') { event.preventDefault(); answer(event.code === 'KeyJ'); }
  });
  function readView() {
    return { settings: el('settings').open, textbook: !!document.querySelector('#textbookHost details[open]'),
      reference: [...document.querySelectorAll('#referenceHost details')].map(node => node.open) };
  }
  function getRoomState() {
    const visible = readView();
    // Native details.toggle is asynchronous; a host snapshot may be requested
    // between opening the disclosure and that event being dispatched.
    if (visible.textbook && state.current) state.current.helpUsed = true;
    const current = state.current ? { id: state.current.id, answer: state.current.answer,
      hintOpen: state.current.hintOpen === true, helpUsed: state.current.helpUsed === true,
      modelState: state.current.modelState || null } : null;
    return room.validate({ topic: state.topic, review: state.review, current, answers: roomAnswers, view: visible });
  }
  function applyRoomState(value) {
    const incoming = room.validate(value); // Reject the whole snapshot before any mutation.
    clearTimeout(notifyTimer); applyingRoom = true;
    try {
      roomAnswers = incoming.answers;
      const records = {};
      for (const [id, answer, helpUsed] of roomAnswers) records[id] = { attempts: 1, correct: Number(answer === byId.get(id).truth), needsReview: answer !== byId.get(id).truth || helpUsed === true };
      state = { version: 1, topic: incoming.topic, review: incoming.review, records, current: incoming.current };
      view = incoming.view;
      render(false);
      el('settings').open = view.settings;
      const textbook = document.querySelector('#textbookHost details');
      if (textbook) textbook.open = view.textbook;
      document.querySelectorAll('#referenceHost details').forEach((node, i) => { node.open = view.reference[i]; });
      lastSent = JSON.stringify(getRoomState());
    } finally { applyingRoom = false; }
  }
  function scheduleNotify() {
    if (!boardMode || applyingRoom) return;
    clearTimeout(notifyTimer);
    notifyTimer = setTimeout(() => {
      if (applyingRoom) return;
      const snapshot = JSON.stringify(getRoomState());
      if (snapshot !== lastSent) { lastSent = snapshot; notify(); }
    }, 0);
  }
  document.addEventListener('toggle', event => {
    if (applyingRoom || !event.target.isConnected) return;
    if (event.target.closest?.('#textbookHost') && event.target.open && state.current) {
      state.current.helpUsed = true;
      if (typeof state.current.answer === 'boolean') showAnswer();
      save();
    }
    if (event.target.id === 'settings' || event.target.closest?.('#textbookHost, #referenceHost')) scheduleNotify();
  }, true);
  render(false);
  if (boardMode) {
    const download = el('download'); if (download) download.hidden = true;
    const archive = document.querySelector('#settings a'); if (archive) archive.hidden = true;
    el('settings').querySelector('summary').textContent = 'Выбрать тему · работа в комнате';
    const api = Object.freeze({ getState: getRoomState, applyState: applyRoomState, validateState: value => { try { room.validate(value); return true; } catch (_) { return false; } } });
    window.Task19Board = api;
    window.getBoardTrainerState = getRoomState;
    window.applyBoardTrainerState = applyRoomState;
    lastSent = JSON.stringify(getRoomState());
    if (window.MathExamBoard) window.MathExamBoard.register({
      id: adapter.id, version: adapter.version, stateSchemaVersion: 1, parentOrigin: location.origin,
      getState: getRoomState, applyState: applyRoomState,
      subscribe(callback) { notify = callback; return () => { clearTimeout(notifyTimer); notify = () => {}; }; }
    });
  }
})();

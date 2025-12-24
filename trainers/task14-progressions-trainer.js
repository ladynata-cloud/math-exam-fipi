(() => {
  const LS_KEY = 'task14_progressions_trainer_v1';
  const TOLERANCE = 1e-6;
  const DATA_URL = './task14-progressions-screenshots-data.json';

  const el = (id) => document.getElementById(id);

  const state = {
    settings: {
      topic: 'all',
      mode: 'basic',
    },
    stats: {
      total: 0,
      correct: 0,
      streak: 0,
      bestStreak: 0,
      byType: {},
    },
    tasks: [],
    current: null,
    checked: false,
    hintIndex: 0,
  };

  const topics = [
    { id: 'all', label: 'Все темы' },
    { id: 'ap', label: 'Арифметическая прогрессия' },
    { id: 'gp', label: 'Геометрическая прогрессия' },
    { id: 'story', label: 'Сюжетные задачи' },
  ];

  const randomChoice = (list) => list[Math.floor(Math.random() * list.length)];

  const formatNumber = (num) => {
    const rounded = Math.abs(num) < TOLERANCE ? 0 : num;
    const str = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(6);
    return str.replace(/\.?0+$/, '');
  };

  const parseNumber = (value) => {
    if (!value) return NaN;
    const cleaned = value.replace(/\s+/g, '').replace(',', '.');
    if (cleaned.includes('/')) {
      const [left, right] = cleaned.split('/');
      const a = Number(left);
      const b = Number(right);
      if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return NaN;
      return a / b;
    }
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : NaN;
  };

  const safePushStatType = (typeId) => {
    if (!state.stats.byType[typeId]) {
      state.stats.byType[typeId] = { total: 0, correct: 0, label: '' };
    }
  };

  const getTasksByTopic = (topicId, mode) => {
    const list = state.tasks.filter((task) => task.mode === mode);
    if (topicId === 'all') return list;
    return list.filter((task) => task.topic === topicId);
  };

  const renderLoadError = (message) => {
    el('taskText').textContent = message;
    el('taskTypePill').textContent = '—';
    el('taskModePill').textContent = '—';
    el('answerInput').value = '';
    resetHints();
    resetResultBlocks();
  };

  const updateSettings = () => {
    state.settings.topic = el('topicSelect').value;
    state.settings.mode = el('modeSelect').value;
    saveState();
    renderTask();
  };

  const saveState = () => {
    localStorage.setItem(LS_KEY, JSON.stringify({
      settings: state.settings,
      stats: state.stats,
    }));
  };

  const loadState = () => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.settings) state.settings = { ...state.settings, ...parsed.settings };
      if (parsed.stats) state.stats = { ...state.stats, ...parsed.stats };
    } catch (err) {
      console.warn('Не удалось загрузить состояние', err);
    }
  };

  const resetStats = () => {
    state.stats = { total: 0, correct: 0, streak: 0, bestStreak: 0, byType: {} };
    saveState();
    renderStats();
  };

  const renderStats = () => {
    el('statAccuracy').textContent = `${state.stats.correct} / ${state.stats.total}`;
    el('statStreak').textContent = String(state.stats.streak);
    el('statBestStreak').textContent = String(state.stats.bestStreak);

    const list = el('statTypesList');
    list.innerHTML = '';
    const typeEntries = Object.entries(state.stats.byType);
    if (typeEntries.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'Нет решённых задач';
      list.appendChild(li);
      return;
    }
    typeEntries.forEach(([typeId, stats]) => {
      const li = document.createElement('li');
      li.innerHTML = `<span>${stats.label || typeId}</span><span>${stats.correct} / ${stats.total}</span>`;
      list.appendChild(li);
    });
  };

  const resetResultBlocks = () => {
    el('resultBlock').hidden = true;
    el('resultLine').textContent = '—';
    el('userAnswerText').textContent = '—';
    el('correctAnswerText').textContent = '—';
    el('solutionBtn').disabled = true;
    el('solutionBlock').hidden = true;
    el('solutionList').innerHTML = '';
  };

  const resetHints = () => {
    state.hintIndex = 0;
    el('hintList').innerHTML = '';
  };

  const renderHints = () => {
    if (!state.current) return;
    const list = el('hintList');
    const steps = state.current.steps;
    list.innerHTML = '';
    steps.slice(0, state.hintIndex).forEach((step) => {
      const li = document.createElement('li');
      li.textContent = step;
      list.appendChild(li);
    });
  };

  const renderTask = () => {
    const list = getTasksByTopic(state.settings.topic, state.settings.mode);
    if (list.length === 0) {
      state.current = null;
      renderLoadError('Нет задач для выбранных фильтров.');
      return;
    }
    const task = randomChoice(list);
    state.current = { ...task };
    state.checked = false;

    el('taskText').textContent = task.question;
    el('taskTypePill').textContent = task.label;
    el('taskModePill').textContent = task.mode === 'basic' ? 'Базовый' : 'Стандарт';
    el('answerInput').value = '';

    resetHints();
    resetResultBlocks();
  };

  const revealHint = () => {
    if (!state.current) return;
    if (state.hintIndex < state.current.steps.length) {
      state.hintIndex += 1;
      renderHints();
    }
  };

  const showSolution = () => {
    if (!state.checked || !state.current) return;
    const list = el('solutionList');
    list.innerHTML = '';
    state.current.steps.forEach((step) => {
      const li = document.createElement('li');
      li.textContent = step;
      list.appendChild(li);
    });
    el('solutionBlock').hidden = false;
  };

  const updateStats = (isCorrect, task) => {
    state.stats.total += 1;
    if (isCorrect) {
      state.stats.correct += 1;
      state.stats.streak += 1;
      state.stats.bestStreak = Math.max(state.stats.bestStreak, state.stats.streak);
    } else {
      state.stats.streak = 0;
    }
    safePushStatType(task.id);
    state.stats.byType[task.id].total += 1;
    if (isCorrect) state.stats.byType[task.id].correct += 1;
    state.stats.byType[task.id].label = task.label;
    saveState();
    renderStats();
  };

  const checkAnswer = () => {
    if (!state.current) return;
    const value = el('answerInput').value;
    const parsed = parseNumber(value);
    if (!Number.isFinite(parsed)) {
      el('resultBlock').hidden = false;
      el('resultLine').textContent = 'Введите числовой ответ (можно с запятой или дробью).';
      el('userAnswerText').textContent = value || '—';
      el('correctAnswerText').textContent = formatNumber(state.current.answer);
      el('solutionBtn').disabled = true;
      return;
    }

    const diff = Math.abs(parsed - state.current.answer);
    const isCorrect = diff <= TOLERANCE;
    state.checked = true;

    el('resultBlock').hidden = false;
    el('resultLine').textContent = isCorrect ? 'Верно! Отличная работа.' : 'Пока неверно — попробуйте ещё.';
    el('userAnswerText').textContent = formatNumber(parsed);
    el('correctAnswerText').textContent = formatNumber(state.current.answer);
    el('solutionBtn').disabled = false;
    updateStats(isCorrect, state.current);
  };

  const loadTasks = async () => {
    try {
      const response = await fetch(DATA_URL, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = await response.json();
      if (!payload || !Array.isArray(payload.tasks)) {
        throw new Error('Неверный формат данных');
      }
      if (payload.tasks.length !== 44) {
        throw new Error('Ожидалось ровно 44 задачи');
      }
      state.tasks = payload.tasks.map((task) => ({
        ...task,
        answer: Number(task.answer),
        steps: Array.isArray(task.steps) ? task.steps : [],
      }));
      return true;
    } catch (err) {
      console.error('Не удалось загрузить задания', err);
      renderLoadError('Не удалось загрузить задания. Обновите страницу.');
      return false;
    }
  };

  const init = async () => {
    loadState();
    const loaded = await loadTasks();

    const topicSelect = el('topicSelect');
    topicSelect.innerHTML = '';
    topics.forEach((topic) => {
      const opt = document.createElement('option');
      opt.value = topic.id;
      opt.textContent = topic.label;
      topicSelect.appendChild(opt);
    });
    topicSelect.value = state.settings.topic;
    el('modeSelect').value = state.settings.mode;

    topicSelect.addEventListener('change', updateSettings);
    el('modeSelect').addEventListener('change', updateSettings);
    el('newTaskBtn').addEventListener('click', renderTask);
    el('checkBtn').addEventListener('click', checkAnswer);
    el('hintBtn').addEventListener('click', revealHint);
    el('solutionBtn').addEventListener('click', showSolution);
    el('resetBtn').addEventListener('click', () => {
      resetStats();
      renderTask();
    });

    renderStats();
    if (loaded) {
      renderTask();
    }
  };

  init();
})();

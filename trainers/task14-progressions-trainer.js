(() => {
  const LS_KEY = 'task14_progressions_trainer_v1';
  const TOLERANCE = 1e-6;

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

  const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

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

  const randomRatio = (mode) => {
    if (mode === 'basic') {
      return randomChoice([2, 3, 4, 0.5]);
    }
    return randomChoice([1.2, 1.5, 2, 0.5, 0.8]);
  };

  const randomDiff = (mode) => {
    if (mode === 'basic') return randomChoice([2, 3, 4, 5, 6, 8]);
    return randomChoice([1.5, 2.5, 3, 4, 5.5]);
  };

  const templates = [
    {
      id: 'ap-nth',
      topic: 'ap',
      label: 'АП: n-й член',
      build(mode) {
        const a1 = mode === 'basic' ? randomInt(1, 9) : randomChoice([1.5, 2, 2.5, 3, 4]);
        const d = randomDiff(mode);
        const n = randomInt(6, 12);
        const an = a1 + (n - 1) * d;
        return {
          question: `Арифметическая прогрессия: a₁ = ${formatNumber(a1)}, d = ${formatNumber(d)}. Найдите aₙ при n = ${n}.`,
          answer: an,
          steps: [
            'Используем формулу aₙ = a₁ + (n − 1)·d.',
            `Подставляем: aₙ = ${formatNumber(a1)} + (${n} − 1)·${formatNumber(d)}.`,
            `Вычисляем: aₙ = ${formatNumber(an)}.`,
          ],
        };
      },
    },
    {
      id: 'ap-sum',
      topic: 'ap',
      label: 'АП: сумма',
      build(mode) {
        const a1 = mode === 'basic' ? randomInt(1, 10) : randomChoice([1.5, 2, 3, 4.5]);
        const d = randomDiff(mode);
        const n = randomInt(6, 12);
        const an = a1 + (n - 1) * d;
        const sum = (n * (a1 + an)) / 2;
        return {
          question: `Арифметическая прогрессия: a₁ = ${formatNumber(a1)}, d = ${formatNumber(d)}, n = ${n}. Найдите сумму первых n членов.`,
          answer: sum,
          steps: [
            'Сначала найдём aₙ по формуле aₙ = a₁ + (n − 1)·d.',
            `aₙ = ${formatNumber(a1)} + (${n} − 1)·${formatNumber(d)} = ${formatNumber(an)}.`,
            'Используем формулу суммы Sₙ = n·(a₁ + aₙ) / 2.',
            `Sₙ = ${n}·(${formatNumber(a1)} + ${formatNumber(an)}) / 2 = ${formatNumber(sum)}.`,
          ],
        };
      },
    },
    {
      id: 'gp-nth',
      topic: 'gp',
      label: 'ГП: n-й член',
      build(mode) {
        const a1 = mode === 'basic' ? randomInt(1, 6) : randomChoice([1.2, 2, 2.5, 3]);
        const q = randomRatio(mode);
        const n = randomInt(5, 9);
        const an = a1 * Math.pow(q, n - 1);
        return {
          question: `Геометрическая прогрессия: a₁ = ${formatNumber(a1)}, q = ${formatNumber(q)}. Найдите aₙ при n = ${n}.`,
          answer: an,
          steps: [
            'Используем формулу aₙ = a₁·qⁿ⁻¹.',
            `aₙ = ${formatNumber(a1)}·${formatNumber(q)}^${n - 1}.`,
            `aₙ = ${formatNumber(an)}.`,
          ],
        };
      },
    },
    {
      id: 'gp-sum',
      topic: 'gp',
      label: 'ГП: сумма',
      build(mode) {
        const a1 = mode === 'basic' ? randomInt(1, 5) : randomChoice([1.5, 2, 3]);
        let q = randomRatio(mode);
        if (Math.abs(q - 1) < 0.2) q = 2;
        const n = randomInt(4, 8);
        const sum = a1 * (Math.pow(q, n) - 1) / (q - 1);
        return {
          question: `Геометрическая прогрессия: a₁ = ${formatNumber(a1)}, q = ${formatNumber(q)}, n = ${n}. Найдите сумму первых n членов.`,
          answer: sum,
          steps: [
            'Используем формулу суммы Sₙ = a₁·(qⁿ − 1) / (q − 1).',
            `Sₙ = ${formatNumber(a1)}·(${formatNumber(q)}^${n} − 1) / (${formatNumber(q)} − 1).`,
            `Sₙ = ${formatNumber(sum)}.`,
          ],
        };
      },
    },
    {
      id: 'story-distance',
      topic: 'story',
      label: 'Сюжет: шаги',
      build(mode) {
        const a1 = mode === 'basic' ? randomInt(8, 14) : randomChoice([8.5, 9, 10.5, 12]);
        const d = mode === 'basic' ? randomInt(1, 3) : randomChoice([1.5, 2.5]);
        const n = randomInt(6, 10);
        const sum = (n * (2 * a1 + (n - 1) * d)) / 2;
        return {
          question: `Спортсмен в первый день пробежал ${formatNumber(a1)} км, а затем ежедневно увеличивал дистанцию на ${formatNumber(d)} км. Сколько км он пробежал за первые ${n} дней?`,
          answer: sum,
          steps: [
            'Это арифметическая прогрессия: a₁ = первая дистанция, d = прирост.',
            'Используем формулу суммы Sₙ = n·(2a₁ + (n − 1)·d) / 2.',
            `Sₙ = ${formatNumber(sum)} км.`,
          ],
        };
      },
    },
    {
      id: 'story-deposit',
      topic: 'story',
      label: 'Сюжет: вклад',
      build(mode) {
        const a1 = mode === 'basic' ? randomInt(10, 20) * 1000 : randomChoice([12500, 15000, 17500]);
        const q = mode === 'basic' ? 1.1 : randomChoice([1.08, 1.12, 1.15]);
        const n = randomInt(3, 5);
        const an = a1 * Math.pow(q, n - 1);
        return {
          question: `На счёте было ${formatNumber(a1)} ₽. Каждый год сумма увеличивается в ${formatNumber(q)} раза. Какой будет сумма через ${n} года (n-й член)?`,
          answer: an,
          steps: [
            'Это геометрическая прогрессия с множителем q.',
            'Используем формулу aₙ = a₁·qⁿ⁻¹.',
            `aₙ = ${formatNumber(an)} ₽.`,
          ],
        };
      },
    },
    {
      id: 'story-production',
      topic: 'story',
      label: 'Сюжет: выпуск',
      build(mode) {
        const a1 = mode === 'basic' ? randomInt(30, 40) : randomChoice([32.5, 35, 37.5]);
        const q = mode === 'basic' ? 0.9 : randomChoice([0.85, 0.92]);
        const n = randomInt(4, 6);
        const sum = a1 * (Math.pow(q, n) - 1) / (q - 1);
        return {
          question: `Выпуск продукции в первый месяц составил ${formatNumber(a1)} тыс. шт., затем каждый месяц уменьшался в ${formatNumber(q)} раза. Сколько всего продукции выпустили за ${n} месяцев?`,
          answer: sum,
          steps: [
            'Это геометрическая прогрессия (уменьшение в q раз).',
            'Используем формулу суммы Sₙ = a₁·(qⁿ − 1) / (q − 1).',
            `Sₙ = ${formatNumber(sum)} тыс. шт.`,
          ],
        };
      },
    },
  ];

  const getTemplatesByTopic = (topicId) => {
    if (topicId === 'all') return templates;
    return templates.filter((item) => item.topic === topicId);
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
    const list = getTemplatesByTopic(state.settings.topic);
    const template = randomChoice(list);
    const task = template.build(state.settings.mode);
    state.current = { ...task, id: template.id, label: template.label };
    state.checked = false;

    el('taskText').textContent = task.question;
    el('taskTypePill').textContent = template.label;
    el('taskModePill').textContent = state.settings.mode === 'basic' ? 'Базовый' : 'Стандарт';
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

  const init = () => {
    loadState();

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
    renderTask();
  };

  init();
})();

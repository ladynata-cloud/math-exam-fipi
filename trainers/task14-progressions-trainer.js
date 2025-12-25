(() => {
  const DATA_URL = '../data/task14-progressions-2022-2025.json';
  const TOLERANCE = 1e-6;

  const IMAGE_BY_ID = {
    7: '../assets/task14/snake.jpeg',
    8: '../assets/task14/snake.jpeg',
    9: '../assets/task14/tables.jpeg',
    10: '../assets/task14/tables.jpeg',
    25: '../assets/task14/logs.jpeg',
    26: '../assets/task14/logs.jpeg',
  };

  const HINTS_BY_TOPIC = {
    'Арифметическая прогрессия': [
      'Определи разность между соседними членами.',
      'Найди первый член и номер нужного элемента.',
      'Выбери нужный тип вычисления: n-й член или сумма.',
    ],
    'Геометрическая прогрессия': [
      'Определи знаменатель прогрессии.',
      'Найди первый член и число шагов.',
      'Выбери нужный тип вычисления: n-й член или сумма.',
    ],
  };

  const el = (id) => document.getElementById(id);

  const state = {
    tasks: [],
    current: null,
    loaded: false,
  };

  const normalizeInput = (value) => value.trim().replace(/\s+/g, '').replace(',', '.');

  const parseNumber = (value) => {
    if (!value) return NaN;
    if (value.includes('/')) {
      const [left, right] = value.split('/');
      const a = Number(left);
      const b = Number(right);
      if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return NaN;
      return a / b;
    }
    const num = Number(value);
    return Number.isFinite(num) ? num : NaN;
  };

  const getAcceptedAnswers = (task) => {
    if (!task || !task.answer) return [];
    const alternatives = Array.isArray(task.answer.alternatives) ? task.answer.alternatives : [];
    return [task.answer.canonical, ...alternatives].filter(Boolean);
  };

  const isCorrectAnswer = (input, accepted) => {
    const normalized = normalizeInput(input);
    if (!normalized) {
      return { ok: false, message: 'Введите ответ.' };
    }
    const inputNumber = parseNumber(normalized);
    for (const raw of accepted) {
      const normalizedAccepted = normalizeInput(String(raw));
      if (normalizedAccepted === normalized) {
        return { ok: true, message: 'Верно! Отличная работа.' };
      }
      const acceptedNumber = parseNumber(normalizedAccepted);
      if (Number.isFinite(inputNumber) && Number.isFinite(acceptedNumber)) {
        const diff = Math.abs(inputNumber - acceptedNumber);
        if (diff <= TOLERANCE) {
          return { ok: true, message: 'Верно! Отличная работа.' };
        }
      }
    }
    return { ok: false, message: 'Пока неверно — попробуйте ещё.' };
  };

  const renderError = (message) => {
    el('taskText').textContent = message;
    el('taskTopic').textContent = 'Ошибка';
    el('taskSubtype').textContent = 'Банк не загружен';
    el('taskImage').hidden = true;
    el('answerInput').value = '';
    el('checkBtn').disabled = true;
    el('newTaskBtn').disabled = true;
    el('resetBtn').disabled = true;
    el('hintList').innerHTML = '';
    el('resultBlock').hidden = true;
  };

  const renderHints = (task) => {
    const hints = HINTS_BY_TOPIC[task.topic] || [
      'Определи тип прогрессии.',
      'Найди первый член и шаг изменения.',
      'Проверь, что ответ соответствует условию.',
    ];
    const list = el('hintList');
    list.innerHTML = '';
    hints.forEach((hint) => {
      const li = document.createElement('li');
      li.textContent = hint;
      list.appendChild(li);
    });
  };

  const resetResult = () => {
    el('resultBlock').hidden = true;
    el('resultLine').textContent = '—';
    el('userAnswerText').textContent = '—';
    el('correctAnswerText').textContent = '—';
  };

  const renderTask = () => {
    if (!state.loaded || state.tasks.length === 0) {
      renderError('Банк заданий не загружен. Обновите страницу и попробуйте снова.');
      return;
    }
    const task = state.tasks[Math.floor(Math.random() * state.tasks.length)];
    state.current = task;

    el('taskText').textContent = task.text;
    el('taskTopic').textContent = task.topic || 'Прогрессии';
    el('taskSubtype').textContent = task.subtype || 'Банк ОГЭ';

    const image = el('taskImage');
    const imageSrc = IMAGE_BY_ID[task.id];
    if (imageSrc) {
      image.src = imageSrc;
      image.alt = 'Иллюстрация к задаче';
      image.hidden = false;
    } else {
      image.hidden = true;
      image.removeAttribute('src');
      image.alt = '';
    }

    el('answerInput').value = '';
    renderHints(task);
    resetResult();
  };

  const checkAnswer = () => {
    if (!state.current) return;
    const value = el('answerInput').value;
    const accepted = getAcceptedAnswers(state.current);
    const result = isCorrectAnswer(value, accepted);

    el('resultBlock').hidden = false;
    el('resultLine').textContent = result.message;
    el('userAnswerText').textContent = value || '—';
    el('correctAnswerText').textContent = accepted[0] ?? '—';
  };

  const resetAnswer = () => {
    el('answerInput').value = '';
    resetResult();
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
      state.tasks = payload.tasks;
      state.loaded = true;
      return true;
    } catch (error) {
      console.error('Не удалось загрузить банк заданий', error);
      state.loaded = false;
      renderError('Не удалось загрузить банк заданий. Проверьте подключение и обновите страницу.');
      return false;
    }
  };

  const init = async () => {
    el('checkBtn').addEventListener('click', checkAnswer);
    el('newTaskBtn').addEventListener('click', renderTask);
    el('resetBtn').addEventListener('click', resetAnswer);

    const loaded = await loadTasks();
    if (loaded) {
      renderTask();
    }
  };

  init();
})();

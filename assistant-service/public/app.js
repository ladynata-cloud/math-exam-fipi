'use strict';

(() => {
  const $ = (id) => document.getElementById(id);
  const elements = Object.fromEntries([
    'mode-badge', 'mode-description', 'page-message', 'access-panel', 'access-form',
    'access-description', 'pilot-key-field', 'pilot-key', 'access-button', 'workspace',
    'question-form', 'topic', 'sample-button', 'question', 'attempt', 'external-choice',
    'external-consent', 'external-consent-label', 'ask-button', 'empty-state',
    'answer-list', 'answer-actions', 'next-button', 'explain-button', 'answer-message',
    'forget-button', 'answer-title',
  ].map((id) => [id, $(id)]));
  const state = {
    csrf: '', status: null, topics: [], busy: false, level: 0,
    signature: '', complete: false, generation: 0, activeRequest: null,
  };

  function message(id, text, isError = false) {
    elements[id].textContent = text;
    elements[id].classList.toggle('is-error', isError);
  }

  function node(tag, className, text) {
    const result = document.createElement(tag);
    if (className) result.className = className;
    if (typeof text === 'string') result.textContent = text;
    return result;
  }

  function setBusy(busy) {
    state.busy = busy;
    elements['access-button'].disabled = busy || !state.status;
    elements['ask-button'].disabled = busy;
    elements['sample-button'].disabled = busy;
    elements['next-button'].disabled = busy || state.complete || state.level >= 5;
    elements['explain-button'].disabled = busy || state.complete;
    elements['topic'].disabled = busy;
    elements['question'].disabled = busy;
    elements['attempt'].disabled = busy;
    elements['external-consent'].disabled = busy;
    elements['forget-button'].disabled = busy;
    for (const button of document.querySelectorAll('.feedback-button')) {
      button.disabled = busy || button.dataset.feedbackLocked === 'true';
    }
    elements['workspace'].setAttribute('aria-busy', String(busy));
  }

  async function request(path, {method = 'GET', body, csrf = false, signal} = {}) {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (csrf) headers['X-Assistant-CSRF'] = state.csrf;
    const response = await fetch(path, {
      method, headers, credentials: 'same-origin', cache: 'no-store',
      body: body === undefined ? undefined : JSON.stringify(body), signal,
    });
    let result;
    try { result = await response.json(); } catch { result = null; }
    if (!response.ok || !result || result.ok === false) {
      const error = new Error('Request failed');
      error.status = response.status;
      if (result?.error === 'PERSONAL_DATA_REJECTED') error.code = 'PERSONAL_DATA_REJECTED';
      throw error;
    }
    return result;
  }

  function errorText(error) {
    if (error.code === 'PERSONAL_DATA_REJECTED') return 'В тексте могут быть личные данные или ссылка. Убери их и оставь только математическое условие.';
    if (error.name === 'AbortError' || error.name === 'TimeoutError') return 'Ответ задержался. Попробуй чуть позже. Предыдущие подсказки остаются на экране.';
    if (error.status === 401 || error.status === 403) return 'Не удалось подтвердить сеанс. Открой закрытый тест заново.';
    if (error.status === 429) return 'Достигнут лимит запросов. Сделаем паузу: ты можешь вернуться к уже открытым шагам.';
    if (error.status === 400 || error.status === 422) return 'Проверь условие задачи. Для начала можно взять встроенный пример выбранной темы.';
    if (error.status === 503) return 'Этот режим сейчас недоступен. Попробуй встроенный пример без внешней модели или вернись позже.';
    return 'Не получилось получить ответ. Проверь соединение и попробуй позже.';
  }

  function clearAnswers() {
    state.level = 0;
    state.signature = '';
    state.complete = false;
    elements['answer-list'].replaceChildren();
    elements['empty-state'].hidden = false;
    elements['answer-actions'].hidden = true;
    elements['ask-button'].textContent = 'Дай первый шаг';
    message('answer-message', '');
  }

  function clearSession() {
    state.generation += 1;
    state.activeRequest?.abort();
    state.activeRequest = null;
    state.csrf = '';
    state.topics = [];
    elements['topic'].replaceChildren();
    elements['question'].value = '';
    elements['attempt'].value = '';
    elements['pilot-key'].value = '';
    elements['external-consent'].checked = false;
    elements['workspace'].hidden = true;
    elements['access-panel'].hidden = false;
    elements['forget-button'].hidden = true;
    clearAnswers();
    setBusy(false);
  }

  function taskSignature() {
    return JSON.stringify([
      elements['topic'].value, elements['question'].value.trim(),
    ]);
  }

  function appendSources(card, sources) {
    if (!Array.isArray(sources) || !sources.length) return;
    const list = node('div', 'answer-sources');
    list.append(node('span', '', 'Материалы:'));
    for (const source of sources.slice(0, 5)) {
      if (!source || typeof source.title !== 'string') continue;
      let safeUrl;
      try {
        if (typeof source.url !== 'string' || !source.url) throw new TypeError('Missing source');
        const parsed = new URL(source.url, 'https://mathexam.space/');
        const projectSource = ['mathexam.space', 'www.mathexam.space'].includes(parsed.hostname) ||
          (parsed.hostname === 'github.com' && parsed.pathname.startsWith('/ladynata-cloud/math-exam-fipi/'));
        if (parsed.protocol === 'https:' && !parsed.username && !parsed.password && !parsed.search && projectSource) safeUrl = parsed.href;
      } catch { /* An unavailable source link is rendered as text. */ }
      const item = node(safeUrl ? 'a' : 'span', '', source.title);
      if (safeUrl) {
        item.href = safeUrl;
        item.target = '_blank';
        item.rel = 'noopener noreferrer';
      }
      list.append(item);
    }
    card.append(list);
  }

  function appendFeedback(card, answerId) {
    if (typeof answerId !== 'string' || !answerId) return;
    const feedback = node('div', 'feedback');
    const status = node('p', '', 'Помогло разобраться?');
    status.setAttribute('aria-live', 'polite');
    const buttons = node('div', 'feedback-buttons');
    const choices = [['helpful', 'Стало понятно'], ['unclear', 'Объясни проще'], ['incorrect', 'Кажется, ошибка']];
    for (const [rating, label] of choices) {
      const button = node('button', 'feedback-button', label);
      button.type = 'button';
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', async () => {
        if (!state.csrf || state.busy) return;
        const generation = state.generation;
        for (const item of buttons.children) item.dataset.feedbackLocked = 'true';
        setBusy(true);
        try {
          await request('/api/feedback', {method: 'POST', csrf: true, body: {answerId, rating}, signal: AbortSignal.timeout(15000)});
          if (generation !== state.generation) return;
          button.setAttribute('aria-pressed', 'true');
          status.textContent = rating === 'unclear' ? 'Учтено. Следующая подсказка будет проще.' :
            rating === 'incorrect' ? 'Спасибо. Оценка сохранена для проверки; обсуди этот шаг с учителем.' : 'Спасибо! Оценка сохранена.';
        } catch {
          if (generation !== state.generation) return;
          status.textContent = 'Не удалось сохранить оценку. Можно попробовать ещё раз.';
          for (const item of buttons.children) delete item.dataset.feedbackLocked;
        } finally { if (generation === state.generation) setBusy(false); }
      });
      buttons.append(button);
    }
    feedback.append(status, buttons);
    card.append(feedback);
  }

  function renderAnswer(answer, mode, level, notice) {
    const card = node('article', 'answer-card');
    card.tabIndex = -1;
    const kicker = node('div', 'answer-kicker');
    kicker.append(node('span', 'answer-kind', mode === 'explain' ?
      (answer.verification === 'needs-teacher' ? 'Общий ориентир' : 'Полный разбор') : `Подсказка ${level}`));
    const verificationLabels = {
      deterministic: 'Вычисления проверены программой',
      'curated-guidance': 'Из проверенных материалов',
      'model-unverified': 'Ответ модели · нужна проверка',
      'needs-teacher': 'Нужна помощь учителя',
    };
    const caution = !['deterministic', 'curated-guidance'].includes(answer.verification);
    kicker.append(node('span', `verification${caution ? ' caution' : ''}`,
      verificationLabels[answer.verification] || 'Обсуди ответ с учителем'));
    card.append(kicker, node('h3', '', typeof answer.title === 'string' ? answer.title : 'Посмотрим на следующий шаг'));
    if (typeof answer.text === 'string' && answer.text) card.append(node('p', 'answer-text', answer.text));
    if (Array.isArray(answer.steps) && answer.steps.length) {
      const steps = node('ol', 'answer-steps');
      for (const step of answer.steps.slice(0, 12)) if (typeof step === 'string') steps.append(node('li', '', step));
      card.append(steps);
    }
    if (typeof answer.check === 'string' && answer.check) {
      const check = node('div', 'answer-check');
      check.append(node('strong', '', 'Попробуй сам'), node('span', '', answer.check));
      card.append(check);
    }
    if (typeof notice === 'string' && notice) card.append(node('p', 'answer-notice', notice));
    if (answer.verification === 'model-unverified') card.append(node('p', 'answer-notice', 'Модель может ошибиться или открыть лишние шаги. Этот ответ не становится частью проверенной базы знаний автоматически.'));
    appendSources(card, answer.sources);
    appendFeedback(card, answer.id);
    elements['answer-list'].append(card);
    elements['empty-state'].hidden = true;
    card.focus({preventScroll: true});
    card.scrollIntoView({block: 'nearest', behavior: 'auto'});
  }

  async function ask(mode, requestedLevel) {
    if (state.busy || !state.csrf || !elements['question-form'].reportValidity()) return;
    const signature = taskSignature();
    const newTask = signature !== state.signature;
    const level = mode === 'explain' ? 5 : newTask ? 1 : requestedLevel;
    if (level < 1 || level > 5) return;
    const generation = state.generation;
    const controller = new AbortController();
    state.activeRequest = controller;
    const timeout = setTimeout(() => controller.abort(), 45000);
    setBusy(true);
    message('answer-message', mode === 'explain' ? 'Готовим разбор…' : 'Подбираем следующий шаг…');
    message('page-message', '');
    try {
      const result = await request('/api/ask', {
        method: 'POST', csrf: true, signal: controller.signal,
        body: {
          topic: elements['topic'].value,
          question: elements['question'].value.trim(),
          attempt: elements['attempt'].value.trim(),
          hintLevel: level, mode,
          externalConsent: Boolean(state.status.externalEnabled && elements['external-consent'].checked),
          requestId: crypto.randomUUID(),
        },
      });
      if (generation !== state.generation) return;
      if (!result.answer || typeof result.answer !== 'object') throw new Error('Missing answer');
      if (newTask || (mode === 'hint' && requestedLevel === 1)) clearAnswers();
      state.signature = signature;
      state.level = level;
      state.complete = Boolean(result.answer.complete) || mode === 'explain';
      renderAnswer(result.answer, mode, level, result.notice);
      elements['answer-actions'].hidden = state.complete;
      elements['ask-button'].textContent = 'Начать разбор заново';
      message('answer-message', result.answer.verification === 'needs-teacher' ?
        'Это общие правила, а решение твоей задачи ещё не проверено. Возьми встроенный пример или обратись к учителю.' :
        state.complete ? 'Разбор открыт. Можно вернуться к любому шагу или начать новую задачу.' :
        level >= 5 ? 'Все небольшие подсказки открыты. При желании посмотри полный разбор.' : 'Попробуй выполнить этот шаг. Если нужно — попроси ещё одну подсказку.');
    } catch (error) {
      if (generation !== state.generation) return;
      message('answer-message', errorText(error), true);
      if (error.status === 401 || error.status === 403) {
        state.csrf = '';
        elements['access-panel'].hidden = false;
        elements['forget-button'].hidden = true;
        message('page-message', 'Сеанс закончился или не подтверждён. Войди заново, чтобы продолжить.', true);
      }
    } finally {
      clearTimeout(timeout);
      if (generation === state.generation) {
        state.activeRequest = null;
        setBusy(false);
      }
    }
  }

  elements['access-form'].addEventListener('submit', async (event) => {
    event.preventDefault();
    if (state.busy || !state.status) return;
    const pilotKey = elements['pilot-key'].value;
    elements['pilot-key'].value = '';
    setBusy(true);
    message('page-message', 'Открываем сеанс…');
    try {
      const session = await request('/api/session', {method: 'POST', body: {pilotKey}, signal: AbortSignal.timeout(15000)});
      if (typeof session.csrf !== 'string' || !session.csrf) throw new Error('Missing session');
      state.csrf = session.csrf;
      const result = await request('/api/topics', {signal: AbortSignal.timeout(15000)});
      state.topics = Array.isArray(result.topics) ? result.topics.filter((topic) => typeof topic.id === 'string' && typeof topic.title === 'string') : [];
      if (!state.topics.length) throw new Error('Missing topics');
      elements['topic'].replaceChildren(...state.topics.map((topic) => {
        const option = node('option', '', topic.title);
        option.value = topic.id;
        return option;
      }));
      clearAnswers();
      elements['access-panel'].hidden = true;
      elements['workspace'].hidden = false;
      elements['forget-button'].hidden = false;
      message('page-message', 'Можно начинать. Выбери тему и задачу.');
      setBusy(false);
      elements['question'].focus({preventScroll: true});
    } catch (error) {
      message('page-message', error.status === 401 || error.status === 403 ?
        'Не удалось открыть тест. Проверь ключ доступа у учителя.' : 'Не удалось открыть тест. Попробуй ещё раз через некоторое время.', true);
      if (state.csrf) elements['forget-button'].hidden = false;
    } finally { setBusy(false); }
  });

  elements['question-form'].addEventListener('submit', (event) => { event.preventDefault(); ask('hint', 1); });
  elements['next-button'].addEventListener('click', () => ask('hint', state.level + 1));
  elements['explain-button'].addEventListener('click', () => ask('explain', 5));
  elements['sample-button'].addEventListener('click', () => {
    const topic = state.topics.find((item) => item.id === elements['topic'].value);
    if (topic && typeof topic.sample === 'string') {
      elements['question'].value = topic.sample;
      elements['attempt'].value = '';
      elements['external-consent'].checked = false;
      elements['question'].focus();
      message('page-message', 'Пример готов. Нажми «Дай первый шаг», чтобы начать.');
      elements['ask-button'].textContent = 'Дай первый шаг';
    }
  });
  for (const field of ['topic', 'question', 'attempt']) elements[field].addEventListener('input', () => {
    elements['external-consent'].checked = false;
    if (taskSignature() !== state.signature) elements['ask-button'].textContent = 'Дай первый шаг';
  });

  elements['forget-button'].addEventListener('click', async () => {
    if (state.busy || !state.csrf) return;
    setBusy(true);
    try {
      await request('/api/session', {method: 'DELETE', csrf: true, signal: AbortSignal.timeout(15000)});
      clearSession();
      message('page-message', 'Сеанс и связанные с ним оценки удалены. Текст на этой странице очищен.');
      elements['access-button'].focus();
    } catch (error) {
      if (error.status === 401) {
        clearSession();
        message('page-message', 'Сеанс уже завершён. Текст на странице очищен. Обезличенные оценки хранятся не дольше 30 дней.');
      } else message('page-message', 'Не удалось подтвердить удаление сеанса. Проверь соединение и нажми «Удалить мой сеанс» ещё раз.', true);
    } finally { setBusy(false); }
  });

  async function initialize() {
    try {
      state.status = await request('/api/status', {signal: AbortSignal.timeout(15000)});
      const external = Boolean(state.status.externalEnabled && state.status.mode === 'api');
      elements['mode-badge'].textContent = external ? 'Внешняя модель доступна по согласию' : 'Встроенные примеры · без внешней модели';
      elements['mode-description'].textContent = external ?
        'Есть проверенные примеры и дополнительный режим внешней модели. Перед отправкой текста нужно твоё согласие.' :
        'Сейчас доступны проверенные примеры и объяснения из подготовленных материалов. Это проверка основы помощника; генеративная модель не подключена.';
      elements['external-choice'].hidden = !external;
      if (external && typeof state.status.providerLabel === 'string') {
        elements['external-consent-label'].textContent = `Разрешаю отправить математический текст провайдеру «${state.status.providerLabel}» для этой задачи.`;
      }
      if (state.status.localDemo) {
        elements['pilot-key-field'].hidden = true;
        elements['pilot-key'].required = false;
        elements['access-button'].textContent = 'Начать локальную проверку';
        elements['access-description'].textContent = 'Локальный режим проверки. Можно попробовать встроенные примеры без ключа доступа и оплаты.';
      }
      setBusy(false);
    } catch {
      elements['mode-badge'].textContent = 'Сервис недоступен';
      elements['mode-description'].textContent = 'Не удалось проверить режим помощника. Обнови страницу через некоторое время.';
      message('page-message', 'Не удалось соединиться с помощником. Доступ к закрытому тесту пока не открыт.', true);
    }
  }
  initialize();
})();

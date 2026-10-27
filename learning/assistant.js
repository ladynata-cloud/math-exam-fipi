/* Cabinet help. Authentication stays in the cabinet API; task text exists only
 * in this document. A closed view never displays a late response. */
(function (root) {
  'use strict';
  const profileNames = {
    'oge-geometry': 'ОГЭ · Геометрия',
    'peterson-decimals': '6 класс · Петерсон · Десятичные дроби',
    'triangle-congruence': 'Атанасян · Признаки равенства треугольников',
    'atanasyan-first-steps': 'Атанасян · От начала до элементарных построений'
  };
  const labels = {
    deterministic: 'Вычисление проверено программой',
    'curated-guidance': 'Проверенные материалы MathExam',
    'needs-teacher': 'Нужна проверка преподавателя',
    'model-unverified': 'Ответ модели · математическая проверка не завершена'
  };
  function node(tag, text, attrs = {}) {
    const item = document.createElement(tag);
    if (text !== undefined && text !== null) item.textContent = String(text);
    for (const [key, value] of Object.entries(attrs)) {
      if (key === 'class') item.className = value;
      else item.setAttribute(key, String(value));
    }
    return item;
  }
  function field(title, control, help) {
    const wrap = node('label', null, { class: 'cabinet-assistant-field' });
    wrap.append(node('span', title), control);
    if (help) wrap.append(node('small', help));
    return wrap;
  }
  const button = (text, action, primary = false) => {
    const item = node('button', text, { type: 'button', class: primary ? 'primary' : '' });
    item.addEventListener('click', action); return item;
  };
  function messageFor(error) {
    const code = error?.code || error?.message || '';
    if (/PILOT_FULL|PILOT_LIMIT|CAPACITY|MAX_PUPIL/.test(code)) return 'В испытании уже участвуют три кабинета. Сначала отключите помощника у одного участника.';
    if (/DAILY|QUOTA|BUDGET|LIMIT/.test(code)) return 'Сегодняшний лимит подсказок закончился. Можно продолжить по материалам курса или обратиться к преподавателю.';
    if (/CONFLICT|VERSION/.test(code)) return 'Настройки изменились в другом окне. Откройте их снова перед сохранением.';
    if (/INPUT|QUESTION|SENSITIVE|PRIVACY|INVALID/.test(code)) return 'Проверь условие: здесь нужны только математические данные, без имён, контактов и ссылок.';
    if (/FORBIDDEN|DISABLED|ACCESS|NOT_ENABLED/.test(code)) return 'Помощник сейчас недоступен для этого кабинета. Обратитесь к преподавателю.';
    return 'Не удалось получить ответ. Текст условия и предыдущие шаги остались на этой странице.';
  }
  function validProfile(value) {
    return value && Object.hasOwn(profileNames, value.id) && Array.isArray(value.topics) && value.topics.length > 0 && value.topics.length <= 30
      && value.topics.every(topic => topic && typeof topic.id === 'string' && /^[a-z0-9-]{1,80}$/.test(topic.id)
        && typeof topic.title === 'string' && topic.title.length <= 200);
  }
  function publicLink(value) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && url.hostname === 'mathexam.space' && !url.username && !url.password && !url.port ? url.href : null;
    } catch (_) { return null; }
  }

  function mount(host, context) {
    let alive = true, revision = 0, status = null, busy = false, hintLevel = 0, fingerprint = '';
    let refreshView = () => {};
    const controllers = new Set();
    const teacher = context.role === 'teacher';
    const courseMode = !teacher && context.courseContext !== undefined;
    const courseSnapshot = () => {
      try {
        const value = typeof context.courseContext === 'function' ? context.courseContext() : context.courseContext;
        if (!value || value.courseId !== 'atanasyan-first-steps' || typeof value.lessonId !== 'string'
          || !Number.isSafeInteger(value.stepIndex) || value.stepIndex < 0) return null;
        return { courseId: value.courseId, lessonId: value.lessonId, stepIndex: value.stepIndex };
      } catch (_) { return null; }
    };
    const initialCourse = courseMode ? courseSnapshot() : null;
    const sameCourse = () => {
      if (!courseMode) return true;
      const value = courseSnapshot();
      return value && initialCourse && value.courseId === initialCourse.courseId && value.lessonId === initialCourse.lessonId;
    };
    const displayValue = key => String(typeof context[key] === 'function' ? context[key]() : context[key] || '');
    const taskLabel = () => displayValue('courseTaskLabel') || 'Выбранная задача курса';
    const endpoint = teacher ? '/teacher/students/' + encodeURIComponent(context.studentId) + '/assistant' : '/assistant';
    const current = () => alive && host.isConnected && sameCourse() && (!context.isCurrent || context.isCurrent());
    host.hidden = true; host.replaceChildren();
    function destroy() {
      if (!alive) return; alive = false; revision++;
      for (const controller of controllers) controller.abort();
      controllers.clear(); host.replaceChildren(); host.hidden = true;
    }
    // Native course navigation can reveal another step without discarding the
    // answers already shown. This function never sends a network request.
    destroy.refresh = () => { if (current()) refreshView(); };
    async function request(path, body) {
      if (!current()) throw Object.assign(Error('LEARNING_ACCOUNT_CHANGED'), { code: 'LEARNING_ACCOUNT_CHANGED' });
      const serial = revision, controller = new AbortController(); controllers.add(controller);
      try {
        const result = await context.api(path, { signal: controller.signal, ...(body === undefined ? {} : { method: 'POST', body: JSON.stringify(body) }) });
        if (!current() || serial !== revision) throw Object.assign(Error('LEARNING_ACCOUNT_CHANGED'), { code: 'LEARNING_ACCOUNT_CHANGED' });
        return result;
      } finally { controllers.delete(controller); }
    }
    function announce(area, text, error = false) {
      area.textContent = text; area.classList.toggle('is-error', error);
    }
    function frame(title) {
      host.replaceChildren(); host.hidden = false;
      const section = node('section', null, { class: 'panel cabinet-assistant', 'aria-label': 'Помощник MaxExam 0.0 по математике' });
      section.append(node('p', 'МАТЕМАТИКА ПО ШАГАМ', { class: 'eyebrow' }), node('h2', title));
      host.append(section); return section;
    }
    function appendLinks(section) {
      const links = node('div', null, { class: 'actions cabinet-assistant-links' });
      for (const link of (status.profile.links || []).slice(0, 10)) {
        const href = publicLink(link.url);
        if (href) links.append(node('a', String(link.title || 'Материал по теме').slice(0, 200), { href, target: '_blank', rel: 'noopener noreferrer', class: 'button' }));
      }
      if (links.childElementCount) section.append(links);
    }
    function renderTeacher() {
      const section = frame('MaxExam 0.0 в этом кабинете');
      section.append(node('p', 'Выберите учебный профиль и дневной лимит. Подключение относится только к открытому кабинету ученика.'));
      const form = node('form', null, { class: 'cabinet-assistant-settings' });
      const select = node('select', null, { name: 'assistant-profile' });
      for (const [id, title] of Object.entries(profileNames)) select.append(node('option', title, { value: id }));
      select.value = status.profile?.id || status.profileId || 'oge-geometry';
      const enabled = node('input', null, { type: 'checkbox', name: 'assistant-enabled' }); enabled.checked = status.configuredEnabled === true || (status.configuredEnabled === undefined && status.enabled === true);
      const limit = node('input', null, { type: 'number', min: 1, max: 20, step: 1, name: 'assistant-limit' }); limit.value = Number.isInteger(status.dailyLimit) ? status.dailyLimit : 10;
      form.append(field('Учебный профиль', select), field('Подсказок в день', limit));
      const enableRow = node('label', null, { class: 'cabinet-assistant-check' }); enableRow.append(enabled, node('span', 'Включить помощника для этого ученика')); form.append(enableRow);
      const external = node('input', null, { type: 'checkbox', name: 'assistant-external' });
      external.checked = status.externalAvailable === true && status.externalAllowed === true;
      let externalRow;
      if (status.externalAvailable === true) {
        externalRow = node('label', null, { class: 'cabinet-assistant-check' });
        externalRow.append(external, node('span', 'Разрешить внешнюю модель для этого кабинета после проверки условий обработки данных и необходимых согласий.'));
        form.append(externalRow);
      } else form.append(node('p', 'Внешняя модель не подключена. ' + (status.available && status.mode !== 'unavailable' ? 'Доступны проверенные подсказки MathExam.' : 'Подсказки появятся после подключения сервиса помощника.'), { class: 'cabinet-assistant-mode' }));
      const sourceNotice = node('p', 'В этом профиле помощник использует проверенные шаги курса. Внешняя модель не вызывается.', { class: 'cabinet-assistant-mode' });
      form.append(sourceNotice);
      function updateExternalChoice() {
        const sourceOnly = select.value === 'atanasyan-first-steps';
        if (sourceOnly) external.checked = false;
        external.disabled = busy || sourceOnly || status.externalAvailable !== true;
        if (externalRow) externalRow.hidden = sourceOnly;
        sourceNotice.hidden = !sourceOnly;
      }
      select.addEventListener('change', updateExternalChoice); updateExternalChoice();
      const message = node('p', '', { role: 'status', 'aria-live': 'polite', class: 'cabinet-assistant-message' });
      const save = node('button', 'Сохранить настройки помощника', { type: 'submit', class: 'primary' });
      form.append(save, message); section.append(form);
      form.addEventListener('submit', async event => {
        event.preventDefault(); if (busy || !current()) return;
        if (!form.reportValidity()) return;
        busy = true; for (const control of [select, enabled, limit, external, save]) control.disabled = true; announce(message, 'Сохраняем настройки…');
        try {
          const saved = await request(endpoint, { profileId: select.value, enabled: enabled.checked, dailyLimit: Number(limit.value), version: Number.isInteger(status.version) ? status.version : 0, externalAllowed: select.value !== 'atanasyan-first-steps' && external.checked });
          status = saved.status || saved;
          announce(message, 'Настройки помощника сохранены.');
        } catch (error) {
          if (!current()) return;
          if (error.code === 'LEARNING_ACCOUNT_CHANGED') { destroy(); return; }
          announce(message, messageFor(error), true);
        } finally { if (current()) { busy = false; for (const control of [select, enabled, limit, external, save]) control.disabled = false; updateExternalChoice(); } }
      });
    }
    function renderPupil() {
      if (!status.enabled || !validProfile(status.profile)) { host.hidden = true; host.replaceChildren(); return; }
      if (courseMode && status.profile.id !== 'atanasyan-first-steps') {
        const section = frame('Подсказки к курсу Атанасяна');
        section.append(node('p', 'Для помощника к этому курсу преподаватель выбирает профиль «От начала до элементарных построений». Разборы самого курса уже доступны рядом с задачей.'));
        return;
      }
      if (status.mode === 'unavailable' || status.examActive) {
        const section = frame('MaxExam 0.0 · временно недоступен');
        section.append(node('p', status.examActive ? 'Помощник будет доступен после завершения проверочной работы.' : 'Сервис подсказок пока не отвечает. Основные задания кабинета доступны.'));
        section.append(button('Проверить подключение', event => { event.currentTarget.disabled = true; revision++; load(); }));
        if (!status.examActive) appendLinks(section);
        return;
      }
      if (status.profile.id === 'atanasyan-first-steps' && !courseMode) {
        const section = frame('MaxExam 0.0 · помощник курса Атанасяна');
        section.append(node('p', 'Открой задачу в курсе — помощник получит её условие и текущий шаг. Доступны подсказки из проверенного разбора; доказательство проверяет преподаватель.'));
        section.append(node('a', 'Открыть курс и выбрать задачу', { href: '#atanasyan-course', class: 'button primary', 'data-assistant-open-course': '' }));
        return;
      }
      const profileId = status.profile.id;
      let quotaKnown = Number.isInteger(status.remaining);
      const section = frame(status.externalEnabled ? 'MaxExam 0.0 · помощник' : 'MaxExam 0.0 · проверенные подсказки');
      section.append(node('p', status.profile.title || profileNames[status.profile.id], { class: 'cabinet-assistant-profile' }));
      const modeNotice = node('p', '', { class: 'cabinet-assistant-mode', 'data-assistant-mode': status.mode || 'unavailable' });
      section.append(modeNotice);
      section.append(node('p', courseMode ? 'Помощник знает выбранную задачу и текущий шаг этого курса. Условие переписывать не нужно. Помощь отмечается в твоей работе; доказательство проверяет преподаватель.'
        : context.attemptId ? 'Помощь относится к открытой работе. После подсказки результат учитывается как выполненный с помощью.' : 'Для задачи из курса, открытого в другой вкладке, впиши условие сюда. Помощник не видит ту вкладку.', { class: 'cabinet-assistant-context' }));
      const form = node('form', null, { class: 'cabinet-assistant-form' });
      const topics = node('select', null, { name: 'assistant-topic' });
      for (const topic of status.profile.topics) topics.append(node('option', topic.title, { value: topic.id }));
      const question = node('textarea', null, { name: 'assistant-question', rows: 3, maxlength: 1000, required: '', autocomplete: 'off', spellcheck: 'false' });
      const attempt = node('input', null, { name: 'assistant-attempt', maxlength: 400, autocomplete: 'off', spellcheck: 'false' });
      const example = button('Попробовать пример темы', () => {
        if (busy) return;
        question.value = String(status.profile.topics.find(topic => topic.id === topics.value)?.example || '').slice(0, 1000);
        attempt.value = ''; question.focus();
      }); example.dataset.assistantExample = '';
      if (courseMode) {
        question.required = false;
        question.value = displayValue('courseTaskPrompt');
        const label = node('p', taskLabel(), { class: 'cabinet-assistant-course-task', 'data-assistant-course-task': '' });
        form.append(label);
        if (question.value) form.append(node('p', question.value, { class: 'cabinet-assistant-course-condition' }));
      } else form.append(field('Тема', topics), field('Условие задачи или вопрос', question, 'Только математика: без имени, телефона, ссылок и личных сведений.'), example, field('Мой ответ или шаг, если уже пробовал', attempt));
      const consent = node('input', null, { type: 'checkbox', name: 'assistant-external-consent' });
      const consentRow = node('label', null, { class: 'cabinet-assistant-check' });
      consentRow.append(consent, node('span', 'Разрешаю отправить математическое условие и мой шаг внешней модели для этого объяснения.'));
      const actions = node('div', null, { class: 'actions cabinet-assistant-actions' });
      const hint = node('button', 'Хочу подсказку', { type: 'submit', class: 'primary' });
      const simpler = button('Объясни проще', () => ask('hint', true));
      const full = button('Показать весь разбор', () => ask('full', false));
      actions.append(hint, simpler, full); form.append(actions);
      const quota = node('p', '', { class: 'cabinet-assistant-quota' });
      const message = node('p', '', { role: 'status', 'aria-live': 'polite', class: 'cabinet-assistant-message' });
      const reconnect = button('Проверить подключение', async () => {
        if (busy || !current()) return;
        busy = true; update();
        const restored = await refreshStatus();
        if (!current()) return;
        busy = false; update();
        announce(message, restored ? 'Состояние помощника обновлено. Условие и предыдущие шаги сохранены на странице.' : 'Не удалось проверить подключение. Условие и предыдущие шаги остались на странице.', !restored);
      });
      const answers = node('div', null, { class: 'cabinet-assistant-answers', 'aria-label': 'Показанные шаги' });
      section.append(form, quota, message, reconnect, answers);
      appendLinks(section);
      const available = () => status.enabled === true && status.profile?.id === profileId && status.mode !== 'unavailable' && !status.examActive;
      let observedCourse = courseMode ? JSON.stringify(courseSnapshot()) : '';
      const update = () => {
        if (courseMode) {
          const selected = JSON.stringify(courseSnapshot());
          if (selected !== observedCourse) { observedCourse = selected; hintLevel = 0; fingerprint = ''; }
        }
        const remaining = Number.isInteger(status.remaining) ? Math.max(0, status.remaining) : 0;
        quota.textContent = quotaKnown ? 'Осталось подсказок сегодня: ' + remaining + ' из ' + (Number.isInteger(status.dailyLimit) ? status.dailyLimit : 0) + '.' : 'Дневной лимит пока не удалось обновить. Проверь подключение перед следующей подсказкой.';
        for (const control of [hint, simpler, full, topics, example]) control.disabled = busy || !quotaKnown || remaining < 1 || !available();
        hint.textContent = hintLevel ? (courseMode ? 'Ещё подсказка к шагу' : 'Следующая подсказка') : 'Хочу подсказку';
        question.readOnly = busy; attempt.readOnly = busy; consent.disabled = busy;
        if (hintLevel >= (courseMode ? 3 : 8)) hint.disabled = true;
        reconnect.hidden = quotaKnown && available(); reconnect.disabled = busy;
        const externalActive = status.externalEnabled === true && status.profile.id !== 'atanasyan-first-steps';
        if (externalActive) form.insertBefore(consentRow, actions);
        else { consentRow.remove(); consent.checked = false; }
        section.querySelector('h2').textContent = externalActive ? 'MaxExam 0.0 · помощник' : 'MaxExam 0.0 · проверенные подсказки';
        modeNotice.dataset.assistantMode = status.mode || 'unavailable';
        modeNotice.textContent = status.examActive ? 'Помощник будет доступен после завершения проверочной работы.'
          : !available() ? 'Подключение или настройки помощника изменились. Проверь подключение; условие и предыдущие шаги останутся на странице.'
            : externalActive ? 'Можно попросить внешнюю модель объяснить шаг. Её ответ может потребовать проверки преподавателем.'
              : courseMode ? 'Это подсказки MathExam из проверенного разбора выбранной задачи. Внешняя модель не вызывается.'
                : 'Внешняя модель не подключена. Проверенные подсказки MathExam помогают повторить правила и разобрать поддерживаемые примеры.';
      };
      async function refreshStatus() {
        try {
          status = await request(endpoint);
          quotaKnown = Number.isInteger(status.remaining);
          return quotaKnown && available();
        } catch (error) {
          if (error.code === 'LEARNING_ACCOUNT_CHANGED') destroy();
          quotaKnown = false; return false;
        }
      }
      function showAnswer(answer, sourceQuestion, contextMode, capturedCourse, capturedLabel) {
        const card = node('article', null, { class: 'cabinet-assistant-answer', 'data-assistant-answer': '' });
        card.append(node('p', contextMode === 'course-task' && capturedCourse
          ? `${capturedLabel} · шаг ${capturedCourse.stepIndex + 1}`
          : contextMode === 'current-task' ? 'Подсказка к текущему заданию кабинета' : 'Задача: ' + sourceQuestion, { class: 'cabinet-assistant-question' }));
        card.append(node('h3', answer.title || 'Следующий шаг'));
        card.append(node('p', labels[answer.verification] || 'Объяснение требует проверки', { class: 'cabinet-assistant-source' }));
        if (typeof answer.text === 'string' && answer.text) card.append(node('p', answer.text));
        if (Array.isArray(answer.steps)) {
          const list = node('ol', null, { class: 'cabinet-assistant-steps' });
          for (const step of answer.steps.slice(0, 12)) list.append(node('li', typeof step === 'string' ? step : step?.text || ''));
          card.append(list);
        }
        if (typeof answer.check === 'string' && answer.check) card.append(node('p', answer.check, { class: 'cabinet-assistant-check-text' }));
        const feedback = node('div', null, { class: 'actions cabinet-assistant-feedback', 'aria-label': 'Оценить подсказку' });
        const feedbackMessage = node('p', '', { role: 'status', class: 'cabinet-assistant-feedback-message' });
        let pendingFeedback = false;
        for (const [rating, label] of [['helpful', 'Стало понятно'], ['simpler', 'Всё ещё сложно'], ['incorrect', 'Кажется, ошибка']]) {
          const vote = button(label, async () => {
            if (pendingFeedback || !current()) return;
            pendingFeedback = true;
            for (const control of feedback.querySelectorAll('button')) control.disabled = true;
            try {
              await request('/assistant/feedback', { answerId: answer.answerId, rating });
              announce(feedbackMessage, rating === 'incorrect' ? 'Отметка сохранена для проверки. Уточни этот шаг у преподавателя.' : 'Отметка сохранена.');
            } catch (error) {
              if (current()) {
                if (error.code === 'LEARNING_ACCOUNT_CHANGED') { destroy(); return; }
                announce(feedbackMessage, 'Не удалось сохранить отметку.', true);
                for (const control of feedback.querySelectorAll('button')) control.disabled = false;
              }
            } finally { pendingFeedback = false; }
          }); feedback.append(vote);
        }
        card.append(feedback, feedbackMessage); answers.append(card);
      }
      async function ask(mode, easier) {
        if (busy || !current() || !quotaKnown || status.remaining < 1 || !available()) return;
        if (context.canAsk && !context.canAsk()) { announce(message, 'Сейчас работа открыта для просмотра. Вернись к текущему решению, чтобы получить подсказку.', true); return; }
        if (!form.reportValidity()) return;
        const capturedCourse = courseMode ? courseSnapshot() : null;
        if (courseMode && !capturedCourse) return;
        const capturedLabel = courseMode ? taskLabel() : '';
        const text = question.value.trim();
        if (!courseMode && !text) { question.focus(); return; }
        const signature = JSON.stringify([courseMode ? capturedCourse : topics.value, text, attempt.value.trim()]);
        const same = signature === fingerprint;
        const level = easier && same ? Math.max(1, hintLevel) : same ? Math.min(8, hintLevel + 1) : 1;
        if (!root.crypto?.randomUUID) { announce(message, 'Для помощника нужно защищённое соединение. Открой кабинет по HTTPS.', true); return; }
        busy = true; update(); announce(message, 'Готовим понятный шаг…');
        let sent = false;
        try {
          const allowed = context.onBeforeAsk ? await context.onBeforeAsk({ courseContext: capturedCourse, mode }) : true;
          if (!current()) return;
          if (allowed === false || (context.canAsk && !context.canAsk())) {
            announce(message, 'Работа сейчас открыта для просмотра. Подсказка не запрошена.', true); return;
          }
          // A callback may await local persistence. Do not cross to a different
          // task while it is pending; step changes remain labelled by capture.
          sent = true;
          const result = await request('/assistant/ask', courseMode ? {
            requestId: root.crypto.randomUUID(), courseContext: capturedCourse, attempt: attempt.value.trim(),
            mode, hintLevel: level, simpler: easier, externalConsent: false
          } : {
            requestId: root.crypto.randomUUID(), topic: topics.value, question: text, attempt: attempt.value.trim(),
            mode, hintLevel: level, simpler: easier,
            externalConsent: status.profile.id !== 'atanasyan-first-steps' && status.externalEnabled === true && consent.checked,
            ...(context.attemptId ? { attemptId: context.attemptId } : {})
          });
          if (!result.answer || typeof result.answer.answerId !== 'string') throw Error('INVALID_RESPONSE');
          if (courseMode && (result.contextMode !== 'course-task'
            || JSON.stringify(result.courseContext) !== JSON.stringify(capturedCourse))) throw Error('INVALID_RESPONSE');
          status.remaining = Number.isInteger(result.remaining) ? result.remaining : Math.max(0, status.remaining - 1);
          if (!courseMode || JSON.stringify(courseSnapshot()) === JSON.stringify(capturedCourse)) { hintLevel = level; fingerprint = signature; }
          else { hintLevel = 0; fingerprint = ''; }
          showAnswer(result.answer, text, result.contextMode, capturedCourse, capturedLabel); announce(message, result.notice || 'Подсказка добавлена. Предыдущие шаги остаются ниже.');
          context.onAnswer?.(result);
        } catch (error) {
          if (!current()) return;
          if (error.code === 'LEARNING_ACCOUNT_CHANGED') { destroy(); return; }
          announce(message, messageFor(error), true);
          // An unsuccessful bridge call may still consume its reservation. Read
          // status once; never repeat the model request or discard this view.
          if (sent) await refreshStatus();
        } finally { if (current()) { busy = false; consent.checked = false; update(); } }
      }
      form.addEventListener('submit', event => { event.preventDefault(); ask('hint', false); });
      topics.addEventListener('change', () => { fingerprint = ''; hintLevel = 0; update(); });
      for (const input of [question, attempt]) input.addEventListener('input', () => { if (!busy) { hintLevel = 0; fingerprint = ''; update(); } });
      refreshView = update;
      update();
    }
    async function load() {
      try {
        status = await request(endpoint);
        if (teacher) renderTeacher(); else renderPupil();
      } catch (error) {
        if (!current() || error.code === 'LEARNING_ACCOUNT_CHANGED') { destroy(); return; }
        // A server without the new route must preserve every existing cabinet.
        if (error.status === 404 || error.status === 403) { host.hidden = true; return; }
        const section = frame('MaxExam 0.0 · временно недоступен');
        section.append(node('p', 'Основные задания кабинета доступны. Помощника можно открыть позже.'));
        section.append(button('Проверить подключение', () => { revision++; host.hidden = true; load(); }));
      }
    }
    load();
    return destroy;
  }
  root.LearningAssistant = Object.freeze({ mount });
})(window);

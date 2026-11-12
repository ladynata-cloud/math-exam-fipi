(function (root) {
  'use strict';

  const trainerId = 'stereo-literacy-atanasyan';
  const trainerPath = '/trainers/' + trainerId + '.html';
  const storagePrefix = 'mathexam.stereoLiteracy.v1.';
  const draftLimit = 1200;
  const stepDraftLimit = 160;
  const checkLimit = 200;
  const wirePrefix = '~stereo-text~';
  const workFields = [
    'draft', 'firstAnswer', 'attempts', 'outcome', 'feedback', 'assisted', 'helpOpen',
    'hints', 'stepsShown', 'explanations', 'stepAnswers', 'view', 'camera'
  ];
  const outcomes = ['', 'manual', 'first', 'corrected', 'helped'];
  const feedbacks = ['', 'empty', 'manual', 'first', 'corrected', 'helped', 'wrong', 'other-question'];
  const stepFeedbacks = ['', 'empty', 'correct', 'wrong'];
  const labels = {
    manual: 'Есть запись для обсуждения',
    first: 'Решено с первой попытки',
    corrected: 'Исправлено самостоятельно',
    helped: 'Решено с помощью'
  };
  const shortStatements = {
    'theory-017-example': {
      text: 'Даны прямая a и точка M. Рассмотри случаи M ∈ a и M ∉ a.',
      goal: 'Построй через M плоскость, перпендикулярную a, и докажи, что она единственна.'
    },
    'theory-021': {
      text: 'На модели плоскость α и наклонная прямая a.',
      goal: 'Найди прямоугольную проекцию и угол между a и α. Обоснуй, какой угол ты выбрал.'
    }
  };

  function isRecord(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  }

  function hasFields(value, keys) {
    return isRecord(value) && Reflect.ownKeys(value).length === keys.length && keys.every(key => {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      return descriptor?.enumerable && Object.hasOwn(descriptor, 'value');
    });
  }

  function isIndex(number, max) {
    return Number.isSafeInteger(number) && number >= 0 && number < max;
  }

  function isList(value, max) {
    return Array.isArray(value) && value.length <= max && Reflect.ownKeys(value).length === value.length + 1 &&
      Array.from({ length: value.length }, (_, index) => {
        const descriptor = Object.getOwnPropertyDescriptor(value, index);
        return descriptor?.enumerable && Object.hasOwn(descriptor, 'value');
      }).every(Boolean);
  }

  function isOrderedSelection(values, max) {
    return isList(values, max) && values.every((index, position) => isIndex(index, max) &&
      (position === 0 || values[position - 1] < index));
  }

  function cameraIsValid(camera) {
    return camera === null || (hasFields(camera, ['yaw', 'pitch']) &&
      Number.isFinite(camera.yaw) && Math.abs(camera.yaw) <= 2 * Math.PI &&
      Number.isFinite(camera.pitch) && Math.abs(camera.pitch) <= Math.PI / 2);
  }

  function encodeText(text) {
    return /<\/?[a-z][^>]*>/i.test(text) || text.startsWith(wirePrefix) ?
      wirePrefix + JSON.stringify(text).replace(/</g, '\\u003c').replace(/>/g, '\\u003e') : text;
  }

  function decodeText(text) {
    return text.startsWith(wirePrefix) ? JSON.parse(text.slice(wirePrefix.length)) : text;
  }

  function validWireText(value, limit) {
    if (typeof value !== 'string' || value.length > limit * 6 + wirePrefix.length + 2) return false;
    const text = decodeText(value);
    return typeof text === 'string' && text.length <= limit && encodeText(text) === value;
  }

  function normalize(text) {
    return String(text).trim().toLocaleLowerCase('ru').replace(/[−–]/g, '-').replace(/,/g, '.')
      .replace(/градус(?:а|ов)?(?=$|\s)/gu, '°').replace(/\s+/gu, '');
  }

  function numericAnswer(text) {
    const match = /^([+-]?\d{1,12}(?:\.\d{1,12})?)(?:\/([+-]?\d{1,12}(?:\.\d{1,12})?))?(°|см[²³]?|м[²³]?)?$/.exec(text);
    if (!match) return null;
    const decimal = value => ({
      numerator: BigInt(value.replace('.', '')),
      denominator: 10n ** BigInt(value.split('.')[1]?.length || 0)
    });
    const a = decimal(match[1]), b = decimal(match[2] || '1');
    if (b.numerator === 0n) return null;
    return { numerator: a.numerator * b.denominator, denominator: a.denominator * b.numerator, unit: match[3] || '' };
  }

  function answersMatch(left, right) {
    const a = normalize(left), b = normalize(right);
    if (a === b) return true;
    if (a.includes(';') || b.includes(';')) {
      const partsA = a.split(';'), partsB = b.split(';');
      return partsA.length === partsB.length && partsA.every((part, index) => part && answersMatch(part, partsB[index]));
    }
    const x = numericAnswer(a), y = numericAnswer(b);
    return Boolean(x && y && x.unit === y.unit && x.numerator * y.denominator === y.numerator * x.denominator);
  }

  function accept(value, list) {
    return value.trim() !== '' && list.some(answer => answersMatch(value, answer));
  }

  function hintsFor(lesson) {
    const hints = [];
    function visit(items, parent = null) {
      for (const item of items || []) {
        const index = hints.length;
        hints.push({ ...item, parent });
        visit(item.children, index);
      }
    }
    visit(lesson.help);
    return hints;
  }

  function prepare(bundle) {
    if (bundle?.schemaVersion !== 1 || !Array.isArray(bundle.stages) || !bundle.stages.length ||
        !Array.isArray(bundle.lessons) || !bundle.lessons.length) throw new TypeError('Неверный формат курса.');
    const stages = bundle.stages;
    if (new Set(stages.map(stage => stage.id)).size !== stages.length || stages.some(stage =>
      !/^[a-z0-9][a-z0-9-]{0,79}$/.test(stage.id) || typeof stage.title !== 'string' ||
      !stage.title || typeof stage.description !== 'string' || !Array.isArray(stage.lessonIds) || !stage.lessonIds.length)) {
      throw new TypeError('Неверные этапы курса.');
    }
    const lessons = new Map();
    for (const lesson of bundle.lessons) {
      if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(lesson.id) || lessons.has(lesson.id) ||
          !lesson.title || !lesson.statement?.text || !lesson.visualization?.model ||
          !Array.isArray(lesson.steps) || lesson.steps.length > 20 || hintsFor(lesson).length > 24) {
        throw new TypeError('Неверная карточка курса.');
      }
      lessons.set(lesson.id, { ...lesson, hints: hintsFor(lesson) });
    }
    const lessonIds = stages.flatMap(stage => stage.lessonIds);
    if (lessonIds.length !== lessons.size || new Set(lessonIds).size !== lessonIds.length ||
        lessonIds.some(id => !lessons.has(id))) throw new TypeError('Неверный порядок карточек курса.');
    return { stages, lessons, lessonIds };
  }

  function emptyWork() {
    return {
      draft: '', firstAnswer: '', attempts: 0, outcome: '', feedback: '', assisted: false,
      helpOpen: false, hints: [], stepsShown: 0, explanations: [], stepAnswers: [], view: 'neutral', camera: null
    };
  }

  function copy(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function workForTransport(work, transform) {
    return {
      ...copy(work), draft: transform(work.draft), firstAnswer: transform(work.firstAnswer),
      stepAnswers: work.stepAnswers.map(entry => ({ ...entry, draft: transform(entry.draft) }))
    };
  }

  function validateState(course, state) {
    try {
      if (!hasFields(state, ['version', 'lessonId', 'work']) || state.version !== 1) return false;
      if (state.lessonId === null) return state.work === null;
      const lesson = course.lessons.get(state.lessonId), work = state.work;
      if (!lesson || !hasFields(work, workFields) || !validWireText(work.draft, draftLimit) ||
          !validWireText(work.firstAnswer, draftLimit) || !isIndex(work.attempts, checkLimit + 1) ||
          (work.attempts > 0) !== (work.firstAnswer.trim() !== '') ||
          !outcomes.includes(work.outcome) || !feedbacks.includes(work.feedback) ||
          typeof work.assisted !== 'boolean' || typeof work.helpOpen !== 'boolean' ||
          !isIndex(work.stepsShown, lesson.steps.length + 1) || !isOrderedSelection(work.hints, lesson.hints.length) ||
          !isOrderedSelection(work.explanations, work.stepsShown) || !cameraIsValid(work.camera) ||
          typeof work.view !== 'string' || (work.view !== 'neutral' && !Object.hasOwn(lesson.visualization.model.views || {}, work.view)) ||
          !isList(work.stepAnswers, work.stepsShown)) return false;
      if (lesson.answer?.mode === 'exact' ? work.outcome === 'manual' || work.feedback === 'manual' :
        work.attempts !== 0 || !['', 'manual'].includes(work.outcome) || !['', 'empty', 'manual'].includes(work.feedback)) return false;
      if (lesson.visualization.model.planar && work.camera && (work.camera.yaw !== 0 || work.camera.pitch !== -Math.PI / 2)) return false;
      if ((work.stepsShown > 0 || work.hints.length) && !work.assisted) return false;
      if (work.hints.some(index => lesson.hints[index].parent !== null && !work.hints.includes(lesson.hints[index].parent))) return false;
      if (!work.stepAnswers.every((entry, index) => hasFields(entry, ['step', 'draft', 'feedback']) &&
        isIndex(entry.step, work.stepsShown) && lesson.steps[entry.step].input &&
        (index === 0 || work.stepAnswers[index - 1].step < entry.step) &&
        validWireText(entry.draft, stepDraftLimit) && stepFeedbacks.includes(entry.feedback))) return false;
      return new TextEncoder().encode(JSON.stringify(state)).length <= 64 * 1024;
    } catch (_) { return false; }
  }

  function create(host, bundle, options = {}) {
    const course = prepare(bundle), board = options.board === true;
    const doc = host.ownerDocument, win = doc.defaultView;
    const memory = new Map();
    let current = null, viewer = null, modelNode = null, work = null, last = null;
    let storage = null, notifyRoom = () => {}, registration = null, timer = null, applying = false;
    if (!board) {
      try {
        storage = options.storage ?? win.localStorage;
        last = storage.getItem(storagePrefix + 'last');
      } catch (_) { storage = null; }
    }

    function node(tag, text, className) {
      const result = doc.createElement(tag);
      if (className) result.className = className;
      if (text !== undefined) appendText(result, text);
      return result;
    }

    function appendText(target, text) {
      if (win.StereoMath?.appendText) win.StereoMath.appendText(target, text);
      else target.append(doc.createTextNode(text));
    }

    function button(label, action, className) {
      const element = node('button', label, className);
      element.type = 'button';
      element.addEventListener('click', action);
      return element;
    }

    function link(label, href, className) {
      const anchor = node('a', label, className);
      anchor.href = href;
      return anchor;
    }

    function boardLink(lesson) {
      const target = new URL('/trainers/trainer-board.html', win.location.href);
      target.searchParams.set('trainer', trainerPath + (lesson ? '#' + encodeURIComponent(lesson.id) : ''));
      const anchor = link('На доску', target.pathname + target.search, 'literacy-button');
      anchor.dataset.literacyBoardOpen = '';
      return anchor;
    }

    function loadWork(id) {
      if (memory.has(id)) return memory.get(id);
      try {
        const saved = JSON.parse(storage?.getItem(storagePrefix + id) || 'null');
        if (validateState(course, { version: 1, lessonId: id, work: saved })) {
          const value = workForTransport(saved, decodeText);
          memory.set(id, value);
          return value;
        }
      } catch (_) { /* A broken record does not stop the route. */ }
      return null;
    }

    function save() {
      if (!current) return;
      memory.set(current.id, work);
      if (!storage) return;
      try {
        storage.setItem(storagePrefix + current.id, JSON.stringify(workForTransport(work, encodeText)));
        storage.setItem(storagePrefix + 'last', current.id);
      } catch (_) { /* Work stays in this tab if local storage is unavailable. */ }
    }

    function sendSoon() {
      if (!board || !registration || applying) return;
      win.clearTimeout(timer);
      timer = win.setTimeout(() => notifyRoom(), 70);
    }

    function changed() {
      save();
      sendSoon();
    }

    function setAddress(id) {
      const hash = id ? '#' + encodeURIComponent(id) : '';
      if (win.location.hash !== hash) win.history.replaceState(null, '', win.location.pathname + win.location.search + hash);
    }

    function open(id, focus = true) {
      if (id !== null && !course.lessons.has(id)) return false;
      current = id === null ? null : course.lessons.get(id);
      work = current ? loadWork(id) || emptyWork() : null;
      if (current) last = current.id;
      setAddress(id);
      render(focus);
      changed();
      return true;
    }

    function openFromAddress() {
      let id = null;
      try { id = decodeURIComponent(win.location.hash.slice(1)); } catch (_) { /* Open the route. */ }
      open(course.lessons.has(id) ? id : null, false);
    }

    function destroyModel() {
      viewer?.destroy();
      viewer = null;
      modelNode = null;
    }

    function mountModel(target) {
      viewer?.destroy();
      modelNode = target;
      viewer = win.TaskSceneViewer.mount(target, current.visualization.model, {
        savedCamera: work.camera,
        onChange(camera) {
          work.camera = camera;
          changed();
        }
      });
      viewer.setView(work.view);
    }

    function focusStart(element) {
      element.tabIndex = -1;
      element.focus({ preventScroll: true });
      element.scrollIntoView?.({ block: 'start' });
    }

    function nav() {
      const items = node('nav', undefined, 'literacy-nav');
      items.setAttribute('aria-label', 'Навигация по курсу');
      if (current) items.append(button('К маршруту', () => open(null), 'literacy-button'));
      if (!board) {
        items.append(boardLink(current));
        if (!doc.querySelector('body > .literacy-site-nav a[href="/"]')) items.append(link('На главную', '/', 'literacy-button'));
      }
      return items;
    }

    function renderRoute(focus) {
      const route = node('div', undefined, 'literacy-route');
      const heading = node('h1', 'Стереометрическая грамота');
      route.append(heading, node('p', 'От чтения пространственного чертежа до сечений и линейного угла двугранного угла.'));
      if (board) route.append(node('p', 'Выбери карточку для общего разбора. Личные черновики сохраняются отдельно.', 'literacy-status'));
      else if (last && course.lessons.has(last)) route.append(button('Продолжить', () => open(last), 'literacy-button'));
      for (const stage of course.stages) {
        const section = node('section', undefined, 'literacy-stage');
        section.id = 'stage-' + stage.id;
        section.append(node('h2', stage.title), node('p', stage.description));
        const list = node('ul', undefined, 'literacy-lesson-list');
        for (const id of stage.lessonIds) {
          const lesson = course.lessons.get(id), entry = node('li');
          const item = button(lesson.title, () => open(id), 'literacy-button');
          item.dataset.literacyLesson = id;
          entry.append(item);
          const saved = loadWork(id);
          if (saved?.outcome) entry.append(node('small', labels[saved.outcome], 'literacy-status'));
          else if (saved?.draft) entry.append(node('small', 'Есть черновик', 'literacy-status'));
          list.append(entry);
        }
        section.append(list);
        route.append(section);
      }
      host.append(route);
      if (focus) focusStart(heading);
    }

    function viewOf(key) {
      if (key && Object.hasOwn(current.visualization.model.views || {}, key)) {
        work.view = key;
        viewer?.setView(key);
      }
    }

    function feedbackLabel(value) {
      return {
        '': '', empty: 'Сначала запиши ответ или рассуждение.',
        manual: board ? 'Запись готова для разбора на доске. Обоснование проверяет преподаватель.' :
          'Рассуждение записано для обсуждения с преподавателем.',
        first: 'Верно с первой попытки.', corrected: 'Верно. Ты исправил ответ самостоятельно.',
        helped: 'Верно. Ответ найден с помощью.',
        wrong: 'Ответ пока не совпал. Проверь, что именно нужно найти.',
        'other-question': 'Ты указал длину BB₁ из условия. Вопрос о длине CC₁.'
      }[value];
    }

    function refreshFeedback() {
      const answer = host.querySelector('[data-literacy-answer]');
      if (answer && answer.value !== work.draft) answer.value = work.draft;
      const feedback = host.querySelector('[data-literacy-feedback]');
      if (feedback) feedback.textContent = feedbackLabel(work.feedback);
      for (const field of host.querySelectorAll('[data-literacy-step-answer]')) {
        const index = Number(field.dataset.literacyStepAnswer);
        const entry = work.stepAnswers.find(answer => answer.step === index);
        const draft = entry?.draft || '';
        if (field.value !== draft) field.value = draft;
        const result = host.querySelector('[data-literacy-step-feedback="' + index + '"]');
        result.textContent = { '': '', empty: 'Сначала запиши ответ.', correct: 'Верно.', wrong: 'Ответ пока не совпал.' }[entry?.feedback || ''];
      }
    }

    function checkAnswer(answer) {
      if (!work.draft.trim()) work.feedback = 'empty';
      else if (answer?.mode !== 'exact') work.outcome = work.feedback = 'manual';
      else {
        if (work.attempts === 0) work.firstAnswer = work.draft;
        work.attempts = Math.min(checkLimit, work.attempts + 1);
        if (accept(work.draft, answer.accepted)) {
          const result = work.outcome || (work.assisted ? 'helped' : work.attempts === 1 ? 'first' : 'corrected');
          work.outcome = work.feedback = result;
        } else work.feedback = current.id === 'ex-main-0018-a' && accept(work.draft, ['7', '7 см']) ? 'other-question' : 'wrong';
      }
      refreshFeedback();
      changed();
    }

    function answerForm(answer) {
      const exact = answer?.mode === 'exact';
      const form = node('form', undefined, 'literacy-form');
      const field = node(exact ? 'input' : 'textarea');
      field.id = 'literacy-answer';
      field.dataset.literacyAnswer = '';
      field.maxLength = draftLimit;
      field.autocomplete = 'off';
      field.value = work.draft;
      if (!exact) field.rows = 3;
      const label = node('label', answer?.prompt || 'Запиши своё объяснение.');
      label.htmlFor = field.id;
      const submit = node('button', exact ? 'Проверить ответ' : 'Сохранить рассуждение', 'literacy-button');
      submit.type = 'submit';
      const feedback = node('p', undefined, 'literacy-status');
      feedback.dataset.literacyFeedback = '';
      feedback.setAttribute('role', 'status');
      field.addEventListener('input', () => {
        work.draft = field.value.slice(0, draftLimit);
        work.feedback = '';
        refreshFeedback();
        changed();
      });
      form.addEventListener('submit', event => {
        event.preventDefault();
        checkAnswer(answer);
      });
      form.append(label, field, submit, feedback);
      return form;
    }

    function rerenderAndFocus(selector) {
      changed();
      render(false);
      host.querySelector(selector)?.focus({ preventScroll: true });
    }

    function relatedCard(id) {
      const related = course.lessons.get(id);
      return related && id !== current.id ? button(related.title, () => open(id), 'literacy-button') : null;
    }

    function renderHelp() {
      const block = node('section', undefined, 'literacy-help');
      const toggle = button(work.helpOpen ? 'Закрыть подсказки' : 'Подсказки', () => {
        work.helpOpen = !work.helpOpen;
        rerenderAndFocus('[data-literacy-help-toggle]');
      }, 'literacy-button');
      toggle.dataset.literacyHelpToggle = '';
      toggle.setAttribute('aria-expanded', String(work.helpOpen));
      block.append(toggle);
      if (!work.helpOpen) return block;
      const list = node('ol');
      for (const [index, hint] of current.hints.entries()) {
        if (hint.parent !== null && !work.hints.includes(hint.parent)) continue;
        const item = node('li');
        if (work.hints.includes(index)) {
          const question = node('strong', hint.question);
          question.tabIndex = -1;
          question.dataset.literacyHintOpen = String(index);
          item.append(question, node('p', hint.text));
          for (const id of hint.theoryIds || []) {
            const related = relatedCard(id);
            if (related) item.append(related);
          }
        } else {
          const reveal = button(hint.question, () => {
            work.assisted = true;
            work.hints = [...work.hints, index].sort((a, b) => a - b);
            viewOf(hint.view);
            rerenderAndFocus('[data-literacy-hint-open="' + index + '"]');
          }, 'literacy-button');
          reveal.dataset.literacyHint = String(index);
          item.append(reveal);
        }
        list.append(item);
      }
      block.append(list);
      return block;
    }

    function renderStepAnswer(step, index) {
      const form = node('form', undefined, 'literacy-form');
      const field = node('input'), label = node('label', step.input.prompt);
      field.id = 'literacy-step-answer-' + index;
      field.dataset.literacyStepAnswer = String(index);
      field.maxLength = stepDraftLimit;
      field.autocomplete = 'off';
      label.htmlFor = field.id;
      const submit = node('button', 'Проверить шаг', 'literacy-button');
      submit.type = 'submit';
      const feedback = node('p', undefined, 'literacy-status');
      feedback.dataset.literacyStepFeedback = String(index);
      feedback.setAttribute('role', 'status');
      function update(check) {
        const draft = field.value.slice(0, stepDraftLimit);
        const value = { step: index, draft, feedback: check ? !draft.trim() ? 'empty' : accept(draft, step.input.accepted) ? 'correct' : 'wrong' : '' };
        work.stepAnswers = [...work.stepAnswers.filter(item => item.step !== index), value].sort((a, b) => a.step - b.step);
        refreshFeedback();
        changed();
      }
      field.addEventListener('input', () => update(false));
      form.addEventListener('submit', event => { event.preventDefault(); update(true); });
      form.append(label, field, submit, feedback);
      return form;
    }

    function nextStep() {
      work.assisted = true;
      work.stepsShown++;
      rerenderAndFocus('[data-literacy-step="' + (work.stepsShown - 1) + '"]');
    }

    function renderSteps() {
      const block = node('section', undefined, 'literacy-steps');
      for (let index = 0; index < work.stepsShown; index++) {
        const step = current.steps[index], section = node('article', undefined, 'literacy-step');
        section.dataset.literacyStep = String(index);
        section.tabIndex = -1;
        section.append(node('h2', 'Шаг ' + (index + 1) + '. ' + step.title), node('p', step.prompt));
        if (step.input) section.append(renderStepAnswer(step, index));
        if (work.explanations.includes(index)) {
          const explanation = node('p', step.explanation);
          explanation.tabIndex = -1;
          explanation.dataset.literacyExplanationOpen = String(index);
          section.append(explanation);
          if (step.justifications?.length) {
            const reasons = node('ul');
            for (const reason of step.justifications) {
              const item = node('li', reason.text), related = relatedCard(reason.theoryId);
              if (related) item.append(related);
              reasons.append(item);
            }
            section.append(reasons);
          }
        } else {
          const reveal = button('Показать объяснение', () => {
            work.explanations = [...work.explanations, index].sort((a, b) => a - b);
            viewOf(step.view);
            rerenderAndFocus('[data-literacy-explanation-open="' + index + '"]');
          }, 'literacy-button');
          reveal.dataset.literacyExplain = String(index);
          section.append(reveal);
        }
        block.append(section);
      }
      if (work.stepsShown > 0 && work.stepsShown < current.steps.length) {
        const next = button('Следующий шаг', nextStep, 'literacy-button');
        next.dataset.literacyNextStep = '';
        block.append(next);
      }
      return block;
    }

    function renderCard(focus) {
      const card = node('article', undefined, 'literacy-card');
      const heading = node('h1', current.title);
      const statement = node('div', undefined, 'literacy-prompt');
      const short = current.revision === 1 ? shortStatements[current.id] : null;
      const condition = node('p', short?.text || current.statement.text, 'literacy-condition');
      statement.append(condition);
      if (current.statement.goal) statement.append(node('p', short?.goal || current.statement.goal, 'literacy-goal'));
      const exact = current.answer?.mode === 'exact', form = answerForm(current.answer);
      const actions = node('div', undefined, 'literacy-actions');
      if (!exact) actions.append(button('К записи решения', () => host.querySelector('[data-literacy-answer]')?.focus(), 'literacy-button'));
      if (!work.stepsShown && current.steps.length) {
        const start = button('Разобрать по шагам', nextStep, 'literacy-button');
        start.dataset.literacyStartSteps = '';
        actions.append(start);
      } else if (work.stepsShown) actions.append(button('К открытым шагам', () => focusStart(host.querySelector('[data-literacy-step]')), 'literacy-button'));
      if (exact) statement.append(form);
      statement.append(actions);
      const model = node('div', undefined, 'literacy-model task-scene');
      model.setAttribute('aria-label', 'Пространственный рисунок');
      card.append(heading, statement, model);
      if (!exact) card.append(form);
      if (short || current.statement.givens?.length || current.visualization.caption) {
        const details = node('details');
        details.append(node('summary', short ? 'Полное условие' : 'Условие и обозначения'));
        if (short) details.append(node('p', current.statement.text), node('p', current.statement.goal));
        if (current.statement.givens?.length) {
          const givens = node('ul');
          for (const line of current.statement.givens) givens.append(node('li', line));
          details.append(givens);
        }
        if (current.visualization.caption) details.append(node('p', current.visualization.caption));
        card.append(details);
      }
      if (current.hints.length) card.append(renderHelp());
      card.append(renderSteps());
      const footer = node('footer', undefined, 'literacy-footer');
      if (!board) footer.append(link('Карточка учебника', '/stereo-course/textbook/#' + encodeURIComponent(current.id), 'literacy-button'));
      else if (current.source?.printedPages?.length) footer.append(node('p', 'Атанасян, 10–11 классы · с. ' + current.source.printedPages.join(', ')));
      const position = course.lessonIds.indexOf(current.id);
      if (position > 0) footer.append(button('Предыдущая карточка', () => open(course.lessonIds[position - 1]), 'literacy-button'));
      if (position + 1 < course.lessonIds.length) footer.append(button('Следующая карточка', () => open(course.lessonIds[position + 1]), 'literacy-button'));
      else footer.append(button('К маршруту', () => open(null), 'literacy-button'));
      card.append(footer);
      host.append(card);
      mountModel(model);
      refreshFeedback();
      if (focus) focusStart(heading);
    }

    function render(focus) {
      destroyModel();
      host.replaceChildren(nav());
      if (current) renderCard(focus);
      else renderRoute(focus);
    }

    function getState() {
      return { version: 1, lessonId: current?.id ?? null, work: work ? workForTransport(work, encodeText) : null };
    }

    function structure(value) {
      return JSON.stringify([value.helpOpen, value.hints, value.stepsShown, value.explanations]);
    }

    function applyState(state) {
      if (!board || !validateState(course, state)) return false;
      win.clearTimeout(timer);
      applying = true;
      try {
        const sameLesson = current?.id === state.lessonId;
        const before = work;
        current = course.lessons.get(state.lessonId) || null;
        work = current ? workForTransport(state.work, decodeText) : null;
        setAddress(state.lessonId);
        if (current) {
          last = current.id;
          memory.set(current.id, work);
        }
        if (!sameLesson || !work || !before || structure(before) !== structure(work)) render(false);
        else {
          if (JSON.stringify(before.camera) !== JSON.stringify(work.camera)) mountModel(modelNode);
          else if (before.view !== work.view) viewer.setView(work.view);
          refreshFeedback();
        }
        return true;
      } finally { applying = false; }
    }

    win.addEventListener('hashchange', openFromAddress);
    openFromAddress();
    if (board) {
      registration = win.MathExamBoard.register({
        id: trainerId, version: '1.0.0', stateSchemaVersion: 1, parentOrigin: win.location.origin,
        getState() {
          const state = getState();
          if (!validateState(course, state)) throw new TypeError('Неверное состояние курса.');
          return state;
        },
        applyState(state) {
          if (!applyState(state)) throw new TypeError('Состояние общей карточки не прошло проверку.');
        },
        subscribe(callback) {
          notifyRoom = callback;
          return () => { notifyRoom = () => {}; };
        }
      });
    }
    return Object.freeze({
      open, getState, applyState, validateState: state => validateState(course, state),
      destroy() {
        win.removeEventListener('hashchange', openFromAddress);
        win.clearTimeout(timer);
        registration?.destroy();
        destroyModel();
        host.replaceChildren();
      }
    });
  }

  root.StereoLiteracy = Object.freeze({ create, accept });
  const host = root.document?.getElementById('literacy-app');
  if (host) {
    root.fetch('/stereo-course/literacy/data/course.json', { cache: 'no-cache' }).then(response => {
      if (!response.ok) throw new Error('Курс недоступен.');
      return response.json();
    }).then(bundle => {
      root.stereoLiteracyApp = create(host, bundle, { board: root.document.body.hasAttribute('data-literacy-board') });
    }).catch(() => {
      host.textContent = 'Материалы курса не загрузились. Попробуй обновить страницу.';
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);

(function () {
  'use strict';

  const host = document.getElementById('shared-book');
  const trainerId = 'atanasyan-stereo-textbook';
  const textPrefix = '~mathexam-text~';
  const wireText = value => value.startsWith(textPrefix) || /<\/?[a-z][^>]*>/i.test(value)
    ? textPrefix + JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e') : value;
  const plainText = value => value.startsWith(textPrefix) ? JSON.parse(value.slice(textPrefix.length)) : value;
  const bounded = (n, min, max) => Number.isInteger(n) && n >= min && n <= max;

  function mount(course) {
    const { available, issues } = StereoTextbook.inspectBundle(course.catalog, course.lessons);
    if (issues.length || !available.size) throw Error('Неполные данные курса');
    const select = document.createElement('select');
    select.id = 'card';
    const cards = new Map(), titles = new Map();
    const search = document.createElement('input');
    search.type = 'search'; search.id = 'find-number'; search.placeholder = 'Например, 412 или пирамида';
    const searchLabel = document.createElement('label');
    searchLabel.htmlFor = search.id; searchLabel.textContent = 'Номер или название';
    const found = document.createElement('p'); found.setAttribute('role', 'status');
    for (const card of available.values()) {
      const hints = [];
      function visit(item) {
        hints.push(item);
        (item.children || []).forEach(visit);
      }
      card.help.forEach(visit);
      cards.set(card.id, { card, hints });
      const s = card.source;
      const number = s.exercise ? '№' + s.exercise + (s.subpart || '') : s.point ? 'Пункт ' + s.point : '';
      const title = [number, card.title].filter(Boolean).join(' · ');
      titles.set(card.id, title); select.add(new Option(title, card.id));
    }
    const label = document.createElement('label');
    label.htmlFor = 'card';
    label.textContent = 'Выберите задачу или тему';
    const info = document.createElement('p');
    info.textContent = 'Общий черновик относится к открытой карточке. Выбор другой карточки начинает новый совместный разбор.';
    const content = document.createElement('section');
    host.replaceChildren(searchLabel, search, found, label, select, info, content);
    let viewer, bridge, state;

    function updateOptions() {
      const term = search.value.trim().toLocaleLowerCase('ru').replace(/^№\s*/, '');
      const result = [...cards.values()].filter(({ card }) => !term ||
        (/^\d+$/.test(term) ? card.source.exercise === term || card.source.point === term
          : titles.get(card.id).toLocaleLowerCase('ru').includes(term)));
      select.replaceChildren(...result.map(({ card }) => new Option(titles.get(card.id), card.id)));
      if (result.some(({ card }) => card.id === state.id)) select.value = state.id;
      else select.selectedIndex = -1;
      found.textContent = term ? 'Найдено карточек: ' + result.length : '';
    }
    search.addEventListener('input', updateOptions);
    search.addEventListener('keydown', event => {
      if (event.key === 'Enter' && select.options.length) {
        const number = search.value.trim().replace(/^№\s*/, '');
        const byExercise = [...select.options].find(option => cards.get(option.value).card.source.exercise === number);
        select.value = byExercise?.value || select.options[0].value;
        select.dispatchEvent(new Event('change'));
      }
    });
    function fresh(id) {
      return { id, hint: 0, step: 0, stepAnswers: {}, work: '', checked: false, camera: null, view: 'neutral' };
    }
    function validText(value, limit) {
      if (typeof value !== 'string') return false;
      try {
        const plain = plainText(value);
        return typeof plain === 'string' && plain.length <= limit && wireText(plain) === value;
      } catch { return false; }
    }
    function validate(value) {
      if (!value) return false;
      const keys = Object.keys(value).sort().join(',');
      if (keys !== 'camera,checked,hint,id,step,stepAnswers,view,work' &&
          keys !== 'camera,checked,hint,id,step,view,work') return false;
      const row = cards.get(value.id);
      if (!row || typeof value.checked !== 'boolean' || !validText(value.work, 3000) ||
          !bounded(value.hint, 0, row.hints.length) || !bounded(value.step, 0, row.card.steps.length) ||
          !Object.hasOwn(row.card.visualization.model.views, value.view)) return false;
      if (Object.hasOwn(value, 'stepAnswers')) {
        const answers = value.stepAnswers;
        if (!answers || typeof answers !== 'object' || Array.isArray(answers)) return false;
        const opened = row.card.steps.slice(0, value.step).filter(step => step.input);
        for (const [id, entry] of Object.entries(answers)) {
          if (!opened.some(step => step.id === id) || !entry ||
              Object.keys(entry).sort().join(',') !== 'checked,work' ||
              typeof entry.checked !== 'boolean' || !validText(entry.work, 300)) return false;
        }
      }
      const camera = value.camera;
      return camera === null || !!camera && Object.keys(camera).sort().join(',') === 'pitch,yaw' &&
        Number.isFinite(camera.yaw) && Math.abs(camera.yaw) <= 2 * Math.PI &&
        Number.isFinite(camera.pitch) && Math.abs(camera.pitch) <= Math.PI / 2;
    }
    function publish() { bridge?.notifyStateChanged(); }
    function el(tag, value, parent = content) {
      const node = document.createElement(tag);
      if (value) StereoMath.appendText(node, value);
      parent.append(node);
      return node;
    }
    function render() {
      viewer?.destroy();
      if (![...select.options].some(option => option.value === state.id)) {
        search.value = ''; updateOptions();
      }
      select.value = state.id;
      history.replaceState(null, '', '#' + state.id);
      content.replaceChildren();
      const { card, hints } = cards.get(state.id);
      el('h2', card.title);
      const figure = el('div');
      figure.className = 'task-scene';
      viewer = TaskSceneViewer.mount(figure, card.visualization.model, {
        lessonId: card.id, savedCamera: state.camera, onChange(camera) { state.camera = camera; publish(); }
      });
      viewer.setView(state.view);
      el('p', card.statement.text);
      for (const given of card.statement.givens || []) el('p', given);
      el('p', card.statement.goal);
      const prompt = el('label', card.answer?.prompt || 'Запиши своё объяснение');
      prompt.htmlFor = 'work';
      const work = el('textarea');
      work.id = 'work'; work.rows = 4; work.maxLength = 3000; work.value = plainText(state.work);
      const check = el('button', card.answer?.mode === 'exact' ? 'Проверить ответ' : 'Сверить рассуждение');
      const feedback = el('p'); feedback.setAttribute('role', 'status');
      function showFeedback() {
        feedback.replaceChildren();
        if (!state.checked) return;
        let message;
        if (!work.value.trim()) message = 'Сначала запиши ответ или первый довод.';
        else if (card.answer?.mode === 'exact') {
          const result = StereoTextbook.classifyAnswer(work.value, card.answer.accepted);
          message = result.status === 'correct' ? 'Ответ совпал.' : result.message || 'Проверь ответ. Можно открыть ближайшую подсказку.';
        } else message = card.answer?.feedback || 'Сопоставь переходы в своём рассуждении с пояснениями. Полный текст можно обсудить с преподавателем.';
        StereoMath.appendText(feedback, message);
      }
      work.addEventListener('input', () => { state.work = wireText(work.value); state.checked = false; showFeedback(); publish(); });
      check.addEventListener('click', () => { state.checked = true; showFeedback(); publish(); });
      showFeedback();
      const actions = el('div'); actions.className = 'actions';
      const hintButton = el('button', 'Подсказка', actions), stepButton = el('button', 'Следующий шаг', actions);
      const help = el('section'), steps = el('section');
      help.id = 'hint'; steps.id = 'step';
      function stepPractice(step) {
        const label = el('label', step.input.prompt, steps);
        const field = el('input', '', steps);
        field.id = 'work-' + step.id; field.maxLength = 300; label.htmlFor = field.id;
        const answer = state.stepAnswers[step.id] || {work:'', checked:false};
        field.value = plainText(answer.work);
        const button = el('button', 'Проверить этот шаг', steps);
        const feedback = el('p', '', steps);
        feedback.setAttribute('role', 'status');
        feedback.dataset.stepFeedback = step.id;
        function showResult() {
          feedback.replaceChildren();
          delete feedback.dataset.answerStatus;
          if (!answer.checked) return;
          const result = StereoTextbook.classifyAnswer(field.value, step.input.accepted);
          feedback.dataset.answerStatus = result.status;
          const message = result.status === 'correct' ? 'Ответ на этот шаг совпал.'
            : result.status === 'wrong' ? step.input.feedback : result.message;
          StereoMath.appendText(feedback, message);
        }
        field.addEventListener('input', () => {
          answer.work = wireText(field.value); answer.checked = false;
          state.stepAnswers[step.id] = answer; showResult(); publish();
        });
        button.addEventListener('click', () => {
          answer.checked = true;
          state.stepAnswers[step.id] = answer; showResult(); publish();
        });
        showResult();
      }
      function displayHelp() {
        help.replaceChildren(); steps.replaceChildren();
        for (const hint of hints.slice(0, state.hint)) {
          el('h3', hint.question, help); el('p', hint.text, help);
        }
        for (const step of card.steps.slice(0, state.step)) {
          el('h3', step.title, steps); el('p', step.prompt, steps);
          el('p', step.explanation, steps);
          for (const reason of step.justifications || []) el('p', reason.text, steps);
          if (step.input) stepPractice(step);
        }
        hintButton.disabled = state.hint >= hints.length;
        stepButton.disabled = state.step >= card.steps.length;
      }
      function advance(key, items) {
        const item = items[state[key]];
        if (!item) return;
        state[key]++;
        state.view = item.view || 'neutral';
        viewer.setView(state.view);
        displayHelp(); publish();
      }
      hintButton.addEventListener('click', () => advance('hint', hints));
      stepButton.addEventListener('click', () => advance('step', card.steps));
      displayHelp();
    }
    select.addEventListener('change', () => { state = fresh(select.value); render(); publish(); });
    const initial = location.hash.slice(1);
    state = fresh(cards.has(initial) ? initial : cards.keys().next().value);
    render();
    bridge = MathExamBoard.register({
      id: trainerId, version: '1.0.0', stateSchemaVersion: 1, parentOrigin: location.origin,
      getState() { return structuredClone(state); },
      applyState(next) {
        if (!validate(next)) throw TypeError('Некорректное состояние задачи');
        state = {...fresh(next.id), ...structuredClone(next)};
        render();
      }
    });
  }
  fetch('/stereo-course/textbook/data/course.json')
    .then(response => { if (!response.ok) throw Error('Не удалось загрузить задачи'); return response.json(); })
    .then(mount)
    .catch(() => { host.textContent = 'Не удалось открыть задачи. Обновите страницу.'; });
})();

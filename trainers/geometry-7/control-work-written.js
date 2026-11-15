(() => {
  'use strict';

  const storagePrefix = 'geometry7-control-written-v1';
  const fields = ['given', 'goal', 'solution'];
  const fieldLimits = [2000, 2000, 6000];
  const toolDemos = {
    'tool-segment': 'Точки, отрезок и отмена',
    'tool-intersection': 'Точка пересечения',
    'tool-arc': 'Дуга угла',
    'tool-tick': 'Засечки на равных отрезках'
  };
  const toolDemoIds = Object.keys(toolDemos);
  const demoPanels = ['draw-demo', 'write-demo', ...toolDemoIds];
  const panels = ['tools', 'scheme', 'hint', 'example', 'tool-demos', ...demoPanels];

  function makeVariants(trainers) {
    const items = new Map(trainers.map(trainer => [trainer.id, trainer.items]));
    const task = (id, details, index = 0) => ({ ...items.get(id)[index], ...details });

    return [
      [
        task('adjacent', {
          title: 'Смежные углы',
          prompt: 'Углы AOB и BOC смежные. Найди ∠BOC, если ∠AOB = 68°. Запиши смежные углы, если лучи OA и OD дополнительные и OD не совпадает с OB.',
          diagram: { ...items.get('opposite-rays')[0].diagram, showAngle: true },
          names: 'AOCBD',
          given: '∠AOB и ∠BOC смежные.\n∠AOB = 68°.\nOA и OD — дополнительные лучи.',
          goal: '∠BOC и пара смежных углов с лучом OD.',
          solution: [
            ...items.get('adjacent')[0].solution,
            'Лучи OA и OC дополнительные, так как ∠AOB и ∠BOC смежные.',
            'Луч OD тоже дополнительный к OA, поэтому он совпадает с OC. Углы AOB и BOD смежные.'
          ],
          answer: '∠BOC = 112°. Смежная пара ∠AOB и ∠BOD.'
        }),
        task('sum', {
          title: 'Сумма двух углов',
          names: 'ABCDO',
          given: 'Две прямые пересекаются в точке O.\nСумма двух из образовавшихся углов равна 112°.',
          goal: 'Величины всех четырёх углов.',
          solution: [
            'Сумма смежных углов равна 180°. Так как данная сумма равна 112°, данные углы образуют вертикальную пару.',
            'Вертикальные углы равны, поэтому каждый из них равен 112° : 2 = 56°.',
            'Два других угла смежные с углами по 56°. Каждый равен 180° − 56° = 124°.'
          ],
          answer: '56°, 124°, 56°, 124° при обходе вокруг точки O.'
        }),
        task('intersection', {
          title: 'Две пересекающиеся прямые',
          names: 'ABCDO',
          given: 'Прямые AB и CD пересекаются в точке O.\n∠AOC = 54°.',
          goal: '∠AOD, ∠DOB и ∠BOC.',
          answer: '∠AOD = 126°, ∠DOB = 54°, ∠BOC = 126°.'
        }),
        task('bisector', {
          title: 'Расстояние до сторон угла',
          prompt: 'На биссектрисе угла B, равного 84°, взята точка K. Известно, что BK = 7 см. Найди расстояние от точки K до каждой стороны угла.',
          diagram: { type: 'bisector', angle: 84, showFeet: false },
          names: 'ABCKHM',
          given: '∠B = 84°.\nТочка K лежит на биссектрисе ∠B.\nBK = 7 см.',
          goal: 'Расстояния от K до обеих сторон ∠B.',
          hint: 'Опусти из K перпендикуляры к обеим сторонам. Какие углы у получившихся прямоугольных треугольников равны? Для численного ответа понадобится синус угла 42°.',
          solution: [
            'Опустим из K перпендикуляры KH и KM на стороны угла. Их длины — искомые расстояния.',
            '∠HBK = ∠KBM = 84° : 2 = 42°, поскольку BK — биссектриса. Тогда ∠BKH = ∠BKM = 90° − 42° = 48°.',
            '△BKH и △BKM равны по общей стороне BK и двум прилежащим к ней углам. Поэтому KH = KM.',
            'Для численного ответа используем синус угла 42°. В △BKH катет KH = BK · sin 42°, поэтому KH ≈ 7 · 0,6691 см ≈ 4,68 см.'
          ],
          answer: 'KH = KM = (7 · sin 42°) см ≈ 4,68 см.',
          note: 'Равенство расстояний обосновывается свойствами треугольников из курса геометрии 7 класса. Синус в образце нужен для численного значения.'
        }),
        task('sides', {
          title: 'Стороны равных треугольников',
          names: 'ABCMNK',
          given: '△ABC = △MNK.\nAB = 5 см, BC = 7 см, AC = 9 см.',
          goal: 'MN, NK, MK.',
          answer: 'MN = 5 см, NK = 7 см, MK = 9 см.'
        })
      ],
      [
        task('ratio', {
          title: 'Один угол втрое больше другого',
          names: 'MNPK',
          given: '∠MNK и ∠KNP смежные.\n∠KNP = 3 · ∠MNK.',
          goal: '∠MNK и ∠KNP.',
          solution: [
            'Пусть ∠MNK = x. Тогда ∠KNP = 3x.',
            'Смежные углы в сумме дают 180°, поэтому x + 3x = 180°.',
            'Из 4x = 180° получаем x = 45°. Тогда ∠KNP = 3 · 45° = 135°.'
          ],
          answer: '∠MNK = 45°, ∠KNP = 135°.'
        }),
        task('difference', {
          title: 'Разность двух углов',
          names: 'ABCDO',
          given: 'Две прямые пересекаются.\nОдин из образовавшихся углов на 34° больше другого.',
          goal: 'Величины всех четырёх углов.',
          solution: [
            'Углы различны, значит, они смежные. Пусть меньший угол равен x, тогда больший равен x + 34°.',
            'x + (x + 34°) = 180°. Тогда 2x = 146° и x = 73°. Больший угол равен 73° + 34° = 107°.',
            'У каждого из найденных углов есть равный ему вертикальный угол.'
          ],
          answer: '73°, 107°, 73°, 107° при обходе вокруг точки пересечения.'
        }),
        task('sum', {
          title: 'Сумма вертикальных углов',
          prompt: 'Прямые a и b пересекаются в точке O. Углы 1 и 3 вертикальные, а их сумма равна 126°. Найди углы 1, 2, 3 и 4.',
          names: 'ABCDO',
          given: 'Прямые a и b пересекаются в точке O.\n∠1 и ∠3 вертикальные.\n∠1 + ∠3 = 126°.',
          goal: '∠1, ∠2, ∠3 и ∠4.',
          solution: [
            '∠1 = ∠3 как вертикальные углы. Каждый равен 126° : 2 = 63°.',
            '∠2 смежный с ∠1, поэтому ∠2 = 180° − 63° = 117°.',
            '∠4 вертикальный к ∠2, поэтому ∠4 = ∠2 = 117°.'
          ],
          answer: '∠1 = ∠3 = 63°, ∠2 = ∠4 = 117°.'
        }, 1),
        task('rays', {
          title: 'Угол между двумя лучами',
          prompt: 'От луча AB в одной полуплоскости отложены углы BAC = 30° и BAD = 55°. Найди ∠CAD. Может ли он быть равен 25° или 85°?',
          names: 'ABCD',
          given: 'Лучи AC и AD лежат по одну сторону от прямой AB.\n∠BAC = 30°, ∠BAD = 55°.',
          goal: '∠CAD. Объяснить, подходит ли каждое из значений 25° и 85°.',
          answer: '∠CAD = 25°.'
        }),
        task('proof', {
          title: 'Равенство треугольников',
          names: 'ABCDO',
          given: 'Отрезки AB и CD пересекаются в точке O.\nAO = OB.\n∠ACO = ∠BDO.',
          goal: '△AOC = △BOD.',
          proof: true
        })
      ]
    ];
  }

  function read(key) {
    try {
      const value = JSON.parse(localStorage.getItem(`${storagePrefix}:${key}`));
      return value && typeof value === 'object' ? value : {};
    } catch {
      return {};
    }
  }

  function save(key, patch) {
    try {
      localStorage.setItem(`${storagePrefix}:${key}`, JSON.stringify({ ...read(key), ...patch }));
      return true;
    } catch {
      return false;
    }
  }

  function escape(value) {
    return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  }

  function mount(root, trainers, renderDiagram, { room = false, notify = () => true } = {}) {
    const variants = makeVariants(trainers);
    const drawing = window.GeometryControlDrawing;
    const demos = window.GeometryControlDemos;
    const drafts = new Map();
    const navigation = room ? {} : read('navigation');
    let variant = navigation.variant === 1 ? 1 : 0;
    const questions = variants.map((tasks, index) => {
      const question = navigation.questions?.[index];
      return Number.isInteger(question) && question >= 0 && question < tasks.length ? question : 0;
    });
    let editor = null;
    let activeField = 'given';

    function getRoomState() {
      const records = [];
      for (const [key, draft] of drafts) {
        const text = fields.map(field => draft[field] || '');
        const value = drawing.drawingValue(draft.drawing);
        const hasDrawing = value.points.length || value.marks.length || value.objects.length;
        if (text.some(Boolean) || hasDrawing || draft.open.size || draft.playing.size) {
          records.push([key, text, hasDrawing ? value : null, [...draft.open].sort(), [...draft.playing].sort()]);
        }
      }
      records.sort(([a], [b]) => a.localeCompare(b));
      return { variant, questions, records };
    }

    function applyRoomState(value) {
      if (JSON.stringify(value) === JSON.stringify(getRoomState())) return;
      const invalid = () => { throw new TypeError('Invalid written work state'); };
      const panelSet = (values, allowed) => Array.isArray(values) && values.length <= allowed.length &&
        values.every(name => allowed.includes(name)) && new Set(values).size === values.length;
      if (!value || ![0, 1].includes(value.variant) || !Array.isArray(value.questions) || value.questions.length !== 2 ||
          !value.questions.every((index, v) => Number.isInteger(index) && index >= 0 && index < variants[v].length) ||
          !Array.isArray(value.records) || value.records.length > 10) invalid();
      const next = new Map();
      for (const row of value.records) {
        if (!Array.isArray(row) || row.length !== 5) invalid();
        const [key, text, geometry, open, playing] = row;
        if (typeof key !== 'string' || !/^[12]-[1-5]$/.test(key) || next.has(key) ||
            !Array.isArray(text) || text.length !== fields.length ||
            !text.every((note, index) => typeof note === 'string' && note.length <= fieldLimits[index]) ||
            !panelSet(open, panels) || !panelSet(playing, demoPanels) ||
            !playing.every(panel => open.includes(panel)) ||
            (!open.includes('tool-demos') && toolDemoIds.some(id => open.includes(id)))) invalid();
        let record = drawing.readRoomDrawing(geometry);
        const previous = drafts.get(key)?.drawing;
        if (previous) {
          const before = JSON.stringify(drawing.drawingValue(previous));
          const after = JSON.stringify(drawing.drawingValue(record));
          if (before === after) record = previous;
          else {
            record.history = previous.history.slice(-79);
            if (record.history.at(-1) === after) record.history.pop();
            else record.history.push(before);
          }
        }
        next.set(key, {
          ...Object.fromEntries(fields.map((field, index) => [field, text[index]])),
          drawing: record, open: new Set(open), playing: new Set(playing)
        });
      }
      editor?.destroy();
      editor = null;
      drafts.clear();
      for (const [key, draft] of next) drafts.set(key, draft);
      variant = value.variant;
      questions.splice(0, questions.length, ...value.questions);
      if (!root.hidden) render();
    }

    function render() {
      editor?.destroy();
      const question = questions[variant];
      const tasks = variants[variant];
      const task = tasks[question];
      const key = `${variant + 1}-${question + 1}`;
      if (!drafts.has(key)) {
        const saved = room ? {} : read(key);
        drafts.set(key, { ...saved, drawing: drawing.createRecord(saved.drawing), open: new Set(), playing: new Set() });
      }
      const draft = drafts.get(key);
      const goalLabel = task.proof ? 'Доказать' : 'Найти';
      const solutionLabel = task.proof ? 'Доказательство' : 'Решение';
      const panel = name => `data-written-panel="${name}" ${draft.open.has(name) ? 'open' : ''}`;
      root.innerHTML = `
        <article class="card written-card">
          <div class="written-navigation">
            <div class="switch" role="group" aria-label="Вариант для полного решения">
              ${variants.map((_, index) => `<button type="button" data-written-variant="${index}" aria-pressed="${index === variant}">Вариант ${index + 1}</button>`).join('')}
            </div>
            <div class="steps" role="group" aria-label="Номер задачи">
              ${tasks.map((_, index) => `<button type="button" data-written-question="${index}" aria-label="Задача ${index + 1}" ${index === question ? 'aria-current="true"' : ''}>${index + 1}</button>`).join('')}
            </div>
          </div>
          <header class="written-problem">
            <h2 id="written-title" tabindex="-1">№${question + 1}. ${escape(task.title)}</h2>
            <p class="prompt">${escape(task.prompt)}</p>
          </header>
          <div class="written-columns">
            <section class="written-drawing" aria-labelledby="drawing-title">
              <h3 id="drawing-title">Чертёж</h3>
              <div id="written-drawing"></div>
              ${demos?.markup(key, 'Как построить чертёж', panel('draw-demo')) ?? ''}
              ${demos ? `<details class="written-details" ${panel('tool-demos')}>
                <summary>Как пользоваться инструментами</summary>
                <div class="tool-demo-list">
                  ${toolDemoIds.map(id => demos.markup(id, toolDemos[id], panel(id))).join('')}
                </div>
              </details>` : ''}
              <details class="written-details" ${panel('scheme')}>
                <summary>Посмотреть схему</summary>
                <figure class="figure">${renderDiagram(task.diagram)}</figure>
              </details>
            </section>
            <section class="written-notes" aria-labelledby="notes-title">
              <h3 id="notes-title">Оформление</h3>
              <div class="written-fields">
                <label for="written-given">Дано</label>
                <textarea id="written-given" data-written-field="given" rows="2" maxlength="2000" placeholder="Запиши, что известно из условия"></textarea>
                <label for="written-goal">${goalLabel}</label>
                <textarea id="written-goal" data-written-field="goal" rows="1" maxlength="2000" placeholder="${task.proof ? 'Запиши, что нужно доказать' : 'Запиши, что нужно найти'}"></textarea>
                <label for="written-solution">${solutionLabel}</label>
                <textarea id="written-solution" data-written-field="solution" rows="5" maxlength="6000" placeholder="Запиши ход мысли и обоснуй шаги"></textarea>
              </div>
              <div class="written-symbols" role="group" aria-label="Вставить математический символ">
                ${['∠', '°', '△', '⊥', '∥', '=', '−', '·'].map(symbol => `<button class="btn" type="button" data-symbol="${symbol}" aria-label="Вставить ${symbol}">${symbol}</button>`).join('')}
              </div>
              <p class="draft-status" role="status">${room ? 'Чертёж и записи общие для участников комнаты.' : 'Черновик сохраняется в этом браузере.'}</p>
              ${demos?.markup(task.proof ? 'proof-format' : 'format', 'Как оформить запись', panel('write-demo')) ?? ''}
              <details class="written-details" ${panel('hint')}>
                <summary>Подсказка к ${task.proof ? 'доказательству' : 'решению'}</summary>
                <p>${escape(task.hint)}</p>
              </details>
              <details class="written-details" ${panel('example')}>
                <summary>Сверить с образцом</summary>
                <dl class="written-example">
                  <dt>Дано</dt><dd>${escape(task.given)}</dd>
                  <dt>${goalLabel}</dt><dd>${escape(task.goal)}</dd>
                  <dt>${solutionLabel}</dt>
                  <dd><ol>${task.solution.map(step => `<li>${escape(step)}</li>`).join('')}</ol></dd>
                  ${task.answer ? `<dt>Ответ</dt><dd>${escape(task.answer)}</dd>` : ''}
                </dl>
                ${task.note ? `<p class="written-note">${escape(task.note)}</p>` : ''}
              </details>
            </section>
          </div>
          <div class="actions written-footer">
            <button class="btn" type="button" data-written-question="${question - 1}" ${question === 0 ? 'hidden' : ''}>← Предыдущая задача</button>
            <button class="btn continue" type="button" data-written-question="${question + 1}" ${question === tasks.length - 1 ? 'hidden' : ''}>Следующая задача →</button>
          </div>
        </article>`;

      const status = root.querySelector('.draft-status');
      const statusText = (ok, saved = false) => {
        status.textContent = ok
          ? saved ? 'Черновик сохранён в этом браузере.' : 'Черновик сохраняется в этом браузере.'
          : 'Черновик доступен до закрытия этой страницы.';
      };
      if (draft.persisted !== undefined) statusText(draft.persisted, true);
      function commit(patch) {
        if (room) {
          const ok = notify();
          status.textContent = ok
            ? 'Чертёж и записи общие для участников комнаты.'
            : 'В комнате заполнено место для чертежей и записей.';
          return ok;
        }
        draft.persisted = save(key, patch);
        statusText(draft.persisted, true);
        return true;
      }

      const textareas = Object.fromEntries(fields.map(field => [field, root.querySelector(`#written-${field}`)]));
      activeField = 'given';
      for (const [field, input] of Object.entries(textareas)) {
        input.value = typeof draft[field] === 'string' ? draft[field] : '';
        input.addEventListener('focus', () => { activeField = field; });
        input.addEventListener('input', () => {
          const previous = draft[field] || '';
          draft[field] = input.value;
          if (!commit({ [field]: input.value })) draft[field] = input.value = previous;
        });
      }
      root.querySelector('.written-symbols').addEventListener('click', event => {
        const button = event.target.closest('[data-symbol]');
        if (!button) return;
        const field = textareas[activeField];
        const { selectionStart, selectionEnd, maxLength } = field;
        if (field.value.length - selectionEnd + selectionStart + button.dataset.symbol.length > maxLength) return;
        field.setRangeText(button.dataset.symbol, selectionStart, selectionEnd, 'end');
        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.focus();
      });
      editor = drawing.mount(root.querySelector('#written-drawing'), draft.drawing, task.names, value => commit({ drawing: value }));
      root.querySelector('[data-written-panel="tools"]').open = draft.open.has('tools');
      for (const details of root.querySelectorAll('[data-written-panel]')) {
        const name = details.dataset.writtenPanel;
        const play = details.dataset.demo && details.querySelector('[data-demo-toggle]');
        const playing = () => demos?.setPlaying(details, draft.playing.has(name));
        playing();
        play?.addEventListener('click', () => {
          const wasPlaying = draft.playing.delete(name);
          if (!wasPlaying) draft.playing.add(name);
          if (room && !commit()) {
            if (wasPlaying) draft.playing.add(name);
            else draft.playing.delete(name);
          }
          playing();
        });
        details.addEventListener('toggle', () => {
          if (!details.isConnected || draft.open.has(name) === details.open) return;
          const beforeOpen = new Set(draft.open);
          const beforePlaying = new Set(draft.playing);
          if (details.open) draft.open.add(name);
          else {
            const closing = name === 'tool-demos' ? [name, ...toolDemoIds] : [name];
            for (const id of closing) {
              draft.open.delete(id);
              draft.playing.delete(id);
            }
          }
          if (room && !commit()) {
            draft.open = beforeOpen;
            draft.playing = beforePlaying;
            details.open = beforeOpen.has(name);
          } else if (name === 'tool-demos' && !details.open) {
            for (const child of details.querySelectorAll('[data-demo]')) {
              child.open = false;
              demos.setPlaying(child, false);
            }
          }
          playing();
        });
      }
    }

    root.addEventListener('click', event => {
      const button = event.target.closest('[data-written-variant], [data-written-question]');
      if (!button) return;
      const nextVariant = Number(button.dataset.writtenVariant ?? variant);
      const nextQuestion = Number(button.dataset.writtenQuestion ?? questions[nextVariant]);
      if (nextVariant === variant && nextQuestion === questions[variant]) return;
      variant = nextVariant;
      questions[variant] = nextQuestion;
      if (room) notify();
      else save('navigation', { variant, questions });
      render();
      const title = root.querySelector('#written-title');
      title.focus({ preventScroll: true });
      const top = title.getBoundingClientRect().top;
      if (top < 0 || top > innerHeight - 70) title.scrollIntoView({ block: 'start' });
    });

    return { show() { if (!editor) render(); }, getRoomState, applyRoomState };
  }

  window.GeometryControlWork = { mount };
})();

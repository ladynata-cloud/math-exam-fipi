(function (root) {
  'use strict';

  // These models use the ordinary practice step history. A reveal threshold is
  // authored for a mathematical step; it is never inferred from equal numbers.
  const defaultColumns = {
    loan: [
      ['before', 'Долг до процентов'], ['interest', 'Проценты'],
      ['principal', 'Возвращённая часть долга'], ['payment', 'Платёж'],
      ['after', 'Остаток после платежа']
    ],
    deposit: [
      ['before', 'Сумма в начале'], ['operation', 'Пополнение или снятие'],
      ['interest', 'Проценты'], ['after', 'Сумма в конце']
    ]
  };
  const tasks = (root.ProfileLessons || []).flatMap(lesson => lesson.tasks || [])
    .filter(task => task.finance && task.finance.schema === 1);
  const ids = tasks.map(task => task.id);
  const integer = (value, fallback = 0) => Number.isInteger(value) && value >= 0 ? value : fallback;
  const text = value => value === undefined || value === null ? '' : String(value);
  const permitted = (threshold, completed) => Number.isInteger(threshold) && threshold >= 0 && threshold <= completed;
  const answerText = value => Number.isFinite(Number(value)) ?
    Number(value).toLocaleString('ru-RU', { maximumFractionDigits: 10 }) : text(value);
  const shortUnit = value => text(value).replace(/тыс\. рублей/g, 'тыс. руб.').replace(/млн рублей/g, 'млн руб.').replace(/^рублей$/, 'рубли');
  const cardLabels = {
    loan: { before: 'Долг до процентов', interest: 'Проценты', withInterest: 'Долг с процентами',
      principal: 'Возврат долга', payment: 'Платёж', after: 'Остаток' },
    deposit: { before: 'До операции', operation: 'Пополнение / снятие', start: 'Для процентов',
      interest: 'Проценты', after: 'В конце периода' }
  };

  function acceptedSteps(task, context, help) {
    const total = (task.steps || []).length;
    if (context.mode === 'independent') {
      if (context.solved) return total;
      return help ? Math.min(total, integer(context.completed)) : 0;
    }
    // The current prompt index does not prove that any answer was accepted.
    // Only the existing history count can unlock a calculated cell.
    return Math.min(total, integer(context.completed));
  }

  function sceneFor(task, context = {}, options = {}) {
    const finance = task.finance || {};
    const independent = context.mode === 'independent';
    const help = !!options.help;
    const completed = acceptedSteps(task, context, help);
    const totalSteps = (task.steps || []).length;
    const complete = independent ? !!context.solved : totalSteps > 0 && completed >= totalSteps;
    const scheduleAfter = finance.revealScheduleAfter === undefined ? 0 : finance.revealScheduleAfter;
    const scheduleLocked = !permitted(scheduleAfter, completed);
    // Do not use even the length of the real schedule until its term is earned.
    // Changing hidden rows must not change the observable preview scene.
    const sourceRows = scheduleLocked ? (finance.previewRows || [
      { id: 'first', label: 'Первый период', cells: {} },
      { id: 'next', label: 'Следующий период', cells: {} },
      { id: 'last', label: 'Последний период', cells: {} }
    ]) : (finance.rows || []);
    const columns = (finance.columns || (finance.kind === 'loan' ? defaultColumns.loan : defaultColumns.deposit)
      .map(([key, label]) => ({ key, label }))).map(column => ({ key: text(column.key), label: text(column.label) }));
    const stepIndex = Math.min(integer(context.step), Math.max(0, totalSteps - 1));
    const currentAllowed = !complete && (!independent || help);
    const authoredStep = currentAllowed ? (finance.steps || [])[stepIndex] : null;
    const requestedFocus = authoredStep && authoredStep.focus || {};
    const availableRows = sourceRows.filter(row =>
      (row.revealAfter === undefined || permitted(row.revealAfter, completed)) &&
      (row.hideAfter === undefined || !permitted(row.hideAfter, completed)));
    const focus = currentAllowed ? {
      row: availableRows.some(row => text(row.id) === text(requestedFocus.row)) ? text(requestedFocus.row) : null,
      column: columns.some(column => column.key === requestedFocus.column) ? requestedFocus.column : null
    } : { row: null, column: null };
    const totalRows = scheduleLocked ? null : availableRows.length;
    const windowSize = Math.min(8, Math.max(1, integer(options.windowSize,
      integer(finance.window && finance.window.size, 4))));
    const focusIndex = focus.row === null ? -1 : availableRows.findIndex(row => text(row.id) === focus.row);
    const initialStart = focusIndex >= 0 ? Math.floor(focusIndex / windowSize) * windowSize :
      integer(finance.window && finance.window.initialStart);
    const windowStart = scheduleLocked ? 0 : Math.min(Math.max(0, availableRows.length - windowSize),
      integer(options.windowStart, initialStart));
    const visibleRows = scheduleLocked ? availableRows : availableRows.slice(windowStart, windowStart + windowSize);
    const rows = visibleRows.map(row => {
      const rowId = text(row.id);
      const stage = (finance.stages || []).find(item => text(item.id) === text(row.stage));
      const cells = {};
      for (const column of columns) {
        const source = row.cells && row.cells[column.key] || {};
        const given = source.given === true && source.revealAfter === 0;
        const earned = !given && Number.isInteger(source.revealAfter) && source.revealAfter > 0 &&
          source.revealAfter <= completed;
        const visible = given || earned;
        // Never copy a source cell or its exact value into a hidden scene cell.
        cells[column.key] = {
          display: visible ? text(source.display) : '…', visible, given, earned, locked: !visible,
          current: !!focus.column && focus.column === column.key && (!focus.row || focus.row === rowId)
        };
      }
      return {
        id: rowId, label: text(row.label),
        stage: stage ? text(stage.label) : text(row.stage), inWindow: row.inWindow === true,
        current: !!focus.row && focus.row === rowId, cells
      };
    });
    const question = currentAllowed ? (task.steps || [])[stepIndex] : null;
    const current = currentAllowed ? {
      index: stepIndex, accepted: !!context.solved && !independent,
      message: text(authoredStep && authoredStep.message || question && (question.question || question.prompt)), focus
    } : null;
    const kind = finance.kind || 'loan';
    const operationTiming = ['before_interest', 'after_interest'].includes(finance.operationTiming) ?
      finance.operationTiming : null;
    return {
      kind, unit: text(finance.unit), completed, complete, help, scheduleLocked,
      title: kind === 'loan' ? 'Таблица кредита' : kind === 'comparison' ? 'Сравнение вкладов' : 'Движение вклада',
      periodLabel: text(finance.period && finance.period.label) || 'Период',
      operationTiming, columns, rows, totalRows, current,
      window: {
        start: scheduleLocked ? 0 : windowStart,
        end: scheduleLocked ? 0 : windowStart + rows.length,
        total: totalRows, canPrevious: !scheduleLocked && windowStart > 0,
        canNext: !scheduleLocked && windowStart + rows.length < availableRows.length
      },
      target: {
        label: text(finance.target && finance.target.label || task.question || 'Искомая величина'),
        unit: text(finance.target && finance.target.unit || task.unit),
        display: complete ? answerText(task.answer) : '…', visible: complete
      }
    };
  }

  function render(container, task, context = {}) {
    const doc = container.ownerDocument;
    const view = doc.defaultView;
    let disposed = false;
    const options = { help: false, windowStart: undefined, windowSize: 1 };
    const element = (tag, content, className) => {
      const node = doc.createElement(tag);
      if (content !== undefined) node.textContent = content;
      if (className) node.className = className;
      return node;
    };
    const wrapper = element('section', undefined, 'finance-model');
    wrapper.dataset.financeModel = task.id;
    wrapper.setAttribute('aria-label', 'Учебная таблица финансовой задачи');
    const heading = element('div', undefined, 'finance-model-heading');
    const title = element('h3');
    const unit = element('p', undefined, 'finance-model-unit');
    heading.append(title, unit);
    const current = element('div', undefined, 'finance-current');
    const currentLabel = element('p', undefined, 'finance-current-label');
    const currentMessage = element('p', undefined, 'finance-current-message');
    current.append(currentLabel, currentMessage);
    const legend = element('p', undefined, 'finance-legend');
    const scheduleNote = element('p', undefined, 'finance-schedule-note');
    const table = element('table', undefined, 'finance-ledger');
    table.setAttribute('aria-label', 'Движение денег по периодам');
    const thead = element('thead'), tbody = element('tbody');
    table.append(thead, tbody);
    const pager = element('div', undefined, 'finance-pager');
    const previous = element('button', '←', 'finance-button');
    const range = element('span', '', 'finance-range');
    const next = element('button', '→', 'finance-button');
    for (const button of [previous, next]) button.type = 'button';
    previous.setAttribute('aria-label', 'Предыдущий период'); next.setAttribute('aria-label', 'Следующий период');
    previous.dataset.modelAction = 'previous-period'; next.dataset.modelAction = 'next-period';
    range.setAttribute('aria-live', 'polite');
    pager.append(previous, range, next);
    const helpButton = element('button', 'Как читать таблицу', 'finance-button finance-help-button');
    helpButton.type = 'button'; helpButton.dataset.modelAction = 'finance-help';
    helpButton.setAttribute('aria-expanded', 'false');
    const explanation = element('div', undefined, 'finance-explanation');
    explanation.hidden = true;
    const target = element('p', undefined, 'finance-model-result');
    target.hidden = true;
    wrapper.append(heading, current, legend, scheduleNote, table, pager, helpButton, explanation, target);
    container.replaceChildren(wrapper);

    function isCurrent() {
      if (disposed || wrapper.isConnected === false) return false;
      return typeof context.isCurrent !== 'function' || context.isCurrent() !== false;
    }

    function renderRow(scene, row) {
      const tr = element('tr', undefined, 'finance-ledger-row');
      tr.dataset.row = row.id;
      if (row.current) tr.classList.add('is-current-row');
      if (row.inWindow) { tr.classList.add('in-payment-window'); tr.dataset.paymentWindow = 'true'; }
      const name = element('th', undefined, 'finance-row-heading');
      name.scope = 'row';
      name.append(element('strong', row.label));
      if (row.stage) name.append(element('span', row.stage, 'finance-stage'));
      if (row.inWindow) name.append(element('span', 'В выбранном промежутке', 'finance-window-badge'));
      tr.append(name);
      for (const column of scene.columns) {
        const cell = row.cells[column.key];
        const td = element('td', undefined, 'finance-cell');
        td.dataset.row = row.id; td.dataset.column = column.key;
        td.dataset.state = cell.given ? 'given' : cell.earned ? 'earned' : 'locked';
        if (cell.current) { td.classList.add('is-current-cell'); td.setAttribute('aria-current', 'step'); }
        const labels = scene.kind === 'loan' ? cardLabels.loan : cardLabels.deposit;
        const label = element('span', labels[column.key] || column.label, 'finance-cell-label');
        label.setAttribute('aria-hidden', 'true');
        const value = element('span', cell.display, 'finance-cell-value');
        if (cell.locked) value.setAttribute('aria-label', 'Пока не найдено');
        else if (cell.earned) value.setAttribute('aria-label', cell.display + ', уже найдено');
        td.setAttribute('aria-label', column.label + ': ' + (cell.locked ? 'пока не найдено' : cell.display));
        // A symbolic preview has no known term yet. Keep its given and earned
        // entries, plus the current quantity, without six empty lines per card.
        const hasVisibleCell = scene.columns.some(item => row.cells[item.key].visible || row.cells[item.key].current);
        if (scene.scheduleLocked && cell.locked && !cell.current && (hasVisibleCell || column.key !== 'before'))
          td.classList.add('finance-preview-empty');
        td.append(label, value); tr.append(td);
      }
      return tr;
    }

    function paint() {
      if (disposed) return;
      const scene = sceneFor(task, context, options);
      wrapper.dataset.schedule = scene.scheduleLocked ? 'symbolic' : 'known';
      title.textContent = scene.title;
      unit.textContent = scene.unit ? 'Единицы: ' + shortUnit(scene.unit) + '.' : '';
      unit.hidden = !scene.unit;
      current.hidden = !scene.current;
      if (scene.current) {
        currentLabel.textContent = scene.current.accepted ? 'Шаг выполнен' : 'Сейчас разбираем';
        const focusedColumn = scene.columns.find(column => column.key === scene.current.focus.column);
        currentMessage.textContent = focusedColumn ? focusedColumn.label : scene.current.message;
      }
      legend.textContent = scene.completed ? 'Зелёное — уже найдено' : '… — предстоит найти';
      scheduleNote.textContent = scene.scheduleLocked ?
        'Срок пока неизвестен. Номера периодов появятся после его нахождения.' : '';
      scheduleNote.hidden = !scene.scheduleLocked;
      const header = element('tr');
      const periodHead = element('th', scene.periodLabel); periodHead.scope = 'col'; header.append(periodHead);
      for (const column of scene.columns) {
        const th = element('th', column.label); th.scope = 'col'; header.append(th);
      }
      thead.replaceChildren(header);
      tbody.replaceChildren(...scene.rows.map(row => renderRow(scene, row)));
      table.style.setProperty('--finance-columns', String(scene.columns.length + 1));
      pager.hidden = scene.scheduleLocked || !scene.totalRows || scene.totalRows <= scene.rows.length;
      previous.disabled = !scene.window.canPrevious; next.disabled = !scene.window.canNext;
      const visibleRange = scene.window.start + 1 === scene.window.end ? String(scene.window.end) :
        (scene.window.start + 1) + '–' + scene.window.end;
      range.textContent = scene.scheduleLocked ? '' : visibleRange + ' из ' + scene.totalRows;
      helpButton.setAttribute('aria-expanded', String(options.help));
      helpButton.textContent = options.help ? 'Скрыть объяснение' : 'Как читать таблицу';
      explanation.hidden = !options.help;
      explanation.replaceChildren();
      if (options.help) {
        const lines = scene.kind === 'loan' ? [
          'Сначала берём долг, который остался после предыдущего платежа. Проценты начисляют на этот остаток.',
          'Платёж состоит из начисленных процентов и возвращённой части основного долга. Остаток равен долгу с процентами минус платёж.',
          'Одинаковая возвращённая часть долга и одинаковый полный платёж — разные условия. Если в задаче два участка, правило проверяем для каждого участка отдельно.'
        ] : [
          scene.operationTiming === 'after_interest' ?
            'Сначала начисляем проценты, затем учитываем пополнение или снятие по условию задачи.' :
            'Если деньги добавляют или снимают до начисления, сначала учитываем эту операцию. Проценты считаем уже от изменившейся суммы.',
          'Сумма в конце одного периода становится начальной суммой следующего. При сравнении вкладов каждый договор считаем отдельно.'
        ];
        for (const line of lines) explanation.append(element('p', line));
        explanation.append(element('p', 'Новые числа появляются в таблице после верных шагов. Пока ячейка пуста, это значение ещё предстоит найти.', 'finance-earned-note'));
      }
      target.hidden = !scene.target.visible;
      target.textContent = scene.target.visible ?
        scene.target.label + ': ' + scene.target.display + (scene.target.unit ? ' ' + scene.target.unit : '') : '';
    }

    previous.onclick = () => {
      if (!isCurrent()) return;
      const scene = sceneFor(task, context, options);
      if (!scene.window.canPrevious) return;
      options.windowStart = Math.max(0, scene.window.start - options.windowSize); paint();
    };
    next.onclick = () => {
      if (!isCurrent()) return;
      const scene = sceneFor(task, context, options);
      if (!scene.window.canNext) return;
      options.windowStart = scene.window.start + options.windowSize; paint();
    };
    helpButton.onclick = () => {
      if (!isCurrent()) return;
      const opening = !options.help;
      if (opening && !sceneFor(task, context, options).complete &&
          typeof context.onHelp === 'function' && context.onHelp() === false) return;
      if (!isCurrent()) return;
      options.help = opening; paint();
    };
    function resize() {
      if (disposed) return;
      const width = wrapper.getBoundingClientRect().width;
      const nextSize = width >= 840 ? Math.min(8, Math.max(1, integer(task.finance.window && task.finance.window.size, 4))) : 1;
      if (options.windowSize !== nextSize) { options.windowSize = nextSize; options.windowStart = undefined; paint(); }
    }
    paint(); resize();
    const observer = view && typeof view.ResizeObserver === 'function' ? new view.ResizeObserver(resize) : null;
    if (observer) observer.observe(wrapper);
    return () => {
      disposed = true;
      previous.onclick = null; next.onclick = null; helpButton.onclick = null;
      if (observer) observer.disconnect();
    };
  }

  const models = root.ProfileTaskModels = root.ProfileTaskModels || {};
  for (const id of ids) models[id] = render;
  root.ProfileFinanceModels = { ids, sceneFor, render };
  if (typeof module !== 'undefined' && module.exports) module.exports = { ids, sceneFor, render };
})(globalThis);

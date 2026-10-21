/* Exam-like variants for apartments and plots. Native engines own grading and credit. */
(function (global) {
  'use strict';
  const doc = global.document;
  const api = global.PracticalVariant;
  if (!api) return;
  const NS = 'http://www.w3.org/2000/svg';
  const query = (selector, root = doc) => root.querySelector(selector);
  const list = (selector, root = doc) => Array.from(root.querySelectorAll(selector));
  const make = (tag, text, className) => {
    const node = doc.createElement(tag);
    if (text != null) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  const fromHTML = markup => { const node = make('div'); node.innerHTML = markup; return node; };
  const svgElement = (tag, attributes, text) => {
    const node = doc.createElementNS(NS, tag);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
    if (text != null) node.textContent = text;
    return node;
  };
  function cleanClone(node) {
    const copy = node.cloneNode(true);
    [copy, ...list('[id]', copy)].forEach(element => element.removeAttribute('id'));
    return copy;
  }
  function figure(svg, caption, minWidth) {
    const box = make('figure', null, 'pv-building-figure');
    const scroll = make('div', null, 'pv-figure-scroll');
    scroll.tabIndex = 0;
    scroll.setAttribute('role', 'region');
    scroll.setAttribute('aria-label', 'План с горизонтальной прокруткой');
    scroll.style.overflowX = 'auto';
    svg.style.minWidth = minWidth + 'px';
    svg.style.width = '100%';
    svg.style.height = 'auto';
    scroll.append(svg);
    box.append(scroll, make('figcaption', caption));
    box.append(make('p', 'Если рисунок не помещается, прокрути его в сторону.', 'pv-scroll-note'));
    return box;
  }
  function appendSolution(help, solution) {
    const node = fromHTML(help);
    const details = make('details', null, 'pv-details');
    details.append(make('summary', 'Показать полный разбор'), fromHTML(solution));
    node.append(details);
    // Native explanations use slash notation. Present numerical fractions with
    // a fraction bar without changing the calculation or the native checker.
    const walker = doc.createTreeWalker(node, global.NodeFilter.SHOW_TEXT);
    const texts = []; while (walker.nextNode()) texts.push(walker.currentNode);
    texts.forEach(text => {
      const pattern = /(\([^()]*\)|\d+(?:[,.]\d+)?)\s*\/\s*(\d+(?:[,.]\d+)?)/g;
      const parts = [...text.textContent.matchAll(pattern)];
      if (!parts.length) return;
      const fragment = doc.createDocumentFragment(); let offset = 0;
      parts.forEach(match => {
        fragment.append(doc.createTextNode(text.textContent.slice(offset, match.index)));
        const fraction = make('span', null, 'pm-fraction');
        fraction.append(make('span', match[1]), make('span', match[2]));
        fragment.append(fraction); offset = match.index + match[0].length;
      });
      fragment.append(doc.createTextNode(text.textContent.slice(offset))); text.replaceWith(fragment);
    });
    return node;
  }
  function picker(label, choices, value, onChange) {
    const wrap = make('label', label, 'pv-subtype-label');
    const select = make('select');
    select.setAttribute('aria-label', label);
    choices.forEach(choice => {
      const option = make('option', choice.label);
      option.value = choice.value;
      select.append(option);
    });
    select.value = String(value);
    select.addEventListener('change', () => onChange(select.value));
    wrap.append(select);
    return wrap;
  }

  api.register('apartments', function apartmentsVariant() {
    const nativeRoot = query('body > .wrap');
    const drafts = new Map();
    const selected = { 1: '1', 2: '2.1', 3: '3.1', 4: '4.1', 5: '5.1' };
    const cards = new Map();
    const snapshots = new Map();
    let planIndex = state.planIdx;
    const capture = () => ({ plan: planIndex, objects: t1objs.slice(), room: state.t3room, A: state.t4A, B: state.t4B });
    const restore = (key, snapshot) => {
      if (state.planIdx !== snapshot.plan) { state.planIdx = snapshot.plan; setPlan(snapshot.plan); }
      t1objs = snapshot.objects.slice();
      state.t3room = snapshot.room;
      state.t4A = snapshot.A;
      state.t4B = snapshot.B;
      state.group = VIEWS[key].g;
      state.viewKey = key;
      state.mode = 'practice';
      renderView();
    };
    function apartmentCondition() {
      const mirrored = planIndex === 2;
      const side = mirrored ? ['справа', 'слева'] : ['слева', 'справа'];
      const description = planIndex === 1
        ? 'Вход ведёт в длинный коридор внизу плана. Над его левым концом находится санузел, у правого конца — кладовая. Самое большое помещение — гостиная. Над левой частью гостиной расположена кухня, справа от кухни — спальня. Лоджия кухни находится слева от неё, лоджия спальни — справа от спальни.'
        : 'Вход ведёт в коридор в нижней части плана. Санузел находится ' + side[0] + ' от входа, кладовая — у противоположного конца коридора. Самое большое помещение — гостиная. Кухня расположена ' + side[0] + ' от гостиной, спальня — ' + side[1] + '. Из кухни и спальни можно выйти на свои лоджии в верхней части плана.';
      const node = make('div');
      node.append(make('p', 'На плане изображена двухкомнатная квартира. Сторона каждой клетки равна 0,4 м. Помещения пронумерованы. Используй этот план для заданий 1–5.'), make('p', description));
      return node;
    }
    function apartmentFigure() {
      drawPlan({ rooms: [], dims: [] });
      const svg = cleanClone(query('#plan'));
      svg.dataset.pvApartmentPlan = String(planIndex);
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', 'План квартиры: сетка, стены, окна, двери и номера помещений');
      const names = new Set(Object.values(PL.rooms).map(room => room.name));
      list('text', svg).forEach(text => {
        if (names.has(text.textContent) || text.textContent === '0,4 м') text.remove();
        else if (/^[1-8]$/.test(text.textContent)) {
          text.setAttribute('font-size', '32');
          text.setAttribute('font-weight', '700');
          text.setAttribute('fill', '#172b22');
        } else if (text.textContent === 'вход') text.setAttribute('font-size', '30');
      });
      list('circle', svg).forEach(circle => circle.setAttribute('r', '23'));
      list('g', svg).forEach(group => { if (!group.textContent.trim()) group.remove(); });
      const vb = svg.getAttribute('viewBox').split(/\s+/).map(Number);
      vb[3] += 28;
      svg.setAttribute('viewBox', vb.join(' '));
      return figure(svg, 'Сторона клетки — 0,4 м. Толстая линия — наружная стена, дуга — дверь, двойная линия — окно. Ищи номера по описанию.', 560);
    }
    function card(group) {
      const key = selected[group];
      const snapshot = snapshots.get(group) || capture();
      snapshots.set(group, snapshot);
      const identity = JSON.stringify([snapshot.plan, key, key === '1' ? snapshot.objects : key === '3.x' ? snapshot.room : key === '4.x' ? [snapshot.A, snapshot.B] : null]);
      const cache = drafts.get(identity) || { value: '', status: null };
      drafts.set(identity, cache);
      restore(key, snapshot);
      const raw = fromHTML(VIEWS[key].build());
      const answerInput = query('input.ans', raw);
      const answerId = answerInput.id;
      const condition = make('div');
      list(':scope > .q, :scope > .mtab, :scope > .dtab-scroll, :scope > .note.warn', raw).forEach(node => condition.append(node));
      list('select', condition).forEach(select => select.replaceWith(make('span', '…')));
      list('[id]', condition).forEach(node => node.removeAttribute('id'));
      let help = key === '1'
        ? 'Начни со входа: он ведёт в коридор. Сравни расположение остальных помещений с описанием над планом. Записывай цифры в порядке строк таблицы.'
        : VIEWS[key].hint();
      // Two native appliance hints schedule table highlighting. It applies only
      // to the hidden native surface; the persistent exam table remains neutral.
      const solution = VIEWS[key].solve();
      const units = { 1: 'Запиши четыре цифры подряд в порядке строк таблицы.', 2: 'Сколько целых упаковок нужно купить?', 3: 'Запиши площадь в квадратных метрах.', 4: 'Запиши, на сколько процентов больше площадь.', 5: 'Запиши наименьшую полную стоимость в рублях.' };
      const node = api.question({
        id: 'apartment-' + group,
        number: group,
        condition,
        fields: [{ key: 'answer', label: units[group], value: cache.value, type: 'text', inputMode: group < 3 ? 'numeric' : 'decimal' }],
        page: 'apartments', helpType: VIEWS[key].code,
        helpNative: () => appendSolution(help, solution),
        status: cache.status,
        onDraft: values => { cache.value = values.answer; },
        check: async values => {
          cache.value = values.answer;
          if (!String(values.answer || '').trim()) return { ok: false, message: 'Сначала запиши ответ в поле.' };
          restore(key, snapshot);
          query('#' + answerId).value = values.answer;
          onCheck();
          const feedback = query('#fb');
          const message = key === '1' && !feedback.classList.contains('ok')
            ? 'Пока не совпало. Проверь описание помещений и порядок строк таблицы. Нужны четыре цифры подряд.'
            : feedback.textContent;
          cache.status = { ok: feedback.classList.contains('ok'), message };
          return cache.status;
        }
      });
      node.dataset.pvBuildingType = key;
      const controls = make('div', null, 'pv-subtype-controls');
      if (group !== 1) {
        const choices = GROUP_VIEWS[group].map(value => ({ value, label: VIEWS[value].name }));
        if (key.endsWith('.x')) choices.push({ value: key, label: VIEWS[key].name });
        controls.append(picker('Вариант задания ' + group, choices, key, value => {
          selected[group] = value;
          replace(group);
        }));
      }
      if ([1, 3, 4].includes(group)) {
        const button = make('button', group === 1 ? 'Другие помещения в таблице' : group === 3 ? 'Другое помещение' : 'Другая пара помещений');
        button.type = 'button';
        button.addEventListener('click', () => {
          restore(key, snapshot);
          doRoll(group);
          selected[group] = state.viewKey;
          snapshots.set(group, capture());
          replace(group);
        });
        controls.append(button);
      }
      if (controls.children.length) node.append(controls);
      cards.set(group, node);
      return node;
    }
    function replace(group) {
      const old = cards.get(group);
      const replacement = card(group);
      old.replaceWith(replacement);
    }
    function mountApartment() {
      const controls = make('div', null, 'pv-variant-controls');
      controls.append(picker('План квартиры', PLANS.map((plan, i) => ({ value: String(i), label: 'План ' + (i + 1) })), planIndex, value => {
        planIndex = Number(value);
        switchPlan(planIndex);
        snapshots.clear();
        [3, 4].forEach(group => { if (selected[group].endsWith('.x')) selected[group] = GROUP_VIEWS[group][0]; });
        mountApartment();
      }));
      const questions = [1, 2, 3, 4, 5].map(card);
      api.mount({ title: 'Квартира · задания 1–5', condition: apartmentCondition(), visual: apartmentFigure(), controls, questions, nativeRoots: [nativeRoot] });
    }
    mountApartment();
  });

  api.register('land-plots', function plotVariant() {
    const nativeRoot = query('body > .wrap');
    const types = ['match', 'geom', 'tiles', 'percent', 'econ'];
    let records = [];
    const activate = index => query('#task-tabs button:nth-child(' + (index + 1) + ')').click();
    function condition() {
      const node = make('div');
      node.append(make('p', 'На плане изображён дачный участок. Сторона клетки — 2 м. Используй один и тот же план для заданий 1–5.'));
      const description = make('p', 'Жилой дом — Г-образное здание. Огород находится в левом верхнем углу, внутри него расположена узкая теплица. Баня — квадратное здание слева внизу. Яблони растут между баней и гаражом. Гараж — вытянутое здание справа внизу. Сарай находится в правом верхнем углу.');
      description.className = 'pv-land-description';
      node.append(description);
      return node;
    }
    function plotFigure() {
      const svg = cleanClone(query('#plan'));
      svg.dataset.pvPlotPlan = '1';
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', 'План дачного участка: сетка 15 на 10 клеток и семь пронумерованных объектов');
      // The old decorative paving encoded neither the stated 27 tiles nor
      // the separately specified 2×5 platform. Do not present it as measured data.
      list('rect', svg).filter(rect => rect.getAttribute('fill') === '#dbe2ea').forEach(rect => rect.remove());
      list('text', svg).forEach(text => {
        text.setAttribute('font-size', /^[1-7]$/.test(text.textContent) ? '22' : '18');
        text.setAttribute('font-weight', '700');
      });
      list('circle', svg).filter(circle => circle.getAttribute('r') === '11').forEach(circle => circle.setAttribute('r', '14'));
      return figure(svg, 'Сторона клетки — 2 м. Площадка и дорожки рассчитываются по отдельным данным в задании 3; их размеры не нужно считывать с этого плана.', 452);
    }
    function platformInset() {
      const svg = svgElement('svg', { viewBox: '0 0 220 270', role: 'img', 'aria-label': 'Отдельная схема площадки: две клетки в ширину и пять в длину' });
      svg.style.maxWidth = '260px';
      svg.style.minWidth = '220px';
      svg.style.width = '100%';
      for (let y = 0; y < 5; y++) for (let x = 0; x < 2; x++) svg.append(svgElement('rect', { x: 55 + x * 38, y: 35 + y * 38, width: 38, height: 38, fill: '#e3ece5', stroke: '#617768', 'stroke-width': '1.5' }));
      svg.append(svgElement('text', { x: 93, y: 24, 'text-anchor': 'middle', 'font-size': 21, fill: '#213c2d' }, '2 клетки'));
      svg.append(svgElement('text', { x: 145, y: 135, 'font-size': 21, fill: '#213c2d' }, '5 клеток'));
      svg.append(svgElement('text', { x: 110, y: 256, 'text-anchor': 'middle', 'font-size': 19, fill: '#213c2d' }, 'Клетка: 2 м × 2 м'));
      const node = make('figure', null, 'pv-platform-inset');
      node.append(make('figcaption', 'Размеры площадки по условию — отдельная схема.'), svg);
      return node;
    }
    function snapshotTasks() {
      records = types.map((type, index) => {
        activate(index);
        const question = query('#task-q').cloneNode(true);
        list('.pd-land-description,.pm-context-hint', question).forEach(node => node.remove());
        const input = query('#in');
        return { type, index, questionHTML: question.innerHTML, draft: input.value || '', unit: query('#answer-area .unit')?.textContent || '', closed: input.disabled, status: null };
      });
      activate(0);
    }
    function card(record) {
      const conditionNode = fromHTML(record.questionHTML);
      if (record.type === 'tiles' && /площадка/.test(conditionNode.textContent)) conditionNode.append(platformInset());
      const labels = { match: 'Запиши четыре цифры подряд в порядке столбцов таблицы.', geom: 'Запиши найденную величину', tiles: 'Сколько целых упаковок понадобилось?', percent: 'Запиши ответ в процентах.', econ: /часов/.test(conditionNode.textContent) ? 'Через сколько часов окупится разница расходов?' : 'Запиши наименьшую стоимость покупки с доставкой в рублях.' };
      const label = record.type === 'geom' ? labels.geom + ' (' + record.unit.replace('кв.м', 'м²') + ').' : labels[record.type];
      const node = api.question({
        id: 'plot-' + (record.index + 1), number: record.index + 1,
        condition: conditionNode,
        fields: [{ key: 'answer', label, value: record.draft, type: 'text', inputMode: record.type === 'match' ? 'numeric' : 'decimal' }],
        page: 'land', helpType: record.type,
        helpNative: record.type === 'match' ? () => {
          const box = make('div');
          box.append(make('p', 'Сначала сопоставь форму и положение с описанием. Если уже проверяешь свою работу, открой названия.'));
          const details = make('details'), table = make('table');
          table.append(make('caption', 'Названия объектов для сверки'));
          const body = make('tbody');
          list('#legend .li').forEach(item => {
            const number = query('.num', item).textContent;
            const row = make('tr');
            row.append(make('th', number), make('td', item.textContent.slice(number.length)));
            body.append(row);
          });
          table.append(body);
          details.append(make('summary', 'Сверить названия с цифрами'), table);
          box.append(details);
          return box;
        } : undefined,
        onDraft: values => { record.draft = values.answer; },
        check: async values => {
          record.draft = values.answer;
          if (!String(values.answer || '').trim()) return { ok: false, message: 'Сначала запиши ответ в поле.' };
          if (record.closed && record.status) return record.status;
          activate(record.index);
          query('#in').value = values.answer;
          query('#check-btn').click();
          const feedback = query('#fb');
          record.closed = query('#in').disabled;
          record.status = { ok: feedback.classList.contains('good'), message: feedback.textContent, locked: record.closed };
          return record.status;
        }
      });
      node.dataset.pvBuildingType = record.type;
      return node;
    }
    function mountPlot() {
      snapshotTasks();
      const controls = make('div', null, 'pv-variant-controls');
      controls.append(make('span', query('#vnum')?.textContent || 'Вариант'));
      const next = make('button', 'Новый вариант');
      next.type = 'button';
      next.addEventListener('click', () => { query('#newvar-btn').click(); mountPlot(); });
      controls.append(next);
      api.mount({ title: 'Дачный участок · задания 1–5', condition: condition(), visual: plotFigure(), controls, questions: records.map(card), nativeRoots: [nativeRoot] });
    }
    mountPlot();
  });
})(window);

/* Attach the optional model to the triangle the student is working on. */
(function () {
  'use strict';
  const bank = window.__oge15;
  const investigation = document.getElementById('oge-video-models');
  const main = document.getElementById('main');
  // The shared investigations already exclude boards, exams and embedded pages.
  if (!bank || !investigation || !main) return;

  const sideRole = {
    AB: 'AB — гипотенуза. Она лежит напротив прямого угла C.',
    BC: 'BC — катет напротив угла A.',
    AC: 'AC — катет, прилежащий к углу A.'
  };
  const ratios = {
    sin: { top: 'BC', bottom: 'AB' },
    cos: { top: 'AC', bottom: 'AB' },
    tg: { top: 'BC', bottom: 'AC' }
  };
  const medianTopics = new Set(['areaBH', 'medianRt', 'regH']);
  investigation.querySelector('summary').textContent = 'Исследовать медиану и высоту на другом треугольнике';
  const element = (tag, text) => {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    return node;
  };
  function button(label, action) {
    const node = element('button', label);
    node.type = 'button';
    node.className = 'soft';
    node.addEventListener('click', action);
    return node;
  }
  function highlight(diagram, side) {
    const svg = diagram.querySelector('svg');
    svg.querySelector('[data-model-side]')?.remove();
    const a = svg.querySelector('[data-v="' + side[0] + '"]');
    const b = svg.querySelector('[data-v="' + side[1] + '"]');
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.dataset.modelSide = side;
    for (const [point, idx] of [[a, 1], [b, 2]]) {
      line.setAttribute('x' + idx, point.getAttribute('cx'));
      line.setAttribute('y' + idx, point.getAttribute('cy'));
    }
    line.setAttribute('stroke', '#226ba0');
    line.setAttribute('stroke-width', '4.5');
    svg.querySelector('path').before(line);
  }
  function mountTrig(task, diagram, onHelp) {
    const p = task.p;
    const identity = task.k === 'rtTrig' && p.fn === 'id';
    const fn = identity ? 'sin' : p.fn || {rtLegSin:'sin', rtLegCos:'cos', rtLegTan:'tg'}[task.k];
    const {top, bottom} = ratios[fn];
    const panel = element('details');
    panel.className = 'pnote';
    panel.style.fontSize = '1rem';
    panel.dataset.triangleModel = '';
    panel.append(element('summary', 'Разобраться на модели'));
    const prompt = element('p', top === 'BC' ? 'Какой катет лежит напротив угла A?' : 'Какой катет прилежит к углу A?');
    const choices = element('div');
    choices.className = 'rowbtns';
    const feedback = element('p');
    feedback.setAttribute('role', 'status');
    const work = element('div');
    panel.append(prompt, choices, feedback, work);
    diagram.after(panel);
    let used = false, chosen = null, lengthFound = false;
    function draw() {
      if (identity && chosen === top && panel.open) {
        // The lengths below belong to the chosen similar triangle, not the givens.
        const labels = [['A', 'B', String(p.q)], ['B', 'C', String(p.p)], ['A', 'C', lengthFound ? String(p.r) : '?']];
        diagram.innerHTML = window.rtLegFig(p, labels).svg;
      } else diagram.innerHTML = task.fig.svg;
      if (chosen && panel.open) highlight(diagram, chosen);
    }
    panel.addEventListener('toggle', () => {
      if (panel.open && !used) { used = true; onHelp(); }
      draw();
    });
    function offerReturn() {
      const answer = main.querySelector('#lad input:not(:disabled), #ans:not(:disabled)');
      if (answer) work.append(button('Ввести ответ в задаче', () => answer.focus()));
    }
    function askLength() {
      work.append(element('p', 'Синус задаёт отношение длин. Для модели возьмём подобный треугольник с AB = ' + p.q + '. Тогда BC = ' + p.p + '.'));
      const label = element('label', 'Найди AC по теореме Пифагора: AC² = ' + p.q + '² − ' + p.p + '². Чему равен AC? ');
      const field = element('input');
      field.className = 'ans';
      field.inputMode = 'decimal';
      field.autocomplete = 'off';
      label.append(field);
      const form = element('form');
      const check = element('button', 'Проверить катет');
      check.type = 'submit';
      const result = element('p');
      result.setAttribute('role', 'status');
      form.append(label, check, result);
      form.addEventListener('submit', e => {
        e.preventDefault();
        if (lengthFound) return;
        if (!bank.eqAns(bank.parseAns(field.value), p.r)) {
          result.textContent = 'Сначала вычти квадраты известных сторон. Затем найди положительный квадратный корень.';
          return;
        }
        lengthFound = true; field.disabled = true; check.disabled = true;
        draw();
        result.textContent = 'AC = ' + p.r + '. Для ответа раздели прилежащий катет AC на гипотенузу AB. Отношение одинаково у подобных треугольников.';
        result.tabIndex = -1; result.focus(); offerReturn();
      });
      work.append(form);
    }
    for (const side of Object.keys(sideRole)) {
      choices.append(button(side, () => {
        chosen = side;
        feedback.textContent = sideRole[side];
        if (side === top) {
          choices.querySelectorAll('button').forEach(b => { b.disabled = true; });
          feedback.textContent += ' Поэтому ' + fn + ' A = ' + top + ' / ' + bottom + '.';
          if (identity) askLength();
          else if (task.k === 'rtTrig') {
            const missing = [top, bottom].find(name => !p.g.split(',').includes(name));
            work.textContent = missing ? 'Найди ' + missing + ' по теореме Пифагора. Затем подставь длины в отношение.' : 'Подставь в это отношение длины с чертежа.';
          } else work.textContent = 'Подставь известную длину и значение ' + fn + ' A из условия. Вычисли длину стороны, отмеченной вопросом.';
          if (!identity) offerReturn();
          feedback.tabIndex = -1;
          (work.querySelector('input') || feedback).focus();
        }
        draw();
      }));
    }
  }
  let previousDiagram;
  function sync() {
    const state = bank.debug();
    const diagram = main.querySelector('.diagram');
    if (diagram === previousDiagram) return;
    previousDiagram = diagram;
    let task;
    if (diagram && state.TAB === 'train') task = state.tr.t;
    if (diagram && state.TAB === 'razbor' && state.rzVariant) task = bank.buildVariant(state.rzVariant, true);
    investigation.open = false;
    investigation.hidden = !task || !medianTopics.has(task.k);
    if (task?.sub.topic === 'trig' && !diagram.parentElement.querySelector('[data-triangle-model]')) {
      mountTrig(task, diagram, () => { if (bank.debug().tr?.t === task) window.trHelp('model'); });
    }
  }
  sync();
  new MutationObserver(sync).observe(main, {childList:true});
})();

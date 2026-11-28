(function () {
  'use strict';

  const vertex = 'B';
  const sides = ['BA', 'BC'];
  const names = {A: [75, 25], B: [14, 61], C: [81, 63], D: [64, 84]};
  const cyrillic = {А: 'A', В: 'B', С: 'C', Д: 'D'};

  function markup() {
    return `<div id="angle-notation" class="angle-notation">
      <h2 tabindex="-1">Укажи вершину угла ∠ABC</h2>
      <p id="angle-instruction">Нажми точку на рисунке, где начинаются обе стороны угла.</p>
      <div class="angle-figure">
        <svg viewBox="0 0 360 224" aria-hidden="true">
          <defs><marker id="angle-notation-tip" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0 0 L8 4 L0 8 Z" fill="context-stroke"/>
          </marker></defs>
          <g fill="none" stroke="currentColor" stroke-width="3" marker-end="url(#angle-notation-tip)">
            <path data-angle-ray="BA" d="M50 137 L316 39"/>
            <path data-angle-ray="BC" d="M50 137 L336 144"/>
            <path data-angle-ray="BD" d="M50 137 L273 200"/>
          </g>
          <path d="M111 115 A65 65 0 0 1 115 139" fill="none" stroke="#9a520e" stroke-width="4"/>
        </svg>
        ${Object.entries(names).map(([point, [x, y]]) =>
          `<button type="button" data-angle-point="${point}" style="left:${x}%;top:${y}%" aria-label="Точка ${point}">${point}</button>`).join('')}
      </div>
      <div id="angle-side-choices" class="row" hidden role="group" aria-label="Выбрать стороны">
        ${['BA', 'BC', 'BD'].map(ray =>
          `<button type="button" data-angle-side="${ray}" aria-pressed="false">Луч ${ray}</button>`).join('')}
      </div>
      <p id="angle-notation-feedback" class="feedback" role="status"></p>
      <div id="angle-reverse" class="callout" hidden>
        <p><strong>∠ABC и ∠CBA — один угол.</strong> Вершина B по-прежнему посередине записи. Лучи BA и BC остались на месте.</p>
        <p>Утверждение «В записи ∠ABC вершина A» ошибочно. A лежит на стороне угла.</p>
      </div>
    </div>`;
  }

  function mount(root) {
    const diagram = root.querySelector('#angle-notation');
    if (!diagram) return;

    const feedback = diagram.querySelector('#angle-notation-feedback');
    const instruction = diagram.querySelector('#angle-instruction');
    const choices = diagram.querySelector('#angle-side-choices');
    const selected = new Set();

    for (const button of diagram.querySelectorAll('[data-angle-point]')) {
      button.onclick = () => {
        if (button.dataset.anglePoint !== vertex) {
          feedback.className = 'feedback error';
          feedback.textContent = 'Найди общее начало двух лучей у отмеченной дуги.';
          return;
        }
        diagram.querySelectorAll('[data-angle-point]').forEach(point => { point.disabled = true; });
        button.classList.add('primary');
        feedback.className = 'feedback good';
        feedback.textContent = 'Верно, вершина B.';
        instruction.textContent = 'Теперь выбери два луча, между которыми проведена дуга.';
        choices.hidden = false;
        choices.querySelector('button').focus();
      };
    }

    for (const button of choices.querySelectorAll('[data-angle-side]')) {
      button.onclick = () => {
        const ray = button.dataset.angleSide;
        if (!sides.includes(ray)) {
          feedback.className = 'feedback error';
          feedback.textContent = 'Луч BD выходит из B. Проверь, проходит ли он по краю отмеченной дуги.';
          return;
        }
        selected.add(ray);
        button.setAttribute('aria-pressed', 'true');
        button.classList.add('primary');
        diagram.querySelector(`[data-angle-ray="${ray}"]`).classList.add('angle-selected');
        feedback.className = 'feedback good';
        if (selected.size === 1) {
          feedback.textContent = 'Найди второй луч на краю отмеченной дуги.';
        } else {
          choices.querySelectorAll('button').forEach(choice => { choice.disabled = true; });
          feedback.textContent = 'Стороны угла ∠ABC — лучи BA и BC.';
          diagram.querySelector('#angle-reverse').hidden = false;
          root.querySelector('[data-action="next"]')?.focus();
        }
      };
    }
  }

  function taskFigure(left, right) {
    const polar = (radius, degrees) => {
      const radians = degrees * Math.PI / 180;
      return [180 + radius * Math.cos(radians), 173 - radius * Math.sin(radians)]
        .map(value => value.toFixed(1)).join(' ');
    };
    const first = 18;
    const middle = first + right;
    const last = middle + left;
    function label(radius, angle, value) {
      const [x, y] = polar(radius, angle).split(' ');
      return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central">${value}</text>`;
    }
    return `<figure class="angle-task-drawing"><svg viewBox="0 0 360 205" role="img" aria-label="Из вершины C выходят лучи CA, CD и CB. Луч CD проведён внутри угла между CA и CB. Угол ACD равен ${left} градусам, угол DCB — ${right}.">
      <defs><marker id="angle-task-tip" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
        <path d="M0 0 L8 4 L0 8 Z" fill="context-stroke"/>
      </marker></defs>
      <g fill="none" stroke="currentColor" stroke-width="3" marker-end="url(#angle-task-tip)">
        ${[first, middle, last].map(angle => `<path d="M180 173 L${polar(142, angle)}"/>`).join('')}
      </g>
      <path d="M${polar(42, first)} A42 42 0 0 0 ${polar(42, middle)} M${polar(42, middle)} A42 42 0 0 0 ${polar(42, last)}" fill="none" stroke="#9a520e" stroke-width="3"/>
      <g fill="currentColor">
        <circle cx="180" cy="173" r="4"/>
        ${[first, middle, last].map(angle => {
          const [x, y] = polar(119, angle).split(' ');
          return `<circle cx="${x}" cy="${y}" r="4"/>`;
        }).join('')}
      </g>
      <g fill="currentColor" font-size="21" font-weight="700">
        ${label(119, first - 8, 'B')}${label(119, middle - 8, 'D')}${label(119, last + 8, 'A')}
        <text x="173" y="196">C</text>
      </g>
      <g fill="#814811" font-size="19" font-weight="650">
        ${label(73, (first + middle) / 2, `${right}°`)}
        ${label(73, (middle + last) / 2, `${left}°`)}
      </g>
    </svg></figure>`;
  }

  const root = document.getElementById('lesson');
  const originalEqual = GeoTasks.equal;
  const originalCheck = GeoTasks.check;
  const originalTask = GeoTasks.task;

  // The shared atlas still grades attempts and saves progress for this lesson.
  function angleAnswer(value, expected) {
    if (typeof expected === 'number') return String(value).replace(/°\s*$/, '');
    if (expected !== 'ACB') return value;
    const name = String(value).toUpperCase().replace(/^\s*∠/, '').replace(/\s/g, '')
      .replace(/[АВСД]/g, letter => cyrillic[letter]);
    return name === 'BCA' ? 'ACB' : name;
  }
  GeoTasks.equal = (value, expected) => originalEqual(angleAnswer(value, expected), expected);
  // The harmonized lesson uses classified input without consuming empty or
  // malformed attempts. Keep the same reviewed angle aliases on that path.
  if (originalCheck) GeoTasks.check = (value, expected) => originalCheck(angleAnswer(value, expected), expected);

  GeoTasks.task = (kind, seed) => {
    const task = originalTask(kind, seed);
    if (kind === 'angle') {
      task.steps[0].question = 'Запиши целый угол тремя буквами.';
      task.steps[0].reason = 'Луч CD лежит между CA и CB. В имени целого угла вершина C стоит посередине.';
    }
    return task;
  };

  function helpForStep(hasAngleName) {
    return hasAngleName
      ? 'Проверь, какие два внешних луча образуют целый угол. Укажи их точки по краям записи.'
      : 'Найди две отмеченные части целого угла и проверь их сумму.';
  }

  function decorate() {
    const stage = document.querySelector('.stage-nav [aria-current="step"]')?.dataset.stage;
    const heading = root.querySelector('h2');

    if (stage === '0' && !root.querySelector('#angle-notation')) {
      const footer = root.querySelector('.stage-footer');
      const rule = document.createElement('details');
      const title = document.createElement('summary');
      const text = document.createElement('p');
      title.textContent = 'Правило записи угла';
      text.className = 'law';
      text.textContent = COURSE_CONFIG.unit.idea;
      rule.append(title, text);
      const restoreFocus = document.activeElement === heading;
      const retained = root.querySelector('.retained-work');
      root.replaceChildren(root.querySelector('.step-label'), rule, footer, ...(retained ? [retained] : []));
      rule.insertAdjacentHTML('beforebegin', markup());
      mount(root);
      if (restoreFocus) root.querySelector('h2').focus({preventScroll: true});
    }

    if (stage === '1' && heading) heading.textContent = 'Поменяй положение стороны';

    const problem = root.querySelector('.task-question');
    if ((stage === '3' || stage === '4') && problem && !root.querySelector('.angle-task-drawing')) {
      const angles = problem.textContent.match(/ACD = (\d+)° и DCB = (\d+)°/);
      if (angles) {
        const figure = taskFigure(Number(angles[1]), Number(angles[2]));
        const generic = problem.nextElementSibling;
        if (generic?.classList.contains('lesson-figure')) generic.outerHTML = figure;
        else problem.insertAdjacentHTML('afterend', figure);
      }

      const answer = root.querySelector('#answer');
      if (!answer) return;
      const label = root.querySelector('label[for="answer"]');
      const form = answer.form;
      const stepLabel = root.querySelector('.guided-step strong, .callout strong')?.textContent || '';
      const hasAngleName = stage === '3' && /^Шаг 1 из 2\.?$/.test(stepLabel);
      label.textContent = hasAngleName ? 'Название угла' : 'Градусная мера';
      answer.removeAttribute('placeholder');
      if (hasAngleName) answer.setAttribute('autocapitalize', 'characters');
      else answer.setAttribute('inputmode', 'numeric');
      if (form.nextElementSibling?.classList.contains('muted')) form.nextElementSibling.remove();
      const outcome = root.querySelector('#answer-feedback');
      const message = helpForStep(hasAngleName);
      new MutationObserver(() => {
        if (outcome.classList.contains('error') && outcome.textContent !== message) {
          outcome.textContent = message;
        }
      }).observe(outcome, {childList: true});
    }
  }

  new MutationObserver(decorate).observe(root, {childList: true});
})();

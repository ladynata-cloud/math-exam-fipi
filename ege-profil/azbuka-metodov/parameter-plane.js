(() => {
  'use strict';

  const xPixel = x => 212 + 118 * x;
  const yPixel = a => 194 - 118 * a;
  const plot = { left: xPixel(-1.5), right: xPixel(0.5), top: yPixel(1.5), bottom: yPixel(-0.5) };
  const format = value => String(value).replace('-', '−').replace('.', ',');
  const lower = x => x ** 2;
  const upper = x => 1 - (x + 1) ** 2;
  const point = (x, a) => `${xPixel(x)} ${yPixel(a)}`;

  function arc(f, from, to) {
    const mid = (from + to) / 2;
    const control = 2 * f(mid) - (f(from) + f(to)) / 2;
    return `Q${point(mid, control)} ${point(to, f(to))}`;
  }

  function sliceAt(a) {
    if (!Number.isFinite(a) || a < 0 || a > 1) return null;
    if (a === 0) return { left: 0, right: 0 };
    // Rationalize √(1 − a) − 1 to keep the right endpoint accurate near a = 0.
    return { left: -Math.sqrt(a), right: -a / (1 + Math.sqrt(1 - a)) };
  }

  function axes() {
    const { left, right, top, bottom } = plot;
    const line = (x1, y1, x2, y2, kind) =>
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${kind}"/>`;
    const vertical = [-1.5, -1, -0.5, 0, 0.5].map(x => {
      const px = xPixel(x);
      return line(px, top, px, bottom, x === 0 ? 'atlas-axis' : 'atlas-grid') +
        (x ? `<text x="${px}" y="${bottom + 16}" text-anchor="middle">${format(x)}</text>` : '');
    }).join('');
    const horizontal = [-0.5, 0, 0.5, 1, 1.5].map(a => {
      const py = yPixel(a);
      return line(left, py, right, py, a === 0 ? 'atlas-axis' : 'atlas-grid') +
        `<text x="${left - 7}" y="${py + 4}" text-anchor="end">${format(a)}</text>`;
    }).join('');
    return vertical + horizontal + `<text x="${right + 9}" y="${yPixel(0) + 4}">x</text>` +
      `<text x="${xPixel(0) + 6}" y="${top - 4}">a</text>`;
  }

  function drawing() {
    const { left, right, top, bottom } = plot;
    return `<defs><clipPath id="parameter-plane-clip"><rect x="${left}" y="${top}" ` +
      `width="${right - left}" height="${bottom - top}"/></clipPath></defs>${axes()}` +
      '<g clip-path="url(#parameter-plane-clip)">' +
      `<path class="plane-area" d="M${point(-1, 1)} ${arc(lower, -1, 0)} ${arc(upper, 0, -1)} Z"/>` +
      `<path class="plane-lower" d="M${point(-1.5, lower(-1.5))} ${arc(lower, -1.5, 0.5)}"/>` +
      `<path class="plane-upper" d="M${point(-1.5, upper(-1.5))} ${arc(upper, -1.5, 0.5)}"/>` +
      `<line x1="${left}" x2="${right}" class="atlas-level" data-plane-level/>` +
      '<g data-plane-slice></g></g>' +
      `<text x="${xPixel(-0.78)}" y="${yPixel(lower(-0.78)) + 14}">1</text>` +
      `<text x="${xPixel(-1.25)}" y="${yPixel(upper(-1.25)) - 8}">2</text>`;
  }

  function mount(container) {
    container.innerHTML = '<div class="az-parameter-plane"><p>Заливка — общая область двух неравенств.</p>' +
      `<svg viewBox="0 0 290 280" role="img">${drawing()}</svg>` +
      '<p class="plane-legend"><span class="plane-lower">1. a ≥ x²</span><span class="plane-upper">2. a ≤ 1 − (x + 1)²</span></p>' +
      '<label for="az-plane-level">Уровень a = <output for="az-plane-level"></output></label>' +
      '<input id="az-plane-level" type="range" min="-0.5" max="1.5" step="0.05" value="0.5">' +
      '<div class="az-plane-buttons"><button type="button" class="az-button secondary" data-plane-exact="0">a = 0</button>' +
      '<button type="button" class="az-button secondary" data-plane-exact="1">a = 1</button></div>' +
      '<fieldset><legend>На этом уровне есть решение?</legend><div class="az-plane-buttons">' +
      '<button type="button" class="az-button secondary" aria-pressed="false" data-plane-predict="yes">Есть</button>' +
      '<button type="button" class="az-button secondary" aria-pressed="false" data-plane-predict="no">Нет</button></div></fieldset>' +
      '<p class="az-feedback" role="status" data-plane-feedback></p></div>';
    const svg = container.querySelector('svg');
    const input = container.querySelector('input');
    const output = container.querySelector('output');
    const levelLine = svg.querySelector('[data-plane-level]');
    const segment = svg.querySelector('[data-plane-slice]');
    const feedback = container.querySelector('[data-plane-feedback]');
    const choices = [...container.querySelectorAll('[data-plane-predict]')];
    let a;

    function moveLevel() {
      const next = input.valueAsNumber;
      if (next === a) return;
      a = next;
      const y = yPixel(a);
      output.value = format(a);
      svg.setAttribute('aria-label', `Плоскость (x, a). Две параболы, общая область и горизонталь a = ${format(a)}`);
      levelLine.setAttribute('y1', y);
      levelLine.setAttribute('y2', y);
      segment.replaceChildren();
      feedback.textContent = '';
      feedback.className = 'az-feedback';
      for (const button of choices) button.setAttribute('aria-pressed', 'false');
    }

    function check(button) {
      const slice = sliceAt(a);
      const correct = (button.dataset.planePredict === 'yes') === Boolean(slice);
      const result = !slice ? 'Горизонталь проходит мимо общей области.' : slice.left === slice.right ?
        `Общая точка одна. Подходит x = ${format(slice.left)}.` : 'Горизонталь пересекает общую область по отрезку. Все его x подходят.';
      for (const choice of choices) choice.setAttribute('aria-pressed', String(choice === button));
      feedback.className = 'az-feedback ' + (correct ? 'ok' : 'retry');
      feedback.textContent = (correct ? 'Верно. ' : 'Сверь с рисунком. ') + result;
      if (slice) {
        const left = xPixel(slice.left);
        const right = xPixel(slice.right);
        const y = yPixel(a);
        segment.innerHTML = left === right ? `<circle cx="${left}" cy="${y}" r="4"/>` :
          `<line x1="${left}" x2="${right}" y1="${y}" y2="${y}"/>`;
      }
    }

    input.addEventListener('input', moveLevel);
    for (const button of container.querySelectorAll('[data-plane-exact]')) {
      button.addEventListener('click', () => {
        input.value = button.dataset.planeExact;
        moveLevel();
      });
    }
    for (const button of choices) button.addEventListener('click', () => check(button));
    moveLevel();
  }

  globalThis.ProfileParameterPlane = { sliceAt, mount };
})();

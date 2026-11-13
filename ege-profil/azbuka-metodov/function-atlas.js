(() => {
  'use strict';

  const all = 'все действительные числа';
  const types = {
    constant: { value: () => 2, count: a => a === 2 ? Infinity : 0 },
    line: { value: x => x + 1, count: () => 1 },
    mod: { value: Math.abs, count: a => a < 0 ? 0 : a === 0 ? 1 : 2 },
    quadratic: { value: x => (x - 1) ** 2 - 2, count: a => a < -2 ? 0 : a === -2 ? 1 : 2 },
    cubic: { value: x => x ** 3, count: () => 1 },
    quartic: { value: x => x ** 4, count: a => a < 0 ? 0 : a === 0 ? 1 : 2 },
    root: { value: Math.sqrt, count: a => a < 0 ? 0 : 1, ends: [[0, 0]] },
    cubeRoot: { value: Math.cbrt, count: () => 1 },
    inverse: { value: x => 2 / x, count: a => a === 0 ? 0 : 1, cuts: [0] },
    rational: { value: x => 1 + 2 / (x - 1), count: a => a === 1 ? 0 : 1, cuts: [1] },
    hole: { value: x => x === 1 ? NaN : x + 1, count: a => a === 2 ? 0 : 1, cuts: [1], ends: [[1, 2, true]] },
    exp: { value: x => 2 ** x, count: a => a > 0 ? 1 : 0 },
    expDown: { value: x => 0.5 ** x, count: a => a > 0 ? 1 : 0 },
    log: { value: Math.log2, count: () => 1, cuts: [0] },
    logDown: { value: x => -Math.log2(x), count: () => 1, cuts: [0] },
    sin: { value: Math.sin, count: a => Math.abs(a) <= 1 ? Infinity : 0 },
    cos: { value: Math.cos, count: a => Math.abs(a) <= 1 ? Infinity : 0 },
    tan: { value: Math.tan, count: () => Infinity, cuts: [-3 * Math.PI / 2, -Math.PI / 2, Math.PI / 2, 3 * Math.PI / 2] },
    cot: { value: x => 1 / Math.tan(x), count: () => Infinity, cuts: [-Math.PI, 0, Math.PI] },
    piece: { value: x => x < 0 ? x : 1, count: a => a === 1 ? Infinity : a < 0 ? 1 : 0, cuts: [0], ends: [[0, 0, true], [0, 1]] },
    absOut: { value: x => Math.abs(x * x - 2), count: a => a < 0 ? 0 : a === 0 ? 2 : a < 2 ? 4 : a === 2 ? 3 : 2 },
    absIn: { value: x => (Math.abs(x) - 1) ** 2, count: a => a < 0 ? 0 : a === 0 ? 2 : a < 1 ? 4 : a === 1 ? 3 : 2 },
    plateau: { value: x => Math.abs(x - 1) + Math.abs(x + 1), count: a => a < 2 ? 0 : a === 2 ? Infinity : 2 },
    radical: { value: x => Math.sqrt(x * x - 1), count: a => a < 0 ? 0 : 2, ends: [[-1, 0], [1, 0]] },
    semicircle: { value: x => Math.sqrt(9 - x * x), count: a => a < 0 || a > 3 ? 0 : a === 3 ? 1 : 2, ends: [[-3, 0], [3, 0]] }
  };

  const entries = [
    ['constant', 'Постоянная', 'y = 2', all, '{2}'],
    ['line', 'Линейная', 'y = x + 1', all, all],
    ['mod', 'Модуль', 'y = |x|', all, 'y ≥ 0'],
    ['quadratic', 'Квадратичная', 'y = (x − 1)² − 2', all, 'y ≥ −2'],
    ['cubic', 'Кубическая', 'y = x³', all, all],
    ['quartic', 'Чётная степень', 'y = x⁴', all, 'y ≥ 0'],
    ['root', 'Квадратный корень', 'y = √x', 'x ≥ 0', 'y ≥ 0'],
    ['cubeRoot', 'Кубический корень', 'y = ∛x', all, all],
    ['inverse', 'Обратная пропорциональность', 'y = 2/x', 'x ≠ 0', 'y ≠ 0'],
    ['rational', 'Дробно-линейная', 'y = 1 + 2/(x − 1)', 'x ≠ 1', 'y ≠ 1'],
    ['hole', 'Выколотая точка', 'y = (x² − 1)/(x − 1)', 'x ≠ 1', 'y ≠ 2'],
    ['exp', 'Показательная возрастающая', 'y = 2ˣ', all, 'y > 0'],
    ['expDown', 'Показательная убывающая', 'y = (1/2)ˣ', all, 'y > 0'],
    ['log', 'Логарифм по основанию 2', 'y = log₂ x', 'x > 0', all],
    ['logDown', 'Логарифм по основанию 1/2', 'y = log₁⁄₂ x', 'x > 0', all],
    ['sin', 'Синус', 'y = sin x', all, '−1 ≤ y ≤ 1'],
    ['cos', 'Косинус', 'y = cos x', all, '−1 ≤ y ≤ 1'],
    ['tan', 'Тангенс', 'y = tg x', 'x ≠ π/2 + πk, k ∈ ℤ', all],
    ['cot', 'Котангенс', 'y = ctg x', 'x ≠ πk, k ∈ ℤ', all],
    ['piece', 'Кусочная', 'y = x при x < 0, y = 1 при x ≥ 0', all, 'y < 0 или y = 1'],
    ['absOut', 'Модуль значения', 'y = |x² − 2|', all, 'y ≥ 0'],
    ['absIn', 'Модуль аргумента', 'y = (|x| − 1)²', all, 'y ≥ 0'],
    ['plateau', 'Сумма модулей', 'y = |x − 1| + |x + 1|', all, 'y ≥ 2'],
    ['radical', 'Корень от квадратного выражения', 'y = √(x² − 1)', 'x ≤ −1 или x ≥ 1', 'y ≥ 0'],
    ['semicircle', 'Верхняя полуокружность', 'y = √(9 − x²)', '−3 ≤ x ≤ 3', '0 ≤ y ≤ 3']
  ];

  const limit = 5;
  const scale = 33;
  const xPixel = x => 180 + scale * x;
  const yPixel = y => 172 - scale * y;
  const format = value => String(value).replace('-', '−').replace('.', ',');
  const line = (x1, y1, x2, y2, kind) =>
    '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" class="' + kind + '"/>';
  const grid = Array.from({ length: 11 }, (_, i) => {
    const n = i - 5;
    const kind = n ? 'atlas-grid' : 'atlas-axis';
    return line(xPixel(n), yPixel(-limit), xPixel(n), yPixel(limit), kind) +
      line(xPixel(-limit), yPixel(n), xPixel(limit), yPixel(n), kind) +
      (n ? '<text x="' + (xPixel(n) + 3) + '" y="189">' + format(n) + '</text>' +
        '<text x="157" y="' + (yPixel(n) - 3) + '">' + format(n) + '</text>' : '');
  }).join('') + '<text x="347" y="164">x</text><text x="188" y="18">y</text>';

  function curve(type) {
    let path = '';
    let previousX;
    for (let index = -500; index <= 500; index++) {
      const x = index / 100;
      const y = type.value(x);
      if (!Number.isFinite(y) || Math.abs(y) > limit + 0.2) {
        previousX = undefined;
        continue;
      }
      const join = previousX !== undefined && !type.cuts?.some(cut => previousX < cut && cut <= x);
      path += (join ? 'L' : 'M') + xPixel(x).toFixed(2) + ' ' + yPixel(y).toFixed(2);
      previousX = x;
    }
    return '<path class="atlas-curve" d="' + path + '"/>' + (type.ends ?? []).map(([x, y, open]) =>
      '<circle class="atlas-point' + (open ? ' atlas-open' : '') + '" cx="' + xPixel(x) + '" cy="' + yPixel(y) + '" r="4"/>').join('');
  }

  function mount(container) {
    container.innerHTML = '<section class="az-panel az-atlas"><h2>Атлас функций</h2>' +
      '<label for="az-atlas-function">Функция</label><select id="az-atlas-function">' +
      entries.map(([id, title]) => '<option value="' + id + '">' + title + '</option>').join('') +
      '</select><label for="az-atlas-level">Уровень y = <output for="az-atlas-level"></output></label>' +
      '<input id="az-atlas-level" type="range" min="-4" max="4" value="2" step="0.5">' +
      '<svg viewBox="0 0 360 345" role="img"></svg><div class="az-atlas-properties"></div>' +
      '<details><summary>Проверить число решений</summary><p class="az-atlas-count"></p></details></section>';
    const select = container.querySelector('select');
    const input = container.querySelector('input');
    const svg = container.querySelector('svg');
    const output = container.querySelector('output');
    const count = container.querySelector('.az-atlas-count');
    const properties = container.querySelector('.az-atlas-properties');
    const disclosure = container.querySelector('details');
    select.value = 'mod';
    let drawing;

    function refreshLevel() {
      const level = Number(input.value);
      const [, , formula] = entries[select.selectedIndex];
      output.value = format(level);
      svg.setAttribute('aria-label', formula + ' и горизонталь y = ' + format(level) + ' на отрезке от −5 до 5');
      svg.innerHTML = grid + drawing + line(xPixel(-limit), yPixel(level), xPixel(limit), yPixel(level), 'atlas-level');
      const solutions = types[select.value].count(level);
      count.textContent = 'На всей области определения число решений ' +
        (solutions === Infinity ? 'бесконечно.' : 'равно ' + solutions + '.');
    }

    function refreshFunction() {
      const [key, , formula, domain, range] = entries[select.selectedIndex];
      properties.innerHTML = '<p><strong>' + formula + '</strong></p><p>Допустимые x — ' + domain +
        '.</p><p>Значения y — ' + range + '.</p>';
      drawing = curve(types[key]);
      disclosure.open = false;
      refreshLevel();
    }

    select.addEventListener('change', refreshFunction);
    input.addEventListener('input', () => {
      disclosure.open = false;
      refreshLevel();
    });
    refreshFunction();
  }

  globalThis.ProfileFunctionAtlas = { entries, count: (id, level) => types[id].count(level), mount };
})();

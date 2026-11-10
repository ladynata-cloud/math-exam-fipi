'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { lessons } = require('../trainers/oge-active-learning-data.js');

// Independent mathematical oracles. Neither the answer checker nor any model
// helper is imported. Each oracle is tied to the complete pupil-facing prompt;
// changing a coefficient, condition or requested quantity must change its test.
const abs = n => n < 0n ? -n : n;
function rational(n, d = 1) {
  n = BigInt(n); d = BigInt(d); assert.notEqual(d, 0n);
  if (d < 0n) { n = -n; d = -d; }
  let a = abs(n), b = d;
  while (b) [a, b] = [b, a % b];
  return [n / a, d / a];
}
const multiply = (a, b) => rational(a[0] * b[0], a[1] * b[1]);
const divide = (a, b) => { assert.notEqual(b[0], 0n); return rational(a[0] * b[1], a[1] * b[0]); };
const add = (a, b) => rational(a[0] * b[1] + b[0] * a[1], a[1] * b[1]);
const text = q => q[1] === 1n ? String(q[0]) : q.join('/');
const decimal = n => String(n).replace('.', ',');
const asNumber = q => Number(q[0]) / Number(q[1]);
function squareRoot(q) {
  assert(q[0] >= 0n);
  const integerRoot = n => { let k = 0n; while (k * k < n) k++; assert.equal(k * k, n); return k; };
  return rational(integerRoot(q[0]), integerRoot(q[1]));
}
const realRootExists = n => n >= 0;
const rootQuotientExists = (a, b) => realRootExists(a) && b > 0;
const solve = (a, b, c, d) => rational(d - b, a - c); // ax+b=cx+d
const dice = Array.from({ length: 36 }, (_, i) => [Math.floor(i / 6) + 1, i % 6 + 1]);
const probability = predicate => rational(dice.filter(([a, b]) => predicate(a, b)).length, dice.length);
const cases = {};
const record = (id, prompt, oracle) => { assert(!cases[id]); cases[id] = { prompt, oracle }; };

[
  ['6-1', 'Вычисли: 2/3 ÷ 1/4.', [2, 3], [1, 4]],
  ['6-2', 'Вычисли: 5/6 ÷ 2/3.', [5, 6], [2, 3]],
  ['6-3', 'Вычисли: 7/8 ÷ 1/2.', [7, 8], [1, 2]],
  ['6-4', 'Вычисли: 3/5 ÷ 9/10.', [3, 5], [9, 10]],
  ['6-5', 'Вычисли: 4/9 ÷ 8/3.', [4, 9], [8, 3]],
  ['6-6', 'Вычисли: 5/12 ÷ 5/6.', [5, 12], [5, 6]],
  ['6-7', 'Вычисли: 9/10 ÷ 3/4.', [9, 10], [3, 4]],
  ['6-8', 'Вычисли: 4/5 ÷ 2/7.', [4, 5], [2, 7]]
].forEach(([id, prompt, a, b]) => record(id, prompt, () => {
  const q = divide(rational(...a), rational(...b));
  assert.deepEqual(multiply(q, rational(...b)), rational(...a), 'inverse multiplication');
  return q;
}));
record('7-1', 'Найди |−7|.', () => rational(Math.abs(-7)));
record('7-2', 'Точка имеет координату −6,5. Найди её расстояние до нуля.', () => rational(abs(-13n), 2));
record('7-3', 'От точки −2 передвинулись на 3 единицы влево. Запиши новую координату.', () => rational(-2 - 3));
record('7-4', 'a = −6, b = −2. Вычисли |a| − |b|.', () => rational(Math.abs(-6) - Math.abs(-2)));
record('7-5', 'От точки −3 передвинулись на 5 единиц вправо. Запиши новую координату.', () => rational(-3 + 5));
record('7-6', 'Модуль отрицательной координаты равен 3. Запиши эту координату.', () => {
  const candidates = [-3, 3].filter(x => x < 0 && Math.abs(x) === 3);
  assert.equal(candidates.length, 1); return rational(candidates[0]);
});
record('7-7', 'Какая из точек −1,5 и −4 ближе к нулю? Запиши её координату.', () => {
  const points = [rational(-3, 2), rational(-4)];
  return points.sort((a, b) => Math.abs(asNumber(a)) - Math.abs(asNumber(b)))[0];
});
record('7-8', 'Какая из точек −8 и 3 дальше от нуля? Запиши её координату.', () => rational([-8, 3].sort((a, b) => Math.abs(b) - Math.abs(a))[0]));

[
  ['8-1', 'Вычисли √16 × √25.', 16, 25, 'product'],
  ['8-2', 'Вычисли √0 × √81.', 0, 81, 'product'],
  ['8-3', 'Вычисли √36 / √4.', 36, 4, 'quotient'],
  ['8-4', 'Вычисли √0 / √49.', 0, 49, 'quotient'],
  ['8-6', 'Вычисли √3 × √48.', 3, 48, 'product'],
  ['8-7', 'Вычисли √50 / √2.', 50, 2, 'quotient']
].forEach(([id, prompt, a, b, operation]) => record(id, prompt, () => {
  assert(operation === 'product' ? realRootExists(a) && realRootExists(b) : rootQuotientExists(a, b));
  return squareRoot(operation === 'product' ? rational(a * b) : rational(a, b));
}));
record('8-5', 'Вычисли √((−5)²).', () => squareRoot(rational((-5) ** 2)));
record('8-8', 'Вычисли √0,25 × √9.', () => multiply(squareRoot(rational(1, 4)), squareRoot(rational(9))));
record('8-9', 'Сколько из трёх выражений √(−4), √0, √9 определены в действительных числах?', () => rational([-4, 0, 9].filter(realRootExists).length));
record('8-10', 'Сколько выражений √4/√0, √0/√4, √0/√0 определены?', () => rational([[4, 0], [0, 4], [0, 0]].filter(([a, b]) => rootQuotientExists(a, b)).length));

[
  ['9-1', 'Реши уравнение: 2x + 5 = 17.', 2, 5, 0, 17],
  ['9-2', 'Реши уравнение: 5x − 7 = 13.', 5, -7, 0, 13],
  ['9-3', 'Реши уравнение: 3x + 8 = 2x + 3.', 3, 8, 2, 3],
  ['9-4', 'Реши уравнение: 4x − 9 = 2x + 5.', 4, -9, 2, 5],
  ['9-5', 'Реши уравнение: 6x + 1 = 4x − 7.', 6, 1, 4, -7],
  ['9-6', 'Реши уравнение: 2x + 1 = 2.', 2, 1, 0, 2],
  ['9-7', 'Реши уравнение: 7x − 5 = 3x + 3.', 7, -5, 3, 3],
  ['9-8', 'Реши уравнение: 5 − 3x = 11.', -3, 5, 0, 11]
].forEach(([id, prompt, a, b, c, d]) => record(id, prompt, () => {
  const x = solve(a, b, c, d);
  assert.deepEqual(add(multiply(rational(a), x), rational(b)), add(multiply(rational(c), x), rational(d)), 'substitution into original equation');
  return x;
}));
[
  ['10-1', 'Две честные кости: найди вероятность того, что хотя бы на одной выпала 1.', (a, b) => a === 1 || b === 1],
  ['10-2', 'Две честные кости: найди вероятность суммы не больше 3.', (a, b) => a + b <= 3],
  ['10-3', 'Две честные кости: найди вероятность суммы не больше 5.', (a, b) => a + b <= 5],
  ['10-4', 'Две честные кости: найди вероятность того, что результат первой больше результата второй.', (a, b) => a > b],
  ['10-5', 'Две честные кости: найди вероятность двух чётных результатов.', (a, b) => a % 2 === 0 && b % 2 === 0],
  ['10-6', 'Две честные кости: найди вероятность того, что хотя бы на одной выпала 6.', (a, b) => a === 6 || b === 6],
  ['10-7', 'Две честные кости: найди вероятность нечётной суммы.', (a, b) => (a + b) % 2 === 1],
  ['10-8', 'Две обычные честные кости с числами 1–6: найди вероятность того, что произведение результатов равно 0.', (a, b) => a * b === 0]
].forEach(([id, prompt, predicate]) => record(id, prompt, () => probability(predicate)));
[
  ['11-1', 'В функции y = −5/x найди y при x = 0,5.', -5, 1, 2],
  ['11-2', 'В функции y = 6/x найди y при x = −1.', 6, -1, 1],
  ['11-3', 'В функции y = −7/x найди y при x = 7.', -7, 7, 1],
  ['11-4', 'В функции y = 0/x найди y при x = −6.', 0, -6, 1],
  ['11-5', 'В функции y = 5/x найди y при x = 10.', 5, 10, 1],
  ['11-6', 'В функции y = −6/x найди y при x = −6.', -6, -6, 1],
  ['11-7', 'В функции y = 9/x найди y при x = 3.', 9, 3, 1],
  ['11-8', 'В функции y = 8/x найди y при x = 0,5.', 8, 1, 2]
].forEach(([id, prompt, k, n, d]) => record(id, prompt, () => divide(rational(k), rational(n, d))));
[
  ['12-1', 'Автомобиль едет 150 км со скоростью 60 км/ч. Найди время в часах.', 150, 60],
  ['12-2', 'Велосипедист проходит 84 км со скоростью 24 км/ч. Найди время в часах.', 84, 24],
  ['12-3', 'Автобус проходит 135 км со скоростью 60 км/ч. Найди время в часах.', 135, 60],
  ['12-4', 'Поезд проходит 180 км со скоростью 45 км/ч. Найди время в часах.', 180, 45],
  ['12-5', 'Автомобиль проходит 275 км со скоростью 55 км/ч. Найди время в часах.', 275, 55],
  ['12-6', 'Автомобиль проходит 54 км со скоростью 72 км/ч. Найди время в часах.', 54, 72],
  ['12-7', 'Автомобиль проходит 100 км со скоростью 80 км/ч. Найди время в часах.', 100, 80],
  ['12-8', 'Поезд проходит 96 км со скоростью 48 км/ч. Найди время в часах.', 96, 48]
].forEach(([id, prompt, km, kmPerHour]) => record(id, prompt, () => {
  assert(km > 0 && kmPerHour > 0);
  const hours = rational(km, kmPerHour);
  assert.deepEqual(multiply(rational(kmPerHour), hours), rational(km));
  return hours;
}));

test('the independent prompt/oracle table covers all 58 unique practice keys', () => {
  const keys = Object.values(lessons).flatMap(lesson => lesson.practice.map(p => p.id));
  assert.equal(keys.length, 58);
  assert.equal(new Set(keys).size, 58);
  assert.deepEqual(keys.sort(), Object.keys(cases).sort());
  assert.deepEqual(Object.keys(lessons), ['6', '7', '8', '9', '10', '11', '12']);
});
for (const lesson of Object.values(lessons)) {
  test('independent exact mathematics for all practice answers in №' + lesson.number, async t => {
    for (const item of lesson.practice) await t.test(item.id, () => {
      const expected = cases[item.id]; assert(expected, item.id);
      assert.equal(item.prompt, expected.prompt, 'wording must still describe these operands and this requested quantity');
      const result = expected.oracle();
      assert(item.answer.every(Number.isSafeInteger));
      assert.deepEqual(rational(...item.answer), result, item.id + ': independently calculated answer');
      for (const mistake of item.mistakes || []) assert.notDeepEqual(rational(...mistake.answer), result, item.id + ': misconception is not a correct equivalent fraction');
    });
  });
}

const model = (n, values) => {
  const result = lessons[n].model(values);
  assert.doesNotMatch(result.html + result.caption, /NaN|Infinity|undefined/);
  return { ...result, dom: JSDOM.fragment(result.html) };
};
const close = (actual, expected, tolerance = 1e-9) => assert(Math.abs(actual - expected) <= tolerance, `${actual} must be within ${tolerance} of ${expected}`);
const attr = (element, name) => { assert(element); return Number(element.getAttribute(name)); };

test('№6 fraction bars share a scale; division is checked by multiplication and zero has no quotient', () => {
  for (const n of [0, 1, 3, 6]) for (const d of [1, 2, 8]) {
    const { caption, dom } = model(6, { n, d });
    const bars = [...dom.querySelectorAll('rect')]; assert.equal(bars.length, 2);
    const [dividendWidth, divisorWidth] = bars.map(e => attr(e, 'width'));
    if (n === 0) { assert.equal(divisorWidth, 0); assert.match(caption, /Делитель равен 0\. Частное не определено/); }
    else {
      const quotient = divide(rational(3, 4), rational(n, d));
      close(dividendWidth / divisorWidth, asNumber(quotient));
      assert(caption.includes(`3/4 ÷ ${text(rational(n, d))} = ${text(quotient)}.`));
      assert(caption.includes(`${text(rational(n, d))} × ${text(quotient)} = 3/4.`));
    }
  }
  assert(asNumber(divide(rational(3, 4), rational(1, 2))) > 3 / 4);
  assert(asNumber(divide(rational(3, 4), rational(2))) < 3 / 4);
});

test('№7 distinguishes signed coordinate, ordering and nonnegative distance, including coincident and opposite points', () => {
  for (const [a, b] of [[-4, -1], [-1, -4], [-3, 3], [3, -3], [0, 0], [-5, -5], [0, 2.5], [-.5, 0], [5, -5]]) {
    const { caption, dom } = model(7, { a, b });
    const points = [...dom.querySelectorAll('circle')]; assert.equal(points.length, 2);
    close(attr(points[0], 'cx'), 160 + 26 * a); close(attr(points[1], 'cx'), 160 + 26 * b);
    assert(caption.includes(`|a| = ${decimal(Math.abs(a))}, |b| = ${decimal(Math.abs(b))}.`));
    assert(caption.includes(a === b ? 'Координаты совпадают.' : a > b ? 'A правее B:' : 'B правее A:'));
    assert(caption.includes(Math.abs(a) === Math.abs(b) ? 'Расстояния до нуля одинаковы.' : Math.abs(a) > Math.abs(b) ? 'A дальше от нуля.' : 'B дальше от нуля.'));
  }
  const option = lessons[7].concept.options.find(o => o.text === 'Он всегда положителен.');
  assert(option); assert.equal(option.correct, Math.abs(0) > 0, 'zero refutes strictly positive distance');
});

test('№8 root products and quotients enforce the original domains, not only a nonnegative combined radicand', () => {
  for (const a of [-4, -1, 0, 1, 4, 9]) for (const b of [-4, 0, 1, 4, 9]) for (const op of [0, 1]) {
    const { caption, dom } = model(8, { a, b, op, x: -3 });
    const allowed = op === 0 ? a >= 0 && b >= 0 : rootQuotientExists(a, b);
    if (!allowed) {
      assert.match(caption, /не определено/);
      assert.doesNotMatch(caption, /^(Произведение|Частное):/);
      if (op === 1 && b === 0) assert.match(caption, /на ноль делить нельзя/);
      if (a < 0 || b < 0) assert.match(dom.textContent, /Нет такойплощади/);
    } else {
      assert.doesNotMatch(caption, /не определено/);
      if (op === 0) {
        const result = multiply(squareRoot(rational(a)), squareRoot(rational(b)));
        assert(caption.startsWith(`Произведение: √${a} × √${b} = √${a * b} = ${text(result)}.`));
      } else {
        const result = divide(squareRoot(rational(a)), squareRoot(rational(b)));
        assert(caption.startsWith(`Частное: √${a} / √${b} = √(${text(rational(a, b))}) = ${text(result)}.`));
      }
      for (const rect of dom.querySelectorAll('rect')) assert(attr(rect, 'width') >= 0 && attr(rect, 'height') >= 0);
    }
  }
  const rejectedProduct = model(8, { a: -1, b: -1, op: 0, x: 0 }).caption;
  assert.match(rejectedProduct, /Произведение подкоренных чисел равно 1, но это не разрешает/);
  assert.match(model(8, { a: -4, b: -1, op: 1 }).caption, /Положительное отношение a\/b само по себе недостаточно/);
  assert.match(model(8, { a: 0, b: 9, op: 1 }).caption, /√\(0\) = 0\./);
  assert.match(model(8, { a: 1, b: 4, op: 1 }).caption, /√\(1\/4\) = 1\/2\./);
  assert.match(model(8, { a: 2, b: 8, op: 1 }).caption, /√\(1\/4\) = 1\/2\./);
  for (const x of [-4, -1, 0, 1, 4]) {
    const { dom } = model(8, { a: 4, b: 9, x, op: 0 });
    assert.equal(dom.querySelector('[role="math"]').textContent, `√((${x})²) = √${x * x} = ${Math.abs(x)} = |${x}|.`);
  }
});

test('№8 concept accepts exactly the root-quotient domain and rejects both counterexamples', () => {
  const { prompt, options } = lessons[8].concept;
  assert.equal(prompt, 'При каких условиях можно объединить √a / √b в √(a/b)?');
  assert.deepEqual(options.map(o => o.text), ['a ≥ 0 и b > 0.', 'a ≥ 0 и b ≥ 0.', 'Достаточно, чтобы a/b было положительным.']);
  const predicates = [(a, b) => a >= 0 && b > 0, (a, b) => a >= 0 && b >= 0, (a, b) => a / b > 0];
  const witnesses = [[0, 4], [4, 0], [0, 0], [-4, -1], [4, 9], [-1, 4]];
  const sufficient = predicates.map(predicate => witnesses.every(([a, b]) => !predicate(a, b) || rootQuotientExists(a, b)));
  assert.deepEqual(options.map(o => o.correct), sufficient);
  assert.equal(lessons[8].prediction.prompt, 'Можно ли записать √(−1) × √(−1) = √1 = 1 в действительных числах?');
  assert.equal(lessons[8].prediction.options[0].correct, !realRootExists(-1));
});

test('№9 both equivalent actions are accepted; unilateral subtraction and division by zero are rejected', () => {
  const { prompt, options } = lessons[9].concept;
  assert.equal(prompt, 'Выбери любое равносильное действие для 3x + 4 = x + 10 (верных вариантов несколько).');
  assert.deepEqual(options.map(o => o.text), ['Вычесть x из обеих частей.', 'Вычесть 4 из обеих частей.', 'Вычесть 4 только из левой части.', 'Разделить обе части на 0.']);
  const original = solve(3, 4, 1, 10);
  const equivalents = [[2, 4, 0, 10], [3, 0, 1, 6], [3, 0, 1, 10]].map(equation => text(solve(...equation)) === text(original));
  equivalents.push(false); // Division by zero is outside real arithmetic.
  assert.deepEqual(options.map(o => o.correct), equivalents);
  assert.equal(equivalents.filter(Boolean).length, 2);
  for (const x of [-2, 0, 3, 5]) for (const amount of [-5, 0, 5]) {
    const { caption, dom } = model(9, { x, add: amount });
    const left = 3 * x + 4 + amount, right = x + 10 + amount;
    assert(caption.includes(`значения частей: ${left} и ${right}.`));
    assert(caption.includes(`Разность частей равна ${2 * x - 6}.`));
    assert(caption.includes(left === right ? 'Равенство сохранилось.' : 'Равенства нет;'));
    const labels = [...dom.querySelectorAll('svg text')].slice(0, 2).map(e => e.textContent);
    assert.deepEqual(labels, [String(left), String(right)]);
  }
});

test('№10 every die sum highlights the complete ordered sample space with the independently counted probability', () => {
  assert.equal(new Set(dice.map(pair => pair.join(','))).size, 36);
  for (let sum = 2; sum <= 12; sum++) {
    const { caption, dom } = model(10, { sum });
    const cells = [...dom.querySelectorAll('[data-match]')]; assert.equal(cells.length, 36);
    const rendered = cells.map(cell => cell.textContent.split('+').map(Number));
    assert.deepEqual(rendered, dice);
    const expected = dice.filter(([a, b]) => a + b === sum);
    assert.deepEqual(cells.filter(cell => cell.dataset.match === 'true').map(cell => cell.textContent), expected.map(pair => pair.join('+')));
    cells.forEach((cell, i) => assert.equal(cell.getAttribute('aria-label'), `Первая кость ${dice[i][0]}, вторая ${dice[i][1]}, ${dice[i][0] + dice[i][1] === sum ? 'подходит' : 'не подходит'}`));
    assert(caption.includes(`Сумма ${sum}: подходят ${expected.length} из 36 исходов. Вероятность ${text(probability((a, b) => a + b === sum))}.`));
  }
  assert.notDeepEqual([1, 6], [6, 1]);
  assert.equal(dice.filter(([a, b]) => a + b === 7).length, 6);
  assert.equal(dice.filter(([a, b]) => a + b === 6).length, 5);
  assert.equal(dice.filter(([a, b]) => a + b === 8).length, 5);
});

test('№11 plotted points satisfy xy=k; branches exclude x=0 even for k=0', () => {
  for (const k of [-4, -1, 0, 1, 4]) for (const x of [-2, -.5, 0, .5, 2]) {
    const { caption, dom } = model(11, { k, x });
    const branches = [...dom.querySelectorAll('path[data-branch]')]; assert.equal(branches.length, 2);
    for (const branch of branches) {
      const sign = branch.dataset.branch === 'negative' ? -1 : 1;
      const coordinates = [...branch.getAttribute('d').matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)];
      assert.equal(coordinates.length, 101);
      for (const [, px, py] of coordinates) {
        const horizontal = (Number(px) - 160) / 33, vertical = (116 - Number(py)) / 25;
        assert(sign * horizontal > 0, 'no branch connects through the excluded axis');
        close(horizontal * vertical, k, .002);
      }
    }
    const dot = dom.querySelector('circle[fill="#b46b21"]');
    if (x === 0) { assert.equal(dot, null); assert.match(caption, /При x = 0 значение не определено: деление на ноль/); }
    else {
      const y = k / x;
      assert(caption.includes(`При x = ${decimal(x)} значение y = ${text(divide(rational(k), rational(x * 2, 2)))}.`));
      if (Math.abs(y) <= 4) { assert(dot); close(attr(dot, 'cx'), 160 + 33 * x); close(attr(dot, 'cy'), 116 - 25 * y); }
      else { assert.equal(dot, null); assert.match(caption, /за вертикальной границей рисунка/); }
    }
    const rows = [...dom.querySelectorAll('tbody tr')]; assert.equal(rows.length, 7);
    for (const row of rows) {
      const input = Number(row.querySelector('th').textContent);
      assert.equal(row.querySelector('td').textContent, input === 0 ? 'не определено' : text(rational(k, input)));
    }
    if (k === 0) {
      const hole = dom.querySelector('circle[fill="#fff"]'); assert(hole);
      assert.equal(attr(hole, 'cx'), 160); assert.equal(attr(hole, 'cy'), 116);
      assert.match(caption, /y = 0 для всех x ≠ 0; точка \(0; 0\) исключена\. Это уже не гипербола/);
    }
  }
});

test('№12 time uses km divided by km/h, reciprocal speed and a strictly positive speed domain', () => {
  for (const speed of [0, 10, 40, 80, 120]) {
    const { caption, dom } = model(12, { v: speed });
    const dot = dom.querySelector('circle[fill="#b46b21"]');
    assert.match(dom.textContent, /t, ч/); assert.match(dom.textContent, /v, км\/ч/);
    if (speed === 0) { assert.equal(dot, null); assert.match(caption, /не определено: на ноль делить нельзя/); }
    else {
      const hours = rational(120, speed);
      assert(caption.includes(`S = 120 км, v = ${speed} км/ч: t = 120/${speed} = ${text(hours)} ч.`));
      close(attr(dot, 'cx'), 28 + 2.2 * speed); close(attr(dot, 'cy'), 210 - 15 * asNumber(hours));
      assert.deepEqual(multiply(rational(speed), hours), rational(120));
    }
  }
  assert.deepEqual(divide(rational(120, 40), rational(120, 80)), rational(2), 'doubling speed halves time for the same positive distance');
  const concept = lessons[12].concept;
  assert.equal(concept.options[0].text, 't = S/v, причём v > 0; единицы должны согласовываться.');
  assert.deepEqual(concept.options.map(o => o.correct), [true, false, false]);
});

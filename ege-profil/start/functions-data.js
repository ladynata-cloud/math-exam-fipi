(function (root) {
  'use strict';
  // Author-written practice. In every theme the first three tasks are guided;
  // the last three use new numerical conditions for independent practice.
  const f = n => String(Number(n.toFixed(8))).replace(/-/g, '−').replace('.', ',');
  const par = n => n < 0 ? '(' + f(n) + ')' : f(n);
  const add = n => n < 0 ? ' − ' + f(-n) : n > 0 ? ' + ' + f(n) : '';
  const S = (prompt, answer, hint, why, focus) => ({ prompt, answer, hint, why, focus: focus || 'graph' });
  const T = (id, prompt, steps, answer, explanation, meta) => ({ id, prompt, steps, answer, explanation, meta });
  const L = (id, position, title, summary, intro, why, prereq, tasks) => ({
    id, position, group: position === 9 ? 'calculus' : 'functions', title, summary, intro, why,
    model: id,
    prereq: { title: 'Вспомнить перед задачей', text: '<p>' + prereq + '</p>', href: '/ege-profil/start/index.html#home' },
    links: [{ title: 'Ещё задачи на функции', href: '/ege-profil/trainers/functions-t1112.html' }], tasks
  });
  function tangent(i, a, b, x0, curve) {
    const dx = b[0] - a[0], dy = b[1] - a[1], slope = dy / dx;
    const value = a[1] + slope * (x0 - a[0]);
    const pair = p => '(' + p.map(f).join('; ') + ')';
    return T('calc-tangent-' + i,
      'На рисунке — график y = f(x) и касательная к нему в точке с абсциссой x₀ = ' + f(x0) + '. Касательная проходит через A' + pair(a) + ' и B' + pair(b) + '. Найди f′(' + f(x0) + ').', [
        S('Найди изменение x от A к B: ' + f(b[0]) + ' − ' + par(a[0]) + '.', dx, 'Берём x точки B и вычитаем x точки A.', 'По горизонтали: Δx = ' + f(dx) + '.', 'run'),
        S('Найди изменение y от A к B: ' + f(b[1]) + ' − ' + par(a[1]) + '.', dy, 'Порядок тот же: B минус A. Отрицательное число означает движение вниз.', 'По вертикали: Δy = ' + f(dy) + '.', 'rise'),
        S('Раздели изменение y на изменение x: ' + par(dy) + ' : ' + f(dx) + '.', slope, 'Производная равна наклону касательной: f′(x₀) = Δy / Δx.', 'f′(' + f(x0) + ') = ' + f(slope) + '.', 'slope')
      ], slope, 'По касательной: Δx = ' + f(dx) + ', Δy = ' + f(dy) + '. Поэтому f′(' + f(x0) + ') = ' + par(dy) + ' / ' + f(dx) + ' = ' + f(slope) + '.',
      { kind: 'tangent', a, b, x0, curve, value });
  }
  function signs(i, left, right, coefficient, target) {
    const min = coefficient > 0 ? right : left, max = coefficient > 0 ? left : right;
    const answer = target === 'minimum' ? min : max, name = target === 'minimum' ? 'минимума' : 'максимума';
    return T('calc-sign-' + i,
      'На рисунке дан график производной y = f′(x) на отрезке [' + f(left - 2) + '; ' + f(right + 2) + ']. Он пересекает ось x в двух точках. Найди абсциссу точки ' + name + ' функции f(x) на этом отрезке.', [
        S('В какой точке график производной пересекает ось x слева? Введи x.', left, 'Читай число на горизонтальной оси. Здесь y = f′(x), а не сама функция.', 'Левый нуль производной: x = ' + f(left) + '.', 'left-zero'),
        S('В какой точке график производной пересекает ось x справа? Введи x.', right, 'Нужна координата второго пересечения с осью x.', 'Правый нуль производной: x = ' + f(right) + '.', 'right-zero'),
        S('Найди x, где знак f′ меняется ' + (target === 'minimum' ? 'с минуса на плюс' : 'с плюса на минус') + '.', answer,
          target === 'minimum' ? 'При f′ < 0 функция убывает, при f′ > 0 возрастает. Минимум — переход от убывания к возрастанию.' : 'При f′ > 0 функция возрастает, при f′ < 0 убывает. Максимум — переход от возрастания к убыванию.',
          'При x = ' + f(answer) + ' функция переходит ' + (target === 'minimum' ? 'от убывания к возрастанию: это минимум.' : 'от возрастания к убыванию: это максимум.'), 'signs')
      ], answer, 'Смотрим именно на знак производной: выше оси x — плюс, ниже — минус. Для ' + name + ' нужен переход ' + (target === 'minimum' ? '− → +' : '+ → −') + '. Он происходит при x = ' + f(answer) + '.',
      { kind: 'derivative-sign', left, right, coefficient, target });
  }
  function touch(i, zero, coefficient) {
    return T('calc-sign-' + i,
      'На рисунке дан график производной y = f′(x). Он касается оси x в точке x = ' + f(zero) + ' и в остальных точках расположен ' + (coefficient > 0 ? 'выше' : 'ниже') + ' неё. Сколько точек экстремума у функции f(x)?', [
        S('В какой точке производная равна нулю? Введи x.', zero, 'Найди касание графика производной с осью x.', 'f′(' + f(zero) + ') = 0.', 'left-zero'),
        S('Сколько раз производная меняет знак при прохождении через эту точку?', 0, 'По обе стороны график остаётся ' + (coefficient > 0 ? 'выше' : 'ниже') + ' оси x.', 'Смены знака нет.', 'signs'),
        S('Сколько точек максимума или минимума получилось?', 0, 'Одного равенства f′ = 0 недостаточно. Здесь направление изменения функции не меняется.', 'Экстремумов нет: ответ 0.', 'signs')
      ], 0, 'Производная равна нулю в одной точке, но знак не меняет. Функция продолжает ' + (coefficient > 0 ? 'возрастать' : 'убывать') + '. Точек экстремума нет.',
      { kind: 'derivative-touch', zero, coefficient });
  }
  function derivative(i, kind, data, prefix = 'calc-value') {
    const id = prefix + '-' + i;
    if (kind === 'quadratic') {
      const { a, b, c, x } = data, answer = 2 * a * x + b;
      const formula = f(a) + 'x²' + (b ? add(b) + 'x' : '') + add(c);
      return T(id, 'Дана функция f(x) = ' + formula + '. Найди f′(' + f(x) + ').', [
        S('При дифференцировании ax² коэффициент a умножается на 2. Найди 2 · ' + par(a) + '.', 2 * a, '(ax²)′ = 2ax. Степень 2 опускается перед x.', 'Производная первого слагаемого: ' + f(2 * a) + 'x.', 'derivative'),
        S('Подставь x = ' + f(x) + ' в ' + f(2 * a) + 'x: ' + par(2 * a) + ' · ' + par(x) + '.', 2 * a * x, 'Сначала считаем слагаемое с x.', 'Получили ' + f(2 * a * x) + '.', 'point'),
        S('Прибавь производную ' + f(b) + 'x, то есть ' + f(b) + ': ' + par(2 * a * x) + add(b) + '.', answer, 'Производная постоянного числа равна 0.', 'f′(' + f(x) + ') = ' + f(answer) + '.', 'derivative')
      ], answer, 'f′(x) = ' + f(2 * a) + 'x' + add(b) + '. При x = ' + f(x) + ': f′(' + f(x) + ') = ' + f(answer) + '.', { kind: 'derivative-quadratic', ...data });
    }
    if (kind === 'cubic') {
      const { a, b, x } = data, square = x * x, answer = 3 * a * square + b;
      return T(id, 'Дана функция f(x) = ' + f(a) + 'x³' + (b ? add(b) + 'x' : '') + '. Найди f′(' + f(x) + ').', [
        S('Производная: f′(x) = ' + f(3 * a) + 'x²' + add(b) + '. Сначала найди ' + par(x) + '².', square, '(ax³)′ = 3ax², (bx)′ = b.', 'x² = ' + f(square) + '.', 'derivative'),
        S('Умножь ' + f(square) + ' на ' + f(3 * a) + '.', 3 * a * square, 'Это значение первого слагаемого производной.', 'Первое слагаемое равно ' + f(3 * a * square) + '.', 'point'),
        S('Прибавь ' + f(b) + '.', answer, 'Складываем два слагаемых f′(x).', 'f′(' + f(x) + ') = ' + f(answer) + '.', 'derivative')
      ], answer, 'f′(x) = ' + f(3 * a) + 'x²' + add(b) + '. f′(' + f(x) + ') = ' + f(answer) + '.', { kind: 'derivative-cubic', ...data });
    }
    if (kind === 'reciprocal') {
      const { a, x } = data, answer = -a / (x * x);
      return T(id, 'Дана функция f(x) = ' + f(a) + '/x, x ≠ 0. Найди f′(' + f(x) + ').', [
        S('Для f(x) = a/x производная f′(x) = −a/x². Найди ' + par(x) + '².', x * x, 'Квадрат отрицательного числа тоже положителен.', 'x² = ' + f(x * x) + '.', 'derivative'),
        S('Вычисли ' + par(-a) + ' : ' + f(x * x) + '.', answer, 'Минус в формуле производной сохраняется.', 'f′(' + f(x) + ') = ' + f(answer) + '.', 'derivative')
      ], answer, 'f′(x) = ' + f(-a) + '/x². Подставляем x = ' + f(x) + ': ' + par(-a) + ' / ' + f(x * x) + ' = ' + f(answer) + '.', { kind: 'derivative-reciprocal', ...data });
    }
    if (kind === 'exponential') {
      const { a } = data;
      return T(id, 'Дана функция f(x) = ' + f(a) + 'eˣ. Найди f′(0).', [
        S('Производная eˣ равна eˣ. Чему равно e⁰?', 1, 'Любое положительное число в нулевой степени равно 1.', 'e⁰ = 1.', 'point'),
        S('Умножь ' + f(a) + ' на 1.', a, 'Множитель перед eˣ сохраняется при дифференцировании.', 'f′(0) = ' + f(a) + '.', 'derivative')
      ], a, 'f′(x) = ' + f(a) + 'eˣ. Поэтому f′(0) = ' + f(a) + ' · 1 = ' + f(a) + '.', { kind: 'derivative-exponential', a, x: 0 });
    }
    if (kind === 'logarithm') {
      const { a, x } = data;
      return T(id, 'Дана функция f(x) = ' + f(a) + ' ln x, x > 0. Найди f′(' + f(x) + ').', [
        S('Производная ln x равна 1/x. Найди 1 : ' + f(x) + '.', 1 / x, 'ln x — натуральный логарифм. Здесь x положителен.', 'При x = ' + f(x) + ' производная ln x равна 1/' + f(x) + '.', 'derivative'),
        S('Умножь полученное число на ' + f(a) + '.', a / x, 'Множитель перед ln x сохраняется.', 'f′(' + f(x) + ') = ' + f(a / x) + '.', 'derivative')
      ], a / x, 'f′(x) = ' + f(a) + '/x. При x = ' + f(x) + ' получаем ' + f(a / x) + '.', { kind: 'derivative-logarithm', ...data });
    }
    const { a, x } = data, answer = a / (2 * Math.sqrt(x));
    return T(id, 'Дана функция f(x) = ' + f(a) + '√x. Найди f′(' + f(x) + ').', [
      S('Для x > 0 производная √x равна 1/(2√x). Найди √' + f(x) + '.', Math.sqrt(x), 'Нужен неотрицательный квадратный корень.', '√' + f(x) + ' = ' + f(Math.sqrt(x)) + '.', 'point'),
      S('Умножь корень на 2.', 2 * Math.sqrt(x), 'Это знаменатель производной.', '2√' + f(x) + ' = ' + f(2 * Math.sqrt(x)) + '.', 'derivative'),
      S('Раздели ' + f(a) + ' на найденный знаменатель.', answer, 'Множитель ' + f(a) + ' остаётся в числителе.', 'f′(' + f(x) + ') = ' + f(answer) + '.', 'derivative')
    ], answer, 'f′(x) = ' + f(a) + '/(2√x). При x = ' + f(x) + ': ' + f(a) + '/' + f(2 * Math.sqrt(x)) + ' = ' + f(answer) + '.', { kind: 'derivative-root', ...data });
  }
  function extremum(i, a, h, k, left, right, target) {
    const formula = (a === 1 ? '' : a === -1 ? '−' : f(a)) + '(x' + add(-h) + ')²' + add(k);
    const value = x => a * (x - h) ** 2 + k, inside = h > left && h < right;
    const candidates = [left, ...(inside ? [h] : []), right], values = candidates.map(value);
    const answer = (target === 'min' ? Math.min : Math.max)(...values), title = target === 'min' ? 'наименьшее' : 'наибольшее';
    const steps = [S('f′(x) = ' + f(2 * a) + '(x' + add(-h) + '). При каком x производная равна нулю?', h, 'Ноль получается, когда выражение в скобках равно нулю.', 'Критическая точка: x = ' + f(h) + (inside ? '. Она внутри отрезка.' : '. Она вне внутренней части отрезка; отдельно её не проверяем.'), 'critical')];
    candidates.forEach(x => steps.push(S('Найди значение исходной функции при x = ' + f(x) + ': ' + (a === 1 ? '' : par(a) + ' · ') + '(' + par(x) + add(-h) + ')²' + add(k) + '.', value(x), 'Подставляй в f(x), а не в f′(x).', 'f(' + f(x) + ') = ' + f(value(x)) + '.', 'candidate')));
    steps.push(S('Сравни найденные значения: ' + values.map(f).join('; ') + '. Введи ' + title + '.', answer, 'Нужен y — значение функции. Не координата x.', 'На отрезке ' + title + ' значение функции равно ' + f(answer) + '.', 'compare'));
    return T('calc-extreme-' + i, 'Найди ' + title + ' значение функции f(x) = ' + formula + ' на отрезке [' + f(left) + '; ' + f(right) + '].', steps, answer,
      'Проверяем оба конца отрезка' + (inside ? ' и критическую точку внутри' : '') + '. ' + candidates.map(x => 'f(' + f(x) + ') = ' + f(value(x))).join('; ') + '. ' + (target === 'min' ? 'Самое маленькое' : 'Самое большое') + ' значение: ' + f(answer) + '.',
      { kind: 'extreme-quadratic', a, h, k, left, right, target });
  }
  function cubicExtreme(i, a, left, right, target) {
    // On this interval only the positive stationary point is interior.
    const fn = x => x ** 3 - 3 * a * a * x, candidates = [left, a, right], values = candidates.map(fn);
    const answer = (target === 'min' ? Math.min : Math.max)(...values), title = target === 'min' ? 'наименьшее' : 'наибольшее';
    return T('calc-extreme-' + i, 'Найди ' + title + ' значение f(x) = x³ − ' + f(3 * a * a) + 'x на отрезке [' + f(left) + '; ' + f(right) + '].', [
      S('f′(x) = 3x² − ' + f(3 * a * a) + '. Из f′(x) = 0 получаем x² = ' + f(a * a) + '. Какая из двух точек находится внутри данного отрезка?', a, 'Корни: −' + f(a) + ' и ' + f(a) + '. Проверь границы отрезка.', 'Внутри отрезка только x = ' + f(a) + '.', 'critical'),
      ...candidates.map(x => S('Вычисли f(' + f(x) + ') = ' + par(x) + '³ − ' + f(3 * a * a) + ' · ' + par(x) + '.', fn(x), 'Используем исходную функцию, не её производную.', 'f(' + f(x) + ') = ' + f(fn(x)) + '.', 'candidate')),
      S('Сравни ' + values.map(f).join('; ') + '. Введи ' + title + ' значение.', answer, 'Проверены и концы отрезка, и критическая точка.', 'Ответ: ' + f(answer) + '.', 'compare')
    ], answer, 'Производная обращается в ноль при x = ±' + f(a) + '. Внутри отрезка только ' + f(a) + '. ' + candidates.map(x => 'f(' + f(x) + ') = ' + f(fn(x))).join('; ') + '. Ответ: ' + f(answer) + '.', { kind: 'extreme-cubic', a, left, right, target });
  }
  function line(i, a, b, target) {
    const dx = b[0] - a[0], dy = b[1] - a[1], slope = dy / dx, intercept = a[1] - slope * a[0], answer = slope * target + intercept;
    return T('fn-line-' + i, 'График функции y = kx + b проходит через A(' + a.map(f).join('; ') + ') и B(' + b.map(f).join('; ') + '). Найди y при x = ' + f(target) + '.', [
      S('Найди изменение x: ' + f(b[0]) + ' − ' + par(a[0]) + '.', dx, 'Вычитаем координаты в порядке B минус A.', 'Δx = ' + f(dx) + '.', 'run'),
      S('Найди изменение y: ' + f(b[1]) + ' − ' + par(a[1]) + '.', dy, 'Порядок тот же: B минус A.', 'Δy = ' + f(dy) + '.', 'rise'),
      S('Найди k = Δy / Δx.', slope, 'Раздели изменение y на изменение x.', 'k = ' + f(slope) + '.', 'slope'),
      S('Подставь точку A. Найди b = ' + f(a[1]) + ' − ' + par(slope) + ' · ' + par(a[0]) + '.', intercept, 'Из y = kx + b получаем b = y − kx.', 'b = ' + f(intercept) + '.', 'intercept'),
      S('Теперь x = ' + f(target) + '. Найди y = ' + par(slope) + ' · ' + par(target) + add(intercept) + '.', answer, 'Подставляем нужное x в найденную формулу прямой.', 'y = ' + f(answer) + '.', 'target')
    ], answer, 'k = (' + par(b[1]) + ' − ' + par(a[1]) + ')/(' + par(b[0]) + ' − ' + par(a[0]) + ') = ' + f(slope) + '. b = ' + f(intercept) + '. При x = ' + f(target) + ' получаем y = ' + f(answer) + '.', { kind: 'line-value', a, b, target });
  }
  function parabola(i, h, k, px, py, target) {
    const square = (px - h) ** 2, coeff = (py - k) / square, answer = coeff * (target - h) ** 2 + k;
    return T('fn-parabola-' + i, 'Вершина параболы y = a(x' + add(-h) + ')²' + add(k) + ' — точка (' + f(h) + '; ' + f(k) + '). Парабола проходит через A(' + f(px) + '; ' + f(py) + '). Найди y при x = ' + f(target) + '.', [
      S('Для точки A найди (x − ' + par(h) + ')²: (' + par(px) + ' − ' + par(h) + ')².', square, 'Сначала разность, затем её квадрат.', 'Квадрат разности равен ' + f(square) + '.', 'point'),
      S('В равенстве ' + f(py) + ' = a · ' + f(square) + add(k) + ' перенеси ' + f(k) + '. Найди ' + f(py) + ' − ' + par(k) + '.', py - k, 'Из значения y вычитаем вертикальный сдвиг.', 'a · ' + f(square) + ' = ' + f(py - k) + '.', 'coefficient'),
      S('Найди a: ' + par(py - k) + ' : ' + f(square) + '.', coeff, 'Делим обе части равенства на коэффициент при a.', 'a = ' + f(coeff) + '.', 'coefficient'),
      S('Подставь x = ' + f(target) + ': y = ' + par(coeff) + ' · (' + par(target) + ' − ' + par(h) + ')²' + add(k) + '.', answer, 'Сначала скобки и квадрат, затем умножение и сложение.', 'y = ' + f(answer) + '.', 'target')
    ], answer, 'По точке A: a = (' + par(py) + ' − ' + par(k) + ')/(' + par(px) + ' − ' + par(h) + ')² = ' + f(coeff) + '. При x = ' + f(target) + ' получаем y = ' + f(answer) + '.', { kind: 'parabola-value', h, k, px, py, target });
  }
  function hyperbola(i, h, b, px, py, target) {
    const coeff = (py - b) * (px - h), answer = coeff / (target - h) + b;
    return T('fn-hyperbola-' + i, 'Гипербола y = k/(x' + add(-h) + ')' + add(b) + ' проходит через A(' + f(px) + '; ' + f(py) + '). Найди y при x = ' + f(target) + '.', [
      S('Подставим точку A. Найди y − ' + par(b) + ': ' + f(py) + ' − ' + par(b) + '.', py - b, 'Убираем число, прибавленное к дроби.', 'k/(x' + add(-h) + ') = ' + f(py - b) + '.', 'point'),
      S('Найди знаменатель при x = ' + f(px) + ': ' + f(px) + ' − ' + par(h) + '.', px - h, 'Знаменатель не должен быть равен нулю.', 'Знаменатель равен ' + f(px - h) + '.', 'domain'),
      S('Найди k: ' + par(py - b) + ' · ' + par(px - h) + '.', coeff, 'Умножаем обе части равенства на знаменатель.', 'k = ' + f(coeff) + '.', 'coefficient'),
      S('Подставь новое x = ' + f(target) + ': ' + par(coeff) + '/(' + par(target) + ' − ' + par(h) + ')' + add(b) + '.', answer, 'Сначала вычисли ненулевой знаменатель.', 'y = ' + f(answer) + '.', 'target')
    ], answer, 'x ≠ ' + f(h) + '. По точке A: k = (' + par(py) + ' − ' + par(b) + ') · (' + par(px) + ' − ' + par(h) + ') = ' + f(coeff) + '. При x = ' + f(target) + ': y = ' + f(answer) + '.', { kind: 'hyperbola-value', h, b, px, py, target });
  }
  function exponential(i, base, shift, target) {
    const py = base + shift, power = base ** target, answer = power + shift;
    return T('fn-explog-' + i, 'График y = aˣ' + add(shift) + ', где a > 0 и a ≠ 1, проходит через A(1; ' + f(py) + '). Найди y при x = ' + f(target) + '.', [
      S('При x = 1 имеем a¹ = a. Найди a = ' + f(py) + ' − ' + par(shift) + '.', base, 'Подставили координаты A в формулу и вычли сдвиг.', 'Основание a = ' + f(base) + '.', 'coefficient'),
      S('Вычисли ' + par(base) + ' в степени ' + f(target) + '.', power, 'Вычисляем степень до прибавления сдвига.', f(base) + ' в степени ' + f(target) + ' равно ' + f(power) + '.', 'target'),
      S('Прибавь сдвиг ' + f(shift) + '.', answer, 'Завершаем подстановку в исходную функцию.', 'y = ' + f(answer) + '.', 'target')
    ], answer, 'По точке A: a = ' + f(py) + ' − ' + par(shift) + ' = ' + f(base) + '. y(' + f(target) + ') = ' + f(power) + add(shift) + ' = ' + f(answer) + '.', { kind: 'exponential-value', base, shift, target, px: 1, py });
  }
  function logarithm(i, base, shift, exponent) {
    const px = base * base, py = 2 + shift, target = base ** exponent, answer = exponent + shift;
    return T('fn-explog-' + i, 'График y = logₐ x' + add(shift) + ', где a > 1, проходит через A(' + f(px) + '; ' + f(py) + '). Найди y при x = ' + f(target) + '.', [
      S('Подставили A. Найди logₐ ' + f(px) + ' = ' + f(py) + ' − ' + par(shift) + '.', 2, 'Сначала убираем число, прибавленное к логарифму.', 'logₐ ' + f(px) + ' = 2.', 'point'),
      S('По определению логарифма a² = ' + f(px) + '. Найди положительное a.', base, 'Нужен положительный квадратный корень. По условию a > 1.', 'a = ' + f(base) + '.', 'coefficient'),
      S('В какую степень нужно возвести ' + f(base) + ', чтобы получить ' + f(target) + '?', exponent, 'Это значение log с основанием ' + f(base) + ' от числа ' + f(target) + '.', 'logₐ ' + f(target) + ' = ' + f(exponent) + '.', 'target'),
      S('Прибавь сдвиг ' + f(shift) + '.', answer, 'Логарифм вычислили. Теперь завершаем исходную формулу.', 'y = ' + f(answer) + '.', 'target')
    ], answer, 'Из точки A: logₐ ' + f(px) + ' = 2, значит a² = ' + f(px) + ' и a = ' + f(base) + '. Число ' + f(target) + ' равно ' + f(base) + ' в степени ' + f(exponent) + '. Поэтому y = ' + f(exponent) + add(shift) + ' = ' + f(answer) + '.', { kind: 'logarithm-value', base, shift, target, px, py });
  }

  function graphReading(i, scale, a, marked) {
    const decrease = marked.filter(x => scale * (3 * x * x - 3 * a * a) < 0), increase = marked.filter(x => scale * (3 * x * x - 3 * a * a) > 0);
    const leftCount = decrease.filter(x => x < 0).length, rightCount = decrease.filter(x => x >= 0).length;
    return T('calc-graph-' + i, 'На рисунке дан график функции y = f(x). Отмечены точки с абсциссами ' + marked.map(f).join('; ') + '. В скольких из этих точек f′(x) < 0?', [
      S('Посмотри на отмеченные точки слева от нуля. В скольких из них график идёт вниз при движении вправо?', leftCount, 'Нужен наклон самого графика. Ниже или выше оси он находится — не важно.', 'Слева от нуля подходящих точек: ' + leftCount + '.', 'decrease'),
      S('Теперь посмотри на отмеченные точки с x ≥ 0. В скольких из них график идёт вниз при движении вправо?', rightCount, 'В точке с горизонтальной касательной производная равна нулю. Такую точку не считаем.', 'Среди точек с x ≥ 0 подходят: ' + rightCount + '.', 'decrease'),
      S('Сложи два количества: ' + leftCount + ' + ' + rightCount + '.', decrease.length, 'Считаем отмеченные точки, а не промежутки.', 'Отрицательная производная в ' + decrease.length + ' отмеченных точках.', 'count')
    ], decrease.length, 'f′(x) < 0 там, где график f(x) идёт вниз при движении слева направо. Подходят x = ' + (decrease.length ? decrease.map(f).join('; ') : 'нет таких отмеченных точек') + '. Точки с горизонтальной касательной не входят. Ответ: ' + decrease.length + '.',
      { kind: 'graph-negative-count', scale, a, marked, increasingCount: increase.length });
  }
  function integralLine(i, slope, intercept, left, right) {
    const F = x => slope * x * x / 2 + intercept * x, hi = F(right), lo = F(left), answer = hi - lo;
    return T('calc-integral-' + i, 'Найди площадь фигуры между графиком y = ' + f(slope) + 'x' + add(intercept) + ', осью x и прямыми x = ' + f(left) + ', x = ' + f(right) + '. На этом отрезке график выше оси x.', [
      S('Первообразная: F(x) = ' + f(slope / 2) + 'x²' + (intercept ? add(intercept) + 'x' : '') + '. Найди F(' + f(right) + ').', hi, 'Первообразная для kx — kx²/2, для числа b — bx. Подставь правый конец.', 'F(' + f(right) + ') = ' + f(hi) + '.', 'right-end'),
      S('В ту же первообразную подставь левый конец. Найди F(' + f(left) + ').', lo, 'Не пропускаем левую границу, даже когда она равна нулю.', 'F(' + f(left) + ') = ' + f(lo) + '.', 'left-end'),
      S('Вычти: F(' + f(right) + ') − F(' + f(left) + ') = ' + par(hi) + ' − ' + par(lo) + '.', answer, 'График выше оси: площадь равна интегралу, то есть разности значений первообразной.', 'Площадь равна ' + f(answer) + '.', 'area')
    ], answer, 'Первообразная F(x) = ' + f(slope / 2) + 'x²' + (intercept ? add(intercept) + 'x' : '') + '. Площадь: F(' + f(right) + ') − F(' + f(left) + ') = ' + par(hi) + ' − ' + par(lo) + ' = ' + f(answer) + '.', { kind: 'integral-line', slope, intercept, left, right });
  }
  function crossingArea(i, slope, zero, left, right) {
    const leftArea = Math.abs(slope) * (zero - left) ** 2 / 2, rightArea = Math.abs(slope) * (right - zero) ** 2 / 2;
    return T('calc-integral-' + i, 'Найди площадь фигуры между графиком y = ' + (slope === 1 ? '' : f(slope)) + '(x' + add(-zero) + '), осью x и прямыми x = ' + f(left) + ', x = ' + f(right) + '. График пересекает ось x.', [
      S('При каком x выражение в скобках равно нулю?', zero, 'Это место пересечения с осью x. Здесь разделим фигуру на две части.', 'График пересекает ось при x = ' + f(zero) + '.', 'zero'),
      S('Слева получился треугольник. Основание ' + f(zero - left) + ', высота ' + f(Math.abs(slope * (left - zero))) + '. Найди его площадь.', leftArea, 'Площадь треугольника — основание × высота : 2. Высота — положительная длина.', 'Площадь слева: ' + f(leftArea) + '.', 'left-area'),
      S('Справа треугольник с основанием ' + f(right - zero) + ' и высотой ' + f(Math.abs(slope * (right - zero))) + '. Найди его площадь.', rightArea, 'Снова умножаем основание на высоту и делим на 2.', 'Площадь справа: ' + f(rightArea) + '.', 'right-area'),
      S('Сложи две положительные площади.', leftArea + rightArea, 'Нужна площадь всей фигуры. Части по разные стороны оси не вычитаем.', 'Общая площадь равна ' + f(leftArea + rightArea) + '.', 'area')
    ], leftArea + rightArea, 'Делим в точке x = ' + f(zero) + '. Площади двух треугольников: ' + f(leftArea) + ' и ' + f(rightArea) + '. Складываем: ' + f(leftArea + rightArea) + '. Обычный интеграл через обе части учитывал бы знак и не дал бы площадь всей фигуры.', { kind: 'integral-crossing', slope, zero, left, right });
  }
  function primitive(i, slope, intercept, x0, y0, target) {
    const P = x => slope * x * x / 2 + intercept * x, constant = y0 - P(x0), answer = P(target) + constant;
    return T('calc-integral-' + i, 'F — первообразная функции f(x) = ' + f(slope) + 'x' + add(intercept) + '. Известно, что F(' + f(x0) + ') = ' + f(y0) + '. Найди F(' + f(target) + ').', [
      S('F(x) = ' + f(slope / 2) + 'x²' + (intercept ? add(intercept) + 'x' : '') + ' + C. Подставь x = ' + f(x0) + ' и вычисли часть без C.', P(x0), 'Первообразная — функция, производная которой равна f(x). Постоянная C пока неизвестна.', 'Получили F(' + f(x0) + ') = ' + f(P(x0)) + ' + C.', 'constant'),
      S('По условию F(' + f(x0) + ') = ' + f(y0) + '. Найди C = ' + f(y0) + ' − ' + par(P(x0)) + '.', constant, 'Приравниваем выражение известному значению.', 'C = ' + f(constant) + '.', 'constant'),
      S('Подставь x = ' + f(target) + ' в часть без C.', P(target), 'Сначала вычисляем ' + f(slope / 2) + 'x²' + (intercept ? add(intercept) + 'x' : '') + '.', 'Часть без C равна ' + f(P(target)) + '.', 'target'),
      S('Прибавь найденное C = ' + f(constant) + '.', answer, 'Постоянная C та же для всех x этой первообразной.', 'F(' + f(target) + ') = ' + f(answer) + '.', 'target')
    ], answer, 'F(x) = ' + f(slope / 2) + 'x²' + (intercept ? add(intercept) + 'x' : '') + ' + C. Из F(' + f(x0) + ') = ' + f(y0) + ' получаем C = ' + f(constant) + '. Затем F(' + f(target) + ') = ' + f(answer) + '.', { kind: 'primitive-value', slope, intercept, x0, y0, target });
  }

  const lessons = [
    L('calc-tangent', 9, 'Касательная: найти производную по рисунку', 'Два движения: по горизонтали и по вертикали.',
      '<p>Производная f′(x₀) равна наклону касательной в этой точке.</p><p>Возьми две точки <b>на касательной</b>. Найди изменение y и раздели его на изменение x: <b>f′(x₀) = (y₂ − y₁)/(x₂ − x₁)</b>.</p><p>В обеих разностях порядок одинаков: вторая точка минус первая.</p>',
      'Касательная — прямая. Точки для вычисления берём на ней, а не в произвольных местах кривой.',
      'В записи A(2; 5) первое число — x, второе — y. При движении вправо Δx положительно.',
      [tangent(1, [-1, -1], [2, 5], 1, .45), tangent(2, [-2, 4], [2, 0], 0, -.35), tangent(3, [0, 1], [4, 3], 2, .3), tangent(4, [-2, -3], [1, 6], 0, .5), tangent(5, [-1, 4], [3, 2], 1, -.3), tangent(6, [-2, 3], [3, 3], 1, .4)]),
    L('calc-sign', 9, 'График производной: где максимум и минимум', 'Не путать график функции с графиком её производной.',
      '<p>Сначала прочитай подпись: здесь дан <b>y = f′(x)</b>.</p><p>Выше оси x: f′ > 0, сама функция возрастает. Ниже оси x: f′ < 0, сама функция убывает.</p><p><b>+ → −</b> означает максимум. <b>− → +</b> означает минимум. Если знак не сменился, экстремума нет.</p>',
      'Нуль производной — только кандидат. Для экстремума проверяем знак слева и справа.',
      'Абсцисса — координата x. Экстремум бывает максимумом или минимумом.',
      [signs(1, -2, 3, .3, 'minimum'), signs(2, -3, 1, -.4, 'minimum'), touch(3, 2, .35), signs(4, -1, 4, .25, 'maximum'), signs(5, -4, 2, -.2, 'maximum'), touch(6, -1, -.3)]),
    L('calc-graph', 9, 'График функции: где производная отрицательна', 'Смотрим, куда идёт график, а не где он расположен.',
      '<p>Здесь дан график <b>самой функции y = f(x)</b>.</p><p>Двигаемся слева направо. График идёт вверх — производная положительна. Вниз — отрицательна. Касательная горизонтальна — производная равна нулю.</p><p>Функция может быть выше оси x и при этом убывать. Высота графика и знак производной — разные вещи.</p>',
      'Сначала прочитай подпись графика: f или f′. Для них действуют разные способы чтения.',
      'Отрицательная производная означает отрицательный наклон касательной, то есть движение графика вниз при росте x.',
      [graphReading(1, .2, 2, [-3, -2, -1, 0, 1, 2, 3]), graphReading(2, -.15, 2, [-3, -1, 0, 1, 3]), graphReading(3, .08, 3, [-4, -3, -2, 0, 2, 3, 4]), graphReading(4, -.1, 3, [-4, -3, -1, 1, 3, 4]), graphReading(5, .3, 1, [-2, -1, -.5, 0, .5, 1, 2]), graphReading(6, -.25, 1, [-2, -1, 0, 1, 2])]),
    L('calc-value', 9, 'Производная по формуле: подставить число', 'Сначала производная, потом значение x.',
      '<p>Для степеней: <b>(x²)′ = 2x</b>, <b>(x³)′ = 3x²</b>. Для числа: <b>(c)′ = 0</b>. Постоянный множитель сохраняется.</p><p>Ещё четыре правила: <b>(1/x)′ = −1/x²</b>; <b>(eˣ)′ = eˣ</b>; <b>(ln x)′ = 1/x</b> при x > 0; <b>(√x)′ = 1/(2√x)</b> при x > 0.</p><p>Чтобы найти f′(2), сначала запиши производную. Только потом подставь 2.</p>',
      'Значение функции f(x) и значение её производной f′(x) — разные числа.',
      'x² = x · x. В выражении −3x² сначала возводим x в квадрат, затем умножаем на −3.',
      [derivative(1, 'quadratic', { a: 2, b: -3, c: 1, x: 2 }), derivative(2, 'cubic', { a: 1, b: -5, x: -2 }), derivative(3, 'reciprocal', { a: 12, x: -2 }), derivative(4, 'quadratic', { a: -3, b: 4, c: 2, x: -1 }), derivative(5, 'cubic', { a: 2, b: -3, x: 1 }), derivative(6, 'reciprocal', { a: -18, x: 3 })]),
    L('calc-special', 9, 'Производная: экспонента, логарифм и корень', 'Три правила и подстановка числа.',
      '<p><b>(eˣ)′ = eˣ</b>. Число e — основание натурального логарифма. Здесь достаточно знать: e⁰ = 1.</p><p><b>(ln x)′ = 1/x</b> при x > 0. Запись ln x означает натуральный логарифм.</p><p><b>(√x)′ = 1/(2√x)</b> при x > 0. Постоянный множитель перед функцией сохраняется.</p>',
      'Проверь, можно ли подставить данное x. Для ln x и формулы производной √x здесь нужны положительные x.',
      '√9 = 3. Число в нулевой степени равно 1. Для a/x сначала определяем ненулевой знаменатель.',
      [derivative(1, 'exponential', { a: 4 }, 'calc-special'), derivative(2, 'logarithm', { a: 6, x: 3 }, 'calc-special'), derivative(3, 'root', { a: 8, x: 4 }, 'calc-special'), derivative(4, 'exponential', { a: -3 }, 'calc-special'), derivative(5, 'logarithm', { a: 10, x: 4 }, 'calc-special'), derivative(6, 'root', { a: 12, x: 9 }, 'calc-special')]),
    L('calc-extreme', 9, 'Наибольшее и наименьшее значение на отрезке', 'Проверяем точки внутри и оба конца.',
      '<p>Найди, где f′(x) = 0. Оставь только точки внутри данного отрезка.</p><p>Вычисли <b>саму функцию f(x)</b> в этих точках и на <b>обоих концах отрезка</b>. Сравни значения.</p><p>Если спрашивают значение функции, в ответ идёт <b>y</b>. Если спрашивают точку максимума или минимума, нужен <b>x</b>. Здесь спрашивается значение.</p>',
      'Наибольшее значение может оказаться на конце отрезка. Производная на конце не обязана быть равна нулю.',
      'Отрезок [a; b] включает оба конца: a и b. Точка за пределами отрезка не участвует в сравнении.',
      [extremum(1, 1, 2, 3, 0, 5, 'min'), extremum(2, -1, 1, 8, -2, 3, 'min'), cubicExtreme(3, 2, 0, 3, 'min'), extremum(4, 2, -1, -3, -3, 2, 'max'), extremum(5, 1, 4, 2, -1, 2, 'min'), cubicExtreme(6, 1, 0, 3, 'max')]),
    L('calc-integral', 9, 'Первообразная и площадь под графиком', 'Что нужно найти: значение функции или площадь?',
      '<p><b>F — первообразная f</b>, если F′ = f. Например, для f(x) = 2x подходит F(x) = x² + C.</p><p>Разность <b>F(b) − F(a)</b> — интеграл f от a до b. Если график выше оси x, это площадь под ним.</p><p>Если часть графика ниже оси, её интеграл отрицателен, но площадь положительна. Делим фигуру в местах пересечения оси и складываем площади частей.</p>',
      'Площадь не бывает отрицательной. Интеграл и площадь совпадают только при подходящем знаке функции.',
      'Площадь треугольника: основание × высота : 2. Производная C равна нулю, поэтому первообразных много.',
      [integralLine(1, 2, 1, 0, 3), crossingArea(2, 1, 2, 0, 4), primitive(3, 2, 3, 1, 5, 2), integralLine(4, 3, -2, 1, 3), crossingArea(5, 2, -1, -3, 2), primitive(6, 4, -1, 0, 3, 2)]),
    L('fn-line', 12, 'Прямая: восстановить формулу по двум точкам', 'Наклон, сдвиг, затем нужное значение.',
      '<p>Формула прямой: <b>y = kx + b</b>. По двум точкам находим <b>k = (y₂ − y₁)/(x₂ − x₁)</b>.</p><p>Подставляем любую известную точку и находим b: <b>b = y − kx</b>. Теперь можно вычислить y при новом x.</p>',
      'Обе координаты берём от одной и той же точки. В двух разностях не меняем порядок.',
      'Точка A(2; 5) означает: когда x = 2, значение y равно 5.',
      [line(1, [0, 1], [2, 5], 3), line(2, [-1, 5], [2, -1], 3), line(3, [1, 3], [5, 5], -1), line(4, [-2, -5], [1, 4], 2), line(5, [-2, 4], [2, 2], 4), line(6, [-1, 2], [3, 2], 5)]),
    L('fn-parabola', 12, 'Парабола: вершина и ещё одна точка', 'Вершина уже задаёт два числа в формуле.',
      '<p>Если вершина — (h; k), удобно записать <b>y = a(x − h)² + k</b>.</p><p>Подставь координаты ещё одной точки и найди a. Затем подставь нужное x.</p><p>При a > 0 ветви направлены вверх. При a < 0 — вниз.</p>',
      'Координата вершины h входит в скобку со знаком минус. Например, h = −2 даёт (x + 2).',
      'Квадрат относится ко всей скобке: (3 − 1)² = 4.',
      [parabola(1, 1, 2, 3, 10, 0), parabola(2, -2, 3, 0, -1, -1), parabola(3, 0, -1, 2, 1, 4), parabola(4, 2, -3, 3, 0, 0), parabola(5, -1, 5, 1, -3, -2), parabola(6, 3, 1, 1, 2, 5)]),
    L('fn-hyperbola', 12, 'Гипербола: подставить известную точку', 'Следим за знаменателем и сдвигами.',
      '<p>В формуле <b>y = k/(x − h) + b</b> нельзя брать x = h: знаменатель будет нулём.</p><p>Известная точка даёт <b>k = (y − b)(x − h)</b>. После этого вычисляем y при нужном x.</p><p>Пунктирные прямые x = h и y = b — асимптоты. График приближается к ним.</p>',
      'Сдвиг b находится вне дроби. Сначала делим, затем прибавляем b.',
      'На ноль делить нельзя. 6/(5 − 2) + 1 = 6/3 + 1 = 3.',
      [hyperbola(1, 0, 0, 2, 6, 3), hyperbola(2, 1, 2, 3, 5, 4), hyperbola(3, -2, -1, 0, -4, 1), hyperbola(4, 0, 3, -2, -1, 4), hyperbola(5, 2, -2, 5, 0, 1), hyperbola(6, -1, 1, 1, -3, -3)]),
    L('fn-explog', 12, 'Показательный и логарифмический графики', 'По точке узнаём основание. Затем считаем.',
      '<p>У показательной функции <b>y = aˣ + b</b> точка с x = 1 удобна: a¹ = a.</p><p>У логарифма <b>logₐ x = n</b> означает <b>aⁿ = x</b>. Например, log₂ 8 = 3, потому что 2³ = 8.</p><p>Основание положительно и не равно 1. В логарифмической функции x должно быть положительным.</p>',
      'Сначала убираем сдвиг, затем работаем со степенью или логарифмом.',
      '2³ = 2 · 2 · 2 = 8. При отрицательной степени: 2⁻¹ = 1/2.',
      [exponential(1, 2, 1, 3), logarithm(2, 2, -1, 3), exponential(3, 3, -2, 2), logarithm(4, 3, 2, 1), exponential(5, .5, 2, -2), logarithm(6, 2, 3, 4)])
  ];
  root.ProfileLessons = (root.ProfileLessons || []).concat(lessons);
  if (typeof module !== 'undefined' && module.exports) module.exports = lessons;
})(globalThis);

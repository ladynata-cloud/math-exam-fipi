// Small deterministic grammars for the existing assistant topics. No eval,
// floating-point arithmetic, variable denominators or nonlinear expressions.
const abs = n => n < 0n ? -n : n;
const LIMIT = 10n ** 24n;
const gcd = (a, b) => { a = abs(a); b = abs(b); while (b) [a, b] = [b, a % b]; return a; };
function rat(n, d = 1n) {
  if (!d) throw new RangeError('ZERO_DENOMINATOR');
  if (d < 0n) [n, d] = [-n, -d];
  const g = gcd(n, d); n /= g; d /= g;
  if (abs(n) > LIMIT || d > LIMIT) throw new RangeError('ARITHMETIC_BOUND');
  return { n, d };
}
const add = (a, b) => rat(a.n * b.d + b.n * a.d, a.d * b.d);
const neg = a => rat(-a.n, a.d);
const sub = (a, b) => add(a, neg(b));
const mul = (a, b) => rat(a.n * b.n, a.d * b.d);
const div = (a, b) => rat(a.n * b.d, a.d * b.n);
const equal = (a, b) => a.n === b.n && a.d === b.d;
const fmt = a => a.d === 1n ? String(a.n) : `${a.n}/${a.d}`;
const shown = a => a.n < 0n || a.d !== 1n ? `(${fmt(a)})` : fmt(a);
const zero = () => rat(0n);
const clean = value => value.trim().toLowerCase().replaceAll('ё', 'е').replace(/[−–—]/g, '-');
const decimal = value => {
  const negative = value.startsWith('-');
  const [whole, tail = ''] = value.replace(/^[+-]/, '').replace(',', '.').split('.');
  return rat(BigInt(whole + tail) * (negative ? -1n : 1n), 10n ** BigInt(tail.length));
};

function tokens(text) {
  if (text.length > 240 || /\d\s+\d/.test(text)) return null;
  const result = []; let offset = 0;
  while (offset < text.length) {
    const match = /^(?:([ \t\u00a0\u202f]+)|(\d{1,6}(?:[.,]\d{1,6})?)|([x()+*/·=-]))/.exec(text.slice(offset));
    if (!match) return null;
    if (!match[1]) result.push(match[2] || match[3]);
    offset += match[0].length;
    if (result.length > 80) return null;
  }
  return result;
}

// Affine expressions carry an exact coefficient of x and a constant.
function expression(list) {
  let at = 0, depth = 0;
  const affine = b => ({ a: zero(), b });
  const combine = (u, v, operation) => ({ a: operation(u.a, v.a), b: operation(u.b, v.b) });
  const scale = (u, k) => ({ a: mul(u.a, k), b: mul(u.b, k) });
  function factor() {
    if (++depth > 8) throw new RangeError('DEPTH_BOUND');
    const token = list[at++]; let value;
    if (token === '+' || token === '-') {
      value = factor(); if (token === '-') value = scale(value, rat(-1n));
    } else if (token === 'x') value = { a: rat(1n), b: zero() };
    else if (token === '(') {
      value = sum(); if (list[at++] !== ')') throw new TypeError('MISSING_PAREN');
    } else if (token && /^\d/.test(token)) value = affine(decimal(token));
    else throw new TypeError('INVALID_FACTOR');
    depth--; return value;
  }
  function product() {
    let value = factor(), previousDivision = false;
    while (true) {
      let op = list[at];
      const implicit = (op === 'x' || op === '(') && /^(?:\d|\))/.test(list[at - 1] || '');
      if (implicit) {
        // 1/2x is visually ambiguous. Write (1/2)x or 1/2*x instead.
        if (previousDivision) throw new TypeError('AMBIGUOUS_DIVISION');
        op = '*';
      } else if (op === '*' || op === '·' || op === '/') at++;
      else break;
      const right = factor();
      if (op === '/') {
        if (right.a.n) throw new TypeError('VARIABLE_DENOMINATOR');
        value = { a: div(value.a, right.b), b: div(value.b, right.b) };
      } else {
        if (value.a.n && right.a.n) throw new TypeError('NONLINEAR');
        value = right.a.n ? scale(right, value.b) : scale(value, right.b);
      }
      previousDivision = op === '/';
    }
    return value;
  }
  function sum() {
    let value = product();
    while (list[at] === '+' || list[at] === '-') {
      const op = list[at++]; value = combine(value, product(), op === '+' ? add : sub);
    }
    return value;
  }
  const value = sum(); if (at !== list.length) throw new TypeError('TRAILING_TOKENS');
  return value;
}

export function parseLinearEquation(question) {
  if (typeof question !== 'string') return null;
  const text = clean(question).replace(/^(?:реши(?:те|ть)?\s+)?(?:уравнение\s+)?/, '').replaceAll('х', 'x').replace(/\.$/, '').trim();
  const list = tokens(text);
  if (!list || list.filter(t => t === '=').length !== 1) return null;
  const index = list.indexOf('=');
  try {
    const left = expression(list.slice(0, index)), right = expression(list.slice(index + 1));
    if ([left.a, right.a].some(value => abs(value.n) > 10000n * value.d)) return null;
    const coefficient = sub(left.a, right.a), constant = sub(right.b, left.b);
    const expected = coefficient.n ? div(constant, coefficient) : null;
    if (expected && (abs(expected.n) > 999999999999n || expected.d > 999999999999n)) return null;
    return { left, right, coefficient, constant,
      kind: coefficient.n ? 'one' : constant.n ? 'none' : 'all',
      expected };
  } catch { return null; }
}

export function checkLinearStep(question, attempt) {
  const original = parseLinearEquation(question);
  const step = parseLinearEquation(attempt.replace(/^ответ\s*:\s*/i, ''));
  if (!original || !step) return 'Такую запись шага пока не проверяю. Запиши одно линейное равенство с x или числовой ответ.';
  const same = original.kind === step.kind && (original.kind !== 'one' || equal(original.expected, step.expected));
  return same
    ? 'Этот шаг сохраняет решения исходного уравнения. Объясни, какое одинаковое действие выполнено в обеих частях, и продолжай.'
    : 'Этот шаг изменил решения исходного уравнения. Проверь знаки и одинаковое действие в обеих частях; вернись к предыдущему равенству.';
}

export function solveExtendedLinear(question) {
  const parsed = parseLinearEquation(question); if (!parsed) return null;
  const { left, right, coefficient: a, constant: b, expected, kind } = parsed;
  const form = side => `${shown(side.a)} · x + ${shown(side.b)}`;
  const final = kind === 'one' ? `Ответ: x = ${fmt(expected)}.` : kind === 'all'
    ? 'Ответ: любое действительное число.' : 'Ответ: решений нет.';
  return {
    title: 'Решаем уравнение по шагам',
    text: 'Упростим обе части и будем выполнять с ними одинаковые действия.',
    hints: ['Раскрой скобки: множитель перед скобкой относится к каждому слагаемому внутри. Затем приведи подобные слагаемые.',
      'Убери слагаемое с x из правой части: вычти его из обеих частей.',
      'Убери отдельное число слева одинаковым действием в обеих частях.',
      'Если множитель перед x не ноль, раздели на него обе части. Если он ноль, сравни оставшиеся числа.',
      'Подставь найденное число в исходное уравнение. При нулевом множителе проверь, равны ли оставшиеся числа.'],
    shortHints: ['Раскрой скобки и собери подобные слагаемые.', 'В обеих частях вычти слагаемое с x, стоящее справа.',
      'Убери отдельное число слева обратным действием в обеих частях.', 'Дели только на ненулевой множитель перед x.',
      'Проверь ответ в исходном уравнении.'],
    steps: [`После раскрытия скобок и приведения подобных: ${form(left)} = ${form(right)}.`,
      `В обеих частях вычитаем ${shown(right.a)} · x: ${shown(a)} · x + ${shown(left.b)} = ${fmt(right.b)}.`,
      `В обеих частях вычитаем ${shown(left.b)}: ${shown(a)} · x = ${fmt(b)}.`,
      kind === 'one' ? `Делим обе части на ненулевое ${shown(a)}: x = ${shown(b)} / ${shown(a)}.`
        : kind === 'all' ? 'Осталось 0 = 0: равенство верно при любом x.' : `Осталось 0 = ${fmt(b)}: равенство невозможно.`, final],
    check: kind === 'one' ? `Точная подстановка в обе части: ${fmt(add(mul(left.a, expected), left.b))} = ${fmt(add(mul(right.a, expected), right.b))}.`
      : 'На ноль не делим. Равенство оставшихся чисел определяет, подходят все x или ни одного.',
    expected
  };
}

const NUMBER = '[+-]?\\d{1,6}(?:[.,]\\d{1,6})?';
const PERCENT = '\\d{1,4}(?:[.,]\\d{1,4})?';
export function solvePercentProblem(question) {
  if (typeof question !== 'string' || question.length > 240) return null;
  const text = clean(question).replace(/[.?!]$/, '').trim();
  let type, a, b;
  let match = new RegExp(`^(?:найди(?:те)?\\s+число,?\\s+)?(${PERCENT})\\s*%\\s+(?:числа|которого)\\s+(?:равны|равно|составляют|составляет)\\s+(${NUMBER})$`).exec(text);
  if (match) { type = 'whole'; a = decimal(match[1]); b = decimal(match[2]); }
  if (!match) {
    match = new RegExp(`^(?:сколько\\s+процентов\\s+составляет\\s+)?(${NUMBER})\\s+от\\s+(${NUMBER})(?:\\s+в\\s+процентах)?$`).exec(text);
    if (match && (/^сколько/.test(text) || /в процентах$/.test(text))) { type = 'ratio'; a = decimal(match[1]); b = decimal(match[2]); }
  }
  if (!type) {
    match = new RegExp(`^(увеличь(?:те)?|уменьши(?:те)?)\\s+(${NUMBER})\\s+на\\s+(${PERCENT})\\s*%$`).exec(text);
    if (match) { type = match[1].startsWith('увелич') ? 'increase' : 'decrease'; a = decimal(match[2]); b = decimal(match[3]); }
  }
  if (!type) return null;
  const hundred = rat(100n), forbidden = type === 'whole' ? !a.n : type === 'ratio' && !b.n;
  if (forbidden) return {
    title: 'Сначала проверим исходные данные', text: 'Для этой записи обычное деление на процент или исходное число невозможно.',
    hints: ['Проверь, какое число здесь равно нулю: делить на него нельзя.', 'Сравни нулевой процент или нулевое целое с известными данными.',
      'Не заменяй ноль другим числом ради вычисления.', 'Проверь, можно ли определить единственный ответ из этих данных.', 'Если данных недостаточно или они противоречат друг другу, уточни условие.'],
    shortHints: ['Найди ноль в условии.', 'На ноль делить нельзя.', 'Проверь известные данные.', 'Не придумывай недостающее число.', 'Уточни условие.'],
    steps: [type === 'whole' ? b.n ? '0% любого числа равны 0. Указанное ненулевое значение невозможно.' : '0% любого числа равны 0. Однозначно восстановить число нельзя.'
      : 'Процентное отношение к нулю не определено: в формуле получилось бы деление на 0.'],
    check: 'Уточни исходные данные; не подставляй выдуманное значение.', expected: null
  };
  const expected = type === 'whole' ? div(mul(b, hundred), a) : type === 'ratio' ? mul(div(a, b), hundred)
    : mul(a, div(type === 'increase' ? add(hundred, b) : sub(hundred, b), hundred));
  if (abs(expected.n) > 999999999999n || expected.d > 999999999999n) return null;
  const change = type === 'increase' || type === 'decrease';
  const hints = type === 'whole' ? ['Известна часть числа, а не всё число. Обозначь всё число за 100%.',
    'Раздели известную часть на количество процентов: получишь значение 1%.', 'Умножь значение 1% на 100.',
    'Запиши проверку: найденное число × проценты / 100.', 'Проверка должна вернуть указанную часть.']
    : type === 'ratio' ? ['Число после слова «от» — это целое, соответствующее 100%.',
      'Раздели сравниваемую часть на целое.', 'Умножь полученное отношение на 100.',
      'Запиши знак процента после результата.', 'Проверь: целое × найденные проценты / 100 возвращает часть.']
      : ['Исходное число соответствует 100%.', `Для ${type === 'increase' ? 'увеличения прибавь проценты к 100' : 'уменьшения вычти проценты из 100'}.`,
        'Раздели полученное количество процентов на 100.', 'Умножь исходное число на этот коэффициент.',
        'Проверь изменение отдельно: найди процент от исходного числа и прибавь или вычти его.'];
  const steps = type === 'whole' ? [`Известно: ${fmt(a)}% равны ${fmt(b)}.`, `Значение 1%: ${shown(b)} / ${shown(a)} = ${fmt(div(b, a))}.`,
    `Значение 100%: ${fmt(div(b, a))} · 100.`, `Ответ: ${fmt(expected)}.`]
    : type === 'ratio' ? [`За 100% принимаем ${fmt(b)}.`, `Отношение части к целому: ${shown(a)} / ${shown(b)} = ${fmt(div(a, b))}.`,
      `Умножаем отношение на 100. Ответ: ${fmt(expected)}%.`]
      : [`Исходное число ${fmt(a)} соответствует 100%.`, `${type === 'increase' ? 'Прибавляем' : 'Вычитаем'} ${fmt(b)}%: остаётся ${fmt(type === 'increase' ? add(hundred, b) : sub(hundred, b))}% от исходного.`,
        `Умножаем ${shown(a)} на ${shown(div(type === 'increase' ? add(hundred, b) : sub(hundred, b), hundred))}.`, `Ответ: ${fmt(expected)}.`];
  const shortHints = type === 'whole' ? ['Всё число — это 100%.', 'Раздели часть на число процентов: найди 1%.',
    'Умножь значение 1% на 100.', 'Найди указанный процент от своего ответа.', 'Должна получиться известная часть.']
    : type === 'ratio' ? ['Целое стоит после слова «от».', 'Раздели часть на целое.', 'Умножь на 100.',
      'Добавь знак %.', 'Найди этот процент от целого и проверь часть.']
      : ['Начни со 100%.', type === 'increase' ? 'Прибавь проценты к 100.' : 'Вычти проценты из 100.',
        'Раздели на 100.', 'Умножь исходное число на полученный коэффициент.', 'Проверь, на сколько изменилось число.'];
  return { title: type === 'whole' ? 'Находим число по его проценту' : type === 'ratio' ? 'Находим процентное отношение'
    : type === 'increase' ? 'Увеличиваем число на процент' : 'Уменьшаем число на процент',
    text: change ? 'Процент изменения считаем от исходного числа.' : 'Сначала определим, какое число соответствует 100%.',
    hints, shortHints, steps, ...(type === 'ratio' ? { answerUnit: 'percent' } : {}),
    check: type === 'whole' ? `Проверка: ${shown(expected)} · ${shown(a)} / 100 = ${fmt(b)}.`
      : type === 'ratio' ? `Проверка: ${shown(b)} · ${shown(expected)} / 100 = ${fmt(a)}.`
        : 'Найди указанную часть исходного числа и сравни её с разницей между исходным и новым значением.', expected };
}

// A bounded, original mathematics tutor, not a natural-language or picture
// interpreter. Every accepted question must match a complete grammar below.
// Unknown extra premises, different units, missing data and contradictory
// geometry deliberately fall back to the cabinet's needs-teacher response.
const NUMBER = '(?:0|[1-9]\\d{0,4})(?:[.,]\\d{1,3})?';
const INTEGER = '(?:0|[1-9]\\d{0,4})';
const FIND = '(?:найди|найдите)';
const END = '[.!?]?';
const TOPICS = new Set(['oge-triangles', 'oge-circle', 'oge-quadrilaterals', 'oge-grid', 'oge-statements']);

export const geometryExamples = Object.freeze({
  'oge-triangles': 'В треугольнике два угла равны 47° и 68°. Найди третий угол.',
  'oge-circle': 'Квадрат описан около окружности радиуса 7. Найди площадь квадрата.',
  'oge-quadrilaterals': 'Основания трапеции равны 8 и 14. Диагональ делит среднюю линию на два отрезка. Найди больший отрезок.',
  'oge-grid': 'Между точками по горизонтали 3 клетки, по вертикали 4 клетки. Сторона клетки равна 2. Найди расстояние между точками.',
  'oge-statements': 'Верно ли утверждение: диагонали любого прямоугольника равны?'
});

// Compatibility normalization would silently turn 2² into 22. Preserve the
// notation and only accept the explicitly supported, ordinary decimal grammar.
const normalize = value => value.normalize('NFC').toLowerCase().replaceAll('ё', 'е').replace(/\s+/gu, ' ').trim();
const match = (question, grammar) => new RegExp(`^${grammar}${END}$`, 'u').exec(question);
const abs = n => n < 0n ? -n : n;
function gcd(a, b) { a = abs(a); b = abs(b); while (b) [a, b] = [b, a % b]; return a; }
function rational(n, d = 1n) {
  if (d === 0n) throw new RangeError('GEOMETRY_ZERO_DENOMINATOR');
  if (d < 0n) [n, d] = [-n, -d];
  const g = gcd(n, d); return { n: n / g, d: d / g };
}
function number(text) {
  const [whole, tail = ''] = text.replace(',', '.').split('.');
  return rational(BigInt(whole + tail), 10n ** BigInt(tail.length));
}
const add = (a, b) => rational(a.n * b.d + b.n * a.d, a.d * b.d);
const sub = (a, b) => rational(a.n * b.d - b.n * a.d, a.d * b.d);
const mul = (a, b) => rational(a.n * b.n, a.d * b.d);
const half = a => rational(a.n, a.d * 2n);
const double = a => rational(a.n * 2n, a.d);
const square = a => mul(a, a);
const positive = (...values) => values.every(a => a.n > 0n);
const compare = (a, b) => a.n * b.d - b.n * a.d;
const equal = (a, b) => compare(a, b) === 0n;
const R180 = rational(180n), R360 = rational(360n);

// All numeric inputs are finite decimals. The operations used here retain
// exact rational values; no binary floating-point rounding is used in answers.
function show(value) {
  const negative = value.n < 0n, n = abs(value.n), whole = n / value.d;
  let remainder = n % value.d, digits = '', count = 0;
  while (remainder && count++ < 18) {
    remainder *= 10n; digits += String(remainder / value.d); remainder %= value.d;
  }
  if (remainder) return `${value.n}/${value.d}`;
  return `${negative ? '-' : ''}${whole}${digits ? ',' + digits : ''}`;
}
function integerSqrt(n) {
  if (n < 0n) throw new RangeError('GEOMETRY_NEGATIVE_ROOT');
  if (n < 2n) return n;
  let x = n, y = (x + 1n) / 2n;
  while (y < x) { x = y; y = (x + n / x) / 2n; }
  return x;
}
function root(value) {
  const n = integerSqrt(value.n), d = integerSqrt(value.d);
  if (n * n === value.n && d * d === value.d) return show(rational(n, d));
  return value.d === 1n ? `√${value.n}` : `√(${show(value)})`;
}
function result(title, text, hints, shorts, steps, answer, check, kind = 'number') {
  return { title, text, hints, shorts, steps: [...steps, `Ответ: ${answer}.`], check, answer, kind };
}

function angleSum(a, b) {
  const sum = add(a, b);
  if (!positive(a, b) || compare(sum, R180) >= 0n) return null;
  const answer = sub(R180, sum);
  return result('Третий угол треугольника', 'Сначала используем свойство трёх внутренних углов.',
    ['Выпиши два известных внутренних угла. Сумма всех трёх внутренних углов треугольника равна 180°.',
      `Сложи два известных угла: ${show(a)}° и ${show(b)}°.`,
      'Из 180° вычти полученную сумму. Так останется третий угол.',
      'Проверь свой результат: сумма трёх внутренних углов должна равняться 180°.'],
    ['Три внутренних угла вместе дают 180°.', 'Сложи два известных угла.', 'Вычти эту сумму из 180°.', 'Сложи все три угла для проверки.'],
    [`Сумма внутренних углов треугольника равна 180°.`,
      `Известные углы вместе: ${show(a)}° + ${show(b)}° = ${show(sum)}°.`,
      `Третий угол: 180° − ${show(sum)}° = ${show(answer)}°.`], show(answer) + '°',
    'Все три угла положительны и в сумме дают 180°.', 'angle');
}
function pythagoras(a, b, missingHypotenuse) {
  if (!positive(a, b) || (!missingHypotenuse && compare(a, b) <= 0n)) return null;
  const a2 = square(a), b2 = square(b), radicand = missingHypotenuse ? add(a2, b2) : sub(a2, b2);
  const answer = root(radicand);
  return result(missingHypotenuse ? 'Гипотенуза по двум катетам' : 'Катет по гипотенузе и другому катету',
    'Прямой угол указан в условии, поэтому можно применить теорему Пифагора.',
    ['Определи гипотенузу: она лежит напротив прямого угла. Две другие стороны — катеты.',
      missingHypotenuse ? 'Квадрат гипотенузы равен сумме квадратов катетов. Запиши это равенство.'
        : 'Квадрат неизвестного катета равен квадрату гипотенузы минус квадрат известного катета. Запиши это равенство.',
      `Возведи известные длины ${show(a)} и ${show(b)} в квадрат и выполни указанное действие.`,
      'Ты получил квадрат длины. Чтобы получить саму длину, извлеки положительный квадратный корень.'],
    ['Найди сторону напротив прямого угла.',
      missingHypotenuse ? 'Сложи квадраты катетов.' : 'Из квадрата гипотенузы вычти квадрат катета.',
      'Сначала выполни вычисление под корнем.', 'Длина — положительный квадратный корень.'],
    [missingHypotenuse ? 'По теореме Пифагора c² = a² + b².' : 'По теореме Пифагора b² = c² − a².',
      `${show(a)}² ${missingHypotenuse ? '+' : '−'} ${show(b)}² = ${show(a2)} ${missingHypotenuse ? '+' : '−'} ${show(b2)} = ${show(radicand)}.`,
      `Берём положительный квадратный корень: ${answer}.`], answer,
    'Подставь длины в теорему Пифагора. Гипотенуза должна быть больше каждого катета.');
}
function triangles(question) {
  let m = match(question, `(?:в треугольнике два угла равны|два угла треугольника равны) (${NUMBER})° и (${NUMBER})°[.;] ${FIND} третий угол`);
  if (m) return angleSum(number(m[1]), number(m[2]));
  m = match(question, `в треугольнике ([a-z]{3}) угол ([a-z]) равен (${NUMBER})°, (?:а )?угол ([a-z]) равен (${NUMBER})°[.;] ${FIND} угол ([a-z])`);
  if (m) {
    const vertices = [...m[1]], named = [m[2], m[4], m[6]];
    if (new Set(vertices).size !== 3 || new Set(named).size !== 3 || named.some(v => !vertices.includes(v))) return null;
    return angleSum(number(m[3]), number(m[5]));
  }
  m = match(question, `(?:катеты прямоугольного треугольника|в прямоугольном треугольнике катеты) равны (${NUMBER}) и (${NUMBER})[.;] ${FIND} гипотенузу`);
  if (m) return pythagoras(number(m[1]), number(m[2]), true);
  m = match(question, `(?:гипотенуза прямоугольного треугольника|в прямоугольном треугольнике гипотенуза) равна (${NUMBER}), (?:а )?один катет равен (${NUMBER})[.;] ${FIND} (?:второй|другой) катет`);
  if (m) return pythagoras(number(m[1]), number(m[2]), false);
  m = match(question, `в треугольнике ([a-z]{3}) угол ([a-z]) равен 90°, ([a-z]{2}) = (${NUMBER}), ([a-z]{2}) = (${NUMBER})[.;] ${FIND} ([a-z]{2})`);
  if (!m) return null;
  const vertices = [...m[1]], right = m[2], edges = [m[3], m[5], m[7]].map(edge => [...edge].sort().join(''));
  if (new Set(vertices).size !== 3 || !vertices.includes(right) || new Set(edges).size !== 3
    || edges.some(edge => edge[0] === edge[1] || [...edge].some(v => !vertices.includes(v)))) return null;
  const values = [number(m[4]), number(m[6])];
  if (!edges[2].includes(right)) return pythagoras(...values, true);
  const hypotenuse = edges.slice(0, 2).findIndex(edge => !edge.includes(right));
  return hypotenuse < 0 ? null : pythagoras(values[hypotenuse], values[1 - hypotenuse], false);
}

function squareCircle(radius, outside) {
  if (!positive(radius)) return null;
  const diameter = double(radius), area = mul(square(radius), rational(outside ? 4n : 2n));
  return result('Квадрат и окружность', 'Уточним, какой отрезок квадрата равен диаметру окружности.',
    [outside ? 'Окружность находится внутри квадрата и касается его сторон. Сторона квадрата равна диаметру окружности.'
      : 'Вершины квадрата лежат на окружности. Диагональ квадрата равна диаметру окружности.',
      `Диаметр вдвое больше радиуса. Умножь ${show(radius)} на 2.`,
      outside ? 'Площадь квадрата равна квадрату его стороны. Возведи найденную сторону в квадрат.'
        : 'Площадь квадрата равна половине квадрата диагонали. Возведи найденный диаметр в квадрат и раздели на 2.',
      'Проверь: ты использовал сторону или диагональ именно того квадрата, который дан в условии?'],
    [outside ? 'В этом случае диаметр равен стороне квадрата.' : 'В этом случае диаметр равен диагонали квадрата.',
      'Удвой радиус.', outside ? 'Возведи сторону в квадрат.' : 'Квадрат диагонали раздели на 2.', 'Ещё раз проверь положение квадрата и окружности.'],
    [`Диаметр равен 2 · ${show(radius)} = ${show(diameter)}.`,
      outside ? `Сторона квадрата равна ${show(diameter)}; S = a².` : `Диагональ квадрата равна ${show(diameter)}; S = d² / 2.`,
      outside ? `S = ${show(diameter)}² = ${show(area)}.` : `S = ${show(diameter)}² / 2 = ${show(area)}.`], show(area),
    'Площадь измеряется в квадратных единицах; радиус и диаметр — в единицах длины.', 'area');
}
function circleAngle(given, action) {
  const central = action === 'central-to-inscribed', inverse = action === 'inscribed-to-central';
  const toArc = action === 'inscribed-to-arc';
  if (!positive(given) || (central && compare(given, R180) > 0n) || (inverse && compare(given, rational(90n)) > 0n)
    || (action === 'arc-to-inscribed' && compare(given, R360) >= 0n) || (toArc && compare(given, R180) >= 0n)) return null;
  const divide = central || action === 'arc-to-inscribed';
  const answer = divide ? half(given) : double(given);
  return result('Угол и дуга окружности', 'Связь угла с дугой применима только к дуге, указанной в условии.',
    [central || inverse ? 'По условию оба угла опираются на одну и ту же дугу. Вписанный угол равен половине её градусной меры.'
      : 'Вписанный угол опирается на дугу, не содержащую его вершину; он равен половине градусной меры этой дуги.',
      divide ? 'Чтобы найти вписанный угол, нужно разделить известную градусную меру на 2.'
        : 'Чтобы найти градусную меру дуги или соответствующего центрального угла, нужно удвоить вписанный угол.',
      `${divide ? 'Раздели' : 'Умножь'} ${show(given)} на 2 и подпиши градусы.`,
      'Проверь, что в расчёте использована именно нужная дуга, а не другая дуга между теми же точками.'],
    ['Проверь нужную дугу.', divide ? 'Вписанный угол — половина дуги.' : 'Дуга вдвое больше вписанного угла.',
      divide ? 'Раздели данное число на 2.' : 'Удвой данное число.', 'Не перепутай две дуги.'],
    [central || inverse ? 'Центральный угол и градусная мера указанной дуги равны; вписанный угол составляет половину этой меры.'
      : 'Градусная мера вписанного угла равна половине градусной меры дуги, на которую он опирается.',
      `${show(given)}° ${divide ? '/ 2' : '· 2'} = ${show(answer)}°.`], show(answer) + '°',
    'Вписанный угол положителен и меньше 180°. Дуга, на которую он опирается, не содержит его вершину.', 'angle');
}
function circles(question) {
  let m = match(question, `(?:квадрат описан около окружности|в квадрат вписана окружность) радиуса (${NUMBER})[.;] ${FIND} площадь квадрата`);
  if (m) return squareCircle(number(m[1]), true);
  m = match(question, `(?:квадрат вписан в окружность|около квадрата описана окружность) радиуса (${NUMBER})[.;] ${FIND} площадь квадрата`);
  if (m) return squareCircle(number(m[1]), false);
  m = match(question, `центральный угол равен (${NUMBER})°[.;] вписанный угол опирается на ту же дугу[.;] ${FIND} вписанный угол`);
  if (m) return circleAngle(number(m[1]), 'central-to-inscribed');
  m = match(question, `вписанный угол равен (${NUMBER})°[.;] центральный угол опирается на ту же дугу[.;] ${FIND} центральный угол`);
  if (m) return circleAngle(number(m[1]), 'inscribed-to-central');
  m = match(question, `дуга окружности, на которую опирается вписанный угол, равна (${NUMBER})°[.;] ${FIND} вписанный угол`);
  if (m) return circleAngle(number(m[1]), 'arc-to-inscribed');
  m = match(question, `вписанный угол равен (${NUMBER})°[.;] ${FIND} градусную меру дуги, на которую он опирается`);
  return m ? circleAngle(number(m[1]), 'inscribed-to-arc') : null;
}

function midline(a, b, segment) {
  if (!positive(a, b) || equal(a, b)) return null;
  const long = compare(a, b) > 0n ? a : b, short = compare(a, b) < 0n ? a : b;
  const answer = segment === 'больший' ? half(long) : segment === 'меньший' ? half(short) : half(add(a, b));
  return result('Средняя линия трапеции', 'Средняя линия соединяет середины боковых сторон трапеции.',
    ['Выдели два параллельных основания трапеции. Средняя линия параллельна им.',
      segment ? 'Диагональ делит среднюю линию на две части. Каждая часть равна половине соответствующего основания.'
        : 'Средняя линия равна полусумме оснований: сначала складываем основания, затем делим на 2.',
      segment ? `Для ${segment === 'больший' ? 'большего' : 'меньшего'} отрезка выбери ${segment === 'больший' ? 'большее' : 'меньшее'} основание и раздели его на 2.`
        : `Сложи ${show(a)} и ${show(b)}, затем раздели сумму на 2.`,
      segment ? 'Сумма обеих частей должна давать всю среднюю линию. Проверь это после вычисления.'
        : 'Средняя линия должна быть больше меньшего основания и меньше большего.'],
    ['Найди два основания.', segment ? 'Части равны половинам оснований.' : 'Нужна половина суммы оснований.',
      segment ? `Возьми ${segment === 'больший' ? 'большее' : 'меньшее'} основание и раздели на 2.` : 'Сначала сложи, потом раздели на 2.',
      segment ? 'Сложи обе части для проверки.' : 'Сравни результат с основаниями.'],
    segment ? [`Каждая часть средней линии — средняя линия одного из треугольников, полученных при проведении диагонали.`,
      `Части равны половинам оснований: ${show(a)} / 2 = ${show(half(a))}; ${show(b)} / 2 = ${show(half(b))}.`,
      `${segment === 'больший' ? 'Больший' : 'Меньший'} отрезок равен ${show(answer)}.`]
      : ['Средняя линия трапеции равна полусумме оснований.', `(${show(a)} + ${show(b)}) / 2 = ${show(answer)}.`],
    show(answer), 'Все длины выражены в одной единице; половины оснований в сумме дают среднюю линию.');
}
function area(a, b, shape) {
  if (!positive(a, b)) return null;
  const halved = shape === 'треугольника' || shape === 'ромба';
  const product = mul(a, b), answer = halved ? half(product) : product;
  const factors = shape === 'ромба' ? 'диагонали' : shape === 'прямоугольника' ? 'соседние стороны' : 'основание и высота к этому основанию';
  return result(`Площадь ${shape}`, 'Сначала проверим, какие отрезки разрешено подставлять в формулу площади.',
    [`В условии даны ${factors}. Убедись, что используешь именно их.`,
      `Перемножь ${show(a)} и ${show(b)}.`,
      halved ? 'Для этой фигуры произведение нужно разделить на 2.' : 'Это произведение даёт площадь; делить его на 2 не нужно.',
      'Проверь единицы: площадь выражают в квадратных единицах.'],
    [`Найди ${factors}.`, 'Перемножь две данные длины.', halved ? 'Раздели произведение на 2.' : 'Произведение — площадь.', 'Подпиши квадратные единицы.'],
    [`Для ${shape} используем ${factors}.`,
      `${show(a)} · ${show(b)} = ${show(product)}.`,
      halved ? `Площадь равна половине произведения: ${show(product)} / 2 = ${show(answer)}.` : `S = ${show(answer)}.`],
    show(answer), 'Длины должны быть в одинаковых единицах. Наклонная сторона не заменяет высоту.', 'area');
}
function quadrilaterals(question) {
  let m = match(question, `основания трапеции равны (${NUMBER}) и (${NUMBER})[.;] ${FIND} среднюю линию`);
  if (m) return midline(number(m[1]), number(m[2]));
  m = match(question, `основания трапеции равны (${NUMBER}) и (${NUMBER})[.;] диагональ делит среднюю линию на два отрезка[.;] ${FIND} (больший|меньший) отрезок`);
  if (m) return midline(number(m[1]), number(m[2]), m[3]);
  m = match(question, `стороны прямоугольника равны (${NUMBER}) и (${NUMBER})[.;] ${FIND} площадь прямоугольника`);
  if (m) return area(number(m[1]), number(m[2]), 'прямоугольника');
  m = match(question, `диагонали ромба равны (${NUMBER}) и (${NUMBER})[.;] ${FIND} площадь ромба`);
  if (m) return area(number(m[1]), number(m[2]), 'ромба');
  m = match(question, `основание (параллелограмма|треугольника) равно (${NUMBER}), высота к этому основанию равна (${NUMBER})[.;] ${FIND} площадь (параллелограмма|треугольника)`);
  return m && m[1] === m[4] ? area(number(m[2]), number(m[3]), m[1]) : null;
}

function grid(question) {
  const cell = '(?:клетка|клетки|клеток)';
  const m = match(question, `между точками по горизонтали (${INTEGER}) ${cell}, по вертикали (${INTEGER}) ${cell}[.;] сторона клетки равна (${NUMBER})[.;] ${FIND} расстояние между точками`);
  if (!m) return null;
  const horizontalCells = number(m[1]), verticalCells = number(m[2]), scale = number(m[3]);
  if (!positive(scale)) return null;
  const x = mul(horizontalCells, scale), y = mul(verticalCells, scale), squareDistance = add(square(x), square(y));
  const answer = root(squareDistance);
  return result('Расстояние между точками на сетке', 'Горизонтальное и вертикальное расстояния перпендикулярны друг другу.',
    ['Считай промежутки между линиями сетки, а не сами линии. В условии указаны горизонтальное и вертикальное смещения.',
      `Переведи каждое смещение в единицы длины: умножь число клеток на ${show(scale)}.`,
      'Сложи квадраты горизонтального и вертикального расстояний. Это квадрат искомого расстояния.',
      'Извлеки неотрицательный квадратный корень. Если одно смещение равно нулю, расстояние равно другому смещению.'],
    ['Найди смещения по горизонтали и вертикали.', 'Умножь каждое на сторону клетки.', 'Сложи квадраты полученных длин.', 'Извлеки квадратный корень.'],
    [`Горизонтальное расстояние: ${show(horizontalCells)} · ${show(scale)} = ${show(x)}; вертикальное: ${show(verticalCells)} · ${show(scale)} = ${show(y)}.`,
      `Квадрат расстояния: ${show(x)}² + ${show(y)}² = ${show(squareDistance)}.`,
      `Неотрицательный квадратный корень равен ${answer}.`], answer,
    'Сторона клетки применена к обеим координатам. Расстояние не меньше каждого из двух смещений.');
}

const STATEMENTS = new Map([
  ['диагонали любого прямоугольника равны', {
    value: true, title: 'Утверждение о диагоналях прямоугольника',
    hints: ['Вспомни, какие углы у прямоугольника.', 'Рассмотри два треугольника, образованных его диагоналями.', 'Сравни их стороны и угол между этими сторонами.', 'Сделай вывод о третьих сторонах этих треугольников.'],
    proof: ['У прямоугольника противоположные стороны равны и все углы прямые.', 'Треугольники, содержащие диагонали и две соседние стороны, равны по двум сторонам и углу между ними.', 'Их третьи стороны, то есть диагонали, равны.']
  }],
  ['диагонали любого параллелограмма равны', {
    value: false, title: 'Утверждение о диагоналях параллелограмма',
    hints: ['В утверждении сказано «любого»: нужно проверить весь класс фигур.', 'Ромб тоже является параллелограммом.', 'Попробуй построить ромб, который не является квадратом.', 'Проверь, можно ли получить разные длины диагоналей, сохранив все условия.'],
    proof: ['Возьмём ромб с диагоналями 6 и 8, которые перпендикулярны и делятся пополам.', 'Четыре стороны такого ромба равны 5: каждый из четырёх прямоугольных треугольников имеет катеты 3 и 4.', 'Это параллелограмм, но его диагонали 6 и 8 различны. Одного контрпримера достаточно.']
  }],
  ['диагонали любого ромба равны', {
    value: false, title: 'Утверждение о диагоналях ромба',
    hints: ['Равенство каких отрезков входит в определение ромба?', 'Квадрат — лишь частный случай ромба.', 'Рассмотри ромб, который не является квадратом.', 'Попробуй проверить утверждение на такой фигуре.'],
    proof: ['У ромба могут быть диагонали 6 и 8, перпендикулярные и делящиеся пополам.', 'Тогда каждая сторона равна 5 по теореме Пифагора: половины диагоналей равны 3 и 4.', 'Все стороны равны, а диагонали различны. Получен контрпример.']
  }],
  ['любой квадрат является прямоугольником', {
    value: true, title: 'Квадрат и прямоугольник',
    hints: ['Вспомни определение прямоугольника.', 'Проверь, какие углы у квадрата.', 'Нужны ли по определению прямоугольника разные длины соседних сторон?', 'Сравни определение с фигурой и сделай вывод.'],
    proof: ['Прямоугольник — четырёхугольник, у которого все углы прямые.', 'У квадрата все углы прямые. Равенство его сторон этому определению не противоречит.']
  }],
  ['любой прямоугольник является квадратом', {
    value: false, title: 'Прямоугольник и квадрат',
    hints: ['Вспомни, что требуется от сторон квадрата.', 'Какие равенства сторон обязательны для прямоугольника?', 'Рассмотри прямоугольник с разными соседними сторонами.', 'Проверь, удовлетворяет ли такая фигура определению квадрата.'],
    proof: ['Прямоугольник со сторонами 2 и 3 имеет четыре прямых угла.', 'Его соседние стороны различны, поэтому он не является квадратом. Это контрпример.']
  }],
  ['все равносторонние треугольники равны', {
    value: false, title: 'Равносторонние треугольники',
    hints: ['Равные фигуры должны иметь одинаковые размеры.', 'В определении равностороннего треугольника сравниваются стороны одной фигуры.', 'Можно ли построить две такие фигуры разного размера?', 'Сравни соответствующие стороны выбранных треугольников.'],
    proof: ['Построим равносторонний треугольник со стороной 2 и другой со стороной 3.', 'Оба треугольника равносторонние, но их соответствующие стороны различны, поэтому треугольники не равны.']
  }]
]);
function statement(question) {
  const m = match(question, 'верно ли утверждение: (.+?)');
  if (!m) return null;
  const item = STATEMENTS.get(m[1]);
  if (!item) return null;
  return result(item.title, 'Проверим именно это утверждение, учитывая все его условия.', item.hints,
    item.hints.map((text, i) => ['Вспомни определение фигуры.', 'Проверь все условия утверждения.', 'Сравни свойства подходящих фигур.', 'Объясни свой вывод.'][i]),
    item.proof, item.value ? 'верно' : 'неверно',
    item.value ? 'Обоснование относится ко всем фигурам, названным в утверждении.'
      : 'Контрпример удовлетворяет условиям утверждения, но нарушает его вывод.', 'statement');
}

export function solveGeometry(topic, question) {
  if (!TOPICS.has(topic) || typeof question !== 'string' || question.length > 1000) return null;
  if (/[\u00b2\u00b3\u00b9\u2070-\u209f]/u.test(question)) return null;
  const q = normalize(question);
  if (topic === 'oge-triangles') return triangles(q) || (q.startsWith('основание треугольника ') ? quadrilaterals(q) : null);
  if (topic === 'oge-circle') return circles(q);
  if (topic === 'oge-quadrilaterals') return quadrilaterals(q);
  if (topic === 'oge-grid') return grid(q);
  return statement(q);
}

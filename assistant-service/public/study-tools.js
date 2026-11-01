// Pure bounded helpers shared with the offline tutor; no storage or network.
export function normalizeTask(value) {
  if (typeof value !== 'string' || value.length > 1000) return '';
  return value.normalize('NFKC').trim().replace(/[−–—]/g, '-')
    .replace(/^(?:пожалуйста[, ]+)?(?:вычисли(?:те|ть)?|посчитай(?:те)?|найди(?:те)?\s+значение\s+выражения)\s*:?\s*/iu, '')
    .replace(/^(?:пожалуйста[, ]+)?(?:реши(?:те|ть)?|найди(?:те)?\s+корень)\s+(?:уравнение\s*)?:?\s*/iu, '')
    .replace(/\s*[.!?]$/, '').trim();
}
export function inferTopic(value) {
  const q = normalizeTask(value).toLowerCase();
  if (/^(?:нод|нок)\s/.test(q)) return 'gcd-lcm';
  if (/^округл/.test(q)) return 'rounding';
  if (/%|^сколько процентов/.test(q)) return 'percentages';
  if (/[xх]/.test(q) && q.includes('=') && !/[<>≤≥^²]/.test(q)) return 'linear-equations';
  if (/^[\d\s+*/(),.-]+$/.test(q) && /\d\s*\/\s*\d/.test(q)) return 'fractions';
  if (/катет|гипотенуз|пифагор/.test(q)) return 'pythagoras';
  if (/сечени/.test(q)) return 'sections';
  return null;
}
export function ambiguity(value, topic) {
  let m;
  if (topic === 'linear-equations' && (m = /\d\s+\d/.exec(value))) return { start: m.index, end: m.index + m[0].length, text: 'Между цифрами пробел. Это одно число или пропущено действие?' };
  if ((m = /\d\s*\/\s*\d\s*[xх]/.exec(value))) return { start: m.index, end: m.index + m[0].length, text: 'Уточни скобками: (1/2)*x или 1/(2*x). Это разные выражения.' };
  if ((m = /(?:=|[+*/-]|\bот)\s*$/.exec(value))) return { start: m.index, end: value.length, text: 'Здесь не хватает следующей части условия.' };
  return null;
}
export const FORMATS = {
  'linear-equations': 'Введи значение x (например, 2 или 1/3) либо до 6 строк равенств с x. Каждую строку — с новой строки.',
  fractions: 'Точное число: 3/4, 0,75 или 1 1/2. Если десятичная дробь бесконечная, лучше оставь обыкновенную дробь.',
  percentages: 'Число; если ищешь процентную долю, можно дописать знак %. Не округляй без указания.',
  'gcd-lcm': 'Одно натуральное число — НОД или НОК из условия.',
  rounding: 'Число, округлённое до разряда, указанного в условии.',
  pythagoras: 'Сначала назови известные стороны и единицы длины. Общий вопрос не является числовой задачей.',
  sections: 'Нужны названия многогранника и точек на его рёбрах. По общему описанию конкретное сечение не проверяется.'
};
export const GLOSSARY = {
  'числитель': 'Числитель показывает, сколько равных долей взяли. Он записан над чертой дроби.',
  'знаменатель': 'Знаменатель показывает, на сколько равных долей разделено целое. Он не может быть нулём.',
  'коэффициент': 'Коэффициент — числовой множитель перед буквой: в 3x он равен 3.',
  'корень': 'Корень уравнения — значение неизвестного, при котором равенство верно.',
  'гипотенуза': 'Гипотенуза — сторона прямоугольного треугольника напротив прямого угла.',
  'катет': 'Катет — одна из двух сторон, образующих прямой угол.',
  'процент': 'Один процент — одна сотая исходного целого.',
  'сечение': 'Сечение многогранника плоскостью — общая часть многогранника и этой плоскости.'
};
export function whyStep(topic, step) {
  if (/делим|раздели|делен/iu.test(step) && topic === 'linear-equations') return 'Деление обеих частей на одно и то же ненулевое число сохраняет равенство. Деление на ноль запрещено.';
  if (/прибав|вычит|вычти|перенос/iu.test(step) && topic === 'linear-equations') return 'Если прибавить или вычесть одно и то же число в обеих частях равенства, его решения сохранятся.';
  return {
    'linear-equations': 'Мы ищем значение x, при котором обе части равны. Каждый переход нужно проверить на сохранение решений.',
    fractions: 'Складывать и вычитать можно количества одинаковых долей. Умножение числителя и знаменателя на одно ненулевое число сохраняет дробь.',
    percentages: 'Процент означает сотую долю. Сначала определяем исходное целое, затем долю от него.',
    'gcd-lcm': 'Делитель должен делить каждое число без остатка; кратное должно делиться на каждое исходное число.',
    rounding: 'Решает первая отбрасываемая цифра: 0–4 оставляют разряд, 5–9 увеличивают его на единицу.',
    pythagoras: 'В прямоугольном треугольнике квадрат гипотенузы равен сумме квадратов катетов.',
    sections: 'Две точки в одной грани задают прямую пересечения плоскости с этой гранью. Продолжать отрезок через другую грань без основания нельзя.'
  }[topic] || 'Проверь условия применённого правила и объясни, почему следующий шаг следует из предыдущего.';
}
export function understanding(topic) {
  return {
    'linear-equations': { question: 'Чтобы сохранить равенство, вычтем 5…', options: ['из обеих частей', 'только слева'], correct: 0, why: 'Одинаковое действие нужно выполнить в обеих частях.' },
    fractions: { question: 'Перед сложением дробей доли должны быть…', options: ['одинакового размера', 'с одинаковыми числителями'], correct: 0, why: 'Общий знаменатель задаёт одинаковый размер долей.' },
    percentages: { question: 'Один процент исходного числа — это…', options: ['одна сотая этого числа', 'само число'], correct: 0, why: '100% — всё число; 1% — одна сотая.' },
    'gcd-lcm': { question: 'Общий делитель двух чисел должен…', options: ['делить оба без остатка', 'быть больше обоих'], correct: 0, why: 'Например, 3 делит и 6, и 9 без остатка.' },
    rounding: { question: 'При округлении до десятых смотрим на…', options: ['сотые', 'единицы'], correct: 0, why: 'Нужна первая цифра справа от сохраняемого разряда.' },
    pythagoras: { question: 'Гипотенуза находится…', options: ['напротив прямого угла', 'у любого угла'], correct: 0, why: 'Сначала найди прямой угол, затем противоположную сторону.' }
  }[topic] || null;
}
export function appendMath(container, text) {
  const pattern = /(-?\d+)\s*\/\s*(\d+)|([a-zа-я\d]+)\^(-?\d+)|√(\d+)/giu;
  let start = 0;
  const mathNode = (tag, text) => { const n = document.createElementNS('http://www.w3.org/1998/Math/MathML', tag); if (text !== undefined) n.textContent = text; return n; };
  for (const m of String(text).matchAll(pattern)) {
    container.append(document.createTextNode(text.slice(start, m.index)));
    const math = mathNode('math'); math.setAttribute('data-plain', m[0]); const part = mathNode(m[1] !== undefined ? 'mfrac' : m[3] !== undefined ? 'msup' : 'msqrt');
    math.setAttribute('aria-label', m[1] !== undefined ? `${m[1]} делённое на ${m[2]}` : m[3] !== undefined ? `${m[3]} в степени ${m[4]}` : `квадратный корень из ${m[5]}`);
    if (m[1] !== undefined) part.append(mathNode('mn', m[1]), mathNode('mn', m[2]));
    else if (m[3] !== undefined) part.append(mathNode(/\d/.test(m[3]) ? 'mn' : 'mi', m[3]), mathNode('mn', m[4]));
    else part.append(mathNode('mn', m[5]));
    math.append(part); container.append(math); start = m.index + m[0].length;
  }
  container.append(document.createTextNode(String(text).slice(start)));
}

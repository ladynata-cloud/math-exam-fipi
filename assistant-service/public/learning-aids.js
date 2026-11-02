// Pure, bounded teaching aids. No model output, network or browser state here.
const HELP = {
  motion: { examples: ['Движение: скорость 60 км/ч; время 2 ч; найти путь','Навстречу: расстояние 300 км; первый 60 км/ч; второй 40 км/ч','Вдогонку: отставание 30 км; сзади 60 км/ч; впереди 50 км/ч'] },
  'work-rates': { examples: ['Работа: первый 6 ч; второй 3 ч; найти время вместе'] },
  mixtures: { examples: ['Смесь: 200 г 10%; 300 г 20%; найти концентрацию'] },
  'arithmetic-progression': { examples: ['Арифметическая: a1=3; d=2; n=10; найти an','Арифметическая: a1=3; an=21; d=2; найти n','Арифметическая: a1=3; d=2; n=10; найти sn'] },
  'geometric-progression': { examples: ['Геометрическая: a1=3; q=2; n=5; найти sn','Геометрическая: a1=3; a2=-6; найти q'] },
  statistics: { examples: ['Статистика: 2; 4; 9; 5; найти медиану','Статистика: 2; 4; 9; 5; найти среднее','Статистика: 2; 4; 9; 5; найти размах'] },
  probability: { examples: ['Вероятность: два кубика; сумма=7','Вероятность: 3 монеты; орлов=2','Вероятность: 3 красных и 2 синих; вытянуть 2 красных без возвращения'] },
  'function-table': { examples: ['Функция: x=-2 | -1 | 0 | 1; y=4 | 1 | 0 | 1; найти x при y=1'] },

  'quadratic-equations': { examples: ['x^2-5x+6=0','x^2-2=0','x^2+1=0'] },
  inequalities: { examples: ['-2x+3<7','x^2-4<=0'] },
  'linear-systems': { examples: ['x+y=5; 2x-y=1','x+y=2; 2x+2y=4'] },
  'rational-equations': { examples: ['1/(x-1)=2','(x+1)/(x-1)=2'] },
  'radical-equations': { examples: ['√(x+2)=x','sqrt(2x+3)=3'] },
  'absolute-equations': { examples: ['|x-2|=3','|2x+1|=0'] },
  'rational-inequalities': { examples: ['(x-1)/(x+2)>=0','1/(x-3)<0'] },
  'exponential-equations': { examples: ['2^(x+1)=8','(1/2)^x=8'] },
  'logarithmic-equations': { examples: ['log_2(x-1)=3','log_3(x+2)=log_3(2x)'] },
  'trigonometric-equations': { examples: ['sin(x)=1/2; [0;2pi]','cos(x)=0; (-pi;pi]'] },

  arithmetic: { examples: ['(1/2+1/3)*6', '(-2)^-3', '√72', '1/3; округли до 2 знаков'] },
  comparison: { examples: ['Сравни 1 1/2 и 7/4', 'Сравни -1/2 и -1/3'] },
  proportions: { examples: ['x/3 = 4/6', '3/x = 6/4'] },
  conversions: { examples: ['250 см в м', '0,25 в проценты', '25% в дробь', '1/4 в десятичную дробь'] },
  polynomials: { examples: ['Упрости: 2(x+3)-x', 'Разложи: x^2-9', 'Разложи: x^3+2x^2+3x+6'] },
  'linear-equations': { examples: ['3x + 5 = 20', '2(x + 3) = x + 9', '0,5x + 2 = 0,25x + 5'], path: 'trainers/simple-equations-stepwise.html', title: 'Уравнения по шагам' },
  fractions: { examples: ['1/2 + 1/3', '1 1/2 - 2/3', '1 1/2 * 2/3', '1/2 : 3/4'], path: 'trainers/oge-basics/fraction-common-denominator.html', title: 'Общий знаменатель' },
  percentages: { examples: ['15% от 240', '15% числа равны 36', 'Сколько процентов составляет 30 от 120?', 'Уменьши 240 на 15%'], path: 'trainers/oge-basics/percentages/index.html', title: 'Практика с процентами' },
  'gcd-lcm': { examples: ['НОД 18 и 24', 'НОК 12 и 18'], path: 'trainers/grade6-nod.html', title: 'НОД и делители' },
  rounding: { examples: ['Округли 9,96 до десятых'], path: 'trainers/rounding-stepwise.html', title: 'Округление по шагам' },
  pythagoras: { examples: ['Как отличить гипотенузу от катетов?'], path: 'geometry-course/atlas/pythagoras.html', title: 'Теорема Пифагора с чертежом' },
  sections: { examples: ['Как начать строить сечение по трём точкам?'] },
};
export function topicHelp(topic) {
  const item = Object.hasOwn(HELP, topic) ? HELP[topic] : null;
  return item ? { examples: [...item.examples], resource: item.path ? { title: item.title, url: `https://mathexam.space/${item.path}` } : null } : { examples: [], resource: null };
}

const PRACTICE = {
  fractionProduct: ['2/3 * 3/4', '1 1/2 * 2/5'],
  fractionQuotient: ['3/4 : 2/3', '1 1/2 : 3/5'],
  simple: ['4x + 3 = 19', '5x - 4 = 16'],
  parentheses: ['3(x + 2) = x + 14', '2(x + 4) = x + 11'],
  coefficients: ['0,5x + 1 = 0,25x + 3', '(1/2)x + 2 = (1/4)x + 5'],
  both: ['4x + 2 = 2x + 10', '3x + 4 = x + 16'],
  fractions: ['1/3 + 1/6', '3/4 - 1/2'],
  mixed: ['1 1/3 + 1/6', '2 1/4 - 3/4'],
  part: ['20% от 150', '25% от 80'],
  whole: ['20% числа равны 30', '25% числа равны 20'],
  ratio: ['Сколько процентов составляет 15 от 60?', 'Сколько процентов составляет 20 от 50?'],
  increase: ['Увеличь 150 на 20%', 'Увеличь 80 на 25%'],
  decrease: ['Уменьши 150 на 20%', 'Уменьши 80 на 25%'],
  gcd: ['НОД 16 и 24', 'НОД 18 и 30'], lcm: ['НОК 8 и 12', 'НОК 6 и 15'],
  rounding: ['Округли 7,86 до десятых', 'Округли 3,94 до десятых'],
};
const normalized = text => String(text).trim().toLowerCase().replace(/[−–—]/g, '-');
export function practiceFor(topic, question) {
  if (typeof question !== 'string' || question.length > 1200) return null;
  const q = normalized(question);
  let family;
  if (topic === 'linear-equations') family = /[.,/]/.test(q) ? 'coefficients' : /[()]/.test(q) ? 'parentheses' : /[xх].*=[^=]*[xх]/.test(q) ? 'both' : 'simple';
  if (topic === 'fractions') family = /[÷:]|\)\s*\/\s*\(/.test(q) ? 'fractionQuotient' : /[*×·]/.test(q) ? 'fractionProduct' : /\d[ \t\u00a0]+\d+\s*\//.test(q) ? 'mixed' : 'fractions';
  if (topic === 'percentages') family = /^увелич/.test(q) ? 'increase' : /^уменьш/.test(q) ? 'decrease' : /сколько процентов|в процентах/.test(q) ? 'ratio' : /числа равны|которого/.test(q) ? 'whole' : 'part';
  if (topic === 'gcd-lcm') family = /нок/.test(q) ? 'lcm' : 'gcd';
  if (topic === 'rounding') family = 'rounding';
  const key = value => normalized(value).replace(/\s|[?!]/g, '');
  const example = PRACTICE[family]?.find(value => key(value) !== key(q));
  return example ? { topic, question: example } : null;
}

// Draw only original operands, never a computed solution. Small bounds keep
// both the visual and the DOM manageable and exclude misleading approximations.
export function visualFor(topic, question) {
  if (typeof question !== 'string' || question.length > 240) return null;
  const q = normalized(question);
  if (topic === 'fractions') {
    const operand = '[+-]?(?:\\d{1,2}[ \\t\\u00a0]+)?\\d{1,2}\\s*/\\s*\\d{1,2}';
    const match = q.match(new RegExp(`^(${operand})\\s*([+-])\\s*(${operand})$`));
    if (!match) return null;
    const operands = [match[1], match[3]].map(label => {
      const parts = label.match(/^([+-]?)(?:(\d+)[ \t\u00a0]+)?(\d+)\s*\/\s*(\d+)$/);
      const [, sign, whole, numerator, denominator] = parts;
      const d = Number(denominator), top = Number(numerator);
      const n = (Number(whole || 0) * d + top) * (sign === '-' ? -1 : 1);
      return { n, d, label, properMixed: !whole || top < d };
    });
    if (operands.some(x => x.d < 1 || x.d > 12 || Math.abs(x.n) > 3 * x.d || !x.properMixed)) return null;
    return { kind: operands.some(x => x.n < 0) ? 'number-line' : 'fraction-bars', operands,
      units: Math.max(1, ...operands.map(x => Math.ceil(Math.abs(x.n) / x.d))),
      caption: 'Показаны исходные числа. Знак действия и вычисление результата разбери отдельно.' };
  }
  if (topic === 'percentages') {
    const match = q.match(/^(\d{1,3}(?:[.,]\d{1,2})?)\s*%/) || q.match(/^(?:увеличь|уменьши)\s+\d+(?:[.,]\d+)?\s+на\s+(\d{1,3}(?:[.,]\d{1,2})?)\s*%$/);
    if (!match) return null;
    const percent = Number(match[1].replace(',', '.'));
    if (percent > 100) return null;
    return { kind: 'percent-bar', percent, caption: `${match[1]}% — выделенная часть исходного целого (100%). При увеличении её прибавляют, при уменьшении — вычитают. Итоговое число здесь не показано.` };
  }
  return null;
}

import { R, abs, gcd, add, mul, div, eq, compare, text, polynomial, numeric, pEqual, pText, pAt, rounded, sqrtInteger } from './math-kernel.js';

export const FOUNDATION_TOPICS = [
  { id: 'arithmetic', title: 'Выражения, степени и корни', sample: '(1/2 + 1/3) * 6' },
  { id: 'comparison', title: 'Сравнение чисел', sample: 'Сравни 1 1/2 и 7/4' },
  { id: 'proportions', title: 'Пропорции', sample: 'x/3 = 4/6' },
  { id: 'conversions', title: 'Дроби, проценты и единицы', sample: '250 см в м' },
  { id: 'polynomials', title: 'Упрощение и разложение', sample: 'Упрости: 2(x+3)-x' }
];
export function decimalText(value, places) {
  const n=abs(value.n)*10n**BigInt(places)/value.d,s=String(n).padStart(places+1,'0');
  return (value.n<0n?'-':'')+(places?s.slice(0,-places)+','+s.slice(-places):s);
}
function finitePlaces(value) {let d=value.d,a=0,b=0;while(d%2n===0n){d/=2n;a++;}while(d%5n===0n){d/=5n;b++;}return d===1n&&Math.max(a,b)<=6?Math.max(a,b):null;}
const clean = q => q.trim().toLowerCase().replace(/[−–—]/g,'-').replaceAll('х','x');
export function result({ title, rule, steps, expected = null, expectedText, format, verify, hints }) {
  return { title, text: rule, expected, expectedText: expectedText || (expected && text(expected)),
    hints: hints || [rule, 'Определи, какое действие нужно выполнить первым.', 'Сохраняй скобки и знаки каждого числа.', 'Проверь каждое преобразование обратным действием.', 'Сравни результат с исходным условием. Полный разбор можно открыть отдельно.'],
    steps, check: 'Проверь результат обратным действием или подстановкой.', format, verify };
}
function status(correct, kind = 'answer') { return { status: correct ? 'correct' : 'incorrect', kind, text: correct ? 'Ответ подходит.' : 'Ответ пока не подходит. Проверь правило и своё действие.' }; }
const unsupported = text => ({ status: 'unsupported', kind: 'answer', text });
function answerNumber(s) {
  if(/[\r\n]/.test(s))throw Error('ANSWER_FORMAT');
  s=s.trim().replace(/^x\s*=\s*/, '');let m;
  if((m=/^([+-]?)(\d{1,12})\s+(\d{1,12})\s*\/\s*(\d{1,12})$/.exec(s))){if(!BigInt(m[4])||BigInt(m[3])>=BigInt(m[4]))throw Error('MIXED');return R((BigInt(m[2])*BigInt(m[4])+BigInt(m[3]))*(m[1]==='-'?-1n:1n),BigInt(m[4]));}
  if((m=/^([+-]?\d{1,12})\s*\/\s*([+-]?\d{1,12})$/.exec(s)))return R(BigInt(m[1]),BigInt(m[2]));
  if((m=/^([+-]?)(\d{1,12})(?:[.,](\d{1,6}))?$/.exec(s)))return R(BigInt(m[2]+(m[3]||''))*(m[1]==='-'?-1n:1n),10n**BigInt((m[3]||'').length));
  throw Error('ANSWER_FORMAT');
}
function nontrivialProduct(value) {
  const a=value.replace(/\s+/g,'').replace(/\)\(/g,')*(').replace(/([x\d])\(/g,'$1*(');
  if(/^\(.+\)\^[2-4]$/.test(a))return polynomial(a.slice(1,a.lastIndexOf(')'))).p.length>1;
  const parts=[];let depth=0,start=0;
  for(let i=0;i<a.length;i++){if(a[i]==='(')depth++;if(a[i]===')')depth--;if(!depth&&i>0&&['+','-'].includes(a[i]))return false;if(!depth&&a[i]==='*'){parts.push(a.slice(start,i));start=i+1;}}
  parts.push(a.slice(start));if(parts.length<2)return false;
  const ps=parts.map(v=>polynomial(v).p),variables=ps.filter(p=>p.length>1).length;
  return variables>=2||(variables>=1&&ps.some(p=>p.length===1&&p[0].d===1n&&abs(p[0].n)>1n));
}
export function numericVerifier(expected, { format, unit = '' } = {}) {
  return attempt => {
    try {
      let a=clean(attempt).replace(/^ответ\s*:\s*/, '');
      if(unit==='%')a=a.replace(/\s*%$/,'');
      if(format==='decimal'&&!/^[+-]?\d+(?:[.,]\d+)?$/.test(a))return unsupported('Здесь нужен ответ в десятичной записи.');
      return status(eq(answerNumber(a),expected));
    } catch { return unsupported('Запись ответа не распознана. Введи число или обыкновенную дробь.'); }
  };
}
function integerRoot(q) {
  const m=/^(?:упрости\s*:?\s*)?(?:√\s*(?:\((\d{1,6})\)|(\d{1,6}))|sqrt\((\d{1,6})\))$/.exec(q);if(!m)return null;
  const n=BigInt(m[1]||m[2]||m[3]);let outside=1n,inside=n;
  if(!n)inside=0n;
  else for(let d=2n;d*d<=inside;d++)while(inside%(d*d)===0n){outside*=d;inside/=d*d;}
  const expectedText=inside===0n?'0':inside===1n?String(outside):`${outside===1n?'':outside}√${inside}`;
  const expected=inside<=1n?R(inside===0n?0n:outside):null;
  const verify=attempt=>{
    if(expected)return numericVerifier(expected)(attempt);
    const a=clean(attempt).replace(/\s+/g,'').replace(/\*/g,'');
    const m=/^(\d{1,6})?√(?:\((\d{1,6})\)|(\d{1,6}))$/.exec(a);
    if(!m)return unsupported('Введи точный упрощённый корень, например 6√2. Округление здесь не задано.');
    return status(BigInt(m[1]||'1')===outside&&BigInt(m[2]||m[3])===inside);
  };
  return result({title:'Упрощаем квадратный корень',rule:'Квадратный корень — неотрицательное число. Ищи квадратный множитель под корнем.',
    expected,expectedText,verify,format:'Точный корень: например, 6√2. Не заменяй приближённой десятичной дробью.',
    steps:[`${n} = ${outside}^2 * ${inside}.`, `√${n} = ${expectedText}.`, `Проверка квадратом: (${expectedText})^2 = ${n}.`]});
}
export function solveArithmetic(question) {
  try {
    let q=clean(question).replace(/^(?:вычисли|выражение)\s*:?\s*/,'');
    if(/[÷:]/.test(q)){const grouped=fractionProductExpression(q);if(!grouped)return null;q=grouped;}
    const root=integerRoot(q);if(root)return root;
    const roundedMatch=/^(.+?);\s*округли\s+до\s+([0-6])\s+знаков?$/.exec(q);
    const expression=roundedMatch?roundedMatch[1]:q;const solved=numeric(expression);
    if(solved.trace.length>(roundedMatch?8:9))return null; // Full visible solution stays complete within the card limit.
    const expected=roundedMatch?rounded(solved.value,Number(roundedMatch[2])):solved.value;
    const nextDigit=roundedMatch?Number((abs(solved.value.n)*10n**BigInt(Number(roundedMatch[2])+1)/solved.value.d)%10n):null;
    const roundingStep=roundedMatch?[`Первая отбрасываемая цифра: ${nextDigit}. ${nextDigit>=5?'Увеличиваем модуль последнего сохраняемого разряда на единицу.':'Последний сохраняемый разряд оставляем прежним.'}`]:[];
    const steps=[...solved.trace,...roundingStep, roundedMatch?`Точное значение ${text(solved.value)}. Округляем до ${roundedMatch[2]} знаков: ${decimalText(expected,Number(roundedMatch[2]))} (приближённо).`:`Точный ответ: ${text(expected)}.`];
    return result({title:'Вычисляем по порядку',rule:'Сначала скобки и степени, затем умножение и деление, затем сложение и вычитание. Действия одной ступени выполняй слева направо.',steps,expected,
      format:roundedMatch?`Приближённое значение до ${roundedMatch[2]} знаков после запятой.`:'Точное значение: число, обыкновенная или конечная десятичная дробь.',verify:numericVerifier(expected),
      hints:['Выдели скобки: их выражения вычисляем отдельно.','Степень относится к записанному основанию: сравни -2^2 и (-2)^2.','Для умножения дробей умножь числители и знаменатели; можно сократить множители.','При делении на дробь умножь на обратную. Делитель не может быть нулём.','Оставь точную дробь, если округление не запрошено.']});
  }catch{return null;}
}
function fractionProductExpression(question) {
  const operand='([+-]?(?:(?:\\d{1,6}\\s+)?\\d{1,6}\\s*/\\s*\\d{1,6}|\\d{1,6}(?:[.,]\\d{1,6})?))';
  const m=new RegExp(`^${operand}\\s*([*×·:÷])\\s*${operand}$`).exec(question.trim());
  return m?`(${m[1]})${/[*×·]/.test(m[2])?'*':'/'}(${m[3]})`:null;
}
export function solveFractionProduct(question) {
  const grouped=fractionProductExpression(question);
  if(grouped)return solveArithmetic(grouped);
  return /[()]/.test(question)?solveArithmetic(question):null;
}
export function solveComparison(question) {
  try {const m=/^сравни\s+(.+?)\s+и\s+(.+)$/.exec(clean(question));if(!m)return null;const a=numeric(m[1]).value,b=numeric(m[2]).value,c=compare(a,b),symbol=c<0?'<':c>0?'>':'=';
    return result({title:'Сравниваем числа',rule:'Приведи дроби к одному положительному знаменателю и сравни числители.',expectedText:symbol,
      steps:[`Общий положительный знаменатель: ${a.d*b.d}.`,`Сравниваем ${a.n*b.d} и ${b.n*a.d}.`,`${text(a)} ${symbol} ${text(b)}.`],format:'Введи один знак: <, > или =.',verify:a=>/^[<>=]$/.test(a.trim())?status(a.trim()===symbol):unsupported('Нужен один знак: <, > или =.')});
  }catch{return null;}
}
export function solveProportion(question) {
  try {const q=clean(question).replace(/^пропорция\s*:?\s*/,'');const slot='(x|[+-]?\\d{1,6}(?:[.,]\\d{1,6})?)';const m=new RegExp(`^${slot}\\s*[/:]\\s*${slot}\\s*=\\s*${slot}\\s*[/:]\\s*${slot}$`).exec(q);if(!m)return null;
    const values=m.slice(1);if(values.filter(v=>v==='x').length!==1)return null;const index=values.indexOf('x');const p=values.map(v=>v==='x'?null:numeric(v).value);
    if((p[1]&&!p[1].n)||(p[3]&&!p[3].n))return null;
    const expected=index===0?div(mul(p[1],p[2]),p[3]):index===1?div(mul(p[0],p[3]),p[2]):index===2?div(mul(p[0],p[3]),p[1]):div(mul(p[1],p[2]),p[0]);
    if([1,3].includes(index)&&!expected.n)return null;
    return result({title:'Решаем пропорцию',rule:'В пропорции с ненулевыми знаменателями произведения крест-накрест равны.',expected,verify:numericVerifier(expected),format:'Значение x. Знаменатель не может быть равен нулю.',
      steps:[`${values[0]} * ${values[3]} = ${values[1]} * ${values[2]}.`,`Выражаем неизвестный множитель: x = ${text(expected)}.`,`Подставь x в обе исходные дроби; их значения равны.`]});
  }catch{return null;}
}
export const UNITS={мм:['length',R(1,1000)],см:['length',R(1,100)],м:['length',R(1)],км:['length',R(1000)],с:['time',R(1)],мин:['time',R(60)],ч:['time',R(3600)],г:['mass',R(1,1000)],кг:['mass',R(1)],т:['mass',R(1000)]};
function quantity(s){const m=/^(.+?)\s*(мм|см|км|м|мин|ч|с|кг|г|т)$/.exec(s.trim());if(!m)return null;return {value:numeric(m[1]).value,unit:m[2],dimension:UNITS[m[2]][0],factor:UNITS[m[2]][1]};}
export function solveConversion(question) {
  try {const q=clean(question).replace(/^переведи\s+/,'');let m;
    if((m=/^(.+?)\s+в\s+(мм|см|км|м|мин|ч|с|кг|г|т)$/.exec(q))){const from=quantity(m[1]),target=UNITS[m[2]];if(!from||from.dimension!==target[0])return null;const base=mul(from.value,from.factor),expected=div(base,target[1]);
      return result({title:'Переводим единицы',rule:'Сначала проверь, что обе единицы измеряют одну величину. Затем используй их точное соотношение.',expected,expectedText:`${text(expected)} ${m[2]}`,format:`Число в ${m[2]} или равное ему значение с другой единицей той же величины.`,
        steps:[`1 ${from.unit} соответствует ${text(div(from.factor,target[1]))} ${m[2]}.`,`${m[1]} = ${text(expected)} ${m[2]}.`],verify:a=>{try{const v=quantity(clean(a));if(v)return v.dimension!==from.dimension?{...status(false),text:'Единицы относятся к разным величинам: проверь длину, время или массу.'}:status(eq(mul(v.value,v.factor),base));return numericVerifier(expected)(a);}catch{return unsupported('Укажи число и единицу, например 2,5 м.');}}});
    }
    if((m=/^(.+?)\s+в\s+(проценты|дробь|десятичную дробь)$/.exec(q))){const percent=/%$/.test(m[1]),value=numeric(m[1].replace(/%$/,'')).value;const fraction=percent?div(value,R(100)):value;const expected=m[2]==='проценты'?mul(fraction,R(100)):fraction;
      const places=finitePlaces(expected);if(m[2]==='десятичную дробь'&&places===null)return null;
      return result({title:'Дробь, десятичная запись и процент',rule:'Один процент равен 1/100. При переходе от доли к процентам умножаем на 100.',expected,format:m[2]==='проценты'?'Число процентов, можно со знаком %.':m[2]==='дробь'?'Обыкновенная дробь или равное ей число.':'Конечная десятичная дробь.',
        steps:[`Исходная доля: ${text(fraction)}.`,`Результат: ${m[2]==='десятичную дробь'?decimalText(expected,places):text(expected)}${m[2]==='проценты'?'%':''}.`],verify:numericVerifier(expected,{unit:m[2]==='проценты'?'%':'',format:m[2]==='десятичную дробь'?'decimal':undefined})});
    }
    return null;
  }catch{return null;}
}
function factor(p) {
  if(p.length<2||p.some(v=>v.d!==1n)||p.some(v=>abs(v.n)>1000000n))return null;
  const original=p;let coeff=p.map(v=>v.n),g=coeff.reduce((a,b)=>gcd(a,b),0n);if(coeff.at(-1)<0n)g=-g;
  coeff=coeff.map(n=>n/g);let zeros=0;while(coeff.length>1&&coeff[0]===0n){zeros++;coeff.shift();}
  const factors=[];if(g!==1n)factors.push(String(g));if(zeros)factors.push(zeros===1?'x':`x^${zeros}`);
  while(coeff.length>2){const candidates=new Set();const c=abs(coeff[0]);for(let d=1n;d*d<=c;d++)if(c%d===0n){candidates.add(d);candidates.add(-d);candidates.add(c/d);candidates.add(-c/d);}
    let root=null;for(const candidate of candidates)if(pAt(coeff.map(n=>R(n)),R(candidate)).n===0n){root=candidate;break;}if(root===null)break;
    const next=Array(coeff.length-1).fill(0n);next[next.length-1]=coeff.at(-1);for(let i=next.length-2;i>=0;i--)next[i]=coeff[i+1]+root*next[i+1];
    factors.push(`(x${root<0n?'+':'-'}${abs(root)})`);coeff=next;
  }
  if(coeff.length>1)factors.push(`(${pText(coeff.map(n=>R(n)))})`);else if(coeff[0]!==1n)factors.push(String(coeff[0]));
  if(factors.length<2)return null;
  const expression=factors.join('*');if(!pEqual(polynomial(expression).p,original))throw Error('FACTOR_RECONSTRUCTION');return expression;
}
function simplifiedForm(a) {
  const s=clean(a).replace(/\s+/g,'').replace(/\([+-]?\d+\/\d+\)/g,'C');
  if(/[()]/.test(s))return false;
  const terms=s.match(/[+-]?[^+-]+/g)||[],degrees=new Set();
  for(const term of terms){const t=term.replace(/^[+-]/,'');let degree;
    if(/^(?:(?:\d+(?:[.,]\d+)?|C)\*?)?x(?:\^[1-4])?$/.test(t))degree=Number(/\^(\d)$/.exec(t)?.[1]||1);
    else if(/^(?:\d+(?:[.,]\d+)?(?:\/\d+)?|C)$/.test(t))degree=0;
    else return false;
    if(degrees.has(degree))return false;degrees.add(degree);
  }
  return terms.length>0;
}
export function solvePolynomial(question) {
  try {const m=/^(упрости|разложи(?: на множители)?)\s*:?\s*(.+)$/.exec(clean(question));if(!m)return null;const p=polynomial(m[2]).p;const factoring=m[1].startsWith('разложи'),answer=factoring?factor(p):pText(p);if(!answer)return null;
    return result({title:factoring?'Раскладываем на множители':'Приводим подобные слагаемые',rule:factoring?'Ищи общий множитель, затем проверь формулы и группировку. Раскрытие скобок должно вернуть исходное выражение.':'Раскрой скобки, сохраняя знаки, и складывай коэффициенты только у одинаковых степеней x.',expectedText:answer,
      steps:[`После приведения подобных: ${pText(p)}.`,`${factoring?'Разложение':'Ответ'}: ${answer}.`,'Проверь равенство коэффициентов после раскрытия скобок.'],format:factoring?'Произведение множителей со скобками, например (x-3)*(x+3).':'Упрощённый многочлен с x, например 4x+2.',verify:a=>{try{const candidate=polynomial(a).p;if(!pEqual(candidate,p))return status(false);if(factoring&&!nontrivialProduct(a))return unsupported('Нужен ответ в виде нетривиального произведения множителей.');if(!factoring&&!simplifiedForm(a))return {...status(true,'step'),text:'Равенство верно. Теперь раскрой оставшиеся скобки и приведи подобные слагаемые.'};return status(true);}catch{return unsupported('Запиши многочлен с x, скобками и целыми степенями до 4.');}}});
  }catch{return null;}
}
export function solveFoundation(topic,q) {return ({arithmetic:solveArithmetic,comparison:solveComparison,proportions:solveProportion,conversions:solveConversion,polynomials:solvePolynomial}[topic])?.(q)||null;}

/*
  Независимая проверка задания 12 (расчёты по формулам) для гейта OGE_COURSE_03D_ALGEBRA.
  Формулу задачи гейт разбирает сам из строки, которую видит ученик
  («S = v · t», «E = m · v² / 2» этажной дробью, «a = √S»), подставляет числа
  из подписей букв и ответ тренажёра и проверяет равенство точно, на рациональных
  числах. Выражения тренажёра (ans = v*t и т. п.) в проверке не участвуют.
*/
import { R, add, sub, mul, div, neg, eq, sqrtExact } from './oge-algebra-contract.lib.mjs';

/* «12», «−5», «0,012», «1 200» (с узкими пробелами) → рациональное */
export function num(s) {
  s = String(s).replace(/[    ]/g, '').replace(/[−–]/g, '-');
  const m = /^(-?)(\d+)(?:[.,](\d+))?$/.exec(s);
  if (!m) return null;
  const fr = m[3] || '', den = 10n ** BigInt(fr.length);
  return R((m[1] ? -1n : 1n) * (BigInt(m[2]) * den + BigInt(fr || '0')), den);
}
/* JS-число тренажёра (после r6) → рациональное по десятичной записи */
export function fromJs(x) {
  if (typeof x !== 'number' || !isFinite(x)) return null;
  let s = String(x);
  if (/e/i.test(s)) s = x.toFixed(12).replace(/0+$/, '').replace(/\.$/, '');
  return num(s);
}
/* этажная дробь тренажёра → (A)/(B); прочая разметка снимается */
export function plain(html) {
  let s = String(html);
  for (let i = 0; i < 5; i++) s = s.replace(/<span class="fr"><span>([^<]*)<\/span><span>([^<]*)<\/span><\/span>/g, '($1)/($2)');
  return s.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
}
/* конечная десятичная запись без знака: 3/250 → «0,012» */
export function decStr(v) {
  const a = v.n < 0n ? -v.n : v.n;
  if (v.d === 1n) return a.toString();
  let k = 0, D = 1n;
  while (D % v.d !== 0n) { D *= 10n; k++; if (k > 12) return null; }
  const qs = (a * (D / v.d)).toString().padStart(k + 1, '0');
  return qs.slice(0, qs.length - k) + ',' + qs.slice(qs.length - k);
}

/* лексер: буквы с индексами (L₀, t₂), числа, операции */
function lex(s) {
  const out = [];
  const re = /(?:([A-Za-zα-ωΔ][₀-₉]*)|(\d+(?:,\d+)?)|(·|×|\*|\+|−|-|\/|\(|\)|²|√))/y;
  s = s.trim();
  let i = 0;
  while (i < s.length) {
    if (s[i] === ' ') { i++; continue; }
    re.lastIndex = i;
    const m = re.exec(s);
    if (!m) throw new Error('не разобран символ «' + s.slice(i, i + 5) + '»');
    if (m[1]) out.push({ k: 'id', v: m[1] });
    else if (m[2]) out.push({ k: 'n', v: num(m[2]) });
    else out.push({ k: 'op', v: m[3] });
    i = re.lastIndex;
  }
  return out;
}
/* разбор выражения в дерево: сумма → произведение → множитель (√, ², скобки, унарный минус) */
function parse(tokens) {
  let p = 0;
  const peek = () => tokens[p], take = () => tokens[p++];
  const isOp = (t, re) => t && t.k === 'op' && re.test(t.v);
  function expr() {
    let n = term();
    while (isOp(peek(), /^[+−-]$/)) { const o = take().v; n = { o: o === '+' ? '+' : '-', a: n, b: term() }; }
    return n;
  }
  function term() {
    let n = factor();
    while (isOp(peek(), /^[·×*\/]$/)) { const o = take().v; n = { o: o === '/' ? '/' : '*', a: n, b: factor() }; }
    return n;
  }
  function factor() {
    const t = take();
    if (!t) throw new Error('обрыв выражения');
    let n;
    if (isOp(t, /^√$/)) n = { o: 'sqrt', a: factor() };
    else if (isOp(t, /^[−-]$/)) n = { o: 'neg', a: factor() };
    else if (isOp(t, /^\($/)) { n = expr(); if (!isOp(take(), /^\)$/)) throw new Error('нет «)»'); }
    else if (t.k === 'n') n = { o: 'num', v: t.v };
    else if (t.k === 'id') n = { o: 'id', v: t.v };
    else throw new Error('неожиданное «' + t.v + '»');
    while (isOp(peek(), /^²$/)) { take(); n = { o: '*', a: n, b: n }; }
    return n;
  }
  const tree = expr();
  if (p !== tokens.length) throw new Error('лишнее в конце выражения');
  return tree;
}
function evalT(n, env) {
  switch (n.o) {
    case 'num': return n.v;
    case 'id': { if (!(n.v in env)) throw new Error('нет значения буквы ' + n.v); return env[n.v]; }
    case '+': return add(evalT(n.a, env), evalT(n.b, env));
    case '-': return sub(evalT(n.a, env), evalT(n.b, env));
    case '*': return mul(evalT(n.a, env), evalT(n.b, env));
    case '/': return div(evalT(n.a, env), evalT(n.b, env));
    case 'neg': return neg(evalT(n.a, env));
    case 'sqrt': { const r = sqrtExact(evalT(n.a, env)); if (!r) throw new Error('корень не извлекается точно'); return r; }
  }
  throw new Error('узел ' + n.o);
}
export function equation(formulaHtml) {
  const parts = plain(formulaHtml).split(/=|≈/);
  if (parts.length !== 2) throw new Error('в формуле не один знак «=»');
  return { lhs: parse(lex(parts[0])), rhs: parse(lex(parts[1])) };
}
export function evalExpr(text, env) { return evalT(parse(lex(plain(text))), env); }

/* значение из подписи буквы: «скорость, 12 км/ч» → 12; «путь (это ищем)», «— её не спрашивают» → нет */
export function labelValue(lab) {
  const m = /,\s*(−?\d[\d   ]*(?:,\d+)?)(?=\s|$)/.exec(String(lab));
  return m ? num(m[1]) : null;
}
/* число названо в условии (разрядные пробелы любые) */
export function shows(text, v) {
  const s = decStr(v);
  if (s === null) return false;
  const t = plain(text).replace(/(\d)[    ](?=\d)/g, '$1').replace(/−/g, '-');
  const esc = s.replace(/,/g, ',');
  return new RegExp('(^|[^\\d,])' + (v.n < 0n ? '-' : '') + esc + '(?![\\d]|,\\d)').test(t);
}
const ratTxt = (v) => (v.n < 0n ? '−' : '') + (v.n < 0n ? -v.n : v.n) + '/' + v.d;

/*
  check(task) → список нарушений (пустой — всё сошлось).
  task: { t, target, answer, story, formula, letters:[{n, lab}], subst }
*/
export function check(task) {
  const errs = [];
  let eqn;
  try { eqn = equation(task.formula); } catch (e) { return ['формула «' + plain(task.formula) + '»: ' + e.message]; }
  const ans = fromJs(task.answer);
  if (!ans) return ['ответ не число'];
  const env = {};
  for (const L of task.letters || []) {
    if (L.n === task.target) continue;
    const v = labelValue(L.lab);
    if (v) env[L.n] = v;
  }
  env[task.target] = ans;
  try {
    const l = evalT(eqn.lhs, env), r = evalT(eqn.rhs, env);
    if (!eq(l, r)) errs.push('формула не выполняется: ' + plain(task.formula) + ' при ' + Object.entries(env).map(([k, v]) => k + '=' + ratTxt(v)).join(', '));
  } catch (e) { errs.push('подстановка: ' + e.message); }
  // все данные задачи названы в условии
  for (const [k, v] of Object.entries(env)) if (k !== task.target && !shows(task.story, v)) errs.push('число ' + k + ' = ' + ratTxt(v) + ' не найдено в условии');
  // «Собери подстановку»: шаблон с окошками даёт ответ
  if (task.subst) {
    try {
      const vals = task.subst.vals.map(fromJs);
      const tpl = plain(task.subst.tpl).replace(/%(\d)/g, (m, i) => '(' + ratTxt(vals[+i]) + ')');
      const rhs = tpl.split(/=|≈/)[1];
      if (!eq(evalExpr(rhs, {}), ans)) errs.push('шаблон подстановки не даёт ответ');
    } catch (e) { errs.push('шаблон подстановки: ' + e.message); }
  }
  return errs;
}

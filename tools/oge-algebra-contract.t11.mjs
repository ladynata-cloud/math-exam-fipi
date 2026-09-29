/*
  Независимая проверка задания 11 (графики функций) для гейта OGE_COURSE_03D_ALGEBRA.
  Гейт сам разбирает формулу пункта, как её видит ученик («y = −2x² + 4x − 1»,
  «y = −6/x», «y = √x + 1», «a > 0, c < 0»), и сверяет её с ломаной на
  чертеже (SVG): каждая точка ломаной переводится обратно в координаты и должна
  лежать на графике формулы. Так проверяется, что чертёж построен по числам
  задачи и что буква сопоставлена с нужным номером графика.
*/

/* разметка формулы → строка для разбора */
export function plainFormula(html) {
  return String(html)
    .replace(/<sup>2<\/sup>/g, '²')
    .replace(/<span class="frac"><span class="fn">([^<]*(?:<i>[^<]*<\/i>)?[^<]*)<\/span><span class="fd">([^<]*(?:<i>[^<]*<\/i>)?[^<]*)<\/span><\/span>/g, '($1)/($2)')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&gt;/g, '>').replace(/&lt;/g, '<')
    .replace(/−/g, '-').replace(/\s+/g, ' ').trim();
}

/* разбор правой части «y = …» с неявным умножением (2x, −3x², (1/2)x) → функция x ↦ y */
export function parseRhs(s) {
  let p = 0;
  const ws = () => { while (s[p] === ' ') p++; };
  function expr() {
    let f = term();
    for (;;) { ws(); const c = s[p]; if (c === '+' || c === '-') { p++; const g = term(); const h = f; f = c === '+' ? (x) => h(x) + g(x) : (x) => h(x) - g(x); } else return f; }
  }
  function term() {
    let f = unary();
    for (;;) {
      ws(); const c = s[p];
      if (c === '/') { p++; const g = unary(); const h = f; f = (x) => h(x) / g(x); }
      else if (c === '·' || c === '*') { p++; const g = unary(); const h = f; f = (x) => h(x) * g(x); }
      else if (c === 'x' || c === '(' || c === '√' || (c >= '0' && c <= '9')) { const g = unary(); const h = f; f = (x) => h(x) * g(x); }   // неявное умножение
      else return f;
    }
  }
  function unary() { ws(); if (s[p] === '-') { p++; const g = unary(); return (x) => -g(x); } return power(); }
  function power() {
    let f = atom();
    ws();
    while (s[p] === '²') { p++; const h = f; f = (x) => h(x) * h(x); ws(); }
    return f;
  }
  function atom() {
    ws();
    const c = s[p];
    if (c === '(') { p++; const f = expr(); ws(); if (s[p] !== ')') throw new Error('нет «)»'); p++; return f; }
    if (c === '√') { p++; const g = power(); return (x) => Math.sqrt(g(x)); }
    if (c === 'x') { p++; return (x) => x; }
    const m = /^\d+(?:,\d+)?/.exec(s.slice(p));
    if (m) { p += m[0].length; const v = parseFloat(m[0].replace(',', '.')); return () => v; }
    throw new Error('не разобрано «' + s.slice(p, p + 6) + '»');
  }
  const f = expr();
  ws();
  if (p !== s.length) throw new Error('лишнее «' + s.slice(p) + '»');
  return f;
}

/* пункт задачи: {kind:'signs', a, c} (тип t41) или {kind:'fn', f, fam} */
export function parseItem(descHtml) {
  const s = plainFormula(descHtml);
  const sg = /^a ([<>]) 0, c ([<>]) 0$/.exec(s);
  if (sg) return { kind: 'signs', a: sg[1] === '>' ? 1 : -1, c: sg[2] === '>' ? 1 : -1 };
  const m = /^y = (.+)$/.exec(s);
  if (!m) throw new Error('не формула: «' + s + '»');
  const rhs = m[1];
  const fam = /√/.test(rhs) ? 'root' : /\/\(?x\)?/.test(rhs) ? 'hyp' : /x²/.test(rhs) ? 'par' : /x/.test(rhs) ? 'lin' : 'const';
  return { kind: 'fn', f: parseRhs(rhs), fam, rhs };
}

/* ломаные чертежа в мировых координатах (обратное преобразование svgGraph тренажёра) */
export function graphPoints(svg, range = 6) {
  const vb = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
  if (!vb) throw new Error('нет viewBox');
  const W = +vb[1], world = range + 0.8, sc = W / (2 * world);
  const lines = [...svg.matchAll(/<polyline[^>]*points="([^"]*)"/g)].map((m) =>
    m[1].trim().split(/\s+/).map((pr) => { const [a, b] = pr.split(',').map(Number); return { x: a / sc - world, y: world - b / sc }; }));
  return { lines, sc, world };
}

/* признаки пункта, по которым ученик различает графики (для диагностики и уникальности) */
export function features(type, it) {
  if (it.kind === 'signs') return { a: it.a, c: it.c };
  const f = it.f;
  if (type === 't42') { const a = (f(1) + f(-1) - 2 * f(0)) / 2, b = (f(1) - f(-1)) / 2; return { a: Math.sign(a), side: Math.sign(-b / (2 * a)) }; }
  if (type === 't43') return { k: Math.sign(f(1) - f(0)), b: Math.sign(f(0)) };
  if (type === 't44') { const m = f(1); return { q: Math.sign(m), m: Math.abs(m) }; }
  return { fam: it.fam };
}

/*
  check(task) → список нарушений.
  task: { type, items:[{desc}], key:[3], order:[3], svgs:[3] } — svgs[pos] нарисован для пункта order[pos].
*/
export function check(task) {
  const errs = [];
  const items = task.items.map((it, i) => { try { return parseItem(it.desc); } catch (e) { errs.push('пункт ' + i + ': ' + e.message); return null; } });
  if (errs.length) return errs;
  // ключ: буква i → график с номером key[i], на нём нарисован пункт i
  task.items.forEach((_, i) => { if (task.order[task.key[i] - 1] !== i) errs.push('ключ: буква ' + i + ' → ' + task.key[i] + ', а там пункт ' + task.order[task.key[i] - 1]); });
  // пункты различимы по признакам
  const fs = items.map((it) => JSON.stringify(features(task.type, it)));
  if (new Set(fs).size !== 3) errs.push('два пункта с одинаковыми признаками: ' + fs.join(' | '));
  // чертёж каждого номера — график своего пункта
  task.svgs.forEach((svg, pos) => {
    const it = items[task.order[pos]];
    if (/NaN|undefined|Infinity/.test(svg)) { errs.push('график ' + (pos + 1) + ': NaN/undefined в SVG'); return; }
    const { lines, sc } = graphPoints(svg);
    const pts = lines.flat();
    if (pts.length < 40) { errs.push('график ' + (pos + 1) + ': слишком мало точек (' + pts.length + ')'); return; }
    if (it.kind === 'signs') {
      // парабола из трёх далёких точек самой длинной ломаной: знак a — выпуклость, знак c — значение в нуле
      const L = lines.reduce((u, v) => (v.length > u.length ? v : u), []);
      const P = [L[Math.floor(L.length * 0.1)], L[Math.floor(L.length * 0.5)], L[Math.floor(L.length * 0.9)]];
      const [p1, p2, p3] = P, d1 = (p2.y - p1.y) / (p2.x - p1.x), d2 = (p3.y - p2.y) / (p3.x - p2.x);
      const a = (d2 - d1) / (p3.x - p1.x), b = d1 - a * (p1.x + p2.x), c = p1.y - a * p1.x * p1.x - b * p1.x;
      if (Math.sign(a) !== it.a || Math.sign(c) !== it.c) errs.push('график ' + (pos + 1) + ': знаки на чертеже (a ' + Math.sign(a) + ', c ' + Math.sign(c) + ') не те, что в пункте');
      return;
    }
    // точка ломаной лежит на графике: в полосе ±dx по x кривая проходит через её y (с допуском dy)
    let off = 0, first = '';
    const dx = 0.08 / sc, dy = 0.08 / sc;
    for (const q of pts) {
      let ok = false, lo = Infinity, hi = -Infinity;
      for (let j = -10; j <= 10 && !ok; j++) {
        const v = it.f(q.x + (j / 10) * dx) - q.y;
        if (!Number.isFinite(v)) continue;
        if (Math.abs(v) <= dy) ok = true;
        lo = Math.min(lo, v); hi = Math.max(hi, v);
      }
      if (!ok && !(lo < 0 && hi > 0)) { off++; if (!first) first = '(' + q.x.toFixed(2) + '; ' + q.y.toFixed(2) + ')'; }
    }
    if (off) errs.push('график ' + (pos + 1) + ': ' + off + ' точек не на графике «' + it.rhs + '», первая ' + first);
  });
  return errs;
}

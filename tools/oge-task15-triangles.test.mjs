#!/usr/bin/env node
/*
  Гейт OGE_COURSE_03B_TASK15: тренажёр задания 15 «Треугольники».
  Голый Node 18+, без зависимостей и сети:
    node tools/oge-task15-triangles.test.mjs
  Маркер успеха: OGE_TASK15_GATE_OK; при ошибке — список провалов и код 1.

  Что проверяется (спецификация docs/tasks/OGE_COURSE_03B_TASK15.md и решения
  делегата владельца в её Execution record):
   1. синтаксис встроенного скрипта, файл самодостаточен (нет внешних ресурсов);
   2. общие блоки SHEET_MAP и SELFTEST_KIT побайтно равны копиям тренажёров 03A;
   3. ?selftest=1 печатает OGE_TASK15_SELFTEST_OK и не пишет в хранилище;
   4. реестр: TYPE_IDS = TYPES = ключи SUBS, имена типов = NAMES, review:true;
   5. независимый пересчёт ответа по тексту условия (oge-task15-triangles.solve.mjs):
      1000 задач на тип и прототип разбора; ответ — конечная десятичная дробь;
   6. чертёж строится по числам задачи: углы треугольника ABC, измеренные по
      пикселям вершин чертежа, совпадают с построением решателя; 3-4-5 и 5-12-13
      различаются пропорциями;
   7. ловушки: не совпадают с ответом и между собой, у каждого типа не меньше
      двух; подсказки и ловушки не называют число ответа (D20); доля задач с
      полным набором ловушек не ниже 70 % (D7);
   8. лестницы: последняя ступень — ответ, каждая ступень показывает свой
      результат; строка над лестницей — дословно (D3);
   9. тексты: не повторяют 6 слов подряд архив v13, старую страницу 15 и
      аналог демоверсии 2027; стоп-лист форм; «Ответ дайте в градусах» ровно в
      угловых задачах;
  10. разнообразие: число разных условий на тип;
  11. контракт прогресса: ядро и порог, журнал, повтор, мусор, две вкладки, ?seed;
  12. старая страница — перенаправление, ссылки курса ведут на тренажёр;
  13. доступность в разметке: переход к заданию, reduced-motion, печать, aria-live.
*/
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { ROOT, KEY, readTrainer, syntaxCheck, loadTrainer, makeStorage, readKey, JUNK_KEY, JUNK_REC, near } from './oge-geometry-contract.lib.mjs';
import { solve, shapeFixed, plainText, angle } from './oge-task15-triangles.solve.mjs';

const FILE = 'trainers/oge-task15-triangles.html', TID = 'oge-t15-treugolniki', N = 1000, SEED = 20260929;
/* отпечатки чужих текстов: SHA-1 шестисловий (самих текстов в базе нет) */
const FP_FILE = 'tools/oge-task15-triangles.fingerprints.json';
const sha1 = (s) => crypto.createHash('sha1').update(s).digest('hex');
const words = (s) => plainText(s).toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9√°]+/g, ' ').trim().split(' ').filter(Boolean);
/* node tools/oge-task15-triangles.test.mjs --make-fingerprints <ref>: база из трёх источников —
   фиксированные задачи архива v13 (arc*_15), старая страница задания 15 в <ref> (до
   перенаправления) и задача 15 авторского аналога демоверсии 2027 */
if (process.argv[2] === '--make-fingerprints') {
  const ref = process.argv[3];
  if (!ref) { console.log('укажите ref: --make-fingerprints <ref>'); process.exit(1); }
  const show = (p) => execFileSync('git', ['-C', ROOT, 'show', ref + ':' + p], { encoding: 'utf8', maxBuffer: 64 << 20 });
  const src = [];
  for (const m of show('trainers/archive-5-weeks/oge15-trainer-v13-850f039a.html').matchAll(/\{id:'arc[^']*_15'[\s\S]*?text:'([^']*)'/g)) src.push(m[1]);
  src.push(...(show('oge/geometry/task-15-external-angle.html').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').match(/[^<>]{20,}/g) || []));
  src.push(...(show('trainers/oge-2027-analogue-1.html').match(/Отрезок AK делит угол A[^'"<]*/g) || []));
  const set = new Set();
  for (const s of src) { const w = words(s); for (let i = 0; i + 6 <= w.length; i++) set.add(sha1(w.slice(i, i + 6).join(' '))); }
  fs.writeFileSync(path.join(ROOT, FP_FILE), JSON.stringify({ ref, sources: src.length, note: 'SHA-1 шестисловий: архив v13 arc*_15, старая oge/geometry/task-15-external-angle.html, аналог 2027 №15', sha1: [...set].sort() }, null, 1) + '\n');
  console.log('база отпечатков: источников ' + src.length + ', шестисловий ' + set.size + ' → ' + FP_FILE);
  process.exit(0);
}
const html = readTrainer(FILE);
let fails = 0, checks = 0;
const failed = [];
function ok(cond, sec, msg) { checks++; if (!cond) { fails++; failed.push('[' + sec + '] ' + msg); } }
function section(title, fn) {
  const before = fails, t0 = Date.now();
  try { fn(); } catch (e) { ok(false, title, 'исключение: ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e)); }
  console.log((fails === before ? 'ok  ' : 'FAIL') + '  ' + title + '  (' + (Date.now() - t0) + ' мс)');
}
const J = (T, code) => JSON.parse(T.run('JSON.stringify(' + code + ')'));
const fmt = (x) => String(Math.round(x * 1e6) / 1e6).replace('.', ',');
const finDec = (x) => Number.isFinite(x) && Math.abs(Math.round(x * 1000) - x * 1000) < 1e-6;
/* число ступени: конечная дробь до десятитысячных (например, cos²A = 0,9216) */
const stepDec = (x) => Number.isFinite(x) && Math.abs(Math.round(x * 1e4) - x * 1e4) < 1e-6;
const ANGLE_TYPES = ['angSum', 'extAng', 'isoBase', 'isoApex', 'bisIso', 'bisExt', 'twoExt', 'bisAlt', 'altAlt', 'rtAcute'];
const LADDER_NOTE = 'Подсказки ничего не отнимают. «Показать шаг» открывает результат ступени — после этого задача в счёт решённых не пойдёт (промахом это не считается). Ответ задачи — на последней ступени.';

/* числа текста; noDeg — без чисел с «°» */
function nums(h, noDeg) { const r = []; plainText(h).replace(/(\d+(?:[.,]\d+)?)(\s*°)?/g, (m, x, d) => { if (!(noDeg && d)) r.push(parseFloat(x.replace(',', '.'))); return m; }); return r; }
/* наложение подписей: рамка текста по числу знаков (≈ 0,6 кегля на знак Georgia bold);
   возвращает первую пару налезающих подписей или '' */
function textClashes(svg) {
  const L = [...svg.matchAll(/<text x="(-?[\d.]+)" y="(-?[\d.]+)"[^>]*font-size="([\d.]+)"[^>]*text-anchor="(\w+)"[^>]*>([\s\S]*?)<\/text>/g)].map((m) => {
    const t = m[5].replace(/<[^>]*>/g, ''), w = 0.6 * +m[3] * t.length + 2, x0 = m[4] === 'middle' ? +m[1] - w / 2 : m[4] === 'end' ? +m[1] - w : +m[1];
    return { t, x0, x1: x0 + w, y0: +m[2] - 0.74 * +m[3], y1: +m[2] + 0.12 * +m[3] };
  });
  for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
    const a = L[i], b = L[j];
    if (a.x0 < b.x1 - 1 && b.x0 < a.x1 - 1 && a.y0 < b.y1 - 1 && b.y0 < a.y1 - 1) return a.t + ' / ' + b.t;
  }
  return '';
}
/* принадлежность подписей: подпись угла (data-of="A") и буква точки ближе к своей точке, чем
   к любой другой отмеченной; подпись отрезка (data-of="B-H") ближе к своему отрезку, чем к
   любому другому отрезку чертежа (линии короче 14 px — засечки — не считаются);
   возвращает первую подпись не на своём месте или '' */
const segDist = (P, A, B) => {
  const ux = B.x - A.x, uy = B.y - A.y, l2 = ux * ux + uy * uy || 1;
  const t = Math.max(0, Math.min(1, ((P.x - A.x) * ux + (P.y - A.y) * uy) / l2));
  return Math.hypot(P.x - A.x - ux * t, P.y - A.y - uy * t);
};
function textOwners(svg) {
  const P = vertices(svg);
  const dd = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const lines = [...svg.matchAll(/<line x1="(-?[\d.]+)" y1="(-?[\d.]+)" x2="(-?[\d.]+)" y2="(-?[\d.]+)"/g)]
    .map((m) => [{ x: +m[1], y: +m[2] }, { x: +m[3], y: +m[4] }]).filter(([a, b]) => dd(a, b) >= 14);
  const same = (a, b, c, d) => (dd(a, c) < 1 && dd(b, d) < 1) || (dd(a, d) < 1 && dd(b, c) < 1);
  for (const m of svg.matchAll(/<text x="(-?[\d.]+)" y="(-?[\d.]+)"(?: data-of="([A-Z]\d?(?:-[A-Z]\d?)?)")?[^>]*font-size="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g)) {
    const t = m[5].replace(/<[^>]*>/g, ''), of = m[3] || (P[t] ? t : null);
    if (!of) continue;
    const c = { x: +m[1], y: +m[2] - 0.32 * +m[4] };
    if (of.includes('-')) {
      const [p, q] = of.split('-');
      if (!P[p] || !P[q]) continue;
      const d0 = segDist(c, P[p], P[q]);
      if (lines.some(([a, b]) => !same(a, b, P[p], P[q]) && segDist(c, a, b) < d0 - 1)) return t + ' (свой отрезок ' + of + ', ближе другая линия)';
    } else {
      if (!P[of]) continue;
      const d0 = dd(c, P[of]);
      for (const q in P) if (q !== of && dd(c, P[q]) < d0) return t + ' (своя точка ' + of + ', ближе ' + q + ')';
    }
  }
  return '';
}
/* вершины чертежа: <circle data-v="A" cx=… cy=…> */
function vertices(svg) {
  const P = {};
  for (const m of svg.matchAll(/<circle data-v="([A-Z]\d?)" cx="(-?[\d.]+)" cy="(-?[\d.]+)"/g)) P[m[1]] = { x: +m[2], y: +m[3] };
  return P;
}

/* 1. синтаксис, самодостаточность */
section('1. синтаксис встроенного скрипта; файл самодостаточен', () => {
  const errs = syntaxCheck(html);
  ok(!errs.length, '1', errs.join(' | '));
  ok(!/<script[^>]+src=/i.test(html), '1', 'внешний скрипт');
  ok(!/<link[^>]+href=/i.test(html), '1', 'внешняя таблица стилей или шрифт');
  ok(!/@import|url\(\s*['"]?https?:/i.test(html), '1', '@import или внешний url() в стилях');
  ok(!/https?:\/\/(?!www\.w3\.org\/2000\/svg)/.test(html), '1', 'ссылка на внешний адрес');
  ok(!/user-scalable\s*=\s*no|maximum-scale\s*=\s*1(?![.\d])/.test(html), '1', 'запрет масштабирования');
});

/* 2. общие блоки */
section('2. SHEET_MAP и SELFTEST_KIT — побайтные копии блоков 03A', () => {
  const t16 = readTrainer('trainers/oge-task16-circle.html');
  for (const [a, b] of [['/*__SHEET_MAP_START__*/', '/*__SHEET_MAP_END__*/'], ['/*__SELFTEST_KIT_START__*/', '/*__SELFTEST_KIT_END__*/']]) {
    const cut = (s) => { const i = s.indexOf(a), j = s.indexOf(b); return i >= 0 && j > i && s.split(a).length === 2 ? s.slice(i, j + b.length) : null; };
    ok(cut(html) && cut(html) === cut(t16), '2', 'блок ' + a + ' отличается от копии в 16 или не один');
  }
  ok(!/data:image\//.test(html), '2', 'встроенная картинка data:image');
});

/* 3. самопроверка */
section('3. ?selftest=1: маркер в консоли, хранилище не тронуто', () => {
  const S = makeStorage();
  const T = loadTrainer(FILE, { storage: S, search: '?selftest=1', seed: 5 });
  const mk = T.logs.filter(l => /_SELFTEST_(OK|FAIL)/.test(l));
  ok(mk.length === 1 && mk[0] === 'OGE_TASK15_SELFTEST_OK', '3', 'маркер «' + mk.join(' | ') + '» ' + T.logs.filter(l => /^  /.test(l)).slice(0, 5).join(' | '));
  ok(S.map.size === 0, '3', 'в ?selftest=1 записано в хранилище');
});

/* 4. реестр */
const RV = (() => { const src = fs.readFileSync(path.join(ROOT, 'oge/registry.js'), 'utf8'); const m = { exports: {} }; new Function('module', 'exports', src)(m, m.exports); return m.exports; })();
section('4. реестр курса: типы, имена, режим повтора', () => {
  const T = loadTrainer(FILE, { seed: 1 });
  const ids = J(T, 'TYPE_IDS'), keys = J(T, 'Object.keys(SUBS)'), names = J(T, 'TYPE_IDS.map(k=>SUBS[k].name)');
  const inFile = JSON.parse((/\bconst\s+TYPE_IDS\s*=\s*(\[[^\]]*\])/.exec(html) || [])[1] || 'null');
  ok(JSON.stringify(ids) === JSON.stringify(RV.TYPES[TID]), '4', 'TYPE_IDS ≠ TYPES реестра');
  ok(JSON.stringify(inFile) === JSON.stringify(ids), '4', 'TYPE_IDS в тексте файла не читается реестр-тестом');
  ok(JSON.stringify(keys) === JSON.stringify(ids), '4', 'ключи SUBS ≠ TYPE_IDS');
  ok(ids.length === 26, '4', 'типов не 26: ' + ids.length);
  ids.forEach((k, i) => ok(RV.NAMES[TID + '|' + k] && RV.NAMES[TID + '|' + k].n === names[i], '4', `имя типа ${k}: «${names[i]}» ≠ реестру`));
  const tr = RV.TRAINERS[TID];
  ok(tr && tr.review === true && !tr.planned && tr.file === '../trainers/oge-task15-triangles.html', '4', 'TRAINERS: review:true, без planned, файл тренажёра');
  ok((RV.LINES['15'] || []).includes(TID), '4', 'LINES[15]');
  ok(RV.CABINET.some(r => r.tid === TID && r.adapter === 'line' && r.file === '../trainers/oge-task15-triangles.html'), '4', 'CABINET');
  ok(/var TID = "oge-t15-treugolniki";/.test(html) && /var KEY = "mathExamCourseProgress\.v1";/.test(html), '4', 'объявление TID и KEY по контракту');
});

/* 5–10. задачи: пересчёт, чертёж, ловушки, лестницы, тексты, разнообразие */
const T0 = loadTrainer(FILE, { seed: SEED });
const IDS = J(T0, 'TYPE_IDS');
const TASKS = {};
for (const k of IDS) {
  TASKS[k] = J(T0, `[build(${JSON.stringify(k)},SUBS[${JSON.stringify(k)}].proto,{kind:'proto'})].concat(Array.from({length:${N}},()=>buildGen(${JSON.stringify(k)}))).map(t=>({
    p:t.p,text:t.text,ans:t.ans,svg:t.fig.svg,full:t.full,defined:t.trapsDefined,
    diag:t.diag.map(d=>({v:d.v,m:d.m})),steps:t.steps.map(s=>({q:s.q,a:s.a,hint:s.hint||'',show:s.show}))}))`);
}
section('5. независимый пересчёт по тексту условия: 1000 задач на тип и прототип', () => {
  for (const k of IDS) {
    let bad = 0, inf = 0, ex = '';
    for (const t of TASKS[k]) {
      const r = solve(k, t.text);
      if (!near(r.ans, t.ans, 1e-6)) { bad++; ex = ex || plainText(t.text) + ' → ' + t.ans + ' / ' + r.ans; }
      if (!(t.ans > 0 && finDec(t.ans))) inf++;
    }
    ok(!bad, '5', `${k}: расхождений ${bad} ${ex}`);
    ok(!inf, '5', `${k}: ответ не конечная десятичная дробь или не положителен — ${inf}`);
  }
});
section('6. чертёж по числам: углы по пикселям = построение решателя; 3-4-5 ≠ 5-12-13', () => {
  const EQ = ['regR', 'regr', 'regArea', 'regH'];
  for (const k of IDS) {
    let bad = 0, ex = '';
    for (const t of TASKS[k]) {
      const P = vertices(t.svg), r = solve(k, t.text), msg = [];
      if (!P.A || !P.B || !P.C) { bad++; ex = ex || 'нет вершин A, B, C в чертеже'; continue; }
      if (/NaN|undefined|Infinity/.test(t.svg)) msg.push('NaN в чертеже');
      if (EQ.includes(k)) {
        for (const v of ['A', 'B', 'C']) { const o = { A: ['B', 'C'], B: ['A', 'C'], C: ['A', 'B'] }[v]; if (Math.abs(angle(P[v], P[o[0]], P[o[1]]) - 60) > 1.5) msg.push('угол ' + v + ' не 60°'); }
        const side = Math.hypot(P.A.x - P.C.x, P.A.y - P.C.y);
        for (const m of t.svg.matchAll(/<circle cx="(-?[\d.]+)" cy="(-?[\d.]+)" r="([\d.]+)" stroke="(#0d9488|#7c3aed)"/g)) {
          const want = m[4] === '#0d9488' ? 1 / Math.sqrt(3) : 1 / (2 * Math.sqrt(3));
          if (Math.abs(+m[3] / side - want) > 0.01) msg.push('радиус окружности не по стороне');
        }
      } else if (shapeFixed(k, t.text)) {
        for (const v of ['A', 'B', 'C']) {
          const o = { A: ['B', 'C'], B: ['A', 'C'], C: ['A', 'B'] }[v];
          const px = angle(P[v], P[o[0]], P[o[1]]), want = angle(r.pts[v], r.pts[o[0]], r.pts[o[1]]);
          if (!(Math.abs(px - want) <= 1.5)) msg.push(`угол ${v}: чертёж ${px.toFixed(1)}°, по условию ${want.toFixed(1)}°`);
        }
      } else if (k === 'altAlt') {
        const want = angle(r.pts.C, r.pts.A, r.pts.B), px = angle(P.C, P.A, P.B);
        if (!(Math.abs(px - want) <= 1.5)) msg.push(`угол C: чертёж ${px.toFixed(1)}°, по условию ${want.toFixed(1)}°`);
      } else if (k === 'areaBH' && P.H) {
        const want = r.ans / plainText(t.text).match(/сторона AC равна (\d+)/).slice(1).map(Number)[0];
        const px = Math.hypot(P.B.x - P.H.x, P.B.y - P.H.y) / Math.hypot(P.A.x - P.C.x, P.A.y - P.C.y);
        if (Math.abs(px - want) > 0.01 * Math.max(1, want)) msg.push('BH : AC на чертеже не по условию');
      }
      const cl = textClashes(t.svg);
      if (cl) msg.push('подписи налезают друг на друга: ' + cl);
      const ow = textOwners(t.svg);
      if (ow) msg.push('подпись стоит у чужой точки: ' + ow);
      if (msg.length) { bad++; ex = ex || plainText(t.text).slice(0, 90) + ' — ' + msg.join('; '); }
    }
    ok(!bad, '6', `${k}: чертежей не по числам или с наложенными подписями ${bad} — ${ex}`);
  }
  const T = loadTrainer(FILE, { seed: 3 });
  const pr = (a, b, c) => { const P = vertices(T.run(`build('pythHyp',{a:${a},b:${b},c:${c},f:0},{}).fig.svg`)); return Math.hypot(P.C.x - P.A.x, P.C.y - P.A.y) / Math.hypot(P.C.x - P.B.x, P.C.y - P.B.y); };
  const r1 = pr(3, 4, 5), r2 = pr(5, 12, 13);
  ok(Math.abs(r1 - 3 / 4) < 0.01 && Math.abs(r2 - 5 / 12) < 0.01 && Math.abs(r1 - r2) > 0.2, '6', `пропорции 3-4-5 (${r1.toFixed(3)}) и 5-12-13 (${r2.toFixed(3)})`);
});
/* допуск ловушки: конечная дробь — точно, неконечное число (800/29) — ±0,005 (как в тренажёре) */
const trapWin = (v) => (finDec(v) ? 1e-6 : 0.005);
section('7. ловушки: не у ответа и не друг у друга, не называют ответ; охват по задачам', () => {
  let full = 0, total = 0;
  const per = [], cov = [];
  for (const k of IDS) {
    let bad = 0, leak = 0, f = 0, one = 0, two = 0, ex = '';
    for (const t of TASKS[k]) {
      if (t.full) f++;
      const vs = t.diag.map(d => d.v).sort((a, b) => a - b);
      const clash = vs.some((v, i) => i && v - vs[i - 1] <= trapWin(v) + trapWin(vs[i - 1]));
      if (t.diag.some(d => !(d.v > 0) || Math.abs(d.v - t.ans) <= trapWin(d.v)) || clash) { bad++; ex = ex || JSON.stringify(vs) + ' при ответе ' + t.ans; }
      if (vs.length >= 1) one++;
      if (vs.length >= 2) two++;
      const given = nums(t.text), noDeg = !/в градусах/.test(t.text);
      const hints = t.steps.map(s => s.hint).concat(t.diag.map(d => d.m));
      if (hints.some(h => nums(h, noDeg).some(x => near(x, t.ans, 1e-9) && !given.some(g => near(g, t.ans, 1e-9))))) { leak++; ex = ex || 'подсказка называет ответ: ' + plainText(t.text).slice(0, 60); }
    }
    const n = TASKS[k].length;
    ok(!bad && !leak, '7', `${k}: ловушки ${bad}, подсказка с ответом ${leak} — ${ex}`);
    /* канон: у типовых неверных ответов — адресное объяснение; «не менее двух на тип» — разные числа */
    ok(one === n, '7', `${k}: задач без адресной ловушки ${n - one} из ${n}`);
    ok(two / n >= 0.9, '7', `${k}: две разные ловушки только у ${Math.round(100 * two / n)}% задач`);
    full += f; total += n; per.push(k + ' ' + Math.round(100 * f / n) + '%'); cov.push(k + ' ' + Math.round(100 * two / n) + '%');
  }
  console.log('      полный набор ловушек: ' + Math.round(100 * full / total) + '% (' + per.join(', ') + ')');
  console.log('      две разные ловушки: ' + cov.join(', '));
  ok(full / total >= 0.7, '7', 'доля задач с полным набором ловушек ' + Math.round(100 * full / total) + '% < 70%');
});
section('8. лестницы: последняя ступень — ответ, ступени показывают свой результат; строка D3', () => {
  for (const k of IDS) {
    let bad = 0, ex = '';
    for (const t of TASKS[k]) {
      const last = t.steps[t.steps.length - 1];
      const e = !t.steps.length ? 'нет ступеней' : !near(last.a, t.ans, 1e-9) ? 'последняя ступень ' + last.a + ' ≠ ' + t.ans
        : !plainText(last.show).includes(fmt(t.ans)) ? 'показ последней ступени без ответа'
        : t.steps.find(s => !Number.isFinite(s.a) || !s.q || (stepDec(s.a) && !plainText(s.show).includes(fmt(s.a)))) ? 'ступень без своего результата' : '';
      if (e) { bad++; ex = ex || e; }
    }
    ok(!bad, '8', `${k}: ${bad} — ${ex}`);
  }
  /* ступени, чей ответ не записывается конечной дробью (решение делегата по развилке 2):
     только отношения sin/cos/tg из условия — там допуск 0,005 и точная запись в ответе */
  const nonFin = IDS.filter(k => TASKS[k].some(t => t.steps.some(s => !stepDec(s.a))));
  console.log('      ступени с неконечным ответом: ' + (nonFin.join(', ') || 'нет'));
  ok(nonFin.every(k => ['rtLegSin', 'rtLegCos', 'rtLegTan'].includes(k)), '8', 'неконечные ступени вне отношений sin/cos/tg: ' + nonFin.join(', '));
  ok(/const near=!isDec\(s\.a\)&&Math\.abs\(v-s\.a\)<=0\.005;/.test(html) && /можно обыкновенной дробью, как в условии/.test(html), '8', 'допуск 0,005 и приписка о дроби для неконечных ступеней');
  ok(html.includes("const LADDER_NOTE='" + LADDER_NOTE + "';"), '8', 'строка над лестницей не дословно D3');
  ok(!/Сдаюсь|Показать ответ|Показать решение/.test(html), '8', 'кнопка показа ответа одним нажатием');
});
section('9. тексты: свои формулировки, стоп-лист, «Ответ дайте в градусах»', () => {
  const base = JSON.parse(fs.readFileSync(path.join(ROOT, FP_FILE), 'utf8'));
  ok(base.sha1 && base.sha1.length > 100, '9', 'база отпечатков пуста');
  const grams = new Set(base.sha1);
  const STOP = /опущ|опуст|\bSAS\b|\bASA\b|\bSSS\b|сдалась|сдался/i;
  for (const k of IDS) {
    let copy = 0, stop = 0, deg = 0, ex = '';
    for (const t of TASKS[k]) {
      const w = words(t.text);
      for (let i = 0; i + 6 <= w.length; i++) if (grams.has(sha1(w.slice(i, i + 6).join(' ')))) { copy++; ex = ex || w.slice(i, i + 6).join(' '); break; }
      const all = [t.text].concat(t.steps.map(s => s.q + ' ' + s.show + ' ' + s.hint), t.diag.map(d => d.m)).join(' ');
      if (STOP.test(all)) { stop++; ex = ex || (STOP.exec(all) || [])[0]; }
      if (ANGLE_TYPES.includes(k) !== /Ответ дайте в градусах\.$/.test(plainText(t.text))) deg++;
    }
    ok(!copy && !stop && !deg, '9', `${k}: 6 слов подряд из чужого текста ${copy}, стоп-лист ${stop}, «в градусах» не на месте ${deg} — ${ex}`);
  }
  ok(!STOP.test(html.replace(/const STOP[^\n]*/g, '')), '9', 'стоп-лист в тексте тренажёра');
});
section('10. разнообразие: разных условий на тип из 1000', () => {
  const u = IDS.map(k => [k, new Set(TASKS[k].slice(1).map(t => plainText(t.text))).size]);
  console.log('      ' + u.map(([k, n]) => k + ' ' + n).join(', '));
  for (const [k, n] of u) ok(n >= 40, '10', `${k}: всего ${n} разных условий`);
});

/* 11. контракт прогресса */
section('11. контракт: ядро и порог, журнал, повтор, мусор, две вкладки, ?seed', () => {
  const rec = (S) => (readKey(S) || {})[TID];
  { const S = makeStorage(); const T = loadTrainer(FILE, { storage: S, seed: 1 });
    T.run('CP.finishQuiz(10,10)'); let r = rec(S);
    ok(r && r.v === 1 && r.best === 10 && r.total === 10 && r.passed === true && r.runs === 1 && typeof r.updatedAt === 'number', '11', 'зачёт 10/10: ' + JSON.stringify(r));
    T.run('CP.finishQuiz(5,10)'); r = rec(S);
    ok(r.best === 10 && r.passed === true && r.runs === 2, '11', 'после 5/10 passed не снимается, best не падает: ' + JSON.stringify(r)); }
  { const S = makeStorage(); const T = loadTrainer(FILE, { storage: S, seed: 1 });
    T.run('CP.finishQuiz(7,10)'); const r = rec(S);
    ok(r.best === 7 && r.passed !== true, '11', '7/10 в чистом профиле не сдаёт зачёт: ' + JSON.stringify(r)); }
  { const S = makeStorage(); const T = loadTrainer(FILE, { storage: S, seed: 1 });
    T.run("CP.mlog('areaSin',true)"); ok(!(readKey(S) || {}).mistakes, '11', 'верный ответ без записи журнала завёл запись');
    T.run("CP.mlog('areaSin',false)"); let e = readKey(S).mistakes[TID + '|areaSin'];
    ok(e && e.w === 1 && e.r === 0, '11', 'промах: w = 1');
    ok(J(T, 'CP.openTypes()').join() === 'areaSin', '11', 'открытый тип в openTypes');
    T.run("CP.mlog('areaSin',true);CP.mlog('areaSin',true);CP.mlog('areaSin',true)"); e = readKey(S).mistakes[TID + '|areaSin'];
    ok(e.r === 3 && J(T, 'CP.openTypes()').length === 0, '11', 'три верных подряд закрывают тип');
    T.run("CP.solvedOne('angSum');CP.solvedOne('angSum')");
    ok(rec(S).solvedByType.angSum === 2, '11', 'solvedByType'); }
  { const S = makeStorage();
    S.map.set(KEY, JSON.stringify({ mistakes: { [TID + '|midline']: { w: 2, r: 1, last: 1 } } }));
    const T = loadTrainer(FILE, { storage: S, search: '?mode=review', seed: 4 });
    ok(T.run('trReview') === true, '11', '?mode=review включает повтор');
    const got = J(T, 'Array.from({length:30},()=>pickTrainTask().k)');
    ok(got.every(k => k === 'midline'), '11', '?mode=review: задачи только открытых типов — ' + [...new Set(got)].join(','));
    const S2 = makeStorage(); const T2 = loadTrainer(FILE, { storage: S2, search: '?mode=review', seed: 4 });
    T2.run('pickTrainTask()'); ok(T2.run('trReviewEmpty') === true && T2.run('trReview') === false, '11', 'без открытых типов — сообщение и обычный режим'); }
  for (const raw of JUNK_KEY) {
    const S = makeStorage(); S.map.set(KEY, raw);
    let T; try { T = loadTrainer(FILE, { storage: S, seed: 2 }); T.run("CP.solvedOne('angSum');CP.mlog('angSum',false)"); } catch (e) { ok(false, '11', 'мусор в ключе ' + raw + ': ' + e.message); continue; }
    const r = rec(S);
    ok(r && r.v === 1 && r.solvedByType.angSum === 1, '11', 'мусор в ключе ' + raw + ': запись ' + JSON.stringify(r));
  }
  for (const raw of JUNK_REC) {
    const S = makeStorage(); const other = { x: 1 };
    S.map.set(KEY, '{"' + TID + '":' + raw + ',"other":' + JSON.stringify(other) + '}');
    try { const T = loadTrainer(FILE, { storage: S, seed: 2 }); T.run("CP.solvedOne('angSum');CP.finishQuiz(3,10)"); } catch (e) { ok(false, '11', 'мусор в ветке ' + raw + ': ' + e.message); continue; }
    const all = readKey(S), r = all[TID];
    ok(r && r.v === 1 && Number.isFinite(r.updatedAt) && JSON.stringify(all.other) === JSON.stringify(other), '11', 'мусор в ветке ' + raw + ': ' + JSON.stringify(r));
  }
  { const S = makeStorage();
    const T1 = loadTrainer(FILE, { storage: S, seed: 1 }), T2 = loadTrainer(FILE, { storage: S, seed: 2 });
    T1.run("CP.solvedOne('regR')"); T2.run("CP.mlog('regH',false)"); T1.run("CP.solvedOne('regR')");
    const all = readKey(S);
    ok(all[TID].solvedByType.regR === 2 && all.mistakes[TID + '|regH'].w === 1, '11', 'две вкладки не затирают друг друга'); }
  { const seq = (seed, s) => { const T = loadTrainer(FILE, { search: '?seed=' + s, seed }); return J(T, "TYPE_IDS.slice(0,8).map(k=>buildGen(k).text)").join('|'); };
    ok(seq(1, 7) === seq(99, 7), '11', '?seed=7 даёт одинаковые задачи при разном Math.random');
    ok(seq(1, 7) !== seq(1, 8), '11', '?seed=7 и ?seed=8 дают разные задачи'); }
});

/* 12. старая страница и ссылки */
section('12. старая страница перенаправляет; ссылки курса ведут на тренажёр', () => {
  const old = readTrainer('oge/geometry/task-15-external-angle.html');
  ok(/http-equiv="refresh" content="0; url=\/trainers\/oge-task15-triangles\.html"/.test(old) && /location\.replace\('\/trainers\/oge-task15-triangles\.html'\)/.test(old)
    && /href="\/trainers\/oge-task15-triangles\.html"/.test(old), '12', 'перенаправление старой страницы');
  ok(!/mathjax|cdn\.|polyfill/i.test(old), '12', 'в перенаправлении остались внешние скрипты');
  for (const f of ['oge/index.html', 'trainers/oge-course/index.html', 'trainers/testing-hub.html', 'oge/algebra/task-14-sequences.html']) {
    const s = readTrainer(f);
    ok(!/task-15-external-angle/.test(s) && /oge-task15-triangles\.html/.test(s), '12', f + ': ссылка на тренажёр вместо старой страницы');
  }
  const sm = readTrainer('sitemap.xml');
  ok(/<loc>https:\/\/mathexam\.space\/trainers\/oge-task15-triangles\.html<\/loc>/.test(sm), '12', 'sitemap.xml');
  const cl = readTrainer('tools/oge-check-links.mjs');
  ok(/'trainers\/oge-task15-triangles\.html'/.test(cl) && !/task-15-external-angle/.test(cl), '12', 'DEFAULT_PAGES в oge-check-links.mjs');
});

/* 13. доступность в разметке */
section('13. доступность: переход к заданию, reduced-motion, печать, aria-live, 44 px', () => {
  ok(/<a class="skip" href="#main">Перейти к заданию<\/a>/.test(html) && /<main id="main" tabindex="-1">/.test(html), '13', 'ссылка «Перейти к заданию»');
  ok(/@media \(prefers-reduced-motion: reduce\)/.test(html), '13', 'prefers-reduced-motion');
  ok(/@media print\{[\s\S]*?\.tabs[^{]*\{display:none/.test(html), '13', 'печать: навигация уходит');
  ok((html.match(/aria-live="polite"/g) || []).length >= 3, '13', 'aria-live у сообщений проверки');
  ok(/button,select,input:not\(\[type=checkbox\]\):not\(\[type=radio\]\):not\(\[type=range\]\)\{min-height:44px\}/.test(html), '13', 'цели касания 44 px');
  ok(/:focus-visible\{outline:3px solid/.test(html), '13', 'видимый фокус');
  ok(/Подсказки ничего не отнимают/.test(html), '13', '«Подсказки ничего не отнимают» сказано ученику');
});

console.log('\nпроверок: ' + checks + ', провалов: ' + fails);
if (fails) { console.log(failed.slice(0, 60).join('\n')); process.exit(1); }
console.log('OGE_TASK15_GATE_OK');

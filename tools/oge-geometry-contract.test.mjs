#!/usr/bin/env node
/*
  Гейт OGE_COURSE_03A_GEOMETRY: тренажёры 16, 17, 18, 23, 24, 25.
  Голый Node 18+, без зависимостей и сети:
    node tools/oge-geometry-contract.test.mjs
  Маркер успеха: OGE_GEOMETRY_GATE_OK; при ошибке — список провалов и код 1.

  Что проверяется (спецификация docs/tasks/OGE_COURSE_03A_GEOMETRY.md и
  решения делегата владельца F1–F8, Q1–Q4, записанные в её Execution record):
   1. синтаксис встроенных скриптов (node --check);
   2. общие блоки SHEET_MAP и SELFTEST_KIT побайтно одинаковы, сканов нет;
   3. самопроверки ?selftest=1 печатают <ИМЯ>_SELFTEST_OK и не пишут в ключ;
   4. независимый пересчёт ответов решателями oge-geometry-contract.t*.mjs:
      по 500 задач на подтип (сид фиксирован) и весь архив; 25 — все наборы
      пулов и значения шагов проводки;
   5. ловушки после сведения: ни одна не принимается как ответ, разные
      сообщения не ловят одно число; 25 — запас не меньше 5 допусков;
   6. разнообразие: разных задач подтипа не меньше 95 % базы с main;
   7. контракт прогресса во всех шести: ядро, порог, журнал, повтор, мусор,
      две вкладки, разовая миграция старой записи;
   8. приёмка: 16 — зачёт 10/10 и 5/10, tanTrap w → r = 3, ?mode=review;
   9. 23 — точный допуск (84/83/85, 120/119/121, корни и дроби);
  10. 25 и 24 — правило F8 (решено / показано / журнал), ловушки 25;
  11. стоп-лист родовых форм в тексте тренажёров (решение F7).
*/
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, KEY, readTrainer, syntaxCheck, loadTrainer, makeStorage, readKey, JUNK_KEY, JUNK_REC, near } from './oge-geometry-contract.lib.mjs';
import * as R16 from './oge-geometry-contract.t16.mjs';
import * as R17 from './oge-geometry-contract.t17.mjs';
import * as R18 from './oge-geometry-contract.t18.mjs';
import * as R23 from './oge-geometry-contract.t23.mjs';
import * as R25 from './oge-geometry-contract.t25.mjs';

const SEED = 20260928, N = 500;
const TR = [
  { n: 16, file: 'trainers/oge-task16-circle.html', tid: 'oge-task16-circle', name: 'OGE16', total: 10, pass: 8 },
  { n: 17, file: 'trainers/oge-task17-quadrilaterals.html', tid: 'oge17-chetyrehugolniki', name: 'OGE17', total: 10, pass: 8 },
  { n: 18, file: 'trainers/oge-task18-grid.html', tid: 'oge18-kletki', name: 'OGE18', total: 10, pass: 8 },
  { n: 23, file: 'trainers/oge-task23-geometry-calculations.html', tid: 'oge23-vychisleniya', name: 'OGE23', total: 10, pass: 8 },
  { n: 24, file: 'trainers/oge-task24-proofs.html', tid: 'oge24-dokazatelstva', name: 'OGE24', total: 5, pass: 4, bestPct: true },
  { n: 25, file: 'trainers/oge-task25-geometry.html', tid: 'oge25-geometriya', name: 'OGE25', total: 8, pass: 6 },
];

let fails = 0, checks = 0;
const failed = [];
function ok(cond, sec, msg) { checks++; if (!cond) { fails++; failed.push('[' + sec + '] ' + msg); } }
function section(title, fn) {
  const before = fails, t0 = Date.now();
  try { fn(); } catch (e) { ok(false, title, 'исключение: ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e)); }
  console.log((fails === before ? 'ok  ' : 'FAIL') + '  ' + title + '  (' + (Date.now() - t0) + ' мс)');
}
const J = (T, code) => JSON.parse(T.run('JSON.stringify(' + code + ')'));

/* 1. синтаксис */
section('1. синтаксис встроенных скриптов (node --check)', () => {
  for (const t of TR) {
    const errs = syntaxCheck(readTrainer(t.file));
    ok(!errs.length, '1', t.file + ': ' + errs.join(' | '));
  }
});

/* 2. общие блоки, сканы */
section('2. общие блоки побайтно одинаковы, сканов листа нет', () => {
  /* тот же блок и в тренажёре 15 (03B, решение делегата: одна копия листа во всех) */
  const files = TR.map(t => t.file).concat(['trainers/oge-task15-triangles.html']);
  for (const [a, b] of [['/*__SHEET_MAP_START__*/', '/*__SHEET_MAP_END__*/'], ['/*__SELFTEST_KIT_START__*/', '/*__SELFTEST_KIT_END__*/']]) {
    const copies = files.map(f => {
      const s = readTrainer(f), i = s.indexOf(a), j = s.indexOf(b);
      ok(s.split(a).length === 2 && i >= 0 && j > i, '2', f + ': блок ' + a + ' должен быть ровно один');
      return i >= 0 && j > i ? s.slice(i, j + b.length) : '';
    });
    ok(copies.every(c => c && c === copies[0]), '2', 'копии блока ' + a + ' различаются');
  }
  for (const t of TR) ok(!/data:image\//.test(readTrainer(t.file)), '2', t.file + ': встроенная картинка data:image');
});

/* 3. самопроверки */
section('3. самопроверки ?selftest=1: маркер в консоли, ключ не тронут', () => {
  for (const t of TR) {
    const S = makeStorage();
    const T = loadTrainer(t.file, { storage: S, search: '?selftest=1', seed: 5 });
    if (t.n === 23) T.run('selftest()');   // в 23 самопроверка стартует по DOMContentLoaded
    const mk = T.logs.filter(l => /_SELFTEST_(OK|FAIL)/.test(l));
    ok(mk.length === 1 && mk[0] === t.name + '_SELFTEST_OK', '3', t.file + ': маркер «' + mk.join(' | ') + '» ' + T.logs.filter(l => /^  /.test(l)).slice(0, 5).join(' | '));
    ok(S.map.size === 0, '3', t.file + ': в ?selftest=1 записано в хранилище');
  }
});

/* 4. независимый пересчёт */
const fnum17 = v => { const r = Math.round(v * 1e6) / 1e6; return Number.isInteger(r) ? String(r) : String(r).replace('.', ','); };
const acute = a => Math.min(a, 180 - a);
section('4. независимый пересчёт: 500 задач на подтип, архив, 25 — все наборы', () => {
  // 16
  {
    const T = loadTrainer(TR[0].file, { seed: SEED });
    for (const k of J(T, 'Object.keys(SUBS)')) {
      ok(typeof R16.solve[k] === 'function', '4', '16 ' + k + ': нет решателя');
      const tasks = J(T, `Array.from({length:${N}},()=>{const t=buildGen(${JSON.stringify(k)});return {p:t.p,ans:t.ans};})`);
      let bad = 0, inv = 0, ex = '';
      for (const { p, ans } of tasks) { if (R16.validity(k, p)) inv++; if (!near(R16.solve[k](p), ans, 1e-6)) { bad++; ex = ex || JSON.stringify(p); } }
      ok(!bad && !inv, '4', `16 ${k}: расхождений ${bad}, невозможных ${inv} ${ex}`);
    }
    for (const e of J(T, 'ARCHIVE.map(e=>({n:e.nums[0],sub:e.sub,p:e.p,exp:e.exp,ans:buildArchive(e).ans}))')) {
      ok(near(R16.solve[e.sub](e.p), e.exp, 1e-6) && near(e.ans, e.exp, 1e-6) && !R16.validity(e.sub, e.p), '4', '16 архив №' + e.n);
    }
  }
  // 17
  {
    const T = loadTrainer(TR[1].file, { seed: SEED });
    const same = (k, s, ans) => k === 'rhombHeightSegments' ? Array.isArray(s) && fnum17(s[0]) + fnum17(s[1]) === String(ans) : near(s, ans, 1e-6);
    for (const k of J(T, 'Object.keys(S17)')) {
      ok(typeof R17.solve[k] === 'function', '4', '17 ' + k + ': нет решателя');
      const tasks = J(T, `Array.from({length:${N}},()=>{const t=build(${JSON.stringify(k)},S17[${JSON.stringify(k)}].gen(),{gen:true});return {p:t.p,ans:t.ans};})`);
      let bad = 0, inv = 0, ex = '';
      for (const { p, ans } of tasks) { if (R17.validity(k, p)) inv++; if (!same(k, R17.solve[k](p), ans)) { bad++; ex = ex || JSON.stringify(p); } }
      ok(!bad && !inv, '4', `17 ${k}: расхождений ${bad}, невозможных ${inv} ${ex}`);
    }
    for (const e of J(T, 'ARCHIVE.map(a=>({n:a.nums[0],sub:a.sub,p:a.p,exp:a.exp,ans:build(a.sub,a.p,{}).ans}))')) {
      const ansOk = typeof e.exp === 'number' ? near(e.ans, e.exp, 1e-9) : String(e.ans) === String(e.exp);
      ok(same(e.sub, R17.solve[e.sub](e.p), e.exp) && ansOk, '4', '17 архив №' + e.n);
      ok(!R17.validity(e.sub, e.p), '4', '17 архив №' + e.n + ': невозможная фигура');
    }
  }
  // 18
  {
    const T = loadTrainer(TR[2].file, { seed: SEED });
    for (const k of J(T, 'SUBKEYS')) {
      ok(typeof R18.solve[k] === 'function', '4', '18 ' + k + ': нет решателя');
      const tasks = J(T, `Array.from({length:${N}},()=>{const t=genTask(${JSON.stringify(k)});return {p:t.p,ans:t.ans};})`);
      let bad = 0, inv = 0, ex = '';
      for (const { p, ans } of tasks) { if (R18.validity(k, p)) inv++; if (!near(R18.solve[k](p), ans, 1e-6)) { bad++; ex = ex || JSON.stringify(p); } }
      ok(!bad && !inv, '4', `18 ${k}: расхождений ${bad}, невозможных ${inv} ${ex}`);
    }
    for (const e of J(T, 'ARCHIVE.map(r=>({id:r.id,sub:r.sub,p:r.p,exp:r.exp,ans:archTask(r).ans}))')) {
      ok(near(R18.solve[e.sub](e.p), e.exp, 1e-6) && near(e.ans, e.exp, 1e-6) && !R18.validity(e.sub, e.p), '4', '18 архив №' + e.id);
    }
  }
  // 23
  {
    const T = loadTrainer(TR[3].file, { seed: SEED });
    const cmp = (k, mine, ref) => near(mine, k === 'rhombAng' ? acute(ref) : ref, 1e-6);
    for (const k of J(T, 'ORDER')) {
      ok(typeof R23.solve[k] === 'function', '4', '23 ' + k + ': нет решателя');
      const tasks = J(T, `Array.from({length:${N}},()=>{const S=SUBS[${JSON.stringify(k)}],p=S.gen();return {p,ans:S.calc(p)};})`);
      let bad = 0, inv = 0, ex = '';
      for (const { p, ans } of tasks) { if (R23.validity(k, p)) inv++; if (!cmp(k, R23.solve[k](p), ans)) { bad++; ex = ex || JSON.stringify(p); } }
      ok(!bad && !inv, '4', `23 ${k}: расхождений ${bad}, невозможных ${inv} ${ex}`);
    }
    for (const e of J(T, 'ARCHIVE.map(it=>({id:it.id,sub:it.sub,p:it.p,exp:it.exp,calc:SUBS[it.sub].calc(it.p)}))')) {
      ok(cmp(e.sub, R23.solve[e.sub](e.p), e.exp) && near(e.calc, e.exp, 1e-6) && !R23.validity(e.sub, e.p), '4', '23 банк ' + e.id);
    }
  }
  // 25
  {
    const T = loadTrainer(TR[5].file, { seed: SEED });
    const types = J(T, 'TYPES.map(Ty=>({id:Ty.id,sets:Ty.pool.map(p=>{const b=Ty.build(p);return {p,ans:b.ans.map(a=>({l:a.label,v:a.v})),ask:b.steps.filter(s=>s.ask).map(s=>({l:s.ask.label,v:s.ask.v}))};})}))');
    for (const ty of types) {
      ok(typeof R25.solve[ty.id] === 'function', '4', '25 №' + ty.id + ': нет решателя');
      ty.sets.forEach((set, j) => {
        const s = R25.solve[ty.id](set.p), av = R25.askValues(ty.id, set.p);
        ok(!R25.validity(ty.id, set.p), '4', `25 №${ty.id}[${j}]: невозможная конфигурация`);
        set.ans.forEach(a => ok(near(s[a.l], a.v, 1e-6), '4', `25 №${ty.id}[${j}] ${a.l}: решатель ${s[a.l]} ≠ ${a.v}`));
        set.ask.forEach(a => { if (a.l in av) ok(near(av[a.l], a.v, 1e-6), '4', `25 №${ty.id}[${j}] шаг ${a.l}: ${av[a.l]} ≠ ${a.v}`); });
      });
    }
  }
});

/* 5. ловушки */
section('5. ловушки: не ответ, разные сообщения не ловят одно число', () => {
  const inv = (list, isAns) => {
    const e = [];
    list.forEach((t, i) => {
      if (isAns(t.v)) e.push('ловушка ' + t.v + ' = ответу');
      for (let j = i + 1; j < list.length; j++) { const u = list[j]; if (u.m !== t.m && Math.abs(t.v - u.v) <= (t.e || 0) + (u.e || 0)) e.push('ловушки ' + t.v + ' и ' + u.v); }
    });
    return e;
  };
  const CFG = [
    [TR[0], 'Object.keys(SUBS)', 'buildGen(k)', 'ARCHIVE.map(e=>buildArchive(e))', 't.diag', 'eqAns(x,t.ans)'],
    [TR[1], 'Object.keys(S17)', 'build(k,S17[k].gen(),{gen:true})', 'ARCHIVE.map(a=>build(a.sub,a.p,{}))', "t.ansFmt==='concat'?[]:t.diag", '(typeof t.ans==="number"&&Math.abs(x-t.ans)<=Math.max(1e-6,Math.abs(t.ans)*1e-6))'],
    [TR[2], 'SUBKEYS', 'genTask(k)', 'ARCHIVE.map(r=>archTask(r))', 't.diag', 'near(x,t.ans,1e-6)'],
    [TR[3], 'ORDER', '({sub:k,p:SUBS[k].gen()})', 'ARCHIVE.map(it=>({sub:it.sub,p:it.p}))', 'trapsOf(t.sub,t.p)', '(SUBS[t.sub].ansEqCustom?SUBS[t.sub].ansEqCustom(x,t.p):ansEq(x,SUBS[t.sub].calc(t.p)))'],
  ];
  for (const [t, keys, gen, arch, list, isAns] of CFG) {
    const T = loadTrainer(t.file, { seed: SEED });
    const res = J(T, `(()=>{const out=[];const chk=(t,tag)=>{const L=${list};const ans=x=>${isAns};
      L.forEach((a,i)=>{if(ans(a.v))out.push(tag+': ловушка '+a.v+' = ответу');
        for(let j=i+1;j<L.length;j++){const b=L[j];if(a.m!==b.m&&Math.abs(a.v-b.v)<=(a.e||0)+(b.e||0))out.push(tag+': ловушки '+a.v+' и '+b.v);}});};
      for(const k of ${keys}){for(let i=0;i<${N};i++)chk(${gen},k);}
      ${arch}.forEach((t,i)=>chk(t,'архив '+i));
      return out;})()`);
    ok(!res.length, '5', t.n + ': ' + res.length + ' нарушений ' + res.slice(0, 3).join(' | '));
  }
  // 25: запас не меньше 5 допусков, округления, многопольные ответы
  const T = loadTrainer(TR[5].file, { seed: SEED });
  const r25 = J(T, `(()=>{const out=[];let kept=0;
    TYPES.forEach(Ty=>Ty.pool.forEach((p,j)=>{const b=Ty.build(p),tr=trapsFor(Ty,p,b),tag='№'+Ty.id+'['+j+']';kept+=tr.length;
      tr.forEach((t,i)=>{
        if(b.ans.every((a,k)=>t.v[k]==null||approxEq(t.v[k],a.v,2e-3)))out.push(tag+': ловушка = ответу');
        let far=0;b.ans.forEach((a,k)=>{const x=t.v[k];if(x==null||Math.abs(x-a.v)<=trapBand(a.v))return;if(!trapFar(x,a.v))out.push(tag+': ловушка ближе 5 допусков или совпадает при округлении');far++;});
        if(!far)out.push(tag+': ловушка не отличается от ответа ни одним полем');
        tr.forEach((u,k)=>{if(k>i&&u.m!==t.m&&t.v.every((x,q)=>x==null||u.v[q]==null||Math.abs(x-u.v[q])<=trapBand(x)+trapBand(u.v[q])))out.push(tag+': две ловушки ловят одно число');});
      });}));
    return {out,kept,types:Object.keys(TRAPS).length};})()`);
  ok(!r25.out.length, '5', '25: ' + r25.out.slice(0, 3).join(' | '));
  ok(r25.types === 16 && r25.kept >= 32 * 5, '5', '25: ловушек на типах ' + r25.types + ', пар «набор × ловушка» ' + r25.kept);
});

/* 6. разнообразие задач */
section('6. разнообразие: разных задач подтипа не меньше 95 % базы с main', () => {
  const base = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/oge-geometry-contract.baseline.json'), 'utf8'));
  const CFG = { 16: [TR[0], 'SUBS'], 17: [TR[1], 'S17'], 18: [TR[2], 'SUBS'], 23: [TR[3], 'SUBS'] };
  for (const [n, [t, subs]] of Object.entries(CFG)) {
    const T = loadTrainer(t.file, { seed: base.seed });
    const cur = J(T, `Object.fromEntries(Object.keys(${subs}).map(k=>[k,new Set(Array.from({length:${base.n}},()=>JSON.stringify(${subs}[k].gen()))).size]))`);
    for (const [k, b] of Object.entries(base.unique[n])) {
      ok(k in cur, '6', n + ' ' + k + ': подтип пропал');
      ok(cur[k] >= Math.floor(b * 0.95), '6', `${n} ${k}: разных задач ${cur[k]} < 95 % базы ${b}`);
    }
  }
});

/* 7. контракт прогресса во всех шести */
section('7. контракт прогресса: ядро, порог, журнал, повтор, мусор, две вкладки, миграция', () => {
  for (const t of TR) {
    const tag = t.n;
    { // ядро и журнал
      const S = makeStorage(); const T = loadTrainer(t.file, { storage: S });
      ok(T.run('QUIZ_TOTAL') === t.total && T.run('PASS_AT') === t.pass, '7', tag + ': QUIZ_TOTAL/PASS_AT');
      const ids = J(T, 'TYPE_IDS'), t0 = ids[0];
      T.run('CP.solvedOne(TYPE_IDS[0])');
      let r = readKey(S)[t.tid];
      ok(r.v === 1 && typeof r.updatedAt === 'number' && r.solvedByType[t0] === 1, '7', tag + ': ядро v:1, updatedAt, solvedByType');
      T.run('CP.mlog(TYPE_IDS[0], true)');
      ok(!((readKey(S).mistakes || {})[t.tid + '|' + t0]), '7', tag + ': верный без промаха не заводит запись журнала');
      T.run('CP.mlog(TYPE_IDS[0], false)');
      let m = readKey(S).mistakes[t.tid + '|' + t0];
      ok(m.w === 1 && m.r === 0 && J(T, 'CP.openTypes()').includes(t0), '7', tag + ': промах открывает тип');
      T.run('CP.mlog(TYPE_IDS[0], true);CP.mlog(TYPE_IDS[0], true);CP.mlog(TYPE_IDS[0], true)');
      m = readKey(S).mistakes[t.tid + '|' + t0];
      ok(m.r === 3 && !J(T, 'CP.openTypes()').includes(t0), '7', tag + ': три верных закрывают тип');
      T.run('CP.finishQuiz(PASS_AT-1, QUIZ_TOTAL)');
      r = readKey(S)[t.tid];
      ok(r.passed !== true && r.runs === 1 && r.best === t.pass - 1 && r.total === t.total, '7', tag + ': ниже порога — не сдан');
      T.run('CP.finishQuiz(PASS_AT, QUIZ_TOTAL)');
      ok(readKey(S)[t.tid].passed === true, '7', tag + ': порог — сдан');
      T.run('CP.finishQuiz(0, QUIZ_TOTAL)');
      r = readKey(S)[t.tid];
      ok(r.passed === true && r.best === t.pass && r.runs === 3, '7', tag + ': неудачная попытка не снимает passed и не роняет best');
      ok(ids.every(x => typeof x === 'string') && new Set(ids).size === ids.length, '7', tag + ': TYPE_IDS — различные строки');
    }
    { // мусор в ключе и в ветке
      for (const j of JUNK_KEY) {
        const S = makeStorage(); S.map.set(KEY, j);
        let err = ''; try { const T = loadTrainer(t.file, { storage: S }); T.run('CP.solvedOne(TYPE_IDS[1]);CP.mlog(TYPE_IDS[1],false);CP.finishQuiz(1,QUIZ_TOTAL)'); } catch (e) { err = String(e).slice(0, 120); }
        const all = readKey(S);
        ok(!err && all && all[t.tid] && all[t.tid].v === 1, '7', tag + ': мусор в ключе ' + j + ' ' + err);
      }
      for (const j of JUNK_REC) {
        const S = makeStorage(); S.map.set(KEY, '{"' + t.tid + '":' + j + ',"other":{"x":1}}');
        let err = ''; try { const T = loadTrainer(t.file, { storage: S }); T.run('CP.solvedOne(TYPE_IDS[1]);CP.finishQuiz(1,QUIZ_TOTAL)'); } catch (e) { err = String(e).slice(0, 120); }
        const all = readKey(S), r = all && all[t.tid];
        ok(!err && r && r.v === 1 && Number.isInteger(r.runs) && Number.isInteger(r.best) && JSON.stringify(all.other) === '{"x":1}', '7', tag + ': мусор в ветке ' + j + ' ' + err);
      }
    }
    { // две вкладки
      const S = makeStorage(); const A = loadTrainer(t.file, { storage: S }); const B = loadTrainer(t.file, { storage: S });
      A.run('CP.solvedOne(TYPE_IDS[2])'); B.run('CP.solvedOne(TYPE_IDS[3])'); A.run('CP.mlog(TYPE_IDS[4],false)'); B.run('CP.finishQuiz(PASS_AT,QUIZ_TOTAL)');
      const all = readKey(S), r = all[t.tid], ids = J(A, 'TYPE_IDS');
      ok(r.solvedByType[ids[2]] === 1 && r.solvedByType[ids[3]] === 1 && r.passed === true && all.mistakes[t.tid + '|' + ids[4]].w === 1, '7', tag + ': две вкладки не затирают друг друга');
    }
    { // разовая миграция: старый passed при любом результате пересчитывается по best
      const low = t.bestPct ? 70 : t.pass - 1, high = t.bestPct ? 80 : t.pass;
      const S1 = makeStorage(); S1.map.set(KEY, JSON.stringify({ [t.tid]: { runs: 2, best: low, passed: true, events: [] }, other: { x: 1 } }));
      loadTrainer(t.file, { storage: S1 });
      let a = readKey(S1);
      ok(a[t.tid].passed === false && a[t.tid].best === t.pass - 1 && a[t.tid].runs === 2 && typeof a[t.tid].updatedAt === 'number' && JSON.stringify(a.other) === '{"x":1}', '7', tag + ': миграция снимает незаслуженный passed');
      const S2 = makeStorage(); S2.map.set(KEY, JSON.stringify({ [t.tid]: { runs: 1, best: high, passed: true } }));
      loadTrainer(t.file, { storage: S2 });
      ok(readKey(S2)[t.tid].passed === true && readKey(S2)[t.tid].best === t.pass, '7', tag + ': миграция сохраняет заслуженный passed');
      const S3 = makeStorage(); S3.map.set(KEY, JSON.stringify({ [t.tid]: { v: 1, best: 1, passed: true, updatedAt: 5 } }));
      loadTrainer(t.file, { storage: S3 });
      ok(readKey(S3)[t.tid].passed === true, '7', tag + ': запись по контракту (с updatedAt) не мигрирует повторно');
    }
    { // ?mode=review: только открытые типы
      const S = makeStorage(); const A = loadTrainer(t.file, { storage: S }); const ids = J(A, 'TYPE_IDS');
      A.run('CP.mlog(TYPE_IDS[1], false)');
      const B = loadTrainer(t.file, { storage: S, search: '?mode=review' });
      ok(B.run('CP.REVIEW') === true && JSON.stringify(J(B, 'CP.openTypes()')) === JSON.stringify([ids[1]]), '7', tag + ': ?mode=review видит ровно открытый тип');
    }
  }
});

/* 8. приёмка 16 */
section('8. приёмка 16: зачёт 10/10 и 5/10, tanTrap, повтор', () => {
  const t = TR[0];
  const S = makeStorage(); const T = loadTrainer(t.file, { storage: S });
  T.run('CP.finishQuiz(10,10)');
  let r = readKey(S)[t.tid];
  ok(r.passed === true && r.best === 10 && r.total === 10 && r.v === 1, '8', '10/10 → passed:true');
  const S2 = makeStorage(); const T2 = loadTrainer(t.file, { storage: S2 });
  T2.run('CP.finishQuiz(5,10)');
  r = readKey(S2)[t.tid];
  ok(r.passed !== true && r.best === 5, '8', '5/10 → passed не ставится');
  T.run('CP.finishQuiz(5,10)');
  ok(readKey(S)[t.tid].passed === true, '8', '5/10 после сданного — passed не снимается');
  T.run("CP.mlog('tanTrap',false)");
  ok(readKey(S).mistakes['oge-task16-circle|tanTrap'].w === 1, '8', 'промах по tanTrap → w=1');
  const R = loadTrainer(t.file, { storage: S, search: '?mode=review' });
  const picks = J(R, 'Array.from({length:30},()=>{trTask=null;return pickTrainTask().k;})');
  ok(picks.every(k => k === 'tanTrap'), '8', '?mode=review даёт только tanTrap: ' + [...new Set(picks)].join(','));
  T.run("CP.mlog('tanTrap',true);CP.mlog('tanTrap',true);CP.mlog('tanTrap',true)");
  ok(readKey(S).mistakes['oge-task16-circle|tanTrap'].r === 3 && !J(T, 'CP.openTypes()').includes('tanTrap'), '8', 'три верных → r=3, тип закрыт');
});

/* 9. 23: допуск */
section('9. 23: точный допуск ответа', () => {
  const T = loadTrainer(TR[3].file, { seed: 3 });
  const r = J(T, `({a84:ansEq(84,84),a83:ansEq(83,84),a85:ansEq(85,84),a120:ansEq(120,120),a119:ansEq(119,120),a121:ansEq(121,120),
    rad:ansEq(parseAns('13√2'),13*Math.SQRT2),radDec:ansEq(parseAns('18,38'),13*Math.SQRT2),fr:ansEq(parseAns('120/13'),120/13),
    frDec:ansEq(parseAns('9,23'),120/13),dec:ansEq(parseAns('5,25'),5.25),dec2:ansEq(parseAns('5,2'),5.25),show:exactStr(120/13)})`);
  ok(r.a84 && !r.a83 && !r.a85, '9', '84: 84 — да, 83 и 85 — нет ' + JSON.stringify(r));
  ok(r.a120 && !r.a119 && !r.a121, '9', '120: 120 — да, 119 и 121 — нет');
  ok(r.rad && !r.radDec && r.fr && !r.frDec && r.dec && !r.dec2, '9', 'корни и дроби — точно, приближения — нет');
  ok(r.show === '120/13', '9', 'ответ показывается точной дробью: ' + r.show);
});

/* 10. правило F8 и ловушки: 25 и 24 */
section('10. правило F8 (решено / показано / журнал), ловушки 25, 24', () => {
  const t = TR[5];
  const PATCH = `var __ans=null,__g=null;
    readAns=function(){const v=__ans||[];return {vals:v,raw:v.map(String),empty:0,bad:0};};
    document.getElementById=function(id){if(id==='gAsk')return {value:String(__g)};return {style:{},classList:{toggle(){},add(){},remove(){}},set innerHTML(x){},set textContent(x){},set className(x){}};};`;
  const fresh = (search) => { const S = makeStorage(); const T = loadTrainer(t.file, { storage: S, search, seed: 3 }); T.run(PATCH); return { S, T }; };
  const rec = S => (readKey(S) || {})[t.tid] || {}, mk = (S, id) => ((readKey(S) || {}).mistakes || {})[t.tid + '|' + id];
  { const { S, T } = fresh(); T.run('newTrainTask(3);__ans=trS.b.ans.map(a=>a.v);trCheck();');
    ok(rec(S).solvedByType['3'] === 1 && !mk(S, '3'), '10', '25: сразу верно → решена, журнала нет'); }
  { const { S, T } = fresh(); T.run('newTrainTask(5);__ans=trS.b.ans.map(a=>a.v+17);trCheck();trCheck();__ans=trS.b.ans.map(a=>a.v);trCheck();');
    const m = mk(S, '5'); ok(rec(S).solvedByType['5'] === 1 && m && m.w === 1 && m.r === 0, '10', '25: промах один раз на задачу, исправил сам → решена'); }
  { const { S, T } = fresh(); T.run('newTrainTask(7);__ans=trS.b.ans.map(a=>a.v+3);trCheck();trGive();');
    const m = mk(S, '7'); ok(!rec(S).solvedByType['7'] && m && m.w === 1 && m.r === 0, '10', '25: «Сдаюсь» после промаха → не решена, в журнале только w'); }
  { const { S, T } = fresh(); T.run("newTrainTask(4);readAns=function(){return {vals:[NaN],raw:[''],empty:1,bad:0};};trCheck();");
    ok(!mk(S, '4') && T.run('trS.wrong') === 0, '10', '25: пустой ввод — не промах'); }
  { const { S, T } = fresh(); T.run("CP.mlog('2',false);newTrainTask(2);trHint();for(let g=0;g<40&&!trS.done;g++){const st=trS.b.steps[trS.gstep];if(st.ask&&!trS.gres[trS.gstep]){__g=st.ask.v;gCheck();}else if(trS.gstep<gInfo().gT)gNext();else{__ans=trS.b.ans.map(a=>a.v);trCheck();}}");
    ok(rec(S).solvedByType['2'] === 1 && mk(S, '2').r === 1, '10', '25: проводка, все числа сам → решена, r=1');
    ok(!(rec(S).events || []).some(e => e.e === 'hint' && e.kind === 'guide-ok'), '10', '25: верный шаг проводки — не подсказка'); }
  { const { S, T } = fresh(); T.run("newTrainTask(2);trHint();let rv=false;for(let g=0;g<40&&!trS.done;g++){const st=trS.b.steps[trS.gstep];if(st.ask&&!trS.gres[trS.gstep]){if(!rv){rv=true;gReveal();}else{__g=st.ask.v;gCheck();}}else if(trS.gstep<gInfo().gT)gNext();else{__ans=trS.b.ans.map(a=>a.v);trCheck();}}");
    ok(!rec(S).solvedByType['2'] && !mk(S, '2'), '10', '25: показанное число шага → решение показано, вердикта нет'); }
  { const { S, T } = fresh(); T.run('startExam();for(let i=0;i<8;i++){const q=exS.list[exS.i];__ans=q.b.ans.map(a=>i<5?a.v:a.v+9);examAnswer();examNext();}');
    let r = rec(S); ok(r.runs === 1 && r.best === 5 && r.passed !== true, '10', '25: 5 из 8 → не сдан');
    T.run('startExam();for(let i=0;i<8;i++){const q=exS.list[exS.i];__ans=q.b.ans.map(a=>i<6?a.v:a.v+9);examAnswer();examNext();}');
    r = rec(S); ok(r.runs === 2 && r.best === 6 && r.passed === true, '10', '25: 6 из 8 → сдан'); }
  { const { T } = fresh();
    const m = J(T, `(()=>{const o={};newTrainTask(8);__ans=[trS.traps[0].v[0]];trCheck();o.trap=trS.fb.msg;
      newTrainTask(4);__ans=[trS.b.ans[0].v,trS.b.ans[1].v+3];trCheck();o.part=trS.fb.msg;
      newTrainTask(4);__ans=[trS.b.ans[1].v,trS.b.ans[0].v];trCheck();o.swap=trS.fb.msg;
      startExam();const q=exS.list[0],tr=trapsFor(byId(q.id),q.p,q.b);__ans=tr.length?tr[0].v.map((x,j)=>x==null?q.b.ans[j].v:x):q.b.ans.map(a=>a.v+9);examAnswer();o.exam=exS.res[0];return o;})()`);
    ok(/Вы нашли AD/.test(m.trap), '10', '25: ловушка «промежуточный AD» срабатывает');
    ok(/Одно из двух значений верно/.test(m.part), '10', '25: частичная диагностика без выдачи');
    ok(/перепутано, какое основание большее/.test(m.swap), '10', '25: перестановка полей');
    ok(m.exam && m.exam.correct === false && !!m.exam.diag, '10', '25: в зачёте диагностика сохраняется для итогов'); }
  // 24
  { const T = loadTrainer(TR[4].file, { seed: 3 });
    const f8 = J(T, `[selfSolved({gaveUp:false,placedByHint:0,glows:1}),selfSolved({gaveUp:false,placedByHint:0,glows:2}),selfSolved({gaveUp:false,placedByHint:1,glows:0}),selfSolved({gaveUp:true,placedByHint:0,glows:0})]`);
    ok(JSON.stringify(f8) === '[true,false,false,false]', '10', '24: подсветка ×1 — решена, ×2, «Поставить шаг», «Сдаюсь» — нет'); }
});

/* 11. стоп-лист родовых форм (F7) */
section('11. нейтральные формы: родовых форм в тексте тренажёров нет', () => {
  const re = /(^|[^а-яёА-ЯЁ])(ты\s+[а-яё]+(?:ёл|ел|ал|ил|ыл|ул|ял|шёл|ла|лся|лась)|прош[её]л|прошла|ошибся|ошиблась|застрял|застряла|сдался|сдалась|наш[её]л|нашла|посчитал|посчитала|дош[её]л|дошла|справился|справилась|готов решать|сам решаю|самому|самой решать)(?=[^а-яёА-ЯЁ]|$)/giu;
  for (const t of TR) {
    const hits = [];
    readTrainer(t.file).split('\n').forEach((line, i) => { let m; re.lastIndex = 0; while ((m = re.exec(line))) hits.push((i + 1) + ': ' + m[2]); });
    ok(!hits.length, '11', t.file + ': ' + hits.slice(0, 5).join(' | '));
  }
});

console.log('\nпроверок: ' + checks + ', провалов: ' + fails);
if (fails) { failed.slice(0, 60).forEach(f => console.log('  ' + f)); process.exitCode = 1; }
else console.log('OGE_GEOMETRY_GATE_OK');

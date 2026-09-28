#!/usr/bin/env node
/*
  Гейт OGE_COURSE_03D_ALGEBRA: тренажёры алгебры 7, 8, 9 (часть A;
  часть B — 10, 11, 12, 14 — добавляется сюда же).
  Голый Node 18+, без зависимостей и сети:
    node tools/oge-algebra-contract.test.mjs
    node tools/oge-algebra-contract.test.mjs --make-base <ref>   — снять базу разнообразия с <ref>
  Маркер успеха: OGE_ALGEBRA_GATE_OK; при ошибке — список провалов и код 1.

  Что проверяется (спецификация docs/tasks/OGE_COURSE_03D_ALGEBRA.md и решения
  делегата владельца D1–D14, записанные в её Execution record):
   1. синтаксис встроенных скриптов (node --check);
   2. общий блок самопроверки ALG_SELFTEST_KIT побайтно одинаков, ровно один;
   3. самопроверки ?selftest=1 печатают <ИМЯ>_SELFTEST_OK и не пишут в ключ;
   4. независимый пересчёт ответов другим кодом на точной арифметике
      (oge-algebra-contract.t7/t8/t9.mjs): весь банк и по 500 задач на тип;
   5. ловушки: не принимаются как ответ, разные сообщения не ловят одно
      значение; 9 — набор ловушек совпадает с пересчитанным; 8 — доля задач
      без объединённых ловушек по видам степеней не ниже 70 %; 7 — у каждого
      неверного варианта адресное сообщение, посылки перепроверяются;
   6. место верного варианта в 7 (решение D13): каждое из четырёх — не реже 15 %;
   7. разнообразие: разных задач каждого вида не меньше 95 % базы с main;
   8. контракт прогресса: ядро, порог, журнал, мусор, две вкладки, повтор;
   9. реестр: TYPE_IDS и имена типов совпадают с oge/registry.js;
  10. кнопок «Показать ответ» в Марафонах нет (решение D3), родовых форм нет (F7).
*/
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { ROOT, KEY, readTrainer, syntaxCheck, loadTrainer, makeStorage, readKey, JUNK_KEY, JUNK_REC, R, eq, str, parseNum } from './oge-algebra-contract.lib.mjs';
import * as R7 from './oge-algebra-contract.t7.mjs';
import * as R8 from './oge-algebra-contract.t8.mjs';
import * as R9 from './oge-algebra-contract.t9.mjs';

const require = createRequire(import.meta.url);
const SEED = 20260929, N = 500;
const BASE_FILE = path.join(ROOT, 'tools/oge-algebra-contract.baseline.json');
const TR = [
  { n: 7, file: 'trainers/oge-task7-number-line.html', tid: 'oge-t7-pryamaya', name: 'OGE7', selftest: 'selftest7()' },
  { n: 8, file: 'trainers/oge-task8-powers-roots.html', tid: 'oge-t8-stepeni', name: 'OGE8' },
  { n: 9, file: 'trainers/oge-task9-equations.html', tid: 'oge-t9-uravneniya', name: 'OGE9' },
];
const KIT = ['/*__ALG_SELFTEST_KIT_START__*/', '/*__ALG_SELFTEST_KIT_END__*/'];

/* JSON из vm с BigInt: {$b:"…"} туда и обратно */
const J = (T, code) => JSON.parse(T.run('JSON.stringify(' + code + ',(k,v)=>typeof v==="bigint"?{$b:v.toString()}:v)'),
  (k, v) => (v && typeof v === 'object' && '$b' in v ? BigInt(v.$b) : v));
const Fq = (f) => R(f.n, f.d);

/* ключи уникальности задач для разнообразия (одинаковы для базы и для проверки) */
const UNIQ = {
  7: `(()=>{const out={};Object.keys(GEN7).forEach(tt=>{const s=new Set();for(let i=0;i<__N__;i++){const t=GEN7[tt]();
      s.add(JSON.stringify([t.text||'',t.vals?Object.keys(t.vals).map(k=>t.vals[k].n+'/'+t.vals[k].d):[],(t.opts||[]).map(o=>o.html).sort()]));}out[tt]=s.size;});return out;})()`,
  8: `(()=>{const out={};Object.keys(GEN).forEach(ty=>{const s=new Set();for(let i=0;i<__N__;i++)s.add(JSON.stringify(GEN[ty]()));out[ty]=s.size;});return out;})()`,
  9: `(()=>{const out={};Object.keys(GENS).forEach(g=>{const s=new Set();for(let i=0;i<__N__;i++){const t=genTask(g);
      s.add(JSON.stringify([t.fam,t.p,t.ask],(k,v)=>typeof v==="bigint"?v.toString():v));}out[g]=s.size;});return out;})()`,
};
/* в базе (main) у 7 нет GEN7 — те же генераторы по старым именам */
const UNIQ7_MAIN = `(()=>{const G={"ris/one":genA1,"ris/two":genA2,"ris/diff":genA3,"ris/abs":genA4,"frac/betint":genB_fracBetweenInt,
  "frac/tenths":genB_fracTenths,"frac/inrange":genB_fracInRange,"root/betint":genB_rootBetween,"root/inrange":genB_rootInRange,
  "pts/root":genC_root,"pts/frac":genC_frac,"pts/dec":genC_decOrder};const out={};Object.keys(G).forEach(tt=>{const s=new Set();
  for(let i=0;i<__N__;i++){const t=G[tt]();s.add(JSON.stringify([t.text||'',t.vals?Object.keys(t.vals).map(k=>t.vals[k].n+'/'+t.vals[k].d):[],(t.opts||[]).map(o=>o.html).sort()]));}
  out[tt]=s.size;});return out;})()`;

if (process.argv[2] === '--make-base') {
  const ref = process.argv[3];
  if (!ref) { console.log('укажите ref: --make-base <ref>'); process.exit(1); }
  const base = { ref, seed: SEED, n: N, unique: {} };
  for (const t of TR) {
    const html = execFileSync('git', ['-C', ROOT, 'show', ref + ':' + t.file], { encoding: 'utf8', maxBuffer: 64 << 20 });
    // старая 8 в заглушке DOM падает на фокусе поля лестницы; генераторы от этого не зависят
    const htmlVm = html.replace('ins[0].focus({preventScroll:true});', 'if(ins[0])ins[0].focus({preventScroll:true});');
    const T = loadTrainer(t.file, { html: htmlVm, seed: SEED });
    const code = (t.n === 7 ? UNIQ7_MAIN : UNIQ[t.n]).replace(/__N__/g, String(N));
    base.unique[t.n] = JSON.parse(T.run('JSON.stringify(' + code + ')'));
  }
  fs.writeFileSync(BASE_FILE, JSON.stringify(base, null, 1) + '\n');
  console.log('база разнообразия записана:', path.relative(ROOT, BASE_FILE));
  process.exit(0);
}

let fails = 0, checks = 0;
const failed = [];
function ok(cond, sec, msg) { checks++; if (!cond) { fails++; failed.push('[' + sec + '] ' + msg); } }
function section(title, fn) {
  const before = fails, t0 = Date.now();
  try { fn(); } catch (e) { ok(false, title, 'исключение: ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e)); }
  console.log((fails === before ? 'ok  ' : 'FAIL') + '  ' + title + '  (' + (Date.now() - t0) + ' мс)');
}

/* 1. синтаксис */
section('1. синтаксис встроенных скриптов (node --check)', () => {
  for (const t of TR) { const errs = syntaxCheck(readTrainer(t.file)); ok(!errs.length, '1', t.file + ': ' + errs.join(' | ')); }
});

/* 2. общий блок самопроверки */
section('2. общий блок ALG_SELFTEST_KIT побайтно одинаков', () => {
  const copies = TR.map(t => {
    const s = readTrainer(t.file), i = s.indexOf(KIT[0]), j = s.indexOf(KIT[1]);
    ok(s.split(KIT[0]).length === 2 && i >= 0 && j > i, '2', t.file + ': блок должен быть ровно один');
    return i >= 0 && j > i ? s.slice(i, j + KIT[1].length) : '';
  });
  ok(copies.every(c => c && c === copies[0]), '2', 'копии блока различаются');
});

/* 3. самопроверки */
section('3. самопроверки ?selftest=1: маркер в консоли, ключ не тронут', () => {
  for (const t of TR) {
    const S = makeStorage();
    const T = loadTrainer(t.file, { storage: S, search: '?selftest=1', seed: 5 });
    if (t.selftest) T.run(t.selftest);   // 7 запускает самопроверку по DOMContentLoaded
    const mk = T.logs.filter(l => /_SELFTEST_(OK|FAIL)/.test(l));
    ok(mk.length === 1 && mk[0] === t.name + '_SELFTEST_OK', '3', t.file + ': маркер «' + mk.join(' | ') + '» ' + T.logs.filter(l => /^  /.test(l)).slice(0, 5).join(' | '));
    ok(S.map.size === 0, '3', t.file + ': в ?selftest=1 записано в хранилище');
  }
});

/* 4. независимый пересчёт */
section('4. независимый пересчёт: весь банк и по 500 задач на тип', () => {
  { // 9
    const T = loadTrainer(TR[2].file, { seed: SEED });
    const bank = J(T, 'BANK.map(t=>({id:t.id,fam:t.fam,p:t.p,ask:t.ask,exp:t.exp,key:taskKey(t)}))');
    let bad = 0, ex = '';
    for (const t of bank) {
      const a = R9.answer(t);
      if (a.bad || !eq(a.key, Fq(t.key)) || (t.exp != null && !eq(a.key, parseNum(t.exp)))) { bad++; ex = ex || t.id + ' ' + (a.bad || str(a.key)); }
    }
    ok(!bad && bank.length === 135, '4', `9 банк: ${bank.length} задач, расхождений ${bad} ${ex}`);
    for (const g of J(T, 'Object.keys(GENS)')) {
      const tasks = J(T, `Array.from({length:${N}},()=>{const t=genTask(${JSON.stringify(g)});return {fam:t.fam,p:t.p,ask:t.ask,key:taskKey(t)};})`);
      let b = 0, e = '';
      for (const t of tasks) { const a = R9.answer(t); if (a.bad || !eq(a.key, Fq(t.key))) { b++; e = e || JSON.stringify(t.p, (k, v) => typeof v === 'bigint' ? String(v) : v).slice(0, 80); } }
      ok(!b, '4', `9 ${g}: расхождений ${b} ${e}`);
    }
  }
  { // 8
    const T = loadTrainer(TR[1].file, { seed: SEED });
    const bank = J(T, 'BANK.map(t=>{const st=buildSteps(t);return {id:t.id,type:t.type,p:t.p,ans:t.ans,last:st[st.length-1].ins[0].val};})');
    let bad = 0, ex = '';
    for (const t of bank) {
      let v; try { v = R8.value(t); } catch (e) { bad++; ex = ex || t.id + ' ' + e.message; continue; }
      if (!eq(v, R(t.ans[0], t.ans[1])) || !eq(v, Fq(t.last))) { bad++; ex = ex || t.id + ' ' + str(v); }
    }
    ok(!bad && bank.length === 160, '4', `8 банк: ${bank.length} задач, расхождений ${bad} ${ex}`);
    for (const ty of J(T, 'Object.keys(GEN)')) {
      const tasks = J(T, `Array.from({length:${N}},()=>{const t=GEN[${JSON.stringify(ty)}]();const st=buildSteps(t);return {type:t.type,p:t.p,last:st[st.length-1].ins[0].val};})`);
      let b = 0, e = '';
      for (const t of tasks) { let v; try { v = R8.value(t); } catch (x) { b++; e = e || x.message; continue; } if (!eq(v, Fq(t.last))) { b++; e = e || JSON.stringify(t.p); } }
      ok(!b, '4', `8 ${ty}: расхождений ${b} ${e}`);
    }
  }
  { // 7
    const T = loadTrainer(TR[0].file, { seed: SEED });
    const bank = J(T, 'BANK.map(t=>({id:t.id,kind:t.kind,sub:t.sub,mode:t.mode,vals:t.vals,opts:t.opts.map(o=>({html:o.html||""})),key:t.key,pairs:t.pairs,diffSign:t.diffSign,N:t.N,m:t.m,n:t.n,k:t.k,den:t.den,Ns:t.Ns,ms:t.ms,fracs:t.fracs,tm:t.tm,tn:t.tn,samples:t.samples,optK:t.optK,optPairs:t.optPairs,optD:t.optD,optVals:t.optVals,lo:t.lo,hi:t.hi,nums:t.nums,targetStr:t.targetStr,pic:t.pic?{pts:t.pic.pts}:null}))');
    let bad = 0, skipped = [], ex = '';
    for (const t of bank) { const k = R7.keyOf(t); if (k === null) { skipped.push(t.id); continue; } if (k !== t.key) { bad++; ex = ex || t.id + ': ' + k + ' против ' + t.key; } }
    ok(!bad && bank.length === 142, '4', `7 банк: ${bank.length} задач, расхождений ${bad} ${ex}`);
    ok(skipped.length <= 8, '4', `7 банк: без независимого пересчёта ${skipped.length} задач: ${skipped.join(', ')}`);
    const skippedN = skipped.length; skipped = skippedN;
    console.log(`      7 банк: пересчитано ${bank.length - skipped}, особых записей (только самопроверка) ${skipped}`);
    for (const tt of J(T, 'TYPE_IDS')) {
      const tasks = J(T, `Array.from({length:${N}},()=>{const t=genType(${JSON.stringify(tt)});return {kind:t.kind,sub:t.sub,mode:t.mode,vals:t.vals,opts:t.opts.map(o=>({html:o.html||""})),key:t.key,pairs:t.pairs,diffSign:t.diffSign,N:t.N,m:t.m,n:t.n,k:t.k,den:t.den,Ns:t.Ns,ms:t.ms,optK:t.optK,optPairs:t.optPairs,optD:t.optD,nums:t.nums,targetStr:t.targetStr,pic:t.pic?{pts:t.pic.pts}:null};})`);
      let b = 0, un = 0, e = '';
      for (const t of tasks) { const k = R7.keyOf(t); if (k === null) { un++; continue; } if (k !== t.key) { b++; e = e || JSON.stringify(t.opts.map(o => o.html)).slice(0, 90); } }
      ok(!b && !un, '4', `7 ${tt}: расхождений ${b}, не разобрано ${un} ${e}`);
    }
  }
});

/* 5. ловушки и диагностика */
section('5. ловушки и адресная диагностика', () => {
  { // 9: набор ловушек = пересчитанный, попарно различны, не ответ
    const T = loadTrainer(TR[2].file, { seed: SEED });
    const all = J(T, `BANK.map(t=>({id:t.id,fam:t.fam,p:t.p,ask:t.ask,tr:finalTraps(t).map(o=>({v:o.v,m:o.m}))})).concat(
      Object.keys(GENS).flatMap(g=>Array.from({length:${N}},()=>{const t=genTask(g);return {id:g,fam:t.fam,p:t.p,ask:t.ask,tr:finalTraps(t).map(o=>({v:o.v,m:o.m}))};})))`);
    let bad = 0, ex = '';
    for (const t of all) {
      const want = R9.trapValues(t), got = t.tr.map(o => Fq(o.v));
      const same = want && want.length === got.length && want.every(w => got.some(g => eq(g, w)));
      const key = R9.answer(t).key;
      const clean = got.every((g, i) => !eq(g, key) && got.every((h, j) => j === i || !eq(g, h))) && t.tr.every(o => o.m && o.m.length > 10);
      if (!same || !clean) { bad++; ex = ex || t.id + ' ' + got.map(str).join(',') + ' / ' + (want || []).map(str).join(','); }
    }
    ok(!bad, '5', `9: ${all.length} задач, нарушений ${bad} ${ex}`);
  }
  { // 8: ловушки ступеней; доля без объединений по видам с ловушками
    const T = loadTrainer(TR[1].file, { seed: SEED });
    const res = J(T, `(()=>{const out={bad:[],share:{}};const chk=(t,tag)=>{const st=buildSteps(t);st.forEach((s,j)=>{
        (s.traps||[]).forEach((a,i)=>{if(!s.ins[a.i]||feq(a.v,s.ins[a.i].val))out.bad.push(tag+' шаг '+(j+1)+': ловушка = ответу');
          (s.traps||[]).forEach((b,k)=>{if(k>i&&a.i===b.i&&feq(a.v,b.v))out.bad.push(tag+' шаг '+(j+1)+': две ловушки на одном числе');});
          if(!a.m||a.m.length<10)out.bad.push(tag+': ловушка без сообщения');});});return st;};
      BANK.forEach(t=>chk(t,'банк '+t.id));
      Object.keys(GEN).forEach(ty=>{let has=0,nm=0;for(let i=0;i<${N};i++){const st=chk(GEN[ty](),ty);
        if(st.some(s=>s.traps.length||s.trapMerged||s.trapDropped)){has++;if(st.every(s=>!s.trapMerged))nm++;}}
        if(has)out.share[ty]=Math.round(1000*nm/has)/10;});
      return out;})()`);
    ok(!res.bad.length, '5', '8: ' + res.bad.length + ' нарушений ' + res.bad.slice(0, 3).join(' | '));
    const POWER = ['pow_mul_div', 'pow_pow_div', 'pow_mul_pow', 'pow_over_num', 'recip_pow', 'pow_var_div', 'pow_prodbase_div', 'prodbase_over', 'pow_ab', 'fold_square', 'sci'];
    for (const ty of POWER) ok((res.share[ty] || 0) >= 70, '5', `8 ${ty}: задач без объединённых ловушек ${res.share[ty]} % < 70 %`);
    console.log('      8: без объединённых ловушек, % — ' + POWER.map(ty => ty + ' ' + res.share[ty]).join(', '));
  }
  { // 7: у каждого неверного варианта сообщение; посылки «сдвиг» и «промежуток» перепроверяются
    const T = loadTrainer(TR[0].file, { seed: SEED });
    const all = J(T, `BANK.concat(TYPE_IDS.flatMap(tt=>Array.from({length:${N}},()=>genType(tt)))).map(t=>({id:t.id||t.tt,mode:t.mode,vals:t.vals,
      opts:t.opts.map(o=>({html:o.html||""})),key:t.key,dg:optDiag(t),X:(targetOf(t)||{}).X,pts:t.pic&&t.pic.pts}))`);
    let bad = 0, ex = '', nshift = 0, nspecial = 0;
    for (const t of all) {
      t.dg.forEach((d, i) => {
        const err = (m) => { bad++; ex = ex || t.id + ' вариант ' + (i + 1) + ': ' + m; };
        if (i + 1 === t.key) { if (d) err('диагностика у верного'); return; }
        if (!d || !d.m) return err('нет сообщения');
        if (/вариант\s*\d/.test(d.m.replace(/<[^>]*>/g, ''))) err('сообщение называет номер варианта');
        if (d.k === 'shift') { // особые записи (списки чисел) своим разбором не читаются — их посылку проверяет самопроверка
          const want = t.mode !== 'неверно';
          const q = t.vals[d.v], lo = Number(q.n >= 0n ? q.n / q.d : -((-q.n + q.d - 1n) / q.d));
          // «было бы верно на соседнем отрезке» — на всём отрезке: девять точек через десятую
          const t1s = Array.from({ length: 9 }, (_, j) => { const sh = Object.assign({}, t.vals); sh[d.v] = { n: BigInt(10 * (lo + d.s) + j + 1), d: 10n }; return R7.truth(t.opts[i].html, sh); });
          const t0 = R7.truth(t.opts[i].html, t.vals);
          if (t1s.some(x => x === null) || t0 === null) nspecial++;
          else { nshift++; if (t1s.some(x => x !== want) || t0 === want) err('посылка сдвига не на всём отрезке'); }
          // числа в сообщении: промежуток на рисунке и соседний — своим делением с округлением вниз
          const f = (x) => String(x).replace('-', '−');
          const txt = d.m.replace(/<[^>]*>/g, '');
          if (!txt.includes('между ' + f(lo + d.s) + ' и ' + f(lo + d.s + 1)) || !txt.includes('между ' + f(lo) + ' и ' + f(lo + 1))) err('числа промежутков в сообщении');
        }
        if ((d.k === 'int' || d.k === 'half') && t.pts && t.X != null) {
          const same = Math.floor(t.pts[i].x) === Math.floor(t.X);
          if (same !== (d.k === 'half')) err('посылка про промежуток');
        }
      });
    }
    ok(!bad, '5', `7: ${all.length} задач, нарушений ${bad} ${ex}`);
    ok(nshift > 100 && nspecial <= 20, '5', '7: сообщений «соседний отрезок» проверено ' + nshift + ', особых записей ' + nspecial);
    // ловушки ступеней — по виду ступени: на чтении рисунка нет корней (не выдать ответ),
    // в дробях и делении нет «точки», у «крест-накрест» ловушек нет
    const steps = J(T, `BANK.concat(TYPE_IDS.flatMap(tt=>Array.from({length:60},()=>genType(tt)))).flatMap(t=>stepsFor(t,"school")
      .filter(s=>s.traps2).map(s=>({id:t.id||t.tt,q:s.q,a:[s.ans1,s.ans2],tr:s.traps2})))`);
    let sb = 0, sex = '';
    for (const s of steps) {
      const q = s.q, ms = s.tr.map(x => x.m).join(' | ');
      const e = (m) => { sb++; sex = sex || s.id + ': ' + m + ' — ' + q.replace(/<[^>]*>/g, '').slice(0, 50); };
      if (/крест-накрест/.test(q)) e('ловушки на ступени «крест-накрест»');
      if (/рисун|Точка/.test(q) && /sqrt|√/.test(ms)) e('на чтении рисунка ловушка с корнем');
      if (/Подели с остатком|лежит между целыми/.test(q) && !/sqrt/.test(q) && /точк|Точк/.test(ms)) e('в дроби или делении ловушка про точку');
      if (/Подели с остатком/.test(q) && s.tr.some(x => !/Остаток/.test(x.m))) e('в делении — не ловушка остатка');
      if (s.tr.some(x => x.v1 === s.a[0] && x.v2 === s.a[1])) e('ловушка = ответу');
    }
    ok(!sb, '5', `7 ступени: ${steps.length} с ловушками, нарушений ${sb} ${sex}`);
  }
  { // 9: строка «если корней несколько» — как в КИМ, и при постороннем корне (не выдаёт ОДЗ)
    const T = loadTrainer(TR[2].file, { seed: SEED });
    const all = J(T, `BANK.concat(Object.keys(GENS).flatMap(g=>Array.from({length:200},()=>genTask(g)))).map(t=>{const s=taskSolve(t);
      return {id:t.id||t.gid,n:s.roots.length+s.excluded.length,line:/более одного корня/.test(taskInstrHTML(t))};})`);
    const bad = all.filter(t => (t.n >= 2) !== t.line);
    ok(!bad.length, '5', `9: строка о корнях не по правилу в ${bad.length} задачах: ${bad.slice(0, 3).map(t => t.id).join(', ')}`);
  }
});

/* 6. место верного варианта в 7 */
section('6. 7: место верного варианта — каждое из четырёх не реже 15 %', () => {
  const T = loadTrainer(TR[0].file, { seed: SEED });
  const c = J(T, `Object.fromEntries(["pts/root","pts/frac","root/inrange","frac/inrange"].map(tt=>{const c=[0,0,0,0];for(let i=0;i<${N};i++)c[genType(tt).key-1]++;return [tt,c];}))`);
  for (const [tt, cnt] of Object.entries(c)) ok(cnt.every(x => x >= 0.15 * N), '6', `${tt}: ${cnt.join('/')}`);
  console.log('      ' + Object.entries(c).map(([k, v]) => k + ' ' + v.join('/')).join('; '));
});

/* 7. разнообразие */
section('7. разнообразие: разных задач каждого вида не меньше 95 % базы с main', () => {
  if (!fs.existsSync(BASE_FILE)) { ok(false, '7', 'нет базы ' + path.relative(ROOT, BASE_FILE) + ' — node tools/oge-algebra-contract.test.mjs --make-base <ref>'); return; }
  const base = JSON.parse(fs.readFileSync(BASE_FILE, 'utf8'));
  for (const t of TR) {
    const T = loadTrainer(t.file, { seed: base.seed });
    const cur = JSON.parse(T.run('JSON.stringify(' + UNIQ[t.n].replace(/__N__/g, String(base.n)) + ')'));
    for (const [k, b] of Object.entries(base.unique[t.n] || {})) {
      ok(k in cur, '7', t.n + ' ' + k + ': вид пропал');
      ok(cur[k] >= Math.floor(b * 0.95), '7', `${t.n} ${k}: разных задач ${cur[k]} < 95 % базы ${b}`);
    }
  }
});

/* 8. контракт прогресса */
section('8. контракт прогресса: ядро, порог, журнал, мусор, две вкладки, повтор', () => {
  for (const t of TR) {
    const tag = t.n;
    { const S = makeStorage(); const T = loadTrainer(t.file, { storage: S });
      ok(T.run('QUIZ_TOTAL') === 10 && T.run('PASS_AT') === 8, '8', tag + ': QUIZ_TOTAL 10, PASS_AT 8');
      const ids = J(T, 'TYPE_IDS'), t0 = ids[0];
      T.run('CP.solvedOne(TYPE_IDS[0])');
      let r = readKey(S)[t.tid];
      ok(r.v === 1 && typeof r.updatedAt === 'number' && r.solvedByType[t0] === 1, '8', tag + ': ядро v:1, updatedAt, solvedByType');
      T.run('CP.mlog(TYPE_IDS[0], true)');
      ok(!((readKey(S).mistakes || {})[t.tid + '|' + t0]), '8', tag + ': верный без промаха не заводит запись');
      T.run('CP.mlog(TYPE_IDS[0], false)');
      let m = readKey(S).mistakes[t.tid + '|' + t0];
      ok(m.w === 1 && m.r === 0 && J(T, 'CP.openTypes()').includes(t0), '8', tag + ': промах открывает тип');
      T.run('CP.mlog(TYPE_IDS[0], true);CP.mlog(TYPE_IDS[0], true);CP.mlog(TYPE_IDS[0], true)');
      m = readKey(S).mistakes[t.tid + '|' + t0];
      ok(m.r === 3 && !J(T, 'CP.openTypes()').includes(t0), '8', tag + ': три верных закрывают тип');
      T.run('CP.finishQuiz(7, 10)');
      r = readKey(S)[t.tid];
      ok(r.passed !== true && r.runs === 1 && r.best === 7 && r.total === 10, '8', tag + ': 7 из 10 — не сдан');
      T.run('CP.finishQuiz(8, 10)');
      ok(readKey(S)[t.tid].passed === true, '8', tag + ': 8 из 10 — сдан');
      T.run('CP.finishQuiz(0, 10)');
      r = readKey(S)[t.tid];
      ok(r.passed === true && r.best === 8 && r.runs === 3, '8', tag + ': неудачная попытка не снимает passed и не роняет best');
      ok(ids.every(x => typeof x === 'string' && !x.includes('|')) && new Set(ids).size === ids.length, '8', tag + ': TYPE_IDS — различные строки без «|»');
    }
    for (const j of JUNK_KEY) {
      const S = makeStorage(); S.map.set(KEY, j);
      let err = ''; try { const T = loadTrainer(t.file, { storage: S }); T.run('CP.solvedOne(TYPE_IDS[1]);CP.mlog(TYPE_IDS[1],false);CP.finishQuiz(1,10)'); } catch (e) { err = String(e).slice(0, 120); }
      const all = readKey(S);
      ok(!err && all && all[t.tid] && all[t.tid].v === 1, '8', tag + ': мусор в ключе ' + j + ' ' + err);
    }
    for (const j of JUNK_REC) {
      const S = makeStorage(); S.map.set(KEY, '{"' + t.tid + '":' + j + ',"other":{"x":1}}');
      let err = ''; try { const T = loadTrainer(t.file, { storage: S }); T.run('CP.solvedOne(TYPE_IDS[1]);CP.finishQuiz(1,10)'); } catch (e) { err = String(e).slice(0, 120); }
      const all = readKey(S), r = all && all[t.tid];
      ok(!err && r && r.v === 1 && Number.isInteger(r.runs) && Number.isInteger(r.best) && JSON.stringify(all.other) === '{"x":1}', '8', tag + ': мусор в ветке ' + j + ' ' + err);
    }
    { const S = makeStorage(); const A = loadTrainer(t.file, { storage: S }); const B = loadTrainer(t.file, { storage: S });
      A.run('CP.solvedOne(TYPE_IDS[2])'); B.run('CP.solvedOne(TYPE_IDS[3])'); A.run('CP.mlog(TYPE_IDS[4],false)'); B.run('CP.finishQuiz(8,10)');
      const all = readKey(S), r = all[t.tid], ids = J(A, 'TYPE_IDS');
      ok(r.solvedByType[ids[2]] === 1 && r.solvedByType[ids[3]] === 1 && r.passed === true && all.mistakes[t.tid + '|' + ids[4]].w === 1, '8', tag + ': две вкладки не затирают друг друга'); }
    { // ?mode=review: только открытые типы; задачи повтора — из открытых
      const S = makeStorage(); const A = loadTrainer(t.file, { storage: S }); const ids = J(A, 'TYPE_IDS');
      const open = t.n === 8 ? 'pow1' : t.n === 9 ? 'XF' : 'root/inrange';
      A.run('CP.mlog(' + JSON.stringify(open) + ', false)');
      const B = loadTrainer(t.file, { storage: S, search: '?mode=review', seed: 3 });
      ok(B.run('CP.REVIEW') === true && JSON.stringify(J(B, 'CP.openTypes()')) === JSON.stringify([open]), '8', tag + ': ?mode=review видит ровно открытый тип');
      const pick = t.n === 7 ? '(reviewOn=true,genForSelection().tt)' : t.n === 8 ? 'typeGroup[reviewTask().type]' : 'reviewTask().fam';
      const picks = J(B, `Array.from({length:30},()=>${pick})`);
      ok(picks.every(x => x === open), '8', tag + ': задачи повтора только открытого типа: ' + [...new Set(picks)].join(','));
      ok(ids.includes(open), '8', tag + ': тип ' + open + ' есть в TYPE_IDS');
    }
  }
});

/* 9. реестр */
section('9. реестр: TYPE_IDS и имена типов совпадают с oge/registry.js', () => {
  const RV = require(path.join(ROOT, 'oge/registry.js'));
  for (const t of TR) {
    const T = loadTrainer(t.file, { seed: 1 });
    const ids = J(T, 'TYPE_IDS');
    ok(JSON.stringify(ids) === JSON.stringify(RV.TYPES[t.tid]), '9', t.tid + ': TYPE_IDS ≠ TYPES реестра');
    ok(RV.TRAINERS[t.tid] && RV.TRAINERS[t.tid].review === true && RV.TRAINERS[t.tid].contract === 'line', '9', t.tid + ': в реестре review:true, contract:"line"');
    const names = J(T, t.n === 7 ? 'Object.fromEntries(TYPE_IDS.map(k=>[k,typeName(k)]))' : t.n === 8 ? 'Object.fromEntries(GROUPS.map(g=>[g.k,"Степени и корни: "+g.name]))' : 'TYPE_NAMES');
    for (const id of ids) {
      const reg = RV.NAMES[t.tid + '|' + id] && RV.NAMES[t.tid + '|' + id].n;
      const mine = names[id];
      ok(reg && mine && (reg === mine || reg.endsWith(': ' + mine)), '9', `${t.tid}|${id}: в реестре «${reg}», в тренажёре «${mine}»`);
    }
  }
});

/* 10. «Показать ответ», родовые формы */
section('10. нет кнопок «Показать ответ» (D3), нет родовых форм (F7)', () => {
  const s7 = readTrainer(TR[0].file), s8 = readTrainer(TR[1].file), s9 = readTrainer(TR[2].file);
  ok(!/Показать ответ/.test(s8) && !/Показать ответ/.test(s9), '10', '8/9: осталась кнопка «Показать ответ»');
  ok((s7.match(/Показать ответ/g) || []).length === 1 && s7.includes('showB=h("button","btn show small","Показать ответ")'), '10', '7: «Показать ответ» — только виджет П1 в «Учимся»');
  const re = /(^|[^а-яёА-ЯЁ])(ты\s+[а-яё]+(?:ёл|ел|ал|ил|ыл|ул|ял|шёл|ла|лся|лась)|прош[её]л|прошла|ошибся|ошиблась|застрял|застряла|сдался|сдалась|наш[её]л|нашла|посчитал|посчитала|дош[её]л|дошла|справился|справилась|добей сам|самому|самой решать)(?=[^а-яёА-ЯЁ]|$)/giu;
  const ALLOW = ['корень, который прошёл проверку знаменателя', "генератор не справился"];   // не обращение к ученику
  for (const t of TR) {
    const hits = [];
    readTrainer(t.file).split('\n').forEach((line, i) => { if (ALLOW.some(a => line.includes(a))) return; let m; re.lastIndex = 0; while ((m = re.exec(line))) hits.push((i + 1) + ': ' + m[2]); });
    ok(!hits.length, '10', t.file + ': ' + hits.slice(0, 5).join(' | '));
  }
});

console.log('\nпроверок: ' + checks + ', провалов: ' + fails);
if (fails) { failed.slice(0, 60).forEach(f => console.log('  ' + f)); process.exitCode = 1; }
else console.log('OGE_ALGEBRA_GATE_OK');

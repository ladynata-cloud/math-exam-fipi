#!/usr/bin/env node
/*
  Гейт OGE_COURSE_03D_ALGEBRA: тренажёры алгебры 7, 8, 9 (часть A)
  и 10, 11, 12, 14 (часть B).
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
  Часть B (решения D15–D53): B4 — независимый пересчёт 10 (по тексту и чертежу),
  11 (формула пункта против ломаной графика), 12 (формула из строки ученика), 14 (по данным
  условия); B5 — ловушки: у 10 набор пересчитан по условию, у 11 признаки перепутанных пар
  и сообщения без букв, у 12 и 14 без совпадений; ни подсказка, ни ловушка не называют ответ;
  B6 — миграция старых ключей и сброс своей ветки.
*/
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { ROOT, KEY, readTrainer, syntaxCheck, loadTrainer, makeStorage, readKey, JUNK_KEY, JUNK_REC, R, eq, str, parseNum } from './oge-algebra-contract.lib.mjs';
import * as R7 from './oge-algebra-contract.t7.mjs';
import * as R8 from './oge-algebra-contract.t8.mjs';
import * as R9 from './oge-algebra-contract.t9.mjs';
import * as R10 from './oge-algebra-contract.t10.mjs';
import * as R11 from './oge-algebra-contract.t11.mjs';
import * as R12 from './oge-algebra-contract.t12.mjs';
import * as R14 from './oge-algebra-contract.t14.mjs';

const require = createRequire(import.meta.url);
const SEED = 20260929, N = 500;
const BASE_FILE = path.join(ROOT, 'tools/oge-algebra-contract.baseline.json');
const TR = [
  { n: 7, file: 'trainers/oge-task7-number-line.html', tid: 'oge-t7-pryamaya', name: 'OGE7', selftest: 'selftest7()' },
  { n: 8, file: 'trainers/oge-task8-powers-roots.html', tid: 'oge-t8-stepeni', name: 'OGE8' },
  { n: 9, file: 'trainers/oge-task9-equations.html', tid: 'oge-t9-uravneniya', name: 'OGE9' },
  { n: 10, file: 'trainers/oge-task10-probability.html', tid: 'oge-t10-veroyatnost', name: 'OGE10', selftest: 'selftest10()' },
  { n: 11, file: 'trainers/oge-task11-graphs-trainer.html', tid: 'oge-t11-grafiki', name: 'OGE11' },
  { n: 12, file: 'trainers/oge-task12-formulas-trainer.html', tid: 'oge-t12-formuly', name: 'OGE12' },
  { n: 14, file: 'trainers/oge-task14-progressions.html', tid: 'oge-t14-progressii', name: 'OGE14' },
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
  10: `(()=>{const out={};TYPE_LIST.forEach(([c])=>{const s=new Set();for(let i=0;i<__N__;i++){const t=genTask(c,RT);s.add(t.text+(t.svg||''));}out[c]=s.size;});return out;})()`,
  11: `(()=>{const out={};TYPE_IDS.forEach(tt=>{const s=new Set();for(let i=0;i<__N__;i++){const X=m4Make(tt);s.add(X.items.map(it=>it.desc).sort().join('|'));}out[tt]=s.size;});return out;})()`,
  12: `(()=>{const out={};for(let ty=1;ty<=10;ty++){const G=GENS.filter(g=>g.t===ty),s=new Set();for(let i=0;i<__N__;i++)s.add(pick(G).make().story);out[ty]=s.size;}return out;})()`,
  14: `(()=>{const out={};Object.keys(T14.GENS).forEach(c=>{const s=new Set();for(let i=0;i<__N__;i++)s.add(T14.makeTask(c,i*7919+3).text);out[c]=s.size;});return out;})()`,
};
/* в базе (main до части B) у 11 нет m4Make — те же генераторы по старым именам */
const UNIQ11_MAIN = `(()=>{const G={t41:gen41,t42:gen42,t43:gen43,t44:gen44,t45:gen45};const out={};Object.keys(G).forEach(tt=>{const s=new Set();
  for(let i=0;i<__N__;i++){let X;for(let k=0;k<50;k++){X=G[tt]();if(new Set(X.items.map(it=>it.sig)).size===3)break;}s.add(X.items.map(it=>it.desc).sort().join('|'));}out[tt]=s.size;});return out;})()`;
/* в базе (main) у 7 нет GEN7 — те же генераторы по старым именам */
const UNIQ7_MAIN = `(()=>{const G={"ris/one":genA1,"ris/two":genA2,"ris/diff":genA3,"ris/abs":genA4,"frac/betint":genB_fracBetweenInt,
  "frac/tenths":genB_fracTenths,"frac/inrange":genB_fracInRange,"root/betint":genB_rootBetween,"root/inrange":genB_rootInRange,
  "pts/root":genC_root,"pts/frac":genC_frac,"pts/dec":genC_decOrder};const out={};Object.keys(G).forEach(tt=>{const s=new Set();
  for(let i=0;i<__N__;i++){const t=G[tt]();s.add(JSON.stringify([t.text||'',t.vals?Object.keys(t.vals).map(k=>t.vals[k].n+'/'+t.vals[k].d):[],(t.opts||[]).map(o=>o.html).sort()]));}
  out[tt]=s.size;});return out;})()`;

if (process.argv[2] === '--make-base') {
  const ref = process.argv[3];
  if (!ref) { console.log('укажите ref: --make-base <ref> [номера тренажёров через запятую]'); process.exit(1); }
  const only = process.argv[4] ? process.argv[4].split(',').map(Number) : null;
  const base = fs.existsSync(BASE_FILE) ? JSON.parse(fs.readFileSync(BASE_FILE, 'utf8')) : { seed: SEED, n: N, unique: {} };
  if (!base.refs) base.refs = {};
  for (const t of TR) {
    if (only && !only.includes(t.n)) continue;
    base.refs[t.n] = ref;
    const html = execFileSync('git', ['-C', ROOT, 'show', ref + ':' + t.file], { encoding: 'utf8', maxBuffer: 64 << 20 });
    // старая 8 в заглушке DOM падает на фокусе поля лестницы; генераторы от этого не зависят
    const htmlVm = html.replace('ins[0].focus({preventScroll:true});', 'if(ins[0])ins[0].focus({preventScroll:true});');
    const T = loadTrainer(t.file, { html: htmlVm, seed: SEED });
    const code = (t.n === 7 ? UNIQ7_MAIN : t.n === 11 ? UNIQ11_MAIN : UNIQ[t.n]).replace(/__N__/g, String(N));
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

/* 7. разнообразие. Перевыбор чисел при совпавших ловушках (решения D28, D41, D46) и листья B
   из разных ветвей (D29) законно сужают набор: для этих видов порог — доля базы из NARROW */
const NARROW = { 10: { '10.1': 0.9, '10.2': 0.9, '10.3': 0.9, '10.4': 0.9, '10.5': 0.6, '10.6': 0.8, '10.7': 0.9 }, 12: { 5: 0.8, 10: 0.9 }, 14: { 'AP-SUM': 0.85, 'AP-2PT': 0.9, 'AP-SUM2DAY': 0.9, 'GP-VAL': 0.85 } };
section('7. разнообразие: разных задач каждого вида не меньше 95 % базы с main', () => {
  if (!fs.existsSync(BASE_FILE)) { ok(false, '7', 'нет базы ' + path.relative(ROOT, BASE_FILE) + ' — node tools/oge-algebra-contract.test.mjs --make-base <ref>'); return; }
  const base = JSON.parse(fs.readFileSync(BASE_FILE, 'utf8'));
  for (const t of TR) {
    const T = loadTrainer(t.file, { seed: base.seed });
    const cur = JSON.parse(T.run('JSON.stringify(' + UNIQ[t.n].replace(/__N__/g, String(base.n)) + ')'));
    const narrow = NARROW[t.n] || {};
    for (const [k, b] of Object.entries(base.unique[t.n] || {})) {
      ok(k in cur, '7', t.n + ' ' + k + ': вид пропал');
      const need = Math.floor(b * (narrow[k] || 0.95));
      ok(cur[k] >= need, '7', `${t.n} ${k}: разных задач ${cur[k]} < ${need} (база ${b})`);
    }
    if (t.n >= 10) console.log('      ' + t.n + ': разных задач из ' + base.n + ' (база → сейчас) — ' + Object.keys(base.unique[t.n] || {}).map(k => k + ' ' + base.unique[t.n][k] + '→' + cur[k]).join(', '));
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
      const open = { 7: 'root/inrange', 8: 'pow1', 9: 'XF', 10: '10_6', 11: 't44', 12: '6', 14: 'TAXI' }[t.n];
      A.run('CP.mlog(' + JSON.stringify(open) + ', false)');
      const B = loadTrainer(t.file, { storage: S, search: '?mode=review', seed: 3 });
      ok(B.run('CP.REVIEW') === true && JSON.stringify(J(B, 'CP.openTypes()')) === JSON.stringify([open]), '8', tag + ': ?mode=review видит ровно открытый тип');
      const pick = { 7: '(reviewOn=true,genForSelection().tt)', 8: 'typeGroup[reviewTask().type]', 9: 'reviewTask().fam', 10: 'typeOf(reviewTask().code)',
        11: '(M4.review=true,M4.type="rand",m4New(),M4.task.type)', 12: 'String(reviewTask().t)', 14: 'T14.reviewCode()' }[t.n];
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
    const names = t.n === 11
      ? Object.fromEntries([...readTrainer(t.file).matchAll(/data-t="(t4\d)">([^<]*)</g)].map(m => [m[1], m[2]]))
      : J(T, { 7: 'Object.fromEntries(TYPE_IDS.map(k=>[k,typeName(k)]))', 8: 'Object.fromEntries(GROUPS.map(g=>[g.k,"Степени и корни: "+g.name]))', 9: 'TYPE_NAMES',
        10: 'Object.fromEntries(TYPE_LIST.map(([c,n])=>[typeOf(c),n]))', 12: 'Object.fromEntries(TYPE_IDS.map(k=>[k,TYPES[k].name]))',
        14: 'Object.fromEntries(TYPE_IDS.map(k=>[k,T14.GENS[k].title]))' }[t.n]);
    for (const id of ids) {
      const reg = RV.NAMES[t.tid + '|' + id] && RV.NAMES[t.tid + '|' + id].n;
      const mine = names[id];
      ok(reg && mine && (reg === mine || reg.endsWith(': ' + mine)), '9', `${t.tid}|${id}: в реестре «${reg}», в тренажёре «${mine}»`);
    }
  }
});

/* 10. «Показать ответ», родовые формы */
const byN = (n) => TR.find(t => t.n === n);
section('10. нет кнопок «Показать ответ» (D3), нет родовых форм (F7)', () => {
  const s7 = readTrainer(TR[0].file), s8 = readTrainer(TR[1].file), s9 = readTrainer(TR[2].file);
  ok(!/Показать ответ/.test(s8) && !/Показать ответ/.test(s9), '10', '8/9: осталась кнопка «Показать ответ»');
  ok((s7.match(/Показать ответ/g) || []).length === 1 && s7.includes('showB=h("button","btn show small","Показать ответ")'), '10', '7: «Показать ответ» — только виджет П1 в «Учимся»');
  const re = /(^|[^а-яёА-ЯЁ])(ты\s+[а-яё]+(?:ёл|ел|ал|ил|ыл|ул|ял|шёл|ла|лся|лась)|прош[её]л|прошла|ошибся|ошиблась|застрял|застряла|сдался|сдалась|наш[её]л|нашла|посчитал|посчитала|дош[её]л|дошла|справился|справилась|добей сам|самому|самой решать)(?=[^а-яёА-ЯЁ]|$)/giu;
  const s10 = readTrainer(byN(10).file), s11 = readTrainer(byN(11).file), s12 = readTrainer(byN(12).file), s14 = readTrainer(byN(14).file);
  ok(![s10, s11, s12].some(x => /Показать ответ/.test(x)), '10', '10/11/12: осталась кнопка «Показать ответ»');
  ok(!/Показать разбор/.test(s10) && !/id="m-reveal"/.test(s14), '10', '10/14: осталась кнопка показа разбора или ответа в Марафоне');
  ok((s14.match(/Показать ответ/g) || []).length === 2 && /id="l2show">Показать ответ/.test(s14) && /id="l3show">Показать ответ/.test(s14), '10', '14: «Показать ответ» — только в «Учимся»');
  ok(!/disabled title="Файл появится позже"/.test(s11), '10', '11: остались кнопки-заглушки');
  ok(![s10, s11, s12, s14].some(x => /,'\\\\\/\* =====/.test(x)), '10', 'экранирование в самопроверке испорчено подстановкой «$&»');
  ok(!/id="selfcheck"/.test(s10) && !/id="selfcheck"/.test(s14), '10', '10/14: самопроверка видна ученику');
  const ALLOW = ['корень, который прошёл проверку знаменателя', "генератор не справился", 'Турист прошёл'];   // не обращение к ученику
  for (const t of TR) {
    const hits = [];
    readTrainer(t.file).split('\n').forEach((line, i) => { if (ALLOW.some(a => line.includes(a))) return; let m; re.lastIndex = 0; while ((m = re.exec(line))) hits.push((i + 1) + ': ' + m[2]); });
    ok(!hits.length, '10', t.file + ': ' + hits.slice(0, 5).join(' | '));
  }
});


/* ===================== часть B: 10, 11, 12, 14 ===================== */
const TB = TR.filter(t => t.n >= 10);
const GJ = (T, code) => JSON.parse(T.run('JSON.stringify(' + code + ',(k,v)=>typeof v==="bigint"?{$b:v.toString()}:(typeof v==="function"?undefined:v))'),
  (k, v) => (v && typeof v === 'object' && '$b' in v ? BigInt(v.$b) : v));
/* число v отдельным числом в тексте (десятичная запись с запятой; разрядные пробелы не мешают) */
function hasNumB(text, v) {
  const plain = String(text).replace(/<span class="frac"><span class="tt">(\d+)<\/span><span class="bb">(\d+)<\/span><\/span>/g, '$1/$2')
    .replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/(\d)[    ](?=\d{3})/g, '$1').replace(/−/g, '-');
  const s = R12.decStr(v);
  if (s === null) return false;
  return new RegExp('(^|[^\\d,/])' + (v.n < 0n ? '-' : '') + s.replace(/,/g, ',') + '(?![\\d]|,\\d)').test(plain);
}

section('B4. независимый пересчёт 10, 11, 12, 14: по 500 задач на тип', () => {
  { // 10: по тексту условия и подписям чертежа
    const T = loadTrainer(byN(10).file, { seed: SEED });
    for (const [code] of GJ(T, 'TYPE_LIST')) {
      const tasks = GJ(T, `Array.from({length:${N}},()=>{const t=genTask(${JSON.stringify(code)},RT);return {code:t.code,text:t.text,svg:t.svg||'',answer:t.answer,rounded:t.rounded||null};})`);
      let b = 0, e = '';
      for (const t of tasks) { const s = R10.solve(t); if (s.bad || !eq(s.key, Fq(t.answer)) || (s.rounded ? !(t.rounded && eq(s.rounded, Fq(t.rounded))) : !!t.rounded)) { b++; e = e || (s.bad || str(s.key)) + ' ' + t.text.replace(/<[^>]*>/g, '').slice(0, 60); } }
      ok(!b, 'B4', `10 ${code}: расхождений ${b} ${e}`);
    }
  }
  { // 11: формула пункта против ломаной на чертеже и ключ ответа
    const T = loadTrainer(byN(11).file, { seed: SEED });
    for (const type of GJ(T, 'TYPE_IDS')) {
      const tasks = JSON.parse(T.run(`JSON.stringify(Array.from({length:${N}},()=>{const X=m4Make(${JSON.stringify(type)});return {type:X.type,items:X.items.map(it=>({desc:it.desc})),key:X.key,order:X.order,svgs:X.order.map(ix=>svgGraph([X.items[ix].plot],[],{size:300}))};}))`));
      let b = 0, e = '';
      for (const t of tasks) { const er = R11.check(t); if (er.length) { b++; e = e || er[0]; } }
      ok(!b, 'B4', `11 ${type}: нарушений ${b} ${e}`);
    }
  }
  { // 12: формула из строки ученика, подстановка чисел подписей и ответа — точно
    const T = loadTrainer(byN(12).file, { seed: SEED });
    for (let ty = 1; ty <= 10; ty++) {
      const tasks = GJ(T, `Array.from({length:${N}},()=>{const G=GENS.filter(g=>g.t===${ty});const t=pick(G).make();return {t:t.t,target:t.target,answer:t.answer,story:t.story,formula:t.formula,letters:t.letters,subst:t.subst?{tpl:t.subst.tpl,vals:t.subst.vals}:null};})`);
      let b = 0, e = '';
      for (const t of tasks) { const er = R12.check(t); if (er.length) { b++; e = e || er[0]; } }
      ok(!b, 'B4', `12 тип ${ty}: нарушений ${b} ${e}`);
    }
  }
  { // 14: ответ из данных условия своим кодом
    const T = loadTrainer(byN(14).file, { seed: SEED });
    for (const code of GJ(T, 'TYPE_IDS')) {
      const tasks = GJ(T, `Array.from({length:${N}},(_,i)=>{const t=T14.makeTask(${JSON.stringify(code)},i*7919+3);return {code:t.code,facts:t.facts,text:t.text,ans:t.ans};})`);
      let b = 0, e = '';
      for (const t of tasks) { const s = R14.value(t); if (s.bad || !eq(s.v, Fq(t.ans))) { b++; e = e || (s.bad || str(s.v)); } }
      ok(!b, 'B4', `14 ${code}: расхождений ${b} ${e}`);
    }
  }
});

section('B5. ловушки 10, 11, 12, 14: пересчёт, без совпадений, без ответа в сообщениях', () => {
  { // 10: набор ловушек = пересчитанный по условию; подсказки и ловушки не называют ответ (D20)
    const T = loadTrainer(byN(10).file, { seed: SEED });
    const all = GJ(T, `TYPE_LIST.flatMap(([c])=>Array.from({length:${N}},()=>{const t=genTask(c,RT);return {code:t.code,text:t.text,svg:t.svg||'',answer:t.answer,rounded:t.rounded||null,tr:finalTraps10(t).map(o=>({v:o.v,m:o.m})),hints:t.hints,clean:trapsClean(t),steps:t.steps.map(s=>({ans:s.ans,chk:s.chk,traps:s.traps||[]}))};}))`);
    let bad = 0, ex = '', dirty = {}, leak = 0, lex = '';
    for (const t of all) {
      const want = R10.trapValues(t), got = t.tr.map(o => Fq(o.v));
      const same = want && want.length === got.length && want.every(w => got.some(g => eq(g, w)));
      if (!same || t.tr.some(o => !o.m || o.m.length < 15)) { bad++; ex = ex || t.code + ' ' + got.map(str).join(',') + ' / ' + (want || []).map(str).join(','); }
      if (!t.clean) dirty[t.code] = (dirty[t.code] || 0) + 1;
      t.steps.forEach(s => { if (!s.chk || s.traps.some(x => eq(Fq(x.v), Fq(s.ans)))) { bad++; ex = ex || t.code + ': ступень без «что проверяет» или ловушка = ответу ступени'; } });
      const s = R10.solve(t), ak = s.rounded || s.key;
      if (!hasNumB(t.text + ' ' + t.svg, ak)) t.hints.concat(t.tr.map(o => o.m)).forEach(h => { if (hasNumB(h, ak)) { leak++; lex = lex || t.code + ': «' + h.replace(/<[^>]*>/g, '').slice(0, 60) + '»'; } });
    }
    ok(!bad, 'B5', `10: ${all.length} задач, нарушений ${bad} ${ex}`);
    ok(!leak, 'B5', `10: подсказка или ловушка называет ответ: ${leak} ${lex}`);
    for (const [c, n] of Object.entries(dirty)) ok(n <= 0.05 * N, 'B5', `10 ${c}: задач с совпавшими ловушками ${n} из ${N}`);
    console.log('      10: задач с полным набором ловушек, % — ' + GJ(T, 'TYPE_LIST.map(x=>x[0])').map(c => c + ' ' + Math.round(100 * (1 - (dirty[c] || 0) / N))).join(', '));
  }
  { // 11: признаки перепутанных пар — те же, что у гейта; первое сообщение без букв и без признака пары
    const T = loadTrainer(byN(11).file, { seed: SEED });
    const CAT = { t41: { a: 'a', c: 'c' }, t42: { a: 'a', side: 'side' }, t43: { k: 'k', b: 'b' } };
    let bad = 0, ex = '';
    for (const type of GJ(T, 'TYPE_IDS')) {
      const tasks = JSON.parse(T.run(`JSON.stringify(Array.from({length:200},()=>{const X=m4Make(${JSON.stringify(type)});
        return {type:X.type,items:X.items.map(it=>({desc:it.desc})),key:X.key,order:X.order,
          perms:[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]].map(a=>{const d=m4Diag(X,a);return {a,right:d.right,cats:d.cats,m1:m4Msg(X,d,1),m2:m4Msg(X,d,2),feat:d.cats.map(c=>FEAT_NAME[c])};})};}))`));
      for (const t of tasks) {
        const items = t.items.map(it => R11.parseItem(it.desc));
        for (const p of t.perms) {
          // своими признаками: пункт буквы i против пункта, чей график выбран
          const want = new Set();
          let right = 0;
          p.a.forEach((g, i) => {
            if (g === t.key[i]) { right++; return; }
            const j = t.order[g - 1], fi = R11.features(type, items[i]), fj = R11.features(type, items[j]);
            if (type === 't44') want.add(fi.q !== fj.q ? 'hypq' : 'hypm');
            else if (type === 't45') want.add('family');
            else Object.keys(fi).forEach(k => { if (fi[k] !== fj[k]) want.add(CAT[type][k]); });
          });
          const err = (m) => { bad++; ex = ex || type + ' ' + p.a.join('') + ': ' + m; };
          if (right !== p.right) err('верных ' + p.right + ', у гейта ' + right);
          if (right === 3) continue;
          if (right === 2) err('«верно 2 из 3» при взаимно однозначном ответе');
          if ([...want].sort().join() !== [...p.cats].sort().join()) err('признаки ' + p.cats.join(',') + ', у гейта ' + [...want].join(','));
          const m1 = p.m1.replace(/<[^>]*>/g, '');
          if (/(^|[^А-Яа-яЁё])[АБВ](\)|\s*→|,|$|\s)/.test(m1)) err('первое сообщение называет букву');
          if (p.feat.some(f => p.m1.includes(f))) err('первое сообщение называет признак пары');
          if (!p.feat.every(f => p.m2.includes(f))) err('второе сообщение без признака пары');
        }
      }
    }
    ok(!bad, 'B5', `11: нарушений ${bad} ${ex}`);
  }
  { // 12: ловушки не ответ и не совпадают между собой (тип 5 и 10 — приёмка), не называют ответ
    const T = loadTrainer(byN(12).file, { seed: SEED });
    let bad = 0, ex = '', leak = 0, lex = '';
    const all = GJ(T, `GENS.flatMap((g,gi)=>Array.from({length:${N}},()=>{const t=g.make();return {gi,t:t.t,answer:t.answer,story:t.story,hints:t.hints,tr:t.distract.map(d=>({v:d.v,m:d.msg}))};}))`);
    for (const t of all) {
      const a = R12.fromJs(t.answer), vs = t.tr.map(x => R12.fromJs(x.v));
      vs.forEach((v, i) => {
        if (!v) { bad++; ex = ex || 'тип ' + t.t + ': ловушка не число'; return; }
        if (eq(v, a)) { bad++; ex = ex || 'тип ' + t.t + ' (' + t.gi + '): ловушка = ответу ' + str(v); }
        vs.forEach((w, j) => { if (j > i && w && eq(v, w) && t.tr[i].m !== t.tr[j].m) { bad++; ex = ex || 'тип ' + t.t + ' (' + t.gi + '): две ловушки на ' + str(v); } });
      });
      if (!hasNumB(t.story, a)) t.hints.concat(t.tr.map(x => x.m)).forEach(h => { if (hasNumB(h, a)) { leak++; lex = lex || 'тип ' + t.t + ': «' + h.slice(0, 50) + '»'; } });
    }
    ok(!bad, 'B5', `12: ${all.length} задач, нарушений ${bad} ${ex}`);
    ok(!leak, 'B5', `12: подсказка или ловушка называет ответ: ${leak} ${lex}`);
  }
  { // 14: после перевыбора ловушки не сняты; GP-COMPL — «найди свою»; TAXI без мёртвой ловушки; сообщения без ответа
    const T = loadTrainer(byN(14).file, { seed: SEED });
    let bad = 0, ex = '', leak = 0, lex = '';
    const share = {};
    for (const code of GJ(T, 'TYPE_IDS')) {
      const tasks = GJ(T, `Array.from({length:${N}},(_,i)=>{const t=T14.makeTask(${JSON.stringify(code)},i*104729+11);return {code:t.code,text:t.text,ans:t.ans,hint1:t.hint1,lost:t.distract.lost,tr:t.distract.map(d=>({v:d.v,m:d.hint}))};})`);
      let full = 0;
      for (const t of tasks) {
        if (!t.lost) full++;
        t.tr.forEach((x, i) => {
          if (eq(Fq(x.v), Fq(t.ans))) { bad++; ex = ex || code + ': ловушка = ответу'; }
          t.tr.forEach((y, j) => { if (j > i && eq(Fq(x.v), Fq(y.v)) && x.m !== y.m) { bad++; ex = ex || code + ': две ловушки на одном числе'; } });
        });
        if (code === 'GP-COMPL' && !t.tr.some(x => /двумя разными ошибками — найди свою/.test(x.m))) { bad++; ex = ex || 'GP-COMPL без сообщения «найди свою»'; }
        if (code === 'TAXI' && t.tr.some(x => /Верная идея/.test(x.m))) { bad++; ex = ex || 'TAXI: мёртвая ловушка осталась'; }
        if (!hasNumB(t.text, Fq(t.ans))) [t.hint1].concat(t.tr.map(x => x.m)).forEach(h => { if (hasNumB(h, Fq(t.ans))) { leak++; lex = lex || code + ': «' + h.replace(/<[^>]*>/g, '').slice(0, 60) + '»'; } });
      }
      share[code] = Math.round(1000 * full / N) / 10;
      ok(share[code] >= 95, 'B5', `14 ${code}: задач с полным набором ловушек ${share[code]} % < 95 %`);
    }
    ok(!bad, 'B5', `14: нарушений ${bad} ${ex}`);
    ok(!leak, 'B5', `14: ориентир или ловушка называет ответ: ${leak} ${lex}`);
    console.log('      14: задач с полным набором ловушек, % — ' + Object.entries(share).map(([k, v]) => k + ' ' + v).join(', '));
  }
});

section('B6. миграция старых ключей и сброс своей ветки (§6 контракта, D16, D18)', () => {
  const CASES = [
    { n: 10, old: 'oge10_progress_v1', val: { done: 5, correct: 5, shown: 2, streak: 1, best: 4, byType: { '10.1': { correct: 3, shown: 1 }, '10.5': { correct: 2 }, '10.9': { correct: 7 }, '10.2': { correct: 'x' } } },
      want: (r) => r.solvedByType['10_1'] === 3 && r.solvedByType['10_5'] === 2 && Object.keys(r.solvedByType).length === 2 && !r.best && !r.passed && r.ext.bestStreak === 4 },
    { n: 11, old: 'mathexam_oge11_stats_v1', val: { skills: { oge: { total: 5, first: 3, hinted: 1 }, lin_k: { total: 'x' } }, errors: { a: 2, '<img>': 3 } },
      want: (r) => !Object.keys(r.solvedByType).length && r.ext.skills.oge.total === 5 && r.ext.skills.oge.first === 3 && !r.ext.skills.lin_k && JSON.stringify(r.ext.errors) === '{"a":2}' },
    { n: 12, old: 'mx-oge12-v1', val: { solved: 9, correct: 5, byType: { 1: { a: 4, c: 3 }, 5: { a: 2, c: 2 }, 99: { a: 1, c: 1 }, 3: { a: 'x', c: 7 } }, bestDiag: 8, lastDate: '2026-09-01' },
      want: (r) => r.solvedByType['1'] === 3 && r.solvedByType['5'] === 2 && Object.keys(r.solvedByType).length === 2 && r.best === 8 && r.total === 10 && r.passed === true && r.runs === 1 && r.ext.lastDate === '2026-09-01' },
    { n: 14, old: 'oge14_progress_v1', val: { totalOk: 7, okByCode: { 'AP-VAL': 4, TAXI: 3, XYZ: 5 }, byDay: { '2026-09-21': 4, junk: 9 } },
      want: (r) => r.solvedByType['AP-VAL'] === 4 && r.solvedByType.TAXI === 3 && Object.keys(r.solvedByType).length === 2 && r.ext.byDay['2026-09-21'] === 4 && !r.ext.byDay.junk },
  ];
  for (const c of CASES) {
    const t = byN(c.n), S = makeStorage();
    S.map.set(c.old, JSON.stringify(c.val));
    S.map.set(KEY, '{"other-tid":{"v":1,"solvedByType":{"x":1}},"mistakes":{"other-tid|x":{"w":1,"r":0}}}');
    const T = loadTrainer(t.file, { storage: S });
    if (c.n === 10) T.run('migrate10()');   // 10 запускается по DOMContentLoaded
    let r = readKey(S)[t.tid];
    ok(r && r.migratedFrom === c.old && c.want(r), 'B6', c.n + ': перенос ' + JSON.stringify(r).slice(0, 160));
    ok(S.map.get(c.old) === JSON.stringify(c.val), 'B6', c.n + ': старый ключ не тронут');
    const T2 = loadTrainer(t.file, { storage: S }); if (c.n === 10) T2.run('migrate10()');
    ok(JSON.stringify(readKey(S)[t.tid].solvedByType) === JSON.stringify(r.solvedByType), 'B6', c.n + ': повторного переноса нет');
    T2.run('CP.mlog(TYPE_IDS[0],false);CP.solvedOne(TYPE_IDS[1]);CP.finishQuiz(9,10);CP.resetOwn()');
    const all = readKey(S);
    r = all[t.tid];
    ok(r.migratedFrom === c.old && !Object.keys(r.solvedByType).length && !r.runs && !r.best && !r.ext, 'B6', c.n + ': сброс оставил только отметку миграции ' + JSON.stringify(r));
    ok(!Object.keys(all.mistakes || {}).some(k => k.startsWith(t.tid + '|')) && all.mistakes['other-tid|x'] && all['other-tid'].solvedByType.x === 1, 'B6', c.n + ': сброс не тронул чужое');
    const T3 = loadTrainer(t.file, { storage: S }); if (c.n === 10) T3.run('migrate10()');
    ok(!Object.keys(readKey(S)[t.tid].solvedByType).length, 'B6', c.n + ': после сброса старый ключ не переносится снова');
    // нет старого ключа — ветка не заводится
    const S0 = makeStorage(); const T0 = loadTrainer(t.file, { storage: S0 }); if (c.n === 10) T0.run('migrate10()');
    ok(!(readKey(S0) || {})[t.tid], 'B6', c.n + ': без старого ключа ветка не создаётся');
    // мусор в старом ключе — «нет данных», отметка ставится
    for (const junk of ['{', 'null', '[1,2]', '"x"', '{"byType":"x","skills":7,"okByCode":null}']) {
      const Sj = makeStorage(); Sj.map.set(c.old, junk);
      let err = ''; try { const Tj = loadTrainer(t.file, { storage: Sj }); if (c.n === 10) Tj.run('migrate10()'); } catch (e) { err = String(e).slice(0, 100); }
      const rj = (readKey(Sj) || {})[t.tid];
      ok(!err && rj && rj.migratedFrom === c.old && !Object.keys(rj.solvedByType).length, 'B6', c.n + ': мусор в старом ключе ' + junk + ' ' + err);
    }
  }
});

console.log('\nпроверок: ' + checks + ', провалов: ' + fails);
if (fails) { failed.slice(0, 60).forEach(f => console.log('  ' + f)); process.exitCode = 1; }
else console.log('OGE_ALGEBRA_GATE_OK');

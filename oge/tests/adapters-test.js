/* Адаптеры прогресса курса ОГЭ (jsdom): line — «не начат / в работе /
   зачёт сдан», охват типов с потолком PER_TYPE, только passed === true даёт
   полную полосу; plots, diagnostic, exam, analogue, review; маршрут «с чего
   начать». Маркер: OGE_ADAPTERS_OK. */
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.resolve(__dirname, '..');
const RV = require(path.join(ROOT, 'registry.js'));
const KEY = 'mathExamCourseProgress.v1';

let fails = 0, checks = 0;
function ok(cond, msg){ checks++; if (!cond){ fails++; console.log('FAIL:', msg); } }

/* окно с реестром и адаптерами; localStorage — настоящий jsdom */
function win(seed){
  const dom = new JSDOM('<!doctype html><body></body>', { url: 'http://localhost/oge/', runScripts: 'outside-only' });
  const w = dom.window;
  w.RV = RV;
  if (seed) w.localStorage.setItem(KEY, typeof seed === 'string' ? seed : JSON.stringify(seed));
  // подключаем адаптеры в контексте окна
  const src = require('fs').readFileSync(path.join(ROOT, 'progress-adapters.js'), 'utf8');
  w.eval(src.replace('if (typeof module !== "undefined") module.exports = PROGRESS;', ''));
  return w;
}
function host(w, adapter, tid){
  const el = w.document.createElement('span');
  el.setAttribute('data-progress', adapter);
  if (tid) el.setAttribute('data-tid', tid);
  w.document.body.appendChild(el);
  return el;
}
function render(w, adapter, tid){
  const el = host(w, adapter, tid);
  w.PROGRESS.apply(w.document, w.PROGRESS.liveStore());
  const txt = el.querySelector('.txt');
  return { el, text: txt ? txt.textContent : null, filled: el.querySelectorAll('.cellsbar .filled').length,
           bar: !!el.querySelector('.cellsbar'), done: !!(txt && txt.classList.contains('done')), removed: !el.isConnected };
}

const TID = 'oge-task16-circle';
const N = RV.TYPES[TID].length;      // 33
const P = 3;                          // PER_TYPE

/* 1. line: нет записи → «не начат», без полосы */
{ const r = render(win(null), 'line', TID); ok(r.text === 'не начат' && !r.bar, 'line: не начат'); }

/* 2. line: запись без решений → «в работе» */
{ const r = render(win({ [TID]: { v: 1, runs: 0 } }), 'line', TID); ok(r.text === 'в работе' && !r.bar, 'line: в работе, text=' + r.text); }

/* 3. line: охват типов — 24 решения одного типа дают 3 из 3·N */
{
  const r = render(win({ [TID]: { v: 1, solvedByType: { insCen: 24 } } }), 'line', TID);
  ok(r.text === 'решено задач: 24', 'line: подпись «решено задач: 24», text=' + r.text);
  ok(r.filled === 1, 'line: 24 решения одного типа — одна клетка (потолок 3 из ' + (P * N) + '), filled=' + r.filled);
}
/* 4. line: по 3 у всех типов — 9 клеток, не 10 (нет passed) */
{
  const sbt = {}; RV.TYPES[TID].forEach(t => { sbt[t] = 3; });
  const r = render(win({ [TID]: { v: 1, solvedByType: sbt } }), 'line', TID);
  ok(r.filled === 9 && !r.done, 'line: полный охват без зачёта — 9 клеток, filled=' + r.filled);
}
/* 5. line: passed:true — полная полоса и «зачёт сдан» */
{
  const r = render(win({ [TID]: { v: 1, passed: true, best: 9, total: 10 } }), 'line', TID);
  ok(r.filled === 10 && r.done && /зачёт сдан ✓ · 9 из 10/.test(r.text), 'line: зачёт сдан, text=' + r.text);
}
/* 6. line: passed — только строго true */
{
  const r = render(win({ [TID]: { v: 1, passed: 'true', best: 10, total: 10, solvedByType: { insCen: 1 } } }), 'line', TID);
  ok(r.filled < 10 && !r.done && /зачёт: 10 из 10/.test(r.text), 'line: passed:"true" не считается, text=' + r.text);
}
/* 7. line: мусор в записи → «нет данных»-поведение без NaN */
for (const junk of [{ solvedByType: 'x', best: 'y', total: [], passed: 1 }, { solvedByType: { insCen: 'много', tanExt: -3, twoDiam: NaN } }, { solvedByType: null }]) {
  const r = render(win({ [TID]: junk }), 'line', TID);
  ok(!/NaN|undefined|null|\[object/.test(r.text || ''), 'line: мусор → без NaN, text=' + r.text);
}
/* 8. line: мусор в самом ключе — 8 видов */
for (const junk of ['{', 'null', '"строка"', '[1,2]', '42', 'true', '{"' + TID + '":"строка"}', '{"' + TID + '":[1]}']) {
  const r = render(win(junk), 'line', TID);
  ok(r.text === 'не начат' && !r.removed, 'line: мусор в ключе → «не начат», junk=' + junk + ' text=' + r.text);
}
/* 9. line: неизвестный TID — без исключения (узел остаётся с подписью) */
{ const r = render(win({}), 'line', 'nope'); ok(r.text === 'не начат' || r.removed, 'line: неизвестный TID не роняет'); }

/* 10. plots: 3 сюжета освоены (mastered или solved>=total) из 8 */
{
  const r = render(win({ practiceTiresTrainer: { mastered: true }, practiceStovesTrainer: { solved: 14, total: 14 },
                         practiceTariffsTrainer: { solved: 5, total: 5 }, practiceLandPlotsTrainer: { solved: 1, total: 5 } }), 'plots');
  ok(/освоено сюжетов: 3 из 8/.test(r.text) && r.filled === 4, 'plots: 3 из 8, filled=' + r.filled + ' text=' + r.text);
}
/* 11. diagnostic */
{
  const r = render(win({ practiceEntryDiagnostic2026: { completed: true, best: 7 } }), 'diagnostic');
  ok(/лучший результат: 7 из 10/.test(r.text) && r.filled === 7, 'diagnostic: 7 из 10');
}
/* 12. exam: попытки только с числовым primary; лучший и последний */
{
  const r = render(win({ 'oge-full-exam': { attempts: [{ primary: 12, mark: 3 }, 'x', { primary: 'y' }, { primary: 20, mark: 4 }, { primary: 15, mark: 4, geometry: 3 }] } }), 'exam');
  ok(/последний: 15 из 31 · отметка 4 · лучший: 20/.test(r.text), 'exam: text=' + r.text);
}
/* 13. analogue: побочный ключ только в живом браузере */
{
  const w = win({});
  w.localStorage.setItem('mathExamOge2027Analogue1.v2', JSON.stringify({ version: 2, entries: Array.from({ length: 25 }, (_, i) => i < 19
    ? { checked: true, correct: i < 5, credit: i < 3 ? 'independent' : (i < 5 ? 'revealed' : null) }
    : { input: 'x', manual: i === 19 ? 2 : (i === 20 ? 7 : undefined) }) }));
  const r = render(w, 'analogue');
  ok(/часть 1: 3 из 19 · часть 2: 4 из 12/.test(r.text), 'analogue: revealed не в счёт, manual ≤ 2, text=' + r.text);
  const el = host(w, 'analogue');
  w.PROGRESS.apply(w.document, w.PROGRESS.snapshotStore({}));
  ok(el.querySelector('.txt').textContent === 'не начат', 'analogue: в снимке — не начат');
}
/* 14. review: то же правило, что RV.open/closed */
{
  const mk = { 'oge-task16-circle|tanTrap': { w: 2, r: 1 }, 'oge18-kletki|dist': { w: 1, r: 3 }, 'x': { w: 1 }, 'oge18-kletki|tanA': 'мусор', 'oge18-kletki|leg': { w: -1 } };
  const r = render(win({ mistakes: mk }), 'review');
  ok(/к повтору: 1 · закрыто: 1/.test(r.text), 'review: text=' + r.text);
  ok(RV.open(mk).length === 1 && RV.closed(mk).length === 1, 'review = RV.open/closed на тех же записях');
}
/* 15. маршрут */
{
  const A = w => { let v = w.localStorage.getItem(KEY); try { v = JSON.parse(v); } catch (e) { /* мусор как есть */ } return w.PROGRESS.routeStep(v); };
  ok(A(win({})) === 1, 'route: пусто → 1');
  ok(A(win({ practiceEntryDiagnostic2026: { completed: true, weakTopics: ['tires'] } })) === 2, 'route: слабые сюжеты → 2');
  ok(A(win({ practiceEntryDiagnostic2026: { completed: true, weakTopics: [] } })) === 3, 'route: без слабых → 3');
  const passed = {}; ['oge-t6-vychisleniya', 'oge-t7-pryamaya', 'oge-t8-stepeni', 'oge-t9-uravneniya', 'oge-t10-veroyatnost', 'oge-t11-grafiki', 'oge-t12-formuly', 'oge-t14-progressii'].forEach(t => { passed[t] = { passed: true }; });
  ok(A(win(Object.assign({ practiceEntryDiagnostic2026: { completed: true, weakTopics: [] } }, passed))) === 3, 'route: 8 зачётов без геометрии → 3');
  passed['oge-task16-circle'] = { passed: true }; passed['oge18-kletki'] = { passed: true };
  ok(A(win(Object.assign({ practiceEntryDiagnostic2026: { completed: true, weakTopics: [] } }, passed))) === 4, 'route: 8 + 2 по геометрии → 4');
  ok(A(win('{')) === 1 && A(win('[1]')) === 1, 'route: мусор → 1');
  const w = win({ practiceEntryDiagnostic2026: { completed: true, weakTopics: ['x'] } });
  w.document.body.innerHTML = '<ol id="routeSteps"><li data-step="1"></li><li data-step="2"></li></ol><p id="routeNow"></p>';
  w.PROGRESS.mount(w.document, w.PROGRESS.liveStore());
  ok(w.document.querySelector('li[data-step="2"]').classList.contains('now') && /шаге 2/.test(w.document.getElementById('routeNow').textContent), 'route: подсветка шага 2');
}
/* 16. bar(): правило клеток */
{
  const w = win(null);
  const el = w.document.createElement('span'); w.document.body.appendChild(el);
  const cases = [[0.01, 1], [0.05, 1], [0.94, 9], [0.99, 9], [1, 10], [0, 0]];
  for (const [ratio, want] of cases){ w.PROGRESS.bar(el, ratio, 'x', ratio >= 1); ok(el.querySelectorAll('.filled').length === want, `bar(${ratio}) → ${want}`); }
}

console.log(`адаптеры: проверок ${checks}, ошибок ${fails}`);
if (fails){ console.log('OGE_ADAPTERS_FAIL'); process.exit(1); }
console.log('OGE_ADAPTERS_OK');

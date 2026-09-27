/* Мусор в хранилище и помощник записи из контракта (jsdom).
   1) Каждый адаптер на каждом из 8 видов мусора в ключе и в своей ветке
      не падает и не пишет NaN/undefined/чужую строку.
   2) Фрагмент-помощник из docs/OGE_PROGRESS_CONTRACT.md (тот самый, который
      вставляется в тренажёры) проверяется как есть: читается из документа,
      выполняется в окне jsdom. Пишет только свою ветку, перечитывает ключ
      перед записью, журнал и режим повтора — по правилам.
   Маркер: OGE_JUNK_OK. */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.resolve(__dirname, '..');
const RV = require(path.join(ROOT, 'registry.js'));
const KEY = 'mathExamCourseProgress.v1';
const ADAPTERS_SRC = fs.readFileSync(path.join(ROOT, 'progress-adapters.js'), 'utf8')
  .replace('if (typeof module !== "undefined") module.exports = PROGRESS;', '');

let fails = 0, checks = 0;
function ok(cond, msg){ checks++; if (!cond){ fails++; console.log('FAIL:', msg); } }

function win(raw){
  const dom = new JSDOM('<!doctype html><body></body>', { url: 'http://localhost/oge/', runScripts: 'outside-only' });
  const w = dom.window;
  w.RV = RV;
  if (raw !== undefined) w.localStorage.setItem(KEY, raw);
  w.eval(ADAPTERS_SRC);
  return w;
}
const JUNK_KEY = ['{', 'null', '"строка"', '[1,2,3]', '42', 'true', '{"mistakes":"x"}', '{"a":'];
const JUNK_REC = ['"строка"', '[1]', 'null', '7', 'true', '{"solvedByType":"x","best":"9","total":"10","passed":"true","runs":[]}',
                  '{"solvedByType":{"insCen":"5","tanExt":-1,"twoDiam":1e400}}', '{"attempts":"x","entries":5,"mastered":"yes","completed":1}'];
const BAD = /NaN|undefined|\[object|null|строка/;

/* 1. адаптеры на мусоре */
const rows = RV.CABINET.map(r => [r.adapter, r.tid]).concat([['review', null], ['diagnostic', null]]);
for (const raw of JUNK_KEY){
  const w = win(raw);
  for (const [adapter, tid] of rows){
    const el = w.document.createElement('span');
    el.setAttribute('data-progress', adapter); if (tid) el.setAttribute('data-tid', tid);
    w.document.body.appendChild(el);
  }
  let threw = false;
  try { w.PROGRESS.mount(w.document, w.PROGRESS.liveStore()); } catch (e) { threw = true; }
  ok(!threw, 'мусор в ключе не роняет apply: ' + raw);
  for (const el of w.document.querySelectorAll('[data-progress]')){
    const t = el.querySelector('.txt');
    ok(t && !BAD.test(t.textContent), `мусор в ключе ${raw}: ${el.dataset.progress} → «${t && t.textContent}»`);
  }
}
for (const raw of JUNK_REC){
  for (const [adapter, tid] of rows){
    const branch = tid || (adapter === 'diagnostic' ? 'practiceEntryDiagnostic2026' : 'practiceTiresTrainer');
    const w = win('{"' + branch + '":' + raw + ',"mistakes":' + raw + '}');
    const el = w.document.createElement('span');
    el.setAttribute('data-progress', adapter); if (tid) el.setAttribute('data-tid', tid);
    w.document.body.appendChild(el);
    let threw = false;
    try { w.PROGRESS.apply(w.document, w.PROGRESS.liveStore()); } catch (e) { threw = true; }
    const t = el.querySelector('.txt');
    ok(!threw && t && !BAD.test(t.textContent), `мусор в ветке ${adapter}/${branch} ${raw.slice(0, 30)} → «${t && t.textContent}»`);
  }
}
/* снимок с мусором вместо объекта */
for (const snap of [null, 'x', [1], 5]){
  const w = win();
  const el = w.document.createElement('span'); el.setAttribute('data-progress', 'line'); el.setAttribute('data-tid', 'oge18-kletki');
  w.document.body.appendChild(el);
  let threw = false; try { w.PROGRESS.apply(w.document, w.PROGRESS.snapshotStore(snap)); } catch (e) { threw = true; }
  ok(!threw && el.querySelector('.txt').textContent === 'не начат', 'снимок-мусор → не начат');
}
/* cleanJournal на мусоре */
for (const bad of [{ mistakes: 'x' }, { mistakes: [1] }, { mistakes: { 'a|b': null, 'c|d': { w: 'x' }, 'e|f': { w: 1, r: -1 }, 'g|h': { w: 1, last: 1e20 } } }]){
  const r = RV.cleanJournal(bad);
  ok(r.obj.mistakes === undefined || Object.keys(r.obj.mistakes).length === 0, 'cleanJournal выбрасывает мусор целиком');
}

/* 2. помощник записи из контракта */
const doc = fs.readFileSync(path.join(ROOT, '..', 'docs', 'OGE_PROGRESS_CONTRACT.md'), 'utf8');
const m = doc.match(/Помощник записи[\s\S]*?```js\n([\s\S]*?)```/);
ok(!!m, 'в контракте есть фрагмент-помощник');
const helper = m ? m[1].replace('var TID = "oge-t16-…";', 'var TID = "oge-task16-circle";')
  .replace(/var TYPE_IDS = \[[^\]]*\];/, 'var TYPE_IDS = ["insCen", "twoDiam", "tanExt"];') : '';
function hwin(raw){
  const w = win(raw);
  w.eval(helper + '\nwindow.H = { readAll, saveRec, solvedOne, finishQuiz, mlog, openTypes };');
  return w;
}
const get = w => JSON.parse(w.localStorage.getItem(KEY));

{ // мусор в ключе → readAll = {}
  for (const raw of JUNK_KEY) ok(JSON.stringify(hwin(raw).H.readAll()) === '{}' || raw === '{"mistakes":"x"}', 'helper.readAll на мусоре: ' + raw);
}
{ // solvedOne и ядро
  const w = hwin('{"derivative-t8":{"runs":1},"oge-task16-circle":"мусор"}');
  w.H.solvedOne('insCen'); w.H.solvedOne('insCen'); w.H.solvedOne('tanExt');
  const a = get(w);
  ok(a['derivative-t8'].runs === 1, 'helper: чужая ветка цела');
  ok(a['oge-task16-circle'].v === 1 && a['oge-task16-circle'].solvedByType.insCen === 2 && a['oge-task16-circle'].solvedByType.tanExt === 1, 'helper: solvedByType');
  ok(typeof a['oge-task16-circle'].updatedAt === 'number', 'helper: updatedAt');
  // «вторая вкладка» пишет между чтением и записью: помощник перечитывает ключ
  w.localStorage.setItem(KEY, JSON.stringify(Object.assign(get(w), { 'oge18-kletki': { best: 7 } })));
  w.H.finishQuiz(9, 10);
  const b = get(w);
  ok(b['oge18-kletki'].best === 7, 'helper: запись другой вкладки не затёрта');
  ok(b['oge-task16-circle'].runs === 1 && b['oge-task16-circle'].best === 9 && b['oge-task16-circle'].total === 10 && b['oge-task16-circle'].passed === true, 'helper: finishQuiz 9/10 → passed');
  w.H.finishQuiz(3, 10);
  const c = get(w);
  ok(c['oge-task16-circle'].runs === 2 && c['oge-task16-circle'].best === 9 && c['oge-task16-circle'].passed === true, 'helper: неудачная попытка не снимает passed и best');
  ok(c['oge-task16-circle'].solvedByType.insCen === 2, 'helper: finishQuiz не трогает solvedByType');
}
{ // журнал
  const w = hwin('{"mistakes":"мусор"}');
  w.H.mlog('insCen', true);
  ok(get(w).mistakes === 'мусор' || !get(w).mistakes, 'helper: верный ответ без промахов записи не заводит');
  w.H.mlog('insCen', false);
  let e = get(w).mistakes['oge-task16-circle|insCen'];
  ok(e && e.w === 1 && e.r === 0 && e.lastWrong > 0, 'helper: промах открывает тип');
  w.H.mlog('insCen', true); w.H.mlog('insCen', true);
  ok(JSON.stringify(w.H.openTypes()) === '["insCen"]', 'helper: два верных — тип ещё открыт');
  w.H.mlog('insCen', true);
  e = get(w).mistakes['oge-task16-circle|insCen'];
  ok(e.r === 3 && w.H.openTypes().length === 0, 'helper: три верных подряд закрывают тип');
  w.H.mlog('insCen', false);
  ok(get(w).mistakes['oge-task16-circle|insCen'].r === 0 && w.H.openTypes()[0] === 'insCen', 'helper: новый промах снова открывает');
  w.H.mlog('unknownType', false);
  ok(!w.H.openTypes().includes('unknownType'), 'helper: тип вне TYPE_IDS не попадает в режим повтора');
  ok(RV.open(get(w).mistakes).some(x => x.type === 'insCen'), 'helper: запись читается RV.open()');
}

console.log(`мусор и помощник: проверок ${checks}, ошибок ${fails}`);
if (fails){ console.log('OGE_JUNK_FAIL'); process.exit(1); }
console.log('OGE_JUNK_OK');

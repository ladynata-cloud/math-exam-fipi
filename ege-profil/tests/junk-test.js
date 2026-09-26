/* Гейт «мусор в хранилище» (jsdom).

   Канон CLAUDE.md: восстановление из localStorage проверяет схему и молча
   отбрасывает мусор, а не падает. Для каждой страницы курса из архива,
   которая пишет mathExamCourseProgress.v1 или profile-ege-course-v1, и для
   каждого вида мусора — битый JSON, "null", строка, массив, число, мусор
   вместо своей записи и в её полях — проверяется:
   1) страница загружается без исключений;
   2) действие ученика после мусора записывает корректную запись
      (там, где это делается без долгой UI-автоматизации — одним-двумя кликами);
   3) чужие ветки ключа при записи остаются как лежали.
   Отдельно: exam/variant.html пишет дельту (вторая вкладка не затирается,
   простой показ задачи ничего не пишет), exam/full-exam.html обновляет
   свою попытку, а не последнюю, и экранирует ответ ученика. */
const { makeBoot } = require('./boot.js');

let fails = 0, checks = 0;
function ok(cond, msg){ checks++; if (!cond){ fails++; console.log('FAIL:', msg); } }

const errors = [];
const boot = makeBoot(errors);
const KEY = 'mathExamCourseProgress.v1';
const VK = 'profile-ege-course-v1';
const BASE = 'https://mathexam.space/ege-profil/';

/* мусор вместо всего ключа */
const TOP = { 'битый JSON': '{"a":', 'null': 'null', 'строка': '"junk"', 'массив': '[1,2]', 'число': '42' };
/* мусор вместо своей записи */
const REC = { 'строка': 'junk', 'массив': [1, 2], 'null': null, 'число': 7, 'массив объектов': [{}] };

const isObj = v => !!v && typeof v === 'object' && !Array.isArray(v);
const isCount = v => typeof v === 'number' && isFinite(v) && v >= 0;
const isBool = v => typeof v === 'boolean';

/* Открыть страницу с заданным хранилищем. errs() — ошибки только этой загрузки
   и действий на ней. scrollTo/scrollIntoView в jsdom не реализованы — заглушки,
   чтобы «Not implemented» не смешивалось с настоящими ошибками. */
function open(file, store, query){
  const before = errors.length;
  let w = null;
  try {
    w = boot(file, win => {
      win.scrollTo = () => {};
      win.Element.prototype.scrollIntoView = function(){};
      win.confirm = () => true;
      for (const k in (store || {})) win.localStorage.setItem(k, store[k]);
    }, BASE + file + (query || ''));
  } catch (e) { errors.push('boot ' + file + ': ' + e.message); }
  return { w, d: w && w.document, errs: () => errors.slice(before) };
}
function readKey(w, k){ try { return JSON.parse(w.localStorage.getItem(k)); } catch (e) { return undefined; } }
function act(page, fn, what){
  try { fn(page.d, page.w); }
  catch (e) { errors.push(what + ': ' + e.message); }
}
function btnByText(root, sel, text){
  return Array.prototype.find.call(root.querySelectorAll(sel), b => b.textContent.trim() === text);
}

/* ================= тренажёры с записью по TID ================= */

const TRAINERS = [
  { file: 'trainers/applied-t910.html', tid: 'applied-t910',
    fields: { solved9: 'x', solved10: null, runs: [], best: {}, passed: 'yes', table: 'no' },
    act(d){
      ['x', '240/x', 'x + 20', '240/(x + 20)'].forEach(v => { const b = btnByText(d, '#pool button', v); if (b) b.click(); });
      d.getElementById('zStart').click();
    },
    good: r => r.table === true && r.runs === 1 && isCount(r.solved9) && isCount(r.solved10) && isCount(r.best) && isBool(r.passed) },
  { file: 'trainers/functions-t1112.html', tid: 'functions-t1112',
    fields: { solved11: 'x', solved12: [], runs: '5', best: null, passed: 1 },
    act(d){ d.getElementById('zStart').click(); },
    good: r => r.runs === 1 && isCount(r.solved11) && isCount(r.solved12) && isCount(r.best) && r.passed === false },
  { file: 'trainers/stereo-t14.html', tid: 'stereo-t14',
    fields: { tasks: { t1: 'junk', t2: { proof: 'x', b: [], self: '<img src=x id=xss>' }, t3: null }, runs: 'x', drillBest: [], passed: 'no' },
    act(d){
      d.querySelector('#taskList button').click();
      btnByText(d, '#tSelf button', '2').click();
      d.getElementById('backToList').click();
      d.getElementById('zStart').click();
    },
    good: r => isObj(r.tasks) && r.tasks.t1 && r.tasks.t1.self === 2 && r.runs === 1 && isCount(r.drillBest) && isBool(r.passed)
      && Object.keys(r.tasks).every(k => isObj(r.tasks[k]) && (r.tasks[k].self === undefined || Number.isInteger(r.tasks[k].self))),
    dom: d => !d.querySelector('#taskList img') && !/undefined|NaN/.test(d.getElementById('taskList').textContent) },
  { file: 'trainers/parameters-18/graphic.html', tid: 'parameters-t18',
    fields: { keys: 'x', self: { z1: '<img src=x id=xss>', z2: 9 }, runs: {}, drillBest: 'x', passed: [] },
    act(d){
      d.querySelector('#taskList button').click();
      btnByText(d, '#tSelf button', '3').click();
      d.getElementById('backToList').click();
      d.getElementById('zStart').click();
    },
    good: r => isObj(r.keys) && isObj(r.self) && r.self.z1 === 3 && r.self.z2 === undefined && r.runs === 1 && isCount(r.drillBest) && isBool(r.passed),
    dom: d => !d.querySelector('#taskList img') && !/undefined|NaN/.test(d.getElementById('taskList').textContent) }
];
['intro', 'linear', 'quadratic', 'fractional', 'irrational'].forEach(ch => TRAINERS.push({
  file: 'trainers/parameters-18/' + ch + '.html', tid: 'param18-' + ch,
  fields: { keys: [1, 2], drillBest: 'x', passed: 'yes' },
  act(d){ d.querySelector('[data-h]').click(); },
  good: r => isObj(r.keys) && Object.keys(r.keys).some(k => /^hw/.test(k) && r.keys[k] === true) && isCount(r.drillBest) && isBool(r.passed)
}));

TRAINERS.forEach(T => {
  const cases = [['чистое хранилище', null]];
  for (const k in TOP) cases.push(['ключ: ' + k, { [KEY]: TOP[k] }]);
  for (const k in REC) cases.push(['запись: ' + k, { [KEY]: JSON.stringify({ foreign: { keep: 1 }, [T.tid]: REC[k] }) }]);
  cases.push(['поля записи', { [KEY]: JSON.stringify({ foreign: { keep: 1 }, [T.tid]: T.fields }) }]);
  cases.forEach(([name, store]) => {
    const p = open(T.file, store);
    const tag = T.file + ' [' + name + ']';
    if (!p.w){ ok(false, tag + ': страница не загрузилась'); return; }
    ok(!p.errs().length, tag + ': загрузка без ошибок: ' + p.errs().slice(0, 2).join(' | '));
    if (T.dom) ok(T.dom(p.d), tag + ': мусор из записи не попал в разметку');
    act(p, T.act, tag);
    ok(!p.errs().length, tag + ': действие ученика без ошибок: ' + p.errs().slice(0, 2).join(' | '));
    const all = readKey(p.w, KEY);
    ok(isObj(all), tag + ': ключ после записи — объект: ' + JSON.stringify(all));
    const r = isObj(all) ? all[T.tid] : undefined;
    ok(isObj(r) && T.good(r), tag + ': своя запись корректна: ' + JSON.stringify(r));
    if (store && /foreign/.test(store[KEY])) ok(isObj(all) && isObj(all.foreign) && all.foreign.keep === 1, tag + ': чужая ветка не тронута');
    p.w.close();
  });
});

/* graphic.html: журнал ошибок — общая ветка mistakes, меняется только своя запись */
{
  const cases = { 'mistakes — строка': 'x', 'mistakes — массив': [1], 'своя запись — строка': { 'parameters-t18|drill': 'x', 'other|t': { w: 2, r: 0 } },
                  'поля своей записи': { 'parameters-t18|drill': { w: 'x', r: null }, 'other|t': { w: 2, r: 0 } } };
  for (const name in cases){
    const p = open('trainers/parameters-18/graphic.html', { [KEY]: JSON.stringify({ mistakes: cases[name] }) });
    act(p, d => { d.getElementById('dAnswer').value = '999'; d.getElementById('dCheck').click(); }, 'graphic mlog');
    const mk = (readKey(p.w, KEY) || {}).mistakes;
    const e = isObj(mk) ? mk['parameters-t18|drill'] : null;
    ok(!p.errs().length && isObj(e) && e.w === 1 && e.r === 0, 'graphic [' + name + ']: неверный ответ записан в журнал: ' + JSON.stringify(mk));
    if (isObj(cases[name]) && cases[name]['other|t']) ok(mk['other|t'] && mk['other|t'].w === 2, 'graphic [' + name + ']: чужая запись журнала не тронута');
    p.w.close();
  }
}

/* ================= parameters-18/index.html: только чтение ================= */
{
  const cases = [['чистое хранилище', null]];
  for (const k in TOP) cases.push(['ключ: ' + k, { [KEY]: TOP[k] }]);
  for (const k in REC) cases.push(['записи: ' + k, { [KEY]: JSON.stringify({ 'param18-intro': REC[k], 'parameters-t18': REC[k] }) }]);
  cases.push(['поля записей', { [KEY]: JSON.stringify({
    'param18-intro': { keys: 'abc', drillBest: '<img src=x id=xss>', passed: 'yes' },
    'parameters-t18': { keys: [1, 2, 3], drillBest: '<b>9</b>', passed: 1 } }) }]);
  cases.forEach(([name, store]) => {
    const p = open('trainers/parameters-18/index.html', store);
    const tag = 'parameters-18/index [' + name + ']';
    ok(!!p.w && !p.errs().length, tag + ': загрузка без ошибок: ' + p.errs().slice(0, 2).join(' | '));
    if (!p.w) return;
    const txt = p.d.getElementById('gChapters').textContent + p.d.getElementById('gFinal').textContent;
    ok(p.d.querySelectorAll('#gChapters .tcard').length === 7, tag + ': все 7 карточек глав на месте');
    ok(!p.d.querySelector('img, #gFinal b b') && !/undefined|NaN|ключей: 3/.test(txt), tag + ': мусор не попал в подписи');
    p.w.close();
  });
}

/* ================= finance.html ================= */
{
  const FT = 'financeNonstandardTrainer';
  const cases = [['чистое хранилище', null]];
  for (const k in TOP) cases.push(['ключ: ' + k, { [KEY]: TOP[k] }]);
  for (const k in REC) cases.push(['запись: ' + k, { [KEY]: JSON.stringify({ foreign: { keep: 1 }, [FT]: REC[k] }) }]);
  cases.push(['stats — строка', { [KEY]: JSON.stringify({ foreign: { keep: 1 }, [FT]: { mode: 'learn', stats: 'x' } }) }]);
  cases.push(['поля stats', { [KEY]: JSON.stringify({ foreign: { keep: 1 }, [FT]: { mode: 5, lastTaskId: {}, stats: { solved: 'x', correct: null, attempts: [], hints: {}, doneTasks: [1, 2] } } }) }]);
  cases.forEach(([name, store]) => {
    const p = open('trainers/finance.html', store);
    const tag = 'finance [' + name + ']';
    ok(!!p.w && !p.errs().length, tag + ': загрузка без ошибок: ' + p.errs().slice(0, 2).join(' | '));
    if (!p.w) return;
    let id = null;
    act(p, (d, w) => {
      id = w.eval('STATE.currentTaskId');
      const inp = d.getElementById('finalAnswerInput');
      inp.value = String(w.eval('getTask(STATE.currentTaskId).finalAnswer.value'));
      inp.parentNode.querySelector('button').click();
    }, tag);
    ok(!p.errs().length, tag + ': верный ответ без ошибок: ' + p.errs().slice(0, 2).join(' | '));
    const all = readKey(p.w, KEY);
    const st = isObj(all) && isObj(all[FT]) ? all[FT].stats : null;
    ok(isObj(st) && isObj(st.doneTasks) && st.doneTasks[id] === true && st.solved >= 1 && isCount(st.attempts) && isCount(st.hints),
       tag + ': задача записана в doneTasks: ' + JSON.stringify(all && all[FT]));
    if (store && /foreign/.test(store[KEY])) ok(isObj(all) && isObj(all.foreign) && all.foreign.keep === 1, tag + ': чужая ветка не тронута');
    p.w.close();
  });
}

/* ================= exam/variant.html + bank.js ================= */
{
  const moduleText = d => d.getElementById('modules').textContent;
  const answerWrongTwice = d => {
    d.getElementById('short-answer').value = '123456789'; d.getElementById('check-short').click();
    d.getElementById('short-answer').value = '123456789'; d.getElementById('check-short').click();
  };
  const cases = [['чистое хранилище', null]];
  for (const k in TOP) cases.push(['ключ: ' + k, { [VK]: TOP[k] }]);
  for (const k in REC) cases.push(['progress: ' + k, { [VK]: JSON.stringify({ progress: REC[k], extra: { keep: 1 } }) }]);
  cases.push(['progress[1]: строка', { [VK]: JSON.stringify({ progress: { 1: 'junk', 7: { attempts: 4, correct: 3, points: 3 } }, extra: { keep: 1 } }) }]);
  cases.push(['поля progress[1]', { [VK]: JSON.stringify({ progress: { 1: { attempts: 'x', correct: null, points: [] }, 7: { attempts: 4, correct: 3, points: 3 } }, extra: { keep: 1 } }) }]);
  ['"junk"', '99', '-1', '2.5', 'null', '[3]'].forEach(v => cases.push(['currentId = ' + v, { [VK]: '{"currentId":' + v + '}' }]));
  cases.forEach(([name, store]) => {
    [null, '?m=1'].forEach(q => {
      const p = open('exam/variant.html', store, q);
      const tag = 'variant' + (q || '') + ' [' + name + ']';
      ok(!!p.w && !p.errs().length, tag + ': загрузка без ошибок: ' + p.errs().slice(0, 2).join(' | '));
      if (!p.w) return;
      ok(/Планиметрия 1/.test(p.d.getElementById('topic-title').textContent), tag + ': открыта линия 1: ' + p.d.getElementById('topic-title').textContent);
      ok(!/undefined|NaN/.test(moduleText(p.d)), tag + ': в списке линий нет undefined/NaN');
      act(p, answerWrongTwice, tag);
      ok(!p.errs().length, tag + ': ответ без ошибок: ' + p.errs().slice(0, 2).join(' | '));
      const v = readKey(p.w, VK);
      const r = isObj(v) && isObj(v.progress) ? v.progress[1] : null;
      ok(isObj(r) && r.attempts === 1 && r.correct === 0 && r.points === 0, tag + ': попытка записана: ' + JSON.stringify(v));
      ok(isObj(v) && v.currentId === 1, tag + ': currentId исправлен на 1: ' + JSON.stringify(v && v.currentId));
      if (store && /"extra"/.test(store[VK])) ok(v.extra && v.extra.keep === 1, tag + ': чужие поля ключа не тронуты');
      if (store && /"7":/.test(store[VK])) ok(v.progress[7] && v.progress[7].attempts === 4, tag + ': статистика линии 7 не тронута');
      p.w.close();
    });
  });

  /* Вторая вкладка: пока страница открыта, другая вкладка записала линию 7 —
     ответ здесь пишет дельту и её не затирает; счёт в памяти подтягивается. */
  {
    const p = open('exam/variant.html', null, '?m=1');
    const other = { progress: { 7: { attempts: 5, correct: 4, points: 4 } }, currentId: 7, note: 'другая вкладка' };
    p.w.localStorage.setItem(VK, JSON.stringify(other));
    act(p, answerWrongTwice, 'variant две вкладки');
    const v = readKey(p.w, VK);
    ok(v.progress[7] && v.progress[7].attempts === 5 && v.progress[7].correct === 4, 'variant: запись другой вкладки (линия 7) не затёрта: ' + JSON.stringify(v));
    ok(v.progress[1] && v.progress[1].attempts === 1, 'variant: своя попытка (линия 1) записана');
    ok(v.note === 'другая вкладка', 'variant: чужие поля ключа сохранены');
    /* та же линия: дельта поверх свежего значения, а не перезапись памятью */
    p.w.localStorage.setItem(VK, JSON.stringify({ progress: { 1: { attempts: 10, correct: 6, points: 6 } } }));
    act(p, d => { d.getElementById('next').click(); }, 'variant next');
    act(p, answerWrongTwice, 'variant та же линия');
    const v2 = readKey(p.w, VK);
    ok(v2.progress[1].attempts === 11 && v2.progress[1].correct === 6, 'variant: та же линия — +1 к свежему значению (11), а не память (2): ' + JSON.stringify(v2.progress[1]));
    ok(/6 верных из 11/.test(p.d.getElementById('topic-score').textContent), 'variant: счёт на экране подтянут из хранилища: ' + p.d.getElementById('topic-score').textContent);
    p.w.close();
  }

  /* Простой показ задачи (Новое задание без ответа) ничего не пишет */
  {
    const p = open('exam/variant.html', { [VK]: JSON.stringify({ progress: {}, currentId: 1 }) }, '?m=1');
    const marker = JSON.stringify({ progress: {}, currentId: 1, marker: 1 });
    p.w.localStorage.setItem(VK, marker);
    act(p, d => { d.getElementById('next').click(); d.getElementById('next').click(); }, 'variant показ');
    ok(p.w.localStorage.getItem(VK) === marker, 'variant: показ задачи без ответа ключ не переписывает');
    act(p, d => { d.getElementById('modules').querySelectorAll('button')[4].click(); }, 'variant линия 5');
    const v = readKey(p.w, VK);
    ok(v.currentId === 5 && v.marker === 1, 'variant: смена линии пишет только currentId: ' + JSON.stringify(v));
    ok(!p.errs().length, 'variant: показ и смена линии без ошибок: ' + p.errs().join(' | '));
    p.w.close();
  }
}

/* ================= exam/full-exam.html ================= */
{
  const FE_KEY = 'full-exam', ACT = 'full-exam-active';
  const now = Date.now();
  const cases = [['чистое хранилище', null]];
  for (const k in TOP) cases.push(['ключ: ' + k, { [KEY]: TOP[k], [VK]: TOP[k] }]);
  for (const k in REC) cases.push(['full-exam и active: ' + k, { [KEY]: JSON.stringify({ foreign: { keep: 1 }, [FE_KEY]: REC[k], [ACT]: REC[k] }) }]);
  cases.push(['attempts — строка', { [KEY]: JSON.stringify({ foreign: { keep: 1 }, [FE_KEY]: { attempts: 'abc' } }) }]);
  cases.push(['мусор внутри attempts', { [KEY]: JSON.stringify({ foreign: { keep: 1 }, [FE_KEY]: { attempts: [null, 'x', 5, { ts: 'q' }, { ts: 1, primary: '<img src=x id=xss>', test: [] }] } }) }]);
  cases.push(['active без seed', { [KEY]: JSON.stringify({ foreign: { keep: 1 }, [ACT]: { seed: 'x', start: now, answers: {}, marks: {} } }) }]);
  cases.push(['поля active', { [KEY]: JSON.stringify({ foreign: { keep: 1 }, [ACT]: { seed: 12345, start: now, answers: 'x', marks: [1], done: false } }) }]);
  cases.forEach(([name, store]) => {
    const p = open('exam/full-exam.html', store);
    const tag = 'full-exam [' + name + ']';
    ok(!!p.w && !p.errs().length, tag + ': загрузка без ошибок: ' + p.errs().slice(0, 2).join(' | '));
    if (!p.w) return;
    ok(!p.d.querySelector('#historyList img') && !/undefined|NaN|Invalid/.test(p.d.getElementById('historyList').textContent), tag + ': история без мусора в разметке');
    const resume = p.d.getElementById('resumeBtn').style.display !== 'none';
    act(p, d => {
      d.getElementById(resume ? 'resumeBtn' : 'startBtn').click();
      const inp = d.querySelector('#taskHost input[data-line="1"]');
      inp.value = '7'; inp.dispatchEvent(new p.w.Event('input'));
    }, tag + ' старт');
    ok(!p.errs().length, tag + ': экзамен начат без ошибок: ' + p.errs().slice(0, 2).join(' | '));
    let all = readKey(p.w, KEY);
    const a = isObj(all) ? all[ACT] : null;
    ok(isObj(a) && typeof a.seed === 'number' && isObj(a.answers) && a.answers[1] === '7', tag + ': активная попытка записана: ' + JSON.stringify(a));
    act(p, d => {
      d.getElementById('finishBtn2').click();
      btnByText(d, '#resultHost .chips[data-line="13"] button', '2').click();
    }, tag + ' финиш');
    ok(!p.errs().length, tag + ': экзамен завершён без ошибок: ' + p.errs().slice(0, 2).join(' | '));
    all = readKey(p.w, KEY);
    const fe = isObj(all) ? all[FE_KEY] : null;
    const last = isObj(fe) && Array.isArray(fe.attempts) ? fe.attempts[fe.attempts.length - 1] : null;
    ok(isObj(last) && last.lines && last.lines[13] === 2 && isCount(last.primary) && last.primary >= 2,
       tag + ': попытка и самооценка записаны: ' + JSON.stringify(last));
    ok(Array.isArray(fe && fe.attempts) && fe.attempts.every(x => isObj(x) && typeof x.ts === 'number' && isCount(x.primary) && isCount(x.test)),
       tag + ': в attempts нет мусорных записей');
    ok(isObj(all) && !(ACT in all), tag + ': активная попытка снята');
    if (store && /foreign/.test(store[KEY])) ok(all.foreign && all.foreign.keep === 1, tag + ': чужая ветка не тронута');
    p.w.close();
  });

  /* recount обновляет СВОЮ попытку: другая вкладка успела дописать новую */
  {
    const p = open('exam/full-exam.html', null);
    act(p, d => { d.getElementById('startBtn').click(); d.getElementById('finishBtn2').click(); }, 'full-exam своя попытка');
    let all = readKey(p.w, KEY);
    const mine = all[FE_KEY].attempts[all[FE_KEY].attempts.length - 1];
    const newer = { ts: mine.ts + 60000, seed: 777, spent: 10, primary: 5, test: 34, lines: { 1: 1 } };
    all[FE_KEY].attempts.push(newer);
    p.w.localStorage.setItem(KEY, JSON.stringify(all));
    act(p, d => { btnByText(d, '#resultHost .chips[data-line="14"] button', '3').click(); }, 'full-exam самооценка');
    all = readKey(p.w, KEY);
    const at = all[FE_KEY].attempts;
    const mine2 = at.find(x => x.ts === mine.ts && x.seed === mine.seed);
    const newer2 = at.find(x => x.seed === 777);
    ok(mine2 && mine2.lines[14] === 3 && mine2.primary >= 3, 'full-exam: самооценка записана в свою попытку: ' + JSON.stringify(mine2));
    ok(newer2 && newer2.primary === 5 && newer2.test === 34 && !(14 in newer2.lines), 'full-exam: чужая (более новая) попытка не тронута: ' + JSON.stringify(newer2));
    /* ключ очистили — своя попытка возвращается на место, а не теряется */
    p.w.localStorage.setItem(KEY, JSON.stringify({ foreign: { keep: 1 } }));
    act(p, d => { btnByText(d, '#resultHost .chips[data-line="13"] button', '1').click(); }, 'full-exam после очистки');
    all = readKey(p.w, KEY);
    ok(all.foreign.keep === 1 && all[FE_KEY].attempts.length === 1 && all[FE_KEY].attempts[0].lines[13] === 1, 'full-exam: после очистки ключа своя попытка восстановлена: ' + JSON.stringify(all));
    ok(!p.errs().length, 'full-exam: без ошибок');
    p.w.close();
  }

  /* ответ ученика в разметку результата — только через esc() */
  {
    const bad = '<img src=x id=xss onerror="window.__xss=1">';
    const p = open('exam/full-exam.html', { [KEY]: JSON.stringify({ [ACT]: { seed: 4242, start: Date.now(), noTimer: true, done: false, marks: {},
      answers: { 1: bad, 13: bad + '&amp;' } } }) });
    act(p, d => { d.getElementById('resumeBtn').click(); d.getElementById('finishBtn2').click(); }, 'full-exam esc');
    const host = p.d.getElementById('resultHost');
    ok(!host.querySelector('img') && !p.w.__xss, 'full-exam: ответ ученика не стал разметкой');
    ok(host.textContent.indexOf(bad) >= 0 && host.textContent.indexOf(bad + '&amp;') >= 0, 'full-exam: ответ показан как текст, дословно');
    p.w.close();
  }
}

/* ================= trainers/derivative-t8.html =================
   Верное решение во вкладке «Тренажёр» и старт зачёта после мусора: своя запись
   приведена к форме — runs и best конечные неотрицательные, passed — булево
   (true только если был true), в solvedByType только известные треки
   (DERIVATIVE_TRACKS адаптера), счёт «Решено в тренажёре» — сумма по ним;
   прочие поля записи и чужие ветки ключа не тронуты. */
{
  const DER = 'trainers/derivative-t8.html', TID = 'derivative-t8';
  const TRACKS = require('../progress-adapters.js').DERIVATIVE_TRACKS;
  /* детерминированный Math.random: одна и та же первая задача в каждой загрузке */
  const rng = seed => { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  const openDer = store => {
    const before = errors.length;
    let w = null;
    try {
      w = boot(DER, win => {
        win.Math.random = rng(4242);
        win.scrollTo = () => {};
        win.Element.prototype.scrollIntoView = function(){};
        for (const k in (store || {})) win.localStorage.setItem(k, store[k]);
      }, BASE + DER);
    } catch (e) { errors.push('boot ' + DER + ': ' + e.message); }
    return { w, d: w && w.document, errs: () => errors.slice(before) };
  };
  /* ответ первой задачи — из «пробной» загрузки: лестница разбора до последней ступени */
  const probe = openDer(null);
  let answer = null;
  act(probe, d => {
    d.getElementById('taskSol').click();
    const box = d.getElementById('taskSolBox'), btn = box.querySelector('.ladder-btn');
    for (let n = 0; n < 40 && !box.querySelector('.lfinal'); n++) btn.click();
    const f = box.querySelector('.lfinal'), m = f && f.textContent.match(/^Ответ: (.+)\.$/);
    answer = m && m[1];
  }, 'derivative пробная загрузка');
  ok(!!answer, 'derivative: ответ пробной задачи прочитан: ' + answer);
  if (probe.w) probe.w.close();

  const cases = [['чистое хранилище', null, 1]];
  for (const k in TOP) cases.push(['ключ: ' + k, { [KEY]: TOP[k] }, 1]);
  for (const k in REC) cases.push(['запись: ' + k, { [KEY]: JSON.stringify({ foreign: { keep: 1 }, [TID]: REC[k] }) }, 1]);
  cases.push(['поля записи', { [KEY]: JSON.stringify({ foreign: { keep: 1 }, [TID]: { runs: {}, best: 'zz', passed: 'yes', note: 'keep',
    solvedByType: { extrema: 2, junk: 5, toString: 3, tangent: 'x', physics: -1, antider: 2.5e400, onemax: 1.5 } } }) }, 4]);
  cases.push(['solvedByType — массив', { [KEY]: JSON.stringify({ foreign: { keep: 1 }, [TID]: { runs: -3, best: [9], passed: 1, solvedByType: [5] } }) }, 1]);
  cases.push(['сданный зачёт', { [KEY]: JSON.stringify({ foreign: { keep: 1 }, [TID]: { runs: 2, best: 9, passed: true, solvedByType: { physics: 4 } } }) }, 5]);
  cases.forEach(([name, store, total]) => {
    const p = openDer(store);
    const tag = DER + ' [' + name + ']';
    if (!p.w){ ok(false, tag + ': страница не загрузилась'); return; }
    ok(!p.errs().length, tag + ': загрузка без ошибок: ' + p.errs().slice(0, 2).join(' | '));
    let fbText = '';
    act(p, d => {
      d.getElementById('taskAnswer').value = answer;
      d.getElementById('taskCheck').click();
      fbText = d.getElementById('taskFb').textContent;
      d.getElementById('examStart').click();
    }, tag);
    ok(!p.errs().length, tag + ': решение и старт зачёта без ошибок: ' + p.errs().slice(0, 2).join(' | '));
    const all = readKey(p.w, KEY);
    ok(isObj(all), tag + ': ключ после записи — объект: ' + JSON.stringify(all));
    const r = isObj(all) ? all[TID] : undefined;
    const by = isObj(r) ? r.solvedByType : undefined;
    const sum = isObj(by) ? Object.keys(by).reduce((s, k) => s + by[k], 0) : -1;
    ok(isObj(r) && isCount(r.runs) && Number.isInteger(r.runs) && isCount(r.best) && isBool(r.passed),
       tag + ': runs, best — неотрицательные числа, passed — булево: ' + JSON.stringify(r));
    ok(isObj(by) && Object.keys(by).every(k => TRACKS.includes(k) && Number.isInteger(by[k]) && by[k] > 0),
       tag + ': в solvedByType только известные треки с целым счётом: ' + JSON.stringify(by));
    ok(sum === total && new RegExp('Решено в тренажёре: ' + total + '\\.').test(fbText),
       tag + ': счёт решённых — сумма по известным трекам (' + total + '): ' + sum + ' / ' + fbText);
    if (name === 'поля записи') ok(r.runs === 1 && r.best === 0 && r.passed === false && r.note === 'keep' && JSON.stringify(by) === '{"extrema":3,"onemax":1}',
       tag + ': runs {} → 0 + 1, best "zz" → 0, passed "yes" → false, note сохранено, неизвестные треки отброшены: ' + JSON.stringify(r));
    if (name === 'сданный зачёт') ok(r.runs === 3 && r.best === 9 && r.passed === true, tag + ': сданный зачёт и лучший результат сохранены: ' + JSON.stringify(r));
    else ok(r.runs === 1 || name === 'поля записи', tag + ': старт зачёта — runs = 1: ' + JSON.stringify(r && r.runs));
    if (store && /foreign/.test(store[KEY])) ok(isObj(all) && isObj(all.foreign) && all.foreign.keep === 1, tag + ': чужая ветка не тронута');
    p.w.close();
  });
}

console.log(`\nПроверок: ${checks}, отказов: ${fails}, JS-ошибок: ${errors.length}`);
if (errors.length) console.log(errors.slice(0, 8).join('\n'));
if (!fails && !errors.length) console.log('JUNK_GATE_OK');
process.exit(fails || errors.length ? 1 : 0);

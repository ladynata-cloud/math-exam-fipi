/* Проверка интерфейса векторного тренажёра (jsdom). */
const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const html = fs.readFileSync(process.argv[2] || 'vectors-yashchenko-t2.html', 'utf8');

let fails = 0, checks = 0;
function ok(cond, msg){ checks++; if (!cond){ fails++; console.log('FAIL:', msg); } }
const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errors.push(String(e && e.message || e)));

function boot(url = 'https://mathexam.space/trainers/vectors-yashchenko-t2.html', seed){
  const dom = new JSDOM(html, { runScripts: 'dangerously', url, virtualConsole: vc, pretendToBeVisual: true, beforeParse(w){ if (seed) seed(w); } });
  const w = dom.window;
  w.requestAnimationFrame = () => 0;
  w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
  return { w, d: w.document };
}
function click(w, el){ el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true })); }
function q(d, s){ return d.querySelector(s); }
function qa(d, s){ return Array.from(d.querySelectorAll(s)); }
function noJunk(str, where){ ok(!/undefined|NaN|\[object/.test(str), `junk in ${where}: ${String(str).slice(0, 140)}`); }
function answer(w, d, val, action){
  q(d, '#taskArea input.num').value = String(val);
  click(w, q(d, `[data-action="${action}"]`));
}
const KEY = 'mathExamCourseProgress.v1', TID = 'ege-t2-yashchenko';

/* ---------- 1. Загрузка, чипы, режимы, crumbs ---------- */
{
  const { w, d } = boot();
  ok(qa(d, '#types .chip').length === 8, 'восемь чипов (Все + 7 типов)');
  ok(!!q(d, 'a.crumbs') && /\.\.\/index\.html$/.test(q(d, 'a.crumbs').getAttribute('href')), 'ссылка «← Курс»');
  ok(w.eval('state.mode') === 'train', 'по умолчанию тренировка');
  noJunk(q(d, '#taskArea').innerHTML, 'первая задача');
  ok(/прототип: варианты/.test(q(d, '#taskArea').textContent), 'бейдж с прототипом из сборника');
}

/* ---------- 2. Тренировка: все 7 типов решаются, серии растут ---------- */
{
  const { w, d } = boot();
  for (const id of ['v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7']){
    click(w, q(d, `#types .chip[data-type="${id}"]`));
    for (let r = 0; r < 3; r++){
      if (r) click(w, q(d, '[data-action="new"]'));
      const t = w.eval('state.task');
      ok(t.id === id, `тип ${id}: фильтр держится`);
      noJunk(q(d, '#taskArea').innerHTML, `train ${id}`);
      if (id === 'v6' || id === 'v7') ok(q(d, '.figwrap svg'), `тип ${id}: клетчатый чертёж на месте`);
      answer(w, d, w.eval('YB2.num(state.task.ans)'), 'check');
      ok(w.eval('state.finished') === true && q(d, '.fb.ok'), `тип ${id}: верный ответ принят (${r + 1}/3)`);
    }
    const dots = qa(d, `#types .chip[data-type="${id}"] .dots i.on`).length;
    ok(dots === 3, `тип ${id}: серия из трёх чистых отмечена на чипе (${dots})`);
  }
  const st = JSON.parse(w.localStorage.getItem(KEY))[TID];
  ok(st.types.v4.best >= 3 && st.types.v4.correct >= 3, 'прогресс типов сохранён под TID');
}

/* ---------- 3. Ловушка → адресная диагностика → журнал ---------- */
{
  const { w, d } = boot();
  let guard = 0;
  while ((w.eval('state.task.traps.length') === 0 || w.eval('Math.abs(state.task.ans) < 0.5')) && guard++ < 60) click(w, q(d, '[data-action="new"]'));
  const trap = w.eval('state.task.traps[0]');
  const typeId = w.eval('state.task.id');
  answer(w, d, String(trap.v).replace('.', ','), 'check');
  ok(q(d, '.fb.bad') && q(d, '.fb.bad').textContent.includes(trap.msg.replace(/<[^>]+>/g, '').slice(0, 25)), 'ловушка: показан адресный разбор ошибки');
  let mk = JSON.parse(w.localStorage.getItem(KEY)).mistakes;
  ok(mk[TID + '|' + typeId].w === 1 && mk[TID + '|' + typeId].r === 0, 'журнал: промах записан');
  ok(q(d, '[data-action="steps"]'), 'после промаха доступна кнопка «Показать разбор»');
  click(w, q(d, '[data-action="steps"]'));
  ok(qa(d, '.steps li').length >= 2, 'разбор по шагам раскрыт');
  answer(w, d, w.eval('YB2.num(state.task.ans)'), 'check');
  mk = JSON.parse(w.localStorage.getItem(KEY)).mistakes;
  ok(mk[TID + '|' + typeId].r === 1, 'журнал: верный после промаха (r=1)');
  // округление
  click(w, q(d, '[data-action="new"]'));
  guard = 0;
  while (w.eval('Math.abs(state.task.ans) < 2 || state.task.ans !== Math.round(state.task.ans)') && guard++ < 80) click(w, q(d, '[data-action="new"]'));
  answer(w, d, w.eval('state.task.ans') + 0.004, 'check');
  ok(/округлен/i.test(q(d, '.fb').textContent), 'близкий ответ: подсказка про округление');
}

/* ---------- 4. Режим «Разбор» ---------- */
{
  const { w, d } = boot();
  click(w, q(d, '#modeSeg [data-mode="learn"]'));
  ok(qa(d, '.steps li').length >= 2 && !q(d, '#taskArea input.num'), 'разбор: шаги видны сразу, поля ответа нет');
  ok(/Ответ:/.test(q(d, '#taskArea').textContent), 'разбор: ответ показан');
  const before = w.eval('state.task.text');
  click(w, q(d, '[data-action="new"]'));
  ok(w.eval('state.task.text') !== before, '«Ещё пример» меняет задачу');
  noJunk(q(d, '#taskArea').innerHTML, 'learn');
}

/* ---------- 5. Зачёт: 7/7 → сдан; промах → разбор в конце ---------- */
{
  const { w, d } = boot();
  click(w, q(d, '#modeSeg [data-mode="exam"]'));
  ok(/Лучший результат: 0 из 7/.test(q(d, '#taskArea').textContent), 'зачёт: интро со статистикой');
  click(w, q(d, '[data-action="exam-start"]'));
  for (let i = 0; i < 7; i++){
    ok(qa(d, '.zdots i').length === 7, 'зачёт: семь точек прогресса');
    answer(w, d, w.eval('YB2.num(state.z.tasks[state.z.i].ans)'), 'exam-check');
  }
  ok(/7 из 7 — зачёт сдан/.test(q(d, '.zres').textContent), 'зачёт: 7 из 7 распознан');
  let st = JSON.parse(w.localStorage.getItem(KEY))[TID];
  ok(st.passed === true && st.best === 7 && st.runs === 1, 'зачёт: passed/best/runs записаны');
  // второй заход с одним промахом
  click(w, q(d, '[data-action="exam-start"]'));
  answer(w, d, '999999', 'exam-check');
  const missedType = w.eval('state.z.plan[0]');
  for (let i = 1; i < 7; i++) answer(w, d, w.eval('YB2.num(state.z.tasks[state.z.i].ans)'), 'exam-check');
  ok(/6 из 7/.test(q(d, '.zres').textContent), 'зачёт: 6 из 7 распознан');
  const miss = q(d, 'details.zmiss');
  ok(!!miss && /верный/.test(miss.textContent), 'зачёт: промах вынесен в разбор с верным ответом');
  miss.open = true;
  ok(miss.querySelectorAll('.steps li').length >= 2, 'зачёт: разбор промаха содержит шаги');
  st = JSON.parse(w.localStorage.getItem(KEY))[TID];
  ok(st.best === 7 && st.runs === 2, 'зачёт: best не откатился, runs=2');
  const mk = JSON.parse(w.localStorage.getItem(KEY)).mistakes;
  ok(mk[TID + '|' + missedType] && mk[TID + '|' + missedType].w >= 1, 'зачёт: промах ушёл в журнал');
  click(w, q(d, '[data-action="to-train"]'));
  ok(w.eval('state.mode') === 'train' && q(d, '#modeSeg [data-mode="train"]').getAttribute('aria-pressed') === 'true', 'кнопка «В тренировку» переключает режим');
}

/* ---------- 6. Работа над ошибками (?mode=review) ---------- */
{
  const seed = win => win.localStorage.setItem(KEY, JSON.stringify({ mistakes: { [TID + '|v3']: { w: 2, r: 0, lastWrong: 1, last: 1 } } }));
  const { w, d } = boot('https://mathexam.space/trainers/vectors-yashchenko-t2.html?mode=review', seed);
  ok(w.eval('state.review') === true && w.eval('state.task.id') === 'v3', 'review: задача из открытого типа');
  ok(/Работа над ошибками/.test(q(d, '#modeHelp').textContent), 'review: баннер показан');
  click(w, q(d, '#types .chip[data-type="v1"]'));
  ok(w.eval('state.review') === false, 'review: выбор типа выключает разбор');
}
{
  const { w, d } = boot('https://mathexam.space/trainers/vectors-yashchenko-t2.html?mode=review');
  ok(w.eval('state.review') === false && /Открытых ошибок нет/.test(q(d, '#modeHelp').textContent), 'review: пустой журнал — обычный режим');
}

/* ---------- 7. Режим доски и хвосты ---------- */
{
  const { w, d } = boot();
  click(w, q(d, '#boardBtn'));
  ok(d.documentElement.classList.contains('board'), 'доска включается');
  ok(JSON.parse(w.localStorage.getItem(KEY))[TID].board === true, 'доска сохранена в ключе курса');
  ok(qa(d, '#taskArea .vv').length >= 0, 'страница жива');
  ok(errors.length === 0, 'нет JS-ошибок: ' + errors.join(' | '));
}


/* ---------- 8. Доска, зеркало и полный экран через URL ---------- */
const VEC_URL = 'https://mathexam.space/trainers/vectors-yashchenko-t2.html';
function cls(w){ return w.document.documentElement.classList; }
const reviewSeed = win => win.localStorage.setItem(KEY, JSON.stringify({
  mistakes: { 'ege-t2-yashchenko|v3': { w: 2, r: 0, lastWrong: 1, last: 1 } }
}));
{
  const { w, d } = boot(VEC_URL);
  ok(!cls(w).contains('board') && !cls(w).contains('mirror'), 'без параметров ни доски, ни зеркала');
  ok(!!q(d, '#mirrorBtn'), 'кнопка «Зеркало» есть');
  click(w, q(d, '#mirrorBtn'));
  ok(cls(w).contains('mirror'), 'кнопка включает зеркало');
  ok(q(d, '#mirrorBtn').getAttribute('aria-pressed') === 'true', 'aria-pressed у зеркала');
  ok(/Убрать зеркало/.test(q(d, '#mirrorBtn').textContent), 'подпись кнопки меняется');
  ok(!/mirror/.test(w.localStorage.getItem(KEY) || ''), 'зеркало не попадает в хранилище');
  click(w, q(d, '#mirrorBtn'));
  ok(!cls(w).contains('mirror'), 'повторный клик выключает зеркало');
}
{
  const { w } = boot(VEC_URL + '?board=1');
  ok(cls(w).contains('board') && !cls(w).contains('mirror'), '?board=1 включает только доску');
}
{
  const { w, d } = boot(VEC_URL + '?mirror=1');
  ok(cls(w).contains('mirror') && !cls(w).contains('board'), '?mirror=1 включает только зеркало');
  ok(/Убрать зеркало/.test(q(d, '#mirrorBtn').textContent), '?mirror=1: подпись кнопки согласована');
}
{
  const { w, d } = boot(VEC_URL + '?board=1&mirror=1&mode=review', reviewSeed);
  ok(cls(w).contains('board') && cls(w).contains('mirror'), 'доска и зеркало сочетаются');
  ok(w.eval('state.review') === true && w.eval('state.mode') === 'train', 'сочетание не мешает ?mode=review');
  ok(/Работа над ошибками/.test(q(d, '#modeHelp').textContent), 'review-баннер на месте под доской и зеркалом');
  ok(w.eval('state.task.id') === 'v3', 'задача всё так же пришла из открытого типа');
  noJunk(q(d, '#taskArea').innerHTML, 'задача под доской и зеркалом');
}
{
  const { w, d } = boot(VEC_URL + '?mirror=1');
  const t = w.eval('state.task');
  answer(w, d, w.eval('YB2.num(state.task.ans)'), 'check');
  ok(w.eval('state.finished') === true && q(d, '.fb.ok'), 'под зеркалом верный ответ принимается');
  ok(cls(w).contains('mirror'), 'зеркало не слетело от проверки ответа');
  ok(!!t, 'задача была выдана');
}
{
  const { d } = boot(VEC_URL + '?board=1');
  ok(!d.querySelector('#fsBtn'), 'без Fullscreen API кнопка «Во весь экран» убрана');
  ok(!!d.querySelector('#boardBtn') && !!d.querySelector('#mirrorBtn'), 'остальные кнопки шапки на месте');
}
{
  const seed = win => { win.HTMLElement.prototype.requestFullscreen = function(){ win.__fs = true; return Promise.resolve(); }; };
  const { w, d } = boot(VEC_URL + '?board=1', seed);
  const btn = q(d, '#fsBtn');
  ok(!!btn, 'с Fullscreen API кнопка остаётся');
  click(w, btn);
  ok(w.__fs === true, 'кнопка зовёт requestFullscreen');
}

console.log(`\nПроверок: ${checks}, отказов: ${fails}, JS-ошибок: ${errors.length}`);
if (errors.length) console.log(errors.slice(0, 5).join('\n'));
process.exit(fails || errors.length ? 1 : 0);

/* Проверка интерфейса планиметрического тренажёра (jsdom). */
const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const html = fs.readFileSync(process.argv[2] || 'planimetry-yashchenko-t1.html', 'utf8');

let fails = 0, checks = 0;
function ok(cond, msg){ checks++; if (!cond){ fails++; console.log('FAIL:', msg); } }
const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errors.push(String(e && e.message || e)));

function boot(url = 'https://mathexam.space/trainers/planimetry-yashchenko-t1.html', seed){
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
const KEY = 'mathExamCourseProgress.v1', TID = 'ege-t1-yashchenko';
const GROUPS = { tri: ['t1','t4','t6','t8','t10','t12'], par: ['t2','t3','t18'], trap: ['t7','t15','t16','t17'], circ: ['t5','t9','t11','t13','t14','t19'] };
const ALL_TYPES = [].concat(...Object.values(GROUPS));

/* ---------- 1. Загрузка, темы, crumbs ---------- */
{
  const { w, d } = boot();
  ok(qa(d, '#groups .chip').length === 5, 'пять чипов тем (Все + 4)');
  ok(qa(d, '#types .chip').length === 0, 'при «Все темы» ряд типов скрыт');
  ok(!!q(d, 'a.crumbs') && /\.\.\/index\.html$/.test(q(d, 'a.crumbs').getAttribute('href')), 'ссылка «← Курс»');
  ok(/0\/6/.test(q(d, '#groups .chip[data-group="tri"]').textContent), 'счётчик закрытых на теме');
  noJunk(q(d, '#taskArea').innerHTML, 'первая задача');
}

/* ---------- 2. Темы и типы: фильтры и «Вся тема» ---------- */
{
  const { w, d } = boot();
  click(w, q(d, '#groups .chip[data-group="trap"]'));
  ok(qa(d, '#types .chip').length === 1 + GROUPS.trap.length, 'тема открывает свои типы + «Вся тема»');
  for (let i = 0; i < 6; i++){
    ok(GROUPS.trap.includes(w.eval('state.task.id')), `«Вся тема»: задача из темы (${w.eval('state.task.id')})`);
    click(w, q(d, '[data-action="new"]'));
  }
  click(w, q(d, '#types .chip[data-type="t16"]'));
  ok(w.eval('state.task.id') === 't16', 'выбор типа фиксирует тип');
  noJunk(q(d, '#taskArea').innerHTML, 'тип t16');
}

/* ---------- 3. Все 19 типов решаются; серия закрывает тип ---------- */
{
  const { w, d } = boot();
  for (const gid of Object.keys(GROUPS)){
    click(w, q(d, `#groups .chip[data-group="${gid}"]`));
    for (const id of GROUPS[gid]){
      click(w, q(d, `#types .chip[data-type="${id}"]`));
      ok(w.eval('state.task.id') === id, `тип ${id} выбран`);
      ok(!!q(d, '.figwrap svg'), `тип ${id}: чертёж на месте`);
      noJunk(q(d, '#taskArea').innerHTML, `train ${id}`);
      answer(w, d, w.eval('YB1.num(state.task.ans)'), 'check');
      ok(w.eval('state.finished') === true && q(d, '.fb.ok'), `тип ${id}: верный ответ принят`);
    }
  }
  // серия из трёх на одном типе закрывает его на чипе и в счётчике темы
  click(w, q(d, '#groups .chip[data-group="par"]'));
  click(w, q(d, '#types .chip[data-type="t18"]'));
  for (let r = 0; r < 3; r++){
    if (r) click(w, q(d, '[data-action="new"]'));
    answer(w, d, w.eval('YB1.num(state.task.ans)'), 'check');
  }
  ok(qa(d, '#types .chip[data-type="t18"] .dots i.on').length === 3, 'серия из трёх отмечена на чипе типа');
  ok(/1\/3/.test(q(d, '#groups .chip[data-group="par"]').textContent), 'счётчик темы обновился (1/3)');
  const st = JSON.parse(w.localStorage.getItem(KEY))[TID];
  ok(st.types.t18.best >= 3, 'best типа сохранён под TID');
}

/* ---------- 4. Ловушка → диагностика → журнал; округление; разбор ---------- */
{
  const { w, d } = boot();
  let guard = 0;
  while ((w.eval('state.task.traps.length') === 0) && guard++ < 60) click(w, q(d, '[data-action="new"]'));
  const trap = w.eval('state.task.traps[0]');
  const typeId = w.eval('state.task.id');
  answer(w, d, String(trap.v).replace('.', ','), 'check');
  ok(q(d, '.fb.bad') && q(d, '.fb.bad').textContent.includes(String(trap.msg).replace(/<[^>]+>/g, '').slice(0, 25)), 'ловушка: адресный разбор ошибки');
  let mk = JSON.parse(w.localStorage.getItem(KEY)).mistakes;
  ok(mk[TID + '|' + typeId].w === 1, 'журнал: промах записан');
  click(w, q(d, '[data-action="steps"]'));
  ok(qa(d, '.steps li').length >= 2, 'разбор по шагам раскрыт');
  answer(w, d, w.eval('YB1.num(state.task.ans)'), 'check');
  mk = JSON.parse(w.localStorage.getItem(KEY)).mistakes;
  ok(mk[TID + '|' + typeId].r === 1, 'журнал: верный после промаха (r=1)');
  guard = 0;
  click(w, q(d, '[data-action="new"]'));
  while (w.eval('Math.abs(state.task.ans) < 2 || state.task.ans !== Math.round(state.task.ans)') && guard++ < 80) click(w, q(d, '[data-action="new"]'));
  answer(w, d, w.eval('state.task.ans') + 0.004, 'check');
  ok(/округлен/i.test(q(d, '.fb').textContent), 'близкий ответ: подсказка про округление');
}

/* ---------- 5. Режим «Разбор» ---------- */
{
  const { w, d } = boot();
  click(w, q(d, '#modeSeg [data-mode="learn"]'));
  ok(qa(d, '.steps li').length >= 2 && !q(d, '#taskArea input.num'), 'разбор: шаги видны, поля нет');
  const before = w.eval('state.task.text');
  click(w, q(d, '[data-action="new"]'));
  ok(w.eval('state.task.text') !== before, '«Ещё пример» меняет задачу');
  noJunk(q(d, '#taskArea').innerHTML, 'learn');
}

/* ---------- 6. Зачёт: 10 задач; 10/10 → сдан; промах → разбор ---------- */
{
  const { w, d } = boot();
  click(w, q(d, '#modeSeg [data-mode="exam"]'));
  ok(/Лучший результат: 0 из 10/.test(q(d, '#taskArea').textContent), 'зачёт: интро');
  click(w, q(d, '[data-action="exam-start"]'));
  ok(new Set(w.eval('state.z.plan')).size === 10, 'зачёт: 10 разных типов');
  for (let i = 0; i < 10; i++){
    ok(qa(d, '.zdots i').length === 10, 'зачёт: десять точек');
    answer(w, d, w.eval('YB1.num(state.z.tasks[state.z.i].ans)'), 'exam-check');
  }
  ok(/10 из 10 — зачёт сдан/.test(q(d, '.zres').textContent), 'зачёт: 10 из 10');
  let st = JSON.parse(w.localStorage.getItem(KEY))[TID];
  ok(st.passed === true && st.best === 10 && st.runs === 1, 'зачёт: passed/best/runs');
  click(w, q(d, '[data-action="exam-start"]'));
  answer(w, d, '999999', 'exam-check');
  const missedType = w.eval('state.z.plan[0]');
  for (let i = 1; i < 10; i++) answer(w, d, w.eval('YB1.num(state.z.tasks[state.z.i].ans)'), 'exam-check');
  ok(/9 из 10/.test(q(d, '.zres').textContent), 'зачёт: 9 из 10');
  const miss = q(d, 'details.zmiss');
  ok(!!miss && /верный/.test(miss.textContent), 'зачёт: промах в разборе');
  miss.open = true;
  ok(miss.querySelectorAll('.steps li').length >= 2, 'зачёт: разбор промаха с шагами');
  st = JSON.parse(w.localStorage.getItem(KEY))[TID];
  ok(st.best === 10 && st.runs === 2, 'зачёт: best не откатился');
  const mk = JSON.parse(w.localStorage.getItem(KEY)).mistakes;
  ok(mk[TID + '|' + missedType] && mk[TID + '|' + missedType].w >= 1, 'зачёт: промах в журнале');
  click(w, q(d, '[data-action="to-train"]'));
  ok(w.eval('state.mode') === 'train', '«В тренировку» работает');
}

/* ---------- 7. Работа над ошибками ---------- */
{
  const seed = win => win.localStorage.setItem(KEY, JSON.stringify({ mistakes: { [TID + '|t13']: { w: 2, r: 0, lastWrong: 1, last: 1 } } }));
  const { w, d } = boot('https://mathexam.space/trainers/planimetry-yashchenko-t1.html?mode=review', seed);
  ok(w.eval('state.review') === true && w.eval('state.task.id') === 't13', 'review: задача из открытого типа');
  ok(/Работа над ошибками/.test(q(d, '#modeHelp').textContent), 'review: баннер');
  click(w, q(d, '#groups .chip[data-group="tri"]'));
  ok(w.eval('state.review') === false, 'review: выбор темы выключает разбор');
}
{
  const { w, d } = boot('https://mathexam.space/trainers/planimetry-yashchenko-t1.html?mode=review');
  ok(w.eval('state.review') === false && /Открытых ошибок нет/.test(q(d, '#modeHelp').textContent), 'review: пустой журнал');
}

/* ---------- 8. Доска, хвосты ---------- */
{
  const { w, d } = boot();
  click(w, q(d, '#boardBtn'));
  ok(d.documentElement.classList.contains('board') && JSON.parse(w.localStorage.getItem(KEY))[TID].board === true, 'доска включается и сохраняется');
  ok(errors.length === 0, 'нет JS-ошибок: ' + errors.join(' | '));
}

console.log(`\nПроверок: ${checks}, отказов: ${fails}, JS-ошибок: ${errors.length}`);
if (errors.length) console.log(errors.slice(0, 5).join('\n'));
process.exit(fails || errors.length ? 1 : 0);

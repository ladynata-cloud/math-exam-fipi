/* Проверка режима доски и зеркала: URL-параметры, кнопки, полный экран,
   совместимость с ?mode=review (jsdom). */
const fs = require('fs');
const path = require('path');
const { makeBoot, ROOT } = require('./boot.js');

let fails = 0, checks = 0;
function ok(cond, msg){ checks++; if (!cond){ fails++; console.log('FAIL:', msg); } }

const errors = [];
const boot = makeBoot(errors);
const KEY = 'mathExamCourseProgress.v1';
const TID = 'ege-t1-yashchenko';
const TRAINER = 'trainers/planimetry-yashchenko-t1.html';
const BASE = 'https://mathexam.space/' + TRAINER;

function click(w, el){ el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true })); }
function cls(w){ return w.document.documentElement.classList; }

/* ================= 1. Правило зеркала есть в разметке ================= */
{
  const rule = /html\.mirror body\s*\{\s*transform:\s*scaleX\(-1\)\s*\}/;
  for (const file of ['teacher.html', TRAINER]){
    const css = fs.readFileSync(path.join(ROOT, file), 'utf8');
    ok(rule.test(css), file + ': правило html.mirror body{transform:scaleX(-1)}');
  }
  const trainer = fs.readFileSync(path.join(ROOT, TRAINER), 'utf8');
  ok(!/localStorage[^\n]*mirror|mirror[^\n]*saveStats/.test(trainer), 'тренажёр не сохраняет зеркало');
}

/* ================= 2. Тренажёр: параметры и кнопки ================= */
{
  const w = boot(TRAINER, null, BASE);
  ok(!cls(w).contains('board') && !cls(w).contains('mirror'), 'без параметров ни доски, ни зеркала');
  ok(!!w.document.getElementById('mirrorBtn'), 'кнопка «Зеркало» есть');

  click(w, w.document.getElementById('mirrorBtn'));
  ok(cls(w).contains('mirror'), 'кнопка включает зеркало');
  ok(w.document.getElementById('mirrorBtn').getAttribute('aria-pressed') === 'true', 'aria-pressed у зеркала');
  ok(/Убрать зеркало/.test(w.document.getElementById('mirrorBtn').textContent), 'подпись кнопки меняется');
  const saved = JSON.parse(w.localStorage.getItem(KEY) || '{}')[TID] || {};
  ok(!('mirror' in saved), 'зеркало не попало в сохранённые настройки');

  click(w, w.document.getElementById('mirrorBtn'));
  ok(!cls(w).contains('mirror'), 'повторный клик выключает зеркало');
}

{
  const w = boot(TRAINER, null, BASE + '?board=1');
  ok(cls(w).contains('board'), '?board=1 включает режим доски');
  ok(w.document.getElementById('boardBtn').getAttribute('aria-pressed') === 'true', '?board=1 обновляет кнопку');
  ok(JSON.parse(w.localStorage.getItem(KEY))[TID].board === true, '?board=1 идёт через setBoard и сохраняется');
  ok(!cls(w).contains('mirror'), '?board=1 сам по себе зеркала не включает');
}

{
  const w = boot(TRAINER, null, BASE + '?mirror=1');
  ok(cls(w).contains('mirror') && !cls(w).contains('board'), '?mirror=1 включает только зеркало');
  const st = JSON.parse(w.localStorage.getItem(KEY) || '{}')[TID];
  ok(!st || st.board !== true, '?mirror=1 не трогает сохранённый режим доски');
}

{
  const w = boot(TRAINER, null, BASE + '?board=1&mirror=1');
  ok(cls(w).contains('board') && cls(w).contains('mirror'), 'параметры комбинируются');
}

/* Сохранённая доска и параметр не спорят друг с другом. */
{
  const seed = win => win.localStorage.setItem(KEY, JSON.stringify({ [TID]: { types:{}, runs:0, best:0, passed:false, board:true } }));
  const w = boot(TRAINER, seed, BASE + '?mirror=1');
  ok(cls(w).contains('board'), 'сохранённая доска включается и без параметра');
  ok(cls(w).contains('mirror'), 'зеркало из параметра поверх сохранённой доски');
}

/* ================= 3. Тренажёр: связка с ?mode=review ================= */
{
  const now = Date.now();
  const seed = win => win.localStorage.setItem(KEY, JSON.stringify({
    mistakes: { [TID + '|t13']: { w: 2, r: 0, lastWrong: now, last: now } }
  }));
  const w = boot(TRAINER, seed, BASE + '?board=1&mirror=1&mode=review');
  const d = w.document;
  ok(cls(w).contains('board') && cls(w).contains('mirror'), 'доска и зеркало вместе с ?mode=review');
  ok(w.eval('state.review') === true, 'режим разбора ошибок включён');
  ok(w.eval('state.task.id') === 't13', 'задача взята из открытого типа');
  ok(/Работа над ошибками/.test(d.getElementById('modeHelp').textContent), 'баннер разбора ошибок на месте');

  /* Клики и ввод под зеркалом продолжают работать. */
  const input = d.querySelector('#taskArea input.num');
  input.value = String(w.eval('YB1.num(state.task.ans)')).replace('.', ',');
  click(w, d.querySelector('[data-action="check"]'));
  ok(w.eval('state.finished') === true && !!d.querySelector('.fb.ok'), 'под зеркалом ответ принимается');

  click(w, d.querySelector('#groups .chip[data-group="trap"]'));
  ok(w.eval('state.group') === 'trap', 'под зеркалом чипы тем кликаются');
  ok(!!d.querySelector('.figwrap svg'), 'под зеркалом чертёж на месте');
  ok(cls(w).contains('mirror'), 'зеркало не слетело от кликов');
}

/* ================= 4. Полный экран ================= */
{
  const w = boot(TRAINER, null, BASE);
  ok(!w.document.getElementById('fsBtn'), 'без Fullscreen API кнопка «Во весь экран» убрана');
}
{
  const seed = win => {
    win.HTMLElement.prototype.requestFullscreen = function(){ win.__fs = true; return Promise.resolve(); };
  };
  const w = boot(TRAINER, seed, BASE + '?board=1');
  const btn = w.document.getElementById('fsBtn');
  ok(!!btn, 'с Fullscreen API кнопка остаётся');
  click(w, btn);
  ok(w.__fs === true, 'кнопка зовёт requestFullscreen');
  ok(errors.length === 0, 'полный экран не даёт исключений: ' + errors.join(' | '));
}

/* ================= 5. Кабинет учителя ================= */
{
  const w = boot('teacher.html');
  ok(!cls(w).contains('board') && !cls(w).contains('mirror'), 'teacher: чистый вид без параметров');
  click(w, w.document.getElementById('boardBtn'));
  ok(cls(w).contains('board'), 'teacher: кнопка доски работает');
  click(w, w.document.getElementById('mirrorBtn'));
  ok(cls(w).contains('mirror'), 'teacher: кнопка зеркала работает');
  ok(w.localStorage.getItem('mathExamCourseProgress.v1') === null, 'teacher: доска и зеркало ничего не пишут в прогресс');
  ok(!w.document.getElementById('fsBtn'), 'teacher: без Fullscreen API кнопка убрана');
}
{
  const w = boot('teacher.html', null, 'https://mathexam.space/teacher.html?board=1');
  ok(cls(w).contains('board') && !cls(w).contains('mirror'), 'teacher: ?board=1');
}
{
  const w = boot('teacher.html', null, 'https://mathexam.space/teacher.html?mirror=1');
  ok(!cls(w).contains('board') && cls(w).contains('mirror'), 'teacher: ?mirror=1');
}
{
  const w = boot('teacher.html', null, 'https://mathexam.space/teacher.html?board=1&mirror=1');
  ok(cls(w).contains('board') && cls(w).contains('mirror'), 'teacher: параметры комбинируются');
  ok(w.document.getElementById('boardBtn').getAttribute('aria-pressed') === 'true', 'teacher: кнопка доски отражает состояние');
  ok(w.document.getElementById('mirrorBtn').getAttribute('aria-pressed') === 'true', 'teacher: кнопка зеркала отражает состояние');
}

/* Похожие, но не те параметры доску не включают. */
{
  const w = boot('teacher.html', null, 'https://mathexam.space/teacher.html?board=0&mirrored=1&noboard=1');
  ok(!cls(w).contains('board') && !cls(w).contains('mirror'), 'чужие параметры игнорируются');
}

ok(errors.length === 0, 'нет JS-ошибок: ' + errors.join(' | '));
console.log(`\nПроверок: ${checks}, отказов: ${fails}, JS-ошибок: ${errors.length}`);
if (errors.length) console.log(errors.slice(0, 5).join('\n'));
process.exit(fails || errors.length ? 1 : 0);

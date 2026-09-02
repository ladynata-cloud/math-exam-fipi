/* ============================================================
   Планиметрия · задание 1 (Ященко-2026) — интерфейс поверх банка YB1.
   Темы → типы; режимы: Разбор / Тренировка / Зачёт (10 задач без
   повторов типов). Прогресс и журнал ошибок — в едином ключе курса.
   ============================================================ */
'use strict';
if (typeof module !== 'undefined'){ Object.assign(global, { YB1: require('./bank-t1-planimetry.js') }); }

const COURSE_KEY = 'mathExamCourseProgress.v1';
const TID = 'ege-t1-yashchenko';
const EXAM_N = 10;
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const PRAISE = ['Верно!', 'Точно!', 'Да, так!', 'Правильно!', 'Есть!'];
const GROUPS = [
  { id: 'tri',  name: 'Треугольники',          ids: ['t1', 't4', 't6', 't8', 't10', 't12'] },
  { id: 'par',  name: 'Параллелограмм и ромб', ids: ['t2', 't3', 't18'] },
  { id: 'trap', name: 'Трапеции',              ids: ['t7', 't15', 't16', 't17'] },
  { id: 'circ', name: 'Окружность',            ids: ['t5', 't9', 't11', 't13', 't14', 't19'] }
];
const SHORT = {
  t1: 'Равнобедр. и биссектриса', t2: 'Биссектриса угла', t3: 'Две биссектрисы', t4: 'Высота и синус',
  t5: 'Вписанный 4-угольник', t6: 'Угол между биссектрисами', t7: 'Средняя линия и диагональ',
  t8: 'Из прямого угла', t9: 'Вписанная окружность', t10: 'Площадь и высота', t11: 'Углы на одной дуге',
  t12: 'Катет по синусу', t13: 'Секущие и дуги', t14: 'Хорда и вписанный угол', t15: 'Отсечённая трапеция',
  t16: 'Диагонали и средняя линия', t17: 'Описанная трапеция', t18: 'Ромб: диагонали', t19: 'Дуги 4-угольника'
};
const MODE_HELP = {
  learn: 'Разбор для доски: задача показана сразу с решением по шагам. «Ещё пример» — новая задача того же типа или темы.',
  train: 'Решайте и проверяйте. При промахе тренажёр подскажет, откуда взялось именно ваше число, — а разбор можно открыть в любой момент.',
  exam: `Зачёт: ${EXAM_N} задач разных типов подряд, порядок случайный, одна попытка на задачу. Разбор — после финиша. Сдан при ${EXAM_N} из ${EXAM_N}.`
};
const TYPE_IDS = GROUPS.reduce((a, g) => a.concat(g.ids), []);
const groupOf = id => GROUPS.find(g => g.ids.includes(id));

/* ---------- хранение ---------- */
function readAll(){ try { return JSON.parse(localStorage.getItem(COURSE_KEY) || '{}'); } catch (e){ return {}; } }
function writeAll(all){ try { localStorage.setItem(COURSE_KEY, JSON.stringify(all)); } catch (e){} }
let stats = loadStats();
function loadStats(){
  const s = readAll()[TID] || {};
  return { types: s.types || {}, runs: s.runs || 0, best: s.best || 0, passed: !!s.passed, board: !!s.board };
}
function saveStats(){ const all = readAll(); all[TID] = stats; writeAll(all); }
function tstat(id){ return stats.types[id] || (stats.types[id] = { solved: 0, correct: 0, streak: 0, best: 0 }); }
function mlog(type, okFlag){
  const all = readAll();
  const mk = all.mistakes = all.mistakes || {};
  const e = mk[TID + '|' + type] = mk[TID + '|' + type] || { w: 0, r: 0 };
  if (okFlag){ if (e.w) e.r = (e.r || 0) + 1; }
  else { e.w = (e.w || 0) + 1; e.r = 0; e.lastWrong = Date.now(); }
  e.last = Date.now();
  writeAll(all);
}
function openTypes(){
  const mk = readAll().mistakes || {}, pre = TID + '|', res = [];
  for (const k in mk) if (k.indexOf(pre) === 0 && (mk[k].w || 0) > 0 && (mk[k].r || 0) < 3 && TYPE_IDS.includes(k.slice(pre.length))) res.push(k.slice(pre.length));
  return res;
}

/* ---------- состояние ---------- */
const state = {
  group: 'all', type: 'mix', mode: 'train', task: null,
  fails: 0, finished: false, counted: false, showSteps: false, fb: null,
  review: false, reviewEmpty: false, z: null
};

function newTask(){
  state.fails = 0; state.finished = false; state.counted = false; state.showSteps = false; state.fb = null;
  if (state.review){
    const open = openTypes();
    if (open.length) state.task = YB1.make(open[Math.floor(Math.random() * open.length)]);
    else { state.review = false; state.reviewEmpty = true; state.task = makeByFilter(); }
  } else state.task = makeByFilter();
  render();
}
function makeByFilter(){
  if (state.type !== 'mix') return YB1.make(state.type);
  if (state.group === 'all') return YB1.random();
  const g = GROUPS.find(x => x.id === state.group);
  return YB1.make(g.ids[Math.floor(Math.random() * g.ids.length)]);
}
function setGroup(g){ state.review = false; state.reviewEmpty = false; state.group = g; state.type = 'mix'; if (state.mode === 'exam'){ state.z = null; renderExamIntro(); return; } newTask(); }
function setType(t){ state.review = false; state.reviewEmpty = false; state.type = t; if (t !== 'mix') state.group = groupOf(t).id; if (state.mode === 'exam'){ state.z = null; renderExamIntro(); return; } newTask(); }
function setMode(m){
  state.review = false; state.reviewEmpty = false; state.mode = m;
  if (m === 'exam'){ state.z = null; renderExamIntro(); return; }
  newTask();
}

/* ---------- разметка ---------- */
function esc(s){ return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
function tagHtml(t){ return `<span class="tag">${esc(SHORT[t.id] || t.id)} <em>· прототип: ${esc(t.src)}</em></span>`; }
function figHtml(t){ return t.fig ? `<div class="figwrap">${t.fig}</div>` : ''; }
function stepsHtml(t){ return `<ol class="steps">${t.steps.map(s => `<li>${s}</li>`).join('')}</ol>`; }
function fbHtml(){ return state.fb ? `<div class="fb ${state.fb.type}" role="status">${state.fb.html}</div>` : ''; }
function typeClosed(id){ return tstat(id).best >= 3; }

function renderGroups(){
  const host = $('#groups');
  const chip = (id, label, extra) => `<button class="chip" data-group="${id}" aria-pressed="${state.group === id && !state.review}">${label}${extra}</button>`;
  let html = chip('all', 'Все темы', '');
  for (const g of GROUPS){
    const closed = g.ids.filter(typeClosed).length;
    html += chip(g.id, esc(g.name), ` <span class="cnt">${closed}/${g.ids.length}</span>`);
  }
  host.innerHTML = html;
}
function renderTypes(){
  const host = $('#types');
  if (state.group === 'all' && !state.review){ host.innerHTML = ''; return; }
  const g = GROUPS.find(x => x.id === state.group) || GROUPS[0];
  const ids = state.review ? [] : g.ids;
  let html = `<button class="chip" data-type="mix" aria-pressed="${state.type === 'mix' && !state.review}">Вся тема</button>`;
  for (const id of ids){
    const s = tstat(id), closed = typeClosed(id);
    const n = closed ? 3 : Math.min(3, s.streak);
    const dots = `<span class="dots" title="серия верных с первой попытки">${[0, 1, 2].map(i => `<i class="${n > i ? 'on' : ''}"></i>`).join('')}</span>`;
    html += `<button class="chip" data-type="${id}" aria-pressed="${state.type === id && !state.review}">${esc(SHORT[id])}${dots}</button>`;
  }
  host.innerHTML = state.review ? '' : html;
}
function renderHelp(){
  const mh = $('#modeHelp');
  if (state.review) mh.innerHTML = `<b>Работа над ошибками:</b> задачи только из ваших открытых типов (${openTypes().length}). Тип закрывается тремя верными подряд. ` + MODE_HELP[state.mode];
  else if (state.reviewEmpty) mh.innerHTML = '<b>Открытых ошибок нет</b> — отличная новость. Ниже обычный режим. ' + MODE_HELP[state.mode];
  else mh.textContent = MODE_HELP[state.mode];
}

function renderTrainCard(){
  const t = state.task;
  const done = state.finished;
  const inputRow = done
    ? `<p class="ansline">Ответ: <b>${YB1.num(t.ans)}</b></p>${fbHtml()}`
    : `<div class="inrow"><span class="lab">Ответ:</span><input class="num" type="text" inputmode="text" autocomplete="off" placeholder="число" aria-label="Ответ"><button class="btn primary" data-action="check">Проверить</button></div>
       <p class="fieldnote">Можно с запятой (0,5) или с точкой; отрицательное — со знаком минус.</p>${fbHtml()}`;
  const stepsBlock = (state.mode === 'learn' || state.showSteps)
    ? `<p class="ansline" style="margin-top:14px">Решение:</p>${stepsHtml(t)}${state.mode === 'learn' ? `<p class="ansline">Ответ: <b>${YB1.num(t.ans)}</b></p>` : ''}`
    : '';
  const actions = state.mode === 'learn'
    ? `<div class="actions"><button class="btn primary" data-action="new">Ещё пример</button></div>`
    : `<div class="actions">
         ${done || state.fails >= 1 ? `<button class="btn ${state.showSteps ? '' : 'warm'}" data-action="steps">${state.showSteps ? 'Скрыть разбор' : 'Показать разбор'}</button>` : ''}
         <span class="spacer"></span><button class="btn" data-action="new">Новая задача</button>
       </div>`;
  $('#taskArea').innerHTML = `<article class="card">
    ${tagHtml(t)}
    <p class="q">${t.text}</p>
    ${figHtml(t)}
    ${state.mode === 'learn' ? '' : inputRow}
    ${stepsBlock}
    ${actions}
  </article>`;
  const inp = $('#taskArea input.num'); if (inp) inp.focus();
}

/* ---------- зачёт ---------- */
function shuffle(a){ for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function startExam(){
  const plan = shuffle(TYPE_IDS.slice()).slice(0, EXAM_N);
  state.z = { plan, i: 0, marks: [], tasks: plan.map(id => YB1.make(id)), answers: [], done: false };
  state.fb = null; state.fails = 0;
  renderExam();
}
function renderExamIntro(){
  renderGroups(); renderTypes(); renderHelp();
  $('#taskArea').innerHTML = `<article class="card">
    <p class="q"><b>Зачёт:</b> ${EXAM_N} задач подряд — разные типы из всех четырёх тем, порядок случайный. Разбор и правильные ответы откроются после последней задачи. Результат записывается; зачёт сдан при ${EXAM_N} из ${EXAM_N}.</p>
    <p class="q" style="color:var(--muted)">Лучший результат: ${stats.best} из ${EXAM_N}${stats.passed ? ' · зачёт сдан ✓' : ''} · запусков: ${stats.runs}</p>
    <div class="actions"><button class="btn primary" data-action="exam-start">Начать зачёт</button></div>
  </article>`;
}
function zDots(){
  const z = state.z;
  return `<div class="zdots">${z.plan.map((_, k) => `<i class="${k === z.i && !z.done ? 'cur ' : ''}${z.marks[k] === true ? 'ok' : z.marks[k] === false ? 'bad' : ''}"></i>`).join('')}</div>`;
}
function renderExam(){
  renderGroups(); renderTypes(); renderHelp();
  const z = state.z;
  if (!z) return renderExamIntro();
  if (z.done) return renderExamResult();
  const t = z.tasks[z.i];
  $('#taskArea').innerHTML = `<article class="card">
    ${zDots()}
    ${tagHtml(t)}
    <p class="q">${t.text}</p>
    ${figHtml(t)}
    <div class="inrow"><span class="lab">Ответ:</span><input class="num" type="text" inputmode="text" autocomplete="off" placeholder="число" aria-label="Ответ"><button class="btn primary" data-action="exam-check">Ответить</button></div>
    <p class="fieldnote">В зачёте одна попытка на задачу. Можно с запятой или точкой.</p>
    ${fbHtml()}
  </article>`;
  const inp = $('#taskArea input.num'); if (inp) inp.focus();
}
function renderExamResult(){
  const z = state.z;
  const score = z.marks.filter(Boolean).length;
  const misses = z.plan.map((id, k) => ({ id, k, t: z.tasks[k], given: z.answers[k], ok: z.marks[k] })).filter(x => !x.ok);
  const missHtml = misses.length
    ? misses.map(m => `<details class="zmiss"><summary>${esc(SHORT[m.id])}: ваш ответ ${m.given === '' ? '—' : esc(m.given)}, верный ${YB1.num(m.t.ans)}</summary><p class="q" style="margin-top:10px">${m.t.text}</p>${figHtml(m.t)}${stepsHtml(m.t)}</details>`).join('')
    : `<p class="q" style="color:var(--ok);font-weight:700">Все ${EXAM_N} — верно. Это и есть зачёт.</p>`;
  $('#taskArea').innerHTML = `<article class="card">
    ${zDots()}
    <p class="zres">Результат: ${score} из ${EXAM_N}${score === EXAM_N ? ' — зачёт сдан ✓' : ''}</p>
    ${missHtml}
    <div class="actions"><button class="btn primary" data-action="exam-start">Ещё раз</button><span class="spacer"></span><button class="btn" data-action="to-train">В тренировку</button></div>
  </article>`;
}

/* ---------- проверка ---------- */
function parseNum(str){
  let s = String(str == null ? '' : str).trim().replace(/\s+/g, '').replace(',', '.').replace('\u2212', '-');
  if (!s) return NaN;
  const m = s.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
  if (m) return Number(m[1]) / Number(m[2]);
  return /^-?\d+(?:\.\d+)?$/.test(s) ? Number(s) : NaN;
}
const EPS = 1e-6;
function diagnose(x, t){
  const hit = (t.traps || []).find(tr => Math.abs(tr.v - x) < EPS);
  return hit ? hit.msg : null;
}
function checkTrain(){
  const t = state.task;
  const inp = $('#taskArea input.num');
  const x = parseNum(inp.value);
  inp.classList.remove('ok', 'bad');
  if (isNaN(x)){ inp.classList.add('bad'); state.fb = { type: 'hint', html: 'Введите число: с запятой (0,5), с точкой или обыкновенной дробью (1/2).' }; return renderTrainCard(); }
  const s = tstat(t.id);
  if (Math.abs(x - t.ans) < EPS){
    state.finished = true;
    if (!state.counted){
      state.counted = true; s.solved++;
      if (state.fails === 0){ s.correct++; s.streak++; s.best = Math.max(s.best, s.streak); }
      saveStats();
    }
    if (state.mode === 'train') mlog(t.id, true);
    state.fb = { type: 'ok', html: `${PRAISE[Math.floor(Math.random() * PRAISE.length)]}${state.fails ? ' Со второй попытки, но верно.' : ''}` };
    return render();
  }
  state.fails++;
  if (!state.counted && state.fails === 1){ s.streak = 0; saveStats(); }
  if (state.mode === 'train') mlog(t.id, false);
  inp.classList.add('bad');
  const dg = diagnose(x, t);
  let html = dg || (Math.abs(x - t.ans) < 0.01 * Math.max(1, Math.abs(t.ans))
    ? 'Почти! Похоже на округление. Ответ — конечная десятичная дробь, запишите точно.'
    : 'Пока не так. Сверьтесь с чертежом и пересчитайте.');
  if (state.fails >= 2 && !dg) html += ' Откройте разбор и пройдитесь по шагам.';
  state.fb = { type: 'bad', html };
  renderTrainCard();
}
function examCheck(){
  const z = state.z, t = z.tasks[z.i];
  const inp = $('#taskArea input.num');
  const x = parseNum(inp.value);
  if (isNaN(x)){ state.fb = { type: 'hint', html: 'Введите число — иначе ответ не засчитается.' }; return renderExam(); }
  const okAns = Math.abs(x - t.ans) < EPS;
  z.marks[z.i] = okAns; z.answers[z.i] = inp.value.trim();
  mlog(t.id, okAns);
  const s = tstat(t.id); s.solved++; if (okAns) s.correct++; else s.streak = 0;
  state.fb = null;
  z.i++;
  if (z.i >= z.plan.length){
    z.done = true;
    const score = z.marks.filter(Boolean).length;
    stats.runs++; stats.best = Math.max(stats.best, score); if (score === EXAM_N) stats.passed = true;
  }
  saveStats();
  renderExam();
}

/* ---------- каркас ---------- */
function render(){
  renderGroups(); renderTypes(); renderHelp();
  if (state.mode === 'exam') return renderExam();
  renderTrainCard();
}
function setBoard(on){
  document.documentElement.classList.toggle('board', on);
  const b = $('#boardBtn'); b.setAttribute('aria-pressed', String(on)); b.textContent = on ? 'Обычный вид' : 'Режим доски';
  stats.board = on; saveStats();
}
function init(){
  $('#groups').addEventListener('click', e => { const c = e.target.closest('[data-group]'); if (c) setGroup(c.dataset.group); });
  $('#types').addEventListener('click', e => { const c = e.target.closest('[data-type]'); if (c) setType(c.dataset.type); });
  $('#modeSeg').addEventListener('click', e => {
    const b = e.target.closest('[data-mode]'); if (!b) return;
    $$('#modeSeg [data-mode]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    setMode(b.dataset.mode);
  });
  $('#taskArea').addEventListener('click', e => {
    const btn = e.target.closest('[data-action]'); if (!btn) return;
    const act = btn.dataset.action;
    if (act === 'check') checkTrain();
    else if (act === 'new') newTask();
    else if (act === 'steps'){ state.showSteps = !state.showSteps; renderTrainCard(); }
    else if (act === 'exam-start') startExam();
    else if (act === 'exam-check') examCheck();
    else if (act === 'to-train'){ $$('#modeSeg [data-mode]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.mode === 'train'))); setMode('train'); }
  });
  $('#taskArea').addEventListener('keydown', e => {
    if (e.key !== 'Enter' || !e.target.classList.contains('num')) return;
    if (state.mode === 'exam') examCheck(); else checkTrain();
  });
  $('#boardBtn').addEventListener('click', () => setBoard(!document.documentElement.classList.contains('board')));
  if (stats.board) setBoard(true);
  if (/(^|[?&])mode=review/.test(location.search || '')){ state.review = true; state.mode = 'train'; }
  newTask();
}
if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', init);
if (typeof module !== 'undefined'){ module.exports = { parseNum, diagnose, GROUPS, TYPE_IDS }; }

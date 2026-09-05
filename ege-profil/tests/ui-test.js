const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const html = fs.readFileSync(process.argv[2] || '/home/claude/work/pt/pryamougolny-treugolnik-trenazher.html', 'utf8');

let fails = 0, checks = 0;
function ok(cond, msg){ checks++; if (!cond){ fails++; console.log('FAIL:', msg); } }

const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errors.push(String(e && e.message || e)));

function boot(url = 'https://mathexam.space/trainers/pt.html', seed){
  const dom = new JSDOM(html, { runScripts: 'dangerously', url, virtualConsole: vc, pretendToBeVisual: true, beforeParse(win){ if (seed) seed(win); } });
  const w = dom.window;
  w.requestAnimationFrame = () => 0;
  w.HTMLElement.prototype.scrollIntoView = function(){};
  w.addEventListener('error', e => errors.push('window error: ' + e.message));
  w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
  return { dom, w, d: w.document, S: () => w.eval('state'), stats: () => w.eval('stats') };
}
function click(w, el){ el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true })); }
function q(d, sel){ return d.querySelector(sel); }
function qa(d, sel){ return Array.from(d.querySelectorAll(sel)); }
function ansStr(v){
  if (Number.isInteger(v)) return String(v);
  for (let den = 2; den <= 400; den++){ const n = v * den; if (Math.abs(n - Math.round(n)) < 1e-9) return `${Math.round(n)}/${den}`; }
  return String(v).replace('.', ',');
}
function noJunk(str, where){
  ok(!/undefined|NaN|\[object/.test(str), `junk in ${where}: ${str.slice(0, 140)}`);
  ok(!/\{\{|\}\}/.test(str), `braces in ${where}: ${str.slice(0, 140)}`);
}

const TOPICS_LIST = [0, 1, 2, 3, 4, 5];

/* ---------- 1. Загрузка, режим «Учимся» на всех темах ---------- */
{
  const { w, d, S } = boot();
  ok(qa(d, '#topics .chip').length === 6, 'шесть тем');
  ok(S().topic === 0 && S().mode === 'learn', 'по умолчанию разминка, режим учимся');
  ok(q(d, '#levelWrap').style.display === 'none', 'у разминки уровень скрыт');
  for (const t of TOPICS_LIST){
    click(w, q(d, `#topics .chip[data-topic="${t}"]`));
    ok(S().topic === t && S().demoIdx === 0, `переключение на тему ${t}`);
    ok(w.location.hash === '#t' + t, `hash обновлён для темы ${t}`);
    let guard = 0;
    while (S().demoIdx < 6 && guard++ < 6){
      click(w, q(d, '[data-action="show-all"]'));
      ok(q(d, '.final.ok') != null, `тема ${t}, пример ${S().demoIdx}: ответ показан`);
      noJunk(q(d, '#taskArea').innerHTML, `learn ${t}/${S().demoIdx}`);
      ok(q(d, '.figure svg') != null, `чертёж есть для темы ${t}`);
      click(w, q(d, '[data-action="next-demo"]'));
    }
  }
  ok(errors.length === 0, 'нет JS-ошибок после режима учимся: ' + errors.join(' | '));
}

/* ---------- 2. Пошагово: верные ответы для всех тем и уровней ---------- */
function solveStepsCorrectly(w, d, S){
  const task = S().task; let guard = 0;
  while (!S().finished && guard++ < 30){
    const i = S().stepIdx, st = task.steps[i];
    const cur = q(d, '.step.current');
    if (!cur){ ok(false, `нет текущего шага ${i}`); return false; }
    if (st.kind === 'info') click(w, cur.querySelector('[data-action="info-next"]'));
    else if (st.kind === 'choice') click(w, cur.querySelector(`.opt[data-opt="${st.correct}"]`));
    else if (st.kind === 'pickSide') click(w, q(d, `.figure [data-side="${st.want}"]`));
    else if (st.kind === 'num'){ cur.querySelector('input.num').value = ansStr(st.ans); click(w, cur.querySelector('[data-action="check"]')); }
    else { st.inputs.forEach((inp, k) => { cur.querySelector(`input.num[data-k="${k}"]`).value = ansStr(inp.ans); }); click(w, cur.querySelector('[data-action="check"]')); }
    if (S().stepIdx !== i + 1){ ok(false, `шаг ${i} (${st.kind}, тема ${task.topic}) не принят: ${q(d, '.fb') ? q(d, '.fb').textContent : ''}`); return false; }
  }
  return S().finished;
}
{
  const { w, d, S, stats } = boot();
  click(w, q(d, '#modeSeg [data-mode="steps"]'));
  ok(S().mode === 'steps', 'режим пошагово');
  ok(q(d, 'details.memo').open === false, 'памятка свёрнута в пошагово');
  let solved = 0;
  for (const t of TOPICS_LIST){
    click(w, q(d, `#topics .chip[data-topic="${t}"]`));
    const levels = t === 0 ? [1] : [1, 2, 3];
    for (const L of levels){
      if (t !== 0) click(w, q(d, `#levelSeg [data-level="${L}"]`));
      for (let rep = 0; rep < 4; rep++){
        if (rep) click(w, q(d, '[data-action="new"]'));
        ok(q(d, '.step.current') != null && qa(d, '.step.done').length === 0, `новая задача ${t}/${L}: первый шаг текущий`);
        noJunk(q(d, '#taskArea').innerHTML, `steps ${t}/${L} стартовый экран`);
        const good = solveStepsCorrectly(w, d, S);
        ok(good, `тема ${t} уровень ${L} прогон ${rep}: пройдена`);
        if (good){ solved++; ok(q(d, '.final.ok') != null, 'финал показан'); noJunk(q(d, '#taskArea').innerHTML, `steps ${t}/${L} финал`); }
      }
    }
    ok(stats().topics[t].steps >= (t === 0 ? 4 : 10), `статистика пошагово для темы ${t}: ${stats().topics[t].steps}`);
  }
  console.log('пошагово решено задач:', solved);
  ok(errors.length === 0, 'нет JS-ошибок после пошагово: ' + errors.join(' | '));
}

/* ---------- 3. Ошибки, подсказки, показ ответа, ловушки ---------- */
{
  const { w, d, S } = boot();
  click(w, q(d, '#modeSeg [data-mode="steps"]'));
  click(w, q(d, '#topics .chip[data-topic="2"]'));
  const task = S().task;
  // пустой ввод
  const cur0 = q(d, '.step.current');
  if (cur0.querySelector('input.num')){
    click(w, cur0.querySelector('[data-action="check"]'));
    ok(q(d, '.fb.hint') && /Введите число/.test(q(d, '.fb').textContent), 'пустой ввод -> подсказка формата');
  }
  // неверный ответ -> подсказка автоматически, потом reveal
  let st = task.steps[S().stepIdx];
  while (st.kind !== 'num'){ // довести до num-шага верно
    const c = q(d, '.step.current');
    if (st.kind === 'info') click(w, c.querySelector('[data-action="info-next"]'));
    else if (st.kind === 'choice') click(w, c.querySelector(`.opt[data-opt="${st.correct}"]`));
    st = task.steps[S().stepIdx];
  }
  const cur = q(d, '.step.current');
  cur.querySelector('input.num').value = String(st.ans + 1000);
  click(w, cur.querySelector('[data-action="check"]'));
  ok(q(d, '.fb.bad') != null, 'неверный числовой ответ -> красная подсказка');
  ok(q(d, '.step.current [data-action="reveal"]') != null, 'после ошибки появляется «Показать ответ»');
  click(w, q(d, '.step.current [data-action="reveal"]'));
  ok(S().stepRevealed[S().stepIdx - 1] === true, '«Показать ответ» помечает шаг как раскрытый');
  // ловушка умножения на корень 3 (тема 5)
  click(w, q(d, '#topics .chip[data-topic="5"]'));
  let t5 = S().task, guard = 0;
  while (t5.p.ask !== 'CH' && guard++ < 30){ click(w, q(d, '[data-action="new"]')); t5 = S().task; }
  // дойти до шага с ответом вида N√3: предыдущие шаги закрываются верными ответами
  for (let g = 0; g < 10 && !S().task.steps[S().stepIdx].suffix; g++){
    const st = S().task.steps[S().stepIdx], c = q(d, '.step.current');
    if (st.kind === 'info') click(w, c.querySelector('[data-action="info-next"]'));
    else { c.querySelector('input.num').value = ansStr(st.ans); click(w, c.querySelector('[data-action="check"]')); }
  }
  ok(!!S().task.steps[S().stepIdx].suffix, 'тема 5: дошли до шага с ответом вида N√3');
  const wrongVal = (t5.answer.value * 1.732).toFixed(2).replace('.', ',');
  q(d, '.step.current input.num').value = wrongVal;
  click(w, q(d, '.step.current [data-action="check"]'));
  ok(q(d, '.fb.bad') && /умножили на/.test(q(d, '.fb').textContent), 'ловушка «умножили на √3»: ' + q(d, '.fb').textContent.slice(0, 80));
  // выбор неверного варианта (choice) даёт объяснение и не продвигает шаг
  click(w, q(d, '#topics .chip[data-topic="0"]'));
  let g0 = 0;
  while (S().task.p.task !== 'ratios' && g0++ < 40){ click(w, q(d, '[data-action="new"]')); }
  click(w, q(d, `.figure [data-side="${S().task.steps[0].want}"]`));      // шаг-клик пройден
  const t0 = S().task; const st0 = t0.steps[1];                            // choice: sin
  const wrongIdx = st0.options.findIndex((o, i) => i !== st0.correct);
  click(w, q(d, `.step.current .opt[data-opt="${wrongIdx}"]`));
  ok(q(d, `.step.current .opt[data-opt="${wrongIdx}"]`).classList.contains('bad') && q(d, '.fb.bad'), 'неверный вариант подсвечен и объяснён: ' + q(d, '.fb').textContent.slice(0, 80));
  ok(S().stepIdx === 1, 'выбор не продвинул шаг');
  click(w, q(d, `.step.current .opt[data-opt="${st0.correct}"]`));
  ok(S().stepIdx === 2, 'верный вариант продвигает шаг');
  ok(errors.length === 0, 'нет JS-ошибок после раздела 3: ' + errors.join(' | '));
}

/* ---------- 4. Режим «Сам» ---------- */
{
  const { w, d, S, stats } = boot();
  click(w, q(d, '#modeSeg [data-mode="solo"]'));
  ok(S().mode === 'solo' && q(d, 'ol.ladder') == null, 'в режиме сам лесенка скрыта');
  for (const t of TOPICS_LIST){
    click(w, q(d, `#topics .chip[data-topic="${t}"]`));
    const levels = t === 0 ? [1] : [1, 2, 3];
    for (const L of levels){
      if (t !== 0) click(w, q(d, `#levelSeg [data-level="${L}"]`));
      for (let rep = 0; rep < 2; rep++){
        if (rep) click(w, q(d, '[data-action="new"]'));
        const a = S().task.answer;
        noJunk(q(d, '#taskArea').innerHTML, `solo ${t}/${L}`);
        if (a.kind === 'num'){ q(d, 'input[data-final="0"]').value = ansStr(a.value); click(w, q(d, '[data-action="final-check"]')); }
        else if (a.kind === 'side'){ click(w, q(d, `.figure [data-side="${a.want}"]`)); }
        else { click(w, q(d, `.opt[data-action="final-opt"][data-opt="${a.correct}"]`)); }
        ok(S().finished && q(d, '.final.ok') != null, `сам: тема ${t} уровень ${L} верный ответ принят`);
        if (rep === 0){ click(w, q(d, '[data-action="toggle-solution"]')); ok(qa(d, '.step.done').length === S().task.steps.length, 'решение по шагам раскрыто целиком'); noJunk(q(d, '#taskArea').innerHTML, `solo solution ${t}/${L}`); }
      }
    }
  }
  // неверные ответы, серия, сдаться
  click(w, q(d, '#topics .chip[data-topic="1"]'));
  click(w, q(d, '#levelSeg [data-level="1"]'));
  const streakBefore = stats().topics[1].streak;
  q(d, 'input[data-final="0"]').value = '999999'; click(w, q(d, '[data-action="final-check"]'));
  ok(q(d, '.fb.bad') != null, 'неверный ответ -> подсказка');
  ok(stats().topics[1].streak === 0 && streakBefore >= 0, 'серия сброшена/остаётся 0 после ошибки');
  ok(q(d, '[data-action="give-up"]') == null, 'после первой ошибки «показать решение» ещё нет');
  q(d, 'input[data-final="0"]').value = '888888'; click(w, q(d, '[data-action="final-check"]'));
  ok(q(d, '[data-action="give-up"]') != null, 'после второй ошибки появляется «показать решение»');
  const solvedBefore = stats().topics[1].solved;
  click(w, q(d, '[data-action="give-up"]'));
  ok(S().finished && S().soloRevealed && qa(d, '.step.done').length === S().task.steps.length, 'сдаться: решение раскрыто');
  ok(stats().topics[1].solved === solvedBefore + 1, 'сдача учтена как решённая');
  // localStorage
  const saved = JSON.parse(w.localStorage.getItem('mathExamCourseProgress.v1'))['righttri-t1'];
  ok(saved && saved.topics && saved.topics['1'].solved > 0, 'статистика сохраняется в localStorage');
  ok(errors.length === 0, 'нет JS-ошибок после режима сам: ' + errors.join(' | '));
}

/* ---------- 5. Режим доски, hash, клавиатура ---------- */
{
  const { w, d, S } = boot('https://mathexam.space/trainers/pt.html#t3');
  ok(S().topic === 3, 'hash #t3 открывает тему 3');
  click(w, q(d, '#boardBtn'));
  ok(d.documentElement.classList.contains('board') && /Обычный вид/.test(q(d, '#boardBtn').textContent), 'режим доски включается');
  ok(JSON.parse(w.localStorage.getItem('mathExamCourseProgress.v1'))['righttri-t1'].board === true, 'режим доски сохранён в ключе курса');
  click(w, q(d, '#boardBtn'));
  ok(!d.documentElement.classList.contains('board'), 'режим доски выключается');
  // стрелки для листания в режиме учимся
  click(w, q(d, '#topics .chip[data-topic="0"]'));
  const before = S().revealed;
  d.body.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
  ok(S().revealed === before + 1, 'стрелка вправо раскрывает следующий шаг');
  d.body.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }));
  ok(S().revealed === before, 'стрелка влево сворачивает шаг обратно');
  ok(errors.length === 0, 'нет JS-ошибок после режима доски: ' + errors.join(' | '));
}

/* ---------- 6. Буквенные схемы и коллизии ---------- */
{
  const { w } = boot();
  const pickScheme = w.eval('pickScheme'), rng = w.eval('mulberry32')(1);
  let bad = 0;
  for (let i = 0; i < 2000; i++){
    const S = pickScheme(rng);
    const letters = [S.A, S.B, S.C, S.H, S.D, S.Med];
    if (new Set(letters).size !== letters.length) bad++;
  }
  ok(bad === 0, `буквы схемы всегда различны: коллизий ${bad}`);
}

/* ---------- 8. Диагностика ловушек и журнал ошибок («Сам») ---------- */
{
  const { w, d } = boot();
  w.eval(`state.mode='solo'; state.review=false;`);
  w.eval(`(function(){ const r = mulberry32(7); let t; do { t = makeTask(3, 1, r); } while (t.type !== 't3-legHyp'); resetStepState(); state.task = t; })()`);
  w.eval('render()');
  const tsk = w.eval('state.task');
  const inp = q(d, 'input.num[data-final]');
  ok(!!inp, 'сам: есть поле ответа');
  inp.value = ansStr(tsk.answer.value * 2);                    // классика: забыли «: 2»
  click(w, q(d, '[data-action="final-check"]'));
  const fb1 = q(d, '.final .fbwrap').textContent;
  ok(/разделить на 2|ПОЛОВИНЕ/i.test(fb1), `диагноз «забыли :2» показан: ${fb1.slice(0, 90)}`);
  let mk = JSON.parse(w.localStorage.getItem('mathExamCourseProgress.v1')).mistakes || {};
  ok(mk['righttri-t1|t3-legHyp'] && mk['righttri-t1|t3-legHyp'].w === 1 && mk['righttri-t1|t3-legHyp'].r === 0, 'журнал: промах записан (w=1, r=0)');
  inp.value = ansStr(tsk.answer.value);
  click(w, q(d, '[data-action="final-check"]'));
  mk = JSON.parse(w.localStorage.getItem('mathExamCourseProgress.v1')).mistakes;
  ok(mk['righttri-t1|t3-legHyp'].w === 1 && mk['righttri-t1|t3-legHyp'].r === 1, 'журнал: верный после промаха (r=1)');
  const all = JSON.parse(w.localStorage.getItem('mathExamCourseProgress.v1'));
  ok(all['righttri-t1'] && all['righttri-t1'].topics && all['righttri-t1'].topics['3'], 'прогресс темы лёг под TID в ключе курса');
}

/* ---------- 9. Миграция прогресса из pt-trainer-v1 ---------- */
{
  const legacy = { topics: { '2': { steps: 3, solved: 5, correct: 4, streak: 2, best: 3 } }, board: false };
  const { w } = boot(undefined, win => win.localStorage.setItem('pt-trainer-v1', JSON.stringify(legacy)));
  ok(w.eval(`stats.topics['2'] && stats.topics['2'].solved`) === 5, 'миграция: старый прогресс подхвачен');
  const all = JSON.parse(w.localStorage.getItem('mathExamCourseProgress.v1'));
  ok(all['righttri-t1'] && all['righttri-t1'].topics['2'].correct === 4, 'миграция: прогресс сохранён под TID');
  ok(w.localStorage.getItem('pt-trainer-v1') != null, 'миграция: старый ключ не тронут (откат возможен)');
}

/* ---------- 10. Режим разбора ?mode=review ---------- */
{
  const seed = win => win.localStorage.setItem('mathExamCourseProgress.v1', JSON.stringify({
    mistakes: { 'righttri-t1|t5-seg30': { w: 2, r: 0, lastWrong: 1, last: 1 } }
  }));
  const { w, d } = boot('https://mathexam.space/trainers/pt.html?mode=review', seed);
  ok(w.eval('state.review') === true && w.eval('state.mode') === 'solo', 'review: включён режим «Сам»');
  ok(w.eval('state.task.type') === 't5-seg30', 'review: задача пришла из открытого типа');
  ok(/Работа над ошибками/.test(q(d, '#modeHelp').textContent), 'review: баннер показан');
  click(w, q(d, '#topics .chip[data-topic="1"]'));
  ok(w.eval('state.review') === false, 'review: смена темы выключает разбор');
}
{
  const { w, d } = boot('https://mathexam.space/trainers/pt.html?mode=review');   // журнал пуст
  ok(w.eval('state.review') === false && w.eval('state.reviewEmpty') === true, 'review: пустой журнал → обычный режим');
  ok(/Открытых ошибок нет/.test(q(d, '#modeHelp').textContent), 'review: сообщение о пустом журнале');
}

/* ---------- 11. Ссылка «← Курс» и канал ловушек на шаге ---------- */
{
  const { w, d } = boot();
  const a = q(d, 'a.crumbs');
  ok(!!a && /\.\.\/index\.html$/.test(a.getAttribute('href')), 'шапка: ссылка «← Курс» ведёт на ../index.html');
  w.eval(`state.mode='steps'; state.review=false;`);
  w.eval(`(function(){ resetStepState(); state.task = makeTask(1, 1, mulberry32(3));
    state.task.steps.unshift(num('Проба', 'Сколько будет 2 · 2?', 4, { traps: [{ value: 5, msg: 'Это классическая ловушка про пятёрку — проверьте таблицу умножения.' }] })); })()`);
  w.eval('render()');
  const inp = q(d, 'input.num[data-step="0"]');
  inp.value = '5';
  click(w, q(d, '[data-action="check"]'));
  ok(/ловушка про пятёрку/.test(q(d, '.step .fb, .fb') ? d.body.textContent : ''), 'шаг: сообщение из st.traps показано');
}

/* ---------- 12. Разминка: клики по сторонам (пошагово) ---------- */
{
  const { w, d } = boot();
  w.eval(`state.mode='steps'; state.review=false; state.topic=0;`);
  w.eval(`(function(){ const r = mulberry32(21); let t; do { t = makeTask(0, 1, r); } while (t.p.task !== 'sides'); resetStepState(); state.task = t; })()`);
  w.eval('render()');
  const hits = qa(d, '.figure [data-side]');
  ok(hits.length === 3 && new Set(hits.map(h => h.dataset.side)).size === 3, 'чертёж: три кликабельные стороны');
  ok(!!q(d, '.figure.picking'), 'пошагово: чертёж в режиме выбора (picking)');
  const st0 = w.eval('state.task.steps[0]');                     // шаг «гипотенуза», want='AB'
  const wrongKey = st0.want === 'AB' ? 'AC' : 'AB';
  click(w, q(d, `.figure [data-side="${wrongKey}"]`));
  const fb = d.body.textContent;
  ok(/катет: он образует прямой угол/.test(fb), 'клик мимо: адресное объяснение показано');
  ok((w.eval('state.stepFails[0]') || 0) >= 1, 'клик мимо: промах шага засчитан');
  click(w, q(d, `.figure [data-side="${st0.want}"]`));
  ok(w.eval('state.stepIdx') === 1, 'верный клик: шаг закрыт');
  ok(w.eval('state.picked.includes("AB")') === true, 'верный клик: сторона запомнена для подсветки');
  ok(/stroke:#0f766e/.test(q(d, '.figure').innerHTML), 'верный клик: сторона подсвечена на чертеже');
  // добить оставшиеся два шага верными кликами
  for (let s = 1; s <= 2; s++){
    const want = w.eval(`state.task.steps[${s}].want`);
    click(w, q(d, `.figure [data-side="${want}"]`));
  }
  ok(w.eval('state.finished') === true, 'все клики: задача завершена');
  ok(!q(d, '.figure.picking'), 'после финиша режим выбора снят');
}

/* ---------- 13. Разминка: side-финал в «Сам» + серия ---------- */
{
  const { w, d } = boot();
  w.eval(`state.mode='solo'; state.review=false; state.topic=0;`);
  w.eval(`(function(){ const r = mulberry32(33); let t; do { t = makeTask(0, 2, r); } while (t.answer.kind !== 'side'); resetStepState(); state.task = t; })()`);
  w.eval('render()');
  ok(/клик по стороне на чертеже/.test(d.body.textContent), 'сам: инструкция side-финала показана');
  const want = w.eval('state.task.answer.want');
  const wrong = ['AC', 'BC', 'AB'].find(k => k !== want && w.eval(`!!state.task.answer.why['${k}']`));
  click(w, q(d, `.figure [data-side="${wrong}"]`));
  ok(w.eval('state.soloFails') === 1 && /угла|гипотенуза|катет/i.test(q(d, '.final .fbwrap').textContent), 'сам: неверный клик — промах с объяснением');
  click(w, q(d, `.figure [data-side="${want}"]`));
  ok(w.eval('state.finished') === true, 'сам: верный клик решает задачу');
  ok(w.eval("stats.topics[0].solved") >= 1, 'сам: решение темы 0 учтено в статистике');
  const mk = JSON.parse(w.localStorage.getItem('mathExamCourseProgress.v1')).mistakes || {};
  ok(!Object.keys(mk).some(k => /\|null$/.test(k) || /\|undefined$/.test(k)), 'разминка не пишет мусор в журнал ошибок');
}

/* ---------- 14. Разминка в «Учимся»: раскрытие с подсветкой ---------- */
{
  const { w, d } = boot();
  click(w, q(d, '#topics .chip[data-topic="0"]'));               // learn, демо sides
  w.eval('learnAll()');
  ok(/сторона [А-ЯA-Z]{2}/.test(d.body.textContent), 'учимся: ответ шага называет сторону буквами');
  ok(/stroke:#0f766e/.test(q(d, '.figure').innerHTML), 'учимся: раскрытые pickSide-шаги подсвечены на чертеже');
  ok(!q(d, '.figure.picking'), 'учимся: чертёж не в режиме выбора');
}


/* ---------- 15. Доска, зеркало и полный экран через URL ---------- */
const PT_URL = 'https://mathexam.space/trainers/pryamougolny-treugolnik-trenazher.html';
function cls(w){ return w.document.documentElement.classList; }
const reviewSeed = win => win.localStorage.setItem('mathExamCourseProgress.v1', JSON.stringify({
  mistakes: { 'righttri-t1|t5-seg30': { w: 2, r: 0, lastWrong: 1, last: 1 } }
}));
{
  const { w, d } = boot(PT_URL);
  ok(!cls(w).contains('board') && !cls(w).contains('mirror'), 'без параметров ни доски, ни зеркала');
  ok(!!q(d, '#mirrorBtn'), 'кнопка «Зеркало» есть');
  click(w, q(d, '#mirrorBtn'));
  ok(cls(w).contains('mirror'), 'кнопка включает зеркало');
  ok(q(d, '#mirrorBtn').getAttribute('aria-pressed') === 'true', 'aria-pressed у зеркала');
  ok(/Убрать зеркало/.test(q(d, '#mirrorBtn').textContent), 'подпись кнопки меняется');
  ok(!/mirror/.test(w.localStorage.getItem('mathExamCourseProgress.v1') || ''), 'зеркало не попадает в хранилище');
  click(w, q(d, '#mirrorBtn'));
  ok(!cls(w).contains('mirror'), 'повторный клик выключает зеркало');
}
{
  const { w } = boot(PT_URL + '?board=1');
  ok(cls(w).contains('board') && !cls(w).contains('mirror'), '?board=1 включает только доску');
}
{
  const { w, d } = boot(PT_URL + '?mirror=1');
  ok(cls(w).contains('mirror') && !cls(w).contains('board'), '?mirror=1 включает только зеркало');
  ok(/Убрать зеркало/.test(q(d, '#mirrorBtn').textContent), '?mirror=1: подпись кнопки согласована');
}
{
  const { w, d } = boot(PT_URL + '?board=1&mirror=1&mode=review', reviewSeed);
  ok(cls(w).contains('board') && cls(w).contains('mirror'), 'доска и зеркало сочетаются');
  ok(w.eval('state.review') === true && w.eval('state.mode') === 'solo', 'сочетание не мешает ?mode=review');
  ok(/Работа над ошибками/.test(q(d, '#modeHelp').textContent), 'review-баннер на месте под доской и зеркалом');
  ok(w.eval('state.task.type') === 't5-seg30', 'задача всё так же пришла из открытого типа');
}
{
  const { w, d } = boot(PT_URL + '?board=1');
  ok(!q(d, '#fsBtn'), 'без Fullscreen API кнопка «Во весь экран» убрана');
  ok(!!q(d, '#boardBtn') && !!q(d, '#mirrorBtn'), 'остальные кнопки шапки на месте');
}
{
  const seed = win => { win.HTMLElement.prototype.requestFullscreen = function(){ win.__fs = true; return Promise.resolve(); }; };
  const { w, d } = boot(PT_URL + '?board=1', seed);
  const btn = q(d, '#fsBtn');
  ok(!!btn, 'с Fullscreen API кнопка остаётся');
  click(w, btn);
  ok(w.__fs === true, 'кнопка зовёт requestFullscreen');
}

/* ---------- 16. Зеркало: клики по сторонам чертежа ---------- */
{
  const { w, d } = boot(PT_URL + '?mirror=1');
  ok(cls(w).contains('mirror'), 'зеркало включено параметром');
  w.eval(`state.mode='steps'; state.review=false; state.topic=0;`);
  w.eval(`(function(){ const r = mulberry32(21); let t; do { t = makeTask(0, 1, r); } while (t.p.task !== 'sides'); resetStepState(); state.task = t; })()`);
  w.eval('render()');
  const hits = qa(d, '.figure [data-side]');
  ok(hits.length === 3 && new Set(hits.map(h => h.dataset.side)).size === 3, 'под зеркалом три кликабельные стороны');
  ok(!!q(d, '.figure.picking'), 'под зеркалом чертёж в режиме выбора');
  const st0 = w.eval('state.task.steps[0]');
  const wrongKey = st0.want === 'AB' ? 'AC' : 'AB';
  click(w, q(d, `.figure [data-side="${wrongKey}"]`));
  ok(/катет: он образует прямой угол/.test(d.body.textContent), 'под зеркалом промах даёт то же адресное объяснение');
  ok((w.eval('state.stepFails[0]') || 0) >= 1, 'под зеркалом промах шага засчитан');
  click(w, q(d, `.figure [data-side="${st0.want}"]`));
  ok(w.eval('state.stepIdx') === 1, 'под зеркалом верный клик по стороне засчитан');
  ok(w.eval('state.picked.includes(' + JSON.stringify(st0.want) + ')') === true, 'под зеркалом сторона запомнена для подсветки');
  ok(/stroke:#0f766e/.test(q(d, '.figure').innerHTML), 'под зеркалом сторона подсвечена на чертеже');
  for (let s = 1; s <= 2; s++){
    const want = w.eval(`state.task.steps[${s}].want`);
    click(w, q(d, `.figure [data-side="${want}"]`));
  }
  ok(w.eval('state.finished') === true, 'под зеркалом задача добита кликами по сторонам');
  ok(cls(w).contains('mirror'), 'зеркало не слетело от кликов по чертежу');
}

console.log(`\nПроверок: ${checks}, отказов: ${fails}, JS-ошибок: ${errors.length}`);
if (errors.length) console.log(errors.slice(0, 5).join('\n'));
process.exit(fails || errors.length ? 1 : 0);

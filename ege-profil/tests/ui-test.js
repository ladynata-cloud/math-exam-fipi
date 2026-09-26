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
  if (!(seed && seed.keepOnboarding)) w.eval("if (state.onboarding) exitOnboarding(true);");
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
  ok(S().topic === 0 && S().mode === 'steps', 'после онбординга разминка, рабочий режим «Пошагово»');
  click(w, q(d, '#modeSeg [data-mode="learn"]'));
  ok(S().mode === 'learn', 'режим «Учимся» включается');
  ok(q(d, '#levelWrap').style.display === 'none', 'у разминки уровень скрыт');
  ok(q(d, '[data-action="show-all"]') == null, '«Показать всё» без режима доски не показывается');
  click(w, q(d, '#boardBtn'));                                        // «Показать всё» — только у доски
  ok(q(d, '[data-action="show-all"]') != null, '«Показать всё» есть в режиме доски');
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
    else if (st.kind === 'num'){ cur.querySelector('input.num').value = ansStr(st.ans) + (st.suffix ? '√3' : ''); click(w, cur.querySelector('[data-action="check"]')); }   // ответ вида N√3 пишется с корнем
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
  click(w, q(d, '#levelSeg [data-level="2"]'));                   // высота с ответом N√3 — со второго уровня
  let t5 = S().task, guard = 0;
  while (t5.p.ask !== 'CH' && guard++ < 30){ click(w, q(d, '[data-action="new"]')); t5 = S().task; }
  // дойти до шага с ответом вида N√3: предыдущие шаги закрываются верными ответами
  for (let g = 0; g < 10 && !S().task.steps[S().stepIdx].suffix; g++){
    const st = S().task.steps[S().stepIdx], c = q(d, '.step.current');
    if (st.kind === 'info') click(w, c.querySelector('[data-action="info-next"]'));
    else if (st.kind === 'choice') click(w, c.querySelector('.opt[data-opt="' + st.correct + '"]'));
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
        if (a.kind === 'num'){ q(d, 'input[data-final="0"]').value = ansStr(a.value) + (a.suffix ? '√3' : ''); click(w, q(d, '[data-action="final-check"]')); }
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
  ok(S().finished && S().soloRevealed && qa(d, '.step.done').length === 0 && q(d, '[data-action="next"]') != null, 'сдаться: решение открывается по шагам, а не целиком');
  let gg = 0; while (q(d, '[data-action="next"]') && gg++ < 20) click(w, q(d, '[data-action="next"]'));
  ok(qa(d, '.step.done').length === S().task.steps.length && q(d, '.final .answer-line') != null, 'сдаться: после всех шагов показан ответ');
  ok(stats().topics[1].solved === solvedBefore, 'сдача не считается решённой самостоятельно');
  // localStorage
  const saved = JSON.parse(w.localStorage.getItem('mathExamCourseProgress.v1'))['righttri-t1'];
  ok(saved && saved.topics && saved.topics['1'].solved > 0, 'статистика сохраняется в localStorage');
  ok(errors.length === 0, 'нет JS-ошибок после режима сам: ' + errors.join(' | '));
}

/* ---------- 4а. «С чего начать?» ничего не отнимает: серия и «верно с первого раза» растут ---------- */
{
  const { w, d, S, stats } = boot();
  click(w, q(d, '#modeSeg [data-mode="solo"]'));
  click(w, q(d, '#topics .chip[data-topic="1"]'));
  click(w, q(d, '#levelSeg [data-level="1"]'));
  ok(/ничего не отнимает/.test(q(d, '#modeHelp').textContent), 'сам: справка режима говорит, что «С чего начать?» ничего не отнимает');
  const t1 = () => stats().topics[1];
  const solveSolo = () => { const a = S().task.answer; if (a.kind === 'num'){ q(d, 'input[data-final="0"]').value = ansStr(a.value) + (a.suffix ? '√3' : ''); click(w, q(d, '[data-action="final-check"]')); } else click(w, q(d, `.opt[data-action="final-opt"][data-opt="${a.correct}"]`)); };
  const failSolo = () => { const a = S().task.answer; if (a.kind === 'num'){ q(d, 'input[data-final="0"]').value = '999999'; click(w, q(d, '[data-action="final-check"]')); } else click(w, q(d, `.opt[data-action="final-opt"][data-opt="${a.options.findIndex((o, i) => i !== a.correct)}"]`)); };
  // разгон серии без подсказки
  solveSolo(); click(w, q(d, '[data-action="new"]')); solveSolo(); click(w, q(d, '[data-action="new"]'));
  const before = Object.assign({}, t1());
  ok(before.streak === 2 && before.correct === 2 && before.solved === 2 && before.hinted === 0, `разгон: серия ${before.streak}, верно с первого раза ${before.correct}, с подсказкой ${before.hinted}`);
  const row = q(d, '.starthint-row');
  ok(!!row && !!row.querySelector('[data-action="start-hint"]') && /ничего не отнимает/.test(row.textContent), 'рядом с кнопкой «С чего начать?» сказано, что подсказка ничего не отнимает');
  click(w, q(d, '[data-action="start-hint"]'));
  ok(S().soloHinted === true && q(d, '.starthint') != null && /С чего начать:/.test(q(d, '.starthint').textContent), 'кнопка раскрывает подсказку первого шага');
  ok(q(d, '[data-action="start-hint"]') == null && /ничего не отнимает/.test(q(d, '.starthint').textContent), 'в раскрытой подсказке кнопки больше нет, а фраза сохраняется');
  ok(/задача того же типа/.test(q(d, '.starthint').textContent) && !/та же задача/.test(q(d, '.starthint').textContent), 'подсказка честно говорит: в «Пошагово» будет задача того же типа, а не эта же');
  ok(/\.starthint-row \.fieldnote, \.starthint \.fieldnote\{color:var\(--ink-soft\)\}/.test(html), 'фраза «ничего не отнимает» набрана цветом --ink-soft (контраст 6:1), а не --ink-faint (3:1)');
  const printSel = (html.match(/@media print\{\s*([^{]*)\{display:none/) || [])[1] || '';
  ok(/\.starthint-row/.test(printSel) && /\.starthint(?![-\w])/.test(printSel), 'при печати кнопка «С чего начать?» и раскрытая подсказка скрыты: ' + printSel.trim().slice(0, 160));
  ok(t1().solved === before.solved && t1().hinted === 0 && t1().streak === before.streak, 'нажатие само по себе ничего не меняет в статистике');
  solveSolo();
  ok(S().finished && q(d, '.final.ok') != null, 'после подсказки верный ответ принят');
  ok(t1().solved === before.solved + 1, 'решено сам: +1');
  ok(t1().correct === before.correct + 1, `верно с первого раза растёт после подсказки: ${before.correct} → ${t1().correct}`);
  ok(t1().streak === before.streak + 1 && t1().best === before.streak + 1, `серия растёт после подсказки: ${before.streak} → ${t1().streak}`);
  ok(t1().hinted === 1, 'обращение к подсказке посчитано отдельно (hinted = 1)');
  ok(/серия: 3/.test(q(d, '.stats').textContent) && /верно с первого раза: 3/.test(q(d, '.stats').textContent), 'ученик видит серию 3 и «верно с первого раза: 3»');
  const saved = JSON.parse(w.localStorage.getItem('mathExamCourseProgress.v1'))['righttri-t1'].topics['1'];
  ok(saved.streak === 3 && saved.correct === 3 && saved.solved === 3 && saved.best === 3 && saved.hinted === 1, 'запись righttri-t1: streak/correct выросли, hinted добавлен');
  ok(['steps', 'solved', 'correct', 'streak', 'best', 'hinted'].every(k => typeof saved[k] === 'number'), 'запись righttri-t1: все поля числовые');
  // ошибка, потом подсказка, потом верно: серию рвёт ошибка, а не подсказка
  click(w, q(d, '[data-action="new"]'));
  failSolo();
  ok(t1().streak === 0, 'ошибка обнуляет серию');
  click(w, q(d, '[data-action="start-hint"]'));
  solveSolo();
  ok(S().finished && t1().solved === 4 && t1().correct === 3 && t1().streak === 0 && t1().hinted === 2, `ошибка + подсказка + верно: решено 4, верно с первого раза 3, серия 0, с подсказкой 2 (${JSON.stringify(t1())})`);
  // подсказка не тянется на следующую задачу
  click(w, q(d, '[data-action="new"]'));
  ok(S().soloHinted === false && q(d, '[data-action="start-hint"]') != null, 'новая задача: подсказка снова свёрнута');
  solveSolo();
  ok(t1().solved === 5 && t1().correct === 4 && t1().streak === 1 && t1().hinted === 2, 'без подсказки: hinted не растёт, серия начинается заново');
  // сводка учителю показывает подсказки отдельно
  click(w, q(d, '#teacherBtn'));
  const rowText = qa(d, '#tpSummary .tp-row').map(r => r.textContent).find(t => /Тема 1\./.test(t)) || '';
  ok(/решено самостоятельно: 5/.test(rowText) && /С чего начать\?»: 2/.test(rowText) && /верно с первого раза: 4/.test(rowText), 'сводка учителю: решено 5, после «С чего начать?» 2, верно с первого раза 4: ' + rowText.slice(0, 120));
  ok(errors.length === 0, 'нет JS-ошибок в разделе 4а: ' + errors.join(' | '));
}

/* ---------- 4б. Восстановление записи: hinted читается, мусор отбрасывается ---------- */
{
  const seed = win => win.localStorage.setItem('mathExamCourseProgress.v1', JSON.stringify({
    'righttri-t1': { topics: { '2': { steps: 1, solved: 4, correct: 2, streak: 1, best: 2, hinted: 3 }, '3': { steps: 0, solved: 1, correct: 1, streak: 1, best: 1, hinted: 'abc' }, '4': { solved: 2, correct: 2, streak: 2, best: 2 } } }
  }));
  const { w } = boot(undefined, seed);
  ok(w.eval(`stats.topics['2'].hinted`) === 3, 'hinted читается из записи');
  ok(w.eval(`stats.topics['3'].hinted`) === 0, 'hinted-мусор отбрасывается в 0');
  ok(w.eval(`stats.topics['4'].hinted`) === 0 && w.eval(`stats.topics['4'].correct`) === 2, 'старая запись без hinted читается как раньше, hinted = 0');
}

/* ---------- 4в. «С чего начать?» у задачи с info-шагом первым показывает текст шага, а не только заголовок ---------- */
{
  const { w, d, S } = boot();
  click(w, q(d, '#modeSeg [data-mode="solo"]'));
  let found = false;
  for (const [t, L] of [[3, 1], [3, 2], [3, 3], [4, 3], [4, 2], [4, 1]]){
    click(w, q(d, `#topics .chip[data-topic="${t}"]`)); click(w, q(d, `#levelSeg [data-level="${L}"]`));
    for (let i = 0; i < 40 && !found; i++){ const f = S().task.steps[0]; if (f.kind === 'info' && !f.hint) found = true; else click(w, q(d, '[data-action="new"]')); }
    if (found) break;
  }
  ok(found, 'нашлась задача, у которой первый шаг — info без hint (t3-diff / t4-findAcute)');
  if (found){
    const first = S().task.steps[0];
    click(w, q(d, '[data-action="start-hint"]'));
    const more = q(d, '.starthint .starthint-more');
    const tmp = d.createElement('div'); tmp.innerHTML = w.eval('M(state.task.steps[0].text)');
    ok(!!more && more.textContent === tmp.textContent, `«С чего начать?» показывает текст info-шага (${S().task.type}): ${more ? more.textContent.slice(0, 80) : '—'}`);
    noJunk(q(d, '.starthint').innerHTML, 'раскрытая подсказка info-шага');
    const ans = S().task.answer;
    ok(!(ans.kind === 'num' && new RegExp('(^|[^\\d,.])' + String(ans.value).replace('.', '[.,]') + '(?![\\d,.])').test(first.text)), 'текст info-шага не содержит итоговый ответ');
  }
  ok(errors.length === 0, 'нет JS-ошибок в разделе 4в: ' + errors.join(' | '));
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
  click(w, q(d, '#modeSeg [data-mode="learn"]'));
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
/* ---------- 9а. ?selftest=1 не трогает localStorage ученика ---------- */
{
  const legacy = { topics: { '2': { steps: 3, solved: 5, correct: 4, streak: 2, best: 3 } }, board: false };
  const logs = [], errs = [];
  const onLog = m => logs.push(String(m)), onErr = m => errs.push(String(m));
  vc.on('log', onLog); vc.on('error', onErr);
  const seed = Object.assign(win => win.localStorage.setItem('pt-trainer-v1', JSON.stringify(legacy)), { keepOnboarding: true });
  const { w } = boot('https://mathexam.space/trainers/pt.html?selftest=1', seed);
  vc.off('log', onLog); vc.off('error', onErr);
  ok(logs.some(m => /RIGHTTRI_SELFTEST_OK/.test(m)), 'selftest: маркер RIGHTTRI_SELFTEST_OK напечатан');
  ok(!errs.some(m => /RIGHTTRI_SELFTEST_FAIL/.test(m)), 'selftest: дефектов нет: ' + errs.filter(m => /SELFTEST/.test(m)).join(' | ').slice(0, 300));
  ok(w.localStorage.getItem('mathExamCourseProgress.v1') == null, 'selftest: ключ курса не создан — миграция pt-trainer-v1 не записана');
  ok(w.localStorage.getItem('pt-trainer-v1') === JSON.stringify(legacy), 'selftest: старый ключ побайтно цел');
  ok(w.eval(`stats.topics['2'] && stats.topics['2'].solved`) === 5, 'selftest: старый прогресс виден в памяти, страница не «свежая»');
  ok(w.localStorage.length === 1, 'selftest: в хранилище остался ровно один ключ — старый');
}
{
  const seed = Object.assign(function(){}, { keepOnboarding: true });
  const { w } = boot('https://mathexam.space/trainers/pt.html?selftest=1', seed);
  ok(w.localStorage.length === 0, 'selftest на пустом хранилище: ничего не записано');
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
  const hits = qa(d, '.figure.picking [data-side]');                 // кликабельный чертёж один: в «Пошагово» — внутри шага
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
  click(w, q(d, '#topics .chip[data-topic="0"]'));
  click(w, q(d, '#modeSeg [data-mode="learn"]'));                // демо sides в «Учимся»
  w.eval('learnAll()');
  ok(/сторона [А-ЯA-Z]{2}/.test(d.body.textContent), 'учимся: ответ шага называет сторону буквами');
  ok(/stroke:#0f766e/.test(q(d, '.figure').innerHTML), 'учимся: раскрытые pickSide-шаги подсвечены на чертеже');
  ok(!q(d, '.figure.picking'), 'учимся: чертёж не в режиме выбора');
}


/* ---------- 15. Доска, зеркало и полный экран через URL ---------- */
const PT_URL = 'https://mathexam.space/trainers/pryamougolny-treugolnik-trenazher.html';
function cls(w){ return w.document.documentElement.classList; }
function getVisible(w, d, sel){ const el = d.querySelector(sel); if (!el) return false; return w.getComputedStyle(el).display !== "none"; }
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
  const hits = qa(d, '.figure.picking [data-side]');                 // кликабельный чертёж один: в «Пошагово» — внутри шага
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

/* ---------- 16. Онбординг: первый заход — сразу пошаговый разбор ---------- */
{
  const { w, d, S } = boot('https://mathexam.space/trainers/pt.html', Object.assign(function(){}, { keepOnboarding: true }));
  ok(S().onboarding === true && S().mode === 'steps' && S().topic === 0, 'первый заход: онбординг, режим Пошагово, разминка');
  ok(cls(w).contains('onboarding'), 'html помечен классом onboarding');
  ok(q(d, '#onboardBanner') && q(d, '#onboardBanner').hidden === false, 'баннер онбординга виден');
  ok(getVisible(w, d, '.controls') === false, 'переключатель режимов скрыт в онбординге');
  ok(getVisible(w, d, '.topbtns') === false, 'кнопки шапки скрыты в онбординге');
  const okFin = solveStepsCorrectly(w, d, S);
  ok(okFin, 'онбординг: первый разбор пройден по шагам');
  ok(S().onboarding === false && !cls(w).contains('onboarding'), 'после первого разбора онбординг снят');
  ok(JSON.parse(w.localStorage.getItem('mathExamCourseProgress.v1'))['righttri-t1'].onboarded === true, 'флаг onboarded сохранён');
  ok(getVisible(w, d, '.topbtns') === true, 'после онбординга кнопки шапки показаны');
  ok(errors.length === 0, 'нет JS-ошибок в онбординге: ' + errors.join(' | '));
}
/* ---------- 17. «Показать всё сразу» выходит из онбординга без решения ---------- */
{
  const { w, d, S } = boot('https://mathexam.space/trainers/pt.html', Object.assign(function(){}, { keepOnboarding: true }));
  ok(S().onboarding === true, 'онбординг активен');
  click(w, q(d, '#onboardBanner [data-onboard-skip]'));
  ok(S().onboarding === false && JSON.parse(w.localStorage.getItem('mathExamCourseProgress.v1'))['righttri-t1'].onboarded === true, 'показать всё снимает онбординг и запоминает это');
}
/* ---------- 18. Панель «Сдать учителю»: имя, сводка, код ---------- */
{
  const { w, d, S } = boot();
  click(w, q(d, '#topics .chip[data-topic="1"]'));
  click(w, q(d, '#modeSeg [data-mode="solo"]'));
  const a = S().task.answer;
  if (a.kind === 'num'){ q(d, 'input[data-final="0"]').value = ansStr(a.value) + (a.suffix ? '√3' : ''); click(w, q(d, '[data-action="final-check"]')); }
  click(w, q(d, '#teacherBtn'));
  ok(q(d, '#teacherPanel').hidden === false, 'панель Сдать учителю открывается');
  ok(q(d, '#tpSummary .tp-row'), 'в панели есть построчная сводка по темам');
  const nameInput = q(d, '#tpName'); nameInput.value = 'Аня П., 9А';
  nameInput.dispatchEvent(new w.Event('input', { bubbles: true }));
  ok(JSON.parse(w.localStorage.getItem('mathExamCourseProgress.v1')).student.name === 'Аня П., 9А', 'имя ученика сохранено в .student');
  click(w, q(d, '#tpClose'));
  ok(q(d, '#teacherPanel').hidden === true, 'панель закрывается');
  ok(errors.length === 0, 'нет JS-ошибок в панели учителя: ' + errors.join(' | '));
}
console.log(`\nПроверок: ${checks}, отказов: ${fails}, JS-ошибок: ${errors.length}`);
if (errors.length) console.log(errors.slice(0, 5).join('\n'));
process.exit(fails || errors.length ? 1 : 0);

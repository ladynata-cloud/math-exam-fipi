/* UI-тест версии 1.4 («для слабого ученика»): дуги равных углов, крупная формула шага,
   сектор текущего угла на чертеже, поведение в трёх режимах. Дополняет ui-test.js. */
const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const html = fs.readFileSync(process.argv[2] || 'build.html', 'utf8');

let fails = 0, checks = 0;
function ok(cond, msg){ checks++; if (!cond){ fails++; console.log('FAIL:', msg); } }
const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errors.push(String(e && e.message || e)));

function boot(url = 'https://mathexam.space/trainers/pt.html'){
  const dom = new JSDOM(html, { runScripts: 'dangerously', url, virtualConsole: vc, pretendToBeVisual: true,
    beforeParse(w){ w.requestAnimationFrame = cb => { cb(1); return 0; }; w.matchMedia = () => ({ matches: false, addEventListener(){}, addListener(){} }); w.HTMLElement.prototype.scrollIntoView = function(){}; } });
  const w = dom.window;
  w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
  return { w, d: w.document, S: () => w.eval('state') };
}
function click(w, el){ el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true })); }
function q(d, s){ return d.querySelector(s); }
function qa(d, s){ return Array.from(d.querySelectorAll(s)); }
function ansStr(v){
  if (Number.isInteger(v)) return String(v);
  for (let den = 2; den <= 400; den++){ const n = v * den; if (Math.abs(n - Math.round(n)) < 1e-9) return `${Math.round(n)}/${den}`; }
  return String(v).replace('.', ',');
}
function solveCurrent(w, d, S){
  const st = S().task.steps[S().stepIdx], c = q(d, '.step.current');
  if (st.kind === 'info') click(w, c.querySelector('[data-action="info-next"]'));
  else if (st.kind === 'choice') click(w, c.querySelector(`.opt[data-opt="${st.correct}"]`));
  else if (st.kind === 'pickSide') click(w, q(d, `.figure [data-side="${st.want}"]`));
  else if (st.kind === 'multi') { c.querySelectorAll('input.num').forEach((inp, k) => { inp.value = ansStr(st.inputs[k].ans); }); click(w, c.querySelector('[data-action="check"]')); }
  else { c.querySelector('input.num').value = st.suffix ? ansStr(st.ans) + '√3' : ansStr(st.ans); click(w, c.querySelector('[data-action="check"]')); }
}

/* ---------- 1. CSS-инфраструктура ---------- */
{
  const { d } = boot();
  const css = qa(d, 'style').map(s => s.textContent).join('\n');
  ok(/\.figure\{[^}]*width:560px/.test(css), 'чертёж крупный сразу: .figure width 560px');
  ok(/html\.board \.figure\{width:720px\}/.test(css), 'на доске ещё крупнее: 720px');
  ok(/@media\(max-width:640px\)\{\.figure\{[^}]*width:100%/.test(css), 'на телефоне чертёж во всю ширину');
  ok(/@keyframes eqblink/.test(css) && /\.eqang\.blink\{animation/.test(css), 'мерцание равных углов объявлено');
  ok(/prefers-reduced-motion: reduce\)\{\*\{transition:none !important; animation:none !important\}/.test(css), 'мерцание выключается при prefers-reduced-motion');
  ok(/\.formula\{[^}]*font-size:1\.32rem/.test(css), 'крупная формула объявлена');
}

/* ---------- 2. Тема 2, sin A: равные углы дугами, угол B — другим способом ---------- */
{
  const { w, d, S } = boot();
  click(w, q(d, '#topics .chip[data-topic="2"]'));
  click(w, q(d, '#modeSeg [data-mode="learn"]'));                    // «Учимся»: демо 0 = sinFromSeg
  ok(S().task.p.recipe === 'sinFromSeg', 'демо 0 темы 2 — задача на sin A');
  const arcs = qa(d, '.figure .eqang');
  ok(arcs.length === 4, `дуги всех четырёх углов видны всегда (${arcs.length})`);
  ok(qa(d, '.figure .eqang.blink').length === 0, 'без нажатия ничего не мигает');
  const colOf = el => (el.getAttribute('style').match(/stroke:(#[0-9a-f]{6})/) || [])[1];
  const cols = arcs.map(colOf);
  ok(new Set(cols).size === 2 && cols.filter(c => c === cols[0]).length === 2, 'два класса равенства — два цвета, по две дуги каждого');
  const chips2 = qa(d, '.figure .achip');
  ok(chips2.length === 4, 'четыре чипа углов под чертежом');
  click(w, chips2[0]);
  const lit = qa(d, '.figure .eqang.g4.blink');
  ok(lit.length >= 1 && lit.every(p => /stroke-width:3\.4/.test(p.getAttribute('style'))), 'нажатие: равный угол стал толще и мигает');
  ok(/∠[A-Z]+ = ∠[A-Z]+/.test(q(d, '.figure svg').textContent), 'подпись равенства на чертеже');
  click(w, q(d, '.figure .achip.on'));
  ok(qa(d, '.figure .eqang.blink').length === 0, 'повторное нажатие: мигание выключено');
  ok(qa(d, '.figure .stepang').length === 0, 'до первого шага сектор угла не показан');
  click(w, q(d, '[data-action="next"]'));                          // шаг 1: где ещё угол A? — подсвечен сам угол A
  ok(qa(d, '.figure .stepang').length === 1, 'после шага 1 на чертеже один сектор');
  const d1 = q(d, '.figure .stepang').getAttribute('d');
  click(w, q(d, '[data-action="next"]'));                          // шаг 2: sin из CBH — подсвечен угол BCH + отрезки
  const d2 = q(d, '.figure .stepang').getAttribute('d');
  ok(d1 !== d2, 'сектор переехал с угла A на угол BCH');
  ok(!!q(d, '.step.done .formula') && /sin/.test(q(d, '.step.done .formula').textContent), 'формула sin показана крупно в шаге');
  ok(/Ответ:/.test(q(d, '#taskArea').textContent), 'учимся: оба шага пройдены, ответ показан');
}

/* ---------- 3. Тема 2, высота: маршрут «формула → подстановка → корень» ---------- */
{
  const { w, d, S } = boot();
  click(w, q(d, '#topics .chip[data-topic="2"]'));
  click(w, q(d, '#modeSeg [data-mode="steps"]'));
  let guard = 0;
  while (S().task.p.recipe !== 'altFromSegs' && guard++ < 60) click(w, q(d, '[data-action="new"]'));
  ok(S().task.p.recipe === 'altFromSegs', 'нашли задачу на высоту');
  const st0 = S().task.steps[0];
  ok(st0.kind === 'choice' && st0.options.length === 3 && qa(d, '.step.current .opt').length === 3, 'шаг 1 — выбор из трёх формул');
  const wrong = st0.options.findIndex((o, i) => i !== st0.correct);
  click(w, q(d, `.step.current .opt[data-opt="${wrong}"]`));
  ok(/КАТЕТ|катета/i.test(q(d, '.fb').textContent), 'неверная формула получает адресное объяснение: ' + q(d, '.fb').textContent.slice(0, 60));
  ok(S().stepIdx === 0, 'неверный выбор не продвигает шаг');
  click(w, q(d, `.step.current .opt[data-opt="${st0.correct}"]`));
  ok(S().stepIdx === 1 && S().task.steps[1].kind === 'info', 'верная формула → шаг подстановки');
  const f = q(d, '.step.current .formula');
  ok(!!f && /·/.test(f.textContent) && f.querySelector('sup'), 'формула высоты крупно: с квадратом и произведением');
  ok(qa(d, '.figure .stepang').length === 0 && /stroke-width:3\.4/.test(q(d, '.figure').innerHTML), 'на шаге подстановки подсвечены отрезки формулы');
  solveCurrent(w, d, S);
  ok(/Корень по множителям/.test(q(d, '.step.current .title').textContent), 'последний шаг — корень по множителям');
  solveCurrent(w, d, S);
  ok(S().finished, 'высота найдена за три шага');
}

/* ---------- 4. Тема 4: сектор угла переезжает по шагам; живые углы ---------- */
{
  const { w, d, S } = boot();
  click(w, q(d, '#topics .chip[data-topic="4"]'));
  click(w, q(d, '#modeSeg [data-mode="steps"]'));
  click(w, q(d, '#levelSeg [data-level="2"]'));
  let guard = 0;
  while (S().task.p.kind !== 'hdm' && guard++ < 60) click(w, q(d, '[data-action="new"]'));
  ok(S().task.p.kind === 'hdm', 'задача про высоту/биссектрису/медиану');
  ok(!q(d, '.figure .angbar'), 'шкалы углов больше нет');
  ok(/viewBox="-6 0 292 224"/.test(q(d, '.figure').innerHTML), 'чертёж прежней высоты');
  /* живые углы: чипы под чертежом и зоны касания на самом чертеже */
  const chips = qa(d, '.figure .achip');
  ok(chips.length >= 4, `чипы углов под чертежом (${chips.length})`);
  ok(qa(d, '.figure .anghit').length === chips.length, 'на каждый чип — своя зона касания на чертеже');
  ok(/высота/.test(q(d, '.figure .legend').textContent), 'легенда цветов под чертежом');
  const stepWedge = q(d, '.figure .stepang').getAttribute('d');
  /* нажимаем угол, у которого есть равный: загораются оба и одним цветом */
  const F = w.eval('angleFacts(state.task).filter(F => F.partners.length)[0]');
  ok(!!F && F.step != null, 'есть угол с равным ему, найденный на некотором шаге');
  const achChip = chips.find(c => c.dataset.ang === F.key);
  const partnerChip = chips.find(c => c.dataset.ang === F.partners[0].key);
  ok(!!achChip && !!partnerChip, 'чипы угла и равного ему на месте');
  ok(achChip.style.getPropertyValue('--c') === partnerChip.style.getPropertyValue('--c'), 'равные углы — одного цвета на чипах');
  const single = chips.find(c => c.dataset.ang !== F.key && !F.partners.some(p => p.key === c.dataset.ang) && (w.eval('angleFacts(state.task)').find(x => x.key === c.dataset.ang) || {}).partners.length === 0);
  if (single) ok(single.style.getPropertyValue('--c') !== achChip.style.getPropertyValue('--c'), 'одиночный угол — другого цвета');
  click(w, achChip);
  ok(S().tapAngle === achChip.dataset.ang, 'нажатие на чип запоминается в состоянии');
  ok(q(d, '.figure .achip.on') && q(d, '.figure .achip.on').dataset.ang === achChip.dataset.ang, 'чип подсвечен как активный');
  ok(/∠[A-Z]+ = ∠[A-Z]+/.test(q(d, '.figure svg').textContent), 'на чертеже подпись «∠… = ∠…»');
  const partnerArc = qa(d, '.figure .eqang.g4.blink');
  ok(partnerArc.length >= 1, 'равный угол загорелся (мерцающая дуга)');
  ok(partnerArc.every(p => p.getAttribute('style').includes(F.col)) && q(d, '.figure .stepang').getAttribute('style').includes(F.col), 'сектор и дуга равного угла — один цвет');
  ok(!/= \d+°/.test(q(d, '.figure svg').textContent) || S().stepIdx > F.step, 'значение не показано, пока угол не найден по шагам');
  /* повторное нажатие снимает выделение; другой угол — переезд сектора */
  click(w, q(d, `.figure .achip[data-ang="${achChip.dataset.ang}"]`));
  ok(S().tapAngle === null && q(d, '.figure .stepang').getAttribute('d') === stepWedge, 'повторное нажатие возвращает подсветку шага');
  {
    const other = qa(d, '.figure .achip').find(c => c.dataset.ang !== S().task.steps[0].fig.angles[0].at + ':' + [S().task.steps[0].fig.angles[0].rays[0], S().task.steps[0].fig.angles[0].rays[1]].sort().join(''));
    click(w, other);
    ok(q(d, '.figure .stepang').getAttribute('d') !== stepWedge, 'нажали другой угол — сектор переехал на него');
    click(w, q(d, `.figure .achip[data-ang="${other.dataset.ang}"]`));
    ok(S().tapAngle === null, 'снятие выделения через тот же чип');
  }
  /* касание по самому чертежу тоже работает */
  click(w, q(d, `.figure .anghit[data-ang="${achChip.dataset.ang}"]`));
  ok(S().tapAngle === achChip.dataset.ang, 'зона касания на чертеже выбирает угол');
  click(w, q(d, `.figure .anghit[data-ang="${achChip.dataset.ang}"]`));
  /* решаем шаги до того, где находится этот угол — его значение появляется на чипе и при нажатии */
  const seq = [q(d, '.figure .stepang').getAttribute('d')];
  ok(!!q(d, '.step.current .formula'), 'шаг 1: есть крупная формула');
  solveCurrent(w, d, S);
  ok(S().tapAngle === null, 'после решённого шага выделение угла сброшено');
  let guardK = 0;
  while (S().stepIdx <= F.step && !S().finished && guardK++ < 5){ seq.push(q(d, '.figure .stepang').getAttribute('d')); solveCurrent(w, d, S); }
  const chipAfter = qa(d, '.figure .achip').find(c => c.dataset.ang === achChip.dataset.ang);
  ok(!!chipAfter && new RegExp('= ' + F.val + '°').test(chipAfter.textContent), `после шага чип показывает найденное значение (${chipAfter && chipAfter.textContent})`);
  click(w, chipAfter);
  ok(new RegExp('= ' + F.val + '°').test(q(d, '.figure svg').textContent), 'при нажатии найденное значение показано на чертеже');
  click(w, q(d, `.figure .achip[data-ang="${achChip.dataset.ang}"]`));
  ok(S().tapAngle === null, 'выделение снято перед продолжением шагов');
  let guardR = 0;
  while (!S().finished && guardR++ < 5){
    seq.push(q(d, '.figure .stepang').getAttribute('d'));
    ok(!!q(d, '.step.current .formula'), `шаг ${S().stepIdx + 1}: есть крупная формула`);
    solveCurrent(w, d, S);
  }
  ok(seq.every(Boolean) && new Set(seq).size === 3, 'сектор угла на чертеже разный на каждом из трёх шагов');
  ok(S().finished, 'тема 4 решена по шагам');
  ok(/\d+°/.test(q(d, '.figure svg').textContent), 'после решения на чертеже стоит найденный угол');
}

/* ---------- 5. Тема 5: одношаговых задач больше нет; равные 30° и 60° мигают ---------- */
{
  const { w, d, S } = boot();
  click(w, q(d, '#topics .chip[data-topic="5"]'));
  click(w, q(d, '#modeSeg [data-mode="steps"]'));
  for (let n = 0; n < 12; n++){
    ok(S().task.steps.length >= 2, `тема 5 ур.1: не меньше двух шагов (${S().task.p.ask}: ${S().task.steps.length})`);
    click(w, q(d, '[data-action="new"]'));
  }
  click(w, q(d, '#levelSeg [data-level="2"]'));
  let guard = 0;
  while (S().task.p.ask !== 'CH' && guard++ < 60) click(w, q(d, '[data-action="new"]'));
  ok(qa(d, '.figure .eqang').length >= 3 && qa(d, '.figure .eqang.blink').length === 0, 'высота при 30°: дуги пар 30° и 60° видны, без нажатия не мигают');
  ok(S().task.steps[0].kind === 'choice' || S().task.steps[1].kind === 'choice', 'вопрос «какая сторона против 30°» стоит в начале лесенки');
  let g = 0; while (!S().finished && g++ < 12) solveCurrent(w, d, S);
  ok(S().finished, 'высота при 30° решена по шагам');
}

/* ---------- 6. Режимы: «Сам» без подсказок на чертеже, раскрытое решение — с ними ---------- */
{
  const { w, d, S } = boot();
  click(w, q(d, '#topics .chip[data-topic="4"]'));
  click(w, q(d, '#modeSeg [data-mode="solo"]'));
  ok(qa(d, '.figure .stepang').length === 0, 'сам: сектора угла шага нет — подсказки на чертеже выключены');
  ok(qa(d, '.step').length === 0, 'сам: лесенка скрыта');
  const inp = q(d, 'input[data-final="0"]');
  inp.value = '999'; click(w, q(d, '[data-action="final-check"]'));
  inp.value = '998'; click(w, q(d, '[data-action="final-check"]'));
  click(w, q(d, '[data-action="give-up"]'));
  ok(S().soloRevealed, 'после двух промахов решение раскрывается по шагам');
  for (let i = 0; i < 2; i++) click(w, q(d, '[data-action="next"]'));
  ok(qa(d, '.figure .stepang').length >= 0 && qa(d, '.step.done').length === S().revealed, 'раскрытые шаги отмечены');
  ok(errors.length === 0, 'нет JS-ошибок: ' + errors.join(' | '));
}

console.log(`\nПроверок: ${checks}, отказов: ${fails}, JS-ошибок: ${errors.length}`);
if (errors.length) console.log(errors.slice(0, 5).join('\n'));
process.exit(fails || errors.length ? 1 : 0);

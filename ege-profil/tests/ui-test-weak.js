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
  ok(/\.figure\{[^}]*width:360px/.test(css), 'чертёж крупнее: .figure width 360px');
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
  const g1 = qa(d, '.figure .eqang.g1.blink'), g2 = qa(d, '.figure .eqang.g2.blink');
  ok(g1.length === 2, `угол A и угол BCH — две одинаковые мерцающие дуги (${g1.length})`);
  ok(g2.length === 4, `угол B и угол ACH — двойные дуги другого цвета (${g2.length} путей)`);
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

/* ---------- 4. Тема 4: сектор угла переезжает по шагам, равные углы мигают ---------- */
{
  const { w, d, S } = boot();
  click(w, q(d, '#topics .chip[data-topic="4"]'));
  click(w, q(d, '#modeSeg [data-mode="steps"]'));
  click(w, q(d, '#levelSeg [data-level="2"]'));
  let guard = 0;
  while (S().task.p.kind !== 'hdm' && guard++ < 60) click(w, q(d, '[data-action="new"]'));
  ok(S().task.p.kind === 'hdm', 'задача про высоту/биссектрису/медиану');
  const seq = [];
  for (let i = 0; i < 3; i++){
    const w1 = q(d, '.figure .stepang');
    seq.push(w1 ? w1.getAttribute('d') : null);
    if (S().task.steps[i].fig && S().task.steps[i].fig.eq) ok(qa(d, '.figure .eqang.blink').length >= 1, `шаг ${i + 1}: парный равный угол мигает (у угла с сектором вторая дуга не дублируется)`);
    /* шкала углов при C */
    ok(!!q(d, '.figure .angbar'), `шаг ${i + 1}: шкала углов на месте`);
    ok(qa(d, '.figure .angtick').length === 3, `шаг ${i + 1}: три засечки — высота, биссектриса, медиана`);
    ok(!!q(d, '.figure .angspan'), `шаг ${i + 1}: на шкале выделен угол текущего шага`);
    const vals = qa(d, '.figure .angbar text').filter(tx => /font-weight:900/.test(tx.getAttribute('style')) && /°$/.test(tx.textContent) && !/^\?$/.test(tx.textContent)).length;
    ok(vals === i, `шаг ${i + 1}: на шкале подписано ${i} найденных значений (${vals})`);
    ok(/высота/.test(q(d, '.figure .legend').textContent) && /медиана/.test(q(d, '.figure .legend').textContent), `шаг ${i + 1}: легенда цветов под чертежом`);
    ok(/viewBox="-6 0 292 294"/.test(q(d, '.figure').innerHTML), `шаг ${i + 1}: чертёж вырос под шкалу`);
    ok(!!q(d, '.step.current .formula'), `шаг ${i + 1}: есть крупная формула`);
    solveCurrent(w, d, S);
  }
  ok(seq.every(Boolean) && new Set(seq).size === 3, 'сектор угла на чертеже разный на каждом из трёх шагов');
  ok(S().finished, 'тема 4 решена по шагам');
  const finalLbl = qa(d, '.figure .angbar text').map(tx => tx.textContent);
  ok(finalLbl.some(s => /^\d+°$/.test(s)) && !finalLbl.includes('?'), 'после решения на шкале стоит ответ вместо «?»');
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
  ok(qa(d, '.figure .eqang.g1.blink').length >= 1 && qa(d, '.figure .eqang.g2.blink').length === 4, 'высота при 30°: пара 60° — двойными дугами, парный 30° мигает рядом с сектором шага');
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

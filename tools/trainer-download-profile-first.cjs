'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createHash } = require('node:crypto');

const courseKey = 'mathExamCourseProgress.v1';
const startKey = 'mathexam.profileStart2027.v1';
const sentinel = { kept: 'unrelated earned result', solved: 7 };
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const reference = vm.createContext({});
for (const name of ['vector-basics', 'geometry', 'stereo', 'algebra', 'probability', 'equations', 'functions', 'applied', 'finance', 'readiness']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../ege-profil/start', name + '-data.js'), 'utf8'), reference);
}
const originalBankHash = hash(reference.ProfileLessons);

const routes = { 'ege-profil-start': '#calm/2' };
const invalidNumericExamples = [
  ['sqrt(-4)^2', 4], ['(1/0)^0', 1], ['0^0', 1]
];

async function seedOtherProgress(page) {
  await page.evaluate(({ key, sentinel }) => {
    const store = JSON.parse(localStorage.getItem(key) || '{}');
    store.downloadValidationOtherTrainer = sentinel;
    localStorage.setItem(key, JSON.stringify(store));
  }, { key: courseKey, sentinel });
}

async function progress(page, id) {
  return page.evaluate(({ key, id }) => JSON.parse(localStorage.getItem(key) || '{}')[id] || {}, { key: courseKey, id });
}

async function otherProgressIntact(page) {
  assert.deepEqual(await progress(page, 'downloadValidationOtherTrainer'), sentinel);
}

async function finiteFigure(page, selector) {
  const svg = page.locator(selector).first();
  await svg.waitFor({ state: 'visible' });
  assert.doesNotMatch(await svg.evaluate(node => node.outerHTML), /NaN|Infinity|undefined/);
  const size = await svg.boundingBox();
  assert(size && size.width > 0 && size.height > 0, 'the actual drawing is visible');
}

// Read the two labelled axes and the grid itself, not the generator's answer.
async function plottedPoints(page, selector, gridSelector, pointSelector) {
  return page.locator(selector).evaluate((svg, { gridSelector, pointSelector }) => {
    const lines = [...svg.querySelectorAll('line')].map(node => ({
      node, x1: +node.getAttribute('x1'), y1: +node.getAttribute('y1'),
      x2: +node.getAttribute('x2'), y2: +node.getAttribute('y2')
    }));
    const axes = lines.filter(line => line.node.getAttribute('stroke') === '#2A2F38');
    const xAxis = axes.filter(line => line.y1 === line.y2).sort((a, b) => Math.abs(b.x2 - b.x1) - Math.abs(a.x2 - a.x1))[0];
    const yAxis = axes.filter(line => line.x1 === line.x2).sort((a, b) => Math.abs(b.y2 - b.y1) - Math.abs(a.y2 - a.y1))[0];
    const grid = lines.filter(line => line.node.matches(gridSelector));
    const spacing = values => {
      const sorted = [...new Set(values)].sort((a, b) => a - b);
      return Math.min(...sorted.slice(1).map((value, index) => value - sorted[index]).filter(value => value > 1e-6));
    };
    const sx = spacing(grid.filter(line => line.x1 === line.x2).map(line => line.x1));
    const sy = spacing(grid.filter(line => line.y1 === line.y2).map(line => line.y1));
    const round = value => Math.round(value * 1e10) / 1e10;
    return { sx, sy, points: [...svg.querySelectorAll(pointSelector)].map(node => [
      round((+node.getAttribute('cx') - yAxis.x1) / sx),
      round((xAxis.y1 - +node.getAttribute('cy')) / sy)
    ]) };
  }, { gridSelector, pointSelector });
}

async function nativeRandomClick(page, label, value, selector = '#modeChips button') {
  await page.evaluate(({ label, value, selector }) => {
    const original = Math.random;
    Math.random = () => value;
    try {
      const button = [...document.querySelectorAll(selector)].find(node => node.textContent.trim() === label);
      if (!button) throw new Error('Missing native choice: ' + label);
      button.click();
    } finally { Math.random = original; }
  }, { label, value, selector });
}

async function finishLadder(page, selector) {
  const step = page.locator(selector + ' button');
  for (let index = 0; index < 20 && !(await step.isDisabled()); index++) await step.click();
  assert(await step.isDisabled(), 'the requested worked solution reaches its final step');
  assert(await page.locator(selector + ' .lfinal').isVisible());
}

async function checkStartNumericDomain(page) {
  const lesson = 'vec-coordinates';
  await page.evaluate(id => { location.hash = '#practice/' + id + '/independent'; }, lesson);
  const field = page.locator('#answer-form input[type=text]');
  const read = () => page.evaluate(({ key, lesson }) => {
    const state = JSON.parse(localStorage.getItem(key));
    const session = state.sessions[lesson + ':independent'];
    const task = ProfileLessons.find(item => item.id === lesson).tasks.find(item => item.id === session.taskId);
    return { session, answer: task.answer, earned: state.records[lesson]?.independent?.includes(task.id) ?? false };
  }, { key: startKey, lesson });
  await field.waitFor();
  const { answer } = await read();
  const submit = page.locator('#submit-answer');
  const next = page.locator('#next');
  for (const [expression, oldValue] of invalidNumericExamples) {
    // The previous checker can reduce this invalid expression to the correct answer.
    await field.fill(`(${answer})+(${expression})-${oldValue}`);
    await submit.click();
    assert.match(await page.locator('#feedback').innerText(), /Не удалось прочитать/, expression);
    const { session, earned } = await read();
    assert(!session.wrong && !session.solved && !session.answers?.length && !earned);
    assert(await next.isDisabled());
  }
  const draft = await field.inputValue();
  await page.reload();
  assert.equal(await field.inputValue(), draft);
  assert(await next.isDisabled());
  await field.fill(`(${answer})+(sqrt((-4)^2)-4)`);
  await submit.click();
  assert.match(await page.locator('#feedback').innerText(), /^Верно/);
  await next.click();
  await page.locator('.result-panel').waitFor();
  assert((await read()).earned);
}

async function checkStartExamRoutes(page) {
  const readSavedWork = () => page.evaluate(key => {
    const state = JSON.parse(localStorage.getItem(key));
    const ids = ['vec-basics-reading', 'vec-coordinates'];
    return {
      records: ids.map(id => state.records[id]),
      sessions: Object.fromEntries(Object.entries(state.sessions).filter(([id]) => ids.some(lesson => id.startsWith(lesson + ':'))))
    };
  }, startKey);
  const saved = await readSavedWork();
  for (const [hash, title, number, lessons] of [
    ['#calm/13', 'Экономическая задача', 16, ['finance-lesson-07-equal-payments']],
    ['#fipi/2027/16', 'Экономическая задача', 16, ['finance-lesson-07-equal-payments']],
    ['#calm/9', 'Производная, экстремумы и первообразная', null, ['calc-tangent', 'calc-extreme', 'calc-integral']],
    ['#fipi/2027/8', 'Производная и первообразная', 8, ['calc-tangent', 'calc-integral']],
    ['#topic/integral', 'Первообразная и площадь', 8, ['calc-integral']],
    ['#fipi/2027/12', 'Наибольшее и наименьшее значение', 12, ['calc-extreme']],
    ['#exam/16', 'Неравенства.', 15, []],
    ['#fipi/2027/15', 'Неравенства.', 15, []]
  ]) {
    const url = new URL(page.url());
    url.hash = hash;
    await page.goto(url.href);
    await page.reload();
    await page.locator('main h1').waitFor();
    assert.equal(new URL(page.url()).protocol, 'file:');
    assert.equal(await page.locator('main h1').innerText(), title, hash);
    if (number) assert.match(await page.locator('main p.eyebrow').first().innerText(), new RegExp('№\\s*' + number + '(?:\\D|$)'), hash);
    const links = await page.locator('main a[href]').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')));
    for (const lesson of lessons) assert(links.some(href => href.includes('/' + lesson)), hash + ': ' + lesson);
    if(number===16) assert(links.includes('https://mathexam.space/ege-profil/part-two/#fipi/2027/16'), hash + ': written course online bridge');
  }
  const sources = new URL(page.url());
  sources.hash = '#sources';
  await page.goto(sources.href);
  const integralGuide = page.locator('main p').filter({hasText: 'Первообразную и площадь изучаем'});
  assert.equal(await integralGuide.getByRole('link', {name: 'задании №8', exact: true}).getAttribute('href'), '#fipi/2027/8');
  assert.deepEqual(await readSavedWork(), saved, 'legacy and official routes preserve existing START answers, drafts, attempts and earned work');
}

const scenarios = {
  async 'ege-profil-start'(page) {
    await seedOtherProgress(page);
    const bank = await page.evaluate(() => ProfileLessons);
    assert.equal(bank.length, 90);
    assert.equal(bank.reduce((count, lesson) => count + lesson.tasks.length, 0), 540);
    assert.equal(hash(bank), originalBankHash, 'all original lesson, answer, step and drawing data survive the export');
    assert.equal(bank.filter(lesson => lesson.vectorBasics).length, 9);

    await page.evaluate(() => { location.hash = '#lesson/geo-quadrilaterals'; });
    const lab = page.locator('#explore-lab');
    await lab.locator(':scope > summary').click();
    assert.match(await lab.locator('.research-instructions').innerText(), /Провести диагональ/);
    await finiteFigure(page, '#lab svg');
    await lab.getByRole('button', { name: 'Провести диагональ', exact: true }).click();
    assert.equal(await lab.getByRole('button', { name: 'Провести диагональ', exact: true }).getAttribute('aria-pressed'), 'true');
    assert.equal(await lab.locator('#research-demo').count(), 0, 'standalone has the research without an online-only demo control');

    await page.evaluate(() => { location.hash = '#practice/vec-basics-reading/guided'; });
    await page.locator('#answer-form').waitFor();
    await finiteFigure(page, '#task-model svg');
    assert.equal(await page.locator('[data-vector-basics-drawing]').getAttribute('data-vector-basics-drawing'), 'vec-basics-read-ab');
    assert.equal(await page.locator('[data-vector-arrow="AB"]').count(), 1);
    assert.match(await page.locator('.question').innerText(), /начинается стрелка/);
    await page.locator('#submit-answer').click();
    assert.match(await page.locator('#feedback').innerText(), /Сначала введите или выберите/);
    await page.locator('input[name=answer][value="B"]').check();
    await page.locator('#submit-answer').click();
    assert.match(await page.locator('#feedback').innerText(), /Пока не сходится/);
    const drawing = await page.locator('#task-model svg').evaluate(node => node.outerHTML);
    await page.locator('#hint').click();
    assert(await page.locator('#hint-box').isVisible());
    assert(await page.locator('input[name=answer][value="B"]').isChecked());
    assert.equal(await page.locator('#task-model svg').evaluate(node => node.outerHTML), drawing, 'help keeps the original drawing');
    await page.locator('#pause-practice').click();
    await page.reload();
    const back = page.getByRole('link', { name: 'Продолжить с того же места', exact: true });
    assert.match(await back.getAttribute('href'), /^#practice\/vec-basics-reading\/guided$/);
    await back.click();
    assert(await page.locator('input[name=answer][value="B"]').isChecked(), 'the learner draft survives pause and reload');
    await page.locator('#submission-history > summary').click();
    assert.match(await page.locator('[data-submission-first]').innerText(), /B.*нужна правка/);
    await page.locator('input[name=answer][value="A"]').check();
    await page.locator('#submit-answer').click();
    assert.match(await page.locator('#feedback').innerText(), /Верно/);
    await page.locator('#next').click();
    assert.match(await page.locator('.question').innerText(), /называется вектор/);
    await page.locator('input[name=answer][value="AB"]').check();
    await page.locator('#submit-answer').click();
    await page.locator('#next').click();
    await page.locator('.result-panel').waitFor();
    let state = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), startKey);
    assert.deepEqual(state.records['vec-basics-reading'].guided, ['vec-basics-read-ab']);
    assert.equal(state.records['vec-basics-reading'].independent.length, 0, 'guided work never becomes independent credit');
    await page.locator('#another').click();
    assert.equal(await page.locator('[data-vector-basics-drawing]').getAttribute('data-vector-basics-drawing'), 'vec-basics-read-dc');
    for (const answer of ['D', 'DC']) {
      await page.locator(`input[name=answer][value="${answer}"]`).check();
      await page.locator('#submit-answer').click();
      await page.locator('#next').click();
    }
    await page.locator('#another').click();
    assert.equal(await page.locator('[data-vector-basics-drawing]').getAttribute('data-vector-basics-drawing'), 'vec-basics-zero-aa');
    await page.locator('input[name=answer][value="Нулевой"]').check();
    await page.locator('#submit-answer').click();
    await page.locator('#next').click();
    assert.match(await page.locator('.question').innerText(), /длина/);
    await page.locator('#submit-answer').click();
    assert.match(await page.locator('#feedback').innerText(), /Сначала введите или выберите/);
    await page.locator('#answer').fill('1');
    await page.locator('#submit-answer').click();
    assert.match(await page.locator('#feedback').innerText(), /Пока не сходится/);
    await page.locator('#answer').fill('0');
    await page.locator('#submit-answer').click();
    assert.match(await page.locator('#feedback').innerText(), /Верно/);
    await page.locator('#next').click();
    await page.locator('.result-panel').waitFor();
    const next = page.locator('[data-vector-continue]');
    assert.equal(await next.getAttribute('href'), '#calm/2');
    await next.click();
    assert.match(page.url(), /^file:.*#calm\/2$/);

    await page.evaluate(() => { location.hash = '#practice/vec-basics-reading/independent'; });
    await page.locator('#answer-form').waitFor();
    assert.equal(await page.locator('[data-vector-basics-drawing]').getAttribute('data-vector-basics-drawing'), 'vec-basics-read-km');
    assert.equal(await page.locator('[data-vector-arrow="KM"]').count(), 1);
    await page.locator('#submit-answer').click();
    assert.match(await page.locator('#feedback').innerText(), /Сначала введите или выберите/);
    await page.locator('input[name=answer][value="KM"]').check();
    await page.locator('#submit-answer').click();
    await page.locator('#next').click();
    await page.locator('.result-panel').waitFor();
    await page.reload();
    await page.locator('.result-panel').waitFor();
    state = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), startKey);
    assert.deepEqual(state.records['vec-basics-reading'].independent, ['vec-basics-read-km']);
    assert.match(await page.locator('.result-panel h1').innerText(), /самостоятельно/);
    await checkStartNumericDomain(page);
    await checkStartExamRoutes(page);
    await otherProgressIntact(page);
  },

  async 'ege-profil-vectors-yashchenko'(page) {
    await seedOtherProgress(page);
    await page.evaluate(() => { YB2.srand(1); setType('v6'); });
    await finiteFigure(page, '#taskArea svg');
    assert.match(await page.locator('#taskArea .q').innerText(), /a·\(b \+ c\)/);
    const readVectors = () => page.locator('#taskArea svg').evaluate(svg => {
      const grid = [...svg.querySelectorAll('line.gd')];
      const xs = [...new Set(grid.filter(line => line.getAttribute('x1') === line.getAttribute('x2')).map(line => +line.getAttribute('x1')))].sort((a, b) => a - b);
      const ys = [...new Set(grid.filter(line => line.getAttribute('y1') === line.getAttribute('y2')).map(line => +line.getAttribute('y1')))].sort((a, b) => a - b);
      const sx = xs[1] - xs[0], sy = ys[1] - ys[0];
      return { sx, sy, arrows: [...svg.querySelectorAll('line.vc')].map((line, index) => {
        const tip = svg.querySelector('polygon.vh.v' + index).getAttribute('points').split(' ')[0].split(',').map(Number);
        return [(tip[0] - +line.getAttribute('x1')) / sx, (+line.getAttribute('y1') - tip[1]) / sy];
      }) };
    });
    const vectors = await readVectors();
    assert.equal(vectors.sx, vectors.sy, 'one square has the same unit on both axes');
    assert.equal(vectors.arrows.length, 3);
    assert(vectors.arrows.flat().every(Number.isInteger));
    const [a, b, c] = vectors.arrows;
    const expected = a[0] * (b[0] + c[0]) + a[1] * (b[1] + c[1]);
    assert.equal(expected, -23, 'answer recomputed from the actual arrow tails and tips');
    const check = page.locator('#taskArea [data-action=check]');
    await check.click();
    assert.match(await page.locator('#taskArea .fb').innerText(), /Введите число/);
    await page.locator('#taskArea input.num').fill(String(-expected));
    await check.click();
    assert(await page.locator('#taskArea .fb.bad').isVisible());
    const figure = await page.locator('#taskArea svg').evaluate(node => node.outerHTML);
    await page.locator('#taskArea [data-action=steps]').click();
    assert(await page.locator('#taskArea ol.steps').isVisible());
    assert.equal(await page.locator('#taskArea svg').evaluate(node => node.outerHTML), figure);
    await page.locator('#taskArea input.num').fill(String(expected));
    await check.click();
    assert(await page.locator('#taskArea .fb.ok').isVisible());
    let saved = await progress(page, 'ege-t2-yashchenko');
    assert.equal(saved.types.v6.solved, 1);
    assert.equal(saved.types.v6.correct, 0, 'a correction after an exposed solution is not a first-attempt success');

    await page.evaluate(() => { YB2.srand(2); setType('v6'); });
    const [freshA, freshB, freshC] = (await readVectors()).arrows;
    const independent = freshA[0] * (freshB[0] + freshC[0]) + freshA[1] * (freshB[1] + freshC[1]);
    assert.equal(independent, 24);
    await page.locator('#taskArea input.num').fill(String(independent));
    await check.click();
    saved = await progress(page, 'ege-t2-yashchenko');
    assert.equal(saved.types.v6.solved, 2);
    assert.equal(saved.types.v6.correct, 1);
    await page.reload();
    assert.equal((await progress(page, 'ege-t2-yashchenko')).types.v6.correct, 1);
    await otherProgressIntact(page);
  },

  async 'ege-profil-derivative'(page) {
    await seedOtherProgress(page);
    await page.locator('[data-view=train]').click();
    async function tangent(dy) {
      const remaining = await page.evaluate(dy => {
        const pick = T8.pick, rnd = T8.rnd, values = [dy, 1, -2, 1];
        T8.pick = values => { if (!values.includes(2)) throw new Error('Unexpected tangent choices'); return 2; };
        T8.rnd = (low, high) => {
          const value = values.shift();
          if (value === undefined || value < low || value > high) throw new Error('Unexpected tangent random interval');
          return value;
        };
        try {
          [...document.querySelectorAll('#trackChips button')].find(button => button.textContent === 'Касательная по клеткам').click();
          return values.length;
        } finally { T8.pick = pick; T8.rnd = rnd; }
      }, dy);
      assert.equal(remaining, 0);
      await finiteFigure(page, '#taskFig svg');
      return plottedPoints(page, '#taskFig svg', 'line[stroke="rgba(88,140,190,.28)"]', 'circle[fill="#1E3A9F"]');
    }
    const before = await tangent(4);
    assert.deepEqual(before.points, [[1, -2], [3, 2]]);
    const edited = await tangent(3);
    assert.deepEqual(edited.points, [[1, -2], [3, 1]]);
    assert(Math.abs(edited.sx - edited.sy) < 1e-9);
    const [[x1, y1], [x2, y2]] = edited.points;
    const expected = (y2 - y1) / (x2 - x1);
    assert.equal(expected, 1.5);
    const touch = await plottedPoints(page, '#taskFig svg', 'line[stroke="rgba(88,140,190,.28)"]', 'circle[fill="#C22F2A"]');
    assert.deepEqual(touch.points, [[2, -0.5]]);
    await page.locator('#taskCheck').click();
    assert.match(await page.locator('#taskFb').innerText(), /Введите число или дробь/);
    await page.locator('#taskAnswer').fill('2');
    await page.locator('#taskCheck').click();
    assert(await page.locator('#taskFb.bad').isVisible(), 'the old slope is rejected');
    await page.locator('#taskAnswer').fill('1,5');
    const drawing = await page.locator('#taskFig svg').evaluate(node => node.outerHTML);
    await page.locator('#taskHint').click();
    assert.match(await page.locator('#taskFb').innerText(), /Δy.*Δx/);
    assert.equal(await page.locator('#taskAnswer').inputValue(), '1,5');
    assert.equal(await page.locator('#taskFig svg').evaluate(node => node.outerHTML), drawing);
    await page.evaluate(() => { document.getElementById('taskCheck').click(); document.getElementById('taskCheck').click(); });
    assert.match(await page.locator('#taskFb').innerText(), /Верно: 1,5/);
    assert.equal((await progress(page, 'derivative-t8')).solvedByType.tangent, 1, 'repeat submissions count once');
    await tangent(3);
    await page.locator('#taskSol').click();
    await finishLadder(page, '#taskSolBox');
    await page.locator('#taskAnswer').fill('1,5');
    await page.locator('#taskCheck').click();
    assert.match(await page.locator('#taskFb').innerText(), /Ответ был открыт/);
    assert.equal((await progress(page, 'derivative-t8')).solvedByType.tangent, 1, 'revealed answer is excluded from solved credit');
    await otherProgressIntact(page);
  },

  async 'ege-profil-applied'(page) {
    await seedOtherProgress(page);
    await nativeRandomClick(page, 'формулы', 0);
    const text = await page.locator('#dText').innerText(), ask = await page.locator('#dAsk').innerText();
    const v = Number(text.match(/−5t² \+ (\d+)t/)[1]);
    const height = Number(ask.match(/не менее (\d+) м/)[1]);
    const expected = Math.sqrt(v * v - 20 * height) / 5;
    assert.equal(expected, 2, 'time between the roots of the displayed height inequality');
    await page.locator('#dCheck').click();
    assert.equal((await progress(page, 'applied-t910')).solved9 || 0, 0);
    await page.locator('#dAnswer').fill(String(expected + 1));
    await page.locator('#dCheck').click();
    assert(await page.locator('#dFb.bad').isVisible());
    assert.doesNotMatch(await page.locator('#dFb').innerText(), /Правильный ответ|Ответ:/);
    await page.locator('#dAnswer').fill(String(expected));
    await page.locator('#dSol').click();
    assert.equal(await page.locator('#dAnswer').inputValue(), String(expected));
    assert.match(await page.locator('#dFb').innerText(), /Корни.*1.*3/);
    await page.evaluate(() => { document.getElementById('dCheck').click(); document.getElementById('dCheck').click(); });
    let saved = await progress(page, 'applied-t910');
    assert.equal(saved.assisted, 1); assert.equal(saved.independent, 0);

    await nativeRandomClick(page, 'формулы', .2);
    const power = (await page.locator('#dAsk').innerText()).match(/мощность равна (\d+) Вт.*сопротивление — (\d+) Ом/);
    assert(power, 'the next native family supplies its actual physical quantities');
    const current = Math.sqrt(Number(power[1]) / Number(power[2]));
    await page.locator('#dAnswer').fill(String(current));
    await page.evaluate(() => { document.getElementById('dCheck').click(); document.getElementById('dCheck').click(); });
    saved = await progress(page, 'applied-t910');
    assert.equal(saved.assisted, 1); assert.equal(saved.independent, 1); assert.equal(saved.solved9, 2);
    await page.locator('[data-view=idea]').click();
    assert(await page.locator('#tbl').isVisible());
    for (const expression of ['x', '240/x', 'x + 20', '240/(x + 20)']) {
      await page.locator('#pool').getByRole('button', { name: expression, exact: true }).click();
    }
    assert.equal(await page.locator('#eq').innerText(), '240/x − 240/(x + 20) = 1');
    assert.equal((await progress(page, 'applied-t910')).table, true);
    await page.reload();
    assert.equal((await progress(page, 'applied-t910')).independent, 1);
    await otherProgressIntact(page);
  },

  async 'ege-profil-probability'(page) {
    await seedOtherProgress(page);
    await page.locator('[data-view=drill]').click();
    await nativeRandomClick(page, 'задание 4', 0);
    const balls = (await page.locator('#dText').innerText()).match(/В урне (\d+).* и (\d+)/);
    assert(balls);
    const white = Number(balls[1]), black = Number(balls[2]), expected = white / (white + black);
    assert.equal(expected, .25);
    await page.locator('#dCheck').click();
    assert.equal((await progress(page, 'probability-t45')).solved4 || 0, 0);
    await page.locator('#dAnswer').fill(String(white / black));
    await page.locator('#dCheck').click();
    assert(await page.locator('#dFb.bad').isVisible());
    assert.match(await page.locator('#dFb').innerText(), /всех исходов/);
    await page.locator('#dAnswer').fill('0,25');
    await page.locator('#dSol').click();
    assert.equal(await page.locator('#dAnswer').inputValue(), '0,25');
    await finishLadder(page, '#dSolBox');
    await page.locator('#dCheck').click();
    assert.match(await page.locator('#dFb').innerText(), /Ответ был открыт/);
    assert.equal((await progress(page, 'probability-t45')).solved4 || 0, 0);
    await nativeRandomClick(page, 'задание 4', .15);
    const fresh = (await page.locator('#dText').innerText()).match(/В урне (\d+).* и (\d+)/);
    assert(fresh);
    const independent = Number(fresh[1]) / (Number(fresh[1]) + Number(fresh[2]));
    assert.notEqual(independent, expected, 'a different native urn condition');
    await page.locator('#dAnswer').fill(String(independent).replace('.', ','));
    await page.evaluate(() => { document.getElementById('dCheck').click(); document.getElementById('dCheck').click(); });
    assert.equal((await progress(page, 'probability-t45')).solved4, 1);
    await page.reload();
    assert.equal((await progress(page, 'probability-t45')).solved4, 1);
    await otherProgressIntact(page);
  },

  async 'ege-profil-functions'(page) {
    await seedOtherProgress(page);
    await page.locator('[data-view=drill]').click();
    async function line(value) {
      await nativeRandomClick(page, 'графики', value);
      await finiteFigure(page, '#dFig svg');
      const figure = await plottedPoints(page, '#dFig svg', 'line[stroke="#D7E3F2"]', 'circle');
      assert.equal(figure.sx, figure.sy);
      assert.equal(figure.points.length, 2);
      const [[x1, y1], [x2, y2]] = figure.points;
      const x = Number((await page.locator('#dAsk').innerText()).match(/f\(([−\-\d]+)\)/)[1].replace('−', '-'));
      return y1 + (x - x1) * (y2 - y1) / (x2 - x1);
    }
    const expected = await line(0);
    assert.equal(expected, -28, 'line value calculated from the two plotted lattice points');
    await page.locator('#dCheck').click();
    assert(!(await page.locator('#dCheck').isDisabled()));
    assert.equal((await progress(page, 'functions-t1112')).solved11 || 0, 0);
    await page.locator('#dAnswer').fill(String(-expected));
    await page.locator('#dCheck').click();
    assert(await page.locator('#dFb.bad').isVisible());
    const figure = await page.locator('#dFig svg').evaluate(node => node.outerHTML);
    await page.locator('#dAnswer').fill(String(expected));
    await page.locator('#dSol').click();
    assert.equal(await page.locator('#dAnswer').inputValue(), String(expected));
    assert.equal(await page.locator('#dFig svg').evaluate(node => node.outerHTML), figure);
    await page.locator('#dCheck').click();
    assert.match(await page.locator('#dFb').innerText(), /с помощью/);
    assert.equal((await progress(page, 'functions-t1112')).solved11 || 0, 0);
    const independent = await line(.15);
    assert.notEqual(independent, expected);
    await page.locator('#dAnswer').fill(String(independent));
    await page.evaluate(() => { document.getElementById('dCheck').click(); document.getElementById('dCheck').click(); });
    assert.equal((await progress(page, 'functions-t1112')).solved11, 1);
    await page.locator('[data-view=idea]').click();
    await page.locator('#sk').evaluate(node => { node.value = '0'; node.dispatchEvent(new Event('input', { bubbles: true })); });
    await finiteFigure(page, '#heroFig svg');
    assert.match(await page.locator('#heroInfo').innerText(), /x ≠ -1/);
    assert.equal(await page.locator('#heroFig [data-hole]').count(), 1, 'zero numerator retains the forbidden point');
    assert.equal(await page.locator('#heroFig [stroke-dasharray]').count(), 0, 'the punctured horizontal line has no vertical asymptote');
    await otherProgressIntact(page);
  }
};

module.exports = { scenarios, routes, invalidNumericExamples };

'use strict';

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const partTwoLessons = ['algebra', 'geometry', 'models'].flatMap(name => require(`../ege-profil/part-two/content-${name}.js`));
const manifest = require('../downloads/trainers-manifest.json');
const ogeNext = require('./trainer-download-oge-next.cjs');
const ogeFinal = require('./trainer-download-oge-final.cjs');
const profileFirst = require('./trainer-download-profile-first.cjs');
const profileNext = require('./trainer-download-profile-next.cjs');
const profileReasoning = require('./trainer-download-profile-reasoning.cjs');
const profileCourses = require('./trainer-download-profile-courses.cjs');

const root = path.resolve(__dirname, '..');
const entries = manifest.trainers.filter(entry => entry.adaptation);
const read = file => fs.readFileSync(path.join(root, file));
const assetDir = 'assets/trainer-skill-gifs';
const guide = '/pedagogam/kak-skachat-i-adaptirovat-trenazher/';
const profileMapSlugs = new Set([
  ...Object.keys(profileFirst.scenarios), ...Object.keys(profileNext.scenarios),
  'ege-profil-vectors-t2', 'ege-profil-part-two', 'ege-profil-divisibility',
  'ege-profil-log-inequalities', 'ege-profil-log-variable-base', 'ege-profil-log-nested'
]);

async function checkOfflineProfileMap(page, entry) {
  if (entry.slug === 'ege-profil-estimate-example') {
    const link = page.getByRole('link', { name: 'Профиль №19 · Оценка и достигающий её пример', exact: true });
    assert.equal(await link.getAttribute('href'), 'https://mathexam.space/ege-profil/part-two/#lesson/numbers-extremum');
  }
  if (!profileMapSlugs.has(entry.slug)) return;
  assert.equal(await page.locator('script[data-inline-source="/ege-profil/exam-map.js"]').count(), 1, entry.slug);
  const actual = await page.evaluate(() => ({
    year: ProfileExamMap.YEAR,
    entries: ProfileExamMap.entries.map(item => [item.number, item.part, item.points]),
    themes: [8, 12, 16].map(number => ProfileExamMap.get(number).id),
    start: [6, 9, 13, 16].map(number => ProfileExamMap.fromLegacyStart(number).id),
    partTwo: [14, 15, 16, 17, 18, 19, 20].map(number => ProfileExamMap.fromLegacyPartTwo(number).id)
  }));
  assert.equal(actual.year, 2027);
  assert.deepEqual(actual.entries, Array.from({ length: 19 }, (_, index) => [index + 1, index < 12 ? 1 : 2, index < 12 ? 1 : [2, 3, 2, 2, 3, 4, 4][index - 12]]));
  assert.equal(actual.entries.reduce((total, item) => total + item[2], 0), 32);
  assert.deepEqual(actual.themes, ['derivative', 'extrema', 'finance']);
  assert.deepEqual(actual.start, ['random-variables', 'calculus-legacy', 'finance', 'inequalities']);
  assert.deepEqual(actual.partTwo, ['part-two-equations', 'part-two-stereometry', 'inequalities', 'optimization', 'part-two-planimetry', 'parameters', 'numbers']);
}

async function checkPartTwoExamRoutes(page, taskId) {
  const readSavedWork = () => page.evaluate(async id => {
    await ProfilePartTwoApp.store.flush();
    return localStorage.getItem(ProfilePartTwoApp.store.key(id));
  }, taskId);
  const saved = await readSavedWork();
  for (const [hash, title, number, lesson] of [
    ['#exam/19', 'Задачи с параметром', 18, 'param-linear'],
    ['#fipi/2027/18', 'Задачи с параметром', 18, 'param-linear'],
    ['#exam/20', 'Числа и их свойства', 19, 'numbers-remainders'],
    ['#fipi/2027/19', 'Числа и их свойства', 19, 'numbers-remainders'],
    ['#exam/17', 'Моделирование и оптимизация', null, 'model-fence'],
    ['#topic/optimization', 'Моделирование и оптимизация', null, 'model-fence']
  ]) {
    const url = new URL(page.url());
    url.hash = hash;
    await page.goto(url.href);
    await page.reload();
    await page.locator('#main h1').waitFor();
    assert.equal(new URL(page.url()).protocol, 'file:');
    assert.equal(await page.locator('#main h1').innerText(), title, hash);
    assert.match(await page.locator('#main > .eyebrow').innerText(), number ? new RegExp('№\\s*' + number + '(?:\\D|$)') : /ДОПОЛНИТЕЛЬНАЯ ТЕМА/, hash);
    assert.equal(await page.locator('#main a[href$="#lesson/' + lesson + '"]').count(), 1, hash);
  }
  const finance = new URL(page.url());
  finance.hash = '#fipi/2027/16';
  await page.goto(finance.href);
  await page.reload();
  const link = page.getByRole('link', { name: 'Открыть финансовую подготовку', exact: true });
  assert.equal(await link.getAttribute('href'), 'https://mathexam.space/ege-profil/start/#fipi/2027/16');
  assert.match(await page.locator('#main').innerText(), /Полное решение можно сверить с образцом и показать преподавателю/);
  await page.locator('a[href="#task/h12-equal-annual-payments-4/independent"]').click();
  await page.locator('#proof-draft').fill('Нулевой остаток после второго платежа.');
  await page.locator('#final-0').fill('1254');
  await submit(page, '#final-form');
  await page.locator('#completion').waitFor();
  assert.match(await page.locator('.proof-status').innerText(), /требует проверки/);
  await page.reload();
  await page.locator('#proof-draft').waitFor();
  assert.equal(await page.locator('#proof-draft').inputValue(), 'Нулевой остаток после второго платежа.');
  await page.getByRole('link',{name:'Мой прогресс',exact:true}).click();
  const financeProgress=page.getByRole('region',{name:'№16 · Письменные финансовые задачи'});
  assert.match(await financeProgress.innerText(), /Самостоятельные ответы: 1/);
  assert.match(await page.locator('#main > .stats').innerText(), /264 условий/);
  assert.deepEqual(await readSavedWork(), saved, 'legacy and official routes preserve completed work, attempts and proof under the existing task key');
}

async function submit(page, selector) {
  await page.locator(`${selector} button[type=submit]`).click();
}

async function loadImage(locator) {
  await locator.waitFor({ state: 'visible' });
  await locator.scrollIntoViewIfNeeded();
  assert(await locator.evaluate(async img => { await img.decode(); return img.naturalWidth > 0; }));
}

async function checkPartTwoNumericDomain(page) {
  const task = partTwoLessons.find(lesson => lesson.id === 'numbers-remainders').tasks[3];
  await page.evaluate(id => { location.hash = '#task/' + id + '/independent'; }, task.id);
  const answer = page.locator('#final-0');
  const proof = page.locator('#proof-draft');
  const read = () => page.evaluate(async id => {
    await ProfilePartTwoApp.store.flush();
    return ProfilePartTwoApp.store.read(id);
  }, task.id);
  await answer.waitFor();
  for (let i = 1; i < task.final.length; i++) await page.locator('#final-' + i).fill(String(task.final[i].answers[0]));
  const note = 'Проверяю первый остаток и количество чисел.';
  await proof.fill(note);
  const expected = task.final[0].answers[0];
  for (const [expression, oldValue] of profileFirst.invalidNumericExamples) {
    await answer.fill(`(${expected})+(${expression})-${oldValue}`);
    await submit(page, '#final-form');
    const state = await read();
    assert(!state.completed && !state.independent, expression);
    assert(state.attempts.every(attempt => !attempt.correct));
    assert.equal(await page.locator('#completion').count(), 0);
  }
  const draft = await answer.inputValue();
  await page.reload();
  assert.equal(await answer.inputValue(), draft);
  assert.equal(await proof.inputValue(), note);
  await answer.fill(`(${expected})+(sqrt((-4)^2)-4)`);
  await submit(page, '#final-form');
  await page.locator('#completion').waitFor();
  const state = await read();
  assert(state.completed && state.independent);
}

async function checkPartTwoExactEquation(page) {
  const taskId = 'p14-circle-selection-7';
  await page.evaluate(id => { location.hash = '#task/' + id + '/independent'; }, taskId);
  await page.locator('#final-0').fill('x=-π/6+2πn; x=7π/6+2πn');
  const selected = page.locator('#final-1');
  await selected.fill('-17π/6; -13π/6');
  await submit(page, '#final-form');
  await page.locator('#feedback.error').waitFor();
  assert.equal(await page.locator('#completion').count(), 0);
  await selected.fill('-5π/6; -17π/6; -13π/6');
  await submit(page, '#final-form');
  await page.locator('#completion').waitFor();
  await page.reload();
  assert.equal(await selected.inputValue(), '-5π/6; -17π/6; -13π/6');
  assert(await page.evaluate(id => ProfilePartTwoApp.store.read(id).independent, taskId));
}

async function textbook(page, appName, courseName, lesson) {
  const task = await page.evaluate(({ courseName, lesson }) => window[courseName].lessons.find(item => item.id === lesson).tasks[0], { courseName, lesson });
  const example = page.locator('details.ce-help');
  await example.locator('summary').click();
  await loadImage(example.locator('img'));
  await example.locator('[data-ce-action=next]').click();
  await loadImage(example.locator('img'));
  await example.locator('[data-ce-action=play]').click();
  assert.match(await example.locator('img').getAttribute('src'), /^data:image\/gif/);
  await loadImage(example.locator('img'));
  await example.locator('[data-ce-action=play]').click();
  assert.match(await example.locator('img').getAttribute('src'), /^data:image\/png/);
  const answer = page.locator('#final-answer');
  const state = () => page.evaluate(({ appName, id }) => window[appName].getState().tasks[id], { appName, id: task.id });
  await submit(page, '#answer-form');
  assert(!(await state())?.correct, 'empty answer got credit');
  await answer.fill('987654321');
  await submit(page, '#answer-form');
  assert(!(await state())?.correct, 'wrong answer got credit');
  await answer.fill(task.answer);
  await submit(page, '#answer-form');
  assert((await state()).correct, 'correct answer was rejected');
}

const scenarios = {
  ...ogeNext,
  ...ogeFinal,
  ...profileFirst.scenarios,
  ...profileNext.scenarios,
  ...profileReasoning.scenarios,
  ...profileCourses.scenarios,
  async 'oge-task6-fractions'(page) {
    const expected = await page.evaluate(() => {
      const task = TASKS[order[pos]];
      return task.mode === 'numerator' || task.d === 1 ? String(task.n) : `${task.n}/${task.d}`;
    });
    await page.locator('#check').click();
    assert(await page.locator('#mark').evaluate(el => el.classList.contains('bad')));
    await page.locator('#ans').fill('1/0');
    await page.locator('#check').click();
    assert(await page.locator('#mark').evaluate(el => el.classList.contains('bad')));
    await page.locator('#ans').fill(expected);
    await page.locator('#check').click();
    assert.match(await page.locator('#mark').innerText(), /Верно/);
  },
  async 'oge-task9-equations'(page) {
    const card = page.locator('#mara-list > .task-card:not([hidden])').first();
    const check = card.getByRole('button', { name: 'Проверить', exact: true });
    await check.click();
    assert(!(await card.evaluate(node => node.classList.contains('solved'))));
    const input = card.locator(':scope > .field input').first();
    await input.fill('32');
    await check.click();
    assert(!(await card.evaluate(node => node.classList.contains('solved'))));
    await input.fill('-32');
    await check.click();
    assert(await card.evaluate(node => node.classList.contains('solved')));
  },
  async 'oge-task11-graphs-trainer'(page) {
    const previous = await page.locator('#m4-graphs svg').count();
    assert.equal(previous, 3);
    await page.locator('#m4-check').click();
    assert.match(await page.locator('#m4-soft').innerText(), /Заполни соответствие/);
    const key = await page.evaluate(() => M4.task.key.join(''));
    await page.locator('#m4-answer').fill(key.slice(1) + key[0]);
    await page.locator('#m4-check').click();
    assert(!(await page.locator('#m4-good').isVisible()));
    await page.locator('#m4-answer').fill(key);
    await page.locator('#m4-check').click();
    assert.match(await page.locator('#m4-good').innerText(), /Верно/);
    const lab = page.locator('#oge-video-models');
    await lab.locator('summary').first().click();
    assert(await lab.locator('[data-ovm-picker]').isVisible());
  },
  async 'oge-task14-progressions'(page) {
    await page.evaluate(() => {
      const task = { code: 'AP-VAL', text: 'a₁ = 3, d = 2. Найди a₅.', ans: T14.F(11), distract: [] };
      T14.buildQuiz = () => [task, task];
    });
    const quiz = page.locator('[data-page=quiz]');
    await quiz.locator('xpath=ancestor::details[1]/summary').click();
    await quiz.click();
    await page.locator('#q-start').click();
    await page.locator('#q-ok').click();
    assert.match(await page.locator('#q-fb').innerText(), /попытка не потрачена/);
    await page.locator('#q-dec').fill('10');
    await page.locator('#q-ok').click();
    assert.equal(await page.locator('#q-fb').innerText(), 'Неверно.');
    await page.locator('#q-next').click();
    await page.locator('#q-dec').fill('11');
    await page.locator('#q-ok').click();
    assert.equal(await page.locator('#q-fb').innerText(), 'Верно.');
  },
  async 'oge-task24-proofs'(page) {
    assert(await page.locator('.ocp-figure-main svg, .ocp-figure-shell svg, #view svg').first().isVisible());
    await page.locator('#courseSettings > summary').click();
    await page.locator('#tabs').getByRole('button', { name: 'Разбор', exact: true }).click();
    await page.locator('#view .mcard').filter({ hasText: 'Подобие треугольников в трапеции' }).click();
    const wrong = page.locator(`button[onclick^="pickCard({type:'x'"]`).first();
    await wrong.click();
    assert.equal(await page.evaluate(() => ST.placed), 0);
    const count = await page.evaluate(() => curTask().steps.length);
    for (let i = 0; i < count; i++) await page.locator(`button[onclick="pickCard({type:'s',i:${i}})"]`).click();
    assert(await page.evaluate(() => ST.solvedNow));
    assert(await page.locator('#view svg').first().isVisible());
  },
  async 'ege-baza-practice'(page) {
    await page.locator('#answerForm').waitFor();
    await submit(page, '#answerForm');
    assert.match(await page.locator('#feedback').innerText(), /Сначала запиши ответ/);
    const numbers = (await page.locator('.task-first-problem .task').innerText()).match(/\d+/g).map(Number);
    assert.equal(numbers.length, 2);
    const expected = String(Math.ceil(numbers[0] / numbers[1]));
    const input = page.locator('#answerForm input').first();
    await input.fill('987654321');
    await submit(page, '#answerForm');
    assert(await page.locator('#feedback').evaluate(el => el.classList.contains('bad')));
    await input.fill(expected);
    await submit(page, '#answerForm');
    assert(await page.locator('#feedback').evaluate(el => el.classList.contains('good')));
    assert(await input.isDisabled(), 'the accepted answer is locked in the offline edition');
    const another = page.getByRole('button', { name: 'Решить похожую без подсказки' });
    assert(await another.evaluate(button => button === document.activeElement));
    const statement = page.locator('.task-first-problem .task');
    const firstStatement = await statement.innerText();
    await another.click();
    const newStatement = await statement.innerText();
    assert.notEqual(newStatement, firstStatement);
    assert.equal(await input.inputValue(), '');
    assert.equal(await page.locator('#feedback').innerText(), '');
    const [needed, perPack] = newStatement.match(/\d+/g).map(Number);
    await input.fill(String(Math.ceil(needed / perPack)));
    await submit(page, '#answerForm');
    const next = page.locator('[data-journey-next]');
    assert(await next.evaluate(link => link === document.activeElement));
    assert.match(await next.getAttribute('href'), /^file:.*#lesson=/);
    const previous = page.url();
    await next.click();
    await page.waitForURL(url => url.href !== previous && url.protocol === 'file:' && url.hash.startsWith('#lesson='));
    const key = await page.evaluate(() => PathCourse.KEY);
    const recovery = new URL(page.url());
    recovery.search = '?practice=recovery';
    recovery.hash = 'practice=round';
    await page.goto(recovery.href);
    const saved = await page.evaluate(key => localStorage.getItem(key), key);
    const recoveryNumbers = (await statement.innerText()).match(/\d+/g).map(Number);
    await input.fill(String(Math.ceil(recoveryNumbers[0] / recoveryNumbers[1])));
    await submit(page, '#answerForm');
    await next.click();
    await page.waitForURL(url => url.protocol === 'file:' && url.hash === '#lesson=practice-change');
    assert.equal(new URL(page.url()).searchParams.get('practice'), 'recovery');
    assert.equal(await page.evaluate(() => PathCourse.KEY), key + '.separate');
    assert.equal(await page.evaluate(key => localStorage.getItem(key), key), saved);
  },
  async 'ege-profil-vectors-t2'(page) {
    assert(!(await page.locator('#connectBtn').isVisible()));
    assert(await page.getByRole('region', { name: 'Личный черновик' }).isVisible());
    assert(await page.locator('.profile-skill-slot').count());
    await page.locator('#modeFast').click();
    await page.locator('#checkBtn').click();
    assert.match(await page.locator('#feedback').innerText(), /Введите число/);
    const expected = await page.evaluate(() => String(cur.answer));
    await page.locator('#ans').fill('987654321');
    await page.locator('#checkBtn').click();
    assert.match(await page.locator('#feedback').innerText(), /неверно/i);
    await page.locator('#ans').fill(expected);
    await page.locator('#checkBtn').click();
    assert.match(await page.locator('#feedback').innerText(), /Верно/);
    const canvas = page.locator('#padCanvas');
    await canvas.scrollIntoViewIfNeeded();
    const before = await canvas.evaluate(node => node.toDataURL());
    const { x, y } = await canvas.boundingBox();
    await page.mouse.move(x + 20, y + 20);
    await page.mouse.down();
    await page.mouse.move(x + 70, y + 60, { steps: 4 });
    await page.mouse.up();
    assert.notEqual(await canvas.evaluate(node => node.toDataURL()), before);
  },
  async 'ege-profil-part-two'(page) {
    const graph = page.locator('a[href*="graph=plateau"]').first();
    await graph.waitFor();
    assert.match(await graph.getAttribute('href'), /^https:\/\/mathexam\.space\//);
    const task = partTwoLessons.find(lesson => lesson.exam === 15).tasks[3];
    await page.evaluate(id => { location.hash = `#task/${id}/independent`; }, task.id);
    await page.locator('#final-form').waitFor();
    assert(await page.locator('.condition').isVisible());
    await submit(page, '#final-form');
    assert.match(await page.locator('#feedback').innerText(), /Пустое поле/);
    for (let i = 0; i < task.final.length; i++) await page.locator(`#final-${i}`).fill(String(task.final[i].answers[0]));
    await page.locator('#final-0').fill('987654321');
    await submit(page, '#final-form');
    assert(!(await page.locator('#completion').isVisible()));
    await page.locator('#final-0').fill(String(task.final[0].answers[0]));
    await page.locator('#proof-draft').fill('Проверяю перпендикулярность по условию.');
    await submit(page, '#final-form');
    await page.locator('#completion').waitFor();
    await page.reload();
    assert.equal(await page.locator('#proof-draft').inputValue(), 'Проверяю перпендикулярность по условию.');
    await checkPartTwoNumericDomain(page);
    await checkPartTwoExactEquation(page);
    await checkPartTwoExamRoutes(page, task.id);

    const parameter = partTwoLessons.find(lesson => lesson.id === 'param-hole').tasks[3];
    const argument = '\nОграничиваю область допустимых значений.';
    await page.evaluate(id => { location.hash = `#task/${id}/independent`; }, parameter.id);
    await page.locator('#proof-review').waitFor({ state: 'attached' });
    await page.locator('#proof-draft').fill(argument);
    for (let i = 0; i < parameter.final.length; i++) await page.locator(`#final-${i}`).fill('987654321');
    await submit(page, '#final-form');
    await page.locator('#feedback.error').waitFor();
    await page.locator('#proof-jump').click();
    const marks = page.locator('#proof-review').getByRole('checkbox');
    assert.equal(await marks.count(), 4);
    await marks.first().check();
    await page.locator('#proof-review-count').getByText('Вы отметили 1 из 4 пунктов.').waitFor();
    await page.reload();
    assert.equal(await page.locator('#proof-draft').inputValue(), argument);
    await page.locator('#proof-jump').click();
    await marks.first().waitFor();
    assert(await marks.first().isChecked());
  },
  'makarychev8-algebra': page => textbook(page, 'MakarychevApp', 'MakarychevCourse', 'p16'),
  'peterson6-math': page => textbook(page, 'PetersonApp', 'PetersonCourse', 'p12')
};

const routes = {
  ...profileFirst.routes,
  'ege-baza-practice': '#lesson=round',
  'ege-profil-part-two': '#exam/19',
  'makarychev8-algebra': '#lesson/p16/0',
  'peterson6-math': '#lesson/p12/0'
};

function extractPackage(entry, target) {
  fs.mkdirSync(target);
  const zip = path.join(root, entry.package);
  execFileSync('python3', ['-c', `
from pathlib import Path
from zipfile import ZipFile
import sys
archive, target, slug = sys.argv[1:]
with ZipFile(archive) as package:
    assert package.testzip() is None
    assert sorted(package.namelist()) == sorted([
        slug+'.html', slug+'-deepseek-prompt.md', 'README.md', 'adapt-trainer.gif', 'adapt-trainer.png'])
    package.extractall(Path(target))
`, zip, target, entry.slug]);
  for (const file of [entry.downloadHtml, entry.prompt]) {
    assert.deepEqual(fs.readFileSync(path.join(target, path.basename(file))), read(file), file);
  }
  for (const extension of ['gif', 'png']) {
    const source = `${assetDir}/${entry.adaptation.gif || 'adapt-trainer'}.${extension}`;
    assert.deepEqual(fs.readFileSync(path.join(target, `adapt-trainer.${extension}`)), read(source), source);
  }
  assert.match(fs.readFileSync(path.join(target, 'README.md'), 'utf8'), /синхронная доска.*на сайте/);
}

function listen() {
  const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.md': 'text/plain', '.gif': 'image/gif', '.png': 'image/png' };
  const server = http.createServer((request, response) => {
    const url = new URL(request.url, 'http://localhost');
    const file = path.resolve(root, '.' + url.pathname + (url.pathname.endsWith('/') ? 'index.html' : ''));
    if (!file.startsWith(root + path.sep)) return response.writeHead(403).end();
    fs.readFile(file, (error, data) => {
      if (error) return response.writeHead(404).end();
      response.writeHead(200, { 'Content-Type': (mime[path.extname(file)] || 'application/octet-stream') + '; charset=utf-8' }).end(data);
    });
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

async function checkPanel(page, entry, width) {
  const panel = page.locator(`[data-trainer-download="${entry.slug}"]`);
  assert.equal(await panel.count(), 1);
  const details = panel.locator('details');
  assert.equal(await details.getAttribute('open'), null);
  const before = await page.evaluate(() => {
    const main = document.querySelector('main, .wrap, .app');
    return [main.getBoundingClientRect().width, document.documentElement.scrollWidth];
  });
  await details.locator('summary').press('Enter');
  assert.equal(await panel.locator('a[download]').count(), 3);
  assert.deepEqual(await panel.locator('a[download]').evaluateAll(links => links.map(link => link.getAttribute('href'))),
    [entry.downloadHtml, entry.prompt, entry.package]);
  assert(await panel.locator('.download-note').first().isVisible());
  assert.equal(await panel.locator('a[href^="/pedagogam/"]').getAttribute('href'),
    guide + '#' + (entry.adaptation.gif || 'adaptation-example'));
  for (const button of await panel.locator('a[download], .download-copy').all()) {
    const box = await button.boundingBox();
    assert(box && box.height >= 44 && box.x >= 0 && box.x + box.width <= width + 1, entry.slug);
  }
  const after = await page.evaluate(() => [document.querySelector('main, .wrap, .app').getBoundingClientRect().width, document.documentElement.scrollWidth]);
  assert.deepEqual(after, before, entry.slug + ' download panel changes trainer width or overflow');
  const without = await page.evaluate(() => {
    const panel = document.querySelector('[data-trainer-download]');
    const sheet = document.querySelector('link[href="/assets/download-panel.css"]').sheet;
    panel.hidden = true;
    sheet.disabled = true;
    const dimensions = [document.querySelector('main, .wrap, .app').getBoundingClientRect().width, document.documentElement.scrollWidth];
    sheet.disabled = false;
    panel.hidden = false;
    return dimensions;
  });
  assert.deepEqual(after, without, entry.slug + ' same trainer geometry with and without the panel');
}

async function run() {
  assert.equal(manifest.stage, '8');
  assert.equal(manifest.trainers.filter(entry => !entry.adaptation).length, 17);
  assert.equal(new Set(manifest.trainers.map(entry => entry.slug)).size, manifest.trainers.length);
  assert.deepEqual(new Set(entries.map(entry => entry.slug)), new Set(Object.keys(scenarios)));
  assert.equal(profileMapSlugs.size, 16);
  for (const entry of entries.filter(entry => profileMapSlugs.has(entry.slug))) {
    assert.equal(entry.inlineAssets.filter(asset => asset === '/ege-profil/exam-map.js').length, 1, entry.slug);
  }
  const estimateExample = entries.find(entry => entry.slug === 'ege-profil-estimate-example');
  assert(!estimateExample.inlineAssets.includes('/ege-profil/exam-map.js'));
  assert.match(read(estimateExample.downloadHtml).toString('utf8'),
    /<a href="\/ege-profil\/part-two\/#fipi\/2027\/19">Задание №19 профильного ЕГЭ<\/a>/);
  const filter = process.argv[2];
  const groups = {
    '--oge-next': ogeNext,
    '--oge-final': ogeFinal,
    '--profile-first': profileFirst.scenarios,
    '--profile-next': profileNext.scenarios,
    '--profile-reasoning': profileReasoning.scenarios,
    '--profile-courses': profileCourses.scenarios
  };
  assert(!filter || groups[filter] || scenarios[filter], 'unknown test filter');
  const selected = entries.filter(entry => !filter || filter === entry.slug || groups[filter]?.[entry.slug]);
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'mathexam-downloads-'));
  const server = await listen();
  const origin = `http://127.0.0.1:${server.address().port}`;
  const executablePath = process.env.CHROMIUM_EXECUTABLE_PATH;
  let browser;
  try {
    browser = await chromium.launch({ headless: true, executablePath });
    for (const [index, entry] of selected.entries()) {
      const target = path.join(output, entry.slug);
      extractPackage(entry, target);
      const extracted = pathToFileURL(path.join(target, `${entry.slug}.html`));
      const separate = pathToFileURL(path.join(root, entry.downloadHtml));
      for (const [width, url] of [[320, extracted], [1280, separate]]) {
        url.hash = routes[entry.slug] || '';
        const context = await browser.newContext({ offline: true, viewport: { width, height: 900 } });
        const page = await context.newPage();
        page.setDefaultTimeout(10000);
        const issues = [];
        page.on('pageerror', error => issues.push(error.message));
        page.on('request', request => { if (/^(https?|wss?):/.test(request.url())) issues.push(request.url()); });
        page.on('requestfailed', request => issues.push(request.url()));
        page.on('console', event => { if (event.type() === 'error') issues.push(event.text()); });
        await page.goto(url.href);
        assert(await page.locator('h1').first().isVisible(), entry.slug);
        assert.equal(await page.locator('[data-trainer-download]').count(), 0);
        await checkOfflineProfileMap(page, entry);
        if (width === 320 || entry.slug === 'ege-profil-part-two' || Object.values(groups).some(group => group[entry.slug])) {
          await scenarios[entry.slug](page, loadImage);
        }
        assert.deepEqual(issues, [], entry.slug);
        await context.close();
      }
      if (entry.slug === 'ege-profil-finance') await profileNext.checkEditedFinance(browser, entry, target);
      if (entry.slug === 'ege-profil-log-inequalities') await profileReasoning.checkEditedLog(browser, entry, target);
      if (entry.slug === 'ege-profil-divisibility') await profileCourses.checkEditedDivisibility(browser, entry, target);
      console.log(`PASS file:// ${index + 1}/${selected.length} ${entry.slug}`);
    }

    for (const width of [320, 1280]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      await context.route('**/*', route => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
      const page = await context.newPage();
      for (const entry of selected) {
        await page.goto(origin + entry.sourceHtml);
        await checkPanel(page, entry, width);
      }

      await page.goto(origin + '/trainers/oge-task9-equations.html');
      const panel = page.locator('[data-trainer-download]');
      await panel.locator('summary').click();
      await panel.locator('.download-wish').fill('Сделай задачи крупнее: $&');
      await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.copiedPrompt = text; } } }));
      await panel.locator('.download-copy').click();
      await page.waitForFunction(() => window.copiedPrompt?.includes('Сделай задачи крупнее: $&'));
      assert.match(await page.evaluate(() => window.copiedPrompt), /oge-task9-equations\.html/);
      assert.equal(await panel.locator('.download-prompt-text').isVisible(), false);
      await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('denied'); } } }));
      await panel.locator('.download-copy').click();
      const manual = panel.locator('.download-prompt-text');
      await manual.waitFor();
      assert(await manual.evaluate(node => node.selectionEnd === node.value.length && node.selectionStart === 0));
      await context.route('**/*-deepseek-prompt.md', route => route.fulfill({ status: 503 }));
      await page.reload();
      await panel.locator('summary').click();
      await panel.locator('.download-copy').click();
      await page.waitForFunction(() => document.querySelector('.download-copy-status').textContent.includes('скачать'));
      await context.unroute('**/*-deepseek-prompt.md');
      const [download] = await Promise.all([page.waitForEvent('download'), panel.locator('a[href$="-package.zip"]').click()]);
      assert.equal(download.suggestedFilename(), 'oge-task9-equations-package.zip');

      await page.goto(origin + guide);
      const gif = page.locator('details[data-trainer-gif=adapt-trainer]');
      assert.equal(await gif.locator('img').count(), 0, 'no autoplay');
      await gif.locator(':scope > summary').press('Enter');
      await loadImage(gif.locator('img'));
      const play = gif.getByRole('button', { name: 'Воспроизвести GIF' });
      await gif.getByRole('button', { name: 'Следующий кадр' }).click();
      assert.match(await gif.locator('.trainer-skill-gif-caption').innerText(), /Кадр 2 из 5/);
      await play.click();
      assert.match(await gif.locator('img').getAttribute('src'), /\.gif$/);
      await loadImage(gif.locator('img'));
      await gif.getByRole('button', { name: 'Остановить GIF' }).click();
      assert.match(await gif.locator('img').getAttribute('src'), /\.png$/);
      await gif.getByText('Все шаги текстом').click();
      assert.equal(await gif.locator('ol li:visible').count(), 5);
      await play.click();
      await gif.locator(':scope > summary').click();
      await page.waitForFunction(() => document.querySelector('[data-trainer-gif] img').getAttribute('src').endsWith('.png'));
      const geometry = page.locator('#adapt-geometry');
      await geometry.locator(':scope > summary').click();
      await loadImage(geometry.locator('img'));
      for (let i = 0; i < 4; i++) await geometry.getByRole('button', { name: 'Следующий кадр' }).click();
      assert.match(await geometry.locator('.trainer-skill-gif-caption').innerText(), /Кадр 5 из 5.*42.*48/);
      await geometry.getByRole('button', { name: 'Воспроизвести GIF' }).click();
      await loadImage(geometry.locator('img'));
      assert.match(await geometry.locator('img').getAttribute('src'), /adapt-geometry\.gif$/);
      const graph = page.locator('#adapt-graph');
      await graph.locator(':scope > summary').click();
      await loadImage(graph.locator('img'));
      for (let i = 0; i < 4; i++) await graph.getByRole('button', { name: 'Следующий кадр' }).click();
      assert.match(await graph.locator('.trainer-skill-gif-caption').innerText(), /Кадр 5 из 5/);
      await graph.getByRole('button', { name: 'Воспроизвести GIF' }).click();
      await loadImage(graph.locator('img'));
      assert.match(await graph.locator('img').getAttribute('src'), /adapt-graph\.gif$/);
      await graph.getByRole('button', { name: 'Остановить GIF' }).click();
      assert.match(await graph.locator('img').getAttribute('src'), /adapt-graph\.png$/);
      const derivative = page.locator('#adapt-derivative');
      await derivative.locator(':scope > summary').click();
      await loadImage(derivative.locator('img'));
      for (let i = 0; i < 4; i++) await derivative.getByRole('button', { name: 'Следующий кадр' }).click();
      assert.match(await derivative.locator('.trainer-skill-gif-caption').innerText(), /Кадр 5 из 5.*пустой ответ и 2 не подходят.*1,5 — верно/);
      await derivative.getByRole('button', { name: 'Воспроизвести GIF' }).click();
      await loadImage(derivative.locator('img'));
      assert.match(await derivative.locator('img').getAttribute('src'), /adapt-derivative\.gif$/);
      await derivative.getByRole('button', { name: 'Остановить GIF' }).click();
      assert.match(await derivative.locator('img').getAttribute('src'), /adapt-derivative\.png$/);
      const finance = page.locator('#adapt-finance');
      await finance.locator(':scope > summary').press('Enter');
      await loadImage(finance.locator('img'));
      for (let i = 0; i < 4; i++) await finance.getByRole('button', { name: 'Следующий кадр' }).click();
      assert.match(await finance.locator('.trainer-skill-gif-caption').innerText(), /Кадр 5 из 5.*375,1 отклоняется.*363,1 принимается/);
      await finance.getByRole('button', { name: 'Воспроизвести GIF' }).click();
      await loadImage(finance.locator('img'));
      assert.match(await finance.locator('img').getAttribute('src'), /adapt-finance\.gif$/);
      await finance.getByRole('button', { name: 'Остановить GIF' }).click();
      assert.match(await finance.locator('img').getAttribute('src'), /adapt-finance\.png$/);
      const log = page.locator('#adapt-log-inequality');
      await log.locator('summary').press('Enter');
      await loadImage(log.locator('img'));
      await log.getByRole('button', { name: 'Воспроизвести GIF' }).click();
      await loadImage(log.locator('img'));
      assert.match(await log.locator('img').getAttribute('src'), /adapt-log-inequality\.gif$/);
      await log.getByRole('button', { name: 'Остановить GIF' }).click();
      assert.match(await log.locator('img').getAttribute('src'), /adapt-log-inequality\.png$/);
      const divisibility = page.locator('#adapt-divisibility');
      await divisibility.locator('summary').press('Enter');
      await loadImage(divisibility.locator('img'));
      for (let frame = 0; frame < 4; frame++) await divisibility.getByRole('button', { name: 'Следующий кадр' }).click();
      assert.match(await divisibility.locator('.trainer-skill-gif-caption').innerText(), /Кадр 5 из 5.*2050.*2059/);
      await divisibility.getByRole('button', { name: 'Воспроизвести GIF' }).click();
      await loadImage(divisibility.locator('img'));
      assert.match(await divisibility.locator('img').getAttribute('src'), /adapt-divisibility\.gif$/);
      await context.close();
    }

    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(origin + guide);
    for (const example of await page.locator('[data-trainer-gif]').all()) {
      await example.locator(':scope > summary').press('Enter');
      assert(await example.evaluate(node => node.open));
      assert.equal(await example.locator('[data-trainer-gif-fallback] li:visible').count(), 5);
    }
    await page.goto(origin + '/trainers/oge-course/#downloads');
    const list = page.locator('#downloads a[download]');
    assert.equal(await list.count(), 21);
    for (const href of await list.evaluateAll(links => links.map(link => link.getAttribute('href')))) {
      assert.match(href, /^\/downloads\/trainers\/.*\.zip$/);
      assert((await context.request.head(origin + href)).ok());
    }
    await page.goto(origin + '/ege-profil/#downloads');
    const profileDownloads = page.locator('#downloads');
    assert.equal(await profileDownloads.getAttribute('open'), null);
    await profileDownloads.locator('summary').press('Enter');
    const profileLinks = await profileDownloads.locator('a[download]').evaluateAll(links => links.map(link => link.getAttribute('href')));
    const profileSlugs = [profileFirst, profileNext, profileReasoning, profileCourses].flatMap(group => Object.keys(group.scenarios));
    const expected = profileSlugs.map(slug => entries.find(entry => entry.slug === slug).package);
    assert.equal(profileLinks.length, expected.length);
    assert.deepEqual(new Set(profileLinks), new Set(expected));
    for (const href of profileLinks) assert((await context.request.head(origin + href)).ok());
    await context.close();
    console.log(`TRAINER_DOWNLOAD_ADAPT_OK: ${selected.length} packages, ${selected.length * 2} file:// opens and ${selected.length * 2} panel views`);
    if (Object.keys(ogeFinal).every(slug => selected.some(entry => entry.slug === slug))) {
      console.log('TRAINER_DOWNLOAD_STAGE4_OK: six OGE packages, graph intersections and saved written work');
    }
    if (Object.keys(profileFirst.scenarios).every(slug => selected.some(entry => entry.slug === slug))) {
      console.log('TRAINER_DOWNLOAD_STAGE5_OK: six profile packages, original START bank, vector foundations and derivative adaptation');
    }
    if (Object.keys(profileNext.scenarios).every(slug => selected.some(entry => entry.slug === slug))) {
      console.log('TRAINER_DOWNLOAD_STAGE6_OK: four profile packages, local function atlas and finance adaptation');
    }
    if (Object.keys(profileReasoning.scenarios).every(slug => selected.some(entry => entry.slug === slug))) {
      console.log('TRAINER_DOWNLOAD_STAGE7_OK: four reasoning packages, logarithm bounds and saved proof');
    }
    if (Object.keys(profileCourses.scenarios).every(slug => selected.some(entry => entry.slug === slug))) {
      console.log('TRAINER_DOWNLOAD_STAGE8_OK: edited divisibility and 186 offline sections cards');
    }
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(output, { recursive: true, force: true });
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });

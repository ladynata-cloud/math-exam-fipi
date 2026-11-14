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

const root = path.resolve(__dirname, '..');
const entries = manifest.trainers.filter(entry => entry.adaptation);
const read = file => fs.readFileSync(path.join(root, file));
const assetDir = 'assets/trainer-skill-gifs';
const guide = '/pedagogam/kak-skachat-i-adaptirovat-trenazher/';

async function submit(page, selector) {
  await page.locator(`${selector} button[type=submit]`).click();
}

async function loadImage(locator) {
  await locator.waitFor({ state: 'visible' });
  await locator.scrollIntoViewIfNeeded();
  assert(await locator.evaluate(async img => { await img.decode(); return img.naturalWidth > 0; }));
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
    const next = page.locator('[data-journey-next]');
    assert.match(await next.getAttribute('href'), /^file:.*#lesson=/);
    const previous = page.url();
    await next.click();
    await page.waitForURL(url => url.href !== previous && url.protocol === 'file:' && url.hash.startsWith('#lesson='));
  },
  async 'ege-profil-vectors-t2'(page) {
    assert(!(await page.locator('#connectBtn').isVisible()));
    assert(await page.getByRole('region', { name: 'Личный черновик' }).isVisible());
    assert(await page.locator('.profile-skill-slot').count());
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
  },
  'makarychev8-algebra': page => textbook(page, 'MakarychevApp', 'MakarychevCourse', 'p16'),
  'peterson6-math': page => textbook(page, 'PetersonApp', 'PetersonCourse', 'p12')
};

const routes = {
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
  for (const file of [entry.downloadHtml, entry.prompt, `${assetDir}/adapt-trainer.gif`, `${assetDir}/adapt-trainer.png`]) {
    assert.deepEqual(fs.readFileSync(path.join(target, path.basename(file))), read(file), file);
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
  for (const button of await panel.locator('a[download], .download-copy').all()) {
    const box = await button.boundingBox();
    assert(box && box.height >= 44 && box.x >= 0 && box.x + box.width <= width + 1, entry.slug);
  }
  const after = await page.evaluate(() => [document.querySelector('main, .wrap, .app').getBoundingClientRect().width, document.documentElement.scrollWidth]);
  assert.deepEqual(after, before, entry.slug + ' download panel changes trainer width or overflow');
}

async function run() {
  assert.equal(manifest.stage, '2');
  assert.equal(manifest.trainers.filter(entry => !entry.adaptation).length, 17);
  assert.equal(new Set(manifest.trainers.map(entry => entry.slug)).size, manifest.trainers.length);
  assert.deepEqual(new Set(entries.map(entry => entry.slug)), new Set(Object.keys(scenarios)));
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'mathexam-downloads-'));
  const server = await listen();
  const origin = `http://127.0.0.1:${server.address().port}`;
  const executablePath = process.env.CHROMIUM_EXECUTABLE_PATH;
  let browser;
  try {
    browser = await chromium.launch({ headless: true, executablePath });
    for (const [index, entry] of entries.entries()) {
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
        if (width === 320) await scenarios[entry.slug](page);
        assert.deepEqual(issues, [], entry.slug);
        await context.close();
      }
      console.log(`PASS file:// ${index + 1}/${entries.length} ${entry.slug}`);
    }

    for (const width of [320, 1280]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      await context.route('**/*', route => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
      const page = await context.newPage();
      for (const entry of entries) {
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
      await context.close();
    }

    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(origin + guide);
    await page.locator('[data-trainer-gif] > summary').click();
    assert.equal(await page.locator('[data-trainer-gif-fallback] li:visible').count(), 5);
    await page.goto(origin + '/trainers/oge-course/#downloads');
    const list = page.locator('#downloads a[download]');
    assert.equal(await list.count(), 7);
    for (const href of await list.evaluateAll(links => links.map(link => link.getAttribute('href')))) {
      assert.match(href, /^\/downloads\/trainers\/.*\.zip$/);
      assert((await context.request.head(origin + href)).ok());
    }
    await context.close();
    console.log('TRAINER_DOWNLOAD_ADAPT_OK: 10 packages, 20 file:// opens and 20 panel views');
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(output, { recursive: true, force: true });
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });

'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const {chromium} = require('playwright');
const {wrongStepAnswers} = require('./wrong-step-answers.cjs');
const course = require('../../stereo-course/textbook/data/course.json');
const groups = {
  solids: {manifests:[require('./inscribed-solids.json'),require('./circumspheres.json'),require('./round-bodies.json')],count:31},
  volume: {manifests:[require('./box-volumes.json')],count:21},
  prism: {manifests:[require('./prism-volumes.json')],count:26},
  cross: {manifests:[require('./cross-sections.json')],count:3},
  oblique: {manifests:[require('./oblique-prisms.json')],count:12}
};
const group = groups[process.env.TEXTBOOK_PRACTICE_GROUP || 'solids'];
assert(group, 'Unknown textbook practice group');
const manifests = group.manifests;
const root = path.resolve(__dirname, '../..');
const cards = course.lessons.filter(card => manifests.some(manifest => Object.hasOwn(manifest.cards, card.id)));
const contentTypes = {'.html':'text/html;charset=utf-8','.js':'application/javascript','.css':'text/css','.json':'application/json'};

async function serve(request, response) {
  const url = new URL(request.url, 'http://localhost');
  let target = path.resolve(root, '.' + decodeURIComponent(url.pathname));
  if (!target.startsWith(root + path.sep)) return response.writeHead(403).end();
  if (url.pathname.endsWith('/')) target = path.join(target, 'index.html');
  try {
    const bytes = await fs.readFile(target);
    response.setHeader('Content-Type', contentTypes[path.extname(target)] || 'application/octet-stream');
    response.end(bytes);
  } catch {
    response.writeHead(404).end();
  }
}

async function exercise(page, card, base, width) {
  await page.goto(base + '?exercise=' + card.id + '#' + card.id);
  await page.waitForFunction(title => document.querySelector('main>header>h1')?.textContent === title, card.title);
  const model = page.locator('[data-main-model] svg');
  async function checkFirstScreen() {
    const bounds = await model.boundingBox();
    assert(bounds && bounds.width >= 180 && bounds.height >= 260 && bounds.y + bounds.height <= 901,
      card.id + ' model on first screen at ' + width + 'px: ' + JSON.stringify(bounds));
  }
  await checkFirstScreen();
  if (width === 320 && card.id === 'ex-main-0446') {
    const font = await page.addStyleTag({content: '.textbook-reading { font-family: "DejaVu Sans", sans-serif; }'});
    try {
      await page.evaluate(() => document.fonts.ready);
      await checkFirstScreen();
    } finally {
      await font.evaluate(node => node.remove());
    }
  }
  assert.equal(await page.locator('[data-step]').count(), 0);
  const views = new Set([await model.getAttribute('data-view')]);
  const errors = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  assert(errors <= 1, card.id + ': no horizontal scrolling at ' + width);
  const before = await model.getAttribute('data-yaw');
  await page.getByRole('button', {name:'Повернуть вправо', exact:true}).click();
  assert.notEqual(await model.getAttribute('data-yaw'), before);
  const out = process.env.INSCRIBED_SOLIDS_ARTIFACTS;
  if (out) {
    await fs.mkdir(out, {recursive:true});
    await page.screenshot({path:path.join(out, width + '-' + card.id + '.png')});
  }

  await page.locator('[data-main-help]>summary').click();
  for (const hint of card.help) {
    const toggle = page.locator('[data-help="' + hint.id + '"]>summary');
    await toggle.click();
    await page.waitForFunction(view => document.querySelector('[data-main-model] svg')?.dataset.view === view, hint.view || 'neutral');
    views.add(await model.getAttribute('data-view'));
    await toggle.click();
  }
  let checked = 0;
  for (const step of card.steps) {
    await page.locator('[data-steps]+button').click();
    const section = page.locator('[data-step="' + step.id + '"]');
    await section.locator(':scope > details > summary').click();
    views.add(await model.getAttribute('data-view'));
    if (!step.input) continue;
    const field = section.getByLabel(step.input.prompt, {exact:true});
    const button = section.getByRole('button', {name:'Проверить этот шаг'});
    const feedback = section.locator('form [role="status"]');
    for (const wrong of wrongStepAnswers(card.id, step)) {
      await field.fill(wrong);
      await button.click();
      assert.equal(await feedback.getAttribute('data-answer-status'), 'wrong', card.id + ' ' + step.id);
      assert((await feedback.textContent()).length > 10);
    }
    await field.fill(step.input.accepted[0]);
    await button.click();
    assert.equal(await feedback.getAttribute('data-answer-status'), 'correct', card.id + ' ' + step.id);
    checked++;
  }
  assert(checked >= 1);
  assert.deepEqual([...views].sort(), Object.keys(card.visualization.model.views).sort(), card.id + ': reachable figure views');
  const final = page.locator('#final-answer');
  const text = card.answer.accepted?.[0] || 'Мой довод опирается на перпендикулярность и касание.';
  await final.fill(text);
  await page.locator('[data-final-form] button[type="submit"]').click();
  const feedback = page.locator('[data-final-feedback]');
  if (card.answer.mode === 'exact') assert.equal(await feedback.getAttribute('data-answer-status'), 'correct');
  else assert.match(await feedback.innerText(), /сохранено/u);
  await page.reload();
  await page.waitForFunction(title => document.querySelector('main>header>h1')?.textContent === title, card.title);
  assert.equal(await final.inputValue(), text);
  for (const step of card.steps.filter(step => step.input))
    assert.equal(await page.locator('#step-' + step.id).inputValue(), step.input.accepted[0]);
  return checked;
}

(async () => {
  let server, browser;
  try {
    let base = process.env.INSCRIBED_SOLIDS_LIVE_URL;
    if (!base) {
      server = http.createServer(serve);
      await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
      base = 'http://127.0.0.1:' + server.address().port + '/stereo-course/textbook/';
    }
    browser = await chromium.launch({headless:true, executablePath:process.env.GEOMETRY_CHROMIUM});
    const errors = [];
    let checks = 0;
    for (const width of [320,390,1280]) {
      const context = await browser.newContext({viewport:{width,height:900}});
      const page = await context.newPage();
      page.setDefaultTimeout(90000);
      page.on('pageerror', error => errors.push(error.message));
      for (const card of cards) checks += await exercise(page, card, base, width);
      await context.close();
    }
    assert.equal(cards.length,group.count);
    assert.deepEqual(errors, []);
    console.log('TEXTBOOK_PRACTICE_BROWSER_OK: ' + cards.length*3 + ' phone and desktop journeys, ' + checks + ' wrong/correct step checks, model states and retained drafts');
  } finally {
    await browser?.close();
    if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
  }
})().catch(error => {console.error(error);process.exitCode = 1;});

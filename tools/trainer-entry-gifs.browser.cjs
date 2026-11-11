'use strict';

const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');

const entries = [
  '/trainers/long-division-stepwise.html',
  '/trainers/long-division-claude.html',
  '/trainers/oge-basics/multiplication-division/division-path.html',
  '/trainers/oge-basics/multiplication-division/quotient-estimate.html',
  '/trainers/rounding-stepwise.html',
  '/trainers/oge-task6-fractions.html',
  '/trainers/oge-basics/fraction-meaning.html',
  '/trainers/oge-basics/fraction-common-denominator.html',
  '/trainers/oge-basics/percentages/',
  '/trainers/oge-basics/percentages/percent-of-number-and-whole.html',
  '/trainers/oge-1-5-trainers/percent-table-trainer.html',
  '/trainers/simple-equations-stepwise.html',
  '/trainers/oge-task9-equations.html',
  '/trainers/oge-task11-graphs-trainer.html',
  '/trainers/oge-task15-triangles.html',
  '/trainers/oge-task16-circle.html',
  '/trainers/oge-task17-quadrilaterals.html',
  '/trainers/oge-task18-grid.html',
  '/trainers/task19-trainer.html',
  '/oge/geometry/task-15-external-angle.html',
  '/trainers/oge-1-5-trainers/practice-1-5-entry-diagnostic-2026.html',
  '/stereo-course/textbook/#ex-main-0346',
  '/ege-profil/start/#practice/geo-right/guided',
  '/geometry-course/trainers/ch4-p1-t2-proof-angle-sum.html',
  '/geometry-course/trainers/ch2-p3-t2-proof-asa.html',
  '/trainers/ege-profile/log-inequalities/nested.html',
  '/trainers/negative-numbers-alternative.html',
  ...['delenie-ugolkom', 'obyknovennye-drobi', 'procenty', 'lineynye-uravneniya', 'oge-geometriya']
    .map(topic => '/topics/' + topic + '/')
];

const examples = '[data-trainer-entry-examples]';

async function activateResults(page, route) {
  if (route.includes('percent-table-trainer')) {
    assert.equal(await page.locator(examples).isVisible(), false);
    await page.locator('#practice-to-check:visible, #checkpoint-cta-btn:visible').first().click();
    await page.locator('[data-check-level="standard"]').click();
    for (let question = 0; question < 5; question += 1) {
      await page.locator('#check-input').fill('1');
      await page.locator('#check-save').click();
    }
  }
  if (route.includes('entry-diagnostic-2026')) {
    assert.equal(await page.locator(examples).isVisible(), false);
    await page.locator('#start-btn').click();
    for (let question = 0; question < 9; question += 1) await page.locator('#skip-btn').click();
    page.once('dialog', dialog => dialog.accept());
    await page.locator('#finish-btn').click();
  }
}

async function checkRoute(page, origin, route, width) {
  const response = await page.goto(origin + route, { waitUntil: 'domcontentloaded' });
  assert.equal(response.status(), 200, route);
  await activateResults(page, route);
  const group = page.locator(examples);
  await group.waitFor().catch(error => {
    throw new Error(route + ': ' + error.message);
  });
  assert.equal(await group.count(), 1, route);
  const cards = group.locator(':scope > details');
  assert.equal(await cards.count(), 2, route);
  const slugs = await cards.evaluateAll(nodes => nodes.map(node => node.dataset.trainerSkillGif));
  assert.equal(new Set(slugs).size, 2, route);
  const bounds = await group.boundingBox();
  assert.ok(bounds.x >= -1 && bounds.x + bounds.width <= width + 1, route + ' layout');
  const storage = () => page.evaluate(() => ({
    local: { ...localStorage }, session: { ...sessionStorage }
  }));
  const saved = await storage();
  for (const card of [cards.first(), cards.last()]) {
    const summary = card.locator(':scope > summary');
    await summary.click();
    const image = card.locator('img');
    await image.waitFor();
    await image.evaluate(img => img.decode());
    assert.match(await image.getAttribute('src'), /\.png$/);
    await card.getByRole('button', { name: 'Следующий кадр' }).click();
    assert.match(await card.locator('.trainer-skill-gif-caption').innerText(), /Кадр 2 из/);
    const play = card.getByRole('button', { name: 'Воспроизвести GIF' });
    await play.click();
    await image.evaluate(img => img.decode());
    assert.match(await image.getAttribute('src'), /\.gif$/);
    await summary.click();
    await card.getByRole('button', { name: 'Воспроизвести GIF', includeHidden: true }).waitFor({ state: 'attached' });
    assert.match(await image.getAttribute('src'), /\.png$/);
  }
  assert.deepEqual(await storage(), saved, route + ' saved learning state');
}

async function checkRemediation(page, origin) {
  await page.goto(origin + '/ege-baza/path/#lesson=practice-percent-whole');
  const panel = page.locator('#ege-remediation');
  const optional = page.locator('#ege-remediation + [data-trainer-learning-options]');
  for (const [id, slug] of [['fractions', 'fractions'], ['equations', 'oge-equations']]) {
    await page.evaluate(id => window.EgeRemediation.show({ id, value: '11', expected: 2 }), id);
    await optional.waitFor();
    assert.equal(await panel.locator('a').count(), 1, 'one return-to-lesson link');
    assert.equal(await optional.locator('[data-trainer-skill-gif]').getAttribute('data-trainer-skill-gif'), slug);
    assert.equal(await optional.locator('a[href="/lessons/#contact"]').count(), 1);
  }
  await page.evaluate(() => window.EgeRemediation.show({ id: 'not-a-skill', value: '11', expected: 2 }));
  assert.equal(await panel.count(), 0);
  assert.equal(await page.locator('[data-trainer-learning-options]').count(), 0, 'no outdated examples');
}

async function main() {
  const suppliedOrigin = process.env.TRAINER_GIF_TEST_ORIGIN;
  const origin = suppliedOrigin || 'http://127.0.0.1:8397';
  const server = suppliedOrigin ? null : spawn('python3', ['-m', 'http.server', '8397', '--bind', '127.0.0.1'], {
    cwd: require('node:path').resolve(__dirname, '..'), stdio: 'ignore'
  });
  let browser;
  try {
    if (server) {
      for (let attempt = 0; attempt < 30; attempt += 1) {
        if (await fetch(origin).then(response => response.ok).catch(() => false)) break;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    browser = await chromium.launch({
      headless: true,
      executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined
    });
    for (const width of [320, 1280]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
      const page = await context.newPage();
      page.setDefaultTimeout(15000);
      for (const route of entries) await checkRoute(page, origin, route, width);
      await checkRemediation(page, origin);
      console.log('TRAINER_ENTRY_GIFS_OK', width, entries.length, 'entries, two GIFs each and one EGE remediation case');
      await context.close();
    }
  } finally {
    await browser?.close();
    server?.kill();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

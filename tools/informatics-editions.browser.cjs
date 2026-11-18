'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');

const directory = path.join(__dirname, '../trainers/informatics-versions');
const output = process.env.INFORMATICS_SCREENS || 'artifacts/informatics-editions';
const origin = 'https://editions.test';
const slug = 'oge-informatics-1-10-tutor';
fs.mkdirSync(output, {recursive: true});

async function main() {
  const options = process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {};
  const browser = await chromium.launch(options);
  try {
    const context = await browser.newContext({viewport:{width:1220, height:920}});
    await context.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.origin !== origin) return route.abort();
      const file = path.resolve(directory, '.' + url.pathname);
      if (!file.startsWith(directory + path.sep) || !fs.existsSync(file)) return route.abort();
      return route.fulfill({path:file});
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin + '/player.html');
    await page.evaluate(() => localStorage.setItem('ogeInfoTrainerStats', 'main-site-marker'));
    const scriptEvidence = {};
    for (const edition of ['june', 'november']) {
      const params = new URLSearchParams({task:slug, edition});
      await page.goto(origin + '/player.html?' + params);
      const frameLocator = page.frameLocator('iframe');
      await frameLocator.locator('[data-topic="9"]').waitFor();
      const frame = page.frames().find(frame => frame.url() === 'about:srcdoc');
      assert(frame);
      const log = {};
      const find = selector => frame.locator(selector);
      const seed = async value => {
        if (edition === 'june') {
          await frame.evaluate(value => {
            let state = value;
            Math.random = () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296);
          }, value);
        } else {
          await frame.evaluate(value => {Math.random = () => value / 4294967296;}, value);
        }
      };
      const capture = async name => {
        await find('#trainingCard').screenshot({path:path.join(output, edition + '-' + name + '.png'), animations:'disabled'});
      };
      const accept = async answer => {
        await find('#s_tutorInput').fill(answer);
        await find('#s_tutorInput').press('Enter');
        assert.match(await find('[data-tutor-fb]').getAttribute('class'), /good/);
      };

      await seed(19);
      await find('[data-topic="9"]').click();
      await capture('01-task');
      await find('#answerInput').fill('5');
      await find('#answerInput').press('Enter');
      log.feedback = await find('#feedback').innerText();
      log.solutionAfterError = await find('#solutionBox').isVisible();
      assert.equal(log.solutionAfterError, edition === 'june');
      await capture('02-attempt');
      await find('#tutorOpenBtn').click();
      for (const answer of (edition === 'june' ? ['H','1'] : ['1','1'])) {
        await accept(answer);
        await find('[data-tutor-next]').click();
      }
      assert.match(await find('.tutor-question').innerText(), /F/);
      await find('#s_tutorInput').fill('0');
      await find('#s_tutorInput').press('Enter');
      log.stepError = await find('[data-tutor-fb]').innerText();
      log.hintAfterError = await find('[data-tutor-hint-box]').isVisible();
      await capture('03-error');
      if (!log.hintAfterError) await find('[data-tutor-hint]').click();
      assert(await find('[data-tutor-hint-box]').isVisible());
      await capture('04-hint');
      await accept('1');
      if (edition === 'november') assert.equal(await find('[data-city="F"] .path-count').textContent(), '1');
      await capture('05-correct-step');
      await find('[data-tutor-close]').click();
      await find('#tutorOpenBtn').click();
      log.reopen = await find('.tutor-question').innerText();
      if (edition === 'november') assert.match(log.reopen, /F/);
      await find('[data-tutor-close]').click();
      await find('#answerInput').fill('6');
      await find('#answerInput').press('Enter');
      assert.match(await find('#feedback').getAttribute('class'), /good/);
      await capture('06-solved');
      await seed(31);
      await find(edition === 'june' ? '#newTaskBtn' : '#similarBtn').click();
      await find('#answerInput').fill('7');
      await find('#answerInput').press('Enter');
      assert.match(await find('#feedback').getAttribute('class'), /good/);
      await capture('07-new-task');
      scriptEvidence[edition] = log;
    }
    assert.deepEqual(errors, []);
    const persisted = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
    assert.equal(persisted.ogeInfoTrainerStats, 'main-site-marker');
    for (const edition of ['june','november']) {
      const state = JSON.parse(persisted['mathexam.informatics.2026.' + edition + '.' + slug]);
      assert(JSON.parse(state.ogeInfoTrainerStats).attempts > 0);
    }
    // New visitors and returning visitors must see the same article example.
    // Its rehearsals and reset must leave the ordinary editions and live site intact.
    for (const edition of ['june','november']) {
      const url = origin + '/player.html?' + new URLSearchParams({task:slug, edition, example:'paths-article'});
      const frame = page.frameLocator('iframe');
      const articleKey = 'mathexam.informatics.2026.' + edition + '.' + slug + '.example.paths-article';
      await page.goto(url);
      await frame.locator('[data-topic="9"].active').waitFor();
      await frame.locator('#answerInput').fill('6');
      await frame.locator('#answerInput').press('Enter');
      assert.ok(await frame.locator('#feedback.good').isVisible());
      await page.waitForFunction(key => {
        const store = JSON.parse(localStorage.getItem(key) || '{}');
        return JSON.parse(store.ogeInfoTrainerStats || '{}').attempts > 0;
      }, articleKey);
      if (edition === 'november') {
        await frame.locator('#tutorOpenBtn').click();
        await frame.locator('#s_tutorInput').fill('1');
        await frame.locator('#s_tutorInput').press('Enter');
        await frame.locator('[data-tutor-next]').click();
        await page.waitForFunction(key => {
          const store = JSON.parse(sessionStorage.getItem(key) || '{}');
          return JSON.parse(store['ogeInfoPracticeSession-v1'] || '{}').work?.stepIndex === 1;
        }, articleKey);
      }
      await page.reload();
      await frame.locator('[data-topic="9"].active').waitFor();
      if (edition === 'november') {
        assert.equal(await frame.locator('.active-city').getAttribute('data-city'), 'G');
        assert.equal(await frame.locator('[data-city="H"] .path-count').textContent(), '1');
      }
      await frame.locator('#answerInput').fill('6');
      await frame.locator('#answerInput').press('Enter');
      assert.ok(await frame.locator('#feedback.good').isVisible(), edition + ' retains the six-path example on reload');
      page.once('dialog', dialog => dialog.accept());
      await frame.locator('#resetBtn').click();
      await page.waitForFunction(key => {
        const store = JSON.parse(localStorage.getItem(key) || '{}');
        return JSON.parse(store.ogeInfoTrainerStats || '{}').attempts === 0;
      }, articleKey);
    }
    for (const [key, value] of Object.entries(persisted)) {
      assert.equal(await page.evaluate(k => localStorage.getItem(k), key), value);
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, 'scenarios.json'), JSON.stringify(scriptEvidence, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch(error => {console.error(error);process.exitCode = 1;});

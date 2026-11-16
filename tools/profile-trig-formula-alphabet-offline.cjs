'use strict';
// Prove the distributable bytes run as file:// with networking disabled.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const { root, artifacts, launchBrowser, ready, openTask, enterAnswer, stateOf, submit, layout, exerciseLab } = require('./profile-trig-formula-alphabet.browser.cjs');
const slug = 'ege-profil-formula-alphabet';
const source = path.join(root, 'downloads/trainers', slug, slug + '.html');
const archive = path.join(root, 'downloads/trainers', slug, slug + '-package.zip');
const digest = value => crypto.createHash('sha256').update(value).digest('hex');

async function main() {
  assert(fs.existsSync(source), 'Build the authored standalone HTML before offline validation');
  assert(fs.existsSync(archive), 'Build the ZIP before offline validation');
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'mathexam-formula-offline-'));
  const isolated = path.join(scratch, 'standalone.html');
  fs.copyFileSync(source, isolated); // No adjacent assets: single-file promise.
  const extracted = path.join(scratch, 'zip');
  fs.mkdirSync(extracted);
  execFileSync('python3', ['-c',
    'import pathlib,sys,zipfile\nroot=pathlib.Path(sys.argv[2]).resolve()\nwith zipfile.ZipFile(sys.argv[1]) as z:\n for n in z.namelist():\n  p=(root/n).resolve()\n  if root not in p.parents and p != root: raise ValueError("Unsafe archive path")\n z.extractall(root)\n',
    archive, extracted]);
  const packaged = path.join(extracted, slug + '.html');
  assert(fs.existsSync(packaged), 'ZIP contains its advertised trainer entry');
  assert.equal(digest(fs.readFileSync(packaged)), digest(fs.readFileSync(source)), 'HTML and ZIP carry the same trainer bytes');
  const report = { complete: false, sourceHash: digest(fs.readFileSync(source)), zipHash: digest(fs.readFileSync(archive)), runs: [] };
  fs.mkdirSync(artifacts, { recursive: true });
  const save = () => fs.writeFileSync(path.join(artifacts, 'offline-evidence.json'), JSON.stringify(report, null, 2) + '\n');
  let browser;
  try {
    browser = await launchBrowser();
    for (const [label, file, width] of [['standalone', isolated, 320], ['zip', packaged, 1280]]) {
      const context = await browser.newContext({ offline: true, viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      const page = await context.newPage(); page.setDefaultTimeout(15000);
      const errors = [], network = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('requestfailed', request => errors.push('failed: ' + request.url()));
      page.on('request', request => { if (/^(https?|wss?):/.test(request.url())) network.push(request.url()); });
      await page.goto(pathToFileURL(file).href); await ready(page);
      const counts = await page.evaluate(() => {
        const modules = window.MathExamFormulaData.modules;
        return [modules.length, modules.reduce((n, m) => n + m.skills.length, 0), modules.reduce((n, m) => n + m.skills.reduce((s, k) => s + k.tasks.length, 0), 0)];
      });
      assert.deepEqual(counts, [18, 54, 324], label + ': complete authored content');
      await page.locator('[data-action="route"][data-route="formulas"]').click();
      assert.equal(await page.locator('.fa-module').count(), 8, label + ': formula route');
      await page.locator('.fa-module[data-module="m07"]').click();
      assert.equal(await page.locator('.fa-skill').count(), 3);
      let task = await openTask(page, 'm07-s1-01');
      await enterAnswer(page, task); await submit(page, task, 'independent');
      task = await openTask(page, 'm07-s1-02');
      await page.locator('[data-action="hint"]').click();
      await page.locator('#fa-answer').fill(task.answers[0]);
      await page.reload(); await ready(page);
      assert.equal(await page.locator('#fa-answer').inputValue(), task.answers[0], label + ': draft survives offline reload');
      assert.equal((await stateOf(page, task.id)).attempt.assisted, true);
      await submit(page, task, 'assisted');
      const lab = await page.evaluate(() => window.MathExamFormulaData.investigations.find(l => l.kind === 'domain'));
      assert(lab, 'domain investigation exists'); await exerciseLab(page, lab);
      await page.reload(); await ready(page);
      assert.equal(await page.evaluate(id => window.MathExamFormulaApp.store.state.investigations[id], lab.id), true, label + ': investigation result survives offline reload');
      await page.locator('.fa-toolbar [data-action="home"]').click();
      await layout(page, label + ' ' + width);
      await page.screenshot({ path: path.join(artifacts, 'offline-' + label + '-' + width + '.png'), fullPage: true });
      assert.deepEqual(network, [], label + ': no attempted external requests');
      assert.deepEqual(errors, [], label + ': no runtime errors or failed requests');
      report.runs.push({ label, width, content: counts, tasks: 2, investigation: lab.id, networkRequests: 0, errors: 0 });
      await context.close();
    }
    report.complete = true; save();
    console.log('PROFILE_TRIG_FORMULA_ALPHABET_OFFLINE_OK: standalone isolated HTML and matching ZIP; file://; networking disabled; 18/54/324; assembly/write/help/reload/model');
  } catch (error) { report.failure = error.stack; save(); throw error; }
  finally { if (browser) await browser.close(); }
}
module.exports = { main };
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });

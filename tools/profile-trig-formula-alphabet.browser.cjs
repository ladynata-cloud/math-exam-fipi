'use strict';
// Exercise the actual public entry and controls. Programmatic routing is used
// only to exhaustively render authored material, never to submit or mark work.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const entry = '/ege-profil/trainers/trig-sum-to-product.html';
const artifacts = path.resolve(process.env.FORMULA_ALPHABET_ARTIFACTS || path.join(root, '..', 'formula-browser-artifacts'));

async function launchBrowser() {
  const executablePath = process.env.CHROMIUM_EXECUTABLE_PATH || (fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
  return chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
}
async function serve() {
  const server = http.createServer((req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://local').pathname);
      if (pathname === '/favicon.ico') return res.writeHead(204).end();
      let file = path.resolve(root, '.' + pathname);
      if (file !== root && !file.startsWith(root + path.sep)) return res.writeHead(403).end();
      if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
      const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml' };
      res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
      res.setHeader('Cache-Control', 'no-store');
      res.end(fs.readFileSync(file));
    } catch (_) { res.writeHead(404).end(); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  return { server, origin: 'http://127.0.0.1:' + server.address().port };
}
async function ready(page) {
  await page.waitForFunction(() => window.MathExamFormulaApp && window.MathExamFormulaData && document.querySelector('#formula-alphabet h1'));
  assert.equal(await page.locator('body').evaluate(node => node.classList.contains('formula-alphabet-mode')), true, 'canonical entry opens the alphabet by default');
}
async function taskData(page, id) {
  return page.evaluate(id => {
    for (const m of window.MathExamFormulaData.modules) for (const s of m.skills) {
      const task = s.tasks.find(t => t.id === id);
      if (task) return { ...task, skillId: s.id, moduleId: m.id };
    }
    throw new Error('Unknown authored task ' + id);
  }, id);
}
async function openTask(page, id) {
  const task = await taskData(page, id);
  await page.evaluate(t => window.MathExamFormulaApp.startTask(t.skillId, t.id), task);
  assert.equal(await page.locator('.fa-task').getAttribute('data-task-id'), id);
  return task;
}
function tokenSequence(answer, tokens) {
  const ways = new Map([[0, []]]);
  for (let i = 0; i <= answer.length; i++) if (ways.has(i)) for (const token of tokens) {
    if (token && answer.startsWith(token, i) && !ways.has(i + token.length)) ways.set(i + token.length, [...ways.get(i), token]);
  }
  return ways.get(answer.length);
}
async function enterAnswer(page, task, answer = task.answers[0]) {
  if (task.kind === 'write') return page.locator('#fa-answer').fill(answer);
  if (task.kind === 'choice') {
    const radios = page.locator('input[name="fa-answer"]');
    const i = await radios.evaluateAll((nodes, answer) => nodes.findIndex(node => node.value === answer), answer);
    assert(i >= 0, task.id + ': intended option rendered');
    return radios.nth(i).check();
  }
  const parts = tokenSequence(answer, task.tokens);
  assert(parts, task.id + ': intended answer is constructible');
  await page.locator('[data-action="clear"]').click();
  for (const token of parts) {
    const bank = page.locator('[data-token]');
    const i = await bank.evaluateAll((nodes, token) => nodes.findIndex(node => node.dataset.token === token), token);
    assert(i >= 0, task.id + ': authored block exists');
    await bank.nth(i).click();
  }
}
async function stateOf(page, taskId) {
  return page.evaluate(id => {
    const store = window.MathExamFormulaApp.store;
    const a = store.current(id);
    return { attempt: a, skill: a && store.state.skills[a.skillId], summary: store.summary() };
  }, taskId);
}
async function submit(page, task, expected) {
  await page.locator('#fa-check').click();
  const { attempt, skill } = await stateOf(page, task.id);
  assert.equal(attempt.status, expected, task.id + ': outcome after real submit');
  assert.equal(attempt.closed, true);
  assert.equal(skill.independent.includes(task.id), expected === 'independent', task.id + ': independent evidence');
  assert.equal(await page.locator('#fa-check').isDisabled(), true, 'closed attempt cannot be resubmitted');
  assert.equal(await page.locator('[data-action="next"]').evaluate(node => document.activeElement === node), true, 'successful submit moves focus to next action');
}
async function layout(page, label) {
  const result = await page.evaluate(() => ({ width: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  if (result.document > result.width + 1 || result.body > result.width + 1) {
    // Preserve the actual failed page and geometry before the context closes.
    // The assertion below is unchanged; diagnostics never turn failure into pass.
    try {
      const offending = await page.evaluate(() => [...document.querySelectorAll('body *')].map(node => {
        const rect = node.getBoundingClientRect(), style = getComputedStyle(node);
        return { tag: node.tagName, id: node.id, className: node.getAttribute('class'), action: node.getAttribute('data-action'), text: (node.textContent || '').trim().slice(0,160), left: rect.left, right: rect.right, width: rect.width, clientWidth: node.clientWidth, scrollWidth: node.scrollWidth, display: style.display, overflowX: style.overflowX, overflowWrap: style.overflowWrap, whiteSpace: style.whiteSpace, minWidth: style.minWidth, maxWidth: style.maxWidth, fontFamily: style.fontFamily, fontSize: style.fontSize, fontWeight: style.fontWeight, letterSpacing: style.letterSpacing };
      }).filter(node => node.width > 0 && (node.right > innerWidth + 1 || node.left < -1 || node.scrollWidth > node.clientWidth + 1)).sort((a,b) => Math.max(b.right,b.left+b.scrollWidth) - Math.max(a.right,a.left+a.scrollWidth)).slice(0,40));
      fs.mkdirSync(artifacts, { recursive: true });
      const stem = 'overflow-' + label.replace(/[^a-z0-9_-]+/gi, '-').slice(0,70) + '-' + result.width;
      const diagnostic = { label, ...result, offending };
      fs.writeFileSync(path.join(artifacts, stem + '.json'), JSON.stringify(diagnostic, null, 2) + '\n');
      await page.screenshot({ path: path.join(artifacts, stem + '.png'), fullPage: true });
    } catch (error) { console.error('Overflow diagnostic could not be saved: ' + error.message); }
  }
  assert(result.document <= result.width + 1 && result.body <= result.width + 1, label + ': document overflow ' + JSON.stringify(result));
}
async function screenshot(page, name) {
  fs.mkdirSync(artifacts, { recursive: true });
  const file = path.join(artifacts, name + '.png');
  await page.screenshot({ path: file, fullPage: true });
  return file;
}
async function focusedClick(page, selector) {
  await page.locator(selector).focus(); await page.locator(selector).click();
  assert.equal(await page.locator(selector).evaluate(node => document.activeElement === node), true, selector + ': action retains focus after redraw');
}

async function exerciseAttempts(page) {
  const cases = [
    ['m01-s1-01', 'independent'], ['m01-s1-03', 'corrected'], ['m01-s2-01', 'assisted'],
    ['m01-s2-03', 'independent'], ['m01-s1-04', 'corrected'], ['m01-s3-05', 'assisted'],
    ['m04-s1-02', 'independent'], ['m01-s1-02', 'corrected'], ['m01-s2-05', 'assisted']
  ];
  for (const [id, outcome] of cases) {
    const task = await openTask(page, id);
    if (outcome === 'corrected') {
      if (task.kind === 'write') await enterAnswer(page, task, '0');
      else if (task.kind === 'choice') await enterAnswer(page, task, task.options.find(s => !task.answers.includes(s)));
      else {
        // A valid but wrong complete block; no malformed-input false positive.
        const bank = page.locator('[data-token]');
        const i = await bank.evaluateAll(nodes => nodes.findIndex(node => node.dataset.token === 'cos(x)'));
        assert(i >= 0); await bank.nth(i).click();
      }
      await page.locator('#fa-check').click();
      const before = await stateOf(page, id);
      assert.equal(before.attempt.wrong, true, id + ': wrong answer recorded');
      assert.equal(before.attempt.closed, false);
      await page.reload(); await ready(page);
      assert.equal((await stateOf(page, id)).attempt.wrong, true, id + ': error survives reload');
    }
    if (outcome === 'assisted') {
      await focusedClick(page, '[data-action="hint"]');
      assert.equal((await stateOf(page, id)).attempt.assisted, true);
      const before = task.kind === 'choice' ? await page.locator('input[name="fa-answer"]').evaluateAll(ns => ns.map(n => n.value)) : null;
      await page.reload(); await ready(page);
      assert.equal((await stateOf(page, id)).attempt.assisted, true, id + ': help survives reload');
      if (before) assert.deepEqual(await page.locator('input[name="fa-answer"]').evaluateAll(ns => ns.map(n => n.value)), before, 'choice order survives reload');
    }
    await enterAnswer(page, task);
    await submit(page, task, outcome);
    await layout(page, 'attempt ' + id);
  }
  for (const [id, global] of [['m01-s2-02', false], ['m01-s2-04', true]]) {
    const task = await openTask(page, id);
    await page.locator(global ? '.fa-toolbar [data-action="reference"]' : '#fa-task-reference summary').click();
    await page.waitForFunction(id => window.MathExamFormulaApp.store.current(id).assisted, id);
    if (global) await openTask(page, id);
    else { await page.reload(); await ready(page); }
    await enterAnswer(page, task); await submit(page, task, 'assisted');
  }
  const solved = await openTask(page, 'm01-s2-06');
  await focusedClick(page, '[data-action="solution"]');
  assert.equal((await stateOf(page, solved.id)).attempt.assisted, true, 'worked solution is help');
  await page.locator('[data-action="next"]').click();
  assert.notEqual(await page.locator('.fa-task').getAttribute('data-task-id'), solved.id, 'new independent check uses a different task');
  return { cases: cases.length, references: 2, solution: 1 };
}
async function exerciseNavigationHelp(page) {
  let task = await openTask(page, 'm03-s1-01');
  await page.locator('.fa-toolbar [data-action="home"]').click();
  await page.locator('.fa-toolbar [data-action="reference"]').click();
  await page.locator('.fa-toolbar [data-action="home"]').click();
  await openTask(page, task.id); await page.reload(); await ready(page);
  assert.equal((await stateOf(page, task.id)).attempt.assisted, true, 'home cannot hide an open attempt from the reference');
  await enterAnswer(page, task); await submit(page, task, 'assisted');

  await openTask(page, 'm03-s3-01'); // An unrelated open attempt is a control.
  task = await openTask(page, 'm03-s2-01');
  await page.locator('.fa-toolbar [data-action="map"]').click();
  await page.locator('.fa-module[data-module="m03"]').click();
  await page.locator('[data-action="study"][data-skill="m03-s2"]').click();
  await openTask(page, task.id);
  assert.equal((await stateOf(page, task.id)).attempt.assisted, true, 'study marks the same skill after leaving the task');
  assert.equal((await stateOf(page, 'm03-s3-01')).attempt.assisted, false, 'one skill study does not mark an unrelated skill');
  await enterAnswer(page, task); await submit(page, task, 'assisted');
}
async function exerciseStaleHelp(page, selector, errors) {
  const task = await openTask(page, 'm01-s1-01');
  const peer = await page.context().newPage(); peer.setDefaultTimeout(15000);
  peer.on('pageerror', error => errors.push(error.message));
  await peer.goto(page.url()); await ready(peer);
  assert.equal(await peer.locator('.fa-task').getAttribute('data-task-id'), task.id);
  await peer.locator('#fa-answer').fill('sin(');
  const saved = await peer.evaluate(() => localStorage.getItem(window.MathExamFormulaState.KEY));
  await page.locator(selector).click();
  assert.equal(await page.locator('.fa-help, .fa-task, #fa-task-reference').count(), 0, 'stale page must not expose unsaved help');
  assert.equal(await page.locator('#fa-content [data-action="reload"]').isVisible(), true);
  assert.equal(await page.evaluate(() => localStorage.getItem(window.MathExamFormulaState.KEY)), saved, 'stale help must not overwrite the peer draft');
  assert.equal((await stateOf(peer, task.id)).attempt.assisted, false, 'unseen help must not taint the current peer');
  await enterAnswer(peer, task); await submit(peer, task, 'independent');
  await peer.reload(); await ready(peer);
  assert.equal((await stateOf(peer, task.id)).attempt.status, 'independent');
  await peer.close();
}
async function exerciseAssemblyResume(page) {
  await openTask(page, 'm07-s1-01');
  const first = page.locator('[data-token]').first();
  await first.focus(); await first.press('Enter');
  assert.equal(await page.locator('[data-remove]').count(), 1, 'keyboard adds a block');
  await first.press('Enter');
  assert.equal(await page.locator('[data-remove]').count(), 2, 'blocks are reusable');
  const undo = page.locator('[data-action="undo"]');
  await undo.focus(); await undo.press('Enter');
  assert.equal(await page.locator('[data-remove]').count(), 1, 'keyboard undo removes last block');
  assert.equal(await page.evaluate(() => document.activeElement === document.body), false, 'undo preserves keyboard focus');
  await page.reload(); await ready(page);
  assert.equal(await page.locator('[data-remove]').count(), 1, 'reload restores editable blocks');
  const restored = await page.locator('[data-remove]').first().textContent();
  await page.locator('[data-token]').nth(1).click();
  assert.equal(await page.locator('[data-remove]').count(), 2, 'editing resumed draft appends, not replaces');
  assert.equal(await page.locator('[data-remove]').first().textContent(), restored);
  await page.locator('[data-remove]').first().focus(); await page.locator('[data-remove]').first().press('Enter');
  assert.equal(await page.locator('[data-remove]').count(), 1, 'keyboard removes selected block');
  await page.locator('[data-action="clear"]').focus(); await page.locator('[data-action="clear"]').press('Enter');
  assert.equal(await page.locator('[data-remove]').count(), 0);
  assert.equal(await page.evaluate(() => document.activeElement === document.body), false, 'clear preserves keyboard focus');
}
async function exerciseLab(page, lab) {
  await page.evaluate(moduleId => window.MathExamFormulaApp.go('module', { moduleId }), lab.modules[0]);
  await page.locator(`[data-action="lab"][data-lab="${lab.id}"]`).click();
  assert.equal(await page.locator('#fa-angle-slider-a').count(), 0, lab.id + ': prediction precedes controls');
  await layout(page, lab.id + '-prediction');
  await focusedClick(page, '[data-action="predict"][data-prediction="0"]');
  assert.equal(await page.locator('#fa-angle-slider-a').isVisible(), true);
  const before = await page.locator('.fa-readings').textContent();
  if (lab.kind === 'domain') assert.match(before, /не определено/, 'model exposes original undefined point');
  const slider = await page.locator('#fa-angle-slider-a').elementHandle();
  await page.locator('#fa-angle-slider-a').focus(); await page.locator('#fa-angle-slider-a').press('ArrowRight');
  assert.equal(await slider.evaluate(n => n.isConnected && document.querySelector('#fa-angle-slider-a') === n), true, 'range input stays mounted for dragging and repeated keys');
  await slider.dispose();
  assert.notEqual(await page.locator('.fa-readings').textContent(), before, lab.id + ': angle changes readings');
  if (lab.kind === 'domain') assert.doesNotMatch(await page.locator('.fa-readings').textContent(), /не определено/, 'defined point differs from forbidden point');
  assert.equal(await page.locator('#fa-angle-slider-a').evaluate(n => document.activeElement === n), true, 'slider keeps focus after redraw');
  await page.locator('[data-action="observe"]').click();
  const wrong = lab.conclusions.findIndex((_, i) => i !== lab.correct);
  await focusedClick(page, `[data-action="conclude"][data-conclusion="${wrong}"]`);
  assert.equal(await page.evaluate(id => !!window.MathExamFormulaApp.store.state.investigations[id], lab.id), false, 'wrong conclusion does not complete lab');
  await focusedClick(page, `[data-action="conclude"][data-conclusion="${lab.correct}"]`);
  assert.equal(await page.evaluate(id => window.MathExamFormulaApp.store.state.investigations[id], lab.id), true);
  assert.match(await page.locator('.fa-conclusion').textContent(), /общая формула требует вывода/);
  await layout(page, lab.id + '-conclusion');
}
async function exerciseGuide(page) {
  await page.locator('.fa-toolbar [data-action="home"]').click();
  await page.locator('[data-action="guide"]').click();
  assert.equal(await page.locator('.fa-demo-track .active').textContent(), '1');
  await focusedClick(page, '[data-action="demo-next"]');
  assert.equal(await page.locator('.fa-demo-track .active').textContent(), '2');
  await page.locator('[data-action="demo-back"]').click();
  await focusedClick(page, '[data-action="demo-play"]');
  assert.match(await page.locator('[data-action="demo-play"]').textContent(), /Пауза/);
  await page.waitForFunction(() => document.querySelector('.fa-demo-track .active').textContent !== '1');
  await focusedClick(page, '[data-action="demo-play"]');
  const stopped = await page.locator('.fa-demo-track .active').textContent();
  await page.waitForTimeout(2800);
  assert.equal(await page.locator('.fa-demo-track .active').textContent(), stopped, 'pause stops automatic advance');
}
async function exerciseDiagnostic(page) {
  await page.locator('[data-action="diagnostic"]').click();
  const seen = [];
  for (let i = 0; i < 6; i++) {
    const id = await page.locator('.fa-task').getAttribute('data-task-id'); seen.push(id);
    assert.match(await page.locator('.fa-kicker').last().textContent(), new RegExp(`${i + 1} из 6`));
    if (i === 2) await page.locator('[data-action="skip"]').click();
    else {
      const task = await taskData(page, id); await enterAnswer(page, task);
      await page.locator('#fa-check').click(); await page.locator('[data-action="next"]').click();
    }
  }
  assert.equal(new Set(seen).size, 6);
  assert.equal(await page.evaluate(() => window.MathExamFormulaApp.store.state.view.screen), 'diagnostic-result');
  assert.equal((await stateOf(page, seen[2])).attempt.assisted, true, 'skipping never grants independent evidence');
  assert.equal(await page.locator('#fa-content [data-action="module"]').getAttribute('data-module'), 'm04', 'recommend first unproven foundation');
  await page.locator('[data-action="map"]').last().click();
  assert.equal(await page.locator('.fa-module').count(), 18, 'diagnostic does not lock topics');
  return seen;
}
async function exerciseDiagnosticExit(page) {
  await page.locator('[data-action="diagnostic"]').click();
  for (let i = 0; i < 6; i++) await page.locator('[data-action="skip"]').click();
  assert.equal(await page.evaluate(() => window.MathExamFormulaApp.store.state.view.screen), 'diagnostic-result');
  await page.locator('#fa-content [data-action="module"]').click();
  await page.locator('[data-action="practice"]').first().click();
  assert.equal(await page.locator('.fa-task').getAttribute('data-task-id'), 'm01-s1-01');
  assert.equal(await page.evaluate(() => window.MathExamFormulaApp.store.state.view.route === 'diagnostic'), false);
  assert.doesNotMatch(await page.locator('#fa-content').textContent(), /0 из 6|Подбираем начало/);
  assert.equal(await page.locator('[data-action="skip"]').count(), 0);
  const task = await taskData(page, 'm01-s1-01'); await enterAnswer(page, task); await submit(page, task, 'independent');
  await page.locator('[data-action="next"]').click();
  assert.equal(await page.locator('.fa-task').getAttribute('data-task-id'), 'm01-s1-02', 'normal practice advances within the selected skill');
  assert.equal(await page.evaluate(() => window.MathExamFormulaApp.store.state.view.route === 'diagnostic'), false);
  assert.doesNotMatch(await page.locator('#fa-content').textContent(), /0 из 6|Подбираем начало/);
}

async function main() {
  const report = { complete: false, widths: [320, 390, 768, 1280], errors: [], screenshots: [] };
  fs.mkdirSync(artifacts, { recursive: true });
  const { server, origin } = await serve();
  let browser;
  const save = () => fs.writeFileSync(path.join(artifacts, 'browser-evidence.json'), JSON.stringify(report, null, 2) + '\n');
  try {
    browser = await launchBrowser();
    async function fresh(width) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      await context.route(/^https?:\/\//, route => new URL(route.request().url()).origin === origin ? route.continue() : route.fulfill({ status: 200, body: '', contentType: route.request().resourceType() === 'stylesheet' ? 'text/css' : 'text/plain' }));
      const page = await context.newPage(); page.setDefaultTimeout(15000);
      page.on('pageerror', e => report.errors.push(e.message));
      page.on('response', r => { if (new URL(r.url()).origin === origin && r.status() >= 400) report.errors.push(r.status() + ' ' + new URL(r.url()).pathname); });
      await page.goto(origin + entry); await ready(page);
      return { context, page };
    }
    for (const width of report.widths) {
      const { context, page } = await fresh(width);
      assert.equal(await page.locator('.fa-module').count(), 18);
      await layout(page, 'home ' + width);
      if (width === 320 || width === 1280) report.screenshots.push(await screenshot(page, 'home-' + width));
      for (const route of ['basics', 'formulas', 'equations', 'review']) {
        await page.locator('.fa-toolbar [data-action="home"]').click();
        await page.locator(`[data-action="route"][data-route="${route}"]`).click();
        assert((await page.locator('#fa-content h1').textContent()).trim()); await layout(page, route + ' ' + width);
      }
      for (const id of ['m01-s1-01', 'm01-s1-02', 'm01-s1-04']) { await openTask(page, id); await layout(page, id + ' ' + width); }
      await page.locator('.fa-toolbar [data-action="teacher"]').click(); await layout(page, 'teacher ' + width);
      await page.locator('.fa-toolbar [data-action="reference"]').click();
      assert.equal(await page.locator('.fa-atlas-row').count(), 54); await layout(page, 'reference ' + width);
      await context.close();
    }
    {
      const { context, page } = await fresh(320);
      const modules = await page.evaluate(() => window.MathExamFormulaData.modules.map(m => ({ id: m.id, skills: m.skills.map(s => ({ id: s.id, tasks: s.tasks.map(t => t.id) })) })));
      let skillCount = 0, taskCount = 0;
      for (const m of modules) {
        await page.locator('.fa-toolbar [data-action="home"]').click();
        await page.locator(`.fa-module[data-module="${m.id}"]`).click();
        assert.equal(await page.locator('.fa-skill').count(), 3); await layout(page, m.id);
        for (const s of m.skills) {
          await page.locator(`[data-action="study"][data-skill="${s.id}"]`).click();
          assert((await page.locator('.fa-worked').textContent()).length > 30); await layout(page, s.id); skillCount++;
          for (const id of s.tasks) {
            const task = await openTask(page, id);
            assert.equal(await page.locator('.fa-prompt').textContent(), task.prompt);
            assert.equal(await page.locator('#fa-check').isVisible(), true); await layout(page, id); taskCount++;
          }
          await page.evaluate(moduleId => window.MathExamFormulaApp.go('module', { moduleId }), m.id);
        }
      }
      assert.equal(skillCount, 54); assert.equal(taskCount, 324);
      report.rendered = { modules: modules.length, skills: skillCount, tasks: taskCount, width: 320 };
      await context.close();
    }
    {
      const { context, page } = await fresh(320);
      report.attempts = await exerciseAttempts(page); await exerciseNavigationHelp(page); report.attempts.navigationHelp = 2; await exerciseAssemblyResume(page);
      report.screenshots.push(await screenshot(page, 'assembly-320'));
      const labs = await page.evaluate(() => window.MathExamFormulaData.investigations);
      assert.equal(labs.length, 12);
      for (const lab of labs) await exerciseLab(page, lab);
      report.investigations = labs.length; report.screenshots.push(await screenshot(page, 'investigation-320'));
      await exerciseGuide(page);
      const nav = await page.locator('.fa-top nav a').evaluateAll(nodes => nodes.map(n => ({ label: n.textContent, url: n.href })));
      assert.deepEqual(nav.map(n => n.label), ['Курс профиля', 'В кабинет', 'На главную']);
      for (const link of nav) assert.equal((await page.request.get(link.url)).status(), 200, 'return target exists: ' + link.label);
      report.navigation = nav.map(n => n.label); await context.close();
    }
    {
      const { context, page } = await fresh(390); report.diagnostic = await exerciseDiagnostic(page); await context.close();
    }
    {
      const { context, page } = await fresh(320); await exerciseDiagnosticExit(page); report.diagnosticExit = true; await context.close();
    }
    for (const selector of ['[data-action="solution"]', '#fa-task-reference summary']) {
      const { context, page } = await fresh(390); await exerciseStaleHelp(page, selector, report.errors); await context.close();
    }
    report.staleHelp = ['solution', 'inline-reference'];
    report.focusActions = ['hint','solution','demo-next','demo-play','predict','conclude','undo','clear'];
    assert.deepEqual(report.errors, [], 'no page exceptions or missing local resources');
    report.complete = true; save();
    console.log('PROFILE_TRIG_FORMULA_ALPHABET_BROWSER_OK: 4 widths; 18 modules; 54 skills; 324 tasks; write/choice/assembly outcomes; persisted help/error/drafts; 12 investigations; guide; diagnostic; navigation');
  } catch (error) { report.failure = error.stack; save(); throw error; }
  finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
}

// Explicit fallback only. This is a DOM/event gate, never a passing browser,
// pixel, touch, viewport, accessibility-tree or physical-keyboard claim.
async function domMain() {
  const { JSDOM, ResourceLoader, VirtualConsole } = require(process.env.FORMULA_ALPHABET_JSDOM || 'jsdom');
  const report = { complete: false, engine: 'jsdom', notRun: ['Chromium', 'viewport geometry', 'screenshots', 'physical keyboard/touch', 'file:// offline browser'], errors: [] };
  fs.mkdirSync(artifacts, { recursive: true });
  const save = () => fs.writeFileSync(path.join(artifacts, 'dom-evidence.json'), JSON.stringify(report, null, 2) + '\n');
  let dom, w;
  class LocalResources extends ResourceLoader {
    fetch(url) {
      const u = new URL(url);
      if (u.origin !== 'http://formula.local') return Promise.resolve(Buffer.from(''));
      const file = path.resolve(root, '.' + decodeURIComponent(u.pathname));
      if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) {
        report.errors.push('Missing local resource ' + u.pathname); return Promise.resolve(Buffer.from(''));
      }
      return Promise.resolve(fs.readFileSync(file));
    }
  }
  async function boot(saved = {}) {
    if (dom) dom.window.close();
    const console = new VirtualConsole();
    console.on('jsdomError', error => report.errors.push(error.message));
    dom = new JSDOM(fs.readFileSync(path.join(root, entry), 'utf8'), {
      url: 'http://formula.local' + entry, runScripts: 'dangerously', resources: new LocalResources(), pretendToBeVisual: true, virtualConsole: console,
      beforeParse(window) {
        window.HTMLElement.prototype.scrollIntoView = function () {};
        window.scrollTo = function () {};
        window.matchMedia = query => ({ media: query, matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
        window.fetch = async value => {
          const u = new URL(String(value), 'http://formula.local');
          if (u.origin !== 'http://formula.local') return new Response('', { status: 503 });
          const file = path.resolve(root, '.' + decodeURIComponent(u.pathname));
          return file.startsWith(root + path.sep) && fs.existsSync(file) && fs.statSync(file).isFile() ? new Response(fs.readFileSync(file), { status: 200 }) : new Response('', { status: 404 });
        };
        for (const [key, value] of Object.entries(saved)) window.localStorage.setItem(key, value);
      }
    });
    w = dom.window;
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('DOM page did not finish loading')), 10000);
      w.addEventListener('load', () => { clearTimeout(timer); resolve(); }, { once: true });
    });
    assert(w.MathExamFormulaApp && w.MathExamFormulaData, 'actual canonical scripts initialized');
    assert(w.document.body.classList.contains('formula-alphabet-mode'));
  }
  const $ = selector => { const node = w.document.querySelector(selector); assert(node, 'DOM element exists: ' + selector); return node; };
  const all = selector => [...w.document.querySelectorAll(selector)];
  const click = selector => $(selector).click();
  const focusClick = selector => { $(selector).focus(); click(selector); assert.equal(w.document.activeElement, $(selector), selector + ': DOM focus retained'); };
  const tick = () => new Promise(resolve => setTimeout(resolve, 0));
  const reload = () => boot(Object.fromEntries(Object.keys(w.localStorage).map(key => [key, w.localStorage.getItem(key)])));
  function findTask(id) {
    for (const m of w.MathExamFormulaData.modules) for (const s of m.skills) {
      const t = s.tasks.find(t => t.id === id); if (t) return { ...t, skillId: s.id };
    }
    throw new Error('Missing task ' + id);
  }
  function open(id) { const t = findTask(id); w.MathExamFormulaApp.startTask(t.skillId, id); assert.equal($('.fa-task').dataset.taskId, id); return t; }
  function answer(t, value = t.answers[0]) {
    if (t.kind === 'write') { $('#fa-answer').value = value; $('#fa-answer').dispatchEvent(new w.Event('input', { bubbles: true })); }
    else if (t.kind === 'choice') { const input = all('input[name="fa-answer"]').find(n => n.value === value); assert(input); input.click(); }
    else {
      const sequence = tokenSequence(value, t.tokens); assert(sequence, t.id + ': constructible answer'); click('[data-action="clear"]');
      for (const block of sequence) { const node = all('[data-token]').find(n => n.dataset.token === block); assert(node); node.click(); }
    }
  }
  function check(t, expected) {
    $('#fa-task-form').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
    if (!expected) return;
    const a = w.MathExamFormulaApp.store.current(t.id);
    assert.equal(a.status, expected, t.id + ': DOM submit classification');
    assert.equal(a.closed, true);
    assert.equal(w.MathExamFormulaApp.store.state.skills[t.skillId].independent.includes(t.id), expected === 'independent', t.id + ': independent record');
  }
  try {
    await boot();
    assert.equal(all('.fa-module').length, 18);
    let skills = 0, tasks = 0;
    for (const m of w.MathExamFormulaData.modules) {
      click('.fa-toolbar [data-action="home"]'); click(`.fa-module[data-module="${m.id}"]`);
      assert.equal(all('.fa-skill').length, 3);
      for (const s of m.skills) {
        click(`[data-action="study"][data-skill="${s.id}"]`); assert($('.fa-worked').textContent.length > 30); skills++;
        for (const item of s.tasks) { const t = open(item.id); assert.equal($('.fa-prompt').textContent, t.prompt); answer(t); check(t, 'independent'); tasks++; }
        w.MathExamFormulaApp.go('module', { moduleId: m.id });
      }
    }
    assert.equal(skills, 54); assert.equal(tasks, 324); report.authoring = { modules: 18, skills, tasks, renderedAndSubmitted: tasks };
    await boot();
    for (const [id, expected] of [['m01-s1-01','independent'],['m01-s1-03','corrected'],['m01-s2-01','assisted'],['m01-s2-03','independent'],['m01-s1-04','corrected'],['m01-s3-05','assisted'],['m04-s1-02','independent'],['m01-s1-02','corrected'],['m01-s2-05','assisted']]) {
      let t = open(id);
      if (expected === 'corrected') {
        if (t.kind === 'assemble') all('[data-token]').find(n => n.dataset.token === 'cos(x)').click();
        else answer(t, t.kind === 'choice' ? t.options.find(x => !t.answers.includes(x)) : '0');
        check(t); assert.equal(w.MathExamFormulaApp.store.current(id).wrong, true); await reload();
        assert.equal(w.MathExamFormulaApp.store.current(id).wrong, true);
      }
      if (expected === 'assisted') {
        focusClick('[data-action="hint"]');
        const order = t.kind === 'choice' ? all('input[name="fa-answer"]').map(n => n.value) : null;
        await reload(); assert.equal(w.MathExamFormulaApp.store.current(id).assisted, true);
        if (order) assert.deepEqual(all('input[name="fa-answer"]').map(n => n.value), order);
      }
      t = findTask(id); answer(t); check(t, expected);
    }
    for (const [id, global] of [['m01-s2-02',false],['m01-s2-04',true]]) {
      let t = open(id);
      if (global) click('.fa-toolbar [data-action="reference"]');
      else { $('#fa-task-reference').open = true; await tick(); }
      assert.equal(w.MathExamFormulaApp.store.current(id).assisted, true, 'reference counts as help');
      await reload(); t = open(id); answer(t); check(t, 'assisted');
    }
    let t = open('m07-s1-01'); click('[data-token]'); click('[data-token]');
    assert.equal(all('[data-remove]').length, 2); click('[data-action="undo"]');
    assert.equal(all('[data-remove]').length, 1); assert.notEqual(w.document.activeElement, w.document.body);
    await reload(); assert.equal(all('[data-remove]').length, 1); click('[data-token]');
    assert.equal(all('[data-remove]').length, 2); click('[data-remove]'); assert.equal(all('[data-remove]').length, 1);
    click('[data-action="clear"]'); assert.equal(all('[data-remove]').length, 0); assert.notEqual(w.document.activeElement, w.document.body);
    t = open('m01-s2-06'); focusClick('[data-action="solution"]'); assert.equal(w.MathExamFormulaApp.store.current(t.id).assisted, true);
    click('[data-action="next"]'); assert.notEqual($('.fa-task').dataset.taskId, t.id);
    t = open('m03-s1-01'); click('.fa-toolbar [data-action="home"]'); click('.fa-toolbar [data-action="reference"]'); click('.fa-toolbar [data-action="home"]');
    open(t.id); await reload(); t = findTask(t.id); assert.equal(w.MathExamFormulaApp.store.current(t.id).assisted, true); answer(t); check(t, 'assisted');
    open('m03-s3-01'); t = open('m03-s2-01'); click('.fa-toolbar [data-action="map"]'); click('.fa-module[data-module="m03"]'); click('[data-action="study"][data-skill="m03-s2"]');
    t = open(t.id); assert.equal(w.MathExamFormulaApp.store.current(t.id).assisted, true);
    assert.equal(w.MathExamFormulaApp.store.current('m03-s3-01').assisted, false, 'study affects the corresponding skill'); answer(t); check(t, 'assisted');
    report.attempts = { classifications: 9, references: 2, navigationHelp: 2, editableAssemblyReload: true, solutionNext: true };
    for (const selector of ['[data-action="solution"]', '#fa-task-reference summary']) {
      await boot(); t = open('m01-s1-01');
      const peer = w.MathExamFormulaState.createStore(w.localStorage, w.MathExamFormulaData);
      peer.current(t.id).draft = 'sin('; assert.equal(peer.persist(), true);
      const saved = w.localStorage.getItem(w.MathExamFormulaState.KEY);
      click(selector); await tick();
      assert.equal(all('.fa-help, .fa-task, #fa-task-reference').length, 0, 'stale page hides help until a reload');
      assert($('#fa-content [data-action="reload"]'));
      assert.equal(w.localStorage.getItem(w.MathExamFormulaState.KEY), saved, 'stale help cannot replace newer work');
      assert.equal(peer.current(t.id).assisted, false);
      assert.equal(peer.submit(t.id, t.answers[0]).status, 'independent', 'peer that has not seen help can answer independently');
      await reload(); assert.equal(w.MathExamFormulaApp.store.current(t.id).status, 'independent');
    }
    report.staleHelp = ['solution', 'inline-reference'];
    await boot();
    const labs = w.MathExamFormulaData.investigations; assert.equal(labs.length, 12);
    for (const lab of labs) {
      w.MathExamFormulaApp.go('module', { moduleId: lab.modules[0] }); click(`[data-action="lab"][data-lab="${lab.id}"]`);
      assert.equal(all('#fa-angle-slider-a').length, 0); focusClick('[data-action="predict"][data-prediction="0"]');
      const before = $('.fa-readings').textContent, slider = $('#fa-angle-slider-a');
      if (lab.kind === 'domain') assert.match(before, /не определено/);
      slider.focus(); slider.value = String(Number(slider.value) + 15); slider.dispatchEvent(new w.Event('input', { bubbles: true }));
      assert.equal($('#fa-angle-slider-a'), slider, 'range input stays mounted during interaction');
      assert.notEqual($('.fa-readings').textContent, before); assert.equal(w.document.activeElement, $('#fa-angle-slider-a'));
      if (lab.kind === 'domain') assert.doesNotMatch($('.fa-readings').textContent, /не определено/);
      click('[data-action="observe"]'); const wrong = lab.conclusions.findIndex((_, i) => i !== lab.correct);
      focusClick(`[data-action="conclude"][data-conclusion="${wrong}"]`); assert.equal(!!w.MathExamFormulaApp.store.state.investigations[lab.id], false);
      focusClick(`[data-action="conclude"][data-conclusion="${lab.correct}"]`); assert.equal(w.MathExamFormulaApp.store.state.investigations[lab.id], true);
    }
    report.investigations = 12;
    click('.fa-toolbar [data-action="home"]'); click('[data-action="guide"]');
    focusClick('[data-action="demo-next"]'); assert.equal($('.fa-demo-track .active').textContent, '2');
    focusClick('[data-action="demo-play"]'); await new Promise(resolve => setTimeout(resolve, 2700));
    assert.equal($('.fa-demo-track .active').textContent, '3'); focusClick('[data-action="demo-play"]');
    await new Promise(resolve => setTimeout(resolve, 2700)); assert.equal($('.fa-demo-track .active').textContent, '3'); report.guide = 'advance and pause';
    await boot(); click('[data-action="diagnostic"]'); const seen = [];
    for (let i = 0; i < 6; i++) {
      const id = $('.fa-task').dataset.taskId; seen.push(id);
      if (i === 2) click('[data-action="skip"]');
      else { const t = findTask(id); answer(t); check(t, 'independent'); click('[data-action="next"]'); }
    }
    assert.equal(new Set(seen).size, 6); assert.equal(w.MathExamFormulaApp.store.state.view.screen, 'diagnostic-result');
    assert.equal($('#fa-content [data-action="module"]').dataset.module, 'm04');
    click('.fa-toolbar [data-action="map"]'); assert.equal(all('.fa-module').length, 18); report.diagnostic = seen;
    const returnTargets = all('.fa-top nav a').map(n => ({ label: n.textContent, pathname: new URL(n.href).pathname }));
    for (const target of returnTargets) assert(fs.existsSync(path.join(root, target.pathname)), 'return target exists: ' + target.label);
    report.navigation = returnTargets;
    await boot(); click('[data-action="diagnostic"]');
    for (let i = 0; i < 6; i++) click('[data-action="skip"]');
    assert.equal(w.MathExamFormulaApp.store.state.view.screen, 'diagnostic-result');
    click('#fa-content [data-action="module"]'); click('[data-action="practice"]');
    assert.equal($('.fa-task').dataset.taskId, 'm01-s1-01'); assert.notEqual(w.MathExamFormulaApp.store.state.view.route, 'diagnostic');
    assert.equal(all('[data-action="skip"]').length, 0); assert.doesNotMatch($('#fa-content').textContent, /0 из 6|Подбираем начало/);
    t = findTask('m01-s1-01'); answer(t); check(t, 'independent'); click('[data-action="next"]');
    assert.equal($('.fa-task').dataset.taskId, 'm01-s1-02'); assert.notEqual(w.MathExamFormulaApp.store.state.view.route, 'diagnostic');
    assert.doesNotMatch($('#fa-content').textContent, /0 из 6|Подбираем начало/); report.diagnosticExit = true;
    report.focusActions = ['hint','solution','demo-next','demo-play','predict','conclude','undo','clear'];
    assert.deepEqual(report.errors, [], 'no DOM script failures or missing local resources'); report.complete = true; save();
    console.log('PROFILE_TRIG_FORMULA_ALPHABET_DOM_OK: actual HTML/script list; 18 modules; 54 worked views; all 324 tasks submitted through UI handlers; outcomes/reload/reference/blocks; 12 labs; guide; six-question diagnostic. Browser geometry and screenshots NOT RUN.');
  } catch (error) { report.failure = error.stack; save(); throw error; }
  finally { if (dom) dom.window.close(); }
}
module.exports = { main, domMain, root, entry, artifacts, launchBrowser, ready, taskData, openTask, enterAnswer, stateOf, submit, layout, exerciseLab, screenshot };
if (require.main === module) (process.argv.includes('--dom') ? domMain() : main()).catch(error => { console.error(error); process.exitCode = 1; });

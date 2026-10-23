'use strict';

// Actual classic-board teacher/student sessions, using only synthetic localhost
// rooms and isolated browser storage. No production or personal account access.
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { createReadStream, mkdirSync, statSync } = require('node:fs');
const { createServer } = require('node:http');
const { createServer: createNetServer } = require('node:net');
const { extname, join, resolve, sep } = require('node:path');
const { chromium } = require('playwright');
const ROOT = resolve(__dirname, '..');
const SHOTS = process.env.PROFILE_ADDED_BOARD_SHOTS;
const CONFIGS = [
  { number: 1, suffix: 'planimetry', api: '__profilePlanimetryBoard', entry: 'geo-right', personalTask: 'geo-right-hypotenuse', lessons: ['geo-angles', 'geo-right', 'geo-similarity', 'geo-area', 'geo-quadrilaterals', 'geo-circle'] },
  { number: 2, suffix: 'vectors', api: '__profileVectorsBoard', entry: 'vec-coordinates', personalTask: 'vec-coordinates-x', lessons: ['vec-coordinates', 'vec-length', 'vec-operations', 'vec-dot'] },
  { number: 4, suffix: 'probability', api: '__profileProbabilityBoard', entry: 'prob-count', personalTask: 'prob-count-1', lessons: ['prob-count', 'prob-complement', 'prob-range'] },
  { number: 6, suffix: 'random-variables', api: '__profileRandomVariablesBoard', entry: 'prob-distribution', personalTask: 'prob-missing-1', lessons: ['prob-distribution', 'prob-variance', 'prob-continuous'] },
  { number: 7, suffix: 'equations', api: '__profileEquationsBoard', entry: 'eq-linear', personalTask: 'eq-linear-1', lessons: ['algebra-exponential', 'algebra-logarithmic', 'eq-linear', 'eq-rational', 'eq-quadratic', 'eq-root'] }
].map(config => ({ ...config, id: 'ege-profile-' + config.suffix, wrapper: 'ege-profile-' + config.suffix + '.html' }));
const PERSONAL_KEYS = ['mathexam.profileStart2027.v1', 'mathexam.profileCalmPreferences.v1', 'mathexam.profileCheckpoint.v1'];
const RETURN_KEY = 'mathexam.profileReturn', CONTROL_KEY = 'profile-added-board-gate.unrelated';
const wait = ms => new Promise(resolveWait => setTimeout(resolveWait, ms));
const failures = [], sessions = [], covered = new Set(), labsCovered = new Set();
let phase = 'startup';
function stage(value) { phase = value; console.log('CHECK ' + value); }

async function freePort() {
  const server = createNetServer();
  await new Promise((yes, no) => { server.once('error', no); server.listen(0, '127.0.0.1', yes); });
  const port = server.address().port; await new Promise(yes => server.close(yes)); return port;
}
function staticServer() {
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
  return createServer((request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://local').pathname);
      if (pathname === '/favicon.ico') { response.writeHead(204).end(); return; }
      let file = resolve(ROOT, '.' + pathname);
      if (file !== ROOT && !file.startsWith(ROOT + sep)) { response.writeHead(403).end(); return; }
      if (statSync(file).isDirectory()) file = join(file, 'index.html');
      response.setHeader('Content-Type', (mime[extname(file)] || 'application/octet-stream') + (/\.(html|js|css|json|svg)$/.test(file) ? '; charset=utf-8' : ''));
      response.setHeader('Cache-Control', 'no-store'); createReadStream(file).pipe(response);
    } catch (_) { response.writeHead(404).end(); }
  });
}
async function healthy(origin, child, diagnostics) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error('Local server exited: ' + diagnostics());
    try { if ((await fetch(origin + '/health', { signal: AbortSignal.timeout(1000) })).ok) return; } catch (_) {}
    await wait(100);
  }
  throw new Error('Local server health timed out: ' + diagnostics());
}
async function contextFor(browser, siteOrigin, boardOrigin, tag) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if ([siteOrigin, boardOrigin].includes(url.origin) || ['data:', 'blob:'].includes(url.protocol)) return route.continue();
    failures.push(tag + ': external request ' + url.origin + url.pathname); return route.abort();
  });
  const values = Object.fromEntries(PERSONAL_KEYS.map((key, index) => [key, JSON.stringify({ version: 1, sentinel: tag + ':' + index, records: {}, seen: {}, sessions: {}, enabled: true, examples: {}, micro: {} })]));
  const progress = { version: 1, sentinel: 'personal:' + tag, records: {}, seen: {}, sessions: {} };
  for (const config of CONFIGS) {
    progress.records[config.entry] = { guided: [], independent: [], attempts: 7 };
    progress.seen[config.personalTask] = 2;
    progress.sessions[config.entry + ':guided'] = { taskId: config.personalTask, step: 0, wrong: false, assisted: true, familiar: true, done: false, draft: 'personal-' + tag, answers: [], started: '2025-01-01T00:00:00.000Z', registered: false };
  }
  values[PERSONAL_KEYS[0]] = JSON.stringify(progress); values[CONTROL_KEY] = 'unrelated:' + tag;
  const returnValue = '#practice/synthetic-' + tag + '/independent';
  await context.addInitScript(({ origin, values, returnKey, returnValue, controlKey }) => {
    if (location.origin !== origin) return;
    // Seed once so a reload cannot conceal an accidental write.
    if (!localStorage.getItem(controlKey + '.seeded')) {
      for (const [key, value] of Object.entries(values)) localStorage.setItem(key, value);
      localStorage.setItem(controlKey + '.seeded', '1');
    }
    if (!sessionStorage.getItem(controlKey + '.seeded')) {
      sessionStorage.setItem(returnKey, returnValue); sessionStorage.setItem(controlKey + '.seeded', '1');
    }
    if (window === window.top) {
      window.__profileGateMessages = 0;
      addEventListener('message', event => {
        if (event.source === document.querySelector('#trainerFrame')?.contentWindow && event.data?.type === 'mathexam:trainer-state') window.__profileGateMessages++;
      });
    }
  }, { origin: siteOrigin, values, returnKey: RETURN_KEY, returnValue, controlKey: CONTROL_KEY });
  const page = await context.newPage(); page.setDefaultTimeout(10000); page.setDefaultNavigationTimeout(20000);
  page.on('pageerror', error => failures.push(tag + ': ' + error.message));
  page.on('response', response => {
    const url = new URL(response.url());
    if (url.hostname === '127.0.0.1' && response.status() >= 400) failures.push(tag + ': HTTP ' + response.status() + ' ' + url.pathname);
  });
  const session = { context, page, tag, values, returnValue }; sessions.push(session); return session;
}
async function personalStorage(session) {
  const actual = await session.page.evaluate(({ keys, returnKey, controlKey }) => ({
    local: Object.fromEntries([...keys, controlKey].map(key => [key, localStorage.getItem(key)])), returned: sessionStorage.getItem(returnKey)
  }), { keys: PERSONAL_KEYS, returnKey: RETURN_KEY, controlKey: CONTROL_KEY });
  assert.deepEqual(actual.local, session.values, session.tag + ': personal/unrelated local stores remain byte-identical');
  assert.equal(actual.returned, session.returnValue, session.tag + ': personal session store remains byte-identical');
}
async function connected(page) {
  // The status label may retain the normal "teacher took control" notice while
  // switching trainers. Require the real socket/room hydration and bridge.
  await page.waitForFunction(() => shared.connected && roomStateReceived && document.querySelector('#mirrorStatus')?.dataset.mirrorStatus === 'connected', null, { polling: 25, timeout: 15000 });
}
async function profileFrame(page, config) {
  await page.waitForFunction(file => document.querySelector('#trainerFrame')?.src.includes(file), config.wrapper, { polling: 25 });
  const deadline = Date.now() + 10000; let frame;
  while (!frame && Date.now() < deadline) {
    frame = page.frames().find(item => item.url().includes('/trainers/' + config.wrapper)); if (!frame) await wait(25);
  }
  assert(frame, config.id + ': registered wrapper iframe exists');
  await frame.waitForFunction(key => ['getState', 'applyState', 'validateState'].every(method => typeof window[key]?.[method] === 'function'), config.api, { polling: 25 });
  await frame.evaluate(key => {
    window.__profileGateApi = window[key];
    if (window.__profileGateInstrumented) return;
    window.__profileGateInstrumented = true; window.__profileGateApplied = 0;
    // Registered after the SDK handler: acknowledge completed synchronous apply.
    addEventListener('message', event => {
      if (event.source === parent && ['mathexam:hydrate', 'mathexam:apply-trainer-state'].includes(event.data?.type)) window.__profileGateApplied++;
    });
  }, config.api);
  return frame;
}
const snapshot = frame => frame.evaluate(() => window.__profileGateApi.getState());
const messages = page => page.evaluate(() => window.__profileGateMessages);
async function waitSnapshot(frame, expected, label) {
  try {
    await frame.waitForFunction(value => {
      const stable = item => Array.isArray(item) ? item.map(stable) : item && typeof item === 'object' ? Object.fromEntries(Object.keys(item).sort().map(key => [key, stable(item[key])])) : item;
      return JSON.stringify(stable(window.__profileGateApi.getState())) === JSON.stringify(stable(value));
    }, expected, { polling: 25 });
  } catch (error) { assert.deepEqual(await snapshot(frame), expected, label + ': remote snapshot converges'); throw error; }
}
function view(frame) {
  return frame.evaluate(() => {
    const one = selector => document.querySelector(selector), text = selector => one(selector)?.textContent.trim() || '';
    const shown = selector => { const element = one(selector); return !!element && !element.hidden && !element.closest('[hidden]'); };
    const model = one('#task-model,#lab,#example-model,#result-model');
    function svgContent(svg) {
      const clone = svg.cloneNode(true), ids = new Map();
      // Some authored models allocate unique accessibility/marker IDs on each
      // mount. Preserve the references and every geometric attribute, changing
      // only those locally generated identifier strings to document order.
      [...clone.querySelectorAll('[id]')].forEach((node, index) => { ids.set(node.id, 'local-svg-' + index); });
      for (const node of [clone, ...clone.querySelectorAll('*')]) for (const attr of [...node.attributes]) {
        let value = attr.value;
        if (attr.name === 'id') value = ids.get(value) || value;
        else if (['aria-labelledby', 'aria-describedby'].includes(attr.name)) value = value.split(/\s+/).map(id => ids.get(id) || id).join(' ');
        else value = value.replace(/url\(#([^)]+)\)/g, (whole, id) => ids.has(id) ? 'url(#' + ids.get(id) + ')' : whole);
        node.setAttribute(attr.name, value);
      }
      return clone.outerHTML;
    }
    return {
      route: location.hash, title: text('#main h1'), condition: text('.task-condition'), question: text('.current-question > .question'), step: text('#current-step'),
      answers: [...document.querySelectorAll('#answer-form input')].map(input => ({ type: input.type, value: input.value, checked: input.checked, disabled: input.disabled })),
      feedback: text('#feedback'), feedbackClass: one('#feedback')?.className || '', nextShown: shown('#next'), hintShown: shown('#hint-box'),
      hintExpanded: one('#hint')?.getAttribute('aria-expanded') || '', history: text('#solution-history'), help: text('.task-help-link'),
      solutionSteps: [...document.querySelectorAll('[data-solution-step],[data-example-step],[data-trig-explanation] li')].map(element => element.textContent.trim()),
      solutionOpen: one('[data-solution-open]')?.getAttribute('aria-expanded') || '', details: [...document.querySelectorAll('#main details')].map(element => element.open),
      model: model ? {
        geometry: [...model.querySelectorAll('svg')].map(svgContent), text: model.textContent.trim(),
        controls: [...model.querySelectorAll('input,select,button')].map(element => ({ tag: element.tagName, type: element.type || '', value: element.value || '', checked: !!element.checked, text: element.tagName === 'BUTTON' ? element.textContent.trim() : '', pressed: element.getAttribute('aria-pressed'), expanded: element.getAttribute('aria-expanded'), hidden: element.hidden, disabled: element.disabled }))
      } : null
    };
  });
}
async function synchronized(controller, observer, label) {
  const expected = await snapshot(controller);
  assert.equal(await controller.evaluate(value => window.__profileGateApi.validateState(value), expected), true, label + ': local snapshot satisfies the wire contract');
  await waitSnapshot(observer, expected, label);
  assert.deepEqual(await snapshot(observer), expected, label + ': complete state');
  assert.deepEqual(await view(observer), await view(controller), label + ': rendered work'); return expected;
}
async function quiet(pages, label) {
  let previous = await Promise.all(pages.map(messages)), unchanged = Date.now(); const deadline = Date.now() + 4000;
  while (Date.now() < deadline) {
    await wait(80); const current = await Promise.all(pages.map(messages));
    if (current.some((count, index) => count !== previous[index])) unchanged = Date.now();
    else if (Date.now() - unchanged >= 320) return current;
    previous = current;
  }
  throw new Error(label + ': state messages do not become quiet');
}
async function handoff(teacher, student, config, studentControls) {
  const previous = studentControls ? teacher : student, next = studentControls ? student : teacher;
  const previousFrame = await profileFrame(previous, config), nextFrame = await profileFrame(next, config);
  const before = await snapshot(previousFrame), published = await messages(next), applied = await previousFrame.evaluate(() => window.__profileGateApplied);
  await teacher.locator('#openShare').click(); await teacher.locator('#controlToggle').click();
  await student.waitForFunction(value => document.body.classList.contains('control-owner') === value, studentControls, { polling: 25 });
  await teacher.waitForFunction(value => document.body.classList.contains('control-owner') !== value, studentControls, { polling: 25 });
  assert.equal(await student.locator('#trainerFrame').evaluate(element => getComputedStyle(element).pointerEvents === 'none'), !studentControls);
  // A forced publication by the new writer acknowledges prior parent messages
  // (FIFO), then an observer apply acknowledges the server round trip.
  await next.waitForFunction(count => window.__profileGateMessages > count, published, { polling: 25 });
  await previousFrame.waitForFunction(count => window.__profileGateApplied > count, applied, { polling: 25 });
  assert.deepEqual(await snapshot(nextFrame), before, config.id + ': handoff preserves current work');
  await synchronized(nextFrame, previousFrame, 'settled ownership transfer');
  await teacher.locator('#sharePanel [data-close-panel]').click();
}
async function answer(frame, value) {
  if (await frame.locator('#answer').count()) await frame.locator('#answer').fill(String(value));
  else await frame.getByRole('radio', { name: String(value), exact: true }).check();
}
async function draft(frame, observer, lesson, mode, value) {
  await answer(frame, value);
  assert.equal((await snapshot(frame)).progress.sessions[lesson + ':' + mode].draft, value, 'source draft is captured before comparing peers');
  await synchronized(frame, observer, 'draft ' + lesson + '/' + mode);
}
async function overview(frame, config) {
  await frame.locator('.topbar .brand').click(); await frame.locator('.exam-topic').first().waitFor();
  assert.equal(await frame.evaluate(() => location.hash), '#exam/' + config.number);
}
async function changedModel(controller, observer, action, label) {
  const before = (await snapshot(controller)).view.model;
  assert(before !== null, label + ': authored model exists'); await action();
  assert.notDeepEqual((await snapshot(controller)).view.model, before, label + ': source interaction changes semantic model state');
  return synchronized(controller, observer, label);
}
async function taskModel(controller, observer, label) {
  const model = controller.locator('#task-model');
  if (!await model.count()) {
    assert.equal((await snapshot(controller)).view.model, null, label + ': no un-authored task model is invented'); return;
  }
  const walkthrough = model.locator('[data-trig-open]');
  if (await walkthrough.count()) {
    await changedModel(controller, observer, () => walkthrough.click(), label + ': drawing explanation opens');
    await changedModel(controller, observer, () => model.locator('[data-trig-next]').click(), label + ': next authored drawing step');
    assert.equal((await snapshot(controller)).view.model.walkthrough.count, 2);
    await changedModel(controller, observer, () => walkthrough.click(), label + ': hide drawing steps');
    assert.equal((await snapshot(controller)).view.model.walkthrough.count, 2, 'hiding keeps the revealed prefix');
    await changedModel(controller, observer, () => walkthrough.click(), label + ': reopen drawing steps');
  } else {
    const buttons = model.locator('button');
    // Some vector tasks deliberately need no optional construction.
    for (let index = 0, count = await buttons.count(); index < count; index++) {
      await changedModel(controller, observer, () => buttons.nth(index).click(), label + ': model control ' + index);
    }
  }
}
async function help(controller, observer, label) {
  await controller.locator('#hint').click();
  assert.equal(await controller.locator('#hint').getAttribute('aria-expanded'), 'true');
  await controller.locator('#hint-box .task-foundation > summary').click();
  const solution = controller.locator('#task-solution [data-solution-open]');
  if (await solution.count()) {
    await solution.click(); await controller.locator('#task-solution [data-solution-next]').click(); await solution.click();
    const state = await synchronized(controller, observer, label + ': hidden two-step worked solution');
    assert.deepEqual(state.view.solution, { open: false, count: 2 });
  } else {
    assert.equal((await snapshot(controller)).view.solution, null, 'inline triangle explanation replaces the generic solution');
  }
  await controller.locator('#hint').click(); await synchronized(controller, observer, label + ': closed help retains work');
  await controller.locator('#hint').click(); await synchronized(controller, observer, label + ': reopened help');
}
async function changeLab(controller, observer, label, full = false) {
  const host = controller.locator('#lab'), numbers = host.locator('input[type="number"]');
  if (await numbers.count()) {
    const field = numbers.first(), before = await field.inputValue();
    const next = await field.evaluate(element => {
      const value = Number(element.value), step = Number(element.step) || 1, max = element.max === '' ? Infinity : Number(element.max);
      return String(value + step <= max ? value + step : value - step);
    });
    await changedModel(controller, observer, async () => { await field.fill(next); await field.press('Tab'); }, label + ': numeric control');
    assert.notEqual(await field.inputValue(), before);
    if (full) {
      await changedModel(controller, observer, () => field.fill(''), label + ': empty numeric draft');
      assert.equal(await field.inputValue(), '', 'source retains the unfinished numeric entry');
      assert.equal(await observer.locator('#lab input[type="number"]').first().inputValue(), '', 'observer sees the unfinished numeric entry');
      await changedModel(controller, observer, () => field.fill(next), label + ': continue after empty draft');
    }
  } else {
    const button = host.locator('button').first(); assert.equal(await button.count(), 1, label + ': authored lab has a user control');
    await changedModel(controller, observer, () => button.click(), label + ': lab button');
  }
  if (full) {
    const select = host.locator('select').first();
    if (await select.count()) {
      const other = await select.evaluate(element => [...element.options].find(option => option.value !== element.value).value);
      await changedModel(controller, observer, () => select.selectOption(other), label + ': model selection');
    }
    const checkbox = host.locator('input[type="checkbox"]').first();
    if (await checkbox.count()) {
      const checked = await checkbox.isChecked();
      await changedModel(controller, observer, () => checkbox.setChecked(!checked), label + ': auxiliary line');
    }
  }
}
async function dragLab(page, controller, observer, label) {
  const handle = controller.locator('#lab [data-drag]').first();
  if (!await handle.count()) return;
  await handle.scrollIntoViewIfNeeded(); const box = await handle.boundingBox(); assert(box && box.width > 0);
  await changedModel(controller, observer, async () => {
    const x = box.x + box.width / 2, y = box.y + box.height / 2;
    await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + 18, y - 16, { steps: 4 }); await page.mouse.up();
  }, label + ': actual SVG drag');
}

async function canonicalEntries(browser, siteOrigin, boardOrigin) {
  stage('five canonical START links and registered board aliases');
  const entry = await contextFor(browser, siteOrigin, boardOrigin, 'entry');
  for (const config of CONFIGS) {
    const canonical = '/ege-profil/start/index.html#exam/' + config.number;
    await entry.page.goto(siteOrigin + canonical, { waitUntil: 'domcontentloaded' });
    await entry.page.locator('.board-link').waitFor();
    assert.equal(await entry.page.locator('#exam-start').getAttribute('href'), '#practice/' + config.entry + '/guided', 'standalone resumes the synthetic personal attempt');
    assert.equal(await entry.page.evaluate(key => typeof window[key], config.api), 'undefined', 'standalone does not activate a board session');
    const link = new URL(await entry.page.locator('.board-link').getAttribute('href'), siteOrigin);
    assert.equal(link.searchParams.get('trainer'), canonical); link.searchParams.set('server', boardOrigin);
    await entry.page.goto(link.href, { waitUntil: 'domcontentloaded' }); const frame = await profileFrame(entry.page, config);
    assert.equal(new URL(frame.url()).pathname, '/trainers/' + config.wrapper);
    assert.equal(new URL(frame.url()).hash, '#exam/' + config.number);
    assert.equal(await frame.locator('.exam-topic').count(), config.lessons.length);
    assert.equal(await frame.locator('#exam-start').getAttribute('href'), '#practice/' + config.entry + '/independent', 'board never reads the personal ongoing attempt');
    await personalStorage(entry);
  }
  await entry.context.close();
}
async function deepJourney(teacherSession, studentSession, config) {
  const teacher = teacherSession.page, student = studentSession.page;
  let t = await profileFrame(teacher, config), s = await profileFrame(student, config);
  stage(config.id + ': independent task, draft, feedback, model and layered help');
  const quietBefore = await quiet([teacher, student], 'initial hydration');
  await t.locator('#exam-start').click(); await t.locator('#answer-form').waitFor();
  const initial = await synchronized(t, s, 'fresh independent task');
  const key = config.entry + ':independent', taskId = initial.progress.sessions[key].taskId;
  assert.equal(initial.progress.sessions[key].draft, ''); assert.notEqual(taskId, config.personalTask);
  assert.equal(initial.progress.sessions[key].assisted, false); assert.equal(await t.locator('#hint-box').isVisible(), false);
  await draft(t, s, config.entry, 'independent', '1/'); await t.locator('#submit-answer').click();
  assert.match(await t.locator('#feedback').innerText(), /Не удалось прочитать число/); await synchronized(t, s, 'unreadable answer feedback');
  await answer(t, '-987654321'); await t.locator('#submit-answer').click();
  assert.match(await t.locator('#feedback').getAttribute('class'), /bad/); await synchronized(t, s, 'wrong answer feedback');
  await draft(t, s, config.entry, 'independent', '1/7');
  await taskModel(t, s, config.entry); await help(t, s, config.entry);
  const helped = await snapshot(t), helpedView = await view(t);
  const quietAfter = await quiet([teacher, student], 'shared help');
  assert(quietAfter[0] > quietBefore[0]); assert.equal(quietAfter[1], quietBefore[1], 'observer does not echo controller work');
  await student.reload({ waitUntil: 'domcontentloaded' }); await connected(student); s = await profileFrame(student, config);
  await waitSnapshot(s, helped, 'observer reload'); assert.deepEqual(await view(s), helpedView, 'reload restores the visible help and model');

  stage(config.id + ': guided answer/history, settled grant/revoke and controller reload');
  await t.locator('.support-details > summary').click(); await t.locator('#repair-current').click(); await t.locator('#answer-form').waitFor();
  const guidedKey = config.entry + ':guided';
  await t.waitForFunction(value => location.hash === value && document.querySelector('#current-step')?.textContent.startsWith('Шаг 1 ') && !document.querySelector('#repair-current'), '#practice/' + config.entry + '/guided');
  assert.equal((await snapshot(t)).progress.sessions[guidedKey].taskId, taskId, 'repair retains the current condition');
  assert.equal(await t.locator('#micro-start').count(), 0, 'these tasks do not invent unauthored micro questions');
  const firstAnswer = await t.evaluate(({ lesson, task }) => String(ProfileLessons.find(item => item.id === lesson).tasks.find(item => item.id === task).steps[0].answer), { lesson: config.entry, task: taskId });
  await answer(t, firstAnswer); await t.locator('#submit-answer').click();
  assert.equal(await t.locator('#next').isVisible(), true); await synchronized(t, s, 'accepted guided answer before advancing');
  assert.equal(await s.locator('#answer-form input').first().isDisabled(), true);
  await t.locator('.earned-explanation > summary').click(); await synchronized(t, s, 'earned explanation');
  await t.locator('#next').click(); await synchronized(t, s, 'next step and history');
  assert.match(await s.locator('#current-step').innerText(), /Шаг 2/); assert((await s.locator('#solution-history').innerText()).trim().length > 0);
  await handoff(teacher, student, config, true); await quiet([teacher, student], 'grant'); const teacherCount = await messages(teacher);
  await draft(s, t, config.entry, 'guided', '7/11'); await quiet([teacher, student], 'student draft');
  assert.equal(await messages(teacher), teacherCount, 'teacher observer does not echo student draft');
  const beforeReload = await snapshot(s); await teacher.reload({ waitUntil: 'domcontentloaded' }); await connected(teacher); t = await profileFrame(teacher, config);
  await waitSnapshot(t, beforeReload, 'teacher reload while student controls');
  assert.equal(await student.evaluate(() => document.body.classList.contains('control-owner')), true);
  await draft(s, t, config.entry, 'guided', '9/13'); await handoff(teacher, student, config, false);
  await draft(t, s, config.entry, 'guided', '3/17');
  const saved = (await snapshot(t)).progress.sessions[guidedKey], returnSelector = 'a.button[href="#practice/' + config.entry + '/guided"]';
  await t.locator('#pause-practice').click(); await t.locator(returnSelector).waitFor();
  assert.equal((await synchronized(t, s, 'pause with saved work')).view.model, null);
  await t.locator(returnSelector).click(); await t.locator('#answer-form').waitFor();
  assert.deepEqual((await synchronized(t, s, 'resume')).progress.sessions[guidedKey], saved);
  await t.locator('.support-details > summary').click(); await t.locator('#repair').click(); await t.locator('.repair-panel').waitFor();
  await synchronized(t, s, 'prerequisite repair'); await t.locator(returnSelector).click(); await t.locator('#answer-form').waitFor();
  assert.deepEqual((await synchronized(t, s, 'return to saved guided work')).progress.sessions[guidedKey], saved);
  covered.add(config.entry); return { t, s };
}
async function familyCoverage(teacherSession, studentSession, config, t, s) {
  stage(config.id + ': every topic task and laboratory');
  for (const lesson of config.lessons) {
    await overview(t, config);
    if (!covered.has(lesson)) {
      await t.locator('.exam-topic a[href="#practice/' + lesson + '/independent"]').click(); await t.locator('#answer-form').waitFor();
      const initial = await synchronized(t, s, lesson + ': task identity');
      assert.equal(initial.route, '#practice/' + lesson + '/independent');
      await draft(t, s, lesson, 'independent', '2/');
      await taskModel(t, s, lesson); await help(t, s, lesson); covered.add(lesson);
      await overview(t, config);
    }
    await t.locator('a[href="#lesson/' + lesson + '"]').click(); await t.locator('#explore-lab > summary').click();
    const lab = await synchronized(t, s, lesson + ': lesson lab disclosure');
    assert.equal(lab.view.details.lab, true); assert.notEqual(lab.view.model, null);
    const modelName = await t.evaluate(id => ProfileLessons.find(lesson => lesson.id === id).model, lesson);
    const full = !labsCovered.has(modelName);
    await changeLab(t, s, lesson, full);
    if (full) await dragLab(teacherSession.page, t, s, lesson);
    labsCovered.add(modelName);
  }
  // Exercise a hydrated closure on the new writer, beyond merely comparing JSON.
  await handoff(teacherSession.page, studentSession.page, config, true);
  await changeLab(s, t, config.id + ': student continues restored laboratory');
  await handoff(teacherSession.page, studentSession.page, config, false);
  return { t, s };
}
async function exampleAndResult(t, s, config) {
  stage(config.id + ': authored example and completed independent result');
  await overview(t, config); await t.locator('a[href="#lesson/' + config.entry + '"]').click();
  await t.locator('a[href="#example/' + config.entry + '"]').click(); await t.locator('#example-solution').waitFor();
  assert.equal((await snapshot(t)).view.solution.count, 1);
  await t.locator('#example-next').click(); assert.equal((await snapshot(t)).view.solution.count, 2);
  await synchronized(t, s, 'example step prefix and model');
  await overview(t, config); await t.locator('.exam-topic a[href="#practice/' + config.entry + '/independent"]').click(); await t.locator('#answer-form').waitFor();
  const taskId = (await snapshot(t)).progress.sessions[config.entry + ':independent'].taskId;
  const correct = await t.evaluate(({ lesson, task }) => String(ProfileLessons.find(item => item.id === lesson).tasks.find(item => item.id === task).answer), { lesson: config.entry, task: taskId });
  await answer(t, correct); await t.locator('#submit-answer').click(); await t.locator('#next').click(); await t.locator('.result-panel').waitFor();
  const result = await synchronized(t, s, 'completed task and result model');
  assert.equal(result.progress.sessions[config.entry + ':independent'].done, true);
  assert.equal(result.progress.records[config.entry].independent.length, 0, 'assisted work is not awarded a new independent success');
  assert.equal(await t.locator('#result-solution [data-solution-step]').count(), 1, 'result initially reveals only the first authored solution step');
  await t.locator('#result-solution [data-solution-next]').click(); await synchronized(t, s, 'completed result next explanation');
}
async function run(browser, siteOrigin, boardOrigin) {
  await canonicalEntries(browser, siteOrigin, boardOrigin);
  stage('real local room and registered picker');
  const teacherSession = await contextFor(browser, siteOrigin, boardOrigin, 'teacher'), studentSession = await contextFor(browser, siteOrigin, boardOrigin, 'student');
  const teacher = teacherSession.page, student = studentSession.page;
  await teacher.goto(siteOrigin + '/trainers/trainer-board.html?server=' + encodeURIComponent(boardOrigin), { waitUntil: 'domcontentloaded' });
  await teacher.locator('#openShare').click(); await teacher.locator('#createRoom').click();
  await teacher.waitForFunction(() => document.querySelector('#shareStatus')?.textContent === 'подключено' && document.querySelector('#studentLink')?.value.includes('role=student'), null, { polling: 25 });
  const studentLink = await teacher.locator('#studentLink').inputValue();
  assert.equal(new URL(studentLink).origin, siteOrigin); assert.equal(new URL(studentLink).searchParams.get('server'), boardOrigin);
  assert.equal(new URL(teacher.url()).searchParams.has('token'), false);
  await teacher.locator('#sharePanel [data-close-panel]').click(); await student.goto(studentLink, { waitUntil: 'domcontentloaded' });
  for (const config of CONFIGS) {
    stage(config.id + ': registered entry and isolated initial state');
    await teacher.locator('#trainerQuick option[value="' + config.wrapper + '"]').waitFor({ state: 'attached' });
    await teacher.locator('#chooseTrainer').click(); await teacher.locator('#pickerSearch').fill(config.id);
    await teacher.locator('#pickerResults .picker-item').filter({ hasText: 'ЕГЭ профиль №' + config.number }).click();
    await Promise.all([connected(teacher), connected(student)]);
    let t = await profileFrame(teacher, config), s = await profileFrame(student, config);
    await synchronized(t, s, 'registered default route');
    assert.equal(await t.locator('.return-to-task').count(), 0, 'personal return target is not read');
    assert.deepEqual(await t.locator('.exam-topic a[href$="/independent"]').evaluateAll(links => links.map(link => link.hash.split('/')[1]).sort()), config.lessons.slice().sort());
    const tasks = await t.evaluate(number => ProfileLessons.filter(lesson => lesson.position === number).reduce((sum, lesson) => sum + lesson.tasks.length, 0), config.number);
    assert.equal(tasks, config.lessons.length * 6, 'complete authored task inventory is loaded');
    await teacher.setViewportSize({ width: 320, height: 900 });
    assert(await t.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'narrow overview has no horizontal overflow');
    if (SHOTS) await teacher.screenshot({ path: join(SHOTS, config.id + '-320.png') });
    await teacher.setViewportSize({ width: 1440, height: 1000 });
    if (await t.locator('#calm-toggle').getAttribute('aria-pressed') === 'false') await t.locator('#calm-toggle').click();
    await synchronized(t, s, 'shared Calm preference');
    ({ t, s } = await deepJourney(teacherSession, studentSession, config));
    ({ t, s } = await familyCoverage(teacherSession, studentSession, config, t, s));

    stage(config.id + ': late join model hydration and malformed apply');
    const state = await snapshot(t), visible = await view(t), late = await contextFor(browser, siteOrigin, boardOrigin, 'late-' + config.suffix);
    await late.page.goto(studentLink, { waitUntil: 'domcontentloaded' }); await connected(late.page); const lf = await profileFrame(late.page, config);
    await waitSnapshot(lf, state, 'late join'); assert.deepEqual(await view(lf), visible, 'late observer restores actual model geometry and controls');
    await changeLab(t, s, config.id + ': teacher continues after late join'); await synchronized(t, lf, 'late observer follows subsequent interaction');
    const before = await snapshot(t), beforeView = await view(t);
    assert.equal(await t.evaluate(() => {
      const bad = structuredClone(window.__profileGateApi.getState()); bad.route = '#exam/3';
      try { return window.__profileGateApi.applyState(bad) === false; } catch (_) { return true; }
    }), true, 'foreign trainer route is rejected atomically');
    assert.deepEqual(await snapshot(t), before); assert.deepEqual(await view(t), beforeView);
    const counts = await quiet([teacher, student, late.page], 'idle with late observer'); await wait(400);
    assert.deepEqual(await Promise.all([teacher, student, late.page].map(messages)), counts, 'idle observers do not cause repeated publication');
    await personalStorage(late); await late.context.close();
    await exampleAndResult(t, s, config);
    await Promise.all([teacherSession, studentSession].map(personalStorage));
    console.log('PASS ' + config.id + ': ' + config.lessons.length + ' topics, task/help/model/history/ownership/reload/late join/storage');
  }
  assert.deepEqual([...covered].sort(), CONFIGS.flatMap(config => config.lessons).sort(), 'all 22 topic families exercised');
  assert.deepEqual(failures, [], 'no browser errors, failed local assets or production requests');
  console.log('PROFILE_ADDED_BOARD_BROWSER_OK: 5 registered wrappers; 22 topic families / 132 authored tasks; natural task and model actions; accepted history; real grant/revoke; both reload directions; per-wrapper late join; four personal stores isolated; no echo');
}
async function diagnostics() {
  for (const session of sessions) {
    if (session.page.isClosed()) continue;
    const data = await session.page.evaluate(() => ({ share: document.querySelector('#shareStatus')?.textContent, connected: typeof shared === 'object' && shared.connected, hydrated: typeof roomStateReceived === 'boolean' && roomStateReceived, mirror: document.querySelector('#mirrorStatus')?.dataset.mirrorStatus, writer: document.body.classList.contains('control-owner'), messages: window.__profileGateMessages })).catch(() => null);
    const frame = session.page.frames().find(item => /\/trainers\/ege-profile-(planimetry|vectors|probability|random-variables|equations)\.html/.test(item.url()));
    const work = frame ? await frame.evaluate(() => ({ state: window.__profileGateApi?.getState(), route: location.hash, text: document.querySelector('#main')?.innerText.slice(0, 3000) })).catch(() => null) : null;
    console.error('DIAGNOSTIC ' + session.tag + ' ' + JSON.stringify({ ...data, work }));
    if (SHOTS) await session.page.screenshot({ path: join(SHOTS, 'failure-' + session.tag + '.png'), timeout: 3000 }).catch(() => {});
  }
}
(async () => {
  if (SHOTS) mkdirSync(SHOTS, { recursive: true });
  const server = staticServer(); let browser, child, watchdog, serverErrors = '';
  try {
    await Promise.race([
      (async () => {
        await new Promise((yes, no) => { server.once('error', no); server.listen(0, '127.0.0.1', yes); });
        const siteOrigin = 'http://127.0.0.1:' + server.address().port, boardOrigin = 'http://127.0.0.1:' + await freePort();
        const env = { ...process.env, HOST: '127.0.0.1', PORT: new URL(boardOrigin).port, NODE_ENV: 'test', CORS_ALLOWED_ORIGINS: siteOrigin };
        for (const key of Object.keys(env)) if (/^(LEARNING_|PROGRESS_|GROUP_LESSON_|TRAINER_REGISTRY_PATH$)/.test(key)) delete env[key];
        child = spawn(process.execPath, ['index.js'], { cwd: join(ROOT, 'board-server'), env, stdio: ['ignore', 'ignore', 'pipe'] });
        child.stderr.on('data', chunk => { serverErrors = (serverErrors + String(chunk)).slice(-4000); });
        await healthy(boardOrigin, child, () => serverErrors);
        browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || process.env.BROWSER_EXECUTABLE_PATH, headless: true, args: ['--no-sandbox'], timeout: 15000 });
        await run(browser, siteOrigin, boardOrigin);
      })(),
      new Promise((_, reject) => { watchdog = setTimeout(() => reject(new Error('Browser gate exceeded 240 seconds at ' + phase)), 240000); })
    ]);
  } catch (error) { await diagnostics(); throw error; }
  finally {
    clearTimeout(watchdog); await browser?.close(); if (child && child.exitCode === null) child.kill('SIGTERM');
    if (server.listening) await new Promise(yes => server.close(yes));
  }
})().catch(error => { console.error('PROFILE_ADDED_BOARD_BROWSER_FAILED at ' + phase + '\n' + (error.stack || error)); process.exitCode = 1; });

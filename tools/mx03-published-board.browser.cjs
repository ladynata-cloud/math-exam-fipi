'use strict';

// Explicit, bounded acceptance against published assets and new anonymous rooms.
// No cabinet login, existing room, account API, real pupil work, or stored secret.
const assert = require('node:assert/strict');
const { readFileSync, writeFileSync } = require('node:fs');
const { createHash } = require('node:crypto');
const { chromium } = require('playwright');
const SITE = 'https://mathexam.space';
const SERVER = 'https://mathexam-board-ladynata.msk1.amvera.tech';
let TRAINER;
const ROUTES = ['oge-task11-graphs-trainer.html', 'task19-trainer.html'];
const report = { gate: 'MX03_PUBLISHED_BOARD_ACCEPTANCE', startedAt: new Date().toISOString(), status: 'RUNNING', checks: [], assets: [], pupilAccountsUsed: 0, productionRoomsCreated: 0 };
const hash = value => createHash('sha256').update(value).digest('hex');
const checks = [], contexts = [], faults = [];
let phase = 'startup', browser;
const clean = value => String(value).replace(/([?&](?:token|teacherToken|studentToken)=)[^&\s"'<>]+/gi, '$1[redacted]');
function pass(label) { checks.push(label); console.log('PASS ' + label); }
async function session(tag) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  contexts.push(context);
  await context.route('**/*', route => {
    const u = new URL(route.request().url());
    if (['data:', 'blob:'].includes(u.protocol)) return route.continue();
    if (![SITE, SERVER].includes(u.origin) || /^\/api\/(?:learning|progress)(?:\/|$)/.test(u.pathname)) {
      faults.push(tag + ': forbidden request ' + u.origin + u.pathname);
      return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000); page.setDefaultNavigationTimeout(60000);
  page.on('pageerror', error => faults.push(tag + ': ' + clean(error.message)));
  return { context, page, tag };
}
async function connected(s) {
  await s.page.waitForFunction(() => typeof shared === 'object' && shared.connected && roomStateReceived &&
    document.querySelector('#mirrorStatus')?.dataset.mirrorStatus === 'connected', null, { timeout: 60000 });
  const frame = s.page.frames().find(f => f.url().includes('/trainers/' + TRAINER));
  assert(frame, s.tag + ': published selected trainer iframe');
  await frame.waitForFunction(() => typeof getBoardTrainerState === 'function');
  s.frame = frame;
}
const native = s => s.frame.evaluate(() => getBoardTrainerState());
const board = s => s.page.evaluate(() => publicSnapshot());
async function sameTrainer(a, b) {
  const expected = await native(a);
  await b.frame.waitForFunction(value => JSON.stringify(getBoardTrainerState()) === JSON.stringify(value), expected, { timeout: 20000 });
  assert.deepEqual(await native(b), expected, 'native task, actions, drafts, hints and workspace');
  const visible = frame => frame.evaluate(() => {
    const ids = ['m4-desc','m4-soft','m4-good','t11-help-readout','statement','answerExplanation','resultTitle'];
    return { text: Object.fromEntries(ids.map(id=>[id,document.getElementById(id)?.textContent||''])),
      graphs: [...document.querySelectorAll('#m4-graphs svg,#t11-help-graph,#visualHost svg')].map(el=>el.outerHTML),
      fields: [...document.querySelectorAll('#m4 input,#m4 select,#t11-help-panel input,#visualHost input')].map(el=>[el.id,el.value,el.disabled]) };
  });
  assert.deepEqual(await visible(b.frame), await visible(a.frame), 'rendered condition, graphs, feedback and model controls');
}
function semantic(value) {
  const out = JSON.parse(JSON.stringify(value));
  for (const sheet of out.pages) for (const stroke of sheet.strokes) delete stroke.createdAt;
  return out;
}
async function sameBoard(a, b) {
  const expected = semantic(await board(a));
  await b.page.waitForFunction(value => {
    const actual = JSON.parse(JSON.stringify(publicSnapshot()));
    for (const sheet of actual.pages) for (const stroke of sheet.strokes) delete stroke.createdAt;
    return JSON.stringify(actual) === JSON.stringify(value);
  }, expected, { timeout: 20000 });
  assert.deepEqual(semantic(await board(b)), expected, 'shared drawing objects and sheets');
}
async function action(a, b, label, perform) {
  phase = label; const before = JSON.stringify(await native(a));
  await perform();
  await a.frame.waitForFunction(value => JSON.stringify(getBoardTrainerState()) !== value, before);
  await sameTrainer(a, b); pass(label);
}
async function gesture(s, start, end) {
  const canvas = s.page.locator('#canvas'); await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  assert(box && box.width > end.x && box.height > end.y, 'gesture is inside the visible canvas');
  await s.page.mouse.move(box.x + start.x, box.y + start.y); await s.page.mouse.down();
  await s.page.mouse.move(box.x + end.x, box.y + end.y, { steps: 8 }); await s.page.mouse.up();
}
async function draw(a, b, tool, y) {
  phase = 'draw ' + tool;
  const button = a.page.locator('[data-tool="' + tool + '"]');
  if (!await button.isVisible()) await a.page.locator('details.shape-menu > summary').click();
  await button.click();
  const before = await board(a), index = before.currentPage, count = before.pages[index].strokes.length;
  await gesture(a, { x: 70, y }, { x: 190, y: y + 25 });
  await a.page.waitForFunction(({ index, count }) => publicSnapshot().pages[index].strokes.length === count + 1, { index, count });
  await sameBoard(a, b);
  assert((await board(b)).pages[index].strokes.at(-1).objectId, 'server retained a completed drawing object');
  pass(tool + ' synchronized');
}
async function control(teacher, pupil, pupilWrites) {
  phase = 'control handoff';
  await teacher.page.locator('#boardControlToggle').click();
  await pupil.page.waitForFunction(value => canWrite() === value, pupilWrites);
  await teacher.page.waitForFunction(value => canWrite() !== value, pupilWrites);
  assert.equal(await teacher.page.locator('#trainerFrame').evaluate(el=>el.inert),pupilWrites);
  assert.equal(await pupil.page.locator('#trainerFrame').evaluate(el=>el.inert),!pupilWrites);
  await sameTrainer(pupilWrites ? pupil : teacher, pupilWrites ? teacher : pupil);
  await sameBoard(teacher, pupil);
}
async function reconnect(disconnected, active, note) {
  phase = disconnected.tag + ' transport interruption';
  // Arm the listener before offline emulation: Chromium may close the socket
  // synchronously while setOffline resolves, before a later listener exists.
  await disconnected.page.evaluate(() => {
    window.__smokeDisconnected = false;
    shared.socket.once('disconnect', () => { window.__smokeDisconnected = true; });
  });
  await disconnected.context.setOffline(true);
  // Ensure an existing WebSocket is dropped too; keep automatic retry enabled.
  await disconnected.page.evaluate(() => {
    if (shared.socket.connected) shared.socket.io.engine.close();
  });
  await disconnected.page.waitForFunction(() => window.__smokeDisconnected && !shared.connected);
  pass(disconnected.tag + ' transport loss detected');
  await active.frame.locator(TRAINER === ROUTES[0] ? '#m4-hint' : '#hintToggle').click();
  await draw(active, active, 'pen', 360);
  await disconnected.context.setOffline(false);
  await connected(disconnected);
  await sameTrainer(active, disconnected); await sameBoard(active, disconnected);
  assert.deepEqual(await native(disconnected), await native(active));
  pass(disconnected.tag + ' automatically reconnects with changes made while offline');
}
async function run() {
  assert.equal(process.env.MATHEXAM_PUBLISHED_SMOKE, '1', 'explicit live-test opt-in is required');
  phase = 'published asset identity';
  const shared = ['trainer-board.html','board-bridge.js','board-ink.js','board-writing.js','board-layout.js','board-images.js','board-compat.json','board-picker.js'];
  const adapters = ['oge-task11-graphs-trainer.html','oge-native-10-14-board.js','oge-course-shared-mode.js','oge-course-reference.js','oge-course-algebra-reference.js','oge-course-reference-entry.js',
    'task19-trainer.html','task19-board-session.js','task19-visual-data.js','task19-models-triangles.js',
    'task19-models-circles.js','task19-models-lines-polygons.js','task19-visual-models.js','task19-reference.js',
    'task19-textbook-data.js','task19-textbook-reference.js','task19-visual-app.js'];
  for (const name of [...shared,...adapters]) {
    const path = 'trainers/' + name;
    const response = await fetch(SITE + '/' + path, { headers: { 'Cache-Control': 'no-cache' }, signal: AbortSignal.timeout(30000) });
    assert.equal(response.status, 200, path);
    const actual = hash(Buffer.from(await response.arrayBuffer()));
    assert.equal(actual, hash(readFileSync(path)), 'published bytes: ' + path);
    report.assets.push({ path, sha256: actual });
  }
  pass('all relevant published assets match checked-out runtime');
  browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath:process.env.CHROMIUM_EXECUTABLE_PATH} : {}) });
  for (TRAINER of ROUTES) {
    phase = TRAINER + ' create isolated room';
    const teacher = await session(TRAINER + ' teacher');
    await teacher.page.goto(SITE + '/trainers/trainer-board.html?trainer=' + encodeURIComponent('/trainers/' + TRAINER + (TRAINER === ROUTES[1] ? '?card=prev-102' : '')) + '&server=' + encodeURIComponent(SERVER), { waitUntil: 'domcontentloaded' });
    await teacher.page.locator('#openShare').click();
    await teacher.page.locator('#createRoom').click();
    await connected(teacher); report.productionRoomsCreated++;
    const studentLink = await teacher.page.locator('#studentLink').inputValue(), url = new URL(studentLink);
    assert.equal(url.origin, SITE); assert.equal(url.searchParams.get('server'), SERVER); assert.equal(url.searchParams.get('role'), 'student');
    await teacher.page.locator('#sharePanel [data-close-panel]').click();
    const pupil = await session(TRAINER + ' pupil'); await pupil.page.goto(studentLink, { waitUntil: 'domcontentloaded' }); await connected(pupil);
    await sameTrainer(teacher, pupil); await sameBoard(teacher, pupil); pass(TRAINER + ' initial condition and graph');
    if (TRAINER === ROUTES[0]) {
      const options = await teacher.frame.locator('#oge-board-type option').evaluateAll(nodes => nodes.map(n => n.value));
      assert.equal(options.length, 5);
      for (const value of options.slice(1).concat(options[0])) {
        await action(teacher,pupil,'task11 family '+value,()=>teacher.frame.locator('#oge-board-type').selectOption(value));
      }
      await action(teacher,pupil,'task11 answer draft',()=>teacher.frame.locator('#m4-answer').fill('999'));
      await action(teacher,pupil,'task11 answer feedback',()=>teacher.frame.locator('#m4-check').click());
      await action(teacher,pupil,'task11 hint',()=>teacher.frame.locator('#m4-hint').click());
      await action(teacher,pupil,'task11 function help',()=>teacher.frame.locator('.function-help').first().click());
      await action(teacher,pupil,'task11 start graph exploration',()=>teacher.frame.locator('#t11-help-start').click());
      await action(teacher,pupil,'task11 highlight graph',()=>teacher.frame.locator('#t11-help-highlight').click());
      const range=teacher.frame.locator('#t11-help-panel input[type=range]').first();
      await range.focus();
      const key = await range.evaluate(el => Number(el.value)<Number(el.max) ? 'ArrowRight' : 'ArrowLeft');
      await action(teacher,pupil,'task11 model keyboard input',()=>range.press(key));
      await action(teacher,pupil,'task11 retain closed helper',()=>teacher.frame.locator('#t11-help-close').click());
    } else {
      await action(teacher,pupil,'task19 hint',()=>teacher.frame.locator('#hintToggle').click());
      const range=teacher.frame.locator('#visualHost input[type=range]').first();
      assert(await range.count(),'task19 current card has an interactive model');
      await range.focus();
      const key=await range.evaluate(el=>Number(el.value)<Number(el.max)?'ArrowRight':'ArrowLeft');
      await action(teacher,pupil,'task19 model keyboard input',()=>range.press(key));
      await action(teacher,pupil,'task19 measurements',()=>teacher.frame.locator('.t19-measure').click());
      await action(teacher,pupil,'task19 answer and explanation',()=>teacher.frame.locator('#btnFalse').click());
      await action(teacher,pupil,'task19 textbook disclosure',()=>teacher.frame.locator('#textbookHost details > summary').first().click());
    }
    await draw(teacher,pupil,'pen',100);
    const textTool=teacher.page.locator('[data-tool="text"]');
    if(!await textTool.isVisible()) await teacher.page.locator('details.shape-menu > summary').click();
    await textTool.click();
    await gesture(teacher,{x:90,y:240},{x:90,y:240});
    await teacher.page.locator('#editor').fill('Синтетическая запись: проверяю модель.');
    await teacher.page.locator('#editor').press('Control+Enter');
    await sameBoard(teacher,pupil);
    assert.equal((await board(pupil)).pages.at(-1).strokes.at(-1).text,'Синтетическая запись: проверяю модель.');
    pass(TRAINER+' written note synchronizes');
    const observer = semantic(await board(pupil));
    await gesture(pupil,{x:230,y:70},{x:300,y:100});
    assert.deepEqual(semantic(await board(pupil)),observer); pass(TRAINER+' observer cannot draw');
    await control(teacher,pupil,true); pass(TRAINER+' teacher grants pupil control');
    if (TRAINER === ROUTES[0]) {
      await action(pupil,teacher,'task11 pupil correction returns',()=>pupil.frame.locator('#m4-answer').fill('123'));
      await action(pupil,teacher,'task11 pupil checks correction',()=>pupil.frame.locator('#m4-check').click());
    } else {
      await action(pupil,teacher,'task19 pupil next assertion',()=>pupil.frame.locator('#nextCard').click());
      await action(pupil,teacher,'task19 pupil answer returns',()=>pupil.frame.locator('#btnTrue').click());
    }
    await draw(pupil,teacher,'line',180);
    await reconnect(teacher,pupil);
    await control(teacher,pupil,false); pass(TRAINER+' teacher regains control');
    await reconnect(pupil,teacher);
    phase=TRAINER+' reload';
    const expectedNative=await native(teacher), expectedPages=(await board(teacher)).pages;
    for(const target of [teacher,pupil]) {
      await target.page.reload({waitUntil:'domcontentloaded'}); await connected(target);
      await target.frame.waitForFunction(value=>JSON.stringify(getBoardTrainerState())===JSON.stringify(value),expectedNative);
      assert.deepEqual((await board(target)).pages,expectedPages,'exact server drawing restoration');
      pass(target.tag+' reload restores trainer/model/answer and board');
    }
    const late=await session(TRAINER+' late pupil'); await late.page.goto(studentLink,{waitUntil:'domcontentloaded'}); await connected(late);
    await sameTrainer(teacher,late); assert.deepEqual((await board(late)).pages,expectedPages);
    pass(TRAINER+' late join restores trainer and board');
    report[TRAINER]={nativeSha256:hash(JSON.stringify(expectedNative)),pagesSha256:hash(JSON.stringify(expectedPages))};
    for(const current of [teacher,pupil,late]) await current.context.close();
  }
  assert.deepEqual(faults,[], 'no browser errors or requests outside allowed public origins/account boundary');
}

(async () => {
  try { await run(); report.status = 'PASS'; }
  catch (error) { report.status = 'FAIL'; report.failure = { phase, message: clean(error.message) }; process.exitCode = 1; }
  finally {
    for (const context of contexts) await context.close().catch(() => {});
    await browser?.close();
    report.checks = checks; report.finishedAt = new Date().toISOString();
    writeFileSync('mx03-published-board-result.json', JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report));
  }
})();

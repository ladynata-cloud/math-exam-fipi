'use strict';

// Native Chromium acceptance against the real board host and a disposable local
// Socket.IO service. No production rooms, accounts, or external network calls.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const net = require('node:net');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');
const D = require('../trainers/college-logarithms/data.js');
const E = require('../trainers/college-logarithms/engine.js');
const ROOT = path.resolve(__dirname, '..');
const COURSE = '/trainers/college-logarithms/index.html';
const checks = [], faults = [], contexts = [];
const artifacts = process.env.LOGARITHMS_ARTIFACT_DIR;
let web, service, browser, phase = 'startup';
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
function pass(label) { checks.push(label); console.log('PASS ' + label); }
async function freePort() {
  const server = net.createServer(); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port; await new Promise(resolve => server.close(resolve)); return port;
}
async function start() {
  web = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://local').pathname);
    let file = path.resolve(ROOT, '.' + pathname);
    if (!file.startsWith(ROOT + path.sep)) return res.writeHead(403).end();
    try {
      if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
      const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
      res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
      res.end(req.method === 'HEAD' ? '' : fs.readFileSync(file));
    } catch (_) { res.writeHead(404).end('Not found'); }
  });
  await new Promise(resolve => web.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + web.address().port, port = await freePort(), server = 'http://127.0.0.1:' + port;
  service = spawn(process.execPath, ['index.js'], { cwd: path.join(ROOT, 'board-server'), env: { PATH: process.env.PATH, NODE_ENV: 'test', HOST: '127.0.0.1', PORT: String(port), CORS_ALLOWED_ORIGINS: origin }, stdio: ['ignore', 'pipe', 'pipe'] });
  let stderr = ''; service.stdout.resume(); service.stderr.on('data', chunk => { stderr += chunk; });
  for (let i = 0; i < 150; i++) {
    assert.equal(service.exitCode, null, 'Local board service exited: ' + stderr);
    try { if ((await fetch(server + '/health')).ok) break; } catch (_) { /* Still starting. */ }
    await pause(40);
  }
  const health = await (await fetch(server + '/health')).json(); assert.equal(health.ok, true);
  const registry = await (await fetch(server + '/api/trainer-registry')).json();
  assert.equal(registry.trainers.filter(t => t.trainerId === 'college-logarithms').length, 1);
  browser = await chromium.launch({ executablePath: process.env.BROWSER_EXECUTABLE_PATH || process.env.CHROMIUM_EXECUTABLE_PATH || undefined, headless: true, args: ['--no-sandbox'] });
  if (artifacts) fs.mkdirSync(artifacts, { recursive: true });
  return { origin, server };
}
async function session(origin, server, tag) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } }); contexts.push(context);
  await context.route('**/*', route => {
    const u = new URL(route.request().url());
    if (['data:', 'blob:'].includes(u.protocol)) return route.continue();
    if (![origin, server].includes(u.origin) || /^\/api\/(?:learning|progress)(?:\/|$)/.test(u.pathname)) { faults.push(tag + ': unexpected network origin/path'); return route.abort(); }
    return route.continue();
  });
  const page = await context.newPage(); page.setDefaultTimeout(12000);
  page.on('pageerror', error => faults.push(tag + ': ' + error.message.replace(/token=[^&\s]+/g, 'token=[redacted]')));
  return { context, page, tag };
}
async function connected(s) {
  await s.page.waitForFunction(() => typeof shared === 'object' && shared.connected && roomStateReceived && document.querySelector('#mirrorStatus').dataset.mirrorStatus === 'connected');
  s.frame = s.page.frames().find(f => f.url().includes(COURSE)); assert.ok(s.frame, 'Course iframe');
  await s.frame.waitForFunction(() => typeof getBoardTrainerState === 'function');
}
const snapshot = s => s.frame.evaluate(() => getBoardTrainerState());
async function same(a, b) {
  const expected = await snapshot(a);
  await b.frame.waitForFunction(state => JSON.stringify(getBoardTrainerState()) === JSON.stringify(state), expected);
  assert.deepEqual(await snapshot(b), expected);
  const visible = frame => frame.evaluate(() => ({ condition: document.querySelector('#condition').innerHTML, history: document.querySelector('#history').innerHTML, graph: document.querySelector('#visual').innerHTML.replace(/college-log-(plot|line)-\d+/g,'college-log-$1-instance'), hint: document.querySelector('#hint').innerHTML, step: document.querySelector('#current-step').innerHTML }));
  // Input value properties do not change innerHTML; semantic equality above
  // also checks every draft. Normalize only per-render SVG accessibility/clip
  // instance IDs; compare every geometric value and retained explanation.
  const left = await visible(a.frame), right = await visible(b.frame);
  assert.equal(right.condition, left.condition); assert.equal(right.history, left.history); assert.equal(right.graph, left.graph); assert.equal(right.hint, left.hint);
}
async function action(a, b, label, perform) {
  phase = label; const before = JSON.stringify(await snapshot(a)); await perform();
  await a.frame.waitForFunction(value => JSON.stringify(getBoardTrainerState()) !== value, before);
  await same(a, b); pass(label);
}
async function selectModule(a, b, id) {
  if (!await a.frame.locator('#route').isVisible()) await action(a,b,'open topic menu ' + id,()=>a.frame.locator('#route-toggle').click());
  await action(a,b,'select module ' + id,()=>a.frame.locator('[data-module="' + id + '"]').click());
}
async function fillAnswer(frame, step) {
  if (step.kind === 'choice') await frame.locator('[data-choice="' + step.answer + '"]').click();
  if (step.kind === 'number') await frame.locator('#answer').fill(String(step.answer));
  if (step.kind === 'point') { await frame.locator('#point-x').fill(String(step.answer.x)); await frame.locator('#point-y').fill(String(step.answer.y)); }
  if (step.kind === 'interval') {
    await frame.locator('#interval-lo').fill(step.answer.lo === null ? '-∞' : String(step.answer.lo));
    await frame.locator('#interval-hi').fill(step.answer.hi === null ? '+∞' : String(step.answer.hi));
    await frame.locator('#interval-left').selectOption(step.answer.loClosed ? '[' : '(');
    await frame.locator('#interval-right').selectOption(step.answer.hiClosed ? ']' : ')');
  }
  if (step.kind === 'transform') {
    await frame.locator('#graph-base').selectOption(String(step.answer.base));
    await frame.locator('#graph-sign').selectOption(String(step.answer.sign));
    for (const axis of ['h','k']) {
      const input = frame.locator('#graph-' + axis); await input.focus(); await input.press('Home');
      for(let i=-4;i<step.answer[axis];i++)await input.press('ArrowRight');
    }
  }
}
async function run() {
  const { origin, server } = await start();
  const solo = await session(origin, server, 'standalone');
  await solo.page.goto(origin + COURSE + '?task=graph-up-02');
  await solo.page.waitForFunction(() => !!window.CollegeLogarithmsApp);
  for (const width of [1280,320]) {
    phase = 'layout ' + width; await solo.page.setViewportSize({ width, height: 900 });
    assert.ok(await solo.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'No horizontal overflow');
    const condition = await solo.page.locator('#condition').boundingBox(), graph = await solo.page.locator('#visual').boundingBox(), prompt = await solo.page.locator('.step-prompt').boundingBox();
    assert.ok(condition.y < 450 && graph.y < 600 && prompt.y < 900, 'Condition, graph and current question appear on first screen');
    if (artifacts) await solo.page.screenshot({path:path.join(artifacts,'course-'+width+'.png'),fullPage:true});
    pass('task-first layout ' + width + 'x900');
  }
  await solo.page.setViewportSize({width:1280,height:900});
  // The given x is exactly 1/3; native point placement must not round it to 1/2.
  const point = D.getTask('graph-up-02').steps[0].answer;
  const pixel = await solo.page.evaluate(p => { const s = document.querySelector('svg[data-log-graph]'), g = CollegeLogarithmsApp.snapshot().graph, q = CollegeLogarithmsPlot.toPixel(p.x,p.y,g), pt = s.createSVGPoint(); pt.x=q.x;pt.y=q.y; const v=pt.matrixTransform(s.getScreenCTM()); return {x:v.x,y:v.y}; },point);
  await solo.page.mouse.click(pixel.x,pixel.y); await solo.page.locator('#check').click();
  assert.equal(await solo.page.evaluate(()=>CollegeLogarithmsApp.snapshot().stage),1); pass('native placement of a point with exact fractional x');
  await solo.page.locator('#point-y').fill('12'); await solo.page.locator('#hint-toggle').click(); await solo.page.locator('#hint-toggle').click();
  assert.equal(await solo.page.locator('#point-y').inputValue(),'12'); await solo.page.reload();
  assert.equal(await solo.page.locator('#point-y').inputValue(),'12'); pass('draft and assistance survive hint close and reload');
  await solo.page.goto(origin+COURSE+'?task=profile-11');
  assert.equal(await solo.page.locator('#lab').isVisible(),false); assert.equal(await solo.page.locator('#graph-formula').textContent(),'');
  assert.equal(await solo.page.locator('#hint-toggle').isVisible(),false); pass('profile graph assessment hides model controls and formula');

  const teacher = await session(origin,server,'teacher'), pupil = await session(origin,server,'student');
  for(const s of [teacher,pupil]){
    await s.context.addInitScript(({course,tag})=>{
      if(location.pathname===course){window.__courseStorage={reads:0,writes:0}; const get=Storage.prototype.getItem,set=Storage.prototype.setItem;Storage.prototype.getItem=function(...a){window.__courseStorage.reads++;return get.apply(this,a)};Storage.prototype.setItem=function(...a){window.__courseStorage.writes++;return set.apply(this,a)}}
      else if(location.pathname.endsWith('/trainer-board.html'))localStorage.setItem('mathExam.collegeLogarithms.v1','synthetic-'+tag);
    },{course:COURSE,tag:s.tag});
  }
  phase='create local shared room';
  await teacher.page.goto(origin+'/trainers/trainer-board.html?trainer='+encodeURIComponent(COURSE+'?task=meaning-01')+'&server='+encodeURIComponent(server));
  await teacher.page.locator('#openShare').click(); await teacher.page.locator('#createRoom').click(); await connected(teacher);
  const studentLink=await teacher.page.locator('#studentLink').inputValue(); assert.equal(new URL(studentLink).origin,origin);
  await teacher.page.locator('#sharePanel [data-close-panel]').click();
  await pupil.page.goto(studentLink); await connected(pupil); await same(teacher,pupil); pass('real board host creates and joins a local mirrored room');
  const first=D.getTask('meaning-01').steps[0];
  await action(teacher,pupil,'first native choice synchronizes without an extra click',()=>teacher.frame.locator('[data-choice="'+first.answer+'"]').click());
  await action(teacher,pupil,'accepted step synchronizes',()=>teacher.frame.locator('#check').click());
  await action(teacher,pupil,'partial answer synchronizes',()=>teacher.frame.locator('#answer').fill('9'));
  await action(teacher,pupil,'wrong answer feedback synchronizes',()=>teacher.frame.locator('#check').click());
  await action(teacher,pupil,'contextual hint synchronizes',()=>teacher.frame.locator('#hint-toggle').click());
  await selectModule(teacher,pupil,'graph-moves');
  const moved=D.getTask('graph-moves-01');
  await fillAnswer(teacher.frame,moved.steps[0]); await action(teacher,pupil,'graph prediction accepted',()=>teacher.frame.locator('#check').click());
  await teacher.frame.locator('#graph-h').focus();
  await action(teacher,pupil,'native slider forward movement',()=>teacher.frame.locator('#graph-h').press('ArrowRight'));
  await action(teacher,pupil,'native slider reverse movement',()=>teacher.frame.locator('#graph-h').press('ArrowLeft'));
  await fillAnswer(teacher.frame,moved.steps[1]); await action(teacher,pupil,'graph transformation accepted',()=>teacher.frame.locator('#check').click());
  await action(teacher,pupil,'constructed-point draft synchronizes',()=>teacher.frame.locator('#point-x').fill('3'));
  await teacher.page.locator('#boardControlToggle').click();
  await pupil.page.waitForFunction(()=>canWrite()===true); await teacher.page.waitForFunction(()=>canWrite()===false);
  await action(pupil,teacher,'student continues after control handoff',()=>pupil.frame.locator('#point-y').fill('0'));
  await pupil.page.reload(); await connected(pupil); await same(teacher,pupil); pass('student reload hydrates the retained task and drafts');
  // Disconnecting the controlling pupil may already return control to the
  // teacher. Do not toggle it back to the pupil while testing recovery.
  phase='teacher control after pupil reload';
  if(!await teacher.page.evaluate(()=>canWrite()))await teacher.page.locator('#boardControlToggle').click();
  await teacher.page.waitForFunction(()=>canWrite()===true); await pupil.page.waitForFunction(()=>canWrite()===false); pass('teacher regains control');
  const canvas=teacher.page.locator('#canvas'); await canvas.scrollIntoViewIfNeeded(); const box=await canvas.boundingBox();
  await teacher.page.locator('[data-tool="pen"]').click(); await teacher.page.mouse.move(box.x+70,box.y+70);await teacher.page.mouse.down();await teacher.page.mouse.move(box.x+150,box.y+105,{steps:6});await teacher.page.mouse.up();
  await pupil.page.waitForFunction(()=>publicSnapshot().pages[0].strokes.length>0);pass('freehand board drawing remains synchronized alongside the course');
  const late=await session(origin,server,'late-student');await late.page.goto(studentLink);await connected(late);await same(teacher,late);pass('late join receives the current graph and drafts');
  for(const s of [teacher,pupil]){
    assert.deepEqual(await s.frame.evaluate(()=>window.__courseStorage),{reads:0,writes:0});
    assert.equal(await s.page.evaluate(()=>localStorage.getItem('mathExam.collegeLogarithms.v1')),'synthetic-'+s.tag);
  }
  pass('shared trainer never reads or writes personal course storage');
  if(artifacts)await teacher.page.screenshot({path:path.join(artifacts,'shared-board.png'),fullPage:true});
  assert.deepEqual(faults,[],'No browser exceptions or external/private-service calls');
  const report={gate:'COLLEGE_LOGARITHMS_BROWSER_OK',browser:browser.version(),checks,productionRooms:0,learnerAccounts:0,status:'PASS'};
  if(artifacts)fs.writeFileSync(path.join(artifacts,'browser-report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report));
}
run().catch(error=>{console.error('FAIL '+phase+': '+String(error.stack||error).replace(/token=[^&\s]+/g,'token=[redacted]'));process.exitCode=1}).finally(async()=>{
  if(browser)await browser.close();
  if(service&&service.exitCode===null){const exited=new Promise(resolve=>service.once('exit',resolve));service.kill();await exited}
  if(web)await new Promise(resolve=>web.close(resolve));
});

'use strict';

// Chromium transport for the shared synthetic-pupil suite. The robot sees the
// same visible-DOM snapshot as the DOM transport. The private SQLite session
// and task envelope stay in this adapter and never enter its strategy.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require('playwright');
const {runSuite, snapshotDOM, makeSession, scenarios} = require('./learning-arithmetic-robots.cjs');

const harness = `<!doctype html><html lang="ru"><meta charset="utf-8">
<title>Synthetic arithmetic pupils</title>
<style>html,body{margin:0}iframe{display:block;width:100vw;height:95vh;border:0}</style>
<script>
window.robotFrames={};window.robotEvents=[];
window.addEventListener('message',event=>{
 const message=event.data;if(message?.protocol!=='mathexam-learning')return;
 const entry=Object.values(robotFrames).find(item=>item.frame.contentWindow===event.source&&item.channel===message.channel);
 if(!entry)return;
 if(message.type==='ready'){entry.instance=message.instance;entry.ready=true;}
 else if(message.instance===entry.instance&&message.type==='applied')entry.applied=message.payload;
 else if(message.instance===entry.instance&&message.type==='change')robotEvents.push({id:entry.id,payload:message.payload});
});
window.robotOpen=(id,url)=>{
 robotFrames[id]?.frame.remove();delete robotFrames[id];
 const frame=document.createElement('iframe'),channel=id+'ArithmeticRobots'+crypto.randomUUID().replaceAll('-','');
 frame.sandbox='allow-scripts';
 frame.src=url+'?learning=1&parentOrigin='+encodeURIComponent(location.origin)+'&channel='+channel;
 frame.dataset.robot=id;robotFrames[id]={id,frame,channel};document.body.append(frame);
};
window.robotHydrate=(id,envelope,readOnly)=>{
 const item=robotFrames[id];item.applied=null;
 item.frame.contentWindow.postMessage({protocol:'mathexam-learning',version:1,channel:item.channel,instance:item.instance,
 type:'hydrate',payload:{taskSpec:envelope.taskSpec,state:envelope.state,readOnly}},'*');
};
</script></html>`;

function staticServer(root) {
  return http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (pathname === '/__arithmetic-robots') {
      response.setHeader('Content-Type', 'text/html; charset=utf-8');
      response.end(harness); return;
    }
    const file = path.resolve(root, '.' + pathname);
    if (!file.startsWith(root + path.sep)) { response.writeHead(403); response.end(); return; }
    fs.readFile(file, (error, contents) => {
      if (error) { response.writeHead(404); response.end(); return; }
      const mime = file.endsWith('.js') ? 'application/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html';
      response.setHeader('Content-Type', mime + '; charset=utf-8'); response.end(contents);
    });
  });
}

// Use the same visible disclosures as a pupil; never force-click hidden help.
async function revealManagedControl(frame, id) {
  const target = frame.locator('#' + id);
  if (await target.isVisible()) return target;
  const disclosure = id === 'lm-note' ? '#lm-notes' :
    ['lm-learn', 'lm-practice', 'lm-rule'].includes(id) ? '#lm-tools' : null;
  if (disclosure) {
    const details = frame.locator(disclosure);
    if (await details.count() && await details.getAttribute('open') === null)
      await details.locator('summary').first().click();
  } else {
    const toggle = frame.locator('#lm-help-slot .bh-toggle');
    if (await toggle.count() && await toggle.getAttribute('aria-expanded') !== 'true') await toggle.click();
    if (!await target.isVisible() && await frame.locator('#lm-help-slot .bh-root:visible').count())
      await frame.locator('#lm-help-slot .bh-root:visible').click();
  }
  await target.waitFor({ state: 'visible' });
  return target;
}
async function createAdapter(browser, origin, root, scenario) {
  const session = makeSession(root, scenario);
  const width = scenario.width || (scenario.contentId.endsWith('/course-column-mixed') && scenario.seed === 103 ? 320 : 390);
  const context = await browser.newContext({viewport: {width, height: 950}});
  const page = await context.newPage(), pageErrors = [], nextRequests = [], mirrorEvents = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  let cursor = 0, student, closed = false;
  const url = '/trainers/oge-basics/' + session.envelope().taskSpec.contentId + '.html';
  const snapshotSource = '(' + snapshotDOM.toString() + ')(document)';

  async function drain() {
    const messages = await page.evaluate(start => robotEvents.slice(start), cursor);
    cursor += messages.length;
    for (const message of messages) {
      if (message.id !== 'student') { mirrorEvents.push(message); continue; }
      if (message.payload.kind === 'new-task') nextRequests.push(message.payload);
      else await session.accept(message.payload);
    }
    assert.deepEqual(pageErrors, [], 'Browser exceptions are transport failures');
    assert.deepEqual(mirrorEvents, [], 'Read-only mirrors must never emit semantic changes');
  }
  async function waitForChange(start, kind, id = 'student') {
    await page.waitForFunction(({start, kind, id}) => robotEvents.slice(start).some(event => event.id === id && event.payload.kind === kind), {start, kind, id}, {timeout: 10000});
    await drain();
  }
  async function hydrate(id, envelope, readOnly) {
    await page.evaluate(({id, envelope, readOnly}) => robotHydrate(id, envelope, readOnly), {id, envelope, readOnly});
    await page.waitForFunction(id => robotFrames[id]?.applied, id, {timeout: 15000});
    const applied = await page.evaluate(id => robotFrames[id].applied, id);
    assert.equal(applied.error, undefined, 'The actual wrapper must accept the saved arithmetic task');
  }
  async function open(id, envelope, readOnly) {
    await page.evaluate(({id, url}) => robotOpen(id, url), {id, url});
    await page.waitForFunction(id => robotFrames[id]?.ready, id, {timeout: 15000});
    const channel = await page.evaluate(id => robotFrames[id].channel, id);
    const frame = page.frames().find(candidate => new URL(candidate.url()).searchParams.get('channel') === channel);
    assert(frame, 'The real managed iframe is present');
    await hydrate(id, envelope, readOnly);
    return frame;
  }
  async function snapshot() { await drain(); return student.evaluate(snapshotSource); }
  async function close() {
    if (closed) return;
    closed = true;
    try { await drain(); } finally { try { await context.close(); } finally { session.close(); } }
    assert.deepEqual(pageErrors, [], 'Browser exceptions are transport failures');
    assert.deepEqual(mirrorEvents, [], 'Read-only mirrors must never emit semantic changes');
  }
  try {
    await page.goto(origin + '/__arithmetic-robots');
    student = await open('student', session.envelope(), false);
    assert.equal(await student.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true,
      'The initial exercise fits the ' + width + 'px pupil viewport');
    assert.equal(await student.evaluate(() => {
      try { localStorage.setItem('arithmetic-robot-isolation', '1'); return 'accessible'; } catch { return 'isolated'; }
    }), 'isolated', 'Managed arithmetic runs in its real opaque sandbox');
  } catch (error) { await close(); throw error; }

  return {
    snapshot,
    async type(value) {
      const start = await page.evaluate(() => robotEvents.length);
      await student.locator('#lm-answer').fill(String(value));
      await waitForChange(start, 'input');
    },
    async check() {
      const start = await page.evaluate(() => robotEvents.length);
      await student.locator('#lm-check').click();
      await waitForChange(start, 'check');
      return snapshot();
    },
    async help(kind) {
      assert(['hint', 'solution'].includes(kind), 'Only explicit help controls are available');
      const control = await revealManagedControl(student, kind === 'solution' ? 'lm-solution' : 'lm-hint');
      await drain();
      const start = await page.evaluate(() => robotEvents.length);
      await control.click();
      await waitForChange(start, 'hint');
      return snapshot();
    },
    async envelope() { await drain(); return session.envelope(); },
    async assistance() { await drain(); return session.assistance(); },
    async restore(envelope) {
      await drain();
      student = await open('student', envelope, false);
      return snapshot();
    },
    async mirror(envelope) {
      await drain();
      const start = mirrorEvents.length;
      const mirror = await open('teacher', envelope, true);
      const view = await mirror.evaluate(snapshotSource);
      if (await mirror.locator('#lm-answer').count()) assert.equal(await mirror.locator('#lm-answer').isDisabled(), true);
      await mirror.evaluate(() => {
        for (const id of ['lm-check', 'lm-hint', 'lm-solution', 'lm-new']) document.getElementById(id)?.click();
      });
      await drain();
      return {snapshot: view, events: mirrorEvents.length - start};
    },
    async next() {
      await drain();
      const previous = session.envelope(), before = nextRequests.length;
      const start = await page.evaluate(() => robotEvents.length), button = student.locator('#lm-new');
      assert.equal(await button.isVisible(), true, 'Next example is visible after completion');
      assert.equal(await button.isEnabled(), true, 'Next example can be requested');
      // HTMLElement.click honors disabled. Two immediate activations exercise
      // the actual renderer's synchronous duplicate-click latch.
      await button.evaluate(node => { node.click(); node.click(); });
      await waitForChange(start, 'new-task');
      assert.equal(nextRequests.length - before, 1, 'Two immediate activations issue one request');
      const fresh = session.next();
      await hydrate('student', fresh, false);
      await drain();
      return {previousPreserved: session.preserved(previous), requestCount: nextRequests.length - before, fresh};
    },
    close
  };
}

function option(name, fallback) {
  const inline = process.argv.find(value => value.startsWith('--' + name + '='));
  if (inline !== undefined) return inline.slice(name.length + 3);
  const index = process.argv.indexOf('--' + name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

async function main() {
  const root = path.resolve(option('root', path.join(__dirname, '..')));
  const output = path.resolve(option('output', path.join(root, 'docs/reports/learning-arithmetic-robots-chromium.json')));
  const profiles = option('profiles', '').split(',').filter(Boolean);
  const generatorOption = option('generator-version', '');
  const generatorVersion = generatorOption ? Number(generatorOption) : undefined;
  assert(generatorVersion === undefined || [1, 2].includes(generatorVersion), 'Generator version must be 1 or 2');
  const server = staticServer(root);
  let browser;
  try {
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const origin = 'http://127.0.0.1:' + server.address().port;
    browser = await chromium.launch({executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage']});
    const selected = (profiles.length ? scenarios.filter(scenario => profiles.includes(scenario.profile.id)) : scenarios)
      .map(scenario => ({...scenario, ...(generatorVersion ? {generatorVersion} : {})}));
    assert(selected.length, 'Profile selection must contain at least one known profile');
    await runSuite(scenario => createAdapter(browser, origin, root, scenario), {root, output, mode: option('mode', 'after'), runtime: 'chromium', selected});
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}

if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = {createAdapter, staticServer};

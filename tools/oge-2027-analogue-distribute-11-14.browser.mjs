import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

// External, already installed tooling only. No dependency or browser downloads.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_CORE_PATH || 'playwright-core');
const evidenceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oge2027-11-14-browser-'));
const evidence = { surfaces: [], flows: [], errors: [], externalRequests: [], cleanup: [], evidenceDir };
const files = new Map([
  [11,'oge-task11-graphs-trainer.html'],[12,'oge-task12-formulas-trainer.html'],
  [13,'oge-task13-inequalities.html'],[14,'oge-task14-progressions.html']
]);
const canonical = number => number===13 ? 'oge13-inequalities-series.html' : files.get(number);
const authorId = number => 'oge2027-analogue-1-task-' + String(number).padStart(2, '0');
const label = 'Авторский аналог ОГЭ-2027 · Вариант 1';
const disclaimer = 'Авторский материал MathExam. Не является официальным материалом ФИПИ.';
const foreign = { 'browser-test.foreign-progress': 'retain-exactly', 'mathExamOge2027Analogue1.v2': '{"foreign":true}' };
const { loadTrainerRegistry } = require(path.join(root, 'board-server/trainer-registry.js'));
progress('loading registry');
const registry = loadTrainerRegistry({ baseDir: path.join(root, 'board-server'), env: {} });
assert.equal(registry.loaded, true);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
const server = http.createServer((request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (pathname === '/api/trainer-registry') {
      response.writeHead(200, { 'Content-Type': mime['.json'] }).end(JSON.stringify(registry.publicPayload)); return;
    }
    const file = path.resolve(root, pathname.replace(/^\/+/, '') || 'index.html');
    if (!file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
    fs.readFile(file, (error, bytes) => {
      if (error) { response.writeHead(404).end(); return; }
      response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' }).end(bytes);
    });
  } catch { response.writeHead(400).end(); }
});
let origin, browser, browserServer, failure, port;
function progress(stage) { console.log(JSON.stringify({ stage, evidenceDir })); }
async function closeStage(name, close, limit = 90000) {
  const start = Date.now(); let timer;
  try {
    await Promise.race([close(), new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(name + ': cleanup timeout')), limit);
    })]);
  } finally {
    clearTimeout(timer);
    evidence.cleanup.push({ name, start: new Date(start).toISOString(), end: new Date().toISOString(), durationMs: Date.now() - start });
  }
}
function observe(page, name) {
  page.on('pageerror', error => evidence.errors.push(name + ': ' + error.message));
  page.on('console', message => { if (message.type() === 'error') evidence.errors.push(name + ': ' + message.text()); });
  page.on('requestfailed', request => evidence.errors.push(name + ': ' + request.url() + ': ' + request.failure()?.errorText));
  page.on('response', response => { if (response.status() >= 400) evidence.errors.push(name + ': HTTP ' + response.status() + ': ' + response.url()); });
}
async function makeContext(options) {
  const context = await browser.newContext(options);
  context.setDefaultTimeout(12000);
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.protocol === 'file:' || url.origin === origin) return route.continue();
    evidence.externalRequests.push(url.href); return route.abort('blockedbyclient');
  });
  await context.addInitScript(({ foreign, names }) => {
    if (!names.some(name => location.pathname.endsWith('/' + name))) return;
    if (!sessionStorage.getItem('browser-test.seeded')) {
      for (const [key, value] of Object.entries(foreign)) localStorage.setItem(key, value);
      sessionStorage.setItem('browser-test.seeded', 'yes');
      sessionStorage.setItem('browser-test.foreign-session', 'retain-exactly');
    }
    window.browserTestStorageWrites = [];
    for (const method of ['setItem', 'removeItem', 'clear']) {
      const original = Storage.prototype[method];
      Storage.prototype[method] = function (...args) {
        window.browserTestStorageWrites.push({ method, key: args[0], area: this === localStorage ? 'local' : 'session' });
        return original.apply(this, args);
      };
    }
  }, { foreign, names: [...files.values(),canonical(13)] });
  return context;
}
async function commonChecks(target, number) {
  const source=target.locator('[data-source-task-id="'+authorId(number)+'"]');
  await source.waitFor({state:'visible'});
  const text=await (number===13?target.locator('#author13Meta'):source).innerText();
  assert.ok(text.includes(label));assert.ok(text.includes(disclaimer));
  const selector=number===13?'button[data-cohort="author"]':'button[data-author-cohort="oge-2027-analogue-1"]';
  assert.equal(await target.locator(selector).count(),1);
  await noOverflow(target,number);
  const state=await target.evaluate(keys=>({values:Object.fromEntries(keys.map(key=>[key,localStorage.getItem(key)])),
    session:sessionStorage.getItem('browser-test.foreign-session'),writes:window.browserTestStorageWrites}),Object.keys(foreign));
  assert.deepEqual(state.values,foreign);assert.equal(state.session,'retain-exactly');
  assert.deepEqual(state.writes,[],'No author action writes any persistent storage');
}

// Trainer-specific flows are kept here so this committed gate is self-contained.
const variant = 'oge-2027-analogue-1';
const authorSelector = `[data-author-cohort="${variant}"]`;

async function storageSnapshot(page) {
  // The composing harness seeds its own foreign sentinel before invoking this flow.
  return page.evaluate(() => ({
    local: Object.fromEntries(Object.entries(localStorage).sort()),
    session: Object.fromEntries(Object.entries(sessionStorage).sort()),
  }));
}
async function noOverflow(page, surface) {
  const geometry = await page.evaluate(() => ({
    width: innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  assert.ok(Math.max(geometry.document, geometry.body) <= geometry.width + 1,
    `${surface}: horizontal overflow ${JSON.stringify(geometry)}`);
}
async function focusVisible(page, target, surface) {
  await target.focus();
  await target.press('Shift');
  const focus = await target.evaluate(element => {
    const style = getComputedStyle(element);
    return { active: document.activeElement === element, visible: element.matches(':focus-visible'),
      outline: style.outlineStyle, width: parseFloat(style.outlineWidth), shadow: style.boxShadow };
  });
  assert.equal(focus.active, true, `${surface}: keyboard focus stays on answer`);
  assert.equal(focus.visible, true, `${surface}: keyboard focus-visible`);
  assert.ok((focus.outline !== 'none' && focus.width >= 2) || focus.shadow !== 'none',
    `${surface}: visible focus ring`);
}
async function targets44(page, selector, surface) {
  const controls = await page.locator(selector).evaluateAll(elements => elements
    .filter(element => element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden')
    .map(element => { const r = element.getBoundingClientRect();
      return { name: element.id || element.textContent.trim() || element.getAttribute('aria-label'), width:r.width, height:r.height }; }));
  assert.ok(controls.length >= 3, `${surface}: author controls measured`);
  for (const control of controls) assert.ok(control.width >= 44 && control.height >= 44,
    `${surface}: ${control.name} is ${control.width} x ${control.height}`);
  return controls.length;
}

async function flow11(target, surface) {
  const url = target.url();
  const legacyIntro = await target.locator('#m4 .intro p').innerHTML();
  const state = () => target.evaluate(() => ({...AUTHOR_PROGRESS}));
  const enter = async () => {await target.locator('#tabs button[data-m="m4"]').click();await target.locator('#author11-cohort').click();};
  const fresh = async () => {await target.goto(url,{waitUntil:'load'});await enter();};
  const card = target.locator('#author11-card');
  const answer = async (value, keyboard=false) => {
    await target.locator('#author11-answer').fill(value);
    if(keyboard) await target.locator('#author11-answer').press('Enter');
    else await card.getByRole('button',{name:'Проверить',exact:true}).click();
  };
  const repeat = () => target.locator('#author11-repeat').click();
  const revisit = async () => {
    await target.locator('#m4-chips button[data-t="t41"]').click();
    assert.equal(await target.locator('#m4 .intro p').innerHTML(),legacyIntro,'legacy matching instructions restored exactly');
    await target.locator('#author11-cohort').click();
    assert.match(await target.locator('#m4 .intro p').innerText(),/А, Б, В.*формулами 1, 2, 3/);
    assert.doesNotMatch(await target.locator('#m4 .intro p').innerText(),/списками/);
  };
  await enter();
  const saved = await storageSnapshot(target);
  const stats = await target.evaluate(()=>JSON.stringify(STATS));
  await targets44(target,'#author11-card button,#author11-card input,#author11-cohort',surface);
  await focusVisible(target,target.locator('#author11-answer'),surface);
  await noOverflow(target,surface);
  assert.equal(await card.locator('svg').count(),3);
  const plots = await card.locator('svg').evaluateAll(elements=>elements.map(svg=>({
    label:svg.getAttribute('aria-label'),width:svg.getBoundingClientRect().width,
    viewBox:svg.getAttribute('viewBox'),lines:[...svg.querySelectorAll('polyline')].map(p=>p.getAttribute('points').trim().split(/\s+/).map(q=>q.split(',').map(Number)))
  })));
  for(const [i,plot] of plots.entries()) {
    assert.equal(plot.label,'График '+['А','Б','В'][i]);assert.ok(plot.width>=220 && plot.width<=400);
    assert.equal(plot.viewBox,'0 0 300 300');assert.equal(plot.lines.length,i===1?2:1);
    for(const line of plot.lines) {
      assert.ok(line.length>20);
      const xs=[];
      for(const [px,py] of line) {
        assert.ok(px>=0 && px<=300 && py>=0 && py<=300,'curve within viewBox');
        const x=px/300*9.6-4.8,y=4.8-py/300*9.6;xs.push(x);
        const expected=i===0?x*x+1:i===1?-1/x:-x+2;
        assert.ok(Math.abs(y-expected)<0.06,'independent plotted geometry '+i);
      }
      if(i===1)assert.ok(xs.every(x=>x<0)||xs.every(x=>x>0),'hyperbola never bridges asymptote');
    }
  }
  for(const invalid of ['23','2 3 1','2,3,1','1231','231.0']){await answer(invalid);assert.equal((await state()).solved,false);}
  await answer('123');assert.equal((await state()).wrongAttempts,1);
  await answer('231',true);assert.equal((await state()).credited,true);
  const earned=await state();await answer('231');assert.deepEqual(await state(),earned);
  await repeat();assert.equal(await target.locator('#author11-answer').inputValue(),'');assert.deepEqual(await state(),earned);
  await revisit();await answer('231');assert.deepEqual(await state(),earned);
  assert.equal(await target.evaluate(()=>JSON.stringify(STATS)),stats);
  for(const help of ['hint','reveal']) {
    await fresh();await target.locator('#author11-'+help).click();
    assert.equal((await state()).assisted,true);assert.equal((await state()).credited,false);
    if(help==='reveal')assert.match(await target.locator('#author11-help').innerText(),/231/);
    await repeat();assert.equal(await target.locator('#author11-help').innerText(),'');
    await revisit();await answer('231');await answer('231',true);
    assert.equal((await state()).assisted,true);assert.equal((await state()).credited,false);
    assert.equal((await state()).revealed,help==='reveal');
    assert.match(await target.locator('#author11-status').innerText(),/Самостоятельно: 0 из 1/);
    await noOverflow(target,surface);
  }
  assert.deepEqual(await storageSnapshot(target),saved);
  return {task:11,surface,graphs:3,legacyGenerators:5,authorTasks:1,geometry:'PASS',credit:'PASS',assistance:'PASS',repeat:'PASS'};
}


async function flow12(target, surface) {
  const sourceId='oge2027-analogue-1-task-12';
  const originalUrl=target.url();
  const progress=()=>target.evaluate(()=>JSON.parse(JSON.stringify(AUTHOR_PROGRESS)));
  const stored=()=>target.evaluate(()=>JSON.stringify(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)])));
  const legacy=()=>target.evaluate(()=>JSON.stringify({mode,typeFilter,cur,A,diag,stats}));
  const enter=async()=>{
    if(!await target.evaluate(()=>authorActive))await target.locator('#authorCohort').click();
    await target.locator('[data-source-task-id="'+sourceId+'"]').waitFor({state:'visible'});
  };
  const fresh=async()=>{
    await target.goto(originalUrl);
    await enter();
    assert.deepEqual(await progress(),{hinted:false,revealed:false,credit:'unanswered',wrongAttempts:0});
  };
  await fresh();
  const storageBefore=await stored();
  const legacyBefore=await legacy();
  assert.equal(await target.locator('.author-source').textContent(),'Авторский аналог ОГЭ-2027 · Вариант 1');
  assert.ok((await target.locator('.author-card').textContent()).includes('Авторский материал MathExam. Не является официальным материалом ФИПИ.'));
  assert.equal(await target.locator('#sol').isVisible(),false);
  const controls=await target.locator('.author-card button,.author-card input,.author-cohorts button').evaluateAll(nodes=>nodes.filter(n=>n.getClientRects().length).map(n=>({id:n.id,width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height})));
  for(const control of controls){assert.ok(control.width>=44,JSON.stringify({surface,...control}));assert.ok(control.height>=44,JSON.stringify({surface,...control}));}
  assert.equal(await target.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1),false,'no page overflow '+surface);
  await target.locator('#ansIn').fill('5 0');
  await target.locator('#checkBtn').click();
  assert.equal((await progress()).credit,'unanswered');
  await target.locator('#ansIn').fill('0.02');
  await target.locator('#checkBtn').click();
  assert.equal((await progress()).hinted,false);
  assert.doesNotMatch(await target.locator('#fb').textContent(), /числитель|знаменатель|возведи|раздели/);
  await target.locator('#ansIn').fill('50,0');
  await target.locator('#ansIn').press('Tab');
  assert.equal(await target.evaluate(()=>document.activeElement.id),'checkBtn');
  assert.ok(await target.locator('#checkBtn').evaluate(node=>parseFloat(getComputedStyle(node).outlineWidth)>=2),'keyboard focus visible');
  await target.locator('#checkBtn').press('Enter');
  assert.equal((await progress()).credit,'independent');
  const earned=await progress();
  await target.locator('#checkBtn').click();
  assert.deepEqual(await progress(),earned,'repeated check has no extra credit');
  await target.locator('#nextBtn').click();
  assert.equal(await target.locator('#ansIn').inputValue(),'');
  assert.equal(await target.locator('#sol').isVisible(),false);
  assert.deepEqual(await progress(),earned,'repeat preserves earned credit');
  await target.locator('#legacyCohort').click();
  assert.equal(await legacy(),legacyBefore,'legacy state unchanged');
  await target.locator('#ansIn').fill('321');
  const legacyWithInput=await legacy();
  await target.locator('#authorCohort').click();
  assert.deepEqual(await progress(),earned,'filter restores author credit');
  await target.locator('#legacyCohort').click();
  assert.equal(await target.locator('#ansIn').inputValue(),'321','legacy input DOM restored');
  assert.equal(await legacy(),legacyWithInput);
  await target.locator('#authorCohort').click();
  await target.locator('#hintBtn').click();
  await target.locator('#solBtn').click();
  assert.equal((await progress()).credit,'independent','later help preserves historical independent credit');
  assert.equal((await progress()).hinted,true);
  assert.equal((await progress()).revealed,true);
  assert.equal(await stored(),storageBefore,'no legacy or foreign storage mutation');

  await fresh();
  await target.locator('#hintBtn').click();
  assert.equal(await target.locator('#sol').isVisible(),false,'hint precedes full solution');
  assert.equal((await progress()).hinted,true);
  await target.locator('#ansIn').fill('0,02');
  await target.locator('#checkBtn').click();
  assert.match(await target.locator('#fb').textContent(),/числитель.*знаменатель/);
  await target.locator('#nextBtn').click();
  await target.locator('#legacyCohort').click();
  await target.locator('#authorCohort').click();
  assert.equal((await progress()).hinted,true,'hint survives repeat and filter');
  await target.locator('#ansIn').fill('50');
  await target.locator('#checkBtn').click();
  assert.equal((await progress()).credit,'assisted');
  const assisted=await progress();
  await target.locator('#checkBtn').click();
  assert.deepEqual(await progress(),assisted);
  assert.match(await target.locator('#authorResult').textContent(),/Самостоятельно: 0 из 1/);
  assert.equal(await stored(),storageBefore);

  await fresh();
  await target.locator('#solBtn').click();
  assert.equal(await target.locator('#sol').isVisible(),true);
  assert.match(await target.locator('#sol').textContent(),/110².*242.*12100.*50/);
  await target.locator('#nextBtn').focus();
  await target.locator('#nextBtn').press('Enter');
  assert.equal(await target.locator('#ansIn').inputValue(),'');
  assert.equal(await target.locator('#sol').isVisible(),false);
  await target.locator('#legacyCohort').click();
  await target.locator('#authorCohort').click();
  assert.equal((await progress()).revealed,true,'reveal survives repeat and filter');
  await target.locator('#ansIn').fill('50.0');
  await target.locator('#ansIn').press('Enter');
  assert.equal((await progress()).credit,'shown');
  const shown=await progress();
  await target.locator('#checkBtn').click();
  assert.deepEqual(await progress(),shown);
  assert.match(await target.locator('#authorResult').textContent(),/Самостоятельно: 0 из 1/);
  assert.equal(await stored(),storageBefore);

  const routeVectors=['?task=unknown','?task='+sourceId+'&task='+sourceId,'?task=%GG','?task='+sourceId+'&junk=%'];
  for(const search of routeVectors){
    const url=new URL(originalUrl);url.search=search;
    await target.goto(url.href);
    assert.equal(await target.evaluate(()=>authorActive),false,search);
    assert.deepEqual(await target.evaluate(()=>({mode,typeFilter})),{mode:'quick',typeFilter:0});
  }
  await fresh();
  assert.equal(await stored(),storageBefore);
  return {task:12,surface,independent:true,hint:true,reveal:true,repeat:true,filter:true,legacyDom:true,storage:true,keyboard:true,touchTargets:controls.length,malformedRoutes:routeVectors.length,reloadFresh:true};
}

const ID = 'oge2027-analogue-1-task-13';
const LABEL = 'Авторский аналог ОГЭ-2027 · Вариант 1';
async function storage13(target) {
  return target.evaluate(() => {
    try { return JSON.stringify(Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)])); }
    catch { return null; }
  });
}
async function flow13(target, surface) {
  await target.locator('button[data-cohort=author]').waitFor({ state: 'visible' });
  await target.locator('button[data-cohort=author]').click();
  await target.locator('#author13Answer').waitFor({ state: 'visible' });
  const authorLink = new URL(await target.evaluate(() => location.href));
  authorLink.searchParams.delete('task'); authorLink.searchParams.set('task', ID);
  const authorUrl = authorLink.href;
  const storageBefore = await storage13(target);
  const status = () => target.locator('#author13Status').evaluate(el => ({ ...el.dataset }));
  const click = selector => target.locator(selector).click();
  const fresh = async () => { await target.goto(authorUrl); await target.locator('#author13Answer').waitFor({ state: 'visible' }); };
  const check = async answer => { await target.locator('#author13Answer').fill(answer); await click('#author13Check'); };
  assert.equal(await target.locator('#author13Meta h2').innerText(), LABEL);
  assert.equal(await target.locator('#author13Disclaimer').innerText(), 'Авторский материал MathExam. Не является официальным материалом ФИПИ.');
  assert.equal(await target.locator('#modulePanel').getAttribute('data-source-task-id'), ID);
  assert.match(await target.locator('#taskText').innerText(), /2x − 6 ≤ 0[\s\S]*x \+ 3 > 0/);
  assert.match(await target.locator('#taskNote').innerText(), /номер/);
  const geometry = await target.evaluate(() => {
    const svg = document.getElementById('board'), box = svg.viewBox.baseVal;
    const outside = [...svg.querySelectorAll('*')].filter(el => {
      if (typeof el.getBBox !== 'function') return false;
      const b = el.getBBox(); return b.x < box.x - 0.5 || b.y < box.y - 0.5 || b.x + b.width > box.x + box.width + 0.5 || b.y + b.height > box.y + box.height + 0.5;
    }).map(el => el.tagName);
    const boundaries = [...svg.querySelectorAll('[data-author13-option="3"] circle')].map(el => ({ side: el.dataset.boundary, closed: el.dataset.closed, fill: el.getAttribute('fill'), x: +el.getAttribute('cx') }));
    const tooSmall = [...document.querySelectorAll('button,input')].filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden').filter(el => el.getBoundingClientRect().height < 43.9).map(el => el.id || el.textContent);
    return { outside, boundaries, tooSmall, overflow: document.documentElement.scrollWidth - innerWidth, optionCount: svg.querySelectorAll('[data-author13-option]').length };
  });
  assert.deepEqual(geometry.outside, [], surface + ': SVG bounds');
  assert.deepEqual(geometry.tooSmall, [], surface + ': touch controls');
  assert.ok(geometry.overflow <= 1, surface + ': no horizontal overflow');
  assert.equal(geometry.optionCount, 4);
  assert.deepEqual(geometry.boundaries.map(({ side, closed, fill }) => ({ side, closed, fill })), [{ side: 'left', closed: 'false', fill: '#fff' }, { side: 'right', closed: 'true', fill: '#111827' }]);
  assert.ok(geometry.boundaries[0].x < geometry.boundaries[1].x);
  for (const invalid of ['(−3; 3]', '1']) {
    await target.locator('#author13Answer').fill(invalid);
    await target.locator('#author13Answer').press('Enter');
    assert.equal(await target.evaluate(() => document.activeElement.id), 'author13Answer', 'Enter preserves editable focus after malformed or wrong answer');
    assert.equal((await status()).hinted, 'false');
  }
  await check('(−3; 3]');
  assert.match(await target.locator('#msg').innerText(), /только номер/);
  assert.equal((await status()).independent, '0');
  await click('#author13-choice-4'); await click('#author13Check');
  assert.match(await target.locator('#msg').innerText(), /Пока неверно/);
  assert.equal(await target.locator('#author13Solution').isVisible(), false);
  await click('#author13-choice-3');
  assert.equal(await target.locator('#author13Answer').inputValue(), '3');
  await target.locator('#author13Answer').press('Enter');
  assert.equal((await status()).independent, '1');
  let earned = await status(); await click('#author13Check'); assert.deepEqual(await status(), earned);
  await click('#author13Hint');
  assert.equal((await status()).independent, '1'); assert.equal((await status()).hinted, 'true');
  earned = await status(); await click('#author13Repeat');
  assert.equal(await target.locator('#author13Answer').inputValue(), '');
  assert.equal(await target.locator('#hintBox').isVisible(), false);
  assert.deepEqual(await status(), earned);
  await check('3'); assert.deepEqual(await status(), earned);
  await click('button[data-cohort="quad"]'); await click('button[data-cohort="author"]'); assert.deepEqual(await status(), earned);
  await fresh();
  assert.equal((await status()).credit, 'none');
  await click('#author13Hint');
  assert.equal(await target.locator('#hintBox').isVisible(), true);
  assert.doesNotMatch(await target.locator('#hintBox').innerText(), /вариант 3|x ≤ 3|x > −3|\(−3; 3\]/);
  await check('3'); assert.equal((await status()).independent, '0'); assert.equal((await status()).assisted, '1');
  earned = await status(); await click('#author13Repeat'); await check('3'); assert.deepEqual(await status(), earned);
  await click('button[data-cohort="systems"]'); await click('button[data-cohort="author"]'); assert.deepEqual(await status(), earned);
  await fresh(); await click('#author13Reveal');
  assert.equal(await target.locator('#author13Solution').isVisible(), true);
  assert.match(await target.locator('#author13Solution').innerText(), /x ≤ 3[\s\S]*x > −3[\s\S]*\(−3; 3\]/);
  await check('3');
  assert.equal((await status()).independent, '0'); assert.equal((await status()).assisted, '0'); assert.equal((await status()).revealed, 'true');
  earned = await status(); await click('#author13Check'); assert.deepEqual(await status(), earned);
  await click('#author13Repeat'); assert.equal(await target.locator('#author13Answer').inputValue(), '');
  assert.equal(await target.locator('#author13Solution').isVisible(), false); assert.deepEqual(await status(), earned);
  await check('3'); await click('button[data-cohort="linear"]'); await click('button[data-cohort="author"]'); assert.deepEqual(await status(), earned);
  for (const query of ['?task=' + ID + '&task=' + ID, '?task=' + ID + '&bad=%GG']) {
    const badUrl = new URL(authorUrl); badUrl.search = query;
    await target.goto(badUrl.href); await target.locator('button[data-cohort="quad"]').waitFor({ state: 'visible' });
    assert.equal(await target.locator('#author13Meta').isVisible(), false, surface + ': malformed/duplicate fail closed');
    assert.equal(await target.evaluate(() => mod), 'quad');
  }
  await fresh();
  assert.equal(await storage13(target), storageBefore, surface + ': legacy localStorage unchanged');
  return { task: 13, surface, independent: true, hinted: true, revealed: true, repeat: true, filter: true, answerType: 'choice-number', geometry };
}


async function flow14(target, surface = 'task14') {
  const id = 'oge2027-analogue-1-task-14';
  const cohort = target.locator('[data-author-cohort="oge-2027-analogue-1"]');
  const card = target.locator('[data-source-task-id="' + id + '"]');
  const progress = () => target.evaluate(() => ({...T14.AUTHOR_PROGRESS}));
  const storage = () => target.evaluate(() => ({local:Object.fromEntries(Object.entries(localStorage).sort()),session:Object.fromEntries(Object.entries(sessionStorage).sort())}));
  const answer = async (value, keyboard = false) => {
    await card.locator('#author14-answer').fill(value);
    if (keyboard) await card.locator('#author14-answer').press('Enter');
    else await card.locator('[data-author-check]').click();
  };
  const repeat = () => card.locator('[data-author-repeat]').click();
  const geometry = async () => {
    const size = await target.evaluate(() => ({width:document.documentElement.clientWidth,document:document.documentElement.scrollWidth,body:document.body.scrollWidth}));
    assert.ok(Math.max(size.document,size.body)<=size.width+1, surface+': no overflow '+JSON.stringify(size));
    const controls = await target.locator('.author14-task button,.author14-task input,.author14-cohort').evaluateAll(elements => elements.filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect();return {label:e.textContent||e.id,width:r.width,height:r.height};}));
    assert.ok(controls.length>=7);
    for(const c of controls) assert.ok(c.width>=44&&c.height>=44,surface+': touch target '+JSON.stringify(c));
  };
  const freshUrl = new URL(target.url());
  freshUrl.search = '?task=' + id;
  const fresh = async () => {
    await target.goto(freshUrl.href,{waitUntil:'load'});
    await card.waitFor({state:'visible'});
    assert.deepEqual(await progress(),{assisted:false,revealed:false,credited:false,solved:false});
  };
  const switchBack = async () => {
    const before = await progress();
    await target.locator('#m-filters [data-all]').click();
    assert.equal(await target.locator('#m-intro').textContent(),legacyIntro14,'legacy marathon instructions restored exactly');
    assert.equal(await card.count(),0);
    assert.equal(await target.evaluate(()=>__M.author),false);
    await cohort.click();
    assert.deepEqual(await progress(),before,surface+': cohort switch preserves author history');
  };
  const assertCleared = async () => {
    assert.equal(await card.locator('#author14-answer').inputValue(),'');
    assert.equal(await card.locator('[data-author-feedback]').textContent(),'');
    assert.equal(await card.locator('[data-author-work]').textContent(),'');
  };

  assert.equal(await target.locator('.page.active').getAttribute('id'),'page-ref');
  assert.equal(await target.evaluate(()=>Object.keys(T14.GENS).length),9);
  await target.locator('[data-page="marathon"]').click();
  const legacyIntro14 = await target.locator('#m-intro').textContent();
  assert.match(legacyIntro14,/После первой ошибки — одна подсказка/);
  assert.equal(await target.evaluate(()=>__M.author),false);
  const previousTotal = await target.evaluate(()=>JSON.parse(localStorage.getItem('oge14_progress_v1')||'{}').totalOk||0);
  const legacyAnswer = await target.evaluate(()=>T14.fmtN(__M.task.ans).replace(/[\u202f\u00a0]/g,''));
  await target.locator('#m-dec').fill(legacyAnswer);
  await target.locator('#m-ck').click();
  assert.equal(await target.evaluate(()=>JSON.parse(localStorage.getItem('oge14_progress_v1')).totalOk),previousTotal+1);
  const baseline = await storage();
  const streak = await target.evaluate(()=>__M.streak);
  await cohort.click();
  assert.match(await target.locator('#m-intro').textContent(),/После ошибки можно исправить ответ или открыть подсказку/);
  assert.doesNotMatch(await target.locator('#m-intro').textContent(),/После первой ошибки — одна подсказка/);
  assert.equal(await cohort.count(),1);
  assert.equal(await card.count(),1);
  assert.equal(await card.locator('.author-label').innerText(),'Авторский аналог ОГЭ-2027 · Вариант 1');
  assert.equal(await card.locator('.author-note').first().innerText(),'Авторский материал MathExam. Не является официальным материалом ФИПИ.');
  assert.match(await card.locator('.task-text').innerText(),/6 минут.*320 мг.*18 минут/);
  assert.equal(await card.locator('[data-author-repeat-note]').innerText(),'Поля очищаются, но результат и история помощи сохраняются до обновления страницы.');
  await geometry();
  const input = card.locator('#author14-answer');
  await input.focus();await input.press('Shift');
  const focus = await input.evaluate(e=>({active:document.activeElement===e,visible:e.matches(':focus-visible'),outline:getComputedStyle(e).outlineStyle,width:parseFloat(getComputedStyle(e).outlineWidth)}));
  assert.equal(focus.active,true);assert.equal(focus.visible,true);assert.notEqual(focus.outline,'none');assert.ok(focus.width>=2);
  await answer('80');
  assert.match(await card.locator('[data-author-feedback]').innerText(),/Пока неверно/);
  assert.equal((await progress()).credited,false);
  await answer('40',true);
  assert.deepEqual(await progress(),{assisted:false,revealed:false,credited:true,solved:true});
  const independent = await progress();
  await answer('40,0');await answer('40.00',true);
  assert.deepEqual(await progress(),independent);
  await repeat();await assertCleared();
  assert.deepEqual(await progress(),independent);
  await answer('40');await switchBack();
  assert.deepEqual(await progress(),independent);
  assert.match(await target.locator('#m-stats').innerText(),/Самостоятельно: 1\/1/);
  await card.locator('[data-author-hint]').click();
  assert.equal((await progress()).credited,true,'earned independent result survives later help');
  const creditedWithHelp = await progress();
  await repeat();await answer('40');
  assert.deepEqual(await progress(),creditedWithHelp);
  assert.equal(await target.evaluate(()=>__M.streak),streak);
  assert.deepEqual(await storage(),baseline,'author actions do not write legacy or foreign storage');

  await fresh();
  await card.locator('[data-author-hint]').click();
  const hint = await card.locator('[data-author-feedback]').innerText();
  assert.match(hint,/число полных периодов/);assert.doesNotMatch(hint,/40/);
  await answer('40');
  assert.deepEqual(await progress(),{assisted:true,revealed:false,credited:false,solved:true});
  const assisted = await progress();
  await repeat();await assertCleared();await switchBack();await answer('40',true);
  assert.deepEqual(await progress(),assisted);
  assert.match(await target.locator('#m-stats').innerText(),/Самостоятельно: 0\/1/);
  await geometry();assert.deepEqual(await storage(),baseline);

  await fresh();
  await card.locator('[data-author-reveal]').click();
  assert.equal(await card.locator('#author14-answer').inputValue(),'40');
  assert.equal((await progress()).revealed,true);
  const solution = await card.locator('[data-author-work]').innerText();
  for(const number of ['320','160','80','40']) assert.ok(solution.includes(number));
  await geometry();await repeat();await assertCleared();await switchBack();await answer('40');
  assert.deepEqual(await progress(),{assisted:true,revealed:true,credited:false,solved:true});
  assert.deepEqual(await storage(),baseline);

  await fresh();
  await card.locator('[data-author-steps]').click();
  let active = card.locator('.step.active');
  assert.equal(await active.count(),1);
  await active.locator('[data-step-hint]').click();
  assert.match(await active.locator('.fb').innerText(),/18.*6/);
  await active.locator('[data-step-show]').click();
  assert.equal(await card.locator('.step.done.peeked').count(),1);
  await card.locator('.step.active input').fill('8');
  await card.locator('.step.active input').press('Enter');
  await card.locator('.step.active input').fill('40');
  await card.locator('.step.active [data-step-check]').click();
  assert.equal(await card.locator('.step.done').count(),3);
  assert.equal(await card.locator('.step.active').count(),0);
  await geometry();await answer('40');
  assert.deepEqual(await progress(),{assisted:true,revealed:true,credited:false,solved:true});
  const shownStep = await progress();
  await repeat();await switchBack();await answer('40',true);
  assert.deepEqual(await progress(),shownStep);
  assert.deepEqual(await storage(),baseline);
  await fresh();
  assert.deepEqual(await storage(),baseline,'reload keeps stored legacy progress');
  return {task:14,surface,legacyGenerators:9,fixedAuthor:1,answer:40,formulaSteps:[3,8,40],credit:'once',assistance:'sticky',storage:'preserved'};
}

async function defaults(target,number){
 return target.evaluate(n=>{
  if(n===11)return{mode:document.querySelector('section.module.active').id,matchType:M4.type};
  if(n===12)return{mode,typeFilter,gens:GENS.length};
  if(n===13)return{mode:mod,index:idx[mod],legacyCount:Object.entries(DATA).filter(([k])=>k!=='author').reduce((n,[,v])=>n+v.length,0)};
  return{mode:document.querySelector('.page.active').id,author:__M.author,filters:__M.filters.size};
 },number);
}
const expectedDefaults={11:{mode:'m1',matchType:'rand'},12:{mode:'quick',typeFilter:0,gens:40},
 13:{mode:'quad',index:0,legacyCount:26},14:{mode:'page-ref',author:false,filters:0}};
async function runSurface(number,surface,options){
 const name=number+':'+surface;progress(name+' start');
 const context=await makeContext(options);let page;
 try{
  page=await context.newPage();observe(page,name);
  const relative='/trainers/'+files.get(number),actual='/trainers/'+canonical(number);
  const url=surface==='file-offline'?pathToFileURL(path.join(root,relative.slice(1))).href:origin+relative;
  let target=page;
  if(surface==='board-iframe'){
   await page.goto(origin+'/trainers/trainer-board.html?server='+encodeURIComponent(origin),{waitUntil:'load'});
   await page.locator('#trainerUrl').fill(relative);await page.locator('#openTrainer').click();
   target=await(await page.locator('#trainerFrame').elementHandle()).contentFrame();
   await target.waitForURL(value=>value.pathname===actual,{waitUntil:'load'});
   await page.waitForFunction(expected=>{const saved=JSON.parse(localStorage.getItem('mathexam.trainerBoard.v1')||'{}');
     return saved.trainerUrl===expected&&document.getElementById('trainerUrl').value===expected;},relative);
  }else{
   const response=await page.goto(url,{waitUntil:'load'});
   if(surface!=='file-offline')assert.equal(response.status(),200);
   if(number===13)await page.waitForURL(value=>value.pathname.endsWith('/'+canonical(number)),{waitUntil:'load'});
  }
  assert.deepEqual(await defaults(target,number),expectedDefaults[number],name+': legacy defaults');
  evidence.flows.push(await({11:flow11,12:flow12,13:flow13,14:flow14})[number](target,surface));
  const savedStorage=await storageSnapshot(target);
  const navigate=async query=>{await target.goto(url+query,{waitUntil:'load'});
   if(number===13)await target.waitForURL(value=>value.pathname.endsWith('/'+canonical(number)),{waitUntil:'load'});};
  await navigate('?task='+authorId(number));await commonChecks(target,number);
  await target.goto(target.url(),{waitUntil:'load'});await commonChecks(target,number);
  const fresh=await target.evaluate(n=>{
   if(n===11)return !AUTHOR_PROGRESS.assisted&&!AUTHOR_PROGRESS.revealed&&!AUTHOR_PROGRESS.credited&&!AUTHOR_PROGRESS.solved;
   if(n===12)return !AUTHOR_PROGRESS.hinted&&!AUTHOR_PROGRESS.revealed&&AUTHOR_PROGRESS.credit==='unanswered';
   if(n===13)return !author13Result.hinted&&!author13Result.revealed&&author13Result.credit===null;
   return !T14.AUTHOR_PROGRESS.assisted&&!T14.AUTHOR_PROGRESS.revealed&&!T14.AUTHOR_PROGRESS.credited&&!T14.AUTHOR_PROGRESS.solved;
  },number);
  assert.equal(fresh,true,name+': reload starts only the author session afresh');
  assert.deepEqual(await storageSnapshot(target),savedStorage,name+': persistent progress preserved');
  if(['desktop','mobile360','board-iframe'].includes(surface))await page.screenshot({path:path.join(evidenceDir,name.replace(':','-')+'.png'),fullPage:true,timeout:60000});
  const invalid=['','?task=unknown','?task='+authorId(number)+'-extra','?task='+authorId(number)+'&task='+authorId(number),
   '?task=unknown&task='+authorId(number),'?task='+authorId(number)+'&bad=%ZZ','?task='+authorId(number)+'&%74ask='+authorId(number),
   '?task=%C0%AF','?task='+authorId(number)+'&bad=%EF','?task=oge2027-analogue-1-task-99'];
  for(const query of invalid){await navigate(query);assert.equal(await target.locator('[data-source-task-id]:visible').count(),0,name+': invalid '+query);
   assert.deepEqual(await defaults(target,number),expectedDefaults[number],name+': default on invalid query');}
  if(surface==='board-iframe'){
   const boardLink=relative+'?task='+authorId(number);
   await page.locator('#trainerUrl').fill(boardLink);await page.locator('#openTrainer').click();
   await target.waitForURL(value=>value.pathname+value.search===actual+'?task='+authorId(number),{waitUntil:'load'});
   await page.waitForFunction(expected=>{const saved=JSON.parse(localStorage.getItem('mathexam.trainerBoard.v1')||'{}');
    return saved.trainerUrl===expected&&document.getElementById('trainerUrl').value===expected;},boardLink);
   await commonChecks(target,number);
  }
  evidence.surfaces.push({number,surface,status:'PASS',directLink:true,invalidQueries:invalid.length,boardUiDeepLink:surface==='board-iframe'});
  progress(name+' PASS');
 }catch(error){if(page)await page.screenshot({path:path.join(evidenceDir,'failure-'+name.replace(':','-')+'.png'),fullPage:true,timeout:60000}).catch(()=>{});throw error;}
 finally{if(page)await closeStage(name+' page',()=>page.close());await closeStage(name+' context',()=>context.close());}
}
try {
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  port = server.address().port; origin = 'http://127.0.0.1:' + port;
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || process.env.BROWSER_EXECUTABLE_PATH;
  progress('launch browser');
  browserServer = await chromium.launchServer({ headless: true, ...(executablePath ? { executablePath } : { channel: 'msedge' }),
    // Software rendering avoids stalled animation frames in Windows headless Edge.
    // Normal actionability checks and all UI/storage assertions remain enabled.
    args: ['--disable-gpu', '--disable-background-mode', '--disable-extensions', '--no-first-run', '--disable-background-networking'] });
  evidence.browserPid = browserServer.process().pid;
  progress('connect browser');
  browser = await chromium.connect(browserServer.wsEndpoint());
  progress('browser connected');
  for (const number of files.keys()) {
    for (const [surface, width, height, mobile] of [['desktop', 1280, 900, false], ['mobile390', 390, 844, true],
      ['mobile360', 360, 844, true], ['board-iframe', 1280, 900, false], ['file-offline', 360, 844, true]]) {
      await runSurface(number, surface, { viewport: { width, height }, isMobile: mobile, hasTouch: mobile, offline: surface === 'file-offline' });
    }
  }
  assert.equal(evidence.surfaces.length, 20);
  assert.equal(evidence.flows.length,20,'four complete help/repeat/credit flows on five surfaces');
  assert.deepEqual(evidence.errors, []); assert.deepEqual(evidence.externalRequests, []);
} catch (error) { failure = error; }
finally {
  try {
    if (browserServer) {
      await closeStage('owned browser process', () => browserServer.close());
      evidence.browserExitCode = browserServer.process().exitCode;
      evidence.browserSignal = browserServer.process().signalCode;
      assert.equal(evidence.browserExitCode, 0); assert.equal(evidence.browserSignal, null);
      assert.throws(() => process.kill(evidence.browserPid, 0), /ESRCH/);
    }
    if (browser) await closeStage('browser connection', () => browser.close());
  } catch (error) { failure = failure ? new AggregateError([failure, error]) : error; }
  try {
    server.closeAllConnections();
    await closeStage('HTTP server', () => new Promise(resolve => server.close(resolve)));
    if (port) {
      const listening = await new Promise(resolve => {
        const socket = net.connect({ host: '127.0.0.1', port });
        socket.once('connect', () => { socket.destroy(); resolve(true); });
        socket.once('error', () => resolve(false));
      });
      assert.equal(listening, false); evidence.remainingPorts = 0;
    }
  } catch (error) { failure = failure ? new AggregateError([failure, error]) : error; }
}
evidence.status = failure ? 'FAIL' : 'PASS';
if (failure) evidence.failure = failure.stack + (failure.errors ? '\n' + failure.errors.map(error => error.stack).join('\n') : '');
fs.writeFileSync(path.join(evidenceDir, 'browser-results.json'), JSON.stringify(evidence, null, 2));
if (failure) throw failure;
console.log(JSON.stringify(evidence));
console.log('OGE_2027_ANALOGUE_11_14_BROWSER_OK');

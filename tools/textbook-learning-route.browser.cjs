'use strict';
// Synthetic learners in real Chromium; no accounts, server data or production writes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const SHOTS = process.env.TEXTBOOK_ROUTE_SCREENSHOTS || path.join(ROOT, 'artifacts/textbook-learning-route');
const courses = [
  { slug: 'peterson6', api: 'PetersonApp', data: 'PetersonCourse', key: 'mathexam.peterson6.part1.v1', topics: 14, chapters: 2 },
  { slug: 'makarychev8', api: 'MakarychevApp', data: 'MakarychevCourse', key: 'mathexam.makarychev8.2024.v1', topics: 51, chapters: 6 }
];
const server = http.createServer((req, res) => {
  try {
    const name = decodeURIComponent(new URL(req.url, 'http://local').pathname);
    if (name === '/favicon.ico') { res.writeHead(204).end(); return; }
    let file = path.resolve(ROOT, '.' + name);
    if (!file.startsWith(ROOT + path.sep)) { res.writeHead(403).end(); return; }
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
    res.setHeader('Content-Type', (mime[path.extname(file)] || 'application/octet-stream') + '; charset=utf-8');
    res.end(fs.readFileSync(file));
  } catch (_) { res.writeHead(404).end(); }
});
let browser;
const errors = [], results = [];
async function loaded(page, course) { await page.waitForFunction(api => !!window[api], course.api); }
async function nav(page, course, hash) {
  await page.evaluate(({api,hash}) => { history.replaceState(null, '', hash); window[api].route(); }, {api:course.api,hash});
}
async function state(page, course) { return page.evaluate(api => window[api].getState(), course.api); }
async function saved(page, key) { return page.evaluate(key => localStorage.getItem(key), key); }
async function noOverflow(page, label) {
  const sizes = await page.evaluate(() => ({width:innerWidth,scroll:document.documentElement.scrollWidth}));
  assert(sizes.scroll <= sizes.width + 1, label + ': horizontal overflow ' + JSON.stringify(sizes));
}
async function solve(page, course, index, helped) {
  await nav(page, course, '#lesson/p01/' + index);
  const task = await page.evaluate(({data,index}) => window[data].lessons[0].tasks[index], {data:course.data,index});
  if (helped) await page.locator('[data-action=hint]').click();
  if (task.kind === 'choice') await page.locator('[data-choice="' + task.choices.indexOf(task.answer) + '"]').click();
  else await page.locator('#final-answer').fill(String(task.answer));
  await page.locator('#answer-form button[type=submit]').click();
  const record = (await state(page, course)).tasks[task.id];
  assert.equal(record.correct, true, task.id + ': completed');
  assert.equal(record.independent, !helped, task.id + ': assistance attribution');
  return task.id;
}
async function readCounts(page) {
  return page.locator('.lr-counts strong').evaluateAll(nodes => nodes.map(node => Number(node.textContent)));
}
async function routeHelp(page, course, width, scenario) {
  if (course.slug !== 'peterson6') return;
  const before = await saved(page, course.key), theory = await saved(page, course.key + '.route.v1');
  const host = page.locator('.peterson-help'), launcher = page.locator('.peterson-help-launcher');
  const original = await host.elementHandle();
  async function placement() {
    const result = await host.evaluate(node => {
      const box = node.getBoundingClientRect(), previous = node.previousElementSibling?.getBoundingClientRect();
      const heading = document.querySelector('.lr-map-heading').getBoundingClientRect();
      return {position:getComputedStyle(node).position,body:node.parentNode===document.body,
        beforeHeading:box.bottom<=heading.top,afterGuide:!!previous&&previous.bottom<=box.top};
    });
    if (width <= 480) {
      assert.equal(result.position, 'static', scenario + ': narrow map helper has its own flow space');
      assert.equal(result.body, false);
      assert(result.beforeHeading && result.afterGuide, scenario + ': helper does not overlap preceding guide or following chapter heading');
    } else {
      assert.equal(result.position, 'fixed', 'desktop helper remains floating');
      assert.equal(result.body, true);
    }
  }
  await placement();
  await launcher.click();
  assert.equal(await launcher.getAttribute('aria-expanded'), 'true');
  assert(await page.locator('.peterson-help-close').evaluate(node=>node===document.activeElement));
  await nav(page, course, '#home'); // Replacing the map must not detach or duplicate the focused helper.
  assert(await original.evaluate(node=>node===document.querySelector('.peterson-help')));
  assert.equal(await host.count(), 1);
  assert(await page.locator('.peterson-help-close').evaluate(node=>node===document.activeElement));
  assert(await page.locator('.peterson-help-panel').isVisible());
  await placement();
  if (width <= 480) {
    await page.screenshot({path:path.join(SHOTS, course.slug+'-'+scenario+'-help-'+width+'.png'),fullPage:true});
    await page.setViewportSize({width:1280,height:900});
    await page.waitForFunction(()=>document.querySelector('.peterson-help').parentNode===document.body);
    assert(await page.locator('.peterson-help-close').evaluate(node=>node===document.activeElement));
    await page.setViewportSize({width,height:900});
    await page.waitForFunction(()=>document.querySelector('.peterson-help').classList.contains('peterson-help-inline'));
    assert(await page.locator('.peterson-help-close').evaluate(node=>node===document.activeElement));
    await placement();
  }
  await page.keyboard.press('Escape');
  assert(await page.locator('.peterson-help-panel').isHidden());
  assert(await launcher.evaluate(node=>node===document.activeElement));
  await launcher.click();await page.locator('.peterson-help-close').click();
  assert(await page.locator('.peterson-help-panel').isHidden());
  assert.equal(await launcher.getAttribute('aria-expanded'), 'false');
  assert(await launcher.evaluate(node=>node===document.activeElement));
  assert.equal(await saved(page, course.key), before, 'map help does not rewrite task progress');
  assert.equal(await saved(page, course.key + '.route.v1'), theory, 'map help does not rewrite theory marks');
  await page.evaluate(()=>window.scrollTo(0,0));
}
(async () => {
  fs.mkdirSync(SHOTS, {recursive:true});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {})});
  for (const course of courses) for (const width of [320,1280]) {
    const context = await browser.newContext({viewport:{width,height:900}});
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(course.slug + ': ' + error));
    await page.goto(origin + '/school/' + course.slug + '/?cabinet=peterson-helper');
    await loaded(page, course);
    await page.locator('.lr-route').waitFor();
    assert.equal(await page.locator('.lr-topic').count(), course.topics);
    assert.equal(await page.locator('.lr-chapter').count(), course.chapters);
    assert.equal(await page.locator('.lr-topic-new').count(), course.topics);
    assert.deepEqual(await readCounts(page), [0,0]);
    const button = page.locator('.lr-primary'), box = await button.boundingBox();
    assert(box && box.y >= 0 && box.y + box.height <= 900, 'continuation visible on first screen at ' + width);
    await routeHelp(page, course, width, 'empty');
    await noOverflow(page, course.slug + ' empty ' + width);
    await page.screenshot({path:path.join(SHOTS, course.slug + '-empty-' + width + '.png'),fullPage:true});
    // Native keyboard activation retains cabinet query and opens a genuine lesson.
    await button.focus(); await page.keyboard.press('Enter');
    await page.waitForSelector('#problem');
    assert.equal(new URL(page.url()).search, '?cabinet=peterson-helper');
    assert.equal(new URL(page.url()).hash, '#lesson/p01/0');
    const independentId = await solve(page, course, 0, false);
    const assistedId = await solve(page, course, 1, true);
    // Reading acknowledgement is an explicit learner action, never a solved task.
    await nav(page, course, '#lesson/p02/0');
    await page.getByText('Коротко о главном', {exact:true}).click();
    await page.locator('[data-action=route-studied]').click();
    const studiedRecord = await saved(page, course.key + '.route.v1');
    assert(studiedRecord, 'theory acknowledgement is persisted separately');
    await nav(page, course, '#home');
    assert.deepEqual(await readCounts(page), [1,1]);
    assert.equal(await page.locator('.lr-theory-mark').count(), 1);
    assert.match(await page.locator('.lr-topic-help').first().textContent(), /1/);
    assert.match(await page.locator('.lr-confirmed-count').textContent(), new RegExp('0 из ' + course.topics));
    // A draft and notebook survive the route, reload and Continue action.
    await nav(page, course, '#lesson/p01/2');
    const task = await page.evaluate(data => window[data].lessons[0].tasks[2], course.data);
    if (task.kind === 'choice') await page.locator('[data-choice="0"]').click();
    else await page.locator('#final-answer').fill('12345');
    await page.getByText('Мои записи к задаче', {exact:true}).click();
    await page.locator('#notebook').fill('Черновик маршрута: сохранить эту запись');
    const before = await saved(page, course.key);
    await nav(page, course, '#home');
    assert.equal(await saved(page, course.key), before, 'map does not rewrite existing progress');
    assert.equal(await page.locator('.lr-primary').getAttribute('href'), '#lesson/p01/2');
    await page.reload(); await loaded(page, course);
    assert.equal(await saved(page, course.key), before, 'home reload does not rewrite legacy progress');
    assert.equal(await saved(page, course.key + '.route.v1'), studiedRecord, 'theory persists');
    assert.deepEqual(await readCounts(page), [1,1]);
    await routeHelp(page, course, width, 'mixed');
    await noOverflow(page, course.slug + ' mixed ' + width);
    await page.screenshot({path:path.join(SHOTS, course.slug + '-mixed-' + width + '.png'),fullPage:true});
    await page.locator('.lr-primary').click(); await page.waitForSelector('#notebook');
    assert.equal(await page.locator('#notebook').inputValue(), 'Черновик маршрута: сохранить эту запись');
    assert.equal(new URL(page.url()).search, '?cabinet=peterson-helper');
    if (course.slug === 'peterson6') assert.equal(await page.locator('.peterson-help').evaluate(node=>getComputedStyle(node).position), 'fixed', 'task helper retains floating placement after resume');
    const restored = await state(page, course);
    assert.equal(restored.tasks[independentId].independent, true);
    assert.equal(restored.tasks[assistedId].independent, false);
    // Existing detour return preserves the current lesson and full notes.
    const detours = page.locator('[data-action=detour]');
    if (await detours.count()) {
      await detours.first().click(); await page.waitForSelector('.return-banner');
      await page.locator('[data-action=return]').first().click(); await page.waitForSelector('#notebook');
      assert.equal(await page.locator('#notebook').inputValue(), 'Черновик маршрута: сохранить эту запись');
    }
    // Every chapter can be opened and its topic link navigated at 320 and 1280.
    await nav(page, course, '#home');
    const lastChapter = page.locator('.lr-chapter').last();
    if (!await lastChapter.locator('details').evaluate(el => el.open)) await lastChapter.locator('summary').click();
    await noOverflow(page, course.slug + ' last chapter ' + width);
    const finalHref = await lastChapter.locator('.lr-topic a').last().getAttribute('href');
    await lastChapter.locator('.lr-topic a').last().click();
    await page.waitForSelector('#problem');
    assert.equal(new URL(page.url()).hash, finalHref);
    // Direct entry/reload to existing chapter and the course search anchor.
    if(course.slug==='makarychev8'){
      await page.goto(origin+'/school/'+course.slug+'/#chapter/6');await loaded(page,course);
      assert.equal(await page.locator('#chapter-6 details').evaluate(el=>el.open),true);
      await page.waitForFunction(()=>Math.abs(document.getElementById('chapter-6').getBoundingClientRect().top)<100);
    }
    await page.goto(origin+'/school/'+course.slug+'/#course-number-search');await loaded(page,course);
    await page.waitForFunction(()=>{const box=document.getElementById('exercise-number').getBoundingClientRect();return box.top>=0&&box.bottom<=innerHeight;});
    // Download and reimport include the old task format and separate study metadata.
    if(width===320){
      await nav(page,course,'#progress');
      const pending=page.waitForEvent('download');
      await page.locator('[data-action=export]').click();
      const download=await pending, bytes=fs.readFileSync(await download.path()), exported=JSON.parse(bytes);
      assert.deepEqual(exported.learningRoute,{version:1,studied:{p02:true}});
      assert.equal(exported.state.tasks[independentId].independent,true);
      assert.equal(exported.state.tasks[assistedId].independent,false);
      const importedContext=await browser.newContext({viewport:{width,height:900}}),imported=await importedContext.newPage();
      await imported.goto(origin+'/school/'+course.slug+'/#progress');await loaded(imported,course);
      await imported.locator('#import-file').setInputFiles({name:'learner.json',mimeType:'application/json',buffer:bytes});
      await imported.waitForFunction(()=>document.getElementById('import-status').textContent.includes('объединены'));
      const roundtrip=await state(imported,course);
      assert.deepEqual(roundtrip.tasks,exported.state.tasks,'all task records survive export/import');
      assert.deepEqual(roundtrip.practice,exported.state.practice,'practice seeds survive export/import');
      if(course.slug==='peterson6')assert.deepEqual(roundtrip.history,exported.state.history,'prior-method history survives export/import');
      await nav(imported,course,'#home');assert.deepEqual(await readCounts(imported),[1,1]);
      assert.equal(await imported.locator('.lr-theory-mark').count(),1);
      await importedContext.close();
    }
    results.push({course:course.slug,width,flows:['empty route','keyboard continuation','independent/help counts','explicit theory','old data unchanged on home','draft reload','cabinet query','chapter links']});
    await context.close();
  }
  // Earlier Peterson equation-method work stays visible, but never receives current credit.
  {
    const course=courses[0],context=await browser.newContext(),page=await context.newPage();
    await page.goto(origin+'/school/peterson6/');await loaded(page,course);
    const legacy=await page.evaluate(()=>{
      const t=Object.values(window.PetersonCourse.legacyTasks)[0];
      const old={methodVersion:1,value:String(t.answer),correct:true,independent:true,attempts:1,assisted:false,note:'Прежняя запись сохранена'};
      return window.PetersonApp.validateState({version:1,tasks:{[t.id]:old},practice:{},last:null,origin:null,history:{[t.id]:[{...old,note:'Прежняя история сохранена'}]}});
    });
    const raw=JSON.stringify(legacy);
    await page.evaluate(({key,raw})=>localStorage.setItem(key,raw),{key:course.key,raw});
    await page.reload();await loaded(page,course);
    assert.deepEqual(await readCounts(page),[0,0]);
    assert.equal(await saved(page,course.key),raw,'map preserves earlier-method raw bytes');
    assert.match(await page.locator('.legacy-summary summary').textContent(),/1 задач/);
    await page.locator('.legacy-summary summary').click();
    await page.locator('.legacy-summary a').first().click();await page.waitForSelector('.earlier-work');
    assert.equal(await page.locator('#notebook').inputValue(),'Прежняя запись сохранена');
    await page.locator('.earlier-work summary').click();
    assert.match(await page.locator('.earlier-work').textContent(),/Прежняя история сохранена/);
    await context.close();
  }
  // Storage denial must not prevent either course from rendering or solving locally.
  for(const course of courses){
    const context=await browser.newContext({viewport:{width:320,height:900}}),page=await context.newPage();
    await context.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Storage disabled','SecurityError');}}));
    await page.goto(origin+'/school/'+course.slug+'/');await loaded(page,course);
    assert.equal(await page.locator('#storage-warning').isVisible(),true);
    assert.deepEqual(await readCounts(page),[0,0]);
    await page.locator('.lr-primary').click();await page.waitForSelector('#problem');
    await solve(page,course,0,false);
    await nav(page,course,'#home');assert.deepEqual(await readCounts(page),[1,0]);
    await noOverflow(page,course.slug+' denied storage');
    await context.close();
  }
  // A pre-route saved completion in every topic remains recognized without migration.
  for (const course of courses) {
    const context = await browser.newContext({viewport:{width:1280,height:900}}), page = await context.newPage();
    await page.goto(origin + '/school/' + course.slug + '/'); await loaded(page,course);
    const complete = await page.evaluate(({api,data}) => {
      const raw = {version:1,tasks:{},practice:{},last:null,origin:null};
      for (const lesson of window[data].lessons) for (const t of lesson.tasks) raw.tasks[t.id] = {value:t.answerFormat==='decimal'?window.PetersonMath.decimal(t.answer):String(t.answer),correct:true,independent:true,attempts:1,assisted:false,...(t.methodVersion?{methodVersion:t.methodVersion}:{})};
      return window[api].validateState(raw);
    },course);
    await page.evaluate(({key,value}) => localStorage.setItem(key,value),{key:course.key,value:JSON.stringify(complete)});
    await page.reload(); await loaded(page,course);
    assert.equal(await page.locator('.lr-topic-confirmed').count(),course.topics);
    assert.match(await page.locator('.lr-confirmed-count').textContent(),new RegExp(course.topics+' из '+course.topics));
    assert.equal(await page.locator('.lr-primary').getAttribute('href'),'#skills');
    assert.match(await page.locator('.lr-next-title').textContent(),/Все учебные задачи пройдены/);
    assert.equal(await saved(page,course.key),JSON.stringify(complete));
    // Malformed progress is kept byte-for-byte and not mistaken for completed work.
    await page.evaluate(key=>localStorage.setItem(key,'{broken'),course.key);
    await page.reload(); await loaded(page,course);
    assert.equal(await saved(page,course.key),'{broken');
    assert.equal(await page.locator('#storage-warning').isVisible(),true);
    assert.deepEqual(await readCounts(page),[0,0]);
    await context.close();
  }
  // Shared-board application must remain isolated from both personal progress keys.
  const context=await browser.newContext(),page=await context.newPage();
  await context.addInitScript(() => {
    window.__routeStorageCalls=[];
    for(const method of ['getItem','setItem']){
      const original=Storage.prototype[method];
      Storage.prototype[method]=function(key,...rest){
        if(String(key).startsWith('mathexam.peterson6.part1.v1'))window.__routeStorageCalls.push(method+':'+key);
        return original.call(this,key,...rest);
      };
    }
  });
  await page.goto(origin+'/trainers/peterson6.html');
  await page.waitForFunction(()=>window.__peterson6Board);
  assert.equal(await page.locator('.lr-route').count(),0);
  assert.equal(await page.locator('[data-action=route-studied]').count(),0);
  assert.deepEqual(await page.evaluate(()=>window.__routeStorageCalls),[]);
  assert.equal(await page.evaluate(()=>window.__peterson6Board.validateState(window.__peterson6Board.getState())),true);
  await context.close();
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({status:'PASS',results,extra:['direct chapter and search anchors','export/import task records and study marks','earlier-method history separate','complete saved courses','corrupt saves preserved','denied storage','shared-board personal-storage isolation','Peterson map help flow space, focus, resize and rerender'],screenshots:10}));
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{
  if(browser)await browser.close();
  server.close();
});

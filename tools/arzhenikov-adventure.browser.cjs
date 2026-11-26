'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require('playwright');

const trainer = process.env.ARZHENIKOV_TRAINER_URL || pathToFileURL(path.resolve(__dirname,
  '../trainers/oge-basics/multiplication-division/arzhenikov-map.html')).href;
const artifacts = path.resolve(process.env.ARZHENIKOV_ARTIFACT_DIR || 'artifacts/arzhenikov-adventure');
const key = 'mathexam.arzhenikov.workshop.v1';
fs.mkdirSync(artifacts, {recursive:true});

function expected(scene) {
  return scene.kind === 'share' ? scene.total / scene.targets.length
    : scene.kind === 'pack' ? scene.total / scene.size : scene.size * scene.targets.length;
}
function formula(scene) {
  return scene.kind === 'count' ? scene.size + ' × ' + scene.targets.length + ' = ' + expected(scene)
    : scene.total + ' : ' + (scene.kind === 'share' ? scene.targets.length : scene.size) + ' = ' + expected(scene);
}
const progress = page => page.evaluate(() => window.ArzhenikovWorkshopProgress());
const stage = (page,name) => page.locator('#workshop-play[data-stage="' + name + '"]').waitFor();
const action = (page,name) => page.locator('#workshop-play [data-action="' + name + '"]');
const put = (page,index) => page.locator('#workshop-play [data-action="place"][data-index="' + index + '"]');
async function noOverflow(page,where) {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),where + ': horizontal overflow');
}
async function solveScene(page,scene,keyboard) {
  await stage(page,'layout');
  assert.equal(await page.locator('#workshop-play .ws-equation:visible,.ws-option:visible').count(),0);
  for (let group=0; group<scene.total/scene.size; group++) {
    for (let n=0; n<scene.size; n++) {
      if (keyboard) await put(page,group).press('Enter');
      else await put(page,group).click();
    }
  }
  if (scene.kind === 'pack') {
    assert.equal(await page.locator('.ws-instruction').innerText(),'Все предметы собраны в полные группы. Нажми «Проверить раскладку».');
    const groups = scene.total / scene.size;
    const targets = page.locator('#workshop-play .ws-target');
    assert.equal(await targets.count(),scene.targets.length);
    assert.deepEqual(await targets.evaluateAll(nodes=>nodes.map(n=>n.dataset.packState)),
      scene.targets.map((_,index)=>index<groups?'full':'empty'));
    assert.deepEqual(await targets.evaluateAll(nodes=>nodes.map(n=>n.querySelectorAll('.ws-token').length)),
      scene.targets.map((_,index)=>index<groups?scene.size:0));
  } else {
    assert.equal(await page.locator('.ws-instruction').innerText(),'Теперь нажми «Проверить раскладку».');
  }
  assert(await action(page,'check-layout').evaluate(el=>el.classList.contains('primary')));
  await action(page,'check-layout').press('Enter');
  await stage(page,'answer');
  await page.locator('#workshop-play input[name="quantity"]').fill(String(expected(scene)));
  await action(page,'check-answer').press('Enter');
  await stage(page,'practice-done');
  assert(await page.locator('.ws-payoff').isVisible(), 'A solved concrete story has a meaningful payoff');
  await action(page,'next').press('Enter');
}
async function notation(page,scene) {
  await stage(page,'notation');
  await page.getByRole('button',{name:formula(scene),exact:true}).press('Enter');
  await stage(page,'notation-done');
  await action(page,'next').press('Enter');
}

async function journey(browser,width) {
  const context = await browser.newContext({viewport:{width,height:850},reducedMotion:'reduce'});
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(trainer);
    await stage(page,'layout');
    if (width <= 375) {
      await page.setViewportSize({width,height:568});
      await page.screenshot({path:path.join(artifacts,'short-phone-' + width + '.png')});
      for (let child = 0; child < 3; child++) {
        const target = await put(page,child).boundingBox();
        assert(target && target.y >= 0 && target.y + target.height <= 568,
          'Picnic recipient ' + child + ' at ' + width + 'x568: ' + JSON.stringify(target));
      }
      await page.setViewportSize({width,height:850});
    }
    const drawer = page.locator('#life-map .wm-drawer');
    assert.equal(await drawer.evaluate(el => el.open),false,'The city map opens only on request');
    assert(await page.locator('#workshop-play').evaluate(el =>
      el.getBoundingClientRect().bottom <= document.querySelector('#life-map').getBoundingClientRect().top
    ),'The task precedes the map');
    const instruction = page.locator('.ws-instruction');
    assert((await instruction.innerText()).includes('«Для Ани»'));
    assert.equal(await action(page,'check-layout').evaluate(el=>el.classList.contains('primary')),false);
    assert(await put(page,0).evaluate(el => el.classList.contains('ws-first-move')));
    await put(page,1).press('Enter');
    assert.equal(await put(page,1).locator('.ws-token').count(),1,'The suggested first move is optional');
    assert.equal(await page.locator('.ws-first-move').count(),0);
    await page.reload();
    assert.equal(await put(page,1).locator('.ws-token').count(),1);
    assert.equal(await instruction.innerText(),'Продолжай раздавать поровну.');
    await action(page,'undo').press('Enter');
    await drawer.locator(':scope > summary').press('Enter');
    await drawer.locator('a[href="#workshop-picnic"]').press('Enter');
    await page.waitForURL(url => url.hash === '#workshop-picnic');
    await page.waitForFunction(() => document.activeElement === document.querySelector('.ws-title'));
    assert.equal(await drawer.evaluate(el => el.open),false);
    // A fresh deep link should also start at the top of the page.
    await page.goto('about:blank');
    await page.goto(trainer + '#workshop-picnic');
    await stage(page,'layout');
    const places = await page.evaluate(() => window.ArzhenikovLife.places);
    const first = await put(page,0).boundingBox();
    await page.screenshot({path:path.join(artifacts,'start-' + width + '.png')});
    assert(first && first.y >= 0 && first.y + first.height <= 850, 'First object control must be fully visible at ' + width);
    assert(first.width >= 44 && first.height >= 44, 'First control has a usable touch target');
    await noOverflow(page,'First screen ' + width);
    assert.deepEqual([(await progress(page)).storyCount,(await progress(page)).storyTotal],[0,48]);

    // A real keyboard move, saved reload and undo precede the full first trio.
    await put(page,0).press('Enter');
    await page.reload();
    assert.equal(await page.locator('.ws-target').first().locator('.ws-token').count(),1);
    await action(page,'undo').press('Enter');
    assert.equal(await page.locator('.ws-stock .ws-token').count(),places[0].scenes[0].total);
    for (const [index,scene] of places[0].scenes.slice(0,3).entries()) {
      await solveScene(page,scene,index===0);
    }
    assert.equal((await progress(page)).storyCount,3);
    assert.equal((await progress(page)).completed.length,0,'No postcard before mathematical records');
    for (const scene of places[0].scenes.slice(0,3)) await notation(page,scene);
    await stage(page,'complete');
    let record = await progress(page);
    assert.equal(record.storyCount,3);
    assert.deepEqual(record.completed,['picnic']);
    assert.equal(await page.locator('.ws-postcard').evaluate(el=>getComputedStyle(el).animationName),'none');
    assert((await page.locator('.ws-postcard-title').innerText()).includes(record.postcards.picnic));
    await page.locator('.ws-postcard').screenshot({path:path.join(artifacts,'postcard-' + width + '.png')});
    await noOverflow(page,'Reward ' + width);

    // Album is a disclosure, not a route change or a second source of progress.
    const previousURL = page.url();
    await page.locator('#adventure-album-link').press('Enter');
    assert.equal(page.url(),previousURL);
    assert.equal(await page.locator('#adventure-album').evaluate(el=>el.open),true);
    assert.equal(await page.locator('.adv-postcard[data-earned="true"]').count(),1);
    assert.equal(await page.locator('#adventure-story-count').innerText(),'3 из 48');
    await page.locator('#adventure-album').screenshot({path:path.join(artifacts,'album-' + width + '.png')});
    await noOverflow(page,'Album ' + width);
    await page.locator('.adv-postcard[href="#workshop-picnic"]').press('Enter');
    await page.waitForFunction(()=>document.activeElement===document.querySelector('#workshop-play .ws-title'));
    assert.equal(page.url(),previousURL,'Choosing the current postcard keeps its route');
    assert.equal(await page.locator('#adventure-album').evaluate(el=>el.open),false);
    const returned = await page.locator('#workshop-play .ws-title').boundingBox();
    assert(returned && returned.y >= 0 && returned.y < 850,'Same-hash album selection returns to the visible mission');

    // Next place, a saved partial move, browser back, then next again.
    await action(page,'next-place').press('Enter');
    await page.waitForURL(url=>url.hash==='#workshop-yard');
    await stage(page,'layout');
    await put(page,0).press('Enter');
    await page.reload();
    await page.goBack();
    await stage(page,'complete');
    await action(page,'next-place').press('Enter');
    await stage(page,'layout');
    assert.equal((await progress(page)).active,'yard');
    assert.equal(await page.locator('.ws-target').first().locator('.ws-token').count(),1,'Next preserves unfinished work');

    for (const [hash,selector,mode] of [['garden-count','#garden-play','garden'],['count','#sheet','skills'],['workshop-yard','#workshop-play','city']]) {
      await page.locator('.life-modes a[href="#' + (mode==='city'?'workshop':hash) + '"]').click();
      await page.locator(selector).waitFor({state:'visible'});
      assert.equal(await page.locator('body').getAttribute('data-adventure-mode'),mode);
      assert.equal(await page.locator('#adventure-album').isVisible(),mode==='city');
      await noOverflow(page,mode + ' ' + width);
    }
    assert.deepEqual(errors,[]);
    return places;
  } finally { await context.close(); }
}

function fixture(places,allStories=false) {
  const state = {active:'trip',completed:places.map(p=>p.id),runs:{},answeredStories:[]};
  for (const place of places) {
    const round = allStories ? 1 : 0;
    const solved = place.scenes.slice(round*3,round*3+3).map(scene=>
      scene.targets.map((_,index)=>index<scene.total/scene.size ? scene.size : 0));
    state.runs[place.id] = {round,step:2,stage:'complete',piles:solved[2],moves:[],solved,answer:'',hint:false};
    for (let index=0; index<(allStories?6:3); index++) state.answeredStories.push(place.id+'/'+index);
  }
  return state;
}
async function restoredJourney(browser,places) {
  async function open(state,hash) {
    const context = await browser.newContext({viewport:{width:375,height:850}});
    await context.addInitScript(({key,state})=>localStorage.setItem(key,JSON.stringify(state)),{key,state});
    const page = await context.newPage();
    await page.goto(trainer+'#workshop-'+hash);
    await stage(page,'complete');
    return {context,page};
  }
  // A real older save without answeredStories is conservatively migrated.
  const old = fixture(places);
  delete old.answeredStories;
  let {context,page} = await open(old,'trip');
  try {
    let record = await progress(page);
    assert.equal(record.storyCount,24);
    assert.equal(record.completed.length,8);
    assert.equal(await page.locator('#adventure-story-count').innerText(),'24 из 48');
    await action(page,'next-place').click();
    await stage(page,'layout');
    record = await progress(page);
    assert.equal(record.active,'picnic');
    assert.equal(record.currentRun.round,1,'After eight postcards, offer an unseen trio');
    assert.equal(record.storyCount,24);
  } finally { await context.close(); }

  // The current place can be the last place with unseen stories (same hash).
  const last = fixture(places,true);
  last.active='picnic';
  last.runs.picnic=fixture(places).runs.picnic;
  last.answeredStories=last.answeredStories.filter(id=>!['picnic/3','picnic/4','picnic/5'].includes(id));
  ({context,page}=await open(last,'picnic'));
  try {
    assert.equal((await progress(page)).storyCount,45);
    const before=page.url();
    await action(page,'next-place').click();
    await stage(page,'layout');
    assert.equal(page.url(),before);
    assert.equal((await progress(page)).currentRun.round,1);
  } finally { await context.close(); }

  // All concrete scenes may be solved while a second notation trio is unfinished.
  const unfinishedNotation=fixture(places,true);
  unfinishedNotation.runs.picnic.stage='notation';
  unfinishedNotation.runs.picnic.step=1;
  ({context,page}=await open(unfinishedNotation,'trip'));
  try {
    assert.equal((await progress(page)).storyCount,48);
    assert.equal((await progress(page)).nextPlace,'picnic');
    assert((await action(page,'next-place').innerText()).startsWith('Продолжить:'));
    await action(page,'next-place').click();
    await stage(page,'notation');
    assert.deepEqual((await progress(page)).currentRun,{stage:'notation',step:1,round:1});
  } finally { await context.close(); }

  ({context,page}=await open(fixture(places,true),'trip'));
  try {
    const record=await progress(page);
    assert.equal(record.storyCount,48);
    assert.equal(record.nextPlace,null);
    assert.equal(await action(page,'next-place').count(),0);
    await page.locator('#adventure-album-link').click();
    assert.equal(await page.locator('.adv-postcard[data-earned="true"]').count(),8);
    await page.locator('#adventure-album').screenshot({path:path.join(artifacts,'album-full-375.png')});
    await noOverflow(page,'Full album');
  } finally { await context.close(); }
}
async function withoutStorage(browser) {
  const context=await browser.newContext({viewport:{width:320,height:850}});
  await context.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new Error('Storage disabled for test');}}));
  const page=await context.newPage();
  try {
    await page.goto(trainer);
    await stage(page,'layout');
    await put(page,0).press('Enter');
    assert.equal(await page.locator('.ws-target').first().locator('.ws-token').count(),1);
    await action(page,'undo').press('Enter');
    assert.equal(await page.locator('.ws-target').first().locator('.ws-token').count(),0);
    assert((await page.locator('#storage').innerText()).includes('Сохранение после закрытия недоступно'));
    assert.equal((await progress(page)).storyCount,0);
  } finally { await context.close(); }
}

(async()=>{
  const browser=await chromium.launch();
  try {
    let places;
    for (const width of [320,375,1280]) places=await journey(browser,width);
    await restoredJourney(browser,places);
    await withoutStorage(browser);
    console.log('ARZHENIKOV_CHILD_ADVENTURE_OK: 320/375/1280, first action, keyboard, reward, album return, next place, unfinished notation, old save, same-hash unseen trio, 24/48 distinction, no storage, reduced motion');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});

'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require('playwright');

const trainer = pathToFileURL(path.resolve(__dirname,
  '../trainers/oge-basics/multiplication-division/arzhenikov-map.html')).href;

function answer(scene) {
  if (scene.kind === 'share') return scene.total / scene.targets.length;
  if (scene.kind === 'pack') return scene.total / scene.size;
  return scene.size * scene.targets.length;
}

function expression(scene) {
  const factors = scene.kind === 'count'
    ? [scene.size, scene.targets.length]
    : [scene.total, scene.kind === 'share' ? scene.targets.length : scene.size];
  return factors.join(scene.kind === 'count' ? '×' : ':') + '=' + answer(scene);
}

function checkBank(places) {
  assert(places.length >= 8, 'The map must have at least eight places');
  assert.equal(new Set(places.map(p => p.id)).size, places.length);
  const plots = new Set();
  for (const place of places) {
    assert(place.scenes.length >= 6 && place.scenes.length % 3 === 0, place.name);
    for (let first = 0; first < place.scenes.length; first += 3) {
      const trio = place.scenes.slice(first, first + 3);
      assert.deepEqual(trio.map(s => s.kind).sort(), ['count','pack','share'], place.name);
      for (const scene of trio) {
        assert(scene.title && scene.prompt && scene.item && scene.hint && scene.meaning, scene.title);
        assert(Number.isInteger(scene.size) && scene.size > 0 && Number.isInteger(scene.total));
        assert.equal(new Set(scene.targets).size, scene.targets.length, scene.title);
        assert.equal(scene.total % scene.size, 0, scene.title);
        const groups = scene.total / scene.size;
        if (scene.kind === 'pack') {
          assert(scene.targets.length > groups, scene.title);
          assert(scene.prompt.includes('свободные можно оставить пустыми'), scene.title);
        }
        else assert.equal(scene.targets.length, groups, scene.title);
        assert(!plots.has(scene.prompt), 'Repeated situation: ' + scene.title);
        plots.add(scene.prompt);
      }
    }
  }
  return plots.size;
}

async function exercise(browser, width, fullBank) {
  const page = await browser.newPage({viewport:{width,height:850}});
  page.setDefaultTimeout(20000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const board = page.locator('#workshop-play');
  const map = page.locator('#life-map');
  const act = name => board.locator('[data-action="' + name + '"]');
  const targetAction = (name,index) => act(name).and(board.locator('[data-index="' + index + '"]'));
  const stage = name => page.locator('#workshop-play[data-stage="' + name + '"]').waitFor();
  const work = () => page.locator('#workshop').isVisible();
  const fits = () => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  const earned = {share:0,pack:0,count:0};
  const finished = new Set();
  let totals;
  async function openDetails(details) {
    if (!await details.evaluate(el => el.open)) await details.locator(':scope > summary').click();
  }
  async function openMap() { await openDetails(map.locator('.wm-drawer')); }
  async function checkSkills(showRows = false) {
    assert.deepEqual(await page.evaluate(() => window.ArzhenikovWorkshopProgress().skills),earned);
    if (!showRows) return;
    await openMap();
    const skills = map.locator('.wm-skills');
    assert.equal(await skills.locator('summary').innerText(),'Мои навыки');
    await openDetails(skills);
    for (const kind of Object.keys(earned)) {
      const row = skills.locator('[data-skill="'+kind+'"]');
      assert(await row.isVisible());
      assert.equal(await row.locator('.wm-skill-count').innerText(),'Решено '+earned[kind]+' из '+totals[kind]);
      assert.deepEqual(await row.locator('progress').evaluate(p => [p.value,p.max]),[earned[kind],totals[kind]]);
    }
  }
  async function visit(place) {
    await openMap();
    const stop = map.locator('a[href="#workshop-' + place.id + '"]');
    await stop.click();
    await page.waitForURL(url => url.hash === '#workshop-' + place.id);
    await stage('layout');
  }
  async function solveScene(scene, probe) {
    await stage('layout');
    assert((await board.innerText()).includes(scene.title),scene.title);
    assert.equal(await board.locator('input:visible,.ws-option:visible,.ws-equation:visible').count(),0);
    const stock = board.locator('.ws-stock .ws-token');
    const bins = board.locator('.ws-target');
    assert.equal(await stock.count(),scene.total);
    if (scene.kind === 'count') {
      const caption = await board.locator('.ws-stock .ws-caption').innerText();
      assert(!caption.match(/\d+/g)?.includes(String(scene.total)), scene.title+' reveals its answer');
    }
    assert.equal(await bins.count(),scene.targets.length);
    if (probe) {
      const put = targetAction('place',0);
      await put.focus();
      await page.keyboard.press('Enter');
      assert.equal(await bins.nth(0).locator('.ws-token').count(),1);
      await page.reload();
      assert.equal(await stock.count(),scene.total-1);
      assert.equal(await bins.nth(0).locator('.ws-token').count(),1);
      await act('undo').click();
      assert.equal(await stock.count(),scene.total);
      await act('check-layout').click();
      await stage('layout');
      assert((await board.locator('.ws-feedback').innerText()).trim());
      await act('hint').click();
      assert(await board.locator('.ws-hint').isVisible());
      assert.equal(await board.locator('.ws-option:visible,.ws-equation:visible').count(),0);
    }
    const groups = scene.total / scene.size;
    if (scene.title === 'Тренировка ударов') {
      assert(scene.prompt.includes('Для одних ворот нужны 2 конуса'));
      // Reproduce the reported 2,1,1,2 layout, with no cones left in stock.
      for (const [index,amount] of [2,1,1,2].entries()) {
        for (let n=0;n<amount;n++) await targetAction('place',index).click();
      }
      assert.equal(await stock.count(),0);
      assert.deepEqual(await bins.evaluateAll(nodes=>nodes.map(n=>n.dataset.packState)),['full','partial','partial','full']);
      const instruction = await board.locator('.ws-instruction').innerText();
      assert(instruction.includes('У берёзы') && instruction.includes('У скамьи') && instruction.includes('Забрать'));
      await act('check-layout').click();
      await stage('layout');
      assert((await board.locator('.ws-feedback').innerText()).includes('У скамьи'));
      await targetAction('return',2).click();
      await targetAction('place',1).click();
      assert.deepEqual(await bins.evaluateAll(nodes=>nodes.map(n=>n.dataset.packState)),['full','full','empty','full']);
      assert((await board.locator('.ws-instruction').innerText()).includes('Проверить раскладку'));
      // Restore the empty layout, then run the regular path and verify the answer.
      for (const [index,amount] of [2,2,0,2].entries()) {
        for (let n=0;n<amount;n++) await targetAction('return',index).click();
      }
    }
    for (let group = 0; group < groups; group++) {
      const put = targetAction('place',group);
      if (probe) {
        for (let n = 0; n < scene.size; n++) await put.press('Enter');
      } else {
        await put.evaluate((button,count) => {
          for (let n = 0; n < count; n++) button.click();
        },scene.size);
      }
    }
    assert.equal(await stock.count(),0);
    if (scene.kind === 'pack') {
      assert.equal(await board.locator('.ws-target[data-pack-state="full"]').count(),groups);
      assert.equal(await board.locator('.ws-target[data-pack-state="empty"]').count(),scene.targets.length-groups);
    }
    if (probe) {
      await targetAction('return',0).click();
      await targetAction('place',1).click();
      await act('check-layout').click();
      await stage('layout');
      assert.equal(await bins.nth(0).locator('.ws-token').count(),scene.size-1);
      assert.equal(await bins.nth(1).locator('.ws-token').count(),scene.size+1);
      assert((await board.locator('.ws-feedback').innerText()).trim());
      await act('undo').click();
      await targetAction('place',0).click();
    }
    await act('check-layout').press('Enter');
    await stage('answer');
    const input = board.locator('input[name=quantity]');
    if (probe) {
      await input.fill(String(answer(scene)+1));
      await act('check-answer').press('Enter');
      await stage('answer');
      assert((await board.locator('.ws-feedback').innerText()).trim());
      await checkSkills();
    }
    await input.fill(String(answer(scene)));
    await act('check-answer').press('Enter');
    await stage('practice-done');
    if (!finished.has(scene.prompt)) {
      finished.add(scene.prompt);
      earned[scene.kind]++;
    }
    await checkSkills(probe);
    assert.equal(await board.locator('.ws-option:visible,.ws-equation:visible').count(),0);
    await act('next').press('Enter');
  }
  async function notation(scene, probe) {
    await stage('notation');
    const options = board.locator('.ws-option');
    const texts = (await options.allTextContents()).map(text =>
      text.replace(/\s/g,'').replace(/[·⋅*]/g,'×').replace(/[÷∶]/g,':'));
    const correct = texts.indexOf(expression(scene));
    assert.notEqual(correct,-1,scene.title+' expected '+expression(scene)+' in '+texts.join(', '));
    if (probe) {
      await options.nth((correct+1)%texts.length).press('Enter');
      await stage('notation');
      assert((await board.locator('.ws-feedback').innerText()).trim());
      await page.reload();
      await stage('notation');
    }
    await options.nth(correct).press('Enter');
    await stage('notation-done');
    assert((await board.innerText()).includes(scene.meaning),scene.title);
    await act('next').press('Enter');
  }
  try {
    await page.goto(trainer);
    await stage('layout');
    const places = await page.evaluate(() => window.ArzhenikovLife.places);
    const total = checkBank(places);
    totals = Object.fromEntries(Object.keys(earned).map(kind =>
      [kind,places.flatMap(place => place.scenes).filter(scene => scene.kind === kind).length]));
    await checkSkills(true);
    assert(await work());
    assert(await fits(), 'Landing page overflows at '+width);
    await openMap();
    const stops = await map.locator('a.wm-stop').evaluateAll(nodes =>
      nodes.map(node => ({href:node.getAttribute('href'),label:node.textContent})));
    assert.equal(stops.length,places.length);
    for (const place of places) {
      assert(stops.some(s => s.href === '#workshop-'+place.id && s.label.includes(place.name)),place.name);
    }
    assert(await fits(), 'Open map overflows at '+width);
    await visit(places[0]);
    const testedPlaces = fullBank ? places : [places[0]];
    for (const [placeIndex,place] of testedPlaces.entries()) {
      if (placeIndex) await visit(place);
      const rounds = fullBank ? place.scenes.length/3 : 1;
      for (let round=0;round<rounds;round++) {
        if (round) await act('replay').press('Enter');
        const trio = place.scenes.slice(round*3,round*3+3);
        for (const [i,scene] of trio.entries()) await solveScene(scene, !placeIndex && !round && !i);
        for (const [i,scene] of trio.entries()) await notation(scene,!placeIndex && !round && !i);
        await stage('complete');
        assert(await fits(), 'Completion overflows at '+width);
        const stop = map.locator('a[href="#workshop-'+place.id+'"]');
        assert.equal(await stop.getAttribute('data-complete'),'true');
      }
    }
    if (fullBank) assert.deepEqual(earned,totals);
    await page.reload();
    await stage('complete');
    await checkSkills(true);
    for (const hash of ['#count','#garden-count']) {
      const link=board.locator('a[href="'+hash+'"]');
      await link.click();
      await page.locator('#workshop').waitFor({state:'hidden'});
      assert(await page.locator(hash==='#count'?'#sheet':'#garden-play').isVisible());
      await page.goBack();
      await stage('complete');
    }
    if (fullBank) {
      await act('replay').press('Enter');
      await solveScene(places.at(-1).scenes[0],false);
      await page.reload();
      await stage('layout');
      await checkSkills(true);
    }
    assert.deepEqual(errors,[]);
    return fullBank ? total : 3;
  } finally { await page.close(); }
}

(async() => {
  const browser = await chromium.launch();
  try {
    const mobile = await exercise(browser,320,false);
    const desktop = await exercise(browser,1280,true);
    console.log('ARZHENIKOV_LIFE_BROWSER_OK',desktop+' scenes',mobile+' mobile scenes');
  } finally { await browser.close(); }
})().catch(error => {console.error(error);process.exitCode=1;});

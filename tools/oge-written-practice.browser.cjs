'use strict';
// Run with the existing isolated Playwright installation used by OGE skill course.
// No real student data, external network or API.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const file = path.join(root, 'trainers/oge-written-practice.html');
const html = fs.readFileSync(file, 'utf8');
const url = 'https://mathexam.test/trainers/oge-written-practice.html';
const keys = ['mathExamCourseProgress.v1', 'mathExam.oge6.practice.v1', 'oge21_prog', 'mathexam.oge.course-navigation.v1'];
const baseline = Object.fromEntries(keys.map((k,i) => [k, JSON.stringify({synthetic: true, index: i})]));
const ids = ['p24-median-height','p24-cross-sides','p24-cross-diagonals','p24-return','p25-median-bisector','p25-tangent-trapezoid'];
async function getExport(page) {
  const pending = page.waitForEvent('download');
  await page.locator('#export').click();
  const stream = await (await pending).createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function unavailable(control) {
  return !(await control.isVisible()) || await control.isDisabled();
}

async function inspectAreaFigure(page, kind) {
  const drawing = page.locator('#area-drawing svg');
  await drawing.waitFor({state: 'visible'});
  assert(await drawing.evaluate(svg =>
    !!(svg.compareDocumentPosition(document.querySelector('#area-statement')) & Node.DOCUMENT_POSITION_FOLLOWING)
  ), 'Diagram precedes the question');
  assert.equal(await drawing.locator('[data-mark="right"]').count(), 0,
    'No right angle is given in either of the new problems');
  const pts = await drawing.locator('text').evaluateAll(labels => Object.fromEntries(labels.map(label => {
    const dot = label.parentElement.querySelector('circle');
    return [label.textContent, [+dot.getAttribute('cx'), +dot.getAttribute('cy')]];
  })));
  const area2 = (a, b, c) => (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
  const insideSegment = (p, a, b) => Math.abs(area2(a, b, p)) < 1e-7 &&
    (p[0]-a[0])*(p[0]-b[0]) + (p[1]-a[1])*(p[1]-b[1]) < 0;
  const { A, B, C } = pts;
  if (kind === 'triangle') {
    const { M, P } = pts;
    assert.deepEqual(M, [(B[0]+C[0])/2, (B[1]+C[1])/2], 'M bisects BC');
    assert(insideSegment(P, A, M), 'P lies strictly inside AM');
    assert(Math.abs(Math.abs(area2(A,B,P)) - Math.abs(area2(A,C,P))) < 1e-7);
    assert.equal(await drawing.locator('[data-mark="equal"]').count(), 2);
  } else {
    const { D, O } = pts;
    assert(insideSegment(O, A, C) && insideSegment(O, B, D), 'O lies inside both diagonals');
    assert(Math.abs(Math.abs(area2(A,O,D)) - Math.abs(area2(B,O,C))) < 1e-7);
    assert.equal(await drawing.locator('[data-mark="parallel"],[marker-end],[marker-start]').count(), 0,
      'The goal of the transfer may not be marked as a given');
  }
}

async function checkDirectEntrances(context, url) {
  const guided = await context.newPage();
  try {
    await guided.goto(url + '#area-workshop');
    await inspectAreaFigure(guided, 'triangle');
    await guided.locator('#area-input').fill('В тетради соединил P с B и C, чтобы сравнить части фигуры.');
    await guided.locator('#area-save').click();
    assert(await unavailable(guided.locator('#area-next')), 'A construction plan still needs a drawing');
    await guided.locator('#area-paper').check();
    await guided.locator('#area-save').click();
    assert(!(await unavailable(guided.locator('#area-next'))));
    const work = (await getExport(guided)).areaWorkshop;
    assert.equal(work.steps[0].first.onPaper, true);
    assert.deepEqual(work.steps[0].first.edges, []);
    await guided.locator('#area-transfer-open').click();
    assert(await unavailable(guided.locator('#area-model')));
    assert(!(await guided.locator('#area-paper').isChecked()), 'Paper flag is scoped to the task');
    await inspectAreaFigure(guided, 'quadrilateral');
  } finally { await guided.close(); }
  // The standalone link must open a fresh independent problem in a new tab.
  const transfer = await context.newPage();
  try {
    await transfer.goto(url + '#area-transfer');
    await inspectAreaFigure(transfer, 'quadrilateral');
    for (const id of ['area-model','area-hint','area-rubric','area-unable']) {
      assert(await unavailable(transfer.locator('#' + id)), id + ' blocked during a blind attempt');
    }
    assert.match(await transfer.locator('#area-statement').innerText(), /Докажи, что AB ∥ CD/);
    assert.doesNotMatch(await transfer.locator('#area-statement').innerText(), /трапеци/iu);
    assert.equal(await transfer.locator('#area-drawing [data-drawn-edge]').count(), 0);
    assert.equal(await transfer.locator('#area-model-text p').count(), 0);
    const first = 'Провёл диагонали в тетради. Прибавлю площадь AOB к обеим частям.';
    const input = transfer.locator('#area-input'), save = transfer.locator('#area-save');
    await transfer.locator('#area-paper').check();
    await input.fill(first);
    await save.click();
    await transfer.locator('#area-model').click();
    await input.fill(first + ' Дальше нужно пояснить, по какую сторону от AB находятся вершины.');
    await save.click();
    const work = (await getExport(transfer)).areaWorkshop;
    assert(work.steps.slice(0, 6).every(step => !step.first), 'Direct entry never credits the guided steps');
    assert.equal(work.steps[6].first.text, first);
    assert.equal(work.steps[6].first.onPaper, true);
    assert.deepEqual(work.steps[6].first.helpBefore, []);
    assert.deepEqual(work.steps[6].attempts[1].helpBefore, ['model']);
  } finally { await transfer.close(); }
}

async function checkAreaRoute(page, verifyOverflow) {
  const area = page.locator('#area-open'), classic = page.locator('#classic-open');
  const next = page.locator('#area-next'), back = page.locator('#area-prev');
  const save = page.locator('#area-save'), input = page.locator('#area-input');
  const hint = page.locator('#area-hint'), model = page.locator('#area-model');
  const drawing = page.locator('#area-drawing');
  const point = name => drawing.locator('[data-point="' + name + '"]');
  const edge = name => drawing.locator('[data-drawn-edge="' + name + '"]');
  const choose = pattern => page.locator('#area-choice').getByRole('radio', {name: pattern}).check();
  const write = async answer => { await input.fill(answer); await save.click(); };
  const draw = async (a, b) => { await point(a).press('Enter'); await point(b).press('Space'); };
  const plan = 'Проведу AM, BP и CP, чтобы видеть части треугольника.';
  await area.click();
  await inspectAreaFigure(page, 'triangle');
  assert(await unavailable(hint));
  assert(await unavailable(next));
  await draw('A', 'M');
  assert.equal(await edge('AM').count(), 1);
  await drawing.locator('[data-draw-undo]').click();
  assert.equal(await edge('AM').count(), 0);
  for (const [a,b] of [['M','A'],['B','P'],['C','P']]) await draw(a,b);
  await input.fill(plan);
  await classic.click();
  assert.equal(await page.locator('#nav').inputValue(), 'p24-return');
  await area.click();
  assert.equal(await input.inputValue(), plan, 'Unsaved construction plan survives mode changes');
  assert.equal(await drawing.locator('[data-drawn-edge]').count(), 3);
  assert(await unavailable(next), 'Drawing and an unsaved draft alone do not complete the step');
  await save.click();
  await verifyOverflow('construction with point controls');
  await next.click();

  // A plausible but incorrect inference must not let the pupil skip the facts stage.
  await choose(/^BM = MC, AP = PM/);
  await save.click();
  assert(await unavailable(next));
  assert.match(await page.locator('#area-feedback').innerText(), /серединой|середина/iu, 'Wrong choice receives feedback about the midpoint');
  await choose(/^BM = MC, точка P лежит внутри AM\. Нужно доказать, что площади/);
  await save.click();
  await next.click();
  await choose(/равные основания и равные высоты/);
  await save.click();
  await next.click();

  const chain = 'BM и MC равны. Из A высота к BC общая, а для второй пары общая высота из P.';
  await write(chain);
  await hint.click();
  await hint.click();
  assert(await unavailable(hint), 'Two requested hints exhaust the hint ladder for this stage');
  await input.fill(chain + ' Вычту меньшие площади из соответствующих больших.');
  await save.click();
  await next.click();

  await choose(/Вторая строка/);
  await save.click();
  assert.match(await page.locator('#area-feedback').innerText(), /исправление/iu);
  assert(await unavailable(next), 'Locating the error alone does not finish the repair');
  await write('У ABM и PCM вершины разные и высоты к BC разные. Сравним ABM с ACM: высота из A одна, а BM = MC.');
  await next.click();
  assert(await unavailable(model), 'No model before the pupil writes a full proof');
  await write('Медиана делит ABC на равновеликие треугольники ABM и ACM. У BPM и CPM основания равны и общая высота из P. Вычитая равные площади, получаем S(ABP) = S(ACP).');
  await page.locator('#area-rubric').click();
  await page.locator('#area-support input[type=checkbox]').first().check();
  await model.click();
  assert(await page.locator('#area-model-text p').first().isVisible());
  await verifyOverflow('written proof and self-check');
  await next.click();

  await inspectAreaFigure(page, 'quadrilateral');
  assert.equal(await drawing.locator('[data-drawn-edge]').count(), 0);
  assert(await unavailable(hint));
  assert(await unavailable(model));
  await draw('A','C');
  await draw('B','D');
  const transfer = 'Прибавим площадь AOB к обеим данным площадям. У ABD и ABC общее основание AB и равные площади. Точки D и C по одну сторону от AB на равных расстояниях от этой прямой, поэтому CD параллельна AB.';
  await input.fill(transfer);
  await back.click();
  await next.click();
  assert.equal(await input.inputValue(), transfer);
  assert(await unavailable(model), 'The unwritten transfer cannot show a worked solution');
  await save.click();
  assert(!(await unavailable(model)));
  await model.click();
  await verifyOverflow('transfer proof and model');
  return { plan, chain, transfer };
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [320,390,1280]) {
      const context = await browser.newContext({viewport:{width,height:900},acceptDownloads:true,reducedMotion:'reduce'});
      try {
        const requests = [], errors = [], localNavigationAssets = new Set();
        const optionalNavigation = new Map([
          ['https://mathexam.test/assets/assistant/navigator-data.js?v=20261105-site1',{path:'assets/assistant/navigator-data.js',type:'application/javascript'}],
          ['https://mathexam.test/assets/assistant/navigator-widget.js?v=20261105-site1',{path:'assets/assistant/navigator-widget.js',type:'application/javascript'}],
          ['https://mathexam.test/assets/assistant/widget.css?v=20261105-site1',{path:'assets/assistant/widget.css',type:'text/css'}]
        ]);
        await context.addInitScript(values => { for (const [k,v] of Object.entries(values)) localStorage.setItem(k,v); },baseline);
        await context.route('**/*', async route => {
          const u=route.request().url();
          if(u===url) return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html});
          if(u==='https://mathexam.test/favicon.ico') return route.fulfill({status:204,body:''});
          if(optionalNavigation.has(u)){
            localNavigationAssets.add(u);
            const asset=optionalNavigation.get(u);
            return route.fulfill({status:200,contentType:asset.type+'; charset=utf-8',body:fs.readFileSync(path.join(root,asset.path),'utf8')});
          }
          requests.push(u);
          return route.abort();
        });
        const page = await context.newPage();
        page.on('pageerror',e=>errors.push(String(e)));
        await page.goto(url);
        const controls=page.locator('#controls button'), writing=page.locator('#writing');
        const title=page.locator('#title'), figure=page.locator('#figure');
        const firstHistory=page.locator('#first-record'), firstText=page.locator('#first');
        const inspectFirst=async expected=>{
          assert.equal(await firstText.textContent(),expected,'Original record is retained in the document');
          if(!(await firstHistory.evaluate(el=>el.open))) await firstHistory.locator('summary').click();
          assert(await firstText.isVisible(),'First record must be visible after opening its history');
          assert.equal(await firstText.innerText(),expected,'Visible first record matches the original');
          await firstHistory.locator('summary').click();
          assert.equal(await firstHistory.evaluate(el=>el.open),false,'History can be closed again');
        };
        const home=page.locator('a[data-mathexam-home-link]');
        assert.equal(await home.count(),1);
        assert.equal(await home.getAttribute('href'),'/');
        assert.equal(await home.getAttribute('target'),'_self');
        assert(await home.isVisible());
        await home.scrollIntoViewIfNeeded();
        const homeBox=await home.boundingBox();
        assert(homeBox && homeBox.x>=0 && homeBox.y>=0 && homeBox.x+homeBox.width<=width+1 && homeBox.height>=44, 'Home return reachable at '+width+'px');
        await home.click({trial:true});
        const verifyOverflow=async label=>assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1), 'Horizontal overflow: '+width+' '+label);
        assert.match(await title.innerText(),/Медиана является высотой/);
        assert.equal(await figure.locator('polyline').count(),1,'Given right angle is marked');
        for (const b of await controls.all()) assert(await b.isDisabled(),'All help disabled before first entry');
        await verifyOverflow('initial');
        await writing.fill('AM = MC.');
        await page.locator('#save').click();
        await inspectFirst('AM = MC.');
        await writing.fill('AM = MC. BM общая.');
        await controls.nth(0).click();
        assert.match(await page.locator('#notice').innerText(),/Сначала зафиксируй/);
        assert.equal(await page.locator('#help section').count(),0);
        await page.locator('#next').click();
        await page.locator('#prev').click();
        assert.equal(await writing.inputValue(),'AM = MC. BM общая.','Uncommitted draft survives task switching');
        await inspectFirst('AM = MC.');
        await page.locator('#save').click();
        await controls.nth(0).click();
        assert.equal(await page.locator('#help section').count(),1);
        assert(!(await controls.nth(1).isDisabled()));
        await writing.fill('Исправлено после вопроса.');
        await page.locator('#save').click();
        await controls.nth(2).click();
        await controls.nth(3).click();
        await page.locator('#help-checklist input').first().check();
        await page.locator('#next').click();
        assert.match(await title.innerText(),/Два отрезка/);
        for (const b of await controls.all()) assert(await b.isDisabled());
        await page.locator('#prev').click();
        assert.equal(await writing.inputValue(),'Исправлено после вопроса.');
        await inspectFirst('AM = MC.');
        assert(await page.locator('#help-checklist input').first().isChecked());
        await verifyOverflow('expanded supports');
        for(const id of ids) {
          await page.locator('#nav').selectOption(id);
          assert.equal(await figure.locator('line').count()>2,true);
          await verifyOverflow(id);
        }
        await page.locator('#nav').selectOption('p24-return');
        assert.equal(await figure.locator('polyline').count(),0,'Unproved right angle is not marked');
        await page.locator('#unable').click();
        await inspectFirst('Не смог начать');
        await controls.nth(4).click();
        assert.equal(await figure.locator('polyline').count(),1,'Model reveals established right angle');
        await verifyOverflow('established figure');
        await checkDirectEntrances(context, url);
        const { plan, chain, transfer } = await checkAreaRoute(page, verifyOverflow);
        const data = await getExport(page);
        assert.equal(data.tasks.length,6);
        assert.equal(data.tasks[0].first.text,'AM = MC.');
        assert.equal(data.tasks[0].draft,'Исправлено после вопроса.');
        assert.equal(data.tasks[0].attempts.length,3);
        assert.deepEqual(data.tasks[0].attempts[1].helpBefore,[]);
        assert.deepEqual(data.tasks[0].attempts[2].helpBefore,['hint1']);
        assert.deepEqual(data.tasks[0].checks,[0]);
        assert(data.tasks[3].first.unable);
        assert.equal(data.tasks[3].help[0].kind,'model');
        assert.deepEqual(data.tasks.map(task => task.id), ids, 'Legacy task IDs and order are preserved');
        const block = data.areaWorkshop;
        assert.equal(block.steps.length, 7);
        assert.equal(new Set(block.steps.map(step => step.id)).size, 7);
        assert.deepEqual(block.drawings.triangle, ['AM','BP','CP']);
        assert.deepEqual(block.drawings.trapezoid, ['AC','BD']);
        assert.equal(block.steps[0].first.text, plan);
        assert.equal(block.steps[3].first.text, chain, 'Later edits cannot rewrite the first chain');
        assert.equal(block.steps[3].attempts.length, 2);
        assert.equal(block.steps[3].attempts[1].helpBefore.length, 2);
        assert.deepEqual(block.steps[5].checks, [0]);
        assert.deepEqual(block.steps[6].first.helpBefore, []);
        assert.equal(block.steps[6].first.text, transfer);
        assert.equal(block.steps[6].help.length, 1, 'Model viewed after the transfer is exported separately');
        assert.deepEqual(await page.evaluate(keys=>Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)])),keys),baseline);
        assert.deepEqual(requests,[],'no external or unexpected requests');
        assert.deepEqual([...localNavigationAssets].sort(),[...optionalNavigation.keys()].sort(),'only the three standard public navigation assets are loaded');
        assert.deepEqual(errors,[]);
        console.log('PASS written practice at '+width+'px: six legacy tasks, seven proof stages, independent transfer, drawing, help and export');
      } finally {await context.close();}
    }
  } finally {await browser.close();}
}
run().catch(error=>{console.error(error);process.exitCode=1;});

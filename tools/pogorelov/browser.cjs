'use strict';const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict'),{chromium}=require('playwright');const author=path.basename(__dirname),root=path.resolve(__dirname,'../..'),C=require(root+'/geometry-'+author+'/data/course.json');global.GeoTasks=require(root+'/geometry-'+author+'/assets/tasks.js');const T=require(root+'/geometry-'+author+'/assets/extra-tasks.js');

async function checkTriangleOverlayLabels(page) {
  await page.evaluate(() => {
    const context = document.querySelector('#geo-board canvas').getContext('2d');
    const fillText = context.fillText.bind(context);
    window.overlayLabelPositions = {};
    context.fillText = (label, x, y) => {
      window.overlayLabelPositions[label] = {x, y};
      return fillText(label, x, y);
    };
  });
  await page.locator('.point-select').selectOption('D');
  const initial = await page.evaluate(() => window.overlayLabelPositions);
  await page.locator('.point-x').fill('105');
  await page.locator('.point-y').fill('240');
  await page.locator('[data-act="move"]').click();
  const joined = await page.evaluate(() => window.overlayLabelPositions);
  for (const [left, right] of [['A','D'], ['B','E'], ['C','F']]) {
    assert.equal(joined[left].x, joined[right].x);
    assert.ok(joined[right].y - joined[left].y >= 20, left + ' and ' + right + ' stay legible');
  }
  await page.locator('[data-act="undo"]').click();
  assert.deepEqual(await page.evaluate(() => window.overlayLabelPositions), initial);
  const atEdges = await page.evaluate(() => {
    // Saved and dependent vertices can extend beyond the manual coordinate inputs.
    const scene = PogorelovTopicLabs.scene(20);
    const positions = {A:[615,385], B:[632,414], C:[625,2], D:[639,385]};
    for (const point of scene.points) {
      if (positions[point.id]) [point.x, point.y] = positions[point.id];
    }
    const host = document.createElement('div');
    const lab = GeoLab.mount(host, {scene, figure:'triangle', goal:'explore'}, () => {});
    const context = host.querySelector('canvas').getContext('2d');
    const labels = {};
    const draw = context.fillText.bind(context);
    context.fillText = (id, x, y) => { labels[id] = {x, y}; return draw(id, x, y); };
    lab.redraw();
    lab.destroy();
    return labels;
  });
  for (const [left, right] of [['A','D'], ['B','E'], ['C','F']]) {
    assert.equal(atEdges[left].x, atEdges[right].x, 'x labels share the clamped margin');
    assert.ok(Math.abs(atEdges[right].y - atEdges[left].y) >= 20, left + '/' + right);
    assert.ok(atEdges[right].y >= 19 && atEdges[right].y <= 405);
  }
  assert.ok(atEdges.E.y < atEdges.B.y, 'bottom-edge label moves up');
  assert.ok(atEdges.F.y > atEdges.C.y, 'top-edge label moves down');
}

(async()=>{const server=http.createServer((req,res)=>{let p=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!p.startsWith(root+path.sep))return res.writeHead(403).end();try{if(fs.statSync(p).isDirectory())p+='/index.html';res.setHeader('Content-Type',p.endsWith('.html')?'text/html; charset=utf-8':p.endsWith('.js')?'application/javascript':p.endsWith('.css')?'text/css':'text/plain');res.end(fs.readFileSync(p));}catch(e){res.writeHead(404).end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/geometry-'+author+'/',browser=await chromium.launch({executablePath:process.env.GEOMETRY_CHROMIUM||chromium.executablePath(),headless:true,args:['--no-sandbox']}),page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));let passed=0;
try{await page.goto(base);assert.equal(await page.locator('.course-card').count(),C.units.length);
for(const u of C.units){await page.goto(base+'atlas/'+u.id+'.html');await page.locator('[data-stage="1"]').click();assert.equal(await page.locator('#geo-board canvas').count(),1);if(u.id==='pogorelov-base-7-20')await checkTriangleOverlayLabels(page);await page.locator('#observation').fill('При движении сохраняется указанное условием отношение.');await page.locator('[data-stage="2"]').click();const proof=await page.evaluate(()=>COURSE_CONFIG.proof);for(const step of proof.steps){await page.locator('[data-proof="'+step.id+'"]').click();await page.locator('#reason-choice').selectOption('yes');await page.locator('[data-action="reason-check"]').click();}await page.locator('[data-stage="3"]').click();let seed=await page.evaluate(a=>JSON.parse(localStorage.getItem('mathExamGeometry.'+a+'.v1')).units[COURSE_CONFIG.unit.id].seed,author),t=T.task(u.calc,seed);for(const step of t.steps){await page.locator('#answer').fill(T.format(step.answer));await page.locator('#answer-form button').click();}await page.locator('[data-action="independent-start"]').click();seed=await page.evaluate(a=>JSON.parse(localStorage.getItem('mathExamGeometry.'+a+'.v1')).units[COURSE_CONFIG.unit.id].seed,author);t=T.task(u.calc,seed);await page.locator('#answer').fill(T.format(t.answer));await page.locator('#answer-form button').click();assert.match(await page.locator('#answer-feedback').innerText(),/Верно/);await page.locator('[data-stage="5"]').click();await page.locator('#written').fill('Моя письменная работа: условия, построение, основание вывода.');await page.locator('[data-action="finish"]').click();await page.reload();assert.match(await page.locator('#written').inputValue(),/Моя письменная работа/);if(++passed%20===0)console.log(author,'lessons',passed);}
await page.setViewportSize({width:360,height:800});for(const u of [C.units[0],C.units.find(x=>x.experiment==='ceva'),C.units.find(x=>x.space)].filter(Boolean)){await page.goto(base+'atlas/'+u.id+'.html');for(const n of [0,1,2,3,4,5]){await page.locator('[data-stage="'+n+'"]').click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),u.id+' overflow '+n);}}
await page.goto(base+'teacher.html');await page.locator('#local-report').click();assert.equal(await page.locator('tbody tr').count(),C.units.length);assert.deepEqual(errors,[]);await page.goto('file://'+root+'/geometry-'+author+'/atlas/'+C.units[0].id+'.html');await page.locator('[data-stage="1"]').click();assert.equal(await page.locator('#geo-board canvas').count(),1);console.log(JSON.stringify({status:'PASS',author,lessons:passed,mobile:360,offline:true,errors}));}catch(e){console.error(e);process.exitCode=1;}finally{await browser.close();server.close();}})();

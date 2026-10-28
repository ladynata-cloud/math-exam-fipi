'use strict';
// Actual public route plus the saved-assignment component with an old, synthetic
// taskSpec. This does not log in to or change any learner's account.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),output=process.env.GEOMETRY_OBJECT_LABEL_ARTIFACTS;
const D=require('../ege-baza/path/data');
for(const file of ['practice','equation-practice','grade7-algebra','grade7-geometry','grade7-foundations','pre7-arithmetic','pre7-applications','grade7-geometry-core','grade7-geometry-practice','grade7-geometry-rebuild-base','grade7-geometry-rebuild-foundations','grade7-geometry-rebuild-triangles','grade7-geometry-rebuild-relations','grade7-geometry-rebuild-workbook'])require('../ege-baza/path/'+file);
const url=file=>pathToFileURL(path.join(root,file)).href;
(async()=>{
 const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'geometry-names-')),savedTask=D.task('grade7-r-point-membership',1),serialized=JSON.stringify(savedTask);
 assert.equal(savedTask.model.elements.find(e=>e.id==='AB').label,'AB');assert.equal(savedTask.params.onSegment,false,'M is beyond B, as in the reported example');
 const html='<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Сохранённое задание · проверка названий</title>'+['learning/style.css','learning/teaching.css','learning/assignment-geometry.css'].map(file=>`<link rel="stylesheet" href="${url(file)}">`).join('')+'<body><div class="content-column"><main id="main"><h1>Геометрия по методичке · Первый шаг</h1><div id="drawing"></div></main></div>'+['learning/geometry-object-labels.js','ege-baza/path/grade7-geometry-core-models.js','learning/assignment-geometry.js'].map(file=>`<script src="${url(file)}"></script>`).join('')+`<script>window.savedTask=${serialized.replace(/</g,'\\u003c')};LearningAssignmentGeometry.mount(document.querySelector('#drawing'),savedTask);</script></body></html>`;
 const fixturePath=path.join(fixture,'saved-assignment.html');fs.writeFileSync(fixturePath,html);
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});const errors=[],results=[];
 try{
  const page=await browser.newPage();page.on('pageerror',error=>errors.push(error.message));
  if(output)fs.mkdirSync(output,{recursive:true});
  for(const width of [1280,360,320]){
   await page.setViewportSize({width,height:900});
   await page.goto(pathToFileURL(fixturePath).href);
   assert.equal(await page.locator('[data-geometry-select] option[value="AB"]').textContent(),'Отрезок AB');
   assert.equal(await page.locator('[data-geometry-select] option[value="line"]').textContent(),'Прямая AB');
   await page.locator('[data-geometry-select]').selectOption('AB');
   assert((await page.locator('[data-geometry-read]').textContent()).startsWith('Отрезок AB.'));
   assert.equal(await page.evaluate(()=>JSON.stringify(savedTask)),serialized);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'saved assignment fits '+width);
   if(output)await page.screenshot({path:path.join(output,`saved-assignment-labels-${width}.png`),fullPage:true});
   results.push({context:'saved-assignment',width,unchangedTask:true,segmentAndLineDistinct:true});
   for(const id of ['grade7-r-point-membership','grade7-r-angle-vertex']){
    await page.goto(url('ege-baza/path/index.html')+'#lesson='+id);
    await page.locator('[data-stage="1"]').click();
    const caption=id==='grade7-r-point-membership'?page.locator('[data-core-select="AB"]'):page.locator('[data-core-select]').filter({hasText:/^Луч /}).first();
    if(id==='grade7-r-point-membership')assert.equal(await caption.textContent(),'Отрезок AB');else assert.match(await caption.textContent(),/^Луч /);
    await caption.click();
    assert((await page.locator('[data-core-read]').textContent()).startsWith(await caption.textContent()));
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),id+' fits '+width);
    if(output)await page.screenshot({path:path.join(output,`${id}-labels-${width}.png`),fullPage:true});
    results.push({context:id,width,typedSelection:true,overflow:false});
   }
  }
  assert.deepEqual(errors,[]);console.log(JSON.stringify({gate:'GEOMETRY_LABEL_BROWSER_OK',results}));
 }finally{await browser.close();fs.rmSync(fixture,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});

'use strict';
// Focused integration of newly added answer families, including source ambiguity.
// Expected answers below were calculated separately from the author modules.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),dir=path.join(root,'stereo-course/shestakov-yaschenko-10-11');
const bundle=JSON.parse(fs.readFileSync(path.join(dir,'data/course.json')));
const css=fs.readFileSync(path.join(root,'stereo-course/textbook/assets/style.css'),'utf8')+fs.readFileSync(path.join(root,'stereo-course/assets/task-scenes.css'),'utf8')+fs.readFileSync(path.join(dir,'assets/style.css'),'utf8').replace(/@import[^;]+;/g,'');
const scripts=['stereo-course/assets/math-text.js','stereo-course/assets/task-scene-viewer.js','stereo-course/shestakov-yaschenko-10-11/assets/engine.js'].map(p=>fs.readFileSync(path.join(root,p),'utf8'));
const cases=[
 {id:'sy-1-1-b4-b',answer:'-1',why:'tangent of the drawn obtuse 135-degree angle'},
 {id:'sy-1-2-b1-a',answer:'4sqrt(15)/5',why:'equal-side triangle recovered from its three altitudes'},
 {id:'sy-1-3-a14-a',answer:'3',why:'hypotenuse sqrt(13), one leg 2, area 3'},
 {id:'sy-1-3-c1-b',manual:true,why:'source omits the location of M; no unique automatically graded position'},
 {id:'sy-1-4-a6-a',answer:'C; A; B',why:'angles opposite sides 5, 8, 9 in increasing order'},
 {id:'sy-1-4-a8-a',manual:true,why:'13 equals 5+8, so the alleged triangle is degenerate'},
 {id:'sy-1-4-b3-a',answer:'9',why:'both permitted angle configurations give the same side'},
 {id:'sy-1-4-b18-b',answer:'16/sqrt(17)',why:'twice the grid-triangle area divided by sqrt(17)'},
 {id:'sy-1-5-c3-a',answer:'0;4/5',why:'reflection gives the minimizing point on the y-axis'},
 {id:'sy-1-5-c3-b',answer:'-7/4;0',why:'reflection gives the minimizing point on the x-axis'}
];
const output=path.join(root,'artifacts/shestakov-ch1-runtime');fs.mkdirSync(output,{recursive:true});
const report={passed:false,cases:[],errors:[],screenshots:[],purpose:'New-content browser integration; source and mathematical reviews are separate'};
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH,args:['--no-sandbox']}:{} )});
 try{
  const context=await browser.newContext({viewport:{width:1280,height:1000}}),page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));
  await page.route('https://chapter-one.test/**',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style><div id="textbook-app"></div></html>'}));
  await page.goto('https://chapter-one.test/');for(const script of scripts)await page.addScriptTag({content:script});
  await page.evaluate(bundle=>{window.app=StereoTextbook.createApp(document.getElementById('textbook-app'),bundle)},bundle);
  for(const entry of cases){
   const lesson=bundle.lessons.find(l=>l.id===entry.id);assert(lesson&&lesson.status==='reviewed',entry.id+' must be independently reviewed');
   assert.equal(lesson.answer.mode,entry.manual?'manual':'exact',entry.id+' honest assessment mode');
   await page.evaluate(id=>app.open(id),entry.id);
   assert.equal(await page.locator('[data-step]').count(),0,entry.id+' starts with task only');
   if(entry.manual){
    const draft='Проверочное рассуждение: нужно обосновать все допустимые случаи.';
    await page.locator('#final-answer').fill(draft);
    await page.getByRole('button',{name:'Сохранить рассуждение',exact:true}).click();
    assert.match(await page.locator('[data-final-feedback]').textContent(),/обсудить с учителем/);
    assert.doesNotMatch(await page.locator('[data-final-feedback]').textContent(),/Решено самостоятельно|Решено с помощью/);
    await page.evaluate(id=>app.open(id),entry.id);assert.equal(await page.locator('#final-answer').inputValue(),draft);
   }else{
    await page.locator('#final-answer').fill(entry.answer);
    await page.getByRole('button',{name:'Проверить ответ',exact:true}).click();
    assert.match(await page.locator('[data-final-feedback]').textContent(),/самостоятельно/,entry.id+' source-derived answer accepted');
    await page.evaluate(id=>app.open(id),entry.id);assert.match(await page.locator('[data-final-feedback]').textContent(),/самостоятельно/);
    await page.locator('#final-answer').fill('not-an-answer');
    assert.doesNotMatch(await page.locator('[data-final-feedback]').textContent(),/самостоятельно|Ранее решено/,entry.id+' editing clears stale success');
    await page.getByRole('button',{name:'Проверить ответ',exact:true}).click();
    assert.doesNotMatch(await page.locator('[data-final-feedback]').textContent(),/Решено самостоятельно|Решено с помощью/);
    // The existing engine conservatively records help after an incorrect attempt.
    await page.locator('#final-answer').fill(entry.answer);
    await page.getByRole('button',{name:'Проверить ответ',exact:true}).click();
    assert.match(await page.locator('[data-final-feedback]').textContent(),/помощи/,entry.id+' wrong-answer retry is assisted');
    await page.evaluate(id=>app.open(id),entry.id);assert.match(await page.locator('[data-final-feedback]').textContent(),/с помощью/);
   }
   report.cases.push(entry);
  }
  await page.setViewportSize({width:320,height:1000});
  for(const id of ['sy-1-3-c1-b','sy-1-5-c3-a']){
   await page.evaluate(id=>app.open(id),id);
   await page.locator('[data-main-help]>summary').click();
   await page.getByRole('button',{name:'Разобрать по шагам',exact:true}).click();
   await page.getByRole('button',{name:'Следующий шаг',exact:true}).click();
   assert.equal(await page.locator('[data-step]').count(),2);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),id+' mobile retained explanations fit');
   await page.screenshot({path:path.join(output,id+'-mobile.png'),fullPage:true});report.screenshots.push(id+'-mobile.png');
  }
  assert.deepEqual(report.errors,[]);report.passed=true;
  console.log('SHESTAKOV_CH1_COMPLETION_BROWSER_OK '+report.cases.length+' independent-answer/manual-proof scenarios, 2 mobile retained-step cases');
 }catch(error){report.failure=error.stack;throw error;}
 finally{await browser.close();fs.writeFileSync(path.join(output,'result.json'),JSON.stringify(report,null,2)+'\n');}
})().catch(error=>{console.error(error);process.exitCode=1});

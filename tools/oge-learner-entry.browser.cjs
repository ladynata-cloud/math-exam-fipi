'use strict';
// Fresh public contexts only: never visit real accounts or transmit pupil work.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),routes=require('./oge-learner-routes.json'),out=process.env.OGE_ENTRY_ARTIFACTS||path.join(root,'artifacts/oge-learner-entry');
fs.mkdirSync(out,{recursive:true});
const courseParents={'ege-baza/path/index.html':{href:'/ege-baza/index.html',label:'← Курс ЕГЭ база'}};
assert.deepEqual(routes.courseParents,courseParents,'only the reviewed EGE parent override is allowed');
for(const file of Object.keys(courseParents)){
 assert(routes.pages.includes(file),file+' remains in page coverage');
 assert(!routes.wayfinding.includes(file),file+' uses its existing course header');
}
const report={pages:[],cases:[]};let server,base=process.env.OGE_ENTRY_BASE_URL;
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
(async()=>{let browser;try{
 if(!base){server=http.createServer((req,res)=>{try{const u=new URL(req.url,'http://local');let file=path.resolve(root,'.'+decodeURIComponent(u.pathname));assert(file.startsWith(root+path.sep)||file===root);if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);}catch{res.writeHead(404).end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;}
 browser=await chromium.launch({headless:true});
 for(const width of [320,1280]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  await context.route('**/*',r=>new URL(r.request().url()).origin===new URL(base).origin?r.continue():r.abort());
  const page=await context.newPage();
  for(const file of routes.pages){
   await page.goto(base+'/'+file,{waitUntil:'load'});
   // Legacy alias pages replace their URL after load; inspect the destination.
   if(file==='trainers/oge-task13-inequalities.html'){await page.waitForURL(base+'/trainers/oge13-inequalities-series.html');await page.waitForLoadState('load');}
   if(file==='trainers/oge-1-5-trainers/index.html'){await page.waitForURL(base+'/trainers/oge-1-5-trainers/practice-1-5-map.html');await page.waitForLoadState('load');}
   const parent=courseParents[file],bar=page.locator('nav.oge-wayfinding');
   if(parent){
    const back=page.getByRole('link',{name:parent.label,exact:true}),home=page.getByRole('link',{name:'Главная MathExam',exact:true});
    assert.equal(await back.count(),1,file+' one exact EGE return');
    assert.equal(new URL(await back.getAttribute('href'),page.url()).pathname,parent.href,file+' correct course parent');
    assert.equal(await bar.count(),0,file+' no unrelated OGE bar');
    for(const a of [home,back]){
     assert(await a.isVisible(),file+' visible header return');const b=await a.boundingBox();
     assert(b&&b.height>=44&&b.x>=0&&b.x+b.width<=width+1,file+' usable header touch target');
    }
    await home.focus();assert(await home.evaluate(e=>e===document.activeElement),file+' home keyboard focus');
    await page.keyboard.press('Tab');assert(await back.evaluate(e=>e===document.activeElement),file+' next keyboard course return');
   }
   if(routes.wayfinding.includes(file)){
    assert(await bar.isVisible(),file+' visible return bar');
    const box=await bar.boundingBox();assert(box&&box.x>=0&&box.x+box.width<=width+1,file+' bar fits');
    for(const a of await bar.locator('a').all()){
     assert(await a.isVisible(),file+' return link visible');const b=await a.boundingBox();
     assert(b&&b.height>=44&&b.x>=0&&b.x+b.width<=width+1,file+' usable touch target');
    }
    assert.equal(await bar.getByRole('link',{name:'← Все темы ОГЭ',exact:true}).getAttribute('href'),'/trainers/oge-course/');
    assert.equal(await bar.getByRole('link',{name:'Главная',exact:true}).getAttribute('href'),'/');
    // Some existing trainers autofocus their answer after 50–60 ms. Let that
    // startup complete, then verify actual keyboard travel through both links.
    await page.waitForTimeout(120);
    await bar.locator('a').first().focus();assert(await bar.locator('a').first().evaluate(e=>e===document.activeElement),file+' keyboard focus');
    await page.keyboard.press('Tab');
    assert(await bar.locator('a').nth(1).evaluate(e=>e===document.activeElement),file+' keyboard next return');
   }else if(!parent){
    assert((await page.locator('a[href]').evaluateAll(els=>els.filter(e=>/\/trainers\/oge-course\/(?:index\.html)?$/.test(new URL(e.href).pathname)&&e.getBoundingClientRect().height>0).length))>0,file+' existing course return');
   }
   if(['trainers/task19-trainer.html','trainers/oge-task11-graphs-trainer.html','trainers/oge-1-5-trainers/practice-1-5-tires.html','trainers/oge-basics/percentages/proportion.html','trainers/oge-basics/multiplication-division/course-digit-choice.html','school/index.html','ege-baza/path/index.html','trainers/desyatichnye-drobi-level-1.html'].includes(file)){
    await page.screenshot({path:path.join(out,file.replaceAll('/','_')+'-'+width+'.png')});
    if(parent){
     await page.getByRole('link',{name:parent.label,exact:true}).click();await page.waitForURL(base+parent.href);
     assert(await page.getByRole('heading',{name:'Твой следующий шаг',exact:true}).isVisible());
     assert.equal(await page.locator('.journey-lines>article').count(),7,file+' correct seven-line course destination');
    }else{
     await bar.getByRole('link',{name:'← Все темы ОГЭ',exact:true}).click();await page.waitForURL(base+'/trainers/oge-course/');assert(await page.getByRole('heading',{name:'С чего начать?',exact:true}).isVisible());
    }
   }
   report.pages.push({file,width,status:'PASS'});
  }
  await page.goto(base+'/foundations/');
  await page.getByRole('link',{name:'Тренироваться без кабинета →',exact:true}).click();await page.waitForURL(base+'/trainers/oge-basics/');
  await page.goto(base+'/trainers/oge-course/');
  assert(await page.getByRole('heading',{name:'С чего начать?',exact:true}).isVisible());
  assert.equal(await page.locator('#how-to-learn').getAttribute('open'),null);
  await page.locator('#how-to-learn summary').click();assert(await page.locator('#how-to-learn li').first().isVisible());
  await page.screenshot({path:path.join(out,'course-'+width+'.png'),fullPage:true});
  await page.getByRole('link',{name:'Выбрать навык →',exact:true}).click();await page.waitForURL(base+'/trainers/oge-basics/');
  await page.getByRole('link',{name:'← Все темы ОГЭ',exact:true}).click();await page.waitForURL(base+'/trainers/oge-course/');
  await page.getByRole('link',{name:'Попробовать №6 →',exact:true}).click();await page.waitForURL(base+'/trainers/oge-task6-fractions.html');
  await page.getByRole('link',{name:'← Все темы ОГЭ',exact:true}).click();
  await page.getByRole('link',{name:'К развёрнутым решениям →',exact:true}).click();await page.waitForURL(base+'/trainers/oge-course/#part2');
  await page.getByRole('link',{name:'Проверить себя: интерактивный вариант',exact:true}).click();await page.waitForURL(base+'/trainers/oge-2027-analogue-1.html');
  report.cases.push({width,case:'three learner starts, instructions and complete interactive variant',status:'PASS'});
  // Embedded exercise must leave return control to its board/cabinet host.
  await page.goto(base+'/trainers/task19-trainer.html?board=1');assert(!await page.locator('nav.oge-wayfinding').isVisible());
  await page.goto(base+'/trainers/task19-trainer.html');await page.evaluate(()=>{const frame=document.createElement('iframe');frame.src='/trainers/oge-task6-fractions.html';document.body.append(frame);});
  await page.frameLocator('iframe').locator('nav.oge-wayfinding[hidden]').waitFor({state:'attached'});
  report.cases.push({width,case:'board and embedded navigation preserved',status:'PASS'});await context.close();
 }
 const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:320,height:900}}),page=await nojs.newPage();
 for(const file of routes.wayfinding){await page.goto(base+'/'+file);assert(await page.getByRole('link',{name:'← Все темы ОГЭ',exact:true}).isVisible(),file+' no-JS return');}
 await page.getByRole('link',{name:'← Все темы ОГЭ',exact:true}).click();await page.waitForURL(base+'/trainers/oge-course/');
 for(const [file,parent] of Object.entries(courseParents)){
  await page.goto(base+'/'+file);const back=page.getByRole('link',{name:parent.label,exact:true});
  assert(await back.isVisible(),file+' no-JS course return');assert(await page.getByRole('link',{name:'Главная MathExam',exact:true}).isVisible(),file+' no-JS home return');
  await back.click();await page.waitForURL(base+parent.href);
 }
 report.cases.push({case:'static OGE and reviewed EGE returns without JavaScript',status:'PASS'});await nojs.close();
 console.log('OGE_LEARNER_ENTRY_RETURN_OK',JSON.stringify({renderedPages:report.pages.length,noJS:routes.wayfinding.length+Object.keys(courseParents).length,cases:report.cases}));
}finally{fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));if(browser)await browser.close();if(server)await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1;});

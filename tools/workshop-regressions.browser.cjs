const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright');
const M=require('../school/math.js');
const base=process.env.WORKSHOP_URL||'file://'+path.resolve(__dirname,'../school/index.html');
function answer(target){
 if(target.answerFormat==='prime-factors')return target.answer.join(' * ');
 if(target.answerFormat==='decimal'){const n=typeof target.answer==='object'?target.answer.n/target.answer.d:target.answer;return Number.isInteger(n)?n+',0':String(n).replace('.',',');}
 return typeof target.answer==='object'?M.fmt(target.answer):String(target.answer);
}
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const errors=[];
 async function newPage(){const context=await browser.newContext();const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));return page;}
 const go=async(page,route)=>{await page.goto(base+'#'+route);await page.locator('h1').waitFor();};
 const task=page=>page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('mathexam.workshop.v1'));return WorkshopMath.generate(s.last.skill,s.last.seed);});
 const submit=async(page,value)=>{await page.locator('#answer').fill(value);await page.locator('button[type=submit]').click();};
 const solve=async page=>{await submit(page,answer(await task(page)));assert.equal(await page.locator('.feedback.error').count(),0);await page.locator('[data-cmd=next]').click();};
 const slider=async(page,key,value)=>{await page.locator('[data-param='+key+']').evaluate((el,v)=>{el.value=String(v);el.dispatchEvent(new Event('input',{bubbles:true}));},value);};
 let page=await newPage();
 await go(page,'lesson/fraction');
 await slider(page,'n',1);
 const sizes=[];
 for(const denominator of [4,8]){
  await slider(page,'d',denominator);
  sizes.push(await page.locator('#model svg').evaluate(el=>{const cells=[...el.querySelectorAll('rect')],first=cells[0],last=cells.at(-1);return {whole:+last.getAttribute('x') + +last.getAttribute('width') - +first.getAttribute('x'),part:+first.getAttribute('width'),height:+first.getAttribute('height')};}));
 }
 assert.equal(sizes[0].whole,sizes[1].whole);assert.equal(sizes[0].height,sizes[1].height);assert(sizes[1].part<sizes[0].part);
 await page.locator('[data-cell="2"]').click();assert.equal(await page.locator('[data-param=n]').inputValue(),'3');assert.equal(await page.locator('[data-param=n] + output').textContent(),'3');
 await go(page,'lesson/coordinate');
 await page.locator('#model svg').scrollIntoViewIfNeeded();
 const box=await page.locator('#model svg').boundingBox();await page.mouse.click(box.x+box.width*(348/560),box.y+box.height*(67/290));
 assert.equal(await page.locator('[data-param=x]').inputValue(),'2');assert.equal(await page.locator('[data-param=y]').inputValue(),'3');
 console.log('Fraction unit size and clicked fraction/coordinate control synchronization: PASS');

 for(const id of ['decimal','mixed','reduce']){
  await go(page,'lesson/'+id);const t=await task(page);
  for(const step of t.steps){await submit(page,answer(step));assert.equal(await page.locator('.feedback.error').count(),0,id+' intermediate step');await page.locator('[data-cmd=next]').click();}
  const unchanged=id==='decimal'?t.prompt.match(/\d+\/100/)[0]:id==='mixed'?t.prompt.match(/\d+ \d+\/\d+/)[0]:t.prompt.match(/\d+\/\d+/)[0];
  await submit(page,unchanged);assert.equal(await page.locator('.feedback.error').count(),1,id+' rejects unchanged representation');
  await page.locator('[data-cmd=hint]').click();await page.locator('[data-cmd=show-step]').click();assert(M.accepts(await page.locator('#help > p.helper b').innerText(),t),id+' answer hint uses requested form');
  await submit(page,answer(t));assert.equal(await page.locator('.feedback.error').count(),0,id+' accepts requested representation');
  await page.locator('[data-cmd=mode][data-value=check]').click();const check=await task(page);
  const wrong=id==='decimal'?check.prompt.match(/\d+\/100/)[0]:id==='mixed'?check.prompt.match(/\d+ \d+\/\d+/)[0]:check.prompt.match(/\d+\/\d+/)[0];
  await submit(page,wrong);
  const event=await page.evaluate(()=>JSON.parse(localStorage.getItem('mathexam.workshop.v1')).events.at(-1));assert.equal(event.correct,false);assert.equal(event.independent,false);
 }
 console.log('Target-step answer formats reject unchanged forms without rejecting numeric intermediate answers: PASS');

 page=await newPage();await go(page,'lesson/factorization');const first=await task(page);
 for(const step of first.steps){await submit(page,answer(step));assert.equal(await page.locator('.feedback.error').count(),0);await page.locator('[data-cmd=next]').click();}
 await page.locator('[data-cmd=hint]').click();await page.locator('[data-cmd=show-step]').click();assert(M.accepts(await page.locator('#help > p.helper b').innerText(),first),'factorization hint uses product notation');
 await solve(page);for(let i=0;i<4;i++)await solve(page);
 const previouslySeen=await page.evaluate(()=>JSON.parse(localStorage.getItem('mathexam.workshop.v1')).seen);
 await page.locator('[data-cmd=mode][data-value=check]').click();for(let i=0;i<3;i++)await solve(page);
 let progress=await page.evaluate(()=>JSON.parse(localStorage.getItem('mathexam.workshop.v1')));
 const checks=progress.events.filter(e=>e.mode==='check');assert.equal(checks.length,3);assert(checks.every(e=>e.independent&&!previouslySeen.includes(e.fingerprint)));assert(progress.skills.factorization.checks.length>=2);
 await page.evaluate(()=>{const now=Date.now()+86400001;Date.now=()=>now;});await page.locator('[data-nav=review]').click();await page.locator('[data-cmd=review][data-value=factorization]').click();for(let i=0;i<3;i++)await solve(page);
 progress=await page.evaluate(()=>JSON.parse(localStorage.getItem('mathexam.workshop.v1')));assert.equal(progress.skills.factorization.reviews,1);
 console.log('Guided factorization, four practices, three fresh checks and delayed retrieval remain attainable: PASS');

 page=await newPage();await go(page,'home');await page.locator('[data-cmd=diagnostic]').click();
 for(let i=0;i<6;i++)await page.locator('[data-cmd=skip]').click();await submit(page,'-999');await page.locator('[data-cmd=skip]').click();await page.locator('[data-cmd=skip]').click();
 const titles=await page.locator('.skill-row h3').allTextContents();assert.equal(titles.length,8);assert.equal(new Set(titles).size,8);assert(titles.includes('Цифра, разряд и число'));assert(titles.includes('Площадь: считаем квадраты'));
 await page.reload();assert.equal(await page.locator('.skill-row').count(),0);assert(await page.locator('main').textContent().then(s=>s.includes('Сохранённые успехи и ошибки остаются в прогрессе')));
 console.log('Diagnostic retries retain all eight unique topic outcomes; reload does not invent an outcome set: PASS');

 page=await newPage();await go(page,'teacher');await page.locator('#group-name').fill('Regression group');await page.locator('[data-cmd=new-group]').click();
 const blank=await page.evaluate(()=>WorkshopState.blank());
 const report={schema:'mathexam-report',version:1,alias:'Learner',assignmentId:'a-1',createdAt:1000,progress:blank};
 async function importReport(createdAt){await page.locator('[data-cmd=import-report]').click();await page.locator('#file-input').setInputFiles({name:'report.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({...report,createdAt}))});}
 await importReport(1000);await page.locator('td').filter({hasText:'Learner'}).waitFor();await importReport(900);await page.locator('#notice').filter({hasText:'более новый отчёт'}).waitFor();
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('mathexam.workshop.teacher.v1')).reports[0].data.createdAt),1000);
 await importReport(1100);await page.waitForFunction(()=>JSON.parse(localStorage.getItem('mathexam.workshop.teacher.v1')).reports[0].data.createdAt===1100);
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('mathexam.workshop.teacher.v1')).reports.length),1);
 console.log('Older reports preserve newer evidence and newer reports replace the same learner/assignment once: PASS');
 assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});

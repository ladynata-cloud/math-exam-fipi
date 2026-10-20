'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const cases=[[16,'circle'],[17,'quadrilaterals'],[18,'grid'],[23,'geometry-calculations'],[24,'proofs'],[25,'geometry']];
(async()=>{
 const server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!p.startsWith(root+path.sep)||!fs.existsSync(p)){res.writeHead(404);res.end();return;}res.setHeader('content-type',p.endsWith('.html')?'text/html; charset=utf-8':'application/octet-stream');fs.createReadStream(p).pipe(res);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true});fs.mkdirSync(path.join(root,'artifacts/oge-geometry-minimal'),{recursive:true});
 try{for(const width of [320,360,1280])for(const [n,name]of cases){
  const page=await browser.newPage({viewport:{width,height:920}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+`/trainers/oge-task${n}-${name}.html`);await page.locator('#courseHintToggle').waitFor();
  assert.equal(await page.locator('#courseSettings').evaluate(e=>e.open),false);
  assert.equal(await page.locator('#courseHintPanel').isVisible(),false);
  await page.locator('#courseHintToggle').click();assert.equal(await page.locator('#courseHintPanel').isVisible(),true);
  await page.locator('#courseHintToggle').click();assert.equal(await page.locator('#courseHintPanel').isVisible(),false);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);assert.equal(overflow,false,`№${n} overflow at ${width}`);
  await page.screenshot({path:path.join(root,`artifacts/oge-geometry-minimal/task${n}-${width}.png`),fullPage:true});
  if(n===16||n===17||n===18){
   const ans=await page.evaluate(n=>window.eval(n===16?'trTask.ans':n===17?'CUR.ans':'TR.task.ans'),n);
   await page.locator(n===18?'#ansIn':'#ans').fill(String(ans));await page.locator(n===18?'#ansIn':'#ans').press('Enter');
   await page.locator(n===16?'#next':n===17?'#nxt':'#nextBtn').click();
  }else if(n===23){
   await page.evaluate(()=>window.eval("buildTask(document.querySelector('.train-host'),{sub:'rhombH',p:{DH:3,CH:2},exp:4},'train',function(){setTab('train');});"));
   await page.locator('.train-host .ans-inp').fill('4');await page.locator('.train-host .ans-inp').press('Enter');await page.getByRole('button',{name:'Следующая задача →',exact:true}).click();
  }else if(n===24){
   const count=await page.evaluate(()=>window.eval('curTask().steps.length'));
   for(let i=0;i<count;i++)await page.locator(`button[onclick="pickCard({type:'s',i:${i}})"]`).click();
   await page.locator('button[onclick="nextTask()"]').click();
  }else{
   const values=await page.evaluate(()=>window.eval('trS.b.ans.map(a=>a.v)'));
   for(let i=0;i<values.length;i++)await page.locator(`[data-ai="${i}"]`).fill(String(values[i]));
   await page.locator('[data-act="tr-check"]').click();await page.locator('[data-act="tr-next"]').click();
  }
  assert.equal(await page.locator('#courseHintPanel').isVisible(),false,`№${n}: next closes help`);assert.deepEqual(errors,[],`№${n} page errors`);
  await page.close();
 }
 console.log('OGE_GEOMETRY_MINIMAL_BROWSER_OK: 18 mobile/desktop task-help-answer-next journeys');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});

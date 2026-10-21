'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const cases=[[16,'circle'],[17,'quadrilaterals'],[18,'grid'],[23,'geometry-calculations'],[24,'proofs'],[25,'geometry']];
async function assertTask25Mobile(page,width){
 const layout=await page.locator('#panel-train').evaluate(main=>{
  const box=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width};};
  const fig=main.querySelector('.fig'),task=main.querySelector('.task'),cond=task.querySelector('.cond');
  const inputs=[...task.querySelectorAll(':scope > .ansrow input[data-ai]')];
  const clipped=[];
  for(const e of [fig,cond,...inputs,main.querySelector('#courseHintToggle')]){
   const r=e.getBoundingClientRect();
   for(let parent=e.parentElement;parent;parent=parent.parentElement){
    const style=getComputedStyle(parent),p=parent.getBoundingClientRect();
    if(['hidden','clip','auto','scroll'].includes(style.overflowX)&&(r.left<p.left-1||r.right>p.right+1))clipped.push(e.tagName);
   }
  }
  return {fig:box(fig),svg:box(fig.querySelector('svg')),task:box(task),condition:box(cond),inputs:inputs.map(box),textOverflow:cond.scrollWidth>cond.clientWidth+1,clipped};
 });
 assert.ok(layout.fig.width>=width-40,`№25: full-width drawing at ${width}`);
 assert.ok(layout.svg.width>=width-60,`№25: readable diagram at ${width}`);
 assert.ok(layout.condition.width>=width-70,`№25: readable condition at ${width}`);
 assert.ok(layout.task.top>=layout.fig.bottom+12,`№25: condition follows diagram in one column at ${width}`);
 assert.ok(layout.inputs.length>0);
 for(const input of layout.inputs){
  assert.ok(input.width>=layout.condition.width-2,`№25: full-width input at ${width}`);
  assert.ok(input.left>=layout.task.left&&input.right<=layout.task.right,`№25: input fits task at ${width}`);
 }
 assert.equal(layout.textOverflow,false,`№25: no clipped condition text at ${width}`);
 assert.deepEqual(layout.clipped,[],`№25: no hidden horizontal clipping at ${width}`);
}
(async()=>{
 const server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!p.startsWith(root+path.sep)||!fs.existsSync(p)){res.writeHead(404);res.end();return;}res.setHeader('content-type',({'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml'})[path.extname(p)]||'application/octet-stream');fs.createReadStream(p).pipe(res);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true});fs.mkdirSync(path.join(root,'artifacts/oge-geometry-minimal'),{recursive:true});
 try{for(const width of [320,360,1280])for(const [n,name]of cases){
  const page=await browser.newPage({viewport:{width,height:920}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+`/trainers/oge-task${n}-${name}.html`);await page.locator('#courseHintToggle').waitFor();
  assert.equal(await page.locator('h1').evaluate(e=>getComputedStyle(e).color),'rgb(32, 40, 32)',`№${n}: readable heading at ${width}`);
  if(n===24){
   await page.evaluate(()=>window.eval("startStudy('t1')"));
   const fractions=page.locator('.pool .proof-fraction');assert.equal(await fractions.count(),4);
   assert.ok(await fractions.evaluateAll(nodes=>nodes.every(f=>{const top=f.children[0],bottom=f.children[1];return parseFloat(getComputedStyle(top).borderBottomWidth)>0&&bottom.getBoundingClientRect().top>=top.getBoundingClientRect().bottom-1;})),'numerator and denominator have an actual horizontal bar');
  }
  assert.equal(await page.locator('#courseSettings').evaluate(e=>e.open),false);
  assert.equal(await page.locator('#courseHintPanel').isVisible(),false);
  await page.locator('#courseHintToggle').click();assert.equal(await page.locator('#courseHintPanel').isVisible(),true);
  await page.locator('#courseHintToggle').click();assert.equal(await page.locator('#courseHintPanel').isVisible(),false);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);assert.equal(overflow,false,`№${n} overflow at ${width}`);
  if(n===25&&width<600)await assertTask25Mobile(page,width);
  await page.screenshot({path:path.join(root,`artifacts/oge-geometry-minimal/task${n}-${width}.png`),fullPage:true});
  if(n===25&&width<600){
   const ids=await page.evaluate(()=>window.eval('TYPES.map(t=>t.id)'));
   for(const id of ids){
    await page.evaluate(id=>window.newTrainTask(id),id);
    await assertTask25Mobile(page,width);
    const answer=page.locator('#panel-train input[data-ai="0"]');await answer.fill('123');
    await page.locator('#courseHintToggle').click();await assertTask25Mobile(page,width);
    assert.equal(await answer.inputValue(),'123');await page.locator('#courseHintToggle').click();
   }
  }
  if(n===16||n===17||n===18){
   const ans=await page.evaluate(n=>window.eval(n===16?'trTask.ans':n===17?'CUR.ans':'TR.task.ans'),n);
   await page.locator(n===18?'#ansIn':'#ans').fill(String(ans));await page.locator(n===18?'#ansIn':'#ans').press('Enter');
   await page.locator(n===16?'#next':n===17?'#nxt':'#nextBtn').click();
  }else if(n===23){
   await page.evaluate(()=>window.eval("buildTask(document.querySelector('.train-host'),{sub:'rhombH',p:{DH:3,CH:2},exp:4},'train',function(){setTab('train');});"));
   await page.locator('.train-host .ans-inp').fill('4');await page.locator('.train-host .ans-inp').press('Enter');await page.getByRole('button',{name:'Следующая задача →',exact:true}).click();
  }else if(n===24){
   const solveProof=async()=>{const count=await page.evaluate(()=>window.eval('curTask().steps.length'));for(let i=0;i<count;i++)await page.locator(`button[onclick="pickCard({type:'s',i:${i}})"]`).click();};
   await solveProof();assert.equal(await page.evaluate(()=>window.eval('ST.solvedNow')),true);
   // A single-example study has no next button. Enter a real multi-task queue through the UI.
   assert.equal(await page.locator('button[onclick="nextTask()"]').count(),0);
   await page.locator('#courseSettings > summary').click();
   await page.locator('#tabs').getByRole('button',{name:'Тренировка',exact:true}).click();
   await page.locator(`.mcard[onclick="startTrain('all')"]`).click();
   await page.locator('#courseSettings > summary').click();
   assert.ok(await page.evaluate(()=>window.eval('ST.queue.length>1')));
   const previousId=await page.evaluate(()=>window.eval('curTask().id'));
   await page.locator('#courseHintToggle').click();assert.equal(await page.locator('#courseHintPanel').isVisible(),true);
   await solveProof();await page.locator('button[onclick="nextTask()"]').click();
   assert.equal(await page.evaluate(()=>window.eval('ST.qi')),1);
   assert.notEqual(await page.evaluate(()=>window.eval('curTask().id')),previousId);
  }else{
   const values=await page.evaluate(()=>window.eval('trS.b.ans.map(a=>a.v)'));
   for(let i=0;i<values.length;i++)await page.locator(`[data-ai="${i}"]`).fill(String(values[i]));
   await page.locator('[data-act="tr-check"]').click();await page.locator('[data-act="tr-next"]').click();
  }
  assert.equal(await page.locator('#courseHintPanel').isVisible(),false,`№${n}: next closes help`);assert.deepEqual(errors,[],`№${n} page errors`);
  await page.close();
 }
 console.log('OGE_GEOMETRY_MINIMAL_BROWSER_OK: 18 task-help-answer-next journeys; 32 task25 mobile layout checks with help closed/open');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});

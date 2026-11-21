'use strict';

const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve(__dirname,'../..');
const expected = [
 ['atanasyan2024-theory-002-a1','atanasyan2024-main-004-a'],
 ['theory-006','ex-main-0018-a'], ['theory-007','theory-009','ex-main-0044-b'],
 ['theory-010','ex-main-0063-a'], ['theory-012','theory-014-example-3a','ex-main-0073'],
 ['theory-017','ex-main-0121'], ['theory-019','theory-020','theory-021','ex-main-0164'],
 ['theory-022','ex-main-0167','theory-023','ex-main-0171'],
 ['theory-024','theory-025','theory-026','ex-main-0191']
];
const mistakes = [
 ['ex-main-0044-b','135°',/угол AOB/,'45'],
 ['ex-main-0121','5 см',/медиану к гипотенузе/,'13 см'],
 ['ex-main-0121','12 см',/перпендикуляра CK/,'13 см'],
 ['ex-main-0164','0,5',/отношение длин/,'60'],
 ['ex-main-0171','30°',/угол катета/,'45°'],
 ['ex-main-0174','90°',/двугранного угла ABCD/,'60°']
];
const suffix = id => 'mathExamTextbook.v1:atanasyan-2024-10-11:'+id+':';
const record = (p,id) => p.evaluate(prefix=>{
 const key=Object.keys(localStorage).find(k=>k.startsWith(prefix));
 return key ? JSON.parse(localStorage.getItem(key)) : null;
},suffix(id));
const submit = async (p,value)=>{
 await p.locator('#final-answer').fill(value);
 await p.locator('[data-final-form] button[type=submit]').click();
};
const readPage = async (req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const file=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
 if(!file.startsWith(root+path.sep)){res.writeHead(404).end();return;}
 const types={'.css':'text/css','.js':'application/javascript','.json':'application/json','.html':'text/html; charset=utf-8'};
 try{const body=await fs.readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'}).end(body);}
 catch{res.writeHead(404).end();}
};
async function routeJourney(p,base,width){
 await p.goto(width===320?base+'?route=early':base);
 const route=p.locator('[data-early-route]');
 await route.waitFor();
 if(width===320)assert(await route.evaluate(node=>node.open));
 else await route.locator(':scope > summary').click();
 const details=route.locator(':scope > details');
 assert.equal(await details.count(),9);
 assert.equal(await route.locator('[data-route-lesson]').count(),26);
 assert.equal(new Set(expected.flat()).size,26);
 for(const [i,ids] of expected.entries()){
  const group=details.nth(i);await group.locator(':scope > summary').click();
  assert.deepEqual(await group.locator('a').evaluateAll(links=>links.map(a=>a.hash.slice(1))),ids);
  for(const id of ids){
   const link=group.locator('[data-route-lesson="'+id+'"]');
   await link.click();
   await p.locator('[data-main-model] svg').waitFor();
   assert.equal(new URL(p.url()).hash,'#'+id);
   assert(!(await record(p,id))?.checked,'opening must not record mastery');
   assert.equal(await p.locator('[data-step]').count(),0);
   await p.getByRole('button',{name:'← Все материалы курса'}).click();
   assert(await link.evaluate(a=>a===document.activeElement));
   assert.equal(await link.evaluate(a=>a.nextElementSibling.textContent),'');
  }
  await group.locator(':scope > summary').click();
 }
 assert((await p.evaluate(()=>document.documentElement.scrollWidth))<=width+1);
}
async function diagnose(context,base,example){
 const [id,wrong,reason,correct]=example;
 const p=await context.newPage();p.setDefaultTimeout(30000);
 await p.goto(base+'?exercise='+id+'#'+id);
 const key=record(p,id);
 assert(!(await key)?.checked);
 await submit(p,wrong);
 const feedback=p.locator('[data-final-feedback]');
 assert.equal(await feedback.getAttribute('data-answer-status'),'wrong');
 assert.match(await feedback.innerText(),reason);
 const original=await record(p,id);
 assert.equal(original.assisted,false);assert.equal(original.checked,false);
 assert.equal(original.firstAttempt.input,wrong);assert.equal(original.firstAttempt.status,'wrong');
 await p.reload();await p.locator('#final-answer').waitFor();
 assert.equal(await p.locator('#final-answer').inputValue(),wrong);
 await submit(p,correct);assert.equal(await feedback.getAttribute('data-answer-status'),'correct');
 const updated=await record(p,id);
 assert.equal(updated.checkedWith,'corrected');assert.equal(updated.assisted,false);
 assert.deepEqual(updated.firstAttempt,original.firstAttempt);
 await p.reload();await p.locator('#final-answer').waitFor();
 assert.equal((await record(p,id)).checkedWith,'corrected');
 if(expected.flat().includes(id)){
  await p.getByRole('button',{name:'← Все материалы курса'}).click();
  assert.match(await p.locator('[data-route-lesson="'+id+'"]').evaluate(a=>a.nextElementSibling.textContent),/Исправлено самостоятельно/);
 }
 await p.close();
}
(async()=>{
 let server,browser;
 try{
  let base=process.env.EARLY_ROUTE_LIVE_URL;
  if(!base){server=http.createServer(readPage);await new Promise(ok=>server.listen(0,'127.0.0.1',ok));base='http://127.0.0.1:'+server.address().port+'/stereo-course/textbook/';}
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,headless:true,args:['--disable-dev-shm-usage']});
  for(const width of [320,1280]){
   const ctx=await browser.newContext({viewport:{width,height:900}});
   try{const p=await ctx.newPage();await routeJourney(p,base,width);}
   finally{await ctx.close();}
  }
  for(const example of mistakes){
   const ctx=await browser.newContext({viewport:{width:390,height:900}});
   try{await diagnose(ctx,base,example);}finally{await ctx.close();}
  }
  const ctx=await browser.newContext({viewport:{width:390,height:900}});
  try{
   const p=await ctx.newPage(),id='ex-main-0121';await p.goto(base+'?exercise='+id+'#'+id);
   await submit(p,'99');
   assert.doesNotMatch(await p.locator('[data-final-feedback]').innerText(),/медиану к гипотенузе|перпендикуляра CK/);
   await p.locator('[data-main-help]>summary').click();await submit(p,'13');
   assert.equal((await record(p,id)).checkedWith,'assisted');
   await p.getByRole('button',{name:'← Все материалы курса'}).click();
   const badge=p.locator('[data-route-lesson="'+id+'"] + span');
   assert.match(await badge.textContent(),/Решено с помощью/);
   const key=await p.evaluate(prefix=>Object.keys(localStorage).find(k=>k.startsWith(prefix)),suffix(id));
   // Older records can confirm a checked answer without recording how it was achieved.
   await p.evaluate(key=>localStorage.setItem(key,JSON.stringify({checked:true})),key);
   await p.reload();await p.locator('[data-early-route]').waitFor();
   assert.match(await badge.textContent(),/самостоятельность не указана/);
   await p.goto(base+'?exercise=ex-main-0164#ex-main-0164');
   await submit(p,'60');assert.equal((await record(p,'ex-main-0164')).checkedWith,'independent');
  }finally{await ctx.close();}
  console.log('ATANASYAN_EARLY_ROUTE_OK: 9 topics, all 26 real entries and focus returns at two widths, 6 targeted mistaken inputs, self-correction and explicit help separated after reload');
 }finally{await browser?.close();if(server){server.closeAllConnections();await new Promise(ok=>server.close(ok));}}
})().catch(e=>{console.error(e);process.exitCode=1;});

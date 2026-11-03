'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
let SITE=process.env.GEOMETRY7_SITE;
const ROOT=path.resolve(__dirname,'..');
const server=require('node:http').createServer((req,res)=>{try{let file=path.resolve(ROOT,'.'+new URL(req.url,'http://local').pathname);if(!file.startsWith(ROOT+path.sep))throw Error();if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'};res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch(_){res.writeHead(404).end();}});
const OUT=process.env.GEOMETRY7_OUTPUT||'/tmp/geometry7-board-evidence';fs.mkdirSync(OUT,{recursive:true});
const catalog=require('../geometry-course/board/catalog.json');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
// Canvas transforms on different viewport widths differ only at IEEE-754 rounding.
const geometry=x=>typeof x==='number'?Math.round(x*1e8)/1e8:Array.isArray(x)?x.map(geometry):x&&typeof x==='object'?Object.fromEntries(Object.entries(x).map(([k,v])=>[k,geometry(v)])):x;
async function ready(page){await page.waitForFunction(()=>document.documentElement.dataset.geometry7Board==='ready',{},{timeout:20000});return page.frames().find(f=>f.url().includes('/geometry-course/trainers/'));}
async function snapshot(page){return page.evaluate(()=>Geometry7Practice.getState());}
async function restore(page,state){await page.evaluate(s=>Geometry7Practice.applyState(s),state);return ready(page);}
(async()=>{
 if(!SITE){await new Promise(r=>server.listen(0,'127.0.0.1',r));SITE='http://127.0.0.1:'+server.address().port;}
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--disable-dev-shm-usage']});
 const contexts=await Promise.all([browser.newContext({viewport:{width:800,height:1000}}),browser.newContext({viewport:{width:640,height:1000}})]);
 const pages=await Promise.all(contexts.map(c=>c.newPage()));let failures=[],passes=[];
 for(const page of pages){page.on('pageerror',e=>failures.push(e.message));await page.addInitScript(()=>{localStorage.setItem('mathExamCourseProgress.v1','{"private":"unchanged"}');});}
 try{

  async function open(id){await pages[0].goto(SITE+'/trainers/geometry7-practice.html?activity='+id);return ready(pages[0]);}
  async function mirror(){await wait(100);const state=await snapshot(pages[0]);if(!pages[1].url().includes('geometry7-practice')){await pages[1].goto(SITE+'/trainers/geometry7-practice.html');await ready(pages[1]);}const peer=await restore(pages[1],state);return {peer,state};}
  async function sameBody(f,peer,label){await wait(500);const a=await f.locator('body').innerText(),b=await peer.locator('body').innerText();assert.equal(b,a,label);passes.push(label);console.log('PASS',label);}
  for(const [id,order]of [['ch2-p1-t3-proof-sas',['overlay','B','C','BC','fin']],['ch2-p3-t2-proof-asa',['overlay','rayA','rayB','cross','fin']]]){
   const f=await open(id);
   const trap=await f.evaluate(()=>CARDS.find(c=>c.distract).txt);await f.getByRole('button',{name:trap,exact:true}).click();await wait(500);
   for(const key of order){const label=await f.evaluate(key=>CARDS.find(c=>c.id===key).txt,key);await f.getByRole('button',{name:label,exact:true}).click();await wait(key==='overlay'?1400:70);const {peer}=await mirror();await sameBody(f,peer,id+':'+key);}
  }
  let f=await open('ch2-constr-angle-bisector');
  async function position(f,p){const box=await f.locator('#cv').boundingBox();return {x:box.x+p.x/640*box.width,y:box.y+p.y/460*box.height};}
  async function drag(from,to){await f.locator('#cv').scrollIntoViewIfNeeded();const a=await position(f,from),b=await position(f,to);await pages[0].mouse.move(a.x,a.y);await pages[0].mouse.down();await pages[0].mouse.move(b.x,b.y,{steps:12});await pages[0].mouse.up();}
  async function clickPoint(name){await f.locator('#cv').scrollIntoViewIfNeeded();const p=await f.evaluate(name=>{const p=P.find(x=>x.name===name);return {x:p.x,y:p.y};},name),a=await position(f,p);await pages[0].mouse.click(a.x,a.y);}
  await drag({x:150,y:390},{x:330,y:390});assert.equal(await f.evaluate(()=>step),1);
  let points=await f.evaluate(()=>P.map(p=>({name:p.name,x:p.x,y:p.y})));const A=points.find(p=>p.name==='A');await drag(A,{x:A.x+140,y:A.y});assert.equal(await f.evaluate(()=>step),2);
  await clickPoint('B');assert.equal(await f.evaluate(()=>step),3);
  let result=await mirror();assert.deepEqual(geometry(await result.peer.evaluate(()=>JSON.parse(takeSnap()))),geometry(await f.evaluate(()=>JSON.parse(takeSnap()))));passes.push('compass arcs and intersections');
  await clickPoint('O');await clickPoint('C');assert.equal(await f.evaluate(()=>phase),'proof');
  await f.locator('#proofBtn').click();await f.locator('#proofBtn').click();assert.equal(await f.evaluate(()=>phase),'done');
  result=await mirror();await sameBody(f,result.peer,'angle bisector completed proof');assert.deepEqual(geometry(await result.peer.evaluate(()=>JSON.parse(takeSnap()))),geometry(await f.evaluate(()=>JSON.parse(takeSnap()))));
  const pt=await f.evaluate(()=>Object.fromEntries(P.map(p=>[p.name,{x:p.x,y:p.y}])));
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);assert(Math.abs(dist(pt.O,pt.A)-dist(pt.O,pt.B))<1e-6);assert(Math.abs(dist(pt.C,pt.A)-dist(pt.C,pt.B))<1e-6);
  await pages[1].reload();await ready(pages[1]);const late=await restore(pages[1],result.state);assert.deepEqual(geometry(await late.evaluate(()=>JSON.parse(takeSnap()))),geometry(await f.evaluate(()=>JSON.parse(takeSnap()))));passes.push('construction reload');
  await pages[1].screenshot({path:path.join(OUT,'bisector-complete.png'),fullPage:true});

  async function arcFrom(name,r){const p=await f.evaluate(n=>{const p=P.find(x=>x.name===n);return{x:p.x,y:p.y};},name);await drag(p,{x:p.x+r,y:p.y});}
  async function constructionCheck(label){const result=await mirror();assert.deepEqual(geometry(await result.peer.evaluate(()=>JSON.parse(takeSnap()))),geometry(await f.evaluate(()=>JSON.parse(takeSnap()))),label);passes.push(label);console.log('PASS',label);}
  f=await open('ch2-constr-perp-bisector');await arcFrom('A',190);await clickPoint('B');await clickPoint('P');await clickPoint('Q');assert.equal(await f.evaluate(()=>phase),'proof');await f.locator('#proofBtn').click();await f.locator('#proofBtn').click();await constructionCheck('perpendicular bisector');
  assert(await f.evaluate(()=>{const p=Object.fromEntries(P.map(x=>[x.name,x]));return Math.abs(p.P.x-p.Q.x)<1e-8&&Math.abs(p.P.x-(p.A.x+p.B.x)/2)<1e-8;}));
  f=await open('ch2-constr-copy-angle');await arcFrom('O',130);await clickPoint('O2');await clickPoint('A');await clickPoint('B');await clickPoint('C');await clickPoint('O2');await clickPoint('D');assert.equal(await f.evaluate(()=>phase),'proof');await f.locator('#proofBtn').click();await f.locator('#proofBtn').click();await constructionCheck('copy angle');assert(await f.evaluate(()=>copyAngleOK()));
  f=await open('ch2-constr-perpendicular-point');
  for(const roundNumber of [1,2]){await arcFrom('P',roundNumber===1?200:130);await arcFrom('A',180);await clickPoint('B');await clickPoint('P');await clickPoint('Q');assert.equal(await f.evaluate(()=>phase),'proof');assert(await f.evaluate(()=>perpOK()));await constructionCheck('perpendicular through point round '+roundNumber);await f.locator('#proofBtn').click();if(roundNumber===1)await f.locator('#proofBtn').click();}
  f=await open('ch2-p4-t2-proof-sss');await drag({x:345,y:140},{x:235,y:140});await drag({x:235,y:140},{x:560,y:140});assert(await f.evaluate(()=>Object.values(casesSeen).every(Boolean)));await f.locator('#nextBtn').click();
  for(const key of ['apply','draw','iso1','iso2','base','sum','sas']){await f.locator('[data-id="'+key+'"]').click();const {peer}=await mirror();await sameBody(f,peer,'SSS '+key);}
  for(const key of ['side','outside']){await f.locator('#nextBtn').click();await f.locator('#pool button').first().click();const {peer}=await mirror();await sameBody(f,peer,'SSS '+key+' case');}
  for(const id of ['ch3-p1-t5-two-more-signs','ch3-p1-t7-find-equal','ch3-p2-t4-property-alt-angles','ch3-p2-t5-properties-2-3','ch3-p2-t6-direct-converse']){
   f=await open(id);let steps=0;
   for(let count=0;count<140;count++){
    const next=f.locator('#nextBtn');
    if(await next.isVisible()){const isLast=await f.evaluate(()=>si===STEPS.length-1);await next.click();steps++;if(isLast)break;continue;}
    const target=await f.evaluate(()=>{const s=STEPS[si];let text=s.q?.find(x=>x.ok)?.t;if(!text&&s.cards){const c=s.cards.find(c=>!c.trap&&!asmDone.includes(c.id)&&(c.need||[]).every(id=>asmDone.includes(id)));text=c?.txt;}if(!text)return null;const d=document.createElement('div');d.innerHTML=text;return d.textContent;});
    assert(target,id+' unsupported step '+await f.evaluate(()=>si));await f.getByRole('button',{name:target,exact:true}).click();
    const {peer}=await mirror();await sameBody(f,peer,id+' step '+count);
   }
   assert(steps>0,id+' completed steps');
  }
  assert.deepEqual(failures,[]);console.log('GEOMETRY7_DEEP_GATE_PASS',passes.length);
 }finally{fs.writeFileSync(path.join(OUT,'summary.json'),JSON.stringify({passes,failures},null,2));await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});

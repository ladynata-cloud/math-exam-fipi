'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
let SITE=process.env.GEOMETRY7_SITE;
const ROOT=path.resolve(__dirname,'..');
const server=require('node:http').createServer((req,res)=>{try{let file=path.resolve(ROOT,'.'+new URL(req.url,'http://local').pathname);if(!file.startsWith(ROOT+path.sep))throw Error();if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'};res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch(_){res.writeHead(404).end();}});
const OUT=process.env.GEOMETRY7_OUTPUT||'/tmp/geometry7-board-evidence';fs.mkdirSync(OUT,{recursive:true});
const catalog=require('../geometry-course/board/catalog.json');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function ready(page){await page.waitForFunction(()=>document.documentElement.dataset.geometry7Board==='ready',{},{timeout:20000});return page.frames().find(f=>f.url().includes('/geometry-course/trainers/'));}
async function snapshot(page){return page.evaluate(()=>Geometry7Practice.getState());}
async function restore(page,state){await page.evaluate(s=>Geometry7Practice.applyState(s),state);return ready(page);}
(async()=>{
 if(!SITE){await new Promise(r=>server.listen(0,'127.0.0.1',r));SITE='http://127.0.0.1:'+server.address().port;}
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--disable-dev-shm-usage']});
 const contexts=await Promise.all([browser.newContext({viewport:{width:900,height:1000}}),browser.newContext({viewport:{width:640,height:1000}})]);
 const pages=await Promise.all(contexts.map(c=>c.newPage()));let failures=[],passes=[];
 for(const page of pages){page.on('pageerror',e=>failures.push(e.message));await page.addInitScript(()=>{localStorage.setItem('mathExamCourseProgress.v1','{"private":"unchanged"}');});}
 try{
  for(const item of catalog){
   await pages[0].goto(SITE+'/trainers/geometry7-practice.html?activity='+item.id);let f=await ready(pages[0]);
   await f.locator('#geometry7-givens').fill('Синтетическая работа. Дано: равные элементы.');
   await f.locator('#geometry7-reasons').fill('Каждый переход обосновываем определением или теоремой.');
   const hint=f.getByRole('button',{name:/Подсказка|Намёк|подсказку/}).first();if(await hint.count()&&await hint.isVisible()&&await hint.isEnabled())await hint.click();
   await wait(70);const state=await snapshot(pages[0]);assert(state.actions.length>=2,item.id+' recorded actions');
   await pages[1].goto(SITE+'/trainers/geometry7-practice.html');let peer=await ready(pages[1]);peer=await restore(pages[1],state);
   assert.equal(await peer.locator('#geometry7-givens').inputValue(),'Синтетическая работа. Дано: равные элементы.',item.id);
   assert.equal(await peer.locator('#geometry7-reasons').inputValue(),'Каждый переход обосновываем определением или теоремой.',item.id);
   const personal=await pages[1].evaluate(()=>localStorage.getItem('mathExamCourseProgress.v1'));assert.equal(personal,'{"private":"unchanged"}');
   const overflow=await peer.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);assert.equal(overflow,false,item.id+' horizontal overflow');
   passes.push(item.id);console.log('PASS',item.id);
   if(/proof-sas|proof-asa|proof-sss|constr-angle|proof-sign|properties-2-3/.test(item.id)){await peer.locator('canvas').first().scrollIntoViewIfNeeded();await pages[1].screenshot({path:path.join(OUT,item.id+'.png'),fullPage:true});}
  }
  assert.deepEqual(failures,[]);console.log('GEOMETRY7_NATIVE_GATE_PASS',passes.length);
 }finally{fs.writeFileSync(path.join(OUT,'summary.json'),JSON.stringify({passes,failures},null,2));await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});

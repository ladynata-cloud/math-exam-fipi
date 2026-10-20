'use strict';
// CI-only real-browser acceptance for the 34 annotated examples and analogous
// model variants. Run in the existing Task 19 workflow; no local browser launch.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
if(!process.env.CI)throw new Error('Run this browser acceptance in CI, alongside task19-visual-hints.browser.cjs.');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),{cards}=require('../trainers/task19-visual-data.js'),refs=require('../trainers/task19-reference.js');
const DIRECT=[
 'prev-019','prev-070','trapezoid_area_base_times_height','prev-044','prev-030','reference-068','summer-046','prev-028','prev-053','prev-093','summer-044','prev-026',
 'reference-105','prev-080','summer-025','reference-016','summer-058','summer-069','reference-014','prev-011','prev-013','prev-027','summer-059','prev-050',
 'triangle_area_less_than_product_two_sides','prev-002','summer-048','summer-037','summer-034','triangle_angles_sum_360','prev-076','prev-063','summer-035','summer-061'
];
const byId=new Map(cards.map(c=>[c.id,c])),KEY='mathExam.task19.visualHints.v1';
const artifacts=path.resolve(process.env.TASK19_OWNER_BROWSER_ARTIFACTS||path.join(root,'artifacts/task19-owner-feedback'));
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.pdf':'application/pdf'};
async function server(){
 const s=http.createServer((req,res)=>{let file;try{const u=new URL(req.url,'http://localhost');if(u.pathname==='/favicon.ico'){res.writeHead(204).end();return;}file=path.resolve(root,'.'+decodeURIComponent(u.pathname));}catch(_){res.writeHead(400).end();return;}
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(e,b)=>{if(e){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(b);});
 });await new Promise(r=>s.listen(0,'127.0.0.1',r));return {s,base:'http://127.0.0.1:'+s.address().port};
}
const signature=c=>JSON.stringify([c.hint.model,c.hint.params?.focus||'',c.hint.params?.mode||'',c.hint.params?.kind||'']);
const directFamilies=new Set(DIRECT.map(id=>byId.get(id).hint.model)),seen=new Set(DIRECT.map(id=>signature(byId.get(id))));
const analogues=cards.filter(c=>{if(DIRECT.includes(c.id)||!directFamilies.has(c.hint.model)||seen.has(signature(c)))return false;seen.add(signature(c));return true;}).map(c=>c.id);
// The two opposite-side statements are equivalent variants, but both need explicit coverage.
if(!analogues.includes('prev-012'))analogues.push('prev-012');
const cases=[...DIRECT,...analogues];
const saved=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
async function fresh(page,base,id){
 if(page.url().startsWith(base))await page.evaluate(()=>localStorage.clear());
 await page.goto(base+'/trainers/task19-trainer.html?card='+encodeURIComponent(id));
 await page.waitForFunction(({id,key})=>window.Task19Data&&window.Task19Visuals&&JSON.parse(localStorage.getItem(key)||'null')?.current?.id===id,{id,key:KEY});
 assert.equal(await page.locator('#hintPanel').isVisible(),false,id+' starts with a task');
 await page.locator('#hintToggle').click();await page.locator('#visualHost svg').waitFor();
 assert.equal(await page.locator('.t19-model-readout').isVisible(),false,id+' values require deliberate measurement');
}
async function overflow(page,label){
 const violations=await page.evaluate(()=>{const width=document.documentElement.clientWidth,selectors=['main','#statement','#hintPanel','#visualHost','#visualHost svg','#visualHost input','#visualHost button','#visualHost .t19-model-readout','#referenceHost img','#referenceHost summary'];
  return selectors.flatMap(selector=>[...document.querySelectorAll(selector)].filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect();return{selector,left:r.left,right:r.right,width};})).filter(r=>r.left< -1||r.right>width+1);
 });assert.deepEqual(violations,[],label+' controls, geometry and references fit');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1),label+' page fits');
}
async function valid(page,label){
 const result=await page.evaluate(key=>{const state=JSON.parse(localStorage.getItem(key)),card=window.Task19Data.cards.find(c=>c.id===state.current.id),sample=window.Task19Visuals.sample(card.hint.model,{...card.hint.params,...state.current.modelState.params});
  const invalid=[];function scan(v,path){if(typeof v==='number'&&!Number.isFinite(v))invalid.push(path);else if(v&&typeof v==='object')Object.entries(v).forEach(([k,x])=>scan(x,path+'.'+k));}scan(sample.points,'points');scan(sample.metrics,'metrics');
  const inputs=[...document.querySelectorAll('#visualHost input[type="range"]')].map(i=>({key:i.dataset.key,value:Number(i.value),min:Number(i.min),max:Number(i.max),label:document.querySelector(`label[for="${i.id}"]`)?.textContent||''}));
  let triangle=null;if(sample.values.focus==='sides'){const P=sample.points,L=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]),angles=[sample.metrics.a,sample.metrics.b,sample.metrics.c],sides=[L(P.B,P.C),L(P.A,P.C),L(P.A,P.B)];triangle={angles,sides};}
  return {invalid,inputs,triangle,badMarkup:/NaN|Infinity|\[object Object\]/.test(document.querySelector('#visualHost').innerHTML)};
 },KEY);
 assert.deepEqual(result.invalid,[],label+' finite geometry');assert.equal(result.badMarkup,false,label+' valid rendered numbers');
 result.inputs.forEach(i=>{assert(i.label.trim(),label+' names '+i.key);assert(i.min<i.max,label+' useful range '+i.key);assert(i.value>=i.min-1e-7&&i.value<=i.max+1e-7,label+' within bounds '+i.key);});
 if(result.triangle){const {angles,sides}=result.triangle;assert(angles.every(x=>x>0&&x<180),label+' valid angles');assert(Math.abs(angles.reduce((a,b)=>a+b)-180)<1e-6,label+' angle sum');for(let i=0;i<3;i++)assert(sides[i]<sides[(i+1)%3]+sides[(i+2)%3],label+' strict triangle inequality');assert.equal(result.inputs.length,6,label+' six linked controls');}
 return result;
}
async function unanswered(page,before,label){const state=await saved(page);assert.equal(state.current.answer,null,label+' remains unanswered');assert.deepEqual(state.records,before.records,label+' does not award progress');assert.equal(await page.locator('#answerPanel').isVisible(),false,label+' no answer verdict');}
async function measure(page){if(!await page.locator('.t19-model-readout').isVisible()){await page.locator('.t19-measure').focus();await page.keyboard.press('Enter');}assert(await page.locator('.t19-model-readout').isVisible());}
async function references(page,card,label){
 const expected=refs.forCard(card);assert.equal(await page.locator('details.t19-reference').count(),expected.length?1:0,label+' appropriate formula help');
 if(!expected.length)return;
 const outer=page.locator('details.t19-reference');assert.equal(await outer.getAttribute('open'),null,label+' optional formula');await outer.locator(':scope > summary').click();
 const images=outer.locator('img.t19-reference-crop');assert.equal(await images.count(),expected.length);
 for(let i=0;i<expected.length;i++){
  const crop=images.nth(i);await crop.scrollIntoViewIfNeeded();await crop.evaluate(img=>img.complete?(img.naturalWidth>0?Promise.resolve():Promise.reject(new Error('reference image failed'))):new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error('reference crop failed'));}));
  assert.equal(await crop.getAttribute('src'),refs.crops[expected[i]].file);assert(await crop.getAttribute('alt'));assert.equal(await crop.evaluate(i=>i.naturalWidth),refs.crops[expected[i]].width);
 }
 const sheet=outer.locator('details.t19-reference-sheet').first();await sheet.locator(':scope > summary').click();const image=sheet.locator('img');await image.scrollIntoViewIfNeeded();await image.evaluate(img=>img.complete?(img.naturalWidth>0?Promise.resolve():Promise.reject(new Error('reference image failed'))):new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error('full sheet failed'));}));assert.equal(await image.evaluate(i=>i.naturalWidth),1263);
 assert(await outer.getByRole('link',{name:'Оригинал справочных материалов (PDF)'}).getAttribute('href'));await overflow(page,label+' full sheet');
 await sheet.locator(':scope > summary').click();await outer.locator(':scope > summary').click();
}
async function labelEvidence(page){return page.locator('#visualHost svg').evaluate(svg=>{const vb=svg.viewBox.baseVal;return [...svg.querySelectorAll('text')].filter(t=>t.textContent.trim()).map(t=>{const b=t.getBBox(),m=svg.getCTM().inverse().multiply(t.getCTM()),p=[new DOMPoint(b.x,b.y).matrixTransform(m),new DOMPoint(b.x+b.width,b.y+b.height).matrixTransform(m)];return{text:t.textContent,outside:p[0].x<vb.x||p[0].y<vb.y||p[1].x>vb.x+vb.width||p[1].y>vb.y+vb.height};});});}
async function highlighted(page,group){
 const state=await page.evaluate(group=>({active:[...document.querySelectorAll('#visualHost .t19-linked-active')].map(e=>e.dataset.geometryGroup),svg:document.querySelectorAll(`#visualHost svg [data-geometry-group="${group}"].t19-linked-active`).length,rows:document.querySelectorAll(`#visualHost li[data-geometry-group="${group}"].t19-linked-active`).length,controls:document.querySelectorAll(`#visualHost .t19-model-control[data-geometry-group="${group}"].t19-linked-active`).length}),group);
 assert(state.active.length>=6,'geometry, readout and pair are linked');assert(state.active.every(g=>g===group),'only selected opposite pair is highlighted');assert.equal(state.svg,2);assert.equal(state.rows,2);assert.equal(state.controls,2);
}
async function main(){
 fs.mkdirSync(artifacts,{recursive:true});const {s,base}=await server();let browser;const failures=[],errors=[],coverage=[];
 const check=async(name,fn,page)=>{try{await fn();console.log('PASS '+name);}catch(e){failures.push(name+': '+e.stack);console.error('FAIL '+name+': '+e.message);if(page)await page.screenshot({path:path.join(artifacts,'FAIL-'+name.replace(/[^a-z0-9_-]+/gi,'-')+'.png'),fullPage:true}).catch(()=>{});}};
 try{
  browser=await chromium.launch({headless:true});
  for(const mode of [{name:'desktop',viewport:{width:1280,height:920}},{name:'mobile',viewport:{width:390,height:844},hasTouch:true,isMobile:true}]){
   const {name,...contextOptions}=mode,context=await browser.newContext(contextOptions),page=await context.newPage();page.on('pageerror',e=>errors.push(mode.name+': '+e.message));page.on('console',m=>{if(m.type()==='error')errors.push(mode.name+': '+m.text());});
   for(const id of cases)await check(mode.name+' '+id,async()=>{
    const card=byId.get(id);await fresh(page,base,id);const before=await saved(page);await valid(page,id+' initial');await measure(page);await overflow(page,id+' initial');
    const labels=await labelEvidence(page);coverage.push({id,sourcePage:DIRECT.indexOf(id)+1||null,analogue:!DIRECT.includes(id),viewport:mode.name,labels});
    if(DIRECT.includes(id))await page.screenshot({path:path.join(artifacts,mode.name+'-page-'+String(DIRECT.indexOf(id)+1).padStart(2,'0')+'-'+id+'.png'),fullPage:true});
    const keys=await page.locator('#visualHost input[type=range]').evaluateAll(inputs=>inputs.map(i=>i.dataset.key));
    for(const key of keys){const slider=page.locator(`#visualHost input[data-key="${key}"]`),drawings=[];
     for(const press of ['Home','ArrowRight','End']){await slider.focus();await page.keyboard.press(press);await valid(page,id+' '+key+' '+press);drawings.push(await page.locator('#visualHost').textContent()+await page.locator('#visualHost svg').innerHTML());}
     assert(new Set(drawings).size>1,id+' '+key+' visibly responds to keyboard');await overflow(page,id+' '+key+' bounds');
    }
    await references(page,card,id);await unanswered(page,before,id);
   },page);
   await check(mode.name+' linked highlighting and draft reload',async()=>{
    await fresh(page,base,'reference-014');await measure(page);const before=await saved(page);assert.equal(await page.locator('.t19-model-control[data-pair="opposite-A"]').count(),2);
    if(mode.hasTouch){
     const arc=page.locator('#visualHost svg [data-geometry-group="opposite-A"] [data-geometry-mark="angle"] path').first();await arc.scrollIntoViewIfNeeded();const point=await arc.evaluate(p=>{const q=p.getPointAtLength(p.getTotalLength()/2),s=new DOMPoint(q.x,q.y).matrixTransform(p.getScreenCTM());return{x:s.x,y:s.y};});await page.touchscreen.tap(point.x,point.y);
    }else{await page.locator('#visualHost svg [data-geometry-group="opposite-A"]').first().focus();}
    await highlighted(page,'opposite-A');
    const slider=page.locator('input[data-key="sideA"]');if(mode.hasTouch){await slider.scrollIntoViewIfNeeded();const b=await slider.boundingBox();await slider.tap({position:{x:b.width*.7,y:b.height/2}});}else{await slider.focus();await page.keyboard.press('ArrowRight');}
    const baseSlider=page.locator('input[data-key="sideC"]');await baseSlider.focus();await page.keyboard.press('ArrowLeft');await valid(page,'linked slider');await unanswered(page,before,'linked pair');
    const state=await saved(page),drawing=await page.locator('#visualHost svg').innerHTML();await page.locator('#hintToggle').click();await page.locator('#hintToggle').click();assert.deepEqual((await saved(page)).current.modelState,state.current.modelState);
    await page.reload();await page.locator('#visualHost svg').waitFor();assert.deepEqual((await saved(page)).current.modelState,state.current.modelState);assert.equal(await page.locator('#visualHost svg').innerHTML(),drawing);assert(await page.locator('.t19-model-readout').isVisible());await unanswered(page,before,'restored pair');
    const card=byId.get('reference-014');await page.locator(card.truth?'#btnFalse':'#btnTrue').click();assert.deepEqual((await saved(page)).records[card.id],{attempts:1,correct:0,needsReview:true});
    assert(await page.locator('#btnTrue').isDisabled());assert(await page.locator('#btnFalse').isDisabled());assert.equal((await saved(page)).records[card.id].attempts,1,'one explicit answer records one attempt');
   },page);
   await context.close();
  }
  assert.deepEqual(errors,[],'browser console and page errors');
 }catch(e){failures.push(e.stack||String(e));}finally{if(browser)await browser.close();await new Promise(r=>s.close(r));fs.writeFileSync(path.join(artifacts,'coverage.json'),JSON.stringify({direct:DIRECT,analogues,coverage,errors,failures},null,2));}
 if(failures.length)throw new Error(failures.join('\n\n'));console.log(`PASS ${cases.length} cards in desktop and touch/mobile views, linked pairs, genuine references and grading`);
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});

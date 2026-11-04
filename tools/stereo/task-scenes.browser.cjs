'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),shots=process.env.GEOMETRY_SCENE_SHOTS;
const fixture='/tools/fixtures/stereo-scenes.html';
const server=http.createServer((req,res)=>{
 try{
  let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
  if(!file.startsWith(root+path.sep))throw Error('Outside test root');
  if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json'})[path.extname(file)]||'application/octet-stream');
  res.end(fs.readFileSync(file));
 }catch{res.writeHead(404).end();}
});
async function selectScene(page,value){
 await page.selectOption('#kind',value);
 await page.locator('.am-svg').waitFor({state:'visible'});
 await page.waitForFunction(value=>document.querySelector('main').dataset.scene===value,value);
}
async function openHelp(page){
 if(!await page.locator('#help').evaluate(el=>el.open))await page.locator('#help>summary').click();
 await page.locator('#stepq').waitFor({state:'visible'});
 await page.waitForFunction(()=>!!document.querySelector('#stepq')?.textContent.trim());
}
async function assertMobileScene(page,name){
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+' document fits320');
 assert((await page.locator('.am-note').innerText()).length>20,name+' caveat visible');
 await page.waitForFunction(()=>{
  const svg=document.querySelector('.am-svg'),label=svg?.querySelector('.am-label');
  return label&&parseFloat(getComputedStyle(label).fontSize)*svg.getBoundingClientRect().width/svg.viewBox.baseVal.width>=18;
 });
 const metrics=await page.locator('.am-svg').evaluate(el=>({pixels:el.getBoundingClientRect().width,units:el.viewBox.baseVal.width,font:parseFloat(getComputedStyle(el.querySelector('.am-label')).fontSize)}));
 assert(metrics.font*metrics.pixels/metrics.units>=18,name+' readable responsive labels');
}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:320,height:900}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:'+server.address().port+fixture);
  await page.waitForFunction(()=>window.StereoSceneFixture?.ready||window.StereoSceneFixture?.error);
  assert.equal(await page.evaluate(()=>StereoSceneFixture.error),null,'fixture initialized actual banks');
  const families=await page.evaluate(()=>StereoTaskScenes.families);
  assert.equal(families.length,38);
  for(const kind of families){
   await selectScene(page,kind);await assertMobileScene(page,kind);await openHelp(page);
   assert(await page.locator('#stepq').isVisible());await page.locator('#help>summary').click();
  }
  const proofs=await page.evaluate(()=>Object.entries(StereoSceneFixture.proofs).map(([key,p])=>({key,given:p.given,goal:p.goal,steps:p.steps.length})));
  assert.equal(proofs.length,19);
  for(const proof of proofs){
   await selectScene(page,'proof:'+proof.key);await assertMobileScene(page,'proof:'+proof.key);
   const text=await page.locator('#model').innerText();assert(text.includes(proof.given));assert(text.includes(proof.goal));
   const yaw=await page.locator('.am-svg').getAttribute('data-yaw');await openHelp(page);
   for(let step=0;step<proof.steps;step++){
    if(step)await page.locator('#advance').click();
    await page.waitForFunction(step=>document.querySelector('.am-svg')?.dataset.view==='step'+step,step);
    assert.equal(await page.locator('.am-svg').getAttribute('data-yaw'),yaw,'proof camera retained '+proof.key+'/'+step);
   }
   await page.locator('#help>summary').click();
  }
  await selectScene(page,'section');
  const initial=await page.locator('.am-svg').getAttribute('data-yaw');
  await page.locator('.am-svg').focus();await page.keyboard.press('ArrowRight');
  const rotated=await page.locator('.am-svg').getAttribute('data-yaw');assert.notEqual(rotated,initial);
  await openHelp(page);assert.equal(await page.locator('.am-svg').getAttribute('data-yaw'),rotated);
  await page.locator('#help>summary').click();await page.locator('.am-expand').click();
  await page.getByRole('dialog').waitFor({state:'visible'});assert(await page.getByRole('dialog').isVisible());
  await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);
  assert.equal(await page.locator('.am-svg').getAttribute('data-yaw'),rotated);
  await page.locator('.am-svg').focus();await page.keyboard.press('Home');
  assert.equal(await page.locator('.am-svg').getAttribute('data-yaw'),initial);
  if(shots)fs.mkdirSync(shots,{recursive:true});
  const labelEvidence=[];
  const screenshots=[[320,'section',4,-1],[320,'conic',2,-1],[1280,'sphere-cut',1,-1],[1280,'circle-bridge',2,-1],...([320,1280].flatMap(width=>[[width,'proof:pyramid-volume',0,0],[width,'proof:section',0,-1],[width,'proof:projection',0,0]]))];
  for(const [width,kind,seed,step]of screenshots){
   await page.setViewportSize({width,height:900});await selectScene(page,kind);
   if(!kind.startsWith('proof:')){await page.locator('#seed').fill(String(seed));await page.locator('#seed').dispatchEvent('change');}
   if(step>=0){await openHelp(page);await page.waitForFunction(step=>document.querySelector('.am-svg')?.dataset.view==='step'+step,step);}
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   const labels=await page.locator('.am-svg').evaluate(svg=>{const box=svg.viewBox.baseVal,scale=svg.getBoundingClientRect().width/box.width;return {width:box.width,height:box.height,pixelsPerUnit:scale,labels:[...svg.querySelectorAll('.am-label')].map(label=>{const b=label.getBBox();return {key:label.dataset.label,text:label.textContent,x:b.x,y:b.y,width:b.width,height:b.height,renderedFontPixels:parseFloat(getComputedStyle(label).fontSize)*scale};})};});
   const overlaps=[];
   for(let i=0;i<labels.labels.length;i++)for(let j=i+1;j<labels.labels.length;j++){
    const a=labels.labels[i],b=labels.labels[j],horizontal=Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x),vertical=Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y);
    if(horizontal>1&&vertical>1)overlaps.push({a:a.key,b:b.key,textA:a.text,textB:b.text,width:horizontal,height:vertical});
   }
   labelEvidence.push({viewportWidth:width,kind,step,...labels,overlaps});
   if(shots){await page.screenshot({path:path.join(shots,kind.replace(':','-')+'-'+width+'.png'),fullPage:true});fs.writeFileSync(path.join(shots,'label-bounds.json'),JSON.stringify(labelEvidence,null,2));}
   for(const label of labels.labels)assert(label.x>=-1&&label.y>=-1&&label.x+label.width<=labels.width+1&&label.y+label.height<=labels.height+1,kind+' label bounds '+label.key+' at'+width);
   if(kind.startsWith('proof:'))assert.deepEqual(overlaps,[],kind+' overlapping labels at'+width);
  }
  if(shots)fs.writeFileSync(path.join(shots,'label-bounds.json'),JSON.stringify(labelEvidence,null,2));
  assert.deepEqual(errors,[]);
  console.log('TASK_SCENES_BROWSER_OK: 38 numeric families +19 proofs/60 steps at320, readable responsive labels, actual banks, keyboard camera, same-page help, expand/Escape, no overflow/errors; ten bounded screenshots with label geometry');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>server.close());

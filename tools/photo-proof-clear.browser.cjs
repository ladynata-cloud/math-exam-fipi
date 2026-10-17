'use strict';
// Runs in cloud CI against synthetic tasks; the page cannot access the network.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),D=require('../ege-baza/path/data');
for(const f of ['practice','equation-practice','grade7-algebra','grade7-geometry','grade7-foundations','pre7-arithmetic','pre7-applications','grade7-geometry-core','grade7-geometry-practice','grade7-geometry-rebuild-base','grade7-geometry-rebuild-foundations','grade7-geometry-rebuild-triangles','grade7-geometry-rebuild-relations','grade7-geometry-rebuild-workbook'])require('../ege-baza/path/'+f);
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']}),page=await browser.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>r.abort());
 try{
  await page.setContent('<!doctype html><html lang="ru"><meta charset="utf-8"><body><main id="main"></main></body></html>');
  for(const f of ['style.css','geometry-journey.css'])await page.addStyleTag({path:path.join(root,'ege-baza/path',f)});
  await page.evaluate(()=>window.PathData={F:String});
  for(const f of ['practice-view.js','grade7-geometry-core-models.js'])await page.addScriptTag({path:path.join(root,'ege-baza/path',f)});
  for(const problem of [1,2,3])for(const width of [320,390,1280]){
   await page.setViewportSize({width,height:900});const task=D.task('grade7-r-photo-proof-'+problem,23);
   await page.evaluate(task=>{
    const host=document.getElementById('main'),P=PathPracticeView.photoProof,work={stage:2,step:2,draft:'',note:''};
    host.innerHTML=P.markup(task,work);P.bind(host,task,work,{select(value){work.draft=value;}});
   },task);
   const common=page.locator('[data-answer-choice="'+task.steps[2].a+'"]');await common.click();
   assert.equal(await common.getAttribute('aria-pressed'),'true');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No overflow at '+width+' for problem '+problem);
   assert(await page.locator('.photo-proof-step button').evaluateAll(buttons=>buttons.every(b=>parseFloat(getComputedStyle(b).fontSize)>=20&&b.getBoundingClientRect().height>=52)));
   assert(await page.locator('.photo-proof-drawing svg').evaluate(svg=>{
    const v=svg.viewBox.baseVal;
    return [...svg.querySelectorAll('text')].every(label=>{const r=label.getBBox();return r.x>=v.x&&r.y>=v.y&&r.x+r.width<=v.x+v.width&&r.y+r.height<=v.y+v.height;});
   }),'Point labels stay inside the drawing');
   if(problem===1)assert(await page.locator('[data-core-part="AC"]').evaluate(node=>node.classList.contains('photo-proof-focus')));
   if(width===1280){
    const a=await page.locator('.photo-proof-drawing').boundingBox(),b=await page.locator('.photo-proof-step').boundingBox();assert(b.x>a.x+a.width,'Question is beside the drawing');
   }else{
    const a=await page.locator('.photo-proof-step').boundingBox(),b=await page.locator('.photo-proof-record').boundingBox();assert(b.y>=a.y+a.height,'On phones the current question precedes the accumulated proof');
   }
   if(process.env.GEOMETRY_REBUILD_OUTPUT_DIR){
    fs.mkdirSync(process.env.GEOMETRY_REBUILD_OUTPUT_DIR,{recursive:true});
    await page.screenshot({path:path.join(process.env.GEOMETRY_REBUILD_OUTPUT_DIR,'photo-proof-'+problem+'-'+width+'.png'),fullPage:true});
   }
  }
  assert.deepEqual(errors,[]);console.log('CLEAR_PHOTO_PROOF_BROWSER_OK: 3 figures × 320/390/1280px, readable controls, no overflow, linked selection, screenshots.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;});

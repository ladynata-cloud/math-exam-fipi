'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),origin='https://mathexam.space',output=process.env.DIVISION_DIAGNOSTIC_OUTPUT_DIR;
(async()=>{const browser=await chromium.launch({headless:true});try{for(const width of [320,1060]){
 const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await context.route('**/*',route=>{const u=new URL(route.request().url()),file=path.resolve(root,'.'+u.pathname);assert.equal(u.origin,origin);assert(file.startsWith(root+path.sep));try{route.fulfill({status:200,contentType:({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'})[path.extname(file)]||'text/plain',body:fs.readFileSync(file)});}catch(_){route.fulfill({status:404,body:''});}});
 for(const managed of [false,true]){
  await page.goto(origin+'/ege-baza/path/index.html'+(managed?'?learning=1':'')+'#lesson=grade7-b-fraction-product-cancel');
  // A synthetic adapter exposes the same public bridge registration without a real account.
  if(managed){await page.evaluate(async()=>{let adapter;window.MathExamLearning={register(value){adapter=value;}};const src=await(await fetch('managed.js')).text();(0,eval)(src);const id='grade7-b-fraction-product-cancel',seed=269,task=PathData.task(id,seed);adapter.applyState({taskSpec:{trainerId:'ege-path',contentId:id,id,seed,contentVersion:1,task},state:null,readOnly:false});window.__fractionAdapter=adapter;});}
  else await page.evaluate(()=>{const l=PathCourse.state().lessons['grade7-b-fraction-product-cancel'];l.seed=269;});
  await page.locator('[data-stage="2"]').click();
  assert(await page.locator('.task .math-fraction').count()>=2);
  for(const fraction of await page.locator('.task .math-fraction').all()){
   const a=await fraction.locator('.numerator').boundingBox(),b=await fraction.locator('.denominator').boundingBox();assert(a&&b&&a.y+a.height<=b.y+1);assert(Math.abs(a.x+a.width/2-b.x-b.width/2)<1);assert.notEqual(await fraction.locator('.numerator').evaluate(n=>getComputedStyle(n).borderBottomStyle),'none');
  }
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  assert(await page.locator('.callout .math-fraction').count()>0);
  if(output){fs.mkdirSync(output,{recursive:true});await page.screenshot({path:path.join(output,'fractions-'+(managed?'cabinet':'public')+'-'+width+'.png'),fullPage:true});}
 }
 assert.deepEqual(errors,[]);await context.close();console.log('FRACTION_NOTATION_BROWSER_OK '+width+'px public/managed horizontal bars');
}}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});

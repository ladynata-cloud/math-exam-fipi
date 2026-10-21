'use strict';
// CI-only keyboard, layout and state acceptance for optional textbook passages.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
if(!process.env.CI)throw new Error('Run textbook browser acceptance in the cloud task19 workflow.');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),KEY='mathExam.task19.visualHints.v1';
const artifacts=path.resolve(process.env.TASK19_TEXTBOOK_BROWSER_ARTIFACTS||path.join(root,'artifacts/task19-textbook-reference'));
const cases=['prev-006','prev-102','two_parallel_to_third_parallel','two_parallel_to_third_perpendicular','tri_aaa_similarity'];
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg'};
async function server(){
 const s=http.createServer((req,res)=>{let file;try{const url=new URL(req.url,'http://localhost');if(url.pathname==='/favicon.ico'){res.writeHead(204).end();return;}file=path.resolve(root,'.'+decodeURIComponent(url.pathname));}catch(_){res.writeHead(400).end();return;}
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(error,bytes)=>{if(error){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(bytes);});
 });await new Promise(resolve=>s.listen(0,'127.0.0.1',resolve));return{s,base:'http://127.0.0.1:'+s.address().port};
}
const saved=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
async function fit(page,label){
 const bad=await page.evaluate(()=>{const width=document.documentElement.clientWidth;return [...document.querySelectorAll('#textbookHost details,#textbookHost summary,#textbookHost a,#textbookHost button,#textbookHost img')].filter(e=>e.getClientRects().length).flatMap(e=>[...e.getClientRects()].map(r=>({tag:e.tagName,text:e.textContent.slice(0,55),left:r.left,right:r.right,width}))).filter(r=>r.left< -1||r.right>width+1);});
 assert.deepEqual(bad,[],label+': passages and controls fit viewport');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1),label+': no page overflow');
}
async function openAndCheck(page,label){
 const details=page.locator('.t19-textbook'),summary=details.locator(':scope > summary');
 assert.equal(await summary.textContent(),'Для ценителей строгости и точности');assert.equal(await details.getAttribute('open'),null);
 await summary.focus();await page.keyboard.press('Enter');assert.notEqual(await details.getAttribute('open'),null,label+': native disclosure opens from keyboard');
 const links=details.locator('a');assert(await links.count()>=2,label+': both textbook sources');
 const texts=await links.allTextContents();assert(texts.some(t=>/Атанасян/i.test(t)));assert(texts.some(t=>/Мерзляк/i.test(t)));
 for(let i=0;i<await links.count();i++){const link=links.nth(i);assert.match(await link.getAttribute('href'),/^https:\/\/.+#page=\d+/);assert.equal(await link.getAttribute('target'),'_blank');assert.match(await link.getAttribute('rel'),/noopener/);}
 for(const image of await details.locator('img').all()){
  await image.scrollIntoViewIfNeeded();await image.evaluate(img=>img.complete?(img.naturalWidth?Promise.resolve():Promise.reject(new Error('excerpt image failed'))):new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error('excerpt image failed'));}));assert(await image.getAttribute('alt'));
 }
 await fit(page,label);return{details,summary};
}
async function main(){
 fs.mkdirSync(artifacts,{recursive:true});const{s,base}=await server();let browser;const failures=[],errors=[],coverage=[];
 const check=async(name,fn,page)=>{try{await fn();console.log('PASS '+name);}catch(error){failures.push(name+': '+error.stack);console.error('FAIL '+name+': '+error.message);if(page)await page.screenshot({path:path.join(artifacts,'FAIL-'+name.replace(/[^a-z0-9_-]/gi,'-')+'.png'),fullPage:true}).catch(()=>{});}};
 try{
  browser=await chromium.launch({headless:true});
  for(const width of [320,360,1280]){
   const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
   for(const id of cases)await check(width+' '+id,async()=>{
    if(page.url().startsWith(base))await page.evaluate(()=>localStorage.clear());await page.goto(base+'/trainers/task19-trainer.html?card='+id);await page.locator('.t19-textbook').waitFor();
    const before=await saved(page);assert.equal(await page.locator('#hintPanel').isVisible(),false);const{details,summary}=await openAndCheck(page,width+' '+id);
    await summary.focus();await page.keyboard.press('n');assert.equal((await saved(page)).current.answer,null,'reading shortcut does not grade');
    await page.locator('#hintToggle').click();await page.locator('#visualHost svg').waitFor();const slider=page.locator('#visualHost input[type=range]').first();await slider.focus();await page.keyboard.press('ArrowRight');const experiment=(await saved(page)).current.modelState;
    await page.locator('#hintToggle').click();assert.notEqual(await details.getAttribute('open'),null,'textbook remains open after hiding visual help');await page.locator('#hintToggle').click();assert.deepEqual((await saved(page)).current.modelState,experiment,'experiment survives textbook reading');
    assert.equal((await saved(page)).current.answer,null);assert.deepEqual((await saved(page)).records,before.records,'no auto credit');
    await summary.scrollIntoViewIfNeeded();await page.screenshot({path:path.join(artifacts,width+'-'+id+'.png'),fullPage:true});
    await details.locator('.t19-textbook-close').click();assert.equal(await details.getAttribute('open'),null);assert(await summary.evaluate(e=>e===document.activeElement),'close returns focus');
    await page.locator('#nextCard').click();assert.equal(await page.locator('.t19-textbook').getAttribute('open'),null,'new card starts collapsed');assert.notEqual((await saved(page)).current.id,id);
    coverage.push({width,id});
   },page);
   await context.close();
  }
  for(const entry of ['/trainers/geometry_statements_trainer_improved.html','/downloads/trainers/task19-trainer/task19-trainer.html']){
   const page=await browser.newPage({viewport:{width:360,height:900}});page.on('pageerror',e=>errors.push(e.message));
   await check('alternate entry '+entry,async()=>{await page.goto(base+entry+'?card=two_parallel_to_third_parallel');await page.locator('.t19-textbook').waitFor();await openAndCheck(page,entry);assert.equal((await saved(page)).current.answer,null);},page);await page.close();
  }
  assert.deepEqual(errors,[],'no browser runtime errors');
 }catch(error){failures.push(error.stack||String(error));}
 finally{if(browser)await browser.close();await new Promise(resolve=>s.close(resolve));fs.writeFileSync(path.join(artifacts,'coverage.json'),JSON.stringify({coverage,errors,failures},null,2));}
 if(failures.length)throw new Error(failures.join('\n\n'));console.log('PASS textbook help: 15 viewport/card cases, keyboard, source excerpts, retained work and both alternate entries');
}
main().catch(error=>{console.error(error.stack);process.exitCode=1;});

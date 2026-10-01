// Requires external Playwright. Run from repository root, without changing security settings.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright');
const root=process.cwd(),shots=process.env.NAVIGATOR_SCREENSHOTS_DIR;
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css'};
const server=http.createServer((req,res)=>{
 let file;try{file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));}catch(e){res.writeHead(400).end();return;}
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
 if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
 res.setHeader('Content-Type',(mime[path.extname(file)]||'application/octet-stream')+'; charset=utf-8');fs.createReadStream(file).pipe(res);
});
let browser,checks=0;const errors=[];
const ok=(value,label)=>{assert.ok(value,label);checks++;};
try{
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 browser=await chromium.launch({headless:true,...(process.env.NAVIGATOR_CHROMIUM_PATH?{executablePath:process.env.NAVIGATOR_CHROMIUM_PATH}:{})});
 const context=await browser.newContext(),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 const url=`http://127.0.0.1:${server.address().port}/ege-baza/`;
 if(shots)fs.mkdirSync(shots,{recursive:true});
 for(const width of [1280,360]){
  await page.setViewportSize({width,height:850});
  for(const hash of ['today','map','module?module=m01','module?module=m03','foundation?skill=p-fraction&from=m01','progress','teacher']){
   await page.goto(url+'#'+hash);await page.locator('h1').waitFor();
   ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No overflow '+width+' '+hash);
   if(shots&&['today','map','module?module=m01'].includes(hash))await page.screenshot({path:path.join(shots,`${width}-${hash.split('?')[0]}.png`),fullPage:true});
  }
 }
 await page.goto(url+'#today');await page.locator('[data-nav="map"]').focus();await page.keyboard.press('Enter');
 await page.waitForURL('**/#map');ok(await page.locator('#content').evaluate(el=>el===document.activeElement),'Keyboard route focuses content');
 await page.click('[data-module="m01"] a');await page.click('.lesson a.btn');
 await page.waitForURL('**/trainers/ege-baza/course/#learn-decimal');ok(await page.locator('#slider').isVisible(),'Real lesson opens');
 await page.click('a[href="../../../ege-baza/#map"]');await page.waitForURL('**/ege-baza/#map');
 ok(await page.locator('[data-module]').count()===7,'Returns to course');
 await page.goBack();ok(await page.locator('#slider').isVisible(),'Browser back returns to lesson');
 await page.goto(url+'#module?module=m02');ok(await page.locator('.lesson a.btn').count()===0,'Planned lessons cannot launch');
 const blocked=await browser.newContext();await blocked.addInitScript(()=>{Storage.prototype.getItem=()=>{throw Error('disabled');};});
 const bp=await blocked.newPage();await bp.goto(url);ok(await bp.locator('#storage-notice').isVisible(),'Storage error visible');await blocked.close();
 const file=await context.newPage();await file.goto('file://'+path.join(root,'ege-baza/index.html'));await file.locator('h1').waitFor();
 ok(await file.locator('[data-recommendation]').count()===1,'File preview loads scripts');await file.close();
 ok(errors.length===0,'No browser errors: '+errors.join('; '));
 console.log(`EGE_BAZA_NAVIGATOR_BROWSER_OK: ${checks} checks.`);
}finally{await browser?.close();if(server.listening)await new Promise(r=>server.close(r));}

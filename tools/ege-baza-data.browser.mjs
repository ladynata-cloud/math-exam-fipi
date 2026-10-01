// Real-browser gate. Run in a permitted environment; DOM tests do not replace it.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright');
const root=process.cwd(),shots=process.env.DATA_SCREENSHOTS_DIR,errors=[];
const server=http.createServer((req,res)=>{
 let p;try{p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));}catch{res.writeHead(400).end();return;}
 if(!p.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 if(fs.existsSync(p)&&fs.statSync(p).isDirectory())p=path.join(p,'index.html');
 if(!fs.existsSync(p)||!fs.statSync(p).isFile()){res.writeHead(404).end();return;}
 res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css'}[path.extname(p)]||'text/plain')+';charset=utf-8');fs.createReadStream(p).pipe(res);
});
let browser,checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++;};
try{
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 browser=await chromium.launch({headless:true,...(process.env.NAVIGATOR_CHROMIUM_PATH?{executablePath:process.env.NAVIGATOR_CHROMIUM_PATH}:{})});
 const context=await browser.newContext(),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 const origin=`http://127.0.0.1:${server.address().port}`,url=origin+'/trainers/ege-baza/data-course/';
 if(shots)fs.mkdirSync(shots,{recursive:true});
 for(const width of [1280,360]){
  await page.setViewportSize({width,height:850});
  for(const id of ['data','probability','graphs','logic']){
   await page.goto(url+'#learn-'+id);await page.locator('#slider').waitFor();
   await page.locator('#slider').focus();await page.keyboard.press('ArrowRight');
   ok(await page.locator('#factor-label').innerText()===(id==='data'?'25':id==='probability'?'5':id==='graphs'?'1':'2'),'Keyboard model '+id);
   ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No page overflow '+width+' '+id);
   if(shots)await page.screenshot({path:path.join(shots,`${width}-${id}.png`),fullPage:true});
  }
  for(const hash of ['practice-data-0','practice-data-1','practice-graphs-2','teacher','checks','report']){
   await page.goto(url+'#'+hash);await page.locator('#main').waitFor();
   ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No page overflow '+width+' '+hash);
  }
 }
 await page.goto(url+'#practice-data-0');await page.fill('#answer','3');await page.click('#answer-form button');
 await page.goto(origin+'/ege-baza/#progress?module=m02');
 ok((await page.locator('[data-stat="solved"]').innerText()).replace(/\s/g,'')==='1/16','Module result reaches navigator');
 await page.click('a[href="#backup?module=m02"]');
 const downloading=page.waitForEvent('download');await page.click('[data-backup-export]');const downloaded=await downloading;
 ok(downloaded.suggestedFilename().startsWith('mathexam-ege-baza-m02-backup-'),'Real m02 JSON download');
 const downloadedPath=await downloaded.path();const copy=JSON.parse(fs.readFileSync(downloadedPath,'utf8'));
 ok(Object.keys(copy.modules).join()==='m02','File scoped to m02');
 const fresh=await browser.newContext(),second=await fresh.newPage();second.on('pageerror',e=>errors.push(e.message));
 await second.goto(origin+'/ege-baza/#backup?module=m02');
 await second.evaluate(()=>localStorage.setItem('mathexam.ege-baza.foundation.v1','preserved'));
 await second.setInputFiles('#backup-file',downloadedPath);await second.locator('#backup-consent').check();await second.click('[data-backup-apply]');
 ok((await second.locator('#backup-status').innerText()).includes('Копия восстановлена'),'Real upload into fresh browser context');
 ok(await second.evaluate(()=>localStorage.getItem('mathexam.ege-baza.foundation.v1')==='preserved'),'M01 preserved');
 await second.goto(url+'#practice-data-0');ok((await second.locator('#main').innerText()).includes('Верно с первого раза'),'Module reads restored work');
 await fresh.close();ok(errors.length===0,'No browser errors '+errors.join('; '));
 console.log(`EGE_BAZA_DATA_BROWSER_OK: ${checks} checks; inspect saved screenshots before release.`);
}finally{await browser?.close();if(server.listening)await new Promise(r=>server.close(r));}

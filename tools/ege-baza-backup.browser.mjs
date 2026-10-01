// Real browser backup/download/upload/concurrent-tab gate; requires external Playwright.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright');
const root=process.cwd();let browser,checks=0;const errors=[];
const ok=(v,m)=>{assert.ok(v,m);checks++;};
const server=http.createServer((req,res)=>{
 let file;try{file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));}catch(e){res.writeHead(400).end();return;}
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
 if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
 res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css'}[path.extname(file)]||'text/plain')+';charset=utf-8');fs.createReadStream(file).pipe(res);
});
try{
 await new Promise((r,j)=>{server.once('error',j);server.listen(0,'127.0.0.1',r);});
 browser=await chromium.launch({headless:true,...(process.env.NAVIGATOR_CHROMIUM_PATH?{executablePath:process.env.NAVIGATOR_CHROMIUM_PATH}:{})});
 const context=await browser.newContext({acceptDownloads:true}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 const origin=`http://127.0.0.1:${server.address().port}`,url=origin+'/ege-baza/#backup',key='mathexam.ege-baza.foundation.v1';
 await page.goto(origin+'/trainers/ege-baza/course/#practice-decimal-0');
 await page.click('[data-action="hint"]');await page.fill('#answer','0.75');await page.click('#answer-form button');
 const before=await page.evaluate(k=>localStorage.getItem(k),key);
 await page.goto(url);const dl=page.waitForEvent('download');await page.click('[data-backup-export]');const download=await dl;
 const stream=await download.createReadStream(),parts=[];for await(const chunk of stream)parts.push(chunk);const file=Buffer.concat(parts);
 ok(JSON.parse(file.toString()).modules.m01.state.practice['decimal-practice-1'].hints,'Downloaded backup preserves help');
 await page.evaluate(k=>localStorage.removeItem(k),key);
 await page.setInputFiles('#backup-file',{name:'backup.json',mimeType:'application/json',buffer:file});await page.locator('#backup-preview').waitFor({state:'visible'});
 ok(await page.locator('[data-backup-apply]').isDisabled(),'Explicit consent required');await page.check('#backup-consent');await page.click('[data-backup-apply]');
 ok((await page.locator('#backup-status').innerText()).includes('Копия восстановлена'),'Successful restore notification');
 const after=await page.evaluate(k=>localStorage.getItem(k),key);assert.deepEqual(JSON.parse(after),JSON.parse(before));checks++;
 await page.setInputFiles('#backup-file',{name:'backup.json',mimeType:'application/json',buffer:file});await page.locator('#backup-preview').waitFor({state:'visible'});
 const other=await context.newPage();await other.goto(origin+'/trainers/ege-baza/course/#practice-decimal-1');await other.fill('#answer','1.28');await other.click('#answer-form button');
 await page.locator('#backup-preview').waitFor({state:'hidden'});ok((await page.locator('#backup-status').innerText()).includes('изменился'),'Other-tab write cancels stale preview');
 await page.setViewportSize({width:360,height:850});await page.setInputFiles('#backup-file',{name:'backup.json',mimeType:'application/json',buffer:file});await page.locator('#backup-preview').waitFor({state:'visible'});
 ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile preview has no overflow');
 if(process.env.NAVIGATOR_SCREENSHOTS_DIR){fs.mkdirSync(process.env.NAVIGATOR_SCREENSHOTS_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.NAVIGATOR_SCREENSHOTS_DIR,'backup-mobile.png'),fullPage:true});}
 await page.locator('[data-backup-cancel]').focus();await page.keyboard.press('Enter');ok(await page.locator('#backup-preview').isHidden(),'Keyboard cancellation');
 ok(errors.length===0,'No page errors: '+errors.join('; '));console.log(`EGE_BAZA_BACKUP_BROWSER_OK: ${checks} checks.`);
}finally{await browser?.close();if(server.listening)await new Promise(r=>server.close(r));}

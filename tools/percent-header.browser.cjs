'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),route='/trainers/oge-1-5-trainers/percent-table-trainer.html',production=process.argv.includes('--production');
async function main(){
 if(production){let matched=false;for(let n=0;n<36;n++){try{const r=await fetch('https://mathexam.space'+route+'?release='+process.env.GITHUB_SHA,{signal:AbortSignal.timeout(10000)});if(r.ok&&await r.text()===fs.readFileSync(path.join(root,route),'utf8')){matched=true;break;}}catch(_){}await new Promise(r=>setTimeout(r,10000));}assert(matched,'live HTML must match checked source');}
 const server=http.createServer((req,res)=>{try{let p=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!p.startsWith(root+path.sep))throw Error();if(fs.statSync(p).isDirectory())p+='/index.html';res.setHeader('Content-Type',p.endsWith('.html')?'text/html;charset=utf-8':p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':'text/plain');res.end(fs.readFileSync(p));}catch(_){res.writeHead(404).end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
  const origin=production?'https://mathexam.space':'http://127.0.0.1:'+server.address().port;
  for(const width of [320,390,768,1280]){
   const context=await browser.newContext({viewport:{width,height:900}}),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
   await p.goto(origin+route);await p.locator('html[data-practical-minimal="ready"]').waitFor();
   const menu=p.locator('details.pm-details').filter({has:p.locator('.main-nav')}),summary=menu.locator(':scope > summary');
   async function within(locator){assert(await locator.isVisible());const b=await locator.boundingBox();assert(b&&b.x>=-1&&b.x+b.width<=width+1,'control stays horizontally inside viewport');}
   async function check(open){await within(summary);assert.equal(await menu.evaluate(e=>e.open),open);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert(await p.locator('.nav-scroll').evaluate(e=>e.scrollWidth<=e.clientWidth+1&&e.scrollLeft===0));if(open)for(const v of ['home','learn','practice','check','review'])await within(p.locator('.main-nav [data-view="'+v+'"]'));}
   await check(false);await summary.focus();await summary.press('Enter');await check(true);
   for(const v of ['home','learn','practice','check','review']){const b=p.locator('.main-nav [data-view="'+v+'"]');await b.click();await check(true);assert(await p.locator('#view-'+v).isVisible());}
   // Native Tab/Enter navigation through the same visible menu.
   await summary.focus();await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>document.activeElement.dataset.view),'home');await p.keyboard.press('Enter');assert(await p.locator('#view-home').isVisible());await check(true);
   const dir=path.join(root,'artifacts/percent-header');fs.mkdirSync(dir,{recursive:true});await p.screenshot({path:path.join(dir,`${production?'production':'local'}-${width}-open.png`),animations:'disabled'});
   await summary.focus();await summary.press('Enter');await check(false);await p.screenshot({path:path.join(dir,`${production?'production':'local'}-${width}-closed.png`),animations:'disabled'});
   await summary.press('Enter');await check(true);assert.deepEqual(errors,[]);await context.close();
  }
  console.log(production?'PERCENT_HEADER_PRODUCTION_PASS':'PERCENT_HEADER_BROWSER_PASS','4 widths, 5 modes, native keyboard, open/closed bounds');
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
}
main().catch(e=>{console.error(e);process.exitCode=1;});

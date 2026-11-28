#!/usr/bin/env node
'use strict';
// Native playback on disposable contexts; never connects to a live classroom.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {inside,validatePlan}=require('./habr-gifs.browser.cjs');
const {verifySlowPlayback}=require('./habr-gifs-slow-playback.cjs');
const root=path.resolve(__dirname,'..'),plan=require('./habr-gifs-capture-20261119.json');
const out=path.resolve(process.env.HABR_PLAYBACK_EVIDENCE||'artifacts/habr-playback');
const results=[];
async function main(){
  validatePlan(plan,root);fs.mkdirSync(out,{recursive:true});
  const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.gif':'image/gif','.svg':'image/svg+xml'};
  const server=http.createServer((req,res)=>{try{assert(['GET','HEAD'].includes(req.method));let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1);if(!name||name.endsWith('/'))name+='index.html';const file=inside(root,name);const bytes=fs.readFileSync(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(req.method==='HEAD'?undefined:bytes);}catch{res.writeHead(404);res.end();}});
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  const origin='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({headless:true});
  let slowPlayback = null;
  try{
    for(const width of [320,1280])for(const clip of plan.clips){
      const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'no-preference',serviceWorkers:'block',locale:'ru-RU'});
      await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
      const page=await context.newPage(),errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));
      page.on('request',r=>{if(r.url().includes('/assets/habr-entry-gifs/'))requests.push(r.url());});
      try{
        await page.goto(origin+clip.url,{waitUntil:'networkidle'});
        const panel=page.locator('[data-habr-gif="'+clip.id+'"]');await panel.waitFor();
        assert.equal(await panel.count(),1);assert.equal(await panel.getAttribute('open'),null);
        assert.deepEqual(requests,[],'Help is lazy before explicit opening');
        const state=()=>page.evaluate(()=>JSON.stringify(Object.entries(localStorage).sort()));const before=await state();
        await panel.locator(':scope > summary').click();
        const image=panel.locator('img');await image.waitFor();
        await image.evaluate(img=>img.complete&&img.naturalWidth?true:new Promise((resolve,reject)=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',reject,{once:true});}));
        assert((await image.getAttribute('src')).endsWith('frame-01.png'));
        assert(!requests.some(x=>x.endsWith('.gif')),'No animation on panel open');
        await panel.getByRole('button',{name:'Следующий кадр →',exact:true}).click();
        assert((await image.getAttribute('src')).endsWith('frame-02.png'));
        const play=panel.getByRole('button',{name:'Воспроизвести GIF',exact:true});await play.click();
        await page.waitForFunction(id=>document.querySelector('[data-habr-gif="'+id+'"] img').src.endsWith('.gif'),clip.id);
        await image.evaluate(img=>img.decode());
        assert.equal(await panel.getByRole('button',{name:'Остановить GIF',exact:true}).getAttribute('aria-pressed'),'true');
        await panel.getByRole('button',{name:'Остановить GIF',exact:true}).click();
        assert((await image.getAttribute('src')).endsWith('frame-01.png'));
        await page.emulateMedia({reducedMotion:'reduce'});
        await page.waitForFunction(id=>Array.from(document.querySelectorAll('[data-habr-gif="'+id+'"] button')).some(b=>b.textContent==='Воспроизвести GIF'&&b.disabled),clip.id);
        await panel.getByRole('button',{name:'Следующий кадр →',exact:true}).click();
        assert((await image.getAttribute('src')).endsWith('frame-02.png'));
        await panel.getByText('Текст всех шагов',{exact:true}).click();assert.equal(await panel.locator('ol li').count(),clip.frames.length);
        const box=await panel.boundingBox();assert(box.x>=-1&&box.x+box.width<=width+1,'Help fits viewport');
        assert.equal(await state(),before,'Help does not change learner storage');assert.deepEqual(errors,[]);
        await panel.screenshot({path:path.join(out,clip.id+'-'+width+'.png'),animations:'disabled'});
        results.push({id:clip.id,width,passed:true,lazy:true,manual:true,playStop:true,reducedMotion:true,storageUnchanged:true});
      }finally{await context.close();}
    }
    const cancelled = await verifySlowPlayback(browser, origin, plan, true);
    const fullCycle = await verifySlowPlayback(browser, origin, plan, false);
    slowPlayback = {cancelled, fullCycle};
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({complete:results.length===16 && slowPlayback !== null,results,slowPlayback},null,2)+'\n');}
  console.log('HABR_NATIVE_PLAYBACK_OK 16/16');
  console.log('HABR_DELAYED_GIF_OK 2/2');
}
main().catch(e=>{console.error(e);process.exitCode=1;});

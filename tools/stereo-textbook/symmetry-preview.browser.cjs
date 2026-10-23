'use strict';
// Editorial preview only. No status mutation, production bundle or pupil writes.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),out=path.resolve(process.env.SYMMETRY_ARTIFACTS||'artifacts/symmetry-preview');
const manifest=require('./pending-symmetry/manifest.json');
fs.mkdirSync(out,{recursive:true});
const types={'.html':'text/html','.js':'application/javascript','.json':'application/json','.css':'text/css'};
const server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!p.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(p,(e,b)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',types[path.extname(p)]||'application/octet-stream');res.end(b);});});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;const errors=[],evidence={cards:15,widths:[390,1280],views:[],journeys:[],completed:false};
 try{
  browser=await chromium.launch({headless:true});
  for(const width of evidence.widths){
   const page=await browser.newPage({viewport:{width,height:950}});
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(`http://127.0.0.1:${server.address().port}/tools/stereo-textbook/pending-symmetry/preview.html`);
   await page.waitForFunction(()=>window.symmetryPreview?.cards?.length===15);
   for(let i=0;i<manifest.cards.length;i++){
    const id=manifest.cards[i];await page.selectOption('#lesson',String(i));
    assert.equal(await page.locator('#steps article').count(),0);
    await page.locator('#work').fill('Проверочная запись');
    const card=await page.evaluate(i=>symmetryPreview.cards[i],i);
    assert.equal(card.status,'in-review');
    await page.screenshot({path:path.join(out,`${width}-${id}-initial.png`),fullPage:true});
    for(const name of Object.keys(card.visualization.model.views)){
     assert(await page.evaluate(name=>symmetryPreview.mount.setView(name),name));
     assert(!/NaN|Infinity/.test(await page.locator('#model svg').evaluate(n=>n.outerHTML)));
     await page.locator('#model').screenshot({path:path.join(out,`${width}-${id}-${name}.png`)});
     evidence.views.push({id,width,name});
    }
    for(let j=0;j<card.steps.length;j++){
     await page.locator('#next').click();
     assert.equal(await page.locator('#steps article').count(),j+1,'previous steps persist');
     assert.equal(await page.locator('#work').inputValue(),'Проверочная запись');
    }
    if(card.help.length){await page.locator('#help summary').first().click();assert.equal(await page.locator('#work').inputValue(),'Проверочная запись');}
    assert(await page.locator('#next').isDisabled());
    const dims=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));
    assert(dims.scroll<=dims.width+1,`${id} horizontal overflow at ${width}`);
    await page.screenshot({path:path.join(out,`${width}-${id}-complete.png`),fullPage:true});
    evidence.journeys.push({id,width,steps:card.steps.length,draftRetained:true});
   }
   await page.close();
  }
  assert.deepEqual(errors,[]);assert.equal(evidence.views.length,86);assert.equal(evidence.journeys.length,30);evidence.completed=true;
  console.log('SYMMETRY_PREVIEW_BROWSER_OK: 30 journeys; 86 model states; no console errors or page overflow');
 }finally{evidence.errors=errors;fs.writeFileSync(path.join(out,'evidence.json'),JSON.stringify(evidence,null,2));await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});

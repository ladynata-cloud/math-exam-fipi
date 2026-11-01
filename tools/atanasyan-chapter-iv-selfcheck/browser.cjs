'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),dir=path.join(root,'content-drafts/atanasyan-chapter-iv-selfcheck');
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
const out=path.resolve(process.env.SELFCHECK_ARTIFACTS||'artifacts/atanasyan-iv-selfcheck');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(data);});
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const evidence={completed:false,widths:[320,390,1280],journeys:[],views:[],screenshots:[],errors:[],cardHashes:{}};
 let browser;
 async function capture(page,filename,selector){
  const file=path.join(out,filename);if(selector)await page.locator(selector).screenshot({path:file});else await page.screenshot({path:file,fullPage:true});
  evidence.screenshots.push({file:filename,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')});
 }
 async function layout(page,id,stage){
  const data=await page.evaluate(()=>{
   const svg=document.querySelector('#model svg'),vb=svg.viewBox.baseVal;
   return {pageOverflow:document.documentElement.scrollWidth-innerWidth,labels:[...svg.querySelectorAll('[data-label]')].filter(n=>n.tagName.toLowerCase()==='text').map(n=>{const b=n.getBBox();return {label:n.dataset.label,x:b.x,y:b.y,w:b.width,h:b.height};}),width:vb.width,height:vb.height};
  });
  assert(data.pageOverflow<=1,`${id} ${stage}: page overflow`);
  for(const b of data.labels) assert(b.x>=-1&&b.y>=-1&&b.x+b.w<=data.width+1&&b.y+b.h<=data.height+1,`${id} ${stage}: label outside figure ${b.label}`);
 }
 try {
  browser=await chromium.launch({headless:true});
  for(const width of evidence.widths){
   const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage();
   page.on('pageerror',e=>evidence.errors.push(e.message));
   await page.goto(`http://127.0.0.1:${server.address().port}/content-drafts/atanasyan-chapter-iv-selfcheck/index.html`);
   await page.waitForFunction(()=>window.selfcheckPreview?.cards.length===13);
   for(let i=0;i<manifest.cards.length;i++){
    const id=manifest.cards[i],raw=fs.readFileSync(path.join(dir,id+'.json')),card=JSON.parse(raw);
    evidence.cardHashes[id]=crypto.createHash('sha256').update(raw).digest('hex');
    await page.selectOption('#lesson',String(i));await page.evaluate(()=>scrollTo(0,0));
    assert.equal(await page.locator('#steps article').count(),0);assert.equal(await page.locator('#help').getAttribute('open'),null);
    assert.equal((await page.locator('#condition').textContent()).replace(/\s+/g,''),card.statement.text.replace(/\s+/g,''));
    assert.equal(await page.locator('#model svg').getAttribute('role'),'img');
    await capture(page,`${width}-${id}-initial.png`);
    const box=await page.locator('#model svg').boundingBox();assert(box.y<900&&box.y+box.height<900,`${id}: condition and complete figure on first screen at ${width}: ${JSON.stringify(box)}`);
    await layout(page,id,'initial');
    await page.locator('#work').fill('Проверочная запись 123');
    const initial=await page.locator('#model svg').innerHTML();await page.getByRole('button',{name:'Повернуть вправо',exact:true}).click();
    assert.notEqual(await page.locator('#model svg').innerHTML(),initial);await page.getByRole('button',{name:'Вернуть исходный вид',exact:true}).click();
    for(const name of Object.keys(card.visualization.model.views)){
     assert(await page.evaluate(name=>selfcheckPreview.mount.setView(name),name));
     assert(!/NaN|Infinity/.test(await page.locator('#model svg').evaluate(n=>n.outerHTML)));
     await layout(page,id,name);await capture(page,`${width}-${id}-${name}.png`,'#model');evidence.views.push({id,width,name});
    }
    await page.locator('#help > summary').click();
    for(const h of card.help){await page.locator(`[data-help="${h.id}"] > summary`).click();assert.equal(await page.locator('#work').inputValue(),'Проверочная запись 123');}
    for(let j=0;j<card.steps.length;j++){
     await page.locator('#next').click();assert.equal(await page.locator('#steps article').count(),j+1,'previous steps retained');
     await page.locator(`[data-explanation="${card.steps[j].id}"] > summary`).click();
     assert.equal(await page.locator('#work').inputValue(),'Проверочная запись 123');
    }
    assert(await page.locator('#next').isDisabled());await layout(page,id,'complete');await capture(page,`${width}-${id}-complete.png`);
    const keys=await page.evaluate(()=>({local:Object.keys(localStorage),session:Object.keys(sessionStorage)}));assert.deepEqual(keys,{local:[],session:[]},'editorial preview never writes pupil storage');
    const next=(i+1)%manifest.cards.length;await page.selectOption('#lesson',String(next));await page.selectOption('#lesson',String(i));
    assert.equal(await page.locator('#work').inputValue(),'Проверочная запись 123','in-memory draft survives card selection');
    evidence.journeys.push({id,width,steps:card.steps.length,sourceQuestion:card.source.exercise,reviewStatus:card.status});
   }
   await context.close();
  }
  assert.equal(evidence.views.length,135);assert.equal(evidence.journeys.length,39);assert.equal(evidence.screenshots.length,213);assert.deepEqual(evidence.errors,[]);
  evidence.completed=true;console.log('ATANASYAN_IV_SELFCHECK_BROWSER_OK: 39 journeys; 135 model states; 213 screenshots; 320/390/1280px; no storage writes');
 }finally{fs.writeFileSync(path.join(out,'evidence.json'),JSON.stringify(evidence,null,2));await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});

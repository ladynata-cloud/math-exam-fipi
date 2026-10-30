// Expanded reference panels must stay usable beside real unfinished textbook work.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..');
const out=path.join(root,'artifacts/vilenkin6-textbook-support');
const KEY='mathexam-vilenkin6-textbook-2024-v1';
const taskId='v6-book-2-14-а-270';
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png'};
const server=http.createServer((req,res)=>{
  let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch(_){res.writeHead(400).end();return;}
  let file=path.resolve(root,'.'+name);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  if(name.endsWith('/'))file=path.join(file,'index.html');
  fs.readFile(file,(err,body)=>{if(err){res.writeHead(404).end();return;}res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'}).end(body);});
});
let browser;
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  fs.mkdirSync(out,{recursive:true});
  browser=await chromium.launch({headless:true,...(process.env.VILENKIN_CHROMIUM_PATH?{executablePath:process.env.VILENKIN_CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--no-zygote','--single-process']}: {})});
  const errors=[];
  for(const width of [320,390,1280]){
    const context=await browser.newContext({viewport:{width,height:900}});
    const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/courses/vilenkin-6-part-1/textbook.html#unit/6/task/${encodeURIComponent(taskId)}`);
    await page.waitForFunction(()=>window.VilenkinTextbook?.ready);
    assert.equal(await page.locator('[data-study-support] details[open]').count(),0);
    assert((await page.locator('.source').innerText()).includes('Пункт 6 · § 2'));
    await page.locator('#answer').fill('2 · 3 · ');
    const condition=await page.locator('.prompt').innerText();
    await page.locator('[data-v6-support="prime-table"] > summary').click();
    await page.locator('[data-v6-prime-limit]').selectOption('1000');
    await page.locator('[data-v6-support="divisibility"] > summary').click();
    await page.locator('[data-v6-support="prerequisites"] > summary').click();
    assert.equal(await page.locator('[data-v6-primes] li').count(),168);
    assert.equal(await page.locator('[data-v6-primes] li').last().innerText(),'997');
    assert.equal(await page.locator('[data-study-support] details[open]').count(),3);
    assert.equal(await page.locator('#answer').inputValue(),'2 · 3 · ');
    assert.equal(await page.locator('.prompt').innerText(),condition);
    const state=await page.evaluate(([key,id])=>JSON.parse(localStorage.getItem(key)).tasks[id],[KEY,taskId]);
    assert.equal(state.helped,true);assert.equal(state.status,'');assert.equal(state.attempts,0);
    const bounds=await page.evaluate(()=>({
      width:innerWidth,scroll:document.documentElement.scrollWidth,
      outside:[...document.querySelectorAll('[data-study-support] select,[data-v6-primes] li,[data-v6-practice],.v6-support-fraction')].filter(node=>{
        const r=node.getBoundingClientRect();return r.width<=0||r.left < -1||r.right>innerWidth+1;
      }).map(node=>node.textContent.slice(0,40)),
      splitNumbers:[...document.querySelectorAll('[data-v6-primes] li')].filter(node=>{
        const range=document.createRange();range.selectNodeContents(node);
        return range.getClientRects().length!==1||node.scrollWidth>node.clientWidth+1;
      }).map(node=>node.textContent)
    }));
    assert(bounds.scroll<=bounds.width+1,`expanded panels overflow page at ${width}: ${JSON.stringify(bounds)}`);
    assert.deepEqual(bounds.outside,[],`reference elements must stay within the ${width}px viewport`);
    assert.deepEqual(bounds.splitNumbers,[],`every prime must remain an unbroken readable number at ${width}px`);
    for(const link of await page.locator('[data-v6-practice]').all()){
      assert.equal(await link.getAttribute('target'),'_blank');
      assert.match(await link.getAttribute('rel'),/noopener/);
      const href=new URL(await link.getAttribute('href'));assert.equal(href.search,'');assert.equal(href.hash,'');
    }
    if(width===320){
      await page.locator('[data-v6-support="prime-table"] > summary').scrollIntoViewIfNeeded();
      await page.screenshot({path:path.join(out,'mobile-320-primes-expanded.png')});
      await page.locator('[data-v6-prime-limit]').evaluate(node=>node.scrollIntoView({block:'start'}));
      await page.screenshot({path:path.join(out,'mobile-320-prime-grid.png')});
      await page.locator('[data-v6-support="prerequisites"] > summary').scrollIntoViewIfNeeded();
      await page.screenshot({path:path.join(out,'mobile-320-prerequisites-expanded.png')});
    }
    await context.close();
  }
  assert.deepEqual(errors,[]);
  const result={gate:'VILENKIN6_EXPANDED_SUPPORT_OK',status:'PASS',widths:[320,390,1280],primeCount:168,flows:['source caption','all reference panels expanded','draft preserved','no automatic task completion','help recorded','practice links isolated','no horizontal overflow']};
  fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.close();});

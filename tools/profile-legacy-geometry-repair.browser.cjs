'use strict';
// Disposable local origin and synthetic input only. No production sessions.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const shots=process.env.PROFILE_LEGACY_GEOMETRY_SHOTS||'/tmp/profile-legacy-geometry-shots';
const server=http.createServer((req,res)=>{
  try {
    let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://fixture').pathname));
    if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
    if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
    res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');
    res.end(fs.readFileSync(file));
  }catch(_){res.writeHead(404).end();}
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port;
  let browser,checks=0,pages=0;
  try {
    browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--enable-unsafe-swiftshader']});
    fs.mkdirSync(shots,{recursive:true});
    for(const width of [320,390,1280]){
      const context=await browser.newContext({viewport:{width,height:900},hasTouch:width<600});
      await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
      const page=await context.newPage(),errors=[];
      page.setDefaultTimeout(15000);
      page.on('pageerror',error=>errors.push({url:page.url(),message:error.message}));
      async function visit(file){
        await page.goto(origin+'/ege-profil/trainers/'+file);
        await page.locator('#profile-course-nav').waitFor();
        pages++;
      }
      async function fits(label){
        const result=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,svgs:[...document.querySelectorAll('svg')].filter(svg=>svg.getBoundingClientRect().width>0).map(svg=>svg.outerHTML)}));
        assert(result.scroll<=result.width+1,label+': horizontal overflow '+JSON.stringify({width:result.width,scroll:result.scroll}));
        result.svgs.forEach(svg=>assert.doesNotMatch(svg,/NaN|Infinity|undefined/,label+': finite diagram'));
        checks++;
      }
      async function shot(name){await page.screenshot({path:path.join(shots,width+'-'+name+'.png'),fullPage:true});}
      async function requestCourseHelp(){
        await page.locator('#profile-course-help').click();
        await page.locator('[data-course-help]').first().click();
        await page.frameLocator('#profile-course-support iframe').locator('main h1').waitFor();
        await page.locator('#profile-course-return').click();
      }

      await visit('planimetry-t1.html');
      for(let type=0;type<8;type++){
        await page.evaluate(type=>openSolo(type),type);
        assert(await page.locator('#cv').isVisible()); await fits('planimetry type '+type);
      }
      await page.evaluate(()=>openSolo(0));
      const planAnswer=await page.evaluate(()=>__dbg().state.t.answer);
      await page.locator('#ansInput').fill(planAnswer+'abc'); await page.locator('#checkBtn').click();
      assert.equal(await page.evaluate(()=>__dbg().state.done),false,'invalid numeric suffix remains unsolved');
      await page.locator('#ansInput').fill(String(planAnswer*2)+'/2'); await page.locator('#checkBtn').click();
      assert.equal(await page.evaluate(()=>__dbg().state.done),true,'complete fraction is evaluated');
      await page.evaluate(()=>{openGuided(1);choicePick(__dbg().state.recogCi);});
      assert(await page.locator('#constructLink').isVisible(),'construction control is available');
      await fits('planimetry construction'); await shot('planimetry-construction');
      await page.locator('#constructLink').click();
      assert.equal(await page.evaluate(()=>__dbg().state.t.cDone),true);

      await visit('pryamougolny-treugolnik-trenazher.html#t1');
      for(let topic=0;topic<6;topic++){
        await page.locator('#topics [data-topic="'+topic+'"]').click();
        assert(await page.locator('.figure svg').first().isVisible(),'right triangle diagram '+topic);
        assert.equal(await page.locator('details.memo').evaluate(node=>node.open),false);
        await fits('right triangle topic '+topic);
      }
      await page.locator('details.memo summary').click();
      assert.equal(await page.locator('details.memo').evaluate(node=>node.open),true);
      await page.locator('details.memo summary').click(); await shot('right-triangle');

      await visit('planimetry-yashchenko-t1.html');
      const groups={tri:['t1','t4','t6','t8','t10','t12'],par:['t2','t3','t18'],trap:['t7','t15','t16','t17'],circ:['t5','t9','t11','t13','t14','t19']};
      for(const [group,types] of Object.entries(groups)){
        await page.locator('#groups [data-group="'+group+'"]').click();
        for(const type of types){
          await page.locator('#types [data-type="'+type+'"]').click();
          assert(await page.locator('#taskArea .figwrap svg').isVisible(),'planimetry diagram '+type);
          await fits('Yashchenko planimetry '+type);
        }
      }
      await shot('planimetry-yashchenko');

      await visit('vectors-t2.html');
      assert.equal(await page.locator('details.box').evaluate(node=>node.open),false);
      for(const type of ['coords','dot','shapes','angle','mix']){
        await page.locator('.tab[data-mode="'+type+'"]').click();
        await fits('vectors '+type);
      }
      await page.locator('.tab[data-mode="shapes"]').click();
      await page.locator('#modeFast').click();
      const vectorAnswer=await page.evaluate(()=>cur.answer);
      for(let attempt=0;attempt<2;attempt++){
        await page.locator('#ans').fill(String(vectorAnswer+1));await page.locator('#checkBtn').click();
        assert(await page.locator('#ans').isEnabled());
        assert.equal(await page.locator('#solution').isVisible(),false);
      }
      await shot('vectors-retry');
      await page.locator('#ans').fill(String(vectorAnswer));await page.locator('#checkBtn').click();
      assert.match(await page.locator('#feedback').innerText(),/Верно после исправления/);
      await page.locator('#solBtn').click(); assert(await page.locator('#solution').isVisible());

      await visit('vectors-yashchenko-t2.html');
      for(let i=1;i<=7;i++){
        await page.locator('#types [data-type="v'+i+'"]').click();
        await fits('Yashchenko vectors v'+i);
      }
      assert(await page.locator('#taskArea .figwrap svg').isVisible());await shot('vectors-grid');

      await visit('stereo/index.html');await fits('stereo catalogue');
      assert.equal(await page.locator('#cards .card').count(),11);
      const topics=await page.evaluate(()=>TOPICS.slice());
      for(const topic of topics){
        await visit('stereo/trainer.html?topic='+encodeURIComponent(topic));
        await page.locator('#viewport canvas').waitFor();
        assert(await page.locator('#viewport canvas').isVisible());
        assert(await page.locator('#btnConstruct').isVisible(),'construction for '+topic);
        const condition=await page.locator('#probCond').innerText();
        await page.locator('#btnConstruct').click();
        assert.equal(await page.locator('#btnConstruct').evaluate(node=>node.classList.contains('on')),true);
        assert.equal(await page.locator('#probCond').innerText(),condition);
        await fits('stereo '+topic);
        if(topic==='Параллелепипед'){
          await shot('stereo-construction');
          const task=await page.evaluate(()=>PROBLEMS.find(p=>(p.topic||'Параллелепипед')==='Параллелепипед'));
          await page.locator('#answer').fill(String(task.ans));
          await requestCourseHelp();
          assert.equal(await page.locator('#answer').inputValue(),String(task.ans),'external help preserves the draft');
          assert.equal(await page.locator('#probCond').innerText(),condition);
          await page.locator('#btnCheck').click();
          const result=await page.evaluate(id=>JSON.parse(localStorage.getItem('stereo3.status'))[id],task.id);
          assert.equal(result.assisted,true);assert.notEqual(result.st,'ok','supported answer is not an independent success');
        }
        await page.locator('#btnConstruct').click();
        await page.locator('#btnHome').click();
      }

      for(const [query,label] of [['basic','задание 4'],['compound','задание 5']]){
        await visit('probability-t45.html?topic='+query);
        await page.locator('.tab[data-view="drill"]').click();
        assert.equal(await page.locator('#modeChips [aria-pressed="true"]').innerText(),label);
        for(let attempt=0;attempt<2;attempt++){
          await page.locator('#dAnswer').fill('-2');await page.locator('#dCheck').click();
          assert.equal(await page.locator('#dSolBox').isVisible(),false);
        }
        await fits('probability '+query);
        if(query==='compound')await shot('probability-help-request');
        await page.locator('#dSol').click();assert(await page.locator('#dSolBox').isVisible());
      }
      assert.deepEqual(errors,[],'no browser errors at width '+width);
      await context.close();
    }
    console.log('PROFILE_LEGACY_GEOMETRY_REPAIR_BROWSER_OK',JSON.stringify({widths:[320,390,1280],banks:7,pages,checks,shots}));
  }finally{if(browser)await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;server.close();});

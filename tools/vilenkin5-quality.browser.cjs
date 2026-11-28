'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),shots=process.env.V5_QUALITY_SHOTS||'/tmp/vilenkin5-quality-shots';
fs.mkdirSync(shots,{recursive:true});
const server=http.createServer((req,res)=>{
  let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://fixture').pathname));
  if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
  try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');const ext=path.extname(file);res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.gif':'image/gif','.svg':'image/svg+xml'})[ext]||'text/html');res.end(fs.readFileSync(file));}catch(_){res.writeHead(404).end();}
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port,base=origin+'/school/index.html?course=vilenkin5';
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox']});
  try{
    const errors=[];
    const newLearnerPage=async()=>{const next=await browser.newPage({viewport:{width:1360,height:950}});next.setDefaultTimeout(10000);next.on('pageerror',e=>errors.push(e.message));return next;};
    let page=await newLearnerPage();
    const go=async route=>{await page.goto(base+route);await page.locator('#main[data-v5-quality]').waitFor();};
    await go('#course/vilenkin5');assert.equal(await page.locator('.v5-unit-card').count(),53);assert.equal(await page.locator('.v5q-quick-links a').count(),4);
    await page.screenshot({path:path.join(shots,'course-desktop.png'),fullPage:true});
    const ids=await page.evaluate(()=>WorkshopCurriculum.pathById.vilenkin5.ids);
    // Every canonical lesson mounts its actual visual, including all of part two.
    for(const [i,id]of ids.entries()){
      await page.evaluate(id=>{location.hash='#lesson/'+id;},id);await page.waitForFunction(id=>Vilenkin5Quality.getState().scene?.id===id,id);
      await page.locator('#model svg,#model table,#model .arithmetic-model,#model .g5-lab').first().waitFor();
      assert.equal(await page.locator('.v6-worked li').count(),3);
      assert.notEqual(await page.locator('label[for=answer]').innerText(),'Твой ответ');
      const answers=await page.evaluate(()=>{
        const scene=Vilenkin5Quality.getState().scene,task=WorkshopMath.generate(scene.id,scene.seed);
        const fmt=value=>Array.isArray(value)?value.map(fmt).join(';'):value&&typeof value==='object'?WorkshopMath.fmt(value):String(value);
        return [...task.steps,task].map(part=>{
          if(part.answerFormat==='prime-factors')return part.answer.join('*');
          const number=part.answer&&typeof part.answer==='object'?part.answer.n/part.answer.d:Number(part.answer);
          return part.answerFormat==='decimal'&&Number.isInteger(number)?number+'.0':fmt(part.answer);
        });
      });
      for(const [step,answer]of answers.entries()){
        await page.locator('#answer').fill(answer);await page.locator('#answer-form button').click();
        assert.equal(await page.locator('.feedback.error').count(),0,id+' guided step '+step);
        const accepted=await page.evaluate(()=>Vilenkin5Quality.getState().scene);
        assert.equal(accepted.mode,'learn',id+' remains a guided lesson');
        assert.equal(accepted.step,step,id+' current guided step');
        assert.equal(accepted.correct,true,id+' accepted answer '+step);
        assert.equal(accepted.savedInput,answer,id+' preserves accepted answer '+step);
        if(step<answers.length-1)await page.locator('[data-cmd=next]').click();
      }
      assert.equal(await page.locator('#answer').isDisabled(),true,id+' completed answer is frozen');
      if((i+1)%35===0||i===ids.length-1)console.log('V5 guided flows',i+1);
      // Isolate the following reload/model journeys from this completed synthetic cohort.
      if(i===ids.length-1)await page.evaluate(()=>{localStorage.removeItem(WorkshopState.KEY);localStorage.removeItem(Vilenkin5Quality.key);});
    }
    // Fragment navigation retains live records even after storage is cleared.
    // A separate browsing context gives the next learner a genuinely fresh document.
    await page.close();page=await newLearnerPage();
    await go('#lesson/v5f-division-column');
    await page.waitForFunction(()=>{const scene=window.Vilenkin5Quality?.getState().scene;return scene?.id==='v5f-division-column'&&scene.mode==='learn'&&scene.step===0&&!scene.correct&&document.querySelector('#answer')?.disabled===false;});
    await page.locator('[data-v5-prediction]').fill('3');await page.locator('#model form button').click();
    assert.equal(await page.evaluate(()=>Vilenkin5Quality.getState().scene.model.step),1);
    assert.match(await page.locator('.arithmetic-division strong').innerText(),/3/);
    await page.locator('#answer').fill('неоконченное решение');
    await page.locator('.v5q-notes > details > summary').click();
    await page.waitForFunction(()=>document.querySelector('.v5q-notes > details')?.open&&Vilenkin5Quality.getState().scene?.panels.notes===true);
    await page.locator('#v5-quality-note').fill('Подбираю цифру частного. Проверяю умножением.');
    await page.reload();await page.locator('#main[data-v5-quality=lesson]').waitFor();
    assert.equal(await page.locator('#answer').inputValue(),'неоконченное решение');assert.equal(await page.locator('#v5-quality-note').inputValue(),'Подбираю цифру частного. Проверяю умножением.');
    assert.equal(await page.evaluate(()=>Vilenkin5Quality.getState().scene.model.step),1);
    await page.screenshot({path:path.join(shots,'division-desktop.png'),fullPage:true});
    await page.locator('[data-cmd=mode][data-value=check]').click();const seed=await page.evaluate(()=>Vilenkin5Quality.getState().scene.seed);await page.locator('#answer').fill('123');await page.locator('[data-cmd=mode][data-value=learn]').click();await page.locator('[data-cmd=mode][data-value=check]').click();
    assert.equal(await page.locator('#answer').inputValue(),'123');assert.equal(await page.evaluate(()=>Vilenkin5Quality.getState().scene.seed),seed);assert.equal(await page.evaluate(()=>Vilenkin5Quality.getState().scene.assisted),true);
    await go('#lesson/v5f-fraction-divide');
    for(const [key,value]of [['an','1'],['ad','2'],['bn','3'],['bd','4']]){await page.locator('[data-v5-param='+key+']').fill(value);await page.locator('[data-v5-param='+key+']').dispatchEvent('change');}
    await page.locator('[data-v5-prediction]').fill('2/3');await page.locator('[data-v5-predict] button').click();assert.match(await page.locator('.v5q-model-feedback').innerText(),/подтвердился/);
    await page.screenshot({path:path.join(shots,'fraction-portions-desktop.png'),fullPage:true});
    await go('#lesson/v5f-round-decimal');await page.locator('[data-v5-prediction]').fill('3,5');await page.locator('[data-v5-predict] button').click();assert.match(await page.locator('.v5q-model-feedback').innerText(),/подтвердился/);
    await page.screenshot({path:path.join(shots,'rounding-desktop.png'),fullPage:true});
    // Fetch the actual GIF files in Chromium; default and reload stay still.
    await go('#lesson/v5f-division-column');
    await page.locator('.v5-media > summary').click();
    await page.waitForFunction(()=>document.querySelector('.v5-media')?.open&&Vilenkin5Quality.getState().scene?.media.open===true);
    await page.waitForFunction(()=>{const im=document.querySelector('.v5-media img');return im?.complete&&im.naturalWidth===640&&im.src.endsWith('.png');});
    await page.locator('[data-v5-gif-toggle]').click();
    await page.waitForFunction(()=>{const im=document.querySelector('.v5-media img');return im?.complete&&im.naturalWidth===640&&im.src.endsWith('.gif');});
    assert.equal(await page.evaluate(()=>Vilenkin5Quality.getState().scene.media.playing),true);
    assert.equal(await page.evaluate(()=>Vilenkin5Quality.getState().scene.assisted),true);
    await page.screenshot({path:path.join(shots,'gif-division-desktop.png'),fullPage:true});
    await page.locator('[data-v5-gif-toggle]').click();
    assert.match(await page.locator('.v5-media img').getAttribute('src'),/\.png$/);
    await page.reload();await page.locator('.v5-media').waitFor();
    assert.equal(await page.evaluate(()=>Vilenkin5Quality.getState().scene.media.playing),false);
    await page.setViewportSize({width:320,height:850});await page.emulateMedia({reducedMotion:'reduce'});
    await page.locator('[data-v5-gif-toggle]').click();
    await page.waitForFunction(()=>document.querySelector('.v5-media img')?.src.endsWith('.gif'));
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'GIF mobile overflow');
    await page.screenshot({path:path.join(shots,'gif-division-mobile.png'),fullPage:true});
    await page.locator('[data-v5-gif-toggle]').click();
    await page.emulateMedia({reducedMotion:'no-preference'});
    await go('#lesson/v5f-angle-build');await page.locator('[data-v5-param=angle]').fill('90');await page.locator('[data-v5-param=angle]').dispatchEvent('change');assert.equal(await page.locator('.v5q-right-angle').count(),1);
    for(const [route,name]of [['#course/vilenkin5','course'],['#lesson/v5f-division-column','division'],['#lesson/v5f-fraction-add','fractions'],['#lesson/v5f-decimal-borrow','decimals'],['#lesson/v5f-round-decimal','rounding'],['#lesson/v5f-angle-build','angle']]){
      await page.setViewportSize({width:320,height:850});await go(route);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+' mobile overflow');await page.screenshot({path:path.join(shots,name+'-mobile.png'),fullPage:true});
    }
    // Review the exact mobile-label boundary cases using the real model controls.
    const setModel=async values=>{for(const [key,value]of Object.entries(values)){const control=page.locator('[data-v5-param='+key+']');await control.fill(String(value));await control.dispatchEvent('change');assert.equal(await page.evaluate(key=>Vilenkin5Quality.getState().scene.model[key],key),value,'model control '+key);}};
    const visualMetrics=[];
    const captureModel=async name=>{
      await page.locator('#model').scrollIntoViewIfNeeded();
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+' mobile overflow');
      const metrics=await page.locator('#model').evaluate(host=>Array.from(host.querySelectorAll('svg')).map(svg=>{
        const frame=svg.getBoundingClientRect();
        const labels=Array.from(svg.querySelectorAll('text')).map(node=>{const box=node.getBoundingClientRect(),matrix=node.getScreenCTM();return{text:node.textContent,fontPx:parseFloat(getComputedStyle(node).fontSize)*Math.hypot(matrix.c,matrix.d),left:box.left-frame.left,right:box.right-frame.left,top:box.top-frame.top,bottom:box.bottom-frame.top};});
        return{width:frame.width,height:frame.height,labels};
      }));
      assert(metrics.length>0,name+' has a real diagram');
      for(const diagram of metrics)for(const [i,label]of diagram.labels.entries()){
        assert(label.fontPx>=16,name+' readable physical font for '+label.text+': '+label.fontPx);
        assert(label.left>=-1&&label.right<=diagram.width+1&&label.top>=-1&&label.bottom<=diagram.height+1,name+' label stays inside diagram: '+label.text);
        for(const other of diagram.labels.slice(i+1)){const overlapX=Math.min(label.right,other.right)-Math.max(label.left,other.left),overlapY=Math.min(label.bottom,other.bottom)-Math.max(label.top,other.top);assert(overlapX<=1||overlapY<=1,name+' overlapping labels: '+label.text+' / '+other.text);}
      }
      const legends=await page.locator('#model .v5q-model-legend p').evaluateAll(nodes=>nodes.map(node=>({text:node.textContent,fontPx:parseFloat(getComputedStyle(node).fontSize)})));
      for(const label of legends)assert(label.fontPx>=16,name+' readable HTML legend: '+label.fontPx);
      visualMetrics.push({name,diagrams:metrics,legends});
      await page.locator('#model').screenshot({path:path.join(shots,name+'-mobile.png')});
    };
    const numericModelCase=async({id,values,input,numerator,denominator=1,name})=>{
      await go('#lesson/'+id);await setModel(values);
      const actual=await page.evaluate(()=>{const scene=Vilenkin5Quality.getState().scene,answer=Vilenkin5QualityModels.describe(WorkshopCurriculum.byId[scene.id],scene.model,WorkshopMath).answer;return typeof answer==='number'?{n:answer,d:1}:answer;});
      assert.equal(actual.n*denominator,numerator*actual.d,name+' independent exact answer');
      await page.locator('[data-v5-prediction]').fill(input);await page.locator('[data-v5-predict] button').click();
      assert.match(await page.locator('.v5q-model-feedback').innerText(),/подтвердился/);
      assert.equal(await page.evaluate(()=>Vilenkin5Quality.getState().scene.model.first),input,name+' records the accepted prediction');
      await captureModel(name);
    };
    for(const example of [
      {id:'v5f-fraction-add',values:{an:3,ad:2,bn:3,bd:2},input:'3',numerator:3,name:'fraction-three-wholes'},
      {id:'v5f-fraction-add',values:{an:12,ad:2,bn:12,bd:2},input:'12',numerator:12,name:'fraction-twelve-wholes'},
      {id:'v5f-fraction-divide',values:{an:1,ad:2,bn:3,bd:2},input:'1/3',numerator:1,denominator:3,name:'fraction-third-portion'},
      {id:'v5f-round-decimal',values:{a:999,places:1},input:'10',numerator:10,name:'rounding-999'},
      {id:'v5f-percent-part',values:{total:200,percent:100},input:'200',numerator:200,name:'percent-full-200'},
      {id:'v5f-mean-share',values:{a:12,b:12,c:12},input:'12',numerator:12,name:'mean-twelve'}
    ])await numericModelCase(example);
    await go('#lesson/v5f-angle-build');
    for(const angle of [0,90,145,150,180]){
      await setModel({target:90,angle});
      const measured=await page.locator('#model svg.v5q-plot--angle').evaluate(svg=>{const points=Array.from(svg.querySelectorAll('circle')),origin=points[0],end=points[2],dx=Number(end.getAttribute('cx'))-Number(origin.getAttribute('cx')),dy=Number(end.getAttribute('cy'))-Number(origin.getAttribute('cy'));return Math.atan2(-dy,dx)*180/Math.PI;});
      assert(Math.abs(measured-angle)<1e-8,'rendered ray measures '+angle+' degrees');
      assert.equal(await page.locator('#model .v5q-right-angle').count(),angle===90?1:0,'right-angle mark only at 90');
      await page.locator('[data-v5-prediction]').fill('90');await page.locator('[data-v5-predict] button').click();
      assert.equal(await page.evaluate(()=>Vilenkin5Quality.getState().scene.model.seen),angle===90,'construction must match its target');
      if(angle===90)assert.match(await page.locator('.v5q-model-feedback').innerText(),/подтвердился/);
      else assert.match(await page.locator('.v5q-model-feedback').innerText(),/Сначала поверни/);
      await captureModel('protractor-'+angle);
    }
    fs.writeFileSync(path.join(shots,'mobile-model-metrics.json'),JSON.stringify(visualMetrics,null,2));
    await page.locator('#answer').focus();await page.keyboard.type('65');assert.equal(await page.locator('#answer').inputValue(),'65');
    await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>document.body.style.zoom='2');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'200% zoom overflow');
    assert.deepEqual(errors,[]);console.log(JSON.stringify({gate:'VILENKIN5_QUALITY_BROWSER_PASS',lessons:ids.length,screenshots:23,journeys:'134 guided flows, long division, draft/note/model reload, learning detour, fractional portions, rounding, actual GIF play/stop, focused mobile diagrams and readable labels, right-angle marker, keyboard and zoom'}));
  }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;server.close();});

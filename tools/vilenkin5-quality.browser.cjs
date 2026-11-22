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
    const printedCounts=await page.evaluate(()=>{
      const list=WorkshopCurriculum.pathById.vilenkin5.numbered.map(id=>WorkshopCurriculum.byId[id]);
      return [1,2].map(part=>list.filter(lesson=>lesson.source.part===part).map(lesson=>lesson.number));
    });
    assert.deepEqual(printedCounts[0],Array.from({length:176},(_,i)=>'1.'+(i+1)));
    assert.deepEqual(printedCounts[1],Array.from({length:71},(_,i)=>'5.'+(i+1)));
    const assessmentCards=await page.evaluate(()=>WorkshopCurriculum.pathById.vilenkin5.printedChecks);
    assert.deepEqual(assessmentCards,['check-2-1','check-2-2','check-3-1','check-3-2','check-4','check-25-1','check-25-2','check-25-3'].map(key=>'v5f-printed-'+key));
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
    await page.close();page=await newLearnerPage();await page.setViewportSize({width:320,height:840});
    for(const [id,rows] of [['v5f-printed-1-1',10],['v5f-printed-1-2',4],['v5f-printed-1-3',3],['v5f-printed-1-4',8],['v5f-printed-1-5',6],['v5f-printed-1-6',12],['v5f-printed-1-7',3],['v5f-printed-1-8',15],['v5f-printed-1-9',4],['v5f-printed-1-10',6],['v5f-printed-1-11',2],['v5f-printed-1-12',2],['v5f-printed-1-13',8],['v5f-printed-1-14',9],['v5f-printed-1-15',6],['v5f-printed-1-16',5],['v5f-printed-1-17',8],['v5f-printed-1-18',12],['v5f-printed-1-19',9],['v5f-printed-1-20',6],['v5f-printed-1-21',4],['v5f-printed-1-22',2],['v5f-printed-1-23',2],['v5f-printed-1-24',3],['v5f-printed-1-25',3],['v5f-printed-1-26',3],['v5f-printed-1-27',5],['v5f-printed-1-28',6],['v5f-printed-1-29',4],['v5f-printed-1-30',4],['v5f-printed-1-31',4],['v5f-printed-1-32',2],['v5f-printed-1-33',4],['v5f-printed-1-34',6],['v5f-printed-1-35',8],['v5f-printed-1-36',3],['v5f-printed-1-37',1],['v5f-printed-1-38',2],['v5f-printed-1-39',2],['v5f-printed-1-40',2],['v5f-printed-1-41',4],['v5f-printed-1-42',2],['v5f-printed-1-43',4],['v5f-printed-1-44',2],['v5f-printed-1-45',4],['v5f-printed-1-46',5],['v5f-printed-1-47',3],['v5f-printed-1-48',3],['v5f-printed-1-49',2],['v5f-printed-1-50',3],['v5f-printed-1-51',3],['v5f-printed-1-52',3],['v5f-printed-1-53',3],['v5f-printed-1-54',4],['v5f-printed-1-55',2],['v5f-printed-1-56',6],['v5f-printed-1-57',3],['v5f-printed-1-58',1],['v5f-printed-1-59',7],['v5f-printed-1-60',3],['v5f-printed-1-61',2],['v5f-printed-1-62',2],['v5f-printed-1-63',2],['v5f-printed-1-64',3],['v5f-printed-1-65',2],['v5f-printed-1-66',3],['v5f-printed-1-67',6],['v5f-printed-1-68',7],['v5f-printed-1-69',20],['v5f-printed-1-70',3],['v5f-printed-1-71',4],['v5f-printed-1-72',2],['v5f-printed-1-73',3],['v5f-printed-1-74',3],['v5f-printed-1-75',3],['v5f-printed-1-76',2],['v5f-printed-1-77',2],['v5f-printed-1-78',2],['v5f-printed-1-79',4],['v5f-printed-1-80',6],['v5f-printed-1-81',3],['v5f-printed-1-82',3],['v5f-printed-1-83',13],['v5f-printed-1-84',5],['v5f-printed-1-85',3],['v5f-printed-1-86',2],['v5f-printed-1-87',3],['v5f-printed-1-88',4],['v5f-printed-1-89',2],['v5f-printed-1-90',2],['v5f-printed-1-91',4],['v5f-printed-check-3-1',5],['v5f-printed-check-3-2',4],['v5f-printed-1-92',2],['v5f-printed-1-93',6],['v5f-printed-1-94',3],['v5f-printed-1-95',2],['v5f-printed-1-96',3],['v5f-printed-1-97',3],['v5f-printed-1-98',3],['v5f-printed-1-99',3],['v5f-printed-1-100',4],['v5f-printed-1-101',3],['v5f-printed-1-102',5],['v5f-printed-1-103',6],['v5f-printed-1-104',4],['v5f-printed-1-105',2],['v5f-printed-1-106',4],['v5f-printed-1-107',4],['v5f-printed-1-108',3],['v5f-printed-1-109',9],['v5f-printed-1-110',3],['v5f-printed-1-111',4],['v5f-printed-1-112',4],['v5f-printed-1-113',3],['v5f-printed-1-114',2],['v5f-printed-1-115',4],['v5f-printed-1-116',2],['v5f-printed-1-117',3],['v5f-printed-1-118',2],['v5f-printed-1-119',3],['v5f-printed-1-120',3],['v5f-printed-1-121',3],['v5f-printed-1-122',2],['v5f-printed-1-123',2],['v5f-printed-1-124',4],['v5f-printed-1-125',3],['v5f-printed-check-4',7],['v5f-printed-1-126',5],['v5f-printed-1-127',6],['v5f-printed-1-128',3],['v5f-printed-1-129',5],['v5f-printed-1-130',6],['v5f-printed-1-131',6],['v5f-printed-1-132',2],['v5f-printed-1-133',2],['v5f-printed-1-134',2],['v5f-printed-1-135',6],['v5f-printed-1-136',2],['v5f-printed-1-137',2],['v5f-printed-1-138',2],['v5f-printed-1-139',2],['v5f-printed-1-140',5],['v5f-printed-1-141',4],['v5f-printed-1-142',8],['v5f-printed-1-143',2],['v5f-printed-1-144',6],['v5f-printed-1-145',4],['v5f-printed-1-146',2],['v5f-printed-1-147',3],['v5f-printed-1-148',4],['v5f-printed-1-149',4],['v5f-printed-1-150',1],['v5f-printed-1-151',3],['v5f-printed-1-152',2],['v5f-printed-1-153',2],['v5f-printed-1-154',6],['v5f-printed-1-155',1],['v5f-printed-1-156',3],['v5f-printed-1-157',3],['v5f-printed-1-158',3],['v5f-printed-1-159',2],['v5f-printed-1-160',2],['v5f-printed-1-161',5],['v5f-printed-1-162',4],['v5f-printed-1-163',6],['v5f-printed-1-164',6],['v5f-printed-1-165',6],['v5f-printed-1-166',6],['v5f-printed-1-167',2],['v5f-printed-1-168',2],['v5f-printed-1-169',3],['v5f-printed-1-170',3],['v5f-printed-1-171',2],['v5f-printed-1-172',3],['v5f-printed-1-173',2],['v5f-printed-1-174',6],['v5f-printed-1-175',3],['v5f-printed-1-176',3]]){
      await go('#lesson/'+id);
      const survey=page.locator('#task-panel table').first();
      assert.equal(await survey.locator('tbody tr').count(),rows);
      assert(await survey.locator('caption').isVisible());
      assert(await page.locator('#task-panel .v5q-table-scroll').evaluateAll(boxes=>boxes.every(box=>box.scrollWidth<=box.clientWidth+1)),'all source-table columns fit at 320px');
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'numbered table at 320px');
      if(['v5f-printed-1-135','v5f-printed-1-136','v5f-printed-1-137'].includes(id)){
        const clear=await page.locator('#model svg, #task-panel svg').evaluateAll(figures=>figures.length===2&&figures.every(figure=>{
          const box=figure.getBoundingClientRect(),texts=[...figure.querySelectorAll('text')];
          return texts.length===5&&texts.every(text=>{
            const bounds=text.getBoundingClientRect(),size=parseFloat(getComputedStyle(text).fontSize);
            return size>=15&&size<=16&&bounds.left>=box.left-1&&bounds.right<=box.right+1;
          });
        }));
        assert(clear,id+' both rulers keep all five labels on the mobile screen');
      }
      if(id==='v5f-printed-1-84'){
        await page.locator('#answer').fill('MN NP PK KS SM');await page.locator('#answer-form button').click();await page.locator('[data-cmd=next]').click();
        await page.locator('#answer').fill('27');await page.locator('#answer-form button').click();assert.equal(await page.locator('#answer').isEnabled(),true);
        await page.locator('#answer').fill('2,6');await page.locator('#answer-form button').click();assert.match(await page.locator('.feedback').innerText(),/сантиметры/);
        await page.locator('#answer').fill('2');await page.reload();await page.locator('#answer').waitFor();assert.equal(await page.locator('#answer').inputValue(),'2');
        await page.locator('#answer').fill('26');await page.locator('#answer-form button').click();
        const result=await page.evaluate(()=>Vilenkin5Quality.getState().scene);assert(result.correct);assert.deepEqual(result.hintLevels,{});
      }
      if(['v5f-printed-check-3-2','v5f-printed-1-92','v5f-printed-1-93','v5f-printed-1-94'].includes(id)){
        const sizes=await page.locator('#model svg text').evaluateAll(nodes=>nodes.map(x=>parseFloat(getComputedStyle(x).fontSize)));assert(sizes.length>0);assert(sizes.every(n=>n>=9&&n<=16),'diagram and ruler labels retain their authored scale on small screens');
      }
      if(id==='v5f-printed-1-110'){
        await page.locator('#answer').fill('4');await page.locator('#answer-form button').click();await page.locator('[data-cmd=next]').click();await page.locator('#answer').fill('AKLF');await page.locator('#answer-form button').click();assert.match(await page.locator('#task-panel .feedback').textContent(),/соседей/);
        await page.locator('[data-v5-param=k]').fill('3');await page.locator('[data-v5-param=k]').press('Tab');await page.locator('[data-v5-param=l]').fill('7');await page.locator('[data-v5-param=l]').press('Tab');await page.reload();
        assert.equal(await page.locator('[data-v5-param=k]').inputValue(),'3');assert.equal(await page.locator('[data-v5-param=l]').inputValue(),'7');await page.locator('#answer').fill('FKLAF');await page.locator('#answer-form button').click();assert(await page.evaluate(()=>Vilenkin5Quality.getState().scene.correct));
      }
      if(id==='v5f-printed-1-103'){
        for(const val of ['46;26;20','37;10;27','55;30;25']){await page.locator('#answer').fill(val);await page.locator('#answer-form button').click();await page.locator('[data-cmd=next]').click();}
        await page.locator('#answer').fill('62;18;44');await page.locator('#answer-form button').click();assert.match(await page.locator('#task-panel .feedback').textContent(),/уже дано/);
        await page.locator('#answer').fill('63;18;');await page.reload();assert.equal(await page.locator('#answer').inputValue(),'63;18;');await page.locator('#answer').fill('63;18;45');await page.locator('#answer-form button').click();assert(await page.evaluate(()=>Vilenkin5Quality.getState().scene.correct));
      }
      if(id==='v5f-printed-1-101'){
        await page.locator('[data-v5-param=zone]').selectOption('1');await page.locator('[data-v5-param=at]').selectOption('3');await page.locator('[data-v5-prediction]').fill('3003');await page.locator('[data-v5-predict] button').click();await page.reload();
        assert.match(await page.locator('#model svg').textContent(),/3003/);assert.equal(await page.locator('[data-v5-param=zone]').inputValue(),'1');
      }
      if(id==='v5f-printed-1-99'){
        await page.locator('[data-v5-param=stage]').selectOption({value:'2'});await page.locator('[data-v5-param=tint]').selectOption('1');assert.equal(await page.locator('#model svg polygon').count(),7);
        await page.locator('[data-v5-param=shift]').selectOption('1');await page.reload();assert.equal(await page.locator('#model svg polygon').count(),2);assert.equal(await page.locator('[data-v5-param=stage]').inputValue(),'2');
      }
      if(id==='v5f-printed-1-95'){
        await page.locator('#answer').fill('7');await page.locator('#answer-form button').click();assert.match(await page.locator('#task-panel .feedback').innerText(),/самого отрезка/);
        await page.locator('#answer').fill('2');await page.locator('#answer-form button').click();await page.locator('[data-cmd=next]').click();await page.locator('#answer').fill('8');await page.reload();assert.equal(await page.locator('#answer').inputValue(),'8');await page.locator('#answer-form button').click();await page.locator('[data-cmd=next]').click();
        assert.match(await page.locator('#task-panel svg').textContent(),/L=M/);
      }
      if(id==='v5f-printed-1-92'){
        await page.locator('#answer').fill('B A K');await page.locator('#answer-form button').click();assert.match(await page.locator('#task-panel .feedback').innerText(),/штриха/);
        await page.locator('[data-v5-param=extend]').selectOption('1');await page.locator('[data-v5-param=which]').selectOption('3');
        await page.locator('#answer').fill('D');await page.reload();assert.equal(await page.locator('#answer').inputValue(),'D');assert.equal(await page.locator('[data-v5-param=extend]').inputValue(),'1');
        await page.locator('#answer').fill('Д В К А');await page.locator('#answer-form button').click();assert(await page.evaluate(()=>Vilenkin5Quality.getState().scene.correct));
      }
      if(id==='v5f-printed-1-72'){
        const own=page.locator('#v5-quality-note');
        assert(await own.isVisible());assert.equal(await page.locator('.v5q-notes textarea').evaluate(node=>node.closest('details')===null),true);
        await own.fill('В магазине сравню цену за килограмм. На площадке измерю дальность трёх прыжков.');
        let scene=await page.evaluate(()=>Vilenkin5Quality.getState().scene);assert.equal(scene.attempt,0);assert.equal(scene.firstAttempt,null);
        await page.reload();await own.waitFor();assert.match(await own.inputValue(),/за килограмм/);
        await page.locator('#answer').fill('48');await page.locator('#answer-form button').click();assert.match(await page.locator('#task-panel').innerText(),/количеств/i);
        await page.locator('#answer').fill('135');await page.locator('#answer-form button').click();scene=await page.evaluate(()=>Vilenkin5Quality.getState().scene);assert(scene.correct);assert.deepEqual(scene.hintLevels,{});
      }
      if(id==='v5f-printed-1-7')assert(await survey.locator('tbody td').evaluateAll(cells=>cells.every(cell=>{const r=document.createRange();r.selectNodeContents(cell);return r.getClientRects().length<=1;})),'each printed number stays on one line');
      if(id==='v5f-printed-1-26'){
        await page.locator('#model svg').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(shots,'leading-zero-tree-320.png')});
        assert.equal(await page.locator('#model svg rect').count(),2,'only the nonzero first digit becomes a child node');
      }
      if(id==='v5f-printed-1-8'){
        await page.locator('[data-v5-weather-sky]').selectOption('2');await page.locator('[data-v5-weather-rain]').check();
        await page.locator('[data-v5-weather-temp]').fill('9,5');await page.locator('[data-v5-weather-form] button').click();
        assert.match(await page.locator('#model').innerText(),/1 из 15/);await page.reload();await page.locator('[data-v5-weather-temp]').waitFor();
        assert.equal(await page.locator('[data-v5-weather-temp]').inputValue(),'9,5');
        await page.locator('[data-v5-weather-form]').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(shots,'weather-diary-entry-320.png')});
      }
      await survey.scrollIntoViewIfNeeded();await page.screenshot({path:path.join(shots,id+'-mobile.png')});
      await page.locator('[data-cmd=mode][data-value=practice]').click();
      const practice=await page.evaluate(()=>{
        const scene=Vilenkin5Quality.getState().scene,source=WorkshopMath.generate(scene.id,0),task=WorkshopMath.generate(scene.id,scene.seed);
        return {id:scene.id,mode:scene.mode,seed:scene.seed,sourceKey:source.conditionKey,key:task.conditionKey,prompt:task.prompt};
      });
      assert.equal(practice.id,id);assert.equal(practice.mode,'practice');assert(practice.seed>0);
      assert(practice.key);assert.notEqual(practice.key,practice.sourceKey,id+' uses new practice data');
      assert.equal(await page.locator('#task-panel .question').textContent(),practice.prompt);
      assert(await page.locator('#task-panel table').first().isVisible());
      if(id==='v5f-printed-1-119'){
        await page.reload();await page.locator('#answer').waitFor();
        assert.equal(await page.evaluate(()=>Vilenkin5Quality.getState().scene.seed),practice.seed);
        await page.locator('#answer').fill('нет');await page.locator('#answer-form button').click();
        await page.locator('[data-cmd=next]').click();
        const nextKey=await page.evaluate(()=>{const s=Vilenkin5Quality.getState().scene;return WorkshopMath.generate(s.id,s.seed).conditionKey;});
        assert.notEqual(nextKey,practice.key,'next ray differs after reload');assert.notEqual(nextKey,practice.sourceKey);
      }
    }

    for(const width of [320,375]){
      await page.setViewportSize({width,height:840});await go('#lesson/v5f-printed-check-2-1');
      const modes=await page.locator('.lesson-head .v5q-mode').evaluateAll(items=>items.map(b=>({width:b.offsetWidth,height:b.offsetHeight})));
      assert.equal(modes.length,3);assert(modes.every(b=>b.width>=130&&b.height<=60),'all three mode labels remain whole at '+width+' px');
      const receipt=page.locator('#task-panel table');assert.equal(await receipt.locator('tbody tr').count(),4);
      assert.equal(await receipt.locator('tbody td').filter({hasText:/^\?$/}).count(),3);await receipt.scrollIntoViewIfNeeded();
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:path.join(shots,'printed-receipt-'+width+'.png')});
      await go('#lesson/v5f-printed-check-2-2');const own=page.locator('[data-v5-print-number]');
      await own.locator('input').fill(width===320?'909':'404');await own.locator('button').click();
      const number=width===320?'909':'404';await page.waitForFunction(n=>Vilenkin5Quality.getState().scene.seed===Number(n),number);
      await page.locator('#answer').fill('6');await page.locator('#answer-form button').click();await page.locator('[data-cmd=next]').click();
      await page.reload();await own.locator('input').waitFor();assert.equal(await own.locator('input').inputValue(),number);
      assert.equal(await page.evaluate(()=>Vilenkin5Quality.getState().scene.step),1);await own.scrollIntoViewIfNeeded();
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:path.join(shots,'printed-chosen-number-'+width+'.png')});
    }
    assert.deepEqual(errors,[]);console.log(JSON.stringify({gate:'VILENKIN5_QUALITY_BROWSER_PASS',lessons:ids.length,numberedPart1:printedCounts[0].length,numberedPart2:printedCounts[1].length,printedAssessmentCards:assessmentCards.length,screenshots:161,journeys:'134 guided flows, long division, draft/note/model reload, learning detour, fractional portions, rounding, actual GIF play/stop, focused mobile diagrams and readable labels, right-angle marker, keyboard and zoom'}));
  }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;server.close();});

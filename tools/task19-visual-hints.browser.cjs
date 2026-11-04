'use strict';

// Real browser checks for the learner flow and geometry at narrow widths.
// Run after the node contracts, with Playwright's Chromium installed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {chromium} = require('playwright');
const root = path.resolve(__dirname,'..');
const {cards} = require('../trainers/task19-visual-data.js');
const KEY = 'mathExam.task19.visualHints.v1';
const artifacts = path.resolve(process.env.TASK19_BROWSER_ARTIFACTS || path.join(root,'artifacts/task19-visual-hints'));
const mime = {'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.ico':'image/x-icon'};

async function startServer() {
  const server = http.createServer((req,res) => {
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname); }
    catch (_) { res.writeHead(400).end();return; }
    if (pathname === '/favicon.ico') {res.writeHead(204).end();return;}
    const file = path.resolve(root,'.'+pathname);
    if (!file.startsWith(root+path.sep)) {res.writeHead(403).end();return;}
    fs.readFile(file,(error,body) => {
      if(error){res.writeHead(404).end('Not found');return;}
      res.writeHead(200,{'Content-Type':mime[path.extname(file)] || 'application/octet-stream'});res.end(body);
    });
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  return {server,base:'http://127.0.0.1:'+server.address().port};
}

async function noOverflow(page, label) {
  const overflow = await page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const selectors = ['main','.exercise','#statement','#hintPanel','#visualHost','#visualHost svg','#visualHost input','#visualHost button','#visualHost .t19-model-readout'];
    return selectors.flatMap(selector=>[...document.querySelectorAll(selector)].filter(el=>el.getClientRects().length).map(el=>({
      selector,left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right,width
    }))).filter(r=>r.left < -1 || r.right > r.width+1);
  });
  assert.deepEqual(overflow,[],label+' fits the viewport');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1),label+' has no page horizontal scroll');
}

// Record geometry for human review, without inventing a font-size pass threshold.
async function svgLabelEvidence(page) {
  return page.locator('#visualHost svg').evaluate(svg=>{
    const box=svg.viewBox.baseVal,rootInverse=svg.getCTM().inverse();
    const viewBox={x:box.x,y:box.y,width:box.width,height:box.height};
    const labels=[...svg.querySelectorAll('text')].filter(node=>node.textContent.trim()).map(node=>{
      const b=node.getBBox(),matrix=rootInverse.multiply(node.getCTM());
      const corners=[[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]].map(([x,y])=>new DOMPoint(x,y).matrixTransform(matrix));
      const left=Math.min(...corners.map(p=>p.x)),right=Math.max(...corners.map(p=>p.x)),top=Math.min(...corners.map(p=>p.y)),bottom=Math.max(...corners.map(p=>p.y)),screen=node.getBoundingClientRect();
      return {text:node.textContent,bounds:{left,right,top,bottom},screen:{width:screen.width,height:screen.height},outsideViewBox:left<box.x||right>box.x+box.width||top<box.y||bottom>box.y+box.height};
    });
    return {viewBox,labels};
  });
}

const readout = page => page.locator('#visualHost .t19-model-readout');
const measure = page => page.locator('#visualHost .t19-measure');
async function savedState(page) { return page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY); }
async function assertUnanswered(page, previous, label) {
  assert.equal(await page.locator('#answerPanel').isVisible(),false,label+': the learner still decides');
  assert.equal(await page.locator('#answerExplanation').textContent(),'',label+': no premature verdict');
  assert.deepEqual((await savedState(page)).records,previous.records,label+': experiments do not record answers');
  assert.equal((await savedState(page)).current.answer,null,label+': no implicit answer');
}
async function measureUsingKeyboard(page) {
  const button=measure(page);
  if(!await readout(page).isVisible()){
    assert.equal(await button.innerText(),'Измерить');await button.focus();await page.keyboard.press('Enter');
  }
  assert.equal(await button.innerText(),'Скрыть измерения');
  assert.equal(await readout(page).isVisible(),true,'Measurement reveals numerical observations');
  assert.match(await readout(page).innerText(),/\d/,'Measurements contain actual values');
}
async function sampleCurrentModel(page,card) {
  return page.evaluate(({hint,key})=>{
    const state=JSON.parse(localStorage.getItem(key));
    return window.Task19Visuals.sample(hint.model,{...hint.params,...state.current.modelState.params});
  },{hint:card.hint,key:KEY});
}
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const near=(a,b,label)=>assert(Math.abs(a-b)<1e-7,label+': '+a+' ≈ '+b);
async function moveSlider(page,slider) {
  const initial=Number(await slider.inputValue()),min=Number(await slider.getAttribute('min')),max=Number(await slider.getAttribute('max'));
  const drawing=await page.locator('#visualHost svg').innerHTML(),numbers=await readout(page).textContent();
  await slider.focus();await page.keyboard.press(initial-min>max-initial?'ArrowLeft':'ArrowRight');
  assert.notEqual(Number(await slider.inputValue()),initial,'A visible control changes by keyboard');
  return (await page.locator('#visualHost svg').innerHTML())!==drawing||(await readout(page).textContent())!==numbers;
}

async function main() {
  fs.mkdirSync(artifacts,{recursive:true});
  const {server,base} = await startServer();
  let browser;
  const failures = [];
  const errors = [];
  const check = async (name,fn) => {
    try {await fn();console.log('PASS '+name);}
    catch(error){failures.push(name+': '+error.stack);console.error('FAIL '+name+': '+error.message);}
  };
  try {
    browser = await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath:process.env.CHROMIUM_EXECUTABLE_PATH} : {})});
    const context = await browser.newContext({viewport:{width:360,height:800}});
    const page = await context.newPage();
    page.on('pageerror',error=>errors.push(error.message));
    page.on('console',message=>{if(message.type()==='error') errors.push(message.text());});
    const go = async (file='task19-trainer.html',card='prev-056') => {
      await page.goto(base+'/trainers/'+file+'?card='+encodeURIComponent(card));
      await page.waitForFunction(()=>window.Task19Data && document.querySelector('#statement').textContent !== 'Загружаем утверждение…');
    };

    await check('both public entry points withhold the answer and support keyboard help',async()=>{
      for (const file of ['task19-trainer.html','geometry_statements_trainer_improved.html']) {
        await context.clearCookies();
        await go(file);
        await page.evaluate(()=>localStorage.clear());
        await page.reload();
        assert.equal(await page.locator('#hintToggle').innerText(),'Хочешь подсказку?');
        assert.equal(await page.locator('#hintPanel').isVisible(),false);
        assert.equal(await page.locator('#answerPanel').isVisible(),false);
        assert.equal(await page.locator('#answerExplanation').innerText(),'');
        assert.equal(await page.locator('#settings').getAttribute('open'),null);
        const before = await page.locator('#progressText').textContent();
        await noOverflow(page,file+' initial');
        for (const id of ['hintToggle','btnTrue','btnFalse','nextCard']) {
          const bounds = await page.locator('#'+id).boundingBox();
          assert(bounds.height>=44,id+' touch height');
        }
        await page.locator('#hintToggle').focus();
        await page.keyboard.press('Enter');
        assert.equal(await page.locator('#hintPanel').isVisible(),true);
        assert.equal(await page.locator('#hintToggle').getAttribute('aria-expanded'),'true');
        assert(await page.locator('#visualHost svg').count());
        assert.equal(await measure(page).isVisible(),true);
        assert.equal(await readout(page).isVisible(),false,'Values wait for a deliberate measurement');
        assert.equal(await page.locator('#answerPanel').isVisible(),false);
        assert.equal(await page.locator('#progressText').textContent(),before);
        await noOverflow(page,file+' hint');
      }
    });

    await check('interactive controls respond to arrows without answering the card',async()=>{
      await go();
      await page.evaluate(()=>localStorage.clear());
      await page.reload();
      await page.screenshot({path:path.join(artifacts,'01-question-mobile.png'),fullPage:true});
      await page.locator('#hintToggle').click();
      const slider = page.locator('#visualHost input[type=range]').last();
      assert(await slider.count(),'Rhombus offers an experiment');
      const value = await slider.inputValue();
      const drawing = await page.locator('#visualHost svg').innerHTML();
      await slider.focus();await page.keyboard.press('ArrowRight');
      assert.notEqual(await slider.inputValue(),value);
      assert.notEqual(await page.locator('#visualHost svg').innerHTML(),drawing);
      assert.equal(await page.locator('#answerPanel').isVisible(),false);
      const experiment=await savedState(page),progressBeforeMeasurement=await page.locator('#progressText').textContent();
      assert.equal(await readout(page).isVisible(),false,'Moving a shape does not reveal measurements automatically');
      await measureUsingKeyboard(page);
      await assertUnanswered(page,experiment,'Keyboard measurement');
      assert.equal(await page.locator('#progressText').textContent(),progressBeforeMeasurement);
      const changedValue=await slider.inputValue(),changedDrawing=await page.locator('#visualHost svg').innerHTML(),measuredText=await readout(page).innerText();
      const modelState=(await savedState(page)).current.modelState;
      assert.equal(modelState.measured,true,'Deliberate measurement is persisted');
      assert(Object.keys(modelState.params).length>0,'Editable parameters are persisted');
      await page.locator('#hintToggle').click();await page.locator('#hintToggle').click();
      assert.equal(await slider.inputValue(),changedValue,'Closing a hint keeps the chosen parameter');
      assert.equal(await readout(page).innerText(),measuredText,'Closing a hint keeps its measurement');
      await page.reload();
      assert.equal(await page.locator('#hintPanel').isVisible(),true);
      assert.equal(await slider.inputValue(),changedValue,'Reload keeps the chosen parameter');
      assert.equal(await page.locator('#visualHost svg').innerHTML(),changedDrawing,'Reload restores the actual model');
      assert.equal(await readout(page).isVisible(),true,'Reload keeps a deliberate measurement');
      assert.equal(await readout(page).innerText(),measuredText);
      assert.deepEqual((await savedState(page)).current.modelState,modelState,'The full experiment state survives reload');
      await assertUnanswered(page,experiment,'Restored experiment');
      await noOverflow(page,'Keyboard rhombus');
      await page.screenshot({path:path.join(artifacts,'02-hint-mobile.png'),fullPage:true});
      await page.locator('#btnTrue').focus();await page.keyboard.press('Enter');
      assert.equal(await page.locator('#answerPanel').isVisible(),true);
      const saved = await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
      assert.equal(saved.records['prev-056'].attempts,1);
      assert.equal(saved.records['prev-056'].needsReview,true);
      await page.locator('#statement').focus();await page.keyboard.press('j');await page.keyboard.press('n');
      await page.reload();
      assert.equal(await page.locator('#answerPanel').isVisible(),true);
      assert.equal(await page.locator('#btnTrue').isDisabled(),true);
      assert.equal(await page.locator('#btnFalse').isDisabled(),true);
      assert.deepEqual(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).records,KEY),saved.records);
      await page.screenshot({path:path.join(artifacts,'03-explanation-mobile.png'),fullPage:true});
      await page.locator('#nextCard').click();
      assert.equal(await page.locator('#hintPanel').isVisible(),false);
      assert.equal(await page.locator('#answerPanel').isVisible(),false);
      assert.equal(await page.locator('#answerExplanation').textContent(),'');
    });

    await check('all 234 statements have a genuine model action without grading or an early answer',async()=>{
      assert.equal(cards.length,234,'The full canonical corpus including the current demo is exercised');
      await page.evaluate(()=>localStorage.clear());
      await page.setViewportSize({width:360,height:900});
      let adjustable=0,fixedMeasurements=0;
      for(const card of cards){
        assert.equal(typeof card.hint.model,'string',card.id+': a working model replaces static hints');
        assert(card.hint.model.length>0,card.id+': model is named');
        await go('task19-trainer.html',card.id);
        const before=await savedState(page),progress=await page.locator('#progressText').textContent();
        assert.equal(await page.locator('#hintPanel').isVisible(),false,card.id+': a new task starts closed');
        await page.locator('#hintToggle').click();
        assert.equal(await page.locator('#visualHost svg').isVisible(),true,card.id+': a diagram appears immediately');
        assert((await page.locator('#hintPrompt').innerText()).trim().length>20,card.id+': actionable observation prompt');
        assert.equal(await readout(page).isVisible(),false,card.id+': no measurements before action');
        assert.equal(await measure(page).isVisible(),true,card.id+': measurement is available');
        const sliders=page.locator('#visualHost input[type=range]');
        let changed=false;
        for(let i=0;i<await sliders.count();i++){
          assert.equal(await sliders.nth(i).isVisible(),true,card.id+': control is usable');
          assert.equal(await sliders.nth(i).isDisabled(),false,card.id+': control is enabled');
          changed=await moveSlider(page,sliders.nth(i))||changed;
        }
        if(await sliders.count()){assert(changed,card.id+': an adjustable model changes its geometry or numerical measurements');adjustable++;}
        else fixedMeasurements++;
        await assertUnanswered(page,before,card.id+' manipulation');
        await measureUsingKeyboard(page);
        await assertUnanswered(page,before,card.id+' measurement');
        assert.equal(await page.locator('#progressText').textContent(),progress,card.id+': progress unchanged');
        await noOverflow(page,card.id+' action');
      }
      assert(adjustable>0,'Adjustable geometry is covered');assert.equal(adjustable+fixedMeasurements,234,'Every card has a meaningful action');
      console.log('ACTION_COVERAGE '+JSON.stringify({total:cards.length,adjustable,fixedMeasurements}));
    });

    await check('all diagram families fit mobile and desktop with adjustable boundaries',async()=>{
      const representatives = [...new Map(cards.map(c=>[c.hint.model || 'static-svg',c])).values()];
      const familyArtifacts=path.join(artifacts,'families'),labelEvidence=[];
      fs.mkdirSync(familyArtifacts,{recursive:true});
      const recordLabels=async(card,state)=>{
        labelEvidence.push({model:card.hint.model,card:card.id,width:360,state,...await svgLabelEvidence(page)});
        fs.writeFileSync(path.join(familyArtifacts,'svg-label-bounds.json'),JSON.stringify(labelEvidence,null,2));
        const outside=labelEvidence.at(-1).labels.filter(label=>label.outsideViewBox);
        assert.equal(outside.length,0,card.id+' '+state+' labels stay inside the diagram: '+outside.map(label=>label.text).join(', '));
      };
      for (const width of [320,360,1280]) {
        await page.setViewportSize({width,height:900});
        for (const card of representatives) {
          await go('task19-trainer.html',card.id);
          if (!await page.locator('#hintPanel').isVisible()) await page.locator('#hintToggle').click();
          assert.equal(await page.locator('#answerPanel').isVisible(),false,card.id+' no revealed explanation');
          const before=await savedState(page);
          await noOverflow(page,card.id+' '+width);
          if(width===360){
            await page.screenshot({path:path.join(familyArtifacts,card.hint.model+'.png'),fullPage:true});
            await recordLabels(card,'initial');
          }
          const sliders = page.locator('#visualHost input[type=range]');
          for (let i=0;i<await sliders.count();i++) {
            await sliders.nth(i).focus();await page.keyboard.press('Home');
            await noOverflow(page,card.id+' minimum '+i);
            if(width===360)await recordLabels(card,'minimum '+await sliders.nth(i).getAttribute('data-key'));
            await page.keyboard.press('End');
            await noOverflow(page,card.id+' maximum '+i);
            if(width===360)await recordLabels(card,'maximum '+await sliders.nth(i).getAttribute('data-key'));
          }
          assert.equal(await page.locator('#answerPanel').isVisible(),false);
          await measureUsingKeyboard(page);
          await assertUnanswered(page,before,card.id+' boundary experiment');
          await noOverflow(page,card.id+' measured '+width);
        }
        await go();if(!await page.locator('#hintPanel').isVisible())await page.locator('#hintToggle').click();await measureUsingKeyboard(page);
        await page.screenshot({path:path.join(artifacts,'families-'+width+'.png'),fullPage:true});
      }
      await go();
      await page.screenshot({path:path.join(artifacts,'04-desktop.png'),fullPage:true});
      console.log('FAMILY_VISUAL_EVIDENCE '+JSON.stringify({families:representatives.length,states:labelEvidence.length,outsideViewBox:labelEvidence.filter(state=>state.labels.some(label=>label.outsideViewBox)).length}));
    });

    await check('prev-019 keeps the median on its circle at every keyboard boundary',async()=>{
      const card=cards.find(c=>c.id==='prev-019');assert(card);assert.equal(card.hint.model,'triangleMedianCircle');
      await go('task19-trainer.html',card.id);await page.locator('#hintToggle').click();
      const before=await savedState(page),sliders=page.locator('#visualHost input[type=range]');assert(await sliders.count(),'The vertex can move while preserving the premise');
      const invariant=async()=>{
        const s=await sampleCurrentModel(page,card),P=s.points,M=P.M||P.O;assert(M&&P.A&&P.B&&P.C,'The geometry exposes the median endpoints');
        near(distance(M,P.A),distance(M,P.B),'M is the midpoint of AB');
        near(distance(M,P.A),distance(M,P.C),'MC is half of AB');
        near(distance(M,P.A)*2,distance(P.A,P.B),'AB stays a diameter');
        const u=[P.A[0]-P.C[0],P.A[1]-P.C[1]],v=[P.B[0]-P.C[0],P.B[1]-P.C[1]];
        near((u[0]*v[0]+u[1]*v[1])/(Math.hypot(...u)*Math.hypot(...v)),0,'Angle ACB stays right');
      };
      await invariant();
      for(let i=0;i<await sliders.count();i++)for(const key of ['Home','End']){await sliders.nth(i).focus();await page.keyboard.press(key);await invariant();await noOverflow(page,'prev-019 '+key);}
      await measureUsingKeyboard(page);await assertUnanswered(page,before,'Constrained median experiment');
      const state=(await savedState(page)).current.modelState;await page.reload();assert.deepEqual((await savedState(page)).current.modelState,state);await invariant();
      await page.screenshot({path:path.join(artifacts,'median-circle-constraint.png'),fullPage:true});
    });

    await check('given triangle lengths remain fixed during an explicit measurement',async()=>{
      for(const [id,lengths]of [['prev-038',[2,3,5]],['tri_1_2_4_exists',[1,2,4]],['tri_2_4_6_not_exist',[2,4,6]],['reference-026',[1,2,4]]]){
        const card=cards.find(c=>c.id===id);assert(card,id);assert(card.hint.model,id+': a working model is present');
        await go('task19-trainer.html',id);if(!await page.locator('#hintPanel').isVisible())await page.locator('#hintToggle').click();const before=await savedState(page);
        const invariant=async()=>{const s=await sampleCurrentModel(page,card);assert.deepEqual([s.values.a,s.values.b,s.values.c],lengths,id+': given lengths never change');};
        await invariant();const controls=await page.evaluate(hint=>window.Task19Visuals.controlsFor(hint.model,hint.params),card.hint);
        assert(controls.every(c=>!['a','b','c'].includes(c.key)),id+': no control contradicts the specified lengths');
        const sliders=page.locator('#visualHost input[type=range]');
        for(let i=0;i<await sliders.count();i++)for(const key of ['Home','End']){await sliders.nth(i).focus();await page.keyboard.press(key);await invariant();}
        await measureUsingKeyboard(page);await invariant();await assertUnanswered(page,before,id+' fixed lengths');
        const modelState=(await savedState(page)).current.modelState;await page.reload();assert.deepEqual((await savedState(page)).current.modelState,modelState);await invariant();assert.equal(await readout(page).isVisible(),true);
      }
    });

    await check('storage denial leaves the trainer usable',async()=>{
      const blocked = await browser.newContext({viewport:{width:360,height:800}});
      await blocked.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError');}}));
      const denied = await blocked.newPage();
      denied.on('pageerror',error=>errors.push(error.message));
      await denied.goto(base+'/trainers/task19-trainer.html?card=prev-056');
      await denied.locator('#hintToggle').click();
      assert(await denied.locator('#visualHost svg').count());
      const progress=await denied.locator('#progressText').textContent();
      await moveSlider(denied,denied.locator('#visualHost input[type=range]').last());
      await measureUsingKeyboard(denied);
      assert.equal(await denied.locator('#answerPanel').isVisible(),false,'Blocked storage does not turn measurement into an answer');
      assert.equal(await denied.locator('#progressText').textContent(),progress);
      await denied.locator('#btnFalse').click();
      assert.equal(await denied.locator('#answerPanel').isVisible(),true);
      assert.match(await denied.locator('#storageNote').textContent(),/не разрешает сохранять/);
      await denied.locator('#nextCard').click();
      assert.equal(await denied.locator('#answerPanel').isVisible(),false);
      await blocked.close();
    });
    assert.deepEqual(errors,[],'No browser script or resource errors');
    assert.deepEqual(failures,[],'All learner journeys pass');
    console.log('TASK19_VISUAL_HINTS_BROWSER_OK');
  } finally {
    if(browser) await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(error=>{console.error(error.stack || error);process.exitCode=1;});

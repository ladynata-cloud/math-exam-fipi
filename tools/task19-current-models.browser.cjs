'use strict';
// CI-only acceptance for the new PDF's geometry corrections. Do not launch a
// local browser; the Task 19 workflow retains desktop/mobile visual evidence.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
if(!process.env.CI)throw new Error('Run task19-current-models.browser.cjs in the Task 19 CI workflow.');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),{cards}=require('../trainers/task19-visual-data.js'),KEY='mathExam.task19.visualHints.v1';
const artifacts=path.resolve(process.env.TASK19_CURRENT_BROWSER_ARTIFACTS||path.join(root,'artifacts/task19-current-models'));
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.pdf':'application/pdf'};
const lineCards=cards.filter(c=>c.hint.model==='lineThroughPoint');
const near=(a,b,label)=>assert(Math.abs(a-b)<1e-8,`${label}: ${a} != ${b}`);
const number=n=>n.toLocaleString('ru-RU').replace(/^-/,'−');
async function server(){
  const s=http.createServer((req,res)=>{
    let file;try{const u=new URL(req.url,'http://localhost');if(u.pathname==='/favicon.ico'){res.writeHead(204).end();return;}file=path.resolve(root,'.'+decodeURIComponent(u.pathname));}catch(_){res.writeHead(400).end();return;}
    if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
    fs.readFile(file,(e,b)=>{if(e){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(b);});
  });await new Promise(resolve=>s.listen(0,'127.0.0.1',resolve));return {s,base:'http://127.0.0.1:'+s.address().port};
}
const saved=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
async function fresh(page,base,id){
  if(page.url().startsWith(base))await page.evaluate(()=>localStorage.clear());
  await page.goto(base+'/trainers/task19-trainer.html?card='+encodeURIComponent(id));
  await page.waitForFunction(({id,key})=>window.Task19Visuals&&JSON.parse(localStorage.getItem(key)||'null')?.current?.id===id,{id,key:KEY});
  assert.equal(await page.locator('#hintPanel').isVisible(),false);await page.locator('#hintToggle').click();await page.locator('#visualHost svg').waitFor();
}
async function sample(page){
  return page.evaluate(key=>{const state=JSON.parse(localStorage.getItem(key)),card=window.Task19Data.cards.find(c=>c.id===state.current.id);return window.Task19Visuals.sample(card.hint.model,{...card.hint.params,...state.current.modelState.params});},KEY);
}
async function noGrade(page,before){const state=await saved(page);assert.equal(state.current.answer,null);assert.deepEqual(state.records,before.records);assert.equal(await page.locator('#answerPanel').isVisible(),false);}
async function fit(page,label){
  const violations=await page.evaluate(()=>{
    const width=document.documentElement.clientWidth,selectors=['#visualHost','#visualHost svg','#visualHost input','#visualHost button','.t19-model-readout'];
    return selectors.flatMap(selector=>[...document.querySelectorAll(selector)].filter(e=>e.getClientRects().length).map(e=>{const b=e.getBoundingClientRect();return{selector,left:b.left,right:b.right,width};})).filter(b=>b.left< -1||b.right>width+1);
  });assert.deepEqual(violations,[],label+' fits the viewport');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1),label+' no page overflow');
  const outside=await page.locator('#visualHost svg').evaluate(svg=>{const v=svg.viewBox.baseVal;return [...svg.querySelectorAll('text')].map(t=>{const b=t.getBBox();return{text:t.textContent,x:b.x,y:b.y,right:b.x+b.width,bottom:b.y+b.height};}).filter(b=>b.x<v.x||b.y<v.y||b.right>v.x+v.width||b.bottom>v.y+v.height);});
  assert.deepEqual(outside,[],label+' labels fit the drawing');
}
async function clearP(page,label){
  const evidence=await page.locator('#visualHost svg').evaluate(svg=>{
    const point=svg.querySelector('[data-geometry-point="P"]'),text=point.querySelector('text'),b=text.getBBox(),corners=[[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]];
    const overlaps=[...svg.children].filter(e=>e.tagName.toLowerCase()==='line').map(line=>{
      const a=[Number(line.getAttribute('x1')),Number(line.getAttribute('y1'))],z=[Number(line.getAttribute('x2')),Number(line.getAttribute('y2'))],length=Math.hypot(z[0]-a[0],z[1]-a[1]);
      const signed=corners.map(p=>((p[0]-a[0])*(z[1]-a[1])-(p[1]-a[1])*(z[0]-a[0]))/length);
      return {crosses:Math.min(...signed)<=1.5&&Math.max(...signed)>=-1.5};
    });
    return {aboveLines:svg.lastElementChild===point,halo:point.querySelector('circle').getAttribute('fill'),overlaps:overlaps.filter(o=>o.crosses).length};
  });assert.equal(evidence.aboveLines,true,label+' point is painted above lines');assert.equal(evidence.halo,'white');assert.equal(evidence.overlaps,0,label+' no line crosses P label');
}
async function keyboardValue(page,key,value){
  const input=page.locator(`#visualHost input[data-key="${key}"]`),bounds=await input.evaluate(e=>({min:Number(e.min),step:Number(e.step)}));
  await input.focus();await page.keyboard.press('Home');
  const count=Math.round((value-bounds.min)/bounds.step);for(let i=0;i<count;i++)await page.keyboard.press('ArrowRight');
  near(Number(await input.inputValue()),value,key+' keyboard reaches requested value');
}
async function main(){
  fs.mkdirSync(artifacts,{recursive:true});const {s,base}=await server();let browser;const errors=[],failures=[],coverage=[];
  try{
    browser=await chromium.launch({headless:true});
    for(const mode of [{name:'desktop',viewport:{width:1280,height:920}},{name:'mobile',viewport:{width:390,height:844},hasTouch:true,isMobile:true}]){
      const {name,...options}=mode,context=await browser.newContext(options),page=await context.newPage();
      page.on('pageerror',e=>errors.push(name+': '+e.message));page.on('console',m=>{if(m.type()==='error')errors.push(name+': '+m.text());});
      try{
        await fresh(page,base,'prev-006');let before=await saved(page);const angle=page.locator('input[data-key="angle"]');
        await angle.focus();for(let i=0;i<8;i++)await page.keyboard.press('ArrowRight');
        let geometry=await sample(page);assert.equal(geometry.values.angle,30);assert.equal(geometry.metrics.distance,0);await clearP(page,name+' snapped');
        await page.keyboard.press('ArrowRight');assert.equal((await sample(page)).values.angle,31);await page.keyboard.press('ArrowRight');assert.equal((await sample(page)).values.angle,32);await page.keyboard.press('ArrowRight');assert.equal((await sample(page)).values.angle,33);
        await page.keyboard.press('ArrowLeft');assert.equal((await sample(page)).values.angle,30,'keyboard returns to B');
        await page.locator('.t19-measure').click();assert.match(await page.locator('.t19-model-readout').textContent(),/через обе точки P и B/);
        const aligned=await saved(page);await page.reload();await page.locator('#visualHost svg').waitFor();assert.deepEqual((await saved(page)).current.modelState,aligned.current.modelState);
        await fit(page,name+' line');await page.screenshot({path:path.join(artifacts,name+'-line-aligned.png'),fullPage:true});
        if(mode.hasTouch)await page.locator('.t19-model-reset').tap();else{await page.locator('.t19-model-reset').focus();await page.keyboard.press('Enter');}
        assert.equal((await sample(page)).values.angle,20);assert.equal(await page.locator('.t19-model-readout').isVisible(),false);await noGrade(page,before);
        if(mode.hasTouch){
          await angle.scrollIntoViewIfNeeded();const box=await angle.boundingBox();await angle.tap({position:{x:8+(box.width-16)*30/170,y:box.height/2}});
          assert.equal((await sample(page)).values.angle,30,'touch slider snaps to B');await page.locator('.t19-model-reset').tap();await noGrade(page,before);
        }
        await page.reload();await page.locator('#visualHost svg').waitFor();assert.equal((await sample(page)).values.angle,20);assert.equal(await page.locator('.t19-model-readout').isVisible(),false);
        coverage.push({viewport:name,card:'prev-006',checks:['keyboard snap','keyboard escape','draft reload','restart','touch restart',...(mode.hasTouch?['touch snap']:[])]});

        for(const card of lineCards){
          await fresh(page,base,card.id);before=await saved(page);const slider=page.locator('input[data-key="angle"]');
          for(const key of ['Home','End']){await slider.focus();await page.keyboard.press(key);await clearP(page,name+' '+card.id+' '+key);await fit(page,name+' '+card.id);}
          await page.locator('.t19-measure').click();await page.locator('.t19-model-reset').click();assert.equal((await sample(page)).values.angle,card.hint.params.angle);assert.equal(await page.locator('.t19-model-readout').isVisible(),false);await noGrade(page,before);
          coverage.push({viewport:name,card:card.id,checks:['boundary labels','related restart','no grading']});
        }

        await fresh(page,base,'prev-102');before=await saved(page);assert.equal(await page.locator('.t19-model-reset').count(),0);await page.locator('.t19-measure').click();
        for(const [a,b] of [[-1.5,.5],[.5,-1.5],[-6,6],[6,-6],[.5,0],[0,0],[-6,-6],[6,6]]){
          await keyboardValue(page,'a',a);await keyboardValue(page,'b',b);geometry=await sample(page);near(geometry.metrics.length,Math.abs(b-a),'actual distance');
          const subtract=a<0?`(${number(a)})`:number(a),equation=`AB = |${number(b)} − ${subtract}| = |${number(b-a)}| = ${number(Math.abs(b-a))}`;
          assert((await page.locator('.t19-model-readout').textContent()).includes(equation));assert((await page.locator('#visualHost svg [data-geometry-group="AB"]').textContent()).includes('AB = '+number(Math.abs(b-a))));
          if(a===b)assert(await page.locator('#visualHost svg').getByText('A = B',{exact:true}).count());
          else{
            const boxes=await page.locator('#visualHost svg text').evaluateAll(ts=>ts.filter(t=>t.textContent==='A'||t.textContent==='B').map(t=>{const b=t.getBBox();return {x:b.x,right:b.x+b.width};}).sort((a,b)=>a.x-b.x));
            assert.equal(boxes.length,2);assert(boxes[0].right<boxes[1].x,'nearby/reversed endpoint labels do not overlap');
          }
          await fit(page,name+' distance '+a+','+b);await noGrade(page,before);
          await page.screenshot({path:path.join(artifacts,name+'-distance-'+String(a).replace('.','_')+'-'+String(b).replace('.','_')+'.png'),fullPage:true});
          coverage.push({viewport:name,card:'prev-102',a,b,equation});
        }
        const distanceDraft=await saved(page);await page.reload();await page.locator('#visualHost svg').waitFor();assert.deepEqual((await saved(page)).current.modelState,distanceDraft.current.modelState);await noGrade(page,before);

        await fresh(page,base,'prev-103');before=await saved(page);await keyboardValue(page,'bx',5);await keyboardValue(page,'by',4);await page.locator('.t19-measure').click();geometry=await sample(page);
        near(geometry.points.M[0],(geometry.points.A[0]+geometry.points.B[0])/2,'midpoint x');near(geometry.points.M[1],(geometry.points.A[1]+geometry.points.B[1])/2,'midpoint y');near(geometry.metrics.AM,geometry.metrics.MB,'midpoint halves');
        await fit(page,name+' midpoint');await noGrade(page,before);await page.screenshot({path:path.join(artifacts,name+'-midpoint.png'),fullPage:true});coverage.push({viewport:name,card:'prev-103',checks:['independent coordinates','equal halves','no grading']});
      }catch(e){failures.push(name+': '+e.stack);await page.screenshot({path:path.join(artifacts,'FAIL-'+name+'.png'),fullPage:true}).catch(()=>{});}
      await context.close();
    }
    assert.deepEqual(errors,[],'browser console/page errors');
  }catch(e){failures.push(e.stack||String(e));}
  finally{if(browser)await browser.close();await new Promise(resolve=>s.close(resolve));fs.writeFileSync(path.join(artifacts,'coverage.json'),JSON.stringify({coverage,errors,failures},null,2));}
  if(failures.length)throw new Error(failures.join('\n\n'));console.log('PASS new task19 geometry: desktop/mobile snap, point visibility, restart, absolute distance and midpoint regression');
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});

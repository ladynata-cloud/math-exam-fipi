'use strict';
if (!process.env.CI) throw new Error('Run OGE22 browser acceptance in cloud CI; local Chromium is restricted in this workspace.');

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require('playwright');
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(ROOT, 'artifacts/oge22-audit-learning');
const KEY = 'mathExamCourseProgress.v1', TID = 'oge-t22-grafiki';
const MIME = {'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
const CARD = '.panel:not(.hidden) .mode-host[data-mode="marathon"]';
const host = page => page.locator(CARD);
const read = (page, fn) => page.evaluate(fn);
const evidence = page => page.evaluate(({KEY,TID})=>JSON.parse(localStorage.getItem(KEY)||'{}')[TID]?.ext?.auditLearning,{KEY,TID});
async function fit(page,label){
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1),label+': document fits');
  const bad=await page.locator('.graph-exact,.graph-critical,.graph-domain,.graph-clipping,.audit22-state,.btn-row,.oca-work,.graph-exact button,.graph-critical button').evaluateAll(nodes=>nodes.filter(n=>n.getClientRects().length).map(n=>{
    const r=n.getBoundingClientRect();return {left:r.left,right:r.right,text:n.textContent.slice(0,60)};
  }).filter(r=>r.left< -1||r.right>document.documentElement.clientWidth+1));
  assert.deepEqual(bad,[],label+': visible controls fit');
}
async function snap(page,width,label){await fit(page,label+'/'+width);await page.screenshot({path:path.join(OUT,`${width}-${label}.png`),fullPage:true});}
async function openDetails(locator){if(!await locator.evaluate(n=>n.open))await locator.locator(':scope > summary').click();}
async function chooseModule(page,id){const settings=page.locator('#courseSettings');await openDetails(settings);await page.locator(`.mod-btn[data-mod="${id}"]`).click();await settings.locator(':scope > summary').click();}
async function subtype(page,id,seed){
  const results=host(page).locator(':scope > .minimal-results');await openDetails(results);
  if(seed!==undefined)await page.evaluate(seed=>{window.__auditOldRandom=Math.random;Math.random=()=>seed/4294967296;},seed);
  try{await results.locator(`.sub-chips button[data-sub="${id}"]`).click();}
  finally{if(seed!==undefined)await page.evaluate(()=>{Math.random=window.__auditOldRandom;delete window.__auditOldRandom;});}
  await results.locator(':scope > summary').click();
}
async function openHelp(page){const card=host(page),panel=card.locator('.minimal-help');if(!await panel.isVisible())await card.locator('.minimal-hint > button').click();return panel;}
async function check(page){await host(page).locator(':scope > .btn-row .btn-check').click();}
async function fillCorrect(page){
  const truth=await page.locator(CARD).evaluate(node=>{const p=node.__problem;return p.atoms?{atoms:p.atoms.map(x=>x.type==='point'?{type:'point',v:x.v.toString()}:{type:'interval',lo:x.lo.toString(),hi:x.hi.toString(),loCl:x.loCl,hiCl:x.hiCl})}:{values:p.vals.map(x=>x.toString())};});
  const answer=host(page).locator('.ans-host');
  while(await answer.locator('.ab-rm').count())await answer.locator('.ab-rm').first().click();
  if(truth.atoms){for(const atom of truth.atoms){
    await answer.getByRole('button',{name:atom.type==='point'?'+ отдельное значение':'+ промежуток',exact:true}).click();const row=answer.locator('.ab-row').last();
    if(atom.type==='point')await row.locator('.v-dec').fill(atom.v);
    else{await row.locator('.v-dec').nth(0).fill(atom.lo);await row.locator('.v-dec').nth(1).fill(atom.hi);await row.locator('select').nth(0).selectOption(atom.loCl?'[':'(');await row.locator('select').nth(1).selectOption(atom.hiCl?']':')');}
  }}else for(const value of truth.values){await answer.getByRole('button',{name:'+ значение',exact:true}).click();await answer.locator('.v-dec').last().fill(value);}
}
async function exact(page,value){const panel=host(page).locator('.minimal-help');await panel.locator('.graph-exact-input').first().fill(value);await panel.locator('.graph-exact-input').first().press('Enter');return Number(await panel.locator('.badge-t2').first().textContent());}
async function attempt(page){return host(page).evaluate(node=>({id:node.__attempt.id,key:node.__attempt.taskKey,skill:node.__attempt.skill,fresh:node.__attempt.fresh,helpKinds:node.__attempt.helpKinds,errors:node.__attempt.errors,firstAnswer:node.__attempt.firstAnswer}));}

(async()=>{
  fs.mkdirSync(OUT,{recursive:true});
  const server=http.createServer((req,res)=>{
    const file=path.resolve(ROOT,'.'+new URL(req.url,'http://localhost').pathname);
    if(!file.startsWith(ROOT+path.sep)){res.writeHead(403).end();return;}
    fs.readFile(file,(error,bytes)=>{if(error){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':MIME[path.extname(file)]||'application/octet-stream'});res.end(bytes);});
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url='http://127.0.0.1:'+server.address().port+'/trainers/oge-task22-functions-graphs.html';
  const errors=[],coverage=[];let browser;
  try{
    browser=await chromium.launch({headless:true});
    for(const width of [320,390,1280]){
      const context=await browser.newContext({viewport:{width,height:920},reducedMotion:'reduce'});
      await context.addInitScript(({KEY,TID})=>{
        window.__TESTHOOK__=true;let seed=773;Math.random=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
        if(!localStorage.getItem(KEY))localStorage.setItem(KEY,JSON.stringify({foreign:{v:1,solvedByType:{x:4},ext:{keep:'yes'}},[TID]:{v:1,updatedAt:123,solvedByType:{legacy:9},ext:{other:{preserve:true}}}}));
      },{KEY,TID});
      const page=await context.newPage();page.on('pageerror',error=>errors.push({width,message:error.message}));
      await page.goto(url);await page.locator('html[data-oge-algebra-experience="ready"]').waitFor();
      assert.equal((await evidence(page)).resume.hasWork,false,'initial entry is not unfinished work');
      await snap(page,width,'initial');
      const prototypes=[];
      for(const [mod,sub] of [['m1','parline'],['m1','parhyp'],['m2','absquad'],['m2','xabsx'],['m2','sqminuslin'],['m2','alinplusquad'],['m3','inv_kx'],['m3','shift_m'],['m3','parab_kx']]){
        await chooseModule(page,mod);await subtype(page,sub);const before=await attempt(page),panel=await openHelp(page);
        const critical=panel.locator('.graph-critical button');assert(await critical.count()>0);
        for(let i=0;i<await critical.count();i++){
          const value=await critical.nth(i).getAttribute('data-parameter');await critical.nth(i).focus();await page.keyboard.press('Space');
          assert.equal(await panel.locator('.graph-exact-input').first().inputValue(),value);
          const count=Number(await panel.locator('.badge-t2').first().textContent());assert(Number.isInteger(count)&&count>=0);
          assert.match(await panel.locator('.oca-graph-count').textContent(),new RegExp(String(count)));
        }
        const svg=await panel.locator('svg').first().innerHTML(),slider=panel.getByRole('slider',{name:'Положение прямой'}).first();await slider.focus();await page.keyboard.press('ArrowLeft');
        assert.notEqual(await panel.locator('svg').first().innerHTML(),svg,'keyboard changes the model');
        assert.equal((await attempt(page)).key,before.key);assert.equal(await host(page).locator('.oca-work').count(),1);
        await snap(page,width,mod+'-'+sub);await fillCorrect(page);await check(page);
        const record=(await evidence(page)).attempts.at(-1);assert.equal(record.outcome,before.fresh?'helped':'familiar');assert.equal(record.helpUsed,true);prototypes.push(sub);
      }

      // Seed 60 is the original bank's (3x+5)/(3x²+5x): exact answer 9/25.
      await chooseModule(page,'m3');await subtype(page,'inv_kx',60);
      await host(page).locator('.ans-host .v-dec').fill('777');await check(page);
      const initial=await attempt(page);assert.equal(initial.firstAnswer,'777');
      await host(page).locator('.ans-host .v-tog').click();await host(page).locator('.ans-host .v-num').fill('9');await host(page).locator('.ans-host .v-den').fill('');
      let panel=await openHelp(page);assert.equal(await exact(page,'9/25'),1);assert.equal(await exact(page,'360000001/1000000000'),2);assert.equal(await exact(page,'9/25'),1);
      await panel.getByRole('textbox',{name:'Аргумент x для таблицы'}).fill('-5/3');await panel.getByRole('button',{name:'Найти значение',exact:true}).click();assert.match(await panel.locator('.graph-value').textContent(),/не определена/);
      const work=host(page).locator('.oca-work');await work.locator('textarea').fill('ОДЗ: x ≠ 0 и x ≠ −5/3.\nСокращение не возвращает запрещённую точку.');
      await panel.getByRole('button',{name:'Разобрать по шагам',exact:true}).click();await panel.locator('.step-card.active').getByRole('button',{name:'Показать шаг',exact:true}).click();
      const radios=panel.locator('.step-card.active input[type=radio]');if(await radios.count())await radios.first().check();
      assert.doesNotMatch(await panel.locator('.choices').first().textContent(),/<span|class=|<i>/);
      const saved=await attempt(page),condition=await host(page).locator(':scope > div > .statement').first().innerHTML();
      await snap(page,width,'fraction-help-draft');await page.reload();await page.locator('html[data-oge-algebra-experience="ready"]').waitFor();
      const restored=await attempt(page);assert.equal(restored.key,saved.key);assert.equal(restored.id,saved.id);assert.equal(restored.firstAnswer,'777');assert.equal(restored.errors.length,1);assert(restored.helpKinds.includes('step-reveal'));
      assert.equal(await host(page).locator(':scope > div > .statement').first().innerHTML(),condition);
      assert.equal(await host(page).locator('.ans-host .v-num').inputValue(),'9');assert.equal(await host(page).locator('.ans-host .v-den').inputValue(),'');
      panel=host(page).locator('.minimal-help');assert(await panel.isVisible());assert.equal(await panel.locator('.graph-exact-input').first().inputValue(),'9/25');
      assert.equal(await panel.locator('.graph-point-input').first().inputValue(),'-5/3');assert.match(await panel.locator('.graph-value').first().textContent(),/не определена/);
      assert.equal(await panel.locator('.step-card.peeked').count(),1);assert.equal(await panel.locator('.step-card').count(),2);
      assert.equal(await host(page).locator('.oca-work textarea').inputValue(),'ОДЗ: x ≠ 0 и x ≠ −5/3.\nСокращение не возвращает запрещённую точку.');
      await snap(page,width,'restored-all-fields');await fillCorrect(page);await check(page);
      assert.equal((await evidence(page)).attempts.at(-1).outcome,saved.fresh?'helped':'familiar');assert.equal((await evidence(page)).attempts.at(-1).helpUsed,true);assert.match(await host(page).locator(':scope > .fb').textContent(),/ответ был показан/);
      const count=(await evidence(page)).attempts.length;await page.reload();await host(page).locator(':scope > .btn-row .btn-check').waitFor();assert.equal((await evidence(page)).attempts.length,count);
      await host(page).locator(':scope > .btn-row .btn-retry').click();const next=await attempt(page);assert.notEqual(next.key,saved.key);assert.equal(next.skill,saved.skill);assert.deepEqual(next.helpKinds,[]);
      await snap(page,width,'fresh-after-help');

      // Seed 104 gives 81, outside the old ±12 slider. The real task control must reach it.
      await subtype(page,'inv_kx',104);panel=await openHelp(page);await panel.locator('[data-parameter="81"]').click();
      assert.equal(await panel.getByRole('slider',{name:'Положение прямой'}).inputValue(),'81');assert.equal(await panel.locator('.badge-t2').textContent(),'1');
      await snap(page,width,'k81-critical');
      // The bank's p=9, x_h=1 has tangent (-3,-18) and a surviving secant root (9,-90).
      await subtype(page,'parab_kx',21);panel=await openHelp(page);
      for(const parameter of ['6','-10']){
        await panel.locator('[data-parameter="'+parameter+'"]').click();assert.equal(await panel.locator('.badge-t2').textContent(),'1');
        assert(await panel.locator('.gview svg').first().evaluate(svg=>{const box=svg.viewBox.baseVal;return [...svg.querySelectorAll('.xmark,.dot-open')].every(mark=>{const x=+mark.getAttribute('cx'),y=+mark.getAttribute('cy');return x>=0&&x<=box.width&&y>=0&&y<=box.height;});}),'critical parabola marks lie inside the graph');
        if(parameter==='-10')await panel.locator('.minimal-model-scroll').first().evaluate(node=>node.scrollLeft=node.scrollWidth-node.clientWidth);
        await snap(page,width,parameter==='6'?'parabola-tangency-visible':'parabola-hole-secant-visible');
      }

      assert.equal(await exact(page,'100'),2);assert.match(await panel.locator('.graph-clipping').textContent(),/1 из 2/);await snap(page,width,'off-scale-intersection-note');

      // Interval brackets and raw typed values are a different kind of draft from the fraction above.
      await chooseModule(page,'m1');await subtype(page,'parline');const answer=host(page).locator('.ans-host');
      await answer.getByRole('button',{name:'+ промежуток',exact:true}).click();await answer.locator('.v-dec').nth(0).fill('-7/3');await answer.locator('.v-dec').nth(1).fill('2,5');
      await answer.locator('select').nth(0).selectOption('(');await answer.locator('select').nth(1).selectOption(']');
      await answer.getByRole('button',{name:'+ отдельное значение',exact:true}).click();await answer.locator('.v-dec').nth(2).fill('3/2');const intervalId=(await attempt(page)).id;
      await page.reload();assert.equal((await attempt(page)).id,intervalId);assert.deepEqual(await host(page).locator('.ans-host .v-dec').evaluateAll(nodes=>nodes.map(n=>n.value)),['-7/3','2,5','3/2']);
      assert.deepEqual(await host(page).locator('.ans-host select').evaluateAll(nodes=>nodes.map(n=>n.value)),['(',']']);await snap(page,width,'interval-draft');

      // The second tab changes the same session. Its help and latest answer must win before grading.
      await chooseModule(page,'m3');await host(page).getByRole('button',{name:'Другая задача →',exact:true}).click();await host(page).locator('.ans-host .v-dec').fill('11');
      const peer=await context.newPage();peer.on('pageerror',error=>errors.push({width,peer:true,message:error.message}));await peer.goto(url);await peer.locator('html[data-oge-algebra-experience="ready"]').waitFor();
      await host(peer).locator('.ans-host .v-dec').fill('22');await openHelp(peer);
      await page.waitForFunction(selector=>document.querySelector(selector+' .ans-host .v-dec')?.value==='22',CARD);
      assert((await attempt(page)).helpKinds.includes('model'));assert.equal((await attempt(page)).errors.length,0);
      const staleFresh=(await attempt(page)).fresh;await fillCorrect(page);await check(page);assert.equal((await evidence(page)).attempts.at(-1).outcome,staleFresh?'helped':'familiar');assert.equal((await evidence(page)).attempts.at(-1).helpUsed,true);await snap(page,width,'stale-tab-help');await peer.close();
      const all=await page.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY)),KEY);assert.deepEqual(all.foreign,{v:1,solvedByType:{x:4},ext:{keep:'yes'}});assert.equal(all[TID].updatedAt,123);assert.deepEqual(all[TID].solvedByType,{legacy:9});assert.deepEqual(all[TID].ext.other,{preserve:true});
      coverage.push({width,prototypes,criticalFractions:true,k81:true,visibleParabolaCriticals:true,offScaleNote:true,rawDrafts:true,notes:true,revealSticky:true,reloadIdempotent:true,newSameSkill:true,staleTab:true,foreignCore:true});await context.close();
    }

    // Exercise the unchanged schema-1 board wire with new graph controls and native step history.
    const shared=await browser.newPage({viewport:{width:390,height:920}});shared.on('pageerror',error=>errors.push({shared:true,message:error.message}));
    await shared.goto(url+'?board=1');await shared.locator('#oge-shared-module').waitFor();await shared.locator('#oge-shared-module').selectOption('m3:inv_kx');
    let stage=shared.locator('.oge-native-shared-stage');await stage.locator('.minimal-hint > button').click();
    await stage.locator('.graph-critical button').last().click();await stage.locator('.graph-point-input').fill('0');await stage.getByRole('button',{name:'Найти значение',exact:true}).click();
    await stage.getByRole('button',{name:'Разобрать по шагам',exact:true}).click();await stage.locator('.step-card.active').getByRole('button',{name:'Показать шаг',exact:true}).click();
    const before=await read(shared,()=>({snapshot:getBoardTrainerState(),keys:Object.keys(localStorage),statement:document.querySelector('.oge-native-shared-stage .statement').innerHTML}));
    assert.equal(before.keys.length,0);await shared.evaluate(snapshot=>applyBoardTrainerState(snapshot),before.snapshot);stage=shared.locator('.oge-native-shared-stage');
    assert.deepEqual(await read(shared,()=>getBoardTrainerState()),before.snapshot);assert.equal(await stage.locator('.statement').first().innerHTML(),before.statement);assert.equal(await stage.locator('.step-card.peeked').count(),1);
    assert.match(await stage.locator('.graph-value').first().textContent(),/не определена/);assert.equal(await read(shared,()=>localStorage.length),0);
    await snap(shared,390,'shared-replay');await shared.close();
    assert.deepEqual(errors,[]);
    console.log('OGE22_AUDIT_LEARNING_BROWSER_OK: 320/390/1280; nine real prototypes; exact fractions/81; notes, answers, brackets, help and step restore; stale tabs; schema-1 replay');
  }finally{
    if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));fs.writeFileSync(path.join(OUT,'coverage.json'),JSON.stringify({coverage,errors},null,2));
  }
})().catch(error=>{console.error(error);process.exitCode=1;});

'use strict';
// Cloud CI only. Navigation and interactions use actual learner controls.
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..');
const artifacts=path.resolve(process.env.TASK9_TRANSFER_ARTIFACTS||path.join(root,'artifacts/task9-transfer-all'));
const KEY='mathExamCourseProgress.v1',URL_PATH='/trainers/oge-task9-equations.html';
const FAMILIES=['L','LB','LF','LSQ','QNB','QNC','QNCm','QF','QR','QP','PROP','Z','NZ','XF','S2','SB'];
const KINDS=['distribute','square','multiplier','cross-products','square-signs','zero-product','coefficients','denominators'];
const ROUTES=[['g_l1','простые'],['g_l2','x с двух сторон'],['g_lb','со скобками'],['g_lf','дробные коэффициенты'],['g_lsq','(x+a)² = (x+b)²'],['g_qnc','без c (вынеси x)'],['g_qnb','без b (±√)'],['g_qf','полное'],['g_qp','разложено на множители'],['g_qr','сначала приведи'],['g_prop','пропорция'],['g_nz','дробь = 0'],['g_xf','x и дробь'],['g_heavy','две дроби = число']];
const compact=text=>text.replace(/\s/g,'').replace(/−/g,'-');
const markupText=html=>compact(JSDOM.fragment(html).textContent);
async function serve(){
 const server=http.createServer((req,res)=>{
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch(_){res.writeHead(400).end();return;}
  if(pathname==='/favicon.ico'){res.writeHead(204).end();return;}
  const file=path.resolve(root,'.'+pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.js')?'application/javascript; charset=utf-8':'text/plain; charset=utf-8'}).end(data);});
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return{server,url:'http://127.0.0.1:'+server.address().port+URL_PATH};
}
async function fits(page,label){
 const bad=await page.evaluate(()=>{
  const selectors=['.pane.on .task-card:not([hidden])','.pane.on .generated-help:not([hidden])','.pane.on .transfer-lab','.pane.on .transfer-side','.pane.on .transfer-term','.pane.on .equation-discovery','.pane.on .equation-discovery button','.pane.on .equation-discovery input','.pane.on input','.pane.on .transfer-original'];
  const bounds=selectors.flatMap(selector=>[...document.querySelectorAll(selector)].filter(el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden').map(el=>{const r=el.getBoundingClientRect();return{selector,left:r.left,right:r.right,width:innerWidth};})).filter(r=>r.left < -1 || r.right > r.width+1);
  const content=[...document.querySelectorAll('.pane.on .transfer-term,.pane.on .transfer-side,.pane.on .equation-discovery button')].filter(el=>el.getClientRects().length&&el.clientWidth>0&&el.scrollWidth>el.clientWidth+1).map(el=>({selector:el.className,content:el.scrollWidth,available:el.clientWidth,text:el.textContent.slice(0,90)}));
  return bounds.concat(content);
 });
 assert.deepEqual(bad,[],label+' visible controls fit');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' page fits');
}
const credit=page=>page.evaluate(key=>localStorage.getItem(key),KEY);
const bankRecord=(page,index)=>page.evaluate(index=>({record:{...maraRec(BANK[index].id)},solved:[...maraState.solved],clean:[...maraState.clean],shown:[...maraState.shown]}),index);
async function openBankPicker(page){
 const details=page.locator('#pane-mara .minimal-task-nav > details');if(await details.getAttribute('open')===null)await details.locator(':scope > summary').click();
 return page.locator('#pane-mara .minimal-task-nav select');
}
async function changeMode(page,mode){
 const menu=page.locator('details.minimal-settings').filter({has:page.locator('nav.tabs')});if(await menu.getAttribute('open')===null)await menu.locator(':scope > summary').click();
 await page.locator('nav.tabs [data-pane="'+mode+'"]').click();assert.equal(await page.locator('#pane-'+mode).isVisible(),true);
}
async function readTerms(lab){
 return lab.locator('.transfer-term[data-term-id]').evaluateAll(nodes=>nodes.map(el=>{
  const body=el.cloneNode(true),sign=body.querySelector('.transfer-sign').textContent.trim();body.querySelector('.transfer-sign').remove();
  return{id:el.dataset.termId,side:el.closest('[data-side]').dataset.side,sign,body:body.innerHTML,disabled:el.disabled};
 }));
}
async function pointerDrag(page,source,target){
 await source.scrollIntoViewIfNeeded();const a=await source.boundingBox(),b=await target.boundingBox();assert(a&&b);
 const x=a.x+a.width/2,y=a.y+a.height/2,tx=b.x+b.width/2,ty=b.y+b.height/2;
 await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+9,y,{steps:3});await page.mouse.move(tx,ty,{steps:12});await page.mouse.move(tx+1,ty,{steps:2});await page.mouse.up();
}
async function exerciseTransfer(page,lab,{touch=false,drag=false}={}){
 const original=await readTerms(lab);assert(original.length,'original equation has signed terms');assert(original.every(t=>!t.disabled));
 // Prefer a compound card; its whole body must survive the outer-sign change.
 const item=[...original].sort((a,b)=>b.body.length-a.body.length)[0],to=item.side==='L'?'R':'L';
 const chip=()=>lab.locator('[data-term-id="'+item.id+'"]');
 if(drag)await pointerDrag(page,chip(),lab.locator('[data-side="'+to+'"]'));
 else await chip().press(to==='L'?'ArrowLeft':'ArrowRight');
 const moved=(await readTerms(lab)).find(t=>t.id===item.id);
 assert.equal(moved.side,to);assert.equal(compact(moved.sign),compact(item.sign)==='+'?'-':'+');assert.equal(moved.body,item.body,'only the outer sign changes, including compound terms');
 assert.equal((await readTerms(lab)).length,original.length,'crossing does not split or duplicate a term');
 if(drag)await page.waitForTimeout(380); // deliberate follow-up after the 350ms native-drop click guard
 if(touch)await chip().tap();else await chip().press('Enter');
 assert.deepEqual(await readTerms(lab),original,'reverse crossing restores exact original term identities, bodies and signs');
 return{compound:/frac|\(|sup|²/.test(item.body),nativeDrag:drag,touch};
}
async function retainAlteredEquation(lab,original){
 if(JSON.stringify(await readTerms(lab))===JSON.stringify(original)){const term=original[0];await lab.locator('[data-term-id="'+term.id+'"]').press(term.side==='L'?'ArrowRight':'ArrowLeft');}
 const altered=await readTerms(lab);assert.notDeepEqual(altered,original,'retention is checked against a deliberately changed equation');return altered;
}
async function discover(page,panel,seen,{force=false,screenshot=''}={}){
 const details=panel.locator('.equation-discovery').first();if(!await details.count())return null;
 const kind=await details.getAttribute('data-discovery-kind');assert(KINDS.includes(kind));
 if(seen.has(kind)&&!force)return kind;
 assert.equal(await details.getAttribute('open'),null,'nested discovery starts optional');
 await details.locator(':scope > summary').click();
 const status=details.locator('[data-discovery-status]');const before=await status.innerText();
 const action=name=>details.locator('[data-discovery-action="'+name+'"]');
 switch(kind){
  case 'distribute':await action('distribute').first().click();break;
  case 'square':await action('square-product').first().click();break;
  case 'multiplier':await details.locator('[data-discovery-input="multiplier"]').fill('1');await action('check-multiplier').click();assert.match(await status.getAttribute('data-valid'),/^(true|false)$/);break;
  case 'cross-products':await details.locator('[data-corner="0"]').click();await details.locator('[data-corner="3"]').click();break;
  case 'square-signs':await details.locator('[data-discovery-input="square-x"]').fill('2');await action('check-square').click();assert.match(await status.getAttribute('data-matches'),/^(true|false)$/);break;
  case 'zero-product':if(await action('show-factors').count())await action('show-factors').click();await action('zero-factor').first().click();break;
  case 'coefficients':if(await action('collect-coefficients').count())await action('collect-coefficients').click();await action('coefficient-token').first().click();await details.locator('[data-coefficient-slot="a"]').click();break;
  case 'denominators':await details.locator('[data-discovery-input="denominator-x"]').fill('0');await action('check-denominators').click();assert.match(await status.getAttribute('data-defined'),/^(true|false)$/);break;
  default:throw Error('uncovered discovery kind '+kind);
 }
 assert.notEqual(await status.innerText(),before,kind+' action produces an observable discovery');
 await fits(page,'discovery '+kind);if(screenshot)await details.screenshot({path:path.join(artifacts,screenshot)});
 seen.add(kind);await details.locator(':scope > summary').click();return kind;
}
async function answerLabel(main,question){
 const label=await main.getAttribute('aria-label');assert(label&&label.trim(),'the final answer has a concrete accessible label');
 assert.match(label,/больший/.test(question)?/больш/:/меньший/.test(question)?/меньш/:/x|корень/);
}
async function noVisibleHelp(card){assert.equal(await card.locator('.transfer-lab:visible').count(),0,'no movable equation appears before help is requested');assert.equal(await card.locator('.equation-discovery:visible').count(),0,'no discovery appears outside requested help');}
async function checkOriginal(lab,expected){
 assert.equal(await lab.getAttribute('data-source'),'original');const text=compact(await lab.locator('.transfer-original .math').innerText());
 assert.equal(text,markupText(expected),'help starts from the exact displayed original equation');
}
async function bankJourney(page,url,width,seen){
 await page.goto(url);await page.locator('#mara-list > .task-card:not([hidden])').waitFor();
 const targets=await page.evaluate(()=>[...new Set(BANK.map(t=>t.fam))].map(fam=>{const index=BANK.findIndex(t=>t.fam===fam);return{fam,index,equation:taskEqnHTML(BANK[index])};}));
 assert.deepEqual(targets.map(t=>t.fam).sort(),[...FAMILIES].sort());
 const selected=width===1280?targets:targets.filter(t=>['L','LSQ','QF','NZ','SB'].includes(t.fam));const coverage=[];
 for(const t of selected){
  const picker=await openBankPicker(page);await picker.selectOption(String(t.index));
  const card=page.locator('#mara-list > .task-card:not([hidden])'),main=card.locator(':scope > .field input').first();
  await noVisibleHelp(card);await answerLabel(main,await card.locator(':scope > .task-q').innerText());await main.fill('17,5');const question=await card.locator(':scope > .task-q').innerHTML(),before=await credit(page),recordBefore=await bankRecord(page,t.index);
  const help=card.getByRole('button',{name:'Хочешь подсказку?',exact:true});await help.click();
  const panel=card.locator('.minimal-hint-panel'),lab=panel.locator('.transfer-lab[data-source="original"]').first();await lab.waitFor();await checkOriginal(lab,t.equation);const initialTerms=await readTerms(lab);
  if(t.fam!=='L')assert(await panel.locator('.equation-discovery[data-discovery-family="'+t.fam+'"]').count(),'this family has its optional discovery');
  const interaction=await exerciseTransfer(page,lab,{touch:width<600,drag:t.fam==='LB'||(width<600&&t.fam==='LSQ')});
  const kind=await discover(page,panel,seen,{force:width<600,screenshot:width<600&&t.fam==='SB'?width+'-rational-discovery.png':''});
  assert.equal(await main.inputValue(),'17,5');assert.equal(await credit(page),before,'exploration awards nothing');
  const rec=await bankRecord(page,t.index);assert.equal(rec.record.hinted,true);assert.equal(rec.record.counted,false);assert.deepEqual(rec.solved,recordBefore.solved);assert.deepEqual(rec.clean,recordBefore.clean);assert.deepEqual(rec.shown,recordBefore.shown);
  await fits(page,'bank '+t.fam+' '+width);
  if(['L','QF','SB'].includes(t.fam))await panel.screenshot({path:path.join(artifacts,width+'-bank-'+t.fam+'.png')});
  const terms=await retainAlteredEquation(lab,initialTerms);await panel.getByRole('button',{name:'Вернуться к задаче',exact:true}).click();assert.equal(await panel.isVisible(),false);
  assert(await main.evaluate(el=>el===document.activeElement));await help.click();assert.deepEqual(await readTerms(lab),terms);assert.equal(await main.inputValue(),'17,5');assert.deepEqual(await bankRecord(page,t.index),rec);
  await help.click();await page.locator('#pane-mara .minimal-next').click();
  const next=page.locator('#mara-list > .task-card:not([hidden])');await noVisibleHelp(next);assert.equal(await next.locator(':scope > .field input').first().inputValue(),'','next bank task starts without the old answer');
  await picker.selectOption(String(t.index));assert.equal(await main.inputValue(),'17,5');assert.equal(await card.locator(':scope > .task-q').innerHTML(),question);assert.equal(await credit(page),before);
  coverage.push({family:t.fam,...interaction,discovery:kind,nextTask:true});
 }
 return coverage;
}
async function methodRoundTrip(page,panel,main){
 const vieta=panel.getByRole('button',{name:'По Виета',exact:true});
 assert.equal(await vieta.count(),1,'full quadratics retain their method selector');
 if(await vieta.isDisabled())return 'vieta-disabled-for-current-equation';
 const original=panel.locator('.generated-method[data-method="discriminant"]'),lab=original.locator('.transfer-lab[data-source="original"]').first();
 const term=(await readTerms(lab))[0];await lab.locator('[data-term-id="'+term.id+'"]').press(term.side==='L'?'ArrowRight':'ArrowLeft');
 const terms=await readTerms(lab),field=original.locator('.step.active input').first();if(await field.count())await field.fill('77');
 const progress=await credit(page),answer=await main.inputValue();
 await vieta.click();assert.equal(await original.isVisible(),false);assert.equal(await panel.locator('.generated-method[data-method="vieta"]').isVisible(),true);
 await panel.getByRole('button',{name:'Дискриминант',exact:true}).click();assert.equal(await original.isVisible(),true);
 assert.deepEqual(await readTerms(lab),terms,'changing method retains the original experimental equation');if(await field.count())assert.equal(await field.inputValue(),'77','changing method retains the unfinished coefficient');
 assert.equal(await main.inputValue(),answer);assert.equal(await credit(page),progress,'method changes do not award progress');return 'round-trip-preserved';
}
async function generatedJourney(page,width,seen){
 await changeMode(page,'step');const selected=width===1280?ROUTES:ROUTES.filter(([gid])=>['g_lsq','g_qf','g_heavy'].includes(gid));const coverage=[];
 for(const[gid,label]of selected){
  await page.locator('#pane-step > .card .chips').getByRole('button',{name:label,exact:true}).click();
  const card=page.locator('#step-work > .card'),main=card.locator(':scope > .field input').first(),help=card.getByRole('button',{name:'Хочешь подсказку?',exact:true});
  assert.equal(await card.getAttribute('data-task-gid'),gid);assert(FAMILIES.includes(await card.getAttribute('data-task-family')));
  await noVisibleHelp(card);await answerLabel(main,await card.locator(':scope > .task-q').innerText());await main.fill('23,5');const question=compact(await card.locator(':scope > .task-q').innerText()),before=await credit(page);
  await help.click();const panel=card.locator('.generated-help'),lab=panel.locator('.transfer-lab[data-source="original"]').first();await lab.waitFor();const initialTerms=await readTerms(lab);
  const family=await card.getAttribute('data-task-family');if(family!=='L')assert(await panel.locator('.equation-discovery[data-discovery-family="'+family+'"]').count(),'generated family has its optional discovery');
  const formula=compact(await lab.locator('.transfer-original .math').innerText());assert(question.includes(formula),'generated help uses its current displayed equation');
  await exerciseTransfer(page,lab,{touch:width<600});await discover(page,panel,seen);
  const methodSwitch=gid==='g_qf'?await methodRoundTrip(page,panel,main):null;assert.equal(await main.inputValue(),'23,5');assert.equal(await credit(page),before);
  await fits(page,'generator '+gid+' '+width);if(gid==='g_heavy')await panel.screenshot({path:path.join(artifacts,width+'-generated-fractions.png')});
  const terms=await retainAlteredEquation(lab,initialTerms);await panel.locator('.generated-return').click();assert.equal(await panel.isVisible(),false);assert(await main.evaluate(el=>el===document.activeElement));
  await help.click();assert.deepEqual(await readTerms(lab),terms);assert.equal(await main.inputValue(),'23,5');
  const oldPanel=await panel.elementHandle();await card.getByRole('button',{name:'Следующая задача →',exact:true}).click();assert.equal(await oldPanel.evaluate(el=>el.isConnected),false,'next generated task discards the old task-specific panel');
  assert.equal(await main.inputValue(),'');await noVisibleHelp(card);assert.equal(await credit(page),before);await help.click();
  const fresh=compact(await panel.locator('.transfer-original .math').first().innerText());assert(compact(await card.locator(':scope > .task-q').innerText()).includes(fresh));
  await panel.locator('.generated-return').click();coverage.push({gid,methodSwitch});
 }
 return coverage;
}
async function completeKnownLinearStep(panel){
 const step=panel.locator('.step.active');await step.getByRole('textbox',{name:'Число перед x после сложения',exact:true}).fill('2');await step.getByRole('textbox',{name:'Число справа после сложения',exact:true}).fill('20');await step.getByRole('button',{name:'Проверить',exact:true}).click();
}
async function completedStepJourney(page,url,width){
 for(const useBeforeFinish of[true,false]){
  await page.goto(url);const card=page.locator('#mara-list > .task-card:not([hidden])');await card.getByRole('button',{name:'Хочешь подсказку?',exact:true}).click();const panel=card.locator('.minimal-hint-panel');
  await completeKnownLinearStep(panel);const accepted=panel.locator('.step.done').first(),lab=accepted.locator('.transfer-lab').first();
  const values=await accepted.locator('input').evaluateAll(inputs=>inputs.map(input=>({value:input.value,disabled:input.disabled})));assert(values.length&&values.every(i=>i.disabled));
  assert((await readTerms(lab)).every(t=>!t.disabled),'accepted steps retain live cards');assert.equal(await lab.getByRole('button',{name:'Перейти к сложению',exact:true}).isVisible(),false,'completed collection no longer prompts entry into locked fields');
  const before=await credit(page);assert.equal((await bankRecord(page,0)).record.hinted,false);
  if(useBeforeFinish){await exerciseTransfer(page,lab,{touch:width<600});assert.equal((await bankRecord(page,0)).record.hinted,true,'exploring an earlier accepted step records help while later work remains');assert.equal(await credit(page),before);}
  assert.deepEqual(await accepted.locator('input').evaluateAll(inputs=>inputs.map(input=>({value:input.value,disabled:input.disabled}))),values);
  assert.equal(await panel.locator('.step.active').count(),1,'exploration never advances the current step');
  const final=panel.locator('.step.active');await final.locator('input').first().fill('10');await final.getByRole('button',{name:'Проверить',exact:true}).click();
  const finished=await bankRecord(page,0),progress=await credit(page);assert.equal(finished.record.counted,true);assert.equal(finished.clean.length,useBeforeFinish?0:1);
  await exerciseTransfer(page,lab,{touch:width<600});assert.deepEqual(await bankRecord(page,0),finished,'post-completion exploration does not retroactively change credit');assert.equal(await credit(page),progress);
  assert.deepEqual(await accepted.locator('input').evaluateAll(inputs=>inputs.map(input=>({value:input.value,disabled:input.disabled}))),values);await fits(page,'live accepted step '+width);
  if(!useBeforeFinish)await accepted.screenshot({path:path.join(artifacts,width+'-completed-step-live.png')});
 }
 return{liveCards:true,lockedAcceptedAnswers:true,unfinishedAssistance:true,noRetroactiveCreditChange:true};
}
(async()=>{
 fs.mkdirSync(artifacts,{recursive:true});const{server,url}=await serve();let browser,livePage,liveContext;const errors=[],evidence=[],kinds=new Set();
 try{
  browser=await chromium.launch({headless:true});
  for(const width of[1280,320,360]){
   const context=await browser.newContext({viewport:{width,height:900},hasTouch:width<600,reducedMotion:'reduce'});liveContext=context;await context.tracing.start({screenshots:true,snapshots:true});
   const page=await context.newPage();livePage=page;page.setDefaultTimeout(15000);
   page.on('pageerror',e=>errors.push(width+': '+e.message));page.on('console',m=>{if(m.type()==='error')errors.push(width+': '+m.text());});
   const bank=await bankJourney(page,url,width,kinds),generators=await generatedJourney(page,width,kinds),completed=await completedStepJourney(page,url,width);
   evidence.push({width,bank,generators,completed});assert.deepEqual(errors,[],'no runtime errors across every route');
   await context.tracing.stop({path:path.join(artifacts,width+'-trace.zip')});await context.close();livePage=null;liveContext=null;console.log('PASS '+width+'px: '+bank.length+' bank families, '+generators.length+' generator routes, retained live accepted steps');
  }
  assert.deepEqual([...kinds].sort(),[...KINDS].sort(),'every kind of optional discovery was opened and used');fs.writeFileSync(path.join(artifacts,'coverage.json'),JSON.stringify({evidence,discoveryKinds:[...kinds],errors},null,2));
 }catch(error){
  if(livePage)await livePage.screenshot({path:path.join(artifacts,'failure.png'),fullPage:true}).catch(()=>{});
  if(liveContext)await liveContext.tracing.stop({path:path.join(artifacts,'failure-trace.zip')}).catch(()=>{});
  fs.writeFileSync(path.join(artifacts,'failure.json'),JSON.stringify({message:error.message,stack:error.stack,evidence,discoveryKinds:[...kinds],errors},null,2));throw error;
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});

'use strict';
// Cloud/CI browser gate. Do not run Chromium in the restricted authoring host.
// Integrate at tools/stereo-textbook/browser.cjs; all paths can be overridden.
// Never modifies authored review flags or serves a promoted test copy.
// Use TEXTBOOK_EXPECTED_BUNDLE for the independently frozen author bundle; without
// it, the integrated course bundle supplies the expected cards (no separate source
// equality evidence). TEXTBOOK_BASE_URL may point to an existing HTTP preview;
// otherwise a local static server serves TEXTBOOK_ROOT for CI Chromium.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os'),crypto=require('node:crypto');
const root=path.resolve(process.env.TEXTBOOK_ROOT||path.join(__dirname,'../..'));
const route=process.env.TEXTBOOK_ROUTE||'/stereo-course/textbook/';
const expectedPath=path.resolve(process.env.TEXTBOOK_EXPECTED_BUNDLE||path.join(root,'stereo-course/textbook/data/course.json'));
const out=path.resolve(process.env.TEXTBOOK_ARTIFACTS||path.join(os.tmpdir(),'mathexam-stereo-textbook'));
const expectedRaw=JSON.parse(fs.readFileSync(expectedPath,'utf8')),expectedLessons=Array.isArray(expectedRaw)?expectedRaw:expectedRaw.lessons;
assert(Array.isArray(expectedLessons)&&expectedLessons.length,'An authored lesson bundle is required');
const expectedCount=Number(process.env.TEXTBOOK_EXPECTED_COUNT||63);
assert.equal(expectedLessons.length,expectedCount,'Unexpected authored card count; update this gate explicitly for a later batch');
assert(/^\/[A-Za-z0-9/_-]+\/$/.test(route),'TEXTBOOK_ROUTE must be a local absolute path ending in /');
const expectedById=new Map(expectedLessons.map(lesson=>[lesson.id,lesson]));assert.equal(expectedById.size,expectedCount);
const evidence={authoredCards:expectedCount,separateAuthorBundle:!!process.env.TEXTBOOK_EXPECTED_BUNDLE,authoredFileSha256:crypto.createHash('sha256').update(fs.readFileSync(expectedPath)).digest('hex'),commit:process.env.GITHUB_SHA||null,widths:[320,1280],cards:[],labels:[],screenshots:[],expansionScreenshots:[],expansions:[],twoTabs:[],errors:[]};
let browser,context,page,server,base,activeCase='startup';
const writeEvidence=()=>fs.writeFileSync(path.join(out,'browser-evidence.json'),JSON.stringify(evidence,null,2));
const stateKey=lesson=>'mathExamTextbook.v1:'+lesson.source.bookId+':'+lesson.id+':r'+lesson.revision;
const screenshotCases=new Map([
 ['atanasyan2024-main-001-a|condition','figure8-condition'],
 ['atanasyan2024-main-002-c|condition','figure9-condition'],
 ['atanasyan2024-theory-002-a1|condition','axiom-a1-condition'],
 ['atanasyan2024-main-001-a|step-1','figure8-lines'],
 ['atanasyan2024-main-002-c|step-3','figure9-back-plane'],
 ['atanasyan2024-main-008-a|step-2','circle-two-points-counterexample'],
 ['atanasyan2024-main-010-a|step-2','triangle-vertex-counterexample'],
 ['atanasyan2024-main-001-a|nested-theory','nested-theory'],
 ['theory-004|condition','parallel-theory-condition'],
 ['theory-006|condition','line-plane-theory-condition'],
 ['theory-006|help:missing-condition','line-contained-plane'],
 ['ex-main-0020|step-4','trapezoid-coincident-plane'],
 ['ex-main-0026|step-3','similarity-angles'],
 ['ex-main-0034|condition','tetrahedron-parts-condition'],
 ['ex-main-0034|step-5','tetrahedron-part-d'],
 ['ex-main-0035|step-3','three-line-classification']
]);
function immutableContent(lesson){const copy=structuredClone(lesson);delete copy.status;delete copy.review;return copy;}
function visibleLabelKeys(lesson,viewName){
 const model=lesson.visualization.model,view=model.views[viewName];assert(view,lesson.id+' known authored view '+viewName);
 let baseNames=model.labelNames||[...new Set([...(model.edges||[]).flat(),...(model.faces||[]).flat(),...(model.neutralPoints||[])])];
 if(!baseNames.length&&!model.labelNames)baseNames=Object.keys(model.points);
 return [...new Set([...baseNames,...(view.segments||[]).flat(),...(view.polygon||[]),...(view.points||[])])].filter(name=>!name.startsWith('_')||model.labels?.[name]).sort();
}
function hostStatic(){
 const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'};
 return new Promise((resolve,reject)=>{
  server=http.createServer((request,response)=>{try{
   const pathname=decodeURIComponent(new URL(request.url,'http://127.0.0.1').pathname),file=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
   if(file!==root&&!file.startsWith(root+path.sep)){response.writeHead(403).end();return;}
   const stat=fs.statSync(file);if(!stat.isFile()){response.writeHead(404).end();return;}
   response.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});fs.createReadStream(file).pipe(response);
  }catch{response.writeHead(404).end();}});
  server.once('error',reject);server.listen(Number(process.env.TEXTBOOK_PORT||0),'127.0.0.1',()=>resolve('http://127.0.0.1:'+server.address().port+route));
 });
}
function watch(target){target.on('pageerror',error=>evidence.errors.push({case:activeCase,message:error.message}));target.on('response',response=>{const url=new URL(response.url());if(response.status()>=400&&url.origin===new URL(base).origin&&url.pathname!=='/favicon.ico')evidence.errors.push({case:activeCase,status:response.status(),url:response.url()});});}
async function settle(target=page){await target.evaluate(async()=>{if(document.fonts)await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});}
async function textWithFractions(locator){return locator.evaluate(node=>{const copy=node.cloneNode(true);copy.querySelectorAll('.stereo-fraction').forEach(f=>f.replaceWith(f.querySelector('.stereo-numerator').textContent+'/'+f.querySelector('.stereo-denominator').textContent));return copy.textContent;});}
async function camera(target=page,selector='[data-main-model] svg'){return target.locator(selector).evaluate(svg=>({yaw:svg.dataset.yaw,pitch:svg.dataset.pitch}));}
async function readRecord(target,lesson){return target.evaluate(key=>JSON.parse(localStorage.getItem(key)),stateKey(lesson));}
async function isOpen(locator){return locator.evaluate(node=>node.open);}
async function openDetails(locator){if(!await isOpen(locator))await locator.locator(':scope > summary').click();}
async function noOverflow(target=page){assert(await target.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),activeCase+' horizontal document overflow');}
async function checkLabels(id,width,stage,target=page,selector='[data-main-model] svg'){
 await settle(target);const svg=target.locator(selector);await svg.waitFor({state:'visible'});
 const result=await svg.evaluate(node=>{
  const view=node.viewBox.baseVal,m=node.getScreenCTM(),sx=Math.hypot(m.a,m.b),sy=Math.hypot(m.c,m.d),bounds=node.getBoundingClientRect();
  return {view:node.dataset.view,width:view.width,height:view.height,screenWidth:bounds.width,screenHeight:bounds.height,finite:!/(?:NaN|Infinity)/.test(node.outerHTML),labels:[...node.querySelectorAll('.am-label')].map(label=>{const b=label.getBBox(),screen=label.getBoundingClientRect(),font=parseFloat(getComputedStyle(label).fontSize);return {key:label.dataset.label,text:label.textContent,x:b.x,y:b.y,width:b.width,height:b.height,screenX:screen.x,screenY:screen.y,screenWidth:screen.width,screenHeight:screen.height,pixels:font*Math.min(sx,sy)};})};
 });
 const overlaps=[];for(let i=0;i<result.labels.length;i++)for(let j=i+1;j<result.labels.length;j++){const a=result.labels[i],b=result.labels[j];if(Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)>1&&Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)>1)overlaps.push([a.key,b.key]);}
 const expectedLabels=visibleLabelKeys(expectedById.get(id),result.view);
 evidence.labels.push({id,viewport:width,stage,...result,expectedLabels,overlaps});writeEvidence();
 assert(result.finite,id+' finite SVG '+stage);assert(result.width>0&&result.height>0,id+' nonempty viewBox');
 // Some neutral counterexample scenes intentionally name no points (13в). Require
 // exactly the authored visible labels, not an invented label or an early answer.
 assert.deepEqual(result.labels.map(label=>label.key).sort(),expectedLabels,id+' exact authored label visibility '+stage);
 for(const label of result.labels){assert(Number.isFinite(label.pixels)&&label.pixels>=18,id+' label '+label.key+' font >=18px at '+width+' '+stage);assert(label.width>0&&label.height>0,id+' measurable label '+label.key);assert(label.x>=-1&&label.y>=-1&&label.x+label.width<=result.width+1&&label.y+label.height<=result.height+1,id+' label '+label.key+' unclipped at '+width+' '+stage);}
 assert.deepEqual(overlaps,[],id+' overlapping labels at '+width+' '+stage);return result;
}
async function takeScreenshot(lesson,width,stage){
 const name=screenshotCases.get(lesson.id+'|'+stage);if(!name)return;
 const filename=name+'-'+width+'.png';await settle();if(stage==='nested-theory')await page.locator('dialog .textbook-model').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,filename),fullPage:stage!=='nested-theory'});evidence.screenshots.push({id:lesson.id,width,stage,file:filename});writeEvidence();
}
async function preserveCheck(lesson,keptCamera,draft){
 assert(await page.evaluate(()=>window.__textbookKept.svg===document.querySelector('[data-main-model] svg')&&window.__textbookKept.field===document.querySelector('#final-answer')),lesson.id+' original model/answer nodes retained');
 assert.deepEqual(await camera(),keptCamera,lesson.id+' camera retained');if(lesson.answer)assert.equal(await page.locator('#final-answer').inputValue(),draft,lesson.id+' final draft retained');
}
async function expandLabel(selector){
 const button=page.locator(selector+' .am-expand');await button.scrollIntoViewIfNeeded();await settle();
 const label=await button.evaluate(node=>{const b=node.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(node);const text=range.getBoundingClientRect(),font=parseFloat(getComputedStyle(node).fontSize);return {text:node.textContent,font,button:{x:b.x,y:b.y,width:b.width,height:b.height},label:{x:text.x,y:text.y,width:text.width,height:text.height},clientWidth:node.clientWidth,scrollWidth:node.scrollWidth};});
 assert.equal(label.text,'Развернуть рисунок');assert(label.font>=18,'expand label has readable actual font');assert(label.scrollWidth<=label.clientWidth+1,'expand label is not clipped');
 assert(label.label.x>=label.button.x-1&&label.label.x+label.label.width<=label.button.x+label.button.width+1&&label.label.y>=label.button.y-1&&label.label.y+label.label.height<=label.button.y+label.button.height+1,'entire expand label lies inside its button');return label;
}
async function fullscreen(lesson,width,selector,scope){
 const label=await expandLabel(selector),button=page.locator(selector+' .am-expand');
 const saved=await page.locator(selector).evaluate(node=>{const svg=node.querySelector('svg'),dialog=node.closest('dialog');window.__textbookExpandedSvg=svg;return {view:svg.dataset.view,yaw:svg.dataset.yaw,pitch:svg.dataset.pitch,overflow:document.body.style.overflow,x:scrollX,y:scrollY,dialogTop:dialog?.scrollTop??null};});
 for(const closeBy of ['button','Escape']){
  await button.click();await settle();const shell=page.locator(selector+' .am-expanded');await shell.waitFor({state:'visible'});
  const bounds=await shell.evaluate(node=>{const b=node.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height,position:getComputedStyle(node).position,viewportWidth:innerWidth,viewportHeight:innerHeight,overflow:document.body.style.overflow};});
  assert.equal(bounds.position,'fixed',scope+' model is fixed to viewport');assert(Math.abs(bounds.x)<=1&&Math.abs(bounds.y)<=1&&Math.abs(bounds.width-bounds.viewportWidth)<=1&&Math.abs(bounds.height-bounds.viewportHeight)<=1,scope+' expansion covers actual viewport');assert.equal(bounds.overflow,'hidden');
  assert.equal(await button.innerText(),'Закрыть рисунок');await checkLabels(lesson.id,width,scope+'-expanded-'+closeBy,page,selector+' svg');
  if(closeBy==='button'){const file=scope+'-expanded-'+width+'.png';await page.screenshot({path:path.join(out,file),fullPage:false});evidence.expansionScreenshots.push({id:lesson.id,width,scope,file});writeEvidence();}
  // Closing via both paths must preserve the exact instance and selected model.
  if(closeBy==='Escape'){await button.focus();await page.keyboard.press('Escape');}else await button.click();await settle();assert.equal(await page.locator(selector+' .am-expanded').count(),0);
  const restored=await page.locator(selector).evaluate(node=>{const svg=node.querySelector('svg'),dialog=node.closest('dialog');return {same:svg===window.__textbookExpandedSvg,view:svg.dataset.view,yaw:svg.dataset.yaw,pitch:svg.dataset.pitch,overflow:document.body.style.overflow,x:scrollX,y:scrollY,dialogTop:dialog?.scrollTop??null};});
  const attempt={id:lesson.id,width,scope,closeBy,label,bounds,saved,after:restored,restored:false};evidence.expansions.push(attempt);writeEvidence();
  assert(restored.same,scope+' expansion retains original SVG');for(const field of ['view','yaw','pitch','overflow'])assert.equal(restored[field],saved[field],scope+' restored '+field);
  assert(Math.abs(restored.x-saved.x)<=1&&Math.abs(restored.y-saved.y)<=1,scope+' document scroll restored');if(scope==='theory'){assert.equal(await page.locator('dialog.theory-dialog').count(),1,'first Escape closes only drawing');assert(Math.abs(restored.dialogTop-saved.dialogTop)<=1,'theory scroll restored');}
  attempt.restored=true;writeEvidence();
 }
}
async function helpTree(lesson,items,width,keptCamera,draft){
 for(const item of items){const details=page.locator('[data-help="'+item.id+'"]');await openDetails(details);await settle();assert.equal(await page.locator('[data-main-model] svg').getAttribute('data-view'),item.view||'neutral',lesson.id+' help view '+item.id);await preserveCheck(lesson,keptCamera,draft);await checkLabels(lesson.id,width,'help:'+item.id);await takeScreenshot(lesson,width,'help:'+item.id);await helpTree(lesson,item.children||[],width,keptCamera,draft);}
}
async function theoryModal(lesson,width,keptCamera,draft){
 const sourceStep=lesson.id==='atanasyan2024-main-001-a'?lesson.steps.find(step=>step.justifications.some(j=>j.theoryId==='atanasyan2024-theory-003-line-point')):lesson.steps.find(step=>step.justifications.some(j=>j.theoryId&&expectedById.has(j.theoryId)));
 if(!sourceStep)return false;
 const theoryId=lesson.id==='atanasyan2024-main-001-a'?'atanasyan2024-theory-003-line-point':sourceStep.justifications.find(j=>j.theoryId&&expectedById.has(j.theoryId)).theoryId;
 const step=page.locator('[data-step="'+sourceStep.id+'"]'),explanation=step.locator(':scope > details');await openDetails(explanation);await openDetails(explanation.locator(':scope > details'));
 const trigger=explanation.getByRole('button',{name:'Почему? '+expectedById.get(theoryId).title,exact:true}).first();await trigger.click();const modal=page.locator('dialog.theory-dialog');await modal.waitFor({state:'visible'});
 assert.equal(await modal.getAttribute('data-theory'),theoryId);await checkLabels(theoryId,width,'theory-modal',page,'dialog .textbook-model svg');await preserveCheck(lesson,keptCamera,draft);
 // A Shift+Tab wrap must land on the last visible control, not a descendant of a
 // closed details disclosure. Ask native focus itself: Chromium can retain layout
// boxes for descendants of closed details, so getClientRects is not visibility.
 assert(await modal.evaluate(node=>node.scrollWidth<=node.clientWidth+1),'theory dialog has no horizontal overflow');
 const visible=await modal.locator('button,input,textarea,summary,a[href],[tabindex="0"]').evaluateAll(nodes=>nodes.filter(node=>{if(node.disabled||node.getAttribute('tabindex')==='-1')return false;node.focus({preventScroll:true});return document.activeElement===node;}).map((node,index)=>{node.dataset.browserFocusId='focus-'+index;return node.dataset.browserFocusId;}));
 await modal.locator(':scope > button').focus();await page.keyboard.press('Shift+Tab');assert.equal(await page.evaluate(()=>document.activeElement.dataset.browserFocusId),visible.at(-1),'modal trap uses visible controls');await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.dataset.browserFocusId),visible[0],'forward Tab returns to the first actually focusable control');
 // Figure8 -> point3 -> A1 supplies a genuinely nested theory explanation.
 if(lesson.id==='atanasyan2024-main-001-a'){
  const theory=expectedById.get(theoryId),nestedStep=theory.steps.findIndex(s=>s.justifications.some(j=>j.theoryId&&j.theoryId!==theoryId&&expectedById.has(j.theoryId)));assert(nestedStep>=0,'representative theory has a nested reference');
  const nestedId=theory.steps[nestedStep].justifications.find(j=>j.theoryId&&j.theoryId!==theoryId&&expectedById.has(j.theoryId)).theoryId;
  const theorySteps=modal.locator(':scope > div:last-child > details'),otherStep=(await theorySteps.count())-1;
  if(otherStep!==nestedStep){await openDetails(theorySteps.nth(otherStep));await settle();}
  const details=theorySteps.nth(nestedStep);await openDetails(details);await openDetails(details.locator(':scope > details'));await settle();
  const rotate=modal.locator('button[aria-label="Повернуть влево"]');if(await rotate.count())await rotate.click();const oldCamera=await camera(page,'dialog .textbook-model svg'),oldView=await modal.locator('.textbook-model svg').getAttribute('data-view'),opened=await modal.locator('details').evaluateAll(nodes=>nodes.map((node,index)=>node.open?index:-1).filter(index=>index>=0));
  await details.getByRole('button',{name:'Почему? '+expectedById.get(nestedId).title,exact:true}).first().click();assert.equal(await modal.getAttribute('data-theory'),nestedId);await checkLabels(nestedId,width,'nested-theory',page,'dialog .textbook-model svg');await takeScreenshot(lesson,width,'nested-theory');
  await modal.locator(':scope > button').click();await settle();assert.equal(await modal.getAttribute('data-theory'),theoryId);assert.deepEqual(await camera(page,'dialog .textbook-model svg'),oldCamera,'nested theory camera restored');assert.equal(await modal.locator('.textbook-model svg').getAttribute('data-view'),oldView,'selected view survives reverse-order disclosure restoration');assert.deepEqual(await modal.locator('details').evaluateAll(nodes=>nodes.map((node,index)=>node.open?index:-1).filter(index=>index>=0)),opened,'nested theory disclosures restored');
 }
 if(lesson.id==='atanasyan2024-main-001-a'){await fullscreen(expectedById.get(theoryId),width,'dialog .textbook-model','theory');await preserveCheck(lesson,keptCamera,draft);}
 await page.keyboard.press('Escape');await modal.waitFor({state:'detached'});assert(await trigger.evaluate(node=>node===document.activeElement),'focus returns to theory trigger');await preserveCheck(lesson,keptCamera,draft);return true;
}
async function card(lesson,width){
 // Different query strings force a full document load: the runtime deliberately
 // uses its own open() navigation and does not handle arbitrary hash changes.
 activeCase=lesson.id+' '+width;await page.goto(base+'?browser-card='+lesson.id+'-'+width+'#'+lesson.id);await page.waitForFunction(id=>window.textbookApp&&document.querySelector('[data-main-model] svg')&&location.hash==='#'+id,lesson.id);
 await page.evaluate(id=>{const el=document.querySelector('[data-main-model] svg');window.__textbookKept={svg:el,field:document.querySelector('#final-answer')};},lesson.id);
 assert.equal(await textWithFractions(page.locator('.textbook-condition')),lesson.statement.text);assert.equal(await textWithFractions(page.locator('.textbook-goal')),lesson.statement.goal);assert.equal(await page.locator('[data-main-model] svg').getAttribute('data-view'),'neutral');assert.equal(await isOpen(page.locator('[data-main-help]')),false,'new card has closed help');assert.equal(await page.locator('[data-steps] [data-step]').count(),0,'no revealed solution step on first screen');
 const draft='Черновик '+lesson.id+' '+width;
 if(lesson.answer){assert(await page.locator('#final-answer').isVisible(),lesson.id+' visible final answer before help');assert.equal(await textWithFractions(page.locator('label[for="final-answer"]')),lesson.answer.prompt);assert.equal(await page.locator('#final-answer').inputValue(),'');await page.locator('#final-answer').fill(draft);}else assert.equal(await page.locator('#final-answer').count(),0,'theory has no unexplained input');
 // Freeze authored neutral labels: no constructed D/Q/X or other step-only point
 // may appear before help merely because it exists in model.points.
 assert.deepEqual((await page.locator('[data-main-model] .am-label').evaluateAll(nodes=>nodes.map(node=>node.dataset.label))).sort(),visibleLabelKeys(lesson,'neutral'),lesson.id+' neutral labels exactly follow givens');
 await noOverflow();await checkLabels(lesson.id,width,'condition');await takeScreenshot(lesson,width,'condition');
 await expandLabel('[data-main-model]');
 const rotate=page.locator('[data-main-model] button[aria-label="Повернуть влево"]');if(await rotate.count())await rotate.click();const keptCamera=await camera();
 if(lesson.id==='atanasyan2024-main-001-a'){await fullscreen(lesson,width,'[data-main-model]','main');await preserveCheck(lesson,keptCamera,draft);}
 await openDetails(page.locator('[data-main-help]'));await helpTree(lesson,lesson.help,width,keptCamera,draft);
 for(const authoredStep of lesson.steps){
  await page.locator('[data-steps]+button').click();const step=page.locator('[data-step="'+authoredStep.id+'"]');await step.waitFor({state:'visible'});assert.equal(await textWithFractions(step.locator(':scope > p')),authoredStep.prompt);
  const explanation=step.locator(':scope > details');await openDetails(explanation);assert.equal(await textWithFractions(explanation.locator(':scope > p')),authoredStep.explanation);await openDetails(explanation.locator(':scope > details'));
  assert.equal(await explanation.locator(':scope > details > p').count(),authoredStep.justifications.length);
  for(let j=0;j<authoredStep.justifications.length;j++)assert.equal(await textWithFractions(explanation.locator(':scope > details > p').nth(j)),authoredStep.justifications[j].text);
  if(authoredStep.input){const field=step.locator('input');assert.equal(await textWithFractions(step.locator('label')),authoredStep.input.prompt);await field.fill('промежуточный '+authoredStep.id);await step.locator('form button').click();}
  await step.getByRole('button',{name:'Показать на рисунке',exact:true}).click();await settle();assert.equal(await page.locator('[data-main-model] svg').getAttribute('data-view'),authoredStep.view||'neutral');await preserveCheck(lesson,keptCamera,draft);await checkLabels(lesson.id,width,authoredStep.id);await noOverflow();await takeScreenshot(lesson,width,authoredStep.id);
 }
 const modalChecked=await theoryModal(lesson,width,keptCamera,draft);await preserveCheck(lesson,keptCamera,draft);
 if(lesson.answer){await page.locator('[data-final-form] button[type="submit"]').click();if(lesson.answer.mode==='manual'){assert.match(await page.locator('[data-final-feedback]').innerText(),/обсудить с учителем/);assert.doesNotMatch(await page.locator('[data-final-feedback]').innerText(),/верно|самостоятельно/);}}
 const saved=await readRecord(page,lesson);assert(saved?.assisted,lesson.id+' help recorded');assert.equal(saved.revealed,lesson.steps.length);if(lesson.answer)assert.equal(saved.draft,draft);
 await page.reload();await page.locator('[data-main-model] svg').waitFor({state:'visible'});await settle();assert.deepEqual(await camera(),keptCamera,lesson.id+' camera after reload');assert.equal(await page.locator('[data-steps] [data-step]').count(),lesson.steps.length);if(lesson.answer)assert.equal(await page.locator('#final-answer').inputValue(),draft);
 for(const step of lesson.steps.filter(s=>s.input))assert.equal(await page.locator('[data-step="'+step.id+'"] input').inputValue(),'промежуточный '+step.id);
 evidence.cards.push({id:lesson.id,width,steps:lesson.steps.length,modalChecked,reload:true,source:lesson.source});writeEvidence();
}
async function twoTabs(useStorageEvent){
 const lesson=expectedLessons.find(l=>l.kind==='exercise'&&l.answer?.mode==='manual'),key=stateKey(lesson),first=await context.newPage(),second=await context.newPage();watch(first);watch(second);activeCase='two tabs '+(useStorageEvent?'storage event':'read-before-write');
 try{
  await first.goto(base);await first.waitForFunction(()=>window.textbookApp);await first.evaluate(key=>localStorage.removeItem(key),key);await first.goto(base+'#'+lesson.id);await first.reload();await first.locator('#final-answer').fill('Старый ответ из первой вкладки');
  if(!useStorageEvent)await first.evaluate(()=>window.addEventListener('storage',event=>event.stopImmediatePropagation(),true));
  await second.goto(base+'#'+lesson.id);await second.locator('#final-answer').waitFor();await second.locator('#final-answer').fill('Новая работа из второй вкладки');await openDetails(second.locator('[data-main-help]'));await settle(second);
  const latest=await second.evaluate(key=>localStorage.getItem(key),key);
  // The native handler must be safe even if a stale form is submitted before the
  // storage event is observed, or if a disabled old form is programmatically sent.
  await first.locator('[data-final-form]').evaluate(form=>form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
  await first.locator('.course-conflict').waitFor({state:'visible'});assert.equal(await second.evaluate(key=>localStorage.getItem(key),key),latest,'stale submit leaves current bytes intact');assert(await first.locator('#final-answer').evaluate(node=>node.readOnly));assert(await first.locator('[data-final-form] button').isDisabled());assert.match(await first.locator('.course-conflict textarea').inputValue(),/Старый ответ из первой вкладки/);
  await first.locator('.course-conflict button').click();assert.equal(await first.locator('#final-answer').inputValue(),'Новая работа из второй вкладки');assert.match(await first.locator('.course-conflict textarea').inputValue(),/Старый ответ из первой вкладки/);assert((await readRecord(first,lesson)).assisted,'new help state survives recovery');
  evidence.twoTabs.push({storageEvent:useStorageEvent,unchangedBytes:true,oldDraftRecoverable:true,newDraftRestored:true});writeEvidence();
 }finally{await first.close();await second.close();}
}
async function main(){
 fs.mkdirSync(out,{recursive:true});
 if(process.env.TEXTBOOK_CHECK_ONLY==='1'){
  for(const lesson of expectedLessons){assert(lesson.id&&lesson.visualization?.model&&lesson.steps?.length,'authored structure');for(const step of lesson.steps)assert(step.id&&step.justifications?.length,'authored step justification');for(const view of Object.keys(lesson.visualization.model.views))visibleLabelKeys(lesson,view);}
  for(const key of screenshotCases.keys()){const [id,stage]=key.split('|'),lesson=expectedById.get(id);assert(lesson,'known screenshot lesson '+key);if(stage.startsWith('step-'))assert(lesson.steps.some(step=>step.id===stage),'known screenshot step '+key);if(stage.startsWith('help:')){const found=(items)=>items.some(item=>item.id===stage.slice(5)||found(item.children||[]));assert(found(lesson.help),'known screenshot help '+key);}}
  console.log('TEXTBOOK_BROWSER_PREFLIGHT_OK: '+expectedCount+' authored cards; no browser launched, no review flags changed');return;
 }
 base=process.env.TEXTBOOK_BASE_URL||await hostStatic();assert(base.endsWith('/'),'TEXTBOOK_BASE_URL must end in /');
 const {chromium}=require('playwright');browser=await chromium.launch({headless:true,executablePath:process.env.TEXTBOOK_CHROMIUM||undefined,args:['--no-sandbox']});
 context=await browser.newContext({viewport:{width:1280,height:1000},reducedMotion:'reduce'});page=await context.newPage();watch(page);page.setDefaultTimeout(15000);
 await page.goto(base);await page.waitForFunction(()=>window.textbookApp);
 const published=await page.evaluate(async()=>{const response=await fetch('data/course.json');if(!response.ok)throw Error('Missing published data');return response.json();});
 const publishedById=new Map(published.lessons.map(lesson=>[lesson.id,lesson]));
 assert.equal(published.lessons.filter(lesson=>expectedById.has(lesson.id)&&lesson.status==='reviewed').length,expectedCount,'reviewed authored count matches the exact expected batch');
 for(const expected of expectedLessons){const actual=publishedById.get(expected.id);assert(actual,expected.id+' is present in integrated data');assert.equal(actual.status,'reviewed',expected.id+' must pass independent review before browser publication gate');for(const field of ['source','mathematics','pedagogy'])assert.equal(actual.review?.[field],'passed',expected.id+' '+field+' review');assert.deepEqual(immutableContent(actual),immutableContent(expected),expected.id+' matches the authored batch except review metadata');}
 const runtimeCoverage=await page.evaluate(()=>({coverage:window.textbookApp.coverage,issues:window.textbookApp.issues}));assert(runtimeCoverage.coverage.available>=expectedCount,'every reviewed authored card is available');assert.deepEqual(runtimeCoverage.issues.filter(issue=>expectedById.has(issue.id)),[]);evidence.runtimeCoverage=runtimeCoverage.coverage;
 for(const width of evidence.widths){await page.setViewportSize({width,height:1000});await page.goto(base);await page.evaluate(()=>localStorage.clear());for(const lesson of expectedLessons)await card(lesson,width);}
 await twoTabs(true);await twoTabs(false);assert.equal(evidence.expansionScreenshots.length,4,'main/theory expanded screenshots at both widths');assert.equal(evidence.expansions.length,8,'main/theory fullscreen and both close paths at 320/1280');assert.equal(evidence.cards.length,expectedCount*2);assert.equal(evidence.screenshots.length,32,'exact representative screenshot set');assert.deepEqual(evidence.errors,[]);writeEvidence();
 console.log('ATANASYAN_TEXTBOOK_BROWSER_OK: '+expectedCount+' cards at 320/1280, authored steps/reasons, visible figures, nested theory, reload, 2 real-tab conflict scenarios, 32 screenshots');
}
main().catch(async error=>{fs.mkdirSync(out,{recursive:true});evidence.failure={case:activeCase,message:error.message,stack:error.stack};writeEvidence();if(page)await page.screenshot({path:path.join(out,'failure.png'),fullPage:true}).catch(()=>{});console.error(error);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));});

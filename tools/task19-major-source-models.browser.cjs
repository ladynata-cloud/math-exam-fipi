'use strict';
// CI-only real Chromium acceptance for the 135-card source expansion. Local
// authoring may syntax-check this file; do not spoof CI to launch it locally.
if(process.env.CI!=='true'||process.env.GITHUB_ACTIONS!=='true')throw new Error('Run this gate in the Task 19 GitHub Actions major suite; local browser execution is not authorized.');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const {pathToFileURL,fileURLToPath}=require('node:url');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),{cards}=require('../trainers/task19-visual-data.js');
const manifest=require('../trainers/task19-major-source-coverage.json'),KEY='mathExam.task19.visualHints.v1';
const historicalModels=new Set(manifest.baseline.modelNames);
const artifacts=path.resolve(process.env.TASK19_MAJOR_BROWSER_ARTIFACTS||path.join(root,'artifacts/task19-major-source-models'));
const added=manifest.additions.map(id=>cards.find(card=>card.id===id));
const digest=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const near=(a,b,label)=>assert(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-7,`${label}: ${a} != ${b}`);
const safe=value=>String(value).replace(/[^a-zA-Z0-9_-]+/g,'-');
const family=card=>JSON.stringify([card.hint.model,...['kind','mode','focus','constraint','shape','transformation'].map(k=>card.hint.params?.[k]??null)]);
const representatives=new Map();
for(const card of added)if(card&&!representatives.has(family(card)))representatives.set(family(card),card.id);
const representativeIds=new Set(representatives.values());
// These fixed-number/degenerate configurations deserve explicit images even
// when they share a model and kind with another representative.
const narrowIds=new Set([
  'circles_r1_r6_d4_intersect','circles_r3_r2_d4_disjoint','circles_r2_r5_d1_intersect','circles_r2_r5_d6_intersect',
  'line_distance3_radius5_tangent','line_distance10_radius7_disjoint','point_distance5_radius4_inside',
  'inscribed40_arc80','inscribed40_arc40','inscribed_equals_central_same_chord','arc100_inscribed50','arc60_inscribed30',
  'vertical_40_140','adjacent_53_123','adjacent_81_99','adjacent_50_120',
  'same_side_sum90_parallel','same_side50_110_parallel','same_side30_120_parallel',
  'corresponding_angles67_parallel','corresponding_angles90_parallel','alternate_interior_right_angles_imply_parallel',
  'two_lines_at_most_one_common_point','two_distinct_points_multiple_lines','three_lines_at_least_one_common_point',
  'circle_exactly_two_symmetry_axes','rhombus_opposite80_100','convex_quad_three_sum220_fourth130',
  'trapezoid_equal_diagonals_isosceles','all_rhombi_cyclic','tangential_quadrilateral_opposite_side_sums_equal',
  'triangle_5_12_13_circumcenter_on_side','triangle_20_21_29_circumcenter_on_side','triangle_4_5_9_exists','triangle_6_8_2_not_exist',
  'tangent_secant_power','intersecting_chords_products_equal'
]);
const plans=[
  {entry:'main',viewport:'desktop',width:1280,height:920,touch:false},
  {entry:'main',viewport:'mobile',width:390,height:844,touch:true},
  {entry:'main',viewport:'narrow',width:320,height:800,touch:true},
  {entry:'alternate',viewport:'mobile',width:390,height:844,touch:true},
  {entry:'offline',viewport:'mobile',width:390,height:844,touch:true}
];
const coverage={schema:1,taskId:'OGE19_MAJOR_SOURCE_EXPANSION_20261116',startedAt:new Date().toISOString(),status:'running',
  runner:{ciOnly:true,commit:process.env.GITHUB_SHA||null,runId:process.env.GITHUB_RUN_ID||null,node:process.version},
  bank:{expected:379,baseline:244,additions:135,canonicalSha256:digest(cards),sourceManifestAdditionsSha256:digest(manifest.additions)},
  plans,expectedJourneys:675,
  screenshotPolicy:'Every new card at main390 has initial unmeasured and measured images at the initial geometry. Other entry/viewports use model/kind/mode/focus/constraint/shape/transformation representatives plus explicitly listed narrow cases. Every failed journey gets a failure image.',
  boundaryPolicy:'Real Home/End key presses use pre-action bounds. Displayed values must stay within current bounds and one step of the requested old bound; model/display disagreement is limited to one current step. New unpaired controls with unchanged bounds must reach the exact last valid step. Full Cartesian mathematical coverage belongs to the separate Node gates.',
  families:[...representatives].map(([key,id])=>({key,representative:id,cardIds:added.filter(c=>c&&family(c)===key).map(c=>c.id)})),
  narrowCardIds:[...narrowIds],journeys:[],browserErrors:[],failures:[],entryEvidence:[]};
for(const plan of plans)for(const card of added)coverage.journeys.push({entry:plan.entry,viewport:plan.viewport,width:plan.width,height:plan.height,cardId:card?.id||null,model:card?.hint.model||null,family:card?family(card):null,status:'pending',stage:'pending',checks:[],controls:[],layout:[],screenshots:{}});

function writeCoverage(){
  coverage.updatedAt=new Date().toISOString();
  coverage.counts=coverage.journeys.reduce((counts,row)=>(counts[row.status]=(counts[row.status]||0)+1,counts),{});
  fs.writeFileSync(path.join(artifacts,'coverage.json'),JSON.stringify(coverage,null,2)+'\n');
}
async function startServer(){
  const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.pdf':'application/pdf'};
  const server=http.createServer((req,res)=>{
    let file;try{const u=new URL(req.url,'http://localhost');if(u.pathname==='/favicon.ico'){res.writeHead(204).end();return;}file=path.resolve(root,'.'+decodeURIComponent(u.pathname));}catch(_){res.writeHead(400).end();return;}
    if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
    fs.readFile(file,(error,body)=>{if(error){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(body);});
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  return{server,base:'http://127.0.0.1:'+server.address().port};
}
const saved=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
const measure=page=>page.locator('#visualHost .t19-measure');
const readout=page=>page.locator('#visualHost .t19-model-readout');
async function ready(page,id){
  await page.waitForFunction(({id,key})=>window.Task19Data?.cards.length===379&&window.Task19Visuals&&JSON.parse(localStorage.getItem(key)||'null')?.current?.id===id,{id,key:KEY});
}
async function actualSample(page,card){
  return page.evaluate(({id,key})=>{
    const state=JSON.parse(localStorage.getItem(key)),card=window.Task19Data.cards.find(c=>c.id===id);
    const restored=window.Task19Visuals.restoreModel(card.hint,state.current.modelState);
    return window.Task19Visuals.sample(card.hint.model,restored.params);
  },{id:card.id,key:KEY});
}
async function unanswered(page,before,row){
  const current=await saved(page);
  assert.equal(current.current.id,row.cardId);assert.equal(current.current.answer,null,row.cardId+': no implicit answer');
  assert.deepEqual(current.records,before.records,row.cardId+': experiments preserve all records');
  assert.equal(await page.locator('#answerPanel').isVisible(),false,row.cardId+': no early verdict');
  assert.equal(await page.locator('#answerExplanation').textContent(),'',row.cardId+': explanation withheld');
  assert.equal(await page.locator('#progressText').textContent(),before.progress,row.cardId+': progress unchanged');
}
async function fit(page,row,state){
  const evidence=await page.evaluate(()=>{
    const width=document.documentElement.clientWidth,selectors=['main','.exercise','#statement','#hintPanel','#visualHost','#visualHost svg','#visualHost input','#visualHost button','.t19-model-readout'];
    const boxes=selectors.flatMap(selector=>[...document.querySelectorAll(selector)].filter(el=>el.getClientRects().length).map(el=>{const r=el.getBoundingClientRect();return{selector,left:r.left,right:r.right};}));
    const svg=document.querySelector('#visualHost svg'),labels=[];
    let viewBox=null;
    if(svg){
      const v=svg.viewBox.baseVal,ctm=svg.getCTM();viewBox={x:v.x,y:v.y,width:v.width,height:v.height};
      if(!ctm)throw new Error('Visible SVG has no coordinate transformation');
      const inverse=ctm.inverse();
      for(const node of svg.querySelectorAll('text')){
        if(!node.textContent.trim())continue;
        const b=node.getBBox(),matrix=inverse.multiply(node.getCTM());
        const corners=[[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]].map(([x,y])=>new DOMPoint(x,y).matrixTransform(matrix));
        const bounds={left:Math.min(...corners.map(p=>p.x)),right:Math.max(...corners.map(p=>p.x)),top:Math.min(...corners.map(p=>p.y)),bottom:Math.max(...corners.map(p=>p.y))};
        labels.push({text:node.textContent,bounds,outside:bounds.left<v.x-.5||bounds.right>v.x+v.width+.5||bounds.top<v.y-.5||bounds.bottom>v.y+v.height+.5});
      }
    }
    return{width,scrollWidth:document.documentElement.scrollWidth,overflow:boxes.filter(b=>b.left< -1||b.right>width+1),viewBox,labels};
  });
  row.layout.push({state,...evidence});
  assert.deepEqual(evidence.overflow,[],`${row.cardId} ${state}: viewport fit`);
  assert(evidence.scrollWidth<=evidence.width+1,`${row.cardId} ${state}: no horizontal page scroll`);
  assert.deepEqual(evidence.labels.filter(l=>l.outside),[],`${row.cardId} ${state}: SVG label bounding boxes`);
}
function shouldCapture(plan,card){return plan.entry==='main'&&plan.viewport==='mobile'||representativeIds.has(card.id)||narrowIds.has(card.id);}
async function screenshot(page,row,stage){
  const relative=path.join('screenshots',row.entry,row.viewport,`${safe(row.cardId)}-${stage}.png`),file=path.join(artifacts,relative);
  fs.mkdirSync(path.dirname(file),{recursive:true});
  await page.screenshot({path:file,fullPage:true,animations:'disabled'});row.screenshots[stage]=relative.split(path.sep).join('/');
}
function finiteGeometry(value){
  if(typeof value==='number')assert(Number.isFinite(value),'finite geometry');
  else if(value&&typeof value==='object')Object.values(value).forEach(finiteGeometry);
}
function immutablePremises(card,initial,current){
  for(const [key,value]of Object.entries(card.hint.params||{}))if(typeof value==='string'||typeof value==='boolean'||Array.isArray(value))assert.deepEqual(current.values[key],initial.values[key],card.id+': immutable '+key);
  finiteGeometry(current.points);finiteGeometry(current.metrics);
}

async function journey(page,entryUrl,plan,card,row,expectedRecords){
  row.status='running';row.stage='navigate';row.startedAt=new Date().toISOString();
  await page.goto(entryUrl+'?card='+encodeURIComponent(card.id),{waitUntil:'domcontentloaded'});await ready(page,card.id);
  const before=await saved(page);before.progress=await page.locator('#progressText').textContent();
  assert.deepEqual(before.records,expectedRecords,'navigation preserves previous cards');
  assert.equal(await page.locator('#statement').textContent(),card.text,'actual entry source wording');
  assert.equal(await page.locator('#hintPanel').isVisible(),false);assert.equal(await page.locator('#hintToggle').getAttribute('aria-expanded'),'false');
  assert.equal(await page.locator('#btnTrue').isEnabled(),true);assert.equal(await page.locator('#btnFalse').isEnabled(),true);
  await unanswered(page,before,row);await fit(page,row,'question');
  row.recordsBeforeSha256=digest(before.records);row.checks.push('379-bank-ready','exact-source-wording','closed-hint','no-initial-answer','records-preserved-on-navigation');

  row.stage='initial-hint';await page.locator('#hintToggle').focus();await page.keyboard.press('Enter');
  await page.locator('#visualHost svg').waitFor({state:'visible'});
  assert.equal(await page.locator('#hintToggle').getAttribute('aria-expanded'),'true');assert.equal(await readout(page).isVisible(),false);
  assert.equal(await page.locator('.t19-observe').isVisible(),false);assert.equal(await measure(page).getAttribute('aria-expanded'),'false');
  const initial=await actualSample(page,card);finiteGeometry(initial.points);finiteGeometry(initial.metrics);
  row.initial={values:initial.values,metrics:initial.metrics,pointsSha256:digest(initial.points)};
  await unanswered(page,before,row);await fit(page,row,'initial-unmeasured');
  if(shouldCapture(plan,card))await screenshot(page,row,'initial');
  row.checks.push('keyboard-hint','measurements-hidden-until-requested','finite-initial-geometry');

  row.stage='initial-measured';
  const touchRepresentative=plan.entry==='main'&&plan.viewport==='mobile'&&representativeIds.has(card.id);
  if(touchRepresentative)await measure(page).tap();else{await measure(page).focus();await page.keyboard.press('Enter');}
  assert.equal(await readout(page).isVisible(),true);assert.equal(await measure(page).getAttribute('aria-expanded'),'true');
  assert.match(await readout(page).textContent(),/\d/,'numeric observations');
  await unanswered(page,before,row);await fit(page,row,'initial-measured');
  if(shouldCapture(plan,card))await screenshot(page,row,'measured');
  row.checks.push('explicit-measurement','initial-measurement-without-grading');
  await measure(page).focus();await page.keyboard.press('Enter');assert.equal(await readout(page).isVisible(),false);

  row.stage='keyboard-boundaries';const sliders=page.locator('#visualHost input[type=range]');
  assert(await sliders.count()>0,card.id+': an editable experiment is required');let geometryChanged=false;
  for(let i=0;i<await sliders.count();i++){
    const slider=sliders.nth(i),key=await slider.getAttribute('data-key'),id=await slider.getAttribute('id');
    assert.equal(await slider.isVisible(),true);assert.equal(await slider.isEnabled(),true);
    assert((await page.locator(`label[for="${id}"]`).textContent()).trim().length>0,'labelled control');
    const control={key,initial:Number(await slider.inputValue()),actions:[]};row.controls.push(control);
    for(const command of ['Home','End']){
      row.stage=`keyboard-${key}-${command}`;await slider.focus();
      const boundsOf=el=>({min:Number(el.min),max:Number(el.max),step:Number(el.step),value:Number(el.value),paired:!!el.closest('.t19-model-control')?.dataset.pair});
      const beforeKey=await slider.evaluate(boundsOf);
      assert(Number.isFinite(beforeKey.step)&&beforeKey.step>0,'finite positive range step');
      await page.keyboard.press(command);
      const bounds=await slider.evaluate(boundsOf),epsilon=1e-7;
      assert(Number.isFinite(bounds.value)&&Number.isFinite(bounds.min)&&Number.isFinite(bounds.max)&&Number.isFinite(bounds.step)&&bounds.step>0,'finite range after keyboard action');
      const requestedBound=command==='Home'?beforeKey.min:beforeKey.max;
      // Chrome snaps End to a step from the old min. A coupled model may then
      // publish different bounds and sanitize the displayed range again.
      assert(Math.abs(bounds.value-requestedBound)<=beforeKey.step+epsilon,card.id+' reaches requested pre-action bound within one step: '+key);
      assert(bounds.value>=bounds.min-epsilon&&bounds.value<=bounds.max+epsilon,card.id+' keyboard value stays inside current bounds: '+key);
      const stableBounds=['min','max','step'].every(field=>Math.abs(beforeKey[field]-bounds[field])<=epsilon);
      const expectedStepValue=command==='Home'?beforeKey.min:beforeKey.min+Math.floor((beforeKey.max-beforeKey.min)/beforeKey.step+1e-9)*beforeKey.step;
      const exactStepExpected=!historicalModels.has(card.hint.model)&&!beforeKey.paired&&!bounds.paired&&stableBounds;
      if(exactStepExpected)near(bounds.value,expectedStepValue,card.id+' exact valid keyboard step '+key);
      const current=await actualSample(page,card);immutablePremises(card,initial,current);
      const modelValue=current.values[key];
      assert(typeof modelValue==='number'&&Number.isFinite(modelValue)&&Math.abs(modelValue-bounds.value)<=bounds.step+epsilon,card.id+' model and displayed range agree within one step: '+key);
      const moved=digest(current.points)!==digest(initial.points);geometryChanged=geometryChanged||moved;
      control.actions.push({key:command,preActionBounds:beforeKey,...bounds,requestedBound,expectedStepValue,exactStepExpected,modelValue,pointsSha256:digest(current.points),changedFromInitial:moved});
      assert.equal(await readout(page).isVisible(),false,'movement does not request measurements');
      await unanswered(page,before,row);await fit(page,row,`${key}-${command}`);
    }
  }
  assert(geometryChanged,card.id+': keyboard changes real coordinates');row.checks.push('real-keyboard-Home-End-all-controls','step-aware-keyboard-boundaries','model-display-range-agreement','immutable-premises','no-early-grade-at-boundaries','boundary-getBBox','boundary-viewport-fit');

  if(touchRepresentative){
    row.stage='touch-slider';const slider=sliders.first();await slider.scrollIntoViewIfNeeded();
    const old=Number(await slider.inputValue()),box=await slider.boundingBox();assert(box&&box.width>24);
    await slider.tap({position:{x:Math.max(8,box.width*.27),y:box.height/2}});
    assert.notEqual(Number(await slider.inputValue()),old,'touch changes range value');
    immutablePremises(card,initial,await actualSample(page,card));await unanswered(page,before,row);await fit(page,row,'touch');
    row.touch={measure:true,range:true,key:await slider.getAttribute('data-key')};row.checks.push('mobile-touch-measure','mobile-touch-control');
  }

  row.stage='measured-draft';await measure(page).focus();await page.keyboard.press('Enter');
  assert.equal(await readout(page).isVisible(),true);await unanswered(page,before,row);await fit(page,row,'boundary-measured');
  const draft=await saved(page),draftSample=await actualSample(page,card),draftReadout=await readout(page).textContent();
  row.stage='draft-reload';await page.reload({waitUntil:'domcontentloaded'});await ready(page,card.id);await page.locator('#visualHost svg').waitFor({state:'visible'});
  const restored=await saved(page);assert.deepEqual(restored.current.modelState,draft.current.modelState,'editable parameters and measured flag survive reload');
  assert.equal(restored.current.hintOpen,true);assert.equal(await readout(page).isVisible(),true);assert.equal(await readout(page).textContent(),draftReadout);
  const restoredSample=await actualSample(page,card);assert.deepEqual(restoredSample.points,draftSample.points,'actual geometry survives reload');immutablePremises(card,initial,restoredSample);
  await unanswered(page,before,row);await fit(page,row,'restored-draft');
  row.draft={restored:true,modelState:restored.current.modelState,pointsSha256:digest(restoredSample.points)};row.checks.push('measured-draft-reload','geometry-restored','records-preserved-on-draft-reload');

  row.stage='correct-answer';const answerButton=page.locator(card.truth?'#btnTrue':'#btnFalse');await answerButton.focus();await page.keyboard.press('Enter');
  assert.equal(await page.locator('#answerPanel').isVisible(),true);assert.equal(await page.locator('#answerPanel').getAttribute('data-correct'),'true');
  assert((await page.locator('#answerExplanation').textContent()).includes(card.explanation),'own explanation shown after answer');
  const answered=await saved(page),previous=before.records[card.id]||{attempts:0,correct:0,needsReview:false};
  const expected={...before.records,[card.id]:{attempts:previous.attempts+1,correct:previous.correct+1,needsReview:false}};
  assert.deepEqual(answered.records,expected,'one attempt and one correct answer; no unrelated record changes');assert.equal(answered.current.answer,card.truth);
  assert.equal(await page.locator('#btnTrue').isDisabled(),true);assert.equal(await page.locator('#btnFalse').isDisabled(),true);
  await page.locator('#statement').focus();for(const key of ['j','n','j','n'])await page.keyboard.press(key);
  assert.deepEqual((await saved(page)).records,expected,'repeat answer keys do not grade again');
  row.stage='answered-reload';await page.reload({waitUntil:'domcontentloaded'});await ready(page,card.id);
  assert.equal(await page.locator('#answerPanel').isVisible(),true);assert.deepEqual((await saved(page)).records,expected,'answer reload does not grade again');
  assert.equal(await page.locator('#btnTrue').isDisabled(),true);assert.equal(await page.locator('#btnFalse').isDisabled(),true);
  row.answer={value:card.truth,record:expected[card.id],exactlyOnce:true,unrelatedRecordsPreserved:true};row.recordsAfterSha256=digest(expected);
  row.checks.push('correct-answer-by-keyboard','exactly-one-attempt','repeat-hotkeys-ignored','answered-reload-exactly-once');
  row.status='passed';row.stage='complete';row.finishedAt=new Date().toISOString();return expected;
}

async function main(){
  fs.mkdirSync(artifacts,{recursive:true});writeCoverage();
  assert.equal(cards.length,379);assert.equal(manifest.additions.length,135);assert.equal(new Set(manifest.additions).size,135);assert(added.every(Boolean));
  assert.deepEqual(cards.slice(244).map(c=>c.id),manifest.additions,'the entire appended bank is the approved addition list');
  for(const id of narrowIds)assert(manifest.additions.includes(id),'narrow-case coverage ID '+id);
  const {server,base}=await startServer();let browser;
  try{
    browser=await chromium.launch({headless:true});coverage.runner.chromium=browser.version();
    for(const plan of plans){
      const context=await browser.newContext({viewport:{width:plan.width,height:plan.height},hasTouch:plan.touch,isMobile:plan.touch,serviceWorkers:'block'});
      context.setDefaultTimeout(6000);context.setDefaultNavigationTimeout(15000);
      const offlineFile=path.join(root,'downloads/trainers/task19-trainer/task19-trainer.html');
      const entryUrl=plan.entry==='offline'?pathToFileURL(offlineFile).href:base+'/trainers/'+(plan.entry==='alternate'?'geometry_statements_trainer_improved.html':'task19-trainer.html');
      const entryEvidence={entry:plan.entry,viewport:plan.viewport,bankVerified:false,blockedNetwork:[],unexpectedLocalDependencies:[],historicalRecordSeeded:false};coverage.entryEvidence.push(entryEvidence);
      let active=null;
      if(plan.entry==='offline'){
        await context.setOffline(true);
        await context.route(/^https?:\/\//,route=>{entryEvidence.blockedNetwork.push({url:route.request().url(),cardId:active?.cardId||null});return route.abort();});
        context.on('request',request=>{
          const url=request.url();
          if(/^https?:\/\//.test(url)&&!entryEvidence.blockedNetwork.some(r=>r.url===url&&r.cardId===(active?.cardId||null)))entryEvidence.blockedNetwork.push({url,cardId:active?.cardId||null});
          if(url.startsWith('file:')){const file=fileURLToPath(new URL(url));if(path.resolve(file)!==path.resolve(offlineFile))entryEvidence.unexpectedLocalDependencies.push({file:path.basename(file),cardId:active?.cardId||null});}
        });
      }
      const page=await context.newPage();
      page.on('pageerror',error=>coverage.browserErrors.push({entry:plan.entry,viewport:plan.viewport,cardId:active?.cardId||null,stage:active?.stage||'bootstrap',type:'pageerror',message:error.message}));
      page.on('console',message=>{if(message.type()==='error')coverage.browserErrors.push({entry:plan.entry,viewport:plan.viewport,cardId:active?.cardId||null,stage:active?.stage||'bootstrap',type:'console',message:message.text()});});
      page.on('websocket',socket=>{if(plan.entry==='offline')entryEvidence.blockedNetwork.push({url:socket.url(),cardId:active?.cardId||null,kind:'websocket'});});
      const rows=coverage.journeys.filter(row=>row.entry===plan.entry&&row.viewport===plan.viewport);
      try{
        // An actual historical answer, entered through the UI, makes progress
        // preservation meaningful without injecting learner-state fixtures.
        await page.goto(entryUrl+'?card=prev-056',{waitUntil:'domcontentloaded'});await ready(page,'prev-056');
        const liveBank=await page.evaluate(()=>window.Task19Data.cards);assert.deepEqual(liveBank,cards,'actual entry contains exactly the canonical 379-card bank');entryEvidence.bankVerified=true;entryEvidence.bankSha256=digest(liveBank);
        await page.locator('#btnFalse').focus();await page.keyboard.press('Enter');let expectedRecords=(await saved(page)).records;
        assert.deepEqual(expectedRecords['prev-056'],{attempts:1,correct:1,needsReview:false});entryEvidence.historicalRecordSeeded=true;
        let consecutiveFailures=0;
        for(let i=0;i<added.length;i++){
          const card=added[i],row=rows[i];active=row;
          try{expectedRecords=await journey(page,entryUrl,plan,card,row,expectedRecords);consecutiveFailures=0;}
          catch(error){
            row.status='failed';row.error={message:error.message,stack:error.stack};row.finishedAt=new Date().toISOString();coverage.failures.push({entry:plan.entry,viewport:plan.viewport,cardId:card.id,stage:row.stage,message:error.message});
            try{await screenshot(page,row,'FAIL-'+safe(row.stage));}catch(captureError){row.failureScreenshotError=captureError.message;}
            try{expectedRecords=(await saved(page)).records;}catch(_){/* The next navigation will report any remaining storage failure. */}
            console.error(`FAIL major ${plan.entry}/${plan.viewport} ${card.id}: ${error.message}`);consecutiveFailures++;
          }
          if((i+1)%20===0||row.status==='failed')writeCoverage();
          if(consecutiveFailures>=8){for(const pending of rows.slice(i+1)){pending.status='blocked';pending.error={message:'Stopped this entry after eight consecutive failed journeys; no coverage pass is claimed.'};}break;}
        }
        if(plan.entry==='offline'){
          assert.deepEqual(entryEvidence.blockedNetwork,[],'offline entry attempts no network requests');
          assert.deepEqual(entryEvidence.unexpectedLocalDependencies,[],'single HTML has no external local-file dependencies');
          entryEvidence.networkBlocked=true;entryEvidence.selfContained=true;
        }
        assert.deepEqual(coverage.browserErrors.filter(error=>error.entry===plan.entry&&error.viewport===plan.viewport),[],'entry has no script or resource errors');
      }catch(error){
        coverage.failures.push({entry:plan.entry,viewport:plan.viewport,stage:active?.stage||'bootstrap',message:error.message});
        for(const row of rows.filter(r=>r.status==='pending'||r.status==='running')){row.status='blocked';row.error={message:error.message};}
        const failure=active||{entry:plan.entry,viewport:plan.viewport,cardId:'bootstrap',screenshots:{}};
        try{await screenshot(page,failure,'FAIL-entry');entryEvidence.failureScreenshot=failure.screenshots['FAIL-entry'];}catch(captureError){entryEvidence.failureScreenshotError=captureError.message;}
      }finally{await context.close();writeCoverage();}
    }
    assert.deepEqual(coverage.browserErrors,[],'no browser script or resource errors');assert.deepEqual(coverage.failures,[],'all major-source journeys pass');
    assert.equal(coverage.journeys.filter(row=>row.status==='passed').length,675,'all five complete 135-card journeys executed');
    for(const plan of plans){const rows=coverage.journeys.filter(r=>r.entry===plan.entry&&r.viewport===plan.viewport);assert.equal(rows.length,135);assert(rows.every(r=>r.status==='passed'));}
    for(const card of added){const row=coverage.journeys.find(r=>r.entry==='main'&&r.viewport==='mobile'&&r.cardId===card.id);assert(row.screenshots.initial&&row.screenshots.measured,'every main390 card has initial/measured evidence');}
    coverage.status='passed';console.log('TASK19_MAJOR_SOURCE_MODELS_BROWSER_OK '+JSON.stringify({journeys:675,bank:379,additions:135,families:representatives.size}));
  }finally{
    if(coverage.status!=='passed')coverage.status='failed';coverage.finishedAt=new Date().toISOString();writeCoverage();
    if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(error=>{
  coverage.status='failed';coverage.finishedAt=new Date().toISOString();
  for(const row of coverage.journeys.filter(r=>r.status==='pending'||r.status==='running')){row.status='blocked';row.error={message:'Suite did not complete: '+error.message};}
  coverage.fatalError={message:error.message,stack:error.stack};
  try{writeCoverage();}catch(writeError){console.error('Unable to save coverage: '+writeError.message);}
  console.error(error.stack||error);process.exitCode=1;
});

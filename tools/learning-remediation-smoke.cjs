'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const C=require('../board-server/learning-remediation-contracts');
const divisionCourse=require('../trainers/oge-basics/multiplication-division/division-course-core');
const columns=require('../trainers/oge-basics/multiplication-division/multiplication-column-core');
const guidedDivision=require('../trainers/oge-basics/multiplication-division/division-guided-core');
const trainerItems=C.list();
assert.equal(columns.stages.length,9,'The complete column multiplication route has nine stages');
assert.deepEqual(trainerItems.filter(item=>columns.has(item.contentId)).map(item=>item.contentId).sort(),columns.stages.map(stage=>stage.id).sort(),'Every column stage participates in managed and standalone browser checks');
// Keep the existing topics on their original seed; the added cases cover
// three partial rows, addition with 2 in mind, zeros and four upper digits.
const columnSeeds={'three-by-one':2,'four-by-one':1,'three-by-two':2,'two-by-three':134,'three-by-three':5,zeros:3,mixed:103};
const serverContracts=require('../board-server/learning-contracts');
const root=path.resolve(__dirname,'..');
const harness=`<!doctype html><meta charset="utf-8"><title>Semantic remediation test</title><style>body{margin:0}iframe{width:49vw;height:95vh;border:0}</style><script>
window.framesById={};window.events=[];
window.addEventListener('message',e=>{let m=e.data;if(m?.protocol!=='mathexam-learning')return;const f=Object.values(framesById).find(x=>x.frame.contentWindow===e.source&&x.channel===m.channel);if(!f)return;f.instance=m.instance;if(m.type==='ready')f.ready=true;if(m.type==='applied')f.applied=m.payload;if(m.type==='change'){f.state=m.payload.state;events.push(m.payload);}});
window.openTrainer=(id,url)=>{let frame=document.createElement('iframe');frame.sandbox='allow-scripts';let channel=id+'ABCDEFGHIJKLMNOPQRSTUV';frame.src=url+'?learning=1&parentOrigin='+encodeURIComponent(location.origin)+'&channel='+channel;framesById[id]={frame,channel};document.body.append(frame);};
window.hydrate=(id,taskSpec,state,readOnly)=>{const f=framesById[id];f.applied=null;f.frame.contentWindow.postMessage({protocol:'mathexam-learning',version:1,channel:f.channel,instance:f.instance,type:'hydrate',payload:{taskSpec,state,readOnly}},'*');};
</script>`;
const server=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname;if(pathname==='/harness'){res.setHeader('Content-Type','text/html');return res.end(harness);}const file=path.resolve(root,'.'+pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end();}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(data);});});
// Use the same visible disclosures as a pupil; never force-click hidden help.
async function revealManagedControl(frame, id) {
  const target = frame.locator('#' + id);
  if (await target.isVisible()) return target;
  const disclosure = id === 'lm-note' ? '#lm-notes' :
    ['lm-learn', 'lm-practice', 'lm-rule'].includes(id) ? '#lm-tools' : null;
  if (disclosure) {
    const details = frame.locator(disclosure);
    if (await details.count() && await details.getAttribute('open') === null)
      await details.locator('summary').first().click();
  } else {
    const toggle = frame.locator('#lm-help-slot .bh-toggle');
    if (await toggle.count() && await toggle.getAttribute('aria-expanded') !== 'true') await toggle.click();
    if (!await target.isVisible() && await frame.locator('#lm-help-slot .bh-root:visible').count())
      await frame.locator('#lm-help-slot .bh-root:visible').click();
  }
  await target.waitFor({ state: 'visible' });
  return target;
}
function expected(q){return q.answer&&typeof q.answer==='object'?q.answer.n+'/'+q.answer.d:String(q.answer);}
async function columnSnapshot(frame){return frame.locator('.lm-multiplication-board').evaluate(board=>({html:board.outerHTML,rows:Object.fromEntries([...board.querySelectorAll('.lm-mul-row:not(.lm-mul-carry)')].map(row=>[row.dataset.mulRow,[...row.querySelectorAll('.lm-mul-filled')].map(cell=>({column:Number(cell.dataset.column),digit:cell.textContent}))]))}));}
function checkColumnRows(snapshot,task,{complete=true}={}){
 const {a,b}=task,value=cells=>cells.reduce((sum,cell)=>sum+BigInt(cell.digit)*10n**BigInt(cell.column),0n);
 if(complete){assert.equal(snapshot.rows.RES.map(cell=>cell.digit).join(''),String(a*b));assert.equal(value(snapshot.rows.RES),BigInt(a)*BigInt(b));}
 else assert.equal(snapshot.rows.RES.length,0,'The answer row stays empty before addition');
 if(b<10)return;
 for(let pass=0;pass<String(b).length;pass++){
  const cells=snapshot.rows['P'+(pass+1)],digit=Math.floor(b/10**pass)%10;
  assert(cells&&cells.length>=String(a).length,'Every partial row preserves each upper digit, including zero');
  assert.equal(value(cells),BigInt(a)*BigInt(digit)*10n**BigInt(pass),'Partial row '+(pass+1)+' retains its place value');
  assert(cells.every(cell=>cell.column>=pass),'Partial row '+(pass+1)+' starts '+pass+' cells left');
  if(!digit)assert(cells.every(cell=>cell.digit==='0'),'Multiplication by zero writes an explicit zero row');
 }
}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const context=await browser.newContext({viewport:{width:1440,height:950}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 let completed=0,actions=0;
 for(const item of process.argv.includes('--visual-only')?[]:trainerItems){
  await page.goto(origin+'/harness');const isColumn=columns.has(item.contentId),columnSeed=columnSeeds[item.contentId.replace('multiplication-division/course-column-','')];const {taskSpec,state}=serverContracts.create('oge-basics',item.contentId,isColumn&&columnSeed!==undefined?columnSeed:12345);
  for(const id of ['student','teacher'])await page.evaluate(({id,url})=>openTrainer(id,url),{id,url:item.url});
  await page.waitForFunction(()=>framesById.student?.ready&&framesById.teacher?.ready);
  await page.evaluate(({taskSpec,state})=>{hydrate('student',taskSpec,state,false);hydrate('teacher',taskSpec,state,true);},{taskSpec,state});
  await page.waitForFunction(()=>framesById.student.applied&&framesById.teacher.applied);
  assert.equal(await page.evaluate(()=>framesById.student.applied.error),undefined,item.id);
  let frame=page.frames().find(f=>f.url().includes('channel=student'));const teacher=page.frames().find(f=>f.url().includes('channel=teacher'));
  assert.equal(await frame.locator('#learning-remediation-root h1').textContent(),item.title); // UI uses the readable catalog title; saved metadata remains canonical.
  assert.equal(await teacher.locator('#lm-note').getAttribute('readonly'),'');
  assert.equal(await frame.evaluate(()=>{try{localStorage.setItem('unexpected-write','1');return 'accessible';}catch{return 'isolated';}}),'isolated');
  const initialColumn=isColumn?await columnSnapshot(frame):null;
  if(initialColumn)for(const [row,cells]of Object.entries(initialColumn.rows))if(!['A','B'].includes(row))assert.equal(cells.length,0,'No future result cell is filled at the start');
  const first=taskSpec.steps[0]||taskSpec.items[0]||taskSpec.task;
  if(first.kind==='choice')await frame.locator('[data-choice]').evaluateAll((nodes,answer)=>nodes.find(x=>x.dataset.choice!==answer).click(),String(first.answer));else await frame.locator('#lm-answer').fill('99999999');
  await (await revealManagedControl(frame,'lm-note')).fill('Мой черновик: '+item.contentId);
  await frame.locator('#lm-check').click();await (await revealManagedControl(frame,'lm-hint')).click();
  await page.waitForFunction(()=>events.at(-1)?.kind==='hint');
  const saved=await page.evaluate(()=>framesById.student.state);C.normalize(taskSpec,saved);
  await page.evaluate(({taskSpec,saved})=>hydrate('teacher',taskSpec,saved,true),{taskSpec,saved});
  await page.waitForFunction(()=>framesById.teacher.applied);
  assert.equal(await teacher.locator('#lm-note').inputValue(),saved.note);
  assert.equal(await teacher.locator('.lm-feedback.hint').count(),1);
  if(isColumn){assert.equal((await columnSnapshot(frame)).html,initialColumn.html,'Wrong answers and help do not fill future cells');assert.equal((await columnSnapshot(teacher)).html,initialColumn.html,'Read-only mirror keeps the same unfinished column');assert.equal(await teacher.locator('#lm-answer').isDisabled(),true);}
  if(taskSpec.lessons.length){await (await revealManagedControl(frame,'lm-learn')).click();assert.equal(await frame.locator('.lm-lesson').count(),1);await (await revealManagedControl(frame,'lm-practice')).click();}
  // Restore into a fresh instance, including raw draft, hint and selected view.
  await page.evaluate(({taskSpec,saved})=>hydrate('student',taskSpec,saved,false),{taskSpec,saved});
  await page.waitForFunction(()=>framesById.student.applied);
  let current=saved;
  while(!current.completed){const q=taskSpec.steps[current.step]||taskSpec.items[current.step]||taskSpec.task,answer=expected(q);
   if(q.kind==='choice')await frame.locator('[data-choice]').filter({hasText:''}).evaluateAll((nodes,answer)=>nodes.find(x=>x.dataset.choice===answer).click(),answer);
   else await frame.locator('#lm-answer').fill(answer);
   const n=await page.evaluate(()=>events.length);await frame.locator('#lm-check').click();
   try{await page.waitForFunction(n=>events.length>n&&events.at(-1).kind==='check',n,{timeout:5000});}catch(error){console.error(item.contentId,current.step,JSON.stringify(await page.evaluate(()=>({events:events.slice(-3),applied:framesById.student.applied}))),errors,await frame.locator('#learning-remediation-root').innerText());throw error;}
   const event=await page.evaluate(()=>events.at(-1));const verified=C.evaluate(taskSpec,event.details);assert(verified.correct,item.id+' step '+current.step);current=C.normalize(taskSpec,event.state);actions++;
   const secondGroup=taskSpec.divisionTasks[1];
   const restoreAt=isColumn?taskSpec.steps.findIndex(q=>taskSpec.task.multiplication.b>=100?q.multiplication.row==='P3'&&q.multiplication.event==='write':q.multiplication.event==='add-carry'):taskSpec.items.length?5:secondGroup?Math.min(secondGroup.startIndex+2,secondGroup.endIndex-1):-1;
   if(current.step===restoreAt){
    const beforeWrong=isColumn?await columnSnapshot(frame):null;
    if(isColumn&&taskSpec.task.multiplication.b>=100)assert.equal(beforeWrong.rows.P3.length,0,'The third row is present but empty before its first digit is written');
    await frame.locator('#lm-answer').fill('99999999');await frame.locator('#lm-check').click();await page.waitForFunction(()=>events.at(-1)?.kind==='check'&&events.at(-1).details.answer==='99999999');
    const wrong=await page.evaluate(()=>events.at(-1));
    const guided=isColumn||divisionCourse.has(item.contentId)&&divisionCourse.stageFor(item.contentId).guidance!=='check';
    assert.deepEqual(C.evaluate(taskSpec,wrong.details),{correct:false,complete:false,...(guided?{assisted:true}:{})});current=C.normalize(taskSpec,wrong.state);assert.equal(current.step,restoreAt);
    await page.evaluate(({taskSpec,current})=>hydrate('teacher',taskSpec,current,true),{taskSpec,current});await page.waitForFunction(()=>framesById.teacher.applied);
    assert.equal(await teacher.locator('#lm-answer').inputValue(),'99999999');assert.equal(await teacher.locator('.lm-feedback.incorrect').count(),1);
    if(isColumn){assert.equal((await columnSnapshot(frame)).html,beforeWrong.html,'A wrong draft cannot write the next cell');assert.equal((await columnSnapshot(teacher)).html,beforeWrong.html,'The read-only mirror preserves previous rows and the current empty cell');assert.equal(await teacher.locator('#lm-check').isDisabled(),true);}
    await page.evaluate(url=>{framesById.student.frame.remove();delete framesById.student;openTrainer('student',url);},item.url);await page.waitForFunction(()=>framesById.student?.ready);
    await page.evaluate(({taskSpec,current})=>hydrate('student',taskSpec,current,false),{taskSpec,current});await page.waitForFunction(()=>framesById.student.applied);
    frame=page.frames().find(f=>f.url().includes('channel=student'));assert.equal(await frame.locator('#lm-answer').inputValue(),'99999999');assert.equal(await frame.locator('.lm-feedback.incorrect').count(),1);if(isColumn)assert.equal((await columnSnapshot(frame)).html,beforeWrong.html,'Reload restores the exact written rows and future blank cells');else assert.match(await frame.locator('.lm-card .lm-label').first().textContent(),taskSpec.items.length?/6 из 12/:new RegExp('Пример 2 из '+taskSpec.divisionTasks.length));
   }
  }
  if(isColumn)checkColumnRows(await columnSnapshot(frame),taskSpec.task.multiplication);
  const exampleCount=taskSpec.divisionTasks.length||taskSpec.items.length||1;
  assert.equal(await frame.locator('#lm-new').textContent(),(taskSpec.family==='division'||taskSpec.family==='multiplication'||require('../learning/division-course-map.js').trackFor(taskSpec.contentId))?(exampleCount>1?'Ещё '+exampleCount+' примера →':'Следующий пример →'):'Новое условие →');
  await frame.locator('#lm-new').click();await page.waitForFunction(()=>events.at(-1).kind==='new-task');
  assert.equal((await page.evaluate(()=>events.at(-1))).details.contentId,item.contentId);
  completed++;
  console.log('Managed '+completed+'/'+trainerItems.length+' '+item.contentId);
 }
 // Standalone mode still initializes all original family interfaces and storage.
 for(const item of process.argv.includes('--visual-only')?[]:trainerItems){
  await page.goto(origin+item.url);await page.locator('main:visible,section:visible').first().waitFor();
  const localCourse=divisionCourse.has(item.contentId)||columns.has(item.contentId);
  assert.equal(await page.evaluate(()=>window.MathExamRemediationManaged),localCourse);
  if(localCourse)assert.equal(await page.evaluate(()=>window.MathExamDivisionCourseLocal),true);
  // The guided division page starts directly at the first action. Its
  // managed iframe contract above is unchanged; only standalone navigation differs.
  if(item.contentId==='multiplication-division/long-division-from-simple-to-decimals'){
   const key='mathExamBasics.guidedDivision.v1';
   assert.equal(await page.locator('#guided-division').isVisible(),true);
   assert.equal(await page.locator('#learning-remediation-root').count(),0);
   assert.equal(await page.locator('#problem').textContent(),'48 : 2');
   assert.equal(await page.locator('#answer').isVisible(),true);
   const before=await page.evaluate(()=>window.__divisionGuidedDebug.state());
   const plan=guidedDivision.plan(before.sessions.start.task),first=plan.actions[0],next=plan.actions[1];
   assert.equal(before.active,'start');assert.equal(before.sessions.start.step,0);
   assert.equal(first.kind,'start');assert.equal(first.answer,'4');
   assert.equal(next.kind,'count');assert.equal(next.answer,'2');
   await page.locator('#answer').fill(first.answer);await page.locator('#primary').click();
   assert.equal(await page.locator('#primary').textContent(),'Проверить');
   assert.equal(await page.locator('#answer').getAttribute('readonly'),null);
   assert.equal(await page.locator('#answer').isDisabled(),false);
   assert.equal(await page.locator('#answer').inputValue(),'');
   assert.equal(await page.locator('#prompt').textContent(),next.prompt);
   const advanced=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
   assert(advanced,'Standalone guided work is stored in this browser');
   assert.equal(advanced.sessions.start.step,1,'One check opens the next real mathematical action');
   assert.equal(advanced.sessions.start.accepted,false);
   assert.equal(advanced.sessions.start.done,false);
   assert.equal(advanced.sessions.start.draft,'');
   assert.deepEqual(advanced.sessions.start.answers,[first.answer],'The accepted answer is recorded once');
   await page.reload();await page.locator('#answer').waitFor();
   assert.equal(await page.evaluate(()=>window.MathExamRemediationManaged),false);
   assert.deepEqual(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key),advanced);
   assert.equal(await page.locator('#primary').textContent(),'Проверить');
   assert.equal(await page.locator('#answer').getAttribute('readonly'),null);
   assert.equal(await page.locator('#answer').inputValue(),'');
   assert.equal(await page.locator('#prompt').textContent(),next.prompt);
   await page.locator('#answer').fill('2');
   const help=page.locator('.bh-toggle');await help.waitFor({state:'visible'});await help.click();
   assert.equal(await help.getAttribute('aria-expanded'),'true');
   assert.equal(await page.locator('#hint-text').textContent(),next.hint);
   const drafted=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
   assert.equal(drafted.sessions.start.step,1,'Draft and help do not submit the next answer');
   assert.equal(drafted.sessions.start.draft,'2');
   assert.equal(drafted.sessions.start.hints,advanced.sessions.start.hints+1);
   assert.deepEqual(drafted.sessions.start.answers,[first.answer]);
   await page.reload();await page.locator('#answer').waitFor();
   assert.deepEqual(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key),drafted);
   assert.equal(await page.locator('#answer').inputValue(),'2');
   assert.equal(await page.locator('#answer').getAttribute('readonly'),null);
   assert.equal(await page.locator('#answer').isDisabled(),false);
   assert.equal(await page.locator('#prompt').textContent(),next.prompt);
   assert.equal(await page.locator('#hint-text').textContent(),next.hint);
   assert.equal(await page.locator('#primary').textContent(),'Проверить');
   continue;
  }
  if(localCourse){assert.equal(await page.locator('#learning-remediation-root').isVisible(),true);assert.equal(await page.locator('#lm-check').isVisible(),true);continue;}
  if(!await page.locator('#view-practice').isVisible() && !await page.locator('#answer').isVisible()){
   const menu=page.locator('details.bs-navigation');
   if(await menu.count() && await menu.getAttribute('open')===null)await menu.locator('summary').first().click();
   await page.locator('[data-route="practice"]:visible,[data-nav="practice"]:visible,#practice:visible').first().click();
  }
  if(item.contentId.endsWith('/division-lab'))assert.equal(await page.locator('#answer').isVisible(),true);
  else if(item.contentId.startsWith('percentages/'))assert.equal(await page.locator('#p-q').isVisible(),true);
  else assert.equal(await page.locator('#view-practice').isVisible(),true);
 }
 const layouts=['multiplication-division/multiplication-pythagoras-table','multiplication-division/long-division-zero-in-quotient','multiplication-division/long-division-quotient-digit','multiplication-division/course-column-one-digit','multiplication-division/course-column-two-digit'].map(id=>({id,seed:12345}));
 layouts.push({id:'multiplication-division/course-column-mixed',seed:103,addition:true},{id:'multiplication-division/course-column-zeros',seed:3,addition:true},{id:'multiplication-division/course-column-zeros',seed:5,addition:true});
 for(const width of [320,390,1280])for(const {id,seed,addition}of layouts){
  await page.setViewportSize({width,height:900});await page.goto(origin+'/harness');await page.addStyleTag({content:'iframe{width:100vw}'});
  const {taskSpec,state}=serverContracts.create('oge-basics',id,seed);if(taskSpec.lessons.length&&(id.includes('pythagoras')||id.endsWith('quotient-digit'))){state.view='learn';state.lessonIndex=id.endsWith('quotient-digit')?2:0;}else {const step=addition?taskSpec.steps.findIndex(q=>q.multiplication.phase==='add'):6;assert(step>=0);state.answers=taskSpec.steps.slice(0,step).map(q=>String(q.answer));state.step=state.answers.length;}
  if(id.endsWith('course-column-mixed'))assert(String(taskSpec.task.multiplication.a).length===4&&String(taskSpec.task.multiplication.b).length===3,'The widest layout fixture is four digits times three digits');
  await page.evaluate(url=>openTrainer('student',url),'/trainers/oge-basics/'+id+'.html');await page.waitForFunction(()=>framesById.student?.ready);
  await page.evaluate(({taskSpec,state})=>hydrate('student',taskSpec,state,false),{taskSpec,state});await page.waitForFunction(()=>framesById.student.applied);
  const frame=page.frames().find(f=>f.url().includes('channel=student'));assert.equal(await frame.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Mobile overflow '+id+' at '+width);
  assert(await frame.locator('#lm-check').evaluate(el=>parseFloat(getComputedStyle(el).fontSize)>=20),'Readable answer control '+id);
  if(id.includes('course-column'))assert.equal(await frame.locator('.lm-multiplication-board').isVisible(),true,'Actual column remains visible');
  if(addition){checkColumnRows(await columnSnapshot(frame),taskSpec.task.multiplication,{complete:false});assert.equal(await frame.locator('.lm-mul-row:not(.lm-mul-carry)[data-mul-row="P3"]').isVisible(),true,'The third partial row is visible before addition');assert(await frame.locator('.lm-prompt,.lm-card .lm-label').evaluateAll(nodes=>nodes.every(node=>node.scrollWidth<=node.clientWidth+1)),'Instructions wrap inside the narrow column card');assert(await frame.locator('.lm-multiplication-board').evaluate(board=>{const box=board.getBoundingClientRect();return box.left>=-1&&box.right<=innerWidth+1&&getComputedStyle(board).overflowX==='auto';}),'Wide written rows scroll within their own board');}
  if(process.env.LEARNING_REMEDIATION_SHOTS){fs.mkdirSync(process.env.LEARNING_REMEDIATION_SHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.LEARNING_REMEDIATION_SHOTS,width+'-'+id.split('/').at(-1)+(addition?'-seed-'+seed:'')+'.png'),fullPage:true});}
 }
 for(const width of [320,390,1280]){
  await page.setViewportSize({width,height:950});
  await page.goto(origin+'/trainers/oge-basics/multiplication-division/division-course.html');
  await page.locator('[data-arithmetic-track="division"]').waitFor();
  assert.equal(await page.locator('[data-arithmetic-track]').count(),2);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Parallel route overflow '+width);
  const boxes=await page.locator('[data-arithmetic-track]').evaluateAll(nodes=>nodes.map(n=>{const b=n.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width};}));
  if(width===1280)assert(Math.abs(boxes[0].y-boxes[1].y)<2&&boxes[1].x>boxes[0].x,'Desktop routes side by side');
  else assert(boxes[1].y>boxes[0].y,'Narrow routes retain two labeled sections');
  if(process.env.LEARNING_REMEDIATION_SHOTS)await page.screenshot({path:path.join(process.env.LEARNING_REMEDIATION_SHOTS,width+'-parallel-routes.png'),fullPage:true});
 }
 assert.deepEqual(errors,[]);await browser.close();await new Promise(r=>server.close(r));console.log(JSON.stringify({result:'LEARNING_REMEDIATION_BROWSER_OK',managedTrainers:completed,verifiedActions:actions,standaloneTrainers:completed?trainerItems.length:0,columnStages:columns.stages.length,checks:completed?['opaque sandbox','read-only mirror','raw input and hints','restored exact task','all division actions','nine column stages','three shifted partial rows and zeros','future blank cells','new task request','no managed localStorage','320/390/1280 layouts']:['320/390/1280 layouts','four digits times three digits','three shifted partial rows and zeros']}));
})().catch(e=>{console.error(e);server.close();process.exit(1);});

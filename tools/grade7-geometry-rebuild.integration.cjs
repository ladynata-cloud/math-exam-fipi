'use strict';
// Integration invariants; independent mathematical oracles live in the three
// content tests. This gate needs no browser, account, server or network.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(ROOT,file),'utf8'),plain=value=>JSON.parse(JSON.stringify(value));
const legacyFiles=['data','practice','equation-practice','grade7-algebra','grade7-geometry','grade7-geometry-core','grade7-geometry-practice','grade7-foundations','pre7-arithmetic','pre7-applications'];
const addedFiles=['base','foundations','triangles','relations','workbook'].map(name=>'grade7-geometry-rebuild-'+name);
const context=vm.createContext({}),load=name=>vm.runInContext(read('ege-baza/path/'+name+'.js'),context,{filename:name+'.js',timeout:1000});
legacyFiles.forEach(load);
const D=context.PathData,legacy=D.meta.map(meta=>({id:meta.id,tasks:[0,1,23,71].map(seed=>JSON.stringify(D.task(meta.id,seed)))}));
assert.equal(legacy.length,169);
addedFiles.forEach(load);
const families=D.geometryRebuild.families;
assert.equal(families.length,106,'103 workbook families and 3 source photo proofs');
assert.deepEqual([...new Set(families.map(item=>item.section))].sort((a,b)=>a-b),Array.from({length:17},(_,index)=>index+1));
for(const before of legacy)assert.deepEqual([0,1,23,71].map(seed=>JSON.stringify(D.task(before.id,seed))),before.tasks,before.id+' output remains byte-identical');

const catalog=require('../learning/catalog'),contracts=require('../board-server/learning-contracts'),route=require('../learning/route');
const items=catalog.items.filter(item=>item.geometryRebuild);
assert.deepEqual(items.map(item=>item.contentId),plain(families.map(item=>item.id)),'The authored order and catalog order agree');
const divisionCourse=require('../trainers/oge-basics/multiplication-division/division-course-core');
const addedDivisionIds=new Set([...divisionCourse.stages.map(stage=>'oge-basics:'+stage.id),'oge-basics:multiplication-division/quotient-estimate']);
assert.equal(addedDivisionIds.size,18);
assert.equal(catalog.items.filter(item=>addedDivisionIds.has(item.id)).length,18,'Every new division topic is available');
const multiplicationColumn=require('../trainers/oge-basics/multiplication-division/multiplication-column-core');
const addedMultiplicationIds=new Set(multiplicationColumn.stages.map(stage=>'oge-basics:'+stage.id));
assert.equal(addedMultiplicationIds.size,9);
assert.equal(catalog.items.filter(item=>addedMultiplicationIds.has(item.id)).length,9,'All column multiplication topics are available');
const originalTrainers=new Set(['ege-path','oge-basics','motion-grade6']);
assert.equal(catalog.items.filter(item=>originalTrainers.has(item.trainerId)&&!item.geometryRebuild&&!addedDivisionIds.has(item.id)&&!addedMultiplicationIds.has(item.id)).length,217,'Existing identities remain available');
const manualItems=catalog.items.filter(item=>item.trainerId==='atanasyan-7-9');
assert.deepEqual(manualItems.map(item=>item.id),['atanasyan-7-9:atanasyan-7-9-main-92-part-1'],'The fixed manual exercise is separate from the original trainer identities');
assert.equal(catalog.items.length,217+items.length+addedDivisionIds.size+addedMultiplicationIds.size+manualItems.length,'Every catalog entry belongs to an explicitly checked group');
for(const meta of families){
 const item=catalog.get('path:'+meta.id);assert(item);assert(item.grade7&&item.trainingOnly&&item.geometryRebuild);
 assert.equal(item.trainerId,'ege-path');assert.equal(item.contentVersion,1);assert.equal(item.position,null);assert.equal(item.topicId,'plane');
 for(const key of ['title','section','sourcePages','idea','prerequisites'])assert.deepEqual(item[key],plain(meta[key]),meta.id+' '+key);
 const basis=route.prerequisites(item,catalog);assert.deepEqual(basis.map(item=>item.contentId),plain(meta.prerequisites),meta.id+' every prerequisite resolves');
 for(const seed of [0,1,23,71]){
  const generated=D.task(meta.id,seed),created=contracts.create('ege-path',meta.id,seed);
  assert.deepEqual(created.taskSpec.task,plain(generated),'Node/browser and backend VM generate the same '+meta.id);
  assert.deepEqual(contracts.normalize('ege-path',created.taskSpec,created.state),created.state);
  assert.equal(contracts.evaluate('ege-path',created.taskSpec,{scope:'final',answer:D.answerText(generated)}).complete,true);
  const answers=[];for(let step=0;step<generated.steps.length;step++){
   const answer=D.answerText(generated.steps[step]),result=contracts.evaluate('ege-path',created.taskSpec,{scope:'step',step,answers:[...answers],answer});
   assert.equal(result.correct,true,meta.id+' step '+step);assert.equal(result.assisted,true,'Guided reasoning is explicitly assisted');answers.push(answer);
  }
  const invalid=plain(created.state);invalid.work.stage=2;invalid.work.step=1;invalid.work.answers=['999999999'];
  assert.throws(()=>contracts.normalize('ege-path',created.taskSpec,invalid),{code:'LEARNING_STATE_INVALID'});
 }
}
for(let position=1;position<=21;position++)assert(contracts.examPool(position).every(item=>!item.geometryRebuild),'School practice never enters an exam position');

// Inspect the actual explicit loaders, including the files served from Amvera.
for(const file of ['ege-baza/path/index.html','learning/index.html','board-server/index.js','board-server/learning-contracts.js']){
 const source=read(file),positions=addedFiles.map(name=>source.indexOf(name+'.js'));
 assert(positions.every(index=>index>=0),file+' loads every new module');
 assert.deepEqual(positions,[...positions].sort((a,b)=>a-b),file+' loads the helper before its content');
 for(const name of addedFiles)assert.equal(source.split(name+'.js').length-1,1,file+' loads '+name+' exactly once');
}
// Follow the actual interleaved browser load order. The new course must not
// insert itself between old lessons, or leave its own route at the last lesson.
const browserData=vm.createContext({}),dataNames=new Set([...legacyFiles,...addedFiles]);
for(const match of read('ege-baza/path/index.html').matchAll(/<script src="([^"/?]+)\.js(?:\?[^\"]*)?"/g)){
 if(dataNames.has(match[1]))vm.runInContext(read('ege-baza/path/'+match[1]+'.js'),browserData);
}
const nextLessonSource=read('ege-baza/path/app.js').match(/^function nextLesson\(id\)\{[^\n]+/m)?.[0];assert(nextLessonSource);
const nextLesson=vm.runInNewContext('('+nextLessonSource+')',{D:browserData.PathData});
const oldIds=legacy.map(item=>item.id),foundation=plain(browserData.PathData.practice.foundation),newIds=plain(families.map(item=>item.id));
for(const id of oldIds){const position=foundation.indexOf(id),expected=position>=0&&position<foundation.length-1?foundation[position+1]:oldIds[(oldIds.indexOf(id)+1)%oldIds.length];assert.equal(nextLesson(id),expected,id+' preserves the original next lesson');}
const workbook=plain(families.filter(item=>!item.id.includes('photo-proof-')).sort((a,b)=>a.section-b.section).map(item=>item.id));
const photos=['grade7-r-photo-proof-1','grade7-r-photo-proof-3','grade7-r-photo-proof-2'];
for(const list of [workbook,photos])for(const [index,id] of list.entries())assert.equal(nextLesson(id),list[index+1]||null,id+' follows its teaching route and stops at its end');
assert.equal(nextLesson('grade7-g-practice-isosceles-proof'),'grade7-b-mixed-borrow','Existing geometry still continues to its original foundation lesson');
assert.equal(nextLesson('grade7-r-review-17'),null,'The workbook explicitly ends instead of silently restarting');
const boundary=workbook.findIndex(id=>id==='grade7-r-review-1');assert(boundary>=0);assert.equal(nextLesson(workbook[boundary]),workbook[boundary+1]);
const hub=read('grade7/geometry-rebuild/course.js');assert(hub.includes('item.geometryRebuild'));assert(hub.includes('item.section===number'));
assert(!/fetch\(|localStorage|\/attempts|\/assignments/.test(hub),'The public hub never reads or writes learner data');

context.window=context;vm.runInContext(read('ege-baza/path/practice-view.js'),context);
const feedback=context.PathPracticeView.wrongFeedback,fallback='Прежняя подсказка';
const example={choices:[{value:'1',label:'Верный вариант'},{value:'2',label:'Ошибка'}],feedback:{'2':'Общая сторона равна самой себе.'}};
assert.equal(feedback(example,' 2 ',fallback),example.feedback['2']);
for(const item of [{choices:example.choices}, {...example,feedback:['bad']},{...example,feedback:{'2':{html:'unsafe'}}},{...example,feedback:{'2':'x'.repeat(4001)}},{...example,feedback:Object.create({'2':'inherited'})}])assert.equal(feedback(item,'2',fallback),fallback);
assert.equal(feedback(example,'99',fallback),fallback);
const numeric={feedback:{'90':'Прямой угол равен 90°, здесь нужен смежный ему угол.'}};
for(const answer of ['90','90.0','180/2'])assert.equal(feedback(numeric,answer,fallback),numeric.feedback['90']);
for(const answer of ['__proto__','',' ','NaN','Infinity','1/0','constructor'])assert.equal(feedback(numeric,answer,fallback),fallback);
for(const map of [Object.create({'90':'inherited'}),{'90':{html:'unsafe'}},{'90':'x'.repeat(4001)},{'90.0':'Noncanonical key'}])assert.equal(feedback({feedback:map},'90',fallback),fallback);
assert.equal(feedback({...example,feedback:{'2':'<img src=x onerror=unsafe()>'}},'2',fallback),'<img src=x onerror=unsafe()>','The helper returns text; renderers escape it before adding fraction markup');
assert.match(read('ege-baza/path/managed.js'),/box\.innerHTML = M\(text\)/);assert.match(read('ege-baza/path/app.js'),/f\.innerHTML=M\(s\)/);
const escaped=context.PathPracticeView.math('<img src=x onerror=unsafe()> 2/3');
assert(escaped.startsWith('&lt;img src=x onerror=unsafe()&gt; '));assert(!escaped.includes('<img'));assert(escaped.includes('class="math-fraction"'));
for(const source of ['ege-baza/path/app.js','ege-baza/path/managed.js'])assert.match(read(source),/const M=text=>(?:root\.)?PathPracticeView\.math\(text\)/);


// A reshuffle is the same question, on both the standalone and managed paths.
// Exercise the actual private standalone helper without launching a browser.
const taskKeySource=read('ege-baza/path/app.js').match(/^function taskKey\(t\)\{[^\n]+/m)?.[0];assert(taskKeySource);
const taskKey=vm.runInNewContext('('+taskKeySource+')');
const oldIdentity=spec=>crypto.createHash('sha256').update(JSON.stringify({trainerId:spec.trainerId,contentId:spec.contentId,prompt:spec.task.q||spec.task.prompt,choices:spec.task.choices,labels:spec.task.labels,display:spec.task.display,model:spec.task.model,divisionTask:spec.divisionTask})).digest('hex');
const oldPublicKey=task=>!task.display&&!task.choices?task.q:JSON.stringify([task.q,task.display||null,(task.labels||[]).slice().sort(),(task.choices||[]).slice().sort()]);
for(const before of legacy){const spec=contracts.create('ege-path',before.id,23).taskSpec;assert.equal(contracts.questionIdentity(spec),oldIdentity(spec),before.id+' legacy managed identity');assert.equal(taskKey(spec.task),oldPublicKey(spec.task),before.id+' legacy standalone identity');}
let reshuffles=0;
for(const meta of families){
 const spec=contracts.create('ege-path',meta.id,23).taskSpec;if(!spec.task.choices)continue;
 const shuffled=plain(spec);shuffled.task.choices.reverse();shuffled.task.choices.forEach((choice,index)=>choice.value=String(index+1));
 shuffled.seed++;shuffled.task.seed++;shuffled.task.params.variant++;
 assert.equal(contracts.questionIdentity(spec),contracts.questionIdentity(shuffled),meta.id+' reshuffle is not a new managed condition');
 assert.equal(taskKey(spec.task),taskKey(shuffled.task),meta.id+' reshuffle is not a new standalone condition');
 const changed=plain(spec);changed.task.q+=' Другое условие.';assert.notEqual(contracts.questionIdentity(spec),contracts.questionIdentity(changed));assert.notEqual(taskKey(spec.task),taskKey(changed.task));
 const diagramChanged=plain(spec);Object.values(diagramChanged.task.model.diagram.points)[0].x+=1;
 assert.notEqual(contracts.questionIdentity(spec),contracts.questionIdentity(diagramChanged));assert.notEqual(taskKey(spec.task),taskKey(diagramChanged.task));reshuffles++;
}
assert(reshuffles>0);
const rayA=contracts.create('ege-path','grade7-r-ray-same',0).taskSpec,rayB=contracts.create('ege-path','grade7-r-ray-same',8).taskSpec;
assert.equal(rayA.task.q,rayB.task.q);assert.deepEqual(rayA.task.model,rayB.task.model);
assert.notDeepEqual(rayA.task.choices,rayB.task.choices,'A real seed pair rotates only the answer choices');
assert.equal(contracts.questionIdentity(rayA),contracts.questionIdentity(rayB),'A real reshuffle cannot earn a new independent managed result');
assert.equal(taskKey(rayA.task),taskKey(rayB.task),'A real reshuffle cannot earn a new independent standalone result');
console.log(JSON.stringify({result:'GRADE7_GEOMETRY_REBUILD_INTEGRATION_OK',families:families.length,sections:17,legacyCases:legacy.length*4,catalogIdentities:catalog.items.length,reshuffleIdentities:reshuffles,feedback:'plain text, own known choices or canonical finite numbers',protocolVersion:1}));

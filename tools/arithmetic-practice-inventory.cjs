'use strict';
// Reproducible local inventory. No account access, remote fetch, or learner state.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const course=require('../learning/division-course-map.js'),server=require('../board-server/learning-contracts.js'),soviet=require('../soviet-math/course.js'),equations=require('../equations/data.js'),extra=require('../soviet-math/arithmetic-practice.js');
const school={};school.window=school;vm.createContext(school);
const schoolPageURL='https://example.test/school/index.html';
function localScriptFilename(src){
 const page=new URL(schoolPageURL),resource=new URL(src,page);
 assert.equal(resource.origin,page.origin,'School dependencies must be same-origin site resources');
 const pathname=decodeURIComponent(resource.pathname);
 assert(!/[\\\0]/.test(pathname),'Invalid local school dependency path');
 const filename=path.resolve(root,'.'+pathname);
 assert(filename.startsWith(root+path.sep),'School dependencies must stay inside the site');
 assert(fs.existsSync(filename)&&fs.statSync(filename).isFile(),'Every declared school dependency must be a local file: '+src);
 return filename;
}
assert.equal(localScriptFilename('math.js?version20261031#fixture'),path.join(root,'school/math.js'));
assert.equal(localScriptFilename('/school/math.js?version20261031'),path.join(root,'school/math.js'));
for(const src of ['https://other.test/script.js','//other.test/script.js','http://example.test/script.js','https://example.test:8443/script.js'])assert.throws(()=>localScriptFilename(src),/same-origin/);
assert.throws(()=>localScriptFilename('/%2e%2e%2foutside.js'),/inside the site/);
for(const src of ['/assets/%5cscript.js','/assets/%00script.js'])assert.throws(()=>localScriptFilename(src),/Invalid local/);
for(const src of ['/assets/missing-inventory-fixture.js','/assets/'])assert.throws(()=>localScriptFilename(src),/must be a local file/);
// The pure mathematics inventory does not mount either page interface. Their
// declared files still pass the same local-resource checks before exclusion.
const pageInterfaces=new Set(['school/app.js','assets/assistant/widget.js'].map(file=>path.join(root,file)));
for(const m of read('school/index.html').matchAll(/<script[^>]+src="([^"]+)"/g)){
 const filename=localScriptFilename(m[1]);
 if(!pageInterfaces.has(filename))vm.runInContext(fs.readFileSync(filename,'utf8'),school,{filename:path.relative(root,filename)});
}
const seeds=Array.from({length:200},(_,i)=>i);
const textTask=t=>JSON.stringify({prompt:t.task?.prompt||t.task?.q||t.prompt||t.q,items:t.items?.map(q=>q.prompt||q.q),steps:t.steps?.map(q=>q.prompt||q.q)});
function sample(make){const tasks=seeds.map(make),prints=tasks.map(textTask);return {seeds:'0..199',count:seeds.length,uniqueConditions:new Set(prints).size,examples:[...new Set(tasks.map(t=>t.task?.prompt||t.task?.q||t.prompt||t.q))].slice(0,3)};}
function fileFor(url){const u=new URL(url,'https://example.test');return {url:u,filename:u.pathname.replace(/^\//,'')};}
function checkURL(url){const {url:u,filename}=fileFor(url);assert(fs.existsSync(path.join(root,filename)),'Referenced file must be checked out: '+filename);if(u.pathname==='/school/index.html'&&u.hash.startsWith('#lesson/'))assert(school.WorkshopCurriculum.byId[u.hash.slice(8)],'Known school lesson '+url);if(u.pathname==='/soviet-math/index.html'&&u.hash)assert(soviet.topics.some(t=>t.id===u.hash.slice(1)),'Known Soviet topic '+url);if(u.pathname==='/trainers/arifmetika.html'){assert.equal(u.searchParams.get('course'),'preoge');assert(read(filename).includes(' '+u.searchParams.get('level')+':'),'Known arithmetic level '+url);}if(u.pathname==='/trainers/drobi-oge-trainer.html'&&u.hash)assert(read(filename).includes("'"+u.hash.replace('#practice=','')+"':"),'Known exact fraction-generator route '+url);if(u.pathname==='/soviet-math/arithmetic-practice.html')assert(extra.topics.includes(u.searchParams.get('topic')));if(u.pathname==='/trainers/rounding-stepwise.html'){assert.deepEqual([...u.searchParams],[['place','1'],['from','division']],'Rounding preparation must start with tens and a division return route');assert.equal(u.hash,'','Rounding preparation uses exact supported query parameters');}return filename;}
const standalone={
 '/trainers/rounding-stepwise.html':{engine:'claude-rounding',category:'generated-place-practice',control:'Следующий пример',places:[1,2,3,4,5,6,0,-1,-2],evidence:['tools/rounding-stepwise.dom.cjs','tools/rounding-stepwise.browser.cjs','tools/learning-rounding-preparation.dom.cjs'],notes:'Claude stepwise rounding trainer. Nine selectable places from hundredths to millions, plus mixed practice; generated attempts continue without a session cap. The division preparation opens at tens. This separate exercise does not enter either managed route counter.'},
 '/trainers/multiplication-table/elevator-sprint.html':{engine:'table-elevator',category:'generated-table-practice',control:'Старт / продолжение после правильного ответа',notes:'Finite multiplication-table facts; unlimited repetitions. Optional timer remains an explicit supplementary format.'},
 '/trainers/trainers/long-multiplication.html':{engine:'legacy-column',category:'generated-column-practice',control:'Случайный пример',notes:'Random upper 100..9099 and lower 10..909. User can also enter their own operands; advanced supplemental format.'},
 '/trainers/desyatichnye-drobi-level-1.html':{engine:'decimal-level-one',category:'fixed-introduction-then-generated-sets',control:'Пройти ещё раз — новые примеры',notes:'Initial 12 examples are fixed; later sets generate the same 12-slot mix with bounded decimal operands.'},
 '/trainers/drobi-oge-trainer.html':{engine:'fraction-guided-and-bank',category:'generated-practice-and-fixed-bank',control:'Пошагово → Новая задача / Ещё задачу',notes:'Fraction and decimal generators coexist with a finite examination bank. Completed bank rounds now link directly to matching generators.'},
 '/trainers/fractions-part-whole-assignment.html':{engine:'fraction-part-whole',category:'generated-word-problems',control:'Следующая задача',notes:'Default mode is part of a whole; target counter does not end the generator.'},
 '/trainers/oge-task6-fractions.html':{engine:'fraction-exam-bank',category:'fixed-bank-with-generated-continuation',control:'Повторить задания банка; Ещё примеры с обычными/десятичными дробями',notes:'174 authored/exam cards stay unchanged. New links train the arithmetic operations, not fresh copies of every composite exam prototype.',continuations:['/trainers/drobi-oge-trainer.html#practice=fraction-mixed','/trainers/drobi-oge-trainer.html#practice=decimal-mixed']},
 '/trainers/formuly-sokrashchennogo-umnozheniya.html':{engine:'formula-practice-long',category:'generated-formula-practice',control:'Дальше →',notes:'Selected formulas and difficulty remain fixed; new coefficients/forms are generated.'},
 '/trainers/formuly-sokrashchennogo-umnozheniya-trainer.html':{engine:'formula-practice-short',category:'generated-formula-practice',control:'Дальше →',notes:'Shares the formula generator design with the longer page; not a separate mathematical skill for each URL.'}
};
const entries=[];
for(const track of course.tracks)for(const stage of track.stages)entries.push({id:stage.id,title:stage.title,scope:'primary',track:track.id,trainerId:'oge-basics',contentId:stage.id,url:'/trainers/oge-basics/'+stage.id+'.html'});
const preparations=new Set();
for(const track of course.tracks)for(const stage of track.stages){const item=stage.preparation;if(!item||preparations.has(item.id))continue;preparations.add(item.id);entries.push({id:item.id,title:item.title,scope:'preparation',track:track.id,beforeStage:stage.id,url:item.publicUrl});}
for(const track of course.tracks)for(const group of track.supplementGroups||[])for(const item of group.items){entries.push({id:item.id,title:item.title,scope:'supplement',track:track.id,group:group.id,trainerId:item.trainerId,contentId:item.contentId,url:item.publicUrl});for(const alias of item.aliases)entries.push({id:alias.id,title:alias.title,scope:'alias',track:track.id,group:group.id,aliasOf:item.id,url:alias.publicUrl});}
for(const entry of entries){
 const {url:u}=fileFor(entry.url);entry.sourceFile=checkURL(entry.url);entry.explanation='Fixed teaching examples may repeat; practice is classified separately.';
 if(entry.trainerId){
  entry.engine=entry.trainerId==='ege-path'?'ege-path':entry.contentId.includes('/course-column-')?'guided-column':entry.contentId.includes('/course-')?'guided-division-course':'oge-basics-bank';
  entry.practice={category:'seeded-generated-practice',repeatAvailable:true,control:entry.trainerId==='ege-path'?'Другие числа / Новый самостоятельный вариант':'Следующий пример / Новое условие',sample:sample(seed=>server.create(entry.trainerId,entry.contentId,seed).taskSpec),evidence:entry.trainerId==='ege-path'?['ege-baza/path/app.js:fresh,showLesson','board-server/learning-contracts.js']:['trainers/oge-basics/learning-managed.js:lm-new','trainers/oge-basics/learning-contracts.js:create',entry.sourceFile]};
  if(entry.trainerId==='ege-path'&&['fractions','practice-fraction-expression'].includes(entry.contentId)){
   const continuation='https://mathexam.space/school/index.html?course=vilenkin6#lesson/v6f-fraction-order';checkURL(continuation);entry.practice.category='small-seeded-family-with-generated-continuation';entry.practice.continuations=[continuation];entry.practice.notes='The original expression families repeat after 7 or 15 conditions. A visible same-skill continuation is available both publicly and in managed work; old task generation is preserved.';entry.practice.evidence.push('ege-baza/path/app.js:fractionPracticeLink','learning/route.js:mountSupport');
  }
 }else if(u.pathname==='/school/index.html'){
  const id=u.hash.slice(8);entry.engine='school-workshop';entry.practice={category:'seeded-generated-practice',repeatAvailable:true,control:'Тренировка → Следующая задача',sample:sample(seed=>school.WorkshopMath.generate(id,seed)),evidence:['school/app.js:begin,next,practiceSeeds','school/state.js:result'],notes:'Independent checks contain three tasks; practice mode continues. The 3000-event cap no longer freezes practice seeds; existing state schema is unchanged.'};
 }else if(u.pathname==='/soviet-math/index.html'){
  const id=u.hash.slice(1),continuation=extra.continuations[id];assert(continuation,'Finite linked Soviet topics need a matching practice route');checkURL(continuation);
  entry.engine='soviet-authored-examples';entry.practice={category:'authored-cycle-with-generated-continuation',repeatAvailable:true,control:'Другой пример (12-example cycle); Ещё примеры этого навыка → Открыть тренировку',sample:sample(seed=>soviet.make(id,seed)),authoredPool:12,continuations:[continuation],evidence:['soviet-math/course.js:make','soviet-math/app.js:another,showExtraPractice','soviet-math/arithmetic-practice.js:continuations'],notes:'Authored examples, revisions, and saved history are preserved. The visible separate-tab link opens the matching live generator.'};
 }else if(u.pathname==='/trainers/arifmetika.html'){
  entry.engine='arithmetic-levels';entry.practice={category:'generated-arithmetic-practice',repeatAvailable:true,control:'Следующий пример',evidence:['trainers/arifmetika.html:LEVELS,makeTask,next'],notes:'The URL course=preoge and level parameter are supported. Table facts are naturally finite; the Pythagoras completion map resets after all cells have been practised.'};
 }else if(u.pathname==='/equations/index.html'){
  const id=u.hash.slice(1);assert(equations.lessons.some(x=>x.id===id));entry.engine='equation-course';entry.practice={category:'seeded-generated-practice',repeatAvailable:true,control:'Новая самостоятельная задача / Новое условие без подсказки',sample:sample(seed=>equations.generate(id,seed)),evidence:['equations/app.js:newTask','equations/data.js:generate'],notes:'Previously seen conditions are marked as repeats. The 4000-history limit affects independent credit, not further practice.'};
 }else{
  const conf=standalone[u.pathname];assert(conf,'Every URL must have an explicit audited classification: '+entry.url);entry.engine=conf.engine;entry.practice={category:conf.category,repeatAvailable:true,control:conf.control,notes:conf.notes,evidence:[entry.sourceFile,...(conf.evidence||[])],...(conf.places?{places:conf.places}:{}),...(conf.continuations?{continuations:conf.continuations}:{} )};for(const url of conf.continuations||[])checkURL(url);
 }
}
const hub={id:'arithmetic-route-hub',title:'Умножение и деление',scope:'hub',url:'/trainers/oge-basics/multiplication-division/division-course.html',sourceFile:'trainers/oge-basics/multiplication-division/division-course.html',engine:'navigation',practice:{category:'navigation-no-task',repeatAvailable:null,control:'Open the selected stage or extra practice'}};checkURL(hub.url);
const counts={primary:entries.filter(x=>x.scope==='primary').length,preparation:entries.filter(x=>x.scope==='preparation').length,supplement:entries.filter(x=>x.scope==='supplement').length,aliases:entries.filter(x=>x.scope==='alias').length,linkedURLs:new Set(entries.map(x=>x.url)).size,withHub:entries.length+1,sharedImplementationFamilies:new Set(entries.map(x=>x.engine)).size};
assert.deepEqual([counts.primary,counts.preparation,counts.supplement,counts.aliases,counts.linkedURLs,counts.withHub,counts.sharedImplementationFamilies],[31,1,77,10,119,120,17]);
const inventory={schemaVersion:1,auditDate:'2026-10-19',baseline:'cf3b55b',source:'learning/division-course-map.js',sourceSHA256:crypto.createHash('sha256').update(read('learning/division-course-map.js')).digest('hex'),counts,method:'Source inspection and deterministic 200-seed samples where a pure API exists. Condition fingerprints exclude seed/identity. DOM continuation coverage is tools/arithmetic-supplements.dom.cjs; rounding preparation is covered by tools/rounding-stepwise.dom.cjs and tools/learning-rounding-preparation.dom.cjs; primary-route robots are separate. A finite set of mathematical facts is distinct from a UI that stops accepting attempts. This is not a claim that 119 URLs are 119 distinct engines or that every exam prototype has infinite new variants.',categories:Object.fromEntries([...new Set(entries.map(x=>x.practice.category))].map(c=>[c,entries.filter(x=>x.practice.category===c).length])),entries:[hub,...entries]};
const target=path.join(root,'tools/fixtures/arithmetic-practice-inventory.json'),json=JSON.stringify(inventory,null,2)+'\n';
if(process.argv.includes('--write')){fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,json);}else if(process.argv.includes('--check'))assert.equal(fs.readFileSync(target,'utf8'),json,'Inventory is stale; rerun with --write after reviewing changes');
console.log(JSON.stringify({status:'ARITHMETIC_PRACTICE_INVENTORY_OK',...counts,categories:inventory.categories},null,2));

'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {test}=require('node:test');
const {JSDOM}=require('jsdom');
const repo=path.resolve(__dirname,'..');
const C=require('../trainers/oge-basics/multiplication-division/division-course-core.js');
const P=require('../learning/preparation-map.js');
const N=require('../learning/division-course-map.js');
const catalog=require('../learning/catalog.js');
const server=require('../board-server/learning-contracts.js');
const resources=N.tracks.flatMap(track=>(track.supplementGroups||[]).flatMap(group=>group.items));
const allStages=N.tracks.flatMap(track=>track.stages);
const findButton=(f,id)=>[...f.host.querySelectorAll('[data-division-stage]')].find(button=>button.dataset.divisionStage===id);
const read=file=>fs.readFileSync(path.join(repo,file),'utf8');
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function fixture(role='student',api=async()=>({progress:[]})){
 const dom=new JSDOM('<main id="host"></main>',{url:'https://example.test/learning/#division-course',runScripts:'outside-only'});
 const w=dom.window,calls=[],reads=[];
 // The cabinet needs only metadata: arithmetic dependencies load inside trainers.
 w.eval(read('learning/division-course-map.js'));
 w.eval(read('learning/division-course.js'));
 const host=w.document.getElementById('host');
 const dispose=w.LearningDivisionCourse.mount(host,{account:{id:'learner',role},attempts:[],api:async url=>{reads.push(url);return api(url);},openContent:async(...args)=>{calls.push(args);}});
 return {dom,w,host,calls,reads,dispose};
}
const progress=(stage,outcome,completed=true,id='saved')=>({trainerId:'oge-basics',contentId:stage.id,completed,latest:{id,contentId:stage.id,trainerId:'oge-basics',outcome}});

test('entry diagnostic opens before both routes without creating attempts or changing their progress',async()=>{
 for(const role of ['student','teacher']){
  const f=fixture(role);await flush();
  const entry=f.host.querySelector('[data-division-diagnostic]'),link=entry.querySelector('a');
  assert.equal(entry.querySelector('h2').textContent,'С чего мне начать?');
  assert.equal(link.textContent,'Проверить себя');
  assert.equal(link.href,'https://mathexam.space/trainers/oge-basics/multiplication-division/division-diagnostic.html?from=cabinet');
  assert.equal(link.target,'_blank');assert(link.rel.includes('noopener'));
  assert(entry.compareDocumentPosition(f.host.querySelector('.division-course-track-links'))&f.w.Node.DOCUMENT_POSITION_FOLLOWING);
  assert.match(entry.textContent,/только в браузере/);
  assert.match(entry.textContent,/не входит в прогресс кабинета/);
  assert.match(entry.textContent,/вернись в кабинет/);
  assert.equal(entry.querySelector('button'),null,'An external check is not a managed attempt');
  assert.equal(f.calls.length,0);assert.deepEqual(f.reads,role==='student'?['/progress']:[]);
  assert.equal(f.host.querySelectorAll('[data-division-stage]').length,allStages.length);
  f.dispose();f.dom.window.close();
 }
});

test('public diagnostic entry uses a local destination before both unchanged course routes',()=>{
 const dom=new JSDOM(read('trainers/oge-basics/multiplication-division/division-course.html'),{url:'https://mathexam.space/trainers/oge-basics/multiplication-division/division-course.html',runScripts:'outside-only'}),w=dom.window;
 w.eval(read('learning/division-course-map.js'));
 w.eval(read('trainers/oge-basics/multiplication-division/division-course.js'));
 const entry=w.document.querySelector('[data-division-diagnostic]'),link=entry.querySelector('a');
 assert.equal(entry.querySelector('h2').textContent,'С чего мне начать?');
 assert.equal(link.getAttribute('href'),'division-diagnostic.html');
 assert.equal(link.textContent,'Проверить себя');
 assert(entry.compareDocumentPosition(w.document.querySelector('.division-course-track-links'))&w.Node.DOCUMENT_POSITION_FOLLOWING);
 assert.match(entry.textContent,/только в этом браузере/);
 assert.equal(w.localStorage.length,0,'Opening the route page must not create a diagnostic result or course progress');
 assert.deepEqual([...w.document.querySelectorAll('.division-course-track-heading progress')].map(node=>[node.value,node.max]),[[0,16],[0,15]]);
 assert.equal(w.document.querySelectorAll('[data-arithmetic-track] .division-course-step').length,allStages.length);
 dom.window.close();
});

test('two independent navigation tracks retain all 17 canonical steps and include column multiplication',async()=>{
 const f=fixture();await flush();
 assert.equal(f.w.DivisionLab,undefined);
 assert.equal(f.w.DivisionCourse.stages.length,17);
 assert.equal(f.w.DivisionCourse.make,undefined,'Cabinet metadata cannot expose tasks or answers');
 assert.deepEqual(JSON.parse(JSON.stringify(f.w.DivisionCourse.stages)),JSON.parse(JSON.stringify(C.stages)),'Navigation metadata must match the trainer core');
 assert.equal(f.w.ArithmeticCourse,f.w.DivisionCourse);
 assert.deepEqual([...f.host.querySelectorAll('[data-division-stage]')].map(button=>button.dataset.divisionStage),allStages.map(stage=>stage.id));
 assert.equal(f.host.querySelectorAll('[data-arithmetic-track] ol.division-course-list > li').length,32,'31 managed steps and one separate rounding preparation');
 assert.equal(f.host.querySelectorAll('[data-arithmetic-track] ol.division-course-list > li.division-course-step').length,31);
 assert.equal(f.host.querySelectorAll('[data-arithmetic-track]').length,2);
 assert.equal(new Set(allStages.map(stage=>stage.id)).size,allStages.length,'A step belongs to exactly one track');
 for(const stage of C.stages)assert(allStages.some(item=>item.id===stage.id),'Existing course work stays reachable');
 assert.equal(N.trackFor('oge-basics:multiplication-division/course-column-one-digit').id,'multiplication');
 assert.equal(N.trackFor('multiplication-division/course-column-two-digit').id,'multiplication');
 assert.equal(N.trackFor('multiplication-division/course-digit-choice').id,'division');
 assert.equal(N.trackFor('multiplication-division/course-multiply-bridge').id,'multiplication');
 assert.equal(N.trackFor('multiplication-division/course-multiply-two-digit').id,'multiplication');
 assert.equal(N.trackFor('unknown'),null);
 assert.equal(N.has('multiplication-division/course-column-one-digit'),false,'Canonical course API remains the old 17');
 assert.deepEqual([...f.host.querySelectorAll('.division-course-track-heading progress')].map(node=>[node.value,node.max]),[[0,16],[0,15]]);
 assert.deepEqual(f.reads,['/progress']);assert.equal(f.calls.length,0,'Viewing the course must not create attempts');
 assert.equal(f.host.querySelectorAll('[aria-current="step"]').length,2);
 assert(!f.host.textContent.includes('Тема освоена'));
 f.dispose();f.dom.window.close();
});

test('complete history controls continuation; finished attempts create fresh examples and unfinished ones resume',async()=>{
 const rows=[progress(C.stages[0],'hinted',true,'older-saved'),progress(C.stages[1],'started',false,'in-progress')];
 const f=fixture('student',async()=>({progress:rows}));await flush();
 const buttons=[findButton(f,C.stages[0].id),findButton(f,C.stages[1].id)];
 assert.equal(buttons[0].textContent,'Новые примеры →');
 assert.match(buttons[0].closest('article').textContent,/Есть решение по шагам/);
 assert.equal(buttons[1].textContent,'Продолжить →');
 assert.equal(buttons[1].closest('li').getAttribute('aria-current'),'step');
 assert.equal(buttons[0].closest('article').querySelector('a').getAttribute('href'),'#attempt=older-saved');
 buttons[0].click();await flush();buttons[1].click();await flush();
 assert.deepEqual(f.calls.map(args=>JSON.parse(JSON.stringify(args))),[
  ['oge-basics:'+C.stages[0].id,{fresh:true,sourceAttemptId:'older-saved'}],
  ['oge-basics:'+C.stages[1].id,{}]
 ]);
 f.dispose();f.dom.window.close();
});

test('a helped check is not labelled independent, and course completion is not mastery',async()=>{
 const check=C.stages.find(stage=>stage.guidance==='check');
 const f=fixture('student',async()=>({progress:[progress(check,'hinted')]}));await flush();
 let row=[...f.host.querySelectorAll('[data-division-stage]')].find(button=>button.dataset.divisionStage===check.id).closest('article');
 assert.match(row.textContent,/Попробуй новые примеры без подсказок/);
 assert(!row.textContent.includes('Три примера решены без подсказок.'));
 assert.match(f.host.textContent,/Одна законченная работа ещё не означает/);
 f.dispose();f.dom.window.close();
 const independent=fixture('student',async()=>({progress:[progress(check,'independent')]}));await flush();
 row=[...independent.host.querySelectorAll('[data-division-stage]')].find(button=>button.dataset.divisionStage===check.id).closest('article');
 assert.match(row.textContent,/Три примера решены без подсказок/);
 independent.dispose();independent.dom.window.close();
 const repeated=fixture('student',async()=>({progress:allStages.map(stage=>progress(stage,'repeated'))}));await flush();
 assert.match(repeated.host.textContent,/Три примера решены без подсказок/);
 assert.equal(repeated.host.querySelectorAll('[aria-current="step"]').length,0,'Successful independent retakes do not request the same check again');
 repeated.dispose();repeated.dom.window.close();
});

test('teacher uses existing assignment entry without reading student progress',async()=>{
 const f=fixture('teacher',async()=>{throw Error('Teacher must not call /progress');});await flush();
 const button=f.host.querySelector('[data-division-stage]');assert.match(button.textContent,/Назначить ученику/);button.click();await flush();
 assert.equal(f.reads.length,0);
 assert.deepEqual(f.calls.map(args=>JSON.parse(JSON.stringify(args))),[['oge-basics:'+allStages[0].id,{}]]);
 f.dispose();f.dom.window.close();
});

test('unavailable history leaves every step open without inventing a next step; retry is read-only',async()=>{
 let failure=true;const f=fixture('student',async()=>{if(failure)throw Error('offline');return {progress:[]};});await flush();
 assert.equal(f.host.querySelectorAll('[aria-current="step"]').length,0);
 assert.equal(f.host.querySelectorAll('[data-division-stage]:disabled').length,0);
 assert.match(f.host.textContent,/Не удалось загрузить историю/);
 failure=false;f.host.querySelector('[data-division-retry]').click();await flush();
 assert.equal(f.host.querySelectorAll('[aria-current="step"]').length,2);
 assert.equal(f.calls.length,0);assert.deepEqual(f.reads,['/progress','/progress']);
 f.dispose();f.dom.window.close();
});

test('leaving while progress loads cannot redraw a discarded course',async()=>{
 let finish;const f=fixture('student',()=>new Promise(resolve=>{finish=resolve;}));
 f.dispose();f.host.textContent='Другой раздел';finish({progress:[]});await flush();
 assert.equal(f.host.textContent,'Другой раздел');f.dom.window.close();
});

test('preparation map preserves old IDs while new course and wrappers share the ordered metadata',()=>{
 for(const track of N.tracks){
  const group=P.groups.find(group=>group.id===track.id);
  assert.deepEqual(group.items.filter(item=>item.tier==='core').map(item=>item.managedId),track.stages.map(stage=>'oge-basics:'+stage.id));
 }
 assert(P.get('oge-basics:multiplication-division/long-division-one-digit'));
 assert(P.get('oge-basics:multiplication-division/long-division-from-simple-to-decimals'));
 for(const stage of C.stages){
  const file='trainers/oge-basics/multiplication-division/course-'+stage.slug+'.html';
  const dom=new JSDOM(read(file));
  assert.equal(dom.window.document.body.dataset.courseId,stage.id);
  assert.equal(dom.window.document.querySelector('h1').textContent,stage.title);
  assert(dom.window.document.querySelector('#practice'));
  assert(dom.window.document.querySelector('#view-practice[hidden] #course-local-root'));
  assert.equal(dom.window.document.querySelector('#learning-remediation-root'),null,'Public root must not duplicate the managed loader root');
  for(const node of dom.window.document.querySelectorAll('script[src],link[rel="stylesheet"]')){
   const url=node.getAttribute('src')||node.getAttribute('href');
   assert(fs.existsSync(path.resolve(repo,path.dirname(file),url.split('?')[0])),url);
  }
  dom.window.close();
 }
 for(const file of ['learning/index.html','foundations/index.html']){
  const html=read(file);assert(html.indexOf('division-course-map.js')>=0&&html.indexOf('division-course-map.js')<html.indexOf('preparation-map.js'),file+' loads course metadata before map');
 }
 const dom=new JSDOM('',{runScripts:'outside-only'}),w=dom.window;
 w.eval(read('learning/division-course-map.js'));w.eval(read('learning/route.js'));
 assert.doesNotThrow(()=>w.LearningRoute.prerequisites({id:'oge-basics:fraction-meaning',contentId:'fraction-meaning',family:'remediation'},{get:()=>null}));
 dom.window.close();
});


test('finishing one track cannot advance or block the other track',async()=>{
 for(const finishedTrack of N.tracks){
  const remainingTrack=N.tracks.find(track=>track.id!==finishedTrack.id);
  const f=fixture('student',async()=>({progress:finishedTrack.stages.map(stage=>progress(stage,'repeated'))}));await flush();
  const full=f.host.querySelector('[data-arithmetic-track="'+finishedTrack.id+'"]');
  const empty=f.host.querySelector('[data-arithmetic-track="'+remainingTrack.id+'"]');
  assert.equal(full.querySelector('[aria-current="step"]'),null);
  assert.equal(full.querySelector('progress').value,finishedTrack.stages.length);
  assert.equal(empty.querySelector('progress').value,0);
  assert.equal(empty.querySelector('[aria-current="step"] [data-division-stage]').dataset.divisionStage,remainingTrack.stages[0].id);
  const start=empty.querySelector('[data-division-stage]');assert.equal(start.disabled,false);
  start.click();await flush();assert.deepEqual(f.calls.map(args=>JSON.parse(JSON.stringify(args))),[['oge-basics:'+remainingTrack.stages[0].id,{}]]);
  f.dispose();f.dom.window.close();
 }
});

test('saved column multiplication resumes and repeats through the existing attempt API',async()=>{
 const columns=N.tracks[0].stages.filter(stage=>stage.id.includes('/course-column-'));
 const f=fixture('student',async()=>({progress:[progress(columns[0],'started',false,'column-open'),progress(columns[1],'hinted',true,'column-done')]}));await flush();
 const first=findButton(f,columns[0].id),second=findButton(f,columns[1].id);
 assert.equal(first.textContent,'Продолжить →');assert.equal(second.textContent,'Новые примеры →');
 first.click();await flush();second.click();await flush();
 assert.deepEqual(f.calls.map(args=>JSON.parse(JSON.stringify(args))),[['oge-basics:'+columns[0].id,{}],['oge-basics:'+columns[1].id,{fresh:true,sourceAttemptId:'column-done'}]]);
 f.dispose();f.dom.window.close();
});

test('each continue control focuses only its own current step without creating an attempt',async()=>{
 const f=fixture();await flush();const scrolled=[];
 f.w.HTMLElement.prototype.scrollIntoView=function(){scrolled.push(this);};
 for(const track of N.tracks){
  const section=f.host.querySelector('[data-arithmetic-track="'+track.id+'"]');
  section.querySelector('[data-division-current]').click();
  assert.equal(f.w.document.activeElement,section.querySelector('[aria-current="step"]'));
  f.host.querySelector('[data-division-track-jump="'+track.id+'"]').click();
  assert.equal(f.w.document.activeElement,section);
 }
 assert.equal(scrolled.length,4);assert.equal(f.calls.length,0);
 f.dispose();f.dom.window.close();
});

test('navigation loaded after the arithmetic core does not replace its task API',()=>{
 const dom=new JSDOM('',{runScripts:'outside-only'}),w=dom.window;
 const arithmetic={make(){},stages:C.stages};w.DivisionCourse=arithmetic;
 w.eval(read('learning/division-course-map.js'));
 assert.equal(w.DivisionCourse,arithmetic);assert.equal(w.ArithmeticCourse.tracks.length,2);
 dom.window.close();
});


test('a repeat in progress preserves solved-history count while offering its saved continuation',async()=>{
 for(const track of N.tracks){
  const stage=track.stages[0],f=fixture('student',async()=>({progress:[progress(stage,'started',true,'saved-repeat')]}));await flush();
  const section=f.host.querySelector('[data-arithmetic-track="'+track.id+'"]'),button=findButton(f,stage.id);
  assert.equal(section.querySelector('progress').value,1,'An unfinished repeat cannot erase an earlier solved example');
  assert.match(section.querySelector('.division-course-progress-text').textContent,new RegExp('Есть решённые примеры: 1 из '+track.stages.length+' шагов'));
  assert.equal(button.closest('li').getAttribute('aria-current'),'step');
  assert(button.closest('li').classList.contains('is-complete'));
  assert.equal(button.textContent,'Продолжить →');
  button.click();await flush();assert.deepEqual(f.calls.map(args=>JSON.parse(JSON.stringify(args))),[['oge-basics:'+stage.id,{}]]);
  const other=f.host.querySelector('[data-arithmetic-track="'+N.tracks.find(item=>item.id!==track.id).id+'"]');
  assert.equal(other.querySelector('progress').value,0);
  f.dispose();f.dom.window.close();
 }
});


test('all additional multiplication resources stay in its rail with correct cabinet or public destinations',async()=>{
 const f=fixture();await flush();const multiplication=f.host.querySelector('[data-arithmetic-track="multiplication"]');
 assert.equal(resources.length,77);assert.equal(resources.filter(item=>item.managedId).length,11);
 assert.equal(resources.flatMap(item=>item.aliases).length,10);
 assert.equal(multiplication.querySelectorAll('[data-arithmetic-group]').length,5);
 assert.equal(multiplication.querySelectorAll('[data-arithmetic-resource-id]').length,77);
 assert.equal(f.host.querySelector('[data-arithmetic-track="division"] [data-arithmetic-resource-id]'),null);
 for(const item of resources){
  const card=[...multiplication.querySelectorAll('[data-arithmetic-resource-id]')].find(node=>node.dataset.arithmeticResourceId===item.id);
  assert(card);const url=new URL(item.publicUrl,'https://mathexam.space');
  assert(fs.statSync(path.join(repo,decodeURIComponent(url.pathname))).size>100,'A resource must not be a blank placeholder: '+item.publicUrl);
  if(item.managedId){
   const canonical=catalog.get(item.managedId);assert(canonical,'Catalog entry exists: '+item.managedId);
   assert.equal(canonical.trainerId,item.trainerId);assert.equal(canonical.contentId,item.contentId);
   assert.doesNotThrow(()=>server.create(item.trainerId,item.contentId,1),'Managed destination has a real contract');
   card.querySelector('[data-arithmetic-resource]').click();await flush();
   assert.deepEqual(JSON.parse(JSON.stringify(f.calls.at(-1))),[item.managedId,{}]);
  }else{
   assert.equal(card.querySelector('button'),null);assert.match(card.textContent,/не входит в прогресс кабинета/);
   const link=card.querySelector('.actions a');assert.equal(link.href,'https://mathexam.space'+item.publicUrl);
   assert.equal(link.target,'_blank');assert(link.rel.includes('noopener'));
   assert(card.closest('details'),'Large separate collections are expandable');
  }
  for(const alias of item.aliases){
   const link=[...card.querySelectorAll('[data-arithmetic-alias]')].find(node=>node.dataset.arithmeticAlias===alias.id);
   assert.equal(link.href,'https://mathexam.space'+alias.publicUrl);assert.equal(link.target,'_blank');
  }
 }
 assert.equal(f.calls.length,11);assert.deepEqual(f.reads,['/progress']);
 f.dispose();f.dom.window.close();
});

test('additional managed progress resumes real path work and excludes public-only exercises from every count',async()=>{
 const item=resources.find(item=>item.managedId==='path:practice-decimals'),publicItem=resources.find(item=>item.id==='public:decimal-level1');
 const record={trainerId:item.trainerId,contentId:item.contentId,completed:true,latest:{id:'saved-decimals',outcome:'started'}};
 const fakePublic={trainerId:'oge-basics',contentId:publicItem.id,completed:true,latest:{id:'unrelated',outcome:'independent'}};
 const f=fixture('student',async()=>({progress:[record,fakePublic]}));await flush();
 const group=f.host.querySelector('[data-arithmetic-group="decimals"]');
 assert.equal(group.querySelector('progress').value,1);assert.equal(group.querySelector('progress').max,1);
 assert.equal(f.host.querySelector('[data-arithmetic-track="multiplication"] > header progress').value,0);
 const button=group.querySelector('[data-arithmetic-resource]');assert.equal(button.textContent,'Продолжить →');
 button.click();await flush();assert.deepEqual(JSON.parse(JSON.stringify(f.calls.at(-1))),[item.managedId,{}]);
 assert.equal(button.closest('li').querySelector('a').getAttribute('href'),'#attempt=saved-decimals');
 f.dispose();f.dom.window.close();
 const finished=fixture('student',async()=>({progress:[{...record,latest:{id:'saved-decimals',outcome:'independent'}}]}));await flush();
 finished.host.querySelector('[data-arithmetic-resource="path:practice-decimals"]').click();await flush();
 assert.deepEqual(JSON.parse(JSON.stringify(finished.calls.at(-1))),[item.managedId,{fresh:true,sourceAttemptId:'saved-decimals'}]);
 finished.dispose();finished.dom.window.close();
});

test('supplement jump controls focus a group without creating attempts',async()=>{
 const f=fixture();await flush();f.w.HTMLElement.prototype.scrollIntoView=function(){};
 for(const group of N.tracks[0].supplementGroups){
  f.host.querySelector('[data-arithmetic-group-jump="'+group.id+'"]').click();
  assert.equal(f.w.document.activeElement,f.host.querySelector('[data-arithmetic-group="'+group.id+'"]'));
 }
 assert.equal(f.calls.length,0);f.dispose();f.dom.window.close();
});

 test('addition and subtraction provide twelve separate prerequisites and cabinet jump preserves the route',async()=>{
 const f=fixture();await flush();
 assert.deepEqual([...f.host.querySelectorAll('[data-foundation-track]')].map(n=>n.dataset.foundationTrack),['addition','subtraction']);
 const links=[...f.host.querySelectorAll('[data-foundation-track] .division-course-step a')];assert.equal(links.length,12);
 for(const link of links){assert.equal(link.target,'_blank');assert.equal(link.rel,'noopener');assert.match(link.href,/arithmetic-foundations\.html#(add|sub)-/);}
 f.w.HTMLElement.prototype.scrollIntoView=function(){};
 f.host.querySelector('[data-foundation-jump="subtraction"]').click();assert.equal(f.w.document.activeElement.dataset.foundationTrack,'subtraction');
 assert.equal(f.host.querySelectorAll('[data-division-stage]').length,31);f.dom.window.close();
 });

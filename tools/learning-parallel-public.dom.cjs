'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const course=require('../learning/division-course-map');
const contracts=require('../trainers/oge-basics/learning-contracts');
const dir=path.join(__dirname,'../trainers/oge-basics/multiplication-division');
const html=fs.readFileSync(path.join(dir,'division-course.html'),'utf8');
const source=fs.readFileSync(path.join(dir,'division-course.js'),'utf8');
const mapSource=fs.readFileSync(path.join(__dirname,'../learning/division-course-map.js'),'utf8');
function mount(initial={},blocked=false){
 const dom=new JSDOM(html,{url:'https://example.test/trainers/oge-basics/multiplication-division/division-course.html',runScripts:'outside-only'});
 const records=new Map(Object.entries(initial)),writes=[];
 Object.defineProperty(dom.window,'localStorage',{value:{
  getItem(key){if(blocked)throw Error('Storage unavailable');return records.get(key)||null;},
  setItem(...args){writes.push(args);throw Error('Navigation must not save');},
  removeItem(...args){writes.push(args);throw Error('Navigation must not delete');}
 }});
 dom.window.eval(mapSource);dom.window.eval(source);
 const track=id=>dom.window.document.querySelector('[data-arithmetic-track="'+id+'"]');
 const progress=id=>track(id).querySelector('progress');
 return {dom,records,writes,track,progress,refresh:()=>dom.window.dispatchEvent(new dom.window.Event('pageshow'))};
}
const key=id=>'mathExamBasics.divisionCourse.v1.'+id;
const historyKey=id=>'mathExamBasics.divisionCourse.history.v1.'+id;
function savedCourse(id,complete){
 const {taskSpec,state}=contracts.create(id,1);
 if(complete){
  const questions=taskSpec.steps.length?taskSpec.steps:taskSpec.items.length?taskSpec.items:[taskSpec.task];
  state.answers=questions.map(question=>typeof question.answer==='object'?question.answer.n+'/'+question.answer.d:String(question.answer));
  state.step=state.answers.length;state.completed=true;
 }
 return JSON.stringify({version:1,seed:1,state:contracts.normalize(taskSpec,state),assisted:false,errors:0});
}
const legacyKey=slug=>JSON.parse(fs.readFileSync(path.join(dir,slug+'.html'),'utf8').match(/const SPEC = (\{.*\});/)[1]).storageKey;
const legacy=values=>JSON.stringify({learnDone:[],independent:0,supported:0,reviewed:0,best:0,...values});
const empty=mount();
assert.deepEqual([...empty.dom.window.document.querySelectorAll('[data-arithmetic-track]')].map(node=>node.dataset.arithmeticTrack),['multiplication','division']);
for(const track of course.tracks){
 const node=empty.track(track.id),steps=[...node.querySelectorAll('.division-course-step')];
 assert.equal(steps.length,track.id==='multiplication'?16:15);
 assert.deepEqual(steps.map(step=>step.querySelector('h3').textContent),track.stages.map(stage=>stage.title));
 assert.equal(empty.progress(track.id).value,0);assert.equal(empty.progress(track.id).max,track.stages.length);
 assert.equal(node.querySelectorAll('[aria-current="step"]').length,1);
 assert(steps[0].hasAttribute('aria-current'));
 steps.forEach((step,index)=>{
  const link=step.querySelector('.actions a').getAttribute('href');
  assert.equal(link,track.stages[index].id.split('/').at(-1)+'.html');
  assert(fs.existsSync(path.join(dir,link)),'Every step must open an existing trainer: '+link);
 });
}
assert.match(empty.track('multiplication').textContent,/Умножаем столбиком на одну цифру/);
assert.match(empty.track('multiplication').textContent,/Умножаем столбиком на число из двух цифр/);
assert.doesNotMatch([...empty.dom.window.document.scripts].map(script=>script.src).join(' '),/division-lab-core|division-course-core|quotient-estimate-core/);
assert(empty.dom.window.document.querySelector('script[src*="division-course-map.js"]'));
assert.deepEqual(empty.writes,[]);empty.dom.window.close();

const firstDivision=course.tracks[1].stages[0].id,nextDivision=course.tracks[1].stages[1].id;
const prior={
 [legacyKey('multiplication-meaning')]:legacy({independent:3}),
 [legacyKey('multiplication-pythagoras-table')]:legacy({supported:2}),
 [legacyKey('multiplication-tricks')]:legacy({best:1}),
 [legacyKey('multiplication-ladder')]:legacy({learnDone:[true],reviewed:4}),
 [key(firstDivision)]:savedCourse(firstDivision,true),
 [key(nextDivision)]:savedCourse(nextDivision,false)
};
const t=mount(prior);
assert.equal(t.progress('multiplication').value,3);
assert.equal(t.progress('division').value,1);
assert.equal(t.track('multiplication').querySelector('[aria-current="step"] .division-course-number').textContent,'4');
assert.equal(t.track('division').querySelector('[aria-current="step"] .division-course-number').textContent,'2');
assert.match(t.track('division').querySelector('[aria-current="step"]').textContent,/Есть сохранённая работа/);
assert.doesNotMatch(t.dom.window.document.body.textContent,/навык освоен|всё освоено|можно не повторять/i);
assert.deepEqual(Object.fromEntries(t.records),prior,'Opening the route must preserve each old browser record byte-for-byte');
t.records.set(key(nextDivision),savedCourse(nextDivision,true));t.refresh();
assert.equal(t.progress('division').value,2);assert.equal(t.progress('multiplication').value,3);
t.records.set(legacyKey('multiplication-tricks'),'{broken');t.dom.window.dispatchEvent(new t.dom.window.Event('storage'));
assert.equal(t.progress('multiplication'),null,'Do not present an exact count when a record cannot be read');
assert.match(t.track('multiplication').textContent,/Они оставлены без изменений/);
assert.equal(t.progress('division').value,2,'One unavailable record must not hide the other track');
assert.equal(t.records.get(legacyKey('multiplication-tricks')),'{broken');assert.deepEqual(t.writes,[]);t.dom.window.close();

const repeatRecords={
 [key(firstDivision)]:savedCourse(firstDivision,false),
 [historyKey(firstDivision)]:JSON.stringify({schemaVersion:1,hasCompleted:true})
};
const repeat=mount(repeatRecords);
assert.equal(repeat.progress('division').value,1,'A fresh repeat cannot erase the history of a solved example');
const repeatingStep=repeat.track('division').querySelector('[aria-current="step"]');
assert.equal(repeatingStep.querySelector('.division-course-number').textContent,'1','The unfinished repeat remains the current step');
assert(repeatingStep.classList.contains('is-complete'));
assert.match(repeatingStep.textContent,/Новую работу можно продолжить/);
assert.match(repeatingStep.querySelector('.actions a').textContent,/Продолжить/);
assert.deepEqual(Object.fromEntries(repeat.records),repeatRecords);assert.deepEqual(repeat.writes,[]);
repeat.records.set(historyKey(firstDivision),'{broken history');repeat.refresh();
assert.equal(repeat.progress('division'),null,'A corrupt history cannot produce a fabricated exact progress count');
assert.equal(repeat.records.get(historyKey(firstDivision)),'{broken history');assert.deepEqual(repeat.writes,[]);repeat.dom.window.close();

const blocked=mount({},true);
assert.equal(blocked.dom.window.document.querySelectorAll('progress').length,0);
assert.equal(blocked.dom.window.document.querySelectorAll('.division-course-step .actions a').length,31);
assert.match(blocked.track('division').textContent,/Не все записи удалось прочитать/);
assert.deepEqual(blocked.writes,[]);blocked.dom.window.close();

const expanded=mount(),resources=course.tracks[0].supplementGroups.flatMap(group=>group.items);
assert.equal(resources.length,77);assert.equal(expanded.track('multiplication').querySelectorAll('[data-arithmetic-group]').length,5);
assert.equal(expanded.track('division').querySelector('[data-arithmetic-group]'),null);
assert.equal(expanded.dom.window.document.querySelectorAll('progress').length,2,'Separate public practice never inflates either local progress bar');
for(const item of resources){
 const card=[...expanded.track('multiplication').querySelectorAll('[data-arithmetic-resource-id]')].find(node=>node.dataset.arithmeticResourceId===item.id);
 assert(card,'Every inventoried non-core material is reachable');
 const link=card.querySelector('[data-arithmetic-public]');assert.equal(link.getAttribute('href'),item.publicUrl);
 assert.equal(link.target,'_blank');assert(link.rel.includes('noopener'));
 const physical=path.join(__dirname,'..',new URL(item.publicUrl,'https://example.test').pathname);
 assert(fs.statSync(physical).size>100,'No one-byte placeholders');
 const cabinet=card.querySelector('[data-arithmetic-managed]');
 if(item.managedId){assert.equal(cabinet.getAttribute('href'),'https://mathexam-board-ladynata.msk1.amvera.tech/learning/#practice='+encodeURIComponent(item.managedId));assert.equal(new URL(cabinet.href).origin,'https://mathexam-board-ladynata.msk1.amvera.tech');}
 else{assert.equal(cabinet,null);assert.match(card.textContent,/не входит в прогресс кабинета/);assert(card.closest('details'));}
 for(const alias of item.aliases){assert.equal([...card.querySelectorAll('[data-arithmetic-alias]')].find(node=>node.dataset.arithmeticAlias===alias.id).getAttribute('href'),alias.publicUrl);}
}
for(const group of course.tracks[0].supplementGroups){
 assert(expanded.dom.window.document.querySelector('a[href="#arithmetic-group-'+group.id+'"]'));
 assert(expanded.dom.window.document.getElementById('arithmetic-group-'+group.id));
}
for(const link of expanded.dom.window.document.querySelectorAll('a[href*="learning/"]'))assert.equal(new URL(link.href).origin,'https://mathexam-board-ladynata.msk1.amvera.tech','Every public-to-cabinet link uses the service with the account API');
assert.equal([...expanded.dom.window.document.querySelectorAll('a')].filter(link=>link.hash==='#division-course').length,2);
assert.deepEqual(expanded.writes,[]);expanded.dom.window.close();

console.log('LEARNING_PARALLEL_PUBLIC_DOM_OK (16 + 15 independent routes; real legacy/course browser records; both column trainers; exact links; separate counters/current steps; no writes; restore/pageshow/storage; corrupt and blocked storage; navigation-only scripts)');

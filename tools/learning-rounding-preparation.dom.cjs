'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const catalog=require('../learning/catalog');
const metadata=require('../learning/division-course-map');
const core=require('../trainers/oge-basics/multiplication-division/division-course-core');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const estimate='multiplication-division/course-estimate';
const destination='https://mathexam.space/trainers/rounding-stepwise.html?place=1&from=division';
function assertLink(link){
 assert(link,'Rounding preparation is visible');
 assert.equal(link.href,destination);
 assert.equal(link.target,'_blank');
 assert(link.relList.contains('noopener'));
 assert.equal(link.onclick,null,'The link cannot create, assign, or submit an attempt');
}
function assertPrep(host){
 const preparation=host.querySelector('[data-division-preparation]');
 assert.equal(host.querySelectorAll('[data-division-preparation]').length,1);
 assert.equal(preparation.dataset.divisionPreparation,'rounding-stepwise');
 assert.equal(preparation.closest('[data-arithmetic-track]').dataset.arithmeticTrack,'division');
 assert(!preparation.classList.contains('division-course-step'));
 assert.equal(preparation.querySelector('button,[data-division-stage],progress'),null);
 assert.equal(preparation.getAttribute('aria-current'),null);
 assert.match(preparation.textContent,/десятков, сотен, тысяч/);
 assert.match(preparation.textContent,/вернись сюда к прикидке/);
 const next=preparation.nextElementSibling;
 assert(next.classList.contains('division-course-step'));
 assert.equal(next.querySelector('h3').textContent,core.stageFor(estimate).title);
 assertLink(preparation.querySelector('a'));
 return preparation;
}
test('rounding preparation changes navigation only; canonical stage IDs, order and prerequisites remain intact',()=>{
 assert.deepEqual(metadata.stages,core.stages);
 assert.equal(metadata.stages.length,17);
 const division=metadata.tracks.find(track=>track.id==='division');
 assert.equal(division.stages.length,15);
 assert.equal(metadata.tracks.flatMap(track=>track.stages).length,31);
 const stage=division.stages.find(stage=>stage.id===estimate);
 assert.equal(stage.preparation,metadata.roundingPreparation);
 assert(Object.isFrozen(stage.preparation));
 assert(!Object.hasOwn(metadata.stageFor(estimate),'preparation'),'Public practice metadata cannot enter canonical tasks');
 assert.equal(metadata.has('rounding-stepwise'),false);
 assert.equal(metadata.trackFor('rounding-stepwise'),null);
 assert.equal(catalog.get('oge-basics:rounding-stepwise'),null);
});
for(const role of ['student','teacher'])test(`cabinet ${role} sees rounding immediately before estimate without changing progress or creating work`,async()=>{
 const dom=new JSDOM('<main id="host"></main>',{url:'https://cabinet.example.test/learning/#division-course',runScripts:'outside-only'});
 const w=dom.window,host=w.document.getElementById('host'),reads=[],writes=[];
 const saved={trainerId:'oge-basics',contentId:estimate,completed:true,latest:{id:'saved-estimate',outcome:'started'}};
 const before=JSON.stringify(saved);
 w.eval(read('learning/division-course-map.js'));w.eval(read('learning/division-course.js'));
 const dispose=w.LearningDivisionCourse.mount(host,{account:{id:'fixture',role},api:async(...args)=>{reads.push(args);return {progress:[saved]};},openContent:async(...args)=>writes.push(args)});
 await tick();const preparation=assertPrep(host);
 assert.match(preparation.textContent,/не входит в прогресс кабинета/);
 preparation.querySelector('a').dispatchEvent(new w.MouseEvent('click',{bubbles:true,cancelable:true}));
 await tick();assert.deepEqual(writes,[]);assert.equal(JSON.stringify(saved),before);
 assert.equal(host.querySelectorAll('[data-division-stage]').length,31);
 if(role==='student'){
  assert.deepEqual(reads,[['/progress']]);
  const track=preparation.closest('[data-arithmetic-track]');
  assert.equal(track.querySelector('progress').max,15);assert.equal(track.querySelector('progress').value,1);
  assert.equal(preparation.nextElementSibling.querySelector('[data-division-stage]').textContent,'Продолжить →');
  assert.equal(preparation.nextElementSibling.querySelector('a').getAttribute('href'),'#attempt=saved-estimate');
 }else{assert.deepEqual(reads,[]);assert.equal(preparation.closest('[data-arithmetic-track]').querySelector('progress'),null);}
 dispose();w.close();
});
test('public route preserves saved work and both progress counters when opening separate rounding',()=>{
 const prefix='trainers/oge-basics/multiplication-division/';
 const dom=new JSDOM(read(prefix+'division-course.html'),{url:'https://mathexam.space/'+prefix+'division-course.html',runScripts:'outside-only'});
 const w=dom.window,records=new Map([['unrelated','keep verbatim']]),writes=[];
 Object.defineProperty(w,'localStorage',{value:{getItem:key=>records.get(key)??null,setItem:(...args)=>writes.push(args),removeItem:(...args)=>writes.push(args)}});
 w.eval(read('learning/division-course-map.js'));w.eval(read(prefix+'division-course.js'));
 const host=w.document.getElementById('division-course-stages'),preparation=assertPrep(host);
 assert.match(preparation.textContent,/не входит в счётчик шагов/);
 assert.deepEqual([...host.querySelectorAll('progress')].map(p=>[p.value,p.max]),[[0,16],[0,15]]);
 assert.equal(host.querySelectorAll('.division-course-step').length,31);
 preparation.querySelector('a').dispatchEvent(new w.MouseEvent('click',{bubbles:true,cancelable:true}));
 w.dispatchEvent(new w.Event('pageshow'));assertPrep(host);
 assert.deepEqual(writes,[]);assert.deepEqual([...records],[['unrelated','keep verbatim']]);w.close();
});
for(const contentId of [estimate,'multiplication-division/quotient-estimate'])test(`parent support for ${contentId} links to Claude rounding and retains the current draft`,()=>{
 const dom=new JSDOM('<main id="host"></main>',{url:'https://cabinet.example.test/learning/#attempt=saved',runScripts:'outside-only'});
 const w=dom.window,host=w.document.getElementById('host'),writes=[];
 const attempt={id:'saved',learnerId:'fixture',trainerId:'oge-basics',contentId,outcome:'started',state:{answer:'80',step:2,note:'Моя запись'}};
 const before=JSON.stringify(attempt);
 w.eval(read('learning/division-course-map.js'));w.eval(read('learning/route.js'));
 w.LearningRoute.mountSupport(host,{catalog,attempt,attempts:[attempt],account:{id:'fixture',role:'student'},labels:{},submit:()=>writes.push('submit'),canLeave:()=>true,openContent:(...args)=>writes.push(args)});
 const section=host.querySelector('.rounding-preparation');assertLink(section.querySelector('a'));
 assert.match(section.textContent,/Эта работа останется здесь/);
 assert.equal(section.querySelector('button,iframe'),null);
 assert(![...host.querySelectorAll('[data-support-basis]')].some(button=>button.dataset.supportBasis==='oge-basics:rounding'),'The retired rounding trainer is not offered as the estimate foundation');
 section.querySelector('a').dispatchEvent(new w.MouseEvent('click',{bubbles:true,cancelable:true}));
 assert.deepEqual(writes,[]);assert.equal(JSON.stringify(attempt),before);assert.equal(w.location.hash,'#attempt=saved');w.close();
});
test('unrelated tasks do not gain rounding support',()=>{
 const dom=new JSDOM('<main id="host"></main>',{runScripts:'outside-only'}),w=dom.window;
 w.eval(read('learning/division-course-map.js'));w.eval(read('learning/route.js'));
 const host=w.document.getElementById('host');
 w.LearningRoute.mountSupport(host,{catalog,attempt:{id:'saved',trainerId:'oge-basics',contentId:'fraction-meaning'},attempts:[],account:{id:'fixture'},labels:{},submit(){},canLeave(){return true;},openContent(){}});
 assert.equal(host.querySelector('.rounding-preparation'),null);w.close();
});
test('both public estimate pages offer the same rounding practice outside their exercise content',()=>{
 for(const name of ['course-estimate','quotient-estimate']){
  const file='trainers/oge-basics/multiplication-division/'+name+'.html';
  const dom=new JSDOM(read(file),{url:'https://mathexam.space/'+file}),document=dom.window.document;
  const section=document.querySelector('.rounding-preparation');assertLink(section.querySelector('a'));
  assert.equal(section.closest('#view-practice'),null);
  assert.equal(section.hidden,false);
  assert.match(section.textContent,/десятков, сотен, тысяч/);
  assert(document.querySelector('#practice'));assert(document.querySelector('#view-practice'));
  assert(!section.querySelector('button,iframe'));dom.window.close();
 }
});

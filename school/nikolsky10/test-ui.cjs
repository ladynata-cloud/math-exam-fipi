'use strict';
// In-memory DOM contracts; visual browser review is recorded separately.
const {JSDOM}=require('jsdom'),fs=require('node:fs'),assert=require('node:assert/strict');
function boot(saved){const dom=new JSDOM(fs.readFileSync(__dirname+'/index.html','utf8'),{url:'https://nikolsky.test/',runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window;w.scrollTo=()=>{};const errors=[];w.console.error=(...args)=>errors.push(args.join(' '));if(saved)w.localStorage.setItem('mathexam.nikolsky10.2022.v1',saved);for(const file of ['../peterson6/math.js','check.js','models.js','data.js','app.js'])w.eval(fs.readFileSync(__dirname+'/'+file,'utf8'));return {w,d:w.document,errors};}
const {w,d,errors}=boot(),api=w.NikolskyApp;
const nav=hash=>{w.history.replaceState(null,'',hash);api.route();};
const click=s=>{const el=d.querySelector(s);assert(el,'Missing '+s);el.click();};
const input=(s,v)=>{const el=d.querySelector(s);assert(el,'Missing '+s);el.value=v;el.dispatchEvent(new w.Event('input',{bubbles:true}));};
const submit=s=>{const el=d.querySelector(s);assert(el,'Missing '+s);el.dispatchEvent(new w.Event('submit',{cancelable:true,bubbles:true}));};
const state=()=>api.getState();
assert(d.querySelector('h1').textContent.includes('Увидеть'));let renders=0,walkedSteps=0;
for(const l of w.NikolskyCourse.lessons){for(let i=0;i<l.tasks.length;i++){
 const t=l.tasks[i];nav('#lesson/'+l.id+'/'+i);assert(d.querySelector('.prompt'),t.id);assert(!d.querySelector('.error-page'));assert(d.querySelector('#model').textContent.trim(),l.id+' model');assert(d.querySelector('.answer-form label').textContent.trim());
 click('[data-action="guided"]');
 for(let k=0;k<t.steps.length;k++){input('[data-step-input="'+k+'"]',t.steps[k].answer);submit('[data-step-form="'+k+'"]');assert.equal(state().tasks[t.id].step,k+1,t.id+' step '+k);assert.equal(d.querySelectorAll('.step.completed').length,k+1);walkedSteps++;}
 if(t.kind==='choice')click('[data-choice="'+t.choices.indexOf(t.answer)+'"]');else input('#final-answer',t.answer);submit('#answer-form');assert(state().tasks[t.id].correct,t.id);assert(!state().tasks[t.id].independent,t.id+' helped');renders++;
 }}
// Draft, completed step and notebook survive detour and reload.
const lesson=w.NikolskyCourse.lessons.find(l=>l.tasks.some(t=>t.kind!=='choice'&&t.skills.length));const index=lesson.tasks.findIndex(t=>t.kind!=='choice'&&t.skills.length),task=lesson.tasks[index],route='#lesson/'+lesson.id+'/'+index;
nav(route);input('#notebook','Проверка сохранения записей');const old=state().tasks[task.id];click('[data-action="detour"]');assert(state().origin);nav(w.location.hash);assert(d.querySelector('.return-banner'));click('[data-action="new"]');click('[data-action="return"]');nav(w.location.hash);assert.equal(d.querySelector('#notebook').value,'Проверка сохранения записей');assert.equal(state().tasks[task.id].step,old.step);
const saved=w.localStorage.getItem('mathexam.nikolsky10.2022.v1'),reloaded=boot(saved);assert.equal(reloaded.w.NikolskyApp.getState().tasks[task.id].note,'Проверка сохранения записей');assert.equal(reloaded.errors.length,0);reloaded.w.close();
// Index search endpoints and actual solution links.
for(const n of ['1.1','2.15','14.1','99.999']){nav('#home');input('#exercise-number',String(n));submit('#number-form');assert(d.querySelector('#number-result').textContent.includes('№ '+n));}
const source=w.NikolskyCourse.lessons.flatMap(l=>l.tasks).find(t=>t.source.type==='textbook'),n=/№\s*(\d+\.\d+)/.exec(source.source.reference)[1];nav('#home');input('#exercise-number',n);submit('#number-form');assert(d.querySelector('#number-result a.button:not(.quiet)'),'source solution link');
// A letter in an explanatory suffix is not an available exercise subpart.
const searchSource=query=>{nav('#home');input('#exercise-number',query);submit('#number-form');return d.querySelector('#number-result');};
for(const query of ['11.55 в','7.16 г','1.62 а']){
 const result=searchSource(query);
 assert.equal(result.querySelectorAll('a.button:not(.quiet)').length,0,query+' must not match a suffix letter');
 assert(result.textContent.includes('Индивидуального разбора этого номера или подпункта пока нет.'),query+' missing-solution message');
 assert(result.querySelector('a.quiet'),query+' retains topic navigation');
}
const sourceOwner=w.NikolskyCourse.lessons.find(l=>l.tasks.some(t=>t.id==='n10-11.9-1'));
assert(sourceOwner,'The reviewed № 11.55 а source task must exist');
const sourceIndex=sourceOwner.tasks.findIndex(t=>t.id==='n10-11.9-1');
const genuine=searchSource('11.55 а').querySelectorAll('a.button:not(.quiet)');
assert.equal(genuine.length,1,'The explicit а subpart is available');
assert.equal(genuine[0].getAttribute('href'),'#lesson/'+sourceOwner.id+'/'+sourceIndex,'The source search links to the actual selected task');
assert(searchSource('1.62').querySelector('a.button:not(.quiet)'),'A whole exercise remains searchable without inventing a subpart');
const ordinaryTopics=Array.from(searchSource('1.12 а').querySelectorAll('a.quiet'),a=>a.getAttribute('href'));
const leadingZero=searchSource('01.12 а');
assert(leadingZero.querySelector('a.button:not(.quiet)'),'Leading zero keeps the actual exercise link');
assert(ordinaryTopics.length>0,'The paragraph has topic links');
assert.deepEqual(Array.from(leadingZero.querySelectorAll('a.quiet'),a=>a.getAttribute('href')),ordinaryTopics,'Leading zero keeps the same paragraph topics');
// Mathematical formatting preserves structure without interpreting markup as HTML.
const mathFragment=d.createElement('div');
mathFragment.innerHTML=api.format('{{frac:x^(n+1):a^2}} <img src=x onerror=alert(1)>');
assert.equal(mathFragment.querySelectorAll('.fra').length,1);
assert.deepEqual(Array.from(mathFragment.querySelectorAll('.fra sup'),el=>el.textContent),['n+1','2']);
assert.equal(mathFragment.querySelectorAll('img,script,[onerror],[onmouseover]').length,0,'Escaped text never becomes executable markup');
assert(mathFragment.textContent.includes('<img src=x onerror=alert(1)>'));
assert(api.check('2*π/3',{kind:'text',answer:'2pi/3'}),'Multiplication and π spelling');
assert(api.check('4pi/6',{kind:'text',answer:'2pi/3'}),'Equivalent rational π coefficient');
assert(!api.check('2pi/6',{kind:'text',answer:'2pi/3'}),'Distinct π values remain distinct');
assert(api.check('2π/4;2π/6',{kind:'set',answer:'pi/3;pi/2'}),'Root sets accept order and equivalent π fractions');
for(const hash of ['#lesson/constructor','#practice/constructor/1','#lesson/unknown','#lesson/p01/9999','#practice/unknown/1','#skills','#progress','#home']){nav(hash);assert(!d.querySelector('.error-page'),hash);}
assert.deepEqual(errors,[]);
const malformed=boot('{bad');assert(!malformed.d.querySelector('#storage-warning').hidden);assert.equal(malformed.w.localStorage.getItem('mathexam.nikolsky10.2022.v1'),'{bad');malformed.w.close();
console.log(JSON.stringify({gate:'NIKOLSKY10_UI_OK',status:'PASS',renders,walkedSteps,flows:['all task/step answers','sticky assistance','detour return','notebook reload','source search and explicit subparts','leading-zero paragraph','escaped fraction and superscript rendering','equivalent pi answers','invalid routes','corrupt storage preserved']}));w.close();

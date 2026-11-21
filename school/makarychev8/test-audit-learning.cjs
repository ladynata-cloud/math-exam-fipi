'use strict';
const assert=require('node:assert/strict'),test=require('node:test'),fs=require('node:fs'),{JSDOM}=require('jsdom');
const models=require('./models.js'),math=models.math;
function boot(hash='#home',saved){const dom=new JSDOM(fs.readFileSync(__dirname+'/index.html','utf8'),{url:'https://m8.test/'+hash,runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window;w.scrollTo=()=>{};if(saved)w.localStorage.setItem('mathexam.makarychev8.2024.v1',JSON.stringify(saved));for(const f of ['../peterson6/math.js','task-graphs.js','check.js','models.js','data.js','app.js'])w.eval(fs.readFileSync(__dirname+'/'+f,'utf8'));const d=w.document;return {w,d,api:w.MakarychevApp,close:()=>w.close(),input(el,value){assert(el);el.value=String(value);el.dispatchEvent(new w.Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));},button(text){const b=Array.from(d.querySelectorAll('button')).find(b=>b.textContent===text);assert(b,text);b.click();},answer(value){this.input(d.querySelector('#final-answer'),value);d.querySelector('#answer-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));}};}
function begin(rt,value=0){rt.input(rt.d.querySelector('.m8-prediction select'),value);rt.button('Сохранить прогноз и исследовать');}
function numeric(rt,label,value){rt.input(Array.from(rt.d.querySelectorAll('#model input[type=number]')).find(el=>el.getAttribute('aria-label')===label+': точное значение'),value);}

test('all 51 topics have prediction, experiment and reason; none claims completion',()=>{const rt=boot();for(const lesson of rt.w.MakarychevCourse.lessons){const spec=models.experiment(lesson);assert(spec.question&&spec.challenge&&spec.explanation,lesson.id);assert(spec.options[spec.answer]);assert(spec.choices[spec.correct]);rt.w.history.replaceState(null,'','#lesson/'+lesson.id+'/0');rt.api.route();assert(rt.d.querySelector('.m8-prediction'));assert(rt.d.querySelector('.m8-reflection').hidden);assert.equal(rt.api.getState().tasks[lesson.tasks[0].id].correct,false);}rt.close();});

test('shifted rational formula, table, domain and asymptotes share exact parameters',()=>{
 for(const k of [-3,0,3])for(const a of [-2,0,2])for(const b of [-3,0,3]){assert.equal(math.functionValue('hyperbola',-a,k,b,a),null);assert.equal(math.functionValue('hyperbola',1-a,k,b,a),k+b);assert.equal(math.functionValue('hyperbola',-2-a,k,b,a),-k/2+b);}
 const rt=boot('#lesson/p08/0');assert(rt.d.querySelector('.m8-reflection').hidden);begin(rt,1);numeric(rt,'Коэффициент k',3);numeric(rt,'Свободный член b',2);numeric(rt,'Сдвиг в знаменателе a',2);assert.equal(rt.d.querySelectorAll('[data-asymptote]').length,2);assert.match(rt.d.querySelector('.m8-equation').textContent,/x \+ 2/);assert.match(rt.d.querySelector('.m8-result').textContent,/x ≠ −?[-]?2/);const rows=Array.from(rt.d.querySelectorAll('.m8-value-table tr')).map(r=>r.textContent);assert.deepEqual(rows,['xy','-40,5','-3-1','-2не определено','-15','03,5']);numeric(rt,'Коэффициент k',0);assert.equal(rt.d.querySelectorAll('[data-asymptote]').length,0);assert.match(rt.d.querySelector('.m8-result').textContent,/вертикальной асимптоты нет/);
 const graph=rt.d.querySelector('.m8-chart'),hole=graph.querySelector('circle[fill="#f7faf5"]');
 const grid=Array.from(graph.querySelectorAll('line[stroke="#e1e8df"]'));
 const coordinate=(line,attribute)=>Number(line.getAttribute(attribute));
 const vertical=grid.filter(line=>coordinate(line,'x1')===coordinate(line,'x2'));
 const horizontal=grid.filter(line=>coordinate(line,'y1')===coordinate(line,'y2'));
 const unitX=(coordinate(vertical[1],'x1')-coordinate(vertical[0],'x1'))/2;
 const unitY=(coordinate(horizontal[0],'y1')-coordinate(horizontal[1],'y1'))/2;
 assert(unitX>0);assert.equal(unitX,unitY,'a unit is the same length on both axes');
 const [xAxis,yAxis]=graph.querySelectorAll('line[stroke="#7f9486"]');
 assert.equal(Number(hole.getAttribute('cx')),coordinate(yAxis,'x1')-2*unitX);
 assert.equal(Number(hole.getAttribute('cy')),coordinate(xAxis,'y1')-2*unitY);
 rt.input(rt.d.querySelector('.m8-reflection select'),0);rt.button('Проверить объяснение');assert.match(rt.d.querySelector('.m8-reflection').textContent,/Объяснение верно/);const s=rt.api.getState(),record=s.tasks[rt.w.MakarychevCourse.lessons[7].tasks[0].id];assert(record.assisted);assert(!record.correct);assert(record.investigation.explained);const re=boot('#lesson/p08/0',s);assert.match(re.d.querySelector('.m8-result').textContent,/вертикальной асимптоты нет/);assert.equal(re.d.querySelectorAll('[data-asymptote]').length,0);assert(re.api.getState().tasks[rt.w.MakarychevCourse.lessons[7].tasks[0].id].investigation.explained);rt.close();re.close();
});

test('empty prediction and explanation before actual experiment cannot pass',()=>{const rt=boot('#lesson/p20/0');rt.button('Сохранить прогноз и исследовать');assert(rt.d.querySelector('.m8-reflection').hidden);begin(rt,1);rt.input(rt.d.querySelector('.m8-reflection select'),0);rt.button('Проверить объяснение');assert.match(rt.d.querySelector('.m8-reflection').textContent,/Сначала выполни опыт/);numeric(rt,'a — при x²',0);rt.button('Проверить объяснение');assert.match(rt.d.querySelector('.m8-reflection').textContent,/Объяснение верно/);rt.close();});

test('numeric entry changes only its own parameter and rejects invalid step without changing graph',()=>{const rt=boot('#lesson/p08/0');begin(rt,1);numeric(rt,'Коэффициент k',3);const nums=Array.from(rt.d.querySelectorAll('#model input[type=number]'));const before=nums.map(n=>n.value);numeric(rt,'Сдвиг в знаменателе a',1.5);assert.equal(nums[0].value,before[0]);assert.equal(nums[1].value,before[1]);assert.equal(nums[3].value,before[3]);const formula=rt.d.querySelector('.m8-equation').textContent;numeric(rt,'Коэффициент k',0.3);assert.equal(rt.d.querySelector('.m8-equation').textContent,formula);assert.equal(rt.api.getState().tasks[rt.w.MakarychevCourse.lessons[7].tasks[0].id].investigation.parameters[1],'3');rt.close();});

test('correction and help have separate history; new task is fresh and timestamps survive reload',()=>{const rt=boot('#lesson/p01/0'),task=rt.w.MakarychevCourse.lessons[0].tasks[0];rt.answer('1234567');rt.answer(task.answer);let rec=rt.api.getState().tasks[task.id];assert(!rec.independent);assert(!rec.assisted);assert.equal(rec.events.filter(e=>e.type==='answer').length,2);assert.match(rt.d.querySelector('.tag').textContent,/Исправлено/);rt.button('Новое условие без помощи →');assert.notEqual(rt.w.location.hash,'#lesson/p01/0');rt.api.route();assert(!rt.api.getState().tasks[rt.w.MakarychevCourse.lessons[0].tasks[1].id].correct);const re=boot('#lesson/p01/0',rt.api.getState());assert.equal(re.api.getState().tasks[task.id].completion.at,rec.completion.at);assert.match(re.d.querySelector('.learning-history').textContent,/1234567/);rt.close();re.close();});

test('all practice skill families retain first answer and help, without wiping accepted work',()=>{const rt=boot();for(const skill of rt.w.PetersonMath.skills){rt.w.history.replaceState(null,'','#practice/'+skill.id+'/1');rt.api.route();const seed=rt.api.getState().practice[skill.id+':1'].seed,t=rt.w.PetersonMath.generate(skill.id,seed,1);rt.answer('999999999');const wrong=rt.api.getState().tasks['practice:'+skill.id+':1:'+seed];assert.equal(wrong.events[0].value,'999999999');rt.d.querySelector('[data-action=hint]').click();rt.answer(t.answer);const done=rt.api.getState().tasks['practice:'+skill.id+':1:'+seed];assert(done.correct,skill.id);assert(done.assisted,skill.id);assert(!done.independent,skill.id);assert(done.events.some(e=>e.type==='hint'));assert(rt.d.querySelector('.learning-history'));}rt.close();});

test('bad optional evidence is bounded and cannot fabricate solved work',()=>{const rt=boot(),t=rt.w.MakarychevCourse.lessons[0].tasks[0],state=rt.api.getState();state.tasks[t.id]={value:'wrong',correct:true,independent:true,attempts:1,events:Array.from({length:80},()=>({type:'answer',value:'x'.repeat(3000),at:Date.now(),correct:true})),investigation:{started:true,explained:true,parameters:Array(20).fill('3'),prediction:900,observation:'z'.repeat(3000)}};const out=rt.api.validateState(state).tasks[t.id];assert(!out.correct);assert(!out.independent);assert.equal(out.events.length,40);assert.equal(out.events[0].value.length,1000);assert.equal(out.investigation.parameters.length,8);assert(!('prediction'in out.investigation));assert.equal(out.investigation.observation.length,2000);assert.deepEqual(JSON.parse(JSON.stringify(rt.api.validateState(rt.api.validateState(state)))),JSON.parse(JSON.stringify(rt.api.validateState(state))));rt.close();});

test('legacy provenance stays unknown through two reloads and model actions cannot erase first answer',()=>{const rt=boot(),task=rt.w.MakarychevCourse.lessons[0].tasks[0],state=rt.api.getState();state.tasks[task.id]={value:task.answer,correct:true,independent:true,attempts:1};let safe=rt.api.validateState(state);safe=rt.api.validateState(safe);assert(!safe.tasks[task.id].independent);assert.equal(safe.tasks[task.id].provenanceKnown,false);const legacy=boot('#lesson/p01/0',safe);assert.match(legacy.d.querySelector('.tag').textContent,/неизвестен/);legacy.close();rt.w.history.replaceState(null,'','#lesson/p01/0');rt.api.route();rt.answer('123');begin(rt,0);for(let i=0;i<45;i++)numeric(rt,'Значение x',i%2?2:3);const kept=rt.api.getState().tasks[task.id];assert.equal(kept.events.length,40);assert.equal(kept.firstAttempt.value,'123');const re=boot('#lesson/p01/0',rt.api.getState());assert.equal(re.api.getState().tasks[task.id].firstAttempt.value,'123');rt.close();re.close();});

test('delayed review clears after a new independent success and uses five days',()=>{const rt=boot(),lesson=rt.w.MakarychevCourse.lessons[0],state=rt.api.getState(),now=Date.now();function done(t,at){return {value:t.answer,correct:true,independent:true,attempts:1,assisted:false,completion:{attempts:1,assisted:false,independent:true,at}};}state.tasks[lesson.tasks[0].id]=done(lesson.tasks[0],now-6*86400000);let re=boot('#progress',state);assert.match(re.d.querySelector('main').textContent,/5 дней/);assert(re.d.querySelector('a[href="#lesson/p01/1"]'));re.close();state.tasks[lesson.tasks[1].id]=done(lesson.tasks[1],now-86400000);re=boot('#progress',state);assert(!re.d.querySelector('a[href="#lesson/p01/2"]'),'recent new success postpones repeat');re.close();rt.close();});

test('embedded demonstration never reads or overwrites personal progress',()=>{const outer=new JSDOM('<iframe></iframe>',{url:'https://m8.test/',runScripts:'outside-only',pretendToBeVisual:true}),w=outer.window.document.querySelector('iframe').contentWindow;const key='mathexam.makarychev8.2024.v1',sentinel='{"version":1,"tasks":{"private-draft":{"note":"keep me"}},"practice":{}}';outer.window.localStorage.setItem(key,sentinel);w.document.open();w.document.write(fs.readFileSync(__dirname+'/index.html','utf8'));w.document.close();w.scrollTo=()=>{};for(const f of ['../peterson6/math.js','task-graphs.js','check.js','models.js','data.js','app.js'])w.eval(fs.readFileSync(__dirname+'/'+f,'utf8'));assert.match(w.document.querySelector('#storage-warning').textContent,/личный прогресс не меняется/);assert(!w.MakarychevApp.getState().tasks['private-draft']);w.location.hash='#lesson/p01/0';w.MakarychevApp.route();const t=w.MakarychevCourse.lessons[0].tasks[0],input=w.document.querySelector('#final-answer');input.value=t.answer;input.dispatchEvent(new w.Event('input',{bubbles:true}));w.document.querySelector('#answer-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));assert(w.MakarychevApp.getState().tasks[t.id].correct);assert.equal(outer.window.localStorage.getItem(key),sentinel);outer.window.close();});

test('malformed numeric final submissions do not consume the first mathematical attempt',()=>{const rt=boot('#lesson/p01/0'),t=rt.w.MakarychevCourse.lessons[0].tasks[0];for(const value of ['abc','1/']){rt.answer(value);const saved=rt.api.getState().tasks[t.id];assert.equal(saved.attempts,0);assert.equal(saved.firstAttempt,null);assert.equal(saved.events.filter(e=>e.type==='answer').length,0);assert.match(rt.d.querySelector('#answer-form').textContent,/уточнение записи/);}rt.answer(t.answer);assert(rt.api.getState().tasks[t.id].independent);assert.equal(rt.api.getState().tasks[t.id].attempts,1);rt.close();});

test('requested numeric representation can be corrected without mathematical penalty',()=>{const rt=boot('#practice/fraction-to-decimal/1'),seed=rt.api.getState().practice['fraction-to-decimal:1'].seed,t=rt.w.PetersonMath.generate('fraction-to-decimal',seed,1),fraction=rt.w.PetersonMath.answer(t.answer);rt.answer(fraction);let rec=rt.api.getState().tasks['practice:fraction-to-decimal:1:'+seed];assert.equal(rec.attempts,0);assert.equal(rec.firstAttempt,null);rt.answer(t.answer);rec=rt.api.getState().tasks['practice:fraction-to-decimal:1:'+seed];assert(rec.independent);assert.equal(rec.attempts,1);rt.close();});

test('malformed guided step keeps prior work and does not create a mathematical step attempt',()=>{const rt=boot('#lesson/p01/0'),t=rt.w.MakarychevCourse.lessons[0].tasks[0];rt.d.querySelector('[data-action=guided]').click();for(const value of ['abc','1/']){rt.input(rt.d.querySelector('[data-step-input="0"]'),value);rt.d.querySelector('[data-step-form="0"]').dispatchEvent(new rt.w.Event('submit',{bubbles:true,cancelable:true}));const rec=rt.api.getState().tasks[t.id];assert.equal(rec.step,0);assert.equal(rec.stepAttempts[0],undefined);assert.equal(rec.events.filter(e=>e.type==='step').length,0);}rt.input(rt.d.querySelector('[data-step-input="0"]'),t.steps[0].answer);rt.d.querySelector('[data-step-form="0"]').dispatchEvent(new rt.w.Event('submit',{bubbles:true,cancelable:true}));const rec=rt.api.getState().tasks[t.id];assert.equal(rec.step,1);assert.equal(rec.stepAttempts[0],1);assert.equal(rec.events.filter(e=>e.type==='step').length,1);rt.close();});

test('valid graph no-hole token is a mathematical attempt, not a format error',()=>{const rt=boot(),lesson=rt.w.MakarychevCourse.lessons.find(l=>l.id==='p02'),index=lesson.tasks.findIndex(t=>t.id==='p02-ex038-а'),task=lesson.tasks[index];assert(index>=0);rt.w.history.replaceState(null,'','#lesson/p02/'+index);rt.api.route();rt.answer('0,5;-2,5; НЕТ ');let rec=rt.api.getState().tasks[task.id];assert(!rec.correct);assert.equal(rec.attempts,1);assert.equal(rec.firstAttempt.value,'0,5;-2,5; НЕТ ');assert.equal(rec.firstAttempt.correct,false);assert.equal(rec.events.filter(e=>e.type==='answer').length,1);rt.answer(task.answer);rec=rt.api.getState().tasks[task.id];assert(rec.correct);assert.equal(rec.attempts,2);assert(!rec.independent);assert.equal(rec.firstAttempt.value,'0,5;-2,5; НЕТ ');rt.close();});

test('graph parser readable rational coefficients retain mathematical attempt history',()=>{const rt=boot(),lesson=rt.w.MakarychevCourse.lessons.find(l=>l.id==='p04'),index=lesson.tasks.findIndex(t=>t.id==='p04-ex108-графики'),task=lesson.tasks[index];assert(index>=0);rt.w.history.replaceState(null,'','#lesson/p04/'+index);rt.api.route();const value='4/-1;1;2;3';assert(rt.w.MakarychevTaskGraphs.parsePair(value));rt.answer(value);let rec=rt.api.getState().tasks[task.id];assert(!rec.correct);assert.equal(rec.attempts,1);assert.equal(rec.firstAttempt.value,value);rt.answer(task.answer);rec=rt.api.getState().tasks[task.id];assert(rec.correct);assert.equal(rec.attempts,2);assert(!rec.independent);rt.close();});

test('an unfinished graph tuple remains a format correction before the first answer',()=>{const rt=boot(),lesson=rt.w.MakarychevCourse.lessons.find(l=>l.id==='p02'),index=lesson.tasks.findIndex(t=>t.id==='p02-ex038-а'),task=lesson.tasks[index];rt.w.history.replaceState(null,'','#lesson/p02/'+index);rt.api.route();rt.answer('0,5;-2,5');assert.equal(rt.api.getState().tasks[task.id].attempts,0);rt.answer(task.answer);assert(rt.api.getState().tasks[task.id].independent);rt.close();});

test('square equation shows two, one or no points and distinguishes exact and approximate roots', () => {
 const rt=boot('#lesson/p12/0');
 begin(rt,0);
 const points=()=>rt.d.querySelectorAll('#model svg circle').length;
 const result=()=>rt.d.querySelector('#model .m8-result').textContent;
 numeric(rt,'Правая часть a',9);
 assert.equal(points(),2);assert.match(result(),/x₁ = [-−]3, x₂ = 3/);
 numeric(rt,'Правая часть a',5);
 assert.equal(points(),2);assert.match(result(),/x₁ = −√5 ≈ [-−]2,236, x₂ = √5 ≈ 2,236/);
 numeric(rt,'Правая часть a',0);
 assert.equal(points(),1);assert.match(result(),/Один корень: x = 0/);
 numeric(rt,'Правая часть a',-4);
 assert.equal(points(),0);assert.match(result(),/Действительных корней нет/);
 const restored=boot('#lesson/p12/0',rt.api.getState());
 assert.match(restored.d.querySelector('#model .m8-result').textContent,/Действительных корней нет/);
 restored.close();rt.close();
});

test('square of a signed base gives its absolute value on both sides of zero', () => {
 const rt=boot('#lesson/p16/0');begin(rt,1);
 for(const a of [-3,0,3]){
  numeric(rt,'Число a',a);
  assert(rt.d.querySelector('#model .m8-equation').textContent.endsWith('= '+Math.abs(a)));
 }
 rt.close();
});

test('a pupil can keep a correct root, then complete the set using plus-minus notation', () => {
 const rt=boot('#lesson/p12/0');
 rt.answer('6');
 let task=rt.api.getState().tasks['p12-t01'];
 assert.equal(task.attempts,1);assert.match(task.feedback,/Это число подходит/);
 rt.answer('±5');
 task=rt.api.getState().tasks['p12-t01'];assert.equal(task.attempts,2);assert(!task.correct);
 rt.answer('±6');
 task=rt.api.getState().tasks['p12-t01'];assert(task.correct);assert(!task.independent);assert.equal(task.firstAttempt.value,'6');
 const restored=boot('#lesson/p12/0',rt.api.getState());
 assert(restored.api.getState().tasks['p12-t01'].correct);
 restored.close();rt.close();
});

test('a plus-minus pair for an arithmetic root is a mathematical misconception', () => {
 const rt=boot('#lesson/p11/0');
 rt.answer('±9');
 const task=rt.api.getState().tasks['p11-t01'];
 assert(!task.correct);assert.equal(task.attempts,1);assert.match(task.feedback,/Знак √ обозначает одно неотрицательное значение/);
 rt.answer('9');assert(rt.api.getState().tasks['p11-t01'].correct);
 rt.close();
});

test('saved roots with a trailing delimiter keep their original completion', () => {
 const rt=boot('#lesson/p12/0'),state=rt.api.getState();
 state.tasks['p12-t01']={value:'{−6;6;}',correct:true,attempts:1,assisted:false,independent:true,
  completion:{at:Date.now()-1000,attempts:1,assisted:false,independent:true}};
 const restored=boot('#lesson/p12/0',state),record=restored.api.getState().tasks['p12-t01'];
 assert(record.correct);assert(record.independent);assert.equal(record.value,'{−6;6;}');assert.equal(record.attempts,1);
 restored.close();rt.close();
});

test('the unknown in a square-root equation has no assumed sign', () => {
 const rt=boot('#lesson/p11/4');
 rt.answer('±8');
 const task=rt.api.getState().tasks['p11-t05'];
 assert.equal(task.attempts,1);assert.match(task.feedback,/Проверь каждое из них по условию/);
 assert.doesNotMatch(task.feedback,/неотрицательн/);
 rt.close();
});

test('both reciprocal graphs use one x and retain their shared investigation', () => {
 const rt=boot('#lesson/p51/5');
 const id='p51-t06';
 try {
  begin(rt,0);
  const [power,abscissa]=rt.d.querySelectorAll('#model .m8-controls select');
  const graph=() => rt.d.querySelector('#model .m8-chart');
  rt.input(power,'-2');
  for (const x of [-2,-1,-0.5,0,0.5,1,2]) {
   rt.input(abscissa,x);
   const round=graph().querySelector('[data-reciprocal-value]');
   const square=graph().querySelector('[data-square-reciprocal-value]');
   assert.equal(graph().querySelectorAll('path').length,4,'four disjoint branches');
   if (x===0) {
    assert.equal(round,null);
    assert.equal(square,null);
    assert.match(rt.d.querySelector('.m8-result').textContent,/ноль в знаменателе/);
    continue;
   }
   assert.equal(Number(round.dataset.reciprocalValue),1/x);
   assert.equal(Number(square.dataset.squareReciprocalValue),1/(x*x));
   assert.equal(Number(round.getAttribute('cx')),Number(square.getAttribute('x'))+3);
   assert.equal(Math.sign(Number(square.getAttribute('y'))+3-Number(round.getAttribute('cy'))),Math.sign(1/x-1/(x*x)));
  }
  rt.input(abscissa,'-0.5');
  const state=rt.api.getState();
  assert.equal(state.tasks[id].correct,false,'exploring records no mastery');
  const restored=boot('#lesson/p51/5',state);
  try {
   assert.deepEqual(Array.from(restored.d.querySelectorAll('#model .m8-controls select'),s=>s.value),['-2','-0.5']);
   assert.match(restored.d.querySelector('.m8-result').textContent,/Квадрат выше круга/);
  } finally { restored.close(); }
  state.tasks[id].investigation.parameters=['-2'];
  const legacy=boot('#lesson/p51/5',state);
  try {
   assert.deepEqual(Array.from(legacy.d.querySelectorAll('#model .m8-controls select'),s=>s.value),['-2','1']);
  } finally { legacy.close(); }
 } finally { rt.close(); }
});

test('the number finder and course overview describe the reviewed range consistently',()=>{
 const rt=boot('#home');
 assert.match(rt.d.getElementById('number-form').closest('section').textContent,/Все подпункты №1–630 имеют разбор/);
 const overview=Array.from(rt.d.querySelectorAll('details')).find(el=>el.querySelector('summary')?.textContent==='Как устроен курс');
 assert.match(overview.textContent,/№1–630 разобраны полностью/);
 assert.match(rt.d.querySelector('#chapter-1 .chapter-coverage').textContent,/№1–267/);
 assert.match(rt.d.querySelector('#chapter-2 .chapter-coverage').textContent,/№268–509/);
});

test('incomplete quadratic practice covers each real-root case on new numbers and all equivalent signed radicals',()=>{
 const checker=require('./check.js'), model=require('./models.js');
 for(const [user,expected] of [['±sqrt(1/3)','-√3/3;√3/3'],['±1/√3','-√3/3;√3/3'],
   ['±√(3/2)','-√6/2;√6/2'],['-sqrt(2.4);sqrt(2.4)','-2√15/5;2√15/5'],['±√12,6','-3√35/5;3√35/5']]){
  assert(checker.check(user,{kind:'set',answer:expected}));
 }
 for(const wrong of ['±√3/2','±√(-1/3)','0.57735;-0.57735','±sqrt(1/0)','±√','±√3/0','√3/3']){
  assert(!checker.check(wrong,{kind:'set',answer:'-√3/3;√3/3'}));
 }
 for(const signs of [[false,false],[true,false],[false,true]]){
  const q={kind:'incomplete-coefficients',hasLinear:signs[0],hasConstant:signs[1]};
  for(const a of [-3,0,2])for(const b of [-1,0,3])for(const c of [-4,0,2]){
   assert.equal(checker.check([a,b,c].join(';'),q),a!==0&&(b!==0)===signs[0]&&(c!==0)===signs[1]);
  }
 }
 for(const level of [1,2,3]){
  let previous='';
  for(let seed=1;seed<=45;seed++){
   const q=model.practiceQuadratic(seed,level),match=/Реши (\d+)x²(?: ([−+]) (\d+)(x?))? = 0/.exec(q.prompt);
   assert(match);assert.notEqual(q.prompt,previous);previous=q.prompt;
   const a=Number(match[1]),b=match[4]?Number(match[3])*(match[2]==='−'?-1:1):0,c=match[4]||!match[3]?0:Number(match[3])*(match[2]==='−'?-1:1);
   const disc=b*b-4*a*c;
   const roots=disc<0?'нет':[...new Set([(-b-Math.sqrt(disc))/(2*a),(-b+Math.sqrt(disc))/(2*a)])].join(';');
   assert(checker.check(roots,q));
   assert.deepEqual(model.practiceQuadratic(seed,level),q);
  }
 }
});

test('quadratic formula accepts exactly equivalent radical pairs, while simplification still requires reduced terms',()=>{
 const C=require('./check.js'), model=require('./models.js');
 for(const [answer,user] of [
  ['(3-√29)/2;(3+√29)/2','(6±2sqrt(29))/4'],
  ['(10-√2)/7;(10+√2)/7','10/7+sqrt(2)/7;10/7-sqrt(2)/7'],
  ['-3-2√7;-3+2√7','-3±sqrt(28)'],
  ['1;4/3','1 1/3;1'],['17','17'],['нет','∅']
 ])assert(C.check(user,{kind:'quadratic-roots',answer}),user);
 const pair={kind:'quadratic-roots',answer:'(3-√29)/2;(3+√29)/2'};
 for(const value of ['(3±√28)/2','(3±√29)/4','(3±√29)/0','3/2;3/2','(3+√29)/2','(3±√29','-1.19258;4.19258','(3±√(-29))/2','±±3'])assert(!C.check(value,pair));
 assert(C.check('√8+√2',{kind:'radical-value',answer:'3√2'}));
 assert(!C.check('√8+√2',{kind:'radical-value',answer:'3√2',requireSimplified:true}));
 assert(!C.check('2+3√20/2',{kind:'radical-value',answer:'2+3√5',requireSimplified:true}));
 assert(C.check('3*sqrt(5)+2',{kind:'radical-value',answer:'2+3√5',requireSimplified:true}));
 for(const level of [1,2,3]){
  let prior='';
  for(let seed=1;seed<=40;seed++){
   const task=model.practiceFormula(seed,level),[a,b,c]=task.quadraticCoefficients;
   const d=b*b-4*a*c;assert.equal(d,Number(task.steps[1].answer));
   assert(C.check(task.answer,task));assert.notEqual(task.prompt,prior);prior=task.prompt;
   const values=C.quadraticEntries(task.answer);assert.equal(values.length,d<0?0:d===0?1:2);
   for(const value of values){
    const number=C.radicalSum(value).reduce((total,t)=>total+t.sign*Math.sqrt(Number(t.n)/Number(t.d)),0);
    assert(Math.abs(a*number*number+b*number+c)<1e-8);
   }
  }
 }
});

test('new applied conditions have the stated physical answers at each difficulty',()=>{
 const {practiceStory}=require('./models.js');
 const checker=require('./check.js');
 for(const level of [1,2,3]){
  const prompts=new Set();
  for(let seed=0;seed<37;seed++){
   const q=practiceStory(seed,level);prompts.add(q.prompt);
   const fields=Array.from(q.prompt.matchAll(/\d+/g),m=>Number(m[0]));
   if(level===1){
    const [area,difference]=fields,side=(Math.sqrt(difference**2+4*area)-difference)/2;
    assert.equal(Number(q.answer),2*(2*side+difference));
   }else if(level===2){
    assert.equal(Number(q.answer)*(Number(q.answer)-1)/2,fields[0]);
   }else{
    const [perimeter,difference]=fields,short=(perimeter/2-difference)/2;
    assert.equal(Number(q.answer),short*(short+difference));
   }
   assert(q.steps.every(step=>checker.check(step.answer,step)));
  }
  assert(prompts.size>=12);
 }
});

test('Vieta practice recovers the coefficients from both new roots',()=>{
 const {practiceVieta}=require('./models.js'),checker=require('./check.js');
 for(const level of [1,2,3]){
  const prompts=new Set();
  for(let seed=0;seed<40;seed++){
   const task=practiceVieta(seed,level);prompts.add(task.prompt);
   const [a,c]=task.steps[0].answer.split(';').map(Number),[p,q]=task.answer.split(';').map(Number);
   if(level===1){assert.equal(a,1);assert.equal(q,c);assert(p*p-4*q>=0);}
   if(level===2){assert.equal(p*q,c/a);assert(p!==q);}
   if(level===3){
    const given=Number(task.prompt.match(/равен (-?\d+)/)[1]);
    assert.equal(given*p,c/a);assert.equal(given+p,-q/a);
   }
   assert(checker.check(task.answer,task));
   assert(task.steps.every(step=>checker.check(step.answer,step)));
  }
  assert(prompts.size>=15);
 }
});

test('trinomial practice, factored form, common scalar and expanded correction',()=>{
 const {practiceTrinomial}=require('./models.js'),c=require('./check.js');
 for(const level of [1,2,3]){
  const prompts=new Set();
  for(let seed=0;seed<35;seed++){
   const task=practiceTrinomial(seed,level);prompts.add(task.prompt);
   const {a,h,k}=task.graph;assert.deepEqual(task.answer.split(';').map(Number),level===3?[h,k]:[a,h,k]);
   assert.equal(Number(task.steps[0].answer),a);assert.equal(Number(task.steps[1].answer),-2*a*h);
   assert(c.check(task.answer,task));
  }
  assert(prompts.size>=16);
 }
 const expected='(a+3)*(b-5)';
 for(const candidate of ['(a+3)(b-5)','(b-5)(3+a)','-(5-b)(a+3)','(2a+6)(b/2-5/2)','((3+a)(b-5))'])assert.equal(c.factoredPair(candidate,expected),'factored');
 for(const candidate of ['ab+3b-5a-15','1*(ab+3b-5a-15)','(ab+3b-5a-15)(1)'])assert.equal(c.factoredPair(candidate,expected),'expanded');
 assert.equal(c.factoredPair('(a-3)(b-5)',expected),'different');
});

test('factor forms allow multiplicity, scalar positions and both families of free examples',()=>{
 const {practiceFactors}=require('./models.js'),c=require('./check.js');
 for(const level of [1,2,3]){
  const prompts=new Set();
  for(let seed=0;seed<40;seed++){
   const task=practiceFactors(seed,level);prompts.add(task.prompt);assert(c.check(task.answer,task));
   assert(task.steps.every(step=>c.check(step.answer,step)));
  }
  assert(prompts.size>=12);
 }
 for(const n of [1,2,7,99,100001]){
  assert.equal(c.progressionFactors([n,3*n,2*n,n+'(x+1)(x+2)'].join(';')),'factored');
  assert.equal(c.progressionFactors([2*n,3*n,n,n+'(2x+1)(x+1)'].join(';')),'factored');
 }
 assert.equal(c.progressionFactors('3;6;9;(3x+3)(x+3)'),'roots');
 assert.equal(c.progressionFactors('6;9;3;6x^2+9x+3'),'expanded');
 assert.equal(c.progressionFactors('6;10;3;6(x+1)^2'),'ratio');
 assert.equal(c.factoredPair('(1/6)(1+x)(x+2)','(x+1)(x+2)/6'),'factored');
 assert.equal(c.factoredPair('2(2a-b)(a^2-b^2)','2(2a-b)(a-b)(a+b)',3),'expanded');
});

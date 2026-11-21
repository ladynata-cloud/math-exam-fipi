'use strict';
// Actual event handlers in an in-memory DOM. Browser visual review is separate.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {test}=require('node:test'),{JSDOM}=require('jsdom');
const KEY='mathexam.peterson6.part1.v1',copy=v=>JSON.parse(JSON.stringify(v));
function fixture(saved,help,realCourse=false){
 const errors=[],dom=new JSDOM(fs.readFileSync(path.join(__dirname,'index.html'),'utf8'),{url:'https://peterson.test/',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,d=w.document;
 w.scrollTo=()=>{};w.console.error=(...v)=>errors.push(v.join(' '));
 for(const f of ['math.js','continuation-models.js','models.js','data.js'])w.eval(fs.readFileSync(path.join(__dirname,f),'utf8'));
 // Isolated authored fixture exercises the public continuation contract while real content is verified in test-ui.
 const task={id:'p15-ui-manual',kind:'manual',title:'Построение',prompt:'Объясни, почему a/b = (3 · 2)/(4 · 2).',answer:'',finalLabel:'Запиши объяснение равенства.',skills:['fraction-multiply'],hint:'Вспомни основное свойство дроби.',steps:[{kind:'number',prompt:'Сколько будет 3 · 2?',answer:'6'},{kind:'instruction',prompt:'Запиши равенство отношений.'},{kind:'instruction',prompt:'Объясни, почему знаменатель не равен нулю.'}],source:{type:'textbook',part:2,number:'1',page:3,reference:'№ 1'},figure:{type:'line',min:-3,max:3,points:[{name:'A',x:1}],caption:'Исходный чертёж'}};
 const lesson={id:'p15',part:2,order:15,title:'Тест продолжения',chapter:'Отношения',page:3,sourceRange:'1–2',model:'continuation',theory:[{title:'Правило',text:'a/b = (a · 2)/(b · 2)'}],skills:['fraction-multiply'],tasks:[task,{...copy(task),id:'p15-ui-second'}]};
 if(!realCourse)w.PetersonCourse.lessons=w.PetersonCourse.lessons.filter(l=>l.id!=='p15').concat(lesson);
 if(saved)w.localStorage.setItem(KEY,JSON.stringify(saved));if(help)w.localStorage.setItem(KEY+'.help',JSON.stringify(help));
 w.eval(fs.readFileSync(path.join(__dirname,'app.js'),'utf8'));
 const q=s=>{const n=d.querySelector(s);assert(n,'Missing '+s);return n;},state=()=>copy(w.PetersonApp.getState());
 const nav=h=>{w.history.replaceState(null,'',h);w.PetersonApp.route();assert(!d.querySelector('.error-page'));};
 const event=(s,value,type='input')=>{const n=q(s);n.value=value;n.dispatchEvent(new w.Event(type,{bubbles:true}));};
 const click=s=>q(s).click(),submit=s=>q(s).dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 const settle=()=>new Promise(r=>w.setTimeout(r,15));
 const close=()=>{assert.deepEqual(errors,[]);dom.window.close();};
 async function importData(data){nav('#progress');await q('#import-file').onchange({target:{files:[{size:JSON.stringify(data).length,text:async()=>JSON.stringify(data)}]}});}
 return {w,d,q,state,nav,event,click,submit,settle,close,importData};
}

test('source ratios and brackets diagnose the entered error and restore the work',async()=>{
 const f=fixture(null,null,true);
 try {
  const numeric=(route,value,expected)=>{
   f.nav(route); f.event('#final-answer',value); f.submit('#answer-form');
   assert.match(f.q('.answer-form .feedback').textContent,expected);
  };
  numeric('#lesson/p15/0','2',/обратном порядке/);
  assert.equal(f.state().tasks['p15-t01'].assisted,false);
  assert.equal(f.state().tasks['p15-t01'].correct,false);
  assert.equal(f.d.querySelectorAll('meter').length,0);
  f.event('#final-answer','15/30');assert.equal(f.q('.answer-form .feedback').textContent,'');
  f.submit('#answer-form');assert.match(f.q('.answer-form .feedback').textContent,/Значение верно.*общий делитель/);
  f.event('#final-answer','1/2');f.submit('#answer-form');
  assert.match(f.q('.task-heading').textContent,/Исправлено без подсказки/);
  assert.equal(f.state().tasks['p15-t01'].independent,false);
  numeric('#lesson/p15/1','7/3',/обратном порядке/);
  numeric('#lesson/p15/2','0,8',/нашёл долю/);
  numeric('#lesson/p15/4','250',/единицы/);
  f.click('[data-action="hint"]');
  assert.deepEqual([...f.d.querySelectorAll('.help meter')].map(m=>[m.value,m.max]),[[8,32],[32,32]]);
  assert.equal(f.state().tasks['p15-t05'].assisted,true);
  numeric('#lesson/p15/5','300',/и часы, и минуты/);
  f.nav('#lesson/p15/3');f.click('[data-choice="1"]');f.submit('#answer-form');
  assert.match(f.q('.answer-form .feedback').textContent,/порядок двух результатов/);
  f.click('[data-choice="2"]');f.submit('#answer-form');
  assert.match(f.q('.answer-form .feedback').textContent,/оба отношения/);
  f.nav('#lesson/p33/0');f.click('[data-choice="2"]');f.submit('#answer-form');
  assert.match(f.q('.answer-form .feedback').textContent,/второго слагаемого/);
  f.click('[data-action="hint"]');assert.match(f.q('.help figure').textContent,/−1 × \(a\) и −1 × \(−b\)/);
  f.click('[data-action="detour"][data-skill="bracket-evaluate"]');await f.settle();
  assert.equal(f.w.location.hash,'#practice/bracket-evaluate/1');
  const first=f.q('.prompt').textContent;f.click('[data-action="new"]');assert.notEqual(f.q('.prompt').textContent,first);
  f.click('[data-action="return"]');await f.settle();
  assert.equal(f.w.location.hash,'#lesson/p33/0');
  assert.match(f.q('.answer-form .feedback').textContent,/второго слагаемого/);
  f.click('[data-choice="0"]');f.submit('#answer-form');
  f.click('[data-action="independent-check"]');await f.settle();
  assert.equal(f.w.location.hash,'#check/bracket-evaluate/1');
  assert.equal(f.d.querySelector('[data-action="hint"]'),null);
  numeric('#lesson/p33/1','-19,73',/последнее слагаемое/);
  numeric('#lesson/p33/1','5,17',/знак перед всеми скобками/);
  f.nav('#lesson/p33/2');f.click('[data-choice="0"]');f.submit('#answer-form');
  assert.match(f.q('.answer-form .feedback').textContent,/постоянную часть/);
  numeric('#lesson/p33/3','-14',/постоянную часть/);
  const restored=fixture(f.state(),null,true);
  try {restored.nav('#lesson/p33/3');assert.match(restored.q('.answer-form .feedback').textContent,/постоянную часть/);}
  finally {restored.close();}
 } finally {f.close();}
});

test('numbered applications distinguish part from whole and a rate from its reciprocal',async()=>{
 const f=fixture(null,null,true);
 try {
  f.nav('#lesson/p15/9');
  f.event('#final-answer','2,5');f.submit('#answer-form');
  assert.match(f.q('.answer-form .feedback').textContent,/массу воды/);
  assert.equal(f.state().tasks['p15-t10'].correct,false);
  f.click('[data-action="hint"]');
  assert.match(f.q('.help figure').textContent,/масса воды \+ масса соли/);
  f.event('#final-answer','100/41');f.submit('#answer-form');
  assert.equal(f.state().tasks['p15-t10'].correct,true);
  assert.equal(f.state().tasks['p15-t10'].assisted,true);
  f.click('[data-action="independent-check"]');await f.settle();
  assert.equal(f.w.location.hash,'#check/percent-ratio/1');
  f.nav('#lesson/p15/6');f.event('#final-answer','9');f.submit('#answer-form');
  assert.match(f.q('.answer-form .feedback').textContent,/без всходов/);
  f.event('#final-answer','91');f.submit('#answer-form');
  assert.match(f.q('.task-heading').textContent,/Исправлено без подсказки/);
  f.nav('#lesson/p15/11');f.click('[data-choice="0"]');f.submit('#answer-form');
  assert.match(f.q('.answer-form .feedback').textContent,/обратный вопрос/);
  f.click('[data-action="hint"]');assert.match(f.q('.help figure').textContent,/4 м.*2 мин/);
  f.click('[data-choice="1"]');f.submit('#answer-form');
  assert.equal(f.state().tasks['p15-t12'].correct,true);
  f.click('#problem [data-action="task"][data-index="12"]');await f.settle();
  assert.equal(f.w.location.hash,'#lesson/p15/12');
  assert.equal(f.state().tasks['p15-t13'].correct,false);
  f.nav('#home');
  f.event('#book-part','2','change');f.event('#exercise-number','11');f.submit('#number-form');
  assert.equal(f.d.querySelectorAll('#number-result a[href^="#lesson/p15/"]').length,6);
 } finally {f.close();}
});

test('source equations retain a signed correction and the comparison of sides',async()=>{
 const f=fixture(null,null,true);
 try{
  f.nav('#lesson/p33/15');
  f.event('#final-answer','-3,6');f.submit('#answer-form');
  assert.match(f.q('.answer-form .feedback').textContent,/для −k/);
  f.event('#final-answer','3,6');f.submit('#answer-form');
  assert.match(f.q('.task-heading').textContent,/Исправлено без подсказки/);
  f.nav('#lesson/p33/17');
  f.event('#final-answer','17,3');f.submit('#answer-form');
  assert.match(f.q('.answer-form .feedback').textContent,/большая/);
  f.click('[data-action="hint"]');assert.match(f.q('.help figure').textContent,/y см и ещё 1,9 см/);
  f.event('#final-answer','15,4');f.submit('#answer-form');
  assert.equal(f.state().tasks['p33-t18'].assisted,true);
  f.click('#problem [data-action="task"][data-index="16"]');await f.settle();
  assert.equal(f.w.location.hash,'#lesson/p33/16');
  assert.match(f.q('.prompt').textContent,/конкурс/);
 }finally{f.close();}
});

test('segment construction measures AC and CB on one scale without assigning credit',async()=>{
 const f=fixture(null,null,true);
 try{
  for(const [i,valid] of [[17,[6]],[18,[7,8,9,10,11]],[19,[0,1,2,3,4,5]],[20,[8]]]){
   f.nav('#lesson/p15/'+i);
   const model=f.q('[data-lesson-help="model"]');if(!model.open)f.click('[data-lesson-help="model"] > summary');
   for(let position=0;position<=12;position++){
    f.event('#model select',String(position),'change');
    const text=f.q('#model .pm-result').textContent;
    if(position===12)assert.match(text,/не определено/);
    else{
     assert.equal(text.includes('положение подходит для'),valid.includes(position));
     assert.match(text,new RegExp('AC = '+position+', CB = '+(12-position)));
    }
    assert.equal(f.q('#model svg circle').getAttribute('cx'),String(24+26*position));
   }
   assert.equal(f.d.querySelector('#answer-form'),null);
   assert.equal(f.state().tasks['p15-t'+(i+1)].correct,false);
  }
  f.event('#model select','8','change');
  f.event('#notebook','Взял отрезок 12 см. AC = 8 см, CB = 4 см.');
  f.click('[data-action="record-manual"]');
  const saved=f.state(),g=fixture(saved,null,true);
  try{g.nav('#lesson/p15/20');assert.equal(g.q('#model select').value,'8');assert.match(g.q('#notebook').value,/8 см/);
   assert.equal(g.state().tasks['p15-t21'].correct,false);
  }finally{g.close();}
 }finally{f.close();}
});

test('ratio constructions preserve scale, right angles and the angular partition',()=>{
 const f=fixture(null,null,true);
 try {
  for(const [index,kind] of ['segments','rectangle','triangle','angle'].entries()) {
   const number=21+index;
   f.nav('#lesson/p15/'+number);
   const model=f.q('[data-lesson-help="model"]');
   if(!model.open)f.click('[data-lesson-help="model"] > summary');
   for(const value of (kind==='angle'?[0,10,20,30,40,50,60]:[1,2,3])) {
    f.event('#model select',String(value),'change');
    const diagram=f.q('#model svg'),feedback=f.q('#model .pm-result').textContent;
    if(kind==='segments') {
     const lines=[...diagram.querySelectorAll('line')].filter(line=>line.getAttribute('x1')!==line.getAttribute('x2'));
     const lengths=lines.map(line=>Number(line.getAttribute('x2'))-Number(line.getAttribute('x1')));
     assert.deepEqual(lengths,[34*value,51*value]);
    } else if(kind==='rectangle') {
     const side=diagram.querySelector('rect');
     assert.equal(Number(side.getAttribute('width')),85*value);
     assert.equal(Number(side.getAttribute('height')),51*value);
    } else if(kind==='triangle') {
     const [p,q,r]=diagram.querySelector('polygon').getAttribute('points').split(' ').map(pair=>pair.split(',').map(Number));
     assert.equal(p[1],q[1]);assert.equal(p[0],r[0]);
     assert.equal(Math.hypot(q[0]-r[0],q[1]-r[1]),85*value);
     assert.match(feedback,/Короткий катет.*Длинный катет/);
    } else {
     const ray=diagram.querySelector('line[stroke-dasharray]');
     const radians=Math.atan2(199-Number(ray.getAttribute('y2')),Number(ray.getAttribute('x2'))-47);
     assert(Math.abs(radians*180/Math.PI-value)<1e-9);
     if(value===0||value===60)assert.match(feedback,/совпал со стороной/);
     else if(value===20||value===40)assert.match(feedback,/часть занимает одну долю/);
     else assert.match(feedback,/больший угол должен быть/);
    }
    assert.equal(f.d.querySelector('#answer-form'),null);
    assert.equal(f.state().tasks['p15-t'+(number+1)].correct,false);
   }
  }
 } finally { f.close(); }
});

test('right triangle uses one measurable scale, swaps legs and withholds credit on an investigation',()=>{
 const f=fixture(null,null,true);
 try {
  for(let i=25;i<32;i++) {
   f.nav('#lesson/p15/'+i);
   assert.equal(f.d.querySelectorAll('#task-figure svg line[data-side]').length,3);
   assert.equal(f.d.querySelector('#task-figure [data-angle]'),null);
   assert.equal(f.d.querySelectorAll('#task-figure [data-ruler]').length,i<27?0:1);
  }
  const model=f.q('[data-lesson-help="model"]');
  if(!model.open)f.click('[data-lesson-help="model"] > summary');
  const selectors=[...f.d.querySelectorAll('#model select')].map(select=>'#'+select.id);
  assert.equal(selectors.length,3);
  for(const [index,[v,h,c]] of [[3,4,5],[5,12,13],[8,15,17]].entries()) {
   f.event(selectors[1],String(index),'change');
   for(const picked of [0,1]) {
    f.event(selectors[0],String(picked),'change');
    f.event(selectors[2],'0','change');
    assert.equal(f.d.querySelector('#model [data-role]'),null);
    assert.equal(f.d.querySelectorAll('#model .pm-equation').length,0);
    f.event(selectors[2],'3','change');
    assert.match(f.q('#model .pm-result').textContent,/гипотенуза.*в знаменателе/);
    f.event(selectors[2],picked===0?'1':'2','change');
    assert.match(f.q('#model .pm-result').textContent,/касается угла/);
    f.event(selectors[2],picked===0?'2':'1','change');
    const diagram=f.q('#model svg'),ruler=diagram.querySelector('[data-ruler]');
    const dist=line=>Math.hypot(Number(line.getAttribute('x2'))-Number(line.getAttribute('x1')),Number(line.getAttribute('y2'))-Number(line.getAttribute('y1')));
    for(const [name,n] of [['AC',h],['BC',v],['AB',c]])
     assert(Math.abs(dist(diagram.querySelector('[data-side="'+name+'"]'))/dist(ruler)-n)<1e-10);
    assert.equal(diagram.querySelector('[data-role=opposite]').dataset.side,picked===0?'BC':'AC');
    assert.equal(diagram.querySelector('[data-role=adjacent]').dataset.side,picked===0?'AC':'BC');
    assert.equal(diagram.querySelector('[data-role=hypotenuse]').dataset.side,'AB');
    assert.equal(diagram.querySelector('[data-angle]').dataset.angle,picked===0?'A':'B');
    const fractions=[...f.d.querySelectorAll('#model .pm-equation')].map(e=>[...e.querySelectorAll('.pm-fraction')].map(m=>[...m.children].map(el=>el.textContent).join('/')));
    const [opp,adj]=picked===0?[v,h]:[h,v];
    assert.deepEqual(fractions.map(parts=>parts[1]),[opp+'/'+c,adj+'/'+c,opp+'/'+adj]);
   }
  }
  assert.equal(f.d.querySelector('#answer-form'),null);
  assert.equal(f.state().tasks['p15-t32'].correct,false);
  f.nav('#lesson/p15/28');f.event('#final-answer','7/5');f.submit('#answer-form');
  assert.match(f.q('.answer-form .feedback').textContent,/сложении самих дробей/);
  f.event('#final-answer','1');f.submit('#answer-form');
  assert.match(f.q('.task-heading').textContent,/Исправлено без подсказки/);
 } finally {f.close();}
});

test('part three additional groups diagnose sign, unnecessary inputs and what remains',()=>{
 const f=fixture(null,null,true);
 try {
  const wrong=(index,value,expected)=>{
   f.nav('#lesson/p33/'+index);
   const task=f.w.PetersonCourse.lessons.find(l=>l.id==='p33').tasks[index];
   if(task.kind==='choice')f.click('[data-choice="'+task.choices.indexOf(value)+'"]');
   else f.event('#final-answer',value);
   f.submit('#answer-form');
   assert.match(f.q('.answer-form .feedback').textContent,expected);
   return task;
  };
  const algebra=wrong(23,'b − 7',/Минус перед вторыми скобками/);
  f.click('[data-action="hint"]');
  assert.match(f.q('.help figure').textContent,/−2 × \(b\).*−2 × \(−2\)/);
  f.click('[data-choice="'+algebra.choices.indexOf(algebra.answer)+'"]');f.submit('#answer-form');
  assert.equal(f.state().tasks[algebra.id].assisted,true);
  wrong(26,'-3',/отрицательный коэффициент/);
  f.event('#final-answer','3');f.submit('#answer-form');
  assert.match(f.q('.task-heading').textContent,/Исправлено без подсказки/);
  wrong(29,'6v + 25; 445, 505, 565 км',/пройденный путь/);
  f.click('[data-action="hint"]');assert.match(f.q('.help figure').textContent,/3 ч, скорость v \+ 10/);
  wrong(30,'0,1n + 0,2; 1,2, 1,7 и 2,2 т',/масса проданного/);
  f.click('[data-action="hint"]');assert.match(f.q('.help figure').textContent,/n \+ 4 мешка/);
 } finally {f.close();}
});

test('opening printed rules use directed distances, common cells and every signed term',()=>{
 const f=fixture(null,null,true);
 try {
  for(const [index,rule] of ['add','subtract','distribute'].entries()) {
   f.nav('#lesson/p33/'+(31+index));
   const details=f.q('[data-lesson-help="model"]');
   if(!details.open)f.click('[data-lesson-help="model"] > summary');
   const ids=[...f.d.querySelectorAll('#model select')].map(n=>'#'+n.id);
   for(const b of [1,2,3,4]) for(const c of [1,2,3,4]) {
    f.event(ids[0],String(b),'change');f.event(ids[1],String(c),'change');
    const figure=f.q('#model svg');
    if(rule==='distribute') {
     const rectangles=[...figure.querySelectorAll('rect')];
     assert.deepEqual(rectangles.map(r=>Number(r.getAttribute('width'))),[b*31,c*31]);
     assert(rectangles.every(r=>Number(r.getAttribute('height'))===3*31));
    } else {
     const line=s=>figure.querySelector('[data-move="'+s+'"]');
     const distance=s=>Number(line(s).getAttribute('x2'))-Number(line(s).getAttribute('x1'));
     assert(Math.abs(distance('sum')-distance('first')-distance('second'))<1e-8);
     assert(Math.abs(distance('first')*c-distance('second')*b)<1e-8);
     assert.equal(Math.sign(distance('sum')),rule==='add'?1:-1);
    }
   }
   assert.equal(f.state().tasks['p33-t'+(32+index)].correct,false);
   assert.equal(f.d.querySelector('#answer-form'),null);
  }
  f.nav('#lesson/p33/38');f.click('[data-action="hint"]');
  assert.match(f.q('.help figure').textContent,/−1 × \(−n\).*−1 × \(\+r\).*−1 × \(−s\)/);
  f.nav('#lesson/p33/42');f.event('#final-answer','7/9');f.submit('#answer-form');
  assert.match(f.q('.answer-form .feedback').textContent,/Сравни 2 и 2 7\/9/);
  f.event('#final-answer','-7/9');f.submit('#answer-form');
  assert.match(f.q('.task-heading').textContent,/Исправлено без подсказки/);
 } finally {f.close();}
});

test('read both opening sections in print order while old links retain their task', async () => {
 const f=fixture(null,null,true);
 try {
  const parts=[
   {part:2,id:'p15',first:32,subparts:['аб','','абвгдежз','','абвг','абвгдежз','абвг','абвгде','12','123','абвгде','1234','1234','12','12345','1234','123456','','абвг','12','абвгдежз','','','аб','','12','']},
   {part:3,id:'p33',first:31,subparts:['абв','абвгдежзи','абвгдежз','абвгдежз','абвг','аб','абвгдежзи','аб','аб','аб','абв','аб','аб','абвг','','абвг','абвг','абвг','','аб','','','','','','']},
  ];
  for(const {part,id,first,subparts} of parts) {
   const lesson=f.w.PetersonCourse.lessons.find(item=>item.id===id);
   const expected=subparts.flatMap((letters,i)=>(letters ? [...letters] : ['']).map(letter=>[i+1,letter]));
   const source=index=>{const s=lesson.tasks[index].source;return [s.exercise,String(s.subpart||'')];};
   f.nav('#home');
   const start=f.q('a[href="#lesson/'+id+'/'+first+'"]');
   assert.match(start.textContent,new RegExp('С начала части '+part));
   f.nav(start.hash);
   const indices=[...f.d.querySelectorAll('.side-list [data-index]')].map(b=>Number(b.dataset.index));
   assert.deepEqual(indices.map(source),expected);
   for(const [ordinal,index] of indices.entries()) {
    f.nav('#lesson/'+id+'/'+index);
    // Let queued navigation and observer callbacks run between actual student clicks.
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(f.q('[aria-current="step"]').dataset.index,String(index));
    const adjacent=[...f.d.querySelectorAll('.navigation [data-action="task"]')].map(b=>Number(b.dataset.index));
    assert.deepEqual(adjacent,[indices[ordinal-1],indices[ordinal+1]].filter(i=>i!==undefined));
   }
   f.nav('#lesson/'+id);
   assert.equal(f.q('[aria-current="step"]').dataset.index,'0');
   assert.equal(Object.values(f.state().tasks).some(t=>t.correct),false);
  }
 }finally{f.close();}
});

test('a complete source topic checks changed quantities, a weighted solution and similar triangles',()=>{
 const f=fixture(null,null,true);
 try{
  f.nav('#home');assert.match(f.q('#main').textContent,/№1–27 со всеми подпунктами.*93/);
  const model=(index)=>{f.nav('#lesson/p15/'+index);f.click('[data-lesson-help="model"] > summary');return [...f.d.querySelectorAll('#model select')].map(n=>'#'+n.id);};
  for(const [index,pairs]of [[75,[[0,1],[1,0]]],[76,[[0,0],[1,1]]],[89,[[0,0],[1,1]]],[92,[[0,1],[1,2]]]]){
   const ids=model(index);for(const [example,guess] of pairs){f.event(ids[0],String(example),'change');f.event(ids[1],String(guess),'change');assert(f.q('#model .pm-result').textContent.includes('согласуется'));}
   f.event(ids[1],String((pairs[1][1]+1)%3),'change');assert(f.q('#model .pm-result').textContent.includes('не выполнено'));
  }
  for(let i=77;i<=84;i++){
   const ids=model(i);f.event(ids[1],'1','change');assert.equal(f.d.querySelectorAll('#model .pm-equation').length,2);
   f.event(ids[0],'1','change');assert.equal(f.d.querySelectorAll('#model .pm-equation').length,0);
  }
  const mix=model(85);f.event(mix[1],'2','change');
  assert.match(f.q('#model .pm-equation').textContent,/210 \/ 1000/);
  f.event(mix[0],'1','change');assert.match(f.q('#model .pm-equation').textContent,/130 \/ 600/);
  const triangles=model(86);assert.equal(f.d.querySelectorAll('#task-figure [data-base]').length,4);
  for(const sample of [0,1])for(const size of [0,1,2,3]){
   f.event(triangles[0],String(size),'change');f.event(triangles[1],String(sample),'change');
   for(const line of f.d.querySelectorAll('#model [data-base]')){
    const height=+line.getAttribute('y1')-+line.getAttribute('y2'),width=(+line.getAttribute('x1')-15);
    assert(Math.abs(height/width-(sample?2/3:1/2))<1e-9);
   }
  }
  for(const index of [90,91]){const ids=model(index);assert.equal(f.q(ids[1]).value,index===90?'0':'1');}
 }finally{f.close();}
});

test('oral signs, a chained calculation and unequal travel times use genuinely different data',()=>{
 const f=fixture(null,null,true);
 try{
  for(let i=56;i<=59;i++){
   f.nav('#lesson/p33/'+i);f.click('[data-lesson-help="model"] > summary');
   const ids=[...f.d.querySelectorAll('#model select')].map(n=>'#'+n.id),task=f.w.PetersonCourse.lessons.find(l=>l.id==='p33').tasks[i];
   for(const data of [0,1])for(let item=0;item<4;item++){
    f.event(ids[0],String(item),'change');f.event(ids[1],String(data),'change');assert.equal(f.q(ids[2]).value,'0');
    assert(f.q('#model .pm-equation').textContent.endsWith('= ?'));
    f.event(ids[2],'1','change');
    assert(f.q('#model .pm-equation').textContent.endsWith('= '+(data?task.oralStudy.freshAnswers:task.oralStudy.answers)[item]));
   }
  }
  f.nav('#lesson/p33/60');f.click('[data-lesson-help="model"] > summary');
  const ids=[...f.d.querySelectorAll('#model select')].map(n=>'#'+n.id);
  for(const [i,answer] of ['40','6/5','-7/5','-9/2','-2','16'].entries()){
   f.event(ids[0],String(i),'change');
   for(let step=0;step<=4;step++){
    f.event(ids[1],String(step),'change');assert.equal(f.d.querySelectorAll('#model tbody tr').length,step+1);
   }
   assert.equal(f.q('#model tbody tr:last-child td:last-child').textContent,f.w.PetersonMath.decimal(answer).replace('-','−'));
  }
  assert.equal(f.q('#model tbody tr:nth-child(2) td').textContent,'4 : 0,8');
  f.event(ids[2],'1','change');assert.equal(f.d.querySelectorAll('#model svg polygon').length,1);
  assert.equal(f.d.querySelectorAll('#model svg line').length,4);
  f.nav('#lesson/p33/62');f.click('[data-lesson-help="model"] > summary');
  const route=[...f.d.querySelectorAll('#model select')].map(n=>'#'+n.id);
  assert.equal(f.d.querySelector('#model table'),null);
  f.event(route[1],'1','change');assert(f.q('#model .pm-result').textContent.includes('75 м/мин'));
  f.event(route[0],'1','change');assert.equal(f.d.querySelector('#model table'),null);assert.equal(f.q(route[1]).value,'0');
  f.event(route[1],'1','change');assert(f.q('#model .pm-result').textContent.includes('60 м/мин'));
 }finally{f.close();}
});

test('inner groups, incomplete rows and bracket placement remain meaningful when numbers change',()=>{
 const f=fixture(null,null,true);
 try{
  for(const [offset,evaluate] of [(x)=>1-x,(x)=>2*x-4,()=>5].entries()){
   f.nav('#lesson/p33/'+(49+offset));f.click('[data-lesson-help="model"] > summary');
   const id='#'+f.q('#model select').id;
   for(const value of [-2,0,1,3,5]){
    f.event(id,String(value),'change');
    const rows=[...f.d.querySelectorAll('#model table tbody tr td:last-child')];
    assert.equal(Number(rows.at(-1).textContent),evaluate(value));
   }
  }
  for(const [index,divisor,remainder] of [[52,5,1],[53,12,6]]){
   f.nav('#lesson/p33/'+index);f.click('[data-lesson-help="model"] > summary');
   const id='#'+f.q('#model select').id;
   for(let v=1;v<=5;v++){
    f.event(id,String(v),'change');
    const total=divisor===5?5*v+1:12*v+18;
    const rows=[...f.d.querySelectorAll('#model [data-remainder-row]')].map(n=>Number(n.dataset.remainderRow));
    assert.deepEqual(rows,[...Array(Math.floor(total/divisor)).fill(divisor),remainder]);
    assert.equal(f.d.querySelectorAll('#model circle').length,total);
   }
   assert.equal(f.d.querySelector('#answer-form'),null);
  }
  f.nav('#lesson/p33/55');f.click('[data-lesson-help="model"] > summary');
  const ids=[...f.d.querySelectorAll('#model select')].map(n=>'#'+n.id);
  for(const m of [-2,0,2,4])for(const n of [-1,0,1,3])for(const option of [0,1,2]){
   [m,n,option].forEach((v,i)=>f.event(ids[i],String(v),'change'));
   const values=[...f.d.querySelectorAll('#model table tbody tr td:last-child')].map(c=>Number(c.textContent));
   assert.deepEqual(values,[[m-n-m+n,m-(n-m)+n,m-(n-m+n)][option],2*m]);
  }
 }finally{f.close();}
});

test('dissection keeps four congruent triangles and both equation sides use the same input', () => {
 const f=fixture(null,null,true);
 try {
  f.nav('#lesson/p15/70');
  assert.equal(f.d.querySelectorAll('#task-figure [data-triangle]').length,8);
  f.click('[data-lesson-help="model"] > summary');
  const ids=[...f.d.querySelectorAll('#model select')].map(node=>'#'+node.id);
  for(const [sample,[a,b,h]] of [[3,4,5],[5,12,13],[8,15,17]].entries())for(const arrangement of [0,1]){
   f.event(ids[0],String(sample),'change');f.event(ids[1],String(arrangement),'change');
   const triangles=[...f.d.querySelectorAll('#model [data-triangle]')];assert.equal(triangles.length,4);
   for(const polygon of triangles){
    const points=polygon.getAttribute('points').split(' ').map(pair=>pair.split(',').map(Number));
    const [p,q,r]=points,area=Math.abs((q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]))/2;
    assert(Math.abs(area/(150*150)-a*b/(2*(a+b)**2))<1e-9);
   }
   assert.match(f.q('#model .pm-result').textContent,new RegExp('= '+h*h+'$'));
  }
  for(let index=71;index<=74;index++){
   f.nav('#lesson/p15/'+index);f.click('[data-lesson-help="model"] > summary');
   const id='#'+f.q('#model select').id;
   for(const option of [0,1,2,3]){
    f.event(id,String(option),'change');
    const values=[...f.d.querySelectorAll('#model tbody tr td:last-child')].map(x=>x.textContent);
    assert.equal(values.length,2);
    assert.equal(f.w.PetersonMath.equal(values[0],values[1]),option===2);
    assert(f.q('#model .pm-result').textContent.includes(option===2?'подтверждает корень':'не является корнем'));
   }
  }
 }finally{f.close();}
});

test('additive and multiplicative changes show both scaled lengths and diagnose the selected misconception', () => {
 const f=fixture(null,null,true);
 try {
  const lesson=f.w.PetersonCourse.lessons.find(x=>x.id==='p15');
  for(const [index,task] of lesson.tasks.entries()) {
   if(!task.changeStudy)continue;
   f.nav('#lesson/p15/'+index);
   const [wrong,feedback]=task.errorCues[0];
   if(task.kind==='number')f.event('#final-answer',wrong);
   else f.click('[data-choice="'+task.choices.indexOf(wrong)+'"]');
   f.submit('#answer-form');
   assert(f.q('.answer-form .feedback').textContent.includes(feedback));
   assert.equal(f.state().tasks[task.id].assisted,false);
   f.click('[data-lesson-help="model"] > summary');
   const id='#'+f.q('#model select').id;
   for(const [choice,before,after] of [[0,task.changeStudy.base,task.changeStudy.result],[1,task.changeStudy.alternate,task.changeStudy.nextResult]]) {
    f.event(id,String(choice),'change');
    const [a,b]=[...f.d.querySelectorAll('[data-change-bar]')].map(r=>Number(r.getAttribute('width')));
    const x=f.w.PetersonMath.parse(before),y=f.w.PetersonMath.parse(after);
    assert(Math.abs(b/a-y.n*x.d/(y.d*x.n))<1e-9);
   }
   assert.equal(f.state().tasks[task.id].correct,false);
  }
 }finally{f.close();}
});

test('both parts and the whole use a single scale with an explicit denominator',()=>{
 const f=fixture(null,null,true);
 try {
  const sets=[[[6,12],[9,6]],[[10,15],[14,16]],[[4,8],[8,4]],[[3,2],[7,3]],[[50,150],[60,140]]];
  for(const [i,examples]of sets.entries()) {
   f.nav('#lesson/p15/'+(41+i));
   if(!f.q('[data-lesson-help="model"]').open)f.click('[data-lesson-help="model"] > summary');
   const ids=[...f.d.querySelectorAll('#model select')].map(s=>'#'+s.id);
   for(const [example,[left,right]] of examples.entries()) {
    f.event(ids[0],String(example),'change');
    const n=[left,right,left+right];
    for(let a=0;a<3;a++)for(let b=0;b<3;b++) {
     f.event(ids[1],String(a),'change');f.event(ids[2],String(b),'change');
     const first=+f.q('#model [data-measure="first"]').getAttribute('width');
     const base=+f.q('#model [data-measure="base"]').getAttribute('width');
     assert(Math.abs(first/base-n[a]/n[b])<1e-10);
     assert.equal(f.q('#model .pm-result').textContent.includes('больше 100 %'),n[a]>n[b]);
     assert.equal(f.d.querySelector('#answer-form'),null);
    }
   }
   assert.equal(f.state().tasks['p15-t'+(42+i)].correct,false);
  }
  f.nav('#lesson/p15/58');f.event('#final-answer','0,17');f.submit('#answer-form');
  assert.match(f.q('.answer-form .feedback').textContent,/нашёл долю|частное до перевода/);
  f.click('[data-action="hint"]');
  assert.match(f.q('.help figure').textContent,/3,4 кг/);
  assert.deepEqual([...f.d.querySelectorAll('.help meter')].map(m=>[m.value,m.max]),[[3.4,20],[20,20]]);
 }finally{f.close();}
});

test('fresh practice uses its own operands and withholds cues during an independent check',async()=>{
 const f=fixture(null,null,true);
 try {
  for(const level of [1,2,3]) {
   for(const skill of ['ratio','bracket-evaluate']) {
    f.nav('#practice/'+skill+'/'+level);
    for(let example=0;example<3;example++) {
     const seed=f.state().practice[skill+':'+level].seed;
     const t=f.w.PetersonMath.generate(skill,seed,level,2),{left,right,third}=t.calculation;
     const [a,b,c]=[left,right,third].map(Number);
     const wrong=skill==='ratio'?b+'/'+a:String(a-b-c);
     if(!f.w.PetersonMath.equal(wrong,t.answer)){
      f.event('#final-answer',wrong);f.submit('#answer-form');
      assert.match(f.q('.answer-form .feedback').textContent,skill==='ratio'?/обратном порядке/:/скобками|слагаемое/);
     }
     f.click('[data-action="hint"]');
     if(skill==='ratio')assert.deepEqual([...f.d.querySelectorAll('.help meter')].map(m=>m.value),[a,b]);
     else assert.ok(f.q('.help figure').textContent.includes('−('+third+')'));
     f.click('[data-action="new"]');
    }
   }
  }
  f.nav('#check/ratio/1');
  f.event('#final-answer','12345');f.submit('#answer-form');
  assert.match(f.q('.answer-form .feedback').textContent,/Пока не совпало/);
  assert.equal(f.d.querySelector('.help figure'),null);
 }finally{f.close();}
});

test('manual mixed steps, required figure, notes and explicit review survive reload without credit',()=>{
 const f=fixture();let saved;
 try{
  f.nav('#lesson/p15/0');assert(f.q('#task-figure svg'));assert(!f.d.querySelector('#answer-form'));assert.equal(f.state().tasks['p15-ui-manual'].assisted,false,'required figure is not help');
  f.click('[data-action="record-manual"]');assert.equal(f.state().tasks['p15-ui-manual'].value,'');
  f.event('#notebook','Построение и обоснование записаны в тетради.');f.click('[data-action="guided"]');f.event('[data-step-input="0"]','6');f.submit('[data-step-form="0"]');
  f.click('[data-action="instruction"]');assert.equal(f.state().tasks['p15-ui-manual'].step,2);assert.equal(f.d.querySelectorAll('.step.completed').length,2);
  f.click('[data-action="record-manual"]');saved=f.state();assert.equal(saved.tasks['p15-ui-manual'].value,'recorded');assert.equal(saved.tasks['p15-ui-manual'].correct,false);assert.equal(saved.tasks['p15-ui-manual'].independent,false);assert.equal(saved.tasks['p15-ui-manual'].completion,null);
 }finally{f.close();}
 const g=fixture(saved);try{g.nav('#lesson/p15/0');assert.equal(g.d.querySelectorAll('.step.completed').length,2);assert.equal(g.q('#notebook').value,'Построение и обоснование записаны в тетради.');g.click('[data-action="instruction"]');assert.equal(g.state().tasks['p15-ui-manual'].step,3);assert.match(g.q('.task-heading').textContent,/Записано для проверки/);g.event('#notebook','');assert.equal(g.state().tasks['p15-ui-manual'].value,'');}finally{g.close();}
});

test('model values persist per task, through a practice detour and a new browser session',async()=>{
 const f=fixture();let saved,help;
 try{f.nav('#lesson/p15/0');assert.equal(f.q('[data-lesson-help="model"]').open,false);f.click('[data-lesson-help="model"] > summary');f.event('#model select','9','change');assert.equal(f.state().models['p15-ui-manual'].values[0],9);assert.equal(f.state().tasks['p15-ui-manual'].assisted,true);f.event('#notebook','Моя схема');f.click('[data-action="detour"]');await f.settle();f.click('[data-action="return"]');await f.settle();assert.equal(f.q('#model select').value,'9');assert.equal(f.q('[data-lesson-help="model"]').open,true);assert.equal(f.q('#notebook').value,'Моя схема');f.nav('#lesson/p15/1');assert.equal(f.q('#model select').value,'6','other task uses its own model');f.click('[data-lesson-help="model"] > summary');f.event('#model select','3','change');f.nav('#lesson/p15/0');assert.equal(f.q('#model select').value,'9');saved=f.state();help=JSON.parse(f.w.localStorage.getItem(KEY+'.help'));}finally{f.close();}
 const g=fixture(saved,help);try{g.nav('#lesson/p15/1');assert.equal(g.q('#model select').value,'3');assert.equal(g.q('[data-lesson-help="model"]').open,true);g.nav('#lesson/p15/0');assert.equal(g.q('#model select').value,'9');assert.equal(g.q('[data-lesson-help="model"]').open,true);}finally{g.close();}
});

test('new independent checks retain helped practice, use unseen conditions, and resume after reload',async()=>{
 const f=fixture();let saved,checkId;
 try{f.nav('#practice/fraction-multiply/1');f.click('[data-action="hint"]');f.event('#notebook','Старая запись с подсказкой');const previous=f.state(),oldId=Object.keys(previous.tasks).find(id=>id.startsWith('practice:'));f.click('[data-action="start-check"]');await f.settle();assert.equal(f.w.location.hash,'#check/fraction-multiply/1');checkId=Object.keys(f.state().tasks).find(id=>id.startsWith('check:'));assert(checkId);assert.notEqual(f.state().tasks[checkId].signature,previous.tasks[oldId].signature);assert.deepEqual(f.state().tasks[oldId],previous.tasks[oldId]);assert(!f.d.querySelector('[data-action="hint"]'));assert(!f.d.querySelector('[data-action="guided"]'));const seed=Number(checkId.split(':')[3]),task=f.w.PetersonMath.generate('fraction-multiply',seed,1);f.event('#final-answer',task.answer);f.submit('#answer-form');assert(f.state().tasks[checkId].correct);assert(f.state().tasks[checkId].independent);saved=f.state();f.nav('#diagnostic');assert.match(f.q('#main').textContent,/Последняя проверка выполнена с первой попытки/);f.nav('#check/fraction-multiply/3');f.nav('#diagnostic');const card=[...f.d.querySelectorAll('.skill-card')].find(el=>el.querySelector('h2').textContent===f.w.PetersonMath.skills.find(sk=>sk.id==='fraction-multiply').title);assert.match(card.textContent,/Здесь полезно повторить действие/,'latest check is based on visit order across levels, not level-specific seed');}finally{f.close();}
 const g=fixture(saved);try{g.nav('#check/fraction-multiply/1');assert.equal(g.state().tasks[checkId].correct,true);assert.equal(Object.keys(g.state().tasks).filter(id=>id.startsWith('check:')).length,1,'reload resumes current check');g.click('[data-action="new"]');assert.equal(Object.keys(g.state().tasks).filter(id=>id.startsWith('check:')).length,2);assert.equal(g.state().tasks[checkId].correct,true);}finally{g.close();}
});

test('real import keeps conflicting local work and imports an untouched task with its model together',async()=>{
 const incomingFixture=fixture();let incoming;
 try{incomingFixture.nav('#lesson/p15/0');incomingFixture.event('#notebook','Входящая запись');incomingFixture.click('[data-action="record-manual"]');incomingFixture.event('#model select','8','change');incoming= incomingFixture.state();}finally{incomingFixture.close();}
 const f=fixture();try{f.nav('#lesson/p15/0');f.event('#notebook','СВОЙ ЧЕРНОВИК');f.click('[data-action="guided"]');f.event('[data-step-input="0"]','6');f.submit('[data-step-form="0"]');f.event('#model select','11','change');const before=f.state();await f.importData({course:'peterson6-part1',state:incoming});assert.deepEqual(f.state().tasks['p15-ui-manual'],before.tasks['p15-ui-manual']);assert.deepEqual(f.state().models['p15-ui-manual'],before.models['p15-ui-manual']);}finally{f.close();}
 const g=fixture();try{await g.importData({course:'peterson6-part1',state:incoming});assert.equal(g.state().tasks['p15-ui-manual'].note,'Входящая запись');assert.deepEqual(g.state().models['p15-ui-manual'],incoming.models['p15-ui-manual']);g.nav('#lesson/p15/0');assert.equal(g.q('#model select').value,'8');}finally{g.close();}
});

test('legacy v1 state loads without models and safe math formatting leaves ordinary slashes alone',()=>{
 const old={version:1,tasks:{},practice:{},last:{hash:'#lesson/p01/0'},origin:null},f=fixture(old);
 try{f.nav('#lesson/p01/0');assert(f.state().models['p01-t01']);const div=f.d.createElement('div');div.innerHTML=f.w.PetersonApp.format('a/b; (3 + 2)/6; (3 · 22)/(11 · 45); 1/t; 2 1/3; {{frac:a:12}}; {{frac:a+b:b}}; {{frac:(a + 2):(b − 3)}}; {{mix:+2:1:3}}; Decimal/Fraction; https://example.org/a/b; <img src=x onerror=alert(1)>; {{frac:<img src=x onerror=alert(1)>:b}}');assert.equal(div.querySelectorAll('.fra').length,10);assert.equal(div.querySelectorAll('img').length,0);assert.doesNotMatch(div.textContent,/\{\{(?:frac|mix):/);assert.equal(div.querySelectorAll('[onerror],[onclick]').length,0);assert.match(div.textContent,/Decimal\/Fraction/);assert.match(div.textContent,/https:\/\/example.org\/a\/b/);}finally{f.close();}
});

test('revealing a model or opening theory records help and preserves previously earned independence',()=>{
 for(const kind of ['model','theory']){
  const f = fixture();
  try {
   f.nav('#lesson/p08/0');
   const task = f.w.PetersonCourse.lessons.find(l => l.id === 'p08').tasks[0];
   const panel = '[data-lesson-help="' + kind + '"]';
   assert.equal(f.q(panel).open, false);
   f.event('#final-answer', '0,86');
   f.event('#notebook', 'Не потерять запись');
   f.click(panel + ' > summary');
   assert.equal(f.q(panel).open, true);
   assert.equal(f.q('#final-answer').value, '0,86');
   assert.equal(f.q('#notebook').value, 'Не потерять запись');
   if (kind === 'model') {
    assert.equal(f.state().tasks[task.id].assisted, false, 'the experiment is still hidden');
    f.click('[data-inquiry-open]');
   }
   f.click(panel + ' > summary');
   assert.equal(f.state().tasks[task.id].assisted, true, 'closing cannot undo assistance');
   f.event('#final-answer', task.answer);
   f.submit('#answer-form');
   assert.equal(f.state().tasks[task.id].correct, true);
   assert.equal(f.state().tasks[task.id].independent, false);
  } finally { f.close(); }
 }
 const f=fixture();try{f.nav('#lesson/p08/0');const task=f.w.PetersonCourse.lessons.find(l=>l.id==='p08').tasks[0];f.event('#final-answer',task.answer);f.submit('#answer-form');const earned=f.state().tasks[task.id].completion;assert.equal(earned.independent,true);for(const kind of ['model','theory'])f.click('[data-lesson-help="'+kind+'"] > summary');f.click('[data-inquiry-open]');f.event('#model .pm-experiment input','7');assert.deepEqual(f.state().tasks[task.id].completion,earned);assert.equal(f.state().tasks[task.id].independent,true);}finally{f.close();}
});

test('part three switches from automatic answer to the actual manual card before the queued hash event',()=>{
 const f=fixture();try{
  f.nav('#lesson/p39');assert.equal(f.d.querySelectorAll('#answer-form').length,1);
  f.click('.side-list [data-index="1"]');
  assert.equal(f.w.location.hash,'#lesson/p39/1');
  assert.equal(f.q('.side-list [aria-current="step"]').dataset.index,'1');
  assert.equal(f.q('#problem .task-heading h2').textContent,f.w.PetersonCourse.lessons.find(l=>l.id==='p39').tasks[1].title);
  assert.equal(f.d.querySelectorAll('#answer-form').length,0);
  assert(f.q('.manual-work'));assert(f.q('[data-action="record-manual"]'));
 }finally{f.close();}
});
test('read the entire opening brackets topic and retry its source-specific models',()=>{
 const f=fixture(null,null,true);
 try{
  f.nav('#home');assert.match(f.q('#main').textContent,/№1–26 со всеми подпунктами.*82/);
  const go=index=>{f.nav('#lesson/p33/'+index);f.click('[data-lesson-help="model"] > summary');return [...f.d.querySelectorAll('#model select')].map(s=>'#'+s.id);};
  let ids=go(65);
  f.event(ids[1],'1','change');assert.match(f.q('#model .pm-result').textContent,/между 3 и 5 равна 4/);
  f.event(ids[0],'1','change');assert.equal(f.q(ids[1]).value,'0');
  f.event(ids[1],'1','change');assert.match(f.q('#model .pm-result').textContent,/между 4 и 8 равна 6/);
  ids=go(72);assert.equal(f.d.querySelectorAll('#task-figure [data-line]').length,5);
  for(const sample of [0,1]){
   f.event(ids[0],String(sample),'change');
   const lines=[...f.d.querySelectorAll('#model [data-line]')].map(el=>['x1','y1','x2','y2'].map(k=>Number(el.getAttribute(k))));
   const intersections=[];
   for(const [i,[x,y,u,v]]of lines.entries())for(const [a,b,c,d]of lines.slice(i+1)){
    const determinant=(u-x)*(d-b)-(v-y)*(c-a);
    if(determinant===0)continue;
    const t=((a-x)*(d-b)-(b-y)*(c-a))/determinant;
    intersections.push([x+t*(u-x),y+t*(v-y)]);
   }
   assert.equal(intersections.length,8);
   for(const [i,[x,y]]of intersections.entries())for(const [a,b]of intersections.slice(i+1))assert(Math.hypot(x-a,y-b)>8);
  }

  for(const [id,expression]of [[0,/отличным от прямого/],[1,/под прямым углом/],[2,/общих точек нет/]]){
   f.event(ids[1],String(id),'change');assert.equal(f.q(ids[2]).value,'0');f.event(ids[2],'1','change');
   assert.match(f.q('#model .pm-result').textContent,expression);
  }
  ids=go(73);f.event(ids[2],'1','change');assert.match(f.q('#model .pm-result').textContent,/Р = 4/);
  f.event(ids[1],'1','change');assert.equal(f.q(ids[2]).value,'0');f.event(ids[2],'1','change');assert.match(f.q('#model .pm-result').textContent,/Р = 2/);
  f.event(ids[2],'2','change');assert.equal(f.d.querySelectorAll('#model svg polygon').length,1);
  ids=go(75);f.event(ids[1],'1','change');assert.match(f.q('#model .pm-result').textContent,/Обе стороны равны/);
  f.event(ids[0],'1','change');assert.match(f.q('#model .pm-result').textContent,/Стороны различаются/);
  f.event(ids[1],'2','change');assert.match(f.q('#model .pm-result').textContent,/Обе стороны равны/);
  ids=go(76);f.event(ids[1],'5','change');assert.match(f.q('#model .pm-result').textContent,/выполняют все условия/);
  f.event(ids[0],'1','change');f.event(ids[1],'7','change');assert.match(f.q('#model .pm-result').textContent,/выполняют все условия/);
  ids=go(77);f.event(ids[1],'1','change');assert.match(f.q('#model .pm-result').textContent,/0 \+ 2/);
  ids=go(78);f.event(ids[0],'5','change');f.event(ids[2],'1','change');assert.match(f.q('#model .pm-result').textContent,/К = 12/);
  ids=go(79);f.event(ids[2],'1','change');assert.match(f.q('#model .pm-result').textContent,/28,5 км\/ч/);
  f.event(ids[1],'1','change');assert.equal(f.q(ids[2]).value,'0');f.event(ids[2],'1','change');assert.match(f.q('#model .pm-result').textContent,/27,5 км\/ч/);
  assert.equal(f.d.querySelectorAll('#model .pcm-route-table thead th').length,2);assert(f.q('#model .pcm-route-table').textContent.includes('5 ч × 26 км/ч = 130 км'));
  ids=go(80);f.event(ids[1],'1','change');assert.match(f.q('#model table').textContent,/24,5/);f.event(ids[0],'1','change');assert.equal(f.q(ids[1]).value,'0');
  ids=go(81);f.event(ids[1],'1','change');assert.match(f.q('#model .pm-result').textContent,/2\/3 и 1\/3/);
  f.event(ids[0],'1','change');assert.match(f.q('#model .pm-result').textContent,/отличается от 7/);f.event(ids[1],'2','change');assert.match(f.q('#model .pm-result').textContent,/1\/3 и 2\/3/);
  assert.equal(Object.values(f.state().tasks).some(t=>t.correct),false);
 }finally{f.close();}
});

test('move directly into the first printed scale question and compare differently labelled rulers',()=>{
 const f=fixture(null,null,true);
 try{
  f.nav('#lesson/p15/92');const next=f.q('.navigation a');assert.equal(next.hash,'#lesson/p16/6');f.nav(next.hash);
  assert.match(f.q('[aria-current="step"]').textContent,/№28\(1\)/);
  const ids=()=>[...f.d.querySelectorAll('#model select')].map(el=>'#'+el.id);
  const go=i=>{f.nav('#lesson/p16/'+i);f.click('[data-lesson-help="model"] > summary');return ids();};
  let controls=go(6);f.event(controls[1],'1','change');assert.match(f.q('#model .pm-result').textContent,/1 см/);
  f.event(controls[0],'1','change');assert.equal(f.q(controls[1]).value,'0');
  f.event(controls[1],'1','change');assert.match(f.q('#model .pm-result').textContent,/200 см/);
  controls=go(10);f.event(controls[1],'1','change');assert.match(f.q('#model .pm-result').textContent.replace(/\s/g,''),/1:250000/);
  f.event(controls[0],'1','change');f.event(controls[1],'1','change');assert.match(f.q('#model .pm-result').textContent.replace(/\s/g,''),/1:160000/);
  controls=go(13);f.event(controls[0],'1','change');f.event(controls[1],'1','change');assert.match(f.q('#model .pm-result').textContent,/42 км/);
  f.nav('#lesson/p16/2');f.event('#final-answer','0,2');f.submit('#answer-form');assert.match(f.q('.answer-form .feedback').textContent,/Ответ требуется в миллиметрах/);
  assert.equal(Object.values(f.state().tasks).some(t=>t.correct),false);
 }finally{f.close();}
});

test('use calibrated map radii, a notched parcel and all six room areas on new data',()=>{
 const f=fixture(null,null,true);
 try{
  const go=i=>{f.nav('#lesson/p16/'+i);f.click('[data-lesson-help="model"] > summary');return [...f.d.querySelectorAll('#model select')].map(e=>'#'+e.id);};
  for(let i=0;i<8;i++){
   const ids=go(14+i),base=f.q('#task-figure [data-measure="500km"]'),ray=f.q('#task-figure [data-measure="radius"]');
   const length=el=>Math.hypot(Number(el.getAttribute('x1'))-Number(el.getAttribute('x2')),Number(el.getAttribute('y1'))-Number(el.getAttribute('y2')));
   assert.equal(f.q(ids[0]).value,String(i));assert.equal(f.d.querySelectorAll('#task-figure [data-city]').length,8);
   const km=length(ray)/length(base)*500;assert(Math.abs(km-[634,719,969,757,1668,1609,2486,2500][i])<.5);
   f.event(ids[1],'2','change');assert.match(f.q('#model .pm-result').textContent,/Расчёт по координатам/);
   f.event(ids[0],String((i+1)%8),'change');assert.equal(f.q(ids[1]).value,'0');
  }
  let ids=go(22);f.event(ids[1],'1','change');assert.match(f.q('#model .pm-result').textContent.replace(/\s/g,''),/16000м²/);
  f.event(ids[0],'1','change');assert.equal(f.q(ids[1]).value,'0');f.event(ids[1],'2','change');assert.match(f.q('#model .pm-result').textContent,/720 м/);
  ids=go(23);assert.equal(f.d.querySelectorAll('#task-figure [data-room]').length,6);
  for(const [i,area]of ['35','13,95','17,55','14,57','4,95','7,13'].entries()){
   f.event(ids[0],String(i),'change');assert.equal(f.q(ids[2]).value,'0');f.event(ids[2],'1','change');
   assert(f.q('#model .pm-result').textContent.includes('помещения '+area+' м²'));
  }
  f.event(ids[0],'0','change');f.event(ids[1],'1','change');f.event(ids[2],'1','change');
  assert(f.q('#model .pm-result').textContent.includes('помещения 78,75 м²'));
  f.event(ids[0],'2','change');f.event(ids[2],'1','change');assert(f.q('#model .pm-result').textContent.includes('помещения 39,4875 м²'));
  assert.equal(Object.values(f.state().tasks).some(t=>t.correct),false);
 }finally{f.close();}
});

test('coefficient scope, fresh powers and free explanations follow the printed sequence',()=>{
 const f=fixture(null,null,true);
 try{
  f.nav('#lesson/p33/81');assert.equal(f.q('.navigation a').hash,'#lesson/p34/4');
  f.nav('#lesson/p34/4');const order=[...f.d.querySelectorAll('.side-list [data-index]')].map(n=>Number(n.dataset.index));
  assert.deepEqual(order.slice(0,12),[4,0,5,6,1,7,2,8,9,10,11,12]);
  const go=i=>{f.nav('#lesson/p34/'+i);f.click('[data-lesson-help="model"] > summary');return [...f.d.querySelectorAll('#model select')].map(n=>'#'+n.id);};
  for(const [index,source,fresh,letters]of [[8,'−2','−4','x²'],[9,'4','16','x'],[10,'16','256','m⁴'],[13,'−1','1','abcd'],[21,'1/2','1','xy'],[37,'−27','−54','x³']]){
   const ids=go(index);f.event(ids[1],'1','change');assert.match(f.q('#model .pm-result').textContent,new RegExp('Коэффициент '+source+'$'));
   f.event(ids[0],'1','change');assert.equal(f.q(ids[1]).value,'0');
   f.event(ids[1],'1','change');assert.match(f.q('#model .pm-result').textContent,new RegExp('Коэффициент '+fresh+'$'));
   f.event(ids[0],'0','change');f.event(ids[1],'2','change');assert(f.q('#model .pm-result').textContent.includes('Буквенная часть: '+letters));
  }
  const power=go(10);f.event(power[1],'1','change');assert.equal(f.d.querySelectorAll('#model .pcm-factor-chip[data-sign=negative]').length,4);
  const ids=go(7);f.event(ids[0],'1','change');f.event(ids[1],'1','change');assert.match(f.q('#model .pm-result').textContent,/выделяется k⁵/);
  f.event('#notebook','Я выделил k⁵: только в нём одна переменная.');f.click('[data-action="record-manual"]');
  assert.equal(!!f.state().tasks['p34-t08'].correct,false);
 }finally{f.close();}
});

test('complete the coefficient chapter with quantifiers, signed squares and reversible tricks',()=>{
 const f=fixture(null,null,true);
 try{
  f.nav('#home');assert.match(f.q('#main').textContent,/№27–41 со всеми подпунктами.*67/);
  const go=i=>{f.nav('#lesson/p34/'+i);f.click('[data-lesson-help="model"] > summary');return [...f.d.querySelectorAll('#model select')].map(n=>'#'+n.id);};
  let ids=go(41);f.event(ids[1],'1','change');let result=()=>f.q('#model .pm-result').textContent;
  assert(result().includes('при d: 0'));assert(result().includes('при k: −4'));
  f.event(ids[0],'1','change');assert.equal(f.q(ids[1]).value,'0');
  ids=go(45);f.event(ids[1],'2','change');assert(result().includes('−9'));f.event(ids[0],'1','change');f.event(ids[1],'2','change');assert(result().includes('−18'));
  ids=go(47);f.event(ids[1],'1','change');assert(result().includes('значения равны'));
  f.event(ids[0],'1','change');assert.equal(f.q(ids[1]).value,'0');f.event(ids[1],'1','change');assert(result().includes('значения различны'));
  ids=go(50);f.event(ids[1],'2','change');assert.equal(f.d.querySelectorAll('#model [data-piece="uv"]').length,2);
  f.event(ids[0],'1','change');assert.equal(f.q(ids[1]).value,'0');f.event(ids[1],'2','change');
  assert.equal(f.d.querySelectorAll('#model [data-piece="cut"]').length,2);assert.equal(f.d.querySelectorAll('#model [data-piece="overlap"]').length,1);
  ids=go(52);f.event(ids[1],'1','change');assert.match(f.q('#model table').textContent,/\(a \+ b\)²1a² \+ b²13/);
  ids=go(53);f.event(ids[0],'3','change');f.event(ids[1],'4','change');assert.match(f.q('#model table').textContent,/Вычли 3x25/);
  ids=go(54);f.event(ids[1],'4','change');assert.match(f.q('#model table').textContent,/Вычли из 157/);
  ids=go(64);f.event(ids[1],'3','change');assert.match(f.q('#model table').textContent,/Вычли из 4012/);
  ids=go(66);f.event(ids[0],'2','change');f.event(ids[1],'4','change');assert.match(f.q('#model table').textContent,/Прибавили 16,25Корень и минус 11,5/);
  assert.equal(Object.values(f.state().tasks).some(t=>t.correct),false);
 }finally{f.close();}
});

test('place a garden, find the first broken transition, check gear pairs and measure a road horizontally',()=>{
 const f=fixture(null,null,true);
 try{
  const go=i=>{f.nav('#lesson/p16/'+i);f.click('[data-lesson-help="model"] > summary');return [...f.d.querySelectorAll('#model select')].map(n=>'#'+n.id);};
  const set=(id,value)=>f.event(id,String(value),'change'), result=()=>f.q('#model .pm-result').textContent;
  let ids=go(24);
  assert.equal(f.d.querySelector('#task-figure [data-home]'),null);
  set(ids[0],0);set(ids[1],0);const border=f.q('#model svg rect'),house=f.q('#model [data-home="0"]');
  const value=(e,attr)=>Number(e.getAttribute(attr));
  for(const [start,size] of [['x','width'],['y','height']])
   assert.equal(value(house,start)+value(house,size)/2,value(border,start)+value(border,size)/2);
  assert.equal(f.q('#model [data-gate-center]').dataset.gateCenter,'4');
  ids=go(25);set(ids[0],104);set(ids[1],73);
  assert(f.q('#model table').textContent.includes('10,4 м10,4 см'));assert(f.q('#model table').textContent.includes('7,3 м7,3 см'));
  for(const [i,source,fresh] of [[26,'2,8 см','3 см'],[27,'4 см','7 см'],[28,'0,016','0,2'],[29,'10,5','3 + 5 = 8'],[30,'24 вместо 18','8 вместо 7'],[31,'9/34','5/14']]){
   ids=go(i);set(ids[1],1);assert(result().includes(source),source);
   set(ids[0],1);assert.equal(f.q(ids[1]).value,'0');set(ids[1],1);assert(result().includes(fresh),fresh);
  }
  for(const [i,[a,b]] of [[5,1],[1,2],[1,4],[1,6],[2,3],[2,5],[5,6],[3,4]].entries()){
   ids=go(32+i);const choices=[...f.q(ids[0]).options].map(o=>Number(o.value));
   assert.deepEqual(choices,Array.from({length:22},(_,j)=>15+5*j));
   // Generate admissible pairs independently by multiplying the reduced integer ratio.
   const valid=Array.from({length:120},(_,i)=>[a*(i+1),b*(i+1)]).filter(([x,y])=>choices.includes(x)&&choices.includes(y));
   assert(valid.length>1);
   assert(result().includes('Отношение пока другое'));
   for(const [x,y] of valid){
    set(ids[0],x);set(ids[1],y);assert(result().includes('выполняют условие'));
    const shapes=[...f.d.querySelectorAll('#model polygon[data-teeth]')];
    assert.deepEqual(shapes.map(n=>n.getAttribute('points').split(' ').length),[x*4,y*4]);
   }
   set(ids[2],1);assert(result().includes('Отношение пока другое'));
   set(ids[0],valid[0][1]);set(ids[1],valid[0][0]);assert(result().includes('выполняют условие'));
  }
  ids=go(40);set(ids[1],2);assert(result().includes('второй магазин'));
  set(ids[0],1);set(ids[1],2);assert(result().includes('первый магазин'));
  for(const [i,marks,output]of [[41,[.20,.12],['80 м','30 м']],[42,[.025,.0375],['2,5 %','3,75 %']]]){
   ids=go(i);
   for(const [sample,expected]of marks.entries()){
    set(ids[0],sample);
    const road=f.q('#model [data-run]'),run=value(road,'x2')-value(road,'x1'),rise=value(road,'y1')-value(road,'y2');
    assert(Math.abs(rise/run-expected)<1e-9);
    set(ids[1],1);assert(result().includes(output[sample]));
   }
  }
  assert.equal(Object.values(f.state().tasks).some(t=>t.correct),false);
 }finally{f.close();}
});

test('finish the scale chapter in source order with changed cross products and groups in the hundred square',()=>{
 const f=fixture(null,null,true);
 try{
  f.nav('#home');assert.match(f.q('#main').textContent,/№28–56 со всеми подпунктами.*79/);
  const go=i=>{f.nav('#lesson/p16/'+i);f.click('[data-lesson-help="model"] > summary');return [...f.d.querySelectorAll('#model select')].map(n=>'#'+n.id);};
  const set=(id,to)=>f.event(id,String(to),'change'), result=()=>f.q('#model .pm-result').textContent;
  let ids=go(43);set(ids[1],1);assert(result().includes('0,0(3)'));set(ids[0],1);assert.equal(f.q(ids[1]).value,'0');set(ids[1],1);assert(result().includes('0,11(6)'));
  for(const i of [60,61,62,63,64,65,66,67]){
   ids=go(i);set(ids[1],1);set(ids[2],1);assert(result().includes('Произведения равны'),String(i));
   set(ids[0],1);assert.equal(f.q(ids[2]).value,'0');set(ids[2],1);assert(result().includes('Произведения различны'));
   set(ids[1],2);assert.equal(f.q(ids[2]).value,'0');set(ids[2],1);assert(result().includes('Произведения равны'));
  }
  ids=go(69);for(const i of [0,1,2]){set(ids[0],i);set(ids[2],1);assert(result().includes('60 км'));}
  set(ids[1],1);set(ids[2],1);assert(result().includes('90 км'));
  ids=go(70);const tableWidth=()=>Number(f.q('#model [data-furniture]').getAttribute('width'));
  const before=tableWidth();set(ids[1],2);set(ids[2],1);assert.equal(tableWidth(),before/4);assert(result().includes('2,5 × 2 см'));
  ids=go(71);set(ids[1],1);assert(result().includes('Круче первая'));set(ids[0],1);set(ids[1],1);assert(result().includes('Круче вторая'));
  const incline=el=>(Number(el.getAttribute('y1'))-Number(el.getAttribute('y2')))/(Number(el.getAttribute('x2'))-Number(el.getAttribute('x1')));
  assert(Math.abs(incline(f.q('#model [data-ladder="2"]'))-2.1/1.4)<1e-10);
  f.nav('#lesson/p16/75');assert.equal(f.q('.navigation button:last-child').dataset.index,'76');
  ids=go(77);assert.equal(f.d.querySelectorAll('#task-figure [data-hundred-number]').length,100);set(ids[0],8);set(ids[1],8);set(ids[3],1);assert(result().includes('89 + 100 = 189'));
  set(ids[2],1);assert.equal(f.q(ids[3]).value,'0');set(ids[3],1);assert(result().includes('90 + 99 = 189'));
  ids=go(78);set(ids[0],7);set(ids[1],7);const groups=new Set();
  for(let i=0;i<8;i++){
   set(ids[2],i);set(ids[3],1);
   const numbers=[...f.d.querySelectorAll('#model [data-in-group="true"]')].map(el=>Number(el.dataset.cellNumber));
   assert.equal(numbers.length,3);assert.equal(numbers.reduce((a,b)=>a+b),267);groups.add(numbers.join(','));assert(result().includes('= 267'));
  }
  assert.equal(groups.size,8);
  assert.equal(Object.values(f.state().tasks).some(t=>t.correct),false);
 }finally{f.close();}
});

test('keep unlike powers apart, cancel entire groups and substitute a fresh pair of values',()=>{
 const f=fixture(null,null,true);
 try{
  f.nav('#lesson/p34/66');assert.equal(f.q('.navigation a').hash,'#lesson/p35/0');
  const go=i=>{f.nav('#lesson/p35/'+i);f.click('[data-lesson-help="model"] > summary');return [...f.d.querySelectorAll('#model select')].map(n=>'#'+n.id);};
  const set=(id,v)=>f.event(id,String(v),'change'),result=()=>f.q('#model .pm-result').textContent;
  for(const index of [0,1,2,3]){const previous=go(index);assert.equal(previous.length,2);assert.equal(f.q(previous[0]).value,'3');}
  let ids=go(10);assert.deepEqual([...f.d.querySelectorAll('#model [data-symbol]')].map(e=>e.dataset.symbol),['x²y','xy²']);
  assert.match(f.q('#model [data-symbol="x²y"]').textContent,/−3\/10; 5/);set(ids[2],1);assert(result().includes('47/10'));
  set(ids[0],1);assert.equal(f.q(ids[2]).value,'0');set(ids[2],1);assert(result().includes('-11/10'));
  set(ids[1],1);set(ids[2],1);assert(result().includes('-1/10'));
  ids=go(17);set(ids[2],1);assert(result().includes('0.'));set(ids[0],1);set(ids[2],1);assert(result().includes('1/2'));
  ids=go(18);set(ids[2],2);assert(result().includes('выражения: -6'));set(ids[1],1);set(ids[2],2);assert(result().includes('выражения: 12'));
  ids=go(19);set(ids[2],2);assert(result().includes('выражения: 16/5'));set(ids[1],1);set(ids[2],2);assert(result().includes('выражения: 36/5'));
  ids=go(23);set(ids[2],1);assert(result().includes('0.'));set(ids[0],1);set(ids[2],1);assert(result().includes('-2.'));
  assert.equal(Object.values(f.state().tasks).some(t=>t.correct),false);
 }finally{f.close();}
});

test('compare exact quotients and the two products with fresh terms and every rearrangement',()=>{
 const f=fixture(null,null,true);
 try{
  const go=i=>{f.nav('#lesson/p17/'+i);f.click('[data-lesson-help="model"] > summary');return [...f.d.querySelectorAll('#model select')].map(n=>'#'+n.id);};
  const set=(id,v)=>f.event(id,String(v),'change'), result=()=>f.q('#model .pm-result').textContent;
  for(const i of [0,1]){const legacy=go(i);assert.equal(legacy.length,1);assert.equal(f.q(legacy[0]).value,'2');}
  let ids=go(6);set(ids[1],2);assert(result().includes('120 и 120'));assert.equal(f.q('#model [data-relation]').dataset.relation,'=');
  set(ids[0],1);assert.equal(f.q(ids[1]).value,'0');set(ids[1],2);assert(result().includes('120 и 123'));assert.equal(f.q('#model [data-relation]').dataset.relation,'≠');
  ids=go(16);set(ids[0],3);set(ids[1],8);set(ids[2],1);assert(result().includes('1/15 и 1/15'));
  set(ids[1],3);set(ids[2],2);assert(result().includes('два разных номера'));
  ids=go(17);set(ids[1],1);assert(result().includes('m × p = n × k'));set(ids[0],1);set(ids[1],1);assert(result().includes('4 × 15 = 6 × 10 = 60'));
  for(const index of [19,20,21,22]){
   ids=go(index);assert.equal(f.q(ids[0]).options.length,24);let accepted=0;
   for(let j=0;j<24;j++){set(ids[0],j);set(ids[2],2);if(result().includes('Равенство верно'))accepted++;}
   assert.equal(accepted,8);
  }
  ids=go(24);set(ids[0],7);set(ids[1],4);assert(result().includes('Обе равны 1/3'));set(ids[2],1);assert(result().includes('Обе равны 3'));
  assert.equal(Object.values(f.state().tasks).some(t=>t.correct),false);
 }finally{f.close();}
});

test('use each arithmetic spoke independently, balance story quantities and distinguish two squares',()=>{
 const f=fixture(null,null,true);
 try{
  const go=i=>{f.nav('#lesson/p35/'+i);f.click('[data-lesson-help="model"] > summary');return [...f.d.querySelectorAll('#model select')].map(n=>'#'+n.id);};
  const set=(id,v)=>f.event(id,String(v),'change'),result=()=>f.q('#model .pm-result').textContent;
  for(let i=25;i<29;i++){
   const ids=go(i);set(ids[1],1);set(ids[2],1);assert(result().includes('Корень подходит'));
   set(ids[0],1);set(ids[2],1);assert(result().includes('Значения различны'));set(ids[1],2);set(ids[2],1);assert(result().includes('Корень подходит'));
  }
  let ids=go(33);set(ids[1],12);set(ids[2],1);assert(result().includes('Всего упаковок 40'));set(ids[0],1);set(ids[1],20);set(ids[2],1);assert(result().includes('Всего упаковок 50'));
  ids=go(34);set(ids[1],12);set(ids[2],1);assert(result().includes('4,5 ч'));assert.deepEqual([...f.d.querySelectorAll('#model [data-km]')].map(n=>n.dataset.km),['84','80']);
  set(ids[0],1);set(ids[1],9);set(ids[2],1);assert(result().includes('5 ч'));
  for(const [index,dir,expected]of [[35,'out',['-2','-9','-4','-20','-28/5','-1/2','0','-39/7']],[36,'in',['-1/2','9/10','-3/2','2','-6','21/10','-1','0']],[37,'out',['4/5','-13/10','-1/25','-2','13/5','-3/5','-1/4','-1']]]){
   ids=go(index);assert.equal(f.d.querySelectorAll('#task-figure [data-direction="'+dir+'"]').length,8);
   for(const [i,want]of expected.entries()){set(ids[0],i+1);set(ids[2],1);assert(result().includes('Ответ '+want+'.'),index+'/'+i);}
   set(ids[1],1);assert.equal(f.q(ids[2]).value,'0');
  }
  ids=go(42);set(ids[1],2);assert(result().includes('-243/1000'));set(ids[0],1);set(ids[1],2);assert(result().includes('2187/1000'));
  ids=go(45);set(ids[1],2);assert.equal(f.d.querySelectorAll('#model [data-piece="uv"]').length,2);
  ids=go(47);set(ids[0],4);set(ids[1],1);set(ids[2],2);assert.equal(f.d.querySelectorAll('#model [data-piece="cut"]').length,2);
  set(ids[0],0);set(ids[1],0);set(ids[2],2);assert(result().includes('стягивается в точку'));
  set(ids[0],-3);set(ids[1],2);set(ids[2],1);assert.match(f.q('#model table').textContent,/\(a − b\)²25a² − b²5a² − 2ab \+ b²25/);
  assert.equal(Object.values(f.state().tasks).some(t=>t.correct),false);
 }finally{f.close();}
});

test('recognize a perpendicular from the correct vertex and distinguish the total percentage from its change',()=>{
 const f=fixture(null,null,true);
 try{
  const go=i=>{f.nav('#lesson/p35/'+i);f.click('[data-lesson-help="model"] > summary');return [...f.d.querySelectorAll('#model select')].map(n=>'#'+n.id);};
  const set=(id,v)=>f.event(id,String(v),'change'),result=()=>f.q('#model .pm-result').textContent;
  const delta=(line,axis)=>Number(line.getAttribute(axis+'2'))-Number(line.getAttribute(axis+'1'));
  function perpendicular(one,two){
   assert(Math.abs(delta(one,'x')*delta(two,'x')+delta(one,'y')*delta(two,'y'))<1e-7);
  }
  for(const [i,aux,side,mark]of [[53,'CL','AB','L'],[54,'DK','EF','K'],[55,'RS','PM','S'],[56,'ZT','XY','T']]){
   const ids=go(i);
   const height=f.q('#task-figure [data-aux="'+aux+'"]'),opposite=f.q('#task-figure [data-side="'+side+'"]');
   perpendicular(height,opposite);assert(f.q('#task-figure [data-right-at="'+mark+'"]'));
   if(i===54)assert(Number(height.getAttribute('x2'))<Math.min(Number(opposite.getAttribute('x1')),Number(opposite.getAttribute('x2'))));
   set(ids[0],2);
   if(i===55)assert(result().includes('RS не начинается в вершине MNP'));
   if(i===56)assert(result().includes('катеты XZ, YZ'));
  }
  let ids=go(58);
  for(const j of [0,1,2]){
   set(ids[0],j);set(ids[1],2);const model='#model ';
   assert.equal(f.d.querySelectorAll(model+'[data-altitude-from]').length,3);
   const center=f.q(model+'[data-orthocenter]');assert.equal(center.dataset.orthocenter,String(j));
   for(const [v,side]of [['A','BC'],['B','CA'],['C','AB']]){
    const altitude=f.q(model+'[data-altitude-from="'+v+'"]'),opp=f.q(model+'[data-side="'+side+'"]');
    perpendicular(altitude,opp);
    const hx=Number(center.getAttribute('cx'))-Number(altitude.getAttribute('x1')),hy=Number(center.getAttribute('cy'))-Number(altitude.getAttribute('y1'));
    assert(Math.abs(hx*delta(opp,'x')+hy*delta(opp,'y'))<1e-7);
   }
  }
  assert(result().includes('за пределами треугольника'));
  ids=go(49);set(ids[1],1);assert(result().includes('контрпример'));set(ids[0],2);set(ids[1],1);assert(result().includes('Один подходящий пример'));
  ids=go(62);set(ids[1],1);assert(result().includes('100/3%'));set(ids[0],120);assert.deepEqual([...f.d.querySelectorAll('#model [data-bar-value]')].map(e=>Number(e.dataset.barValue)),[120,40]);
  f.nav('#lesson/p35/67');f.event('#final-answer','25');f.submit('#answer-form');assert.match(f.q('.answer-form .feedback').textContent,/процент итоговой величины/);
  ids=go(73);set(ids[1],2);assert(f.q('#model table').textContent.replace(/\s/g,'').includes('15400'));set(ids[0],1);assert.equal(f.q(ids[1]).value,'0');set(ids[1],2);assert(f.q('#model table').textContent.replace(/\s/g,'').includes('27720'));
  assert.equal(Object.values(f.state().tasks).some(t=>t.correct),false);
 }finally{f.close();}
});

test('compare possible roots, fractions of the whole and historical currency units on the printed last page',()=>{
 const f=fixture(null,null,true);
 try{
  const go=i=>{f.nav('#lesson/p35/'+i);f.click('[data-lesson-help="model"] > summary');return [...f.d.querySelectorAll('#model select')].map(n=>'#'+n.id);};
  const set=(id,v)=>f.event(id,String(v),'change'),result=()=>f.q('#model .pm-result').textContent;
  let controls=go(79);set(controls[1],4);set(controls[2],2);
  assert(result().includes('Пробное число — корень'));assert.match(f.q('#model table').textContent,/3364805150/);
  set(controls[0],1);set(controls[1],3);set(controls[2],1);assert(result().includes('Пробное число — корень'));
  controls=go(82);set(controls[1],20);set(controls[2],1);assert(result().includes('Сумма 80 р.'));assert(result().includes('Все условия выполнены'));
  set(controls[0],1);set(controls[1],45);set(controls[2],1);assert(result().includes('Сумма 180 р.'));assert(result().includes('Все условия выполнены'));
  for(const [i,first,again]of [[92,'75 кг','50 кг'],[93,'6000 р.','10000 р.'],[94,'25%','30%']]){
   controls=go(i);set(controls[1],2);assert(result().replace(/\u00a0/g,'').includes(first),result());set(controls[0],1);assert.equal(f.q(controls[1]).value,'0');set(controls[1],2);assert(result().replace(/\u00a0/g,'').includes(again),result());
  }
  controls=go(95);set(controls[1],120);set(controls[2],1);assert(result().includes('2/3'));set(controls[0],1);set(controls[1],100);set(controls[2],1);assert(result().includes('5/9'));
  controls=go(96);assert(f.q('#task-figure .pcm-fraction-denominator').textContent.includes('80,64'));set(controls[1],5);assert(f.q('#model table').textContent.includes('Большая дробь1/50'));set(controls[0],1);set(controls[1],5);assert(f.q('#model table').textContent.includes('Большая дробь1/30'));
  f.nav('#lesson/p35/97');f.event('#final-answer','2');f.submit('#answer-form');assert.match(f.q('.answer-form .feedback').textContent,/Переведи её в копейки/);
  controls=go(97);set(controls[1],1);set(controls[2],1);assert(result().includes('1/2 копейки'));set(controls[0],1);set(controls[1],2);set(controls[2],1);assert(result().includes('3/4 копейки'));
  assert.equal(Object.values(f.state().tasks).some(t=>t.correct),false);
 }finally{f.close();}
});

test('decode all nine equalities and check each unknown in both oral proportions without assigning mastery',()=>{
 const f=fixture(null,null,true);
 try{
  const go=i=>{f.nav('#lesson/p17/'+i);f.click('[data-lesson-help="model"] > summary');return [...f.d.querySelectorAll('#model select')].map(n=>'#'+n.id);};
  const set=(id,v)=>f.event(id,String(v),'change'),out=()=>f.q('#model .pm-result').textContent;
  let fields=go(25),valid=0;
  for(let j=0;j<24;j++){set(fields[0],j);set(fields[2],2);if(out().includes('Равенство верно'))valid++;}
  assert.equal(valid,8);fields=go(26);assert.equal(f.d.querySelectorAll('#task-figure tbody tr').length,9);
  let word=[];for(let j=0;j<9;j++){set(fields[0],j);set(fields[1],1);if(out().includes('Буква входит в слово'))word.push(f.q(fields[0]).selectedOptions[0].textContent);}
  assert.deepEqual(word,['Р','Д','А','О','Х']);set(fields[1],2);const chord=f.q('#model [data-chord="AB"]');
  const x1=Number(chord.getAttribute('x1')),x2=Number(chord.getAttribute('x2')),y=Number(chord.getAttribute('y1'));
  assert(Math.abs(Math.hypot(x1-108,y-55)-43)<1e-8);assert(Math.abs(Math.hypot(x2-108,y-55)-43)<1e-8);assert.notEqual(y,55);
  for(const [i,before,after] of [[27,'12','15'],[28,'12/5','15/2'],[29,'20','15'],[30,'6','7'],[31,'120','100']]){
   fields=go(i);const select=(value)=>{const option=[...f.q(fields[1]).options].find(el=>el.textContent===value);assert(option);set(fields[1],option.value);};
   select(before);set(fields[2],1);assert(out().includes('Подстановка подходит.'),i);
   set(fields[0],1);assert.equal(f.q(fields[2]).value,'0');select(after);set(fields[2],2);assert(out().includes('Подстановка подходит.'),i);
   select('0');set(fields[2],1);if(i===27||i===31)assert.match(out(),/делителей равен нулю/);else assert.match(out(),/Значения различаются/);
  }
  assert.equal(Object.values(f.state().tasks).some(t=>t.correct),false);
 }finally{f.close();}
});

test('retain excluded denominators, both linked unknowns and the direction of a copier scale',()=>{
 const f=fixture(null,null,true);
 try{
  const go=i=>{f.nav('#lesson/p17/'+i);f.click('[data-lesson-help="model"] > summary');return [...f.d.querySelectorAll('#model select')].map(n=>'#'+n.id);};
  const set=(id,v)=>f.event(id,String(v),'change'),out=()=>f.q('#model .pm-result').textContent;
  let c=go(41);const select=(value)=>{const option=[...f.q(c[1]).options].find(el=>el.textContent===value);assert(option,value);set(c[1],option.value);};
  for(const forbidden of ['1/4','-4']){select(forbidden);set(c[2],1);assert(out().includes('не допускается'),forbidden);}
  select('64');set(c[2],2);assert(out().includes('Это корень.'));set(c[0],1);select('65');set(c[2],1);assert(out().includes('Это корень.'));select('5/4');set(c[2],2);assert(out().includes('не допускается'));
  c=go(43);set(c[1],2);assert(out().includes('= 32.'));assert(out().includes('= 12.'));set(c[0],1);set(c[1],2);assert(out().includes('= 20.'));assert(out().includes('= 15/2.'));
  c=go(44);set(c[1],2);assert(out().includes('= 2/5.'));assert(out().includes('= 1/5.'));set(c[0],1);set(c[1],2);assert(out().includes('= 3/5.'));assert(out().includes('= 3/10.'));
  c=go(45);let retained=0;for(let j=1;j<=8;j++){set(c[0],j);set(c[1],1);if(out().includes('Обе дроби равны нулю'))retained++;}assert.equal(retained,2);
  for(const [i,original,copy,again]of [[46,12.5,7.5,15],[47,8,4.8,12]]){
   c=go(i);set(c[1],1);const spans=()=>[...f.d.querySelectorAll('#model [data-length]')];
   const [a,b]=spans();assert.equal(Number(a.dataset.length),original);assert.equal(Number(b.dataset.length),copy);const len=v=>Number(v.getAttribute('x2'))-Number(v.getAttribute('x1'));assert(Math.abs(len(b)/len(a)-.6)<1e-10);
   set(c[0],1);set(c[1],1);assert.equal(Number(spans()[0].dataset.length),again);
  }
  assert.equal(Object.values(f.state().tasks).some(t=>t.correct),false);
 }finally{f.close();}
});

test('measure five corresponding sides and three different chord constructions before making a conjecture',()=>{
 const f=fixture(null,null,true);
 try{
  const go=i=>{f.nav('#lesson/p17/'+i);f.click('[data-lesson-help="model"] > summary');return [...f.d.querySelectorAll('#model select')].map(n=>'#'+n.id);};
  const set=(id,v)=>f.event(id,String(v),'change'),out=()=>f.q('#model .pm-result').textContent;
  let c=go(49);
  assert.equal(f.d.querySelectorAll('#task-figure [data-given="no"]').length,4);
  const verify=(factor)=>{
   const [a,b]=f.d.querySelectorAll('#model .pcm-pentagon-pair svg');assert(a&&b);
   for(const side of ['AB','BC','CD','DE','EA']){
    const l=a.querySelector('[data-side="'+side+'"]'),r=b.querySelector('[data-side="'+side+'"]');
    const span=n=>Math.hypot(Number(n.getAttribute('x2'))-Number(n.getAttribute('x1')),Number(n.getAttribute('y2'))-Number(n.getAttribute('y1')));
    assert(Math.abs(span(l)/18-Number(l.dataset.length))<1e-8);
    assert(Math.abs(span(r)/span(l)-factor)<1e-8);
   }
  };
  set(c[1],1);verify(1.6);assert(out().includes('160%'));set(c[0],1);set(c[1],1);verify(1.2);assert(out().includes('120%'));
  c=go(50);set(c[1],2);assert(out().includes('Золота 32 г, серебра 80 г.'));set(c[0],1);set(c[1],2);assert(out().includes('Золота 24 г, серебра 60 г.'));
  for(const [i,right,again]of [[52,'31,4 см','44,0 см'],[53,'19,1 см','28,0 см']]){
   c=go(i);set(c[1],2);assert(out().includes(right));set(c[0],1);set(c[1],2);assert(out().includes(again));
  }
  c=go(55);
  for(const [j,m]of [16,9,144].entries()){
   set(c[0],j);set(c[1],2);const frame=f.q('#model .pm-visual'),circle=frame.querySelector('circle[data-circle]'),cx=Number(circle.getAttribute('cx')),cy=Number(circle.getAttribute('cy')),r=Number(circle.getAttribute('r'));
   const coord=k=>{const p=frame.querySelector('[data-point="'+k+'"]');return [Number(p.getAttribute('cx')),Number(p.getAttribute('cy'))];};
   const lengths=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);const o=coord('O');for(const k of 'ABCD')assert(Math.abs(lengths(coord(k),[cx,cy])-r)<1e-8);
   assert(Math.abs(lengths(coord('A'),o)*lengths(coord('B'),o)-lengths(coord('C'),o)*lengths(coord('D'),o))<1e-7);
   assert(out().includes('= '+m+' см².'));assert(out().includes('требует доказательства'));
  }
  c=go(58);set(c[0],0);set(c[1],2);assert(out().includes('(a + b)y'));assert(f.q('#model table').textContent.includes('4,6'));
  assert.equal(Object.values(f.state().tasks).some(t=>t.correct),false);
 }finally{f.close();}
});

test('distinguish percent of time from percent of speed and test the zero boundary of a quantified comparison',()=>{
 const f=fixture(null,null,true);
 try{
  const go=i=>{f.nav('#lesson/p17/'+i);f.click('[data-lesson-help="model"] > summary');return [...f.d.querySelectorAll('#model select')].map(n=>'#'+n.id);};
  const set=(id,v)=>f.event(id,String(v),'change'),out=()=>f.q('#model .pm-result').textContent;
  let c=go(59);set(c[1],2);assert(out().includes('контрпример'));set(c[0],1);set(c[1],2);assert(out().includes('одного совпадения мало'));
  c=go(68);set(c[1],2);assert(out().includes('Строгое неравенство здесь ложно'));set(c[0],1);set(c[1],2);assert(out().includes('разность c/30 положительна'));
  c=go(69);set(c[2],1);assert(out().includes('отношение 80%'));assert(out().includes('изменения 20%'));set(c[1],1);set(c[2],1);assert(out().includes('отношение 125%'));assert(out().includes('изменения 25%'));
  c=go(74);set(c[1],2);assert(out().includes('Уменьшение на 200/3%'));set(c[0],120);set(c[1],2);assert(out().includes('Новое число 40'));
  c=go(78);set(c[1],2);assert(out().includes('3/2 раза'));set(c[0],2);set(c[1],2);assert(out().includes('5/3 раза'));
  c=go(79);set(c[2],2);assert(out().includes('встречи 15 мин'));set(c[0],1);set(c[2],2);assert(out().includes('встречи 50/3 мин'));set(c[1],1);set(c[2],2);assert(out().includes('встречи 50/3 мин'));
  set(c[1],2);set(c[2],2);assert(out().includes('встречи 160/9 мин'));set(c[0],0);set(c[2],2);assert(out().includes('встречи 120/7 мин'));
  c=go(80);set(c[1],2);assert(out().includes('пешехода 22/5 км/ч, велосипедиста 77/5'));set(c[0],2);set(c[1],2);assert(out().includes('пешехода 6 км/ч, велосипедиста 15'));
  assert.equal(Object.values(f.state().tasks).some(t=>t.correct),false);
 }finally{f.close();}
});

test('draw actual moving boats, a quadratic fall curve and two source constructions at the correct scale',()=>{
 const f=fixture(null,null,true);
 try{
  const go=i=>{f.nav('#lesson/p17/'+i);f.click('[data-lesson-help="model"] > summary');return [...f.d.querySelectorAll('#model select')].map(n=>'#'+n.id);};
  const set=(id,v)=>f.event(id,String(v),'change'),out=()=>f.q('#model .pm-result').textContent;
  for(const [j,dist]of [[81,36],[82,84],[83,56],[84,64]]){
   const c=go(j);set(c[1],2);set(c[2],1);
   const pos=[...f.d.querySelectorAll('#model [data-boat]')].map(e=>Number(e.dataset.position));assert.equal(pos[1]-pos[0],dist);assert(out().includes('катерами '+dist+' км.'));
   set(c[0],1);set(c[1],4);set(c[2],1);assert(f.q('#model [data-boat="II"]'));
  }
  let c=go(85);assert.equal(f.d.querySelectorAll('#model [data-time]').length,6);set(c[0],5);set(c[1],2);assert(out().includes('31,25 м'));assert.equal(f.q('#model [data-preview-height]').dataset.previewHeight,'31.25');
  assert(f.q('#model [data-curve="5t²"]'));c=go(86);assert.equal(f.d.querySelectorAll('#task-figure tbody tr').length,12);
  const letters=[];for(let j=0;j<12;j++){set(c[0],j);set(c[1],1);if(out().includes('Буква входит в название'))letters.push(f.q(c[0]).selectedOptions[0].textContent);}
  assert.deepEqual(letters,['А','О','Н','К','Р']);set(c[1],2);assert(f.q('#model table').textContent.includes('ЧехияCZK'));assert.equal(f.q('#model .pm-visual a').target,'_blank');
  c=go(91);set(c[1],1);assert.equal(Number(f.q('#model [data-segment="AC"]').dataset.cm),9);assert.equal(Number(f.q('#model [data-segment="BD"]').dataset.cm),4.905);
  c=go(92);set(c[1],1);assert.equal(Number(f.q('#model [data-segment="NK"]').dataset.cm),5);assert.equal(Number(f.q('#model [data-segment="LM"]').dataset.cm),3);assert.equal(Number(f.q('#model [data-segment="LE"]').dataset.cm),2);
  for(const id of ['LE','MF']){const s=f.q('#model [data-segment="'+id+'"]');assert.equal(s.getAttribute('x1'),s.getAttribute('x2'));}
  assert.equal(Object.values(f.state().tasks).some(t=>t.correct),false);
 }finally{f.close();}
});

test('complete the proportion chapter, including reciprocal areas, a right angle and every sporting outcome',()=>{
 const f=fixture(null,null,true);
 try{
  const go=i=>{f.nav('#lesson/p17/'+i);f.click('[data-lesson-help="model"] > summary');return [...f.d.querySelectorAll('#model select')].map(n=>'#'+n.id);};
  const set=(id,v)=>f.event(id,String(v),'change'),out=()=>f.q('#model .pm-result').textContent;
  let c=go(93);set(c[1],2);assert(out().includes('площадь 567 см²'));c=go(94);set(c[1],2);assert(out().includes('встречи 1 ч'));set(c[0],2);set(c[1],2);assert(out().includes('встречи 4/3 ч'));
  c=go(95);for(const area of [12,24]){set(c[0],area);set(c[1],5);set(c[2],1);
   const p=[...f.d.querySelectorAll('#model [data-side-a]')];assert.equal(p.length,7);
   p.forEach(n=>assert.equal(Number(n.dataset.sideA)*Number(n.dataset.sideB),area));assert.equal(Number(f.q('#model [data-selected-b]').dataset.selectedB),area/8);
  }
  c=go(96);
  for(const r of [3,4,5])for(const v of [30,60,90,120,150,210,270,315]){
   set(c[0],r);set(c[1],v);set(c[2],1);assert(f.q('#model [data-right-angle="C"]'));
   const pos=name=>{const p=f.q('#model [data-point="'+name+'"]');return [Number(p.getAttribute('cx')),Number(p.getAttribute('cy'))];};
   const [a,b,c0,o]=['A','B','C','O'].map(pos),dx=a[0]-c0[0],dy=a[1]-c0[1];assert(Math.abs(dx*(b[0]-c0[0])+dy*(b[1]-c0[1]))<1e-7);assert(Math.abs(Math.hypot(c0[0]-o[0],c0[1]-o[1])-11.5*r)<1e-7);
  }
  c=go(98);assert.equal(f.d.querySelectorAll('#task-figure tbody tr').length,4);
  for(const [i,val]of [5,1,15,3].entries()){set(c[0],i);set(c[1],2);assert(out().includes('= '+val+'.'));}
  c=go(100);set(c[1],96);set(c[2],2);assert(out().includes('1023457896'));set(c[0],18);set(c[2],2);assert(out().includes('1023456798'));
  f.nav('#lesson/p17/100');f.event('#final-answer','1023456789');f.submit('#answer-form');assert.match(f.q('.answer-form .feedback').textContent,/89/);
  c=go(101);set(c[0],9);set(c[2],1);assert(out().includes('в точности совпали'));set(c[1],3);set(c[2],1);assert(out().includes('не совпадают'));
  c=go(102);for(const next of [0,1]){
   let good=[];set(c[1],next);for(let i=0;i<24;i++){set(c[0],i);set(c[2],1);if(out().includes('Порядок удовлетворяет'))good.push(f.q(c[0]).selectedOptions[0].textContent);}
   assert.deepEqual(good,[next?'Б · В · Г · А':'А · В · Г · Б']);
  }
  assert.equal(Object.values(f.state().tasks).some(t=>t.correct),false);
 }finally{f.close();}
});

test('order all printed equation types and exclude undefined substitutions before counting roots',()=>{
 const f=fixture(null,null,true);
 try{
  const go=i=>{f.nav('#lesson/p36/'+i);f.click('[data-lesson-help="model"] > summary');return [...f.d.querySelectorAll('#model select')].map(n=>'#'+n.id);};
  const set=(id,v)=>f.event(id,String(v),'change'),out=()=>f.q('#model .pm-result').textContent;
  for(const [j,str]of [[4,'равенство чисел'],[5,'Это уравнение'],[6,'выражение без равенства'],[7,'Это неравенство'],[8,'Это уравнение']]){
   const c=go(j);set(c[1],2);assert(out().includes(str),j);set(c[0],1);set(c[1],2);assert(out().includes(str),j);
  }
  let c=go(9);set(c[1],2);assert(out().includes('не является корнем'));const index=(val)=>[...f.q(c[0]).options].find(o=>o.textContent===val).value;
  set(c[0],index('-2'));set(c[1],2);assert(out().includes('является корнем'));assert(!out().includes('не является'));
  c=go(20);set(c[1],2);assert(out().includes('не допускается'));set(c[0],5);set(c[1],2);assert(out().includes('Выбранное число подходит'));
  c=go(21);for(const x of [-3,6]){set(c[0],x);set(c[1],2);assert(out().includes('Выбранное число подходит'));}set(c[0],0);set(c[1],2);assert(out().includes('не допускается'));
  c=go(22);const good=[];for(let x=-6;x<=7;x++){set(c[0],x);set(c[1],2);if(out().includes('Выбранное число подходит'))good.push(x);}assert.deepEqual(good,[-4,-2,0,1,3]);
  assert.equal(Object.values(f.state().tasks).some(t=>t.correct),false);
 }finally{f.close();}
});

test('distinguish a proof from an example, filter the entire root set and read inverse chains in order',()=>{
 const f=fixture(null,null,true);
 try{
  const go=i=>{f.nav('#lesson/p36/'+i);f.click('[data-lesson-help="model"] > summary');return [...f.d.querySelectorAll('#model select')].map(n=>'#'+n.id);};
  const set=(id,v)=>f.event(id,String(v),'change'),out=()=>f.q('#model .pm-result').textContent;
  for(const i of [23,24,25,26,27,28,29]){
   const c=go(i);for(const x of [-4,0,3]){set(c[0],x);set(c[1],2);assert(out().includes(i<=26?'части равны':'части различаются'));assert(f.q('#model table'));}
   assert(f.q('[data-action="record-manual"]'));
  }
  for(const [j,good] of [[30,[]],[31,['-5','5']],[32,[]],[33,['-4/5']],[34,['1','3']]]){
   const c=go(j),hits=[];for(const option of [...f.q(c[0]).options]){set(c[0],option.value);set(c[1],1);if(out().includes('число подходит.'))hits.push(option.textContent);}
   assert.deepEqual(hits,good);
  }
  let c=go(35);
  for(const vi of [0,1])for(const [i,s]of (vi?['-3, 0, 5/2','-3, 0','корней нет','5/2','0, 5/2']:['-2, 0, 5/3','-2, 0','корней нет','5/3','0, 5/3']).entries()){
   set(c[0],vi);set(c[1],i);set(c[2],2);assert(out().includes(s+'.'),[vi,i,out()]);assert.equal(f.d.querySelectorAll('#model tbody tr').length,3);
  }
  c=go(40);assert.equal(f.d.querySelectorAll('#task-figure tbody tr').length,6);
  for(const start of [36,48,72]){let x=start;for(const [i,div]of [3,.01,10,2,5,4].entries()){x/=div;set(c[0],start);set(c[1],i+1);set(c[2],1);assert(out().replace(/[\s\u00a0\u202f]/g,'').includes('шага:'+String(x).replace('.',',')+'.'),[start,i,x,out()]);}}
  for(const [i,samples]of [['-1/2','1/3',null],['2','-3','0'],['1/2','-1/3',null],['1/2','-1/3',null],['2','3','0'],['-2','-3','0'],['4','9','0'],['-4','-9','0']].entries()){
   c=go(41+i);for(const [j,x] of [-2,3,0].entries()){set(c[0],x);set(c[1],1);assert(out().includes(samples[j]===null?'делить на ноль':'выражения: '+samples[j]+'.'),[i,x,out()]);}
  }
  assert.equal(Object.values(f.state().tasks).some(t=>t.correct),false);
 }finally{f.close();}
});

test('finish the equation chapter with counterexamples, natural trials and three exact years of capital',()=>{
 const f=fixture(null,null,true);
 try{
  const go=i=>{f.nav('#lesson/p36/'+i);f.click('[data-lesson-help="model"] > summary');return [...f.d.querySelectorAll('#model select')].map(n=>'#'+n.id);};
  const set=(id,v)=>f.event(id,String(v),'change'),out=()=>f.q('#model .pm-result').textContent;
  let c=go(49);set(c[0],0);set(c[1],1);assert(out().includes('не определена'));
  c=go(50);set(c[0],-3);set(c[1],0);set(c[2],1);assert(out().includes('контрпример'));set(c[1],2);set(c[2],1);assert(out().includes('отлично от нуля'));
  c=go(51);set(c[0],-3);set(c[1],1);assert(out().includes('свидетель существования'));c=go(52);set(c[0],0);set(c[1],1);assert(out().includes('0 > 0 — неверно'));
  for(const [j,source,extra]of [[53,'-3','2'],[54,'5/2','4'],[65,'2','3']]){
   c=go(j);
   for(const [i,w]of [source,extra].entries()){set(c[0],i);const index=[...f.q(c[1]).options].find(o=>o.textContent===w).value;set(c[1],index);set(c[2],3);assert(out().includes(w+' подходит.'));}
  }
  c=go(54);set(c[1],1);set(c[2],3);assert(out().includes('Ноль исключён'));
  for(const [j,orig,extra]of [[55,4,5],[56,14,11],[63,12,13],[64,5,6]]){
   c=go(j);for(const [i,x]of [orig,extra].entries()){set(c[0],i);set(c[1],x);set(c[2],2);assert(out().includes('Число подходит.'));
    if(j===56)assert.deepEqual([...f.d.querySelectorAll('#model tbody tr')].map(row=>row.cells[1].textContent),['50','88','108','104','70']);
   }
  }
  for(const [j,matches] of [[57,['19/16']],[58,['-9','-5','-3','-1','0','19/16','9/2','9']],[59,[]],[60,['-9','9']],[61,['9/2']],[62,['-5','-1']]]){
   c=go(j);const found=[];for(const o of [...f.q(c[0]).options]){set(c[0],o.value);set(c[1],1);if(out().includes('Получили равенство.'))found.push(o.textContent);}
   assert.deepEqual(found,matches);
  }
  c=go(66);for(const [spend,start,last]of [[100,1480,2960],[50,740,1480]]){
   set(c[0],spend);set(c[1],start);set(c[2],3);assert(out().includes('Кандидат подходит.'));const rows=[...f.d.querySelectorAll('#model tbody tr')];assert.equal(rows.length,3);assert.equal(rows[2].cells[3].textContent,String(last));
  }
  set(c[0],100);set(c[1],1000);set(c[2],3);assert(out().includes('Кандидат не подходит.'));
  assert.equal(Object.values(f.state().tasks).some(t=>t.correct),false);
 }finally{f.close();}
});

test('construct all eight valid source rearrangements and compare rates in all four settings',()=>{
 const f=fixture(null,null,true);
 try{
  const go=i=>{f.nav('#lesson/p18/'+i);f.click('[data-lesson-help="model"] > summary');return [...f.d.querySelectorAll('#model select')].map(n=>'#'+n.id);};
  const set=(id,v)=>f.event(id,String(v),'change'),out=()=>f.q('#model .pm-result').textContent;
  for(const j of [0,1,2,6,7,8,9,10,11,12,13,14,15,16]){
   const c=go(j);
   for(const second of [0,1]){
    set(c[1],second);
    const orders=j===6&&second===0?Array.from({length:24},(_,i)=>i):[0,1];
    const valid=orders.filter(i=>{set(c[0],i);set(c[2],1);return out().includes('сохраняет исходные пары');});
    assert.equal(valid.length,orders.length===24?8:1,j);
    set(c[2],2);const tab=f.d.querySelectorAll('#model table')[1];assert.equal(tab.tBodies[0].rows.length,8);
   }
  }
  for(const j of [17,18,19,20]){
   const c=go(j);set(c[1],2);assert(out().includes('5/2 раза'));const before=f.q('#model tbody').textContent;
   set(c[0],1);assert(!out().includes('раза'));set(c[1],2);assert(out().includes('5/2 раза'));assert.notEqual(f.q('#model tbody').textContent,before);
  }
  assert.equal(Object.values(f.state().tasks).some(t=>t.correct),false);
 }finally{f.close();}
});

test('prove derived proportions on the common domain and measure corresponding ray segments',()=>{
 const f=fixture(null,null,true);
 try{
  const go=i=>{f.nav('#lesson/p18/'+i);f.click('[data-lesson-help="model"] > summary');return [...f.d.querySelectorAll('#model select')].map(n=>'#'+n.id);};
  const set=(id,v)=>f.event(id,String(v),'change'),out=()=>f.q('#model .pm-result').textContent;
  for(const [rule,j]of [4,21,22,23,24,25,26].entries()){
   const c=go(j);
   for(const i of [0,1,2,3,4,5]){
    set(c[0],i);set(c[1],1);const rows=[...f.d.querySelectorAll('#model tbody tr')],message=rows.map(row=>row.cells[2].textContent);
    assert.equal(rows.length,rule===6?3:2);
    if(i===0||i===1)assert(message.every(m=>m.includes(i===0?'Равенство верно':'Равенство ложно')));
    if(i===5)assert(message[0].includes('нулевой знаменатель'));
    if(i===2&&[4,5,6].includes(rule))assert(message[1].includes('нулевой знаменатель'));
    if(i===3&&[3,6].includes(rule))assert(message.some(m=>m.includes('нулевой знаменатель')));
   }
  }
  for(const j of [3,27,28,29]){
   const c=go(j);set(c[0],1);
   for(const op of [0,1,2]){set(c[1],op);set(c[2],1);assert(out().includes('Равенство верно'));}
  }
  for(const j of [30,31,5]){
   const c=go(j);
   for(const [vi,k]of [1.5,2,2.5].entries()){
    set(c[0],50);set(c[1],vi);set(c[2],2);
    const rays=['B','C'].map(v=>f.q('#model [data-measured-branch="'+v+'"]'));
    const vec=l=>[l.getAttribute('x2')-l.getAttribute('x1'),l.getAttribute('y2')-l.getAttribute('y1')],len=l=>Math.hypot(...vec(l));assert(Math.abs(len(rays[0])/len(rays[1])-k)<1e-9);
    const cuts=[...f.d.querySelectorAll('#model [data-transversal]')].map(vec);assert.equal(cuts.length,3);for(const t of cuts.slice(1))assert(Math.abs(cuts[0][0]*t[1]-cuts[0][1]*t[0])<1e-8);
   }
  }
  const c=go(32),correct=[];assert.equal(f.d.querySelectorAll('#task-figure tbody tr').length,9);
  for(let i=0;i<9;i++){set(c[0],i);set(c[1],1);if(out().includes('буква входит'))correct.push(f.q(c[0]).selectedOptions[0].textContent);}
  assert.equal(correct.join(''),'ФАЛЕС');set(c[1],2);assert(f.q('#model .pm-visual a').href.startsWith('https://mathshistory.st-andrews.ac.uk/'));
  assert.equal(Object.values(f.state().tasks).some(t=>t.correct),false);
 }finally{f.close();}
});

test('repair oral proportions, check six different equations and distinguish both percentage bases',()=>{
 const f=fixture(null,null,true);
 try{
  const go=i=>{f.nav('#lesson/p18/'+i);f.click('[data-lesson-help="model"] > summary');return [...f.d.querySelectorAll('#model select')].map(n=>'#'+n.id);};
  const set=(id,v)=>f.event(id,String(v),'change'),out=()=>f.q('#model .pm-result').textContent;
  for(const [k,j]of [33,34,35,36].entries()){
   const c=go(j);for(const fresh of [0,1])for(let op=0;op<4;op++){set(c[0],fresh);set(c[1],op);set(c[2],1);assert.equal(out().includes('Равенство получилось.'),op===[0,3,2,1][k]);}
  }
  for(const [k,j]of [37,38,39,40,41,42,43,44].entries()){
   const c=go(j),expected=['24','35/3','14/5','6/5','2/11','45/2','1/2','3/10'][k];
   const find=v=>[...f.q(c[1]).options].find(o=>o.textContent===v).value;set(c[1],find(expected));set(c[2],2);assert(out().includes('подстановка подходит')||out().includes('Подстановка подходит'),out());
  }
  for(const [k,j]of [45,46,47,48,49,50].entries()){
   const c=go(j),expected=['16/5','15','1/4','25','2','3/8'][k];const find=v=>[...f.q(c[1]).options].find(o=>o.textContent===v).value;
   set(c[1],find(expected));set(c[2],1);assert(out().includes('Это корень.'));
   if(k===0||k===2){set(c[1],find(k===0?'0':'-3/4'));set(c[2],2);assert(out().includes('не допускается'));}
  }
  for(const [j,a]of [[51,'4/5'],[52,'2']]){const c=go(j),idx=[...f.q(c[1]).options].find(o=>o.textContent===a).value;set(c[1],idx);set(c[2],3);assert(out().includes(a+' подходит.'));}
  for(const [j,total]of [[53,6],[54,75]]){const c=go(j);for(const fresh of [0,1]){set(c[0],fresh);set(c[1],2);assert(out().includes('Целое '+(total*(1+fresh))+' '));}}
  let c=go(55);set(c[1],2);assert(out().includes('25% и 20%'));set(c[0],1);set(c[1],2);assert(out().includes('25% и 15%'));
  c=go(56);set(c[1],2);assert(out().includes('рост 8%'));set(c[0],1);set(c[1],2);assert(out().includes('уровень тот же'));
  c=go(57);set(c[1],2);assert(out().includes('снижение 10%'));set(c[0],1);set(c[1],2);assert(out().includes('уровень тот же'));
  assert.equal(Object.values(f.state().tasks).some(t=>t.correct),false);
 }finally{f.close();}
});

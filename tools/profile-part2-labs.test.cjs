'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const Labs=require('../ege-profil/part-two/models.js');
function storage(initial={}){const values=new Map(Object.entries(initial)),writes=[];return{getItem:k=>values.has(k)?values.get(k):null,setItem(k,v){writes.push(k);values.set(k,v);},values,writes};}
const key=n=>'mathexam.profilePartTwoLab.v1.'+n;

test('seven optional explorations cover the seven exam lines without course-credit writes',()=>{
  assert.deepEqual(Object.keys(Labs.labs).map(Number),[14,15,16,17,18,19,20]);
  for(const n of [14,15,16,17,18,19,20]){
    const l=Labs.labs[n];assert.ok(l.question&&l.explanation&&l.transfer&&l.target);assert.ok(l.choices.includes(l.answer));
    const s=storage({'mathexam.profileStart2027.v1':'{"unchanged":true}'}),store=Labs.createStore(n,s);
    store.write({prediction:{value:l.choices[0],correct:false}});
    assert.deepEqual(s.writes,[key(n)]);assert.equal(s.values.get('mathexam.profileStart2027.v1'),' {"unchanged":true}'.trim());
  }
});

test('root selection counts angles through multiple turns rather than distinct circle positions',()=>{
  for(let b=1;b<=4;b++){
    const v=Labs.evaluate(14,b),expected=[];
    // Enumerate multiples of π/6 and independently filter by sine value
    // and the closed interval, rather than copying the solution families.
    for(let k=0;k<=6*b;k++)if(Math.abs(Math.sin(k*Math.PI/6)-.5)<1e-10)expected.push(k/6);
    assert.deepEqual(v.roots,expected);assert.equal(v.count,expected.length);
    assert.ok(v.roots.every(x=>x>=0&&x<=b));
  }
  assert.equal(Labs.evaluate(14,3).count,4);
});

test('projection lengths obey Pythagoras for every allowed height',()=>{
  for(let h=2;h<=8;h++){const v=Labs.evaluate(15,h);assert.equal(v.base,6);assert.equal(v.height,h);assert.ok(Math.abs(v.length*v.length-36-h*h)<1e-10);assert.ok(v.length>h&&v.length>6);}
  assert.equal(Labs.evaluate(15,8).length,10);
});

test('projection drawing uses one scale and its drawn hypotenuse agrees with the givens',()=>{
  for(let h=2;h<=8;h++){
    const dom=new JSDOM(Labs.scene(15,h).svg),lines=[...dom.window.document.querySelectorAll('line')].slice(0,3);
    const vectors=lines.map(l=>[Number(l.getAttribute('x2'))-Number(l.getAttribute('x1')),Number(l.getAttribute('y2'))-Number(l.getAttribute('y1'))]);
    const lengths=vectors.map(([x,y])=>Math.hypot(x,y));
    assert.ok(Math.abs(lengths[0]/lengths[1]-6/h)<1e-12,'equal coordinate scale for AH=6 and BH='+h);
    assert.equal(vectors[0][0]*vectors[1][0]+vectors[0][1]*vectors[1][1],0,'AH perpendicular BH');
    assert.ok(Math.abs(lengths[2]/lengths[0]-Math.sqrt(36+h*h)/6)<1e-12,'hypotenuse to base ratio');
    dom.window.close();
  }
});

test('double roots preserve signs and ordinary roots change signs',()=>{
  for(const m of [1,2]){
    const v=Labs.evaluate(16,m),expanded=m===1?x=>x*x+x-2:x=>x*x*x-3*x+2;
    assert.deepEqual(v.signs,v.samples.map(x=>Math.sign(expanded(x))));
    assert.equal(expanded(-2),0);assert.equal(expanded(1),0);
    assert.notEqual(Math.sign(expanded(-2-.01)),Math.sign(expanded(-2+.01)));
    assert.equal(Math.sign(expanded(1-.01))===Math.sign(expanded(1+.01)),m===2);
  }
});

test('bounded quadratic optimum respects endpoints and remains above every feasible sampled value',()=>{
  for(let L=1;L<=7;L++){
    const v=Labs.evaluate(17,L);assert.ok(v.x>=0&&v.x<=L);assert.equal(v.maximum,8*v.x-v.x*v.x);
    for(let j=0;j<=700;j++){const x=L*j/700;assert.ok(8*x-x*x<=v.maximum+1e-10);}
    assert.equal(v.x,L<4?L:4);
  }
  assert.equal(Labs.evaluate(17,3).maximum,15);assert.equal(Labs.evaluate(17,6).maximum,16);
});

test('similar triangles keep equal length scale and square area scale',()=>{
  for(let k=.5;k<=3;k+=.5){const v=Labs.evaluate(18,k);assert.equal(v.base/4,k);assert.equal(v.height/3,k);assert.equal(v.area,v.base*v.height/2);assert.equal(v.ratio,v.area/6);}
  assert.equal(Labs.evaluate(18,1.5).ratio,9/4);
});

test('absolute-distance plateau distinguishes no solution, interval and two points exactly',()=>{
  for(let a=0;a<=4;a+=.5){
    const v=Labs.evaluate(19,a);
    if(a<2){assert.equal(v.count,0);for(let i=-300;i<=300;i++)assert.ok(Math.abs(i/100-1)+Math.abs(i/100+1)>a);}
    else if(a===2){assert.equal(v.count,Infinity);for(let i=-100;i<=100;i++)assert.equal(Math.abs(i/100-1)+Math.abs(i/100+1),2);}
    else{assert.equal(v.count,2);assert.equal(new Set(v.roots).size,2);for(const x of v.roots)assert.equal(Math.abs(x-1)+Math.abs(x+1),a);}
  }
});

test('the parabola and distance graph have square grid cells and preserve their marked coordinates', () => {
  for (const [exam, parameter, expected] of [[17, 6, [[4, 16]]], [19, 3, [[-1.5, 3], [1.5, 3]]]]) {
    const dom = new JSDOM(Labs.scene(exam, parameter).svg);
    const doc = dom.window.document;
    const n = (element, name) => Number(element.getAttribute(name));
    const grid = [...doc.querySelectorAll('line[stroke="#e1ebe8"]')];
    const vertical = grid.filter(l => n(l, 'x1') === n(l, 'x2'));
    const horizontal = grid.filter(l => n(l, 'y1') === n(l, 'y2'));
    const unit = n(vertical[1], 'x1') - n(vertical[0], 'x1');
    assert.equal(n(horizontal[0], 'y1') - n(horizontal[1], 'y1'), unit);
    const [xAxis, yAxis] = doc.querySelectorAll('line[stroke="#52746f"]');
    const originX = n(yAxis, 'x1'), originY = n(xAxis, 'y1');
    assert.deepEqual([...doc.querySelectorAll('circle')].map(dot =>
      [(n(dot, 'cx') - originX) / unit, (originY - n(dot, 'cy')) / unit]), expected);
    dom.window.close();
  }
});

test('integer invariant is verified by quotient/remainder division on every allowed state',()=>{
  for(let k=-3;k<=6;k++){const v=Labs.evaluate(20,k);assert.equal(v.n,17+5*k);assert.equal(v.quotient,Math.floor(v.n/5));assert.equal(v.remainder,v.n%5);assert.equal(v.n,5*v.quotient+v.remainder);assert.ok(v.remainder>=0&&v.remainder<5);}
  assert.equal((23+7*100)%7,2);
});

test('every model state has a finite accessible SVG and a textual conclusion',()=>{
  for(const [number,l]of Object.entries(Labs.labs))for(let p=l.min;p<=l.max;p+=l.step){
    const v=Labs.scene(Number(number),p);assert.ok(v.summary.trim());assert.match(v.svg,/viewBox="0 0 400 230"/);assert.match(v.svg,/role="img"/);assert.match(v.svg,/<title>/);assert.doesNotMatch(v.svg,/NaN|undefined|Infinity/);
    const d=new JSDOM(v.svg).window.document;assert.ok(d.querySelector('svg').getAttribute('aria-label'));for(const node of d.querySelectorAll('circle,line,rect'))for(const attr of ['cx','cy','r','x','y','x1','y1','x2','y2','width','height'])if(node.hasAttribute(attr))assert.ok(Number.isFinite(Number(node.getAttribute(attr))),number+' '+attr);
    d.defaultView.close();
  }
  assert.equal(Labs.evaluate(17,NaN).p,Labs.labs[17].initial);assert.equal(Labs.evaluate(17,10000).p,Labs.labs[17].initial);
});

test('first prediction and first transfer survive corrections, reload and a stale tab',()=>{
  const s=storage(),a=Labs.createStore(18,s),b=Labs.createStore(18,s);
  a.write({prediction:{value:'2',correct:false}});b.write({p:2,changed:true});
  a.write({transferFirst:{value:'2',correct:false},transferLast:{value:'2',correct:false},draft:'2'});
  b.write({prediction:{value:'4',correct:true},transferFirst:{value:'9/4',correct:true},transferLast:{value:'9/4',correct:true},draft:'9/4'});
  const r=Labs.createStore(18,s).snapshot();assert.deepEqual(r.prediction,{value:'2',correct:false});assert.deepEqual(r.transferFirst,{value:'2',correct:false});assert.deepEqual(r.transferLast,{value:'9/4',correct:true});assert.equal(r.p,2);assert.equal(r.changed,true);
});

test('malformed persisted data are preserved and blocked storage gives a visible limit',()=>{
  for(const raw of ['{','null','[]','{"version":99}','{"version":1,"prediction":{"value":7}}']){
    const s=storage({[key(14)]:raw}),a=Labs.createStore(14,s);assert.ok(a.warning);a.write({p:3,changed:true});assert.equal(s.getItem(key(14)),raw);assert.equal(s.writes.length,0);
  }
  const a=Labs.createStore(14,{getItem(){return null;},setItem(){throw Error('quota');}});a.write({p:3});assert.ok(a.warning);assert.equal(a.snapshot().p,3);
});

test('learner can predict, change, explain, transfer and reload every exploration without earned credit',()=>{
  const targets={14:3,15:8,16:2,17:6,18:2,19:2,20:6};
  for(const n of [14,15,16,17,18,19,20]){
    const dom=new JSDOM('<main></main>',{url:'https://mathexam.space/ege-profil/part-two/'}),w=dom.window,c=w.document.querySelector('main'),s=storage();let help=0;
    const start=()=>Labs.mount(c,n,{storage:s,onHelp(){help++;}});let stop=start();const submit=node=>node.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
    assert.match(c.textContent,/Исследование, не зачёт/);assert.equal(c.querySelector('[data-lab-observation]').hidden,true);assert.equal(c.querySelector('[data-lab-explain]').hidden,true);
    submit(c.querySelector('[data-lab-prediction]'));assert.equal(s.writes.length,0,'empty prediction no attempt');
    const wrong=Labs.labs[n].choices.find(v=>v!==Labs.labs[n].answer);c.querySelector('select').value=wrong;submit(c.querySelector('[data-lab-prediction]'));
    assert.equal(help,1);assert.equal(c.querySelector('[data-lab-observation]').hidden,false);assert.equal(c.querySelector('select').disabled,true);
    const slider=c.querySelector('input[type=range]');slider.value=targets[n];slider.dispatchEvent(new w.Event('input',{bubbles:true}));assert.equal(c.querySelector('[data-lab-explain]').hidden,false);
    const transfer=c.querySelector('[data-lab-transfer] input');transfer.value='999';submit(c.querySelector('[data-lab-transfer]'));assert.match(c.querySelector('[data-lab-transfer-feedback]').textContent,/Пока не совпало/);
    c.querySelector('[data-lab-transfer] input').value=n===18?'9/4':String(Labs.labs[n].transferAnswers[0]);submit(c.querySelector('[data-lab-transfer]'));assert.match(c.querySelector('[data-lab-transfer-feedback]').textContent,/Верно/);
    const r=JSON.parse(s.getItem(key(n)));assert.equal(r.prediction.value,wrong);assert.equal(r.prediction.correct,false);assert.equal(r.transferFirst.value,'999');assert.equal(r.transferLast.correct,true);
    stop();assert.equal(c.innerHTML,'');stop=start();assert.equal(c.querySelector('select').value,wrong);assert.match(c.querySelector('[data-lab-transfer-first]').textContent,/999.*исправление/);assert.equal(c.querySelector('[data-lab-explain]').hidden,false);
    assert.ok(s.writes.every(k=>k===key(n)));stop();w.close();
  }
});

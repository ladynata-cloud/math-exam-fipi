'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const source=fs.readFileSync(path.join(__dirname,'../trainers/oge-task11-graphs-trainer.html'),'utf8');
const KEY='mathExamCourseProgress.v1';
const plain=value=>JSON.parse(JSON.stringify(value));

function boot(html=source){
 const errors=[],downloads=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(html,{url:'https://example.test/trainers/oge-task11-graphs-trainer.html',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
  w.scrollTo=()=>{};let seed=20261021;w.Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const Blob=w.Blob;w.Blob=class extends Blob{constructor(parts,options){super(parts,options);downloads.push(parts.join(''));}};
  w.URL.createObjectURL=()=> 'blob:test';w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=()=>{};
 }});
 const w=dom.window,el=id=>w.document.getElementById(id);
 return{w,el,errors,downloads,run:s=>w.eval(s),state:()=>plain(w.Task11Discovery.getState()),
  open(i){w.document.querySelector('#m4-desc .function-help[data-i="'+i+'"]').click();},
  input(id,value){const e=el(id);e.value=String(value);e.dispatchEvent(new w.Event('input',{bubbles:true}));},
  snapshot(){return{answers:[...w.document.querySelectorAll('#m4-desc > .row > select')].map(e=>e.value),answer:el('m4-answer').value,attempts:w.eval('M4.attempts'),done:w.eval('M4.done'),progress:w.localStorage.getItem(KEY)};}};
}
function plotPoints(graph,color){
 const svg=graph.querySelector('svg');assert(svg,'a graph is rendered');
 const width=Number(svg.getAttribute('viewBox').split(/\s+/)[2]);
 return[...svg.querySelectorAll('polyline')].filter(p=>!color||p.getAttribute('stroke')===color).map(p=>p.getAttribute('points').trim().split(/\s+/).map(pair=>{
  const[x,y]=pair.split(',').map(Number);return{x:x*13.6/width-6.8,y:6.8-y*13.6/width};
 }));
}
function assertCurve(graph,fn,color){
 const segments=plotPoints(graph,color);assert(segments.length,'the actual curve has visible segments');
 for(const points of segments)for(const p of points)assert(Math.abs(p.y-fn(p.x))<0.025,'displayed curve follows independently computed function');
 return segments;
}
function checkComparison(t,prefix,shift){
 const graph=t.el(prefix+'-denominator-graph'),pole=-shift;
 const segments=plotPoints(graph);assert(segments.length,'the comparison contains plotted branches');
 const svg=graph.querySelector('svg'),width=Number(svg.getAttribute('viewBox').split(/\s+/)[2]);
 // SVG coordinates are rounded to 0.1 px. The implicit relation stays stable
 // near the pole, unlike vertical error, which magnifies rounded x values.
 const rounding=0.05*13.6/width;
 for(const points of segments)for(const p of points){
  const bound=rounding*(Math.abs(p.y)+Math.abs(p.x+shift))+rounding*rounding+1e-8;
  assert(Math.abs((p.x+shift)*p.y-1)<=bound,'plotted points satisfy (x + shift) × y = 1 within SVG rounding');
 }
 assert.equal(Number(graph.dataset.shift),shift);
 assert(segments.some(points=>points.every(p=>p.x<pole)),'left branch is shown');
 assert(segments.some(points=>points.every(p=>p.x>pole)),'right branch is shown');
 for(const points of segments)assert(points.every(p=>p.x<pole)||points.every(p=>p.x>pole),'no line joins the two sides of the pole');
 const polePx=(pole+6.8)*width/13.6;
 assert([...svg.querySelectorAll('line[stroke-dasharray]')].some(line=>Math.abs(Number(line.getAttribute('x1'))-polePx)<0.01&&Math.abs(Number(line.getAttribute('x2'))-polePx)<0.01),'vertical asymptote follows the denominator zero');
 const circles=[...svg.querySelectorAll('circle')];
 if(shift===0)assert.equal(circles.length,0,'1/x has no point on the y axis');
 else assert(circles.some(c=>Math.abs(Number(c.getAttribute('cx'))-width/2)<0.01&&Math.abs(Number(c.getAttribute('cy'))-(6.8-0.5)*width/13.6)<0.01),'1/(x+2) marks its actual y-intercept (0;0.5)');
 const formula=t.el(prefix+'-denominator-formula');assert(formula.querySelector('.frac'),'comparison formula uses a fraction bar');
}

test('smile changes the real parabola orientation and keeps other coefficients, task and nested help',()=>{
 const t=boot();try{
  t.input('m4-answer','231');const before=t.snapshot();t.open(1);
  t.input('t11-help-param-a',2);t.input('t11-help-param-b',3);t.input('t11-help-param-c',-1);
  t.el('t11-help-start').click();t.el('t11-help-highlight').click();
  assert.equal(t.el('t11-help-memory').querySelector('[data-memory-face]').dataset.mood,'happy');
  t.el('t11-help-mood').click();const sad=t.state();
  assert.deepEqual(sad.values,{a:-2,b:3,c:-1});assert(sad.started&&sad.highlighted);assert(sad.changed);
  assert.equal(t.el('t11-help-memory').querySelector('[data-memory-face]').dataset.mood,'sad');
  assertCurve(t.el('t11-help-graph'),x=>-2*x*x+3*x-1,'#176c52');
  assert(!t.el('t11-help-changed').hidden,'experimental formula remains identified');
  t.el('t11-help-mood').click();assert.deepEqual(t.state().values,{a:2,b:3,c:-1});
  assertCurve(t.el('t11-help-graph'),x=>2*x*x+3*x-1,'#176c52');
  t.el('t11-help-close').click();t.open(1);assert.deepEqual(t.state().values,{a:2,b:3,c:-1});
  assert.deepEqual(t.snapshot(),before);assert.deepEqual(t.errors,[]);
 }finally{t.w.close();}
});

test('denominator comparison distinguishes crossing an axis from an asymptote without changing the task',()=>{
 const t=boot();try{
  t.input('m4-answer','231');t.open(2);const before=t.snapshot(),main=t.state();
  const details=t.el('t11-help-denominator-details');assert(!details.open,'optional comparison starts collapsed');
  details.open=true;t.el('t11-help-dali').open=true;t.el('t11-help-denominator-x').click();checkComparison(t,'t11-help',0);
  t.el('t11-help-denominator-shift').click();checkComparison(t,'t11-help',2);
  assert.equal(t.el('t11-help-denominator-shift').getAttribute('aria-pressed'),'true');
  assert.equal(t.el('t11-help-denominator-x').getAttribute('aria-pressed'),'false');
  assert.deepEqual(t.state(),main,'illustrative denominator is not substituted into the matching function');
  t.el('t11-help-close').click();t.open(2);assert(t.el('t11-help-denominator-details').open);assert(t.el('t11-help-dali').open);checkComparison(t,'t11-help',2);
  t.el('t11-help-denominator-x').click();checkComparison(t,'t11-help',0);
  assert.deepEqual(t.snapshot(),before);
  t.el('t11-help-denominator-shift').click();t.el('m4-next').click();
  assert(!t.el('t11-help-denominator-details').open,'a new task resets the optional comparison');
  assert(!t.el('t11-help-dali').open,'a new task starts with the biography collapsed');
  checkComparison(t,'t11-help',0);assert.deepEqual(t.errors,[]);
 }finally{t.w.close();}
});

test('general help offers the same meaningful smile and denominator actions without grading',()=>{
 const t=boot();try{
  const before=t.snapshot();t.el('m4-hint').click();
  t.w.document.querySelector('#m4-hintbox [data-family="par"]').click();
  t.input('lab-b',2);t.input('lab-c',-1);const a=Number(t.el('lab-a').value);
  t.el('lab-mood').click();assert.equal(Number(t.el('lab-a').value),-a);assert.equal(Number(t.el('lab-b').value),2);assert.equal(Number(t.el('lab-c').value),-1);
  assertCurve(t.el('lab-graph'),x=>-a*x*x+2*x-1,'#253e30');
  const labBefore={a:t.el('lab-a').value,b:t.el('lab-b').value,c:t.el('lab-c').value,x:t.el('lab-x').value,graph:t.el('lab-graph').innerHTML};
  t.el('lab-vertex-details').open=true;t.el('lab-vertex-check-side').click();revealExactVertex(t,'lab');
  assert.equal(arithmeticText(t.el('lab-vertex-result')),1/a,'shared lab guide uses the displayed experimental parabola');
  assert.deepEqual({a:t.el('lab-a').value,b:t.el('lab-b').value,c:t.el('lab-c').value,x:t.el('lab-x').value,graph:t.el('lab-graph').innerHTML},labBefore);
  t.w.document.querySelector('#m4-hintbox [data-family="hyp"]').click();
  const k=t.el('lab-k').value,x=t.el('lab-x').value;
  t.el('lab-denominator-details').open=true;t.el('lab-denominator-shift').click();checkComparison(t,'lab',2);
  assert.equal(t.el('lab-k').value,k);assert.equal(t.el('lab-x').value,x);
  assert.deepEqual(t.snapshot(),before);assert.deepEqual(t.errors,[]);
 }finally{t.w.close();}
});

test('Dali portrait and brief reference are opt-in and remain inside the downloaded trainer',()=>{
 const t=boot();let downloaded,src;try{
  t.open(2);const details=t.el('t11-help-dali');assert(!details.open);
  const before=t.snapshot(),state=t.state();details.open=true;
  const portrait=details.querySelector('[data-dali-portrait]');assert(portrait);assert.match(portrait.alt,/Дали/);
  src=portrait.getAttribute('src');assert.match(src,/^data:image\/(jpeg|png|webp);base64,/,'portrait is available without an external request');
  assert(Buffer.from(src.split(',')[1],'base64').length>1000,'embedded photograph contains actual image bytes');
  assert.match(details.textContent,/1904/);assert.match(details.textContent,/1989/);assert(details.querySelector('a[href^="https://"]'),'reference credits link to sources');
  assert.deepEqual(t.state(),state);assert.deepEqual(t.snapshot(),before);
  t.el('dl-html').click();assert.equal(t.downloads.length,1);downloaded=t.downloads[0];assert(downloaded.includes(src));
  assert.deepEqual(t.errors,[]);
 }finally{t.w.close();}
 const reboot=boot(downloaded);try{
  reboot.open(2);const details=reboot.el('t11-help-dali');details.open=true;
  assert.equal(details.querySelector('[data-dali-portrait]').getAttribute('src'),src);
  reboot.el('t11-help-denominator-details').open=true;reboot.el('t11-help-denominator-shift').click();checkComparison(reboot,'t11-help',2);
  const ids=[...reboot.w.document.querySelectorAll('[id]')].map(e=>e.id);assert.equal(ids.length,new Set(ids).size);
  assert.deepEqual(reboot.errors,[]);
 }finally{reboot.w.close();}
});

function arithmeticText(node){
 const copy=node.cloneNode(true);
 for(const frac of [...copy.querySelectorAll('.frac')].reverse()){
  const n=frac.querySelector('.fn').textContent,d=frac.querySelector('.fd').textContent;
  frac.replaceWith(copy.ownerDocument.createTextNode('(('+n+')/('+d+'))'));
 }
 const expression=copy.textContent.split('=').at(-1).replace(/[−–]/g,'-').replace(/[·×]/g,'*').replace(/,/g,'.').replace(/\s/g,'');
 assert.match(expression,/^[\d.()+*/-]+$/,'the displayed calculation consists only of arithmetic');
 return Function('"use strict";return ('+expression+');')();
}
function revealExactVertex(t,prefix){
 const details=t.el(prefix+'-vertex-exact');details.open=true;
 for(let i=0;i<4&&t.el(prefix+'-vertex-step-4').hidden;i++)t.el(prefix+'-vertex-next').click();
 assert(!t.el(prefix+'-vertex-step-4').hidden,'all requested calculation steps can be reached');
}

test('vertex help uses all coefficient-sign combinations and an exact fraction without changing the model or answers',()=>{
 const t=boot();try{
  t.input('m4-answer','231');t.open(1);const before=t.snapshot();
  const outer=t.el('t11-help-vertex-details'),exact=t.el('t11-help-vertex-exact');
  assert(!outer.open,'vertex location is optional');assert(!exact.open,'arithmetic is a second optional level');
  const cases=[
   {a:2,b:4,x:-1,side:'left',word:/слева/},
   {a:2,b:-4,x:1,side:'right',word:/справа/},
   {a:-2,b:4,x:1,side:'right',word:/справа/},
   {a:-2,b:-4,x:-1,side:'left',word:/слева/},
   {a:2,b:0,x:0,side:'axis',word:/на оси/},
   {a:-2,b:0,x:0,side:'axis',word:/на оси/},
   {a:3,b:2,x:-1/3,side:'left',word:/слева/}
  ];
  for(const {a,b,x,side,word} of cases){
   t.input('t11-help-param-a',a);t.input('t11-help-param-b',b);t.input('t11-help-param-c',1);
   const model=t.state();outer.open=true;t.el('t11-help-vertex-check-side').click();
   const coefficients=t.el('t11-help-vertex-coefficients').textContent.replace(/−/g,'-');
   assert.match(coefficients,new RegExp('a\\s*=\\s*'+a+'(?!\\d)'),'a is read from the current formula');
   assert.match(coefficients,new RegExp('b\\s*=\\s*'+b+'(?!\\d)'),'b retains its sign or zero');
   const conclusion=t.el('t11-help-vertex-side');assert(!conclusion.hidden);assert.equal(conclusion.dataset.side,side);assert.match(conclusion.textContent,word);
   revealExactVertex(t,'t11-help');
   const formula=t.el('t11-help-vertex-formula').querySelector('.frac');assert(formula,'reference formula uses a fraction bar');
   assert.equal(formula.querySelector('.fn').textContent.replace(/\s/g,'').replace(/−/g,'-'),'-b');
   assert.equal(formula.querySelector('.fd').textContent.replace(/[\s·×]/g,''),'2a');
   assert(Math.abs(arithmeticText(t.el('t11-help-vertex-substitution'))-x)<1e-12,'substituted displayed arithmetic gives the independently expected x');
   assert(Math.abs(arithmeticText(t.el('t11-help-vertex-result'))-x)<1e-12,'final displayed result is exact, including the fractional case');
   const f=v=>a*v*v+b*v+1;assert(Math.abs(f(x-1)-f(x+1))<1e-12,'the expected location is the axis of symmetry of the actual function');
   const graph=t.el('t11-help-vertex-graph');assertCurve(graph,f);
   const svg=graph.querySelector('svg'),width=Number(svg.getAttribute('viewBox').split(/\s+/)[2]);
   assert([...svg.querySelectorAll('circle')].some(c=>Math.abs(Number(c.getAttribute('cx'))-(x+6.8)*width/13.6)<0.01&&Math.abs(Number(c.getAttribute('cy'))-(6.8-f(x))*width/13.6)<0.01),'the visible vertex mark agrees with the calculation');
   assert.deepEqual(t.state(),model,'reading both help levels never changes the model');
   assert.deepEqual(t.snapshot(),before,'help never selects a matching answer or records progress');
  }
  const reference=t.el('t11-help-vertex-reference');assert(reference);assert.equal(reference.tagName,'A');assert.match(reference.href,/^https:\/\//);
  assert.match(reference.textContent,/справоч/i,'learner can recognize the reference materials');
  t.el('t11-help-close').click();t.open(1);assert(outer.open);assert(exact.open,'same task keeps the requested depth of help');
  t.el('m4-next').click();assert(!outer.open);assert(!exact.open,'a new task starts without expanded calculations');
  assert.deepEqual(t.errors,[]);
 }finally{t.w.close();}
});


test('construction marks a revealed vertex as assisted without entering or grading the answer',()=>{
 const t=boot();try{
  function finishConstruction(){
   const {p,xs}=plain(t.run('M3.task'));
   t.input('m3-x0',-p.b/(2*p.a));t.el('m3-check1').click();
   const fields=[...t.el('m3-stage').querySelectorAll('table.pts input')];assert.equal(fields.length,xs.length);
   fields.forEach((field,i)=>{field.value=String(p.a*xs[i]*xs[i]+p.b*xs[i]+p.c);});
   t.el('m3-checkT').click();assert.equal(t.run('M3.task.recorded'),true,'a completed construction reaches its normal scoring gate');
  }
  const progress=t.w.localStorage.getItem(KEY);
  t.input('m3-x0','123');const construction=plain(t.run('M3'));
  t.el('m3-vertex-details').open=true;t.el('m3-vertex-exact').open=true;
  t.el('m3-vertex-next').click();t.el('m3-vertex-next').click();
  assert(!t.el('m3-vertex-step-3').hidden);assert(t.el('m3-vertex-step-4').hidden);
  assert.deepEqual(plain(t.run('M3')),construction,'opening the guide and the first three steps do not reveal or grade the result');
  t.el('m3-vertex-next').click();
  assert.equal(t.el('m3-x0').value,'123','revealing x does not fill or alter the answer');
  assert.deepEqual(plain(t.run('M3')),{...construction,shown:true},'only the assisted flag changes when the exact result is revealed');
  assert.equal(t.el('m3-step2').innerHTML,'','help does not advance the construction exercise');
  assert.equal(t.w.localStorage.getItem(KEY),progress,'reading the answer records no completion');
  finishConstruction();assert.deepEqual(plain(t.run('stats11().skills')),{},'a revealed exact result cannot earn independent credit');
  t.el('m3-next').click();assert.equal(t.run('M3.shown'),false);
  t.el('m3-vertex-details').open=true;t.el('m3-vertex-check-side').click();
  assert.equal(t.run('M3.shown'),true,'showing the vertex on its coordinate grid is also assistance');
  assert.equal(t.el('m3-x0').value,'');assert.equal(t.el('m3-step2').innerHTML,'');
  finishConstruction();assert.deepEqual(plain(t.run('stats11().skills')),{},'reading the graph cannot bypass the assisted-result gate');
  t.el('m3-next').click();finishConstruction();
  assert.deepEqual(plain(t.run('stats11().skills.build')),{total:1,first:1},'a fresh unassisted solution still earns its normal credit');
  assert.deepEqual(t.errors,[]);
 }finally{t.w.close();}
});

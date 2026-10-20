'use strict';
// Behavioral preflight for exploratory geometry; no browser is launched here.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM,VirtualConsole}=require('jsdom');
const root=process.env.TASK19_TEST_ROOT||path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const KEY='mathExam.task19.visualHints.v1';
const sources=['task19-visual-data.js','task19-models-triangles.js','task19-models-circles.js','task19-models-lines-polygons.js','task19-visual-models.js','task19-visual-app.js'];
const cards=require(path.join(root,'trainers/task19-visual-data.js')).cards;
function boot(t,id='prev-056',saved){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(read('trainers/task19-trainer.html'),{url:'https://example.test/trainers/task19-trainer.html?card='+id,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});t.after(()=>dom.window.close());
 const w=dom.window,d=w.document;w.addEventListener('error',e=>errors.push(e.message));if(saved)w.localStorage.setItem(KEY,JSON.stringify(saved));for(const src of sources)w.eval(read('trainers/'+src));
 const f={w,d,errors,$:s=>d.querySelector(s),saved:()=>JSON.parse(w.localStorage.getItem(KEY)),card:cards.find(c=>c.id===id)};
 f.open=()=>{if(f.$('#hintPanel').hidden)f.$('#hintToggle').click();};
 f.sample=()=>w.Task19Visuals.sample(f.card.hint.model,{...f.card.hint.params,...f.saved().current.modelState.params});
 f.measure=()=>{if(f.$('.t19-model-readout').hidden)f.$('.t19-measure').click();};
 return f;
}
function input(f,node,value){node.value=String(value);node.dispatchEvent(new f.w.Event('input',{bubbles:true}));}
function ungraded(f,records){assert.equal(f.$('#answerPanel').hidden,true);assert.equal(f.$('#answerExplanation').textContent,'');assert.equal(f.saved().current.answer,null);assert.deepEqual(f.saved().records,records);assert.deepEqual(f.errors,[]);}
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const near=(a,b,label)=>assert(Math.abs(a-b)<1e-7,label+': '+a+' ≈ '+b);

test('every canonical statement supplies an experiment and explicit numerical measurement without grading',t=>{
 assert.equal(cards.length,233);
 for(const card of cards){
  const f=boot(t,card.id),before=f.saved(),progress=f.$('#progressText').textContent;assert.equal(typeof card.hint.model,'string',card.id);f.open();
  assert(f.$('#visualHost svg'),card.id);assert.equal(f.$('.t19-model-readout').hidden,true,card.id+': hidden until measured');assert(f.$('.t19-measure'),card.id);
  const sliders=[...f.d.querySelectorAll('#visualHost input[type=range]')];let changed=false;
  for(const slider of sliders){const prior=Number(slider.value),step=Number(slider.step)||1,min=Number(slider.min),max=Number(slider.max),drawing=f.$('#visualHost svg').innerHTML,metrics=f.$('.t19-model-readout').textContent;input(f,slider,prior+step<=max?prior+step:prior-step>=min?prior-step:min);assert.notEqual(Number(slider.value),prior,card.id+': editable control has a useful range');changed=changed||f.$('#visualHost svg').innerHTML!==drawing||f.$('.t19-model-readout').textContent!==metrics;}
  if(sliders.length)assert(changed,card.id+': an experiment changes geometry or measurements');
  f.measure();assert.equal(f.$('.t19-model-readout').hidden,false);assert.match(f.$('.t19-model-readout').textContent,/\d/,card.id+': numerical observations');assert.equal(f.saved().current.modelState.measured,true);assert.equal(f.$('#progressText').textContent,progress);ungraded(f,before.records);
  domClose(f);
 }
});
function domClose(f){f.w.close();}

test('parameter drafts and measurement visibility survive closing the hint and reloading',t=>{
 const f=boot(t);f.open();const slider=f.$('#visualHost input[type=range]');input(f,slider,Number(slider.value)+Number(slider.step));f.measure();const saved=f.saved(),drawing=f.$('#visualHost svg').innerHTML,readout=f.$('.t19-model-readout').textContent;
 f.$('#hintToggle').click();f.$('#hintToggle').click();assert.equal(f.$('#visualHost svg').innerHTML,drawing);assert.deepEqual(f.saved().current.modelState,saved.current.modelState);
 const restored=boot(t,'prev-056',saved);assert.equal(restored.$('#hintPanel').hidden,false);assert.equal(restored.$('#visualHost svg').innerHTML,drawing);assert.equal(restored.$('.t19-model-readout').textContent,readout);assert.equal(restored.$('.t19-model-readout').hidden,false);ungraded(restored,saved.records);
 restored.$('.t19-measure').click();assert.equal(restored.$('.t19-model-readout').hidden,true);const hidden=boot(t,'prev-056',restored.saved());assert.equal(hidden.$('.t19-model-readout').hidden,true);assert.deepEqual(hidden.saved().current.modelState.params,saved.current.modelState.params);
});

test('fixed length statements reject forged editable lengths and preserve the actual condition',t=>{
 for(const [id,lengths]of [['prev-038',[2,3,5]],['tri_1_2_4_exists',[1,2,4]],['tri_2_4_6_not_exist',[2,4,6]],['reference-026',[1,2,4]]]){
  const forged={version:1,topic:'',review:false,records:{},current:{id,answer:null,hintOpen:true,modelState:{params:{a:9,b:9,c:9,locked:[],unknown:999},measured:true}}};
  const f=boot(t,id,forged),s=f.sample();assert.deepEqual([s.values.a,s.values.b,s.values.c],lengths,id);assert(!['a','b','c','locked','unknown'].some(key=>Object.hasOwn(f.saved().current.modelState.params,key)),id+': only editable numeric keys survive');f.measure();ungraded(f,{});
 }
});

test('moving the median endpoint preserves the stated circle constraint at all bounds',t=>{
 const f=boot(t,'prev-019');f.open();assert.equal(f.card.hint.model,'triangleMedianCircle');
 const invariant=()=>{const P=f.sample().points,M=P.M||P.O;assert(M&&P.A&&P.B&&P.C);near(distance(M,P.A),distance(M,P.B),'midpoint');near(distance(M,P.A),distance(M,P.C),'median equals radius');near(2*distance(M,P.A),distance(P.A,P.B),'diameter');const u=[P.A[0]-P.C[0],P.A[1]-P.C[1]],v=[P.B[0]-P.C[0],P.B[1]-P.C[1]];near((u[0]*v[0]+u[1]*v[1])/(Math.hypot(...u)*Math.hypot(...v)),0,'right angle');};
 invariant();const sliders=[...f.d.querySelectorAll('#visualHost input[type=range]')];assert(sliders.length);for(const slider of sliders)for(const value of [slider.min,slider.max]){input(f,slider,value);invariant();}f.measure();ungraded(f,{});
});

test('adding experiment state does not alter existing answered progress',t=>{
 const records={'prev-056':{attempts:3,correct:2,needsReview:true}},saved={version:1,topic:'',review:false,records,current:{id:'prev-056',answer:true,hintOpen:true}};
 const f=boot(t,'prev-056',saved);assert.equal(f.$('#answerPanel').hidden,false);assert.deepEqual(f.saved().records,records);assert.equal(f.$('.t19-model-readout').hidden,true);f.measure();assert.deepEqual(f.saved().records,records);f.$('#btnTrue').click();f.$('#btnFalse').click();assert.deepEqual(f.saved().records,records);assert.deepEqual(f.errors,[]);
});

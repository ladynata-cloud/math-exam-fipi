'use strict';
// Regression contracts for the owner's 34 annotated examples. These assert
// observable geometry, controls and persisted learner state, not source layout.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),zlib=require('node:zlib');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=process.env.TASK19_TEST_ROOT||path.resolve(__dirname,'..');
const {cards}=require(path.join(root,'trainers/task19-visual-data.js'));
const V=require(path.join(root,'trainers/task19-visual-models.js'));
const byId=new Map(cards.map(c=>[c.id,c]));
const DIRECT=[
 'prev-019','prev-070','trapezoid_area_base_times_height','prev-044','prev-030','reference-068','summer-046','prev-028','prev-053','prev-093','summer-044','prev-026',
 'reference-105','prev-080','summer-025','reference-016','summer-058','summer-069','reference-014','prev-011','prev-013','prev-027','summer-059','prev-050',
 'triangle_area_less_than_product_two_sides','prev-002','summer-048','summer-037','summer-034','triangle_angles_sum_360','prev-076','prev-063','summer-035','summer-061'
];
const KEY='mathExam.task19.visualHints.v1';
const near=(a,b,label)=>assert(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-6*Math.max(1,Math.abs(a),Math.abs(b)),`${label}: ${a} != ${b}`);
const length=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const angle=(a,v,b)=>{const u=[a[0]-v[0],a[1]-v[1]],w=[b[0]-v[0],b[1]-v[1]];return Math.atan2(Math.abs(u[0]*w[1]-u[1]*w[0]),u[0]*w[0]+u[1]*w[1])*180/Math.PI;};
const content=r=>r.readout.map(row=>typeof row==='string'?row:row.text).join('\n');
function finiteTree(v,label){if(typeof v==='number')assert(Number.isFinite(v),label);else if(v&&typeof v==='object')Object.entries(v).forEach(([k,x])=>finiteTree(x,label+'.'+k));}
function validTriangle(s,label){
 const P=s.points,angles=[angle(P.B,P.A,P.C),angle(P.A,P.B,P.C),angle(P.A,P.C,P.B)],sides=[length(P.B,P.C),length(P.A,P.C),length(P.A,P.B)];
 assert(angles.every(n=>n>0&&n<180),label+' nondegenerate angles');near(angles.reduce((a,b)=>a+b),180,label+' angle sum');
 for(let i=0;i<3;i++){assert(sides[i]<sides[(i+1)%3]+sides[(i+2)%3],label+' strict triangle inequality');near(s.metrics[['a','b','c'][i]],angles[i],label+' actual angle');near(s.values['side'+'ABC'[i]],sides[i],label+' linked side');}
 return {angles,sides};
}
function boot(t,id,saved){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const w=new JSDOM(fs.readFileSync(path.join(root,'trainers/task19-trainer.html'),'utf8'),{url:'https://example.test/trainers/task19-trainer.html?card='+id,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}).window;
 t.after(()=>w.close());if(saved)w.localStorage.setItem(KEY,JSON.stringify(saved));
 for(const name of ['task19-visual-data','task19-models-triangles','task19-models-circles','task19-models-lines-polygons','task19-visual-models','task19-reference','task19-visual-app'])w.eval(fs.readFileSync(path.join(root,'trainers/'+name+'.js'),'utf8'));
 return {w,d:w.document,errors,$:s=>w.document.querySelector(s),saved:()=>JSON.parse(w.localStorage.getItem(KEY)),input(key,value){const input=w.document.querySelector(`input[data-key="${key}"]`);assert(input,key+' exists');input.value=value;input.dispatchEvent(new w.Event('input',{bubbles:true}));}};
}

test('owner feedback preserves all 233 prior cards while the verified demo adds one exact assertion',()=>{
 assert.equal(byId.get('prev-011').text,'Сумма углов любого треугольника равна 180°.');
 const added=byId.get('tri_aaa_similarity');
 assert(added);assert.equal(added.truth,true);
 assert.equal(added.text,'Если три угла одного треугольника равны трём углам другого треугольника, то такие треугольники подобны.');
 const bank=cards.filter(c=>c.id!=='tri_aaa_similarity').map(c=>({id:c.id,text:c.id==='prev-011'?'Сумма внутренних углов любого треугольника равна 180°.':c.text,truth:c.truth,aliases:c.aliases}));
 assert.equal(bank.length,233);
 assert.equal(crypto.createHash('sha256').update(JSON.stringify(bank)).digest('hex'),'2e53abd6b48a711a9b407654e33601d72f0eb03e24ad1035934405ee6e23b4df');
 assert.equal(DIRECT.length,34);assert.equal(new Set(DIRECT).size,34);DIRECT.forEach(id=>assert(byId.has(id),id));
});

test('each exposed control changes the experiment and keeps geometry finite at both bounds',()=>{
 const failures=[];
 for(const card of cards){const model=card.hint.model,p=card.hint.params;
  for(const control of V.controlsFor(model,p))try{
   assert(control.min<control.max,'useful range');
   const first=V.render(model,V.updateModel(model,p,control.key,control.min)),middle=V.render(model,V.updateModel(model,p,control.key,(control.min+control.max)/2)),last=V.render(model,V.updateModel(model,p,control.key,control.max));
   for(const result of[first,middle,last]){finiteTree(result.sample.points,'points');finiteTree(result.sample.metrics,'metrics');assert(!/NaN|Infinity/.test(result.svg+' '+content(result)),'no invalid displayed number');}
   assert(first.svg!==middle.svg||first.svg!==last.svg||content(first)!==content(middle)||content(first)!==content(last),'geometry or measurements change');
  }catch(e){failures.push(card.id+' '+control.key+': '+e.message);}
 }
 assert.deepEqual(failures,[]);
});

test('six side-angle controls stay paired, bidirectional and inside valid triangle constraints',()=>{
 for(const id of ['prev-012','reference-014']){
  const card=byId.get(id),model=card.hint.model,initial=V.sample(model,card.hint.params).values;
  const controls=V.controlsFor(model,initial);assert.equal(controls.length,6,id);assert.deepEqual(controls.map(c=>c.key),['sideA','a','sideB','b','sideC','c']);
  for(let i=0;i<6;i+=2){assert.equal(controls[i].pair,controls[i+1].pair);assert.equal(controls[i].group,controls[i+1].group);assert(controls[i].pair);}
  for(const control of controls){
   const start=V.sample(model,initial),before=validTriangle(start,id);
   for(const value of [control.min,(control.min+control.max)/2,control.max]){
    const next=V.updateModel(model,initial,control.key,value),sample=V.sample(model,next);validTriangle(sample,id+' '+control.key+'='+value);
    near(sample.values[control.key],value,id+' requested value is actually reached');
    if(control.key.startsWith('side')){
     const index='ABC'.indexOf(control.key.at(-1));
     ['sideA','sideB','sideC'].forEach((key,j)=>{if(j!==index)near(sample.values[key],before.sides[j],id+' other side stays fixed');});
    }
   }
  }
  // Repeated mixed edits catch stale ranges and angle/side values after redraw.
  let p=initial;
  for(let step=0;step<36;step++){const c=V.controlsFor(model,p)[step%6],value=c.min+(c.max-c.min)*(.2+.6*((step%5)/4));p=V.updateModel(model,p,c.key,value);validTriangle(V.sample(model,p),id+' mixed edit '+step);}
 }
});

test('Pythagorean converse is built from SSS and measures the right angle independently',()=>{
 const card=byId.get('summer-059');
 for(const scale of [2,4,8])for(const rotation of [0,55,180]){
  const result=V.render(card.hint.model,{...card.hint.params,scale,rotation,a:27,b:101,c:52}),P=result.sample.points;
  const ab=length(P.A,P.B),ac=length(P.A,P.C),bc=length(P.B,P.C);
  near(ab,scale,'requested size');near(ac/ab,3/4,'SSS leg ratio');near(bc/ab,5/4,'SSS hypotenuse ratio');near(ab*ab+ac*ac,bc*bc,'Pythagorean side equality');near(angle(P.B,P.A,P.C),90,'right angle from actual points');near(result.sample.metrics.a,90,'measured angle');
  assert.match(content(result),/Обратная теорема Пифагора/);assert.match(content(result),/∠A = 90°/);assert.match(content(result),/3².*4².*5²/);assert(result.svg.includes('data-geometry-mark="right-angle"'));
 }
});

test('largest side and opposite angle agree, including two-way and three-way ties',()=>{
 for(const [a,b] of [[40,60],[70,70],[60,60]]){
  const result=V.render('triangleExplore',{focus:'sides',a,b}),{angles,sides}=validTriangle(result.sample,'largest pair');
  const largest=angles.map((n,i)=>Math.abs(n-Math.max(...angles))<1e-6?i:-1).filter(n=>n>=0),rows=result.readout.filter(row=>row&&typeof row==='object');
  assert.equal(rows.filter(row=>/наибольший угол/.test(row.text)).length,largest.length);
  assert.equal(rows.filter(row=>/наибольшая сторона/.test(row.text)).length,largest.length);
  for(const i of largest){near(sides[i],Math.max(...sides),'opposite longest side');const group='opposite-'+'ABC'[i];assert(rows.some(r=>r.group===group&&/наибольший угол/.test(r.text)));assert(rows.some(r=>r.group===group&&/наибольшая сторона/.test(r.text)));}
 }
});

test('right-angle squares describe actual perpendicular rays; ordinary arcs never encode 90 degrees',()=>{
 let squares=0,arcs=0;
 for(const card of cards){const states=[card.hint.params];for(const c of V.controlsFor(card.hint.model,card.hint.params))states.push(V.updateModel(card.hint.model,card.hint.params,c.key,c.min),V.updateModel(card.hint.model,card.hint.params,c.key,c.max));
  for(const p of states){const svg=V.render(card.hint.model,p).svg;
   for(const m of svg.matchAll(/<path\b[^>]*data-geometry-mark="right-angle"[^>]*\bd="([^"]+)"/g)){
    const n=m[1].match(/-?\d*\.?\d+(?:e[+-]?\d+)?/gi).map(Number);assert.equal(n.length,6,card.id+' square path');const u=[n[0]-n[2],n[1]-n[3]],v=[n[4]-n[2],n[5]-n[3]];near((u[0]*v[0]+u[1]*v[1])/(Math.hypot(...u)*Math.hypot(...v)),0,card.id+' right-angle marker');squares++;
   }
   for(const m of svg.matchAll(/data-geometry-mark="angle" data-angle="([^"]+)"/g)){const n=Number(m[1]);assert(n>0&&n<=180);assert(Math.abs(n-90)>1e-6,card.id+' 90° uses a square');arcs++;}
  }
 }
 assert(squares>30);assert(arcs>100);
});

test('equal-radius and median ticks represent genuinely equal measured segments',()=>{
 for(const id of ['prev-019','reference-105','prev-020']){
  const card=byId.get(id),result=V.render(card.hint.model,card.hint.params),P=result.sample.points;
  const doc=new JSDOM(result.svg).window.document;
  assert(doc.querySelector('[data-geometry-mark="equal-segment"]'),id+' equal-segment marks');
  if(P.M&&card.hint.model==='triangleMedianCircle'){
   near(length(P.A,P.M),length(P.B,P.M),id+' AM=BM');near(length(P.A,P.M),length(P.C,P.M),id+' AM=CM');
   const group=doc.querySelectorAll('[data-geometry-group="equal-radii"]');assert.equal(group.length,3);group.forEach(g=>assert.equal(g.querySelector('[data-geometry-mark="equal-segment"]').children.length,1));
  }
  if(card.hint.model==='triangleConstructions'){
   const M=result.sample.metrics;near(length(P[M.left],P.M),length(P.M,P[M.right]),id+' midpoint halves');
  }
 }
});

test('paired edits and measurement state survive reload without recording an answer',t=>{
 const f=boot(t,'reference-014');f.$('#hintToggle').click();const initial=f.saved();
 f.input('sideA',Number(f.$('input[data-key="sideA"]').value)+.2);f.input('b',50);f.input('sideC',5);f.$('.t19-measure').click();
 const saved=f.saved(),drawing=f.$('#visualHost svg').innerHTML;near(saved.current.modelState.params.sideC,5,'saved edited AB');assert.equal(saved.current.answer,null);assert.deepEqual(saved.records,initial.records);
 assert.equal(f.$('.t19-model-readout').hidden,false);assert(!f.$('.t19-model-readout').textContent.includes('[object Object]'));
 f.$('#hintToggle').click();f.$('#hintToggle').click();assert.equal(f.$('#visualHost svg').innerHTML,drawing);
 const restored=boot(t,'reference-014',saved);assert.equal(restored.$('#visualHost svg').innerHTML,drawing);assert.deepEqual(restored.saved().current.modelState,saved.current.modelState);assert.equal(restored.$('#answerPanel').hidden,true);
 // Help never grades. An explicit wrong answer counts exactly once and remains wrong.
 const wrong=byId.get('reference-014').truth?'#btnFalse':'#btnTrue';restored.$(wrong).click();assert.deepEqual(restored.saved().records['reference-014'],{attempts:1,correct:0,needsReview:true});restored.$('#btnTrue').click();restored.$('#btnFalse').click();assert.equal(restored.saved().records['reference-014'].attempts,1);
 assert.deepEqual(f.errors.concat(restored.errors),[]);
});

test('forged saved parameters cannot unlock statement constraints or alter truths',()=>{
 for(const card of cards){
  const editable=new Set(V.controlsFor(card.hint.model,card.hint.params).map(c=>c.key)),original=V.sample(card.hint.model,card.hint.params).values;
  const restored=V.restoreModel(card.hint,{measured:true,params:{...Object.fromEntries(Object.keys(original).map(k=>[k,999])),locked:[],mode:'free',fixedLengths:false,fixedScale:false,truth:!card.truth}});
  assert.equal(restored.measured,true);
  for(const [key,value] of Object.entries(card.hint.params||{}))if(!editable.has(key))assert.deepEqual(restored.params[key],original[key],card.id+' preserves '+key);
 }
});

test('only the requested inert controls disappear while useful size experiments remain',()=>{
 for(const [id,key] of [['reference-105','side'],['prev-080','radius'],['prev-050','side'],['summer-037','radius'],['triangle_angles_sum_360','scale'],['prev-076','radius'],['prev-028','base'],['prev-027','base'],['prev-030','x'],['prev-093','x']]){
  const card=byId.get(id);assert(!V.controlsFor(card.hint.model,card.hint.params).some(c=>c.key===key),id+' removes '+key);
 }
 for(const [id,key] of [['prev-013','scale'],['summer-025','radius'],['summer-035','side']]){const card=byId.get(id);assert(V.controlsFor(card.hint.model,card.hint.params).some(c=>c.key===key),id+' retains useful '+key);}
 const c=byId.get('prev-044');assert.deepEqual(V.controlsFor(c.hint.model,c.hint.params).map(c=>c.key),['base','side','angle']);
});

test('equal angles share arc markings, and different angles do not',()=>{
 for(const [a,b]of [[55,65],[50,50],[60,60]]){
  const result=V.render('triangleExplore',{focus:'sides',a,b}),w=new JSDOM(result.svg).window;
  try{const marks=['A','B','C'].map(n=>w.document.querySelector('[data-geometry-group="opposite-'+n+'"] [data-geometry-mark="angle"]'));
   assert(marks.every(Boolean));const angles=[result.sample.metrics.a,result.sample.metrics.b,result.sample.metrics.c];
   for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)assert.equal(marks[i].children.length===marks[j].children.length,Math.abs(angles[i]-angles[j])<1e-6,'equal arc counts mean equal measured angles');
  }finally{w.close();}
 }
});

test('requested formula help contains real sheet images and remains optional',t=>{
 const R=require(path.join(root,'trainers/task19-reference.js'));
 for(const [id,crop]of [['trapezoid_area_base_times_height','trapezoid-area'],['prev-030','triangle-area'],['summer-044','polygon-angles'],['summer-059','pythagoras'],['triangle_area_less_than_product_two_sides','triangle-area'],['summer-061','rhombus-area']]){
  assert(R.forCard(byId.get(id)).includes(crop),id+' correct formula');const f=boot(t,id);assert.equal(f.$('#hintPanel').hidden,true);f.$('#hintToggle').click();
  const help=f.$('#referenceHost details.t19-reference');assert(help,id+' reference help');assert.equal(help.open,false);help.open=true;
  assert(f.$('.t19-reference-crop').getAttribute('src').endsWith('/'+crop+'.png'));assert(f.$('.t19-reference-crop').getAttribute('alt'));assert(f.$('.t19-reference-sheet img').getAttribute('src').includes('fipi-oge-2027-page-'));
  assert.equal(f.saved().current.answer,null);assert.deepEqual(f.saved().records,{});assert.deepEqual(f.errors,[]);
 }
});

function png(file){
 const bytes=fs.readFileSync(file);assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');let width,height,color,depth,compressed=[];
 for(let i=8;i<bytes.length;){const size=bytes.readUInt32BE(i),kind=bytes.toString('ascii',i+4,i+8),data=bytes.subarray(i+8,i+8+size);if(kind==='IHDR'){width=data.readUInt32BE(0);height=data.readUInt32BE(4);depth=data[8];color=data[9];}if(kind==='IDAT')compressed.push(data);i+=size+12;}
 assert.equal(depth,8);assert.equal(color,0,'unmodified grayscale reference');const packed=zlib.inflateSync(Buffer.concat(compressed)),pixels=Buffer.alloc(width*height);
 const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
 for(let y=0;y<height;y++){const filter=packed[y*(width+1)];for(let x=0;x<width;x++){const i=y*width+x,v=packed[y*(width+1)+x+1],a=x?pixels[i-1]:0,b=y?pixels[i-width]:0,c=x&&y?pixels[i-width-1]:0;pixels[i]=(v+(filter===0?0:filter===1?a:filter===2?b:filter===3?Math.floor((a+b)/2):filter===4?paeth(a,b,c):assert.fail('unknown PNG filter')))&255;}}
 return {width,height,pixels};
}
test('official reference crops are exact rectangles of the retained full FIPI sheets',()=>{
 const dir=path.join(root,'trainers/task19-reference'),meta=JSON.parse(fs.readFileSync(path.join(dir,'source.json'),'utf8'));
 assert.equal(meta.status,'project');assert.equal(new URL(meta.officialArchive).hostname,'doc.fipi.ru');assert.equal(meta.archiveMember,'МА-9 ОГЭ 2027_ДЕМО.pdf');
 const digest=file=>crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,file))).digest('hex');assert.equal(digest(meta.sourceFile),meta.sourceSha256);assert.equal(fs.readFileSync(path.join(dir,meta.sourceFile)).subarray(0,5).toString(),'%PDF-');
 const sheets={};for(const e of Object.values(meta.pages)){assert.equal(digest(e.file),e.sha256);sheets[e.file]=png(path.join(dir,e.file));}
 for(const [key,e]of Object.entries(meta.crops)){assert.equal(digest(e.file),e.sha256,key);const crop=png(path.join(dir,e.file)),full=sheets[e.fullPageFile],[x0,y0,x1,y1]=e.rectPixels;assert(full,key+' full sheet');assert.deepEqual([crop.width,crop.height],[x1-x0,y1-y0]);assert.deepEqual([crop.width,crop.height],[e.width,e.height]);for(let y=0;y<crop.height;y++)assert(crop.pixels.subarray(y*crop.width,(y+1)*crop.width).equals(full.pixels.subarray((y+y0)*full.width+x0,(y+y0)*full.width+x1)),key+' row '+y);}
 for(const id of ['triangle-area','trapezoid-area','rhombus-area','polygon-angles','pythagoras'])assert(meta.crops[id]);
});

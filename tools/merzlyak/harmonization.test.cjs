'use strict';
// H27 behavioral contract: keep all original work, add an independent inquiry
// screen, and refuse stale writes without manufacturing exercise credit.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'../..');
const courseDir=path.join(root,'geometry-merzlyak');
const course=require(path.join(courseDir,'data/course.json'));
const proofs=require(path.join(courseDir,'data/proofs.json'));
const S=require(path.join(courseDir,'assets/store.js'));
const I=require(path.join(courseDir,'assets/investigations.js'));
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const clone=x=>JSON.parse(JSON.stringify(x));
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
function lesson(id=course.units[0].id,saved,proofOverride){
 const html=read('geometry-merzlyak/atlas/'+id+'.html');
 const dom=new JSDOM(html,{url:'https://mathexam.space/geometry-merzlyak/atlas/'+id+'.html',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;
 if(saved)w.localStorage.setItem(S.KEY,JSON.stringify(saved));
 w.eval(html.match(/<script>window.COURSE_CONFIG=([\s\S]*?);<\/script>/)[0].slice(8,-9));
 if(proofOverride)w.COURSE_CONFIG.proof=proofOverride;
 const mounts=[];
 w.GeoExperiments={mount(){}};
 w.SpaceViewer={mount(){return {destroy(){}};}};
 w.GeoLab={mount(host,config,callback){const board={points:[],objects:[],snapshot(){return JSON.stringify({points:this.points,objects:this.objects});},update(){},goal(){return {ok:false};}};const api={destroy(){},board,redraw(){}};mounts.push({host,config,callback,api});return api;}};
 for(const f of ['store.js','tasks.js','extra-tasks.js','investigations.js','lesson.js'])w.eval(read('geometry-merzlyak/assets/'+f));
 return {dom,w,id,mounts,close(){dom.window.close();},get(){return JSON.parse(w.localStorage.getItem(S.KEY)).units[id];},save(){return JSON.parse(w.localStorage.getItem(S.KEY));}};
}
function click(c,selector){const el=c.w.document.querySelector(selector);assert.ok(el,'Missing '+selector);el.click();}
function input(c,selector,value,type='input'){const el=c.w.document.querySelector(selector);assert.ok(el,'Missing '+selector);el.value=value;el.dispatchEvent(new c.w.Event(type,{bubbles:true}));}
function reload(c){const id=c.id,saved=c.save();c.close();return lesson(id,saved);}
function oldState(id,stage,extra={}){return S.clean({stage,seed:17,attemptSchema:2,contentVersion:S.currentVersion(id),updated:42,diagnosis:'Старая первая догадка',observation:'Старое наблюдение',written:'Старое доказательство',draft:'Старый самостоятельный черновик',guidedDraft:'Черновик с опорой',independent:3,selfCorrected:2,assistedSolved:4,...extra});}
function saved(id,value){return {version:1,units:{[id]:value}};}
function memoryStore(run){const prior=global.localStorage,entries=new Map();global.localStorage={getItem:key=>entries.get(key)||null,setItem:(key,value)=>entries.set(key,String(value))};try{return run(entries);}finally{if(prior===undefined)delete global.localStorage;else global.localStorage=prior;}}

test('H27 leaves the source map, all old tasks, proofs, models and teacher report byte-identical',()=>{
 const immutable={
  'geometry-merzlyak/data/course.json':'06ca48f740ae05746df9719439f54cfab358d7fa4b0bd0c31babbe1e08d554c4',
  'geometry-merzlyak/data/proofs.json':'c67b7e03387093c9012ef96b3b351ed4e90ae7d899fd34e4679be64d99a7ef60',
  'geometry-merzlyak/assets/tasks.js':'4a4568b36ec578e618f879422f95684c8cb1b8b0a0d4e62c86d6b16ecd45a7be',
  'geometry-merzlyak/assets/extra-tasks.js':'fde38b2388e5d5d80fb73cb92db4bb5b68a23a8a365a9cde2721000a08515d61',
  'geometry-merzlyak/assets/geometry.js':'4b2cb38c8e3f03a1ea6ed8f704a6b9496e0f3b7e0c69271e8e747f5f4b7c8c6b',
  'geometry-merzlyak/assets/lab.js':'72ba8410183945d0b07edc85db516566e6806f465fdb2102cf4049246caf50f0',
  'geometry-merzlyak/assets/experiments.js':'448787ebc6b683d04d1403a92bd11c20dc4fe4c0ad08d1d22f6c9ff49b22c204',
  'geometry-merzlyak/assets/extra-models.js':'ad5230388f7b8690ca6c5967b21f55263de78f8369313d2bad10c567c12ef2b2',
  'geometry-merzlyak/assets/space.js':'a981289d024f758de0915239be9dbaa90bf8413fee67b19d2010dbe448388276',
  'geometry-merzlyak/assets/viewer.js':'73e5a58a693c56499bba10b5dc04346c6f8bcbe82a95673c8f177feca115aa6a',
  'geometry-merzlyak/teacher.html':'c80c1efb1dbbe10efe9335c15aac303ee65fa2cad00365960f2965bccf78130b',
  'geometry-merzlyak/assets/teacher.js':'66be04431400f16270ddafc6a5bbb4fd7be03313f74da1e082dbf8f8f74ef923'
 };
 for(const [file,hash]of Object.entries(immutable))assert.equal(sha(fs.readFileSync(path.join(root,file))),hash,file);
 assert.equal(course.units.length,84);assert.equal(course.sources.length,149);
 assert.deepEqual([7,8,9].map(g=>course.units.filter(u=>u.grade===g).length),[25,30,29]);
 assert.deepEqual(['base','advanced'].map(track=>course.units.filter(u=>u.track===track).length),[68,16]);
});

test('all 84 generated configs keep source, order, aliases, tasks and proofs, with the new module loaded before runtime',()=>{
 const catalog=course.units.map(u=>Object.fromEntries(['id','title','grade','chapter','points','requires'].map(k=>[k,u[k]])));
 assert.equal(fs.readdirSync(path.join(courseDir,'atlas')).filter(f=>f.endsWith('.html')).length,84);
 for(const unit of course.units){
  const html=read('geometry-merzlyak/atlas/'+unit.id+'.html');
  const config=JSON.parse(html.match(/window.COURSE_CONFIG=([\s\S]*?);<\/script>/)[1]);
  assert.deepEqual(config.unit,unit,unit.id);assert.deepEqual(config.proof,proofs[unit.proof]);assert.deepEqual(config.catalog,catalog);assert.equal(config.investigation,unit.investigation);assert.equal(config.experiment,unit.experiment);
  assert.ok(html.indexOf('assets/investigations.js')<html.indexOf('assets/lesson.js'),unit.id);
  assert.ok(html.includes('<link rel="canonical" href="https://mathexam.space/geometry-merzlyak/atlas/'+unit.id+'.html">'));
  assert.ok(html.includes('/assets/assistant/navigator-data.js?v=20261105-site1'));assert.ok(html.includes('/assets/assistant/navigator-widget.js?v=20261105-site1'));
 }
 const midline=read('geometry-merzlyak/atlas/merzlyak-base-8-7.html').match(/<script data-preserved-midline>\n([\s\S]*?)<\/script>/)[1];
 assert.equal(sha(midline),'9b38217f82967e8772f659121404f778f8a0ba2491c085c3a48d512d7ab0911c');
 assert.equal(midline,read('geometry-course/assets/midline-diagram.js'));
 assert.ok(!read('geometry-merzlyak/atlas/merzlyak-base-8-7.html').includes('src="/geometry-course/'));
});

test('lessons-only build reproduces all 84 pages and does not write index, teacher or README',()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'merzlyak-h27-build-'));
 try{
  for(const file of ['tools/merzlyak/build.py','geometry-merzlyak/data/course.json','geometry-merzlyak/data/proofs.json','geometry-course/assets/midline-diagram.js']){const target=path.join(tmp,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,file),target);}
  for(const file of ['index.html','teacher.html','README.md'])fs.writeFileSync(path.join(tmp,'geometry-merzlyak',file),'untouched '+file);
  execFileSync('python3',[path.join(tmp,'tools/merzlyak/build.py'),'--lessons-only']);
  for(const unit of course.units)assert.equal(fs.readFileSync(path.join(tmp,'geometry-merzlyak/atlas',unit.id+'.html'),'utf8'),read('geometry-merzlyak/atlas/'+unit.id+'.html'),unit.id);
  for(const file of ['index.html','teacher.html','README.md'])assert.equal(fs.readFileSync(path.join(tmp,'geometry-merzlyak',file),'utf8'),'untouched '+file);
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});

test('all 84 fresh lessons start on their own inquiry before any authored conclusion or old construction',()=>{
 assert.deepEqual(Object.keys(I.specs).sort(),course.units.map(u=>u.id).sort());
 for(const unit of course.units){const c=lesson(unit.id);try{
  assert.equal(c.get().screen,'research',unit.id);assert.equal(c.get().stage,0);assert.equal(c.get().routeVersion,2);
  assert.ok(c.w.document.querySelector('[data-investigation="'+unit.id+'"]'),unit.id);
  assert.ok(c.w.document.querySelector('#topic-research').textContent.includes(I.get(unit.id).question));
  assert.ok(c.w.document.querySelector('[data-research-prediction]'));
  assert.equal(c.w.document.querySelector('[data-research-result]').hidden,true);
  assert.equal(c.w.document.querySelector('#geo-board'),null);
  assert.equal(c.w.document.querySelector('[data-stage="1"]'),null);
  assert.equal(c.get().independent,0);assert.equal(c.get().selfCorrected,0);assert.equal(c.get().assistedSolved,0);
 }finally{c.close();}}
});

test('old numeric stage meanings and every kind of written record survive for every lesson',()=>{
 for(const unit of course.units)for(let stage=0;stage<=5;stage++)memoryStore(entries=>{
  const old=oldState(unit.id,stage,{moved:true,proofChecks:[0,2],diagnosisShown:true,observationShown:true,events:[{type:'step',time:42}]});
  entries.set(S.KEY,JSON.stringify(saved(unit.id,old)));const store=S.open(course.units.map(u=>u.id));const restored=store.get(unit.id);
  assert.equal(restored.stage,stage,unit.id);assert.equal(restored.screen,'');assert.equal(restored.seed,17);
  for(const key of ['diagnosis','observation','written','draft','guidedDraft','independent','selfCorrected','assistedSolved','diagnosisShown','observationShown','moved','proofChecks','events'])assert.deepEqual(restored[key],old[key],unit.id+' '+key);
  assert.ok(store.put(unit.id,restored));const exported=store.export();const imported=S.validate(exported,course.units.map(u=>u.id));assert.deepEqual(imported.units[unit.id],exported.units[unit.id]);
 });
});

test('all six historical stages remain reachable on restoration; new next never opens the old stage-1 model',()=>{
 const id='merzlyak-base-7-2';
 for(let stage=0;stage<=5;stage++){const c=lesson(id,saved(id,oldState(id,stage)));try{
  assert.equal(c.get().stage,stage);assert.equal(c.get().screen,'');
  const expected=['#diagnosis','#geo-board','#proof-board','#answer','#answer','#written'][stage];assert.ok(c.w.document.querySelector(expected),expected);
 }finally{c.close();}}
 let c=lesson(id);try{click(c,'[data-action="next"]');assert.equal(c.get().stage,0);assert.equal(c.get().screen,'');assert.match(c.w.document.querySelector('.step-label').textContent,/02 \/ 6/);click(c,'[data-action="next"]');assert.equal(c.get().stage,2);assert.equal(c.w.document.querySelector('#geo-board'),null);}finally{c.close();}
 c=lesson(id,saved(id,oldState(id,1)));try{click(c,'[data-view="research"]');assert.equal(c.get().screen,'research');assert.equal(c.w.document.querySelector('#geo-board'),null);assert.ok(c.w.document.querySelector('.legacy-research [data-stage="1"]'));click(c,'.legacy-research [data-stage="1"]');assert.equal(c.w.document.querySelector('#observation').value,'Старое наблюдение');}finally{c.close();}
});

test('valid alternative proof orders and both old construction and free proof drawings restore exactly',()=>{

 for(const unit of course.units){const P=proofs[unit.proof],done=new Set(),order=[];
  while(order.length<P.steps.length){const next=P.steps.slice().reverse().find(s=>!done.has(s.id)&&s.depends.every(id=>done.has(id)));assert.ok(next);order.push(next.id);done.add(next.id);}
  const drawing={points:[{id:'A',kind:'free',x:14,y:33},{id:'B',kind:'free',x:55,y:70}],objects:[{id:'L1',type:'line',extent:'line',a:'A',b:'B'}]};
  const c=lesson(unit.id,saved(unit.id,oldState(unit.id,2,{proofDone:order,drawing,proofDrawing:drawing})));try{
   assert.deepEqual(c.get().proofDone,order,unit.id);assert.equal(c.get().proof,true,unit.id);assert.deepEqual(c.get().drawing,drawing);assert.deepEqual(c.get().proofDrawing,drawing);
   assert.deepEqual(clone(c.mounts.at(-1).api.board.points),drawing.points);
  }finally{c.close();}
 }
 const id='merzlyak-base-7-2',branching={...proofs[course.units.find(u=>u.id===id).proof],steps:[{id:'s1',text:'Условие',reason:'Дано',depends:[]},{id:'s2',text:'Первый независимый довод',reason:'Определение',depends:['s1']},{id:'s3',text:'Второй независимый довод',reason:'Определение',depends:['s1']},{id:'s4',text:'Следствие',reason:'Из обоих доводов',depends:['s2','s3']}]};
 const order=['s1','s3','s2','s4'];const c=lesson(id,saved(id,oldState(id,2,{proofDone:order})),branching);try{assert.deepEqual(c.get().proofDone,order);assert.equal(c.get().proof,true);}finally{c.close();}
 const corrupt=lesson(id,saved(id,oldState(id,2,{proofDone:['s4','s1','s1','s3']})),branching);try{assert.deepEqual(corrupt.get().proofDone,['s1','s3']);assert.equal(corrupt.get().proof,false);}finally{corrupt.close();}
});

test('research is bounded plain data and never awards independent, corrected or assisted exercise success',()=>{
 const raw={schema:1,predictionDraft:'я думаю',firstPrediction:'Пока не знаю',started:true,controls:JSON.parse('{"x":5,"mode":"one","__proto__":{"polluted":true},"constructor":"bad","svg":"<svg>"}'),observations:Array.from({length:30},(_,i)=>({controls:{x:i},text:'Наблюдение '+i})),observationDraft:'o'.repeat(3000),conclusionOpen:true,completed:true,helped:true};
 const clean=S.clean({research:raw,independent:2,selfCorrected:1,assistedSolved:3});assert.equal(clean.research.observations.length,12);assert.equal(clean.research.observationDraft.length,2000);assert.equal(Object.hasOwn(clean.research.controls,'__proto__'),false);assert.equal(Object.hasOwn(clean.research.controls,'constructor'),false);
 assert.equal({}.polluted,undefined);assert.equal(clean.independent,2);assert.equal(clean.selfCorrected,1);assert.equal(clean.assistedSolved,3);
 assert.equal(S.progress(S.clean({research:raw})).independent,0);assert.equal(S.research({completed:true,conclusionOpen:true}).completed,false);
 memoryStore(()=>{const store=S.open(['a']);const value=store.get('a');value.research=clean.research;assert.ok(store.put('a',value));const json=JSON.parse(JSON.stringify(store.export()));assert.deepEqual(S.validate(json,['a']).units.a.research,clean.research);});
});

test('same-unit stale saves, including equal timestamps and newer imports, cannot overwrite another window',()=>memoryStore(entries=>{
 const initial=S.clean({stage:5,written:'Первоначальная запись',updated:10});entries.set(S.KEY,JSON.stringify(saved('a',initial)));
 const first=S.open(['a','b']),second=S.open(['a','b']),a=first.get('a'),b=second.get('a');
 a.written='Первая вкладка';assert.equal(first.put('a',a),true);b.written='Вторая вкладка';assert.equal(second.put('a',b),false);assert.equal(first.export().units.a.written,'Первая вкладка');
 const reopened=second.get('a');assert.equal(reopened.written,'Первая вкладка');reopened.written='После явного восстановления';assert.equal(second.put('a',reopened),true);
 const third=S.open(['a','b']),stale=third.get('a'),external=clone(third.export());external.units.a.written='Изменено с тем же временем';entries.set(S.KEY,JSON.stringify(external));assert.equal(third.isCurrent('a'),false);stale.written='Запись устаревшего окна';assert.equal(third.put('a',stale),false);assert.equal(third.export().units.a.written,'Изменено с тем же временем');
 const editor=S.open(['a','b']),edited=editor.get('a'),importer=S.open(['a','b']);importer.import(saved('a',{...edited,updated:edited.updated+100,written:'Импортированная новая работа'}));edited.written='Старая работа после импорта';assert.equal(editor.put('a',edited),false);assert.equal(editor.export().units.a.written,'Импортированная новая работа');
}));

test('two windows editing different lessons preserve both records without false conflicts',()=>memoryStore(()=>{
 const first=S.open(['a','b']),second=S.open(['a','b']),a=first.get('a'),b=second.get('b');a.written='Работа A';b.written='Работа B';assert.equal(first.put('a',a),true);assert.equal(second.put('b',b),true);a.diagnosis='Новая мысль A';assert.equal(first.put('a',a),true);const all=second.export();assert.equal(all.units.a.written,'Работа A');assert.equal(all.units.a.diagnosis,'Новая мысль A');assert.equal(all.units.b.written,'Работа B');
}));

test('blocked browser storage retains inquiry and old drafts for export and later import',()=>{
 const previous=global.localStorage;try{global.localStorage={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};const notices=[],store=S.open(['a'],m=>notices.push(m)),v=store.get('a');v.diagnosis='Первый черновик';v.research={firstPrediction:'Пока не знаю',started:true,predictionDraft:'Пока не знаю',controls:{angle:75},observations:[{controls:{angle:45},text:'Первый случай'},{controls:{angle:75},text:'Другая величина'}],observationDraft:'',conclusionOpen:true,completed:true,helped:false};assert.equal(store.put('a',v),true);assert.equal(store.export().units.a.diagnosis,'Первый черновик');assert.equal(store.export().units.a.research.controls.angle,75);assert.ok(notices.length);assert.equal(S.validate(store.export(),['a']).units.a.research.completed,true);}finally{if(previous===undefined)delete global.localStorage;else global.localStorage=previous;}
});

test('a stale browser runtime locks edits, preserves a local export and requires explicit reopening',()=>{
 const id='merzlyak-base-7-2',c=lesson(id,saved(id,oldState(id,5)));try{
  input(c,'#written','Несохранённый местный черновик');const external=c.save();external.units[id].written='Работа другого окна';// keep updated equal intentionally
  c.w.localStorage.setItem(S.KEY,JSON.stringify(external));c.w.dispatchEvent(new c.w.StorageEvent('storage',{key:S.KEY}));
  assert.ok(c.w.document.querySelector('#research-conflict'));assert.ok(c.w.document.querySelector('#lesson').hasAttribute('inert'));assert.match(c.w.document.querySelector('#research-conflict textarea').value,/Несохранённый местный черновик/);
  let downloaded;c.w.GeoStore.download=data=>{downloaded=clone(data);};click(c,'[data-conflict="mine"]');assert.equal(downloaded.units[id].written,'Несохранённый местный черновик');assert.equal(c.get().written,'Работа другого окна');
  click(c,'[data-conflict="open"]');assert.equal(c.w.document.querySelector('#research-conflict'),null);assert.equal(c.w.document.querySelector('#written').value,'Работа другого окна');input(c,'#written','Продолжение после восстановления');click(c,'[data-stage="0"]');assert.equal(c.get().written,'Продолжение после восстановления');
 }finally{c.close();}
});

test('each topic accepts uncertainty, saves the first prediction, two cases and observation, and keeps numerical credit separate',()=>{
 for(const unit of course.units){let c=lesson(unit.id);try{
  const select=c.w.document.querySelector('[data-research-prediction]');const unknown=Array.from(select.options).find(o=>o.textContent==='Пока не знаю');assert.ok(unknown,unit.id+' permits uncertainty');
  input(c,'[data-research-prediction]',unknown.value,'change');click(c,'[data-research-start]');
  const first=c.get().research.firstPrediction;assert.ok(first,unit.id);assert.equal(c.get().research.started,true);
  assert.ok(c.w.document.querySelector('[data-research-scene] svg'));assert.equal(c.w.document.querySelector('[data-research-result]').hidden,true);
  input(c,'[data-research-observation]','Первый случай: записал видимые величины.');click(c,'[data-research-record]');
  const spec=I.get(unit.id),control=spec.controls[0],target=c.w.document.querySelector('[data-research-control="'+control.key+'"]');assert.ok(target);
  const value=control.type==='select'?control.options.find(o=>String(o.value)!==target.value).value:(Number(target.value)===control.max?control.min:control.max);
  input(c,'[data-research-control="'+control.key+'"]',String(value),'input');input(c,'[data-research-control="'+control.key+'"]',String(value),'change');
  input(c,'[data-research-observation]','Второй случай: сравнил изменение и сохранившееся отношение.');click(c,'[data-research-record]');click(c,'[data-research-conclusion]');
  assert.equal(c.w.document.querySelector('[data-research-result]').hidden,false,unit.id+' can open the conclusion after investigation');
  const research=c.get().research;assert.equal(research.firstPrediction,first);assert.ok(research.observations.length>=2);assert.equal(research.completed,true);assert.equal(c.get().independent,0);assert.equal(c.get().selfCorrected,0);assert.equal(c.get().assistedSolved,0);
  c=reload(c);assert.deepEqual(c.get().research,research,unit.id+' inquiry round-trip');assert.equal(c.w.document.querySelector('[data-research-result]').hidden,false);
  click(c,'[data-action="next"]');assert.equal(c.get().stage,0);assert.equal(c.get().research.firstPrediction,first);assert.equal(c.get().independent,0);
 }finally{c.close();}}
});

test('catalogue uses topical prompts and returns to the precise new or historical screen',()=>{
 function catalogue(record){const html=read('geometry-merzlyak/index.html'),dom=new JSDOM(html,{url:'https://mathexam.space/geometry-merzlyak/',runScripts:'outside-only'}),w=dom.window;if(record)w.localStorage.setItem(S.KEY,JSON.stringify(record));w.eval(html.match(/<script>window.CATALOG=([\s\S]*?);<\/script>/)[0].slice(8,-9));for(const f of ['store.js','investigations.js','catalog.js'])w.eval(read('geometry-merzlyak/assets/'+f));return {dom,w};}
 const id='merzlyak-base-7-1',record=S.clean({routeVersion:2,screen:'research',stage:0,research:{predictionDraft:'unknown'},updated:100}),c=catalogue(saved(id,record));try{
  assert.equal(c.w.document.querySelector('[data-resume]').getAttribute('href'),'atlas/'+id+'.html');assert.match(c.w.document.querySelector('.path-current').textContent,/Первое исследование по теме/);
  for(const unit of course.units)assert.equal(c.w.document.querySelector('[data-id="'+unit.id+'"] > h3 + p').textContent,I.get(unit.id).question);
 }finally{c.dom.window.close();}
 for(const stage of [0,1,2,3,4,5]){const c=catalogue(saved(id,oldState(id,stage)));try{const text=c.w.document.querySelector('.path-current').textContent;assert.ok(text.includes(stage===1?'Прежнее построение · сохранённая работа':'Этап '+(stage+1)+' из 6'));}finally{c.dom.window.close();}}
});

function interleavedStorage(run){
 const prior=global.localStorage,entries=new Map();let hook=null,busy=false;
 global.localStorage={get length(){return entries.size;},key:i=>[...entries.keys()][i]??null,getItem:key=>entries.get(key)??null,removeItem:key=>entries.delete(key),setItem(key,value){if(hook&&!busy){busy=true;try{hook(key,String(value));}finally{busy=false;}}entries.set(key,String(value));}};
 try{return run(entries,fn=>{hook=fn;});}finally{if(prior===undefined)delete global.localStorage;else global.localStorage=prior;}
}
test('causal sibling snapshots preserve both drafts when two writers read the same parent before either write',()=>{
 for(const intercept of ['recovery','aggregate'])interleavedStorage((entries,setHook)=>{
  const now=Date.now;Date.now=()=>1000;try{
   entries.set(S.KEY,JSON.stringify(saved('a',S.clean({written:'Начало',updated:1}))));
   const a=S.open(['a','b']),b=S.open(['a','b']),left=a.get('a'),right=b.get('a');left.written='Левый одновременный черновик';right.written='Правый одновременный черновик';
   let fired=false;setHook(key=>{if(!fired&&(intercept==='recovery'?key.startsWith(S.RECOVERY):key===S.KEY)){fired=true;b.put('a',right);}});a.put('a',left);setHook(null);assert.equal(fired,true);
   const exported=a.export(),all=[exported.units.a.written,...a.recoveries('a').map(r=>r.state.written)];assert.ok(all.includes(left.written),intercept+' preserves A');assert.ok(all.includes(right.written),intercept+' preserves B');
   assert.equal(exported.units.a.written,JSON.parse(entries.get(S.KEY)).units.a.written,'compatible aggregate is repaired');
   const work=exported.recovery.filter(r=>r.unit==='a');assert.ok(work.length>=2);assert.ok(work.every(r=>r.state.updated===1000||r.kind==='conflict'),'equal clocks are not treated as an ownership lock');
   if(intercept==='recovery'){const siblings=work.filter(r=>r.kind==='snapshot');assert.equal(siblings.length,2);assert.equal(siblings[0].parent,siblings[1].parent);assert.equal(siblings[0].clock,siblings[1].clock);}
  }finally{Date.now=now;}
 });
});
test('interleaving a different-unit commit inside aggregate setItem cannot erase either lesson',()=>interleavedStorage((entries,setHook)=>{
 const a=S.open(['a','b']),b=S.open(['a','b']),left=a.get('a'),right=b.get('b');left.written='Урок A';right.written='Урок B';let fired=false;
 setHook(key=>{if(!fired&&key===S.KEY){fired=true;assert.equal(b.put('b',right),true);}});assert.equal(a.put('a',left),true);setHook(null);
 assert.equal(a.export().units.a.written,'Урок A');assert.equal(a.export().units.b.written,'Урок B');assert.equal(JSON.parse(entries.get(S.KEY)).units.b.written,'Урок B');assert.equal(a.recoveries('a').length,0);assert.equal(b.recoveries('b').length,0);
}));
test('conflicting work round-trips through export/import and compaction removes only a persisted ancestor',()=>{
 let transferable;
 interleavedStorage((entries,setHook)=>{
  const a=S.open(['a']),b=S.open(['a']),left=a.get('a'),right=b.get('a');left.written='Сохранённая первая ветка';right.written='Сохранённая вторая ветка';let fired=false;
  setHook(key=>{if(!fired&&key.startsWith(S.RECOVERY)){fired=true;b.put('a',right);}});a.put('a',left);setHook(null);transferable=JSON.parse(JSON.stringify(a.export()));
 });
 interleavedStorage(entries=>{
  const store=S.open(['a']);assert.equal(store.import(transferable),1);const main=store.get('a'),alternative=store.recoveries('a');assert.equal(alternative.length,1);assert.ok(new Set([main.written,alternative[0].state.written]).has('Сохранённая первая ветка'));assert.ok(new Set([main.written,alternative[0].state.written]).has('Сохранённая вторая ветка'));
  const preserved=alternative[0].state.written;main.diagnosis='Продолжение выбранной версии';assert.equal(store.put('a',main),true);assert.equal(store.recoveries('a')[0].state.written,preserved);const exported=store.export();assert.deepEqual(S.validate(exported,['a']).recovery,exported.recovery);
  const recoveryKeys=[...entries.keys()].filter(k=>k.startsWith(S.RECOVERY));assert.equal(recoveryKeys.length,3,'the original fork anchors remain alongside the active descendant');
 });
});
test('a stale pending textarea is captured in a separate recovery record before the UI freezes',()=>{
 const id='merzlyak-base-7-2',c=lesson(id,saved(id,oldState(id,5)));try{
  input(c,'#written','Местный черновик, ещё ожидающий debounce');const external=c.save();external.units[id].written='Свежая запись другого окна';c.w.localStorage.setItem(S.KEY,JSON.stringify(external));c.w.dispatchEvent(new c.w.StorageEvent('storage',{key:S.KEY}));
  const store=c.w.GeoStore.open(course.units.map(u=>u.id)),recovery=store.recoveries(id);assert.ok(recovery.some(r=>r.state.written==='Местный черновик, ещё ожидающий debounce'));assert.equal(store.get(id).written,'Свежая запись другого окна');
  const exported=JSON.parse(JSON.stringify(store.export()));assert.ok(exported.recovery.some(r=>r.state.written==='Местный черновик, ещё ожидающий debounce'));click(c,'[data-conflict="open"]');assert.ok(c.w.document.querySelector('.recovery-work'));let downloaded;c.w.GeoStore.download=data=>{downloaded=clone(data);};const version=recovery.find(r=>r.state.written==='Местный черновик, ещё ожидающий debounce');click(c,'[data-recovery="'+version.id+'"]');assert.equal(downloaded.units[id].written,'Местный черновик, ещё ожидающий debounce');
 }finally{c.close();}
});

function creditFork(overrides={}){
 const common=S.clean({stage:4,seed:9,currentTaskKey:'same-condition',seenTasks:['same-condition'],attemptSchema:2,independent:7,selfCorrected:2,assistedSolved:4,updated:1000});
 const hint=S.clean({...common,assisted:true,fullSolution:true,...overrides.hint,workRevision:'a-hint'}),solo=S.clean({...common,solved:true,result:'first',independent:8,draft:'12',solvedDraft:'12',lastCheck:'correct',lastCheckMode:'independent',tries:1,...overrides.solo,workRevision:'z-solo'});
 const record=(id,state)=>({version:1,id,unit:'a',kind:'snapshot',parent:'shared-parent',lineage:['shared-parent'],clock:2,state});
 return {version:1,units:{a:solo},recovery:[record('a-hint',hint),record('z-solo',solo)]};
}
test('equal-parent/clock forks conservatively attribute current task assistance while preserving prior counters and both raw branches',()=>interleavedStorage(()=>{
 const store=S.open(['a']);store.import(creditFork());let current=store.get('a');assert.equal(current.result,'helped');assert.equal(current.assisted,true);assert.equal(current.independent,7);assert.equal(current.selfCorrected,2);assert.equal(current.assistedSolved,5);assert.equal(S.progress(current).first,7);
 let exported=store.export();assert.equal(exported.recovery.find(r=>r.id==='z-solo').state.independent,8);assert.equal(exported.recovery.find(r=>r.id==='z-solo').state.assisted,false);assert.equal(exported.recovery.find(r=>r.id==='a-hint').state.fullSolution,true);
 current.written='Продолжение сохранённой версии';assert.equal(store.put('a',current),true);current=store.get('a');assert.equal(current.independent,7);assert.equal(current.result,'helped');assert.equal(store.export().recovery.find(r=>r.id==='z-solo').state.independent,8,'raw disputed original remains available');
 Object.assign(current,{seed:10,currentTaskKey:'fresh-condition',seenTasks:[...current.seenTasks,'fresh-condition'],assisted:false,fullSolution:false,helpRevealed:0,helpExplained:[],guidedHintSteps:[],errorAdvice:'',solved:true,result:'first',independent:8,mistakes:0,repeatedTask:false});assert.equal(store.put('a',current),true);assert.equal(store.get('a').independent,8);assert.equal(store.get('a').result,'first','a genuinely new condition can earn new independent credit');
}));
test('a credit already present on both branches survives later help; errors and familiar conditions are attributed separately',()=>{
 interleavedStorage(()=>{const store=S.open(['a']);store.import(creditFork({hint:{independent:8,result:'first',solved:true}}));const value=store.get('a');assert.equal(value.independent,8);assert.equal(value.result,'first');assert.equal(value.assisted,true,'later help remains visible without erasing earned evidence');});
 interleavedStorage(()=>{const store=S.open(['a']);store.import(creditFork({hint:{assisted:false,fullSolution:false,mistakes:1,lastCheck:'wrong'}}));const value=store.get('a');assert.equal(value.independent,7);assert.equal(value.selfCorrected,3);assert.equal(value.result,'corrected');assert.equal(value.assisted,false);});
 interleavedStorage(()=>{const store=S.open(['a']);store.import(creditFork({hint:{assisted:false,fullSolution:false,currentTaskKey:'another-condition',seenTasks:['same-condition','another-condition']}}));const value=store.get('a');assert.equal(value.independent,7);assert.equal(value.result,'repeated');assert.equal(value.repeatedTask,true);assert.ok(value.seenTasks.includes('another-condition'),'the other branch cannot be forgotten by fresh-task selection');});
});
test('real interleaving of a hint and a fresh answer cannot publish a clean independent increment',()=>interleavedStorage((entries,setHook)=>{
 entries.set(S.KEY,JSON.stringify(saved('a',S.clean({stage:4,seed:9,currentTaskKey:'same-condition',seenTasks:['same-condition'],attemptSchema:2,independent:7,updated:1}))));
 const hintStore=S.open(['a']),answerStore=S.open(['a']),hint=hintStore.get('a'),answer=answerStore.get('a');hint.assisted=true;hint.fullSolution=true;answer.solved=true;answer.result='first';answer.independent=8;
 let fired=false;const originalNow=Date.now;let now=1000;Date.now=()=>now;try{setHook(key=>{if(!fired&&key.startsWith(S.RECOVERY)){fired=true;now=1001;answerStore.put('a',answer);}});hintStore.put('a',hint);setHook(null);const reopened=S.open(['a']).get('a');assert.equal(reopened.independent,7);assert.equal(reopened.result,'helped');assert.equal(reopened.assisted,true);assert.equal(hintStore.export().recovery.filter(r=>r.kind==='snapshot').length,2);}finally{Date.now=originalNow;}
}));
test('recovery-cap and collision handling keep every prior record and the latest export importable',()=>{
 interleavedStorage(entries=>{
  const state=S.clean({stage:5,written:'Исходная запись',updated:1}),records=Array.from({length:2048},(_,i)=>({version:1,id:'cap-'+i,unit:'a',kind:'conflict',parent:null,lineage:[],clock:i+1,state:S.clean({...state,workRevision:'cap-'+i})}));
  entries.set(S.KEY,JSON.stringify({version:1,units:{a:state},recovery:records}));const notices=[],store=S.open(['a'],message=>notices.push(message)),current=store.get('a');current.written='Последний черновик при заполненном журнале';assert.equal(store.put('a',current),true);const exported=store.export();assert.equal(exported.recovery.length,2048);assert.equal(exported.units.a.written,current.written);assert.equal(S.validate(JSON.parse(JSON.stringify(exported)),['a']).units.a.written,current.written);assert.equal(JSON.parse(entries.get(S.KEY)).units.a.written,'Исходная запись');assert.ok(notices.some(message=>message.includes('заполнен')));
 });
 interleavedStorage(entries=>{
  const store=S.open(['a']),v=store.get('a');v.written='Оригинал без подмены';store.put('a',v);const before=JSON.parse(JSON.stringify(store.export())),bad=clone(before);bad.recovery[0].state.written='Подмена того же id';bad.units.a.written='Подмена';assert.throws(()=>store.import(bad),/один идентификатор/);assert.deepEqual(store.export(),before);assert.equal(JSON.parse(entries.get(S.RECOVERY+before.recovery[0].id)).state.written,'Оригинал без подмены');
 });
});
test('a corrupt recovery key does not destroy a valid legacy snapshot or unknown storage',()=>interleavedStorage(entries=>{
 entries.set(S.KEY,JSON.stringify(saved('a',S.clean({stage:5,written:'Целая прежняя работа',updated:1}))));entries.set(S.RECOVERY+'broken','not-json');entries.set('unrelated-old-course','must stay exactly');const notices=[],store=S.open(['a'],message=>notices.push(message));assert.equal(store.export().units.a.written,'Целая прежняя работа');assert.equal(entries.get(S.RECOVERY+'broken'),'not-json');assert.equal(entries.get('unrelated-old-course'),'must stay exactly');assert.ok(notices.length);
}));

test('shared historical credit for the exact old attempt survives a new success in another task',()=>{
 for(const laterHelp of [false,true])interleavedStorage(()=>{
  const history={taskKey:'old-X',seed:3,question:'Прежнее условие',draft:'5',solvedDraft:'5',result:'first',assisted:laterHelp,helpRevealed:laterHelp?1:0};
  const store=S.open(['a']);store.import(creditFork({hint:{currentTaskKey:'new-Y',seed:9,assisted:false,fullSolution:false,result:'',seenTasks:['old-X','new-Y'],recentAttempts:[history]},solo:{currentTaskKey:'new-Y',seed:9,seenTasks:['old-X','new-Y'],recentAttempts:[history]}}));
  const current=store.get('a');assert.equal(current.independent,8);assert.equal(current.result,'first');assert.equal(current.recentAttempts[0].result,'first');assert.equal(current.recentAttempts[0].assisted,laterHelp);
 });
});
test('a different seed with the same condition cannot borrow an older attempt first-credit evidence',()=>interleavedStorage(()=>{
 const history={taskKey:'same-condition',seed:3,question:'Прежнее совпадающее условие',draft:'5',solvedDraft:'5',result:'first',assisted:false};
 const store=S.open(['a']);store.import(creditFork({hint:{seed:3,assisted:false,fullSolution:false,result:'first',recentAttempts:[history]},solo:{seed:9,recentAttempts:[history]}}));const current=store.get('a');assert.equal(current.independent,7);assert.equal(current.result,'repeated');assert.equal(current.recentAttempts[0].result,'first');
}));
test('over-cap import rejects the whole recovery union before any sibling or original record changes',()=>interleavedStorage(entries=>{
 const base=S.clean({written:'Исходная основная запись',updated:1});const records=Array.from({length:2048},(_,i)=>({version:1,id:'full-'+i,unit:'a',kind:'conflict',parent:null,lineage:[],clock:i+1,state:S.clean({...base,workRevision:'full-'+i})}));entries.set(S.KEY,JSON.stringify({version:1,units:{a:base},recovery:records}));const store=S.open(['a']),before=JSON.parse(JSON.stringify(store.export())),storageBefore=[...entries.entries()];assert.throws(()=>store.import(creditFork()),/недостаточно места.*Импорт не выполнен/);assert.deepEqual(store.export(),before);assert.deepEqual([...entries.entries()],storageBefore);
}));

test('a large valid legacy seen-task history remains readable in a new recovery record',()=>interleavedStorage(entries=>{
 const prior=S.clean({stage:4,seed:12,written:'Прежняя большая запись',seenTasks:Array.from({length:600},(_,i)=>'condition-'+i+'-'+('x'.repeat(800))),updated:1});entries.set(S.KEY,JSON.stringify(saved('a',prior)));const notices=[],store=S.open(['a'],message=>notices.push(message)),value=store.get('a');value.written='Продолжение большой прежней записи';assert.equal(store.put('a',value),true);const reopened=S.open(['a'],message=>notices.push(message));assert.deepEqual(reopened.get('a').seenTasks,prior.seenTasks);assert.equal(reopened.get('a').written,value.written);assert.equal(S.validate(reopened.export(),['a']).units.a.written,value.written);assert.deepEqual(notices,[]);
}));

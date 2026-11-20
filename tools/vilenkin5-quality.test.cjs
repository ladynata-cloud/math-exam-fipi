'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'school/index.html'),'utf8');
const KEY='mathexam.vilenkin5.quality.v1';
let checks=0;
const ok=(value,message)=>{assert(value,message);checks++;};
const equal=(a,b,message)=>{assert.deepEqual(a,b,message);checks++;};
const plain=x=>JSON.parse(JSON.stringify(x));
function boot(route='#course/vilenkin5',saved={},board=false,framed=false){
  const dom=new JSDOM(html,{url:'https://fixture.test/school/index.html?course=vilenkin5'+route,runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
  w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};
  if(board)w.document.body.setAttribute('data-vilenkin5-board','');
  if(framed)Object.defineProperty(w,'self',{value:{},configurable:true});
  for(const [key,value]of Object.entries(saved))w.localStorage.setItem(key,value);
  const errors=[];w.addEventListener('error',e=>errors.push(e.error||e.message));
  for(const tag of w.document.querySelectorAll('script[src]')){
    const file=new URL(tag.src).pathname;if(file.startsWith('/assets/'))continue;
    // Board transport is tested in its dedicated test; this exercises the actual school runtime.
    if(file.includes('vilenkin5-board'))continue;
    w.eval(fs.readFileSync(path.join(root,file),'utf8'));
  }
  const f={w,dom,errors,Q:w.Vilenkin5Quality,C:w.WorkshopCurriculum,M:w.WorkshopMath,
    $:selector=>w.document.querySelector(selector),
    route(route){w.history.replaceState(null,'',w.location.pathname+w.location.search+route);w.dispatchEvent(new w.HashChangeEvent('hashchange'));},
    input(selector,value){const field=this.$(selector);assert(field,selector);field.value=value;field.dispatchEvent(new w.Event('input',{bubbles:true}));return field;},
    submit(value){this.input('#answer',value);this.$('#answer-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));},
    click(selector){assert(this.$(selector),selector);this.$(selector).click();},
    snapshot(){return plain(this.Q.getState());},
    saved(){return Object.fromEntries(Array.from({length:w.localStorage.length},(_,i)=>{const k=w.localStorage.key(i);return[k,w.localStorage.getItem(k)];}));},
    close(){w.close();}
  };return f;
}
function value(M,t){const fmt=x=>Array.isArray(x)?x.map(fmt).join(';'):x&&typeof x==='object'?M.fmt(x):String(x);return t.answerFormat==='prime-factors'?t.answer.join('*'):t.answerFormat==='decimal'&&Number.isInteger(Number(t.answer?.n)/Number(t.answer?.d)||t.answer)?String(t.answer?.n/t.answer?.d||t.answer)+',0':fmt(t.answer);}
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
async function run(){
  const f=boot();
  equal(f.C.pathById.vilenkin5.ids.length,134);
  equal(f.$('#main').querySelectorAll('.v5-unit-card').length,53);
  ok(f.$('.v5q-quick-links a[href="#v5-unit/26"]'),'part two entrance');
  const modelKinds=new Set();
  for(const id of f.C.pathById.vilenkin5.ids){
    f.route('#lesson/'+id);const scene=f.snapshot().scene,l=f.C.byId[id],descriptor=f.w.Vilenkin5QualityModels.descriptor(l);modelKinds.add(descriptor.kind);
    equal(scene.id,id);ok(f.$('#model svg,#model table,#model .arithmetic-model,#model .g5-lab'),'visual for '+id);
    ok(f.$('label[for=answer]').textContent!=='Твой ответ'&&f.$('label[for=answer]').textContent.length>3,'explicit input question '+id);
    equal(f.$('#main').querySelectorAll('.v6-worked li').length,3,'canonical example '+id);
    const canonical=f.Q.validateState(f.w.JSON.parse(JSON.stringify(f.snapshot())));equal(plain(canonical),f.snapshot(),'canonical fresh scene '+id);
  }
  equal([...modelKinds].sort(),['angle','arithmetic','circle','decimal','fraction','lab','mean','percent']);
  const modelAPI=f.w.Vilenkin5QualityModels,windowState=raw=>f.w.JSON.parse(JSON.stringify(raw));
  // The same unit has the same length in both operands and their sum, before and after reveal.
  const fractionLesson=f.C.byId['v5f-fraction-add'];
  for(const [an,ad,bn,bd]of [[3,2,3,2],[7,3,5,4],[12,2,12,2]]){
    const state={...modelAPI.defaults(fractionLesson),an,ad,bn,bd};
    const before=f.w.document.createElement('div'),after=f.w.document.createElement('div');
    before.innerHTML=modelAPI.describe(fractionLesson,state,f.M).visual;
    after.innerHTML=modelAPI.describe(fractionLesson,{...state,seen:true},f.M).visual;
    const widths=[...after.querySelectorAll('rect.v5q-empty')].map(el=>Number(el.getAttribute('width')));
    ok(widths.length>3);ok(widths.every(width=>Math.abs(width-widths[0])<1e-9),'one common whole for A, B and result');
    equal(Number(before.querySelector('rect.v5q-empty').getAttribute('width')),widths[0],'reveal does not rescale the operands');
    const shaded=y=>[...after.querySelectorAll('rect.v5q-fill[y="'+y+'"]')].reduce((sum,el)=>sum+Number(el.getAttribute('width')),0);
    ok(Math.abs(shaded(20)+shaded(105)-shaded(190))<1e-8,'shaded sum conserves length');
  }
  // Textbook points 45/46 use a natural second operand; 47/48 retain decimal operands.
  for(const key of ['decimal-times-int','decimal-times-ten','decimal-divide-int','decimal-divide-zero','decimal-divide-ten']){
    const lesson=f.C.byId['v5f-'+key],initial=modelAPI.defaults(lesson),powers=key.endsWith('-ten'),multiply=key.includes('times');
    const allowed=powers?[10,100,1000]:[1,3,12];
    for(const a of [0,68,408,999])for(const b of allowed){
      const state=modelAPI.normalize(lesson,windowState({...initial,a,b})),view=modelAPI.describe(lesson,state,f.M);
      const numerator=multiply?a*b:a,denominator=multiply?100:100*b;
      equal(view.answer.n*denominator,numerator*view.answer.d,key+' uses a natural second operand');
      ok(view.controls.find(c=>c.key==='b').title.includes('натуральное число'));
      ok(!view.controls.some(c=>c.key==='factor'),'natural division does not teach clearing a decimal divisor');
    }
    for(const invalid of powers?[0,1,3,10000]:[0,0.5,-1,13]){assert.throws(()=>modelAPI.normalize(lesson,windowState({...initial,b:invalid})));checks++;}
    f.route('#lesson/'+lesson.id);const bControl=f.$('[data-v5-param=b]');
    if(powers)equal([...bControl.options].map(option=>Number(option.value)),[10,100,1000]);else {equal(bControl.min,'1');equal(bControl.step,'1');}
    equal(f.snapshot().scene.model.b,initial.b);
  }
  for(const [key,a,b,numerator,denominator]of [['decimal-multiply',68,57,3876,10000],['decimal-divide',150,25,6,1]]){
    const lesson=f.C.byId['v5f-'+key],view=modelAPI.describe(lesson,{...modelAPI.defaults(lesson),a,b},f.M);
    equal(view.answer.n*denominator,numerator*view.answer.d,key+' keeps its decimal second operand');
    ok(view.controls.find(c=>c.key==='b').title.includes('в сотых'));
  }
  f.route('#lesson/v5f-decimal-divide-zero');
  equal(modelAPI.describe(f.C.byId['v5f-decimal-divide-zero'],f.snapshot().scene.model,f.M).answer.n,51);
  equal(modelAPI.describe(f.C.byId['v5f-decimal-divide-zero'],f.snapshot().scene.model,f.M).answer.d,50,'zero-in-quotient model starts at 4.08 ÷ 4 = 1.02');
  // The perimeter lesson starts by measuring the rectangle boundary, not distance travelled.
  f.route('#lesson/v5f-formula-perimeter');equal(f.snapshot().scene.model.show,'perimeter');
  ok(f.$('#model .g5-lab-inquiry').textContent.includes('периметр в см'));
  ok(!f.$('#model').textContent.includes('Скорость'));
  const perimeterState=f.snapshot().scene.model,perimeterAnswer=2*(perimeterState.a+perimeterState.b);
  f.input('#model .g5-lab-inquiry input',String(perimeterAnswer));f.$('#model .g5-lab-inquiry').dispatchEvent(new f.w.Event('submit',{bubbles:true,cancelable:true}));
  ok(f.$('#model [role=status]').textContent.includes('Прогноз подтвердился'));
  ok(f.$('#model .g5-lab-equation').textContent.endsWith('= '+perimeterAnswer+' см'));
  f.route('#lesson/v5f-area-grid');ok(f.$('#model [data-v5-right-angle]'),'rectangle right-angle marker');
  // A real investigation writes digits into their exact place and resumes after reload.
  f.route('#lesson/v5f-division-column');
  const arithmetic=f.w.ArithmeticPractice.generate('divide',2,17);
  f.input('[data-v5-prediction]',arithmetic.steps[0].answer);f.$('#model form').dispatchEvent(new f.w.Event('submit',{bubbles:true,cancelable:true}));
  equal(f.snapshot().scene.model.step,1);
  ok(f.$('.arithmetic-division strong').textContent.includes(arithmetic.steps[0].answer));
  f.input('#v5-quality-note','Сначала ищу первое неполное делимое. Проверю умножением.');
  f.input('#answer','мой черновик');
  const beforeReload=f.snapshot(),again=boot('#lesson/v5f-division-column',f.saved());
  equal(again.snapshot(),beforeReload,'draft, note and arithmetic digit restored');
  equal(again.$('#answer').value,'мой черновик');
  equal(again.$('#v5-quality-note').value,beforeReload.scene.note);
  again.close();
  // Empty or malformed numeric input never creates a mathematical first attempt.
  f.submit('');equal(f.snapshot().scene.attempt,0);equal(f.snapshot().scene.firstAttempt,null);
  f.submit('1/0');equal(f.snapshot().scene.attempt,0);equal(f.snapshot().scene.firstWrong,null);
  const current=f.M.generate('v5f-division-column',0).steps[0];
  f.submit(String(Number(current.answer)+1));equal(f.snapshot().scene.attempt,1);ok(f.snapshot().scene.firstWrong);
  f.submit(value(f.M,current));equal(f.snapshot().scene.correct,true);equal(f.snapshot().scene.firstAttempt.correct,false);ok(f.$('.v5q-error-note'));
  f.click('[data-cmd=next]');equal(f.snapshot().scene.step,1);equal(f.snapshot().scene.firstAttempt,null);equal(f.snapshot().scene.firstWrong.step,0);
  f.click('[data-cmd=hint]');equal(f.snapshot().scene.assisted,true);equal(f.snapshot().scene.hintLevels['1'],1);
  const detached=f.$('#answer');const beforeRoute=f.snapshot();f.route('#v5-unit/13');f.route('#lesson/v5f-division-column');equal(f.snapshot(),beforeRoute,'completed step and later help preserved');detached.value='900';detached.dispatchEvent(new f.w.Event('input',{bubbles:true}));equal(f.snapshot(),beforeRoute,'detached input cannot modify the returned scene');
  // A currently unfinished independent condition survives a learning detour and becomes aided.
  f.click('[data-cmd=mode][data-value=check]');const checkStart=f.snapshot();f.input('#answer','123');
  f.click('[data-cmd=mode][data-value=learn]');f.click('[data-cmd=mode][data-value=check]');
  equal(f.snapshot().scene.seed,checkStart.scene.seed);equal(f.$('#answer').value,'123');equal(f.snapshot().scene.assisted,true);
  const checkTask=f.M.generate('v5f-division-column',f.snapshot().scene.seed);f.submit(value(f.M,checkTask));
  equal(f.snapshot().scene.correct,true);const frozen=f.snapshot();f.submit('99999');equal(f.snapshot(),frozen,'completed answer is immutable');
  // A topic-specific rounding model asks for a nearest mark, never decimal addition.
  f.route('#lesson/v5f-round-decimal');ok(f.$('#model').textContent.includes('К какой отметке ближе'));
  const rounding=f.w.Vilenkin5QualityModels.describe(f.C.byId['v5f-round-decimal'],f.w.Vilenkin5QualityModels.defaults(f.C.byId['v5f-round-decimal']),f.M);
  equal(rounding.answer.n/rounding.answer.d,3.5);ok(f.$('#model svg'));
  f.input('[data-v5-prediction]','3,5');f.$('[data-v5-predict]').dispatchEvent(new f.w.Event('submit',{bubbles:true,cancelable:true}));
  equal(f.snapshot().scene.model.first,'3,5');equal(f.snapshot().scene.model.seen,true);
  const n=f.snapshot().scene.model;f.input('[data-v5-prediction]','9');equal(f.snapshot().scene.model.first,n.first,'first prediction remains frozen');
  // All fractions are exact and preserve the unit, including improper fractions and portions.
  f.route('#lesson/v5f-fraction-divide');
  const l=f.C.byId['v5f-fraction-divide'],Models=f.w.Vilenkin5QualityModels;
  for(const [an,ad,bn,bd]of [[1,2,3,4],[3,2,1,4],[0,3,1,2],[12,2,12,12]]){
    const s={...Models.defaults(l),an,ad,bn,bd},v=Models.describe(l,s,f.M);equal(v.answer.n*ad*bn,v.answer.d*an*bd,'exact fractional portions');
  }
  f.route('#lesson/v5f-angle-build');const control=f.$('[data-v5-param=angle]');control.value='90';control.dispatchEvent(new f.w.Event('change',{bubbles:true}));ok(f.$('.v5q-right-angle'),'right-angle square');
  // Details and media are part of a shared/restored scene, with aid retained after closing.
  const notePanel=f.$('.v5q-notes details');notePanel.open=true;await tick();equal(f.snapshot().scene.panels.notes,true);
  f.Q.updateMedia(f.w.JSON.parse(JSON.stringify({id:'u51',frame:2,open:true,playing:false})),true);equal(f.snapshot().scene.assisted,true);
  f.Q.updateMedia(f.w.JSON.parse(JSON.stringify({id:'u51',frame:2,open:false,playing:false})),false);equal(f.snapshot().scene.assisted,true);
  const mediaSnapshot=f.snapshot();f.Q.applyState(f.w.JSON.parse(JSON.stringify(mediaSnapshot)));equal(f.snapshot(),mediaSnapshot);equal(f.$('.v5q-notes details').open,true);
  // Applying a shared practice scene preserves deterministic next-task generation.
  const practiceScene=f.Q.freshScene('v5f-natural-add','practice',317);f.Q.applyState(f.w.JSON.parse(JSON.stringify({version:1,route:'#lesson/v5f-natural-add',scene:practiceScene})));f.submit(value(f.M,f.M.generate(practiceScene.id,317)));f.click('[data-cmd=next]');equal(f.snapshot().scene.seed,318,'next practice seed follows the applied scene');f.Q.applyState(f.w.JSON.parse(JSON.stringify(mediaSnapshot)));
  // Malformed copies and impossible work fail closed.
  for(const mutate of [s=>s.route='#v5-unit/01',s=>s.route+='$',s=>s.scene.seed=-1,s=>s.scene.id='v6f-fraction-add',s=>s.scene.step=2,s=>s.scene.correct=true,s=>s.scene.note='<img src=x>',s=>s.scene.model.angle=181,s=>s.scene.media.playing=true]){
    const bad=mediaSnapshot?plain(mediaSnapshot):null;mutate(bad);assert.throws(()=>f.Q.validateState(f.w.JSON.parse(JSON.stringify(bad))));checks++;
  }
  const independent=f.Q.freshScene('v5f-natural-add','check',42),independentTask=f.M.generate(independent.id,independent.seed);independent.savedInput=value(f.M,independentTask);independent.attempt=1;independent.correct=true;independent.media={id:'u08',frame:4,open:true,playing:false};
  equal(f.Q.validateState(f.w.JSON.parse(JSON.stringify({version:1,route:'#lesson/'+independent.id,scene:independent}))).scene.assisted,false,'post-answer media review does not rewrite independent result');
  const getter={version:1,route:'#course/vilenkin5'};Object.defineProperty(getter,'scene',{enumerable:true,get(){throw Error('getter executed');}});assert.throws(()=>f.Q.validateState(getter),/Invalid/);checks++;
  // Import merges additional scenes, preserving the local answer on collisions.
  const backup=plain(f.Q.exportState()),local=f.snapshot();backup.records[local.scene.id+':'+local.scene.mode].savedInput='different copy';
  const imported=f.Q.importState(f.w.JSON.parse(JSON.stringify(backup)));ok(imported.kept>0);equal(f.snapshot(),local);
  // An unobserved external write cannot be overwritten even before a storage event arrives.
  const external=f.w.localStorage.getItem(KEY)+' ';f.w.localStorage.setItem(KEY,external);f.input('#answer','77');equal(f.w.localStorage.getItem(KEY),external);equal(f.Q.exportState().records['v5f-angle-build:learn'].savedInput,'77');
  equal(f.errors,[]);
  const legacyState=f.w.WorkshopState.blank(),legacyId='v5f-division-column',mark=f.w.WorkshopState.fingerprint(legacyId,f.M.generate(legacyId,0));
  f.w.WorkshopState.expose(legacyState,mark);legacyState.last={skill:legacyId,mode:'learn',seed:0};
  legacyState.vilenkinDrafts={vilenkin5:{skill:legacyId,mode:'learn',seed:0,step:1,attempt:0,checkIndex:0,correct:false,assisted:false,exposed:false,fingerprint:mark,savedInput:'старый черновик',message:'',remedy:''}};
  const legacyRaw=JSON.stringify(legacyState);f.close();
  const legacy=boot('#lesson/'+legacyId,{'mathexam.workshop.v1':legacyRaw});
  ok(legacy.$('[data-v5-legacy]'));equal(legacy.$('#answer').value,'старый черновик');equal(legacy.w.localStorage.getItem('mathexam.workshop.v1'),legacyRaw,'opening historical work preserves original raw');
  equal(legacy.w.localStorage.getItem(KEY),null,'missing accepted answers never become a new semantic scene');
  legacy.submit('0');ok(legacy.$('#answer').disabled,'historical step can still be finished');
  const migrated=JSON.parse(legacy.w.localStorage.getItem('mathexam.workshop.v1')).vilenkinDrafts[legacyId];equal(migrated.answers[0],'','no invented previous answer');equal(migrated.answers[1],'0');
  legacy.click('[data-cmd=mode][data-value=practice]');equal(legacy.snapshot().scene.mode,'practice');ok(!legacy.$('[data-v5-legacy]'));equal(legacy.errors,[]);legacy.close();
  const diagnostic=boot();diagnostic.click('[data-cmd=course-diagnostic]');await tick();ok(diagnostic.$('#answer'));equal(diagnostic.$('#main').dataset.v5Quality,'diagnostic');diagnostic.submit('');diagnostic.click('[data-cmd=skip]');await tick();ok(diagnostic.$('#answer'));equal(diagnostic.errors,[]);diagnostic.close();
  const navigation=boot('#lesson/v5f-natural-add');navigation.route('#lesson/v6f-fraction-add');ok(!navigation.w.document.body.classList.contains('v5-quality-active'),'V5 styles never remain on V6');ok(!navigation.$('#main').hasAttribute('data-v5-quality'));equal(navigation.errors,[]);navigation.close();
  const otherFrame=boot('#course/vilenkin6',{},false,true);ok(!otherFrame.$('a[href="#v6-unit/1"]').hidden,'other board courses retain their own navigation');ok(!otherFrame.w.document.body.classList.contains('v5-quality-active'));equal(otherFrame.errors,[]);otherFrame.close();
  const foreign=boot('#lesson/v6f-fraction-add',{[KEY]:'{damaged'});equal(foreign.$('#notice').textContent,'','damaged V5 enhancement never warns on another course');ok(!foreign.$('.v5q-notes'));foreign.close();
  const literal=boot('#lesson/v5f-fraction-add');literal.input('#v5-quality-note','a < b; <b>моя запись</b>');equal(literal.snapshot().scene.note,'a < b; ‹b›моя запись‹/b›');literal.input('#answer','<b>12</b>');equal(literal.snapshot().scene.savedInput,'‹b›12‹/b›');equal(literal.$('#main').querySelectorAll('b[data-injected]').length,0);equal(literal.errors,[]);literal.close();
  // A damaged original remains available; current work is exportable in memory.
  const corrupt=boot('#lesson/v5f-decimal-add',{[KEY]:'{damaged'});corrupt.input('#answer','0,8');equal(corrupt.w.localStorage.getItem(KEY),'{damaged');equal(corrupt.Q.exportState().records['v5f-decimal-add:learn'].savedInput,'0,8');equal(corrupt.errors,[]);corrupt.close();
  // Direct wrapper mode, not just an iframe, never reads or writes personal work.
  const sentinel='{"personal":"keep"}',board=boot('#lesson/v5f-fraction-add',{[KEY]:sentinel,'mathexam.workshop.v1':sentinel},true);
  board.input('#answer','12');equal(board.w.localStorage.getItem(KEY),sentinel);equal(board.w.localStorage.getItem('mathexam.workshop.v1'),sentinel);
  let changes=0;const unsubscribe=board.Q.subscribe(()=>changes++);board.input('#answer','13');ok(changes>0);unsubscribe();
  board.Q.setReadOnly(true);ok(board.$('#answer').disabled);const shared=board.snapshot();board.submit('99');equal(board.snapshot(),shared);board.Q.setReadOnly(false);ok(!board.$('#answer').disabled);
  board.route('#teacher');equal(board.w.location.hash,'#course/vilenkin5');equal(board.snapshot().scene,null);equal(board.errors,[]);board.close();
  console.log(JSON.stringify({gate:'VILENKIN5_QUALITY_PASS',checks,lessons:134,points:51,modelKinds:[...modelKinds].sort()}));
}
run().catch(error=>{console.error(error);process.exitCode=1;});

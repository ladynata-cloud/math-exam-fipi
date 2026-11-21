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
  const qualityAccess={reads:0,writes:0},getItem=w.Storage.prototype.getItem,setItem=w.Storage.prototype.setItem;
  w.Storage.prototype.getItem=function(key){if(key===KEY)qualityAccess.reads++;return getItem.call(this,key);};
  w.Storage.prototype.setItem=function(key,value){if(key===KEY)qualityAccess.writes++;return setItem.call(this,key,value);};
  const errors=[];w.addEventListener('error',e=>errors.push(e.error||e.message));
  for(const tag of w.document.querySelectorAll('script[src]')){
    const file=new URL(tag.src).pathname;if(file.startsWith('/assets/'))continue;
    // Board transport is tested in its dedicated test; this exercises the actual school runtime.
    if(file.includes('vilenkin5-board'))continue;
    w.eval(fs.readFileSync(path.join(root,file),'utf8'));
  }
  const f={w,dom,errors,qualityAccess,Q:w.Vilenkin5Quality,C:w.WorkshopCurriculum,M:w.WorkshopMath,
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
async function importProgress(f,data,accept=true){
  f.route('#progress');f.click('[data-cmd=import-progress]');
  const raw=JSON.stringify(data),file=new f.w.File([raw],'workshop.json',{type:'application/json'});
  // JSDOM's File lacks text(); exercise the real file-input handler with that browser API supplied.
  file.text=async()=>raw;
  Object.defineProperty(f.$('#file-input'),'files',{configurable:true,value:[file]});
  let confirmations=0;f.w.confirm=()=>{confirmations++;return accept;};
  f.$('#file-input').dispatchEvent(new f.w.Event('change',{bubbles:true}));
  await tick();await tick();return confirmations;
}
async function personalContextRegression(){
  const id='v5f-division-column',f=boot('#lesson/'+id),S=f.w.WorkshopState,read=()=>JSON.parse(f.w.localStorage.getItem(S.KEY));
  f.submit(value(f.M,f.M.generate(id,0).steps[0]));f.click('[data-cmd=next]');
  f.input('#answer','личный черновик');f.input('#v5-quality-note','Личный способ проверки');
  f.click('[data-cmd=mode][data-value=practice]');f.input('#answer','личная тренировка');
  f.click('[data-cmd=mode][data-value=learn]');
  const personal=f.snapshot(),qualityRaw=f.w.localStorage.getItem(KEY),personalDraft=read().vilenkinDrafts[id],beforeEvents=read().events.length;
  const assignment={schema:'mathexam-assignment',version:1,id:'a-isolation',title:'Работа в классе',skills:[id],seed:17};
  f.route('#home');f.input('#assignment-code',Buffer.from(JSON.stringify(assignment)).toString('base64'));f.click('[data-cmd=load-code]');
  f.click('[data-cmd=learn][data-value="'+id+'"]');await tick();
  equal(f.$('#answer').value,'');equal(f.snapshot().scene.note,'');equal(f.snapshot().scene.step,0);
  equal(f.Q.restore(id),null);equal(f.Q.restore(id,'practice'),null);equal(f.Q.restore('vilenkin5'),null);
  f.input('#answer','ответ в задании');f.input('#v5-quality-note','Обсуждение в классе');f.click('[data-cmd=hint]');f.click('[data-cmd=claim]');
  f.input('[data-v5-prediction]','прогноз в классе');
  f.Q.updateMedia(f.w.JSON.parse(JSON.stringify({id:'u'+String(f.C.byId[id].point).padStart(2,'0'),frame:2,open:true,playing:false})),true);
  equal(f.w.localStorage.getItem(KEY),qualityRaw,'all assignment writers preserve personal scenes byte for byte');
  equal(read().vilenkinDrafts[id],personalDraft,'assignment preserves canonical personal draft');
  f.click('[data-cmd=mode][data-value=practice]');equal(f.$('#answer').value,'','mode switch cannot restore personal practice');
  f.click('[data-cmd=mode][data-value=check]');
  for(let i=0;i<3;i++){const scene=f.snapshot().scene;f.submit(value(f.M,f.M.generate(id,scene.seed)));f.click('[data-cmd=next]');}
  await tick();equal(f.w.localStorage.getItem(KEY),qualityRaw,'finish does not checkpoint assignment into personal records');
  equal(read().vilenkinDrafts[id],personalDraft);equal(read().events.length,beforeEvents+3,'assignment still records its three results');
  const assignedSaved=f.saved();
  const initial=boot('#lesson/'+id,assignedSaved);equal(initial.qualityAccess.reads,0,'initial assignment never loads personal quality storage');equal(initial.qualityAccess.writes,0);equal(initial.$('#answer').value,'');equal(initial.Q.restore(id),null);equal(initial.qualityAccess.reads,0);equal(initial.errors,[]);initial.close();
  f.route('#home');f.click('[data-cmd=leave-assignment]');f.route('#lesson/'+id);
  equal(f.$('#answer').value,personal.scene.savedInput);equal(f.snapshot().scene.note,personal.scene.note);equal(f.snapshot().scene.step,personal.scene.step);
  equal(read().vilenkinDrafts[id].vilenkinRun,personalDraft.vilenkinRun,'restoration retains the canonical personal run');
  equal(f.errors,[]);f.close();

  // A temporary prerequisite and its mode switch must not inherit another personal session.
  const p=boot(),parent=p.C.lessons.find(l=>l.v6Course&&l.requires.some(key=>p.C.byId[key]?.v5Course)),prerequisite=parent.requires.find(key=>p.C.byId[key]?.v5Course);
  p.route('#lesson/'+prerequisite);p.click('[data-cmd=mode][data-value=practice]');p.input('#answer','моя отдельная тренировка');
  const privateRaw=p.w.localStorage.getItem(KEY);
  p.route('#lesson/'+parent.id);p.click('[data-cmd=prerequisite][data-value="'+prerequisite+'"]');await tick();
  p.click('[data-cmd=mode][data-value=practice]');equal(p.$('#answer').value,'');p.input('#answer','временное повторение');equal(p.w.localStorage.getItem(KEY),privateRaw);
  ok(p.$('[data-cmd=return]'),'temporary learning retains its return path');p.click('[data-cmd=return]');await tick();equal(p.w.location.hash,'#lesson/'+parent.id);equal(p.errors,[]);p.close();
}
async function replacementImportRegression(){
  const id='v5f-division-column',f=boot('#lesson/'+id),S=f.w.WorkshopState,read=()=>JSON.parse(f.w.localStorage.getItem(S.KEY));
  f.submit(value(f.M,f.M.generate(id,0).steps[0]));f.click('[data-cmd=next]');f.input('#answer','черновик из копии');f.input('#v5-quality-note','Заметка из копии');
  const original={...read(),vilenkin5Quality:plain(f.Q.exportState())},stale=plain(original);stale.vilenkinDrafts[id].signature='previous generator';
  f.route('#lesson/v5f-angle-build');f.input('#v5-quality-note','Этой записи нет в импортируемом файле');
  equal(await importProgress(f,stale),1);equal(plain(f.Q.exportState()),stale.vilenkin5Quality,'confirmed import replaces quality records and last');
  f.route('#lesson/'+id);await tick();equal(f.$('#answer').value,'');equal(f.snapshot().scene.step,0);equal(f.$('#main').querySelectorAll('.v6-history').length,0);ok(f.$('#previous-vilenkin-draft a[href="#progress"]'));
  equal(read().vilenkinDrafts[id],stale.vilenkinDrafts[id],'opening an incompatible copy preserves its complete draft');
  f.route('#progress');f.route('#lesson/'+id);await tick();equal(f.$('#answer').value,'');equal(read().vilenkinDrafts[id],stale.vilenkinDrafts[id]);
  const retained=boot('#lesson/'+id,f.saved());equal(retained.$('#answer').value,'');ok(retained.$('#previous-vilenkin-draft'));equal(JSON.parse(retained.w.localStorage.getItem(S.KEY)).vilenkinDrafts[id],stale.vilenkinDrafts[id]);equal(retained.errors,[]);retained.close();
  f.input('#answer','решаю обновлённое задание');const replacement=boot('#lesson/'+id,f.saved());equal(replacement.$('#answer').value,'решаю обновлённое задание');ok(JSON.parse(replacement.w.localStorage.getItem(S.KEY)).vilenkinDrafts[id].signature!=='previous generator');equal(replacement.errors,[]);replacement.close();
  const legacyOnly=plain(stale);delete legacyOnly.vilenkin5Quality;equal(await importProgress(f,legacyOnly),1);equal(plain(f.Q.exportState()),{version:1,records:{},last:''},'legacy-only import clears stale quality scenes');
  f.route('#lesson/'+id);equal(f.$('#answer').value,'');ok(f.$('#previous-vilenkin-draft'));equal(read().vilenkinDrafts[id],stale.vilenkinDrafts[id]);
  const invalidQuality=plain(original);invalidQuality.vilenkin5Quality.records[id+':learn'].note='<img src=x>';
  const invalidWorkshop=plain(original);invalidWorkshop.route='broken';
  for(const invalid of [invalidQuality,invalidWorkshop]){const before=f.saved();equal(await importProgress(f,invalid),0,'invalid copies are rejected before confirmation');equal(f.saved(),before,'invalid copy changes neither storage key');ok(f.$('#notice').textContent.startsWith('Файл не загружен:'));}
  const beforeCancel=f.saved();equal(await importProgress(f,original,false),1);equal(f.saved(),beforeCancel,'cancelled replacement leaves both stores intact');equal(f.errors,[]);f.close();
  const corrupt=boot('#lesson/'+id,{[KEY]:'{damaged'});equal(await importProgress(corrupt,original),1);equal(corrupt.w.localStorage.getItem(KEY),'{damaged','an explicit import does not silently replace a damaged original');equal(plain(corrupt.Q.exportState()),original.vilenkin5Quality,'validated imported records remain exportable in memory');equal(corrupt.errors,[]);corrupt.close();
}
function decimalStepInstructions(){
  const id='v5f-decimal-portion', f=boot('#lesson/'+id);
  const task=f.M.generate(id,f.snapshot().scene.seed), divisor=task.data.y;
  const first=f.$('label[for=answer]').textContent;
  ok(first.includes('из 1, 10, 100, 1000 наименьший'));
  equal(f.$('#task-panel h2 + p').textContent,first);
  // A denominator of 4, 5, or 8 is a legitimate multiplier outside the requested set.
  f.submit(String(divisor.d));
  ok(f.$('.feedback').textContent.includes('тоже целый'));
  equal(f.snapshot().scene.attempt,0);
  equal(f.snapshot().scene.firstWrong,null);
  f.submit(String(task.steps[0].answer*10));
  if(task.steps[0].answer<1000){
    ok(f.$('.feedback').textContent.includes('меньший множитель'));
    equal(f.snapshot().scene.attempt,1);
  }
  f.submit(value(f.M,task.steps[0]));f.click('[data-cmd=next]');
  ok(f.$('.v6-history').textContent.includes(first));
  f.submit(value(f.M,task.steps[1]));f.click('[data-cmd=next]');
  f.submit(f.M.fmt(task.data.x));
  ok(f.$('.feedback').textContent.includes('прежнее делимое'));
  const restored=boot('#lesson/'+id,f.saved());
  equal(restored.snapshot().scene.step,2);
  equal(restored.$('#answer').value,f.M.fmt(task.data.x));
  ok(restored.$('.feedback').textContent.includes('прежнее делимое'));
  restored.submit(value(restored.M,task.steps[2]));
  equal(restored.$('.v5q-outcome').textContent,'Решено после исправления');
  equal(f.errors,[]);equal(restored.errors,[]);restored.close();f.close();

  const product=boot('#lesson/v5f-decimal-small-product');
  const generated=product.M.generate('v5f-decimal-small-product',product.snapshot().scene.seed);
  ok(product.$('label[for=answer]').textContent.includes('в сотых'));
  product.submit(value(product.M,generated.steps[0]));product.click('[data-cmd=next]');
  const second=product.$('label[for=answer]').textContent;
  ok(second.includes('со знаменателем 100')&&second.includes('со знаменателем 10.'));
  product.submit(value(product.M,generated.steps[1]));product.click('[data-cmd=next]');
  ok(product.$('label[for=answer]').textContent.includes('до сокращения'));
  equal(product.errors,[]);product.close();
}
function sameDataFractionalForecastRegression(){
  const id='v5f-printed-5-18',f=boot('#lesson/'+id);
  const choose=(key,value)=>{const el=f.$('[data-v5-param="'+key+'"]');el.value=String(value);el.dispatchEvent(new f.w.Event('change',{bubbles:true}));};
  choose('unitChoice',0);choose('portion',1);
  const send=value=>{f.input('[data-v5-prediction]',value);f.$('[data-v5-predict]').dispatchEvent(new f.w.Event('submit',{bubbles:true,cancelable:true}));};
  send('10');let m=f.snapshot().scene.model;equal(m.first,'10');ok(!m.seen);ok(m.notice.includes('исправь')||m.notice.includes('Исправь'));ok(!f.$('.v5q-model-why'));
  send('5/2');m=f.snapshot().scene.model;ok(m.seen);equal(m.first,'10');ok(m.notice.includes('исправлен самостоятельно'));
  const restored=boot('#lesson/'+id,f.saved());equal(restored.snapshot().scene.model.first,'10');ok(restored.snapshot().scene.model.seen);restored.close();
  choose('portion',2);m=f.snapshot().scene.model;ok(!m.seen);equal(m.first,'');f.input('[data-v5-prediction]','2');f.click('[data-v5-reveal]');m=f.snapshot().scene.model;ok(m.seen);ok(m.notice.includes('по твоему запросу'));equal(m.first,'');equal(m.prediction,'2');
  f.close();
}
function equalPartsRegression(){
  const f=boot(),v=f.w.Vilenkin5EqualParts,ids=[40,41,42].map(n=>'v5f-printed-5-'+n);
  const answers=t=>plain([...t.steps,t].map(x=>x.answer));equal(answers(f.M.generate(ids[0],0)),[1,3,{n:3,d:7},4,{n:4,d:7}]);equal(answers(f.M.generate(ids[1],0)),[1,3,{n:3,d:8}]);equal(answers(f.M.generate(ids[2],0)),[324,3,54]);
  const states={blue:-1,green:-1,ask:0,shift:0};
  for(let seed=0;seed<80;seed++){
    for(const id of ids.slice(0,2)){
      const t=f.M.generate(id,seed),d=t.data.equalStrip;ok(d.blue>0&&d.blue+d.green<d.n);equal(t.answer.n*d.n,(d.n-d.blue-d.green)*t.answer.d);ok(f.M.accepts(2*(d.n-d.blue-d.green)+'/'+(d.n*2),t));
      for(const blue of [-1,0,d.n])for(const green of [-1,1,d.n])for(const ask of [0,1]){
        const b=blue<0?d.blue:blue,g=Math.min(d.n-b,d.two?(green<0?d.green:green):0),k=ask?d.n-b-g:b+g;
        equal(plain(v.explore(t,{...states,blue,green,ask}).answer),plain(f.M.q(k,d.n)));
      }
    }
    const t=f.M.generate(ids[2],seed),n=t.data.sixthSquare.side;for(let pattern=0;pattern<4;pattern++)for(let selected=0;selected<6;selected++)equal(v.explore(t,{pattern,selected}).answer*6,n*n);
  }
  f.close();const g=boot('#lesson/'+ids[1]);g.submit('1');g.click('[data-cmd=next]');g.submit('3');g.click('[data-cmd=next]');g.submit('5/8');ok(g.snapshot().scene.message.includes('долю с цветом'));g.submit('6/16');ok(g.snapshot().scene.correct&&!g.snapshot().scene.assisted);g.close();
}

function circleChapterCheckRegression(){
  const f=boot(),v=f.w.Vilenkin5CircleCheck,ids=[1,2,3].map(n=>'v5f-printed-check-25-'+n),answer=t=>plain([...t.steps,t].map(x=>x.answer));
  ids.forEach(id=>ok(f.$('a[href="#lesson/'+id+'"]')));equal(answer(f.M.generate(ids[0],0)),[26,41,98,570,[26,41,98,570]]);equal(answer(f.M.generate(ids[1],0)),[4,[1,3],[3,1],[1,1,0]]);equal(answer(f.M.generate(ids[2],0)),[30,[32,28],[60,4],2]);
  const crossings=(a,b,d)=>a+b<d||Math.abs(a-b)>d?0:a+b===d||Math.abs(a-b)===d?1:2,outcomes=new Set();
  for(let seed=0;seed<100;seed++){
    const [t,u,z]=ids.map(id=>f.M.generate(id,seed)),a=t.data.checkDiameter;equal(plain(t.answer),[a[0]*2,a[1]/2,a[2]/2,a[3]*2]);
    const pair=z.data.checkCirclePair;equal(z.answer,crossings(pair.a,pair.b,pair.dist));outcomes.add(z.answer);
    for(const [i,d] of [pair.dist,pair.a+pair.b,pair.a+pair.b+5,Math.abs(pair.a-pair.b)||1].entries())equal(v.explore(z,{trial:i}).answer,crossings(pair.a,pair.b,d));
    const init={opening:0,a:1,b:3,c:7,r:8,t:0};
    const own=v.selection(u,init);ok(Number.isSafeInteger(own));const q=f.M.generate(ids[1],own);ok(q.data.checkPositions.own);equal(q.data.checkPositions.radius,u.data.checkPositions.radius);equal(plain(q.steps[1].answer),[3,1]);equal(v.selection(u,{...init,b:1}),null);equal(v.selection(u,{...init,r:10}),null);equal(v.selection(u,{...init,t:8}),null);
  }
  equal([...outcomes].sort(),[0,1,2]);f.close();
  const child=boot('#lesson/'+ids[1]);for(const [k,value] of [['phase',1],['r',8],['t',0]]){const field=child.$('[data-v5-param='+k+']');field.value=String(value);field.dispatchEvent(new child.w.Event('change',{bubbles:true}));}
  child.click('[data-v5-apply-drawing]');ok(child.snapshot().scene.seed>=650000);equal(plain(child.M.generate(ids[1],child.snapshot().scene.seed).steps[1].answer),[3,1]);child.close();
  const g=boot('#lesson/'+ids[2]);g.submit('3');ok(!g.snapshot().scene.assisted);g.submit('30');ok(g.snapshot().scene.correct);g.close();
}

function massDividendPowerRegression(){
  const f=boot(),ids=[37,38,39].map(n=>'v5f-printed-5-'+n),v=f.w.Vilenkin5MassDividendPowers;
  const answers=t=>plain([...t.steps,t].map(x=>x.answer));
  equal(answers(f.M.generate(ids[0],0)),[63750,63,[63,750]]);
  equal(answers(f.M.generate(ids[1],0)),[41478,41480]);
  equal(answers(f.M.generate(ids[2],0)),[423300,605,62920,486220,3040728,5673,3244,2744,343,3087,7,441,729,216,513,263169]);
  for(let seed=0;seed<100;seed++){
    const [t,u,z]=ids.map(id=>f.M.generate(id,seed)),m=t.data.tankMass,{b,q,rem}=u.data.dividend;
    equal(t.answer[0]*1000+t.answer[1],m.litres*m.gramsPerLitre);ok(t.answer[1]>=0&&t.answer[1]<1000);
    equal(Math.floor(u.answer/b),q);equal(u.answer%b,rem);for(let extra=0;extra<=2;extra++)equal(v.explore(u,{extra}).answer,u.answer+extra*b);
    for(const litres of [1,10,100])equal(v.explore(t,{litres}).answer,litres*m.gramsPerLitre);
    const [a,c,d,e]=z.data.orderWithPowers,totals=[a[0]*a[1]+a[2]/a[3]*a[4],(c[0]+c[1])/c[2]-c[3],(d[0]**3+d[1]**3)/(d[0]-d[1]),(e[0]**3-e[1]**3)**2];
    for(let row=0;row<4;row++){ok(Number.isSafeInteger(totals[row]));equal(v.explore(z,{row,focus:1}).answer,totals[row]);}
  }
  f.close();const g=boot('#lesson/'+ids[1]);g.submit('41478');g.click('[data-cmd=next]');g.submit('41478');ok(g.snapshot().scene.message.includes('Добавь остаток'));g.submit('41480');ok(g.snapshot().scene.correct&&!g.snapshot().scene.assisted);g.close();
}

function boxDivisorsAndLayersRegression(){
  const f=boot(),a='v5f-printed-5-35',b='v5f-printed-5-36',module=f.w.Vilenkin5GroupsAndLayers;
  const answers=t=>plain([...t.steps,t].map(x=>x.answer));
  equal(answers(f.M.generate(a,0)),[23,24,[15,6],[23,15,24,6]]);
  equal(answers(f.M.generate(b,0)),[4,24,10,100,100,1000,70,700]);
  for(let seed=0;seed<100;seed++){
    const t=f.M.generate(a,seed),{n,q,first,last}=t.data.fixedQuotient,u=f.M.generate(b,seed);
    const valid=Array.from({length:n},(_,i)=>i+1).filter(d=>Math.floor(n/d)===q);
    equal(valid[0],first);equal(valid.at(-1),last);equal(plain(t.answer),valid.flatMap(d=>[d,n%d]));
    ok(f.M.accepts(t.answer.join(';'),t));ok(!f.M.accepts(t.answer.slice().reverse().join(';'),t));
    for(let offset=0;offset<7;offset++)for(let measure=0;measure<2;measure++){
      const d=first+offset-2;equal(module.explore(t,{offset,measure}).answer,measure?n%d:Math.floor(n/d));
    }
    for(const [solid,shape] of u.data.layerSolids.entries()){
      const [w,h,d]=shape;
      for(let measure=0;measure<2;measure++)for(let layer=0;layer<3;layer++)equal(module.explore(u,{solid,measure,layer}).answer,measure?w*h*d:w*d);
    }
  }
  f.close();const g=boot('#lesson/'+a);g.submit('22');ok(g.snapshot().scene.message.includes('№10'));ok(!g.snapshot().scene.assisted);g.submit('23');ok(g.snapshot().scene.correct&&!g.snapshot().scene.assisted);g.click('[data-cmd=next]');g.click('[data-cmd=hint]');g.submit('24');ok(g.snapshot().scene.correct&&g.snapshot().scene.assisted);g.close();
}

function radiusEquationsRegression(){
  const f=boot(),e='v5f-printed-5-34',a='v5f-printed-5-33',v=f.w.Vilenkin5RadiusEquations;
  const answers=t=>plain([...t.steps,t].map(x=>x.answer));equal(answers(f.M.generate(e,0)),[202,313,13,628,30855,46,33,926]);equal(answers(f.M.generate(a,0)),[24,72,28,14]);
  for(let seed=0;seed<100;seed++){
    const t=f.M.generate(e,seed),x=answers(t),q=f.M.generate(a,seed),d=q.data.radiusEstimate;
    equal(answers(q),[2*d.radius,6*d.radius,d.edge/3,d.edge/6]);ok(Number.isInteger(d.edge/6));
    for(let row=0;row<4;row++){
      const [n,m,w]=t.data.nestedEquations[row],root=x[2*row+1],left=[(root-n)*m,n*(root-m),(n-root)/m,n/(root-m)][row];equal(left,w);
      for(let phase=0;phase<2;phase++)equal(v.explore(t,{row,phase}).answer,x[2*row+phase]);
    }
    for(const radius of [2,7,25])for(const direction of [0,1])equal(v.explore(q,{radius,direction}).answer,direction?radius:6*radius);
  }f.close();
  const g=boot('#lesson/'+a);g.submit('24');g.click('[data-cmd=next]');g.submit('75,36');equal(g.snapshot().scene.attempt,0);ok(g.snapshot().scene.message.includes('3,14'));g.submit('36');ok(g.snapshot().scene.message.includes('три радиуса'));g.submit('72');ok(g.snapshot().scene.correct&&!g.snapshot().scene.assisted);g.close();
}

function circlePairHomeworkRegression(){
  const f=boot(),a=f.w.Vilenkin5CircleCrossings;
  for(const [id,firstAnswers] of [['v5f-printed-5-31',[11,3,2]],['v5f-printed-5-32',[7,2,0]]]){
    const source=f.M.generate(id,0);equal(plain([...source.steps,source].map(t=>t.answer)),firstAnswers);
    const outcomes=new Set();
    for(let seed=0;seed<100;seed++){
      const t=f.M.generate(id,seed),g=t.data.circleCrossings;
      const n=(d)=>d>g.a+g.b||d<Math.abs(g.a-g.b)?0:d===g.a+g.b||d===Math.abs(g.a-g.b)?1:2;
      equal(t.answer,n(g.d));outcomes.add(t.answer);equal(t.steps[0].answer,g.a+g.b);
      equal(t.steps[1].answer,id.endsWith('31')?Math.abs(g.a-g.b):g.d-g.a-g.b);
      for(let distance=0;distance<5;distance++){
        const d=a.distances(g)[distance].d,points=a.geometry(g,d),v=a.explore(t,{stage:3,distance,leg:1});
        equal(v.answer,n(d));equal(points.length,n(d));for(const [x,y] of points){ok(Math.abs(Math.hypot(x,y)-g.a)<1e-8);ok(Math.abs(Math.hypot(x-d,y)-g.b)<1e-8);}
        if(points.length)ok(v.visual.includes('>X</text>'));if(points.length===2)ok(v.visual.includes('>Y</text>'));
      }
    }
    equal([...outcomes].sort(),id.endsWith('31')?[0,1,2]:[0]);
  }f.close();
  const g=boot('#lesson/v5f-printed-5-32');g.submit('7');g.click('[data-cmd=next]');g.submit('2');g.click('[data-cmd=next]');g.submit('2');ok(g.snapshot().scene.message.includes('не дотянулись'));g.submit('0');ok(g.snapshot().scene.correct&&!g.snapshot().scene.assisted);g.close();
}

function threeCompassRegression(){
  const f=boot(),id='v5f-printed-5-30',a=f.w.Vilenkin5ThreeCompassPoints;
  for(let seed=0;seed<55;seed++){
    const t=f.M.generate(id,seed),d=t.data.threeCompass;
    equal(plain([...t.steps,t].map(x=>x.answer)),[d.radius,d.radius,3,4]);ok(d.places.every(x=>x>=1&&x<12));equal(new Set(d.places).size,3);
    for(const [m,n,k,opening,expected] of [[0,0,0,0,0],[1,1,1,0,1],[3,3,8,0,2],[0,7,11,0,2],[1,4,10,0,3],[1,4,10,d.radius===1?2:1,0]]){
      const s={m,n,k,opening},view=a.explore(t,s);equal(view.answer,expected);equal(view.visual.includes('data-v5-apply-drawing'),expected===3);
      const own=a.selection(t,s);
      if(expected===3){const copy=f.M.generate(id,own).data.threeCompass;equal(plain(copy.places),[m,n,k]);equal(copy.radius,d.radius);ok(copy.own);}
      else equal(own,null);
    }
  }
  f.close();
  const g=boot('#lesson/'+id);g.submit('8');ok(g.snapshot().scene.message.includes('диаметр'));g.submit('4');ok(g.snapshot().scene.correct&&!g.snapshot().scene.assisted);g.close();
}

function diskMembershipRegression(){
  const f=boot(),id='v5f-printed-5-29',a=f.w.Vilenkin5DiskMembership,orig=f.M.generate(id,0),v=t=>[...t.steps,t].map(i=>i.answer);
  equal(plain(v(orig)),[3,'MN','KR','KOPQR','MNOPQ']);
  equal(a.read('О, M; Q П'),null);equal(a.read('Q Р М N О'),'MNOPQ');equal(a.read('K; R'),'KR');
  const labels=['O','M','N','P','Q','R','K'],cases=new Set();
  for(let seed=0;seed<100;seed++){
    const t=f.M.generate(id,seed),d=t.data.diskMembership;cases.add(t.conditionKey);
    const ratios=[0,1,1,d.onEdge?1:.56,.5,1.4,1.41];
    const sort=fn=>labels.filter((_,i)=>fn(ratios[i])).sort().join('');
    equal(plain(v(t)),[d.radius,sort(x=>x===1),sort(x=>x>1),sort(x=>x!==1),sort(x=>x<=1)]);
    for(const boundary of [0,1])for(const region of [0,1,2,3,4]){
      const answer=[[2,5,3,2,5],[3,5,2,2,4]][boundary][region];equal(a.explore(t,{region,boundary}).answer,answer);
    }
  }
  ok(cases.size>30);f.close();
  const g=boot('#lesson/'+id);g.submit('6');ok(g.snapshot().scene.message.includes('диаметр'));g.submit('3');g.click('[data-cmd=next]');g.submit('Z');equal(g.snapshot().scene.attempt,0);
  g.submit('O Q P N M');ok(g.snapshot().scene.message.includes('только его край'));g.submit('NM');ok(g.snapshot().scene.correct&&!g.snapshot().scene.assisted);g.close();
}

function sundialRegression(){
  const f=boot(),id='v5f-printed-5-28',v=f.w.Vilenkin5Sundial;
  const cases=new Set();for(let seed=0;seed<50;seed++){
    const t=f.M.generate(id,seed),d=t.data.sundial;cases.add(t.conditionKey);equal(plain([...t.steps,t].map(x=>x.answer)),[d.hour,1,1,2]);
    for(let weather=0;weather<3;weather++)for(let reading=9;reading<=15;reading++){
      const m=v.explore(t,{reading,weather});equal(m.answer,weather?0:reading);equal(m.visual.includes('stroke="#373451"'),weather===0);ok(m.visual.includes('aria-label'));
    }
    equal(v.taskDrawing(t,{step:2,mode:'learn'}).includes('stroke="#373451"'),false);
    equal(v.taskDrawing(t,{step:3,mode:'learn'}).includes('stroke="#373451"'),true);
  }
  equal(cases.size,12);f.close();
  const g=boot('#lesson/'+id);g.submit('12');ok(g.snapshot().scene.message.includes('Полдень'));g.submit('10');ok(g.snapshot().scene.correct&&!g.snapshot().scene.assisted);
  const label=g.w.document.querySelector('label[for="v5-quality-note"]')||g.w.document.querySelector('#v5-quality-note').closest('label');ok(label.textContent.includes('преимущество'));g.close();
}

function reverseOrderRegression(){
  const f=boot(),event='v5f-printed-5-26',order='v5f-printed-5-27';
  const e=f.M.generate(event,0),o=f.M.generate(order,0),vals=t=>plain([...t.steps,t].map(a=>a.answer));
  equal(vals(e),[35,22,31,47]);equal(vals(o),[802,405812,935,11,576,340,708,380904]);
  const samples=[new Set(),new Set()];
  for(let seed=0;seed<100;seed++){
    const t=f.M.generate(event,seed),v=f.M.generate(order,seed);samples[0].add(t.conditionKey);samples[1].add(v.conditionKey);
    const [d,b]=t.data.reverseStories;equal(vals(t),[d[0]+d[1],d[0],b[0]+b[1],b[0]]);
    for(const [story,[a,x,y]] of t.data.reverseStories.entries())for(const back of [0,1])for(const focus of [0,1,2]){
      equal(f.w.Vilenkin5ReverseCount.explore(t,{story,back,focus}).answer,[a,a+x,a+x+y][back?2-focus:focus]);
    }
    const rows=v.data.orderRows,answers=vals(v);
    for(const [i,[a,b,c]] of rows.entries()){
      const first=[a/b,a/b,b*c,b/c][i],last=[a*c/b,a/(b*c),a/(b*c),a*b/c][i];
      equal(answers[2*i],first);equal(answers[2*i+1],last);ok(Number.isInteger(last));
      for(const operation of [0,1])equal(f.w.Vilenkin5ReverseCount.explore(v,{row:i,operation}).answer,answers[2*i+operation]);
    }
  }
  ok(samples[0].size>15);ok(samples[1].size>15);f.close();
  const g=boot('#lesson/'+event);g.submit('3');ok(g.snapshot().scene.message.includes('верни улетевших'));g.submit('35');ok(g.snapshot().scene.correct&&!g.snapshot().scene.assisted);g.close();
}

function boardHoneyRegression(){
  const board='v5f-printed-5-24',honey='v5f-printed-5-25',f=boot(),original=f.M.generate(board,0),jar=f.M.generate(honey,0);
  equal(plain([...original.steps,original].map(x=>Number(x.answer))),[20,8,28,4.8,6.25,4.8,1008]);
  equal(plain([...jar.steps,jar].map(x=>x.answer)),[5,300,1200]);
  const sets=[new Set(),new Set()];
  for(let seed=0;seed<100;seed++){
    const b=f.M.generate(board,seed),h=f.M.generate(honey,seed),{width,height,size}=b.data.boardGrid;
    sets[0].add(b.conditionKey);sets[1].add(h.conditionKey);
    ok(Math.abs(Number(b.steps[3].answer)*5-width)<1e-10);ok(Math.abs(Number(b.steps[4].answer)*8-height)<1e-10);equal(Number(b.steps[5].answer),Math.min(width/5,height/8));equal(b.answer,28*size*size);
    for(const flat of [0,1])for(const [region,expected] of [20,6,2,28].entries()){
      const m=f.w.Vilenkin5BoardGridAndHoney.explore(b,{flatten:flat,region});equal(m.answer,expected);if(region!==3)ok(m.visual.includes('#7ab4a1'));
    }
    const r=h.data.honeyJar;equal(h.answer+r.jar,r.total);equal(h.answer/r.jar,r.k);
    for(const ratio of [2,4,7])for(const target of [0,1,2])equal(f.w.Vilenkin5BoardGridAndHoney.explore(h,{ratio,target}).answer,[ratio*r.jar,r.jar,(ratio+1)*r.jar][target]);
  }
  equal(sets[0].size,6);ok(sets[1].size>15);f.close();
  const g=boot('#lesson/'+board);g.submit('40');ok(g.snapshot().scene.message.includes('с вырезами'));for(const v of ['20','8','28','4 4/5','25/4']){g.submit(v);ok(g.snapshot().scene.correct);g.click('[data-cmd=next]');}
  g.submit('6,25');ok(g.snapshot().scene.message.includes('оба размера'));g.submit('4,8');ok(g.snapshot().scene.correct);ok(!g.snapshot().scene.assisted);g.close();
}

function sandAndCubesRegression(){
  const box='v5f-printed-5-22',cubes='v5f-printed-5-23',f=boot(),first=f.M.generate(box,0);
  equal(plain([...first.steps,first].map(t=>Number(t.answer))),[315,504,223,72,590,4130,3]);ok(first.why.includes('с. 172')&&first.why.includes('3626 г')&&first.why.includes('4130 г'));const printedCubes=f.M.generate(cubes,0);equal(plain([...printedCubes.steps,printedCubes].map(t=>t.answer)),[2,8,4]);
  const variants=new Set();for(let seed=0;seed<110;seed++){
    const task=f.M.generate(box,seed),{a,b,h,l,w,grams,rate,tin}=task.data.openBox;variants.add(task.conditionKey);
    const pieces=[a*b,b*h,a*h,l*w],skin=pieces[0]+2*pieces[1]+2*pieces[2],area=2*(skin+pieces[3]),paint=area*rate;
    const ref=[a*b*h,a*b*h*grams/1000,skin,l*w,area,paint,Math.ceil(paint/tin)];
    for(const [i,t] of [...task.steps,task].entries()){equal(Number(t.answer),ref[i]);ok(f.M.accepts(String(t.answer).replace('.',','),t));}
    ok((task.answer-1)*tin<paint&&task.answer*tin>=paint);
    for(let piece=0;piece<4;piece++)for(const sides of [0,1]){const v=f.w.Vilenkin5SandAndCubes.explore(task,{piece,sides});equal(Number(v.answer),(1+sides)*pieces[piece]);ok(v.visual.includes('Крышка'));}
    const c=f.M.generate(cubes,seed),{small,large}=c.data.cubeScale;equal(c.steps[1].answer*small**3,large**3);equal(c.answer*6*small**2,6*large**2);
  }equal(variants.size,6);f.close();
  const g=boot('#lesson/'+box);g.submit('63');ok(g.snapshot().scene.message.includes('площадь дна'));
  for(const n of [315,504,223,72,590,4130]){g.submit(String(n));g.click('[data-cmd=next]');}
  g.submit('2');ok(g.snapshot().scene.message.includes('не покроют'));g.submit('3');ok(g.snapshot().scene.correct);ok(!g.snapshot().scene.assisted);g.close();
}

function squareSumsRegression(){
  const id='v5f-printed-5-21',f=boot(),original=f.M.generate(id,0);
  equal(plain([...original.steps,original].map(t=>t.answer)),[9,36,100,2,28,784]);
  const arithmetic=n=>Array.from({length:n},(_,i)=>i+1);
  const seen=new Set();
  for(let seed=0;seed<140;seed++){
    const t=f.M.generate(id,seed),{rows,last}=t.data.squareSums;seen.add(t.conditionKey);
    if(seed)ok(t.conditionKey!==original.conditionKey);
    for(const [i,k] of rows.entries()){
      const total=arithmetic(k).reduce((sum,j)=>sum+j**3,0),side=arithmetic(k).reduce((sum,j)=>sum+j,0);equal(t.steps[i].answer,total);equal(total,side**2);
    }
    equal(t.answer,arithmetic(last).reduce((total,k)=>total+k**3,0));
    for(let rank=2;rank<=9;rank++)for(const measure of [0,1,2]){
      const view=f.w.Vilenkin5SquareSums.explore(t,{rank,measure,lattice:1}),side=arithmetic(rank).reduce((sum,j)=>sum+j,0),old=side-rank;
      equal(view.answer,[side,side**2-old**2,side**2][measure]);ok(view.visual.includes('новый Г-образный слой'));
    }
  }ok(seen.size>10);f.close();
  const g=boot('#lesson/'+id);
  g.input('#v5-quality-note','Сначала сложу основания, а затем умножу сумму на себя.');equal(g.snapshot().scene.attempt,0);g.submit('3');ok(g.snapshot().scene.message.includes('сторону квадрата'));g.submit('9');ok(g.snapshot().scene.correct);ok(!g.snapshot().scene.assisted);g.click('[data-cmd=next]');
  const copy=boot('#lesson/'+id,g.saved());ok(copy.snapshot().scene.note.includes('основания'));equal(copy.snapshot().scene.step,1);g.close();copy.close();
}

function exactErroneousFractionsRegression(){
  const f=boot(),p='v5f-printed-5-';
  const ray=f.M.generate(p+'17',0);ok(f.M.equal('7,5',ray.steps[3].errors[0].value));ok(!f.M.equal('777',ray.steps[3].errors[0].value));
  const seed=3,ex=f.M.generate(p+'16',seed),x=ex.data.groupDecrease;
  ok(f.M.equal((x.total/x.divisor)+'/'+x.remove,ex.errors[0].value));ok(!f.M.equal('777',ex.errors[0].value));
  for(let k=1;k<=20;k++)for(let n=0;n<90;n++){const t=f.M.generate(p+k,n);
    for(const target of [...t.steps,t])for(const value of [target.answer,...(target.errors||[]).map(e=>e.value)])ok(typeof value!=='number'||Number.isInteger(value));
  }
  f.close();const g=boot('#lesson/'+p+'17');
  for(const value of ['48','8','60']){g.submit(value);g.click('[data-cmd=next]');}
  g.submit('777');equal(g.snapshot().scene.attempt,1);ok(!g.snapshot().scene.correct);equal(g.errors,[]);
  g.submit('7,5');ok(g.snapshot().scene.message.includes('расстояние в клетках'));g.submit('30');ok(g.snapshot().scene.correct);ok(!g.snapshot().scene.assisted);g.close();
}

function cubeRowsRegression(){
  const f=boot(),id='v5f-printed-5-20',original=f.M.generate(id,0);
  equal(plain([...original.steps,original].map(x=>Number(x.answer))),[10,1000,100,1000000,10000,1,100]);
  const seen=new Set();for(let seed=0;seed<150;seed++){
    const task=f.M.generate(id,seed),{side,a,b}=task.data.cubeRows;
    seen.add(task.conditionKey);
    // All dimensions below are expressed in cm, then change only the final length to m.
    const volume=side**3,first=volume/(a*a*100),second=volume/(b*b*100);
    const correct=[side/a,volume/(a**3),first,volume/(b**3),second,1,second/first];
    for(const [i,t] of [...task.steps,task].entries()){ok(Math.abs(Number(t.answer)-correct[i])<1e-10);ok(f.M.accepts(String(t.answer).replace('.',','),t));}
    for(const [set,edge] of [a,b].entries())for(let what=0;what<4;what++){
      const m=f.w.Vilenkin5CubesInARow.explore(task,{set,what});equal(Number(m.answer),[(side/edge),(side/edge)**2,volume/edge**3,volume/(100*edge**2)][what]);ok(m.visual.includes('слоя'));
    }
  }equal(seen.size,7);const g=boot('#lesson/'+id);g.submit('100');ok(g.snapshot().scene.message.includes('во всём слое'));g.submit('10');g.click('[data-cmd=next]');g.submit('100');ok(g.snapshot().scene.message.includes('один слой'));g.submit('1000');ok(g.snapshot().scene.correct);ok(!g.snapshot().scene.assisted);g.close();f.close();
}

function partsOfUnitsRegression(){
  const ids=['v5f-printed-5-18','v5f-printed-5-19'],f=boot();
  for(const [which,id] of ids.entries()){
    const whole=which?[1000,100000,1000000]:[10,100,1000000],ref=which?[10,10000,40,25000,1000,25000]:[50,2.5,20,2,1,1000];
    const original=f.M.generate(id,0);equal(plain([...original.steps,original].map(t=>Number(t.answer))),ref);
    if(which===1)ok(f.M.accepts('25 000',original.steps[3]));
    const variants=new Set();for(let seed=0;seed<108;seed++){
      const task=f.M.generate(id,seed),x=task.data.partsOfUnits;variants.add(task.conditionKey);
      for(const [i,t] of [...task.steps,task].entries()){const [unit,divisor]=x.rows[i];equal(t.answer*divisor,whole[unit]);ok(f.M.accepts(String(t.answer).replace('.',','),t),JSON.stringify([id,seed,i,t.answer,t.answerFormat]));}
      for(const unitChoice of [0,1,2])for(const [portion,div] of [2,4,5,10,20,25,40,50,100,1000].entries()){
        const m=f.w.Vilenkin5PartsOfUnits.explore(task,{unitChoice,portion});equal(m.answer*div,whole[unitChoice]);
        const vm=documentFor(m.visual);
        const parts=Array.from(vm.querySelectorAll('svg'),svg=>svg.querySelectorAll('rect').length);
        equal(parts.reduce((a,b)=>a*b,1),div);ok(parts.every(v=>v<=10));
      }
    }ok(variants.size>=105);
  }
  function documentFor(str){const div=f.w.document.createElement('div');div.innerHTML=str;return div;}
  const g=boot('#lesson/'+ids[0]);g.submit('100');ok(g.snapshot().scene.message.includes('величина целого'));g.submit('50');g.click('[data-cmd=next]');
  const t=f.M.generate(ids[0],0).steps[1];for(const answer of ['5/2','2,5','2 1/2'])ok(f.M.accepts(answer,t));
  g.submit('2 1/2');ok(g.snapshot().scene.correct);ok(!g.snapshot().scene.assisted);const restore=boot('#lesson/'+ids[0],g.saved());equal(restore.snapshot().scene.savedInput,'2 1/2');restore.close();g.close();f.close();
}

function printedRayRegression(){
  const id='v5f-printed-5-17',f=boot(),initial=f.M.generate(id,0);
  equal(plain([...initial.steps,initial].map(t=>t.answer)),[48,8,60,30,70,'C','D']);
  equal(f.w.Vilenkin5PrintedRay.read(' с '),'C');equal(f.w.Vilenkin5PrintedRay.read('48'),null);equal(f.w.Vilenkin5PrintedRay.read('CC'),null);
  const variants=new Set();for(let seed=0;seed<132;seed++){
    const task=f.M.generate(id,seed),r=task.data.markedRay,coords={O:0,M:5*r.unit};variants.add(task.conditionKey);
    for(const [index,key] of ['F','K','N','C','D'].entries()){
      coords[key]=r.unit*r.ticks[key]/2;equal(task.steps[index].answer,coords[key]);
      for(const halves of [0,1]){const model=f.w.Vilenkin5PrintedRay.explore(task,{point:index,halves});equal(model.answer,coords[key]);ok(model.visual.includes('<svg'));}
    }
    ok(coords.K<coords.M&&coords.M<coords.C&&coords.C<coords.F&&coords.F<coords.N&&coords.N<coords.D);
    for(const target of [task.steps[5],task]){ok(coords[target.answer]>coords[target.wrongLetter]);ok(f.M.accepts(target.answer.toLowerCase(),target));ok(!f.M.accepts(target.wrongLetter,target));}
  }ok(variants.size>125);f.close();
  const g=boot('#lesson/'+id);
  g.submit('12');ok(g.snapshot().scene.message.includes('расстояние в клетках'));g.submit('48');g.click('[data-cmd=next]');
  for(const value of [8,60,30,70]){g.submit(String(value));g.click('[data-cmd=next]');}
  g.submit('30');equal(g.snapshot().scene.attempt,0);g.submit('K');ok(g.snapshot().scene.message.includes('левее'));g.submit('с');ok(g.snapshot().scene.correct);ok(!g.snapshot().scene.assisted);g.click('[data-cmd=next]');g.submit('д');ok(g.snapshot().scene.correct);g.close();
}

function smallChainsRegression(){
  const f=boot(),first='v5f-printed-5-15',second='v5f-printed-5-16';
  const printed=f.M.generate(first,0),million=f.M.generate(second,0),targets=[...printed.steps,printed];
  equal(plain(targets.map(t=>t.answer)),[5,40,52,35,7,9,54,81,72,9,8,56,70,42,6,5,30,54,34,2,7,49,66,28,7]);
  equal(plain([...million.steps,million].map(t=>t.answer)),[100000,99900]);
  const seen=new Set();
  for(let seed=0;seed<110;seed++){
    const chain=f.M.generate(first,seed),operations=[...chain.steps,chain];
    seen.add(chain.conditionKey);equal(operations.length,25);
    for(const [column,row] of chain.data.smallChains.entries()){
      const [a,b,c,d,e,g]=row;
      const independent=[a-b,(a-b)*c,(a-b)*c+d,(a-b)*c+d-e,((a-b)*c+d-e)/g];
      for(let operation=0;operation<5;operation++){
        const n=independent[operation];ok(Number.isInteger(n)&&n>0);
        equal(operations[5*column+operation].answer,n);
        const model=f.w.Vilenkin5SmallChains.explore(chain,{column,operation});
        equal(model.answer,n);ok(model.visual.includes('aria-current="step"'));
      }
    }
    const group=f.M.generate(second,seed),x=group.data.groupDecrease;
    equal(group.steps[0].answer*x.divisor,x.total);equal((group.answer+x.remove)*x.divisor,x.total);
    for(const [choice,divisor] of [2,4,5,10].entries())for(const hundreds of [0,3,8]){
      const m=f.w.Vilenkin5SmallChains.explore(group,{groupChoice:choice,hundreds});
      equal(m.answer,x.total/divisor-hundreds*100);equal((m.visual.match(/<rect /g)||[]).length,divisor);
    }
  }
  ok(seen.size>100);f.close();
  const g=boot('#lesson/'+second);equal(g.snapshot().scene.attempt,0);g.submit('999990');ok(g.snapshot().scene.message.includes('вычитание нескольких единиц'));g.submit('100000');g.click('[data-cmd=next]');
  g.submit('1000');ok(g.snapshot().scene.message.includes('Здесь сказано'));g.submit('99900');ok(g.snapshot().scene.correct);ok(!g.snapshot().scene.assisted);
  const resumed=boot('#lesson/'+second,g.saved());ok(resumed.snapshot().scene.correct);equal(resumed.snapshot().scene.step,1);resumed.close();g.close();
}

function schoolDialsRegression(){
  const f=boot(),fuel='v5f-printed-5-13',time='v5f-printed-5-14';
  const clock=f.w.Vilenkin5ClockSteps,printed=f.M.generate(time,0),tank=f.M.generate(fuel,0);
  equal(plain([...printed.steps,printed].map(x=>x.answer)),['2:25','2:15','1:50','1:25']);
  equal(plain([...tank.steps,tank].map(x=>x.answer)),[5,50,65,25]);
  for(const [input,wanted] of [[' 02:25 ','2:25'],['14:25','2:25'],['2 ч 5 мин','2:05'],['0:00','12:00'],['2:60',null],['3:',null],['24:05',null],['-1:50',null]])equal(clock.readTime(input),wanted);
  const c=boot('#lesson/'+time);c.submit('2:');equal(c.snapshot().scene.attempt,0);c.submit('2:05');ok(c.snapshot().scene.message.includes('пять минут'));c.submit('02:25');ok(c.snapshot().scene.correct);ok(!c.snapshot().scene.assisted);c.click('[data-cmd=next]');
  const restored=boot('#lesson/'+time,c.saved());equal(restored.snapshot().scene.step,1);restored.close();c.close();
  const g=boot('#lesson/'+fuel);g.submit('5');g.click('[data-cmd=next]');g.submit('50');g.click('[data-cmd=next]');g.submit('65');g.click('[data-cmd=next]');g.submit('40');ok(g.snapshot().scene.message.includes('от результата заправки'));g.submit('25');ok(g.snapshot().scene.correct);equal(g.errors,[]);g.close();
  const variants=new Set();for(let seed=0;seed<110;seed++){
    const c=f.M.generate(time,seed),d=c.data.clockMoves;variants.add(c.conditionKey);
    for(const [i,row] of [...c.steps,c].entries()){
      const shift=(i<2?1:-1)*(i%2===0?5:1)*d.counts[i],u=((d.start+shift)%720+720)%720,h=(Math.floor(u/60)||12),m=u%60;
      equal(row.answer,h+':'+String(m).padStart(2,'0'));ok(f.M.accepts(h+' ч '+m+' мин',row));
    }
    const a=f.M.generate(fuel,seed),x=a.data.fuelScale,t=x.unit*x.initial;
    equal(plain([...a.steps,a].map(j=>j.answer)),[x.unit,t,t+x.plus*x.unit,t-x.minus*x.unit]);ok(a.answer>=0);ok(a.steps[2].answer<=16*x.unit);
    for(const position of [0,1,6,10,16]){const m=f.w.Vilenkin5FuelScale.explore(a,{position,marks:1});equal(m.answer,position*x.unit);ok(m.visual.includes('чет')||m.visual.includes('stroke="#2f7d59"'));}
  }
  for(let t=-1440;t<1440;t+=3)equal(clock.readTime(clock.clock(t)),clock.clock(t));
  ok(variants.size>90);equal(f.errors,[]);f.close();
}

function circumferenceEstimatesRegression(){
  const f=boot(),N=f.w.Vilenkin5CircleEstimates,generated=new Set();
  for(const n of [11,12]){
    const id='v5f-printed-5-'+n,t=f.M.generate(id,0),cfg=f.C.byId[id],inverse=n===12;
    equal(cfg.source.page,8);equal(cfg.source.part,2);
    equal(plain(t.steps.map(r=>r.answer)),inverse?[14,7500]:[9,25]);equal(t.answer,inverse?2500:75);
    const lesson=boot('#lesson/'+id);equal(lesson.snapshot().scene.attempt,0);ok(!lesson.snapshot().scene.correct);
    lesson.submit(inverse?'126':'3');ok(!lesson.snapshot().scene.correct);ok(lesson.snapshot().scene.message.includes(inverse?'короче':'одного диаметра'));
    lesson.submit(String(t.steps[0].answer));ok(lesson.snapshot().scene.correct);equal(lesson.snapshot().scene.assisted,false);lesson.click('[data-cmd=next]');
    ok(lesson.$('#task-panel svg').textContent.includes(inverse?'7 км 500 м':'2 см 5 мм'));
    ok(!lesson.$('#task-panel svg').textContent.includes(inverse?'7500':'25 мм'),'converted length is not written on the picture before pupil converts');
    lesson.submit(String(t.steps[1].answer));lesson.click('[data-cmd=next]');lesson.submit(String(t.answer));ok(lesson.snapshot().scene.correct);
    const reload=boot('#lesson/'+id,lesson.saved());ok(reload.snapshot().scene.correct);equal(reload.snapshot().scene.savedInput,String(t.answer));reload.close();lesson.close();
    for(let seed=0;seed<75;seed++){
      const p=f.M.generate(id,seed),a=p.data.estimate;
      generated.add(p.conditionKey);equal(p.steps[0].answer,inverse?a.first/3:a.first*3);
      equal(p.steps[1].answer,a.known);equal(p.answer,inverse?a.known/3:a.known*3);
      ok(Number.isInteger(p.answer)&&p.answer>0);ok(f.M.accepts(String(p.answer),p));
      const parsed=a.written.match(/^(\d+) (?:см|км) (\d+) (?:мм|м)$/);
      equal(+parsed[1]*(inverse?1000:10)+Number(parsed[2]),a.known);
      for(const direction of [0,1])for(const size of [2,7,19,40]){
        const model=N.explore(p,{direction,size});equal(model.answer,direction?size:3*size);ok(model.visual.includes('stroke-dasharray'));ok(model.question.includes(a.unit));
      }
    }
  }
  ok(generated.size>85);equal(f.errors,[]);f.close();
}

function threadMeasurementRegression(){
  const id='v5f-printed-5-10',f=boot('#lesson/'+id);
  const change=(key,val)=>{const el=f.$('[data-v5-param="'+key+'"]');el.value=String(val);el.dispatchEvent(new f.w.Event('change',{bubbles:true}));};
  const t=f.M.generate(id,0),cfg=f.C.byId[id];equal(cfg.source.page,8);equal(cfg.source.part,2);
  equal(plain(t.data.thread.rows),[{d:20,c:63},{d:40,c:125},{d:60,c:189}]);equal(t.answer,'3,1');
  equal(f.snapshot().scene.attempt,0);ok(!f.snapshot().scene.correct);ok(f.$('#task-panel table').textContent.includes('для самопроверки'));
  change('d1',32);change('c1',101);
  change('row',1);equal(f.$('[data-v5-param="d2"]').value,'40');
  change('c2',120);change('stage',1);
  const own=f.snapshot();equal(own.scene.model.c1,101);equal(own.scene.model.c2,120);equal(own.scene.model.stage,1);
  const returned=boot('#lesson/'+id,f.saved());equal(plain(returned.snapshot().scene.model),plain(own.scene.model));returned.close();
  f.submit('125');ok(f.snapshot().scene.message.includes('длину нитки'));f.submit('120');ok(f.snapshot().scene.correct);equal(f.snapshot().scene.assisted,false);
  f.click('[data-cmd=next]');f.submit('5');f.click('[data-cmd=next]');f.submit('3,1');ok(f.snapshot().scene.correct);
  const cases=new Set();
  for(let seed=0;seed<140;seed++){
    const task=f.M.generate(id,seed),data=task.data.thread;cases.add(task.conditionKey);
    const r=data.rows[data.choose],model=f.w.Vilenkin5ThreadMeasurement;
    equal(task.steps[0].answer,3*r.d);equal(task.steps[1].answer,r.c-3*r.d);
    equal(Number(task.answer.replace(',','.')),Math.floor((20*r.c+r.d)/(2*r.d))/10);ok(f.M.accepts(String(task.answer).replace('.',','),task));
    for(const [n,row] of data.rows.entries()){
      ok(Math.abs(row.c-Math.PI*row.d)<=1.51);
      for(const stage of [0,1]){
        const s={d1:20,d2:40,d3:60,c1:63,c2:125,c3:189,row:n,stage,['d'+(n+1)]:row.d,['c'+(n+1)]:row.c};
        const view=model.explore(task,s,(title,_,rows)=>title+rows.map(x=>x.join(' ')).join(' '));
        equal(view.answer,Math.floor(row.c/row.d));ok(view.visual.includes('мм'));ok(view.visual.includes(stage?'Распрямлённая':'От края до края'));
      }
    }
  }
  ok(cases.size>45);equal(f.errors,[]);f.close();
}

function objectExamplesRegression(){
  const id='v5f-printed-5-9',f=boot('#lesson/'+id),bank=f.w.Vilenkin5RoundObjects;
  const t=f.M.generate(id,0);equal(plain([...t.steps,t].map(x=>x.answer)),['окружность','круг','цилиндр','шар']);ok(t.prompt.startsWith('Авторская проверка к №5.9.'));
  equal(f.$('.v5q-notes summary').textContent,'Мои четыре примера');
  f.input('#v5-quality-note','Край пуговицы, бумажный кружок, сырная головка, стеклянный шарик');
  equal(f.snapshot().scene.attempt,0);ok(!f.snapshot().scene.correct);
  f.submit('ободок');equal(f.snapshot().scene.attempt,0);
  f.submit('КРУГА');ok(f.snapshot().scene.message.includes('заполненную область'));f.submit('Окружности.');ok(f.snapshot().scene.correct);equal(f.snapshot().scene.assisted,false);
  const again=boot('#lesson/'+id,f.saved());ok(again.snapshot().scene.correct);ok(again.$('#v5-quality-note').value.includes('сырная'));again.close();
  ok(f.M.accepts('Диск.',t.steps[1]));ok(!f.M.accepts('сфера',t));ok(t.errors.find(e=>e.value==='сфера').text.includes('поверхность'));
  const variants=new Set();for(let seed=0;seed<80;seed++){
    const task=f.M.generate(id,seed);variants.add(task.conditionKey);
    equal(new Set([...task.steps,task].map(x=>x.answer)).size,4);
    for(const [i,row] of [...task.steps,task].entries()){
      ok(f.M.accepts(row.answer.toUpperCase(),row));const model=bank.explore(task,{kind:task.data.roundObject.order[i]});ok([0,1,2].includes(model.answer));
    }
  }
  ok(variants.size>50);equal(f.errors,[]);f.close();
}
function cutsRegression(){
  const f=boot(),id='v5f-printed-5-8',F=f.w.Vilenkin5ThreeCuts;
  const printed=f.M.generate(id,0);equal(plain(printed.steps.map(q=>q.answer)),[2,4,3,7,4]);equal(printed.answer,8);
  const repetitions=new Set();
  for(let seed=0;seed<40;seed++){
    const task=f.M.generate(id,seed),data=task.data.foodCuts;repetitions.add(task.conditionKey);
    equal(task.answer,data.limit===3?8:4);
    for(const object of [0,1])for(const style of [0,1])for(const stage of [0,1,2,3]){
      const state={object,style,stage,labels:1},m=F.layout(data,state);
      const expected=stage<3?[1,2,4][stage]:object?(style?7:8):(style?6:7);
      equal(m.number,expected);equal(F.explore(task,state).answer,expected);
      const areas=m.groups.map(group=>F.centre(group).area);ok(areas.every(a=>a>0));
      ok(Math.abs(areas.reduce((a,b)=>a+b,0)-48*Math.sin(Math.PI/48))<1e-7);
    }
  }
  ok(repetitions.size>28);
  f.route('#lesson/'+id);f.submit('2');f.click('[data-cmd=next]');f.submit('4');f.click('[data-cmd=next]');f.submit('2');ok(f.snapshot().scene.message.includes('промежутки'));f.submit('3');f.click('[data-cmd=next]');
  f.submit('6');ok(f.snapshot().scene.message.includes('одну точку'));f.submit('7');ok(f.snapshot().scene.correct);equal(f.snapshot().scene.assisted,false);
  const again=boot('#lesson/'+id,f.saved());ok(again.snapshot().scene.correct);equal(again.snapshot().scene.savedInput,'7');again.close();equal(f.errors,[]);f.close();
}
function crossingsRegression(){
  const f=boot(),a='v5f-printed-5-6',b='v5f-printed-5-7',X=f.w.Vilenkin5CircleCrossings;
  equal(plain(f.M.generate(a,0).steps.map(q=>q.answer)),[2,2,3,3,2]);
  equal(plain(f.M.generate(b,0).steps.map(q=>q.answer)),[6,5,[6,5]]);
  for(const id of [a,b]){
    equal(f.C.byId[id].source.page,8);equal(f.C.byId[id].source.part,2);
    const variants=new Set();
    for(let i=0;i<75;i++){
      const t=f.M.generate(id,i),s=t.data.circleCrossings;
      variants.add(t.conditionKey);ok(s.a!==s.b);
      for(const [j,scenario] of X.distances(s).entries()){
        const points=X.geometry(s,scenario.d);equal(points.length,[2,1,0,1,0][j]);
        for(const [x,y] of points){ok(Math.abs(Math.hypot(x,y)-s.a)<1e-8);ok(Math.abs(Math.hypot(x-scenario.d,y)-s.b)<1e-8);}
        for(const stage of [0,1,2,3]){
          const lab=X.explore(t,{distance:j,stage,leg:3});
          equal(lab.answer,points.length);ok(lab.visual.includes('role="img"'));
        }
      }
      ok(f.M.accepts(value(f.M,t),t));
    }
    ok(variants.size>40);
  }
  f.route('#lesson/'+b);f.submit('7');ok(f.snapshot().scene.message.includes('центрами'));f.submit('6');ok(f.snapshot().scene.correct);f.click('[data-cmd=next]');const restored=boot('#lesson/'+b,f.saved());equal(restored.snapshot().scene.step,1);restored.close();
  equal(f.errors,[]);f.close();
}
function chordRegression(){
  const f=boot(),disk='v5f-printed-5-4',secant='v5f-printed-5-5';
  f.route('#v5-unit/25');
  for(const id of [disk,secant]){ok(f.$('a[href="#lesson/'+id+'"]'));equal(f.C.byId[id].source.page,8);}
  const fresh=f.M.generate(disk,0);equal(plain(fresh.steps.map(t=>t.answer)),[12,8,10,10,27,7,30,10,0,1]);
  equal(fresh.answer,1);
  const traces=new Set(),radii=new Set();
  for(let seed=0;seed<80;seed++){
    const t=f.M.generate(disk,seed),d=t.data.diskDistances;
    traces.add(t.conditionKey);
    const other=f.M.generate(secant,seed);radii.add(other.answer);
    for(let i=0;i<4;i++){
      equal(d.lengths[i]<d.r,i<2);equal(t.steps[2*i+1].answer,Math.abs(d.r-d.lengths[i]));
      equal(f.w.Vilenkin5Numbered.explore(f.C.byId[disk],{mode:0,point:i},t).answer,Math.abs(d.r-d.lengths[i]));
      equal(f.w.Vilenkin5Numbered.explore(f.C.byId[secant],{point:i},other).answer,other.data.secantRadii.r);
    }
    for(let i=0;i<3;i++)equal(f.w.Vilenkin5Numbered.explore(f.C.byId[disk],{mode:1,segment:i},t).answer,[0,1,1][i]);
    equal(plain(other.steps.map(s=>s.answer)),Array(4).fill(other.answer));ok(f.M.accepts(other.answer,other));
  }
  ok(traces.size>70);ok(radii.size>15);
  f.route('#lesson/'+disk);f.submit('20');ok(f.snapshot().scene.message.includes('радиус'));f.submit('12');
  ok(f.snapshot().scene.correct);equal(f.snapshot().scene.assisted,false);f.click('[data-cmd=next]');
  const again=boot('#lesson/'+disk,f.saved());equal(again.snapshot().scene.step,1);again.close();
  f.route('#lesson/'+secant);f.submit('7');ok(f.snapshot().scene.message.includes('единиц'));f.submit('25');ok(f.snapshot().scene.correct);
  equal(f.errors,[]);f.close();
}
function compassRegression(){
  const f=boot(),measure='v5f-printed-5-2',arcs='v5f-printed-5-3';
  f.route('#v5-unit/25');ok(f.$('a[href="#lesson/'+measure+'"]'));ok(f.$('a[href="#lesson/'+arcs+'"]'));
  for(let seed=0;seed<90;seed++){
    const t=f.M.generate(measure,seed),m=t.data.measurement;
    equal(t.steps[1].answer-t.steps[0].answer,m.r);equal(t.answer,2*m.r);
    const p=f.M.generate(arcs,seed),letters=p.data.arcs.letters,qs=[...p.steps,p];
    for(let k=0;k<6;k++){
      const q=qs[k],a=letters[2*Math.floor(k/2)],b=letters[(2*Math.floor(k/2)+2)%6];
      equal(q.arcNames.length,k%2?6:2);
      for(const n of q.arcNames){ok(f.M.accepts(n,q));ok([a+b,b+a].includes(n[0]+n[2]));ok(n[1]!==n[0]&&n[1]!==n[2]);}
      for(const n of q.otherArc)ok(!f.M.accepts(n,q));
    }
  }
  f.route('#lesson/'+arcs);f.submit('KB');equal(f.snapshot().scene.attempt,0);
  f.submit('KDB');ok(f.snapshot().scene.message.includes('другую дугу'));
  f.submit('ВРК');ok(f.snapshot().scene.correct);f.click('[data-cmd=next]');
  const reread=boot('#lesson/'+arcs,f.saved());equal(reread.snapshot().scene.step,1);reread.close();
  const data=f.M.generate(arcs,0);
  for(const t of [...data.steps.slice(1),data]){
    f.submit(t.arcNames.at(-1));ok(f.snapshot().scene.correct);
    if(t!==data)f.click('[data-cmd=next]');
  }
  equal(f.errors,[]);f.close();
}
function circlePointsRegression(){
  const f=boot(), id='v5f-printed-5-1', course=f.C.byId[id];
  equal([course.source.part,course.source.point,course.source.page],[2,25,7]);
  f.route('#v5-unit/1');ok(!f.$('a[href="#lesson/'+id+'"]'));
  f.route('#v5-unit/25');ok(f.$('a[href="#lesson/'+id+'"]'));
  const task=f.M.generate(id,0), answers=['LDB','KEFAMO','MLDEBAO','FK','LB','DLB','LEO','MDBA'];
  const targets=[...task.steps,task];
  targets.forEach((t,i)=>ok(f.M.accepts(answers[i],t)));
  f.route('#lesson/'+id);f.submit('X');equal(f.snapshot().scene.attempt,0);
  f.submit('MLDEBAO');ok(f.snapshot().scene.message.includes('изнутри'));
  f.submit('л, В, д');ok(f.snapshot().scene.correct);ok(!f.snapshot().scene.assisted);equal(f.snapshot().scene.hintLevels,{});
  f.click('[data-cmd=next]');const reloaded=boot('#lesson/'+id,f.saved());equal(reloaded.snapshot().scene.step,1);reloaded.close();
  const variants=new Set();
  for(let seed=0;seed<90;seed++){
    const t=f.M.generate(id,seed),shape=t.data.circle;
    variants.add(t.conditionKey);
    for(const [name,x,y] of shape.points){
      equal(shape.ring.includes(name),x*x+y*y===4900);
      equal(shape.disk.includes(name),x*x+y*y<=4900);
      equal(shape.radius.includes(name),x*56===-42*y&&x<=0&&x>=-42);
    }
    equal([...shape.short].filter(n=>shape.long.includes(n)).sort().join(''),[shape.start,shape.end].sort().join(''));
    ok(t.steps.every(s=>f.M.accepts(s.answer,s)));ok(f.M.accepts(t.answer,t));
  }
  ok(variants.size>75);equal(f.errors,[]);f.close();
}
function numberedTablesRegression(){
  const f=boot(),path=f.C.pathById.vilenkin5;
  equal(path.ids.length,134);
  equal(plain(path.numbered),Array.from({length:125},(_,i)=>i+1).map(n=>'v5f-printed-1-'+n).concat('v5f-printed-5-1','v5f-printed-5-2','v5f-printed-5-3','v5f-printed-5-4','v5f-printed-5-5','v5f-printed-5-6','v5f-printed-5-7','v5f-printed-5-8','v5f-printed-5-9','v5f-printed-5-10','v5f-printed-5-11','v5f-printed-5-12','v5f-printed-5-13','v5f-printed-5-14','v5f-printed-5-15','v5f-printed-5-16','v5f-printed-5-17','v5f-printed-5-18','v5f-printed-5-19','v5f-printed-5-20','v5f-printed-5-21','v5f-printed-5-22','v5f-printed-5-23','v5f-printed-5-24','v5f-printed-5-25','v5f-printed-5-26','v5f-printed-5-27','v5f-printed-5-28','v5f-printed-5-29','v5f-printed-5-30','v5f-printed-5-31','v5f-printed-5-32','v5f-printed-5-33','v5f-printed-5-34','v5f-printed-5-35','v5f-printed-5-36','v5f-printed-5-37','v5f-printed-5-38','v5f-printed-5-39','v5f-printed-5-40','v5f-printed-5-41','v5f-printed-5-42'));
  for(const id of path.numbered)ok(f.$('a[href="#lesson/'+id+'"]'),'course links to '+id);
  f.input('#v5-search','№1.2');equal(f.$('#v5-search-results a').getAttribute('href'),'#lesson/'+path.numbered[1]);
  const animals=f.M.generate(path.numbered[0],0),reading=f.M.generate(path.numbered[1],0);
  equal(plain(animals.steps.map(s=>s.answer)),[[1,1],10,2,47,5,9,39]);equal(animals.answer,39);
  equal(plain(reading.steps.map(s=>s.answer)),[[4,12],[7,28],[9,45],[8,48],[4,28],32,4,0]);equal(reading.answer,161);
  const fingerprints=path.numbered.slice(0,2).map(()=>new Set());
  for(let seed=1;seed<=180;seed++){
    const a=f.M.generate(path.numbered[0],seed),r=f.M.generate(path.numbered[1],seed);
    const c=a.data.counts,b=r.data.books;
    equal(a.steps[3].answer,c.slice(0,6).reduce((s,n)=>s+n,0));equal(a.answer,a.steps[3].answer-c[3]);
    equal(c[a.steps[1].answer-2],0);equal(c[a.steps[2].answer-2],Math.max(...c.slice(0,9)));
    equal(r.steps.at(-3).answer,b.length);equal(r.steps.at(-2).answer,b.filter(n=>n===7).length);equal(r.steps.at(-1).answer,b.filter(n=>n===8).length);equal(r.answer,b.reduce((s,n)=>s+n,0));
    [a,r].forEach((task,i)=>fingerprints[i].add(f.w.WorkshopState.fingerprint(path.numbered[i],task)));
  }
  ok(fingerprints.every(set=>set.size>170),'fresh surveys have distinct fingerprints');
  f.route('#lesson/'+path.numbered[0]);f.submit('2;5');
  equal(f.snapshot().scene.firstWrong,null);equal(f.snapshot().scene.attempt,0);ok(f.snapshot().scene.message.includes('действительно стоят птицы'));
  f.route('#lesson/'+path.numbered[1]);
  ok(f.$('#task-panel table').textContent.includes('Анкеты читателей'));
  equal(f.snapshot().scene.firstAttempt,null);f.submit('4');equal(f.snapshot().scene.attempt,0);
  f.submit('4;4');equal(f.snapshot().scene.firstWrong.value,'4;4');ok(f.snapshot().scene.message.includes('умножь частоту'));
  f.submit('4;12');f.click('[data-cmd=next]');equal(f.snapshot().scene.step,1);
  const tables=f.w.document.querySelectorAll('#task-panel table');equal(tables.length,2);
  equal([...tables[1].tBodies[0].rows[0].cells].map(cell=>cell.textContent),['3','4','12']);
  const reload=boot('#lesson/'+path.numbered[1],f.saved());equal(reload.snapshot().scene.step,1);equal(reload.snapshot().scene.answers[0],'4;12');reload.close();
  const opt=f.$('[data-v5-param=group]');opt.value='5';opt.dispatchEvent(new f.w.Event('change',{bubbles:true}));equal(f.snapshot().scene.model.group,5);
  f.input('[data-v5-prediction]','0');f.$('[data-v5-predict]').dispatchEvent(new f.w.Event('submit',{bubbles:true,cancelable:true}));ok(f.snapshot().scene.model.seen);
  for(const id of path.numbered.slice(0,2)){
    const full=boot('#lesson/'+id);const task=full.M.generate(id,0);
    for(const s of task.steps){full.submit(Array.isArray(s.answer)?s.answer.join(';'):String(s.answer));ok(full.snapshot().scene.correct);full.click('[data-cmd=next]');}
    full.submit(String(task.answer));ok(full.snapshot().scene.correct);
    full.click('[data-cmd=mode][data-value=practice]');const practice=full.snapshot().scene;ok(practice.seed!==0);ok(!full.$('#model'));
    const data=full.M.generate(id,practice.seed);full.submit(String(data.answer));ok(full.snapshot().scene.correct);
    equal(full.errors,[]);full.close();
  }
  equal(f.errors,[]);f.close();
}
function scheduleAndEqualityRegression(){
  const f=boot(),ids=f.C.pathById.vilenkin5.numbered.slice(2),[schedule,columns,equalities]=ids;
  const [calendar,tbl,calc]=ids.map(id=>f.M.generate(id,0));
  equal(plain(calendar.answer),[1,2,3]);equal(plain(calendar.alternatives),[[3,1,2]]);
  equal(plain(tbl.data.columns),[[25,11,null],[null,11,30],[14,null,55],[25,28,null],[null,null,63],[15,null,null],[null,22,null],[null,null,null]]);
  equal(plain(tbl.steps.slice(0,4).map(step=>step.answer)),[36,19,41,53]);
  equal(plain(calc.steps.map(step=>step.answer)),[46,18,69,18,81,17]);equal(plain(calc.answer),[1,2,5]);
  const marks=new Set();
  for(let seed=0;seed<100;seed++){
    const task=f.M.generate(schedule,seed),forbidden=task.data.forbidden;let okPlans=0;
    for(let a=1;a<=3;a++)for(let b=1;b<=3;b++)for(let c=1;c<=3;c++){
      const values=[a,b,c],valid=new Set(values).size===3&&values.every((club,i)=>forbidden[club-1]!==i+1);
      equal(f.M.accepts(values.join(';'),task),valid);okPlans+=Number(valid);
    }
    equal(okPlans,2);marks.add(task.conditionKey);
    const col=f.M.generate(columns,seed),sum=col.data.columns[4][2];
    ok(f.M.accepts('0;'+sum+';'+sum,col));ok(f.M.accepts(sum+';0;'+sum,col));
    ok(!f.M.accepts('0;'+sum+';'+(sum+1),col));ok(!f.M.accepts('-1;'+(sum+1)+';'+sum,col));
    const sums=f.M.generate(equalities,seed),wrong=sums.data.calculations.flatMap(([x,op,y,g],i)=>(op==='+'?x+y:x-y)!==g?[i+1]:[]);
    equal(plain(sums.answer),plain(wrong));ok(f.M.accepts(wrong.reverse().join(';'),sums));
  }
  ok(marks.size>25,'calendar repeats offer genuinely different data');
  f.route('#lesson/'+schedule);f.submit('1;2');f.click('[data-cmd=next]');
  f.submit('3;1;2');equal(f.snapshot().scene.attempt,0);ok(f.snapshot().scene.message.includes('тоже подходит'));
  f.submit('1;2;3');f.click('[data-cmd=next]');f.submit('3;1;2');f.click('[data-cmd=next]');f.submit('2');f.click('[data-cmd=next]');
  f.submit('1;1;2');ok(f.snapshot().scene.message.includes('дважды'));f.submit('3;1;2');ok(f.snapshot().scene.correct,'accept other full schedule');
  f.route('#lesson/'+columns);
  const answers=['36','19','41','53','50;13;63','15;0;15','3;22;25','0;0;0'];
  answers.forEach((answer,i)=>{if(i===4){f.submit('50;13;60');ok(f.snapshot().scene.message.includes('Сохрани'));f.submit('50;14;63');ok(f.snapshot().scene.message.includes('Заново сложи'));}f.submit(answer);ok(f.snapshot().scene.correct);f.click('[data-cmd=next]');});
  f.submit('5;58;63');ok(f.snapshot().scene.correct);equal([...f.$('#task-panel table').tBodies[0].rows[4].cells].map(c=>c.textContent),['5','50','13','63']);
  const restored=boot('#lesson/'+columns,f.saved());equal(restored.snapshot().scene.savedInput,'5;58;63');ok(restored.snapshot().scene.correct);restored.close();
  f.route('#lesson/'+equalities);
  for(const step of calc.steps){f.submit(String(step.answer));f.click('[data-cmd=next]');}
  f.submit('5;1;2');ok(f.snapshot().scene.correct);equal(f.errors,[]);f.close();
}
function orderAndJourneyRegression(){
  const f=boot(),[order,journey]=f.C.pathById.vilenkin5.numbered.slice(5);
  const o=f.M.generate(order,0),j=f.M.generate(journey,0);
  equal(plain(o.steps.map(s=>s.answer)),[[6,48],[300,30],[70,210],[9,27],[11,22],[90,30],[36,4],[23,69],[70,10],[48,2],[14,84],[7,7]]);
  equal(plain(o.answer),[2,84,7]);equal(plain(j.answer),[30,70,2]);
  const expressionValue=expr=>{const [n,op,z]=expr.split(' '),a=+n,b=+z;switch(op){case '+':return a+b;case '−':return a-b;case ':':return a/b;default:return a*b;}};
  const groups=new Set();
  for(let s=1;s<=80;s++){
    const task=f.M.generate(order,s);groups.add(task.inputPrompt);
    for(const row of task.data.order){equal(expressionValue(row.begin),row.first);equal(expressionValue(row.end),row.second);ok(Number.isInteger(row.first)&&Number.isInteger(row.second));}
    const trip=f.M.generate(journey,s);trip.data.trips.forEach(t=>equal(t.hours*t.rate,t.distance));equal(plain(trip.answer),[trip.data.trips[0].distance,trip.data.trips[1].rate,trip.data.trips[2].hours]);
  }
  equal(groups.size,4);
  f.route('#lesson/'+order);f.submit('56;48');ok(f.snapshot().scene.message.includes('не опережает'));f.submit('6;47');ok(f.snapshot().scene.message.includes('Первое действие верно'));
  for(const step of o.steps){f.submit(step.answer.join(';'));ok(f.snapshot().scene.correct);f.click('[data-cmd=next]');}f.submit('2;84;7');ok(f.snapshot().scene.correct);
  f.route('#lesson/'+journey);f.submit('17');ok(f.snapshot().scene.message.includes('складывать нельзя'));
  for(const step of j.steps){f.submit(String(step.answer));f.click('[data-cmd=next]');}
  equal([...f.$('#task-panel table').tBodies[0].rows[1].cells].map(cell=>cell.textContent),['Авто','5','70','350']);
  f.submit('30;70;2');ok(f.snapshot().scene.correct);equal(f.errors,[]);f.close();
}
function weatherDiaryRegression(){
  const id='v5f-printed-1-8',f=boot('#lesson/'+id),api=f.w.Vilenkin5WeatherDiary;
  const d=k=>'[data-v5-weather-'+k+']';
  const change=(k,v)=>{const el=f.$(d(k));if(el.type==='checkbox')el.checked=v;else el.value=String(v);el.dispatchEvent(new f.w.Event('change',{bubbles:true}));};
  const enter=(day,sky,rain,temp)=>{change('day',day);change('sky',sky);change('rain',rain);f.input(d('temp'),temp);f.click(d('form')+' button');};
  const check=v=>{f.input(d('response'),v);f.click(d('review')+' button');return f.$(d('result')).textContent;};
  const base=f.M.generate(id,0);
  equal(base.steps.length,5);equal(base.table.rows.length,15);ok(base.prompt.includes('Вымышленные наблюдения'));
  equal(f.snapshot().scene.correct,false);equal(f.$(d('review')),null);ok(f.$('#model').textContent.includes('0 из 15'));
  for(const n of ['','10,02','71','-101','без измерения'])equal(api.parseTemp(n),null);
  for(const n of [-100,-15.3,0,9.9,10,10.1,70])for(const sky of [0,1,2])for(const rain of [false,true]){
    const round=api.record(api.code(sky,rain,n));equal([round.sky,round.rain,round.temp],[sky,rain,n]);
  }
  const fingerprints=new Set();
  for(let seed=0;seed<=90;seed++){
    const t=f.M.generate(id,seed),records=t.data.observations.map(n=>api.record(n));
    const counts=[d=>d.sky===1,d=>d.sky===2,d=>d.rain,d=>d.temp<10,d=>d.temp>10].map(rule=>Array.from(records).filter(rule).length);
    const win=counts.flatMap((n,i)=>n===Math.max(...counts)?[i+1]:[]);
    const rainy=records.filter(d=>d.rain),sun=records.filter(d=>d.sky===1);
    const expected=[win,counts[0]===counts[1]?0:counts[0]>counts[1]?1:2,counts[3],rainy.length?(rainy.some(d=>d.temp>=10)?0:1):2,sun.length?(sun.some(d=>d.temp<=10)?0:1):2];
    equal(plain(t.steps.map(s=>s.answer)),expected);ok(f.M.accepts([...win].reverse().join(';'),t));fingerprints.add(f.w.WorkshopState.fingerprint(id,t));
  }
  equal(fingerprints.size,91);f.input(d('temp'),'не число');f.click(d('form')+' button');ok(f.$(d('note')).textContent.includes('Дату пока не записали'));
  enter(1,1,true,'10');enter(2,2,false,'9,5');change('day',3);f.input(d('temp'),'−1,2');
  const restored=boot('#lesson/'+id,f.saved());equal(restored.$(d('temp')).value,'−1,2');equal(restored.snapshot().scene.model.daya,api.code(1,true,10));equal(restored.snapshot().scene.model.dayb,api.code(2,false,9.5));restored.close();
  for(let day=3;day<=15;day++)enter(day,0,false,'10');
  ok(f.$(d('review')));equal(f.snapshot().scene.correct,false);
  ok(check('1').includes('Проверь'));ok(check('4;3;2;1').includes('после исправления'));
  change('question',1);ok(check('0').includes('Верно по твоим записям'));
  change('question',2);f.click(d('hint'));ok(check('1').includes('после подсказки'));
  change('question',3);ok(check('0').includes('Верно'));change('question',4);ok(check('0').includes('Верно'));
  enter(1,0,false,'10');change('question',3);ok(check('2').includes('Верно'));change('question',4);ok(check('2').includes('Верно'));
  equal(f.snapshot().scene.attempt,0);equal(f.snapshot().scene.correct,false);equal(f.snapshot().scene.assisted,false);
  for(const step of base.steps){f.submit(value(f.M,step));ok(f.snapshot().scene.correct);f.click('[data-cmd=next]');}
  f.submit(value(f.M,base));ok(f.snapshot().scene.correct);
  f.click('[data-cmd=mode][data-value=practice]');ok(f.$('#task-panel .question').textContent.includes('Новые вымышленные'));ok(!f.$(d('form')));
  f.click('[data-cmd=mode][data-value=learn]');equal(f.snapshot().scene.model.dayo,api.code(0,false,10));
  equal(f.errors,[]);f.close();
}
function pointEndRegression(){
  const ids=Array.from({length:5},(_,i)=>'v5f-printed-1-'+(i+9)),[weekId,lettersId,grainId,produceId,calcsId]=ids;
  const f=boot('#lesson/'+weekId),get=(id,s=0)=>f.M.generate(id,s),week=get(weekId),letter=get(lettersId),grain=get(grainId),produce=get(produceId),calcs=get(calcsId);
  ids.forEach(id=>{equal(f.C.byId[id].source.page,11);equal(f.C.byId[id].source.part,1);});
  equal(plain([week.answer,...week.alternatives]),[[1,3,2,4],[3,4,1,2]]);
  equal(plain(letter.answer),[34,22,9,4,28,29]);equal(plain(letter.clarifications[0].value),[31,22,9,3,27,25]);
  equal(grain.answer,208);equal(produce.answer,1060);equal(plain(calcs.steps.map(s=>s.answer)),[1221,74,406,8550,1089,85,1224,33]);
  const distinct=new Set();
  for(let seed=1;seed<=80;seed++){
    const week=get(weekId,seed),letters=get(lettersId,seed),grain=get(grainId,seed),produce=get(produceId,seed),calcs=get(calcsId,seed);
    const variants=[];
    for(const a of week.data.available[0])for(const b of week.data.available[1])for(const c of week.data.available[2])for(const d of week.data.available[3])if(new Set([a,b,c,d]).size===4)variants.push([a,b,c,d].join(';'));
    equal(variants.length,2);equal([week.answer,...week.alternatives].map(row=>row.join(';')).sort(),variants.sort());variants.forEach(plan=>ok(f.M.accepts(plan,week)));
    const totals=Array.from('анышли',letter=>Array.from(letters.data.texts.join(' ').toLowerCase()).filter(x=>x===letter).length);
    equal(plain(letters.answer),totals);distinct.add(letters.conditionKey);
    equal(grain.answer,grain.data.one*2-grain.data.less);equal(produce.answer,4*produce.data.one-produce.data.less);
    for(const entry of calcs.data.cases){
      const m=entry[0].match(/\d+|[·():+−]/g),op=(x,o,y)=>o==='·'?x*y:o===':'?x/y:o==='+'?x+y:x-y;let expected;
      if(m.length===3)expected=op(+m[0],m[1],+m[2]);
      else if(m[0]==='(')expected=op(op(+m[1],m[2],+m[3]),m[5],+m[6]);
      else if(m[2]==='(')expected=op(+m[0],m[1],op(+m[3],m[4],+m[5]));
      else expected=op(op(+m[0],m[1],+m[2]),m[3],+m[4]);
      equal(expected,entry[1]);ok(Number.isSafeInteger(entry[1]));
    }
  }
  ok(distinct.size>60);f.submit('1;3');equal(f.snapshot().scene.attempt,0);
  f.submit('3;4;1;2');equal(f.snapshot().scene.attempt,0);ok(f.snapshot().scene.message.includes('другой ветки'));
  f.submit('1;3;1;2');ok(f.snapshot().scene.message.includes('повторяется'));
  for(const row of week.steps){f.submit(value(f.M,row));f.click('[data-cmd=next]');}
  f.submit('3;4;1;2');ok(f.snapshot().scene.correct);
  f.route('#lesson/'+lettersId);f.submit('31');equal(f.snapshot().scene.attempt,0);ok(f.snapshot().scene.message.includes('цитаты'));
  for(const row of letter.steps){f.submit(value(f.M,row));f.click('[data-cmd=next]');}
  f.submit('31;22;9;3;27;25');equal(f.snapshot().scene.attempt,0);
  f.submit('34;22;9;4;28;29');ok(f.snapshot().scene.correct);
  f.route('#lesson/'+grainId);f.submit('8');ok(f.snapshot().scene.message.includes('на сколько меньше'));
  f.route('#lesson/'+produceId);f.submit('250');f.click('[data-cmd=next]');f.submit('273');ok(f.snapshot().scene.message.includes('количество овощей'));
  for(const id of ids){
    f.route('#lesson/'+id);
    ok(f.$('#model svg,#model table'));ok(f.$('#task-panel table'));
    const task=get(id);const model=f.w.Vilenkin5Numbered.explore(f.C.byId[id],f.snapshot().scene.model,task);ok(Number.isInteger(model.answer));
  }
  equal(f.errors,[]);f.close();
}
function printedDigitsRegression(){
  const f=boot(),D=f.w.Vilenkin5PrintedDigits,ids=[14,15,16].map(n=>'v5f-printed-1-'+n);
  const [reading,compose,dictate]=ids.map(id=>f.M.generate(id,0));
  equal(plain(reading.data.values),[27,80,279,701,718,3781,7023,70907,300007]);equal(reading.steps.length,27);
  equal(plain(compose.data.values),[507,960,2341,5632,2870,8007]);equal(compose.steps.length,12);
  equal(plain(dictate.data.values),[78,5412,10005023,10002064000,117000002030]);
  equal(plain(dictate.table.rows.map(row=>row[1])),['семьдесят восемь','пять тысяч четыреста двенадцать','десять миллионов пять тысяч двадцать три','десять миллиардов два миллиона шестьдесят четыре тысячи','сто семнадцать миллиардов две тысячи тридцать']);
  const norm=s=>s.replace(/ё/g,'е');
  const groups=new Map([['тысяча',1000],['тысячи',1000],['тысяч',1000],['миллион',1e6],['миллиона',1e6],['миллионов',1e6],['миллиард',1e9],['миллиарда',1e9],['миллиардов',1e9]]);
  const small=new Map([['ноль',0],['один',1],['одна',1],['два',2],['две',2],['три',3],['четыре',4],['пять',5],['шесть',6],['семь',7],['восемь',8],['девять',9],['десять',10],['одиннадцать',11],['двенадцать',12],['тринадцать',13],['четырнадцать',14],['пятнадцать',15],['шестнадцать',16],['семнадцать',17],['восемнадцать',18],['девятнадцать',19],['двадцать',20],['тридцать',30],['сорок',40],['пятьдесят',50],['шестьдесят',60],['семьдесят',70],['восемьдесят',80],['девяносто',90],['сто',100],['двести',200],['триста',300],['четыреста',400],['пятьсот',500],['шестьсот',600],['семьсот',700],['восемьсот',800],['девятьсот',900]]);
  function fromWords(s){let base=0,total=0;for(const word of norm(s).split(' ')){if(small.has(word))base+=small.get(word);else {ok(groups.has(word));total+=(base||1)*groups.get(word);base=0;}}return total+base;}
  [0,1,11,111,1000,2000,11000,12000,21000,22000,111000,112000,1e6,1e9,117000002030,999999999999].forEach(n=>equal(fromWords(D.words(n)),n));
  for(const n of ['0','117 000 002 030','70 907','70 907','8007'])ok(D.natural(n)!==null);
  for(const n of ['00','1e9','9,2','12 34',' 1 22','30 0000','+42'])equal(D.natural(n),null);
  ok(f.M.accepts('Тысяча один.',{v6Full:true,answerFormat:'v5-reading',answer:'одна тысяча один'}));ok(!f.M.accepts('два тысячи',{v6Full:true,answerFormat:'v5-reading',answer:'две тысячи'}));
  for(let seed=0;seed<100;seed++){
    const three=ids.map(id=>f.M.generate(id,seed));
    for(const task of three)for(const n of task.data.values)equal(fromWords(D.words(n)),n);
    three[0].data.values.forEach((n,i)=>{for(const [offset,digit] of [[1,7],[2,0]]){
      const ranks=[];for(let pos=0;pos<String(n).length;pos++)if(Math.floor(n/(10**pos))%10===digit)ranks.push(pos+1);
      equal(plain(three[0].steps[3*i+offset].answer),ranks.length?ranks:[0]);
    }});
  }
  f.route('#v5-unit/2');ids.forEach(id=>ok(f.$('a[href="#lesson/'+id+'"]')));
  f.route('#lesson/'+ids[0]);f.submit('27');equal(f.snapshot().scene.attempt,0);f.submit('двадцать ноль семь');ok(f.snapshot().scene.message.includes('нулевая')||f.snapshot().scene.message.includes('Нулевая'));
  for(const row of reading.steps){f.submit(value(f.M,row));ok(f.snapshot().scene.correct);f.click('[data-cmd=next]');}
  f.submit(reading.answer);ok(f.snapshot().scene.correct);
  f.route('#lesson/'+ids[1]);for(const row of compose.steps){
    const ans=row.answerFormat==='v5-natural'?String(row.answer).replace(/\B(?=(\d{3})+(?!\d))/g,' '):row.answer;
    f.submit(ans);ok(f.snapshot().scene.correct);f.click('[data-cmd=next]');
  }
  f.submit('8 007');ok(f.snapshot().scene.correct);
  f.route('#lesson/'+ids[2]);f.submit('7 8');equal(f.snapshot().scene.attempt,0);
  for(const row of dictate.steps){f.submit(String(row.answer).replace(/\B(?=(\d{3})+(?!\d))/g,' '));ok(f.snapshot().scene.correct);f.click('[data-cmd=next]');}
  f.submit('117 000 002 030');ok(f.snapshot().scene.correct);equal(f.errors,[]);f.close();
}
function printedClassesRegression(){
  const f=boot(),D=f.w.Vilenkin5PrintedDigits,ids=[17,18,19].map(n=>'v5f-printed-1-'+n),[parts,spoken,units]=ids.map(id=>f.M.generate(id,0));
  equal(plain(parts.data.values),[3042,14670,200418,4290000,1029503731,48000790001,400300987654,505050505050]);
  equal(plain(parts.steps.map(s=>s.answer)),['3 042','14 670','200 418','4 290 000','1 029 503 731','48 000 790 001','400 300 987 654','505 050 505 050']);
  equal(plain(spoken.data.values),[407,7003,80403,6000730249,41000604000,32072000000,120003040900,79740000600,1000000044,71004000010,1000100321,494274303101]);
  equal(spoken.steps[3].answer,'шесть миллиардов семьсот тридцать тысяч двести сорок девять');
  equal(spoken.steps[8].answer,'один миллиард сорок четыре');
  equal(D.cleanReading('один миллиард одна тысяча'),D.cleanReading('миллиард тысяча'));
  ok(D.cleanReading('двадцать один миллиард')!==D.cleanReading('двадцать миллиард'));
  ok(D.cleanReading('двадцать одна тысяча')!==D.cleanReading('двадцать тысяча'));
  equal(plain(units.data.values),[4000,207000,2031000,74505000,21000000,209000000,993000000000,105307000,27000000823]);
  const seedSets=ids.map(()=>new Set());
  for(let seed=1;seed<=80;seed++){
    const [p,s,u]=ids.map((id,i)=>{const t=f.M.generate(id,seed);seedSets[i].add(t.conditionKey);return t;});
    p.steps.forEach((step,i)=>{equal(D.splitClasses(step.answer),String(p.data.values[i]));ok(f.M.accepts(step.answer.replaceAll(' ',' | '),step));});
    s.steps.forEach((step,i)=>equal(step.answer,D.words(s.data.values[i])));
    u.table.rows.forEach(([_,text],i)=>{
      const groups=String(text).replace(/(?<=\d) (?=\d{3}(?: |$))/g,'').matchAll(/(\d+)(?: (тыс\.|млн|млрд))?/g);
      const expected=Array.from(groups,match=>Number(match[1])*({'тыс.':1000,'млн':1e6,'млрд':1e9}[match[2]]||1)).reduce((a,b)=>a+b,0);
      equal(expected,u.steps[i].answer);
    });
  }
  seedSets.forEach(s=>equal(s.size,80));
  for(const raw of ['3042','03 042','30 42','3||042','3  42','3 0a2'])equal(D.splitClasses(raw),null);
  f.route('#lesson/'+ids[0]);f.submit('30 42');ok(f.snapshot().scene.message.includes('Цифры сохранены'));
  f.submit('3 402');ok(f.snapshot().scene.message.includes('исходные цифры'));
  parts.steps.forEach(s=>{f.submit(s.answer.replaceAll(' ',' | '));ok(f.snapshot().scene.correct);f.click('[data-cmd=next]');});f.submit(parts.answer);ok(f.snapshot().scene.correct);
  f.route('#lesson/'+ids[1]);spoken.steps.forEach(s=>{f.submit(s.answer);ok(f.snapshot().scene.correct);f.click('[data-cmd=next]');});f.submit('миллиард сорок четыре');ok(f.snapshot().scene.correct);
  f.route('#lesson/'+ids[2]);f.submit('4');ok(f.snapshot().scene.message.includes('количество тысяч'));
  units.steps.forEach(s=>{f.submit(String(s.answer));ok(f.snapshot().scene.correct);f.click('[data-cmd=next]');});f.submit('27 000 000 823');ok(f.snapshot().scene.correct);
  equal(f.errors,[]);f.close();
}
function printedTextNumbersRegression(){
  const f=boot(),ids=[20,21,22,23,24].map(n=>'v5f-printed-1-'+n),[passage,rank,between,short,long]=ids.map(id=>f.M.generate(id,0));
  equal(plain(passage.data.values),[3,29765,149600000,384400,4600000000,3500000000]);equal(passage.steps.length,6);
  equal(rank.data.values[0],29805674231);equal(plain(rank.steps.slice(1).map(s=>s.answer)),[6,4,8,9,1,9,0,4,3]);
  equal(plain(between.answer),[5,8]);equal(plain(short.data.values),[4444,30303030]);equal(plain(long.data.values),[329329,329329329,329329329329]);
  const fingerprints=ids.map(()=>new Set()),M=f.M,numbered=f.w.Vilenkin5Numbered;
  for(let seed=1;seed<=96;seed++){
    const tasks=ids.map((id,i)=>{const t=M.generate(id,seed);fingerprints[i].add(t.conditionKey);return t;});
    const [p,r,b,a,l]=tasks;
    ok(p.data.values[5]<p.data.values[4]);equal(p.steps.length,6);ok(p.prompt.includes('Вымышленные данные'));
    const placeDigits=String(r.data.values[0]).split('').reverse().map(Number);
    for(let i=1;i<=4;i++){const digit=Number(r.steps[i].prompt.match(/цифра (\d)/)[1]);equal(placeDigits[r.steps[i].answer-1],digit);equal(placeDigits.filter(n=>n===digit).length,1);}
    equal(plain(r.answer),[1,10,8,4,2].map(pos=>placeDigits[pos-1]));
    for(let i=0;i<b.data.pairs.length;i++){
      const [lo,hi]=b.data.pairs[i],inside=Array.from({length:hi-lo+1},(_,n)=>lo+n).filter(n=>n>lo&&n<hi);
      equal(b.steps[i].answer,inside.length);
      for(let pos=0;pos<=11;pos++)equal(numbered.explore(f.C.byId[ids[2]],{row:i,position:pos},b).answer,inside.filter(n=>n<=lo+pos).length);
    }
    for(const t of [a,l])for(const [i,block]of t.data.source.entries()){
      let accum=0;for(let k=0;k<t.data.times[i];k++)accum=accum*10**String(block).length+block;
      equal(t.data.values[i],accum);equal(t.steps[i*2].answer,accum);ok(M.accepts(f.w.Vilenkin5PrintedDigits.words(accum),t.steps[i*2+1]));
    }
  }
  fingerprints.forEach(s=>ok(s.size>=70));
  f.route('#lesson/'+ids[2]);f.submit('6');ok(f.snapshot().scene.message.includes('шаги'));
  f.submit('5');f.click('[data-cmd=next]');f.submit('8');f.click('[data-cmd=next]');f.submit('5;8');ok(f.snapshot().scene.correct);
  f.route('#lesson/'+ids[3]);f.submit('16');ok(f.snapshot().scene.message.includes('произведение'));
  for(const [i,id] of ids.entries()){
    f.route('#lesson/'+id);
    f.click('[data-cmd=mode][data-value=practice]');const practice=f.snapshot().scene,task=M.generate(id,practice.seed);ok(task.conditionKey!==M.generate(id,0).conditionKey);
    f.submit(value(M,task));ok(f.snapshot().scene.correct, id+' accepts a new mathematical problem');
  }
  equal(f.errors,[]);f.close();
}
function printedTreeRegression(){
  const f=boot(),ids=[25,26,27,28,29].map(n=>'v5f-printed-1-'+n),generate=(id,s=0)=>f.M.generate(id,s),[tree,zero,packs,distinct,neighbors]=ids.map(id=>generate(id));
  equal(plain(tree.data.numbers),[333,335,353,355,533,535,553,555]);equal(tree.answer,8);
  equal(plain(zero.data.numbers),[600,606,660,666]);equal(zero.data.sum,2532);equal(zero.data.divisor,422);equal(zero.answer,6);
  equal(plain(packs.steps.map(s=>s.answer)),[10,100,100000,10,10000]);equal(plain(distinct.answer),[6,3]);equal(plain(distinct.data.alphabet),[0,2,7]);
  equal(plain(neighbors.answer),[3999,1000,7990,5009]);
  const seeds=ids.map(()=>new Set());
  for(let seed=1;seed<65;seed++){
    const ts=ids.map((id,i)=>{const t=generate(id,seed);seeds[i].add(t.conditionKey);return t;});
    for(let i=0;i<2;i++){
      const t=ts[i],{width,digits}=t.data,valid=[];
      for(let n=10**(width-1);n<10**width;n++)if([...String(n)].every(v=>digits.includes(+v)))valid.push(n);
      equal(plain(t.data.numbers),valid);
      if(i)equal(t.answer,valid.reduce((a,b)=>a+b,0)/t.data.divisor);else equal(t.answer,valid.length);
      for(const [pos,prefix] of t.data.levels.flat().entries()){
        const view=f.w.Vilenkin5Numbered.explore(f.C.byId[ids[i]],{prefix:pos},t);
        equal(view.answer,valid.filter(n=>String(n).startsWith(prefix)).length);
      }
    }
    ts[2].data.values.forEach(([n,u],i)=>equal(ts[2].steps[i].answer*u,n));
    equal(plain(ts[3].answer),[String(ts[3].data.n).length,new Set(String(ts[3].data.n)).size]);
    ts[4].data.moves.forEach(([n,delta],i)=>equal(ts[4].answer[i],n+delta));
  }
  seeds.forEach(s=>ok(s.size>6));
  f.route('#lesson/'+ids[1]);f.submit('2');ok(f.snapshot().scene.message.includes('первом разряде'));
  for(const row of zero.steps){f.submit(value(f.M,row));ok(f.snapshot().scene.correct);f.click('[data-cmd=next]');}
  f.submit('6');ok(f.snapshot().scene.correct);
  f.route('#lesson/'+ids[2]);f.submit('0');ok(f.snapshot().scene.message.includes('полных группах'));
  f.route('#lesson/'+ids[3]);f.submit('6');f.click('[data-cmd=next]');f.submit('7;0;2');f.click('[data-cmd=next]');f.submit('6');equal(f.snapshot().scene.attempt,0);ok(f.snapshot().scene.message.includes('всего написанных знаков'));
  f.submit('3');f.click('[data-cmd=next]');f.submit('6;3');ok(f.snapshot().scene.correct);
  f.route('#lesson/'+ids[4]);f.submit('4001');ok(f.snapshot().scene.message.includes('противоположное'));
  for(const row of neighbors.steps){f.submit(value(f.M,row));f.click('[data-cmd=next]');}f.submit('3999;1000;7990;5009');ok(f.snapshot().scene.correct);
  equal(f.errors,[]);f.close();
}
function printedCalculationsRegression(){
  const f=boot(),ids=[30,31,32,33,34,35].map(n=>'v5f-printed-1-'+n),tasks=ids.map(id=>f.M.generate(id,0)),[order,sums,tunnels,calc,adjacent,dictation]=tasks;
  equal(plain(order.answer),[2300,0,800,1500]);equal(plain(order.data.entries.map(e=>e.first)),[[2],[1,3],[1,4],[1]]);
  equal(plain(sums.answer),[44957,6042601,709320,2905]);equal(tunnels.answer,1414);equal(plain(calc.answer),[357,2408,41,40]);
  equal(plain(adjacent.answer),[100,9999999,9999999,100000000,75699,76910]);equal(plain(dictation.data.values),[74,350,636300,2800005,200070301,98308600845,10100065008,9000007006]);
  equal(f.C.byId[ids[5]].source.page,14);equal(f.C.byId[ids[5]].source.pageEnd,15);equal(dictation.steps.length,8);
  equal(dictation.table.rows[5][1],'девяносто восемь миллиардов триста восемь миллионов шестьсот тысяч восемьсот сорок пять');
  function evalExpr(text){
    const tokens=text.match(/\d+|[−+·:()]/g);let pos=0;
    function atom(){const t=tokens[pos++];if(t!=='(')return Number(t);const n=addition();equal(tokens[pos++],')');return n;}
    function mult(){let n=atom();while(['·',':'].includes(tokens[pos])){const op=tokens[pos++],v=atom();n=op==='·'?n*v:n/v;}return n;}
    function addition(){let n=mult();while(['+','−'].includes(tokens[pos])){const op=tokens[pos++],v=mult();n=op==='+'?n+v:n-v;}return n;}
    const n=addition();equal(pos,tokens.length);return n;
  }
  const signatures=ids.map(()=>new Set());
  for(let seed=1;seed<=80;seed++){
    const [o,s,t,c,a,d]=ids.map((id,i)=>{const generated=f.M.generate(id,seed);signatures[i].add(generated.conditionKey);return generated;});
    for(const task of [o,c])task.data.entries.forEach((e,i)=>{equal(evalExpr(e.text),task.answer[i]);ok(Number.isSafeInteger(e.value));for(const op of e.ordered)equal(evalExpr(op.text),op.value);});
    s.data.rows.forEach((row,i)=>equal(row.reduce((sum,v)=>sum+v,0),s.answer[i]));
    equal(t.data.short+t.answer,t.data.length);a.data.base.forEach((n,i)=>equal(n+a.data.shifts[i],a.answer[i]));
    d.steps.forEach((step,i)=>equal(step.answer,d.data.values[i]));
  }
  signatures.forEach(signs=>equal(signs.size,80));
  f.route('#lesson/'+ids[0]);for(const [i,step]of order.steps.entries()){
    if(i===2||i===4)f.submit(String(step.alternatives[0]));else f.submit(value(f.M,step));
    ok(f.snapshot().scene.correct);f.click('[data-cmd=next]');
  }
  f.submit('2 300;0;800;1 500');ok(f.snapshot().scene.correct);
  f.route('#lesson/'+ids[2]);f.submit('2');f.click('[data-cmd=next]');f.submit('7 816');ok(f.snapshot().scene.message.includes('суммарная длина'));
  f.route('#lesson/'+ids[5]);ok(f.$('.v5q-source').textContent.includes('страницы 14–15'));
  for(const step of dictation.steps){f.submit(String(step.answer));ok(f.snapshot().scene.correct);f.click('[data-cmd=next]');}
  f.submit('9 000 007 006');ok(f.snapshot().scene.correct);equal(f.errors,[]);f.close();
}

function printedPageFifteenRegression(){
  const f=boot(),ids=[36,37,38,39,40,41].map(n=>'v5f-printed-1-'+n);
  const source=ids.map(id=>f.M.generate(id,0)),[magn,repeat,pairs,herds,exercises,calc]=source;
  equal(plain(magn.data.values),[79000,17000000,348000000000]);equal(plain(magn.answer),[5,8,12]);
  equal(repeat.data.values[0],7777777777);equal(repeat.answer,'семь миллиардов семьсот семьдесят семь миллионов семьсот семьдесят семь тысяч семьсот семьдесят семь');
  equal(plain(pairs.steps[0].answer),[11,17,71,77]);equal(pairs.answer,176);
  equal(herds.data.second,1144);equal(herds.answer,1980);equal(exercises.answer,17);
  equal(plain(calc.answer),[3948,2466,646,31]);
  const signs=ids.map(()=>new Set());
  for(let seed=1;seed<=70;seed++){
    const tasks=ids.map((id,i)=>{const t=f.M.generate(id,seed);signs[i].add(t.conditionKey);return t;}),[m,r,p,h,e,c]=tasks;
    equal(plain(m.answer),Array.from(m.data.values,n=>String(n).length));
    equal(String(r.data.values[0]),String(r.data.digit).repeat(r.data.n));
    const every=Array.from({length:90},(_,k)=>k+10).filter(n=>[...String(n)].every(d=>p.data.digits.includes(+d)));
    equal(plain(p.data.numbers),every);equal(p.answer,every.reduce((sum,n)=>sum+n,0));
    for(const [pos,prefix] of p.data.levels.flat().entries()){
      const view=f.w.Vilenkin5Numbered.explore(f.C.byId[ids[2]],{prefix:pos},p);
      equal(view.answer,every.filter(n=>String(n).startsWith(prefix)).length);
    }
    equal(h.answer,h.data.first*2+h.data.gap);equal(e.answer,e.data.second-e.data.first);
    for(const [row,[exp,first,mid,end]]of c.data.rows.entries()){
      const nums=exp.match(/\d+/g).map(Number),[a,b,k]=nums;
      equal(mid,[a*b,b+k,b/k,a+b][row]);equal(end,[a*b+k,a*(b+k),a+b/k,(a+b)/k][row]);equal(end,c.steps[row].answer);
    }
  }
  signs.forEach((set,i)=>ok(set.size>=(i===1||i===2?12:40)));
  f.route('#lesson/'+ids[2]);f.submit('77;17;11;71');ok(f.snapshot().scene.correct);
  f.route('#lesson/'+ids[3]);f.submit('308');ok(f.snapshot().scene.message.includes('разница'));
  for(const [i,id]of ids.entries()){
    equal(f.C.byId[id].source.page,15);f.route('#lesson/'+id);
    for(const step of source[i].steps){f.submit(value(f.M,step));ok(f.snapshot().scene.correct);f.click('[data-cmd=next]');}
    f.submit(value(f.M,source[i]));ok(f.snapshot().scene.correct);
    f.click('[data-cmd=mode][data-value=practice]');const sc=f.snapshot().scene,practice=f.M.generate(id,sc.seed);
    ok(practice.conditionKey!==source[i].conditionKey);
  }
  equal(f.errors,[]);f.close();
}


function printedSegmentRegression(){
  const f=boot(),ids=[42,43,44,45].map(n=>'v5f-printed-1-'+n),src=ids.map(id=>f.M.generate(id,0)),[split,measures,member,between]=src;
  ok(f.M.accepts('MC DC DN',split));ok(f.M.accepts('DM CD NC',split));ok(!f.M.accepts('MC MN DN',split));ok(!f.M.accepts('MC DD NC',split));
  equal(plain(measures.answer),[2,5,10,3,8,5]);ok(f.M.accepts('РO QP RO RQ PO RP',measures.steps[0])===false);
  ok(f.M.accepts('QP OR RP QO OP RQ',measures.steps[0]));ok(f.M.accepts('HBRPX',member));ok(f.M.accepts('CDNM',member.steps[1]));
  equal(plain(between.steps.map(s=>s.answer)),['K S P','S P','K','P']);
  for(let seed=0;seed<100;seed++){
    for(const [i,id] of ids.entries()){
      const t=f.M.generate(id,seed),d=t.data,l=f.C.byId[id];equal(l.point,3);equal(l.source.page,18);
      const exploration=(state)=>f.w.Vilenkin5Numbered.explore(l,state,t);
      if(i===0){for(const swap of [0,1])for(const piece of [0,1,2])equal(exploration({swap,piece}).answer,swap?[3,2,4][piece]:[2,3,4][piece]);}
      if(i===1){for(let j=0;j<6;j++){const [p,q]=d.pairs[j].split('').map(v=>d.positions[d.order.indexOf(v)]);equal(t.answer[j],q-p);equal(exploration({pair:j}).answer,q-p);}}
      if(i===2){for(let j=0;j<9;j++)equal(exploration({mark:j}).answer,j>=d.left&&j<=d.right?1:0);}
      if(i===3){for(let pair=0;pair<4;pair++){const [a,b]=d.pairs[pair];equal(exploration({pair}).answer,b-a-1);ok(f.M.accepts(d.order.slice(a+1,b).reverse().join(' '),t.steps[pair]));}}
    }
  }
  for(const [i,id] of ids.entries()){
    f.route('#lesson/'+id);ok(f.$('#task-panel svg[role=img]'));ok(f.$('#model svg[role=img]'));
    for(const [j,step]of src[i].steps.entries()){f.submit(value(f.M,step));const scene=f.snapshot().scene;ok(scene.correct,id+' / '+j+' / '+scene.step+': '+scene.message);f.click('[data-cmd=next]');}
    f.submit(value(f.M,src[i]));ok(f.snapshot().scene.correct);f.click('[data-cmd=mode][data-value=practice]');
    ok(f.M.generate(id,f.snapshot().scene.seed).conditionKey!==src[i].conditionKey);
  }
  equal(f.errors,[]);f.close();
  const fresh=boot();
  fresh.route('#lesson/'+ids[2]);fresh.submit('MC');fresh.click('[data-cmd=next]');fresh.submit('DN');ok(fresh.snapshot().scene.message.includes('Оба конца'));
  fresh.submit('MCND');ok(fresh.snapshot().scene.correct);fresh.click('[data-cmd=next]');fresh.submit('HPXR');ok(fresh.snapshot().scene.message.includes('за концами'));
  equal(fresh.errors,[]);fresh.close();
}


function compassAndCompoundRegression(){
  const f=boot(),ids=['v5f-printed-1-46','v5f-printed-1-47'],[measurement,lengths]=ids.map(id=>f.M.generate(id,0));
  ok(f.M.accepts('FE=KM; TP=DC',measurement));ok(!f.M.accepts('AB=CD; MK=EF',measurement));ok(!f.M.accepts('PT=CD; CD=PT',measurement));
  equal(plain(lengths.steps.map(s=>s.answer)),[12,27,9]);equal(lengths.answer,36);
  for(let seed=0;seed<110;seed++){
    const c=f.M.generate(ids[0],seed),l=f.M.generate(ids[1],seed);
    const doc=f.w.document.createElement('div');doc.innerHTML=f.w.Vilenkin5PrintedSegments.drawing(c.data);
    equal(doc.querySelectorAll('svg line').length,5);const value=(e,k)=>+e.getAttribute(k),actual=Array.from(doc.querySelectorAll('svg line'),e=>Math.hypot(value(e,'x2')-value(e,'x1'),value(e,'y2')-value(e,'y1')));
    actual.forEach((v,i)=>ok(Math.abs(v-2*c.data.lengths[i])<1e-8));
    ok(Math.abs(actual[1]-actual[4])<1e-8&&Math.abs(actual[2]-actual[3])<1e-8&&actual[1]>actual[0]&&actual[2]>actual[1]);
    const [a,b,z,ab,total]=l.data.parts;equal(a+b,ab);equal(ab+z,total);ok(z>0&&Number.isInteger(z));
    for(let delta=0;delta<5;delta++)equal(f.w.Vilenkin5Numbered.explore(f.C.byId[ids[0]],{sample:seed%5,delta},c).answer,delta<2?1:delta>2?3:2);
  }
  for(const [i,id]of ids.entries()){const t=[measurement,lengths][i];f.route('#lesson/'+id);for(const q of t.steps){f.submit(value(f.M,q));ok(f.snapshot().scene.correct);f.click('[data-cmd=next]');}f.submit(value(f.M,t));ok(f.snapshot().scene.correct);}
  equal(f.errors,[]);f.close();
}


function printedChecksRegression(){
  const f=boot(),ids=['v5f-printed-check-2-1','v5f-printed-check-2-2'],fl=f.C.pathById.vilenkin5;
  equal(plain(fl.printedChecks),ids.concat('v5f-printed-check-3-1','v5f-printed-check-3-2','v5f-printed-check-4','v5f-printed-check-25-1','v5f-printed-check-25-2','v5f-printed-check-25-3'));ok(!fl.numbered.some(id=>ids.includes(id)));equal(fl.ids.length,134);ids.forEach(id=>ok(f.$('a[href="#lesson/'+id+'"]')));
  const buy=f.M.generate(ids[0],0);equal(plain(buy.steps.map(s=>s.answer)),[56,3,130,655]);equal(buy.answer,700);
  for(let seed=0;seed<220;seed++){
    const t=f.M.generate(ids[0],seed),d=t.data;
    equal(d.total,d.mass.reduce((sum,kg,i)=>sum+kg*d.prices[i],0));
    equal(t.answer,d.total-d.prices[0]+d.prices[1]-d.prices[2]+(d.changed[3]-d.mass[3])*d.prices[3]);
  }
  for(let own=100;own<=999;own++){
    const t=f.M.generate(ids[1],own),d=t.data;equal(d.original,own);equal(String(d.n),String(own)+own);
    equal(plain(t.steps.map(s=>s.answer)),[6,own,own%10,own%10,d.n+1,d.n-1,d.n+1000]);equal(t.answer,d.n/1001);
  }
  f.route('#lesson/'+ids[0]);
  for(const q of buy.steps){f.submit(value(f.M,q));ok(f.snapshot().scene.correct);f.click('[data-cmd=next]');}
  f.submit('655');ok(f.snapshot().scene.message.includes('первоначальный'));f.submit('700');ok(f.snapshot().scene.correct);
  f.route('#lesson/'+ids[1]);const choose='[data-v5-print-number]';f.input(choose+' input','07');f.click(choose+' button');equal(f.snapshot().scene.seed,0);equal(f.snapshot().scene.attempt,0);ok(f.$('[data-v5-own-note]').textContent.includes('три цифры'));
  f.input(choose+' input','909');f.click(choose+' button');equal(f.snapshot().scene.seed,909);f.submit('6');f.click('[data-cmd=next]');f.submit('9');ok(f.snapshot().scene.message.includes('тройку'));
  f.submit('909');ok(f.snapshot().scene.correct);f.click('[data-cmd=next]');const state=f.snapshot(),stored=f.saved();f.close();
  const resumed=boot('#lesson/'+ids[1],stored);equal(resumed.snapshot().scene.seed,909);equal(resumed.snapshot().scene.step,state.scene.step);equal(resumed.$(choose+' input').value,'909');
  resumed.input(choose+' input','909');resumed.click(choose+' button');equal(resumed.snapshot().scene.step,state.scene.step);
  equal(resumed.errors,[]);resumed.close();
}


function printedLengthUnitsRegression(){
  const f=boot(),ids=Array.from({length:8},(_,i)=>'v5f-printed-1-'+(48+i)),tasks=ids.map(id=>f.M.generate(id,0)),expected=[[69,183,90],'5 см 2 мм; 30 см 8 мм',[36,41,1207],'2 дм 7 см; 50 дм 1 см; 4 дм 5 см',[7700,3004,6020],'9 км 678 м; 6 км 9 м; 24 км 700 м',[100,1000,100,100000],[42,110]];
  equal(plain(tasks.map(t=>t.answer)),expected);ok(f.M.accepts('05см02мм;30см8мм',tasks[1]));ok(!f.M.accepts('5 мм 2 см; 30 см 8 мм',tasks[1]));
  const scale={'мм':1,'см':10,'дм':100,'м':1000,'км':1000000};
  for(let seed=0;seed<=75;seed++)for(const [i,id]of ids.entries()){
    const t=f.M.generate(id,seed),d=t.data;equal(f.C.byId[id].source.page,19);
    if(d.kind==='combine')d.rows.forEach((parts,j)=>equal(parts.reduce((sum,[u,n])=>sum+scale[u]*n,0),t.answer[j]*scale[d.target]));
    if(d.kind==='decompose')d.pairs.forEach(([n,left],j)=>{equal(n*scale[d.large]+left*scale[d.small],d.values[j]*scale[d.small]);ok(left<d.factor);});
    if(d.kind==='links')d.units.forEach(([a,b],j)=>equal(d.counts[j]*scale[a],t.answer[j]*scale[b]));
    if(d.kind==='two'){equal(d.small+d.shift,d.orig);equal(d.orig+d.shift,d.large);for(const side of [0,1])equal(f.w.Vilenkin5Numbered.explore(f.C.byId[id],{side},t).answer,side?d.large:d.small);}
  }
  for(const [i,id]of ids.entries()){
    const t=tasks[i];f.route('#lesson/'+id);
    for(const [j,q]of t.steps.entries()){f.submit(value(f.M,q));ok(f.snapshot().scene.correct,id+' / '+j);f.click('[data-cmd=next]');}
    f.submit(i===7?'110;42':value(f.M,t));ok(f.snapshot().scene.correct,id+' final');f.click('[data-cmd=mode][data-value=practice]');ok(f.M.generate(id,f.snapshot().scene.seed).conditionKey!==t.conditionKey);
  }
  equal(f.errors,[]);f.close();
}


function buildablePathsRegression(){
  const f=boot(),ids=[56,57,58,59].map(n=>'v5f-printed-1-'+n),B=f.w.Vilenkin5PrintedBuildablePaths;
  const src=ids.map(id=>f.M.generate(id,0));equal(src[0].data.fig.names,'FSHRPMD');equal(src[3].data.fig.names,'ABCDEFH');equal(src[1].data.first+src[1].data.second,src[1].answer);ok(f.M.accepts('AK KD DC CB BA',src[2]));
  for(let seed=0;seed<60;seed++)for(const [index,id]of ids.entries()){
    const l=f.C.byId[id],t=f.M.generate(id,seed),d=t.data,model=f.w.Vilenkin5QualityModels.defaults(l);equal(l.source.page,19);
    if(d.fig){const fig=d.fig;fig.edges.forEach(e=>{const [x,y]=fig.coords[e.from],[xx,yy]=fig.coords[e.to];equal(e.length,Math.round(Math.hypot(x-xx,y-yy)));});equal(fig.edges.length,fig.coords.length-(fig.closed?0:1));
      if(d.kind==='drawing'){const key=seed%7,codes=d.codes.slice();codes[key]=(codes[key]+1)%5;model['p'+key]=codes[key]+1;const own=B.selection(t,model),next=f.M.generate(id,own);equal(plain(next.data.codes),plain(codes));ok(next.conditionKey!==t.conditionKey);equal(next.answer,next.data.fig.edges.reduce((sum,e)=>sum+e.length,0));}
    }else{for(const [a,b]of [[1,80],[13,13],[42,9]]){model.firstLength=a;model.secondLength=b;const t2=f.M.generate(id,B.selection(t,model));equal(t2.data.first,a);equal(t2.data.second,b);equal(t2.answer,a+b);equal(t2.data.compare,a<b?1:a===b?2:3);}}
  }
  for(const [i,id]of ids.entries()){
    f.route('#lesson/'+id);for(const [j,q]of src[i].steps.entries()){f.submit(value(f.M,q));ok(f.snapshot().scene.correct,id+' '+j);f.click('[data-cmd=next]');}f.submit(value(f.M,src[i]));ok(f.snapshot().scene.correct);
  }
  const personal=boot('#lesson/'+ids[1]);personal.input('[data-v5-param=firstLength]','32').dispatchEvent(new personal.w.Event('change',{bubbles:true}));personal.input('[data-v5-param=secondLength]','32').dispatchEvent(new personal.w.Event('change',{bubbles:true}));
  personal.click('[data-v5-apply-drawing]');equal(personal.snapshot().scene.seed,313232);personal.submit('32');ok(personal.snapshot().scene.correct);personal.click('[data-cmd=next]');
  const saved=personal.saved();personal.close();const restored=boot('#lesson/'+ids[1],saved);equal(restored.snapshot().scene.seed,313232);equal(restored.snapshot().scene.step,1);equal(restored.errors,[]);restored.close();equal(f.errors,[]);f.close();
}






function exactPrintedMistakeRegression(){
  const f=boot(),examples=[
    ['v5f-printed-1-7',2,/делимое и делитель/],
    ['v5f-printed-1-63',0,/Ширина уже известна/],
    ['v5f-printed-1-80',4,/сантиметрах/],
    ['v5f-printed-1-84',1,/сантиметры/]
  ];
  for(const [id,index,feedback] of examples){
    const task=f.M.generate(id,0),step=task.steps[index];f.route('#lesson/'+id);
    for(const previous of task.steps.slice(0,index)){f.submit(value(f.M,previous));ok(f.snapshot().scene.correct);f.click('[data-cmd=next]');}
    const arbitrary=String(Number(step.answer)+1);
    const answer=step.errors[0].value,ratio=f.M.parse(answer);ok(ratio);if(id.endsWith('-84'))equal(arbitrary,'27');
    f.submit(arbitrary);ok(!f.snapshot().scene.correct);equal(f.snapshot().scene.step,index);equal(f.errors,[]);
    const expectedFraction=ratio.d===1?String(ratio.n):ratio.n+'/'+ratio.d;f.submit(expectedFraction);ok(feedback.test(f.snapshot().scene.message),id+' explains the exact fractional mistake');ok(!f.snapshot().scene.correct);
    f.submit(String(step.answer));ok(f.snapshot().scene.correct);equal(plain(f.snapshot().scene.hintLevels),{});equal(f.errors,[]);
    for(let seed=0;seed<120;seed++){
      const q=f.M.generate(id,seed).steps[index];ok(typeof q.errors[0].value==='string');const ratio=f.M.parse(q.errors[0].value);ok(ratio&&Number.isSafeInteger(ratio.n)&&Number.isSafeInteger(ratio.d));ok(!f.M.equal(q.errors[0].value,q.answer));
    }
  }
  f.close();
}

function printedPointFourAssessmentRegression(){
  const f=boot(),id='v5f-printed-check-4',G=f.w.Vilenkin5PrintedCheck4,N=f.w.Vilenkin5Numbered,lesson=f.C.byId[id],source=f.M.generate(id,0);
  equal(lesson.source.point,4);equal(lesson.source.page,27);ok(!f.C.pathById.vilenkin5.numbered.includes(id));ok(f.C.pathById.vilenkin5.printedChecks.includes(id));equal(source.table.rows.length,7);
  equal(plain(source.steps.map(q=>q.answer)),['AB','FMNOPT','ABCQR','PM PO','да','нет','нет','RT','нет','да','да','нет']);equal(plain(source.answer),[2,3]);
  for(const name of ['PM PF','PN PT','PT PO','PF PM'])ok(f.M.accepts(name,source.steps[3]));for(const name of ['PM PT','PM NO','PN PO'])ok(!f.M.accepts(name,source.steps[3]));
  for(const name of ['R T','TR','RT'])ok(f.M.accepts(name,source.steps[7]));ok(!f.M.accepts('RM',source.steps[7]));
  let seenLeft=false,seenRight=false;
  for(let seed=0;seed<64;seed++){const t=f.M.generate(id,seed),d=t.data.fig124,p=d.points,cross=n=>Math.abs((p[n][0]-p.T[0])*(p.O[1]-p.M[1])-(p[n][1]-p.T[1])*(p.O[0]-p.M[0]))<1e-8;
    equal([...Object.keys(p)].filter(cross).sort().join(''),'FMNOPT');const ab=(p.T[0]-p.A[0])*(p.B[0]-p.A[0])>=0,truths=[ab,true,true,ab];seenLeft||=ab;seenRight||=!ab;
    equal(plain(t.answer),truths.flatMap((v,i)=>v?[i+1]:[]));for(const q of t.steps)ok(f.M.accepts(String(q.answer),q));
    for(const mode of [0,1,2])for(let k=0;k<(mode===2?4:6);k++){const m=N.explore(lesson,{mode,pair:k,point:k},t);equal(m.answer,Number(mode===2?k===0:[ab,true,true,ab,ab,false][k]));ok(!m.visual.includes('NaN'));}
  }
  ok(seenLeft&&seenRight);f.route('#lesson/'+id);f.submit('AC');ok(f.snapshot().scene.message.includes('противоположно'));f.submit('AB');f.click('[data-cmd=next]');f.submit('M P N O');ok(f.snapshot().scene.message.includes('продолжениях'));f.submit('T O P N M F');ok(f.snapshot().scene.correct);equal(plain(f.snapshot().scene.hintLevels),{});f.close();
}

function closingPlanePointCalculationRegression(){
  const f=boot(),ids=[122,123,124,125].map(n=>'v5f-printed-1-'+n),N=f.w.Vilenkin5Numbered,source=ids.map(id=>f.M.generate(id,0));
  equal(plain(source[0].steps.map(q=>q.answer)),[384,539]);equal(plain(source[1].steps.map(q=>q.answer)),[1100,2,20]);equal(plain(source[2].answer),[14559,584,420,80]);
  equal(plain(source[3].data.measures.counts),[[2,0,0],[2,0,3],[0,32,3]]);equal(plain(source[3].data.measures.totals),[352,511,8095]);equal(source[3].answer,'3 м 52 см; 5 м 11 см; 80 м 95 см');
  for(let seed=0;seed<80;seed++){
    const a=ids.map(id=>f.M.generate(id,seed)),explore=(i,s)=>N.explore(f.C.byId[ids[i]],s,a[i]);
    for(const v of a)for(const q of [...v.steps,v]){const ans=Array.isArray(q.answer)?q.answer.join(';'):String(q.answer);ok(f.M.accepts(ans,q));for(const e of q.errors||[])ok(!f.M.equal(e.value,q.answer));}
    const {upper,extra}=a[0].data.tower;for(const delta of [0,17,50])for(let ask=0;ask<2;ask++)equal(explore(0,{delta,ask}).answer,(1+ask)*upper+extra+delta);
    const {v,t,back}=a[1].data.home;for(const minutes of [0,1,11])for(let ask=0;ask<2;ask++)equal(explore(1,{minutes,ask}).answer,(minutes||t)*v/(ask?back:1));
    const z=a[2].data.ops.nums;const [p,q,r,s]=z;const expected=[[p[0]*p[1],p[2]*p[3],p[0]*p[1]+p[2]*p[3]],[q[0]/q[1],q[2]*q[3],q[0]/q[1]-q[2]*q[3]],[(r[0]-r[1]),(r[0]-r[1])*r[2],(r[0]-r[1])*r[2]/r[3]],[(s[1]+s[2]),s[0]*(s[1]+s[2]),s[0]*(s[1]+s[2])/s[3]]];
    for(let i=0;i<4;i++)for(let j=0;j<3;j++){ok(Number.isSafeInteger(expected[i][j]));equal(explore(2,{item:i,action:j}).answer,expected[i][j]);}
    const m=a[3].data.measures,cm=[176,248,53];for(let i=0;i<3;i++){equal(m.totals[i],m.counts[i].reduce((sum,v,j)=>sum+v*cm[j],0));for(let which=0;which<3;which++)for(const more of [0,3])for(const ask of [0,1])equal(explore(3,{item:i,which,more,ask}).answer,ask?m.totals[i]+more*cm[which]:(m.counts[i][which]+more)*cm[which]);}
  }
  f.route('#lesson/'+ids[0]);f.submit('229');ok(f.snapshot().scene.message.includes('отличие'));f.submit('384');f.click('[data-cmd=next]');f.submit('384');ok(f.snapshot().scene.message.includes('опора'));f.submit('539');ok(f.snapshot().scene.correct);equal(plain(f.snapshot().scene.hintLevels),{});
  f.route('#lesson/'+ids[3]);f.submit('352');f.click('[data-cmd=next]');f.submit('352 см');equal(f.snapshot().scene.attempt,0);f.submit('3 м 52 см');ok(f.snapshot().scene.correct);f.close();
}

function printedPage26FreeRegression(){
  const f=boot(),ids=[119,120,121].map(n=>'v5f-printed-1-'+n),N=f.w.Vilenkin5Numbered,G=f.w.Vilenkin5Constructions26,src=ids.map(id=>f.M.generate(id,0));
  equal(plain(src[0].data.seven),{f:3,e:5});equal(src[0].answer,'нет');equal(src[1].data.angles.k,9);equal(src[1].data.angles.m,3);equal(src[1].answer,6);
  const seven=src[0].steps[0];ok(f.M.accepts('K4Л L6Л M8Л O1Л P1Н R4В T8Н',seven));
  for(const bad of ['K2Л L6Л M8Л O1Л P1Н R4В T8Н','K4Л L6Л M8Л O9Л P1Н R4В T8Н','K3Л L6Л M8Л O1Л P1Н R4В T8Н'])ok(!f.M.accepts(bad,seven));
  const target=src[1].steps[0];for(let l=1;l<=12;l++)for(let n=1;n<=12;n++){
    const d={K:9,M:3,L:l,N:n},expected=new Set(Object.values(d)).size*(new Set(Object.values(d)).size-1)/2,all=[...G.anglePairs(d).values()];equal(all.length,expected);
    const answer=l+';'+n+' / '+all.map(name=>[...name].reverse().join('')).reverse().join(' ');ok(f.M.accepts(answer,target));
    equal(N.explore(f.C.byId[ids[1]],{l,n,ask:0},src[1]).answer,expected);if(all.length>1)ok(!f.M.accepts(l+';'+n+' / '+all.slice(1).join(' '),target));
  }
  const names=['MN','AD','PQ'];for(let i=0;i<3;i++)for(const a of ['В','Л','Н'])for(const b of ['В','Л','Н']){
    const v=names[i][0]+'1'+a+' '+names[i][1]+'8'+b,meet=a==='Л'&&b==='Л'?0:a===b?2:1;equal(f.M.accepts(v,src[2].steps[i]),i===meet);
    equal(N.explore(f.C.byId[ids[2]],{name:i,a:['В','Л','Н'].indexOf(a),b:['В','Л','Н'].indexOf(b)},src[2]).answer,[2,1,0][meet]);
  }
  for(let seed=0;seed<90;seed++)for(const id of ids){const t=f.M.generate(id,seed);for(const q of t.steps)ok(f.M.accepts(q.answer,q));}
  f.route('#lesson/'+ids[1]);f.submit('12;4 / KOL LOM MON NOK NOK KOM');ok(f.snapshot().scene.message.includes('Проверь пары'));f.submit('12;4 / KOL KOM KON MOL MON LON');ok(f.snapshot().scene.correct);equal(plain(f.snapshot().scene.hintLevels),{});
  f.route('#lesson/'+ids[2]);f.submit('M2Л N7В');ok(f.snapshot().scene.message.includes('Оба конца'));f.submit('N8Л M3Л');ok(f.snapshot().scene.correct);f.click('[data-cmd=next]');f.submit('A9Н D1Л');ok(f.snapshot().scene.correct);f.click('[data-cmd=next]');f.submit('P1В Q7В');ok(f.snapshot().scene.correct);f.close();
}

function printedPage25ConstructionsRegression(){
  const f=boot(),G=f.w.Vilenkin5Constructions25,N=f.w.Vilenkin5Numbered,ids=['v5f-printed-1-117','v5f-printed-1-118'],a=f.M.generate(ids[0],0),b=f.M.generate(ids[1],0);
  equal(plain(a.data.cross.points),{L:[0,0],K:[3,-1],A:[3,0],N:[4,4],E:[0,4],D:[2,5]});
  const expected=[[32/7,44/7],[36/13,-12/13],[-24/5,8/5]];
  for(let i=0;i<3;i++)for(let j=0;j<2;j++)ok(Math.abs(a.data.cross.markers[i].at[j]-expected[i][j])<1e-8);
  for(let seed=0;seed<65;seed++){
    const t=f.M.generate(ids[0],seed),d=t.data.cross,p=d.points;
    for(const [i,names] of ['EDAN','LKAN','EDLK'].entries()){
      const m=d.markers[i];for(const [u,v] of [[names[0],names[1]],[names[2],names[3]]]){const [x,y]=m.at;ok(Math.abs((x-p[u][0])*(p[v][1]-p[u][1])-(y-p[u][1])*(p[v][0]-p[u][0]))<1e-8);}
      for(const extend of [0,1]){const z=N.explore(f.C.byId[ids[0]],{pair:i,extend},t);equal(z.answer,m.tag);equal((z.visual.match(/stroke-dasharray/g)||[]).length,2*extend);ok(!z.visual.includes('NaN'));}
    }
  }
  equal(G.orders.length,24);for(const order of G.orders){const all=[];for(let i=0;i<order.length;i++)for(let j=i+1;j<order.length;j++)all.push(order[i]+order[j]);
    const simple=Array.from(order.slice(0,-1),(_,i)=>order[i]+order[i+1]);ok(f.M.accepts(order+' / '+all.join(' '),b.steps[0]));ok(f.M.accepts(order+' / '+simple.reverse().join(' '),b.steps[0]));
    ok(!f.M.accepts(order+' / '+simple.slice(1).join(' '),b.steps[0]));ok(!f.M.accepts(order+' / '+all.join(' ')+' '+order[1]+order[0],b.steps[0]));
  }
  for(let x=1;x<=9;x++)for(const h of ['В','Н']){const alt=h==='В'?'Н':'В';ok(f.M.accepts('D9Л C6Л A1Л B4Л Q2'+h+' P5'+alt+' L'+x+h,b.steps[1])===(x!==2));}
  const correct='A9Л B8Л C3Л D6Л L5Н P1В Q7Н';
  f.route('#lesson/'+ids[1]);f.submit('SBDPC / SB BD DP CP');ok(f.snapshot().scene.message.includes('идёт назад'));f.submit('SBDPC / SB BD DP PC');ok(f.snapshot().scene.correct);f.click('[data-cmd=next]');
  f.submit(correct.replace('P1В','P1Л'));ok(f.snapshot().scene.message.includes('Точка P должна быть вне MN'));f.submit(correct);ok(f.snapshot().scene.correct);equal(plain(f.snapshot().scene.hintLevels),{});f.click('[data-cmd=next]');f.submit('10');ok(f.snapshot().scene.message.includes('двухбуквенных'));f.submit('4');ok(f.snapshot().scene.correct);
  const svg=G.diagram(b,{answers:['SBDPC / SB BD DP PC',correct]});ok(svg.includes('S, B, D, P, C'));ok(svg.includes('>Q</text>'));f.close();
}

function printedPage25FirstRegression(){
  const f=boot(),N=f.w.Vilenkin5Numbered,D=f.w.Vilenkin5PrintedDigits;
  const ids=Array.from({length:6},(_,i)=>'v5f-printed-1-'+(111+i));
  const src=ids.map(id=>f.M.generate(id,0));
  equal(plain(src[0].data.chains.values),[[40,8,24,4,50],[72,9,20,4,36],[28,4,32,40,4],[56,7,20,5,40]]);
  equal(plain(src[0].answer),[50,36,4,40]);equal(plain(src[1].steps.map(v=>v.answer)),[1407007,10000002040,14057010203,200250054001]);
  equal(plain(src[2].steps.map(v=>v.answer)),['триста двадцать миллионов пятьсот один','четыреста один миллион одна тысяча девятьсот','семьсот три миллиарда семьсот миллионов четыре тысячи один']);
  equal(src[3].answer,12);equal(plain(src[4].steps.map(v=>v.answer)),[60,15,48,4]);equal(plain(src[5].answer),[3,3943]);
  for(let seed=0;seed<55;seed++){
    const a=ids.map(id=>f.M.generate(id,seed));const model=(i,params)=>N.explore(f.C.byId[ids[i]],params,a[i]);
    a[0].data.chains.ops.forEach((ops,i)=>{let x=a[0].data.chains.starts[i];ops.forEach(([sym,v],at)=>{x=sym==='÷'?x/v:sym==='×'?x*v:x+v;ok(Number.isSafeInteger(x));equal(a[0].steps[i*4+at].answer,x);equal(model(0,{row:i,at}).answer,x);});equal(x,a[0].answer[i]);});
    for(const i of [1,2]){const {values,spoken}=a[i].data.large;values.forEach((n,row)=>{const q=a[i].steps[row];ok(f.M.accepts(spoken?D.words(n):String(n),q));
      for(let classIndex=0;classIndex<4;classIndex++){const group=Math.floor(n/1000**(3-classIndex))%1000;equal(model(i,{row,classIndex}).answer,group);}});}
    const n=a[3].data.skip;for(let skip=0;skip<n;skip++){equal(model(3,{skip,scope:0}).answer,n-1);equal(model(3,{skip,scope:1}).answer,n*(n-1));equal((model(3,{skip,scope:0}).visual.match(/<path /g)||[]).length,n-1);}
    const j=a[4].data.journeys;equal(j.walk*j.walkHours/j.bikeHours,j.v);equal(j.boat*j.boatHours/j.motor,j.h);ok(Number.isSafeInteger(j.v)&&Number.isSafeInteger(j.h));
    for(const which of [0,1])for(const hours of [0,1,9]){const speed=which?j.boat:j.walk;equal(model(4,{which,hours,ask:0}).answer,speed*(hours||(which?j.boatHours:j.walkHours)));equal(model(4,{which,hours,ask:1}).answer,speed);}
    const [p,q]=a[5].data.division.rows;equal(plain(a[5].answer),[p[0]/p[1]-p[2],q[0]-q[1]/q[2]]);for(let row=0;row<2;row++)equal(model(5,{row,phase:1}).answer,a[5].answer[row]);
  }
  f.route('#lesson/'+ids[3]);f.submit('4');f.click('[data-cmd=next]');f.submit('4');ok(f.snapshot().scene.message.includes('уже выбран'));f.submit('3');ok(f.snapshot().scene.correct);equal(plain(f.snapshot().scene.hintLevels),{});
  f.click('[data-cmd=next]');f.submit('да');f.click('[data-cmd=next]');f.submit('6');ok(f.snapshot().scene.message.includes('без ролей'));f.submit('12');ok(f.snapshot().scene.correct);
  f.route('#lesson/'+ids[4]);f.submit('60');f.click('[data-cmd=next]');f.submit('6');ok(f.snapshot().scene.message.includes('другого участника'));f.submit('15');ok(f.snapshot().scene.correct);f.close();
}

function printedLengthPolygonRegression(){
  const f=boot(),N=f.w.Vilenkin5Numbered,U=f.w.Vilenkin5LengthPolygon,ids=[107,108,109,110].map(n=>'v5f-printed-1-'+n),src=ids.map(id=>f.M.generate(id,0));
  equal(plain(src[0].steps.map(q=>q.millimetres)),[3750,710,12300,4100000]);equal(src[0].answer,4100);equal(plain(src[1].data.segmentChain.segments),[40,15,32]);equal(src[1].answer,87);equal(plain(src[2].steps.map(q=>q.answer)),[6,32,5400,60000,4,20,3000,6050,35]);equal(plain(src[3].steps.map(s=>s.answer)),[4,'ALKF',6,'LBCDEK']);
  for(const v of ['375 см','3 м 75 см','3,75м','3 3/4 м','15/4 м','0,00375 км'])ok(f.M.accepts(v,src[0].steps[0]));for(const v of ['3 м','375 мм','3 кг','3 м + 75 см','3/0 м'])ok(!f.M.accepts(v,src[0].steps[0]));
  equal(U.mm('8,71 см',f.M),'871/10');equal(U.mm('35 000 мм',f.M),35000);equal(U.mm('0 м 7 дм 10 мм',f.M),710);equal(U.mm('7 мм 4 м',f.M),null);
  for(const [i,name] of [[1,'ALKF'],[3,'LBCDEK']])for(const dir of [name,Array.from(name).reverse().join('')])for(let k=0;k<dir.length;k++){const walk=dir.slice(k)+dir.slice(0,k);ok(f.M.accepts(walk,src[3].steps[i]));ok(f.M.accepts(walk+walk[0],src[3].steps[i]));}
  ok(!f.M.accepts('AKLF',src[3].steps[1]));ok(!f.M.accepts('LAKDEF',src[3].steps[3]));
  const factor={км:1000000,м:1000,дм:100,см:10,мм:1},sum=ps=>ps.reduce((s,[n,u])=>s+n*factor[u],0);
  for(let seed=0;seed<48;seed++){const [a,b,c,d]=ids.map(id=>f.M.generate(id,seed));
    for(const [i,[p,q]] of a.data.lengthSums.entries()){const x=sum(p),y=sum(q),v=factor[i===3?'м':'см'];equal(a.steps[i].millimetres,x+y);ok(f.M.accepts((x+y)+' мм',a.steps[i]));for(let ask=0;ask<3;ask++)equal(N.explore(f.C.byId[ids[0]],{item:i,ask},a).answer,[x,y,x+y][ask]/v);}
    const coords=b.data.segmentChain.coords;for(let from=0;from<4;from++)for(let to=0;to<4;to++)equal(N.explore(f.C.byId[ids[1]],{from,to},b).answer,Math.abs(coords[from]-coords[to]));
    c.data.conversions.forEach((p,i)=>{equal(c.steps[i].answer,sum(p)/factor[i<4?'см':'м']);for(const unit of [0,1])equal(N.explore(f.C.byId[ids[2]],{item:i,unit},c).answer,sum(p)/(unit?1:factor[i<4?'см':'м']));});
    for(const k of [1,4,9])for(const l of [1,5,9])for(const side of [0,1]){const v=N.explore(f.C.byId[ids[3]],{k,l,side},d);equal(v.answer,side?6:4);equal((v.visual.match(/<polygon /g)||[]).length,2);ok(v.visual.includes('K на EF'));}
  }
  f.route('#lesson/'+ids[0]);f.submit('375');equal(f.snapshot().scene.attempt,0);f.submit('3,751 м');equal(f.snapshot().scene.attempt,1);f.submit('3 м 75 см');ok(f.snapshot().scene.correct);equal(plain(f.snapshot().scene.hintLevels),{});
  f.route('#lesson/'+ids[3]);f.submit('4');f.click('[data-cmd=next]');f.submit('AKLF');ok(f.snapshot().scene.message.includes('соседей'));f.submit('КЛАФК');ok(f.snapshot().scene.correct);f.click('[data-cmd=next]');f.submit('6');f.click('[data-cmd=next]');f.submit('KEDCBL');ok(f.snapshot().scene.correct);f.click('[data-cmd=next]');f.submit('2');ok(f.snapshot().scene.correct);equal(plain(f.snapshot().scene.hintLevels),{});f.close();
}

function printedOralSubtractionRegression(){
  const f=boot(),N=f.w.Vilenkin5Numbered,ids=[102,103,104,105,106].map(n=>'v5f-printed-1-'+n),src=ids.map(id=>f.M.generate(id,0)),solutions=[[30,70,80,60,60],[45,27,34,15,57],[72,56,81,48,0],[530,6,800,1,10000],[5,8,7,5,6]];
  equal(plain(src[0].steps.map(q=>q.answer)),solutions.flat());equal(plain(src[0].answer),solutions.map(c=>c[4]));equal(plain(src[1].data.subtract),[[46,26,null],[37,null,27],[null,30,25],[63,null,null],[null,null,19],[null,33,null]]);equal(plain(src[2].answer),[40,102,2800,3612]);equal(src[3].answer,'да');equal(plain(src[4].answer),[3,3,3,4]);
  const calc=([a,op,b])=>({'+':a+b,'−':a-b,'×':a*b,'÷':a/b})[op];
  for(let seed=0;seed<50;seed++){const [o,t,u,w,q]=ids.map(id=>f.M.generate(id,seed));
    for(const [g,col] of o.data.oral.entries())for(const [k,expression] of col.entries()){const expected=calc(expression);equal(o.steps[5*g+k].answer,expected);equal(N.explore(f.C.byId[ids[0]],{group:g,item:k},o).answer,expected);ok(Number.isSafeInteger(expected));}
    for(const [i,col] of t.data.subtract.entries()){
      for(const free of [0,1,22,63,80]){const [A,B,D]=col;const b=B??(A!==null&&D!==null?A-D:free),d=D??(A!==null?A-b:free),a=A??b+d,allowed=d>=0;
        equal(Boolean(f.M.accepts([a,b,d].join(';'),t.steps[i])),allowed);
        for(let ask=0;ask<3;ask++)equal(N.explore(f.C.byId[ids[1]],{col:i,free,ask},t).answer,allowed?[a,b,d][ask]:-d);
      }ok(!f.M.accepts('999; 1; 1',t.steps[i]));
    }
    for(const [i,[x,y,op,d]] of u.data.mental.entries())for(let piece=0;piece<3;piece++)equal(N.explore(f.C.byId[ids[2]],{item:i,piece},u).answer,calc([[x,y,x+y][piece],op,d]));
    for(const a of [0,4,9,35])for(const b of [0,3,12]){equal(f.M.accepts(a+';'+b,w.steps[3]),b===0);for(let ask=0;ask<3;ask++)equal(N.explore(f.C.byId[ids[3]],{left:a,right:b,ask},w).answer,b>a?b-a:[a+b,a-b,2*b][ask]);}
    for(const [item,[a,b]] of q.data.quotients.entries()){equal(q.answer[item],String(a/b).length);ok(Number.isSafeInteger(a/b));for(let power=0;power<=4;power++)equal(N.explore(f.C.byId[ids[4]],{item,power},q).answer,Number(b*10**power<=a&&a<b*10**(power+1)));}
  }
  f.route('#lesson/'+ids[1]);f.submit('46;25;21');ok(f.snapshot().scene.message.includes('уже дано'));for(const [i,ans] of ['46;26;20','37;10;27','55;30;25','63;19;44','24;5;19','110;33;77'].entries()){if(i===3){f.submit('63;19;45');ok(f.snapshot().scene.message.includes('Сложи'));}f.submit(ans);ok(f.snapshot().scene.correct);f.click('[data-cmd=next]');}
  ok(f.$('#task-panel table').textContent.includes('110'));f.submit('3');ok(f.snapshot().scene.correct);equal(plain(f.snapshot().scene.hintLevels),{});
  f.route('#lesson/'+ids[3]);for(const v of ['9','15','6']){f.submit(v);f.click('[data-cmd=next]');}f.submit('4;2');ok(f.snapshot().scene.message.includes('Положительное'));f.submit('99;0');ok(f.snapshot().scene.correct);f.click('[data-cmd=next]');f.submit('да');ok(f.snapshot().scene.correct);equal(plain(f.snapshot().scene.hintLevels),{});
  for(const j of [0,2,4]){f.route('#lesson/'+ids[j]);for(const q of src[j].steps){f.submit(value(f.M,q));ok(f.snapshot().scene.correct);f.click('[data-cmd=next]');}f.submit(value(f.M,src[j]));ok(f.snapshot().scene.correct);}f.close();
}

function chosenRayNamesRegression(){
  const f=boot(),N=f.w.Vilenkin5Numbered,ids=[100,101].map(n=>'v5f-printed-1-'+n),[objects,chain]=ids.map(id=>f.M.generate(id,0));
  equal(plain(objects.data.objects.on),['A','K','B','D']);equal(objects.steps.length,4);equal(objects.answer,1);equal(plain(chain.steps.map(s=>s.answer)),[3,6,9,12,'да']);equal(chain.answer,3003);
  ok(f.M.accepts('Л K С A'.replace('Л','L'),objects.steps[0]));ok(f.M.accepts('ДК БК АД'.replace('Б','B'),objects.steps[1]));ok(f.M.accepts('DA BK KB',objects.steps[2]));ok(!f.M.accepts('DA DB KB',objects.steps[2]));ok(!f.M.accepts('DA BD AD',objects.steps[1]));ok(f.M.accepts('ДК',objects.steps[3]));
  for(let seed=0;seed<42;seed++){
    const a=f.M.generate(ids[0],seed),b=f.M.generate(ids[1],seed),on=Array.from(a.data.objects.on),d=b.data.chain,all=on.flatMap(p=>on.filter(q=>p!==q).map(q=>p+q)),l=f.C.byId[ids[0]];
    for(const [i,name] of all.entries()){ok(f.M.accepts(name,a.steps[3]));for(let j=i+1;j<all.length;j++)for(let k=j+1;k<all.length;k++){
      const word=[name,all[j],all[k]],seg=word.map(w=>Array.from(w).sort().join('')),ray=word.map(w=>w[0]+(on.indexOf(w[0])<on.indexOf(w[1])?'>':'<'));
      equal(f.M.accepts(word.join(' '),a.steps[1]),new Set(seg).size===3);equal(f.M.accepts(word.join('; '),a.steps[2]),new Set(ray).size===3);
    }}
    for(let x=0;x<on.length;x++)for(let y=0;y<on.length;y++)for(let z=0;z<on.length;z++)for(let what=0;what<2;what++){
      const answer=x!==y&&x!==z&&(what?y===z:(x<y)===(x<z));equal(N.explore(l,{a:x,b:y,c:z,what},a).answer,Number(answer));
    }
    equal(b.answer,d.far*d.width);for(let at=0;at<4;at++)for(const zone of [0,1]){const expected=((zone?d.far-4:0)+at+1)*d.width,m=N.explore(f.C.byId[ids[1]],{zone,at},b);equal(m.answer,expected);ok(m.visual.includes('Отметки луча'));}
  }
  f.route('#lesson/'+ids[0]);f.submit('A K C L');f.click('[data-cmd=next]');f.submit('AK KA BD');ok(f.snapshot().scene.message.includes('теми же концами'));f.submit('AK BD DA');f.click('[data-cmd=next]');f.submit('DA DB KB');ok(f.snapshot().scene.message.includes('один и тот же луч'));f.submit('DA BK KB');f.click('[data-cmd=next]');f.submit('KD');f.click('[data-cmd=next]');f.submit('1');ok(f.snapshot().scene.correct);equal(plain(f.snapshot().scene.hintLevels),{});
  f.route('#lesson/'+ids[1]);for(const q of chain.steps){f.submit(value(f.M,q));ok(f.snapshot().scene.correct);f.click('[data-cmd=next]');}f.submit('3000');ok(f.snapshot().scene.message.includes('начало последнего'));f.submit('3003');ok(f.snapshot().scene.correct);equal(plain(f.snapshot().scene.hintLevels),{});f.close();
}

function printedPlaneRegionsRegression(){
  const f=boot(),N=f.w.Vilenkin5Numbered,L=f.w.Vilenkin5PlaneRegions,ids=[98,99].map(n=>'v5f-printed-1-'+n),src=ids.map(id=>f.M.generate(id,0));
  equal(plain(src[0].steps.map(q=>q.answer)),[2,4,1]);equal(src[0].answer,6);equal(plain(src[1].steps.map(q=>q.answer)),[4,2,3]);equal(src[1].answer,7);
  for(let seed=0;seed<100;seed++)for(const [i,id] of ids.entries()){
    const t=f.M.generate(id,seed),d=t.data.plane,limit=i?3:d.slopes.length;equal(f.C.byId[id].source.page,24);equal(f.C.byId[id].source.point,4);
    for(let stage=0;stage<limit;stage++)for(let shift=0;shift<3;shift++){
      const serial=L.data(d,stage+1,shift).figures,shape=L.regions(serial),area=shape.reduce((sum,p)=>sum+Math.abs(p.reduce((a,v,j)=>{const w=p[(j+1)%p.length];return a+v[0]*w[1]-v[1]*w[0];},0)/2),0);ok(Math.abs(area-96)<1e-6);
      const expected=i?(shift===1?2:[2,4,7][stage]):(shift?[2,4,7,10][stage]:2*(stage+1));
      const prev=i?(shift===1?[1,2,2][stage]:[1,2,4][stage]):(shift?[1,2,4,7][stage]:[1,2,4,6][stage]);
      equal(shape.length,expected);for(let ask=0;ask<2;ask++){const v=N.explore(f.C.byId[id],{stage,shift,tint:1,ask},t);equal(v.answer,ask?expected-prev:expected);equal((v.visual.match(/<polygon /g)||[]).length,expected);}
    }
  }
  f.route('#lesson/'+ids[0]);f.submit('2');f.click('[data-cmd=next]');f.submit('4');f.click('[data-cmd=next]');f.submit('2');ok(f.snapshot().scene.message.includes('том же самом O'));f.submit('1');f.click('[data-cmd=next]');f.submit('6');ok(f.snapshot().scene.correct);equal(plain(f.snapshot().scene.hintLevels),{});
  f.route('#lesson/'+ids[1]);for(const v of ['4','2','3']){f.submit(v);f.click('[data-cmd=next]');}f.submit('6');ok(f.snapshot().scene.message.includes('две разные встречи'));f.submit('7');ok(f.snapshot().scene.correct);equal(plain(f.snapshot().scene.hintLevels),{});f.close();
}

function printedOpenLineConstructionsRegression(){
  const f=boot(),N=f.w.Vilenkin5Numbered,ids=[95,96,97].map(n=>'v5f-printed-1-'+n),[choose,names,dist]=ids.map(id=>f.M.generate(id,0));
  equal(plain(choose.data.position),{a:4,b:8,max:12});equal(choose.answer,'да');equal(plain(names.data.names.letters),['M','B','C']);equal(dist.data.opposite.mn,5);equal(dist.data.opposite.mk,4);equal(dist.data.opposite.km,1);equal(plain(dist.steps.map(s=>s.answer)),[5,'влево',9,'да']);equal(dist.answer,2);
  ok(f.M.accepts('CM MC; СВ ВС; ВМ МВ',names));ok(!f.M.accepts('MB MC BC',names));ok(!f.M.accepts('MM MC CM CB BC MB',names));
  for(let seed=0;seed<70;seed++){
    const [a,b,c]=ids.map(id=>f.M.generate(id,seed)),{a:left,b:right,max}=a.data.position;
    for(let x=0;x<=max+1;x++)for(const inside of [false,true])equal(f.M.accepts(String(x),a.steps[Number(inside)]),x<=max&&((x>=left&&x<=right)===inside));
    for(let p=0;p<=max;p++)for(let m=0;m<=max;m++)for(const which of [0,1]){const model=N.explore(f.C.byId[ids[0]],{p,m,which},a);equal(model.answer,Number(which?p<left||p>right:m>=left&&m<=right));}
    const letters=Array.from(b.data.names.letters);for(let i=0;i<3;i++)for(let j=0;j<3;j++)equal(N.explore(f.C.byId[ids[1]],{startLetter:i,endLetter:j},b).answer,Number(i!==j));
    for(const [i,s]of b.steps.entries()){const allowed=letters.filter(v=>v!==letters[i]).map(v=>letters[i]+v);ok(f.M.accepts(allowed.reverse().join('; '),s));}
    for(const flip of [0,1])for(const ask of [0,1]){const d=c.data.opposite;equal(N.explore(f.C.byId[ids[2]],{flip,ask},c).answer,ask?100000*d.km:d.mk+d.mn);}
  }
  f.route('#lesson/'+ids[0]);for(const id of ids){equal(f.C.byId[id].source.page,24);equal(f.C.byId[id].source.point,4);}
  f.submit('7');ok(f.snapshot().scene.message.includes('самого отрезка'));f.submit('11');ok(f.snapshot().scene.correct);f.click('[data-cmd=next]');f.submit('4');ok(f.snapshot().scene.correct);f.click('[data-cmd=next]');ok(f.$('#task-panel svg').textContent.includes('K=M'));f.submit('да');ok(f.snapshot().scene.correct);equal(plain(f.snapshot().scene.hintLevels),{});
  f.route('#lesson/'+ids[1]);f.submit('МБ');equal(f.snapshot().scene.attempt,0);for(const q of names.steps){f.submit(q.answer);ok(f.snapshot().scene.correct);f.click('[data-cmd=next]');}
  f.submit('MB MC BC');ok(f.snapshot().scene.message.includes('обратном порядке'));f.submit('CB BC BM MB MC CM');ok(f.snapshot().scene.correct);
  f.route('#lesson/'+ids[2]);f.submit('5');f.click('[data-cmd=next]');f.submit('вправо');ok(f.snapshot().scene.message.includes('другую сторону'));f.submit('налево');f.click('[data-cmd=next]');f.submit('1');ok(f.snapshot().scene.message.includes('Вычитают'));f.submit('9');f.click('[data-cmd=next]');f.submit('да');f.click('[data-cmd=next]');f.submit('2');ok(f.snapshot().scene.correct);equal(plain(f.snapshot().scene.hintLevels),{});f.close();
}

function printedPlaneIntersectionRegression(){
  const f=boot(),ids=['v5f-printed-1-92','v5f-printed-1-93'],N=f.w.Vilenkin5Numbered;
  const base=ids.map(id=>f.M.generate(id,0)),[m,p]=base,yesNo=['да','нет','нет','да','да','нет'];
  equal(plain(m.steps.map(q=>q.answer)),['AKBD','LC']);ok(f.M.accepts('Д, B, К, А',m.steps[0]));ok(f.M.accepts('С L',m.steps[1]));
  equal(plain(p.steps.map(q=>q.answer)),yesNo);equal(p.answer,3);
  for(const id of ids){f.route('#lesson/'+id);const l=f.C.byId[id];equal(l.source.page,23);equal(l.source.point,4);ok(f.$('#task-panel svg'));equal(f.snapshot().scene.attempt,0);}
  const cases=[['PN',2,'XZ',2],['PN',1,'XZ',2],['MK',0,'XZ',0],['MK',2,'XZ',2],['PN',1,'MK',1],['PN',1,'KM',1]];
  const inside=(p,a,b,k)=>{const dot=(p[0]-a[0])*(b[0]-a[0])+(p[1]-a[1])*(b[1]-a[1]),len=(b[0]-a[0])**2+(b[1]-a[1])**2;return k===2||dot>=-1e-6&&(k!==0||dot<=len+1e-6);};
  for(let seed=0;seed<80;seed++){
    const membership=f.M.generate(ids[0],seed),intersection=f.M.generate(ids[1],seed),d=membership.data.linePoints,t=intersection.data.encounters;
    for(const [which,n] of d.names.entries()){const [x,y]=d.points[n],line=Math.abs(y-(d.y0+d.slope*x/10))<1e-8;equal(N.explore(f.C.byId[ids[0]],{which,extend:1},membership).answer,Number(line));equal(line,membership.steps[0].answer.includes(n));}
    // Independent expected intersections of the three supporting lines, translated by the generated offsets.
    const dx=Math.min(t.M[0],t.K[0]),dy=t.M[1];let count=0;
    for(const [item,[a,k,b,normalKind]] of cases.entries()){
      const location=(item<2?[4,4]:item<4?[2,0]:[10,0]).map((v,i)=>v+(i?dy:dx));
      for(const reverse of [0,1])for(let mode=0;mode<=3;mode++){
        const bn=reverse?b[1]+b[0]:b,kind=mode?mode-1:normalKind;
        const hit=inside(location,t[a[0]],t[a[1]],k)&&inside(location,t[bn[0]],t[bn[1]],kind);
        equal(N.explore(f.C.byId[ids[1]],{item,reverse,mode},intersection).answer,Number(hit));
        if(!reverse&&!mode){equal(intersection.steps[item].answer,hit?'да':'нет');count+=Number(hit);}
      }
    }equal(intersection.answer,count);
  }
  f.route('#lesson/'+ids[0]);f.submit('AKB');ok(f.snapshot().scene.message.includes('штрих'));f.submit('D,B,K,A');ok(f.snapshot().scene.correct);f.click('[data-cmd=next]');f.submit('LC');ok(f.snapshot().scene.correct);f.click('[data-cmd=next]');f.submit('4');ok(f.snapshot().scene.correct);
  f.route('#lesson/'+ids[1]);f.submit('да');f.click('[data-cmd=next]');f.submit('да');ok(f.snapshot().scene.message.includes('позади'));f.submit('Нет');ok(f.snapshot().scene.correct);equal(plain(f.snapshot().scene.hintLevels),{});const id='v5f-printed-1-94',ang=f.M.generate(id,0),angle=f.C.byId[id];equal(angle.source.page,23);equal(plain(ang.steps.map(q=>q.answer)),['COD COM DOM',3,6]);equal(ang.answer,1);
  ok(f.M.accepts('∠МОС; ∠MOD; ∠DOC',ang.steps[0]));ok(!f.M.accepts('CDO DOM COM',ang.steps[0]));
  for(let seed=0;seed<50;seed++){const task=f.M.generate(id,seed);
    task.data.angleSets.forEach((drawing,picture)=>{const names=drawing.rays.map(x=>x[0]);equal(new Set(names.concat(drawing.vertex)).size,names.length+1);
      for(let pair=0;pair<6;pair++)for(let ask=0;ask<2;ask++){const model=N.explore(angle,{picture,pair,ask},task);equal(model.answer,ask?names.length*(names.length-1)/2:names.length);ok(model.controls[1].values.some(row=>row[0]===pair));ok(model.visual.includes('Выбраны лучи'));}});
    equal(task.steps[1].answer,task.data.angleSets[0].rays.length*(task.data.angleSets[0].rays.length-1)/2);
  }
  f.route('#lesson/'+id);f.submit('CO');equal(f.snapshot().scene.attempt,0);f.submit('COD DOM');ok(f.snapshot().scene.message.includes('противоположных'));f.submit('MOD DOC MOC');ok(f.snapshot().scene.correct);
  f.click('[data-cmd=next]');f.submit('3');f.click('[data-cmd=next]');f.submit('4');ok(f.snapshot().scene.message.includes('противоположных'));f.submit('6');f.click('[data-cmd=next]');f.submit('1');ok(f.snapshot().scene.correct);equal(plain(f.snapshot().scene.hintLevels),{});f.close();
}

function printedPointThreeChecksRegression(){
  const ids=['v5f-printed-check-3-1','v5f-printed-check-3-2'],f=boot(),path=f.C.pathById.vilenkin5,N=f.w.Vilenkin5Numbered;
  equal(plain(path.printedChecks.filter(id=>f.C.byId[id].source.part===1&&f.C.byId[id].source.point===3)),ids);for(const id of ids){ok(!path.numbered.includes(id));ok(!path.ids.includes(id));equal(f.C.byId[id].source.page,22);equal(f.C.byId[id].source.point,3);ok(f.$('a[href="#lesson/'+id+'"]'));}
  const a=f.M.generate(ids[0],0),b=f.M.generate(ids[1],0);
  equal(plain(a.steps.map(x=>x.answer)),[500,79,42,13,'8 км 563 м','30 км 600 м','34 м','20 м',6]);equal(a.answer,12);
  for(const [val,part] of [['34 м',6],['3400см',6],['0,034 км',6],['2 0',-1],['200 дм',7],['20000мм',7]])if(part>=0)ok(f.M.accepts(val,a.steps[part]));
  for(const val of ['34','34 кг','340 см','3,4 м','0,0000003 км'])ok(!f.M.accepts(val,a.steps[6]));
  equal(plain(b.data.quadCheck.sides),[24,20,15,7]);equal(b.data.quadCheck.sum,66);ok(f.M.equal('6,6',b.answer));equal(plain(b.steps.map(x=>x.answer)),['незамкнутая','четырёхугольник','ABCD','AB BC CD DA',24,{n:12,d:5},66]);
  ok(f.M.accepts('Открытая ломаная',b.steps[0]));ok(!f.M.accepts('замкнутая',b.steps[0]));ok(f.M.accepts('Четырехугольник',b.steps[1]));ok(!f.M.accepts('трапеция',b.steps[1]));ok(f.M.accepts('AD DC CB BA',b.steps[3]));
  for(let seed=0;seed<50;seed++){
    const u=f.M.generate(ids[0],seed),p=f.M.generate(ids[1],seed),d=u.data.unitFence;equal(u.answer,(d.posts-1)*d.gap);
    for(let posts=1;posts<=12;posts++)for(let gap=1;gap<=6;gap++)for(let what=0;what<2;what++)equal(N.explore(f.C.byId[ids[0]],{posts,gap,what},u).answer,what?(posts-1)*gap:posts-1);
    ok(N.explore(f.C.byId[ids[1]],{paper:0,edge:0,ask:0},p).visual.includes('Прямой угол при A'));
    const shape=p.data.quadCheck;shape.coords.forEach(([x,y],i)=>{const [u,v]=shape.coords[(i+1)%4];equal(shape.sides[i],Math.hypot(x-u,y-v));});
    ok(f.M.equal(String(shape.sides.reduce((sum,e)=>sum+e,0)/10),p.answer));
    const measured=[31,22,17,19];for(let edge=0;edge<4;edge++)for(let ask=0;ask<4;ask++)for(const paper of [0,1]){const state={edge,ask,paper,length0:31,length1:22,length2:17,length3:19},data=paper?measured:shape.sides;ok(f.M.equal(String((ask<2?data[edge]:data.reduce((x,y)=>x+y,0))/(ask%2?10:1)),N.explore(f.C.byId[ids[1]],state,p).answer));}
    equal(N.explore(f.C.byId[ids[1]],{paper:1,ask:2,edge:0,length0:0,length1:20,length2:10,length3:0},p).answer,2);
  }
  f.route('#lesson/'+ids[0]);for(const [i,q] of a.steps.entries()){f.submit(i===6?'0,034 км':i===7?'2000 см':value(f.M,q));ok(f.snapshot().scene.correct);f.click('[data-cmd=next]');}f.submit('14');ok(f.snapshot().scene.message.includes('столбы'));f.submit('12');ok(f.snapshot().scene.correct);equal(plain(f.snapshot().scene.hintLevels),{});
  f.route('#lesson/'+ids[1]);f.submit('замкнутая');ok(f.snapshot().scene.message.includes('ABCDA'));for(const q of b.steps){f.submit(value(f.M,q));ok(f.snapshot().scene.correct);f.click('[data-cmd=next]');}f.submit('6,6');ok(f.snapshot().scene.correct);equal(plain(f.snapshot().scene.hintLevels),{});f.close();
}

function mountainsAndTravelRegression(){
  const f=boot(),N=f.w.Vilenkin5Numbered,ids=[88,89,90,91].map(n=>'v5f-printed-1-'+n),src=ids.map(id=>f.M.generate(id,0));equal(plain(src[0].steps.map(x=>x.answer)),[4137,1189,5100,350]);equal(plain(src[0].answer),[5100,350]);
  equal(plain(src[1].steps.map(x=>x.answer)),[1200,4]);equal(src[1].answer,4);equal(plain(src[2].steps.map(x=>x.answer)),[195,36]);equal(src[2].answer,231);equal(plain(src[3].steps.map(x=>x.answer)),[559,875,122,9150,285,459,66,804]);equal(plain(src[3].answer),[875,9150,459,804]);
  for(const id of ids){f.route('#lesson/'+id);equal(f.snapshot().scene.attempt,0);equal(f.C.byId[id].source.page,21);equal(f.C.byId[id].source.point,3);ok(f.C.byId[id].requires.concat(f.C.byId[id].related).every(key=>f.C.byId[key]));}
  for(let seed=0;seed<50;seed++){
    const tasks=ids.map(id=>f.M.generate(id,seed)),[mountain,horse,trip,arith]=tasks.map(t=>t.data);
    tasks.forEach((t,i)=>{if(seed)ok(t.conditionKey!==src[i].conditionKey);});
    const heights=mountain.summits.levels;ok(heights[0]>heights[1]&&heights[1]>heights[2]&&heights[3]>heights[0]);equal(plain(tasks[0].answer),[heights[3],heights[3]-heights[0]]);for(let a=0;a<4;a++)for(let b=0;b<4;b++)equal(N.explore(f.C.byId[ids[0]],{from:a,to:b},tasks[0]).answer,Math.abs(heights[a]-heights[b]));
    const h=horse.horse;equal(h.slow*h.minutes,h.fast*tasks[1].answer);for(let gait=0;gait<2;gait++)for(let minutes=0;minutes<=18;minutes++)for(let measure=0;measure<2;measure++){const dist=(gait?h.fast:h.slow)*minutes;equal(N.explore(f.C.byId[ids[1]],{gait,minutes,measure},tasks[1]).answer,measure?Math.abs(h.distance-dist):dist);}
    const t=trip.trip;equal(tasks[2].answer,t.speed[0]*t.hours[0]+t.speed[1]*t.hours[1]);for(let hoursRoad=0;hoursRoad<=6;hoursRoad++)for(let hoursDirt=0;hoursDirt<=6;hoursDirt++)equal(N.explore(f.C.byId[ids[2]],{hoursRoad,hoursDirt},tasks[2]).answer,hoursRoad*t.speed[0]+hoursDirt*t.speed[1]);
    for(const [row,w] of arith.operations.entries())for(const [stage,formula] of [w.operation,w.finish].entries()){const m=/^(\d+)([+·:])(\d+)$/.exec(formula.replaceAll(' ',''));ok(m);const x=+m[1],y=+m[3],expected=m[2]===':'?x/y:m[2]==='+'?x+y:x*y;equal(N.explore(f.C.byId[ids[3]],{row,stage},tasks[3]).answer,expected);}
  }
  f.route('#lesson/'+ids[0]);f.submit('5363');ok(f.snapshot().scene.message.includes('выше'));f.submit('4137');ok(f.snapshot().scene.correct);equal(plain(f.snapshot().scene.hintLevels),{});
  for(const [i,id] of ids.entries()){f.route('#lesson/'+id);for(const target of src[i].steps){f.submit(value(f.M,target));ok(f.snapshot().scene.correct);f.click('[data-cmd=next]');}f.submit(value(f.M,src[i]));ok(f.snapshot().scene.correct);}equal(f.errors,[]);f.close();
}

function perimeterAndMassRegression(){
  const f=boot(),N=f.w.Vilenkin5Numbered,B=f.w.Vilenkin5PrintedBuildablePaths,ids=[84,85,86,87].map(n=>'v5f-printed-1-'+n),src=ids.map(id=>f.M.generate(id,0));
  equal(src[0].data.fig.names,'MNPKS');equal(plain(src[0].data.fig.edges.map(e=>e.length)),[26,26,25,36,31]);equal(src[0].answer,144);
  equal(plain(src[1].steps.map(s=>s.answer)),[68,55,40,163]);equal(src[1].answer,'16 см 3 мм');ok(f.M.accepts('16см3мм',src[1]));
  equal(plain(src[2].steps.map(s=>s.answer)),[165,440,4]);equal(src[2].answer,110);equal(plain(src[3].steps.map(s=>s.answer)),[1000,720]);equal(src[3].answer,280);
  for(const id of ids){f.route('#lesson/'+id);equal(f.snapshot().scene.id,id);equal(f.snapshot().scene.attempt,0);equal(f.C.byId[id].source.point,3);equal(f.C.byId[id].source.page,21);ok(f.C.byId[id].requires.concat(f.C.byId[id].related).every(key=>f.C.byId[key]));}
  for(let cfg=0;cfg<3125;cfg++){const p=f.M.generate(ids[0],100000+cfg),fig=p.data.fig;equal(fig.coords.length,5);equal(p.answer,fig.edges.reduce((sum,e)=>sum+e.length,0));
    const turns=fig.coords.map(([x,y],i)=>{const [xx,yy]=fig.coords[(i+1)%5],[u,v]=fig.coords[(i+2)%5];return Math.sign((xx-x)*(v-yy)-(yy-y)*(u-xx));});ok(turns.every(s=>s!==0&&s===turns[0]));
    const model=f.w.Vilenkin5QualityModels.defaults(f.C.byId[ids[0]]);equal(B.selection(p,model),100000+cfg);
  }
  for(let seed=0;seed<50;seed++){
    const tri=f.M.generate(ids[1],seed),top=f.M.generate(ids[2],seed),flour=f.M.generate(ids[3],seed),tr=tri.data.triangle,shape=top.data.tabletop,m=flour.data.flour;
    ok(tr.km+tr.ml>tr.lk&&tr.km+tr.lk>tr.ml&&tr.ml+tr.lk>tr.km);equal(tri.steps[3].answer,tr.km+tr.ml+tr.lk);
    for(let gap=0;gap<=20;gap++)for(let side=0;side<4;side++){const mid=tr.km-(gap||tr.diff);equal(N.explore(f.C.byId[ids[1]],{gap,side},tri).answer,[tr.km,mid,tr.lk,tr.km+mid+tr.lk][side]);}
    equal(4*top.answer,2*(shape.width+shape.length));for(const width of [0,1,35,70])for(let mult=0;mult<4;mult++)for(let measure=0;measure<3;measure++){const w=width||shape.width,k=mult?[1,3,5][mult-1]:shape.ratio,p=2*(w+k*w);equal(N.explore(f.C.byId[ids[2]],{width,mult,measure},top).answer,[w*k,p,p/4][measure]);}
    equal(flour.answer,m.total-m.portions*m.portion);for(let portions=0;portions<=3;portions++)for(let rest=0;rest<2;rest++){const used=Math.min(portions,Math.floor(m.total/m.portion))*m.portion;equal(N.explore(f.C.byId[ids[3]],{portions,rest},flour).answer,rest?m.total-used:used);}
  }
  f.route('#lesson/'+ids[0]);f.submit('MN NP PK KS');ok(f.snapshot().scene.message.includes('замыкают'));f.submit('MS SK KP PN NM');ok(f.snapshot().scene.correct);equal(plain(f.snapshot().scene.hintLevels),{});
  for(const [i,id] of ids.slice(1).entries()){f.route('#lesson/'+id);for(const target of src[i+1].steps){f.submit(value(f.M,target));ok(f.snapshot().scene.correct);f.click('[data-cmd=next]');}f.submit(value(f.M,src[i+1]));ok(f.snapshot().scene.correct);}
  equal(f.errors,[]);f.close();
}

function comparisonsAndMixedMeasuresRegression(){
  const f=boot(),N=f.w.Vilenkin5Numbered,ids=[81,82,83].map(n=>'v5f-printed-1-'+n),src=ids.map(id=>f.M.generate(id,0));
  equal(plain(src[0].steps.map(s=>s.answer)),['AP AS AB PS PB SB','<','<','<']);ok(f.M.accepts('<;<;<',src[0]));ok(!f.M.accepts('<;>;=',src[0]));equal(plain(src[1].answer),[1000,10000,100000]);equal(src[2].steps.length,13);
  const expect=['22000','1500','4090','2 км 950 м','5 км 21 м','83','179','1005','6','78','4 см 8 мм','17 см 2 мм','50 см 8 мм'];
  equal(plain(src[2].steps.map(s=>String(s.answer))),expect);ok(f.M.accepts('4см8мм; 17 см 2 мм; 50см8мм',src[2]));ok(!f.M.accepts('48 мм;172 мм;508 мм',src[2]));
  for(const id of ids){f.route('#lesson/'+id);equal(f.snapshot().scene.id,id);equal(f.C.byId[id].source.page,21);ok(f.C.byId[id].requires.concat(f.C.byId[id].related).every(key=>f.C.byId[key]));}
  const factors={км:1000000,м:1000,дм:100,см:10,мм:1};
  for(let seed=0;seed<40;seed++){
    const order=f.M.generate(ids[0],seed),scale=f.M.generate(ids[1],seed),mixed=f.M.generate(ids[2],seed);
    for(let row=0;row<3;row++)for(let mirror=0;mirror<2;mirror++)for(let reverse=0;reverse<2;reverse++)for(let ps=1;ps<=6;ps++){
      const model=N.explore(f.C.byId[ids[0]],{row,mirror,reverse,ap:6,sb:2,ps},order),pair=order.data.lineOrder.comparisons[row],len={AP:6,AB:8+ps,SB:2,PB:2+ps,PS:ps};const small=len[pair[0]]<len[pair[1]];equal(model.answer,small!==Boolean(reverse)?'<':'>');
    }
    for(let unit=0;unit<3;unit++)for(let how=0;how<10;how++)equal(N.explore(f.C.byId[ids[1]],{unit,how},scale).answer,(how||scale.data.kilometres)*1000*10**unit);
    const rows=mixed.data.conversionRows;equal(rows.length,13);
    for(const [row,v] of rows.entries()){
      const mm=v.parts.reduce((sum,[n,u])=>sum+n*factors[u],0),whole=Math.floor(mm/factors[v.big]),left=(mm-whole*factors[v.big])/(v.small?factors[v.small]:1);
      equal(N.explore(f.C.byId[ids[2]],{row,stage:0},mixed).answer,whole);equal(N.explore(f.C.byId[ids[2]],{row,stage:1},mixed).answer,left);ok(f.M.accepts(v.converted,mixed.steps[row]));if(v.small)ok(left*factors[v.small]<factors[v.big]);
    }
  }
  f.route('#lesson/'+ids[0]);f.submit('AP PS SB');ok(f.snapshot().scene.message.includes('несоседние'));f.submit('BS BP BA SP SA PA');ok(f.snapshot().scene.correct);f.click('[data-cmd=next]');f.submit('>');ok(f.snapshot().scene.message.includes('подсвети')||f.snapshot().scene.message.includes('Подсвети'));f.submit('<');ok(f.snapshot().scene.correct);equal(plain(f.snapshot().scene.hintLevels),{});f.close();
}

function sixMeasurementsRegression(){
  const id='v5f-printed-1-80',f=boot('#lesson/'+id),l=f.C.byId[id],B=f.w.Vilenkin5PrintedBuildablePaths,N=f.w.Vilenkin5Numbered;
  const t=f.M.generate(id,0);equal(l.source.page,21);equal(l.source.point,3);equal(t.data.fig.names,'PRMKSTA');equal(t.data.fig.closed,false);equal(plain(t.answer),[20,22,25,16,13,16]);equal(plain(t.data.fig.edges.map(e=>e.name)),['PR','RM','MK','KS','ST','TA']);
  ok(f.M.accepts('AT TS SK KM MR RP',t.steps[0]));ok(!f.M.accepts('AT TS SK KM MR RP AP',t.steps[0]));
  f.submit('PR RM MK KS ST TA AP');ok(f.snapshot().scene.message.includes('замкнул'));f.submit('PR RM MK KS ST TA');ok(f.snapshot().scene.correct);equal(plain(f.snapshot().scene.hintLevels),{});
  const selected=f.w.Vilenkin5QualityModels.defaults(l);selected.p1=2;const own=B.selection(t,selected),changed=f.M.generate(id,own);equal(own,100005);ok(changed.answer[0]!==t.answer[0]);ok(changed.answer[1]!==t.answer[1]);equal(plain(changed.answer.slice(2)),plain(t.answer.slice(2)));
  for(let seed=0;seed<=70;seed++){
    const next=f.M.generate(id,seed),d=next.data;equal(d.fig.edges.length,6);equal(new Set(d.fig.coords.map(([x,y])=>x+','+y)).size,7);
    for(let e=0;e<6;e++){const a=d.fig.coords[e],b=d.fig.coords[e+1],x=Math.round(Math.hypot(a[0]-b[0],a[1]-b[1]));equal(next.answer[e],x);equal(next.steps[e+1].answer,x);
      const changedModel={...f.w.Vilenkin5QualityModels.defaults(l),edge:e};equal(N.explore(l,changedModel,next).answer,x);}
    for(let i=0;i<7;i++){const s={...f.w.Vilenkin5QualityModels.defaults(l),['p'+i]:1+(d.codes[i]+1)%5};const built=f.M.generate(id,B.selection(next,s));equal(built.data.codes[i],(d.codes[i]+1)%5);ok(built.conditionKey!==next.conditionKey);}
  }
  const g=boot('#lesson/'+id);g.input('[data-v5-param=vertex]','1').dispatchEvent(new g.w.Event('change',{bubbles:true}));g.input('[data-v5-param=p1]','2').dispatchEvent(new g.w.Event('change',{bubbles:true}));g.click('[data-v5-apply-drawing]');equal(g.snapshot().scene.seed,100005);equal(g.snapshot().scene.attempt,0);
  g.submit('PR RM MK KS ST TA');g.click('[data-cmd=next]');g.input('#answer','1');const restored=boot('#lesson/'+id,g.saved());equal(restored.snapshot().scene.seed,100005);equal(restored.snapshot().scene.step,1);equal(restored.$('#answer').value,'1');
  equal(restored.errors,[]);restored.close();g.close();f.close();
}

function pageTwentyOneFirstRegression(){
  const f=boot(),N=f.w.Vilenkin5Numbered,ids=['v5f-printed-1-77','v5f-printed-1-78','v5f-printed-1-79'],base=ids.map(id=>f.M.generate(id,0));
  equal(plain(base[0].steps.map(x=>x.answer)),[225,100]);equal(base[0].answer,325);
  equal(plain(base[1].steps.map(x=>x.answer)),[280,3,165,3]);equal(plain(base[1].answer),[3,3]);ok(f.M.accepts('3;3',base[1]));ok(!f.M.accepts('560;110',base[1]));
  equal(plain(base[2].steps.map(x=>x.answer)),[5478,10,504,11592,1090,49050,2226,2120]);equal(plain(base[2].answer),[10,11592,49050,2120]);ok(f.M.accepts('10;11 592;49 050;2 120',base[2]));
  for(const id of ids){const lesson=f.C.byId[id];equal(lesson.source.page,21);equal(lesson.source.point,3);ok(lesson.requires.concat(lesson.related).every(key=>f.C.byId[key]));f.route('#lesson/'+id);equal(f.snapshot().scene.id,id);equal(f.snapshot().scene.attempt,0);}
  for(let seed=0;seed<50;seed++)for(const [i,id] of ids.entries()){
    const lesson=f.C.byId[id],t=f.M.generate(id,seed),d=t.data;if(seed)ok(t.conditionKey!==base[i].conditionKey);
    if(i===0){
      const {hours,speed}=d.trip;equal(t.answer,hours[0]*speed[0]+hours[1]*speed[1]);
      for(let h=0;h<=6;h++)for(let q=0;q<=6;q++)equal(N.explore(lesson,{hoursRoad:h,hoursDirt:q},t).answer,h*speed[0]+q*speed[1]);
    }else if(i===1){
      const {slow,fast,ratio,difference}=d.flights;for(let pair=0;pair<2;pair++){equal(fast[pair]/slow[pair],ratio[pair]);equal(fast[pair]-slow[pair],difference[pair]);for(let pieces=0;pieces<=6;pieces++)equal(N.explore(lesson,{pair,pieces},t).answer,Math.abs(fast[pair]-pieces*slow[pair]));}
    }else{
      const op=(x,sign,y)=>sign==='−'?x-y:x*y;
      for(const [row,v] of d.operations.entries()){
        for(const [stage,formula] of [v.operation,v.finish].entries()){const m=/^(\d+) ([−·]) (\d+)$/.exec(formula);ok(m);equal(N.explore(lesson,{row,stage},t).answer,op(+m[1],m[2],+m[3]));}
      }
    }
  }
  f.route('#lesson/'+ids[0]);f.submit('78');ok(f.snapshot().scene.message.includes('Часы'));f.submit('225');ok(f.snapshot().scene.correct);equal(plain(f.snapshot().scene.hintLevels),{});f.close();
}

function numberingAndPathsRegression(){
  const f=boot(),N=f.w.Vilenkin5Numbered,ids=Array.from({length:4},(_,i)=>'v5f-printed-1-'+(73+i)),source=ids.map(id=>f.M.generate(id,0));
  equal(plain(source[0].steps.map(s=>s.answer)),[[40,44],[40,44,45,50,54,55],[44,49,94,99]]);ok(f.M.accepts('44;40',source[0].steps[0]));ok(!f.M.accepts('40',source[0].steps[0]));
  equal(plain(source[1].answer),[6,642,246]);equal(plain(source[2].steps.map(s=>s.answer)),[207,1350,1385]);equal(source[2].answer,1385000000);ok(f.M.accepts('1 385 000 000',source[2]));ok(!f.M.accepts('1385',source[2]));equal(plain(source[3].steps.map(s=>s.answer)),[12,4]);equal(source[3].answer,4);
  for(let seed=0;seed<60;seed++)for(let i=0;i<4;i++){
    const id=ids[i],l=f.C.byId[id],t=f.M.generate(id,seed),d=t.data;
    equal(l.source.point,3);equal(l.source.page,20);if(seed)ok(t.conditionKey!==source[i].conditionKey);
    if(i===0){d.groups.forEach((alphabet,group)=>{const enumeration=Array.from({length:90},(_,k)=>k+10).filter(n=>[...String(n)].every(v=>alphabet.includes(Number(v))));equal(plain(d.numbers[group]),enumeration);for(let first=0;first<10;first++)equal(N.explore(l,{group,tensDigit:first},t).answer,enumeration.filter(n=>Math.floor(n/10)===first).length);});}
    if(i===1){const bank=Array.from({length:900},(_,k)=>k+100).filter(n=>new Set(String(n)).size===3&&[...String(n)].every(v=>d.digits.includes(Number(v))));equal(plain(d.numbers),bank);equal(plain(t.answer),[6,bank.at(-1),bank[0]]);
      for(let h=0;h<3;h++)for(let q=0;q<3;q++)equal(N.explore(l,{hundreds:h,tens:q},t).answer,h===q?0:1);}
    if(i===2){for(let a=0;a<3;a++)for(let b=0;b<3;b++)for(let unit=0;unit<2;unit++)equal(N.explore(l,{from:a,to:b,unit},t).answer,Math.abs(d.distances[a]-d.distances[b])*(unit?1e6:1));equal(t.answer,(d.distances[2]-d.distances[1])*1e6);}
    if(i===3){const c=d.cycling;equal(c.way/c.hours,c.speed);equal(c.second/c.speed,t.answer);for(let hours=0;hours<=8;hours++)for(let what=0;what<2;what++)equal(N.explore(l,{hours,what},t).answer,what?Math.abs(hours*c.speed-c.second):hours*c.speed);}
  }
  for(const id of ids){f.route('#lesson/'+id);const state=f.snapshot();equal(state.scene.id,id);equal(state.scene.model.first,'');equal(state.scene.attempt,0);}
  f.route('#lesson/'+ids[2]);for(const answer of ['207','1350','1385']){f.submit(answer);ok(f.snapshot().scene.correct);f.click('[data-cmd=next]');}
  f.submit('1385');ok(f.snapshot().scene.message.includes('миллион'));f.submit('1 385 000 000');ok(f.snapshot().scene.correct);equal(plain(f.snapshot().scene.hintLevels),{});f.close();
}

function everydayReasoningRegression(){
  const id='v5f-printed-1-72',f=boot('#lesson/'+id),l=f.C.byId[id],N=f.w.Vilenkin5Numbered;
  equal(l.source.page,20);equal(l.source.point,3);equal(plain(f.M.generate(id,0).answer),[230,240]);equal(plain(f.M.generate(id,0).steps.map(x=>x.answer)),[135,170,230,480,240]);
  ok(f.$('.v5q-notes textarea'));ok(!f.$('.v5q-notes textarea').closest('details'));ok(f.$('.v5q-notes p').textContent.includes('любые подходящие'));
  f.input('#v5-quality-note','В магазине сравню цену за килограмм. На площадке сравню время двух забегов.');
  equal(f.snapshot().scene.firstAttempt,null);equal(f.snapshot().scene.attempt,0);ok(!f.snapshot().scene.correct);
  const again=boot('#lesson/'+id,f.saved());equal(again.$('#v5-quality-note').value,f.$('#v5-quality-note').value);again.close();
  f.submit('48');ok(f.snapshot().scene.message.includes('количест')||f.snapshot().scene.message.includes('Количест'));f.submit('135');ok(f.snapshot().scene.correct);equal(plain(f.snapshot().scene.hintLevels),{});
  for(let seed=0;seed<45;seed++){const t=f.M.generate(id,seed),d=t.data.everyday;
    if(seed)ok(t.conditionKey!==f.M.generate(id,0).conditionKey);
    for(let c=0;c<2;c++)for(let n=0;n<=5;n++)for(let w=0;w<2;w++){
      const m=N.explore(l,{context:c,count:n,question:w},t),total=c?d.lap*n:d.price*n+d.small,expected=w?(c?d.goal:d.cash)-total:total;
      equal(m.answer,expected);ok(expected>=0);ok(m.visual.includes(c?'Цель':'кассе'));
    }
  }
  f.close();
}

function originalChainsRegression(){
  const f=boot(),id='v5f-printed-1-71',l=f.C.byId[id],src=f.M.generate(id,0),N=f.w.Vilenkin5Numbered;
  equal(plain(src.answer),[50,28,30,100]);equal(plain(src.steps.map(s=>s.answer)),[7,30,5,35,50,8,20,100,10,28,6,54,60,6,30,6,48,50,10,100]);
  for(let seed=0;seed<60;seed++){
    const t=f.M.generate(id,seed);equal(l.source.page,20);equal(t.steps.length,20);if(seed)ok(t.conditionKey!==src.conditionKey);
    t.data.chains.forEach((chain,row)=>{let value=chain.start;chain.route.forEach((m,arrow)=>{
      const model=N.explore(l,{row,arrow},t);equal(m.before,value);value=m.op==='+'?value+m.n:m.op===':'?value/m.n:value*m.n;
      equal(m.after,value);ok(Number.isSafeInteger(value)&&value>0);equal(model.answer,value);equal(t.steps[5*row+arrow].answer,value);
    });equal(chain.result,value);});
  }
  f.route('#lesson/'+id);f.submit('567');ok(!f.snapshot().scene.correct);ok(f.snapshot().scene.message.includes('Раздели'));
  f.submit('7');ok(f.snapshot().scene.correct);equal(plain(f.snapshot().scene.hintLevels),{});f.click('[data-cmd=next]');f.input('#answer','3');
  const restored=boot('#lesson/'+id,f.saved());equal(restored.snapshot().scene.step,1);equal(restored.snapshot().scene.savedInput,'3');restored.close();f.close();
}

function pageTwentyReviewRegression(){
  const f=boot(),ids=Array.from({length:4},(_,i)=>'v5f-printed-1-'+(67+i)),N=f.w.Vilenkin5Numbered;
  const src=ids.map(id=>f.M.generate(id,0));
  equal(plain(src[0].data.values),[241,802,50024,490220,700243,9999999]);
  equal(plain(src[1].steps.map(s=>s.answer)),[22003008,28015302,507080000,1010009000,423340600980,52000008012,777000608000]);
  equal(plain(src[2].steps.map(s=>s.answer)),[16,22,35,21,43,8,8,6,8,32,42,36,64,45,54,8,8,8,9,5]);
  equal(plain(src[3].steps.map(s=>s.answer)),[147,942,384]);
  ok(f.M.accepts('пятьдесят тысяч двадцать четыре',src[0].steps[2]));
  ok(f.M.accepts('семьсот тысяч двести сорок три',src[0].steps[4]));
  ok(!f.M.accepts('двести сорок три',src[0].steps[4]));
  ok(f.M.accepts('22 003 008',src[1].steps[0]));ok(!f.M.accepts('2238',src[1].steps[0]));
  for(let seed=0;seed<35;seed++){
    for(const [i,id]of ids.entries()){
      const l=f.C.byId[id],t=f.M.generate(id,seed),d=t.data;
      equal(l.point,3);equal(l.source.page,20);ok(l.requires.every(k=>f.C.byId[k]));
      equal(t.steps.length,[6,7,20,3][i]);if(seed)ok(t.conditionKey!==src[i].conditionKey);
      if(i<2){for(const [j,n]of d.values.entries()){const place=j%9;equal(N.explore(l,{row:j,place},t).answer,Math.floor(n/(10**place))%10*(10**place));}continue;}
      if(i===2){for(const [j,r]of d.operations.entries()){
        const res=[r.a+r.b,r.a-r.b,r.a*r.b,r.a/r.b][r.g],m=N.explore(l,{row:j},t);
        equal(t.steps[j].answer,res);equal(m.answer,res);equal((m.visual.match(/<circle /g)||[]).length,[r.a+r.b,r.a,r.a*r.b,r.a][r.g]);}continue;}
      for(const [j,[a,b]]of d.pairs.entries()){
        const x=Math.ceil(a/10)*10,y=Math.ceil(b/10)*10;
        equal(t.steps[j].answer,a+b);equal(N.explore(l,{row:j,method:0},t).answer,(x-a)+(y-b));
        equal(N.explore(l,{row:j,method:1},t).answer,b-(x-a));equal(x+(b-(x-a)),a+b);
      }
    }
  }
  f.route('#lesson/'+ids[3]);f.submit('150');ok(!f.snapshot().scene.correct);
  ok(f.snapshot().scene.message.includes('округлённых'));f.submit('147');ok(f.snapshot().scene.correct);equal(plain(f.snapshot().scene.hintLevels),{});
  f.click('[data-cmd=next]');f.submit('942');f.click('[data-cmd=next]');const again=boot('#lesson/'+ids[3],f.saved());equal(again.snapshot().scene.step,2);
  again.close();f.close();
}

function pageNineteenBoundariesRegression(){
  const f=boot(),ids=Array.from({length:7},(_,i)=>'v5f-printed-1-'+(60+i)),src=ids.map(id=>f.M.generate(id,0)),[build,diags]=src;
  equal(plain(src.slice(2).map(t=>t.answer)),[150,280,63,16,[82,5]]);
  ok(f.M.accepts('SO HQ',build.steps[0]));ok(!f.M.accepts('SH QO',build.steps[0]));
  ok(f.M.accepts('OS QH BQ SB HO',build));ok(f.M.accepts('AB BM MN NA AM BN AO OM BO ON',diags));ok(!f.M.accepts('AB BM MN NA AM BN',diags));
  for(let seed=0;seed<80;seed++)for(const [i,id]of ids.entries()){
    const t=f.M.generate(id,seed),d=t.data,l=f.C.byId[id];equal(l.point,3);equal(l.source.page,19);
    if(i<2){if(i===0){const [s,b,q,h,o]=d.names,point=Object.fromEntries([...d.names].map((p,j)=>[p,d.coords[j]])),side=(x,y,z)=>(y[0]-x[0])*(z[1]-x[1])-(y[1]-x[1])*(z[0]-x[0]);const crosses=(a,b,c,e)=>side(point[a],point[b],point[c])*side(point[a],point[b],point[e])<0&&side(point[c],point[e],point[a])*side(point[c],point[e],point[b])<0;
        ok(crosses(s,h,q,o));ok(!crosses(s,o,q,h));for(const j of [0,1,2,3])equal(f.w.Vilenkin5Numbered.explore(l,{choice:j},t).answer,j===1?1:0);
      }else{const [a,b,m,n,o]=d.coords;equal((a[0]+m[0])/2,o[0]);equal((b[1]+n[1])/2,o[1]);equal(f.w.Vilenkin5Numbered.explore(l,{view:1},t).answer,3);}continue;}
    const coordinates=f.w.Vilenkin5PrintedBoundaries.perimeterCoordinates(d),mm=d.values.reduce((a,b)=>a+b);
    coordinates.forEach(([x,y],j)=>{const [nx,ny]=coordinates[(j+1)%coordinates.length];ok(Math.abs(Math.hypot(x-nx,y-ny)-d.values[j])<1e-7);});
    for(let j=1;j<=coordinates.length;j++){const total=Array.from({length:j},(_,k)=>d.values[(k+1)%d.values.length]).reduce((a,b)=>a+b);equal(f.w.Vilenkin5Numbered.explore(l,{start:1,count:j},t).answer,total);}
    if(i===6)equal(t.answer[0]*10+t.answer[1],mm);else equal(t.answer,mm);
  }
  for(const [i,id]of ids.entries()){const t=src[i];f.route('#lesson/'+id);if(i===0){f.submit('SH QO');ok(f.snapshot().scene.message.includes('пересекутся'));}for(const [j,q]of t.steps.entries()){f.submit(value(f.M,q));ok(f.snapshot().scene.correct,id+' '+j);f.click('[data-cmd=next]');}f.submit(value(f.M,t));ok(f.snapshot().scene.correct);}
  equal(f.errors,[]);f.close();
}

async function run(){
  for(const check of [
    equalPartsRegression,circleChapterCheckRegression,massDividendPowerRegression,boxDivisorsAndLayersRegression,radiusEquationsRegression,circlePairHomeworkRegression,threeCompassRegression,diskMembershipRegression,sundialRegression,reverseOrderRegression,boardHoneyRegression,sandAndCubesRegression,squareSumsRegression,exactErroneousFractionsRegression,sameDataFractionalForecastRegression,cubeRowsRegression,partsOfUnitsRegression,printedRayRegression,smallChainsRegression,schoolDialsRegression,circumferenceEstimatesRegression,threadMeasurementRegression,objectExamplesRegression,cutsRegression,crossingsRegression,chordRegression,compassRegression,
    circlePointsRegression,numberedTablesRegression,scheduleAndEqualityRegression,orderAndJourneyRegression,
    weatherDiaryRegression,pointEndRegression,printedDigitsRegression,printedClassesRegression,
    printedTextNumbersRegression,printedTreeRegression,printedCalculationsRegression,printedPageFifteenRegression,
    printedSegmentRegression,compassAndCompoundRegression,printedChecksRegression,printedLengthUnitsRegression,
    buildablePathsRegression,pageNineteenBoundariesRegression,pageTwentyReviewRegression,originalChainsRegression,everydayReasoningRegression,numberingAndPathsRegression,pageTwentyOneFirstRegression,sixMeasurementsRegression,comparisonsAndMixedMeasuresRegression,perimeterAndMassRegression,exactPrintedMistakeRegression,mountainsAndTravelRegression,printedPointThreeChecksRegression,printedPlaneIntersectionRegression,printedOpenLineConstructionsRegression,printedPlaneRegionsRegression,chosenRayNamesRegression,printedOralSubtractionRegression,printedLengthPolygonRegression,printedPage25FirstRegression,printedPage25ConstructionsRegression,printedPage26FreeRegression,closingPlanePointCalculationRegression,printedPointFourAssessmentRegression,
  ]){
    check();
    await tick(); // Let closed lesson windows finish disposal before loading the next group.
  }
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
  // The final project joins a measurable cutout to a minimum purchase.
  f.route('#lesson/v5f-project-room');
  const project='#model .g5-lab-inquiry',modelInput=project+' input';
  const checkModel=()=>f.$(project).dispatchEvent(new f.w.Event('submit',{bubbles:true,cancelable:true}));
  const numberOfPacks=model=>Math.ceil(2*(model.a*model.b-model.p*model.p)/5);
  ok(f.$('#model .g5-lab-visual').hidden===false,'the plan is visible before a prediction');
  ok(f.$('#model svg').getAttribute('aria-label').includes('печь 2 на 2 м'));
  equal(numberOfPacks(f.snapshot().scene.model),28);
  f.input(modelInput,'27');checkModel();
  ok(f.$(project+' [role=status]').textContent.includes('упаковок не хватит'));
  equal(f.snapshot().scene.attempt,0,'a model prediction never counts as an exercise attempt');
  const projectCopy=boot('#lesson/v5f-project-room',f.saved());
  equal(projectCopy.$(modelInput).value,'27');
  ok(projectCopy.$(project+' [role=status]').textContent.includes('не хватит'));
  ok(!projectCopy.$(project+' [role=status]').textContent.includes('28 уп.'),'no worked result after the mistake, including a reload');
  equal(projectCopy.$(modelInput).disabled,false);projectCopy.input(modelInput,'28');
  projectCopy.$(project+' button[type=button]').click();
  ok(projectCopy.$(project+' [role=status]').textContent.includes('по твоему запросу'));
  equal(projectCopy.$(modelInput).value,'28','explicit help keeps the unsubmitted draft');
  const helpCopy=boot('#lesson/v5f-project-room',projectCopy.saved());
  ok(helpCopy.$(project+' [role=status]').textContent.includes('по твоему запросу'));
  equal(helpCopy.snapshot().scene.attempt,0);helpCopy.close();projectCopy.close();
  f.input(modelInput,'28');checkModel();
  ok(f.$(project+' [role=status]').textContent.includes('сам исправил'));
  equal(f.snapshot().scene.model.inquiryFirst,'27');equal(f.snapshot().scene.model.inquiryDraft,'28');
  const correctedCopy=boot('#lesson/v5f-project-room',f.saved());
  ok(correctedCopy.$(project+' [role=status]').textContent.includes('сам исправил'));
  equal(correctedCopy.$(modelInput).disabled,true);equal(correctedCopy.snapshot().scene.attempt,0);correctedCopy.close();
  f.input('#g5-lab-garden-2','1');
  equal(f.$(modelInput).value,'','new dimensions clear the previous prediction');
  ok(f.$('#model svg').getAttribute('aria-label').includes('печь 1 на 1 м'));
  f.input('#g5-lab-garden-2','3');
  f.input(modelInput,'29');checkModel();
  ok(f.$(project+' [role=status]').textContent.includes('под печью'));
  f.input('#g5-lab-garden-1','7');
  const exactModel=f.snapshot().scene.model;equal(numberOfPacks(exactModel),30);
  f.input(modelInput,'30');checkModel();
  ok(f.$(project+' [role=status]').textContent.includes('Прогноз подтвердился'));
  f.input('#g5-lab-garden-0','9');
  f.$(project+' button[type="button"]').click();
  ok(f.$(project+' [role=status]').textContent.includes('Объяснение открыто без прогноза'));
  equal(f.snapshot().scene.model.inquiryFirst,'');equal(f.snapshot().scene.attempt,0);
  f.route('#lesson/v5f-volume-litres');
  const tank='#model .g5-lab-inquiry',answerField=tank+' input';
  const testCapacity=value=>{f.input(answerField,value);f.$(tank).dispatchEvent(new f.w.Event('submit',{bubbles:true,cancelable:true}));};
  ok(f.$('#model .g5-lab-visual').hidden===false);
  equal(f.w.document.querySelectorAll('#model .g5-lab-visual svg').length,2,'floor area and layer height have distinct views');
  ok(f.$('#model .g5-lab-visual').textContent.includes('Дно 50 × 30 см'));
  testCapacity('30000');ok(f.$(tank+' [role=status]').textContent.includes('кубических сантиметрах у тебя уже есть'));
  equal(f.snapshot().scene.attempt,0);
  f.input('#g5-lab-volume-2','3');equal(f.$(answerField).value,'');
  testCapacity('45');ok(f.$(tank+' [role=status]').textContent.includes('высоту слоя'));
  f.input('#g5-lab-volume-2','5');f.input(answerField,'37,');
  const resumedTank=boot('#lesson/v5f-volume-litres',f.saved());
  equal(resumedTank.$(answerField).value,'37,');equal(resumedTank.snapshot().scene.model.h,5);resumedTank.close();
  testCapacity('37,5');ok(f.$(tank+' [role=status]').textContent.includes('Прогноз подтвердился'));
  f.input('#g5-lab-volume-2','1');f.input('#g5-lab-volume-0','1');f.input('#g5-lab-volume-1','1');
  testCapacity('1/2');ok(f.$(tank+' [role=status]').textContent.includes('0,5 л'));
  equal(f.snapshot().scene.firstAttempt,null,'exploration does not complete an independent task');
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
  // Confirmed replacement imports use the copy's answers and remove absent records.
  const backup=plain(f.Q.exportState()),local=f.snapshot();backup.records[local.scene.id+':'+local.scene.mode].savedInput='different copy';
  const removed=Object.keys(backup.records).find(key=>key!==backup.last);delete backup.records[removed];
  const imported=f.Q.importState(f.w.JSON.parse(JSON.stringify(backup)));equal(imported.imported,Object.keys(backup.records).length);equal(plain(f.Q.exportState()),backup);equal(f.snapshot(),local,'import does not mutate a live scene before the app changes routes');
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
  await personalContextRegression();await replacementImportRegression();
  decimalStepInstructions();
  console.log(JSON.stringify({gate:'VILENKIN5_QUALITY_PASS',checks,lessons:134,points:51,modelKinds:[...modelKinds].sort()}));
}
run().catch(error=>{console.error(error);process.exitCode=1;});

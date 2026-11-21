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
function numberedTablesRegression(){
  const f=boot(),path=f.C.pathById.vilenkin5;
  equal(path.ids.length,134);
  equal(plain(path.numbered),[1,2,3,4,5,6,7].map(n=>'v5f-printed-1-'+n));
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
async function run(){
  numberedTablesRegression();scheduleAndEqualityRegression();orderAndJourneyRegression();
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
  ok(projectCopy.$(project+' [role=status]').textContent.includes('27 уп. покрывают 67,5 м²'));
  projectCopy.close();
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

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
  f.submit('л, В, д');ok(f.snapshot().scene.correct);
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
  equal(plain(path.numbered),Array.from({length:72},(_,i)=>i+1).map(n=>'v5f-printed-1-'+n).concat('v5f-printed-5-1'));
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
  equal(plain(fl.printedChecks),ids);ok(!fl.numbered.some(id=>ids.includes(id)));equal(fl.ids.length,134);ids.forEach(id=>ok(f.$('a[href="#lesson/'+id+'"]')));
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
  circlePointsRegression();numberedTablesRegression();scheduleAndEqualityRegression();orderAndJourneyRegression();weatherDiaryRegression();pointEndRegression();printedDigitsRegression();printedClassesRegression();printedTextNumbersRegression();printedTreeRegression();printedCalculationsRegression();printedPageFifteenRegression();printedSegmentRegression();compassAndCompoundRegression();printedChecksRegression();printedLengthUnitsRegression();buildablePathsRegression();pageNineteenBoundariesRegression();pageTwentyReviewRegression();originalChainsRegression();everydayReasoningRegression();
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

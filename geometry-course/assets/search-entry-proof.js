/* Two existing lessons, one bounded entry flow. New controls are appended AFTER
 * every legacy control, including learning-support and deferred navigation.
 * The board's v1 operation format and legacy control slots remain unchanged. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root?.document&&root.MathExamSearchProof)api.mount(root,root.document,root.MathExamSearchProof);
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const TOPICS=['ch4-p1-t2-proof-angle-sum','ch2-p3-t2-proof-asa'];
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),plain=x=>x&&typeof x==='object'&&!Array.isArray(x);
 const bounded=(s,n)=>typeof s==='string'&&s.length<=n;
 function angle(a,v,b){
  const u={x:a.x-v.x,y:a.y-v.y},w={x:b.x-v.x,y:b.y-v.y};
  return Math.acos(clamp((u.x*w.x+u.y*w.y)/(Math.hypot(u.x,u.y)*Math.hypot(w.x,w.y)),-1,1))*180/Math.PI;
 }
 function triangle(a,b,rotation=0,mirror=false){
  if(!Number.isFinite(a)||!Number.isFinite(b)||a<=0||b<=0||a+b>=180)throw RangeError('Non-degenerate triangle required');
  const side=220,c=180-a-b,ac=side*Math.sin(b*Math.PI/180)/Math.sin(c*Math.PI/180),r=rotation*Math.PI/180;
  return [{x:0,y:0},{x:side,y:0},{x:ac*Math.cos(a*Math.PI/180),y:-ac*Math.sin(a*Math.PI/180)}].map(p=>{
   const x=mirror?-p.x:p.x;return{x:x*Math.cos(r)-p.y*Math.sin(r),y:x*Math.sin(r)+p.y*Math.cos(r)};
  });
 }
 function research(kind,position,height=50){
  if(kind==='angle-sum'){
   const points=[{x:55,y:210},{x:345,y:210},{x:65+2.7*clamp(position,0,100),y:185-1.45*clamp(height,0,100)}];
   const angles=points.map((p,i)=>angle(points[(i+1)%3],p,points[(i+2)%3]));return{points,angles,sum:angles.reduce((s,n)=>s+n,0)};
  }
  const base=triangle(48,67).map(p=>({x:p.x*.65,y:p.y*.65})),target={x:base[2].x+105,y:base[2].y+220},A={x:105,y:220},B={x:248,y:220};
  const t=clamp(position,40,160)/100,C={x:A.x+(target.x-A.x)*t,y:A.y+(target.y-A.y)*t};
  return{points:[A,B,C],target,angles:[angle(B,A,C),angle(A,B,C),angle(A,C,B)],matched:Math.abs(t-1)<1e-9};
 }
 function check(kind,answer,reason){
  const raw=String(answer).trim(),text=kind==='angle-sum'?raw.replace(/\s*°$/,'').replace(',','.'):raw;
  const numeric=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)?Number(text):NaN;
  return kind==='angle-sum'?numeric===65&&reason==='angle-sum':/^[uу]$/i.test(text)&&reason==='asa';
 }
 function attempt(kind,current,answer,reason){
  const next={...current,answer:String(answer).slice(0,80),reason:String(reason).slice(0,40)};
  if(!next.answer.trim()||!next.reason)return{state:next,result:'empty'};
  if(current.solved)return{state:next,result:check(kind,next.answer,next.reason)?'repeat':'changed'};
  const ok=check(kind,next.answer,next.reason),first=current.attempts===0;
  next.attempts++;next.solved=ok;next.independent=ok&&first&&!current.assisted;
  if(!ok)next.assisted=true;
  return{state:next,result:ok?(next.independent?'independent':'assisted'):'wrong'};
 }
 function fresh(id,kind){return{version:1,topic:id,view:'research',research:{position:kind==='asa'?75:45,height:55,guess:'',checked:false},practice:{answer:'',reason:'',attempts:0,assisted:false,revealed:false,solved:false,independent:false},notes:{givens:'',reasons:'',conclusion:'',open:false},proof:null};}
 function valid(v,id,kind){
  if(!plain(v)||v.version!==1||v.topic!==id||!TOPICS.includes(id)||!['research','proof','practice'].includes(v.view)||!plain(v.research)||!plain(v.practice)||!plain(v.notes))return false;
  const r=v.research,p=v.practice,n=v.notes;
  return Number.isFinite(r.position)&&r.position>=(kind==='asa'?40:0)&&r.position<=(kind==='asa'?160:100)&&Number.isFinite(r.height)&&r.height>=0&&r.height<=100&&bounded(r.guess,1500)&&typeof r.checked==='boolean'&&bounded(p.answer,80)&&bounded(p.reason,40)&&Number.isInteger(p.attempts)&&p.attempts>=0&&p.attempts<=100000&&['assisted','revealed','solved','independent'].every(k=>typeof p[k]==='boolean')&&(!p.independent||p.solved&&!p.assisted&&p.attempts===1)&&['givens','reasons','conclusion'].every(k=>bounded(n[k],2000))&&typeof n.open==='boolean'&&(v.proof===null||plain(v.proof));
 }
 function fit(points,width=400,height=250,padding=40){
  const xs=points.map(p=>p.x),ys=points.map(p=>p.y),minX=Math.min(...xs),minY=Math.min(...ys),dx=Math.max(...xs)-minX,dy=Math.max(...ys)-minY,k=Math.min((width-2*padding)/dx,(height-2*padding)/dy);
  return points.map(p=>({x:(p.x-minX)*k+(width-dx*k)/2,y:(p.y-minY)*k+(height-dy*k)/2}));
 }
 const fixed=n=>Number(n.toFixed(3));
 function svgTriangle(points,names=['A','B','C'],extra=''){
  const center={x:points.reduce((s,p)=>s+p.x,0)/3,y:points.reduce((s,p)=>s+p.y,0)/3};
  let s='<polygon points="'+points.map(p=>fixed(p.x)+','+fixed(p.y)).join(' ')+'" fill="#e6f1e8" stroke="#28596a" stroke-width="3"/>';
  points.forEach((p,i)=>{
   const a=points[(i+1)%3],b=points[(i+2)%3],r=21,u=Math.atan2(a.y-p.y,a.x-p.x),v=Math.atan2(b.y-p.y,b.x-p.x);let delta=v-u;while(delta>Math.PI)delta-=2*Math.PI;while(delta<-Math.PI)delta+=2*Math.PI;
   const start={x:p.x+r*Math.cos(u),y:p.y+r*Math.sin(u)},end={x:p.x+r*Math.cos(v),y:p.y+r*Math.sin(v)};
   s+='<path d="M '+fixed(p.x)+' '+fixed(p.y)+' L '+fixed(start.x)+' '+fixed(start.y)+' A '+r+' '+r+' 0 0 '+(delta>0?1:0)+' '+fixed(end.x)+' '+fixed(end.y)+' Z" fill="'+['#dc8c3560','#d4538560','#21a59860'][i]+'"/>';
   const d=Math.hypot(p.x-center.x,p.y-center.y)||1,x=clamp(p.x+(p.x-center.x)/d*23,17,383),y=clamp(p.y+(p.y-center.y)/d*23,18,239);
   s+='<circle cx="'+fixed(p.x)+'" cy="'+fixed(p.y)+'" r="4" fill="#1e5360"/><text x="'+fixed(x)+'" y="'+fixed(y)+'" font-size="28" text-anchor="middle" dominant-baseline="middle" fill="#183344">'+names[i]+'</text>';
  });return s+extra;
 }
 function mount(win,doc,adapter){
  if(!TOPICS.includes(adapter.id)||doc.getElementById('search-entry-proof'))return;
  const kind=adapter.kind,isAngle=kind==='angle-sum',native=!!win.Geometry7Native,key='mathExamGeometrySearchEntry.v1:'+adapter.id;
  const legacy=doc.querySelector('.app'),support=doc.querySelector('.geometry7-reasoning');
  if(!legacy||!support)return;
  let state=fresh(adapter.id,kind),storage=null,expected=null,blocked=false,warning='',restoring=false;
  try{storage=win.localStorage;if(!native){expected=storage.getItem(key);if(expected){const candidate=JSON.parse(expected);if(valid(candidate,adapter.id,kind))state=candidate;else{blocked=true;warning='Сохранённая работа имеет другой формат. Она не изменена. Скачай текущие записи перед закрытием.';}}}}catch(_){blocked=true;warning='Не удалось прочитать сохранение. Текущие записи можно скачать перед закрытием.';}
  const box=doc.createElement('div');box.className='search-proof';box.id='search-entry-proof';
  box.innerHTML=`
   <p class="entry-warning" id="entry-storage-warning" role="status" hidden></p>
   <section class="search-proof-panel" id="entry-research" aria-labelledby="entry-title">
    <nav class="entry-links" aria-label="Навигация урока"><a href="/">Главная</a><a href="../">Геометрия 7–9</a><a href="../textbook/">Задачи учебника</a></nav>
    <p class="entry-kicker">1. Исследуй → 2. Объясни и докажи → 3. Проверь себя</p>
    <h1 id="entry-title" tabindex="-1">${isAngle?'Почему сумма углов треугольника равна 180°':'Почему сторона и два угла определяют треугольник'}</h1>
    <p>${isAngle?'Измени положение вершины C. Какие углы меняются? Что происходит с их суммой?':'Сторона AB и угол A закреплены. Передвигай C вдоль луча AC. Можно ли сохранить ещё и угол B = 67° в другом положении?'}</p>
    <div class="entry-grid"><figure class="entry-figure"><svg id="entry-model" viewBox="0 0 400 250" role="img" aria-label="${isAngle?'Треугольник ABC с изменяемой вершиной C':'Вершина C движется по лучу из A; пунктир показывает нужное направление из B'}"></svg><figcaption id="entry-measurements" class="entry-stats"></figcaption></figure>
     <div><label for="entry-position">${isAngle?'Положение вершины C':'Положение C на луче AC'}<input id="entry-position" type="range" min="${isAngle?0:40}" max="${isAngle?100:160}" step="1"></label>
      ${isAngle?'<label for="entry-height">Высота вершины C<input id="entry-height" type="range" min="0" max="100" step="1"></label>':'<p class="entry-note">Пунктирный луч из B задаёт второй угол. Ищи положение, в котором C лежит на обоих лучах.</p>'}
     </div></div>
    <label for="entry-guess">Моя догадка<textarea id="entry-guess" maxlength="1500" rows="2" placeholder="Я изменил(а)… При этом…"></textarea></label>
    <div class="entry-actions"><button id="entry-explain" type="button">Сравнить с объяснением</button><button id="entry-to-proof" class="entry-primary" type="button">К доказательству →</button></div>
    <div id="entry-explanation" class="entry-result" hidden>${isAngle?'При изменении фигуры отдельные углы меняются, а их сумма остаётся 180°. Измерение одного или нескольких треугольников ещё не доказывает теорему. Дальше проведём параллельную прямую и объясним, почему это верно для любого треугольника.':'Один угол удерживает C на луче из A. Второй угол требует, чтобы C лежала ещё и на луче из B. Два пересекающихся луча дают единственную точку. Дальше обоснуем это наложением треугольников; измерение само по себе не заменяет доказательство.'}</div>
   </section>
   <section class="search-proof-panel" id="entry-practice" aria-labelledby="entry-practice-title" hidden>
    <p class="entry-kicker">3. Новое условие · самостоятельная проверка</p><h1 id="entry-practice-title" tabindex="-1">${isAngle?'Проверь теорему в новой задаче':'Узнай тот же признак на другой фигуре'}</h1>
    <p id="entry-practice-question">${isAngle?'В треугольнике PQR угол P равен 47°, угол Q равен 68°. Найди угол R и укажи основание. Фигура повёрнута; измерять её на экране не нужно.':'В треугольниках PQR и STU дано: PQ = ST = 7, ∠P = ∠S = 46°, ∠Q = ∠T = 71°. Второй треугольник отражён. Какой вершине соответствует R и по какому признаку треугольники равны?'}</p>
    <div class="entry-practice-figures"><figure class="entry-figure"><svg id="entry-practice-model" viewBox="0 0 400 250" role="img" aria-label="${isAngle?'Повёрнутый треугольник PQR':'Треугольник PQR'}"></svg></figure>${isAngle?'':'<figure class="entry-figure"><svg id="entry-practice-model-b" viewBox="0 0 400 250" role="img" aria-label="Отражённый треугольник STU"></svg></figure>'}</div>
    <div class="entry-answer-row"><label for="entry-answer">${isAngle?'Угол R, градусов':'Вершина, соответствующая R'}<input id="entry-answer" type="text" maxlength="80" ${isAngle?'inputmode="decimal"':''} autocomplete="off"></label>
     <label for="entry-reason">Почему?<select id="entry-reason"><option value="">Выбери основание</option>${isAngle?'<option value="appearance">Так выглядит рисунок</option><option value="angle-sum">Сумма внутренних углов треугольника равна 180°</option><option value="any-three">Сумма любых трёх углов равна 180°</option>':'<option value="two-angles">Достаточно двух равных углов, сторона не нужна</option><option value="asa">Равны сторона и два прилежащих к ней угла</option><option value="sss">Даны три пары равных сторон</option>'}</select></label></div>
    <div class="entry-actions"><button id="entry-check" class="entry-primary" type="button">Проверить ответ и основание</button><button id="entry-help" type="button">Нужен разбор</button></div>
    <p id="entry-feedback" class="entry-result" role="status" hidden></p><div id="entry-solution" class="entry-result" hidden>${isAngle?'Внутренние углы треугольника вместе составляют 180°. Поэтому ∠R = 180° − 47° − 68° = 65°. Поворот рисунка не меняет углов.':'Сторона PQ соответствует ST, прилежащие углы P и Q — углам S и T. Значит, треугольники равны по второму признаку: P ↔ S, Q ↔ T, R ↔ U. Отражение не меняет длины и углы.'}</div>
    <p class="entry-note">Верный ответ с основанием с первой попытки, без разбора, учитывается как самостоятельный. Повтор этой же задачи не добавляет новый успех.</p>
   </section>
   <div id="entry-proof-next" class="entry-footer" hidden><p>Цепочка с карточками — решение с опорой. После неё проверь себя на новом условии.</p><button id="entry-to-practice" class="entry-primary" type="button">Новая задача без подсказок →</button><p id="entry-proof-needed" class="entry-note" hidden>${isAngle?'Сначала закончи доказательство.':'Сначала закончи доказательство и его контрольный вопрос.'}</p></div>
   <nav class="entry-footer entry-actions" aria-label="Этапы и сохранение"><button id="entry-back-research" type="button">К исследованию</button><button id="entry-back-proof" type="button">К моей цепочке доказательства</button><button id="entry-download" type="button">Скачать записи</button></nav>`;
  doc.body.append(box); // Do not move it before any legacy control.
  const el=id=>doc.getElementById(id),noteIds=['givens','reasons','conclusion'];
  function notice(message){warning=message;el('entry-storage-warning').textContent=message;el('entry-storage-warning').hidden=!message;}
  function snapshot(){
   state.proof=adapter.snapshot();for(const n of noteIds)state.notes[n]=el('geometry7-'+n).value;state.notes.open=!!support.querySelector('details').open;return JSON.parse(JSON.stringify(state));
  }
  function save(){
   if(restoring)return;const value=JSON.stringify(snapshot());if(native||blocked||!storage)return;
   try{if(storage.getItem(key)!==expected){blocked=true;notice('В другой вкладке изменена эта работа. Здесь записи сохранены на экране: скачай их, прежде чем обновлять страницу.');return;}storage.setItem(key,value);expected=value;}catch(_){blocked=true;notice('Браузер не смог сохранить изменения. Записи остаются на экране; скачай их перед закрытием.');}
  }
  function region(node,visible){node.hidden=!visible;node.inert=!visible;node.setAttribute('aria-hidden',String(!visible));}
  function show(view,focus=true){
   state.view=view;region(legacy,view==='proof');region(support,view==='proof');region(el('entry-research'),view==='research');region(el('entry-practice'),view==='practice');el('entry-proof-next').hidden=view!=='proof';el('entry-back-research').hidden=view==='research';el('entry-back-proof').hidden=view==='proof';
   if(focus){const target=view==='research'?el('entry-title'):view==='practice'?el('entry-practice-title'):legacy.querySelector('.title');target.tabIndex=-1;target.focus({preventScroll:true});target.scrollIntoView({block:'start'});}save();
  }
  function paintResearch(){
   const r=research(kind,state.research.position,state.research.height);let extra='';
   if(!isAngle)extra='<line x1="'+r.points[1].x+'" y1="'+r.points[1].y+'" x2="'+fixed(r.target.x+(r.target.x-r.points[1].x)*.25)+'" y2="'+fixed(r.target.y+(r.target.y-r.points[1].y)*.25)+'" stroke="#b3532d" stroke-width="3" stroke-dasharray="7 6"/><circle cx="'+fixed(r.target.x)+'" cy="'+fixed(r.target.y)+'" r="7" fill="none" stroke="#b3532d" stroke-width="2"/>';
   el('entry-model').innerHTML=svgTriangle(r.points,undefined,extra);
   el('entry-measurements').textContent=r.angles.map((a,i)=>'∠'+['A','B','C'][i]+' ≈ '+a.toFixed(1).replace('.',',')+'°').join(' · ')+(isAngle?(state.research.checked?' · сумма ≈ '+r.sum.toFixed(1).replace('.',',')+'°':''):r.matched?' · оба условия совпали':' · сравни угол B с 67°');
  }
  function paintPractice(){
   if(isAngle)el('entry-practice-model').innerHTML=svgTriangle(fit(triangle(47,68,72)),['P','Q','R']);
   else{el('entry-practice-model').innerHTML=svgTriangle(fit(triangle(46,71)),['P','Q','R']);el('entry-practice-model-b').innerHTML=svgTriangle(fit(triangle(46,71,0,true)),['S','T','U']);}
  }
  function feedback(result){
   const messages={empty:'Заполни ответ и выбери основание. Пустое поле не считается попыткой.',wrong:isAngle?'Пока не совпало. Проверь сумму двух данных углов и то, какие именно углы составляют 180°.':'Пока не совпало. Сопоставь концы равных сторон и два прилежащих угла. Положение рисунка не определяет соответствие.',independent:'Верно с первой попытки без разбора. Эта новая задача решена самостоятельно.',assisted:'Верно. Эта задача решена с помощью или после исправления; самостоятельный успех за неё не добавлен.',repeat:'Верно. Это уже проверенная задача: повтор не добавляет ещё один самостоятельный успех.',changed:'Сейчас ответ или основание изменены. Прежний результат этой задачи сохранён; повтор не является новым условием.'};
   const out=el('entry-feedback');out.hidden=false;out.dataset.result=['wrong','changed'].includes(result)?'error':'ok';out.textContent=messages[result];
  }
  function submit(){const result=attempt(kind,state.practice,el('entry-answer').value,el('entry-reason').value);state.practice=result.state;feedback(result.result);save();}
  el('entry-position').value=state.research.position;if(isAngle)el('entry-height').value=state.research.height;el('entry-guess').value=state.research.guess;el('entry-explanation').hidden=!state.research.checked;
  el('entry-answer').value=state.practice.answer;el('entry-reason').value=state.practice.reason;el('entry-solution').hidden=!state.practice.revealed;
  restoring=true;
  if(!native&&state.proof&&!adapter.restore(state.proof)){blocked=true;warning='Сохранённую цепочку не удалось восстановить. Исходная запись не изменена. Скачай её и текущие заметки перед закрытием.';state.proof=null;}
  for(const n of noteIds)el('geometry7-'+n).value=state.notes[n];support.querySelector('details').open=state.notes.open;
  restoring=false;
  if(state.practice.solved)feedback(check(kind,state.practice.answer,state.practice.reason)?(state.practice.independent?'independent':'assisted'):'changed');paintResearch();paintPractice();notice(warning);show(state.view,false);
  // Only active regions participate in reading and keyboard navigation. DOM
  // position stays fixed for old board snapshots, including hidden controls.
  const legacyEvent=e=>{
   if((legacy.contains(e.target)||support.contains(e.target))&&state.view!=='proof')show('proof',false);
  };
  for(const type of ['click','input','change','keydown','pointerdown','pointermove','pointerup'])doc.addEventListener(type,legacyEvent,true);
  box.addEventListener('input',e=>{
   if(e.target.id==='entry-position'){state.research.position=Number(e.target.value);paintResearch();}
   if(e.target.id==='entry-height'){state.research.height=Number(e.target.value);paintResearch();}
   if(e.target.id==='entry-guess')state.research.guess=e.target.value;
   if(e.target.id==='entry-answer'){state.practice.answer=e.target.value;if(state.practice.solved)feedback('changed');}
   save();
  });
  el('entry-reason').addEventListener('change',()=>{state.practice.reason=el('entry-reason').value;if(state.practice.solved)feedback('changed');save();});
  el('entry-explain').onclick=()=>{state.research.checked=true;el('entry-explanation').hidden=false;paintResearch();save();};
  el('entry-to-proof').onclick=()=>show('proof');el('entry-back-proof').onclick=()=>show('proof');el('entry-back-research').onclick=()=>show('research');
  el('entry-to-practice').onclick=()=>{if(!adapter.finished()){el('entry-proof-needed').hidden=false;return;}el('entry-proof-needed').hidden=true;show('practice');};
  el('entry-check').onclick=submit;el('entry-answer').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();submit();}});
  el('entry-help').onclick=()=>{if(!state.practice.solved)state.practice.assisted=true;state.practice.revealed=true;el('entry-solution').hidden=false;save();};
  el('entry-download').onclick=()=>{
   const payload={work:snapshot(),preserved:blocked&&expected?expected:null},url=win.URL.createObjectURL(new win.Blob([JSON.stringify(payload,null,2)],{type:'application/json'})),a=doc.createElement('a');a.href=url;a.download=adapter.id+'-work.json';a.click();win.setTimeout(()=>win.URL.revokeObjectURL(url),1000);
  };
  for(const type of ['click','input','change','keydown','pointerup'])doc.addEventListener(type,e=>{if(legacy.contains(e.target)||support.contains(e.target))save();});
  support.querySelector('details').addEventListener('toggle',save);
  win.addEventListener('pagehide',save);
  win.addEventListener('storage',e=>{if(!native&&e.key===key&&e.newValue!==expected){blocked=true;notice('В другой вкладке изменена эта работа. Скачай записи из этой вкладки перед обновлением.');}});
  win.MathExamSearchEntry={snapshot,storageKey:key,geometry:()=>research(kind,state.research.position,state.research.height)};
  box.dataset.ready='true';
 }
 return{angle,triangle,research,check,attempt,fresh,valid,fit,mount};
});

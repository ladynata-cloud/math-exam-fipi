(function () {
  'use strict';
  const {lessons, f} = window.MathExamTopicPractice;
  const $ = id => document.getElementById(id);
  const escape = v => String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const files={113:'uchebnoe_posobie_teoriya_veroyatnostey_i_statistika_tyurin_2011_0',114:'eksperimentalnoe_uchebnoe_posobie_dlya_10_i_11_klassov_2014_0'};
  const course=window.MathExamTopicEdition || {
    trainerId:'tyurin-statistics',storePrefix:'math:tyurin-stats:v1:',authors:'Тюрин и др.',
    grade:book=>book===113?'7–9 классы':'10–11 классы',unit:'пункт',
    source:(book,page)=>'https://ptlab.mccme.ru/sites/ptlab.mccme.ru/files/'+files[book]+'.pdf#page='+(page+(book===113?1:0))
  };
  const external={'prob-count':'probability','prob-distribution':'random-variables','prob-continuous':'random-variables','prob-variance':'random-variables'};
  const embedded=window.top!==window, pack=s=>JSON.parse(JSON.stringify(s));
  const stages=['learn','practice','check','done'], labels={first:'самостоятельно с первой попытки',fixed:'после исправления',help:'с подсказкой'};
  const defaultId=lessons.keys().next().value;
  let state, bridge, prior=null, locked=false;
  const key=id=>course.storePrefix+id;
  const integer=(v,max)=>Number.isInteger(v)&&v>=0&&v<=max;
  const fresh=(id,variant=Math.floor(Math.random()*1000000))=>({id,variant,stage:'learn',model:0,results:[],draft:'',attempts:0,hint:0,feedback:''});
  function valid(s) {
    if(!s||Object.keys(s).sort().join()!=='attempts,draft,feedback,hint,id,model,results,stage,variant') return false;
    if(!lessons.has(s.id)||!integer(s.variant,999999)||!stages.includes(s.stage)||!integer(s.model,6)
       ||!Array.isArray(s.results)||s.results.length>3||!s.results.every(v=>Object.hasOwn(labels,v))
       ||typeof s.draft!=='string'||s.draft.length>70||/[<>]/.test(s.draft)||!integer(s.attempts,9999)
       ||!integer(s.hint,2)||!['','wrong','right'].includes(s.feedback)) return false;
    if(s.stage==='learn'||s.stage==='done') return s.results.length===(s.stage==='learn'?0:3)&&!s.draft&&!s.attempts&&!s.hint&&!s.feedback;
    if((s.stage==='practice' && s.results.length)||s.results.length===3) return false;
    return !s.feedback || (s.attempts>0 && (s.feedback==='right')===matches(s.draft,active(s).question.answer));
  }
  function resetAnswer(){Object.assign(state,{draft:'',attempts:0,hint:0,feedback:''});}
  function number(raw) {
    const s=raw.trim().replace(/−/g,'-').replace(/,/g,'.').replace(/\s*\/\s*/g,'/');
    if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:\/[+-]?(?:\d+(?:\.\d*)?|\.\d+))?$/.test(s)) return NaN;
    const [top,bottom]=s.split('/').map(Number); return top/(bottom??1);
  }
  function matches(raw,n) {const v=number(raw);return Number.isFinite(v)&&Math.abs(v-n)<=0.00000051;}
  function active(s) {
    const l=lessons.get(s.id),step=s.stage==='check'?s.results.length:0;
    const sample=1+(s.variant+(s.stage==='check'?3+step:1))%11;
    const data=l.make(sample), type=(s.variant+(s.stage==='check'?step:2))%3;
    return {data,question:data.questions[type]};
  }
  function load(id) {
    prior=null;locked=false;$('storage').textContent='';
    if(!embedded) try {
      prior=localStorage.getItem(key(id)); const parsed=prior&&JSON.parse(prior);
      if(parsed&&parsed.id===id&&valid(parsed)) return parsed;
    } catch(_) {locked=true;$('storage').textContent='Сохранение недоступно. Можно заниматься в этой вкладке.';}
    return fresh(id);
  }
  function save() {
    if(embedded){bridge?.notifyStateChanged();return;}
    if(locked)return;
    try {
      if(localStorage.getItem(key(state.id))!==prior)throw Error('newer save');
      const next=JSON.stringify(state);localStorage.setItem(key(state.id),next);prior=next;
    } catch(_) {locked=true;$('storage').textContent='Черновик остаётся в этой вкладке. Обнови страницу, чтобы открыть последнее сохранение.';}
  }
  function move(id) {if(!lessons.has(id))id=defaultId;state=load(id);save();render();}
  function figure(data) {
    if(course.figure && data.chart)return course.figure(data);
    if(data.chart==='area'){
      const [,w,h]=data.rows[0],[,a,b]=data.rows[1],scale=160/Math.max(w,h);
      return '<svg viewBox="0 0 200 195" role="img" aria-label="Прямоугольная площадка с выделенным участком. Размеры даны в таблице"><rect x="16" y="12" width="'+(w*scale)+'" height="'+(h*scale)+'" fill="#e1f1ec" stroke="#174c57" stroke-width="2"/><rect x="16" y="12" width="'+(a*scale)+'" height="'+(b*scale)+'" fill="#25827c" stroke="#174c57" stroke-width="2"/></svg>';
    }
    if(data.chart!=='scatter')return '';
    const xs=data.rows.map(r=>r[0]),ys=data.rows.map(r=>r[1]),xmin=Math.min(...xs)-1,xmax=Math.max(...xs)+1,ymin=Math.min(...ys)-1,ymax=Math.max(...ys)+1;
    const x=n=>35+(n-xmin)*225/(xmax-xmin),y=n=>155-(n-ymin)*128/(ymax-ymin);
    const points=data.rows.map(([a,b])=>'<circle cx="'+x(a)+'" cy="'+y(b)+'" r="4.5" fill="#12635e"/>').join('');
    const ticks=(values,axis)=>[...new Set(values)].sort((a,b)=>a-b).map(v=>axis==='x'?'<text x="'+x(v)+'" y="173" text-anchor="middle">'+v+'</text>':'<text x="29" y="'+(y(v)+4)+'" text-anchor="end">'+v+'</text>').join('');
    return '<svg viewBox="0 0 285 184" role="img" aria-label="Диаграмма рассеивания. Координаты каждой точки есть в таблице"><path d="M35 17V157H271" fill="none" stroke="#214955" stroke-width="1.8"/><g font-size="10" fill="currentColor">'+ticks(xs,'x')+ticks(ys,'y')+'<text x="273" y="157">x</text><text x="29" y="13">y</text></g>'+points+'</svg>';
  }
  function table(data) {
    return '<table class="data-table"><caption>'+escape(data.caption)+'</caption><thead><tr>'+data.headers.map(h=>'<th scope="col">'+escape(h)+'</th>').join('')+'</tr></thead><tbody>'+
      data.rows.map(row=>'<tr>'+row.map((v,i)=>i?'<td>'+escape(v)+'</td>':'<th scope="row">'+escape(v)+'</th>').join('')+'</tr>').join('')+'</tbody></table>'+figure(data);
  }
  function workedData(l) {
    const n=1+(state.variant+state.model)%11,data=l.make(n),q=data.questions[state.model%3];
    return table(data)+'<h3>Разберём вопрос</h3><p>'+escape(q.prompt)+'</p><p>'+escape(q.calculation)+' Ответ: <b>'+escape(f(q.answer))+'</b>.</p>';
  }
  const button=(id,title)=>'<button type="button" data-action="'+id+'">'+title+'</button>';
  const embeddedPath=id=>'/trainers/'+course.trainerId+'/index.html#lesson/'+id;
  function render(focus) {
    const l=lessons.get(state.id),hash='#lesson/'+state.id;
    if(!embedded&&location.hash!==hash)history.replaceState(null,'',hash);
    $('title').textContent=l.title;$('edition').textContent=course.authors+' · '+course.grade(l.book)+' · '+course.unit+' '+l.point+' · с. '+l.page;
    $('aim').textContent=l.aim;$('lesson').value=l.id;$('back').href='../../school/index.html#book/source-'+l.book;
    $('source').href=course.source(l.book,l.page);
    $('related').href=external[l.related]?'../../ege-profil/start/index.html#lesson/'+l.related:'../../school/index.html#lesson/'+l.related;
    $('board').hidden=embedded;$('board').href='../trainer-board.html?trainer='+encodeURIComponent(embeddedPath(l.id));
    for(const id of ['related','source','back'])$(id).target=embedded?'_blank':'_self';
    const w=$('work');
    if(state.stage==='learn')w.innerHTML='<section class="panel"><h2 tabindex="-1">Как это устроено</h2>'+'<p>'+escape(l.rule)+'</p><label id="model-label" for="model">Пример модели № '+(state.model+1)+'</label><input type="range" min="0" max="6" value="'+state.model+'" id="model"><div id="worked-data">'+workedData(l)+'</div>'+button('practice','Попробовать на новых данных')+'</section>';
    else if(state.stage==='done'){
      const first=state.results.filter(x=>x==='first').length;
      const next=course.nextId&&lessons.get(course.nextId(l));
      w.innerHTML='<section class="panel"><h2 tabindex="-1">'+(first>=2?'Тема пройдена':'Стоит повторить')+'</h2><p>Самостоятельно с первой попытки: '+first+' из 3. Для прохождения нужны два таких ответа.</p><ol>'+state.results.map(r=>'<li>'+labels[r]+'</li>').join('')+'</ol>'+button('again','Повторить с новыми данными')+(first>=2&&next?' '+button('advance','Перейти к § '+next.point+' · '+escape(next.title)):'')+'</section>';
    }else{
      const {data,question:q}=active(state),ready=state.feedback==='right',check=state.stage==='check';
      const diagnosis=q.mistakes?.find(([value])=>matches(state.draft,value))?.[1] || q.error;
      const feedback=ready?'Верно. '+(state.hint?'Ты воспользовался разбором.':state.attempts>1?'Получилось после исправления.':'Получилось с первой попытки.'):state.feedback==='wrong'?'Проверь ещё раз. '+diagnosis:'';
      w.innerHTML='<section class="panel"><h2 tabindex="-1">'+(check?'Проверка · задание '+(state.results.length+1)+' из 3':'Тренировка с разбором')+'</h2>'+table(data)+'<p class="prompt">'+escape(q.prompt)+'</p>'+
        '<form><label for="answer">Твой ответ</label><p class="tiny">Введи число или дробь через /. Десятичный ответ можно округлить до шестого знака.</p><div class="row"><input type="text" id="answer" maxlength="70" autocomplete="off" value="'+escape(state.draft)+'" '+(ready?'readonly':'')+'>'+
        (ready?button('next',check?(state.results.length===2?'Посмотреть результат':'Следующая задача'):'Начать проверку'):'<button>Проверить ответ</button>')+'</div></form><p class="feedback" id="feedback" role="status">'+escape(feedback)+'</p>'+
        (state.hint?'<ol><li>'+escape(q.calculation)+'</li>'+(state.hint===2?'<li>'+escape(q.error)+' Получаем '+escape(f(q.answer))+'.</li>':'')+'</ol>':'')+
        (!ready&&state.hint<2?button('hint',state.hint?'Показать решение':'Подсказка к этой задаче'):'')+'</section>';
    }
    if(focus==='question')w.querySelector('h2').focus();
    if(focus==='answer')w.querySelector('#answer')?.focus();
    if(focus==='next')w.querySelector('[data-action=next]')?.focus();
  }
  for(const l of lessons.values()){
    const option=document.createElement('option');option.value=l.id;option.textContent=course.grade(l.book)+' · '+l.point+'. '+l.title;$('lesson').append(option);
  }
  $('lesson').addEventListener('change',e=>move(e.target.value));
  window.addEventListener('hashchange',()=>{if(!embedded)move(location.hash.split('/')[1]);});
  $('work').addEventListener('input',e=>{
    if(e.target.id==='model'){
      state.model=Number(e.target.value);save();$('model-label').textContent='Пример модели № '+(state.model+1);
      $('worked-data').innerHTML=workedData(lessons.get(state.id));
    }else if(e.target.id==='answer'&&state.feedback!=='right'){
      state.draft=e.target.value.replace(/[<>]/g,'').slice(0,70);e.target.value=state.draft;
      state.feedback='';$('feedback').textContent='';save();
    }
  });
  $('work').addEventListener('submit',e=>{
    e.preventDefault();if(state.feedback==='right')return;
    if(!state.draft.trim()){$('feedback').textContent='Сначала введи свой ответ.';return;}
    state.attempts=Math.min(state.attempts+1,9999);state.feedback=matches(state.draft,active(state).question.answer)?'right':'wrong';
    save();render(state.feedback==='right'?'next':'answer');
  });
  $('work').addEventListener('click',e=>{
    const action=e.target.closest('[data-action]')?.dataset.action;
    if(action==='practice'){state.stage='practice';}
    else if(action==='hint'){state.hint=Math.min(state.hint+1,2);}
    else if(action==='next'&&state.feedback==='right'){
      if(state.stage==='practice'){state.stage='check';}
      else {state.results.push(state.hint?'help':state.attempts===1?'first':'fixed');if(state.results.length===3)state.stage='done';}
      resetAnswer();
    }else if(action==='advance'&&state.stage==='done'&&course.nextId&&state.results.filter(v=>v==='first').length>=2){
      const id=course.nextId(lessons.get(state.id));if(lessons.has(id))move(id);return;
    }else if(action==='again'){state=fresh(state.id,(state.variant+7)%1000000);}
    else return;
    save();render(action==='hint'?'answer':'question');
  });
  move(location.hash.split('/')[1]);
  if(embedded&&location.origin!=='null')bridge=window.MathExamBoard.register({id:course.trainerId,version:'1.0.0',stateSchemaVersion:1,parentOrigin:location.origin,getState:()=>pack(state),applyState:next=>{
    if(!valid(next))throw Error('Некорректная учебная сессия');
    state=pack(next);render();
  }});
})();

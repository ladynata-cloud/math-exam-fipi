/* Public home route; no API, no mastery writes and no personal data. */
(function ui(){
  'use strict';
  const root=document.getElementById('learning-journey'),m=window.MathExamSchoolJourney,registry=window.LearningPreparation;
  if(!root||!m||!registry)return; // the original static choices remain visible
  const by=id=>document.getElementById(id);
  const key='mathExam.schoolJourney.selection.v1';
  let choice=m.selection(null),saved=true,probeChecked=false;
  // Exposure is only a transient tab-local UI fact, never mastery or a stored attempt.
  const exposed=new Set();
  try{choice=m.selection(JSON.parse(localStorage.getItem(key)||'null'));}catch(_){saved=false;}
  const goal=by('sj-goal'),topic=by('sj-topic'),map=by('sj-map'),details=by('sj-details'),form=by('sj-probe'),result=by('sj-result'),note=by('sj-storage');
  const element=(tag,txt)=>{const e=document.createElement(tag);if(txt!==undefined)e.textContent=txt;return e;};
  const button=(text,handler)=>{const b=element('button',text);b.type='button';b.addEventListener('click',handler);return b;};
  const link=(text,href)=>{const a=element('a',text);a.href=href;return a;};
  function showStorageNote(){note.textContent=saved?'Запоминается только выбранная тема в этом браузере, не уровень знаний.':'Браузер не разрешил прочитать или сохранить выбор. Можно продолжать заниматься.';}
  function persist(){try{localStorage.setItem(key,JSON.stringify(choice));saved=true;}catch(_){saved=false;}showStorageNote();}
  function setNode(id){if(!m.find(id))return;choice={goal:choice.goal,node:id};topic.value=id;persist();render();topic.focus();}
  for(const g of m.goals){const o=element('option',g.title);o.value=g.id;goal.append(o);}
  for(const group of [...new Set(m.nodes.map(n=>n.group))]){
    const opt=element('optgroup');opt.label=group;
    for(const n of m.nodes.filter(n=>n.group===group)){const o=element('option',n.title);o.value=n.id;opt.append(o);}
    topic.append(opt);
  }
  goal.value=choice.goal;topic.value=choice.node;
  function render(){
    const g=m.goal(choice.goal),n=m.find(choice.node);
    map.replaceChildren();
    for(const id of g.path){const li=element('li'),b=button(m.find(id).title,()=>setNode(id));if(id===n.id)b.setAttribute('aria-current','step');li.append(b);map.append(li);}
    by('sj-target').replaceChildren(link('Открыть выбранный курс →',g.href));
    by('sj-title').textContent=n.title;
    const main=m.resource(n.id,registry),hrefs=[...new Set([main,...n.extra].map(m.publicHref).filter(Boolean))];
    by('sj-resources').replaceChildren();
    hrefs.forEach((href,i)=>{
      const label=href.includes('arzhenikov-map')?'Предметные модели и уроки по мотивам Арженикова':i===0?'Начать занятие →':i===1?'Другой способ изучения →':'Дополнительная практика →';
      const li=element('li');li.append(link(label,href));by('sj-resources').append(li);
    });
    if(!hrefs.length)by('sj-resources').append(element('li','Вход пока недоступен. Выберите соседнюю тему.'));
    by('sj-before').replaceChildren();
    n.before.forEach(id=>{const li=element('li');li.append(button(m.find(id).title,()=>setNode(id)));by('sj-before').append(li);});
    by('sj-before-wrap').hidden=!n.before.length;
    probeChecked=false;form.replaceChildren();result.replaceChildren();result.hidden=true;
    const repeated=exposed.has(n.id);
    by('sj-probe-note').textContent=n.questions.length?(repeated?'Вы уже видели разбор этих задач в текущей вкладке. Сейчас это повторение, а не новая самостоятельная проверка.':'Две короткие пробы для выбора занятия, а не оценка освоения. Если вы уже видели разбор, считайте эти задачи повторением.'):'Для этой темы общая входная проверка ещё не разработана. Можно сразу открыть курс; уровень знаний не определён.';
    form.hidden=!n.questions.length;
    n.questions.forEach((q,i)=>{
      const field=element('fieldset'),legend=element('legend',(i+1)+'. '+q.prompt);
      field.append(legend);
      [...q.choices,'Пока не знаю'].forEach((s,j)=>{
        const label=element('label'),input=element('input');input.type='radio';input.name='sj-q'+i;input.value=j===q.choices.length?'?':String(j);
        label.append(input,element('span',s));field.append(label);
      });form.append(field);
    });
    if(n.questions.length){const submit=element('button',repeated?'Проверить повторение':'Проверить две задачи');submit.type='submit';form.append(submit);}
  }
  form.addEventListener('submit',event=>{
    event.preventDefault();
    if(probeChecked)return;
    const n=m.find(choice.node),answers=n.questions.map((_,i)=>form.querySelector('input[name="sj-q'+i+'"]:checked')?.value);
    const r=m.result(n.id,answers);
    result.hidden=false;result.replaceChildren();
    if(r.kind==='incomplete'){result.append(element('p','Выберите ответ или «Пока не знаю» в каждой задаче.'));return;}
    if(r.kind==='not-tested')return;
    const repeated=exposed.has(n.id);
    exposed.add(n.id);
    probeChecked=true;
    for(const control of form.querySelectorAll('input,button[type="submit"]'))control.disabled=true;
    const unanswered=answers.filter(a=>a==='?').length;
    const title=unanswered===2?'Ответы пока не даны':unanswered===1?(r.correct===1?'Одна проба верна, другая без ответа':'Одна проба не совпала, другая без ответа'):r.kind==='two-correct'?'Обе пробы верны':r.kind==='check-again'?'Одна проба верна — нужна ещё проверка':'Стоит повторить эту тему';
    result.append(element('strong',repeated?'Повторение после разбора: '+title.toLowerCase():title));
    result.append(element('p',repeated?'Вы уже видели разбор этой пары в текущей вкладке. Это упражнение для повторения, а не новая самостоятельная проверка.':r.kind==='two-correct'?'Это ещё не подтверждение освоения. Решите новые задачи самостоятельно.':unanswered===2?'Без ответов нельзя определить, что именно вызывает затруднение. Можно начать с объяснения текущей темы.':unanswered===1?'Одна проба осталась без ответа. Этого недостаточно, чтобы определить уровень знаний или причину затруднения. Можно разобрать текущую тему.':'По двум задачам нельзя определить точную причину ошибки. Начните с разбора текущей темы; при необходимости проверьте её основы.'));
    const ul=element('ul');n.questions.forEach((q,i)=>ul.append(element('li',(answers[i]==='?'?'Ответ не дан. Разбор: ':answers[i]===q.answer?'Верно. ':'Ответ не совпал. Разбор: ')+q.explain)));result.append(ul);
    result.append(element('p','Разбор уже показан. Повтор этих же задач не является новой самостоятельной проверкой.'));
    if(r.kind==='two-correct'){const next=m.next(choice.goal,n.id);if(next)result.append(button('Посмотреть следующий шаг: '+next.title,()=>setNode(next.id)));}
    else for(const id of n.before)result.append(button('Проверить основу: '+m.find(id).title,()=>setNode(id)));
  });
  goal.addEventListener('change',()=>{const g=m.goal(goal.value);if(!g)return;choice={goal:g.id,node:g.start};topic.value=choice.node;persist();render();});
  topic.addEventListener('change',()=>{if(!m.find(topic.value))return;choice={goal:choice.goal,node:topic.value};persist();render();});
  // The same static shortcuts must stay visible with and without JavaScript.
  // They are real public entrances, not a hidden duplicate ahead of the old cards.
  render();showStorageNote();details.hidden=false;
})();

(function(){'use strict';
const key=document.body.dataset.route,D=ProfileRoutes,r=D.routes[key],main=document.getElementById('main'),R=ProfileRoute;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let storage;try{storage=localStorage;}catch(_){storage={getItem(){throw Error();}};}
const navigation='<nav class="course-tabs" aria-label="Выбор маршрута">'+['lesson','homework','trigonometry'].map(k=>'<a href="'+D.routes[k].path+'" '+(k===key?'aria-current="page"':'')+'>'+D.routes[k].short+'</a>').join('')+'</nav>';
function outcomeLabels(item){
 const labels=[];
 if(item.independent)labels.push('решено самостоятельно с первой попытки');
 if(item.guided)labels.push('разобрано по шагам');
 if(item.afterHelp)labels.push('решено с подсказкой');
 if(item.afterError)labels.push('исправлено после ошибки');
 if(item.repeated)labels.push('повторно решено знакомое задание');
 return labels.length?labels.join(', '):'есть завершённая тренировка';
}
function label(row){
 if(row.evidence){
  const check=row.evidence.find(item=>item.id===row.task);
  return 'Контрольный подпункт '+row.checkTitle+' — '+(check?outcomeLabels(check):'пока не завершён')+'.';
 }
 return row.independent?'Есть новый самостоятельный успех':row.attempted?'Проверка пройдена с помощью, после ошибки или повторно':row.guided?'Разобрано по шагам':'Пока не завершено';
}
function circleDetails(row){
 return (row.evidence||[]).filter(item=>item.id!==row.task).map(item=>item.title+' — '+outcomeLabels(item)+'.');
}
function evidenceList(row,collapsed){
 const lines=circleDetails(row);
 if(!lines.length)return '';
 const list='<ul>'+lines.map(line=>'<li>'+esc(line)+'</li>').join('')+'</ul>';
 return collapsed?'<details><summary>Другие выполненные подпункты ('+lines.length+')</summary>'+list+'</details>':list;
}
function download(text,name,type){const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
const probeChoices = new Map();
function probeMarkup(probe) {
 const selected = probeChoices.get(probe.id);
 const options = probe.answers.map(([label], index) =>
  `<option value="${index}"${selected === index ? ' selected' : ''}>${esc(label)}</option>`
 ).join('');
 const feedback = selected === undefined ? '' : probe.answers[selected][1];
 return `<p><label for="probe-${probe.id}">${esc(probe.label)}</label></p>
 <select class="button quiet" id="probe-${probe.id}" data-equation-probe="${probe.id}">
 <option value="" disabled${selected === undefined ? ' selected' : ''}>Выберите ответ</option>${options}</select>
 <p role="status" id="feedback-${probe.id}">${esc(feedback)}</p>`;
}
function equationSequence() {
 const steps = r.equations.map(step => {
  const paragraphs = step.paragraphs.map(p => '<p>'+esc(p)+'</p>').join('');
  const links = (step.links || []).map(link => {
   const href = link.unit ? R.link(key, link.unit) : '../part-two/index.html#'+link.path;
   return `<a href="${esc(href)}">${esc(link.label)}</a>`;
  }).join('');
  return `<li><h3>${esc(step.title)}</h3>${paragraphs}${step.probe ? probeMarkup(step.probe) : ''}
  ${links ? '<div class="actions">'+links+'</div>' : ''}</li>`;
 }).join('');
 return `<section class="route-group" id="equations" aria-labelledby="equations-title">
 <h2 id="equations-title" tabindex="-1">От окружности к заданию №13</h2>
 <div class="actions"><a class="button" href="../part-two/#fipi/2027/13/school">Начать маршрут из 10 шагов</a></div>
 <details><summary>Вспомнить знакомые приёмы и попробовать два вопроса</summary>
 <ol>${steps}</ol></details>
 <p><a href="../../downloads/trainers/ege-profil-part-two/ege-profil-part-two-package.zip" download>Скачать вторую часть для работы без сети (ZIP)</a>.
 Распакуйте архив, откройте ege-profil-part-two.html и выберите №13. Здесь же доступны исследование окружности, отбор корней и самостоятельные условия.</p></section>`;
}
main.addEventListener('change', event => {
 const id = event.target.dataset.equationProbe;
 if (!id || !r.equations) return;
 const probe = r.equations.find(step => step.probe?.id === id).probe;
 const index = Number(event.target.value);
 probeChoices.set(id, index);
 document.getElementById('feedback-'+id).textContent = probe.answers[index][1];
});
function render(){const s=R.snapshot(key,storage),done=s.rows.filter(x=>x.complete).length,next=s.rows.find(x=>!x.complete)||s.rows[0],isReport=location.hash==='#report';
 main.innerHTML=navigation+'<section class="course-hero"><p class="eyebrow">Профильная математика · '+(key==='trigonometry'?'единый курс':'после одного урока')+'</p><h1>'+esc(r.title)+'</h1><p class="lead">'+esc(r.intro)+'</p><div class="actions"><a class="button" href="'+R.link(key,next.id)+'">'+(done?'Продолжить':'Начать')+' →</a>'+(key==='lesson'?'<a class="button quiet" href="'+D.routes.homework.path+'">Выдать домашку</a>':'<a class="button quiet" href="#report">Мой итог</a>')+(r.equations?'<a class="button quiet" href="#equations">К уравнениям №13</a>':'')+(window.self===window.top?'<a class="button quiet" href="/trainers/trainer-board.html?trainer='+encodeURIComponent(r.path)+'">Открыть на доске</a>':'')+'</div><p class="small">'+(key==='lesson'?'Порядок можно менять: выберите нужный блок ниже. Домашка использует отдельные самостоятельные условия.':done+' из '+s.rows.length+' блоков: самостоятельная проверка завершена. Решения с помощью отмечаются отдельно.')+'</p></section>'+(s.warning?'<p class="warning" role="status">Часть сохранения недоступна или повреждена. Она не изменена; отчёт может быть неполным.</p>':'')+(isReport?report(s):outline(s))+(r.equations&&!isReport?equationSequence():'')+'<aside class="note">'+(key==='trigonometry'?'Школьные уроки опираются на §§4–6 Мордковича. В отчёте собраны результаты школьных блоков. Решения задач №13 можно посмотреть в разделе «Мой прогресс» второй части.':'Домашка закрепляет выбранные типы заданий 1 и 2 и начало тригонометрии. Она не заменяет весь курс подготовки к экзамену.')+' Результаты хранятся в этом браузере. Уже выполненные здесь задания учитываются; повтор не становится новым самостоятельным успехом.</aside>';
 if(isReport){document.getElementById('export-text').onclick=()=>download(textReport(s),'mathexam-'+key+'-report.txt','text/plain;charset=utf-8');document.getElementById('export-json').onclick=()=>download(JSON.stringify({kind:'mathexam-learning-route',route:key,createdAt:new Date().toISOString(),storage:'local-browser',scope:'Existing results in this browser, not a cloud journal or dated attempt log',...s},null,2),'mathexam-'+key+'-report.json','application/json');}
 document.getElementById('copy-link')?.addEventListener('click',async()=>{const status=document.getElementById('copy-status');try{await navigator.clipboard.writeText(location.origin+D.routes.homework.path);status.textContent='Ссылка скопирована — можно отправить ученику.';}catch(_){status.textContent='Скопируйте ссылку из поля ниже.';document.getElementById('homework-link').select();}});
 const h=main.querySelector('h1');h.tabIndex=-1;h.focus({preventScroll:true});if(location.hash==='#exam')document.getElementById('exam')?.scrollIntoView();
 if(location.hash==='#equations')document.getElementById('equations-title')?.focus();
}
function outline(s){let n=0;return (key==='lesson'?'<section class="assignment"><h2>Одна ссылка для домашней работы</h2><p>После совместного разбора отправьте ученику эту ссылку. Он увидит те же темы, самостоятельную практику и свой итог.</p><label for="homework-link">Ссылка ученику<input id="homework-link" readonly value="'+esc(location.origin+D.routes.homework.path)+'"></label><button id="copy-link" class="button">Скопировать ссылку</button><span id="copy-status" role="status"></span></section>':'<section class="how"><span><b>1</b> Вспомнить и попробовать</span><span><b>2</b> Разобрать по шагам</span><span><b>3</b> Решить и отправить отчёт</span></section>')+r.groups.map((g,gi)=>'<section class="route-group"'+(key==='trigonometry'&&gi===4?' id="exam"':'')+'><h2>'+esc(g.title)+'</h2><p>'+esc(g.intro)+'</p><div class="route-grid">'+g.ids.map(id=>{const l=D.lessons[id],row=s.rows.find(x=>x.id===id);n++;return '<article class="route-card"><span class="unit-number">'+String(n).padStart(2,'0')+'</span><h3>'+esc(l.title)+'</h3>'+(key==='lesson'&&l.questions?'<ol class="teaching-prompts">'+l.questions.map(q=>'<li>'+esc(q)+'</li>').join(''):'<p class="task-status">'+esc(label(row))+'</p>'+evidenceList(row,true))+'<div class="actions"><a class="button" href="'+R.link(key,id)+'">'+(key==='lesson'?'Обсудить и исследовать':'Объяснение и модель')+'</a><a class="button quiet" href="'+R.link(key,id,'guided')+'">По шагам</a>'+(key==='lesson'?'':'<a class="text-link" href="'+R.link(key,id,'independent')+'">Самостоятельная проверка →</a>')+'</div></article>';}).join('')+'</div></section>').join('')+'<p class="actions"><a class="button" href="'+(key==='lesson'?D.routes.homework.path:'#report')+'">'+(key==='lesson'?'К домашке ученика →':'Собрать итоговый отчёт →')+'</a></p>';}
function report(s){return '<section class="report"><h2>Что получилось</h2><p>Это сводка существующих результатов в этом браузере. Она включает ранее выполненные задания. Прочтение теории или переход к следующему блоку не считается решением.</p><div class="route-grid">'+s.rows.map(row=>'<article class="route-card"><h3>'+esc(row.title)+'</h3><p>'+esc(label(row))+'</p>'+evidenceList(row,false)+'<p>По шагам: '+(row.guided?'есть разбор':'не завершено')+'<br>Самостоятельная проверка: '+(row.attempted?'завершена':'не завершена')+'</p><a href="'+R.link(key,row.id,row.attempted?'lesson':'independent')+'">Вернуться к блоку →</a></article>').join('')+'</div><div class="actions"><button class="button" id="export-text">Скачать отчёт для учителя</button><button class="button quiet" id="export-json">Скачать данные JSON</button><a href="#home">К заданиям</a></div><p>Отправьте скачанный текстовый отчёт репетитору или родителю. Автоматической отправки и облачного журнала здесь нет.</p></section>';}
function textReport(s){return r.title+'\n'+new Date().toLocaleString('ru-RU')+'\nРезультаты этого браузера, включая ранее выполненные задания.\n\n'+s.rows.map((x,i)=>(i+1)+'. '+x.title+'\n'+[label(x),...circleDetails(x)].join('\n')+'\nПо шагам: '+(x.guided?'да':'нет')+'; самостоятельная проверка завершена: '+(x.attempted?'да':'нет')).join('\n\n')+(s.warning?'\n\nВнимание: часть сохранения недоступна, отчёт может быть неполным.':'');}
window.addEventListener('hashchange',render);window.addEventListener('pageshow',render);window.addEventListener('storage',render);render();
})();

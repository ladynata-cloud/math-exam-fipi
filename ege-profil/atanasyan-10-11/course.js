(function(){'use strict';
const {families,lessons}=window.AtanasyanCourse;
const modules=[
 {title:'Читаем пространственный чертёж',text:'Вершины, рёбра и грани. Что видно на рисунке и что дано в условии.',units:['space','polyhedra','box'],families:[]},
 {title:'Параллельность в пространстве',text:'От средней линии треугольника к прямым и плоскостям.',units:['parallel','skew','parallel-planes'],families:['section']},
 {title:'Строим сечение',text:'Находим точки на рёбрах. Соединяем их внутри одной грани.',units:['sections'],families:['section']},
 {title:'Перпендикуляр и проекция',text:'Обосновываем прямой угол. Находим проекцию наклонной.',units:['perpendicular','projection'],families:['line-plane','skew-distance']},
 {title:'Угол между плоскостями',text:'Ищем ребро двугранного угла и его линейный угол.',units:['dihedral'],families:['dihedral']},
 {title:'Призмы и пирамиды',text:'Различаем высоту, боковое ребро и апофему. Применяем подобие.',units:['prism','pyramid','pyramid-frustum'],families:['dihedral','volume']},
 {title:'Объём и части тела',text:'Выбираем основание и высоту. Сравниваем объёмы.',units:['box-volume','prism-volume','pyramid-volume'],families:['volume']},
 {title:'Координаты для углов и расстояний',text:'Второй способ решения: координаты, векторы и уравнение плоскости.',units:['vectors','vector-operations','basis','coordinates','dot','plane-equation'],families:['distance-plane']}
];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const unitUrl=id=>'../../stereo-course/index.html?route=ege15#'+encodeURIComponent(id);
const notice=message=>{const e=document.getElementById('notice');e.textContent=message;e.hidden=!message;};
let book,store;
// The catalog accepts only the same schema-1 solved prefix as the guided page.
function exampleState(l){
 const empty={solved:0,started:false},plain=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
 try{const raw=localStorage.getItem(l.storageKey);if(!raw)return empty;const v=JSON.parse(raw),steps=l.steps;
  if(!plain(v)||v.schema!==1||!Number.isInteger(v.step)||v.step<0||v.step>steps.length||!plain(v.answers)||!Array.isArray(v.solved)||!Array.isArray(v.helps)||!Number.isInteger(v.errors)||v.errors<0||v.errors>100000||!plain(v.feedback)||!['','good','wrong'].includes(v.feedback.kind)||typeof v.feedback.message!=='string'||v.feedback.message.length>1000)return empty;
  if(v.solved.length>steps.length||v.solved.some((q,i)=>q!==i)||v.step>v.solved.length||new Set(v.helps).size!==v.helps.length||v.helps.some(q=>!Number.isInteger(q)||q<0||q>=steps.length))return empty;
  if(Object.keys(v.answers).some(k=>!/^\d+$/.test(k)||Number(k)>=steps.length))return empty;
  for(const [key,values]of Object.entries(v.answers)){if(!plain(values))return empty;for(const [id,value]of Object.entries(values)){const f=steps[Number(key)].fields.find(f=>f.id===id);if(!f||typeof value!=='string'||value.length>80||(f.kind==='choice'&&!f.options.some(o=>o.id===value)&&value!==''))return empty;}}
  if(v.solved.some(i=>!steps[i].fields.every(f=>{const value=v.answers[i]?.[f.id];return f.kind==='number'?typeof value==='string'&&/^[−-]?\d+(?:[.,]\d+)?$/.test(value.trim())&&Number(value.trim().replace('−','-').replace(',','.'))===Number(f.correct):value===f.correct;})))return empty;
  return {solved:v.solved.length,started:true,step:v.step};
 }catch(_){return empty;}
}
function renderExamples(){document.getElementById('examples').innerHTML=families.map(f=>'<article class="example" id="family-'+f.id+'"><h3>'+esc(f.title)+'</h3><p>'+esc(f.text)+'</p><div class="actions">'+lessons.filter(l=>l.family===f.id).map((l,i)=>{const s=exampleState(l);return '<a class="button" href="lesson.html?lesson='+l.id+'">Пример '+(i+1)+(s.solved===l.steps.length?' · разобран':s.started?' · продолжить':'')+' →</a>';}).join('')+'</div></article>').join('');}
function summary(){const data=store?.all().units||{},lines=['Стереометрия · Атанасян 10–11 · подготовка к №15','Результаты этого браузера',''];if(book)for(const m of modules)for(const id of m.units){const r=data[id];if(r&&(r.guided||r.proof||r.independent||r.updated))lines.push(book.units.find(u=>u.id===id).title+': '+(r.guided?'разбор пройден':'начато')+'; новых самостоятельных задач: '+(r.independent||0));}for(const l of lessons){const s=exampleState(l);if(s.started)lines.push(l.title+': '+s.solved+'/'+l.steps.length+' шагов');}if(lines.length===3)lines.push('Работа ещё не начата.');lines.push('','Письменные доказательства требуют проверки преподавателя.','Курс: '+location.origin+location.pathname);return lines.join('\n');}
function render(){if(!book||!store)return;const saved=store.all().units;document.getElementById('modules').innerHTML=modules.map((m,i)=>'<details class="module"'+(i===0?' open':'')+'><summary><span class="module-number">0'+(i+1)+'</span><div><h3>'+esc(m.title)+'</h3><p>'+esc(m.text)+'</p></div></summary><ul class="unit-list">'+m.units.map(id=>{const u=book.units.find(u=>u.id===id),r=saved[id],pages=[...new Set(u.source.map(s=>s.page))];return '<li><a href="'+unitUrl(id)+'">'+esc(u.title)+' →</a><small>Учебник: п. '+u.points.join(', ')+' · с. '+pages.join(', ')+'</small><span class="badge">'+(r?.guided?'Разбор пройден':r?.updated?'Начато':'Можно начать')+(r?.independent?' · самостоятельно: '+r.independent:'')+'</span></li>';}).join('')+'</ul>'+(m.families.length?'<div class="practice-links">Применить в задаче:'+m.families.map(id=>'<a href="#family-'+id+'">'+esc(families.find(f=>f.id===id).title)+' →</a>').join('')+'</div>':'')+'</details>').join('');
 const allIds=modules.flatMap(m=>m.units),started=allIds.filter(id=>saved[id]?.updated&&!saved[id]?.guided).sort((a,b)=>saved[b].updated-saved[a].updated),next=started[0]||allIds.find(id=>!saved[id]?.guided)||allIds[0];const c=document.getElementById('continue');c.href=unitUrl(next);c.textContent=(started.length?'Продолжить: ':allIds.every(id=>saved[id]?.guided)?'Повторить: ':next===allIds[0]?'Начать: ':'Следующая тема: ')+book.units.find(u=>u.id===next).title+' →';renderExamples();document.getElementById('summary').value=summary();}
renderExamples();
document.getElementById('copy-summary').onclick=async()=>{const text=summary();document.getElementById('summary').value=text;try{await navigator.clipboard.writeText(text);document.getElementById('report-status').textContent='Итог скопирован. Вставьте его в сообщение учителю.';}catch(_){const box=document.getElementById('summary');box.closest('details').open=true;box.focus();box.select();document.getElementById('report-status').textContent='Выделен текст итога. Скопируйте его и отправьте учителю.';}};
fetch('../../stereo-course/data/course.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{if(!Array.isArray(data.units)||modules.some(m=>m.units.some(id=>!data.units.some(u=>u.id===id))))throw Error();book=data;store=StereoStore.open(book.units.map(u=>u.id),notice);render();}).catch(()=>{notice('Темы учебника не загрузились. Обновите страницу. Подробные задачи ниже доступны.');document.getElementById('modules').innerHTML='<a class="button" href="../../stereo-course/index.html?route=ege15">Открыть пространственную мастерскую</a>';});
window.addEventListener('pageshow',()=>{if(book)render();});window.addEventListener('focus',()=>{if(book)render();});window.addEventListener('storage',()=>{if(book)render();});
})();

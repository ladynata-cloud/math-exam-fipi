(function(){
'use strict';
const C=window.CATALOG;
const notice=document.getElementById('storage-notice');
const store=GeoStore.open(C.map(u=>u.id),m=>{notice.hidden=false;notice.textContent=m;});
const labels=['Понять','Исследовать','Доказать','Решить с опорой','Самостоятельно','Своими словами'];
const checked=(id,record)=>id==='triangle-sas'?GeoCongruence.progress(record)?.verified:record?.independent;
const constructed=(id,record)=>id==='triangle-sas'?Boolean(GeoCongruence.progress(record)?.prediction&&record.observation.trim().length>=10):record?.construction;
let grade='all';

function refresh(){
 const text=document.getElementById('search').value.toLocaleLowerCase('ru');
 const {units}=store.all();
 const latest=C.filter(u=>units[u.id]?.updated).sort((a,b)=>units[b.id].updated-units[a.id].updated)[0];
 const resume=document.getElementById('resume-lesson');
 resume.hidden=!latest;
 if(latest){
  resume.href='atlas/'+latest.id+'.html';
  resume.textContent='Продолжить · '+latest.title+' · '+labels[units[latest.id].stage];
 }
 document.querySelectorAll('.course-card').forEach(el=>{
  const u=C.find(x=>x.id===el.dataset.id),v=units[u.id];
  el.hidden=(grade!=='all'&&u.grade!==+grade)||!el.textContent.toLocaleLowerCase('ru').includes(text);
  el.querySelector('.status').textContent=checked(u.id,v)?'Самостоятельно: '+checked(u.id,v):v?.complete?'Маршрут с опорой пройден':v?.events.length?'В работе':'Можно начать';
 });
 document.querySelectorAll('.chapter').forEach(el=>{
  const cards=[...el.querySelectorAll('.course-card')];
  el.hidden=!cards.some(c=>!c.hidden);
  const ids=cards.map(c=>c.dataset.id);
  const built=ids.filter(id=>constructed(id,units[id])).length;
  const solved=ids.filter(id=>checked(id,units[id])).length;
  const written=ids.filter(id=>units[id]?.written.trim()).length;
  el.querySelector('.chapter-progress').textContent='Тем с построением или исследованием: '+built+' из '+ids.length+' · Самостоятельно проверено: '+solved+' · Обоснований для учителя: '+written;
 });
 document.getElementById('independent-count').textContent=C.filter(u=>checked(u.id,units[u.id])).length;
}
document.querySelectorAll('[data-grade]').forEach(b=>b.onclick=()=>{grade=b.dataset.grade;document.querySelectorAll('[data-grade]').forEach(a=>a.classList.toggle('on',a===b));refresh();});
document.getElementById('search').addEventListener('input',refresh);
document.getElementById('export-progress').onclick=()=>GeoStore.download(store.export(),'geometry-progress.json');
document.getElementById('import-progress').addEventListener('change',async e=>{
 const f=e.target.files[0];if(!f)return;
 try{
  if(f.size>8e6)throw Error('Файл слишком большой.');
  const n=store.import(JSON.parse(await f.text()));
  document.getElementById('import-result').textContent='Прочитано учебных записей: '+n+'. Более новые записи этого браузера сохранены.';
  refresh();
 }catch(err){document.getElementById('import-result').textContent='Не удалось импортировать: '+err.message;}
 e.target.value='';
});
window.addEventListener('storage',refresh);
window.addEventListener('pageshow',refresh);
refresh();
})();

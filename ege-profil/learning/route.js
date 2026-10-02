(function(root){'use strict';
const D=root.ProfileRoutes;if(!D)return;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ids=r=>r.groups.flatMap(g=>g.ids);
function link(route,id,mode='lesson'){
 const l=D.lessons[id],r=D.routes[route];if(!l||!r||!ids(r).includes(id))return r?.path||D.routes.homework.path;
 let hash='lesson/'+id;
 if(mode!=='lesson'&&l.engine==='start')hash='practice/'+id+'/'+mode;
 if(mode!=='lesson'&&l.engine==='circle'){const task=route==='homework'?(mode==='guided'?l.homeGuided:l.homeIndependent):null;hash='task/'+(task||(mode==='guided'?l.guidedIds[0]:l.independentIds[0]))+'/'+mode;}
 return '/ege-profil/'+l.engine+'/index.html?route='+route+'&unit='+id+'#'+hash;
}
function read(storage,key){try{const raw=storage.getItem(key);if(!raw)return {records:{},sessions:{}};const v=JSON.parse(raw);if(!v||v.version!==1||!v.records||typeof v.records!=='object'||Array.isArray(v.records)||!v.sessions||typeof v.sessions!=='object'||Array.isArray(v.sessions))throw Error();return v;}catch(_){return {records:{},sessions:{},warning:true};}}
function snapshot(route,storage){const p=read(storage,'mathexam.profileStart2027.v1'),m=read(storage,'mathexam.mordkovichCircle.v1');return {warning:p.warning||m.warning,rows:ids(D.routes[route]).map(id=>{
 const l=D.lessons[id];let guided=false,attempted=false,independent=false,task='';
 if(l.engine==='start'){const r=p.records[id]||{},s=p.sessions[id+':independent'];guided=Array.isArray(r.guided)&&r.guided.some(x=>l.guidedIds.includes(x));independent=Array.isArray(r.independent)&&r.independent.some(x=>l.independentIds.includes(x));attempted=independent||!!(s&&s.done&&l.independentIds.includes(s.taskId));task=s&&l.independentIds.includes(s.taskId)?s.taskId:'';}
 else{const g=route==='homework'&&l.homeGuided||l.guidedIds[0],i=route==='homework'&&l.homeIndependent||l.independentIds[0];guided=m.records[g]?.guided===true;independent=m.records[i]?.independent===true;attempted=independent||m.sessions[i+':independent']?.done===true;task=i;}
 return {id,title:l.title,guided,attempted,independent,task,complete:attempted};})};}
function current(route,fallback){const [kind,id]=location.hash.slice(1).split('/');const direct=D.lessons[id]?id:kind==='task'?Object.values(D.lessons).find(l=>l.taskIds?.includes(id))?.id:null;return ids(D.routes[route]).includes(direct)?direct:fallback;}
function nav(){
 const params=new URLSearchParams(location.search),route=params.get('route'),r=D.routes[route];let box=document.getElementById('route-context');
 if(!r)return;if(!box){box=document.createElement('section');box.id='route-context';box.className='route-context';box.setAttribute('aria-label','Текущий учебный маршрут');document.getElementById('main').before(box);}
 const list=ids(r),id=current(route,params.get('unit'));if(!list.includes(id)){box.innerHTML='<a href="'+r.path+'">Вернуться: '+esc(r.short)+'</a>';return;}
 const l=D.lessons[id],i=list.indexOf(id),next=list[i+1];
 box.innerHTML='<div><a href="'+r.path+'">← '+esc(r.short)+'</a><strong>Блок '+(i+1)+' из '+list.length+' · '+esc(l.title)+'</strong></div><nav aria-label="Действия в блоке"><a href="'+link(route,id)+'">Объяснение</a><a href="'+link(route,id,'guided')+'">По шагам</a>'+(route==='lesson'?'':'<a href="'+link(route,id,'independent')+'">Самостоятельно</a>')+'<a class="route-next" href="'+(next?link(route,next):r.path+'#report')+'">'+(next?'Следующий блок →':'Итоговый отчёт →')+'</a></nav>'+(route==='lesson'&&l.questions?'<details><summary>Вопросы и действия на уроке</summary><ol>'+l.questions.map(q=>'<li>'+esc(q)+'</li>').join('')+'</ol><a href="'+D.routes.homework.path+'">Домашка после урока →</a></details>':'');
}
function contextQuery(){const p=new URLSearchParams(location.search),route=p.get('route'),r=D.routes[route];if(!r)return '';const id=current(route,p.get('unit'));return ids(r).includes(id)?'?route='+route+'&unit='+id:'';}
root.ProfileRouteNav={render:nav,query:contextQuery};root.ProfileRoute={link,snapshot,ids};
if(typeof module!=='undefined'&&module.exports)module.exports={link,snapshot,ids};
})(globalThis);

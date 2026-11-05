(function(win,doc){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x)),frame=doc.getElementById('exercise'),select=doc.getElementById('exercise-choice'),status=doc.getElementById('board-status');
let catalog=[],state=null,notify=()=>{},ready=false;
function draft(v){if(typeof v==='boolean')return true;if(typeof v!=='string'||v.length>12020||/<\/?[a-z][^>]*>/i.test(v)||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v))return false;try{const prefix='~g7-text~',text=v.startsWith(prefix)?JSON.parse(v.slice(prefix.length)):v;return typeof text==='string'&&text.length<=2000;}catch(_){return false;}}
function valid(value){
 try{
  if(!value||Object.getPrototypeOf(value)!==Object.prototype||Object.keys(value).sort().join()!=='actions,activity,seed,time,version'||value.version!==1||!catalog.some(x=>x.id===value.activity)||!Number.isInteger(value.seed)||value.seed<0||value.seed>4294967295||!Number.isInteger(value.time)||value.time<0||value.time>86400000||!Array.isArray(value.actions)||value.actions.length>1800||new TextEncoder().encode(JSON.stringify(value)).length>60000)return false;
  let t=0;
  return value.actions.every(a=>{
   if(!Array.isArray(a)||a.length!==5||!Number.isInteger(a[0])||a[0]<t||a[0]>value.time||!Number.isInteger(a[2])||a[2]<0||a[2]>400)return false;t=a[0];
   const [,op,,kind,v]=a;
   if(!['click','input','change','keydown','pointerdown','pointermove','pointerup','pointercancel','wheel'].includes(op)||!['button','input:text','input:number','input:range','input:checkbox','input:radio','select','textarea','summary','canvas','div'].includes(kind))return false;
   if(kind==='canvas')return v&&Object.keys(v).sort().join()==='buttons,delta,p,pointerType'&&Array.isArray(v.p)&&v.p.length===2&&v.p.every(n=>Number.isFinite(n)&&Math.abs(n)<=20)&&Number.isInteger(v.buttons)&&v.buttons>=0&&v.buttons<=31&&['mouse','touch'].includes(v.pointerType)&&Number.isFinite(v.delta)&&Math.abs(v.delta)<=1000;
   if(op==='click')return v===null&&['button','summary','div','input:checkbox','input:radio'].includes(kind);
   if(op==='keydown')return ['Enter','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Escape',' '].includes(v);
   return ['input','change'].includes(op)&&(/^(input:|select|textarea)/.test(kind))&&draft(v);
  });
 }catch(_){return false;}
}
function mount(){ready=false;doc.documentElement.dataset.geometry7Board='loading';frame.inert=true;status.textContent='Восстанавливаем общий разбор…';frame.src='/geometry-course/trainers/'+state.activity+'.html?g7-board=1&seed='+state.seed;select.value=state.activity;}
function apply(value){if(!valid(value))throw TypeError('Invalid grade 7 practice snapshot');const previous=state;state=clone(value);select.value=state.activity;
 if(ready&&previous?.activity===state.activity&&previous.seed===state.seed){try{if(frame.contentWindow.Geometry7Native.apply(state))return;}catch(_){}}
 mount();
}
function changed(){if(!ready)return;const native=frame.contentWindow.Geometry7Native.state();const candidate={...state,...native};if(!valid(candidate)){limit();return;}state=candidate;notify();}
function limit(){frame.inert=true;status.textContent='История этого разбора заполнена. Сохраните записи на доске и начните новый разбор.';}
win.Geometry7Practice={ready(child){if(child!==frame.contentWindow||child.location.pathname!=='/geometry-course/trainers/'+state.activity+'.html'||Number(new URLSearchParams(child.location.search).get('seed'))!==state.seed)return;try{if(!child.Geometry7Native.apply(state))throw Error();child.Geometry7Native.subscribe(changed);ready=true;frame.inert=false;status.textContent='Общий разбор: действия, ответы, подсказки и чертёж. Личные результаты здесь не изменяются.';doc.documentElement.dataset.geometry7Board='ready';}catch(_){frame.inert=true;status.textContent='Не удалось восстановить разбор. Выберите тренажёр заново.';doc.documentElement.dataset.geometry7Board='error';}},limit,getState:()=>clone(state),applyState:apply,validateState:valid};
fetch('/geometry-course/board/catalog.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then(items=>{
 catalog=items;
 for(const item of catalog){const option=doc.createElement('option');option.value=item.id;option.textContent=item.title;select.append(option);}
 const wanted=new URLSearchParams(win.location.search).get('activity');
 state={version:1,activity:catalog.some(x=>x.id===wanted)?wanted:catalog[0].id,seed:Math.floor(Math.random()*4294967296),actions:[],time:0};
 select.addEventListener('change',()=>{state={version:1,activity:select.value,seed:Math.floor(Math.random()*4294967296),actions:[],time:0};mount();notify();});
 doc.getElementById('new-work').addEventListener('click',()=>{state={...state,seed:Math.floor(Math.random()*4294967296),actions:[],time:0};mount();notify();});
 mount();win.MathExamBoard.register({id:'geometry7-practice',version:'1.0.0',stateSchemaVersion:1,parentOrigin:win.location.origin,getState:()=>clone(state),applyState:apply,subscribe:fn=>{notify=fn;return()=>{notify=()=>{};};}});
}).catch(()=>{status.textContent='Курс не загрузился. Обновите страницу.';});
})(window,document);

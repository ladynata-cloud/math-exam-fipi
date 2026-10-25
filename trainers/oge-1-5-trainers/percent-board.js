/* Native percent practice/review bridge. Conditions and solutions stay local. */
(function(root,doc){
  'use strict';
  const active=root.OgeCourseSharedMode===true;
  const plain=v=>v&&typeof v==='object'&&!Array.isArray(v)&&[Object.prototype,null].includes(Object.getPrototypeOf(v));
  function exact(v,keys){return plain(v)&&Reflect.ownKeys(v).length===keys.length&&keys.every(k=>{const p=Object.getOwnPropertyDescriptor(v,k);return p&&p.enumerable&&Object.prototype.hasOwnProperty.call(p,'value');});}
  function safe(v,depth=0){if(depth>7)return false;if(v===null||typeof v==='boolean')return true;if(typeof v==='number')return Number.isFinite(v);if(typeof v==='string')return v.length<=80&&!/[<>\u0000-\u001f]/.test(v);if(!plain(v)&&!Array.isArray(v))return false;const keys=Reflect.ownKeys(v);if(Array.isArray(v)&&(Object.getPrototypeOf(v)!==Array.prototype||v.length>64||keys.length!==v.length+1||!Array.from({length:v.length},(_,i)=>Object.prototype.hasOwnProperty.call(v,i)).every(Boolean)))return false;return keys.every(k=>{if(Array.isArray(v)&&k==='length')return true;const p=Object.getOwnPropertyDescriptor(v,k);return typeof k==='string'&&!['__proto__','prototype','constructor'].includes(k)&&p.enumerable&&Object.prototype.hasOwnProperty.call(p,'value')&&safe(p.value,depth+1);});}
  const text=v=>typeof v==='string'&&v.length<=80&&!/[<>\u0000-\u001f]/.test(v);
  const uint=v=>Number.isInteger(v)&&v>=0&&v<=4294967295;
  const copy=v=>JSON.parse(JSON.stringify(v));
  const seed=()=>Math.floor(Math.random()*4294967296);
  function seeded(value,fn){const old=Math.random;let s=value>>>0;Math.random=()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};try{return fn();}finally{Math.random=old;}}
  function connect(native){if(!active)return;function init(){let applying=false,pending=false,previous='',notify=()=>{};const details=()=>[...doc.querySelectorAll('details.pm-details')];
    const getState=()=>({native:native.getState(),disclosures:details().map(el=>el.open)});
    function prepare(v){if(!safe(v)||!exact(v,['native','disclosures'])||!Array.isArray(v.disclosures)||v.disclosures.length!==details().length||v.disclosures.some(x=>typeof x!=='boolean')||!native.validateState(v.native))throw new TypeError('Invalid percent shared state');return copy(v);}
    function applyState(v){const next=prepare(v);applying=true;try{native.applyState(next.native);details().forEach((el,i)=>el.open=next.disclosures[i]);previous=JSON.stringify(getState());}finally{applying=false;}}
    function changed(){
      if(applying||pending)return;
      pending=true;
      // Native event dispatch may checkpoint microtasks before app handlers.
      // Coalesce notifications into a task that reads their completed state.
      root.setTimeout(()=>{pending=false;if(applying)return;const current=JSON.stringify(getState());if(current!==previous){previous=current;notify();}},0);
    }
    doc.addEventListener('input',e=>{if(e.target.matches('input,textarea'))e.target.value=e.target.value.replace(/[<>\u0000-\u001f]/g,'').slice(0,80);changed();},true);
    ['click','keydown','change','toggle'].forEach(type=>doc.addEventListener(type,changed,true));
    const note=doc.createElement('p');note.className='percent-board-note';note.setAttribute('role','note');note.style.cssText='padding:14px 18px;margin-bottom:18px;background:#e8f1ff;border-radius:12px;line-height:1.6';note.textContent='На доске доступны совместная тренировка и разбор: базовые и усложнённые проценты. Обучающий маршрут, личный прогресс и мини-зачёт доступны при отдельном открытии тренажёра. Общие ответы не считаются самостоятельным зачётом.';doc.querySelector('main').prepend(note);
    root.PercentBoard=Object.freeze({getState,applyState,validateState:v=>{try{prepare(v);return true;}catch(_){return false;}}});root.getBoardTrainerState=getState;root.applyBoardTrainerState=applyState;previous=JSON.stringify(getState());
    root.MathExamBoard.register({id:'percent-table-trainer',version:'1.0.0',stateSchemaVersion:1,parentOrigin:root.location.origin,getState,applyState,subscribe(fn){notify=fn;return()=>{notify=()=>{};};}});
  }if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',()=>root.setTimeout(init,0),{once:true});else root.setTimeout(init,0);}
  root.PercentBoardBridge=Object.freeze({active,exact,text,uint,copy,seed,seeded,connect});
})(window,document);

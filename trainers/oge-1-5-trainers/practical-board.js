/* Shared practice for the existing five-question practical variants.
 * Only bounded task descriptors, user drafts and semantic model choices travel.
 * Native generators/checkers reconstruct every condition, diagram and verdict. */
(function(root,doc){
 'use strict';
 const active=root.OgeCourseSharedMode===true;
 root.PracticalPageStorage={getItem:key=>active?null:root.localStorage.getItem(key),setItem:(key,value)=>{if(!active)root.localStorage.setItem(key,value);},removeItem:key=>{if(!active)root.localStorage.removeItem(key);}};
 const copy=value=>JSON.parse(JSON.stringify(value));
 function plain(value){return !!value&&typeof value==='object'&&!Array.isArray(value)&&[Object.prototype,null].includes(Object.getPrototypeOf(value));}
 function exact(value,keys){return plain(value)&&Reflect.ownKeys(value).length===keys.length&&keys.every(key=>{const p=Object.getOwnPropertyDescriptor(value,key);return p&&p.enumerable&&Object.hasOwn(p,'value');});}
 function safe(value,depth=0){if(depth>10)return false;if(value===null||typeof value==='boolean')return true;if(typeof value==='number')return Number.isFinite(value);if(typeof value==='string')return value.length<=100&&!/[<>\u0000-\u001f]/.test(value);if(!plain(value)&&!Array.isArray(value))return false;const keys=Reflect.ownKeys(value);if(Array.isArray(value)&&(value.length>160||Object.getPrototypeOf(value)!==Array.prototype||keys.length!==value.length+1||!Array.from({length:value.length},(_,i)=>Object.hasOwn(value,i)).every(Boolean)))return false;for(const key of keys){if(Array.isArray(value)&&key==='length')continue;const p=Object.getOwnPropertyDescriptor(value,key);if(typeof key!=='string'||['__proto__','prototype','constructor'].includes(key)||!p?.enumerable||!Object.hasOwn(p,'value')||!safe(p.value,depth+1))return false;}return true;}
 function seeded(seed,fn){const previous=Math.random;let n=seed>>>0;Math.random=()=>{n+=0x6D2B79F5;let t=n;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};try{return fn();}finally{Math.random=previous;}}
 const seed=()=>Math.floor(Math.random()*4294967296);
 const uint=value=>Number.isSafeInteger(value)&&value>=0&&value<=4294967295;
 const kind=(page,type,text)=>root.PracticalDiscovery.typeFor(page,type,text);
 const description=(model,fields={answer:null},details=3,zoom=0)=>({model,fields,details,zoom});
 let provider=null,applying=false,notify=()=>{},previous='',queued=false;
 const cards=()=>Array.from(doc.querySelectorAll('.pv-shell .pv-question'));
 function getState(){if(!provider)throw new Error('Practical provider not ready');return {descriptor:copy(provider.get()),questions:cards().map(card=>card.__practicalQuestion.capture()),calculations:Array.from(doc.querySelectorAll('.pv-shell .pv-calculation')).map(i=>i.value),zoom:Array.from(doc.querySelectorAll('.pv-reference .pv-zoom')).map(b=>b.getAttribute('aria-pressed')==='true')};}
 function changed(){
  if(!active||applying||!provider||queued)return;
  queued=true;
  // Native browser events may checkpoint microtasks between capture and the
  // native target/bubble handlers. Publish only after the full dispatch ends.
  root.setTimeout(()=>{queued=false;if(applying||!provider)return;const value=JSON.stringify(getState());if(value!==previous){previous=value;notify();}},0);
 }
 function prepare(value){const fail=()=>{throw new TypeError('Invalid practical shared state');};if(!safe(value)||!exact(value,['descriptor','questions','calculations','zoom'])||!provider.valid(value.descriptor))fail();const specs=provider.describe(value.descriptor);if(!Array.isArray(value.questions)||value.questions.length!==specs.length||!Array.isArray(value.calculations)||value.calculations.length!==(provider.calculations||0)||!value.calculations.every(x=>typeof x==='string')||!Array.isArray(value.zoom)||value.zoom.length!==(provider.zoom||1)||value.zoom.some(x=>typeof x!=='boolean'))fail();
  value.questions.forEach((q,index)=>{const spec=specs[index];if(!exact(q,['answers','checked','helpUsed','helpOpen','details','model','zoom'])||!exact(q.answers,Object.keys(spec.fields))||['checked','helpUsed','helpOpen'].some(k=>typeof q[k]!=='boolean'))fail();for(const [key,choices]of Object.entries(spec.fields))if(typeof q.answers[key]!=='string'||(choices&&!choices.includes(q.answers[key])))fail();if(!Array.isArray(q.details)||q.details.length!==spec.details||q.details.some(x=>typeof x!=='boolean')||!Array.isArray(q.zoom)||q.zoom.length!==spec.zoom||q.zoom.some(x=>typeof x!=='boolean')||((q.helpOpen||q.details.some(Boolean))&&!q.helpUsed)||!root.PracticalDiscovery.validateState(q.model,spec.model)||(!q.helpUsed&&!root.PracticalDiscovery.isInitialState(q.model)))fail();});return copy(value);
 }
 function applyState(incoming){const value=prepare(incoming);applying=true;try{provider.set(value.descriptor);const current=cards();if(current.length!==value.questions.length)throw new Error('Native practical card mismatch');current.forEach((card,index)=>card.__practicalQuestion.restore(value.questions[index]));Array.from(doc.querySelectorAll('.pv-shell .pv-calculation')).forEach((input,i)=>input.value=value.calculations[i]);Array.from(doc.querySelectorAll('.pv-reference .pv-zoom')).forEach((button,i)=>{if((button.getAttribute('aria-pressed')==='true')!==value.zoom[i])button.click();});previous=JSON.stringify(getState());}finally{applying=false;}}
 function register(spec){if(!active)return;provider=spec;previous=JSON.stringify(getState());root.getBoardTrainerState=getState;root.applyBoardTrainerState=applyState;root.MathExamBoard.register({id:spec.id,version:'1.0.0',stateSchemaVersion:1,parentOrigin:root.location.origin,getState,applyState,subscribe:callback=>{notify=callback;return()=>notify=()=>{};}});}
 root.PracticalBoard={active,exact,safe,seeded,seed,uint,kind,description,register,changed,getState,applyState,validateState:value=>{try{prepare(value);return true;}catch(_){return false;}}};
 if(active){for(const type of ['input','change','click','toggle','submit'])doc.addEventListener(type,event=>{if(type==='input'&&event.target.matches?.('.pv-calculation'))event.target.value=event.target.value.replace(/[<>\u0000-\u001f]/g,'').slice(0,100);changed();},true);}
})(window,document);

/* Bounded native exercise replay, using the same typed-operation approach as
 * oge-native-10-14-board.js. Only the compiled grade 7 wrapper can activate it.
 * No peer markup, selectors, URLs, code or personal storage are replayed. */
(function (win, doc) {
  'use strict';
  const query=new URLSearchParams(win.location.search);
  let enabled=false;
  try { enabled=query.get('g7-board')==='1' && win.parent!==win && win.parent.location.origin===win.location.origin && win.parent.location.pathname==='/trainers/geometry7-practice.html'; } catch (_) {}
  if(!enabled)return;
  const seed=Number(query.get('seed'))>>>0, memory=new Map();
  Object.defineProperty(win,'localStorage',{value:{getItem:k=>memory.get(String(k))??null,setItem:(k,v)=>memory.set(String(k),String(v)),removeItem:k=>memory.delete(String(k)),clear:()=>memory.clear(),key:i=>[...memory.keys()][i]??null,get length(){return memory.size;}}});
  let random=seed;
  win.Math.random=()=>{random+=0x6D2B79F5;let t=random;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};
  const realNow=win.performance.now.bind(win.performance), realRAF=win.requestAnimationFrame.bind(win), realTimeout=win.setTimeout.bind(win);
  let clock=0,stamp=realNow(),running=false,replaying=false,nextId=1,actions=[],notify=()=>{},queued=false;
  const timers=new Map(),frames=new Map();
  win.Date.now=()=>1700000000000+clock;
  Object.defineProperty(win.performance,'now',{value:()=>clock});
  win.requestAnimationFrame=fn=>{const id=nextId++;frames.set(id,fn);return id;};
  win.cancelAnimationFrame=id=>frames.delete(id);
  win.setTimeout=(fn,ms=0,...args)=>{if(typeof fn!=='function')throw TypeError('Native callback required');const id=nextId++;timers.set(id,{fn:()=>fn(...args),at:clock+Math.max(1,Number(ms)||0)});return id;};
  win.clearTimeout=id=>timers.delete(id);
  win.setInterval=(fn,ms=0,...args)=>{const id=nextId++;const interval=Math.max(16,Number(ms)||0);timers.set(id,{fn:()=>fn(...args),at:clock+interval,interval});return id;};
  win.clearInterval=id=>timers.delete(id);
  function advance(target){
    target=Math.max(clock,target);
    let rounds=0;
    while(clock<target){
      if(++rounds>50000)throw Error('Exercise clock limit');
      clock=Math.min(target,clock+32);
      for(const [id,t]of [...timers])if(t.at<=clock){timers.delete(id);if(t.interval)timers.set(id,{...t,at:clock+t.interval});t.fn();}
      const current=[...frames];frames.clear();for(const [,fn]of current)fn(clock);
    }
  }
  // Native transitions finish within seconds. Freeze an idle virtual clock after
  // 15 seconds so a long teaching pause never becomes millions of replay frames.
  function live(){const now=realNow();if(running)advance(Math.min(clock+Math.min(100,Math.max(0,now-stamp)),(actions.at(-1)?.[0]||0)+15000));stamp=now;realRAF(live);}
  realRAF(live);
  for(const name of ['setPointerCapture','releasePointerCapture']){const original=win.Element.prototype[name];win.Element.prototype[name]=function(...args){if(!replaying)return original.apply(this,args);};}
  const controls=()=>[...doc.querySelectorAll('button,input,select,textarea,summary,canvas,[role="button"]')];
  const kind=e=>e.tagName.toLowerCase()+(e.tagName==='INPUT'?':'+e.type:'');
  const PREFIX='~g7-text~';
  const encode=s=>typeof s==='string'&&(/<\/?[a-z][^>]*>/i.test(s)||s.startsWith(PREFIX))?PREFIX+JSON.stringify(s).replace(/</g,'\\u003c').replace(/>/g,'\\u003e'):s;
  const decode=s=>typeof s==='string'&&s.startsWith(PREFIX)?JSON.parse(s.slice(PREFIX.length)):s;
  const field=e=>e.type==='checkbox'||e.type==='radio'?e.checked:e.value;
  function publish(){if(queued||replaying)return;queued=true;realTimeout(()=>{queued=false;if(!replaying)notify();},0);}
  function point(e,node){const r=node.getBoundingClientRect();return [(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height];}
  function record(event){
    if(replaying||!event.isTrusted)return;
    const canvas=event.target.closest('canvas');
    const node=canvas||event.target.closest('button,input,select,textarea,summary,[role="button"]');
    if(!node)return;
    if(event.type.startsWith('pointer')&&!canvas)return;
    if(event.type==='pointermove'&&!event.buttons)return;
    if(event.type==='keydown'&&!['Enter','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Escape',' '].includes(event.key))return;
    if(event.type==='wheel'&&!canvas)return;
    if(actions.length>=1800||JSON.stringify(actions).length>50000){event.preventDefault();event.stopImmediatePropagation();win.parent.Geometry7Practice.limit();return;}
    const slot=controls().indexOf(node);if(slot<0)return;
    let value=null;
    if(['input','change'].includes(event.type)){if(typeof node.value==='string')node.value=node.value.slice(0,2000);value=encode(field(node));}
    else if(canvas)value={p:point(event,node),buttons:event.buttons||0,pointerType:event.pointerType==='touch'?'touch':'mouse',delta:event.type==='wheel'?Math.max(-1000,Math.min(1000,event.deltaY)):0};
    else if(event.type==='keydown')value=event.key;
    const op=[Math.round(clock),event.type,slot,kind(node),value];
    const prior=actions.at(-1);
    if(event.type==='input'&&prior?.[1]==='input'&&prior[2]===slot)actions[actions.length-1]=op;
    else if(event.type==='pointermove'&&prior?.[1]==='pointermove'&&op[0]-prior[0]<24)actions[actions.length-1]=op;
    else actions.push(op);
    publish();
  }
  const events=['click','input','change','keydown','pointerdown','pointermove','pointerup','pointercancel','wheel'];
  events.forEach(name=>doc.addEventListener(name,record,{capture:true,passive:false}));
  doc.addEventListener('click',e=>{if(e.target.closest('a'))e.preventDefault();},true);
  function dispatch(op){
    const [,type,slot,expected,value]=op,node=controls()[slot];
    if(!node||kind(node)!==expected||node.disabled)throw Error('Unavailable native control');
    if(['input','change'].includes(type)){
      if(!node.matches('input,select,textarea'))throw Error('Invalid field');
      if(node.type==='checkbox'||node.type==='radio')node.checked=value;else node.value=decode(value);
      node.dispatchEvent(new win.Event(type,{bubbles:true}));
    }else if(type==='keydown')node.dispatchEvent(new win.KeyboardEvent(type,{key:value,bubbles:true,cancelable:true}));
    else if(node.tagName==='CANVAS'){
      const r=node.getBoundingClientRect(),args={bubbles:true,cancelable:true,clientX:r.left+value.p[0]*r.width,clientY:r.top+value.p[1]*r.height,buttons:value.buttons,pointerId:1,pointerType:value.pointerType,button:0,deltaY:value.delta};
      node.dispatchEvent(type==='click'?new win.MouseEvent(type,args):type==='wheel'?new win.WheelEvent(type,args):new win.PointerEvent(type,args));
    }else if(type==='click')node.click();else throw Error('Unsupported native operation');
  }
  function apply(next){
    if(actions.length>next.actions.length||actions.some((a,i)=>JSON.stringify(a)!==JSON.stringify(next.actions[i])))return false;
    running=false;replaying=true;
    try{for(const action of next.actions.slice(actions.length)){advance(action[0]);dispatch(action);actions.push(action);}advance(next.time);}
    finally{replaying=false;running=true;stamp=realNow();}
    return true;
  }
  win.Geometry7Native={apply,state:()=>({actions:JSON.parse(JSON.stringify(actions)),time:Math.round(clock)}),subscribe:fn=>{notify=fn;},pause:()=>{running=false;}};
  doc.addEventListener('DOMContentLoaded',()=>{doc.documentElement.dataset.geometry7Native='ready';win.parent.Geometry7Practice.ready(win);},{once:true});
})(window,document);

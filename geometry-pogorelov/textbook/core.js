(function (root) {
  'use strict';
  const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function fmt(x) {
    return esc(x).replace(/\{([^{}|]+)\|([^{}|]+)\}/g, (_,a,b) => `<span class="fraction"><span>${a.trim()}</span><span>${b.trim()}</span></span>`);
  }
  // Arithmetic only: recursive descent, no eval, Function, property access or JS.
  function parse(raw) {
    if (typeof raw !== 'string' || raw.length > 180 || !raw.trim()) return NaN;
    let s=raw.trim().toLowerCase().replace(/\s/g,'').replace(/,/g,'.').replace(/[−–]/g,'-').replace(/[×·]/g,'*').replace(/[÷:]/g,'/').replace(/π/g,'pi');
    s=s.replace(/√\(([^()]*)\)/g,'sqrt($1)').replace(/√(\d+(?:\.\d+)?)/g,'sqrt($1)').replace(/²/g,'^2').replace(/³/g,'^3');
    s=s.replace(/(\d|\))(?=pi|sqrt|\()/g,'$1*').replace(/pi(?=\d|\()/g,'pi*');
    const tokens=s.match(/sqrt|pi|\d+(?:\.\d*)?|\.\d+|[()+\-*/^]/g);
    if(!tokens || tokens.join('')!==s || tokens.length>100) return NaN;
    let i=0, depth=0;
    function atom(){
      if(++depth>25)throw Error('depth');
      const t=tokens[i++];let v;
      if(t==='('){v=sum();if(tokens[i++]!==')')throw Error(')');}
      else if(t==='sqrt'){if(tokens[i++]!=='(')throw Error('(');v=Math.sqrt(sum());if(tokens[i++]!==')')throw Error(')');}
      else if(t==='pi')v=Math.PI;
      else if(t && /^(?:\d|\.)/.test(t))v=Number(t);
      else throw Error('number');
      --depth;return v;
    }
    function power(){let v=atom();if(tokens[i]==='^'){i++;const e=unary();if(Math.abs(e)>12)throw Error('power');v=v**e;}return v;}
    function unary(){if(tokens[i]==='+'){i++;return unary();}if(tokens[i]==='-'){i++;return -unary();}return power();}
    function product(){let v=unary();while(tokens[i]==='*'||tokens[i]==='/'){const op=tokens[i++],w=unary();v=op==='*'?v*w:v/w;}return v;}
    function sum(){let v=product();while(tokens[i]==='+'||tokens[i]==='-'){const op=tokens[i++],w=product();v=op==='+'?v+w:v-w;}return v;}
    try {const v=sum();return i===tokens.length&&Number.isFinite(v)&&Math.abs(v)<1e15?v:NaN;}catch{return NaN;}
  }
  function check(raw,item){
    if(item.options)return raw===item.value;
    const n=parse(raw),tol=item.tolerance??Math.max(1e-7,Math.abs(item.value)*1e-7);
    return Number.isFinite(n)&&Math.abs(n-item.value)<=tol;
  }
  function fresh(){return {schema:1,mode:'independent',drafts:[],stepDrafts:[],done:0,hints:[],reveals:[],assisted:false,checked:false,manual:false,notes:'',checks:[],modelStage:0,theory:false,trackingVersion:1,updatedAt:0,firstFinal:null,firstSteps:[],history:[]};}
  function restore(raw,t){
    const v=JSON.parse(raw);if(!v||v.schema!==1||typeof v!=='object'||Array.isArray(v))throw Error('version');
    const p=fresh(),limit=x=>typeof x==='string'?x.slice(0,180):'';
    p.mode=v.mode==='guided'?'guided':'independent';
    p.drafts=Array.isArray(v.drafts)?v.drafts.slice(0,t.answers?.length||0).map(limit):[];
    p.stepDrafts=Array.isArray(v.stepDrafts)?v.stepDrafts.slice(0,t.steps.length).map(limit):[];
    for(const key of ['hints','reveals'])p[key]=Array.isArray(v[key])?[...new Set(v[key].filter(n=>Number.isInteger(n)&&n>=0&&n<t.steps.length))]:[];
    p.theory=v.theory===true;p.modelStage=Number.isInteger(v.modelStage)?Math.max(0,Math.min(10,v.modelStage)):0;
    p.assisted=v.assisted===true||p.mode==='guided'||p.theory||p.modelStage>0||p.hints.length>0||p.reveals.length>0;
    const claimed=Number.isInteger(v.done)?Math.max(0,Math.min(t.steps.length,v.done)):0;
    while(p.done<claimed&&(p.reveals.includes(p.done)||check(p.stepDrafts[p.done],t.steps[p.done])))p.done++;
    p.checked=v.checked===true&&!!t.answers&&t.answers.every((a,j)=>check(p.drafts[j],a));
    p.notes=typeof v.notes==='string'?v.notes.slice(0,5000):'';
    p.checks=Array.isArray(v.checks)?v.checks.slice(0,t.checks?.length||0).map(x=>x===true):[];
    p.manual=!t.answers&&v.manual===true&&p.notes.trim().length>0;
    p.trackingVersion=v.trackingVersion===1?1:0;
    p.updatedAt=Number.isSafeInteger(v.updatedAt)&&v.updatedAt>=0?v.updatedAt:0;
    p.firstFinal=readAttempt(v.firstFinal,t,'final');
    p.firstSteps=t.steps.map((_,i)=>readAttempt(v.firstSteps?.[i],t,'step',i));
    p.history=Array.isArray(v.history)?v.history.slice(-12).map(a=>readAttempt(a,t,a?.kind,a?.index)).filter(Boolean):[];
    return p;
  }
  // Keep immutable first submissions separately from the bounded recent journal.
  // Old saved answers never acquire invented first-attempt provenance.
  function readAttempt(a,t,kind,index){
    const items=kind==='final'?t.answers:kind==='step'&&Number.isInteger(index)&&index>=0&&index<t.steps.length?[t.steps[index]]:null;
    if(!a||!items||!Array.isArray(a.values)||a.values.length!==items.length||a.values.some(x=>typeof x!=='string'||!x.trim()||x.length>180)||typeof a.assisted!=='boolean'||!Number.isSafeInteger(a.at)||a.at<0)return null;
    return {kind,index:kind==='step'?index:null,values:a.values.slice(),ok:items.every((item,i)=>check(a.values[i],item)),assisted:a.assisted,at:a.at};
  }
  function submit(p,t,kind,values,index=null,at=Date.now()){
    const a=readAttempt({values,assisted:p.assisted,at},t,kind,index);
    if(!a)return null;
    if(kind==='final'&&!p.firstFinal)p.firstFinal=a;
    if(kind==='step'&&!p.firstSteps[index])p.firstSteps[index]=a;
    p.history.push(a);p.history=p.history.slice(-12);return a;
  }
  function started(p){return !!(p.updatedAt||p.assisted||p.checked||p.manual||p.done||p.notes||p.drafts?.some(Boolean)||p.stepDrafts?.some(Boolean)||p.firstFinal||p.history?.length);}
  function resume(rows){return rows.filter(({p,t})=>started(p)&&!p.checked&&!p.manual).sort((a,b)=>(b.p.updatedAt||0)-(a.p.updatedAt||0))[0]||null;}
  function status(p,t){
    if(!p)return '';
    if(p.manual)return 'Запись для проверки';
    if(p.checked){
      if(p.assisted)return 'Ответ проверен · с помощью';
      if(p.trackingVersion!==1||!p.firstFinal)return 'Ответ проверен · прежняя запись без полной истории';
      return p.firstFinal.ok?'Ответ проверен · с первой попытки без подсказок':'Ответ проверен · после исправления';
    }
    if(p.done===t.steps.length)return 'Разобрано по шагам';
    if(started(p))return 'В работе';
    return '';
  }
  const api={esc,fmt,parse,check,fresh,restore,status,submit,started,resume};
  root.PogorelovCore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

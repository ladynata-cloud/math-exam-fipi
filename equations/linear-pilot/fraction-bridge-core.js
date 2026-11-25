/* Bounded fraction/equation bridge. No legacy store or network. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MathExamFractionBridge=api;})(typeof globalThis==='undefined'?this:globalThis,
function factory(){
  'use strict';
  const VERSION=1,KEY='mathExam.linearFractionBridge.session.v1',MAX_EVENTS=480,MAX_ATTEMPTS=5;
  const city='/trainers/oge-basics/multiplication-division/arzhenikov-map.html#course-c-quotient';
  // [divisor, additive term, right side]. Transfer changes the representation
  // and all three parameters. The bank is finite and is not a secure exam.
  const data=[
    ['bridge-01',[4,3,8],[3,2,9],'9 м — это 2 м и треть длины ленты. Какова длина всей ленты, в метрах?'],
    ['bridge-02',[3,5,11],[5,4,8],'Из первоначального запаса воды взяли пятую часть. К ней добавили 4 л, получилось 8 л. Сколько литров было в первоначальном запасе?'],
    ['bridge-03',[5,2,7],[4,6,14],'Четверть длины шнура и ещё 6 м вместе составляют 14 м. Сколько метров во всём шнуре?'],
    ['bridge-04',[2,7,15],[6,3,10],'Пешеход прошёл шестую часть намеченного пути, а затем ещё 3 км. Всего он прошёл 10 км. Сколько километров составляет намеченный путь?'],
    ['bridge-05',[6,4,9],[2,8,19],'Половину первоначального количества деталей переложили в коробку и добавили туда ещё 8 деталей. В коробке оказалось 19 деталей. Сколько деталей было первоначально?'],
    ['bridge-06',[7,2,8],[4,1,10],'Из бухты отрезали четверть провода и ещё 1 м. Всего отрезано 10 м. Какой длины был провод до этого, в метрах?'],
    ['bridge-07',[4,6,12],[7,3,11],'11 см составляют одна седьмая длины полоски и дополнительные 3 см. Найди длину всей полоски в сантиметрах.'],
    ['bridge-08',[5,1,10],[3,5,12],'Треть начального запаса крупы и ещё 5 кг составляют 12 кг. Сколько килограммов было в начальном запасе?']
  ];
  const resources={
    whole:[
      {id:'oge-basics:fraction-meaning',label:'Дробь: часть, целое и равные записи',href:'/trainers/oge-basics/fraction-meaning.html'},
      {id:'path:pre7-fraction-part-whole',label:'Доля, часть и целое',href:'/ege-baza/path/index.html#lesson=pre7-fraction-part-whole'},
      {id:'arzhenikov:c-quotient',label:'Город маленьких дел: дробь — результат деления',href:city}
    ],
    inverse:[{id:'path:pre7-subtract-borrow',label:'Вычитание: повторить вычисление по разрядам',href:'/ege-baza/path/index.html#lesson=pre7-subtract-borrow'}],
    balance:[{id:'public:equation-simple',label:'Простые уравнения по шагам',href:'/trainers/simple-equations-stepwise.html'}]
  };
  const PROBES=['whole','inverse','balance'];
  const probeNames={whole:'Восстановить целое по одной доле',inverse:'Обратное действие и вычитание',balance:'Одинаковое действие с обеими частями равенства'};
  const makeEquation=values=>{
    const [d,b,c]=values;return {d,b,c,answer:d*(c-b),equation:'x/'+d+' + '+b+' = '+c};
  };
  const pairs=data.map(([id,a,t,story])=>({id,original:makeEquation(a),transfer:{...makeEquation(t),story}}));
  function pairFor(id){return pairs.find(p=>p.id===id)||null;}
  function probeFor(id,kind){
    const i=pairs.findIndex(p=>p.id===id);
    if(i<0||!PROBES.includes(kind))return null;
    if(kind==='whole'){
      // The probe uses a separate quantity, not the original equation's answer.
      const d=2+(i%5),part=11+i;
      return {kind,name:probeNames[kind],prompt:'1/'+d+' некоторой длины равна '+part+' см. Какова вся длина в сантиметрах?',answer:d*part,parts:d,part,
        explanation:'В целом '+d+' одинаковых частей. Если каждая равна '+part+' см, целое равно '+d+' × '+part+' = '+d*part+' см.'};
    }
    if(kind==='inverse'){
      const a=43+3*i,b=8+i;
      return {kind,name:probeNames[kind],prompt:'Из какого числа получится '+a+', если к нему прибавить '+b+'? Запиши число.',answer:a-b,
        explanation:'Чтобы отменить прибавление '+b+', вычти '+b+': '+a+' − '+b+' = '+(a-b)+'. Проверка: '+(a-b)+' + '+b+' = '+a+'.'};
    }
    const b=4+i,c=19+2*i;
    const options=[
      {id:'both',label:'Вычесть '+b+' из левой и из правой части'},
      {id:'left',label:'Вычесть '+b+' только из левой части'},
      {id:'add',label:'Прибавить '+b+' к обеим частям'}
    ];
    // Rotate choices so the correct answer is not always in the same position.
    const shift=i%options.length;
    return {kind,name:probeNames[kind],prompt:'В равенстве y + '+b+' = '+c+' нужно убрать слагаемое '+b+'. Какое действие сохраняет равенство и убирает это слагаемое?',answer:'both',options:options.slice(shift).concat(options.slice(0,shift)),
      explanation:'Вычитаем '+b+' из обеих частей. Получаем y = '+(c-b)+'. Если изменить только одну сторону, равенство перестанет быть равносильным.'};
  }
  const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
  const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
  const keys=(o,names)=>obj(o)&&Object.keys(o).length===names.length&&names.every(k=>own(o,k));
  const numeric=v=>Number.isSafeInteger(v)&&Math.abs(v)<=1000000;
  const answer=v=>v==='?'||numeric(v);
  function parseAnswer(raw){
    if(typeof raw!=='string')return null;
    const text=raw.trim().replace(/\u2212/g,'-').replace(',','.');
    if(text==='?')return '?';
    if(!/^[+-]?\d{1,7}(?:\.0{1,4})?$/.test(text))return null;
    const n=Number(text);return numeric(n)?n||0:null;
  }
  function parseProbe(raw,kind){
    if(kind==='balance')return ['both','left','add','?'].includes(raw)?raw:null;
    return parseAnswer(raw);
  }
  function newRound(){return {attempts:[],helps:[],probes:{},activeProbe:null,revealed:false,transfer:null};}
  function fresh(){return {version:VERSION,index:0,phase:'original',round:newRound(),completed:[]};}
  function current(s){return pairs[s.index]||null;}
  function solved(s){const a=s.round.attempts;return !!a.length&&a[a.length-1].correct;}
  function originalOutcome(s){
    const a=s.round.attempts;
    if(a.length&&a[0].correct)return a[0].assisted?'correct-with-help':'first-correct';
    if(a.some(x=>x.correct))return a.some(x=>x.assisted)?'correct-after-retry-with-help':'correct-after-retry';
    if(s.round.revealed)return 'worked-example';
    return 'not-checked';
  }
  function transferOutcome(record){
    if(!record)return 'not-checked';
    if(record.value==='?')return 'not-answered';
    if(!record.correct)return 'not-correct';
    return record.assisted?'correct-with-help':'first-correct';
  }
  function need(condition,message){if(!condition)throw Error(message);}
  function replay(events){
    need(Array.isArray(events)&&events.length<=MAX_EVENTS,'Invalid event log');
    const s=fresh();
    for(let j=0;j<events.length;j++){
      need(own(events,j),'Sparse event log');
      const ev=events[j],p=current(s),r=s.round;
      need(obj(ev)&&p&&ev.pair===p.id&&typeof ev.type==='string','Event outside active pair');
      switch(ev.type){
        case 'original-answer':
          need(keys(ev,['type','pair','value','external'])&&answer(ev.value)&&typeof ev.external==='boolean','Invalid answer');
          need(s.phase==='original'&&!solved(s)&&!r.revealed&&r.attempts.length<MAX_ATTEMPTS,'Original attempt not available');
          r.attempts.push({value:ev.value,correct:ev.value===p.original.answer,assisted:ev.external||r.helps.length>0||r.attempts.some(a=>a.assisted)});
          break;
        case 'open-probe':
          need(keys(ev,['type','pair','probe'])&&PROBES.includes(ev.probe),'Invalid probe');
          need(s.phase==='original'&&r.attempts.length>0&&!solved(s)&&!r.revealed,'Probe requires an attempt');
          r.activeProbe=ev.probe;s.phase='probe';
          if(!r.helps.includes('probe:'+ev.probe))r.helps.push('probe:'+ev.probe);
          if(!own(r.probes,ev.probe))r.probes[ev.probe]={answered:false,value:null,correct:false};
          break;
        case 'probe-answer':{
          need(keys(ev,['type','pair','probe','value'])&&s.phase==='probe'&&ev.probe===r.activeProbe,'Invalid probe answer');
          const q=probeFor(p.id,ev.probe),row=r.probes[ev.probe];
          need(q&&row&&!row.answered&&(ev.probe==='balance'?['both','left','add','?'].includes(ev.value):answer(ev.value)),'Probe already answered or invalid');
          r.probes[ev.probe]={answered:true,value:ev.value,correct:ev.value===q.answer};
          break;
        }
        case 'resource':
          need(keys(ev,['type','pair','probe','id'])&&s.phase==='probe'&&ev.probe===r.activeProbe&&resources[ev.probe]?.some(x=>x.id===ev.id),'Resource not allowed');
          if(!r.helps.includes('resource:'+ev.id))r.helps.push('resource:'+ev.id);
          break;
        case 'return':
          need(keys(ev,['type','pair'])&&s.phase==='probe','No open probe');
          r.activeProbe=null;s.phase='original';break;
        case 'reveal':
          need(keys(ev,['type','pair'])&&s.phase==='original'&&r.attempts.length>0&&!solved(s)&&!r.revealed,'Cannot reveal before attempt or twice');
          r.revealed=true;r.helps.push('solution');break;
        case 'transfer':
          need(keys(ev,['type','pair'])&&s.phase==='original'&&(solved(s)||r.revealed),'Finish original or see its explanation first');
          s.phase='transfer';break;
        case 'transfer-answer':
          need(keys(ev,['type','pair','value','external'])&&answer(ev.value)&&typeof ev.external==='boolean'&&s.phase==='transfer'&&!r.transfer,'Transfer check is one submission');
          r.transfer={value:ev.value,correct:ev.value===p.transfer.answer,assisted:ev.external};s.phase='result';break;
        case 'next':
          need(keys(ev,['type','pair'])&&s.phase==='result'&&r.transfer,'No submitted transfer');
          s.completed.push({pair:p.id,original:originalOutcome(s),transfer:transferOutcome(r.transfer)});
          s.index++;s.round=newRound();s.phase=s.index===pairs.length?'done':'original';break;
        default:throw Error('Unknown event');
      }
    }
    return s;
  }
  function append(events,ev){
    const next=[...events,ev],state=replay(next);
    // Keep every answer, first access to help and meaningful transition.
    // Repeated link clicks and completed revisits that add no evidence must
    // not consume the finite log budget. Validate before compacting.
    if(ev.type==='resource'){
      const before=replay(events);
      if(before.round.helps.includes('resource:'+ev.id))return {events:events.slice(),state};
    }
    if(ev.type==='return'&&events.at(-1)?.type==='open-probe'){
      const without=events.slice(0,-1),before=replay(without);
      if(JSON.stringify(before)===JSON.stringify(state))return {events:without,state};
    }
    return {events:next,state};
  }
  function draftKey(pair,phase,probe){
    if(!pairFor(pair))return null;
    if(phase==='original'||phase==='transfer')return pair+':'+phase;
    if(phase==='probe'&&PROBES.includes(probe))return pair+':probe:'+probe;
    return null;
  }
  const allowedDrafts=new Set(pairs.flatMap(p=>[draftKey(p.id,'original'),draftKey(p.id,'transfer'),...PROBES.map(k=>draftKey(p.id,'probe',k))]));
  function validDraft(key,value){
    if(!allowedDrafts.has(key)||!keys(value,['value','external'])||typeof value.value!=='string'||value.value.length>24||typeof value.external!=='boolean')return false;
    return key.endsWith(':probe:balance')?['','both','left','add','?'].includes(value.value):/^[0-9+\-\u2212.,? \t]*$/.test(value.value);
  }
  function snapshot(events,drafts){
    replay(events);
    need(obj(drafts)&&Object.keys(drafts).length<=allowedDrafts.size,'Invalid drafts');
    const copy={};
    for(const [k,v] of Object.entries(drafts)){need(validDraft(k,v),'Invalid draft');copy[k]={...v};}
    return {version:VERSION,events:events.map(e=>({...e})),drafts:copy};
  }
  function decode(raw){
    if(raw===null||raw==='')return snapshot([],{});
    need(typeof raw==='string'&&raw.length<=120000,'Snapshot too large');
    const v=JSON.parse(raw);need(keys(v,['version','events','drafts'])&&v.version===VERSION,'Unknown snapshot');
    return snapshot(v.events,v.drafts);
  }
  function solution(eq){
    const {d,b,c,answer}=eq,k=c-b;
    return [eq.equation,'x/'+d+' = '+c+' − '+b+' = '+k,'x = '+k+' × '+d+' = '+answer,'Проверка: '+answer+'/'+d+' + '+b+' = '+c+'.'];
  }
  // Freeze the exported bank; no consumer can accidentally alter expected keys.
  const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
  freeze(pairs);freeze(resources);freeze(PROBES);freeze(probeNames);
  return Object.freeze({VERSION,KEY,MAX_EVENTS,MAX_ATTEMPTS,pairs,PROBES,resources,probeNames,pairFor,probeFor,current,solved,originalOutcome,transferOutcome,parseAnswer,parseProbe,replay,append,draftKey,validDraft,snapshot,decode,solution});
}
);

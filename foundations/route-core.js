/* Finite public foundation sessions. No account/legacy progress is read or written. */
(function(root,factory){'use strict';if(typeof module==='object'&&module.exports)module.exports=factory();else root.FoundationRoutesCore=factory();})(typeof globalThis==='undefined'?this:globalThis,function(){
'use strict';
const VERSION=1,PREFIX='mathExamFoundations.routes.v1.',MODES=['practice','check-a','check-b'],SIZE=6;
const overview=['public:arithmetic','public:vilenkin5','public:vilenkin6','public:geometry-course'];
function gcd(a,b){a=a<0n?-a:a;b=b<0n?-b:b;while(b){const c=a%b;a=b;b=c;}return a||1n;}
function fraction(n,d){if(!d)return null;if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return{n:n/g,d:d/g};}
function parseNumber(value){
 if(typeof value!=='string'&&typeof value!=='number')return null;
 const s=String(value).trim().replace(/\u2212/g,'-').replace(/\u00a0/g,' ');
 if(!s||s.length>100)return null;
 const mixed=s.match(/^([+-]?)(\d{1,18})\s+(\d{1,18})\s*\/\s*(\d{1,18})$/);
 if(mixed){const den=BigInt(mixed[4]),part=BigInt(mixed[3]);if(!den||part>=den)return null;return fraction((mixed[1]==='-'?-1n:1n)*(BigInt(mixed[2])*den+part),den);}
 const pieces=s.split('/');if(pieces.length>2)return null;
 function decimal(t){const m=t.trim().match(/^([+-]?)(?:(\d{1,18})(?:[.,](\d{0,12}))?|[.,](\d{1,12}))$/);if(!m)return null;const a=m[2]||'0',b=m[3]||m[4]||'';return fraction(BigInt((m[1]==='-'?'-':'')+a+b),10n**BigInt(b.length));}
 const a=decimal(pieces[0]);if(!a)return null;if(pieces.length===1)return a;const b=decimal(pieces[1]);return b&&b.n?fraction(a.n*b.d,a.d*b.n):null;
}
function equalNumber(a,b){const x=parseNumber(a),y=parseNumber(b);return !!(x&&y&&x.n*y.d===y.n*x.d);}
function formatProblem(question,value){
 const raw=String(value).trim().replace(/\u2212/g,'-');
 if(question.answerFormat==='decimal'&&!/^[+-]?(?:\d+[.,]\d+|[.,]\d+)$/.test(raw))return'Здесь нужна десятичная запись через запятую или точку.';
 if(question.answerFormat==='integer'&&!/^[+-]?\d+$/.test(raw))return'Здесь нужно целое число.';
 if(question.answerFormat==='fraction'&&!/^[+-]?\d+\s*\/\s*[+-]?\d+$/.test(raw))return'Здесь нужна запись одной обыкновенной дробью: a/b.';
 if(question.requireReduced){const m=raw.match(/^([+-]?\d+)\s*\/\s*([+-]?\d+)$/);if(!m||!BigInt(m[2])||gcd(BigInt(m[1]),BigInt(m[2]))!==1n)return'Числитель и знаменатель ещё можно сократить. Нужна несократимая дробь.';}
 return'';
}
function correct(question,value){if(!question||typeof value!=='string')return false;return question.input==='choice'?Array.isArray(question.choices)&&question.choices.includes(value)&&value===String(question.answer):!formatProblem(question,value)&&equalNumber(value,String(question.answer));}
function validHref(href){return typeof href==='string'&&/^\/(?!\/)/.test(href)&&!/[\\\u0000-\u0020]/.test(href)&&!href.split(/[?#]/)[0].split('/').includes('..');}
function createCatalog(preparation,arrays){
 const routes=arrays.flat(),byId=Object.create(null),byItem=Object.create(null),groups=preparation.groups.map(g=>({id:g.id,title:g.title,lead:g.lead,routes:[]})),byGroup=Object.fromEntries(groups.map(g=>[g.id,g]));
 for(const route of routes){
  if(!route||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(route.id)||byId[route.id]||!byGroup[route.group])throw Error('Invalid/duplicate route '+route?.id);
  if(!route.title||!route.goal||!Array.isArray(route.covers)||!Array.isArray(route.trainers)||new Set(route.trainers.map(t=>t.href)).size<2)throw Error('Incomplete route '+route.id);
  if(!route.trainers.every(t=>validHref(t.href)&&t.title&&t.instruction&&t.finish))throw Error('Invalid trainer '+route.id);
  if(!Array.isArray(route.questions)||route.questions.length!==18||new Set(route.questions.map(q=>q.id)).size!==18)throw Error('Question bank '+route.id);
  for(const q of route.questions){if(!q.id||!q.prompt||!q.hint||!q.explanation||!['number','choice'].includes(q.input)||!correct(q,String(q.answer)))throw Error('Invalid question '+route.id+'/'+q.id);}
  byId[route.id]=route;byGroup[route.group].routes.push(route);
  for(const item of route.covers){if(byItem[item]||overview.includes(item))throw Error('Duplicate/catalogue coverage '+item);byItem[item]=route;}
 }
 const all=preparation.groups.flatMap(g=>g.items),ids=new Set(all.map(i=>i.id));
 for(const item of all)if(!overview.includes(item.id)&&!byItem[item.id])throw Error('Uncovered item '+item.id);
 for(const item of Object.keys(byItem))if(!ids.has(item))throw Error('Unknown item '+item);
 for(const route of routes)for(const p of route.prerequisites||[])if(!ids.has(p))throw Error('Unknown prerequisite '+route.id+'/'+p);
 return{routes,groups,byId,byItem,overview:all.filter(i=>overview.includes(i.id))};
}
function questions(route,mode){const offset=MODES.indexOf(mode);return offset<0?[]:route.questions.slice(offset*SIZE,(offset+1)*SIZE);}
function order(events){return events.slice().sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id));}
function validEvent(e,catalog){
 if(!e||e.version!==VERSION||typeof e.id!=='string'||!/^[a-zA-Z0-9._-]{8,120}$/.test(e.id)||typeof e.session!=='string'||!/^[a-zA-Z0-9._-]{8,120}$/.test(e.session)||!Number.isSafeInteger(e.at)||e.at<=0||!catalog.byId[e.route]||!MODES.includes(e.mode))return false;
 if(!['start','view','hint','reveal','submit','finish'].includes(e.type))return false;
 if(e.type==='start'||e.type==='finish')return true;
 if(!questions(catalog.byId[e.route],e.mode).some(q=>q.id===e.question))return false;
 return e.type!=='submit'||typeof e.value==='string'&&e.value.length<=100;
}
function firstExposure(events,catalog){
 const result={};
 for(const e of order(events)){if(!validEvent(e,catalog)||!e.question||!['view','hint','reveal','submit'].includes(e.type))continue;const key=e.route+'\n'+e.question;if(!result[key])result[key]=e.session;}
 return result;
}
function session(catalog,events,id,prepared){
 const sorted=prepared?prepared.bySession[id]||[]:order(events.filter(e=>e.session===id&&validEvent(e,catalog))),start=sorted.find(e=>e.type==='start');if(!start)return null;
 const route=catalog.byId[start.route],qs=questions(route,start.mode),first=prepared?prepared.first:firstExposure(events,catalog);
 const items=qs.map(q=>({id:q.id,errors:0,help:false,revealed:false,correct:false,value:'',repeated:first[route.id+'\n'+q.id]!==undefined&&first[route.id+'\n'+q.id]!==id}));
 const state={id,route:route.id,mode:start.mode,startedAt:start.at,items,index:0,complete:false,finished:false,finishedAt:null,independent:0,assisted:0,repeated:0};
 for(const e of sorted){
  if(e.route!==start.route||e.mode!==start.mode||e.at<start.at)continue;
  if(e.type==='finish'){if(items.every(i=>i.correct)){state.finished=true;state.finishedAt=e.at;}continue;}
  const index=qs.findIndex(q=>q.id===e.question);if(index<0)continue;
  const item=items[index],current=items.findIndex(i=>!i.correct);
  if(item.correct){if(e.type==='hint')item.help=true;else if(e.type==='reveal'){item.help=true;item.revealed=true;}else if(e.type==='submit'&&!correct(qs[index],e.value))item.errors++;continue;}
  if(index!==current)continue;
  if(e.type==='hint'){item.help=true;}else if(e.type==='reveal'){item.help=true;item.revealed=true;}
  else if(e.type==='submit'){item.value=e.value;if(correct(qs[index],e.value))item.correct=true;else item.errors++;}
 }
 state.index=items.findIndex(i=>!i.correct);state.complete=state.index<0;if(state.complete)state.index=SIZE;
 state.independent=items.filter(i=>i.correct&&!i.errors&&!i.help&&!i.repeated).length;
 state.assisted=items.filter(i=>i.correct&&(i.errors||i.help)).length;
 state.repeated=items.filter(i=>i.repeated).length;
 state.verified=state.finished&&state.mode!=='practice'&&state.independent===SIZE;
 return state;
}
function summaries(catalog,events){
 const prepared={first:firstExposure(events,catalog),bySession:{}};for(const e of order(events)){if(validEvent(e,catalog))(prepared.bySession[e.session]||(prepared.bySession[e.session]=[])).push(e);}
 const sessions={};for(const id of Object.keys(prepared.bySession))sessions[id]=session(catalog,events,id,prepared);
 const result={};for(const r of catalog.routes){const all=Object.values(sessions).filter(s=>s&&s.route===r.id).sort((a,b)=>b.startedAt-a.startedAt||b.id.localeCompare(a.id));const checked=all.filter(s=>s.verified);result[r.id]={verified:checked.length>0,verifiedAt:checked.length?Math.max(...checked.map(s=>s.finishedAt||0)):null,started:all.length>0,latest:all[0]||null,unfinished:all.find(s=>!s.finished)||null,practice:all.some(s=>s.mode==='practice'&&s.finished),checkedSets:['check-a','check-b'].filter(mode=>all.some(s=>s.mode===mode&&s.finished)),sessions:all};}return result;
}
function event(data){return Object.assign({version:VERSION},data);}
return{VERSION,PREFIX,MODES,SIZE,overview,parseNumber,equalNumber,formatProblem,correct,validHref,createCatalog,questions,validEvent,session,summaries,event};
});

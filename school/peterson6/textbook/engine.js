/* Exact, DOM-independent work and progress rules shared by textbook/practice. */
(function(root,factory){'use strict';const api=factory(typeof module==='object'&&module.exports?require('../math.js'):root.PetersonMath);if(typeof module==='object'&&module.exports)module.exports=api;else root.PetersonBook=api;})(typeof globalThis!=='undefined'?globalThis:this,function(M){
'use strict';
const OPS={add:'+',subtract:'−',multiply:'·',divide:':'};
const MAX_PARTS=6000,MAX_TEXT=6000;
function hash(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0).toString(16);}
function exact(node,depth=0){if(depth>40)throw Error('Слишком глубокое выражение');if(typeof node==='string'||typeof node==='number'){const v=M.parse(node);if(!v)throw Error('Неверное число');return v;}if(!node||!OPS[node.op])throw Error('Неизвестное действие');return M.operation(node.op,exact(node.left,depth+1),exact(node.right,depth+1));}
function value(v){const r=M.parse(v);if(!r)throw Error('Неверное число');try{const d=M.decimal(r);if(d.length<18)return d;}catch(_){}return M.format(r);}
function rounded(v,places){if(!Number.isInteger(places)||places< -6||places>8)throw Error('Неверное округление');const r=M.parse(v),n=BigInt(r.n),d=BigInt(r.d),scale=10n**BigInt(Math.abs(places));const a=(n<0n?-n:n)*(places>=0?scale:1n),b=d*(places>=0?1n:scale);let q=a/b;if((a%b)*2n>=b)q++;if(n<0n)q=-q;return M.parse(places>=0?String(q)+'/'+String(scale):String(q*scale));}
function expressionText(node){if(typeof node!=='object')return value(node);return '('+expressionText(node.left)+' '+OPS[node.op]+' '+expressionText(node.right)+')';}
function expressionSteps(node){const out=[],converted=new Set();function visit(n){if(typeof n!=='object'){const raw=String(n),mix=raw.match(/^([+-]?)(\d+)\s+(\d+)\/(\d+)$/);if(mix&&!converted.has(raw)){const a=Number(mix[2]),b=Number(mix[3]),d=Number(mix[4]);converted.add(raw);out.push({kind:'numeric',prompt:'Переведи '+raw+' в неправильную дробь.',answer:M.answer(exact(n)),answerFormat:'improper-fraction',hint:'Умножь целую часть на знаменатель, прибавь числитель. Знаменатель оставь прежним.',explanation:a+' · '+d+' + '+b+' = '+(a*d+b)+'. Получается '+M.format(exact(n))+'.'});}return exact(n);}const a=visit(n.left),b=visit(n.right),r=M.operation(n.op,a,b);out.push({kind:'numeric',prompt:'Вычисли '+value(a)+' '+OPS[n.op]+' '+value(b)+'.',answer:M.answer(r),calculation:{op:n.op,left:M.answer(a),right:M.answer(b)},hint:n.op==='add'||n.op==='subtract'?'Складывать и вычитать можно одинаковые доли. Приведи дроби к общему знаменателю.':n.op==='multiply'?'При умножении дробей перемножают числители и знаменатели. Перед этим можно сократить множители.':'Деление на дробь можно заменить умножением на обратную. Переворачиваем только делитель.',explanation:value(a)+' '+OPS[n.op]+' '+value(b)+' = '+value(r)+'.'});return r;}visit(node);return out;}
function steps(part){
 let list=part.kind==='expression'?expressionSteps(part.expression):(part.steps||[]).map(s=>({...s}));
 if(part.kind==='expression'&&part.rounding){const r=exact(part.expression),p=part.rounding.places,target=rounded(r,p);list.push({kind:'numeric',prompt:'Округли '+value(r)+' '+(p>=0?'до '+p+' знаков после запятой.':'до '+({1:'десятков',2:'сотен',3:'тысяч'}[-p]||('разряда '+10**(-p)))+'.'),answer:M.answer(target),explanation:'Смотри на первую отбрасываемую цифру: 0–4 — оставляем разряд, 5–9 — увеличиваем его на единицу.'});}
 return list.map(s=>({...s,kind:s.kind||(s.answer===undefined?'info':M.parse(s.answer)?'numeric':Array.isArray(s.choices)?'choice':part.kind==='choice'&&part.choices?.includes(s.answer)?'choice':'written'),choices:s.choices||(part.kind==='choice'?part.choices:undefined)}));
}
function finalAnswer(part){if(part.kind==='expression')return M.answer(part.rounding?rounded(exact(part.expression),part.rounding.places):exact(part.expression));return String(part.answer??'');}
function numeric(part){return part.kind==='expression'||part.kind==='numeric';}
function checkNumber(input,answer,format){const text=String(input);if(format==='fraction'&&!/^[+-]?\d+\s*\/\s*\d+$/.test(text.trim().replace(/−/g,'-')))return false;return M.check(text,answer,format);}
function check(part,input){if(numeric(part))return checkNumber(input,finalAnswer(part),part.answerFormat);if(part.kind==='choice')return typeof input==='string'&&part.choices?.includes(input)&&input===part.answer;return false;}
function checkStep(s,input){if(s.kind==='numeric')return checkNumber(input,s.answer,s.answerFormat);if(s.kind==='choice')return typeof input==='string'&&s.choices?.includes(input)&&input===s.answer;return false;}
function signature(part){return hash(JSON.stringify([part.id,part.prompt,part.kind,part.expression,part.rounding,part.answer,part.answerFormat,part.choices?[...part.choices].sort():null,steps(part).map(s=>[s.kind,s.prompt,s.answer,s.answerFormat]) ]));}
function blank(part){return {signature:signature(part),draft:'',note:'',noteOpen:false,stepDrafts:[],checked:[],step:0,guided:false,assisted:false,errors:0,correct:false,independent:false,submitted:false,showSolution:false,stepHelp:{},micro:{},updated:0};}
function cut(v,n=MAX_TEXT){return typeof v==='string'?v.slice(0,n):'';}
function sanitize(part,input){
 const clean=blank(part);if(!input||typeof input!=='object'||Array.isArray(input)||input.signature!==clean.signature)return clean;
 const ss=steps(part);clean.draft=cut(input.draft,MAX_TEXT);clean.note=cut(input.note);clean.noteOpen=input.noteOpen===true;clean.errors=Number.isInteger(input.errors)?Math.max(0,Math.min(10000,input.errors)):0;
 clean.guided=input.guided===true;clean.showSolution=input.showSolution===true;clean.stepDrafts=ss.map((_,i)=>cut(input.stepDrafts?.[i],MAX_TEXT));
 clean.checked=ss.map((s,i)=>checkStep(s,clean.stepDrafts[i])&&input.checked?.[i]===true);
 clean.stepHelp=Object.fromEntries(ss.map((_,i)=>[i,input.stepHelp?.[i]===true]));
 clean.assisted=input.assisted===true||clean.guided||clean.showSolution||Object.values(clean.stepHelp).some(Boolean);
 for(let i=0;i<ss.length;i++){const raw=input.micro?.[i],ms=microSteps(ss[i].calculation);if(!raw||!ms.length)continue;const drafts=ms.map((_,j)=>cut(raw.drafts?.[j],120)),checked=ms.map((m,j)=>raw.checked?.[j]===true&&checkStep(m,drafts[j]));let index=checked.findIndex(v=>!v);if(index<0)index=ms.length-1;clean.micro[i]={drafts,checked,index,open:raw.open===true};clean.assisted=true;}
 // A completed guided step implies guidance even if an edited import omits it.
 if(clean.checked.some(Boolean))clean.assisted=true;
 clean.correct=check(part,clean.draft)&&input.correct===true;
 clean.independent=clean.correct&&!clean.assisted&&clean.errors===0;
 clean.submitted=part.kind==='written'&&clean.draft.trim().length>0&&input.submitted===true;
 clean.step=Number.isInteger(input.step)?Math.max(0,Math.min(ss.length-1,input.step)):0;
 if(!ss.length)clean.step=0;
 const firstOpen=ss.findIndex((s,i)=>(s.kind==='numeric'||s.kind==='choice')&&!clean.checked[i]);
 if(firstOpen>=0)clean.step=Math.min(clean.step,firstOpen);
 clean.updated=Number.isFinite(input.updated)?Math.max(0,input.updated):0;
 return clean;
}
function assist(state){state.assisted=true;state.independent=false;}
function submit(part,state,input){state.draft=cut(String(input));if(part.kind==='written'){state.submitted=!!state.draft.trim();return {ok:state.submitted,manual:true};}const ok=check(part,state.draft);if(!ok){state.errors++;state.independent=false;}state.correct=ok;state.independent=ok&&!state.assisted&&state.errors===0;state.updated=Date.now();return {ok,manual:false};}
function submitStep(part,state,index,input){const ss=steps(part),s=ss[index];if(!s)return false;assist(state);state.stepDrafts[index]=cut(String(input));const ok=checkStep(s,input);if(!ok){state.errors++;return false;}state.checked[index]=true;state.step=Math.min(index+1,ss.length-1);state.updated=Date.now();return true;}
function summarize(parts,states){const result={total:parts.length,independent:0,assisted:0,forReview:0,started:0};for(const part of parts){const s=sanitize(part,states[part.id]);if(s.independent)result.independent++;else if(s.correct)result.assisted++;else if(s.submitted)result.forReview++;else if(s.draft||s.note||s.stepDrafts.some(Boolean))result.started++;}return result;}
function importState(raw,parts,source){if(!raw||raw.schema!==1||raw.source!==source||!raw.parts||typeof raw.parts!=='object'||Array.isArray(raw.parts))throw Error('Это файл другого курса или другой версии.');if(Object.keys(raw.parts).length>MAX_PARTS)throw Error('Слишком большой файл прогресса.');const map=new Map(parts.map(p=>[p.id,p]));for(const id of Object.keys(raw.parts))if(!map.has(id))throw Error('Неизвестный подпункт: '+id);const clean={schema:1,source,parts:{},last:null};for(const [id,p] of map)if(Object.hasOwn(raw.parts,id))clean.parts[id]=sanitize(p,raw.parts[id]);if(raw.last&&map.has(raw.last.partId)&&Number.isInteger(raw.last.number))clean.last={number:raw.last.number,partId:raw.last.partId};return clean;}
function mergeState(current,incoming,parts){const output={...current,parts:{...current.parts}};for(const p of parts){const a=current.parts[p.id],b=incoming.parts[p.id];if(!b)continue;if(!a){output.parts[p.id]=b;continue;}const s=sanitize(p,b.updated>=a.updated?b:a);s.assisted=!!(a.assisted||b.assisted||s.assisted);s.errors=Math.max(a.errors||0,b.errors||0);s.independent=s.correct&&!s.assisted&&s.errors===0;output.parts[p.id]=s;}return output;}
function microSteps(calculation){
 if(!calculation||!OPS[calculation.op])return [];
 const a=M.parse(calculation.left),b=M.parse(calculation.right);if(!a||!b)return [];
 const out=[],put=(prompt,answer,hint)=>out.push({kind:'numeric',prompt,answer:M.answer(answer),hint});
 for(const [label,r] of [['первое число',a],['второе число',b]]){const shown=value(r);if(r.d>1&&!shown.includes('{{')){put('Запиши '+label+' '+shown+' несократимой обыкновенной дробью.',r,'Число десятичных знаков задаёт знаменатель 10, 100, 1000… Затем сократи дробь.');out[out.length-1].answerFormat='reduced-fraction';}}
 if(calculation.op==='add'||calculation.op==='subtract'){
  let x=a.d,y=b.d;while(y){const z=x%y;x=y;y=z;}const den=a.d/x*b.d,an=a.n*(den/a.d),bn=b.n*(den/b.d);
  put('Найди наименьший общий знаменатель для '+M.format(a)+' и '+M.format(b)+'.',den,'Найди НОК знаменателей '+a.d+' и '+b.d+'.');
  put('Приведи первую дробь к знаменателю '+den+'. Какой числитель получится?',an,'Числитель и знаменатель умножают на одно число.');
  put('Приведи вторую дробь к знаменателю '+den+'. Какой числитель получится?',bn,'Раздели новый знаменатель на прежний — это дополнительный множитель.');
  put('Теперь выполни '+an+' '+OPS[calculation.op]+' '+bn+'.',calculation.op==='add'?an+bn:an-bn,'Знаменатель пока остаётся '+den+'.');
 }else{
  if(calculation.op==='divide')put('Запиши дробь, обратную делителю '+M.format(b)+'.',M.operation('divide',1,b),'Поменяй местами числитель и знаменатель только делителя.');
  const bn=calculation.op==='divide'?b.d:b.n,bd=calculation.op==='divide'?b.n:b.d;
  put('После перевода в обычные дроби перемножь числители: '+a.n+' · '+bn+'.',a.n*bn,'Десятичные и смешанные числа сначала переводим в обыкновенные дроби.');
  put('Перемножь знаменатели: '+a.d+' · '+bd+'.',a.d*bd,'Сокращение не меняет значение дроби.');
 }
 put('Сократи результат и запиши число или дробь.',M.operation(calculation.op,a,b),'Раздели числитель и знаменатель на их общий делитель.');return out;
}
return {M,OPS,hash,exact,value,rounded,expressionText,expressionSteps,steps,finalAnswer,check,checkStep,signature,blank,sanitize,assist,submit,submitStep,summarize,importState,mergeState,microSteps,MAX_PARTS};
});

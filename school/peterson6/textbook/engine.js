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
function blank(part){return {signature:signature(part),draft:'',note:'',noteOpen:false,stepDrafts:[],checked:[],step:0,guided:false,assisted:false,errors:0,firstErrors:{steps:{}},correct:false,independent:false,submitted:false,showSolution:false,stepHelp:{},micro:{},updated:0};}
function cut(v,n=MAX_TEXT){return typeof v==='string'?v.slice(0,n):'';}
function firstError(kind,choices,checkFn,value){
 const text=cut(value,120).trim();
 if(!text||kind==='written')return '';
 const valid=kind==='choice'?choices?.includes(text):!!M.parse(text);
 return valid&&!checkFn(text)?text:'';
}
function mergeErrors(target,earlier,later){
 target.firstErrors={steps:{...(later?.steps||{}),...(earlier?.steps||{})}};
 const final=earlier?.final||later?.final;
 if(final)target.firstErrors.final=final;
}
  const commonInputs={
    '045-1':[12,15], '046-1':[6,8], '047-1':[90,70], '047-2':[250,21], '047-3':[6,420],
    '048-a':[125,150], '048-b':[210,2730], '048-v':[35,72], '048-g':[60,75,111]
  };
function sanitize(part,input){
 const clean=blank(part);if(!input||typeof input!=='object'||Array.isArray(input)||(input.signature!==clean.signature&&(!part.previousSignature||input.signature!==part.previousSignature)))return clean;
 const ss=steps(part);
 const wrong=firstError(part.kind,part.choices,v=>check(part,v),input.firstErrors?.final);
 if(wrong)clean.firstErrors.final=wrong;
 for(const [i,step] of ss.entries()){
  const value=firstError(step.kind,step.choices,v=>checkStep(step,v),input.firstErrors?.steps?.[i]);
  if(value)clean.firstErrors.steps[i]=value;
 }
 if(/^(01[123]|02[23]|038)-/.test(part.id)&&part.expression&&Number.isInteger(input.decimalView)&&input.decimalView>0){
  const operands=[part.expression.left,part.expression.right].map(v=>String(v).replace(',','.').split('.'));
  const limit=/^(013|023|038)-/.test(part.id)?ss.length:Math.max(...operands.map(x=>x[0].length))+Math.max(...operands.map(x=>x[1]?.length||0));
  if(input.decimalView<=limit)clean.decimalView=input.decimalView;
 }
 if(/^016-[a-z]+$/.test(part.id)&&Number.isInteger(input.fractionView)&&input.fractionView>0&&input.fractionView<=3)clean.fractionView=input.fractionView;
 if(/^(019|020|021|026|027|028|029|039|040)-/.test(part.id)||/^03[56]-pravilo$/.test(part.id)){
  for(const key of ['logicLeft','logicRight'])if(Number.isInteger(input[key])&&input[key]>=1&&input[key]<=3)clean[key]=input[key];
  if(input.logicReference===true)clean.logicReference=true;
  if((/^(02[6789]|039|040)-/.test(part.id)||/^03[56]-pravilo$/.test(part.id))&&typeof input.logicOther==='string'&&input.logicOther)clean.logicOther=cut(input.logicOther,600);
 }
 if((part.id==='025-1'||part.id==='025-2')&&typeof input.puzzleDigits==='string'&&input.puzzleDigits.length===(part.id==='025-1'?6:7)&&/^[0-9-]+$/.test(input.puzzleDigits))clean.puzzleDigits=input.puzzleDigits;
 if(part.id==='038-termin'&&typeof input.cipherMeaning==='string'&&input.cipherMeaning)clean.cipherMeaning=cut(input.cipherMeaning,600);
 if(part.id==='038-termin'&&typeof input.cipherLetters==='string'&&/^[МОРЕСТДАКИЛЬ]{1,12}$/.test(input.cipherLetters)&&new Set(input.cipherLetters).size===input.cipherLetters.length)clean.cipherLetters=input.cipherLetters;
 if(part.id==='022-slovo'&&typeof input.cipherLetters==='string'&&/^[РУНОЕДГБИЖАКТЯС]{1,15}$/.test(input.cipherLetters)&&new Set(input.cipherLetters).size===input.cipherLetters.length)clean.cipherLetters=input.cipherLetters;
 if(/^03[56]-[a-z]$/.test(part.id)){
  if(Number.isInteger(input.periodStep)&&input.periodStep>=1&&input.periodStep<=8)clean.periodStep=input.periodStep;
  for(const key of ['periodDigit','periodRem','periodNotation','periodApprox'])if(typeof input[key]==='string'&&input[key])clean[key]=cut(input[key],60);
  if(input.periodError===true)clean.periodError=true;
 }
 if(/^(039|040)-/.test(part.id)){
  if(Number.isInteger(input.formulaInput)&&input.formulaInput>=-3&&input.formulaInput<=14)clean.formulaInput=input.formulaInput;
  if(Number.isInteger(input.formulaRemainder)&&input.formulaRemainder>=0&&input.formulaRemainder<3)clean.formulaRemainder=input.formulaRemainder;
 }
 if(/^04[234]-/.test(part.id)){
  const allowed=part.id.startsWith('044-')?[315,79,8181,490,102]:[0,1,2,3,4,5,6,7,8,9];
  if(allowed.includes(input.filterProbe))clean.filterProbe=input.filterProbe;
  if(input.filterDivision===true&&clean.filterProbe!==undefined)clean.filterDivision=true;
  if(Array.isArray(input.filterItems)&&input.filterItems.length<=allowed.length)clean.filterItems=[...new Set(input.filterItems.filter(v=>allowed.includes(v)))].sort((a,b)=>a-b);
  if(input.filterEmpty===true&&!clean.filterItems?.length)clean.filterEmpty=true;
 }
 if(part.id.startsWith('049-')){
  if(['front','side','base'].includes(input.boxFace))clean.boxFace=input.boxFace;
  if(!part.expression&&['abc','xyh'].includes(input.boxNames))clean.boxNames=input.boxNames;
  if(Array.isArray(input.boxEntries)&&input.boxEntries.length===2)clean.boxEntries=input.boxEntries.map((v,i)=>typeof v==='string'?cut(v,i===1&&!part.expression?360:90):'');
 }
 if(Object.hasOwn(commonInputs,part.id)){
  const ns=commonInputs[part.id],allowed=[2,3,5,7,11,13,17,19,23,29,31,37],nFields=part.id.startsWith('045')||part.id.startsWith('046')?4:2;
  if(Number.isInteger(input.primeRow)&&input.primeRow>=0&&input.primeRow<ns.length)clean.primeRow=input.primeRow;
  if(Array.isArray(input.primePaths)&&input.primePaths.length===ns.length){
   const rows=input.primePaths.map((xs,i)=>{let left=ns[i];if(!Array.isArray(xs)||xs.length>12)return [];for(const p of xs){if(!allowed.includes(p)||left%p)return [];left/=p;}return [...xs];});
   clean.primePaths=rows;
  }
  if(allowed.includes(input.primeRejected)){const row=clean.primeRow||0,left=ns[row]/(clean.primePaths?.[row]||[]).reduce((v,d)=>v*d,1);if(left>1&&left%input.primeRejected)clean.primeRejected=input.primeRejected;}
  if(input.primeHint===true)clean.primeHint=true;
  if(Array.isArray(input.commonEntries)&&input.commonEntries.length===nFields)clean.commonEntries=input.commonEntries.map(x=>typeof x==='string'?cut(x,150):'');
 }
 if(part.id==='041-1'){
  if(typeof input.factorValue==='string'&&input.factorValue)clean.factorValue=cut(input.factorValue,50);
  if(Number.isInteger(input.factorMask)&&input.factorMask>=0&&input.factorMask<8)clean.factorMask=input.factorMask;
  if(Array.isArray(input.divisorBasket)&&input.divisorBasket.length<=8)clean.divisorBasket=[...new Set(input.divisorBasket.filter(n=>Number.isInteger(n)&&n>0&&42%n===0))].sort((a,b)=>a-b);
 }
 if(part.id.startsWith('037-')){
  if(['outline','area','cuts'].includes(input.geometryView))clean.geometryView=input.geometryView;
  if(['a','b','x','m'].includes(input.squareSide))clean.squareSide=input.squareSide;
  for(const key of ['perimeterChoice','areaChoice'])if(Number.isInteger(input[key])&&input[key]>=1&&input[key]<=3)clean[key]=input[key];
  if(Array.isArray(input.geometryNumbers)&&input.geometryNumbers.length===3)clean.geometryNumbers=input.geometryNumbers.map(v=>cut(v,50));
 }
 if(part.id.startsWith('034-')){
  if(typeof input.calcExact==='string'&&input.calcExact)clean.calcExact=cut(input.calcExact,80);
  if(typeof input.calcDigit==='string'&&/^[0-9]$/.test(input.calcDigit))clean.calcDigit=input.calcDigit;
  if(input.calcChecked===true)clean.calcChecked=true;
 }
 if(part.id.startsWith('033-')){
  for(const key of ['precisionLow','precisionHigh','precisionRounded'])if(typeof input[key]==='string'&&input[key])clean[key]=cut(input[key],50);
  if(['left','right'].includes(input.precisionMark))clean.precisionMark=input.precisionMark;
 }
 if(part.id.startsWith('031-')){
  const bounds={'031-a':[14,19],'031-b':[2,9],'031-v':[1,3],'031-g':[4,7]}[part.id];
  if(bounds&&Array.isArray(input.integerSet)&&input.integerSet.length<=10)clean.integerSet=[...new Set(input.integerSet.filter(n=>Number.isInteger(n)&&n>=bounds[0]&&n<=bounds[1]))].sort((a,b)=>a-b);
  if(input.integerEmpty===true&&!clean.integerSet?.length)clean.integerEmpty=true;
 }
 if(part.id==='032-1'){
  if(Array.isArray(input.intervalSamples)&&input.intervalSamples.length===3)clean.intervalSamples=input.intervalSamples.map(v=>cut(v,50));
  if([1000,10000].includes(input.intervalCount))clean.intervalCount=input.intervalCount;
  if([100,1000,10000,100000,1000000].includes(input.intervalDen))clean.intervalDen=input.intervalDen;
 }
 if(part.id.startsWith('030-')){
  if(typeof input.flowValue==='string'&&input.flowValue)clean.flowValue=cut(input.flowValue,80);
  if(['yes','no'].includes(input.flowBranch))clean.flowBranch=input.flowBranch;
  if(input.flowChecked===true)clean.flowChecked=true;
 }
 if(part.id.startsWith('029-'))for(const key of ['divisorM','divisorN'])if(Number.isInteger(input[key])&&input[key]>=1&&input[key]<=100)clean[key]=input[key];
 if(part.id==='018-1'){
  if(Number.isInteger(input.planetRelation)&&input.planetRelation>=1&&input.planetRelation<=4)clean.planetRelation=input.planetRelation;
  if(Number.isInteger(input.earthZone)&&input.earthZone>=1&&input.earthZone<=5)clean.earthZone=input.earthZone;
 }
 clean.draft=cut(input.draft,MAX_TEXT);clean.note=cut(input.note);clean.noteOpen=input.noteOpen===true;clean.errors=Number.isInteger(input.errors)?Math.max(0,Math.min(10000,input.errors)):0;
 clean.errors=Math.max(clean.errors,Object.keys(clean.firstErrors.steps).length+(clean.firstErrors.final?1:0));
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
function submit(part,state,input){state.draft=cut(String(input));if(part.kind==='written'){state.submitted=!!state.draft.trim();return {ok:state.submitted,manual:true};}const ok=check(part,state.draft);if(!ok){
 const wrong=firstError(part.kind,part.choices,v=>check(part,v),state.draft);
 if(wrong){state.errors++;if(!state.firstErrors.final)state.firstErrors.final=wrong;}
 state.independent=false;}state.correct=ok;state.independent=ok&&!state.assisted&&state.errors===0;state.updated=Date.now();return {ok,manual:false};}
function submitStep(part,state,index,input){const ss=steps(part),s=ss[index];if(!s)return false;assist(state);state.stepDrafts[index]=cut(String(input));const ok=checkStep(s,input);if(!ok){
 const wrong=firstError(s.kind,s.choices,v=>checkStep(s,v),input);
 if(wrong){state.errors++;if(!state.firstErrors.steps[index])state.firstErrors.steps[index]=wrong;}
 return false;}state.checked[index]=true;state.step=Math.min(index+1,ss.length-1);state.updated=Date.now();return true;}
function solutionOutcome(work) {
 if (!work.correct) return null;
 if (work.assisted) return 'assisted';
 return work.errors > 0 ? 'corrected' : 'independent';
}
function summarize(parts, states) {
 const result = {total: parts.length, independent: 0, corrected: 0, assisted: 0, forReview: 0, started: 0};
 for (const part of parts) {
  const work = sanitize(part, states[part.id]);
  const outcome = solutionOutcome(work);
  if (outcome) result[outcome]++;
  else if (work.submitted) result.forReview++;
  else if (work.draft || work.note || work.stepDrafts.some(Boolean)) result.started++;
 }
 return result;
}
function importState(raw,parts,source){if(!raw||raw.schema!==1||raw.source!==source||!raw.parts||typeof raw.parts!=='object'||Array.isArray(raw.parts))throw Error('Это файл другого курса или другой версии.');if(Object.keys(raw.parts).length>MAX_PARTS)throw Error('Слишком большой файл прогресса.');const map=new Map(parts.map(p=>[p.id,p]));for(const id of Object.keys(raw.parts))if(!map.has(id))throw Error('Неизвестный подпункт: '+id);const clean={schema:1,source,parts:{},last:null};for(const [id,p] of map)if(Object.hasOwn(raw.parts,id))clean.parts[id]=sanitize(p,raw.parts[id]);if(raw.last&&map.has(raw.last.partId)&&Number.isInteger(raw.last.number))clean.last={number:raw.last.number,partId:raw.last.partId};return clean;}
function mergeState(current,incoming,parts){const output={...current,parts:{...current.parts}};for(const p of parts){const a=current.parts[p.id],b=incoming.parts[p.id];if(!b)continue;if(!a){output.parts[p.id]=b;continue;}const s=sanitize(p,b.updated>=a.updated?b:a);s.assisted=!!(a.assisted||b.assisted||s.assisted);s.errors=Math.max(a.errors||0,b.errors||0);mergeErrors(s,a.firstErrors,b.firstErrors);s.independent=s.correct&&!s.assisted&&s.errors===0;output.parts[p.id]=s;}return output;}
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
return {M,OPS,commonInputs,hash,exact,value,rounded,expressionText,expressionSteps,steps,finalAnswer,check,checkStep,signature,blank,sanitize,mergeErrors,assist,submit,submitStep,solutionOutcome,summarize,importState,mergeState,microSteps,MAX_PARTS};
});

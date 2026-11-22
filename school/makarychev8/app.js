(function () {
'use strict';
const D=window.MakarychevCourse, M=window.PetersonMath, main=document.getElementById('main');
if(!D||!M){main.innerHTML='<div class="error-page"><h1>Не все файлы курса загрузились</h1><p>Обновите страницу. Для работы без интернета распакуйте весь архив курса в одну папку.</p></div>';return;}
const KEY='mathexam.makarychev8.2024.v1', blank=()=>({version:1,tasks:{},practice:{},last:null,origin:null});
const boardMode=document.body.dataset.courseBoard==='makarychev8' && location.pathname==='/trainers/makarychev8.html';
const sharedMode=boardMode || window.self!==window.top;
let state=blank(), writable=!sharedMode, cleanup=null, active=null;
const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function fmt(v){
 const power=s=>s.replace(/\^\(([a-zA-Z0-9+−-]+)\)|\^([a-zA-Z]|\d+)/g,(_,a,b)=>'<sup>'+(a||b)+'</sup>');
 return e(v).split(/(\{\{(?:mix|frac):[^{}]+\}\})/g).map(s=>{
  let m=/^\{\{mix:([−\-\d]+):([\d]+):([\d]+)\}\}$/.exec(s);
  if(m)return '<span class="mixed">'+m[1]+'<span class="fra"><span>'+m[2]+'</span><span>'+m[3]+'</span></span></span>';
  m=/^\{\{frac:([^{}:]+):([^{}]+)\}\}$/.exec(s);
  if(m)return '<span class="fra" role="math" aria-label="('+m[1]+') разделить на ('+m[2]+')"><span>'+power(m[1])+'</span><span>'+power(m[2])+'</span></span>';
  return power(s);
 }).join('').replace(/\n/g,'<br>');
}
function textbookFormula(expression){
 // Every leaf is escaped; the tree contains only the seven supported operations.
 const priority={ '=':0,'+':1,'-':1,'*':2,'/':2,neg:3,'^':4,abs:5 };
 function render(node,parent=-1,right=false){
  if(!Array.isArray(node)){
   const numeric=/^\d+(?:\.\d+)?$/.test(node);
   return numeric?'<mn>'+e(String(node).replace('.',','))+'</mn>':'<mi>'+e(node)+'</mi>';
  }
  const [op,left,rhs]=node,rank=priority[op];
  const wrap=content=>'<mrow><mo>(</mo>'+content+'<mo>)</mo></mrow>';
  if(op==='/')return '<mfrac>'+render(left)+render(rhs)+'</mfrac>';
  if(op==='sqrt')return '<msqrt>'+render(left)+'</msqrt>';
  if(op==='abs')return '<mrow><mo>|</mo>'+render(left)+'<mo>|</mo></mrow>';
  let output;
  if(op==='^')output='<msup>'+render(left,rank)+render(rhs)+'</msup>';
  else if(op==='neg')output='<mrow><mo>−</mo>'+render(left,rank)+'</mrow>';
  else output='<mrow>'+render(left,rank)+'<mo>'+({'+':'+','-':'−','*':'·','=':'='}[op])+'</mo>'+render(rhs,rank,op==='-')+'</mrow>';
  return rank<parent||(right&&rank===parent)?wrap(output):output;
 }
 return '<div class="m8-exercise-formula" tabindex="0" aria-label="Формула задания"><math xmlns="http://www.w3.org/1998/Math/MathML" display="block">'+render(expression)+'</math></div>';
}
const extraPractice=window.MakarychevModels?.quadraticPractice;
const formulaPractice=window.MakarychevModels?.formulaPractice;
const storyPractice=window.MakarychevModels?.storyPractice;
const vietaPractice=window.MakarychevModels?.vietaPractice;
const trinomialPractice=window.MakarychevModels?.trinomialPractice;
const factorsPractice=window.MakarychevModels?.factorsPractice;
const rationalEquationPractice=window.MakarychevModels?.rationalEquationPractice;
const ratePractice=window.MakarychevModels?.ratePractice;
const planePractice=window.MakarychevModels?.planePractice;
const systemPractice=window.MakarychevModels?.systemPractice;
const graphicPractice=window.MakarychevModels?.graphicPractice;
const substitutionPractice=window.MakarychevModels?.substitutionPractice;
const balancePractice=window.MakarychevModels?.balancePractice;
const parameterPractice=window.MakarychevModels?.parameterPractice;
const squarePractice=window.MakarychevModels?.squarePractice;
const appliedPractice=window.MakarychevModels?.appliedPractice;
const invariantPractice=window.MakarychevModels?.invariantPractice;
const fractionDomainPractice=window.MakarychevModels?.fractionDomainPractice;
const {mixturePractice,jointPractice,inequalityPractice,orderPractice,boundsPractice,combinedPractice,setPractice,axisPractice,rayPractice,casePractice,intersectionPractice,rootLocationPractice,proofPractice,functionPractice,domainPractice,graphReadingPractice,shapePractice,behaviorPractice,tripReviewPractice,phasePractice,curvePractice,witnessPractice,functionZeroPractice,review43Practice,review43Skills=[]}=window.MakarychevModels||{};
const auditPractice=window.MakarychevModels?.auditPractice;
const skillCatalogue=[...M.skills,...[extraPractice,formulaPractice,storyPractice,vietaPractice,trinomialPractice,factorsPractice,rationalEquationPractice,ratePractice,planePractice,systemPractice,graphicPractice,substitutionPractice,balancePractice,parameterPractice,squarePractice,appliedPractice,invariantPractice,fractionDomainPractice,auditPractice,mixturePractice,jointPractice,inequalityPractice,orderPractice,boundsPractice,combinedPractice,setPractice,axisPractice,rayPractice,casePractice,intersectionPractice,rootLocationPractice,proofPractice,functionPractice,domainPractice,graphReadingPractice,shapePractice,behaviorPractice,tripReviewPractice,phasePractice,curvePractice,witnessPractice,functionZeroPractice,review43Practice,...review43Skills].filter(Boolean)];
const byId=Object.fromEntries(D.lessons.map(l=>[l.id,l])), skills=Object.fromEntries(skillCatalogue.map(s=>[s.id,s])), taskById=Object.fromEntries(D.lessons.flatMap(l=>l.tasks.map(t=>[t.id,t])));

function record(v){return !!v&&typeof v==='object'&&!Array.isArray(v);}
function taskSignature(t){return t.prompt+(t.mathExpression?'\u241f'+JSON.stringify(t.mathExpression):'')+'\u241f'+t.answer+'\u241f'+(t.answerFormat||'');}
function generatePractice(id,seed,level){
 if(id===extraPractice?.id)return window.MakarychevModels.practiceQuadratic(seed,level);
 if(id===mixturePractice?.id)return window.MakarychevModels.practiceMixture(seed,level);
 if(id===proofPractice?.id)return window.MakarychevModels.practiceProofEstimate(seed,level);
 if(review43Skills.some(s=>s.id===id))return window.MakarychevModels.extraReview43(id,seed,level);
 if(id===review43Practice?.id)return window.MakarychevModels.practiceReview43(seed,level);
 if(id===functionZeroPractice?.id)return window.MakarychevModels.practiceFunctionZero(seed,level);
 if(id===witnessPractice?.id)return window.MakarychevModels.practiceWitness(seed,level);
 if(id===curvePractice?.id)return window.MakarychevModels.practiceCurveProperties(seed,level);
 if(id===phasePractice?.id)return window.MakarychevModels.practicePhases(seed,level);
 if(id===tripReviewPractice?.id)return window.MakarychevModels.practiceTripEquation(seed,level);
 if(id===behaviorPractice?.id)return window.MakarychevModels.practiceBehavior(seed,level);
 if(id===shapePractice?.id)return window.MakarychevModels.practiceShapes(seed,level);
 if(id===graphReadingPractice?.id)return window.MakarychevModels.practiceReadings(seed,level);
 if(id===domainPractice?.id)return window.MakarychevModels.practiceDomain(seed,level);
 if(id===functionPractice?.id)return window.MakarychevModels.practiceFunction(seed,level);
 if(id===rootLocationPractice?.id)return window.MakarychevModels.practiceRootLocations(seed,level);
 if(id===intersectionPractice?.id)return window.MakarychevModels.practiceIntersection(seed,level);
 if(id===casePractice?.id)return window.MakarychevModels.practiceCase(seed,level);
 if(id===rayPractice?.id)return window.MakarychevModels.practiceRay(seed,level);
 if(id===axisPractice?.id)return window.MakarychevModels.practiceAxis(seed,level);
 if(id===setPractice?.id)return window.MakarychevModels.practiceSets(seed,level);
 if(id===combinedPractice?.id)return window.MakarychevModels.practiceCombined(seed,level);
 if(id===boundsPractice?.id)return window.MakarychevModels.practiceBounds(seed,level);
 if(id===orderPractice?.id)return window.MakarychevModels.practiceOrder(seed,level);
 if(id===inequalityPractice?.id)return window.MakarychevModels.practiceInequality(seed,level);
 if(id===jointPractice?.id)return window.MakarychevModels.practiceJoint(seed,level);
 if(id===auditPractice?.id)return window.MakarychevModels.practiceRationalAudit(seed,level);
 if(id===fractionDomainPractice?.id)return window.MakarychevModels.practiceFractionDomain(seed,level);
 if(id===invariantPractice?.id)return window.MakarychevModels.practiceInvariants(seed,level);
 if(id===appliedPractice?.id)return window.MakarychevModels.practiceAppliedReview(seed,level);
 if(id===squarePractice?.id)return window.MakarychevModels.practiceCertificate(seed,level);
 if(id===parameterPractice?.id)return window.MakarychevModels.practiceParameter(seed,level);
 if(id===balancePractice?.id)return window.MakarychevModels.practiceBalance(seed,level);
 if(id===substitutionPractice?.id)return window.MakarychevModels.practiceSubstitution(seed,level);
 if(id===graphicPractice?.id)return window.MakarychevModels.practiceGraphical(seed,level);
 if(id===systemPractice?.id)return window.MakarychevModels.practiceSystem(seed,level);
 if(id===planePractice?.id)return window.MakarychevModels.practicePlane(seed,level);
 if(id===ratePractice?.id)return window.MakarychevModels.practiceRates(seed,level);
 if(id===rationalEquationPractice?.id)return window.MakarychevModels.practiceRationalEquation(seed,level);
 if(id===factorsPractice?.id)return window.MakarychevModels.practiceFactors(seed,level);
 if(id===trinomialPractice?.id)return window.MakarychevModels.practiceTrinomial(seed,level);
 if(id===vietaPractice?.id)return window.MakarychevModels.practiceVieta(seed,level);
 if(id===storyPractice?.id)return window.MakarychevModels.practiceStory(seed,level);
 if(id===formulaPractice?.id)return window.MakarychevModels.practiceFormula(seed,level);
 return M.generate(id,seed,level);
}
function resolveTask(id){if(Object.prototype.hasOwnProperty.call(taskById,id))return taskById[id];const m=/^practice:([a-z-]+):([123]):(\d+)$/.exec(id);if(!m||!skills[m[1]])return null;const seed=Number(m[3]);if(!Number.isSafeInteger(seed)||seed<1||seed>=1000000)return null;try{const t=generatePractice(m[1],seed,Number(m[2]));t.id=id;return t;}catch(_){return null;}}
function validRoute(hash){if(typeof hash!=='string')return null;let m=/^#lesson\/(p\d{2})(?:\/(\d+))?$/.exec(hash);if(m&&byId[m[1]]){const i=Number(m[2]||0);return i<byId[m[1]].tasks.length?'#lesson/'+m[1]+'/'+i:null;}m=/^#practice\/([a-z-]+)\/([123])$/.exec(hash);return m&&skills[m[1]]?hash:null;}
function sanitizeTask(raw,t){const safe=fresh();if(!record(raw))return safe;for(const k of ['value','note','feedback'])if(typeof raw[k]==='string')safe[k]=raw[k].slice(0,15000);for(const k of ['guided','assisted','hint'])safe[k]=raw[k]===true;safe.attempts=Number.isSafeInteger(raw.attempts)?Math.max(0,Math.min(1000000,raw.attempts)):0;safe.values=Array.isArray(raw.values)?raw.values.slice(0,t.steps.length).map(v=>typeof v==='string'?v.slice(0,1000):''):[];for(const k of ['stepHints','reveals'])if(record(raw[k]))for(const [i,v] of Object.entries(raw[k]))if(/^\d{1,2}$/.test(i)&&Number(i)<t.steps.length&&v===true)safe[k][i]=true;
 const target=Number.isInteger(raw.step)?Math.max(0,Math.min(t.steps.length,raw.step)):0;while(safe.step<target&&check(safe.values[safe.step]||'',t.steps[safe.step]))safe.step++;
 safe.correct=raw.correct===true&&check(safe.value,t);
 const help=safe.assisted||safe.guided||safe.hint||Object.keys(safe.stepHints).length>0||Object.keys(safe.reveals).length>0||safe.step>0;
 const c=raw.completion,hasCompletion=safe.correct&&record(c)&&Number.isInteger(c.attempts)&&c.attempts>=1&&c.attempts<=1000000&&typeof c.assisted==='boolean';
 safe.provenanceKnown=raw.provenanceKnown!==false&&(typeof raw.assisted==='boolean'||hasCompletion);
 if(hasCompletion){safe.attempts=c.attempts;safe.assisted=c.assisted;safe.independent=c.independent===true&&!c.assisted&&c.attempts===1;}else{safe.assisted=help;safe.independent=safe.correct&&raw.independent===true&&raw.assisted===false&&!help&&safe.attempts===1;}
 if(!safe.provenanceKnown)safe.independent=false;
 if(safe.correct){safe.completion={attempts:safe.attempts,assisted:safe.assisted,independent:safe.independent};if(hasCompletion&&Number.isSafeInteger(c.at)&&c.at>0&&c.at<=Date.now())safe.completion.at=c.at;}
 safe.firstAttempt=sanitizeFirstAttempt(raw.firstAttempt,t);safe.events=sanitizeEvents(raw.events,t);safe.investigation=sanitizeInvestigation(raw.investigation);
 if(record(raw.stepAttempts))for(const [i,v]of Object.entries(raw.stepAttempts))if(/^\d{1,2}$/.test(i)&&Number(i)<t.steps.length&&Number.isSafeInteger(v)&&v>0)safe.stepAttempts[i]=Math.min(v,1000000);
 if(t.id.startsWith('practice:'))safe.signature=taskSignature(t);
 return safe;
}
function sanitizeState(raw){if(!record(raw)||raw.version!==1||!record(raw.tasks)||!record(raw.practice))throw Error('Неподдерживаемый формат сохранения.');const safe=blank(),seen=new Set();for(const [id,taskState] of Object.entries(raw.tasks)){const t=resolveTask(id);if(!t)continue;const r=sanitizeTask(taskState,t);if(r.signature){r.repeated=seen.has(r.signature);seen.add(r.signature);if(r.repeated){r.independent=false;if(r.completion)r.completion.independent=false;}}safe.tasks[id]=r;}for(const [key,p]of Object.entries(raw.practice)){const m=/^([a-z-]+):([123])$/.exec(key);if(m&&skills[m[1]]&&record(p)&&Number.isSafeInteger(p.seed)&&p.seed>=1&&p.seed<1000000)safe.practice[key]={seed:p.seed};}const last=validRoute(raw.last?.hash);if(last)safe.last={hash:last};const origin=validRoute(raw.origin?.hash);if(origin&&origin.startsWith('#lesson/'))safe.origin={hash:origin,scroll:Number.isFinite(raw.origin.scroll)?Math.max(0,Math.min(10000000,raw.origin.scroll)):0};return safe;}
function boardEntry(){
 if(sharedMode || location.protocol==='file:')return '';
 const url='/trainers/trainer-board.html?trainer='+encodeURIComponent('/trainers/makarychev8.html'+(location.hash||'#home'));
 return '<a class="button quiet" href="'+e(url)+'">Открыть на общей доске</a>';
}
function markAssisted(s,reason='help'){if(!s.correct){s.assisted=true;recordEvent(s,reason);}}
function sanitizeFirstAttempt(raw,t){return record(raw)&&typeof raw.value==='string'&&typeof raw.correct==='boolean'&&Number.isSafeInteger(raw.at)&&raw.at>0&&raw.at<=Date.now()?{value:raw.value.slice(0,1000),correct:raw.correct&&check(raw.value,t),at:raw.at}:null;}
function sanitizeEvents(raw,t){return Array.isArray(raw)?raw.slice(-40).filter(v=>record(v)&&['answer','step','prediction','help','hint','guided','step-hint','reveal','model','detour'].includes(v.type)&&Number.isSafeInteger(v.at)&&v.at>0&&v.at<=Date.now()).map(v=>({type:v.type,at:v.at,value:typeof v.value==='string'?v.value.slice(0,1000):'',correct:v.correct===true&&((v.type==='answer'&&check(v.value,t))||(v.type==='step'&&!!t.steps[v.step]&&check(v.value,t.steps[v.step]))),step:Number.isInteger(v.step)&&v.step>=0&&v.step<100?v.step:null})):[];}
function sanitizeInvestigation(raw){if(!record(raw)||!Object.keys(raw).length)return {};const clean={};for(const key of ['started','changed','explained'])clean[key]=raw[key]===true;for(const key of ['prediction','explanation'])if(Number.isInteger(raw[key])&&raw[key]>=0&&raw[key]<2)clean[key]=raw[key];if(typeof raw.observation==='string')clean.observation=raw.observation.slice(0,2000);if(Array.isArray(raw.parameters))clean.parameters=raw.parameters.slice(0,8).map(v=>typeof v==='string'?v.slice(0,40):'');clean.explanationAttempts=Number.isSafeInteger(raw.explanationAttempts)?Math.max(0,Math.min(1000,raw.explanationAttempts)):0;return clean;}
function recordEvent(s,type,value='',correct=false,step=null){s.events=(s.events||[]).concat({type,at:Date.now(),value:String(value).slice(0,1000),correct,step}).slice(-40);}
function learningLabel(s){return !s.correct?'Ещё решаем':!s.provenanceKnown?'Способ решения неизвестен':s.repeated?'Знакомое условие':s.independent?'Самостоятельно':s.assisted?'С помощью':'Исправлено после ошибки';}
function isNumericPair(value,q){
 if(q.kind&&q.kind!=='number')return false;
 const text=String(value).trim();
 return /^(?:±|\+\/-)/.test(text)&&window.MakarychevCheck.setEntries(text)?.length===2;
}
function formatProblem(value,q){
 if(check(value,q))return '';
 const text=String(value).trim(),message='Запись пока не распознана. '+inputNote(q)+' Это уточнение записи, а не математическая попытка.';
 if(!q.kind||['number','square-equation-example'].includes(q.kind)){
  if(isNumericPair(text,q))return '';
  if(!M.parse(text))return message;
  if(q.answerFormat&&!M.check(text,text,q.answerFormat))return 'Уточни форму записи. '+inputNote(q)+' Математическая попытка ещё не засчитана.';
 }
 if(q.kind==='rational-example'&&!M.parse(text)&&!window.MakarychevCheck.check(text,{kind:'irrational-example'}))return message;
 if(['root-points','graph-values','interval-examples'].includes(q.kind)){
  const entries=text.split(';'),count=q.kind==='interval-examples'?q.exampleCount:String(q.answer).split(';').length;
  if(entries.length!==count||entries.some(v=>!M.parse(v)))return message;
 }
 if(q.kind==='trip-table'&&!window.MakarychevTaskGraphs.domainCoefficients(text,4))return message;
 if(q.kind==='behavior-table'&&!window.MakarychevTaskGraphs.domainCoefficients(text,q.graph.xs.length))return message;
 if(q.kind==='feature-points'&&!window.MakarychevTaskGraphs.domainCoefficients(text,q.graph.constructionXs.length))return message;
 if(q.kind==='feature-coefficients'&&!window.MakarychevTaskGraphs.domainCoefficients(text,2))return message;
 if(q.kind==='positive-probe'&&!M.parse(text))return message;
 if(['domain-family','reciprocal-hole'].includes(q.kind)&&!window.MakarychevTaskGraphs.domainCoefficients(text,q.kind==='domain-family'?4:3))return message;
 if(q.kind==='root-line-count'&&!window.MakarychevTaskGraphs?.parseLine(text))return message;
 if(q.kind==='irrational-example'){
  const normalized=window.MakarychevCheck.normalize(text);
  if(!M.parse(text)&&normalized!=='π'&&!/^√(?:\(-?\d+\)|-?\d+)$/.test(normalized))return message;
 }
 if(q.kind==='graph'||q.kind==='graph-pair'){
  const graphs=window.MakarychevTaskGraphs;
  const parsed=q.kind==='graph'?graphs?.parse(text):graphs?.parsePair(text);
  if(parsed)return '';
  const entries=text.split(';').map(v=>v.trim());
  if(entries.some(v=>!M.parse(v))||(q.kind==='graph-pair'?entries.length!==4:entries.length<3))return message;
 }
 if(q.kind==='graph-estimates'){
  const entries=text.split(';');
  if(entries.length>q.rootValues.length||entries.some(value=>!M.parse(value)&&!/[√]|sqrt\(/.test(value)))return message;
 }
 if(q.kind==='proof-chain'&&!window.MakarychevCheck.proofOrder(text,q.proofClaims.length))return 'Нажми на утверждения или запиши их номера по одному. Каждый номер можно использовать один раз.';
 if(q.kind==='domain-fraction'&&window.MakarychevCheck.inspectDomainFraction(text,q.exclusions).status==='format')return 'Введи одну дробь вида (числитель)/(знаменатель). В скобках можно писать многочлены с переменной x.';
 if(q.kind==='integer-pairs'&&!window.MakarychevTaskGraphs.parseIntegerPairs(text))return 'Запиши каждую пару в круглых скобках. После первой координаты поставь точку с запятой. Несколько пар можно разделить запятыми.';
 if(q.kind==='line-sign-example'){
  const values=text.split(';');
  if(values.length!==2||values.some(part=>!M.parse(part))||!window.MakarychevTaskGraphs?.parseLine(text))return message;
 }
 if(['three-solutions','equation-point-example','construct-lines'].includes(q.kind)&&!window.MakarychevCheck.pointGroups(text))return message;
 if(q.kind==='line-pair-equation'&&window.MakarychevCheck.equationPlaneStatus(text,q.answer)==='format')return message;
 if(q.kind==='algebra-pairs'&&!window.MakarychevCheck.algebraPairs(text))return q.inputNote||message;
 if(q.kind==='graph-root-reading'&&!window.MakarychevCheck.graphRootEntries(text))return inputNote(q);
 if(q.kind==='ordered-coordinates'&&!window.MakarychevTaskGraphs.coordinateEvidence(text,q.coordinateSymbols,q.coordinateOrder,q.coordinateBounds))return 'Введи по одной рациональной координате на каждую букву, через точку с запятой.';
 if(q.kind==='ordered-comparison-sample'&&(text.split(';').length!==2||text.split(';').some(v=>!M.parse(v.trim()))))return 'Введи два рациональных числа a; b.';
 if(q.kind==='transformed-order'&&!window.MakarychevCheck.orderInput(text,q))return q.numericSides?'Введи два вычисленных числа и знак < или > между ними.':'Введи два алгебраических выражения и знак < или > между ними.';
 if(q.kind==='inequality-counterexample'&&!/^(всегда|да)$/i.test(text.trim())&&!M.parse(text))return q.inputNote||'Введи рациональный контрпример.';
 if(q.kind==='source-domain-sample'&&(String(text).split(';').length!==q.probeCount||String(text).split(';').some(v=>!M.parse(v.trim()))))return q.inputNote||'Введи по одному рациональному числу для каждой переменной.';
 if(q.kind==='unique-system-triple'&&!window.MakarychevCheck.systemTriple(text))return q.inputNote;
 if(q.kind==='fraction-sample'&&!window.MakarychevTaskGraphs.fractionSample(text,q.probeCount))return 'Требуется '+(q.probeCount===2?'пара рациональных чисел через точку с запятой':'рациональное число')+' от −100 до 100.';
 if(q.kind==='symbolic-coefficients'&&text.split(';').length!==2)return inputNote(q)+' Введи оба коэффициента.';
 if(q.kind==='coefficient-and-roots'){
  const [b,...roots]=text.split(';');
  if(!M.parse(b)||roots.length!==2||!window.MakarychevCheck.quadraticEntries(roots.join(';')))return inputNote(q)+' Проверь запись коэффициента и обеих числовых частей.';
 }
 if(q.kind==='integer-runs'&&!window.MakarychevTaskGraphs.sequenceRows(text,q.graph))return inputNote(q)+' Проверь число членов и скобки.';
 if(q.kind==='parameter-formulas'&&text.split(';').length!==String(q.answer).split(';').length)return inputNote(q)+' Количество частей не совпало с форматом записи.';
 if(q.kind==='parameter-sample'&&window.MakarychevTaskGraphs.parameterSample(text)===null)return 'Для опыта укажи число от −24 до 24 с шагом 1/8. Можно использовать дробь, например −1/8.';
 if(q.kind==='intersection-points'&&!window.MakarychevCheck.pointGroups(text))return q.inputNote;
 if(q.kind==='landmark-interval'&&!window.MakarychevCheck.landmarkInput(text,window.MakarychevTaskGraphs.propertyCurve(q.graph).landmarks))return q.inputNote;
 if(['monotone-construction','zero-construction'].includes(q.kind)&&!window.MakarychevTaskGraphs.witnessMarks(q.graph,text).complete)return 'Нужны '+q.graph.xs.length+' чисел через точку с запятой. Сохрани все свои ординаты.';
 if(q.kind==='grid-estimate'&&!M.parse(text))return 'Запиши численную оценку высоты, например 0,5.';
 if(['system-single','system-intersection'].includes(q.kind)&&!window.MakarychevCheck.systemInput(text,q.variable||q.graph?.variable))return q.inputNote||'Запиши промежуток, неравенство с нужной буквой или ∅.';
 if(q.kind==='system-examples'&&!window.MakarychevCheck.rationalList(text))return q.inputNote;
 if(q.kind==='cube-graph-root'&&!window.MakarychevTaskGraphs.cubeRead(text))return q.inputNote;
 if(q.kind==='universal-set'&&!window.MakarychevCheck.axisRanges(text)&&!['все','все действительные','все числа','r','ℝ'].includes(text.trim().toLowerCase()))return q.inputNote;
 if(q.kind==='linear-ray'&&!window.MakarychevCheck.linearRay(text,q.graph.variable))return 'Запиши неравенство с буквой '+q.graph.variable+' и одной числовой границей или промежуток с точкой с запятой.';
 if(q.kind==='linear-examples'&&!window.MakarychevCheck.rationalList(text))return 'Введи подходящие числа через точку с запятой.';
 if(q.kind==='rational-probe'&&!M.parse(text))return 'Введи одно рациональное число, например −2 или 1/3.';
 if(['axis-set','named-interval'].includes(q.kind)){
  const parts=String(text).split('|'),ranges=window.MakarychevCheck.axisRanges(parts[0]);
  if(!ranges)return 'Укажи промежуток с точкой с запятой. Бесконечность не включается; левый конец не больше правого.';
  if(q.kind==='named-interval'&&(parts.length!==2||!parts[1].trim()))return 'После промежутка выбери название или добавь его через знак |.';
 }
 if(['rational-axis-list','fixed-denominator-list','near-two-examples'].includes(q.kind)&&!window.MakarychevCheck.rationalList(text))return 'Введи числа через точку с запятой, например 1/2; 1,75.';
 if(q.kind==='explicit-set'&&!window.MakarychevTaskGraphs.setTokens(text,q.letters))return q.inputNote||'Введи список элементов или ∅.';
 if(['integer-probe','multiple-witness'].includes(q.kind)&&window.MakarychevTaskGraphs.integerProbe(text)===null)return 'Введи целое число.';
 if(q.kind==='segment-name'&&!/^[ABCD]{2}$/i.test(text.replace(/\s/g,'')))return 'Запиши две латинские буквы, обозначающие концы.';
 if(['bound-corner','yield-pair','speed-pair','triangle-vertex'].includes(q.kind)&&!window.MakarychevTaskGraphs.cornerValues(text))return 'Введи два рациональных числа через точку с запятой.';
 if(q.kind==='estimate-interval'&&!window.MakarychevCheck.estimateInput(text,q.graph.expression))return q.inputNote||'Укажи конечный интервал с двумя границами.';
 if(q.kind==='open-intervals'&&!window.MakarychevCheck.openIntervals(text))return q.inputNote||message;
 if(q.kind==='equation-from-roots'&&window.MakarychevCheck.equationRatioStatus(text,q.ratios)==='format')return message;
 if(q.kind==='examples-of-equations'&&window.MakarychevCheck.exampleEquationsStatus(text)==='format')return message;
 if(q.kind==='quadratic-roots'&&!window.MakarychevCheck.quadraticEntries(text))return message;
 if(q.kind==='abs-line-example'&&!window.MakarychevCheck.absLineIntersections(text))return message;
 if(q.kind==='rational-line-example'&&!window.MakarychevCheck.reciprocalIntersections(text))return message;
 if(q.kind==='progression-factor-example'){
  const status=window.MakarychevCheck.progressionFactors(text);
  if(status==='format')return message;
  if(status==='expanded')return 'Коэффициенты и значение выражения верны. Представь его в виде произведения линейных множителей. Это уточнение формы.';
 }
 if(q.kind==='squared-binomial'&&window.MakarychevCheck.squaredBinomial(text,q.answer)==='form')return 'Значение выражения верное. Запиши один двучлен в скобках и возведи его в квадрат. Уточнение формы не расходует попытку.';
 if(q.factorizedAnswer&&window.MakarychevCheck.factoredPair(text,q.answer,q.requiredFactors||2,q.productDegree||1)==='expanded')return 'Значение выражения верно. Собери произведение '+(q.requiredFactors===3?'трёх':'двух')+(q.productDegree>1?' множителей.':' линейных множителей.')+' Уточнение формы не расходует математическую попытку.';
 if(q.kind==='radical-value'&&!window.MakarychevCheck.radicalSum(text))return message;
 if(q.requireSimplified&&window.MakarychevCheck.sameRadicalSum(text,q.answer))return 'Значение верно. Вынеси полные квадраты из-под корней и объедини подобные слагаемые. Уточнение формы не расходует математическую попытку.';
 if(q.kind==='incomplete-coefficients'){
  const parts=text.split(';');if(parts.length!==3||parts.some(v=>!M.parse(v)))return message;
 }
 if(q.kind==='set'){
  const empty=/^(нет|неткорней|корнейнет|пусто|∅|\{\})$/;
  const norm=window.MakarychevCheck.normalize(text);
  if(empty.test(norm))return '';
  if(!window.MakarychevCheck.setEntries(text))return 'Уточни запись. Цифры одного числа пишутся подряд. Между целой и дробной частями смешанного числа оставь пробел, между ответами поставь точку с запятой.';
  const expected=String(q.answer).replace(/[{}]/g,'').split(';');
  if(empty.test(window.MakarychevCheck.normalize(q.answer))||expected.every(window.MakarychevCheck.signedSquare)){const parts=window.MakarychevCheck.setEntries(text);if(!parts||parts.some(v=>!window.MakarychevCheck.signedSquare(v)))return message;}
 }
 return '';
}
function naturalCase(term,rule){
 const parsed=M.parse(term);
 if(!parsed||parsed.d!==1||parsed.n<1)return null;
 const n=BigInt(parsed.n);
 if(rule==='а')return [n+6n,n];
 if(rule==='б')return [5n*n-12n,n];
 return [36n-n*n,n*n];
}
function feedbackFor(value,q){
 if(q.graph?.type==='source-review-43'){
  const g=q.graph,C=window.MakarychevCheck;
  if(q.kind==='intersection-points'){
   const points=C.pointGroups(value)?.[0]||[];
   for(const [a,b] of points){const x=a.n/a.d,y=b.n/b.d;if(x===0)return 'У гиперболы при x = 0 точки нет.';
    if(Math.abs(y-(g.k*x+g.b))>1e-10)return 'Для x = '+M.answer(a)+' указанная ордината не лежит на прямой.';
    if(Math.abs(y-g.h/x)>1e-10)return 'Для x = '+M.answer(a)+' ордината прямой не совпадает со значением на гиперболе.';}
   if(points.length<2)return 'Проверь обе ветви гиперболы. Найдена ещё не вся пара точек.';
  }
  if(g.mode==='strip'){const ranges=C.axisRanges(C.systemInput(value,'x'));
   if(ranges){for(const x of [0,4,1,-1,5]){const inside=ranges.some(r=>(x>r.min||x===r.min&&!r.leftOpen)&&(x<r.max||x===r.max&&!r.rightOpen));const trial=window.MakarychevTaskGraphs.review43Trial(g,String(x));if(inside!==trial.inside)return 'Проверь x = '+x+': высота y = '+trial.line+(trial.inside?' входит в полосу.':' лежит вне полосы.');}}}
  if(g.mode==='numeric'&&M.equal(value,'9/25'))return 'Получен правильный модуль. Сверь знак перед квадратом 2a + 3.';
  if(g.mode.startsWith('compare-')&&String(value).trim()==='=')return 'Добавь ещё десятичный разряд или приведи обе дроби к общему знаменателю. '+q.hint;
 }
 if(q.graph?.type==='source-formula-zeros'){
  const g=q.graph,trial=v=>window.MakarychevTaskGraphs.functionZeroTrial(g,v);
  if(g.measure==='domain'){
   const ranges=window.MakarychevCheck.axisRanges(window.MakarychevCheck.systemInput(value,'x'));
   if(ranges){
    for(const probe of (g.formula==='root-above'?['-6','-5','-7','0']:['1','-5/2','5/3','2','0'])){
     const r=trial(probe),inside=ranges.some(s=>(r.x>s.min||r.x===s.min&&!s.leftOpen)&&(r.x<s.max||r.x===s.max&&!s.rightOpen));
     if(inside!==['nonzero','zero'].includes(r.status))return 'Сверь точку x = '+probe+'. '+(r.status==='pole'?'Здесь знаменатель равен нулю.':r.status==='radical'?'Здесь под корнем отрицательное число.':'Здесь корень существует и знаменатель ненулевой.');
    }
   }
  }else {
   for(const v of String(value).split(';')){
    const r=trial(v);if(!r||r.status==='zero')continue;
    if(r.status==='pole')return 'При x = '+r.entered+' знаменатель равен нулю. Функция в этой точке не определена.';
    if(r.status==='radical')return 'При x = '+r.entered+' под квадратным корнем получается отрицательное число.';
    if(g.formula==='root-above'&&r.x<0)return 'При x = '+r.entered+' левая часть x отрицательна, а квадратный корень неотрицателен. Проверь кандидата до возведения в квадрат.';
    return 'Подставь x = '+r.entered+' в исходное выражение: числитель не обнуляется. '+q.hint;
   }
  }
  return q.hint;
 }
 if(q.graph?.type==='source-graph-witness'){
  const g=q.graph,r=window.MakarychevTaskGraphs.witnessMarks(g,value);
  if(g.mode==='zeros'){const i=r.heights.indexOf(0);if(i>=0)return 'При x='+g.xs[i]+' ты создал дополнительный нуль. Дай этой свободной точке ненулевую высоту.';}
  else if(r.complete){const [a,b,c]=r.heights,isPeak=g.mode==='peak',okLeft=isPeak?b>a:b<a;
    return 'Проверь '+(okLeft?'правый':'левый')+' отрезок: '+(isPeak?(okLeft?'после вершины высота должна уменьшаться.':'к вершине высота должна увеличиваться.'):(okLeft?'после впадины высота должна увеличиваться.':'к впадине высота должна уменьшаться.'));
  }
  return q.hint;
 }
 if(q.graph?.type==='source-curve-properties'){
  const g=q.graph,C=window.MakarychevCheck,G=window.MakarychevTaskGraphs,shape=G.propertyCurve(g);
  if(['neg','pos','domain','range'].includes(g.measure)){
   const interpret=v=>C.axisRanges(q.kind==='landmark-interval'?C.landmarkInput(v,shape.landmarks):C.systemInput(v,g.variable));
   const proposed=interpret(value),expected=interpret(q.answer);
   if(proposed&&expected){const low=g.variable==='y'?shape.yRange[0]:shape.xRange[0],high=g.variable==='y'?shape.yRange[1]:shape.xRange[1];
    const has=(rs,x)=>rs.some(r=>(x>r.min||r.min===x&&!r.leftOpen)&&(x<r.max||r.max===x&&!r.rightOpen));
    const probes=Array.from({length:2*(high-low)+1},(_,i)=>low+i/2).concat(shape.landmarks||[]);
    for(const x of probes){if(has(proposed,x)===has(expected,x))continue;
     if(g.variable==='x'&&['neg','pos'].includes(g.measure)){const y=G.propertyHeight(shape,x);const landmark=shape.landmarks?.indexOf(x);const label=landmark>=0?['α','β'][landmark]:String(x).replace('.',',');if(Number.isFinite(y))return 'Проверь точку x='+label+': она '+(Math.abs(y)<1e-9?'лежит на оси x':y>0?'выше оси x':'ниже оси x')+'. '+q.hint;}
     return 'Сверь, входит ли в проекцию '+g.variable+'='+String(x).replace('.',',')+'. '+q.hint;
    }
   }
  }
  if(g.roundedZeros){
   const expected=q.answer.split(';').map(Number),values=String(value).split(';').map(v=>M.parse(v));
   const wrong=values.find(v=>v&&!expected.includes(v.n/v.d));
   if(wrong)return 'Прочитай ближайшее целое деление в месте пересечения. Среди округлённых нулей нет '+M.answer(wrong)+'.';
   if(values.filter(Boolean).length!==expected.length)return 'На рисунке видно '+expected.length+' пересечения оси x. Проверь их слева направо.';
  }
  if(g.at!==undefined&&q.kind==='grid-estimate')return 'Проверь вертикаль x='+g.at+' и ближайшее деление оси y. '+q.hint;
  if(g.markZeros&&!g.roundedZeros){const vals=String(value).split(';').map(v=>M.parse(v));
   for(const v of vals.filter(Boolean)){const x=v.n/v.d,y=G.readingHeight(shape.nodes,x);if(!Number.isFinite(y)||Math.abs(y)>1e-7)return 'Точка при x='+M.answer(v)+' не находится на пересечении кривой с осью x. '+q.hint;}
  }
  return q.hint;
 }
 if(q.graph?.type==='source-phase-reading'){
  const g=q.graph;
  if(g.scenario==='ice'&&String(value).includes('охлажд'))return 'Нагреватель всё время включён. Найди, где при подводе тепла температура остаётся на нуле.';
  if(g.scenario==='water'&&q.kind==='number'&&M.equal(value,'28'))return '28 — это число минут на горизонтальной оси. Для температуры считай отметку вертикальной оси.';
  if(q.kind==='system-single'){
   const C=window.MakarychevCheck,proposed=C.axisRanges(C.systemInput(value,'t')),expected=C.axisRanges(C.systemInput(q.answer,'t'));
   if(proposed?.length===1&&expected?.length===1){const p=proposed[0],r=expected[0];
    if(p.min===r.min&&p.max===r.max&&(p.leftOpen||p.rightOpen))return 'Границы найдены. Крайние точки тоже показаны на графике: включи их квадратными скобками.';
    if(p.min===r.min&&p.max!==r.max)return 'Начало совпадает. Проследи участок до следующего изменения наклона или конца рисунка.';
    if(p.max===r.max&&p.min!==r.min)return 'Конец участка найден. Проверь, с какого момента начинается этот наклон.';
   }
  }
  return q.hint;
 }
 if(q.graph?.type==='source-trip-review'){
  const g=q.graph;
  if(g.mode==='equation'){const raw=String(value).split(';');for(const v of raw){if(!M.parse(v))continue;const a=window.MakarychevTaskGraphs.functionValueAt({numerator:g.left,denominator:['1']},v),b=window.MakarychevTaskGraphs.functionValueAt({numerator:g.right,denominator:['1']},v);if(a!==null&&b!==null&&!M.equal(a,b))return 'При x='+v+' левая часть равна '+a+', а правая '+b+'. Проверь предложенный корень.';}if(q.kind==='set'&&raw.length<String(q.answer).split(';').length)return 'Проверь, нашёл ли ты все корни. '+q.hint;}
  if(g.mode==='trip-build'){const p=String(value).split(';'),w=String(q.answer).split(';'),i=w.findIndex((v,i)=>!M.equal(p[i],v));if(i>=0)return 'Проверь узловую точку t='+g.xs[i]+'. '+q.hint;}
  if(g.mode==='trip-value'&&Number(g.at)>1.5&&M.equal(value,'24'))return '24 км — произведение скорости обратного движения на время от начала наблюдения. В выражении расстояния нужно ещё учесть свободный член 35,5.';
  return q.hint;
 }
 if(q.graph?.type==='source-behavior-review'){
  const g=q.graph;
  if(g.mode==='gallery'){const v=Number(value);if([1,2].includes(v)&&g.request>=3)return 'Ты выбрал гиперболу с двумя ветвями. Формула линейная: сравни прямые 3 и 4.';if([3,4].includes(v)&&g.request<=2)return 'В выбранном графике есть точка при x=0. В исходной дроби здесь знаменатель равен нулю.';}
  if(q.kind==='behavior-table'){const raw=String(value).split(';'),i=g.tableValues.findIndex((v,i)=>!M.equal(raw[i],v));if(i>=0)return 'Перепроверь столбец при '+(g.mode==='tank-table'?'t':'x')+'='+g.xs[i]+'. '+q.hint;}
  if(g.mode==='cubic-range'&&value==='[−8; 8]')return 'Проверь x=3/2: функция принимает −69/8, что меньше −8. Таблица по целым x пропустила экстремум.';
  if(g.mode==='river'&&q.kind==='number'&&M.equal(value,'6'))return 'Шесть — день вершины, а вопрос о разности конечного и начального уровней.';
  return q.hint;
 }
 if(q.graph?.type==='source-function-features'){
  const g=q.graph,C=window.MakarychevCheck,r=C.axisRanges(C.systemInput(value,g.variable));
  const includes=x=>r?.some(row=>(x>row.min||x===row.min&&!row.leftOpen)&&(x<row.max||x===row.max&&!row.rightOpen));
  if(g.constructionXs){const ys=window.MakarychevTaskGraphs.domainCoefficients(value,g.constructionXs.length);if(ys){const expected=q.answer.split(';'),i=ys.findIndex((v,i)=>!M.equal(M.answer(v),expected[i]));if(i>=0)return 'Проверь точку с x='+g.constructionXs[i]+': предложенная тобой ордината '+M.answer(ys[i])+' не совпадает со значением по формуле. '+q.hint;}}
  if(g.shape==='triangle'&&r){if(g.mode==='domain'&&includes(10))return 'При x=10 сумма боковых сторон равна основанию. Треугольник вырождается: 10 нужно исключить.';if(g.mode==='range'&&includes(40))return 'Периметр 40 получился бы только у вырожденного треугольника, поэтому 40 исключается.';if(g.mode==='range'&&!includes(100))return 'Периметр ровно 100 допускается условием «не более». Добавь граничную точку.';}
  if(g.shape==='bounded-rational'&&g.mode==='range'&&r){if(includes(1))return 'Высота 1 не достигается: равенство x²=x²+1 невозможно.';if(!includes(0))return 'При x=0 исходная дробь равна нулю. Нижнюю границу нужно включить.';}
  if(g.shape==='reciprocal'&&r&&includes(0))return g.mode==='domain'?'При x=0 знаменатель исчезает.':'Ненулевой числитель не может дать высоту y=0.';
  if(g.mode==='identify'&&value==='y=x−1')return 'Пересечение с осью y ты нашёл верно. Но на шаг вправо эта прямая поднимается на 1, а на рисунке — на 2.';
  return q.hint;
 }
 if(q.graph?.type==='source-reading-graph'){
  const g=q.graph,r=M.parse(value),v=r?r.n/r.d:null;
  if(g.mode==='square-area'&&v===144)return '144 см² — площадь всего внешнего квадрата. Плитка занимает только половину.';
  if(g.mode==='square-diagonal'&&v===256)return '256 — квадрат искомой длины. Чтобы получить положительную диагональ, извлеки корень.';
  if(g.mode==='ordinate'&&v===g.argument)return 'Ты записал абсциссу. Посмотри на высоту точки над этой абсциссой.';
  if(g.mode==='preimage'&&v===g.target)return 'Данный уровень — вертикальная координата. Нужны абсциссы всех пересечений горизонтали с кривой.';
  if(g.mode==='argmax'&&v===758)return '758 — величина давления. Укажи день, когда оно было измерено.';
  if(g.mode==='abs-rad'||g.mode==='abs-piece'||g.mode==='abs-den'){
   const ranges=window.MakarychevCheck.axisRanges(window.MakarychevCheck.systemInput(value,'x'));
   if(ranges){for(const x of [-2,-1,0,.5,1,2]){const proposed=ranges.some(r=>(x>r.min||r.min===x&&!r.leftOpen)&&(x<r.max||r.max===x&&!r.rightOpen)),actual=window.MakarychevTaskGraphs.absDomainTrial(g.mode,String(x));if(actual.allowed!==proposed)return 'Проверь x='+String(x).replace('.',',')+': '+(actual.radical?'под корнем':'в знаменателе')+' '+actual.quantity+'. Твоя область '+(proposed?'включает запрещённое':'пропускает допустимое')+' значение.';}}
  }
  return q.hint;
 }
 if(q.graph?.type==='source-function-domain'){
  const g=q.graph;
  if(g.case==='family'){const f=window.MakarychevTaskGraphs.familyDomain(value);if(f?.domain==='empty')return 'В твоём примере знаменатель всегда ноль: ни один x не подойдёт.';if(f?.domain==='except')return 'Твой знаменатель обнуляется при x='+f.cut+'. Сверь это исключение с условием.';if(f?.domain==='all')return 'Твой постоянный знаменатель не имеет нулей. Нужна одна запрещённая точка.';}
  if(g.case==='radical'){const claim=window.MakarychevCheck.axisRanges(window.MakarychevCheck.systemInput(value,'x'));const included=v=>claim?.some(r=>(v>r.min||v===r.min&&!r.leftOpen)&&(v<r.max||v===r.max&&!r.rightOpen));if(claim&&!included(g.edge))return 'В точке '+g.edge+' под корнем ноль. Сам корень существует: включи границу.';if(claim&&included(g.edge-Math.sign(g.k)))return 'Проверь соседнюю точку x='+(g.edge-Math.sign(g.k))+': подкоренное выражение отрицательно.';}
  if(g.case==='quotient'&&g.poles?.length){const claim=window.MakarychevCheck.axisRanges(window.MakarychevCheck.systemInput(value,'x'));const bad=g.poles.find(v=>claim?.some(r=>(v>r.min||v===r.min&&!r.leftOpen)&&(v<r.max||v===r.max&&!r.rightOpen)));if(bad!==undefined)return 'Твой ответ включает x='+bad+', но именно здесь знаменатель равен нулю.';}
  if(g.case==='escalator'&&M.equal(value,'405/4'))return '405/4 м — путь по наклонной ленте. Вертикальный катет при 30° вдвое меньше.';
  if(g.case==='escalator'&&g.mode==='time'&&M.equal(value,'80'))return '80 с получается из 60/0,75, если принять глубину за наклонный путь. По наклонной нужно пройти 120 м.';
  if(g.case==='reciprocal-hole'&&window.MakarychevTaskGraphs.domainCoefficients(value,3)?.[2]?.n===0)return 'x=0 — вертикальная асимптота. Отверстие появилось из-за сокращённого множителя x+2.';
  return q.hint;
 }
 if(q.graph?.type==='source-function-values'){
  if(q.graph.mode==='inverse'){const computed=window.MakarychevTaskGraphs.functionValueAt(q.graph,value);if(computed!==null)return 'При твоём x функция равна '+computed+', а нужен уровень '+q.graph.target+'. '+q.hint;}
  if(q.graph.mode==='sum'&&M.equal(value,'13'))return '13 — только φ(3). В итог нужно включить результаты для 0, 1 и 2.';
  return q.hint;
 }
 if(q.graph?.mode==='train'&&window.MakarychevCheck.equalAxisSets(window.MakarychevCheck.systemInput(value,'v'),'(60;84]'))return 'Граница 84 получается из среднего арифметического двух скоростей. Участки равны по расстоянию, а времена разные. Испытай 90 км/ч в модели и сложи времена.';
 if(q.graph?.mode==='motor'&&window.MakarychevCheck.equalAxisSets(window.MakarychevCheck.systemInput(value,'v'),'[18;+∞)'))return 'При 18 км/ч оба приезжают на станцию одновременно. Чтобы догнать до станции, исключи эту границу.';
 if(q.graph?.type==='source-applied-bounds'||q.graph?.integerResult)return q.hint;
 if(q.kind==='between-surd')return q.hint;
 if(q.kind==='extrema-pair')return 'Сначала запиши наименьший элемент, затем наибольший. Отсутствующий крайний элемент обозначь словом «нет».';
 if(q.kind==='bounded-point')return q.hint+' Сверь каждое значение с обеими своими границами.';
 if(q.graph?.type==='geometry-bound-review')return 'Проверь результат при крайних исходных значениях. '+(q.graph.bounds.every(b=>b[2])?'Обе исходные границы достигаются, поэтому нужны квадратные скобки.':'Исходные границы исключены. Круглая скобка сохраняет строгую оценку.');
 if(q.kind==='inequality-counterexample')return M.parse(value)?'При этой подстановке исходный знак выполняется. Проверь, может ли разность стать нулевой или изменить знак.':'Проверь знак разности при других значениях переменной. Для вывода «всегда» нужна общая причина.';
 if(q.kind==='ordered-coordinates'){const result=window.MakarychevTaskGraphs.coordinateEvidence(value,q.coordinateSymbols,q.coordinateOrder,q.coordinateBounds),wrong=result?.pairs.find(row=>!row.ok);return wrong?'На прямой '+wrong.left+' должно быть строго левее '+wrong.right+'. Измени соответствующую координату.':'Проверь числовую границу вместе с порядком букв.';}
 if(q.kind==='transformed-order'){if(q.numericSides){const match=/^([^<>]+)([<>])([^<>]+)$/.exec(value);if(match&&M.equal(match[1],match[3]))return 'Ты получил равные стороны. Одинаковое ненулевое масштабирование или сдвиг сохраняют различие исходных чисел.';}return 'Проверь отдельно новые левую и правую стороны, затем направление знака.';}
 if(q.graph?.type==='source-system-review'&&q.graph.mode==='parameters')return 'Проверь крайнее значение параметра и оба корня при нём. Корень на границе нарушает строгое условие.';
 if(q.graph?.type==='source-system-review'&&q.graph.mode==='ride')return 'Сначала укажи скорость в гору, второй — бо́льшую скорость на равнине. Сумма времён должна равняться 6 ч.';
 if(q.kind==='system-single')return q.hint;
 if(q.kind==='system-intersection'&&q.graph?.rows){
  const C=window.MakarychevCheck,proposal=C.systemInput(value,q.graph.variable),sets=C.axisRanges(proposal)||[];
  if(q.graph.holes?.some(h=>sets.some(r=>(r.min<h||r.min===h&&!r.leftOpen)&&(r.max>h||r.max===h&&!r.rightOpen))))return 'Твоё множество содержит значение, при котором корни в знаменателе равны. Удали эту точку.';
  if(q.graph.rows.some(r=>r.ray&&C.equalAxisSets(proposal,r.ray)))return 'Получилось множество одной строки. Проверь, вся ли его часть удовлетворяет другой строке.';
  return 'Проверь в обеих строках каждый конечный конец своего промежутка. При строгом знаке равная граница исключена.';
 }
 if(q.kind==='system-examples'){
  const xs=window.MakarychevCheck.rationalList(value)||[];
  if(xs.length!==q.exampleCount||new Set(xs.map(M.answer)).size!==xs.length)return 'Числа должны различаться. Нужно примеров: '+q.exampleCount+'. Например, 1/2 и 0,5 — это одно значение.';
  for(const x of xs){const i=q.graph.rows.findIndex(r=>!window.MakarychevTaskGraphs.linearTrial(r,M.answer(x)).holds);if(i>=0)return 'Число '+M.answer(x)+' нарушает строку '+(i+1)+'. Проверь её подстановкой.';}
 }
 if(q.kind==='cube-graph-root')return 'Точка пересечения должна иметь одинаковые высоты на обеих кривых. Уточни x, сравнив 12/x и x².';
 if(q.kind==='universal-set')return 'После сокращения переменной сравни оставшиеся числа. Ложное сравнение не даёт ни одной точки, истинное даёт всю прямую.';
 if(q.kind==='axis-set'&&q.graph?.mode==='parameter-roots'){
  const exceptional=q.graph.which===963?4:-5,ranges=window.MakarychevCheck.axisRanges(value)||[];
  if(ranges.some(r=>(r.min<exceptional||r.min===exceptional&&!r.leftOpen)&&(r.max>exceptional||r.max===exceptional&&!r.rightOpen)))return 'Проверь параметр, при котором исчезает квадратный член. Линейное уравнение имеет один корень.';
 }
 if(q.kind==='linear-examples'){
  const xs=window.MakarychevCheck.rationalList(value)||[];if(new Set(xs.map(M.answer)).size!==q.exampleCount)return 'Нужно '+q.exampleCount+' разных чисел.';
  const wrong=xs.find(x=>!window.MakarychevTaskGraphs.linearTrial(q.graph,x).holds);return wrong?'При '+q.graph.variable+' = '+M.answer(wrong)+' исходный знак не выполняется. Сверь значения сторон в модели.':q.hint;
 }
 if(q.kind==='linear-ray'){
  const C=window.MakarychevCheck,r=C.axisRanges(C.linearRay(value,q.graph.variable)||'')?.[0],bound=M.parse(q.graph.threshold);
  if(r&&(M.equal(r.left,bound)||M.equal(r.right,bound))){const right=r.right==='+∞',target=q.graph.relation[0]==='>';if(right!==target)return 'Граница верна, но отмечен противоположный луч. Проверь знак коэффициента при делении.';return 'Граница и направление верны. Реши, допускается ли равенство на конце.';}
  return 'Подставь найденную границу: на ней обе стороны должны быть равны. После переноса свободных членов раздели на коэффициент при переменной.';
 }
 if(q.kind==='axis-set'||q.kind==='named-interval'){
  const C=window.MakarychevCheck,[v]=String(value).split('|'),[ans]=String(q.answer).split('|');
  if(q.kind==='named-interval'&&C.equalAxisSets(v,ans))return 'Твой чертёж верен. Уточни название по числу конечных границ и их включению.';
  const got=C.axisRanges(v),expected=C.axisRanges(ans);
  if(got?.length!==expected?.length)return 'Проверь, не исчез ли разрыв между отдельными частями.';
  if(got&&expected&&got.every((r,i)=>r.min===expected[i].min&&r.max===expected[i].max))return 'Границы находятся в правильных местах. Проверь по очереди, включена ли каждая точка.';
  return 'Сопоставь левую и правую границы, а для луча проверь направление стрелки.';
 }
 if(q.kind==='fixed-denominator-list')return 'У каждой дроби нужен знаменатель 54. Перечисли подряд все допустимые натуральные числители.';
 if(q.kind==='rational-axis-list')return 'Проверь каждый кандидат отдельно, особенно числа, равные концу промежутка.';
 if(q.kind==='near-two-examples')return 'Оба числа должны быть разными, строго больше 1,98 и строго меньше 2.';
 if(q.kind==='speed-pair')return 'Обратный поезд быстрее на 5 км/ч. Проверь также, равна ли разность времён 20 минутам.';
 if(q.kind==='explicit-set'){const G=window.MakarychevTaskGraphs,yours=G.setTokens(value,q.letters),goal=G.setTokens(q.answer,q.letters);const extra=yours?.find(x=>!goal.includes(x));return extra!==undefined?'Элемент '+extra+' лишний. Проверь его принадлежность обоим исходным множествам.':'Часть элементов пропущена. Просмотри обе области схемы.';}
 if(q.kind==='segment-name')return 'Посмотри на точки в порядке A, C, B, D и проверь, какой участок нужен целиком.';
 if(q.kind==='multiple-witness')return 'Для опровержения возьми кратное 3 вне круга кратных 5. У общего кратного оба свойства выполняются.';
 if(q.kind==='yield-pair')return 'Сначала укажи большую урожайность первого хозяйства. Проверь разность 2 ц/га и условие о площадях.';
 if(q.kind==='bound-corner')return 'Сверь первую координату с границами '+q.variables[0]+', вторую — с '+q.variables[1]+'. Для вычитания и деления выбираются противоположные концы.';
 if(q.kind==='triangle-vertex')return 'При v = 0 точки лежат на одной прямой, при v < 0 вершина ниже AC. Выбери v > 0.';
 if(q.kind==='estimate-interval'){
  const status=window.MakarychevCheck.estimateStatus(value,q);
  if(status==='order')return 'Поставь меньшее число слева. При переходе к обратным положительным числам или отрицательном множителе концы меняются местами.';
  if(status==='inclusion')return 'Численные границы верны. Проверь скобки: входят ли концы в исходный промежуток?';
  return 'Проверь образ каждого исходного конца отдельно. '+q.hint;
 }
 if(q.kind==='ordered-comparison-sample')return 'Сначала проверь исходное a < b, затем сравни промежуток b − a с 5 для требуемого знака.';
 if(q.kind==='source-domain-sample'&&['product-nine','root-sum-one','above-three','above-one','ride-plan','speed-current','two-rivers'].includes(q.sourceDomain))return q.hint;
 if(q.kind==='source-domain-sample')return 'Проверь знак, указанную область и, для натуральной дроби, порядок числителя и знаменателя.';
 if(q.kind==='unique-system-triple'){
  const row=window.MakarychevCheck.systemTriple(value);if(row&&row.values[0]===0&&row.values[1]===0)return 'При a = b = 0 вторая строка не задаёт прямую. Измени хотя бы один коэффициент при переменной.';
  return 'Твоя вторая прямая имеет то же направление, что и первая. Измени отношение коэффициентов при x и y.';
 }
 if(q.kind==='parameter-exclusion')return 'Нужно описать все значения параметра. Единственное исключение даёт совпадающие прямые.';
 if(q.kind==='algebra-pairs'&&q.graph?.type==='rational-intersections'){
  const {pairs}=rationalEvidence(q.graph,value);
  for(const [x,y] of pairs){
   const ordinates=q.graph.curves.map(curve=>window.MakarychevTaskGraphs.curveValue(curve,x));
   if(ordinates.some(v=>!Number.isFinite(v)))return 'При этой абсциссе одна из исходных функций не определена. Выколотая точка не может быть общей.';
   if(ordinates.some(v=>Math.abs(v-y)>1e-8))return 'Подставь абсциссу в обе формулы. Ордината должна совпасть с обоими полученными значениями.';
  }
  return 'Проверь все ветви графика и запиши каждую общую точку один раз.';
 }
 if(q.kind==='algebra-pairs'&&q.graph?.type==='system-pair-audit'){
  const rows=window.MakarychevCheck.systemEvidence(value,q.graph)||[];
  for(const row of rows){
   if(row.excluded)return 'В паре ('+row.a+'; '+row.b+') один из исходных знаменателей равен нулю.';
   if(!row.valid.every(Boolean))return 'Проверь пару ('+row.a+'; '+row.b+'). Она нарушает '+(!row.valid[0]?'первое':'второе')+' исходное равенство. Восстанови координату из подстановки.';
  }
  return rows.length?'Введённые пары проходят подстановку. Проверь повторяющиеся пары, оба знака и наличие всех корней.':'Проверь дискриминант и подставь допустимых кандидатов в оба уравнения.';
 }
 if(q.kind==='open-intervals'){
  const ranges=window.MakarychevCheck.openIntervals(value)||[];
  if(ranges.some(r=>!r.open))return 'При строгом неравенстве граничные точки не входят. Используй открытые концы промежутков.';
  return 'Подставь по одному числу из каждой выделенной области. Проверь знак исходного выражения по обе стороны каждой границы.';
 }
 if(q.kind==='integer-pairs'&&!q.graph?.rule){
  const G=window.MakarychevTaskGraphs,pairs=G.parseIntegerPairs(value)||[],solutions=G.parseIntegerPairs(q.answer)||[];
  if(new Set(pairs.map(p=>p.join(';'))).size!==pairs.length)return 'Одна и та же точка записана несколько раз. Найди другую общую точку или убери повтор.';
  for(const [x,y] of pairs){
   if(solutions.some(p=>p[0]===x&&p[1]===y))continue;
   const point='Точка ('+x+'; '+y+') ';
   if(q.graph?.curves?.length===2){
    const hits=q.graph.curves.map(c=>G.curveValue(c,x)===y);
    if(hits[0])return point+'лежит на первом графике. Сравни её ординату со вторым графиком при том же x.';
    if(hits[1])return point+'лежит на втором графике. Проверь первое уравнение при том же x.';
   }
   return point+'не удовлетворяет всем условиям. Подставь обе координаты в исходные равенства.';
  }
  return 'Указанные точки подходят. Проверь, все ли общие точки или целые решения перечислены.';
 }
 if(q.kind==='abs-line-example'){
  const v=window.MakarychevCheck.absLineIntersections(value);
  if(v&&!v.intercept)return v.k===0?'Горизонтальная прямая не имеет единственного пересечения оси x в заданной точке.':'При x = −3 должно получиться y = 0. Проверь равенство b = 3k.';
  if(v)return 'У твоей прямой пересечений с графиком y = |x|: '+v.count+'. Проверь обе полупрямые с учётом знака x.';
 }
 if(['three-solutions','equation-point-example','construct-lines'].includes(q.kind)){
  const reason=window.MakarychevCheck.planeResponse(value,q);
  if(reason==='count')return q.kind==='equation-point-example'?'Предложи одну пару (x; y).':q.kind==='three-solutions'?'Нужны три упорядоченные пары.':'Для каждой прямой дай ровно две точки. Группы раздели чертой |.';
  if(reason==='duplicate')return 'Пара повторяется. Подбери другую точку для этого построения.';
  if(reason==='same-branch')return 'Обе группы дали одну прямую. Найди вторую ветвь уравнения.';
  if(reason.startsWith('point-'))return 'Проверь пару №'+reason.slice(6)+': её подстановка нарушает равенство.';
  if(reason.startsWith('branch-'))return 'Проверь группу №'+reason.slice(7)+': обе её точки должны лежать на одной прямой графика.';
 }
 if(q.kind==='line-pair-equation')return 'Проверь нули обоих линейных множителей. Точки каждой прямой должны удовлетворять твоему уравнению.';
 if(q.kind==='equation-from-roots'){
  const status=window.MakarychevCheck.equationRatioStatus(value,q.ratios);
  if(status==='leading')return 'При A = 0 уравнение теряет квадратный член. Выбери A, отличный от нуля.';
  if(status==='linear')return 'Проверь линейный коэффициент B. Должно получиться B = −A(r + s).';
  if(status==='constant')return 'Отношение B/A получилось верным. Для свободного члена используй C = Ars.';
 }
 if(q.kind==='examples-of-equations'){
  const status=window.MakarychevCheck.exampleEquationsStatus(value);
  if(status==='linear')return 'При a = 0 в первом примере исчезает переменная. Оставь x в уравнении.';
 }
 if(q.kind==='rational-line-example'){
  const p=window.MakarychevCheck.reciprocalIntersections(value);
  if(p)return p.a===0?'Это горизонтальная прямая. При b ≠ 0 она встречает 1/x один раз, а при b = 0 встреч нет.':'Для твоих коэффициентов число пересечений равно '+p.count+'. Сравни b² + 4a с нулём.';
 }
 if(q.excludedRoots){
  const terms=window.MakarychevCheck.classifyRationalCandidates(value,q.excludedRoots,q.answer)||[];
  const excluded=terms.find(t=>t.status==='excluded');
  if(excluded)return 'При значении '+excluded.term+' один из исходных знаменателей равен нулю. Исключи этот кандидат.';
  const invalid=terms.find(t=>t.status==='different');
  if(invalid)return 'Знаменатели при '+invalid.term+' определены. Проверь исходное равенство при этом кандидате.';
  if(terms.length)return 'Введённый корень подходит. Проверь, все ли допустимые решения записаны.';
 }
 if(q.kind==='progression-factor-example'){
  const reason=window.MakarychevCheck.progressionFactors(value);
  const messages={natural:'Каждый коэффициент должен быть положительным целым числом.',ratio:'Расположи три коэффициента по величине. Второй должен быть вдвое, а третий втрое больше наименьшего.',roots:'У выбранного порядка коэффициентов дискриминант отрицателен. Попробуй сделать линейным коэффициентом наибольшее число.',different:'Подходящий набор коэффициентов найден. Раскрой свои скобки и сравни все три коэффициента с первыми полями.'};
  if(messages[reason])return messages[reason];
 }
 if(q.graph?.type==='rational-root-audit'&&window.MakarychevCheck.rationalRootTrial(value,q.graph).some(row=>row.forbidden))return 'Одно из твоих чисел обращает в нуль исходный знаменатель. Проверь его до сокращения.';
 if(q.graph?.type==='vieta-audit'){
  const audit=window.MakarychevCheck.vietaAudit(value,q.graph);
  if(audit?.sum&&!audit.product)return 'Сумма твоих чисел совпала. Проверь произведение, в том числе знак и квадрат радикала.';
  if(audit?.product&&!audit.sum)return 'Произведение твоих чисел совпало. Вспомни знак суммы −B/A.';
 }
 const knownMistake=q.mistakes?.find(m=>M.equal(value,m.value));
 if(knownMistake)return knownMistake.message;
 if(q.kind==='quadratic-roots'&&q.quadraticCoefficients){
  const [a,b,c]=q.quadraticCoefficients,disc=b*b-4*a*c;
  const submitted=window.MakarychevCheck.quadraticEntries(value)||[];
  const expected=window.MakarychevCheck.quadraticEntries(q.answer)||[];
  if(expected.length===2&&submitted.length===1&&expected.some(root=>window.MakarychevCheck.sameRadicalSum(submitted[0],root)))return 'Одно решение найдено верно. Для другого корня измени знак перед квадратным корнем и оставь тот же знаменатель.';
  if(expected.length===1&&submitted.length>1)return 'Дискриминант равен нулю. Совпадающие значения запиши один раз.';
  if(!expected.length)return 'Для этих коэффициентов D = '+disc+' < 0. Действительного квадратного корня из D нет.';
  if(!submitted.length)return 'Здесь D = '+disc+'. При неотрицательном дискриминанте действительные корни существуют.';
 }
 if(q.kind==='incomplete-coefficients'){
  const [a,b,c]=value.split(';').map(M.parse);
  if(!a?.n)return 'При a = 0 член второй степени исчезает. Выбери ненулевое a.';
  if(Boolean(b.n)!==q.hasLinear)return q.hasLinear?'Нужен член первой степени. Выбери ненулевое b.':'Член первой степени должен отсутствовать. Каков тогда b?';
  return q.hasConstant?'Свободный член должен присутствовать. Выбери ненулевое c.':'У свободного члена должен быть нулевой коэффициент c.';
 }
 if(q.positiveRoots&&window.MakarychevCheck.setEntries(value)?.length===1&&String(q.answer).split(';').some(root=>check(value,{kind:'set',answer:root})))return 'Проверен только один кандидат. Квадраты противоположных чисел равны. Запиши второй корень тоже.';

 if(q.kind==='proof-chain'){
  const attempt=window.MakarychevCheck.proofOrder(value,q.proofClaims.length)||[];
  let matched=-1,next;
  for(const order of q.proofOrders||[q.answer]){
   const candidate=order.split(';').map(Number);
   let common=0;while(common<candidate.length&&candidate[common]===attempt[common])common++;
   if(common>matched){matched=common;next=candidate[common];}
  }
  if(next===undefined)return 'Получилось полное доказательство. Проверь, нужно ли оставшееся утверждение.';
  const position=q.answer.split(';').indexOf(String(next));
  const selected=attempt[matched],orderHint=q.proofFeedback?.[position];
  let explanation=orderHint;
  if(!explanation){
   const usable=(q.proofOrders||[q.answer]).some(order=>order.split(';').includes(String(selected)));
   const correction=selected===undefined?'До вывода не хватает обоснования.':usable?'Утверждение №'+selected+' опирается на ещё не обоснованный переход.':'Утверждение №'+selected+' не следует из условий задачи.';
   explanation=correction+' '+q.hint;
  }
  return (matched?'Первые звенья верны. ':'')+'Проверь звено '+(matched+1)+'. '+explanation;
 }
 if(q.integerDivisor){
  const terms=window.MakarychevCheck.setEntries(value)||[],seen=new Set();
  for(const term of terms){
   const number=M.parse(term);
   if(!number||number.d!==1)return 'Здесь нужны только целые значения n.';
   const n=number.n,den=n-q.integerDivisor.shift;
   if(!den)return 'При n = '+term+' получается ноль в исходном знаменателе.';
   if(q.integerDivisor.remainder%den!==0)return 'При n = '+term+' знаменатель '+den+' не делит остаток '+q.integerDivisor.remainder+' без остатка.';
   if(seen.has(n))return 'Один из делителей указан дважды. Проверь оба знака и запиши каждое n один раз.';
   seen.add(n);
  }
  return 'Указанные n подходят. Проверь все положительные и отрицательные делители и учти сдвиг знаменателя.';
 }
 if(q.naturalRule){
  const terms=window.MakarychevCheck.setEntries(value)||[];
  for(const term of terms){
   const evaluated=naturalCase(term,q.naturalRule);
   if(!evaluated)return 'Перечисли натуральные n: положительные целые числа, начиная с 1.';
   const [top,bottom]=evaluated;
   if(top<=0n)return 'При n = '+term+' результат '+(top===0n?'равен нулю':'отрицателен')+'. Здесь требуется положительное целое число.';
   if(top%bottom!==0n)return 'При n = '+term+' числитель не делится на знаменатель без остатка.';
  }
  if(new Set(terms.map(v=>M.parse(v)?.n)).size!==terms.length)return 'Одно значение n повторяется. Запиши каждое подходящее число один раз.';
  return 'Указанные значения подходят. Перебери остальные положительные делители и найди пропущенный случай.';
 }
 if(q.kind==='domain-fraction'){
  const analysis=window.MakarychevCheck.inspectDomainFraction(value,q.exclusions);
  if(analysis.status==='zero')return 'Знаменатель равен нулю при каждом x. Такая дробь нигде не определена.';
  if(analysis.status==='missing')return 'Подставь x = '+q.exclusions[analysis.zeros.indexOf(false)]+'. При этом значении знаменатель твоей дроби должен обращаться в ноль.';
  if(analysis.status==='extra')return 'Ты исключил все нужные точки, но у знаменателя есть дополнительные действительные нули. Проверь множители по отдельности.';
 }
 if(q.correction)return q.correction;
 if(q.id==='ch1-extra-213-speeds'){
  const speeds=value.split(';');
  const times=[7,6];
  for(let index=0;index<times.length;index++){
   const t=times[index],speed=M.parse(speeds[index]);
   if(!speed||!M.equal(speeds[index],index===0?'45':'80')){
    return 'Проверь случай t = '+t+'. Первый поезд ехал '+t+' ч, второй — '+(t-3)+' ч. На схеме сравни концы двух отрезков с общей точкой встречи.';
   }
  }
 }
 if(q.id?.startsWith('ch1-extra-214-')){
  if(q.answer==='нет')return 'Проверь наименьшее возможное значение знаменателя. Может ли оно стать нулём? Значение числителя область не ограничивает.';
  const submitted=window.MakarychevCheck.setEntries(value)||[];
  const required=q.answer.split(';');
  if(submitted.length===1&&required.length===2&&required.some(n=>M.equal(n,submitted[0])))return 'Это значение действительно нужно исключить. Найди ещё одно, при котором знаменатель равен нулю.';
  return 'Подставь каждое записанное число именно в знаменатель: исключить его можно только тогда, когда получился ноль.';
 }
 if(isNumericPair(value,q)){
  if(/^(найди|вычисли)\s+√[\d.,]+[.!]?$/i.test(q.prompt))return 'Знак √ обозначает одно неотрицательное значение. Два противоположных корня ищут в уравнении x² = a при a > 0. Сравни это уравнение с заданием.';
  return 'Здесь требуется одно число. Ты указал два противоположных значения. Проверь каждое из них по условию.';
 }
 if(q.answerFormat&&M.equal(value,q.answer))return 'Значение верное. '+inputNote(q);
 if(q.kind==='graph-estimates'){
  const submitted=value.split(';').map(part=>M.parse(part));
  if(submitted.some(part=>!part))return 'Запиши абсциссы числом или точным выражением. Между двумя решениями поставь точку с запятой.';
  const hits=new Set();
  for(const point of submitted){
   const i=q.rootValues.findIndex(root=>Math.abs(point.n/point.d-root)<=q.tolerance+1e-10);
   if(i>=0)hits.add(i);
  }
  if(hits.size===1&&q.rootValues.length===2)return 'Одна абсцисса подходит. Найди второе пересечение и проведи от него вертикаль к оси x. Запиши обе абсциссы.';
  return 'Поставь палец на точку, где пересекаются именно две кривые. Проведи от неё вертикаль к оси x и проверь цену деления на этой оси.';
 }
 if(q.id==='roots-454-irrational'){
  const entries=window.MakarychevCheck.setEntries(value)||[];
  if(entries.some(v=>window.MakarychevCheck.normalize(v)==='√100'||M.equal(v,'10')))return '√100 = 10. Это рациональное число на нижней границе, а оба примера должны лежать строго внутри (10; 10,1).';
  return 'Проверь каждое подкоренное число n: нужно 100 < n < 102,01. Выбери два разных натуральных n, которые не являются полными квадратами.';
 }
 if(q.kind==='set'&&active?.lesson?.order===12){
  const submitted=window.MakarychevCheck.setEntries(value),expected=window.MakarychevCheck.setEntries(q.answer);
  if(submitted?.length===1&&expected?.length===2&&expected.some(root=>M.equal(root,submitted[0])))return 'Это число подходит. Найди ещё одно значение x, которое тоже удовлетворяет уравнению, и запиши оба.';
 }
 if(q.kind==='set')return 'Проверь все допустимые значения: не потерян ли второй корень и нет ли значения, запрещённого исходным условием? Порядок значений не важен.';
 if(q.kind==='integer-pairs'){
  const graphs=window.MakarychevTaskGraphs;
  const pairs=graphs.parseIntegerPairs(value);
  if(new Set(pairs.map(pair=>pair.join(';'))).size!==pairs.length)return 'Одна и та же пара указана дважды. Запиши её один раз и проверь, все ли случаи рассмотрены.';
  for(const pair of pairs){
   const result=graphs.pairEquation(q.graph.rule,pair);
   if(result.allowed===false||result.left!==result.right)return 'Проверь пару ('+pair.join('; ')+'). Подстановка под условием показывает, где возникает расхождение.';
  }
  return 'Все указанные пары подходят. Перебери остальные делители, чтобы получить полный список.';
 }
 if(q.kind==='graph')return 'Проверь отдельно коэффициенты прямой и все выколотые точки. После сокращения исходные запреты остаются.';
 if(q.kind==='line-sign-example')return 'Сначала проверь знак k по наклону прямой, затем знак b по пересечению с осью y.';
 if(q.kind==='graph-pair')return 'Проверь коэффициенты каждой прямой. Переставить две прямые местами можно; нужно сохранить обе.';
 const key=active?.practice?active.skill:active?.lesson?.model;
 if(key==='rational')return 'Сверь исходные знаменатели. Сокращать можно общие множители целиком; ограничения на переменную сохраняются.';
 if(key==='root')return 'Арифметический корень неотрицателен. Для √(a²) проверь |a|, особенно при отрицательном a.';
 if(key==='quadratic')return 'Проверь коэффициенты со знаками, дискриминант и подстановку каждого найденного корня в исходное уравнение.';
 if(key==='inequalities')return 'Проверь знак множителя: при умножении или делении на отрицательное число знак меняется. Затем проверь включение границы.';
 if(key==='power')return 'Минус в показателе означает обратное число. Проверь ненулевое основание и правило действий с показателями.';
 if(key==='graph')return 'Сверь формулу, допустимые x и координаты точки. Общая точка должна удовлетворять обоим уравнениям.';
 if(/fraction/.test(key||''))return /divide/.test(key)?'При делении умножай на обратную дробь; её числитель не должен быть нулём. Проверь сокращение.':/add|subtract/.test(key)?'Сначала получи общий знаменатель. Затем выполни действие с числителями и сократи результат.':'Проверь действие с числителями и знаменателями, затем сократи общий множитель.';
 if(/decimal/.test(key||''))return 'Проверь разряды и положение запятой. Оцени, между какими целыми должен лежать результат.';
 return 'Сверь вопрос задачи, знак и порядок действий. Подставь результат обратно; прежняя запись сохранена.';
}
function nextFresh(lesson){return lesson.tasks.findIndex(t=>{const s=state.tasks[t.id];return !s||(!s.correct&&!s.assisted&&!s.attempts&&!s.value&&!s.note&&!s.guided);});}
function freshAction(){if(active.practice)return button('Новое условие без помощи →','new');const index=nextFresh(active.lesson);return index>=0?button('Новое условие без помощи →','fresh'): '<p class="small">Все условия этой темы уже встречались. Выбери отдельный навык ниже: новый пример проверяет именно это действие.</p>';}
function historyView(s){if(!s.events?.length)return '';return '<details class="learning-history"><summary>Как проходила работа</summary>'+ (s.firstAttempt?'<p>Первая попытка: '+e(s.firstAttempt.value)+' — '+(s.firstAttempt.correct?'верно':'нужно исправить')+'.</p>':'<p class="small">Первая попытка ранее не записывалась; результат не восстановлен догадкой.</p>')+'<ol>'+s.events.map(v=>'<li>'+e(v.type==='answer'?('Ответ: '+v.value+' — '+(v.correct?'верно':'нужно исправить')):v.type==='step'?('Шаг '+(v.step+1)+': '+v.value+' — '+(v.correct?'верно':'нужно исправить')):v.type==='model'?'Исследование модели':v.type==='detour'?'Переход к основам':'Открыта помощь')+'</li>').join('')+'</ol><p class="small">Показаны последние 40 действий. Исправление и помощь не становятся первой самостоятельной попыткой.</p></details>';}
function displayValue(value,form){if(form==='decimal'){try{return M.decimal(value);}catch(_){return String(value);}}const str=String(value??'').trim().replace(/−/g,'-');const mixed=/^([+-]?\d+)\s+(\d+)\s*\/\s*(\d+)$/.exec(str);if(mixed)return '{{mix:'+mixed[1]+':'+mixed[2]+':'+mixed[3]+'}}';const fraction=/^([+-]?\d+)\s*\/\s*(\d+)$/.exec(str);if(fraction)return '{{frac:'+fraction[1]+':'+fraction[2]+'}}';const compact=str.replace(/\s+/g,'');let depth=0,slash=-1;for(let i=0;i<compact.length;i++){if(compact[i]==='(')depth++;else if(compact[i]===')')depth--;else if(compact[i]==='/'&&depth===0){if(slash!==-1)return str;slash=i;}}if(slash>0&&depth===0){const a=compact.slice(0,slash),b=compact.slice(slash+1),term=v=>{let d=0;for(let j=0;j<v.length;j++){if(v[j]==='(')d++;else if(v[j]===')')d--;else if(d===0&&j>0&&/[+−-]/.test(v[j])&&v[j-1]!=='^')return false;}return d===0&&!/[;=<>]/.test(v);},unwrap=v=>{if(v[0]!=='('||v.at(-1)!==')')return v;let d=0;for(let i=0;i<v.length-1;i++){if(v[i]==='(')d++;if(v[i]===')')d--;if(d===0)return v;}return v.slice(1,-1);};if(a&&b&&term(a)&&term(b))return '{{frac:'+unwrap(a)+':'+unwrap(b)+'}}';}return str;}

function warn(msg){const el=document.getElementById('storage-warning');el.hidden=false;el.textContent=msg;}
if(sharedMode)warn('Совместный разбор · личный прогресс не меняется');
try{const raw=sharedMode?null:localStorage.getItem(KEY);if(raw)state=sanitizeState(JSON.parse(raw));}catch(err){writable=false;warn('Не удалось прочитать сохранение. Оно не перезаписано. Текущую работу можно скачать в разделе результатов.');}
function save(){if(!writable)return;try{localStorage.setItem(KEY,JSON.stringify(state));}catch(err){writable=false;warn('Браузер не смог сохранить работу. Продолжайте занятие и скачайте результаты перед закрытием.');}}
function fresh(){return {value:'',values:[],step:0,guided:false,assisted:false,hint:false,stepHints:{},reveals:{},attempts:0,correct:false,independent:false,note:'',feedback:'',signature:'',repeated:false,completion:null,events:[],stepAttempts:{},investigation:{},firstAttempt:null,provenanceKnown:true};}
function ts(id){if(!state.tasks[id]||typeof state.tasks[id]!=='object')state.tasks[id]=fresh();const s=state.tasks[id];for(const [k,v] of Object.entries(fresh()))if(s[k]===undefined)s[k]=v;return s;}
function button(text,action,extra='',quiet=false){return '<button type="button" data-action="'+action+'" '+extra+(quiet?' class="quiet"':'')+'>'+text+'</button>';}
function go(hash){if(location.hash===hash)route();else location.hash=hash;}
function count(lesson){return lesson.tasks.filter(t=>ts(t.id).correct).length;}
function independent(lesson){return lesson.tasks.filter(t=>ts(t.id).independent).length;}
function returnBanner(){return state.origin?'<div class="return-banner"><div><strong>Тренируем отдельный навык</strong><br><span class="small">Условие, ответы и шаги исходной задачи сохранены.</span></div>'+button('← Вернуться к задаче','return')+'</div>':'';}
function skillLinks(ids){return (ids||[]).filter(id=>skills[id]).map(id=>button(e(skills[id].title),'detour','data-skill="'+id+'"',true)).join('');}
function lessonEntry(l){return '#lesson/'+l.id+(l.studyOrder?.length?'/'+l.studyOrder[0]:'');}
function home(){
 const coverage=D.completedSourceRanges.map(([first,last])=>'№'+first+'–'+last).join(', ');
 const total=D.lessons.reduce((s,l)=>s+l.tasks.length,0),done=D.lessons.reduce((s,l)=>s+count(l),0),original=D.lessons.flatMap(l=>l.tasks).filter(t=>t.source?.type==='textbook').length;main.innerHTML=`
<section class="hero"><div><p class="eyebrow">Макарычев · Алгебра · 8 класс · 2024</p><h1>Разобраться.<br>Сделать по шагам.<br>Решить самому.</h1><p class="lead">От рациональных дробей до степеней. Все темы учебника — с наглядными моделями, объяснениями и решениями.</p><div class="row"><a class="button" href="${e(state.last?.hash||'#lesson/p01')}">${state.last?'Продолжить занятие':'Начать с первой темы'} →</a><a class="button quiet" href="#chapter/2">Квадратные корни →</a>${boardEntry()}<a class="button quiet" href="#skills">Потренировать вычисления</a></div></div><div class="hero-art"><span class="eyebrow">Сначала увидим связь</span><div class="equation"><span class="fra"><span>x² − 9</span><span>x − 3</span></span> = x + 3</div><p>Разложи → сократи множитель</p><p class="small">При x ≠ 3. Ограничение сохраняется после сокращения.</p></div></section>
<div class="stats"><div class="stat"><strong>51</strong><span>тема · 6 глав</span></div><div class="stat"><strong>${total}</strong><span>задач с разбором</span></div><div class="stat"><strong>${original}</strong><span>разборов номеров и подпунктов учебника</span></div><div class="stat"><strong>${done}</strong><span>решено в этом браузере</span></div></div>
<section class="panel section"><h2>Найти номер из учебника</h2><form id="number-form" class="number-form"><label for="exercise-number">Номер упражнения (1–1340)<input id="exercise-number" type="number" min="1" max="1340" required inputmode="numeric"></label><button>Найти тему и разбор</button></form><div id="number-result" class="search-results" aria-live="polite"></div><p class="small">Все подпункты ${coverage} имеют разбор. Для остальных номеров поиск покажет доступные задачи и соответствующую тему.</p></section>
<nav class="chapter-jumps section" aria-label="Главы курса">${D.chapters.map(c=>'<a class="button quiet" href="#chapter/'+c.id+'">'+c.id+'. '+e(c.title)+'</a>').join('')}</nav>
${D.chapters.map((chapter,i)=>'<section class="section" id="chapter-'+chapter.id+'"><p class="eyebrow">Глава '+(i+1)+'</p><h2>'+e(chapter.title)+'</h2>'+(Number(chapter.id)===1?'<p class="chapter-coverage">Для каждого номера этой главы (№1–267) есть разбор всех подпунктов, включая дополнительные упражнения.</p>':Number(chapter.id)===2?'<p class="chapter-coverage">Вся глава: №268–509 со всеми подпунктами, дополнительными упражнениями и самопроверкой. Выбирай тему или ищи номер выше.</p>':Number(chapter.id)===3?'<p class="chapter-coverage">Полностью разобраны №510–837, включая дополнительные задачи по уравнениям и системам.</p>':Number(chapter.id)===4?'<p class="chapter-coverage">Для №838–1062 есть разборы всех подпунктов, в том числе дополнительных задач на неравенства, движение и среднюю скорость.</p>':'')+'<div class="grid">'+D.lessons.filter(l=>l.order>=chapter.topics[0]&&l.order<=chapter.topics[1]).map(l=>'<a class="lesson-card" href="'+lessonEntry(l)+'"><span class="lesson-number">'+String(l.order).padStart(2,'0')+'</span><div><h3>'+e(l.title)+'</h3><p class="small">С. '+l.page+' · '+l.tasks.length+' задач · наглядная модель</p><p>'+(l.advanced?'<span class="tag warm">Хочу знать больше</span>':'')+'<span class="tag">'+count(l)+' / '+l.tasks.length+' решено</span>'+(independent(l)?'<span class="tag">'+independent(l)+' самостоятельно</span>':'')+'</p></div></a>').join('')+'</div></section>').join('')}
<details class="panel section"><summary>Как устроен курс</summary><p>Порядок и темы соответствуют учебнику Ю. Н. Макарычева, Н. Г. Миндюк, К. И. Нешкова, С. Б. Суворовой «Алгебра. 8 класс», Просвещение, 2024. Объяснения и дополнительные задачи созданы для этого курса. Оригинальные задания имеют номер, подпункт и страницу.</p><p>Курс охватывает 51 тему. Упражнения ${coverage} разобраны полностью. Для остальных номеров поиск показывает, какие разборы готовы. Всего в карте 1340 номеров.</p><p>Шаги остаются видимыми. Помощь и самостоятельное решение учитываются отдельно. Тренировка вычислений сохраняет исходную задачу и возвращает к тем же записям.</p><p>Ответы и записи сохраняются в этом браузере. В разделе результатов можно скачать копию для переноса на другой компьютер.</p></details>`;document.getElementById('number-form').onsubmit=ev=>{ev.preventDefault();findNumber(Number(document.getElementById('exercise-number').value));};
 if(!sharedMode)window.MathExamCourseExamples?.catalogue(main,'makarychev8');
}
function findNumber(n){const r=document.getElementById('number-result');if(!Number.isInteger(n)||n<1||n>1340){r.textContent='Введи целый номер от 1 до 1340.';return;}const ref=D.sourceMap.sections.find(s=>s.exerciseRange&&n>=s.exerciseRange[0]&&n<=s.exerciseRange[1]);if(!ref){r.textContent='Номер не найден.';return;}const matches=D.lessons.flatMap(l=>l.tasks.map((t,i)=>({t,l,i}))).filter(x=>x.t.source?.type==='textbook'&&new RegExp('№\\s*'+n+'(?!\\d)').test(x.t.source.reference)).sort((a,b)=>a.l.order-b.l.order+(a.l.id===b.l.id?((a.l.studyOrder?.indexOf(a.i)??a.i)-(b.l.studyOrder?.indexOf(b.i)??b.i)):0));const alternatives=(D.sourceAlternatives||[]).filter(v=>v.number===n).map(v=>{const l=byId[v.lessonId],i=l.tasks.findIndex(t=>t.id===v.taskId);return {l,i,t:l.tasks[i]};});let related=ref.kind==='topic'?D.lessons.filter(l=>l.order===ref.id):D.lessons.filter(l=>(()=>{const c=D.chapters.find(c=>c.id===ref.chapter);return c&&l.order>=c.topics[0]&&l.order<=c.topics[1];})());if(ref.kind==='difficult')related=[];r.innerHTML='<h3>№ '+n+'</h3><p>'+e(ref.title)+' · с. '+ref.printedPage+'–'+ref.printedEndPage+'</p><div class="row">'+matches.map(x=>'<a class="button" href="#lesson/'+x.l.id+'/'+x.i+'">'+e(x.t.source.reference)+'</a>').join('')+alternatives.map(x=>'<a class="button quiet" href="#lesson/'+x.l.id+'/'+x.i+'">Авторская альтернатива · '+e(x.t.title)+'</a>').join('')+related.map(l=>'<a class="button quiet" href="'+lessonEntry(l)+'">'+e(l.title)+'</a>').join('')+'</div>'+(matches.length?'':alternatives.length?'<p class="small">Для этого места подготовлена самостоятельная авторская задача со своими данными. Исходное упражнение остаётся в книге.</p>':'<p class="small">Индивидуального разбора этого номера в курсе пока нет. Для повторения воспользуйся темами курса ниже или картой глав.</p>');}
function skillPage(){main.innerHTML=returnBanner()+'<p class="eyebrow">Вычислительная мастерская</p><h1>Потренируй один навык</h1><p class="lead">Выбери действие. Начни с простых чисел, затем переходи к более сложным. Кнопка «Новый пример» даёт другое задание.</p><div class="skill-grid">'+Object.values(skills).map(s=>'<article class="skill-card"><span class="eyebrow">Практика</span><h2>'+e(s.title)+'</h2><p>'+e(s.description)+'</p><a class="button quiet" href="#practice/'+s.id+'/1">Начать →</a></article>').join('')+'</div>';}
function lessonView(id,index){const l=byId[id];if(!l)return home();index=Math.max(0,Math.min(l.tasks.length-1,Math.trunc(Number(index))||0));const t=l.tasks[index],order=l.studyOrder||l.tasks.map((_,i)=>i),position=order.indexOf(index);active={lesson:l,task:t,index,practice:false};state.last={hash:'#lesson/'+id+'/'+index};save();main.innerHTML='<div class="breadcrumb"><a href="#home">← Все темы</a>'+boardEntry()+'<span>/ '+l.chapter+'</span></div><p class="eyebrow">'+(/^additional-[1-6]$/.test(t.source?.section||'')?'Дополнительно к §'+(t.source.paragraph||1)+' · с. '+t.source.page:'Тема '+l.order+' · с. '+l.page+' · № '+e(l.sourceRange))+'</p><h1 class="lesson-title">'+e(l.title)+'</h1><div class="lesson-layout"><aside class="side"><details class="task-menu"'+(window.matchMedia&&window.matchMedia('(min-width: 901px)').matches?' open':'')+'><summary>Задачи этой темы ('+l.tasks.length+')</summary><div class="side-list">'+order.map((i,pos)=>{const q=l.tasks[i];return '<button type="button" data-action="task" data-index="'+i+'" class="'+(i===index?'current':'')+'" '+(i===index?'aria-current="step"':'')+'><span class="status">'+(ts(q.id).correct?'✓':'')+'</span>'+(pos+1)+'. '+e(q.title)+'</button>';}).join('')+'</div></details></aside><div class="content-column"><div id="problem"></div><details class="panel"><summary>Коротко о главном</summary>'+l.theory.map(p=>'<div class="theory-block"><h3>'+e(p.title)+'</h3><p>'+fmt(p.text)+'</p>'+(p.example?'<div class="theory-example">'+fmt(p.example)+'</div>':'')+'</div>').join('')+'</details><details class="panel model-panel"><summary>Исследовать на модели</summary><div id="model" class="model"></div></details><div class="navigation">'+(position>0?button('← Предыдущая','task','data-index="'+order[position-1]+'"',true):'<span></span>')+(position<order.length-1?button('Следующая задача →','task','data-index="'+order[position+1]+'"',true):l.order<51?'<a class="button quiet" href="'+lessonEntry(byId['p'+String(l.order+1).padStart(2,'0')])+'">Следующая тема →</a>':'<a class="button" href="#progress">Мои результаты →</a>')+'</div></div></div>';cleanup=window.MakarychevModels?.mount(document.getElementById('model'),l,{state:ts(t.id).investigation,onChange:value=>{const saved=ts(t.id);saved.investigation=sanitizeInvestigation(value);markAssisted(saved,'model');save();}});renderProblem();if(!sharedMode)window.MathExamCourseExamples?.mount(document.getElementById('problem'),'makarychev8',l.id,()=>{markAssisted(ts(t.id),'animation');save();});document.querySelectorAll('main details.panel').forEach(el=>{el.addEventListener('toggle',()=>{if(el.open){markAssisted(ts(t.id));save();}});});}
function practiceView(id,level){if(!skills[id])return skillPage();level=[1,2,3].includes(Number(level))?Number(level):1;const key=id+':'+level;let p=state.practice[key];if(!p||!Number.isSafeInteger(p.seed))p=state.practice[key]={seed:1};const t=generatePractice(id,p.seed,level);t.id='practice:'+id+':'+level+':'+p.seed;t.signature=taskSignature(t);const saved=ts(t.id);if(!saved.signature){saved.signature=t.signature;saved.repeated=Object.entries(state.tasks).some(([other,r])=>other!==t.id&&r.signature===t.signature);}active={task:t,practice:true,skill:id,level,key};if(!state.origin)state.last={hash:'#practice/'+id+'/'+level};save();main.innerHTML=returnBanner()+'<div class="breadcrumb"><a href="#skills">← Выбрать другой навык</a></div><p class="eyebrow">Отдельная тренировка · пример '+p.seed+'</p><h1 class="lesson-title">'+e(skills[id].title)+'</h1><div class="row"><label for="level">Сложность</label><select id="level" class="level-select"><option value="1">1 · Начинаем с простого</option><option value="2">2 · Закрепляем</option><option value="3">3 · Проверяем себя</option></select><span class="small">Без ограничения времени</span></div><div id="problem" class="section"></div><div class="navigation">'+button('Новый пример →','new')+(state.origin?button('Вернуться к исходной задаче','return','',true):'<a class="button quiet" href="#skills">Другой навык</a>')+'</div><p class="small">Для самостоятельного результата реши новый пример без подсказок и с первой попытки. Разобранный пример остаётся в результатах как решение с помощью.</p>';document.getElementById('level').value=level;document.getElementById('level').onchange=ev=>go('#practice/'+id+'/'+ev.target.value);renderProblem();}
function inRoots(){return active&&!active.practice&&active.lesson.order>=10&&active.lesson.order<=19;}
function mathKeys(targetId){return inRoots()?'<div class="math-keys" role="group" aria-label="Математические знаки">'+['√','²','|','≥','≤',';'].map(v=>'<button type="button" class="quiet" data-action="math-key" data-target="'+targetId+'" data-symbol="'+e(v)+'" aria-label="Вставить '+e(v)+'">'+e(v)+'</button>').join('')+'</div>':'';}
function inputNote(target){if(target.inputNote)return e(target.inputNote);if(target.kind==='rational-example'||target.kind==='square-equation-example')return 'Введи своё число: целое, десятичную дробь или обыкновенную дробь через /.';if(target.kind==='irrational-example')return 'Введи свой пример в форме √n или sqrt(n), где n — натуральное число, либо π.';if(target.kind==='interval-examples')return 'Введи разные подходящие числа через точку с запятой. Можно использовать точные дроби и десятичные дроби.';if(target.kind==='root-line-count')return 'Введи коэффициенты своей прямой y=kx+b в порядке k; b. Можно использовать целые числа, дроби и десятичные дроби.';if(['root-points','graph-values'].includes(target.kind))return 'Введи значения в указанном порядке через точку с запятой.';if(target.kind==='text')return 'Следуй формату в вопросе. Дробь вводи через /, квадрат — как ^2 или ².'+(inRoots()?' Корень можно записать как √3 или sqrt(3); скобки сохраняют выражение под корнем.':'');if(target.kind==='set')return 'Раздели значения точкой с запятой. Два противоположных числа можно записать как ±3 или +/-3. Порядок не важен. Если значений нет, введи «нет».';const f=target.answerFormat;return {'decimal':'Введи десятичную дробь с запятой или точкой.','reduced-fraction':'Введи несократимую дробь, например 3/4, или целое число.','improper-fraction':'Введи неправильную дробь, например 7/3.','mixed-number':'Введи смешанное число с пробелом: 2 1/3.','integer':'Введи целое число.'}[f]||'Можно ввести 3/4, 0,75 или 2 1/3. Единицы измерения не вводи.';}
function axisBuilder(task,record,host){
 const form=host.querySelector('#answer-form'),input=form.querySelector('#final-answer');if(!input)return;
 const box=document.createElement('fieldset');box.className='reasoning-choices';const title=document.createElement('legend');title.textContent='Построить промежуток';box.append(title);
 const selects=[];
 function field(label,options){
  const row=document.createElement('label');row.className='small';row.textContent=label+' ';
  const control=document.createElement(options?'select':'input');if(options)for(const [val,name]of options){const op=document.createElement('option');op.value=val;op.textContent=name;control.append(op);}
  else{control.type='text';control.size=8;control.maxLength=60;control.placeholder='граница';}
  control.disabled=record.correct;row.append(control);box.append(row);selects.push(control);return control;
 }
 const l=field('Левая граница'),lc=field('Левый конец',[['(','исключён'],['[','включён']]),r=field('Правая граница'),rc=field('Правый конец',[[ ')','исключён'],[']','включён']]);
 const t=task.kind==='named-interval'?field('Название',[['','выбери'],...['отрезок','интервал','полуинтервал','числовой луч','открытый числовой луч','числовая прямая'].map(n=>[n,n])]):null;
 const note=document.createElement('p');note.className='small';note.textContent='Для бесконечного конца введи −∞ или +∞. Чтобы объединить несколько промежутков, запиши их в основном поле.';box.append(note);
 function reflect(){
  const [wire,name]=input.value.split('|').map(s=>s.trim()),match=/^([[(])([^;]*);([^;]*)([\])])$/.exec(wire);
  if(match){[lc.value,l.value,r.value,rc.value]=match.slice(1);if(t)t.value=name||'';}
  else if(!wire){l.value='';r.value='';lc.value='(';rc.value=')';if(t)t.value='';}
 }
 function changed(){input.value=(lc.value+l.value.trim()+';'+r.value.trim()+rc.value)+(t?' | '+t.value:'');input.dispatchEvent(new Event('input',{bubbles:true}));}
 selects.forEach(c=>c.addEventListener(c.tagName==='SELECT'?'change':'input',changed));input.addEventListener('input',reflect);reflect();form.querySelector('.answer-controls').before(box);
}
function systemView(config,work,value,task){
 const C=window.MakarychevCheck,range=(v)=>{const text=C.systemInput(v,config.variable);return text?C.axisRanges(text):null;};
 return {...config,partial:work.values,rangeRows:config.fixed?[]:config.rows.map((_,i)=>range(work.values[i+1])),proposal:task.kind==='system-intersection'?range(value):null,exampleProbes:task.kind==='system-examples'||task.kind==='rational-axis-list'||config.integerResult?C.rationalList(value):null};
}


function linearEvidence(config,work,value,task){
 const C=window.MakarychevCheck,G=window.MakarychevTaskGraphs,range=config.draw?C.linearRay(value,config.variable):null;
 const samples=task.kind==='linear-examples'?C.rationalList(value):null;
 return {...config,partial:work.values,proposal:range?C.axisRanges(range):null,samplePoints:[M.parse(work.values[0])].filter(Boolean),exampleTrials:samples?.map(x=>[M.answer(x),G.linearTrial(config,x)])};
}
function axisEvidence(config,work,value){
 const C=window.MakarychevCheck,part=String(value??'').split('|')[0],proposal=['draw','read','operation'].includes(config.mode)?C.axisRanges(part):null;
 let points=config.probe!==undefined?[M.parse(config.probe)]:config.mode==='list'?(C.rationalList(value)||[]):config.useFinal?[M.parse(value)]:[];
 return {...config,givenRows:(config.given||[]).map(C.axisRanges).filter(Boolean),proposal,points:points.filter(Boolean)};
}


function proofControls(task,record,host){
 const field=document.createElement('fieldset'),legend=document.createElement('legend');
 field.className='reasoning-choices';legend.textContent=task.orderLegend||'Утверждения для доказательства';field.append(legend);
 const input=host.querySelector('#final-answer');
 const buttons=task.proofClaims.map((text,index)=>{
  const button=document.createElement('button');button.type='button';button.className='quiet';
  button.textContent=(index+1)+'. '+text;button.disabled=record.correct;field.append(button);
  button.onclick=()=>{
   const selected=window.MakarychevCheck.proofOrder(input.value,task.proofClaims.length)||[],number=index+1;
   input.value=(selected.includes(number)?selected.filter(n=>n!==number):[...selected,number]).join(';');
   input.dispatchEvent(new Event('input',{bubbles:true}));
  };
  return button;
 });
 const summary=document.createElement('p');summary.className='small';summary.setAttribute('aria-live','polite');field.append(summary);
 const reflect=()=>{
  const order=window.MakarychevCheck.proofOrder(input.value,task.proofClaims.length)||[];
  buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(order.includes(i+1))));
  summary.textContent=order.length?'Твой порядок: '+order.join(' → '):'Утверждения пока не выбраны.';
 };
 host.querySelector('#answer-form .answer-controls').before(field);input.addEventListener('input',reflect);reflect();
}
function stepChoiceControls(host,task){
 host.querySelectorAll('[data-step-form]').forEach(form=>{
  const q=task.steps[Number(form.dataset.stepForm)];
  if(q.kind!=='choice'||!q.choices?.length)return;
  const input=form.querySelector('[data-step-input]'),group=document.createElement('div');
  group.className='reasoning-choices';group.setAttribute('role','group');group.setAttribute('aria-label','Варианты ответа к шагу');
  const buttons=q.choices.map(option=>{
   const button=document.createElement('button');button.type='button';button.className='quiet';button.textContent=option;
   button.onclick=()=>{input.value=option;input.dispatchEvent(new Event('input',{bubbles:true}));};
   group.append(button);return button;
  });
  const reflect=()=>buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(q.choices[i]===input.value)));
  input.addEventListener('input',reflect);form.querySelector('.answer-controls').before(group);
  const note=form.querySelector('p.small');if(note)note.textContent='Выбери подходящий вариант и проверь шаг.';
  reflect();
 });
}
function renderProblem(){if(!active)return;const t=active.task,s=ts(t.id),host=document.getElementById('problem');
 const provenance=t.source?'<p class="source-note">'+e(t.source.type==='textbook'?'Из учебника: '+t.source.reference+', с. '+t.source.page+(t.source.endPage?'–'+t.source.endPage:''):t.source.correspondence==='author-alternative'?'Авторская альтернатива к месту № '+t.source.originalNumber+', с. '+t.source.page+' · своё условие и данные':t.source.adaptation?'Самопроверка по учебнику: '+t.source.reference+', с. '+t.source.page:'Авторская задача по теме учебника')+'</p>':'';
 const condition='<div class="prompt">'+fmt(t.prompt)+(t.mathExpression?textbookFormula(t.mathExpression):'')+'</div>';
 const statement=t.graph?condition+'<div id="task-graph"></div>'+provenance:provenance+condition;
 host.innerHTML='<article class="problem"><div class="task-heading"><h2>'+e(t.title)+'</h2><span class="tag">'+(s.correct?learningLabel(s):'Твоя задача')+'</span></div>'+statement+'<div class="row">'+button(s.hint?'Закрыть подсказку':'Хочешь подсказку?','hint','',true)+(t.steps?.length?button(s.guided?'Скрыть разбор':'Разобрать по шагам','guided','',true):'')+'</div>'+(s.hint?'<div class="help"><strong>Подсказка</strong><p>'+fmt(t.hint||'Выдели, что известно и что требуется найти. Вспомни правило из раздела «Коротко о главном».')+'</p></div>':'')+(s.guided?renderSteps(t,s):'')+'<form class="answer-form" id="answer-form"><label for="final-answer">'+fmt(t.finalLabel||(t.kind==='choice'?'Выбери верный ответ на вопрос задачи.':'Чему равен результат? Введи число.'))+'</label>'+(t.kind==='choice'?'<div class="choices" role="group" aria-label="Варианты ответа">'+t.choices.map((v,i)=>'<button type="button" data-action="choice" data-choice="'+i+'" class="'+(s.value===v?'selected':'')+'" aria-pressed="'+(s.value===v)+'">'+fmt(v)+'</button>').join('')+'</div><button type="submit" '+(s.correct?'disabled':'')+'>Проверить ответ</button>':'<p class="small">'+inputNote(t)+'</p><div class="answer-controls"><input id="final-answer" name="final-answer" type="text" inputmode="text" autocomplete="off" spellcheck="false" value="'+e(s.value)+'" '+(s.correct?'readonly':'')+'><button type="submit" '+(s.correct?'disabled':'')+'>Проверить ответ</button></div>'+(!s.correct&&t.kind!=='proof-chain'?mathKeys('final-answer'):'')+'<div id="answer-preview" class="answer-preview small" aria-live="polite"></div>')+'<div class="feedback '+(s.feedback&&!s.correct?'error':'')+'" role="status">'+e(s.feedback)+'</div></form>'+(s.correct?'<div class="feedback"><strong>'+(s.independent?'Верно, самостоятельно.':'Верно. Теперь закрепи навык на новом примере.')+'</strong><p>'+fmt(t.explanation)+'</p>'+freshAction()+'</div>':'')+((t.skills?.length)?'<section class="detour"><h3>С вычислением нужна помощь?</h3><p class="small">Потренируй отдельное действие. Затем вернись к этому же условию и записям.</p><div class="row">'+skillLinks(t.skills)+'</div></section>':'')+'<details '+(s.note?'open':'')+'><summary>Мои записи к задаче</summary><label class="small" for="notebook">Сохраняются вместе с этой задачей</label><textarea id="notebook" placeholder="Запиши свою мысль или промежуточные вычисления">'+e(s.note)+'</textarea></details>'+historyView(s)+'</article>';
const sourceNote=active.lesson?.sourceNotes?.[t.id];
if(sourceNote&&(s.correct||s.hint||s.guided)){const note=document.createElement('p');note.className='small';note.dataset.sourceAnnotation='';note.textContent=sourceNote;host.querySelector('article').append(note);}
const formula=host.querySelector('.m8-exercise-formula');
if(formula){
 if(formula.scrollWidth>formula.clientWidth+1){
  const note=document.createElement('p');note.className='small';note.textContent='Формулу можно прокрутить вправо.';formula.after(note);
 }else formula.removeAttribute('tabindex');
}
if(t.graph?.builder)axisBuilder(t,s,host);
if(t.kind==='proof-chain')proofControls(t,s,host);
stepChoiceControls(host,t);
if(t.graph){
 const modelInput=['domain-fraction','integer-pairs','train-meeting','natural-values','work-hours','equal-distances','shared-hyperbola-line','quadratic-story','quadratic-example','quadratic-parameter','quadratic-discriminant','vieta-relations','quadratic-reciprocals','check-common-point'].includes(t.graph.type)&&!s.attempts&&!s.hint&&!s.guided?'':s.value;
 let graph=t.graph.revealAfterSubmit?{...t.graph,showSolution:s.correct}:t.graph;
 if(modelInput&&graph.scene==='walk'){
  const exact=window.MakarychevCheck.signedSquare(modelInput);
  if(exact)graph={...graph,proposedTime:exact.sign*Math.sqrt(Number(exact.n)/Number(exact.d))};
 }
 if(['vertex-form','coefficient-example'].includes(graph.type))graph={...graph,evaluated:Boolean(s.attempts||s.correct)};
 if(['rational-intersections','rational-root-audit','graph-root-reading'].includes(graph.type))graph=rationalEvidence(graph,s.value);
 if(['source-fraction','travel-times','quantity-audit','linear-review','inequality-evidence'].includes(graph.type))graph={...graph,trial:s.values[graph.trialStep||0],prediction:s.values[graph.predictionStep],completed:s.correct};
 if(graph.fixedInput)graph={...graph,partial:s.values,showValue:Boolean(s.correct)};
 if(graph.type==='source-review-43')graph={...graph,partial:s.values};
 if(graph.type==='source-formula-zeros'&&!graph.legacy)graph={...graph,partial:s.values};
 if(graph.type==='source-curve-properties')graph={...graph,partial:s.values};
 if(graph.type==='source-phase-reading')graph={...graph,partial:s.values};
 if(graph.type==='source-trip-review')graph={...graph,partial:s.values};
 if(graph.type==='source-behavior-review')graph={...graph,partial:s.values,proposal:graph.variable?window.MakarychevCheck.axisRanges(window.MakarychevCheck.systemInput(s.value,graph.variable)):null};
 if(graph.type==='source-function-features')graph={...graph,partial:s.values,proposal:['domain','range'].includes(graph.mode)?window.MakarychevCheck.axisRanges(window.MakarychevCheck.systemInput(s.value,graph.variable)):null};
 if(graph.type==='source-reading-graph')graph={...graph,partial:s.values,proposal:window.MakarychevCheck.axisRanges(window.MakarychevCheck.systemInput(s.value,graph.variable||'y')),xs:graph.mode==='preimage'?window.MakarychevCheck.rationalList(s.value):null};
 if(graph.type==='source-function-domain')graph={...graph,partial:s.values,proposal:['radical','quotient','zero'].includes(graph.case)?window.MakarychevCheck.axisRanges(window.MakarychevCheck.systemInput(s.value,'x')):null};
 if(graph.type==='source-function-values')graph={...graph,partial:s.values,roots:graph.mode==='zeros'?window.MakarychevCheck.setEntries(s.value):null};
 if(graph.type==='source-applied-bounds'){const C=window.MakarychevCheck;graph={...graph,partial:s.values,proposal:['load','triangle'].includes(graph.mode)?null:C.axisRanges(C.systemInput(s.value,graph.variable))};}
 if(graph.type==='source-solution-audit'){const C=window.MakarychevCheck;graph={...graph,partial:s.values,proposal:graph.mode==='natural'?null:C.axisRanges(C.systemInput(s.value,graph.variable)),selected:graph.mode==='natural'?C.rationalList(s.value):null};}
 if(graph.type==='interval-set-review'){const rows=graph.mode==='surd'?[graph.aboveRoot?'(-∞;'+ graph.bound+')':'('+ graph.bound+';+∞)']:[...(graph.ranges||[]),...(graph.claim?[graph.claim]:[])];graph={...graph,partial:s.values,rows:rows.map(r=>window.MakarychevCheck.axisRanges(r))};}
 if(graph.type==='source-proof-review')graph={...graph,trial:s.values[0]};
 if(['source-system-review','geometry-bound-review'].includes(graph.type))graph={...graph,partial:s.values,proposal:graph.variable?window.MakarychevCheck.axisRanges(window.MakarychevCheck.systemInput(s.value,graph.variable)):null};
 if(graph.type==='source-system-rays')graph=systemView(graph,s,s.value,t);
 if(graph.type==='source-inequality-case')graph={...graph,partial:s.values,proposal:graph.showAxis?window.MakarychevCheck.axisRanges(s.value):null};
 if(graph.type==='linear-ray-trial')graph=linearEvidence(graph,s,s.value,t);
 if(graph.type==='source-interval-axis')graph=axisEvidence(graph,s,s.value);
 if(graph.type==='interval-review')graph={...graph,partial:s.values};
 if(graph.type==='euler-operation')graph={...graph,partial:s.values};
 if(['combined-intervals','two-comparisons','power-order','median-investigation','diagonal-proof','mean-factors','signed-square-proof','library-area','cancel-ratio','cut-square'].includes(graph.type))graph={...graph,partial:s.values,proposal:graph.type==='combined-intervals'?window.MakarychevCheck.estimateInput(s.value,graph.expression):null};
 if(graph.type==='interval-image')graph={...graph,proposal:window.MakarychevCheck.estimateInput(s.value,graph.expression),partial:s.values};
 if(graph.type==='rank-expressions')graph={...graph,trial:s.values[0],selected:graph.isOrder?window.MakarychevCheck.proofOrder(s.value,graph.labels.length):null};
 if(graph.type==='square-substitution')graph={...graph,partial:s.values};
 if(graph.type==='labelled-order')graph={...graph,trial:s.values[0]};
 if(graph.stepTrials){const index=Math.min(s.step,graph.stepTrials.length-1);graph={...graph,trial:s.values[index]||s.values[0]};}
 if(graph.type==='factor-witness')graph=factorEvidence(graph,s.value);
 if(graph.type==='vieta-audit')graph={...graph,audit:window.MakarychevCheck.vietaAudit(s.value,graph)};
 if(graph.type==='root-residual')graph={...graph,checks:window.MakarychevCheck.quadraticTrial(s.value,graph.coefficients)};
 if(graph.type==='parameter-polynomial')graph={...graph,trial:s.values[0]};
 if(graph.type==='story-balance')graph={...graph,trial:s.values[1]};
 if(graph.type==='system-pair-audit')graph={...graph,evidence:window.MakarychevCheck.systemEvidence(s.value,graph),checked:Boolean(s.attempts||s.correct)};
 if(graph.type==='inequality-intervals')graph={...graph,intervals:window.MakarychevCheck.openIntervals(s.value)};
 if(graph.type==='abs-line-choice')graph={...graph,analysis:window.MakarychevCheck.absLineIntersections(modelInput),checked:Boolean(s.attempts||s.correct)};
 if(graph.type==='rational-line-example')graph={...graph,analysis:window.MakarychevCheck.reciprocalIntersections(modelInput),checked:Boolean(s.attempts||s.correct)};
 if(graph.type==='rational-equation-check')graph={...graph,terms:window.MakarychevCheck.classifyRationalCandidates(s.value,graph.excluded,graph.solutions),checked:Boolean(s.attempts||s.correct)};
 if(['own-lines','own-points'].includes(graph.type))graph={...graph,groups:window.MakarychevCheck.pointGroups(s.value)};
 if(graph.type==='intersection-example')graph={...graph,reveal:Boolean(s.attempts||s.hint||s.guided)};
 if(modelInput&&graph.type==='domain-fraction')graph={...graph,analysis:window.MakarychevCheck.inspectDomainFraction(modelInput,t.exclusions)};
 if(modelInput&&graph.type==='natural-values')graph={...graph,rows:(window.MakarychevCheck.setEntries(modelInput)||[]).map(term=>({term,pair:naturalCase(term,t.naturalRule)}))};
 window.MakarychevTaskGraphs?.render(document.getElementById('task-graph'),graph,modelInput);
}
document.getElementById('answer-form').onsubmit=ev=>{ev.preventDefault();checkFinal();};const inp=document.getElementById('final-answer');if(inp){inp.oninput=()=>{s.value=inp.value.slice(0,1000);inp.value=s.value;save();preview(inp.value);};preview(inp.value);}document.getElementById('notebook').oninput=ev=>{s.note=ev.target.value.slice(0,15000);ev.target.value=s.note;save();};host.querySelectorAll('[data-step-input]').forEach(el=>{el.oninput=()=>{s.values[Number(el.dataset.stepInput)]=el.value.slice(0,1000);el.value=s.values[Number(el.dataset.stepInput)];save();if(['story-balance','parameter-polynomial','source-fraction','travel-times','quantity-audit','linear-review','inequality-evidence','labelled-order','source-proof-review','source-review-43','source-formula-zeros','source-graph-witness','source-curve-properties','source-phase-reading','source-trip-review','source-behavior-review','source-function-features','source-reading-graph','source-function-domain','source-function-values','source-applied-bounds','source-solution-audit','interval-set-review','geometry-bound-review','source-system-review','source-system-rays','source-inequality-case','linear-ray-trial','source-interval-axis','interval-review','euler-operation','overlap-segments','proportion-coefficient','harvest-check','combined-intervals','two-comparisons','power-order','median-investigation','diagonal-proof','mean-factors','signed-square-proof','library-area','cancel-ratio','cut-square','interval-image','rank-expressions','square-substitution'].includes(t.graph?.type))preview(s.value);};});host.querySelectorAll('[data-step-form]').forEach(el=>{el.onsubmit=ev=>{ev.preventDefault();checkStep(Number(el.dataset.stepForm));};});}
function rationalEvidence(graph,value){
 const C=window.MakarychevCheck;
 if(graph.type==='rational-root-audit')return {...graph,checks:C.rationalRootTrial(value,graph)};
 if(graph.type==='graph-root-reading')return {...graph,readings:C.graphRootEntries(value)};
 const pairs=C.algebraPairs(value)?.map(pair=>pair.map(C.radicalApprox))||[];
 return {...graph,pairs:pairs.filter(pair=>pair.every(Number.isFinite))};
}
function factorEvidence(graph,value){
 const [a,...roots]=String(value||'').split(';');
 return {...graph,rightLeading:M.equal(a,graph.leading),audit:window.MakarychevCheck.vietaAudit(roots.join(';'),graph)};
}
function preview(value){if(active?.task.graph?.learnerIntersections||['build','pair','root-build','curve-build','root-line','line-example','rational-intersections','rational-root-audit','graph-root-reading','travel-times','quantity-audit','linear-review','inequality-evidence','labelled-order','transformed-numbers','source-proof-review','source-review-43','source-formula-zeros','source-graph-witness','source-curve-properties','source-phase-reading','source-trip-review','source-behavior-review','source-function-features','source-reading-graph','source-function-domain','source-function-values','source-applied-bounds','source-solution-audit','interval-set-review','geometry-bound-review','source-system-review','source-system-rays','source-inequality-case','linear-ray-trial','source-interval-axis','interval-review','euler-operation','overlap-segments','proportion-coefficient','harvest-check','combined-intervals','two-comparisons','power-order','median-investigation','diagonal-proof','mean-factors','signed-square-proof','library-area','cancel-ratio','cut-square','interval-image','rank-expressions','compare-surd-values','square-substitution','radical-comparison','source-fraction','factor-witness','vieta-audit','number-sequence','applied-measure','root-residual','square-certificate','parameter-polynomial','story-balance','inequality-intervals','abs-line-choice','own-lines','own-points','rate-table','two-equations','applied-shape','vertex-form','leg-trial','coefficient-example','rational-line-example'].includes(active?.task.graph?.type)){
 const state=ts(active.task.id),base=active.task.graph;
 let graph=['vertex-form','coefficient-example'].includes(base.type)?{...base,evaluated:Boolean(state.attempts||state.correct)}:base;
 if(['own-lines','own-points'].includes(base.type))graph={...base,groups:window.MakarychevCheck.pointGroups(value)};
 if(['rational-intersections','rational-root-audit','graph-root-reading'].includes(base.type))graph=rationalEvidence(base,value);
 if(['source-fraction','travel-times','quantity-audit','linear-review','inequality-evidence'].includes(base.type))graph={...base,trial:state.values[base.trialStep||0],prediction:state.values[base.predictionStep],completed:state.correct};
 if(base.fixedInput)graph={...graph,partial:state.values,showValue:Boolean(state.correct)};
 if(base.type==='source-review-43')graph={...base,partial:state.values};
 if(base.type==='source-formula-zeros'&&!base.legacy)graph={...base,partial:state.values};
 if(base.type==='source-curve-properties')graph={...base,partial:state.values};
 if(base.type==='source-phase-reading')graph={...base,partial:state.values};
 if(base.type==='source-trip-review')graph={...base,partial:state.values};
 if(base.type==='source-behavior-review')graph={...base,partial:state.values,proposal:base.variable?window.MakarychevCheck.axisRanges(window.MakarychevCheck.systemInput(value,base.variable)):null};
 if(base.type==='source-function-features')graph={...base,partial:state.values,proposal:['domain','range'].includes(base.mode)?window.MakarychevCheck.axisRanges(window.MakarychevCheck.systemInput(value,base.variable)):null};
 if(base.type==='source-reading-graph')graph={...base,partial:state.values,proposal:window.MakarychevCheck.axisRanges(window.MakarychevCheck.systemInput(value,base.variable||'y')),xs:base.mode==='preimage'?window.MakarychevCheck.rationalList(value):null};
 if(base.type==='source-function-domain')graph={...base,partial:state.values,proposal:['radical','quotient','zero'].includes(base.case)?window.MakarychevCheck.axisRanges(window.MakarychevCheck.systemInput(value,'x')):null};
 if(base.type==='source-function-values')graph={...base,partial:state.values,roots:base.mode==='zeros'?window.MakarychevCheck.setEntries(value):null};
 if(base.type==='source-applied-bounds'){const C=window.MakarychevCheck;graph={...base,partial:state.values,proposal:['load','triangle'].includes(base.mode)?null:C.axisRanges(C.systemInput(value,base.variable))};}
 if(base.type==='source-solution-audit'){const C=window.MakarychevCheck;graph={...base,partial:state.values,proposal:base.mode==='natural'?null:C.axisRanges(C.systemInput(value,base.variable)),selected:base.mode==='natural'?C.rationalList(value):null};}
 if(base.type==='interval-set-review'){const rows=base.mode==='surd'?[base.aboveRoot?'(-∞;'+ base.bound+')':'('+ base.bound+';+∞)']:[...(base.ranges||[]),...(base.claim?[base.claim]:[])];graph={...base,partial:state.values,rows:rows.map(r=>window.MakarychevCheck.axisRanges(r))};}
 if(base.type==='source-proof-review')graph={...base,trial:state.values[0]};
 if(['source-system-review','geometry-bound-review'].includes(base.type))graph={...base,partial:state.values,proposal:base.variable?window.MakarychevCheck.axisRanges(window.MakarychevCheck.systemInput(value,base.variable)):null};
 if(base.type==='source-system-rays')graph=systemView(base,state,value,active.task);
 if(base.type==='source-inequality-case')graph={...base,partial:state.values,proposal:base.showAxis?window.MakarychevCheck.axisRanges(value):null};
 if(base.type==='linear-ray-trial')graph=linearEvidence(base,state,value,active.task);
 if(base.type==='source-interval-axis')graph=axisEvidence(base,state,value);
 if(base.type==='interval-review')graph={...base,partial:state.values};
 if(base.type==='euler-operation')graph={...base,partial:state.values};
 if(['combined-intervals','two-comparisons','power-order','median-investigation','diagonal-proof','mean-factors','signed-square-proof','library-area','cancel-ratio','cut-square'].includes(base.type))graph={...base,partial:state.values,proposal:base.type==='combined-intervals'?window.MakarychevCheck.estimateInput(value,base.expression):null};
 if(base.type==='interval-image')graph={...base,proposal:window.MakarychevCheck.estimateInput(value,base.expression),partial:state.values};
 if(base.type==='rank-expressions')graph={...base,trial:state.values[0],selected:base.isOrder?window.MakarychevCheck.proofOrder(value,base.labels.length):null};
 if(base.type==='square-substitution')graph={...base,partial:state.values};
 if(base.type==='labelled-order')graph={...base,trial:state.values[0]};
 if(base.stepTrials){const index=Math.min(state.step,base.stepTrials.length-1);graph={...graph,trial:state.values[index]||state.values[0]};}
 if(base.type==='factor-witness')graph=factorEvidence(base,value);
 if(base.type==='vieta-audit')graph={...base,audit:window.MakarychevCheck.vietaAudit(value,base)};
 if(base.type==='root-residual')graph={...base,checks:window.MakarychevCheck.quadraticTrial(value,base.coefficients)};
 if(base.type==='parameter-polynomial')graph={...base,trial:state.values[0]};
 if(base.type==='story-balance')graph={...base,trial:state.values[1]};
 if(base.type==='inequality-intervals')graph={...base,intervals:window.MakarychevCheck.openIntervals(value)};
 if(base.type==='abs-line-choice')graph={...base,analysis:window.MakarychevCheck.absLineIntersections(value),checked:Boolean(state.attempts||state.correct)};
 if(base.type==='rational-line-example')graph={...base,analysis:window.MakarychevCheck.reciprocalIntersections(value),checked:Boolean(state.attempts||state.correct)};
 window.MakarychevTaskGraphs?.render(document.getElementById('task-graph'),graph.revealAfterSubmit?{...graph,showSolution:ts(active.task.id).correct}:graph,value);
}const p=document.getElementById('answer-preview');if(!p)return;if(active?.task.kind==='text'||active?.task.kind==='progression-factor-example'||active?.task.kind==='rational-line-example'||active?.task.kind==='set'||active?.task.kind==='graph'||active?.task.kind==='graph-pair'||['quadratic-roots','radical-value','incomplete-coefficients','proof-chain','separated-rational','domain-fraction','common-factor','integer-pairs','root-points','graph-values','root-line-count','irrational-example','interval-examples'].includes(active?.task.kind)){p.textContent=value.trim()?'Твоя запись: '+value:'';return;}const r=M.parse(value);p.innerHTML=value.trim()?(r?'Ты ввёл: '+fmt(displayValue(value)):'Формат пока не распознан. Примеры: 0,5 · 1/2 · 2 1/3') : '';}
function renderSteps(t,s){let html='<section class="steps"><p class="small">Каждый завершённый шаг остаётся видимым. Разбор считается помощью.</p>';for(let i=0;i<Math.min(t.steps.length,s.step+1);i++){const q=t.steps[i],done=i<s.step;html+='<div class="step '+(done?'completed':'')+'"><span class="step-label">Шаг '+(i+1)+(done?' · готово':'')+'</span><h3>'+fmt(q.prompt)+'</h3>'+(done?'<div class="recorded">'+(q.hypothesis?'Твой прогноз: ':'Твоя запись: ')+fmt(displayValue(s.values[i]))+(q.hypothesis?' · сохранён':' ✓')+'</div><p>'+fmt(q.explanation||'')+'</p>':'<form data-step-form="'+i+'"><p class="small">'+inputNote(q)+'</p><div class="answer-controls"><input id="step-answer-'+i+'" aria-label="Ответ к шагу '+(i+1)+'" data-step-input="'+i+'" type="text" autocomplete="off" value="'+e(s.values[i]||'')+'"><button>Проверить шаг</button></div>'+(q.kind==='choice'?'':mathKeys('step-answer-'+i))+'</form><div class="row">'+button(s.stepHints[i]?'Скрыть подсказку':'Подсказка к этому шагу','step-hint','data-step="'+i+'"',true)+(s.stepHints[i]?button('Показать этот шаг','reveal','data-step="'+i+'"',true):'')+'</div>'+(s.stepHints[i]?'<div class="help">'+fmt(q.hint||q.explanation)+'</div>':'')+(s.reveals[i]?'<div class="help">'+fmt(q.explanation||'Выполни указанное действие.')+'<p>Результат шага: '+fmt(displayValue(q.answer,q.answerFormat))+'. Введи его и проверь.</p></div>':'')+'<div id="step-feedback-'+i+'" class="feedback error" role="status"></div>')+'</div>';}if(s.step>=t.steps.length)html+='<p class="feedback">Все шаги готовы. Теперь ответь на вопрос исходной задачи ниже.</p>';return html+'</section>';}
function check(user,q){return window.MakarychevCheck.check(user,q);}
function checkFinal(){const t=active.task,s=ts(t.id);if(s.correct)return;if(!s.value.trim()){s.feedback=t.kind==='choice'?'Сначала выбери ответ.':'Сначала введи результат.';renderProblem();return;}const issue=formatProblem(s.value,t);if(issue){s.feedback=issue;save();renderProblem();return;}s.attempts++;const isCorrect=check(s.value,t);if(!s.firstAttempt)s.firstAttempt={value:s.value.slice(0,1000),correct:isCorrect,at:Date.now()};recordEvent(s,'answer',s.value,isCorrect);if(isCorrect){s.correct=true;if(boardMode)s.assisted=true;s.independent=!boardMode&&!s.assisted&&!s.repeated&&s.attempts===1;s.completion={attempts:s.attempts,assisted:s.assisted,independent:s.independent,at:Date.now()};s.feedback='';}else{s.feedback='Пока не совпало. '+feedbackFor(s.value,t)+(s.attempts>=2?' После двух попыток можно открыть подсказку или разобрать трудный шаг.':'');}save();renderProblem();}
function checkStep(i){const t=active.task,s=ts(t.id),q=t.steps[i];if(i!==s.step)return;const v=s.values[i]||'';if(!v.trim()){document.getElementById('step-feedback-'+i).textContent='Сначала введи результат этого шага.';return;}const issue=formatProblem(v,q);if(issue){document.getElementById('step-feedback-'+i).textContent=issue;return;}s.stepAttempts[i]=(s.stepAttempts[i]||0)+1;const good=check(v,q);recordEvent(s,q.hypothesis?'prediction':'step',v,q.hypothesis?false:good,i);if(good){s.step++;save();renderProblem();}else{save();document.getElementById('step-feedback-'+i).textContent='Шаг '+(i+1)+': '+feedbackFor(v,q)+(s.stepAttempts[i]>=2?' Можно открыть подсказку именно к этому шагу.':'');}}
const reviewWait=5*24*60*60*1000;
function reviewPanel(){const now=Date.now(),due=D.lessons.filter(l=>{const latest=Math.max(0,...l.tasks.map(t=>{const s=state.tasks[t.id];return s?.independent?s.completion?.at||0:0;}));return latest&&now-latest>=reviewWait;});return '<details class="panel"><summary>Короткий цикл и повторение после паузы</summary><p>На 10–15 минут: личный прогноз → один опыт → объяснение → новое условие без помощи. В группе каждый сначала отвечает сам, затем обсуждает способ.</p><p class="small">Повтор предлагаем через 5 дней. Старые результаты без даты не считаем повторёнными автоматически.</p>'+ (due.length?due.map(l=>{const index=nextFresh(l);const skill=l.tasks.flatMap(t=>t.skills||[]).find(id=>skills[id]);return index>=0?'<p><a href="#lesson/'+l.id+'/'+index+'">'+e(l.title)+'</a> — новое условие для проверки.</p>':'<p>'+e(l.title)+': новые условия темы закончились.</p>'+(skill?button('Новый пример: '+e(skills[skill].title),'review-skill','data-skill="'+skill+'"',true)+'<p class="small">Проверяем только этот вычислительный навык, не всю тему.</p>':'<p class="small">Для новой проверки потребуется другое условие преподавателя.</p>');}).join(''):'<p>Пока нет результатов с известной датой для отсроченной проверки.</p>')+'</details>';}
function progress(){const lessonRows=D.lessons.map(l=>'<tr><td><a href="'+lessonEntry(l)+'">'+e(l.title)+'</a></td><td>'+independent(l)+'</td><td>'+(count(l)-independent(l))+'</td><td>'+l.tasks.length+'</td></tr>').join(''),pr=Object.entries(state.tasks).filter(([id,s])=>id.startsWith('practice:')&&s.correct);main.innerHTML='<p class="eyebrow">Мои результаты</p><h1>Виден каждый шаг</h1><p class="lead">Самостоятельно — с первой попытки, без открытого разбора и подсказок. Решение с помощью тоже полезно: оно учитывается отдельно. Исправленные ответы, помощь и знакомые условия различаются в истории каждой задачи.</p>'+reviewPanel()+'<div class="panel table-scroll" role="region" aria-label="Результаты по темам" tabindex="0"><table class="progress-table"><thead><tr><th>Тема</th><th>Сам</th><th>С помощью / после попыток</th><th>Всего задач</th></tr></thead><tbody>'+lessonRows+'</tbody></table></div><h2>Отдельные тренировки</h2><p>Решено '+pr.length+' примеров, из них '+pr.filter(([,s])=>s.independent).length+' самостоятельно.</p><div class="grid">'+Object.values(skills).map(sk=>{const list=pr.filter(([id])=>id.split(':')[1]===sk.id);return list.length?'<div class="panel"><h3>'+e(sk.title)+'</h3><p>'+list.filter(([,s])=>s.independent).length+' самостоятельно · '+list.filter(([,s])=>!s.independent).length+' с помощью / после попыток</p><a href="#practice/'+sk.id+'/1">Продолжить</a></div>':'';}).join('')+'</div><div class="panel"><h2>Сохранить свою работу</h2><p>Результаты и черновики находятся в этом браузере. Скачай резервную копию, чтобы перенести их на другое устройство.</p><div class="row">'+button('Скачать сохранение','export')+'<label class="button quiet" for="import-file">Открыть сохранение<input class="sr-only" id="import-file" type="file" accept="application/json,.json"></label></div><p id="import-status" role="status" class="small"></p></div>';document.getElementById('import-file').onchange=importState;}
function download(){const blob=new Blob([JSON.stringify({course:'makarychev8-2024',exportedAt:new Date().toISOString(),state},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Makarychev8-progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function importState(ev){const file=ev.target.files[0],status=document.getElementById('import-status');if(!file)return;if(sharedMode){status.textContent='Личные сохранения открываются в самостоятельной работе, вне совместного разбора.';return;}try{if(file.size>5000000)throw Error('Файл слишком большой.');const data=JSON.parse(await file.text());if(data.course!=='makarychev8-2024')throw Error('Это не сохранение данного курса.');const incoming=sanitizeState(data.state);for(const [id,s]of Object.entries(incoming.tasks)){const current=state.tasks[id];const hasWork=current&&(current.correct||current.value||current.note||current.step>0||current.attempts>0||current.assisted||current.events?.length||current.investigation?.started||current.guided||current.hint||(current.values||[]).some(Boolean)||Object.keys(current.stepHints||{}).length||Object.keys(current.reveals||{}).length);if(!hasWork)state.tasks[id]=s;}for(const [key,p]of Object.entries(incoming.practice))state.practice[key]={seed:Math.max(p.seed,state.practice[key]?.seed||1)};state=sanitizeState(state);save();progress();document.getElementById('import-status').textContent='Сохранения объединены. Для задач, над которыми уже работали здесь, сохранены текущие ответы, шаги и записи.';}catch(err){status.textContent='Не удалось открыть: '+err.message;}}
function newPractice(){const used=new Set(Object.values(state.tasks).map(s=>s.signature).filter(Boolean));let seed=state.practice[active.key].seed;for(let i=0;i<1000&&seed<999999;i++){seed++;const task=generatePractice(active.skill,seed,active.level);if(!used.has(taskSignature(task))){state.practice[active.key].seed=seed;save();practiceView(active.skill,active.level);return;}}ts(active.task.id).feedback='В этой подборке пока не нашёлся новый пример. Выбери другую сложность или другой навык.';renderProblem();}

function reviewSkill(id){if(!skills[id])return;const key=id+':1',used=new Set(Object.values(state.tasks).map(s=>s.signature).filter(Boolean));let seed=state.practice[key]?.seed||1;for(let i=0;i<1000&&seed<1000000;i++,seed++){if(!used.has(taskSignature(generatePractice(id,seed,1)))){state.practice[key]={seed};save();go('#practice/'+id+'/1');return;}}warn('Новые условия этого навыка закончились. Выбери другую сложность.');}
function openDetour(id){if(!skills[id])return;if(active&&!active.practice){state.origin={hash:'#lesson/'+active.lesson.id+'/'+active.index,scroll:window.scrollY};markAssisted(ts(active.task.id),'detour');save();}go('#practice/'+id+'/1');}
document.addEventListener('click',ev=>{if(ev.target.closest('a.skip')){ev.preventDefault();main.focus();return;}const b=ev.target.closest('[data-action]');if(!b)return;const action=b.dataset.action;
 if(action==='review-skill'){reviewSkill(b.dataset.skill);return;}
 if(action==='detour'){openDetour(b.dataset.skill);return;}
 if(action==='return'){const origin=state.origin;state.origin=null;save();if(origin){go(origin.hash);requestAnimationFrame(()=>requestAnimationFrame(()=>window.scrollTo(0,origin.scroll||0)));}else go('#home');return;}
 if(action==='export'){download();return;}
 if(!active)return;const s=ts(active.task.id);
 if(action==='math-key'){const input=document.getElementById(b.dataset.target);if(!input||input.readOnly)return;input.focus();const start=input.selectionStart??input.value.length,end=input.selectionEnd??start;input.setRangeText(b.dataset.symbol,start,end,'end');input.dispatchEvent(new Event('input',{bubbles:true}));return;}
 if(action==='task'){go('#lesson/'+active.lesson.id+'/'+b.dataset.index);return;}
 if(action==='new'){newPractice();return;}
 if(action==='fresh'&&!active.practice){const i=nextFresh(active.lesson);if(i>=0)go('#lesson/'+active.lesson.id+'/'+i);return;}
 if(action==='choice'){if(s.correct)return;s.value=active.task.choices[Number(b.dataset.choice)];s.feedback='';}
 if(action==='hint'){s.hint=!s.hint;markAssisted(s,action);}
 if(action==='guided'){s.guided=!s.guided;markAssisted(s,action);}
 if(action==='step-hint'){const i=Number(b.dataset.step);s.stepHints[i]=!s.stepHints[i];markAssisted(s,action);}
 if(action==='reveal'){s.reveals[Number(b.dataset.step)]=true;markAssisted(s,action);}
 save();renderProblem();
});
function route(){if(typeof cleanup==='function')cleanup();cleanup=null;active=null;const parts=location.hash.replace(/^#/,'').split('/');main.className=parts[0]==='lesson'?'lesson-page':'';document.querySelectorAll('nav a').forEach(a=>a.removeAttribute('aria-current'));try{if(parts[0]==='lesson')lessonView(parts[1],parts[2]);else if(parts[0]==='practice')practiceView(parts[1],parts[2]);else if(parts[0]==='skills')skillPage();else if(parts[0]==='progress')progress();else home();const nav=parts[0]==='practice'||parts[0]==='skills'?'skills':parts[0]==='progress'?'progress':'home';document.querySelector('nav a[href="#'+nav+'"]').setAttribute('aria-current','page');}catch(err){main.innerHTML='<div class="error-page"><h1>Не удалось открыть занятие</h1><p>Сохранённые ответы остаются в браузере. Обнови страницу или вернись к курсу.</p><a class="button" href="#home">К началу</a></div>';console.error(err);}window.scrollTo(0,0);if(parts[0]==='chapter'){const target=document.getElementById('chapter-'+parts[1]);if(target)target.scrollIntoView({block:'start'});}}
window.addEventListener('hashchange',route);route();
if(boardMode && window.MakarychevBoard){
 window.MakarychevBoard.connect({
  current:()=>state,
  routeAllowed:hash=>Boolean(validRoute(hash))||['#home','#progress','#skills'].includes(hash)||/^#chapter\/[1-6]$/.test(hash),
  taskAllowed:id=>Boolean(resolveTask(id)),
  receive(incoming,hash){
   state=sanitizeState(incoming);
   window.history.replaceState(null,'',location.pathname+location.search+hash);
   route();
  },
  findNumber,warn
 });
}
window.MakarychevApp={getState:()=>JSON.parse(JSON.stringify(state)),format:fmt,route,validateState:sanitizeState,displayValue,check};
})();

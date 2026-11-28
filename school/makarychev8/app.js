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
  if(op==='abs')return '<mrow><mo>|</mo>'+render(left)+'<mo>|</mo></mrow>';
  let output;
  if(op==='^')output='<msup>'+render(left,rank)+render(rhs)+'</msup>';
  else if(op==='neg')output='<mrow><mo>−</mo>'+render(left,rank)+'</mrow>';
  else output='<mrow>'+render(left,rank)+'<mo>'+({'+':'+','-':'−','*':'·','=':'='}[op])+'</mo>'+render(rhs,rank,op==='-')+'</mrow>';
  return rank<parent||(right&&rank===parent)?wrap(output):output;
 }
 return '<div class="m8-exercise-formula" tabindex="0" aria-label="Формула задания"><math xmlns="http://www.w3.org/1998/Math/MathML" display="block">'+render(expression)+'</math></div>';
}
const byId=Object.fromEntries(D.lessons.map(l=>[l.id,l])), skills=Object.fromEntries(M.skills.map(s=>[s.id,s])), taskById=Object.fromEntries(D.lessons.flatMap(l=>l.tasks.map(t=>[t.id,t])));

function record(v){return !!v&&typeof v==='object'&&!Array.isArray(v);}
function taskSignature(t){return t.prompt+(t.mathExpression?'\u241f'+JSON.stringify(t.mathExpression):'')+'\u241f'+t.answer+'\u241f'+(t.answerFormat||'');}
function resolveTask(id){if(Object.prototype.hasOwnProperty.call(taskById,id))return taskById[id];const m=/^practice:([a-z-]+):([123]):(\d+)$/.exec(id);if(!m||!skills[m[1]])return null;const seed=Number(m[3]);if(!Number.isSafeInteger(seed)||seed<1||seed>=1000000)return null;try{const t=M.generate(m[1],seed,Number(m[2]));t.id=id;return t;}catch(_){return null;}}
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
function sanitizeEvents(raw,t){return Array.isArray(raw)?raw.slice(-40).filter(v=>record(v)&&['answer','step','help','hint','guided','step-hint','reveal','model','detour'].includes(v.type)&&Number.isSafeInteger(v.at)&&v.at>0&&v.at<=Date.now()).map(v=>({type:v.type,at:v.at,value:typeof v.value==='string'?v.value.slice(0,1000):'',correct:v.correct===true&&((v.type==='answer'&&check(v.value,t))||(v.type==='step'&&!!t.steps[v.step]&&check(v.value,t.steps[v.step]))),step:Number.isInteger(v.step)&&v.step>=0&&v.step<100?v.step:null})):[];}
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
 if(q.kind==='set'){
  const empty=/^(нет|неткорней|корнейнет|пусто|∅|\{\})$/;
  const norm=window.MakarychevCheck.normalize(text);
  if(empty.test(norm))return '';
  if(!window.MakarychevCheck.setEntries(text))return 'Уточни запись. Цифры одного числа пишутся подряд. Между целой и дробной частями смешанного числа оставь пробел, между ответами поставь точку с запятой.';
  const expected=String(q.answer).replace(/[{}]/g,'').split(';');
  if(empty.test(window.MakarychevCheck.normalize(q.answer))||expected.every(v=>M.parse(v))){const parts=window.MakarychevCheck.setEntries(text);if(!parts||parts.some(v=>!M.parse(v)))return message;}
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
 if(q.kind==='proof-chain'){
  const attempt=window.MakarychevCheck.proofOrder(value,q.proofClaims.length)||[];
  let matched=-1,next;
  for(const order of q.proofOrders||[q.answer]){
   const candidate=order.split(';').map(Number);
   let common=0;while(common<candidate.length&&candidate[common]===attempt[common])common++;
   if(common>matched){matched=common;next=candidate[common];}
  }
  if(next===undefined)return 'Получилось полное доказательство. Проверь, нужно ли оставшееся утверждение.';
  const explanation=q.proofFeedback[q.answer.split(';').indexOf(String(next))];
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
${D.chapters.map((chapter,i)=>'<section class="section" id="chapter-'+chapter.id+'"><p class="eyebrow">Глава '+(i+1)+'</p><h2>'+e(chapter.title)+'</h2>'+(Number(chapter.id)===1?'<p class="chapter-coverage">Для каждого номера этой главы (№1–267) есть разбор всех подпунктов, включая дополнительные упражнения.</p>':Number(chapter.id)===2?'<p class="chapter-coverage">Вся глава: №268–509 со всеми подпунктами, дополнительными упражнениями и самопроверкой. Выбирай тему или ищи номер выше.</p>':'')+'<div class="grid">'+D.lessons.filter(l=>l.order>=chapter.topics[0]&&l.order<=chapter.topics[1]).map(l=>'<a class="lesson-card" href="'+lessonEntry(l)+'"><span class="lesson-number">'+String(l.order).padStart(2,'0')+'</span><div><h3>'+e(l.title)+'</h3><p class="small">С. '+l.page+' · '+l.tasks.length+' задач · наглядная модель</p><p>'+(l.advanced?'<span class="tag warm">Хочу знать больше</span>':'')+'<span class="tag">'+count(l)+' / '+l.tasks.length+' решено</span>'+(independent(l)?'<span class="tag">'+independent(l)+' самостоятельно</span>':'')+'</p></div></a>').join('')+'</div></section>').join('')}
<details class="panel section"><summary>Как устроен курс</summary><p>Порядок и темы соответствуют учебнику Ю. Н. Макарычева, Н. Г. Миндюк, К. И. Нешкова, С. Б. Суворовой «Алгебра. 8 класс», Просвещение, 2024. Объяснения и дополнительные задачи созданы для этого курса. Оригинальные задания имеют номер, подпункт и страницу.</p><p>Курс охватывает 51 тему. Упражнения ${coverage} разобраны полностью. Для остальных номеров поиск показывает, какие разборы готовы. Всего в карте 1340 номеров.</p><p>Шаги остаются видимыми. Помощь и самостоятельное решение учитываются отдельно. Тренировка вычислений сохраняет исходную задачу и возвращает к тем же записям.</p><p>Ответы и записи сохраняются в этом браузере. В разделе результатов можно скачать копию для переноса на другой компьютер.</p></details>`;document.getElementById('number-form').onsubmit=ev=>{ev.preventDefault();findNumber(Number(document.getElementById('exercise-number').value));};
 if(!sharedMode)window.MathExamCourseExamples?.catalogue(main,'makarychev8');
}
function findNumber(n){const r=document.getElementById('number-result');if(!Number.isInteger(n)||n<1||n>1340){r.textContent='Введи целый номер от 1 до 1340.';return;}const ref=D.sourceMap.sections.find(s=>s.exerciseRange&&n>=s.exerciseRange[0]&&n<=s.exerciseRange[1]);if(!ref){r.textContent='Номер не найден.';return;}const matches=D.lessons.flatMap(l=>l.tasks.map((t,i)=>({t,l,i}))).filter(x=>x.t.source?.type==='textbook'&&new RegExp('№\\s*'+n+'(?!\\d)').test(x.t.source.reference)).sort((a,b)=>a.l.order-b.l.order+(a.l.id===b.l.id?((a.l.studyOrder?.indexOf(a.i)??a.i)-(b.l.studyOrder?.indexOf(b.i)??b.i)):0));let related=ref.kind==='topic'?D.lessons.filter(l=>l.order===ref.id):D.lessons.filter(l=>(()=>{const c=D.chapters.find(c=>c.id===ref.chapter);return c&&l.order>=c.topics[0]&&l.order<=c.topics[1];})());if(ref.kind==='difficult')related=[];r.innerHTML='<h3>№ '+n+'</h3><p>'+e(ref.title)+' · с. '+ref.printedPage+'–'+ref.printedEndPage+'</p><div class="row">'+matches.map(x=>'<a class="button" href="#lesson/'+x.l.id+'/'+x.i+'">'+e(x.t.source.reference)+'</a>').join('')+related.map(l=>'<a class="button quiet" href="'+lessonEntry(l)+'">'+e(l.title)+'</a>').join('')+'</div>'+(matches.length?'':'<p class="small">Индивидуального разбора этого номера в курсе пока нет. Для повторения воспользуйся темами курса ниже или картой глав.</p>');}
function skillPage(){main.innerHTML=returnBanner()+'<p class="eyebrow">Вычислительная мастерская</p><h1>Потренируй один навык</h1><p class="lead">Выбери действие. Начни с простых чисел, затем переходи к более сложным. Кнопка «Новый пример» даёт другое задание.</p><div class="skill-grid">'+M.skills.map(s=>'<article class="skill-card"><span class="eyebrow">Практика</span><h2>'+e(s.title)+'</h2><p>'+e(s.description)+'</p><a class="button quiet" href="#practice/'+s.id+'/1">Начать →</a></article>').join('')+'</div>';}
function lessonView(id,index){const l=byId[id];if(!l)return home();index=Math.max(0,Math.min(l.tasks.length-1,Math.trunc(Number(index))||0));const t=l.tasks[index],order=l.studyOrder||l.tasks.map((_,i)=>i),position=order.indexOf(index);active={lesson:l,task:t,index,practice:false};state.last={hash:'#lesson/'+id+'/'+index};save();main.innerHTML='<div class="breadcrumb"><a href="#home">← Все темы</a>'+boardEntry()+'<span>/ '+l.chapter+'</span></div><p class="eyebrow">'+(t.source?.section==='additional-1'?'Дополнительно к §'+(t.source.paragraph||1)+' · с. '+t.source.page:'Тема '+l.order+' · с. '+l.page+' · № '+e(l.sourceRange))+'</p><h1 class="lesson-title">'+e(l.title)+'</h1><div class="lesson-layout"><aside class="side"><details class="task-menu"'+(window.matchMedia&&window.matchMedia('(min-width: 901px)').matches?' open':'')+'><summary>Задачи этой темы ('+l.tasks.length+')</summary><div class="side-list">'+order.map((i,pos)=>{const q=l.tasks[i];return '<button type="button" data-action="task" data-index="'+i+'" class="'+(i===index?'current':'')+'" '+(i===index?'aria-current="step"':'')+'><span class="status">'+(ts(q.id).correct?'✓':'')+'</span>'+(pos+1)+'. '+e(q.title)+'</button>';}).join('')+'</div></details></aside><div class="content-column"><div id="problem"></div><details class="panel"><summary>Коротко о главном</summary>'+l.theory.map(p=>'<div class="theory-block"><h3>'+e(p.title)+'</h3><p>'+fmt(p.text)+'</p>'+(p.example?'<div class="theory-example">'+fmt(p.example)+'</div>':'')+'</div>').join('')+'</details><details class="panel model-panel"><summary>Исследовать на модели</summary><div id="model" class="model"></div></details><div class="navigation">'+(position>0?button('← Предыдущая','task','data-index="'+order[position-1]+'"',true):'<span></span>')+(position<order.length-1?button('Следующая задача →','task','data-index="'+order[position+1]+'"',true):l.order<51?'<a class="button quiet" href="'+lessonEntry(byId['p'+String(l.order+1).padStart(2,'0')])+'">Следующая тема →</a>':'<a class="button" href="#progress">Мои результаты →</a>')+'</div></div></div>';cleanup=window.MakarychevModels?.mount(document.getElementById('model'),l,{state:ts(t.id).investigation,onChange:value=>{const saved=ts(t.id);saved.investigation=sanitizeInvestigation(value);markAssisted(saved,'model');save();}});renderProblem();if(!sharedMode)window.MathExamCourseExamples?.mount(document.getElementById('problem'),'makarychev8',l.id,()=>{markAssisted(ts(t.id),'animation');save();});document.querySelectorAll('main details.panel').forEach(el=>{el.addEventListener('toggle',()=>{if(el.open){markAssisted(ts(t.id));save();}});});}
function practiceView(id,level){if(!skills[id])return skillPage();level=[1,2,3].includes(Number(level))?Number(level):1;const key=id+':'+level;let p=state.practice[key];if(!p||!Number.isSafeInteger(p.seed))p=state.practice[key]={seed:1};const t=M.generate(id,p.seed,level);t.id='practice:'+id+':'+level+':'+p.seed;t.signature=taskSignature(t);const saved=ts(t.id);if(!saved.signature){saved.signature=t.signature;saved.repeated=Object.entries(state.tasks).some(([other,r])=>other!==t.id&&r.signature===t.signature);}active={task:t,practice:true,skill:id,level,key};if(!state.origin)state.last={hash:'#practice/'+id+'/'+level};save();main.innerHTML=returnBanner()+'<div class="breadcrumb"><a href="#skills">← Выбрать другой навык</a></div><p class="eyebrow">Отдельная тренировка · пример '+p.seed+'</p><h1 class="lesson-title">'+e(skills[id].title)+'</h1><div class="row"><label for="level">Сложность</label><select id="level" class="level-select"><option value="1">1 · Начинаем с простого</option><option value="2">2 · Закрепляем</option><option value="3">3 · Проверяем себя</option></select><span class="small">Без ограничения времени</span></div><div id="problem" class="section"></div><div class="navigation">'+button('Новый пример →','new')+(state.origin?button('Вернуться к исходной задаче','return','',true):'<a class="button quiet" href="#skills">Другой навык</a>')+'</div><p class="small">Для самостоятельного результата реши новый пример без подсказок и с первой попытки. Разобранный пример остаётся в результатах как решение с помощью.</p>';document.getElementById('level').value=level;document.getElementById('level').onchange=ev=>go('#practice/'+id+'/'+ev.target.value);renderProblem();}
function inRoots(){return active&&!active.practice&&active.lesson.order>=10&&active.lesson.order<=19;}
function mathKeys(targetId){return inRoots()?'<div class="math-keys" role="group" aria-label="Математические знаки">'+['√','²','|','≥','≤',';'].map(v=>'<button type="button" class="quiet" data-action="math-key" data-target="'+targetId+'" data-symbol="'+e(v)+'" aria-label="Вставить '+e(v)+'">'+e(v)+'</button>').join('')+'</div>':'';}
function inputNote(target){if(target.inputNote)return e(target.inputNote);if(target.kind==='rational-example'||target.kind==='square-equation-example')return 'Введи своё число: целое, десятичную дробь или обыкновенную дробь через /.';if(target.kind==='irrational-example')return 'Введи свой пример в форме √n или sqrt(n), где n — натуральное число, либо π.';if(target.kind==='interval-examples')return 'Введи разные подходящие числа через точку с запятой. Можно использовать точные дроби и десятичные дроби.';if(target.kind==='root-line-count')return 'Введи коэффициенты своей прямой y=kx+b в порядке k; b. Можно использовать целые числа, дроби и десятичные дроби.';if(['root-points','graph-values'].includes(target.kind))return 'Введи значения в указанном порядке через точку с запятой.';if(target.kind==='text')return 'Следуй формату в вопросе. Дробь вводи через /, квадрат — как ^2 или ².'+(inRoots()?' Корень можно записать как √3 или sqrt(3); скобки сохраняют выражение под корнем.':'');if(target.kind==='set')return 'Раздели значения точкой с запятой. Два противоположных числа можно записать как ±3 или +/-3. Порядок не важен. Если значений нет, введи «нет».';const f=target.answerFormat;return {'decimal':'Введи десятичную дробь с запятой или точкой.','reduced-fraction':'Введи несократимую дробь, например 3/4, или целое число.','improper-fraction':'Введи неправильную дробь, например 7/3.','mixed-number':'Введи смешанное число с пробелом: 2 1/3.','integer':'Введи целое число.'}[f]||'Можно ввести 3/4, 0,75 или 2 1/3. Единицы измерения не вводи.';}
function proofControls(task,record,host){
 const field=document.createElement('fieldset'),legend=document.createElement('legend');
 field.className='reasoning-choices';legend.textContent='Утверждения для доказательства';field.append(legend);
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
 const provenance=t.source?'<p class="source-note">'+e(t.source.type==='textbook'?'Из учебника: '+t.source.reference+', с. '+t.source.page:t.source.adaptation?'Самопроверка по учебнику: '+t.source.reference+', с. '+t.source.page:'Авторская задача по теме учебника')+'</p>':'';
 const condition='<div class="prompt">'+fmt(t.prompt)+(t.mathExpression?textbookFormula(t.mathExpression):'')+'</div>';
 const statement=t.graph?condition+'<div id="task-graph"></div>'+provenance:provenance+condition;
 host.innerHTML='<article class="problem"><div class="task-heading"><h2>'+e(t.title)+'</h2><span class="tag">'+(s.correct?learningLabel(s):'Твоя задача')+'</span></div>'+statement+'<div class="row">'+button(s.hint?'Закрыть подсказку':'Хочешь подсказку?','hint','',true)+(t.steps?.length?button(s.guided?'Скрыть разбор':'Разобрать по шагам','guided','',true):'')+'</div>'+(s.hint?'<div class="help"><strong>Подсказка</strong><p>'+fmt(t.hint||'Выдели, что известно и что требуется найти. Вспомни правило из раздела «Коротко о главном».')+'</p></div>':'')+(s.guided?renderSteps(t,s):'')+'<form class="answer-form" id="answer-form"><label for="final-answer">'+fmt(t.finalLabel||(t.kind==='choice'?'Выбери верный ответ на вопрос задачи.':'Чему равен результат? Введи число.'))+'</label>'+(t.kind==='choice'?'<div class="choices" role="group" aria-label="Варианты ответа">'+t.choices.map((v,i)=>'<button type="button" data-action="choice" data-choice="'+i+'" class="'+(s.value===v?'selected':'')+'" aria-pressed="'+(s.value===v)+'">'+fmt(v)+'</button>').join('')+'</div><button type="submit" '+(s.correct?'disabled':'')+'>Проверить ответ</button>':'<p class="small">'+inputNote(t)+'</p><div class="answer-controls"><input id="final-answer" name="final-answer" type="text" inputmode="text" autocomplete="off" spellcheck="false" value="'+e(s.value)+'" '+(s.correct?'readonly':'')+'><button type="submit" '+(s.correct?'disabled':'')+'>Проверить ответ</button></div>'+(!s.correct&&t.kind!=='proof-chain'?mathKeys('final-answer'):'')+'<div id="answer-preview" class="answer-preview small" aria-live="polite"></div>')+'<div class="feedback '+(s.feedback&&!s.correct?'error':'')+'" role="status">'+e(s.feedback)+'</div></form>'+(s.correct?'<div class="feedback"><strong>'+(s.independent?'Верно, самостоятельно.':'Верно. Теперь закрепи навык на новом примере.')+'</strong><p>'+fmt(t.explanation)+'</p>'+freshAction()+'</div>':'')+((t.skills?.length)?'<section class="detour"><h3>С вычислением нужна помощь?</h3><p class="small">Потренируй отдельное действие. Затем вернись к этому же условию и записям.</p><div class="row">'+skillLinks(t.skills)+'</div></section>':'')+'<details '+(s.note?'open':'')+'><summary>Мои записи к задаче</summary><label class="small" for="notebook">Сохраняются вместе с этой задачей</label><textarea id="notebook" placeholder="Запиши свою мысль или промежуточные вычисления">'+e(s.note)+'</textarea></details>'+historyView(s)+'</article>';
const formula=host.querySelector('.m8-exercise-formula');
if(formula){
 if(formula.scrollWidth>formula.clientWidth+1){
  const note=document.createElement('p');note.className='small';note.textContent='Формулу можно прокрутить вправо.';formula.after(note);
 }else formula.removeAttribute('tabindex');
}
if(t.kind==='proof-chain')proofControls(t,s,host);
stepChoiceControls(host,t);
if(t.graph){
 const modelInput=['domain-fraction','integer-pairs','train-meeting','natural-values','work-hours','equal-distances','shared-hyperbola-line'].includes(t.graph.type)&&!s.attempts&&!s.hint&&!s.guided?'':s.value;
 let graph=t.graph.revealAfterSubmit?{...t.graph,showSolution:s.correct}:t.graph;
 if(graph.type==='intersection-example')graph={...graph,reveal:Boolean(s.attempts||s.hint||s.guided)};
 if(modelInput&&graph.type==='domain-fraction')graph={...graph,analysis:window.MakarychevCheck.inspectDomainFraction(modelInput,t.exclusions)};
 if(modelInput&&graph.type==='natural-values')graph={...graph,rows:(window.MakarychevCheck.setEntries(modelInput)||[]).map(term=>({term,pair:naturalCase(term,t.naturalRule)}))};
 window.MakarychevTaskGraphs?.render(document.getElementById('task-graph'),graph,modelInput);
}
document.getElementById('answer-form').onsubmit=ev=>{ev.preventDefault();checkFinal();};const inp=document.getElementById('final-answer');if(inp){inp.oninput=()=>{s.value=inp.value.slice(0,1000);inp.value=s.value;save();preview(inp.value);};preview(inp.value);}document.getElementById('notebook').oninput=ev=>{s.note=ev.target.value.slice(0,15000);ev.target.value=s.note;save();};host.querySelectorAll('[data-step-input]').forEach(el=>{el.oninput=()=>{s.values[Number(el.dataset.stepInput)]=el.value.slice(0,1000);el.value=s.values[Number(el.dataset.stepInput)];save();};});host.querySelectorAll('[data-step-form]').forEach(el=>{el.onsubmit=ev=>{ev.preventDefault();checkStep(Number(el.dataset.stepForm));};});}
function preview(value){if(['build','pair','root-build','curve-build','root-line','line-example'].includes(active?.task.graph?.type)){
 const graph=active.task.graph;
 window.MakarychevTaskGraphs?.render(document.getElementById('task-graph'),graph.revealAfterSubmit?{...graph,showSolution:ts(active.task.id).correct}:graph,value);
}const p=document.getElementById('answer-preview');if(!p)return;if(active?.task.kind==='text'||active?.task.kind==='set'||active?.task.kind==='graph'||active?.task.kind==='graph-pair'||['proof-chain','separated-rational','domain-fraction','common-factor','integer-pairs','root-points','graph-values','root-line-count','irrational-example','interval-examples'].includes(active?.task.kind)){p.textContent=value.trim()?'Твоя запись: '+value:'';return;}const r=M.parse(value);p.innerHTML=value.trim()?(r?'Ты ввёл: '+fmt(displayValue(value)):'Формат пока не распознан. Примеры: 0,5 · 1/2 · 2 1/3') : '';}
function renderSteps(t,s){let html='<section class="steps"><p class="small">Каждый завершённый шаг остаётся видимым. Разбор считается помощью.</p>';for(let i=0;i<Math.min(t.steps.length,s.step+1);i++){const q=t.steps[i],done=i<s.step;html+='<div class="step '+(done?'completed':'')+'"><span class="step-label">Шаг '+(i+1)+(done?' · готово':'')+'</span><h3>'+fmt(q.prompt)+'</h3>'+(done?'<div class="recorded">Твоя запись: '+fmt(displayValue(s.values[i]))+' ✓</div><p>'+fmt(q.explanation||'')+'</p>':'<form data-step-form="'+i+'"><p class="small">'+inputNote(q)+'</p><div class="answer-controls"><input id="step-answer-'+i+'" aria-label="Ответ к шагу '+(i+1)+'" data-step-input="'+i+'" type="text" autocomplete="off" value="'+e(s.values[i]||'')+'"><button>Проверить шаг</button></div>'+(q.kind==='choice'?'':mathKeys('step-answer-'+i))+'</form><div class="row">'+button(s.stepHints[i]?'Скрыть подсказку':'Подсказка к этому шагу','step-hint','data-step="'+i+'"',true)+(s.stepHints[i]?button('Показать этот шаг','reveal','data-step="'+i+'"',true):'')+'</div>'+(s.stepHints[i]?'<div class="help">'+fmt(q.hint||q.explanation)+'</div>':'')+(s.reveals[i]?'<div class="help">'+fmt(q.explanation||'Выполни указанное действие.')+'<p>Результат шага: '+fmt(displayValue(q.answer,q.answerFormat))+'. Введи его и проверь.</p></div>':'')+'<div id="step-feedback-'+i+'" class="feedback error" role="status"></div>')+'</div>';}if(s.step>=t.steps.length)html+='<p class="feedback">Все шаги готовы. Теперь ответь на вопрос исходной задачи ниже.</p>';return html+'</section>';}
function check(user,q){return window.MakarychevCheck.check(user,q);}
function checkFinal(){const t=active.task,s=ts(t.id);if(s.correct)return;if(!s.value.trim()){s.feedback=t.kind==='choice'?'Сначала выбери ответ.':'Сначала введи результат.';renderProblem();return;}const issue=formatProblem(s.value,t);if(issue){s.feedback=issue;save();renderProblem();return;}s.attempts++;const isCorrect=check(s.value,t);if(!s.firstAttempt)s.firstAttempt={value:s.value.slice(0,1000),correct:isCorrect,at:Date.now()};recordEvent(s,'answer',s.value,isCorrect);if(isCorrect){s.correct=true;if(boardMode)s.assisted=true;s.independent=!boardMode&&!s.assisted&&!s.repeated&&s.attempts===1;s.completion={attempts:s.attempts,assisted:s.assisted,independent:s.independent,at:Date.now()};s.feedback='';}else{s.feedback='Пока не совпало. '+feedbackFor(s.value,t)+(s.attempts>=2?' После двух попыток можно открыть подсказку или разобрать трудный шаг.':'');}save();renderProblem();}
function checkStep(i){const t=active.task,s=ts(t.id),q=t.steps[i];if(i!==s.step)return;const v=s.values[i]||'';if(!v.trim()){document.getElementById('step-feedback-'+i).textContent='Сначала введи результат этого шага.';return;}const issue=formatProblem(v,q);if(issue){document.getElementById('step-feedback-'+i).textContent=issue;return;}s.stepAttempts[i]=(s.stepAttempts[i]||0)+1;const good=check(v,q);recordEvent(s,'step',v,good,i);if(good){s.step++;save();renderProblem();}else{save();document.getElementById('step-feedback-'+i).textContent='Шаг '+(i+1)+': '+feedbackFor(v,q)+(s.stepAttempts[i]>=2?' Можно открыть подсказку именно к этому шагу.':'');}}
const reviewWait=5*24*60*60*1000;
function reviewPanel(){const now=Date.now(),due=D.lessons.filter(l=>{const latest=Math.max(0,...l.tasks.map(t=>{const s=state.tasks[t.id];return s?.independent?s.completion?.at||0:0;}));return latest&&now-latest>=reviewWait;});return '<details class="panel"><summary>Короткий цикл и повторение после паузы</summary><p>На 10–15 минут: личный прогноз → один опыт → объяснение → новое условие без помощи. В группе каждый сначала отвечает сам, затем обсуждает способ.</p><p class="small">Повтор предлагаем через 5 дней. Старые результаты без даты не считаем повторёнными автоматически.</p>'+ (due.length?due.map(l=>{const index=nextFresh(l);const skill=l.tasks.flatMap(t=>t.skills||[]).find(id=>skills[id]);return index>=0?'<p><a href="#lesson/'+l.id+'/'+index+'">'+e(l.title)+'</a> — новое условие для проверки.</p>':'<p>'+e(l.title)+': новые условия темы закончились.</p>'+(skill?button('Новый пример: '+e(skills[skill].title),'review-skill','data-skill="'+skill+'"',true)+'<p class="small">Проверяем только этот вычислительный навык, не всю тему.</p>':'<p class="small">Для новой проверки потребуется другое условие преподавателя.</p>');}).join(''):'<p>Пока нет результатов с известной датой для отсроченной проверки.</p>')+'</details>';}
function progress(){const lessonRows=D.lessons.map(l=>'<tr><td><a href="'+lessonEntry(l)+'">'+e(l.title)+'</a></td><td>'+independent(l)+'</td><td>'+(count(l)-independent(l))+'</td><td>'+l.tasks.length+'</td></tr>').join(''),pr=Object.entries(state.tasks).filter(([id,s])=>id.startsWith('practice:')&&s.correct);main.innerHTML='<p class="eyebrow">Мои результаты</p><h1>Виден каждый шаг</h1><p class="lead">Самостоятельно — с первой попытки, без открытого разбора и подсказок. Решение с помощью тоже полезно: оно учитывается отдельно. Исправленные ответы, помощь и знакомые условия различаются в истории каждой задачи.</p>'+reviewPanel()+'<div class="panel table-scroll" role="region" aria-label="Результаты по темам" tabindex="0"><table class="progress-table"><thead><tr><th>Тема</th><th>Сам</th><th>С помощью / после попыток</th><th>Всего задач</th></tr></thead><tbody>'+lessonRows+'</tbody></table></div><h2>Отдельные тренировки</h2><p>Решено '+pr.length+' примеров, из них '+pr.filter(([,s])=>s.independent).length+' самостоятельно.</p><div class="grid">'+M.skills.map(sk=>{const list=pr.filter(([id])=>id.split(':')[1]===sk.id);return list.length?'<div class="panel"><h3>'+e(sk.title)+'</h3><p>'+list.filter(([,s])=>s.independent).length+' самостоятельно · '+list.filter(([,s])=>!s.independent).length+' с помощью / после попыток</p><a href="#practice/'+sk.id+'/1">Продолжить</a></div>':'';}).join('')+'</div><div class="panel"><h2>Сохранить свою работу</h2><p>Результаты и черновики находятся в этом браузере. Скачай резервную копию, чтобы перенести их на другое устройство.</p><div class="row">'+button('Скачать сохранение','export')+'<label class="button quiet" for="import-file">Открыть сохранение<input class="sr-only" id="import-file" type="file" accept="application/json,.json"></label></div><p id="import-status" role="status" class="small"></p></div>';document.getElementById('import-file').onchange=importState;}
function download(){const blob=new Blob([JSON.stringify({course:'makarychev8-2024',exportedAt:new Date().toISOString(),state},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Makarychev8-progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function importState(ev){const file=ev.target.files[0],status=document.getElementById('import-status');if(!file)return;if(sharedMode){status.textContent='Личные сохранения открываются в самостоятельной работе, вне совместного разбора.';return;}try{if(file.size>5000000)throw Error('Файл слишком большой.');const data=JSON.parse(await file.text());if(data.course!=='makarychev8-2024')throw Error('Это не сохранение данного курса.');const incoming=sanitizeState(data.state);for(const [id,s]of Object.entries(incoming.tasks)){const current=state.tasks[id];const hasWork=current&&(current.correct||current.value||current.note||current.step>0||current.attempts>0||current.assisted||current.events?.length||current.investigation?.started||current.guided||current.hint||(current.values||[]).some(Boolean)||Object.keys(current.stepHints||{}).length||Object.keys(current.reveals||{}).length);if(!hasWork)state.tasks[id]=s;}for(const [key,p]of Object.entries(incoming.practice))state.practice[key]={seed:Math.max(p.seed,state.practice[key]?.seed||1)};state=sanitizeState(state);save();progress();document.getElementById('import-status').textContent='Сохранения объединены. Для задач, над которыми уже работали здесь, сохранены текущие ответы, шаги и записи.';}catch(err){status.textContent='Не удалось открыть: '+err.message;}}
function newPractice(){const used=new Set(Object.values(state.tasks).map(s=>s.signature).filter(Boolean));let seed=state.practice[active.key].seed;for(let i=0;i<1000&&seed<999999;i++){seed++;const task=M.generate(active.skill,seed,active.level);if(!used.has(taskSignature(task))){state.practice[active.key].seed=seed;save();practiceView(active.skill,active.level);return;}}ts(active.task.id).feedback='В этой подборке пока не нашёлся новый пример. Выбери другую сложность или другой навык.';renderProblem();}

function reviewSkill(id){if(!skills[id])return;const key=id+':1',used=new Set(Object.values(state.tasks).map(s=>s.signature).filter(Boolean));let seed=state.practice[key]?.seed||1;for(let i=0;i<1000&&seed<1000000;i++,seed++){if(!used.has(taskSignature(M.generate(id,seed,1)))){state.practice[key]={seed};save();go('#practice/'+id+'/1');return;}}warn('Новые условия этого навыка закончились. Выбери другую сложность.');}
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

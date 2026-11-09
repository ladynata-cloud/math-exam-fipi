(function(root){'use strict';
const stages=[
 {title:'Один шаг — умножить на 2',lead:'Начни с 1. После каждого шага число удваивается. Подвигай ползунок и найди закономерность.',model:'powers',questions:['double']},
 {title:'А если неизвестен показатель?',lead:'Теперь известен результат — 32. Вопрос меняется: сколько шагов удвоения нужно сделать от 1?',model:'reverse',questions:['exponent']},
 {title:'У этого вопроса есть имя',lead:'«В какую степень возвести основание?» — именно об этом спрашивает логарифм.',model:'notation',questions:['meaning','triple']},
 {title:'Вернёмся к единице — и дальше',lead:'Шаг вправо умножает на 2. Шаг влево делит на 2. Поэтому показатели могут быть нулевыми и отрицательными.',model:'negative',questions:['zero','negative']},
 {title:'Между целыми показателями',lead:'От 1 до 4 — один шаг умножения на 4. Половина такого шага даёт √4 = 2: два умножения на 2 дают умножение на 4.',model:'fraction',questions:['half']},
 {title:'Когда вопрос имеет ответ?',lead:'Для обычного действительного логарифма нужны три условия: a > 0, a ≠ 1, b > 0. Разберём, зачем они нужны.',model:'domain',questions:['base','argument','onebase']},
 {title:'Из ответа получается график',lead:'Пусть число x меняется. Для каждого x > 0 ищем показатель y: aʸ = x. Пара (x; y) — точка графика y = logₐx.',model:'graph',questions:['rising','falling','point']},
 {title:'Ты открыл смысл логарифма',lead:'От вычислений — к самостоятельной практике. Твои ответы и этап урока сохраняются в этом браузере.',model:null,questions:[]}
];
const questions={
 double:{prompt:'После 1 → 2 → 4 → 8 какое число будет следующим?',answer:16,explain:'Каждый шаг удваивает число: 8 · 2 = 16 = 2⁴.',error:'Здесь прибавляем не 2: каждый раз умножаем предыдущее число на 2.',hint:'Возьми последнее число 8 и удвой его.'},
 exponent:{prompt:'2ᶜ = 32. Чему равен c?',answer:5,explain:'2⁵ = 32. Пять шагов от 1; показатель — 5, результат — 32.',error:'Мы ищем число умножений, а не результат и не 32 : 2. Проверь свою степень двойки.',hint:'Считай переходы: 1 → 2 → 4 → 8 → 16 → 32.'},
 meaning:{prompt:'Что означает log₂32?',answer:'Показатель степени',choices:['Показатель степени','32 разделить на 2','Результат 2³²'],explain:'log₂32 — показатель, в который нужно возвести 2, чтобы получить 32.',error:'Основание 2 и результат 32 уже известны. Неизвестен показатель степени.',hint:'Сравни два вопроса в модели слева или выше.'},
 triple:{prompt:'log₃27 = ? Сначала подумай: 3 в какой степени даёт 27?',answer:3,explain:'3 · 3 · 3 = 27, значит 3³ = 27 и log₃27 = 3.',error:'Логарифм не делит 27 на 3. Найди показатель: 3¹ = 3, 3² = 9, …',hint:'Сколько троек в произведении 3 · 3 · 3?'},
 zero:{prompt:'log₂1 = ?',answer:0,explain:'2⁰ = 1, поэтому log₂1 = 0. Логарифм единицы равен нулю при любом допустимом основании.',error:'2¹ = 2. Чтобы получить 1, вернись на нулевой шаг.',hint:'Ноль шагов от 1 оставляет число 1.'},
 negative:{prompt:'log₂(1/4) = ?',answer:-2,explain:'2⁻² = 1/2² = 1/4, поэтому log₂(1/4) = −2.',error:'Положительный показатель 2 даёт 4. Для 1/4 нужны два шага деления от 1.',hint:'Двигайся от 1 влево: 1 → 1/2 → 1/4. Показатели 0 → −1 → −2.'},
 half:{prompt:'log₄2 = ? Можно ввести дробь, например 1/2.',answer:0.5,explain:'4¹ᐟ² = √4 = 2. Поэтому log₄2 = 1/2 = 0,5. Логарифм не обязан быть целым.',error:'Не дели 2 на 4. Нужен показатель степени: 4⁰ = 1, 4¹ = 4, а 2 находится между ними.',hint:'Сдвинь ползунок к c = 0,5 и посмотри на равенство.'},
 base:{prompt:'Какое из этих оснований допустимо?',answer:'1/2',choices:['1','−2','1/2'],explain:'1/2 положительно и не равно 1. Основание между 0 и 1 разрешено.',error:'Основание должно быть положительным и не равным 1. Оно не обязано быть больше 1.',hint:'Проверь a > 0 и a ≠ 1 для каждого варианта.'},
 argument:{prompt:'У log₂0 есть действительное значение?',answer:'Нет',choices:['Да, это 0','Нет'],explain:'Нет: 2ᶜ > 0 при любом действительном c. Нулевая степень даёт 1, а не 0.',error:'2⁰ = 1, а не 0. Ни одна действительная степень двойки не даёт ноль.',hint:'Может ли повторное деление положительного числа на 2 дать ровно 0?'},
 onebase:{prompt:'Почему основание 1 не подходит?',answer:'Показатель нельзя определить однозначно',choices:['Показатель нельзя определить однозначно','Любая степень 1 равна 0'],explain:'1ᶜ = 1 для любого c. Для b = 1 ответов много, для b ≠ 1 нет ни одного. Единственного показателя не получается.',error:'Любая действительная степень 1 равна 1. Например, 1² = 1 и 1⁷ = 1.',hint:'Сравни 1² и 1⁷: разные показатели дают один результат.'},
 rising:{prompt:'При a = 2 с ростом x значение log₂x…',answer:'Увеличивается',choices:['Увеличивается','Уменьшается'],explain:'Например: x = 1, 2, 4 → y = 0, 1, 2. При a > 1 логарифмическая функция возрастает.',error:'Выбери a = 2 и увеличивай x ползунком. Смотри на высоту точки, а не на изгиб линии.',hint:'Сравни log₂1 = 0 и log₂4 = 2.'},
 falling:{prompt:'При a = 1/2 с ростом x значение log₁⁄₂x…',answer:'Уменьшается',choices:['Увеличивается','Уменьшается'],explain:'(1/2)⁰ = 1, (1/2)⁻¹ = 2, (1/2)⁻² = 4. При 0 < a < 1 логарифмическая функция убывает.',error:'Выбери a = 1/2. Чтобы получить всё большее x, показатель должен уменьшаться.',hint:'Сравни точки (1; 0), (2; −1), (4; −2).'},
 point:{prompt:'Какая точка есть на обоих графиках?',answer:'(1; 0)',choices:['(0; 1)','(1; 0)','(0; 0)'],explain:'a⁰ = 1 для любого допустимого a. Поэтому logₐ1 = 0 и точка (1; 0) общая. При x ≤ 0 графика нет.',error:'В паре сначала x, затем y. При x = 1 показатель y = 0. Число x = 0 недопустимо.',hint:'Установи x = 1 и переключи основание.'}
};
function number(v){const s=String(v).trim().replace(/−/g,'-').replace(/,/g,'.');if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:\s*\/\s*[+-]?(?:\d+(?:\.\d*)?|\.\d+))?$/.test(s))return null;const p=s.split('/').map(Number);if(p.length===2&&p[1]===0)return null;const n=p.length===2?p[0]/p[1]:p[0];return Number.isFinite(n)?n:null;}
function correct(id,value){const q=questions[id]||transferQuestions[id];if(!q)return false;return q.choices?q.answer===value:number(value)!==null&&Math.abs(number(value)-q.answer)<1e-9;}
function log(a,x){return a>0&&a!==1&&x>0?(x===1?0:Math.log(x)/Math.log(a)):null;}
// The introduction is supported exploration. Only these new items measure transfer.
const transferPacks=[
 [{prompt:'log₅(1/125) = ?',answer:-3,explain:'5⁻³ = 1/125: нужен отрицательный показатель.',hint:'Запиши 125 как степень 5, затем возьми обратное число.'},
  {prompt:'log₉3 = ? Запиши число или дробь.',answer:.5,explain:'9¹ᐟ² = 3, значит ответ 1/2.',hint:'Какой корень из 9 равен 3?'},
  {prompt:'log₁⁄₃9 = ?',answer:-2,explain:'(1/3)⁻² = 9: у основания меньше 1 рост результата требует отрицательного показателя.',hint:'Возведение 1/3 в степень −1 даёт 3.'},
  {prompt:'При каких x определён log₂(x − 4)?',answer:'x > 4',choices:['x > 4','x ≥ 4','x > 0'],explain:'Аргумент x − 4 должен быть строго положительным: x > 4.',hint:'Условие относится ко всему аргументу: x − 4 > 0.'}],
 [{prompt:'log₃(1/81) = ?',answer:-4,explain:'3⁻⁴ = 1/81.',hint:'81 = 3⁴. Как получить обратное число?'},
  {prompt:'log₁₆4 = ? Запиши число или дробь.',answer:.5,explain:'16¹ᐟ² = 4, поэтому ответ 1/2.',hint:'Какой корень из 16 равен 4?'},
  {prompt:'log₁⁄₄64 = ?',answer:-3,explain:'(1/4)⁻³ = 64.',hint:'При отрицательном показателе можно перейти к обратному основанию 4.'},
  {prompt:'При каких x определён log₃(7 − x)?',answer:'x < 7',choices:['x > 7','x ≤ 7','x < 7'],explain:'7 − x > 0 даёт x < 7; граница 7 исключена.',hint:'Реши условие 7 − x > 0.'}],
 [{prompt:'log₁₀(1/100) = ?',answer:-2,explain:'10⁻² = 1/100.',hint:'100 = 10². Вспомни отрицательную степень.'},
  {prompt:'log₈4 = ? Запиши число или дробь.',answer:2/3,explain:'8²ᐟ³ = (∛8)² = 4.',hint:'Сначала возьми кубический корень из 8, затем возведи результат в квадрат.'},
  {prompt:'log₁⁄₂(1/8) = ?',answer:3,explain:'(1/2)³ = 1/8: здесь и основание, и аргумент меньше 1.',hint:'Сколько множителей 1/2 дают 1/8?'},
  {prompt:'При каких x определён logₓ5?',answer:'x > 0 и x ≠ 1',choices:['x > 0','x > 0 и x ≠ 1','x > 1'],explain:'Здесь x — основание: оно положительно и не равно 1. Аргумент 5 уже допустим.',hint:'Проверь именно условия на основание, а не на аргумент.'}]
].map((pack,n)=>pack.map((q,i)=>({id:'transfer-'+n+'-'+i,...q,error:['Логарифм ищет показатель степени. Аргумент меньше 1, а основание больше 1: подумай о знаке показателя.','Не дели аргумент на основание. Запиши оба числа как степени одного числа; показатель может быть дробным.','У основания между 0 и 1 положительная степень даёт число меньше 1, отрицательная — больше 1. Сравни аргумент с единицей.','Сначала определи роль переменной. Аргумент должен быть строго положительным, основание — положительным и не равным 1.'][i]})));
const transferQuestions=Object.fromEntries(transferPacks.flat().map(q=>[q.id,q]));
const allQuestions=()=>({...questions,...transferQuestions});
function blank(){return {version:1,stage:0,answers:{},drafts:{},tries:{},model:{powers:3,negative:0,fraction:0,base:2,xIndex:2},evidence:{},transferPack:0,draftTimes:{},savedAt:0};}
function unlocked(s){for(let i=0;i<stages.length-1;i++)if(!stages[i].questions.every(id=>correct(id,s.answers[id])))return i;return stages.length-1;}
function record(s,id){if(!allQuestions()[id])return null;if(!s.evidence)s.evidence={};return s.evidence[id]||(s.evidence[id]={first:null,attempts:[],help:[],legacyUnknown:false});}
function eventID(){return typeof crypto==='object'&&crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);}
function setDraft(s,id,value,now=Date.now()){if(!allQuestions()[id])return;if(String(value).trim())record(s,id);s.drafts[id]=String(value).slice(0,40);if(!s.draftTimes)s.draftTimes={};s.draftTimes[id]=now;}
function useHelp(s,id,kind='hint',now=Date.now()){const r=record(s,id);if(!r)return;r.help.push({id:eventID(),kind:kind==='model'?'model':'hint',at:now});r.help=r.help.slice(-32);}
function submit(s,id,value,now=Date.now()){
 if(!allQuestions()[id]||s.answers[id]!==undefined)return {status:'done'};
 const answer=String(value).trim().slice(0,40);setDraft(s,id,value,now);
 if(!answer)return {status:'empty'};
 const r=record(s,id),attempt={id:eventID(),answer,correct:correct(id,answer),at:now,helpBefore:r.help.length>0,prompt:allQuestions()[id].prompt};
 if(!r.first)r.first={...attempt};
 r.attempts.push(attempt);if(r.attempts.length>32)r.attempts.splice(1,r.attempts.length-32);
 if(attempt.correct)s.answers[id]=answer;else s.tries[id]=Math.min(99,(s.tries[id]||0)+1);
 return {status:attempt.correct?'correct':'incorrect',attempt};
}
function result(s,id){
 if(s.answers[id]===undefined)return 'pending';
 const r=s.evidence?.[id],last=r?.attempts?.at(-1);
 if(!r||!last?.correct||last.answer!==s.answers[id])return 'unknown';
 if(last.helpBefore||r.help.some(h=>h.at<=last.at))return 'helped';
 if(r.legacyUnknown||last.prompt!==allQuestions()[id].prompt||r.first?.prompt!==allQuestions()[id].prompt)return 'unknown';
 if(!r.first?.correct)return 'corrected';
 return transferQuestions[id]?'first-without-hint':'explored';
}
function restore(raw){const s=blank();if(!raw||raw.version!==1)return s;
 for(const id of Object.keys(allQuestions())){
  if(correct(id,raw.answers?.[id]))s.answers[id]=String(raw.answers[id]).trim();
  if(typeof raw.drafts?.[id]==='string')s.drafts[id]=raw.drafts[id].slice(0,40);
  if(Number.isFinite(raw.draftTimes?.[id]))s.draftTimes[id]=raw.draftTimes[id];
  if(Number.isInteger(raw.tries?.[id]))s.tries[id]=Math.max(0,Math.min(99,raw.tries[id]));
  const old=raw.evidence?.[id];
  if(old&&typeof old==='object'){
   const r=record(s,id);r.legacyUnknown=old.legacyUnknown===true;
   const clean=a=>a&&typeof a.answer==='string'&&a.answer.trim()&&typeof a.helpBefore==='boolean'&&Number.isFinite(a.at)?{...(typeof a.id==='string'?{id:a.id.slice(0,100)}:{}),answer:a.answer.trim().slice(0,40),correct:correct(id,a.answer.trim().slice(0,40)),at:a.at,helpBefore:a.helpBefore,...(typeof a.prompt==='string'?{prompt:a.prompt.slice(0,500)}:{})}:null;
   r.first=clean(old.first);r.attempts=Array.isArray(old.attempts)?old.attempts.map(clean).filter(Boolean).slice(-32):[];
   r.help=Array.isArray(old.help)?old.help.filter(h=>h&&['hint','model'].includes(h.kind)&&Number.isFinite(h.at)).slice(-32).map(h=>({...((typeof h.id==='string')?{id:h.id.slice(0,100)}:{}),kind:h.kind,at:h.at})):[];
   if(s.answers[id]!==undefined&&!r.first)r.legacyUnknown=true;
  }else if(s.answers[id]!==undefined||s.tries[id]>0||(s.drafts[id]||'').trim())record(s,id).legacyUnknown=true;
 }
 s.stage=Number.isInteger(raw.stage)?Math.max(0,Math.min(unlocked(s),raw.stage)):0;
 s.savedAt=Number.isFinite(raw.savedAt)?raw.savedAt:0;
 s.transferPack=Number.isInteger(raw.transferPack)?Math.max(0,Math.min(2,raw.transferPack)):0;
 const m=raw.model||{};for(const [k,lo,hi,step]of [['powers',0,5,1],['negative',-3,3,1],['fraction',0,2,.5],['xIndex',0,5,1]])if(Number.isFinite(m[k])&&m[k]>=lo&&m[k]<=hi&&Number.isInteger(m[k]/step))s.model[k]=m[k];if([2,.5].includes(m.base))s.model.base=m.base;return s;}
// Saved events are monotone across tabs; a stale page cannot erase first answers or help.
function merge(local,stored){
 const a=restore(local),b=restore(stored),s=blank(),newer=a.savedAt===b.savedAt?(JSON.stringify(a.model)>JSON.stringify(b.model)?a:b):(a.savedAt>b.savedAt?a:b);
 s.answers={...b.answers,...a.answers};s.tries={...b.tries};s.model={...newer.model};s.savedAt=Math.max(a.savedAt,b.savedAt);s.transferPack=Math.max(a.transferPack,b.transferPack);
 const join=(left=[],right=[])=>{const byId=new Map();for(const e of [...left,...right]){const key=e.id||JSON.stringify(e);if(!byId.has(key)||JSON.stringify(e)>JSON.stringify(byId.get(key)))byId.set(key,e);}return [...byId.values()].sort((x,y)=>x.at-y.at||String(x.id||JSON.stringify(x)).localeCompare(String(y.id||JSON.stringify(y))));};
 const bound=events=>events.length>32?[events[0],...events.slice(-31)]:events;
 for(const id of Object.keys(allQuestions())){
  if(a.drafts[id]!==undefined||b.drafts[id]!==undefined){const ta=a.draftTimes[id]||0,tb=b.draftTimes[id]||0,source=ta===tb?(String(a.drafts[id]??'')>String(b.drafts[id]??'')?a:b):(ta>tb?a:b);const fallback=source===a?b:a;s.drafts[id]=source.drafts[id]??fallback.drafts[id];s.draftTimes[id]=Math.max(a.draftTimes[id]||0,b.draftTimes[id]||0);}
  s.tries[id]=Math.max(a.tries[id]||0,b.tries[id]||0);if(!s.tries[id])delete s.tries[id];
  const ra=a.evidence[id],rb=b.evidence[id];if(!ra&&!rb)continue;
  const r=record(s,id),attempts=join(ra?.attempts,rb?.attempts);r.first=join(ra?.first?[ra.first]:[],rb?.first?[rb.first]:[])[0]||null;r.attempts=bound(attempts);r.help=bound(join(ra?.help,rb?.help));r.legacyUnknown=!!(ra?.legacyUnknown||rb?.legacyUnknown);
  s.tries[id]=Math.min(99,Math.max(s.tries[id]||0,attempts.filter(e=>!e.correct).length));if(!s.tries[id])delete s.tries[id];
  const completed=attempts.filter(e=>e.correct).at(-1);if(completed)s.answers[id]=completed.answer;
 }
 s.stage=Math.min(unlocked(s),a.savedAt===b.savedAt?Math.max(a.stage,b.stage):newer.stage);
 return s;
}
const api={stages,questions,transferPacks,transferQuestions,number,correct,log,blank,unlocked,restore,merge,submit,setDraft,useHelp,result,xValues:[.25,.5,1,2,4,8]};
if(typeof module==='object'&&module.exports)module.exports=api;else root.LogIntro=api;
})(typeof window==='object'?window:globalThis);

/* Arithmetic detours: isolated state and dialog; no mutation of the source exercise. */
(function (global) {
'use strict';
const KEY='mathexam-vilenkin5-arithmetic-v1',MAX_SEED=4294967295;
const skills=[
 {id:'add',title:'Сложение с переходом через разряд'},
 {id:'subtract',title:'Вычитание, в том числе через нули'},
 {id:'multiply',title:'Умножение многозначных чисел'},
 {id:'divide',title:'Деление уголком'},
 {id:'remainder',title:'Деление с остатком'},
 {id:'table',title:'Таблица умножения и подбор цифры'},
 {id:'place',title:'Разряды и запись чисел'},
 {id:'order',title:'Порядок действий'},
 {id:'power',title:'Квадрат и куб числа'},
 {id:'divisibility',title:'Признаки делимости'},
 {id:'units',title:'Перевод единиц'}
];
const ids=new Set(skills.map(s=>s.id));
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const names=['единицы','десятки','сотни','тысячи','десятки тысяч','сотни тысяч'];
const placeNames=['единиц','десятков','сотен','тысяч','десятков тысяч','сотен тысяч'];
const step=(prompt,answer,hint,explain,mark)=>({prompt,answer:String(answer),hint,explain,...(mark?{mark}:{})});
function random(seed){let x=(seed^0x9e3779b9)>>>0;return (a,b)=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return a+x%(b-a+1)}}
function integer(value,min,max){return Number.isSafeInteger(value)&&value>=min&&value<=max}
function naturalInput(value){const s=String(value).trim();if(/^\d+$/.test(s))return s;if(/^\d{1,3}(?:[ \u00a0\u202f]\d{3})+$/.test(s))return s.replace(/[ \u00a0\u202f]/g,'');return null}
function equal(a,b){const x=naturalInput(a),y=naturalInput(b);if(x!==null&&y!==null)return BigInt(x)===BigInt(y);return String(a).trim().toLowerCase()===String(b).trim().toLowerCase()}
function generate(skill,level,seed){
 if(!ids.has(skill)||!integer(level,1,3)||!integer(seed,0,MAX_SEED))throw Error('Invalid arithmetic task parameters');
 const r=random(seed),steps=[],meta={skill,level,seed};let prompt,answer,hint,model;
 const addStep=(...args)=>steps.push(step(...args));
 if(skill==='add'){
  const a=level===1?r(15,87):level===2?r(125,789):r(1015,8798),b=level===1?r(14,86):level===2?r(118,689):r(1007,7987);
  Object.assign(meta,{a,b});prompt=`Вычисли ${a} + ${b}.`;answer=a+b;hint='Запиши единицы под единицами. Начни справа; полный десяток передай в следующий разряд.';
  let carry=0;const count=Math.max(String(a).length,String(b).length);
  for(let i=0;i<count;i++){
   const x=Math.floor(a/10**i)%10,y=Math.floor(b/10**i)%10,total=x+y+carry,oldCarry=carry;carry=Math.floor(total/10);
   const expr=`${x} + ${y}${oldCarry?' + '+oldCarry+' в уме':''}`;
   addStep(`${names[i][0].toUpperCase()+names[i].slice(1)}: ${expr}. Сколько получится?`,total,oldCarry?'Не забудь прибавить то, что оставили в уме.':'Сложи две цифры этого разряда.',`${expr} = ${total}. Пишем ${total%10} в разряде ${placeNames[i]}.${carry?' Одну единицу следующего разряда оставляем в уме.':' В следующий разряд ничего не переносим.'}`,{row:0,place:i,digit:total%10});
  }
  if(carry)addStep(`В уме осталась ${carry} единица старшего разряда. Какую цифру допишем слева?`,carry,'Перенос ещё не записан в результате.',`Дописываем ${carry} слева.`,{row:0,place:count,digit:carry});
  model={kind:'column',a,b,op:'+',rows:[answer]};
 }else if(skill==='subtract'){
  let a,b;if(level===1){a=r(3,9)*10+r(0,3);b=r(1,2)*10+r(4,9)}else if(level===2){a=r(3,9)*100+r(0,5);b=r(11,Math.min(289,a-1))}else{a=r(3,9)*1000+r(0,6);b=r(101,Math.min(2899,a-1))}
  Object.assign(meta,{a,b});prompt=`Вычисли ${a} − ${b}.`;answer=a-b;hint='Вычитай справа налево. Если цифры сверху не хватает, разменяй одну единицу старшего разряда; через нули размен продолжается.';
  const top=String(a).split('').reverse().map(Number),bottom=String(b).split('').reverse().map(Number);
  for(let i=0;i<top.length;i++){
   const y=bottom[i]||0;let borrowed='';if(top[i]<y){let j=i+1;while(top[j]===0)j++;top[j]--;for(let k=i+1;k<j;k++)top[k]=9;top[i]+=10;borrowed=`Разменяли одну единицу разряда ${placeNames[j]}.${j>i+1?' Промежуточные нули стали девятками.':''} `;}
   const x=top[i],digit=x-y;
   addStep(`${names[i][0].toUpperCase()+names[i].slice(1)}: ${borrowed}${x} − ${y}. Какую цифру запишем?`,digit,'Вычти нижнюю цифру из числа после размена.',`${x} − ${y} = ${digit}. ${i===top.length-1&&digit===0?'Старший нуль в начале ответа не пишем.':'Записываем '+digit+' в разряде '+placeNames[i]+'.'}`,{row:0,place:i,digit,top:top.slice()});
  }
  model={kind:'column',a,b,op:'−',rows:[answer]};
 }else if(skill==='multiply'){
  const a=level===1?r(12,89):r(102,789),b=level===3?r(12,49):r(2,9);Object.assign(meta,{a,b});prompt=`Вычисли ${a} × ${b}.`;answer=a*b;hint='Умножай справа налево. Цифру единиц запиши, десятки оставь в уме. При умножении на десятки сдвинь строку на один разряд.';
  const rows=[];let row=0;
  for(const ch of String(b).split('').reverse()){
   const factor=Number(ch);let carry=0;const digits=String(a).split('').reverse().map(Number);rows.push(a*factor*10**row);
   if(row)addStep(`Теперь умножаем на ${factor} десятка. На сколько разрядов сдвинем новую строку влево?`,row,'Десятки в десять раз больше единиц.','Строка десятков начинается на один разряд левее.',{row,place:0,digit:0});
   for(let i=0;i<digits.length;i++){
    const value=digits[i]*factor+carry,expr=`${digits[i]} × ${factor}${carry?' + '+carry+' в уме':''}`;
    addStep(`Строка ${row?'десятков':'единиц'}, ${names[i]}: ${expr}. Сколько получится?`,value,'Сначала умножь, затем прибавь перенос из предыдущего разряда.',`${expr} = ${value}. Записываем ${value%10}.${Math.floor(value/10)?' В уме '+Math.floor(value/10)+'.':' Переноса нет.'}`,{row,place:i+row,digit:value%10});carry=Math.floor(value/10);
   }
   if(carry)addStep(`В этой строке в уме осталось ${carry}. Что допишем слева?`,carry,'Запиши оставшийся перенос целиком.',`Дописываем ${carry}.`,{row,place:digits.length+row,digit:carry});
   row++;
  }
  if(rows.length>1)addStep(`Частичные произведения: ${rows[0]} и ${rows[1]}. Найди их сумму.`,answer,'Сложи по разрядам; нуль в строке десятков сохраняет место.',`${rows[0]} + ${rows[1]} = ${answer}.`);
  model={kind:'column',a,b,op:'×',rows};
 }else if(skill==='divide'||skill==='remainder'){
  const b=level===3?r(12,39):r(2,9),q=level===1?r(12,49):level===2?r(1,6)*100+r(1,9):r(12,159),rem=skill==='remainder'?r(1,b-1):0,a=q*b+rem;
  Object.assign(meta,{a,b,q,remainder:rem});prompt=skill==='divide'?`Вычисли ${a} : ${b}.`:`Раздели ${a} на ${b}. Какой получится остаток?`;answer=skill==='divide'?q:rem;hint='Найди первое неполное делимое. Подбирай одну цифру частного, умножай, вычитай и сноси следующую цифру. Остаток должен быть меньше делителя.';
  const digits=String(a).split('').map(Number);let current=0,started=false,qi=0;
  for(let i=0;i<digits.length;i++){
   const before=current;current=current*10+digits[i];
   if(!started&&current<b)continue;
   if(started)addStep(`После вычитания осталось ${before}. Сносим цифру ${digits[i]}. Какое число получилось?`,current,'Приписать цифру справа: умножить остаток на 10 и прибавить эту цифру.',`${before} × 10 + ${digits[i]} = ${current}.`);
   started=true;const digit=Math.floor(current/b),product=digit*b,left=current-product;
   addStep(`Делим ${current} на ${b}. Какую одну цифру запишем в частном?`,digit,digit===0?'Неполное делимое меньше делителя: это место в частном нельзя пропускать.':`Подбери цифру: произведение ${b} на неё не больше ${current}, а следующая цифра уже велика.`,`${b} × ${digit} = ${product} ≤ ${current}; ${b} × ${digit+1} = ${product+b} > ${current}. Пишем ${digit}.`,{quotient:qi++,digit});
   addStep(`Умножь делитель ${b} на выбранную цифру ${digit}.`,product,'Это количество, которое сейчас вычтем.',`${b} × ${digit} = ${product}.`);
   addStep(`Вычти ${product} из ${current}. Сколько осталось?`,left,'Остаток на этом шаге должен быть меньше делителя.',`${current} − ${product} = ${left}.`,{division:{current,product,left}});
   current=left;
  }
  if(skill==='remainder')addStep(`Получились частное ${q} и остаток ${rem}. Проверь: ${b} × ${q} + ${rem}. Какое число получилось?`,a,'Должно получиться исходное делимое.',`${b} × ${q} + ${rem} = ${a}. Остаток ${rem} меньше ${b}.`);
  model={kind:'division',a,b,q};
 }else if(skill==='table'){
  const a=level===1?r(2,5):r(6,9),b=r(2,9),product=a*b;Object.assign(meta,{a,b,product,reverse:level===3});
  prompt=level===3?`Подбери цифру: ${a} × □ = ${product}.`: `Вычисли ${a} × ${b}.`;answer=level===3?b:product;hint='Умножение — одинаковые группы. Можно опереться на знакомое произведение и прибавить ещё одну группу.';
  const half=Math.floor(b/2),first=a*half,rest=a*(b-half);
  addStep(`В первой части ${half} групп по ${a}. Сколько это?`,first,`Сложи число ${a} с собой ${half} раз.`,`${a} × ${half} = ${first}.`);
  addStep(`Осталось ${b-half} групп по ${a}. Сколько это?`,rest,'Считай одинаковыми группами.',`${a} × ${b-half} = ${rest}.`);
  addStep(`Сложи две части: ${first} + ${rest}.`,product,'Это все группы вместе.',`${first} + ${rest} = ${product}. Значит, ${a} × ${b} = ${product}.`);
  model={kind:'groups',a,b};
 }else if(skill==='place'){
  const n=r(100,9999),p=level===1?r(0,2):r(1,3);Object.assign(meta,{n,p});
  if(level===1){prompt=`В числе ${n} найди цифру ${placeNames[p]}.`;answer=Math.floor(n/10**p)%10;hint='Считай разряды справа: единицы, десятки, сотни.';addStep(`Единицы — крайняя цифра справа. Какая это цифра в числе ${n}?`,n%10,'Посмотри на последнюю цифру.',`В разряде единиц стоит ${n%10}.`);if(p>0)addStep(`Сдвинься от правого края на ${p} разряд${p===1?'':'а'}. Какая цифра стоит в разряде ${placeNames[p]}?`,answer,'Не путай цифру десятков с общим количеством десятков.',`Цифра ${placeNames[p]} — ${answer}.`)}
  else if(level===2){prompt=`Сколько полных ${placeNames[p]} содержится в числе ${n}?`;answer=Math.floor(n/10**p);hint=`Одна единица нужного разряда — ${10**p}. Найди, сколько таких полных групп помещается в числе.`;addStep(`Сколько единиц в одной единице разряда ${placeNames[p]}?`,10**p,'Каждый разряд слева в 10 раз крупнее предыдущего.',`Размер группы — ${10**p}.`);addStep(`Какое целое частное получится при делении ${n} на ${10**p}?`,answer,'Остаток не образует целую группу.',`${n} = ${answer} × ${10**p} + ${n%10**p}.`)}
  else{const thousands=r(1,9),tens=r(1,9),ones=r(0,9);Object.assign(meta,{thousands,tens,ones});prompt=`Запиши число: ${thousands} тысячи, 0 сотен, ${tens} десятков и ${ones} единиц.`;answer=thousands*1000+tens*10+ones;hint='Нуль сохраняет место сотен. Заполняй каждый разряд слева направо.';addStep(`Сколько единиц в ${thousands} тысячах?`,thousands*1000,'Умножь число тысяч на 1000.',`${thousands} × 1000 = ${thousands*1000}.`);addStep(`Сколько единиц в ${tens} десятках?`,tens*10,'Умножь число десятков на 10.',`${tens} × 10 = ${tens*10}.`);addStep(`Сложи ${thousands*1000} + ${tens*10} + ${ones}.`,answer,'Разряд сотен остаётся пустым, поэтому пишем 0.',`Получилось ${answer}.`)}
 }else if(skill==='order'){
  const a=r(4,18),b=r(2,12),c=r(2,8);Object.assign(meta,{a,b,c});hint='Сначала скобки, затем умножение и деление слева направо, потом сложение и вычитание слева направо.';
  if(level===1){prompt=`Вычисли ${a} + ${b} × ${c}.`;answer=a+b*c;addStep(`Каков результат действия, которое выполняется первым: ${b} × ${c}?`,b*c,'Умножение раньше сложения.',`${b} × ${c} = ${b*c}.`);addStep(`Теперь ${a} + ${b*c}. Чему равно выражение?`,answer,'Сложи оставшиеся числа.',`${a} + ${b*c} = ${answer}.`)}
  else{const sum=a+b;addStep(`Сколько получится в скобках: ${a} + ${b}?`,sum,'Сначала отдельное действие в скобках.',`${a} + ${b} = ${sum}.`);addStep(`Умножь результат скобок: ${sum} × ${c}.`,sum*c,'Скобки заменили одним числом.',`${sum} × ${c} = ${sum*c}.`);if(level===2){prompt=`Вычисли (${a} + ${b}) × ${c}.`;answer=sum*c}else{const d=r(2,9),q=r(2,8),e=d*q;Object.assign(meta,{d,e});prompt=`Вычисли (${a} + ${b}) × ${c} − ${e} : ${d}.`;answer=sum*c-q;addStep(`Вычисли деление: ${e} : ${d}.`,q,'Деление нужно закончить до вычитания.',`${e} : ${d} = ${q}.`);addStep(`Осталось ${sum*c} − ${q}. Чему равно выражение?`,answer,'Теперь выполнены все действия второй ступени.',`${sum*c} − ${q} = ${answer}.`)}}
 }else if(skill==='power'){
  const a=r(2,level===1?12:8),exp=level===1?2:3;Object.assign(meta,{a,exp});prompt=`Вычисли ${a}${exp===2?'²':'³'}.`;answer=a**exp;hint='Показатель степени говорит, сколько одинаковых множителей взять. Умножать основание на показатель нельзя.';addStep(`Начни с двух множителей: ${a} × ${a}.`,a*a,'Квадрат числа — произведение числа на себя.',`${a} × ${a} = ${a*a}.`);if(exp===3)addStep(`Для куба нужен ещё один множитель: ${a*a} × ${a}.`,a**3,'Всего три одинаковых множителя.',`${a} × ${a} × ${a} = ${a**3}.`);if(level===3){const b=r(2,9);meta.b=b;prompt=`Вычисли ${a}³ + ${b}².`;answer=a**3+b*b;addStep(`Вычисли квадрат второго числа: ${b} × ${b}.`,b*b,'Степень вычисляем раньше сложения.',`${b}² = ${b*b}.`);addStep(`Сложи ${a**3} + ${b*b}.`,answer,'Теперь обе степени заменены числами.',`${a**3} + ${b*b} = ${answer}.`)}
 }else if(skill==='divisibility'){
  const divisors=level===1?[2,5,10]:level===2?[3,9]:[2,3,5,9,10],b=divisors[r(0,divisors.length-1)],n=r(level===3?1000:100,level===3?9999:999);Object.assign(meta,{n,b});prompt=`Делится ли ${n} на ${b} без остатка? Запиши «да» или «нет».`;answer=n%b===0?'Да':'Нет';
  if(b===3||b===9){const ds=String(n).split('').map(Number),sum=ds.reduce((x,y)=>x+y,0);hint=`Число делится на ${b}, если сумма его цифр делится на ${b}.`;addStep(`Сложи цифры: ${ds.join(' + ')}. Какова сумма?`,sum,'Складывай цифры, а не разрядные слагаемые.',`${ds.join(' + ')} = ${sum}.`);addStep(`Делится ли сумма ${sum} на ${b} без остатка?`,answer,`Проверь, есть ли ${sum} среди кратных ${b}.`,`${sum} ${sum%b===0?'делится':'не делится'} на ${b}; исходное число тоже ${sum%b===0?'делится':'не делится'} на ${b}.`)}else{const digit=n%10;hint=b===2?'Достаточно посмотреть, чётная ли последняя цифра.':b===5?'Последняя цифра должна быть 0 или 5.':'Последняя цифра должна быть 0.';addStep(`Какая последняя цифра у числа ${n}?`,digit,'Это цифра единиц.',`Последняя цифра — ${digit}.`);addStep(`Последняя цифра ${digit}. Делится ли число на ${b}?`,answer,hint,`${n} ${n%b===0?'делится':'не делится'} на ${b}.`)}
 }else if(skill==='units'){
  const pairs=level===1?[['м','см',100],['см','мм',10],['кг','г',1000],['ч','мин',60]]:level===2?[['м²','дм²',100],['дм²','см²',100],['см²','мм²',100],['га','м²',10000]]:[['м³','дм³',1000],['дм³','см³',1000],['л','см³',1000],['м²','см²',10000]];
  const [big,small,factor]=pairs[r(0,pairs.length-1)],quantity=r(2,35),reverse=r(0,1)===1,a=reverse?quantity*factor:quantity,from=reverse?small:big,to=reverse?big:small;Object.assign(meta,{a,factor,reverse,from,to});prompt=`Переведи ${a} ${from} в ${to}. Запиши только число.`;answer=reverse?quantity:quantity*factor;hint=`1 ${big} = ${factor} ${small}. При переходе к меньшей единице число увеличивается, к большей — уменьшается.`;addStep(`Сколько ${small} в 1 ${big}?`,factor,level===1?'Вспомни соотношение единиц.':`Для ${big.includes('³')||small.includes('³')?'объёма учитываем три измерения':'площади учитываем два измерения'}.`, `1 ${big} = ${factor} ${small}.`);addStep(`Вычисли ${a} ${reverse?':':'×'} ${factor}.`,answer,reverse?'Полные группы меньших единиц объединяем в большую.':'Каждую большую единицу заменяем меньшими.',`${a} ${from} = ${answer} ${to}.`);
 }
 const solution=steps.map(s=>s.explain);solution.push(`Ответ: ${answer}${skill==='units'?' '+meta.to:''}.`);
 return {skill,level,seed,prompt,answer:String(answer),hint,steps,solution,meta,...(model?{model}:{})};
}
function fresh(seed){return{seed,step:0,draft:'',stepDraft:'',help:false,hintVisible:false,stepOpen:false,stepHint:false,revealed:false,attempts:0,solved:false,result:null}}
function initial(){return{version:1,active:{skill:'add',level:1},counter:(Date.now()%1000000000)>>>0,sessions:{},stats:{}}}
function validateState(raw){
 const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&(Object.getPrototypeOf(x)===Object.prototype||Object.getPrototypeOf(x)===null);
 const fail=()=>{throw Error('Invalid arithmetic progress')};const str=x=>{if(typeof x!=='string'||x.length>80)fail();return x};const bool=x=>{if(typeof x!=='boolean')fail();return x};const int=(x,max=1000000)=>{if(!integer(x,0,max))fail();return x};
 if(!object(raw)||raw.version!==1||!object(raw.active)||!ids.has(raw.active.skill)||!integer(raw.active.level,1,3)||!object(raw.sessions)||!object(raw.stats))fail();
 const result={version:1,active:{skill:raw.active.skill,level:raw.active.level},counter:int(raw.counter,MAX_SEED),sessions:{},stats:{}};
 if(Object.keys(raw.sessions).length>skills.length*3||Object.keys(raw.stats).length>skills.length)fail();
 for(const [key,x] of Object.entries(raw.sessions)){
  const m=key.match(/^([a-z]+):([123])$/);if(!m||!ids.has(m[1])||!object(x))fail();const seed=int(x.seed,MAX_SEED),task=generate(m[1],Number(m[2]),seed);
  const s={seed,step:int(x.step,task.steps.length),draft:str(x.draft),stepDraft:str(x.stepDraft),help:bool(x.help),hintVisible:bool(x.hintVisible),stepOpen:bool(x.stepOpen),stepHint:bool(x.stepHint),revealed:bool(x.revealed),attempts:int(x.attempts),solved:bool(x.solved),result:x.result};
  if(![null,'independent','corrected','assisted'].includes(s.result)||((s.stepOpen||s.hintVisible||s.stepHint||s.revealed||s.step>0)&&!s.help))fail();
  if(s.step>0&&!s.stepOpen||(s.stepHint||s.revealed)&&!s.stepOpen||s.revealed&&s.step>=task.steps.length)fail();
  if(s.solved){if(!equal(s.draft,task.answer)||s.attempts<1||!s.result)fail();if(s.result==='independent'&&(s.help||s.attempts!==1)||s.result==='corrected'&&(s.help||s.attempts<2)||s.result==='assisted'&&!s.help)fail()}else if(s.result!==null)fail();
  result.sessions[key]=s;
 }
 for(const [key,x] of Object.entries(raw.stats)){if(!ids.has(key)||!object(x))fail();result.stats[key]={independent:int(x.independent),corrected:int(x.corrected),assisted:int(x.assisted)}}
 return result;
}
function renderModel(task,st){
 const m=task.model;if(!m)return '';
 if(m.kind==='groups')return `<div class="arithmetic-groups" role="img" aria-label="${m.b} групп по ${m.a}">${Array.from({length:m.b},()=>`<span>${Array.from({length:m.a},()=>'<i></i>').join('')}</span>`).join('')}</div>`;
 if(m.kind==='column'){
  const width=Math.max(String(m.a).length,String(m.b).length,...m.rows.map(x=>String(x).length)),digits=m.rows.map(value=>Array.from({length:width},(_,i)=>i<width-String(value).length?'':'□'));
  for(const s of task.steps.slice(0,st.step)){if(s.mark&&s.mark.row!==undefined){const k=width-1-s.mark.place;if(k>=0&&s.mark.place<String(m.rows[s.mark.row]).length)digits[s.mark.row][k]=String(s.mark.digit)}}
  const number=n=>String(n).padStart(width,' ').split('').map(c=>`<td>${c===' '?'':c}</td>`).join('');
  const top=m.op==='−'?task.steps[Math.min(st.step,task.steps.length-1)].mark.top:null;
  const topChanged=top&&top.some((d,i)=>d!==Math.floor(m.a/10**i)%10);
  const topRow=topChanged?Array.from({length:width},(_,i)=>{const j=width-1-i,value=top[j];return `<td class="${value!==Math.floor(m.a/10**j)%10?'arithmetic-exchanged':''}">${value===undefined?'':value}</td>`}).join(''):number(m.a);
  return `<div class="arithmetic-model"><table class="arithmetic-column" aria-label="Вычисление по разрядам"><tbody><tr><th></th>${topRow}</tr><tr><th>${m.op}</th>${number(m.b)}</tr>${digits.map((row,i)=>`<tr class="arithmetic-line"><th>${digits.length>1?String(i+1)+'.':''}</th>${row.map(c=>`<td class="${c==='□'?'arithmetic-unknown':''}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table><p>${topChanged?'В верхней строке показан размен. Каждая клетка — отдельный разряд; число 10 в одной клетке означает десять единиц этого разряда. ':''}${m.op==='×'&&digits.length>1?'Ниже появятся частичные произведения.':'Цифры результата появятся на своих местах после шагов.'}</p></div>`;
 }
 if(m.kind==='division'){
  const q=Array(String(m.q).length).fill('□'),rows=[];for(const s of task.steps.slice(0,st.step)){if(s.mark?.quotient!==undefined)q[s.mark.quotient]=s.mark.digit;if(s.mark?.division)rows.push(s.mark.division)}
  return `<div class="arithmetic-model"><div class="arithmetic-division"><span>${m.a}</span><span>${m.b}</span><span></span><strong aria-label="Цифры частного">${q.join(' ')}</strong></div>${rows.length?`<div class="arithmetic-division-rows">${rows.map(x=>`<p>${x.current} − ${x.product} = <strong>${x.left}</strong></p>`).join('')}</div>`:''}<p>Каждая выбранная цифра остаётся на своём месте в частном.</p></div>`;
 }
 return '';
}
let state=null,storageOK=true,storageMessage='',dialog=null,focusBefore=null,token=0;
const storage=()=>global.localStorage;
function save(){if(!storageOK)return;try{storage().setItem(KEY,JSON.stringify(state))}catch(e){storageOK=false;storageMessage='Не удалось сохранить тренировку. Можно продолжать; исходные данные не удалены.'}}
function load(){if(state)return;state=initial();try{const raw=storage().getItem(KEY);if(raw){if(raw.length>120000)throw Error('size');state=validateState(JSON.parse(raw))}}catch(e){storageOK=false;storageMessage='Сохранённую тренировку не удалось прочитать. Прежняя запись сохранена без изменений; эта сессия работает без сохранения.'}}
function active(){const {skill,level}=state.active,key=`${skill}:${level}`;if(!state.sessions[key]){state.counter=(state.counter+1)>>>0;state.sessions[key]=fresh(state.counter)}return{key,skill,level,st:state.sessions[key],task:generate(skill,level,state.sessions[key].seed)}}
function say(text,cls=''){const el=dialog.querySelector('#arithmeticFeedback');if(el){el.textContent=text;el.className='arithmetic-feedback '+cls}}
function formatFor(answer){return /^\d+$/.test(answer)?'Запиши целое число без единиц измерения. Тысячи можно отделять пробелами.':'Запиши «да» или «нет».'}
function inputForm(question,answer,value,id,button='Проверить'){return `<form id="${id}Form" class="arithmetic-form"><label for="${id}">${E(question)} <span>${formatFor(answer)}</span></label><div><input id="${id}" maxlength="80" autocomplete="off" spellcheck="false" inputmode="${/^\d+$/.test(answer)?'numeric':'text'}" value="${E(value)}"><button type="submit" class="primary">${button}</button></div></form>`}
function valid(value,expected){if(!value.trim()){say('Сначала запиши ответ.');return false}if(value.length>80){say('Запиши только ответ.','error');return false}if(/^\d+$/.test(expected)&&naturalInput(value)===null){say('Здесь нужен ответ целым числом: например, 24. Попытка пока не засчитана.','error');return false}if(!/^\d+$/.test(expected)&&!['да','нет'].includes(value.trim().toLowerCase())){say('Запиши «да» или «нет». Попытка пока не засчитана.','error');return false}return true}
function render(shouldFocus=false){
 const ctx=active(),{key,skill,level,st,task}=ctx,currentToken=++token;save();const current=()=>currentToken===token&&`${state.active.skill}:${state.active.level}`===key;
 const stats=state.stats[skill]||{independent:0,corrected:0,assisted:0};
 dialog.innerHTML=`<div class="arithmetic-top"><div><p class="eyebrow">Отдельная тренировка</p><h2 id="arithmeticTitle">Разберём вычисления</h2></div><button id="arithmeticClose" aria-label="Закрыть тренировку и вернуться к исходному заданию">Вернуться к заданию</button></div><p class="arithmetic-return-note">Твоя задача и введённый ответ остаются на месте. Здесь — дополнительные примеры.</p>${storageOK?'':`<p class="arithmetic-storage" role="status">${E(storageMessage)}</p>`}<div class="arithmetic-settings"><label>Что потренировать<select id="arithmeticSkill">${skills.map(s=>`<option value="${s.id}" ${s.id===skill?'selected':''}>${E(s.title)}</option>`).join('')}</select></label><label>Уровень<select id="arithmeticLevel">${[[1,'1 · Начать спокойно'],[2,'2 · Закрепить'],[3,'3 · Сложнее']].map(([n,t])=>`<option value="${n}" ${n===level?'selected':''}>${t}</option>`).join('')}</select></label></div><section class="arithmetic-exercise" aria-labelledby="arithmeticPrompt"><h3 id="arithmeticPrompt">${E(task.prompt)}</h3>${!st.solved?inputForm(task.prompt,task.answer,st.draft,'arithmeticAnswer'):''}${st.solved?`<div class="arithmetic-result"><strong>Верно: ${E(task.answer)}${skill==='units'?' '+E(task.meta.to):''}</strong><p>${({independent:'Получилось самостоятельно с первой попытки.',corrected:'Получилось после исправления.',assisted:'Получилось с помощью подсказки или шагов.'})[st.result]}</p><button id="arithmeticFreshCheck" class="primary">Новый пример — проверить себя</button></div>`:`<div class="arithmetic-actions"><button id="arithmeticHint">Хочешь подсказку?</button><button id="arithmeticSteps">${st.stepOpen?'Шаги открыты ниже':'Разобрать по шагам'}</button></div>`}${st.hintVisible?`<p class="arithmetic-hint">${E(task.hint)}</p>`:''}${st.stepOpen?`<section class="arithmetic-guided"><h3>Собираем вычисление</h3>${renderModel(task,st)}${task.steps.slice(0,st.step).map((s,i)=>`<div class="arithmetic-completed"><span>Шаг ${i+1}</span><p>${E(s.explain)}</p></div>`).join('')}${st.step<task.steps.length?`<div class="arithmetic-current"><p>Шаг ${st.step+1} из ${task.steps.length}</p>${inputForm(task.steps[st.step].prompt,task.steps[st.step].answer,st.stepDraft,'arithmeticStepAnswer')}<div class="arithmetic-actions"><button id="arithmeticStepHint">Подсказка к этому шагу</button><button id="arithmeticReveal" class="help-link">Показать этот шаг</button></div>${st.stepHint?`<p class="arithmetic-hint">${E(task.steps[st.step].hint)}</p>`:''}${st.revealed?`<div class="arithmetic-hint"><p>${E(task.steps[st.step].explain)}</p><p>Ответ шага: <strong>${E(task.steps[st.step].answer)}</strong></p><button id="arithmeticContinue">Продолжить с подсказкой</button></div>`:''}</div>`:`<p class="arithmetic-hint">Все шаги собраны.${st.solved?'':' Вернись к полю ответа выше и запиши результат всего примера.'}</p>`}</section>`:''}<div id="arithmeticFeedback" class="arithmetic-feedback" role="status" aria-live="polite"></div></section><div class="arithmetic-bottom"><button id="arithmeticNew">Другой похожий пример</button><button id="arithmeticReturn">Вернуться к заданию</button></div><details class="arithmetic-stats"><summary>Мои результаты в этой теме</summary><p>Самостоятельно: <strong>${stats.independent}</strong> · После исправления: <strong>${stats.corrected}</strong> · С помощью: <strong>${stats.assisted}</strong></p><p>Это результаты дополнительных примеров. Они не засчитывают исходную задачу. Для самостоятельной проверки бери новый пример.</p></details>`;
 const $=s=>dialog.querySelector(s);$('#arithmeticClose').onclick=close;$('#arithmeticReturn').onclick=close;
 $('#arithmeticSkill').onchange=e=>{if(!current()||!ids.has(e.target.value))return;state.active.skill=e.target.value;render()};$('#arithmeticLevel').onchange=e=>{if(!current()||!integer(Number(e.target.value),1,3))return;state.active.level=Number(e.target.value);render()};
 const newTask=()=>{if(!current())return;let next,attempt=0;do{state.counter=(state.counter+1)>>>0;next=generate(skill,level,state.counter)}while(next.prompt===task.prompt&&++attempt<500);state.sessions[key]=fresh(state.counter);render(true)};$('#arithmeticNew').onclick=newTask;if($('#arithmeticFreshCheck'))$('#arithmeticFreshCheck').onclick=newTask;
 if(!st.solved){
  const input=$('#arithmeticAnswer');input.oninput=()=>{if(!current())return;input.value=input.value.slice(0,80);st.draft=input.value;save()};
  $('#arithmeticAnswerForm').onsubmit=e=>{e.preventDefault();if(!current()||st.solved)return;st.draft=input.value.slice(0,80);if(!valid(st.draft,task.answer))return;st.attempts=Math.min(1000000,st.attempts+1);if(equal(st.draft,task.answer)){st.solved=true;st.result=st.help?'assisted':st.attempts===1?'independent':'corrected';const stats=state.stats[skill]||(state.stats[skill]={independent:0,corrected:0,assisted:0});stats[st.result]=Math.min(1000000,stats[st.result]+1);save();render()}else{save();say('Пока не совпало. Проверь вычисление; можно открыть подсказку или разобрать пример по шагам.','error')}};
  $('#arithmeticHint').onclick=()=>{if(!current())return;st.help=true;st.hintVisible=true;save();render()};$('#arithmeticSteps').onclick=()=>{if(!current())return;st.help=true;st.stepOpen=true;save();render()};
 }
 if(st.stepOpen&&st.step<task.steps.length){
  const s=task.steps[st.step],index=st.step,input=$('#arithmeticStepAnswer');input.oninput=()=>{if(!current())return;input.value=input.value.slice(0,80);st.stepDraft=input.value;save()};
  const advance=()=>{if(!current()||st.step!==index)return;st.step++;st.stepDraft='';st.stepHint=false;st.revealed=false;save();render(true)};
  $('#arithmeticStepAnswerForm').onsubmit=e=>{e.preventDefault();if(!current()||st.step!==index)return;st.stepDraft=input.value.slice(0,80);if(!valid(st.stepDraft,s.answer))return;if(equal(st.stepDraft,s.answer))advance();else{save();say('Проверь именно это действие. Подсказка относится к текущему шагу.','error')}};
  $('#arithmeticStepHint').onclick=()=>{if(!current())return;st.stepHint=true;save();render()};$('#arithmeticReveal').onclick=()=>{if(!current())return;st.revealed=true;save();render()};if($('#arithmeticContinue'))$('#arithmeticContinue').onclick=advance;
 }
 if(shouldFocus){const input=dialog.querySelector(st.stepOpen&&st.step<task.steps.length?'#arithmeticStepAnswer':'#arithmeticAnswer');if(input)input.focus()}
}
function close(){if(!dialog)return;save();dialog.close();if(focusBefore&&typeof focusBefore.focus==='function')focusBefore.focus()}
function open(options={}){
 if(!global.document)throw Error('ArithmeticPractice.open requires a document');load();
 if(dialog?.open)return;
 if(typeof options.onHelp==='function')options.onHelp();
 // A contextual entry selects its first relevant skill; each skill and level keeps its own draft.
 if(Array.isArray(options.skills)){const requested=options.skills.find(s=>ids.has(s));if(requested)state.active.skill=requested}
 if(!dialog){dialog=global.document.createElement('dialog');dialog.className='arithmetic-dialog';dialog.id='arithmeticPractice';dialog.setAttribute('aria-labelledby','arithmeticTitle');global.document.body.appendChild(dialog);dialog.addEventListener('cancel',()=>{save()});dialog.addEventListener('close',()=>{save();if(focusBefore&&typeof focusBefore.focus==='function')focusBefore.focus()})}
 focusBefore=global.document.activeElement;render();dialog.showModal();
}
const api={skills,open,generate,validateState,renderModel,key:KEY};global.ArithmeticPractice=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

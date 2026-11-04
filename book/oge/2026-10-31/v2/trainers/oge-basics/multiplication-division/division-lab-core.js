(function(root){
 'use strict';
 const KEY='mathExamBasics.longDivisionLab.v1';
 const levels={
  oneDigit:{title:'На одну цифру',idea:'Делим слева направо. На каждом шаге выбираем одну цифру частного, умножаем её на делитель и вычитаем произведение.',example:['735','5']},
  zero:{title:'Ноль в частном',idea:'Если после сноса получилось число меньше делителя, записываем в частном ноль. Он сохраняет место разряда: 201 и 21 — разные числа.',example:['1005','5']},
  remainder:{title:'С остатком',idea:'Когда цифры закончились, оставляем целый остаток. Он должен быть меньше делителя. Проверка: делитель × частное + остаток = делимое.',example:['739','5']},
  twoDigit:{title:'На двузначное число',idea:'Прикидка помогает выбрать цифру. Затем проверяем произведение: оно не больше неполного делимого, а следующее кратное уже больше.',example:['864','36']},
  decimalNatural:{title:'Десятичная дробь ÷ целое',idea:'На границе целой и дробной частей делимого ставим запятую в частном. Дальше делим десятые, сотые и следующие разряды тем же способом.',example:['12,6','3']},
  appendZeros:{title:'Дописываем нули',idea:'Если цифры закончились, а остаток есть, можно продолжить деление после запятой. Приписанный справа ноль не меняет делимое. Здесь все десятичные ответы конечные.',example:['1','8']},
  decimalDivisor:{title:'Десятичный делитель',idea:'Сначала умножаем оба числа на одну и ту же степень десяти. Делитель станет целым, а частное сохранится. Только после изменения обоих чисел начинаем уголок.',example:['8','2,5']}
 };
 function number(text){
  const s=String(text).trim().replace('.',','),m=s.match(/^(\d{1,8})(?:,(\d{1,4}))?$/);
  if(!m)throw Error('Нужно неотрицательное число, до четырёх знаков после запятой.');
  return {units:Number(m[1]+(m[2]||'')),places:(m[2]||'').length};
 }
 function decimal(units,places){
  if(places<0)return String(units*10**(-places));
  let s=String(units).padStart(places+1,'0');if(places)s=s.slice(0,-places)+','+s.slice(-places);
  return s.includes(',')?s.replace(/0+$/,'').replace(/,$/,''):s;
 }
 function equal(a,b){try{const x=number(a),y=number(b);return x.units*10**y.places===y.units*10**x.places;}catch(e){return false;}}
 function normalizeTask(t){
  if(!t||!Object.hasOwn(levels,t.level)||typeof t.dividend!=='string'||typeof t.divisor!=='string')throw Error('Неизвестное задание.');
  const a=number(t.dividend),b=number(t.divisor);if(!b.units||a.units>100000000||b.units>1000000)throw Error('Числа вне диапазона тренажёра.');
  if(t.level==='remainder'&&(a.places||b.places))throw Error('Остаток в этой ступени относится к целым числам.');
  return {level:t.level,dividend:decimal(a.units,a.places),divisor:decimal(b.units,b.places)};
 }
 function plan(raw){
  const task=normalizeTask(raw),a=number(task.dividend),b=number(task.divisor),shift=b.places;
  const normalizedDividend=decimal(a.units,a.places-shift),normalizedDivisor=b.units;
  const parts=normalizedDividend.split(','),digits=(parts[0]+(parts[1]||'')).split('').map(Number),intLen=parts[0].length,originalLength=digits.length;
  const actions=[],cycles=[];let quotient='',remainder=0,comma=false;
  function action(kind,prompt,answer,hint,extra){const i=actions.length;actions.push({kind,prompt,answer:String(answer),hint,...extra});return i;}
  if(shift){
   action('shift-count','На сколько разрядов вправо нужно перенести запятую, чтобы делитель '+task.divisor+' стал целым?',shift,'Посчитай цифры после запятой в делителе.');
   action('shift-factor','На какое число нужно умножить и делимое, и делитель?',10**shift,'Каждый разряд вправо соответствует умножению на 10.');
   action('shift-divisor','Запиши новый делитель: '+task.divisor+' × '+10**shift+'.',normalizedDivisor,'Перенеси запятую в делителе на выбранное число разрядов.');
   action('shift-dividend','Теперь измени делимое тем же способом: '+task.dividend+' × '+10**shift+'.',normalizedDividend,'Менять только делитель нельзя: тогда частное изменится. Если цифр не хватает, допиши нули справа.');
  }
  const normalizationEnd=actions.length;
  let index=0,partial=digits[0];while(partial<normalizedDivisor&&index<intLen-1){index++;partial=partial*10+digits[index];}
  action('start','Какое первое неполное делимое возьмём слева?',partial,'Бери слева наименьший блок не меньше делителя. Если вся целая часть меньше делителя, начинай с неё и запиши ноль в частном.',{sourceIndex:index});
  while(true){
   if(cycles.length>20)throw Error('Это деление не даёт короткого конечного ответа.');
   const q=Math.floor(partial/normalizedDivisor),product=q*normalizedDivisor,rem=partial-product,cycle={sourceIndex:index,partial,qd:q,product,remainder:rem};
   cycle.digitAction=action('digit','Какая цифра частного подходит к '+partial+' : '+normalizedDivisor+'?',q,'Выбери наибольшую цифру от 0 до 9, произведение которой на делитель не больше неполного делимого.',{cycle:cycles.length});quotient+=q;
   cycle.productAction=action('product','Вычисли произведение: '+normalizedDivisor+' × '+q+'.',product,'Умножь делитель на только что выбранную цифру. Для двузначного числа можно отдельно умножить десятки и единицы.',{cycle:cycles.length});
   cycle.subtractAction=action('subtract','Вычти: '+partial+' − '+product+'.',rem,'Проверь разность сложением. Она должна быть меньше делителя.',{cycle:cycles.length});cycles.push(cycle);remainder=rem;
   if(index===digits.length-1&&(task.level==='remainder'||rem===0))break;
   const next=index+1;
   if(next===intLen&&!comma){action('comma','Запиши полученную целую часть частного '+quotient+' и поставь после неё запятую.',quotient+',','Запятая появляется перед первой дробной цифрой. Если целая часть меньше единицы, ноль перед запятой сохраняется.');quotient+=',';comma=true;}
   let appended=false;if(next===digits.length){digits.push(0);appended=true;if(digits.length-originalLength>6)throw Error('Нужна конечная десятичная дробь.');}
   action('bring',appended?'Цифры закончились, но остаток есть. Какую цифру допишем после запятой и снесём?':'Какую следующую цифру делимого снесём к остатку?',digits[next],appended?'Справа от последнего десятичного разряда можно дописать ноль: значение числа сохранится.':'Сносим ровно одну следующую цифру, даже если это ноль.',{sourceIndex:next,appended});
   partial=rem*10+digits[next];action('partial','Какое новое неполное делимое получится после сноса?',partial,'Остаток переходит в следующий разряд: умножь его на 10 и прибавь снесённую цифру.',{sourceIndex:next});index=next;
  }
  quotient=decimal(number(quotient).units,number(quotient).places);
  action('answer','Запиши '+(task.level==='remainder'?'целое частное':'полное частное')+' по выполненному уголку.',quotient,'Прочитай все цифры частного подряд. Сохрани нули внутри записи и положение запятой.');
  if(task.level==='remainder')action('final-remainder','Запиши окончательный остаток.',remainder,'Это последняя разность. Она неотрицательна и меньше делителя.');
  action('verify','Проверь ответ: '+task.divisor+' × '+quotient+(task.level==='remainder'?' + '+remainder:'')+' = ?',task.dividend,'Обратное действие должно вернуть исходное делимое.');
  return {task,actions,cycles,normalizedDividend,normalizedDivisor,normalizationEnd,digits,intLen,originalLength,quotient,remainder};
 }
 function rng(seed){let x=(seed>>>0)||1;return (lo,hi)=>{x=(Math.imul(1664525,x)+1013904223)>>>0;return lo+Math.floor(x/4294967296*(hi-lo+1));};}
 function make(level,seed){
  if(!Object.hasOwn(levels,level))throw Error('Неизвестная ступень.');
  if(seed===0)return {level,dividend:levels[level].example[0],divisor:levels[level].example[1]};
  const r=rng(seed),pick=a=>a[r(0,a.length-1)];let d,q,n,p;
  if(level==='oneDigit'){d=r(2,9);q=r(12,299);n=d*q;}
  if(level==='zero'){d=r(2,9);q=r(1,8)*100+r(1,9);n=d*q;}
  if(level==='remainder'){d=r(2,12);q=r(12,199);n=d*q+r(1,d-1);}
  if(level==='twoDigit'){d=r(12,49);q=r(12,99);n=d*q;}
  if(level==='decimalNatural'){d=r(2,9);p=pick([1,2]);q=r(11,199);return {level,dividend:decimal(d*q,p),divisor:String(d)};}
  if(level==='appendZeros'){d=pick([4,8,20,25,40]);n=r(1,99);if(n%d===0)n++;}
  if(level==='decimalDivisor'){p=pick([1,2]);d=pick([12,15,16,25,32,45,75]);const qp=pick([0,1,2]);q=r(11,149);return {level,dividend:decimal(d*q,p+qp),divisor:decimal(d,p)};}
  return {level,dividend:String(n),divisor:String(d)};
 }
 function check(value,action){const s=String(value).trim().replace('.',',');if(action.kind==='comma')return s===action.answer;if(['digit','bring'].includes(action.kind)&&!/^\d$/.test(s))return false;if(['shift-count','shift-factor'].includes(action.kind)&&!/^\d+$/.test(s))return false;return equal(s,action.answer);}
 function fingerprint(t){return t.level+'|'+t.dividend+'|'+t.divisor;}
 function blank(){return {schema:'mathexam-division-lab',version:1,sequence:1,seen:[],records:[],session:null};}
 function integer(x,max){return Number.isInteger(x)&&x>=0&&x<=max;}
 function sessionValid(s){
  if(!s||!['learn','practice','check'].includes(s.mode)||!integer(s.step,150)||!integer(s.errors,100000)||!integer(s.hints,100000)||!integer(s.reveals,100000)||typeof s.repeated!=='boolean'||typeof s.input!=='string'||s.input.length>60)throw Error('Повреждено незавершённое решение.');
  const p=plan(s.task);if(s.step>p.actions.length)throw Error('Некорректный номер шага.');
  return {task:p.task,mode:s.mode,step:s.step,errors:s.errors,hints:s.hints,reveals:s.reveals,repeated:s.repeated,input:s.input};
 }
 function validate(x){
  if(!x||x.schema!=='mathexam-division-lab'||x.version!==1||!integer(x.sequence,1000000)||!Array.isArray(x.seen)||x.seen.length>3000||x.seen.some(v=>typeof v!=='string'||v.length>100)||!Array.isArray(x.records)||x.records.length>1000)throw Error('Неверная резервная копия лаборатории.');
  const records=x.records.map(r=>{const s=sessionValid(r);if(s.step!==plan(s.task).actions.length||!Number.isFinite(r.finishedAt)||r.finishedAt<0)throw Error('Некорректный результат.');return {...s,finishedAt:r.finishedAt,independent:s.mode==='check'&&!s.repeated&&!s.errors&&!s.hints&&!s.reveals};});
  const session=x.session===null?null:sessionValid(x.session);if(records.length===1000&&session&&session.step<plan(session.task).actions.length)throw Error('В полной записи нет места для ещё одного результата.');
  return {schema:x.schema,version:1,sequence:x.sequence,seen:[...new Set(x.seen)],records,session};
 }
 const api={KEY,levels,number,decimal,equal,plan,make,check,fingerprint,blank,validate};root.DivisionLab=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);

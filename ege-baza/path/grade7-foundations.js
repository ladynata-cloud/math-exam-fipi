/* Earlier arithmetic for grade 7. Additive IDs; exact integer-scaled arithmetic. */
(function(root){'use strict';
const D=root.PathData,previous=D.task,fraction=D.practice.fraction;
const variantsPerMode=120,count=3*variantsPerMode;
const families=[
 {id:'grade7-b-mixed-borrow',title:'Смешанные числа: занимаем единицу',gap:'fractions',idea:'Если дробной части не хватает, разменяй одно целое на доли общего знаменателя. Значение числа при этом не меняется.'},
 {id:'grade7-b-fraction-product-cancel',title:'Умножение дробей: сокращаем множители',gap:'fractions',idea:'Сокращать можно общий множитель числителя и знаменателя произведения. Слагаемые по отдельности сокращать нельзя.'},
 {id:'grade7-b-fraction-division-meaning',title:'Деление дробей: что показывает частное',gap:'fractions',idea:'Частное показывает, сколько раз делитель содержится в делимом. Переверни только делитель и замени деление умножением.'},
 {id:'grade7-b-decimal-place-align',title:'Десятичные дроби: разряд под разрядом',gap:'decimals',idea:'Записывай запятую под запятой. Допиши справа нули, чтобы складывать или вычитать доли одного размера.'},
 {id:'grade7-b-decimal-divisor-scale',title:'Деление десятичных: делитель без запятой',gap:'division',idea:'Умножь и делимое, и делитель на одно и то же число 10, 100 или 1000. Частное сохранится, а делитель станет целым.'},
 {id:'grade7-b-signed-fraction-sum',title:'Дроби со знаками: общие доли',gap:'signs',idea:'Сначала получи одинаковые знаменатели. Затем складывай числители вместе со знаками; вычитание отрицательного заменяй сложением.'},
 {id:'grade7-b-ratio-units',title:'Отношения: сначала одинаковые единицы',gap:'proportion',idea:'Сравнивать длины или массы отношением можно после перевода в одинаковые единицы. В задаче на части найди размер одной равной доли.'},
 {id:'grade7-b-percent-proportion',title:'Проценты через пропорцию',gap:'percent',idea:'Целое всегда соответствует 100%. Поставь количество и проценты в одинаковом порядке и составь пропорцию.'}
];
const ids=new Set(families.map(m=>m.id));
const S=(q,a,why)=>({q,a,why,strict:true});
const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
const decimal=(n,digits)=>{
 const sign=n<0?'−':'',s=String(Math.abs(n)).padStart(digits+1,'0');
 return sign+(digits?s.slice(0,-digits)+','+s.slice(-digits):s);
};
const mixed=(w,n,d)=>n?`${w} ${n}/${d}`:String(w);
const plan={kind:'plan'};
function make(q,n,d,steps,params,model=plan,extra={}){
 const exact=fraction(n,d);
 return {q,answer:n/d,a:exact,answerExact:exact,steps,params,model:{...model},strict:true,...extra};
}
function mixedBorrow(n,mode){
 const d=3+n%8,A=3+Math.floor(n/8),B=1+Math.floor(n/40);
 let p=1+Math.floor(n/24)%(d-2),q=p+1+Math.floor(n/8)%(d-p-1),e=d;
 if(mode===1){p=1+n%(d-1);e=2*d;q=2*p+1+Math.floor(n/8)%(2*d-2*p-1);}
 if(mode===2){p=0;q=1+n%(d-1);}
 const common=e,converted=p*(common/d),borrowed=converted+common,whole=A-B-1,num=borrowed-q,total=whole*common+num;
 const steps=[];
 if(mode===1)steps.push(S('Какой наименьший общий знаменатель у дробных частей?',common,'Один знаменатель кратен другому. Выбери тот, на который делятся оба.'),S(`Каким станет числитель ${p}/${d} после приведения к общему знаменателю?`,converted,'Во сколько раз увеличен знаменатель, во столько же увеличь числитель.'));
 steps.push(S(`Размени одно целое из ${A}. Сколько целых останется до вычитания?`,A-1,'Одно целое заменяем дробью, у которой числитель равен знаменателю.'),S(`После размена сколько долей 1/${common} будет в дробной части уменьшаемого?`,borrowed,'Прибавь к прежнему числителю доли одного целого.'),S('Какой числитель получится при вычитании дробных частей?',num,'Теперь долей достаточно. Вычти числитель второй дроби; знаменатель сохрани.'),S('Сколько целых останется после вычитания целых частей?',whole,'Из целых после размена вычти целые второго числа.'),S('Собери ответ. Введи обыкновенную дробь или точную десятичную запись.',fraction(total,common),'Переведи оставшиеся целые в доли и прибавь дробную часть. Смешанное число можно ввести неправильной дробью.'));
 return make(`Вычисли ${mixed(A,p,d)} − ${mixed(B,q,e)}.`,total,common,steps,{mode,A,B,p,q,d,e,common,borrowed,whole,num},{kind:'fraction-bars',fractions:[[q,e]]});
}
function productCancel(n,mode){
 const c=2+n%8,d=3+Math.floor(n/8),a=1+Math.floor(n/40)%(c-1);
 let left=[a,c],right=[c,d],text=`${a}/${c} · ${c}/${d}`,steps=[];
 if(mode===1){left=[c,1];right=[a,c*d];text=`${c} · ${a}/${c*d}`;steps.push(S(`Запиши целое число ${c} дробью со знаменателем 1. Какой числитель?`,c,'Любое целое число можно записать как это число, делённое на 1.'));}
 if(mode===2){left=[c+1,c];right=[c,d];text=`1 1/${c} · ${c}/${d}`;steps.push(S(`Переведи 1 1/${c} в неправильную дробь. Какой числитель?`,c+1,'Одно целое содержит столько долей, сколько показывает знаменатель. Прибавь ещё одну долю.'));}
 const numerator=mode===2?c+1:a;
 steps.push(S(mode===1?'На какое число сократишь целый множитель и знаменатель дроби?':'Какой одинаковый множитель есть в знаменателе первой дроби и числителе второй?',c,'Дели числитель и знаменатель всего произведения на один общий множитель. Сокращение относится к множителям, а не слагаемым.'),S(mode===1?'Какой знаменатель останется у дроби после этого сокращения?':'Какой знаменатель останется у первой дроби после этого сокращения?',mode===1?d:1,'Раздели соответствующий знаменатель на выбранный общий множитель.'),S('Вычисли произведение и сократи ответ.',fraction(numerator,d),'После сокращения умножь оставшиеся числители и знаменатели. Проверь, можно ли сократить полученную дробь.'));
 const model=mode===1?plan:{kind:'fraction-bars',fractions:[[mode===2?1:a,c]]};
 return make(`Вычисли ${text}. Сокращай множители до умножения.`,numerator,d,steps,{mode,a,c,d,left,right},model);
}
function divisionMeaning(n,mode){
 const c=2+n%8,a=1+Math.floor(n/8),b=1+Math.floor(n/40)%(c-1);
 let left=[a,c],right=[b,c],q=`Лента имеет длину ${a}/${c} м. Одна условная порция — ${b}/${c} м. Сколько таких порций составляет вся лента? Ответ может быть дробным.`;
 if(mode===1){left=[a,1];q=`Вычисли ${a} : (${b}/${c}). Сколько долей по ${b}/${c} содержится в числе ${a}? Ответ может быть дробным.`;}
 if(mode===2){right=[b+1,1];q=`Вычисли (${a}/${c}) : ${b+1}. Раздели указанную долю на ${b+1} равных частей.`;}
 const num=left[0]*right[1],den=left[1]*right[0];
 const steps=[S('Запиши число, обратное делителю.',fraction(right[1],right[0]),'Поменяй местами числитель и знаменатель только у делителя. Целое число сначала представь дробью со знаменателем 1.'),S('Какой числитель будет у произведения до сокращения?',num,'Умножь числитель первого числа на числитель обратной дроби.'),S('Какой знаменатель будет у произведения до сокращения?',den,'Умножь знаменатель первого числа на знаменатель обратной дроби.'),S('Чему равно частное? Сократи дробь.',fraction(num,den),'Деление заменено умножением на обратное число. Для проверки умножь ответ на исходный делитель.')];
 return make(q,num,den,steps,{mode,a,b,c,left,right},mode===2?plan:{kind:'fraction-bars',fractions:[[b,c]]});
}
function decimalAlign(n,mode){
 let digits=2,A=(10+n)*10,B=10*(1+n%8)+(1+Math.floor(n/8)%9),C=0,sign=1;
 if(mode===1){A=(20+n)*10;sign=-1;}
 if(mode===2){digits=3;A=(3+Math.floor(n/10))*1000;B=(1+n%10)*100;C=11+(n*7)%79;}
 const scale=10**digits,total=A+sign*B-C,unit=digits===2?'сотых':'тысячных';
 const first=mode===2?String(A/scale):decimal(A/10,1),second=mode===2?decimal(B/100,1):decimal(B,2);
 const q=`Вычисли ${first} ${sign===1?'+':'−'} ${second}${mode===2?' − '+decimal(C,3):''}. Записывай запятую под запятой.`;
 const steps=[S(`Сколько ${unit} в одном целом?`,scale,'Каждый следующий разряд в десять раз мельче предыдущего.'),S(`Вырази ${first} в ${unit}: сколько таких долей?`,A,'Допиши справа от запятой недостающие нули. Значение числа не изменится.'),S(`Вырази ${second} в ${unit}: сколько таких долей?`,B,'Для действий нужны доли одного и того же размера.')];
 if(mode===2)steps.push(S(`Сколько ${unit} получится после первого сложения?`,A+B,'Сложи первые два числа в одинаковых долях. Затем останется вычитание третьего числа.'));
 steps.push(S(`Сколько ${unit} получится в результате?`,total,sign===-1?'Если меньшего разряда не хватает, размени один соседний разряд на десять меньших.':'Выполняй действия с целым количеством одинаковых долей.'),S('Запиши результат десятичной дробью.',decimal(total,digits),`Отдели запятой столько знаков, сколько нужно для записи ${unit}.`));
 return make(q,total,scale,steps,{mode,digits,A,B,C,sign,scale},plan,{a:decimal(total,digits)});
}
function divisorScale(n,mode){
 const b=(mode===2?11:2)+n%8,qnum=(mode===1?1:3)+Math.floor(n/8),A=b*qnum,ad=mode===0?1:2,bd=mode===2?2:1,multiplier=10**bd,remaining=ad-bd;
 const num=A*10**bd,den=b*10**ad;
 const quotient=decimal(qnum,mode===1?1:0);
 const steps=[S('На какое число нужно умножить делитель, чтобы он стал целым?',multiplier,'Посчитай знаки после запятой в делителе. Один знак требует множителя 10, два — 100.'),S('Каким станет делитель?',b,'Перенеси запятую вправо на выбранное число разрядов.'),S('Каким станет делимое после умножения на то же число?',decimal(A,remaining),'Одинаковое изменение обоих чисел сохраняет частное. При необходимости допиши нули.'),S('Выполни деление на целое число.',quotient,(mode===1&&qnum<10?'Если делимое меньше делителя, в целой части частного запиши 0 и поставь запятую. ':'Теперь делитель целый. ')+'Проверка: частное, умноженное на первоначальный делитель, должно дать первоначальное делимое.')];
 return make(`Вычисли ${decimal(A,ad)} : ${decimal(b,bd)}.`,num,den,steps,{mode,A,b,ad,bd,multiplier},plan,{a:quotient});
}
function signedSum(n,mode){
 const d=2+n%8,e=2*d,a=1+Math.floor(n/8),b=1+(n*7)%(e-1),leftSign=mode===2?1:-1,rightSign=mode===1?-1:1,left=leftSign*2*a,right=rightSign*b,total=left+right;
 const q=mode===0?`Вычисли (−${a}/${d}) + ${b}/${e}.`:mode===1?`Вычисли (−${a}/${d}) − ${b}/${e}.`:`Вычисли ${a}/${d} − (−${b}/${e}).`;
 const steps=[S('Найди наименьший общий знаменатель.',e,'Выбери наименьшее число, которое делится на оба знаменателя.'),S('Какой числитель со знаком получится у первой дроби?',left,'Умножь числитель и знаменатель на одинаковый множитель. Знак первой дроби сохраняется.'),S('Какой числитель со знаком нужно прибавить от второй дроби?',right,mode===2?'Вычесть отрицательное число — значит прибавить противоположное, положительное.':mode===1?'Вычитание положительной дроби замени прибавлением отрицательной.':'Вторая дробь прибавляется со своим знаком.'),S('Найди сумму числителей вместе со знаками.',total,'У числителей разные знаки — сравни модули; одинаковые — сложи модули и сохрани знак.'),S('Запиши результат сокращённой дробью.',fraction(total,e),'Знаменатель показывает размер общей доли и при сложении не меняется.')];
 return make(q,total,e,steps,{mode,a,b,d,e,leftSign,rightSign},plan);
}
function ratioUnits(n,mode){
 const a=1+Math.floor(n/10),b=2+n%10;
 if(mode===2){
  const unit=5+5*(n%3),total=(a+b)*unit,answer=b*unit;
  const steps=[S('Переведи общую длину в сантиметры.',total,'Один метр содержит сто сантиметров.'),S('Сколько всего равных долей в двух частях?',a+b,'Сложи оба числа отношения: они показывают количество равных долей.'),S('Сколько сантиметров приходится на одну долю?',unit,'Общую длину в сантиметрах раздели на число равных долей.'),S('Сколько сантиметров во второй части?',answer,'Умножь длину одной доли на второе число отношения.')];
  return make(`Ленту длиной ${decimal(total,2)} м разделили на части в отношении ${a}:${b}. Найди длину второй части в сантиметрах.`,answer,1,steps,{mode,a,b,unit,total},{kind:'ratio-parts',a,b,total,unit:'см'});
 }
 const factor=mode===0?10:100,first=a*factor,second=b*factor,common=gcd(first,second);
 const q=mode===0?`Длины лент ${decimal(a,1)} м и ${second} см. Найди отношение длины первой ленты к длине второй. Введи частное или дробь.`:`Масса первого пакета ${first} г, второго ${decimal(b,1)} кг. Найди отношение массы первого пакета к массе второго. Введи частное или дробь.`;
 const steps=[S(mode===0?'Переведи длину первой ленты в сантиметры.':'Переведи массу второго пакета в граммы.',mode===0?first:second,mode===0?'В одном метре сто сантиметров.':'В одном килограмме тысяча граммов.'),S('Какой наибольший общий делитель у количеств в одинаковых единицах?',common,'Ищи число, на которое оба целых количества делятся без остатка.'),S('Каков числитель отношения после сокращения?',first/common,'Первое количество делим на общий делитель.'),S('Каков знаменатель отношения после сокращения?',second/common,'Второе количество делим на тот же общий делитель.'),S('Запиши отношение частным или дробью.',fraction(first,second),'Сохраняй порядок: первое количество делим на второе. Единицы уже одинаковые.')];
 return make(q,first,second,steps,{mode,a,b,first,second,common},plan);
}
function percentProportion(n,mode){
 const whole=100*(2+Math.floor(n/10)),p=5*(1+n%10),part=whole*p/100;
 const q=mode===0?`Найди ${p}% от ${whole} рублей. Решай через пропорцию.`:mode===1?`${p}% всей суммы составляют ${part} рублей. Найди всю сумму. Решай через пропорцию.`:`Из ${whole} рублей потратили ${part} рублей. Сколько процентов суммы потрачено? Решай через пропорцию.`;
 const answer=mode===0?part:mode===1?whole:p,cross=mode===0?whole*p:part*100,divisor=mode===0?100:mode===1?p:whole;
 const equation=mode===0?`x/${whole} = ${p}/100`:mode===1?`${part}/x = ${p}/100`:`${part}/${whole} = x/100`;
 const steps=[S('Сколько процентов соответствует всей сумме?',100,'Целое принимаем за сто процентов, даже если по условию оно неизвестно.'),S(`Пропорция: ${equation}. Найди произведение двух известных членов, стоящих крест-накрест.`,cross,'В верной пропорции произведения крайних и средних членов равны.'),S('На какое известное число нужно разделить это произведение, чтобы найти x?',divisor,'После перемножения крест-накрест x умножается на одно известное число. Чтобы найти x, раздели на этот множитель.'),S(mode===2?'Сколько процентов составляет часть?':'Сколько рублей получилось?',answer,mode===1?'Проверка: подставь найденное целое в исходную пропорцию.':'Проверь порядок величин: часть меньше целого, поэтому её процент меньше ста.')];
 const rows=[['Вся сумма',mode===1?'x':whole,'100%'],['Часть',mode===0?'x':part,mode===2?'x%':p+'%']];
 return make(q,answer,1,steps,{mode,whole,p,part,cross,divisor},mode===0?{kind:'percent-base',whole,p}:plan,{display:{kind:'table',headers:['Величина','Рубли','Проценты'],rows}});
}
const builders=[mixedBorrow,productCancel,divisionMeaning,decimalAlign,divisorScale,signedSum,ratioUnits,percentProportion];
D.meta.push(...families.map(m=>({...m,pos:null,trainingOnly:true,grade7:true,subject:'foundation',expanded:true})));
D.task=function(id,seed=1){
 if(!ids.has(id))return previous(id,seed);
 const normalized=((Math.trunc(seed)%count)+count)%count,mode=Math.floor(normalized/variantsPerMode),n=normalized%variantsPerMode;
 return {...builders[families.findIndex(m=>m.id===id)](n,mode),id,seed,pos:null,grade7:true,subject:'foundation'};
};
D.grade7Foundations={families,count,variantsPerMode,modes:3,has:id=>ids.has(id)};
if(typeof module!=='undefined')module.exports=D;
})(typeof window==='undefined'?globalThis:window);

/* Original pre-grade-seven applications, building on the Vilenkin 5/6 task patterns. */
(function(root){'use strict';
const D=root.PathData,previous=D.task,previousCorrect=D.correct,fraction=D.practice.fraction;
const variantsPerMode=120,count=variantsPerMode*3;
const families=[
 {id:'pre7-fraction-line',title:'Дроби на числовом луче',gap:'fractions',idea:'Сначала найди размер одного деления. Координата отсчитывается от нуля, а расстояние между точками — от одной точки до другой.'},
 {id:'pre7-equivalent-fractions',title:'Равные дроби и сокращение',gap:'fractions',idea:'Умножай или дели числитель и знаменатель на одно и то же ненулевое число. Размер выбранной части целого сохранится.'},
 {id:'pre7-fraction-compare',title:'Сравниваем обыкновенные дроби',gap:'fractions',idea:'Сравнивай доли одного целого. При одинаковом знаменателе сравни числители; при разных знаменателях сначала получи доли одного размера.'},
 {id:'pre7-fraction-part-whole',title:'Доля, часть и целое',gap:'fractions',idea:'Знаменатель показывает число равных долей в целом, числитель — число взятых долей. Начинай с количества в одной доле.'},
 {id:'pre7-decimal-compare',title:'Сравниваем десятичные дроби',gap:'decimals',idea:'Сравнивай разряды слева направо. Справа после запятой можно дописать нули: значение числа от этого не меняется.'},
 {id:'pre7-mass-capacity',title:'Масса и вместимость',gap:'units',idea:'Для действия переведи величины в одинаковые единицы. В килограмме 1000 граммов, в литре 1000 миллилитров.'},
 {id:'pre7-ruler-length',title:'Измеряем длину по линейке',gap:'units',idea:'Длина отрезка — разность отметок его концов. Отметка правого конца равна длине лишь тогда, когда левый конец находится у нуля.'},
 {id:'pre7-perimeter',title:'Периметр: обходим границу',gap:'units',idea:'Периметр — сумма длин всех сторон границы. Каждую сторону посчитай один раз, не добавляя внутренние линии.'},
 {id:'pre7-grid-area',title:'Площадь по клеткам',gap:'units',idea:'Площадь показывает, сколько единичных квадратов покрывает фигуру. Сначала посчитай клетки, затем учти площадь одной клетки.'}
];
const ids=new Set(families.map(m=>m.id));
const S=(q,a,why)=>({q,a,why,strict:true});
const E=(id,label,description)=>({id,label,description});
const signs=['<','=','>'],signIndex=(a,b)=>a<b?1:a===b?2:3;
const choice=(q,a,why)=>({...S(q,a,why),choices:signs.map((label,i)=>({value:String(i+1),label}))});
const gcd=(a,b)=>b?gcd(b,a%b):a;
const plural=(n,one,few,many)=>n%100>=11&&n%100<=14?many:n%10===1?one:n%10>=2&&n%10<=4?few:many;
function decimal(n,digits){const s=String(n).padStart(digits+1,'0');return digits?s.slice(0,-digits)+','+s.slice(-digits):s;}
function make(q,a,steps,params,diagram,elements,extra={}){
 const exact=typeof a==='string'?a:String(a);
 return {q,a,answer:D.parse(exact),answerExact:exact,steps,params,model:{kind:'pre7-lab',diagram:{description:q,...diagram},elements},strict:true,...extra};
}
function line(n,mode){
 const d=2+n%9,base=Math.floor(n/9),p=1+Math.floor(n/18)%(d-1),left=mode===2?n%(d-1):0,right=mode===2?left+1+Math.floor(n/9)%(d-left):p;
 const diagram={type:'line',min:base,max:base+1,intervals:d,unit:'',points:mode===1?[{id:'A',value:base,label:'A'},{id:'B',value:base+1,label:'B'}]:mode===0?[{id:'origin',value:base,label:String(base)},{id:'A',value:base+p/d,label:'A'}]:[{id:'A',value:base+left/d,label:'A'},{id:'B',value:base+right/d,label:'B'}]};
 let q,a,steps;
 if(mode===0){a=fraction(base*d+p,d);q=`Отрезок числового луча от ${base} до ${base+1} разделён на ${d} ${plural(d,'равную часть','равные части','равных частей')}. A находится на ${p}-м делении справа от ${base}. Найди координату A.`;steps=[S('На сколько равных частей разделена одна единица?',d,'Считай промежутки между рисками, а не сами риски.'),S('Какому числу равно одно деление?',fraction(1,d),'Длина единичного отрезка равна 1. Раздели её на число равных промежутков.'),S(`Сколько долей 1/${d} содержится в числе ${base}?`,base*d,'Каждая целая единица содержит столько долей, сколько показывает знаменатель.'),S('Запиши координату A дробью.',a,'К долям в целой части прибавь число шагов вправо; знаменатель сохрани.')];}
 else if(mode===1){a=fraction(1,d);q=`На числовом луче A = ${base}, B = ${base+1}. Между A и B — ${d} ${plural(d,'равный промежуток','равных промежутка','равных промежутков')}. Какова цена одного деления?`;steps=[S('Какова длина всего отрезка AB?',1,'Вычти координату A из координаты B.'),S('На сколько промежутков разделён AB?',d,'Между двумя соседними рисками находится один промежуток.'),S('Какова цена одного деления?',a,'Раздели длину AB на число равных промежутков.')];}
 else{a=fraction(right-left,d);q=`На числовом луче A = ${fraction(base*d+left,d)}, B = ${fraction(base*d+right,d)}. Между соседними целыми числами — ${d} ${plural(d,'равное деление','равных деления','равных делений')}. Найди расстояние AB.`;steps=[S('Сколько промежутков между A и B?',right-left,'Посчитай шаги от A до B. Начальные шаги от нуля до A не входят в длину AB.'),S('Какова длина одного такого промежутка?',fraction(1,d),'Единица разделена на одинаковые доли.'),S('Найди расстояние AB.',a,'Умножь число промежутков на длину одного. То же получится при вычитании координат.')];}
 const elements=diagram.points.map(v=>E(v.id,`Отметка ${v.label}`,v.id==='origin'?`Начало показанного участка имеет координату ${base}.`:mode===1?`Точка ${v.id} имеет координату ${v.value}.`:`Точка ${v.id} находится на показанной риске. Считай промежутки от нужного начала.`));
 return make(q,a,steps,{mode,d,base,p,left,right},diagram,elements);
}
const equivalentPool=[];
for(let d=2;d<=10;d++)for(let p=1;p<d;p++)if(gcd(p,d)===1)for(let k=2;k*d<=20;k++)equivalentPool.push([p,d,k]);
function equivalent(n,mode){
 const [p,d,k]=equivalentPool[(n*17)%equivalentPool.length],P=p*k,Q=d*k;
 let q,a,steps;
 if(mode===0){q=`Заполни пропуск: ${p}/${d} = ?/${Q}. Какой числитель нужен?`;a=P;steps=[S('Во сколько раз увеличен знаменатель?',k,'Новый знаменатель раздели на прежний.'),S('На какое число нужно умножить числитель?',k,'Числитель и знаменатель меняются в одинаковое число раз.'),S('Какой числитель получится?',P,'Умножь прежний числитель на дополнительный множитель.')];}
 else if(mode===1){q=`Сократи дробь ${P}/${Q} полностью. Ответ запиши обыкновенной дробью.`;a=fraction(p,d);steps=[S('Найди наибольший общий делитель числителя и знаменателя.',k,'Нужно одно число, которое делит оба числа без остатка.'),S('Какой числитель останется после деления?',p,'Раздели числитель на общий делитель.'),S('Какой знаменатель останется?',d,'Раздели знаменатель на тот же общий делитель.'),{...S('Запиши полностью сокращённую обыкновенную дробь.',a,'Раздели числитель и знаменатель на их наибольший общий делитель. Запиши ответ в виде числитель/знаменатель.'),answerKind:'reducedFraction'}];}
 else{q=`Заполни пропуск: ${p}/${d} = ${P}/?. Какой знаменатель нужен?`;a=Q;steps=[S('Во сколько раз увеличен числитель?',k,'Новый числитель раздели на прежний.'),S('На какое число нужно умножить знаменатель?',k,'Изменяй обе части записи одинаково.'),S('Какой знаменатель получится?',Q,'Умножь прежний знаменатель на тот же множитель.')];}
 const diagram={type:'bars',bars:[{id:'first',label:mode===1?'После сокращения':`${p}/${d}`,value:p,total:d,parts:d},{id:'second',label:mode===1?`${P}/${Q}`:'Те же доли, разделённые мельче',value:P,total:Q,parts:Q}],unit:'одного целого'};
 return make(q,a,steps,{mode,p,d,k,P,Q},diagram,[E('first','Крупные доли',`Целое разделено на ${d} ${plural(d,'равную часть','равные части','равных частей')}. Закрашенная часть не меняется.`),E('second','Мелкие доли',`Каждая крупная доля разделена ещё на ${k} ${plural(k,'равную часть','равные части','равных частей')}. Обе полоски одной длины.`)],mode===1?{answerKind:'reducedFraction'}:{});
}
function compareFractions(n,mode){
 let d=3+n%10,e=d,a=1+Math.floor(n/10)%(d-1),b=1+(n*7+Math.floor(n/10))%(d-1);
 if(mode===1){e=2+(n*3+Math.floor(n/10))%11;a=1+Math.floor(n/22)%(Math.min(d,e)-1);b=a;}
 if(mode===2){e=2+(n*3+Math.floor(n/10))%11;b=1+(n*7)%(e-1);}
 const common=d*e/gcd(d,e),A=a*common/d,B=b*common/e,index=signIndex(A,B),steps=[];
 if(mode===0)steps.push(S('Какой общий знаменатель уже есть у дробей?',d,'Одинаковые знаменатели означают одинаковый размер долей.'),S('Сколько таких долей взято в первой дроби?',a,'Это показывает числитель первой дроби.'),S('Сколько долей взято во второй дроби?',b,'При одинаковом размере долей больше та дробь, у которой их больше.'));
 else if(mode===1)steps.push(S('Какой числитель одинаков у обеих дробей?',a,'Взято одинаковое число долей.'),S('Какой знаменатель у первой дроби?',d,'Чем больше равных долей в целом, тем мельче каждая доля.'),S('Какой знаменатель у второй дроби?',e,'При равном положительном числителе больше дробь с меньшим знаменателем. Равные знаменатели дают равные дроби.'));
 else steps.push(S('Найди наименьший общий знаменатель.',common,'Найди наименьшее общее кратное знаменателей.'),S('Какой числитель получится у первой дроби?',A,'Умножь числитель на дополнительный множитель.'),S('Какой числитель получится у второй дроби?',B,'Теперь обе записи показывают доли одного размера.'));
 steps.push(choice('Выбери знак между первой и второй дробью.',index,'Знак раскрывается в сторону большего числа. Если значения совпадают, выбери равенство.'));
 return make(`Сравни ${a}/${d} и ${b}/${e}. Выбери знак между ними.`,index,steps,{mode,a,b,d,e,common},{type:'bars',bars:[{id:'first',label:`${a}/${d}`,value:a,total:d,parts:d},{id:'second',label:`${b}/${e}`,value:b,total:e,parts:e}],unit:'одного целого'},[E('first','Первая дробь',`Выбрано ${a} долей из ${d}.`),E('second','Вторая дробь',`Выбрано ${b} долей из ${e}. Обе полоски изображают целые одного размера.`)],{choices:signs.map((label,i)=>({value:String(i+1),label}))});
}
function partWhole(n,mode){
 const d=2+n%9,p=1+Math.floor(n/9)%(d-1),unit=2+Math.floor(n/9),whole=d*unit,part=p*unit,answer=mode===0?part:mode===1?whole:whole-part;
 const q=mode===0?`В коробке ${whole} ${plural(whole,'карандаш','карандаша','карандашей')}. ${p}/${d} всех карандашей — цветные. Сколько цветных карандашей?`:mode===1?`${p}/${d} всех карандашей составляют ${part} ${plural(part,'карандаш','карандаша','карандашей')}. Сколько карандашей в коробке?`:`В коробке ${whole} ${plural(whole,'карандаш','карандаша','карандашей')}. Взяли ${p}/${d} всех карандашей. Сколько карандашей осталось?`;
 const steps=mode===1?[S('Сколько равных долей соответствует известному количеству?',p,'Известное количество составляет числитель долей, а не всё целое.'),S('Сколько карандашей в одной доле?',unit,'Раздели известное количество на число известных долей.'),S('Сколько карандашей в целом?',whole,'Умножь количество в одной доле на знаменатель.')]:[S('На сколько равных долей мысленно делим весь запас?',d,'Количество равных долей в целом показывает знаменатель.'),S('Сколько карандашей в одной доле?',unit,'Раздели весь запас на число равных долей.'),S(mode===2?'Сколько карандашей взяли?':'Сколько цветных карандашей?',part,'Умножь количество в одной доле на числитель.')];
 if(mode===2)steps.push(S('Сколько карандашей осталось?',answer,'Из первоначального запаса вычти взятое количество.'));
 return make(q,answer,steps,{mode,d,p,unit,whole,part},{type:'bars',bars:[{id:'whole',label:mode===1?'Весь запас — ?':`Весь запас — ${whole}`,value:d,total:d,parts:d},{id:'part',label:`Выбранная часть: ${p}/${d}`,value:p,total:d,parts:d}],unit:'запаса'},[E('whole','Всё количество',`Число равных долей в целом — ${d}. ${mode===1?'Ищем весь запас.':'Общее количество дано в условии.'}`),E('part','Известная доля',`Выбрано ${p} из ${d} равных долей. ${mode===1?'Именно этой части соответствует известное количество.':'Количество в ней нужно вычислить.'}`)]);
}
function compareDecimals(n,mode){
 const whole=Math.floor(n/10),tenth=1+n%9;
 let x=whole*1000+tenth*100,y=whole*1000+(1+(n*13)%98)*10,left=decimal(x/100,1),right=decimal(y/10,2);
 if(mode===1){x=whole*1000+(1+n%99)*10;y=x;left=decimal(x/10,2);right=decimal(y,3);}
 if(mode===2){x=(whole+1)*1000+(n%5)*10;y=whole*1000+(50+n%50)*10;left=decimal(x/10,2);right=decimal(y/10,2);if(n%2)[x,y,left,right]=[y,x,right,left];}
 const index=signIndex(x,y),digits=v=>[Math.floor(v/1000),Math.floor(v/100)%10,Math.floor(v/10)%10,v%10];
 const steps=[S('Сколько целых в первом числе?',Math.floor(x/1000),'Целая часть стоит слева от запятой.'),S('Сколько целых во втором числе?',Math.floor(y/1000),'Сначала сравни целые части. Младшие разряды не могут перевесить различие целых.')];
 if(mode!==2)steps.push(S('Сколько тысячных в первом числе?',x,'Дополни дробную часть нулями до трёх знаков. Затем вырази всё число в тысячных.'),S('Сколько тысячных во втором числе?',y,'Теперь сравни целые количества одинаковых долей.'));
 steps.push(choice(`Выбери знак: ${left} … ${right}.`,index,mode===1?'Дописывание нуля справа в дробной части сохраняет число.':'Сравнивай слева направо до первого различающегося разряда.'));
 const diagram={type:'table',headers:['Число','Целые','Десятые','Сотые','Тысячные'],rows:[[left,...digits(x)],[right,...digits(y)]],rowIds:['first','second']};
 return make(`Сравни ${left} и ${right}. Выбери знак между ними.`,index,steps,{mode,x,y,left,right},diagram,[E('first','Первое число','Разряды первой строки: слева целые, затем десятые, сотые и тысячные.'),E('second','Второе число','Сравни одинаковые разряды в двух строках. Нули после последней цифры дробной части не меняют число.')],{choices:signs.map((label,i)=>({value:String(i+1),label}))});
}
function massCapacity(n,mode){
 const whole=1+Math.floor(n/10),tail=25+25*(n%10),total=whole*1000+tail;
 let q,a,steps,headers,rows;
 if(mode===0){q=`Вырази ${whole} кг ${tail} г в граммах.`;a=total;steps=[S('Сколько граммов в одном килограмме?',1000,'При переходе к граммам единица становится меньше.'),S(`Переведи ${whole} кг в граммы.`,whole*1000,'Умножь число килограммов на 1000.'),S('Сколько граммов всего?',total,'К переведённым килограммам прибавь оставшиеся граммы.')];headers=['Часть массы','Дано'];rows=[['Килограммы',`${whole} кг`],['Граммы',`${tail} г`]];}
 else if(mode===1){q=`В кувшине ${whole} л ${tail} мл воды. Вырази весь объём в миллилитрах.`;a=total;steps=[S('Сколько миллилитров в одном литре?',1000,'Литр содержит тысячу миллилитров.'),S(`Переведи ${whole} л в миллилитры.`,whole*1000,'Переведи только литры в миллилитры.'),S('Сколько миллилитров всего?',total,'Добавь миллилитры, уже указанные в условии.')];headers=['Часть объёма','Дано'];rows=[['Литры',`${whole} л`],['Миллилитры',`${tail} мл`]];}
 else{const smaller=total+25*((n%3)-1),bigUnit=n%2?'л':'кг',smallUnit=n%2?'мл':'г';q=`Сравни ${whole} ${bigUnit} ${tail} ${smallUnit} и ${smaller} ${smallUnit}. Выбери знак между первой и второй величиной.`;a=signIndex(total,smaller);steps=[S(`Вырази первую величину в ${smallUnit}.`,total,'Умножь крупные единицы на 1000 и прибавь мелкие.'),S(`Сколько ${smallUnit} во второй величине?`,smaller,'Вторая величина уже записана в нужных единицах.'),choice('Выбери знак между величинами.',a,'После перевода в одинаковые единицы сравни два целых числа.')];headers=['Величина','Дано'];rows=[['Первая',`${whole} ${bigUnit} ${tail} ${smallUnit}`],['Вторая',`${smaller} ${smallUnit}`]];return make(q,a,steps,{mode,whole,tail,total,smaller,bigUnit,smallUnit},{type:'table',headers,rows,rowIds:['large','small']},[E('large','Первая величина','Переведи крупные единицы в мелкие и сложи части.'),E('small','Вторая величина','Проверь, что теперь обе величины имеют одинаковые единицы.')],{choices:signs.map((label,i)=>({value:String(i+1),label}))});}
 return make(q,a,steps,{mode,whole,tail,total},{type:'table',headers,rows,rowIds:['large','small']},[E('large','Крупная единица','Одну крупную единицу заменяем тысячей соответствующих мелких единиц.'),E('small','Мелкая единица','Эта часть уже выражена в единицах ответа; её нужно прибавить.')]);
}
function ruler(n,mode){
 const start=1+n%10,length=1+Math.floor(n/10),end=start+length;
 let q,a,steps,diagram;
 if(mode===1){a=decimal(length,1);q=`Концы отрезка на линейке находятся на отметках ${start} мм и ${end} мм. Найди длину в сантиметрах.`;steps=[S('Какую начальную отметку вычитаем?',start,'Отрезок начинается не от нуля.'),S('Какова длина отрезка в миллиметрах?',length,'Из конечной отметки вычти начальную.'),S('Сколько миллиметров в одном сантиметре?',10,'Для перевода миллиметров в сантиметры делим на 10.'),S('Какова длина в сантиметрах?',a,'Запиши точное число, при необходимости с запятой.')];diagram={type:'line',min:start-1,max:end+1,intervals:length+2,points:[{id:'A',value:start,label:'A'},{id:'B',value:end,label:'B'}],unit:'мм'};}
 else if(mode===2){a=end;q=`Левый конец отрезка лежит на отметке ${start} см. Длина отрезка ${length} см. На какой отметке будет его правый конец?`;steps=[S('От какой отметки начинаем?',start,'Начало отрезка нужно учесть отдельно.'),S('На сколько сантиметров движемся вправо?',length,'Это длина отрезка.'),S('Какова отметка правого конца?',end,'К начальной отметке прибавь длину.')];diagram={type:'line',min:start-1,max:end+1,intervals:length+2,points:[{id:'A',value:start,label:'A'},{id:'B',value:end,label:'B — ?'}],unit:'см'};}
 else{a=length;q=`Концы отрезка на линейке находятся на отметках ${start} см и ${end} см. Найди длину отрезка в сантиметрах.`;steps=[S('Какая отметка у левого конца?',start,'Отметка левого конца может быть больше нуля.'),S('Какая отметка у правого конца?',end,'Отметка показывает положение конца, а не готовую длину.'),S('Какова длина отрезка?',length,'Вычти начальную отметку из конечной.')];diagram={type:'line',min:start-1,max:end+1,intervals:length+2,points:[{id:'A',value:start,label:'A'},{id:'B',value:end,label:'B'}],unit:'см'};}
 return make(q,a,steps,{mode,start,length,end},diagram,[E('A','Левый конец','Начальная отметка задаёт положение левого конца.'),E('B','Правый конец',mode===2?'Ищем, куда попадём, отложив длину вправо от начала.':'Длина — разность конечной и начальной отметок.')]);
}
function perimeter(n,mode){
 const a=3+n%10,b=2+Math.floor(n/10),c=a+b-1,perimeter=mode===1?a+b+c:2*(a+b);
 const sides=mode===1?[a,b,c]:[a,b,a,b];let q,answer,steps,labels;
 if(mode===0){q=`У прямоугольника длина ${a} см, ширина ${b} см. Найди периметр в сантиметрах.`;answer=perimeter;labels=sides.map(x=>x+' см');steps=[S('Сколько сторон у прямоугольника?',4,'Обходи всю границу и считай каждую сторону один раз.'),S('Какова сумма длины и ширины?',a+b,'Эти две длины повторяются на противоположных сторонах.'),S('Чему равен периметр?',answer,'Удвоенная сумма длины и ширины охватывает все четыре стороны.')];}
 else if(mode===1){q=`Стороны треугольника равны ${a} см, ${b} см и ${c} см. Найди периметр.`;answer=perimeter;labels=sides.map(x=>x+' см');steps=[S('Сколько сторон нужно сложить?',3,'Периметр проходит по трём сторонам треугольника.'),S('Какова сумма первых двух сторон?',a+b,'Складывай длины в одинаковых единицах.'),S('Чему равен периметр?',answer,'Прибавь длину третьей стороны. Каждая сторона учтена один раз.')];}
 else{q=`Периметр прямоугольника ${perimeter} см, длина ${a} см. Найди ширину.`;answer=b;labels=[a+' см','?',a+' см','?'];steps=[S('Чему равна половина периметра?',a+b,'Половина периметра равна сумме длины и ширины.'),S('Какую известную длину вычтем из полупериметра?',a,'Длина уже известна. Оставшаяся часть суммы — ширина.'),S('Чему равна ширина?',b,'Вычти длину из половины периметра. Проверь, что удвоенная сумма сторон даёт исходный периметр.')];}
 return make(q,answer,steps,{mode,a,b,c,perimeter},{type:'boundary',sides,rectangle:mode!==1,labels,unit:'см',description:'Чертёж схематический: длины определяй по условию, а не измерением рисунка. '+q},sides.map((v,i)=>E('side-'+i,`Сторона ${i+1}`,mode===2&&i%2?'Неизвестная ширина. Противоположные стороны прямоугольника равны.':`Длина этой стороны ${v} см. При обходе границы учитываем её один раз.`)));
}
function area(n,mode){
 const cols=3+n%10,rows=2+Math.floor(n/10)%9,w=1+n%(cols-1),h=1+Math.floor(n/10)%(rows-1),side=2+n%3;
 const cells=cols*rows-(mode===1?w*h:0),answer=cells*(mode===2?side*side:1),diagram={type:'grid',cols,rows,unit:`Сторона клетки ${mode===2?side:1} см`,...(mode===1?{cutout:{x:cols-w,y:0,w,h}}:{})};
 let q,steps;
 if(mode===0){q=`В прямоугольнике ${rows} ${plural(rows,'ряд','ряда','рядов')}, по ${cols} ${plural(cols,'клетке','клетки','клеток')} в каждом. Сторона клетки 1 см. Найди площадь в квадратных сантиметрах.`;steps=[S('Сколько клеток в одном ряду?',cols,'Считай квадраты внутри фигуры, а не линии сетки.'),S('Сколько рядов?',rows,'В каждом ряду одинаковое количество клеток.'),S('Какова площадь прямоугольника в см²?',answer,'Каждая клетка площадью 1 см². Умножь число клеток в ряду на число рядов.')];}
 else if(mode===1){q=`Из прямоугольника ${cols} × ${rows} клеток вырезали в углу прямоугольник ${w} × ${h} клеток. Сторона клетки 1 см. Найди площадь оставшейся фигуры в см².`;steps=[S('Какова площадь целого прямоугольника до вырезания?',cols*rows,'Умножь число столбцов на число рядов большого прямоугольника.'),S('Сколько клеток вырезали?',w*h,'Вычисли площадь прямоугольного выреза.'),S('Какова оставшаяся площадь в см²?',answer,'Вырезанные клетки больше не входят в фигуру. Вычти их число из первоначальной площади.')];}
 else{q=`Прямоугольник занимает ${cols} × ${rows} клеток. Сторона каждой клетки ${side} см. Найди площадь прямоугольника в см².`;steps=[S('Сколько клеток занимает прямоугольник?',cells,'Умножь число столбцов на число рядов.'),S('Какова площадь одной клетки в см²?',side*side,'Клетка — квадрат. Её площадь равна произведению стороны на сторону.'),S('Какова площадь всего прямоугольника в см²?',answer,'Умножь количество клеток на площадь одной. Нельзя умножать только на сторону клетки.')];}
 const elements=[E('row-0','Первый ряд',mode===1?'В этом ряду виден угловой вырез. Учитывай только оставшиеся клетки.':`В ряду ${cols} ${plural(cols,'клетка','клетки','клеток')}.`),E('row-'+(rows-1),'Последний ряд',`Всего ${rows} ${plural(rows,'ряд','ряда','рядов')}. ${mode===2?`Каждая клетка имеет сторону ${side} см.`:'Сторона каждой клетки 1 см.'}`)];
 if(mode===1)elements.push(E('cutout','Вырезанный угол',`Удалённый прямоугольник имеет ${w} ${plural(w,'столбец','столбца','столбцов')} и ${h} ${plural(h,'ряд','ряда','рядов')}. Его клетки исключены из площади.`));
 return make(q,answer,steps,{mode,cols,rows,w,h,side,cells},diagram,elements);
}
const builders=[line,equivalent,compareFractions,partWhole,compareDecimals,massCapacity,ruler,perimeter,area];
D.meta.push(...families.map(m=>({...m,pos:null,trainingOnly:true,grade7:true,pre7:true,subject:'foundation',expanded:true})));
D.task=function(id,seed=1){
 if(!ids.has(id))return previous(id,seed);
 const value=Number(seed),normalized=((Math.trunc(Number.isFinite(value)?value:0)%count)+count)%count,mode=Math.floor(normalized/variantsPerMode),n=normalized%variantsPerMode;
 return {...builders[families.findIndex(m=>m.id===id)](n,mode),id,seed,pos:null,trainingOnly:true,grade7:true,pre7:true,subject:'foundation'};
};
// Only reduction tasks require the form as well as the value. Other families
// retain their existing answer parser and grading behavior.
D.correct=function(t,value){
 if(t.answerKind!=='reducedFraction')return previousCorrect(t,value);
 const read=input=>{
  const s=String(input??'');if(s.length>256)return null;
  const m=s.match(/^\s*([−-]?\s*\d+)\s*\/\s*(\d+)\s*$/),integer=s.match(/^\s*([−-]?\s*\d+)\s*$/);
  if(!m&&!integer)return null;
  const n=BigInt((m?m[1]:integer[1]).replace(/\s/g,'').replace('−','-')),d=m?BigInt(m[2]):1n;
  return d>0n?[n,d]:null;
 };
 const got=read(value),expected=read(t.a??t.answer);if(!got||!expected)return false;
 let a=got[0]<0n?-got[0]:got[0],b=got[1];while(b){[a,b]=[b,a%b];}
 return a===1n&&got[0]*expected[1]===expected[0]*got[1];
};
D.pre7Applications={families,count,variantsPerMode,modes:3,has:id=>ids.has(id)};
if(typeof module!=='undefined')module.exports=D;
})(typeof window==='undefined'?globalThis:window);

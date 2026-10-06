/* Authored inequalities. Shared guided-lesson runtime owns input, notebook,
 * persistence and board synchronization; this file contains teaching content. */
(function(root){
'use strict';
const M=s=>'<math xmlns="http://www.w3.org/1998/Math/MathML"><mrow>'+s+'</mrow></math>';
const n=v=>'<mn>'+String(v).replace(/-/g,'−').replace('.',',')+'</mn>', x='<mi>x</mi>', o=s=>'<mo>'+s+'</mo>', row=s=>'<mrow>'+s+'</mrow>';
const par=s=>row(o('(')+s+o(')')), frac=(a,b)=>'<mfrac>'+row(a)+row(b)+'</mfrac>', pow=(a,b)=>'<msup>'+row(a)+row(b)+'</msup>', sqrt=s=>'<msqrt>'+s+'</msqrt>';
const sub=(a,b)=>b===0?a:a+o(b<0?'+':'−')+n(Math.abs(b));
const add=(a,b)=>sub(a,-b), minus=a=>sub(x,a), mul=(a,b)=>a+o('·')+b;
const log=(b,a)=>'<msub><mi mathvariant="normal">log</mi>'+row(b)+'</msub>'+par(a);
const F=s=>'<div class="formula">'+M(s)+'</div>';
const S=rows=>'<div class="formula system"><span class="system-brace" aria-hidden="true">{</span><div class="system-rows" aria-label="Система: все условия одновременно">'+rows.map(M).join('')+'</div></div>';
const textNum=v=>String(v).replace(/-/g,'−').replace('.',',');
const range=(a,b,lc=false,rc=false)=>(lc?'[':'(')+textNum(a)+'; '+textNum(b)+(rc?']':')');
const axis=(id,label,points,correct,refs=[])=>({id,label,kind:'axis',points,correct,refs});
const num=(id,label,value)=>({id,label,kind:'number',correct:String(value)});
const pick=(id,label,correct,options)=>({id,label,kind:'choice',correct,options:options.map(([id,html])=>({id,html}))});
const relation=(id,label,correct)=>pick(id,label,correct,[['lt','&lt;'],['le','≤'],['gt','&gt;'],['ge','≥']]);
const step=(title,phase,body,field,hint,record)=>({title,phase,body,fields:Array.isArray(field)?field:[field],hint,record});
const sign=(id,label,correct)=>pick(id,label,correct,[['plus','Плюс'],['minus','Минус']]);
const tokens=(points,predicate)=>{const out=[];for(let i=0;i<=points.length;i++){const v=i===0?points[0]-2:i===points.length?points.at(-1)+2:(points[i-1]+points[i])/2;if(predicate(v))out.push('s'+i);if(i<points.length&&predicate(points[i]))out.push('p'+i);}return out;};
const ref=(label,points,predicate)=>({label,tokens:tokens(points,predicate)});
function staticAxes(points,refs){
 const width=620,gap=520/(points.length+1),stops=[25,...points.map((_,i)=>50+(i+1)*gap),595];
 return '<div class="axis-block"><div class="axis-scroll"><div class="axis-stack" style="min-width:480px">'+refs.map(r=>'<p class="axis-help">'+r.label+'</p><svg viewBox="0 0 620 100" role="img" aria-label="'+r.label+'"><line x1="20" y1="45" x2="600" y2="45" stroke="#afc2b6"/>'+Array.from({length:points.length+1},(_,i)=>'<line x1="'+(stops[i]+6)+'" x2="'+(stops[i+1]-6)+'" y1="45" y2="45" stroke="'+(r.tokens.includes('s'+i)?'#176f58':'#cbd9d2')+'" stroke-width="'+(r.tokens.includes('s'+i)?6:2)+'"/>').join('')+points.map((v,i)=>'<circle cx="'+stops[i+1]+'" cy="45" r="5" stroke="#176f58" stroke-width="2" fill="'+(r.tokens.includes('p'+i)?'#176f58':'white')+'"/><text x="'+stops[i+1]+'" y="80" text-anchor="middle" font-size="17" fill="#203b34">'+textNum(v)+'</text>').join('')+'</svg>').join('')+'</div></div><p class="axis-help">Одинаковые числа стоят друг под другом. Зелёные участки не перекрываются.</p></div>';
}
const finish=(id,family,title,problem,plain,answer,points,solution,steps,domainRows,domainStepIndex,params)=>({id,family,title,problemHtml:M(problem),reportProblem:plain,reportAnswer:answer,answerHtml:M(x+o('∈')+'<mtext>'+answer+'</mtext>'),solvedDomainHtml:S(domainRows),domainStepIndex,initialDomainStepIndex:-1,steps,points,solution,params,storageKey:'mathExam.inequalities.'+id+'.v1',trainerId:'profile-inequality-'+id,apiName:'__inequalityLesson',reportName:'inequality-'+id+'.txt',reportPath:'lesson.html?lesson='+id});
const lessons=[];
function rational(a,b,i){
 const id='rational-'+i,p=[a,b],expr=frac(minus(a),minus(b)),domain=[x+o('≠')+n(b)],ans=range('−∞',a,false,true)+' ∪ '+range(b,'+∞');
 const s=[
 step('Запишем ограничение','ОДЗ','<p>На ноль делить нельзя. Поэтому знаменатель не должен равняться нулю.</p>'+S([minus(b)+o('≠')+n(0)]),num('excluded','Какое значение x исключаем?',b),'При x = '+textNum(b)+' знаменатель равен нулю.',S(domain)),
 step('Найдём ноль числителя','Граничные точки',F(minus(a)+o('=')+n(0))+'<p>Решите это уравнение. Здесь дробь равна нулю: знаменатель в этой точке не равен нулю.</p>',num('zero','При каком x числитель равен нулю?',a),'Получаем x = '+textNum(a)+'.',F(x+o('=')+n(a))+'<p>Числитель равен нулю. Эту точку можно включить при знаке ≥.</p>'),
 step('Проверим левый промежуток','Знаки дроби','<p>Возьмём число '+textNum(a-1)+', оно левее обеих точек. Подставим:</p>'+F(frac(n(-1),n(a-1-b)))+'<p>Отрицательное число делим на отрицательное.</p>',sign('sign','Какой знак у дроби?','plus'),'Минус, делённый на минус, даёт плюс.','<p>Левее '+textNum(a)+' дробь положительна.</p>'),
 step('Проверим средний промежуток','Знаки дроби','<p>Возьмём середину промежутка: x = '+textNum((a+b)/2)+'. Числитель положителен, знаменатель отрицателен:</p>'+F(n((b-a)/2)+o('>')+n(0)+o(',')+n((a-b)/2)+o('<')+n(0)),sign('sign','Плюс разделить на минус — это…','minus'),'У числителя и знаменателя разные знаки.','<p>Между граничными точками дробь отрицательна.</p>'),
 step('Проверим правый промежуток','Знаки дроби','<p>Возьмём '+textNum(b+1)+', число правее обеих точек:</p>'+F(frac(n(b+1-a),n(1)))+'<p>Оба числа положительны.</p>',sign('sign','Какой знак у дроби?','plus'),'Плюс, делённый на плюс, даёт плюс.','<p>Правее '+textNum(b)+' дробь положительна.</p>'),
 step('Отметим подходящие промежутки','Числовая прямая','<p>Требуется ≥ 0: выбираем положительные промежутки и ноль числителя. Знаменатель равным нулю быть не может.</p>',axis('sign-axis','Где дробь неотрицательна?',p,['s0','p0','s2']),'Левый луч вместе с '+textNum(a)+' и правый луч без '+textNum(b)+'.',F(x+o('∈')+'<mtext>'+ans+'</mtext>')),
 step('Проверим пересечение с ОДЗ','Ответ',S([...domain,expr+o('≥')+n(0)])+'<p>На нижней прямой оставьте общую часть двух верхних строк.</p>',axis('final','Окончательный ответ',p,['s0','p0','s2'],[ref('ОДЗ: x ≠ '+textNum(b),p,v=>v!==b),{label:'Решение по знакам',tokens:['s0','p0','s2']}]),'Точка '+textNum(a)+' входит, точка '+textNum(b)+' не входит. Остальные выбранные участки сохраняются.',F(x+o('∈')+'<mtext>'+ans+'</mtext>'))
 ];
 lessons.push(finish(id,'rational','Дробь: разные знаки',expr+o('≥')+n(0),'(x−('+a+'))/(x−('+b+')) ≥ 0',ans,p,['s0','p0','s2'],s,domain,0,{a,b}));
}
function repeated(a,b,i){
 const id='repeated-'+i,p=[b,a],expr=frac(pow(par(minus(a)),n(2)),minus(b)),domain=[x+o('≠')+n(b)],ans=range('−∞',b)+' ∪ {'+textNum(a)+'}';
 const s=[
 step('Исключим ноль знаменателя','ОДЗ','<p>Знаменатель не может быть нулём.</p>'+S([minus(b)+o('≠')+n(0)]),num('excluded','Какое x запрещено?',b),'Решите x − ('+textNum(b)+') = 0: прибавьте '+textNum(b)+' к обеим частям.',S(domain)),
 step('Найдём ноль квадрата','Числитель',F(pow(par(minus(a)),n(2))+o('=')+n(0))+'<p>Квадрат равен нулю, только когда выражение в скобках равно нулю.</p>',num('zero','При каком x квадрат равен нулю?',a),'x − '+textNum(a)+' = 0.',F(x+o('=')+n(a))),
 step('Поймём знак квадрата','Знаки','<p>В остальных точках квадрат положителен. Например, квадрат −1 равен 1, квадрат 1 тоже равен 1.</p>',pick('square','Меняется ли знак квадрата при переходе через его ноль?','no',[['yes','Да, становится отрицательным'],['no','Нет: с обеих сторон плюс']]),'Квадрат действительного числа не бывает отрицательным.','<p>У повторяющегося корня знак квадрата не меняется.</p>'),
 step('Найдём отрицательные значения дроби','Знаки','<p>Положительный числитель даёт отрицательную дробь, если знаменатель отрицателен:</p>'+F(minus(b)+o('<')+n(0)),axis('negative','Где знаменатель отрицателен?',[b],['s0']),'Берём x < '+textNum(b)+'. Само '+textNum(b)+' запрещено.',F(x+o('<')+n(b))),
 step('Добавим отдельно ноль дроби','Граничная точка','<p>Знак ≤ разрешает ноль. При x = '+textNum(a)+' числитель равен 0, а знаменатель равен '+textNum(a-b)+'.</p>'+F(frac(n(0),n(a-b))+o('=')+n(0)),pick('point','Включаем ли x = '+textNum(a)+' в ответ?','yes',[['yes','Да: дробь равна нулю'],['no','Нет: подходит только луч']]),'0 ≤ 0 — верно. Знаменатель здесь не равен нулю.',F(x+o('=')+n(a))+'<p>Это отдельная подходящая точка.</p>'),
 step('Соберём ответ на прямой','Ответ',S([...domain,expr+o('≤')+n(0)])+'<p>Берём отрицательный луч и отдельный ноль. Не закрашивайте промежуток между ними.</p>',axis('final','Луч и отдельная точка',p,['s0','p1'],[ref('ОДЗ: x ≠ '+textNum(b),p,v=>v!==b),{label:'Дробь отрицательна или равна нулю',tokens:['s0','p1']}]),'Выберите луч левее '+textNum(b)+' и нажмите на число '+textNum(a)+'. Между ними ничего не выбирайте.',F(x+o('∈')+'<mtext>'+ans+'</mtext>'))
 ];
 lessons.push(finish(id,'repeated','Квадрат в числителе',expr+o('≤')+n(0),'(x−('+a+'))²/(x−('+b+')) ≤ 0',ans,p,['s0','p1'],s,domain,0,{a,b}));
}
function exponential(base,l,r,i){
 const id='exponential-'+i,low=Math.min(base**l,base**r),high=Math.max(base**l,base**r),v=pow(n(base),x),v2=pow(n(base),n(2)+x),expr=v2+o('−')+n(low+high)+v+o('+')+n(low*high),factors=par(v+o('−')+n(low))+par(v+o('−')+n(high));
 const increasing=base>1,p=[l,r],domain=[v+o('>')+n(0)],ans=range(l,r,true,true);
 const s=[
 step('Отметим свойство степени','Подготовка','<p>Основание '+textNum(base)+' положительное и не равно 1. Поэтому степень определена при любом x и всегда положительна.</p>',pick('positive','Может ли '+textNum(base)+'ˣ равняться нулю?','no',[['no','Нет, всегда больше нуля'],['yes','Да, при x = 0']]),'При x = 0 степень равна 1, а не 0.',S(domain)),
 step('Разложим выражение на множители','Преобразование','<p>Первое слагаемое — квадрат '+M(v)+'. Ищем два числа: их сумма равна '+textNum(low+high)+', произведение — '+textNum(low*high)+'.</p><p>Проверим числа '+textNum(low)+' и '+textNum(high)+'.</p>',[num('sum','Их сумма',low+high),num('product','Их произведение',low*high)],'Сложите числа, затем перемножьте.',F(expr+o('=')+factors)),
 step('Выберем значения между корнями','Знаки произведения',F(factors+o('≤')+n(0))+'<p>Когда степень между '+textNum(low)+' и '+textNum(high)+', первая скобка неотрицательна, вторая неположительна. Их произведение ≤ 0. Вне этого промежутка обе скобки одного знака, произведение положительно.</p>',pick('between','Какую систему получаем?','yes',[['yes',S([v+o('≥')+n(low),v+o('≤')+n(high)])],['no',S([v+o('≤')+n(low),v+o('≥')+n(high)])]]),'Нужно значение степени от меньшего корня до большего, включая оба конца.',S([v+o('≥')+n(low),v+o('≤')+n(high)])),
 step('Запишем числа как степени','Одинаковые основания','<p>Вычислите две степени:</p>'+F(pow(n(base),n(l))+o('=')+'<mtext>?</mtext>')+F(pow(n(base),n(r))+o('=')+'<mtext>?</mtext>'),[num('left',textNum(base)+' в степени '+l,base**l),num('right',textNum(base)+' в степени '+r,base**r)],'Умножьте основание само на себя нужное число раз.',F(pow(n(base),n(l))+o('=')+n(base**l))+F(pow(n(base),n(r))+o('=')+n(base**r))),
 step('Учтём основание','Переход к x','<p>'+(increasing?'Основание больше 1. Большему показателю соответствует большая степень.':'Основание между 0 и 1. При увеличении показателя степень уменьшается.')+'</p>'+S([v+o('≥')+pow(n(base),n(increasing?l:r)),v+o('≤')+pow(n(base),n(increasing?r:l))])+'<p>При сравнении показателей знак…</p>',pick('direction','Выберите правило',increasing?'same':'reverse',[['same','Сохраняется'],['reverse','Меняется на противоположный']]),increasing?'Основание больше 1: сохраняем знак.':'Дробное основание меньше 1: меняем знак.',S([x+o(increasing?'≥':'≤')+n(increasing?l:r),x+o(increasing?'≤':'≥')+n(increasing?r:l)])),
 step('Отметим нижнюю границу','Числовая прямая','<p>Из полученной системы берём условие:</p>'+F(x+o('≥')+n(l)),axis('lower','Нижняя граница: x ≥ '+l,p,['p0','s1','p1','s2']),'Выберите всё от '+l+' вправо. Обе отмеченные точки этого луча включены.',F(x+o('≥')+n(l))),
 step('Пересечём строки системы','Ответ',S([x+o('≥')+n(l),x+o('≤')+n(r)])+'<p>Оставьте общую часть двух лучей.</p>',axis('final','Общая часть',p,['p0','s1','p1'],[ref('x ≥ '+l,p,z=>z>=l),ref('x ≤ '+r,p,z=>z<=r)]),'Между '+l+' и '+r+', включая оба конца.',F(x+o('∈')+'<mtext>'+ans+'</mtext>'))
 ];
 lessons.push(finish(id,'exponential','Степени с одним основанием',expr+o('≤')+n(0),base+'^(2x) − '+(low+high)+'·'+base+'^x + '+low*high+' ≤ 0',ans,p,['p0','s1','p1'],s,domain,0,{base,l,r}));
}
function fixedLog(base,a,k,i){
 const id='fixed-log-'+i,q=base**k,bound=a+q,increasing=base>1,arg=minus(a),expr=log(n(base),arg),p=[a,bound],domain=[x+o('>')+n(a)],sol=increasing?['s1','p1']:['p1','s2'],ans=increasing?range(a,bound,false,true):range(bound,'+∞',true,false);
 const s=[
 step('Соберём ОДЗ','ОДЗ','<p>Логарифм берут только от положительного числа. Его основание должно быть положительным и не равным 1.</p>'+S([n(base)+o('>')+n(0),n(base)+o('≠')+n(1),arg+o('>')+n(0)])+'<p>Первые две строки уже выполнены. Решим третью.</p>',num('domain','x должен быть больше какого числа?',a),'Прибавьте '+textNum(a)+' к обеим частям неравенства: получится x > '+textNum(a)+'.',S(domain)),
 step('Запишем правую часть логарифмом','Преобразование','<p>По определению логарифма:</p>'+F(n(k)+o('=')+log(n(base),pow(n(base),n(k))))+'<p>Вычислите аргумент справа.</p>',num('power','Чему равна степень?',q),k<0?'Отрицательная степень переворачивает основание: (1/2)⁻² = 2² = 4.':'Умножьте основание само на себя '+k+' раз.',F(expr+o('≤')+log(n(base),n(q)))),
 step('Сравним аргументы','Знак неравенства','<p>'+(increasing?'Основание больше 1: логарифм возрастает.':'Основание между 0 и 1: логарифм убывает.')+'</p><p>Какой знак будет между аргументами?</p>'+F(arg+'<mtext> ? </mtext>'+n(q)),relation('relation','Выберите знак',increasing?'le':'ge'),increasing?'При основании больше 1 знак сохраняется.':'При основании меньше 1 знак меняется с ≤ на ≥.',F(arg+o(increasing?'≤':'≥')+n(q))),
 step('Решим линейное неравенство','Находим границу',F(arg+o(increasing?'≤':'≥')+n(q))+'<p>Прибавим '+textNum(a)+' к обеим частям. Знак не меняется.</p>',num('boundary','Какая граница получится для x?',bound),textNum(q)+' + ('+textNum(a)+') = '+textNum(bound)+'.',F(x+o(increasing?'≤':'≥')+n(bound))),
 step('Покажем ОДЗ на прямой','Числовая прямая',S([...domain,x+o(increasing?'≤':'≥')+n(bound)])+'<p>Сначала отметьте только первую строку.</p>',axis('domain-axis','ОДЗ: x > '+textNum(a),p,['s1','p1','s2']),'Всё правее '+textNum(a)+'. Точка '+textNum(bound)+' не запрещена ОДЗ, включите её.',S(domain)),
 step('Пересечём решение с ОДЗ','Ответ',S([...domain,x+o(increasing?'≤':'≥')+n(bound)])+'<p>Теперь оставьте общую часть.</p>',axis('final','Окончательный ответ',p,sol,[ref('ОДЗ: x > '+textNum(a),p,z=>z>a),ref('x '+(increasing?'≤':'≥')+' '+textNum(bound),p,z=>increasing?z<=bound:z>=bound)]),'Точка '+textNum(a)+' запрещена. Точка '+textNum(bound)+' разрешена: в исходном неравенстве получается равенство.',F(x+o('∈')+'<mtext>'+ans+'</mtext>'))
 ];
 lessons.push(finish(id,'fixed-log','Логарифм: постоянное основание',expr+o('≤')+n(k),'log_'+base+'(x−('+a+')) ≤ '+k,ans,p,sol,s,domain,0,{base,a,k}));
}
function variableLog(a,c,i){
 const id='variable-log-'+i,base=minus(a),arg=n(c)+o('−')+x,expr=log(base,arg),unit=a+1,argUnit=c-1,first=unit<argUnit,p=[...new Set([a,unit,argUnit,c])].sort((a,b)=>a-b),lo=Math.min(unit,argUnit),hi=Math.max(unit,argUnit),ans=range(lo,hi);
 const domain=[x+o('>')+n(a),x+o('≠')+n(unit),x+o('<')+n(c)],sol=tokens(p,z=>z>lo&&z<hi);
 const case1=[x+o('>')+n(unit),x+o('<')+n(argUnit)],case2=[n(a)+o('<')+x+o('<')+n(unit),n(argUnit)+o('<')+x+o('<')+n(c)];
 const s=[
 step('Соберём три условия','ОДЗ','<p>У основания два условия, у аргумента — одно.</p>'+S([base+o('>')+n(0),base+o('≠')+n(1),arg+o('>')+n(0)]),num('base-zero','Из первой строки: x больше какого числа?',a),'Основание x − ('+textNum(a)+') положительно при x > '+textNum(a)+'.',F(x+o('>')+n(a))),
 step('Исключим основание 1','ОДЗ',F(base+o('≠')+n(1))+'<p>Прибавляем '+textNum(a)+' к обеим частям.</p>',num('base-one','Какое x исключаем?',unit),'1 + ('+textNum(a)+') = '+textNum(unit)+'.',F(x+o('≠')+n(unit))),
 step('Сделаем аргумент положительным','ОДЗ',F(arg+o('>')+n(0))+'<p>Прибавим x к обеим частям: '+textNum(c)+' > x.</p>',num('arg-zero','x должен быть меньше какого числа?',c),'Запишем в привычном порядке: x < '+textNum(c)+'.',S(domain)),
 step('Пересечём условия ОДЗ','Числовая прямая',S(domain)+'<p>Все три условия нужны одновременно.</p>',axis('domain-axis','Общая часть — ОДЗ',p,tokens(p,z=>z>a&&z<c&&z!==unit),[ref('x > '+textNum(a),p,z=>z>a),ref('x ≠ '+textNum(unit),p,z=>z!==unit),ref('x < '+textNum(c),p,z=>z<c)]),'Оставьте промежуток от '+textNum(a)+' до '+textNum(c)+' без концов и исключите '+textNum(unit)+'.',S(domain)),
 step('Заменим ноль логарифмом','Два случая','<p>При любом допустимом основании логарифм единицы равен нулю:</p>'+F(expr+o('>')+log(base,n(1)))+'<p>Теперь сравниваем аргумент с 1. Направление зависит от основания.</p>',pick('cases','Сколько случаев рассмотрим?','two',[['one','Один: основание всегда больше 1'],['two','Два: основание больше 1 или между 0 и 1']]),'Переменное основание может быть как больше, так и меньше 1.',F(expr+o('>')+log(base,n(1)))),
 step('Случай 1: основание больше 1','Первый случай','<p>Логарифм возрастает. Знак > сохраняется.</p>'+S([base+o('>')+n(1),arg+o('>')+n(1)])+'<p>Из первой строки: x > '+textNum(unit)+'. Во второй прибавляем x и вычитаем 1.</p>',num('upper','Из второй строки: x меньше какого числа?',argUnit),textNum(c)+' − 1 = '+textNum(argUnit)+'.',S(case1)),
 step('Пересечём строки первого случая','Первый случай',S(case1)+'<p>Сравните два луча.</p>'+(!first?staticAxes(p,[ref('x > '+textNum(unit),p,z=>z>unit),ref('x < '+textNum(argUnit),p,z=>z<argUnit)]):''),first?axis('case1','Общая часть первого случая',p,sol,[ref('x > '+textNum(unit),p,z=>z>unit),ref('x < '+textNum(argUnit),p,z=>z<argUnit)]):pick('case1-empty','Есть ли число одновременно больше '+textNum(unit)+' и меньше '+textNum(argUnit)+'?','empty',[['empty','Нет, общей части нет'],['all','Да, подходят все числа между ними']]),first?'Нужен промежуток между границами, без самих границ.':'Нижняя граница больше верхней. Эти два луча не пересекаются.',first?F(x+o('∈')+'<mtext>'+ans+'</mtext>'):'<p>В первом случае решений нет.</p>'),
 step('Случай 2: основание между 0 и 1','Второй случай','<p>Логарифм убывает: знак > меняется на <. Аргумент по ОДЗ остаётся положительным.</p>'+S([n(0)+o('<')+base+o('<')+n(1),n(0)+o('<')+arg+o('<')+n(1)])+'<p>К первой строке прибавляем '+textNum(a)+':</p>'+F(n(a)+o('<')+x+o('<')+n(unit))+'<p>Из второй строки: аргумент положителен при x < '+textNum(c)+'. А условие '+textNum(c)+' − x < 1 даёт −x < '+textNum(1-c)+'. Умножаем на −1 и меняем знак: x > '+textNum(argUnit)+'.</p>'+S(case2)+(first?staticAxes(p,[ref(textNum(a)+' < x < '+textNum(unit),p,z=>z>a&&z<unit),ref(textNum(argUnit)+' < x < '+textNum(c),p,z=>z>argUnit&&z<c)]):''),first?pick('case2-empty','Пересекаются ли эти два промежутка?','empty',[['empty','Нет, общей части нет'],['all','Да, полностью совпадают']]):axis('case2','Общая часть второго случая',p,sol,[ref(textNum(a)+' < x < '+textNum(unit),p,z=>z>a&&z<unit),ref(textNum(argUnit)+' < x < '+textNum(c),p,z=>z>argUnit&&z<c)]),first?'Первый промежуток заканчивается раньше, чем начинается второй.':'Общая часть от '+textNum(argUnit)+' до '+textNum(unit)+', без концов.',first?'<p>Во втором случае решений нет.</p>':F(x+o('∈')+'<mtext>'+ans+'</mtext>')),
 step('Объединим случаи и проверим ОДЗ','Ответ','<p>Решения двух случаев объединяем. Один случай оказался пустым, поэтому остаётся решение другого. Ещё раз проверим ОДЗ.</p>'+S([...domain,n(lo)+o('<')+x+o('<')+n(hi)]),axis('final','Окончательный ответ',p,sol,[ref('ОДЗ',p,z=>z>a&&z<c&&z!==unit),{label:'Решения двух случаев',tokens:sol}]),'Оставьте общую часть. Все её концы исключены.',F(x+o('∈')+'<mtext>'+ans+'</mtext>'))
 ];
 lessons.push(finish(id,'variable-log','Логарифм: переменное основание',expr+o('>')+n(0),'log_(x−('+a+'))('+c+'−x) > 0',ans,p,sol,s,domain,3,{a,c}));
}
function radical(a,b,l,r,i){
 const id='radical-'+i,left=sqrt(add(x,a)),right=minus(b),expr=left+o('≤')+right,p=[...new Set([-a,l,b,r])].sort((a,b)=>a-b),domain=[x+o('≥')+n(-a)],conditions=[...domain,x+o('≥')+n(b)];
 const polynomial=pow(x,n(2))+o('−')+n(2*b+1)+x+(b*b-a?o('+')+n(b*b-a):''),factors=par(minus(l))+par(minus(r)),sol=tokens(p,z=>z>=r),ans=range(r,'+∞',true,false);
 const s=[
 step('Найдём ОДЗ корня','ОДЗ','<p>Под квадратным корнем должно стоять неотрицательное выражение.</p>'+S([add(x,a)+o('≥')+n(0)]),num('domain','x должен быть не меньше какого числа?',-a),a===0?'Под корнем стоит x. Поэтому x ≥ 0.':'Вычтем '+textNum(a)+' из обеих частей: x ≥ '+textNum(-a)+'.',S(domain)),
 step('Проверим правую часть','Перед возведением в квадрат','<p>Квадратный корень всегда неотрицателен. Чтобы он был ≤ правой части, правая часть тоже должна быть неотрицательной.</p>'+S([...domain,right+o('≥')+n(0)]),num('right','Из второй строки: x ≥ …',b),'x − '+textNum(b)+' ≥ 0 означает x ≥ '+textNum(b)+'.',S(conditions)),
 step('Теперь возведём обе части в квадрат','Преобразование','<p>Мы проверили: обе части неотрицательны. Поэтому можно возвести их в квадрат, сохранив знак.</p>'+F(expr),pick('squared','Что получится?','correct',[['correct',M(add(x,a)+o('≤')+pow(par(right),n(2)))],['wrong',M(add(x,a)+o('≥')+pow(par(right),n(2)))]]),'Для двух неотрицательных чисел сравнение и сравнение квадратов имеют один знак.',S([...conditions,add(x,a)+o('≤')+pow(par(right),n(2))])),
 step('Раскроем квадрат скобки','Преобразование',F(pow(par(right),n(2))+o('=')+pow(x,n(2))+o('−')+n(2*b)+x+o('+')+n(b*b))+'<p>Перенесём левую часть вправо: вычтем x и '+textNum(a)+' из обеих частей.</p>',[num('coefficient','Число перед x после минуса',2*b+1),num('constant','Свободное число: '+b*b+' − '+a,b*b-a)],'У x: −'+2*b+'x − x = −'+(2*b+1)+'x. Свободные числа вычитаем.',F(polynomial+o('≥')+n(0))),
 step('Разложим трёхчлен','Граничные точки','<p>Проверим числа '+textNum(l)+' и '+textNum(r)+': их сумма должна быть '+(2*b+1)+', произведение — '+(b*b-a)+'.</p>',[num('sum','Сумма',l+r),num('product','Произведение',l*r)],'Сложите и перемножьте эти два числа.',F(polynomial+o('=')+factors)),
 step('Решим квадратное неравенство','Числовая прямая',F(factors+o('≥')+n(0))+'<p>Вне корней обе скобки одного знака — произведение положительно. Между корнями знаки разные. Сами корни дают ноль и подходят.</p>',axis('quadratic','Где произведение ≥ 0?',[l,r],['s0','p0','p1','s2']),'Два внешних луча, оба корня включены.',F(x+o('≤')+n(l)+o(' или ')+x+o('≥')+n(r))),
 step('Вернём условия перед квадратом','Ответ',S([...conditions,polynomial+o('≥')+n(0)])+'<p>После возведения в квадрат обязательно пересекаем результат с прежними условиями.</p>',axis('final','Общая часть трёх строк',p,sol,[ref('ОДЗ: x ≥ '+textNum(-a),p,z=>z>=-a),ref('Правая часть ≥ 0: x ≥ '+textNum(b),p,z=>z>=b),ref('Квадратное неравенство',p,z=>z<=l||z>=r)]),'Левый луч не удовлетворяет условию x ≥ '+textNum(b)+'. Остаётся правый луч, начиная с '+textNum(r)+'.',F(x+o('∈')+'<mtext>'+ans+'</mtext>'))
 ];
 lessons.push(finish(id,'radical','Неравенство с квадратным корнем',expr,'√(x+'+a+') ≤ x−'+b,ans,p,sol,s,domain,0,{a,b,l,r}));
}
[[-2,3],[1,4],[-3,-1]].forEach((p,i)=>rational(...p,i+1));
[[3,1],[2,-1],[4,0]].forEach((p,i)=>repeated(...p,i+1));
[[2,1,3],[3,1,2],[.5,1,3]].forEach((p,i)=>exponential(...p,i+1));
[[2,1,3],[3,-2,2],[.5,2,-2]].forEach((p,i)=>fixedLog(...p,i+1));
[[0,4],[1,6],[-1,.5]].forEach((p,i)=>variableLog(...p,i+1));
[[1,1,0,3],[0,2,1,4],[3,3,1,6]].forEach((p,i)=>radical(...p,i+1));
const families=[
 {id:'rational',title:'Дробь и метод интервалов',description:'Нули числителя, запрещённый знаменатель, знаки на промежутках.'},
 {id:'repeated',title:'Повторяющийся корень',description:'Почему знак у квадрата не меняется. Луч и отдельная точка.'},
 {id:'exponential',title:'Показательные неравенства',description:'Одно основание. Разложение на множители. Знак при основании меньше 1.'},
 {id:'fixed-log',title:'Логарифм с постоянным основанием',description:'ОДЗ, переход к аргументу, пересечение решений.'},
 {id:'variable-log',title:'Логарифм с переменным основанием',description:'Два случая для основания. Каждое ограничение — на прямой.'},
 {id:'radical',title:'Неравенство с корнем',description:'Сначала знак правой части, затем квадрат и проверка ограничений.'}
];
const api={lessons,families};root.ProfileInequalityLessons=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='object'?window:globalThis);

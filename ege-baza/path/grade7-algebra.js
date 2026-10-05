/* Authored grade-7 algebra: additive families, exact answers, stable seeded tasks. */
(function(root){'use strict';
const D=root.PathData,previous=D.task,F=D.F,count=360;
const families=[
 {id:'grade7-a-expression-structure',title:'Как устроено выражение',gap:'order',idea:'Найди последнее действие: оно определяет устройство выражения. Скобки могут превратить сумму в один множитель или в числитель.'},
 {id:'grade7-a-opposite-expression',title:'Минус перед выражением',gap:'signs',idea:'Вычитаем всё выражение в скобках: каждое его слагаемое заменяем противоположным. Вложенные скобки раскрываем изнутри.'},
 {id:'grade7-a-two-variable-collect',title:'Подобные слагаемые с двумя буквами',gap:'equations',idea:'Слагаемые с x собираем с x, с y — с y. Складываются коэффициенты; разные буквы не превращаются в одно слагаемое.'},
 {id:'grade7-a-substitution-negative-fraction',title:'Подстановка отрицательной дроби',gap:'fractions',idea:'На место буквы подставь всю отрицательную дробь в скобках. Соблюдай порядок действий и записывай точные дроби без округления.'},
 {id:'grade7-a-equation-two-brackets',title:'Уравнение с двумя скобками',gap:'equations',idea:'Сначала умножь на каждое слагаемое в скобках. Затем выполни одинаковые действия с обеими частями и проверь корень в исходном уравнении.'},
 {id:'grade7-a-equation-denominators',title:'Уравнение: убираем знаменатели',gap:'fractions',idea:'Умножь обе части на общий знаменатель. Множитель получает каждое слагаемое, включая целое число вне дроби.'},
 {id:'grade7-a-equation-decimals',title:'Уравнение с десятичными дробями',gap:'decimal',idea:'Умножь обе части на 10 или 100, чтобы вычислять целыми числами. При наличии скобок сначала учитывай произведение десятичных множителей.'},
 {id:'grade7-a-equation-word-perimeter',title:'Периметр: составляем уравнение',gap:'equations',idea:'Назови неизвестную длину и вырази остальные стороны через неё. В периметр входит каждая сторона; найденные длины проверяем по условию.'}
];
const ids=new Set(families.map(x=>x.id));
const exact=(a,b=1)=>D.practice.fraction(b<0?-a:a,Math.abs(b));
const term=n=>`${n<0?'−':'+'} ${F(Math.abs(n))}`;
const mono=(a,v='x')=>a===0?'0':`${a===1?'':a===-1?'−':F(a)}${v}`;
const linear=(a,b,v='x')=>a===0?F(b):mono(a,v)+(b?' '+term(b):'');
const pair=(a,b,c=0)=>[a?mono(a):'',b?(a?`${b<0?'−':'+'} ${mono(Math.abs(b),'y')}`:mono(b,'y')):'',c?((a||b)?term(c):F(c)):''].filter(Boolean).join(' ')||'0';
const step=(q,a,why)=>({q,a:typeof a==='string'?a:exact(a),why,strict:true});
function choice(q,labels,correct,k,why){
 const shift=Math.floor(k/3)%labels.length,order=labels.map((_,i)=>(i+shift)%labels.length);
 return {...step(q,String(order.indexOf(correct)+1),why),choices:order.map((v,i)=>({value:String(i+1),label:labels[v]}))};
}
const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
const equation=(a,b,c,d,x,explanation)=>({kind:'equation',left:[[a,1],[b,0]].filter(t=>t[0]!==0),right:[[c,1],[d,0]].filter(t=>t[0]!==0),root:x,expansion:explanation});
function solved(a,b,c,d,r,check,originalLeft,originalRight){
 const delta=a-c,rhs=d-b,answer=exact(rhs,delta);
 return [step(c?`Вычти (${mono(c)}) из обеих частей. Какой коэффициент останется при x слева?`:'Справа нет слагаемых с x. Какой коэффициент при x уже записан слева?',delta,c?`${F(a)} − (${F(c)}) = ${F(delta)}. Получаем ${linear(delta,b)} = ${F(d)}.`:`Все слагаемые с x уже слева: ${linear(delta,b)} = ${F(d)}. Коэффициент равен ${F(delta)}.`),
  step(`Вычти (${F(b)}) из обеих частей. Какое число останется справа?`,rhs,`${F(d)} − (${F(b)}) = ${F(rhs)}. Теперь ${mono(delta)} = ${F(rhs)}.`),
  step(`Раздели обе части на ${F(delta)}. Чему равен x?`,answer,`x = (${F(rhs)})/(${F(delta)}) = ${answer}. Коэффициент — множитель: делим обе части, а не меняем его знак.`),
  step(`Проверка при x = ${exact(r)}: вычисли левую часть исходного уравнения.`,check,`Подставляем ${exact(r)} именно в исходное условие. Левая часть: ${originalLeft.replaceAll('x',`(${exact(r)})`)} = ${check}; правая часть: ${originalRight.replaceAll('x',`(${exact(r)})`)} = ${check}. Равенство верно.`)];
}
function build(id,seed){
 const numericSeed=Number(seed),k=Number.isFinite(numericSeed)?((Math.trunc(numericSeed)%count)+count)%count:0,mode=k%3,n=Math.floor(k/3);
 let q,answer,ss,params,model={kind:'plan'};
 if(id==='grade7-a-expression-structure'){
  const a=2+n%8,b=1+Math.floor(n/8),x=mode===2?1+n%7:n%11-5;
  const expr=mode===0?`${mono(a)} ${term(b)}`:mode===1?`${a}(${linear(1,b)})`:`(${linear(1,b)})/${a}`;
  const first=mode===0?a*x:x+b,ans=mode===0?exact(first+b):mode===1?exact(a*first):exact(first,a);
  const operation=['Сложение','Умножение','Деление'];
  ss=[choice(`Какое действие выполняется последним в ${expr}?`,operation,mode,k,mode===0?'Сначала умножаем a на x, затем прибавляем число.':mode===1?'Вся сумма в скобках — один множитель. Умножение выполняется после сложения.':'Весь числитель — сумма в скобках. Делим эту сумму целиком.'),
   step(mode===0?`При x = ${x} вычисли ${a} · (${x}).`:`При x = ${x} вычисли значение скобок ${linear(1,b)}.`,first,mode===0?`${a} · (${x}) = ${first}. Это первый результат; сложение ещё впереди.`:`(${x}) + ${b} = ${first}. Скобки заменяем одним числом ${first}.`),
   step('Теперь выполни последнее действие. Чему равно всё выражение?',ans,mode===0?`${first} + ${b} = ${ans}.`:mode===1?`${a} · (${first}) = ${ans}.`:`${first}/${a} = ${ans}. Дробь не округляем.`)];
  q=`${expr}. Определи порядок действий и найди значение при x = ${x}.`;answer=ans;params={mode,a,b,x};
 }else if(id==='grade7-a-opposite-expression'){
  const a=2+n%8,b=2+Math.floor(n/8),c=1+n%5,d=1+n%7,x=n%9-4;
  let expr,p,h,why,wrong;
  if(mode===0){expr=`${mono(a)} − (${linear(b,-c)})`;p=a-b;h=c;why=`Вычитаем каждое слагаемое: ${expr} = ${mono(a)} − ${mono(b)} + ${c} = ${linear(p,h)}.`;wrong=linear(p,-h);}
  else if(mode===1){expr=`−(${linear(a,-b)}) + ${mono(c)}`;p=c-a;h=b;why=`Минус перед скобками — множитель −1: ${expr} = ${mono(-a)} + ${b} + ${mono(c)} = ${linear(p,h)}.`;wrong=linear(p,-h);}
  else{expr=`${a} − (${mono(b)} − (${linear(c,d)}))`;p=c-b;h=a+d;why=`Сначала внутренние скобки: ${mono(b)} − (${linear(c,d)}) = ${linear(b-c,-d)}. Затем ${a} − (${linear(b-c,-d)}) = ${linear(p,h)}.`;wrong=linear(p,a-d);}
  ss=[choice('Какое равносильное выражение получится после раскрытия скобок и приведения подобных?', [linear(p,h),wrong,linear(-p-1,h)],0,k,why),
   step('Каков итоговый коэффициент при x? Если слагаемого с x нет, введи 0.',p,`После приведения подобных: ${linear(p,h)}. Коэффициент при x равен ${p}.`),
   step('Какое свободное слагаемое получилось?',h,`В выражении ${linear(p,h)} число без буквы равно ${h}. Его знак тоже учитываем.`),
   step(`Вычисли значение при x = ${x}.`,p*x+h,`${mono(p)} ${term(h)} при x = ${x}: (${p}) · (${x}) + (${h}) = ${p*x+h}.`)];
  q=`${expr}. Раскрой скобки и найди значение при x = ${x}.`;answer=exact(p*x+h);params={mode,a,b,c,d,x};
 }else if(id==='grade7-a-two-variable-collect'){
  const a=2+n%8,b=1+Math.floor(n/8),c=1+n%5,d=1+n%7,e=n%9-4,x=n%7-3,y=1+n%4;
  const p=mode===0?a-c:mode===1?a-b:c-a,r=mode===0?b+d:mode===1?a+b:b-c;
  const expr=mode===0?`${mono(a)} + ${mono(b,'y')} − ${mono(c)} + ${mono(d,'y')} ${term(e)}`:mode===1?`${a}(x + y) − ${b}(x − y) ${term(e)}`:`−(${mono(a)} − ${mono(b,'y')}) + ${c}(x − y) ${term(e)}`;
  const expanded=mode===0?expr:mode===1?`${mono(a)} + ${mono(a,'y')} − ${mono(b)} + ${mono(b,'y')} ${term(e)}`:`${mono(-a)} + ${mono(b,'y')} + ${mono(c)} − ${mono(c,'y')} ${term(e)}`;
  ss=[choice('Какие слагаемые можно складывать как подобные?', ['Слагаемые с x отдельно; с y отдельно; числа отдельно','Все слагаемые с буквами в одну группу','Слагаемые с одинаковым знаком в одну группу'],0,k,'Буквенная часть подобных слагаемых должна совпадать. Например, 3x и −x подобны, а 3x и 3y — нет.'),
   step('Раскрой скобки, если они есть. Какой суммарный коэффициент при x?',p,`${expanded}. При x: ${mode===0?`${a} − ${c}`:mode===1?`${a} − ${b}`:`−${a} + ${c}`} = ${p}.`),
   step('Какой суммарный коэффициент при y?',r,`При y: ${mode===0?`${b} + ${d}`:mode===1?`${a} + ${b}`:`${b} − ${c}`} = ${r}. Всё выражение: ${pair(p,r,e)}.`),
   step(`Вычисли только слагаемое с x при x = ${x}.`,p*x,`(${p}) · (${x}) = ${p*x}. Значение y пока не подставляем в слагаемое с x.`),
   step(`Теперь подставь также y = ${y}. Чему равно всё выражение?`,p*x+r*y+e,`${pair(p,r,e)} = (${p}) · (${x}) + (${r}) · ${y} + (${e}) = ${p*x+r*y+e}.`)];
  q=`${expr}. Приведи подобные слагаемые и найди значение при x = ${x}, y = ${y}.`;answer=exact(p*x+r*y+e);params={mode,a,b,c,d,e,x,y};
 }else if(id==='grade7-a-substitution-negative-fraction'){
  const a=2+n%8,b=1+Math.floor(n/8),num=-(1+n%11),den=2+n%5,x=exact(num,den);
  const expr=mode===0?linear(a,b):mode===1?`${a} − ${mono(b)}`:`(${linear(1,-b)})/${a}`;
  const firstNum=mode===0?a*num:mode===1?b*num:num-b*den,first=exact(firstNum,den);
  const ans=mode===0?exact(firstNum+b*den,den):mode===1?exact(a*den-firstNum,den):exact(firstNum,den*a);
  ss=[choice('Как правильно подставить отрицательную дробь вместо x?',mode===0?[`${a} · (${x}) + ${b}`,`${a} · ${exact(-num,den)} + ${b}`,`${a} · (${x} + ${b})`]:mode===1?[`${a} − ${b} · (${x})`,`${a} − ${b} · ${exact(-num,den)}`,`(${a} − ${b}) · (${x})`]:[`((${x}) − ${b})/${a}`,`((${exact(-num,den)}) − ${b})/${a}`,`(${x}) − ${b}/${a}`],0,k,'Вместо x ставим всё число вместе со знаком. Скобки сохраняют структуру исходного выражения.'),
   step(mode===2?`Вычисли числитель (${x}) − ${b}.`:`Вычисли произведение ${mode===0?a:b} · (${x}).`,first,mode===2?`${x} − ${b} = (${num} − ${b*den})/${den} = ${first}.`:`Положительное число умножаем на отрицательное: результат отрицателен. ${mode===0?a:b} · (${x}) = ${first}.`),
   step('Вычисли значение всего выражения. Ответ можно ввести дробью.',ans,mode===0?`${first} + ${b} = (${firstNum} + ${b*den})/${den} = ${ans}.`:mode===1?`${a} − (${first}) = (${a*den} − (${firstNum}))/${den} = ${ans}. Вычесть отрицательное — прибавить положительное.`:`(${first})/${a} = ${firstNum}/(${den} · ${a}) = ${ans}. Делим на ${a}: знаменатель умножается на ${a}.`)];
  q=`Найди значение ${expr} при x = ${x}. Ответ запиши точно, без округления.`;answer=ans;params={mode,a,b,num,den};
 }else if(id==='grade7-a-equation-two-brackets'){
  const a=2+n%5,c=a+1+n%3,b=1+Math.floor(n/5),d=1+n%7,r=n%13-6;
  let left,right,A,B,C,E,extra;
  if(mode===0){extra=a*(r+b)-c*(r+d);left=`${a}(${linear(1,b)})`;right=`${c}(${linear(1,d)}) ${term(extra)}`;A=a;B=a*b;C=c;E=c*d+extra;}
  else if(mode===1){extra=a*(r+b)-c*(r+d);left=`${a}(${linear(1,b)}) − ${c}(${linear(1,d)})`;right=F(extra);A=a-c;B=a*b-c*d;C=0;E=extra;}
  else{extra=-(a*r+b)-c*(r+d);left=`−(${linear(a,b)})`;right=`${c}(${linear(1,d)}) ${term(extra)}`;A=-a;B=-b;C=c;E=c*d+extra;}
  const expansion=`После раскрытия скобок: ${linear(A,B)} = ${linear(C,E)}. Именно это равносильное уравнение показано в модели.`;
  ss=[step('Раскрой скобки и приведи подобные слева. Какой коэффициент при x получится?',A,mode===0?`${a} · (x + ${b}) = ${linear(A,B)}: умножаем на ${a} оба слагаемых.`:mode===1?`${a}(x + ${b}) − ${c}(x + ${d}) = ${mono(a)} + ${a*b} − ${mono(c)} − ${c*d} = ${linear(A,B)}.`:`−(${linear(a,b)}) = ${linear(A,B)}. У каждого слагаемого меняется знак.`),
   step('Какое свободное слагаемое получится слева?',B,`Левая часть: ${linear(A,B)}; свободное слагаемое ${B}.`),
   step(mode===1?'Какое свободное число записано справа?':'Раскрой скобки справа. Какое свободное слагаемое получится справа?',E,expansion),...solved(A,B,C,E,r,exact(A*r+B),left,right)];
  q=`${left} = ${right}. Найди x.`;answer=exact(r);params={mode,a,b,c,d,extra};model=equation(A,B,C,E,r,expansion);
 }else if(id==='grade7-a-equation-denominators'){
  const d=2+n%5,f=3+Math.floor(n/5)%5,a=1+n%4,c=1+Math.floor(n/4)%3,s=mode===2?-1:1,h=mode===1?1+n%3:0,r=n%13-6,t=1+Math.floor(n/13);
  // Non-zero denominators and a non-zero coefficient difference guarantee one root.
  const f2=s*a*f===c*d?f+1:f,b=d*t-a*r,e=f2*(s*t+h)-c*r,L=d*f2/gcd(d,f2);
  const A=s*a*L/d,B=s*b*L/d+h*L,C=c*L/f2,E=e*L/f2;
  const left=`${s<0?'−':''}(${linear(a,b)})/${d}${h?' + '+h:''}`,right=`(${linear(c,e)})/${f2}`;
  const expansion=`Умножаем обе части и каждое их слагаемое на ${L}: ${linear(A,B)} = ${linear(C,E)}. Модель показывает это равносильное уравнение без знаменателей.`;
  ss=[step(`Найди наименьший общий знаменатель ${d} и ${f2}.`,L,`НОК(${d}, ${f2}) = ${L}. При умножении на ${L} оба знаменателя сократятся.`),
   step(`Умножь всё уравнение на ${L}. Какой коэффициент при x получится слева?`,A,`${s<0?'−':''}${L/d} · (${linear(a,b)})${h?` + ${L} · ${h}`:''}: коэффициент равен ${A}.`),
   step('Какое свободное слагаемое получится слева после умножения и раскрытия скобок?',B,`${s*L/d} · (${b})${h?` + ${L} · ${h}`:''} = ${B}.${h?' Целое число вне дроби тоже умножается на общий знаменатель.':''}`),
   step('Какое свободное слагаемое получится справа?',E,`${L/f2} · (${e}) = ${E}. ${expansion}`),...solved(A,B,C,E,r,exact(s*t+h),left,right)];
  q=`${left} = ${right}. Найди x. Знаменатели — ненулевые числа.`;answer=exact(r);params={mode,a,b,c,d,f:f2,e,h,s};model=equation(A,B,C,E,r,expansion);
 }else if(id==='grade7-a-equation-decimals'){
  let ai=2+n%8,ci=mode===1?1+n%4:0;if(ai===ci)ai++;
  const bi=11+Math.floor(n/8),r=n%15-7,scale=mode===2&&ai*bi%10!==0?100:10;
  const A=ai*scale/10,B=mode===2?ai*bi*scale/100:bi,C=ci,E=(A-C)*r+B;
  const left=mode===2?`${F(ai/10)}(${linear(1,bi/10)})`:linear(ai/10,bi/10),right=mode===2?F(E/scale):linear(ci/10,E/10);
  const expansion=`После умножения обеих частей на ${scale}${mode===2?' и раскрытия скобок':''}: ${linear(A,B)} = ${linear(C,E)}. Эта равносильная целочисленная запись показана в модели.`;
  const check=exact(A*r+B,scale);
  ss=[step('На какое наименьшее из чисел 10 и 100 нужно умножить обе части, чтобы после раскрытия скобок все коэффициенты и свободные слагаемые были целыми?',scale,mode===2?`При раскрытии скобок ${F(ai/10)} · ${F(bi/10)} = ${F(ai*bi/100)}. Здесь нужны ${scale===100?'сотые':'только десятые'} доли. Поэтому выбираем ${scale} и умножаем всё уравнение.`:'Коэффициенты и числа записаны в десятых долях. Умножаем на 10 каждое слагаемое обеих частей.'),
   step('Какой целый коэффициент при x получится слева?',A,`${scale} · ${F(ai/10)} · x = ${mono(A)}. Всё равенство умножается на ${scale}.`),
   step('Какое целое свободное слагаемое получится слева?',B,mode===2?`${scale} · ${F(ai/10)} · ${F(bi/10)} = ${B}. Число перед скобкой умножает каждое слагаемое.`:`10 · ${F(bi/10)} = ${B}.`),
   step('Какое целое свободное слагаемое получится справа?',E,expansion),...solved(A,B,C,E,r,check,left,right)];
  q=`${left} = ${right}. Найди x.`;answer=exact(r);params={mode,ai,bi,ci,rightNumerator:E,scale};model=equation(A,B,C,E,r,expansion);
 }else if(id==='grade7-a-equation-word-perimeter'){
  const w=mode===2?10+n%15:2+n%15,d=1+Math.floor(n/15),m=2+Math.floor(n/15),other=mode===0?w+d:mode===1?w*m:w-d;
  const A=mode===0?4:mode===1?2*(m+1):3,B=mode===0?2*d:mode===1?0:-d,P=A*w+B;
  const relation=mode===0?linear(1,d):mode===1?mono(m):linear(1,-d);
  const eq=mode===0?`2x + 2(x + ${d}) = ${P}`:mode===1?`2x + 2 · ${m}x = ${P}`:`2x + (x − ${d}) = ${P}`;
  const alternatives=mode===0?[eq,`x + (x + ${d}) = ${P}`,`2x + 2(x − ${d}) = ${P}`]:mode===1?[eq,`x + ${m}x = ${P}`,`2x + 2(x + ${m}) = ${P}`]:[eq,`x + 2(x − ${d}) = ${P}`,`2x + (x + ${d}) = ${P}`];
  const expansion=`Обозначим ${mode===2?'боковую сторону':'ширину'} через x см, тогда ${mode===2?'основание':'длина'} — ${relation} см. ${eq}; после приведения подобных ${linear(A,B)} = ${P}. Модель использует эту последнюю запись.`;
  ss=[choice(`Пусть x — ${mode===2?'боковая сторона треугольника':'ширина прямоугольника'} в сантиметрах. Какое уравнение выражает периметр?`,alternatives,0,k,expansion),
   step('Раскрой скобки и приведи подобные. Какой коэффициент при x?',A,`Каждую сторону учитываем один раз. Получаем ${linear(A,B)} = ${P}.`),
   step(`Вычти (${B}) из обеих частей. Какое число останется справа?`,P-B,`${P} − (${B}) = ${P-B}. Получаем ${mono(A)} = ${P-B}.`),
   step(`Раздели обе части на ${A}. Найди x в сантиметрах.`,w,`x = ${P-B}/${A} = ${w} см.`),
   step(`Найди ${mode===2?'основание треугольника':'длину прямоугольника'} в сантиметрах.`,other,`${relation} при x = ${w}: ${other} см. ${mode===2?`Все стороны положительны; ${w} + ${w} > ${other}, значит треугольник существует.`:'Длина больше ширины, как и сказано в условии.'}`),
   step('Проверка: чему равен периметр найденной фигуры в сантиметрах?',P,mode===2?`${w} + ${w} + ${other} = ${P} см. Условие выполнено.`:`2 · ${w} + 2 · ${other} = ${P} см. Условие выполнено.`)];
  q=mode===0?`Периметр прямоугольника ${P} см. Длина на ${d} см больше ширины. Найди ширину в сантиметрах.`:mode===1?`Периметр прямоугольника ${P} см. Длина в ${m} ${m<5?'раза':'раз'} больше ширины. Найди ширину в сантиметрах.`:`Периметр равнобедренного треугольника ${P} см. Основание на ${d} см короче боковой стороны. Найди боковую сторону в сантиметрах.`;
  answer=exact(w);params={mode,d,m,P};model=equation(A,B,0,P,w,expansion);
 }
 return {id,seed,pos:null,q,answer,a:answer,steps:ss,strict:true,grade7:true,subject:'algebra',params,model};
}
D.meta.push(...families.map(m=>({...m,pos:null,trainingOnly:true,grade7:true,subject:'algebra',expanded:true})));
D.task=(id,seed=1)=>ids.has(id)?build(id,seed):previous(id,seed);
D.grade7Algebra={families,count,has:id=>ids.has(id)};
if(typeof module!=='undefined')module.exports=D;
})(typeof window==='undefined'?globalThis:window);

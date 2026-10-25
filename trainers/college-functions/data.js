/* College functions: authored lesson/practice data, no account or board contract.
 * model = {kind,params}; sqrt params {a,b,c,d}: a*sqrt(b*x+c)+d;
 * quadratic {a,h,k}: a*(x-h)^2+k; exponential/log {a,base,b,c,d}:
 * a*base^(b*x+c)+d or a*log_base(b*x+c)+d.
 * piecewise {kind:'piecewise',branches:[{model,lo,hi,lc,rc,formulaHtml,formulaText}]}.
 * lo/hi are numeric or '-inf'/'inf'; lc/rc include finite endpoints.
 * Evaluate each graph branch independently; NEVER join across a jump.
 * Sets = {intervals:[{lo,hi,lc,rc}],points:[]}. up/down/constant are separate
 * interval arrays: render with 'и', never collapse them into a union (see F3).
 */
(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.CollegeFunctionsData=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  var NI='-inf',PI='inf';
  function bound(x){return x===NI?-Infinity:x===PI?Infinity:x;}
  function I(lo,hi,lc,rc){return {lo:lo,hi:hi,lc:!!lc&&lo!==NI,rc:!!rc&&hi!==PI};}
  function S(){return {intervals:Array.prototype.slice.call(arguments),points:[]};}
  function P(){return {intervals:[],points:Array.prototype.slice.call(arguments)};}
  function ALL(){return S(I(NI,PI));}
  function EMPTY(){return S();}
  function contains(set,x){return set.points.some(function(p){return Math.abs(p-x)<1e-9;})||set.intervals.some(function(i){var lo=bound(i.lo),hi=bound(i.hi);return (x>lo||(i.lc&&x===lo))&&(x<hi||(i.rc&&x===hi));});}
  function clip(set,lo,hi){
    var a=bound(lo),b=bound(hi);
    return {intervals:set.intervals.map(function(i){
      var l=Math.max(bound(i.lo),a),h=Math.min(bound(i.hi),b);
      return I(l===-Infinity?NI:l,h===Infinity?PI:h,i.lc&&bound(i.lo)>a,i.rc&&bound(i.hi)<b);
    }).filter(function(i){return bound(i.lo)<bound(i.hi);}),points:set.points.filter(function(x){return x>a&&x<b;})};
  }
  function rational(n){
    if(n===NI||n===-Infinity)return '-∞';if(n===PI||n===Infinity)return '+∞';
    if(Math.abs(n)<1e-10)return '0';
    if(Math.abs(n-Math.round(n))<1e-9)return String(Math.round(n));
    for(var q=2;q<=100;q++){var p=Math.round(n*q);if(Math.abs(p/q-n)<1e-9)return p+'/'+q;}
    return String(Math.round(n*1000000)/1000000).replace('.',',');
  }
  function frac(n,d){return '<span class="frac"><span>'+n+'</span><span>'+d+'</span></span>';}
  function numHtml(n){var s=rational(n);return s.indexOf('/')<0?s:frac(s.split('/')[0],s.split('/')[1]);}
  function sqrtHtml(s){return '<span class="sqrt"><span aria-hidden="true">√</span><span class="radicand">'+s+'</span></span>';}
  function formatInterval(i){return (i.lc?'[':'(')+rational(i.lo)+'; '+rational(i.hi)+(i.rc?']':')');}
  function formatSet(s){
    if(!s)return '∅';
    if(s.intervals.length===1&&s.intervals[0].lo===NI&&s.intervals[0].hi===PI&&!s.points.length)return 'ℝ';
    var parts=s.intervals.map(formatInterval);
    if(s.points.length)parts.push('{'+s.points.map(rational).join('; ')+'}');
    return parts.length?parts.join(' ∪ '):'∅';
  }
  function formatMonotonic(arr){return arr.length?arr.map(formatInterval).join(' и '):'нет';}
  function evalModel(m,x){
    var p=m.params||{};
    switch(m.kind){
      case 'sqrt':{var rad=p.b*x+p.c;return rad<0?NaN:p.a*Math.sqrt(rad)+p.d;}
      case 'quadratic':return p.a*Math.pow(x-p.h,2)+p.k;
      case 'linear':return p.a*x+p.b;
      case 'constant':return p.value;
      case 'exponential':return p.a*Math.pow(p.base,p.b*x+p.c)+p.d;
      case 'log':{var arg=p.b*x+p.c;return arg<=0?NaN:p.a*Math.log(arg)/Math.log(p.base)+p.d;}
      case 'piecewise':{var b=m.branches.find(function(s){return (x>bound(s.lo)||(s.lc&&x===bound(s.lo)))&&(x<bound(s.hi)||(s.rc&&x===bound(s.hi)));});return b?evalModel(b.model,x):NaN;}
      default:return NaN;
    }
  }
  function evaluate(task,x){return evalModel(task.model||task,x);}
  function signsMonotone(domain,z,up,f){
    if(z===null){var v=f();return {positive:v>0?domain:EMPTY(),negative:v<0?domain:EMPTY()};}
    var left=clip(domain,NI,z),right=clip(domain,z,PI);
    return {positive:up?right:left,negative:up?left:right};
  }
  function viewport(points,extra){
    var xs=points.map(function(p){return p.x;}).concat([0]),ys=points.map(function(p){return p.y;}).concat([0]);
    if(extra)extra.forEach(function(p){xs.push(p.x);ys.push(p.y);});
    var xmin=Math.floor(Math.min.apply(null,xs))-1,xmax=Math.ceil(Math.max.apply(null,xs))+1;
    var ymin=Math.floor(Math.min.apply(null,ys))-1,ymax=Math.ceil(Math.max.apply(null,ys))+1;
    if(xmax-xmin<6){xmin-=2;xmax+=2;}if(ymax-ymin<5){ymin-=1;ymax+=2;}
    return [xmin,xmax,ymin,ymax];
  }
  var hints={
    sqrt:{domain:'Подкоренное выражение должно быть неотрицательным. Ноль под корнем разрешён.',points:'Выберите подкоренное выражение 0, 1, 4 или 9. Затем извлеките корень и выполните действия снаружи.',range:'Квадратный корень неотрицателен. Учтите знак перед корнем и число, прибавленное после него.',zeros:'Приравняйте весь y к нулю. Перед возведением в квадрат проверьте: квадратный корень не может быть отрицательным.',sign:'Нуль отделяет участки выше и ниже оси Ox. Сам нуль не входит в промежуток строгой положительности.',monotonicity:'Смотрите, растёт ли выражение под корнем при увеличении x. Минус перед корнем меняет направление.',parity:'Сначала проверьте, вместе ли с каждым x разрешён -x. Если область несимметрична, чётности и нечётности нет.'},
    quadratic:{domain:'Для многочлена допустимо любое действительное число.',points:'Найдите вершину. Возьмите по одному или два x слева и справа на одинаковом расстоянии от неё.',range:'Вершина даёт наименьший y при ветвях вверх и наибольший y при ветвях вниз. Значение вершины достигается.',zeros:'Решите квадратное уравнение или выделите квадрат. Если квадрат должен быть отрицательным, нулей нет.',sign:'Используйте нули и направление ветвей. Строгие промежутки не включают точки на оси Ox.',monotonicity:'Слева и справа от вершины направление разное. Назовите оба промежутка отдельно.',parity:'Симметрия относительно прямой x=h ещё не означает чётность. Для чётности нужна именно ось Oy.'},
    exponential:{domain:'Положительное основание можно возводить в любую действительную степень.',points:'Удобно получить в показателе -1, 0, 1 или 2. Помните: любое ненулевое число в нулевой степени равно 1.',range:'Положительная степень никогда не равна нулю. Найдите уровень, к которому график приближается, и не включайте его.',zeros:'Перенесите слагаемое снаружи степени. Положительная степень не может равняться нулю или отрицательному числу.',sign:'Если нуль есть, сравните значения по обе стороны. Если его нет, определите знак на одном допустимом x.',monotonicity:'Основание больше 1 даёт возрастание; между 0 и 1 - убывание. Минус перед степенью меняет направление.',parity:'Проверьте f(1) и f(-1): обычно не выполняется ни равенство значений, ни равенство противоположных значений.'},
    log:{domain:'Аргумент логарифма должен быть строго больше нуля. На границе, где аргумент равен нулю, точки нет.',points:'Задавайте аргумент равным 1/a, 1, a или a². Тогда логарифм равен -1, 0, 1 или 2.',range:'Логарифм может принимать любое действительное значение. Сдвиг по вертикали этого не меняет.',zeros:'Сначала оставьте логарифм один: logₐ b=c означает b=aᶜ. Не забудьте число снаружи логарифма.',sign:'Используйте нуль и направление графика. Оставайтесь внутри области определения.',monotonicity:'Смотрите и на основание, и на аргумент. Даже при основании больше 1 аргумент вида c-x меняет направление.',parity:'Область логарифмической функции в этих заданиях - полупрямая. Она несимметрична относительно нуля.'},
    piecewise:{domain:'Возьмите объединение разрешённых x всех строк. Дополнительно проверьте корень или логарифм внутри строки.',points:'Сначала по x выберите подходящую строку и только потом подставляйте. На границе работает строка со знаком равенства.',range:'Найдите значения y каждой части на её промежутке. Объедините результаты; скачок не всегда оставляет пропуск.',zeros:'Решите уравнение в каждой строке. Каждый найденный x обязан удовлетворять условию именно этой строки.',sign:'Рассмотрите части отдельно, затем объедините участки одного знака. Границы включайте только по условиям.',monotonicity:'У возрастающих частей может быть скачок вниз: тогда вся функция не возрастает. Постоянные участки называйте отдельно.',parity:'Проверьте симметрию всей функции, а не одной ветви. На симметричной области сравните f(-x) и f(x).'}
  };
  var tasks=[];
  function finish(t,xs){
    t.points=xs.map(function(x){var y=evaluate(t,x);return {x:x,y:y,xLabel:rational(x),yLabel:rational(y)};});
    t.viewport=t.viewport||viewport(t.points,t.endpoints);
    t.stepsHint=Object.assign({},hints[t.family]);
    t.stepsHint.placepoints='От точки x на горизонтальной оси двигайтесь вертикально до уровня y. Сначала проверьте, сколько обозначает одна клетка по каждой оси.';
    t.explanations=Object.assign({
      domain:'Допустимые x: '+formatSet(t.domain)+'.',
      points:'Подставляем x в формулу: '+t.points.map(function(p){return '('+p.xLabel+'; '+p.yLabel+')';}).join(', ')+'.',
      placepoints:'У точки (x; y) первая координата задаёт движение по горизонтали, вторая - по вертикали.',
      range:'Получаем значения y: '+formatSet(t.range)+'.',
      zeros:t.zeros.length?'Нули функции: x='+t.zeros.map(rational).join('; x=')+'.':'Нулей нет: y не может равняться нулю.',
      sign:'Выше Ox: '+formatSet(t.positive)+'. Ниже Ox: '+formatSet(t.negative)+'. Точки с y=0 не включаем.',
      monotonicity:'Возрастает: '+formatMonotonic(t.up)+'. Убывает: '+formatMonotonic(t.down)+'.'+(t.constant&&t.constant.length?' Постоянна: '+formatMonotonic(t.constant)+'.':''),
      parity:t.parity==='even'?'Область определения симметрична и f(-x)=f(x): функция чётная.':t.parity==='odd'?'Область определения симметрична и f(-x)=-f(x): функция нечётная.':'Функция ни чётная, ни нечётная.'
    },t.explanations||{});
    tasks.push(t);return t;
  }
  function rootTask(id,html,text,a,b,c,d,xs,ex){
    var edge=-c/b,domain=b>0?S(I(edge,PI,true,false)):S(I(NI,edge,false,true));
    var range=a>0?S(I(d,PI,true,false)):S(I(NI,d,false,true));
    var z=-d/a>=0?(Math.pow(-d/a,2)-c)/b:null,up=a*b>0;
    var signs=signsMonotone(domain,z,up,function(){return a*Math.sqrt(1)+d;});
    finish(Object.assign({id:id,family:'sqrt',title:'Квадратный корень',formulaHtml:'y = '+html,formulaText:'y = '+text,model:{kind:'sqrt',params:{a:a,b:b,c:c,d:d}},domain:domain,range:range,zeros:z===null?[]:[z],up:up?domain.intervals:[],down:up?[]:domain.intervals,constant:[],parity:'neither',asymptotes:[],endpoints:[{x:edge,y:d,closed:true}],explanations:Object.assign({domain:'Подкоренное выражение не меньше нуля. Поэтому D(f)='+formatSet(domain)+'. Граничная точка включена: √0 существует.',range:'Корень неотрицателен; учитываем множитель и сдвиг. E(f)='+formatSet(range)+'. Значение '+rational(d)+' достигается при x='+rational(edge)+'.',parity:'Область определения несимметрична относительно нуля, поэтому функция ни чётная, ни нечётная.'},ex||{})},signs),xs);
  }
  rootTask('B1',sqrtHtml('x + 2'),'√(x+2)',1,1,2,0,[-2,-1,2,7]);
  rootTask('B2',sqrtHtml('x − 3'),'√(x-3)',1,1,-3,0,[3,4,7,12]);
  rootTask('B3',sqrtHtml('x')+' + 2','√x+2',1,1,0,2,[0,1,4,9],{zeros:'√x≥0, поэтому √x+2≥2. Нулей нет.'});
  rootTask('B4',sqrtHtml('x')+' − 2','√x-2',1,1,0,-2,[0,1,4,9],{zeros:'√x-2=0 ⇒ √x=2 ⇒ x=4.'});
  rootTask('B5','1 + '+sqrtHtml('2x'),'1+√(2x)',1,2,0,1,[0,0.5,2,4.5],{zeros:'1+√(2x)≥1. Нулей нет; 1 - минимум y, а не нуль функции.'});
  rootTask('B6',sqrtHtml('3 − x'),'√(3-x)',1,-1,3,0,[3,2,-1,-6],{monotonicity:'При увеличении x выражение 3-x уменьшается. Функция убывает на (-∞; 3].'});
  rootTask('B7','−'+sqrtHtml('x + 1'),'−√(x+1)',-1,1,1,0,[-1,0,3,8]);
  rootTask('B8','2 − '+sqrtHtml('x − 1'),'2-√(x-1)',-1,1,-1,2,[1,2,5,10],{zeros:'2-√(x-1)=0 ⇒ √(x-1)=2 ⇒ x-1=4 ⇒ x=5.'});

  function quadTask(id,html,text,a,h,k,xs){
    var q=-k/a,zeros=q<0?[]:q===0?[h]:[h-Math.sqrt(q),h+Math.sqrt(q)];
    var positive=EMPTY(),negative=EMPTY();
    if(zeros.length===2){var middle=S(I(zeros[0],zeros[1])),outside=S(I(NI,zeros[0]),I(zeros[1],PI));positive=a>0?outside:middle;negative=a>0?middle:outside;}
    else if(zeros.length===1){var except=S(I(NI,h),I(h,PI));positive=a>0?except:EMPTY();negative=a<0?except:EMPTY();}
    else {positive=k>0?ALL():EMPTY();negative=k<0?ALL():EMPTY();}
    finish({id:id,family:'quadratic',title:'Парабола',formulaHtml:'y = '+html,formulaText:'y = '+text,model:{kind:'quadratic',params:{a:a,h:h,k:k}},domain:ALL(),range:a>0?S(I(k,PI,true,false)):S(I(NI,k,false,true)),zeros:zeros,positive:positive,negative:negative,up:[a>0?I(h,PI,true,false):I(NI,h,false,true)],down:[a>0?I(NI,h,false,true):I(h,PI,true,false)],constant:[],parity:h===0?'even':'neither',asymptotes:[],endpoints:[],vertex:{x:h,y:k},explanations:{domain:'Квадратичная функция определена для любого x: D(f)=ℝ.',points:'Вершина ('+rational(h)+'; '+rational(k)+'). Точки по обе стороны на одинаковом расстоянии от x='+rational(h)+' имеют одинаковый y.',range:'Вершина ('+rational(h)+'; '+rational(k)+'), ветви '+(a>0?'вверх. Это минимум':'вниз. Это максимум')+' y. Значение вершины включаем.',zeros:zeros.length?'Решаем '+rational(a)+'·(x−('+rational(h)+'))²+'+rational(k)+'=0. Получаем x='+zeros.map(rational).join(' и x=')+'.':'Квадрат должен был бы равняться '+rational(q)+', но квадрат неотрицателен. Нулей нет.',parity:h===0?'Ось симметрии - Oy, D(f)=ℝ и f(-x)=f(x). Функция чётная.':'Ось симметрии x='+rational(h)+' не совпадает с Oy. Функция ни чётная, ни нечётная.'}},xs);
  }
  quadTask('C1','x<sup>2</sup> − 4x + 3','x²-4x+3',1,2,-1,[0,1,2,3,4]);
  quadTask('C2','x<sup>2</sup> + 2x − 3','x²+2x-3',1,-1,-4,[-3,-2,-1,0,1]);
  quadTask('C3','(x − 2)<sup>2</sup> + 1','(x-2)²+1',1,2,1,[0,1,2,3,4]);
  quadTask('C4','−(x + 1)<sup>2</sup> + 4','-(x+1)²+4',-1,-1,4,[-3,-2,-1,0,1]);
  quadTask('C5','x<sup>2</sup> − 2x + 10','x²-2x+10',1,1,9,[-1,0,1,2,3]);
  quadTask('C6','−x<sup>2</sup> + 4x','-x²+4x',-1,2,4,[0,1,2,3,4]);
  quadTask('C7','2x<sup>2</sup> − 8','2x²-8',2,0,-8,[-2,-1,0,1,2]);
  quadTask('C8','−2(x − 1)<sup>2</sup> − 3','-2(x-1)²-3',-2,1,-3,[-1,0,1,2,3]);

  function expTask(id,html,text,a,base,b,c,d,xs){
    var up=a*b*Math.log(base)>0,z=-d/a>0?(Math.log(-d/a)/Math.log(base)-c)/b:null;
    var model={kind:'exponential',params:{a:a,base:base,b:b,c:c,d:d}};
    var signs=signsMonotone(ALL(),z,up,function(){return evalModel(model,0);});
    finish(Object.assign({id:id,family:'exponential',title:'Показательная функция',formulaHtml:'y = '+html,formulaText:'y = '+text,model:model,domain:ALL(),range:a>0?S(I(d,PI)):S(I(NI,d)),zeros:z===null?[]:[z],up:up?[I(NI,PI)]:[],down:up?[]:[I(NI,PI)],constant:[],parity:'neither',asymptotes:[{axis:'y',value:d}],endpoints:[],explanations:{domain:'Основание положительно. Показатель может быть любым: D(f)=ℝ.',range:'Степень всегда положительна. Прямая y='+rational(d)+' - горизонтальная асимптота; этот уровень не достигается.',zeros:z===null?'Для y=0 степень должна была бы равняться '+rational(-d/a)+'. Положительная степень такому значению не равна: нулей нет.':'При y=0 степень равна '+rational(-d/a)+'. Решение: x='+rational(z)+'.',monotonicity:'Основание '+rational(base)+(base>1?' больше 1':' между 0 и 1')+(a<0?'; знак минус перед степенью меняет направление':'')+'. Поэтому функция '+(up?'возрастает':'убывает')+' на ℝ.',parity:'Для x=1 и x=-1 не выполняются ни f(-x)=f(x), ни f(-x)=-f(x). Функция ни чётная, ни нечётная.'}},signs),xs);
  }
  expTask('D1','2<sup>x</sup>','2^x',1,2,1,0,0,[-1,0,1,2]);
  expTask('D2','('+frac(1,2)+')<sup>x</sup>','(1/2)^x',1,0.5,1,0,0,[-1,0,1,2]);
  expTask('D3','2<sup>x−1</sup>','2^(x-1)',1,2,1,-1,0,[0,1,2,3]);
  expTask('D4','3<sup>x</sup> − 1','3^x-1',1,3,1,0,-1,[-1,0,1,2]);
  expTask('D5','('+frac(1,2)+')<sup>x</sup> + 2','(1/2)^x+2',1,0.5,1,0,2,[-1,0,1,2]);
  expTask('D6','2 − 2<sup>x</sup>','2-2^x',-1,2,1,0,2,[-1,0,1,2]);
  expTask('D7','('+frac(3,2)+')<sup>x−2</sup> + 2','(3/2)^(x-2)+2',1,1.5,1,-2,2,[1,2,3,4]);
  expTask('D8','('+frac(1,3)+')<sup>x+1</sup> − 1','(1/3)^(x+1)-1',1,1/3,1,1,-1,[-2,-1,0,1]);

  function logTask(id,html,text,a,base,b,c,d,xs){
    var edge=-c/b,domain=b>0?S(I(edge,PI)):S(I(NI,edge));
    var z=(Math.pow(base,-d/a)-c)/b,up=a*b/Math.log(base)>0;
    var signs=signsMonotone(domain,z,up);
    finish(Object.assign({id:id,family:'log',title:'Логарифмическая функция',formulaHtml:'y = '+html,formulaText:'y = '+text,model:{kind:'log',params:{a:a,base:base,b:b,c:c,d:d}},domain:domain,range:ALL(),zeros:[z],up:up?domain.intervals:[],down:up?[]:domain.intervals,constant:[],parity:'neither',asymptotes:[{axis:'x',value:edge}],endpoints:[],explanations:{domain:'Аргумент строго больше нуля. D(f)='+formatSet(domain)+'. Прямая x='+rational(edge)+' - асимптота, не часть графика.',range:'Логарифм принимает любые действительные значения. E(f)=ℝ.',zeros:'При y=0 логарифм равен '+rational(-d/a)+'. Значит, его аргумент равен '+rational(Math.pow(base,-d/a))+', откуда x='+rational(z)+'.',monotonicity:'Основание '+rational(base)+(base>1?' больше 1':' между 0 и 1')+(b<0?'; аргумент уменьшается при росте x':'')+(a<0?'; знак минус перед логарифмом меняет направление':'')+'. В результате функция '+(up?'возрастает':'убывает')+' на '+formatSet(domain)+'.',parity:'Область определения несимметрична относительно нуля. Функция ни чётная, ни нечётная.'}},signs),xs);
  }
  logTask('E1','log<sub>2</sub>(x + 1)','log₂(x+1)',1,2,1,1,0,[-0.5,0,1,3]);
  logTask('E2','log<sub>2</sub>(x − 2)','log₂(x-2)',1,2,1,-2,0,[2.5,3,4,6]);
  logTask('E3','log<sub>3</sub>x + 1','log₃x+1',1,3,1,0,1,[1/3,1,3,9]);
  logTask('E4','log<sub>2</sub>(3 − x)','log₂(3-x)',1,2,-1,3,0,[-1,1,2,2.5]);
  logTask('E5','log<sub>'+frac(1,2)+'</sub>x','log_(1/2)x',1,0.5,1,0,0,[0.5,1,2,4]);
  logTask('E6','log<sub>'+frac(2,3)+'</sub>(x + 1)','log_(2/3)(x+1)',1,2/3,1,1,0,[-5/9,-1/3,0,0.5]);
  logTask('E7','log<sub>3</sub>(x + 1) + 1','log₃(x+1)+1',1,3,1,1,1,[-2/3,0,2,8]);
  logTask('E8','2 − log<sub>2</sub>(x − 1)','2-log₂(x-1)',-1,2,1,-1,2,[2,3,5,9]);

  function branch(kind,params,lo,hi,lc,rc,html,text){return {model:{kind:kind,params:params},lo:lo,hi:hi,lc:!!lc,rc:!!rc,formulaHtml:html,formulaText:text||html};}
  function linear(a,b,lo,hi,lc,rc,html,text){return branch('linear',{a:a,b:b},lo,hi,lc,rc,html,text);}
  function condition(br){return br.lo===NI?'x '+(br.rc?'≤':'<')+' '+rational(br.hi):br.hi===PI?'x '+(br.lc?'≥':'>')+' '+rational(br.lo):rational(br.lo)+' '+(br.lc?'≤':'<')+' x '+(br.rc?'≤':'<')+' '+rational(br.hi);}
  function pieceTask(id,branches,props,xs){
    var html='<span class="piecewise"><span>f(x) = </span><span class="cases">'+branches.map(function(b){return '<span class="case"><span>'+b.formulaHtml+'</span><span>при '+condition(b).replace(/</g,'&lt;')+'</span></span>';}).join('')+'</span></span>';
    var t=Object.assign({id:id,family:'piecewise',title:'Функция по частям',formulaHtml:html,formulaText:'f(x): '+branches.map(function(b){return b.formulaText+' при '+condition(b);}).join('; '),model:{kind:'piecewise',branches:branches},domain:ALL(),constant:[],asymptotes:[],parity:'neither'},props);
    t.explanations=Object.assign({domain:'Объединяем условия всех строк: D(f)='+formatSet(t.domain)+'.',points:'Для каждого x сначала выбираем строку по её условию. Граница принадлежит строке, в которой стоит знак равенства.'},t.explanations||{});
    finish(t,xs);
  }
  pieceTask('F1',[linear(1,2,NI,0,false,false,'x + 2'),linear(-1,2,0,PI,true,false,'2 − x','2-x')],{range:S(I(NI,2,false,true)),zeros:[-2,2],positive:S(I(-2,2)),negative:S(I(NI,-2),I(2,PI)),up:[I(NI,0,false,true)],down:[I(0,PI,true,false)],parity:'even',endpoints:[{x:0,y:2,closed:true}],explanations:{range:'Обе части сходятся в (0; 2). Это максимум: E(f)=(-∞; 2].',parity:'f(x)=2-|x|. Область ℝ симметрична; f(-x)=f(x). Функция чётная.'}},[-2,0,2,3]);
  pieceTask('F2',[linear(-1,0,NI,1,false,false,'−x','-x'),linear(1,-2,1,PI,true,false,'x − 2','x-2')],{range:S(I(-1,PI,true,false)),zeros:[0,2],positive:S(I(NI,0),I(2,PI)),negative:S(I(0,2)),up:[I(1,PI,true,false)],down:[I(NI,1,false,true)],endpoints:[{x:1,y:-1,closed:true}],explanations:{range:'Части сходятся в (1; -1). Минимум y=-1, поэтому E(f)=[-1; +∞).',parity:'f(x)=|x-1|-1. Ось симметрии x=1 не совпадает с Oy. Функция ни чётная, ни нечётная.'}},[-1,0,1,2,3]);
  pieceTask('F3',[linear(1,1,NI,2,false,false,'x + 1'),linear(2,-2,2,PI,true,false,'2x − 2','2x-2')],{range:ALL(),zeros:[-1],positive:S(I(-1,PI)),negative:S(I(NI,-1)),up:[I(NI,2),I(2,PI,true,false)],down:[],endpoints:[{x:2,y:3,closed:false},{x:2,y:2,closed:true}],explanations:{range:'Первая часть даёт y<3, вторая - y≥2. Вместе они покрывают все y: E(f)=ℝ.',zeros:'В первой строке x+1=0 даёт x=-1, это подходит. Вторая даёт x=1, но 1<2, поэтому этот корень отбрасываем.',monotonicity:'Части возрастают на (-∞; 2) и [2; +∞). Но при x=2 скачок вниз: вся функция на ℝ не возрастает. Например, f(1,9)=2,9>f(2)=2.'}},[-1,0,2,3]);
  pieceTask('F4',[linear(2,-2,NI,2,false,false,'2x − 2','2x-2'),linear(1,1,2,PI,true,false,'x + 1')],{range:S(I(NI,2),I(3,PI,true,false)),zeros:[1],positive:S(I(1,PI)),negative:S(I(NI,1)),up:[I(NI,PI)],down:[],endpoints:[{x:2,y:2,closed:false},{x:2,y:3,closed:true}],explanations:{range:'Слева y<2, справа y≥3. E(f)=(-∞; 2) ∪ [3; +∞). Значения от 2 включительно до 3 не достигаются.',monotonicity:'Обе части возрастают, а скачок при x=2 направлен вверх. Поэтому функция строго возрастает на всей ℝ.'}},[0,1,2,3]);
  pieceTask('F5',[linear(-1,-3,NI,-3,false,false,'−x − 3','-x-3'),linear(1,3,-3,0,true,false,'x + 3'),linear(-2,3,0,3,true,false,'−2x + 3','-2x+3'),linear(0.5,-4.5,3,PI,true,false,frac('x',2)+' − '+frac(9,2),'x/2-9/2')],{range:S(I(-3,PI,true,false)),zeros:[-3,1.5,9],positive:S(I(NI,-3),I(-3,1.5),I(9,PI)),negative:S(I(1.5,9)),up:[I(-3,0,true,true),I(3,PI,true,false)],down:[I(NI,-3,false,true),I(0,3,true,true)],endpoints:[{x:-3,y:0,closed:true},{x:0,y:3,closed:true},{x:3,y:-3,closed:true}],explanations:{range:'Все соседние части сходятся. Нижняя точка (3; -3) даёт минимум, а сверху график не ограничен: E(f)=[-3; +∞).',zeros:'Проверяем корни по условиям строк: подходят x=-3, x=3/2 и x=9.',monotonicity:'Читаем слева направо: убывает до -3; возрастает от -3 до 0; убывает от 0 до 3; возрастает после 3.'}},[-3,0,1.5,3,9]);
  pieceTask('F6',[branch('quadratic',{a:1,h:0,k:0},NI,1,false,false,'x<sup>2</sup>','x²'),linear(1,1,1,PI,true,false,'x + 1')],{range:S(I(0,PI,true,false)),zeros:[0],positive:S(I(NI,0),I(0,PI)),negative:EMPTY(),up:[I(0,PI,true,false)],down:[I(NI,0,false,true)],endpoints:[{x:1,y:1,closed:false},{x:1,y:2,closed:true}],explanations:{range:'Левая ветвь параболы уже даёт все y≥0. Поэтому скачок при x=1 не создаёт пропуска в E(f)=[0; +∞).',monotonicity:'До x=0 парабола убывает. После 0 обе части возрастают, а скачок при 1 направлен вверх: возрастает на [0; +∞).'}},[-2,0,1,2]);
  pieceTask('F7',[branch('sqrt',{a:1,b:1,c:0,d:0},0,4,true,false,sqrtHtml('x'),'√x'),branch('constant',{value:3},4,PI,true,false,'3')],{domain:S(I(0,PI,true,false)),range:{intervals:[I(0,2,true,false)],points:[3]},zeros:[0],positive:S(I(0,PI)),negative:EMPTY(),up:[I(0,4,true,true)],down:[],constant:[I(4,PI,true,false)],endpoints:[{x:0,y:0,closed:true},{x:4,y:2,closed:false},{x:4,y:3,closed:true}],explanations:{range:'Корень при 0≤x<4 даёт 0≤y<2. Вторая часть добавляет только число 3: E(f)=[0; 2) ∪ {3}. Значение 2 не достигается.',monotonicity:'Строго возрастает на [0; 4], включая скачок вверх в x=4. Затем постоянна на [4; +∞). На всей области только не убывает.',parity:'D(f)=[0; +∞) несимметрична: функция ни чётная, ни нечётная.'}},[0,1,4,5]);
  pieceTask('F8',[branch('constant',{value:-2},NI,-1,false,false,'−2','-2'),linear(1,1,-1,2,true,true,'x + 1'),branch('constant',{value:3},2,PI,false,false,'3')],{range:{intervals:[I(0,3,true,true)],points:[-2]},zeros:[-1],positive:S(I(-1,PI)),negative:S(I(NI,-1)),up:[I(-1,2,true,true)],down:[],constant:[I(NI,-1),I(2,PI,true,false)],endpoints:[{x:-1,y:-2,closed:false},{x:-1,y:0,closed:true},{x:2,y:3,closed:true}],explanations:{range:'Первая часть даёт только -2; средняя - от 0 до 3 включительно; правая новых y не добавляет. E(f)={-2} ∪ [0; 3].',monotonicity:'Возрастает на [-1; 2], постоянна на (-∞; -1) и [2; +∞). На всей ℝ не убывает, но строго возрастающей не является.'}},[-2,-1,0,2,3]);

  var diagnostics=[
    {id:'A1',promptText:'Для y=√(x-4) найдите область определения. Входит ли x=4?',options:['[4; +∞), входит','(4; +∞), не входит','(-∞; 4], входит'],correct:0,family:'sqrt',explanation:'x-4≥0 ⇒ x≥4. √0 существует: граница включена.'},
    {id:'A2',promptText:'Для y=log₂(x-4) найдите область определения. Входит ли x=4?',options:['[4; +∞), входит','(4; +∞), не входит','ℝ, входит'],correct:1,family:'log',explanation:'x-4>0 ⇒ x>4. Логарифм нуля не определён.'},
    {id:'A3',promptText:'Где начинается график y=√(x+3)?',options:['(3; 0)','(0; 3)','(-3; 0)'],correct:2,family:'sqrt',explanation:'x+3=0 ⇒ x=-3; y=0. Начальная точка (-3; 0).'},
    {id:'A4',promptText:'Найдите нуль y=log₃(x+2). В ответе нужно значение x.',options:['x=-1','x=0','x=-2'],correct:0,family:'log',explanation:'log₃(x+2)=0 ⇒ x+2=1 ⇒ x=-1.'},
    {id:'A5',promptText:'Есть ли нули у y=1+√(2x)? Чему равен минимум y?',options:['Нуль x=0; минимум 0','Нулей нет; минимум 1','Нуль x=1; минимума нет'],correct:1,family:'sqrt',explanation:'Корень неотрицателен, поэтому y≥1. Минимум 1 при x=0; нулей нет.'},
    {id:'A6',promptText:'Какова область значений y=2ˣ+3?',options:['[3; +∞)','ℝ','(3; +∞)'],correct:2,family:'exponential',explanation:'2ˣ>0 при любом x. Значит, y>3; значение 3 не достигается.'},
    {id:'A7',promptText:'f(x)=x+1 при x<2; f(x)=2x-2 при x≥2. Найдите f(2).',options:['2','3','Оба значения: 2 и 3'],correct:0,family:'piecewise',explanation:'При x=2 работает условие x≥2. f(2)=2·2-2=2.'},
    {id:'A8',promptText:'Укажите чётность функций: y=x²; y=x³; y=√x.',options:['Все три чётные','Чётная; нечётная; ни та ни другая','Чётная; нечётная; чётная'],correct:1,family:'quadratic',explanation:'(-x)²=x², (-x)³=-x³. Область √x несимметрична относительно нуля.'}
  ];
  diagnostics.forEach(function(d){
    d.promptHtml=d.promptText.replace(/</g,'&lt;').replace(/>/g,'&gt;');
    d.questionHtml=d.promptHtml;
    d.optionItems=d.options.map(function(label,i){return {id:String(i),labelHtml:label.replace(/</g,'&lt;').replace(/>/g,'&gt;')};});
    d.correctId=String(d.correct);
    d.recommendFamily=d.family;
  });
  var families=[
    {id:'sqrt',title:'Квадратный корень',prefix:'B',idea:'Под корнем ≥0. Удобные числа: 0, 1, 4, 9.',firstTask:'B1'},
    {id:'quadratic',title:'Парабола',prefix:'C',idea:'Вершина, симметричные точки, направление ветвей.',firstTask:'C1'},
    {id:'exponential',title:'Показательная',prefix:'D',idea:'Степень положительна; асимптота может не достигаться.',firstTask:'D1'},
    {id:'log',title:'Логарифм',prefix:'E',idea:'Аргумент >0. Удобные значения: 1/a, 1, a, a².',firstTask:'E1'},
    {id:'piecewise',title:'По частям',prefix:'F',idea:'Сначала выберите строку по x; затем вычисляйте y.',firstTask:'F1'}
  ];
  return {version:1,tasks:tasks,diagnostics:diagnostics,families:families,evaluate:evaluate,evalModel:evalModel,contains:contains,formatSet:formatSet,formatInterval:formatInterval,formatMonotonic:formatMonotonic,formatNumber:rational,numberHtml:numHtml};
});

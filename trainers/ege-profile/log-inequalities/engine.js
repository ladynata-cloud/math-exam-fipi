/* Author-created logarithmic inequalities. Native MathML; no external dependencies. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LogInequalities = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const N = value => ({ op: 'num', value });
  const X = { op: 'var' };
  const node = (op, ...args) => ({ op, args: args.map(a => typeof a === 'number' ? N(a) : a) });
  const add = (a,b) => typeof b==='number'&&b<0?node('sub',a,-b):node('add',a,b);
  const sub = (a,b) => typeof b==='number'&&b<0?node('add',a,-b):node('sub',a,b);
  const mul = (a,b) => node('mul',a,b), div = (a,b) => node('div',a,b);
  const pow = (a,b) => node('pow',a,b), log = (a,b) => node('log',a,b);
  const abs = a => node('abs',a), sqrt = a => node('sqrt',a);
  const product = (...a) => a.reduce(mul);
  const sq = a => pow(a,2), neg = a => mul(-1,a);
  const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  const relationSymbol = { gt:'>', ge:'≥', lt:'<', le:'≤', ne:'≠' };
  const relations = ['ge','lt','le','gt'];
  function formatNumber(n) {
    if (n === Infinity) return '+∞';
    if (n === -Infinity) return '−∞';
    if (Object.is(n,-0) || Math.abs(n) < 1e-13) return '0';
    if (!Number.isFinite(n)) return '—';
    const sign = n < 0 ? '−' : '', v = Math.abs(n);
    for (let d=1;d<=10000;d++) {
      const p=Math.round(v*d);
      if (Math.abs(v-p/d)<1e-10) return sign+p+(d===1?'':'/'+d);
    }
    return sign+String(Number(v.toPrecision(8))).replace('.',',');
  }
  function textExpr(a) {
    if(a.op==='num') return formatNumber(a.value);
    if(a.op==='var') return 'x';
    const [u,v]=a.args, t=textExpr;
    if(a.op==='add') return '('+t(u)+' + '+t(v)+')';
    if(a.op==='sub') return '('+t(u)+' − '+t(v)+')';
    if(a.op==='mul') return t(u)+'·'+t(v);
    if(a.op==='div') return '('+t(u)+')/('+t(v)+')';
    if(a.op==='pow') return '('+t(u)+')^'+t(v);
    if(a.op==='log') return 'log_('+t(u)+')('+t(v)+')';
    if(a.op==='abs') return '|'+t(u)+'|';
    if(a.op==='sqrt') return '√('+t(u)+')';
    throw Error('Unknown expression');
  }
  function mml(a,parent=0) {
    if(a.op==='num') {
      const s=formatNumber(a.value);
      if(s.includes('/')) {const p=s.split('/');return '<mfrac><mn>'+esc(p[0])+'</mn><mn>'+p[1]+'</mn></mfrac>';}
      return '<mn>'+esc(s)+'</mn>';
    }
    if(a.op==='var') return '<mi>x</mi>';
    const [u,v]=a.args, par=s=>'<mrow><mo>(</mo>'+s+'<mo>)</mo></mrow>';
    if(a.op==='div') return '<mfrac>'+mml(u)+mml(v)+'</mfrac>';
    // The square of a logarithm must not look like a square of its argument.
    if(a.op==='pow') return '<msup>'+(u.op==='log'?par(mml(u)):mml(u,4))+mml(v)+'</msup>';
    if(a.op==='sqrt') return '<msqrt>'+mml(u)+'</msqrt>';
    if(a.op==='abs') return '<mrow><mo>|</mo>'+mml(u)+'<mo>|</mo></mrow>';
    if(a.op==='log') return '<mrow><msub><mi mathvariant="normal">log</mi>'+mml(u)+'</msub>'+par(mml(v))+'</mrow>';
    const level=a.op==='mul'?2:1;
    const symbol=a.op==='mul'?'·':a.op==='add'?'+':'−';
    const body='<mrow>'+mml(u,level)+'<mo>'+symbol+'</mo>'+mml(v,a.op==='sub'?level+1:level)+'</mrow>';
    return level<parent?par(body):body;
  }
  function math(a,op,b) {
    const label=textExpr(a)+(op?' '+relationSymbol[op]+' '+textExpr(typeof b==='number'?N(b):b):'');
    return '<math xmlns="http://www.w3.org/1998/Math/MathML" aria-label="'+esc(label)+'"><mrow>'+mml(a)+(op?'<mo>'+esc(relationSymbol[op])+'</mo>'+mml(typeof b==='number'?N(b):b):'')+'</mrow></math>';
  }
  function rawEval(a,x) {
    if(a.op==='num') return a.value;
    if(a.op==='var') return x;
    const u=rawEval(a.args[0],x), v=a.args.length>1?rawEval(a.args[1],x):0;
    if(!Number.isFinite(u)||!Number.isFinite(v)) return NaN;
    switch(a.op) {
      case 'add':return u+v; case 'sub':return u-v; case 'mul':return u*v;
      case 'div':return v===0?NaN:u/v;
      case 'pow':return Math.pow(u,v);
      case 'abs':return Math.abs(u);
      case 'sqrt':return u<0?NaN:Math.sqrt(u);
      case 'log':return u>0&&u!==1&&v>0?Math.log(v)/Math.log(u):NaN;
      default:return NaN;
    }
  }
  const condition = (left,op,right,why) => ({left:typeof left==='number'?N(left):left,op,right:typeof right==='number'?N(right):right,why});
  const positive = (a,why) => condition(a,'gt',0,why||'Аргумент логарифма должен быть положительным.');
  const nonunit = (a,why) => condition(a,'ne',1,why||'Основание логарифма не может равняться 1.');
  const nonzero = (a,why) => condition(a,'ne',0,why||'Исходный знаменатель не может равняться нулю.');
  function logDomain(a,b) {return [positive(a,'Основание логарифма должно быть положительным.'),nonunit(a),positive(b)];}
  function holds(value,op) {return op==='gt'?value>1e-9:op==='ge'?value>=-1e-9:op==='lt'?value<-1e-9:value<=1e-9;}
  function domainOK(conditions,x) {
    return conditions.every(c=>{
      const a=rawEval(c.left,x),b=rawEval(c.right,x);
      if(!Number.isFinite(a)||!Number.isFinite(b)) return false;
      return c.op==='ne'?Math.abs(a-b)>1e-11:c.op==='gt'?a>b+1e-11:a<b-1e-11;
    });
  }
  function sampleCell(points,i) {
    if(i%2) return points[(i-1)/2].value;
    const j=i/2;
    if(!j)return points[0].value-Math.max(1,Math.abs(points[0].value)*0.3);
    if(j===points.length)return points[j-1].value+Math.max(1,Math.abs(points[j-1].value)*0.3);
    return (points[j-1].value+points[j].value)/2;
  }
  function formatSet(task,cells) {
    const p=task.criticalPoints, expected=2*p.length+1;
    if(!Array.isArray(cells)||cells.length!==expected) throw Error('Wrong number of cells');
    const parts=[];
    for(let i=0;i<cells.length;i++) {
      if(!cells[i])continue;
      const start=i;while(i+1<cells.length&&cells[i+1])i++;
      const end=i;
      if(start===end&&start%2){parts.push('{'+p[(start-1)/2].label+'}');continue;}
      const left=start===0?'−∞':p[start%2?(start-1)/2:start/2-1].label;
      const right=end===expected-1?'+∞':p[end%2?(end-1)/2:end/2].label;
      parts.push((start%2?'[':'(')+left+'; '+right+(end%2?']':')'));
    }
    return parts.length?parts.join(' ∪ '):'∅';
  }
  const families = [
    {id:'sign',title:'Знак логарифма',goal:'Связать знак логарифма с основанием и аргументом.',rule:'На ОДЗ знак log_A B совпадает со знаком (A−1)(B−1).',prerequisite:'Определение логарифма и метод интервалов.'},
    {id:'compare',title:'Сравнение с единицей',goal:'Заменить 1 логарифмом того же основания.',rule:'Сначала log_A B−1=log_A(B/A), затем сравниваем B и A с учётом основания.',prerequisite:'log_A A=1; знак логарифма.'},
    {id:'multiplier',title:'Множитель перед логарифмом',goal:'Сохранить знак множителя и кратность корня.',rule:'Множитель сохраняется: P·log_A B имеет знак P(A−1)(B−1) на ОДЗ.',prerequisite:'Знаки произведения; квадрат неотрицателен.'},
    {id:'reciprocal',title:'Взаимно обратные логарифмы',goal:'Использовать замену и не потерять отдельное решение.',rule:'При z=log_A B второй логарифм равен 1/z. После приведения к общему знаменателю возможен квадрат.',prerequisite:'Переход к новому основанию; дробно-рациональные неравенства.'},
    {id:'log-denominator',title:'Логарифм в знаменателе',goal:'Сохранить исходный запрет нулевого знаменателя.',rule:'Знак числителя и знаменателя исследуем отдельно; запрещённая точка остаётся запрещённой.',prerequisite:'Знак частного; степени и логарифмы.'},
    {id:'chain',title:'Цепочки произведений',goal:'Сократить логарифмы, сохранив всю исходную ОДЗ.',rule:'log_A B·log_B C=log_A C только там, где оба исходных логарифма определены.',prerequisite:'Формула перехода к новому основанию.'},
    {id:'collect',title:'Сначала собрать выражение',goal:'Упростить сумму до применения рационализации.',rule:'Сначала используем тождества, раскрываем скобки и собираем сумму. Рационализация отдельных слагаемых неверна.',prerequisite:'Свойства логарифмов; раскрытие скобок.'},
    {id:'modulus',title:'Модуль и логарифм',goal:'Решить задачу через y=|x−h| и вернуться к x.',rule:'Сначала y≥0, затем ОДЗ и интервалы по y; в конце возвращаем обе ветви модуля.',prerequisite:'Модуль; дробно-рациональные выражения.'},
    {id:'powers',title:'Степени и корень в основании',goal:'Привести логарифмы к одному основанию.',rule:'Учитываем положительность аргументов и равенство ln(u²)=2ln|u| при u≠0.',prerequisite:'Степенные свойства логарифмов; модуль.'},
    {id:'quadratic-log',title:'Квадратный трёхчлен от логарифма',goal:'Разложить выражение на множители после замены.',rule:'Обозначаем логарифм буквой, раскладываем трёхчлен, затем рационализируем произведение.',prerequisite:'Разложение квадратного трёхчлена; логарифмические тождества.'},
    {id:'nested',title:'Вложенный логарифм',goal:'Отдельно проверить внутренний и внешний логарифмы.',rule:'Значение внутреннего логарифма — основание внешнего: оно должно быть положительным и не равно 1.',prerequisite:'ОДЗ логарифма; знак логарифмической дроби.'},
    {id:'exponential-denominator',title:'Произведение и показательный знаменатель',goal:'Разложить числитель и исследовать знак знаменателя.',rule:'Сначала объединяем логарифм произведения и раскладываем числитель. При q>1 знак q^u−q^v совпадает со знаком u−v.',prerequisite:'Свойства логарифмов; монотонность показательной функции.'}
  ];
  const tasks=[], internal=new Map();
  function lessonText(text,params) {
    // Explanations use this task's numbers, rather than unexplained generator parameters.
    let out=String(text);
    for(const [key,value] of Object.entries(params)) {
      if(!/^[a-zDESR]$/.test(key)||key==='h')continue;
      const number=formatNumber(value);
      out=out.replace(new RegExp('(?<![A-Za-z0-9])'+key+'([A-Zxty])(?![A-Za-z0-9])','g'),number+'·$1');
      out=out.replace(new RegExp('(?<![A-Za-z0-9])'+key+'(?![A-Za-z0-9])','g'),number);
    }
    const h=params.h||0, t=h?'(x'+(h<0?'+':'−')+formatNumber(Math.abs(h))+')':'x';
    out=out.replace(/(?<![A-Za-z0-9])t(?![A-Za-z0-9])/g,t).replace(/\bh\b/g,formatNumber(h));
    return out.replace(/−−/g,'+').replace(/\+−/g,'−');
  }
  function aliasPreparation(familyId,spec) {
    const a=spec.primaryBase,b=spec.primaryArgument,p=spec.params;
    let aliases=[];
    if(['compare','multiplier','log-denominator'].includes(familyId))aliases=[['A',a],['B',b]];
    if(familyId==='reciprocal')aliases=[['U',a],['V',b]];
    if(familyId==='chain')aliases=[['A',a],['B',b],['C',add(X,p.c)]];
    if(familyId==='collect')aliases=[['A',a],['Q',b]];
    if(familyId==='modulus')aliases=[['y',a],['D',b.args[1]]];
    if(['powers','quadratic-log'].includes(familyId))aliases=[['A',b]];
    if(familyId==='exponential-denominator')aliases=[['A',b],['B',sub(p.c,X)]];
    if(!aliases.length)return null;
    const text=aliases.map(([name,expr])=>name+' = '+textExpr(expr)).join('; ')+'. Это обозначения выражений, а не новые неизвестные.';
    const html=aliases.map(([name,expr])=>'<math xmlns="http://www.w3.org/1998/Math/MathML" aria-label="'+esc(name+' = '+textExpr(expr))+'"><mrow><mi>'+name+'</mi><mo>=</mo>'+mml(expr)+'</mrow></math>').join('<span>; </span>');
    return {title:'Обозначения в разборе',text,html};
  }
  function finish(familyId,variant,spec) {
    const f=families.find(a=>a.id===familyId);
    const seen=new Set(), conditions=spec.conditions.filter(c=>{const key=JSON.stringify([c.left,c.op,c.right]);if(seen.has(key))return false;seen.add(key);return true;});
    const values=spec.critical.sort((a,b)=>a-b).filter((v,i,a)=>!i||Math.abs(v-a[i-1])>1e-9);
    const criticalPoints=values.map(value=>({value,label:formatNumber(value)}));
    const probes=[];
    for(let i=0;i<2*values.length+1;i++)probes.push(sampleCell(criticalPoints,i));
    for(let k=-100;k<=200;k++)probes.push((k/7)+(spec.params.h||0));
    const validProbes=probes.filter(x=>domainOK(conditions,x)&&Number.isFinite(rawEval(spec.original,x)));
    if(!validProbes.length)throw Error('Empty test domain '+familyId);
    const domainChoices=conditions.map((c,i)=>({id:'d'+i,html:math(c.left,c.op,c.right),text:textExpr(c.left)+' '+relationSymbol[c.op]+' '+textExpr(c.right),correct:true,why:c.why,condition:{left:c.left,op:c.op,right:c.right}}));
    // These distractors impose an actual extra restriction, checked against the original domain.
    for(const [i,a] of [spec.primaryBase,spec.primaryArgument].entries()) {
      const high=validProbes.some(x=>rawEval(a,x)<=1+1e-9), op=high?'gt':'lt';
      const c=condition(a,op,1,'');
      domainChoices.push({id:'wrong-domain-'+i,html:math(a,op,1),text:textExpr(a)+' '+relationSymbol[op]+' 1',correct:false,why:i===0?'Основание должно быть положительным и не равняться 1. Требование находиться только по одну сторону от 1 здесь исключает допустимые значения x.':'Аргумент должен быть положительным. Сравнивать его с 1 для определения ОДЗ не требуется: это потеряет допустимые значения x.',condition:c});
    }
    const candidates=[...spec.wrong, {ast:neg(spec.rational),why:'При умножении всего выражения на −1 нужно изменить знак неравенства на противоположный.'}];
    const truth=ast=>validProbes.map(x=>holds(rawEval(ast,x),spec.relation)).join(',');
    const truthSeen=new Set([truth(spec.rational)]), wrong=[];
    for(const w of candidates){const signature=truth(w.ast);if(!truthSeen.has(signature)){truthSeen.add(signature);wrong.push(w);}if(wrong.length===2)break;}
    if(wrong.length!==2)throw Error('Need inequivalent distractors '+familyId+' '+variant);
    const choice=(ast,correct,why,id)=>({id,html:math(ast,spec.relation,0),text:textExpr(ast)+' '+relationSymbol[spec.relation]+' 0',correct,why,ast});
    const transformChoices=[choice(spec.rational,true,spec.transform,'right'),...wrong.map((w,i)=>choice(w.ast,false,w.why,'wrong-'+i))];
    // Rotate the correct choice so its position is not a hint.
    for(let j=0;j<variant%3;j++)transformChoices.push(transformChoices.shift());
    const words=text=>lessonText(text,spec.params);
    const preparation=spec.preparation.map(p=>({title:p.title,html:p.ast?math(p.ast):'<p>'+esc(words(p.text))+'</p>',text:words(p.text)}));
    const aliases=aliasPreparation(familyId,spec);if(aliases)preparation.unshift(aliases);
    for(const choice of transformChoices)choice.why=words(choice.why);
    const t={id:familyId+'-'+(variant+1),familyId,variant,formulaHtml:math(spec.left,spec.relation,spec.right),formulaText:textExpr(spec.left)+' '+relationSymbol[spec.relation]+' '+textExpr(typeof spec.right==='number'?N(spec.right):spec.right),relation:spec.relation,domainChoices,transformChoices,preparation,criticalPoints,domainCells:[],rationalSigns:[],solutionCells:[],answerText:'',params:spec.params,metadata:{originalAst:spec.original,rationalAst:spec.rational,domainConditions:conditions.map(c=>({left:c.left,op:c.op,right:c.right}))}};
    internal.set(t.id,{original:spec.original,rational:spec.rational,conditions,task:t});
    for(let i=0;i<2*values.length+1;i++) {
      const x=sampleCell(criticalPoints,i),defined=domainOK(conditions,x)&&Number.isFinite(rawEval(spec.original,x));
      const v=defined?rawEval(spec.rational,x):NaN;
      const sign=defined?(Math.abs(v)<1e-8?0:v<0?-1:1):null;
      t.domainCells.push(defined);t.rationalSigns.push(sign);t.solutionCells.push(defined&&holds(sign,spec.relation));
    }
    t.answerText=formatSet(t,t.solutionCells);
    t.explanation={domain:words(spec.domain),transform:words(spec.transform),critical:'Отметьте '+criticalPoints.map(p=>p.label).join('; ')+'. Вне ОДЗ выражение не определено. Нули и запрещённые точки отмечаем отдельно.',signs:words(spec.signs||'Определите знак каждого множителя на промежутках. В нуле чётной кратности знак не меняется. Запрещённые точки остаются выколотыми.'),answer:'Выбираем знаки, соответствующие '+relationSymbol[spec.relation]+' 0. Получаем: '+t.answerText+'.'};
    t.hints={domain:spec.domainHint||'Проверьте каждый исходный логарифм: основание > 0, основание ≠ 1, аргумент > 0. Затем отдельно проверьте исходные знаменатели.',transform:spec.transformHint||f.rule,critical:'Найдите нули множителей, границы ОДЗ и точки, в которых исходное выражение не существует. После сокращения запреты не исчезают.',signs:'Возьмите пробную точку внутри промежутка. Учитывайте каждый множитель; квадрат не меняет знак при прохождении через свой ноль.',answer:'При строгом неравенстве нули не входят. При нестрогом — входят, если принадлежат ОДЗ. Запрещённые точки не входят никогда.'};
    tasks.push(t);
  }

  for(let v=0;v<4;v++) {
    // 1. Basic sign. The boundary at argument=1 is distinct from both base boundaries.
    {const h=[0,1,-2,2][v],a=[2,3,4,5][v],b=[6,8,10,12][v],t=h?sub(X,h):X,A=t,B=div(add(t,a),b),R=mul(sub(A,1),sub(B,1)),rel=['le','gt','lt','ge'][v];
      finish('sign',v,{params:{h,a,b},left:log(A,B),right:0,original:log(A,B),rational:R,relation:rel,conditions:logDomain(A,B),primaryBase:A,primaryArgument:B,critical:[h-a,h,h+1,h+b-a],preparation:[{title:'Два изменения знака',text:'Основание и аргумент сравниваем с 1. Оба сравнения нужны одновременно.'}],domain:'Основание положительно и не равно 1; дробь в аргументе положительна. Знаменатель аргумента — положительная константа.',transform:'На исходной ОДЗ знак логарифма совпадает со знаком произведения (основание − 1)·(аргумент − 1).',wrong:[{ast:sub(B,1),why:'Здесь потерян знак основания минус 1. Для основания между 0 и 1 направление сравнения меняется.'},{ast:mul(sub(A,1),B),why:'Нуль логарифма соответствует аргументу 1, поэтому нужен множитель «аргумент − 1».'}]});}
    // 2. The quadratic argument is positive for all real t, by a negative discriminant.
    {const h=0,c=[4,7,11,16][v],r=v+1,s=v+2,t=X,A=add(t,c),B=add(A,mul(sub(t,r),sub(t,s))),R=product(sub(A,1),sub(t,r),sub(t,s)),L=log(A,B),rel=relations[v];
      finish('compare',v,{params:{h,c,r,s},left:L,right:1,original:sub(L,1),rational:R,relation:rel,conditions:logDomain(A,B),primaryBase:A,primaryArgument:B,critical:[-c,1-c,r,s],preparation:[{title:'Единица — тоже логарифм',text:'Запишите 1 = log_A A. Разность логарифмов равна логарифму отношения B/A.'},{title:'Сравнить аргумент и основание',text:'После вычитания основания из аргумента остаётся произведение двух линейных множителей.',ast:mul(sub(t,r),sub(t,s))}],domain:'Квадратичный аргумент положителен при любом x: его дискриминант отрицателен, старший коэффициент положителен. Ограничения основания остаются обязательными.',transform:'После переноса 1 знак разности логарифмов определяется произведением (A−1)(B−A). Положительный знаменатель A на ОДЗ не меняет знак.',wrong:[{ast:sub(B,1),why:'Справа стоит 1, а не 0: сравнивать нужно аргумент B с основанием A, а не с 1.'},{ast:mul(sub(t,r),sub(t,s)),why:'Потерян множитель A−1. Основание может быть между 0 и 1.'}]});}
    // 3. The squared factor contributes a zero but no sign change.
    {const h=0,a=v+2,r=v+2,b=v+4,t=X,A=add(t,a),B=add(sq(sub(t,b)),1),P=sub(t,r),L=mul(P,log(A,B)),R=product(P,sub(A,1),sq(sub(t,b))),rel=relations[v];
      finish('multiplier',v,{params:{h,a,r,b},left:L,right:0,original:L,rational:R,relation:rel,conditions:logDomain(A,B),primaryBase:A,primaryArgument:B,critical:[-a,1-a,r,b],preparation:[{title:'Сохранить внешний множитель',text:'Не делите неравенство на x−r без разбора его знака.'},{title:'Аргумент минус 1',text:'Разность аргумента и 1 — квадрат. В его нуле знак произведения не меняется.',ast:sq(sub(t,b))}],domain:'Аргумент — квадрат плюс 1, поэтому всегда положителен. Основание должно быть положительным и не равно 1.',transform:'Заменяем логарифм выражением того же знака и сохраняем внешний множитель. Квадрат сохраняем: его нуль может входить в ответ.',wrong:[{ast:mul(sub(A,1),sq(sub(t,b))),why:'Внешний множитель нельзя сократить без учёта его знака и нуля.'},{ast:mul(P,sq(sub(t,b))),why:'Потерян знак основания минус 1.'}]});}
    // 4. Reciprocal logarithms: an isolated root is deliberately retained.
    {const h=0,a=v+2,r=v+2,B=r+(r+a)**2,t=X,U=add(t,a),V=sub(B,t),z=log(U,V),L=add(z,mul(4,log(V,U))),F=sub(V,sq(U)),R=product(sq(F),sub(U,1),sub(V,1)),rel='le';
      finish('reciprocal',v,{params:{h,a,r,B},left:L,right:4,original:sub(L,4),rational:R,relation:rel,conditions:[...logDomain(U,V),...logDomain(V,U)],primaryBase:U,primaryArgument:V,critical:[-a,1-a,B-1,B,r,-2*a-1-r],preparation:[{title:'Одна замена',text:'Пусть z = log_U V. Тогда log_V U = 1/z; z ≠ 0 по исходной ОДЗ.'},{title:'Общий знаменатель',text:'z + 4/z − 4 = (z−2)²/z. Равенство возможно при z=2 даже там, где дробь вокруг положительна.'}],domain:'Оба выражения U и V служат основаниями и аргументами: каждое положительно и не равно 1. Все четыре ограничения сохраняются.',transform:'Знак (z−2)²/z совпадает со знаком (V−U²)²(U−1)(V−1). Квадрат даёт отдельный нуль; знак z задаётся произведением (U−1)(V−1).',signs:'Квадрат (V−U²)² не меняет знак. В его допустимом нуле значение равно 0: это может дать отдельную точку ответа.',wrong:[{ast:product(F,sub(U,1),sub(V,1)),why:'После общего знаменателя получается квадрат (z−2)². Убирать квадрат нельзя: он сохраняет знак по обе стороны корня.'},{ast:sq(F),why:'Знаменатель z может быть отрицательным. Его знак потерян.'}]});}
    // 5. An original logarithmic denominator has its own excluded point.
    {const h=0,d=v+2,q=v+2,m=2,k=q**m,c=d+k+4,t=X,A=sub(c,t),u=sub(t,d),B=sq(u),den=sub(log(q,u),m),L=div(log(A,B),den),R=div(mul(sub(A,1),sub(B,1)),sub(u,k)),rel=relations[v];
      finish('log-denominator',v,{params:{h,d,q,m,c},left:L,right:0,original:L,rational:R,relation:rel,conditions:[...logDomain(A,B),positive(u),nonzero(den)],primaryBase:A,primaryArgument:B,critical:[d-1,d,d+1,d+k,c-1,c],preparation:[{title:'Знаменатель сравниваем с нулём',text:'log_q(x−d)−m = log_q((x−d)/q^m). Так как q>1, его знак совпадает со знаком x−d−q^m.'}],domain:'Кроме условий логарифма в числителе, нужны x−d>0 и ненулевой исходный знаменатель. Точка x=d+q^m исключена.',transform:'Знак числителя совпадает со знаком (A−1)(B−1), а знак знаменателя — со знаком x−d−q^m. Положительные постоянные множители опускаем.',wrong:[{ast:mul(sub(A,1),sub(B,1)),why:'Знаменатель может быть отрицательным: нельзя исследовать только числитель.'},{ast:div(sub(B,1),sub(u,k)),why:'В числителе потерян множитель A−1.'}]});}
    // 6. Cancelled bases remain excluded in the original domain.
    {const h=0,a=v+9,b=v+4,c=v+6,r=-(v+2),s=v+7,D=r+s,E=-r*s,t=X,A=sub(a,t),B=add(t,b),C=add(t,c),T=sq(t),V=add(mul(D,t),E),L=mul(log(A,B),log(B,T)),right=mul(log(A,C),log(C,V)),R=product(sub(A,1),sub(t,r),sub(t,s)),rel=['le','ge','lt','gt'][v];
      finish('chain',v,{params:{h,a,b,c,r,s,D,E},left:L,right,original:sub(L,right),rational:R,relation:rel,conditions:[...logDomain(A,B),...logDomain(B,T),...logDomain(A,C),...logDomain(C,V)],primaryBase:A,primaryArgument:B,critical:[a,a-1,-b,1-b,-c,1-c,0,-E/D,r,s],preparation:[{title:'Сократить цепочки',text:'Каждое произведение превращается в один логарифм основания A. Но ограничения исчезнувших оснований B и C сохраняются.'},{title:'Собрать разность',text:'Получаем log_A(t²/(Dt+E)). На ОДЗ знаменатель отношения положителен.'}],domain:'Проверьте все четыре исходных логарифма. Даже после сокращения нельзя вернуть t=0 или значения, при которых B либо C равно 1.',transform:'После перехода к одному основанию знак разности задаётся (A−1)(t²−Dt−E). Квадратный трёхчлен имеет корни r и s.',wrong:[{ast:mul(sub(t,r),sub(t,s)),why:'Общее основание может быть меньше 1. Его влияние на знак потеряно.'},{ast:product(sub(A,1),sub(t,r)),why:'При сравнении t² и Dt+E появляется квадратный трёхчлен с двумя корнями, а не один линейный множитель.'}]});}
    // 7. Only the fully collected sum is rationalized.
    {const h=0,r=2,vv=v+4,s=vv+1,q=v+3,a=vv+5,t=X,A=sub(a,t),Q=mul(t,sub(t,vv)),inside=add(add(add(add(div(1,log(A,q)),log(s,Q)),1),log(1/q,mul(q,A))),t),L=add(mul(sub(t,r),inside),t),right=sub(sq(t),r*(r-1)),F=sub(Q,s),R=mul(sub(t,r),F),rel=relations[v];
      finish('collect',v,{params:{h,r,u:0,v:vv,s,q,a},left:L,right,original:sub(L,right),rational:R,relation:rel,conditions:[...logDomain(A,N(q)),nonzero(log(A,q)),positive(Q),positive(mul(q,A))],primaryBase:A,primaryArgument:Q,critical:[0,vv,a,a-1,r,-1,vv+1],preparation:[{title:'Обратный логарифм',text:'1/log_A q = log_q A. Это тождество используем только на исходной ОДЗ.'},{title:'Отмена пары',text:'log_(1/q)(qA) = −1−log_q A. Вместе с единицей эти слагаемые сокращаются.'},{title:'Собрать всё неравенство',text:'После раскрытия скобок и переноса правой части остаётся (t−2)(log_s Q−1). Только теперь применяем рационализацию.'}],domain:'Сохраняются A>0, A≠1 и Q>0. Исходный обратный логарифм не равен нулю: его аргумент q>1. Сокращение не возвращает A=1.',transform:'Сначала всё выражение преобразуется в (t−2)(log_s Q−1). Поскольку s>1, знак второй скобки совпадает со знаком Q−s=(t+1)(t−v−1).',wrong:[{ast:F,why:'После раскрытия скобок остаётся множитель t−2. Его нельзя отбросить.'},{ast:mul(sub(t,r),sub(Q,1)),why:'Сравнение log_s Q с 1 означает сравнение Q с s, а не с 1.'}]});}
    // 8. Even symmetry in t, including all original rational-argument poles.
    {const h=[0,1,-2,2][v],k=v+2,p=v+1,u=3*k,w=4*k,r=2*k,s=6*k,b=p*k,t=h?sub(X,h):X,y=abs(t),D=product(p,sub(y,u),sub(y,w)),B=div(b,D),L=log(y,B),R=mul(sub(y,1),sub(mul(b,y),D)),rel=['lt','le','gt','ge'][v];
      const ys=[0,1,u,w,r,s],crit=[...ys.map(a=>h-a),...ys.map(a=>h+a)];
      finish('modulus',v,{params:{h,k,p,u,v:w,r,s,b},left:L,right:-1,original:add(L,1),rational:R,relation:rel,conditions:[...logDomain(y,B),nonzero(D)],primaryBase:y,primaryArgument:B,critical:crit,preparation:[{title:'Замена модуля',text:'Пусть y=|x−h|. Тогда y≥0. Исследуйте неравенство по y, а затем верните обе ветви x=h±y.'},{title:'Перенести −1',text:'log_y(b/D)+1 = log_y(by/D). На ОДЗ D>0, поэтому знак by/D−1 совпадает со знаком by−D.'}],domain:'Нужно y>0, y≠1 и b/D>0. Так как b>0, знаменатель D должен быть положительным; его нули исключены.',transform:'На ОДЗ знак левой части после переноса совпадает со знаком (y−1)(by−D). Неравенство по y переносим на обе стороны от x=h.',wrong:[{ast:sub(mul(b,y),D),why:'Влияние основания y потеряно: при 0<y<1 логарифм меняет направление сравнения.'},{ast:mul(sub(y,1),sub(b,D)),why:'После переноса −1 аргумент умножается на основание y. В числителе нужно by−D, а не b−D.'}]});}
    // 9. A square in the argument is not a square of the logarithm.
    {const h=0,a=v+3,b=v+9,t=X,A=add(t,a),B=mul(sq(A),sq(sub(t,b))),L=log(sqrt(t),A),right=log(sq(t),B),F=sub(sq(A),sq(sub(t,b))),R=mul(sub(t,1),F),rel=relations[v];
      finish('powers',v,{params:{h,a,b},left:L,right,original:sub(L,right),rational:R,relation:rel,conditions:[positive(t,'Для корня в основании и логарифмов нужно x>0.'),nonunit(t),positive(A),positive(B)],primaryBase:sqrt(t),primaryArgument:A,critical:[-a,0,1,(b-a)/2,b],preparation:[{title:'Общее основание x',text:'log_(√x) A = 2log_x A; log_(x²)(A²(x−b)²) = log_x A + log_x|x−b|.'},{title:'Сравнить положительные величины',text:'Остаётся log_x(A/|x−b|). На ОДЗ A>0 и |x−b|>0, поэтому можно сравнить их квадраты.'}],domain:'x>0, x≠1 и x+a>0. Аргумент второго логарифма должен быть положителен, поэтому x=b запрещён, хотя он может исчезнуть при преобразовании.',transform:'Знак разности логарифмов совпадает со знаком (x−1)((x+a)²−(x−b)²). Исходная точка x=b остаётся исключённой.',wrong:[{ast:F,why:'Основание x может находиться между 0 и 1. Его знак относительно 1 нельзя отбросить.'},{ast:mul(sub(t,1),sub(A,sub(t,b))),why:'Из ln((x−b)²) получается 2ln|x−b|, а не 2ln(x−b). Отбрасывание модуля меняет решение.'}]});}
    // 10. Quadratic substitution; the squared denominator of log quotients is positive.
    {const h=0,r=v+3,a=r*(r-1),t=X,A=add(t,a),z=log(t,A),L=add(sub(sq(z),mul(3,z)),2),R=mul(a,sub(A,sq(t))),rel=relations[v];
      finish('quadratic-log',v,{params:{h,r,a},left:L,right:0,original:L,rational:R,relation:rel,conditions:logDomain(t,A),primaryBase:t,primaryArgument:A,critical:[-a,1-r,0,1,r],preparation:[{title:'Замена',text:'Обозначьте z=log_x(x+a). Трёхчлен z²−3z+2 равен (z−1)(z−2).'}, {title:'Два множителя',text:'Каждый множитель записываем через ln. В произведении знаменатель (ln x)² положителен, поэтому остаются знаки A−x и A−x².'}],domain:'Основание x положительно и не равно 1. Аргумент x+a положителен. Отдельно сохраняем запрет x=1 после сокращений.',transform:'Знак произведения (z−1)(z−2) совпадает со знаком (A−x)(A−x²). Первый множитель равен положительному числу a.',wrong:[{ast:mul(sub(t,1),R),why:'В произведении двух логарифмических разностей знаменатель (ln x)² положителен. Дополнительный знак x−1 здесь не нужен.'},{ast:mul(a,sub(A,t)),why:'Для z−2 нужно сравнить аргумент с x², а не ещё раз с x.'}]});}
    // 11. The outer base is itself a logarithm, so its positivity is a separate condition.
    {const h=0,k=v+3,m=v+5,t=X,B=mul(k,t),inner=log(t,B),A=mul(m,t),L=log(inner,A),R=mul(sub(t,1),sub(A,1)),rel=relations[v];
      finish('nested',v,{params:{h,k,m},left:L,right:0,original:L,rational:R,relation:rel,conditions:[...logDomain(t,B),...logDomain(inner,A)],primaryBase:inner,primaryArgument:A,critical:[0,1/m,1/k,1],preparation:[{title:'Внутренний логарифм',text:'log_x(kx)=1+ln k/ln x. Это значение должно быть положительным и не равно 1.'},{title:'Знак основания минус 1',text:'Поскольку k>1, знак log_x(kx)−1 совпадает со знаком x−1.'}],domain:'Нужно определить внутренний логарифм, а затем проверить, что его значение положительно и не равно 1. Положительность внутреннего логарифма даёт 0<x<1/k либо x>1.',transform:'На исходной ОДЗ знак внешнего логарифма совпадает со знаком (x−1)(mx−1). Ограничение положительности внутреннего логарифма обязательно сохраняем.',wrong:[{ast:sub(A,1),why:'Основание внешнего логарифма может быть меньше 1. Его влияние на знак потеряно.'},{ast:mul(sub(B,1),sub(A,1)),why:'Внешнее основание — значение внутреннего логарифма, а не его аргумент kx.'}]});}
    // 12. Factor the whole numerator before sign replacement; retain exponential poles.
    {const h=0,a=[3,4,5,3][v],b=[5,7,9,4][v],c=[9,11,13,10][v],q=v+2,p=[5,6,7,6][v],n=[-3,-2,-4,-3][v],S=p+n,R0=-p*n,t=X,A=sub(mul(a,t),b),B=sub(c,t),u=log(t,A),w=log(t,B),num=sub(add(mul(u,w),1),log(t,mul(A,B))),den=sub(pow(q,sub(sq(t),mul(S,t))),pow(q,R0)),L=div(num,den),F=mul(sub(A,t),sub(B,t)),poly=sub(sub(sq(t),mul(S,t)),R0),R=div(F,poly),rel=['le','lt','ge','gt'][v];
      finish('exponential-denominator',v,{params:{h,a,b,c,q,p,n,S,R:R0},left:L,right:0,original:L,rational:R,relation:rel,conditions:[...logDomain(t,A),positive(B),positive(mul(A,B)),nonzero(den)],primaryBase:t,primaryArgument:A,critical:[0,1,b/a,c,b/(a-1),c/2,p,n],preparation:[{title:'Разложить весь числитель',text:'Пусть u=log_x A, v=log_x B. На исходной ОДЗ log_x(AB)=u+v, поэтому числитель uv+1−u−v=(u−1)(v−1).'}, {title:'Знак показательной разности',text:'Основание q>1. Знак q^(x²−Sx)−q^R совпадает со знаком x²−Sx−R.'},{title:'Два логарифмических множителя',text:'Общий знаменатель (ln x)² положителен. Знак числителя задаётся (A−x)(B−x).'}],domain:'x>0, x≠1, оба аргумента A и B положительны. Их произведение тоже положительно. Исходный показательный знаменатель не должен равняться нулю.',transform:'После разложения всего числителя получаем дробь (A−x)(B−x)/(x²−Sx−R) того же знака. Знаменатель имеет два исходно запрещённых корня.',wrong:[{ast:F,why:'Показательный знаменатель может быть отрицательным. Его нельзя просто отбросить.'},{ast:div(mul(sub(A,1),sub(B,1)),poly),why:'После разложения стоят (u−1)(v−1). Нужно сравнивать аргументы с основанием x, а не с 1.'}]});}
  }
  function getTask(id){return tasks.find(t=>t.id===id)||null;}
  function domainAt(s,x) {
    // Every original boundary is in criticalPoints. Exact atom lookup avoids
    // inventing a small forbidden neighbourhood around a single excluded point.
    const p=s.task.criticalPoints;
    let i=0;while(i<p.length&&x>p[i].value)i++;
    return s.task.domainCells[i<p.length&&x===p[i].value?2*i+1:2*i];
  }
  function evaluateOriginal(task,x){const s=internal.get(typeof task==='string'?task:task.id);if(!s||!Number.isFinite(x)||!domainAt(s,x))return {defined:false,value:null};const value=rawEval(s.original,x);return Number.isFinite(value)?{defined:true,value}:{defined:false,value:null};}
  function evaluateRational(task,x){const s=internal.get(typeof task==='string'?task:task.id);if(!s||!Number.isFinite(x)||!domainAt(s,x))return {defined:false,value:null};const value=rawEval(s.rational,x);return Number.isFinite(value)?{defined:true,value}:{defined:false,value:null};}
  return {families,tasks,getTask,evaluateOriginal,evaluateRational,formatNumber,formatSet};
}));

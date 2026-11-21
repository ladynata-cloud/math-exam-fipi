(function(){
  'use strict';
  const {add,example,lessons}=window.MathExamTopicPractice,course=window.MathExamTopicEdition;
  const ids=[],ops={'+':'+','-':'−','*':'·','/':':','^':'^'};
  function gcd(a,b){return b?gcd(b,a%b):Math.abs(a);}
  function rat(n,d=1){if(!d)throw Error('Нулевой знаменатель');const k=gcd(n,d)*Math.sign(d);return[n/k,d/k];}
  function literal(s){
    s=s.replace(',','.');const parts=s.split(' '),sign=s.startsWith('-')?-1:1;
    if(parts.length===2){const [a,b]=parts[1].split('/').map(Number);return rat(sign*(Math.abs(Number(parts[0]))*b+a),b);}
    if(s.includes('/')){const [n,d]=s.split('/').map(Number);return rat(n,d);}
    if(s.includes('.')){const den=10**s.split('.')[1].length;return rat(Math.round(Number(s)*den),den);}
    return rat(Number(s));
  }
  const text=r=>r[1]===1?String(r[0]):r[0]+'/'+r[1],value=r=>r[0]/r[1];
  function calc(op,a,b){
    if(op==='+')return rat(a[0]*b[1]+b[0]*a[1],a[1]*b[1]);
    if(op==='-')return rat(a[0]*b[1]-b[0]*a[1],a[1]*b[1]);
    if(op==='*')return rat(a[0]*b[0],a[1]*b[1]);
    if(op==='/')return rat(a[0]*b[1],a[1]*b[0]);
    return rat(a[0]**b[0],a[1]**b[0]);
  }
  function evaluate(t){
    if(typeof t==='string')return {r:literal(t),label:t.replace('-','−')};
    const [op,a,b]=t,A=evaluate(a),B=evaluate(b),r=calc(op,A.r,B.r);
    const term=v=>v.op||v.label.startsWith('−')?'('+v.label+')':v.label;
    return {op,A,B,r,label:term(A)+' '+ops[op]+' '+term(B)};
  }
  const q=(prompt,answer,calculation,bad,error)=>({prompt,answer,calculation,error,mistakes:[[bad,error]]});
  function register(key,ref,page,title,prompt,guide,rule,make){
    add(93,key,page,title,prompt,rule,'numline',make);const l=lessons.get('93-'+key);
    Object.assign(l,{printedReference:ref,printedPrompt:prompt,printedGuide:guide});ids.push(l.id);
  }
  function numDetails(t){return t.label+' = '+text(t.r);}
  function solution(t){
    const walk=(node,steps)=>{if(!node.op)return;walk(node.A,steps);walk(node.B,steps);steps.push(numDetails(node));};
    if(t.A.op||t.B.op){const steps=[];walk(t,steps);return 'Начни с внутренних действий. '+steps.join('. ')+'.';}
    const a=t.A.r,b=t.B.r;
    if(t.op==='+'||t.op==='-'){const d=a[1]*b[1]/gcd(a[1],b[1]);return 'Запиши оба числа в долях величины 1/'+d+'. Получатся числители '+a[0]*d/a[1]+' и '+b[0]*d/b[1]+'. '+(t.op==='+'?'Сложи числители':'Вычти второй числитель из первого')+' и сократи. Ответ '+text(t.r)+'.';}
    if(t.op==='*')return 'Запиши множители как '+text(a)+' и '+text(b)+'. Произведение числителей '+a[0]*b[0]+', знаменателей '+a[1]*b[1]+'. После сокращения получается '+text(t.r)+'.';
    if(t.op==='/')return 'Делитель не равен нулю. Замени деление умножением на обратную дробь '+text(rat(b[1],b[0]))+' и сократи произведение. Получится '+text(t.r)+'.';
    return 'Возведи в степень весь числитель и весь знаменатель. Чётный показатель снимает знак минуса, нечётный сохраняет. Получается '+text(t.r)+'.';
  }
  function variation(t,s){
    function move(original,fixed=false){
      if(typeof original!=='string'){const [op,a,b]=original;return [op,move(a),move(b,op==='^')];}
      if(fixed)return original;
      const r=literal(original),z=r[0],dir=Math.sign(z)||1;
      // Repeated operands denote the same quantity, even in another nested block.
      if(!z)return '0';
      const newN=z+dir*s,res=rat(newN,r[1]);return text(res);
    }
    return evaluate(move(t));
  }
  function generate(t,seed){
    const x=variation(t,seed),a=x.A.r,b=x.B.r,d=a[1]*b[1]/gcd(a[1],b[1]),isTree=x.A.op||x.B.op;
    let steps;
    if(isTree){
      steps=[q('Каково значение левого блока '+x.A.label+'?',value(a),'Сначала вычисли внутренние действия слева.',value(a)+1,'Проверь скобки и порядок действий в левом блоке.'),
        q('Каково значение правого блока '+x.B.label+'?',value(b),'Вычисли правую часть внешнего действия отдельно.',value(b)-1,'Проверь знак и числители в правой части выражения.')];
    }else if(x.op==='+'||x.op==='-'){
      const p=a[0]*d/a[1],r=b[0]*d/b[1];
      steps=[q('Какой числитель у первого числа при знаменателе '+d+'?',p,'Умножь числитель и знаменатель на один и тот же дополнительный множитель.',p+d,'Добавлена целая единица вместо приведения дроби.'),
        q('Какой числитель у второго числа при том же знаменателе?',r,'Сохрани исходный знак второго числа до выполнения внешнего действия.',r-d,'Вычитание ещё не выполняется: запиши само второе число.')];
    }else if(x.op==='^'){
      const [n,den]=a,exp=b[0];
      steps=[q('Какой числитель получается при возведении дроби в степень?',n**exp,'Сохрани знак основания внутри скобок и умножь его на себя нужное число раз.',n**exp+1,'Показатель задаёт число одинаковых множителей.'),
        q('Какой знаменатель получится до сокращения?',den**exp,'Знаменатель возводится в ту же степень, что и числитель.',den**exp+den,'Проверь количество одинаковых знаменателей в произведении.')];
    }else{
      const c=x.op==='/'?rat(b[1],b[0]):b,n=a[0]*c[0],den=a[1]*c[1];
      steps=[q('Какой числитель получится у произведения до сокращения?',n,x.op==='/'?'Замени делитель обратной дробью и умножь числители.':'Перемножь числители, учитывая знаки.',n+1,'Нужен числитель несокращённого произведения, с его знаком.'),
        q('Какой положительный знаменатель получится до сокращения?',den,'Приведи каждый знаменатель к положительному виду и перемножь знаменатели.',den+1,'Знаменатели перемножаются после записи правильного второго множителя.')];
    }
    const out=value(x.r),alt=out>=0?out+1:out-1;
    steps.push(q('Чему равно всё выражение? Можно ввести обыкновенную дробь.',out,solution(x),alt,'Сверь знак внешнего действия и используй ответы обоих промежуточных шагов.'));
    return Object.assign(example('Порядок действий в новом выражении',['Часть выражения','Данные'],[['Выражение',x.label],['Левый блок',x.A.label],['Правый блок',x.B.label]],steps,'expression-tree'),{tree:x});
  }
  const words={'+':'сложение','-':'вычитание','*':'произведение','/':'частное','^':'степень'};
  function arithmetic(n,i,expr,page,verbal){
    const printed='№'+n+'('+i+')',original=evaluate(expr),title=(verbal?'Составление выражения':'Точное вычисление')+' · '+printed;
    register(n+'-'+i,'Упражнение '+printed,page,title,verbal||'Вычисли '+original.label+'.',
      (verbal?'Запись по условию: '+original.label+'. ':'')+solution(original),
      'Назови внешнее действие ('+words[original.op]+'), затем разбери каждый блок внутри него.',s=>generate(expr,s));
  }
  const tests=[
    [1,[['+','0,72','3,018'],['-','4','2,8'],['*','1,8','0,3'],['/','5,4','6'],['/','72','0,09'],['/','9','4']]],
    [2,[['+','1/3','5/6'],['-','3/7','2/9'],['*','7/16','8/35'],['*','4/9','18'],['/','46/75','23/45'],['/','2/3','4'],['/','10','5/11'],['+','2 3/8','4 1/6'],['-','6','1 3/5'],['-','4 2/7','1 4/9'],['*','8 3/4','1 3/14'],['/','1 3/5','5 1/3']]],
    [3,[['+','3,8','-2,5'],['+','-4,8','4,8'],['+','-1','0,39'],['-','9,4','-7,8'],['-','4,2','5,7'],['-','0','7,8'],['-','0','-2,4'],['-','-4,5','2,5'],['*','8','-0,4'],['*','-1,2','-0,5'],['*','-48','0'],['/','-3,3','-11'],['/','3,2','-4'],['^','1/2','3'],['^','-1 1/3','2']]],
    [4,[['-',['-','18 5/12',['*','7/12','1 19/21']],['*','17/72','2/3']],['*',['-','6 3/4',['/','5 1/8','1 9/32']],'5/11'],['+',['/',['-','-1,42','-3,22'],'-0,4'],['*','-6','-0,7']],['/',['+','-7/18','11/12'],'-19/48'],['/',['-','-3 1/12','2 1/15'],'-5 3/20']]],
    [5,[['-',['-','14 7/15',['*','3 3/23','23/27']],['*','1 1/5','1/6']],['*',['+',['/','5 8/9','1 17/36'],'1 1/4'],'5/21'],['+',['/',['-','-3,25','2,75'],'-0,6'],['*','0,8','-7']],['/',['-','-1 3/8','2 5/12'],'5 5/12']]]
  ];
  register('example','Пример',6,'Общий множитель помогает подстановке','Выведи 7bm − 7am через a − b и m. Проверь данные a − b = 4, m = −5.',
    'Общий множитель равен 7m. В скобках остаётся b − a = −4. Тогда 7 · (−5) · (−4) = 140. Менять порядок a и b без смены знака нельзя.',
    'Противоположные разности отличаются знаком.',s=>{
      const a=s+2,m=-s-1,t=['*',['*','7',String(m)],String(-a)],tree=evaluate(t);
      return Object.assign(example('Сверни разность произведений',['Дано','Значение'],[['a − b',a],['m',m],['Выражение','7bm − 7am']],[
        q('Чему равно b − a?',-a,'У разности с переставленными членами обратный знак.',a,'Это исходная разность a − b.'),
        q('Чему равен общий множитель 7m?',7*m,'Умножь известное отрицательное m на 7.',-7*m,'Сохрани знак отрицательного множителя.'),
        q('Чему равно значение всей разности?',7*m*(-a),'Перемножь два найденных числа.',7*m*a,'Оба множителя отрицательны, значение должно быть положительным.')
      ],'expression-tree'),{tree});
    });
  for(const [n,group] of tests)group.forEach((expr,j)=>arithmetic(n,j+1,expr,n<=2?6:7));
  const statements=[
    [6,[
      [['*',['+','-12','8'],'0,5'],'Умножь сумму −12 и 8 на половину.'],
      [['+',['*','-12','8'],'0,5'],'Прибавь половину к произведению −12 и 8.'],
      [['/',['+','-1,6','-1,2'],['-','-1,6','-1,2']],'Раздели сумму −1,6 и −1,2 на их разность в том же порядке.'],
      [['^',['+','-10','6'],'2'],'Возведи сумму −10 и 6 в квадрат.'],
      [['+',['^','-10','2'],['^','6','2']],'Сложи квадраты −10 и 6.']]],
    [7,[
      [['/',['+','4/9','-5/6'],'-14/27'],'Сумму 4/9 и −5/6 раздели на −14/27.'],
      [['-',['*','-1,5','4'],'2'],'Из произведения −1,5 и 4 вычти 2.'],
      [['*',['+','-1,9','0,9'],['-','-1,9','0,9']],'Умножь сумму −1,9 и 0,9 на их разность в том же порядке.'],
      [['^',['-','6','8'],'3'],'Возведи разность 6 и 8 в куб.']]]
  ];
  for(const [n,group] of statements)group.forEach(([expr,p],j)=>arithmetic(n,j+1,expr,7,p));
  const prevNext=course.nextId,prevGrade=course.grade,prevSource=course.source;
  course.nextId=l=>l.book===93?ids[ids.indexOf(l.id)+1]:prevNext(l);course.grade=b=>b===93?'7 класс':prevGrade(b);
  course.source=(b,p)=>b===93?'https://pdf.my-uchebnik.ru/pdf/algebra/00000071.pdf#page='+(p+1):prevSource(b,p);
  window.MerzlyakExpressions2015={text,value,evaluate,literal};
})();

/* Proposed MathExam school subject graph. Existing preparation registry owns learning URLs. */
(function(root,factory){const value=factory();if(typeof module==='object'&&module.exports)module.exports=value;else root.MathExamSchoolJourney=value;})(typeof globalThis==='undefined'?this:globalThis,
function factory(){
  'use strict';
  // This is a proposed, coarse subject graph, not a complete curriculum.
  // Edges are recommendations to check, never a diagnosis or a mandatory lock.
  const city='/trainers/oge-basics/multiplication-division/arzhenikov-map.html';
  const q=(prompt,choices,answer,explain)=>({prompt,choices,answer:String(answer),explain});
  const p=(id,title,group,before,source,extra,questions=[])=>({id,title,group,before,source,extra,questions});
  const nodes=[
    p('place','Числа и разряды','Числа',[], 'path:pre7-place-value', [city+'#courses-arithmetic','/trainers/oge-basics/arithmetic-route.html'],[
      q('Какая цифра стоит в разряде сотен числа 4050?',['4','0','5'],1,'В числе 4050 четыре тысячи, ноль сотен, пять десятков.'),
      q('Запиши число: три тысячи и семь единиц.',['3700','3070','3007'],2,'Сотен и десятков нет; их разряды заняты нулями.')]),
    p('add','Сложение и вычитание','Числа',['place'],'path:pre7-subtract-borrow',[city+'#courses-arithmetic','/trainers/oge-basics/multiplication-division/arithmetic-foundations.html#sub-borrow'],[
      q('402 − 185 = ?',['217','227','223'],0,'402 − 180 = 222; 222 − 5 = 217.'),
      q('168 + 57 = ?',['215','225','235'],1,'168 + 50 = 218; ещё 7 дают 225.')]),
    p('multiply','Умножение и деление по таблице','Числа',['place'],'oge-basics:multiplication-division/multiplication-mixed',[city+'#courses-arithmetic'],[
      q('7 × 8 = ?',['48','54','56'],2,'Семь восьмёрок составляют 56.'),
      q('42 предмета распределили поровну между 6 детьми. Сколько у каждого?',['7','6','8'],0,'6 × 7 = 42.')]),
    p('division','Деление уголком','Числа',['place','add','multiply'],'oge-basics:multiplication-division/long-division-zero-in-quotient',[city+'#courses-written','/trainers/oge-basics/arithmetic-route.html'],[
      q('306 : 3 = ?',['12','102','120'],1,'Три сотни дают одну сотню; десятков нет; шесть единиц дают две.'),
      q('29 : 6 с остатком. Каков остаток?',['4','6','5'],2,'29 = 6 × 4 + 5; остаток меньше делителя.')]),
    p('divisibility','Делимость и общие кратные','Числа',['multiply'],'path:pre7-divisibility',['/foundations/'],[
      q('Наименьшее положительное число, делящееся на 6 и на 8?',['24','48','14'],0,'24 кратно обоим; 6, 12 и 18 не кратны восьми.'),
      q('Какое из чисел делится на 3?',['124','126','128'],1,'Сумма цифр 126 равна 9, она делится на 3.')]),
    p('fraction-meaning','Смысл дроби, часть и целое','Дроби и отношения',['multiply'],'oge-basics:fraction-meaning',[city+'#course-c-quotient'],[
      q('Три четверти от 12 яблок — сколько яблок?',['4','9','16'],1,'Одна четверть — 3 яблока; три четверти — 9.'),
      q('Три метра ленты поделили поровну между четырьмя детьми. Сколько метров у каждого?',['1/4','4/3','3/4'],2,'Четверть всего запаса длиной 3 метра равна 3/4 метра.')]),
    p('fractions','Действия с обыкновенными дробями','Дроби и отношения',['fraction-meaning','divisibility'],'oge-basics:fraction-common-denominator',[city+'#courses-fractions','/topics/obyknovennye-drobi/'],[
      q('2/3 + 1/6 = ?',['3/9','5/6','1/2'],1,'2/3 = 4/6, поэтому 4/6 + 1/6 = 5/6.'),
      q('3/4 × 2/3 = ?',['1/2','5/7','2'],0,'6/12 = 1/2.')]),
    p('decimals','Десятичные дроби','Дроби и отношения',['place','fraction-meaning','division'],'oge-basics:decimal-add-subtract',[city+'#courses-decimals'],[
      q('Какое число больше?',['0,75','Они равны','0,8'],2,'0,8 = 0,80, то есть 80 сотых больше 75 сотых.'),
      q('4,8 : 1,2 = ?',['0,4','4','40'],1,'Умножив делимое и делитель на 10, получаем 48 : 12 = 4.')]),
    p('signed','Отрицательные числа','Дроби и отношения',['add'],'oge-basics:negative-add-subtract',['/trainers/negative-numbers-line.html'],[
      q('−7 + 10 = ?',['−3','3','17'],1,'На числовой прямой от −7 вправо на 10: приходим к 3.'),
      q('−4 − (−6) = ?',['−10','−2','2'],2,'Вычесть −6 — прибавить 6.')]),
    p('ratio','Отношения и пропорции','Дроби и отношения',['fraction-meaning','fractions'],'oge-basics:percentages/proportion',[city+'#course-c-units'],[
      q('20 деталей разделили в отношении 2 : 3. Сколько в меньшей группе?',['8','10','12'],0,'Всего 5 равных долей; одна доля — 4 детали, две — 8.'),
      q('3 одинаковых тетради стоят 12 рублей. Сколько стоят 5 таких тетрадей?',['15','20','24'],1,'Одна тетрадь стоит 4 рубля; пять — 20.')]),
    p('percent','Проценты','Дроби и отношения',['ratio','decimals'],'oge-basics:percentages/percent-of-number-and-whole',[city+'#course-c-percent','/topics/procenty/'],[
      q('15% от 200 = ?',['15','30','45'],1,'0,15 × 200 = 30.'),
      q('После повышения цены на 10% товар стоит 110 рублей. Какова прежняя цена?',['99','110','100'],2,'110 рублей — 110% прежней цены: 110 : 1,1 = 100.')]),
    p('expression','Переменные и преобразования','Алгебра',['signed','fractions'],'path:grade7-a-expression-structure',['/school/makarychev7/','/trainers/like-terms-factory.html'],[
      q('Раскрой скобки: 2(a + 3).',['2a + 6','2a + 3','a + 6'],0,'Двойка умножает оба слагаемых.'),
      q('Вычисли 3x − x + 2 при x = 4.',['6','10','14'],1,'3x − x = 2x; 2 × 4 + 2 = 10.')]),
    p('linear','Линейные уравнения','Алгебра',['expression','fraction-meaning','signed'],'path:equations-linear',['/equations/linear-pilot/','/equations/'],[
      q('x/3 + 2 = 6. Чему равен x?',['4','8','12'],2,'x/3 = 4, значит x = 12; подстановка даёт 6.'),
      q('−3x + 5 = −7. Чему равен x?',['4','−4','2'],0,'−3x = −12; делим обе части на −3.')]),
    p('modeling','Текстовые задачи и моделирование','Алгебра',['ratio','linear'],'path:grade7-a-equation-word-perimeter',['/trainers/oge-task21-word-problems.html','/trainers/motion-grade6/']),
    p('function','Функции и графики','Алгебра',['expression','linear'],'public:linear-function',['/trainers/oge-task22-functions-graphs.html','/trainers/college-functions/']),
    p('quadratic','Квадратные уравнения и дальнейшая алгебра','Алгебра',['expression','linear','function'],null,['/school/makarychev8/','/ege-profil/']),
    p('geometry','Планиметрия: фигуры и измерения','Геометрия',['place','ratio'],'public:geometry-course',['/geometry-course/textbook/']),
    p('proof','Геометрические доказательства','Геометрия',['geometry'],null,['/trainers/oge-task24-proofs.html','/geometry-course/','/trainers/oge-written-practice.html']),
    p('probability','Вероятность и данные','Старшие темы',['fraction-meaning','ratio'],null,['/trainers/oge-task10-probability.html','/ege-profil/trainers/probability-t45.html?topic=basic','/trainers/tyurin-statistics/']),
    p('trig','Тригонометрия','Старшие темы',['geometry','function','fractions'],null,['/ege-profil/trigonometry/']),
    p('stereo','Стереометрия','Старшие темы',['geometry','proof'],null,['/stereo-course/textbook/']),
    p('analysis','Производная и начала анализа','Старшие темы',['function','quadratic'],null,['/ege-profil/trainers/derivative-t8.html','/ege-profil/'])
  ];
  const foundation=['place','add','multiply','division','divisibility','fraction-meaning','fractions','decimals','signed','ratio','percent'];
  const algebra=['fraction-meaning','fractions','signed','expression','linear','modeling','function','quadratic'];
  const geometry=['geometry','proof','stereo'];
  const common=[...foundation,'expression','linear','modeling','function','geometry','proof','quadratic','probability'];
  const goals=[
    {id:'foundations',title:'Восстановить основы',path:foundation,start:'place',href:'/foundations/'},
    {id:'school',title:'Изучать школьную математику',path:[...common,'trig','stereo','analysis'],start:'fraction-meaning',href:'/courses/'},
    {id:'algebra',title:'Разобраться в алгебре',path:algebra,start:'linear',href:'/equations/'},
    {id:'geometry',title:'Разобраться в геометрии',path:geometry,start:'geometry',href:'/geometry-course/'},
    {id:'oge',title:'Подготовиться к ОГЭ',path:common,start:'fractions',href:'/oge/'},
    {id:'base',title:'Подготовиться к базовому ЕГЭ',path:[...common,'stereo'],start:'percent',href:'/ege-baza/'},
    {id:'profile',title:'Подготовиться к профильному ЕГЭ',path:[...common,'trig','stereo','analysis'],start:'function',href:'/ege-profil/'}
  ];
  const find=id=>nodes.find(n=>n.id===id);
  const goal=id=>goals.find(g=>g.id===id);
  function next(goalId,nodeId){
    const g=goal(goalId);if(!g)return null;
    const i=g.path.indexOf(nodeId);return i<0||i===g.path.length-1?null:find(g.path[i+1]);
  }
  function publicHref(href){
    if(typeof href!=='string'||/[\s\\\u0000-\u001f\u007f]/u.test(href))return null;
    const path=href.split(/[?#]/,1)[0];
    // The pilot accepts only literal root-relative public document paths.
    // No encoded path separators, authority, dot segments or cabinet routes.
    if(!/^\/(?:[A-Za-z0-9_-][A-Za-z0-9_.-]*(?:\/[A-Za-z0-9_-][A-Za-z0-9_.-]*)*\/?)?$/.test(path)||/^\/learning(?:\/|$)/i.test(path))return null;
    return href;
  }
  function completeAnswers(questions,answers){
    return Array.isArray(answers)&&answers.length===questions.length&&questions.every((q,i)=>Object.prototype.hasOwnProperty.call(answers,i)&&(answers[i]==='?'||q.choices.some((_,j)=>String(j)===answers[i])));
  }
  function result(nodeId,answers){
    const n=find(nodeId);
    if(!n||!n.questions.length)return {kind:'not-tested',correct:0};
    if(!completeAnswers(n.questions,answers))return {kind:'incomplete',correct:0};
    const correct=n.questions.filter((item,i)=>item.answer===answers[i]).length;
    return {kind:correct===n.questions.length?'two-correct':correct===0?'practice':'check-again',correct};
  }
  function resource(nodeId,registry){
    const n=find(nodeId);if(!n)return null;
    const item=n.source&&typeof registry?.get==='function'?registry.get(n.source):null;
    return publicHref(item?.publicUrl)|| (item?.kind==='public'?publicHref(item.url):null);
  }
  function selection(value){
    if(value&&goal(value.goal)&&find(value.node))return {goal:value.goal,node:value.node};
    return {goal:'foundations',node:'place'};
  }
  // Derived view, never a second source of prerequisites. The type and
  // provenance describe an authored hypothesis, not a validated causal claim.
  function candidateEdges(graph=nodes){
    return graph.flatMap(n=>n.before.map(id=>({
      from:id,to:n.id,type:'candidate-prerequisite',
      provenance:'school-journey-v1-authored',status:'hypothesis'
    })));
  }
  function validate(graph=nodes,views=goals,registry=null){
    const validId=id=>typeof id==='string'&&/^[a-z][a-z0-9-]*$/.test(id);
    const nonempty=s=>typeof s==='string'&&s.trim().length>0;
    const unique=values=>new Set(values).size===values.length;
    const dense=values=>Array.isArray(values)&&Array.from({length:values.length},(_,i)=>Object.prototype.hasOwnProperty.call(values,i)).every(Boolean);
    const byId=new Map(),goalIds=new Set(),stack=new Set(),done=new Set();
    if(!dense(graph)||!graph.length||!dense(views)||!views.length)throw Error('Empty or sparse graph or goals');
    for(const n of graph){
      if(!n||!validId(n.id)||byId.has(n.id))throw Error('Invalid or duplicate skill '+n?.id);
      byId.set(n.id,n);
      if(!nonempty(n.title)||!nonempty(n.group))throw Error('Missing skill label '+n.id);
      if(!dense(n.before)||!unique(n.before)||n.before.some(id=>!validId(id)||id===n.id))throw Error('Invalid prerequisite '+n.id);
      if(n.source!==null&&!nonempty(n.source))throw Error('Invalid resource ID '+n.id);
      if(!dense(n.extra)||!unique(n.extra)||n.extra.some(href=>!publicHref(href)))throw Error('Invalid public routes '+n.id);
      if(!n.source&&!n.extra.length)throw Error('Missing learning resource '+n.id);
      if(registry&&n.source){
        const item=typeof registry.get==='function'?registry.get(n.source):null;
        if(!item||(item.id!==n.source&&item.managedId!==n.source)||!(publicHref(item.publicUrl)||(item.kind==='public'&&publicHref(item.url))))throw Error('Unresolved public resource '+n.id+': '+n.source);
      }
      if(!dense(n.questions)||(n.questions.length!==0&&n.questions.length!==2))throw Error('Probe size '+n.id);
      for(const q of n.questions)if(!q||!nonempty(q.prompt)||!nonempty(q.explain)||!dense(q.choices)||q.choices.length!==3||!q.choices.every(nonempty)||!q.choices.some((_,i)=>String(i)===q.answer)||!unique(q.choices))throw Error('Bad probe '+n.id);
    }
    function visit(id){
      if(stack.has(id))throw Error('Cycle '+id);
      if(done.has(id))return;
      const n=byId.get(id);if(!n)throw Error('Missing skill '+id);
      stack.add(id);n.before.forEach(visit);stack.delete(id);done.add(id);
    }
    graph.forEach(n=>visit(n.id));
    for(const g of views){
      if(!g||!validId(g.id)||goalIds.has(g.id)||!nonempty(g.title)||!publicHref(g.href)||!dense(g.path)||!g.path.includes(g.start)||!unique(g.path)||g.path.some(id=>!byId.has(id)))throw Error('Bad goal '+g?.id);
      goalIds.add(g.id);
    }
    return true;
  }
  validate();
  return {version:1,nodes,goals,find,goal,next,result,resource,publicHref,selection,validate,candidateEdges};
}
);

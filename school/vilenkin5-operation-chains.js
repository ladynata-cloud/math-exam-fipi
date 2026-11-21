/* Виленкин и соавторы, 5 класс, часть 2, §26, печатная с. 17. */
(function(root){
  'use strict';
  const published=[
    [55,[['−',47],['×',9],['−',34],['÷',19],['×',24]]],
    [91,[['÷',13],['×',80],['+',240],['−',500],['÷',15]]],
    [75,[['−',66],['×',9],['−',27],['+',18],['÷',18]]],
    [98,[['÷',14],['×',70],['+',210],['÷',35],['×',15]]],
    [84,[['−',78],['×',8],['+',12],['÷',5],['×',30]]]
  ];
  const names=['а','б','в','г','д'];
  const verbs={'−':'вычти','+':'прибавь','×':'умножь на','÷':'раздели на'};
  const calc=(a,o,b)=>o==='−'?a-b:o==='+'?a+b:o==='×'?a*b:a/b;
  const lessons=[
    {number:'5.67',key:'printed-5-67',part:2,point:26,page:17,title:'Пять столбиков действий',requires:['v5f-printed-5-27'],related:[],explanation:'Начни с верхней строки. В каждой следующей строке первое число — результат предыдущей. Пройди все пять столбиков и отдельно запиши их итоговые значения.',worked:['На старте 32. После «− 8» имеем 24. Следующее «÷ 6» даёт 4, потому что теперь делим 24.'],misconception:'Пустая строка означает, что надо снова взять первое число столбика.',reflect:'Как проверить место ошибки обратным действием?'},
    {number:'5.68',key:'printed-5-68',part:2,point:26,page:17,title:'Уменьши на число, затем в несколько раз',requires:['v5f-printed-5-57'],related:[],explanation:'Сначала найди сотую часть исходного числа. Фраза «уменьшить на» требует вычитания. Фраза «уменьшить в несколько раз» требует деления.',worked:['Сотая часть 60 000 равна 600. Уменьшим её на 100 — получим 500. Уменьшим это число в десять раз — получим 50.'],misconception:'Слова «на сто» и «в сто раз» задают одно и то же действие.',reflect:'Как одно короткое слово меняет последнее действие?'}
  ];
  function randomChain(i,r){
    const operations=published[i][1].map(([op])=>op);
    const start=r(40,110);
    let value=start;
    const pairs=[];
    for(const op of operations){
      let number;
      if(op==='÷'){
        const factors=Array.from({length:Math.min(15,value)-1},(_,k)=>k+2).filter(n=>value%n===0);
        number=factors.length?factors[r(0,factors.length-1)]:value;
      }else if(op==='−'){number=r(1,Math.min(48,value-1));}
      else if(op==='+'){number=r(10,60);}
      else {number=r(2,12);}
      pairs.push([op,number]);value=calc(value,op,number);
    }
    return [start,pairs];
  }
  const buildRows=(start,pairs)=>{let v=start;return pairs.map(([op,num])=>{const before=v;v=calc(v,op,num);return {before,op,num,answer:v};});};
  function chains(seed,r,step){
    const problems=published.map(([v,p],i)=>seed?randomChain(i,r):[v,p]),all=problems.map(([v,p])=>buildRows(v,p));
    const tasks=all.flatMap((chain,i)=>chain.map((row,j)=>{
      const base=problems[i][0],wrong=calc(base,row.op,row.num),errors=[];
      if(j&&wrong!==row.answer&&Number.isSafeInteger(wrong))errors.push({value:wrong,text:'Ты снова начал с верхнего числа столбика. Возьми результат непосредственно над текущей строкой.'});
      return step('Столбик '+names[i]+', строка '+(j+1)+'. '+(j?'Возьми предыдущее число и ':'Возьми начальное число '+base+' и ')+verbs[row.op]+' '+row.num+'. Какой результат записать?',row.answer,row.before+' '+row.op+' '+row.num+' = '+row.answer+'.',errors);
    }));
    const last=tasks.pop();return {...last,prompt:'Вычисли результат всего столбика д. Начало: '+problems[4][0]+'. Выполняй действия сверху вниз.',steps:tasks,inputPrompt:'Итог столбика д',data:{chainPractice:problems},conditionKey:'five-chains/'+problems.map(([v,p])=>v+':'+p.flat().join(',')).join('/')};
  }
  function decrease(seed,r,step){
    const last=seed?r(12,94):90,minus=seed?r(3,15)*100:1000,k=seed?[10,20,50,100][r(0,3)]:100,share=k*last+minus,total=100*share;
    const words='Возьми сотую часть числа '+total+'. Затем уменьши её на '+minus+', а результат — в '+k+' раз.';
    return {steps:[step(words+' Чему равна сотая часть?',share,'Раздели исходное число на 100.',[{value:total-100,text:'Ты вычел 100. Чтобы взять сотую часть, раздели целое на 100.'}]),step('Сотая часть найдена. Уменьши её на '+minus+'. Какое число получится?',share-minus,'Уменьшить на число означает вычесть это число.',[])],prompt:words+' Что получилось в конце?',answer:last,inputPrompt:'Итоговое число',why:(share-minus)+' : '+k+' = '+last+'.',errors:[{value:share-minus-k,text:'Ты вычел число ещё раз. Здесь сказано «в несколько раз», поэтому нужно деление.'}],data:{decrease:{total,share,minus,k,last}},conditionKey:'decrease/'+total+'/'+minus+'/'+k};
  }
  function diagram(t,i,j){
    if(t.data.decrease){
      const x=t.data.decrease,labels=['Возьми сотую часть','Уменьши на '+x.minus,'Уменьши в '+x.k+' раз'];
      return '<figure style="margin:.5em 0"><figcaption>Как меняется исходное число '+x.total+'</figcaption><ol style="padding-left:1.55em">'+labels.map((v,k)=>'<li style="padding:.25em;color:'+(k===j?'#234e48':'inherit')+'">'+(k===j?'<b>'+v+'</b>':v)+'</li>').join('')+'</ol></figure>';
    }
    const [start,ops]=t.data.chainPractice[i],rows=buildRows(start,ops);
    return '<figure style="margin:.5em 0"><figcaption>Столбик '+names[i]+'. Наверху '+start+'.</figcaption><ol style="padding-left:1.7em">'+rows.map((row,k)=>'<li style="padding:.22em;'+(k===j?'background:#d9ece1;font-weight:bold':'')+'">'+(k<j?row.before+' '+row.op+' '+row.num+' = '+row.answer:k===j?row.before+' '+row.op+' '+row.num+' = ?':verbs[row.op]+' '+row.num)+'</li>').join('')+'</ol></figure>';
  }
  function draw(t,s){const i=s?.mode==='learn'?s.step:t.steps.length;if(t.data.decrease)return diagram(t,0,i);return s?.mode==='learn'?diagram(t,Math.floor(i/5),i%5):diagram(t,4,-1);}
  function explore(t,s){
    if(t.data.decrease){const x=t.data.decrease;return {title:'Проверь выбранное действие',controls:[{key:'line',title:'Действие',values:[[0,'Сотая часть'],[1,'Уменьшение на число'],[2,'Уменьшение в несколько раз']]}],visual:diagram(t,0,s.line),question:['Сколько получится, если '+x.total+' разделить на 100?','Вычти '+x.minus+' из '+x.share+'.','Раздели '+(x.share-x.minus)+' на '+x.k+'.'][s.line],answer:[x.share,x.share-x.minus,x.last][s.line],why:'Читай предлог в условии и проверяй, какое действие ему соответствует.'};}
    const [start,pairs]=t.data.chainPractice[s.column],row=buildRows(start,pairs)[s.line];
    return {title:'Проверь переход между соседними строками',controls:[{key:'column',title:'Столбик',values:names.map((n,i)=>[i,n])},{key:'line',title:'Строка',values:names.map((_,i)=>[i,String(i+1)])}],visual:diagram(t,s.column,s.line),question:'В выделенной строке было '+row.before+'. Чему равен результат?',answer:row.answer,why:'Выполни ровно одно действие: '+row.before+' '+row.op+' '+row.num+'.'};
  }
  const api={lessons,generators:{'5.67':chains,'5.68':decrease},bounds:{'5.67':{column:[0,4,0],line:[0,4,0]},'5.68':{line:[0,2,0]}},draw,explore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5OperationChains=api;
})(typeof window!=='undefined'?window:globalThis);

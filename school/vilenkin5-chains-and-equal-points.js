/* Виленкин и соавторы, часть 2, §27, печатная с. 23. */
(function(root){
  'use strict';
  const chainLib=typeof module!=='undefined'&&module.exports?require('./vilenkin5-operation-chains.js'):root.Vilenkin5OperationChains;
  const language=typeof module!=='undefined'&&module.exports?require('./vilenkin5-fraction-language.js'):root.Vilenkin5FractionLanguage;
  const examples=[
    [53,[['−',46],['×',7],['+',31],['−',45],['÷',7]]],
    [520,[['+',280],['÷',20],['×',5],['÷',25],['×',125]]],
    [63,[['−',57],['×',6],['+',34],['−',30],['÷',8]]],
    [600,[['−',120],['÷',4],['×',2],['÷',5],['×',20]]],
    [81,[['−',73],['×',8],['+',26],['−',58],['÷',8]]]
  ];
  const sourceWords=[[1,4],[1,7],[9,13],[11,21],[30,49],[1,11],[13,70],[33,100],[119,139],[200,345],[333,987]];
  const fresh=[[2,7],[3,13],[4,21],[7,49],[9,11],[11,70],[13,100],[15,139],[33,345],[119,987],[200,347],[333,1000],[5,8],[1,70],[2,1000]];
  const labels=['A','B','C','D','E','K'],printed=[[4,20],[2,7],[1,5],[4,28],[4,20],[20,70]];
  const lessons=[
    [107,'Пять вычислительных цепочек','Сохраняй результат в конце каждой строки: он становится начальным числом следующей. Отметь, когда выполняется деление, а когда умножение.','В цепочке от 56 сначала вычитаем 48 и получаем 8. Если следом стоит «умножь на 4», берём 8 и получаем 32.','После деления следующую строку всегда начинают заново с первого числа.'],
    [108,'Прочитай дробь и назови два её числа','Прочитай верхнее число, а затем название долей по нижнему числу. У составного знаменателя меняется последнее слово: 25 — двадцать пятых. Отдельно проверь, какие числа над чертой и под ней.','7/25 читают «семь двадцать пятых». Числитель 7, знаменатель 25.','Слова «сто сорок третьих» обозначают числитель одной и той же дроби при любом чтении.'],
    [109,'Какие точки совпали?','У точки одно положение на прямой, а записей дроби может быть несколько. Сравни координаты сокращением или умножением числителя и знаменателя на одно и то же число. Собери все имена, относящиеся к одному положению.','Для P(2/8), Q(1/4) и R(3/8) первые две записи называют одну точку. Точка R правее них.','Для совпадения точек достаточно равенства одних числителей.']
  ].map(([n,title,explanation,worked,misconception])=>({part:2,point:27,page:23,number:'5.'+n,key:'printed-5-'+n,title,explanation,worked:[worked],misconception,requires:['v5f-printed-'+({107:'5-67',108:'5-51',109:'5-100'})[n]],related:['v5f-printed-5-98'],reflect:'Каким способом можно проверить свой ответ?'}));
  function chain(seed,r,step){
    const problems=examples.map(([start,ops])=>{const scale=seed?r(2,8):1;return [scale*start,ops.map(([op,n])=>[op,op==='+'||op==='−'?n*scale:n])];});
    return chainLib.fromProblems(problems,step,'printed107');
  }
  function speak(seed,r,step){
    const pool=fresh.map(row=>row.slice()),rows=seed?sourceWords.map(()=>pool.splice(r(0,pool.length-1),1)[0]):sourceWords;
    return language.fromRows(108,rows,true,seed,step);
  }
  const fmt=q=>q[0]+'/'+q[1],equal=(a,b)=>a[0]*b[1]===a[1]*b[0];
  function classes(rows){
    const groups=[];rows.forEach((q,i)=>{const same=groups.find(g=>equal(rows[g[0]],q));if(same)same.push(i);else groups.push([i]);});return groups;
  }
  function canonical(raw){
    const v=String(raw).trim().toUpperCase().replace(/[АВСДЕК]/g,c=>({'А':'A','В':'B','С':'C','Д':'D','Е':'E','К':'K'})[c]);
    if(!v||v.length>120||/[^ABCDEКK=\s,;|]/.test(v))return null;
    const clauses=v.split(/[;|]/).map(s=>s.trim());if(clauses.some(s=>!s))return null;
    const sets=[];
    for(const clause of clauses){const names=clause.match(/[ABCDEK]/g)||[];if(names.length<2||new Set(names).size!==names.length)return null;
      const joined=new Set(names);for(let i=sets.length-1;i>=0;i--)if(Array.from(sets[i]).some(n=>joined.has(n))){for(const n of sets[i])joined.add(n);sets.splice(i,1);}sets.push(joined);}
    return sets.map(s=>Array.from(s).sort().join('')).sort().join(';');
  }
  function samePoints(seed,r,step){
    let rows=printed.map(q=>q.slice());
    if(seed){
      const choices=[[1,4],[1,3],[1,6],[2,5],[3,7],[2,9]],take=()=>choices.splice(r(0,choices.length-1),1)[0],a=take(),b=take(),c=take();
      rows=[a,b,a,c,a,b].map(([n,d])=>{const m=r(1,6);return [n*m,d*m];});
      for(let i=5;i>0;i--){const j=r(0,i);[rows[i],rows[j]]=[rows[j],rows[i]];}
    }
    const groups=classes(rows),shared=groups.filter(g=>g.length>1),target=shared.map(g=>g.map(i=>labels[i]).join('=')).join(';'),single=groups.find(g=>g.length===1)[0];
    const coords=labels.map((label,i)=>label+'('+fmt(rows[i])+')').join(', ');
    return {...step('Даны '+coords+'. Собери все группы совпадающих точек. Имена внутри группы соедини знаком =, а между группами поставь точку с запятой.',target,
      'У равных дробей совпадает положение на прямой. Одиночную точку в группу включать не нужно.'),answerFormat:'v5-coincident-groups',
      steps:[step('Посмотри на координаты '+coords+'. Сколько разных мест займут шесть имён?',groups.length,'Ищи равные значения всей дроби. Совпавшие имена занимают одно место.',[{value:6,text:'Это число имён. Проверь пары дробей, которые можно сократить до одной и той же записи.'}]),
        {...step('У какого имени нет другой точки с той же координатой? Введи букву.',labels[single],'Сопоставь всем именам положения после сокращения.'),answerFormat:'v5-single-coordinate-label'}],
      data:{coincidentPoints:rows},conditionKey:'points109/'+rows.map(fmt).join('/')};
  }
  const labelValue=s=>String(s).trim().toUpperCase().replace(/^ТОЧКА\s+/,'').replace(/[АВСДЕК]/g,c=>({'А':'A','В':'B','С':'C','Д':'D','Е':'E','К':'K'})[c]);
  function feedback(t,raw){
    const groups=canonical(raw),rows=t.data.coincidentPoints;if(!groups)return '';
    for(const group of groups.split(';')){const names=group.split('');for(const n of names.slice(1))if(!equal(rows[labels.indexOf(names[0])],rows[labels.indexOf(n)]))return 'Сравни '+names[0]+' и '+n+': у них разные координаты. Проверь произведения крест-накрест.';}
    return 'В названных группах точки совпадают. Проверь, вошло ли каждое имя с такой же координатой.';
  }
  function pointTable(qs){
    return '<figure style="margin:.5em 0"><figcaption>Имена и их координаты</figcaption><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.3em">'+qs.map((q,i)=>'<span style="padding:.3em;background:#e6f3ed">'+labels[i]+' · '+fmt(q)+'</span>').join('')+'</div></figure>';
  }
  function positions(rows,a,b){
    const x=i=>14+250*rows[i][0]/rows[i][1],dot=(i,k)=>'<circle cx="'+x(i)+'" cy="47" r="'+(k?3:5)+'" fill="'+(k?'#a85936':'#358477')+'"/><path d="M'+x(i)+' 47v'+(k?13:-13)+'" stroke="#48756a"/><text x="'+x(i)+'" y="'+(k?73:30)+'" text-anchor="middle" style="font:13px system-ui,sans-serif">'+labels[i]+'</text>';
    return '<svg class="v5q-printed-geometry" role="img" aria-label="Координаты на одной прямой: '+labels[a]+' '+fmt(rows[a])+', '+labels[b]+' '+fmt(rows[b])+'" viewBox="0 0 280 93" style="width:100%;max-width:400px;display:block"><path d="M14 47H270m-5 -4 5 4-5 4M14 43v8M264 43v8" stroke="#355950" fill="none"/>'+dot(a,0)+dot(b,1)+'<text x="14" y="89" text-anchor="middle" style="font:12px system-ui,sans-serif">0</text><text x="264" y="89" text-anchor="middle" style="font:12px system-ui,sans-serif">1</text></svg>';
  }
  function explorePoints(t,s){
    const qs=t.data.coincidentPoints,a=s.leftName,b=s.rightName,groups=classes(qs);
    const cell=i=>'<p>'+labels[i]+': '+fmt(qs[i])+'</p>';
    return {title:'Сравни два положения',controls:[{key:'leftName',title:'Первое имя',values:labels.map((x,i)=>[i,x])},{key:'rightName',title:'Второе имя',values:labels.map((x,i)=>[i,x])}],
      visual:positions(qs,a,b)+'<div style="display:flex;gap:1em">'+cell(a)+cell(b)+'</div>',
      question:'Сколько разных положений на прямой займут эти два имени?',answer:groups.some(g=>g.includes(a)&&g.includes(b))?1:2,
      why:'У совпавших координат произведения числителя одной дроби и знаменателя другой равны.'};
  }
  const api={lessons,generators:{'5.107':chain,'5.108':speak,'5.109':samePoints},bounds:{'5.107':chainLib.bounds['5.67'],'5.108':{row:[0,10,0],part:[0,1,0]},'5.109':{leftName:[0,5,0],rightName:[0,5,1]}},canonical,labelValue,feedback,draw:t=>pointTable(t.data.coincidentPoints),explore:explorePoints};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5ChainsAndEqualPoints=api;
})(typeof window!=='undefined'?window:globalThis);

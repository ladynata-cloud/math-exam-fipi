/* Names of objects in figure 1.19 and repeated lengths on a ray, part 1, page 24. */
(function(root){
  'use strict';
  const lines=typeof module!=='undefined'&&module.exports?require('./vilenkin5-printed-lines.js'):root.Vilenkin5PrintedLines;
  const lessons=[
    {number:'1.100',key:'printed-1-100',title:'Выбираем свои точки, отрезки и лучи',
      explanation:'Имя отрезка можно читать с любого конца. У луча важно, откуда и куда он идёт: названия с одинаковым началом и одинаковым направлением могут обозначать один и тот же луч. Выбери собственные примеры на продолженной прямой.',
      worked:['Если U, V и W лежат на прямой в таком порядке, лучи UV и UW совпадают. Луч WU направлен в другую сторону и начинается в W.','Отрезок UV совпадает с VU. У лучей UV и VU при этом разные начала.'],
      misconception:'Если у лучей разные вторые буквы, лучи обязательно разные.',reflect:'Как ещё можно назвать выбранный луч, сохранив его начало и направление?'},
    {number:'1.101',key:'printed-1-101',title:'Откладываем равные отрезки вдоль луча',
      explanation:'Откладывай каждую следующую длину от конца предыдущего отрезка в том же направлении. Конец отрезка с номером n расположен на расстоянии n одинаковых длин от начала луча. Рисунок можно рассмотреть в начале и далеко от начала.',
      worked:['Если одна длина 2 см, первые три конца находятся на отметках 2, 4 и 6 см. Конец сотого отрезка — в 200 см от начала.'],
      misconception:'Если конец отрезка ушёл за край рисунка, отложить следующий отрезок уже невозможно.',reflect:'Какие отметки появятся непосредственно перед тысячным отрезком и сразу после него?'}
  ].map(l=>({...l,part:1,point:4,page:24,requires:['v5f-printed-1-93'],related:['v5f-printed-1-97']}));
  const aliases={'А':'A','В':'B','С':'C','Д':'D','К':'K','М':'M','Н':'H','О':'O','Р':'P','Т':'T','Х':'X'},norm=input=>String(input).trim().toUpperCase().replace(/[АВСДКМНОРТХ]/g,c=>aliases[c]);
  const err=(value,text)=>({value,text}),select=(key,title,labels)=>({key,title,values:labels.map((v,i)=>[i,v])});
  function read(input,rule){
    const s=rule.kind==='pencil'?String(input).trim().toUpperCase().replace(/[АКСДМРОЛНВЕТХУ]/g,k=>({'А':'A','К':'K','С':'C','Д':'D','М':'M','Р':'P','О':'O','Л':'L','Н':'N','В':'B','Е':'E','Т':'T','Х':'X','У':'U'})[k]):norm(input),points=rule.kind==='points',parts=points?Array.from(s.replace(/[\s;,]+/g,'')):s.split(/[\s,;]+/);
    if(!parts.length||parts.some(v=>!(points?/^[A-Z]$/:/^[A-Z]{2}$/).test(v)||!points&&v[0]===v[1]))return null;
    return parts;
  }
  function checkPencil(words,rule){
    const {pairs,outer}=rule,valid=new Map();
    for(const [a,b] of pairs)if(outer){valid.set(a+'A',a);valid.set(a+b,a);valid.set(b+'A',b);valid.set(b+a,b);}else{valid.set('A'+a,a);valid.set('A'+b,b);}
    const seen=new Set();
    for(const word of words){
      if(!valid.has(word))return outer?'Начни имя в одной из крайних отмеченных точек. Вторую букву бери на той же прямой по направлению к A.':'Начинай имя в A. Вторую букву выбирай на нужной прямой, по одну из сторон от A.';
      const key=valid.get(word);if(seen.has(key))return 'Этот луч уже назван. Два названия с одним началом и тем же направлением описывают один луч.';seen.add(key);
    }
    return seen.size===pairs.length*2?'':'Проверь обе стороны каждой указанной прямой. Одна из нужных точек ещё не дала имени лучу.';
  }
  function analyze(input,rule){
    const words=read(input,rule);if(!words)return {ok:false,message:'Проверь запись букв.'};
    if(rule.kind==='pencil'){const message=checkPencil(words,rule);return {ok:!message,message};}
    if(words.length!==rule.count)return {ok:false,message:'Посчитай записанные объекты. Сейчас нужно '+rule.count+'.'};
    if(rule.kind==='points')return {ok:new Set(words).size===rule.count&&words.every(n=>rule.labels.includes(n)),message:'Выбери четыре разные подписанные точки.'};
    if(words.some(n=>![...n].every(p=>rule.on.includes(p))))return {ok:false,message:'Оба имени должны обозначать точки на показанной прямой. Проверь точки в стороне от неё.'};
    const ids=words.map(n=>rule.kind==='rays'?n[0]+Math.sign(rule.on.indexOf(n[1])-rule.on.indexOf(n[0])):[...n].sort().join('')),same=new Set(ids).size!==rule.count;
    return {ok:!same,message:same?(rule.kind==='rays'?'Сравни первые буквы и направление. Два названия указывают на один и тот же луч.':'Отрезок с теми же концами остаётся тем же при обратном чтении букв.'):'Каждый объект имеет подходящее название.'};
  }
  function available(kind,list){
    const keys=new Set(),result=[];
    for(const a of list)for(const b of list)if(a!==b){const key=kind==='rays'?a+Math.sign(list.indexOf(b)-list.indexOf(a)):[a,b].sort().join('');if(!keys.has(key)){keys.add(key);result.push(a+b);}}
    return result;
  }
  function named(seed,r,step){
    const src=lines.generators['1.92'](seed,r,step),d=src.data.linePoints,on=d.names.filter(n=>lines.onLine(d,d.points[n])).sort((a,b)=>d.points[a][0]-d.points[b][0]),segments=available('segments',on),rays=available('rays',on);
    const target=(kind,count,prompt,answer,why,errors=[])=>({...step(prompt,answer,why,errors),answerFormat:'v5-ray-objects',objectRule:{kind,count,on,labels:d.names}});
    const first=d.names.slice(0,4).join(''),a=on[0],b=on[1],c=on[2];
    const steps=[target('points',4,'Выбери и назови четыре разные подписанные точки рисунка. Можно взять и точки вне прямой.',first,'Сосчитай разные буквы своего списка.'),
      target('segments',3,'Назови любые три различных отрезка показанной прямой. Запиши три пары букв.',segments.slice(0,3).join(' '),'Для каждого отрезка нужны два конца. Перестановка концов не прибавляет новый отрезок.',[err(a+b+' '+b+a+' '+a+c,'Первые два названия задают отрезок с теми же концами.')]),
      target('rays',3,'Назови три различных луча на этой прямой. У каждого первым пиши начало.',rays.slice(0,3).join(' '),'Сравни начало и направление. Один луч можно назвать несколькими парами букв.',[err(a+b+' '+a+c+' '+b+a,'Первые два луча начинаются в одной точке и идут в одну сторону. Замени один из них.')])];
    steps.push(target('line',1,'Выбери любое название показанной прямой по двум лежащим на ней точкам.',a+b,'Две различные точки прямой определяют её целиком.'));
    return {prefix:seed?'Новая авторская схема. ':'Авторская реконструкция рисунка 1.19. ',prompt:'Сколько различных прямых определяют все допустимые пары лежащих на одной прямой точек?',inputPrompt:'Число прямых',answer:1,steps,
      errors:[err(on.length,'Посчитаны отмеченные точки. Все выбранные пары определяют одну и ту же прямую.')],data:{objects:{line:d,on}},table:{caption:'Четыре задания на названия',headers:['Фигура','Сколько выбрать'],rows:[['Точки',4],['Отрезки',3],['Лучи',3],['Прямая',1]]},conditionKey:src.conditionKey};
  }
  function chain(seed,r,step){
    const width=seed?r(2,6):3,n=seed?r(3,6):4,far=seed?r(120,990)*2+1:1001;
    const steps=Array.from({length:n},(_,i)=>step('На каком расстоянии от O будет конец отрезка №'+(i+1)+', если каждая длина '+width+' см? Ответь в сантиметрах.',(i+1)*width,'Начни от предыдущего конца и прибавь одну длину.',i?[err(width,'Записана длина одного отрезка. Найди расстояние от начала всего луча.')]:[]));
    steps.push({...step('Можно ли от начала этого луча последовательно отложить '+far+' таких отрезков? Введи да или нет.','да','Для любого конечного числа отрезков на луче есть место.',[err('нет','Край листа ограничивает рисунок. Луч продолжается, и отрезок можно откладывать дальше.')]),answerFormat:'v5-check-word'});
    return {prefix:'Работай по лучу OM в одном направлении. ',prompt:'Проверь своё построение вычислением. На каком расстоянии в сантиметрах от O будет конец отрезка №'+far+'?',inputPrompt:'Расстояние от O, см',answer:far*width,steps,errors:[err((far-1)*width,'Это начало последнего отрезка. Отложи ещё одну длину до его конца.'),err(far,'Это число отрезков. Каждый из них длиннее одного сантиметра.')],
      data:{chain:{width,n,far}},table:{caption:'Два участка одного луча',headers:['Что откладываем','Данные'],rows:[['Длина отрезка',width+' см'],['Первые отрезки',n],['Дальний номер',far]]},conditionKey:[width,n,far].join('/')};
  }
  function strip(d,at,count){
    const left=20,right=235,span=Math.max(1,count),parts=Array.from({length:count},(_,i)=>'<path d="M'+(left+i*(right-left)/span)+' 47h'+(right-left)/span+'" stroke="'+(i%2?'#9e5427':'#366b77')+'" stroke-width="4"/>').join('');
    const ticks=Array.from({length:count+1},(_,i)=>{const x=left+i*(right-left)/span;return '<path d="M'+x+' 40v14" stroke="#304755"/><text x="'+x+'" y="'+(i%2?76:64)+'" text-anchor="middle" style="font-size:11px">'+(at+i)*d.width+'</text>';}).join('');
    return '<svg role="img" viewBox="0 0 258 84" aria-label="Отметки луча от '+at*d.width+' до '+(at+count)*d.width+' сантиметров"><path d="M9 47H248 M241 43l7 4-7 4" fill="none" stroke="#315966"/>'+parts+ticks+(at?'<path d="M8 42l4 10m0-10 4 10" stroke="#642f48"/><text x="21" y="22" style="font-size:11px">Далеко от O</text>':'<text x="16" y="29" style="font-size:14px">O</text>')+'<text x="232" y="26" style="font-size:11px">см</text></svg>';
  }
  function diagram(t){if(t.data.objects)return lines.diagram({data:{linePoints:t.data.objects.line}});const d=t.data.chain;return strip(d,0,d.n);}
  function explore(l,s,t){
    if(t.data.objects){const {line,on}=t.data.objects,list=on,a=list[s.a%list.length],b=list[s.b%list.length],c=list[s.c%list.length],x=list.indexOf(a),y=list.indexOf(b),z=list.indexOf(c),legal=a!==b&&a!==c;
      const axis=(key,title,k)=>({key,title,values:list.map((label,i)=>[i===k%list.length?k:i,label])});
      return {title:'Сравни два имени с одним началом',controls:[axis('a','Общее начало',s.a),axis('b','Вторая буква первого имени',s.b),axis('c','Вторая буква второго имени',s.c),select('what','Какие фигуры',['Лучи','Отрезки'])],
        visual:lines.diagram({data:{linePoints:line}})+'<p>Сравни '+a+b+' и '+a+c+'.</p>',question:'Это два допустимых названия одной и той же фигуры? 1 — да, 0 — нет.',answer:Number(legal&&(s.what?b===c:Math.sign(y-x)===Math.sign(z-x))),why:!legal?'Для названия нужны две разные точки.':s.what?'Для совпадения отрезков совпасть должны оба конца.':'У совпадающих лучей совпадают начало и направление.'};
    }
    const d=t.data.chain,begin=s.zone?d.far-4:0,offset=s.at+1,index=begin+offset;
    return {title:'Посмотри луч вблизи и вдали',controls:[select('zone','Участок',['У начала O','У дальнего отрезка']),select('at','Какой конец от начала участка',['Первый','Второй','Третий','Четвёртый'])],visual:strip(d,begin,4),
      question:'Сколько сантиметров от O до конца отрезка №'+index+'?',answer:d.width*index,why:'Каждый полный отрезок добавляет '+d.width+' см. Умножь длину на число пройденных отрезков.'};
  }
  const api={lessons,generators:{'1.100':named,'1.101':chain},bounds:{'1.100':{a:[0,4,0],b:[0,4,1],c:[0,4,2],what:[0,1,0]},'1.101':{zone:[0,1,0],at:[0,3,0]}},read,analyze,explore,diagram,available};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5RayObjects=api;
})(typeof window!=='undefined'?window:globalThis);

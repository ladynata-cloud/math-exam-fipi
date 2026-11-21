/* Vilenkin 2023, first volume, point 4, p.26. Open constructions: evaluate the drawing the pupil actually chose. */
(function(root){
  'use strict';
  const lessons=[
    ['1.119','Расположи семь точек относительно луча FE','Начни в F и двигайся через E по прямой. Точка на той же прямой, но с другой стороны от F, лучу FE не принадлежит. Точки в стороне от прямой ему также не принадлежат.','Если F стоит в третьем столбце и E в шестом, средняя точка второго столбца оказывается позади начала, а средняя точка пятого — на луче.','Любая точка прямой FE лежит также на луче FE.'],
    ['1.120','Назови все углы своего рисунка','Поставь O между K и M, затем нарисуй два луча OL и ON из O. У каждого угла вершиной будет O, а его две стороны должны быть разными лучами. При подсчёте один угол можно назвать в обоих направлениях. Угол из противоположных лучей тоже входит в ответ.','Два луча с разными именами, которые идут из одной точки в одном направлении, совпадают. Перебирай пары действительно различных направлений.','Названия KOL и LOK обозначают два разных угла.'],
    ['1.121','Три положения отрезка относительно прямой','Отрезок с обоими концами на прямой лежит на ней целиком. Если концы по разные стороны, внутри отрезка есть точка пересечения. Если только один конец на прямой, общей точкой будет он. Когда оба конца с одной стороны и вне прямой, весь отрезок остаётся там же.','Можно выбрать один конец на верхней линии клеток, а второй на нижней: отрезок между ними пересекает среднюю прямую. Высоту обоих концов можно менять, сохраняя их стороны.','Если оба конца не лежат на прямой, отрезок не может её пересечь.']
  ].map(([number,title,explanation,example,misconception])=>({number,title,key:'printed-'+number.replace('.','-'),explanation,worked:[example],misconception,reflect:'Как изменится рисунок, если перенести один из отмеченных концов?',part:1,point:4,page:26,requires:['v5f-printed-1-118'],related:['v5f-printed-1-94']}));
  const select=(key,title,labels)=>({key,title,values:labels.map((v,i)=>[i,v])}),err=(value,text)=>({value,text});
  const rows=['В','Л','Н'],seven='KLMOPRT',alias={'А':'A','В':'B','С':'C','Д':'D','Е':'E','К':'K','М':'M','О':'O','Р':'P','Т':'T'},cap=s=>String(s).trim().toUpperCase().replace(/[АВСДЕКМОРТ]/g,k=>alias[k]);
  function cells(raw,required){
    const parts=String(raw).trim().toUpperCase().split(/[\s,;]+/),result={};
    for(const token of parts){const m=token.match(/^([A-ZАВСДЕКМОРТ])([1-9])([ВЛН])$/u);if(!m||!required.includes(cap(m[1]))||result[cap(m[1])])return null;result[cap(m[1])]=[+m[2],m[3]];}
    return parts.length===required.length?result:null;
  }
  const member=(p,{f,e})=>p[1]==='Л'&&(p[0]-f)*Math.sign(e-f)>=0;
  function angles(raw){
    const parts=String(raw).split('/');if(parts.length!==2)return null;
    const m=parts[0].trim().match(/^(1[0-2]|[1-9])\s*[;,]\s*(1[0-2]|[1-9])$/),names=cap(parts[1]).split(/[\s,;]+/);
    if(!m||!names.every(word=>/^[KMLN]O[KMLN]$/.test(word)&&word[0]!==word[2]))return null;
    return {l:+m[1],n:+m[2],names};
  }
  const clock=n=>(n-1+12)%12+1;
  function anglePairs(directions){
    const seen=new Map();
    for(const a of Object.keys(directions))for(const b of Object.keys(directions)){if(directions[a]===directions[b])continue;const key=[directions[a],directions[b]].sort((a,b)=>a-b).join('/');if(!seen.has(key))seen.set(key,a+'O'+b);}
    return seen;
  }
  function check(input,t){
    if(t.answerFormat==='v5-drawn-angles'){
      const got=angles(input);if(!got)return 'Сначала укажи две часовые отметки от 1 до 12 через точку с запятой, затем / и названия углов из трёх букв с O в середине.';
      const dirs={K:t.k,M:clock(t.k+6),L:got.l,N:got.n},all=anglePairs(dirs),seen=new Set();
      for(const word of got.names){const x=dirs[word[0]],y=dirs[word[2]];if(x===y)return 'У '+word+' обе буквы указывают на один и тот же луч. Для этого задания нужны две разные стороны.';seen.add([x,y].sort((a,b)=>a-b).join('/'));}
      if(seen.size!==all.size)return 'Проверь пары направлений. Возможно, пропущен развёрнутый угол, или один угол записан в обратном порядке вместо недостающего.';
      return '';
    }
    const labels=t.plotNames,got=cells(input,labels);
    if(!got)return 'Нужна отдельная запись для каждой метки '+labels.split('').join(', ')+'. Запиши букву, столбец и ряд, например '+labels[0]+'3Л.';
    if(new Set(Object.values(got).map(p=>p.join(''))).size!==labels.length)return 'У разных меток должны быть разные места. Перенеси одну из совпавших точек.';
    if(t.answerFormat==='v5-seven-ray'){
      for(const [letter,p] of Object.entries(got)){
        if(p[1]==='Л'&&[t.ray.f,t.ray.e].includes(p[0]))return 'Место занято исходной меткой F или E. Выбери для '+letter+' отдельную точку.';
        if(member(p,t.ray)!=='KLM'.includes(letter))return 'KLM'.includes(letter)?'Точка '+letter+' должна быть на луче. Начни в F и двигайся к E по средней прямой.':'Точка '+letter+' сейчас на луче. Поставь её за F или в другой ряд.';
      }return '';
    }
    const [a,b]=Array.from(labels,c=>got[c][1]),hits=a==='Л'&&b==='Л'?'along':a===b?'miss':'meet';
    if(hits===t.relation)return '';
    return t.relation==='along'?'Оба конца должны находиться на средней прямой SR.':t.relation==='meet'?'Для одной общей точки выбери концы по разные стороны от SR или ровно один конец на SR.':'Оба конца должны лежать вне SR по одну и ту же сторону.';
  }
  function sevenPoints(seed,r,step){
    const f=seed?r(3,7):3,e=seed?(f>=6?f-2:f+2):5,ray={f,e},dir=Math.sign(e-f);
    const candidates=Array.from({length:9},(_,i)=>i+1).filter(x=>(x-f)*dir>=0&&x!==e&&x!==f);
    // When the directed side offers just two grid positions, extend the drawing interval toward the longer side.
    if(candidates.length<3){ray.e=f-dir*2;}
    const pool=Array.from({length:9},(_,i)=>i+1).filter(x=>member([x,'Л'],ray)&&![ray.f,ray.e].includes(x)),back=ray.f-Math.sign(ray.e-ray.f),answer=['K'+pool[0]+'Л','L'+pool[1]+'Л','M'+pool[2]+'Л','O'+back+'Л','P1В','R3Н','T7В'].join(' ');
    const steps=[{...step('На средней прямой F занимает столбец '+ray.f+', E — '+ray.e+'. Расставь K, L, M на луче FE, а O, P, R, T вне него. Введи семь мест, например K8Л. Столбцы 1–9, ряды В (верх), Л (прямая), Н (низ).',answer,'Луч начинается в F, проходит через E и продолжается дальше по стрелке.'),answerFormat:'v5-seven-ray',ray,plotNames:seven}];
    return {prefix:'Ты выбираешь все семь новых мест. ',prompt:'Входит ли в луч FE среднее деление столбца '+back+', расположенное непосредственно позади F? Ответь да или нет.',inputPrompt:'Да или нет',answer:'нет',answerFormat:'v5-check-word',steps,errors:[err('да','Эта точка лежит на продолжении прямой за началом. До неё нельзя попасть, двигаясь от F в сторону E.')],data:{seven:ray},table:{caption:'Построение на клетках',headers:['Метки','Положение'],rows:[['F, E','Столбцы '+ray.f+' и '+ray.e],['K, L, M','На луче FE'],['O, P, R, T','Вне луча FE']]},conditionKey:ray.f+'/'+ray.e};
  }
  function freeAngles(seed,r,step){
    const k=seed?r(1,12):9,m=clock(k+6),l=clock(k+3),n=clock(k+7),example=l+';'+n+' / '+Array.from(anglePairs({K:k,M:m,L:l,N:n}).values()).join(' ');
    const steps=[{...step('Отметь O между K и M. На ориентире как на часах OK идёт к '+k+', OM — к '+m+'. Проведи собственные OL и ON. Запиши их часовые отметки через точку с запятой, затем / и все различные углы с вершиной O. Включи развёрнутые углы. Любое верное имя каждого угла подойдёт.',example,'Составь все пары действительно разных направлений. Перестановка крайних букв не образует нового угла.'),answerFormat:'v5-drawn-angles',k}];
    return {prefix:'Сделай своё расположение двух лучей на круговом ориентире. ',prompt:'Сколько различных углов получается в случае четырёх различных направлений из O?',inputPrompt:'Число углов, включая развёрнутые',answer:6,steps,errors:[err(12,'Пары лучей посчитаны дважды: угол KOL совпадает с LOK.'),err(5,'Включи угол KOM из двух противоположных лучей.')],data:{angles:{k,m,l,n}},table:{caption:'Откуда выходят лучи',headers:['Луч','Направление'],rows:[['OK','К '+k+' часам'],['OM','К '+m+' часам'],['OL, ON','Выбираешь сам']]},conditionKey:'clock'+k};
  }
  const cellsOf=(letters,xs,ys)=>Array.from(letters,(c,i)=>c+xs[i]+ys[i]).join(' ');
  function threeSegments(seed,r,step){
    const places=seed?[r(1,4),r(5,9)]:[2,7],tasks=[['MN','along','лежит на прямой SR',['Л','Л']],['AD','meet','имеет с прямой SR ровно одну общую точку',['В','Н']],['PQ','miss','не имеет общих точек с прямой SR',['В','В']]];
    const steps=tasks.map(([name,relation,ask,ys],i)=>({...step('абв'[i]+'. Проведи отрезок '+name+', который '+ask+'. Назови оба конца в своей сетке, например '+name[0]+'2В '+name[1]+'7Н. Места выбираешь сам.',cellsOf(name,places,ys),'Проверь положение каждого конца относительно средней прямой и проведи прямой отрезок между ними.'),answerFormat:'v5-positioned-segment',relation,plotNames:name}));
    return {prefix:'Прямая SR проходит по ряду Л. Ряд В находится сверху, Н — снизу. ',prompt:'В проверочном примере один конец в столбце '+places[0]+' верхнего ряда, второй в столбце '+places[1]+' нижнего. Сколько общих точек у отрезка и SR?',inputPrompt:'Количество общих точек',answer:1,steps,errors:[err(0,'Концы по разные стороны от прямой. При движении от одного к другому средний ряд приходится пересечь.')],data:{positions:places},table:{caption:'Чего добиться на каждом рисунке',headers:['Отрезок','Положение'],rows:tasks.map(([obj,,what])=>[obj,what])},conditionKey:places.join('/')};
  }
  function grid(points,line,segment){
    const x=i=>21+23*i,y=row=>({В:30,Л:59,Н:88})[row];
    let svg='<svg role="img" viewBox="0 0 274 105" aria-label="Три ряда и девять столбцов. Отмечены '+Object.keys(points).join(', ')+'.">';
    for(let i=1;i<=9;i++)svg+='<path d="M'+x(i)+' 20v75" stroke="#dce2de"/><text x="'+x(i)+'" y="15" text-anchor="middle" style="font:12px sans-serif">'+i+'</text>';
    for(const row of rows)svg+='<path d="M23 '+y(row)+'H252" stroke="#d7dfdd"/><text x="8" y="'+(y(row)+4)+'" style="font:12px sans-serif">'+row+'</text>';
    if(line.f){const tip=line.e>line.f?256:18,flag=line.e>line.f?-7:7;svg+='<path d="M'+x(line.f)+' 59H'+tip+'l'+flag+' -4m'+(-flag)+' 4l'+flag+' 4" stroke="#246657" stroke-width="2.4" fill="none"/>';points={F:[line.f,'Л'],E:[line.e,'Л'],...points};}
    else svg+='<path d="M20 59H254" stroke="#246657" stroke-width="2"/><text x="19" y="55" style="font:bold 11px sans-serif">S</text><text x="251" y="55" style="font:bold 11px sans-serif">R</text>';
    if(segment){const [a,b]=Array.from(segment,k=>points[k]);if(a&&b)svg+='<path d="M'+x(a[0])+' '+y(a[1])+'L'+x(b[0])+' '+y(b[1])+'" stroke="#90442b" stroke-width="3"/>';}
    return svg+Object.entries(points).map(([c,p])=>'<circle cx="'+x(p[0])+'" cy="'+y(p[1])+'" r="3" fill="#60382d"/><text x="'+(x(p[0])+3)+'" y="'+(y(p[1])-4)+'" style="font:bold 12px sans-serif;paint-order:stroke;stroke:white;stroke-width:2px">'+c+'</text>').join('')+'</svg>';
  }
  function clockDrawing(d){
    const cx=100,cy=83,point=(hour,r)=>{const ang=hour*Math.PI/6;return [cx+r*Math.sin(ang),cy-r*Math.cos(ang)];};
    let s='<svg role="img" viewBox="0 0 200 168" aria-label="Часовые направления лучей из точки O: '+Object.entries(d).map(([c,n])=>c+' '+n).join(', ')+'"><circle cx="100" cy="83" r="64" fill="#fbf8ed" stroke="#a1ada5"/>';
    for(let i=1;i<=12;i++){const [a,b]=point(i,75);s+='<text x="'+a+'" y="'+(b+4)+'" text-anchor="middle" style="font:10px sans-serif">'+i+'</text>';}
    const groups={};for(const [c,n] of Object.entries(d))(groups[n]??=[]).push(c);
    for(const [n,members] of Object.entries(groups)){const [a,b]=point(n,62);s+='<path d="M100 83L'+a+' '+b+'" stroke="#2c7063" stroke-width="2"/>';members.forEach((c,i)=>{const [px,py]=point(n,46-i*13);s+='<circle cx="'+px+'" cy="'+py+'" r="2" fill="#493b29"/><text x="'+(px+3)+'" y="'+(py-3)+'" style="font:bold 10px sans-serif;paint-order:stroke;stroke:#fbf8ed;stroke-width:2px">'+c+'</text>';});}
    return s+'<circle cx="100" cy="83" r="2.7" fill="#463825"/><text x="104" y="96" style="font:bold 11px sans-serif">O</text></svg>';
  }
  function diagram(t,scene={}){
    const arr=scene.answers||[];if(t.data.seven)return grid(cells(arr[0]||'',seven)||{},t.data.seven);
    if(t.data.angles){const d=t.data.angles,a=angles(arr[0]||'');return clockDrawing({K:d.k,M:d.m,L:a?.l||d.l,N:a?.n||d.n});}
    const i=Math.min(scene.step||0,2),name=['MN','AD','PQ'][i];return grid(cells(arr[i]||'',name)||{}, {},name);
  }
  function explore(l,s,t){
    if(t.data.seven){const name=seven[s.point],p=[s.x,rows[s.row]],belongs=member(p,t.data.seven);return {title:'Передвигай одну метку относительно начала',controls:[select('point','Метка',Array.from(seven)),{key:'x',title:'Столбец',min:1,max:9,step:1},select('row','Ряд',['Верх','Прямая','Низ']),select('ask','Что проверить',['Принадлежность лучу','Условие для этой метки'])],visual:grid({[name]:p},t.data.seven),question:s.ask?'Удовлетворяет ли положение этой метки условию задачи? 1 — да, 0 — нет.':'Принадлежит ли точка лучу FE? 1 — да, 0 — нет.',answer:s.ask?Number(belongs==='KLM'.includes(name)&&!(p[1]==='Л'&&[t.data.seven.f,t.data.seven.e].includes(p[0]))):Number(belongs),why:'Проверь ряд, направление от F и то, свободно ли выбранное место.'};}
    if(t.data.angles){const d={K:t.data.angles.k,M:t.data.angles.m,L:s.l,N:s.n},n=new Set(Object.values(d)).size;return {title:'Поверни два луча около O',controls:[{key:'l',title:'Куда направлен OL, час',min:1,max:12,step:1},{key:'n',title:'Куда направлен ON, час',min:1,max:12,step:1},select('ask','Сосчитай',['Различные углы','Различные направления'])],visual:clockDrawing(d),question:s.ask?'Сколько действительно разных направлений у лучей сейчас?':'Сколько разных углов между парами различных лучей на этом рисунке?',answer:s.ask?n:n*(n-1)/2,why:'Совпавшие направления считаются один раз. Для каждого угла нужны две разные стороны.'};}
    const name=['MN','AD','PQ'][s.name],a=rows[s.a],b=rows[s.b],list={[name[0]]:[t.data.positions[0],a],[name[1]]:[t.data.positions[1],b]},answer=a==='Л'&&b==='Л'?2:a===b?0:1;return {title:'Проверь концы и весь отрезок',controls:[select('name','Отрезок',['MN','AD','PQ']),select('a','Ряд первого конца',['Верх','Линия','Низ']),select('b','Ряд второго конца',['Верх','Линия','Низ'])],visual:grid(list,{},name),question:'Как расположен отрезок? 0 — нет общих точек с SR, 1 — одна, 2 — лежит целиком.',answer,why:'Расположение определяется тем, по какую сторону от SR или на ней находятся концы.'};
  }
  const api={lessons,generators:{'1.119':sevenPoints,'1.120':freeAngles,'1.121':threeSegments},bounds:{'1.119':{point:[0,6,0],x:[1,9,8],row:[0,2,1],ask:[0,1,0]},'1.120':{l:[1,12,12],n:[1,12,4],ask:[0,1,0]},'1.121':{name:[0,2,0],a:[0,2,0],b:[0,2,2]}},cells,angles,anglePairs,check,diagram,explore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5Constructions26=api;
})(typeof window!=='undefined'?window:globalThis);

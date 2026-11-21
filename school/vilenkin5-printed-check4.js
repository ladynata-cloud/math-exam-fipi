/* Page 27: one printed end-of-point check with seven questions and figure 1.24. */
(function(root){
  'use strict';
  const lesson={number:'check-4',key:'printed-check-4',title:'Проверочная работа · прямые и лучи рисунка 1.24',part:1,point:4,page:27,sourceCheck:true,
    explanation:'Сначала продли обе прямые по линейке через их отмеченные точки. Затем для каждого луча проверь, где его начало и в какую сторону он идёт. Одна и та же точка пересечения двух прямых может лежать вне одного из выбранных лучей.',
    worked:['Если X, Y и Z идут по прямой в этом порядке, лучи YX и YZ направлены в разные стороны. Прямая YZ продолжается в обе стороны.','Когда две разные прямые встречаются в U, проведённая через третью точку и U прямая может встретить обе исходные в одной и той же точке U.'],
    misconception:'Любое пересечение двух прямых автоматически принадлежит любым названным на них лучам.',reflect:'Как проверить принадлежность точки лучу, если она оказалась за цветным следом?',requires:['v5f-printed-1-117','v5f-printed-1-119'],related:['v5f-printed-1-120']};
  const labelAliases={А:'A',В:'B',С:'C',Ф:'F',М:'M',Н:'N',О:'O',Р:'P',Т:'T'},upper=s=>String(s).trim().toUpperCase().replace(/[АВСФМНОРТ]/g,c=>labelAliases[c]);
  const all='ABCFMNOPQRT',incl='FMNOPT',out='ABCQR',norm=s=>Array.from(new Set(s)).sort().join(''),select=(k,title,list)=>({key:k,title,values:list.map((w,i)=>[i,w])}),err=(value,text)=>({value,text});
  function parse(raw,kind){
    let v=upper(raw);
    if(kind==='set'){v=v.replace(/[\s,;]+/g,'');return v&&[...v].every(c=>all.includes(c))?norm(v):null;}
    if(kind==='pair'){const names=v.split(/[\s,;]+/);return names.length===2&&names.every(s=>s.length===2&&[...s].every(c=>all.includes(c))&&s[0]!==s[1])?names:null;}
    v=v.replace(/\s+/g,'');return v.length===2&&[...v].every(c=>all.includes(c))&&v[0]!==v[1]?v:null;
  }
  function diagnosis(raw,q){
    const v=parse(raw,q.geometryKind);if(!v)return q.geometryKind==='pair'?'Впиши два названия лучей через пробел. В каждом две разные буквы.':q.geometryKind==='set'?'Перечисли буквы отмеченных точек.':'Назови объект двумя буквами рисунка.';
    if(q.geometryKind==='set'){
      if(v===q.answer)return '';
      if(q.answer===incl&&(!v.includes('F')||!v.includes('T')))return 'Продли след MN выше O и ниже M. Проверь F и T на продолжениях одной и той же прямой.';
      if(q.answer===out&&(v.includes('F')||v.includes('T')))return 'След между цветными концами можно продолжить в обе стороны. Проверь F и T по линейке.';
      return 'Проверь каждую перечисленную букву на прямой PO, в том числе за окрашенным следом.';
    }
    if(q.geometryKind==='pair'){
      if(v.some(s=>s[0]!=='P'))return 'Оба луча образуются при делении прямой точкой P. Поэтому их названия должны начинаться с P.';
      const ends=v.map(s=>s[1]);return ends.some(c=>'MT'.includes(c))&&ends.some(c=>'NOF'.includes(c))?'':'От P одна сторона ведёт через M к T, другая через N к O и F. Нужны обе стороны.';
    }
    if(q.geometryKind==='line')return ['RT','TR'].includes(v)?'':'Чтобы общая точка для обеих исходных прямых была одной и той же, проведи новую прямую через R и через точку их встречи.';
    if(v[0]!=='A')return 'Дополнительный луч должен начинаться в той же точке A.';
    return q.left.includes(v[1])?'':'Проверь направление от A. Оно должно быть противоположно движению от A к C.';
  }
  function generate(seed,r,step){
    const crossX=seed?r(66,162):130,a=seed?(crossX<110?120:85):87,b=seed?r(20,47):28,c=seed?r(180,213):194,dx=seed?r(5,9):7,dy=seed?r(14,18):17;
    const abHasT=crossX<a,points={B:[b,125],A:[a,125],T:[crossX,125],C:[c,125],R:[crossX-45,70],Q:[crossX+85,65]};
    for(const [i,n] of Array.from('MPNOF').entries())points[n]=[crossX+(i+1)*dx,125-(i+1)*dy];
    const marks={points,dx,dy,abHasT},left=abHasT?'BT':'B',yes='да',no='нет',word=(text,c,hint,wrong)=>({...step(text,c?yes:no,hint,[err(c?no:yes,wrong)]),answerFormat:'v5-check-word'});
    const question=(text,ans,hint,geometryKind,extra={})=>({...step(text,ans,hint),answerFormat:'v5-figure124',geometryKind,...extra});
    const tests=[
      ['Луч AB и прямая OM имеют общую точку?',abHasT,'Прямая OM содержит T. Проверь, идёт ли луч от A через B в сторону T.'],
      ['Прямая AB и луч OM имеют общую точку?',true,'Луч OM идёт от O через M дальше и достигает горизонтальной прямой в T.'],
      ['Прямые AB и OM имеют общую точку?',true,'Обе прямые продолжаются без ограничения; их единственная общая точка T.'],
      ['Лучи AB и OM имеют общую точку?',abHasT,'Только T может принадлежать одновременно обеим несущим прямым. Проверь направления от A и от O.']
    ];
    const steps=[
      question('1. Назови дополнительный луч к AC на горизонтальной прямой.', 'AB','Начало A сохраняется; вторую точку ищи в противоположной от C стороне.','opposite',{left}),
      question('2а. Перечисли все отмеченные точки, принадлежащие прямой MN. Учти её продолжения.',incl,'Проведи линейку через M и N и проверь каждую букву на всей прямой.','set'),
      question('2б. Теперь перечисли все отмеченные точки вне прямой PO.',out,'PO — та же наклонная прямая. Выбери оставшиеся точки рисунка.','set'),
      question('3. Какими двумя лучами делится прямая MO в точке P? Укажи по одному имени для каждой стороны.', 'PM PO','Начало обоих лучей — точка деления; вторые буквы должны лежать по разные стороны.','pair'),
      word('4. Пересекаются ли прямые BC и MO?',true,'Они встречаются в T. Эту точку даёт продолжение наклонной прямой ниже M.','Продли MO в сторону M до горизонтальной прямой.'),
      word('5а. Есть ли общая точка у лучей AB и PM?',abHasT,'Луч PM доходит до T. Теперь проверь, окажется ли T на луче AB.','Единственный кандидат — T. Начни каждый луч с его первой буквы.'),
      word('5б. Есть ли общая точка у лучей AB и PO?',false,'Луч PO идёт от P вверх и не содержит T.','Из P через O движутся от горизонтальной прямой, а не к ней.'),
      question('6. Проведи через R прямую так, чтобы она встретила обе исходные прямые в одной и той же точке. Назови проведённую прямую двумя буквами.', 'RT','Используй точку R и точку встречи двух исходных прямых.','line'),
      ...tests.map(([text,truth,hint],i)=>word('7'+('абвг'[i])+'. '+text,truth,hint,hint))];
    return {prefix:'Печатная проверочная из семи заданий. ',prompt:'Какие из четырёх последних утверждений верны? Введи их номера от 1 до 4 через точку с запятой.',inputPrompt:'Номера верных утверждений',answer:tests.flatMap((t,i)=>t[1]?[i+1]:[]),answerFormat:'unordered',steps,errors:[],data:{fig124:marks},table:{caption:'Что исследуем на рисунке',headers:['№','Объекты'],rows:[[1,'Дополнительный луч'],[2,'Состав прямой и точки вне неё'],[3,'Два луча из P'],[4,'Прямые BC и MO'],[5,'Две пары лучей'],[6,'Своя прямая через R'],[7,'Четыре утверждения']]},conditionKey:[crossX,a,b,c,dx,dy].join('/')};
  }
  function svg(d,scope=0,extra=0){
    const p=d.points,line=(a,b,c,w,dash='')=>'<line x1="'+a[0]+'" y1="'+a[1]+'" x2="'+b[0]+'" y2="'+b[1]+'" stroke="'+c+'" stroke-width="'+w+'" '+dash+'/>';
    let body=line([13,125],[249,125],'#8b5137',2.1)+line([p.M[0]-d.dx*.35,p.M[1]+d.dy*.35],[p.O[0]+d.dx*.45,p.O[1]-d.dy*.45],'#956b9b',2.1);
    if(scope){const t=p.T;body+=line([t[0]-d.dx,t[1]+d.dy],[t[0]+6*d.dx,t[1]-6*d.dy],'#66507e',1.4,'stroke-dasharray="4 3"');}
    const options=[null,'T','M','A','Q'];if(extra){const r=p.R,q=p[options[extra]],vx=q[0]-r[0],vy=q[1]-r[1];body+=line([r[0]-vx*4,r[1]-vy*4],[r[0]+vx*4,r[1]+vy*4],'#2a766e',1.6,'stroke-dasharray="4 2"');}
    for(const [n,[x,y]] of Object.entries(p)){const h='BATC'.includes(n);body+='<circle cx="'+x+'" cy="'+y+'" r="2.8" fill="#293833"/><text x="'+(x+(h?0:5))+'" y="'+(y+(h?15:-4))+'" text-anchor="'+(h?'middle':'start')+'" style="font:bold 12px sans-serif;paint-order:stroke;stroke:white;stroke-width:2px">'+n+'</text>';}
    return '<svg role="img" viewBox="0 0 260 154" aria-label="Точки B, A, T, C на горизонтальной прямой, T, M, P, N, O, F на наклонной. R и Q отдельно.">'+body+'</svg>';
  }
  function explore(l,s,t){
    const d=t.data.fig124,pair=['AB и прямая OM','прямая AB и луч OM','прямые AB и OM','лучи AB и OM','лучи AB и PM','лучи AB и PO'][s.pair];
    return {title:'Продли линии и проверь лучи',controls:[select('mode','Что исследовать',['Исходный цветной рисунок','Продолжения и утверждения','Своя прямая через R']),...(s.mode===2?[select('point','Через какую вторую точку провести',['T','M','A','Q'])]:[select('pair','Какая пара объектов',['Луч AB и прямая OM','Прямая AB и луч OM','Прямые AB и OM','Лучи AB и OM','Лучи AB и PM','Лучи AB и PO'])])],visual:svg(d,s.mode,s.mode===2?s.point+1:0),question:s.mode===2?'Проходит ли новая прямая через одну и ту же точку встречи с обеими исходными? 1 — да, 0 — нет.':'Имеют ли общую точку '+pair+'? Введи 1 для да и 0 для нет.',answer:s.mode===2?Number(s.point===0):Number([d.abHasT,true,true,d.abHasT,d.abHasT,false][s.pair]),why:s.mode===2?'Проверь, проходит ли новая прямая через T.':'Ищи T и проверь направление каждого заданного луча.'};
  }
  const api={lesson,generate,parse,diagnosis,diagram:t=>svg(t.data.fig124),explore,bounds:{mode:[0,2,0],pair:[0,5,0],point:[0,3,0]}};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5PrintedCheck4=api;
})(typeof window!=='undefined'?window:globalThis);

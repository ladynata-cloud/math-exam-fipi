/* Виленкин, 5 класс. Часть 1, §6, печатная страница 35, №1.175 и №1.176. */
(function(root){
  'use strict';
  const names=['OP','KL','AB','EF','CD'];
  // Relative lengths from the supplied Figure 1.37. Display units carry no physical unit.
  const printed=[126,84,106,195,112];
  const lessons=[
    {number:'1.175',title:'Сравни пять отрезков циркулем-измерителем',requires:['v5f-printed-1-16'],explanation:'Поставь ножки измерителя на оба конца одного отрезка. Сохрани раскрытие и перенеси его на другой отрезок. Поворот отрезка его длину не меняет.',
      worked:['Сними раскрытие с AB и перенеси на CD. Если при совмещении первых концов вторая ножка не достаёт до конца CD, то CD длиннее AB.'],misconception:'Вертикальный отрезок всегда длиннее горизонтального.',reflect:'Как сравнить две почти равные длины, не измеряя их в сантиметрах?'},
    {number:'1.176',title:'Что короче: часть или целый отрезок?',requires:['v5f-printed-1-76'],explanation:'Сначала восстанови порядок точек. Каждый отрезок между крайними точками состоит из всех промежутков между ними. Если один промежуток входит в другой целиком и ещё остаётся часть, он короче.',
      worked:['Пусть точки идут как A, B, C. Тогда AC = AB + BC. Обе части имеют положительную длину, поэтому AB и BC короче AC.'],misconception:'Если один отрезок записан первым, он должен быть длиннее второго.',reflect:'Какие два соседних промежутка нельзя сравнить, зная только порядок точек?'}
  ].map(l=>({...l,key:'printed-'+l.number.replace('.','-'),part:1,page:35,point:6,related:['v5f-printed-1-171']}));
  const fold=s=>String(s).toUpperCase().replace(/[АВСКЕМНОРТ]/g,c=>({А:'A',В:'B',С:'C',К:'K',Е:'E',М:'M',Н:'N',О:'O',Р:'P',Т:'T'})[c]);
  const normalized=s=>[...s].sort().join('');
  function parse(value,target){
    let t=fold(String(value).replace(/отрез(?:ок|ки)\s*/gi,'')).replace(/[()]/g,'').trim();
    if(target.endpointNames)t=t.replace(/C/g,'S');
    if(!/^[A-Z]{2}(?:[\s,;>]+[A-Z]{2})*$/.test(t))return null;
    return t.split(/[\s,;>]+/).map(normalized);
  }
  const custom=q=>q?.answerFormat==='v5-segment-ranking';
  function accepts(value,q){const v=parse(value,q);return Boolean(v&&v.length===q.segments.length&&v.every((s,i)=>s===normalized(q.segments[i])));}
  function inputIssue(value,q){const v=parse(value,q);if(!v||v.length!==q.segments.length)return q.segments.length===1?'Запиши две буквы, обозначающие концы одного отрезка.':'Запиши пять названий отрезков, разделяя их запятыми или пробелами. Порядок букв внутри названия можно менять.';return '';}
  function mistake(value,q){
    if(q.endpointNames)return q.inclusionHint;
    const v=parse(value,q)||[],known=q.compared.map(normalized);
    if(v.some(x=>!known.includes(x)))return 'Сверь буквенные подписи на обоих концах отрезка.';
    if(new Set(v).size!==v.length)return 'Одно и то же название встретилось снова. Например, AB и BA обозначают один отрезок.';
    return q.segments.length===1?'Перенеси то же раскрытие измерителя на второй отрезок. Если вторая ножка не достаёт до конца, этот отрезок длиннее.':'Начни с самого длинного. Для соседних позиций сравни отрезки одним и тем же раскрытием измерителя.';
  }
  const makeStep=(step,prompt,answer,hint,compared,endpointNames=false)=>({...step(prompt,answer.join(', '),hint,[]),answerFormat:'v5-segment-ranking',segments:answer,compared,endpointNames,inclusionHint:hint,inputPrompt:answer.length===1?'Буквы концов отрезка':'Пять названий по убыванию'});
  function generate175(seed,r,step){
    const lengths=seed?Array.from({length:5},(_,i)=>54+30*i+r(1,18)):printed.slice();
    if(seed)for(let i=lengths.length-1;i>0;i--){const j=r(0,i);[lengths[i],lengths[j]]=[lengths[j],lengths[i]];}
    const ranked=names.slice().sort((a,b)=>lengths[names.indexOf(b)]-lengths[names.indexOf(a)]);
    const pairs=[['OP','EF'],['AB','CD'],['KL','AB']];
    const steps=pairs.map(([a,b])=>makeStep(step,'Сними раскрытие с одного отрезка и перенеси на другой. Какой длиннее: '+a+' или '+b+'?',[lengths[names.indexOf(a)]>lengths[names.indexOf(b)]?a:b],'При переносе расстояние между ножками остаётся прежним.',[a,b]));
    return {steps,prompt:'Сравни все пять отрезков измерителем. Запиши их названия от самого длинного к самому короткому.',answer:ranked.join(', '),inputPrompt:'Пять названий по убыванию',answerFormat:'v5-segment-ranking',segments:ranked,compared:names,why:'После выбора самого длинного повторяй сравнение среди оставшихся отрезков.',errors:[],data:{caliperRanking:{lengths}},conditionKey:'1.175/'+lengths.join(':'),
      table:{caption:'Изучаемые отрезки',headers:['Чертёж','Концы'],rows:names.map((name,i)=>[i+1,name[0]+' и '+name[1]]),columnWidths:[42,58]}};
  }
  function generate176(seed,r,step){
    const gaps=seed?[r(1,6),r(1,6),r(1,7)]:[2,3,4];
    const pairData=[['MN','KS','KS','KS — одна из частей MN. У MN есть ещё отрезки MS и KN.'],['MS','MK','MS','Точка S внутри MK, поэтому к MS нужно добавить SK, чтобы получить MK.'],['KS','KM','KS','Отрезок KM включает KS и дополнительную часть SM.']];
    if(seed)for(const pair of pairData)if(r(0,1))[pair[0],pair[1]]=[pair[1],pair[0]];
    const steps=pairData.map(([a,b,short,hint],i)=>makeStep(step,'абв'[i]+'. Какой из отрезков короче: '+a+' или '+b+'?',[short],hint,[a,b],true));
    return {steps,prompt:'Точка K лежит внутри MN, а S внутри MK. Можно ли по одному только порядку точек узнать, что короче: MS или SK?',inputPrompt:'Да или нет',answer:'нет',answerFormat:'v5-arithmetic-truth',trueStatement:false,
      evidence:'MS и SK — соседние части. Перемести точку S: короче может стать любая из них. Вопрос касается всех допустимых положений.',why:'Порядок M, S, K, N определяет включение отрезков, но не задаёт отношение длин двух соседних частей.',errors:[],data:{insideSegments:{gaps}},conditionKey:'1.176/'+[...gaps,...pairData.map(p=>p[0])].join(':'),
      table:{caption:'Положение точек',headers:['Точка','Внутри отрезка'],rows:[['K','MN'],['S','MK']],columnWidths:[39,61]}};
  }
  const colors=['#326777','#9b4c28','#6d5080','#973d62','#26715a'];
  function sketch(lengths){
    const angles=[-16,90,0,14,90];
    // A common scale for every orientation. Vertical segments have a dedicated column.
    const layouts=[[14,58],[195,12],[15,96],[13,133],[221,112]];
    const lines=names.map((name,i)=>{
      const [x,y]=layouts[i],length=lengths[i]*.68,angle=angles[i]*Math.PI/180,x1=x+length*Math.cos(angle),y1=y+length*Math.sin(angle);
      const anchor=angles[i]===90?'start':'middle',dx=angles[i]===90?4:0;
      const text=(px,py,character)=>'<text x="'+px+'" y="'+py+'" text-anchor="'+anchor+'" style="font:bold 12px sans-serif">'+character+'</text>';
      return '<line x1="'+x+'" y1="'+y+'" x2="'+x1+'" y2="'+y1+'" stroke="'+colors[i]+'" stroke-width="2.2"/><circle cx="'+x+'" cy="'+y+'" r="2.5"/><circle cx="'+x1+'" cy="'+y1+'" r="2.5"/>'+text(x+dx,y-4,name[0])+text(x1+dx,y1+(angles[i]===90?9:-5),name[1]);
    }).join('');
    return '<figure style="margin:.4em 0"><svg viewBox="0 0 250 265" style="width:100%;max-width:430px;display:block" role="img" aria-label="Пять отрезков в одном масштабе. Для последовательного сравнения доступен циркуль в модели.">'+lines+'</svg><figcaption>Все пять отрезков изображены в одном масштабе.</figcaption></figure>';
  }
  function caliper(lengths,source,target){
    const size=lengths[source],actual=lengths[target],x0=15,x1=x0+size,xt=x0+actual;
    return '<figure style="margin:.4em 0"><svg viewBox="0 0 224 92" style="width:100%;max-width:440px;display:block" role="img" aria-label="Раскрытие взято с '+names[source]+' и перенесено на '+names[target]+'."><path d="M'+x0+' 64L'+((x0+x1)/2)+' 14 '+x1+' 64" stroke="#7b4e31" fill="none" stroke-width="3"/><circle cx="'+((x0+x1)/2)+'" cy="14" r="4" fill="#80583b"/><path d="M'+x0+' 65H'+xt+'" stroke="'+colors[target]+'" stroke-width="4"/><circle cx="'+x0+'" cy="65" r="3"/><circle cx="'+xt+'" cy="65" r="3"/><text x="'+x0+'" y="82" text-anchor="middle">'+names[target][0]+'</text><text x="'+xt+'" y="82" text-anchor="middle">'+names[target][1]+'</text></svg><figcaption>Левую ножку совместили с первым концом. Сравни правую ножку с другим концом.</figcaption></figure>';
  }
  function chain(gaps){
    const points=[0,gaps[0],gaps[0]+gaps[1],gaps.reduce((a,b)=>a+b,0)],x=v=>14+204*v/points[3];
    const tags=points.map((v,i)=>'<circle cx="'+x(v)+'" cy="30" r="3.5" fill="#305953"/><text x="'+x(v)+'" y="50" text-anchor="middle" style="font:bold 14px sans-serif">'+'MSKN'[i]+'</text>').join('');
    return '<figure style="margin:.4em 0"><svg viewBox="0 0 232 62" style="width:100%;max-width:450px;display:block" role="img" aria-label="Точки в порядке M, S, K, N"><path d="M14 30H218" stroke="#34756b" stroke-width="3"/>'+tags+'</svg><figcaption>Порядок точек от M к N сохраняется при смещении внутренних точек.</figcaption></figure>';
  }
  function draw(t){return t.data.caliperRanking?sketch(t.data.caliperRanking.lengths):chain(t.data.insideSegments.gaps);}
  function explore(lesson,s,t){
    if(t.data.caliperRanking){
      const lengths=t.data.caliperRanking.lengths,opts=names.map((n,i)=>[i,n]),a=lengths[s.source],b=lengths[s.target];
      return {title:'Перенеси раскрытие измерителя',controls:[{key:'source',title:'Снять раскрытие с отрезка',values:opts},{key:'target',title:'Перенести на отрезок',values:opts}],visual:caliper(lengths,s.source,s.target),question:'Сравни длину '+names[s.source]+' с длиной '+names[s.target]+'. Введи знак <, > или =.',answer:a===b?'=':a<b?'<':'>',why:'Если правая ножка осталась до конца отрезка, первое раскрытие меньше. Если прошла дальше конца, оно больше.'};
    }
    const original=t.data.insideSegments.gaps,parts=original.slice();
    const options=i=>Array.from({length:8},(_,v)=>[v,String(1+(original[i]-1+v)%8)]);
    parts[0]=Number(options(0)[s.left][1]);parts[1]=Number(options(1)[s.right][1]);
    return {title:'Измени две соседние части',controls:[{key:'left',title:'Длина MS в делениях',values:options(0)},{key:'right',title:'Длина SK в делениях',values:options(1)}],visual:chain(parts),question:'Чему равна длина MK в выбранных делениях?',answer:parts[0]+parts[1],why:'Сложи соседние части MS и SK. Это вся длина MK.'};
  }
  const api={lessons,generators:{'1.175':generate175,'1.176':generate176},bounds:{'1.175':{source:[0,4,0],target:[0,4,1]},'1.176':{left:[0,7,0],right:[0,7,0]}},accepts,inputIssue,mistake,custom,draw,explore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5SegmentComparison=api;
})(typeof window!=='undefined'?window:globalThis);

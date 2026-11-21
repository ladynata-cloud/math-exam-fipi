/* Authored reconstructions and investigations for point 4, part 1, page 23 (2023). */
(function(root){
  'use strict';
  const lessons=[
    {number:'1.92',key:'printed-1-92',title:'Какие точки принадлежат прямой?',
      explanation:'Через две различные точки проходит одна прямая. Она продолжается в обе стороны. Сопоставляй с направлением прямой центр каждой отмеченной точки, даже если краска на схеме заканчивается раньше.',
      worked:['На прямой EF можно выбрать точку G за F. Тогда отрезок EF кончается в F, а прямая EF всё равно проходит через G.','Если точку H сдвинуть поперёк прямой, она перестанет ей принадлежать.'],
      misconception:'Прямая заканчивается там, где закончилась нарисованная цветная полоска.',reflect:'Как линейка помогает проверить точку за концом цветного штриха?'},
    {number:'1.93',key:'printed-1-93',title:'Встречаются ли прямые, лучи и отрезки?',
      explanation:'Чтобы проверить пересечение, мысленно доведи прямые до места встречи. Потом для каждой фигуры уточни, разрешено ли дойти до этой точки: у прямой можно двигаться в обе стороны, у луча — только от начала через вторую букву, у отрезка — только между концами.',
      worked:['Если две прямые пересекаются за началом луча, точка встречи прямых не принадлежит этому лучу.','Лучи EF и FE лежат на одной прямой, но меняют начало и направление. Проверяй обе фигуры, прежде чем ответить.'],
      misconception:'Если две несущие прямые встречаются, любые два взятых на них луча тоже встречаются.',reflect:'Как поменять ответ, оставив точки на местах и изменив только порядок букв луча?'},
    {number:'1.94',key:'printed-1-94',title:'Считаем углы по парам лучей',
      explanation:'Два разных луча с общим началом образуют угол. В названии из трёх букв общую вершину ставят посередине. Если два луча противоположны, они тоже образуют угол, его называют развёрнутым.',
      worked:['Из точки J выходят лучи JF, JG и JH. Пары F–G, F–H и G–H дают три угла.','Угол FJG можно также назвать GJF: у него те же две стороны.'],
      misconception:'На прямой два противоположных луча никогда не образуют угла.',reflect:'Как перечислять пары лучей, чтобы не считать угол дважды?'}
  ].map(l=>({...l,part:1,point:4,page:23,requires:['v5f-segment-length'],related:['v5f-broken-length']}));
  const colors=['#23677c','#985021','#54428b'];
  const err=(value,text)=>({value,text}), cross=(a,b)=>a[0]*b[1]-a[1]*b[0], delta=(a,b)=>[a[0]-b[0],a[1]-b[1]];
  const select=(key,title,labels)=>({key,title,values:labels.map((v,i)=>[i,v])});
  function label(name,point,selected=false){
    const [x,y]=screen(point),above=['M','Z','L','C'].includes(name);
    return '<circle cx="'+x+'" cy="'+y+'" r="'+(selected?4.5:3.3)+'" fill="'+(selected?'#ad450e':'#233d4b')+'"/><text x="'+(x+4)+'" y="'+(y+(above?-7:14))+'" style="font-size:14px" font-weight="600" fill="#183746">'+name+'</text>';
  }
  function screen(p){return [20+15*p[0],117-13*p[1]];}
  function svg(body,desc){return '<svg role="img" aria-label="'+desc+'" viewBox="0 0 258 153">'+body+'</svg>';}
  function stroke(a,b,col,dashed=false){
    const [x,y]=screen(a),[u,v]=screen(b);return '<line x1="'+x+'" y1="'+y+'" x2="'+u+'" y2="'+v+'" stroke="'+col+'" stroke-width="2.7"'+(dashed?' stroke-dasharray="4 4"':'')+'/>';
  }
  function pointPicture(d,extended,selected){
    const at=x=>[x,d.y0+d.slope*x/10];
    return svg((extended?stroke(at(-.8),at(14.8),'#487b88',true):'')+stroke(at(.4),at(10.4),colors[0])+Object.entries(d.points).map(([name,p])=>label(name,p,name===selected)).join(''),'Точки около прямой '+d.names[0]+d.names[1]+(extended?', показано продолжение в обе стороны':''));
  }
  function onLine(d,p){
    const [a,b]=d.names.map(n=>d.points[n]);return Math.abs(cross(delta(b,a),delta(p,a)))<1e-8;
  }
  function membership(seed,r,step){
    const names=seed?Array.from('EFGHTR'):Array.from('AKBDLC');
    if(seed)for(let i=names.length-1;i>0;i--){const j=r(0,i);[names[i],names[j]]=[names[j],names[i]];}
    const slope=seed?(r(0,1)?1:-1)*r(1,3):2,y0=seed?(slope<0?4.5:1.6)+r(0,6)/10:2;
    const coords=[1,5,9,13,3,7].map(x=>[x,y0+slope*x/10]);coords[4][1]+=seed&&r(0,1)?-1.1:2;coords[5][1]+=seed&&r(0,1)?-1.2:1.4;
    if(seed){const change=r(0,2);if(change===1)coords[4][1]=y0+slope*coords[4][0]/10;if(change===2)coords[3][1]+=1.2;}
    const d={names,y0,slope,points:Object.fromEntries(names.map((name,i)=>[name,coords[i]]))},line=names[0]+names[1],inside=names.filter(n=>onLine(d,d.points[n])).join(''),outside=names.filter(n=>!onLine(d,d.points[n])).join('');
    const missed=inside.replace(names[3],'');const omitted=inside!==missed?[{set:missed,text:'Мысленно продолжи прямую за край цветного штриха и проверь ещё одну точку.'}]:[];
    const steps=[{...step('Перечисли все подписанные точки, лежащие на прямой '+line+'. Порядок букв свободный.',inside,'Совмести ребро линейки с двумя первыми точками и мысленно продолжи её.'),answerFormat:'v5-line-points',nearSets:omitted},
      {...step('Какие точки расположены вне этой прямой?',outside,'Ищи точки, до которых надо свернуть в сторону.'),answerFormat:'v5-line-points'}];
    return {prefix:seed?'Новая авторская расстановка. ':'Авторская схема по рисунку 1.19. ',prompt:'Проверь обе группы. Сколько из отмеченных точек лежит на прямой '+line+'?',inputPrompt:'Число точек на прямой',answer:inside.length,steps,errors:omitted.length?[err(inside.length-1,'Краска кончилась, прямая продолжается. Проверь точку дальше по тому же направлению.')]:[],data:{linePoints:d},
      table:{caption:'Что найти на схеме',headers:['Группа','Как проверить'],rows:[['На прямой','Центр точки лежит на продолжении'],['Вне прямой','Центр точки в стороне']]},conditionKey:[...names,y0,slope,...coords.flat()].join('/')};
  }
  const kinds=['отрезок','луч','прямая'];
  const pair=(name,kind)=>({name,kind});
  const pairs=[[pair('PN',2),pair('XZ',2)],[pair('PN',1),pair('XZ',2)],[pair('MK',0),pair('XZ',0)],[pair('MK',2),pair('XZ',2)],[pair('PN',1),pair('MK',1)],[pair('PN',1),pair('KM',1)]];
  const permitted=(t,k)=>k===2||t>=-1e-8&&(k===1||t<=1+1e-8);
  function meet(pts,f,g){
    const a=pts[f.name[0]],b=pts[g.name[0]],u=delta(pts[f.name[1]],a),v=delta(pts[g.name[1]],b),diff=delta(b,a),den=cross(u,v);
    const t=cross(diff,v)/den,s=cross(diff,u)/den;
    return {hit:permitted(t,f.kind)&&permitted(s,g.kind),t,s};
  }
  function bounds(d,fig){
    const a=d[fig.name[0]],v=delta(d[fig.name[1]],a);let lo=fig.kind===2?-Infinity:0,hi=fig.kind===0?1:Infinity;
    for(let i=0;i<2;i++)if(v[i]){
      const limits=(i?[-1.8,8.4]:[-.85,14.8]).map(n=>(n-a[i])/v[i]);lo=Math.max(lo,Math.min(...limits));hi=Math.min(hi,Math.max(...limits));
    }
    return [lo,hi].map(t=>[a[0]+v[0]*t,a[1]+v[1]*t]);
  }
  function head(at,toward,col){
    const [x,y]=screen(at),[a,b]=screen(toward),n=Math.hypot(a-x,b-y),u=(a-x)/n,v=(b-y)/n;
    return '<path fill="'+col+'" d="M'+x+' '+y+'l'+(7*u-3.3*v)+' '+(7*v+3.3*u)+'l'+(6.6*v)+' '+(-6.6*u)+'z"/>';
  }
  function encountersPicture(pts,figs,neutral=false){
    let body='';figs.forEach((fig,i)=>{
      const [a,b]=neutral?[pts[fig.name[0]],pts[fig.name[1]]]:bounds(pts,fig),col=colors[i];
      body+=stroke(a,b,col);if(!neutral&&fig.kind>0)body+=head(b,a,col);if(!neutral&&fig.kind===2)body+=head(a,b,col);
    });
    const names=neutral?Object.keys(pts):[...new Set([...figs[0].name,...figs[1].name])];body+=names.map(n=>label(n,pts[n])).join('');
    return svg(body,neutral?'Три исходных штриха с подписанными точками.':'Две выбранные фигуры. Стрелка показывает направление продолжения.');
  }
  const name=f=>kinds[f.kind]+' '+f.name;
  function reason(figures,result){
    if(result.hit)return 'Продли фигуры по разрешённым направлениям. Место встречи принадлежит каждой.';
    const i=permitted(result.t,figures[0].kind)?1:0,blocked=figures[i];
    return blocked.kind===0?'Проверь концы отрезка '+blocked.name+'. Пересечение прямых осталось за его концом.':'Поставь палец в '+blocked.name[0]+' и веди через '+blocked.name[1]+'. Встреча прямых позади начала этого луча.';
  }
  function encounters(seed,r,step){
    const pts={M:[0,0],K:[6,0],X:[3,2],Z:[5,6],P:[5.5,3],N:[8.5,1]};
    if(seed){if(r(0,1))[pts.P,pts.N]=[pts.N,pts.P];if(r(0,1))[pts.M,pts.K]=[pts.K,pts.M];const shift=r(0,4),elevation=r(0,2);for(const p of Object.values(pts)){p[0]+=.3*shift;p[1]+=.25*elevation;}}
    const rows=pairs.map((fs,i)=>{const result=meet(pts,...fs),answer=result.hit?'да':'нет',msg=reason(fs,result);return {...step('абвгде'[i]+'. '+name(fs[0])+' и '+name(fs[1])+': есть ли у них общая точка? Введи да или нет.',answer,msg,[err(result.hit?'нет':'да',msg)]),answerFormat:'v5-check-word'};});
    const k=rows.filter(s=>s.answer==='да').length;
    return {prefix:seed?'Новая авторская расстановка. ':'Авторская схема по рисунку 1.20. ',prompt:'После шести пар сосчитай, в скольких из них у двух фигур есть общая точка.',inputPrompt:'Число пар с пересечением',answer:k,steps:rows,
      errors:[err(6,'Все три несущие прямые при продолжении встречаются попарно. У лучей и отрезков проверяй ещё и направление или концы.')],data:{encounters:pts},
      table:{caption:'Шесть пар фигур',headers:['Пара','Первая фигура','Вторая фигура'],rows:pairs.map((fs,i)=>['абвгде'[i],...fs.map(name)])},conditionKey:Object.values(pts).flat().join('/')};
  }
  function angleNames(input){
    const aliases={'А':'A','В':'B','С':'C','Д':'D','К':'K','М':'M','Н':'H','О':'O','Р':'P','Т':'T','Х':'X'},raw=String(input).toUpperCase().replace(/[АВСДКМНОРТХ]/g,x=>aliases[x]).replace(/∠\s*/g,'').trim(),names=raw.split(/[\s,;]+/);
    if(!names.length||names.some(n=>!/^([A-Z])([A-Z])([A-Z])$/.test(n)||new Set(n).size!==3))return null;
    return [...new Set(names.map(n=>[n[0],n[2]].sort().join(n[1])))].sort().join(' ');
  }
  function anglePairs(d){
    const result=[];d.rays.forEach((a,i)=>d.rays.slice(i+1).forEach(b=>result.push(a[0]+d.vertex+b[0])));return result;
  }
  function angleSets(seed,r,step){
    const rotate=seed?r(-15,15):0,letters=seed?Array.from('GHKTUV'):Array.from('CDMOQL');
    if(seed)for(let i=letters.length-1;i>0;i--){const j=r(0,i);[letters[i],letters[j]]=[letters[j],letters[i]];}
    const drawings=[
      {vertex:seed?letters[3]:'O',rays:[[letters[0],-90+rotate],[letters[1],-49+rotate],[letters[2],90+rotate]]},
      {vertex:seed?letters[0]:'M',rays:(seed?[letters[1],letters[2],letters[3],letters[4]]:['A','Q','B','P']).map((n,i)=>[n,[-151,-24,29,156][i]+rotate])},
      {vertex:seed?letters[1]:'O',rays:(seed?[letters[4],letters[5]]:['L','N']).map((n,i)=>[n,[-169,11][i]+rotate])}
    ];if(seed&&r(0,1))drawings[0].rays.push([letters[4],24+rotate]);
    const first=anglePairs(drawings[0]),straight=[drawings[0].rays[0][0],drawings[0].vertex,drawings[0].rays[2][0]].join(''),count=first.length;
    const prompt='а. Перечисли названия всех разных углов на первой схеме. Пиши по три буквы, разделяй углы точкой с запятой.';
    const without=first.filter(n=>n!==straight);
    const sets={...step(prompt,first.join(' '),'Выбери две разные стороны. Буква вершины стоит между буквами сторон. Обратное чтение тех же трёх букв даёт тот же угол.',[err(without.join(' '),'Проверь пару противоположных лучей. Они тоже образуют угол.'),err(without.join('; '),'Рассмотри также пару лучей на одной прямой.')]),answerFormat:'v5-angle-set',vertex:drawings[0].vertex,straight};
    const steps=[sets,step('а. Сколько разных углов получилось на первой схеме?',count,'Составь пары различных лучей. Порядок двух сторон не меняет угол.',[err(count-1,'Проверь пару лучей, смотрящих в противоположные стороны.')]),
      step('б. Две пересекающиеся прямые на второй схеме дают четыре луча. Сколько разных углов имеют вершину в их общей точке?',6,'Возьми по два разных луча из четырёх. Учти пары, которые образуют целую прямую.',[err(4,'Между соседними лучами видно четыре угла. Сравни также две пары противоположных лучей.')])];
    return {prefix:seed?'Новые авторские схемы. ':'Авторские схемы для рисунков 1.21, 1.15 и 1.16. ',prompt:'б. На третьей схеме два противоположных луча выходят из одной точки. Сколько углов образует эта пара?',inputPrompt:'Число углов',answer:1,steps,
      errors:[err(0,'Разные лучи могут быть сторонами одного угла, даже если лежат на одной прямой.'),err(2,'Если поменять две стороны местами, получится второе название того же угла.')],data:{angleSets:drawings},
      table:{caption:'Три схемы для подсчёта',headers:['Схема','Что проверить'],rows:[['1 · рис. 1.21','Названия и число углов'],['2 · рис. 1.15','Две пересекающиеся прямые'],['3 · рис. 1.16','Противоположные лучи']]},conditionKey:JSON.stringify(drawings)};
  }
  function anglePicture(d,chosen,description){
    const [x,y]=[125,72],r=48,polar=(a,len)=>{const q=a*Math.PI/180;return [x+len*Math.cos(q),y+len*Math.sin(q)];};
    let body='';d.rays.forEach(([n,a])=>{const [u,v]=polar(a,r),[lx,ly]=polar(a,r+13),[b,c]=polar(a,r-7),angle=a*Math.PI/180,dy=3*Math.cos(angle),dx=-3*Math.sin(angle),sel=chosen&&chosen.includes(n),col=sel?'#a64719':'#315f72';
      body+='<line x1="'+x+'" y1="'+y+'" x2="'+u+'" y2="'+v+'" stroke="'+col+'" stroke-width="'+(sel?3.4:2.2)+'"/><path d="M'+u+' '+v+'L'+(b+dx)+' '+(c+dy)+' '+(b-dx)+' '+(c-dy)+'Z" fill="'+col+'"/><text x="'+lx+'" y="'+(ly+4)+'" text-anchor="middle" style="font-size:14px">'+n+'</text>';
    });
    return svg(body+'<circle cx="125" cy="72" r="2.6" fill="#17364a"/><text x="110" y="79" style="font-size:13px">'+d.vertex+'</text>',description);
  }
  function angleModel(s,t){
    const d=t.data.angleSets[s.picture],names=anglePairs(d),which=s.pair%names.length,chosen=names[which],number=s.ask?names.length:d.rays.length;
    return {title:'Выдели пару сторон угла',controls:[select('picture','Схема',['Лучи на первой схеме','Пересечение прямых','Противоположные лучи']),{key:'pair',title:'Какая пара выделена',values:names.map((n,i)=>[i===which?s.pair:i,'∠'+n])},select('ask','Что посчитать',['Лучей из вершины','Разных пар лучей'])],
      visual:anglePicture(d,chosen[0]+chosen[2],'Выбраны лучи '+d.vertex+chosen[0]+' и '+d.vertex+chosen[2])+ '<p>Выделены стороны угла ∠'+chosen+'.</p>',
      question:s.ask?'Сколько разных углов образуют отмеченные лучи на всей схеме?':'Сколько разных лучей начинается в отмеченной вершине?',answer:number,why:'У каждой пары есть две стороны и одна общая вершина. Если читать название угла наоборот, стороны остаются прежними.'};
  }

  function diagram(t){const d=t.data;if(d.angleSets)return d.angleSets.map((v,i)=>'<figure><figcaption>Схема '+(i+1)+'</figcaption>'+anglePicture(v,null,'Схема '+(i+1)+', лучи из вершины '+v.vertex)+'</figure>').join('');return d.linePoints?pointPicture(d.linePoints,false):encountersPicture(d.encounters,[pair('MK',0),pair('XZ',0),pair('PN',0)],true);}
  function explore(l,s,t){
    if(t.data.angleSets)return angleModel(s,t);
    if(t.data.linePoints){
      const d=t.data.linePoints,n=d.names[s.which],hit=onLine(d,d.points[n]);
      return {title:'Продолжи прямую и проверь точку',controls:[select('which','Проверяемая точка',d.names),select('extend','Продолжение штриха',['Спрятать','Показать'])],visual:pointPicture(d,Boolean(s.extend),n),
        question:'Введи 1, если точка '+n+' принадлежит прямой '+d.names[0]+d.names[1]+', или 0, если она вне её.',answer:Number(hit),why:hit?'Центр точки лежит на том же прямом направлении.':'Продолжение проходит в стороне от центра выбранной точки.'};
    }
    const fs=pairs[s.item].map(f=>({...f}));if(s.reverse)fs[1].name=Array.from(fs[1].name).reverse().join('');if(s.mode)fs[1].kind=s.mode-1;
    const result=meet(t.data.encounters,...fs);
    return {title:'Проверь выбранные фигуры',controls:[select('item','Подпункт',Array.from('абвгде')),select('reverse','Начало и направление второй фигуры',['Как в подпункте','Поменять буквы местами']),select('mode','Вторая фигура',['Как в подпункте',...kinds])],
      visual:encountersPicture(t.data.encounters,fs),question:'Сколько общих точек имеют '+name(fs[0])+' и '+name(fs[1])+' — 0 или 1?',answer:Number(result.hit),why:reason(fs,result)};
  }
  const api={lessons,explore,diagram,meet,onLine,angleNames,generators:{'1.92':membership,'1.93':encounters,'1.94':angleSets},bounds:{'1.92':{which:[0,5,0],extend:[0,1,0]},'1.93':{item:[0,5,0],reverse:[0,1,0],mode:[0,3,0]},'1.94':{picture:[0,2,0],pair:[0,5,0],ask:[0,1,0]}}};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5PrintedLines=api;
})(typeof window!=='undefined'?window:globalThis);

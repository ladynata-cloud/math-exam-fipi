/* Infinite lines, named subrays and free placement on the first volume's page 25. */
(function(root){
  'use strict';
  const lessons=[
    {number:'1.117',title:'Продлеваем прямые рисунка 1.22',explanation:'Две отметки задают прямую. Положи линейку вдоль них и продли след в обе стороны. Для каждой пары найди место, принадлежащее сразу обеим прямым. В модели можно оставить одну пару и включить её продолжения.',worked:['Если одна прямая идёт через две левые точки, а другая почти вертикальна, их встреча может оказаться за рамкой тетрадного рисунка. Продолжай обе без поворота линейки.'],misconception:'Если между двумя парами отмеченных точек нет общей точки, соответствующие прямые не пересекаются.',reflect:'Какие прямые пришлось продолжить дальше края напечатанной сетки?'},
    {number:'1.118',title:'Свой луч с тремя точками и прямая MN',explanation:'У луча есть начало и направление. Проверь, что вторая буква каждого имени лежит дальше первой по стрелке. Две записи с одинаковым началом могут назвать один луч. В другой части построй прямую, размести четыре точки на ней и ещё три по своему выбору вне неё.',worked:['В порядке U, V, W, Z по стрелке лучи UV и UW совпадают. Для записи с началом W подойдёт WZ. Из Z в этом направлении второй подписанной точки уже нет.','Если прямая проходит через средний ряд сетки, метка на верхнем или нижнем ряду находится вне прямой при любом номере столбца.'],misconception:'Каждая новая запись луча двумя буквами обязательно обозначает другую фигуру.',reflect:'Что в твоём рисунке можно переставить, сохранив все условия?'}
  ].map(l=>({...l,key:'printed-'+l.number.replace('.','-'),part:1,point:4,page:25,requires:['v5f-printed-1-93'],related:['v5f-printed-1-100']}));
  const labels=['ED','AN','LK'],pairs=[[0,1],[2,1],[0,2]],colours=['#7455a3','#136759','#9d441f'];
  const opt=(key,title,labels)=>({key,title,values:labels.map((name,i)=>[i,name])}),err=(value,text)=>({value,text});
  const permute=items=>items.length?items.flatMap((v,i)=>permute(items.filter((_,j)=>i!==j)).map(t=>v+t)):[''];
  const orders=permute(Array.from('BCDP')).map(v=>'S'+v);
  function intersection(p,q,a,b){
    const x=q[0]-p[0],y=q[1]-p[1],u=b[0]-a[0],v=b[1]-a[1];
    const t=((a[0]-p[0])*v-(a[1]-p[1])*u)/(x*v-y*u);
    return [p[0]+t*x,p[1]+t*y];
  }
  function crossings(seed,r,step){
    const span=seed?r(2,4):3,rise=seed?r(3,5):4,level=seed?r(3,5):4,run=seed?r(2,4):2;
    const points={L:[0,0],K:[span,-1],A:[span,0],N:[span+1,rise],E:[0,level],D:[run,level+1]};
    const tags=seed?Array.from(permute(['1','2','3'])[r(0,5)],Number):[2,3,1];
    const markers=pairs.map(([i,j],k)=>({at:intersection(...Array.from(labels[i]+labels[j],n=>points[n])),tag:tags[k]}));
    const steps=pairs.map(([i,j],k)=>step('Приложи линейку к '+labels[i]+' и '+labels[j]+'. Продли обе прямые. Какой номер у метки в месте их встречи на авторской сетке?',tags[k],'Проверь одной линейкой первое направление и затем второе: метка должна лежать на обеих прямых.',markers.filter(m=>m.tag!==tags[k]).map(m=>err(m.tag,'Эта метка относится к другой паре. В модели выбери '+labels[i]+' и '+labels[j]+' и проследи оба следа до одной точки.'))));
    return {prefix:seed?'Новая клетчатая схема. ':'По печатному рис. 1.22. ',prompt:'Сколько разных точек встречи дали все три пары на твоём построении?',inputPrompt:'Число разных точек',answer:3,steps,errors:[err(0,'Концы голубых отрезков ограничивают только видимую часть рисунка. Продли каждую прямую в обе стороны.')],data:{cross:{points,tags,markers}},table:{caption:'Три пары прямых для продолжения',headers:['№','Пара'],rows:pairs.map(([i,j],k)=>[k+1,labels[i]+' и '+labels[j]])},conditionKey:[span,rise,level,run,...tags].join('/')};
  }
  const letter=s=>String(s).trim().toUpperCase().replace(/[АВСДКМНОРТХ]/g,c=>({'А':'A','В':'B','С':'C','Д':'D','К':'K','М':'M','Н':'H','О':'O','Р':'P','Т':'T','Х':'X'})[c]);
  function rayReply(value){
    const raw=String(value).split('/');if(raw.length!==2)return null;
    const order=letter(raw[0]).replace(/[\s,;→-]+/g,''),names=letter(raw[1]).trim().split(/[\s,;]+/);
    return /^S[BCDP]{4}$/.test(order)&&new Set(order).size===5&&names.every(v=>/^[SBCDP]{2}$/.test(v)&&v[0]!==v[1])?{order,names}:null;
  }
  function placement(value){
    const cells=String(value).trim().toUpperCase().split(/[\s;,]+/),points={};
    for(const token of cells){const m=token.match(/^([ABCDLPQАВСДР])([1-9])([ВЛН])$/u);if(!m||points[letter(m[1])])return null;points[letter(m[1])]=[+m[2],m[3]];}
    return cells.length===7&&[...'ABCDLPQ'].every(k=>points[k])?points:null;
  }
  function feedback(input,format){
    if(format==='v5-subrays'){
      const parsed=rayReply(input);if(!parsed)return 'Начни с S и запиши все пять разных букв по порядку, затем / и имена лучей по две буквы.';
      const {order,names}=parsed;
      if(names.some(v=>order.indexOf(v[0])>=order.indexOf(v[1])))return 'Вторую букву нужно встретить, двигаясь от первой по стрелке SP. Один из записанных лучей идёт назад.';
      if(new Set(names).size!==names.length)return 'Одна и та же пара букв записана дважды. Её можно оставить один раз.';
      if(new Set(names.map(v=>v[0])).size!==4)return 'Сверь начала лучей. Для каждой метки, после которой по стрелке есть ещё буква, нужно хотя бы одно имя.';
      return '';
    }
    const p=placement(input);if(!p)return 'Запиши все семь меток. После буквы ставь номер столбца от 1 до 9 и ряд В, Л или Н, например A3Л. Раздели метки пробелами.';
    const off='LPQ';for(const [n,[,row]] of Object.entries(p)){
      if(off.includes(n)&&row==='Л')return 'Точка '+n+' должна быть вне MN. Перенеси её в верхний или нижний ряд.';
      if(!off.includes(n)&&row!=='Л')return 'Точка '+n+' должна лежать на прямой MN. Для неё нужен средний ряд Л.';
    }
    if(new Set(Object.values(p).map(x=>x.join(''))).size!==7)return 'Две разные буквы попали в одну клетку. Отметь семь отдельных точек.';
    return '';
  }
  function namedRays(seed,r,step){
    const layout=seed?r(0,23):0,order=orders[layout],starts=Array.from(order.slice(0,-1)),example=starts.map((c,i)=>c+order[i+1]).join(' ');
    const steps=[{...step('а. Отметь B, C и D на луче SP в любом порядке с P. Назови все разные лучи по стрелке, которые можно записать двумя из пяти отмеченных букв. Введи свой порядок меток, затем / и по одному названию для каждого начала. Дополнительные верные имена тоже подойдут.',order+' / '+example,'Начало луча — первая буква; у второй буквы место дальше по выбранной стрелке. Два имени с тем же началом и направлением совпадают.'),answerFormat:'v5-subrays'},
      {...step('б. Проведи MN по среднему ряду. Отметь A, B, C и D на прямой, L, P и Q вне неё. Введи свои семь мест, например A3Л: A, столбец 3, ряд Л. В — верхний ряд, Л — прямая, Н — нижний. Столбцы 1–9.', 'A2Л B3Л C5Л D8Л L1В P4Н Q9В','Сначала проверь ряд каждой точки, затем убедись, что семь меток различны.'),answerFormat:'v5-free-line-plot'}];
    return {prefix:'Размещение точек выбираешь ты. ',prompt:'Сколько разных лучей по стрелке можно назвать двумя из пяти подписей при любом выбранном порядке, считая совпавшие имена один раз?',inputPrompt:'Число геометрически разных лучей, названных двумя буквами',answer:4,steps,errors:[err(10,'Десять — число разных двухбуквенных записей. Несколько записей с одинаковым началом обозначают один луч.'),err(5,'После последней метки луч продолжается. Двухбуквенного имени для луча вперёд с этой метки среди пяти подписей уже нет.')],data:{rayPlot:layout},table:{caption:'Два собственных построения',headers:['Часть','Что отмечается'],rows:[['а','S, P, B, C, D на луче'],['б','A, B, C, D на прямой; L, P, Q вне неё']]},conditionKey:'plot'+layout};
  }
  function meetDrawing(d,pair=-1,extend=false){
    const all=Object.values(d.points).concat(d.markers.map(m=>m.at)),xs=all.map(p=>p[0]),ys=all.map(p=>p[1]);
    const minX=Math.floor(Math.min(...xs))-1,maxX=Math.ceil(Math.max(...xs))+1,minY=Math.floor(Math.min(...ys))-1,maxY=Math.ceil(Math.max(...ys))+1,scale=Math.min(264/(maxX-minX),228/(maxY-minY));
    const x=v=>16+(v-minX)*scale,y=v=>16+(v-minY)*scale,w=32+(maxX-minX)*scale,h=32+(maxY-minY)*scale;
    const line=(a,b,c,width,dash='')=>'<line x1="'+x(a[0])+'" y1="'+y(a[1])+'" x2="'+x(b[0])+'" y2="'+y(b[1])+'" stroke="'+c+'" stroke-width="'+width+'" '+dash+'/>';
    let grid='';for(let i=minX;i<=maxX;i++)grid+=line([i,minY],[i,maxY],'#d6dddd',0.8);for(let i=minY;i<=maxY;i++)grid+=line([minX,i],[maxX,i],'#d6dddd',0.8);
    const keep=pair<0?[0,1,2]:pairs[pair];
    let body='';labels.forEach((name,i)=>{
      const [a,b]=Array.from(name,k=>d.points[k]),c=keep.includes(i)?colours[i]:'#c6caca';
      if(extend&&keep.includes(i)){const vx=b[0]-a[0],vy=b[1]-a[1],ts=[(minX-a[0])/vx,(maxX-a[0])/vx,(minY-a[1])/vy,(maxY-a[1])/vy].filter(t=>{const xx=a[0]+t*vx,yy=a[1]+t*vy;return xx>=minX-1e-8&&xx<=maxX+1e-8&&yy>=minY-1e-8&&yy<=maxY+1e-8;}).sort((p,q)=>p-q);body+=line([a[0]+ts[0]*vx,a[1]+ts[0]*vy],[a[0]+ts.at(-1)*vx,a[1]+ts.at(-1)*vy],c,1.6,'stroke-dasharray="4 3"');}
      body+=line(a,b,c,2.5);
    });
    for(const [n,p] of Object.entries(d.points)){const dy=n==='K'?-9:n==='A'?14:-5;body+='<circle cx="'+x(p[0])+'" cy="'+y(p[1])+'" r="2.6" fill="#283f3a"/><text x="'+(x(p[0])+4)+'" y="'+(y(p[1])+dy)+'" style="font: bold 11px sans-serif;paint-order:stroke;stroke:white;stroke-width:2px">'+n+'</text>';}
    for(const m of d.markers){const xx=x(m.at[0]),yy=y(m.at[1]),side=m.tag%2? -1:1,dx=m.at[1]<0?-18:side*12,dy=m.at[1]<0?9:9;body+='<path d="M'+xx+' '+yy+' l'+dx+' '+dy+'" stroke="#7b6350" stroke-width="1"/><circle cx="'+xx+'" cy="'+yy+'" r="3" fill="white" stroke="#523823"/><circle cx="'+(xx+dx)+'" cy="'+(yy+dy)+'" r="7" fill="#f9e3ba" stroke="#72553d"/><text x="'+(xx+dx)+'" y="'+(yy+dy+4)+'" text-anchor="middle" style="font:bold 10px sans-serif">'+m.tag+'</text>';}
    return '<svg role="img" viewBox="0 0 '+w+' '+h+'" aria-label="Клетчатая сетка, прямые ED, AN, LK и три пронумерованных кандидата точки встречи">'+grid+body+'</svg>';
  }
  function rayDrawing(order){
    const items=Array.from(order);return '<svg role="img" viewBox="0 0 278 62" aria-label="Луч по стрелке. Метки по порядку: '+items.join(', ')+'"><path d="M15 31H267M259 26l9 5-9 5" fill="none" stroke="#276d65" stroke-width="2.4"/>'+items.map((n,i)=>'<circle cx="'+(18+i*53)+'" cy="31" r="3" fill="#763e26"/><text x="'+(18+i*53)+'" y="20" text-anchor="middle" style="font:bold 13px sans-serif">'+n+'</text>').join('')+'</svg>';
  }
  function plotDrawing(points){
    const cx=n=>21+n*23,cy=r=>({В:29,Л:56,Н:82})[r],xs=Array.from({length:9},(_,i)=>i+1);
    return '<svg role="img" viewBox="0 0 269 101" aria-label="Три ряда: верхний, прямая MN, нижний. Девять столбцов.">'+xs.map(i=>'<path d="M'+cx(i)+' 21v68" stroke="#d6dddd"/><text x="'+cx(i)+'" y="16" text-anchor="middle" style="font:12px sans-serif">'+i+'</text>').join('')+['В','Л','Н'].map(row=>'<path d="M23 '+cy(row)+'H254" stroke="'+(row==='Л'?'#24695e':'#d6dddd')+'" stroke-width="'+(row==='Л'?2:1)+'"/><text x="8" y="'+(cy(row)+4)+'" style="font:12px sans-serif">'+row+'</text>').join('')+'<text x="21" y="53" style="font:bold 11px sans-serif">M</text><text x="249" y="53" style="font:bold 11px sans-serif">N</text>'+Object.entries(points).map(([n,[x,row]])=>'<circle cx="'+cx(x)+'" cy="'+cy(row)+'" r="3.1" fill="#723f2d"/><text x="'+(cx(x)+3)+'" y="'+(cy(row)-5)+'" style="font:bold 12px sans-serif;paint-order:stroke;stroke:white;stroke-width:2px">'+n+'</text>').join('')+'</svg>';
  }
  function diagram(t,scene={}){
    if(t.data.cross)return meetDrawing(t.data.cross);
    const userRay=rayReply(scene.answers?.[0]||''),userPlot=placement(scene.answers?.[1]||'');
    return rayDrawing(userRay?.order||orders[t.data.rayPlot])+plotDrawing(userPlot||{});
  }
  function explore(l,s,t){
    if(t.data.cross){const d=t.data.cross,[i,j]=pairs[s.pair];return {title:'Выбери пару и продли обе прямые',controls:[opt('pair','Прямые',pairs.map(([i,j])=>labels[i]+' и '+labels[j])),opt('extend','Что провести',['Следы между буквами','Продолжения в обе стороны'])],visual:meetDrawing(d,s.pair,Boolean(s.extend)),question:'У какой метки встречаются прямые '+labels[i]+' и '+labels[j]+'?',answer:d.tags[s.pair],why:'В месте встречи оба следа проходят точно через одну точку.'};}
    const layout=(s.order+t.data.rayPlot)%orders.length,order=orders[layout],name='ABCDLPQ'[s.point],row=['В','Л','Н'][s.row];
    return {title:'Проверь собственное построение',controls:[opt('part','Построение',['Луч','Прямая']),...(s.part?[opt('point','Какую метку переносишь',Array.from('ABCDLPQ')),{key:'x',title:'Столбец',min:1,max:9,step:1},opt('row','Ряд',['Верхний','Линия MN','Нижний'])]:[opt('order','Порядок по стрелке',orders.map((_,i)=>orders[(i+t.data.rayPlot)%orders.length].split('').join(' → '))),opt('start','Начало исследуемого луча',Array.from('SBCDP'))])],visual:s.part?plotDrawing({[name]:[s.x,row]}):rayDrawing(order),question:s.part?'Соблюдено ли требование для этой метки? Введи 1, если да, или 0, если метку надо передвинуть.':'Сколько разных двухбуквенных имён луча в направлении SP можно составить с выбранным началом?',answer:s.part?Number('ABCD'.includes(name)===(row==='Л')):4-order.indexOf('SBCDP'[s.start]),why:s.part?'A, B, C и D должны лежать на MN. Для L, P и Q выбери любой из двух других рядов.':'Посчитай все вторые буквы, которые стоят после выбранной первой.'};
  }
  const api={lessons,generators:{'1.117':crossings,'1.118':namedRays},bounds:{'1.117':{pair:[0,2,0],extend:[0,1,0]},'1.118':{part:[0,1,0],order:[0,23,0],start:[0,4,0],point:[0,6,0],x:[1,9,3],row:[0,2,1]}},orders,intersection,rayReply,placement,feedback,diagram,explore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5Constructions25=api;
})(typeof window!=='undefined'?window:globalThis);

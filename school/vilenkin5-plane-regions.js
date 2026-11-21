/* Small line arrangements reconstructed from the two printed constructions. */
(function(root){
  'use strict';
  const lessons=[
    {number:'1.98',key:'printed-1-98',title:'Три прямые через одну точку',
      explanation:'Сначала проведи одну прямую. Для каждой следующей смотри, на сколько частей её разрезают разные точки встречи со старыми прямыми. Каждый из этих участков разделяет одну прежнюю область надвое. Совпадающие точки пересечения нужно считать один раз.',
      worked:['Одна прямая оставляет две области. Вторая, пересекающая первую, разрезается на два луча и добавляет две области.','Если следующая прямая идёт через ту же точку, у неё опять ровно одна точка пересечения со всем прежним чертежом.'],
      misconception:'Последняя прямая, встречая две другие, обязательно получает две разные точки пересечения.',reflect:'Что произойдёт с числом областей, если отодвинуть третью прямую от общей точки?'},
    {number:'1.99',key:'printed-1-99',title:'Прямые, проведённые через пары трёх точек',
      explanation:'Отметь три точки вне одной прямой и соедини каждую пару целой прямой. Проводя последнюю прямую, различай точки, в которых она встречает предыдущие. Части между ними и снаружи продолжаются в разные области.',
      worked:['Если новая прямая имеет две разные точки встречи с предыдущими, на ней получаются два внешних луча и отрезок между точками. Три участка добавляют три области.'],
      misconception:'Если виден треугольник, продолжения его сторон больше не делят плоскость.',reflect:'Какая из образовавшихся областей ограничена со всех сторон?'}
  ].map(l=>({...l,part:1,point:4,page:24,requires:['v5f-printed-1-93'],related:['v5f-printed-1-94']}));
  const palette=['#dcebe2','#f3dbc2','#d9e6f0','#efe3f2','#f4eccb','#daeeee','#efd8d6','#e2e7cd','#e9dedd','#e1e5f4'];
  const col=['#355c71','#8b4c17','#6e436e','#326740'];
  const initial=[[-6,-4],[6,-4],[6,4],[-6,4]],cross=(a,b,p)=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
  function clipped(poly,a,b,sign){
    const result=[];for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],v=sign*cross(a,b,p),w=sign*cross(a,b,q);
      if(v>=-1e-9)result.push(p);
      if(v*w < -1e-12){const t=v/(v-w);result.push([p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])]);}
    }
    if(result.length<3)return null;
    const double=result.reduce((sum,p,i)=>{const q=result[(i+1)%result.length];return sum+p[0]*q[1]-p[1]*q[0];},0);
    return Math.abs(double)>1e-7?result:null;
  }
  function regions(serial){
    let pieces=[initial];for(const f of serial){const next=[];for(const p of pieces)for(const sign of [-1,1]){const q=clipped(p,f.a,f.b,sign);if(q)next.push(q);}pieces=next;}return pieces;
  }
  function line(a,b,name){return {a,b,name};}
  function data(d,stage,shift){
    if(d.type==='concurrent'){
      const o=[0,0],marks={O:o},all=[];
      const letters=['AB','CD','MN','EF'];d.slopes.forEach((v,i)=>{const h=i===2?shift*.7:0,k=2.15;const a=[-k,-k*v+h],b=[k,k*v+h];marks[letters[i][0]]=a;marks[letters[i][1]]=b;all.push(line(a,b,letters[i]));});
      return {figures:all.slice(0,stage),marks,point:'O',named:d.slopes.slice(0,stage).flatMap((v,i)=>Array.from(letters[i])).concat(stage>1?['O']:[])};
    }
    const [m,n,k]=[[-3,-1],[3,-1],[d.kx,shift===0?d.ky:shift===1?-1:d.ky/2-.5]],marks={M:m,N:n,K:k},all=[line(m,n,'MN'),line(m,k,'MK'),line(n,k,'NK')];
    return {figures:all.slice(0,stage),marks,named:['M','N','K']};
  }
  const screen=p=>[130+18*p[0],87-18*p[1]],draw=p=>screen(p).map(v=>v.toFixed(2)).join(',');
  function picture(d,stage,shift,tint=true){
    const {figures,marks,named}=data(d,stage,shift),pieces=regions(figures);
    let body=pieces.map((polygon,i)=>'<polygon points="'+polygon.map(draw).join(' ')+'" fill="'+(tint?palette[i%palette.length]:'#f9faf6')+'"/>').join('');
    for(const [i,f] of figures.entries()){
      const points=[];
      for(let j=0;j<4;j++){const p=initial[j],q=initial[(j+1)%4],v=cross(f.a,f.b,p),w=cross(f.a,f.b,q);if(Math.abs(v)<1e-8)points.push(p);if(v*w<0){const t=v/(v-w);points.push([p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])]);}}
      if(points.length>=2){const [x,y]=screen(points[0]),[u,v]=screen(points[1]);body+='<line x1="'+x+'" y1="'+y+'" x2="'+u+'" y2="'+v+'" stroke="'+col[i]+'" stroke-width="2.4"/>';}
    }
    for(const n of named){const [x,y]=screen(marks[n]);const offset=n==='O'?[4,13]:n==='K'?[4,-5]:[n==='M'?-12:4,-4];body+='<circle cx="'+x+'" cy="'+y+'" r="2.8" fill="#213c48"/><text x="'+(x+offset[0])+'" y="'+(y+offset[1])+'" style="font-size:12px">'+n+'</text>';}
    return '<svg role="img" viewBox="0 0 260 174" aria-label="Проведены прямые '+figures.map(f=>f.name).join(', ')+'. Рамка ограничивает показанную часть плоскости.">'+body+'</svg>';
  }
  const err=(value,text)=>({value,text}),select=(key,title,labels)=>({key,title,values:labels.map((v,i)=>[i,v])});
  function concurrent(seed,r,step){
    const count=seed?r(3,4):3,slopes=[0,r(-11,-7)/10,r(4,7)/10,r(13,16)/10].slice(0,count);if(!seed)slopes.splice(0,3,0,-.8,.55);
    const d={type:'concurrent',slopes},last=count*2;
    const steps=[step('Сколько областей получается после первой прямой?',2,'Путь с одной стороны прямой на другую пересекает её.'),
      step('Сколько частей плоскости видно после второй прямой, пересекающей первую?',4,'От общей точки на второй прямой идут два луча, и каждый делит свою прежнюю область.'),
      step('Все прямые проходят через O. Сколько разных точек встречи у следующей прямой со всем прежним чертежом?',1,'Посмотри, совпадают ли точки встречи с первыми двумя прямыми.',[err(2,'Две разные прямые встречаются в том же самом O. Число прямых и число различных точек здесь различаются.')])];
    return {prefix:seed?'Новое построение. ':'Проведи AB, CD и MN через общую точку O. ',prompt:'Сколько частей плоскости получилось после всех '+count+' различных прямых через одну точку?',inputPrompt:'Число областей',answer:last,steps,errors:[err(last+1,'Проверь, не посчитали ли одну точку O дважды, как будто третья прямая пересекала предыдущие в разных местах.')],
      data:{plane:d},table:{caption:'Построение по шагам',headers:['Прямая','Условие'],rows:['AB','CD','MN','EF'].slice(0,count).map(n=>[n,'Проходит через O'])},conditionKey:slopes.join('/')};
  }
  function triangle(seed,r,step){
    const d={type:'triangle',kx:seed?r(-5,5)/10:0,ky:seed?r(12,28)/10:2},steps=[step('Проведи MN и MK. На сколько частей эти две прямые разделили плоскость?',4,'Первые две прямые пересекаются в M.'),
      step('В скольких разных точках прямая NK встретит две первые прямые?',2,'Она встречает MN в N, а MK в K. По условию это разные отмеченные точки.',[err(1,'Это верно для трёх прямых через общую точку. Здесь на последней прямой отмечены разные N и K.')]),
      step('На сколько частей разделили прямую NK эти точки?',3,'Есть участок между точками и два продолжения за ними.',[err(1,'Между точками есть один отрезок. Проверь оба продолжения последней прямой.')])];
    return {prefix:'Точки M, N и K вне одной прямой. ',prompt:'Проведи целые прямые MN, MK и NK. Сколько областей они образуют на плоскости?',inputPrompt:'Число областей',answer:7,steps,errors:[err(6,'Ты получил число областей для трёх прямых через одну точку. Теперь на последней прямой две разные встречи.'),err(1,'Посчитана внутренняя область. Продолжи каждую сторону треугольника в обе стороны и проверь внешние области.')],
      data:{plane:d},table:{caption:'Три прямые по парам точек',headers:['Шаг','Проведи'],rows:[[1,'MN'],[2,'MK'],[3,'NK']]},conditionKey:[d.kx,d.ky].join('/')};
  }
  function diagram(t){const d=t.data.plane;return picture(d,d.type==='concurrent'?d.slopes.length:3,0,false);}
  function explore(l,s,t){
    const d=t.data.plane,count=d.type==='concurrent'?d.slopes.length:3,stage=Math.min(count,s.stage+1),shift=s.shift,serial=data(d,stage,shift).figures,sum=regions(serial).length,previous=regions(serial.slice(0,-1)).length;
    return {title:'Добавляй прямые по одной',controls:[{key:'stage',title:'Проведено прямых',values:[0,1,2,3].filter(i=>i<count||i===s.stage).map(i=>[i,String(Math.min(i+1,count))])},select('shift',d.type==='concurrent'?'Положение третьей прямой':'Положение K',d.type==='concurrent'?['Через O','Выше O','Ещё выше O']:['Вне MN','На MN','Ближе к MN']),select('tint','Границы и области',['Показать границы','Раскрасить области']),select('ask','Что посчитать',['Все области','Добавилось на последнем шаге'])],
      visual:picture(d,stage,shift,Boolean(s.tint)),question:s.ask?'Сколько новых областей добавила последняя проведённая прямая?':'На сколько частей построенные прямые делят плоскость?',answer:s.ask?sum-previous:sum,why:sum===previous?'Последняя прямая совпала с уже проведённой. Новых областей нет.':'Сравни области по обе стороны последней прямой до и после её проведения.'};
  }
  const api={lessons,generators:{'1.98':concurrent,'1.99':triangle},bounds:{'1.98':{stage:[0,3,0],shift:[0,2,0],tint:[0,1,0],ask:[0,1,0]},'1.99':{stage:[0,2,0],shift:[0,2,0],tint:[0,1,0],ask:[0,1,0]}},explore,diagram,regions,data};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5PlaneRegions=api;
})(typeof window!=='undefined'?window:globalThis);

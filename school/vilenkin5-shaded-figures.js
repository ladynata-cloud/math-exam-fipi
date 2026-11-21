/* Виленкин и соавт., часть 2, 2023, §26, с. 14, №5.46, рис. 5.17. Авторские векторные модели. */
(function(root){
  'use strict';
  const q=(typeof module!=='undefined'&&module.exports?require('./math.js'):root.WorkshopMath).q;
  const lesson={number:'5.46',key:'printed-5-46',part:2,point:26,page:14,title:'Закрашенная и свободная части тринадцати рисунков',requires:['v5f-printed-5-41','v5f-printed-5-42'],related:[],explanation:'Найди целое. На одном рисунке это круг, на другом квадрат, треугольник, прямоугольник или отрезок. Сначала убедись, что сравниваешь равные по площади или длине части. Для свободной части можно вычесть закрашенную долю из единицы.',
    worked:['Если из восьми секторов три отмечены, свободными останутся пять восьмых.','Треугольник с основанием во всю ширину полосы и вершиной на её другой стороне занимает половину полосы. Здесь справедливо сравнение площадей, даже если на рисунке разное число видимых областей.','На сетке удобно посчитать сначала целый цветной столбец, затем клетки неполного.'],
    misconception:'Любые нарисованные области можно просто пересчитать, даже если их площади разные.',reflect:'На каком рисунке считать маленькие области поштучно было бы ошибкой?'};
  const specs=[
    ['в','circle',3,[0]],['е','circle',8,[1,2,4,5,6]],['к','circle',5,[0,1,2,3,4]],
    ['б','row',2,[0]],['д','row',10,[4,5,6,7,8,9]],['л','fan',8,[0,2,4,6]],['м','peaks',4,[0,2]],['н','hundred',100,[5,15,25,35,45,55,65,75,85,95,20,30,40,50,60,70,80,90]],
    ['а','line',8,[3]],['г','mid',4,[3]],['ж','thirds',3,[0,2]],['з','six',6,[2,3]],['и','columns',7,[2,3]]
  ];
  const kinds={circle:'круг',row:'квадрат',fan:'квадрат',peaks:'квадрат',hundred:'квадрат',line:'отрезок SR',mid:'треугольник',thirds:'треугольник',six:'прямоугольник',columns:'прямоугольник'};
  function generate(seed,r,step){
    const rows=specs.map(([letter,kind,den,original],index)=>{
      if(!seed)return {letter,kind,den,marked:original.slice()};
      if(kind==='hundred'){
        const full=r(0,9),other=(full+1+r(0,8))%10,tail=r(2,9);
        const marked=Array.from({length:10},(_,i)=>10*i+full).concat(Array.from({length:tail},(_,i)=>10*(9-i)+other));return {letter,kind,den,marked};
      }
      if(kind==='peaks'){
        const n=r(1,3),start=r(0,3);return {letter,kind,den,marked:Array.from({length:n},(_,i)=>(start+i)%4)};
      }
      const count=kind==='line'?r(1,5):r(1,den),start=kind==='line'?r(0,den-count):r(0,den-1);
      return {letter,kind,den,marked:Array.from({length:count},(_,i)=>(start+i)%den)};
    });
    const steps=rows.map((row,i)=>{const m=row.marked.length,col=q(m,row.den),free=q(row.den-m,row.den),both=i>=8,filled=i<3;
      const ask=both?'Какая доля выделена и какая осталась без цвета? Сначала выделенная, затем свободная через точку с запятой.':filled?'Какая доля круга выделена цветом?':'Какая доля квадрата осталась без цвета?';
      const reason=row.kind==='peaks'?'Сравни площади в верхней и нижней полосах: у каждой половина площади внутри треугольника и половина снаружи.':row.kind==='hundred'?'Сначала посчитай цветные клетки двух столбцов. Вычти их из ста.':row.kind==='line'?'Считай промежутки между отметками, а не сами отметки.':'После деления на '+row.den+' равных по площади частей выделено '+m+'.';
      const errors=!both&&m*2!==row.den?[{value:filled?free:col,text:filled?'Ты назвал свободную долю. В этом пункте спрашивают про цвет.':'Ты назвал цветную долю. В этом пункте спрашивают про часть без цвета.'}]:both&&m*2!==row.den?[{value:[free,col],text:'Обе доли нашлись, но поменялись местами. Первой указывается выделенная.'}]:[];
      return {...step('Рисунок '+row.letter+' ('+kinds[row.kind]+'). '+ask,both?[col,free]:filled?col:free,reason,errors),...(both?{answerFormat:'v5-pair'}:{})};});
    const last=steps.pop();return {...last,steps,inputPrompt:'Выделенная доля; свободная доля',data:{shadedAtlas:rows},conditionKey:'shaded-figures/'+rows.map(row=>row.marked.join('.')).join('/')};
  }
  const ink='#3e555e',color='#188071',white='#fff';
  const poly=(pts,on)=>'<polygon points="'+pts+'" fill="'+(on?color:white)+'" stroke="'+ink+'" stroke-width="1.4"/>';
  const rect=(x,y,w,h,on,stroke=1.3)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+(on?color:white)+'" stroke="'+ink+'" stroke-width="'+stroke+'"/>';
  const line=(x,y,u,v,width=1.2,fill=ink)=>'<path d="M'+x+' '+y+'L'+u+' '+v+'" stroke="'+fill+'" stroke-width="'+width+'" fill="none"/>';
  function fig(row){
    const has=j=>row.marked.includes(j);let svg='',box='0 0 192 166';
    if(row.kind==='circle'){
      const cx=95,cy=83,rad=69,point=t=>[cx+rad*Math.cos(t),cy+rad*Math.sin(t)].join(' ');
      for(let i=0;i<row.den;i++){const start=row.letter==='в'?-5*Math.PI/6:-Math.PI/2,a=2*Math.PI*i/row.den+start,b=2*Math.PI*(i+1)/row.den+start;
        svg+='<path d="M'+cx+' '+cy+' L'+point(a)+' A'+rad+' '+rad+' 0 0 1 '+point(b)+' Z" fill="'+(has(i)?color:white)+'" stroke="'+ink+'" stroke-width="1.4"/>';}
    }else if(row.kind==='line'){
      box='0 0 270 77';const pos=i=>16+29*i;svg=line(pos(0),38,pos(8),38,2.3);
      for(let j=0;j<8;j++)if(has(j))svg+=line(pos(j),38,pos(j+1),38,7,color);
      for(let i=0;i<=8;i++)svg+=line(pos(i),31,pos(i),46);
      const first=Math.min(...row.marked),last=Math.max(...row.marked)+1,labels=new Map();
      for(const [j,s] of [[0,'S'],[8,'R'],[first,'L'],[last,'P']])labels.set(j,labels.has(j)?labels.get(j)+','+s:s);
      for(const [j,s] of labels)svg+='<text x="'+pos(j)+'" y="23" text-anchor="middle" font-size="13" font-weight="bold">'+s+'</text>';
    }else if(row.kind==='fan'){
      const border=[[24,14],[94,14],[164,14],[164,84],[164,154],[94,154],[24,154],[24,84]];
      for(let j=0;j<8;j++)svg+=poly('94,84 '+border[j].join(',')+' '+border[(j+1)%8].join(','),has(j));
    }else if(row.kind==='peaks'){
      for(let j=0;j<2;j++){const y=13+70*j;svg+=rect(25,y,140,70,has(2*j+1));svg+=poly('25,'+(y+70)+' 95,'+y+' 165,'+(y+70),has(2*j));}
    }else if(row.kind==='mid'){
      const p=['19,82 89,43 89,121','89,43 159,4 159,82','89,121 159,82 159,160','89,43 159,82 89,121'];p.forEach((coords,j)=>svg+=poly(coords,has(j)));
    }else if(row.kind==='thirds'){
      const p=['19,148 95,16 95,104','19,148 95,104 171,148','95,16 171,148 95,104'];p.forEach((coords,j)=>svg+=poly(coords,has(j)));
    }else{
      const cols=row.kind==='hundred'?10:row.kind==='six'?3:row.kind==='columns'?7:1,rows=row.den/cols,w=row.kind==='columns'||row.kind==='six'?168:140,h=row.kind==='columns'||row.kind==='six'?90:140,x=(192-w)/2,y=(166-h)/2;
      for(let j=0;j<row.den;j++)svg+=rect(x+j%cols*w/cols,y+Math.floor(j/cols)*h/rows,w/cols,h/rows,has(j),row.kind==='hundred'?.85:1.4);
    }
    return '<figure style="margin:.4em 0"><svg role="img" aria-label="Рисунок '+row.letter+', '+kinds[row.kind]+', окрашенные части тёмные, свободные светлые" viewBox="'+box+'" style="width:100%;max-width:19rem;display:block">'+svg+'</svg><figcaption>Рисунок '+row.letter+'. '+(row.kind==='line'?'Цветом отмечен отрезок LP.':row.kind==='peaks'?'В каждой горизонтальной полосе сравни площадь треугольника и оставшейся части.':row.kind==='hundred'?'Сетка состоит из десяти рядов по десять клеток.':'Тёмные части закрашены.')+'</figcaption></figure>';
  }
  function draw(t,s){const i=s?.mode==='learn'?s.step:t.steps.length;return fig(t.data.shadedAtlas[i]);}
  function explore(t,s){const row=t.data.shadedAtlas[s.row],n=row.marked.length;return {title:'Сравни обе доли на одном рисунке',controls:[{key:'row',title:'Рисунок',values:t.data.shadedAtlas.map((r,i)=>[i,r.letter+' · '+kinds[r.kind]])},{key:'focus',title:'Какую долю ищем',values:[[0,'Закрашенную'],[1,'Свободную']]}],visual:fig(row),question:'Какая доля фигуры '+(s.focus?'осталась свободной?':'закрашена?'),answer:q(s.focus?row.den-n:n,row.den),why:'В долях одинаковой площади или длины всего '+row.den+', из них выделено '+n+'. Части вместе составляют единицу.'};}
  const api={lesson,generate,draw,explore,bounds:{row:[0,12,0],focus:[0,1,0]}};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5ShadedFigures=api;
})(typeof window!=='undefined'?window:globalThis);

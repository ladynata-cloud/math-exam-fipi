/* Constrained experiments for lines, quadrilaterals and polygons. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory;
  else root.Task19LinePolygonModels=factory;
})(typeof window==='object'?window:globalThis,function(kit){
  'use strict';
  const {RAD,BLUE,GREEN,INK,LIGHT,clamp,hypot,mid,fmt,angleAt,line,text,dot,poly,fit,labelPoints,tick,angleMark,rightMark,linked}=kit;
  const area=P=>Math.abs(P.reduce((sum,p,i)=>{const q=P[(i+1)%P.length];return sum+p[0]*q[1]-p[1]*q[0];},0))/2;
  const turn=(p,c,a)=>{const x=p[0]-c[0],y=p[1]-c[1];return[c[0]+x*Math.cos(a)-y*Math.sin(a),c[1]+x*Math.sin(a)+y*Math.cos(a)];};
  const ring=(c,r,color=INK)=>`<circle cx="${c[0]}" cy="${c[1]}" r="${r}" fill="none" stroke="${color}" stroke-width="2"/>`;
  const sideLengths=P=>P.map((p,i)=>hypot(p,P[(i+1)%P.length]));
  const angles=P=>P.map((p,i)=>angleAt(P[(i+P.length-1)%P.length],p,P[(i+1)%P.length]));
  const dotted=(a,b,color)=>line(a,b,color,'6 5');
  const AMBER='#a76616',PURPLE='#7954a1',COLORS=[BLUE,GREEN,AMBER,PURPLE];
  const row=(text,color,group)=>({text,color,group});
  const offsetTick=(a,b,count,color)=>tick(a,[a[0]+.5*(b[0]-a[0]),a[1]+.5*(b[1]-a[1])],count,color);
  // Marks follow measured equality, including when a slider creates a special case.
  function equalityGroups(values){const unique=[];return values.map(value=>{let i=unique.findIndex(v=>Math.abs(v-value)<1e-7*Math.max(1,Math.abs(v),Math.abs(value)));if(i<0){i=unique.length;unique.push(value);}return{count:i+1,color:COLORS[i%COLORS.length]};});}
  function polygonMarks(points,names,options={}){
    const lengths=sideLengths(points),aa=angles(points),sg=options.sideGroups||equalityGroups(lengths),ag=options.angleGroups||equalityGroups(aa),prefix=options.prefix||'',center=points.reduce((c,p)=>[c[0]+p[0]/points.length,c[1]+p[1]/points.length],[0,0]);let body='';
    points.forEach((a,i)=>{const b=points[(i+1)%points.length],g=sg[i],key=prefix+'side-'+names[i]+names[(i+1)%names.length];let edge=line(a,b,g.color)+(options.offsetTicks?offsetTick:tick)(a,b,g.count,g.color);
      if(options.lengths){const m=mid(a,b),dx=m[0]-center[0],dy=m[1]-center[1],d=Math.hypot(dx,dy)||1;edge+=text(m[0]+dx*23/d,m[1]+dy*23/d,fmt(options.lengths[i]),g.color);}
      if(options.sides!==false)body+=linked(key,edge,names[i]+names[(i+1)%names.length]);
      if(options.angles!==false){const h=ag[i];body+=linked(prefix+'angle-'+names[i],angleMark(points[(i+points.length-1)%points.length],a,b,h.color,h.count,options.radius||19),'Угол '+names[i]);}
    });return body;
  }
  const defs={};

  defs.lineRelations={
    title:'Прямые и секущая',values:{angle:55,separation:3,mode:'parallel'},
    controls:[['angle','Угол α',25,155,1,'°',null,{group:'alpha'}],['separation','Расстояние между прямыми',2,4,0.1,'']],
    normalize:p=>{if(p.mode==='perpendicular')p.angle=90;return p;},
    controlsFor:p=>['perpendicular','threeParallel'].includes(p.mode)?[['separation','Раздвинь прямые',2,4,0.1,'']]:defs.lineRelations.controls,
    sample:p=>{const y=p.separation/2,dx=y/Math.tan(p.angle*RAD);return{points:{P:[-dx,-y],Q:[dx,y],L1:[-5,-y],R1:[5,-y],L2:[-5,y],R2:[5,y],L3:[-5,0],R3:[5,0]},metrics:{alpha:p.angle,beta:180-p.angle,gamma:p.angle,sum:180,separation:p.separation}};},
    render:s=>{const p=s.values,M=s.metrics,T=q=>[280+q[0]*35,165-q[1]*35],P=s.points;const lo=T([-5,-p.separation/2]),hi=T([-5,p.separation/2]);let body=line(lo,T([5,-p.separation/2]))+line(hi,T([5,p.separation/2]));
      if(p.mode==='threeParallel'){body+=line(T(P.L3),T(P.R3),BLUE)+text(75,lo[1]-20,'a')+text(75,hi[1]-20,'b')+text(75,145,'c',BLUE);return{body,readout:['Угол между a и c: 0°','Угол между b и c: 0°','Угол между a и b: 0°']};}
      const reach=Math.max(4.2,hypot([0,0],P.Q)+0.5),u=[Math.cos(p.angle*RAD)*reach,Math.sin(p.angle*RAD)*reach];body+=line(T([-u[0],-u[1]]),T(u),BLUE)+dot(T(P.P))+dot(T(P.Q));
      const same=p.mode==='sameSide',inner=same||p.mode==='alternate',second=same?M.beta:M.gamma,groups=equalityGroups([M.alpha,second]),q=T(P.Q),r=T(P.P);
      body+=text(75,lo[1]-20,'a')+text(75,hi[1]-20,'b');
      const alpha=angleMark(inner?T(P.L2):T(P.R2),q,inner?r:T(u),groups[0].color,groups[0].count,25)+text(q[0]+(inner?-61:61),q[1]+(inner?30:-25),`α = ${fmt(M.alpha)}°`,groups[0].color);
      const beta=angleMark(same?T(P.L1):T(P.R1),r,q,groups[1].color,groups[1].count,25)+text(r[0]+(same?-61:61),r[1]-27,`β = ${fmt(second)}°`,groups[1].color);
      body+=linked('alpha',`<g class="t19-angle-pulse t19-angle-pulse-first">${alpha}</g>`,'Угол α')+linked('beta',`<g class="t19-angle-pulse t19-angle-pulse-second">${beta}</g>`,'Угол β');
      return{body,readout:[row(`α = ${fmt(M.alpha)}°`,groups[0].color,'alpha'),row(`β = ${fmt(second)}°`,groups[1].color,'beta'),same?`α + β = ${fmt(M.sum)}°`:'α = β; прямые a и b параллельны']};}
  };

  defs.lineThroughPoint={
    title:'Поворот прямой через точку',values:{angle:30,target:30,mode:'twoPoints'},
    controls:[['angle','Поверни прямую через P',0,170,1,'°']],
    controlsFor:p=>p.mode==='many'?[['angle','Поверни третью прямую через P',15,75,1,'°']]:defs.lineThroughPoint.controls,
    normalize:p=>{if(p.mode==='many')p.angle=clamp(p.angle,15,75);return p;},
    sample:p=>{const u=[3.4*Math.cos(p.angle*RAD),3.4*Math.sin(p.angle*RAD)],P={P:[0,0],B:[3*Math.cos(p.target*RAD),3*Math.sin(p.target*RAD)],U:[-u[0],-u[1]],V:u};return{points:P,metrics:{angle:p.angle,target:p.target,distance:3*Math.abs(Math.sin((p.angle-p.target)*RAD)),relative:Math.min(p.angle,180-p.angle)}};},
    render:s=>{const p=s.values,P=s.points,T=q=>[280+q[0]*42,175-q[1]*42],u=[3.4*Math.cos(p.angle*RAD),3.4*Math.sin(p.angle*RAD)];let body=line(T([-u[0],-u[1]]),T(u),BLUE)+dot(T(P.P),BLUE)+text(266,197,'P',BLUE);
      if(p.mode==='twoPoints')body+=dot(T(P.B),GREEN)+text(T(P.B)[0]+14,T(P.B)[1]-14,'B',GREEN);
      else if(p.mode==='many')body+=line([70,175],[490,175],INK)+line([280,40],[280,310],GREEN)+rightMark([490,175],[280,175],[280,40]);
      else{body+=line([55,285],[505,285],GREEN)+text(80,268,'a',GREEN);if(Math.abs(p.angle-90)<1e-7)body+=rightMark(T(P.P),[280,285],[505,285]);}
      return{body,readout:p.mode==='twoPoints'?[`Расстояние от B до синей прямой: ${fmt(s.metrics.distance)}`,`Направление синей прямой: ${fmt(p.angle)}°`]:p.mode==='many'?[`Направления трёх прямых: 0°; ${fmt(p.angle)}°; 90°`,'Все три прямые проходят через P']:[`Угол синей прямой с прямой a: ${fmt(s.metrics.relative)}°`,`Синяя прямая всё время проходит через P`]};}
  };

  defs.bisectorDistance={
    title:'Точка и два равных расстояния',values:{angle:70,position:3,mode:'angle'},
    controls:[['angle','Раскрой угол',30,130,1,'°'],['position','Передвинь точку P',1,4.5,0.1,'']],
    controlsFor:p=>p.mode==='perpendicular'?[['position','Длина PM — передвинь точку P',1,4.5,0.1,'',null,{group:'PM'}]]:defs.bisectorDistance.controls,
    sample:p=>{if(p.mode==='perpendicular'){const P={A:[-3,0],B:[3,0],M:[0,0],P:[0,p.position]};return{points:P,metrics:{PA:hypot(P.P,P.A),PB:hypot(P.P,P.B),AM:3,MB:3,angle:90}};}
      const h=p.angle*RAD/2,P={O:[0,0],P:[p.position*Math.cos(h),p.position*Math.sin(h)],A:[5,0],B:[5*Math.cos(p.angle*RAD),5*Math.sin(p.angle*RAD)]};P.H=[P.P[0],0];const k=P.P[0]*Math.cos(p.angle*RAD)+P.P[1]*Math.sin(p.angle*RAD);P.K=[k*Math.cos(p.angle*RAD),k*Math.sin(p.angle*RAD)];return{points:P,metrics:{PH:hypot(P.P,P.H),PK:hypot(P.P,P.K),firstAngle:p.angle/2,secondAngle:p.angle/2}};},
    render:s=>{const P=s.points,p=s.values,M=s.metrics,T=fit(p.mode==='perpendicular'?Object.values(P).concat([[0,5],[0,-1.5]]):Object.values(P),{x:100,y:40,w:360,h:225});let body='';
      if(p.mode==='perpendicular'){
        body=line(T(P.A),T(P.B))+line(T([0,-1.5]),T([0,5]),BLUE)+labelPoints(P,['A','B'],T)+dot(T(P.P),GREEN)+text(T(P.P)[0]+22,T(P.P)[1]-8,'P',GREEN)+dot(T(P.M))+text(T(P.M)[0]-20,T(P.M)[1]+22,'M');
        for(const [key,a,b,count,color]of [['PA','P','A',1,GREEN],['PB','P','B',1,GREEN],['AM','A','M',2,BLUE],['MB','M','B',2,BLUE]])body+=linked(key,line(T(P[a]),T(P[b]),color)+tick(T(P[a]),T(P[b]),count,color),key);
        body+=linked('PM',line(T(P.P),T(P.M),BLUE),'PM')+linked('right-M',rightMark(T(P.P),T(P.M),T(P.B)),'Прямой угол PMB');
        return{body,readout:[row(`PA = ${fmt(M.PA)}`,GREEN,'PA'),row(`PB = ${fmt(M.PB)}`,GREEN,'PB'),row('AM = 3',BLUE,'AM'),row('MB = 3',BLUE,'MB'),row(`PM = ${fmt(p.position)}`,BLUE,'PM'),row('∠PMB = 90°',GREEN,'right-M')]};
      }
      body=line(T(P.O),T(P.A))+line(T(P.O),T(P.B))+line(T(P.O),T(P.P),BLUE)+labelPoints(P,['O','A','B'],T)+dot(T(P.P),BLUE)+text(T(P.P)[0]+20,T(P.P)[1]-9,'P',BLUE);
      for(const [foot,end,key]of [['H','A','PH'],['K','B','PK']])body+=linked(key,dotted(T(P.P),T(P[foot]),GREEN)+tick(T(P.P),T(P[foot]),1,GREEN)+rightMark(T(P.P),T(P[foot]),T(P[end]))+dot(T(P[foot]),GREEN)+text(T(P[foot])[0]+(foot==='H'?0:-20),T(P[foot])[1]+(foot==='H'?22:-12),foot,GREEN),key);
      body+=linked('angle-AOP',angleMark(T(P.A),T(P.O),T(P.P),BLUE,1,27),'Угол AOP')+linked('angle-POB',angleMark(T(P.P),T(P.O),T(P.B),BLUE,1,27),'Угол POB');
      return{body,readout:[row(`∠AOP = ${fmt(M.firstAngle)}°`,BLUE,'angle-AOP'),row(`∠POB = ${fmt(M.secondAngle)}°`,BLUE,'angle-POB'),row(`PH = ${fmt(M.PH)}`,GREEN,'PH'),row(`PK = ${fmt(M.PK)}`,GREEN,'PK')]};}
  };

  defs.detachedAngles={
    title:'Сумма углов и их расположение',values:{angle:55,gap:110},controls:[['angle','Первый угол',25,155,1,'°'],['gap','Раздвинь вершины углов',70,150,1,'']],
    sample:p=>{const O=[280-p.gap,205],P=[280+p.gap,205];return{points:{O,P,A:[O[0]+90,O[1]],B:[O[0]+90*Math.cos(p.angle*RAD),O[1]-90*Math.sin(p.angle*RAD)],C:[P[0]+90,P[1]],D:[P[0]+90*Math.cos((180-p.angle)*RAD),P[1]-90*Math.sin((180-p.angle)*RAD)]},metrics:{first:p.angle,second:180-p.angle,sum:180}};},
    render:s=>{let body='';const p=s.values,g=equalityGroups([s.metrics.first,s.metrics.second]);[s.points.O,s.points.P].forEach((o,i)=>{const a=(i?180-p.angle:p.angle)*RAD,A=[o[0]+90,o[1]],B=[o[0]+90*Math.cos(a),o[1]-90*Math.sin(a)];body+=linked('angle-'+i,line(o,A,g[i].color)+line(o,B,g[i].color)+angleMark(A,o,B,g[i].color,g[i].count)+dot(o)+text(o[0],o[1]+25,i?'P':'O'),i?'Второй угол':'Первый угол');});return{body,readout:[row(`Первый угол: ${fmt(s.metrics.first)}°`,g[0].color,'angle-0'),row(`Второй угол: ${fmt(s.metrics.second)}°`,g[1].color,'angle-1'),'Сумма: 180°','Вершины O и P — разные точки']};}
  };

  defs.acuteAdjacent={
    title:'Острый угол и смежный с ним',values:{angle:55},controls:[['angle','Измени острый угол',20,85,1,'°']],
    sample:p=>({points:{O:[0,0],A:[-4,0],B:[4,0],C:[4*Math.cos(p.angle*RAD),4*Math.sin(p.angle*RAD)]},metrics:{alpha:p.angle,beta:180-p.angle,sum:180}}),
    render:s=>{const P=s.points,T=q=>[280+q[0]*48,270-q[1]*48];return{body:line(T(P.A),T(P.B))+line(T(P.O),T(P.C),BLUE)+labelPoints(P,['A','B','C'],T)+dot(T(P.O))+text(295,292,'O')+linked('alpha',angleMark(T(P.B),T(P.O),T(P.C),BLUE,1,26)+text(340,239,'α',BLUE),'Угол α')+linked('beta',angleMark(T(P.A),T(P.O),T(P.C),GREEN,2,34)+text(220,220,'β',GREEN),'Угол β'),readout:[row(`α = ${fmt(s.metrics.alpha)}°`,BLUE,'alpha'),row(`β = ${fmt(s.metrics.beta)}°`,GREEN,'beta'),'Сумма: 180°']};}
  };

  defs.squareMeasure={
    title:'Измерения квадрата',values:{side:4,focus:'sides',compare:false},controls:[['side','Измени сторону квадрата',2,6,0.5,'']],
    sample:p=>({points:{A:[0,0],B:[p.side,0],C:[p.side,p.side],D:[0,p.side],O:[p.side/2,p.side/2]},metrics:{side:p.side,area:p.side*p.side,perimeter:4*p.side,diagonal:p.side*Math.SQRT2,diagonalProduct:2*p.side*p.side,angle:90,otherArea:16}}),
    render:s=>{const p=s.values,P=s.points,M=s.metrics,u=p.compare?25:36,T=q=>[p.compare?315+q[0]*u:280+(q[0]-p.side/2)*u,270-q[1]*u],names=['A','B','C','D'],points=names.map(n=>T(P[n])),groups=equalityGroups([p.side,p.side,p.side,p.side,...(p.compare?[4,4,4,4]:[])]);let body=poly(points)+labelPoints(P,names,T)+polygonMarks(points,names,{sideGroups:groups.slice(0,4)});
      if(p.focus==='diagonals')body+=linked('AC',line(T(P.A),T(P.C),AMBER)+offsetTick(T(P.A),T(P.C),2,AMBER),'AC')+linked('BD',line(T(P.B),T(P.D),AMBER)+offsetTick(T(P.B),T(P.D),2,AMBER),'BD')+dot(T(P.O))+text(T(P.O)[0]+24,T(P.O)[1]+10,'O')+linked('diagonal-angle',rightMark(T(P.A),T(P.O),T(P.B),GREEN),'Прямой угол между диагоналями');
      if(p.compare){const other=[[65,270],[165,270],[165,170],[65,170]];body+=poly(other)+polygonMarks(other,['E','F','G','H'],{prefix:'first-',sideGroups:groups.slice(4)})+text(115,300,'Сторона 4');return{body,readout:['Площадь первого квадрата: 16',`Сторона второго: ${fmt(M.side)}`,`Площадь второго: ${fmt(M.area)}`]};}
      const sideRows=names.map((n,i)=>row(`${n+names[(i+1)%4]} = ${fmt(M.side)}`,BLUE,'side-'+n+names[(i+1)%4]));
      return{body,readout:p.focus==='diagonals'?[row(`AC = ${fmt(M.diagonal)}`,AMBER,'AC'),row(`BD = ${fmt(M.diagonal)}`,AMBER,'BD'),row('Угол между диагоналями: 90°',GREEN,'diagonal-angle'),`Сторона: ${fmt(M.side)}`,`Площадь: ${fmt(M.area)}`,`AC · BD = ${fmt(M.diagonalProduct)}`]:p.focus==='area'?[`Сторона: ${fmt(M.side)}`,`Площадь: ${fmt(M.area)}`,`Периметр: ${fmt(M.perimeter)}`]:[...sideRows,...names.map(n=>row(`∠${n} = 90°`,BLUE,'angle-'+n))]};}
  };

  defs.quadrilateralExplore={
    title:'Проверка четырёхугольника',values:{mode:'free',angle:65,shift:1,height:3,a:3,b:5},
    controls:[['shift','Передвинь вершину C',-1,2,0.1,''],['height','Измени высоту справа',2,5,0.1,'']],
    controlsFor:p=>p.mode==='hinge'||p.mode==='cyclic'?[['angle','Измени угол, сохраняя длины сторон',45,135,1,'°']]:p.mode==='orthodiagonal'?[['a','Положение пересечения на AC',2,6,0.1,''],['b','Положение пересечения на BD',2,6,0.1,'']]:defs.quadrilateralExplore.controls,
    sample:p=>{let P;if(p.mode==='orthodiagonal')P={A:[-p.a,0],B:[0,-p.b],C:[8-p.a,0],D:[0,8-p.b],O:[0,0]};else if(p.mode==='hinge'||p.mode==='cyclic'){const D=[4*Math.cos(p.angle*RAD),4*Math.sin(p.angle*RAD)];P={A:[0,0],B:[6,0],C:[6+D[0],D[1]],D};}else P={A:[0,0],B:[6,0],C:[5+p.shift,p.height],D:[0,4]};
      const seq=['A','B','C','D'].map(n=>P[n]),M={sides:sideLengths(seq),angles:angles(seq),area:area(seq),AC:hypot(P.A,P.C),BD:hypot(P.B,P.D)};
      if(p.mode==='cyclic'){const D=P.D;P.O=[3,(16-6*D[0])/(2*D[1])];M.radius=hypot(P.O,P.A);M.OC=hypot(P.O,P.C);M.oppositeSum=M.angles[0]+M.angles[2];}
      if(p.mode==='orthodiagonal'){M.diagonalAngle=90;M.AO=p.a;M.OC=8-p.a;M.BO=p.b;M.OD=8-p.b;}
      if(p.mode==='hinge')M.otherSides=[6,4,6,4];
      if(p.mode==='free'){P.H=[P.C[0],0];M.height=p.height;}
      return{points:P,metrics:M};},
    render:s=>{const P=s.points,p=s.values,M=s.metrics,names=['A','B','C','D'];let all=Object.values(P);if(p.mode==='cyclic')all=all.concat([[P.O[0]-M.radius,P.O[1]-M.radius],[P.O[0]+M.radius,P.O[1]+M.radius]]);const T=p.mode==='hinge'?q=>[105+q[0]*24,245-q[1]*24]:fit(all,{x:85,y:35,w:390,h:245}),seq=names.map(n=>T(P[n])),sg=equalityGroups(M.sides),ag=equalityGroups(M.angles);let body=poly(seq)+labelPoints(P,names,T)+polygonMarks(seq,names);
      const sideRows=names.map((n,i)=>row(`${n+names[(i+1)%4]} = ${fmt(M.sides[i])}`,sg[i].color,'side-'+n+names[(i+1)%4]));
      if(p.mode==='orthodiagonal'){
        body+=linked('AC',line(T(P.A),T(P.C),PURPLE)+offsetTick(T(P.A),T(P.C),1,PURPLE),'AC')+linked('BD',line(T(P.B),T(P.D),PURPLE)+offsetTick(T(P.B),T(P.D),1,PURPLE),'BD')+dot(T(P.O))+text(T(P.O)[0]+17,T(P.O)[1]+22,'O')+linked('diagonal-angle',rightMark(T(P.A),T(P.O),T(P.B)),'Прямой угол между диагоналями');
        return{body,readout:[row(`AC = ${fmt(M.AC)}`,PURPLE,'AC'),row(`BD = ${fmt(M.BD)}`,PURPLE,'BD'),row('Угол между диагоналями: 90°',GREEN,'diagonal-angle'),...sideRows,`AO = ${fmt(M.AO)}`,`OC = ${fmt(M.OC)}`,`BO = ${fmt(M.BO)}`,`OD = ${fmt(M.OD)}`]};
      }
      if(p.mode==='cyclic'){
        body+=ring(T(P.O),hypot(T(P.O),T(P.A)),BLUE)+dot(T(P.O))+text(T(P.O)[0]-19,T(P.O)[1]+20,'O');const rr=names.map(n=>hypot(P.O,P[n])),rg=equalityGroups([...M.sides,...rr]).slice(4),rows=[];
        names.forEach((n,i)=>{body+=linked('O'+n,dotted(T(P.O),T(P[n]),rg[i].color)+tick(T(P.O),T(P[n]),rg[i].count,rg[i].color),'O'+n);rows.push(row(`O${n} = ${fmt(rr[i])}`,rg[i].color,'O'+n));});
        return{body,readout:[...rows,`∠A + ∠C = ${fmt(M.oppositeSum)}°`]};
      }
      if(p.mode==='hinge'){const other=[[325,245],[469,245],[469,149],[325,149]];body+=poly(other)+polygonMarks(other,['E','F','G','H'],{prefix:'other-'})+text(397,280,'Прямоугольник 6 × 4');return{body,readout:[...sideRows,'EF = GH = 6','FG = HE = 4',row(`∠A = ${fmt(M.angles[0])}°`,ag[0].color,'angle-A'),row('∠E = 90°',BLUE,'other-angle-E'),`Площади: ${fmt(M.area)} и 24`]};}
      if(P.H){const footName=hypot(P.H,P.B)<1e-7?'B':'H';body+=linked('height',dotted(T(P.C),T(P.H),GREEN)+rightMark(T(P.C),T(P.H),T(P.A)),'Высота C'+footName);if(footName==='H')body+=dot(T(P.H),GREEN)+text(T(P.H)[0],T(P.H)[1]+23,'H',GREEN);if(P.H[0]>P.B[0])body+=dotted(T(P.B),T(P.H),INK);}
      return{body,readout:[...names.map((n,i)=>row(`∠${n} = ${fmt(M.angles[i])}°`,ag[i].color,'angle-'+n)),`Сумма углов: ${fmt(M.angles.reduce((a,b)=>a+b,0))}°`,...(P.H?[row(`Высота = ${fmt(M.height)}`,GREEN,'height')]:[])]};}
  };

  defs.diagonalOverlay={
    title:'Поверни один треугольник',values:{angle:65,turn:0,rectangle:false},controls:[['turn','Поверни синий треугольник',0,1,0.05,'']],
    normalize:p=>{if(p.rectangle)p.angle=90;return p;},
    sample:p=>{const P={A:[0,0],B:[6,0],D:[4*Math.cos(p.angle*RAD),4*Math.sin(p.angle*RAD)]};P.C=[6+P.D[0],P.D[1]];P.O=mid(P.A,P.C);for(const[n,q]of[['E',P.A],['F',P.B],['G',P.C]])P[n]=turn(q,P.O,p.turn*Math.PI);return{points:P,metrics:{rotation:p.turn*180,AC:hypot(P.A,P.C),area:12*Math.sin(p.angle*RAD),mismatch:hypot(P.E,P.C)+hypot(P.F,P.D)+hypot(P.G,P.A)}};},
    render:s=>{const P=s.points,T=fit(Object.values(P),{x:70,y:35,w:420,h:255}),first=['A','C','D'].map(n=>T(P[n])),second=['E','F','G'].map(n=>T(P[n])),sg=equalityGroups([s.metrics.AC,6,4,6,4,s.metrics.AC]),ag=equalityGroups([...angles(first),...angles(second)]);let body=poly(first)+`<polygon points="${second.map(q=>q.join(',')).join(' ')}" fill="#b4d4f1" fill-opacity="0.65" stroke="${BLUE}" stroke-width="3"/>`+polygonMarks(first,['A','C','D'],{sideGroups:sg.slice(0,3),angleGroups:ag.slice(0,3),offsetTicks:true})+polygonMarks(second,['E','F','G'],{sideGroups:sg.slice(3),angleGroups:ag.slice(3),prefix:'moving-',offsetTicks:true})+labelPoints(P,['A','B','C','D'],T)+dot(T(P.O));return{body,readout:[`Поворот: ${fmt(s.metrics.rotation)}°`,row(`Сторона каждого треугольника: 6`,sg[1].color,'side-CD'),row('Другая сторона каждого треугольника: 4',sg[2].color,'side-DA'),row(`Третья сторона каждого треугольника: ${fmt(s.metrics.AC)}`,sg[0].color,'side-AC'),`Площадь каждого треугольника: ${fmt(s.metrics.area)}`,`Расхождение вершин после поворота: ${fmt(s.metrics.mismatch)}`]};}
  };

  defs.polygonFan={
    title:'Разбей многоугольник на треугольники',values:{n:5,cuts:0,size:3,stretch:1,mode:'angles'},
    controls:[['n','Количество сторон',3,8,1,''],['cuts','Проведи диагонали из A',0,5,1,'']],
    normalize:p=>{p.n=p.fixedN?Number(p.fixedN):Math.round(p.n);p.cuts=Math.min(Math.round(p.cuts),p.n-3);if(p.mode==='regular')p.stretch=1;return p;},
    controlsFor:p=>p.mode==='regular'?[['size','Измени размер правильного шестиугольника',2,3.5,0.1,'']]:p.mode==='irregular'?[['stretch','Передвинь одну вершину',0.8,1.25,0.01,'']]:[...(!p.fixedN?[['n','Количество сторон',3,8,1,'']]:[]),['cuts','Проведи диагонали из A',0,p.n-3,1,'']],
    sample:p=>{const points={};for(let i=0;i<p.n;i++){const r=p.size*(i===1?p.stretch:1),a=(90+360*i/p.n)*RAD;points[String.fromCharCode(65+i)]=[r*Math.cos(a),r*Math.sin(a)];}const seq=Object.values(points),aa=angles(seq);return{points,metrics:{n:p.n,sides:sideLengths(seq),angles:aa,sum:aa.reduce((a,b)=>a+b,0),triangles:p.n-2,drawn:p.cuts+1}};},
    render:s=>{const P=s.points,p=s.values,M=s.metrics,names=Object.keys(P),T=q=>[280+q[0]*36,165-q[1]*36],seq=names.map(n=>T(P[n])),sg=equalityGroups(M.sides),ag=equalityGroups(M.angles);let body=poly(seq)+polygonMarks(seq,names,{sides:p.mode!=='angles',lengths:p.mode!=='angles'?M.sides:null})+labelPoints(P,names,T);for(let i=0;i<p.cuts;i++)body+=line(T(P.A),T(P[names[i+2]]),BLUE);
      return{body,readout:p.mode==='angles'?[`Сторон: ${p.n}`,`Проведено диагоналей: ${p.cuts}`,`Для полного разбиения нужно треугольников: ${M.triangles}`,`Сумма углов: ${M.triangles} · 180° = ${fmt(M.sum)}°`,...(p.cuts===p.n-3?[`Каждый из ${M.triangles} треугольников даёт 180°.`]:['Проведи все диагонали из A и посчитай треугольники.'])]:[...names.map((n,i)=>row(`${n+names[(i+1)%names.length]} = ${fmt(M.sides[i])}`,sg[i].color,'side-'+n+names[(i+1)%names.length])),...names.map((n,i)=>row(`∠${n} = ${fmt(M.angles[i])}°`,ag[i].color,'angle-'+n))]};}
  };

  defs.coordinateMeasure={
    title:'Передвинь точку и проверь расстояние',values:{a:-3,b:4,x:-3,y:1,bx:4,by:3,mode:'line'},
    controls:[['a','Координата A',-6,6,0.5,''],['b','Координата B',-6,6,0.5,'']],
    controlsFor:p=>p.mode==='midpoint'?[['bx','Координата x точки B',-5,5,0.5,''],['by','Координата y точки B',-3,4,0.5,'']]:defs.coordinateMeasure.controls,
    sample:p=>{const P=p.mode==='midpoint'?{A:[p.x,p.y],B:[p.bx,p.by]}:{A:[p.a,0],B:[p.b,0]};P.M=mid(P.A,P.B);return{points:P,metrics:{length:hypot(P.A,P.B),difference:p.b-p.a,midX:P.M[0],midY:P.M[1],AM:hypot(P.A,P.M),MB:hypot(P.M,P.B)}};},
    render:s=>{const p=s.values,P=s.points,T=q=>[280+q[0]*34,190-q[1]*30];let body=line([60,190],[500,190]);for(let i=-6;i<=6;i++)body+=line([280+i*34,185],[280+i*34,195])+text(280+i*34,214,i);if(p.mode==='midpoint'){body+=line([280,45],[280,295]);for(let i=-3;i<=4;i++)if(i)body+=line([275,190-i*30],[285,190-i*30])+text(263,190-i*30,i);}
      body+=line(T(P.A),T(P.B),BLUE)+dot(T(P.A),BLUE)+dot(T(P.B),GREEN)+text(T(P.A)[0]-10,T(P.A)[1]-20,'A',BLUE)+text(T(P.B)[0]+10,T(P.B)[1]-20,'B',GREEN);if(p.mode==='midpoint')body+=linked('AM',line(T(P.A),T(P.M),BLUE)+tick(T(P.A),T(P.M),1,BLUE),'AM')+linked('MB',line(T(P.M),T(P.B),BLUE)+tick(T(P.M),T(P.B),1,BLUE),'MB')+dot(T(P.M))+text(T(P.M)[0],T(P.M)[1]+22,'M');return{body,readout:p.mode==='midpoint'?[`A (${fmt(P.A[0])}; ${fmt(P.A[1])})`,`B (${fmt(P.B[0])}; ${fmt(P.B[1])})`,`M (${fmt(s.metrics.midX)}; ${fmt(s.metrics.midY)})`,row(`AM = ${fmt(s.metrics.AM)}`,BLUE,'AM'),row(`MB = ${fmt(s.metrics.MB)}`,BLUE,'MB')]:[`Координаты: ${fmt(p.a)} и ${fmt(p.b)}`,`Разность B − A = ${fmt(s.metrics.difference)}`,`Расстояние AB = ${fmt(s.metrics.length)}`]};}
  };

  defs.rhombusArea={
    title:'Ромб внутри прямоугольника',values:{d1:6,d2:4},controls:[['d1','Диагональ AC',3,8,0.5,'',null,{group:'AC'}],['d2','Диагональ BD',2,6,0.5,'',null,{group:'BD'}]],
    sample:p=>({points:{A:[-p.d1/2,0],B:[0,-p.d2/2],C:[p.d1/2,0],D:[0,p.d2/2],O:[0,0]},metrics:{area:p.d1*p.d2/2,rectangleArea:p.d1*p.d2,triangleArea:p.d1*p.d2/8}}),
    render:s=>{const p=s.values,P=s.points,M=s.metrics,T=q=>[280+q[0]*40,170-q[1]*40],names=['A','B','C','D'],same=Math.abs(p.d1-p.d2)<1e-7,c2=same?AMBER:GREEN;let body=`<rect x="${280-p.d1*20}" y="${170-p.d2*20}" width="${p.d1*40}" height="${p.d2*40}" fill="none" stroke="${GREEN}" stroke-width="2" stroke-dasharray="6 5"/>`+poly(names.map(n=>T(P[n])))+polygonMarks(names.map(n=>T(P[n])),names)+labelPoints(P,names,T);
      body+=linked('AC',line(T(P.A),T(P.C),AMBER)+offsetTick(T(P.A),T(P.C),2,AMBER),'AC')+linked('BD',line(T(P.B),T(P.D),c2)+offsetTick(T(P.B),T(P.D),same?2:3,c2),'BD')+dot(T(P.O))+text(T(P.O)[0]-18,T(P.O)[1]+23,'O')+linked('diagonal-angle',rightMark(T(P.A),T(P.O),T(P.B),GREEN),'Прямой угол между диагоналями');
      const corners=[[-p.d1/2,-p.d2/2],[p.d1/2,-p.d2/2],[p.d1/2,p.d2/2],[-p.d1/2,p.d2/2]].map(T);corners.forEach((v,i)=>{body+=rightMark(corners[(i+3)%4],v,corners[(i+1)%4],GREEN,8);});
      return{body,readout:[row(`AC = ${fmt(p.d1)}`,AMBER,'AC'),row(`BD = ${fmt(p.d2)}`,c2,'BD'),row('∠AOB = 90°',GREEN,'diagonal-angle'),`Площадь ромба: ${fmt(p.d1)} · ${fmt(p.d2)} : 2 = ${fmt(M.area)}`,`Площадь прямоугольника вокруг ромба: ${fmt(M.rectangleArea)}`,`Площадь каждого из четырёх треугольников: ${fmt(M.triangleArea)}`]};}
  };

  defs.equalPerimeters={
    title:'Один периметр — разные формы',values:{width:9},controls:[['width','Потяни сторону второго прямоугольника',2,10,0.5,'']],
    sample:p=>({points:{A:[0,0],B:[p.width,0],C:[p.width,12-p.width],D:[0,12-p.width]},metrics:{width:p.width,height:12-p.width,perimeter:24,area:p.width*(12-p.width),squareArea:36}}),
    render:s=>{const p=s.values,M=s.metrics,T=q=>[330+q[0]*17,270-q[1]*17],left=[[75,270],[177,270],[177,168],[75,168]],right=['A','B','C','D'].map(n=>T(s.points[n])),groups=equalityGroups([6,6,6,6,M.width,M.height,M.width,M.height]);const body=poly(left)+polygonMarks(left,['E','F','G','H'],{prefix:'square-',sideGroups:groups.slice(0,4)})+text(126,300,'Квадрат 6 × 6')+poly(right)+polygonMarks(right,['A','B','C','D'],{sideGroups:groups.slice(4)})+text(410,300,`${fmt(M.width)} × ${fmt(M.height)}`);return{body,readout:['Периметр квадрата: 24',`Периметр прямоугольника: ${fmt(M.perimeter)}`,'Площадь квадрата: 36',`Площадь прямоугольника: ${fmt(M.area)}`]};}
  };
  return defs;
});

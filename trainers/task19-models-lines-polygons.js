/* Constrained experiments for lines, quadrilaterals and polygons. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory;
  else root.Task19LinePolygonModels=factory;
})(typeof window==='object'?window:globalThis,function(kit){
  'use strict';
  const {RAD,BLUE,GREEN,INK,LIGHT,clamp,hypot,mid,fmt,angleAt,line,text,dot,poly,fit,labelPoints}=kit;
  const area=P=>Math.abs(P.reduce((sum,p,i)=>{const q=P[(i+1)%P.length];return sum+p[0]*q[1]-p[1]*q[0];},0))/2;
  const turn=(p,c,a)=>{const x=p[0]-c[0],y=p[1]-c[1];return[c[0]+x*Math.cos(a)-y*Math.sin(a),c[1]+x*Math.sin(a)+y*Math.cos(a)];};
  const ring=(c,r,color=INK)=>`<circle cx="${c[0]}" cy="${c[1]}" r="${r}" fill="none" stroke="${color}" stroke-width="2"/>`;
  const sideLengths=P=>P.map((p,i)=>hypot(p,P[(i+1)%P.length]));
  const angles=P=>P.map((p,i)=>angleAt(P[(i+P.length-1)%P.length],p,P[(i+1)%P.length]));
  const dotted=(a,b,color)=>line(a,b,color,'6 5');
  const defs={};

  defs.lineRelations={
    title:'Прямые и секущая',values:{angle:55,separation:3,mode:'parallel'},
    controls:[['angle','Наклон секущей',25,155,1,'°'],['separation','Расстояние между прямыми',2,4,0.1,'']],
    normalize:p=>{if(p.mode==='perpendicular')p.angle=90;return p;},
    controlsFor:p=>['perpendicular','threeParallel'].includes(p.mode)?[['separation','Раздвинь прямые',2,4,0.1,'']]:defs.lineRelations.controls,
    sample:p=>{const y=p.separation/2,dx=y/Math.tan(p.angle*RAD);return{points:{P:[-dx,-y],Q:[dx,y],L1:[-5,-y],R1:[5,-y],L2:[-5,y],R2:[5,y],L3:[-5,0],R3:[5,0]},metrics:{alpha:p.angle,beta:180-p.angle,gamma:p.angle,sum:180,separation:p.separation}};},
    render:s=>{const p=s.values,M=s.metrics,T=q=>[280+q[0]*35,165-q[1]*35],P=s.points;const lo=T([-5,-p.separation/2]),hi=T([-5,p.separation/2]);let body=line(lo,T([5,-p.separation/2]))+line(hi,T([5,p.separation/2]));
      if(p.mode==='threeParallel'){body+=line(T(P.L3),T(P.R3),BLUE)+text(75,lo[1]-20,'a')+text(75,hi[1]-20,'b')+text(75,145,'c',BLUE);return{body,readout:['Угол между a и c: 0°','Угол между b и c: 0°','Угол между a и b: 0°']};}
      const reach=Math.max(4.2,hypot([0,0],P.Q)+0.5),u=[Math.cos(p.angle*RAD)*reach,Math.sin(p.angle*RAD)*reach];body+=line(T([-u[0],-u[1]]),T(u),BLUE)+dot(T(P.P))+dot(T(P.Q));
      const same=p.mode==='sameSide',inner=same||p.mode==='alternate';
      body+=text(75,lo[1]-20,'a')+text(75,hi[1]-20,'b')+text(T(P.Q)[0]+(inner?-38:38),T(P.Q)[1]+(inner?22:-22),'α',BLUE);
      body+=text(T(P.P)[0]+(same?-38:38),T(P.P)[1]-22,same?'β':'γ',GREEN);
      if(p.mode==='perpendicular')for(const n of ['P','Q']){const q=T(P[n]);body+=`<path d="M ${q[0]+13} ${q[1]} v -13 h -13" fill="none" stroke="${GREEN}" stroke-width="2"/>`;}
      return{body,readout:same?[`α = ${fmt(M.alpha)}°`,`β = ${fmt(M.beta)}°`,`α + β = ${fmt(M.sum)}°`]:[`α = ${fmt(M.alpha)}°`,`γ = ${fmt(M.gamma)}°`,`Угол между прямыми a и b: 0°`]};}
  };

  defs.lineThroughPoint={
    title:'Поворот прямой через точку',values:{angle:30,target:30,mode:'twoPoints'},
    controls:[['angle','Поверни прямую через P',0,170,1,'°']],
    controlsFor:p=>p.mode==='many'?[['angle','Поверни третью прямую через P',15,75,1,'°']]:defs.lineThroughPoint.controls,
    normalize:p=>{if(p.mode==='many')p.angle=clamp(p.angle,15,75);return p;},
    sample:p=>{const u=[3.4*Math.cos(p.angle*RAD),3.4*Math.sin(p.angle*RAD)],P={P:[0,0],B:[3*Math.cos(p.target*RAD),3*Math.sin(p.target*RAD)],U:[-u[0],-u[1]],V:u};return{points:P,metrics:{angle:p.angle,target:p.target,distance:3*Math.abs(Math.sin((p.angle-p.target)*RAD)),relative:Math.min(p.angle,180-p.angle)}};},
    render:s=>{const p=s.values,P=s.points,T=q=>[280+q[0]*42,175-q[1]*42],u=[3.4*Math.cos(p.angle*RAD),3.4*Math.sin(p.angle*RAD)];let body=line(T([-u[0],-u[1]]),T(u),BLUE)+dot(T(P.P),BLUE)+text(266,197,'P',BLUE);
      if(p.mode==='twoPoints')body+=dot(T(P.B),GREEN)+text(T(P.B)[0]+14,T(P.B)[1]-14,'B',GREEN);
      else if(p.mode==='many')body+=line([70,175],[490,175],INK)+line([280,40],[280,310],GREEN);
      else body+=line([55,285],[505,285],GREEN)+text(80,268,'a',GREEN);
      return{body,readout:p.mode==='twoPoints'?[`Расстояние от B до синей прямой: ${fmt(s.metrics.distance)}`,`Направление синей прямой: ${fmt(p.angle)}°`]:p.mode==='many'?[`Направления трёх прямых: 0°; ${fmt(p.angle)}°; 90°`,'Все три прямые проходят через P']:[`Угол синей прямой с прямой a: ${fmt(s.metrics.relative)}°`,`Синяя прямая всё время проходит через P`]};}
  };

  defs.bisectorDistance={
    title:'Точка и два равных расстояния',values:{angle:70,position:3,mode:'angle'},
    controls:[['angle','Раскрой угол',30,130,1,'°'],['position','Передвинь точку P',1,4.5,0.1,'']],
    controlsFor:p=>p.mode==='perpendicular'?[['position','Передвинь точку P по перпендикуляру',1,4.5,0.1,'']]:defs.bisectorDistance.controls,
    sample:p=>{if(p.mode==='perpendicular'){const P={A:[-3,0],B:[3,0],M:[0,0],P:[0,p.position]};return{points:P,metrics:{PA:hypot(P.P,P.A),PB:hypot(P.P,P.B),AM:3,MB:3,angle:90}};}
      const h=p.angle*RAD/2,P={O:[0,0],P:[p.position*Math.cos(h),p.position*Math.sin(h)],A:[5,0],B:[5*Math.cos(p.angle*RAD),5*Math.sin(p.angle*RAD)]};P.H=[P.P[0],0];const k=P.P[0]*Math.cos(p.angle*RAD)+P.P[1]*Math.sin(p.angle*RAD);P.K=[k*Math.cos(p.angle*RAD),k*Math.sin(p.angle*RAD)];return{points:P,metrics:{PH:hypot(P.P,P.H),PK:hypot(P.P,P.K),firstAngle:p.angle/2,secondAngle:p.angle/2}};},
    render:s=>{const P=s.points,p=s.values,T=fit(p.mode==='perpendicular'?Object.values(P).concat([[0,5]]):Object.values(P),{x:100,y:40,w:360,h:225});let body='';if(p.mode==='perpendicular'){body=line(T(P.A),T(P.B))+line(T([0,0]),T([0,5]),BLUE)+line(T(P.A),T(P.P),GREEN)+line(T(P.B),T(P.P),GREEN)+labelPoints(P,['A','B','P'],T)+dot(T(P.M))+text(T(P.M)[0]+20,T(P.M)[1]+23,'M');return{body,readout:[`PA = ${fmt(s.metrics.PA)}`,`PB = ${fmt(s.metrics.PB)}`,`AM = MB = 3`,`Угол PMB = 90°`]};}
      body=line(T(P.O),T(P.A))+line(T(P.O),T(P.B))+line(T(P.O),T(P.P),BLUE)+dotted(T(P.P),T(P.H),GREEN)+dotted(T(P.P),T(P.K),GREEN)+labelPoints(P,['O','A','B','P'],T)+dot(T(P.H),GREEN)+dot(T(P.K),GREEN)+text(T(P.H)[0],T(P.H)[1]+20,'H',GREEN)+text(T(P.K)[0]-17,T(P.K)[1]-12,'K',GREEN);
      return{body,readout:[`∠AOP = ${fmt(s.metrics.firstAngle)}°`,`∠POB = ${fmt(s.metrics.secondAngle)}°`,`PH = ${fmt(s.metrics.PH)}`,`PK = ${fmt(s.metrics.PK)}`]};}
  };

  defs.detachedAngles={
    title:'Сумма углов и их расположение',values:{angle:55,gap:110},controls:[['angle','Первый угол',25,155,1,'°'],['gap','Раздвинь вершины углов',70,150,1,'']],
    sample:p=>{const O=[280-p.gap,205],P=[280+p.gap,205];return{points:{O,P,A:[O[0]+90,O[1]],B:[O[0]+90*Math.cos(p.angle*RAD),O[1]-90*Math.sin(p.angle*RAD)],C:[P[0]+90,P[1]],D:[P[0]+90*Math.cos((180-p.angle)*RAD),P[1]-90*Math.sin((180-p.angle)*RAD)]},metrics:{first:p.angle,second:180-p.angle,sum:180}};},
    render:s=>{let body='';const p=s.values;[s.points.O,s.points.P].forEach((o,i)=>{const a=(i?180-p.angle:p.angle)*RAD;body+=line(o,[o[0]+90,o[1]],i?GREEN:BLUE)+line(o,[o[0]+90*Math.cos(a),o[1]-90*Math.sin(a)],i?GREEN:BLUE)+dot(o)+text(o[0],o[1]+25,i?'P':'O');});return{body,readout:[`Первый угол: ${fmt(s.metrics.first)}°`,`Второй угол: ${fmt(s.metrics.second)}°`,`Сумма: 180°`,`Вершины O и P — разные точки`]};}
  };

  defs.acuteAdjacent={
    title:'Острый угол и смежный с ним',values:{angle:55},controls:[['angle','Измени острый угол',20,85,1,'°']],
    sample:p=>({points:{O:[0,0],A:[-4,0],B:[4,0],C:[4*Math.cos(p.angle*RAD),4*Math.sin(p.angle*RAD)]},metrics:{alpha:p.angle,beta:180-p.angle,sum:180}}),
    render:s=>{const P=s.points,T=q=>[280+q[0]*48,270-q[1]*48];return{body:line(T(P.A),T(P.B))+line(T(P.O),T(P.C),BLUE)+labelPoints(P,['A','B','C'],T)+dot(T(P.O))+text(295,292,'O')+text(340,239,'α',BLUE)+text(220,220,'β',GREEN),readout:[`α = ${fmt(s.metrics.alpha)}°`,`β = ${fmt(s.metrics.beta)}°`,`Сумма: 180°`]};}
  };

  defs.squareMeasure={
    title:'Измерения квадрата',values:{side:4,focus:'sides',compare:false},controls:[['side','Измени сторону квадрата',2,6,0.5,'']],
    sample:p=>({points:{A:[0,0],B:[p.side,0],C:[p.side,p.side],D:[0,p.side],O:[p.side/2,p.side/2]},metrics:{side:p.side,area:p.side*p.side,perimeter:4*p.side,diagonal:p.side*Math.SQRT2,diagonalProduct:2*p.side*p.side,angle:90,otherArea:16}}),
    render:s=>{const p=s.values,P=s.points,M=s.metrics,u=p.compare?25:36,T=q=>[p.compare?315+q[0]*u:280+(q[0]-p.side/2)*u,270-q[1]*u];let body=poly(['A','B','C','D'].map(n=>T(P[n])))+labelPoints(P,['A','B','C','D'],T);const a=T(P.A);body+=`<path d="M ${a[0]+13} ${a[1]} v -13 h -13" fill="none" stroke="${INK}" stroke-width="2"/>`;
      if(p.focus==='diagonals')body+=line(T(P.A),T(P.C),BLUE)+line(T(P.B),T(P.D),GREEN)+dot(T(P.O));
      if(p.compare){body+=poly([[65,270],[165,270],[165,170],[65,170]])+text(115,300,'Сторона 4');return{body,readout:[`Площадь первого квадрата: 16`,`Сторона второго: ${fmt(M.side)}`,`Площадь второго: ${fmt(M.area)}`]};}
      return{body,readout:p.focus==='diagonals'?[`Сторона: ${fmt(M.side)}`,`AC = BD = ${fmt(M.diagonal)}`,`Угол между диагоналями: 90°`,`Площадь: ${fmt(M.area)}`,`AC · BD = ${fmt(M.diagonalProduct)}`]:p.focus==='area'?[`Сторона: ${fmt(M.side)}`,`Площадь: ${fmt(M.area)}`,`Периметр: ${fmt(M.perimeter)}`]:[`AB = BC = CD = DA = ${fmt(M.side)}`,`Все четыре угла: 90°`]};}
  };

  defs.quadrilateralExplore={
    title:'Проверка четырёхугольника',values:{mode:'free',angle:65,shift:1,height:3,a:3,b:5},
    controls:[['shift','Передвинь вершину C',-1,2,0.1,''],['height','Измени высоту справа',2,5,0.1,'']],
    controlsFor:p=>p.mode==='hinge'||p.mode==='cyclic'?[['angle','Измени угол, сохраняя длины сторон',45,135,1,'°']]:p.mode==='orthodiagonal'?[['a','Положение пересечения на AC',2,6,0.1,''],['b','Положение пересечения на BD',2,6,0.1,'']]:defs.quadrilateralExplore.controls,
    sample:p=>{let P;if(p.mode==='orthodiagonal')P={A:[-p.a,0],B:[0,-p.b],C:[8-p.a,0],D:[0,8-p.b],O:[0,0]};else if(p.mode==='hinge'||p.mode==='cyclic'){const D=[4*Math.cos(p.angle*RAD),4*Math.sin(p.angle*RAD)];P={A:[0,0],B:[6,0],C:[6+D[0],D[1]],D};}else P={A:[0,0],B:[6,0],C:[5+p.shift,p.height],D:[0,4]};
      const seq=['A','B','C','D'].map(n=>P[n]),M={sides:sideLengths(seq),angles:angles(seq),area:area(seq),AC:hypot(P.A,P.C),BD:hypot(P.B,P.D)};
      if(p.mode==='cyclic'){const D=P.D;P.O=[3,(16-6*D[0])/(2*D[1])];M.radius=hypot(P.O,P.A);M.OC=hypot(P.O,P.C);M.oppositeSum=M.angles[0]+M.angles[2];}
      if(p.mode==='orthodiagonal'){M.diagonalAngle=90;M.AO=p.a;M.OC=8-p.a;M.BO=p.b;M.OD=8-p.b;}
      if(p.mode==='hinge')M.otherSides=[6,4,6,4];return{points:P,metrics:M};},
    render:s=>{const P=s.points,p=s.values,M=s.metrics;let all=Object.values(P);if(p.mode==='cyclic')all=all.concat([[P.O[0]-M.radius,P.O[1]-M.radius],[P.O[0]+M.radius,P.O[1]+M.radius]]);const T=fit(all,p.mode==='hinge'?{x:35,y:55,w:240,h:190}:{x:85,y:35,w:390,h:245});let body=poly(['A','B','C','D'].map(n=>T(P[n])))+labelPoints(P,['A','B','C','D'],T);
      if(p.mode==='orthodiagonal')body+=line(T(P.A),T(P.C),BLUE)+line(T(P.B),T(P.D),GREEN)+dot(T(P.O))+text(T(P.O)[0]+15,T(P.O)[1]+20,'O');
      if(p.mode==='cyclic')body+=ring(T(P.O),hypot(T(P.O),T(P.A)),BLUE)+dotted(T(P.O),T(P.C),GREEN)+dot(T(P.O))+text(T(P.O)[0],T(P.O)[1]+20,'O');
      if(p.mode==='hinge'){body+=poly([[325,245],[505,245],[505,125],[325,125]])+text(410,280,'Прямоугольник 6 × 4');return{body,readout:[`Стороны первого: ${M.sides.map(fmt).join('; ')}`,`Стороны второго: 6; 4; 6; 4`,`Угол A первого: ${fmt(M.angles[0])}°`,`Угол второго: 90°`,`Площади: ${fmt(M.area)} и 24`]};}
      return{body,readout:p.mode==='orthodiagonal'?[`AC = ${fmt(M.AC)}; BD = ${fmt(M.BD)}`,`Угол между диагоналями: 90°`,`Стороны: ${M.sides.map(fmt).join('; ')}`,`AO = ${fmt(M.AO)}; OC = ${fmt(M.OC)}`]:p.mode==='cyclic'?[`OA = OB = OD = ${fmt(M.radius)}`,`OC = ${fmt(M.OC)}`,`∠A + ∠C = ${fmt(M.oppositeSum)}°`]:[`Углы A, B, C, D: ${M.angles.map(n=>fmt(n)+'°').join('; ')}`,`Сумма: ${fmt(M.angles.reduce((a,b)=>a+b,0))}°`]};}
  };

  defs.diagonalOverlay={
    title:'Поверни один треугольник',values:{angle:65,turn:0,rectangle:false},controls:[['turn','Поверни синий треугольник',0,1,0.05,'']],
    normalize:p=>{if(p.rectangle)p.angle=90;return p;},
    sample:p=>{const P={A:[0,0],B:[6,0],D:[4*Math.cos(p.angle*RAD),4*Math.sin(p.angle*RAD)]};P.C=[6+P.D[0],P.D[1]];P.O=mid(P.A,P.C);for(const[n,q]of[['E',P.A],['F',P.B],['G',P.C]])P[n]=turn(q,P.O,p.turn*Math.PI);return{points:P,metrics:{rotation:p.turn*180,AC:hypot(P.A,P.C),area:12*Math.sin(p.angle*RAD),mismatch:hypot(P.E,P.C)+hypot(P.F,P.D)+hypot(P.G,P.A)}};},
    render:s=>{const P=s.points,T=fit(Object.values(P),{x:70,y:35,w:420,h:255});let body=poly([T(P.A),T(P.C),T(P.D)])+line(T(P.A),T(P.C),GREEN)+`<polygon points="${['E','F','G'].map(n=>T(P[n]).join(',')).join(' ')}" fill="#b4d4f1" fill-opacity="0.65" stroke="${BLUE}" stroke-width="3"/>`+labelPoints(P,['A','B','C','D'],T)+dot(T(P.O));return{body,readout:[`Поворот: ${fmt(s.metrics.rotation)}°`,`Стороны обоих треугольников: 6; 4; ${fmt(s.metrics.AC)}`,`Площади: ${fmt(s.metrics.area)} и ${fmt(s.metrics.area)}`,`Расхождение вершин после поворота: ${fmt(s.metrics.mismatch)}`]};}
  };

  defs.polygonFan={
    title:'Разбей многоугольник на треугольники',values:{n:5,cuts:0,size:3,stretch:1,mode:'angles'},
    controls:[['n','Количество сторон',3,8,1,''],['cuts','Проведи диагонали из A',0,5,1,'']],
    normalize:p=>{p.n=p.fixedN?Number(p.fixedN):Math.round(p.n);p.cuts=Math.min(Math.round(p.cuts),p.n-3);if(p.mode==='regular')p.stretch=1;return p;},
    controlsFor:p=>p.mode==='regular'?[['size','Измени размер правильного шестиугольника',2,3.5,0.1,'']]:p.mode==='irregular'?[['stretch','Передвинь одну вершину',0.8,1.25,0.01,'']]:[...(!p.fixedN?[['n','Количество сторон',3,8,1,'']]:[]),['cuts','Проведи диагонали из A',0,p.n-3,1,'']],
    sample:p=>{const points={};for(let i=0;i<p.n;i++){const r=p.size*(i===1?p.stretch:1),a=(90+360*i/p.n)*RAD;points[String.fromCharCode(65+i)]=[r*Math.cos(a),r*Math.sin(a)];}const seq=Object.values(points),aa=angles(seq);return{points,metrics:{n:p.n,sides:sideLengths(seq),angles:aa,sum:aa.reduce((a,b)=>a+b,0),triangles:p.n-2,drawn:p.cuts+1}};},
    render:s=>{const P=s.points,p=s.values,names=Object.keys(P),T=q=>[280+q[0]*36,165-q[1]*36];let body=poly(names.map(n=>T(P[n])))+labelPoints(P,names,T);for(let i=0;i<p.cuts;i++)body+=line(T(P.A),T(P[names[i+2]]),BLUE);return{body,readout:p.mode==='angles'?[`Сторон: ${p.n}`,`Проведено диагоналей: ${p.cuts}`,`Для полного разбиения нужно треугольников: ${s.metrics.triangles}`,`Сумма внутренних углов: ${fmt(s.metrics.sum)}°`]:[`Длины сторон: ${s.metrics.sides.map(fmt).join('; ')}`,`Углы: ${s.metrics.angles.map(n=>fmt(n)+'°').join('; ')}`]};}
  };

  defs.coordinateMeasure={
    title:'Передвинь точку и проверь расстояние',values:{a:-3,b:4,x:-3,y:1,bx:4,by:3,mode:'line'},
    controls:[['a','Координата A',-6,6,0.5,''],['b','Координата B',-6,6,0.5,'']],
    controlsFor:p=>p.mode==='midpoint'?[['bx','Координата x точки B',-5,5,0.5,''],['by','Координата y точки B',-3,4,0.5,'']]:defs.coordinateMeasure.controls,
    sample:p=>{const P=p.mode==='midpoint'?{A:[p.x,p.y],B:[p.bx,p.by]}:{A:[p.a,0],B:[p.b,0]};P.M=mid(P.A,P.B);return{points:P,metrics:{length:hypot(P.A,P.B),difference:p.b-p.a,midX:P.M[0],midY:P.M[1],AM:hypot(P.A,P.M),MB:hypot(P.M,P.B)}};},
    render:s=>{const p=s.values,P=s.points,T=q=>[280+q[0]*34,190-q[1]*30];let body=line([60,190],[500,190]);for(let i=-6;i<=6;i++)body+=line([280+i*34,185],[280+i*34,195])+text(280+i*34,214,i);if(p.mode==='midpoint'){body+=line([280,45],[280,295]);for(let i=-3;i<=4;i++)if(i)body+=line([275,190-i*30],[285,190-i*30])+text(263,190-i*30,i);}
      body+=line(T(P.A),T(P.B),BLUE)+dot(T(P.A),BLUE)+dot(T(P.B),GREEN)+text(T(P.A)[0]-10,T(P.A)[1]-20,'A',BLUE)+text(T(P.B)[0]+10,T(P.B)[1]-20,'B',GREEN);if(p.mode==='midpoint')body+=dot(T(P.M))+text(T(P.M)[0],T(P.M)[1]+22,'M');return{body,readout:p.mode==='midpoint'?[`A (${fmt(P.A[0])}; ${fmt(P.A[1])})`,`B (${fmt(P.B[0])}; ${fmt(P.B[1])})`,`M (${fmt(s.metrics.midX)}; ${fmt(s.metrics.midY)})`,`AM = ${fmt(s.metrics.AM)}; MB = ${fmt(s.metrics.MB)}`]:[`Координаты: ${fmt(p.a)} и ${fmt(p.b)}`,`Разность B − A = ${fmt(s.metrics.difference)}`,`Расстояние AB = ${fmt(s.metrics.length)}`]};}
  };

  defs.rhombusArea={
    title:'Ромб внутри прямоугольника',values:{d1:6,d2:4},controls:[['d1','Первая диагональ',3,8,0.5,''],['d2','Вторая диагональ',2,6,0.5,'']],
    sample:p=>({points:{A:[-p.d1/2,0],B:[0,-p.d2/2],C:[p.d1/2,0],D:[0,p.d2/2],O:[0,0]},metrics:{area:p.d1*p.d2/2,rectangleArea:p.d1*p.d2,triangleArea:p.d1*p.d2/8}}),
    render:s=>{const p=s.values,P=s.points,T=q=>[280+q[0]*40,170-q[1]*40];let body=`<rect x="${280-p.d1*20}" y="${170-p.d2*20}" width="${p.d1*40}" height="${p.d2*40}" fill="none" stroke="${GREEN}" stroke-width="2" stroke-dasharray="6 5"/>`+poly(['A','B','C','D'].map(n=>T(P[n])))+line(T(P.A),T(P.C),BLUE)+line(T(P.B),T(P.D),BLUE)+labelPoints(P,['A','B','C','D'],T);return{body,readout:[`Диагонали: ${fmt(p.d1)} и ${fmt(p.d2)}`,`Площадь прямоугольника вокруг ромба: ${fmt(s.metrics.rectangleArea)}`,`Площадь ромба: ${fmt(s.metrics.area)}`,`Каждый из четырёх треугольников ромба: ${fmt(s.metrics.triangleArea)}`]};}
  };

  defs.equalPerimeters={
    title:'Один периметр — разные формы',values:{width:9},controls:[['width','Потяни сторону второго прямоугольника',2,10,0.5,'']],
    sample:p=>({points:{A:[0,0],B:[p.width,0],C:[p.width,12-p.width],D:[0,12-p.width]},metrics:{width:p.width,height:12-p.width,perimeter:24,area:p.width*(12-p.width),squareArea:36}}),
    render:s=>{const p=s.values,M=s.metrics,T=q=>[330+q[0]*17,270-q[1]*17];const body=poly([[75,270],[177,270],[177,168],[75,168]])+text(126,300,'Квадрат 6 × 6')+poly(['A','B','C','D'].map(n=>T(s.points[n])))+text(410,300,`${fmt(M.width)} × ${fmt(M.height)}`);return{body,readout:[`Периметр квадрата: 24`,`Периметр прямоугольника: ${fmt(M.perimeter)}`,`Площади: 36 и ${fmt(M.area)}`]};}
  };
  return defs;
});

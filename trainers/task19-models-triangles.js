/* Interactive triangle experiments. Every constraint is applied before geometry. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory;
  else root.Task19TriangleModels=factory;
})(typeof window==='object'?window:globalThis,function(kit){
  'use strict';
  const {RAD,BLUE,GREEN,INK,LIGHT,clamp,finite,hypot,mid,esc,fmt,angleAt,line,text,dot,poly,fit,labelPoints}=kit;
  const AMBER='#a76616';
  const range=(key,label,min,max,step=1,unit='')=>[key,label,min,max,step,unit];
  const rotate=(p,a)=>[p[0]*Math.cos(a*RAD)-p[1]*Math.sin(a*RAD),p[0]*Math.sin(a*RAD)+p[1]*Math.cos(a*RAD)];
  const foot=(p,a,b)=>{const v=[b[0]-a[0],b[1]-a[1]],t=((p[0]-a[0])*v[0]+(p[1]-a[1])*v[1])/(v[0]*v[0]+v[1]*v[1]);return[a[0]+t*v[0],a[1]+t*v[1]];};
  const weighted=(a,b,u,v)=>[(a[0]*u+b[0]*v)/(u+v),(a[1]*u+b[1]*v)/(u+v)];
  const circle=(p,r,color=BLUE,dash='')=>'<circle cx="'+p[0]+'" cy="'+p[1]+'" r="'+r+'" fill="none" stroke="'+color+'" stroke-width="2"'+(dash?' stroke-dasharray="'+dash+'"':'')+'/>';
  function arc(a,b,c,color=AMBER,r=23){
    let x=Math.atan2(a[1]-b[1],a[0]-b[0]),y=Math.atan2(c[1]-b[1],c[0]-b[0]),delta=y-x;
    while(delta>Math.PI)delta-=2*Math.PI;while(delta<-Math.PI)delta+=2*Math.PI;
    const u=[b[0]+r*Math.cos(x),b[1]+r*Math.sin(x)],v=[b[0]+r*Math.cos(x+delta),b[1]+r*Math.sin(x+delta)];
    return '<path d="M '+u.join(' ')+' A '+r+' '+r+' 0 0 '+(delta>0?1:0)+' '+v.join(' ')+'" fill="none" stroke="'+color+'" stroke-width="2"/>';
  }
  function rightMark(v,h,b){
    const a=[v[0]-h[0],v[1]-h[1]],u=[b[0]-h[0],b[1]-h[1]],n=Math.hypot(...a),m=Math.hypot(...u);
    if(n<1e-8||m<1e-8)return'';
    const p=[h[0]+a[0]*10/n,h[1]+a[1]*10/n],q=[p[0]+u[0]*10/m,p[1]+u[1]*10/m],z=[h[0]+u[0]*10/m,h[1]+u[1]*10/m];
    return line(p,q,GREEN)+line(q,z,GREEN);
  }
  function normalizeTriangle(p){
    p={...p};p.scale=clamp(finite(p.scale,6),2,8);p.a=clamp(finite(p.a,55),10,150);p.b=clamp(finite(p.b,65),10,170-p.a);p.rotation=clamp(finite(p.rotation,0),0,360);
    if(p.mode==='right'){p.a=90;p.b=clamp(p.b,15,75);}
    if(p.mode==='acute'){p.a=clamp(p.a,20,80);p.b=clamp(p.b,Math.max(20,91-p.a),Math.min(80,160-p.a));}
    if(p.mode==='obtuse'){p.a=clamp(p.a,95,145);p.b=clamp(p.b,10,175-p.a);}
    if(p.mode==='iso'){p.a=clamp(p.a,15,80);p.b=p.a;}
    if(p.mode==='equilateral'){p.a=60;p.b=60;}
    if(p.mode==='fixed345'){p.a=90;p.b=Math.atan(3/4)/RAD;p.scale=4;}
    p.from=clamp(Math.round(finite(p.from,0)),0,2);return p;
  }
  function triangleControls(p){
    if(p.mode==='fixed345')return[range('rotation','Повернуть треугольник',0,360,5,'°')];
    const controls=[range('scale','Длина основания AB',2,8,.1)];
    if(p.mode==='right')controls.push(range('b','Изменить острый угол B',15,75,1,'°'));
    else if(p.mode==='iso')controls.push(range('a','Изменить угол при основании',15,80,1,'°'));
    else if(p.mode==='acute')controls.push(range('a','Угол A',20,80,1,'°'),range('b','Угол B',Math.max(20,91-p.a),Math.min(80,160-p.a),1,'°'));
    else if(p.mode==='obtuse')controls.push(range('a','Тупой угол A',95,145,1,'°'),range('b','Острый угол B',10,175-p.a,1,'°'));
    else if(p.mode!=='equilateral')controls.push(range('a','Угол A',10,150,1,'°'),range('b','Угол B',10,170-p.a,1,'°'));
    if(p.chooseVertex)controls.push(['from','Из какой вершины провести линию?',0,2,1,'',['C','A','B']]);
    return controls;
  }
  function triangleSample(p){
    const c=180-p.a-p.b,ac=p.scale*Math.sin(p.b*RAD)/Math.sin(c*RAD);
    let A=[0,0],B=[p.scale,0],C=[ac*Math.cos(p.a*RAD),ac*Math.sin(p.a*RAD)];
    if(p.mode==='fixed345'){A=[0,0];B=[4,0];C=[0,3];}
    if(p.rotation){A=rotate(A,p.rotation);B=rotate(B,p.rotation);C=rotate(C,p.rotation);}
    const AB=hypot(A,B),AC=hypot(A,C),BC=hypot(B,C),area=Math.abs((B[0]-A[0])*(C[1]-A[1])-(B[1]-A[1])*(C[0]-A[0]))/2;
    return {points:{A,B,C},metrics:{AB,AC,BC,area,a:angleAt(B,A,C),b:angleAt(A,B,C),c:angleAt(A,C,B),perimeter:AB+AC+BC}};
  }
  function basicsReadout(M){return['∠A = '+fmt(M.a)+'°; ∠B = '+fmt(M.b)+'°; ∠C = '+fmt(M.c)+'°','Сумма углов: '+fmt(M.a+M.b+M.c)+'°','AB = '+fmt(M.AB)+'; AC = '+fmt(M.AC)+'; BC = '+fmt(M.BC)];}
  function drawTriangle(s,extra=[]){const T=fit([...Object.values(s.points),...extra],{x:65,y:45,w:430,h:230}),P=s.points;return{T,body:poly(['A','B','C'].map(n=>T(P[n])))+labelPoints(P,['A','B','C'],T)};}
  function renderExplore(s){
    const P=s.points,M=s.metrics,p=s.values,focus=p.focus||'angles',d=drawTriangle(s);let body=d.body,readout=basicsReadout(M);const T=d.T;
    for(const [a,b,c]of [['B','A','C'],['A','B','C'],['A','C','B']])body+=arc(T(P[a]),T(P[b]),T(P[c]),BLUE);
    if(focus==='exterior'){
      const E=[P.B[0]+(P.B[0]-P.A[0])*.55,P.B[1]+(P.B[1]-P.A[1])*.55],Q={...P,E},U=fit(Object.values(Q),{x:65,y:45,w:430,h:230});
      body=poly(['A','B','C'].map(n=>U(P[n])))+line(U(P.B),U(E),BLUE)+labelPoints(Q,['A','B','C','E'],U)+arc(U(P.C),U(P.B),U(E),AMBER,30);
      readout=['Внешний угол CBE: '+fmt(180-M.b)+'°','∠A + ∠C = '+fmt(M.a+M.c)+'°','∠ABC = '+fmt(M.b)+'°'];
    }
    if(focus==='pythagoras')readout=[...basicsReadout(M),'BC² = '+fmt(M.BC*M.BC),'AB² + AC² = '+fmt(M.AB*M.AB+M.AC*M.AC),'AB² − AC² = '+fmt(M.AB*M.AB-M.AC*M.AC)];
    if(focus==='legsum')readout=['BC = '+fmt(M.BC),'AB + AC = '+fmt(M.AB+M.AC),'∠A = '+fmt(M.a)+'°'];
    if(focus==='inequality')readout=['AB = '+fmt(M.AB)+'; AC + BC = '+fmt(M.AC+M.BC),'AC = '+fmt(M.AC)+'; AB + BC = '+fmt(M.AB+M.BC),'BC = '+fmt(M.BC)+'; AB + AC = '+fmt(M.AB+M.AC)];
    if(focus==='area-product')readout=['Площадь треугольника: '+fmt(M.area),'AB · AC = '+fmt(M.AB*M.AC),'∠A = '+fmt(M.a)+'°'];
    if(focus==='tan')readout=['Острый угол B: '+fmt(M.b)+'°','Противолежащий катет AC: '+fmt(M.AC),'Прилежащий катет AB: '+fmt(M.AB),'Тангенс B: '+fmt(M.AC/M.AB)];
    if(focus==='cos')readout=['Острый угол B: '+fmt(M.b)+'°','Гипотенуза BC: '+fmt(M.BC),'Прилежащий катет AB: '+fmt(M.AB),'Косинус B: '+fmt(M.AB/M.BC),'Отношение гипотенузы к прилежащему катету: '+fmt(M.BC/M.AB)];
    return {body,readout};
  }
  function constructionSample(p){
    const s=triangleSample(p),P=s.points,M=s.metrics,names=[['C','A','B'],['A','B','C'],['B','A','C']][p.from],V=P[names[0]],U=P[names[1]],W=P[names[2]];
    P.H=foot(V,U,W);P.M=mid(U,W);P.D=weighted(U,W,hypot(V,W),hypot(V,U));
    M.vertex=names[0];M.left=names[1];M.right=names[2];M.UD=hypot(U,P.D);M.DW=hypot(P.D,W);M.UM=hypot(U,P.M);M.MW=hypot(P.M,W);M.HM=hypot(P.H,P.M);M.DM=hypot(P.D,P.M);M.bisectLeft=angleAt(U,V,P.D);M.bisectRight=angleAt(P.D,V,W);M.medianLeft=angleAt(U,V,P.M);M.medianRight=angleAt(P.M,V,W);M.bisectorBaseAngle=angleAt(V,P.D,U);
    for(const [n,u,w]of [['A','B','C'],['B','A','C'],['C','A','B']]){P['H'+n]=foot(P[n],P[u],P[w]);M['h'+n]=hypot(P[n],P['H'+n]);}
    P.E=mid(P.A,P.C);P.F=mid(P.B,P.C);M.EF=hypot(P.E,P.F);return s;
  }
  function renderConstruction(s){
    const P=s.points,M=s.metrics,p=s.values,focus=p.focus||'bisector',names=['A','B','C'];
    let extra=focus==='heights'?['HA','HB','HC']:focus==='midline'?['E','F']:['D','M','H'];
    const T=fit(names.concat(extra).map(n=>P[n]),{x:65,y:40,w:430,h:245});let body=poly(names.map(n=>T(P[n])))+labelPoints(P,names,T),readout=[];
    if(focus==='heights'){
      for(const [n,u,w]of [['A','B','C'],['B','A','C'],['C','A','B']]){const H=P['H'+n];body+=line(T(P[u]),T(H),INK,'5 5')+line(T(P[w]),T(H),INK,'5 5')+line(T(P[n]),T(H),GREEN)+rightMark(T(P[n]),T(H),T(P[u]))+dot(T(H),GREEN);}
      readout=['Высота из A: '+fmt(M.hA),'Высота из B: '+fmt(M.hB),'Высота из C: '+fmt(M.hC),...basicsReadout(M).slice(0,1)];
    }else if(focus==='midline'){
      body+=line(T(P.E),T(P.F),GREEN)+labelPoints(P,['E','F'],T);
      readout=['AE = EC = '+fmt(M.AC/2),'BF = FC = '+fmt(M.BC/2),'AB = '+fmt(M.AB)+'; EF = '+fmt(M.EF),'Угол между EF и AB: 0°'];
    }else{
      const V=P[M.vertex],U=P[M.left],W=P[M.right];
      if(focus==='median'||focus==='special')body+=line(T(V),T(P.M),BLUE)+dot(T(P.M),BLUE)+text(T(P.M)[0]+12,T(P.M)[1]+25,'M',BLUE);
      if(focus==='bisector'||focus==='special')body+=line(T(V),T(P.D),GREEN)+dot(T(P.D),GREEN)+text(T(P.D)[0]-15,T(P.D)[1]+25,'D',GREEN)+arc(T(U),T(V),T(P.D),GREEN,27)+arc(T(P.D),T(V),T(W),GREEN,35);
      if(focus==='median'||focus==='special'){body+=line(T(V),T(P.H),AMBER,'5 5')+line(T(U),T(P.H),INK,'5 5')+rightMark(T(V),T(P.H),T(U));}
      if(focus==='median')readout=[M.left+'M = '+fmt(M.UM)+'; M'+M.right+' = '+fmt(M.MW),'Углы у медианы: '+fmt(M.medianLeft)+'° и '+fmt(M.medianRight)+'°','Расстояние между основаниями медианы и высоты: '+fmt(M.HM),'Площади двух частей: '+fmt(M.area/2)+' и '+fmt(M.area/2),'Стороны к вершине '+M.vertex+': '+fmt(hypot(V,U))+' и '+fmt(hypot(V,W))];
      else readout=['Биссектриса из вершины '+M.vertex,'Два угла: '+fmt(M.bisectLeft)+'° и '+fmt(M.bisectRight)+'°',M.left+'D = '+fmt(M.UD)+'; D'+M.right+' = '+fmt(M.DW),'Угол с противоположной стороной: '+fmt(M.bisectorBaseAngle)+'°','Расстояние от D до середины стороны M: '+fmt(M.DM)];
    }
    return{body,readout};
  }
  function centersSample(p){
    const s=triangleSample(p),P=s.points,M=s.metrics,{A,B,C}=P;
    const den=2*(A[0]*(B[1]-C[1])+B[0]*(C[1]-A[1])+C[0]*(A[1]-B[1])),sq=q=>q[0]*q[0]+q[1]*q[1];
    P.O=[(sq(A)*(B[1]-C[1])+sq(B)*(C[1]-A[1])+sq(C)*(A[1]-B[1]))/den,(sq(A)*(C[0]-B[0])+sq(B)*(A[0]-C[0])+sq(C)*(B[0]-A[0]))/den];
    P.I=[(M.BC*A[0]+M.AC*B[0]+M.AB*C[0])/M.perimeter,(M.BC*A[1]+M.AC*B[1]+M.AB*C[1])/M.perimeter];
    P.X=foot(P.I,A,B);P.Y=foot(P.I,B,C);P.Z=foot(P.I,C,A);M.radius=hypot(P.O,A);M.inradius=2*M.area/M.perimeter;M.OI=hypot(P.O,P.I);M.OA=hypot(P.O,A);M.OB=hypot(P.O,B);M.OC=hypot(P.O,C);M.IX=hypot(P.I,P.X);M.IY=hypot(P.I,P.Y);M.IZ=hypot(P.I,P.Z);
    return s;
  }
  function renderCenters(s){
    const P=s.points,M=s.metrics,p=s.values,focus=p.focus||'circumcenter',inside=focus==='incenter'||focus==='both',outside=focus!=='incenter';
    let bound=[P.A,P.B,P.C];if(outside)bound.push([P.O[0]-M.radius,P.O[1]-M.radius],[P.O[0]+M.radius,P.O[1]+M.radius]);
    const T=fit(bound,{x:65,y:30,w:430,h:275}),unit=hypot(T([0,0]),T([1,0]));let body=poly([P.A,P.B,P.C].map(T))+labelPoints(P,['A','B','C'],T),readout=[];
    if(outside){body+=circle(T(P.O),M.radius*unit,BLUE);for(const name of ['A','B','C'])body+=line(T(P.O),T(P[name]),BLUE,'5 5');body+=dot(T(P.O),BLUE)+text(T(P.O)[0]+17,T(P.O)[1]+16,'O',BLUE);readout.push('OA = '+fmt(M.OA)+'; OB = '+fmt(M.OB)+'; OC = '+fmt(M.OC));
      if(p.showPerpendiculars)for(const [u,v]of [['A','B'],['B','C'],['C','A']]){const H=mid(P[u],P[v]),end=[H[0]+(P.O[0]-H[0])*1.25,H[1]+(P.O[1]-H[1])*1.25];body+=line(T(H),T(end),GREEN,'5 5')+rightMark(T(P.O),T(H),T(P[u]))+dot(T(H),GREEN);}
    }
    if(inside){body+=circle(T(P.I),M.inradius*unit,GREEN);for(const [n,h]of [['A','X'],['B','Y'],['C','Z']])body+=line(T(P[n]),T(P.I),GREEN,'5 5')+line(T(P.I),T(P[h]),GREEN);body+=dot(T(P.I),GREEN)+text(T(P.I)[0]-16,T(P.I)[1]-18,'I',GREEN);readout.push('Расстояния от I до сторон: '+fmt(M.IX)+'; '+fmt(M.IY)+'; '+fmt(M.IZ));}
    if(focus==='both')readout.push('Расстояние между центрами O и I: '+fmt(M.OI));
    readout.push(...basicsReadout(M).slice(0,1));return{body,readout};
  }
  function medianCircleSample(p){const r=p.radius,angle=p.point*RAD,P={A:[-r,0],B:[r,0],M:[0,0],C:[r*Math.cos(angle),r*Math.sin(angle)]};return{points:P,metrics:{AM:r,BM:r,CM:hypot(P.C,P.M),AB:2*r,angle:angleAt(P.A,P.C,P.B)}};}
  function renderMedianCircle(s){const P=s.points,M=s.metrics,r=s.values.radius,T=fit([[-r,-r],[r,r]],{x:100,y:25,w:360,h:285}),u=hypot(T([0,0]),T([1,0]));return{body:circle(T(P.M),r*u,BLUE,'5 5')+poly([P.A,P.B,P.C].map(T))+line(T(P.C),T(P.M),GREEN)+labelPoints(P,['A','B','C','M'],T)+arc(T(P.A),T(P.C),T(P.B),AMBER,25),readout:['AM = '+fmt(M.AM)+'; BM = '+fmt(M.BM)+'; CM = '+fmt(M.CM),'AB = '+fmt(M.AB),'∠ACB = '+fmt(M.angle)+'°']};}
  function pairTransforms(P,Q){
    const bounds=pts=>({minX:Math.min(...pts.map(p=>p[0])),maxX:Math.max(...pts.map(p=>p[0])),minY:Math.min(...pts.map(p=>p[1])),maxY:Math.max(...pts.map(p=>p[1]))}),a=bounds(P),b=bounds(Q),u=Math.min(205/Math.max(a.maxX-a.minX,b.maxX-b.minX,1),225/Math.max(a.maxY-a.minY,b.maxY-b.minY,1));
    const tr=(x,r)=>p=>[x+(p[0]-(r.maxX+r.minX)/2)*u,175-(p[1]-(r.maxY+r.minY)/2)*u];return[tr(140,a),tr(420,b)];
  }
  function renderPair(P,Q,left=['A','B','C'],right=['D','E','F']){const [T,U]=pairTransforms(P,Q),labels=(pts,names,tr)=>pts.map((p,i)=>dot(tr(p))+text(tr(p)[0]+(i===0?-14:i===1?14:0),tr(p)[1]+(i===2?-21:22),names[i])).join('');return{body:poly(P.map(T))+poly(Q.map(U))+labels(P,left,T)+labels(Q,right,U),T,U};}
  function pairMetrics(P,Q){const sides=T=>[hypot(T[0],T[1]),hypot(T[0],T[2]),hypot(T[1],T[2])],area=T=>Math.abs((T[1][0]-T[0][0])*(T[2][1]-T[0][1])-(T[1][1]-T[0][1])*(T[2][0]-T[0][0]))/2;return{sides1:sides(P),sides2:sides(Q),area1:area(P),area2:area(Q),angles1:[angleAt(P[1],P[0],P[2]),angleAt(P[0],P[1],P[2]),angleAt(P[0],P[2],P[1])],angles2:[angleAt(Q[1],Q[0],Q[2]),angleAt(Q[0],Q[1],Q[2]),angleAt(Q[0],Q[2],Q[1])]};}
  function renderPairReadout(s){const M=s.metrics;return{...renderPair(s.points.first,s.points.second),readout:['Стороны ABC: '+M.sides1.map(fmt).join('; '),'Стороны DEF: '+M.sides2.map(fmt).join('; '),'Углы ABC: '+M.angles1.map(fmt).join('°; ')+'°','Углы DEF: '+M.angles2.map(fmt).join('°; ')+'°','Площади: '+fmt(M.area1)+' и '+fmt(M.area2)]};}
  const defs={
    triangleExplore:{title:'Измени треугольник',values:{a:55,b:65,scale:6,rotation:0,mode:'free',focus:'angles'},controls:[range('a','Угол A',10,150,1,'°'),range('b','Угол B',10,160,1,'°'),range('scale','Основание AB',2,8,.1),range('rotation','Поворот',0,360,5,'°')],normalize:normalizeTriangle,controlsFor:triangleControls,sample:triangleSample,render:renderExplore},
    triangleConstructions:{title:'Линии в треугольнике',values:{a:45,b:70,scale:6,from:0,mode:'free',focus:'bisector',chooseVertex:false},controls:[range('a','Угол A',10,150,1,'°'),range('b','Угол B',10,160,1,'°'),range('scale','Основание AB',2,8,.1),range('from','Вершина',0,2,1)],normalize:normalizeTriangle,controlsFor:triangleControls,sample:constructionSample,render:renderConstruction},
    triangleCenters:{title:'Найди центр окружности',values:{a:55,b:65,scale:6,mode:'free',focus:'circumcenter'},controls:[range('a','Угол A',10,150,1,'°'),range('b','Угол B',10,160,1,'°'),range('scale','Основание AB',2,8,.1)],normalize:normalizeTriangle,controlsFor:triangleControls,sample:centersSample,render:renderCenters},
    triangleMedianCircle:{title:'Медиана и угол треугольника',values:{radius:3,point:65},controls:[range('point','Перемести C по окружности',15,165,1,'°'),range('radius','Длина AM, BM и CM',2,6,.1)],normalize:p=>({...p,radius:clamp(finite(p.radius,3),2,6),point:clamp(finite(p.point,65),15,165)}),sample:medianCircleSample,render:renderMedianCircle},
    triangleLinkage:{title:'Попробуй замкнуть три отрезка',values:{a:2,b:3,c:5,turn:35,fixedLengths:true},controls:[range('a','Длина первого отрезка',.5,9,.5),range('b','Длина второго отрезка',.5,9,.5),range('c','Длина основания',.5,9,.5),range('turn','Поверни первый отрезок',0,180,.1,'°')],controlsFor:p=>[...(!p.fixedLengths?[range('a','Длина первого отрезка',.5,9,.5),range('b','Длина второго отрезка',.5,9,.5),range('c','Длина основания',.5,9,.5)]:[]),range('turn','Поверни первый отрезок',0,180,.1,'°')],normalize:p=>({...p,a:clamp(finite(p.a,2),.5,9),b:clamp(finite(p.b,3),.5,9),c:clamp(finite(p.c,5),.5,9),turn:clamp(finite(p.turn,35),0,180)}),sample(p){const A=[0,0],B=[p.c,0],C=[p.a*Math.cos(p.turn*RAD),p.a*Math.sin(p.turn*RAD)],d=hypot(B,C),direction=d>1e-10?[(C[0]-B[0])/d,(C[1]-B[1])/d]:[0,1],D=[B[0]+p.b*direction[0],B[1]+p.b*direction[1]];return{points:{A,B,C,D},metrics:{a:hypot(A,C),b:hypot(B,D),c:hypot(A,B),gap:hypot(C,D),height:C[1],possible:p.a+p.b>p.c&&p.a+p.c>p.b&&p.b+p.c>p.a}};},render(s){const P=s.points,M=s.metrics,T=fit(Object.values(P),{x:65,y:40,w:430,h:240});return{body:line(T(P.A),T(P.B),INK)+line(T(P.A),T(P.C),BLUE)+line(T(P.B),T(P.D),GREEN)+line(T(P.C),T(P.D),AMBER,'5 5')+labelPoints(P,['A','B','C','D'],T),readout:['Длины отрезков: '+fmt(M.a)+'; '+fmt(M.b)+'; '+fmt(M.c),'Зазор между свободными концами C и D: '+fmt(M.gap),'Высота точки C над основанием: '+fmt(M.height)]};}},
    triangleCongruence:{title:'Сравни два треугольника',values:{kind:'sas',side1:6,side2:4,angle:50,otherAngle:100,rotation:0},controls:[range('side1','Первая сторона в обоих треугольниках',3,8,.1),range('side2','Вторая сторона в обоих треугольниках',2,6,.1),range('angle','Угол первого треугольника',20,140,1,'°'),range('otherAngle','Угол второго треугольника',20,140,1,'°'),range('rotation','Повернуть второй треугольник',0,360,5,'°')],controlsFor:p=>p.kind==='ssa'?[range('angle','Одинаковый угол A и D',20,35,1,'°'),range('rotation','Повернуть второй треугольник',0,360,5,'°')]:[range('side1','Первая сторона в обоих треугольниках',3,8,.1),range('side2','Вторая сторона в обоих треугольниках',2,6,.1),range('angle','Угол первого треугольника',20,140,1,'°'),...(p.kind==='twoSides'?[range('otherAngle','Угол второго треугольника',20,140,1,'°')]:[]),range('rotation','Повернуть второй треугольник',0,360,5,'°')],normalize(p){p={...p,side1:clamp(finite(p.side1,6),3,8),side2:clamp(finite(p.side2,4),2,6),angle:clamp(finite(p.angle,50),20,p.kind==='ssa'?35:140),otherAngle:clamp(finite(p.otherAngle,100),20,140),rotation:clamp(finite(p.rotation,0),0,360)};if(p.kind==='ssa'){p.side1=8;p.side2=5;}return p;},sample(p){let first,second;if(p.kind==='ssa'){const x=p.side1*Math.cos(p.angle*RAD),delta=Math.sqrt(p.side2*p.side2-p.side1*p.side1*Math.sin(p.angle*RAD)**2),at=t=>[t*Math.cos(p.angle*RAD),t*Math.sin(p.angle*RAD)];first=[[0,0],[p.side1,0],at(x+delta)];second=[[0,0],[p.side1,0],at(x-delta)];}else{const tri=a=>[[0,0],[p.side1,0],[p.side2*Math.cos(a*RAD),p.side2*Math.sin(a*RAD)]];first=tri(p.angle);second=tri(p.kind==='twoSides'?p.otherAngle:p.angle);}second=second.map(q=>rotate(q,p.rotation));return{points:{first,second},metrics:pairMetrics(first,second)};},render:renderPairReadout},
    triangleAreaPair:{title:'Одинаковая площадь — одинаковая форма?',values:{base:6,height:3,x:1,rotation:0,congruent:false},controls:[range('base','Оба основания',3,8,.1),range('height','Обе высоты',2,5,.1),range('x','Сдвинуть вершину второго треугольника',-2,8,.1),range('rotation','Повернуть второй треугольник',0,360,5,'°')],controlsFor:p=>[range('base','Оба основания',3,8,.1),range('height','Обе высоты',2,5,.1),p.congruent?range('rotation','Повернуть второй треугольник',0,360,5,'°'):range('x','Сдвинуть вершину второго треугольника',-2,8,.1)],normalize:p=>({...p,base:clamp(finite(p.base,6),3,8),height:clamp(finite(p.height,3),2,5),x:clamp(finite(p.x,1),-2,8),rotation:clamp(finite(p.rotation,0),0,360)}),sample(p){const first=[[0,0],[p.base,0],[1,p.height]],second=p.congruent?first.map(q=>rotate(q,p.rotation)):[[0,0],[p.base,0],[p.x,p.height]];return{points:{first,second},metrics:pairMetrics(first,second)};},render:renderPairReadout},
    triangleSimilarity:{title:'Сравни форму и размер',values:{a:55,b:65,scale:2,base:3,fixedScale:false,mode:'free',otherAngle:35},controls:[range('scale','Масштаб второго треугольника',1,3,.1),range('base','Основание первого треугольника',2,4,.1),range('a','Угол A',20,80,1,'°'),range('b','Угол B',20,80,1,'°'),range('otherAngle','Угол при основании второго',20,80,1,'°')],controlsFor(p){let c=[range('base','Основание первого треугольника',2,4,.1)];if(!p.fixedScale)c.push(range('scale','Масштаб второго треугольника',1,3,.1));if(p.mode!=='equilateral')c.push(range('a',p.mode==='isoPair'?'Угол при основании первого':'Угол A',20,80,1,'°'));if(p.mode==='isoPair')c.push(range('otherAngle','Угол при основании второго',20,80,1,'°'));else if(p.mode!=='equilateral')c.push(range('b','Угол B',20,80,1,'°'));return c;},normalize(p){p={...p,a:clamp(finite(p.a,55),20,80),b:clamp(finite(p.b,65),20,80),base:clamp(finite(p.base,3),2,4),scale:clamp(finite(p.scale,2),1,3),otherAngle:clamp(finite(p.otherAngle,35),20,80)};if(p.fixedScale)p.scale=2;if(p.mode==='equilateral'){p.a=60;p.b=60;}if(p.mode==='isoPair')p.b=p.a;return p;},sample(p){const s=triangleSample(normalizeTriangle({a:p.a,b:p.b,scale:p.base})),first=['A','B','C'].map(n=>s.points[n]),second=p.mode==='isoPair'?[[0,0],[p.base*p.scale,0],[p.base*p.scale/2,p.base*p.scale/2*Math.tan(p.otherAngle*RAD)]]:first.map(q=>q.map(n=>n*p.scale));return{points:{first,second},metrics:pairMetrics(first,second)};},render(s){const r=renderPairReadout(s),M=s.metrics;r.readout.push('Отношение периметров: '+fmt(M.sides2.reduce((a,b)=>a+b,0)/M.sides1.reduce((a,b)=>a+b,0)),'Отношение площадей: '+fmt(M.area2/M.area1));return r;}}
  };
  return defs;
});

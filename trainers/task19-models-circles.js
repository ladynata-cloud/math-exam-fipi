/* Circle experiments: movable objects are constructed from the stated premises. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory;
  else root.Task19CircleModels=factory;
})(typeof window==='object'?window:globalThis,function(kit){
  'use strict';
  const {RAD,BLUE,GREEN,INK,LIGHT,clamp,finite,hypot,mid,fmt,angleAt,line,text,dot,poly,fit,labelPoints}=kit;
  const AMBER='#a76616';
  const range=(key,label,min,max,step=.1,unit='')=>[key,label,min,max,step,unit];
  const polar=(r,a)=>[r*Math.cos(a*RAD),r*Math.sin(a*RAD)];
  const add=(p,q)=>[p[0]+q[0],p[1]+q[1]],mul=(p,k)=>[p[0]*k,p[1]*k];
  const rotate=(p,a)=>[p[0]*Math.cos(a*RAD)-p[1]*Math.sin(a*RAD),p[0]*Math.sin(a*RAD)+p[1]*Math.cos(a*RAD)];
  const norm=(p,key,lo,hi,fallback)=>{p[key]=clamp(finite(p[key],fallback),lo,hi);};
  const bounds=(o,r)=>[[o[0]-r,o[1]-r],[o[0]+r,o[1]+r]];
  const circle=(o,r,color=INK,fill='none')=>`<circle cx="${o[0]}" cy="${o[1]}" r="${r}" fill="${fill}" stroke="${color}" stroke-width="2.5"/>`;
  const unit=T=>hypot(T([0,0]),T([1,0]));
  const circleAt=(T,o,r,color=INK,fill='none')=>circle(T(o),r*unit(T),color,fill);
  const origin=(T,o,name='O',color=INK)=>dot(T(o),color)+text(T(o)[0]-16,T(o)[1]+18,name,color);
  function rightMark(a,b,c){
    const u=[a[0]-b[0],a[1]-b[1]],v=[c[0]-b[0],c[1]-b[1]],n=Math.hypot(...u),m=Math.hypot(...v);if(n<1e-8||m<1e-8)return '';
    const p=add(b,mul(u,12/n)),q=add(p,mul(v,12/m)),r=add(b,mul(v,12/m));return `<path d="M ${p.join(' ')} L ${q.join(' ')} L ${r.join(' ')}" fill="none" stroke="${GREEN}" stroke-width="2"/>`;
  }
  const foot=(p,a,b)=>{const v=[b[0]-a[0],b[1]-a[1]],t=((p[0]-a[0])*v[0]+(p[1]-a[1])*v[1])/(v[0]*v[0]+v[1]*v[1]);return add(a,mul(v,t));};
  const defs={};
  defs.circleRadii={
    title:'Радиусы и диаметры',values:{radius:4,angle:55,mode:'radii'},
    controls:[range('radius','Радиус окружности',2,6,.1),range('angle','Повернуть отрезок',20,160,1,'°')],
    sample(p){const O=[0,0],A=polar(p.radius,p.angle),B=p.mode==='radii'?polar(p.radius,p.angle+115):mul(A,-1),P={O,A,B};if(p.mode==='twoDiameters'){P.C=[-p.radius,0];P.D=[p.radius,0];}return{points:P,metrics:{radius:p.radius,OA:hypot(O,A),OB:hypot(O,B),AB:hypot(A,B),...(P.C?{CD:hypot(P.C,P.D)}:{})}};},
    render(s){const P=s.points,M=s.metrics,p=s.values,T=fit(bounds(P.O,p.radius));let body=circleAt(T,P.O,p.radius,INK,LIGHT),names=['A','B'];body+=p.mode==='radii'?line(T(P.O),T(P.A),BLUE)+line(T(P.O),T(P.B),GREEN):line(T(P.A),T(P.B),BLUE);if(P.C){body+=line(T(P.C),T(P.D),GREEN);names.push('C','D');}body+=labelPoints(P,names,T)+origin(T,P.O);return{body,readout:[`OA = ${fmt(M.OA)}; OB = ${fmt(M.OB)}`,`AB = ${fmt(M.AB)}`,...(P.C?[`CD = ${fmt(M.CD)}`,'Общая точка отрезков: O']:[])]};}
  };
  defs.circleLine={
    title:'Прямая и окружность',values:{radius:4,angle:40,offset:.4,mode:'tangent'},
    controls:[range('radius','Радиус',2,6,.1),range('angle','Повернуть прямую',0,160,1,'°'),range('offset','Сдвинуть секущую',-.85,.85,.05)],
    controlsFor(p){return defs.circleLine.controls.filter(c=>c[0]!=='offset'||p.mode==='secant');},
    sample(p){const r=p.radius,n=polar(1,p.angle),v=polar(1,p.angle+90),O=[0,0],M=mul(n,r*(p.mode==='secant'?p.offset:1)),U=add(M,mul(v,-1.5*r)),V=add(M,mul(v,1.5*r)),P={O,M,U,V},metrics={radius:r,distance:hypot(O,M),intersections:p.mode==='secant'?2:1};if(p.mode==='secant'){const h=Math.sqrt(r*r-metrics.distance**2);P.A=add(M,mul(v,-h));P.B=add(M,mul(v,h));metrics.AB=hypot(P.A,P.B);}else{P.T=M;metrics.angle=angleAt(O,M,V);}return{points:P,metrics};},
    render(s){const P=s.points,M=s.metrics,T=fit([...bounds(P.O,M.radius),P.U,P.V],{x:65,y:45,w:430,h:240});let body=circleAt(T,P.O,M.radius,INK,LIGHT)+line(T(P.U),T(P.V),BLUE)+origin(T,P.O),readout=[`Общих точек: ${M.intersections}`,`Радиус = ${fmt(M.radius)}`];if(P.T){body+=line(T(P.O),T(P.T),GREEN)+rightMark(T(P.O),T(P.T),T(P.V))+dot(T(P.T),BLUE)+text(T(P.T)[0]+17,T(P.T)[1]+17,'T',BLUE);readout.push(`Угол между OT и прямой: ${fmt(M.angle)}°`);}else{body+=labelPoints(P,['A','B'],T)+line(T(P.O),T(P.M),GREEN,'5 5');readout.push(`Хорда AB = ${fmt(M.AB)}`);}return{body,readout};}
  };
  defs.circleTangents={
    title:'Две касательные из одной точки',values:{radius:3,distance:2,angle:0},
    controls:[range('radius','Радиус',2,5,.1),range('distance','Расстояние OP (в радиусах)',1.2,2.8,.05),range('angle','Повернуть точку P',-35,35,1,'°')],
    sample(p){const r=p.radius,d=r*p.distance,delta=Math.acos(r/d)/RAD,O=[0,0],P=polar(d,p.angle),A=polar(r,p.angle+delta),B=polar(r,p.angle-delta);return{points:{O,P,A,B},metrics:{radius:r,OP:hypot(O,P),PA:hypot(P,A),PB:hypot(P,B),angleA:angleAt(O,A,P),angleB:angleAt(O,B,P),tangents:2}};},
    render(s){const P=s.points,M=s.metrics,T=fit([...bounds(P.O,M.radius),P.P],{x:60,y:40,w:440,h:245});return{body:circleAt(T,P.O,M.radius,INK,LIGHT)+line(T(P.P),T(P.A),BLUE)+line(T(P.P),T(P.B),BLUE)+line(T(P.O),T(P.A),GREEN,'5 5')+line(T(P.O),T(P.B),GREEN,'5 5')+rightMark(T(P.O),T(P.A),T(P.P))+rightMark(T(P.O),T(P.B),T(P.P))+labelPoints(P,['A','B','P'],T)+origin(T,P.O),readout:[`PA = ${fmt(M.PA)}; PB = ${fmt(M.PB)}`,`∠OAP = ${fmt(M.angleA)}°; ∠OBP = ${fmt(M.angleB)}°`,`OP = ${fmt(M.OP)}; радиус = ${fmt(M.radius)}`,'Касательных из P: 2']};}
  };
  defs.circlePair={
    title:'Две окружности',values:{mode:'free',radius:4,other:2,distance:7,position:.5},
    controls:[range('other','Радиус второй окружности',1,5.5,.1),range('distance','Расстояние между центрами',0,11,.1),range('position','Сдвинуть центры, сохраняя пересечение',.2,.8,.05)],
    controlsFor(p){return[range('other','Радиус второй окружности',p.mode==='intersecting'?1.5:1,p.mode==='greater'?4:p.mode==='free'?3:5.5,.1),p.mode==='intersecting'?defs.circlePair.controls[2]:defs.circlePair.controls[1]];},
    normalize(p){p={...p};p.radius=p.mode==='greater'?5:4;norm(p,'other',p.mode==='intersecting'?1.5:1,p.mode==='greater'?4:p.mode==='free'?3:5.5,2);return p;},
    sample(p){const r=p.radius,q=p.other,d=p.mode==='intersecting'?Math.abs(r-q)+p.position*(r+q-Math.abs(r-q)):p.distance,O1=[-d/2,0],O2=[d/2,0],P={O1,O2},M={radius:r,other:q,distance:d,intersections:0};const low=Math.abs(r-q),high=r+q,eps=1e-8;if(d>eps&&d>=low-eps&&d<=high+eps){const x=(r*r-q*q+d*d)/(2*d),y=Math.sqrt(Math.max(0,r*r-x*x));P.P=[O1[0]+x,y];M.intersections=Math.abs(d-low)<eps||Math.abs(d-high)<eps?1:2;if(M.intersections===2)P.Q=[O1[0]+x,-y];M.O1P=hypot(O1,P.P);M.O2P=hypot(O2,P.P);}return{points:P,metrics:M};},
    render(s){const P=s.points,M=s.metrics,T=fit([...bounds(P.O1,M.radius),...bounds(P.O2,M.other)],{x:55,y:45,w:450,h:240});let body=circleAt(T,P.O1,M.radius,BLUE)+circleAt(T,P.O2,M.other,GREEN)+line(T(P.O1),T(P.O2),INK,'5 5')+origin(T,P.O1,'O₁',BLUE)+origin(T,P.O2,'O₂',GREEN),readout=[`Радиусы: ${fmt(M.radius)} и ${fmt(M.other)}`,`Между центрами: ${fmt(M.distance)}`,`Общих точек: ${M.intersections}`];if(P.P){body+=line(T(P.O1),T(P.P),BLUE)+line(T(P.O2),T(P.P),GREEN)+dot(T(P.P))+text(T(P.P)[0],T(P.P)[1]-22,'P');readout.push(`O₁P = ${fmt(M.O1P)}; O₂P = ${fmt(M.O2P)}`);}if(P.Q)body+=dot(T(P.Q))+text(T(P.Q)[0],T(P.Q)[1]+22,'Q');return{body,readout};}
  };
  defs.circleCenter={
    title:'Найди центр окружности',values:{x:1.2,y:.5},controls:[range('x','Сдвинуть P вправо или влево',-2,2,.1),range('y','Сдвинуть P вверх или вниз',-2,2,.1)],
    sample(p){const P={O:[0,0],P:[p.x,p.y],A:[4,0],B:[0,4],C:[-4,0],D:[0,-4]},M={radius:4};for(const n of ['A','B','C','D'])M['P'+n]=hypot(P.P,P[n]);M.spread=Math.max(M.PA,M.PB,M.PC,M.PD)-Math.min(M.PA,M.PB,M.PC,M.PD);return{points:P,metrics:M};},
    render(s){const P=s.points,M=s.metrics,T=fit(bounds(P.O,4));let body=circleAt(T,P.O,4,INK,LIGHT)+labelPoints(P,['A','B','C','D'],T);for(const n of ['A','B','C','D'])body+=line(T(P.P),T(P[n]),BLUE,'5 5');body+=dot(T(P.P),GREEN)+text(T(P.P)[0]+17,T(P.P)[1]-16,'P',GREEN);return{body,readout:[`PA = ${fmt(M.PA)}; PC = ${fmt(M.PC)}`,`PB = ${fmt(M.PB)}; PD = ${fmt(M.PD)}`,`Разница наибольшего и наименьшего расстояния: ${fmt(M.spread)}`]};}
  };
  defs.radiusChord={
    title:'Радиус пересекает хорду',values:{offset:2,position:.4},controls:[range('offset','Сдвинуть хорду',1,4,.1),range('position','Передвинуть точку M вдоль хорды',-.8,.8,.05)],
    sample(p){const r=5,h=Math.sqrt(r*r-p.offset*p.offset),O=[0,0],A=[-h,p.offset],B=[h,p.offset],M=[p.position*h,p.offset],T=mul(M,r/hypot(O,M));return{points:{O,A,B,M,T},metrics:{radius:r,AM:hypot(A,M),MB:hypot(M,B),OT:hypot(O,T),angle:angleAt(O,M,A)}};},
    render(s){const P=s.points,M=s.metrics,T=fit(bounds(P.O,5));return{body:circleAt(T,P.O,5,INK,LIGHT)+line(T(P.A),T(P.B),BLUE)+line(T(P.O),T(P.T),GREEN)+labelPoints(P,['A','B','T'],T)+origin(T,P.O)+dot(T(P.M),GREEN)+text(T(P.M)[0]+(P.M[0]>=0?17:-17),T(P.M)[1]+20,'M',GREEN),readout:[`AM = ${fmt(M.AM)}; MB = ${fmt(M.MB)}`,`Радиус OT = ${fmt(M.OT)}`,`Угол OMA = ${fmt(M.angle)}°`]};}
  };
  defs.equalCircleChords={
    title:'Две равные хорды',values:{offset:2,angle:95},controls:[range('offset','Изменить длину обеих хорд',.5,4.5,.1),range('angle','Повернуть вторую хорду',40,150,1,'°')],
    sample(p){const h=Math.sqrt(25-p.offset*p.offset),O=[0,0],A=[-h,p.offset],B=[h,p.offset],M=[0,p.offset],C=rotate(A,p.angle),D=rotate(B,p.angle),N=rotate(M,p.angle);return{points:{O,A,B,C,D,M,N},metrics:{radius:5,AB:hypot(A,B),CD:hypot(C,D),OM:hypot(O,M),ON:hypot(O,N),angleM:angleAt(O,M,A),angleN:angleAt(O,N,C)}};},
    render(s){const P=s.points,M=s.metrics,T=fit(bounds(P.O,5));return{body:circleAt(T,P.O,5,INK,LIGHT)+line(T(P.A),T(P.B),BLUE)+line(T(P.C),T(P.D),GREEN)+line(T(P.O),T(P.M),BLUE,'5 5')+line(T(P.O),T(P.N),GREEN,'5 5')+rightMark(T(P.O),T(P.M),T(P.A))+rightMark(T(P.O),T(P.N),T(P.C))+labelPoints(P,['A','B','C','D'],T)+origin(T,P.O)+dot(T(P.M),BLUE)+text(T(P.M)[0]+15,T(P.M)[1]+18,'M',BLUE)+dot(T(P.N),GREEN)+text(T(P.N)[0]-15,T(P.N)[1]+18,'N',GREEN),readout:[`AB = ${fmt(M.AB)}; CD = ${fmt(M.CD)}`,`Расстояния до хорд: OM = ${fmt(M.OM)}; ON = ${fmt(M.ON)}`,`∠OMA = ${fmt(M.angleM)}°; ∠ONC = ${fmt(M.angleN)}°`]};}
  };
  function quadSample(p,rhombus){
    const a=rhombus?p.side:p.width,b=rhombus?p.side:p.height,angle=rhombus?p.angle:90,A=[0,0],B=[a,0],D=polar(b,angle),C=add(B,D),P={A,B,C,D},M={AB:hypot(A,B),BC:hypot(B,C),CD:hypot(C,D),DA:hypot(D,A),angle:angleAt(B,A,D)};
    P.O=rhombus&&p.mode==='circumcircle'?[a/2,a*(1-Math.cos(angle*RAD))/(2*Math.sin(angle*RAD))]:mid(A,C);
    const O=P.O;for(const [name,u,v]of [['E',A,B],['F',B,C],['G',C,D],['H',D,A]])P[name]=foot(O,u,v);
    for(const n of ['A','B','C','D','E','F','G','H'])M['O'+n]=hypot(O,P[n]);
    M.radius=p.mode==='circumcircle'?M.OA:Math.min(M.OE,M.OF,M.OG,M.OH);M.oppositeAngleSum=angleAt(B,A,D)+angleAt(B,C,D);return{points:P,metrics:M};
  }
  function quadRender(s){const P=s.points,M=s.metrics,p=s.values,T=fit([...Object.values(P),...bounds(P.O,M.radius)],{x:65,y:35,w:430,h:255});let body=poly(['A','B','C','D'].map(n=>T(P[n])))+circleAt(T,P.O,M.radius,BLUE)+labelPoints(P,['A','B','C','D'],T)+origin(T,P.O),readout=[];
    if(p.mode==='circumcircle'){for(const n of ['A','B','C','D'])body+=line(T(P.O),T(P[n]),BLUE,'5 5');readout=[`OA = ${fmt(M.OA)}; OB = ${fmt(M.OB)}`,`OC = ${fmt(M.OC)}; OD = ${fmt(M.OD)}`,`Радиус окружности = ${fmt(M.radius)}`,`Сумма противоположных углов A и C: ${fmt(M.oppositeAngleSum)}°`];}
    else{for(const [n,a]of [['E','A'],['F','B'],['G','C'],['H','D']])body+=line(T(P.O),T(P[n]),GREEN,'5 5')+rightMark(T(P.O),T(P[n]),T(P[a]))+dot(T(P[n]),GREEN);readout=[`Расстояния от O до AB и CD: ${fmt(M.OE)}; ${fmt(M.OG)}`,`Расстояния от O до BC и AD: ${fmt(M.OF)}; ${fmt(M.OH)}`,`Радиус круга = ${fmt(M.radius)}`,`Стороны AB = ${fmt(M.AB)}; BC = ${fmt(M.BC)}`,`Суммы противоположных сторон: ${fmt(M.AB+M.CD)} и ${fmt(M.BC+M.DA)}`];}
    return{body,readout};
  }
  defs.circleRectangle={title:'Прямоугольник и окружность',values:{width:6,height:3,mode:'incircle'},controls:[range('width','Сторона AB',2,8,.1),range('height','Сторона AD',2,5,.1)],sample:p=>quadSample(p,false),render:quadRender};
  defs.circleRhombus={title:'Ромб и окружность',values:{side:4,angle:65,mode:'incircle'},controls:[range('side','Сторона ромба',2,5,.1),range('angle','Изменить угол ромба',40,140,1,'°')],sample:p=>quadSample(p,true),render:quadRender};
  defs.circleMeasure={
    title:'Размер круга и окружности',values:{radius:3,mode:'area'},controls:[range('radius','Изменить радиус',1,4,.1)],
    sample(p){return{points:{O:[0,0],A:[p.radius,0],U:[0,0],V:[2*Math.PI*p.radius,0]},metrics:{radius:p.radius,diameter:2*p.radius,length:2*Math.PI*p.radius,area:Math.PI*p.radius*p.radius,comparison:2*Math.PI*p.radius,unitArea:Math.PI,areaRatio:p.radius*p.radius}};},
    render(s){const M=s.metrics,p=s.values;let body='',readout=[];if(p.mode==='area'){const u=27,O=[355,155],U=[120,155];body=circle(U,u,GREEN,LIGHT)+circle(O,M.radius*u,BLUE,LIGHT)+line(U,[U[0]+u,U[1]],GREEN)+line(O,[O[0]+M.radius*u,O[1]],BLUE)+text(120,285,'Радиус 1',GREEN)+text(355,285,'Радиус r',BLUE);readout=[`r = ${fmt(M.radius)}`,`Площадь круга: ${fmt(M.area)}`,`Значение 2πr: ${fmt(M.comparison)}`,`Площадь больше единичного круга в ${fmt(M.areaRatio)} раза`];}else{const u=14,O=[280,120];body=circle(O,M.radius*u,BLUE)+line([O[0]-M.radius*u,O[1]],[O[0]+M.radius*u,O[1]],GREEN)+text(280,205,'Диаметр',GREEN)+line([65,275],[65+M.length*u,275],BLUE)+dot([65,275],BLUE)+dot([65+M.length*u,275],BLUE)+text(280,310,'Длина окружности на прямой',BLUE);readout=[`r = ${fmt(M.radius)}; диаметр = ${fmt(M.diameter)}`,`Длина окружности: ${fmt(M.length)}`,`Длина / диаметр: ${fmt(M.length/M.diameter)}`,`2πr = ${fmt(M.comparison)}`];}return{body,readout};}
  };
  return defs;
});

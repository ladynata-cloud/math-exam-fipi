/* Circle experiments: movable objects are constructed from the stated premises. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory;
  else root.Task19CircleModels=factory;
})(typeof window==='object'?window:globalThis,function(kit){
  'use strict';
  const {RAD,BLUE,GREEN,INK,LIGHT,clamp,finite,hypot,mid,fmt,angleAt,line,text,dot,poly,fit,labelPoints,tick,rightMark,linked}=kit;
  const AMBER='#a76616',PURPLE='#79549c';
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
  const measurement=(value,color=INK,group='')=>({text:value,color,group});
  const near=(a,b)=>Math.abs(a-b)<1e-7*Math.max(1,Math.abs(a),Math.abs(b));
  // Equal marks follow the actual geometry, never rounded display values.
  // Each segment has its own focus target and matching measurement row.
  function segments(P,T,items,firstMark=0){
    const groups=[];
    const rows=items.map(([a,b,color=BLUE,dash=''])=>{
      const length=hypot(P[a],P[b]);let group=groups.find(g=>near(g.length,length));
      if(!group){group={length,rows:[]};groups.push(group);}
      const row={a,b,color,dash,group};group.rows.push(row);return row;
    });
    let mark=firstMark;groups.forEach(g=>{g.mark=g.rows.length>1?++mark:0;});
    return rows.map(({a,b,color,dash,group})=>linked(a+b,line(T(P[a]),T(P[b]),color,dash)+(group.mark?tick(T(P[a]),T(P[b]),group.mark,color):''),`Отрезок ${a+b}`)).join('');
  }
  const lengthRow=(P,a,b,color=BLUE)=>measurement(`${a+b} = ${fmt(hypot(P[a],P[b]))}`,color,a+b);
  const foot=(p,a,b)=>{const v=[b[0]-a[0],b[1]-a[1]],t=((p[0]-a[0])*v[0]+(p[1]-a[1])*v[1])/(v[0]*v[0]+v[1]*v[1]);return add(a,mul(v,t));};
  const defs={};
  defs.circleRadii={
    title:'Радиусы и диаметры',values:{radius:4,angle:55,mode:'radii'},
    controls:[range('angle','Повернуть отрезок',20,160,1,'°')],
    normalize(p){norm(p,'radius',2,6,4);return p;},
    sample(p){const O=[0,0],A=polar(p.radius,p.angle),B=p.mode==='radii'?polar(p.radius,p.angle+115):mul(A,-1),P={O,A,B};if(p.mode==='twoDiameters'){P.C=[-p.radius,0];P.D=[p.radius,0];}return{points:P,metrics:{radius:p.radius,OA:hypot(O,A),OB:hypot(O,B),AB:hypot(A,B),...(P.C?{CD:hypot(P.C,P.D)}:{})}};},
    render(s){
      const P=s.points,M=s.metrics,p=s.values,T=fit(bounds(P.O,p.radius)),names=['A','B'];
      const items=[['O','A',BLUE],['O','B',p.mode==='radii'?GREEN:BLUE]];
      if(P.C){items.push(['O','C',GREEN],['O','D',GREEN]);names.push('C','D');}
      let body=circleAt(T,P.O,p.radius,INK,LIGHT);
      body+=p.mode==='radii'?segments(P,T,items):linked('AB',segments(P,T,items.slice(0,2)),'Диаметр AB');
      if(P.C)body+=linked('CD',segments(P,T,items.slice(2)),'Диаметр CD');
      body+=labelPoints(P,names,T)+origin(T,P.O);
      return{body,readout:[...items.map(([a,b,c])=>lengthRow(P,a,b,c)),...(p.mode!=='radii'?[measurement(`Диаметр AB = ${fmt(M.AB)}`,BLUE,'AB')]:[]),...(P.C?[measurement(`Диаметр CD = ${fmt(M.CD)}`,GREEN,'CD'),'Общая точка диаметров: O']:[])]};
    }
  };
  defs.circleLine={
    title:'Прямая и окружность',values:{radius:4,angle:40,offset:.4,mode:'tangent'},
    controls:[range('angle','Повернуть прямую',0,160,1,'°'),range('offset','Сдвинуть секущую',-.85,.85,.05)],
    normalize(p){norm(p,'radius',2,6,4);return p;},
    controlsFor(p){return defs.circleLine.controls.filter(c=>c[0]!=='offset'||p.mode==='secant');},
    sample(p){const r=p.radius,n=polar(1,p.angle),v=polar(1,p.angle+90),O=[0,0],M=mul(n,r*(p.mode==='secant'?p.offset:1)),U=add(M,mul(v,-1.5*r)),V=add(M,mul(v,1.5*r)),P={O,M,U,V},metrics={radius:r,distance:hypot(O,M),intersections:p.mode==='secant'?2:1};if(p.mode==='secant'){const h=Math.sqrt(r*r-metrics.distance**2);P.A=add(M,mul(v,-h));P.B=add(M,mul(v,h));metrics.AB=hypot(P.A,P.B);}else{P.T=M;metrics.angle=angleAt(O,M,V);}return{points:P,metrics};},
    render(s){
      const P=s.points,M=s.metrics,T=fit([...bounds(P.O,M.radius),P.U,P.V],{x:65,y:45,w:430,h:240});
      let body=circleAt(T,P.O,M.radius,INK,LIGHT)+linked('line',line(T(P.U),T(P.V),BLUE),'Прямая')+origin(T,P.O,!P.T&&near(M.distance,0)?'O = M':'O'),readout=[`Общих точек: ${M.intersections}`];
      if(P.T){body+=segments(P,T,[['O','T',GREEN]])+rightMark(T(P.O),T(P.T),T(P.V))+dot(T(P.T),BLUE)+text(T(P.T)[0]+17,T(P.T)[1]+17,'T',BLUE);readout.push(lengthRow(P,'O','T',GREEN),measurement(`Угол между OT и прямой: ${fmt(M.angle)}°`,GREEN,'OT'));}
      else{body+=labelPoints(P,['A','B'],T)+segments(P,T,[['O','M',GREEN,'5 5'],['A','B',BLUE]])+rightMark(T(P.O),T(P.M),T(P.V));if(!near(M.distance,0))body+=dot(T(P.M),GREEN)+text(T(P.M)[0]+15,T(P.M)[1]+18,'M',GREEN);readout.push(lengthRow(P,'A','B',BLUE),lengthRow(P,'O','M',GREEN));}
      return{body,readout};
    }
  };
  defs.circleTangents={
    title:'Две касательные из одной точки',values:{radius:3,distance:2,angle:0},
    controls:[range('distance','Расстояние OP (в радиусах)',1.2,2.8,.05),range('angle','Повернуть точку P',-35,35,1,'°')],
    normalize(p){norm(p,'radius',2,5,3);return p;},
    sample(p){const r=p.radius,d=r*p.distance,delta=Math.acos(r/d)/RAD,O=[0,0],P=polar(d,p.angle),A=polar(r,p.angle+delta),B=polar(r,p.angle-delta);return{points:{O,P,A,B},metrics:{radius:r,OP:hypot(O,P),PA:hypot(P,A),PB:hypot(P,B),angleA:angleAt(O,A,P),angleB:angleAt(O,B,P),tangents:2}};},
    render(s){const P=s.points,M=s.metrics,T=fit([...bounds(P.O,M.radius),P.P],{x:60,y:40,w:440,h:245}),items=[['P','A',BLUE],['P','B',GREEN],['O','A',AMBER,'5 5'],['O','B',AMBER,'5 5']];return{body:circleAt(T,P.O,M.radius,INK,LIGHT)+segments(P,T,items)+rightMark(T(P.O),T(P.A),T(P.P),BLUE)+rightMark(T(P.O),T(P.B),T(P.P),GREEN)+labelPoints(P,['A','B','P'],T)+origin(T,P.O),readout:[...items.map(([a,b,c])=>lengthRow(P,a,b,c)),measurement(`∠OAP = ${fmt(M.angleA)}°`,BLUE,'PA'),measurement(`∠OBP = ${fmt(M.angleB)}°`,GREEN,'PB'),'Касательных из P: 2']};}
  };
  defs.circlePair={
    title:'Две окружности',values:{mode:'free',radius:4,other:2,distance:7,position:.5},
    controls:[range('other','Радиус второй окружности',1,5.5,.1),range('distance','Расстояние между центрами',0,11,.1),range('position','Сдвинуть центры, сохраняя пересечение',.2,.8,.05)],
    controlsFor(p){return[range('other','Радиус второй окружности',p.mode==='intersecting'?1.5:1,p.mode==='greater'?4:p.mode==='free'?3:5.5,.1),p.mode==='intersecting'?defs.circlePair.controls[2]:defs.circlePair.controls[1]];},
    normalize(p){p={...p};p.radius=p.mode==='greater'?5:4;norm(p,'other',p.mode==='intersecting'?1.5:1,p.mode==='greater'?4:p.mode==='free'?3:5.5,2);return p;},
    sample(p){const r=p.radius,q=p.other,d=p.mode==='intersecting'?Math.abs(r-q)+p.position*(r+q-Math.abs(r-q)):p.distance,O1=[-d/2,0],O2=[d/2,0],P={O1,O2},M={radius:r,other:q,distance:d,intersections:0};const low=Math.abs(r-q),high=r+q,eps=1e-8;if(d>eps&&d>=low-eps&&d<=high+eps){const x=(r*r-q*q+d*d)/(2*d),y=Math.sqrt(Math.max(0,r*r-x*x));P.P=[O1[0]+x,y];M.intersections=Math.abs(d-low)<eps||Math.abs(d-high)<eps?1:2;if(M.intersections===2)P.Q=[O1[0]+x,-y];M.O1P=hypot(O1,P.P);M.O2P=hypot(O2,P.P);}return{points:P,metrics:M};},
    render(s){
      const P=s.points,M=s.metrics,T=fit([...bounds(P.O1,M.radius),...bounds(P.O2,M.other)],{x:55,y:45,w:450,h:240});
      let body=linked('circle1',circleAt(T,P.O1,M.radius,BLUE),'Первая окружность')+linked('circle2',circleAt(T,P.O2,M.other,GREEN),'Вторая окружность')+line(T(P.O1),T(P.O2),INK,'5 5')+origin(T,P.O1,'O₁',BLUE)+origin(T,P.O2,'O₂',GREEN),readout=[measurement(`Радиус первой окружности: ${fmt(M.radius)}`,BLUE,'circle1'),measurement(`Радиус второй окружности: ${fmt(M.other)}`,GREEN,'circle2'),`Между центрами: ${fmt(M.distance)}`,`Общих точек: ${M.intersections}`];
      if(P.P){const items=[['O1','P',BLUE],['O2','P',GREEN]];if(P.Q)items.push(['O1','Q',BLUE],['O2','Q',GREEN]);body+=segments(P,T,items)+dot(T(P.P))+text(T(P.P)[0],T(P.P)[1]-22,'P');readout.push(...items.map(([a,b,c])=>measurement(`${a==='O1'?'O₁':'O₂'}${b} = ${fmt(hypot(P[a],P[b]))}`,c,a+b)));}
      if(P.Q)body+=dot(T(P.Q))+text(T(P.Q)[0],T(P.Q)[1]+22,'Q');return{body,readout};
    }
  };
  defs.circleCenter={
    title:'Найди центр окружности',values:{x:1.2,y:.5},controls:[range('x','Сдвинуть P вправо или влево',-2,2,.1),range('y','Сдвинуть P вверх или вниз',-2,2,.1)],
    sample(p){const P={O:[0,0],P:[p.x,p.y],A:[4,0],B:[0,4],C:[-4,0],D:[0,-4]},M={radius:4};for(const n of ['A','B','C','D'])M['P'+n]=hypot(P.P,P[n]);M.spread=Math.max(M.PA,M.PB,M.PC,M.PD)-Math.min(M.PA,M.PB,M.PC,M.PD);return{points:P,metrics:M};},
    render(s){const P=s.points,M=s.metrics,T=fit(bounds(P.O,4)),items=[['P','A',BLUE],['P','B',GREEN],['P','C',AMBER],['P','D',PURPLE]];const body=circleAt(T,P.O,4,INK,LIGHT)+segments(P,T,items)+labelPoints(P,['A','B','C','D'],T)+dot(T(P.P),GREEN)+text(T(P.P)[0]+17,T(P.P)[1]-16,'P',GREEN);return{body,readout:[...items.map(([a,b,c])=>lengthRow(P,a,b,c)),`Разница наибольшего и наименьшего расстояния: ${fmt(M.spread)}`]};}
  };
  defs.radiusChord={
    title:'Радиус пересекает хорду',values:{offset:2,position:.4},controls:[range('offset','Сдвинуть хорду',1,4,.1),range('position','Передвинуть точку M вдоль хорды',-.8,.8,.05)],
    sample(p){const r=5,h=Math.sqrt(r*r-p.offset*p.offset),O=[0,0],A=[-h,p.offset],B=[h,p.offset],M=[p.position*h,p.offset],T=mul(M,r/hypot(O,M));return{points:{O,A,B,M,T},metrics:{radius:r,AM:hypot(A,M),MB:hypot(M,B),OT:hypot(O,T),angle:angleAt(O,M,A)}};},
    render(s){const P=s.points,M=s.metrics,T=fit(bounds(P.O,5)),items=[['A','M',BLUE],['M','B',GREEN],['O','T',AMBER]];return{body:circleAt(T,P.O,5,INK,LIGHT)+segments(P,T,items)+(near(M.angle,90)?rightMark(T(P.O),T(P.M),T(P.A),AMBER):'')+labelPoints(P,['A','B','T'],T)+origin(T,P.O)+dot(T(P.M),AMBER)+text(T(P.M)[0]+(P.M[0]>=0?17:-17),T(P.M)[1]+20,'M',AMBER),readout:[...items.map(([a,b,c])=>lengthRow(P,a,b,c)),measurement(`Угол OMA = ${fmt(M.angle)}°`,AMBER,'OT')]};}
  };
  defs.equalCircleChords={
    title:'Две равные хорды',values:{offset:2,angle:95},controls:[range('offset','Изменить длину обеих хорд',.5,4.5,.1),range('angle','Повернуть вторую хорду',40,150,1,'°')],
    sample(p){const h=Math.sqrt(25-p.offset*p.offset),O=[0,0],A=[-h,p.offset],B=[h,p.offset],M=[0,p.offset],C=rotate(A,p.angle),D=rotate(B,p.angle),N=rotate(M,p.angle);return{points:{O,A,B,C,D,M,N},metrics:{radius:5,AB:hypot(A,B),CD:hypot(C,D),OM:hypot(O,M),ON:hypot(O,N),angleM:angleAt(O,M,A),angleN:angleAt(O,N,C)}};},
    render(s){const P=s.points,M=s.metrics,T=fit(bounds(P.O,5)),items=[['A','B',BLUE],['C','D',GREEN],['O','M',BLUE,'5 5'],['O','N',GREEN,'5 5']];return{body:circleAt(T,P.O,5,INK,LIGHT)+segments(P,T,items)+rightMark(T(P.O),T(P.M),T(P.A),BLUE)+rightMark(T(P.O),T(P.N),T(P.C),GREEN)+labelPoints(P,['A','B','C','D'],T)+origin(T,P.O)+dot(T(P.M),BLUE)+text(T(P.M)[0]+15,T(P.M)[1]+18,'M',BLUE)+dot(T(P.N),GREEN)+text(T(P.N)[0]-15,T(P.N)[1]+18,'N',GREEN),readout:[...items.map(([a,b,c])=>lengthRow(P,a,b,c)),measurement(`∠OMA = ${fmt(M.angleM)}°`,BLUE,'OM'),measurement(`∠ONC = ${fmt(M.angleN)}°`,GREEN,'ON')]};}
  };
  function quadSample(p,rhombus){
    const a=rhombus?p.side:p.width,b=rhombus?p.side:p.height,angle=rhombus?p.angle:90,A=[0,0],B=[a,0],D=polar(b,angle),C=add(B,D),P={A,B,C,D},M={AB:hypot(A,B),BC:hypot(B,C),CD:hypot(C,D),DA:hypot(D,A),angle:angleAt(B,A,D)};
    P.O=rhombus&&p.mode==='circumcircle'?[a/2,a*(1-Math.cos(angle*RAD))/(2*Math.sin(angle*RAD))]:mid(A,C);
    const O=P.O;for(const [name,u,v]of [['E',A,B],['F',B,C],['G',C,D],['H',D,A]])P[name]=foot(O,u,v);
    for(const n of ['A','B','C','D','E','F','G','H'])M['O'+n]=hypot(O,P[n]);
    M.radius=p.mode==='circumcircle'?M.OA:Math.min(M.OE,M.OF,M.OG,M.OH);M.oppositeAngleSum=angleAt(B,A,D)+angleAt(B,C,D);return{points:P,metrics:M};
  }
  function quadRender(s){
    const P=s.points,M=s.metrics,p=s.values,T=fit([...Object.values(P),...bounds(P.O,M.radius)],{x:65,y:35,w:430,h:255}),names=['A','B','C','D'],colors=[BLUE,GREEN,AMBER,PURPLE];
    const sides=[['A','B',INK],['B','C',INK],['C','D',INK],['D','A',INK]];
    let body=poly(names.map(n=>T(P[n])))+segments(P,T,sides)+circleAt(T,P.O,M.radius,BLUE),readout=[];
    names.forEach((n,i)=>{const prev=names[(i+3)%4],next=names[(i+1)%4];if(near(angleAt(P[prev],P[n],P[next]),90))body+=rightMark(T(P[prev]),T(P[n]),T(P[next]),INK);});
    if(p.mode==='circumcircle'){
      const items=names.map((n,i)=>['O',n,colors[i],'5 5']);body+=segments(P,T,items,2);
      readout=[...items.map(([a,b,c])=>lengthRow(P,a,b,c)),`Радиус окружности = ${fmt(M.radius)}`,`Сумма противоположных углов A и C: ${fmt(M.oppositeAngleSum)}°`];
    }else{
      const feet=['E','F','G','H'],items=feet.map((n,i)=>['O',n,colors[i],'5 5']);body+=segments(P,T,items,2);
      feet.forEach((n,i)=>{const q=T(P[n]),o=T(P.O),dx=q[0]-o[0],dy=q[1]-o[1],d=Math.hypot(dx,dy)||1;body+=rightMark(T(P.O),q,T(P[names[i]]),colors[i])+dot(q,colors[i])+text(q[0]+dx/d*19,q[1]+dy/d*19,n,colors[i]);});
      readout=[...items.map(([a,b,c])=>lengthRow(P,a,b,c)),`Радиус окружности = ${fmt(M.radius)}`,...sides.map(([a,b,c])=>lengthRow(P,a,b,c))];
    }
    body+=labelPoints(P,names,T)+origin(T,P.O);return{body,readout};
  }
  defs.circleRectangle={title:'Прямоугольник и окружность',values:{width:6,height:3,mode:'incircle'},controls:[range('width','Сторона AB',2,8,.1),range('height','Сторона AD',2,5,.1)],sample:p=>quadSample(p,false),render:quadRender};
  defs.circleRhombus={title:'Ромб и окружность',values:{side:4,angle:65,mode:'incircle'},controls:[range('angle','Изменить угол ромба',40,140,1,'°')],normalize(p){norm(p,'side',2,5,4);return p;},sample:p=>quadSample(p,true),render:quadRender};
  defs.circleMeasure={
    title:'Размер круга и окружности',values:{radius:3,mode:'area',unroll:1},controls:[range('radius','Изменить радиус',1,4,.1)],
    controlsFor(p){return p.mode==='length'?[...defs.circleMeasure.controls,range('unroll','Распрями синюю окружность',0,1,.05)]:defs.circleMeasure.controls;},
    normalize(p){norm(p,'unroll',0,1,1);return p;},
    sample(p){return{points:{O:[0,0],A:[p.radius,0],U:[0,0],V:[2*Math.PI*p.radius,0]},metrics:{radius:p.radius,diameter:2*p.radius,length:2*Math.PI*p.radius,area:Math.PI*p.radius*p.radius,comparison:2*Math.PI*p.radius,unitArea:Math.PI,areaRatio:p.radius*p.radius}};},
    render(s){
      const M=s.metrics,p=s.values;let body='',readout=[];
      if(p.mode==='area'){
        const u=27,O=[355,155],U=[120,155];body=circle(U,u,GREEN,LIGHT)+circle(O,M.radius*u,BLUE,LIGHT)+line(U,[U[0]+u,U[1]],GREEN)+line(O,[O[0]+M.radius*u,O[1]],BLUE)+text(120,285,'Радиус 1',GREEN)+text(355,285,'Радиус r',BLUE);readout=[`r = ${fmt(M.radius)}`,`Площадь круга: ${fmt(M.area)}`,`Значение 2πr: ${fmt(M.comparison)}`,`Площадь больше единичного круга в ${fmt(M.areaRatio)} раза`];
      }else{
        const u=14,O=[280,85],length=M.length*u,theta=2*Math.PI*(1-p.unroll),y=282;
        let curve;
        if(theta<1e-7)curve=line([280-length/2,y],[280+length/2,y],BLUE)+dot([280-length/2,y],BLUE)+dot([280+length/2,y],BLUE);
        else{
          // An arc with radius length / theta has exactly the original circumference's length.
          const r=length/theta,half=r*Math.sin(theta/2),start=[280-half,y],end=[280+half,y];
          const d=near(p.unroll,0)?`M 280 ${y} A ${r} ${r} 0 1 1 280 ${y-2*r} A ${r} ${r} 0 1 1 280 ${y}`:`M ${start.join(' ')} A ${r} ${r} 0 ${theta>Math.PI?1:0} 1 ${end.join(' ')}`;
          curve=`<path d="${d}" fill="none" stroke="${BLUE}" stroke-width="3"/>`+dot(start,BLUE)+dot(end,BLUE);
        }
        body=linked('length',circle(O,M.radius*u,BLUE)+curve,'Синяя окружность и её распрямлённая обводка')+linked('diameter',line([O[0]-M.radius*u,O[1]],[O[0]+M.radius*u,O[1]],GREEN),'Диаметр')+text(280,315,near(p.unroll,1)?'Синюю окружность распрямили в отрезок':'Распрями синюю окружность движком',BLUE);
        readout=[`Радиус = ${fmt(M.radius)}`,measurement(`Диаметр = ${fmt(M.diameter)}`,GREEN,'diameter'),measurement(`Длина синей обводки = ${fmt(M.length)}`,BLUE,'length'),`Длина окружности / диаметр = ${fmt(M.length/M.diameter)}`,`2πr = ${fmt(M.comparison)}`];
      }
      return{body,readout};
    }
  };
  return defs;
});

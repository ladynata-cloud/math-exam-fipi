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
  // The source-constrained families below are additive. Historical modes above
  // retain their controls, normalization and geometry byte for byte.
  const boundedNumber=(value,lo,hi,fallback)=>clamp(finite(value,fallback),lo,hi);
  const rotatedPoints=(points,degrees)=>Object.fromEntries(Object.entries(points).map(([name,p])=>[name,rotate(p,degrees)]));
  const neutralCenter=(T,p,name,color,above=false)=>dot(T(p),color)+text(T(p)[0]+(above?16:-16),T(p)[1]+(above?-22:22),name,color);
  const numberRow=(name,value,color=INK,group='')=>measurement(`${name} = ${fmt(value)}`,color,group);

  defs.circleDiameterArea={
    title:'Круг и квадрат',values:{radius:3},controls:[range('radius','Измени радиус',1,4,.1)],
    sample(p){const r=p.radius;return{points:{O:[0,0],A:[-r,-r],B:[r,-r],C:[r,r],D:[-r,r],E:[-r,0],F:[r,0]},metrics:{radius:r,diameter:2*r,circleArea:Math.PI*r*r,squareArea:4*r*r}};},
    render(s){const P=s.points,M=s.metrics,T=fit([[-4.8,-4.8],[4.8,4.8]]);return{body:poly(['A','B','C','D'].map(n=>T(P[n])))+circleAt(T,P.O,M.radius,BLUE)+linked('diameter',line(T(P.E),T(P.F),GREEN),'Диаметр EF')+labelPoints(P,['A','B','C','D','E','F'],T)+origin(T,P.O),readout:[numberRow('Диаметр EF',M.diameter,GREEN,'diameter'),numberRow('Площадь круга',M.circleArea,BLUE),numberRow('Площадь квадрата',M.squareArea),numberRow('EF²',M.diameter*M.diameter,GREEN,'diameter')]};}
  };

  defs.circlePointPosition={
    title:'Точка и окружность',values:{mode:'inside',radius:4,ratio:.6,angle:45,givenDistance:5},
    controls:[range('angle','Поверни точку вокруг O',15,165,1,'°')],
    controlsFor(p){const c=[...defs.circlePointPosition.controls];if(p.mode==='inside')c.push(range('ratio','Передвинь точку внутри круга',.1,.9,.05));if(p.mode==='outside')c.push(range('ratio','Передвинь точку вне круга',1.1,2,.05));return c;},
    normalize(p){p={...p};p.mode=['inside','outside','on','fixed'].includes(p.mode)?p.mode:'inside';p.radius=boundedNumber(p.radius,1,10,4);p.givenDistance=boundedNumber(p.givenDistance,.1,15,5);if(p.mode==='inside')p.ratio=boundedNumber(p.ratio,.1,.9,.6);if(p.mode==='outside')p.ratio=boundedNumber(p.ratio,1.1,2,1.4);return p;},
    sample(p){const d=p.mode==='fixed'?p.givenDistance:p.mode==='on'?p.radius:p.radius*p.ratio;return{points:{O:[0,0],P:polar(d,p.angle),R:polar(p.radius,-35)},metrics:{radius:p.radius,distance:d}};},
    render(s){const P=s.points,M=s.metrics,p=s.values,frame=p.mode==='outside'?p.radius*2.1:p.mode==='fixed'?Math.max(p.radius*1.25,p.givenDistance*1.1):p.radius*1.25,T=fit(bounds(P.O,frame),{x:70,y:40,w:420,h:245});return{body:circleAt(T,P.O,M.radius,INK,LIGHT)+segments(P,T,[['O','P',BLUE],['O','R',GREEN,'5 5']])+labelPoints(P,['P','R'],T)+origin(T,P.O),readout:[lengthRow(P,'O','P',BLUE),lengthRow(P,'O','R',GREEN),numberRow('Радиус',M.radius,GREEN,'OR')]};}
  };

  defs.circlePairConstrained={
    title:'Две окружности и расстояние между центрами',values:{mode:'fixed',r1:3,r2:2,distance:4,rotation:0,other:2,clearance:1,ratio:.8},
    controls:[range('rotation','Поверни расположение окружностей',-60,60,1,'°')],
    controlsFor(p){return[...defs.circlePairConstrained.controls,...(p.mode==='tangent'?[range('other','Измени второй радиус, сохраняя касание',1.5,4,.1)]:p.mode==='greaterDiameters'?[range('clearance','Раздвинь центры',.5,4,.1)]:p.mode==='lessDiameters'?[range('ratio','Передвинь центры',.1,1.8,.05)]:[])];},
    normalize(p){p={...p};p.mode=['fixed','tangent','greaterDiameters','lessDiameters'].includes(p.mode)?p.mode:'fixed';for(const k of['r1','r2'])p[k]=boundedNumber(p[k],.5,10,k==='r1'?3:2);p.distance=boundedNumber(p.distance,.1,30,4);p.other=boundedNumber(p.other,1.5,4,2);p.clearance=boundedNumber(p.clearance,.5,4,1);p.ratio=boundedNumber(p.ratio,.1,1.8,.8);return p;},
    sample(p){const r=p.r1,q=p.mode==='tangent'?p.other:p.r2,d=p.mode==='tangent'?r+q:p.mode==='greaterDiameters'?2*(r+q)+p.clearance:p.mode==='lessDiameters'?(r+q)*p.ratio:p.distance;
      const P={O1:[-d/2,0],O2:[d/2,0]},M={r1:r,r2:q,distance:d,sumRadii:r+q,differenceRadii:Math.abs(r-q),sumDiameters:2*(r+q),intersections:0};
      if(d>=Math.abs(r-q)-1e-8&&d<=r+q+1e-8){const x=(r*r-q*q+d*d)/(2*d),y=Math.sqrt(Math.max(0,r*r-x*x));P.P=[-d/2+x,y];M.intersections=near(d,r+q)||near(d,Math.abs(r-q))?1:2;if(M.intersections===2)P.Q=[-d/2+x,-y];}
      const points=rotatedPoints(P,p.rotation);if(points.P){M.O1P=hypot(points.O1,points.P);M.O2P=hypot(points.O2,points.P);}return{points,metrics:M};},
    render(s){const P=s.points,M=s.metrics,T=fit([...bounds(P.O1,M.r1),...bounds(P.O2,M.r2)],{x:55,y:45,w:450,h:240});let body=linked('first-circle',circleAt(T,P.O1,M.r1,BLUE),'Первая окружность')+linked('second-circle',circleAt(T,P.O2,M.r2,GREEN),'Вторая окружность')+linked('centers',line(T(P.O1),T(P.O2),INK,'5 5'),'Отрезок между центрами')+neutralCenter(T,P.O1,'O₁',BLUE)+neutralCenter(T,P.O2,'O₂',GREEN,true);const readout=[numberRow('Первый радиус',M.r1,BLUE,'first-circle'),numberRow('Второй радиус',M.r2,GREEN,'second-circle'),numberRow('O₁O₂',M.distance,INK,'centers'),numberRow('Сумма радиусов',M.sumRadii),numberRow('Разность радиусов по модулю',M.differenceRadii),numberRow('Сумма диаметров',M.sumDiameters),`Общих точек: ${M.intersections}`];if(P.P){body+=segments(P,T,[['O1','P',BLUE],['O2','P',GREEN]])+dot(T(P.P))+text(T(P.P)[0],T(P.P)[1]-25,'P');readout.push(numberRow('O₁P',M.O1P,BLUE,'O1P'),numberRow('O₂P',M.O2P,GREEN,'O2P'));}if(P.Q)body+=dot(T(P.Q))+text(T(P.Q)[0],T(P.Q)[1]+25,'Q');return{body,readout};}
  };

  defs.circleLineConstrained={
    title:'Прямая и расстояние до центра',values:{radius:5,distance:3,angle:40},controls:[range('angle','Поверни прямую вокруг центра',20,160,1,'°')],
    normalize(p){return{...p,radius:boundedNumber(p.radius,1,12,5),distance:boundedNumber(p.distance,.1,18,3)};},
    sample(p){const n=polar(1,p.angle),v=polar(1,p.angle+90),P={O:[0,0],M:mul(n,p.distance),R:mul(v,p.radius)},M={radius:p.radius,distance:p.distance,intersections:0};P.U=add(P.M,mul(v,-1.5*p.radius));P.V=add(P.M,mul(v,1.5*p.radius));if(p.distance<=p.radius+1e-8){const h=Math.sqrt(Math.max(0,p.radius*p.radius-p.distance*p.distance));P.A=add(P.M,mul(v,-h));M.intersections=near(p.distance,p.radius)?1:2;if(M.intersections===2)P.B=add(P.M,mul(v,h));}return{points:P,metrics:M};},
    render(s){const P=s.points,M=s.metrics,T=fit([...bounds(P.O,M.radius),P.U,P.V]);let body=circleAt(T,P.O,M.radius,INK,LIGHT)+linked('given-line',line(T(P.U),T(P.V),BLUE),'Прямая')+segments(P,T,[['O','M',GREEN,'5 5'],['O','R',AMBER]])+rightMark(T(P.O),T(P.M),T(P.V),GREEN)+origin(T,P.O)+dot(T(P.M),GREEN)+text(T(P.M)[0]+16,T(P.M)[1]-20,'M',GREEN)+labelPoints(P,['R',...(P.A?['A']:[]),...(P.B?['B']:[])],T);return{body,readout:[lengthRow(P,'O','M',GREEN),lengthRow(P,'O','R',AMBER),`Общих точек: ${M.intersections}`]};}
  };

  defs.circleArcConstrained={
    title:'Хорда и углы',values:{arc:80,position:.5},controls:[range('position','Передвинь вершину C вдоль окружности',.15,.85,.05)],
    normalize(p){return{...p,arc:boundedNumber(p.arc,30,170,80)};},
    sample(p){const r=4,P={O:[0,0],A:polar(r,0),B:polar(r,p.arc),C:polar(r,p.arc+(360-p.arc)*p.position)};return{points:P,metrics:{radius:r,arc:p.arc,central:angleAt(P.A,P.O,P.B),inscribed:angleAt(P.A,P.C,P.B)}};},
    render(s){const P=s.points,M=s.metrics,T=fit(bounds(P.O,5)),a=T(P.A),b=T(P.B),r=4*unit(T);return{body:circleAt(T,P.O,4,INK)+segments(P,T,[['A','B',AMBER],['O','A',BLUE],['O','B',BLUE],['C','A',GREEN],['C','B',GREEN]])+linked('arc',`<path d="M ${a.join(' ')} A ${r} ${r} 0 0 0 ${b.join(' ')}" fill="none" stroke="${BLUE}" stroke-width="5"/>`,'Дуга AB без точки C')+kit.angleMark(T(P.A),T(P.O),T(P.B),BLUE)+kit.angleMark(T(P.A),T(P.C),T(P.B),GREEN)+labelPoints(P,['A','B','C'],T)+origin(T,P.O),readout:[numberRow('Дуга AB без точки C, градусов',M.arc,BLUE,'arc'),numberRow('∠AOB',M.central,BLUE),numberRow('∠ACB',M.inscribed,GREEN)]};}
  };

  defs.circleThroughTwoPoints={
    title:'Окружности через A и B',values:{height:1},controls:[range('height','Передвинь центр O₁ по пунктиру',-1,2.5,.1)],
    sample(p){const P={A:[-2,0],B:[2,0],O1:[0,p.height],O2:[0,-2.5]};return{points:P,metrics:{r1:hypot(P.O1,P.A),r2:hypot(P.O2,P.A),O1A:hypot(P.O1,P.A),O1B:hypot(P.O1,P.B),O2A:hypot(P.O2,P.A),O2B:hypot(P.O2,P.B)}};},
    render(s){const P=s.points,M=s.metrics,T=fit([[-4,-6],[4,6.2]],{x:50,y:35,w:460,h:260});return{body:circleAt(T,P.O2,M.r2,GREEN)+circleAt(T,P.O1,M.r1,BLUE)+line(T([0,-5.5]),T([0,5.5]),INK,'4 5')+line(T(P.A),T(P.B),AMBER)+segments(P,T,[['O1','A',BLUE,'5 5'],['O1','B',BLUE,'5 5'],['O2','A',GREEN,'5 5'],['O2','B',GREEN,'5 5']])+labelPoints(P,['A','B'],T)+neutralCenter(T,P.O1,'O₁',BLUE,true)+neutralCenter(T,P.O2,'O₂',GREEN),readout:[numberRow('O₁A',M.O1A,BLUE,'O1A'),numberRow('O₁B',M.O1B,BLUE,'O1B'),numberRow('O₂A',M.O2A,GREEN,'O2A'),numberRow('O₂B',M.O2B,GREEN,'O2B')]};}
  };

  defs.regularPolygonCircles={
    title:'Многоугольник и окружность',values:{n:7,mode:'circumcircle',radius:3,rotation:15},controls:[range('radius','Измени размер многоугольника',2,4,.1),range('rotation','Поверни многоугольник',0,80,1,'°')],
    normalize(p){return{...p,n:[4,7,9].includes(Number(p.n))?Number(p.n):7,mode:p.mode==='incircle'?'incircle':'circumcircle'};},
    sample(p){const P={O:[0,0]},names=[];for(let i=0;i<p.n;i++){const name=String.fromCharCode(65+i);names.push(name);P[name]=polar(p.radius,p.rotation+360*i/p.n);}const M={n:p.n,circumradius:p.radius,inradius:p.radius*Math.cos(Math.PI/p.n),sides:[],vertexDistances:[],sideDistances:[]};for(let i=0;i<p.n;i++){const a=P[names[i]],b=P[names[(i+1)%p.n]];P['H'+i]=mid(a,b);M.sides.push(hypot(a,b));M.vertexDistances.push(hypot(P.O,a));M.sideDistances.push(hypot(P.O,P['H'+i]));}return{points:P,metrics:M};},
    render(s){const P=s.points,M=s.metrics,p=s.values,T=fit([[-5,-5],[5,5]],{x:45,y:40,w:470,h:245}),names=Array.from({length:p.n},(_,i)=>String.fromCharCode(65+i)),r=p.mode==='incircle'?M.inradius:M.circumradius;let body=poly(names.map(n=>T(P[n])))+circleAt(T,P.O,r,BLUE)+labelPoints(P,names,T)+origin(T,P.O),readout=[numberRow('Радиус окружности',r,BLUE)];for(let i=0;i<p.n;i++){const name=names[i],next=names[(i+1)%p.n],end=p.mode==='incircle'?'H'+i:name,key='radius-'+i;body+=linked(key,line(T(P.O),T(P[end]),BLUE,'4 5'),p.mode==='incircle'?'Расстояние до '+name+next:'Радиус O'+name);if(p.mode==='incircle')body+=rightMark(T(P.O),T(P[end]),T(P[name]),GREEN,7);readout.push(numberRow(p.mode==='incircle'?'Расстояние до '+name+next:'O'+name,hypot(P.O,P[end]),BLUE,key));}return{body,readout};}
  };

  function rayCircleRoots(P,u,r){const b=P[0]*u[0]+P[1]*u[1],c=P[0]*P[0]+P[1]*P[1]-r*r,d=Math.sqrt(Math.max(0,b*b-c));return[-b-d,-b+d];}
  defs.circlePowerProducts={
    title:'Отрезки и их произведения',values:{mode:'secant',radius:3,ratio:2,deflection:.2,position:.3,angle:65},controls:[],
    controlsFor(p){return p.mode==='chords'?[range('position','Передвинь точку P внутри круга',-.65,.65,.05),range('angle','Поверни вторую хорду вокруг P',25,150,1,'°')]:[range('ratio','Передвинь внешнюю точку P',1.5,2.5,.05),range('deflection','Поверни секущую вокруг P',-.65,.65,.05)];},
    normalize(p){p={...p,mode:p.mode==='chords'?'chords':'secant',radius:boundedNumber(p.radius,2,4,3)};p.ratio=boundedNumber(p.ratio,1.5,2.5,2);p.deflection=boundedNumber(p.deflection,-.65,.65,.2);p.position=boundedNumber(p.position,-.65,.65,.3);p.angle=boundedNumber(p.angle,25,150,65);return p;},
    sample(p){const r=p.radius,P={O:[0,0]},M={radius:r};if(p.mode==='secant'){const d=r*p.ratio;P.P=[d,0];const phi=Math.asin(r/d)*p.deflection,u=[-Math.cos(phi),Math.sin(phi)],[nearT,farT]=rayCircleRoots(P.P,u,r);P.A=add(P.P,mul(u,nearT));P.B=add(P.P,mul(u,farT));P.T=[r*r/d,r*Math.sqrt(1-r*r/(d*d))];M.PT=hypot(P.P,P.T);M.PA=hypot(P.P,P.A);M.PB=hypot(P.P,P.B);M.tangentSquare=M.PT*M.PT;M.secantProduct=M.PA*M.PB;}else{P.P=[r*p.position,0];for(const [u,a,b]of[[[1,0],'A','B'],[polar(1,p.angle),'C','D']]){const [t1,t2]=rayCircleRoots(P.P,u,r);P[a]=add(P.P,mul(u,t1));P[b]=add(P.P,mul(u,t2));}for(const n of['A','B','C','D'])M['P'+n]=hypot(P.P,P[n]);M.firstProduct=M.PA*M.PB;M.secondProduct=M.PC*M.PD;}M.OP=hypot(P.O,P.P);return{points:P,metrics:M};},
    render(s){const P=s.points,M=s.metrics,p=s.values,T=fit([...bounds(P.O,M.radius),P.P],{x:55,y:40,w:450,h:245});let body=circleAt(T,P.O,M.radius,INK,LIGHT),readout=[];if(p.mode==='secant'){body+=linked('PB',segments(P,T,[['P','A',BLUE],['A','B',GREEN]]),'Вся секущая PB')+segments(P,T,[['P','T',AMBER],['O','T',INK,'5 5']])+rightMark(T(P.O),T(P.T),T(P.P),AMBER)+labelPoints(P,['P','A','B','T'],T);readout=[lengthRow(P,'P','T',AMBER),lengthRow(P,'P','A',BLUE),numberRow('PB — вся секущая',M.PB,GREEN,'PB'),numberRow('PT²',M.tangentSquare,AMBER,'PT'),numberRow('PA · PB',M.secantProduct,BLUE,'PB')];}else{body+=segments(P,T,[['P','A',BLUE],['P','B',BLUE],['P','C',GREEN],['P','D',GREEN]])+labelPoints(P,['A','B','C','D'],T)+dot(T(P.P))+text(T(P.P)[0]+16,T(P.P)[1]+25,'P');readout=[...['A','B'].map(n=>lengthRow(P,'P',n,BLUE)),...['C','D'].map(n=>lengthRow(P,'P',n,GREEN)),numberRow('PA · PB',M.firstProduct,BLUE),numberRow('PC · PD',M.secondProduct,GREEN)];}if(hypot(P.O,P.P)>1e-7)body+=neutralCenter(T,P.O,'O',INK,true);else body+=text(T(P.O)[0]-32,T(P.O)[1]-22,'O = P');return{body,readout};}
  };

  defs.circleDisjointChords={
    title:'Две хорды окружности',values:{offset:2},controls:[range('offset','Раздвинь две хорды',1,4,.1)],
    sample(p){const r=5,h=Math.sqrt(r*r-p.offset*p.offset),P={O:[0,0],A:[-h,p.offset],B:[h,p.offset],C:[-h,-p.offset],D:[h,-p.offset]};return{points:P,metrics:{radius:r,separation:2*p.offset,AB:hypot(P.A,P.B),CD:hypot(P.C,P.D),intersections:0}};},
    render(s){const P=s.points,M=s.metrics,T=fit(bounds(P.O,5.5));return{body:circleAt(T,P.O,5,INK,LIGHT)+segments(P,T,[['A','B',BLUE],['C','D',GREEN]])+labelPoints(P,['A','B','C','D'],T)+origin(T,P.O),readout:[lengthRow(P,'A','B',BLUE),lengthRow(P,'C','D',GREEN),numberRow('Расстояние между прямыми хорд',M.separation),'Общих точек у хорд: 0']};}
  };
  defs.circleDiameterAngle={
    title:'Два диаметра',values:{angle:55},controls:[range('angle','Поверни диаметр AB',20,160,1,'°')],
    sample(p){const P={O:[0,0],A:polar(4,p.angle),B:polar(4,p.angle+180),C:[-4,0],D:[4,0]};return{points:P,metrics:{radius:4,angle:angleAt(P.A,P.O,P.D),AB:hypot(P.A,P.B),CD:hypot(P.C,P.D)}};},
    render(s){const P=s.points,M=s.metrics,T=fit(bounds(P.O,5));return{body:circleAt(T,P.O,4,INK)+segments(P,T,[['A','B',BLUE],['C','D',GREEN]])+kit.angleMark(T(P.A),T(P.O),T(P.D),AMBER)+labelPoints(P,['A','B','C','D'],T)+origin(T,P.O),readout:[lengthRow(P,'A','B',BLUE),lengthRow(P,'C','D',GREEN),numberRow('∠AOD',M.angle,AMBER)]};}
  };

  return defs;
});

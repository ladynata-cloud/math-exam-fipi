/* Interactive triangle experiments. Every constraint is applied before geometry. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory;
  else root.Task19TriangleModels=factory;
})(typeof window==='object'?window:globalThis,function(kit){
  'use strict';
  const {RAD,BLUE,GREEN,INK,LIGHT,clamp,finite,hypot,mid,esc,fmt,angleAt,line,text,dot,poly,fit,labelPoints,tick,angleMark,linked}=kit;
  const AMBER='#a76616';
  const range=(key,label,min,max,step=1,unit='')=>[key,label,min,max,step,unit];
  const rotate=(p,a)=>[p[0]*Math.cos(a*RAD)-p[1]*Math.sin(a*RAD),p[0]*Math.sin(a*RAD)+p[1]*Math.cos(a*RAD)];
  const foot=(p,a,b)=>{const v=[b[0]-a[0],b[1]-a[1]],t=((p[0]-a[0])*v[0]+(p[1]-a[1])*v[1])/(v[0]*v[0]+v[1]*v[1]);return[a[0]+t*v[0],a[1]+t*v[1]];};
  const weighted=(a,b,u,v)=>[(a[0]*u+b[0]*v)/(u+v),(a[1]*u+b[1]*v)/(u+v)];
  const circle=(p,r,color=BLUE,dash='')=>'<circle cx="'+p[0]+'" cy="'+p[1]+'" r="'+r+'" fill="none" stroke="'+color+'" stroke-width="2"'+(dash?' stroke-dasharray="'+dash+'"':'')+'/>';
  const arc=(a,v,b,color=AMBER,r=23,count=1)=>angleMark(a,v,b,color,count,r);
  const rightMark=kit.rightMark;
  const measure=(value,color,group)=>({text:value,color,group});
  const colors=[BLUE,GREEN,AMBER,'#843ca3','#ae365c','#4c6b24'];
  function equalClasses(values){const seen=[];return values.map(value=>{let i=seen.findIndex(n=>Math.abs(n-value)<1e-6);if(i<0){i=seen.length;seen.push(value);}return{count:i+1,color:colors[i%colors.length]};});}
  function highlighted(body,active){return active?body.replace(/stroke-width="[0-9.]+"/g,'stroke-width="4.5"'):body;}
  const pairedRange=(key,label,min,max,value,pair,group,unit='')=>[key,label,min,max,value,unit,undefined,{pair,group}];
  function normalizeTriangle(p){
    p={...p};p.scale=p.focus==='sides'?Math.max(.1,finite(p.scale,6)):clamp(finite(p.scale,6),2,8);p.a=clamp(finite(p.a,55),p.focus==='sides'?.1:10,p.focus==='sides'?179.8:150);p.b=clamp(finite(p.b,65),p.focus==='sides'?.1:10,(p.focus==='sides'?179.9:170)-p.a);p.rotation=clamp(finite(p.rotation,0),0,360);
    if(p.mode==='right'&&!p.converse){p.a=90;p.b=clamp(p.b,15,75);}
    if(p.mode==='acute'){p.a=clamp(p.a,20,80);p.b=clamp(p.b,Math.max(20,91-p.a),Math.min(80,160-p.a));}
    if(p.mode==='obtuse'){p.a=clamp(p.a,95,145);p.b=clamp(p.b,10,175-p.a);}
    if(p.mode==='iso'){p.a=clamp(p.a,15,80);p.b=p.a;}
    if(p.mode==='equilateral'){p.a=60;p.b=60;}
    if(p.mode==='fixed345'){p.a=90;p.b=Math.atan(3/4)/RAD;p.scale=4;}
    p.from=clamp(Math.round(finite(p.from,0)),0,2);p.c=180-p.a-p.b;const M=triangleSample(p).metrics;if(p.converse){p.a=M.a;p.b=M.b;p.c=M.c;}p.sideA=M.BC;p.sideB=M.AC;p.sideC=M.AB;return p;
  }
  function sideBounds(b,c){
    const angle=.100001*RAD,cos=Math.cos(angle),sin=Math.sin(angle),fromB=Math.sqrt(Math.max(0,b*b-c*c*sin*sin)),fromC=Math.sqrt(Math.max(0,c*c-b*b*sin*sin));
    return[Math.max(Math.sqrt(Math.max(0,b*b+c*c-2*b*c*cos)),c*cos-fromB,b*cos-fromC),Math.min(c*cos+fromB,b*cos+fromC)];
  }
  function triangleControls(p){
    if(p.focus==='sides'){
      const result=[],lengths=[p.sideA,p.sideB,p.sideC],angles=[p.a,p.b,p.c],names=['A','B','C'],sides=['BC','AC','AB'];
      for(let i=0;i<3;i++){
        const others=lengths.filter((_,j)=>j!==i),group='opposite-'+names[i],bounds=sideBounds(...others);
        result.push(pairedRange('side'+names[i],'Сторона '+sides[i],bounds[0],bounds[1],.01,group,group));
        const max=i===2?180-Math.max(.1*(p.a+p.b)/p.a,.1*(p.a+p.b)/p.b):179.9-angles[i===0?1:0];
        result.push(pairedRange(names[i].toLowerCase(),'Противоположный угол '+names[i],.1,max,.1,group,group,'°'));
      }
      return result;
    }
    if(p.converse)return[range('scale','Размер треугольника: сторона AB',2,8,.1),range('rotation','Повернуть треугольник',0,360,5,'°')];
    if(p.mode==='fixed345')return[range('rotation','Повернуть треугольник',0,360,5,'°')];
    const lengthUseful=['iso','equilateral'].includes(p.mode)||['pythagoras','legsum','inequality','area-product','tan','cos'].includes(p.focus);
    const controls=lengthUseful?[range('scale','Длина основания AB',2,8,.1)]:[];
    if(p.mode==='right')controls.push(range('b','Изменить острый угол B',15,75,1,'°'));
    else if(p.mode==='iso')controls.push(range('a','Изменить угол при основании',15,80,1,'°'));
    else if(p.mode==='acute')controls.push(range('a','Угол A',20,80,1,'°'),range('b','Угол B',Math.max(20,91-p.a),Math.min(80,160-p.a),1,'°'));
    else if(p.mode==='obtuse')controls.push(range('a','Тупой угол A',95,145,1,'°'),range('b','Острый угол B',10,175-p.a,1,'°'));
    else if(p.mode!=='equilateral')controls.push(range('a','Угол A',10,150,1,'°'),range('b','Угол B',10,170-p.a,1,'°'));
    if(p.chooseVertex)controls.push(['from','Из какой вершины провести линию?',0,2,1,'',['C','A','B']]);
    return controls;
  }
  function updateTriangle(p,key,value){
    p=normalizeTriangle(p);value=Number(value);
    if(p.focus!=='sides')return{...p,[key]:value};
    if(/^side[ABC]$/.test(key)){
      const lengths={sideA:p.sideA,sideB:p.sideB,sideC:p.sideC},other=Object.keys(lengths).filter(n=>n!==key).map(n=>lengths[n]);
      const bounds=sideBounds(...other);lengths[key]=clamp(value,bounds[0],bounds[1]);
      const {sideA:a,sideB:b,sideC:c}=lengths;
      return{...p,scale:c,a:Math.acos(clamp((b*b+c*c-a*a)/(2*b*c),-1,1))/RAD,b:Math.acos(clamp((a*a+c*c-b*b)/(2*a*c),-1,1))/RAD};
    }
    if(key==='c'){const sum=180-clamp(value,.1,179.8),ratio=p.a/(p.a+p.b);return{...p,a:sum*ratio,b:sum*(1-ratio)};}
    return{...p,[key]:value};
  }
  function restoreTriangle(p,savedEditable){
    // Rehydrate the independent base length from the visible six-control
    // snapshot. Model flags remain owned by the card, never by saved data.
    if(p.focus==='sides'&&savedEditable&&Number.isFinite(savedEditable.sideC)&&savedEditable.sideC>0)return{...p,scale:savedEditable.sideC};
    return p;
  }
  function triangleSample(p){
    const c=180-p.a-p.b,ac=p.scale*Math.sin(p.b*RAD)/Math.sin(c*RAD);
    let A=[0,0],B=[p.scale,0],C=[ac*Math.cos(p.a*RAD),ac*Math.sin(p.a*RAD)];
    if(p.mode==='fixed345'){A=[0,0];B=[4,0];C=[0,3];}
    if(p.converse){
      // Construct by SSS: intersect circles of radii AC and BC about A and B.
      // No angle is prescribed; the right angle is measured afterwards.
      const ab=p.scale,ac=3*ab/4,bc=5*ab/4,x=(ac*ac+ab*ab-bc*bc)/(2*ab);
      A=[0,0];B=[ab,0];C=[x,Math.sqrt(Math.max(0,ac*ac-x*x))];
    }
    if(p.rotation){A=rotate(A,p.rotation);B=rotate(B,p.rotation);C=rotate(C,p.rotation);}
    const AB=hypot(A,B),AC=hypot(A,C),BC=hypot(B,C),area=Math.abs((B[0]-A[0])*(C[1]-A[1])-(B[1]-A[1])*(C[0]-A[0]))/2;
    return {points:{A,B,C},metrics:{AB,AC,BC,area,a:angleAt(B,A,C),b:angleAt(A,B,C),c:angleAt(A,C,B),perimeter:AB+AC+BC}};
  }
  function basicsReadout(M){return['∠A = '+fmt(M.a)+'°','∠B = '+fmt(M.b)+'°','∠C = '+fmt(M.c)+'°','Сумма углов: '+fmt(M.a)+'° + '+fmt(M.b)+'° + '+fmt(M.c)+'° = 180°','AB = '+fmt(M.AB),'AC = '+fmt(M.AC),'BC = '+fmt(M.BC)];}
  function triangleFit(s,bounds,box){
    // Keep a fixed length scale whenever a length slider is visible. Fitting
    // each current triangle would cancel its size change on the screen.
    const sized=triangleControls(s.values).some(c=>c[0]==='scale');
    const frame=sized?bounds.map(p=>p.map(v=>v*8/s.values.scale)):bounds;
    return fit(frame,box);
  }
  function drawTriangle(s,extra=[]){const T=triangleFit(s,[...Object.values(s.points),...extra],{x:65,y:45,w:430,h:230}),P=s.points;return{T,body:poly(['A','B','C'].map(n=>T(P[n])))+labelPoints(P,['A','B','C'],T)};}
  function renderExplore(s){
    const P=s.points,M=s.metrics,p=s.values,focus=p.focus||'angles',d=drawTriangle(s),T=d.T,angles=[M.a,M.b,M.c],lengths=[M.BC,M.AC,M.AB],classes=equalClasses(angles),sideClasses=equalClasses(lengths),names=['A','B','C'];
    let body=d.body,readout=[];
    for(let i=0;i<3;i++){
      const n=names[i],u=names[(i+1)%3],v=names[(i+2)%3],style=classes[i],group='opposite-'+n,max=focus==='sides'&&Math.abs(angles[i]-Math.max(...angles))<1e-6;
      body+=linked(group,highlighted(arc(T(P[u]),T(P[n]),T(P[v]),style.color,22,style.count),max),'Угол '+n+' и противоположная сторона '+u+v);
      if(focus==='sides')body+=linked(group,highlighted(line(T(P[u]),T(P[v]),style.color)+tick(T(P[u]),T(P[v]),sideClasses[i].count,style.color),max));
      readout.push(measure('∠'+n+' = '+fmt(angles[i])+'°'+(max?' — наибольший угол':''),style.color,group));
      if(focus==='sides')readout.push(measure(u+v+' = '+fmt(lengths[i])+(max?' — наибольшая сторона':''),style.color,group));
    }
    if(focus!=='sides'){
      for(let i=0;i<3;i++)if(lengths.filter(v=>Math.abs(v-lengths[i])<1e-6).length>1){const u=names[(i+1)%3],v=names[(i+2)%3],style=sideClasses[i];if(!['pythagoras','legsum','inequality','area-product','tan','cos'].includes(focus))body+=linked('equal-side-'+style.count,line(T(P[u]),T(P[v]),style.color)+tick(T(P[u]),T(P[v]),style.count,style.color));}
    }
    readout.push('Сумма углов: '+fmt(M.a)+'° + '+fmt(M.b)+'° + '+fmt(M.c)+'° = 180°');
    if(['iso','equilateral'].includes(p.mode))for(let i=0;i<3;i++){const u=names[(i+1)%3],v=names[(i+2)%3],style=sideClasses[i];readout.push(measure(u+v+' = '+fmt(lengths[i]),style.color,'equal-side-'+style.count));}
    const coloredSides=()=>{
      for(const [u,v,color,group]of [['A','B',BLUE,'leg-ab'],['A','C',GREEN,'leg-ac'],['B','C',AMBER,'side-bc']])body+=linked(group,line(T(P[u]),T(P[v]),color)+(lengths.filter(n=>Math.abs(n-M[u+v])<1e-6).length>1?tick(T(P[u]),T(P[v]),1,color):''));
      return[measure('AB = '+fmt(M.AB),BLUE,'leg-ab'),measure('AC = '+fmt(M.AC),GREEN,'leg-ac'),measure('BC = '+fmt(M.BC),AMBER,'side-bc')];
    };
    if(focus==='exterior'){
      const E=[P.B[0]+(P.B[0]-P.A[0])*.55,P.B[1]+(P.B[1]-P.A[1])*.55],Q={...P,E},U=fit(Object.values(Q),{x:65,y:45,w:430,h:230});
      body=poly(['A','B','C'].map(n=>U(P[n])))+line(U(P.B),U(E),BLUE)+labelPoints(Q,['A','B','C','E'],U)+arc(U(P.C),U(P.B),U(E),AMBER,30)+arc(U(P.B),U(P.A),U(P.C),BLUE,22,1)+arc(U(P.A),U(P.C),U(P.B),GREEN,22,2);
      readout=['Внешний угол CBE: '+fmt(180-M.b)+'°','∠A + ∠C = '+fmt(M.a)+'° + '+fmt(M.c)+'° = '+fmt(M.a+M.c)+'°','∠ABC = '+fmt(M.b)+'°'];
    }
    if(focus==='pythagoras'){
      readout=[...coloredSides(),'BC² = '+fmt(M.BC*M.BC),'AB² + AC² = '+fmt(M.AB*M.AB+M.AC*M.AC),'AB² − AC² = '+fmt(M.AB*M.AB-M.AC*M.AC),'AB + AC = '+fmt(M.AB+M.AC)+' > BC = '+fmt(M.BC)];
      if(p.converse)readout.unshift(measure('∠A = '+fmt(M.a)+'° — измерен после построения по трём сторонам',BLUE,'opposite-A'),'Обратная теорема Пифагора: если сумма квадратов двух сторон равна квадрату третьей, угол напротив третьей стороны — прямой.','Пифагорова тройка: 3, 4, 5. Проверка: 3² + 4² = 9 + 16 = 25 = 5².');
    }
    if(focus==='legsum')readout=[...coloredSides(),'Сравни: AB + AC = '+fmt(M.AB+M.AC)+' > BC = '+fmt(M.BC),'∠A = '+fmt(M.a)+'°'];
    if(focus==='inequality')readout=[...coloredSides(),'AB + AC = '+fmt(M.AB+M.AC)+' > BC = '+fmt(M.BC),'AC + BC = '+fmt(M.AC+M.BC)+' > AB = '+fmt(M.AB),'AB + BC = '+fmt(M.AB+M.BC)+' > AC = '+fmt(M.AC)];
    if(focus==='area-product'){
      const H=foot(P.C,P.A,P.B);body+=line(T(P.C),T(H),GREEN)+rightMark(T(P.C),T(H),T(P.B))+dot(T(H),GREEN)+text(T(H)[0]+13,T(H)[1]+24,'H',GREEN);
      if(H[0]<Math.min(P.A[0],P.B[0])||H[0]>Math.max(P.A[0],P.B[0]))body+=line(T(P.A),T(H),INK,'5 5');
      readout=[...coloredSides(),'CH = '+fmt(hypot(P.C,H)),'S = AB · CH : 2 = '+fmt(M.AB)+' · '+fmt(hypot(P.C,H))+' : 2 = '+fmt(M.area),'AB · AC = '+fmt(M.AB)+' · '+fmt(M.AC)+' = '+fmt(M.AB*M.AC),'Сравни: '+fmt(M.area)+' < '+fmt(M.AB*M.AC),'Высота CH не длиннее AC, а произведение основания на высоту делится на 2. Поэтому S < AB · AC.'];
    }
    if(focus==='tan')readout=[...coloredSides(),'Острый угол B: '+fmt(M.b)+'°','Тангенс B = AC : AB = '+fmt(M.AC/M.AB)];
    if(focus==='cos')readout=[...coloredSides(),'Острый угол B: '+fmt(M.b)+'°','Косинус B = AB : BC = '+fmt(M.AB/M.BC),'BC : AB = '+fmt(M.BC/M.AB)];
    return {body,readout};
  }
  function constructionSample(p){
    const s=triangleSample(p),P=s.points,M=s.metrics,names=[['C','A','B'],['A','B','C'],['B','A','C']][p.from],V=P[names[0]],U=P[names[1]],W=P[names[2]];
    P.H=foot(V,U,W);P.M=mid(U,W);P.D=weighted(U,W,hypot(V,W),hypot(V,U));
    M.vertex=names[0];M.left=names[1];M.right=names[2];M.UD=hypot(U,P.D);M.DW=hypot(P.D,W);M.UM=hypot(U,P.M);M.MW=hypot(P.M,W);M.HM=hypot(P.H,P.M);M.DM=hypot(P.D,P.M);M.bisectLeft=angleAt(U,V,P.D);M.bisectRight=angleAt(P.D,V,W);M.medianLeft=angleAt(U,V,P.M);M.medianRight=angleAt(P.M,V,W);M.bisectorBaseAngle=angleAt(V,P.D,U);
    for(const [n,u,w]of [['A','B','C'],['B','A','C'],['C','A','B']]){P['H'+n]=foot(P[n],P[u],P[w]);M['h'+n]=hypot(P[n],P['H'+n]);}
    P.E=mid(P.A,P.C);P.F=mid(P.B,P.C);M.EF=hypot(P.E,P.F);return s;
  }
  function triangleAngleMarks(P,T){const names=['A','B','C'],values=names.map((n,i)=>angleAt(P[names[(i+1)%3]],P[n],P[names[(i+2)%3]])),styles=equalClasses(values);return names.map((n,i)=>arc(T(P[names[(i+1)%3]]),T(P[n]),T(P[names[(i+2)%3]]),styles[i].color,23,styles[i].count)).join('');}
  function drawHeight(V,H,U,W,T,name='H',color=GREEN){
    const v=T(V),h=T(H),u=T(U),w=T(W),side=hypot(h,u)>hypot(h,w)?u:w;
    const outside=(H[0]-U[0])*(H[0]-W[0])+(H[1]-U[1])*(H[1]-W[1])>1e-8;
    return(outside?line(u,h,INK,'5 5')+line(w,h,INK,'5 5'):'')+line(v,h,color)+rightMark(v,h,side,color)+dot(h,color)+text(h[0]+13,h[1]+23,name,color);
  }
  function renderConstruction(s){
    const P=s.points,M=s.metrics,p=s.values,focus=p.focus||'bisector',names=['A','B','C'];
    const extra=focus==='heights'?['HA','HB','HC']:focus==='midline'?['E','F']:['D','M','H'];
    const T=triangleFit(s,names.concat(extra).map(n=>P[n]),{x:65,y:40,w:430,h:245});let body=poly(names.map(n=>T(P[n])))+labelPoints(P,names,T),readout=[];
    if(focus==='heights'){
      const marks=equalClasses([M.hA,M.hB,M.hC]);
      for(const [i,n,u,w]of [[0,'A','B','C'],[1,'B','A','C'],[2,'C','A','B']]){const H=P['H'+n],group='height-'+n,color=marks[i].color;body+=linked(group,drawHeight(P[n],H,P[u],P[w],T,'H'+['ₐ','ᵦ','꜀'][i],color)+tick(T(P[n]),T(H),marks[i].count,color));readout.push(measure('Высота из '+n+' = '+fmt(M['h'+n]),color,group));}
      body+=triangleAngleMarks(P,T);
    }else if(focus==='midline'){
      const styles=equalClasses([M.AC/2,M.BC/2]);body+=line(T(P.E),T(P.F),GREEN)+labelPoints(P,['E','F'],T);
      for(const [i,u,h,v]of [[0,'A','E','C'],[1,'B','F','C']]){const style=styles[i],group='midline-half-'+style.count;body+=linked(group,line(T(P[u]),T(P[h]),style.color)+line(T(P[h]),T(P[v]),style.color)+tick(T(P[u]),T(P[h]),style.count,style.color)+tick(T(P[h]),T(P[v]),style.count,style.color));readout.push(measure(u+h+' = '+fmt(hypot(P[u],P[h])),style.color,group),measure(h+v+' = '+fmt(hypot(P[h],P[v])),style.color,group));}
      readout.push('AB = '+fmt(M.AB),'EF = '+fmt(M.EF),'EF ∥ AB');
    }else{
      const V=P[M.vertex],U=P[M.left],W=P[M.right];
      if(focus==='median'||focus==='special'){
        body+=line(T(V),T(P.M),BLUE)+dot(T(P.M),BLUE)+text(T(P.M)[0]+12,T(P.M)[1]+25,'M',BLUE)+linked('median-halves',line(T(U),T(P.M),BLUE)+line(T(P.M),T(W),BLUE)+tick(T(U),T(P.M),1,BLUE)+tick(T(P.M),T(W),1,BLUE));
        body+=linked('height',drawHeight(V,P.H,U,W,T,'H',AMBER));
      }
      if(focus==='bisector'||focus==='special')body+=linked('bisected-angle',line(T(V),T(P.D),GREEN)+dot(T(P.D),GREEN)+text(T(P.D)[0]-15,T(P.D)[1]+25,'D',GREEN)+arc(T(U),T(V),T(P.D),GREEN,27)+arc(T(P.D),T(V),T(W),GREEN,27));
      if(focus==='median')readout=[measure(M.left+'M = '+fmt(M.UM),BLUE,'median-halves'),measure('M'+M.right+' = '+fmt(M.MW),BLUE,'median-halves'),'Углы у медианы: '+fmt(M.medianLeft)+'° и '+fmt(M.medianRight)+'°','Расстояние между основаниями медианы и высоты: '+fmt(M.HM),'Площади двух частей: '+fmt(M.area/2)+' и '+fmt(M.area/2),'Стороны к вершине '+M.vertex+': '+fmt(hypot(V,U))+' и '+fmt(hypot(V,W))];
      else readout=['Биссектриса из вершины '+M.vertex,measure('Первый угол = '+fmt(M.bisectLeft)+'°',GREEN,'bisected-angle'),measure('Второй угол = '+fmt(M.bisectRight)+'°',GREEN,'bisected-angle'),M.left+'D = '+fmt(M.UD),'D'+M.right+' = '+fmt(M.DW),'Угол с противоположной стороной: '+fmt(M.bisectorBaseAngle)+'°','Расстояние от D до середины стороны M: '+fmt(M.DM)];
      if(Math.abs(hypot(V,U)-hypot(V,W))<1e-6)body+=linked('equal-triangle-sides',line(T(V),T(U),AMBER)+line(T(V),T(W),AMBER)+tick(T(V),T(U),2,AMBER)+tick(T(V),T(W),2,AMBER));
      if(focus==='median'){const styles=equalClasses([M.medianLeft,M.medianRight]);body+=arc(T(U),T(V),T(P.M),styles[0].color,27,styles[0].count)+arc(T(P.M),T(V),T(W),styles[1].color,27,styles[1].count);}
      if(focus==='special')body+=rightMark(T(V),T(P.M),T(U),BLUE);
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
    const perpendiculars=p.showPerpendiculars?[['A','B'],['B','C'],['C','A']].map(([u,v])=>{const H=mid(P[u],P[v]),direction=[-(P[v][1]-P[u][1]),P[v][0]-P[u][0]],norm=Math.hypot(...direction),distance=Math.max(M.radius*1.3,hypot(H,P.O)*1.2),ends=[-1,1].map(sign=>[H[0]+sign*direction[0]*distance/norm,H[1]+sign*direction[1]*distance/norm]);return{u,v,H,ends};}):[];
    if(outside)for(const item of perpendiculars)bound.push(...item.ends);
    const T=triangleFit(s,bound,{x:65,y:50,w:430,h:240}),unit=hypot(T([0,0]),T([1,0]));let body=poly([P.A,P.B,P.C].map(T))+labelPoints(P,['A','B','C'],T)+triangleAngleMarks(P,T),readout=[];
    if(outside){
      body+=circle(T(P.O),M.radius*unit,BLUE);
      for(const name of ['A','B','C']){body+=linked('circumradius',line(T(P.O),T(P[name]),BLUE,'5 5')+tick(T(P.O),T(P[name]),1,BLUE));readout.push(measure('O'+name+' = '+fmt(M['O'+name]),BLUE,'circumradius'));}
      body+=dot(T(P.O),BLUE)+text(T(P.O)[0]+17,T(P.O)[1]+16,'O',BLUE);
      const halfStyles=equalClasses(perpendiculars.map(({u,v})=>hypot(P[u],P[v])/2));
      perpendiculars.forEach(({u,v,H,ends},i)=>{
        const style=halfStyles[i];body+=line(T(ends[0]),T(ends[1]),GREEN,'5 5')+rightMark(T(ends[1]),T(H),T(P[u]),GREEN)+linked('bisector-halves-'+style.count,line(T(P[u]),T(H),style.color)+line(T(H),T(P[v]),style.color)+tick(T(P[u]),T(H),style.count+1,style.color)+tick(T(H),T(P[v]),style.count+1,style.color))+dot(T(H),GREEN);
      });
    }
    if(inside){
      body+=circle(T(P.I),M.inradius*unit,GREEN);
      for(const [n,h,u,v]of [['A','X','A','B'],['B','Y','B','C'],['C','Z','C','A']]){body+=line(T(P[n]),T(P.I),GREEN,'5 5')+linked('inradius',drawHeight(P.I,P[h],P[u],P[v],T,h,GREEN)+tick(T(P.I),T(P[h]),2,GREEN));readout.push(measure('I'+h+' = '+fmt(M['I'+h]),GREEN,'inradius'));}
      body+=dot(T(P.I),GREEN)+text(T(P.I)[0]-16,T(P.I)[1]-18,'I',GREEN);
    }
    if(focus==='both')readout.push('Расстояние между центрами O и I: '+fmt(M.OI));
    return{body,readout};
  }
  function medianCircleSample(p){const r=p.radius,angle=p.point*RAD,P={A:[-r,0],B:[r,0],M:[0,0],C:[r*Math.cos(angle),r*Math.sin(angle)]};return{points:P,metrics:{AM:r,BM:r,CM:hypot(P.C,P.M),AB:2*r,angle:angleAt(P.A,P.C,P.B)}};}
  function renderMedianCircle(s){
    const P=s.points,M=s.metrics,r=s.values.radius,T=fit([[-6,-6],[6,6]],{x:100,y:25,w:360,h:285}),u=hypot(T([0,0]),T([1,0]));
    let body=circle(T(P.M),r*u,BLUE,'5 5')+poly([P.A,P.B,P.C].map(T));
    for(const n of ['A','B','C'])body+=linked('equal-radii',line(T(P.M),T(P[n]),GREEN)+tick(T(P.M),T(P[n]),1,GREEN));
    body+=labelPoints(P,['A','B','C','M'],T)+rightMark(T(P.A),T(P.C),T(P.B),AMBER);
    return{body,readout:['A','B','C'].map(n=>measure(n+'M = '+fmt(M[n+'M']||M['CM']),GREEN,'equal-radii')).concat('AB = '+fmt(M.AB),'∠ACB = 90°')};
  }
  function pairTransforms(P,Q,fixedUnit){
    const bounds=pts=>({minX:Math.min(...pts.map(p=>p[0])),maxX:Math.max(...pts.map(p=>p[0])),minY:Math.min(...pts.map(p=>p[1])),maxY:Math.max(...pts.map(p=>p[1]))}),a=bounds(P),b=bounds(Q),u=fixedUnit||Math.min(205/Math.max(a.maxX-a.minX,b.maxX-b.minX,1),225/Math.max(a.maxY-a.minY,b.maxY-b.minY,1));
    const tr=(x,r)=>p=>[x+(p[0]-(r.maxX+r.minX)/2)*u,175-(p[1]-(r.maxY+r.minY)/2)*u];return[tr(140,a),tr(420,b)];
  }
  function renderPair(P,Q,left=['A','B','C'],right=['D','E','F'],fixedUnit){const [T,U]=pairTransforms(P,Q,fixedUnit),labels=(pts,names,tr)=>pts.map((p,i)=>dot(tr(p))+text(tr(p)[0]+(i===0?-14:i===1?14:0),tr(p)[1]+(i===2?-21:22),names[i])).join('');return{body:poly(P.map(T))+poly(Q.map(U))+labels(P,left,T)+labels(Q,right,U),T,U};}
  function pairMetrics(P,Q){const sides=T=>[hypot(T[0],T[1]),hypot(T[0],T[2]),hypot(T[1],T[2])],area=T=>Math.abs((T[1][0]-T[0][0])*(T[2][1]-T[0][1])-(T[1][1]-T[0][1])*(T[2][0]-T[0][0]))/2;return{sides1:sides(P),sides2:sides(Q),area1:area(P),area2:area(Q),angles1:[angleAt(P[1],P[0],P[2]),angleAt(P[0],P[1],P[2]),angleAt(P[0],P[2],P[1])],angles2:[angleAt(Q[1],Q[0],Q[2]),angleAt(Q[0],Q[1],Q[2]),angleAt(Q[0],Q[2],Q[1])]};}
  function renderPairReadout(s){
    const M=s.metrics,P=s.points.first,Q=s.points.second,r=renderPair(P,Q,['A','B','C'],['D','E','F'],s.values.kind?18:undefined),styles=equalClasses([...M.angles1,...M.angles2]),sideStyles=equalClasses([...M.sides1,...M.sides2]),names=[['A','B','C'],['D','E','F']],readout=[];
    const sidePairs=[[0,1],[0,2],[1,2]];
    for(let t=0;t<2;t++){
      const points=t?Q:P,T=t?r.U:r.T,angles=t?M.angles2:M.angles1,lengths=t?M.sides2:M.sides1;
      for(let i=0;i<3;i++){
        const a=styles[t*3+i],group='pair-angle-'+a.count;
        if([...M.angles1,...M.angles2].filter(n=>Math.abs(n-angles[i])<1e-6).length>1)r.body+=linked(group,arc(T(points[(i+1)%3]),T(points[i]),T(points[(i+2)%3]),a.color,22,a.count),'Угол '+names[t][i]);
        readout.push(measure('∠'+names[t][i]+' = '+fmt(angles[i])+'°',a.color,group));
        const [u,v]=sidePairs[i],side=sideStyles[t*3+i],sideGroup='pair-side-'+side.count;
        const equal=[...M.sides1,...M.sides2].filter(n=>Math.abs(n-lengths[i])<1e-6).length>1;
        r.body+=linked(sideGroup,line(T(points[u]),T(points[v]),side.color)+(equal?tick(T(points[u]),T(points[v]),side.count,side.color):''),names[t][u]+names[t][v]);
        readout.push(measure(names[t][u]+names[t][v]+' = '+fmt(lengths[i]),side.color,sideGroup));
      }
    }
    readout.push('Площадь ABC = '+fmt(M.area1),'Площадь DEF = '+fmt(M.area2));
    return{...r,readout};
  }
  function renderAreaPair(s){
    const P=s.points.first,Q=s.points.second,M=s.metrics,r=renderPair(P,Q,['A','B','C'],['D','E','F'],20),H=foot(P[2],P[0],P[1]),K=foot(Q[2],Q[0],Q[1]);
    r.body+=linked('equal-bases',line(r.T(P[0]),r.T(P[1]),BLUE)+tick(r.T(P[0]),r.T(P[1]),1,BLUE)+line(r.U(Q[0]),r.U(Q[1]),BLUE)+tick(r.U(Q[0]),r.U(Q[1]),1,BLUE));
    r.body+=linked('equal-heights',drawHeight(P[2],H,P[0],P[1],r.T,'H',GREEN)+tick(r.T(P[2]),r.T(H),2,GREEN)+drawHeight(Q[2],K,Q[0],Q[1],r.U,'K',GREEN)+tick(r.U(Q[2]),r.U(K),2,GREEN));
    const base=hypot(P[0],P[1]),height=hypot(P[2],H);
    r.readout=[measure('AB = '+fmt(base),BLUE,'equal-bases'),measure('DE = '+fmt(hypot(Q[0],Q[1])),BLUE,'equal-bases'),measure('CH = '+fmt(height),GREEN,'equal-heights'),measure('FK = '+fmt(hypot(Q[2],K)),GREEN,'equal-heights'),'S(ABC) = '+fmt(base)+' · '+fmt(height)+' : 2 = '+fmt(M.area1),'S(DEF) = '+fmt(hypot(Q[0],Q[1]))+' · '+fmt(hypot(Q[2],K))+' : 2 = '+fmt(M.area2)];
    return r;
  }
  const defs={
    triangleExplore:{title:'Измени треугольник',values:{a:55,b:65,scale:6,rotation:0,mode:'free',focus:'angles'},controls:[],normalize:normalizeTriangle,controlsFor:triangleControls,update:updateTriangle,restore:restoreTriangle,sample:triangleSample,render:renderExplore},
    triangleConstructions:{title:'Линии в треугольнике',values:{a:45,b:70,scale:6,from:0,mode:'free',focus:'bisector',chooseVertex:false},controls:[range('a','Угол A',10,150,1,'°'),range('b','Угол B',10,160,1,'°'),range('scale','Основание AB',2,8,.1),range('from','Вершина',0,2,1)],normalize:normalizeTriangle,controlsFor:triangleControls,sample:constructionSample,render:renderConstruction},
    triangleCenters:{title:'Найди центр окружности',values:{a:55,b:65,scale:6,mode:'free',focus:'circumcenter'},controls:[range('a','Угол A',10,150,1,'°'),range('b','Угол B',10,160,1,'°'),range('scale','Основание AB',2,8,.1)],normalize:normalizeTriangle,controlsFor:triangleControls,sample:centersSample,render:renderCenters},
    triangleMedianCircle:{title:'Медиана и угол треугольника',values:{radius:3,point:65},controls:[range('point','Перемести C по окружности',15,165,1,'°'),range('radius','Длина AM, BM и CM',2,6,.1)],normalize:p=>({...p,radius:clamp(finite(p.radius,3),2,6),point:clamp(finite(p.point,65),15,165)}),sample:medianCircleSample,render:renderMedianCircle},
    triangleLinkage:{title:'Попробуй замкнуть три отрезка',values:{a:2,b:3,c:5,turn:35,fixedLengths:true},controls:[range('a','Длина первого отрезка',.5,9,.5),range('b','Длина второго отрезка',.5,9,.5),range('c','Длина основания',.5,9,.5),range('turn','Поверни первый отрезок',0,180,.1,'°')],controlsFor:p=>[...(!p.fixedLengths?[range('a','Длина первого отрезка',.5,9,.5),range('b','Длина второго отрезка',.5,9,.5),range('c','Длина основания',.5,9,.5)]:[]),range('turn','Поверни первый отрезок',0,180,.1,'°')],normalize:p=>({...p,a:clamp(finite(p.a,2),.5,9),b:clamp(finite(p.b,3),.5,9),c:clamp(finite(p.c,5),.5,9),turn:clamp(finite(p.turn,35),0,180)}),sample(p){const A=[0,0],B=[p.c,0],C=[p.a*Math.cos(p.turn*RAD),p.a*Math.sin(p.turn*RAD)],d=hypot(B,C),direction=d>1e-10?[(C[0]-B[0])/d,(C[1]-B[1])/d]:[0,1],D=[B[0]+p.b*direction[0],B[1]+p.b*direction[1]];return{points:{A,B,C,D},metrics:{a:hypot(A,C),b:hypot(B,D),c:hypot(A,B),gap:hypot(C,D),height:C[1],possible:p.a+p.b>p.c&&p.a+p.c>p.b&&p.b+p.c>p.a}};},render(s){const P=s.points,M=s.metrics,T=fit(Object.values(P),{x:65,y:40,w:430,h:240});return{body:line(T(P.A),T(P.B),INK)+line(T(P.A),T(P.C),BLUE)+line(T(P.B),T(P.D),GREEN)+line(T(P.C),T(P.D),AMBER,'5 5')+labelPoints(P,['A','B','C','D'],T),readout:['Длины отрезков: '+fmt(M.a)+'; '+fmt(M.b)+'; '+fmt(M.c),'Зазор между свободными концами C и D: '+fmt(M.gap),'Высота точки C над основанием: '+fmt(M.height)]};}},
    triangleCongruence:{title:'Сравни два треугольника',values:{kind:'sas',side1:6,side2:4,angle:50,otherAngle:100,rotation:0},controls:[range('side1','Первая сторона в обоих треугольниках',3,8,.1),range('side2','Вторая сторона в обоих треугольниках',2,6,.1),range('angle','Угол первого треугольника',20,140,1,'°'),range('otherAngle','Угол второго треугольника',20,140,1,'°'),range('rotation','Повернуть второй треугольник',0,360,5,'°')],controlsFor:p=>p.kind==='ssa'?[range('angle','Одинаковый угол A и D',20,35,1,'°'),range('rotation','Повернуть второй треугольник',0,360,5,'°')]:[range('side1','Первая сторона в обоих треугольниках',3,8,.1),range('side2','Вторая сторона в обоих треугольниках',2,6,.1),range('angle','Угол первого треугольника',20,140,1,'°'),...(p.kind==='twoSides'?[range('otherAngle','Угол второго треугольника',20,140,1,'°')]:[]),range('rotation','Повернуть второй треугольник',0,360,5,'°')],normalize(p){p={...p,side1:clamp(finite(p.side1,6),3,8),side2:clamp(finite(p.side2,4),2,6),angle:clamp(finite(p.angle,50),20,p.kind==='ssa'?35:140),otherAngle:clamp(finite(p.otherAngle,100),20,140),rotation:clamp(finite(p.rotation,0),0,360)};if(p.kind==='ssa'){p.side1=8;p.side2=5;}return p;},sample(p){let first,second;if(p.kind==='ssa'){const x=p.side1*Math.cos(p.angle*RAD),delta=Math.sqrt(p.side2*p.side2-p.side1*p.side1*Math.sin(p.angle*RAD)**2),at=t=>[t*Math.cos(p.angle*RAD),t*Math.sin(p.angle*RAD)];first=[[0,0],[p.side1,0],at(x+delta)];second=[[0,0],[p.side1,0],at(x-delta)];}else{const tri=a=>[[0,0],[p.side1,0],[p.side2*Math.cos(a*RAD),p.side2*Math.sin(a*RAD)]];first=tri(p.angle);second=tri(p.kind==='twoSides'?p.otherAngle:p.angle);}second=second.map(q=>rotate(q,p.rotation));return{points:{first,second},metrics:pairMetrics(first,second)};},render:renderPairReadout},
    triangleAreaPair:{title:'Одинаковая площадь — одинаковая форма?',values:{base:6,height:3,x:1,rotation:0,congruent:false},controls:[range('base','Оба основания',3,8,.1),range('height','Обе высоты',2,5,.1),range('x','Сдвинуть вершину второго треугольника',-2,8,.1),range('rotation','Повернуть второй треугольник',0,360,5,'°')],controlsFor:p=>[range('base','Оба основания',3,8,.1),range('height','Обе высоты',2,5,.1),...(p.congruent?[range('rotation','Повернуть второй треугольник',0,360,5,'°')]:[])],normalize:p=>({...p,base:clamp(finite(p.base,6),3,8),height:clamp(finite(p.height,3),2,5),x:clamp(finite(p.x,1),-2,8),rotation:clamp(finite(p.rotation,0),0,360)}),sample(p){const first=[[0,0],[p.base,0],[1,p.height]],second=p.congruent?first.map(q=>rotate(q,p.rotation)):[[0,0],[p.base,0],[p.x,p.height]];return{points:{first,second},metrics:pairMetrics(first,second)};},render:renderAreaPair},
    triangleSimilarity:{title:'Сравни форму и размер',values:{a:55,b:65,scale:2,base:3,fixedScale:false,mode:'free',otherAngle:35},controls:[range('scale','Во сколько раз стороны второго треугольника больше сторон первого треугольника?',1,3,.1),range('base','Основание первого треугольника',2,4,.1),range('a','Угол A',20,80,1,'°'),range('b','Угол B',20,80,1,'°'),range('otherAngle','Угол при основании второго',20,80,1,'°')],controlsFor(p){let c=[];if(!p.fixedScale)c.push(range('scale','Во сколько раз стороны второго треугольника больше сторон первого треугольника?',1,3,.1));if(p.mode!=='equilateral')c.push(range('a',p.mode==='isoPair'?'Угол при основании первого':'Угол A',20,80,1,'°'));if(p.mode==='isoPair')c.push(range('otherAngle','Угол при основании второго',20,80,1,'°'));else if(p.mode!=='equilateral')c.push(range('b','Угол B',20,80,1,'°'));return c;},normalize(p){p={...p,a:clamp(finite(p.a,55),20,80),b:clamp(finite(p.b,65),20,80),base:clamp(finite(p.base,3),2,4),scale:clamp(finite(p.scale,2),1,3),otherAngle:clamp(finite(p.otherAngle,35),20,80)};if(p.fixedScale)p.scale=2;if(p.mode==='equilateral'){p.a=60;p.b=60;}if(p.mode==='isoPair')p.b=p.a;return p;},sample(p){const s=triangleSample(normalizeTriangle({a:p.a,b:p.b,scale:p.base})),first=['A','B','C'].map(n=>s.points[n]),second=p.mode==='isoPair'?[[0,0],[p.base*p.scale,0],[p.base*p.scale/2,p.base*p.scale/2*Math.tan(p.otherAngle*RAD)]]:first.map(q=>q.map(n=>n*p.scale));return{points:{first,second},metrics:pairMetrics(first,second)};},render(s){const r=renderPairReadout(s),M=s.metrics;r.readout.push('Отношение периметров: '+fmt(M.sides2.reduce((a,b)=>a+b,0)/M.sides1.reduce((a,b)=>a+b,0)),'Отношение площадей: '+fmt(M.area2/M.area1));return r;}}
  };
  return defs;
});

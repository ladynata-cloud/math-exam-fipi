/* Small, deterministic geometry experiments for the optional task 19 hints. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Task19Visuals = api;
})(typeof window === 'object' ? window : globalThis, function () {
  'use strict';
  const RAD = Math.PI / 180;
  const BLUE = '#245ca8', GREEN = '#18704f', INK = '#263238', LIGHT = '#eaf1f8';
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  const finite = (n, fallback) => Number.isFinite(Number(n)) ? Number(n) : fallback;
  const hypot = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = n => (Math.abs(n) < 0.005 ? 0 : Number(n.toFixed(2))).toLocaleString('ru-RU');
  const angleAt = (a, b, c) => {
    const u = [a[0] - b[0], a[1] - b[1]], v = [c[0] - b[0], c[1] - b[1]];
    return Math.acos(clamp((u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v)), -1, 1)) / RAD;
  };
  const defs = {
    adjacentAngles: {title:'Две пересекающиеся прямые', values:{angle:55}, controls:[['angle','Угол α',20,160,1,'°']]},
    triangleAngles: {title:'Углы треугольника', values:{a:65,b:45}, controls:[['a','Угол A',20,130,1,'°'],['b','Угол B',20,130,1,'°']]},
    triangleMedian: {title:'Медиана и высота треугольника', values:{x:1.2,height:3}, controls:[['x','Положение вершины C',0.5,5.5,0.1,''],['height','Высота CH',2,5,0.1,'']]},
    triangleSides: {title:'Три отрезка', values:{a:3,b:4,c:5}, controls:[['a','Сторона a',1,9,0.5,''],['b','Сторона b',1,9,0.5,''],['c','Сторона c',1,9,0.5,'']]},
    parallelogram: {title:'Параллелограмм ABCD', values:{base:6,side:4,angle:65}, controls:[['base','Сторона AB',3,8,0.5,''],['side','Сторона AD',2,6,0.5,''],['angle','Угол A',30,150,1,'°']]},
    rhombus: {title:'Ромб ABCD', values:{side:4,angle:65}, controls:[['side','Сторона ромба',2,6,0.5,''],['angle','Угол A',30,150,1,'°']]},
    rectangle: {title:'Прямоугольник ABCD', values:{width:6,height:3}, controls:[['width','Сторона AB',2,8,0.5,''],['height','Сторона AD',2,6,0.5,'']]},
    trapezoid: {title:'Трапеция ABCD', values:{bottom:7,top:3,height:3,offset:0}, controls:[['bottom','Основание AB',5,10,0.5,''],['top','Основание CD',2,4.5,0.5,''],['height','Высота',2,5,0.1,''],['offset','Сдвиг верхнего основания',-2,2,0.1,'']]},
    circleChord: {title:'Хорда и диаметр окружности', values:{radius:5,offset:2}, controls:[['radius','Радиус',2,6,0.5,''],['offset','Расстояние от центра до хорды',0,4.9,0.1,'']]},
    circleAngle: {title:'Углы, опирающиеся на одну дугу', values:{central:120,point:230}, controls:[['central','Центральный угол AOB',30,180,1,'°'],['point','Положение точки C на окружности',50,340,1,'°']]},
    similarity: {title:'Два подобных треугольника', values:{scale:2}, controls:[['scale','Во сколько раз увеличиваем стороны',1,3,0.1,'']]},
    areaTriangle: {title:'Основание и высота треугольника', values:{base:6,height:3,x:1}, controls:[['base','Основание AB',3,8,0.5,''],['height','Высота',2,5,0.1,''],['x','Сдвиг вершины C',-1,7,0.1,'']]}
  };

  function valuesFor(model, params) {
    const def = defs[model];
    if (!def) throw new Error('Unknown task 19 model: ' + model);
    const p = Object.assign({}, def.values, params || {});
    def.controls.forEach(([key,,lo,hi]) => { p[key] = clamp(finite(p[key], def.values[key]), lo, hi); });
    if (model === 'triangleAngles') p.b = Math.min(p.b, 170 - p.a);
    if (model === 'circleChord') p.offset = Math.min(p.offset, p.radius - 0.1);
    if (model === 'circleAngle') {
      if (p.diameter) p.central = 180;
      p.point = clamp(p.point, p.central + 20, p.compare ? 300 : 340);
    }
    if (model === 'trapezoid') p.top = Math.min(p.top, p.bottom - 0.5);
    return p;
  }

  function controlsFor(model, params) {
    const p = valuesFor(model, params);
    const locked = Array.isArray(p.locked) ? p.locked : [];
    return defs[model].controls.filter(([key]) => !locked.includes(key) && !(model === 'circleAngle' && p.diameter && key === 'central')).map(([key,label,min,max,step,unit]) => ({
      key,label,min,
      max: model === 'triangleAngles' && key === 'b' ? Math.min(max,170-p.a) : model === 'circleChord' && key === 'offset' ? p.radius-0.1 : max,
      step,unit,value:p[key],
      ...(model === 'circleAngle' && key === 'point' ? {min:p.central+20,max:p.compare?300:340} : {})
    }));
  }

  function sample(model, params) {
    const p = valuesFor(model, params), result = {model,values:p,points:{},metrics:{}};
    const P = result.points, M = result.metrics;
    if (model === 'adjacentAngles') {
      M.alpha=p.angle; M.beta=180-p.angle; M.sum=180;
    } else if (model === 'triangleAngles') {
      M.a=p.a; M.b=p.b; M.c=180-p.a-p.b;
      const ac=6*Math.sin(p.b*RAD)/Math.sin(M.c*RAD);
      P.A=[0,0]; P.B=[6,0]; P.C=[ac*Math.cos(p.a*RAD),ac*Math.sin(p.a*RAD)];
    } else if (model === 'triangleMedian' || model === 'areaTriangle') {
      const b=model==='triangleMedian'?6:p.base;
      P.A=[0,0];P.B=[b,0];P.C=[p.x,p.height];P.H=[p.x,0];P.M=[b/2,0];
      M.base=b;M.height=p.height;M.area=b*p.height/2;M.leftArea=M.area/2;M.rightArea=M.area/2;
      M.AC=hypot(P.A,P.C);M.BC=hypot(P.B,P.C);M.CM=hypot(P.C,P.M);M.AM=b/2;M.MB=b/2;
    } else if (model === 'triangleSides') {
      M.a=p.a;M.b=p.b;M.c=p.c;M.exists=p.a+p.b>p.c&&p.a+p.c>p.b&&p.b+p.c>p.a;
      if (M.exists) {
        const x=(p.b*p.b+p.c*p.c-p.a*p.a)/(2*p.c);
        P.A=[0,0];P.B=[p.c,0];P.C=[x,Math.sqrt(Math.max(0,p.b*p.b-x*x))];
        M.angles=[angleAt(P.B,P.A,P.C),angleAt(P.A,P.B,P.C),angleAt(P.A,P.C,P.B)];
      }
    } else if (['parallelogram','rhombus','rectangle'].includes(model)) {
      const base=model==='rectangle'?p.width:model==='rhombus'?p.side:p.base;
      const side=model==='rectangle'?p.height:p.side, angle=model==='rectangle'?90:p.angle;
      P.A=[0,0];P.B=[base,0];P.D=[side*Math.cos(angle*RAD),side*Math.sin(angle*RAD)];P.C=[base+P.D[0],P.D[1]];P.O=mid(P.A,P.C);P.H=[P.D[0],0];
      M.base=base;M.side=side;M.angle=angle;M.adjacent=180-angle;M.height=P.D[1];M.area=base*M.height;
      M.AC=hypot(P.A,P.C);M.BD=hypot(P.B,P.D);M.AO=M.AC/2;M.BO=M.BD/2;
      M.diagonalAngle=Math.min(angleAt(P.A,P.O,P.B),180-angleAt(P.A,P.O,P.B));
      M.BAC=angleAt(P.B,P.A,P.C);M.CAD=angleAt(P.C,P.A,P.D);M.ABD=angleAt(P.A,P.B,P.D);M.DBC=angleAt(P.D,P.B,P.C);
      M.perimeter=2*(base+side);
    } else if (model === 'trapezoid') {
      const x=(p.bottom-p.top)/2+p.offset;
      P.A=[0,0];P.B=[p.bottom,0];P.D=[x,p.height];P.C=[x+p.top,p.height];P.E=mid(P.A,P.D);P.F=mid(P.B,P.C);P.H=[x,0];
      M.bottom=p.bottom;M.top=p.top;M.height=p.height;M.midline=(p.top+p.bottom)/2;M.area=M.midline*p.height;
      M.AD=hypot(P.A,P.D);M.BC=hypot(P.B,P.C);M.AC=hypot(P.A,P.C);M.BD=hypot(P.B,P.D);
      const t=p.bottom/(p.bottom+p.top);
      P.O=[P.C[0]*t,P.C[1]*t];
      M.AO=hypot(P.A,P.O);M.OC=hypot(P.O,P.C);M.BO=hypot(P.B,P.O);M.OD=hypot(P.O,P.D);
      M.angles=[angleAt(P.B,P.A,P.D),angleAt(P.A,P.B,P.C),angleAt(P.B,P.C,P.D),angleAt(P.C,P.D,P.A)];
    } else if (model === 'circleChord') {
      const half=Math.sqrt(p.radius*p.radius-p.offset*p.offset);
      P.O=[0,0];P.A=[-half,p.offset];P.B=[half,p.offset];P.M=[0,p.offset];P.D=[-p.radius,0];P.E=[p.radius,0];
      M.radius=p.radius;M.offset=p.offset;M.chord=2*half;M.diameter=2*p.radius;
    } else if (model === 'circleAngle') {
      const at = a => [5*Math.cos(a*RAD),5*Math.sin(a*RAD)];
      P.O=[0,0];P.A=at(0);P.B=at(p.central);P.C=at(p.point);
      // Both C and D stay on the complement of the highlighted arc AB.
      P.D=at(p.point+(360-p.point)/2);
      M.central=p.central;M.inscribed=angleAt(P.A,P.C,P.B);M.secondInscribed=angleAt(P.A,P.D,P.B);
    } else if (model === 'similarity') {
      M.scale=p.scale;M.base=3;M.height=4;M.hypotenuse=5;M.area=6;M.perimeter=12;
      M.scaledArea=6*p.scale*p.scale;M.scaledPerimeter=12*p.scale;
    }
    return result;
  }

  const line=(a,b,color=INK,dash='')=>`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${color}" stroke-width="3"${dash?' stroke-dasharray="'+dash+'"':''}/>`;
  const text=(x,y,s,color=INK,anchor='middle')=>`<text x="${x}" y="${y}" fill="${color}" font-size="20" text-anchor="${anchor}" dominant-baseline="middle">${esc(s)}</text>`;
  const dot=(p,color=INK)=>`<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="${color}"/>`;
  const poly=pts=>`<polygon points="${pts.map(p=>p.join(',')).join(' ')}" fill="${LIGHT}" stroke="${INK}" stroke-width="3"/>`;
  function fit(points, box) {
    const b=box||{x:80,y:45,w:400,h:230}, xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
    const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
    const scale=Math.min(b.w/Math.max(maxX-minX,1),b.h/Math.max(maxY-minY,1));
    const x=b.x+(b.w-(maxX-minX)*scale)/2,y=b.y+(b.h-(maxY-minY)*scale)/2;
    return p=>[x+(p[0]-minX)*scale,y+(maxY-p[1])*scale];
  }
  function labelPoints(P, names, transform) {
    const positions=names.map(n=>transform(P[n])),center=[positions.reduce((a,p)=>a+p[0],0)/names.length,positions.reduce((a,p)=>a+p[1],0)/names.length];
    return names.map((n,i)=>{
      const p=positions[i],dx=p[0]-center[0],dy=p[1]-center[1],length=Math.hypot(dx,dy)||1;
      return dot(p)+text(p[0]+dx/length*23,p[1]+dy/length*23,n);
    }).join('');
  }
  function svg(title, body) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 340" role="img" aria-label="${esc(title)}" style="width:100%;height:auto;max-height:360px;display:block;font-family:system-ui,sans-serif"><title>${esc(title)}</title>${body}</svg>`;
  }

  function render(model, params) {
    const s=sample(model,params),p=s.values,P=s.points,M=s.metrics;
    let body='',readout=[],caption=defs[model].title;
    if (model==='adjacentAngles') {
      const vertical=p.focus==='vertical', O=[280,vertical?170:245],r=vertical?135:170,v=[r*Math.cos(p.angle*RAD),-r*Math.sin(p.angle*RAD)],Q=[O[0]+v[0],O[1]+v[1]],R=[O[0]-v[0]*(vertical?1:0.38),O[1]-v[1]*(vertical?1:0.38)];
      body=line([55,O[1]],[505,O[1]])+line(R,Q,BLUE)+dot(O)+text(O[0]-15,O[1]+22,'O');
      const arc=(start,end,color,rad)=>{
        const a=[O[0]+rad*Math.cos(start*RAD),O[1]-rad*Math.sin(start*RAD)],b=[O[0]+rad*Math.cos(end*RAD),O[1]-rad*Math.sin(end*RAD)];
        return `<path d="M ${a.join(' ')} A ${rad} ${rad} 0 0 0 ${b.join(' ')}" fill="none" stroke="${color}" stroke-width="2"/>`;
      };
      body+=arc(0,p.angle,BLUE,48)+(vertical?arc(180,180+p.angle,GREEN,48):arc(p.angle,180,GREEN,65));
      body+=text(O[0]+90*Math.cos(p.angle/2*RAD),O[1]-90*Math.sin(p.angle/2*RAD),'α',BLUE);
      body+=vertical?text(O[0]+85*Math.cos((p.angle/2+180)*RAD),O[1]-85*Math.sin((p.angle/2+180)*RAD),'γ',GREEN):text(O[0]+102*Math.cos((p.angle+180)/2*RAD),O[1]-102*Math.sin((p.angle+180)/2*RAD),'β',GREEN);
      readout=vertical?[`α = ${fmt(M.alpha)}°`,`γ = ${fmt(M.alpha)}°`]:[`α = ${fmt(M.alpha)}°`,`β = ${fmt(M.beta)}°`,`α + β = ${fmt(M.sum)}°`];
    } else if (model==='triangleAngles') {
      const T=fit([P.A,P.B,P.C]);body=poly([T(P.A),T(P.B),T(P.C)])+labelPoints(P,['A','B','C'],T);
      const center=mid(mid(T(P.A),T(P.B)),T(P.C));
      ['A','B','C'].forEach((name,i)=>{const q=T(P[name]),dx=center[0]-q[0],dy=center[1]-q[1],l=Math.hypot(dx,dy)||1;body+=text(q[0]+dx/l*42,q[1]+dy/l*42,fmt([M.a,M.b,M.c][i])+'°',BLUE);});
      readout=[`∠A = ${fmt(M.a)}°`,`∠B = ${fmt(M.b)}°`,`∠C = ${fmt(M.c)}°`,`Сумма = ${fmt(M.a+M.b+M.c)}°`];
    } else if (model==='triangleMedian'||model==='areaTriangle') {
      const T=fit(Object.values(P));body=poly([T(P.A),T(P.B),T(P.C)])+labelPoints(P,['A','B','C'],T)+line(T(P.C),T(P.H),GREEN,'7 5');
      const h=T(P.H),direction=p.x<0?-1:1;
      body+=`<path d="M ${h[0]} ${h[1]-13} h ${13*direction} v 13" fill="none" stroke="${GREEN}" stroke-width="2"/>`;
      if(p.x<0||p.x>M.base)body+=line(T(P.A),T(P.H),INK,'5 5');
      if(model==='triangleMedian') {
        body+=line(T(P.C),T(P.M),BLUE)+dot(T(P.M),BLUE)+text(T(P.M)[0],T(P.M)[1]+25,Math.abs(p.x-3)<0.05?'M = H':'M',BLUE);
        if(Math.abs(p.x-3)>=0.05)body+=text(h[0],h[1]+25,'H',GREEN);
        readout=p.focus==='area'?[`S(ACM) = ${fmt(M.leftArea)}`,`S(BCM) = ${fmt(M.rightArea)}`,`AM = MB = ${fmt(M.AM)}`,`CH = ${fmt(M.height)}`]:[`AM = MB = ${fmt(M.AM)}`,`CM = ${fmt(M.CM)}`,`CH = ${fmt(M.height)}`,`AC = ${fmt(M.AC)}`,`BC = ${fmt(M.BC)}`];
      } else {
        if(Math.abs(p.x)>0.05&&Math.abs(p.x-M.base)>0.05)body+=text(h[0],h[1]+25,'H',GREEN);
        readout=[`AB = ${fmt(M.base)}`,`Высота = ${fmt(M.height)}`,`Площадь = ${fmt(M.area)}`];
      }
    } else if(model==='triangleSides') {
      if(M.exists) {
        const T=fit([P.A,P.B,P.C]);body=poly([T(P.A),T(P.B),T(P.C)])+labelPoints(P,['A','B','C'],T);
        const edges=[['B','C',M.a],['A','C',M.b],['A','B',M.c]];
        edges.forEach(([a,b,n])=>{const q=mid(T(P[a]),T(P[b]));body+=text(q[0],q[1]+(a==='A'&&b==='B'?25:-18),fmt(n),BLUE);});
        readout=[`a + b = ${fmt(p.a+p.b)}`,`c = ${fmt(p.c)}`,`Углы: ${M.angles.map(a=>fmt(a)+'°').join('; ')}`];
      } else {
        const max=Math.max(p.a,p.b,p.c),scale=380/max;
        [p.a,p.b,p.c].forEach((n,i)=>{const y=75+i*82;body+=line([85,y],[85+n*scale,y],i===2?GREEN:BLUE)+dot([85,y])+dot([85+n*scale,y])+text(280,y-24,['a','b','c'][i]+' = '+fmt(n));});
        caption='Три заданных отрезка: проверь, можно ли замкнуть их в треугольник';
        readout=[`a + b = ${fmt(p.a+p.b)}`,`a + c = ${fmt(p.a+p.c)}`,`b + c = ${fmt(p.b+p.c)}`];
      }
    } else if(['parallelogram','rhombus','rectangle'].includes(model)) {
      const T=fit([P.A,P.B,P.C,P.D,P.H]);body=poly(['A','B','C','D'].map(n=>T(P[n])))+labelPoints(P,['A','B','C','D'],T);
      const focus=p.focus||'diagonals';
      if(focus==='area') {
        body+=line(T(P.D),T(P.H),GREEN,'7 5');const h=T(P.H);body+=text(h[0],h[1]+24,'H',GREEN);
        if(P.H[0]<0)body+=line(T(P.A),h,INK,'5 5');
        readout=[`AB = ${fmt(M.base)}`,`Высота DH = ${fmt(M.height)}`,`Площадь = ${fmt(M.area)}`,`Периметр = ${fmt(M.perimeter)}`];
      } else if(focus==='angles') {
        readout=[`∠A = ∠C = ${fmt(M.angle)}°`,`∠B = ∠D = ${fmt(M.adjacent)}°`];
      } else if(focus==='sides') {
        readout=[`AB = CD = ${fmt(M.base)}`,`AD = BC = ${fmt(M.side)}`,`∠A = ${fmt(M.angle)}°`];
      } else {
        body+=line(T(P.A),T(P.C),BLUE)+line(T(P.B),T(P.D),GREEN)+dot(T(P.O))+text(T(P.O)[0]+12,T(P.O)[1]+22,'O');
        readout=focus==='bisectors'?[`∠BAC = ${fmt(M.BAC)}°`,`∠CAD = ${fmt(M.CAD)}°`,`∠ABD = ${fmt(M.ABD)}°`,`∠DBC = ${fmt(M.DBC)}°`]:[`AC = ${fmt(M.AC)}`,`BD = ${fmt(M.BD)}`,`AO = OC = ${fmt(M.AO)}`,`BO = OD = ${fmt(M.BO)}`,`Угол между диагоналями: ${fmt(M.diagonalAngle)}°`];
      }
      if(model==='rectangle') {const a=T(P.A);body+=`<path d="M ${a[0]+15} ${a[1]} v -15 h -15" fill="none" stroke="${INK}" stroke-width="2"/>`;}
    } else if(model==='trapezoid') {
      const T=fit(Object.values(P));body=poly(['A','B','C','D'].map(n=>T(P[n])))+labelPoints(P,['A','B','C','D'],T);
      const focus=p.focus||'midline';
      if(focus==='diagonals') {
        body+=line(T(P.A),T(P.C),BLUE)+line(T(P.B),T(P.D),GREEN)+dot(T(P.O))+text(T(P.O)[0]+12,T(P.O)[1]+22,'O');
        readout=[`AC = ${fmt(M.AC)}; BD = ${fmt(M.BD)}`,`AO = ${fmt(M.AO)}; OC = ${fmt(M.OC)}`,`BO = ${fmt(M.BO)}; OD = ${fmt(M.OD)}`,`AD = ${fmt(M.AD)}; BC = ${fmt(M.BC)}`];
      } else if(focus==='sides') readout=[`AB = ${fmt(M.bottom)}`,`CD = ${fmt(M.top)}`,`AD = ${fmt(M.AD)}`,`BC = ${fmt(M.BC)}`];
      else if(focus==='angles') readout=M.angles.map((a,i)=>`∠${'ABCD'[i]} = ${fmt(a)}°`);
      else if(focus==='area') {
        body+=line(T(P.D),T(P.H),GREEN,'7 5');if(P.H[0]<0)body+=line(T(P.A),T(P.H),INK,'5 5');
        readout=[`Основания: ${fmt(M.bottom)} и ${fmt(M.top)}`,`Высота = ${fmt(M.height)}`,`Площадь = ${fmt(M.area)}`];
      } else {
        body+=line(T(P.E),T(P.F),BLUE)+dot(T(P.E),BLUE)+dot(T(P.F),BLUE)+text(T(P.E)[0]-20,T(P.E)[1],'E',BLUE)+text(T(P.F)[0]+20,T(P.F)[1],'F',BLUE);
        readout=[`AB = ${fmt(M.bottom)}`,`CD = ${fmt(M.top)}`,`EF = ${fmt(M.midline)}`,`E и F — середины боковых сторон`];
      }
    } else if(model==='circleChord') {
      const r=110,ratio=r/p.radius,T=q=>[280+q[0]*ratio,170-q[1]*ratio];
      body=`<circle cx="280" cy="170" r="${r}" fill="${LIGHT}" stroke="${INK}" stroke-width="3"/>`+line(T(P.D),T(P.E),INK,'6 5')+line(T(P.A),T(P.B),BLUE)+line(T(P.O),T(P.M),GREEN)+dot(T(P.O))+text(292,193,'O');
      body+=text(T(P.A)[0]-18,T(P.A)[1]-16,'A',BLUE)+text(T(P.B)[0]+18,T(P.B)[1]-16,'B',BLUE)+text(280,304,'Диаметр — пунктир');
      readout=[`Радиус = ${fmt(M.radius)}`,`Диаметр = ${fmt(M.diameter)}`,`Хорда AB = ${fmt(M.chord)}`,`Расстояние до хорды = ${fmt(M.offset)}`];
    } else if(model==='circleAngle') {
      const T=q=>[280+q[0]*22,165-q[1]*22];
      body=`<circle cx="280" cy="165" r="110" fill="${LIGHT}" stroke="${INK}" stroke-width="3"/>`;
      body+=line(T(P.O),T(P.A),BLUE)+line(T(P.O),T(P.B),BLUE)+line(T(P.C),T(P.A),GREEN)+line(T(P.C),T(P.B),GREEN);
      const a=T(P.A),b=T(P.B);body+=`<path d="M ${a.join(' ')} A 110 110 0 0 0 ${b.join(' ')}" fill="none" stroke="${BLUE}" stroke-width="6"/>`;
      body+=dot(T(P.O))+text(268,187,'O')+labelPoints(P,['A','B','C'],T);
      readout=[`∠AOB = ${fmt(M.central)}°`,`∠ACB = ${fmt(M.inscribed)}°`];
      if(p.compare) {body+=line(T(P.D),T(P.A),GREEN,'6 5')+line(T(P.D),T(P.B),GREEN,'6 5')+dot(T(P.D),GREEN)+text(T(P.D)[0]+18,T(P.D)[1]+18,'D',GREEN);readout.push(`∠ADB = ${fmt(M.secondInscribed)}°`);}
      body+=text(280,315,p.compare?'C и D — вне выделенной дуги':'C — вне выделенной дуги',INK);
    } else if(model==='similarity') {
      const k=p.scale,u=21,origin1=[80,280],origin2=[275,280],triangle=(o,f)=>[[o[0],o[1]],[o[0]+3*u*f,o[1]],[o[0],o[1]-4*u*f]];
      const a=triangle(origin1,1),b=triangle(origin2,k);
      // Both triangles use the same units per pixel: area visibly scales by k squared.
      body=poly(a)+poly(b)+text(115,325,'Исходный')+text(365,325,'Подобный');
      body+=text((a[0][0]+a[1][0])/2,303,'3',BLUE)+text(a[0][0]-22,(a[0][1]+a[2][1])/2,'4',BLUE)+text((a[1][0]+a[2][0])/2+18,(a[1][1]+a[2][1])/2,'5',BLUE);
      body+=text((b[0][0]+b[1][0])/2,303,fmt(3*k),BLUE)+text(b[0][0]-22,(b[0][1]+b[2][1])/2,fmt(4*k),BLUE)+text((b[1][0]+b[2][0])/2+18,(b[1][1]+b[2][1])/2,fmt(5*k),BLUE);
      readout=[`Стороны увеличены в ${fmt(k)} раза`,`Периметры: ${fmt(M.perimeter)} и ${fmt(M.scaledPerimeter)}`,`Площади: ${fmt(M.area)} и ${fmt(M.scaledArea)}`];
    }
    return {svg:svg(caption,body),readout,sample:s};
  }

  let mountIndex=0;
  function mount(host,hint) {
    if(!host||!hint)throw new Error('A hint host and data are required');
    host.replaceChildren();
    if(!hint.model) {
      if(!hint.svg)throw new Error('Visual hint is missing a model or drawing');
      const figure=host.ownerDocument.createElement('div');figure.className='t19-model-figure';figure.innerHTML=hint.svg;host.appendChild(figure);
      return ()=>host.replaceChildren();
    }
    let params=valuesFor(hint.model,hint.params),active=true;
    const doc=host.ownerDocument,figure=doc.createElement('div'),readout=doc.createElement('ul'),controls=doc.createElement('div');
    figure.className='t19-model-figure';readout.className='t19-model-readout';readout.setAttribute('aria-live','polite');controls.className='t19-model-controls';
    host.append(figure,readout,controls);
    const inputs=[],listeners=[],id=++mountIndex;
    function draw() {
      const result=render(hint.model,params);params=result.sample.values;figure.innerHTML=result.svg;readout.replaceChildren();
      result.readout.forEach(s=>{const li=doc.createElement('li');li.textContent=s;readout.append(li);});
      const bounds=controlsFor(hint.model,params);
      inputs.forEach(({input,output,key})=>{const bound=bounds.find(c=>c.key===key);if(!bound)return;input.min=bound.min;input.max=bound.max;input.value=params[key];output.textContent=fmt(params[key])+bound.unit;});
    }
    controlsFor(hint.model,params).forEach(c=>{
      const wrap=doc.createElement('div'),label=doc.createElement('label'),input=doc.createElement('input'),output=doc.createElement('output');
      wrap.className='t19-model-control';input.type='range';input.id=`t19-model-${id}-${c.key}`;input.min=c.min;input.max=c.max;input.step=c.step;input.value=c.value;
      label.htmlFor=input.id;label.textContent=c.label;output.htmlFor=input.id;
      const onInput=()=>{if(active){params[c.key]=Number(input.value);draw();}};input.addEventListener('input',onInput);listeners.push([input,onInput]);
      wrap.append(label,output,input);controls.append(wrap);inputs.push({input,output,key:c.key});
    });
    draw();
    return ()=>{active=false;listeners.forEach(([input,listener])=>input.removeEventListener('input',listener));host.replaceChildren();};
  }
  return {mount,sample,render,controlsFor,modelNames:Object.keys(defs)};
});

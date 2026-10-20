/* Small, deterministic geometry experiments for the optional task 19 hints. */
(function (root, factory) {
  const extensions = typeof module === 'object' && module.exports
    ? [require('./task19-models-triangles.js'), require('./task19-models-circles.js'), require('./task19-models-lines-polygons.js')]
    : [root.Task19TriangleModels, root.Task19CircleModels, root.Task19LinePolygonModels];
  const api = factory(extensions);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Task19Visuals = api;
})(typeof window === 'object' ? window : globalThis, function (extensions) {
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
    rhombus: {title:'Ромб ABCD', values:{side:4,angle:65}, controls:[['side','Длина стороны',2,6,0.5,''],['angle','Угол A',30,150,1,'°']], controlsFor:p=>[...(p.focus==='area'?[['side','Длина стороны',2,6,0.5,'']]:[]),['angle','Угол A',30,150,1,'°']]},
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
    let p = Object.assign({}, def.values, params || {});
    def.controls.forEach(([key,,lo,hi]) => { p[key] = clamp(finite(p[key], def.values[key]), lo, hi); });
    if (model === 'triangleAngles') p.b = Math.min(p.b, 170 - p.a);
    if (model === 'circleChord') p.offset = Math.min(p.offset, p.radius - 0.1);
    if (model === 'circleAngle') {
      if (p.diameter) p.central = 180;
      p.point = clamp(p.point, p.central + 20, p.compare ? 300 : 340);
    }
    if (model === 'trapezoid') p.top = Math.min(p.top, p.bottom - 0.5);
    if (def.normalize) p = def.normalize(p);
    if (def.controlsFor) def.controlsFor(p).forEach(([key,,lo,hi])=>{p[key]=clamp(finite(p[key],def.values[key]),lo,hi);});
    if (def.normalize) p = def.normalize(p);
    return p;
  }

  function controlsFor(model, params) {
    const p = valuesFor(model, params);
    const locked = Array.isArray(p.locked) ? p.locked : [];
    const definition = defs[model];
    return (definition.controlsFor ? definition.controlsFor(p) : definition.controls).filter(([key]) => !locked.includes(key) && !(model === 'circleAngle' && p.diameter && key === 'central')).map(([key,label,min,max,step,unit,choices,meta]) => ({
      key,label,min,
      max: model === 'triangleAngles' && key === 'b' ? Math.min(max,170-p.a) : model === 'circleChord' && key === 'offset' ? p.radius-0.1 : max,
      step,unit,value:p[key],choices,...(meta||{}),
      ...(model === 'circleAngle' && key === 'point' ? {min:p.central+20,max:p.compare?300:340} : {})
    }));
  }

  function updateModel(model,params,key,value) {
    const p=valuesFor(model,params),control=controlsFor(model,p).find(c=>c.key===key);
    if(!control)return p;
    const next=clamp(finite(value,p[key]),control.min,control.max);
    return valuesFor(model,defs[model].update?defs[model].update(p,key,next):{...p,[key]:next});
  }

  function sample(model, params) {
    const p = valuesFor(model, params), result = {model,values:p,points:{},metrics:{}};
    if (defs[model].sample) return Object.assign(result, defs[model].sample(p), {model,values:p});
    const P = result.points, M = result.metrics;
    if (model === 'adjacentAngles') {
      M.alpha=p.angle; M.beta=180-p.angle; M.sum=180;
      P.O=[0,0];P.A=[1,0];P.B=[-1,0];P.C=[Math.cos(p.angle*RAD),Math.sin(p.angle*RAD)];P.D=[-P.C[0],-P.C[1]];
    } else if (model === 'triangleAngles') {
      M.a=p.a; M.b=p.b; M.c=180-p.a-p.b;
      const ac=6*Math.sin(p.b*RAD)/Math.sin(M.c*RAD);
      P.A=[0,0]; P.B=[6,0]; P.C=[ac*Math.cos(p.a*RAD),ac*Math.sin(p.a*RAD)];
    } else if (model === 'triangleMedian' || model === 'areaTriangle') {
      const b=model==='triangleMedian'?6:p.base;
      P.A=[0,0];P.B=[b,0];P.C=[p.x,p.height];P.H=[p.x,0];P.M=[b/2,0];
      M.base=b;M.height=p.height;M.area=b*p.height/2;M.leftArea=M.area/2;M.rightArea=M.area/2;
      M.AC=hypot(P.A,P.C);M.BC=hypot(P.B,P.C);M.CM=hypot(P.C,P.M);M.AM=b/2;M.MB=b/2;
      M.ACM=angleAt(P.A,P.C,P.M);M.MCB=angleAt(P.M,P.C,P.B);
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
      P.A=[0,0];P.B=[3,0];P.C=[0,4];P.A2=[0,0];P.B2=[3*p.scale,0];P.C2=[0,4*p.scale];
    }
    return result;
  }

  const line=(a,b,color=INK,dash='')=>`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${color}" stroke-width="3"${dash?' stroke-dasharray="'+dash+'"':''}/>`;
  const text=(x,y,s,color=INK,anchor='middle')=>`<text x="${x}" y="${y}" fill="${color}" font-size="20" text-anchor="${anchor}" dominant-baseline="middle">${esc(s)}</text>`;
  const dot=(p,color=INK)=>`<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="${color}"/>`;
  const poly=pts=>`<polygon points="${pts.map(p=>p.join(',')).join(' ')}" fill="${LIGHT}" stroke="${INK}" stroke-width="3"/>`;
  function tick(a,b,count=1,color=BLUE) {
    const length=hypot(a,b);if(length<1e-8)return '';
    const u=[(b[0]-a[0])/length,(b[1]-a[1])/length],m=mid(a,b);
    return `<g data-geometry-mark="equal-segment">${Array.from({length:count},(_,i)=>{
      const d=(i-(count-1)/2)*6,c=[m[0]+u[0]*d,m[1]+u[1]*d];
      return line([c[0]-u[1]*6,c[1]+u[0]*6],[c[0]+u[1]*6,c[1]-u[0]*6],color);
    }).join('')}</g>`;
  }
  function rightMark(a,v,b,color=GREEN,size=11) {
    const la=hypot(a,v),lb=hypot(b,v);if(la<1e-8||lb<1e-8)return '';
    const r=Math.min(size,la*.3,lb*.3),u=[(a[0]-v[0])/la*r,(a[1]-v[1])/la*r],w=[(b[0]-v[0])/lb*r,(b[1]-v[1])/lb*r];
    return `<path data-geometry-mark="right-angle" d="M ${v[0]+u[0]} ${v[1]+u[1]} L ${v[0]+u[0]+w[0]} ${v[1]+u[1]+w[1]} L ${v[0]+w[0]} ${v[1]+w[1]}" fill="none" stroke="${color}" stroke-width="2.5"/>`;
  }
  function angleMark(a,v,b,color=BLUE,count=1,r=23) {
    const angle=angleAt(a,v,b);if(!Number.isFinite(angle))return '';
    if(Math.abs(angle-90)<1e-6)return rightMark(a,v,b,color);
    const start=Math.atan2(a[1]-v[1],a[0]-v[0]);let delta=Math.atan2(b[1]-v[1],b[0]-v[0])-start;
    while(delta>Math.PI)delta-=2*Math.PI;while(delta< -Math.PI)delta+=2*Math.PI;
    const maxRadius=Math.min(hypot(a,v),hypot(b,v))*.4,gap=Math.min(5,maxRadius/(count+1)),startRadius=Math.min(r,maxRadius-gap*(count-1));
    return `<g data-geometry-mark="angle" data-angle="${angle}">${Array.from({length:count},(_,i)=>{
      const radius=startRadius+i*gap,p=[v[0]+radius*Math.cos(start),v[1]+radius*Math.sin(start)],q=[v[0]+radius*Math.cos(start+delta),v[1]+radius*Math.sin(start+delta)];
      return `<path d="M ${p.join(' ')} A ${radius} ${radius} 0 0 ${delta>0?1:0} ${q.join(' ')}" fill="none" stroke="${color}" stroke-width="2.5"/>`;
    }).join('')}</g>`;
  }
  const linked=(key,body,label='')=>`<g data-geometry-group="${esc(key)}" tabindex="0" role="img" aria-label="${esc(label||key)}">${body}</g>`;
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
    if (defs[model].render) {
      const output=defs[model].render(s);
      return {svg:output.svg||svg(p.title||defs[model].title,output.body),readout:output.readout||[],sample:s};
    }
    let body='',readout=[],caption=p.title||defs[model].title;
    if (model==='adjacentAngles') {
      const vertical=p.focus==='vertical', O=[280,vertical?170:245],r=vertical?135:170,v=[r*Math.cos(p.angle*RAD),-r*Math.sin(p.angle*RAD)],Q=[O[0]+v[0],O[1]+v[1]],R=[O[0]-v[0]*(vertical?1:0.38),O[1]-v[1]*(vertical?1:0.38)];
      body=line([55,O[1]],[505,O[1]])+line(R,Q,BLUE)+dot(O)+text(O[0]-15,O[1]+22,'O');
      body+=angleMark([505,O[1]],O,Q,BLUE,1,48)+(vertical?angleMark([55,O[1]],O,R,BLUE,1,48):angleMark(Q,O,[55,O[1]],Math.abs(p.angle-90)<1e-8?BLUE:GREEN,Math.abs(p.angle-90)<1e-8?1:2,55));
      body+=text(O[0]+90*Math.cos(p.angle/2*RAD),O[1]-90*Math.sin(p.angle/2*RAD),'α',BLUE);
      body+=vertical?text(O[0]+85*Math.cos((p.angle/2+180)*RAD),O[1]-85*Math.sin((p.angle/2+180)*RAD),'γ',GREEN):text(O[0]+102*Math.cos((p.angle+180)/2*RAD),O[1]-102*Math.sin((p.angle+180)/2*RAD),'β',GREEN);
      readout=vertical?[`α = ${fmt(M.alpha)}°`,`γ = ${fmt(M.alpha)}°`]:[`α = ${fmt(M.alpha)}°`,`β = ${fmt(M.beta)}°`,`α + β = ${fmt(M.sum)}°`];
    } else if (model==='triangleAngles') {
      const T=fit([P.A,P.B,P.C]);body=poly([T(P.A),T(P.B),T(P.C)])+labelPoints(P,['A','B','C'],T);
      const center=mid(mid(T(P.A),T(P.B)),T(P.C));
      ['A','B','C'].forEach((n,i)=>{const angles=[M.a,M.b,M.c],index=angles.findIndex(a=>Math.abs(a-angles[i])<1e-7),names=['A','B','C'];body+=angleMark(T(P[names[(i+2)%3]]),T(P[n]),T(P[names[(i+1)%3]]),[BLUE,GREEN,'#a65017'][index],index+1);});
      ['A','B','C'].forEach((name,i)=>{const q=T(P[name]),dx=center[0]-q[0],dy=center[1]-q[1],l=Math.hypot(dx,dy)||1;body+=text(q[0]+dx/l*42,q[1]+dy/l*42,fmt([M.a,M.b,M.c][i])+'°',BLUE);});
      readout=[`∠A = ${fmt(M.a)}°`,`∠B = ${fmt(M.b)}°`,`∠C = ${fmt(M.c)}°`,`Сумма = ${fmt(M.a+M.b+M.c)}°`];
    } else if (model==='triangleMedian'||model==='areaTriangle') {
      const T=fit(Object.values(P));body=poly([T(P.A),T(P.B),T(P.C)])+labelPoints(P,['A','B','C'],T)+line(T(P.C),T(P.H),GREEN,'7 5');
      const h=T(P.H),direction=p.x<0?-1:1;
      body+=rightMark(T(P.C),h,[h[0]+30*direction,h[1]],GREEN,13);
      if(p.x<0||p.x>M.base)body+=line(T(P.A),T(P.H),INK,'5 5');
      if(model==='triangleMedian') {
        body+=tick(T(P.A),T(P.M),1,BLUE)+tick(T(P.M),T(P.B),1,BLUE)+line(T(P.C),T(P.M),BLUE)+dot(T(P.M),BLUE)+text(T(P.M)[0],T(P.M)[1]+25,Math.abs(p.x-3)<0.05?'M = H':'M',BLUE);
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
      const T=model==='rhombus'&&p.focus==='area'?fit([[-6,0],[12,6]]):fit([P.A,P.B,P.C,P.D,P.H]);
      const names=['A','B','C','D'],Q=Object.fromEntries(names.concat(['O','H']).map(n=>[n,T(P[n])]));
      body=poly(names.map(n=>Q[n]));
      const focus=p.focus||'diagonals',equalSides=Math.abs(M.base-M.side)<1e-8;
      const lengths=[],markStyle=value=>{let i=lengths.findIndex(x=>Math.abs(x-value)<1e-7);if(i<0){i=lengths.length;lengths.push(value);}return {count:i+1,color:[BLUE,GREEN,'#a65017','#7849a5'][i]};};
      const sideStyle=markStyle(M.base),otherSideStyle=markStyle(M.side),acStyle=markStyle(M.AO),bdStyle=markStyle(M.BO);
      const colors=[sideStyle.color,otherSideStyle.color,sideStyle.color,otherSideStyle.color];
      names.forEach((n,i)=>{
        const next=names[(i+1)%4],prev=names[(i+3)%4],group=i%2===0||equalSides?'side-ab':'side-ad';
        body+=linked(group,line(Q[n],Q[next],colors[i])+tick(Q[n],Q[next],i%2===0?sideStyle.count:otherSideStyle.count,colors[i]),`Сторона ${n+next}`);
        if(Math.abs(M.angle-90)<1e-8)body+=rightMark(Q[prev],Q[n],Q[next],INK);
        else if(focus==='angles')body+=linked(i%2===0?'angle-a':'angle-b',angleMark(Q[prev],Q[n],Q[next],i%2===0?BLUE:GREEN,i%2===0?1:2),`Угол ${n}`);
      });
      if(focus==='area') {
        body+=line(Q.D,Q.H,GREEN,'7 5')+rightMark(Q.D,Q.H,[Q.H[0]+30,Q.H[1]],GREEN);
        if(P.H[0]<0||P.H[0]>M.base)body+=line(Q.A,Q.H,INK,'5 5');
        body+=text(Q.H[0],Q.H[1]+28,Math.abs(P.H[0])<1e-8?'A = H':'H',GREEN);
        readout=[`AB = ${fmt(M.base)}`,`Высота DH = ${fmt(M.height)}`,`Площадь = ${fmt(M.area)}`,`Периметр = ${fmt(M.perimeter)}`];
      } else if(focus==='angles') {
        readout=names.map((n,i)=>({text:`∠${n} = ${fmt(i%2===0?M.angle:M.adjacent)}°`,color:i%2===0?BLUE:GREEN,group:i%2===0?'angle-a':'angle-b'}));
        if(p.locked?.includes('angle')&&M.angle===90)readout.push('360 : 4 = 90°');
      } else if(focus==='sides') {
        readout=names.map((n,i)=>({text:`${n+names[(i+1)%4]} = ${fmt(i%2===0?M.base:M.side)}`,color:colors[i],group:i%2===0||equalSides?'side-ab':'side-ad'}));
        readout.push(`∠A = ${fmt(M.angle)}°`);
      } else {
        if(p.compareTriangleParts){
          const triangle=(ns,color,group)=>linked(group,`<polygon points="${ns.map(n=>Q[n].join(',')).join(' ')}" fill="${color}" fill-opacity=".18" stroke="${color}" stroke-width="3"/>`,ns.join(''));
          body+=triangle(['A','O','B'],BLUE,'part-aob')+triangle(['B','O','C'],'#a65017','part-boc');
        }
        body+=linked('diagonal-ac',line(Q.A,Q.C,acStyle.color)+tick(Q.A,Q.O,acStyle.count,acStyle.color)+tick(Q.O,Q.C,acStyle.count,acStyle.color),'Диагональ AC');
        const bdColor=bdStyle.color,bdTicks=bdStyle.count;
        body+=linked('diagonal-bd',line(Q.B,Q.D,bdColor)+tick(Q.B,Q.O,bdTicks,bdColor)+tick(Q.O,Q.D,bdTicks,bdColor),'Диагональ BD');
        body+=dot(Q.O)+text(Q.O[0]+16,Q.O[1]+25,'O');
        if(Math.abs(M.diagonalAngle-90)<1e-6)body+=rightMark(Q.A,Q.O,Q.B,INK);
        readout=focus==='bisectors'?[`∠BAC = ${fmt(M.BAC)}°`,`∠CAD = ${fmt(M.CAD)}°`,`∠ABD = ${fmt(M.ABD)}°`,`∠DBC = ${fmt(M.DBC)}°`]:[
          {text:`AC = ${fmt(M.AC)}`,color:acStyle.color,group:'diagonal-ac'},
          {text:`AO = ${fmt(M.AO)}`,color:acStyle.color,group:'diagonal-ac'},
          {text:`OC = ${fmt(M.AO)}`,color:acStyle.color,group:'diagonal-ac'},
          {text:`BD = ${fmt(M.BD)}`,color:bdColor,group:'diagonal-bd'},
          {text:`BO = ${fmt(M.BO)}`,color:bdColor,group:'diagonal-bd'},
          {text:`OD = ${fmt(M.BO)}`,color:bdColor,group:'diagonal-bd'},
          `Угол между диагоналями: ${fmt(M.diagonalAngle)}°`];
        if(focus==='bisectors'){
          for(const [a,v,b,k] of [['B','A','C',0],['C','A','D',1],['A','B','D',2],['D','B','C',3]]){
            const values=[M.BAC,M.CAD,M.ABD,M.DBC],index=values.findIndex(x=>Math.abs(x-values[k])<1e-7);
            body+=angleMark(Q[a],Q[v],Q[b],[BLUE,GREEN,'#a65017','#7849a5'][index],index+1,25);
          }
        }
      }
      if(p.measureSides){
        // Each opposite pair is parallel; adjacent sides are not called parallel.
        for(const [a,b] of [['A','B'],['D','C'],['A','D'],['B','C']]){
          const u=[Q[b][0]-Q[a][0],Q[b][1]-Q[a][1]],len=Math.hypot(...u),d=u.map(v=>v/len*24);
          body+=line([Q[a][0]-d[0],Q[a][1]-d[1]],Q[a],'#a73737','5 5')+line(Q[b],[Q[b][0]+d[0],Q[b][1]+d[1]],'#a73737','5 5');
        }
        readout.push('AB ∥ CD','AD ∥ BC');
      }
      body+=labelPoints(P,names.filter(n=>!(focus==='area'&&n==='A'&&Math.abs(P.H[0])<1e-8)),T);
    } else if(model==='trapezoid') {
      const T=fit(Object.values(P)),names=['A','B','C','D'],Q=Object.fromEntries(Object.keys(P).map(n=>[n,T(P[n])]));
      body=poly(names.map(n=>Q[n]));
      const focus=p.focus||'midline';
      body+=line(Q.D,Q.H,GREEN,'7 5')+rightMark(Q.D,Q.H,[Q.H[0]+30,Q.H[1]],GREEN);
      if(P.H[0]<0||P.H[0]>M.bottom)body+=line(Q.A,Q.H,INK,'5 5');
      body+=dot(Q.H,GREEN)+text(Q.H[0],Q.H[1]+28,Math.abs(P.H[0])<1e-8?'A = H':'H',GREEN);
      if(focus==='diagonals') {
        body+=line(Q.A,Q.C,BLUE)+line(Q.B,Q.D,GREEN)+dot(Q.O)+text(Q.O[0]+12,Q.O[1]+22,'O');
        readout=[`AC = ${fmt(M.AC)}`,`BD = ${fmt(M.BD)}`,`AO = ${fmt(M.AO)}`,`OC = ${fmt(M.OC)}`,`BO = ${fmt(M.BO)}`,`OD = ${fmt(M.OD)}`,`AD = ${fmt(M.AD)}`,`BC = ${fmt(M.BC)}`];
      } else if(focus==='sides') readout=[`AB = ${fmt(M.bottom)}`,`CD = ${fmt(M.top)}`,`AD = ${fmt(M.AD)}`,`BC = ${fmt(M.BC)}`];
      else if(focus==='angles') {
        readout=M.angles.map((a,i)=>`∠${names[i]} = ${fmt(a)}°`);
        names.forEach((n,i)=>{const index=M.angles.findIndex(a=>Math.abs(a-M.angles[i])<1e-7);body+=angleMark(Q[names[(i+3)%4]],Q[n],Q[names[(i+1)%4]],[BLUE,GREEN,'#a65017','#7849a5'][index],index+1);});
      } else if(focus==='area') {
        readout=[`AB = ${fmt(M.bottom)}`,`CD = ${fmt(M.top)}`,`DH = ${fmt(M.height)}`,`S = (${fmt(M.bottom)} + ${fmt(M.top)}) : 2 · ${fmt(M.height)} = ${fmt(M.area)}`,`AB · DH = ${fmt(M.bottom*M.height)}`,`CD · DH = ${fmt(M.top*M.height)}`];
      } else {
        body+=line(Q.E,Q.F,BLUE)+dot(Q.E,BLUE)+dot(Q.F,BLUE)+text(Q.E[0]-20,Q.E[1],'E',BLUE)+text(Q.F[0]+20,Q.F[1],'F',BLUE);
        body+=tick(Q.A,Q.E,1,BLUE)+tick(Q.E,Q.D,1,BLUE)+tick(Q.B,Q.F,2,GREEN)+tick(Q.F,Q.C,2,GREEN);
        readout=[`AB = ${fmt(M.bottom)}`,`CD = ${fmt(M.top)}`,`EF = ${fmt(M.midline)}`,`E и F — середины боковых сторон`];
      }
      if(focus!=='area')readout.push(`Высота DH = ${fmt(M.height)}`);
      body+=labelPoints(P,names.filter(n=>!(n==='A'&&Math.abs(P.H[0])<1e-8)),T);
    } else if(model==='circleChord') {
      const r=110,ratio=r/p.radius,T=q=>[280+q[0]*ratio,170-q[1]*ratio];
      body=`<circle cx="280" cy="170" r="${r}" fill="${LIGHT}" stroke="${INK}" stroke-width="3"/>`+line(T(P.D),T(P.E),INK,'6 5')+line(T(P.A),T(P.B),BLUE)+line(T(P.O),T(P.M),GREEN)+dot(T(P.O))+text(292,193,'O');
      body+=tick(T(P.A),T(P.M),1,BLUE)+tick(T(P.M),T(P.B),1,BLUE);
      if(p.offset>1e-8)body+=rightMark(T(P.O),T(P.M),T(P.B),GREEN)+dot(T(P.M),GREEN)+text(T(P.M)[0]+15,T(P.M)[1]-20,'M',GREEN);
      body+=text(T(P.A)[0]-18,T(P.A)[1]-16,'A',BLUE)+text(T(P.B)[0]+18,T(P.B)[1]-16,'B',BLUE)+text(280,304,'Диаметр — пунктир');
      readout=[`Радиус = ${fmt(M.radius)}`,`Диаметр = ${fmt(M.diameter)}`,`Хорда AB = ${fmt(M.chord)}`,`Расстояние до хорды = ${fmt(M.offset)}`];
    } else if(model==='circleAngle') {
      const T=q=>[280+q[0]*22,165-q[1]*22];
      body=`<circle cx="280" cy="165" r="110" fill="${LIGHT}" stroke="${INK}" stroke-width="3"/>`;
      body+=line(T(P.O),T(P.A),BLUE)+line(T(P.O),T(P.B),BLUE)+line(T(P.C),T(P.A),GREEN)+line(T(P.C),T(P.B),GREEN);
      const a=T(P.A),b=T(P.B);body+=`<path d="M ${a.join(' ')} A 110 110 0 0 0 ${b.join(' ')}" fill="none" stroke="${BLUE}" stroke-width="6"/>`;
      body+=angleMark(T(P.A),T(P.O),T(P.B),BLUE)+angleMark(T(P.A),T(P.C),T(P.B),GREEN)+tick(T(P.O),T(P.A),1,BLUE)+tick(T(P.O),T(P.B),1,BLUE)+dot(T(P.O))+text(268,187,'O')+labelPoints(P,['A','B','C'],T);
      readout=[`∠AOB = ${fmt(M.central)}°`,`∠ACB = ${fmt(M.inscribed)}°`];
      if(p.compare) {body+=angleMark(T(P.A),T(P.D),T(P.B),GREEN)+line(T(P.D),T(P.A),GREEN,'6 5')+line(T(P.D),T(P.B),GREEN,'6 5')+dot(T(P.D),GREEN)+text(T(P.D)[0]+18,T(P.D)[1]+18,'D',GREEN);readout.push(`∠ADB = ${fmt(M.secondInscribed)}°`);}
      body+=text(280,315,p.compare?'C и D — вне выделенной дуги':'C — вне выделенной дуги',INK);
    } else if(model==='similarity') {
      const k=p.scale,u=21,origin1=[80,280],origin2=[275,280],triangle=(o,f)=>[[o[0],o[1]],[o[0]+3*u*f,o[1]],[o[0],o[1]-4*u*f]];
      const a=triangle(origin1,1),b=triangle(origin2,k);
      // Both triangles use the same units per pixel: area visibly scales by k squared.
      body=poly(a)+poly(b)+rightMark(a[1],a[0],a[2])+rightMark(b[1],b[0],b[2])+text(115,325,'Исходный')+text(365,325,'Подобный');
      body+=text((a[0][0]+a[1][0])/2,303,'3',BLUE)+text(a[0][0]-22,(a[0][1]+a[2][1])/2,'4',BLUE)+text((a[1][0]+a[2][0])/2+18,(a[1][1]+a[2][1])/2,'5',BLUE);
      body+=text((b[0][0]+b[1][0])/2,303,fmt(3*k),BLUE)+text(b[0][0]-22,(b[0][1]+b[2][1])/2,fmt(4*k),BLUE)+text((b[1][0]+b[2][0])/2+18,(b[1][1]+b[2][1])/2,fmt(5*k),BLUE);
      readout=[`Стороны увеличены в ${fmt(k)} раза`,`Периметры: ${fmt(M.perimeter)} и ${fmt(M.scaledPerimeter)}`,`Площади: ${fmt(M.area)} и ${fmt(M.scaledArea)}`];
    }
    if (p.measureSides) readout.push(`AB = ${fmt(M.base)}`, `BC = ${fmt(M.side)}`, `CD = ${fmt(M.base)}`, `AD = ${fmt(M.side)}`, `∠A = ${fmt(M.angle)}°`);
    if (p.compareDiagonalArea) readout.push(`Площадь = ${fmt(M.area)}`, `Половина произведения диагоналей = ${fmt(M.AC*M.BD/2)}`);
    if (p.compareAllSideProduct) readout.push(`Произведение четырёх сторон = ${fmt((M.base*M.side)**2)}`);
    if (p.compareTriangleParts) {
      const a=angleAt(P.A,P.O,P.B),b=angleAt(P.B,P.O,P.C),kind=x=>Math.abs(x-90)<1e-7?'прямой':x>90?'тупой':'острый';
      readout.push({text:`Треугольник AOB: ∠AOB = ${fmt(a)}°, ${kind(a)} угол`,color:BLUE,group:'part-aob'},
        {text:`Треугольник BOC: ∠BOC = ${fmt(b)}°, ${kind(b)} угол`,color:'#a65017',group:'part-boc'},
        {text:`Площадь AOB = ${fmt(M.area/4)}`,color:BLUE,group:'part-aob'},
        {text:`Площадь BOC = ${fmt(M.area/4)}`,color:'#a65017',group:'part-boc'},
        Math.abs(M.base-M.side)<1e-7?'В этом частном случае получился квадрат: треугольники равны. Измени одну сторону.':'Один треугольник имеет тупой угол, а другой — только острые. Эти треугольники не равны.');
    }
    if (p.compareMedianAngles) readout.push(`∠ACM = ${fmt(M.ACM)}°`, `∠MCB = ${fmt(M.MCB)}°`);
    return {svg:svg(caption,body),readout,sample:s};
  }

  // Extensions are pure geometry: the host owns controls, measurement and state.
  const kit={RAD,BLUE,GREEN,INK,LIGHT,clamp,finite,hypot,mid,esc,fmt,angleAt,line,text,dot,poly,fit,labelPoints,svg,tick,angleMark,rightMark,linked};
  (extensions||[]).forEach(create=>{
    if(typeof create!=='function') throw new Error('Task 19 experiment module is missing');
    const models=create(kit);
    Object.keys(models).forEach(name=>{
      if(defs[name]) throw new Error('Duplicate task 19 model: '+name);
      defs[name]=models[name];
    });
  });

  function restoreModel(hint,saved) {
    const params=valuesFor(hint.model,hint.params);
    // Persist only editable numbers. Stored flags cannot alter the premise.
    const input=saved&&saved.params,editable={};
    controlsFor(hint.model,params).forEach(({key,min,max})=>{
      if(input&&typeof input[key]==='number'&&Number.isFinite(input[key]))params[key]=editable[key]=input[key];
    });
    const restored=defs[hint.model].restore?defs[hint.model].restore(params,editable):params;
    let normalized=valuesFor(hint.model,restored);
    const finiteGeometry=value=>typeof value==='number'?Number.isFinite(value):!value||typeof value!=='object'||Object.values(value).every(finiteGeometry);
    const geometry=sample(hint.model,normalized);
    if(!finiteGeometry(geometry.points)||!finiteGeometry(geometry.metrics))normalized=valuesFor(hint.model,hint.params);
    return {params:normalized,measured:!!(saved&&saved.measured===true)};
  }
  let mountIndex=0;
  function mount(host,hint,options) {
    if(!host||!hint||!hint.model)throw new Error('An interactive hint host and model are required');
    host.replaceChildren();
    const config=options||{},initial=restoreModel(hint,config.state);
    let params=initial.params,measured=initial.measured,active=true;
    const doc=host.ownerDocument,figure=doc.createElement('div'),readout=doc.createElement('ul'),controls=doc.createElement('div');
    const measure=doc.createElement('button'),observe=doc.createElement('p'),preserve=doc.createElement('p');
    const id=++mountIndex;
    figure.className='t19-model-figure';readout.className='t19-model-readout';readout.id=`t19-measurements-${id}`;
    readout.setAttribute('aria-live','polite');controls.className='t19-model-controls';
    measure.type='button';measure.className='t19-measure';measure.setAttribute('aria-controls',readout.id);
    observe.className='t19-observe';observe.textContent=hint.observe||'Что изменилось? Что осталось прежним? Теперь вернись к утверждению.';
    preserve.className='t19-preserve';preserve.textContent=hint.preserve||'';preserve.hidden=!hint.preserve;
    host.append(preserve,figure,controls,measure,readout,observe);
    const inputs=[],listeners=[];
    function snapshot() {
      const editable={};controlsFor(hint.model,params).forEach(({key})=>{editable[key]=params[key];});
      return {params:editable,measured};
    }
    function publish() {if(typeof config.onChange==='function')config.onChange(snapshot());}
    function draw() {
      const result=render(hint.model,params);params=result.sample.values;figure.innerHTML=result.svg;readout.replaceChildren();
      result.readout.forEach(s=>{const li=doc.createElement('li');li.textContent=typeof s==='string'?s:s.text;
        if(s&&typeof s==='object'){
          if(/^#[0-9a-f]{6}$/i.test(s.color||''))li.style.color=s.color;
          if(s.group){li.dataset.geometryGroup=s.group;li.tabIndex=0;}
        }readout.append(li);
      });
      readout.hidden=!measured;observe.hidden=!measured;
      measure.textContent=measured?'Скрыть измерения':'Измерить';measure.setAttribute('aria-expanded',String(measured));
      const bounds=controlsFor(hint.model,params);
      inputs.forEach(({input,output,key})=>{const bound=bounds.find(c=>c.key===key);if(!bound)return;input.min=bound.min;input.max=bound.max;input.value=params[key];output.textContent=bound.choices?bound.choices[params[key]]:fmt(params[key])+bound.unit;if(bound.choices)input.setAttribute('aria-valuetext',bound.choices[params[key]]);});
    }
    controlsFor(hint.model,params).forEach(c=>{
      const wrap=doc.createElement('div'),label=doc.createElement('label'),input=doc.createElement('input'),output=doc.createElement('output');
      wrap.className='t19-model-control';if(c.pair)wrap.dataset.pair=c.pair;if(c.group)wrap.dataset.geometryGroup=c.group;input.type='range';input.id=`t19-model-${id}-${c.key}`;input.min=c.min;input.max=c.max;input.step=c.step;input.value=c.value;
      input.dataset.key=c.key;label.htmlFor=input.id;label.textContent=c.label;output.htmlFor=input.id;
      const onInput=()=>{if(active){params=updateModel(hint.model,params,c.key,Number(input.value));draw();publish();}};input.addEventListener('input',onInput);listeners.push([input,'input',onInput]);
      wrap.append(label,output,input);controls.append(wrap);inputs.push({input,output,key:c.key});
    });
    const onMeasure=()=>{if(active){measured=!measured;draw();publish();}};
    measure.addEventListener('click',onMeasure);listeners.push([measure,'click',onMeasure]);
    const highlight=event=>{
      const item=event.target.closest?.('[data-geometry-group]'),group=item&&host.contains(item)?item.dataset.geometryGroup:null;
      host.querySelectorAll('[data-geometry-group]').forEach(node=>node.classList.toggle('t19-linked-active',!!group&&node.dataset.geometryGroup===group));
    };
    const clearHighlight=event=>{if(!host.contains(event.relatedTarget))host.querySelectorAll('.t19-linked-active').forEach(node=>node.classList.remove('t19-linked-active'));};
    for(const type of ['pointerover','focusin','click']){host.addEventListener(type,highlight);listeners.push([host,type,highlight]);}
    for(const type of ['pointerout','focusout']){host.addEventListener(type,clearHighlight);listeners.push([host,type,clearHighlight]);}
    draw();publish();
    return ()=>{active=false;listeners.forEach(([element,type,listener])=>element.removeEventListener(type,listener));host.replaceChildren();};
  }
  return {mount,sample,render,controlsFor,restoreModel,updateModel,modelNames:Object.keys(defs)};
});

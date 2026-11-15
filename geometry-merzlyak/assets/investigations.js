(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MerzlyakInvestigations = api;
})(typeof window === 'undefined' ? null : window, function () {
  'use strict';
  // This module supplies bounded investigations, never exercise credit or proof validation.
  const EPS = 1e-9, RAD = Math.PI / 180;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = x => x === null ? 'не определено' : String(Math.round((Math.abs(x) < EPS ? 0 : x) * 1000) / 1000).replace('.', ',').replace('-', '−');
  const point = (x, y, label = '') => ({x, y, label});
  const add = (a,b) => point(a.x+b.x,a.y+b.y);
  const sub = (a,b) => point(a.x-b.x,a.y-b.y);
  const mul = (a,k) => point(a.x*k,a.y*k);
  const dot = (a,b) => a.x*b.x+a.y*b.y;
  const cross = (a,b) => a.x*b.y-a.y*b.x;
  const dist = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
  const midpoint = (a,b) => mul(add(a,b),.5);
  const polar = (r,a) => point(r*Math.cos(a*RAD),r*Math.sin(a*RAD));
  const angle = (a,b,c) => { if(!a||!b||!c)return null;const u=sub(a,b),v=sub(c,b),d=Math.hypot(u.x,u.y)*Math.hypot(v.x,v.y); return d<EPS?null:Math.acos(Math.max(-1,Math.min(1,dot(u,v)/d)))/RAD; };
  const area = (a,b,c) => Math.abs(cross(sub(b,a),sub(c,a)))/2;
  const named = (p,label) => ({...p,label});
  const line = (a,b,color='blue',dash=false,arrow=false) => ({kind:'line',a,b,color,dash,arrow});
  const polygon = (points,color='blue') => ({kind:'polygon',points,color});
  const circle = (o,r,color='green') => ({kind:'circle',o,r,color});
  const colors = {blue:'#245c94',green:'#15765e',orange:'#a84e13',purple:'#75439b',gray:'#6b7280'};
  const foot = (p,a,b) => {const v=sub(b,a),q=dot(v,v);return q<EPS?null:add(a,mul(v,dot(sub(p,a),v)/q));};
  const intersect = (a,b,c,d) => {const u=sub(b,a),v=sub(d,c),den=cross(u,v);return Math.abs(den)<EPS?null:add(a,mul(u,cross(sub(c,a),v)/den));};
  function triangleFromSides(a,b,c) {
    if (!(a>0&&b>0&&c>0&&a+b>c&&a+c>b&&b+c>a)) return null;
    const x=(b*b+c*c-a*a)/(2*c),y=Math.sqrt(Math.max(0,b*b-x*x));
    return [point(0,0,'A'),point(c,0,'B'),point(x,y,'C')];
  }
  function triangleFromAngles(alpha,beta,c) {
    const gamma=180-alpha-beta;
    if (!(alpha>0&&beta>0&&gamma>0&&c>0)) return null;
    const b=c*Math.sin(beta*RAD)/Math.sin(gamma*RAD);
    return [point(0,0,'A'),point(c,0,'B'),named(polar(b,alpha),'C')];
  }
  function triangleFacts(t) {
    const [A,B,C]=t,a=dist(B,C),b=dist(C,A),c=dist(A,B),s=(a+b+c)/2;
    return {a,b,c,A:angle(B,A,C),B:angle(A,B,C),C:angle(A,C,B),area:area(A,B,C),s};
  }
  function circumcenter(t) {
    const [a,b,c]=t,d=2*(a.x*(b.y-c.y)+b.x*(c.y-a.y)+c.x*(a.y-b.y));
    if(Math.abs(d)<EPS)return null;
    const q=p=>p.x*p.x+p.y*p.y;
    return point((q(a)*(b.y-c.y)+q(b)*(c.y-a.y)+q(c)*(a.y-b.y))/d,
      (q(a)*(c.x-b.x)+q(b)*(a.x-c.x)+q(c)*(b.x-a.x))/d,'O');
  }
  function svg(scene, label) {
    const pts=scene.points.slice();
    for(const sh of scene.shapes) {
      if(sh.kind==='circle')pts.push(point(sh.o.x-sh.r,sh.o.y-sh.r),point(sh.o.x+sh.r,sh.o.y+sh.r));
      if(sh.kind==='line')pts.push(sh.a,sh.b);
      if(sh.kind==='polygon')pts.push(...sh.points);
    }
    const valid=pts.filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));
    if(!valid.length)return '';
    const minX=Math.min(...valid.map(p=>p.x)),maxX=Math.max(...valid.map(p=>p.x)),minY=Math.min(...valid.map(p=>p.y)),maxY=Math.max(...valid.map(p=>p.y));
    const scale=Math.min(420/Math.max(2,maxX-minX),230/Math.max(2,maxY-minY));
    const X=x=>260+(x-(minX+maxX)/2)*scale, Y=y=>155-(y-(minY+maxY)/2)*scale;
    const xy=p=>fmtSvg(X(p.x))+','+fmtSvg(Y(p.y)), fmtSvg=n=>String(Math.round(n*1000)/1000);
    let out='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 320" role="img" aria-label="'+esc(label)+'" style="width:100%;height:auto;display:block"><title>'+esc(label)+'</title><defs><marker id="research-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="context-stroke"/></marker></defs><rect width="520" height="320" fill="#fffdf8"/>';
    for(const sh of scene.shapes) {
      const color=colors[sh.color]||colors.blue;
      if(sh.kind==='line')out+='<line x1="'+X(sh.a.x)+'" y1="'+Y(sh.a.y)+'" x2="'+X(sh.b.x)+'" y2="'+Y(sh.b.y)+'" stroke="'+color+'" stroke-width="2.5"'+(sh.dash?' stroke-dasharray="7 5"':'')+(sh.arrow?' marker-end="url(#research-arrow)"':'')+'/>';
      if(sh.kind==='polygon')out+='<polygon points="'+sh.points.map(xy).join(' ')+'" fill="'+color+'" fill-opacity=".07" stroke="'+color+'" stroke-width="2.5"/>';
      if(sh.kind==='circle')out+='<circle cx="'+X(sh.o.x)+'" cy="'+Y(sh.o.y)+'" r="'+(sh.r*scale)+'" fill="none" stroke="'+color+'" stroke-width="2.2"/>';
    }
    const labelled=new Set();
    for(const p of scene.points)if(Number.isFinite(p.x)&&Number.isFinite(p.y)) {
      out+='<circle cx="'+X(p.x)+'" cy="'+Y(p.y)+'" r="4" fill="#1d374d"/>';
      if(p.label&&!labelled.has(p.label)) {labelled.add(p.label);out+='<text x="'+(X(p.x)+7)+'" y="'+(Y(p.y)-9)+'" font-family="system-ui,sans-serif" font-size="18" fill="#172b3a">'+esc(p.label)+'</text>';}
    }
    return out+'</svg>';
  }
  function calculation(spec,p) {
    const scene={points:[],shapes:[]},v={},r=[];
    const pts=(...a)=>scene.points.push(...a),sh=(...a)=>scene.shapes.push(...a);
    const read=(label,value)=>r.push(label+' = '+(typeof value==='number'?fmt(value):value));
    const tri=t=>{pts(...t);sh(polygon(t));return triangleFacts(t);};
    const family=spec.family,kind=spec.variant;
    if(family==='incidence') {
      const A=point(0,0,p.d===0?'A = B':'A'),B=point(p.d,0,'B'),u=polar(6,p.angle);
      pts(A);if(p.d!==0)pts(B);sh(line(mul(u,-1),u),line(point(-1,0),point(7,0),'gray',true));
      Object.assign(v,{distinct:p.d!==0,onBoth:p.d===0||Math.abs(Math.sin(p.angle*RAD))<EPS,possibleLines:p.d===0?'many':'one'});
      r.push(p.d===0?'Две подписи сейчас обозначают одну точку.':'A и B — разные точки.');
      r.push(v.onBoth?'Выбранная прямая проходит через обе отметки.':'Выбранная прямая проходит через A, но не через B.');
      read('Расстояние AB',p.d);
    } else if(family==='segment') {
      const A=point(0,0,'A'),B=point(p.x,0,'B'),C=point(8,0,'C');pts(A,B,C);sh(line(point(-2,0),point(10,0),'gray'),line(A,C));
      Object.assign(v,{AB:Math.abs(p.x),BC:Math.abs(8-p.x),AC:8,between:p.x>=0&&p.x<=8});
      read('AB',v.AB);read('BC',v.BC);read('AB + BC',v.AB+v.BC);read('AC',8);
      r.push(v.between?'B находится на отрезке AC.':'B находится за концом отрезка AC.');
    } else if(family==='angle'||family==='crossed') {
      const O=point(0,0,'O'),A=point(5,0,'A'),B=named(polar(5,p.angle),'B');pts(O,A,B);
      sh(line(O,A,'blue',false,true),line(O,B,'green',false,true));
      if(family==='crossed')sh(line(mul(A,-1),A),line(mul(B,-1),B,'green'));
      Object.assign(v,{alpha:p.angle,beta:180-p.angle,vertical:p.angle,right:Math.abs(p.angle-90)<EPS});
      read('∠AOB',p.angle+'°');if(family==='crossed'){read('Смежный угол',(180-p.angle)+'°');read('Вертикальный угол',p.angle+'°');read('Сумма смежных',180+'°');}
      else r.push(p.angle===0?'Лучи совпали.':p.angle===180?'Лучи противоположны.':p.angle<90?'Угол острый.':p.angle===90?'Угол прямой.':'Угол тупой.');
    } else if(family==='cevians'||family==='isosceles'||family==='bisector') {
      const x=family==='isosceles'?3:p.x,t=[point(0,0,'A'),point(6,0,'B'),point(x,p.height,'C')],f=tri(t);
      const M=point(3,0,'M'),H=point(x,0,'H'),D=point(6*f.b/(f.a+f.b),0,'D'),G=named(mul(add(add(t[0],t[1]),t[2]),1/3),'G');
      pts(M,H,D);sh(line(t[2],M,'orange'),line(t[2],H,'green',true),line(t[2],D,'purple'));
      Object.assign(v,{...f,medianFoot:3,altitudeFoot:x,bisectorFoot:D.x,ratioADDB:D.x/(6-D.x),ratioCACB:f.b/f.a,centroid:G});
      read('AM = MB',3);read('AH',x);read('AD / DB',v.ratioADDB);read('CA / CB',v.ratioCACB);
      if(family==='isosceles'){read('CA',f.b);read('CB',f.a);read('∠A',f.A);read('∠B',f.B);}
      if(family==='bisector'){pts(G);read('CG / GM',2);r.push('Оранжевая — медиана; фиолетовая — биссектриса.');}
      else r.push('Оранжевая CM — медиана, зелёная CH — высота, фиолетовая CD — биссектриса.');
    } else if(family==='iso-converse') {
      const t=triangleFromAngles(p.alpha,p.beta,6),f=tri(t);Object.assign(v,f);read('∠A',p.alpha);read('∠B',p.beta);read('BC',f.a);read('AC',f.b);
    } else if(family==='congruence') {
      const mode=p.mode,ang=p.angle,b=4,c=5;
      const t1=mode==='asa'?triangleFromAngles(ang,50,c):[point(0,0,'A'),point(c,0,'B'),named(polar(b,ang),'C')];
      const raw=mode==='asa'?triangleFromAngles(ang,50,c):[point(0,0),point(c,0),polar(b,ang+(mode==='sides'?p.delta:0))];
      const t2=raw.map((q,i)=>point(q.x+8,q.y,['A′','B′','C′'][i])),f1=tri(t1),f2=tri(t2);
      Object.assign(v,{mode,first:f1,second:f2,equal:Math.abs(f1.a-f2.a)<EPS});
      read('AB и A′B′',5);read('BC',f1.a);read('B′C′',f2.a);
      if(mode==='asa')r.push('В обеих фигурах закреплены сторона AB = 5 и два прилежащих угла '+ang+'° и 50°.');
      else {read('AC и A′C′',4);read('∠A',ang);read('∠A′',ang+(mode==='sides'?p.delta:0));}
      r.push(v.equal?'В этой паре соответствующие стороны равны.':'Две данные стороны равны, но третьи различаются.');
    } else if(family==='sss'||family==='triangle-inequality'||family==='heron') {
      const a=4,b=5,c=p.base,t=triangleFromSides(a,b,c);
      Object.assign(v,{a,b,c,exists:!!t,degenerate:c===1||c===9});
      const A=point(0,0,'A'),B=point(c,0,'B');pts(A,B);sh(line(A,B),circle(A,b,'gray'),circle(B,a,'green'));
      if(t) {
        if(String(p.side)==='-1')t[2].y=-t[2].y;
        const f=tri(t);Object.assign(v,f);read('AC',f.b);read('BC',f.a);read('AB',f.c);read('Площадь',f.area);
        if(family==='heron'){v.heron=Math.sqrt(f.s*(f.s-f.a)*(f.s-f.b)*(f.s-f.c));read('Полупериметр',f.s);read('По формуле Герона',v.heron);}
      } else r.push(v.degenerate?'Окружности касаются: три точки лежат на одной прямой, треугольник вырожден.':'Треугольник с такими тремя сторонами не существует.');
      r.push('Для сторон 4, 5 и AB требуется 1 < AB < 9.');
    } else if(family==='logic') {
      const w=p.width,h=3,A=point(0,0,'A'),B=point(w,0,'B'),C=point(w,h,'C'),D=point(0,h,'D');pts(A,B,C,D);sh(polygon([A,B,C,D]));
      Object.assign(v,{rectangle:true,square:w===h,allRight:true,allSidesEqual:w===h});
      read('Ширина',w);read('Высота',h);r.push('Все четыре угла прямые.');r.push(w===h?'Все стороны равны: это квадрат.':'Две соседние стороны не равны: это прямоугольник, но не квадрат.');
    } else if(family==='parallels') {
      const delta=kind==='properties'?0:p.delta,phi=p.angle||60,m=Math.tan(delta*RAD);
      sh(line(point(-5,0),point(5,0)),line(point(-5,3-5*m),point(5,3+5*m),'green'));
      const V=polar(7,phi);sh(line(mul(V,-1),V,'orange'));
      Object.assign(v,{parallel:delta===0,alpha:phi,beta:phi-delta,supplement:180-phi,intersectionX:delta===0?null:-3/m});
      read('Угол с первой прямой',phi+'°');read('Соответственный угол со второй',(phi-delta)+'°');
      if(kind==='properties')read('Односторонний угол',(180-phi)+'°');
      r.push(delta===0?'Направления прямых совпадают; разные прямые параллельны.':'Прямые пересекаются, даже если точка пересечения за краем рисунка.');
    } else if(family==='triangle-angles') {
      const t=[point(0,0,'A'),point(6,0,'B'),point(p.x,p.height,'C')],f=tri(t);Object.assign(v,f,{sum:f.A+f.B+f.C,exteriorB:180-f.B});
      sh(line(t[1],point(8,0),'orange'));read('∠A',f.A);read('∠B',f.B);read('∠C',f.C);read('Сумма',v.sum);read('Внешний при B',v.exteriorB);
    } else if(family==='right'||family==='projections'||family==='trig-right') {
      const alpha=p.angle||40,c=p.hypotenuse||6,C=named(point(c*Math.cos(alpha*RAD)**2,c*Math.cos(alpha*RAD)*Math.sin(alpha*RAD)),'C');
      const t=[point(0,0,'A'),point(c,0,'B'),C],f=tri(t),H=point(C.x,0,'H'),M=point(c/2,0,'M');pts(H,M);sh(line(C,H,'green',true),line(C,M,'orange'));
      Object.assign(v,f,{hypotenuse:c,p:H.x,q:c-H.x,h:C.y,CM:dist(C,M),sin:f.a/c,cos:f.b/c,tan:f.a/f.b});
      read('∠A',alpha+'°');read('∠B',(90-alpha)+'°');read('∠C','90°');
      if(family==='projections'){read('CH²',C.y*C.y);read('AH · HB',H.x*(c-H.x));read('AC²',f.b*f.b);read('AB · AH',c*H.x);}
      else if(family==='trig-right'){read('BC / AB',v.sin);read('AC / AB',v.cos);read('BC / AC',v.tan);read('BC',f.a);read('AC',f.b);}
      else {read('AB',c);read('BC',f.a);read('CM',v.CM);read('AC² + BC²',f.a*f.a+f.b*f.b);read('AB²',c*c);}
    } else if(family==='circle-locus') {
      const O=point(0,0,'O'),P=named(polar(p.distance,p.angle),'P');pts(O,P);sh(circle(O,3),line(O,P,'orange'));
      Object.assign(v,{distance:p.distance,radius:3,location:p.distance===3?'boundary':p.distance<3?'inside':'outside'});
      read('OP',p.distance);read('Радиус',3);r.push(p.distance===3?'P на окружности и в круге.':p.distance<3?'P внутри круга, но не на окружности.':'P вне круга.');
    } else if(family==='chord-tangent') {
      const O=point(0,0,'O'),H=point(0,p.distance,'H'),rad=3,inside=p.distance<rad;pts(O,H);sh(circle(O,rad),line(point(-4,p.distance),point(4,p.distance),'orange'),line(O,H,'green'));
      const x=inside?Math.sqrt(rad*rad-p.distance*p.distance):0;
      if(p.distance<=rad){const A=point(-x,p.distance,'A'),B=point(x,p.distance,x<EPS?'A = B':'B');pts(A);if(x>EPS)pts(B);}
      Object.assign(v,{intersections:inside?2:p.distance===rad?1:0,halfChord:x,distance:p.distance,radius:rad});
      read('Расстояние от центра до прямой',p.distance);read('Общих точек',v.intersections);
      if(inside)read('Половина хорды',x);r.push(p.distance===3?'Одна общая точка: радиус к ней перпендикулярен касательной.':p.distance<3?'Прямая пересекает окружность в двух точках; H — середина хорды.':'Прямая проходит вне окружности.');
    } else if(family==='centers') {
      const t=[point(0,0,'A'),point(6,0,'B'),point(p.x,p.height,'C')],f=tri(t),O=circumcenter(t),R=dist(O,t[0]);
      const I=point((f.a*t[0].x+f.b*t[1].x+f.c*t[2].x)/(2*f.s),(f.a*t[0].y+f.b*t[1].y+f.c*t[2].y)/(2*f.s),'I'),inradius=f.area/f.s;
      Object.assign(v,{...f,circumcenter:O,circumradius:R,incenter:I,inradius});
      if(kind==='excircle') {
        const den=-f.a+f.b+f.c,E=point((-f.a*t[0].x+f.b*t[1].x+f.c*t[2].x)/den,(-f.a*t[0].y+f.b*t[1].y+f.c*t[2].y)/den,'Iₐ'),exradius=f.area/(f.s-f.a);
        pts(E);sh(circle(E,exradius,'orange'));
        const ds=[];for(const [a,b]of[[t[0],t[1]],[t[1],t[2]],[t[2],t[0]]]){const F=foot(E,a,b);pts(F);sh(line(E,F,'green',true),line(a,add(a,mul(sub(b,a),2)),'gray',true));ds.push(dist(E,F));}
        Object.assign(v,{excenter:E,exradius,distances:ds});read('Расстояния до трёх прямых',ds.map(fmt).join('; '));read('Радиус вневписанной',exradius);
      } else if(kind==='euler') {
        const G=named(mul(add(add(t[0],t[1]),t[2]),1/3),'G'),H=named(sub(add(add(t[0],t[1]),t[2]),mul(O,2)),'H'),N=named(midpoint(O,H),'N');
        const mids=[midpoint(t[0],t[1]),midpoint(t[1],t[2]),midpoint(t[2],t[0])];
        pts(O,G,H,N,...mids);sh(circle(O,R,'gray'),circle(N,R/2,'green'),line(O,H,'orange'));
        Object.assign(v,{centroid:G,orthocenter:H,nineCenter:N,nineRadius:R/2,OG:dist(O,G),GH:dist(G,H),nineDistances:mids.map(q=>dist(q,N))});
        read('OG',v.OG);read('GH',v.GH);read('R / 2',R/2);read('От N до середин сторон',v.nineDistances.map(fmt).join('; '));
        if(v.OG<EPS)r.push('Центры совпали: отношение нулевых расстояний не определено.');
      } else {
        pts(O,I);sh(circle(O,R,'gray'),circle(I,inradius,'green'));read('OA = OB = OC',R);read('Расстояние I до каждой стороны',inradius);
        r.push('Серая окружность проходит через вершины; зелёная касается сторон.');
      }
    } else if(family==='two-circles') {
      const A=point(-3,0,'A'),B=point(3,0,'B'),rr=p.radius;pts(A,B);sh(circle(A,rr),circle(B,rr),line(A,B,'gray'));
      const n=rr<3?0:rr===3?1:2,y=rr>=3?Math.sqrt(rr*rr-9):null;
      Object.assign(v,{count:n,radius:rr,height:y,AB:6});
      if(n){const P=point(0,y,n===1?'M':'P');pts(P);sh(line(A,P,'orange'),line(B,P,'orange'));if(n===2){const Q=point(0,-y,'Q');pts(Q);sh(line(P,Q,'purple'));}}
      read('Общих точек окружностей',n);read('Одинаковые радиусы',rr);
      r.push(n===2?'Прямая через две общие точки перпендикулярна AB и делит AB пополам.':n===1?'Одна общая точка — середина AB; двух точек для построения прямой пока нет.':'Радиус слишком мал: окружности не пересекаются.');
    } else if(family==='polygon') {
      const n=kind==='quad'?4:p.n,rr=3,arr=Array.from({length:n},(_,i)=>named(polar(rr,90+360*i/n),String.fromCharCode(65+i)));
      pts(...arr);sh(polygon(arr));for(let i=2;i<n-1;i++)sh(line(arr[0],arr[i],'orange',true));
      Object.assign(v,{n,diagonals:n*(n-3)/2,triangles:n-2,sum:(n-2)*180,central:360/n,interior:180-360/n,side:2*rr*Math.sin(Math.PI/n)});
      if(kind==='quad') {const d=p.shift;arr[2].x+=d;sh(line(arr[1],arr[3],'green',true));read('Сторон',4);read('Диагоналей',2);read('Сумма внутренних углов',360);}
      else {read('Сторон',n);read('Треугольников из A',n-2);read('Сумма углов',(n-2)*180);if(kind==='regular'){const O=point(0,0,'O');pts(O);sh(circle(O,rr,'gray'));for(const a of arr)sh(line(O,a,'green',true));read('Центральный угол',360/n);read('Угол многоугольника',v.interior);}}
    } else if(family==='quadrilateral') {
      let w=6,h=3,x=p.shift||0;
      if(kind==='rectangle'||kind==='area-rectangle'){w=p.width;h=p.height;x=0;}
      if(kind==='rhombus'){w=4;x=4*Math.cos(p.angle*RAD);h=4*Math.sin(p.angle*RAD);}
      if(kind==='square'){w=4;x=4*p.ratio*Math.cos(p.angle*RAD);h=4*p.ratio*Math.sin(p.angle*RAD);}
      if(kind==='area-parallelogram')h=p.height;
      const A=point(0,0,'A'),B=point(w,0,'B'),C=point(w+x,h,'C'),D=point(x+(kind==='test'?p.offset:0),h,'D');
      pts(A,B,C,D);sh(polygon([A,B,C,D]),line(A,C,'orange',true),line(B,D,'purple',true));
      const m1=midpoint(A,C),m2=midpoint(B,D),d1=dist(A,C),d2=dist(B,D),side=dist(A,D),S=area(A,B,C)+area(A,C,D),ad=angle(D,A,B);
      Object.assign(v,{width:w,height:h,side,diagonalAC:d1,diagonalBD:d2,diagonalDot:dot(sub(C,A),sub(D,B)),midpointGap:dist(m1,m2),angleA:ad,area:S,square:Math.abs(side-w)<EPS&&Math.abs(ad-90)<EPS});
      if(kind==='area-parallelogram'){const H=point(x,0,'H');pts(H);sh(line(D,H,'green',true));read('Основание',w);read('Высота',h);read('Площадь',S);read('Боковая сторона',side);}
      else if(kind==='area-rectangle'){read('Площадь',w*h);read('Периметр',2*(w+h));}
      else {read('AB',w);read('AD',side);read('∠A',ad);read('AC',d1);read('BD',d2);read('Расстояние между серединами диагоналей',dist(m1,m2));if(kind==='rhombus'||kind==='square')read('Угол между диагоналями',angle(A,intersect(A,C,B,D),B));}
    } else if(family==='midline'||family==='thales') {
      const A=point(0,0,'A'),B=point(6,0,'B'),C=point(p.x??2,4,'C'),t=p.fraction,D=named(add(C,mul(sub(A,C),t)),'D'),E=named(add(C,mul(sub(B,C),t)),'E');
      tri([A,B,C]);pts(D,E);sh(line(D,E,'orange'));
      Object.assign(v,{ratio:t,DE:dist(D,E),AB:6,CD:dist(C,D),CA:dist(C,A),CE:dist(C,E),CB:dist(C,B),parallelCross:cross(sub(E,D),sub(B,A))});
      read('CD / CA',t);read('CE / CB',t);read('DE',v.DE);read('AB',6);
      r.push(t===.5?'D и E — середины сторон; DE — средняя линия.':'Точки делят стороны в одинаковой доле; это не середины при выбранной доле.');
    } else if(family==='trapezoid') {
      const b=6,a=p.top,h=p.height||3,x=p.shift,A=point(0,0,'A'),B=point(b,0,'B'),C=point(x+a,h,'C'),D=point(x,h,'D');
      const M=named(midpoint(A,D),'M'),N=named(midpoint(B,C),'N');pts(A,B,C,D,M,N);sh(polygon([A,B,C,D]),line(M,N,'green'),line(A,C,'orange',true));
      Object.assign(v,{a,b,h,midline:(a+b)/2,area:(a+b)*h/2,left:dist(A,D),right:dist(B,C),angleA:angle(D,A,B),angleB:angle(A,B,C),parallelBoth:a===b});
      read('AD',v.left);read('BC',v.right);read('∠A',v.angleA);read('∠B',v.angleB);
      if(kind==='area'){read('Средняя линия',v.midline);read('Высота',h);read('Площадь',v.area);}
      r.push(a===b?'При равных основаниях получился параллелограмм: по принятому определению это не трапеция.':Math.abs(v.left-v.right)<EPS?'Боковые стороны и углы при основании попарно равны.':'Основания параллельны, боковые стороны различаются.');
    } else if(family==='inscribed') {
      const arc=p.arc,A=named(polar(3,-arc/2),'A'),B=named(polar(3,arc/2),'B'),C=named(polar(3,p.vertex),'C'),O=point(0,0,'O');
      pts(A,B,C,O);sh(circle(O,3),line(O,A,'gray'),line(O,B,'gray'),line(C,A,'orange'),line(C,B,'orange'));
      Object.assign(v,{arc,central:arc,inscribed:angle(A,C,B)});read('Дуга AB без C',arc+'°');read('∠AOB',arc+'°');read('∠ACB',v.inscribed);
    } else if(family==='circle-quad') {
      const O=point(0,0,'O'),rr=3;pts(O);sh(circle(O,rr));
      const isTangent=kind==='tangent'||p.kind==='tangent';let q;
      if(isTangent) {
        const aa=[0,90,180,270+p.shift],norm=aa.map(a=>polar(1,a));q=norm.map((n,i)=>{const m=norm[(i+1)%4],det=cross(n,m);return point(rr*(m.y-n.y)/det,rr*(n.x-m.x)/det,String.fromCharCode(65+i));});
        for(const n of norm){const T=mul(n,rr);pts(T);sh(line(O,T,'gray',true));}
      } else q=[0,90+p.shift,180,270].map((a,i)=>named(polar(rr,a),String.fromCharCode(65+i)));
      pts(...q);sh(polygon(q));const ss=q.map((a,i)=>dist(a,q[(i+1)%4])),angles=q.map((a,i)=>angle(q[(i+3)%4],a,q[(i+1)%4]));
      Object.assign(v,{sides:ss,angles,oppositeSides:[ss[0]+ss[2],ss[1]+ss[3]],oppositeAngles:[angles[0]+angles[2],angles[1]+angles[3]],tangent:isTangent});
      read('AB + CD',v.oppositeSides[0]);read('BC + DA',v.oppositeSides[1]);read('∠A + ∠C',v.oppositeAngles[0]);
      r.push(isTangent?'Стороны касаются окружности.':'Все вершины лежат на окружности.');
    } else if(family==='similarity') {
      const k=p.scale,ang=p.angle||55,delta=kind==='sas'&&p.condition==='sides'?p.delta:0;
      const t=[point(0,0,'A'),point(4,0,'B'),named(polar(3,ang),'C')];
      const u=[point(7,0,'D'),point(7+4*k,0,'E'),named(add(point(7,0),polar(3*k,ang+delta)),'F')];
      const a=tri(t),b=tri(u);Object.assign(v,{scale:k,first:a,second:b,ratios:[b.a/a.a,b.b/a.b,b.c/a.c],areaRatio:b.area/a.area});
      read('DE / AB',b.c/a.c);read('DF / AC',b.b/a.b);read('EF / BC',b.a/a.a);read('∠A',a.A);read('∠D',b.A);read('S₂ / S₁',v.areaRatio);
      if(delta)r.push('Две стороны пропорциональны, но угол между ними другой: этого недостаточно для подобия.');
    } else if(family==='area-triangle') {
      const A=point(0,0,'A'),B=point(6,0,'B'),C=point(p.x,p.height,'C'),H=point(p.x,0,'H');tri([A,B,C]);pts(H);sh(line(C,H,'green',true),line(point(-3,0),point(9,0),'gray',true));
      Object.assign(v,{base:6,height:p.height,area:3*p.height,side:dist(A,C),footOutside:p.x<0||p.x>6});
      read('Основание AB',6);read('Высота CH',p.height);read('Площадь',v.area);r.push(v.footOutside?'Основание высоты на продолжении AB.':'Основание высоты на отрезке AB.');
    } else if(family==='trig-circle') {
      const O=point(0,0,'O'),P=named(polar(3,p.angle),'P'),H=point(P.x,0,'H');pts(O,P,H);sh(circle(O,3),line(point(-3.5,0),point(3.5,0),'gray'),line(point(0,-.5),point(0,3.5),'gray'),line(O,P,'blue'),line(P,H,'green',true));
      const co=Math.cos(p.angle*RAD),si=Math.sin(p.angle*RAD);Object.assign(v,{cos:Math.abs(co)<EPS?0:co,sin:Math.abs(si)<EPS?0:si,tan:Math.abs(co)<EPS?null:si/co,cot:Math.abs(si)<EPS?null:co/si});
      read('cos α',v.cos);read('sin α',v.sin);read('tg α',v.tan);read('ctg α',v.cot);r.push('Подписи — координаты на единичной окружности; рисунок увеличен.');
    } else if(family==='cosine'||family==='sine'||family==='solve-triangle') {
      const t=[point(0,0,'A'),point(5,0,'B'),named(polar(4,p.angle),'C')],f=tri(t),O=circumcenter(t),R=dist(O,t[0]);Object.assign(v,f,{R,cosineRHS:25+16-40*Math.cos(p.angle*RAD),sineRatios:[f.a/Math.sin(f.A*RAD),f.b/Math.sin(f.B*RAD),f.c/Math.sin(f.C*RAD)]});
      if(family==='sine'){pts(O);sh(circle(O,R,'gray'));read('a / sin A',v.sineRatios[0]);read('b / sin B',v.sineRatios[1]);read('c / sin C',v.sineRatios[2]);read('2R',2*R);}
      else {read('AB',5);read('AC',4);read('∠A',p.angle);read('BC²',f.a*f.a);read('5² + 4² − 2·5·4·cos A',v.cosineRHS);read('∠B',f.B);read('∠C',f.C);}
    } else if(family==='circle-metric') {
      const O=point(0,0,'O'),P=point(p.radius,0,'P');pts(O,P);sh(circle(O,p.radius),line(O,P,'orange'));
      Object.assign(v,{radius:p.radius,circumference:2*Math.PI*p.radius,area:Math.PI*p.radius*p.radius,arc:p.radius*p.angle*RAD});
      read('Длина окружности / π',2*p.radius);read('Площадь круга / π',p.radius*p.radius);read('Угол дуги',p.angle+'°');read('Длина дуги / π',p.radius*p.angle/180);
    } else if(family==='coordinates'||family==='section') {
      const A=point(-2,1,'A'),B=point(p.x,p.y,'B'),fraction=family==='section'?p.ratio/(p.ratio+1):.5,M=named(add(A,mul(sub(B,A),fraction)),'M'),H=point(B.x,A.y,'H');
      pts(A,B,M,H);sh(line(A,B),line(A,H,'gray',true),line(B,H,'gray',true));
      Object.assign(v,{A,B,M,distance:dist(A,B),dx:B.x-A.x,dy:B.y-A.y,fraction,ratio:dist(M,B)<EPS?null:dist(A,M)/dist(M,B)});
      read('Разность x',v.dx);read('Разность y',v.dy);read('AB',v.distance);read('M','('+fmt(M.x)+'; '+fmt(M.y)+')');read('AM / MB',v.ratio);
    } else if(family==='circle-equation') {
      const O=point(1,-1,'O'),P=point(p.x,p.y,'P');pts(O,P);sh(circle(O,3),line(O,P,'orange'));
      Object.assign(v,{lhs:(p.x-1)**2+(p.y+1)**2,rhs:9,onCircle:Math.abs((p.x-1)**2+(p.y+1)**2-9)<EPS});
      read('(x − 1)² + (y + 1)²',v.lhs);read('R²',9);r.push(v.onCircle?'P удовлетворяет уравнению и лежит на окружности.':'P не удовлетворяет уравнению окружности.');
    } else if(family==='line-equation'||family==='slope') {
      const k=p.slope,b=p.intercept,vertical=p.kind==='vertical';
      sh(line(point(-4,0),point(4,0),'gray'),line(point(0,-4),point(0,4),'gray'));
      if(vertical){const A=point(b,-3,'A'),B=point(b,3,'B');pts(A,B);sh(line(A,B));Object.assign(v,{vertical:true,slope:null,equation:'x = '+fmt(b)});r.push('У обеих точек x = '+fmt(b)+'. Разность x равна нулю; наклон k не определён.');}
      else {const A=point(0,b,'A'),B=point(2,2*k+b,'B');pts(A,B);sh(line(point(-3,-3*k+b),point(3,3*k+b)),line(A,point(2,b),'orange',true),line(point(2,b),B,'green',true));Object.assign(v,{vertical:false,slope:k,intercept:b,dx:2,dy:2*k,equation:'y = '+fmt(k)+'x + '+fmt(b)});read('Δy / Δx',k);read('Пересечение с осью y',b);}
    } else if(family==='vector-coordinates') {
      const O=point(0,0,'O'),A=point(p.ax,p.ay,'A'),B=point(p.ax+p.dx,p.ay+p.dy,'B'),H=point(B.x,A.y,'H'),P=point(p.dx,p.dy,'P');
      const minX=Math.min(-1,A.x,B.x,P.x)-1,maxX=Math.max(1,A.x,B.x,P.x)+1,minY=Math.min(-1,A.y,B.y,P.y)-1,maxY=Math.max(1,A.y,B.y,P.y)+1;
      sh(line(point(minX,0),point(maxX,0),'gray',false,true),line(point(0,minY),point(0,maxY),'gray',false,true));
      for(let x=Math.ceil(minX);x<maxX;x++)sh(line(point(x,-.08),point(x,.08),'gray'));
      for(let y=Math.ceil(minY);y<maxY;y++)sh(line(point(-.08,y),point(.08,y),'gray'));
      pts(O,A,B,H,P,point(maxX,0,'x'),point(0,maxY,'y'));
      sh(line(A,H,'orange',true),line(H,B,'purple',true),line(A,B,'green',false,true),line(O,P,'blue',false,true));
      Object.assign(v,{from:A,to:B,horizontalFoot:H,atOrigin:P,dx:B.x-A.x,dy:B.y-A.y,zero:A.x===B.x&&A.y===B.y});
      read('Начало A','('+fmt(A.x)+'; '+fmt(A.y)+')');read('Конец B','('+fmt(B.x)+'; '+fmt(B.y)+')');
      read('xB − xA',fmt(B.x)+' − ('+fmt(A.x)+') = '+fmt(v.dx));read('yB − yA',fmt(B.y)+' − ('+fmt(A.y)+') = '+fmt(v.dy));
      read('Координаты AB и OP','('+fmt(v.dx)+'; '+fmt(v.dy)+')');
      r.push('Деления на осях имеют шаг 1. Пунктир показывает горизонтальное и вертикальное перемещения от A к B.');
      r.push(v.zero?'A и B совпали: обе координаты нулевого вектора равны 0.':'Начало синего вектора OP — начало координат. Поэтому координаты его конца P совпадают с координатами вектора.');
    } else if(family==='vector'||family==='vector-add'||family==='vector-scale'||family==='dot') {
      const O=point(0,0,'O'),a=point(3,1),b=point(p.x||0,p.y||0);pts(O);
      if(family==='vector') {const A=point(p.x,p.y,'A'),B=named(add(A,a),'B'),P=named(a,'P');pts(A,B,P);sh(line(O,P,'blue',false,true),line(A,B,'green',false,true));Object.assign(v,{a,from:A,to:B,delta:sub(B,A),length:Math.sqrt(10)});read('AB','(3; 1)');read('Длина обоих векторов',Math.sqrt(10));}
      if(family==='vector-add'){const sum=add(a,b),difference=sub(a,b);pts(named(a,'A'),named(b,'B'),named(sum,'S'),named(difference,'D'));sh(line(O,a,'blue',false,true),line(a,sum,'green',false,true),line(O,sum,'orange',false,true),line(b,a,'purple',false,true));Object.assign(v,{a,b,sum,difference});read('a + b','('+fmt(sum.x)+'; '+fmt(sum.y)+')');read('a − b','('+fmt(difference.x)+'; '+fmt(difference.y)+')');r.push('Оранжевый вектор — сумма; фиолетовый от B к A равен разности a − b.');}
      if(family==='vector-scale'){const scaled=mul(a,p.factor);pts(named(a,'A'),named(scaled,'K'));sh(line(O,a,'blue',false,true),line(O,scaled,'orange',false,true));Object.assign(v,{a,factor:p.factor,scaled,length:Math.abs(p.factor)*Math.sqrt(10)});read('ka','('+fmt(scaled.x)+'; '+fmt(scaled.y)+')');read('Длина',v.length);r.push(p.factor===0?'Получился нулевой вектор: направление не определяется.':p.factor<0?'Направление противоположно исходному.':'Направление совпадает с исходным.');}
      if(family==='dot'){const aa=point(3,0),bb=polar(p.length,p.angle);pts(named(aa,'A'),named(bb,'B'));sh(line(O,aa,'blue',false,true),line(O,bb,'green',false,true));Object.assign(v,{a:aa,b:bb,dot:dot(aa,bb),cosine:3*p.length*Math.cos(p.angle*RAD),nonzero:p.length>0});read('a · b',v.dot);r.push(p.length===0?'b — нулевой вектор: произведение 0 не определяет угол между векторами.':Math.abs(v.dot)<EPS?'Оба вектора ненулевые и перпендикулярны.':v.dot>0?'Угол между векторами острый.':'Угол между векторами тупой.');}
    } else if(family==='transform') {
      const t=[point(1,1,'A'),point(4,1,'B'),point(2,3,'C')],theta=(kind==='central'?180:p.angle||0)*RAD,k=p.factor===undefined?1:p.factor,O=point(p.centerX??0,p.centerY??0,'O');
      const f=q=>kind==='translate'?point(q.x+p.x,q.y+p.y):kind==='reflect'?point(2*p.axis-q.x,q.y):kind==='central'?sub(mul(O,2),q):kind==='scale'?mul(q,k):kind==='movement'&&p.kind==='stretch'?point(2*q.x,q.y):point(q.x*Math.cos(theta)-q.y*Math.sin(theta),q.x*Math.sin(theta)+q.y*Math.cos(theta));
      const u=t.map((q,i)=>named(f(q),String.fromCharCode(65+i)+'′'));pts(...t,...u,O);sh(polygon(t),polygon(u,'orange'));for(let i=0;i<3;i++)sh(line(t[i],u[i],'gray',true));
      if(kind==='reflect')sh(line(point(p.axis,-4),point(p.axis,4),'green'));
      Object.assign(v,{original:t,image:u,center:O,length1:dist(t[0],t[1]),length2:dist(u[0],u[1]),ratio:dist(u[0],u[1])/dist(t[0],t[1]),areaRatio:area(...u)/area(...t)});
      read('AB',v.length1);read('A′B′',v.length2);read('Отношение площадей',v.areaRatio);
      if(kind==='scale')r.push(k===0?'При k = 0 фигура схлопнулась в центр; это не подобие невырожденных фигур.':k<0?'Образы на противоположных лучах; длины меняются в |k| раз.':'Образы на тех же лучах; длины меняются в k раз.');
      if(kind==='central')r.push('O — середина AA′, BB′ и CC′. Это поворот на 180°.');
      if(kind==='rotate')read('Один угол поворота всех точек',p.angle+'°');
      if(kind==='movement')r.push(p.kind==='stretch'?'Растяжение только по x изменило расстояния: это не движение.':'Поворот сохраняет расстояния: это движение.');
    } else if(family==='solid') {
      const h=p.height,radius=p.radius||2;
      if(kind==='prism') {
        const base=[point(0,0,'A'),point(4,0,'B'),point(5,1.5,'C'),point(1,1.5,'D')],top=base.map((q,i)=>point(q.x,q.y+h,String.fromCharCode(65+i)+'′')),S=point(2.5,h+1,'S');
        pts(...base,...(p.kind==='pyramid'?[S]:top));sh(polygon(base));if(p.kind==='pyramid')for(const q of base)sh(line(q,S));else{sh(polygon(top));for(let i=0;i<4;i++)sh(line(base[i],top[i]));}
        Object.assign(v,{baseArea:12,height:h,prismVolume:12*h,pyramidVolume:4*h});read('Площадь основания',12);read('Высота',h);read('V призмы',v.prismVolume);read('V пирамиды',v.pyramidVolume);
      } else {
        const O=point(0,0,'O');pts(O);
        const ellipse=(cy,rx,ry,color,dash=false)=>{
          const pp=Array.from({length:49},(_,i)=>point(rx*Math.cos(i*Math.PI/24),cy+ry*Math.sin(i*Math.PI/24)));
          for(let i=1;i<pp.length;i++)sh(line(pp[i-1],pp[i],color,dash));
        };
        if(p.kind==='sphere') {
          sh(circle(O,radius,'orange'));ellipse(0,radius,radius*.3,'gray',true);
          const P=point(radius,0,'P');pts(P);sh(line(O,P,'green'));
        } else {
          ellipse(0,radius,radius*.3,'blue');
          if(p.kind==='cone') {
            const S=point(0,h,'S');pts(S);sh(line(point(-radius,0),S,'orange'),line(point(radius,0),S,'orange'),line(O,S,'green',true));
          } else {
            ellipse(h,radius,radius*.3,'blue');const T=point(0,h,'O′');pts(T);
            sh(line(point(-radius,0),point(-radius,h)),line(point(radius,0),point(radius,h)),line(O,T,'green',true));
          }
        }
        Object.assign(v,{radius,height:h,cylinder:Math.PI*radius*radius*h,cone:Math.PI*radius*radius*h/3,sphere:4*Math.PI*radius**3/3});
        read('V цилиндра / π',radius*radius*h);read('V конуса / π',radius*radius*h/3);read('V шара / π',4*radius**3/3);
      }
      r.push('Пространственная схема не задаёт длины на экране. Сравниваем указанные радиус, площадь основания и перпендикулярную высоту.');
    } else if(family==='ceva'||family==='menelaus'||family==='trig-ceva') {
      const A=point(0,4,'A'),B=point(-3,0,'B'),C=point(4,0,'C'),D=named(add(B,mul(sub(C,B),p.d)),'D'),F=named(add(A,mul(sub(B,A),p.f)),'F');
      tri([A,B,C]);pts(D,F);
      if(family==='menelaus'||p.kind==='menelaus') {
        const E=intersect(D,F,C,A);
        if(!E){Object.assign(v,{valid:false,parallel:true});r.push('Секущая параллельна CA: конечной точки E нет.');sh(line(D,F,'orange'));}
        else {E.label='E';pts(E);sh(line(D,E,'orange'),line(C,E,'gray',true));const product=dist(B,D)/dist(D,C)*dist(C,E)/dist(E,A)*dist(A,F)/dist(F,B);Object.assign(v,{valid:true,D,E,F,product,collinear:cross(sub(F,D),sub(E,D)),outsideE:dot(sub(E,C),sub(E,A))>0});read('BD/DC · CE/EA · AF/FB',product);r.push(v.outsideE?'E на продолжении CA; D и F внутри своих сторон.':'Проверьте, какая из трёх точек лежит на продолжении стороны.');}
      } else {
        const P=intersect(A,D,C,F),E=intersect(B,P,C,A);E.label='E';P.label='P';pts(E,P);sh(line(A,D,'orange'),line(B,E,'green'),line(C,F,'purple'));
        const product=dist(B,D)/dist(D,C)*dist(C,E)/dist(E,A)*dist(A,F)/dist(F,B);
        const sineProduct=Math.sin(angle(B,A,D)*RAD)/Math.sin(angle(D,A,C)*RAD)*Math.sin(angle(C,B,E)*RAD)/Math.sin(angle(E,B,A)*RAD)*Math.sin(angle(A,C,F)*RAD)/Math.sin(angle(F,C,B)*RAD);
        Object.assign(v,{D,E,F,P,product,sineProduct});read('BD/DC · CE/EA · AF/FB',product);if(family==='trig-ceva')read('Произведение трёх отношений синусов',sineProduct);r.push('Третья чевиана проходит через пересечение первых двух.');
      }
    } else if(family==='chord-angles') {
      const O=point(0,0,'O'),rr=3,aa=[0,p.a,180,180+p.b],q=aa.map((a,i)=>named(polar(rr,a),String.fromCharCode(65+i))),P=intersect(q[0],q[2],q[1],q[3]);
      pts(O,...q,named(P,'P'));sh(circle(O,rr),line(q[0],q[2]),line(q[1],q[3],'orange'));
      const actual=angle(q[0],P,q[1]);Object.assign(v,{arcAB:p.a,arcCD:p.b,actual,halfSum:(p.a+p.b)/2});read('Дуга AB',p.a+'°');read('Дуга CD',p.b+'°');read('∠APB',actual);read('Полусумма дуг',(p.a+p.b)/2);
    } else if(family==='radical') {
      const O1=point(0,0,'O₁'),O2=point(p.distance,0,'O₂'),R=3,rr=2;pts(O1,O2);sh(circle(O1,R),circle(O2,rr,'orange'));
      if(p.distance===0){Object.assign(v,{valid:false,concentric:true});r.push('Центры совпали, радиусы разные: равных степеней нет, радикальной оси нет.');}
      else {const x=(p.distance*p.distance+R*R-rr*rr)/(2*p.distance),P=point(x,p.y,'P');pts(P);sh(line(point(x,-4),point(x,4),'purple'),line(O1,O2,'gray',true));Object.assign(v,{valid:true,x,power1:x*x+p.y*p.y-R*R,power2:(x-p.distance)**2+p.y*p.y-rr*rr});read('Степень относительно первой',v.power1);read('Степень относительно второй',v.power2);read('x всей оси',x);}
    } else if(family==='inversion') {
      const O=point(0,0,'O'),R=3,P=named(polar(p.distance,p.angle),'P');pts(O,P);sh(circle(O,R));
      if(p.distance===0){Object.assign(v,{valid:false});r.push('P совпала с центром O: образ при инверсии не определён.');}
      else {const Q=named(polar(R*R/p.distance,p.angle),'P′');pts(Q);sh(line(O,dist(O,Q)>dist(O,P)?Q:P,'orange'));Object.assign(v,{valid:true,distance:p.distance,imageDistance:R*R/p.distance,product:R*R});read('OP',p.distance);read('OP′',R*R/p.distance);read('OP · OP′',R*R);}
    } else if(family==='synthesis') {
      const t=[point(0,0,'A'),point(6,0,'B'),point(2,4,'C')],f=tri(t),k=p.scale,D=named(mul(t[0],k),'D'),E=named(mul(t[1],k),'E'),F=named(mul(t[2],k),'F');pts(D,E,F);sh(polygon([D,E,F],'orange'));
      Object.assign(v,{scale:k,originalArea:f.area,newArea:f.area*k*k,sideRatio:k,areaRatio:k*k});read('Отношение длин',k);read('Отношение площадей',k*k);read('Площадь ABC',f.area);read('Площадь DEF',f.area*k*k);
      r.push('Выберите связь, подходящую к цели: длины — коэффициент подобия; площади — его квадрат.');
    } else throw new Error('Unknown investigation family: '+family);
    return {values:v,readout:r,scene};
  }
  const specs = Object.create(null);
  const n=(key,label,min,max,step,value)=>({key,label,type:'number',min,max,step,value});
  const s=(key,label,values,value)=>({key,label,type:'select',options:values.map(v=>({value:v[0],label:v[1]})),value});
  const angleControl=(value=60,min=20,max=140)=>n('angle','Угол, градусы',min,max,5,value);
  const triangleControls=()=>[n('x','Положение вершины C по горизонтали',1,5,.5,2),n('height','Высота над AB',2,5,.5,4)];
  const scaleControl=()=>n('scale','Коэффициент изменения длин',.5,2.5,.25,1.5);
  function entry(code,family,variant,controls,title,question,choices,action,observation,conclusion,hint) {
    const id='merzlyak-'+(code[0]==='b'?'base-':'advanced-')+code.slice(1);
    if(specs[id])throw new Error('Duplicate investigation '+id);
    specs[id]={id,family,variant,controls,title,question,choices:[...choices,'Пока не знаю'],action,observation,conclusion,
      hint:hint||action,proofNote:'Измерения помогают заметить свойство и найти контрпример. Общее утверждение обосновываем определением, аксиомой или теоремой в следующих этапах.'};
  }
  entry('b7-1','incidence','',[n('d','Расстояние между A и B',0,6,1,4),angleControl(30,-90,90)],
    'Сколько направлений подходит?','Можно ли повернуть прямую через A и сохранить на ней другую точку B?',
    ['При разных A и B подходит одно направление прямой','При разных A и B подходит любое направление'],
    'Поверните синюю прямую до прохождения через B. Затем поставьте AB = 0 и снова поверните её.',
    'Что изменилось, когда две точки совпали?',
    'Через две различные точки проходит ровно одна прямая. Через одну точку можно провести много прямых. Слово «различные» существенно; опыт иллюстрирует аксиому, а не доказывает её.');
  entry('b7-2','segment','',[n('x','Положение B на числовой прямой',-2,10,1,3)],
    'Когда длины складываются?','Всегда ли AB + BC равно AC, если точки лежат на одной прямой?',
    ['Да, порядок точек не важен','Нет, B должна быть между A и C'],
    'Поставьте B внутри AC, затем за A или за C. Сравните сумму двух длин с AC.',
    'Как по расположению B определить, какое равенство длин верно?',
    'Для B на отрезке AC выполнено AB + BC = AC. Если B вне отрезка, путь через B длиннее AC. Сначала определяют порядок точек и общую единицу длины.');
  entry('b7-3','angle','',[angleControl(40,0,180)],
    'Поворот луча','Изменится ли угол, если повернуть только луч OB, оставив общий конец O?',
    ['Изменится величина угла','Угол зависит только от длины лучей на рисунке'],
    'Поставьте 0°, 90° и 180°. У каждого положения определите, совпадают лучи, перпендикулярны или противоположны.',
    'Что означает средняя буква в записи ∠AOB?',
    'Вершина O — общее начало лучей и средняя буква названия угла. Величина угла описывает поворот одного луча к другому, а не длину нарисованных частей лучей.');
  entry('b7-4','crossed','',[angleControl(55,20,160)],
    'Четыре угла при пересечении','Какие углы останутся равными при изменении положения двух пересекающихся прямых?',
    ['Вертикальные углы','Любые соседние углы'],
    'Измените один угол с 55° на 110°. Сравните вертикальный и смежный с ним углы.',
    'Какие равенство и сумма сохраняются в двух положениях?',
    'Вертикальные углы равны. Смежные в сумме дают 180°, потому что их внешние стороны — противоположные лучи. Соседние углы равны только в специальном случае 90°.');
  entry('b7-5','crossed','',[angleControl(65,20,160)],
    'Когда все четыре угла прямые?','Если один угол двух прямых стал 90°, какими будут остальные три?',
    ['Все три тоже 90°','Только противоположный обязательно 90°'],
    'Найдите положение 90°, затем отклонитесь от него на 15°. Сравните все четыре угла.',
    'Почему одного прямого угла достаточно для перпендикулярности прямых?',
    'Вертикальный прямому угол тоже прямой; каждый смежный равен 180° − 90° = 90°. Поэтому при перпендикулярных прямых все четыре угла прямые.');
  entry('b7-6','incidence','axiom',[n('d','Расстояние между отметками',0,6,1,0),angleControl(40,-90,90)],
    'Почему важны условия аксиомы?','Можно ли заменить в аксиоме «две различные точки» словами «две подписи»?',
    ['Да, подписи всегда задают две точки','Нет, подписи могут обозначать одну точку'],
    'При AB = 0 проверьте несколько направлений. Затем разделите точки и найдите подходящую прямую.',
    'Какое условие предотвращает неоднозначность?',
    'Аксиома — принимаемое исходное утверждение. При совпавших точках её условие «различные» не выполнено. Несколько удачных рисунков не превращают аксиому в доказанную теорему.');
  entry('b7-7','cevians','',triangleControls(),
    'Три линии из одной вершины','Всегда ли медиана, высота и биссектриса из C — один и тот же отрезок?',
    ['Всегда совпадают','В общем случае это разные отрезки'],
    'Меняйте положение C по горизонтали. Сравните середину M, основание высоты H и точку D биссектрисы.',
    'Как узнавать каждую линию по её свойству, а не по цвету?',
    'CM идёт в середину AB; CH перпендикулярна AB; CD делит угол C пополам. Эти определения различны. В равнобедренном треугольнике линия к основанию может выполнять все три роли.');
  entry('b7-8','congruence','',[s('mode','Какие данные закреплены',[['sides','Только две стороны'],['sas','Две стороны и угол между ними'],['asa','Сторона и два прилежащих угла']],'sides'),angleControl(50,20,100),n('delta','Дополнительный угол второй фигуры без третьего условия',0,30,5,20)],
    'Чего достаточно для равенства?','Две соответствующие стороны равны. Обязательно ли равны треугольники?',
    ['Двух сторон достаточно','Нужно ещё условие, например угол между ними'],
    'В режиме двух сторон измените дополнительный угол. Затем сравните режимы первого и второго признаков.',
    'Что остаётся одинаковым и что может измениться, пока третье условие не закреплено?',
    'Две стороны сами по себе не определяют треугольник. Первый признак добавляет угол между ними. Второй использует сторону и два прилежащих угла. Сравнивают соответствующие элементы в одном порядке.');
  entry('b7-9','isosceles','',[n('height','Высота C над серединой AB',1,5,.5,3)],
    'Две равные стороны','Сохранится ли равенство углов у основания, если менять высоту равнобедренного треугольника?',
    ['Да, пока CA = CB','Только для одного размера треугольника'],
    'Меняйте высоту C над серединой AB. Следите за CA, CB и углами A, B.',
    'Что меняется при движении вершины, а какие равенства сохраняются?',
    'У равнобедренного треугольника углы при основании равны. Линия из вершины C в середину основания делит его на равные треугольники; она одновременно медиана, высота и биссектриса.');
  entry('b7-10','iso-converse','',[n('alpha','Угол A, градусы',30,70,5,40),n('beta','Угол B, градусы',30,70,5,55)],
    'От углов к сторонам','Если углы A и B сделать равными, какие стороны сравняются?',
    ['Противолежащие BC и AC','Всегда все три стороны'],
    'Поставьте A = B, затем измените только один из углов. Сравните противоположные им стороны.',
    'Почему здесь равенство углов — условие, а равенство сторон — вывод?',
    'Равным углам треугольника противолежат равные стороны. Это признак равнобедренного треугольника. Он не требует равенства третьего угла и не делает каждый такой треугольник равносторонним.');
  entry('b7-11','sss','',[n('base','Третья сторона AB',0,10,1,6),s('side','Сторона прямой AB',[['1','Выше AB'],['-1','Ниже AB']],'1')],
    'Три стороны и две зеркальные картинки','При заданных трёх сторонах отражение вершины C относительно AB меняет форму треугольника?',
    ['Форма и размеры сохраняются','Третья сторона после отражения меняется'],
    'Для сторон 4, 5, 6 сравните верхнее и нижнее положение C. Затем поставьте AB = 9.',
    'Почему два положения C дают равные треугольники, а при AB = 9 треугольника нет?',
    'Три соответствующие стороны задают равные треугольники, в том числе зеркально расположенные. При равенстве суммы двух сторон третьей получается вырожденная фигура; третий признак к ней не применяется.');
  entry('b7-12','logic','theorem',[n('width','Ширина прямоугольника',2,6,1,3)],
    'Утверждение и обратное','Из «каждый квадрат — прямоугольник» следует ли «каждый прямоугольник — квадрат»?',
    ['Да, утверждение можно всегда обратить','Нет, нужен отдельный довод или контрпример'],
    'Сначала рассмотрите квадрат 3×3, затем прямоугольник 5×3. Проверьте обе формулировки.',
    'Какой рисунок служит контрпримером обратному утверждению?',
    'Из A ⇒ B без дополнительного обоснования не следует B ⇒ A. Прямоугольник 5×3 опровергает обратное утверждение: все его углы прямые, но не все стороны равны.');
  entry('b7-13','parallels','definition',[n('delta','Отклонение направления второй прямой, градусы',-20,20,5,10)],
    'Прямые за краем рисунка','Если две видимые части прямых не пересекаются, достаточно ли этого для параллельности?',
    ['Достаточно видеть отсутствие пересечения','Нет, прямые продолжаются бесконечно'],
    'Сравните отклонения 0° и 5°. Подумайте, что произойдёт за пределами видимого окна.',
    'Почему короткие отрезки на экране могут скрывать пересечение прямых?',
    'Различные параллельные прямые одной плоскости не имеют общих точек на всём продолжении. Рисунок показывает лишь их части; отсутствие пересечения в окне не является доказательством.');
  entry('b7-14','parallels','criterion',[n('delta','Разность направлений прямых, градусы',-20,20,5,15)],
    'Проверка признака параллельности','Когда соответственные углы с одной секущей сравняются?',
    ['Когда разные прямые будут параллельны','При любом наклоне второй прямой'],
    'Уменьшайте отклонение второй прямой до совпадения соответственных углов.',
    'Как равенство углов позволяет установить параллельность?',
    'Равные соответственные углы при секущей дают признак параллельности двух прямых. Нужно сравнивать именно правильную пару углов, а не любые подписи на рисунке.');
  entry('b7-15','parallels','properties',[angleControl(55,30,120)],
    'Углы при параллельных прямых','Если менять наклон секущей, что сохранится у односторонних внутренних углов?',
    ['Их сумма 180°','Каждый обязательно останется 90°'],
    'Поменяйте наклон секущей, сохраняя две прямые параллельными. Сравните соответственные углы и одностороннюю пару.',
    'Какие углы равны, а какие нужно складывать?',
    'При параллельных прямых соответственные и накрест лежащие углы равны. Односторонние внутренние углы в сумме дают 180°, но не обязаны быть прямыми.');
  entry('b7-16','triangle-angles','',triangleControls(),
    'Движется вершина — меняется сумма?','Изменится ли сумма внутренних углов, когда C сдвинется, а треугольник останется невырожденным?',
    ['Сумма останется 180°','Сумма вырастет вместе с высотой'],
    'Передвиньте C в два разных положения. Сложите три угла и сравните внешний при B с суммой двух несмежных внутренних.',
    'Какие суммы сохраняются при изменении формы?',
    'У невырожденного треугольника A + B + C = 180°. Внешний угол при B равен A + C. Свойство обосновывают через параллельную прямую и углы при секущей, а не точностью экранных измерений.');
  entry('b7-17','right','angles',[angleControl(40,20,70)],
    'Два острых угла','Если один острый угол прямоугольного треугольника увеличится на 10°, что произойдёт со вторым?',
    ['Уменьшится на 10°','Тоже увеличится на 10°'],
    'Поставьте угол A = 40°, затем 50°. Прямой угол C сохраняется.',
    'Как найти второй острый угол без измерения?',
    'Один угол уже равен 90°. Из суммы 180° следует A + B = 90°. Поэтому B = 90° − A.');
  entry('b7-18','right','properties',[angleControl(30,20,70)],
    '30° и середина гипотенузы','Какую долю гипотенузы составляет катет BC против угла A = 30°?',
    ['Половину','Треть'],
    'Сравните A = 30° и 45°. Отдельно проверьте длину CM до середины гипотенузы.',
    'Какое свойство верно только при 30°, а какое — для любого прямоугольного треугольника?',
    'Катет против 30° равен половине гипотенузы. Медиана к гипотенузе равна её половине при любом остром угле A. Эти два условия нельзя смешивать.');
  entry('b7-19','circle-locus','',[n('distance','Расстояние OP',0,5,.5,3),angleControl(40,0,180)],
    'Окружность или круг?','Если расстояние OP меньше радиуса, лежит ли P на окружности?',
    ['Да, любая точка круга лежит на окружности','Нет, она внутри круга'],
    'Сохраняйте OP = 3 и меняйте направление. Затем измените только расстояние.',
    'Какая проверка отличает окружность от всего круга?',
    'Окружность задаётся равенством OP = R. Круг состоит из точек OP ≤ R. Все направления при одном расстоянии R дают окружность, а не весь круг.');
  entry('b7-20','chord-tangent','',[n('distance','Расстояние от центра до прямой',0,4,.5,1.5)],
    'От хорды к касательной','Сколько общих точек останется, когда расстояние от центра до прямой станет равно радиусу?',
    ['Одна','Две'],
    'Поставьте расстояния 2, 3 и 4 при радиусе 3. Проследите, что происходит с хордой.',
    'Как сравнение расстояния с радиусом различает три положения прямой?',
    'При расстоянии меньше R имеются две общие точки; при R — одна точка касания; при большем расстоянии общих точек нет. Радиус в точку касания перпендикулярен касательной.');
  entry('b7-21','centers','two',triangleControls(),
    'Два центра — разные расстояния','Центр вписанной окружности должен быть равноудалён от вершин или от сторон?',
    ['От сторон','От вершин'],
    'Передвиньте C. Сравните серую окружность через вершины и зелёную, касающуюся сторон.',
    'Какие расстояния определяют каждый из двух центров?',
    'Центр описанной окружности равноудалён от вершин и находится на серединных перпендикулярах. Центр вписанной равноудалён от сторон и находится на биссектрисах. Они не обязаны совпадать.');
  entry('b7-22','two-circles','construction',[n('radius','Одинаковый радиус циркуля',2,5,.5,4)],
    'Построение серединного перпендикуляра','Любого ли одинакового радиуса достаточно, чтобы получить две общие точки окружностей вокруг A и B?',
    ['Да, любого положительного','Нет, радиус должен превышать половину AB'],
    'Сравните радиусы 2, 3 и 4 при AB = 6. При двух пересечениях рассмотрите прямую PQ.',
    'Почему одинаковые окружности дают именно серединный перпендикуляр?',
    'Каждая общая точка равноудалена от A и B. Две такие точки при R > AB/2 задают серединный перпендикуляр. При R = AB/2 имеется только середина, при меньшем R пересечений нет.');
  entry('b7-23','two-circles','locus',[n('radius','Требуемое расстояние от P до A и B',2,5,.5,2.5)],
    'Пересечение двух условий','Сколько точек P удовлетворяет PA = PB = R при AB = 6?',
    ['Число зависит от R','Всегда ровно две'],
    'Измените R через значение 3. Каждая окружность задаёт одно из двух равенств.',
    'Как найти точки, удовлетворяющие сразу обоим условиям?',
    'Искомые точки — общие точки двух геометрических мест. Здесь их 0, 1 или 2 в зависимости от R. Проверять нужно оба исходных условия.');
  entry('b8-1','polygon','quad',[n('shift','Сдвиг вершины C',-1,1,.5,0)],
    'Сторона или диагональ?','Сколько диагоналей имеет выпуклый четырёхугольник?',
    ['Две','Четыре'],
    'Сдвиньте C и проследите, какие соединения остаются сторонами, а какие соединяют несоседние вершины.',
    'Почему отрезки AC и BD — диагонали, а AB — сторона?',
    'Диагональ соединяет несоседние вершины. У четырёхугольника это AC и BD; изменение формы не меняет соседство вершин.');
  entry('b8-2','quadrilateral','properties',[n('shift','Наклон верхней стороны',-2,3,.5,1)],
    'Диагонали параллелограмма','Должны ли диагонали параллелограмма быть равными?',
    ['Обязательно равны','Не обязательно; обязательно делятся пополам'],
    'Изменяйте наклон при двух парах параллельных сторон. Сравните длины диагоналей и их середины.',
    'Какое свойство сохраняется, даже когда диагонали разной длины?',
    'Диагонали параллелограмма делятся точкой пересечения пополам. Их равенство — дополнительное свойство прямоугольника, а не любого параллелограмма.');
  entry('b8-3','quadrilateral','test',[n('offset','Сдвиг D относительно параллелограмма',-2,2,.5,1)],
    'Достаточность середины диагоналей','Если середины AC и BD совпали, достаточно ли этого для параллелограмма?',
    ['Да, для невырожденного четырёхугольника','Нет, нужно отдельно измерять все углы'],
    'Подберите положение D до совпадения середин диагоналей. Затем снова сдвиньте D.',
    'Что происходит с боковыми сторонами при совпадении середин?',
    'Если диагонали четырёхугольника делятся пополам, противоположные треугольники равны; отсюда следует параллельность противоположных сторон. Это признак параллелограмма.');
  entry('b8-4','quadrilateral','rectangle',[n('width','Ширина',2,6,1,5),n('height','Высота',2,5,1,3)],
    'Равные диагонали','Изменятся ли равенство диагоналей и прямые углы, если растянуть прямоугольник по ширине?',
    ['Сохранятся','Диагонали сравняются только у квадрата'],
    'Сравните прямоугольники 5×3 и 3×3. Отделите общие свойства от свойств квадрата.',
    'Что даёт прямой угол в параллелограмме?',
    'У прямоугольника все углы прямые, а диагонали равны и делятся пополам. Равенства всех четырёх сторон из этого не следует.');
  entry('b8-5','quadrilateral','rhombus',[angleControl(60,40,140)],
    'Диагонали ромба','При изменении угла ромба его диагонали останутся равными или перпендикулярными?',
    ['Перпендикулярными','Обязательно равными'],
    'Меняйте угол при одинаковых четырёх сторонах. Сравните 60°, 90° и 120°.',
    'Как отличить общее свойство ромба от особого случая квадрата?',
    'Диагонали ромба перпендикулярны и делят углы пополам. Их длины вообще различны; равны они у квадрата.');
  entry('b8-6','quadrilateral','square',[angleControl(70,45,135),n('ratio','Отношение соседних сторон',1,2,.25,1.5)],
    'Два условия для квадрата','Достаточно ли равных соседних сторон параллелограмма, чтобы он был квадратом?',
    ['Достаточно','Нужен также прямой угол'],
    'Сначала сделайте отношение сторон равным 1. Затем установите угол 90°; сравните свойства.',
    'Какие два условия нужно выполнить одновременно?',
    'Квадрат — прямоугольник с равными сторонами или ромб с прямым углом. Отдельно равенство сторон и отдельно прямой угол недостаточны.');
  entry('b8-7','midline','',[n('fraction','Доля пути от C по обеим сторонам',.25,.75,.25,.5),n('x','Положение вершины C',1,5,1,2)],
    'Почему половина основания?','Если D и E — середины CA и CB, какую часть AB составляет DE?',
    ['Половину','Столько же, сколько AB'],
    'При доле 1/2 передвиньте C. Затем сравните с долей 1/4, сохранив одинаковую долю на двух сторонах.',
    'Какая связь определяется именно словом «середины»?',
    'Средняя линия соединяет середины двух сторон; она параллельна третьей стороне и равна её половине. При другой одинаковой доле получается параллельный отрезок, но не средняя линия.');
  entry('b8-8','trapezoid','properties',[n('top','Верхнее основание',2,6,1,4),n('shift','Сдвиг верхнего основания',0,3,.5,1)],
    'Основания и боковые стороны','Когда у трапеции равны углы при основании?',
    ['У любой трапеции','В частности, когда она равнобедренная'],
    'При основаниях 6 и 4 сравните сдвиги 1 и 2. Затем поставьте верхнее основание 6.',
    'Как узнать равнобедренную трапецию и почему случай равных оснований нужно назвать отдельно?',
    'У равнобедренной трапеции боковые стороны и углы при каждом основании равны. В принятом здесь определении у трапеции ровно одна пара параллельных сторон; при двух парах это параллелограмм.');
  entry('b8-9','inscribed','',[n('arc','Дуга AB без вершины C, градусы',40,160,20,80),n('vertex','Положение C на другой дуге, градусы',120,240,20,180)],
    'Одна дуга — два угла','Как связан вписанный угол ACB с центральным углом AOB, опирающимся на ту же дугу?',
    ['Вписанный вдвое меньше','Вписанный равен центральному'],
    'Сначала двигайте C на противоположной дуге, сохраняя A и B. Затем измените саму дугу AB.',
    'Почему положение C на одной и той же дуге не меняет ∠ACB?',
    'Вписанный угол равен половине дуги, не содержащей его вершину. Поэтому вписанные углы, опирающиеся на одну и ту же дугу, равны.');
  entry('b8-10','circle-quad','',[s('kind','Как связана окружность с четырёхугольником',[['cyclic','Через все вершины'],['tangent','Касается всех сторон']],'cyclic'),n('shift','Изменение одной вершины / касательной, градусы',-30,30,10,20)],
    'Вписать или описать?','Какую пару величин нужно сравнивать у вписанного и у описанного четырёхугольника?',
    ['У вписанного — противоположные углы; у описанного — суммы сторон','У обоих только длины диагоналей'],
    'Измените форму в каждом из двух режимов. Сравните сумму противоположных углов и суммы противоположных сторон.',
    'Какое равенство относится к каждому способу расположения окружности?',
    'У выпуклого вписанного четырёхугольника сумма противоположных углов равна 180°. У описанного около окружности суммы противоположных сторон равны. Названия и условия этих фактов различны.');
  entry('b8-11','thales','',[n('fraction','Доля на первой стороне угла',.25,.75,.25,.5),n('x','Наклон второй стороны',1,5,1,2)],
    'Одинаковые доли на двух сторонах','Если отсекающий отрезок параллелен основанию, одинаковы ли CD/CA и CE/CB?',
    ['Да, отношения равны','Нет, равными должны быть только длины CD и CE'],
    'Изменяйте долю и наклон треугольника, сохраняя DE параллельным AB.',
    'Почему сравниваются отношения, а не сами длины на разных сторонах?',
    'Параллельные прямые отсекают пропорциональные отрезки на сторонах угла. Соответствующие доли равны, хотя сами стороны могут иметь разные длины.');
  entry('b8-12','similarity','definition',[scaleControl()],
    'Один коэффициент для всех сторон','При увеличении всех сторон в k раз углы тоже увеличиваются в k раз?',
    ['Нет, соответствующие углы сохраняются','Да, углы растут вместе со сторонами'],
    'Измените коэффициент от 1/2 до 2. Сравните три отношения сторон и углы.',
    'Что следует указывать вместе с записью подобия ABC ∼ DEF?',
    'Подобие сохраняет соответствующие углы и задаёт один коэффициент для всех соответствующих длин. Порядок букв определяет соответствие вершин.');
  entry('b8-13','similarity','aa',[scaleControl(),angleControl(50,30,100)],
    'Два равных угла','Если два соответствующих угла совпадают, может ли третий отличаться?',
    ['Нет, третий определяется суммой 180°','Да, его нужно задавать отдельно'],
    'Меняйте размер второй фигуры и общий угол. Проверьте равенство трёх углов и отношения сторон.',
    'Как сумма углов помогает получить первый признак подобия?',
    'Два равных угла определяют равенство третьих углов. Треугольники подобны по первому признаку; их размеры при этом могут отличаться.');
  entry('b8-14','similarity','sas',[scaleControl(),s('condition','Какие условия проверяем',[['sides','Только две пары сторон'],['sas','Две пары сторон и угол между ними'],['sss','Все три пары сторон']],'sides'),n('delta','Изменение угла без третьего условия',0,30,10,20)],
    'Двух отношений недостаточно','Два отношения соответствующих сторон равны. Достаточно ли этого для подобия?',
    ['Нужен ещё угол между сторонами или третье отношение','Этого всегда достаточно'],
    'В первом режиме измените угол второй фигуры. Затем сравните полный второй признак и три отношения сторон.',
    'Какое недостающее условие устраняет контрпример?',
    'Для второго признака нужны пропорциональные стороны и равные углы между ними. Для третьего — пропорциональность всех трёх пар сторон. Два отношения без угла недостаточны.');
  entry('b8-15','projections','',[angleControl(35,20,70)],
    'Высота и проекции','К чему равно CH² для высоты прямоугольного треугольника к гипотенузе?',
    ['AH · HB','AH + HB'],
    'Измените острый угол, сохраняя гипотенузу 6. Сравните квадрат высоты с произведением проекций.',
    'Какие два прямоугольных треугольника нужно сравнить по подобию?',
    'Из подобия трёх прямоугольных треугольников получают CH² = AH·HB, AC² = AB·AH и BC² = AB·HB. Важно согласовать катет с его проекцией.');
  entry('b8-16','right','pythagoras',[angleControl(45,20,70),n('hypotenuse','Гипотенуза AB',4,8,1,6)],
    'Сумма квадратов','При изменении формы прямоугольного треугольника что равно AB²?',
    ['AC² + BC²','AC + BC'],
    'Изменяйте острый угол и длину гипотенузы. Сравните сумму квадратов катетов с квадратом гипотенузы.',
    'Почему в равенстве присутствуют квадраты, а не сами длины?',
    'В прямоугольном треугольнике сумма квадратов катетов равна квадрату гипотенузы. Складывая AC² = AB·AH и BC² = AB·HB, получаем AB·(AH+HB) = AB².');
  entry('b8-17','trig-right','ratios',[angleControl(35,20,70),n('hypotenuse','Масштаб: гипотенуза AB',4,8,1,6)],
    'Отношение зависит от угла','Изменится ли BC/AB, если увеличить треугольник, сохранив угол A?',
    ['Не изменится','Увеличится вместе с гипотенузой'],
    'Сначала меняйте только гипотенузу, потом только угол. Следите за тремя отношениями сторон.',
    'Какие отношения называют sin A, cos A и tg A?',
    'Для острого A: sin A = BC/AB, cos A = AC/AB, tg A = BC/AC. При одном угле прямоугольные треугольники подобны, поэтому отношения не зависят от масштаба.');
  entry('b8-18','trig-right','solve',[angleControl(30,20,70),n('hypotenuse','Известная гипотенуза AB',4,10,1,8)],
    'Из угла и гипотенузы — катеты','Как найти катет BC, противоположный углу A?',
    ['AB · sin A','AB · cos A'],
    'Сравните угол 30° при гипотенузах 8 и 10, затем измените угол. Проверьте выбранную формулу.',
    'Как понять, какой катет противоположный, а какой прилежащий?',
    'При выбранном угле A противоположный катет BC = AB·sin A, прилежащий AC = AB·cos A. Перед формулой нужно установить роли сторон относительно именно этого угла.');
  entry('b8-19','polygon','general',[n('n','Число сторон',3,10,1,5)],
    'Разбить многоугольник на треугольники','На сколько треугольников диагонали из одной вершины делят выпуклый n-угольник?',
    ['На n − 2','На n'],
    'Сравните четырёхугольник, пятиугольник и шестиугольник. Считайте части из одной вершины.',
    'Как из числа частей получить сумму внутренних углов?',
    'Выпуклый n-угольник разбивается из одной вершины на n−2 треугольника. Их углы дают сумму (n−2)·180°. Здесь выпуклость обеспечивает выбранное разбиение внутри фигуры.');
  entry('b8-20','quadrilateral','area-rectangle',[n('width','Ширина прямоугольника',2,6,1,4),n('height','Высота прямоугольника',2,6,1,3)],
    'Площадь и периметр','Если ширину удвоить, а высоту сохранить, удвоятся и площадь, и периметр?',
    ['Удвоится площадь; периметр обычно нет','Всегда удвоятся оба'],
    'Сравните 3×3 и 6×3. Затем найдите два прямоугольника с одинаковым периметром и разными площадями.',
    'Почему площадь и длина границы изменяются по разным правилам?',
    'Площадь прямоугольника ab измеряет число квадратных единиц; периметр 2(a+b) измеряет границу. Одинаковый периметр не задаёт одинаковую площадь.');
  entry('b8-21','quadrilateral','area-parallelogram',[n('shift','Наклон боковой стороны',-2,3,1,1),n('height','Перпендикулярная высота',2,5,1,3)],
    'Площадь при сдвиге','Изменится ли площадь параллелограмма, если сдвигать верхнюю сторону без изменения высоты?',
    ['Не изменится','Увеличится вместе с боковой стороной'],
    'Меняйте наклон при фиксированной высоте. Затем измените саму высоту.',
    'Какую пару длин нужно перемножить: основание и высоту или две стороны?',
    'Площадь параллелограмма S = a·h. Сдвиг при фиксированных a и h не меняет площадь; наклонная боковая сторона не заменяет перпендикулярную высоту.');
  entry('b8-22','area-triangle','',[n('x','Положение вершины над прямой AB',-2,8,1,2),n('height','Высота над AB',2,5,1,4)],
    'Высота может падать за сторону','Изменится ли площадь треугольника, если C двигать параллельно AB на одной высоте?',
    ['Не изменится','За пределами AB формула перестаёт работать'],
    'Передвиньте C так, чтобы H оказалась сначала внутри AB, затем за его концом.',
    'Почему высота проводится к прямой стороны, а не обязательно внутрь отрезка?',
    'S = AB·CH/2, где CH перпендикулярна прямой AB. Основание высоты может лежать на продолжении стороны; при той же высоте площадь сохраняется.');
  entry('b8-23','trapezoid','area',[n('top','Верхнее основание',2,5,1,3),n('height','Высота',2,5,1,3),n('shift','Сдвиг верхнего основания',0,3,.5,1)],
    'Две площади с одной высотой','На площадь трапеции при фиксированных основаниях и высоте влияет боковой сдвиг?',
    ['Не влияет','Влияет длина наклонной стороны'],
    'Меняйте сдвиг и сравнивайте площадь. Затем измените верхнее основание.',
    'Как диагональ помогает получить формулу площади?',
    'Диагональ делит трапецию на два треугольника площадей ah/2 и bh/2. Поэтому S = (a+b)h/2; наклон боковых сторон в эту формулу не входит.');
  entry('b9-1','trig-circle','',[angleControl(60,0,180)],
    'Острый и тупой углы','Как изменится знак косинуса при переходе через 90°?',
    ['Станет отрицательным','Останется положительным'],
    'Сравните 60°, 90° и 120°, затем 0° и 180°. Следите за координатами точки.',
    'При каких углах не определены тангенс или котангенс?',
    'На единичной полуокружности x = cos α, y = sin α. Для тупого угла x отрицателен. tg α не определён при cos α = 0, а ctg α — при sin α = 0.');
  entry('b9-2','cosine','',[angleControl(70,30,140)],
    'Пифагор с поправкой','При двух фиксированных сторонах третья увеличивается или уменьшается, когда угол между ними растёт?',
    ['Увеличивается','Уменьшается'],
    'Сравните углы 60°, 90° и 120° при сторонах 5 и 4. Проверьте квадрат третьей стороны.',
    'Что происходит с поправкой −2ab cos γ при переходе через прямой угол?',
    'c² = a²+b²−2ab cos γ. При 90° косинус нулевой и получается теорема Пифагора. Для тупого угла поправка положительна, поэтому противоположная сторона больше.');
  entry('b9-3','sine','',[angleControl(60,30,140)],
    'Сторона против своего угла','Равны ли a/sin A, b/sin B и c/sin C у треугольника с разными сторонами?',
    ['Да, если каждая сторона сопоставлена своему углу','Только у равностороннего'],
    'Изменяйте угол A при сторонах AB = 5 и AC = 4. Сравните три отношения с диаметром описанной окружности.',
    'Почему нельзя делить сторону на синус соседнего, произвольно выбранного угла?',
    'Теорема синусов связывает сторону с противолежащим углом: a/sin A = b/sin B = c/sin C = 2R. Правильное соответствие сторон и углов обязательно.');
  entry('b9-4','solve-triangle','',[angleControl(50,30,140)],
    'Какого способа достаточно?','Даны две стороны и угол между ними. Как надёжно найти третью сторону?',
    ['Сначала применить теорему косинусов','Сложить две известные стороны'],
    'Сравните два угла при тех же AB = 5 и AC = 4. Проследите, какие элементы определяются данными.',
    'Почему только двух сторон было бы недостаточно?',
    'Две стороны и угол между ними определяют треугольник. Теорема косинусов даёт третью сторону; затем находят остальные углы. Сумма двух сторон — не третья сторона треугольника.');
  entry('b9-5','heron','',[n('base','Третья сторона',0,10,1,6)],
    'Герон и существование треугольника','Можно ли применять формулу площади к любым трём положительным числам?',
    ['Нет, сначала проверяют неравенства треугольника','Да, положительности достаточно'],
    'При сторонах 4 и 5 сравните третью сторону 6, 9 и 10.',
    'Что означают нулевая площадь на границе и отсутствие треугольника за ней?',
    'Для невырожденного треугольника сначала проверяют строгие неравенства сторон. Затем p = (a+b+c)/2 и S = √(p(p−a)(p−b)(p−c)). Нулевая площадь на границе не описывает обычный треугольник.');
  entry('b9-6','polygon','regular',[n('n','Число сторон правильного многоугольника',3,12,1,6)],
    'Один полный оборот','Как меняется центральный угол правильного n-угольника при увеличении n?',
    ['Уменьшается: 360° делится на n','Увеличивается на 180°'],
    'Сравните правильные треугольник, шестиугольник и двенадцатиугольник.',
    'Как центральный угол помогает найти внутренний угол многоугольника?',
    'Радиусы к соседним вершинам образуют угол 360°/n. Каждый центральный треугольник равнобедренный; внутренний угол многоугольника равен 180° − 360°/n.');
  entry('b9-7','circle-metric','',[n('radius','Радиус',1,5,1,2),n('angle','Центральный угол дуги, градусы',30,360,30,90)],
    'Радиус, длина и площадь','Если радиус удвоить, во сколько раз изменится площадь круга?',
    ['В четыре раза','В два раза'],
    'Сравните R = 2 и R = 4. Отдельно меняйте угол дуги при неизменном радиусе.',
    'Чем различаются зависимости длины окружности, площади и длины дуги?',
    'Длина окружности 2πR пропорциональна радиусу, площадь πR² — квадрату радиуса. Длина дуги Rα использует угол в радианах; в градусах это 2πR·α/360°.');
  entry('b9-8','coordinates','',[n('x','Координата x точки B',0,6,1,4),n('y','Координата y точки B',-2,6,1,5)],
    'Расстояние и середина','Длина AB равна сумме разностей координат или гипотенузе прямоугольного треугольника?',
    ['Гипотенузе','Сумме разностей'],
    'Перемещайте B при A = (−2; 1). Сравните разности координат, длину AB и координаты M.',
    'Почему координаты середины усредняются, а длина вычисляется иначе?',
    'M = ((xA+xB)/2; (yA+yB)/2). По теореме Пифагора AB = √((xB−xA)²+(yB−yA)²). Эти формулы решают разные задачи.');
  entry('b9-9','circle-equation','',[n('x','Координата x точки P',-2,4,1,4),n('y','Координата y точки P',-4,2,1,-1)],
    'Уравнение выбирает точки','Какие точки принадлежат окружности (x−1)²+(y+1)² = 9?',
    ['Те, у которых выражение равно 9','Все, у которых выражение не больше 9'],
    'Поставьте P = (4; −1), затем (1; −1) и ещё одну точку. Сравните значение выражения с 9.',
    'Почему знак равенства задаёт окружность, а не весь круг?',
    'Выражение слева — квадрат расстояния до центра (1; −1). Равенство 9 задаёт расстояние 3 и только границу круга. Неравенство ≤9 задавало бы весь круг.');
  entry('b9-10','line-equation','',[s('kind','Вид прямой',[['ordinary','y = kx + b'],['vertical','x = b']],'ordinary'),n('slope','k',-2,2,.5,1),n('intercept','b',-2,2,1,1)],
    'Вертикальную прямую тоже можно записать','Можно ли каждую прямую представить как y = kx + b с конечным k?',
    ['Нет, вертикальные прямые имеют вид x = a','Да, любую'],
    'Сравните обычную прямую и режим x = b. Проверьте, какая координата остаётся постоянной.',
    'Почему у вертикальной прямой нельзя вычислить k делением Δy на Δx?',
    'Общее уравнение Ax+By+C=0 задаёт прямую при (A;B) ≠ (0;0). Форма y=kx+b требует B≠0. Вертикальная прямая имеет вид x=a и нулевую разность x между своими точками.');
  entry('b9-11','slope','',[n('slope','Угловой коэффициент k',-2,2,.5,1),n('intercept','Свободный член b',-2,2,1,0)],
    'Наклон и вертикальный сдвиг','Если изменить только b, изменится ли наклон прямой?',
    ['Нет, изменится пересечение с осью y','Да, наклон определяет b'],
    'Сначала меняйте b при k = 1. Затем меняйте k при фиксированном b.',
    'Как связать k с изменением y при увеличении x?',
    'k = Δy/Δx показывает скорость изменения ординаты. b — значение y при x=0. Изменение b сдвигает прямую параллельно, а изменение k меняет её наклон.');
  entry('b9-12','vector','',[n('x','Координата начала A: x',-3,3,1,1),n('y','Координата начала A: y',-2,3,1,2)],
    'Перенести вектор','Если изменить начало вектора, сохранив перемещение (3; 1), получится ли равный вектор?',
    ['Да, длина и направление сохраняются','Нет, равные векторы должны начинаться в одной точке'],
    'Переместите A по двум координатам. Сравните синие и зелёные стрелки.',
    'Какие свойства задают равенство ненулевых векторов?',
    'Равные ненулевые векторы имеют одинаковые длины и направления. Начало свободного вектора можно переносить, если сохраняется направленное перемещение.');
  entry('b9-13','vector-coordinates','',[n('ax','Координата начала A: x',-3,3,1,1),n('ay','Координата начала A: y',-3,3,1,-1),n('dx','Перемещение от A по горизонтали',-4,4,1,3),n('dy','Перемещение от A по вертикали',-4,4,1,4)],
    'Координаты точки и координаты вектора','Всегда ли координаты вектора AB совпадают с координатами его конца B?',
    ['Только если A — начало координат','Да, положение A не имеет значения'],
    'Сравните координаты A, B и вектора AB. Меняйте положение A, сохраняя два перемещения. Затем измените знак горизонтального перемещения. Синяя стрелка показывает тот же вектор с началом в O.',
    'Что нужно вычесть из координат B, чтобы получить координаты AB? Что меняется при переносе обоих концов на одно и то же расстояние?',
    'В прямоугольной системе координат AB = (xB − xA; yB − yA). Эти числа задают направленные перемещения по двум осям. Перенос обоих концов на одно и то же расстояние не меняет разностей. Координаты точки B совпадают с координатами вектора AB только при A = O.');
  entry('b9-14','vector-add','',[n('x','Координата b: x',-3,3,1,-1),n('y','Координата b: y',-3,3,1,2)],
    'Сумма как путь','Куда направлен a+b, если начало b приставить к концу a?',
    ['От начала первого к концу второго','От конца первого к началу второго'],
    'Меняйте b. Проследите путь O→A→S и сравните его с оранжевой стрелкой O→S.',
    'Какое перемещение представляет разность a−b?',
    'Сумма ведёт от начала первого перемещения к концу второго. При общем начале a−b направлен от конца b к концу a. Координаты складываются или вычитаются по соответствующим компонентам.');
  entry('b9-15','vector-scale','',[n('factor','Множитель k',-2,2,.5,1.5)],
    'Множитель и направление','При отрицательном k вектор ka направлен так же, как a?',
    ['Нет, направление противоположно','Да, меняется только длина'],
    'Сравните k = 2, −1 и 0. Следите за направлением и длиной.',
    'Почему длина умножается на |k|, а не на само отрицательное число?',
    'Длина ka равна |k|·|a|. При k<0 направление меняется на противоположное. При k=0 получается нулевой вектор, которому направление не приписывают.');
  entry('b9-16','dot','',[angleControl(60,0,180),n('length','Длина второго вектора',0,4,1,2)],
    'Произведение и прямой угол','Всегда ли из a·b = 0 следует, что угол между векторами равен 90°?',
    ['Только если оба вектора ненулевые','Даже если один вектор нулевой'],
    'Сравните угол 90° при ненулевых длинах и случай нулевой длины b.',
    'Какое условие необходимо добавить к признаку перпендикулярности?',
    'a·b = |a||b|cos φ. Для двух ненулевых векторов нулевое произведение означает cos φ=0 и угол 90°. При нулевом векторе произведение тоже ноль, но угол не определён.');
  entry('b9-17','transform','translate',[n('x','Перенос по горизонтали',-3,3,1,2),n('y','Перенос по вертикали',-3,3,1,1)],
    'Одно перемещение для каждой точки','Что сохранится при одинаковом переносе всех вершин треугольника?',
    ['Длины и углы','Только площадь, но не длины'],
    'Изменяйте обе координаты переноса. Сравните AB с A′B′ и направления AA′, BB′.',
    'Почему нельзя сдвигать вершины на разные векторы и называть это переносом?',
    'При параллельном переносе AA′=BB′=CC′ как векторы. Разности координат двух точек сохраняются, поэтому сохраняются расстояния, углы и форма.');
  entry('b9-18','transform','reflect',[n('axis','Положение вертикальной оси x =',-1,4,1,0)],
    'Ось между точкой и образом','Как расположена ось симметрии относительно AA′?',
    ['Перпендикулярно и через середину','Проходит через A и A′'],
    'Перемещайте вертикальную ось; поставьте её через A. Сравните исходную точку и образ.',
    'Что происходит с точкой, которая уже лежит на оси?',
    'Ось является серединным перпендикуляром к AA′ для точки вне оси. Точки самой оси неподвижны. Отражение сохраняет расстояния, но меняет ориентацию фигуры.');
  entry('b9-19','transform','central',[n('centerX','Координата центра O: x',-2,3,1,0),n('centerY','Координата центра O: y',-2,3,1,0)],
    'Середина между образом и точкой','При центральной симметрии O лежит где на отрезке AA′?',
    ['В середине','В любом месте отрезка'],
    'Сравните исходные вершины и их образы при повороте на 180°. Меняйте положение центра по двум координатам.',
    'Почему центральная симметрия — именно поворот на 180°?',
    'Векторы OA и OA′ противоположны и равны по длине. Поэтому O — середина AA′. То же верно для каждой вершины; все точки поворачиваются на 180°.');
  entry('b9-20','transform','scale',[n('factor','Коэффициент гомотетии k',-2,2,.5,1.5)],
    'Гомотетия с отрицательным коэффициентом','Где лежит образ A′ при k<0 относительно луча OA?',
    ['На противоположном луче','На том же луче'],
    'Сравните k = 2, −1 и 0. Следите за лучами, длинами и площадью.',
    'Почему нулевой коэффициент нужно выделить отдельно?',
    'При ненулевом k выполняется OA′=k·OA, длины умножаются на |k|, площади — на k². Отрицательный коэффициент меняет луч на противоположный. При k=0 фигура схлопывается; подобие невырожденных фигур требует k≠0.');
  entry('b9-21','solid','prism',[s('kind','Тело на схеме',[['prism','Прямая призма'],['pyramid','Пирамида']],'prism'),n('height','Перпендикулярная высота',2,6,1,3)],
    'Одинаковые основание и высота','Равны ли объёмы призмы и пирамиды при одинаковых площади основания и высоте?',
    ['Объём пирамиды втрое меньше','Объёмы равны'],
    'Переключите тело при одной высоте, затем измените высоту. Площадь основания равна 12.',
    'Что нужно удерживать одинаковым для корректного сравнения?',
    'V призмы = Sосн·h, V пирамиды = Sосн·h/3. Сравнение «втрое меньше» требует одинаковых площади основания и перпендикулярной высоты.');
  entry('b9-22','solid','round',[s('kind','Выбранное тело',[['cylinder','Цилиндр'],['cone','Конус'],['sphere','Шар']],'cylinder'),n('radius','Радиус основания / шара',1,4,1,2),n('height','Высота цилиндра и конуса',2,6,1,4)],
    'Радиус и высота тел вращения','У какого тела объём не зависит от выбранной высоты h?',
    ['У шара заданного радиуса','У конуса заданного радиуса'],
    'При фиксированном радиусе меняйте h; затем измените радиус. Сравните три объёма.',
    'Какие данные нужны каждому телу и почему шар не использует отдельную h?',
    'V цилиндра = πr²h, V конуса = πr²h/3, V шара = 4πr³/3. Шар определяется радиусом; цилиндру и конусу нужна также перпендикулярная высота.');
  entry('a7-17','triangle-inequality','',[n('base','Третья сторона c при a = 4, b = 5',0,10,1,7)],
    'Могут ли три отрезка замкнуться?','При c=9 и двух других сторонах 4 и 5 получится невырожденный треугольник?',
    ['Нет, точки окажутся на одной прямой','Да, равенства суммы достаточно'],
    'Сравните c = 8, 9 и 10, затем c = 1. Найдите обе границы существования.',
    'Почему для третьей стороны требуется двойное строгое неравенство?',
    'Для сторон 4, 5 и c требуется |5−4| < c < 5+4, то есть 1<c<9. Равенство на любой границе даёт вырожденную конфигурацию, а не треугольник.');
  entry('a7-23','centers','excircle',triangleControls(),
    'Окружность вне треугольника','Может ли окружность вне треугольника касаться прямых всех трёх его сторон?',
    ['Да: одной стороны и продолжений двух других','Нет, касание возможно только внутри'],
    'Передвигайте C. Рассмотрите перпендикуляры от Iₐ к трём прямым сторон и сравните расстояния.',
    'Почему важно различать сторону и её продолжение?',
    'Вневписанная окружность касается одной стороны и продолжений двух других. Её центр равноудалён от трёх прямых, но находится вне треугольника; это не центр вписанной окружности.');
  entry('a8-4','logic','necessary',[n('width','Ширина прямоугольника',2,6,1,5)],
    'Необходимое — ещё не достаточное','Условие «все углы прямые» достаточно ли для того, чтобы четырёхугольник был квадратом?',
    ['Необходимо, но недостаточно','Необходимо и достаточно'],
    'Сравните прямоугольники 5×3 и 3×3. Отдельно проверьте прямые углы и равенство сторон.',
    'Как контрпример различает необходимое и достаточное условия?',
    'Каждый квадрат имеет прямые углы: условие необходимо. Прямоугольник 5×3 показывает, что оно недостаточно. В классе прямоугольников равенство соседних сторон уже даёт квадрат.');
  entry('a8-9','chord-angles','',[n('a','Дуга AB, градусы',40,100,20,60),n('b','Дуга CD, градусы',40,100,20,80)],
    'Угол между двумя хордами','Угол между пересекающимися внутри окружности хордами равен половине одной дуги или полусумме двух?',
    ['Полусумме соответствующих двух дуг','Половине только одной дуги'],
    'Изменяйте по очереди дуги AB и CD. Сравните угол APB с их полусуммой.',
    'Почему здесь уже нельзя прямо применять правило одного вписанного угла?',
    'Вершина P находится внутри, а не на окружности. Для выбранного угла APB получается (дуга AB + дуга CD)/2; это следует из суммы углов треугольника и теоремы о вписанном угле.');
  entry('a8-11','circle-quad','tangent',[n('shift','Изменение направления четвёртой касательной, градусы',-30,30,10,20)],
    'Четыре пары касательных','Как связаны суммы противоположных сторон четырёхугольника, описанного около окружности?',
    ['AB + CD = BC + DA','Обязательно AB = CD и BC = DA'],
    'Поверните четвёртую касательную, сохраняя касание всех сторон. Сравните суммы и отдельные стороны.',
    'Как равные отрезки касательных от одной вершины объясняют равенство сумм?',
    'От каждой вершины два отрезка касательных равны. В суммах AB+CD и BC+DA появляются одни и те же четыре слагаемых. Равенство каждой пары противоположных сторон не требуется.');
  entry('a8-13','bisector','',triangleControls(),
    'Медиана и биссектриса делят по-разному','Биссектриса любого треугольника делит противоположную сторону пополам?',
    ['Нет, в отношении прилежащих сторон','Да, так же как медиана'],
    'Сдвигайте C. Сравните AD/DB с CA/CB, затем рассмотрите G на медиане CM.',
    'Какие отношения относятся к биссектрисе, а какие — к пересечению медиан?',
    'Биссектриса CD даёт AD/DB = CA/CB. Медиана CM идёт в середину AB; точка пересечения медиан G делит каждую медиану в отношении 2:1 от вершины. Это разные теоремы.');
  entry('a8-16','ceva','',[s('kind','Исследуемая конфигурация',[['ceva','Три чевианы пересекаются'],['menelaus','Три точки на одной прямой']],'ceva'),n('d','Доля BD / BC',.2,.8,.1,.4),n('f','Доля AF / AB',.2,.8,.1,.3)],
    'Чева и Менелай: разные конфигурации','Одинаковое произведение отношений всегда описывает одно и то же расположение?',
    ['Нет: важны чевианы, секущая и положения точек','Да, формула без рисунка достаточна'],
    'В первом режиме меняйте две внутренние точки: третья чевиана проходит через пересечение. Во втором постройте общую секущую.',
    'Чем различаются условия двух теорем и где появляется точка на продолжении?',
    'У Чевы согласованное произведение отношений равно 1 для трёх конкурентных внутренних чевиан. У Менелая три точки лежат на секущей, причём в выбранной конфигурации одна внешняя. Формула используется вместе с условиями расположения.');
  entry('a8-17','centers','euler',triangleControls(),
    'Центры на одной прямой','Середина OH является центром окружности через середины сторон?',
    ['Да, её радиус R/2','Нет, нужен центр вписанной окружности'],
    'Меняйте вершину C. Сравните OG и GH, затем расстояния от N до середин сторон.',
    'Какие отношения сохраняются и почему совпадение центров нужно оговаривать?',
    'Для неравностороннего треугольника O, G, H лежат на прямой Эйлера; при различных центрах OG:GH = 1:2. Центр окружности девяти точек N — середина OH, её радиус R/2. При совпавших центрах отношение нулевых расстояний не вычисляют.');
  entry('a9-8','section','',[n('x','Координата B: x',0,6,1,4),n('y','Координата B: y',-2,6,1,5),n('ratio','Отношение AM / MB',.5,3,.5,2)],
    'Деление не пополам','При AM:MB = 2:1 точка M ближе к A или к B?',
    ['К B','К A'],
    'Меняйте отношение и положение B. Сравните долю пройденного пути от A с координатами M.',
    'Почему коэффициент при B связан с расстоянием AM?',
    'Если AM:MB=m:n, то M=(nA+mB)/(m+n). Большая пройденная доля от A даёт больший вес B. При m=n получается середина; расстояние AB по-прежнему вычисляется по Пифагору.');
  entry('a9-18','transform','movement',[s('kind','Преобразование',[['rotation','Поворот'],['stretch','Растяжение только по x']],'rotation'),angleControl(45,0,180)],
    'Всякое преобразование — движение?','Растяжение только по горизонтали является движением?',
    ['Нет, оно меняет расстояния','Да, любая замена точек является движением'],
    'Сравните поворот и растяжение по x. Измерьте одну и ту же пару соответствующих точек.',
    'Какое требование отличает движение от общего отображения?',
    'Движение сохраняет расстояние между любыми двумя точками. Поворот это делает; растяжение только по одной координате обычно меняет длины и форму. Одной похожести рисунков недостаточно.');
  entry('a9-22','transform','rotate',[angleControl(90,0,180)],
    'Один угол для всех точек','При повороте на 90° вокруг начала координат куда перейдёт (x; y)?',
    ['В (−y; x) при повороте против часовой стрелки','В (y; x) при любом повороте'],
    'Сравните 90° и 180°. Проверьте одинаковый поворот всех радиусов и длину AB.',
    'Чем поворот на 90° отличается от перестановки координат?',
    'При повороте сохраняются расстояния до центра и между точками. Для 90° против часовой стрелки (x;y)→(−y;x); простая перестановка координат задаёт другое преобразование.');
  entry('a9-26','synthesis','',[scaleControl()],
    'Выбрать связь под вопрос','Если спрашивают площадь подобного треугольника, достаточно умножить исходную площадь на k?',
    ['Нужен k²','Достаточно k'],
    'Сравните коэффициенты длин 1/2 и 2. Получите площадь двумя способами: по основанию и высоте и по подобию.',
    'Как цель задачи определяет выбор формулы?',
    'Нужно сначала назвать искомую величину. Длины меняются в |k| раз, площади — в k² раз. Проверка двумя согласованными способами помогает обнаружить ошибочный перенос правила для длин на площади.');
  entry('a9-9-ceva','trig-ceva','',[n('d','Доля BD / BC',.2,.8,.1,.4),n('f','Доля AF / AB',.2,.8,.1,.3)],
    'Чева через синусы','Для трёх внутренних конкурентных чевиан чему равно согласованное произведение отношений синусов?',
    ['Единице','Сумме углов треугольника'],
    'Меняйте D и F; третья чевиана проходит через пересечение первых двух. Сравните обычную и тригонометрическую формы.',
    'Почему направление обхода всех трёх отношений должно быть согласовано?',
    'Для внутренних чевиан sin∠BAD/sin∠DAC · sin∠CBE/sin∠EBA · sin∠ACF/sin∠FCB = 1. Через площади малых треугольников эта запись переходит в обычную теорему Чевы; произвольная перестановка одного отношения нарушает формулу.');
  entry('a9-9-radical','radical','',[n('distance','Расстояние между центрами',0,6,1,4),n('y','Положение точки P вдоль оси',-3,3,1,1)],
    'Одинаковая степень','Могут ли степени точки относительно двух окружностей быть равны, даже если сами степени отрицательны?',
    ['Да, сравнивается равенство чисел','Нет, степень обязана быть положительной'],
    'Меняйте y точки на оси, затем расстояние между центрами. Отдельно рассмотрите совпавшие центры.',
    'Почему при разных центрах множество равных степеней — прямая?',
    'Степень точки равна PO²−R² и может быть отрицательной внутри окружности. При вычитании двух уравнений квадратные члены сокращаются; для разных центров получается прямая, перпендикулярная линии центров. Концентрические окружности разных радиусов равных степеней не дают.');
  entry('a9-9-inversion','inversion','',[n('distance','Расстояние OP',0,6,.5,2),angleControl(40,0,180)],
    'Внутренняя точка и внешний образ','При OP<R где находится образ P′ при инверсии?',
    ['За окружностью, на том же луче','Внутри окружности, на противоположном луче'],
    'Сравните OP = 1,5; 3; 6 при R = 3. Затем проверьте, что происходит в центре.',
    'Какая связь сохраняется между расстояниями и какая точка не имеет образа?',
    'Для P≠O инверсия задаёт P′ на луче OP с OP·OP′=R². Точки внутри и снаружи меняются местами, точки окружности остаются на месте. Центр O исключён из определения.');
  entry('a8-8-menelaus','menelaus','',[n('d','Доля BD / BC',.2,.8,.1,.4),n('f','Доля AF / AB',.2,.8,.1,.3)],
    'Одна прямая через три стороны','Если D и F внутри BC и AB, где секущая DF встретит прямую CA?',
    ['На продолжении стороны, если не параллельна CA','Обязательно внутри CA'],
    'Меняйте D и F. Сравните произведение отношений, затем найдите случай параллельности секущей и CA.',
    'Почему теорема требует конечных точек пересечения и правильного порядка отношений?',
    'Для секущей в данной конфигурации (BD/DC)·(CE/EA)·(AF/FB)=1 по положительным длинам. E лежит на продолжении. Если секущая параллельна CA, конечной точки E нет и такую подстановку делать нельзя.');
  function get(id) { return specs[typeof id==='string'?id:id?.id] || null; }
  function normalizeControls(spec, raw) {
    const result={};
    for(const c of spec.controls) {
      const value=raw&&Object.prototype.hasOwnProperty.call(raw,c.key)?raw[c.key]:c.value;
      if(c.type==='select')result[c.key]=c.options.some(o=>o.value===String(value))?String(value):c.value;
      else {
        let x=typeof value==='number'?value:typeof value==='string'&&value.trim()?Number(value):NaN;
        if(!Number.isFinite(x))x=c.value;
        x=Math.max(c.min,Math.min(c.max,x));
        result[c.key]=Number((c.min+Math.round((x-c.min)/c.step)*c.step).toFixed(10));
      }
    }
    return result;
  }
  function evaluate(id,raw) {
    const spec=get(id);if(!spec)throw new Error('Unknown investigation: '+id);
    const controls=normalizeControls(spec,raw),result=calculation(spec,controls);
    return {...result,controls,svg:svg(result.scene,spec.title)};
  }
  function cleanState(spec,raw) {
    const input=raw&&typeof raw==='object'?raw:{},prediction=spec.choices.includes(input.firstPrediction)?input.firstPrediction:null;
    const state={schema:1,predictionDraft:spec.choices.includes(input.predictionDraft)?input.predictionDraft:'',
      firstPrediction:prediction,started:!!prediction&&input.started===true,controls:normalizeControls(spec,input.controls),
      observations:[],observationDraft:typeof input.observationDraft==='string'?input.observationDraft.slice(0,2000):'',
      conclusionOpen:false,completed:false,helped:input.helped===true};
    if(state.started&&Array.isArray(input.observations)) {
      const distinct=new Map();
      for(const observation of input.observations.slice(-12).filter(o=>o&&typeof o.text==='string')) {
        const controls=normalizeControls(spec,observation.controls),key=JSON.stringify(calculation(spec,controls).scene),text=observation.text.slice(0,1800);
        if(!distinct.has(key))distinct.set(key,{controls,text});
        else if(text.trim())distinct.get(key).text=text;
      }
      state.observations=[...distinct.values()];
    }
    state.conclusionOpen=state.started&&state.observations.length>=2&&!!state.observationDraft.trim()&&input.conclusionOpen===true;
    state.completed=state.conclusionOpen&&input.completed===true;
    return state;
  }
  const copy = value => JSON.parse(JSON.stringify(value));
  function mount(host,options) {
    const spec=get(options?.unit?.id||options?.unit||options?.id);
    if(!spec)throw new Error('Investigation not found for lesson');
    let state=cleanState(spec,options.state),destroyed=false,emptyAttempts=0;
    const doc=host.ownerDocument;
    host.innerHTML='<section class="research-card" data-investigation="'+esc(spec.id)+'"><h2>'+esc(spec.title)+'</h2>'+
      '<p class="research-question">'+esc(spec.question)+'</p><div data-research-scene></div>'+
      '<label class="research-prediction">Сначала предположите<select data-research-prediction aria-label="Первое предположение"><option value="">Выберите предположение</option>'+spec.choices.map(v=>'<option value="'+esc(v)+'">'+esc(v)+'</option>').join('')+'</select></label>'+
      '<div class="research-actions"><button type="button" data-research-start>Проверить на модели</button></div><p data-research-first hidden></p>'+
      '<div data-research-work hidden><p class="research-note">'+esc(spec.action)+'</p><div class="research-controls">'+spec.controls.map(c=>{
        const field=c.type==='select'?'<select data-research-control="'+esc(c.key)+'">'+c.options.map(o=>'<option value="'+esc(o.value)+'">'+esc(o.label)+'</option>').join('')+'</select>':
          '<input type="number" data-research-control="'+esc(c.key)+'" min="'+c.min+'" max="'+c.max+'" step="'+c.step+'" inputmode="decimal">';
        return '<label>'+esc(c.label)+field+'</label>';
      }).join('')+'</div><ul class="research-readout" data-research-readout></ul>'+
      '<p>'+esc(spec.observation)+'</p><label class="research-note">Моё наблюдение<textarea data-research-observation rows="3" maxlength="2000" placeholder="Что изменилось? Что осталось? Можно написать, что пока не удалось понять."></textarea></label>'+
      '<div class="research-actions"><button type="button" data-research-record>Записать наблюдение</button><button type="button" data-research-hint>Нужна подсказка</button><button type="button" data-research-conclusion>Сравнить с выводом</button></div>'+
      '<p data-research-hint-text hidden></p><p data-research-count></p>'+
      '<section class="research-conclusion" data-research-result hidden><h3>Вывод и его границы</h3><p>'+esc(spec.conclusion)+'</p><p>'+esc(spec.proofNote)+'</p><p>Это исследование не засчитывает решение задач или доказательство. Дальше можно разобрать объяснение и практику.</p></section></div>'+
      '<p class="research-feedback" data-research-feedback role="status" aria-live="polite"></p></section>';
    const el=selector=>host.querySelector(selector),predictionEl=el('[data-research-prediction]'),observationEl=el('[data-research-observation]');
    const listeners=[];
    function on(target,event,fn){target.addEventListener(event,fn);listeners.push(()=>target.removeEventListener(event,fn));}
    function feedback(text,error=false) {const f=el('[data-research-feedback]');if(!f)return;f.textContent=text;f.classList.toggle('error',error);}
    function commit(next) {
      if(destroyed)return false;
      next=cleanState(spec,next);
      try {
        if(options.onChange&&options.onChange(copy(next))===false) {
          feedback('Изменения не записаны. Сохраните свою работу или откройте более свежую версию перед продолжением.',true);
          return false;
        }
      } catch(_) {feedback('Не удалось сохранить исследование. Ваш текущий текст остаётся в поле; сохраните его перед уходом со страницы.',true);return false;}
      state=next;return true;
    }
    function snapshot(next) {
      const result=evaluate(spec.id,next.controls),fingerprint=JSON.stringify(result.scene);
      const exists=next.observations.some(o=>JSON.stringify(evaluate(spec.id,o.controls).scene)===fingerprint);
      if(!exists){next.observations.push({controls:copy(result.controls),text:''});if(next.observations.length>12)next.observations.splice(1,next.observations.length-12);}
    }
    function currentObservation(next) {
      const fingerprint=JSON.stringify(evaluate(spec.id,next.controls).scene);
      return next.observations.find(o=>JSON.stringify(evaluate(spec.id,o.controls).scene)===fingerprint);
    }
    function saveObservation(next,text) {
      snapshot(next);const observation=currentObservation(next);
      if(observation)observation.text=text.slice(0,1800);
      next.observationDraft=text.slice(0,2000);
    }
    function render() {
      if(destroyed)return;
      const result=evaluate(spec.id,state.controls);
      el('[data-research-scene]').innerHTML=result.svg;
      predictionEl.value=state.started?state.firstPrediction:state.predictionDraft;predictionEl.disabled=state.started;
      el('[data-research-start]').hidden=state.started;
      el('[data-research-work]').hidden=!state.started;
      const first=el('[data-research-first]');first.hidden=!state.started;first.textContent=state.started?'Первый прогноз сохранён: '+state.firstPrediction+'.':'';
      for(const c of spec.controls)el('[data-research-control="'+c.key+'"]').value=String(state.controls[c.key]);
      el('[data-research-readout]').innerHTML=result.readout.map(t=>'<li>'+esc(t)+'</li>').join('');
      observationEl.value=state.observationDraft;
      el('[data-research-result]').hidden=!state.conclusionOpen;
      el('[data-research-count]').textContent='Разных положений модели рассмотрено: '+state.observations.length+'. Для сравнения нужны хотя бы два.';
      el('[data-research-hint-text]').hidden=!state.helped;el('[data-research-hint-text]').textContent=spec.hint;
    }
    function hint() {
      if(commit({...copy(state),helped:true})) {el('[data-research-hint-text]').hidden=false;el('[data-research-hint-text]').textContent=spec.hint;}
    }
    on(predictionEl,'change',()=>{commit({...copy(state),predictionDraft:predictionEl.value});});
    on(el('[data-research-start]'),'click',()=>{
      if(state.started)return;
      const choice=predictionEl.value;
      if(!spec.choices.includes(choice)){feedback('Выберите предположение или «Пока не знаю». Угадывать правильный ответ не требуется.',true);return;}
      const next={...copy(state),predictionDraft:choice,firstPrediction:choice,started:true};snapshot(next);
      if(commit(next)){render();feedback('Теперь измените модель и сравните два положения. Первый прогноз не заменяется последующим ответом.');}
    });
    for(const c of spec.controls) {
      const input=el('[data-research-control="'+c.key+'"]');
      on(input,'change',()=>{
        if(!state.started)return;
        let value=input.value;
        if(c.type==='number') {
          const numeric=value.trim()?Number(value):NaN;
          if(!Number.isFinite(numeric)||numeric<c.min||numeric>c.max||Math.abs((numeric-c.min)/c.step-Math.round((numeric-c.min)/c.step))>1e-7) {
            feedback('Введите допустимое число от '+fmt(c.min)+' до '+fmt(c.max)+' с шагом '+fmt(c.step)+'. Прежнее положение сохранено.',true);return;
          }
          value=numeric;
        }
        const next=copy(state);
        saveObservation(next,observationEl.value);
        next.controls={...state.controls,[c.key]:value};next.conclusionOpen=false;next.completed=false;
        snapshot(next);
        next.observationDraft=currentObservation(next)?.text||'';
        if(commit(next)){render();feedback('Новое положение показано. Сравните его с первым и запишите, что заметили.');}
      });
    }
    on(observationEl,'input',()=>{
      const next={...copy(state),conclusionOpen:false,completed:false};saveObservation(next,observationEl.value);
      commit(next);
      el('[data-research-result]').hidden=true;
    });
    on(el('[data-research-record]'),'click',()=>{
      if(!state.started)return;
      const text=observationEl.value.trim();
      if(!text){emptyAttempts++;feedback('Запишите своё наблюдение или то, что пока непонятно. Пустая запись не является наблюдением.',true);if(emptyAttempts>=2)hint();return;}
      const next=copy(state);saveObservation(next,observationEl.value);
      if(commit(next)){render();feedback('Наблюдение сохранено. Оно не является автоматически проверенным доказательством.');}
    });
    on(el('[data-research-hint]'),'click',hint);
    on(el('[data-research-conclusion]'),'click',()=>{
      if(!state.started)return;
      if(state.observations.length<2){feedback('Сначала измените модель и сравните хотя бы два разных положения.',true);return;}
      if(!observationEl.value.trim()){emptyAttempts++;feedback('Сначала запишите, что заметили или что пока непонятно. Затем сравните это с выводом.',true);if(emptyAttempts>=2)hint();return;}
      const next={...copy(state),conclusionOpen:true,completed:true};saveObservation(next,observationEl.value);
      if(commit(next)){render();feedback('Вывод открыт для сравнения с вашим наблюдением. Решения задач и доказательство проверяются отдельно.');if(options.onComplete)options.onComplete(copy(state));}
    });
    render();
    return {getState:()=>copy(state),destroy(){destroyed=true;listeners.forEach(fn=>fn());}};
  }
  return {specs,get,evaluate,mount,normalizeControls,math:{point,add,sub,mul,dot,cross,dist,angle,area,foot,intersect,triangleFromSides,triangleFromAngles,triangleFacts,circumcenter}};
});

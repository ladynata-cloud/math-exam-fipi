(function(root){'use strict';
const EPS=1e-8, add=(a,b)=>({x:a.x+b.x,y:a.y+b.y}),sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y}),mul=(a,k)=>({x:a.x*k,y:a.y*k}),dot=(a,b)=>a.x*b.x+a.y*b.y,cross=(a,b)=>a.x*b.y-a.y*b.x,norm=a=>Math.hypot(a.x,a.y),dist=(a,b)=>norm(sub(a,b)),unit=a=>mul(a,1/(norm(a)||1)),rot=a=>({x:-a.y,y:a.x});
function foot(p,a,b){const v=sub(b,a),q=dot(v,v);return q<EPS?null:add(a,mul(v,dot(sub(p,a),v)/q));}
function angle(a,o,b){const u=sub(a,o),v=sub(b,o);if(norm(u)*norm(v)<EPS)return null;return Math.acos(Math.max(-1,Math.min(1,dot(u,v)/norm(u)/norm(v))))*180/Math.PI;}
function intersections(a,b){
 if(a.type==='line'&&b.type==='line'){const u=sub(a.q,a.p),v=sub(b.q,b.p),d=cross(u,v);return Math.abs(d)<EPS?[]:[add(a.p,mul(u,cross(sub(b.p,a.p),v)/d))];}
 if(a.type==='circle'&&b.type==='line')return intersections(b,a);
 if(a.type==='line'){const h=foot(b.o,a.p,a.q);if(!h)return [];const d=dist(h,b.o),r=b.r;if(d>r+EPS)return [];const v=unit(sub(a.q,a.p)),t=Math.sqrt(Math.max(0,r*r-d*d));return t<EPS?[h]:[add(h,mul(v,t)),add(h,mul(v,-t))];}
 const d=dist(a.o,b.o);if(d<EPS||d>a.r+b.r+EPS||d<Math.abs(a.r-b.r)-EPS)return [];
 const x=(a.r*a.r-b.r*b.r+d*d)/(2*d),h=Math.sqrt(Math.max(0,a.r*a.r-x*x)),u=unit(sub(b.o,a.o)),m=add(a.o,mul(u,x));return h<EPS?[m]:[add(m,mul(rot(u),h)),add(m,mul(rot(u),-h))];
}
class Board{
 constructor(spec){this.spec=JSON.parse(JSON.stringify(spec));this.points=[];this.objects=[];this.history=[];this.reset();}
 reset(){this.points=JSON.parse(JSON.stringify(this.spec.points||[]));this.objects=JSON.parse(JSON.stringify(this.spec.objects||[]));this.history=[];this.update();}
 snapshot(){return JSON.stringify({points:this.points,objects:this.objects});}
 remember(){this.history.push(this.snapshot());if(this.history.length>80)this.history.shift();}
 undo(){if(!this.history.length)return false;const s=JSON.parse(this.history.pop());this.points=s.points;this.objects=s.objects;this.update();return true;}
 point(id){return this.points.find(p=>p.id===id);}
 object(id){return this.objects.find(o=>o.id===id);}
 pointName(){for(const n of 'MNPQHDEFGIJKLSTUVWXYZ'.split(''))if(!this.point(n))return n;return 'P'+(this.points.length+1);}
 objName(){return 'o'+(this.objects.length+1);}
 geometry(o){if(typeof o==='string')o=this.object(o);if(!o)return null;const p=this.point(o.a),q=this.point(o.b);if(!p||!q||p.valid===false||q.valid===false)return null;if(o.type==='circle')return {type:'circle',o:p,r:dist(p,q)};return {type:'line',p,q};}
 update(){for(const p of this.points){p.valid=true;if(!p.kind||p.kind==='free')continue;const a=this.point(p.a),b=this.point(p.b),c=this.point(p.c);let v=null;
  if(p.kind==='midpoint'&&a&&b)v=mul(add(a,b),.5);
  if(p.kind==='sum'&&a&&b&&c)v=add(b,sub(c,a));
  if(p.kind==='perp'&&a&&b)v=add(a,mul(rot(sub(b,a)),p.k));
  if(p.kind==='iso'&&a&&b)v=add(mul(add(a,b),.5),mul(rot(sub(b,a)),p.k));
  if(p.kind==='equalarm'&&a&&b)v=add(a,mul({x:Math.cos(p.t),y:Math.sin(p.t)},dist(a,b)));
  if(p.kind==='rightArc'&&a&&b){const u=sub(b,a),m=mul(add(a,b),.5);v=add(m,mul(add(mul(u,Math.cos(p.t)),mul(rot(u),Math.sin(p.t))),.5));}
  if(p.kind==='onCircle'&&a&&b)v=add(a,mul({x:Math.cos(p.t),y:Math.sin(p.t)},dist(a,b)));
  if(p.kind==='foot'&&a&&b&&c)v=foot(a,b,c);
  if(p.kind==='parallel'&&a&&b&&c)v=add(a,mul(sub(c,b),p.k===undefined?1:p.k));
  if(p.kind==='normal'&&a&&b&&c)v=add(a,rot(sub(c,b)));
  if(p.kind==='bisector'&&a&&b&&c){const u=add(unit(sub(a,b)),unit(sub(c,b)));if(norm(u)>EPS)v=add(b,mul(unit(u),100));}
  if(p.kind==='affine'&&a&&b)v=add(a,mul(sub(b,a),p.k));
  if(p.kind==='reflection'&&a&&b&&c){const h=foot(a,b,c);if(h)v=sub(mul(h,2),a);}
  if(p.kind==='intersection'){const g=this.geometry(p.o1),h=this.geometry(p.o2);if(g&&h)v=intersections(g,h)[p.branch||0];}
  if(!v||!Number.isFinite(v.x+v.y)){p.valid=false;continue;}p.x=v.x;p.y=v.y;
  if([a,b,c].some(x=>x&&x.valid===false))p.valid=false;
 }return this;}
 move(id,x,y){const p=this.point(id);if(!p)return false;x=Math.max(25,Math.min(615,x));y=Math.max(30,Math.min(385,y));const a=this.point(p.a),b=this.point(p.b);if(!p.kind||p.kind==='free'){p.x=x;p.y=y;}
 else if(['perp','iso'].includes(p.kind)&&p.draggable){const v=rot(sub(b,a)),origin=p.kind==='iso'?mul(add(a,b),.5):a;p.k=dot(sub({x,y},origin),v)/(dot(v,v)||1);if(Math.abs(p.k)<.08)p.k=.08;}
 else if(p.kind==='parallel'&&p.draggable){const c=this.point(p.c),v=sub(c,b);p.k=Math.max(.15,Math.min(1.3,dot(sub({x,y},a),v)/(dot(v,v)||1)));}
 else if(p.kind==='rightArc'&&p.draggable){const u=sub(b,a),m=mul(add(a,b),.5),w=sub({x,y},m);p.t=Math.atan2(cross(u,w),dot(u,w));if(Math.abs(Math.sin(p.t))<.12)p.t=p.t<0?-.12:.12;}
 else if(['equalarm','onCircle'].includes(p.kind)&&p.draggable)p.t=Math.atan2(y-a.y,x-a.x);else return false;this.update();return true;}
 make(tool,ids){const need={point:0,segment:2,line:2,circle:2,midpoint:2,perpendicular:3,parallel:3,bisector:3,reflection:3,intersection:2}[tool];if(ids.length!==need)throw Error('Выбери '+need+' разных '+(tool==='intersection'?'объекта.':'точки в указанном порядке.'));if(new Set(ids).size!==ids.length)throw Error('Нужны разные точки или объекты.');
  if(tool==='intersection'){const a=this.geometry(ids[0]),b=this.geometry(ids[1]);if(!a||!b)throw Error('Объект сейчас не определён.');const hits=intersections(a,b);if(!hits.length)throw Error('У этих объектов сейчас нет отдельных точек пересечения.');this.remember();const out=[];hits.forEach((q,i)=>{const p={id:this.pointName(),kind:'intersection',o1:ids[0],o2:ids[1],branch:i,x:q.x,y:q.y};this.points.push(p);out.push(p.id);});return out;}
  if(this.points.length>145||this.objects.length>175)throw Error('На поле уже много объектов. Отмени лишние построения или начни заново.');
  const ps=ids.map(x=>this.point(x));if(ps.some(p=>!p||p.valid===false))throw Error('Точка не определена.');if(need>1&&dist(ps[0],ps[1])<1)throw Error('Точки почти совпали: сначала раздвинь их.');this.remember();let p,o;
  if(['line','segment','circle'].includes(tool)){o={id:this.objName(),type:tool==='circle'?'circle':'line',extent:tool==='segment'?'segment':'line',a:ids[0],b:ids[1],added:true};this.objects.push(o);return [o.id];}
  if(tool==='midpoint')p={id:this.pointName(),kind:'midpoint',a:ids[0],b:ids[1]};
  if(['perpendicular','parallel','bisector','reflection'].includes(tool)){
   if(dist(ps[1],ps[2])<1)throw Error('Две точки исходной прямой должны различаться.');
   p={id:this.pointName(),kind:{perpendicular:'foot',parallel:'parallel',bisector:'bisector',reflection:'reflection'}[tool],a:ids[0],b:ids[1],c:ids[2]};
   if(tool==='bisector'&&norm(add(unit(sub(ps[0],ps[1])),unit(sub(ps[2],ps[1]))))<EPS)throw Error('Для развёрнутого угла выбери полуплоскость: эта модель строит внутреннюю биссектрису неразвёрнутого угла.');
   if(tool==='perpendicular'&&Math.abs(cross(sub(ps[0],ps[1]),sub(ps[2],ps[1])))<1)p.kind='normal';
  }
  if(p){this.points.push(p);this.update();if(['perpendicular','parallel','bisector'].includes(tool)){o={id:this.objName(),type:'line',extent:tool==='bisector'?'ray':'line',a:tool==='bisector'?ids[1]:ids[0],b:p.id,added:true,construction:tool};this.objects.push(o);}return [p.id];}return [];
 }
 addPoint(x,y){if(this.points.length>=150)throw Error('На поле уже 150 точек. Отмени лишние построения.');if(!Number.isFinite(x+y))throw Error('Координаты должны быть конечными.');x=Math.max(25,Math.min(615,x));y=Math.max(30,Math.min(385,y));this.remember();const id=this.pointName();this.points.push({id,kind:'free',x,y,added:true});return id;}
 goal(kind){const P=this.point.bind(this),O=this.objects,derived=this.points.filter(p=>p.valid!==false),same=(p,a,b)=>p.a===a&&p.b===b||p.a===b&&p.b===a,lineThrough=(a,b)=>O.some(o=>o.added&&o.type==='line'&&same(o,a,b));
  const A=P('A'),B=P('B'),C=P('C');if(A&&B&&dist(A,B)<1)return {ok:false,message:'A и B почти совпали. Раздвинь точки: отрезок и его направление должны быть определены.'};if(['median','altitude','midline','bisector','diagonal'].includes(kind)&&A&&B&&C&&Math.abs(cross(sub(B,A),sub(C,A)))<1)return {ok:false,message:'Основные точки лежат на одной прямой. Для этой задачи восстанови невырожденную фигуру.'};
  if(kind==='explore')return {ok:false,message:'Измени положение точек и запиши наблюдение. Опыт сам по себе не является доказательством.'};
  if(kind==='diagonal')return {ok:lineThrough('A','C')||lineThrough('B','D'),message:'Проведи диагональ: она соединяет несоседние вершины и создаёт два треугольника.'};
  if(kind==='midpoint')return {ok:derived.some(p=>p.kind==='midpoint'&&same(p,'A','B')),message:'Построй середину AB как зависимую точку. Точка, поставленная на глаз, не сохраняет равенство при движении.'};
  if(kind==='median'){const m=derived.find(p=>p.kind==='midpoint'&&same(p,'A','B'));return {ok:!!m&&lineThrough('C',m.id),message:'Сначала построй середину AB, затем соедини её с C.'};}
  if(kind==='perpendicular')return {ok:derived.some(p=>p.kind==='foot'||p.kind==='normal'),message:'Выбери точку новой прямой, затем две точки исходной прямой.'};
  if(kind==='altitude'){return {ok:derived.some(p=>p.kind==='foot'&&p.a==='C'&&((p.b==='A'&&p.c==='B')||(p.b==='B'&&p.c==='A'))),message:'Нужен перпендикуляр из C к прямой AB. Основание может оказаться на продолжении стороны.'};}
  if(kind==='bisector')return {ok:derived.some(p=>p.kind==='bisector'&&p.b==='C'&&((p.a==='A'&&p.c==='B')||(p.a==='B'&&p.c==='A'))),message:'Построй биссектрису угла ACB. Вершину C выбирают второй.'};
  if(kind==='reflection')return {ok:derived.some(p=>p.kind==='reflection'&&p.a==='C'&&((p.b==='A'&&p.c==='B')||(p.a==='B'&&p.c==='A'))),message:'Отрази C относительно прямой AB. Затем двигай C и проверь расстояния до оси.'};
  if(kind==='midline'){const m=derived.find(p=>p.kind==='midpoint'&&same(p,'A','C')),n=derived.find(p=>p.kind==='midpoint'&&same(p,'B','C'));return {ok:!!m&&!!n&&lineThrough(m.id,n.id),message:'Нужны середины AC и BC и соединяющий их отрезок.'};}
  if(kind==='parallel')return {ok:derived.some(p=>p.kind==='parallel'&&p.a==='C'&&((p.b==='A'&&p.c==='B')||(p.b==='B'&&p.c==='A'))),message:'Проведи через C прямую, параллельную AB. Совпадение наклона на глаз не заменяет построения.'};
  if(kind==='perpbisector'){
   const cs=O.filter(o=>o.type==='circle'&&((o.a==='A'&&o.b==='B')||(o.a==='B'&&o.b==='A'))),is=derived.filter(p=>p.kind==='intersection'&&cs.some(c=>c.id===p.o1)&&cs.some(c=>c.id===p.o2));
   const ok=is.length>=2&&is.some((p,i)=>is.slice(i+1).some(q=>lineThrough(p.id,q.id)&&p.branch!==q.branch));
   return {ok,message:'Построй окружности с центрами A и B через другую точку, найди обе точки пересечения и проведи через них прямую.'};
  }
  return {ok:O.some(o=>o.added),message:'Добавь объект, необходимый для выбранного рассуждения, и объясни его назначение.'};
 }
}
function scene(type){const P=(id,x,y,extra)=>Object.assign({id,x,y,kind:'free'},extra||{}),L=(a,b)=>({id:a+b,type:'line',extent:'segment',a,b});let points=[P('A',140,300),P('B',500,300),P('C',270,85)],objects=[L('A','B'),L('B','C'),L('C','A')];
 if(type==='angle'){points=[P('A',500,290),P('B',350,70),P('C',170,290)];objects=[{...L('C','A'),extent:'ray'},{...L('C','B'),extent:'ray'}];}
 if(type==='segment'){points=[P('A',140,235),P('B',500,235),P('C',305,115)];objects=[L('A','B')];}
 if(type==='iso')points[2]=P('C',0,0,{kind:'iso',a:'A',b:'B',k:-.6,draggable:true});
 if(type==='right')points[2]=P('C',0,0,{kind:'rightArc',a:'A',b:'B',t:-1.85,draggable:true});
 if(['quad','rectangle','square','rhombus'].includes(type)){points=[P('A',145,300),P('B',425,300),P('D',205,100)];if(type==='rectangle'||type==='square')points[2]=P('D',0,0,{kind:'perp',a:'A',b:'B',k:type==='square'?-.65:-.6,draggable:type!=='square'});if(type==='square')points[1].x=345,points[2].k=-1;if(type==='rhombus')points[2]=P('D',0,0,{kind:'equalarm',a:'A',b:'B',t:-1.3,draggable:true});points.push(P('C',0,0,{kind:'sum',a:'A',b:'B',c:'D'}));objects=[L('A','B'),L('B','C'),L('C','D'),L('D','A')];}
 if(type==='trapezoid'){points=[P('A',135,300),P('B',515,300),P('D',230,115),P('C',0,0,{kind:'parallel',a:'D',b:'A',c:'B'})];points[3]={id:'C',kind:'parallel',a:'D',b:'A',c:'B',k:.5,draggable:true};objects=[L('A','B'),L('B','C'),L('C','D'),L('D','A')];/* projection constraint is installed by lab */}
 if(['circle','two-circles'].includes(type)){points=[P('O',320,220),P('A',470,220),P('B',0,0,{kind:'onCircle',a:'O',b:'A',t:2.8,draggable:true}),P('C',0,0,{kind:'onCircle',a:'O',b:'A',t:-1.3,draggable:true})];objects=[{id:'circle',type:'circle',a:'O',b:'A'},L('A','B'),L('B','C'),L('C','A')];if(type==='two-circles'){points.push(P('D',450,220),P('E',555,220));objects.push({id:'circle2',type:'circle',a:'D',b:'E'});}}
 return {type,points,objects};
}
const api={EPS,add,sub,mul,dot,cross,norm,dist,unit,rot,foot,angle,intersections,Board,scene};root.GeoMath=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

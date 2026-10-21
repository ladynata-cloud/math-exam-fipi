/* Condition-bound symbolic scenes for the 19 existing authored proof chains.
   Numeric task scenes are deliberately not reused: equal keys can have different givens. */
(function(root){'use strict';
const Scenes=root.StereoTaskScenes||(typeof require==='function'?require('./task-scenes.js'):null);
const S=root.Space||(typeof require==='function'?require('./space.js'):null);
const H=Scenes.helpers,{model,add,line,mark,ring,mergeMesh,box,pyramid,planePatch,view,triangle,axes}=H;
const CONDITIONS={
  "incidence": {
    "given": "Две различные прямые a,b пересекаются в O.",
    "goal": "Докажи единственность плоскости, содержащей обе прямые."
  },
  "parallel": {
    "given": "ABCD A₁B₁C₁D₁ — прямоугольный параллелепипед.",
    "goal": "Докажи A₁B₁ ∥ (ABC)."
  },
  "skew": {
    "given": "ABCD A₁B₁C₁D₁ — куб.",
    "goal": "Докажи, что AB и CC₁ скрещиваются."
  },
  "plane-parallel": {
    "given": "Плоскости α и β различны и параллельны. Плоскость γ пересекает их по a и b.",
    "goal": "Докажи a∥b."
  },
  "section": {
    "given": "M и N — середины рёбер AB и AC тетраэдра ABCD. Секущая плоскость проходит через M и N и не совпадает с гранью ABC.",
    "goal": "Докажи, что MN — сторона сечения на грани ABC и MN∥BC."
  },
  "perpendicular": {
    "given": "SA⊥AB и SA⊥AD; AB и AD — пересекающиеся прямые плоскости ABCD.",
    "goal": "Докажи SA⊥(ABCD), затем SA⊥AC."
  },
  "projection": {
    "given": "AH⊥α; B и H лежат в α. Прямая l проходит через B в α и перпендикулярна HB. B≠H.",
    "goal": "Докажи l⊥AB."
  },
  "dihedral": {
    "given": "SABCD — правильная четырёхугольная пирамида, O — центр основания, M — середина AB.",
    "goal": "Обоснуй, что угол SMO — угол боковой грани SAB с основанием."
  },
  "box-diagonal": {
    "given": "В прямоугольном параллелепипеде AB=a, AD=b, AA₁=h.",
    "goal": "Докажи AC₁²=a²+b²+h²."
  },
  "pyramid": {
    "given": "Правильная пирамида имеет периметр основания P и апофему l.",
    "goal": "Докажи Sбок=Pl/2."
  },
  "frustum": {
    "given": "Сечение пирамиды параллельно основанию; расстояние от вершины до сечения равно kH, 0<k<1.",
    "goal": "Докажи Vмал/Vбольш=k³."
  },
  "cylinder-area": {
    "given": "У цилиндра радиус основания R и высота h.",
    "goal": "Выведи боковую площадь."
  },
  "cone-area": {
    "given": "У конуса радиус R, образующая l.",
    "goal": "Выведи Sбок=πRl."
  },
  "sphere-cut": {
    "given": "O — центр сферы радиуса R; H — проекция O на секущую плоскость, OH=d<R.",
    "goal": "Найди радиус сечения."
  },
  "pyramid-volume": {
    "given": "Пирамида имеет площадь основания B и высоту H. Координату z отсчитываем от вершины.",
    "goal": "Выведи V=BH/3."
  },
  "sphere-volume": {
    "given": "Шар радиуса R; z отсчитывается от центра.",
    "goal": "Выведи V=4πR³/3."
  },
  "basis": {
    "given": "u=(1;0;0), v=(0;1;0), w=(1;1;0).",
    "goal": "Докажи, что эти векторы не являются базисом пространства."
  },
  "dot": {
    "given": "Прямая имеет ненулевой направляющий вектор u, плоскость — ненулевую нормаль n.",
    "goal": "Объясни формулу sinα=модуль(u·n)/(|u|·|n|)."
  },
  "scale": {
    "given": "При подобии коэффициент длин равен k>0.",
    "goal": "Объясни изменение объёма прямоугольного параллелепипеда."
  }
};
const keys=Object.keys(CONDITIONS);
function hidden(m,name,p,label=name){add(m,name,p,'');m.labels[name]=label;return name;}
function midpoint(m,a,b){return S.lerp(m.points[a],m.points[b],.5);}
function sphere(m,r){for(const [i,ax] of [[[1,0,0],[0,1,0]],[[1,0,0],[0,0,1]],[[0,1,0],[0,0,1]]].entries())ring(m,[0,0,0],r,ax,'_sphere'+i+'_',48);add(m,'O',[0,0,0]);}
function polygons(m,faces){m.faces.push(...faces);const seen=new Set(m.edges.map(e=>e.slice().sort().join('|')));for(const face of faces)for(let i=0;i<face.length;i++){const e=[face[i],face[(i+1)%face.length]],k=e.slice().sort().join('|');if(!seen.has(k)){line(m,...e);seen.add(k);}}}
function buildProof(key,proof){
 if(!proof||typeof proof.given!=='string'||typeof proof.goal!=='string'||!Array.isArray(proof.steps))throw TypeError('Supply the existing proof condition, goal and steps.');
 const expected=CONDITIONS[key],m=model(),scene={kind:'proof:'+key,title:proof.title||'Доказательство',model:m,given:[proof.given],find:proof.goal,goalLabel:'Требуется',status:'representative',note:'Буквы обозначают величины из условия. Для рисунка выбраны допустимые положительные размеры; это один пример, а не дополнительные условия. Вращение не заменяет доказательство.',facts:{},stepViews:[]};
 if(!expected){scene.status='unsupported';scene.note='Для этой цепочки пока нет проверенной модели.';m.note=scene.note;return scene;}
 if(proof.given!==expected.given||proof.goal!==expected.goal)throw Error('Proof condition or goal changed; scene requires review: '+key);
 const f=scene.facts,P=m.points,step=(i,label,segments=[],polygon=[],points=[])=>view(m,'step'+i,label,segments,polygon,points);
 view(m,'neutral','Найди на модели объекты, названные в условии.');
 let ids,base,cut;
 switch(key){
 case'incidence':{
  add(m,'O',[0,0,0]);add(m,'a₋',[-3,0,0],'');add(m,'a₊',[3,0,0],'a');add(m,'b₋',[-1.4,-2.4,0],'');add(m,'b₊',[1.4,2.4,0],'b');line(m,'a₋','a₊');line(m,'b₋','b₊');hidden(m,'A',[2,0,0]);hidden(m,'B',[.7,1.2,0]);
  const patch=[[-3,-3,0],[3,-3,0],[3,3,0],[-3,3,0]].map((p,i)=>hidden(m,'_plane'+i,p,''));
  step(0,'Выбери на каждой прямой точку, отличную от O.',[],[],['O','A','B']);step(1,'Рассмотри три выбранные точки.',[],patch,['O','A','B']);step(2,'Проследи обе прямые в выбранной плоскости.',[['a₋','a₊'],['b₋','b₊']],patch,['O','A','B']);f.plane={n:[0,0,1],d:0};break;
 }
 case'parallel':box(m,4,3,2.5);view(m,'neutral','Найди A₁B₁ и нижнюю грань ABCD.',[['A₁','B₁']],['A','B','C','D']);step(0,'Сравни отмеченные рёбра одной грани.',[['A₁','B₁'],['A','B']],['A','B','B₁','A₁']);step(1,'Сравни положение ребра и нижней грани.',[['A₁','B₁']],['A','B','C','D']);step(2,'Вернись к прямой и плоскости из условия.',[['A₁','B₁']],['A','B','C','D']);break;
 case'skew':box(m,3,3,3);view(m,'neutral','Найди прямые AB и CC₁.',[['A','B'],['C','C₁']]);step(0,'Проследи ребро CC₁ до нижней грани.',[['C','C₁'],['A','B']],['A','B','C','D'],['C']);step(1,'Проверь возможность общей плоскости для двух прямых.',[['A','B'],['C','C₁']]);step(2,'Рассмотри прямую AB и точку C.',[['A','B']],['A','B','C','D'],['C']);step(3,'Сравни CC₁ с полученной плоскостью.',[['C','C₁']],['A','B','C','D']);break;
 case'plane-parallel':{
  const lo=planePatch(m,0,2.2,'_alpha'),hi=planePatch(m,2.5,2.2,'_beta');add(m,'A',[-2.2,0,0],'');add(m,'B',[2.2,0,0],'a');add(m,'C',[-2.2,0,2.5],'');add(m,'D',[2.2,0,2.5],'b');polygons(m,[['A','B','D','C']]);add(m,'_al',[-2,-1.8,0],'α');add(m,'_be',[-2,-1.8,2.5],'β');add(m,'_ga',[2.2,0,1.2],'γ');
  view(m,'neutral','Найди линии пересечения a и b.',[['A','B'],['C','D']]);step(0,'Проследи обе линии в плоскости γ.',[['A','B'],['C','D']],['A','B','D','C']);step(1,'Проверь предположение об общей точке линий.',[['A','B'],['C','D']]);step(2,'Сравни линии пересечения параллельных плоскостей.',[['A','B'],['C','D']],['A','B','D','C']);f.lower=lo;f.upper=hi;break;
 }
 case'section':{
  // This proof concerns a tetrahedron, unlike the numeric cube-section family.
  add(m,'A',[0,0,0]);add(m,'B',[4,0,0]);add(m,'C',[1,3,0]);add(m,'D',[.8,1,4]);polygons(m,[['A','C','B'],['A','B','D'],['B','C','D'],['C','A','D']]);add(m,'M',midpoint(m,'A','B'));add(m,'N',midpoint(m,'A','C'));hidden(m,'K',S.lerp(P.A,P.D,.65));
  f.section=['M','N','K'];f.plane=S.plane(P.M,P.N,P.K);view(m,'neutral','M и N — заданные середины. Плоскость отличается от ABC.',[],['M','N','K'],['M','N']);step(0,'Найди M и N на грани ABC.',[],['A','B','C'],['M','N']);step(1,'Проследи MN в секущей плоскости.',[['M','N']],['M','N','K']);step(2,'Рассмотри общую часть плоскости и грани.',[['M','N']],['A','B','C']);step(3,'Сравни MN и BC в треугольнике ABC.',[['M','N'],['B','C']],['A','B','C']);scene.note+=' Положение плоскости показано одним допустимым примером; третья точка не объявляется серединой ребра.';break;
 }
 case'perpendicular':{
  add(m,'A',[0,0,0]);add(m,'B',[4,0,0]);add(m,'D',[1,2.5,0]);add(m,'C',[5,2.5,0]);add(m,'S',[0,0,3]);polygons(m,[['A','B','C','D']]);line(m,'S','A');
  view(m,'neutral','SA перпендикулярна двум указанным направлениям.',[['S','A'],['A','B'],['A','D']]);step(0,'Найди точку пересечения AB и AD.',[['A','B'],['A','D']],[],['A']);step(1,'Рассмотри SA и плоскость основания.',[['S','A']],['A','B','C','D']);step(2,'Проследи диагональ AC в основании.',[['S','A'],['A','C']],['A','B','C','D']);break;
 }
 case'projection':{
  planePatch(m,0,4);add(m,'H',[0,0,0]);add(m,'A',[0,0,3]);add(m,'B',[3,0,0]);add(m,'L',[3,-2,0],'');add(m,'T',[3,2,0],'l');line(m,'A','H');line(m,'H','B');line(m,'A','B');line(m,'L','T');add(m,'_alpha',[-3,-3,0],'α');
  view(m,'neutral','Найди AH, проекцию HB и прямую l через B.',[['A','H'],['H','B'],['L','T']]);step(0,'Сравни направления l и AH.',[['L','T'],['A','H']]);step(1,'Проследи путь от A через H к B.',[['A','H'],['H','B'],['A','B']]);step(2,'Сопоставь l с двумя составляющими направления AB.',[['L','T'],['A','H'],['H','B'],['A','B']]);step(3,'Вернись к прямой l и наклонной AB.',[['L','T'],['A','B']]);break;
 }
 case'dihedral':pyramid(m,4,3.3);line(m,'S','O');line(m,'S','M');line(m,'O','M');view(m,'neutral','Найди общую сторону AB, центр O и середину M.',[],[],['S','O','M']);step(0,'Рассмотри SM в боковой грани.',[['S','M'],['A','B']],['S','A','B']);step(1,'Рассмотри OM в квадратном основании.',[['O','M'],['A','B']],['A','B','C','D']);step(2,'Проследи два луча из M в нужных гранях.',[['M','S'],['M','O'],['A','B']],['S','O','M']);break;
 case'box-diagonal':box(m,4,3,2.5);mark(m,'A','B','a');mark(m,'A','D','b');mark(m,'A','A₁','h');view(m,'neutral','Найди три заданных измерения и диагональ AC₁.',[['A','C₁']]);step(0,'Рассмотри диагональ основания.',[['A','B'],['B','C'],['A','C']],['A','B','C','D']);step(1,'Сравни CC₁ с диагональю основания.',[['C','C₁'],['A','C']]);step(2,'Рассмотри треугольник ACC₁.',[['A','C'],['C','C₁'],['A','C₁']],['A','C','C₁']);f.dimensions=[4,3,2.5];break;
 case'pyramid':{
  // Regular pentagonal pyramid avoids silently identifying P with4a.
  const n=5,R=2.4,height=3;for(let i=0;i<n;i++)add(m,'A'+(i+1),[R*Math.cos(2*Math.PI*i/n),R*Math.sin(2*Math.PI*i/n),0]);add(m,'S',[0,0,height]);base=Array.from({length:n},(_,i)=>'A'+(i+1));polygons(m,[base,...base.map((id,i)=>[id,base[(i+1)%n],'S'])]);add(m,'M',midpoint(m,'A1','A2'));line(m,'S','M');mark(m,'S','M','l');mark(m,'A1','A2','aᵢ');add(m,'_perimeter',[0,0,0],'P');
  view(m,'neutral','Найди периметр основания P и апофему l.',[['S','M']]);step(0,'Рассмотри апофему выбранной боковой грани.',[['S','M']],['S','A1','A2']);step(1,'Найди основание и высоту этой грани.',[['A1','A2'],['S','M']],['S','A1','A2']);step(2,'Проследи все стороны основания и соответствующие грани.',base.map((id,i)=>[id,base[(i+1)%n]]));f.base=base;f.apothem=dist(P.S,P.M);break;
 }
 case'frustum':{
  pyramid(m,4,5);m.labelNames=m.labelNames.filter(n=>n!=='M');const k=.4,Ht=5,pl={n:[0,0,1],d:Ht*(1-k)},mesh=S.solid('pyramid',4,4,Ht);cut=S.section(mesh,pl);ids=cut.map((p,i)=>add(m,'K'+i,p,['K','L','N','P'][i]));add(m,'Z',[0,0,pl.d]);line(m,'S','O');mark(m,'S','O','H');mark(m,'S','Z','kH');view(m,'neutral','Плоскость параллельна основанию; сравни отмеченные высоты.',[['S','O'],['S','Z']],ids);step(0,'Сопоставь соответствующие отрезки двух пирамид.',[['S','A'],['S',ids.find(n=>S.dist(P[n],S.lerp(P.S,P.A,k))<1e-6)]],ids);step(1,'Сравни основание и параллельное сечение.',[],ids);step(2,'Сопоставь высоту и площадь основания малой пирамиды.',[['S','Z']],ids);f.k=k;f.height=Ht;f.section=ids;f.plane=pl;break;
 }
 case'cylinder-area':{
  const R=2,height=3;m.smooth=true;mergeMesh(m,S.solid('cylinder',2*R,2*R,height),'',false);add(m,'O',[0,0,0]);add(m,'A',[R,0,0]);add(m,'B',[R,0,height]);line(m,'O','A');line(m,'A','B');mark(m,'O','A','R');mark(m,'A','B','h');ids=ring(m,[0,0,0],R,undefined,'_base');view(m,'neutral','Найди радиус основания и высоту цилиндра.',[['O','A'],['A','B']]);step(0,'Найди образующую, по которой можно разрезать поверхность.',[['A','B']]);step(1,'Проследи окружность основания и высоту.',[['A','B'],...ids.map((n,i)=>[n,ids[(i+1)%ids.length]])]);step(2,'Сопоставь высоту и длину окружности основания.',[['A','B'],...ids.map((n,i)=>[n,ids[(i+1)%ids.length]])]);f.radius=R;f.height=height;break;
 }
 case'cone-area':{
  const R=2,height=3;m.smooth=true;mergeMesh(m,S.solid('cone',2*R,2*R,height),'',false);add(m,'O',[0,0,0]);add(m,'A',[R,0,0]);add(m,'S',[0,0,height]);line(m,'O','A');line(m,'S','A');mark(m,'O','A','R');mark(m,'S','A','l');ids=ring(m,[0,0,0],R,undefined,'_base');view(m,'neutral','Найди радиус R и образующую l.',[['O','A'],['S','A']]);step(0,'Проследи образующую от вершины к основанию.',[['S','A']]);step(1,'Проследи окружность, которая станет дугой развёртки.',ids.map((n,i)=>[n,ids[(i+1)%ids.length]]));step(2,'Сопоставь образующую с окружностью основания.',[['S','A'],...ids.map((n,i)=>[n,ids[(i+1)%ids.length]])]);f.radius=R;f.slant=Math.hypot(R,height);f.height=height;break;
 }
 case'sphere-cut':{
  const R=3,d=1.2,rho=Math.sqrt(R*R-d*d);sphere(m,R);add(m,'H',[0,0,d]);add(m,'P',[rho,0,d]);ids=ring(m,[0,0,d],rho,undefined,'_cut');line(m,'O','H');line(m,'O','P');line(m,'H','P');mark(m,'O','P','R');mark(m,'O','H','d');view(m,'neutral','Найди центр O, проекцию H и точку P сечения.',[],ids,['O','H','P']);step(0,'Рассмотри OHP и заданный радиус.',[['O','P'],['O','H'],['H','P']],ids);step(1,'Сравни стороны прямоугольного треугольника.',[['O','P'],['O','H'],['H','P']]);step(2,'Проследи точки сечения вокруг H.',[],ids,['H']);f.radius=R;f.distance=d;f.section=ids;f.plane={n:[0,0,1],d};break;
 }
 case'pyramid-volume':{
  const height=5,z=2.2;pyramid(m,4,height);for(const n of ['A','B','C','D'])m.labels[n]=n+'₀';m.labelNames=m.labelNames.filter(n=>n!=='M');line(m,'S','O');mark(m,'S','O','H');add(m,'_area',[0,0,0],'S осн. = B');hidden(m,'Z',[0,0,height-z]);const pl={n:[0,0,1],d:height-z};ids=S.section(S.solid('pyramid',4,4,height),pl).map((p,i)=>hidden(m,'K'+i,p,['K','L','N','P'][i]));m.arrows=[['S','O']];view(m,'neutral','Высота отсчитывается от вершины к основанию.');step(0,'Рассмотри параллельное сечение на выбранной глубине z.',[['S','Z']],ids,['Z']);step(1,'Проследи, как слои располагаются от вершины до основания.',[['S','O']],ids);step(2,'Сопоставь основание B и полную высоту H.',[['S','O']],['A','B','C','D']);f.height=height;f.z=z;f.section=ids;f.baseArea=16;f.coordinateOrigin=P.S.slice();f.coordinateDirection=[0,0,-1];f.plane=pl;break;
 }
 case'sphere-volume':{
  const R=3,z=1.1;sphere(m,R);add(m,'A',[R,0,0]);line(m,'O','A');mark(m,'O','A','R');add(m,'Z₋',[0,0,-R],'−R');add(m,'Z₊',[0,0,R],'R');line(m,'Z₋','Z₊');hidden(m,'H',[0,0,z],'z');ids=ring(m,[0,0,z],Math.sqrt(R*R-z*z),undefined,'_cut');
  // The auxiliary section is highlighted only in help; its wire circle is
  // removed from the initial edge list while keeping exact dependent points.
  m.edges=m.edges.filter(e=>!e.every(n=>n.startsWith('_cut')));view(m,'neutral','Начало отсчёта z — центр шара.');step(0,'Рассмотри слой на выбранной высоте z.',[['O','H']],ids,['H']);step(1,'Проследи все слои от нижней границы к верхней.',[['Z₋','Z₊']],ids);step(2,'Найди обе границы отсчёта z.',[['Z₋','Z₊']],[],['Z₋','Z₊']);f.radius=R;f.z=z;f.section=ids;f.plane={n:[0,0,1],d:z};break;
 }
 case'basis':{
  axes(m,2);add(m,'U',[1,0,0],'u');add(m,'V',[0,1,0],'v');add(m,'W',[1,1,0],'w');line(m,'O','U');line(m,'O','V');line(m,'O','W');m.arrows=[['O','U'],['O','V'],['O','W']];hidden(m,'E',[0,0,1],'(0; 0; 1)');const patch=[[-.3,-.3,0],[1.5,-.3,0],[1.5,1.5,0],[-.3,1.5,0]].map((p,i)=>hidden(m,'_xy'+i,p,''));view(m,'neutral','Найди три вектора из условия.',[['O','U'],['O','V'],['O','W']]);step(0,'Сравни третьи координаты трёх векторов.',[['O','U'],['O','V'],['O','W']],patch);step(1,'Рассмотри ещё одно пространственное направление.',[['O','E']],patch,['E']);step(2,'Сравни направления в плоскости и вне неё.',[['O','U'],['O','V'],['O','W'],['O','E']],patch);scene.status='exact';scene.note='Координаты векторов взяты прямо из условия. Дополнительное направление появляется в нужном шаге. Вращение не заменяет доказательство.';break;
 }
 case'dot':{
  planePatch(m,0,3);add(m,'O',[0,0,0]);add(m,'U',[2.4,.8,2.2],'u');add(m,'N',[0,0,3],'n');line(m,'O','U');line(m,'O','N');m.arrows=[['O','U'],['O','N']];hidden(m,'H',[2.4,.8,0]);view(m,'neutral','Найди направление прямой u и нормаль n.');step(0,'Сравни направление u и нормаль n.',[['O','U'],['O','N']]);step(1,'Найди проекцию направления u на плоскость.',[['O','U'],['U','H'],['O','H'],['O','N']],['O','U','H'],['H']);step(2,'Сопоставь угол с нормалью и угол с проекцией.',[['O','N'],['O','U'],['O','H']]);f.normal=[0,0,3];f.direction=P.U.slice();f.plane={n:[0,0,1],d:0};break;
 }
 case'scale':{
  const dims=[2,1.5,2.5],k=1.6,small=S.solid('box',...dims),large=S.solid('box',...dims.map(x=>x*k));small.vertices=small.vertices.map(p=>S.add(p,[-3,0,0]));large.vertices=large.vertices.map(p=>S.add(p,[3,0,0]));mergeMesh(m,small,'s',false);mergeMesh(m,large,'l',false);mark(m,'sA','sB','a');mark(m,'sA','sD','b');mark(m,'sA','sA₁','h');mark(m,'lA','lB','ka');mark(m,'lA','lD','kb');mark(m,'lA','lA₁','kh');const pairs=[['sA','sB'],['sA','sD'],['sA','sA₁'],['lA','lB'],['lA','lD'],['lA','lA₁']];view(m,'neutral','Сравни соответствующие размеры двух тел.');step(0,'Проследи все три пары соответствующих размеров.',pairs);step(1,'Сопоставь три измерения подобного тела.',pairs.slice(3));step(2,'Сравни исходное тело и его подобную копию.',pairs);f.scale=k;f.dimensions=dims;break;
 }
 }
 for(let i=0;i<proof.steps.length;i++){const name='step'+i;if(!m.views[name])view(m,name,'Рассмотри объекты текущего шага.',m.views.neutral.segments,m.views.neutral.polygon,m.views.neutral.points);scene.stepViews.push(name);}
 m.title=scene.title;m.note=scene.note;return scene;
}
function dist(a,b){return S.dist(a,b);}
function mountProof(el,options){return Scenes.mountScene(el,buildProof(options.key,options.proof),options);}
Scenes.buildProof=buildProof;Scenes.mountProof=mountProof;Scenes.proofKeys=keys;
const api={buildProof,mountProof,keys};root.StereoProofScenes=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

import test from 'node:test';import assert from 'node:assert/strict';
import {R,add,sub,mul,eq,compare} from '../src/math-kernel.js';
import {eEqual,eAt,eSign,parseExact} from '../src/exact-roots.js';
import {GEOMETRY_TOPICS,solveGeometry} from '../src/geometry.js';
import {EDGES,VERTICES,cubeSection,parseSectionPoints,dot,pointEqual} from '../src/cube-section.js';
import {LABS,labModel,graphSegment} from '../public/visual-labs.js';
import {answerOffline,isProviderTopic} from '../src/tutor.js';
const solve=(topic,q,a)=>{const s=solveGeometry(topic,q);assert(s,`${topic}: ${q}`);if(a!==undefined)assert.equal(s.verify(a).status,'correct',`${q} / ${a}`);return s;};
test('Pythagoras exact roots satisfy independent squared side identity',()=>{
 let n=0;for(let a=1;a<=15;a++)for(let b=1;b<=15;b++){const s=solve('pythagoras',`Пифагор: катеты ${a} и ${b}; найти гипотенузу`);const answer=s.steps.at(-1).replace('Ответ: ','').replace(/\.$/,'');const root=parseExact(answer);assert.equal(eSign(eAt([R(-(a*a+b*b)),R(0),R(1)],root)),0);assert.equal(s.verify(answer).status,'correct');n++;}assert.equal(n,225);
 solve('pythagoras','Пифагор: гипотенуза 5; катет 3; найти второй катет','4');solve('pythagoras','Пифагор: катеты 1 и 1; найти гипотенузу','√2');
 for(const q of ['Пифагор: гипотенуза 3; катет 5; найти второй катет','Пифагор: катеты 0 и 3; найти гипотенузу'])assert.equal(solveGeometry('pythagoras',q),null);
});
test('angle and correspondence rules use their explicit hypotheses',()=>{
 for(let a=1;a<180;a+=7){solve('parallel-angles',`Параллельные: угол ${a}°; пара односторонние`,String(180-a));solve('parallel-angles',`Параллельные: угол ${a}°; пара соответственные`,String(a));}
 solve('triangle-angles','Треугольник: A=50°; B=60°; найти C','70°');solve('triangle-angles','Треугольник: A=50°; B=60°; найти внешний при C','110');
 assert.equal(solveGeometry('triangle-angles','Треугольник: A=100°; B=90°; найти C'),null);
 for(const [q,criterion] of [['AB=DE; BC=EF; AC=DF','ССС'],['AB=DE; BC=EF; угол B=E','СУС'],['AB=DE; угол A=D; угол B=E','УСУ']]){
  const s=solve('triangle-congruence','Равенство: '+q,`C=F; A=D; B=E; ${criterion}`);assert.equal(s.verify(criterion).status,'unsupported');assert.equal(s.verify('A=D;B=E;C=F;неверный').status,'incorrect');
 }
 assert.equal(solveGeometry('triangle-congruence','Равенство: AB=DE; BC=EF; угол A=D'),null);
 solve('triangle-similarity','Подобие: ABC~DEF; AB=6; DE=3; BC=8; найти EF','4');
 solve('circle-angles','Окружность: дуга AB=240°; найти вписанный угол; C вне дуги AB','120');
 assert.equal(solveGeometry('circle-angles','Окружность: дуга AB=100°; найти вписанный угол'),null);
 solve('circle-properties','Касательная: OT радиус; t касается в T; найти угол OT с t','90');
 const tangent=solve('circle-properties','Касательная и хорда: дуга TB=100°; найти угол, соответствующий этой дуге','50');assert(tangent.figure.edges.some(e=>e.from==='T'&&e.to==='B'));assert(tangent.figure.edges.some(e=>e.from==='T'&&e.to==='U'));
 assert.equal(solveGeometry('circle-properties','Хорда: M середина AB; O центр; найти угол OM с AB'),null);
});
test('areas, vectors and volumes agree with independent decompositions and reject impossible domains',()=>{
 for(let w=2;w<=7;w++)for(let h=2;h<=7;h++)for(let a=1;a<w;a++)for(let b=1;b<h;b++){
  const s=solve('composite-areas',`Фигура: прямоугольник ${w} на ${h}; вырез в углу ${a} на ${b}; найти площадь`);assert(eq(s.expected,R(w*(h-b)+(w-a)*b)));
 }
 solve('vectors','Вектор: A=(1;2); B=(4;6); найти AB','(3;4)');solve('vectors','Вектор: A=(4;6); B=(1;2); найти AB','(-3;-4)');
 solve('vectors','Векторы: a=(1;2); b=(-3;4); найти a+b','(-2;6)');solve('vectors','Вектор: A=(1;2); B=(1;2); найти длину AB','0');
 for(const [q,a] of [['призма; S=12; h=5','60'],['пирамида; S=12; h=5','20'],['цилиндр; r=3; h=5','45pi'],['конус; r=3; h=5','15π'],['конус; r=1; h=1','pi/3']])solve('volumes','Объём: '+q,a);
 solve('volumes','Объём: цилиндр; r=1000; h=1000','1000000000pi');
 assert.equal(solve('volumes','Объём: цилиндр; r=3; h=5').verify('45').status,'unsupported');assert.equal(solveGeometry('volumes','Объём: цилиндр; r=-3; h=5'),null);
});
test('space angles specify correct projection or perpendicular pair',()=>{
 for(const [q,a] of [['AB1','45'],['ABB1A1','90'],['ABC1D1','45']])solve('space-angles',`Угол в кубе: ${q} с плоскостью ABCD`,a);
 assert.equal(solveGeometry('space-angles','Угол в кубе: AC1 с плоскостью ABCD'),null);
 const norm=v=>Math.hypot(...v),sub=(a,b)=>a.map((x,i)=>x-b[i]),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
 const ab=sub(VERTICES.B,VERTICES.A),ab1=sub(VERTICES.B1,VERTICES.A),bb1=sub(VERTICES.B1,VERTICES.B),bc=sub(VERTICES.C,VERTICES.B),bc1=sub(VERTICES.C1,VERTICES.B);
 assert.equal(dot(ab,bb1),0);assert.equal(dot(ab,bc),0);assert.equal(dot(ab,bc1),0);assert.equal(dot(bb1,bc),0);
 assert(Math.abs(dot(ab,ab1)/(norm(ab)*norm(ab1))-Math.SQRT1_2)<1e-12);assert(Math.abs(dot(bc,bc1)/(norm(bc)*norm(bc1))-Math.SQRT1_2)<1e-12);
});
test('cube sections: known triangle/hexagon and all midpoint triples satisfy plane, edge and face incidence',()=>{
 solve('sections','Куб: M=AB:1/2; N=AD:1/2; P=AA1:1/2','(1/2;0;0)|(0;1/2;0)|(0;0;1/2)');
 const hex=cubeSection(parseSectionPoints('Куб: M=BC:1/2; N=BB1:1/2; P=CD:1/2'));assert.equal(hex.polygon.length,6);
 const face=cubeSection(parseSectionPoints('Куб: M=AB:0; N=AB:1; P=AD:1'));assert.equal(face.polygon.length,4);
 assert.equal(solveGeometry('sections','Куб: M=AB:0; N=AB:1/2; P=AB:1'),null);
 assert.equal(solveGeometry('sections','Куб: M=AB:2; N=AD:1/2; P=AA1:1/2'),null);
 const mids=EDGES.map(([a,b])=>VERTICES[a].map((x,i)=>R(x+VERTICES[b][i],2)));let valid=0,degenerate=0;
 for(let i=0;i<12;i++)for(let j=i+1;j<12;j++)for(let k=j+1;k<12;k++){
  let section;try{section=cubeSection([mids[i],mids[j],mids[k]]);}catch{degenerate++;continue;}valid++;
  for(const p of section.polygon){assert(eq(dot(section.normal,p),section.plane));assert(p.every(v=>compare(v,R(0))>=0&&compare(v,R(1))<=0));assert(p.filter(v=>eq(v,R(0))||eq(v,R(1))).length>=2);}
  for(let n=0;n<section.polygon.length;n++){const a=section.polygon[n],b=section.polygon[(n+1)%section.polygon.length];assert(a.some((v,d)=>(eq(v,R(0))||eq(v,R(1)))&&eq(v,b[d])),'adjacent section points share a cube face');}
 }
 assert.equal(valid+degenerate,220);assert(valid>180);
});
test('interactive models preserve fractions, counts, equation solutions and graph corners',()=>{
 for(let d=1;d<=12;d++)for(let n=0;n<=d;n++)for(let k=1;k<=5;k++){const m=labModel('fractions',{n,d,k});assert.equal(m.equal[0],m.equal[1]);}
 for(let b=1;b<=6;b++)for(let a=0;a<=b;a++)for(let d=1;d<=6;d++)for(let c=0;c<=d;c++){const m=labModel('area',{a,b,c,d});let cells=0;for(let x=0;x<b;x++)for(let y=0;y<d;y++)if(x<a&&y<c)cells++;assert.equal(cells,a*c);assert(m.text.includes(`${a*c} из ${b*d}`));}
 for(let start=-6;start<=6;start++)for(let delta=-6;delta<=6;delta++)assert.equal(labModel('steps',{start,delta},100).position,start+delta);
 for(let a=1;a<=6;a++)for(let b=-12;b<=12;b++)for(let c=-30;c<=30;c+=5){const initial=labModel('balance',{a,b,c},0);assert.equal(labModel('balance',{a,b,c},1).root,initial.root);assert.equal(labModel('balance',{a,b,c},2).root,initial.root);}
 for(let k=-4;k<=4;k++)for(let b=-5;b<=5;b++){const segment=graphSegment(k,b);assert.equal(segment.length,2);assert.notDeepEqual(segment[0],segment[1]);for(const [x,y] of segment){assert(Math.abs(y-(k*x+b))<1e-10);assert(Math.abs(x)<=5&&Math.abs(y)<=5);}}
 for(const op of ['<','<=','>','>=']){const m=labModel('inequality',{bound:2},0,op);assert.equal(m.closed,op.length===2);assert.equal(m.right,op[0]==='>');}
 assert.throws(()=>labModel('fractions',{n:3,d:2,k:1}));assert.throws(()=>labModel('percent',{whole:Infinity}));
});
test('geometry integration keeps staged figures and provider boundaries',()=>{
 for(const t of GEOMETRY_TOPICS){assert.equal(isProviderTopic(t.id),false);const hint=answerOffline({topic:t.id,question:t.sample});assert.equal(hint.verification,'deterministic');assert.equal(hint.figure,undefined);assert.equal(hint.table,undefined);const full=answerOffline({topic:t.id,question:t.sample,mode:'explain'});assert.doesNotThrow(()=>JSON.stringify(full));}
 for(const [topic,question] of [['pythagoras','Пифагор: катеты 3 и 4; найти гипотенузу'],['sections','Куб: M=AB:1/2; N=AD:1/2; P=AA1:1/2']])assert.equal(answerOffline({topic,question}).verification,'deterministic');
});

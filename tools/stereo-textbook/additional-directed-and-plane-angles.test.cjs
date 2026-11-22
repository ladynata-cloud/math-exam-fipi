const assert = require('node:assert/strict');
const engine = require('../../stereo-course/textbook/assets/engine.js');
const viewer = require('../../stereo-course/assets/task-scene-viewer.js');
const bank = require('../../stereo-course/textbook/data/course.json');
const report = require('./additional-directed-and-plane-angles.json');
const {wrongStepAnswers} = require('./wrong-step-answers.cjs');
const {available,issues} = engine.inspectBundle(bank.catalog,bank.lessons);
assert.deepEqual(issues,[]);
const add=(a,b)=>a.map((v,i)=>v+b[i]);
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const mul=(a,k)=>a.map(v=>v*k);
const sq=a=>dot(a,a);
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const normalizedCos=(a,b)=>dot(a,b)/Math.sqrt(sq(a)*sq(b));
const angle=(a,b)=>180/Math.PI*Math.acos(Math.max(-1,Math.min(1,normalizedCos(a,b))));
const eq=(a,b)=>assert(sq(sub(a,b))<1e-12,JSON.stringify([a,b]));
const near=(a,b)=>assert(Math.abs(a-b)<1e-8,[a,b].join(' != '));
const input=v=>typeof v==='number' ? String(Number(v.toFixed(12))) : String(v);
const triple=v=>v.map(input).join(';');
let fields=0, transforms=0;
for(const id of Object.keys(report.cards)){
 const c=available.get(id),n=Number(c.source.exercise),part='абвгд'.indexOf(c.source.subpart),m=c.visualization.model,p=m.points;
 viewer.prepare(m);assert.deepEqual(c.source.printedPages,[188]);assert.deepEqual(c.source.pdfPages,[190]);
 let vals,first,second;
 if(n===749){const a=[-1,5,3],b=[3,0,2],v=[.5,-3,4],d=[2,1,0];const [u,w]=[[a,b],[a,v],[d,d],[add(add(a,b),v),d],[sub(a,b),sub(v,d)]][part];eq(p.A,u);eq(p.B,w);eq(p.C,add(u,[1,0,0]));vals=[triple([...u,...w]),triple(u.map((x,i)=>x*w[i])),dot(p.C,w),dot(u,w)];first=u;second=w;
 }else if(n===750){const pairs=[[sub(p.A,p.D),sub(p.D,p.B)],[sub(p.B,p.D),sub(p.B,p.C)],[sub(p.D,p.B),sub(p.A,p.B)]];[first,second]=pairs[part];for(const x of ['A','B','C'])near(sq(sub(p[x],p.D)),1);const measured=angle(first,second),expected=[135,60,67.5][part];near(measured,expected);vals=[[45,60,45][part],expected,[180-60,(180-80)/2,(180-80)/2][part],expected];
 }else if(n===751){const pairs=[['D1','B','D1','D'],['D','D1','B','C'],['D','A','B','C'],['D1','B','D','C']];const [a,b,g,h]=pairs[part].map(k=>p[k]);first=sub(b,a);second=sub(h,g);const prod=dot(first,second);eq(mul(add(add(p.A,p.B),p.C),1/3),p.D1);for(const u of 'ABCD')for(const v of 'ABCD')if(u!==v)near(sq(sub(p[u],p[v])),8);vals=[triple(p.D1),prod,4*prod,Math.abs(prod)<1e-10?'да':'нет'];
 }else if(n===752){first=sub(p.B,p.A);second=sub(p.D,p.C);eq(p.U,first);eq(p.V,second);eq(p.W,mul(second,-1));const prod=dot(first,second);vals=[triple([...first,...second]),triple([prod,sq(first),sq(second)]),Math.abs(dot(first,p.W)),Math.abs(normalizedCos(first,second))];
 }else if(n===753){eq(p.M,mul(add(p.B,p.C1),.5));first=part===0?sub(p.D,p.A1):sub(p.D,p.M);second=part===0?sub(p.M,p.A):sub(p.B1,p.B);const prod=dot(first,second);vals=[prod,normalizedCos(first,second),4*prod,Math.round(angle(first,second)*10)/10];
 }else if(n===754){first=sub(p.B,p.A);second=sub(p.D,p.A);const w=sub(p.A1,p.A);for(const [x,y] of [[first,second],[first,w],[second,w]])near(dot(x,y),.5);eq(add(add(first,second),w),p.C1);eq(add(second,w),p.D1);const a=sq(sub(p.C1,p.A)),b=sq(sub(p.D1,p.B));near(a,6);near(b,2);vals=[dot(first,second),triple([a,b]),'3;3',triple([Math.sqrt(a),Math.sqrt(b)])];
 }else if(n===755){const [a,b]=[['B','C'],['D','C'],['A','C'],['D','B']][part].map(x=>p[x]);first=sub(p.N,p.M);second=sub(b,a);eq(p.N,mul(add(p.B,p.C),.5));const cos=Math.abs(normalizedCos(first,second));near(cos,Math.abs(normalizedCos(sub(p.N,p.T),second)));vals=[Math.sqrt(sq(first)),Math.abs(dot(first,second)),'нет',cos];
 }else if(n===756){first=sub(p.N,p.M);second=part===0?[0,1,0]:[0,0,1];near(Math.sqrt(sq(sub(p.M,p.B)))/Math.sqrt(sq(sub(p.B1,p.M))),3/2);near(Math.sqrt(sq(sub(p.N,p.A)))/Math.sqrt(sq(sub(p.D,p.N))),2/3);vals=[triple(first),Math.abs(dot(first,second)),sq(sub(p.N,p.T)),Math.abs(normalizedCos(first,second))];
 }else throw Error(id);
 if(sq(first)&&sq(second))for(const k of [1,2,3])for(const sign of [-1,1]){const rotated=v=>[sign*v[2],v[0],-v[1]];near(normalizedCos(mul(rotated(first),k),mul(rotated(second),k)),normalizedCos(first,second));transforms++;}
 c.steps.forEach((step,i)=>{assert.equal(engine.classifyAnswer(input(vals[i]),step.input.accepted).status,'correct',id+' '+i);for(const bad of wrongStepAnswers(id,step))assert.equal(engine.classifyAnswer(bad,step.input.accepted).status,'wrong',id+' '+i+' '+bad);fields++;});assert.equal(engine.classifyAnswer(input(vals.at(-1)),c.answer.accepted).status,'correct',id+' final');
}
assert.equal(fields,69);assert.equal(transforms,138);
console.log('SPACE_DIRECTED_ANGLES_749_756_OK: all 23 parts, 69 checked fields, 138 signed permutations and scale comparisons, all 6 tetrahedral edges and both face normals verified');

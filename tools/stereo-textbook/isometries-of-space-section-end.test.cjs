'use strict';
const assert=require('node:assert/strict'),engine=require('../../stereo-course/textbook/assets/engine.js'),viewer=require('../../stereo-course/assets/task-scene-viewer.js');
const bank=require('../../stereo-course/textbook/data/course.json'),receipt=require('./isometries-of-space-section-end.json'),{wrongStepAnswers}=require('./wrong-step-answers.cjs');
const {available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);assert.deepEqual(issues,[]);
const sub=(a,b)=>a.map((x,i)=>x-b[i]),add=(a,b)=>a.map((x,i)=>x+b[i]),mul=(v,k)=>v.map(x=>x*k);
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),norm=v=>Math.sqrt(dot(v,v)),near=(a,b)=>assert(Math.abs(a-b)<1e-8,a+' vs '+b);
const same=(a,b)=>near(norm(sub(a,b)),0),F=([x,y,z])=>[1-y,x-1,z+2],back=([x,y,z])=>[y+1,1-x,z-2],mirror=([x,y,z])=>[x,y,-z];
const good=(x,accepted)=>assert.equal(engine.classifyAnswer(String(x),accepted).status,'correct',String(x));
const keys={'0723':['2;2;-3',-2,'нет','да'],'0724-a':['-2;-1;-2',-2,'4;3;-2','параллельна'],'0724-b':['1;-1;-2',1,'1;3;2','совпадает'],
 '0725-a':['0;3;0','2;0;0','5;3;0','параллельна'],'0725-b':['3;1;1','2;0;0','8;1;1','совпадает'],'0726':['1;2;1','3;1;4','5;0;7',1],
 '0727-a':[2,3,'да','прямая'],'0727-b':['нет','да',2,'плоскость'],'0728-a':[2,4,2,'отрезок'],'0728-b':['2;2',8,'нет',90],
 '0729-a':['нет',1,4,'параллельны'],'0729-b':['нет',1,4,'параллельны'],'0730-a':[2,2,'нет','окружность'],'0730-b':['2;3;4',90,29,24]};
let fields=0,inverseChecks=0,ring=0;
for(const id of Object.keys(receipt.cards)){
 const c=available.get(id),n=Number(c.source.exercise),part=id.at(-1),m=c.visualization.model,p=m.points,key=keys[id.slice(8)];
 viewer.prepare(m);assert.deepEqual(c.source.printedPages,[185]);assert.deepEqual(c.source.pdfPages,[187]);
 assert.deepEqual(new Set(['neutral',...c.help.map(h=>h.view),...c.steps.map(s=>s.view)]),new Set(Object.keys(m.views)));
 if(n===723){for(const t of [-2,-1,0,1,2,4]){const q=add(p.A,mul(sub(p.B,p.A),t)),r=mirror(q);near(q[0]-2*q[1],-2);near(r[0]-2*r[1],-2);same(mirror(r),q);inverseChecks++;}
  same(p.T1,mirror(p.T));same(p.U1,mirror(p.U));near(p.T[0],p.U[0]);near(p.T[1],p.U[1]);}
 if(n===724){for(const name of 'ABCT'){same(mirror(p[name]),p[name+'1']);same(mirror(p[name+'1']),p[name]);near(p[name+'1'][part==='a'?2:0],part==='a'?-2:1);inverseChecks++;}}
 if(n===725){const u=sub(p.B,p.A),w=sub(p.A1,p.A);
  same(sub(p.B1,p.A1),u);for(const t of [-2,-1,0,2,6]){const q=add(p.A,mul(u,t));same(add(q,w),add(p.A1,mul(u,t)));same(sub(add(q,w),w),q);inverseChecks++;}
  if(part==='b')near(w[1],0);else assert.notEqual(w[1],0);}
 if(n===726){const mean=(a,b,c)=>mul(add(add(a,b),c),1/3);same(p.M,mean(p.A,p.B,p.C));same(p.M1,mean(p.A1,p.B1,p.C1));
  for(const d of [[1,2,3],[-2,0,1],[0,0,0],[.5,-4,0]]){same(add(p.M,d),mean(add(p.A,d),add(p.B,d),add(p.C,d)));inverseChecks++;}}
 if(n>=727&&n<=729){
  const names=Object.keys(p).filter(k=>!k.endsWith('1'));
  for(const name of names){same(F(p[name]),p[name+'1']);same(back(p[name+'1']),p[name]);inverseChecks++;}
  for(const a of names)for(const b of names)near(norm(sub(p[a],p[b])),norm(sub(p[a+'1'],p[b+'1'])));
  if(n===727||n===728){near(norm(sub(p.A1,p.T1))+norm(sub(p.T1,p.B1)),norm(sub(p.A1,p.B1)));assert(norm(sub(p.A1,p.U1))+norm(sub(p.U1,p.B1))>norm(sub(p.A1,p.B1)));}
  if(n===729){assert.match(c.help.map(h=>h.text).join(' '),/единственный прообраз/);if(part==='a')assert.match(c.help[0].text,/скрещивающиеся/);near(norm(sub(p.T1,p.U1)),2);}
 }
 if(n===730&&part==='a'){
  for(let i=0;i<48;i++){const a=p['_a'+i],b=p['_b'+i];near(norm(sub(a,p.O)),2);near(norm(sub(b,p.O1)),2);near(b[2],2);same(back(b),a);ring++;}
  near(norm(sub(p.X1,p.O1)),2);assert.notEqual(p.X1[2],p.O1[2]);}
 if(n===730&&part==='b'){
  for(const name of ['A','B','C','D','A1','B1','C1','D1']){same(F(p[name]),p['U'+name]);same(back(p['U'+name]),p[name]);inverseChecks++;}
  const u=sub(p.UB,p.UA),v=sub(p.UD,p.UA),w=sub(p.UA1,p.UA);
  [norm(u),norm(v),norm(w)].forEach((x,i)=>near(x,[2,3,4][i]));near(dot(u,v),0);near(dot(u,w),0);near(dot(v,w),0);
  for(const t of [.2,.5,.9]){const inside=[2*t,3*t,4*(1-t)];same(back(F(inside)),inside);inverseChecks++;}
 }
 c.steps.forEach((step,i)=>{good(key[i],step.input.accepted);for(const x of wrongStepAnswers(id,step))assert.equal(engine.classifyAnswer(x,step.input.accepted).status,'wrong',id+' '+x);fields++;});good(key.at(-1),c.answer.accepted);
}
for(let n=719;n<=730;n++){const rows=bank.catalog.entries.filter(c=>c.source.collection==='main'&&c.source.exercise===String(n));assert(rows.length && rows.every(c=>c.status==='reviewed'&&available.has(c.id)));}
for(let t=80;t<=84;t++)assert(available.has('theory-0'+t));
assert.equal(ring,48);assert.equal(fields,42);assert(inverseChecks>=75);
console.log('MOTIONS_SECTION_COMPLETE: topics 80–84, all numbered parts 719–730, 42 final step fields, '+inverseChecks+' independent inverse-image checks, and all 48 circle points with an off-plane negative control');

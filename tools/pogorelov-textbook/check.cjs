'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),dir=path.join(root,'geometry-pogorelov/textbook');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(dir,'data.js'),'utf8'),ctx);
const C=ctx.window.POGORELOV_COURSE,M=require(path.join(dir,'core.js'));
const list=C.units.flatMap(u=>u.tasks.map(t=>({u,t}))),byId=new Map(list.map(x=>[x.t.id,x]));
const oracle={
 'p1-n7-1':[6],'p1-n7-2':[7.7],'p1-n7-3':[18.1],
 'p1-n15-1':[9,6],'p1-n15-2':[10,5],'p1-n15-3':[7.5,7.5],'p1-n15-4':[6,9],
 'p1-n24-1':[110],'p1-n24-2':[119],'p1-n24-3':[179],'p1-n31-1':[1.2],'p1-n31-2':[2.4],
 'p2-n3':[60,120],'p2-n6-1':[72,108],'p2-n6-2':[54,126],'p2-n6-3':[55,125],'p2-n6-4':[88,92],
 'p2-n7':[30,150,150],'p2-n8':[130],'p2-n15-1':[15],'p2-n15-2':[26],'p2-n15-3':[86],'p2-n19':[90],
 'p3-n1':[10],'p3-n8':[.3],'p3-n9':[3.5],'p3-n10-1':[6.2,3.2],'p3-n10-2':[4.2,7.2],'p3-n26':[15],
 'p4-n18-1':[100],'p4-n18-2':[65],'p4-n18-3':[35],'p4-n18-4':[35],
 'p4-n19-1':[30,60,90],'p4-n19-2':[40,60,80],'p4-n19-3':[45,60,75],
 'p4-n25':[55,40,2],'p4-n33':[60,30,90],'p4-n44':[45,45,90],
 'p5-n5-1':[60],'p5-n5-2':[120],'p5-n9':[30,150],'p5-n11':[70,10],
 'p6-n8':[15,10],'p6-n9':[150,30,150],'p6-n10':[3],'p6-n20':[.6,.8],
 'p6-n50':[4,5,6],'p6-n51':[6],'p6-n67':[4,6],'p6-n69':[5,9],
 'p7-n2-1':[5],'p7-n2-2':[Math.SQRT2],'p7-n2-3':[Math.sqrt(61)],
 'p7-n3-1':[4],'p7-n3-2':[12],'p7-n3-3':[Math.sqrt(11)],'p7-n4':[5,Math.sqrt(7)],'p7-n27':[2],'p7-n44':[10,6],
 'p8-n5':[2,0],'p8-n6':[0,3],'p8-n11-1':[4],'p8-n11-2':[3],
 'p8-n12-1':[3,2],'p8-n12-2':[-1,3],'p8-n12-3':[1,1],'p8-n17':[5,5,10],'p8-n25':[0,3,13],
 'p9-n14-1':[-3,-4],'p9-n14-2':[3,4],'p9-n14-3':[3,-4],
 'p9-n29-1':[2,2],'p9-n29-2':[-3,8],'p9-n29-3':[1,1],'p9-n19':[3],
 'p10-n5':[-12,12,-7,7],'p10-n7':[-2,0],
 'p10-n8-1':[-3,4,5],'p10-n8-2':[6,8,10],'p10-n10-1':[5,-12,13],'p10-n10-2':[-6,8,10],
 'p10-n19':[-6,-8,10],'p10-n26':[2],'p10-n35':[-8/3],
 'p11-n6':[1.5,30],'p11-n11':[13.6],'p11-n12':[4,14],'p11-n18':[4],
 'p11-n20-1':[14],'p11-n20-2':[6],'p11-n40':[25,15,20],'p11-n50':[5],
 'p12-n1':[5/7,19/35,1/5],'p12-n2':[Math.sqrt(13),Math.sqrt(109)],'p12-n14':[35*Math.sqrt(6)/24],
 'p12-n26-1':[105,2.5881904510252074,3.660254037844386],
 'p12-n26-2':[45,17.93150944336107,14.64101615137754],
 'p13-n9':[360],'p13-n12-1':[8],'p13-n12-2':[12],'p13-n13-1':[10],'p13-n13-2':[15],
 'p13-n38-1':[20*Math.PI],'p13-n38-2':[30*Math.PI],'p13-n39':[2*Math.PI],
 'p14-n5':[9],'p14-n6':[5],'p14-n7':[8,18],'p14-n17':[4800],'p14-n19':[6],
 'p14-n29-1':[84],'p14-n29-2':[12],'p14-n29-3':[288],'p14-n38':[408],'p14-n54-1':[20*Math.PI],
 'p15-n19':[22],'p15-n22':[12],'p15-n25':[1464],'p15-n33':[6],'p15-n40':[35200],'p15-n45':[5],'p15-n47':[5]
};
let count=0;
assert.equal(C.units.length,15);assert.equal(list.length,134);assert.equal(byId.size,134);
assert.equal(new Set(list.map(({u,t})=>`${u.id}:${t.number}`)).size,92);
for(const {u,t} of list){
  assert.ok(t.page>=u.pages[0]&&t.page<=u.pages[1],t.id+' source page');
  assert.ok(t.id.startsWith('p'+u.id+'-n'+t.number),t.id+' stable ID');
  assert.ok(t.goal&&t.model&&t.steps.length>=2,t.id);
  if(t.answers){
    assert.ok(oracle[t.id],t.id+' independent oracle missing');
    assert.equal(t.answers.length,oracle[t.id].length,t.id);
    t.answers.forEach((a,i)=>{assert.ok(Math.abs(a.value-oracle[t.id][i])<1e-8,t.id+' answer '+i);assert.ok(M.check(String(oracle[t.id][i]),a));assert.ok(!M.check(String(a.value+1),a));count++;});
  }else assert.ok(t.checks?.length>=3,t.id+' manual rubric');
  t.steps.forEach(s=>{assert.ok(s.prompt&&s.hint&&s.explain);if(s.options){assert.ok(s.options.includes(s.value));assert.equal(new Set(s.options).size,s.options.length);}else assert.ok(Number.isFinite(s.value),t.id);});
  for(const p of Object.values(t.model.points))assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));
  for(const e of t.model.lines){const a=t.model.points[e.a],b=t.model.points[e.b];assert.ok(a&&b);assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>1e-8,t.id+' zero segment');}
}
for(const [raw,n] of [['2,5',2.5],['5/7',5/7],['-8/3',-8/3],['sqrt(7)',Math.sqrt(7)],['√7',Math.sqrt(7)],['20π',20*Math.PI],['35/(4*sqrt(6))',35/(4*Math.sqrt(6))],['2(3+4)',14],['-2^2',-4],['35 200',35200],['(1+2)*3',9]])assert.ok(Math.abs(M.parse(raw)-n)<1e-10,raw);
for(const raw of ['','1/0','sqrt(-1)','NaN','Infinity','globalThis.x=1','2foo','alert(1)','[1]','2**3','1e999','2^99','1;2','Math.sqrt(7)','<img src=x>'])assert.ok(Number.isNaN(M.parse(raw)),raw);
const t=byId.get('p1-n7-1').t,p=M.fresh();p.checked=true;p.drafts=['0'];assert.equal(M.restore(JSON.stringify(p),t).checked,false);
p.drafts=['6'];p.hints=[0];p.assisted=false;assert.equal(M.restore(JSON.stringify(p),t).assisted,true);
p.done=2;p.stepDrafts=['wrong','6'];assert.equal(M.restore(JSON.stringify(p),t).done,0);
assert.throws(()=>M.restore('null',t));assert.throws(()=>M.restore('{"schema":8}',t));
const mp=byId.get('p3-n2').t,manual=M.fresh();manual.manual=true;assert.equal(M.restore(JSON.stringify(manual),mp).manual,false);
// Geometric oracles independent of the rendering functions.
const p19=byId.get('p14-n19').t.model.points;
assert.ok(Math.abs(p19.C.y-3)<1e-9,'height to the 8cm side');
const p6=byId.get('p11-n6').t.model.points;
const angle=Math.acos(((p6.B.x-p6.A.x)*(p6.C.x-p6.A.x)+(p6.B.y-p6.A.y)*(p6.C.y-p6.A.y))/(Math.hypot(p6.B.x-p6.A.x,p6.B.y-p6.A.y)*Math.hypot(p6.C.x-p6.A.x,p6.C.y-p6.A.y)))*180/Math.PI;
assert.ok(Math.abs(angle-30)<1e-9,'given 30-degree angle');
const p40=byId.get('p11-n40').t.model.points;assert.ok(Math.abs(Math.hypot(p40.B.x-p40.H.x,p40.B.y-p40.H.y)-9)<1e-9);
const sources=JSON.parse(fs.readFileSync(path.join(dir,'source-map.json'),'utf8'));
assert.equal(sources.completeExerciseCoverage,false);assert.equal(sources.exercises.length,134);
assert.ok(sources.exercises.every(s=>s.pdfPage===s.printedPage+1));
assert.ok(!fs.readdirSync(dir).some(f=>/\.(pdf|png|jpg)$/i.test(f)));
console.log(`POGORELOV_CONTENT_OK: 134 trainers, ${count} independently checked final values, 340 steps, 15 paragraphs; parser, restoration and geometry oracles pass.`);

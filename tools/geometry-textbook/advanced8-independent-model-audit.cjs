'use strict';
// A second evaluator for the declared geometry and visible equality markings.
// Passing this numerical check does not confer source, visual or content approval.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
function independentGeometryAudit(data) {
 const report={cards:data.cards.length,views:0,declaredClaims:0,rightAngleMarks:0,equalLengthMarks:0,equalAngleMarks:0,finitePoints:0,maxRelativeResidual:0,failures:[]};
 const sub=(a,b)=>[a[0]-b[0],a[1]-b[1]];
 const dot=(a,b)=>a[0]*b[0]+a[1]*b[1];
 const cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
 const norm=v=>Math.hypot(...v);
 const angle=(a,o,b)=>Math.atan2(Math.abs(cross(sub(a,o),sub(b,o))),dot(sub(a,o),sub(b,o)))*180/Math.PI;
 function test(n,label,residual,tolerance=2e-7) {report.maxRelativeResidual=Math.max(report.maxRelativeResidual,Math.abs(residual));if(!Number.isFinite(residual)||Math.abs(residual)>tolerance)report.failures.push({n,label,residual});}
 for(const c of data.cards){
  const m=c.model, p=m.points;
  const v=s=>sub(p[s[1]],p[s[0]]), len=s=>norm(v(s));
  for(const [id,xyz] of Object.entries(p)) {report.finitePoints++; if(xyz.length!==3||!xyz.every(Number.isFinite)||xyz[2]!==0)report.failures.push({n:c.number,label:`point ${id}`,xyz});}
  for(const ch of m.checks){report.declaredClaims++;let r;
   if(ch.type==="equalLength"){const L=ch.segments.map(len);r=(Math.max(...L)-Math.min(...L))/Math.max(...L);}
   else if(ch.type==="perpendicular"){let [u,w]=ch.segments.map(v);r=dot(u,w)/(norm(u)*norm(w));}
   else if(ch.type==="parallel"){let [u,w]=ch.segments.map(v);r=cross(u,w)/(norm(u)*norm(w));}
   else if(ch.type==="distanceRatio"){r=(len(ch.segments[0])/len(ch.segments[1])-ch.ratio)/Math.max(1,Math.abs(ch.ratio));}
   else if(ch.type==="collinear"){let [a,b,...rest]=ch.points.map(id=>p[id]);r=Math.max(...rest.map(q=>Math.abs(cross(sub(b,a),sub(q,a)))/(norm(sub(b,a))*norm(sub(q,a)))));}
   else if(ch.type==="angle"){let [a,b,d]=ch.points.map(id=>p[id]);r=(angle(a,b,d)-ch.degrees)/180;}
   else {report.failures.push({n:c.number,label:"unknown claim",claim:ch});continue;}
   test(c.number,ch.type,r);
  }
  for(const [vn,view] of Object.entries(m.views)){
   report.views++;
   for(const mark of view.rightAngles||[]){report.rightAngleMarks++;test(c.number,vn+" right-angle mark",(angle(p[mark.a],p[mark.vertex],p[mark.b])-90)/180);}
   const segGroups={}; for(const mark of view.equalSegments||[]){report.equalLengthMarks++;(segGroups[mark.marks||1]??=[]).push(len([mark.a,mark.b]));}
   for(const [g,L] of Object.entries(segGroups))test(c.number,vn+" segment marks "+g,(Math.max(...L)-Math.min(...L))/Math.max(...L));
   const arcGroups={};for(const arc of view.angleArcs||[])if(arc.marks>0){report.equalAngleMarks++;(arcGroups[arc.marks]??=[]).push(angle(p[arc.from],p[arc.vertex],p[arc.to]));}
   for(const [g,A] of Object.entries(arcGroups))test(c.number,vn+" angle marks "+g,(Math.max(...A)-Math.min(...A))/180);
   for(const prop of ["segments","dashSegments","highlightSegments","lines","rays"]){
    for(const seg of view[prop]||[])if(!seg.every(id=>p[id])||len(seg)<1e-8)report.failures.push({n:c.number,label:vn+" invalid "+prop,seg});
   }
  }
 }
 return report;
}
const filename=path.resolve(__dirname,'../../content-drafts/atanasyan-grade8-advanced/authored.json');
const raw=fs.readFileSync(filename),report=independentGeometryAudit(JSON.parse(raw));
assert.equal(report.cards,18);assert.equal(report.views,94);assert.equal(report.declaredClaims,220);
assert.deepEqual(report.failures,[]);
console.log(JSON.stringify({...report,authoredFileSha256:crypto.createHash('sha256').update(raw).digest('hex'),gate:'ADVANCED8_INDEPENDENT_MODEL_AUDIT_OK'}));

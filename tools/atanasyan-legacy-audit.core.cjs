'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const baseline=require('./atanasyan-legacy-audit.baseline.json');
const sha256=content=>crypto.createHash('sha256').update(content).digest('hex');
// #534 added missing SAS/ASA/SSS diagrams before the notebook composition.
// These are exact standalone bytes from 50862960271fccc8e104405bb9a70bc9216929df.
// Require that revision, then undo only its enumerated changes to retain the
// original baseline's independent runtime, grading, storage and board checks.
const diagramRevision={
 'ch2-p3-t5-quiz.html':{sha256:'9e19c49f0215fe1101b44bb55846727ff9b6db78896ed4c2a5aa0704b2fea1e7',diagrams:['sas','asa']},
 'ch2-p4-t5-quiz.html':{sha256:'5bee28ad007f9c8b78a39aa54d8a54d9cf655656ec225c198fcc17e063ff40b8',diagrams:['sss','sas']}
};
const diagramAlt={
 sas:'У треугольников ABC и NMK засечки обозначают AB = NM и AC = NK. Дуги обозначают равные углы при A и N.',
 asa:'У треугольников ABC и NMK засечки обозначают AB = NM. Дуги обозначают равные углы при A и N, двойные дуги — при B и M.',
 sss:'У треугольников ABC и NMK засечки обозначают три пары равных сторон: AB = NM, AC = NK и BC = MK.'
};
function replaceOnce(content,from,to,label){
 assert.equal(content.split(from).length,2,'exactly one reviewed diagram fragment: '+label);
 return content.replace(from,to);
}
function restorePreDiagramCore(content,file){
 const revision=diagramRevision[file];if(!revision)return content;
 assert.equal(sha256(content),revision.sha256,'exact #534 diagram source '+file);
 const fragments=[
  '.q-diagram:not([hidden]){display:block;width:100%;max-width:320px;height:auto;margin:0 auto 14px;background:#f6f8fa;border-radius:10px}\n',
  '    <img class="q-diagram" id="qdiagram" width="320" height="130" alt="" hidden>\n',
  "  const diagram=el('qdiagram');\n  diagram.hidden=!q.diagram;\n  diagram.alt=q.diagramAlt||'';\n  if(q.diagram) diagram.src='../assets/quiz-congruence-'+q.diagram+'.svg';\n  else diagram.removeAttribute('src');\n",
  ...revision.diagrams.map(id=>"  diagram:'"+id+"', diagramAlt:'"+diagramAlt[id]+"',\n")
 ];
 for(const fragment of fragments)content=replaceOnce(content,fragment,'',file);
 if(file==='ch2-p4-t5-quiz.html')content=replaceOnce(content,"q:'На чертеже отмечены <b>две стороны и угол между ними</b>.","q:'Отмечены <b>две стороны и угол между ними</b>.",file+' prompt');
 return content;
}
function assertCoreIdentity(core,file){
 assert.equal(sha256(restorePreDiagramCore(core,file)),baseline.files[file],'retained runtime and board contract byte identity '+file);
}
module.exports={assertCoreIdentity,restorePreDiagramCore,diagramFiles:Object.keys(diagramRevision)};

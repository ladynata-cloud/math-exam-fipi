/* Skill-map contracts: native coverage describes routes, never mastery. */
(function(root,factory){'use strict';
 if(typeof module==='object'&&module.exports)module.exports=factory(require('../../foundations/route-core.js'),require('./foundation-links.js'),[require('./maps-practical.js'),require('./maps-algebra.js'),require('./maps-geometry.js')]);
 else root.OgeSkillCatalog=factory(root.FoundationRoutesCore,root.OgeFoundationLinks,[root.OgePracticalSkillMaps,root.OgeAlgebraSkillMaps,root.OgeGeometrySkillMaps]);
})(typeof globalThis==='undefined'?this:globalThis,function(C,foundations,arrays){
 'use strict';const routes=arrays.flat(),byId=Object.create(null),foundationById=Object.fromEntries(foundations.map(f=>[f.id,f]));
 const groups=[{id:'practical',title:'Практические сюжеты · №1–5',routes:[]},{id:'algebra',title:'Числа, зависимости и алгебра',routes:[]},{id:'geometry',title:'Геометрия: от рисунка к причине',routes:[]}];
 function fail(condition,message){if(!condition)throw Error('OGE skill map: '+message);}
 fail(routes.length===28,'28 native trainer maps expected');
 for(const map of routes){
  fail(map&&/^(?:oge-\d+|practical-[a-z-]+)$/.test(map.id)&&!byId[map.id],'unique map '+map?.id);byId[map.id]=map;
  fail(map.title&&map.goal&&map.transferGoal,'map purpose '+map.id);fail(C.validHref(map.source?.href)&&map.source.title&&map.source.trainerId,'native source '+map.id);
  fail(Array.isArray(map.nodes)&&map.nodes.length===6&&new Set(map.nodes.map(n=>n.id)).size===6,'six distinct nodes '+map.id);
  fail(Array.isArray(map.questions)&&map.questions.length===18,'three finite forms '+map.id);
  fail(map.inventory?.sourcePath&&map.inventory.selector&&Array.isArray(map.inventory.types)&&map.inventory.types.length,'native inventory '+map.id);
  const types=new Set(map.inventory.types.map(t=>String(t.id))),nodes=Object.fromEntries(map.nodes.map(n=>[n.id,n]));fail(types.size===map.inventory.types.length,'unique native IDs '+map.id);
  const covered=new Set(),visited=new Set();function walk(id,stack){fail(nodes[id]&&!stack.has(id),'valid acyclic dependencies '+map.id+'/'+id);if(visited.has(id))return;const next=new Set(stack).add(id);for(const before of nodes[id].dependsOn||[])walk(before,next);visited.add(id);}
  for(const node of map.nodes){
   fail(Array.isArray(node.dependsOn),'explicit dependencies '+map.id+'/'+node.id);
   fail(/^[a-z][a-z0-9-]*$/.test(node.id)&&node.title&&node.goal&&node.finish&&node.misconception,'complete node '+map.id+'/'+node.id);
   fail(node.explain?.prompt&&Array.isArray(node.explain.criteria)&&node.explain.criteria.length>=2,'explanation criteria '+map.id+'/'+node.id);
   fail(Array.isArray(node.resources)&&node.resources.length&&node.resources.every(r=>r.title&&C.validHref(r.href)&&r.instruction&&r.finish),'bounded real resources '+map.id+'/'+node.id);
   fail(Array.isArray(node.foundations)&&node.foundations.every(id=>foundationById[id]),'real foundation skills '+map.id+'/'+node.id);
   fail(Array.isArray(node.covers)&&node.covers.length,'native coverage '+map.id+'/'+node.id);
   for(const id of node.covers){fail(types.has(String(id)),'unknown native type '+map.id+'/'+id);covered.add(String(id));}walk(node.id,new Set());
  }
  fail(covered.size===types.size,'complete native coverage '+map.id);
  const fingerprints=new Set();for(const [i,q]of map.questions.entries()){fail(q.nodeId===map.nodes[i%6].id,'one question per node in each form '+q.id);fail(q.id&&q.prompt&&q.hint&&q.explanation&&['number','choice'].includes(q.input)&&C.correct(q,String(q.answer)),'valid question '+q.id);const fingerprint=JSON.stringify([q.prompt,q.visual||null,q.choices?[...q.choices].sort():null]);fail(!fingerprints.has(fingerprint),'fresh condition '+q.id);fingerprints.add(fingerprint);}
  fail(new Set(map.questions.map(q=>q.id)).size===18,'distinct question IDs '+map.id);
  map.group=map.id.startsWith('practical-')?'practical':[15,16,17,18,19,23,24,25].includes(map.taskNumbers[0])?'geometry':'algebra';
  groups.find(g=>g.id===map.group).routes.push(map);
 }
 return{routes,maps:routes,byId,groups,foundationById,foundations};
});
